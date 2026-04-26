---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Вам потрібні приклади конфігурацій або команди онбордингу CLI для постачальників моделей
summary: Огляд постачальників моделей із прикладами конфігурацій + потоками CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-26T03:02:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75d0e89c35d46b0c3ecd4a180ca25bb1cdf45cee8dd09d73657517927e7bc220
    source_path: concepts/model-providers.md
    workflow: 15
---

Довідник для **постачальників LLM/моделей** (а не чат-каналів на кшталт WhatsApp/Telegram). Правила вибору моделі див. у [Моделі](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
- `agents.defaults.models` працює як allowlist, якщо його задано.
- Допоміжні CLI-команди: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі; `contextTokens` — це фактичне обмеження під час виконання.
- Правила резервного перемикання, cooldown-перевірки та збереження перевизначень сесії див. у [Резервне перемикання моделей](/uk/concepts/model-failover).
- Маршрути сімейства OpenAI залежать від префікса: `openai/<model>` використовує прямого постачальника API-ключів OpenAI у PI, `openai-codex/<model>` використовує Codex OAuth у PI, а `openai/<model>` разом із `agents.defaults.embeddedHarness.runtime: "codex"` використовує нативний app-server harness Codex. Див. [OpenAI](/uk/providers/openai) і [Codex harness](/uk/plugins/codex-harness). Якщо поділ між постачальником і runtime заплутаний, спочатку прочитайте [Runtimes агента](/uk/concepts/agent-runtimes).
- Автоувімкнення Plugin дотримується тієї ж межі: `openai-codex/<model>` належить Plugin OpenAI, тоді як Plugin Codex вмикається через `embeddedHarness.runtime: "codex"` або застарілі посилання `codex/<model>`.
- CLI runtimes використовують той самий поділ: обирайте канонічні посилання на моделі, як-от `anthropic/claude-*`, `google/gemini-*` або `openai/gpt-*`, а потім задавайте `agents.defaults.embeddedHarness.runtime` як `claude-cli`, `google-gemini-cli` або `codex-cli`, якщо хочете локальний CLI-бекенд. Застарілі посилання `claude-cli/*`, `google-gemini-cli/*` і `codex-cli/*` мігрують назад до канонічних посилань постачальника, а runtime записується окремо.
- GPT-5.5 доступна через `openai/gpt-5.5` для прямого трафіку за API-ключем, `openai-codex/gpt-5.5` у PI для Codex OAuth, а також через нативний app-server harness Codex, якщо задано `embeddedHarness.runtime: "codex"`.

## Поведінка постачальників, якою керує Plugin

Більшість специфічної для постачальника логіки живе в Plugin постачальників (`registerProvider(...)`), тоді як OpenClaw зберігає загальний цикл inference. Plugins керують онбордингом, каталогами моделей, зіставленням auth env vars, нормалізацією транспорту/конфігурації, очищенням схем інструментів, класифікацією failover, оновленням OAuth, звітністю про використання, профілями thinking/reasoning тощо.

Повний список хуків provider-SDK та прикладів вбудованих Plugin наведено в [Provider plugins](/uk/plugins/sdk-provider-plugins). Якщо постачальнику потрібен повністю власний виконавець запитів, це вже окрема, глибша поверхня розширення.

<Note>
`capabilities` runtime постачальника — це спільні метадані runner-а (сімейство постачальника, особливості transcript/tooling, підказки щодо транспорту/кешу). Це не те саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model), яка описує, що реєструє Plugin (текстовий inference, мовлення тощо).
</Note>

