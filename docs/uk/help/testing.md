---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделей/провайдерів
    - Налагодження поведінки Gateway та агентів
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-23T07:42:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a92e9d1cd0ff64aabfbc28b42045aa6c63159375ff41695805488b40280e1b43
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів.

Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює)
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Якщо ви працюєте над однією помилкою, спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + gateway-перевірки tool/image): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live-перевірка моделей: `pnpm test:docker:live-models`
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з
    `include_live_suites: true`, який включає окремі Docker live model
    matrix jobs, шардовані за провайдером.
  - Додайте нові high-signal secrets провайдерів до `scripts/ci-hydrate-live-auth.sh`
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release викликачів.
- Перевірка вартості Moonshot/Kimi: коли встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє про Moonshot/K2.6 і що
  transcript помічника зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один проблемний випадок, віддавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## QA-специфічні ранери

Ці команди розташовані поруч з основними тестовими наборами, коли вам потрібен реалізм qa-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається на відповідних PR
і через manual dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через manual dispatch із mock parity gate, live Matrix lane та
Convex-керованим live Telegram lane як паралельними jobs. `OpenClaw Release Checks`
запускає ті самі lanes перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway-воркерами. `qa-channel` за замовчуванням має concurrency 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>` для налаштування кількості
    воркерів або `--concurrency 1` для старішого послідовного lane.
  - Повертає ненульовий код, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і protocol-mock без заміни сценарно-орієнтованого
    lane `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Multipass Linux VM.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA-входи автентифікації, які практичні для гостьової системи:
    ключі провайдерів через env, шлях до конфігурації QA live provider і
    `CODEX_HOME`, якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гість міг записувати назад через
    змонтоване робоче середовище.
  - Записує стандартний QA report + summary, а також логи Multipass до
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний onboarding з API-ключем OpenAI, налаштовує Telegram
    за замовчуванням, перевіряє, що ввімкнення plugin встановлює залежності runtime на вимогу,
    запускає doctor і виконує один локальний хід агента проти змоканого
    endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий
    lane пакетного встановлення з Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує й встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через редагування
    конфігурації.
  - Перевіряє, що виявлення налаштування залишає відсутніми залежності runtime
    неконфігурованих plugin, що перший налаштований запуск Gateway або doctor встановлює
    залежності runtime кожного bundled plugin на вимогу, і що другий перезапуск не
    перевстановлює залежності, які вже були активовані.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>`, і перевіряє, що doctor після оновлення в
    candidate відновлює bundled channel runtime dependencies без післявстановлювального
    виправлення з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямої перевірки протоколу.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Пакетні встановлення OpenClaw не постачають
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують bundled runner безпосередньо; окремий крок встановлення plugin не потрібен.
  - Надає три тимчасові користувачі Matrix (`driver`, `sut`, `observer`) та одну приватну кімнату, а потім запускає дочірній QA gateway із реальним Matrix plugin як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, тому що lane локально створює тимчасових користувачів.
  - Записує Matrix QA report, summary, артефакт observed-events та комбінований лог stdout/stderr до `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти реальної приватної групи з використанням токенів driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Повертає ненульовий код, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів у тій самій приватній групі, причому бот SUT має мати Telegram username.
  - Для стабільного bot-to-bot спостереження увімкніть режим Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що bot driver може спостерігати за трафіком ботів у групі.
  - Записує Telegram QA report, summary і артефакт observed-messages до `.artifacts/qa-e2e/...`.

Live transport lanes використовують один стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним QA-набором і не входить до матриці покриття live transport.

| Lane     | Canary | Фільтрація за згадками | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда help |
| -------- | ------ | ---------------------- | -------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | ------------ |
| Matrix   | x      | x                      | x                    | x                         | x                             | x                          | x               | x                          |              |
| Telegram | x      |                        |                      |                           |                               |                            |                 |                            | x            |

### Спільні Telegram-облікові дані через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat цієї
оренди, поки lane працює, і звільняє оренду під час завершення роботи.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один secret для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення з env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URL для локальної розробки.

У звичайному режимі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Адміністративні команди maintainer (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машиночитаного виводу в скриптах і утилітах CI.

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
- `POST /admin/add` (лише secret maintainer)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише secret maintainer)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише secret maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректний payload.

### Додавання каналу до QA

Щоб додати канал до markdown QA system, потрібні рівно дві речі:

