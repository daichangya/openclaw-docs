---
read_when:
    - Ajan varsayılanlarını ayarlama (modeller, düşünme, çalışma alanı, Heartbeat, medya, Skills)
    - Çoklu ajan yönlendirmesini ve bağlamalarını yapılandırma
    - Oturum, mesaj teslimi ve talk-mode davranışını ayarlama
summary: Ajan varsayılanları, çoklu ajan yönlendirmesi, oturum, mesajlar ve talk yapılandırması
title: Yapılandırma — ajanlar
x-i18n:
    generated_at: "2026-04-25T13:46:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1601dc5720f6a82fb947667ed9c0b4612c5187572796db5deb7a28dd13be3528
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*` ve `talk.*` altındaki ajan kapsamlı yapılandırma anahtarları.
Kanallar, araçlar, gateway çalışma zamanı ve diğer üst düzey anahtarlar için bkz. [Configuration reference](/tr/gateway/configuration-reference).

## Ajan varsayılanları

### `agents.defaults.workspace`

Varsayılan: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Sistem istemindeki Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlanmazsa OpenClaw, çalışma alanından yukarı doğru yürüyerek bunu otomatik algılar.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills`
ayarlamayan ajanlar için isteğe bağlı varsayılan skill izin listesi.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
      { id: "locked-down", skills: [] }, // hiç skill yok
    ],
  },
}
```

- Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` değerini atlayın.
- Varsayılanları devralmak için `agents.list[].skills` değerini atlayın.
- Hiç skill olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o ajan için nihai kümedir;
  varsayılanlarla birleşmez.

### `agents.defaults.skipBootstrap`

Çalışma alanı bootstrap dosyalarının (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) otomatik oluşturulmasını devre dışı bırakır.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Çalışma alanı bootstrap dosyalarının ne zaman sistem istemine enjekte edileceğini denetler. Varsayılan: `"always"`.

