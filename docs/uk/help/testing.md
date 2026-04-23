---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + agent
summary: 'Набір для тестування: unit/e2e/live набори, Docker runners і що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-23T19:25:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a26531abaab4e09f27976a12c5f4394f5f30eade060659670ba57adfc5fdc71
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker runners. Цей документ — посібник «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією помилкою спочатку віддавайте перевагу точковим запускам.
- Сайт QA з Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви торкаєтеся тестів або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + probe інструментів/зображень Gateway): `pnpm test:live`
- Точково запустити один live-файл тихо: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker sweep live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невеликий probe у стилі читання файла.
    Моделі, чиї метадані вказують на підтримку вхідних `image`, також виконують малий хід із зображенням.
    Вимкніть додаткові probe за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдерів.
  - Покриття в CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, що включає окремі matrix jobs Docker live-моделей,
    розбиті за провайдерами.
  - Для точкових повторних запусків у CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    запланованих/release викликів.
- Smoke-тест вартості Moonshot/Kimi: коли задано `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім окремий
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє про Moonshot/K2.6, а
  транскрипт помічника зберігає нормалізований `usage.cost`.

Порада: якщо вам потрібен лише один збійний випадок, звужуйте live-тести через env-змінні allowlist, описані нижче.

## Runners, специфічні для QA

Ці команди стоять поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається для відповідних PR і
через ручний dispatch з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний dispatch з mock parity gate, live Matrix lane і
live Telegram lane під керуванням Convex як паралельними jobs. `OpenClaw Release Checks`
запускає ті самі lanes перед затвердженням release.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA з репозиторію безпосередньо на хості.
  - Типово запускає кілька вибраних сценаріїв паралельно з ізольованими
    worker-ами gateway. `qa-channel` типово має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>` для налаштування
    кількості worker-ів або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнав невдачі. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без збійного коду завершення.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і моків протоколу без заміни сценарно-орієнтованого
    lane `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA всередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають у гість підтримувані входи авторизації QA, практичні для гостьової системи:
    ключі провайдерів із env, шлях до конфігурації QA live provider і `CODEX_HOME`,
    якщо він наявний.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гість міг записувати назад через
    змонтований workspace.
  - Записує звичайний звіт QA + підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає сайт QA на базі Docker для операторської QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний onboarding OpenAI API key, типово налаштовує Telegram,
    перевіряє, що вмикання plugin встановлює runtime dependencies на вимогу,
    запускає doctor і виконує один локальний хід agent-а проти мокованої кінцевої точки OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб виконати той самий lane
    пакованого встановлення з Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує й установлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані channel/plugin-и через
    редагування config.
  - Перевіряє, що виявлення setup залишає runtime dependencies
    неналаштованих plugin-ів відсутніми, перший налаштований запуск Gateway або doctor встановлює runtime dependencies кожного вбудованого plugin-а на вимогу,
    а другий перезапуск не перевстановлює dependencies, які вже були активовані.
  - Також установлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor
    кандидата відновлює runtime dependencies вбудованих channel без
    postinstall-відновлення з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти одноразового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для repo/dev. Паковані встановлення OpenClaw не постачають
    `qa-lab`, тому не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують вбудований runner напряму; окремий крок встановлення plugin-а не потрібен.
  - Надає трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Matrix plugin як транспортом SUT.
  - Типово використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки lane локально створює одноразових користувачів.
  - Записує звіт Matrix QA, підсумок, артефакт observed-events і комбінований лог stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени bot-ів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулів облікових даних. Типово використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути орендовані спільні облікові дані.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнав невдачі. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без збійного коду завершення.
  - Потребує двох різних bot-ів в одній приватній групі, причому bot SUT має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot-ів і переконайтеся, що bot driver може спостерігати трафік bot-ів у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту надсилання driver до спостереженої відповіді SUT.

Live transport lanes спільно використовують один стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним набором QA і не входить до матриці покриття live transport.

| Lane     | Canary | Блокування згадувань | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальші дії в треді | Ізоляція тредів | Спостереження за реакціями | Команда help |
| -------- | ------ | -------------------- | -------------------- | ------------------------- | ----------------------------- | -------------------- | --------------- | -------------------------- | ------------ |
| Matrix   | x      | x                    | x                    | x                         | x                             | x                    | x               | x                          |              |
| Telegram | x      |                      |                      |                           |                               |                      |                 |                            | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
цієї оренди, поки lane виконується, і звільняє оренду під час завершення.

Еталонний каркас проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env-змінні:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback URL Convex `http://` лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайній роботі має використовувати `https://`.