1. Адаптер транспорту для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
керувати цим процесом.

`qa-lab` відповідає за спільні механізми хоста:

- кореневу команду `openclaw qa`
- запуск і завершення наборів
- паралелізм воркерів
- запис артефактів
- генерацію звітів
- виконання сценаріїв
- aliases сумісності для старіших сценаріїв `qa-channel`

Runner plugins відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектяться вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcript-и та нормалізований стан транспорту
- як виконуються дії, підкріплені транспортом
- як обробляється транспортно-специфічний reset або cleanup

Мінімальний поріг прийняття для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Залишайте транспортно-специфічні механізми всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Тримайте `runtime-api.ts` легким; лінивий CLI і виконання runner мають залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте generic helpers для нових сценаріїв.
7. Зберігайте працездатність наявних aliases сумісності, якщо тільки в репозиторії не виконується навмисна міграція.

Правило прийняття рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, залишайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте generic helper замість channel-specific branch у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій транспортно-специфічним і явно фіксуйте це в контракті сценарію.

Бажані назви generic helper для нових сценаріїв:

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

Aliases сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати generic назви helper.
Aliases сумісності існують, щоб уникнути міграції типу flag day, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Думайте про набори як про «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: десять послідовних shard-запусків (`vitest.full-*.config.ts`) поверх наявних scoped Vitest projects
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, які охоплює `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка про projects:
  - Ненацілений `pnpm test` тепер запускає одинадцять менших shard-конфігів (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати нерелевантні набори.
  - `pnpm test --watch` усе ще використовує native root `vitest.config.ts` project graph, тому що multi-shard цикл watch непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не платить повну ціну запуску root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff торкається лише routable source/test файлів; редагування config/setup усе ще повертаються до широкого повторного запуску root-project.
  - `pnpm check:changed` — це стандартний розумний локальний gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні lanes typecheck/lint/test. Зміни в public Plugin SDK і plugin-contract включають валідацію extensions, тому що extensions залежать від цих core-контрактів. Version bump-и лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни package поза полем version верхнього рівня.
  - Імпорт-легкі unit-тести з agents, commands, plugins, helper-ів auto-reply, `plugin-sdk` та подібних чистих утилітних зон маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
  - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють запуски в changed-mode з явними sibling tests у цих легких lanes, щоб редагування helper-ів не спричиняли повторний запуск усього важкого набору для цього каталогу.
  - `auto-reply` тепер має три виділені bucket-и: helper-и core верхнього рівня, integration-тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це не дає найважчій роботі reply harness потрапляти до дешевих тестів status/chunk/token.
- Примітка про embedded runner:
  - Коли ви змінюєте вхідні дані виявлення message-tool або runtime context для compaction,
    зберігайте обидва рівні покриття.
  - Додавайте сфокусовані helper-регресії для чистих меж routing/normalization.
  - Також підтримуйте здоровими integration-набори embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped id і поведінка Compaction як і раніше проходять
    через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести не є
    достатньою заміною для цих integration-шляхів.
- Примітка про pool:
  - Базова конфігурація Vitest тепер типово використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує non-isolated runner у root projects, e2e та live configs.
  - Кореневий lane UI зберігає своє налаштування `jsdom` і optimizer, але тепер теж працює на спільному non-isolated runner.
  - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також типово додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо потрібно порівняти зі стандартною поведінкою V8.
- Примітка про швидку локальну ітерацію:
  - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
  - Pre-commit hook запускає `pnpm check:changed --staged` після staged formatting/linting, тому core-only commit-и не оплачують вартість тестів extensions, якщо не торкаються public extension-facing contracts. Commit-и лише з release metadata залишаються на цільовому lane version/config/root-dependency.
  - Якщо точний staged-набір змін уже був перевірений рівними або сильнішими gates, використовуйте `scripts/committer --fast "<message>" <files...>`, щоб пропустити лише повторний запуск changed-scope hook. Staged format/lint усе одно запускаються. Згадайте завершені gates у своєму handoff. Це також прийнятно після ізольованого flaky hook failure, який був повторно запущений і пройшов зі scoped proof.
  - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи чисто зіставляються з меншим набором.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим лімітом воркерів.
  - Автомасштабування локальних воркерів тепер навмисно консервативне й також знижує навантаження, коли середнє навантаження хоста вже високе, тож кілька одночасних запусків Vitest за замовчуванням завдають менше шкоди.
  - Базова конфігурація Vitest позначає файли projects/config як `forceRerunTriggers`, щоб rerun-и в changed-mode лишалися коректними, коли змінюється wiring тестів.
  - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого profiling.
- Примітка про perf-debug:
  - `pnpm test:perf:imports` вмикає звітність про тривалість імпорту у Vitest плюс вивід import-breakdown.
  - `pnpm test:perf:imports:changed` обмежує той самий profiling view файлами, зміненими відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` із native root-project шляхом для цього закоміченого diff і виводить wall time та macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` вимірює поточне брудне дерево, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і root-конфігурацію Vitest.
  - `pnpm test:perf:profile:main` записує CPU profile основного потоку для накладних витрат запуску та transform у Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner-а для unit-набору з вимкненим паралелізмом файлів.

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один воркер
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Пропускає синтетичне churn повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Виконує запити до `diagnostics.stability` через WS RPC Gateway
  - Охоплює helper-и persistence для diagnostic stability bundle
  - Перевіряє, що recorder лишається обмеженим, синтетичні вибірки RSS залишаються нижче бюджету тиску, а глибина черг для кожної сесії зменшується назад до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Типові налаштування runtime:
  - Використовує `threads` Vitest з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість воркерів (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в тихому режимі, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість воркерів (не більше 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка multi-instance gateway
  - Поверхні WebSocket/HTTP, pairing вузлів і важчий networking
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж в unit-тестах (може бути повільніше)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + виконання SSH
  - Верифікує remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, після чого знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний двійковий файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей tool calling, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є CI-стабільним (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють матеріали config/auth до тимчасового test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і приглушує bootstrap-логи Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (залежно від провайдера): встановлюйте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або override для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби при відповідях із rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб під час довгих викликів провайдерів було видно, що виконання активне, навіть коли перехоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки прогресу провайдера/Gateway одразу транслюються під час live-запусків.
  - Налаштовуйте Heartbeat direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтесь gateway networking / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / tool calling: запускайте звужений `pnpm test:live`

## Live: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку наразі оголошує** підключений Android Node, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/не запускає/не pair-ить застосунок).
  - Перевірка `node.invoke` Gateway по командах для вибраного Android Node.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключений і спарений із gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для тих можливостей, які ви очікуєте як успішні.
- Необов’язкові override-и цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделей (ключі профілів)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Direct model» показує нам, чи взагалі може відповісти провайдер/модель із наданим ключем.
- «Gateway smoke» показує нам, чи працює повний pipeline gateway+agent для цієї моделі (sessions, history, tools, sandbox policy тощо).

### Шар 1: Direct model completion (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике completion для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб справді запустити цей набір; інакше він пропускається, щоб `pnpm test:live` залишався сфокусованим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Перевірки modern/all за замовчуванням обмежені curated high-signal cap; встановіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого обмеження.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: profile store і fallback-и env
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише profile store**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ невалідний» від «pipeline gateway agent зламаний»
  - Містить невеликі ізольовані регресії (наприклад: reasoning replay + tool-call flows для OpenAI Responses/Codex Responses)

### Шар 2: Gateway + smoke dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process gateway
  - Створити/змінити session `agent:dev:*` (override моделі для кожного запуску)
  - Перебрати models-with-keys і перевірити:
    - «змістовну» відповідь (без tools)
    - що працює реальний виклик tool (read probe)
    - необов’язкові додаткові перевірки tool (exec+read probe)
    - що шляхи регресії OpenAI (лише tool-call → follow-up) продовжують працювати
- Деталі probe (щоб ви могли швидко пояснити збої):
  - `read` probe: тест записує nonce-файл у workspace і просить агента `read` його та повернути nonce назад.
  - `exec+read` probe: тест просить агента записати nonce у тимчасовий файл через `exec`, а потім прочитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Перевірки modern/all для gateway за замовчуванням обмежені curated high-signal cap; встановіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого обмеження.
- Як вибирати провайдерів (уникайте «усього OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Перевірки tool + image у цьому live-тесті завжди увімкнені:
  - `read` probe + `exec+read` probe (навантаження на tools)
  - image probe запускається, коли модель оголошує підтримку вхідних зображень
  - Потік (високий рівень):
    - Тест генерує маленький PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent пересилає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: невеликі помилки дозволені)

Порада: щоб побачити, що ви можете тестувати на своїй машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI backend (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити pipeline Gateway + agent, використовуючи локальний CLI backend, не торкаючись вашої типової конфігурації.
- Типові значення smoke для backend, специфічні для конкретного backend, зберігаються у визначенні `cli-backend.ts` відповідного extension.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий provider/model: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих plugin CLI backend, якому вона належить.
- Override-и (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи інжектяться в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як CLI-аргументи замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити flow відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типову перевірку безперервності в тій самій session Claude Sonnet -> Opus (встановіть `1`, щоб примусово ввімкнути її, коли вибрана модель підтримує ціль перемикання).

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

Рецепти Docker для одного провайдера:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker-ранер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke CLI-backend усередині Docker-образу репозиторію від непривілейованого користувача `node`.
- Він отримує метадані CLI smoke із відповідного extension, а потім встановлює відповідний Linux CLI package (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс у `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносної Claude Code subscription OAuth через `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` із `claude setup-token`. Спочатку він доводить, що прямий `claude -p` у Docker працює, а потім запускає два ходи Gateway CLI-backend без збереження змінних середовища API-ключа Anthropic. Цей subscription lane за замовчуванням вимикає перевірки Claude MCP/tool та image, тому що Claude наразі маршрутизує використання сторонніх застосунків через додаткове білінг-споживання замість звичайних лімітів плану subscription.
- Live smoke CLI-backend тепер перевіряє той самий end-to-end flow для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик tool `cron` через MCP, перевірений через gateway CLI.
- Типовий smoke Claude також змінює session із Sonnet на Opus і перевіряє, що відновлена session усе ще пам’ятає попередню нотатку.

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний flow conversation-bind ACP із live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати на місці синтетичну conversation каналу повідомлень
  - надіслати звичайний follow-up у тій самій conversation
  - перевірити, що follow-up потрапляє до transcript прив’язаної ACP session
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP-агенти в Docker: `claude,codex,gemini`
  - ACP-агент для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст conversation у стилі Slack DM
  - ACP-backend: `acpx`
