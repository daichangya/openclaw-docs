---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для помилок моделей/провайдерів
    - Налагодження поведінки gateway + агента
summary: 'Набір для тестування: unit/e2e/live набори, Docker runners і що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-05T18:07:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65305c0de33287f48f182bb9f276e4f3ba9cc49c65a54e115e1d77ec89f56ab7
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker runners.

Цей документ — посібник «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває)
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресії для реальних проблем моделей/провайдерів

## Швидкий старт

У більшості випадків:

- Повна перевірка (очікується перед push): `pnpm build && pnpm check && pnpm test`
- Швидший локальний запуск повного набору на продуктивній машині: `pnpm test:max`
- Прямий цикл watch у Vitest (сучасна конфігурація projects): `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

Коли ви змінюєте тести або хочете більшої впевненості:

- Перевірка покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки gateway для інструментів/зображень): `pnpm test:live`
- Тихий запуск одного live-файлу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Порада: коли вам потрібен лише один збійний випадок, звужуйте live-тести через змінні середовища allowlist, описані нижче.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нативні Vitest `projects` через `vitest.config.ts`
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, охоплені `vitest.unit.config.ts`
- Сфера:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка щодо projects:
  - `pnpm test`, `pnpm test:watch` і `pnpm test:changed` тепер усі використовують ту саму нативну root-конфігурацію Vitest `projects`.
  - Прямі фільтри файлів нативно проходять через граф root project, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` працює без спеціальної обгортки.
- Примітка щодо embedded runner:
  - Коли ви змінюєте вхідні дані виявлення message-tool або runtime-контекст compaction,
    зберігайте обидва рівні покриття.
  - Додавайте цільові helper-регресії для чистих меж маршрутизації/нормалізації.
  - Також підтримуйте в доброму стані integration-набори embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що локальні id і поведінка compaction все ще проходять
    через реальні шляхи `run.ts` / `compact.ts`; helper-only тести не є
    достатньою заміною цих integration-шляхів.
- Примітка щодо pool:
  - Базова конфігурація Vitest тепер типово використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує неізольований runner у root projects, e2e і live конфігураціях.
  - Root-lane UI зберігає свої налаштування `jsdom` і optimizer, але тепер також працює на спільному неізольованому runner.
  - `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` з root-конфігурації `vitest.config.ts`.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також типово додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо потрібно порівняти зі стандартною поведінкою V8.
- Примітка щодо швидкої локальної ітерації:
  - `pnpm test:changed` запускає нативну конфігурацію projects з `--changed origin/main`.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму нативну конфігурацію projects, лише з вищою межею workers.
  - Автомасштабування локальних workers тепер навмисно консервативне й також зменшує навантаження, коли середнє навантаження хоста вже високе, тож кілька одночасних запусків Vitest типово менше шкодять системі.
  - Базова конфігурація Vitest позначає файли projects/config як `forceRerunTriggers`, щоб rerun у changed-mode залишався коректним, коли змінюється підключення тестів.
  - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого профілювання.
- Примітка щодо налагодження продуктивності:
  - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпорту плюс деталізацію імпортів.
  - `pnpm test:perf:imports:changed` обмежує той самий профільований вигляд файлами, зміненими відносно `origin/main`.
  - `pnpm test:perf:profile:main` записує CPU-профіль основного потоку для накладних витрат запуску й transform у Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує CPU+heap профілі runner для unit-набору з вимкненим файловим паралелізмом.

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Типові налаштування runtime:
  - Використовує Vitest `threads` з `isolate: false`, узгоджено з рештою репозиторію.
  - Використовує адаптивну кількість workers (CI: до 2, локально: типово 1).
  - Типово працює в тихому режимі, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного console output.
- Сфера:
  - Наскрізна поведінка кількох екземплярів gateway
  - Поверхні WebSocket/HTTP, pairing вузлів і складніші мережеві сценарії
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke для бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Сфера:
  - Запускає ізольований gateway OpenShell на хості через Docker
  - Створює sandbox з тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє поведінку файлової системи з віддаленим канонічним станом через fs-міст sandbox
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потрібні локальний CLI `openshell` і робочий демон Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний бінарник CLI або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- Типово: **увімкнено** через `pnpm test:live` (задає `OPENCLAW_LIVE_TEST=1`)
- Сфера:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей викликів інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - Навмисно нестабільно для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски читають `~/.profile`, щоб отримати відсутні ключі API.
- Типово live-запуски все одно ізолюють `HOME` і копіюють config/auth material у тимчасовий тестовий home, щоб unit-фікстури не могли змінювати ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли ви свідомо хочете, щоб live-тести використовували ваш реальний home-каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і приглушує журнали запуску gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові журнали.
- Ротація ключів API (специфічна для провайдера): задавайте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби при відповідях rate limit.
- Вивід progress/heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдерів залишалися помітно активними, навіть коли захоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/gateway одразу передавалися під час live-запусків.
  - Налаштовуйте heartbeat прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте таку таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Змінюєте мережеву частину gateway / протокол WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / специфічні збої провайдера / виклики інструментів: запускайте звужений `pnpm test:live`

