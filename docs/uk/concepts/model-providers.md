---
read_when:
    - Потрібен довідник налаштування моделей для кожного провайдера окремо
    - Вам потрібні приклади конфігурацій або команди онбордингу CLI для провайдерів моделей
summary: Огляд провайдерів моделей із прикладами конфігурацій + потоками CLI
title: Провайдери моделей
x-i18n:
    generated_at: "2026-04-21T08:24:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6732ab672757579c09395583a0f7d110348c909d4e4ab1d2accad68ad054c636
    source_path: concepts/model-providers.md
    workflow: 15
---

# Провайдери моделей

Ця сторінка охоплює **провайдерів LLM/моделей** (а не чат-канали, як-от WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви встановите `agents.defaults.models`, це стане списком дозволених значень.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Резервні правила часу виконання, зондування cooldown і збереження перевизначень сеансу
  задокументовані в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичне обмеження часу виконання.
- Plugin провайдерів можуть впроваджувати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об’єднує цей результат у `models.providers` перед записом
  `models.json`.
- Маніфести провайдерів можуть оголошувати `providerAuthEnvVars` і
  `providerAuthAliases`, щоб загальні зондування автентифікації на основі env і варіанти провайдерів
  не потребували завантаження часу виконання Plugin. Решта мапи env-змінних у ядрі тепер
  потрібна лише для неплагінних/вбудованих провайдерів і кількох випадків загального пріоритету, таких
  як онбординг Anthropic з пріоритетом API-ключа.
- Plugin провайдерів також можуть володіти поведінкою провайдера під час виконання через
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
  `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, and
  `onModelSelected`.
- Примітка: `capabilities` часу виконання провайдера — це спільні метадані раннера (сімейство провайдера,
  особливості транскрипту/інструментів, підказки для транспорту/кешу). Це не те
  саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model),
  яка описує, що реєструє Plugin (текстовий inference, мовлення тощо).
- Вбудований провайдер `codex` працює в парі з вбудованим агентним harness Codex.
  Використовуйте `codex/gpt-*`, коли вам потрібні вхід, керований Codex, виявлення моделей,
  нативне відновлення потоку й виконання app-server. Звичайні посилання `openai/gpt-*` і надалі
  використовують провайдер OpenAI і стандартний транспорт провайдера OpenClaw.
  У розгортаннях лише з Codex можна вимкнути автоматичний резервний перехід до PI через
  `agents.defaults.embeddedHarness.fallback: "none"`; див.
  [Codex Harness](/uk/plugins/codex-harness).

## Поведінка провайдера, якою володіє Plugin

Plugin провайдерів тепер можуть володіти більшістю специфічної для провайдера логіки, тоді як OpenClaw зберігає
загальний цикл inference.

Типовий поділ:

- `auth[].run` / `auth[].runNonInteractive`: провайдер володіє потоками
  онбордингу/входу для `openclaw onboard`, `openclaw models auth` і безголового налаштування
- `wizard.setup` / `wizard.modelPicker`: провайдер володіє мітками вибору автентифікації,
  застарілими псевдонімами, підказками для списку дозволених значень під час онбордингу і записами налаштування
  у засобах вибору онбордингу/моделей
- `catalog`: провайдер з’являється в `models.providers`
- `normalizeModelId`: провайдер нормалізує застарілі/preview ідентифікатори моделей перед
  пошуком або канонізацією
- `normalizeTransport`: провайдер нормалізує `api` / `baseUrl` сімейства транспорту
  перед загальним збиранням моделі; OpenClaw спочатку перевіряє відповідний провайдер,
  потім інші Plugin провайдерів, що підтримують цей hook, доки один із них справді не змінить
  транспорт
- `normalizeConfig`: провайдер нормалізує конфігурацію `models.providers.<id>` перед
  використанням під час виконання; OpenClaw спочатку перевіряє відповідний провайдер, потім інші
  Plugin провайдерів, що підтримують цей hook, доки один із них справді не змінить конфігурацію. Якщо жоден
  hook провайдера не переписує конфігурацію, вбудовані допоміжні засоби сімейства Google усе одно
  нормалізують підтримувані записи провайдерів Google.
- `applyNativeStreamingUsageCompat`: провайдер застосовує переписування сумісності використання нативного стримінгу для конфігураційних провайдерів на основі endpoint
- `resolveConfigApiKey`: провайдер визначає автентифікацію маркера env для конфігураційних провайдерів
  без примусового завантаження повної автентифікації часу виконання. `amazon-bedrock` також має
  тут вбудований засіб визначення маркера env AWS, хоча автентифікація часу виконання Bedrock використовує
  стандартний ланцюжок AWS SDK.
- `resolveSyntheticAuth`: провайдер може показувати доступність локальної/self-hosted або іншої
  автентифікації на основі конфігурації без збереження секретів у відкритому тексті
- `shouldDeferSyntheticProfileAuth`: провайдер може позначати збережені заповнювачі synthetic profile
  як нижчий пріоритет, ніж автентифікація на основі env/конфігурації
- `resolveDynamicModel`: провайдер приймає ідентифікатори моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: провайдеру потрібно оновлення метаданих перед повторною спробою
  динамічного визначення
- `normalizeResolvedModel`: провайдеру потрібні переписування транспорту або базового URL
- `contributeResolvedModelCompat`: провайдер додає прапорці сумісності для своїх
  моделей постачальника, навіть коли вони надходять через інший сумісний транспорт
- `capabilities`: провайдер публікує особливості транскрипту/інструментів/сімейства провайдера
- `normalizeToolSchemas`: провайдер очищає схеми інструментів перед тим, як їх побачить
  вбудований раннер
- `inspectToolSchemas`: провайдер показує попередження, специфічні для транспорту, щодо схем
  після нормалізації
- `resolveReasoningOutputMode`: провайдер вибирає нативні чи позначені тегами
  контракти виводу reasoning
- `prepareExtraParams`: провайдер задає типові значення або нормалізує параметри запиту для кожної моделі
- `createStreamFn`: провайдер замінює звичайний шлях стриму повністю
  користувацьким транспортом
- `wrapStreamFn`: провайдер застосовує обгортки сумісності заголовків/тіла/моделі запиту
- `resolveTransportTurnState`: провайдер постачає нативні заголовки транспорту або метадані
  для кожного ходу
- `resolveWebSocketSessionPolicy`: провайдер постачає нативні заголовки сесії WebSocket
  або політику cooldown сесії
- `createEmbeddingProvider`: провайдер володіє поведінкою embedding для пам’яті, коли вона
  має належати Plugin провайдера, а не вбудованому комутатору embedding ядра
- `formatApiKey`: провайдер форматує збережені профілі автентифікації в рядок
  `apiKey` часу виконання, якого очікує транспорт
- `refreshOAuth`: провайдер володіє оновленням OAuth, коли спільних засобів оновлення `pi-ai`
  недостатньо
- `buildAuthDoctorHint`: провайдер додає вказівки з відновлення, коли оновлення OAuth
  не вдається
- `matchesContextOverflowError`: провайдер розпізнає специфічні для провайдера
  помилки переповнення вікна контексту, які загальні евристики могли б пропустити
- `classifyFailoverReason`: провайдер зіставляє сирі помилки транспорту/API, специфічні для провайдера,
  з причинами резервного переходу, як-от обмеження швидкості або перевантаження
- `isCacheTtlEligible`: провайдер визначає, які upstream ідентифікатори моделей підтримують TTL кешу промптів
- `buildMissingAuthMessage`: провайдер замінює загальну помилку сховища автентифікації
  на специфічну для провайдера підказку з відновлення
- `suppressBuiltInModel`: провайдер приховує застарілі upstream рядки та може повертати
  помилку постачальника для збоїв прямого визначення
- `augmentModelCatalog`: провайдер додає synthetic/кінцеві рядки каталогу після
  виявлення й об’єднання конфігурації
- `resolveThinkingProfile`: провайдер володіє точним набором рівнів `/think`,
  необов’язковими мітками відображення та рівнем за замовчуванням для вибраної моделі
- `isBinaryThinking`: hook сумісності для двійкового UX thinking увімк./вимк.
- `supportsXHighThinking`: hook сумісності для вибраних моделей `xhigh`
- `resolveDefaultThinkingLevel`: hook сумісності для політики `/think` за замовчуванням
- `applyConfigDefaults`: провайдер застосовує глобальні значення за замовчуванням, специфічні для провайдера,
  під час матеріалізації конфігурації на основі режиму автентифікації, env або сімейства моделей
- `isModernModelRef`: провайдер володіє відповідністю бажаної моделі для live/smoke
- `prepareRuntimeAuth`: провайдер перетворює налаштовані облікові дані на короткоживучий токен часу виконання
- `resolveUsageAuth`: провайдер визначає облікові дані використання/квоти для `/usage`
  і пов’язаних поверхонь стану/звітності
- `fetchUsageSnapshot`: провайдер володіє отриманням/розбором endpoint використання, тоді як
  ядро й далі володіє оболонкою підсумку та форматуванням
- `onModelSelected`: провайдер запускає побічні ефекти після вибору моделі, наприклад
  телеметрію або ведення сесії, яким володіє провайдер

Поточні вбудовані приклади:

- `anthropic`: резервний механізм forward-compat для Claude 4.6, підказки з відновлення автентифікації, отримання даних endpoint використання, метадані cache-TTL/сімейства провайдера та глобальні значення конфігурації за замовчуванням з урахуванням автентифікації
- `amazon-bedrock`: зіставлення переповнення контексту, яким володіє провайдер, і класифікація причин резервного переходу для специфічних для Bedrock помилок throttle/not-ready, а також спільне сімейство повторів `anthropic-by-model` для захисту політики повторів лише для Claude у трафіку Anthropic
- `anthropic-vertex`: захист політики повторів лише для Claude у трафіку повідомлень Anthropic
- `openrouter`: наскрізні ідентифікатори моделей, обгортки запитів, підказки щодо можливостей провайдера, санітизація thought-signature Gemini у проксі-трафіку Gemini, ін’єкція reasoning через проксі через сімейство стримів `openrouter-thinking`, пересилання метаданих маршрутизації та політика cache-TTL
- `github-copilot`: онбординг/вхід через пристрій, резервний механізм моделі forward-compat, підказки транскрипту Claude-thinking, обмін токенами часу виконання та отримання даних endpoint використання
- `openai`: резервний механізм forward-compat для GPT-5.4, нормалізація прямого транспорту OpenAI, підказки щодо відсутньої автентифікації з урахуванням Codex, приглушення Spark, synthetic рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація псевдонімів токенів використання (`input` / `output` і сімейства `prompt` / `completion`), спільне сімейство стримів `openai-responses-defaults` для нативних обгорток OpenAI/Codex, метадані сімейства провайдера, реєстрація вбудованого провайдера генерації зображень для `gpt-image-1` і реєстрація вбудованого провайдера генерації відео для `sora-2`
- `google` і `google-gemini-cli`: резервний механізм forward-compat для Gemini 3.1, нативна перевірка повторів Gemini, санітизація bootstrap replay, режим виводу reasoning з тегами, зіставлення сучасних моделей, реєстрація вбудованого провайдера генерації зображень для моделей Gemini image-preview і реєстрація вбудованого провайдера генерації відео для моделей Veo; Gemini CLI OAuth також володіє форматуванням токенів профілю автентифікації, розбором токенів використання та отриманням endpoint квоти для поверхонь використання
- `moonshot`: спільний транспорт, нормалізація payload thinking, якою володіє Plugin
- `kilocode`: спільний транспорт, заголовки запитів, якими володіє Plugin, нормалізація payload reasoning, санітизація thought-signature proxy-Gemini та політика cache-TTL
- `zai`: резервний механізм forward-compat для GLM-5, типові значення `tool_stream`, політика cache-TTL, політика binary-thinking/live-model і автентифікація використання + отримання квоти; невідомі ідентифікатори `glm-5*` синтезуються з вбудованого шаблону `glm-4.7`
- `xai`: нормалізація нативного транспорту Responses, переписування псевдонімів `/fast` для швидких варіантів Grok, типовий `tool_stream`, очищення схем інструментів / payload reasoning, специфічне для xAI, і реєстрація вбудованого провайдера генерації відео для `grok-imagine-video`
- `mistral`: метадані можливостей, якими володіє Plugin
- `opencode` і `opencode-go`: метадані можливостей, якими володіє Plugin, а також санітизація thought-signature proxy-Gemini
- `alibaba`: каталог генерації відео, яким володіє Plugin, для прямих посилань на моделі Wan, таких як `alibaba/wan2.6-t2v`
- `byteplus`: каталоги, якими володіє Plugin, а також реєстрація вбудованого провайдера генерації відео для моделей Seedance text-to-video/image-to-video
- `fal`: реєстрація вбудованого провайдера генерації відео для розміщеного стороннього провайдера генерації зображень для моделей зображень FLUX, а також реєстрація вбудованого провайдера генерації відео для розміщених сторонніх відеомоделей
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги, якими володіє Plugin
- `qwen`: каталоги, якими володіє Plugin, для текстових моделей, а також спільні
  реєстрації провайдерів розуміння медіа та генерації відео для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні DashScope video
  endpoint з вбудованими моделями Wan, такими як `wan2.6-t2v` і `wan2.7-r2v`
- `runway`: реєстрація провайдера генерації відео, якою володіє Plugin, для нативних
  моделей Runway на основі завдань, таких як `gen4.5`
- `minimax`: каталоги, якими володіє Plugin, реєстрація вбудованого провайдера генерації відео
  для відеомоделей Hailuo, реєстрація вбудованого провайдера генерації зображень
  для `image-01`, вибір політики повторів гібриду Anthropic/OpenAI і логіка
  автентифікації/знімка використання
- `together`: каталоги, якими володіє Plugin, а також реєстрація вбудованого провайдера генерації відео
  для відеомоделей Wan
- `xiaomi`: каталоги, якими володіє Plugin, а також логіка
  автентифікації/знімка використання

Вбудований Plugin `openai` тепер володіє обома ідентифікаторами провайдера: `openai` і
`openai-codex`.

Це охоплює провайдерів, які все ще вписуються у звичайні транспорти OpenClaw. Провайдер,
якому потрібен повністю користувацький виконавець запитів, — це окрема, глибша поверхня розширення.

## Ротація API-ключів

- Підтримує загальну ротацію провайдерів для вибраних провайдерів.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для провайдерів Google `GOOGLE_API_KEY` також включається як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідях з обмеженням швидкості (
  наприклад `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичних повідомленнях про ліміт використання).
