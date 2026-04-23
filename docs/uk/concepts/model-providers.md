---
read_when:
    - Вам потрібен довідник з налаштування моделей для кожного провайдера окремо
    - Вам потрібні приклади конфігурацій або команд онбордингу CLI для провайдерів моделей
summary: Огляд провайдерів моделей із прикладами конфігурацій + потоками CLI
title: Провайдери моделей
x-i18n:
    generated_at: "2026-04-23T19:23:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdbb8deae102c8e55d4535ddb14b8eadb999c123cb6d188ebe563971bed762fc
    source_path: concepts/model-providers.md
    workflow: 15
---

# Провайдери моделей

Ця сторінка охоплює **LLM/провайдерів моделей** (а не чат-канали на кшталт WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
- `agents.defaults.models` діє як allowlist, якщо його задано.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі; `contextTokens` — це фактичне обмеження під час виконання.
- Правила fallback, проби cooldown і збереження перевизначень сесії: [Відмовостійкість моделей](/uk/concepts/model-failover).
- Вбудований `codex` поєднано з harness агента Codex — використовуйте `codex/gpt-*` для входу, виявлення, нативного відновлення потоків і виконання app-server, якими керує Codex. Звичайний `openai/gpt-*` використовує провайдера OpenAI і стандартний транспорт. Вимкніть автоматичний fallback до PI для розгортань лише з Codex через `agents.defaults.embeddedHarness.fallback: "none"` — див. [Codex harness](/uk/plugins/codex-harness).

## Поведінка провайдерів, якою керують Plugin

Більшість логіки, специфічної для провайдерів, живе у Plugin провайдерів (`registerProvider(...)`), тоді як OpenClaw зберігає загальний цикл інференсу. Plugin керують онбордингом, каталогами моделей, мапінгом auth env var, нормалізацією транспорту/конфігурації, очищенням схем інструментів, класифікацією failover, оновленням OAuth, звітністю про використання, профілями thinking/reasoning тощо.

Повний список хуків provider-SDK і прикладів вбудованих Plugin наведено в [Plugin провайдерів](/uk/plugins/sdk-provider-plugins). Якщо провайдеру потрібен повністю кастомний виконавець запитів, це вже окрема, глибша поверхня розширення.

<Note>
Під час виконання `capabilities` провайдера — це спільні метадані раннера (сімейство провайдера, особливості transcript/tooling, підказки для transport/cache). Це не те саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model), яка описує, що реєструє Plugin (текстовий інференс, мовлення тощо).
</Note>

## Ротація API-ключів

- Підтримується загальна ротація ключів провайдерів для вибраних провайдерів.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для провайдерів Google як fallback також включається `GOOGLE_API_KEY`.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на rate-limit
  (наприклад `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
- Помилки, не пов’язані з rate-limit, одразу завершуються збоєм; ротація ключів не виконується.
- Коли всі кандидатні ключі не спрацювали, повертається фінальна помилка з останньої спроби.

## Вбудовані провайдери (каталог pi-ai)

OpenClaw постачається з каталогом pi-ai. Для цих провайдерів **не**
потрібна конфігурація `models.providers`; достатньо задати auth + вибрати модель.

### OpenAI

- Провайдер: `openai`
- Auth: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.5`, `openai/gpt-5.5-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Транспорт за замовчуванням — `auto` (спочатку WebSocket, fallback на SSE)
- Перевизначення для моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Warm-up для OpenAI Responses WebSocket за замовчуванням увімкнено через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` напряму маплять запити `openai/*` Responses на `service_tier=priority` у `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний tier замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI до `api.openai.com`, а не
  до загальних OpenAI-сумісних proxy
- Нативні маршрути OpenAI також зберігають `store` для Responses, підказки prompt-cache і
  формування payload для сумісності з OpenAI reasoning; proxy-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приховано в OpenClaw, оскільки live OpenAI API його відхиляє; Spark вважається доступним лише для Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Провайдер: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, зокрема для трафіку з API-ключем та OAuth-аутентифікацією, надісланого до `api.anthropic.com`; OpenClaw мапить це на Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне використання Claude CLI і `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup-token Anthropic залишається доступним як підтримуваний шлях токена в OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI і `claude -p`, якщо вони доступні.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Провайдер: `openai-codex`
- Auth: OAuth (ChatGPT)
- Приклад моделі: `openai-codex/gpt-5.5`
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Транспорт за замовчуванням — `auto` (спочатку WebSocket, fallback на SSE)
- Перевизначення для моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також передається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних proxy
- Використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw мапить це на `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли її надає каталог Codex OAuth; залежить від entitlement
- `openai-codex/gpt-5.5` зберігає нативний `contextWindow = 1000000` і стандартний runtime `contextTokens = 272000`; перевизначте runtime-обмеження через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OAuth OpenAI Codex явно підтримується для зовнішніх інструментів/процесів, таких як OpenClaw.

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

### Інші розміщені варіанти у стилі підписки

- [Qwen Cloud](/uk/providers/qwen): поверхня провайдера Qwen Cloud, а також мапінг endpoint для Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): доступ MiniMax Coding Plan через OAuth або API key
- [GLM Models](/uk/providers/glm): endpoint Z.AI Coding Plan або загального API

### OpenCode

- Auth: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Провайдер Zen runtime: `opencode`
- Провайдер Go runtime: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Провайдер: `google`
- Auth: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застарілу конфігурацію OpenClaw із `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застарілий `cached_content`) для передавання нативного
  дескриптора `cachedContents/...`; збіги кешу Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Провайдери: `google-vertex`, `google-gemini-cli`