- Override-и:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Примітки:
  - Цей lane використовує поверхню gateway `chat.send` з admin-only synthetic полями originating-route, щоб тести могли додавати контекст message-channel без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр агентів plugin `acpx` для вибраного ACP harness agent.

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

Рецепти Docker для одного агента:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає ACP bind smoke послідовно для всіх підтримуваних live CLI agent: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він використовує `~/.profile`, переносить відповідні матеріали автентифікації CLI до контейнера, встановлює `acpx` у записуваний npm-префікс, а потім установлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker раннер встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб `acpx` зберігав змінні середовища провайдера з підвантаженого profile доступними для дочірнього harness CLI.

## Live: smoke Codex app-server harness

- Мета: перевірити plugin-owned Codex harness через звичайний gateway
  метод `agent`:
  - завантажити bundled plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `codex/gpt-5.4`
  - надіслати другий хід до тієї самої session OpenClaw і перевірити, що app-server
    thread може відновитися
  - запустити `/codex status` і `/codex models` через той самий шлях
    команди gateway
  - за потреби запустити дві escalated shell-перевірки, перевірені Guardian: одну нешкідливу
    команду, яку має бути схвалено, і одне фальшиве завантаження secret,
    яке має бути відхилено, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `codex/gpt-5.4`
