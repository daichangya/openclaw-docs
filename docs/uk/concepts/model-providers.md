---
read_when:
    - Вам потрібен довідник з налаштування моделей для кожного провайдера окремо
    - Вам потрібні приклади конфігурацій або команди початкового налаштування CLI для провайдерів моделей
summary: Огляд провайдерів моделей із прикладами конфігурацій і сценаріями CLI
title: Провайдери моделей
x-i18n:
    generated_at: "2026-04-05T18:03:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24e6275b0bf137fa8143baa2a1d729439ecec6a0d7c0c14fed78c522f691476f
    source_path: concepts/model-providers.md
    workflow: 15
---

# Провайдери моделей

Ця сторінка описує **провайдерів LLM/моделей** (а не чат-канали на кшталт WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/concepts/models).

## Швидкі правила

- Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви задаєте `agents.defaults.models`, це стає allowlist.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Резервні правила середовища виконання, cooldown-перевірки та збереження перевизначень сесій
  задокументовані в [/concepts/model-failover](/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичний ліміт середовища виконання.
- Плагіни провайдерів можуть упроваджувати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об’єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести провайдерів можуть оголошувати `providerAuthEnvVars`, щоб загальним перевіркам
  автентифікації на основі env не потрібно було завантажувати runtime плагіна. Карта env-змінних, що лишається в ядрі,
  тепер призначена лише для неплагінових/ядрових провайдерів і кількох випадків загального пріоритету,
  наприклад початкового налаштування Anthropic з пріоритетом API-ключа.
- Плагіни провайдерів також можуть володіти runtime-поведінкою провайдера через
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, і
  `onModelSelected`.
- Примітка: runtime `capabilities` провайдера — це спільні метадані runner
  (сімейство провайдера, особливості транскрипту/інструментів, підказки щодо транспорту/кешу). Це не те саме, що [публічна модель можливостей](/plugins/architecture#public-capability-model),
  яка описує, що саме реєструє плагін (текстова інференція, мовлення тощо).

## Поведінка провайдера, що належить плагіну

Тепер плагіни провайдерів можуть володіти більшістю специфічної для провайдера логіки, тоді як OpenClaw зберігає
загальний цикл інференції.

Типовий поділ:

- `auth[].run` / `auth[].runNonInteractive`: провайдер володіє сценаріями onboarding/login
  для `openclaw onboard`, `openclaw models auth` і headless-налаштування
- `wizard.setup` / `wizard.modelPicker`: провайдер володіє мітками вибору автентифікації,
  застарілими псевдонімами, підказками allowlist під час onboarding і записами налаштування в onboarding/model pickers
- `catalog`: провайдер з’являється в `models.providers`
- `normalizeModelId`: провайдер нормалізує застарілі/preview ID моделей перед
  пошуком або канонізацією
- `normalizeTransport`: провайдер нормалізує `api` / `baseUrl` сімейства транспорту
  перед загальним складанням моделі; OpenClaw спочатку перевіряє відповідного провайдера,
  потім інші плагіни провайдерів із підтримкою hook, доки один із них справді не змінить
  транспорт
- `normalizeConfig`: провайдер нормалізує конфігурацію `models.providers.<id>` перед
  використанням runtime; OpenClaw спочатку перевіряє відповідного провайдера, потім інші
  плагіни провайдерів із підтримкою hook, доки один із них справді не змінить конфігурацію. Якщо жоден
  hook провайдера не переписує конфігурацію, вбудовані допоміжні засоби сімейства Google все одно
  нормалізують підтримувані записи провайдерів Google.
- `applyNativeStreamingUsageCompat`: провайдер застосовує переписування сумісності native streaming usage, продиктовані endpoint, для конфігураційних провайдерів
- `resolveConfigApiKey`: провайдер визначає автентифікацію через env-marker для конфігураційних провайдерів
  без примусового завантаження повної runtime-автентифікації. `amazon-bedrock` також має
  вбудований AWS env-marker resolver тут, хоча runtime-автентифікація Bedrock використовує
  стандартний AWS SDK default chain.
- `resolveSyntheticAuth`: провайдер може показувати доступність локальної/self-hosted або іншої
  автентифікації на основі конфігурації без збереження відкритих секретів
- `shouldDeferSyntheticProfileAuth`: провайдер може позначати збережені синтетичні placeholder-профілі
  як менш пріоритетні, ніж автентифікація з env/конфігурації
- `resolveDynamicModel`: провайдер приймає ID моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: провайдеру потрібно оновити метадані перед повторною спробою
  динамічного визначення
- `normalizeResolvedModel`: провайдер потребує переписування транспорту або base URL
- `contributeResolvedModelCompat`: провайдер додає прапорці сумісності для своїх
  vendor-моделей, навіть якщо вони надходять через інший сумісний транспорт
- `capabilities`: провайдер публікує особливості транскрипту/інструментів/сімейства провайдера
- `normalizeToolSchemas`: провайдер очищує схеми інструментів перед тим, як їх побачить
  вбудований runner
- `inspectToolSchemas`: провайдер показує попередження про схему, специфічні для транспорту,
  після нормалізації
- `resolveReasoningOutputMode`: провайдер обирає native або tagged-контракти
  виводу reasoning
- `prepareExtraParams`: провайдер задає типові значення або нормалізує параметри запиту для кожної моделі
- `createStreamFn`: провайдер замінює звичайний шлях потоку на повністю
  кастомний транспорт
- `wrapStreamFn`: провайдер застосовує обгортки сумісності заголовків/тіла/моделі запиту
- `resolveTransportTurnState`: провайдер постачає native заголовки або метадані
  транспорту для кожного ходу
- `resolveWebSocketSessionPolicy`: провайдер постачає native заголовки WebSocket-сеансу
  або політику cool-down сеансу
- `createEmbeddingProvider`: провайдер володіє поведінкою memory embedding, коли вона
  має належати плагіну провайдера, а не основному switchboard embedding
- `formatApiKey`: провайдер форматує збережені профілі автентифікації у runtime-рядок
  `apiKey`, очікуваний транспортом
- `refreshOAuth`: провайдер володіє оновленням OAuth, коли спільних refreshers із `pi-ai`
  недостатньо
- `buildAuthDoctorHint`: провайдер додає підказку з виправлення, коли оновлення OAuth
  зазнає невдачі
- `matchesContextOverflowError`: провайдер розпізнає специфічні для провайдера
  помилки переповнення context window, які пропустили б загальні евристики
- `classifyFailoverReason`: провайдер зіставляє сирі помилки транспорту/API, специфічні для провайдера,
  з причинами failover, як-от rate limit або overload
- `isCacheTtlEligible`: провайдер визначає, які upstream ID моделей підтримують prompt-cache TTL
- `buildMissingAuthMessage`: провайдер замінює загальну помилку auth-store
  на специфічну для провайдера підказку відновлення
- `suppressBuiltInModel`: провайдер приховує застарілі upstream-рядки й може повертати
  помилку, що належить vendor, для прямих помилок визначення
- `augmentModelCatalog`: провайдер додає синтетичні/фінальні рядки каталогу після
  виявлення та об’єднання конфігурації
- `isBinaryThinking`: провайдер володіє UX двійкового thinking увімк./вимк.
- `supportsXHighThinking`: провайдер додає вибраним моделям підтримку `xhigh`
- `resolveDefaultThinkingLevel`: провайдер володіє типовою політикою `/think` для
  сімейства моделей
- `applyConfigDefaults`: провайдер застосовує глобальні типові значення, специфічні для провайдера,
  під час матеріалізації конфігурації на основі режиму автентифікації, env або сімейства моделі
- `isModernModelRef`: провайдер володіє зіставленням бажаних live/smoke-моделей
- `prepareRuntimeAuth`: провайдер перетворює налаштовані облікові дані на короткоживучий
  runtime-токен
- `resolveUsageAuth`: провайдер визначає облікові дані usage/quota для `/usage`
  і пов’язаних поверхонь статусу/звітності
- `fetchUsageSnapshot`: провайдер володіє отриманням/парсингом endpoint usage, тоді як
  ядро все ще володіє оболонкою підсумку й форматуванням
- `onModelSelected`: провайдер виконує побічні дії після вибору моделі, як-от
  телеметрія або службова логіка сеансу, що належить провайдеру

Поточні вбудовані приклади:

- `anthropic`: резервна сумісність уперед Claude 4.6, підказки з відновлення автентифікації, отримання
  usage endpoint, метадані cache-TTL/сімейства провайдера та глобальні типові
  значення конфігурації з урахуванням автентифікації
- `amazon-bedrock`: визначення переповнення контексту, що належить провайдеру, і класифікація
  причин failover для специфічних Bedrock помилок throttle/not-ready, а також спільне сімейство відтворення `anthropic-by-model`
  для захистів replay-policy лише для Claude на трафіку Anthropic
- `anthropic-vertex`: захисти replay-policy лише для Claude на трафіку
  повідомлень Anthropic
- `openrouter`: прямі ID моделей, обгортки запитів, підказки про можливості провайдера,
  очищення Gemini thought-signature на проксі-трафіку Gemini, упровадження proxy reasoning
  через сімейство потоку `openrouter-thinking`, пересилання метаданих маршрутизації
  та політика cache-TTL
- `github-copilot`: onboarding/device login, резервна сумісність моделі вперед,
  підказки транскрипту Claude-thinking, обмін runtime-токенами та отримання
  usage endpoint
- `openai`: резервна сумісність GPT-5.4 уперед, пряма нормалізація транспорту OpenAI,
  підказки відсутньої автентифікації з урахуванням Codex, приглушення Spark, синтетичні
  рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація псевдонімів usage-token
  (`input` / `output` і сімейства `prompt` / `completion`), спільне сімейство потоку
  `openai-responses-defaults` для native OpenAI/Codex-обгорток і метадані сімейства провайдера
- `google`: резервна сумісність Gemini 3.1 уперед, native перевірка replay
  Gemini, очищення bootstrap replay, tagged-режим виводу reasoning і
  зіставлення modern-model
- `moonshot`: спільний транспорт, нормалізація thinking payload, що належить плагіну
- `kilocode`: спільний транспорт, заголовки запиту, що належать плагіну, нормалізація reasoning payload,
  очищення proxy-Gemini thought-signature і політика cache-TTL
- `zai`: резервна сумісність GLM-5 уперед, типові значення `tool_stream`, політика cache-TTL,
  політика binary-thinking/live-model і usage auth + отримання квот; невідомі `glm-5*`
  синтезуються з вбудованого шаблону `glm-4.7`
- `xai`: нормалізація native транспорту Responses, переписування псевдонімів `/fast`
  для швидких варіантів Grok, типове `tool_stream` і очищення схеми інструментів /
  payload reasoning, специфічне для xAI
- `mistral`: метадані можливостей, що належать плагіну
- `opencode` і `opencode-go`: метадані можливостей, що належать плагіну, плюс
  очищення proxy-Gemini thought-signature
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi`,
  `nvidia`, `qianfan`, `stepfun`, `synthetic`, `together`, `venice`,
  `vercel-ai-gateway` і `volcengine`: лише каталоги, що належать плагіну
- `qwen`: каталоги текстових моделей, що належать плагіну, плюс спільні
  реєстрації провайдерів media-understanding і video-generation для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні video endpoint DashScope із вбудованими моделями Wan, як-от `wan2.6-t2v` і `wan2.7-r2v`
- `minimax`: каталоги, що належать плагіну, вибір гібридної Anthropic/OpenAI replay-policy,
  і логіка usage auth/snapshot
- `xiaomi`: каталоги, що належать плагіну, плюс логіка usage auth/snapshot

Вбудований плагін `openai` тепер володіє обома ID провайдерів: `openai` і
`openai-codex`.

Це охоплює провайдерів, які все ще вписуються в звичайні транспорти OpenClaw. Провайдер,
якому потрібен повністю кастомний виконавець запитів, — це окрема, глибша поверхня розширення.

## Ротація API-ключів

- Підтримує загальну ротацію провайдерів для вибраних провайдерів.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для провайдерів Google також включено резервний варіант `GOOGLE_API_KEY`.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на rate-limit
  (наприклад `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
- Помилки, не пов’язані з rate limit, одразу завершуються помилкою; ротація ключів не виконується.
- Якщо всі кандидатні ключі не спрацьовують, повертається фінальна помилка з останньої спроби.

## Вбудовані провайдери (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих провайдерів **не потрібна**
конфігурація `models.providers`; достатньо задати автентифікацію й вибрати модель.

### OpenAI

- Провайдер: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий транспорт — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для конкретної моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Warm-up OpenAI Responses WebSocket типово ввімкнено через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити `openai/*` Responses із `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до native-трафіку OpenAI до `api.openai.com`, а не до
  загальних OpenAI-сумісних проксі
- Native-маршрути OpenAI також зберігають Responses `store`, підказки prompt-cache і
  формування payload reasoning-compat OpenAI; проксі-маршрути цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live API OpenAI його відхиляє; Spark розглядається як лише Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Провайдер: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic також підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком, автентифікованим через API-ключ і OAuth, надісланим до `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо тарифікації: для Anthropic в OpenClaw практичний поділ — це **API key** або **підписка Claude з Extra Usage**. Anthropic повідомила користувачів OpenClaw **4 квітня 2026 року о 12:00 PM PT / 8:00 PM BST**, що шлях входу Claude через **OpenClaw** вважається використанням через сторонній harness і потребує **Extra Usage**, що тарифікується окремо від підписки. Наші локальні відтворення також показують, що ідентифікаційний рядок промпту OpenClaw не відтворюється на шляху Anthropic SDK + API key.
- Setup-token Anthropic знову доступний як застарілий/ручний шлях OpenClaw. Використовуйте його з розумінням, що Anthropic повідомила користувачам OpenClaw, що цей шлях потребує **Extra Usage**.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Провайдер: `openai-codex`
- Автентифікація: OAuth (ChatGPT)
- Приклад моделі: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Типовий транспорт — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для конкретної моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в native-запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише на native-трафіку Codex до
  `chatgpt.com/backend-api`, а не до загальних OpenAI-сумісних проксі
- Використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` лишається доступною, коли каталог Codex OAuth її показує; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає native `contextWindow = 1050000` і типове runtime `contextTokens = 272000`; перевизначте runtime-ліміт через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/сценаріїв, таких як OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Інші hosted-варіанти в стилі підписки

- [Qwen Cloud](/providers/qwen): поверхня провайдера Qwen Cloud плюс зіставлення endpoint Alibaba DashScope і Coding Plan
- [MiniMax](/providers/minimax): доступ через MiniMax Coding Plan OAuth або API key
- [GLM Models](/providers/glm): Z.AI Coding Plan або загальні API endpoint

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
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
- Автентифікація: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застарілий `cached_content`) для пересилання нативного для провайдера
  дескриптора `cachedContents/...`; cache hit Gemini відображаються як `cacheRead` в OpenClaw

### Google Vertex

- Провайдер: `google-vertex`
- Автентифікація: gcloud ADC
  - JSON-відповіді Gemini CLI парсяться з `response`; usage резервно береться зі
    `stats`, а `stats.cached` нормалізується в `cacheRead` OpenClaw.

### Z.AI (GLM)

- Провайдер: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово вибирають конкретну поверхню

### Vercel AI Gateway

- Провайдер: `vercel-ai-gateway`
- Автентифікація: `AI_GATEWAY_API_KEY`
- Приклад моделі: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Провайдер: `kilocode`
- Автентифікація: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог містить `kilocode/kilo/auto`; live-виявлення
  `https://api.kilo.ai/api/gateway/models` може додатково розширити runtime-каталог.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Докладніше про налаштування див. у [/providers/kilocode](/providers/kilocode).

### Інші вбудовані плагіни провайдерів

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані OpenRouter заголовки атрибуції застосунку лише тоді,
  коли запит справді спрямовано до `openrouter.ai`
- Специфічні для OpenRouter маркери Anthropic `cache_control` так само обмежені
  перевіреними маршрутами OpenRouter, а не довільними проксі-URL
- OpenRouter лишається на проксі-стилі OpenAI-сумісного шляху, тому native-формування запитів лише для OpenAI (`serviceTier`, Responses `store`,
  підказки prompt-cache, payload reasoning-compat OpenAI) не пересилається
- Посилання OpenRouter на базі Gemini зберігають лише очищення proxy-Gemini thought-signature;
  native-перевірка replay Gemini й переписування bootstrap лишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на базі Gemini зберігають той самий шлях очищення proxy-Gemini thought-signature; `kilocode/kilo/auto` та інші підказки без підтримки proxy-reasoning
  пропускають упровадження proxy reasoning
- MiniMax: `minimax` (API key) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Початкове налаштування/API key MiniMax записує явні визначення моделей M2.7 з
  `input: ["text", "image"]`; вбудований каталог провайдера зберігає chat-посилання
  лише текстовими, доки не буде матеріалізовано конфігурацію цього провайдера
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Приклад моделі: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi` (`KIMI_API_KEY` або `KIMICODE_API_KEY`)
- Приклад моделі: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Приклад моделі: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` або `DASHSCOPE_API_KEY`)
- Приклад моделі: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Приклад моделі: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Приклади моделей: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Приклад моделі: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Приклад моделі: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Приклад моделі: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Приклад моделі: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Native вбудовані запити xAI використовують шлях xAI Responses
  - `/fast` або `params.fastMode: true` переписують `grok-3`, `grok-3-mini`,
    `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`
  - `tool_stream` типово ввімкнено; задайте
    `agents.defaults.models["xai/<model>"].params.tool_stream` як `false`, щоб
    вимкнути його
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Приклад моделі: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Моделі GLM у Cerebras використовують ID `zai-glm-4.7` і `zai-glm-4.6`.
  - OpenAI-сумісний base URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Див. [Hugging Face (Inference)](/providers/huggingface).

## Провайдери через `models.providers` (кастомний/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додавати **кастомних** провайдерів або
OpenAI/Anthropic‑сумісні проксі.

Багато з вбудованих нижче плагінів провайдерів уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований плагін провайдера. Використовуйте вбудований провайдер
типово й додавайте явний запис `models.providers.moonshot` лише тоді, коли вам
потрібно перевизначити base URL або метадані моделі:

- Провайдер: `moonshot`
- Автентифікація: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` або `openclaw onboard --auth-choice moonshot-api-key-cn`

ID моделей Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding використовує Anthropic-сумісний endpoint Moonshot AI:

- Провайдер: `kimi`
- Автентифікація: `KIMI_API_KEY`
- Приклад моделі: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Застарілий `kimi/k2p5` і далі приймається як сумісний ID моделі.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) надає доступ до Doubao та інших моделей у Китаї.

- Провайдер: `volcengine` (coding: `volcengine-plan`)
- Автентифікація: `VOLCANO_ENGINE_API_KEY`
- Приклад моделі: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding типово використовує coding-поверхню, але загальний каталог `volcengine/*`
реєструється одночасно.

У onboarding/configure model pickers вибір автентифікації Volcengine віддає перевагу і
рядкам `volcengine/*`, і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
picker, обмеженого провайдером.

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

- Провайдер: `byteplus` (coding: `byteplus-plan`)
- Автентифікація: `BYTEPLUS_API_KEY`
- Приклад моделі: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding типово використовує coding-поверхню, але загальний каталог `byteplus/*`
реєструється одночасно.

У onboarding/configure model pickers вибір автентифікації BytePlus віддає перевагу і
рядкам `byteplus/*`, і `byteplus-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
picker, обмеженого провайдером.

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

Synthetic надає Anthropic-сумісні моделі через провайдера `synthetic`:

- Провайдер: `synthetic`
- Автентифікація: `SYNTHETIC_API_KEY`
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

MiniMax налаштовується через `models.providers`, оскільки використовує кастомні endpoint:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Докладніше про налаштування, параметри моделей і приклади конфігурації див. в [/providers/minimax](/providers/minimax).

На Anthropic-сумісному streaming-шляху MiniMax OpenClaw типово вимикає thinking,
якщо ви явно його не задали, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Поділ можливостей, що належать плагіну:

- Типові значення для тексту/чату лишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, що належить плагіну на обох шляхах автентифікації MiniMax
- Вебпошук лишається на ID провайдера `minimax`

### Ollama

Ollama постачається як вбудований плагін провайдера й використовує нативний API Ollama:

- Провайдер: `ollama`
- Автентифікація: не потрібна (локальний сервер)
- Приклад моделі: `ollama/llama3.3`
- Установлення: [https://ollama.com/download](https://ollama.com/download)

```bash
# Установіть Ollama, потім завантажте модель:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama локально виявляється за адресою `http://127.0.0.1:11434`, коли ви явно вмикаєте це через
`OLLAMA_API_KEY`, а вбудований плагін провайдера додає Ollama безпосередньо до
`openclaw onboard` і model picker. Див. [/providers/ollama](/providers/ollama)
щодо onboarding, cloud/local mode і кастомної конфігурації.

### vLLM

vLLM постачається як вбудований плагін провайдера для локальних/self-hosted OpenAI-сумісних
серверів:

- Провайдер: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:8000/v1`

Щоб увімкнути автоматичне локальне виявлення (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один з ID, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Докладніше див. у [/providers/vllm](/providers/vllm).

### SGLang

SGLang постачається як вбудований плагін провайдера для швидких self-hosted
OpenAI-сумісних серверів:

- Провайдер: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:30000/v1`

Щоб увімкнути автоматичне локальне виявлення (підійде будь-яке значення, якщо ваш сервер не
вимагає автентифікації):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один з ID, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Докладніше див. у [/providers/sglang](/providers/sglang).

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
        apiKey: "LMSTUDIO_KEY",
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

- Для кастомних провайдерів `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` необов’язкові.
  Якщо їх пропущено, OpenClaw типово використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, що відповідають обмеженням вашого проксі/моделі.
- Для `api: "openai-completions"` на не-native endpoint (будь-який непорожній `baseUrl`, чий host не дорівнює `api.openai.com`), OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникнути помилок провайдера 400 через непідтримувані ролі `developer`.
- Маршрути OpenAI-сумісного проксі-стилю також пропускають native-формування запитів лише для OpenAI: без `service_tier`, без Responses `store`, без підказок prompt-cache, без формування payload reasoning-compat OpenAI та без прихованих заголовків атрибуції OpenClaw.
- Якщо `baseUrl` порожній або пропущений, OpenClaw зберігає типову поведінку OpenAI (яка визначається як `api.openai.com`).
- З міркувань безпеки явне `compat.supportsDeveloperRole: true` усе одно перевизначається на не-native endpoint `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Моделі](/concepts/models) — конфігурація моделей і псевдоніми
- [Failover моделей](/concepts/model-failover) — резервні ланцюжки й поведінка повторних спроб
- [Довідник із конфігурації](/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделей
- [Провайдери](/providers) — посібники з налаштування для кожного провайдера