## Ротація API-ключів

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google `GOOGLE_API_KEY` також використовується як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на rate-limit помилки (наприклад, `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
- Помилки, не пов’язані з rate-limit, одразу завершуються невдачею; ротація ключів не виконується.
- Коли всі доступні ключі не спрацювали, повертається остання помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих постачальників **не потрібна**
конфігурація `models.providers`; достатньо налаштувати auth і вибрати модель.

### OpenAI

- Постачальник: `openai`
- Auth: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Перевірте доступність облікового запису/моделі за допомогою `openclaw models list --provider openai`,
  якщо конкретна інсталяція або API-ключ поводиться інакше.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Транспорт за замовчуванням — `auto` (спочатку WebSocket, потім резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Прогрівання OpenAI Responses WebSocket за замовчуванням увімкнено через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` напряму відображають запити `openai/*` Responses у `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо потрібен явний tier замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не
  до звичайних OpenAI-сумісних проксі
- Нативні маршрути OpenAI також зберігають `store` Responses, підказки кешу prompt і
  формування payload для сумісності з reasoning OpenAI; проксі-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приховано в OpenClaw, оскільки live-запити до OpenAI API його відхиляють, а поточний каталог Codex його не показує

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком за API-ключем та OAuth-аутентифікацією, надісланим до `api.anthropic.com`; OpenClaw відображає це в Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне використання Claude CLI та використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup-token Anthropic і далі доступний як підтримуваний шлях токена в OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI та `claude -p`, якщо вони доступні.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Постачальник: `openai-codex`
- Auth: OAuth (ChatGPT)
- Посилання на модель PI: `openai-codex/gpt-5.5`
- Посилання нативного app-server harness Codex: `openai/gpt-5.5` з `agents.defaults.embeddedHarness.runtime: "codex"`
- Документація нативного app-server harness Codex: [Codex harness](/uk/plugins/codex-harness)
- Застарілі посилання на моделі: `codex/gpt-*`
- Межа Plugin: `openai-codex/*` завантажує Plugin OpenAI; нативний Plugin app-server Codex обирається лише через runtime Codex harness або застарілі
  посилання `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Транспорт за замовчуванням — `auto` (спочатку WebSocket, потім резервно SSE)
- Перевизначення для окремої моделі PI через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також передається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до звичайних OpenAI-сумісних проксі
- Використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw відображає це в `service_tier=priority`
- `openai-codex/gpt-5.5` використовує нативний для каталогу Codex `contextWindow = 400000` і runtime за замовчуванням `contextTokens = 272000`; перевизначте runtime-обмеження через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/процесів на кшталт OpenClaw.
- Використовуйте `openai-codex/gpt-5.5`, якщо вам потрібен маршрут Codex OAuth/підписки; використовуйте `openai/gpt-5.5`, якщо ваша конфігурація API-ключа та локальний каталог показують маршрут публічного API.

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

- [Qwen Cloud](/uk/providers/qwen): поверхня постачальника Qwen Cloud, а також зіставлення кінцевих точок Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): OAuth MiniMax Coding Plan або доступ за API-ключем
- [GLM models](/uk/providers/glm): Z.AI Coding Plan або загальні API-ендпоїнти

### OpenCode

- Auth: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Постачальник runtime Zen: `opencode`
- Постачальник runtime Go: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-ключ)

- Постачальник: `google`
- Auth: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний варіант `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` використовує динамічне thinking Google. Gemini 3/3.1 не мають фіксованого
  `thinkingLevel`; Gemini 2.5 надсилає `thinkingBudget: -1`.
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застарілий `cached_content`) для передавання нативного
  хендла постачальника `cachedContents/...`; збіги кешу Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Auth: Vertex використовує gcloud ADC; Gemini CLI використовує власний OAuth-потік
- Застереження: OAuth Gemini CLI в OpenClaw — неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікового запису Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
- Gemini CLI OAuth постачається як частина вбудованого Plugin `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкніть: `openclaw plugins enable google`
  - Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: **не** вставляйте client id або secret у `openclaw.json`. Потік входу CLI зберігає
    токени в auth-профілях на хості Gateway.
  - Якщо після входу запити завершуються помилкою, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  - JSON-відповіді Gemini CLI аналізуються з `response`; використання резервно береться з
    `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Auth: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Аліаси: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідну кінцеву точку Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово задають конкретну поверхню

### Vercel AI Gateway

- Постачальник: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Приклади моделей: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Постачальник: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Базовий URL: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live-виявлення через
  `https://api.kilo.ai/api/gateway/models` може додатково розширити runtime-каталог.
- Точна висхідна маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко задана в OpenClaw.

Деталі налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані Provider plugins

| Постачальник            | Id                               | Auth env                                                     | Приклад моделі                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                              |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                   |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                            |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                       |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                         |

Корисні особливості:

- **OpenRouter** застосовує свої заголовки атрибуції застосунку та маркери Anthropic `cache_control` лише на перевірених маршрутах `openrouter.ai`. Посилання DeepSeek, Moonshot і ZAI придатні для cache-TTL у керованому OpenRouter кешуванні prompt, але не отримують маркерів кешу Anthropic. Як OpenAI-сумісний шлях у стилі проксі, він пропускає формування, притаманне лише нативному OpenAI (`serviceTier`, Responses `store`, підказки кешу prompt, сумісність reasoning OpenAI). Посилання на основі Gemini зберігають лише очищення thought-signature для проксі Gemini.
- **Kilo Gateway** для посилань на основі Gemini використовує той самий шлях очищення проксі Gemini; `kilocode/kilo/auto` та інші посилання, де proxy reasoning не підтримується, пропускають ін’єкцію proxy reasoning.
- **MiniMax** онбординг за API-ключем записує явні текстові визначення моделей чату M2.7; розпізнавання зображень залишається на медіа-постачальнику `MiniMax-VL-01`, яким керує Plugin.
- **xAI** використовує шлях xAI Responses. `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`, `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`. `tool_stream` за замовчуванням увімкнено; вимкніть через `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** моделі GLM використовують `zai-glm-4.7` / `zai-glm-4.6`; OpenAI-сумісний базовий URL — `https://api.cerebras.ai/v1`.

## Постачальники через `models.providers` (custom/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **власні** постачальники або
OpenAI/Anthropic‑сумісні проксі.

Багато з наведених нижче вбудованих Provider plugins уже публікують каталог за замовчуванням.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
базовий URL, заголовки або список моделей за замовчуванням.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований Provider plugin. Використовуйте вбудованого постачальника
за замовчуванням і додавайте явний запис `models.providers.moonshot` лише тоді, коли
потрібно перевизначити базовий URL або метадані моделі:

- Постачальник: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` або `openclaw onboard --auth-choice moonshot-api-key-cn`

Ідентифікатори моделей Kimi K2:

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

Kimi Coding використовує Anthropic-сумісну кінцеву точку Moonshot AI:

- Постачальник: `kimi`
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

Застарілий `kimi/k2p5` і далі приймається як сумісний ідентифікатор моделі.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) надає доступ до Doubao та інших моделей у Китаї.

- Постачальник: `volcengine` (coding: `volcengine-plan`)
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

Онбординг за замовчуванням використовує coding-поверхню, але загальний каталог `volcengine/*`
реєструється одночасно.

У засобах вибору моделі для онбордингу/налаштування варіант auth для Volcengine віддає перевагу і рядкам
`volcengine/*`, і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
засобу вибору в межах постачальника.

Доступні моделі:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Coding-моделі (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (міжнародний)

BytePlus ARK надає міжнародним користувачам доступ до тих самих моделей, що й Volcano Engine.

- Постачальник: `byteplus` (coding: `byteplus-plan`)
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

Онбординг за замовчуванням використовує coding-поверхню, але загальний каталог `byteplus/*`
реєструється одночасно.

У засобах вибору моделі для онбордингу/налаштування варіант auth для BytePlus віддає перевагу і рядкам
`byteplus/*`, і `byteplus-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
засобу вибору в межах постачальника.

Доступні моделі:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Coding-моделі (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic надає Anthropic-сумісні моделі через постачальника `synthetic`:

- Постачальник: `synthetic`
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

MiniMax налаштовується через `models.providers`, оскільки використовує власні кінцеві точки:

- MiniMax OAuth (глобально): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (глобально): `--auth-choice minimax-global-api`
- API-ключ MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

На Anthropic-сумісному streaming-шляху MiniMax OpenClaw вимикає thinking
за замовчуванням, якщо ви явно його не задасте, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Поділ можливостей, якими керує Plugin:

- За замовчуванням текст/чат залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розпізнавання зображень — це `MiniMax-VL-01`, яким керує Plugin, на обох шляхах auth MiniMax
- Вебпошук залишається на id постачальника `minimax`

### LM Studio

LM Studio постачається як вбудований Provider plugin, який використовує нативний API:

- Постачальник: `lmstudio`
- Auth: `LM_API_TOKEN`
- Базовий URL inference за замовчуванням: `http://localhost:1234/v1`

Потім задайте модель (замініть на один з ідентифікаторів, повернених `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `LM Studio` `/api/v1/models` і `/api/v1/models/load`
для виявлення та автозавантаження, а `/v1/chat/completions` — для inference за замовчуванням.
Деталі налаштування та усунення несправностей див. у [/providers/lmstudio](/uk/providers/lmstudio).

### Ollama

Ollama постачається як вбудований Provider plugin і використовує нативний API Ollama:

- Постачальник: `ollama`
- Auth: не потрібен (локальний сервер)
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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, якщо ви увімкнете її через
`OLLAMA_API_KEY`, а вбудований Provider plugin додає Ollama безпосередньо до
`openclaw onboard` і засобу вибору моделі. Див. [/providers/ollama](/uk/providers/ollama)
для онбордингу, хмарного/локального режиму та власної конфігурації.

### vLLM

vLLM постачається як вбудований Provider plugin для локальних/self-hosted OpenAI-сумісних
серверів:

- Постачальник: `vllm`
- Auth: необов’язковий (залежить від вашого сервера)
- Базовий URL за замовчуванням: `http://127.0.0.1:8000/v1`

Щоб локально увімкнути автоматичне виявлення (підійде будь-яке значення, якщо ваш сервер не вимагає auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один з ідентифікаторів, повернених `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Деталі див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований Provider plugin для швидких self-hosted
OpenAI-сумісних серверів:

- Постачальник: `sglang`
- Auth: необов’язковий (залежить від вашого сервера)
- Базовий URL за замовчуванням: `http://127.0.0.1:30000/v1`

Щоб локально увімкнути автоматичне виявлення (підійде будь-яке значення, якщо ваш сервер не
вимагає auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один з ідентифікаторів, повернених `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Деталі див. у [/providers/sglang](/uk/providers/sglang).

### Локальні проксі (LM Studio, vLLM, LiteLLM тощо)

Приклад (OpenAI‑сумісний):

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

- Для custom-постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` необов’язкові.
  Якщо їх не вказано, OpenClaw використовує такі значення за замовчуванням:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, що відповідають лімітам вашого проксі/моделі.
- Для `api: "openai-completions"` на ненативних ендпоїнтах (будь-який непорожній `baseUrl`, хост якого не є `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок постачальника 400 через непідтримувані ролі `developer`.
- OpenAI-сумісні маршрути у стилі проксі також пропускають формування запитів, притаманне лише нативному OpenAI:
  без `service_tier`, без Responses `store`, без Completions `store`, без
  підказок кешу prompt, без формування payload для сумісності reasoning OpenAI та без прихованих
  заголовків атрибуції OpenClaw.
- Для OpenAI-сумісних проксі Completions, яким потрібні поля, специфічні для постачальника,
  задайте `agents.defaults.models["provider/model"].params.extra_body` (або
  `extraBody`), щоб об’єднати додатковий JSON у вихідне тіло запиту.
- Для керування chat-template у vLLM задайте
  `agents.defaults.models["provider/model"].params.chat_template_kwargs`.
  OpenClaw автоматично надсилає `enable_thinking: false` і
  `force_nonempty_content: true` для `vllm/nemotron-3-*`, коли в сесії
  рівень thinking вимкнено.
- Якщо `baseUrl` порожній або не вказаний, OpenClaw зберігає поведінку OpenAI за замовчуванням (яка зводиться до `api.openai.com`).
- Для безпеки явний `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних ендпоїнтах `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [Configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язані матеріали

- [Models](/uk/concepts/models) — конфігурація моделей і аліаси
- [Model failover](/uk/concepts/model-failover) — ланцюжки резервного перемикання та поведінка повторних спроб
- [Configuration reference](/uk/gateway/config-agents#agent-defaults) — ключі конфігурації моделі
- [Providers](/uk/providers) — посібники з налаштування для кожного постачальника
