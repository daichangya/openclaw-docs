---
read_when:
    - Sağlayıcı bazında bir model kurulum başvuru kaynağına ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI ilk kurulum komutları istiyorsunuz
summary: Örnek yapılandırmalar ve CLI akışlarıyla model sağlayıcısı genel bakışı
title: Model sağlayıcıları
x-i18n:
    generated_at: "2026-04-24T15:21:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79258cb26fae7926c65b6fe0db938c7b5736a540b33bc24c1fad5ad706ac8204
    source_path: concepts/model-providers.md
    workflow: 15
---

Bu sayfa **LLM/model sağlayıcılarını** kapsar (WhatsApp/Telegram gibi sohbet kanalları değil).
Model seçim kuralları için bkz. [/concepts/models](/tr/concepts/models).

## Hızlı kurallar

- Model başvuruları `provider/model` biçimini kullanır (örnek: `opencode/claude-opus-4-6`).
- `agents.defaults.models`, ayarlandığında bir izin listesi olarak davranır.
- CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` doğal model meta verisidir; `contextTokens` ise etkili çalışma zamanı sınırıdır.
- Yedekleme kuralları, bekleme süresi incelemeleri ve oturum-üstü geçersiz kılma kalıcılığı: [Model failover](/tr/concepts/model-failover).
- OpenAI ailesi yönlendirmeleri önek bazlıdır: `openai/<model>`, PI içinde doğrudan OpenAI API anahtarı sağlayıcısını kullanır; `openai-codex/<model>`, PI içinde Codex OAuth kullanır; `openai/<model>` ile birlikte `agents.defaults.embeddedHarness.runtime: "codex"` ise doğal Codex uygulama sunucusu harness'ını kullanır. Bkz. [OpenAI](/tr/providers/openai) ve [Codex harness](/tr/plugins/codex-harness).
- Plugin otomatik etkinleştirme de aynı sınırı izler: `openai-codex/<model>` OpenAI Plugin'ine aittir, Codex Plugin'i ise `embeddedHarness.runtime: "codex"` veya eski `codex/<model>` başvuruları tarafından etkinleştirilir.
- GPT-5.5 şu anda abonelik/OAuth yolları üzerinden kullanılabilir: PI içinde `openai-codex/gpt-5.5` veya Codex uygulama sunucusu harness'ı ile `openai/gpt-5.5`. `openai/gpt-5.5` için doğrudan API anahtarı yolu, OpenAI GPT-5.5'i genel API üzerinde etkinleştirdiğinde desteklenir; o zamana kadar `OPENAI_API_KEY` kurulumları için `openai/gpt-5.4` gibi API etkin modelleri kullanın.

## Plugin'e ait sağlayıcı davranışı

Sağlayıcıya özgü mantığın çoğu sağlayıcı Plugin'lerinde (`registerProvider(...)`) yaşar; OpenClaw ise genel çıkarım döngüsünü korur. Plugin'ler ilk kurulum, model katalogları, kimlik doğrulama ortam değişkeni eşlemesi, taşıma/yapılandırma normalleştirmesi, araç şeması temizliği, failover sınıflandırması, OAuth yenileme, kullanım raporlama, düşünme/akıl yürütme profilleri ve daha fazlasından sorumludur.

Sağlayıcı SDK kancalarının tam listesi ve paketlenmiş Plugin örnekleri [Provider plugins](/tr/plugins/sdk-provider-plugins) içinde yer alır. Tamamen özel bir istek yürütücüsüne ihtiyaç duyan bir sağlayıcı, ayrı ve daha derin bir genişletme yüzeyidir.

<Note>
Sağlayıcı çalışma zamanı `capabilities`, paylaşılan çalıştırıcı meta verisidir (sağlayıcı ailesi, transkript/araçlama farklılıkları, taşıma/önbellek ipuçları). Bu, bir Plugin'in ne kaydettiğini açıklayan [public capability model](/tr/plugins/architecture#public-capability-model) ile aynı şey değildir (metin çıkarımı, konuşma vb.).
</Note>

## API anahtarı rotasyonu

- Seçili sağlayıcılar için genel sağlayıcı rotasyonunu destekler.
- Birden fazla anahtarı şu yollarla yapılandırın:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
  - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgül listesi)
  - `<PROVIDER>_API_KEY` (birincil anahtar)
  - `<PROVIDER>_API_KEY_*` (numaralı liste, ör. `<PROVIDER>_API_KEY_1`)
- Google sağlayıcıları için `GOOGLE_API_KEY` de yedek olarak dahil edilir.
- Anahtar seçim sırası önceliği korur ve değerleri tekilleştirir.
- İstekler, yalnızca hız sınırı yanıtlarında bir sonraki anahtarla yeniden denenir (örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` veya dönemsel kullanım sınırı mesajları).
- Hız sınırı dışındaki hatalar hemen başarısız olur; anahtar rotasyonu denenmez.
- Tüm aday anahtarlar başarısız olduğunda, son hata son denemeden döndürülür.

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw, pi‑ai kataloğuyla birlikte gelir. Bu sağlayıcılar **hiç**
`models.providers` yapılandırması gerektirmez; sadece kimlik doğrulamayı ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Kimlik doğrulama: `OPENAI_API_KEY`
- İsteğe bağlı rotasyon: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ayrıca `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- GPT-5.5 için doğrudan API desteği, OpenAI GPT-5.5'i API'de kullanıma açtığında burada geleceğe hazırdır
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan taşıma `auto`'dur (önce WebSocket, yedek olarak SSE)
- Model başına şununla geçersiz kılın: `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket ısınması varsayılan olarak `params.openaiWsWarmup` (`true`/`false`) ile etkindir
- OpenAI öncelikli işleme `agents.defaults.models["openai/<model>"].params.serviceTier` ile etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` olarak eşler
- Paylaşılan `/fast` anahtarı yerine açık bir katman istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw atıf başlıkları (`originator`, `version`,
  `User-Agent`) yalnızca `api.openai.com`'a giden doğal OpenAI trafiğinde uygulanır, genel OpenAI uyumlu proxy'lerde uygulanmaz
- Doğal OpenAI yolları ayrıca Responses `store`, istem önbelleği ipuçlarını ve
  OpenAI akıl yürütme uyumluluğu yük şekillendirmesini korur; proxy yolları korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API istekleri bunu reddettiği ve mevcut Codex kataloğu bunu göstermediği için OpenClaw'da kasıtlı olarak gizlenmiştir

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Kimlik doğrulama: `ANTHROPIC_API_KEY`
- İsteğe bağlı rotasyon: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ayrıca `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek geçersiz kılma)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Doğrudan genel Anthropic istekleri, `api.anthropic.com`'a gönderilen API anahtarı ve OAuth ile kimliği doğrulanmış trafik dahil, paylaşılan `/fast` anahtarını ve `params.fastMode`'u destekler; OpenClaw bunu Anthropic `service_tier`'ına (`auto` vs `standard_only`) eşler
- Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle Anthropic yeni bir politika yayımlamadıkça OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylı kabul eder.
- Anthropic kurulum belirteci, desteklenen bir OpenClaw belirteç yolu olarak kullanılmaya devam eder, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Sağlayıcı: `openai-codex`
- Kimlik doğrulama: OAuth (ChatGPT)
- PI model başvurusu: `openai-codex/gpt-5.5`
- Doğal Codex uygulama sunucusu harness başvurusu: `openai/gpt-5.5` ve `agents.defaults.embeddedHarness.runtime: "codex"`
- Eski model başvuruları: `codex/gpt-*`
- Plugin sınırı: `openai-codex/*` OpenAI Plugin'ini yükler; doğal Codex
  uygulama sunucusu Plugin'i yalnızca Codex harness çalışma zamanı veya eski
  `codex/*` başvurularıyla seçilir.
