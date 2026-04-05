---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Ви хочете приклади конфігурацій або команд онбордингу CLI для постачальників моделей
summary: Огляд постачальників моделей із прикладами конфігурацій і потоків CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-05T22:25:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d1abbc3c1937637e25d77123b770e56e64d674db5b8521967af1143e59c83ab
    source_path: concepts/model-providers.md
    workflow: 15
---

# Постачальники моделей

На цій сторінці описано **LLM/постачальників моделей** (а не канали чату, як-от WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви задаєте `agents.defaults.models`, це стає списком дозволених.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Резервні правила часу виконання, перевірки cool-down і збереження перевизначень сесії
  задокументовано в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це рідні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичне обмеження часу виконання.
- Плагіни постачальників можуть додавати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об’єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести постачальників можуть оголошувати `providerAuthEnvVars`, щоб загальні перевірки
  автентифікації на основі змінних середовища не потребували завантаження часу виконання плагіна. Мапа
  змінних середовища в ядрі, що лишається, тепер використовується лише для постачальників ядра/без плагінів
  і кількох випадків загального пріоритету, як-от онбординг Anthropic із пріоритетом API-ключа.
- Плагіни постачальників також можуть володіти поведінкою постачальника під час виконання через
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
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, and
  `onModelSelected`.
- Примітка: `capabilities` постачальника під час виконання — це спільні метадані раннера
  (сімейство постачальника, особливості transcript/tooling, підказки щодо transport/cache). Це не те
  саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model),
  яка описує, що реєструє плагін (текстовий inference, мовлення тощо).

## Поведінка постачальника, якою володіє плагін

Тепер плагіни постачальників можуть володіти більшістю специфічної для постачальника логіки, тоді як OpenClaw зберігає
загальний цикл inference.

Типовий розподіл:

- `auth[].run` / `auth[].runNonInteractive`: постачальник володіє потоками онбордингу/входу
  для `openclaw onboard`, `openclaw models auth` і безголового налаштування
- `wizard.setup` / `wizard.modelPicker`: постачальник володіє мітками вибору автентифікації,
  застарілими псевдонімами, підказками списку дозволених для онбордингу та елементами
  налаштування в засобах вибору онбордингу/моделей
- `catalog`: постачальник з’являється в `models.providers`
- `normalizeModelId`: постачальник нормалізує застарілі/preview ідентифікатори моделей перед
  пошуком або канонізацією
- `normalizeTransport`: постачальник нормалізує `api` / `baseUrl` сімейства transport
  перед загальним складанням моделі; OpenClaw спочатку перевіряє відповідного постачальника,
  потім інші плагіни постачальників із підтримкою хуків, доки один із них справді не змінить
  transport
- `normalizeConfig`: постачальник нормалізує конфігурацію `models.providers.<id>` перед
  використанням під час виконання; OpenClaw спочатку перевіряє відповідного постачальника, потім інші
  плагіни постачальників із підтримкою хуків, доки один із них справді не змінить конфігурацію. Якщо жоден
  хук постачальника не переписує конфігурацію, вбудовані допоміжні засоби сімейства Google все одно
  нормалізують підтримувані записи постачальників Google.
- `applyNativeStreamingUsageCompat`: постачальник застосовує переписування сумісності використання native streaming, керовані endpoint, для конфігураційних постачальників
- `resolveConfigApiKey`: постачальник визначає автентифікацію через маркер змінної середовища для конфігураційних постачальників
  без примусового завантаження повної runtime-автентифікації. `amazon-bedrock` також має
  вбудований розв’язувач AWS env-marker тут, хоча runtime-автентифікація Bedrock використовує
  стандартний ланцюжок AWS SDK.
- `resolveSyntheticAuth`: постачальник може надавати локальну/self-hosted або іншу
  доступність автентифікації, що спирається на конфігурацію, без збереження відкритих секретів
