---
read_when:
    - Вам потрібен довідник із налаштування моделей для кожного постачальника окремо
    - Вам потрібні приклади конфігурацій або команд CLI для онбордингу постачальників моделей
summary: Огляд постачальників моделей із прикладами конфігурацій і потоків CLI
title: Постачальники моделей
x-i18n:
    generated_at: "2026-04-06T12:44:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec33cbfeec86c3f79ea0ec38932eebb819eba5932024b73fcf3acbc41fbce203
    source_path: concepts/model-providers.md
    workflow: 15
---

# Постачальники моделей

На цій сторінці описано **постачальників LLM/моделей** (а не канали чату, як-от WhatsApp/Telegram).
Правила вибору моделей див. у [/concepts/models](/uk/concepts/models).

## Швидкі правила

- Посилання на моделі використовують формат `provider/model` (приклад: `opencode/claude-opus-4-6`).
- Якщо ви задаєте `agents.defaults.models`, це стає списком дозволених моделей.
- Допоміжні команди CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Правила резервного перемикання під час виконання, проби періоду охолодження та збереження перевизначень сесії
  задокументовані в [/concepts/model-failover](/uk/concepts/model-failover).
- `models.providers.*.models[].contextWindow` — це нативні метадані моделі;
  `models.providers.*.models[].contextTokens` — це фактичне обмеження під час виконання.
- Плагіни постачальників можуть додавати каталоги моделей через `registerProvider({ catalog })`;
  OpenClaw об'єднує цей вивід у `models.providers` перед записом
  `models.json`.
- Маніфести постачальників можуть оголошувати `providerAuthEnvVars`, щоб загальним перевіркам
  автентифікації на основі змінних середовища не потрібно було завантажувати середовище виконання плагіна. Решта мапи змінних середовища ядра
  тепер використовується лише для не-плагінних/вбудованих постачальників і кількох випадків
  загального пріоритету, як-от онбординг Anthropic із пріоритетом API-ключа.
