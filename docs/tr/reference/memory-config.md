---
read_when:
    - Bellek araması sağlayıcılarını veya gömme modellerini yapılandırmak istiyorsunuz.
    - QMD arka ucunu kurmak istiyorsunuz.
    - Hibrit aramayı, MMR’yi veya zamansal azalmayı ayarlamak istiyorsunuz.
    - Çok kipli bellek dizinlemeyi etkinleştirmek istiyorsunuz.
summary: Bellek araması, gömme sağlayıcıları, QMD, hibrit arama ve çok kipli dizinleme için tüm yapılandırma seçenekleri
title: Bellek yapılandırma başvurusu
x-i18n:
    generated_at: "2026-04-10T08:50:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9076bdfad95b87bd70625821bf401326f8eaeb53842b70823881419dbe43cb
    source_path: reference/memory-config.md
    workflow: 15
---

# Bellek yapılandırma başvurusu

Bu sayfa, OpenClaw bellek araması için tüm yapılandırma seçeneklerini listeler. Kavramsal genel bakışlar için bkz.:

- [Belleğe Genel Bakış](/tr/concepts/memory) -- belleğin nasıl çalıştığı
- [Yerleşik Motor](/tr/concepts/memory-builtin) -- varsayılan SQLite arka ucu
- [QMD Motoru](/tr/concepts/memory-qmd) -- local-first sidecar
- [Bellek Araması](/tr/concepts/memory-search) -- arama işlem hattı ve ayarlama
- [Etkin Bellek](/tr/concepts/active-memory) -- etkileşimli oturumlar için bellek alt aracısını etkinleştirme

Aksi belirtilmedikçe tüm bellek araması ayarları, `openclaw.json` içinde `agents.defaults.memorySearch` altında bulunur.

**Etkin bellek** özellik anahtarını ve alt aracı yapılandırmasını arıyorsanız, bunlar `memorySearch` yerine `plugins.entries.active-memory` altında bulunur.

Etkin bellek iki kapılı bir model kullanır:

1. eklentinin etkin olması ve geçerli aracı kimliğini hedeflemesi gerekir
2. isteğin uygun bir etkileşimli kalıcı sohbet oturumu olması gerekir

Etkinleştirme modeli, eklentiye ait yapılandırma, döküm kalıcılığı ve güvenli dağıtım deseni için [Etkin Bellek](/tr/concepts/active-memory) bölümüne bakın.

---

## Sağlayıcı seçimi

| Anahtar   | Tür        | Varsayılan      | Açıklama                                                                                     |
| --------- | ---------- | --------------- | -------------------------------------------------------------------------------------------- |
| `provider` | `string`  | otomatik algılanır | Gömme bağdaştırıcısı kimliği: `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | sağlayıcı varsayılanı | Gömme modeli adı                                                                        |
| `fallback` | `string`  | `"none"`        | Birincil başarısız olduğunda kullanılacak yedek bağdaştırıcı kimliği                         |
| `enabled`  | `boolean` | `true`          | Bellek aramasını etkinleştirir veya devre dışı bırakır                                       |

### Otomatik algılama sırası

`provider` ayarlanmamışsa OpenClaw kullanılabilir ilk seçeneği seçer:

1. `local` -- `memorySearch.local.modelPath` yapılandırılmışsa ve dosya mevcutsa.
2. `openai` -- bir OpenAI anahtarı çözümlenebiliyorsa.
3. `gemini` -- bir Gemini anahtarı çözümlenebiliyorsa.
4. `voyage` -- bir Voyage anahtarı çözümlenebiliyorsa.
5. `mistral` -- bir Mistral anahtarı çözümlenebiliyorsa.
6. `bedrock` -- AWS SDK kimlik bilgisi zinciri çözümleniyorsa (instance role, access keys, profile, SSO, web identity veya shared config).

`ollama` desteklenir ancak otomatik algılanmaz (açıkça ayarlayın).

### API anahtarı çözümleme

Uzak gömmeler bir API anahtarı gerektirir. Bunun yerine Bedrock, AWS SDK varsayılan kimlik bilgisi zincirini kullanır (instance role, SSO, access keys).

| Sağlayıcı | Ortam değişkeni               | Yapılandırma anahtarı            |
| --------- | ----------------------------- | -------------------------------- |
| OpenAI    | `OPENAI_API_KEY`              | `models.providers.openai.apiKey` |
| Gemini    | `GEMINI_API_KEY`              | `models.providers.google.apiKey` |
| Voyage    | `VOYAGE_API_KEY`              | `models.providers.voyage.apiKey` |
| Mistral   | `MISTRAL_API_KEY`             | `models.providers.mistral.apiKey` |
| Bedrock   | AWS kimlik bilgisi zinciri    | API anahtarı gerekmez            |
| Ollama    | `OLLAMA_API_KEY` (yer tutucu) | --                               |

Codex OAuth yalnızca chat/completions işlemlerini kapsar ve gömme isteklerini karşılamaz.

---

## Uzak uç nokta yapılandırması

Özel OpenAI uyumlu uç noktalar veya sağlayıcı varsayılanlarını geçersiz kılmak için:

| Anahtar           | Tür      | Açıklama                                             |
| ----------------- | -------- | ---------------------------------------------------- |
| `remote.baseUrl`  | `string` | Özel API temel URL’si                                |
| `remote.apiKey`   | `string` | API anahtarını geçersiz kılar                        |
| `remote.headers`  | `object` | Ek HTTP üstbilgileri (sağlayıcı varsayılanlarıyla birleştirilir) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Gemini'ye özgü yapılandırma

| Anahtar                | Tür      | Varsayılan             | Açıklama                                   |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Ayrıca `gemini-embedding-2-preview` desteklenir |
| `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072      |

