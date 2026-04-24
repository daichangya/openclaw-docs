---
read_when:
    - Запуск тестів локально або в CI
    - Додавання regression-тестів для помилок моделей/провайдерів
    - Налагодження поведінки gateway + агента
summary: 'Набір для тестування: unit/e2e/live набори, Docker runners і що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-24T03:46:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ca5569f167962e3b55cd1873aacaa1eef020fccf2b662cb52b9a6e79fe3f69d
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker runners. Цей документ — посібник «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових сценаріїв (локально, перед push, налагодження).
- Як live tests знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати regression-тести для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повна перевірка (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск усього набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Перевірка coverage: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (models + gateway tool/image probes): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-перевірка live models: `pnpm test:docker:live-models`
  - Для кожної вибраної моделі тепер виконується текстовий хід плюс невеликий probe у стилі читання файла.
    Моделі, чиї метадані вказують на вхід `image`, також виконують малий хід із зображенням.
    Вимкніть додаткові probes через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, що включає окремі matrix jobs Docker live models,
    розбиті за провайдером.
  - Для точкових повторних запусків у CI запускайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові важливі секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів за розкладом/для релізів.
- Перевірка native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    маршрутизуються через native Plugin binding, а не через ACP.
- Перевірка вартості Moonshot/Kimi: якщо задано `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON показує Moonshot/K2.6, а
  transcript помічника зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, звужуйте live tests через змінні середовища allowlist, описані нижче.

## Спеціальні runners для QA

Ці команди стоять поруч з основними test suites, коли вам потрібен реалізм qa-lab:

CI запускає QA Lab в окремих workflows. `Parity gate` запускається для відповідних PR
і з ручного dispatch із mock providers. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch з mock parity gate, live Matrix lane та live Telegram lane,
керованим Convex, як паралельні jobs. `OpenClaw Release Checks`
запускає ті самі lanes перед підтвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    хочете отримати artifacts без коду завершення з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни lane `mock-openai`,
    орієнтованого на сценарії.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у тимчасовій Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають до guest підтримувані QA-входи авторизації, які практично використати:
    env-based ключі провайдерів, шлях до config QA live provider і `CODEX_HOME`, коли він заданий.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайні QA report + summary, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний онбординг OpenAI API key, за замовчуванням налаштовує Telegram,
    перевіряє, що ввімкнення Plugin встановлює runtime dependencies на вимогу,
    запускає doctor і виконує один локальний хід агента проти змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий lane
    packaged-install з Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через редагування config.
  - Перевіряє, що під час discovery setup не з’являються runtime dependencies
    для неналаштованих plugins, що перший налаштований запуск Gateway або doctor
    встановлює runtime dependencies кожного bundled Plugin на вимогу, і що другий restart
    не перевстановлює dependencies, які вже було активовано.
  - Також встановлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    відновлює runtime dependencies bundled channel без postinstall-відновлення
    з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост сьогодні є лише для репозиторію/розробки. Packaged OpenClaw installs не постачають
    `qa-lab`, тому не надають `openclaw qa`.
  - Checkout репозиторію завантажують bundled runner напряму; окремий крок встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Matrix Plugin як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільні прапорці джерела облікових даних, оскільки цей lane локально створює тимчасових користувачів.
  - Записує Matrix QA report, summary, artifact observed-events і об’єднаний журнал виводу stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи з використанням токенів ботів driver і SUT із env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте режим env, або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    хочете отримати artifacts без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що bot driver може спостерігати трафік ботів у групі.
  - Записує Telegram QA report, summary і artifact observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту надсилання driver до спостережуваної відповіді SUT.

Live transport lanes мають один спільний стандартний контракт, щоб нові транспорти не дрейфували:

`qa-channel` залишається широким синтетичним QA-набором і не входить до live
transport coverage matrix.

| Lane     | Canary | Обмеження згадками | Блокування allowlist | Відповідь верхнього рівня | Відновлення після restart | Подальші дії в thread | Ізоляція thread | Спостереження реакцій | Команда help |
| -------- | ------ | ------------------ | -------------------- | ------------------------- | ------------------------- | --------------------- | --------------- | --------------------- | ------------ |
| Matrix   | x      | x                  | x                    | x                         | x                         | x                     | x               | x                     |              |
| Telegram | x      |                    |                      |                           |                           |                       |                 |                       | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну lease з пулу на базі Convex, надсилає Heartbeat цієї
lease, поки lane виконується, і звільняє lease під час завершення.

Базовий scaffold проєкту Convex:

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі має використовувати `https://`.

Адміністративні команди maintainer (додати/видалити/перелічити пул) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainers:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машинозчитуваного виводу в скриптах і утилітах CI.

Типовий контракт endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (лише секрет maintainer)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет maintainer)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до системи markdown QA вимагає рівно двох речей:

1. Транспортний адаптер для каналу.
2. Набір сценаріїв, що перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` керує спільною механікою хоста:

- кореневим простором команд `openclaw qa`
- запуском і завершенням suite
- concurrency workers
- записом artifacts
- генерацією report
- виконанням сценаріїв
- aliases сумісності для старіших сценаріїв `qa-channel`

Runner plugins керують транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcripts і нормалізований стан транспорту
- як виконуються дії, що спираються на транспорт
- як обробляється скидання або очищення, специфічне для транспорту

Мінімальна планка впровадження для нового каналу така:

1. Зберігайте `qa-lab` як власника спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Залишайте транспортно-специфічну механіку всередині runner Plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючу кореневу команду.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Залишайте `runtime-api.ts` легким; ледаче виконання CLI і runner має залишатися за окремими entrypoints.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні scenario helpers для нових сценаріїв.
7. Зберігайте робочі aliases сумісності, якщо тільки репозиторій не виконує навмисну міграцію.

Правило прийняття рішень суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспортного каналу, залишайте її в цьому runner Plugin або harness Plugin.
- Якщо сценарію потрібна нова можливість, яку може використати більше ніж один канал, додайте загальний helper замість канально-специфічної гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій транспортно-специфічним і явно зазначайте це в контракті сценарію.

Рекомендовані назви загальних helpers для нових сценаріїв:

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

Нова робота над каналами має використовувати загальні назви helpers.
Aliases сумісності існують, щоб уникнути міграції «в один день», а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Думайте про набори як про «зростаючий реалізм» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Config: запуски без націлювання використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у конфіги для окремих проєктів для паралельного планування
- Файли: core/unit inventory у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelist node-тести `ui`, які покриває `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (auth gateway, маршрутизація, tooling, parsing, config)
  - Детерміновані regressions для відомих bugs
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
    <AccordionGroup>
    <Accordion title="Проєкти, shards і scoped lanes"> - Запуск `pnpm test` без націлювання використовує дванадцять менших shard-конфігів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу root-project. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати незв’язані suites. - `pnpm test --watch` як і раніше використовує нативний граф проєктів root `vitest.config.ts`, оскільки цикл watch з багатьма shards непрактичний. - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу маршрутизують явні цілі file/directory через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project. - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff торкається лише routable source/test files; редагування config/setup все ще повертаються до широкого повторного запуску root-project. - `pnpm check:changed` — це звичайний розумний локальний gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні lanes typecheck/lint/test. Зміни в публічному Plugin SDK і plugin-contract включають один прохід валідації extension, бо extensions залежать від цих core contracts. Лише version bumps у release metadata запускають цільові перевірки version/config/root-dependency замість повного suite, із guard, що відхиляє зміни package поза полем version верхнього рівня. - Легкі за імпортами unit-тести з agents, commands, plugins, helpers auto-reply, `plugin-sdk` і подібних чистих утилітних ділянок маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes. - Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють запуски changed-mode з явними sibling-тестами в цих легких lanes, тож редагування helpers уникають повторного запуску повного важкого suite для цього каталогу. - `auto-reply` має три окремі buckets: helpers core верхнього рівня, integration-тести `reply.*` верхнього рівня і піддерево `src/auto-reply/reply/**`. Це не дає найважчій роботі harness reply потрапляти на дешеві тести status/chunk/token.
    </Accordion>

      <Accordion title="Покриття embedded runner">
        - Коли ви змінюєте discovery inputs інструмента повідомлень або runtime
          контекст Compaction, зберігайте обидва рівні покриття.
        - Додавайте сфокусовані helper regressions для меж чистої маршрутизації та нормалізації.
        - Підтримуйте здоровими integration suites embedded runner:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Ці suites перевіряють, що scoped ids і поведінка Compaction все ще проходять
          через реальні шляхи `run.ts` / `compact.ts`; тести лише на helpers не є
          достатньою заміною для цих integration-шляхів.
      </Accordion>

      <Accordion title="Типові значення pool та ізоляції Vitest">
        - Базовий config Vitest за замовчуванням використовує `threads`.
        - Спільний config Vitest фіксує `isolate: false` і використовує
          non-isolated runner у root projects, конфігах e2e і live.
        - Root UI lane зберігає своє налаштування `jsdom` й optimizer, але теж працює на
          спільному non-isolated runner.
        - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільного config Vitest.
        - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node-процесів Vitest,
          щоб зменшити churn компіляції V8 під час великих локальних запусків.
          Задайте `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
          поведінкою V8.
      </Accordion>

      <Accordion title="Швидка локальна ітерація">
        - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
        - Pre-commit hook виконує лише форматування. Він
          повторно додає відформатовані файли до staging і
          не запускає lint, typecheck або тести.
        - Запускайте `pnpm check:changed` явно перед передачею або push, коли
          вам потрібен розумний локальний gate. Зміни в публічному Plugin SDK і plugin-contract
          включають один прохід валідації extension.
        - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи
          чисто відображаються на менший suite.
        - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
          лише з вищим лімітом workers.
        - Автомасштабування локальних workers навмисно консервативне й зменшує навантаження,
          коли середнє навантаження хоста вже високе, тож кілька одночасних
          запусків Vitest за замовчуванням завдають менше шкоди.
        - Базовий config Vitest позначає проєкти/файли config як
          `forceRerunTriggers`, щоб повторні запуски changed-mode залишалися коректними, коли змінюється wiring тестів.
        - Config зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
          хостах; задайте `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
          одну явну локацію cache для прямого профілювання.
      </Accordion>

      <Accordion title="Налагодження продуктивності">
        - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпорту плюс
          вивід розбивки імпортів.
        - `pnpm test:perf:imports:changed` звужує той самий профільований вигляд до
          файлів, змінених відносно `origin/main`.
        - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
          тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
          мокайте цей seam напряму, замість глибокого імпорту runtime helpers лише
          для того, щоб передати їх через `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
          `test:changed` з нативним шляхом root-project для цього закоміченого diff і
          виводить wall time плюс macOS max RSS.
        - `pnpm test:perf:changed:bench -- --worktree` вимірює поточне
          брудне дерево, маршрутизуючи список змінених файлів через
          `scripts/test-projects.mjs` і root config Vitest.
        - `pnpm test:perf:profile:main` записує CPU profile головного потоку для
          накладних витрат запуску/трансформації Vitest/Vite.
        - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
          unit suite з вимкненим файловим паралелізмом.
      </Accordion>
    </AccordionGroup>

### Stability (gateway)

- Команда: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Пропускає синтетичне навантаження повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Опитує `diagnostics.stability` через WS RPC Gateway
  - Покриває helpers збереження bundle діагностичної стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS не перевищують budget тиску, а глибини черг по сесіях повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшої роботи над regression стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Типові значення runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних workers (CI: до 2, локально: 1 за замовчуванням).
  - Працює в silent mode за замовчуванням, щоб зменшити накладні витрати консолі I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` — примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` — знову ввімкнути докладний консольний вивід.
- Обсяг:
  - Наскрізна поведінка кількох екземплярів gateway
  - Поверхні WebSocket/HTTP, pairing Node і важче мережеве навантаження
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє поведінку файлової системи remote-canonical через bridge fs sandbox
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` — увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` — вказати нестандартний бінарний файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (задає `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи працює цей provider/model _сьогодні_ з реальними creds?»
  - Виявлення змін формату провайдера, особливостей виклику tools, проблем auth і поведінки rate limit
