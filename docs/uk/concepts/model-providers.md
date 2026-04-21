---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Вам потрібні приклади конфігурацій або команди онбордингу CLI для постачальників моделей
summary: Огляд постачальників моделей із прикладами конфігурацій + потоками CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-21T01:06:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66bb2b5c7676db75f1a078b94e26f07509bd1712b94da9358f8cba8db1e068d2
    source_path: concepts/model-providers.md
    workflow: 15
---

# Постачальники моделей

Ця сторінка охоплює **постачальників LLM/моделей** (а не канали чату, як-от WhatsApp/Telegram).
Правила вибору моделей дивіться в [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви задаєте `agents.defaults.models`, це стає allowlist.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Резервні правила часу виконання, перевірки cooldown і збереження session-override
  задокументовані в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це власні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичне обмеження під час виконання.
- Plugins постачальників можуть впроваджувати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об’єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести постачальників можуть оголошувати `providerAuthEnvVars` і
  `providerAuthAliases`, щоб загальні перевірки автентифікації на основі env і варіанти постачальників
  не потребували завантаження часу виконання Plugin. Залишкова core-мапа env-змінних тепер
  використовується лише для постачальників core/без Plugin і кількох випадків загального пріоритету, таких
  як онбординг Anthropic зі схемою «ключ API спочатку».
- Plugins постачальників також можуть керувати поведінкою постачальника під час виконання через
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
- Примітка: `capabilities` постачальника під час виконання — це спільні метадані раннера (родина постачальника,
  особливості transcript/інструментів, підказки щодо transport/кешу). Це не те саме,
  що й [публічна модель capability](/uk/plugins/architecture#public-capability-model),
  яка описує, що реєструє Plugin (текстовий inference, мовлення тощо).
- Вбудований постачальник `codex` поєднаний із вбудованим harness агента Codex.
  Використовуйте `codex/gpt-*`, коли вам потрібні вхід, виявлення моделей, нативне відновлення thread і виконання app-server, що належать Codex.
  Звичайні посилання `openai/gpt-*` і надалі використовують постачальника OpenAI та
  стандартний transport постачальника OpenClaw.
  Розгортання лише з Codex можуть вимкнути автоматичний резервний перехід на PI через
  `agents.defaults.embeddedHarness.fallback: "none"`; див.
  [Codex Harness](/uk/plugins/codex-harness).

## Поведінка постачальника, що належить Plugin

Тепер Plugins постачальників можуть керувати більшістю логіки, специфічної для постачальника, тоді як OpenClaw зберігає
загальний цикл inference.

Типовий розподіл:

- `auth[].run` / `auth[].runNonInteractive`: постачальник керує потоками онбордингу/входу
  для `openclaw onboard`, `openclaw models auth` і безголового налаштування
- `wizard.setup` / `wizard.modelPicker`: постачальник керує мітками вибору автентифікації,
  застарілими псевдонімами, підказками allowlist для онбордингу та записами налаштування в селекторах онбордингу/моделей
- `catalog`: постачальник з’являється в `models.providers`
- `normalizeModelId`: постачальник нормалізує застарілі/preview ідентифікатори моделей перед
  пошуком або канонізацією
- `normalizeTransport`: постачальник нормалізує `api` / `baseUrl` родини transport
  перед загальним збиранням моделі; OpenClaw спочатку перевіряє відповідного постачальника,
  а потім інші Plugins постачальників, що підтримують цей hook, доки один із них справді не змінить
  transport
- `normalizeConfig`: постачальник нормалізує конфігурацію `models.providers.<id>` перед
  використанням під час виконання; OpenClaw спочатку перевіряє відповідного постачальника,
  а потім інші Plugins постачальників, що підтримують цей hook, доки один із них справді не змінить конфігурацію. Якщо жоден
  hook постачальника не переписує конфігурацію, вбудовані допоміжні засоби сімейства Google все одно
  нормалізують підтримувані записи постачальників Google.
- `applyNativeStreamingUsageCompat`: постачальник застосовує compat-перезаписи використання нативного streaming для постачальників конфігурації, зумовлені endpoint
- `resolveConfigApiKey`: постачальник визначає автентифікацію через env-marker для постачальників конфігурації
  без примусового завантаження повної автентифікації під час виконання. `amazon-bedrock` також має
  вбудований розв’язувач AWS env-marker тут, хоча автентифікація Bedrock під час виконання використовує
  стандартний ланцюжок AWS SDK.
- `resolveSyntheticAuth`: постачальник може показувати доступність локальної/self-hosted або іншої
  автентифікації на основі конфігурації без збереження відкритих секретів
- `shouldDeferSyntheticProfileAuth`: постачальник може позначати збережені заповнювачі synthetic profile
  як такі, що мають нижчий пріоритет, ніж автентифікація через env/конфігурацію
- `resolveDynamicModel`: постачальник приймає ідентифікатори моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: постачальнику потрібне оновлення метаданих перед повторною спробою
  динамічного визначення
- `normalizeResolvedModel`: постачальнику потрібні перезаписи transport або base URL
- `contributeResolvedModelCompat`: постачальник додає прапори compat для своїх
  моделей постачальника, навіть якщо вони надходять через інший сумісний transport
- `capabilities`: постачальник публікує особливості transcript/інструментів/сімейства постачальника
- `normalizeToolSchemas`: постачальник очищує схеми інструментів перед тим, як їх побачить
  вбудований раннер
- `inspectToolSchemas`: постачальник показує попередження, специфічні для transport, щодо схем
  після нормалізації
- `resolveReasoningOutputMode`: постачальник обирає нативні чи теговані
  контракти виводу reasoning
- `prepareExtraParams`: постачальник задає типові значення або нормалізує параметри запиту для кожної моделі
- `createStreamFn`: постачальник замінює звичайний шлях stream повністю
  власним transport
- `wrapStreamFn`: постачальник застосовує обгортки сумісності для заголовків/тіла запиту/моделі
- `resolveTransportTurnState`: постачальник надає нативні заголовки transport
  або метадані для кожного ходу
- `resolveWebSocketSessionPolicy`: постачальник надає нативні заголовки сесії WebSocket
  або політику cooldown сесії
- `createEmbeddingProvider`: постачальник керує поведінкою embedding для пам’яті, коли вона
  має належати Plugin постачальника, а не core-перемикачу embedding
- `formatApiKey`: постачальник форматує збережені профілі автентифікації у
  рядок `apiKey`, який очікує transport під час виконання
- `refreshOAuth`: постачальник керує оновленням OAuth, коли спільних
  засобів оновлення `pi-ai` недостатньо
- `buildAuthDoctorHint`: постачальник додає підказку з виправлення, коли оновлення OAuth
  завершується невдачею
- `matchesContextOverflowError`: постачальник розпізнає специфічні для постачальника
  помилки переповнення context-window, які загальні евристики можуть пропустити
- `classifyFailoverReason`: постачальник зіставляє специфічні для постачальника необроблені помилки transport/API
  з причинами failover, такими як rate limit або overload
- `isCacheTtlEligible`: постачальник визначає, які upstream-ідентифікатори моделей підтримують TTL prompt-cache
- `buildMissingAuthMessage`: постачальник замінює загальну помилку сховища автентифікації
  на специфічну для постачальника підказку з відновлення
- `suppressBuiltInModel`: постачальник приховує застарілі upstream-рядки та може повертати
  помилку, що належить постачальнику, для збоїв прямого визначення
- `augmentModelCatalog`: постачальник додає synthetic/фінальні рядки каталогу після
  виявлення та об’єднання конфігурації
- `isBinaryThinking`: постачальник керує UX двійкового thinking увімк./вимк.
- `supportsXHighThinking`: постачальник вмикає `xhigh` для вибраних моделей
- `resolveDefaultThinkingLevel`: постачальник керує типовою політикою `/think` для
  сімейства моделей
- `applyConfigDefaults`: постачальник застосовує специфічні для постачальника глобальні типові значення
  під час матеріалізації конфігурації залежно від режиму автентифікації, env або сімейства моделей
- `isModernModelRef`: постачальник керує зіставленням пріоритетних моделей для live/smoke
- `prepareRuntimeAuth`: постачальник перетворює налаштовані облікові дані на короткочасний
  токен часу виконання
- `resolveUsageAuth`: постачальник визначає облікові дані використання/квоти для `/usage`
  і пов’язаних поверхонь стану/звітності
- `fetchUsageSnapshot`: постачальник керує отриманням/розбором endpoint використання, тоді як
  core і далі керує оболонкою підсумку та форматуванням
- `onModelSelected`: постачальник виконує побічні дії після вибору моделі, як-от
  телеметрія або ведення сесії, що належить постачальнику

Поточні вбудовані приклади:

- `anthropic`: резервна сумісність уперед для Claude 4.6, підказки з відновлення автентифікації, отримання
  endpoint використання, метадані cache-TTL/родини постачальника та глобальні
  типові значення конфігурації з урахуванням автентифікації
- `amazon-bedrock`: зіставлення переповнення контексту, що належить постачальнику, і класифікація
  причин failover для специфічних для Bedrock помилок throttle/not-ready, а також
  спільна родина повторного відтворення `anthropic-by-model` для захистів політики повторного відтворення лише для Claude на трафіку Anthropic
- `anthropic-vertex`: захисти політики повторного відтворення лише для Claude на трафіку повідомлень Anthropic
- `openrouter`: наскрізні ідентифікатори моделей, обгортки запитів, підказки capability постачальника,
  очищення thought-signature Gemini на проксійованому трафіку Gemini, ін’єкція
  reasoning проксі через родину stream `openrouter-thinking`, пересилання
  метаданих маршрутизації та політика cache-TTL
- `github-copilot`: онбординг/вхід через пристрій, резервна сумісність уперед для моделей,
  підказки transcript для Claude-thinking, обмін токенів під час виконання та отримання endpoint використання
- `openai`: резервна сумісність уперед для GPT-5.4, пряма нормалізація transport OpenAI,
  підказки про відсутню автентифікацію з урахуванням Codex, придушення Spark, synthetic-
  рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація псевдонімів токенів використання
  (`input` / `output` і сімейства `prompt` / `completion`), спільна
  родина stream `openai-responses-defaults` для нативних обгорток OpenAI/Codex,
  метадані родини постачальника, реєстрація вбудованого постачальника генерації зображень
  для `gpt-image-1` і реєстрація вбудованого постачальника генерації відео
  для `sora-2`
- `google` і `google-gemini-cli`: резервна сумісність уперед для Gemini 3.1,
  нативна перевірка повторного відтворення Gemini, очищення bootstrap replay, тегований
  режим виводу reasoning, зіставлення modern-model, реєстрація вбудованого постачальника генерації зображень
  для моделей попереднього перегляду зображень Gemini та вбудована
  реєстрація постачальника генерації відео для моделей Veo; OAuth Gemini CLI також
  керує форматуванням токенів профілю автентифікації, розбором токенів використання та
  отриманням endpoint квоти для поверхонь використання
- `moonshot`: спільний transport, нормалізація payload thinking, що належить Plugin
- `kilocode`: спільний transport, заголовки запитів, що належать Plugin, payload reasoning
  нормалізація, очищення thought-signature проксійованого Gemini та політика cache-TTL
- `zai`: резервна сумісність уперед для GLM-5, типові значення `tool_stream`, політика cache-TTL,
  політика binary-thinking/live-model і автентифікація використання + отримання квоти;
  невідомі ідентифікатори `glm-5*` синтезуються з вбудованого шаблону `glm-4.7`
- `xai`: нативна нормалізація transport Responses, перезаписи псевдонімів `/fast` для
  швидких варіантів Grok, типове `tool_stream`, очищення схем інструментів /
  payload reasoning, специфічне для xAI, і реєстрація вбудованого постачальника генерації відео
  для `grok-imagine-video`
- `mistral`: метадані capability, що належать Plugin
- `opencode` і `opencode-go`: метадані capability, що належать Plugin, плюс
  очищення thought-signature проксійованого Gemini
- `alibaba`: каталог генерації відео, що належить Plugin, для прямих посилань на моделі Wan,
  таких як `alibaba/wan2.6-t2v`
- `byteplus`: каталоги, що належать Plugin, плюс реєстрація вбудованого постачальника генерації відео
  для моделей Seedance text-to-video/image-to-video
- `fal`: реєстрація вбудованого постачальника генерації відео для розміщених сторонніх
  моделей, реєстрація постачальника генерації зображень для моделей зображень FLUX плюс вбудована
  реєстрація постачальника генерації відео для розміщених сторонніх відеомоделей
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги, що належать Plugin
- `qwen`: каталоги, що належать Plugin, для текстових моделей плюс спільні
  реєстрації постачальників media-understanding і генерації відео для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні відеоendpoint-и DashScope зі вбудованими моделями Wan, такими як `wan2.6-t2v` і `wan2.7-r2v`
- `runway`: реєстрація постачальника генерації відео, що належить Plugin, для нативних
  моделей на основі задач Runway, таких як `gen4.5`
- `minimax`: каталоги, що належать Plugin, вбудована реєстрація постачальника генерації відео
  для відеомоделей Hailuo, вбудована реєстрація постачальника генерації зображень
  для `image-01`, гібридний вибір політики повторного відтворення Anthropic/OpenAI
  і логіка автентифікації/знімка використання
- `together`: каталоги, що належать Plugin, плюс реєстрація вбудованого постачальника генерації відео
  для відеомоделей Wan
- `xiaomi`: каталоги, що належать Plugin, плюс логіка автентифікації/знімка використання

Вбудований Plugin `openai` тепер керує обома ідентифікаторами постачальника: `openai` і
`openai-codex`.

Це охоплює постачальників, які все ще вписуються в звичайні transport OpenClaw. Постачальник,
якому потрібен повністю власний виконавець запитів, — це окрема, глибша поверхня розширення.

## Ротація ключів API

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (єдине live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список, розділений комами або крапками з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google як резервний варіант також включається `GOOGLE_API_KEY`.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на rate-limit
  відповіді (наприклад `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
- Збої, не пов’язані з rate-limit, завершуються одразу; ротація ключів не виконується.
- Коли всі ключі-кандидати завершуються невдачею, повертається остання помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Ці постачальники **не**
потребують конфігурації `models.providers`; просто задайте автентифікацію й виберіть модель.

### OpenAI

- Постачальник: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, плюс `OPENCLAW_LIVE_OPENAI_KEY` (єдине перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий transport — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Типово ввімкнений warm-up OpenAI Responses WebSocket через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити Responses `openai/*` із `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний tier замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не
  до загальних проксі, сумісних з OpenAI
- Нативні маршрути OpenAI також зберігають `store` Responses, підказки prompt-cache і
  формування payload сумісності reasoning OpenAI; проксі-маршрути — ні
- `openai/gpt-5.3-codex-spark` навмисно придушено в OpenClaw, оскільки live OpenAI API його відхиляє; Spark вважається доступним лише для Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов’язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, плюс `OPENCLAW_LIVE_ANTHROPIC_KEY` (єдине перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic також підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком, автентифікованим API-ключем і OAuth, надісланим на `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволено, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Токен налаштування Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI та `claude -p`, коли це доступно.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Постачальник: `openai-codex`
- Автентифікація: OAuth (ChatGPT)
- Приклад моделі: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` або `openclaw models auth login --provider openai-codex`
- Типовий transport — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних проксі, сумісних з OpenAI
- Має той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли каталог OAuth Codex її показує; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає нативний `contextWindow = 1050000` і типове обмеження часу виконання `contextTokens = 272000`; перевизначте обмеження часу виконання через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OAuth OpenAI Codex офіційно підтримується для зовнішніх інструментів/робочих процесів, таких як OpenClaw.

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

### Інші розміщені варіанти в стилі підписки

- [Qwen Cloud](/uk/providers/qwen): поверхня постачальника Qwen Cloud плюс зіставлення endpoint-ів Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): доступ через OAuth або API-ключ MiniMax Coding Plan
- [GLM Models](/uk/providers/glm): endpoint-и Z.AI Coding Plan або загального API

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Постачальник Zen runtime: `opencode`
- Постачальник Go runtime: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-ключ)

- Постачальник: `google`
- Автентифікація: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (єдине перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застарілий `cached_content`) для пересилання нативного для постачальника
  дескриптора `cachedContents/...`; cache hit Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує свій потік OAuth
- Застереження: OAuth Gemini CLI в OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікових записів Google після використання сторонніх клієнтів. Перегляньте умови Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
- OAuth Gemini CLI постачається як частина вбудованого Plugin `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкніть: `openclaw plugins enable google`
  - Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Типова модель: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: ви **не** вставляєте client id або secret у `openclaw.json`. Потік входу CLI зберігає
    токени в профілях автентифікації на хості Gateway.
  - Якщо після входу запити завершуються невдачею, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  - JSON-відповіді Gemini CLI розбираються з `response`; використання резервно береться з
    `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово задають конкретну поверхню

### Vercel AI Gateway

- Постачальник: `vercel-ai-gateway`
- Автентифікація: `AI_GATEWAY_API_KEY`
- Приклад моделі: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Постачальник: `kilocode`
- Автентифікація: `KILOCODE_API_KEY`
- Приклад моделі: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live
  виявлення `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог
  під час виконання.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Деталі налаштування дивіться в [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані Plugins постачальників

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані OpenRouter заголовки атрибуції застосунку лише тоді, коли
  запит справді спрямовано на `openrouter.ai`
- Специфічні для OpenRouter маркери Anthropic `cache_control` так само обмежуються
  перевіреними маршрутами OpenRouter, а не довільними URL проксі
- OpenRouter залишається на шляху проксі у стилі OpenAI-compatible, тому нативне
  формування запитів лише для OpenAI (`serviceTier`, `store` Responses,
  підказки prompt-cache, payload сумісності reasoning OpenAI) не пересилається
- Посилання OpenRouter на основі Gemini зберігають лише очищення thought-signature проксійованого Gemini;
  нативна перевірка повторного відтворення Gemini і bootstrap-перезаписи залишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на основі Gemini зберігають той самий шлях очищення
  thought-signature проксійованого Gemini; `kilocode/kilo/auto` та інші підказки, що не підтримують proxy-reasoning,
  пропускають ін’єкцію proxy reasoning
- MiniMax: `minimax` (API-ключ) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Онбординг MiniMax/налаштування API-ключа записує явні визначення моделей M2.7 з
  `input: ["text", "image"]`; вбудований каталог постачальника зберігає посилання чату
  лише текстовими, доки ця конфігурація постачальника не буде матеріалізована
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Приклад моделі: `moonshot/kimi-k2.6`
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
  - Моделі GLM на Cerebras використовують ідентифікатори `zai-glm-4.7` і `zai-glm-4.6`.
  - Base URL, сумісний з OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Див. [Hugging Face (Inference)](/uk/providers/huggingface).

## Постачальники через `models.providers` (custom/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **custom** постачальників або
проксі, сумісні з OpenAI/Anthropic.

Багато з наведених нижче вбудованих Plugins постачальників уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований Plugin постачальника. Типово використовуйте вбудованого постачальника,
і додавайте явний запис `models.providers.moonshot` лише тоді, коли вам потрібно
перевизначити base URL або метадані моделі:

- Постачальник: `moonshot`
- Автентифікація: `MOONSHOT_API_KEY`
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

Kimi Coding використовує endpoint Moonshot AI, сумісний з Anthropic:

- Постачальник: `kimi`
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

Застарілий `kimi/k2p5` і далі приймається як сумісний ідентифікатор моделі.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) надає доступ до Doubao та інших моделей у Китаї.

- Постачальник: `volcengine` (coding: `volcengine-plan`)
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

Онбординг типово використовує поверхню coding, але загальний каталог `volcengine/*`
реєструється одночасно.

У селекторах моделей онбордингу/налаштування вибір автентифікації Volcengine надає перевагу рядкам
`volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажено,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
селектора в межах постачальника.

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

- Постачальник: `byteplus` (coding: `byteplus-plan`)
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

Онбординг типово використовує поверхню coding, але загальний каталог `byteplus/*`
реєструється одночасно.

У селекторах моделей онбордингу/налаштування вибір автентифікації BytePlus надає перевагу рядкам
`byteplus/*` і `byteplus-plan/*`. Якщо ці моделі ще не завантажено,
OpenClaw повертається до нефільтрованого каталогу замість показу порожнього
селектора в межах постачальника.

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

Synthetic надає Anthropic-сумісні моделі через постачальника `synthetic`:

- Постачальник: `synthetic`
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

MiniMax налаштовується через `models.providers`, оскільки використовує custom endpoint-и:

- MiniMax OAuth (глобально): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- API-ключ MiniMax (глобально): `--auth-choice minimax-global-api`
- API-ключ MiniMax (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, параметри моделей і фрагменти конфігурації дивіться в [/providers/minimax](/uk/providers/minimax).

На Anthropic-сумісному шляху streaming у MiniMax OpenClaw типово вимикає thinking,
якщо ви явно його не задасте, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Поділ capability, що належить Plugin:

- Типові значення text/chat залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, що належить Plugin, на обох шляхах автентифікації MiniMax
- Вебпошук залишається на ідентифікаторі постачальника `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin постачальника, який використовує нативний API:

- Постачальник: `lmstudio`
- Автентифікація: `LM_API_TOKEN`
- Типовий base URL inference: `http://localhost:1234/v1`

Потім задайте модель (замініть на один з ідентифікаторів, повернутих `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw використовує нативні `/api/v1/models` і `/api/v1/models/load` LM Studio
для виявлення + автозавантаження, а `/v1/chat/completions` — для inference за замовчуванням.
Налаштування й усунення несправностей дивіться в [/providers/lmstudio](/uk/providers/lmstudio).

### Ollama

Ollama постачається як вбудований Plugin постачальника й використовує нативний API Ollama:

- Постачальник: `ollama`
- Автентифікація: не потрібна (локальний сервер)
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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви вмикаєте це через
`OLLAMA_API_KEY`, а вбудований Plugin постачальника додає Ollama безпосередньо до
`openclaw onboard` і селектора моделей. Дивіться [/providers/ollama](/uk/providers/ollama)
для онбордингу, хмарного/локального режиму та custom-конфігурації.

### vLLM

vLLM постачається як вбудований Plugin постачальника для локальних/self-hosted
серверів, сумісних з OpenAI:

- Постачальник: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:8000/v1`

Щоб увімкнути автовиявлення локально (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один з ідентифікаторів, повернутих `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Деталі дивіться в [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований Plugin постачальника для швидких self-hosted
серверів, сумісних з OpenAI:

- Постачальник: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:30000/v1`

Щоб увімкнути автовиявлення локально (підійде будь-яке значення, якщо ваш сервер не
вимагає автентифікації):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один з ідентифікаторів, повернутих `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Деталі дивіться в [/providers/sglang](/uk/providers/sglang).

### Локальні проксі (LM Studio, vLLM, LiteLLM тощо)

Приклад (сумісний з OpenAI):

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

- Для custom-постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими.
  Якщо їх не задано, OpenClaw типово використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, що відповідають обмеженням вашого проксі/моделі.
- Для `api: "openai-completions"` на ненативних endpoint-ах (будь-який непорожній `baseUrl`, чий host не є `api.openai.com`) OpenClaw примусово задає `compat.supportsDeveloperRole: false`, щоб уникнути помилок постачальника 400 для непідтримуваних ролей `developer`.
- Маршрути у стилі проксі, сумісні з OpenAI, також пропускають нативне
  формування запитів лише для OpenAI: без `service_tier`, без `store` Responses, без підказок prompt-cache, без
  формування payload сумісності reasoning OpenAI і без прихованих заголовків атрибуції OpenClaw.
- Якщо `baseUrl` порожній/не заданий, OpenClaw зберігає типову поведінку OpenAI (яка вказує на `api.openai.com`).
- З міркувань безпеки явне `compat.supportsDeveloperRole: true` усе одно перевизначається на ненативних endpoint-ах `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Дивіться також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Models](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Model Failover](/uk/concepts/model-failover) — ланцюжки резервного переходу та поведінка повторних спроб
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделі
- [Providers](/uk/providers) — окремі посібники з налаштування постачальників
