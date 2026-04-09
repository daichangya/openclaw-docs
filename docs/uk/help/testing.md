---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для багів моделей/провайдерів
    - Налагодження поведінки gateway + agent
summary: 'Набір тестування: unit/e2e/live набори, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-09T00:43:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01117f41d8b171a4f1da11ed78486ee700e70ae70af54eb6060c57baf64ab21b
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів.

Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює)
- Які команди запускати для типових робочих сценаріїв (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресії для реальних проблем із моделями/провайдерами

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлення на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- QA-сайт на основі Docker: `pnpm qa:lab:up`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Запустити один live-файл у тихому режимі: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Порада: коли вам потрібен лише один збійний випадок, краще звузити live-тести через змінні середовища allowlist, описані нижче.

## Набори тестів (що де запускається)

Думайте про набори як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: десять послідовних запусків шардів (`vitest.full-*.config.ts`) поверх наявних scoped-проєктів Vitest
- Файли: core/unit inventory у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelisted node-тести `ui`, охоплені `vitest.unit.config.ts`
- Охоплення:
  - Чисті unit-тести
  - In-process інтеграційні тести (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка про проєкти:
  - Ненацілений `pnpm test` тепер запускає одинадцять менших конфігурацій шардів (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати нерелевантні набори.
  - `pnpm test --watch` і далі використовує native root `vitest.config.ts` project graph, оскільки багатошардовий цикл watch непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не платить повну вартість запуску root project.
  - `pnpm test:changed` розгортає змінені шляхи git у ті самі scoped lanes, коли diff торкається лише routable source/test файлів; редагування config/setup усе ще повертаються до широкого повторного запуску root-project.
  - Вибрані тести `plugin-sdk` і `commands` також маршрутизуються через виділені легкі lanes, які пропускають `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
  - Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними сусідніми тестами в цих легких lanes, тож редагування helper не вимагають повторного запуску всього важкого набору для цього каталогу.
  - `auto-reply` тепер має три виділені кошики: top-level core helpers, top-level інтеграційні тести `reply.*` і піддерево `src/auto-reply/reply/**`. Це не дає найважчій роботі harness reply потрапляти до дешевих тестів status/chunk/token.
- Примітка про вбудований runner:
  - Коли ви змінюєте вхідні дані виявлення message-tool або runtime context compaction,
    зберігайте обидва рівні покриття.
  - Додавайте сфокусовані helper-регресії для чистих меж routing/normalization.
  - Також підтримуйте здоровими інтеграційні набори embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped ids і поведінка compaction усе ще проходять
    через реальні шляхи `run.ts` / `compact.ts`; одних лише helper-тестів
    недостатньо як заміни цим інтеграційним шляхам.
- Примітка про pool:
  - Базова конфігурація Vitest тепер типово використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує non-isolated runner для root projects, e2e і live configs.
  - Root UI lane зберігає свій `jsdom` setup і optimizer, але тепер також працює на спільному non-isolated runner.
  - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також типово додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо вам потрібно порівняти зі стандартною поведінкою V8.
- Примітка про швидку локальну ітерацію:
  - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи чисто мапляться на менший набір.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, просто з вищою межею worker.
  - Автомасштабування локальних worker тепер навмисно більш консервативне й також зменшує активність, коли середнє навантаження хоста вже високе, тож кілька одночасних запусків Vitest за замовчуванням завдають менше шкоди.
  - Базова конфігурація Vitest позначає файли projects/config як `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли змінюється test wiring.
  - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого профілювання.
- Примітка про налагодження продуктивності:
  - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпортів і вивід import-breakdown.
  - `pnpm test:perf:imports:changed` звужує той самий профільований вигляд до файлів, змінених від `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` із native root-project шляхом для цього зафіксованого diff і виводить wall time та macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` бенчмаркує поточне брудне дерево, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і root-конфігурацію Vitest.
  - `pnpm test:perf:profile:main` записує профіль CPU main thread для накладних витрат старту та трансформацій Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для unit-набору з вимкненою файловою паралельністю.

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, узгоджено з рештою репозиторію.
  - Використовує адаптивну кількість worker (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням запускається в silent mode, щоб зменшити накладні витрати виводу в консоль.
- Корисні override:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості worker (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного виводу в консоль.
- Охоплення:
  - Наскрізна поведінка multi-instance gateway
  - WebSocket/HTTP surface, pairing node та складніша мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke для backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Охоплення:
  - Запускає ізольований gateway OpenShell на хості через Docker
  - Створює sandbox з тимчасового локального Dockerfile
  - Перевіряє backend OpenShell у OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через fs bridge sandbox
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потрібен локальний CLI `openshell` і працездатний Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, після чого знищує test gateway і sandbox
- Корисні override:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати не типовий CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Охоплення:
  - «Чи цей провайдер/модель реально працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін форматів провайдерів, особливостей tool-calling, проблем auth і поведінки rate limit
- Очікування:
  - За задумом не стабільний для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / витрачає rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підвантажують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють config/auth матеріали в тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише якщо ви навмисно хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і глушить логи bootstrap gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (залежно від провайдера): задавайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або override для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби у відповідь на rate limit.
- Вивід прогресу/heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів помітно активні навіть коли console capture Vitest тихий.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тож рядки прогресу провайдера/gateway одразу транслюються під час live-запусків.
  - Налаштовуйте heartbeat прямої моделі через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Зміни в мережевій взаємодії gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / специфічних для провайдера збоїв / tool calling: запускайте звужений `pnpm test:live`

## Live: sweep можливостей Android node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, що зараз рекламується** підключеним Android node, і перевірити поведінку contract команди.
- Охоплення:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює, не запускає і не pair-ить app).
  - Валідація `node.invoke` gateway для кожної команди вибраного Android node.
- Обов’язкове попереднє налаштування:
  - Android app уже підключений і pair-ений до gateway.
  - App утримується на передньому плані.
  - Надані дозволи/згода на захоплення для можливостей, які ви очікуєте успішно пройти.
- Необов’язкові override для цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделей (ключі профілів)

Live-тести поділені на два шари, щоб ми могли ізолювати збої:

- «Direct model» показує, чи провайдер/модель взагалі може відповісти з наданим ключем.
- «Gateway smoke» показує, чи працює для цієї моделі повний pipeline gateway+agent (sessions, history, tools, sandbox policy тощо).

### Шар 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel` для вибору моделей, для яких у вас є облікові дані
  - Виконати невелике completion для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб реально запустити цей набір; інакше він пропускається, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Sweeps modern/all типово мають кураторське обмеження високосигнального набору; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern sweep або додатне число для меншого обмеження.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - Типово: profile store і env fallbacks
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише profile store**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «pipeline gateway agent зламаний»
  - Містить малі ізольовані регресії (приклад: reasoning replay + tool-call flows для OpenAI Responses/Codex Responses)

### Шар 2: Gateway + smoke dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process gateway
  - Створити/пропатчити session `agent:dev:*` (override моделі для кожного запуску)
  - Перебрати моделі з ключами і перевірити:
    - «змістовну» відповідь (без tools)
    - що працює реальний виклик tool (read probe)
    - необов’язкові додаткові tool probes (exec+read probe)
    - що регресійні шляхи OpenAI (лише tool-call → follow-up) продовжують працювати
- Деталі probe (щоб ви могли швидко пояснити збої):
  - `read` probe: тест записує nonce-файл у workspace і просить agent `read` його та повернути nonce.
  - `exec+read` probe: тест просить agent через `exec` записати nonce в тимчасовий файл, а потім `read`-нути його назад.
  - image probe: тест прикріплює згенерований PNG (cat + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - Типово: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — псевдонім для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити
  - Sweeps modern/all для gateway типово мають кураторське обмеження високосигнального набору; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern sweep або додатне число для меншого обмеження.
- Як вибирати провайдерів (щоб уникнути «усе через OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Tool + image probes у цьому live-тесті завжди ввімкнені:
  - `read` probe + `exec+read` probe (stress для tools)
  - image probe запускається, коли модель рекламує підтримку image input
  - Потік (високорівнево):
    - Тест генерує крихітний PNG з «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent пересилає multimodal user message моделі
    - Перевірка: відповідь містить `cat` + код (OCR tolerance: незначні помилки дозволені)

Порада: щоб побачити, що саме можна тестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI backend (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити pipeline Gateway + agent із використанням локального CLI backend, не торкаючись вашої типової config.
- Типові налаштування smoke для backend живуть у визначенні `cli-backend.ts` відповідного extension-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Команда/аргументи/поведінка image беруться з метаданих plugin відповідного CLI backend.
- Override (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне image attachment (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до image-файлів як аргументи CLI замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати передачею аргументів image, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити flow відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типовий Claude Sonnet -> Opus probe безперервності в тій самій session (встановіть `1`, щоб примусово ввімкнути, коли вибрана модель підтримує ціль перемикання).

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-cli-backend
```

Docker-рецепти для одного провайдера:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker-ранер міститься в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke CLI-backend усередині Docker-образу репозиторію від імені не-root користувача `node`.
- Він розв’язує метадані smoke CLI з extension-власника, а потім установлює відповідний Linux CLI package (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований доступний для запису префікс `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- Live smoke CLI-backend тепер перевіряє той самий наскрізний flow для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик MCP tool `cron`, перевірений через CLI gateway.
- Типовий smoke для Claude також патчить session із Sonnet на Opus і перевіряє, що відновлена session усе ще пам’ятає попередню нотатку.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний flow conversation-bind ACP з live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати synthetic conversation message-channel на місці
  - надіслати звичайний follow-up у тій самій conversation
  - перевірити, що follow-up потрапляє до transcript прив’язаної ACP session
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP agents у Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
  - Synthetic channel: контекст conversation у стилі Slack DM
  - ACP backend: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Примітки:
  - Ця lane використовує surface gateway `chat.send` з admin-only synthetic полями originating-route, щоб тести могли прикріплювати контекст message-channel без удавання зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр agent у plugin `acpx` для вибраного ACP harness agent.

Приклад:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-acp-bind
```

Docker-рецепти для одного agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки до Docker:

- Docker-ранер міститься в `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає smoke ACP bind послідовно для всіх підтримуваних live CLI agents: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він підвантажує `~/.profile`, переносить відповідні auth-матеріали CLI в контейнер, установлює `acpx` у доступний для запису npm prefix, а потім установлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його бракує.
- Усередині Docker раннер установлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env vars провайдера з підвантаженого профілю доступними для дочірнього harness CLI.

### Рекомендовані live-рецепти

Вузькі явні allowlist найшвидші та найменш нестабільні:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling через кілька провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API key).
- `google-antigravity/...` використовує міст Antigravity OAuth (endpoint agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема auth + особливості tooling).
- Gemini API vs Gemini CLI:
  - API: OpenClaw викликає хостований Gemini API від Google через HTTP (API key / profile auth); це те, що більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw виконує локальний binary `gemini`; він має власну auth і може поводитися інакше (streaming/tool support/version skew).

## Live: матриця моделей (що ми охоплюємо)

Немає фіксованого «списку моделей для CI» (live — opt-in), але це **рекомендовані** моделі, які варто регулярно охоплювати на dev-машині з ключами.

### Сучасний набір smoke (tool calling + image)

Це запуск «поширених моделей», який ми очікуємо утримувати працездатним:

- OpenAI (не-Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запустити gateway smoke з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: tool calling (Read + необов’язковий Exec)

Виберіть щонайменше одну модель на сімейство провайдера:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас ввімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; tool calling залежить від режиму API)

### Vision: надсилання image (attachment → multimodal message)

Додайте щонайменше одну модель із підтримкою image до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використайте `openclaw models scan`, щоб знайти кандидатів із підтримкою tool+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (auth через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до live-матриці (якщо у вас є облікові дані/config):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoints): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «всі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс доступні ключі.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як ви налагоджували б `openclaw models list` / вибір моделі.

- Профілі auth для кожного agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це в live-тестах означає «profile keys»)
- Config: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Застарілий каталог стану: `~/.openclaw/credentials/` (копіюється в staged live home, коли існує, але не є основним сховищем profile-key)
- Локальні live-запуски типово копіюють активну config, файли `auth-profiles.json` для кожного agent, застарілий `credentials/` і підтримувані зовнішні каталоги auth CLI в тимчасовий test home; staged live home пропускають `workspace/` і `sandboxes/`, а override шляхів `agents.*.workspace` / `agentDir` прибираються, щоб probes не торкалися вашого реального workspace на хості.

Якщо ви хочете покладатися на env keys (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` в контейнер).

## Deepgram live (транскрипція аудіо)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язковий override моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Охоплення:
  - Перевіряє вбудовані шляхи comfy image, video і `music_generate`
  - Пропускає кожну можливість, якщо `models.providers.comfy.<capability>` не налаштовано
  - Корисно після змін у надсиланні workflow comfy, polling, downloads або реєстрації plugin

## Image generation live

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Охоплення:
  - Перелічує кожен зареєстрований plugin провайдера image-generation
  - Завантажує відсутні env vars провайдерів із вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth profiles, щоб застарілі test keys у `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдерів без придатного auth/profile/model
  - Проганяє стандартні варіанти image generation через shared runtime capability:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери, які охоплюються:
  - `openai`
  - `google`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати override лише з env

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Охоплення:
  - Перевіряє спільний шлях вбудованого провайдера music-generation
  - Наразі охоплює Google і MiniMax
  - Завантажує env vars провайдера з вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth profiles, щоб застарілі test keys у `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдерів без придатного auth/profile/model
  - Запускає обидва оголошені режими runtime, коли вони доступні:
    - `generate` з вхідними даними лише у вигляді prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, а не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати override лише з env

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Охоплення:
  - Перевіряє спільний шлях вбудованого провайдера video-generation
  - Завантажує env vars провайдера з вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth profiles, щоб застарілі test keys у `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдерів без придатного auth/profile/model
  - Запускає обидва оголошені режими runtime, коли вони доступні:
    - `generate` з вхідними даними лише у вигляді prompt
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає buffer-backed локальний вхід зображення в shared sweep
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає buffer-backed локальний вхід відео в shared sweep
  - Поточні оголошені, але пропущені провайдери `imageToVideo` у shared sweep:
    - `vydra`, оскільки вбудований `veo3` підтримує лише текст, а вбудований `kling` вимагає віддалений image URL
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс lane `kling`, яка типово використовує фікстуру з віддаленим image URL
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у shared sweep:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи зараз вимагають віддалені URL-адреси посилань `http(s)` / MP4
    - `google`, оскільки поточна спільна lane Gemini/Veo використовує локальний buffer-backed input, і цей шлях не приймається в shared sweep
    - `openai`, оскільки поточна спільна lane не гарантує доступ до video inpaint/remix, специфічний для організації
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати override лише з env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори image, music і video через один native entrypoint репозиторію
  - Автоматично завантажує відсутні env vars провайдерів із `~/.profile`
  - Типово автоматично звужує кожен набір до провайдерів, які зараз мають придатний auth
  - Повторно використовує `scripts/test-live.mjs`, тож поведінка heartbeat і quiet mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві категорії:

- Live-model ранери: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний файл live з profile-key усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог config і workspace (і підвантажуючи `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Live Docker-ранери типово мають менше обмеження smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  вам навмисно потрібне більше вичерпне сканування.
- `test:docker:all` збирає live Docker-образ один раз через `test:docker:live-build`, а потім повторно використовує його для двох live Docker lanes.
- Smoke-ранери контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` і `test:docker:plugins` піднімають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker-ранери також bind-mount-ять лише потрібні auth homes CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб зовнішній OAuth CLI міг оновлювати токени, не змінюючи host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Мережа gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Міст MCP channel (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (install smoke + псевдонім `/plugin` + семантика restart для Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)

Live-model Docker-ранери також монтують поточний checkout лише для читання і
переносять його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, але все одно дозволяє запускати Vitest точно на ваших локальних source/config.
Крок staging пропускає великі локальні кеші й артефакти збірки застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для app каталоги
`.build` або вихідні каталоги Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальні workers каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цієї Docker lane.
`test:docker:openwebui` — це smoke сумісності вищого рівня: він запускає
контейнер gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoints,
запускає закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися витягнути
образ Open WebUI, а самому Open WebUI може знадобитися завершити власне cold-start налаштування.
Ця lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб передати його в Docker-ізольованих запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він піднімає seeded Gateway
контейнер, запускає другий контейнер, який спавнить `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих conversation, читання transcript, метадані attachment,
поведінку live event queue, маршрутизацію вихідного надсилання й сповіщення у стилі Claude про channel +
permission через реальний stdio MCP bridge. Перевірка сповіщень
напряму інспектує сирі stdio MCP frames, тож smoke перевіряє те, що міст
насправді випромінює, а не лише те, що випадково показує конкретний SDK клієнта.

Ручний smoke plain-language thread ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тож не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установок CLI усередині Docker
- Зовнішні каталоги/файли auth CLI в `$HOME` монтуються тільки для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Для звужених запусків провайдерів монтуються лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Можна перевизначити вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів у контейнері
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані походять зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовується для smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування docs: `pnpm check:docs`.
Запускайте повну перевірку якірних посилань Mintlify, коли також потрібні перевірки заголовків усередині сторінок: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Tool calling gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер gateway (WS `wizard.start`/`wizard.next`, запис config + примусова auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності agent (Skills)

Ми вже маємо кілька безпечних для CI тестів, які поводяться як «оцінювання надійності agent»:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють wiring session і впливи config (`src/gateway/gateway.test.ts`).

Чого для skills ще бракує (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли skills перелічені в prompt, чи agent вибирає правильний skill (або уникає нерелевантних)?
- **Compliance:** чи agent читає `SKILL.md` перед використанням і дотримується обов’язкових кроків/аргументів?
- **Workflow contracts:** багатохідні сценарії, які перевіряють порядок tools, перенесення history між session і межі sandbox.

Майбутні evals мають насамперед залишатися детермінованими:

- Scenario runner із mock providers для перевірки викликів tools + порядку, читання skill files і wiring session.
- Невеликий набір сценаріїв, орієнтованих на skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live evals (opt-in, під контролем env) лише після того, як безпечний для CI набір буде готовий.

## Contract tests (форма plugin і channel)

Contract tests перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
interface contract. Вони перебирають усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте contract-команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише contracts channel: `pnpm test:contracts:channels`
- Лише contracts provider: `pnpm test:contracts:plugins`

### Contracts channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Contract майстра налаштування
- **session-binding** - Поведінка прив’язки session
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка thread ID
- **directory** - API directory/roster
- **group-policy** - Забезпечення group policy

### Contracts статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probes статусу channel
- **registry** - Форма реєстру plugin

### Contracts provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract потоку auth
- **auth-choice** - Вибір/селектор auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після змін exports або subpaths у plugin-sdk
- Після додавання або зміни plugin каналу чи провайдера
- Після рефакторингу реєстрації plugin або discovery

Contract tests запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub провайдер або захопіть точну трансформацію форми запиту)
- Якщо вона за своєю природою лише live (rate limits, політики auth), тримайте live-тест вузьким і opt-in через env vars
- Віддавайте перевагу найменшому шару, який виявляє баг:
  - баг конвертації/повторного відтворення запиту провайдера → direct models test
  - баг pipeline session/history/tool у gateway → gateway live smoke або безпечний для CI gateway mock test
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибрану ціль на клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids сегментів обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується з помилкою на некласифікованих target ids, щоб нові класи не можна було тихо пропустити.