## Live: перевірка можливостей Android-вузла

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку наразі рекламує** підключений Android-вузол, і перевірити поведінку контракту команд.
- Сфера:
  - Передумови/ручне налаштування (набір не встановлює/не запускає/не pair застосунок).
  - Перевірка `node.invoke` gateway по командах для вибраного Android-вузла.
- Обов’язкова попередня підготовка:
  - Android-застосунок уже підключено та спарено з gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/підтвердження захоплення для можливостей, які ви очікуєте як успішні.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/platforms/android)

## Live: smoke моделей (ключі профілів)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Пряма модель» показує, чи може провайдер/модель взагалі відповісти з наданим ключем.
- «Gateway smoke» показує, чи працює повний конвеєр gateway+agent для цієї моделі (сесії, історія, інструменти, політика sandbox тощо).

### Шар 1: пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб справді запустити цей набір; інакше він пропускається, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — псевдонім для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity"` (allowlist через кому)
- Звідки беруться ключі:
  - Типово: сховище профілів і резервні варіанти з env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «зламаний конвеєр gateway agent»
  - Містить невеликі ізольовані регресії (наприклад, OpenAI Responses/Codex Responses reasoning replay + потоки викликів інструментів)

### Шар 2: gateway + smoke dev-агента (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process gateway
  - Створити/оновити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі з ключами й перевіряти:
    - «змістовну» відповідь (без інструментів)
    - реальний виклик інструмента працює (read probe)
    - необов’язкові додаткові перевірки інструментів (exec+read probe)
    - шляхи регресії OpenAI (лише виклик інструмента → follow-up) залишаються робочими
