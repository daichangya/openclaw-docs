---
read_when:
    - Sağlayıcı bazında model kurulumu başvurusuna ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI onboarding komutları istiyorsunuz
summary: Örnek yapılandırmalar + CLI akışlarıyla model sağlayıcısı genel bakışı
title: Model sağlayıcıları
x-i18n:
    generated_at: "2026-04-25T13:45:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

**LLM/model sağlayıcıları** için başvuru (WhatsApp/Telegram gibi sohbet kanalları değil). Model seçimi kuralları için bkz. [Models](/tr/concepts/models).

## Hızlı kurallar

- Model referansları `provider/model` biçimini kullanır (örnek: `opencode/claude-opus-4-6`).
- `agents.defaults.models`, ayarlandığında bir izin listesi görevi görür.
- CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` yerel model meta verisidir; `contextTokens` etkin çalışma zamanı üst sınırıdır.
- Geri dönüş kuralları, cooldown yoklamaları ve oturum geçersiz kılma kalıcılığı: [Model failover](/tr/concepts/model-failover).
- OpenAI ailesi yolları önek özeldir: `openai/<model>`, PI içinde doğrudan OpenAI API anahtarı sağlayıcısını kullanır; `openai-codex/<model>`, PI içinde Codex OAuth kullanır; `openai/<model>` artı `agents.defaults.embeddedHarness.runtime: "codex"` ise yerel Codex app-server harness kullanır. Bkz. [OpenAI](/tr/providers/openai) ve [Codex harness](/tr/plugins/codex-harness). Sağlayıcı/çalışma zamanı ayrımı kafa karıştırıyorsa önce [Agent runtimes](/tr/concepts/agent-runtimes) bölümünü okuyun.
- Plugin otomatik etkinleştirme de aynı sınırı izler: `openai-codex/<model>` OpenAI plugin'ine aittir; Codex plugin'i ise `embeddedHarness.runtime: "codex"` veya eski `codex/<model>` referanslarıyla etkinleştirilir.
- CLI çalışma zamanları da aynı ayrımı kullanır: `anthropic/claude-*`, `google/gemini-*` veya `openai/gpt-*` gibi standart model referanslarını seçin; ardından yerel bir CLI backend istediğinizde `agents.defaults.embeddedHarness.runtime` değerini `claude-cli`, `google-gemini-cli` veya `codex-cli` olarak ayarlayın. Eski `claude-cli/*`, `google-gemini-cli/*` ve `codex-cli/*` referansları, çalışma zamanı ayrıca kaydedilerek tekrar standart sağlayıcı referanslarına taşınır.
- GPT-5.5; PI içinde `openai-codex/gpt-5.5`, yerel Codex app-server harness ve paketlenmiş PI kataloğu kurulumunuz için `openai/gpt-5.5` sunuyorsa genel OpenAI API üzerinden kullanılabilir.

## Plugin'e ait sağlayıcı davranışı

Sağlayıcıya özgü mantığın büyük bölümü sağlayıcı plugin'lerinde (`registerProvider(...)`) yaşarken OpenClaw genel çıkarım döngüsünü korur. Plugin'ler onboarding, model katalogları, auth env-var eşleme, taşıma/yapılandırma normalizasyonu, araç şeması temizleme, failover sınıflandırması, OAuth yenileme, kullanım raporlama, thinking/reasoning profilleri ve daha fazlasını sahiplenir.

Sağlayıcı SDK hook'larının tam listesi ve paketlenmiş plugin örnekleri [Provider plugins](/tr/plugins/sdk-provider-plugins) sayfasında bulunur. Tamamen özel bir istek yürütücüsüne ihtiyaç duyan sağlayıcılar ayrı ve daha derin bir genişletme yüzeyidir.

<Note>
Sağlayıcı çalışma zamanı `capabilities`, paylaşılan çalıştırıcı meta verisidir (sağlayıcı ailesi, transcript/araç farklılıkları, taşıma/önbellek ipuçları). Bu, bir plugin'in ne kaydettiğini açıklayan [public capability model](/tr/plugins/architecture#public-capability-model) ile aynı şey değildir (metin çıkarımı, konuşma vb.).
</Note>

## API anahtarı döndürme

- Seçili sağlayıcılar için genel sağlayıcı anahtarı döndürme desteklenir.
- Birden çok anahtarı şu yollarla yapılandırın:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
  - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgülle ayrılmış liste)
  - `<PROVIDER>_API_KEY` (birincil anahtar)
  - `<PROVIDER>_API_KEY_*` (numaralandırılmış liste, ör. `<PROVIDER>_API_KEY_1`)
- Google sağlayıcıları için `GOOGLE_API_KEY` de geri dönüş olarak dahil edilir.
- Anahtar seçim sırası önceliği korur ve değerlerin tekrarını kaldırır.
- İstekler yalnızca hız sınırı yanıtlarında bir sonraki anahtarla yeniden denenir (örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` veya periyodik kullanım sınırı mesajları).
- Hız sınırı dışındaki hatalar anında başarısız olur; anahtar döndürme denenmez.
- Tüm aday anahtarlar başarısız olursa, son denemeden gelen son hata döndürülür.

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw, pi‑ai kataloğuyla birlikte gelir. Bu sağlayıcılar için `models.providers` yapılandırması **gerekmez**; yalnızca auth ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Auth: `OPENAI_API_KEY`
- İsteğe bağlı döndürme: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` ve ayrıca `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- GPT-5.5 doğrudan API desteği, kurulumunuz için paketlenmiş PI kataloğu sürümüne bağlıdır; Codex app-server çalışma zamanı olmadan `openai/gpt-5.5` kullanmadan önce `openclaw models list --provider openai` ile doğrulayın.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan taşıma `auto`dur (önce WebSocket, geri dönüş SSE)
- Model başına geçersiz kılmak için `agents.defaults.models["openai/<model>"].params.transport` kullanın (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket warm-up, `params.openaiWsWarmup` ile varsayılan olarak etkindir (`true`/`false`)
- OpenAI öncelikli işleme `agents.defaults.models["openai/<model>"].params.serviceTier` ile etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` olarak eşler
- Paylaşılan `/fast` anahtarı yerine açık bir kademe istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw atıf üstbilgileri (`originator`, `version`, `User-Agent`) yalnızca `api.openai.com` adresine giden yerel OpenAI trafiğinde uygulanır, genel OpenAI uyumlu proxy'lerde uygulanmaz
- Yerel OpenAI yolları ayrıca Responses `store`, istem önbelleği ipuçları ve OpenAI reasoning uyumlu payload biçimlendirmesini korur; proxy yolları korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API istekleri bunu reddettiği ve mevcut Codex kataloğu bunu sunmadığı için OpenClaw'da kasıtlı olarak bastırılmıştır

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- İsteğe bağlı döndürme: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` ve ayrıca `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek geçersiz kılma)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Doğrudan genel Anthropic istekleri, `api.anthropic.com` adresine gönderilen API anahtarlı ve OAuth kimlik doğrulamalı trafik dahil olmak üzere paylaşılan `/fast` anahtarını ve `params.fastMode` seçeneğini destekler; OpenClaw bunu Anthropic `service_tier` değerine eşler (`auto` ve `standard_only`)
- Anthropic notu: Anthropic personeli, OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle Anthropic yeni bir politika yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için izinli kabul eder.
- Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak kullanılmaya devam eder, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Sağlayıcı: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI model referansı: `openai-codex/gpt-5.5`
- Yerel Codex app-server harness referansı: `openai/gpt-5.5` ile `agents.defaults.embeddedHarness.runtime: "codex"`
- Yerel Codex app-server harness belgeleri: [Codex harness](/tr/plugins/codex-harness)
- Eski model referansları: `codex/gpt-*`
- Plugin sınırı: `openai-codex/*`, OpenAI plugin'ini yükler; yerel Codex app-server plugin'i yalnızca Codex harness çalışma zamanı veya eski `codex/*` referanslarıyla seçilir.
- CLI: `openclaw onboard --auth-choice openai-codex` veya `openclaw models auth login --provider openai-codex`
- Varsayılan taşıma `auto`dur (önce WebSocket, geri dönüş SSE)
- PI modeli başına geçersiz kılmak için `agents.defaults.models["openai-codex/<model>"].params.transport` kullanın (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier`, yerel Codex Responses isteklerinde (`chatgpt.com/backend-api`) de iletilir
- Gizli OpenClaw atıf üstbilgileri (`originator`, `version`, `User-Agent`) yalnızca `chatgpt.com/backend-api` adresine giden yerel Codex trafiğinde eklenir, genel OpenAI uyumlu proxy'lerde eklenmez
- Doğrudan `openai/*` ile aynı `/fast` anahtarını ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` olarak eşler
- `openai-codex/gpt-5.5`, Codex kataloğunun yerel `contextWindow = 400000` ve varsayılan çalışma zamanı `contextTokens = 272000` değerlerini kullanır; çalışma zamanı üst sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
- İlke notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenir.
- Codex OAuth/abonelik yolunu istediğinizde `openai-codex/gpt-5.5` kullanın; API anahtarı kurulumunuz ve yerel kataloğunuz genel API yolunu sunuyorsa `openai/gpt-5.5` kullanın.

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

- [Qwen Cloud](/tr/providers/qwen): Qwen Cloud sağlayıcı yüzeyi ve Alibaba DashScope ile Coding Plan uç nokta eşlemesi
- [MiniMax](/tr/providers/minimax): MiniMax Coding Plan OAuth veya API anahtarı erişimi
- [GLM models](/tr/providers/glm): Z.AI Coding Plan veya genel API uç noktaları

### OpenCode

- Auth: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`)
- Zen çalışma zamanı sağlayıcısı: `opencode`
- Go çalışma zamanı sağlayıcısı: `opencode-go`
- Örnek modeller: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API anahtarı)

- Sağlayıcı: `google`
- Auth: `GEMINI_API_KEY`
- İsteğe bağlı döndürme: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` geri dönüşü ve `OPENCLAW_LIVE_GEMINI_KEY` (tek geçersiz kılma)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` biçimine normalize edilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive`, Google dinamik thinking özelliğini kullanır. Gemini 3/3.1 sabit bir `thinkingLevel` göndermez; Gemini 2.5 ise `thinkingBudget: -1` gönderir.
- Doğrudan Gemini çalıştırmaları ayrıca `agents.defaults.models["google/<model>"].params.cachedContent` (veya eski `cached_content`) kabul eder; bu, sağlayıcıya özgü bir `cachedContents/...` tanıtıcısını iletir; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak gösterilir

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Auth: Vertex, gcloud ADC kullanır; Gemini CLI kendi OAuth akışını kullanır
- Dikkat: OpenClaw içindeki Gemini CLI OAuth resmi olmayan bir entegrasyondur. Bazı kullanıcılar üçüncü taraf istemciler kullandıktan sonra Google hesap kısıtlamaları bildirmiştir. Devam etmeyi seçerseniz Google şartlarını inceleyin ve kritik olmayan bir hesap kullanın.
- Gemini CLI OAuth, paketlenmiş `google` plugin'inin parçası olarak sunulur.
  - Önce Gemini CLI kurun:
    - `brew install gemini-cli`
    - veya `npm install -g @google/gemini-cli`
  - Etkinleştirin: `openclaw plugins enable google`
  - Giriş yapın: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
  - Not: `openclaw.json` içine istemci kimliği veya gizli anahtar yapıştırmazsınız. CLI giriş akışı token'ları Gateway ana makinesi üzerindeki auth profillerinde saklar.
  - Girişten sonra istekler başarısız olursa, Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  - Gemini CLI JSON yanıtları `response` alanından ayrıştırılır; kullanım bilgisi `stats` alanına geri döner ve `stats.cached`, OpenClaw `cacheRead` biçimine normalize edilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Auth: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` biçimine normalize edilir
  - `zai-api-key`, eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` ise belirli bir yüzeyi zorlar

### Vercel AI Gateway

- Sağlayıcı: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Örnek modeller: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Sağlayıcı: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Örnek model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Temel URL: `https://api.kilo.ai/api/gateway/`
- Statik geri dönüş kataloğu `kilocode/kilo/auto` ile gelir; canlı
  `https://api.kilo.ai/api/gateway/models` keşfi çalışma zamanı
  kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki tam upstream yönlendirme OpenClaw'da sabit kodlanmış değildir, Kilo Gateway tarafından sahiplenilir.

Kurulum ayrıntıları için bkz. [/providers/kilocode](/tr/providers/kilocode).

### Diğer paketlenmiş sağlayıcı plugin'leri

| Sağlayıcı               | Kimlik                           | Auth env                                                     | Örnek model                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                  |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

Bilinmeye değer farklılıklar:

- **OpenRouter**, uygulama-atıf üstbilgilerini ve Anthropic `cache_control` işaretleyicilerini yalnızca doğrulanmış `openrouter.ai` yollarında uygular. DeepSeek, Moonshot ve ZAI referansları OpenRouter tarafından yönetilen istem önbelleklemesi için önbellek-TTL uygunluğuna sahiptir, ancak Anthropic önbellek işaretleyicileri almaz. Proxy tarzı bir OpenAI uyumlu yol olduğundan, yalnızca yerel OpenAI'ye özgü biçimlendirmeyi atlar (`serviceTier`, Responses `store`, istem önbelleği ipuçları, OpenAI reasoning uyumluluğu). Gemini tabanlı referanslar yalnızca proxy-Gemini düşünce imzası temizliğini korur.
- **Kilo Gateway** Gemini tabanlı referansları aynı proxy-Gemini temizleme yolunu izler; `kilocode/kilo/auto` ve proxy-reasoning desteklemeyen diğer referanslar proxy reasoning eklemeyi atlar.
- **MiniMax** API anahtarlı onboarding, açık metin tabanlı M2.7 sohbet modeli tanımları yazar; görsel anlama ise plugin'e ait `MiniMax-VL-01` medya sağlayıcısında kalır.
- **xAI**, xAI Responses yolunu kullanır. `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`, `grok-4` ve `grok-4-0709` modellerini `*-fast` varyantlarına yeniden yazar. `tool_stream` varsayılan olarak açıktır; `agents.defaults.models["xai/<model>"].params.tool_stream=false` ile devre dışı bırakın.
- **Cerebras** GLM modelleri `zai-glm-4.7` / `zai-glm-4.6` kullanır; OpenAI uyumlu temel URL `https://api.cerebras.ai/v1` adresidir.

## `models.providers` üzerinden sağlayıcılar (özel/temel URL)

**Özel** sağlayıcılar veya OpenAI/Anthropic uyumlu proxy'ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketlenmiş sağlayıcı plugin'lerinin çoğu zaten varsayılan bir katalog yayımlar.
Açık `models.providers.<id>` girdilerini yalnızca varsayılan temel URL'yi, üstbilgileri veya model listesini geçersiz kılmak istediğinizde kullanın.

### Moonshot AI (Kimi)

Moonshot, paketlenmiş bir sağlayıcı plugin'i olarak gelir. Varsayılan olarak yerleşik sağlayıcıyı kullanın ve yalnızca temel URL'yi veya model meta verisini geçersiz kılmanız gerektiğinde açık bir `models.providers.moonshot` girdisi ekleyin:

- Sağlayıcı: `moonshot`
- Auth: `MOONSHOT_API_KEY`
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
- Auth: `KIMI_API_KEY`
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
- Auth: `VOLCANO_ENGINE_API_KEY`
- Örnek model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding varsayılan olarak coding yüzeyini kullanır, ancak genel `volcengine/*`
kataloğu da aynı anda kaydedilir.

Onboarding/yapılandırma model seçicilerinde Volcengine auth seçimi hem
`volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş sağlayıcı kapsamlı bir seçici göstermek yerine filtrelenmemiş
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
- Auth: `BYTEPLUS_API_KEY`
- Örnek model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding varsayılan olarak coding yüzeyini kullanır, ancak genel `byteplus/*`
kataloğu da aynı anda kaydedilir.

Onboarding/yapılandırma model seçicilerinde BytePlus auth seçimi hem
`byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse,
OpenClaw boş sağlayıcı kapsamlı bir seçici göstermek yerine filtrelenmemiş
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

Synthetic, `synthetic` sağlayıcısı arkasında Anthropic uyumlu modeller sunar:

- Sağlayıcı: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
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

- MiniMax OAuth (Genel): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API anahtarı (Genel): `--auth-choice minimax-global-api`
- MiniMax API anahtarı (CN): `--auth-choice minimax-cn-api`
- Auth: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya
  `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve yapılandırma parçacıkları için bkz. [/providers/minimax](/tr/providers/minimax).

MiniMax'ın Anthropic uyumlu akış yolunda OpenClaw, siz açıkça ayarlamadığınız sürece thinking özelliğini
varsayılan olarak devre dışı bırakır ve `/fast on`,
`MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

Plugin'e ait yetenek ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görsel üretimi `minimax/image-01` veya `minimax-portal/image-01` olur
- Görsel anlama, her iki MiniMax auth yolunda da plugin'e ait `MiniMax-VL-01` olarak kalır
- Web araması sağlayıcı kimliği `minimax` üzerinde kalır

### LM Studio

LM Studio, yerel API'yi kullanan paketlenmiş bir sağlayıcı plugin'i olarak gelir:

- Sağlayıcı: `lmstudio`
- Auth: `LM_API_TOKEN`
- Varsayılan çıkarım temel URL'si: `http://localhost:1234/v1`

Ardından bir model ayarlayın (`http://localhost:1234/api/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw, keşif + otomatik yükleme için LM Studio'nun yerel `/api/v1/models` ve `/api/v1/models/load` uç noktalarını, varsayılan olarak çıkarım için ise `/v1/chat/completions` yolunu kullanır.
Kurulum ve sorun giderme için bkz. [/providers/lmstudio](/tr/providers/lmstudio).

### Ollama

Ollama, paketlenmiş bir sağlayıcı plugin'i olarak gelir ve Ollama'nın yerel API'sini kullanır:

- Sağlayıcı: `ollama`
- Auth: Gerekmez (yerel sunucu)
- Örnek model: `ollama/llama3.3`
- Kurulum: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama'yı kurun, ardından bir model çekin:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY` ile açık katılım yaptığınızda Ollama, yerelde `http://127.0.0.1:11434` adresinde algılanır ve paketlenmiş sağlayıcı plugin'i Ollama'yı doğrudan `openclaw onboard` ile model seçiciye ekler. Onboarding, bulut/yerel mod ve özel yapılandırma için bkz. [/providers/ollama](/tr/providers/ollama).

### vLLM

vLLM, yerel/kendi kendine barındırılan OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı plugin'i olarak gelir:

- Sağlayıcı: `vllm`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:8000/v1`

Yerelde otomatik keşfe açık katılım yapmak için (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır):

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

SGLang, hızlı kendi kendine barındırılan OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı plugin'i olarak gelir:

- Sağlayıcı: `sglang`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:30000/v1`

Yerelde otomatik keşfe açık katılım yapmak için (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır):

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
      models: { "lmstudio/my-local-model": { alias: "Local" } },
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
            name: "Local Model",
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
  Atlandıklarında OpenClaw şu varsayılanları kullanır:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Öneri: Proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.
- Yerel olmayan uç noktalarda `api: "openai-completions"` için (`baseUrl` boş olmayan ve ana makinesi `api.openai.com` olmayan her URL), OpenClaw, desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarını önlemek amacıyla `compat.supportsDeveloperRole: false` değerini zorlar.
- Proxy tarzı OpenAI uyumlu yollar ayrıca yalnızca yerel OpenAI'ye özgü istek biçimlendirmesini de atlar: `service_tier` yok, Responses `store` yok, Completions `store` yok, istem önbelleği ipuçları yok, OpenAI reasoning uyumlu payload biçimlendirmesi yok ve gizli OpenClaw atıf üstbilgileri yok.
- Sağlayıcıya özgü alanlara ihtiyaç duyan OpenAI uyumlu Completions proxy'leri için `agents.defaults.models["provider/model"].params.extra_body` (veya `extraBody`) ayarlayarak ek JSON'u giden istek gövdesine birleştirin.
- `baseUrl` boşsa/atlanmışsa OpenClaw varsayılan OpenAI davranışını korur (`api.openai.com` adresine çözülür).
- Güvenlik için, açık bir `compat.supportsDeveloperRole: true` ayarı bile yerel olmayan `openai-completions` uç noktalarında yine geçersiz kılınır.

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Ayrıca bkz.: Tam yapılandırma örnekleri için [Configuration](/tr/gateway/configuration).

## İlgili

- [Models](/tr/concepts/models) — model yapılandırması ve takma adlar
- [Model failover](/tr/concepts/model-failover) — geri dönüş zincirleri ve yeniden deneme davranışı
- [Configuration reference](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
- [Providers](/tr/providers) — sağlayıcı başına kurulum kılavuzları