- Очікування:
  - За задумом нестабільні для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштують грошей / використовують rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API keys.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Задавайте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно хочете, щоб live tests використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він залишає вивід прогресу `[live] ...`, але приховує додаткове повідомлення `~/.profile` і приглушує журнали bootstrap gateway/шум Bonjour. Задайте `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові журнали.
- Ротація API key (для окремих провайдерів): задайте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби після відповідей rate limit.
- Вивід progress/heartbeat:
  - Live suites тепер виводять рядки прогресу в stderr, тож під час довгих викликів провайдера видно, що вони активні, навіть коли захоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу provider/gateway одразу транслювалися під час live-запусків.
  - Налаштовуйте heartbeat прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змін було багато)
- Зміни в мережевій частині gateway / протоколі WS / pairing: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / збоїв конкретного провайдера / викликів tools: запускайте звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live matrix моделей, smoke-тестів CLI backend, smoke ACP, harness
app-server Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Testing — live suites](/uk/help/testing-live).

## Docker runners (необов’язкові перевірки «працює в Linux»)

Ці Docker runners поділяються на дві категорії:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл за profile-key всередині Docker image репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і використовують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoints — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners за замовчуванням використовують менший ліміт smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` за замовчуванням має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням має `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для двох Docker lanes live. Він також збирає один спільний image `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для контейнерних smoke runners E2E, які перевіряють зібраний застосунок.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker runners для live-model також bind-mount лише потрібні CLI auth homes (або всі підтримувані, якщо запуск не звужений), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати tokens, не змінюючи auth store хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke Open WebUI live: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke онбордингу/каналу/агента через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref плюс Telegram за замовчуванням, перевіряє, що ввімкнення Plugin встановлює його runtime deps на вимогу, запускає doctor і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольований home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers, а не зависає. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker smoke інсталятора: `bash scripts/test-install-sh-docker.sh` використовує один спільний npm cache для контейнерів root, update і direct-npm. Update smoke за замовчуванням використовує npm `latest` як стабільну baseline перед оновленням до tarball кандидата. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи cache, створені root, не приховували поведінку локального встановлення користувача. Задайте `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm у локальних повторних запусках.
- Install Smoke CI пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібно покриття прямого `npm install -g`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальний regression для OpenAI Responses web_search з minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення schema провайдера й перевіряє, що необроблена деталь з’являється в журналах Gateway.
- Міст каналу MCP (seeded Gateway + stdio bridge + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP у Pi bundle (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP для Cron/subagent (реальний Gateway + teardown дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + alias `/plugin` + семантика restart bundle Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps bundled Plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий Docker runner image, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть host rebuild після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Звужуйте runtime deps bundled Plugin під час ітерації, вимикаючи незв’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний built-app image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретного suite, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо їх задано. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти виконують його pull, якщо його ще немає локально. QR- і installer-тести Docker зберігають власні Dockerfiles, оскільки вони перевіряють поведінку package/install, а не спільний built-app runtime.

Docker runners для live-model також bind-mount поточний checkout лише для читання і
розміщують його в тимчасовому workdir усередині контейнера. Це дозволяє тримати runtime
image компактним, водночас запускаючи Vitest точно проти вашого локального source/config.
Крок staging пропускає великі локальні caches і результати збірки застосунку, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунку каталоги `.build` або
Gradle output, щоб Docker live-запуски не витрачали хвилини на копіювання
machine-specific artifacts.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальні workers каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити покриття gateway
live з цього Docker lane.
`test:docker:openwebui` — це smoke перевірка сумісності вищого рівня: вона запускає
контейнер gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoints,
запускає закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати pull image
Open WebUI, а сам Open WebUI — завершити власне cold-start налаштування.
Цей lane очікує придатний live model key, і `OPENCLAW_PROFILE_FILE`
(за замовчуванням `~/.profile`) є основним способом надати його в Dockerized runs.
Успішні запуски виводять невеликий JSON payload на зразок `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway
container, стартує другий container, що запускає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання transcript, метадані вкладень,
поведінку черги live events, маршрутизацію вихідного надсилання і сповіщення у стилі Claude про канал +
дозволи через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо інспектує необроблені кадри stdio MCP, тож smoke перевіряє те, що міст
справді виводить, а не лише те, що випадково відображає певний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує
live model key. Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей server через embedded Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke для ACP thread природною мовою (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflows regression/debug. Він може знову знадобитися для перевірки маршрутизації ACP thread, тож не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і підключається перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевірити лише env vars, підключені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без зовнішніх монтувань CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли CLI auth під `$HOME` монтуються лише для читання в `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний image `openclaw:local-live` для повторних запусків без потреби в перебудові
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що creds походять зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt для перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений tag image Open WebUI

## Перевірка docs

Після редагування docs запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн regression (безпечно для CI)

Це regressions «реального pipeline» без реальних провайдерів:

- Виклик tools через Gateway (змоканий OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + примусове застосування auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Agent reliability evals (Skills)

У нас уже є кілька безпечних для CI тестів, що поводяться як «agent reliability evals»:

- Змоканий виклик tools через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють wiring сесії та ефекти config (`src/gateway/gateway.test.ts`).

Що ще відсутнє для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли Skills перелічено в prompt, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Compliance:** чи читає агент `SKILL.md` перед використанням і чи дотримується обов’язкових кроків/args?
- **Workflow contracts:** багатохідні сценарії, що перевіряють порядок tools, перенесення історії сесії та межі sandbox.

Майбутні evals мають спершу залишатися детермінованими:

- Runner сценаріїв на базі mock providers для перевірки викликів tools + їх порядку, читання Skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, сфокусованих на Skills (використати чи уникнути, gating, prompt injection).
- Необов’язкові live evals (явне ввімкнення, керування через env) лише після того, як буде готовий безпечний для CI набір.

## Contract tests (форма Plugin і каналу)

Contract tests перевіряють, що кожен зареєстрований Plugin і канал відповідає
своєму interface contract. Вони проходять усі виявлені plugins і запускають набір перевірок
форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці shared seam і smoke files; запускайте contract-команди явно,
коли змінюєте спільні поверхні channel або provider.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише contracts каналів: `pnpm test:contracts:channels`
- Лише contracts провайдерів: `pnpm test:contracts:plugins`

### Contracts каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Contract майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID thread
- **directory** - API каталогу/списку
- **group-policy** - Застосування group policy

### Contracts статусу провайдера

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Status probes каналів
- **registry** - Форма registry Plugin

### Contracts провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract потоку auth
- **auth-choice** - Вибір/відбір auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/interface Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни exports або subpaths у plugin-sdk
- Після додавання або зміни Plugin каналу чи провайдера
- Після рефакторингу реєстрації Plugin або discovery

Contract tests запускаються в CI і не потребують реальних API keys.

## Додавання regressions (настанови)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додайте безпечний для CI regression, якщо це можливо (mock/stub provider або захоплення точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), залишайте live test вузьким і з явним увімкненням через env vars
- Віддавайте перевагу найменшому шару, який виявляє bug:
  - bug перетворення/повторення запиту провайдера → прямий models test
  - bug у pipeline сесії/історії/tools gateway → live smoke gateway або безпечний для CI mock-тест gateway
- Guardrail для обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef з метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id із сегментами обходу відхиляються.
  - Якщо ви додаєте нову родину цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою на некласифікованих target id, щоб нові класи не можна було пропустити непомітно.