- Плагіни постачальників також можуть володіти логікою виконання постачальника через
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
- Примітка: `capabilities` середовища виконання постачальника — це спільні метадані виконавця (сімейство постачальника,
  особливості транскрипту/інструментів, підказки щодо транспорту/кешу). Це не
  те саме, що [публічна модель можливостей](/uk/plugins/architecture#public-capability-model),
  яка описує, що реєструє плагін (текстовий inference, мовлення тощо).

## Поведінка постачальника, що належить плагіну

Плагіни постачальників тепер можуть володіти більшістю специфічної для постачальника логіки, тоді як OpenClaw зберігає
загальний цикл inference.

Типовий розподіл:

- `auth[].run` / `auth[].runNonInteractive`: постачальник володіє потоками онбордингу/входу
  для `openclaw onboard`, `openclaw models auth` і безголового налаштування
- `wizard.setup` / `wizard.modelPicker`: постачальник володіє мітками вибору автентифікації,
  застарілими псевдонімами, підказками для списку дозволених моделей під час онбордингу та записами налаштування у вибірниках онбордингу/моделей
- `catalog`: постачальник з'являється в `models.providers`
- `normalizeModelId`: постачальник нормалізує застарілі/preview ідентифікатори моделей перед
  пошуком або канонізацією
- `normalizeTransport`: постачальник нормалізує `api` / `baseUrl` сімейства транспорту
  перед загальним складанням моделі; OpenClaw спочатку перевіряє відповідного постачальника,
  потім інші плагіни постачальників, що підтримують хуки, поки один із них фактично не змінить
  транспорт
- `normalizeConfig`: постачальник нормалізує конфігурацію `models.providers.<id>` перед
  використанням під час виконання; OpenClaw спочатку перевіряє відповідного постачальника, потім інші
  плагіни постачальників, що підтримують хуки, поки один із них фактично не змінить конфігурацію. Якщо жоден
  хук постачальника не переписує конфігурацію, вбудовані допоміжні засоби сімейства Google все одно
  нормалізують підтримувані записи постачальників Google.
- `applyNativeStreamingUsageCompat`: постачальник застосовує переписування сумісності нативного обліку використання потокового режиму для постачальників конфігурації, зумовлені кінцевою точкою
- `resolveConfigApiKey`: постачальник визначає автентифікацію маркера середовища для постачальників конфігурації
  без примусового повного завантаження автентифікації під час виконання. `amazon-bedrock` тут також має
  вбудований резолвер маркерів середовища AWS, хоча автентифікація Bedrock під час виконання використовує
  ланцюжок за замовчуванням AWS SDK.
- `resolveSyntheticAuth`: постачальник може показувати доступність локальної/self-hosted або іншої
  автентифікації на основі конфігурації без збереження відкритих секретів
- `shouldDeferSyntheticProfileAuth`: постачальник може позначати збережені синтетичні профілі-
  заповнювачі як такі, що мають нижчий пріоритет, ніж автентифікація на основі env/config
- `resolveDynamicModel`: постачальник приймає ідентифікатори моделей, яких ще немає в локальному
  статичному каталозі
- `prepareDynamicModel`: постачальнику потрібно оновити метадані перед повторною спробою
  динамічного визначення
- `normalizeResolvedModel`: постачальнику потрібно переписати транспорт або базову URL-адресу
- `contributeResolvedModelCompat`: постачальник додає прапорці сумісності для своїх
  моделей постачальника, навіть коли вони надходять через інший сумісний транспорт
- `capabilities`: постачальник публікує особливості транскрипту/інструментів/сімейства постачальників
- `normalizeToolSchemas`: постачальник очищує схеми інструментів перед тим, як їх побачить
  вбудований виконавець
- `inspectToolSchemas`: постачальник показує специфічні для транспорту попередження схеми
  після нормалізації
- `resolveReasoningOutputMode`: постачальник вибирає нативні чи теговані
  контракти виводу reasoning
- `prepareExtraParams`: постачальник задає типові значення або нормалізує параметри запиту для окремих моделей
- `createStreamFn`: постачальник замінює звичайний шлях потоку повністю
  кастомним транспортом
- `wrapStreamFn`: постачальник застосовує обгортки сумісності запиту заголовків/тіла/моделі
- `resolveTransportTurnState`: постачальник надає нативні заголовки транспорту
  або метадані для кожного ходу
- `resolveWebSocketSessionPolicy`: постачальник надає нативні заголовки сесії WebSocket
  або політику охолодження сесії
- `createEmbeddingProvider`: постачальник володіє логікою embedding для пам'яті, коли вона
  належить плагіну постачальника, а не центральному перемикачу embedding у ядрі
- `formatApiKey`: постачальник форматує збережені профілі автентифікації у
  рядок `apiKey`, який очікує транспорт під час виконання
- `refreshOAuth`: постачальник володіє оновленням OAuth, коли спільних
  оновлювачів `pi-ai` недостатньо
- `buildAuthDoctorHint`: постачальник додає вказівки з відновлення, коли оновлення OAuth
  не вдається
- `matchesContextOverflowError`: постачальник розпізнає специфічні для постачальника
  помилки переповнення вікна контексту, які загальні евристики можуть пропустити
- `classifyFailoverReason`: постачальник зіставляє специфічні для постачальника сирі помилки транспорту/API
  з причинами резервного перемикання, як-от ліміт запитів або перевантаження
- `isCacheTtlEligible`: постачальник визначає, які ідентифікатори моделей вище за потоком підтримують TTL кешу підказок
- `buildMissingAuthMessage`: постачальник замінює загальну помилку сховища автентифікації
  на специфічну для постачальника підказку з відновлення
- `suppressBuiltInModel`: постачальник приховує застарілі upstream-рядки й може повертати
  помилку, що належить постачальнику, для прямих збоїв визначення
- `augmentModelCatalog`: постачальник додає синтетичні/фінальні рядки каталогу після
  виявлення та об'єднання конфігурації
- `isBinaryThinking`: постачальник володіє UX двійкового thinking увімк./вимк.
- `supportsXHighThinking`: постачальник вмикає `xhigh` для вибраних моделей
- `resolveDefaultThinkingLevel`: постачальник володіє типовою політикою `/think` для
  сімейства моделей
- `applyConfigDefaults`: постачальник застосовує глобальні значення за замовчуванням, специфічні для постачальника,
  під час матеріалізації конфігурації залежно від режиму автентифікації, середовища чи сімейства моделей
- `isModernModelRef`: постачальник володіє зіставленням бажаних моделей для live/smoke
- `prepareRuntimeAuth`: постачальник перетворює налаштовані облікові дані на короткоживучий
  токен для виконання
- `resolveUsageAuth`: постачальник визначає облікові дані використання/квоти для `/usage`
  та пов'язаних поверхонь статусу/звітності
- `fetchUsageSnapshot`: постачальник володіє отриманням/розбором кінцевої точки використання, тоді як
  ядро все ще володіє оболонкою підсумку та форматуванням
- `onModelSelected`: постачальник виконує побічні ефекти після вибору моделі, як-от
  телеметрію або облік сесії, що належить постачальнику

Поточні вбудовані приклади:

- `anthropic`: резервна сумісність уперед для Claude 4.6, підказки з відновлення автентифікації, отримання даних
  з кінцевої точки використання, метадані TTL кешу/сімейства постачальника та глобальні
  значення конфігурації за замовчуванням з урахуванням автентифікації
- `amazon-bedrock`: специфічне для постачальника зіставлення переповнення контексту та
  класифікація причин резервного перемикання для помилок Bedrock throttle/not-ready, а також
  спільне сімейство відтворення `anthropic-by-model` для захистів політики повтору лише Claude
  на трафіку Anthropic
- `anthropic-vertex`: захисти політики повтору лише Claude на Anthropic-message
  трафіку
- `openrouter`: наскрізні ідентифікатори моделей, обгортки запитів, підказки щодо можливостей постачальника,
  санітизація підпису thought у Gemini-трафіку через проксі, ін'єкція reasoning через проксі
  через сімейство потоків `openrouter-thinking`, пересилання метаданих маршрутизації
  та політика TTL кешу
- `github-copilot`: онбординг/вхід через пристрій, резервна сумісність уперед моделей,
  підказки транскрипту Claude-thinking, обмін токенів під час виконання та отримання даних
  з кінцевої точки використання
- `openai`: резервна сумісність уперед для GPT-5.4, пряма нормалізація транспорту OpenAI,
  підказки про відсутню автентифікацію з урахуванням Codex, приглушення Spark, синтетичні
  рядки каталогу OpenAI/Codex, політика thinking/live-моделей, нормалізація псевдонімів токенів використання
  (`input` / `output` і сімейства `prompt` / `completion`), спільне сімейство потоків
  `openai-responses-defaults` для нативних обгорток OpenAI/Codex,
  метадані сімейства постачальника, реєстрація вбудованого постачальника генерації зображень
  для `gpt-image-1` і реєстрація вбудованого постачальника генерації відео
  для `sora-2`
- `google` і `google-gemini-cli`: резервна сумісність уперед для Gemini 3.1,
  нативна валідація повтору Gemini, санітизація bootstrap-повтору, тегований
  режим виводу reasoning, зіставлення сучасних моделей, реєстрація вбудованого постачальника
  генерації зображень для preview-моделей Gemini image та вбудована
  реєстрація постачальника генерації відео для моделей Veo; Gemini CLI OAuth також
  володіє форматуванням токенів профілю автентифікації, розбором токенів використання та
  отриманням кінцевої точки квоти для поверхонь використання
- `moonshot`: спільний транспорт, нормалізація payload thinking, що належить плагіну
- `kilocode`: спільний транспорт, заголовки запитів, що належать плагіну, payload reasoning
  нормалізація, санітизація підпису thought у проксі-Gemini та політика TTL кешу
- `zai`: резервна сумісність уперед для GLM-5, типові значення `tool_stream`, політика TTL кешу,
  політика двійкового thinking/live-моделей і автентифікація використання + отримання квоти;
  невідомі ідентифікатори `glm-5*` синтезуються з вбудованого шаблону `glm-4.7`
- `xai`: нативна нормалізація транспорту Responses, переписування псевдонімів `/fast` для
  швидких варіантів Grok, типове `tool_stream`, очищення схем інструментів /
  payload reasoning, специфічне для xAI, і вбудована реєстрація постачальника генерації відео
  для `grok-imagine-video`
- `mistral`: метадані можливостей, що належать плагіну
- `opencode` і `opencode-go`: метадані можливостей, що належать плагіну, плюс
  санітизація підпису thought у проксі-Gemini
- `alibaba`: каталог генерації відео, що належить плагіну, для прямих посилань на моделі Wan
  як-от `alibaba/wan2.6-t2v`
- `byteplus`: каталоги, що належать плагіну, плюс вбудована реєстрація постачальника генерації відео
  для моделей Seedance text-to-video/image-to-video
- `fal`: вбудована реєстрація постачальника генерації відео для хостованих сторонніх
  моделей, реєстрація постачальника генерації зображень для моделей зображень FLUX, а також вбудована
  реєстрація постачальника генерації відео для хостованих сторонніх відеомоделей
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` і `volcengine`:
  лише каталоги, що належать плагіну
- `qwen`: каталоги, що належать плагіну, для текстових моделей плюс спільні
  реєстрації постачальників media-understanding і генерації відео для його
  мультимодальних поверхонь; генерація відео Qwen використовує стандартні відео-
  кінцеві точки DashScope з вбудованими моделями Wan, такими як `wan2.6-t2v` і `wan2.7-r2v`
- `runway`: реєстрація постачальника генерації відео, що належить плагіну, для нативних
  моделей Runway на основі завдань, як-от `gen4.5`
- `minimax`: каталоги, що належать плагіну, вбудована реєстрація постачальника генерації відео
  для відеомоделей Hailuo, вбудована реєстрація постачальника генерації зображень
  для `image-01`, гібридний вибір політики повтору Anthropic/OpenAI та логіка
  автентифікації/знімка використання
- `together`: каталоги, що належать плагіну, плюс вбудована реєстрація постачальника генерації відео
  для відеомоделей Wan
- `xiaomi`: каталоги, що належать плагіну, плюс логіка
  автентифікації/знімка використання

Вбудований плагін `openai` тепер володіє обома ідентифікаторами постачальника: `openai` і
`openai-codex`.

Це охоплює постачальників, які ще вписуються в звичайні транспорти OpenClaw. Постачальник,
якому потрібен повністю кастомний виконавець запитів, — це окрема, глибша поверхня
розширення.

## Ротація API-ключів

- Підтримує загальну ротацію постачальників для вибраних постачальників.
- Налаштуйте кілька ключів через:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне live-перевизначення, найвищий пріоритет)
  - `<PROVIDER>_API_KEYS` (список через кому або крапку з комою)
  - `<PROVIDER>_API_KEY` (основний ключ)
  - `<PROVIDER>_API_KEY_*` (нумерований список, наприклад `<PROVIDER>_API_KEY_1`)
- Для постачальників Google `GOOGLE_API_KEY` також включається як резервний варіант.
- Порядок вибору ключів зберігає пріоритет і прибирає дублікати значень.
- Запити повторюються з наступним ключем лише у відповідь на відповіді з обмеженням швидкості (наприклад,
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` або періодичні повідомлення про ліміт використання).
- Збої, не пов'язані з лімітом запитів, завершуються негайно; ротація ключів не виконується.
- Коли всі можливі ключі не спрацьовують, повертається фінальна помилка з останньої спроби.