- Необов’язкова image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти, тихо переключившись на PI.
- Auth: `OPENAI_API_KEY` із shell/profile, а також необов’язково скопійовані
  `~/.codex/auth.json` і `~/.codex/config.toml`

Локальний рецепт:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він використовує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації Codex CLI, якщо вони є, встановлює `@openai/codex` у записуваний змонтований npm
  префікс, переносить дерево джерел, а потім запускає лише live-тест Codex-harness.
- У Docker за замовчуванням увімкнено image, MCP/tool і Guardian probes. Встановіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий налагоджувальний
  запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, як і live
  test config, щоб fallback `openai-codex/*` або PI не міг приховати регресію
  Codex harness.

### Рекомендовані live-рецепти

Вузькі явні allowlist — найшвидші й найменш нестабільні:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling у кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст Antigravity OAuth (endpoint агента в стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (автентифікація через API-ключ / profile); саме це більшість користувачів мають на увазі під “Gemini”.
  - CLI: OpenClaw викликає локальний двійковий файл `gemini`; він має власну автентифікацію й може поводитися інакше (streaming/tool support/version skew).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей для CI» немає (live — opt-in), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Набір modern smoke (tool calling + image)

Це запуск «поширених моделей», який ми очікуємо підтримувати в робочому стані:

- OpenAI (не-Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск gateway smoke з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: tool calling (Read + необов’язковий Exec)

Виберіть принаймні одну модель на сімейство провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою tools, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; tool calling залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI-варіанти з підтримкою vision тощо), щоб задіяти image probe.

### Aggregators / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tool+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, які можна включити до live matrix (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoint): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «усі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс доступні ключі.

## Облікові дані (ніколи не комітьте)

Live-тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це у live-тестах означає “profile keys”)
- Config: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Застарілий каталог стану: `~/.openclaw/credentials/` (копіюється до staged live home, якщо присутній, але це не основне сховище profile keys)
- Локальні live-запуски за замовчуванням копіюють активний config, файли `auth-profiles.json` для окремих агентів, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового test home; staged live homes пропускають `workspace/` і `sandboxes/`, а override-и шляхів `agents.*.workspace` / `agentDir` видаляються, щоб probes не торкалися вашого реального host workspace.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