- CLI: `openclaw onboard --auth-choice openai-codex` veya `openclaw models auth login --provider openai-codex`
- Varsayılan taşıma `auto`'dur (önce WebSocket, yedek olarak SSE)
- PI modeli başına şununla geçersiz kılın: `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier`, doğal Codex Responses isteklerinde de iletilir (`chatgpt.com/backend-api`)
- Gizli OpenClaw atıf başlıkları (`originator`, `version`,
  `User-Agent`) yalnızca `chatgpt.com/backend-api`'ye giden doğal Codex trafiğine
  eklenir, genel OpenAI uyumlu proxy'lere eklenmez
- Doğrudan `openai/*` ile aynı `/fast` anahtarını ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` olarak eşler
- `openai-codex/gpt-5.5`, doğal `contextWindow = 1000000` ve varsayılan çalışma zamanı `contextTokens = 272000` değerlerini korur; çalışma zamanı sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
- Politika notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenir.
- Mevcut GPT-5.5 erişimi, OpenAI GPT-5.5'i genel API'de etkinleştirene kadar bu OAuth/abonelik yolunu kullanır.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Diğer abonelik tarzı barındırılan seçenekler

- [Qwen Cloud](/tr/providers/qwen): Qwen Cloud sağlayıcı yüzeyi ile Alibaba DashScope ve Coding Plan uç nokta eşlemesi
- [MiniMax](/tr/providers/minimax): MiniMax Coding Plan OAuth veya API anahtarı erişimi
- [GLM Models](/tr/providers/glm): Z.AI Coding Plan veya genel API uç noktaları

### OpenCode

- Kimlik doğrulama: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`)
- Zen çalışma zamanı sağlayıcısı: `opencode`
- Go çalışma zamanı sağlayıcısı: `opencode-go`
- Örnek modeller: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API anahtarı)

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY`
- İsteğe bağlı rotasyon: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` yedeği ve `OPENCLAW_LIVE_GEMINI_KEY` (tek geçersiz kılma)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` olarak normalleştirilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Doğrudan Gemini çalıştırmaları ayrıca `agents.defaults.models["google/<model>"].params.cachedContent`
  (veya eski `cached_content`) kabul eder; bu, sağlayıcıya özgü bir
  `cachedContents/...` tanıtıcısını iletir; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Kimlik doğrulama: Vertex gcloud ADC kullanır; Gemini CLI kendi OAuth akışını kullanır
- Dikkat: OpenClaw içindeki Gemini CLI OAuth resmî olmayan bir entegrasyondur. Bazı kullanıcılar üçüncü taraf istemcileri kullandıktan sonra Google hesap kısıtlamaları bildirmiştir. Devam etmeyi seçerseniz Google şartlarını inceleyin ve kritik olmayan bir hesap kullanın.
- Gemini CLI OAuth, paketlenmiş `google` Plugin'inin bir parçası olarak gönderilir.
  - Önce Gemini CLI'yi yükleyin:
    - `brew install gemini-cli`
    - veya `npm install -g @google/gemini-cli`
  - Etkinleştirme: `openclaw plugins enable google`
  - Giriş: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
  - Not: `openclaw.json` içine bir istemci kimliği veya gizli anahtar yapıştırmazsınız. CLI giriş akışı
    belirteçleri Gateway ana bilgisayarındaki kimlik doğrulama profillerinde depolar.
  - Girişten sonra istekler başarısız olursa, Gateway ana bilgisayarında `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  - Gemini CLI JSON yanıtları `response` içinden ayrıştırılır; kullanım
    `stats`'a yedeklenir ve `stats.cached`, OpenClaw `cacheRead` içine normalleştirilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Kimlik doğrulama: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` olarak normalleştirilir
  - `zai-api-key`, eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` belirli bir yüzeyi zorlar

### Vercel AI Gateway

- Sağlayıcı: `vercel-ai-gateway`
- Kimlik doğrulama: `AI_GATEWAY_API_KEY`
- Örnek modeller: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Sağlayıcı: `kilocode`
- Kimlik doğrulama: `KILOCODE_API_KEY`
- Örnek model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Temel URL: `https://api.kilo.ai/api/gateway/`
- Statik yedek katalog `kilocode/kilo/auto` ile gelir; canlı
  `https://api.kilo.ai/api/gateway/models` keşfi çalışma zamanı
  kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki tam yukarı akış yönlendirmesi OpenClaw'da sabit kodlanmaz, Kilo Gateway'e aittir.