- `"continuation-skip"`: güvenli devam dönüşleri (tamamlanmış bir asistan yanıtından sonra), çalışma alanı bootstrap yeniden enjeksiyonunu atlar ve istem boyutunu azaltır. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler yine bağlamı yeniden oluşturur.
- `"never"`: her dönüşte çalışma alanı bootstrap ve bağlam dosyası enjeksiyonunu devre dışı bırakır. Bunu yalnızca istem yaşam döngüsünü tamamen sahiplenen ajanlar için kullanın (özel bağlam motorları, kendi bağlamını oluşturan yerel çalışma zamanları veya özelleşmiş bootstrap'siz iş akışları). Heartbeat ve Compaction kurtarma dönüşleri de enjeksiyonu atlar.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Kırpma öncesinde çalışma alanı bootstrap dosyası başına en fazla karakter. Varsayılan: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı bootstrap dosyalarına enjekte edilen toplam en fazla karakter. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Bootstrap bağlamı kırpıldığında ajana görünen uyarı metnini denetler.
Varsayılan: `"once"`.

- `"off"`: sistem istemine hiçbir zaman uyarı metni enjekte etmez.
- `"once"`: uyarıyı her benzersiz kırpma imzası için bir kez enjekte eder (önerilir).
- `"always"`: kırpma olduğunda her çalıştırmada uyarıyı enjekte eder.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw'da birden fazla yüksek hacimli istem/bağlam bütçesi vardır ve
bunlar kasıtlı olarak tek bir genel düğme üzerinden akmak yerine alt sistemlere göre ayrılmıştır.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal çalışma alanı bootstrap enjeksiyonu.
- `agents.defaults.startupContext.*`:
  son günlük
  `memory/*.md` dosyaları dahil tek seferlik `/new` ve `/reset` başlangıç
  başlangıç bölümü.
- `skills.limits.*`:
  sistem istemine enjekte edilen kompakt Skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlı çalışma zamanı alıntıları ve enjekte edilmiş çalışma zamanı sahipli bloklar.
- `memory.qmd.limits.*`:
  dizinlenmiş memory-search parçacığı ve enjeksiyon boyutlandırması.

Yalnızca bir ajanın farklı bir
bütçeye ihtiyacı olduğunda eşleşen ajan başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Çıplak `/new` ve `/reset`
çalıştırmalarında enjekte edilen ilk dönüş başlangıç başlangıç bölümünü denetler.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Sınırlı çalışma zamanı bağlam yüzeyleri için paylaşılan varsayılanlar.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: kırpma meta verileri ve devam bildirimi eklenmeden önce varsayılan `memory_get` alıntı üst sınırı.
- `memoryGetDefaultLines`: `lines`
  atlandığında varsayılan `memory_get` satır penceresi.
- `toolResultMaxChars`: kalıcı sonuçlar ve
  taşma kurtarma için kullanılan canlı araç sonucu üst sınırı.
- `postCompactionMaxChars`: Compaction sonrası
  yenileme enjeksiyonu sırasında kullanılan AGENTS.md alıntı üst sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` düğmeleri için ajan başına geçersiz kılma. Atlanan alanlar
`agents.defaults.contextLimits` değerinden devralınır.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Sistem istemine enjekte edilen kompakt Skills listesi için genel üst sınır. Bu,
isteğe bağlı olarak `SKILL.md` dosyalarının okunmasını etkilemez.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills istem bütçesi için ajan başına geçersiz kılma.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Sağlayıcı çağrılarından önce transcript/araç görsel bloklarında görselin en uzun kenarı için en fazla piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision token kullanımını ve istek yük boyutunu azaltır.
Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Sistem istemi bağlamı için saat dilimi (mesaj zaman damgaları için değil). Host saat dilimine geri döner.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Sistem istemindeki saat biçimi. Varsayılan: `auto` (OS tercihi).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // genel varsayılan sağlayıcı parametreleri
      embeddedHarness: {
        runtime: "pi", // pi | auto | kayıtlı harness kimliği, ör. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Dize biçimi yalnızca birincil modeli ayarlar.
  - Nesne biçimi, birincil modeli ve sıralı failover modellerini ayarlar.
- `imageModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - `image` araç yolu tarafından vision-model yapılandırması olarak kullanılır.
  - Ayrıca, seçilen/varsayılan model görsel girdisini kabul edemediğinde fallback yönlendirmesi olarak da kullanılır.
- `imageGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görsel üretim yeteneği ve gelecekte görsel üreten her araç/plugin yüzeyi tarafından kullanılır.
  - Tipik değerler: yerel Gemini görsel üretimi için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev` veya OpenAI Images için `openai/gpt-image-2`.
  - Bir sağlayıcı/modeli doğrudan seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/gpt-image-2` için `OPENAI_API_KEY` veya OpenAI Codex OAuth, `fal/*` için `FAL_KEY`).
  - Atlanırsa, `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra sağlayıcı kimliği sırasına göre kayıtlı kalan görsel üretim sağlayıcılarını dener.
- `musicGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik üretim yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.6`.
  - Atlanırsa, `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra sağlayıcı kimliği sırasına göre kayıtlı kalan müzik üretim sağlayıcılarını dener.
  - Bir sağlayıcı/modeli doğrudan seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video üretim yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa, `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, sonra sağlayıcı kimliği sırasına göre kayıtlı kalan video üretim sağlayıcılarını dener.
  - Bir sağlayıcı/modeli doğrudan seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Paketlenmiş Qwen video üretim sağlayıcısı en fazla 1 çıktı videosu, 1 girdi görseli, 4 girdi videosu, 10 saniye süre ve sağlayıcı düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: bir dize (`"provider/model"`) veya bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Model yönlendirmesi için `pdf` aracı tarafından kullanılır.
  - Atlanırsa, PDF aracı önce `imageModel` değerine, ardından çözümlenen oturum/varsayılan modele geri döner.
- `pdfMaxBytesMb`: çağrı anında `maxBytesMb` geçirilmediğinde `pdf` aracı için varsayılan PDF boyut sınırı.
- `pdfMaxPages`: `pdf` aracında çıkarım fallback modunun dikkate aldığı varsayılan en fazla sayfa sayısı.
- `verboseDefault`: ajanlar için varsayılan ayrıntı düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `elevatedDefault`: ajanlar için varsayılan yükseltilmiş çıktı düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: `provider/model` biçimi (ör. API anahtarı erişimi için `openai/gpt-5.4` veya Codex OAuth için `openai-codex/gpt-5.5`). Sağlayıcıyı atlarsanız, OpenClaw önce bir alias dener, sonra o tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak sonra yapılandırılmış varsayılan sağlayıcıya geri döner (kullanımdan kaldırılan uyumluluk davranışı, bu yüzden açık `provider/model` tercih edin). Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw bayat bir kaldırılmış sağlayıcı varsayılanını göstermeye çalışmak yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models`: `/model` için yapılandırılmış model kataloğu ve izin listesi. Her girdi `alias` (kısayol) ve `params` (sağlayıcıya özgü; örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `extra_body`/`extraBody`) içerebilir.
  - Güvenli düzenlemeler: giriş eklemek için `openclaw config set agents.defaults.models '<json>' --strict-json --merge` kullanın. `config set`, `--replace` geçirmediğiniz sürece mevcut izin listesi girdilerini kaldıracak değiştirmeleri reddeder.
  - Sağlayıcı kapsamlı configure/onboarding akışları seçili sağlayıcı modellerini bu haritaya birleştirir ve zaten yapılandırılmış ilgisiz sağlayıcıları korur.
  - Doğrudan OpenAI Responses modelleri için sunucu tarafı Compaction otomatik olarak etkinleştirilir. `context_management` enjeksiyonunu durdurmak için `params.responsesServerCompaction: false`, ya da eşiği geçersiz kılmak için `params.responsesCompactThreshold` kullanın. Bkz. [OpenAI server-side compaction](/tr/providers/openai#server-side-compaction-responses-api).
- `params`: tüm modellere uygulanan genel varsayılan sağlayıcı parametreleri. `agents.defaults.params` altında ayarlanır (ör. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (config): `agents.defaults.params` (genel taban), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır, sonra `agents.list[].params` (eşleşen ajan kimliği) anahtar bazında geçersiz kılar. Ayrıntılar için bkz. [Prompt Caching](/tr/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: OpenAI uyumlu proxy'ler için `api: "openai-completions"` istek gövdelerine birleştirilen gelişmiş geçişli JSON. Üretilmiş istek anahtarlarıyla çakışırsa ek gövde kazanır; yerel olmayan completions rotaları sonrasında yine de yalnızca OpenAI'ye özgü `store` alanını çıkarır.
- `embeddedHarness`: varsayılan düşük düzey gömülü ajan çalışma zamanı ilkesi. Atlanan runtime varsayılan olarak OpenClaw Pi kullanır. Yerleşik PI harness'i zorlamak için `runtime: "pi"`, kayıtlı plugin harness'lerin desteklenen modelleri sahiplenmesine izin vermek için `runtime: "auto"` veya `runtime: "codex"` gibi kayıtlı bir harness kimliği kullanın. Otomatik PI fallback'i devre dışı bırakmak için `fallback: "none"` ayarlayın. `codex` gibi açık plugin runtime'ları, aynı geçersiz kılma kapsamında `fallback: "pi"` ayarlamadığınız sürece varsayılan olarak fail closed davranır. Model referanslarını kanonik `provider/model` biçiminde tutun; Codex, Claude CLI, Gemini CLI ve diğer yürütme backend'lerini eski runtime sağlayıcı önekleri yerine runtime config üzerinden seçin. Bunun sağlayıcı/model seçiminden nasıl farklılaştığı için bkz. [Agent runtimes](/tr/concepts/agent-runtimes).
- Bu alanları değiştiren config yazıcıları (örneğin `/models set`, `/models set-image` ve fallback ekleme/kaldırma komutları), kanonik nesne biçimini kaydeder ve mümkün olduğunda mevcut fallback listelerini korur.
- `maxConcurrent`: oturumlar genelinde en fazla paralel ajan çalıştırması (her oturum yine serileştirilir). Varsayılan: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness`, gömülü ajan dönüşlerini hangi düşük düzey yürütücünün çalıştırdığını denetler.
Çoğu dağıtım varsayılan OpenClaw Pi çalışma zamanını korumalıdır.
Bunu, paketlenmiş
Codex uygulama sunucusu harness'i gibi güvenilir bir plugin yerel harness sağladığında kullanın. Zihinsel model için bkz.
[Agent runtimes](/tr/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` veya kayıtlı bir plugin harness kimliği. Paketlenmiş Codex plugin'i `codex` kaydeder.
- `fallback`: `"pi"` veya `"none"`. `runtime: "auto"` durumunda, atlanan fallback varsayılan olarak `"pi"` olur; böylece eski config'ler hiçbir plugin harness bir çalıştırmayı sahiplenmediğinde PI kullanmaya devam edebilir. `runtime: "codex"` gibi açık plugin runtime modunda, atlanan fallback varsayılan olarak `"none"` olur; böylece eksik bir harness sessizce PI kullanmak yerine hata verir. Runtime geçersiz kılmaları fallback'i daha geniş bir kapsamdan devralmaz; bu uyumluluk fallback'ini gerçekten istiyorsanız açık runtime ile birlikte `fallback: "pi"` ayarlayın. Seçili plugin harness hataları her zaman doğrudan yüzeye çıkar.
- Ortam geçersiz kılmaları: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>`, `runtime` değerini geçersiz kılar; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none`, bu süreç için fallback'i geçersiz kılar.
- Yalnızca Codex dağıtımları için `model: "openai/gpt-5.5"` ve `embeddedHarness.runtime: "codex"` ayarlayın. Okunabilirlik için ayrıca açıkça `embeddedHarness.fallback: "none"` da ayarlayabilirsiniz; açık plugin runtime'ları için zaten varsayılandır.
- Harness seçimi, ilk gömülü çalıştırmadan sonra oturum kimliği başına sabitlenir. Config/ortam değişiklikleri mevcut bir transcript'e değil, yeni veya sıfırlanmış oturumlara uygulanır. Transcript geçmişi olup da kayıtlı pin'i olmayan eski oturumlar PI'ye sabitlenmiş kabul edilir. `/status`, etkin çalışma zamanını raporlar; örneğin `Runtime: OpenClaw Pi Default` veya `Runtime: OpenAI Codex`.
- Bu yalnızca gömülü sohbet harness'ini denetler. Medya üretimi, vision, PDF, müzik, video ve TTS yine kendi sağlayıcı/model ayarlarını kullanır.

**Yerleşik alias kısayolları** (yalnızca model `agents.defaults.models` içinde olduğunda uygulanır):

| Alias               | Model                                              |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` veya yapılandırılmış Codex OAuth GPT-5.5 |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

Yapılandırdığınız alias'lar her zaman varsayılanların önüne geçer.

Z.AI GLM-4.x modelleri, `--thinking off` ayarlamadığınız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamadığınız sürece otomatik olarak thinking modunu etkinleştirir.
Z.AI modelleri, araç çağrısı akışı için varsayılan olarak `tool_stream` etkinleştirir. Devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
Anthropic Claude 4.6 modelleri, açık bir thinking düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.

### `agents.defaults.cliBackends`

Yalnızca metin fallback çalıştırmaları için isteğe bağlı CLI backend'leri (araç çağrısı yok). API sağlayıcıları başarısız olduğunda yedek olarak kullanışlıdır.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Veya CLI bir istem dosyası bayrağını kabul ediyorsa systemPromptFileArg kullanın.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backend'leri önce metindir; araçlar her zaman devre dışıdır.
- `sessionArg` ayarlıysa oturumlar desteklenir.
- `imageArg` dosya yollarını kabul ettiğinde görsel geçişi desteklenir.

### `agents.defaults.systemPromptOverride`

OpenClaw tarafından birleştirilen sistem isteminin tamamını sabit bir dizeyle değiştirin. Varsayılan düzeyde (`agents.defaults.systemPromptOverride`) veya ajan başına (`agents.list[].systemPromptOverride`) ayarlayın. Ajan başına değerler önceliklidir; boş veya yalnızca boşluk içeren değerler yok sayılır. Denetimli istem deneyleri için kullanışlıdır.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Model ailesine göre uygulanan sağlayıcıdan bağımsız istem katmanları. GPT-5 ailesi model kimlikleri, sağlayıcılar arasında paylaşılan davranış sözleşmesini alır; `personality` yalnızca dostane etkileşim tarzı katmanını denetler.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (varsayılan) ve `"on"` dostane etkileşim tarzı katmanını etkinleştirir.
- `"off"` yalnızca dostane katmanı devre dışı bırakır; etiketli GPT-5 davranış sözleşmesi etkin kalır.
- Eski `plugins.entries.openai.config.personality`, bu paylaşılan ayar tanımlı değilse hâlâ okunur.

### `agents.defaults.heartbeat`

Periyodik Heartbeat çalıştırmaları.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m devre dışı bırakır
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // varsayılan: true; false, sistem isteminden Heartbeat bölümünü çıkarır
        lightContext: false, // varsayılan: false; true, çalışma alanı bootstrap dosyalarından yalnızca HEARTBEAT.md dosyasını tutar
        isolatedSession: false, // varsayılan: false; true, her Heartbeat'i yeni bir oturumda çalıştırır (konuşma geçmişi yok)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (varsayılan) | block
        target: "none", // varsayılan: none | seçenekler: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: süre dizesi (ms/s/m/h). Varsayılan: `30m` (API anahtarı kimlik doğrulaması) veya `1h` (OAuth kimlik doğrulaması). Devre dışı bırakmak için `0m` ayarlayın.
- `includeSystemPromptSection`: false olduğunda, Heartbeat bölümünü sistem isteminden çıkarır ve `HEARTBEAT.md` dosyasının bootstrap bağlamına enjeksiyonunu atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda, Heartbeat çalıştırmaları sırasında araç hata uyarısı yüklerini bastırır.
- `timeoutSeconds`: iptal edilmeden önce bir Heartbeat ajan dönüşü için izin verilen en fazla süre, saniye cinsinden. Ayarlanmazsa `agents.defaults.timeoutSeconds` kullanılır.
- `directPolicy`: doğrudan/DM teslim politikası. `allow` (varsayılan) doğrudan hedef teslimine izin verir. `block` doğrudan hedef teslimini bastırır ve `reason=dm-blocked` üretir.
- `lightContext`: true olduğunda, Heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda, her Heartbeat önceki konuşma geçmişi olmayan yeni bir oturumda çalışır. Cron `sessionTarget: "isolated"` ile aynı yalıtım deseni. Heartbeat başına token maliyetini yaklaşık ~100K'den ~2-5K tokene düşürür.
- Ajan başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir ajan `heartbeat` tanımlarsa, Heartbeat yalnızca **o ajanlar** için çalışır.
- Heartbeat'ler tam ajan dönüşleri çalıştırır — daha kısa aralıklar daha fazla token tüketir.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // kayıtlı bir Compaction sağlayıcı plugin kimliği (isteğe bağlı)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom olduğunda kullanılır
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] yeniden enjeksiyonu devre dışı bırakır
        model: "openrouter/anthropic/claude-sonnet-4-6", // yalnızca Compaction için isteğe bağlı model geçersiz kılması
        notifyUser: true, // Compaction başladığında ve tamamlandığında kısa bildirimler gönderir (varsayılan: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` veya `safeguard` (uzun geçmişler için parçalara bölünmüş özetleme). Bkz. [Compaction](/tr/concepts/compaction).
- `provider`: kayıtlı bir Compaction sağlayıcı plugin kimliği. Ayarlandığında, yerleşik LLM özetleme yerine sağlayıcının `summarize()` yöntemi çağrılır. Hata durumunda yerleşiğe geri döner. Bir sağlayıcı ayarlamak `mode: "safeguard"` kullanımını zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw'un iptal etmeden önce tek bir Compaction işlemi için izin verdiği en fazla saniye. Varsayılan: `900`.
- `keepRecentTokens`: en son transcript kuyruğunu kelimesi kelimesine tutmak için Pi kesme noktası bütçesi. Manuel `/compact`, açıkça ayarlandığında bunu dikkate alır; aksi halde manuel Compaction sert bir kontrol noktasıdır.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, Compaction özetlemesi sırasında yerleşik opak tanımlayıcı koruma rehberliğini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `qualityGuard`: safeguard özetleri için bozuk çıktı durumunda yeniden deneme denetimleri. Safeguard modunda varsayılan olarak etkindir; denetimi atlamak için `enabled: false` ayarlayın.
- `postCompactionSections`: Compaction sonrasında yeniden enjekte edilecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Varsayılan olarak `["Session Startup", "Red Lines"]`; yeniden enjeksiyonu devre dışı bırakmak için `[]` ayarlayın. Ayarlanmadığında veya açıkça bu varsayılan çift ayarlandığında, eski `Every Session`/`Safety` başlıkları da eskiye uyumluluk geri dönüşü olarak kabul edilir.
- `model`: yalnızca Compaction özetlemesi için isteğe bağlı `provider/model-id` geçersiz kılması. Ana oturumun bir modeli koruyup Compaction özetlerinin başka bir modelde çalışmasını istediğinizde bunu kullanın; ayarlanmazsa Compaction, oturumun birincil modelini kullanır.
- `notifyUser`: `true` olduğunda, Compaction başladığında ve tamamlandığında kullanıcıya kısa bildirimler gönderir (örneğin, "Compacting context..." ve "Compaction complete"). Varsayılan olarak devre dışıdır; böylece Compaction sessiz kalır.
- `memoryFlush`: otomatik Compaction öncesinde kalıcı anıları depolamak için sessiz ajan dönüşü. Çalışma alanı salt okunursa atlanır.

### `agents.defaults.contextPruning`

LLM'ye göndermeden önce bellek içi bağlamdan **eski araç sonuçlarını** budar. Diskteki oturum geçmişini **değiştirmez**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // süre (ms/s/m/h), varsayılan birim: dakika
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl modu davranışı">

- `mode: "cache-ttl"` budama geçişlerini etkinleştirir.
- `ttl`, budamanın ne sıklıkla yeniden çalışabileceğini denetler (son önbellek dokunuşundan sonra).
- Budama önce aşırı büyük araç sonuçlarını yumuşak şekilde kırpar, gerekirse daha eski araç sonuçlarını sert şekilde temizler.

**Yumuşak kırpma**, başı + sonu korur ve ortaya `...` ekler.

**Sert temizleme**, tüm araç sonucunu yer tutucuyla değiştirir.

Notlar:

- Görsel blokları asla kırpılmaz/temizlenmez.
- Oranlar tam token sayıları değil, karakter tabanlıdır (yaklaşık).
- `keepLastAssistants` kadar asistan mesajı yoksa budama atlanır.

</Accordion>

Davranış ayrıntıları için bkz. [Session Pruning](/tr/concepts/session-pruning).

### Blok akışı

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (minMs/maxMs kullanın)
    },
  },
}
```

- Telegram dışındaki kanallar blok yanıtlarını etkinleştirmek için açık `*.blockStreaming: true` gerektirir.
- Kanal geçersiz kılmaları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına varyantlar). Signal/Slack/Discord/Google Chat varsayılanı `minChars: 1500`.
- `humanDelay`: blok yanıtları arasındaki rastgele duraklama. `natural` = 800–2500 ms. Ajan başına geçersiz kılma: `agents.list[].humanDelay`.

Davranış + parçalama ayrıntıları için bkz. [Streaming](/tr/concepts/streaming).

### Yazıyor göstergeleri

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Varsayılanlar: doğrudan sohbetler/mention'lar için `instant`, mention içermeyen grup sohbetleri için `message`.
- Oturum başına geçersiz kılmalar: `session.typingMode`, `session.typingIntervalSeconds`.

Bkz. [Typing Indicators](/tr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Gömülü ajan için isteğe bağlı sandboxing. Tam kılavuz için bkz. [Sandboxing](/tr/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRef / satır içi içerikler de desteklenir:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox ayrıntıları">

**Backend:**

- `docker`: yerel Docker çalışma zamanı (varsayılan)
- `ssh`: genel SSH destekli uzak çalışma zamanı
- `openshell`: OpenShell çalışma zamanı

`backend: "openshell"` seçildiğinde, çalışma zamanına özgü ayarlar
`plugins.entries.openshell.config` altına taşınır.

**SSH backend yapılandırması:**

- `target`: `user@host[:port]` biçiminde SSH hedefi
- `command`: SSH istemci komutu (varsayılan: `ssh`)
- `workspaceRoot`: kapsam başına çalışma alanları için kullanılan mutlak uzak kök
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH'e geçirilen mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw'un çalışma zamanında geçici dosyalara dönüştürdüğü satır içi içerikler veya SecretRef'ler
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host-key ilkesi düğmeleri

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` yerine geçer
- `certificateData`, `certificateFile` yerine geçer
- `knownHostsData`, `knownHostsFile` yerine geçer
- SecretRef destekli `*Data` değerleri, sandbox oturumu başlamadan önce etkin gizli anahtar çalışma zamanı anlık görüntüsünden çözümlenir

**SSH backend davranışı:**

- oluşturma veya yeniden oluşturma sonrasında uzak çalışma alanını bir kez tohumlar
- ardından uzak SSH çalışma alanını kanonik tutar
- `exec`, dosya araçlarını ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri host'a otomatik olarak senkronize etmez
- sandbox tarayıcı container'larını desteklemez

**Çalışma alanı erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına sandbox çalışma alanı
- `ro`: `/workspace` altında sandbox çalışma alanı, `/agent` altında salt okunur bağlanmış ajan çalışma alanı
- `rw`: `/workspace` altında okuma/yazma bağlanmış ajan çalışma alanı

**Kapsam:**

- `session`: oturum başına container + çalışma alanı
- `agent`: ajan başına bir container + çalışma alanı (varsayılan)
- `shared`: paylaşılan container ve çalışma alanı (oturumlar arası yalıtım yok)

**OpenShell plugin yapılandırması:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // isteğe bağlı
          gatewayEndpoint: "https://lab.example", // isteğe bağlı
          policy: "strict", // isteğe bağlı OpenShell ilke kimliği
          providers: ["openai"], // isteğe bağlı
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell modu:**

- `mirror`: `exec` öncesinde yerelden uzağa tohumlar, `exec` sonrasında geri senkronize eder; yerel çalışma alanı kanonik kalır
- `remote`: sandbox oluşturulduğunda uzağı bir kez tohumlar, sonra uzak çalışma alanını kanonik tutar

`remote` modunda, OpenClaw dışında yapılan host-yerel düzenlemeleri tohumlama adımından sonra otomatik olarak sandbox'a senkronize edilmez.
Taşıma, OpenShell sandbox'ına SSH'dir, ancak sandbox yaşam döngüsüne ve isteğe bağlı ayna senkronizasyonuna plugin sahiptir.

**`setupCommand`**, container oluşturulduktan sonra bir kez çalışır (`sh -lc` ile). Ağ çıkışı, yazılabilir kök ve root kullanıcı gerektirir.

**Container'lar varsayılan olarak `network: "none"` kullanır** — ajanın dış erişime ihtiyacı varsa `"bridge"` (veya özel bir bridge ağı) olarak ayarlayın.
`"host"` engellenir. `"container:<id>"` varsayılan olarak engellenir; yalnızca
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` ayarını açıkça yaparsanız izin verilir (acil durum seçeneği).

**Gelen ekler**, etkin çalışma alanında `media/inbound/*` içine hazırlanır.

**`docker.binds`**, ek host dizinlerini bağlar; genel ve ajan başına bağlamalar birleştirilir.

**Sandbox tarayıcısı** (`sandbox.browser.enabled`): bir container içinde Chromium + CDP. noVNC URL'si sistem istemine enjekte edilir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulamasını kullanır ve OpenClaw paylaşılan URL'de parolayı açığa çıkarmak yerine kısa ömürlü bir belirteç URL'si üretir.

- `allowHostControl: false` (varsayılan), sandbox oturumlarının host tarayıcıyı hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` kullanır (özel bridge ağı). Genel bridge bağlantısını açıkça istediğinizde yalnızca `bridge` kullanın.
- `cdpSourceRange`, CDP girişini container sınırında isteğe bağlı olarak bir CIDR aralığıyla kısıtlar (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek host dizinlerini yalnızca sandbox tarayıcı container'ına bağlar. Ayarlandığında (`[]` dahil), tarayıcı container'ı için `docker.binds` yerine geçer.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlıdır ve container host'ları için ayarlanmıştır:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT değerinden türetilir>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (varsayılan olarak etkin)
  - `--disable-3d-apis`, `--disable-software-rasterizer` ve `--disable-gpu`
    varsayılan olarak etkindir ve WebGL/3D kullanımı gerektiriyorsa
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ile devre dışı bırakılabilir.
  - İş akışınız onlara bağlıysa uzantıları yeniden etkinleştirmek için
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` kullanın.
  - `--renderer-process-limit=2`,
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirilebilir; Chromium'un
    varsayılan süreç sınırını kullanmak için `0` ayarlayın.
  - `noSandbox` etkin olduğunda ayrıca `--no-sandbox`.
  - Varsayılanlar container imajı taban çizgisidir; container varsayılanlarını değiştirmek için özel
    bir giriş noktasıyla özel bir tarayıcı imajı kullanın.

</Accordion>

Tarayıcı sandboxing ve `sandbox.docker.binds` yalnızca Docker içindir.

İmajları derleyin:

```bash
scripts/sandbox-setup.sh           # ana sandbox imajı
scripts/sandbox-browser-setup.sh   # isteğe bağlı tarayıcı imajı
```

### `agents.list` (ajan başına geçersiz kılmalar)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // veya { primary, fallbacks }
        thinkingDefault: "high", // ajan başına thinking düzeyi geçersiz kılması
        reasoningDefault: "on", // ajan başına reasoning görünürlüğü geçersiz kılması
        fastModeDefault: false, // ajan başına fast mode geçersiz kılması
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // eşleşen defaults.models params değerlerini anahtar bazında geçersiz kılar
        skills: ["docs-search"], // ayarlandığında agents.defaults.skills yerine geçer
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: kararlı ajan kimliği (gerekli).
- `default`: birden fazlası ayarlanırsa ilki kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa ilk liste girdisi varsayılandır.
- `model`: dize biçimi yalnızca `primary` değerini geçersiz kılar; nesne biçimi `{ primary, fallbacks }` ikisini de geçersiz kılar (`[]` genel fallback'leri devre dışı bırakır). Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlamadığınız sürece varsayılan fallback'leri yine devralır.
- `params`: `agents.defaults.models` içindeki seçili model girdisinin üzerine birleştirilen ajan başına akış parametreleri. Tüm model kataloğunu yinelemeden `cacheRetention`, `temperature` veya `maxTokens` gibi ajana özgü geçersiz kılmalar için bunu kullanın.
- `skills`: isteğe bağlı ajan başına skill izin listesi. Atlanırsa ajan, ayarlı olduğunda `agents.defaults.skills` değerini devralır; açık bir liste varsayılanlarla birleşmek yerine onların yerini alır ve `[]` hiç skill olmadığı anlamına gelir.
- `thinkingDefault`: isteğe bağlı ajan başına varsayılan thinking düzeyi (`off | minimal | low | medium | high | xhigh | adaptive | max`). Mesaj başına veya oturum başına geçersiz kılma ayarlı değilse bu ajan için `agents.defaults.thinkingDefault` değerini geçersiz kılar. Seçilen sağlayıcı/model profili hangi değerlerin geçerli olduğunu denetler; Google Gemini için `adaptive`, sağlayıcı sahipli dinamik thinking'i korur (Gemini 3/3.1'de `thinkingLevel` atlanır, Gemini 2.5'te `thinkingBudget: -1` kullanılır).
- `reasoningDefault`: isteğe bağlı ajan başına varsayılan reasoning görünürlüğü (`on | off | stream`). Mesaj başına veya oturum başına reasoning geçersiz kılması ayarlanmadığında uygulanır.
- `fastModeDefault`: isteğe bağlı ajan başına varsayılan fast mode değeri (`true | false`). Mesaj başına veya oturum başına fast-mode geçersiz kılması ayarlanmadığında uygulanır.
- `embeddedHarness`: isteğe bağlı ajan başına düşük düzey harness ilkesi geçersiz kılması. Bir ajanı yalnızca Codex yaparken diğer ajanları `auto` modunda varsayılan PI fallback ile tutmak için `{ runtime: "codex" }` kullanın.
- `runtime`: isteğe bağlı ajan başına çalışma zamanı tanımlayıcısı. Ajan varsayılan olarak ACP harness oturumlarını kullanacaksa `runtime.acp` varsayılanları (`agent`, `backend`, `mode`, `cwd`) ile `type: "acp"` kullanın.
- `identity.avatar`: çalışma alanına göre göreli yol, `http(s)` URL veya `data:` URI.
- `identity`, varsayılanları türetir: `emoji` içinden `ackReaction`, `name`/`emoji` içinden `mentionPatterns`.
- `subagents.allowAgents`: `sessions_spawn` için ajan kimliği izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı ajan).
- Sandbox devralma koruması: isteyen oturum sandbox içindeyse, `sessions_spawn`, sandbox olmadan çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda, `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar; varsayılan: false).

---

## Çoklu ajan yönlendirmesi

Bir Gateway içinde birden fazla yalıtılmış ajan çalıştırın. Bkz. [Multi-Agent](/tr/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Bağlama eşleşme alanları

- `type` (isteğe bağlı): normal yönlendirme için `route` (type eksikse varsayılan route olur), kalıcı ACP konuşma bağlamaları için `acp`.
- `match.channel` (gerekli)
- `match.accountId` (isteğe bağlı; `*` = herhangi bir hesap; atlanırsa varsayılan hesap)
- `match.peer` (isteğe bağlı; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (isteğe bağlı; kanala özgü)
- `acp` (isteğe bağlı; yalnızca `type: "acp"` için): `{ mode, label, cwd, backend }`

**Deterministik eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam eşleşme, peer/guild/team yok)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan ajan

Her katman içinde ilk eşleşen `bindings` girdisi kazanır.

`type: "acp"` girdileri için OpenClaw, tam konuşma kimliğine göre çözümler (`match.channel` + hesap + `match.peer.id`) ve yukarıdaki rota bağlama katman sırasını kullanmaz.

### Ajan başına erişim profilleri

<Accordion title="Tam erişim (sandbox yok)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Salt okunur araçlar + çalışma alanı">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Dosya sistemi erişimi yok (yalnızca mesajlaşma)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Öncelik ayrıntıları için bkz. [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools).

---

## Oturum

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // bu token sayısının üzerinde üst-iş parçacığı fork'u atlanır (0 devre dışı bırakır)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // süre veya false
      maxDiskBytes: "500mb", // isteğe bağlı sert bütçe
      highWaterBytes: "400mb", // isteğe bağlı temizleme hedefi
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // saat cinsinden varsayılan hareketsizlik otomatik odak kaldırma (`0` devre dışı bırakır)
      maxAgeHours: 0, // saat cinsinden varsayılan sert maksimum yaş (`0` devre dışı bırakır)
    },
    mainKey: "main", // eski alan (çalışma zamanı her zaman "main" kullanır)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Oturum alanı ayrıntıları">

- **`scope`**: grup sohbeti bağlamları için temel oturum gruplama stratejisi.
  - `per-sender` (varsayılan): her gönderen, kanal bağlamı içinde yalıtılmış bir oturum alır.
  - `global`: kanal bağlamındaki tüm katılımcılar tek bir oturumu paylaşır (yalnızca paylaşılan bağlam istendiğinde kullanın).
- **`dmScope`**: DM'lerin nasıl gruplandığı.
  - `main`: tüm DM'ler ana oturumu paylaşır.
  - `per-peer`: kanallar arasında gönderen kimliğine göre yalıtır.
  - `per-channel-peer`: kanal + gönderen başına yalıtır (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderen başına yalıtır (çoklu hesap için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için kanonik kimlikleri sağlayıcı önekli peer'lara eşleyen harita.
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saatte `atHour` zamanında sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. Her ikisi de yapılandırıldığında önce süresi dolan kazanır.
- **`resetByType`**: tür başına geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için alias olarak kabul edilir.
- **`parentForkMaxTokens`**: çatallanmış bir iş parçacığı oturumu oluşturulurken izin verilen en fazla üst oturum `totalTokens` değeri (varsayılan `100000`).
  - Üst `totalTokens` bu değerin üzerindeyse, OpenClaw üst transcript geçmişini devralmak yerine yeni bir iş parçacığı oturumu başlatır.
  - Bu korumayı devre dışı bırakmak ve her zaman üst fork'a izin vermek için `0` ayarlayın.
- **`mainKey`**: eski alan. Çalışma zamanı ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: ajanlar arası değişimlerde ajanlar arasındaki en fazla geri yanıt dönüşü (tamsayı, aralık: `0`–`5`). `0`, ping-pong zincirlemesini devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` alias'ı ile), `keyPrefix` veya `rawKeyPrefix` ile eşleşir. İlk deny kazanır.
- **`maintenance`**: oturum deposu temizleme + saklama denetimleri.
  - `mode`: `warn` yalnızca uyarı üretir; `enforce` temizliği uygular.
  - `pruneAfter`: bayat girdiler için yaş kesme sınırı (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki en fazla girdi sayısı (varsayılan `500`).
  - `rotateBytes`: `sessions.json` bu boyutu aştığında döndürülür (varsayılan `10mb`).
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript arşivleri için saklama süresi. Varsayılan olarak `pruneAfter`; devre dışı bırakmak için `false` ayarlayın.
  - `maxDiskBytes`: isteğe bağlı oturumlar dizini disk bütçesi. `warn` modunda uyarılar kaydeder; `enforce` modunda önce en eski artifact/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliği sonrasında isteğe bağlı hedef. Varsayılan olarak `maxDiskBytes` değerinin `%80`'i.
- **`threadBindings`**: iş parçacığına bağlı oturum özellikleri için genel varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: saat cinsinden varsayılan hareketsizlik otomatik odak kaldırma (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: saat cinsinden varsayılan sert maksimum yaş (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)

</Accordion>

---

## Mesajlar

```json5
{
  messages: {
    responsePrefix: "🦞", // veya "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 devre dışı bırakır
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Yanıt öneki

Kanal/hesap başına geçersiz kılmalar: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Çözümleme (en özeli kazanır): hesap → kanal → genel. `""` devre dışı bırakır ve zinciri durdurur. `"auto"` değeri `[{identity.name}]` türetir.

**Şablon değişkenleri:**

| Değişken         | Açıklama                 | Örnek                       |
| ---------------- | ------------------------ | --------------------------- |
| `{model}`        | Kısa model adı           | `claude-opus-4-6`           |
| `{modelFull}`    | Tam model tanımlayıcısı  | `anthropic/claude-opus-4-6` |
| `{provider}`     | Sağlayıcı adı            | `anthropic`                 |
| `{thinkingLevel}` | Geçerli thinking düzeyi | `high`, `low`, `off`        |
| `{identity.name}` | Ajan kimlik adı         | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarsızdır. `{think}`, `{thinkingLevel}` için bir alias'tır.

### Ack tepkisi

- Varsayılan olarak etkin ajanın `identity.emoji` değeri kullanılır, aksi halde `"👀"`. Devre dışı bırakmak için `""` ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik geri dönüşü.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord ve Telegram üzerinde yanıttan sonra ack'i kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord ve Telegram üzerinde yaşam döngüsü durum tepkilerini etkinleştirir.
  Slack ve Discord'da ayarlanmazsa, ack tepkileri etkin olduğunda durum tepkileri etkin kalır.
  Telegram'da yaşam döngüsü durum tepkilerini etkinleştirmek için bunu açıkça `true` olarak ayarlayın.

### Gelen debounce

Aynı gönderenden gelen hızlı, yalnızca metin mesajlarını tek bir ajan dönüşünde toplar. Medya/ekler hemen flush edilir. Kontrol komutları debounce'u atlar.

### TTS (metinden konuşmaya)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto`, varsayılan otomatik TTS modunu denetler: `off`, `always`, `inbound` veya `tagged`. `/tts on|off` yerel tercihleri geçersiz kılabilir ve `/tts status` etkin durumu gösterir.
- `summaryModel`, otomatik özet için `agents.defaults.model.primary` değerini geçersiz kılar.
- `modelOverrides` varsayılan olarak etkindir; `modelOverrides.allowProvider` varsayılanı `false` değeridir (isteğe bağlı katılım).
- API anahtarları `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` değerlerine geri düşer.
- Paketlenmiş konuşma sağlayıcıları plugin sahipliğindedir. `plugins.allow` ayarlıysa, kullanmak istediğiniz her TTS sağlayıcı plugin'ini ekleyin; örneğin Edge TTS için `microsoft`. Eski `edge` sağlayıcı kimliği, `microsoft` için alias olarak kabul edilir.
- `providers.openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası config, sonra `OPENAI_TTS_BASE_URL`, sonra `https://api.openai.com/v1` şeklindedir.
- `providers.openai.baseUrl`, OpenAI dışı bir uç noktaya işaret ettiğinde OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak değerlendirir ve model/ses doğrulamasını gevşetir.

---

## Talk

Talk modu için varsayılanlar (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- Birden fazla Talk sağlayıcısı yapılandırıldığında `talk.provider`, `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Talk anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir ve otomatik olarak `talk.providers.<provider>` içine taşınır.
- Ses kimlikleri `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` değerlerine geri düşer.
- `providers.*.apiKey`, düz metin dizelerini veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` geri dönüşü, yalnızca Talk API anahtarı yapılandırılmadığında uygulanır.
- `providers.*.voiceAliases`, Talk yönergelerinin kolay adlar kullanmasına olanak tanır.
- `providers.mlx.modelId`, macOS yerel MLX yardımcısı tarafından kullanılan Hugging Face reposunu seçer. Atlanırsa macOS `mlx-community/Soprano-80M-bf16` kullanır.
- macOS MLX oynatma, mevcutsa paketlenmiş `openclaw-mlx-tts` yardımcısı veya `PATH` üzerindeki bir yürütülebilir üzerinden çalışır; geliştirme için yardımcı yolunu `OPENCLAW_MLX_TTS_BIN` geçersiz kılar.
- `silenceTimeoutMs`, Talk modunun transcript'i göndermeden önce kullanıcı sessizliğinden sonra ne kadar beklediğini denetler. Ayarlanmazsa platform varsayılan duraklama penceresi korunur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`).

---

## İlgili

- [Configuration reference](/tr/gateway/configuration-reference) — diğer tüm yapılandırma anahtarları
- [Configuration](/tr/gateway/configuration) — yaygın görevler ve hızlı kurulum
- [Configuration examples](/tr/gateway/configuration-examples)