- `shouldDeferSyntheticProfileAuth`: постачальник може позначати збережені synthetic profile
  placeholders як менш пріоритетні, ніж автентифікація на основі env/config
- `resolveDynamicModel`: постачальник приймає ідентифікатори моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: постачальнику потрібне оновлення метаданих перед повторною спробою
  динамічного визначення
- `normalizeResolvedModel`: постачальнику потрібні переписування transport або base URL
- `contributeResolvedModelCompat`: постачальник додає прапорці сумісності для своїх
  vendor-моделей, навіть якщо вони надходять через інший сумісний transport
- `capabilities`: постачальник публікує особливості transcript/tooling/provider-family
- `normalizeToolSchemas`: постачальник очищає схеми інструментів перед тим, як вбудований
  раннер їх побачить
- `inspectToolSchemas`: постачальник показує попередження про схеми, специфічні для transport,
  після нормалізації
- `resolveReasoningOutputMode`: постачальник вибирає native чи tagged
  контракти виводу reasoning
- `prepareExtraParams`: постачальник задає типові або нормалізує параметри запиту для кожної моделі
- `createStreamFn`: постачальник замінює звичайний шлях stream повністю
  кастомним transport
- `wrapStreamFn`: постачальник застосовує обгортки сумісності для заголовків/тіла/моделі запиту
- `resolveTransportTurnState`: постачальник надає native заголовки transport
  або метадані для кожного turn
- `resolveWebSocketSessionPolicy`: постачальник надає native заголовки WebSocket-сесії
  або політику cool-down сесії
- `createEmbeddingProvider`: постачальник володіє поведінкою embedding пам’яті, коли вона
  має належати плагіну постачальника, а не основному перемикачу embedding
- `formatApiKey`: постачальник форматує збережені профілі автентифікації в runtime-рядок
  `apiKey`, який очікує transport
- `refreshOAuth`: постачальник володіє оновленням OAuth, коли спільних засобів оновлення `pi-ai`
  недостатньо
- `buildAuthDoctorHint`: постачальник додає рекомендації з виправлення, коли оновлення OAuth
  не вдається
- `matchesContextOverflowError`: постачальник розпізнає специфічні для постачальника
  помилки переповнення контекстного вікна, які загальні евристики не виявлять
- `classifyFailoverReason`: постачальник зіставляє специфічні для постачальника сирі помилки transport/API
  з причинами failover, як-от обмеження швидкості або перевантаження
- `isCacheTtlEligible`: постачальник вирішує, які upstream-ідентифікатори моделей підтримують TTL кешу prompt
- `buildMissingAuthMessage`: постачальник замінює загальну помилку сховища автентифікації
  на специфічну для постачальника підказку з відновлення
- `suppressBuiltInModel`: постачальник приховує застарілі upstream-рядки та може повернути
  помилку, керовану vendor, для прямих помилок визначення
- `augmentModelCatalog`: постачальник додає synthetic/final рядки каталогу після
  виявлення та об’єднання конфігурацій
- `isBinaryThinking`: постачальник володіє UX бінарного ввімкнення/вимкнення thinking
- `supportsXHighThinking`: постачальник додає вибраним моделям підтримку `xhigh`
- `resolveDefaultThinkingLevel`: постачальник володіє типовою політикою `/think` для
  сімейства моделей
- `applyConfigDefaults`: постачальник застосовує специфічні для постачальника глобальні значення за замовчуванням
  під час матеріалізації конфігурації на основі режиму автентифікації, env або сімейства моделей
- `isModernModelRef`: постачальник володіє зіставленням бажаної моделі для live/smoke
- `prepareRuntimeAuth`: постачальник перетворює налаштовані облікові дані на короткоживучий
  runtime-токен
- `resolveUsageAuth`: постачальник визначає облікові дані використання/квот для `/usage`
  і пов’язаних поверхонь статусу/звітності