- Збої, не пов’язані з обмеженням швидкості, завершуються негайно; ротація ключів не виконується.
- Коли всі ключі-кандидати зазнають невдачі, повертається фінальна помилка з останньої спроби.

## Вбудовані провайдери (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Ці провайдери **не** потребують
конфігурації `models.providers`; достатньо налаштувати автентифікацію й вибрати модель.

### OpenAI

- Провайдер: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий транспорт — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Розігрів OpenAI Responses WebSocket типово увімкнено через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити `openai/*` Responses з `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не
  до загальних проксі, сумісних з OpenAI
- Нативні маршрути OpenAI також зберігають `store` Responses, підказки кешу промптів і
  формування payload сумісності reasoning OpenAI; проксі-маршрути — ні
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live OpenAI API його відхиляє; Spark вважається доступним лише для Codex

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
- Прямі публічні запити Anthropic також підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком, автентифікованим API-ключем і OAuth, що надсилається на `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- Setup-token Anthropic залишається доступним як підтримуваний шлях токена OpenClaw, але OpenClaw тепер надає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.

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
- Перевизначення для окремої моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних проксі, сумісних з OpenAI
- Має той самий спільний перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли каталог OAuth Codex її показує; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає нативні `contextWindow = 1050000` і типові значення часу виконання `contextTokens = 272000`; перевизначте ліміт часу виконання через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OAuth OpenAI Codex явно підтримується для зовнішніх інструментів/робочих процесів, як-от OpenClaw.

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