<Warning>
`model` veya `outputDimensionality` değiştirilirse otomatik olarak tam yeniden dizinleme tetiklenir.
</Warning>

---

## Bedrock gömme yapılandırması

Bedrock, AWS SDK varsayılan kimlik bilgisi zincirini kullanır -- API anahtarı gerekmez.
OpenClaw, Bedrock etkin bir instance role ile EC2 üzerinde çalışıyorsa sağlayıcıyı ve modeli ayarlamanız yeterlidir:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| Anahtar                | Tür      | Varsayılan                   | Açıklama                          |
| ---------------------- | -------- | ---------------------------- | --------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Herhangi bir Bedrock gömme modeli kimliği |
| `outputDimensionality` | `number` | model varsayılanı            | Titan V2 için: 256, 512 veya 1024 |

### Desteklenen modeller

Aşağıdaki modeller desteklenir (aile algılama ve boyut varsayılanlarıyla birlikte):

| Model kimliği                              | Sağlayıcı  | Varsayılan Boyut | Yapılandırılabilir Boyutlar |
| ------------------------------------------ | ---------- | ---------------- | --------------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024             | 256, 512, 1024             |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536             | --                          |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536             | --                          |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024             | --                          |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024             | 256, 384, 1024, 3072       |
| `cohere.embed-english-v3`                  | Cohere     | 1024             | --                          |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024             | --                          |
| `cohere.embed-v4:0`                        | Cohere     | 1536             | 256-1536                   |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512              | --                          |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024             | --                          |

Aktarım hızı sonekli varyantlar (ör. `amazon.titan-embed-text-v1:2:8k`) temel modelin yapılandırmasını devralır.

### Kimlik doğrulama

Bedrock kimlik doğrulaması, standart AWS SDK kimlik bilgisi çözümleme sırasını kullanır:

1. Ortam değişkenleri (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. SSO belirteç önbelleği
3. Web kimliği belirteci kimlik bilgileri
4. Paylaşılan kimlik bilgisi ve yapılandırma dosyaları
5. ECS veya EC2 meta veri kimlik bilgileri

Bölge; `AWS_REGION`, `AWS_DEFAULT_REGION`, `amazon-bedrock` sağlayıcısının `baseUrl` değeri üzerinden çözülür veya varsayılan olarak `us-east-1` kullanılır.

### IAM izinleri

IAM rolü veya kullanıcısının şuna ihtiyacı vardır:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

En az ayrıcalık için `InvokeModel` iznini belirli modele daraltın:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Yerel gömme yapılandırması

| Anahtar               | Tür      | Varsayılan             | Açıklama                         |
| --------------------- | -------- | ---------------------- | -------------------------------- |
| `local.modelPath`     | `string` | otomatik indirilir     | GGUF model dosyasının yolu       |
| `local.modelCacheDir` | `string` | node-llama-cpp varsayılanı | İndirilen modeller için önbellek dizini |

Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, otomatik indirilir).
Yerel derleme gerektirir: `pnpm approve-builds` ardından `pnpm rebuild node-llama-cpp`.