Kurulum ayrıntıları için bkz. [/providers/kilocode](/tr/providers/kilocode).

### Diğer paketlenmiş sağlayıcı Plugin'leri

| Sağlayıcı               | Kimlik                           | Kimlik doğrulama ortam değişkeni                           | Örnek model                                    |
| ----------------------- | -------------------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                         | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                         | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                            | —                                              |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                         | `deepseek/deepseek-v4-flash`                   |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`       | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                             | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN`                    | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                         | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` veya `KIMICODE_API_KEY`                     | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                  | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                          | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                         | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                           | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                       | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                          | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                            |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                          | `stepfun/step-3.5-flash`                       |
| Together                | `together`                       | `TOGETHER_API_KEY`                                         | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                           | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                       | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                   | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                            | `XAI_API_KEY`                                              | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                           | `xiaomi/mimo-v2-flash`                         |

Bilinmeye değer farklılıklar:

- **OpenRouter**, uygulama atıf başlıklarını ve Anthropic `cache_control` işaretlerini yalnızca doğrulanmış `openrouter.ai` yollarında uygular. Proxy tarzı bir OpenAI uyumlu yol olarak, yalnızca doğal OpenAI'ye özgü şekillendirmeyi (`serviceTier`, Responses `store`, istem önbelleği ipuçları, OpenAI akıl yürütme uyumluluğu) atlar. Gemini destekli başvurular yalnızca proxy-Gemini düşünce imzası temizliğini korur.
- **Kilo Gateway** Gemini destekli başvurular aynı proxy-Gemini temizleme yolunu izler; `kilocode/kilo/auto` ve proxy akıl yürütmeyi desteklemeyen diğer başvurular, proxy akıl yürütme eklemeyi atlar.
- **MiniMax** API anahtarıyla ilk kurulum, açık `input: ["text", "image"]` değerlerine sahip M2.7 model tanımlarını yazar; paketlenmiş katalog, bu yapılandırma somutlaştırılana kadar sohbet başvurularını yalnızca metin olarak tutar.
- **xAI**, xAI Responses yolunu kullanır. `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`, `grok-4` ve `grok-4-0709` modellerini `*-fast` varyantlarına yeniden yazar. `tool_stream` varsayılan olarak açıktır; `agents.defaults.models["xai/<model>"].params.tool_stream=false` ile devre dışı bırakın.
- **Cerebras** GLM modelleri `zai-glm-4.7` / `zai-glm-4.6` kullanır; OpenAI uyumlu temel URL `https://api.cerebras.ai/v1` adresidir.