- `fetchUsageSnapshot`: постачальник володіє отриманням/розбором endpoint використання, тоді як
  ядро все ще володіє оболонкою підсумку та форматуванням
- `onModelSelected`: постачальник виконує побічні дії після вибору моделі, як-от
  telemetry або ведення сесії, яким володіє постачальник

Поточні вбудовані приклади:

- `anthropic`: резервна сумісність уперед для Claude 4.6, підказки з відновлення автентифікації, отримання
  endpoint використання, метадані cache-TTL/provider-family і глобальні
  значення конфігурації за замовчуванням з урахуванням автентифікації
- `amazon-bedrock`: зіставлення переповнення контексту та класифікація
  причин failover для специфічних для Bedrock помилок throttle/not-ready, а також
  спільне сімейство повторів `anthropic-by-model` для захисту політики повторів лише для Claude
  на трафіку Anthropic
- `anthropic-vertex`: захист політики повторів лише для Claude на Anthropic-message
  трафіку
- `openrouter`: наскрізні ідентифікатори моделей, обгортки запитів, підказки можливостей постачальника,
  санітизація thought-signature Gemini на проксійованому трафіку Gemini,
  ін’єкція reasoning через проксі через сімейство stream `openrouter-thinking`,
  пересилання метаданих маршрутизації та політика cache-TTL
- `github-copilot`: онбординг/вхід із пристрою, резервна сумісність моделей уперед,
  підказки transcript thinking для Claude, обмін runtime-токенів і отримання endpoint використання
- `openai`: резервна сумісність уперед для GPT-5.4, пряма нормалізація
  transport OpenAI, підказки про відсутню автентифікацію з урахуванням Codex, приглушення Spark, synthetic
  рядки каталогу OpenAI/Codex, політика thinking/live-model, нормалізація псевдонімів токенів використання
  (`input` / `output` і сімейства `prompt` / `completion`), спільне
  сімейство stream `openai-responses-defaults` для native обгорток OpenAI/Codex,
  метадані сімейства постачальника, реєстрація вбудованого постачальника генерації зображень
  для `gpt-image-1` і вбудована реєстрація постачальника генерації відео
  для `sora-2`
- `google`: резервна сумісність уперед для Gemini 3.1, native валідація повторів Gemini,
  санітизація bootstrap replay, режим tagged reasoning-output,
  зіставлення modern-model, вбудована реєстрація постачальника генерації зображень для
  моделей Gemini image-preview і вбудована реєстрація постачальника генерації відео
  для моделей Veo
- `moonshot`: спільний transport, нормалізація payload thinking, якою володіє плагін
- `kilocode`: спільний transport, заголовки запитів, якими володіє плагін, нормалізація payload reasoning,
  санітизація thought-signature Gemini через проксі та політика cache-TTL
- `zai`: резервна сумісність уперед для GLM-5, типові значення `tool_stream`, політика cache-TTL,
  політика binary-thinking/live-model, а також автентифікація використання + отримання квот;
  невідомі ідентифікатори `glm-5*` синтезуються з шаблону вбудованого `glm-4.7`
- `xai`: native нормалізація transport Responses, переписування псевдонімів `/fast` для
  швидких варіантів Grok, типове `tool_stream`, очищення специфічних для xAI схем інструментів /
  payload reasoning і вбудована реєстрація постачальника генерації відео
  для `grok-imagine-video`
- `mistral`: метадані можливостей, якими володіє плагін
- `opencode` і `opencode-go`: метадані можливостей, якими володіє плагін, плюс
  санітизація thought-signature Gemini через проксі
- `alibaba`: каталог генерації відео, яким володіє плагін, для прямих посилань на моделі Wan
  як-от `alibaba/wan2.6-t2v`
- `byteplus`: каталоги, якими володіє плагін, плюс вбудована реєстрація постачальника генерації відео
  для моделей text-to-video/image-to-video Seedance
