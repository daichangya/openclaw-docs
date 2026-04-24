---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: unit/e2e/live набори, Docker runners і що саме охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-24T22:51:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8d70027f15c4e12198d6e8fa8cb74086c30dd405d6681d78ecb811bd448e838
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker runners. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск усього набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Коли ви ітеруєтеся над однією помилкою, спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більшої впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Цільовий запуск одного live-файлу в тихому режимі: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику перевірку у стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують невеликий хід із зображенням.
    Вимкніть додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, що включає окремі матричні jobs Docker live model,
    розбиті за провайдером.
  - Для точкових повторних запусків у CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`, а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів для scheduled/release.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення із зображенням
    маршрутизуються через нативну прив’язку plugin, а не через ACP.
- Moonshot/Kimi cost smoke: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6 і що
  транскрипт асистента зберігає нормалізований `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## Runner-и, специфічні для QA

Ці команди розташовані поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається на відповідних PR і
з ручного dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch із mock parity gate, live Matrix lane та live Telegram lane під керуванням Convex як паралельними jobs. `OpenClaw Release Checks`
запускає ті самі lane-и перед погодженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    worker-ами Gateway. `qa-channel` за замовчуванням має concurrency 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість worker-ів, або `--concurrency 1` для старого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і протокольних mock-ів без заміни сценарно-орієнтованого
    lane `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA-входи автентифікації, практичні для гостьової системи:
    ключі провайдера на базі env, шлях до конфігурації QA live provider і `CODEX_HOME`, якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний QA report + summary, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Створює npm tarball із поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний onboarding з API-ключем OpenAI, за замовчуванням налаштовує Telegram,
    перевіряє, що ввімкнення plugin встановлює runtime dependencies на вимогу,
    запускає doctor і виконує один локальний хід агента проти змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий
    lane пакетного встановлення з Discord.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, виконує onboarding для
    встановленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    QA lane live Telegram із цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions надає цей lane як ручний workflow для супровідника
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і оренду CI-облікових даних Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує й установлює поточну збірку OpenClaw у Docker, запускає Gateway з налаштованим OpenAI, а потім вмикає bundled channel/plugin через редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає runtime dependencies
    неналаштованих plugin відсутніми, що перший налаштований запуск Gateway або doctor
    встановлює runtime dependencies кожного bundled plugin на вимогу, і що другий перезапуск не перевстановлює залежності, які вже були активовані.
  - Також установлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що
    `doctor` кандидата після оновлення відновлює bundled channel runtime dependencies без виправлення `postinstall` з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для repo/dev. Пакетні встановлення OpenClaw не постачають
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують bundled runner безпосередньо; окремий крок встановлення plugin не потрібен.
  - Надає три тимчасові користувачі Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній процес QA gateway із реальним plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільні прапорці джерела облікових даних, тому що lane локально створює тимчасових користувачів.
  - Записує Matrix QA report, summary, артефакт observed-events і комбінований журнал виводу stdout/stderr до `.artifacts/qa-e2e/...`.
  - За замовчуванням виводить прогрес і примусово застосовує жорсткий timeout виконання через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). Cleanup обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а помилки включають команду відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулів облікових даних. За замовчуванням використовуйте режим env, або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб перейти на pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати Telegram username.
  - Для стабільного спостереження взаємодії між ботами увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує Telegram QA report, summary і артефакт observed-messages до `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостережуваної відповіді SUT.

Live transport lane-и мають спільний стандартний контракт, щоб нові транспорти не дрейфували:

`qa-channel` залишається широким синтетичним QA-набором і не входить до матриці покриття live transport.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди, поки lane виконується, і звільняє оренду під час завершення роботи.