## `models.providers` üzerinden sağlayıcılar (özel/temel URL)

**Özel** sağlayıcılar veya
OpenAI/Anthropic uyumlu proxy'ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketlenmiş sağlayıcı Plugin'lerinin çoğu zaten varsayılan bir katalog yayımlar.
Varsayılan temel URL'yi, başlıkları veya model listesini geçersiz kılmak
istediğinizde yalnızca açık `models.providers.<id>` girdileri kullanın.

### Moonshot AI (Kimi)

Moonshot, paketlenmiş bir sağlayıcı Plugin'i olarak gelir. Yerleşik sağlayıcıyı
varsayılan olarak kullanın ve yalnızca temel URL'yi veya model meta verisini
geçersiz kılmanız gerektiğinde açık bir `models.providers.moonshot` girdisi ekleyin:

- Sağlayıcı: `moonshot`
- Kimlik doğrulama: `MOONSHOT_API_KEY`
- Örnek model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` veya `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model kimlikleri:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding, Moonshot AI'nin Anthropic uyumlu uç noktasını kullanır:

- Sağlayıcı: `kimi`
- Kimlik doğrulama: `KIMI_API_KEY`
- Örnek model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Eski `kimi/k2p5`, uyumluluk model kimliği olarak kabul edilmeye devam eder.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎), Çin'de Doubao ve diğer modellere erişim sağlar.