- `fal`: вбудована реєстрація постачальника генерації відео для розміщених сторонніх
  моделей, реєстрація постачальника генерації зображень для моделей FLUX плюс вбудована
  реєстрація постачальника генерації відео для розміщених сторонніх відеомоделей
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги, якими володіє плагін
- `qwen`: каталоги, якими володіє плагін, для текстових моделей плюс спільні
  реєстрації постачальників media-understanding і video-generation для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні video-endpoint-и DashScope
  з вбудованими моделями Wan, як-от `wan2.6-t2v` і `wan2.7-r2v`
- `minimax`: каталоги, якими володіє плагін, вбудована реєстрація постачальника генерації відео
  для моделей відео Hailuo, вбудована реєстрація постачальника генерації зображень
  для `image-01`, гібридний вибір політики повторів Anthropic/OpenAI та логіка
  автентифікації/знімка використання
- `together`: каталоги, якими володіє плагін, плюс вбудована реєстрація постачальника генерації відео
  для моделей відео Wan
- `xiaomi`: каталоги, якими володіє плагін, плюс логіка автентифікації/знімка використання

Вбудований плагін `openai` тепер володіє обома ідентифікаторами постачальника: `openai` і
`openai-codex`.

Це охоплює постачальників, які ще вписуються у звичайні transport-и OpenClaw. Постачальник,
якому потрібен повністю кастомний виконавець запитів, — це окрема, глибша поверхня розширення.