## Live Deepgram (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язковий override моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live медіа workflow ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у відправленні workflow comfy, polling, downloads або реєстрації plugin

## Live генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований provider plugin для генерації зображень
  - Завантажує відсутні змінні середовища провайдера з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth profile, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної auth/profile/model
  - Проганяє стандартні варіанти генерації зображень через спільну runtime capability:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери, які покриваються:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати override-и лише через env

## Live генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях bundled provider для генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує змінні середовища провайдера з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth profile, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної auth/profile/model
  - Запускає обидва оголошені runtime modes, коли вони доступні:
    - `generate` з вхідними даними лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття в спільному lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, а не ця спільна перевірка
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати override-и лише через env

## Live генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях bundled provider для генерації відео
  - За замовчуванням використовує безпечний для релізу smoke-шлях: провайдери без FAL, один запит text-to-video на провайдера, одноcекундний lobster prompt і ліміт операції на провайдера через `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, тому що затримка черги на боці провайдера може домінувати у часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує змінні середовища провайдера з вашої login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth profile, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної auth/profile/model
  - За замовчуванням запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені transform modes, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний provider/model приймає локальні вхідні зображення на основі buffer у спільній перевірці
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний provider/model приймає локальні вхідні відео на основі buffer у спільній перевірці
  - Поточні провайдери `imageToVideo`, які оголошені, але пропускаються у спільній перевірці:
    - `vydra`, тому що bundled `veo3` підтримує лише text, а bundled `kling` вимагає віддалений URL зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video, а також lane `kling`, який за замовчуванням використовує фікстуру з віддаленим URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, які оголошені, але пропускаються у спільній перевірці:
    - `alibaba`, `qwen`, `xai`, тому що ці шляхи наразі вимагають віддалені reference URL `http(s)` / MP4
    - `google`, тому що поточний спільний lane Gemini/Veo використовує локальні вхідні дані на основі buffer, а цей шлях не приймається у спільній перевірці
    - `openai`, тому що поточний спільний lane не має гарантій доступу до video inpaint/remix, специфічного для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типової перевірки, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції для кожного провайдера під час агресивного smoke-запуску
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати override-и лише через env

## Harness для media live

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через один рідний для репозиторію entrypoint
  - Автоматично завантажує відсутні змінні середовища провайдера з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну auth
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і quiet mode лишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Live-model ранери: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл для profile keys всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог config і workspace (і використовуючи `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint-и: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Live Docker-ранери за замовчуванням використовують менший smoke cap, щоб повна Docker-перевірка лишалася практичною:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  вам навмисно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для двох Docker lanes live. Він також збирає один спільний image `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для smoke-ранерів E2E у контейнері, які перевіряють зібраний застосунок.
- Ранери container smoke: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` піднімають один або кілька реальних контейнерів і перевіряють integration-шляхи вищого рівня.