Адміністративні команди maintainer-а (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainers:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машиночитаного виводу в скриптах і утилітах CI.

Типовий контракт кінцевих точок (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для виду Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортний адаптер для каналу.
2. Набір сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab`
може керувати цим процесом.

`qa-lab` володіє спільною механікою хоста:

- кореневою командою `openclaw qa`
- запуском і завершенням наборів
- паралельністю worker-ів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- псевдонімами сумісності для старіших сценаріїв `qa-channel`

Runner plugin-и володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти й нормалізований стан транспорту
- як виконуються дії, підкріплені транспортом
- як обробляється специфічне для транспорту скидання або очищення

Мінімальна планка впровадження нового каналу така:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному хостовому seam `qa-lab`.
3. Тримайте специфічну для транспорту механіку всередині runner plugin-а або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner plugin-и повинні оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Зберігайте `runtime-api.ts` легким; лінивий CLI і виконання runner-а мають залишатися за окремими entrypoint-ами.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні helper-и сценаріїв для нових сценаріїв.
7. Зберігайте працездатність наявних псевдонімів сумісності, якщо лише репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного канального транспорту, тримайте її в цьому runner plugin-і або plugin harness.
- Якщо сценарію потрібна нова можливість, яку можуть використовувати більш ніж один канал, додайте загальний helper замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту й явно відображайте це в контракті сценарію.

Бажані назви загальних helper-ів для нових сценаріїв:

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати загальні назви helper-ів.
Псевдоніми сумісності існують, щоб уникнути міграції одним днем, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Думайте про набори як про «зростаючий реалізм» (і зростаючу нестабільність/вартість):

### Unit / integration (типово)

- Команда: `pnpm test`
- Config: нетаргетовані запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в конфіги для окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, охоплені `vitest.unit.config.ts`
- Область:
  - Чисті unit-тести
  - In-process integration-тести (авторизація gateway, маршрутизація, інструменти, парсинг, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
    <AccordionGroup>
    <Accordion title="Проєкти, шарди та scoped lanes"> - Нетаргетований `pnpm test` запускає дванадцять менших shard-конфігів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори. - `pnpm test --watch` усе ще використовує нативний граф проєктів root `vitest.config.ts`, оскільки багатошардовий цикл watch непрактичний. - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project. - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff торкається лише routable source/test файлів; редагування config/setup усе ще повертаються до широкого повторного запуску root-project. - `pnpm check:changed` — це типовий розумний локальний gate для вузької роботи. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, release metadata і tooling, а потім запускає відповідні lanes typecheck/lint/test. Зміни публічного Plugin SDK і plugin-contract включають перевірку extension, тому що extensions залежать від цих контрактів core. Оновлення версії лише в release metadata запускають точкові перевірки version/config/root-dependency замість повного набору, із guard, що відхиляє зміни package поза полем версії верхнього рівня. - Легкі з погляду імпортів unit-тести з agents, commands, plugins, helper-ів auto-reply, `plugin-sdk` та схожих чистих утилітних ділянок маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли лишаються на наявних lanes. - Вибрані helper-файли джерела `plugin-sdk` і `commands` також зіставляють запуски changed-mode з явними сусідніми тестами в цих легких lanes, щоб правки helper-ів не спричиняли повторний запуск усього важкого набору для цього каталогу. - `auto-reply` має три виділені кошики: helper-и core верхнього рівня, integration-тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це не дає найважчій роботі harness reply потрапляти на дешеві тести status/chunk/token.
    </Accordion>

      <Accordion title="Покриття embedded runner">
        - Коли ви змінюєте входи виявлення message-tool або runtime-контекст
          Compaction, зберігайте обидва рівні покриття.
        - Додавайте точкові helper-регресії для чистих меж маршрутизації й нормалізації.
        - Підтримуйте справність integration-наборів embedded runner:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Ці набори перевіряють, що scoped id та поведінка Compaction і далі проходять
          через реальні шляхи `run.ts` / `compact.ts`; тести лише на helper-и
          не є достатньою заміною для цих integration-шляхів.
      </Accordion>

      <Accordion title="Пул Vitest і типові значення ізоляції">
        - Базовий config Vitest типово використовує `threads`.
        - Спільний config Vitest фіксує `isolate: false` і використовує
          runner без ізоляції в root projects, e2e і live configs.
        - Root lane UI зберігає своє налаштування `jsdom` й optimizer, але теж запускається на
          спільному runner-і без ізоляції.
        - Кожен shard `pnpm test` успадковує ті самі типові значення
          `threads` + `isolate: false` зі спільного config Vitest.
        - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
          щоб зменшити churn компіляції V8 під час великих локальних запусків.
          Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти з типовою поведінкою V8.
      </Accordion>

      <Accordion title="Швидка локальна ітерація">
        - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
        - Pre-commit hook запускає `pnpm check:changed --staged` після staged
          formatting/linting, тож core-only commits не оплачують вартість тестів extension,
          якщо лише вони не торкаються публічних контрактів, орієнтованих на extension. Коміти лише з
          release metadata залишаються на точковому lane
          version/config/root-dependency.
        - Якщо точний staged-набір змін уже був перевірений
          рівними або сильнішими gates, використовуйте
          `scripts/committer --fast "<message>" <files...>`, щоб пропустити лише повторний запуск hook changed-scope. Staged format/lint усе одно запускаються. Згадайте
          виконані gates у вашому handoff. Це також прийнятно після повторного запуску ізольованого нестабільного hook-а, якщо він проходить із точковим доказом.
        - `pnpm test:changed` маршрутизується через scoped lanes, коли змінені шляхи
          чисто відповідають меншому набору.
        - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим лімітом worker-ів.
        - Автоматичне локальне масштабування worker-ів навмисно консервативне й зменшується,
          коли середнє навантаження хоста вже високе, тож кілька одночасних
          запусків Vitest типово шкодять менше.
        - Базовий config Vitest позначає проєкти/config-файли як
          `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними,
          коли змінюється wiring тестів.
        - Config тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
          хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
          одну явну локацію кешу для прямого профілювання.
      </Accordion>

      <Accordion title="Налагодження продуктивності">
        - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
          вивід розбивки імпортів.
        - `pnpm test:perf:imports:changed` обмежує той самий вид профілювання
          файлами, зміненими від `origin/main`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
          `test:changed` із нативним шляхом root-project для цього закоміченого diff і виводить wall time плюс macOS max RSS.
        - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
          брудного дерева, маршрутизуючи список змінених файлів через
          `scripts/test-projects.mjs` і root config Vitest.
        - `pnpm test:perf:profile:main` записує профіль CPU main-thread для
          старту Vitest/Vite та overhead трансформацій.
        - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner-а для
          unit-набору з вимкненим файловим паралелізмом.
      </Accordion>
    </AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Проганяє синтетичний churn повідомлень gateway, memory і великих payload через шлях діагностичних подій
  - Запитує `diagnostics.stability` через WS RPC Gateway
  - Покриває helper-и збереження набору діагностичної стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні RSS-зразки лишаються в межах бюджету тиску, а глибини черг для кожної сесії повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшої роботи над регресіями стабільності, а не заміна повному набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих plugin-ів у `extensions/`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість worker-ів (CI: до 2, локально: 1 типово).
  - Типово працює в тихому режимі, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість worker-ів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути докладний вивід у консоль.
- Область:
  - End-to-end поведінка Gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, pair-ing Node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox з тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через fs-bridge sandbox
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестові gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` щоб указати нестандартний CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих plugin-ів у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей tool-calling, проблем авторизації та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / витрачає rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски читають `~/.profile`, щоб підхопити відсутні API key.
- Типово live-запуски все одно ізолюють `HOME` і копіюють config/auth матеріали в тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і приглушує bootstrap-логи gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API key (залежно від провайдера): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби при відповідях rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдерів було видно як активні, навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тож рядки прогресу провайдера/gateway одразу потоково надходять під час live-запусків.
  - Налаштовуйте Heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої взаємодії gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій bot не працює» / збої, специфічні для провайдера / tool calling: запускайте звужений `pnpm test:live`

## Live: sweep можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку зараз оголошує** підключений Android Node, і перевірити поведінку контракту команди.
- Область:
  - Ручне/попередньо підготовлене налаштування (набір не встановлює/не запускає/не pair-ить app).
  - Перевірка `node.invoke` Gateway для вибраного Android Node команда за командою.
- Обов’язкове попереднє налаштування:
  - Android app уже підключений і спарений з gateway.
  - App утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте успішними.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні подробиці налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделей (ключі профілів)

Live-тести поділено на два рівні, щоб можна було ізолювати збої:

- «Direct model» показує, що провайдер/модель взагалі може відповісти з цим ключем.
- «Gateway smoke» показує, що для цієї моделі працює повний pipeline gateway+agent (сесії, історія, інструменти, політика sandbox тощо).

### Рівень 1: Direct model completion (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике completion для кожної моделі (і точкові регресії за потреби)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб реально запустити цей набір; інакше він буде пропущений, щоб `pnpm test:live` лишався сфокусованим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern` щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Sweep modern/all типово обмежуються curated high-signal cap; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern sweep або додатне число для меншого обмеження.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - Типово: сховище профілів і fallback-и env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ невалідний» від «pipeline gateway agent зламаний»
  - Містить невеликі ізольовані регресії (приклад: replay reasoning OpenAI Responses/Codex Responses + потоки tool-call)

### Рівень 2: Gateway + smoke dev agent (те, що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process gateway
  - Створити/змінити сесію `agent:dev:*` (перевизначення моделі на кожен запуск)
  - Ітерувати моделі-з-ключами й перевіряти:
    - «змістовну» відповідь (без інструментів)
    - що реальний виклик інструмента працює (probe читання)
    - необов’язкові додаткові probe інструментів (probe exec+read)
    - що шляхи регресії OpenAI (лише tool-call → подальший виклик) і далі працюють
- Деталі probe (щоб можна було швидко пояснювати збої):
  - probe `read`: тест записує файл nonce у workspace і просить agent-а `read` його та повернути nonce.
  - probe `exec+read`: тест просить agent-а через `exec` записати nonce в тимчасовий файл, а потім `read` прочитати його назад.
  - probe зображення: тест прикріплює згенерований PNG (кіт + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - Типово: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для сучасного allowlist
  - Або задайте `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Sweep gateway modern/all типово обмежуються curated high-signal cap; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern sweep або додатне число для меншого обмеження.
- Як вибирати провайдерів (уникнути «OpenRouter everything»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Tool + image probe завжди увімкнені в цьому live-тесті:
  - probe `read` + probe `exec+read` (стрес для інструментів)
  - probe зображення запускається, коли модель оголошує підтримку вхідних зображень
  - Потік (високорівнево):
    - Тест генерує маленький PNG з «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований agent передає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: дозволені незначні помилки)

Порада: щоб побачити, що саме ви можете тестувати на своїй машині (і точні id `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI backend (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити pipeline Gateway + agent, використовуючи локальний CLI backend, не торкаючись типового config.
- Типові параметри smoke для конкретного backend живуть у визначенні `cli-backend.ts` extension-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих plugin-а власника CLI backend.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальний attachment зображення (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи файлів зображень як CLI args замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб контролювати спосіб передавання args зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типовий probe безперервності тієї самої сесії Claude Sonnet -> Opus (установіть `1`, щоб примусово ввімкнути його, коли вибрана модель підтримує ціль перемикання).

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
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

- Docker runner розміщений у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає smoke live CLI-backend усередині Docker-образу репозиторію від імені користувача `node`, який не є root.
- Він визначає метадані CLI smoke з extension-власника, а потім установлює відповідний Linux CLI package (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований доступний для запису префікс у `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує portable OAuth передплати Claude Code через `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім виконує два ходи Gateway CLI-backend без збереження env-змінних API key Anthropic. Цей lane передплати типово вимикає probe Claude MCP/tool і image, оскільки Claude зараз маршрутизує використання сторонніх застосунків через білінг extra-usage, а не звичайні ліміти плану передплати.
- Smoke live CLI-backend тепер перевіряє той самий end-to-end потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик інструмента MCP `cron`, перевірений через CLI gateway.
- Типовий smoke Claude також змінює сесію з Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік conversation-bind ACP з live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну conversation каналу повідомлень на місці
  - надіслати звичайне подальше повідомлення в тій самій conversation
  - перевірити, що подальше повідомлення потрапляє до transcript прив’язаної ACP session
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP agent-и в Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст conversation у стилі Slack DM
  - ACP backend: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
- Примітки:
  - Цей lane використовує поверхню gateway `chat.send` з admin-only синтетичними полями originating-route, щоб тести могли прикріпити контекст message-channel без удавання зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр agent-ів plugin-а `acpx` для вибраного ACP harness agent.

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

Рецепти Docker для одного agent-а:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker runner розміщений у `scripts/test-live-acp-bind-docker.sh`.
- Типово він запускає smoke ACP bind для всіх підтримуваних live CLI agent-ів послідовно: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він читає `~/.profile`, переносить відповідні матеріали авторизації CLI в контейнер, установлює `acpx` у доступний для запису npm-префікс, а потім установлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker runner встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб `acpx` зберігав env-змінні провайдера з прочитаного profile доступними для дочірнього CLI harness.

## Live: smoke app-server harness Codex

- Мета: перевірити harness Codex, що належить plugin-у, через звичайний метод gateway
  `agent`:
  - завантажити вбудований plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `codex/gpt-5.5`
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що thread app-server
    може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях команд gateway
  - за потреби виконати два shell probe з ескалацією, перевірені Guardian: одну нешкідливу
    команду, яку слід схвалити, і одне фіктивне вивантаження секрету, яке має бути
    відхилене, щоб agent перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `codex/gpt-5.5`
- Необов’язковий image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язковий MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язковий probe Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний
  harness Codex не міг пройти, непомітно переключившись на PI.
- Авторизація: `OPENAI_API_KEY` з shell/profile, а також необов’язково скопійовані
  `~/.codex/auth.json` і `~/.codex/config.toml`

Локальний рецепт:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker runner розміщений у `scripts/test-live-codex-harness-docker.sh`.
- Він читає змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  авторизації Codex CLI, якщо вони наявні, установлює `@openai/codex` у змонтований npm-префікс із можливістю запису,
  переносить source tree, а потім запускає лише live-тест Codex-harness.
- Docker типово вмикає image, MCP/tool і Guardian probe. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий налагоджувальний
  запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, як і config live-тесту, щоб fallback `openai-codex/*` або PI не міг приховати регресію harness Codex.

### Рекомендовані live-рецепти

Найшвидші та найменш нестабільні — вузькі явні allowlist:

- Одна модель, direct (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling через кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API key).
- `google-antigravity/...` використовує міст OAuth Antigravity (кінцева точка agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний CLI Gemini на вашій машині (окрема авторизація + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API key / авторизація профілю); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний binary `gemini`; він має власну авторизацію і може поводитися інакше (streaming/tool support/version skew).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» немає (live — це opt-in), але ось **рекомендовані** моделі, які варто регулярно покривати на машині розробника з ключами.

### Набір сучасного smoke (tool calling + image)

Це запуск «поширених моделей», який ми очікуємо підтримувати працездатним:

- OpenAI (не Codex): `openai/gpt-5.5` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск gateway smoke з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: tool calling (Read + необов’язковий Exec)

Виберіть щонайменше одну модель для кожного сімейства провайдерів:

- OpenAI: `openai/gpt-5.5` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (добре мати):

- xAI: `xai/grok-4` (або найновішу доступну)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою `tools`, яку ви увімкнули)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; tool calling залежить від режиму API)

### Vision: надсилання зображення (attachment → мультимодальне повідомлення)

Додайте щонайменше одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Aggregators / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (авторизація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до live matrix (якщо у вас є облікові дані/config):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (користувацькі кінцеві точки): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко прописати в документації «всі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс доступні ключі.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі авторизації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «ключі профілів» у live-тестах)
- Config: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до staged live home, якщо присутній, але це не основне сховище ключів профілів)
- Локальні live-запуски типово копіюють активний config, файли `auth-profiles.json` для окремих агентів, застарілий `credentials/` і підтримувані зовнішні каталоги авторизації CLI до тимчасового test home; staged live homes пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` прибираються, щоб probe не торкалися вашого реального workspace хоста.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker runners нижче (вони можуть монтувати `~/.profile` у контейнер).

## Live Deepgram (транскрипція аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live workflow media ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Область:
  - Перевіряє вбудовані шляхи comfy для зображень, відео і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у надсиланні workflow comfy, polling, завантаженнях або реєстрації plugin-а

## Live генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Область:
  - Перелічує кожен зареєстрований provider plugin генерації зображень
  - Завантажує відсутні env-змінні провайдерів із вашого login shell (`~/.profile`) перед probe
  - Типово використовує live/env API key раніше за збережені профілі авторизації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної авторизації/профілю/моделі
  - Запускає стандартні варіанти генерації зображень через спільну runtime-можливість:
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
- Необов’язкова поведінка авторизації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати авторизацію зі сховища профілів і ігнорувати перевизначення лише з env

## Live генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Область:
  - Перевіряє спільний вбудований шлях провайдерів генерації музики
  - Наразі покриває Google і MiniMax
  - Завантажує env-змінні провайдерів із вашого login shell (`~/.profile`) перед probe
  - Типово використовує live/env API key раніше за збережені профілі авторизації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної авторизації/профілю/моделі
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` з вводом лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільного lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, а не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка авторизації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати авторизацію зі сховища профілів і ігнорувати перевизначення лише з env

## Live генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Область:
  - Перевіряє спільний вбудований шлях провайдерів генерації відео
  - Типово використовує release-safe шлях smoke: провайдери без FAL, один запит text-to-video на провайдера, prompt про лобстера тривалістю одну секунду та обмеження операції для кожного провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` типово)
  - Типово пропускає FAL, оскільки затримка черги на стороні провайдера може домінувати над часом release; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб явно його запустити
  - Завантажує env-змінні провайдерів із вашого login shell (`~/.profile`) перед probe
  - Типово використовує live/env API key раніше за збережені профілі авторизації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної авторизації/профілю/моделі
  - Типово запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими transform, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальний ввід зображення у вигляді буфера в спільному sweep
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальний ввід відео у вигляді буфера в спільному sweep
  - Поточні провайдери `imageToVideo`, оголошені, але пропущені у спільному sweep:
    - `vydra`, тому що вбудований `veo3` підтримує лише text, а вбудований `kling` потребує віддалений URL зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс lane `kling`, який типово використовує віддалений URL-зразок зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, оголошені, але пропущені у спільному sweep:
    - `alibaba`, `qwen`, `xai`, тому що ці шляхи наразі потребують віддалені reference URL `http(s)` / MP4
    - `google`, тому що поточний спільний lane Gemini/Veo використовує локальний буферний ввід, а цей шлях не приймається у спільному sweep
    - `openai`, тому що поточний спільний lane не гарантує доступ до org-specific можливостей video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типового sweep, зокрема FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження операції для кожного провайдера в агресивному smoke-запуску
- Необов’язкова поведінка авторизації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати авторизацію зі сховища профілів і ігнорувати перевизначення лише з env

## Harness live media

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори зображень, музики та відео через один рідний для репозиторію entrypoint
  - Автоматично завантажує відсутні env-змінні провайдерів із `~/.profile`
  - Типово автоматично звужує кожен набір до провайдерів, які зараз мають придатну авторизацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker runners (необов’язкові перевірки «працює в Linux»)

Ці Docker runners поділяються на дві групи:

- Runners live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл ключів профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і читають `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint-и — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker runners live типово використовують менший smoke-cap, щоб повний sweep у Docker залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для двох Docker lanes live. Він також збирає один спільний image `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для контейнерних smoke runners E2E, які перевіряють зібраний app.
- Контейнерні smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker runners live-моделей також bind-mount-ять лише потрібні CLI homes авторизації (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб зовнішній CLI OAuth міг оновлювати токени без зміни сховища авторизації хоста:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke app-server harness Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffold-налаштування): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke онбордингу/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref і типово Telegram, перевіряє, що ввімкнення plugin встановлює його runtime deps на вимогу, запускає doctor і виконує один мокований хід agent проти OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальна reasoning-регресія OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає мокований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення provider schema і перевіряє, що сирі подробиці з’являються в логах Gateway.
- Міст MCP channel (ініціалізований Gateway + stdio bridge + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти Pi bundle MCP (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінності оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps вбудованого plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий образ Docker runner, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Звужуйте runtime deps вбудованого plugin під час ітерацій, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний образ built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів, специфічні для наборів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо його ще немає локально. QR- і installer-тести Docker зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільний runtime built-app.

Docker runners live-моделей також монтують поточний checkout лише для читання і
переносять його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, але все одно запускає Vitest проти ваших точних локальних source/config.
Крок перенесення пропускає великі локальні кеші й результати збірки app, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для app каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live probe Gateway не запускали
реальні worker-и каналів Telegram/Discord/etc. усередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цього Docker lane.
`test:docker:openwebui` — це smoke вищого рівня для перевірки сумісності: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP endpoint-ами,
запускає закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний chat-запит через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, тому що Docker може знадобитися завантажити
образ Open WebUI, а самому Open WebUI — завершити власне холодне стартове налаштування.
Цей lane очікує придатний live-ключ моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального акаунта Telegram, Discord або iMessage. Він запускає ініціалізований контейнер
Gateway, запускає другий контейнер, який піднімає `openclaw mcp serve`, а потім
перевіряє виявлення conversation-маршрутизації, читання transcript, метадані attachment,
поведінку черги live events, маршрутизацію вихідного надсилання та сповіщення у стилі Claude про канал +
дозволи через реальний stdio MCP bridge. Перевірка сповіщень
напряму аналізує сирі stdio MCP frames, тож smoke перевіряє те, що міст
справді випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує live-ключа
моделі. Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей server через вбудований runtime Pi bundle
MCP, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує live-ключа
моделі. Він запускає ініціалізований Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread ACP (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і читається перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, прочитані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установлень CLI усередині Docker
- Зовнішні каталоги/файли CLI auth у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків без потреби в перебудові
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані беруться зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли вам також потрібні перевірки заголовків у межах сторінок: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечні для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Tool calling Gateway (мокований OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, запис config + примусова auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Evals надійності agent (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «evals надійності agent»:

- Мокований tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- End-to-end потоки wizard, які перевіряють підключення сесії та ефекти config (`src/gateway/gateway.test.ts`).

Чого все ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічено в prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Виконання вимог:** чи читає agent `SKILL.md` перед використанням і чи виконує потрібні кроки/args?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals спочатку мають залишатися детермінованими:

- Runner сценаріїв із мокованими провайдерами для перевірки викликів інструментів + порядку, читання skill-файлів і підключення сесії.
- Невеликий набір сценаріїв, зосереджених на skill (використати чи уникнути, gating, prompt injection).
- Необов’язкові live evals (opt-in, із керуванням через env) лише після того, як буде створено безпечний для CI набір.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає
своєму контракту інтерфейсу. Вони ітерують усі виявлені plugin-и й запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin-а (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID тредів
- **directory** - API каталогу/реєстру
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe статусу каналу
- **registry** - Форма реєстру plugin-ів

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку авторизації
- **auth-choice** - Вибір/визначення авторизації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin-ів
- **loader** - Завантаження plugin-ів
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс plugin-а
- **wizard** - Майстер налаштування

### Коли запускати

- Після змін експортів або підшляхів plugin-sdk
- Після додавання або зміни channel чи provider plugin-а
- Після рефакторингу реєстрації або виявлення plugin-ів

Контрактні тести запускаються в CI і не потребують реальних API key.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (мокований/заглушений провайдер або захоплення точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики авторизації), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу націленню на найменший шар, який ловить помилку:
  - помилка перетворення/повторення запиту провайдера → direct models test
  - помилка pipeline gateway session/history/tool → gateway live smoke або безпечний для CI мокований тест gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id із сегментом traversal відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується з помилкою для некласифікованих target id, щоб нові класи не можна було тихо пропустити.