## Ротація API-ключів

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (єдине live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google `GOOGLE_API_KEY` також включається як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідях із обмеженням швидкості (наприклад
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичних повідомленнях про обмеження використання).
- Помилки, не пов’язані з обмеженням швидкості, одразу завершуються помилкою; ротація ключів не виконується.
- Коли всі можливі ключі не спрацьовують, повертається фінальна помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих постачальників **не потрібна**
конфігурація `models.providers`; достатньо налаштувати автентифікацію та вибрати модель.

### OpenAI

- Постачальник: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов’язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, плюс `OPENCLAW_LIVE_OPENAI_KEY` (єдине перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий transport — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для кожної моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Прогрівання OpenAI Responses WebSocket типово ввімкнене через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити Responses `openai/*` до `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до native-трафіку OpenAI на `api.openai.com`, а не
  до загальних сумісних із OpenAI проксі
- Native-маршрути OpenAI також зберігають Responses `store`, підказки кешу prompt і
  формування payload для сумісності reasoning OpenAI; маршрути через проксі цього не роблять
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live OpenAI API його відхиляє; Spark вважається лише Codex

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
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, включно з трафіком із автентифікацією через API-ключ і OAuth, який надсилається на `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо білінгу: для Anthropic в OpenClaw практичний поділ — це **API key** або **підписка Claude з Extra Usage**. Anthropic повідомив користувачів OpenClaw **4 квітня 2026 року о 12:00 PM PT / 8:00 PM BST**, що шлях входу Claude в **OpenClaw** вважається використанням стороннього harness і вимагає **Extra Usage**, що оплачується окремо від підписки. Наші локальні відтворення також показують, що prompt-рядок із ідентифікацією OpenClaw не відтворюється на шляху Anthropic SDK + API-key.
- Setup-token Anthropic знову доступний як застарілий/ручний шлях OpenClaw. Використовуйте його з розумінням того, що Anthropic повідомив користувачам OpenClaw, що цей шлях вимагає **Extra Usage**.

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
- Перевизначення для кожної моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в native-запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до native-трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних сумісних із OpenAI проксі
- Використовує той самий перемикач `/fast` і конфігурацію `params.fastMode`, що й прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли каталог Codex OAuth її показує; залежить від entitlement
- `openai-codex/gpt-5.4` зберігає native `contextWindow = 1050000` і типове runtime-значення `contextTokens = 272000`; перевизначте runtime-обмеження через `models.providers.openai-codex.models[].contextTokens`
- Примітка щодо політики: OpenAI Codex OAuth явно підтримується для зовнішніх інструментів/потоків роботи, як-от OpenClaw.

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
- [MiniMax](/uk/providers/minimax): доступ через OAuth або API key MiniMax Coding Plan
- [GLM Models](/uk/providers/glm): Z.AI Coding Plan або загальні API-endpoint-и

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Постачальник runtime Zen: `opencode`
- Постачальник runtime Go: `opencode-go`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Постачальник: `google`
- Автентифікація: `GEMINI_API_KEY`
- Необов’язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (єдине перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застаріле `cached_content`) для пересилання native-дескриптора постачальника
  `cachedContents/...`; попадання в кеш Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex

- Постачальник: `google-vertex`
- Автентифікація: gcloud ADC
  - JSON-відповіді Gemini CLI розбираються з `response`; використання резервно береться з
    `stats`, а `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідний endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово вибирають певну поверхню

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
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live-виявлення через
  `https://api.kilo.ai/api/gateway/models` може додатково розширити runtime-каталог.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Докладні відомості про налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані плагіни постачальників

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані заголовки атрибуції застосунку OpenRouter лише тоді, коли
  запит справді надсилається на `openrouter.ai`
- Маркери `cache_control`, специфічні для OpenRouter Anthropic, так само обмежуються
  перевіреними маршрутами OpenRouter, а не довільними proxy URL
- OpenRouter лишається на проксійному шляху, сумісному з OpenAI, тож native-формування
  запитів лише для OpenAI (`serviceTier`, Responses `store`,
  підказки кешу prompt, payload для сумісності reasoning OpenAI) не пересилається
- Посилання OpenRouter на основі Gemini зберігають лише санітизацію thought-signature Gemini через проксі;
  native-валідація повторів Gemini і переписування bootstrap лишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на основі Gemini зберігають той самий шлях санітизації thought-signature
  Gemini через проксі; підказки `kilocode/kilo/auto` та інші підказки про непідтримку proxy reasoning
  пропускають ін’єкцію reasoning через проксі
- MiniMax: `minimax` (API key) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Налаштування MiniMax через онбординг/API-key записує явні визначення моделі M2.7 з
  `input: ["text", "image"]`; вбудований каталог постачальника зберігає посилання чату
  лише текстовими, доки не буде матеріалізовано конфігурацію постачальника
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
  - Native-вбудовані запити xAI використовують шлях xAI Responses
  - `/fast` або `params.fastMode: true` переписує `grok-3`, `grok-3-mini`,
    `grok-4` і `grok-4-0709` на їхні варіанти `*-fast`
  - `tool_stream` типово ввімкнений; установіть
    `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
    вимкнути його
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Приклад моделі: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Моделі GLM у Cerebras використовують ідентифікатори `zai-glm-4.7` і `zai-glm-4.6`.
  - Base URL, сумісний із OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Див. [Hugging Face (Inference)](/uk/providers/huggingface).

## Постачальники через `models.providers` (custom/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **кастомних** постачальників або
проксі, сумісні з OpenAI/Anthropic.

Багато з наведених нижче вбудованих плагінів постачальників уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типовий base URL, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований плагін постачальника. Типово використовуйте вбудованого постачальника,
а явний запис `models.providers.moonshot` додавайте лише тоді, коли
потрібно перевизначити base URL або метадані моделі:

- Постачальник: `moonshot`
- Автентифікація: `MOONSHOT_API_KEY`
- Приклад моделі: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` або `openclaw onboard --auth-choice moonshot-api-key-cn`

Ідентифікатори моделей Kimi K2:

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

Kimi Coding використовує endpoint Moonshot AI, сумісний із Anthropic:

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

Застарілий `kimi/k2p5` все ще приймається як сумісний ідентифікатор моделі.

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

У засобах вибору моделі під час онбордингу/налаштування вибір автентифікації Volcengine віддає перевагу і рядкам
`volcengine/*`, і `volcengine-plan/*`. Якщо ці моделі ще не завантажено,
OpenClaw резервно використовує нефільтрований каталог замість порожнього
засобу вибору постачальника.

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

### BytePlus (International)

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

У засобах вибору моделі під час онбордингу/налаштування вибір автентифікації BytePlus віддає перевагу і рядкам
`byteplus/*`, і `byteplus-plan/*`. Якщо ці моделі ще не завантажено,
OpenClaw резервно використовує нефільтрований каталог замість порожнього
засобу вибору постачальника.

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

Synthetic надає моделі, сумісні з Anthropic, через постачальника `synthetic`:

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

MiniMax налаштовується через `models.providers`, оскільки використовує кастомні endpoint-и:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Докладні відомості про налаштування, варіанти моделей і фрагменти конфігурацій див. у [/providers/minimax](/uk/providers/minimax).

На Anthropic-сумісному шляху streaming MiniMax OpenClaw типово вимикає thinking,
якщо ви не задасте його явно, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Розподіл можливостей, яким володіє плагін:

- Типові значення text/chat лишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, яким володіє плагін, на обох шляхах автентифікації MiniMax
- Вебпошук лишається на ідентифікаторі постачальника `minimax`

### Ollama

Ollama постачається як вбудований плагін постачальника й використовує native API Ollama:

- Постачальник: `ollama`
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

Ollama локально виявляється за адресою `http://127.0.0.1:11434`, коли ви вмикаєте її через
`OLLAMA_API_KEY`, а вбудований плагін постачальника додає Ollama безпосередньо до
`openclaw onboard` і засобу вибору моделей. Див. [/providers/ollama](/uk/providers/ollama)
щодо онбордингу, хмарного/локального режиму та кастомної конфігурації.

### vLLM

vLLM постачається як вбудований плагін постачальника для локальних/self-hosted
серверів, сумісних із OpenAI:

- Постачальник: `vllm`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:8000/v1`

Щоб увімкнути локальне автоматичне виявлення (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

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

Докладні відомості див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований плагін постачальника для швидких self-hosted
серверів, сумісних із OpenAI:

- Постачальник: `sglang`
- Автентифікація: необов’язкова (залежить від вашого сервера)
- Типовий base URL: `http://127.0.0.1:30000/v1`

Щоб увімкнути локальне автоматичне виявлення (підійде будь-яке значення, якщо ваш сервер не
вимагає автентифікації):

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

Докладні відомості див. у [/providers/sglang](/uk/providers/sglang).

### Локальні проксі (LM Studio, vLLM, LiteLLM тощо)

Приклад (сумісний із OpenAI):

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

- Для кастомних постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов’язковими.
  Якщо їх пропущено, OpenClaw типово використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендовано: задавайте явні значення, що відповідають обмеженням вашого проксі/моделі.
- Для `api: "openai-completions"` на не-native endpoint-ах (будь-який непорожній `baseUrl`, чий хост не є `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникнути помилок 400 від постачальника через непідтримувані ролі `developer`.
- Маршрути через проксі, сумісні з OpenAI, також пропускають native-формування
  запитів лише для OpenAI: без `service_tier`, без Responses `store`, без підказок кешу prompt, без
  формування payload для сумісності reasoning OpenAI і без прихованих заголовків атрибуції OpenClaw.
- Якщо `baseUrl` порожній/не заданий, OpenClaw зберігає типову поведінку OpenAI (яка зіставляється з `api.openai.com`).
- З міркувань безпеки явне `compat.supportsDeveloperRole: true` все одно перевизначається на не-native endpoint-ах `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов’язані сторінки

- [Models](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Model Failover](/uk/concepts/model-failover) — ланцюжки резервного перемикання та поведінка повторних спроб
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделей
- [Providers](/uk/providers) — інструкції з налаштування для кожного постачальника