---

## Hibrit arama yapılandırması

Tamamı `memorySearch.query.hybrid` altında bulunur:

| Anahtar               | Tür       | Varsayılan | Açıklama                          |
| --------------------- | --------- | ---------- | --------------------------------- |
| `enabled`             | `boolean` | `true`     | Hibrit BM25 + vektör aramasını etkinleştirir |
| `vectorWeight`        | `number`  | `0.7`      | Vektör puanları için ağırlık (0-1) |
| `textWeight`          | `number`  | `0.3`      | BM25 puanları için ağırlık (0-1)  |
| `candidateMultiplier` | `number`  | `4`        | Aday havuzu boyutu çarpanı        |

### MMR (çeşitlilik)

| Anahtar       | Tür       | Varsayılan | Açıklama                               |
| ------------- | --------- | ---------- | -------------------------------------- |
| `mmr.enabled` | `boolean` | `false`    | MMR yeniden sıralamayı etkinleştirir   |
| `mmr.lambda`  | `number`  | `0.7`      | 0 = en yüksek çeşitlilik, 1 = en yüksek ilgi |

### Zamansal azalma (güncellik)

| Anahtar                      | Tür       | Varsayılan | Açıklama                    |
| ---------------------------- | --------- | ---------- | --------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false`    | Güncellik artırmasını etkinleştirir |
| `temporalDecay.halfLifeDays` | `number`  | `30`       | Puan her N günde yarıya iner |

Her zaman geçerli dosyalar (`MEMORY.md`, `memory/` içindeki tarih içermeyen dosyalar) hiçbir zaman azaltılmaz.

### Tam örnek

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Ek bellek yolları

| Anahtar     | Tür        | Açıklama                                  |
| ----------- | ---------- | ----------------------------------------- |
| `extraPaths` | `string[]` | Dizinlenecek ek dizinler veya dosyalar    |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Yollar mutlak veya çalışma alanına göreli olabilir. Dizinler, `.md` dosyaları için özyinelemeli olarak taranır. Sembolik bağlantı işleme, etkin arka uca bağlıdır: yerleşik motor sembolik bağlantıları yok sayarken, QMD alttaki QMD tarayıcı davranışını izler.

Aracı kapsamlı çapraz aracı döküm araması için `memory.qmd.paths` yerine `agents.list[].memorySearch.qmd.extraCollections` kullanın.
Bu ek koleksiyonlar aynı `{ path, name, pattern? }` biçimini izler, ancak aracı başına birleştirilir ve yol geçerli çalışma alanının dışına işaret ettiğinde açık paylaşılan adları koruyabilir.

Aynı çözümlenmiş yol hem `memory.qmd.paths` hem de `memorySearch.qmd.extraCollections` içinde görünürse, QMD ilk girişi tutar ve yineleneni atlar.

---

## Çok kipli bellek (Gemini)

Gemini Embedding 2 kullanarak görselleri ve sesleri Markdown ile birlikte dizinleyin:

| Anahtar                   | Tür        | Varsayılan | Açıklama                                   |
| ------------------------- | ---------- | ---------- | ------------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | Çok kipli dizinlemeyi etkinleştirir        |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]`    |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Dizinleme için en büyük dosya boyutu       |

Yalnızca `extraPaths` içindeki dosyalara uygulanır. Varsayılan bellek kökleri yalnızca Markdown olarak kalır.
`gemini-embedding-2-preview` gerektirir. `fallback` değeri `"none"` olmalıdır.

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(görseller); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Gömme önbelleği

| Anahtar            | Tür       | Varsayılan | Açıklama                               |
| ------------------ | --------- | ---------- | -------------------------------------- |
| `cache.enabled`    | `boolean` | `false`    | Parça gömmelerini SQLite içinde önbelleğe alır |
| `cache.maxEntries` | `number`  | `50000`    | En fazla önbelleğe alınan gömme sayısı |

