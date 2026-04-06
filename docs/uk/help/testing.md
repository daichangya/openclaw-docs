---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для помилок моделей/провайдерів
    - Налагодження поведінки gateway + агента
summary: 'Набір для тестування: unit/e2e/live набори, Docker-ранери та що саме покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-06T23:44:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61b1856fff7d09dcfdbaacf1b5c8fbc3284750e360fc37d5e15852011b6a5bb5
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів.

Цей документ — це посібник «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває)
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресії для реальних проблем моделей/провайдерів

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- QA-сайт на базі Docker: `pnpm qa:lab:up`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + gateway tool/image probe): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Порада: якщо вам потрібен лише один збійний випадок, краще звужувати live-тести через env-змінні allowlist, описані нижче.

## Набори тестів (що де запускається)

Сприймайте набори як «щораз реалістичніші» (і щораз нестабільніші/дорожчі):

### Unit / integration (типовий варіант)

- Команда: `pnpm test`
- Конфіг: десять послідовних запусків shard (`vitest.full-*.config.ts`) поверх наявних scoped Vitest project
- Файли: core/unit inventory у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` та дозволені node-тести `ui`, які покриває `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Внутрішньопроцесні integration-тести (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка про projects:
  - Ненацілений `pnpm test` тепер запускає десять менших shard-конфігів (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
  - `pnpm test --watch` усе ще використовує native root `vitest.config.ts` project graph, оскільки цикл watch із багатьма shard непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не платить повну ціну запуску root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff торкається лише routable source/test файлів; зміни config/setup усе ще повертаються до ширшого повторного запуску root-project.
  - Вибрані тести `plugin-sdk` і `commands` також маршрутизуються через окремі легкі lanes, що пропускають `test/setup-openclaw-runtime.ts`; файли зі станом/важким runtime залишаються на наявних lanes.
  - Вибрані допоміжні source-файли `plugin-sdk` і `commands` також зіставляють changed-mode запуски з явними сусідніми тестами в цих легких lanes, тож зміни helper не змушують повторно запускати весь важкий набір для цього каталогу.
  - `auto-reply` тепер має три окремі кошики: top-level core helper, top-level integration-тести `reply.*` і піддерево `src/auto-reply/reply/**`. Це утримує найважчу роботу harness для reply подалі від дешевих тестів status/chunk/token.
- Примітка про embedded runner:
  - Коли ви змінюєте входи виявлення message-tool або runtime context compaction,
    зберігайте обидва рівні покриття.
  - Додавайте сфокусовані helper-регресії для чистих меж routing/normalization.
  - Також підтримуйте в доброму стані integration-набори embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped id та поведінка compaction як і раніше проходять
    через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести не є
    достатньою заміною для цих integration-шляхів.
- Примітка про pool:
  - Базовий конфіг Vitest тепер типово використовує `threads`.
  - Спільний конфіг Vitest також фіксує `isolate: false` і використовує неізольований runner для root project, e2e та live конфігів.
  - Кореневий lane UI зберігає свій `jsdom` setup та optimizer, але тепер також працює на спільному неізольованому runner.
  - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільного конфига Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також типово додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо вам потрібно порівняти зі стандартною поведінкою V8.
- Примітка про швидку локальну ітерацію:
  - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи чисто зіставляються з меншим набором.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим лімітом worker.
  - Автомасштабування локальних worker тепер навмисно консервативніше і також знижує навантаження, коли середнє завантаження хоста вже високе, тож кілька одночасних запусків Vitest за замовчуванням шкодять менше.
  - Базовий конфіг Vitest позначає projects/config файли як `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється тестова обв’язка.
  - Конфіг зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого профілювання.
- Примітка про perf-debug:
  - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпорту та вивід import-breakdown.
  - `pnpm test:perf:imports:changed` обмежує той самий вид профілювання файлами, зміненими відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` із native шляхом root-project для цього зафіксованого diff і друкує wall time та macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` виконує бенчмарк поточного брудного дерева, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і root Vitest config.
  - `pnpm test:perf:profile:main` записує main-thread CPU profile для накладних витрат запуску та трансформації Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для unit-набору з вимкненим файловим паралелізмом.

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфіг: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних worker (CI: до 2, локально: 1 за замовчуванням).
  - Типово запускається в silent mode, щоб зменшити накладні витрати на console I/O.
- Корисні override:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість worker (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути детальний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка кількох екземплярів gateway
  - Поверхні WebSocket/HTTP, pairing вузлів і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke для backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише за запитом; не входить до типового запуску `pnpm test:e2e`
  - Потрібні локальний CLI `openshell` і робочий Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, потім знищує тестовий gateway і sandbox
- Корисні override:
  - `OPENCLAW_E2E_OPENSHELL=1` щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` щоб вказати нестандартний CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфіг: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- Типово: **увімкнено** командою `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей tool calling, проблем auth та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / витрачає rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски джерелять `~/.profile`, щоб підхопити відсутні API-ключі.
- Типово live-запуски все одно ізолюють `HOME` і копіюють config/auth-матеріали до тимчасового тестового home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам свідомо потрібно, щоб live-тести використовували ваш реальний home-каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення про `~/.profile` і вимикає логи bootstrap gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (залежно від провайдера): встановіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів видно як активні, навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тож рядки прогресу провайдера/gateway одразу транслюються під час live-запусків.
  - Налаштовуйте heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Користуйтеся такою таблицею рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Зміни в gateway networking / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / провайдер-специфічних збоїв / tool calling: запустіть звужений `pnpm test:live`

## Live: sweep можливостей Android node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку зараз рекламує** підключений Android node, і перевірити поведінку contract команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/не запускає/не виконує pairing app).
  - Валідація gateway `node.invoke` по командах для вибраного Android node.
- Потрібна попередня підготовка:
  - Android app уже підключений і спарений із gateway.
  - App тримається на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте успішними.
- Необов’язкові override цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделей (profile keys)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Direct model» показує, чи провайдер/модель взагалі може відповісти з наданим ключем.
- «Gateway smoke» показує, що повний pipeline gateway+agent працює для цієї моделі (sessions, history, tools, sandbox policy тощо).

### Шар 1: Direct model completion (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике completion для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб цей набір справді запустився; інакше він буде пропущений, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern` щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — псевдонім для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - Типово: profile store і env fallback
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише profile store**
- Навіщо це існує:
  - Відокремлює «API провайдера зламаний / ключ недійсний» від «pipeline gateway agent зламаний»
  - Містить малі ізольовані регресії (приклад: OpenAI Responses/Codex Responses reasoning replay + потоки tool-call)

### Шар 2: Gateway + smoke dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process gateway
  - Створити/оновити session `agent:dev:*` (override моделі для кожного запуску)
  - Перебрати моделі з ключами і перевірити:
    - «змістовну» відповідь (без tools)
    - що працює реальний виклик tool (`read` probe)
    - необов’язкові додаткові tool probe (`exec+read` probe)
    - що шляхи регресії OpenAI (лише tool-call → follow-up) продовжують працювати
- Деталі probe (щоб ви могли швидко пояснювати збої):
  - `read` probe: тест записує nonce-файл у workspace і просить агента `read` його та повернути nonce.
  - `exec+read` probe: тест просить агента записати nonce у тимчасовий файл через `exec`, а потім прочитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - Типово: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — псевдонім для сучасного allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити набір
- Як вибирати провайдерів (уникати «усе з OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Tool + image probe у цьому live-тесті завжди увімкнені:
  - `read` probe + `exec+read` probe (стрес-тест tools)
  - image probe запускається, коли модель заявляє підтримку image input
  - Потік (високорівнево):
    - Тест генерує маленький PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway парсить attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent пересилає мультимодальне повідомлення користувача до моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що саме можна тестувати на вашій машині (і точні id `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI backend (Codex CLI або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити pipeline Gateway + agent із локальним CLI backend, не торкаючись вашого типового config.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Модель: `codex-cli/gpt-5.4`
  - Команда: `codex`
  - Args: `["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- Override (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальний image attachment (шляхи ін’єктуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до image-файлів як CLI args замість ін’єкції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати передаванням image args, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий turn і перевірити потік resume.

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

Примітки:

- Docker-ранер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke CLI-backend усередині Docker-образу репозиторію як непривілейований користувач `node`.
- Для `codex-cli` він встановлює Linux-пакет `@openai/codex` у кешований записуваний префікс за адресою `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язки розмови ACP з live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайний follow-up у тій самій розмові
  - перевірити, що follow-up потрапляє до transcript прив’язаної ACP session
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP agent: `claude`
  - Синтетичний channel: контекст розмови в стилі Slack DM
  - ACP backend: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Примітки:
  - Цей lane використовує поверхню gateway `chat.send` з admin-only synthetic originating-route fields, щоб тести могли прикріплювати контекст message-channel, не вдаючи зовнішню доставку.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр агентів плагіна `acpx` для вибраного ACP harness agent.

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

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-acp-bind-docker.sh`.
- Він завантажує `~/.profile`, підготовлює відповідний CLI auth material у контейнер, встановлює `acpx` у записуваний npm-префікс, а потім встановлює потрібний live CLI (`@anthropic-ai/claude-code` або `@openai/codex`), якщо його бракує.
- Усередині Docker раннер встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера з завантаженого profile доступними для дочірнього harness CLI.

### Рекомендовані live-рецепти

Вузькі явні allowlist — найшвидші й найменш нестабільні:

- Одна модель, direct (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling через кілька провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст Antigravity OAuth (endpoint агента в стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема auth + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API-ключ / profile auth); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний binary `gemini`; у нього власна auth і він може поводитися інакше (streaming/tool support/version skew).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей для CI» немає (live — лише за запитом), але ось **рекомендовані** моделі, які варто регулярно покривати на dev-машині з ключами.

### Сучасний smoke-набір (tool calling + image)

Це запуск «типових моделей», який ми очікуємо підтримувати робочим:

- OpenAI (не-Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запускати gateway smoke з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: tool calling (Read + необов’язковий Exec)

Виберіть принаймні одну на сімейство провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4` (або найновішу доступну)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; tool calling залежить від режиму API)

### Vision: надсилання image (attachment → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою image до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI з підтримкою vision тощо), щоб пройти image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (auth через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включати до live-матриці (якщо у вас є облікові дані/config):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (кастомні endpoint): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «усі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, разом із доступними ключами.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як ви налагоджували б `openclaw models list` / вибір моделі.

- Auth-профілі per-agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це мається на увазі під “profile keys” у live-тестах)
- Config: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог legacy state: `~/.openclaw/credentials/` (копіюється у staged live home, якщо присутній, але це не основне сховище profile-key)
- Локальні live-запуски типово копіюють активний config, per-agent файли `auth-profiles.json`, legacy `credentials/` і підтримувані external CLI auth dirs у тимчасовий test home; override шляхів `agents.*.workspace` / `agentDir` вирізаються з цього staged config, щоб probe не торкалися вашого реального host workspace.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker-ранери нижче (вони можуть змонтувати `~/.profile` у контейнер).

## Live Deepgram (транскрибування аудіо)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язковий override моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live ComfyUI workflow media

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для image, video і `music_generate`
  - Пропускає кожну можливість, якщо `models.providers.comfy.<capability>` не налаштовано
  - Корисно після змін у надсиланні workflow comfy, polling, downloads або реєстрації plugin

## Live генерація зображень

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований provider plugin генерації зображень
  - Завантажує відсутні env-змінні провайдера з вашої shell входу (`~/.profile`) перед probe
  - Типово використовує live/env API-ключі раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдери без придатної auth/profile/model
  - Проганяє стандартні варіанти генерації зображень через спільну runtime capability:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери, що покриваються:
  - `openai`
  - `google`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати override лише з env

## Live генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний вбудований шлях provider генерації музики
  - Наразі покриває Google і MiniMax
  - Завантажує env-змінні провайдера з вашої shell входу (`~/.profile`) перед probe
  - Типово використовує live/env API-ключі раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдери без придатної auth/profile/model
  - Запускає обидва заявлені runtime-режими, коли вони доступні:
    - `generate` з input лише у вигляді prompt
    - `edit`, коли провайдер заявляє `capabilities.edit.enabled`
  - Поточне покриття на спільному lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати override лише з env

## Live генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний вбудований шлях provider генерації відео
  - Завантажує env-змінні провайдера з вашої shell входу (`~/.profile`) перед probe
  - Типово використовує live/env API-ключі раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдери без придатної auth/profile/model
  - Запускає обидва заявлені runtime-режими, коли вони доступні:
    - `generate` з input лише у вигляді prompt
    - `imageToVideo`, коли провайдер заявляє `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальний image input на основі buffer у спільному sweep
    - `videoToVideo`, коли провайдер заявляє `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальний video input на основі buffer у спільному sweep
  - Поточні providers `imageToVideo`, що заявлені, але пропускаються у спільному sweep:
    - `vydra`, бо вбудований `veo3` підтримує лише text, а вбудований `kling` потребує віддалений image URL
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video, а також lane `kling`, який типово використовує фікстуру віддаленого image URL
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні providers `videoToVideo`, що заявлені, але пропускаються у спільному sweep:
    - `alibaba`, `qwen`, `xai`, бо ці шляхи наразі потребують віддалені reference URL `http(s)` / MP4
    - `google`, бо поточний спільний lane Gemini/Veo використовує локальний input на основі buffer, і цей шлях не приймається у спільному sweep
    - `openai`, бо поточний спільний lane не гарантує доступ до video inpaint/remix, специфічний для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати override лише з env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори image, music і video через один нативний entrypoint репозиторію
  - Автоматично завантажує відсутні env-змінні провайдера з `~/.profile`
  - Типово автоматично звужує кожен набір до провайдерів, які зараз мають придатну auth
  - Повторно використовує `scripts/test-live.mjs`, тож поведінка heartbeat і quiet-mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери діляться на дві категорії:

- Live-model ранери: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл з profile keys всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (та підвантажують `~/.profile`, якщо змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери типово мають менший smoke cap, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` типово встановлює `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово встановлює `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` збирає live Docker image один раз через `test:docker:live-build`, а потім повторно використовує його для двох live Docker lanes.
- Ранери container smoke: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` і `test:docker:plugins` піднімають один або кілька реальних контейнерів і перевіряють integration-шляхи вищого рівня.

Live-model Docker-ранери також bind-mount лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішніх CLI міг оновлювати токени, не змінюючи host auth store:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Мережева взаємодія gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (install smoke + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)

Live-model Docker-ранери також bind-mount поточний checkout у режимі лише читання і
stage його у тимчасовий workdir всередині контейнера. Це зберігає runtime
image компактним, але все одно запускає Vitest проти вашого точного локального source/config.
Під час stage пропускаються великі локальні кеші та результати збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні каталоги
`.build` або Gradle output, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, прив’язаних до конкретної машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live probe gateway не запускали
реальні worker каналів Telegram/Discord/etc. всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити покриття gateway
live із цього Docker lane.
`test:docker:openwebui` — це smoke вищого рівня для сумісності: він запускає
контейнер gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися витягнути
image Open WebUI, а самому Open WebUI — завершити власне налаштування холодного старту.
Для цього lane потрібен придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він піднімає seeded Gateway
container, запускає другий container, який викликає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання transcript, metadata attachment,
поведінку черги live event, маршрутизацію outbound send і сповіщення про channel +
permission у стилі Claude через реальний stdio MCP bridge. Перевірка notification
безпосередньо інспектує сирі stdio MCP frame, тож smoke перевіряє те, що міст
справді випромінює, а не лише те, що випадково показує певний client SDK.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей script для регресійних/налагоджувальних сценаріїв. Він може знову знадобитися для перевірки маршрутизації ACP thread, тож не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установок CLI всередині Docker
- Каталоги/файли auth зовнішніх CLI під `$HOME` монтуються у режимі лише читання під `/host-auth...`, а потім копіюються в `/home/node/...` до старту тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Для звужених запусків монтуються лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ручне override через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації провайдерів усередині контейнера
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані беруться зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб override prompt із перевіркою nonce, який використовується для smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб override закріплений image-tag Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Tool calling у gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер gateway (WS `wizard.start`/`wizard.next`, записує config + забезпечується auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Evals надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як “evals надійності агента”:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки wizard, що перевіряють session wiring і ефекти config (`src/gateway/gateway.test.ts`).

Чого все ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли Skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Compliance:** чи читає агент `SKILL.md` перед використанням і чи дотримується потрібних кроків/arg?
- **Workflow contracts:** багатокрокові сценарії, що перевіряють порядок tool, перенесення history між session і межі sandbox.

Майбутні eval мають спочатку залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів tool + порядку, читання skill-файлів і wiring session.
- Невеликий набір сценаріїв, зосереджених на Skills (використати чи уникнути, gate, prompt injection).
- Необов’язкові live evals (за запитом, з керуванням через env) — лише після того, як безпечний для CI набір буде готовий.

## Contract-тести (форма plugin і channel)

Contract-тести перевіряють, що кожен зареєстрований plugin і channel відповідає
своєму interface contract. Вони перебирають усі знайдені plugins і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте contract-команди явно,
коли ви змінюєте спільні surface channel або provider.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Contract майстра налаштування
- **session-binding** - Поведінка прив’язки session
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка thread ID
- **directory** - API directory/roster
- **group-policy** - Застосування group policy

### Contracts статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe статусу channel
- **registry** - Форма реєстру plugin

### Provider contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract потоку auth
- **auth-choice** - Вибір/selection auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/interface plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації plugin або discovery

Contract-тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub провайдера або захоплення точної трансформації форми request)
- Якщо це за своєю природою лише live-проблема (rate limit, політики auth), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому шару, який виявляє помилку:
  - помилка конвертації/відтворення request провайдера → direct models test
  - помилка pipeline gateway session/history/tool → gateway live smoke або безпечний для CI mock-тест gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить по одній sampled-цілі на кожен клас SecretRef із metadata реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що traversal-segment exec id відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на не класифікованих target id, щоб нові класи не можна було тихо пропустити.