- Деталі probe (щоб можна було швидко пояснити збої):
  - `read` probe: тест записує nonce-файл у workspace і просить агента `read` його та повернути nonce.
  - `exec+read` probe: тест просить агента записати nonce через `exec` у тимчасовий файл, а потім прочитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (cat + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
- Як вибирати моделі:
  - Типово: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — псевдонім для сучасного allowlist
  - Або задайте `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
- Як вибирати провайдерів (щоб уникнути «усе через OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,openai,anthropic,zai,minimax"` (allowlist через кому)
- Перевірки інструментів і зображень у цьому live-тесті завжди ввімкнені:
  - `read` probe + `exec+read` probe (навантаження на інструменти)
  - image probe запускається, коли модель рекламує підтримку вхідних зображень
  - Потік (на високому рівні):
    - Тест генерує маленький PNG з “CAT” + випадковий код (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded-агент передає моделі мультимодальне повідомлення користувача
    - Перевірка: відповідь містить `cat` + код (допускаються незначні помилки OCR)

Порада: щоб побачити, що саме можна тестувати на вашій машині (і точні id `provider/model`), запустіть:

```bash
openclaw models list
openclaw models list --json
```

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік ACP conversation-bind з live ACP-агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайне follow-up у цій самій розмові
  - перевірити, що follow-up потрапив у transcript прив’язаної ACP-сесії
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP-агент: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - ACP-бекенд: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Примітки:
  - Ця гілка використовує поверхню gateway `chat.send` з admin-only полями synthetic originating-route, щоб тести могли приєднати контекст message-channel без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів плагіна `acpx` для вибраного ACP harness agent.

Приклад:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Рецепт для Docker:

```bash
pnpm test:docker:live-acp-bind
```

Примітки щодо Docker:

- Docker runner розташований у `scripts/test-live-acp-bind-docker.sh`.
- Він читає `~/.profile`, переносить відповідні CLI auth material у контейнер, установлює `acpx` у записуваний npm prefix, а потім установлює запитаний live CLI (`@anthropic-ai/claude-code` або `@openai/codex`), якщо його немає.
- Усередині Docker runner задає `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав змінні середовища провайдера з прочитаного профілю доступними для дочірнього CLI harness.

### Рекомендовані live-рецепти

Звужені явні allowlist — найшвидші та найменш нестабільні:

- Одна модель, прямий виклик (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклики інструментів у кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (ключ API Gemini + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (ключ API).
- `google-antigravity/...` використовує OAuth-міст Antigravity (endpoint агента в стилі Cloud Code Assist).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» не існує (live — opt-in), але ось **рекомендовані** моделі, які варто регулярно покривати на машині розробника з ключами.

### Сучасний smoke-набір (виклики інструментів + зображення)

Це запуск «типових моделей», який ми очікуємо тримати працездатним:

- OpenAI (не Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старих моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск gateway smoke з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклики інструментів (Read + необов’язковий Exec)

Виберіть принаймні одну модель із кожної родини провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновішу доступну)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою інструментів, яка у вас ввімкнена)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклики інструментів залежать від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень у `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні шлюзи

Якщо у вас є ввімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів і зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, які можна включити до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні endpoint): `minimax` (хмара/API), а також будь-який OpenAI/Anthropic-compatible проксі (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати «всі моделі» в документації. Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині + які ключі доступні.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як це робить CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «ключі профілів» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Застарілий каталог стану: `~/.openclaw/credentials/` (копіюється в staged live home, якщо він присутній, але це не основне сховище ключів профілю)
- Локальні live-запуски типово копіюють активну конфігурацію, файли `auth-profiles.json` для окремих агентів, застарілий `credentials/` і підтримувані зовнішні каталоги CLI auth у тимчасовий тестовий home; перевизначення шляхів `agents.*.workspace` / `agentDir` вилучаються з цієї staged-конфігурації, щоб перевірки не торкалися вашого реального workspace хоста.

Якщо ви хочете покладатися на ключі з env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker runners нижче (вони можуть монтувати `~/.profile` у контейнер).

## Live: Deepgram (транскрибування аудіо)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live: coding plan BytePlus

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live: генерація зображень

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Сфера:
  - Перелічує всі зареєстровані плагіни провайдерів генерації зображень
  - Завантажує відсутні env-змінні провайдера з вашої оболонки входу (`~/.profile`) перед перевіркою
  - Типово використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані з оболонки
  - Пропускає провайдерів без придатної auth/profile/model
  - Проганяє стандартні варіанти генерації зображень через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери, які покриваються:
  - `openai`
  - `google`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати перевизначення лише з env

## Docker runners (необов’язкові перевірки «працює в Linux»)

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл з ключами профілів усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та workspace (і читають `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners типово використовують меншу межу smoke, щоб повний прогін у Docker залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам свідомо потрібен більший вичерпний прогін.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох live Docker lanes.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` і `test:docker:plugins` піднімають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker runners також bind-монтують лише потрібні CLI auth home-каталоги (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у home-каталог контейнера перед запуском, щоб зовнішній CLI OAuth міг оновлювати токени, не змінюючи auth store на хості:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Gateway + dev-агент: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Мережа gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Міст каналів MCP (seeded Gateway + stdio bridge + raw smoke для кадрів сповіщень Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Плагіни (smoke встановлення + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)

Live-model Docker runners також bind-монтують поточний checkout лише для читання і
переносять його у тимчасовий workdir усередині контейнера. Це зберігає runtime-образ
компактним і водночас дозволяє запускати Vitest проти вашого точного локального source/config.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб live-перевірки gateway не запускали
реальні воркери каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цього Docker lane.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
контейнер gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoint,
запускає закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
образу Open WebUI, а Open WebUI — завершення власного холодного старту.
Ця гілка очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб передати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON-пейлоад на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway
контейнер, піднімає другий контейнер, який запускає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання transcript, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання і сповіщення в стилі Claude про channel +
permission через реальний stdio MCP bridge. Перевірка сповіщень безпосередньо аналізує raw stdio MCP frames,
щоб smoke перевіряв те, що міст справді випромінює, а не лише те, що випадково показує конкретний client SDK.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflow регресій/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тож не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і читається перед запуском тестів
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установлень CLI у Docker
- Зовнішні CLI auth dirs/files у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.codex`, `.minimax`
  - Типові файли: `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ручне перевизначення: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації провайдерів у контейнері
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані беруться зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовується в smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли вам також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайнова регресія (безпечна для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Виклики інструментів gateway (mock OpenAI, реальний gateway + agent loop): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер gateway (WS `wizard.start`/`wizard.next`, запис конфігурації + примусова auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінки надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінки надійності агента»:

- Mock tool-calling через реальний gateway + agent loop (`src/gateway/gateway.test.ts`).
- Наскрізні потоки wizard, які перевіряють wiring сесій і ефекти конфігурації (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/tools/skills)):

- **Прийняття рішень:** коли Skills перелічено в prompt, чи обирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи виконує обов’язкові кроки/аргументи?
- **Контракти workflow:** багатохідові сценарії, що перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals мають насамперед залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання skill-файлів і wiring сесій.
- Невеликий набір сценаріїв, сфокусованих на skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live-evals (opt-in, керовані env) лише після того, як безпечний для CI набір буде готовий.

## Контрактні тести (форма плагінів і каналів)

Контрактні тести перевіряють, що кожен зареєстрований плагін і канал відповідає
своєму контракту інтерфейсу. Вони проходять по всіх виявлених плагінах і запускають набір
перевірок форми й поведінки. Типова unit-лінія `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли змінюєте спільні поверхні каналів або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма плагіна (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура пейлоада повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID тредів
- **directory** - API каталогу/списку учасників
- **group-policy** - Примусове забезпечення політики груп

### Контракти статусу провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу каналів
- **registry** - Форма реєстру плагінів

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/селектор автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення плагінів
- **loader** - Завантаження плагінів
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс плагіна
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export/subpath у plugin-sdk
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації або виявлення плагінів

Контрактні тести запускаються в CI й не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- За можливості додайте безпечну для CI регресію (mock/stub-провайдер або зафіксуйте точне перетворення форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому рівню, який ловить помилку:
  - помилка перетворення/повторного програвання запиту провайдера → тест прямих моделей
  - помилка в конвеєрі gateway session/history/tool → gateway live smoke або безпечний для CI mock-тест gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить один вибірковий target для кожного класу SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що traversal-segment exec id відхиляються.
  - Якщо ви додаєте нову родину цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується з помилкою на некласифікованих target id, щоб нові класи не могли бути тихо пропущені.