- [Qwen Cloud](/uk/providers/qwen): поверхня провайдера Qwen Cloud, а також зіставлення endpoint Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): OAuth MiniMax Coding Plan або доступ за API-ключем
- [GLM Models](/uk/providers/glm): Z.AI Coding Plan або загальні API endpoint

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Провайдер часу виконання Zen: `opencode`
- Провайдер часу виконання Go: `opencode-go`
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
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний варіант `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw, що використовує `google/gemini-3.1-flash-preview`, нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застарілий `cached_content`) для пересилання нативного для провайдера
  дескриптора `cachedContents/...`; влучання кешу Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Провайдери: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI використовує власний потік OAuth
- Застереження: Gemini CLI OAuth в OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікового запису Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і використовуйте некритичний обліковий запис, якщо вирішите продовжити.
- Gemini CLI OAuth постачається як частина вбудованого Plugin `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкнення: `openclaw plugins enable google`
  - Вхід: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Типова модель: `google-gemini-cli/gemini-3-flash-preview`
  - Примітка: вам **не** потрібно вставляти client id або secret у `openclaw.json`. Потік входу CLI зберігає
    токени в профілях автентифікації на хості Gateway.
  - Якщо запити не працюють після входу, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway.
  - Відповіді Gemini CLI JSON розбираються з `response`; використання резервно береться з
    `stats`, а `stats.cached` нормалізується до OpenClaw `cacheRead`.