Yeniden dizinleme veya döküm güncellemeleri sırasında değişmemiş metnin yeniden gömülmesini önler.

---

## Toplu dizinleme

| Anahtar                       | Tür       | Varsayılan | Açıklama                     |
| ----------------------------- | --------- | ---------- | ---------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`    | Toplu gömme API’sini etkinleştirir |
| `remote.batch.concurrency`    | `number`  | `2`        | Paralel toplu işler          |
| `remote.batch.wait`           | `boolean` | `true`     | Toplu işin tamamlanmasını bekler |
| `remote.batch.pollIntervalMs` | `number`  | --         | Yoklama aralığı              |
| `remote.batch.timeoutMinutes` | `number`  | --         | Toplu iş zaman aşımı         |

`openai`, `gemini` ve `voyage` için kullanılabilir. OpenAI toplu işleme, büyük geri doldurmalar için genellikle en hızlı ve en ucuz seçenektir.

---

## Oturum belleği araması (deneysel)

Oturum dökümlerini dizinleyin ve bunları `memory_search` üzerinden gösterin:

| Anahtar                     | Tür        | Varsayılan   | Açıklama                                |
| --------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory` | `boolean` | `false`      | Oturum dizinlemeyi etkinleştirir        |
| `sources`                   | `string[]` | `["memory"]` | Dökümleri dahil etmek için `"sessions"` ekleyin |
| `sync.sessions.deltaBytes`  | `number`   | `100000`     | Yeniden dizinleme için bayt eşiği       |
| `sync.sessions.deltaMessages` | `number` | `50`         | Yeniden dizinleme için ileti eşiği      |

Oturum dizinleme isteğe bağlıdır ve eşzamansız çalışır. Sonuçlar biraz eski olabilir. Oturum günlükleri diskte bulunduğundan, dosya sistemi erişimini güven sınırı olarak değerlendirin.

---

## SQLite vektör hızlandırma (sqlite-vec)

| Anahtar                    | Tür       | Varsayılan | Açıklama                           |
| -------------------------- | --------- | ---------- | ---------------------------------- |
| `store.vector.enabled`     | `boolean` | `true`     | Vektör sorguları için sqlite-vec kullanır |
| `store.vector.extensionPath` | `string` | bundled    | sqlite-vec yolunu geçersiz kılar   |

sqlite-vec kullanılamadığında OpenClaw otomatik olarak işlem içi kosinüs benzerliğine geri döner.

---

## Dizin depolama

| Anahtar              | Tür      | Varsayılan                            | Açıklama                                  |
| -------------------- | -------- | ------------------------------------- | ----------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Dizin konumu (`{agentId}` belirteçini destekler) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | FTS5 tokenleştiricisi (`unicode61` veya `trigram`) |

---

## QMD arka uç yapılandırması

Etkinleştirmek için `memory.backend = "qmd"` ayarlayın. Tüm QMD ayarları `memory.qmd` altında bulunur:

| Anahtar                 | Tür       | Varsayılan | Açıklama                                       |
| ----------------------- | --------- | ---------- | ---------------------------------------------- |
| `command`               | `string`  | `qmd`      | QMD yürütülebilir dosya yolu                   |
| `searchMode`            | `string`  | `search`   | Arama komutu: `search`, `vsearch`, `query`     |
| `includeDefaultMemory`  | `boolean` | `true`     | `MEMORY.md` + `memory/**/*.md` otomatik dizinleme |
| `paths[]`               | `array`   | --         | Ek yollar: `{ name, path, pattern? }`          |
| `sessions.enabled`      | `boolean` | `false`    | Oturum dökümlerini dizinler                    |
| `sessions.retentionDays` | `number` | --         | Döküm saklama süresi                           |
| `sessions.exportDir`    | `string`  | --         | Dışa aktarma dizini                            |

OpenClaw, geçerli QMD koleksiyonu ve MCP sorgu şekillerini tercih eder, ancak gerektiğinde eski `--mask` koleksiyon bayraklarına ve daha eski MCP araç adlarına geri dönerek eski QMD sürümlerini de çalışır durumda tutar.

