---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для багів моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, Docker runners і що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-23T06:44:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb3c7e0644b66e5ca8bce51ec52e874ac8c1dfe02193afa3b34d5e6b5e8a355
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

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл watch для Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- QA site на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + gateway probes для інструментів/зображень): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Cost smoke для Moonshot/Kimi: із заданим `MOONSHOT_API_KEY` виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON показує Moonshot/K2.6, а
  transcript асистента зберігає нормалізований `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, звужуйте live-тести через env-змінні allowlist, описані нижче.

## QA-орієнтовані runners

Ці команди використовуються поряд з основними тестовими наборами, коли вам потрібен реалізм qa-lab:

CI запускає QA Lab в окремих workflows. `Parity gate` запускається для відповідних PR і
через ручний запуск із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний запуск із mock parity gate, live Matrix lane і
live Telegram lane під керуванням Convex як паралельні jobs. `OpenClaw Release Checks`
запускає ті самі lanes перед схваленням release.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежується
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішого serial lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдався. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття через fixture і protocol-mock без заміни сценарно-орієнтованого
    lane `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA всередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані входи автентифікації QA, які практично
    використовувати в гостьовій системі:
    ключі провайдерів через env, шлях до конфігурації live-провайдера QA і `CODEX_HOME`, якщо він заданий.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний звіт QA + summary, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA site на базі Docker для операторського QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивний onboarding з ключем OpenAI API, налаштовує Telegram
    за замовчуванням, перевіряє, що ввімкнення plugin встановлює runtime-залежності за потреби,
    запускає doctor і виконує один локальний хід агента проти змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий
    lane пакетованого встановлення з Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточний build OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані channel/plugins через редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає runtime-залежності не налаштованих
    plugin відсутніми, перший налаштований запуск Gateway або doctor встановлює runtime-залежності
    кожного вбудованого plugin за потреби, а другий перезапуск не перевстановлює
    залежності, які вже були активовані.
  - Також встановлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що
    post-update doctor кандидата відновлює runtime-залежності вбудованих каналів без
    додаткового postinstall-виправлення з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA host сьогодні доступний лише для repo/dev. Пакетовані встановлення OpenClaw не постачають
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout репозиторію завантажують вбудований runner безпосередньо; окремий крок встановлення plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки lane локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, summary, артефакт observed-events і комбінований журнал stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулованих облікових даних. Типово використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдався. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних bot в одній приватній групі, при цьому bot SUT має мати username Telegram.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode в `@BotFather` для обох bot і переконайтеся, що driver bot може спостерігати bot-трафік у групі.
  - Записує звіт Telegram QA, summary і артефакт observed-messages у `.artifacts/qa-e2e/...`.

Live transport lanes використовують один стандартний контракт, щоб нові транспорти не дрейфували:

`qa-channel` залишається широким синтетичним набором QA і не входить до матриці покриття live transport.

| Lane     | Canary | Обмеження за згадуванням | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальші дії в гілці | Ізоляція гілок | Спостереження за реакціями | Команда help |
| -------- | ------ | ------------------------ | -------------------- | ------------------------- | ----------------------------- | -------------------- | -------------- | -------------------------- | ------------ |
| Matrix   | x      | x                        | x                    | x                         | x                             | x                    | x              | x                          |              |
| Telegram | x      |                          |                      |                           |                               |                      |                |                            | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для
`openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), QA lab отримує ексклюзивну lease із пулу на базі Convex, надсилає Heartbeat
для цієї lease під час роботи lane і звільняє lease під час завершення.

Шаблон референсного проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env-змінні:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення через env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові env-змінні:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайній роботі має використовувати `https://`.

Адміністративні команди maintainer (додати/видалити/перелічити пул) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машинозчитуваного виводу в скриптах і CI utilities.

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
- `groupId` має бути числовим рядком ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректний payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортний адаптер для каналу.
2. Набір сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний host `qa-lab`
може керувати цим процесом.

`qa-lab` відповідає за спільну механіку host:

- кореневий простір команд `openclaw qa`
- запуск і завершення suite
- concurrency workers
- запис артефактів
- генерацію звітів
- виконання сценаріїв
- aliases сумісності для старіших сценаріїв `qa-channel`

Runner plugins відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcript і нормалізований стан транспорту
- як виконуються дії, прив’язані до транспорту
- як обробляється специфічний для транспорту reset або cleanup

Мінімальний поріг для впровадження нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному шві host `qa-lab`.
3. Тримайте специфічну для транспорту механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючий кореневий command.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Тримайте `runtime-api.ts` легким; lazy CLI і виконання runner мають залишатися за окремими entrypoint.
5. Пишіть або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте generic helper для нових сценаріїв.
7. Зберігайте працездатність наявних compatibility alias, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення є суворим:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте generic helper замість channel-specific branch у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій transport-specific і явно зазначайте це в контракті сценарію.

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

Compatibility alias залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати generic helper names.
Compatibility alias існують, щоб уникнути одноразової міграції, а не як модель для
написання нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: десять послідовних shard-запусків (`vitest.full-*.config.ts`) поверх наявних scoped Vitest projects
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, що покриваються `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускаються в CI
  - Не потребують реальних ключів
  - Мають бути швидкими та стабільними
- Примітка щодо projects:
  - Ненацілений `pnpm test` тепер запускає одинадцять менших shard-конфігурацій (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project process. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
  - `pnpm test --watch` усе ще використовує native root graph проєктів `vitest.config.ts`, тому що multi-shard watch loop непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні target файлу/каталогу через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff торкається лише routable source/test files; редагування config/setup усе ще повертаються до широкого повторного запуску root-project.
  - `pnpm check:changed` — це типовий smart local gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні lanes typecheck/lint/test. Зміни публічного Plugin SDK і plugin-contract включають валідацію extensions, тому що extensions залежать від цих core contracts. Оновлення версії лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни package поза полем version верхнього рівня.
  - Import-light unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних чистих utility-областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy files залишаються на наявних lanes.
  - Вибрані helper source files `plugin-sdk` і `commands` також зіставляють запуски changed-mode з явними sibling tests у цих light lanes, тому редагування helper уникають повторного запуску повного важкого набору для цього каталогу.
  - `auto-reply` тепер має три окремі bucket: top-level core helpers, top-level integration-тести `reply.*` і піддерево `src/auto-reply/reply/**`. Це не дозволяє найважчій роботі harness для reply потрапляти на дешеві тести status/chunk/token.
- Примітка щодо embedded runner:
  - Коли ви змінюєте входи виявлення message-tool або runtime-контекст compaction,
    зберігайте обидва рівні покриття.
  - Додавайте сфокусовані helper-регресії для чистих меж routing/normalization.
  - Також підтримуйте здоровими embedded runner integration-набори:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped ids і поведінка Compaction досі проходять
    через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести не є
    достатньою заміною для цих integration-шляхів.
- Примітка щодо pool:
  - Базова конфігурація Vitest тепер типово використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує non-isolated runner в root projects, e2e і live configs.
  - Кореневий lane UI зберігає своє налаштування `jsdom` та optimizer, але тепер також працює на спільному non-isolated runner.
  - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також типово додає `--no-maglev` для дочірніх Node-process Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо потрібно порівняти зі стандартною поведінкою V8.
- Примітка щодо швидкої локальної ітерації:
  - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
  - Pre-commit hook запускає `pnpm check:changed --staged` після staged formatting/linting, тому commits лише для core не оплачують вартість extension tests, якщо не торкаються публічних extension-facing contracts. Commits лише з release metadata залишаються на цільовому lane version/config/root-dependency.
  - Якщо точний staged-набір змін уже було перевірено рівними або сильнішими gate, використовуйте `scripts/committer --fast "<message>" <files...>`, щоб пропустити лише повторний changed-scope hook. Staged format/lint усе одно запускаються. Згадайте виконані gate у handoff. Це також припустимо після повторного запуску ізольованого flaky hook failure, якщо він проходить із локальним підтвердженням.
  - `pnpm test:changed` маршрутизується через scoped lanes, коли змінені шляхи чисто мапляться на менший набір.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим лімітом workers.
  - Автомасштабування локальних workers тепер навмисно консервативне й також відступає, коли середнє навантаження хоста вже високе, тому кілька одночасних запусків Vitest за замовчуванням завдають менше шкоди.
  - Базова конфігурація Vitest позначає файли projects/config як `forceRerunTriggers`, щоб повторні запуски changed-mode лишалися коректними, коли змінюється wiring тестів.
  - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію cache для прямого profiling.
- Примітка щодо perf-debug:
  - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість import плюс вивід import-breakdown.
  - `pnpm test:perf:imports:changed` обмежує той самий профільний перегляд файлами, зміненими від `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` із native root-project path для цього committed diff і виводить wall time плюс macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` вимірює поточне dirty tree, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і root Vitest config.
  - `pnpm test:perf:profile:main` записує CPU-profile головного потоку для overhead запуску й transform Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для unit-набору з вимкненим file parallelism.

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Проганяє синтетичне churn для gateway message, memory і large-payload через діагностичний event path
  - Опитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helper збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS залишаються в межах бюджету тиску, а глибини черг на рівні сесії повертаються до нуля
- Очікування:
  - Безпечно для CI й без ключів
  - Вузький lane для подальшої роботи над регресіями стабільності, а не заміна повному набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Типові параметри середовища виконання:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує adaptive workers (CI: до 2, локально: типово 1).
  - За замовчуванням працює в silent mode, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Поведінка multi-instance gateway end-to-end
  - Поверхні WebSocket/HTTP, Node pairing і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Не потребує реальних ключів
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke для backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox з тимчасового локального Dockerfile
  - Перевіряє backend OpenShell у OpenClaw через реальні `sandbox ssh-config` + виконання через SSH
  - Перевіряє remote-canonical поведінку файлової системи через bridge fs sandbox
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфіг: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих plugin у `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - «Чи справді цей provider/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявляти зміни формату provider, особливості виклику інструментів, проблеми автентифікації та поведінку обмежень швидкості
- Очікування:
  - Навмисно не стабільно для CI (реальні мережі, реальні політики provider, квоти, збої)
  - Коштує грошей / витрачає ліміти запитів
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють конфіг/матеріали автентифікації в тимчасовий домашній каталог тесту, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- Тепер `pnpm test:live` за замовчуванням працює в тихішому режимі: зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і заглушає логи запуску Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (для конкретного provider): встановіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики provider помітно активні, навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу provider/Gateway одразу транслювалися під час live-запусків.
  - Налаштовуйте Heartbeat для прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для Gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запустіть `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтесь мережевої взаємодії Gateway / WS-протоколу / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої конкретного provider / виклик інструментів: запустіть звужений `pnpm test:live`

## Live: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, що наразі оголошена** підключеним Android Node, і перевірити поведінку контракту команд.
- Область:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює, не запускає й не виконує pairing застосунку).
  - Перевірка `node.invoke` Gateway команда за командою для вибраного Android Node.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключено й виконано pairing з Gateway.
  - Застосунок має залишатися на передньому плані.
  - Для можливостей, які ви очікуєте як успішні, мають бути надані дозволи/підтвердження захоплення.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні подробиці налаштування Android: [Android App](/uk/platforms/android)

## Live: перевірка моделей (ключі профілю)

Live-тести поділено на два рівні, щоб можна було ізолювати збої:

- «Пряма модель» показує, чи взагалі provider/модель може відповісти з наданим ключем.
- «Перевірка Gateway» показує, чи працює повний конвеєр Gateway+агента для цієї моделі (сесії, історія, інструменти, політика sandbox тощо).

### Рівень 1: пряме завершення моделлю (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel` для вибору моделей, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресійні перевірки там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб реально запустити цей набір; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на перевірці Gateway
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern` для запуску сучасного allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` є псевдонімом для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Modern/all-перевірки за замовчуванням мають курований ліміт із високим сигналом; встановіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
- Як вибирати provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: зі сховища профілів і резервних env-значень
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API provider зламаний / ключ недійсний» від «конвеєр агента Gateway зламаний»
  - Містить невеликі ізольовані регресії (приклад: повторення reasoning у OpenAI Responses/Codex Responses + потоки виклику інструментів)

### Рівень 2: перевірка Gateway + dev agent (те, що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти внутрішньопроцесний Gateway
  - Створити/оновити сесію `agent:dev:*` (із перевизначенням моделі для кожного запуску)
  - Перебрати моделі з ключами й перевірити:
    - «змістовну» відповідь (без інструментів)
    - що реальний виклик інструмента працює (read probe)
    - необов’язкові додаткові перевірки інструментів (exec+read probe)
    - що регресійні шляхи OpenAI (лише tool-call → подальший крок) продовжують працювати
- Подробиці probe (щоб ви могли швидко пояснювати збої):
  - `read` probe: тест записує nonce-файл у робочу область і просить агента `read` його та повернути nonce.
  - `exec+read` probe: тест просить агента записати nonce у тимчасовий файл через `exec`, а потім прочитати його через `read`.
  - image probe: тест прикріплює згенерований PNG (кіт + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - За замовчуванням: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є псевдонімом для сучасного allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Modern/all Gateway-перевірки за замовчуванням мають курований ліміт із високим сигналом; встановіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
- Як вибирати provider (уникайте «все через OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Перевірки інструментів і зображень у цьому live-тесті завжди увімкнені:
  - `read` probe + `exec+read` probe (навантаження інструментів)
  - image probe запускається, коли модель оголошує підтримку вхідних зображень
  - Потік (на високому рівні):
    - Тест генерує маленький PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент передає моделі мультимодальне повідомлення користувача
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки допустимі)

Порада: щоб побачити, що саме можна перевірити на вашій машині (і точні ідентифікатори `provider/model`), запустіть:

```bash
openclaw models list
openclaw models list --json
```

## Live: перевірка CLI backend (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + агента з локальним CLI backend, не торкаючись вашого типового конфігу.
- Значення за замовчуванням для перевірки конкретного backend зберігаються у визначенні `cli-backend.ts` plugin-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значення за замовчуванням:
  - Provider/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Команда/аргументи/поведінка зображень беруться з метаданих plugin-власника CLI backend.
- Перевизначення (необов’язкові):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи впроваджуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість впровадження в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати передаванням аргументів зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типову перевірку безперервності тієї самої сесії Claude Sonnet -> Opus (встановіть `1`, щоб примусово ввімкнути її, коли вибрана модель підтримує ціль перемикання).

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

Рецепти Docker для одного provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Засіб запуску Docker розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live-перевірку CLI-backend усередині Docker-образу репозиторію як непривілейований користувач `node`.
- Він визначає метадані перевірки CLI з plugin-власника, а потім встановлює відповідний Linux CLI-пакет (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` вимагає переносну OAuth-автентифікацію підписки Claude Code через `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` із `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім виконує два ходи Gateway CLI-backend без збереження змінних середовища ключа Anthropic API. Цей шлях підписки за замовчуванням вимикає перевірки інструмента Claude MCP та зображень, оскільки Claude наразі маршрутизує використання сторонніх застосунків через додаткову оплату замість звичайних лімітів плану підписки.
- Live-перевірка CLI-backend тепер виконує однаковий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через Gateway CLI.
- Типова перевірка Claude також оновлює сесію із Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає ранішу нотатку.

## Live: перевірка прив’язки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язки ACP-розмови з live ACP-агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє в transcript прив’язаної ACP-сесії
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Значення за замовчуванням:
  - ACP-агенти в Docker: `claude,codex,gemini`
  - ACP-агент для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - ACP-backend: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Примітки:
  - Цей шлях використовує поверхню Gateway `chat.send` з синтетичними полями originating-route лише для адміністратора, щоб тести могли прикріплювати контекст каналу повідомлень без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр агентів plugin `acpx` для вибраного ACP-агента обв’язки.

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

- Засіб запуску Docker розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає перевірку ACP bind послідовно для всіх підтримуваних live CLI-агентів: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він використовує `~/.profile`, переносить відповідні матеріали автентифікації CLI в контейнер, встановлює `acpx` у записуваний npm-префікс, а потім встановлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker засіб запуску встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав змінні середовища provider із використаного `profile`, доступними для дочірнього CLI обв’язки.

## Live: перевірка обв’язки app-server Codex

- Мета: перевірити обв’язку Codex, що належить plugin, через звичайний метод
  `agent` Gateway:
  - завантажити вбудований plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід агента Gateway до `codex/gpt-5.4`
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що потік
    app-server може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях
    команд Gateway
  - за потреби виконати дві shell-перевірки з підвищеними правами, переглянуті Guardian: одну нешкідливу
    команду, яку слід схвалити, і одне фальшиве
    вивантаження секрету, яке слід заборонити, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Модель за замовчуванням: `codex/gpt-5.4`
- Необов’язкова перевірка зображень: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова перевірка MCP/інструментів: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Перевірка встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламана обв’язка Codex
  не могла пройти, непомітно переключившись на PI.
- Автентифікація: `OPENAI_API_KEY` з shell/profile, плюс за потреби скопійовані
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

- Засіб запуску Docker розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він використовує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації Codex CLI, якщо вони є, встановлює `@openai/codex` у записуваний змонтований npm
  префікс, переносить дерево вихідного коду, а потім запускає лише live-тест обв’язки Codex.
- Docker за замовчуванням увімкнює перевірки зображення, MCP/інструментів і Guardian. Встановіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли вам потрібен вужчий запуск для налагодження.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, відповідно до конфігу live-
  тесту, щоб fallback на `openai-codex/*` або PI не міг приховати регресію
  обв’язки Codex.

### Рекомендовані live-рецепти

Вузькі, явні allowlist — найшвидші та найменш схильні до збоїв:

- Одна модель, напряму (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, перевірка Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів через кількох provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст OAuth Antigravity (кінцева точка агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API-ключ / автентифікація профілю); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw виконує локальний бінарний файл `gemini`; він має власну автентифікацію і може поводитися інакше (streaming/підтримка інструментів/розсинхрон версій).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» немає (live — opt-in), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний набір для перевірки (виклик інструментів + зображення)

Це запуск «поширених моделей», який ми очікуємо зберігати працездатним:

- OpenAI (не Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запускати перевірку Gateway з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть щонайменше одну модель на сімейство provider:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень у `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI-варіанти з підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні Gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів і зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше provider, які можна включити в live-матрицю (якщо у вас є облікові дані/конфіг):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (кастомні кінцеві точки): `minimax` (хмара/API), а також будь-який сумісний із OpenAI/Anthropic proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «усі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс ті ключі, які доступні.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як CLI. Практичні наслідки:

- Якщо CLI працює, live-тести повинні знайти ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це в live-тестах означає «ключі профілю»)
- Конфіг: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється в staged live home, якщо присутній, але це не основне сховище ключів профілю)
- Локальні live-запуски за замовчуванням копіюють активний конфіг, файли `auth-profiles.json` для кожного агента, застарілий каталог `credentials/` і підтримувані зовнішні каталоги автентифікації CLI в тимчасовий домашній каталог тесту; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` прибираються, щоб probe не торкалися вашої реальної робочої області хоста.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте наведені нижче засоби запуску Docker (вони можуть монтувати `~/.profile` в контейнер).

## Live Deepgram (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live ComfyUI workflow media

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Область:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо `models.providers.comfy.<capability>` не налаштовано
  - Корисно після змін у надсиланні workflow comfy, polling, завантаженнях або реєстрації plugin

## Live: генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Обв’язка: `pnpm test:live:media image`
- Область:
  - Перелічує кожен зареєстрований provider-plugin генерації зображень
  - Завантажує відсутні env-змінні provider із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані з shell
  - Пропускає provider без придатної автентифікації/профілю/моделі
  - Запускає стандартні варіанти генерації зображень через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані provider, що покриваються:
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
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Live: генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Обв’язка: `pnpm test:live:media music`
- Область:
  - Перевіряє спільний шлях вбудованих provider генерації музики
  - Наразі покриває Google і MiniMax
  - Завантажує env-змінні provider із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані з shell
  - Пропускає provider без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` із введенням лише prompt
    - `edit`, коли provider оголошує `capabilities.edit.enabled`
  - Поточне покриття спільного шляху:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не ця спільна перевірка
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Live: генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Обв’язка: `pnpm test:live:media video`
- Область:
  - Перевіряє спільний шлях вбудованих provider генерації відео
  - За замовчуванням використовує безпечний для релізу шлях перевірки: provider не-FAL, один запит text-to-video на provider, prompt про лобстера на одну секунду та ліміт операції на provider з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на стороні provider може домінувати над часом релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні provider із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані з shell
  - Пропускає provider без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими трансформації, коли вони доступні:
    - `imageToVideo`, коли provider оголошує `capabilities.imageToVideo.enabled` і вибраний provider/модель приймає локальне введення зображень із буфера у спільній перевірці
    - `videoToVideo`, коли provider оголошує `capabilities.videoToVideo.enabled` і вибраний provider/модель приймає локальне введення відео з буфера у спільній перевірці
  - Поточні provider `imageToVideo`, оголошені, але пропущені в спільній перевірці:
    - `vydra`, тому що вбудований `veo3` підтримує лише text, а вбудований `kling` вимагає віддалений URL зображення
  - Покриття Vydra для конкретного provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс шлях `kling`, який за замовчуванням використовує фікстуру віддаленого URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні provider `videoToVideo`, оголошені, але пропущені в спільній перевірці:
    - `alibaba`, `qwen`, `xai`, тому що ці шляхи наразі вимагають віддалені еталонні URL `http(s)` / MP4
    - `google`, тому що поточний спільний шлях Gemini/Veo використовує локальне введення з буфера, і цей шлях не приймається у спільній перевірці
    - `openai`, тому що поточний спільний шлях не гарантує доступ до inpaint/remix відео, специфічний для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного provider у перевірку за замовчуванням, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції для кожного provider під час агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Обв’язка media live

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через один рідний для репозиторію entrypoint
  - Автоматично завантажує відсутні env-змінні provider з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до provider, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тож поведінка Heartbeat і quiet-mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Засоби запуску Docker (необов’язкові перевірки «працює в Linux»)

Ці засоби запуску Docker поділяються на дві групи:

- Засоби запуску live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл із ключами профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог конфігів і робочу область (і використовуючи `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Засоби запуску Docker для live за замовчуванням використовують менший ліміт smoke, щоб повна перевірка Docker залишалася практичною:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  ви явно хочете більшу вичерпну перевірку.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох live-шляхів Docker. Він також збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для контейнерних smoke-засобів запуску E2E, які перевіряють зібраний застосунок.
- Контейнерні smoke-засоби запуску: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Засоби запуску Docker для live-моделей також bind-mount лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб зовнішній CLI OAuth міг оновлювати токени без зміни сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Перевірка CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Перевірка обв’язки app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffold-налаштування): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Перевірка npm tarball onboarding/channel/agent: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding із посиланням на env і за замовчуванням Telegram, перевіряє, що ввімкнення plugin встановлює його runtime-залежності на вимогу, запускає doctor і виконує один змокований хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Мережа Gateway (два контейнери, автентифікація WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальна регресія reasoning для OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змокований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, а потім примусово викликає відхилення схеми provider і перевіряє, що необроблена деталь з’являється в логах Gateway.
- Міст каналу MCP (ініціалізований Gateway + міст stdio + raw smoke із кадрами сповіщень Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP у комплекті Pi (реальний stdio MCP-сервер + вбудований smoke allow/deny профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованого cron і одноразових запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (перевірка встановлення + псевдонім `/plugin` + семантика перезапуску комплекту Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke-перевірка незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-перевірка метаданих перезавантаження конфігу: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованого plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий образ Docker runner, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжого локального білду через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Звужуйте runtime-залежності вбудованого plugin під час ітерації, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний образ зібраного застосунку:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образу для конкретного набору, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо їх установлено. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та інсталятора зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакета/встановлення, а не спільний runtime зібраного застосунку.

Засоби запуску Docker для live-моделей також bind-mount поточний checkout лише для читання і
переносять його в тимчасову робочу директорію всередині контейнера. Це зберігає runtime-
образ компактним і водночас дає змогу запускати Vitest точно на вашому локальному source/config.
Крок перенесення пропускає великі локальні кеші та вихідні дані збирання застосунку, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб Gateway live-probe не запускали
реальні воркери каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити Gateway
live-покриття з цього Docker-шляху.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
контейнер Gateway OpenClaw з увімкненими HTTP-endpoint, сумісними з OpenAI,
запускає pinned-контейнер Open WebUI проти цього Gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
образ Open WebUI, а самому Open WebUI — завершити власне cold-start-налаштування.
Цей шлях очікує придатний live-ключ моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає ініціалізований контейнер
Gateway, запускає другий контейнер, який піднімає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання transcript, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідних надсилань і сповіщення у стилі Claude про канали +
дозволи через реальний міст stdio MCP. Перевірка сповіщень
безпосередньо перевіряє сирі кадри stdio MCP, тож smoke-перевірка підтверджує те, що
міст реально випромінює, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує live-ключа
моделі. Він збирає Docker-образ репозиторію, запускає реальний probe-сервер stdio MCP
усередині контейнера, матеріалізує цей сервер через вбудований runtime MCP комплекту Pi,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує live-ключа
моделі. Він запускає ініціалізований Gateway з реальним probe-сервером stdio MCP, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручна smoke-перевірка ACP plain-language thread (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для регресійних/налагоджувальних сценаріїв. Він може знову знадобитися для перевірки маршрутизації ACP thread, тож не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`), монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`), монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`), монтується в `/home/node/.profile` і використовується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, використані з `OPENCLAW_PROFILE_FILE`, із тимчасовими каталогами config/workspace і без монтування зовнішньої CLI-автентифікації
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`), монтується в `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Зовнішні каталоги/файли CLI-автентифікації в `$HOME` монтуються лише для читання в `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски provider монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати provider усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне нове збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані надходять зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway показує для smoke-перевірки Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke-перевірка Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити pinned-тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування доків: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального конвеєра» без реальних provider:

- Виклик інструментів Gateway (змокований OpenAI, реальний цикл Gateway + агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, запис config + примусова auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агентів»:

- Змокований виклик інструментів через реальний цикл Gateway + агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють підключення сесії та вплив config (`src/gateway/gateway.test.ts`).

Що для Skills усе ще відсутнє (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічено в prompt, чи обирає агент правильний Skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, що перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні оцінювання мають залишатися спершу детермінованими:

- Засіб запуску сценаріїв із mock-provider для перевірки викликів інструментів + їхнього порядку, читання файлів Skill і підключення сесії.
- Невеликий набір сценаріїв, сфокусованих на Skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live-оцінювання (opt-in, з env-gating) лише після того, як безпечний для CI набір буде готовий.

## Контрактні тести (форма plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований plugin і канал відповідає своєму
контракту інтерфейсу. Вони перебирають усі виявлені plugin і запускають набір
перевірок форми й поведінки. Типовий unit-шлях `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь каналів або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID thread
- **directory** - API директорії/ростеру
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe перевірки статусу каналу
- **registry** - Форма реєстру plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/добір автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни plugin каналу чи provider
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI й не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему provider/моделі, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (змокайте/stub provider або зафіксуйте точне перетворення форми запиту)
- Якщо вона за своєю природою лише live (rate limit, політики автентифікації), тримайте live-тест вузьким і opt-in через env-змінні
- Намагайтеся націлюватися на найменший шар, який виявляє помилку:
  - помилка перетворення/повтору запиту provider → тест прямих моделей
  - помилка конвеєра сесії/історії/інструментів Gateway → live-перевірка Gateway або безпечний для CI mock-тест Gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec-id сегментів обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою на некласифікованих target-id, щоб нові класи не могли бути тихо пропущені.