### Z.AI (GLM)

- Провайдер: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово задають конкретну поверхню

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
- Базовий URL: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live-виявлення через
  `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог
  часу виконання.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Див. [/providers/kilocode](/uk/providers/kilocode) для деталей налаштування.

### Інші вбудовані Plugin провайдерів

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані заголовки атрибуції застосунку OpenRouter лише тоді, коли
  запит справді спрямовано на `openrouter.ai`
- Специфічні для OpenRouter маркери Anthropic `cache_control` так само обмежені
  перевіреними маршрутами OpenRouter, а не довільними проксі URL
- OpenRouter залишається на шляху проксі у стилі OpenAI-compatible, тому нативне
  формування запитів лише для OpenAI (`serviceTier`, Responses `store`,
  підказки кешу промптів, payload сумісності reasoning OpenAI) не пересилається
- Посилання OpenRouter на основі Gemini зберігають лише санітизацію thought-signature proxy-Gemini;
  нативна перевірка повторів Gemini і bootstrap-переписування залишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на основі Gemini зберігають той самий шлях санітизації thought-signature
  proxy-Gemini; `kilocode/kilo/auto` та інші підказки без підтримки proxy reasoning
  пропускають ін’єкцію proxy reasoning
- MiniMax: `minimax` (API-ключ) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Онбординг/API-ключ MiniMax записує явні визначення моделей M2.7 з
  `input: ["text", "image"]`; вбудований каталог провайдера зберігає chat-посилання
  лише текстовими, доки ця конфігурація провайдера не буде матеріалізована
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
  - Базовий URL, сумісний з OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Див. [Hugging Face (Inference)](/uk/providers/huggingface).

## Провайдери через `models.providers` (custom/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додавати **custom** провайдерів або
проксі, сумісні з OpenAI/Anthropic.

Багато вбудованих Plugin провайдерів нижче вже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий базовий URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований Plugin провайдера. Типово використовуйте вбудований провайдер,
а явний запис `models.providers.moonshot` додавайте лише тоді, коли
потрібно перевизначити базовий URL або метадані моделі:

- Провайдер: `moonshot`
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

Застарілий `kimi/k2p5` і далі приймається як ідентифікатор моделі для сумісності.

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

Під час онбордингу типовою є surface coding, але загальний каталог `volcengine/*`
реєструється одночасно.

У засобах вибору моделей під час онбордингу/налаштування вибір автентифікації Volcengine надає перевагу і рядкам
`volcengine/*`, і `volcengine-plan/*`. Якщо ці моделі ще не завантажено,
OpenClaw повертається до нефільтрованого каталогу замість того, щоб показувати порожній
засіб вибору в межах провайдера.

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

Під час онбордингу типовою є surface coding, але загальний каталог `byteplus/*`
реєструється одночасно.

У засобах вибору моделей під час онбордингу/налаштування вибір автентифікації BytePlus надає перевагу і рядкам
`byteplus/*`, і `byteplus-plan/*`. Якщо ці моделі ще не завантажено,
OpenClaw повертається до нефільтрованого каталогу замість того, щоб показувати порожній
засіб вибору в межах провайдера.

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

Synthetic надає моделі, сумісні з Anthropic, через провайдера `synthetic`:

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

MiniMax налаштовується через `models.providers`, оскільки використовує custom endpoint:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Див. [/providers/minimax](/uk/providers/minimax) для деталей налаштування, варіантів моделей і фрагментів конфігурації.

На Anthropic-compatible шляху стримінгу MiniMax OpenClaw типово вимикає thinking,
якщо ви не задали його явно, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Розподіл можливостей, якими володіє Plugin:

- Типові значення для тексту/чату залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, яким володіє Plugin, на обох шляхах автентифікації MiniMax
- Вебпошук залишається на ідентифікаторі провайдера `minimax`

### LM Studio

LM Studio постачається як вбудований Plugin провайдера, який використовує нативний API:

- Провайдер: `lmstudio`
- Автентифікація: `LM_API_TOKEN`
- Типовий базовий URL inference: `http://localhost:1234/v1`

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
Див. [/providers/lmstudio](/uk/providers/lmstudio) для налаштування та усунення несправностей.

### Ollama

Ollama постачається як вбудований Plugin провайдера й використовує нативний API Ollama:

- Провайдер: `ollama`
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

Ollama виявляється локально за адресою `http://127.0.0.1:11434`, коли ви явно вмикаєте її через
`OLLAMA_API_KEY`, а вбудований Plugin провайдера додає Ollama безпосередньо до
`openclaw onboard` і засобу вибору моделей. Див. [/providers/ollama](/uk/providers/ollama)
щодо онбордингу, cloud/local режиму й custom конфігурації.

### vLLM

vLLM постачається як вбудований Plugin провайдера для локальних/self-hosted
серверів, сумісних з OpenAI:

- Провайдер: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий базовий URL: `http://127.0.0.1:8000/v1`

Щоб увімкнути автодискавері локально (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

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

Див. [/providers/vllm](/uk/providers/vllm) для деталей.

### SGLang

SGLang постачається як вбудований Plugin провайдера для швидких self-hosted
серверів, сумісних з OpenAI:

- Провайдер: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий базовий URL: `http://127.0.0.1:30000/v1`

Щоб увімкнути автодискавері локально (підійде будь-яке значення, якщо ваш сервер не
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

Див. [/providers/sglang](/uk/providers/sglang) для деталей.

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

- Для custom провайдерів `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими.
  Якщо їх не вказано, OpenClaw використовує типові значення:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, що відповідають лімітам вашого проксі/моделі.
- Для `api: "openai-completions"` на ненативних endpoint (будь-який непорожній `baseUrl`, у якого host не `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникнути помилок провайдера 400 для непідтримуваних ролей `developer`.
- Маршрути OpenAI-compatible у стилі проксі також пропускають нативне формування запитів лише для OpenAI:
  без `service_tier`, без `store` Responses, без підказок кешу промптів, без
  формування payload сумісності reasoning OpenAI і без прихованих заголовків
  атрибуції OpenClaw.
- Якщо `baseUrl` порожній/не вказаний, OpenClaw зберігає типову поведінку OpenAI (яка вказує на `api.openai.com`).
- З міркувань безпеки явне `compat.supportsDeveloperRole: true` все одно перевизначається на ненативних endpoint `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язане

- [Models](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Model Failover](/uk/concepts/model-failover) — ланцюжки резервного переходу та поведінка повторних спроб
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделі
- [Providers](/uk/providers) — окремі посібники з налаштування провайдерів