- Auth: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth
- Застереження: OAuth Gemini CLI в OpenClaw є неофіційною інтеграцією. Деякі користувачі повідомляли про обмеження акаунта Google після використання сторонніх клієнтів. Перегляньте умови Google і використовуйте некритичний акаунт, якщо вирішите продовжити.
- OAuth Gemini CLI постачається як частина вбудованого Plugin `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкнення: `openclaw plugins enable google`
  - Вхід: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: вам **не потрібно** вставляти client id або secret у `openclaw.json`. Потік входу CLI зберігає
    токени в auth profiles на хості gateway.
  - Якщо після входу запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway.
  - JSON-відповіді Gemini CLI розбираються з `response`; використання береться з fallback на
    `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Провайдер: `zai`
- Auth: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово вибирають конкретну поверхню

### Vercel AI Gateway

- Провайдер: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Приклади моделей: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Провайдер: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Статичний fallback-каталог постачається з `kilocode/kilo/auto`; live
  виявлення через `https://api.kilo.ai/api/gateway/models` може додатково розширити runtime-каталог.
- Точна маршрутизація вгору за течією для `kilocode/kilo/auto` визначається Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Деталі налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані Plugin провайдерів

| Провайдер                | Id                               | Auth env                                                     | Приклад моделі                                  |
| ------------------------ | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                 | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                 | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway    | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| GitHub Copilot           | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                     | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference   | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway             | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding              | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
| MiniMax                  | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                  | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                 | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                   | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter               | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                  | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud               | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                  | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                 | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                   | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway        | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao)  | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                      | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                   | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Варто знати про такі особливості:

- **OpenRouter** застосовує свої заголовки атрибуції застосунку та маркери Anthropic `cache_control` лише на підтверджених маршрутах `openrouter.ai`. Як OpenAI-сумісний шлях у стилі proxy, він пропускає shaping, доступний лише для нативного OpenAI (`serviceTier`, `store` для Responses, підказки prompt-cache, сумісність reasoning OpenAI). Посилання з бекендом Gemini зберігають лише очищення thought-signature для proxy-Gemini.
- **Kilo Gateway** для посилань із бекендом Gemini використовує той самий шлях очищення proxy-Gemini; `kilocode/kilo/auto` та інші посилання, де proxy reasoning не підтримується, пропускають ін’єкцію proxy reasoning.
- **MiniMax** під час онбордингу через API key записує явні визначення моделі M2.7 з `input: ["text", "image"]`; вбудований каталог залишає chat-посилання лише текстовими, доки ця конфігурація не буде матеріалізована.
- **xAI** використовує шлях xAI Responses. `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` увімкнено за замовчуванням; вимкніть через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** моделі GLM використовують `zai-glm-4.7` / `zai-glm-4.6`; OpenAI-сумісний base URL — `https://api.cerebras.ai/v1`.

## Провайдери через `models.providers` (власний/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **власні** провайдери або
OpenAI/Anthropic-сумісні proxy.

Багато з наведених нижче вбудованих Plugin провайдерів уже публікують каталог за замовчуванням.
Явні записи `models.providers.<id>` потрібні лише тоді, коли ви хочете перевизначити
стандартний base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований Plugin провайдера. За
замовчуванням використовуйте вбудованого провайдера, а явний запис `models.providers.moonshot` додавайте лише тоді, коли
потрібно перевизначити base URL або метадані моделі:

- Провайдер: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` або `openclaw onboard --auth-choice moonshot-api-key-cn`

Id моделей Kimi K2:

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

Kimi Coding використовує Anthropic-сумісний endpoint Moonshot AI:

- Провайдер: `kimi`
- Auth: `KIMI_API_KEY`
- Приклад моделі: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Застарілий `kimi/k2p5` і далі приймається як сумісний id моделі.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) надає доступ до Doubao та інших моделей у Китаї.

- Провайдер: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Приклад моделі: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Під час онбордингу за замовчуванням використовується поверхня coding, але загальний каталог `volcengine/*`
реєструється одночасно.

У пікерах моделей для онбордингу/налаштування вибір auth Volcengine надає перевагу як рядкам
`volcengine/*`, так і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
пікера, обмеженого провайдером.

Доступні моделі:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Моделі coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (міжнародний)

BytePlus ARK надає міжнародним користувачам доступ до тих самих моделей, що й Volcano Engine.

- Провайдер: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Приклад моделі: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Під час онбордингу за замовчуванням використовується поверхня coding, але загальний каталог `byteplus/*`
реєструється одночасно.

У пікерах моделей для онбордингу/налаштування вибір auth BytePlus надає перевагу як рядкам
`byteplus/*`, так і `byteplus-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
пікера, обмеженого провайдером.

Доступні моделі:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Моделі coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic надає Anthropic-сумісні моделі через провайдера `synthetic`:

- Провайдер: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Приклад моделі: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax налаштовується через `models.providers`, оскільки використовує власні endpoint:

- MiniMax OAuth (глобальний): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API key MiniMax (глобальний): `--auth-choice minimax-global-api`
- API key MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

На Anthropic-сумісному streaming-шляху MiniMax OpenClaw за замовчуванням вимикає thinking,
якщо ви явно його не задасте, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Розподіл можливостей, яким керує Plugin:

- Значення за замовчуванням для тексту/чату залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, яким на обох auth-шляхах MiniMax керує Plugin
- Вебпошук залишається на id провайдера `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin провайдера, який використовує нативний API:

- Провайдер: `lmstudio`
- Auth: `LM_API_TOKEN`
- Base URL інференсу за замовчуванням: `http://localhost:1234/v1`

Потім задайте модель (замініть на один з id, які повертає `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `LM Studio` `/api/v1/models` і `/api/v1/models/load`
для виявлення + автозавантаження, а `/v1/chat/completions` — для інференсу за замовчуванням.
Налаштування та усунення несправностей див. у [/providers/lmstudio](/uk/providers/lmstudio).

### Ollama

Ollama постачається як вбудований Plugin провайдера і використовує нативний API Ollama:

- Провайдер: `ollama`
- Auth: не потрібна (локальний сервер)
- Приклад моделі: `ollama/llama3.3`
- Встановлення: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, якщо ви ввімкнете це через
`OLLAMA_API_KEY`, а вбудований Plugin провайдера додає Ollama безпосередньо до
`openclaw onboard` і пікера моделей. Див. [/providers/ollama](/uk/providers/ollama)
для відомостей про онбординг, хмарний/локальний режим і власну конфігурацію.

### vLLM

vLLM постачається як вбудований Plugin провайдера для локальних/self-hosted
OpenAI-сумісних серверів:

- Провайдер: `vllm`
- Auth: необов’язкова (залежить від вашого сервера)
- Base URL за замовчуванням: `http://127.0.0.1:8000/v1`

Щоб увімкнути локальне автовиявлення (підійде будь-яке значення, якщо ваш сервер не вимагає auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один з id, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Деталі див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований Plugin провайдера для швидких self-hosted
OpenAI-сумісних серверів:

- Провайдер: `sglang`
- Auth: необов’язкова (залежить від вашого сервера)
- Base URL за замовчуванням: `http://127.0.0.1:30000/v1`

Щоб увімкнути локальне автовиявлення (підійде будь-яке значення, якщо ваш сервер не
вимагає auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один з id, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Деталі див. у [/providers/sglang](/uk/providers/sglang).

### Локальні proxy (LM Studio, vLLM, LiteLLM тощо)

Приклад (OpenAI-сумісний):

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

Примітки:

- Для власних провайдерів `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими.
  Якщо їх не задано, OpenClaw використовує такі значення за замовчуванням:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендація: задавайте явні значення, які відповідають обмеженням вашого proxy/моделі.
- Для `api: "openai-completions"` на ненативних endpoint (будь-який непорожній `baseUrl`, хост якого не є `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникнути помилок 400 від провайдера через непідтримувані ролі `developer`.
- OpenAI-сумісні маршрути у стилі proxy також пропускають shaping запитів, доступний лише для нативного OpenAI:
  без `service_tier`, без `store` для Responses, без підказок prompt-cache, без
  формування payload для сумісності з OpenAI reasoning і без прихованих
  заголовків атрибуції OpenClaw.
- Якщо `baseUrl` порожній або не заданий, OpenClaw зберігає стандартну поведінку OpenAI (яка резолвиться до `api.openai.com`).
- Для безпеки навіть явне `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних endpoint `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Моделі](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Відмовостійкість моделей](/uk/concepts/model-failover) — ланцюжки fallback і поведінка повторних спроб
- [Довідник з конфігурації](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделей
- [Провайдери](/uk/providers) — посібники з налаштування для кожного провайдера