Live-model Docker-ранери також bind-mount-ять лише потрібні домівки автентифікації CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб зовнішня CLI OAuth могла оновлювати токени без зміни сховища auth на хості:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke Codex app-server harness: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent з npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding із посиланням на env плюс Telegram за замовчуванням, перевіряє, що ввімкнення plugin встановлює його runtime dependencies на вимогу, запускає doctor і виконує один хід змоканого агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Gateway networking (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальна reasoning-регресія OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, а потім примусово відхиляє схему провайдера і перевіряє, що сирі деталі з’являються в логах Gateway.
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude smoke notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (реальний stdio MCP server + embedded smoke allow/deny профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + alias `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінності оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime dependencies bundled plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий image Docker runner, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, або вказуйте наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Під час ітерації звужуйте runtime dependencies bundled plugin, вимикаючи нерелевантні сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати і повторно використовувати спільний built-app image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override-и image для конкретних наборів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо їх установлено. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти витягують його, якщо його ще немає локально. Docker-тести QR та інсталятора зберігають власні Dockerfile, тому що вони перевіряють поведінку package/install, а не спільний built-app runtime.

Live-model Docker-ранери також монтують поточний checkout лише для читання і
переносять його до тимчасового workdir усередині контейнера. Це зберігає runtime
image компактним, водночас дозволяючи запускати Vitest точно проти ваших локальних source/config.
Крок перенесення пропускає великі локальні кеші та результати збірки застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків каталоги `.build` або
виводу Gradle, щоб live-запуски Docker не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні channel-воркери Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цього Docker lane.
`test:docker:openwebui` — це compatibility smoke вищого рівня: він запускає
контейнер gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoint,
запускає pinned контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, тому що Docker може знадобитися витягнути
image Open WebUI, а Open WebUI може потребувати завершити власне cold-start налаштування.
Цей lane очікує придатний ключ live-моделі, і `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload, наприклад `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord чи iMessage. Він запускає seeded контейнер Gateway,
потім запускає другий контейнер, який породжує `openclaw mcp serve`, а далі
перевіряє виявлення маршрутизованих conversation, читання transcript, метадані вкладень,
поведінку черги live event, маршрутизацію outbound send і сповіщення каналу +
дозволів у стилі Claude через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо аналізує сирі stdio MCP frames, тому smoke перевіряє те, що bridge
справді виводить, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує ключа live-моделі.
Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через embedded runtime Pi bundle
MCP, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа live-моделі.
Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний ACP smoke plain-language для thread (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки ACP thread routing, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і використовується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Зовнішні каталоги/файли CLI auth у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Можна перевизначити вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний image `openclaw:local-live` для перезапусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані беруться зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt з перевіркою nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити pinned tag image Open WebUI

## Перевірка коректності документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечні для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Gateway tool calling (змоканий OpenAI, реальний gateway + цикл agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, запис config + обов’язкова auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агентів»:

- Mock tool-calling через реальний gateway + цикл agent (`src/gateway/gateway.test.ts`).
- Наскрізні flow майстра, які перевіряють wiring сесій і ефекти config (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Вибір рішення:** коли Skills перелічено в prompt, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи дотримується потрібних кроків/аргументів?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок tools, перенесення history між сесіями та межі sandbox.

Майбутні eval-и мають спершу залишатися детермінованими:

- Ранер сценаріїв, який використовує mock-провайдери для перевірки викликів tools + їх порядку, читання skill-файлів і wiring сесій.
- Невеликий набір сценаріїв, зосереджених на Skills (використати чи уникнути, gate-умови, ін’єкція в prompt).
- Необов’язкові live eval-и (opt-in, із gate через env) лише після впровадження безпечного для CI набору.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає
своєму інтерфейсному контракту. Вони перебирають усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтесь спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки session
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API directory/roster
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
- **registry** - Форма реєстру Plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт flow автентифікації
- **auth-choice** - Вибір/selection автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export-ів або subpath-ів plugin-sdk
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI й не потребують реальних API-ключів.

## Додавання регресійних тестів (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub провайдера або фіксацію точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limit, політики auth), залишайте live-тест вузьким і opt-in через env vars
- Намагайтеся цілитися в найменший шар, який ловить баг:
  - баг перетворення/повторення запиту провайдера → тест direct models
  - баг pipeline gateway session/history/tool → gateway live smoke або безпечний для CI mock-тест gateway
- Захисний механізм обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить один вибірковий target на кожен клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що traversal-segment exec id відхиляються.
  - Якщо ви додаєте нову сім’ю target-ів SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не могли бути тихо пропущені.
