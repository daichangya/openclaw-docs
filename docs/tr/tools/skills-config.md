---
read_when:
    - Skills yapılandırmasını ekleme veya değiştirme
    - Paketlenmiş izin listesini veya kurulum davranışını ayarlama
summary: Skills yapılandırma şeması ve örnekler
title: Skills Yapılandırması
x-i18n:
    generated_at: "2026-04-23T09:12:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills Yapılandırması

Skills yükleyici/kurulum yapılandırmasının çoğu
`~/.openclaw/openclaw.json` içindeki `skills` altında yaşar. Aracıya özgü Skills görünürlüğü ise
`agents.defaults.skills` ve `agents.list[].skills` altında yaşar.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway çalışma zamanı hâlâ Node; bun önerilmez)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin dizesi
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Yerleşik görsel üretimi/düzenlemesi için
`agents.defaults.imageGenerationModel` ile çekirdek `image_generate` aracını tercih edin. `skills.entries.*`, yalnızca özel veya
üçüncü taraf skill iş akışları içindir.

Belirli bir görsel sağlayıcısı/modeli seçerseniz, o sağlayıcının
auth/API anahtarını da yapılandırın. Tipik örnekler: `google/*` için
`GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/*` için `OPENAI_API_KEY` ve `fal/*` için `FAL_KEY`.

Örnekler:

- Yerel Nano Banana Pro tarzı kurulum: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Yerel fal kurulumu: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Aracı Skills izin listeleri

Aynı makine/çalışma alanı Skills köklerini kullanmak ama
aracı başına farklı görünür Skills kümesi istiyorsanız aracı yapılandırmasını kullanın.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // varsayılanları devralır -> github, weather
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
      { id: "locked-down", skills: [] }, // hiç Skills yok
    ],
  },
}
```

Kurallar:

- `agents.defaults.skills`: `agents.list[].skills` alanını atlayan
  aracılar için paylaşılan temel izin listesi.
- Varsayılan olarak Skills kısıtlamasız kalsın istiyorsanız `agents.defaults.skills` alanını atlayın.
- `agents.list[].skills`: o aracı için açık son Skills kümesi; varsayılanlarla
  birleştirilmez.
- `agents.list[].skills: []`: o aracıya hiç Skills açığa çıkarma.

## Alanlar

- Yerleşik Skills kökleri her zaman `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` ve `<workspace>/skills` dizinlerini içerir.
- `allowBundled`: yalnızca **paketlenmiş** Skills için isteğe bağlı izin listesi. Ayarlandığında, yalnızca listedeki
  paketlenmiş Skills uygundur (yönetilen, aracı ve çalışma alanı Skills bundan etkilenmez).
- `load.extraDirs`: taranacak ek Skills dizinleri (en düşük öncelik).
- `load.watch`: Skills klasörlerini izle ve Skills anlık görüntüsünü yenile (varsayılan: true).
- `load.watchDebounceMs`: milisaniye cinsinden Skills izleyici olayları için debounce (varsayılan: 250).
- `install.preferBrew`: mevcut olduğunda brew kurucularını tercih et (varsayılan: true).
- `install.nodeManager`: node kurucu tercihi (`npm` | `pnpm` | `yarn` | `bun`, varsayılan: npm).
  Bu yalnızca **Skills kurulumlarını** etkiler; Gateway çalışma zamanı yine de Node olmalıdır
  (WhatsApp/Telegram için Bun önerilmez).
  - `openclaw setup --node-manager` daha dardır ve şu anda `npm`,
    `pnpm` veya `bun` kabul eder. Yarn destekli Skills kurulumları istiyorsanız
    `skills.install.nodeManager: "yarn"` değerini elle ayarlayın.
- `entries.<skillKey>`: Skill başına geçersiz kılmalar.
- `agents.defaults.skills`: `agents.list[].skills` alanını atlayan
  aracılar tarafından devralınan isteğe bağlı varsayılan Skills izin listesi.
- `agents.list[].skills`: isteğe bağlı aracı başına son Skills izin listesi; açık
  listeler devralınan varsayılanlarla birleştirilmek yerine onların yerini alır.

Skill başına alanlar:

- `enabled`: bir Skill paketlenmiş/kurulu olsa bile devre dışı bırakmak için `false` ayarlayın.
- `env`: aracı çalıştırması için enjekte edilen ortam değişkenleri (yalnızca zaten ayarlı değilse).
- `apiKey`: birincil env değişkeni bildiren Skills için isteğe bağlı kolaylık alanı.
  Düz metin dizesini veya SecretRef nesnesini destekler (`{ source, provider, id }`).

## Notlar

- `entries` altındaki anahtarlar varsayılan olarak Skills adına eşlenir. Bir Skill
  `metadata.openclaw.skillKey` tanımlıyorsa bunun yerine o anahtarı kullanın.
- Yükleme önceliği `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş Skills →
  `skills.load.extraDirs` şeklindedir.
- İzleyici etkin olduğunda Skills değişiklikleri bir sonraki aracı turunda alınır.

### Sandbox'lı Skills + env değişkenleri

Bir oturum **sandbox'lı** olduğunda, Skills süreçleri yapılandırılmış
sandbox arka ucu içinde çalışır. Sandbox, ana makine `process.env` değerini devralmaz.

Şunlardan birini kullanın:

- Docker arka ucu için `agents.defaults.sandbox.docker.env` (veya aracı başına `agents.list[].sandbox.docker.env`)
- env'i özel sandbox imajınıza veya uzak sandbox ortamınıza gömün

Genel `env` ve `skills.entries.<skill>.env/apiKey`, yalnızca **ana makine** çalıştırmaları için geçerlidir.
