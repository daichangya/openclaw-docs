---
read_when:
    - Skills yapılandırması ekleme veya değiştirme
    - Paketlenmiş izin listesini veya kurulum davranışını ayarlama
summary: Skills yapılandırma şeması ve örnekler
title: Skills Yapılandırması
x-i18n:
    generated_at: "2026-04-21T09:06:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills Yapılandırması

Skills yükleyici/kurucu yapılandırmasının çoğu `~/.openclaw/openclaw.json`
içinde `skills` altında bulunur. Ajana özgü Skills görünürlüğü
`agents.defaults.skills` ve `agents.list[].skills` altında bulunur.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin string
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

Yerleşik görsel üretme/düzenleme için `agents.defaults.imageGenerationModel`
ile birlikte çekirdek `image_generate` aracını tercih edin. `skills.entries.*`,
yalnızca özel veya üçüncü taraf Skills iş akışları içindir.

Belirli bir görsel sağlayıcısı/modeli seçerseniz, o sağlayıcının
auth/API anahtarını da yapılandırın. Tipik örnekler: `google/*` için
`GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/*` için `OPENAI_API_KEY`
ve `fal/*` için `FAL_KEY`.

Örnekler:

- Yerel Nano Banana tarzı kurulum: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Yerel fal kurulumu: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Ajan Skills izin listeleri

Aynı makine/çalışma alanı Skills köklerini kullanmak, ancak
ajan başına farklı görünür Skills kümesi istemek istediğinizde ajan yapılandırmasını kullanın.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // varsayılanları devralır -> github, weather
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
      { id: "locked-down", skills: [] }, // hiç Skills yok
    ],
  },
}
```

Kurallar:

- `agents.defaults.skills`: `agents.list[].skills` alanını
  atlayan ajanlar için paylaşılan temel izin listesi.
- Skills'i varsayılan olarak sınırsız bırakmak için `agents.defaults.skills` alanını atlayın.
- `agents.list[].skills`: o ajan için açık son Skills kümesi; varsayılanlarla
  birleşmez.
- `agents.list[].skills: []`: o ajan için hiç Skills göstermeyin.

## Alanlar

- Yerleşik Skills kökleri her zaman `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` ve `<workspace>/skills` içerir.
- `allowBundled`: yalnızca **paketlenmiş** Skills için isteğe bağlı izin listesi. Ayarlandığında,
  yalnızca listedeki paketlenmiş Skills uygundur (yönetilen, ajan ve çalışma alanı Skills'i etkilenmez).
- `load.extraDirs`: taranacak ek Skills dizinleri (en düşük öncelik).
- `load.watch`: Skills klasörlerini izler ve Skills anlık görüntüsünü yeniler (varsayılan: true).
- `load.watchDebounceMs`: milisaniye cinsinden Skills izleyici olayları için debounce (varsayılan: 250).
- `install.preferBrew`: mevcut olduğunda brew kurucularını tercih eder (varsayılan: true).
- `install.nodeManager`: Node kurucu tercihi (`npm` | `pnpm` | `yarn` | `bun`, varsayılan: npm).
  Bu yalnızca **Skills kurulumlarını** etkiler; Gateway çalışma zamanı yine de Node
  olmalıdır (WhatsApp/Telegram için Bun önerilmez).
  - `openclaw setup --node-manager` daha dardır ve şu anda `npm`,
    `pnpm` veya `bun` kabul eder. Yarn destekli Skills kurulumları istiyorsanız
    `skills.install.nodeManager: "yarn"` değerini elle ayarlayın.
- `entries.<skillKey>`: Skills başına geçersiz kılmalar.
- `agents.defaults.skills`: `agents.list[].skills` alanını
  atlayan ajanlar tarafından devralınan isteğe bağlı varsayılan Skills izin listesi.
- `agents.list[].skills`: isteğe bağlı ajan başına son Skills izin listesi; açık
  listeler devralınan varsayılanlarla birleşmek yerine onların yerini alır.

Skills başına alanlar:

- `enabled`: bir Skills paketlenmiş/kurulu olsa bile devre dışı bırakmak için `false` ayarlayın.
- `env`: ajan çalıştırması için enjekte edilen ortam değişkenleri (yalnızca önceden ayarlanmamışsa).
- `apiKey`: birincil ortam değişkeni tanımlayan Skills için isteğe bağlı kolaylık.
  Düz metin string veya SecretRef nesnesini destekler (`{ source, provider, id }`).

## Notlar

- `entries` altındaki anahtarlar varsayılan olarak Skills adıyla eşlenir. Bir Skills
  `metadata.openclaw.skillKey` tanımlıyorsa bunun yerine o anahtarı kullanın.
- Yükleme önceliği `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş Skills →
  `skills.load.extraDirs`.
- İzleyici etkin olduğunda Skills değişiklikleri bir sonraki ajan dönüşünde alınır.

### Sandbox içindeki Skills + ortam değişkenleri

Bir oturum **sandbox** içindeyse, Skills süreçleri yapılandırılmış
sandbox arka ucunun içinde çalışır. Sandbox, host `process.env` değerini devralmaz.

Şunlardan birini kullanın:

- Docker arka ucu için `agents.defaults.sandbox.docker.env` (veya ajan başına `agents.list[].sandbox.docker.env`)
- ortam değişkenlerini özel sandbox imajınıza veya uzak sandbox ortamınıza gömün

Genel `env` ve `skills.entries.<skill>.env/apiKey`, yalnızca **host** çalıştırmalarına uygulanır.