Еталонний каркас проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Команди адміністрування для супровідників (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для супровідників:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker,
префікс endpoint, timeout HTTP і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машиночитного виводу в скриптах і
утилітах CI.

Контракт endpoint за замовчуванням (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Запит: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успіх: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Вичерпано/можна повторити: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /release`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /admin/add` (лише секрет супровідника)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет супровідника)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет супровідника)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортного адаптера для каналу.
2. Набору сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` володіє спільною хост-механікою:

- коренем команди `openclaw qa`
- запуском і завершенням набору
- concurrency worker-ів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- псевдонімами сумісності для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти й нормалізований стан транспорту
- як виконуються дії на основі транспорту
- як обробляється специфічний для транспорту reset або cleanup

Мінімальний поріг впровадження для нового каналу такий:

1. Зберігайте `qa-lab` як власника спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Тримайте специфічну для транспорту механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Тримайте `runtime-api.ts` легким; відкладене виконання CLI і runner має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте generic-хелпери сценаріїв для нових сценаріїв.
7. Зберігайте наявні псевдоніми сумісності робочими, якщо в репозиторії не виконується навмисна міграція.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного канального транспорту, тримайте її в runner plugin або harness цього plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте generic-хелпер замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту й явно зазначайте це в контракті сценарію.

Бажані назви generic-хелперів для нових сценаріїв:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Для наявних сценаріїв залишаються доступними псевдоніми сумісності, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати generic-назви хелперів.
Псевдоніми сумісності існують, щоб уникнути одномоментної міграції, а не як модель для
створення нових сценаріїв.

## Набори тестів (що і де запускається)

Думайте про набори як про «зростання реалізму» (і зростання flaky-поведінки/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: ненацілені запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у конфігурації для кожного проєкту для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelist-нуті node-тести `ui`, які охоплює `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Інтеграційні тести в межах процесу (автентифікація Gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускаються в CI
  - Реальні ключі не потрібні
  - Мають бути швидкими й стабільними

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненацілені запуски `pnpm test` використовують дванадцять менших конфігурацій shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу native root-project. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension витісняти не пов’язані набори.
    - `pnpm test --watch` усе ще використовує native root граф проєкту `vitest.config.ts`, тому що цикл watch із кількома shards непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` розгортає змінені шляхи git у ті самі scoped lanes, коли diff зачіпає лише routable source/test файли; редагування config/setup усе ще повертаються до широкого повторного запуску root-project.
    - `pnpm check:changed` — це звичайний розумний локальний gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні typecheck/lint/test lanes. Зміни в публічному Plugin SDK і plugin-contract включають один прохід перевірки extension, тому що extensions залежать від цих контрактів core. Оновлення версій лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни пакета поза полем версії верхнього рівня.
    - Unit-тести з легкими імпортами з agents, commands, plugins, хелперів auto-reply, `plugin-sdk` та подібних чистих утилітних зон маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані вихідні файли хелперів `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними сусідніми тестами в цих легких lanes, тож зміни хелперів не змушують повторно запускати повний важкий набір для цього каталогу.
    - `auto-reply` має три виділені блоки: top-level core хелпери, top-level інтеграційні тести `reply.*` і піддерево `src/auto-reply/reply/**`. Це не дає найважчій роботі harness reply потрапляти в дешеві тести status/chunk/token.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте входи виявлення message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресії хелперів для чистих меж
      маршрутизації та нормалізації.
    - Підтримуйте інтеграційні набори embedded runner у здоровому стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка compaction усе ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише на рівні хелперів
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Типові значення Vitest pool та isolation">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      non-isolated runner у root projects, а також у конфігураціях e2e і live.
    - Root UI lane зберігає свій `jsdom` setup і optimizer, але теж працює на
      спільному non-isolated runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення
      `threads` + `isolate: false` зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook відповідає лише за форматування. Він повторно додає відформатовані файли до stage і
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед передачею чи push, коли вам
      потрібен розумний локальний gate. Зміни в публічному Plugin SDK і plugin-contract
      включають один прохід перевірки extension.
    - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи
      чітко відповідають меншому набору.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом worker-ів.
    - Автоматичне масштабування локальних worker-ів навмисно консервативне й зменшується,
      коли середнє навантаження хоста вже високе, тому кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає файли projects/config як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed лишалися коректними, коли змінюється зв’язування тестів.
    - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну локацію кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпорту та
      вивід деталізації імпортів.
    - `pnpm test:perf:imports:changed` обмежує той самий вид профілювання
      файлами, зміненими відносно `origin/main`.
    - Коли один «гарячий» тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      мокайте цей seam безпосередньо замість глибокого імпорту runtime-хелперів
      лише для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із native root-project шляхом для цього закоміченого
      diff і виводить wall time та macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` вимірює поточне брудне дерево,
      маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root-конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує профіль CPU основного потоку для
      накладних витрат запуску та transform у Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner-а для
      unit-набору з вимкненим файловим паралелізмом.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Пропускає синтетичне churn повідомлень gateway, пам’яті та великих payload через діагностичний шлях подій
  - Виконує запит до `diagnostics.stability` через Gateway WS RPC
  - Охоплює хелпери збереження пакета діагностики стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні зразки RSS не перевищують бюджет тиску, а глибини черг для кожної сесії знову знижуються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled plugin у `extensions/`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних worker-ів (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням запускається в тихому режимі, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` — щоб примусово задати кількість worker-ів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` — щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairинг Node і важчий мережевий стек
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke для backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` — щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` — щоб указати нестандартний бінарний файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки обмежень швидкості
- Очікування:
  - За задумом нестабільні для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштують грошей / використовують rate limits
  - Переважно запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-fixtures не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам свідомо потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і вимикає логи bootstrap Gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете знову бачити повні стартові логи.
- Ротація API-ключів (специфічна для провайдера): установлюйте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід progress/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдера помітно активні навіть тоді, коли Vitest працює з тихим перехопленням консолі.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тож рядки прогресу провайдера/Gateway передаються негайно під час live-запусків.
  - Налаштовуйте Heartbeat прямої моделі через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви багато що змінили)
- Зміни в мережевій взаємодії gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / збоїв, специфічних для провайдера / виклику інструментів: запускайте звужений `pnpm test:live`

## Live-тести (що звертаються до мережі)

Для live matrix моделей, smoke-тестів backend CLI, smoke-тестів ACP, harness
Codex app-server і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker runners (необов’язкові перевірки «працює в Linux»)

Ці Docker runners поділяються на дві категорії:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний їхньому ключу профілю live-файл всередині Docker image репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і використовують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint-и: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners за замовчуванням мають менший smoke-ліміт, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам свідомо потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для Docker lane-ів live. Він також збирає один спільний image `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для container smoke runner-ів E2E, які перевіряють зібраний застосунок. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а resource caps не дають одночасно стартувати всім важким live, npm-install і multi-service lane-ам. Типові значення — 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=4` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=5`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Runner за замовчуванням виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, кожні 30 секунд виводить статус, зберігає тривалості успішних lane-ів у `.artifacts/docker-tests/lane-timings.json` і використовує ці тривалості, щоб у наступних запусках спочатку стартували довші lane-и. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест lane-ів без збирання та запуску Docker.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker runners live-model також bind-mount-ять лише потрібні CLI auth home-и (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін у сховищі auth на хості:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness Codex app-server: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke Open WebUI live: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повний scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding з посиланням на env і за замовчуванням Telegram, перевіряє, що doctor відновлює runtime deps активованого plugin, і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольований home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Installer у Docker: `bash scripts/test-install-sh-docker.sh` використовує спільний npm cache для своїх контейнерів root, update і direct-npm. Smoke оновлення за замовчуванням використовує npm `latest` як стабільну baseline перед оновленням до tarball кандидата. Перевірки installer без root зберігають ізольований npm cache, щоб cache entries, створені root, не маскували поведінку локального встановлення користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm у локальних повторних запусках.
- Install Smoke CI пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Регресія мінімального reasoning для OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення provider schema і перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст MCP channel (seeded Gateway + stdio bridge + smoke сирих notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти Pi bundle MCP (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup MCP для Cron/subagent (реальний Gateway + teardown дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps bundled plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий Docker image runner-а, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожний Linux-сценарій встановлення. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть host rebuild після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate попередньо пакує цей tarball один раз, а потім розбиває перевірки bundled channel на незалежні lane-и, включно з окремими lane-ами оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Звужуйте runtime deps bundled plugin під час ітерації, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати та повторно використати спільний image built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретного набору, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` указує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та installer зберігають власні Dockerfile, тому що вони перевіряють поведінку пакування/встановлення, а не спільний runtime built-app.

Docker runners live-model також bind-mount-ять поточний checkout у режимі лише для читання і
розміщують його у тимчасовому workdir усередині контейнера. Це зберігає runtime
image компактним, але все одно запускає Vitest проти ваших точних локальних source/config.
Етап розміщення пропускає великі локальні cache та результати збірки застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live probes Gateway не запускали
реальні worker-и каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити покриття gateway
live із цього Docker lane.
`test:docker:openwebui` — це smoke перевірки сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими HTTP endpoint OpenAI-compatible,
запускає закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
image Open WebUI, а самому Open WebUI може знадобитися завершити власне cold-start налаштування.
Цей lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального акаунта Telegram, Discord або iMessage. Він запускає seeded Gateway
container, стартує другий container, який породжує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованої розмови, читання транскриптів, метадані вкладень,
поведінку черги live event, маршрутизацію вихідних надсилань і сповіщення у стилі Claude про channel +
permission через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо аналізує сирі stdio MCP frames, тож smoke перевіряє те, що
міст справді випромінює, а не лише те, що певний SDK клієнта випадково показує.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує
ключа live-моделі. Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей server через runtime MCP вбудованого bundle Pi,
виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа live-моделі.
Він запускає seeded Gateway із реальним stdio MCP probe server, виконує
ізольований cron-хід і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для сценаріїв регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і використовується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, отримані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли CLI auth під `$HOME` монтуються в режимі лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений tag image Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки внутрішньосторінкових heading: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, примусово записує config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock-виклик інструментів через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють прив’язку сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Вибір рішення:** коли Skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує обов’язкові кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні eval-и мають насамперед залишатися детермінованими:

- Runner сценаріїв, який використовує mock-провайдерів для перевірки викликів інструментів + їх порядку, читання skill-файлів і прив’язки сесії.
- Невеликий набір сценаріїв, зосереджених на skills (використати чи уникнути, gating, prompt injection).
- Необов’язкові live eval-и (opt-in, із керуванням через env) — лише після того, як з’явиться безпечний для CI набір.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає
своєму інтерфейсному контракту. Вони проходять по всіх виявлених plugin-ах і запускають
набір перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID thread
- **directory** - API directory/roster
- **group-policy** - Застосування group policy

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки status каналу
- **registry** - Форма registry plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/селекція auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export-ів або subpath-ів plugin-sdk
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub provider або захоплення точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), залишайте live-тест вузьким і opt-in через env vars
- Переважно націлюватися на найменший рівень, який виявляє баг:
  - баг конвертації/відтворення запиту провайдера → тест прямих моделей
  - баг pipeline сесії/історії/інструментів gateway → live smoke gateway або безпечний для CI mock-тест gateway
- Захист traversal для SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef із метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів traversal відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було пропустити мовчки.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [CI](/uk/ci)