- Sağlayıcı: `volcengine` (coding: `volcengine-plan`)
- Kimlik doğrulama: `VOLCANO_ENGINE_API_KEY`
- Örnek model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

İlk kurulum varsayılan olarak coding yüzeyine ayarlanır, ancak genel `volcengine/*`
kataloğu da aynı anda kaydedilir.

İlk kurulum/yapılandırma model seçicilerinde, Volcengine kimlik doğrulama seçeneği hem
`volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş
kataloğa geri döner.

Kullanılabilir modeller:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Coding modelleri (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Uluslararası)

BytePlus ARK, uluslararası kullanıcılar için Volcano Engine ile aynı modellere erişim sağlar.

- Sağlayıcı: `byteplus` (coding: `byteplus-plan`)
- Kimlik doğrulama: `BYTEPLUS_API_KEY`
- Örnek model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

İlk kurulum varsayılan olarak coding yüzeyine ayarlanır, ancak genel `byteplus/*`
kataloğu da aynı anda kaydedilir.

İlk kurulum/yapılandırma model seçicilerinde, BytePlus kimlik doğrulama seçeneği hem
`byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş
kataloğa geri döner.

Kullanılabilir modeller:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Coding modelleri (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic, `synthetic` sağlayıcısının arkasında Anthropic uyumlu modeller sunar:

- Sağlayıcı: `synthetic`
- Kimlik doğrulama: `SYNTHETIC_API_KEY`
- Örnek model: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax, özel uç noktalar kullandığı için `models.providers` üzerinden yapılandırılır:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API anahtarı (Global): `--auth-choice minimax-global-api`
- MiniMax API anahtarı (CN): `--auth-choice minimax-cn-api`
- Kimlik doğrulama: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya
  `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve yapılandırma parçacıkları için bkz. [/providers/minimax](/tr/providers/minimax).

MiniMax'ın Anthropic uyumlu akış yolunda OpenClaw, siz açıkça ayarlamadığınız
sürece thinking'i varsayılan olarak devre dışı bırakır ve `/fast on`,
`MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

Plugin'e ait yetenek ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görsel oluşturma `minimax/image-01` veya `minimax-portal/image-01` olur
- Görsel anlama, her iki MiniMax kimlik doğrulama yolunda da Plugin'e ait `MiniMax-VL-01` olur
- Web araması sağlayıcı kimliği `minimax` üzerinde kalır

### LM Studio

LM Studio, doğal API'yi kullanan paketlenmiş bir sağlayıcı Plugin'i olarak gelir:

- Sağlayıcı: `lmstudio`
- Kimlik doğrulama: `LM_API_TOKEN`
- Varsayılan çıkarım temel URL'si: `http://localhost:1234/v1`

Ardından bir model ayarlayın (`http://localhost:1234/api/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw, keşif + otomatik yükleme için varsayılan olarak LM Studio'nun doğal `/api/v1/models` ve `/api/v1/models/load` uç noktalarını, çıkarım için ise `/v1/chat/completions` yolunu kullanır.
Kurulum ve sorun giderme için bkz. [/providers/lmstudio](/tr/providers/lmstudio).

### Ollama

Ollama, paketlenmiş bir sağlayıcı Plugin'i olarak gelir ve Ollama'nın doğal API'sini kullanır:

- Sağlayıcı: `ollama`
- Kimlik doğrulama: Gerekmez (yerel sunucu)
- Örnek model: `ollama/llama3.3`
- Kurulum: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama'yı yükleyin, ardından bir model çekin:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY` ile etkinleştirmeyi seçtiğinizde Ollama, `http://127.0.0.1:11434` adresinde yerel olarak algılanır ve paketlenmiş sağlayıcı Plugin'i Ollama'yı doğrudan
`openclaw onboard` ve model seçiciye ekler. İlk kurulum, bulut/yerel mod ve özel yapılandırma için bkz. [/providers/ollama](/tr/providers/ollama).

### vLLM

vLLM, yerel/kendi barındırdığınız OpenAI uyumlu
sunucular için paketlenmiş bir sağlayıcı Plugin'i olarak gelir:

- Sağlayıcı: `vllm`
- Kimlik doğrulama: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:8000/v1`

Yerelde otomatik keşfi etkinleştirmek için (sunucunuz kimlik doğrulamayı zorlamıyorsa herhangi bir değer çalışır):

```bash
export VLLM_API_KEY="vllm-local"
```

Ardından bir model ayarlayın (`/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Ayrıntılar için bkz. [/providers/vllm](/tr/providers/vllm).

### SGLang

SGLang, hızlı kendi barındırdığınız
OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı Plugin'i olarak gelir:

- Sağlayıcı: `sglang`
- Kimlik doğrulama: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:30000/v1`

Yerelde otomatik keşfi etkinleştirmek için (sunucunuz kimlik doğrulamayı
zorlamıyorsa herhangi bir değer çalışır):

```bash
export SGLANG_API_KEY="sglang-local"
```

Ardından bir model ayarlayın (`/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Ayrıntılar için bkz. [/providers/sglang](/tr/providers/sglang).

### Yerel proxy'ler (LM Studio, vLLM, LiteLLM vb.)

Örnek (OpenAI uyumlu):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Yerel" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Yerel Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Notlar:

- Özel sağlayıcılar için `reasoning`, `input`, `cost`, `contextWindow` ve `maxTokens` isteğe bağlıdır.
  Atlandığında OpenClaw varsayılan olarak şunları kullanır:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Önerilen: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.
- Doğal olmayan uç noktalardaki `api: "openai-completions"` için (`api.openai.com` olmayan bir ana bilgisayara sahip boş olmayan herhangi bir `baseUrl`), OpenClaw, desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarını önlemek amacıyla `compat.supportsDeveloperRole: false` değerini zorunlu kılar.
- Proxy tarzı OpenAI uyumlu yollar ayrıca yalnızca doğal OpenAI'ye özgü istek
  şekillendirmeyi de atlar: `service_tier` yok, Responses `store` yok, istem önbelleği ipuçları yok,
  OpenAI akıl yürütme uyumluluğu yük şekillendirmesi yok ve gizli OpenClaw atıf
  başlıkları yok.
- `baseUrl` boşsa/atlanmışsa OpenClaw varsayılan OpenAI davranışını korur (`api.openai.com`'a çözülür).
- Güvenlik için, açık bir `compat.supportsDeveloperRole: true` değeri bile doğal olmayan `openai-completions` uç noktalarında yine de geçersiz kılınır.

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Ayrıca bkz.: tam yapılandırma örnekleri için [/gateway/configuration](/tr/gateway/configuration).

## İlgili

- [Models](/tr/concepts/models) — model yapılandırması ve takma adlar
- [Model Failover](/tr/concepts/model-failover) — yedek zincirleri ve yeniden deneme davranışı
- [Configuration Reference](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
- [Providers](/tr/providers) — sağlayıcı bazında kurulum kılavuzları