## Вбудовані постачальники (каталог pi-ai)

OpenClaw постачається з каталогом pi‑ai. Для цих постачальників **не потрібна**
конфігурація `models.providers`; достатньо налаштувати автентифікацію й вибрати модель.

### OpenAI

- Постачальник: `openai`
- Автентифікація: `OPENAI_API_KEY`
- Необов'язкова ротація: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, а також `OPENCLAW_LIVE_OPENAI_KEY` (одне перевизначення)
- Приклади моделей: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Типовий транспорт — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- Розігрів WebSocket для OpenAI Responses типово ввімкнений через `params.openaiWsWarmup` (`true`/`false`)
- Пріоритетну обробку OpenAI можна ввімкнути через `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` і `params.fastMode` зіставляють прямі запити `openai/*` Responses із `service_tier=priority` на `api.openai.com`
- Використовуйте `params.serviceTier`, якщо вам потрібен явний рівень замість спільного перемикача `/fast`
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) застосовуються лише до нативного трафіку OpenAI на `api.openai.com`, а не
  до загальних проксі, сумісних з OpenAI
- Нативні маршрути OpenAI також зберігають `store` для Responses, підказки кешу промптів і
  формування payload сумісності reasoning OpenAI; проксі-маршрути — ні
- `openai/gpt-5.3-codex-spark` навмисно приглушено в OpenClaw, оскільки live API OpenAI його відхиляє; Spark вважається лише Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Постачальник: `anthropic`
- Автентифікація: `ANTHROPIC_API_KEY`
- Необов'язкова ротація: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, а також `OPENCLAW_LIVE_ANTHROPIC_KEY` (одне перевизначення)
- Приклад моделі: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Прямі публічні запити Anthropic підтримують спільний перемикач `/fast` і `params.fastMode`, зокрема трафік, автентифікований через API-ключ і OAuth, надісланий до `api.anthropic.com`; OpenClaw зіставляє це з Anthropic `service_tier` (`auto` проти `standard_only`)
- Примітка щодо білінгу: для Anthropic в OpenClaw практичний поділ — це **API-ключ** або **підписка Claude з Extra Usage**. Anthropic повідомила користувачів OpenClaw **4 квітня 2026 року о 12:00 PT / 8:00 PM BST**, що шлях входу Claude у **OpenClaw** вважається використанням через сторонній harness і потребує **Extra Usage**, що оплачується окремо від підписки. Наші локальні відтворення також показують, що рядок промпту, який ідентифікує OpenClaw, не відтворюється на шляху Anthropic SDK + API-ключ.
- Токен налаштування Anthropic знову доступний як застарілий/ручний шлях OpenClaw. Використовуйте його з розумінням, що Anthropic повідомила користувачів OpenClaw, що цей шлях потребує **Extra Usage**.

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
- Типовий транспорт — `auto` (спочатку WebSocket, резервно SSE)
- Перевизначення для окремої моделі через `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` або `"auto"`)
- `params.serviceTier` також пересилається в нативних запитах Codex Responses (`chatgpt.com/backend-api`)
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`,
  `User-Agent`) додаються лише до нативного трафіку Codex на
  `chatgpt.com/backend-api`, а не до загальних проксі, сумісних з OpenAI
- Має спільний перемикач `/fast` і конфігурацію `params.fastMode`, як і прямий `openai/*`; OpenClaw зіставляє це з `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` залишається доступною, коли каталог OAuth Codex її показує; залежить від прав доступу
- `openai-codex/gpt-5.4` зберігає нативне `contextWindow = 1050000` і типове обмеження під час виконання `contextTokens = 272000`; перевизначте це обмеження через `models.providers.openai-codex.models[].contextTokens`
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

### Інші хостовані варіанти у стилі підписки

- [Qwen Cloud](/uk/providers/qwen): поверхня постачальника Qwen Cloud плюс зіставлення кінцевих точок Alibaba DashScope і Coding Plan
- [MiniMax](/uk/providers/minimax): доступ через OAuth або API-ключ MiniMax Coding Plan
- [GLM Models](/uk/providers/glm): Z.AI Coding Plan або загальні кінцеві точки API

### OpenCode

- Автентифікація: `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`)
- Постачальник виконання Zen: `opencode`
- Постачальник виконання Go: `opencode-go`
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
- Необов'язкова ротація: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, резервний `GOOGLE_API_KEY` і `OPENCLAW_LIVE_GEMINI_KEY` (одне перевизначення)
- Приклади моделей: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Сумісність: застаріла конфігурація OpenClaw з `google/gemini-3.1-flash-preview` нормалізується до `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Прямі запуски Gemini також приймають `agents.defaults.models["google/<model>"].params.cachedContent`
  (або застарілий `cached_content`) для пересилання нативного для постачальника
  дескриптора `cachedContents/...`; попадання в кеш Gemini відображаються як OpenClaw `cacheRead`

### Google Vertex і Gemini CLI

- Постачальники: `google-vertex`, `google-gemini-cli`
- Автентифікація: Vertex використовує gcloud ADC; Gemini CLI — власний потік OAuth
- Застереження: OAuth Gemini CLI в OpenClaw — це неофіційна інтеграція. Деякі користувачі повідомляли про обмеження облікового запису Google після використання сторонніх клієнтів. Ознайомтеся з умовами Google і, якщо вирішите продовжити, використовуйте некритичний обліковий запис.
- Gemini CLI OAuth постачається як частина вбудованого плагіна `google`.
  - Спочатку встановіть Gemini CLI:
    - `brew install gemini-cli`
    - або `npm install -g @google/gemini-cli`
  - Увімкнення: `openclaw plugins enable google`
  - Вхід: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Типова модель: `google-gemini-cli/gemini-3.1-pro-preview`
  - Примітка: вам **не потрібно** вставляти client id або secret в `openclaw.json`. Потік входу CLI зберігає
    токени в профілях автентифікації на gateway host.
  - Якщо після входу запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на gateway host.
  - JSON-відповіді Gemini CLI розбираються з `response`; використання резервно береться з
    `stats`, при цьому `stats.cached` нормалізується в OpenClaw `cacheRead`.

### Z.AI (GLM)

- Постачальник: `zai`
- Автентифікація: `ZAI_API_KEY`
- Приклад моделі: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Псевдоніми: `z.ai/*` і `z-ai/*` нормалізуються до `zai/*`
  - `zai-api-key` автоматично визначає відповідну кінцеву точку Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` і `zai-cn` примусово використовують конкретну поверхню

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
- Базова URL-адреса: `https://api.kilo.ai/api/gateway/`
- Статичний резервний каталог постачається з `kilocode/kilo/auto`; live-виявлення
  `https://api.kilo.ai/api/gateway/models` може додатково розширити каталог
  під час виконання.
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw.

Деталі налаштування див. у [/providers/kilocode](/uk/providers/kilocode).

### Інші вбудовані плагіни постачальників

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Приклад моделі: `openrouter/auto`
- OpenClaw застосовує задокументовані заголовки атрибуції застосунку OpenRouter лише тоді,
  коли запит дійсно спрямовано на `openrouter.ai`
- Специфічні для OpenRouter маркери Anthropic `cache_control` так само обмежені
  перевіреними маршрутами OpenRouter, а не довільними URL-адресами проксі
- OpenRouter залишається на проксі-шляху у стилі OpenAI-compatible, тому нативне
  формування запитів лише для OpenAI (`serviceTier`, `store` для Responses,
  підказки кешу промптів, payload сумісності reasoning OpenAI) не пересилається
- Посилання OpenRouter на базі Gemini зберігають лише санітизацію підпису thought у проксі-Gemini;
  нативна валідація повтору Gemini та переписування bootstrap залишаються вимкненими
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Приклад моделі: `kilocode/kilo/auto`
- Посилання Kilo на базі Gemini зберігають той самий шлях санітизації підпису thought
  у проксі-Gemini; `kilocode/kilo/auto` та інші підказки, що не підтримують reasoning через проксі,
  пропускають ін'єкцію reasoning через проксі
- MiniMax: `minimax` (API-ключ) і `minimax-portal` (OAuth)
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або `MINIMAX_API_KEY` для `minimax-portal`
- Приклад моделі: `minimax/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7`
- Налаштування MiniMax під час онбордингу/API-ключа записує явні визначення моделей M2.7 з
  `input: ["text", "image"]`; вбудований каталог постачальника тримає chat-посилання
  лише текстовими, доки не буде матеріалізовано конфігурацію цього постачальника
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
- Приклад моделі: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
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
  - Моделі GLM на Cerebras використовують ідентифікатори `zai-glm-4.7` і `zai-glm-4.6`.
  - Базова URL-адреса, сумісна з OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Приклад моделі Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Див. [Hugging Face (Inference)](/uk/providers/huggingface).

## Постачальники через `models.providers` (кастомна/base URL)

Використовуйте `models.providers` (або `models.json`), щоб додати **кастомних** постачальників або
проксі, сумісні з OpenAI/Anthropic.

Багато з наведених нижче вбудованих плагінів постачальників уже публікують типовий каталог.
Використовуйте явні записи `models.providers.<id>` лише тоді, коли хочете перевизначити
типову базову URL-адресу, заголовки або список моделей.

### Moonshot AI (Kimi)

Moonshot постачається як вбудований плагін постачальника. Використовуйте вбудованого постачальника
типово й додавайте явний запис `models.providers.moonshot` лише тоді, коли
потрібно перевизначити базову URL-адресу або метадані моделі:

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

Kimi Coding використовує Anthropic-сумісну кінцеву точку Moonshot AI:

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

Під час онбордингу типово використовується поверхня coding, але загальний каталог `volcengine/*`
реєструється водночас.

У вибірниках онбордингу/налаштування моделі варіант автентифікації Volcengine надає перевагу і рядкам
`volcengine/*`, і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw резервно повертається до нефільтрованого каталогу, а не показує порожній
вибірник у межах постачальника.

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

Під час онбордингу типово використовується поверхня coding, але загальний каталог `byteplus/*`
реєструється водночас.

У вибірниках онбордингу/налаштування моделі варіант автентифікації BytePlus надає перевагу і рядкам
`byteplus/*`, і `byteplus-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw резервно повертається до нефільтрованого каталогу, а не показує порожній
вибірник у межах постачальника.

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

MiniMax налаштовується через `models.providers`, оскільки використовує кастомні кінцеві точки:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-ключ (Global): `--auth-choice minimax-global-api`
- MiniMax API-ключ (CN): `--auth-choice minimax-cn-api`
- Автентифікація: `MINIMAX_API_KEY` для `minimax`; `MINIMAX_OAUTH_TOKEN` або
  `MINIMAX_API_KEY` для `minimax-portal`

Деталі налаштування, варіанти моделей і фрагменти конфігурації див. у [/providers/minimax](/uk/providers/minimax).

На Anthropic-сумісному потоковому шляху MiniMax OpenClaw типово вимикає thinking,
якщо ви явно його не задаєте, а `/fast on` переписує
`MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

Розподіл можливостей, що належать плагіну:

- Типові значення тексту/чату залишаються на `minimax/MiniMax-M2.7`
- Генерація зображень — це `minimax/image-01` або `minimax-portal/image-01`
- Розуміння зображень — це `MiniMax-VL-01`, що належить плагіну, на обох шляхах автентифікації MiniMax
- Вебпошук залишається на ідентифікаторі постачальника `minimax`

### Ollama

Ollama постачається як вбудований плагін постачальника й використовує нативний API Ollama:

- Постачальник: `ollama`
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

Ollama локально виявляється за адресою `http://127.0.0.1:11434`, коли ви явно вмикаєте її через
`OLLAMA_API_KEY`, а вбудований плагін постачальника додає Ollama безпосередньо до
`openclaw onboard` і вибірника моделей. Див. [/providers/ollama](/uk/providers/ollama)
щодо онбордингу, хмарного/локального режиму та кастомної конфігурації.

### vLLM

vLLM постачається як вбудований плагін постачальника для локальних/self-hosted
серверів, сумісних з OpenAI:

- Постачальник: `vllm`
- Автентифікація: необов'язкова (залежить від вашого сервера)
- Типова базова URL-адреса: `http://127.0.0.1:8000/v1`

Щоб увімкнути локальне автоматичне виявлення (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації):

```bash
export VLLM_API_KEY="vllm-local"
```

Потім задайте модель (замініть на один з ідентифікаторів, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Деталі див. у [/providers/vllm](/uk/providers/vllm).

### SGLang

SGLang постачається як вбудований плагін постачальника для швидких self-hosted
серверів, сумісних з OpenAI:

- Постачальник: `sglang`
- Автентифікація: необов'язкова (залежить від вашого сервера)
- Типова базова URL-адреса: `http://127.0.0.1:30000/v1`

Щоб увімкнути локальне автоматичне виявлення (підійде будь-яке значення, якщо ваш сервер не
вимагає автентифікації):

```bash
export SGLANG_API_KEY="sglang-local"
```

Потім задайте модель (замініть на один з ідентифікаторів, які повертає `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Деталі див. у [/providers/sglang](/uk/providers/sglang).

### Локальні проксі (LM Studio, vLLM, LiteLLM тощо)

Приклад (OpenAI-compatible):

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

- Для кастомних постачальників `reasoning`, `input`, `cost`, `contextWindow` і `maxTokens` є необов'язковими.
  Якщо їх не вказано, OpenClaw типово використовує:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Рекомендація: задавайте явні значення, що відповідають обмеженням вашого проксі/моделі.
- Для `api: "openai-completions"` на не-нативних кінцевих точках (будь-який непорожній `baseUrl`, чий host не є `api.openai.com`) OpenClaw примусово встановлює `compat.supportsDeveloperRole: false`, щоб уникнути помилок 400 від постачальника через непідтримувані ролі `developer`.
- Проксі-маршрути у стилі OpenAI-compatible також пропускають нативне
  формування запитів лише для OpenAI: без `service_tier`, без `store` для Responses, без підказок кешу промптів, без
  формування payload сумісності reasoning OpenAI і без прихованих заголовків атрибуції OpenClaw.
- Якщо `baseUrl` порожній/не вказаний, OpenClaw зберігає типову поведінку OpenAI (яка веде до `api.openai.com`).
- Для безпеки явне `compat.supportsDeveloperRole: true` усе одно перевизначається на не-нативних кінцевих точках `openai-completions`.

## Приклади CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Див. також: [/gateway/configuration](/uk/gateway/configuration) для повних прикладів конфігурації.

## Пов'язане

- [Models](/uk/concepts/models) — конфігурація моделей і псевдоніми
- [Model Failover](/uk/concepts/model-failover) — ланцюжки резервного перемикання та поведінка повторних спроб
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделі
- [Providers](/uk/providers) — окремі посібники з налаштування постачальників
