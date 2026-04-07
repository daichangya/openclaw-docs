---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного провайдера окремо
    - Вам потрібні приклади конфігурацій або команд онбордингу CLI для провайдерів моделей
summary: Огляд провайдерів моделей із прикладами конфігурацій + потоками CLI
title: Провайдери моделей
x-i18n:
    generated_at: "2026-04-07T09:39:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26b36a2bc19a28a7ef39aa8e81a0050fea1d452ac4969122e5cdf8755e690258
    source_path: concepts/model-providers.md
    workflow: 15
---

# Провайдери моделей

Ця сторінка охоплює **провайдерів LLM/моделей** (а не канали чату, як-от WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви задаєте `agents.defaults.models`, це стає allowlist.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Резервні правила часу виконання, cooldown-проби та збереження session-override
  задокументовано в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі;
  `models.providers.*.models[].contextTokens` — це ефективне обмеження під час виконання.
- Плагіни провайдерів можуть інжектувати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об’єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести провайдерів можуть оголошувати `providerAuthEnvVars`, щоб загальним env-based
  перевіркам автентифікації не потрібно було завантажувати runtime плагіна. Решта core-мапи env-var
  тепер використовується лише для не-плагінних/core провайдерів і кількох випадків загального пріоритету,
  як-от онбординг Anthropic із пріоритетом API-ключа.
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
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, та
  `onModelSelected`.
- Примітка: runtime-`capabilities` провайдера — це спільні метадані раннера (сімейство провайдера,
  особливості transcript/tooling, підказки щодо transport/cache). Це не те саме, що
  [публічна модель можливостей](/uk/plugins/architecture#public-capability-model),
  яка описує, що реєструє плагін (текстова інференція, мовлення тощо).

## Поведінка провайдера, що належить плагіну

Тепер плагіни провайдерів можуть володіти більшістю провайдер-специфічної логіки, тоді як OpenClaw зберігає
загальний цикл інференції.

Типовий розподіл:

- `auth[].run` / `auth[].runNonInteractive`: провайдер володіє потоками онбордингу/входу
  для `openclaw onboard`, `openclaw models auth` і headless-налаштування
- `wizard.setup` / `wizard.modelPicker`: провайдер володіє мітками вибору автентифікації,
  legacy-аліасами, підказками allowlist для онбордингу та записами налаштування в онбордингу/model picker
- `catalog`: провайдер з’являється в `models.providers`
- `normalizeModelId`: провайдер нормалізує legacy/preview id моделей перед
  пошуком або канонізацією
- `normalizeTransport`: провайдер нормалізує `api` / `baseUrl` сімейства transport
  перед загальним складанням моделі; OpenClaw спочатку перевіряє відповідний провайдер,
  потім інші плагіни провайдерів, що підтримують hook, доки один із них справді не змінить
  transport
- `normalizeConfig`: провайдер нормалізує конфігурацію `models.providers.<id>` перед
  використанням у runtime; OpenClaw спочатку перевіряє відповідний провайдер, потім інші
  плагіни провайдерів, що підтримують hook, доки один із них справді не змінить конфігурацію. Якщо жоден
  hook провайдера не переписує конфігурацію, вбудовані хелпери сімейства Google все одно
  нормалізують підтримувані записи провайдерів Google.
- `applyNativeStreamingUsageCompat`: провайдер застосовує compat-переписування native streaming-usage на основі endpoint для config-провайдерів
- `resolveConfigApiKey`: провайдер розв’язує env-marker автентифікацію для config-провайдерів
  без примусового повного завантаження runtime-автентифікації. `amazon-bedrock` також має тут
  вбудований AWS env-marker resolver, хоча runtime-автентифікація Bedrock використовує
  ланцюг за замовчуванням AWS SDK.
- `resolveSyntheticAuth`: провайдер може надавати доступність локальної/self-hosted або іншої
  config-backed автентифікації без збереження відкритих секретів
- `shouldDeferSyntheticProfileAuth`: провайдер може позначати збережені synthetic profile
  placeholders як менш пріоритетні, ніж env/config-backed автентифікація
- `resolveDynamicModel`: провайдер приймає id моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: провайдеру потрібне оновлення метаданих перед повторною спробою
  динамічного розв’язання
- `normalizeResolvedModel`: провайдеру потрібні переписування transport або base URL
- `contributeResolvedModelCompat`: провайдер додає compat-прапори для своїх
  vendor-моделей, навіть коли вони надходять через інший сумісний transport
- `capabilities`: провайдер публікує особливості transcript/tooling/provider-family
- `normalizeToolSchemas`: провайдер очищує схеми інструментів перед тим, як вбудований
  раннер їх побачить
- `inspectToolSchemas`: провайдер виводить transport-специфічні попередження щодо схем
  після нормалізації
- `resolveReasoningOutputMode`: провайдер обирає нативні чи теговані
  контракти reasoning-output
- `prepareExtraParams`: провайдер задає типові або нормалізує per-model параметри запиту
- `createStreamFn`: провайдер замінює звичайний шлях stream на повністю
  кастомний transport
- `wrapStreamFn`: провайдер застосовує обгортки сумісності для headers/body/model запиту
- `resolveTransportTurnState`: провайдер надає нативні per-turn
  headers або метадані transport
- `resolveWebSocketSessionPolicy`: провайдер надає нативні headers сеансу WebSocket
  або політику cool-down сеансу
- `createEmbeddingProvider`: провайдер володіє поведінкою memory embedding, коли вона
  належить плагіну провайдера, а не core switchboard embedding
- `formatApiKey`: провайдер форматує збережені профілі автентифікації в runtime-рядок
  `apiKey`, якого очікує transport
- `refreshOAuth`: провайдер володіє оновленням OAuth, коли спільних
  оновлювачів `pi-ai` недостатньо
- `buildAuthDoctorHint`: провайдер додає підказку щодо відновлення, коли оновлення OAuth
  не вдається
- `matchesContextOverflowError`: провайдер розпізнає провайдер-специфічні
  помилки переповнення context-window, які загальні евристики могли б пропустити
- `classifyFailoverReason`: провайдер зіставляє провайдер-специфічні сирі помилки transport/API
  з причинами failover, як-от обмеження швидкості або перевантаження
- `isCacheTtlEligible`: провайдер визначає, які upstream id моделей підтримують TTL кешу підказок
- `buildMissingAuthMessage`: провайдер замінює загальну помилку auth-store
  на провайдер-специфічну підказку для відновлення
- `suppressBuiltInModel`: провайдер приховує застарілі upstream-рядки й може повертати
  vendor-owned помилку для збоїв прямого розв’язання
- `augmentModelCatalog`: провайдер додає synthetic/final рядки каталогу після
  виявлення та об’єднання конфігурації
- `isBinaryThinking`: провайдер володіє UX двійкового thinking увімк./вимк.
- `supportsXHighThinking`: провайдер вмикає `xhigh` для вибраних моделей
- `resolveDefaultThinkingLevel`: провайдер володіє типовою політикою `/think` для
  сімейства моделей
- `applyConfigDefaults`: провайдер застосовує провайдер-специфічні глобальні значення за замовчуванням
  під час матеріалізації конфігурації на основі режиму автентифікації, env або сімейства моделей
- `isModernModelRef`: провайдер володіє зіставленням бажаних моделей для live/smoke
- `prepareRuntimeAuth`: провайдер перетворює налаштовані облікові дані на короткоживучий
  runtime-токен
- `resolveUsageAuth`: провайдер розв’язує облікові дані usage/quota для `/usage`
  та пов’язаних поверхонь статусу/звітності
- `fetchUsageSnapshot`: провайдер володіє отриманням/парсингом endpoint usage, тоді як
  core і далі володіє оболонкою підсумку та форматуванням
- `onModelSelected`: провайдер виконує побічні ефекти після вибору моделі, як-от
  телеметрія або session bookkeeping, що належить провайдеру

Поточні вбудовані приклади:

- `anthropic`: резервна сумісність уперед для Claude 4.6, підказки з відновлення автентифікації, отримання usage
  endpoint, метадані cache-TTL/provider-family і глобальні значення конфігурації
  за замовчуванням, чутливі до автентифікації
- `amazon-bedrock`: провайдер-власне зіставлення переповнення контексту та класифікація
  причин failover для специфічних помилок Bedrock throttle/not-ready, а також
  спільне сімейство повторного відтворення `anthropic-by-model` для Claude-only політик повторного відтворення
  на трафіку Anthropic
- `anthropic-vertex`: захисти політики повторного відтворення лише для Claude на Anthropic-message
  трафіку
- `openrouter`: наскрізні id моделей, обгортки запитів, підказки щодо можливостей провайдера,
  санітизація thought-signature Gemini на проксійованому трафіку Gemini,
  інжекція proxy reasoning через сімейство stream `openrouter-thinking`, пересилання
  метаданих маршрутизації та політика cache-TTL
- `github-copilot`: онбординг/device login, резервна сумісність моделей уперед,
  підказки transcript Claude-thinking, обмін runtime-токенів і отримання usage endpoint
- `openai`: резервна сумісність уперед для GPT-5.4, пряма нормалізація transport OpenAI,
  підказки щодо відсутньої автентифікації з урахуванням Codex, приглушення Spark, synthetic
  рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація аліасів usage-token
  (`input` / `output` і сімейства `prompt` / `completion`), спільне
  сімейство stream `openai-responses-defaults` для нативних обгорток OpenAI/Codex,
  метадані сімейства провайдера, реєстрація вбудованого провайдера генерації зображень
  для `gpt-image-1` і реєстрація вбудованого провайдера генерації відео
  для `sora-2`
- `google` і `google-gemini-cli`: резервна сумісність уперед для Gemini 3.1,
  нативна перевірка повторного відтворення Gemini, bootstrap-санітизація повторного відтворення, тегований
  режим reasoning-output, зіставлення сучасних моделей, реєстрація вбудованого провайдера
  генерації зображень для Gemini image-preview моделей і вбудована
  реєстрація провайдера генерації відео для моделей Veo; OAuth Gemini CLI також
  володіє форматуванням токенів auth-profile, парсингом usage-token і
  отриманням quota endpoint для usage-поверхонь
- `moonshot`: спільний transport, нормалізація payload thinking, що належить плагіну
- `kilocode`: спільний transport, headers запитів, що належать плагіну, нормалізація payload reasoning,
  санітизація thought-signature proxy-Gemini та політика cache-TTL
- `zai`: резервна сумісність уперед для GLM-5, типові значення `tool_stream`, політика cache-TTL,
  політика binary-thinking/live-model і автентифікація usage + отримання quota;
  невідомі id `glm-5*` синтезуються з вбудованого шаблону `glm-4.7`
- `xai`: нативна нормалізація transport Responses, переписування аліасів `/fast` для
  швидких варіантів Grok, типове `tool_stream`, очищення tool-schema /
  reasoning-payload, специфічне для xAI, та реєстрація вбудованого провайдера генерації відео
  для `grok-imagine-video`
- `mistral`: метадані можливостей, що належать плагіну
- `opencode` і `opencode-go`: метадані можливостей, що належать плагіну, плюс
  санітизація thought-signature proxy-Gemini
- `alibaba`: каталог генерації відео, що належить плагіну, для прямих посилань на моделі Wan
  на кшталт `alibaba/wan2.6-t2v`
- `byteplus`: каталоги, що належать плагіну, плюс реєстрація вбудованого провайдера генерації відео
  для моделей Seedance text-to-video/image-to-video
- `fal`: вбудована реєстрація провайдера генерації відео для хостованих сторонніх
  моделей, реєстрація провайдера генерації зображень для моделей зображень FLUX, а також вбудована
  реєстрація провайдера генерації відео для хостованих сторонніх моделей відео
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги, що належать плагіну
- `qwen`: каталоги, що належать плагіну, для текстових моделей плюс спільні
  реєстрації провайдерів media-understanding і video-generation для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні DashScope video
  endpoint із вбудованими моделями Wan, як-от `wan2.6-t2v` і `wan2.7-r2v`
- `runway`: реєстрація провайдера генерації відео, що належить плагіну, для нативних
  task-based моделей Runway, як-от `gen4.5`
- `minimax`: каталоги, що належать плагіну, вбудована реєстрація провайдера генерації відео
  для моделей відео Hailuo, вбудована реєстрація провайдера генерації зображень
  для `image-01`, гібридний вибір політики повторного відтворення Anthropic/OpenAI
  і логіка usage auth/snapshot
- `together`: каталоги, що належать плагіну, плюс вбудована реєстрація провайдера генерації відео
  для моделей відео Wan
- `xiaomi`: каталоги, що належать плагіну, плюс логіка usage auth/snapshot

Вбудований плагін `openai` тепер володіє обома id провайдерів: `openai` і
`openai-codex`.

Це охоплює провайдерів, які все ще вкладаються в звичайні transport OpenClaw. Провайдер,
якому потрібен повністю кастомний виконавець запитів, — це окрема, глибша поверхня розширення.

## Ротація API-ключів

- Підтримує загальну ротацію провайдерів для вибраних провайдерів.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (один live override, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для провайдерів Google `GOOGLE_API_KEY` також включається як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідях із rate-limit (наприклад
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичних повідомленнях про ліміт використання).
- Помилки, не пов’язані з rate-limit, завершуються одразу; ротація ключів не виконується.
- Коли всі кандидатні ключі не спрацьовують, повертається фінальна помилка з останньої спроби.

## Вбудовані провайдери (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих провайдерів **не потрібна**
конфігурація `models.providers`; просто налаштуйте автентифікацію та виберіть модель.

### OpenAI

- Провайдер: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (один override)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий transport — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для конкретної моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Warm-up WebSocket OpenAI Responses типово увімкнено через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна увімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` відображають прямі запити `openai/*` Responses на `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо хочете явно вказати tier замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI до `api.openai.com`, а не
  до загальних OpenAI-compatible proxy
- Нативні маршрути OpenAI також зберігають `store` Responses, підказки prompt-cache і
  формування payload сумісності reasoning OpenAI; proxy-маршрути — ні
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live API OpenAI його відхиляє; Spark вважається лише Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Провайдер: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (один override)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком із автентифікацією API-ключем і OAuth, надісланим до `api.anthropic.com`; OpenClaw відображає це в Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI в стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне використання Claude CLI та `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup-token Anthropic і далі доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI та `claude -p`, якщо вони доступні.

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
- Типовий transport — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для конкретної моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex до
  `chatgpt.com/backend-api`, а не до загальних OpenAI-compatible proxy
- Має той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw відображає це на `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли каталог OAuth Codex її показує; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає нативний `contextWindow = 1050000` і типове runtime-значення `contextTokens = 272000`; перевизначте runtime-ліміт через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OAuth OpenAI Codex явно підтримується для зовнішніх інструментів/процесів, як-от OpenClaw.

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

### Інші хостовані варіанти у стилі підписки

- [Qwen Cloud](/uk/providers/qwen): поверхня провайдера Qwen Cloud плюс мапування endpoint Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): доступ через OAuth або API-ключ MiniMax Coding Plan
- [GLM Models](/uk/providers/glm): endpoint Z.AI Coding Plan або загальні API endpoint

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Провайдер runtime Zen: `opencode`
- Провайдер runtime Go: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-ключ)

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (один override)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: legacy-конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або legacy `cached_content`) для пересилання нативного для провайдера
  дескриптора `cachedContents/...`; влучання в кеш Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Провайдери: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth
- Застереження: OAuth Gemini CLI в OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікових записів Google після використання сторонніх клієнтів. Перегляньте умови Google і використовуйте некритичний акаунт, якщо вирішите продовжити.
- OAuth Gemini CLI постачається як частина вбудованого плагіна `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкніть: `openclaw plugins enable google`
  - Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: вам **не потрібно** вставляти client id або secret у `openclaw.json`. Потік входу CLI зберігає
    токени в профілях автентифікації на gateway host.
  - Якщо запити не працюють після входу, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на gateway host.
  - Відповіді Gemini CLI JSON парсяться з `response`; usage резервно береться з
    `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Провайдер: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Аліаси: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово вказують конкретну поверхню

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
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live-виявлення
  `https://api.kilo.ai/api/gateway/models` може додатково розширити runtime-каталог.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Докладніше про налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані плагіни провайдерів

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані OpenRouter заголовки атрибуції застосунку, лише коли
  запит справді спрямовано до `openrouter.ai`
- Маркери `cache_control`, специфічні для Anthropic в OpenRouter, так само обмежуються
  перевіреними маршрутами OpenRouter, а не довільними proxy URL
- OpenRouter залишається на шляху у стилі proxy OpenAI-compatible, тому нативне
  формування запитів лише для OpenAI (`serviceTier`, `store` Responses,
  підказки prompt-cache, payload сумісності reasoning OpenAI) не пересилається
- Посилання OpenRouter на базі Gemini зберігають лише санітизацію thought-signature proxy-Gemini;
  нативна перевірка повторного відтворення Gemini та bootstrap-переписування залишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на базі Gemini зберігають той самий шлях санітизації thought-signature
  proxy-Gemini; `kilocode/kilo/auto` та інші підказки, що не підтримують proxy reasoning,
  пропускають інжекцію proxy reasoning
- MiniMax: `minimax` (API-ключ) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Онбординг MiniMax/налаштування API-ключа записує явні визначення моделей M2.7 з
  `input: ["text", "image"]`; вбудований каталог провайдера тримає посилання чату
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
  - Нативні вбудовані запити xAI використовують шлях xAI Responses
  - `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`,
    `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`
  - `tool_stream` типово ввімкнено; задайте
    `agents.defaults.models["xai/<model>"].params.tool_stream` як `false`, щоб
    вимкнути його
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Приклад моделі: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Моделі GLM на Cerebras використовують id `zai-glm-4.7` і `zai-glm-4.6`.
  - Base URL, сумісний з OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Див. [Hugging Face (Inference)](/uk/providers/huggingface).

## Провайдери через `models.providers` (custom/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **кастомні** провайдери або
OpenAI/Anthropic‑compatible proxy.

Багато вбудованих плагінів провайдерів нижче вже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, headers або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований плагін провайдера. Використовуйте вбудований провайдер
за замовчуванням і додавайте явний запис `models.providers.moonshot` лише тоді, коли
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

Kimi Coding використовує Anthropic-compatible endpoint Moonshot AI:

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

Legacy `kimi/k2p5` і далі приймається як сумісний id моделі.

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

Онбординг за замовчуванням використовує coding-поверхню, але загальний каталог `volcengine/*`
реєструється одночасно.

У picker онбордингу/налаштування моделей вибір автентифікації Volcengine віддає перевагу і
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

Онбординг за замовчуванням використовує coding-поверхню, але загальний каталог `byteplus/*`
реєструється одночасно.

У picker онбордингу/налаштування моделей вибір автентифікації BytePlus віддає перевагу і
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

Synthetic надає Anthropic-compatible моделі за провайдером `synthetic`:

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

- MiniMax OAuth (глобальний): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-ключ (глобальний): `--auth-choice minimax-global-api`
- MiniMax API-ключ (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Подробиці налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

На Anthropic-compatible streaming-шляху MiniMax OpenClaw за замовчуванням вимикає thinking,
якщо ви явно його не задасте, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Розподіл можливостей, що належать плагіну:

- Типові значення тексту/чату залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, що належить плагіну, на обох шляхах автентифікації MiniMax
- Вебпошук залишається на id провайдера `minimax`

### Ollama

Ollama постачається як вбудований плагін провайдера й використовує нативний API Ollama:

- Провайдер: `ollama`
- Автентифікація: не потрібна (локальний сервер)
- Приклад моделі: `ollama/llama3.3`
- Встановлення: [https://ollama.com/download](https://ollama.com/download)

```bash
# Встановіть Ollama, потім завантажте модель:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви
явно вмикаєте це через `OLLAMA_API_KEY`, а вбудований плагін провайдера додає Ollama безпосередньо до
`openclaw onboard` і picker моделей. Див. [/providers/ollama](/uk/providers/ollama)
щодо онбордингу, хмарного/локального режиму та кастомної конфігурації.

### vLLM

vLLM постачається як вбудований плагін провайдера для локальних/self-hosted
OpenAI-compatible серверів:

- Провайдер: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:8000/v1`

Щоб локально ввімкнути auto-discovery (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

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

Подробиці див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований плагін провайдера для швидких self-hosted
OpenAI-compatible серверів:

- Провайдер: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:30000/v1`

Щоб локально ввімкнути auto-discovery (підійде будь-яке значення, якщо ваш сервер не
вимагає автентифікації):

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

Подробиці див. у [/providers/sglang](/uk/providers/sglang).

### Локальні proxy (LM Studio, vLLM, LiteLLM тощо)

Приклад (OpenAI‑compatible):

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

- Для кастомних провайдерів `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими.
  Якщо їх пропущено, OpenClaw за замовчуванням використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, які відповідають лімітам вашого proxy/моделі.
- Для `api: "openai-completions"` на ненативних endpoint (будь-який непорожній `baseUrl`, хост якого не є `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок 400 від провайдера через непідтримувані ролі `developer`.
- Маршрути OpenAI-compatible у стилі proxy також пропускають нативне формування запитів лише для OpenAI:
  без `service_tier`, без `store` Responses, без підказок prompt-cache, без
  формування payload сумісності reasoning OpenAI і без прихованих заголовків атрибуції
  OpenClaw.
- Якщо `baseUrl` порожній/відсутній, OpenClaw зберігає типову поведінку OpenAI (яка веде до `api.openai.com`).
- Для безпеки явне `compat.supportsDeveloperRole: true` все одно перевизначається на ненативних endpoint `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Models](/uk/concepts/models) — конфігурація моделей і аліаси
- [Model Failover](/uk/concepts/model-failover) — резервні ланцюжки та поведінка повторних спроб
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделей
- [Providers](/uk/providers) — посібники з налаштування для окремих провайдерів
