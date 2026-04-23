---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-23T04:24:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f965b3d818730c7c58125a29f7cc2508a45aba6c7534b7f13755380dedcef66
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів.

Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює)
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресії для реальних проблем моделей/провайдерів

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл watch у Vitest: `pnpm test:watch`
- Пряме націлення на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією проблемою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-лінія на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (зонди моделей + інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Cost smoke для Moonshot/Kimi: коли встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6, а
  транскрипт помічника зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один проблемний випадок, віддавайте перевагу звуженню live-тестів через env-змінні allowlist, описані нижче.

## QA-специфічні ранери

Ці команди використовуються поруч з основними наборами тестів, коли вам потрібен реалізм qa-lab:

- `pnpm openclaw qa suite`
  - Запускає сценарії QA, що спираються на репозиторій, безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими Gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежену кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати кількість workers, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдався. Використовуйте `--allow-failures`, коли вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального покриття fixture і protocol-mock без заміни сценарно-орієнтованої лінії `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA-входи автентифікації, які практично використовувати в гостьовому середовищі:
    ключі провайдера через env, шлях до конфігурації QA live provider та `CODEX_HOME`, якщо він є.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гість міг записувати назад через змонтований workspace.
  - Записує звичайний QA-звіт + підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    зі сконфігурованим OpenAI, а потім вмикає bundled channel/plugins через
    редагування config.
  - Перевіряє, що виявлення setup залишає невідсутніми лише не налаштовані runtime dependencies Plugin, що перший налаштований запуск Gateway або doctor встановлює runtime dependencies кожного bundled Plugin на вимогу, і що другий restart не перевстановлює dependencies, які вже були активовані.
  - Також встановлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що doctor кандидата після оновлення відновлює runtime dependencies bundled channel без відновлення postinstall з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA-лінію проти тимчасового Docker-backed homeserver Tuwunel.
  - Цей QA-хост наразі призначений лише для repo/dev. У пакетованих інсталяціях OpenClaw `qa-lab` не постачається, тому вони не надають `openclaw qa`.
  - Checkouts репозиторію завантажують bundled runner напряму; окремий крок встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway із реальним Matrix Plugin як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки ця лінія локально створює тимчасових користувачів.
  - Записує Matrix QA-звіт, підсумок, артефакт observed-events і комбінований журнал виводу stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA-лінію проти реальної приватної групи, використовуючи driver і SUT bot tokens з env.
  - Потрібні `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID групи має бути числовим ID чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулів облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдався. Використовуйте `--allow-failures`, коли вам потрібні артефакти без коду завершення з помилкою.
  - Потрібні два різні боти в одній приватній групі, при цьому бот SUT має мати username Telegram.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати трафік ботів у групі.
  - Записує Telegram QA-звіт, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`.

Live transport lines спільно використовують один стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним QA-набором і не входить до матриці покриття live transport.

| Лінія    | Canary | Gating згадок | Блок allowlist | Відповідь верхнього рівня | Відновлення після restart | Подальша взаємодія в потоці | Ізоляція потоку | Спостереження за реакціями | Команда help |
| -------- | ------ | ------------- | --------------- | ------------------------- | ------------------------- | --------------------------- | --------------- | -------------------------- | ------------ |
| Matrix   | x      | x             | x               | x                         | x                         | x                           | x               | x                          |              |
| Telegram | x      |               |                 |                           |                           |                             |                 |                            | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну lease із пулу на базі Convex, надсилає Heartbeat
цієї lease під час роботи лінії та звільняє lease під час завершення.

Базовий scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env-змінні:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (`ci` у CI, інакше `maintainer`)

Необов’язкові env-змінні:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

У нормальному режимі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Команди адміністрування maintainer (додавання/видалення/перелік пулу) вимагають
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для machine-readable виводу в скриптах і CI-утилітах.

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
- `groupId` має бути рядком із числовим ID чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректний payload.

### Додавання channel до QA

Додавання channel до markdown QA-системи вимагає рівно двох речей:

1. Транспортний адаптер для channel.
2. Набір сценаріїв, що перевіряє контракт channel.

Не додавайте новий корінь команди верхнього рівня для QA, якщо спільний хост `qa-lab`
може володіти цим потоком.

`qa-lab` володіє спільною механікою хоста:

- коренем команди `openclaw qa`
- запуском і завершенням набору
- concurrency workers
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- alias сумісності для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway конфігурується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований транспортний стан
- як виконуються дії на базі транспорту
- як обробляється reset або cleanup, специфічний для транспорту

Мінімальна планка впровадження для нового channel така:

1. Зберігайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний runner на спільному host seam `qa-lab`.
3. Зберігайте специфічну для транспорту механіку всередині runner Plugin або harness channel.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Зберігайте `runtime-api.ts` легким; ліниве виконання CLI і runner має залишатися за окремими entrypoints.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні scenario helpers для нових сценаріїв.
7. Зберігайте наявні alias сумісності працездатними, якщо тільки репозиторій не виконує навмисну міграцію.

Правило прийняття рішень суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту channel, зберігайте її в цьому runner Plugin або harness Plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один channel, додайте загальний helper замість channel-специфічної гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, зберігайте сценарій специфічним для цього транспорту і явно відображайте це в контракті сценарію.

Бажані назви загальних helper для нових сценаріїв:

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

Alias сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Для нової роботи з channel слід використовувати загальні назви helper.
Alias сумісності існують, щоб уникнути міграції в стилі flag day, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Думайте про набори як про «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: десять послідовних shard-запусків (`vitest.full-*.config.ts`) по наявних scoped Vitest projects
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelisted node-тести `ui`, охоплені `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Внутрішньопроцесні integration-тести (автентифікація Gateway, маршрутизація, tooling, parsing, config)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка про projects:
  - Нетаргетований `pnpm test` тепер запускає одинадцять менших shard-конфігурацій (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project process. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
  - `pnpm test --watch` як і раніше використовує native root `vitest.config.ts` project graph, тому що multi-shard watch loop непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі file/directory через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff торкається лише routable source/test файлів; редагування config/setup все ще повертаються до широкого повторного запуску root-project.
  - `pnpm check:changed` — це звичайний smart локальний gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні typecheck/lint/test lanes. Зміни публічного Plugin SDK і plugin-contract включають перевірку extension, оскільки extensions залежать від цих core-контрактів. Оновлення лише release metadata із version bumps запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, що відхиляє зміни package поза полем version верхнього рівня.
  - Unit-тести з легкими імпортами з agents, commands, plugins, helpers auto-reply, `plugin-sdk` та подібних суто утилітних областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
  - Вибрані helper source-файли `plugin-sdk` і `commands` також прив’язують changed-mode запуски до явних sibling tests у цих легких lanes, тому зміни helper уникають повторного запуску повного важкого набору для цього каталогу.
  - `auto-reply` тепер має три окремі buckets: helpers core верхнього рівня, integration-тести `reply.*` верхнього рівня та піддерево `src/auto-reply/reply/**`. Це не дає найважчій роботі harness reply потрапляти на дешеві тести status/chunk/token.
- Примітка про embedded runner:
  - Коли ви змінюєте входи виявлення message-tool або runtime context Compaction,
    зберігайте обидва рівні покриття.
  - Додавайте цільові helper-регресії для суто меж маршрутизації/нормалізації.
  - Також підтримуйте integration-набори embedded runner у здоровому стані:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped id та поведінка Compaction все ще проходять
    через реальні шляхи `run.ts` / `compact.ts`; тести лише на helper
    не є достатньою заміною для цих integration-шляхів.
- Примітка про pool:
  - Базова конфігурація Vitest тепер за замовчуванням використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує non-isolated runner у root projects, e2e і live configs.
  - Root UI lane зберігає свої `jsdom` setup та optimizer, але тепер теж працює на спільному non-isolated runner.
  - Кожен shard `pnpm test` успадковує ті самі значення `threads` + `isolate: false` за замовчуванням зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також за замовчуванням додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо потрібно порівняти зі стандартною поведінкою V8.
- Примітка про швидкі локальні ітерації:
  - `pnpm changed:lanes` показує, які архітектурні lanes активує diff.
  - Pre-commit hook запускає `pnpm check:changed --staged` після staged formatting/linting, тому core-only commits не платять вартість extension tests, якщо не торкаються публічних контрактів, орієнтованих на extensions. Коміти лише з release metadata залишаються на цільовій lane version/config/root-dependency.
  - `pnpm test:changed` маршрутизується через scoped lanes, коли змінені шляхи чисто зіставляються з меншим набором.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим лімітом workers.
  - Автомасштабування локальних workers тепер навмисно консервативне й також знижує навантаження, коли середнє навантаження хоста вже високе, тому кілька одночасних запусків Vitest за замовчуванням завдають менше шкоди.
  - Базова конфігурація Vitest позначає projects/config files як `forceRerunTriggers`, щоб повторні changed-mode запуски залишалися коректними, коли змінюється wiring тестів.
  - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого профілювання.
- Примітка про налагодження продуктивності:
  - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс вивід розподілу імпортів.
  - `pnpm test:perf:imports:changed` обмежує той самий профільний вигляд файлами, зміненими від `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` з native root-project path для цього закоміченого diff і виводить wall time плюс macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного брудного дерева, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і root-конфігурацію Vitest.
  - `pnpm test:perf:profile:main` записує main-thread CPU profile для накладних витрат запуску та transform у Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для unit-набору з вимкненим файловим parallelism.

### Stability (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою за замовчуванням діагностикою
  - Проганяє синтетичне churn повідомлень gateway, пам’яті та великих payload через шлях подій діагностики
  - Виконує запит `diagnostics.stability` через WS RPC Gateway
  - Охоплює helper персистентності bundle діагностичної стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS залишаються нижче бюджету тиску, а глибина черг на сесію знову знижується до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька lane для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (Gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Параметри runtime за замовчуванням:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує adaptive workers (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в silent mode, щоб зменшити накладні витрати console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути докладний вивід у console.
- Обсяг:
  - End-to-end поведінка Gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, pairing Node і важчі мережеві сценарії
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Має більше рухомих частин, ніж unit-тести (може бути повільнішим)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не є частиною стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний бінарний файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей tool-calling, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / витрачає rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски читають `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють config/auth-матеріали до тимчасового test home, щоб unit-fixtures не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням використовує тихіший режим: він зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає логи запуску gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете знову бачити повні стартові логи.
- Ротація API-ключів (специфічна для провайдера): установіть `*_API_KEYS` у форматі comma/semicolon або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або використайте перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід progress/Heartbeat:
  - Live-набори тепер виводять рядки прогресу до stderr, щоб було видно, що довгі виклики провайдера активні, навіть коли захоплення console у Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення console у Vitest, тому рядки прогресу провайдера/gateway транслюються негайно під час live-запусків.
  - Налаштуйте Heartbeat для прямої моделі через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте таку таблицю рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Зміни в мережевій взаємодії Gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / збоїв, специфічних для провайдера / tool calling: запускайте звужений `pnpm test:live`

## Live: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку зараз рекламує** підключений Android Node, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює, не запускає і не pair застосунок).
  - Перевірка `node.invoke` Gateway покомандно для вибраного Android Node.
- Необхідна попередня підготовка:
  - Android-застосунок уже підключено та pair з gateway.
  - Застосунок залишається на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделей (ключі профілів)

Live-тести поділено на два рівні, щоб можна було ізолювати збої:

- «Пряма модель» показує, чи здатен провайдер/модель взагалі відповідати з наданим ключем.
- «Gateway smoke» показує, чи працює повний конвеєр gateway+agent для цієї моделі (сесії, історія, tools, політика sandbox тощо).

### Рівень 1: пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике completion для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, alias для modern), щоб справді запустити цей набір; інакше він буде пропущений, щоб `pnpm test:live` залишався зосередженим на Gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це alias для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (comma allowlist)
  - Для modern/all sweep за замовчуванням використовується curated high-signal cap; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern sweep або додатне число для меншого ліміту.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (comma allowlist)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і env-fallbacks
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламаний / ключ недійсний» від «конвеєр Gateway agent зламаний»
  - Містить невеликі ізольовані регресії (приклад: повторне відтворення reasoning у OpenAI Responses/Codex Responses + потоки tool-call)

### Рівень 2: Gateway + smoke dev agent (те, що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process gateway
  - Створити/оновити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі з ключами та перевіряти:
    - «змістовну» відповідь (без tools)
    - роботу реального виклику tool (read probe)
    - необов’язкові додаткові probes tools (exec+read probe)
    - що шляхи регресій OpenAI (лише tool-call → follow-up) продовжують працювати
- Деталі probe (щоб ви могли швидко пояснювати збої):
  - `read` probe: тест записує nonce-файл у workspace і просить agent `read` його та повернути nonce.
  - `exec+read` probe: тест просить agent записати nonce у тимчасовий файл через `exec`, а потім зчитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
- Як вибирати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це alias для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або comma list), щоб звузити вибір
  - Для modern/all gateway sweep за замовчуванням використовується curated high-signal cap; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern sweep або додатне число для меншого ліміту.
- Як вибирати провайдерів (уникнути «усе OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (comma allowlist)
- Tool + image probes у цьому live-тесті завжди ввімкнені:
  - `read` probe + `exec+read` probe (навантаження на tools)
  - image probe запускається, коли модель оголошує підтримку image input
  - Потік (високий рівень):
    - Тест генерує крихітний PNG з «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent пересилає multimodal user message до моделі
    - Перевірка: відповідь містить `cat` + код (толерантність OCR: незначні помилки допускаються)

Порада: щоб побачити, що можна тестувати на вашій машині (і точні id `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI backend (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent, використовуючи локальний CLI backend, не торкаючись вашої конфігурації за замовчуванням.
- Значення smoke за замовчуванням для конкретного backend розміщено у визначенні `cli-backend.ts` extension-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значення за замовчуванням:
  - Провайдер/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image походить із метаданих Plugin CLI backend-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення зображення (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як CLI args замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання args зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути стандартний probe безперервності тієї самої сесії Claude Sonnet -> Opus (установіть `1`, щоб примусово ввімкнути його, коли вибрана модель підтримує ціль перемикання).

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

- Docker runner розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke CLI-backend усередині образу Docker репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані smoke CLI із extension-власника, а потім встановлює відповідний Linux CLI package (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований доступний для запису префікс `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує portable OAuth підписки Claude Code через або `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім виконує два ходи Gateway CLI-backend без збереження env-змінних API-ключа Anthropic. Ця лінія підписки за замовчуванням вимикає probes Claude MCP/tool і image, оскільки Claude наразі маршрутизує використання сторонніх застосунків через додаткову оплату usage замість звичайних лімітів плану підписки.
- Live smoke CLI-backend тепер перевіряє той самий end-to-end потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик tool MCP `cron`, перевірений через CLI gateway.
- Стандартний smoke Claude також оновлює сесію із Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язки розмови ACP з live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайний follow-up у цій самій розмові
  - перевірити, що follow-up потрапляє в transcript прив’язаної сесії ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Значення за замовчуванням:
  - ACP agents у Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
  - Синтетичний channel: контекст розмови у стилі Slack DM
  - ACP backend: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Примітки:
  - Ця лінія використовує поверхню gateway `chat.send` з admin-only синтетичними полями originating-route, щоб тести могли під’єднати контекст message-channel, не вдаючи зовнішню доставку.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр agent Plugin `acpx` для вибраного harness agent ACP.

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

Рецепти Docker для одного agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker runner розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він послідовно запускає ACP bind smoke для всіх підтримуваних live CLI agents: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він читає `~/.profile`, переносить відповідні auth-матеріали CLI в контейнер, встановлює `acpx` у доступний для запису npm prefix, а потім встановлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker runner встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера з прочитаного profile доступними для дочірнього harness CLI.

## Live: smoke harness app-server Codex

- Мета: перевірити harness Codex, яким володіє Plugin, через звичайний метод
  gateway `agent`:
  - завантажити bundled Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `codex/gpt-5.4`
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що потік
    app-server може відновитися
  - запустити `/codex status` і `/codex models` через той самий шлях команди
    gateway
  - необов’язково запустити два shell probes з ескалацією, перевірені Guardian: одну
    безпечну команду, яку слід схвалити, і одне фіктивне вивантаження секрету, яке має бути
    відхилене, щоб agent перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Модель за замовчуванням: `codex/gpt-5.4`
- Необов’язковий image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язковий MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язковий Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний harness Codex
  не міг пройти, тихо переключившись на PI.
- Автентифікація: `OPENAI_API_KEY` з shell/profile, а також необов’язково скопійовані
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

- Docker runner розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він читає змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює auth-файли CLI Codex, коли вони є, встановлює `@openai/codex` у доступний для запису змонтований npm prefix, переносить дерево source, а потім запускає лише live-тест harness Codex.
- У Docker probes image, MCP/tool і Guardian увімкнені за замовчуванням. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий
  налагоджувальний запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, що відповідає конфігурації live-тесту, тому fallback `openai-codex/*` або PI не може приховати регресію harness Codex.

### Рекомендовані live-рецепти

Вузькі, явні allowlist — найшвидші й найменш нестабільні:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling через кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст OAuth Antigravity (endpoint agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений у Google Gemini API через HTTP (автентифікація через API-ключ / profile); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний бінарний файл `gemini`; він має власну автентифікацію й може поводитися інакше (streaming/tool support/version skew).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» немає (live є opt-in), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний smoke-набір (tool calling + image)

Це запуск «поширених моделей», який ми очікуємо підтримувати працездатним:

- OpenAI (не Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запустіть Gateway smoke з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: tool calling (Read + необов’язковий Exec)

Виберіть принаймні одну модель з кожного сімейства провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою `tools`, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; tool calling залежить від режиму API)

### Vision: надсилання image (вкладення → multimodal message)

Додайте принаймні одну модель із підтримкою image до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Aggregators / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до live-матриці (якщо у вас є облікові дані/config):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoints): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко фіксувати в документації «всі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс наявні ключі.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знайти ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «ключі профілів» у live-тестах)
- Config: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до staged live home, якщо присутній, але це не основне сховище ключів профілів)
- Локальні live-запуски за замовчуванням копіюють активний config, файли `auth-profiles.json` для окремих агентів, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового test home; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` прибираються, щоб probes не торкалися вашого реального host workspace.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

## Deepgram live (транскрибування аудіо)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє bundled шляхи comfy image, video та `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у надсиланні workflow comfy, polling, downloads або реєстрації Plugin

## Image generation live

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований Plugin провайдера генерації image
  - Завантажує відсутні env-змінні провайдера з вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі перед збереженими auth profiles, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдерів без придатної auth/profile/model
  - Проганяє стандартні варіанти генерації image через спільну runtime capability:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні bundled провайдери, які покриваються:
  - `openai`
  - `google`
  - `xai`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний bundled шлях провайдера генерації music
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні провайдера з вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі перед збереженими auth profiles, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдерів без придатної auth/profile/model
  - Запускає обидва оголошені runtime modes, коли вони доступні:
    - `generate` з вхідними даними лише через prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної лінії:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний bundled шлях провайдера генерації video
  - За замовчуванням використовує безпечний для релізу smoke-шлях: провайдери без FAL, один запит text-to-video на провайдера, односекундний prompt про lobster і ліміт операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці провайдера може домінувати над часом релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб явно запустити його
  - Завантажує env-змінні провайдера з вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі перед збереженими auth profiles, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell credentials
  - Пропускає провайдерів без придатної auth/profile/model
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими transform, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальний image input на основі buffer у спільному sweep
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальний video input на основі buffer у спільному sweep
  - Поточні оголошені, але пропущені провайдери `imageToVideo` у спільному sweep:
    - `vydra`, оскільки bundled `veo3` підтримує лише текст, а bundled `kling` вимагає віддалений image URL
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс лінію `kling`, яка за замовчуванням використовує fixture з віддаленим image URL
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільному sweep:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи зараз вимагають віддалені reference URL `http(s)` / MP4
    - `google`, оскільки поточна спільна лінія Gemini/Veo використовує локальні вхідні дані на основі buffer, і цей шлях не приймається у спільному sweep
    - `openai`, оскільки поточна спільна лінія не гарантує доступ до video inpaint/remix, специфічний для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до стандартного sweep, зокрема FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції кожного провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори image, music і video через один native entrypoint репозиторію
  - Автоматично завантажує відсутні env-змінні провайдера з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну auth
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і quiet mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Live-model ранери: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл ключів профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і читають `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoints: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери за замовчуванням використовують менший smoke-ліміт, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох Docker-ліній live.
- Smoke-ранери контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools` і `test:docker:plugins` піднімають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-model також bind-mount лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у home контейнера перед запуском, щоб зовнішній OAuth CLI міг оновлювати токени, не змінюючи auth store хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Міст каналу MCP (seeded Gateway + stdio bridge + raw smoke кадру сповіщення Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP комплекту Pi (реальний stdio MCP server + embedded smoke allow/deny профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + teardown дочірнього stdio MCP після ізольованого Cron і одноразових запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + alias `/plugin` + семантика restart комплекту Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Runtime dependencies bundled Plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий Docker-образ runner, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте образ з `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть повторну збірку на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Звужуйте runtime dependencies bundled Plugin під час ітерації, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Docker-ранери live-model також bind-mount поточний checkout у режимі лише для читання й
переносять його до тимчасового workdir усередині контейнера. Це дозволяє зберігати
runtime-образ компактним і водночас запускати Vitest точно на вашому локальному source/config.
Крок перенесення пропускає великі локальні кеші й результати збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probes Gateway не запускали
реальні workers channel Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити Gateway
live-покриття з цієї Docker-лінії.
`test:docker:openwebui` — це smoke вищого рівня на сумісність: він запускає
контейнер gateway OpenClaw з увімкненими OpenAI-сумісними HTTP endpoint,
запускає pinned контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
образу Open WebUI, а Open WebUI може потребувати завершення власного cold-start налаштування.
Ця лінія очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway
container, запускає другий container, який стартує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання transcript, метадані attachment,
поведінку черги live events, маршрутизацію вихідного надсилання та сповіщення в стилі Claude про channel +
дозволи через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо аналізує сирі stdio MCP frames, тому smoke перевіряє те, що
міст справді випромінює, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує ключа
live-моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей server через embedded runtime MCP комплекту Pi,
виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа
live-моделі. Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований хід Cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і читається перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, прочитані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні CLI auth-каталоги/файли в `$HOME` монтуються лише для читання в `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначення вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або comma list на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані беруться зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити pinned tag образу Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли вам також потрібна перевірка заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Tool calling Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + примусову auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- End-to-end потоки майстра, які перевіряють прив’язку сесії та ефекти config (`src/gateway/gateway.test.ts`).

Що ще відсутнє для Skills (див. [Skills](/uk/tools/skills)):

- **Вибір рішення:** коли Skills перелічено в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/args?
- **Контракти робочих процесів:** багатокрокові сценарії, які перевіряють порядок tools, перенесення історії сесії та межі sandbox.

Майбутні оцінювання мають спочатку залишатися детермінованими:

- Runner сценаріїв з mock providers для перевірки викликів tools + їх порядку, читання skill-файлів і прив’язки сесії.
- Невеликий набір сценаріїв, сфокусованих на Skills (використати чи уникнути, gating, injection у prompt).
- Необов’язкові live-оцінювання (opt-in, керовані через env) лише після того, як безпечний для CI набір буде готовий.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
контракту інтерфейсу. Вони ітерують усі виявлені plugins і запускають набір перевірок
форми та поведінки. Unit-лінія `pnpm test` за замовчуванням навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API directory/roster
- **group-policy** - Примусове застосування group policy

### Контракти status provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probes status channel
- **registry** - Форма реєстру Plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/selection auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни Plugin channel чи provider
- Після рефакторингу реєстрації Plugin або виявлення

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додайте безпечну для CI регресію, якщо це можливо (mock/stub provider або захоплення точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому рівню, який ловить баг:
  - баг перетворення/відтворення запиту provider → тест прямих моделей
  - баг конвеєра gateway session/history/tool → Gateway live smoke або безпечний для CI mock-тест gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегмента обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою на некласифікованих target id, щоб нові класи не можна було тихо пропустити.