QMD model geçersiz kılmaları OpenClaw yapılandırmasında değil, QMD tarafında kalır. QMD modellerini genel olarak geçersiz kılmanız gerekiyorsa ağ geçidi çalışma zamanı ortamında `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` ve `QMD_GENERATE_MODEL` gibi ortam değişkenlerini ayarlayın.

### Güncelleme takvimi

| Anahtar                  | Tür       | Varsayılan | Açıklama                               |
| ------------------------ | --------- | ---------- | -------------------------------------- |
| `update.interval`        | `string`  | `5m`       | Yenileme aralığı                       |
| `update.debounceMs`      | `number`  | `15000`    | Dosya değişikliklerini debounce eder   |
| `update.onBoot`          | `boolean` | `true`     | Başlangıçta yeniler                    |
| `update.waitForBootSync` | `boolean` | `false`    | Yenileme tamamlanana kadar başlangıcı engeller |
| `update.embedInterval`   | `string`  | --         | Ayrı gömme sıklığı                     |
| `update.commandTimeoutMs` | `number` | --         | QMD komutları için zaman aşımı         |
| `update.updateTimeoutMs` | `number`  | --         | QMD güncelleme işlemleri için zaman aşımı |
| `update.embedTimeoutMs`  | `number`  | --         | QMD gömme işlemleri için zaman aşımı   |

### Sınırlar

| Anahtar                 | Tür      | Varsayılan | Açıklama                     |
| ----------------------- | -------- | ---------- | ---------------------------- |
| `limits.maxResults`     | `number` | `6`        | En fazla arama sonucu        |
| `limits.maxSnippetChars` | `number` | --         | Parça uzunluğunu sınırlar    |
| `limits.maxInjectedChars` | `number` | --        | Toplam eklenen karakterleri sınırlar |
| `limits.timeoutMs`      | `number` | `4000`     | Arama zaman aşımı            |

### Kapsam

Hangi oturumların QMD arama sonuçları alabileceğini kontrol eder. Şeması [`session.sendPolicy`](/tr/gateway/configuration-reference#session) ile aynıdır:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Varsayılan yalnızca DM’dir. `match.keyPrefix`, normalize edilmiş oturum anahtarıyla eşleşir; `match.rawKeyPrefix` ise `agent:<id>:` dahil ham anahtarla eşleşir.

### Atıflar

`memory.citations` tüm arka uçlara uygulanır:

| Değer            | Davranış                                             |
| ---------------- | ---------------------------------------------------- |
| `auto` (varsayılan) | Parçalara `Source: <path#line>` alt bilgisini ekler |
| `on`             | Alt bilgiyi her zaman ekler                          |
| `off`            | Alt bilgiyi çıkarır (yol yine de aracıya dahili olarak iletilir) |

### Tam QMD örneği

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming (deneysel)

Dreaming, `agents.defaults.memorySearch` altında değil, `plugins.entries.memory-core.config.dreaming` altında yapılandırılır.

Dreaming, tek bir zamanlanmış tarama olarak çalışır ve içsel hafif/derin/REM aşamalarını bir uygulama ayrıntısı olarak kullanır.

Kavramsal davranış ve slash komutları için bkz. [Dreaming](/tr/concepts/dreaming).

### Kullanıcı ayarları

| Anahtar     | Tür       | Varsayılan  | Açıklama                                  |
| ----------- | --------- | ----------- | ----------------------------------------- |
| `enabled`   | `boolean` | `false`     | Dreaming’i tamamen etkinleştirir veya devre dışı bırakır |
| `frequency` | `string`  | `0 3 * * *` | Tam dreaming taraması için isteğe bağlı cron sıklığı |

### Örnek

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Notlar:

- Dreaming, makine durumunu `memory/.dreams/` içine yazar.
- Dreaming, insanlar tarafından okunabilir anlatı çıktısını `DREAMS.md` içine (veya mevcutsa `dreams.md`) yazar.
- Hafif/derin/REM aşama ilkesi ve eşikleri, kullanıcıya dönük yapılandırma değil, içsel davranıştır.
