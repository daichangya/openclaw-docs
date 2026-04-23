---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: unit/e2e/live набори, Docker runners і що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-23T23:00:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a9e2a48bf887b6bf59e395e5966c2e77032403c0a05c81322ffe0b3247c7dff
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker runners. Цей документ — посібник «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

## Швидкий старт

У більшості випадків:

- Повна перевірка (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на продуктивній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-ланка на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Перевірка покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + probe інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live-перевірка моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику probe-перевірку у стилі читання файла.
    Моделі, чиї метадані вказують на підтримку `image`, також виконують крихітний хід із зображенням.
    Вимкніть додаткові probe за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають reusable workflow live/E2E з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розшардовані за провайдером.
  - Для цільових повторних запусків у CI викликайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові секрети провайдерів із високим сигналом до `scripts/ci-hydrate-live-auth.sh`
    разом із `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    scheduled/release викликачами.
- Кошторисна smoke-перевірка Moonshot/Kimi: якщо задано `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6 і що
  транскрипт асистента зберігає нормалізований `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, краще звузити live-тести через змінні середовища allowlist, описані нижче.

## Спеціалізовані runners для QA

Ці команди використовуються поряд з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається для відповідних PR і
через manual dispatch з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через manual dispatch з mock parity gate, live Matrix lane та
Convex-managed live Telegram lane як паралельними jobs. `OpenClaw Release Checks`
запускає ті самі ланки перед схваленням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на основі репозиторію безпосередньо на хості.
  - Типово запускає кілька вибраних сценаріїв паралельно з ізольованими
    worker-процесами Gateway. `qa-channel` типово має concurrency 4 (обмежене
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість worker-процесів, або `--concurrency 1` для старішої послідовної ланки.
  - Завершується з ненульовим кодом, якщо бодай один сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без помилкового коду завершення.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстурами та mock протоколу без заміни сценарно-орієнтованої
    ланки `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані вхідні дані автентифікації QA, які практичні для гостьової системи:
    ключі провайдера на основі env, шлях до конфігурації QA live provider і `CODEX_HOME`, якщо він є.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через
    змонтований робочий простір.
  - Записує звичайний QA report + summary, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської роботи в QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний onboarding OpenAI API key, типово налаштовує Telegram,
    перевіряє, що ввімкнення plugin встановлює runtime-залежності за потреби,
    запускає doctor і виконує один локальний хід агента проти mock OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму packaged-install
    ланку з Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через
    редагування конфігурації.
  - Перевіряє, що виявлення setup залишає невстановлені runtime-залежності
    для не налаштованих plugin відсутніми, що перший налаштований запуск Gateway або doctor встановлює runtime-залежності кожного bundled
    plugin за потреби, і що другий перезапуск не перевстановлює залежності,
    які вже були активовані.
  - Також встановлює відому старішу npm-базу, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що
    post-update doctor кандидата відновлює runtime-залежності bundled channel без
    postinstall-відновлення з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямої smoke-перевірки протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Упаковані інсталяції OpenClaw не постачаються з
    `qa-lab`, тому не надають `openclaw qa`.
  - Checkouts репозиторію завантажують bundled runner безпосередньо; окремий крок встановлення plugin не потрібен.
  - Надає трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній процес QA gateway з реальним Matrix plugin як транспортом SUT.
  - Типово використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки ця ланка локально створює тимчасових користувачів.
  - Записує Matrix QA report, summary, артефакт observed-events і комбінований журнал stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потрібні `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID групи має бути числовим ID чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулів облікових даних. Типово використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб перейти на pooled leases.
  - Завершується з ненульовим кодом, якщо бодай один сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без помилкового коду завершення.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує Telegram QA report, summary і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії відповідей включають RTT від запиту на надсилання driver до спостережуваної відповіді SUT.

Live transport lanes використовують один стандартний контракт, щоб нові транспорти не відхилялися:

`qa-channel` лишається широким синтетичним QA-набором і не є частиною матриці покриття live transport.

| Ланка    | Canary | Гейтінг згадок | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальше повідомлення в треді | Ізоляція тредів | Спостереження реакцій | Команда help |
| -------- | ------ | -------------- | -------------------- | ------------------------- | ----------------------------- | ----------------------------- | --------------- | --------------------- | ------------ |
| Matrix   | x      | x              | x                    | x                         | x                             | x                             | x               | x                     |              |
| Telegram | x      |                |                      |                           |                               |                               |                 |                       | x            |

### Спільні Telegram credentials через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну lease із пулу на основі Convex, надсилає Heartbeat
для цієї lease, поки ланка працює, і звільняє lease під час завершення роботи.

Базовий scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URL для суто локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі має використовувати `https://`.

Адміністраторські команди maintainer (додавання/видалення/список пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машинозчитуваного виводу в скриптах і CI-утилітах.

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
- `groupId` має бути рядком із числовим ID чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до системи markdown QA вимагає рівно двох речей:

1. Транспортний адаптер для каналу.
2. Набір сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` відповідає за спільну механіку хоста:

- кореневу команду `openclaw qa`
- запуск і завершення suite
- паралелізм worker-процесів
- запис артефактів
- генерацію звітів
- виконання сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Плагіни runner відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як налаштовується gateway для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти і нормалізований стан транспорту
- як виконуються дії на базі транспорту
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг прийняття для нового каналу такий:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний runner на спільному шві хоста `qa-lab`.
3. Зберігайте специфічну для транспорту механіку всередині плагіна runner або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Плагіни runner мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Зберігайте `runtime-api.ts` легким; ліниві CLI і виконання runner мають залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Для нових сценаріїв використовуйте загальні допоміжні функції сценаріїв.
7. Зберігайте працездатність наявних compatibility aliases, якщо тільки репозиторій не виконує навмисну міграцію.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від транспорту одного каналу, залишайте її в цьому плагіні runner або harness плагіна.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте загальну допоміжну функцію замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту й явно зазначайте це в контракті сценарію.

Бажані назви загальних допоміжних функцій для нових сценаріїв:

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

Compatibility aliases залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати загальні назви допоміжних функцій.
Compatibility aliases існують, щоб уникнути міграції одним днем, а не як модель для
створення нових сценаріїв.

## Набори тестів (що й де запускається)

Думайте про набори як про «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: ненаправлені запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати multi-project shards у конфігурації для окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, що покриваються `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, tooling, парсинг, конфігурація)
  - Детерміновані регресійні тести для відомих помилок
- Очікування:
  - Запускаються в CI
  - Реальні ключі не потрібні
  - Мають бути швидкими й стабільними
    <AccordionGroup>
    <Accordion title="Проєкти, шарди й scoped lanes"> - Ненаправлений `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу root project. Це зменшує пікове RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори. - `pnpm test --watch` і далі використовує нативний граф проєкту root `vitest.config.ts`, оскільки цикл watch для багатьох шардів непрактичний. - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файл/каталог через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project. - `pnpm test:changed` розгортає змінені шляхи git у ті самі scoped lanes, коли diff зачіпає лише routable source/test файли; редагування config/setup і далі повертаються до широкого повторного запуску root project. - `pnpm check:changed` — це звичайна розумна локальна перевірка для вузької роботи. Вона класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata та tooling, а потім запускає відповідні lanes typecheck/lint/test. Зміни в публічному Plugin SDK і plugin-contract включають валідацію extension, оскільки extensions залежать від цих core-контрактів. Версійні зміни лише в метаданих релізу запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, що відхиляє зміни пакетів поза верхньорівневим полем версії. - Unit-тести з малим імпортом із agents, commands, plugins, допоміжних функцій auto-reply, `plugin-sdk` та подібних чистих утилітних ділянок маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes. - Вибрані допоміжні вихідні файли `plugin-sdk` і `commands` також зіставляють запуски в changed-mode з явними sibling tests у цих легких lanes, тому редагування допоміжних функцій уникає повторного запуску повного важкого набору для цього каталогу. - `auto-reply` має три спеціалізовані кошики: допоміжні функції верхнього рівня core, integration-тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це тримає найважчу роботу harness reply поза дешевими тестами status/chunk/token.
    </Accordion>

      <Accordion title="Покриття вбудованого runner">
        - Коли ви змінюєте вхідні дані виявлення message-tool або runtime-контекст Compaction, зберігайте обидва рівні покриття.
        - Додавайте цільові регресійні тести допоміжних функцій для чистих меж маршрутизації та нормалізації.
        - Підтримуйте в здоровому стані integration-набори вбудованого runner:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Ці набори перевіряють, що scoped ids і поведінка Compaction і далі проходять
          через реальні шляхи `run.ts` / `compact.ts`; тести лише допоміжних функцій
          не є достатньою заміною для цих integration-шляхів.
      </Accordion>

      <Accordion title="Типові значення Vitest pool та ізоляції">
        - Базова конфігурація Vitest типово використовує `threads`.
        - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
          неізольований runner у root projects, e2e і live configs.
        - Root UI lane зберігає своє налаштування `jsdom` та optimizer, але також працює на
          спільному неізольованому runner.
        - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
        - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
          щоб зменшити V8 compile churn під час великих локальних запусків.
          Задайте `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
          поведінкою V8.
      </Accordion>

      <Accordion title="Швидка локальна ітерація">
        - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
        - Pre-commit hook запускає `pnpm check:changed --staged` після staged
          formatting/linting, тому коміти лише для core не платять вартість тестів extension,
          якщо вони не торкаються публічних контрактів, орієнтованих на extension. Коміти лише з
          метаданими релізу залишаються на цільовій
          lane version/config/root-dependency.
        - Якщо точний staged-набір змін уже було перевірено
          рівними або сильнішими перевірками, використовуйте
          `scripts/committer --fast "<message>" <files...>`, щоб пропустити лише
          повторний запуск changed-scope hook. Staged format/lint і далі виконуються. Згадайте
          завершені перевірки у вашому handoff. Це також прийнятно після
          ізольованого flaky-збою hook, якщо його повторно запущено і він пройшов із scoped-доказом.
        - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи
          чітко відображаються на менший набір.
        - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
          лише з вищою межею кількості worker-процесів.
        - Автомасштабування локальних worker-процесів навмисно консервативне і знижує навантаження,
          коли середнє навантаження хоста вже високе, тому кілька одночасних
          запусків Vitest типово завдають менше шкоди.
        - Базова конфігурація Vitest позначає проєкти/файли конфігурації як
          `forceRerunTriggers`, щоб повторні запуски у changed-mode залишалися коректними, коли змінюється
          обв’язка тестів.
        - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
          хостах; задайте `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
          один явний шлях кешу для прямого профілювання.
      </Accordion>

      <Accordion title="Налагодження продуктивності">
        - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпорту плюс
          вивід деталізації імпорту.
        - `pnpm test:perf:imports:changed` обмежує те саме подання профілювання
          файлами, зміненими від `origin/main`.
        - Коли один гарячий тест і далі витрачає більшість часу на стартові імпорти,
          тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
          безпосередньо mock-айте цей шов замість deep-import runtime helper, лише
          щоб передати їх через `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
          `test:changed` із нативним шляхом root-project для цього зафіксованого
          diff і виводить wall time плюс максимальний RSS у macOS.
        - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
          брудного дерева, маршрутизуючи список змінених файлів через
          `scripts/test-projects.mjs` і конфігурацію root Vitest.
        - `pnpm test:perf:profile:main` записує CPU-профіль основного потоку для
          накладних витрат запуску й трансформації Vitest/Vite.
        - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для
          unit-набору з вимкненим паралелізмом файлів.
      </Accordion>
    </AccordionGroup>

### Stability (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Пропускає синтетичне churn повідомлень gateway, пам’яті й великих payload через шлях подій діагностики
  - Запитує `diagnostics.stability` через WS RPC Gateway
  - Покриває допоміжні функції збереження діагностичного пакета стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні RSS-зразки не перевищують бюджет тиску, а глибини черг для кожного сеансу повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька lane для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Типові параметри виконання:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість worker-процесів (CI: до 2, локально: типово 1).
  - Типово запускається в тихому режимі, щоб зменшити накладні витрати на I/O консолі.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` — примусово задати кількість worker-процесів (обмеження до 16).
  - `OPENCLAW_E2E_VERBOSE=1` — знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Поведінка multi-instance gateway end-to-end
  - Поверхні WebSocket/HTTP, pairing вузлів і важче мережеве навантаження
- Очікування:
  - Запускається в CI (коли це ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Має більше рухомих частин, ніж unit-тести (може бути повільнішим)

### E2E: smoke-перевірка backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє canonical-поведінку віддаленої файлової системи через fs bridge sandbox
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потрібен локальний CLI `openshell` і працездатний Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` — увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` — вказати нестандартний CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- Типове значення: **увімкнено** через `pnpm test:live` (задає `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель _сьогодні_ працює з реальними обліковими даними?»
  - Виявлення змін форматів провайдерів, особливостей виклику інструментів, проблем автентифікації та поведінки лімітів частоти
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує ліміти частоти
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски зчитують `~/.profile`, щоб отримати відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Задавайте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам свідомо потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і приглушує журнали bootstrap gateway/шум Bonjour. Задайте `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація API-ключів (залежно від провайдера): задавайте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або окреме перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу до stderr, щоб було видно активність довгих викликів провайдерів, навіть коли захоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки прогресу провайдера/gateway передаються одразу під час live-запусків.
  - Налаштовуйте Heartbeat для прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте таку таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтесь мережевої частини gateway / WS-протоколу / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live: перевірка можливостей Android node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яка наразі рекламується** підключеним Android node, і перевірити поведінку контракту команд.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/не запускає/не pair-ить застосунок).
  - Перевірка gateway `node.invoke` команда за командою для вибраного Android node.
- Потрібне попереднє налаштування:
  - Android-застосунок уже підключений і paired до gateway.
  - Застосунок тримається на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте перевірити успішно.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke-перевірка моделей (ключі профілів)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Пряма модель» показує, що провайдер/модель взагалі може відповідати з наданим ключем.
- «Gateway smoke» показує, що повний конвеєр gateway+agent працює для цієї моделі (сеанси, історія, інструменти, політика sandbox тощо).

### Шар 1: пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити знайдені моделі
  - Використати `getApiKeyForModel` для вибору моделей, для яких у вас є облікові дані
  - Запустити невелике completion для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Задайте `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб справді запустити цей набір; інакше він пропускається, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern` — запуск modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Перевірки modern/all типово мають curated high-signal cap; задайте `OPENCLAW_LIVE_MAX_MODELS=0` для повної modern-перевірки або додатне число для меншого обмеження.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - Типово: зі сховища профілів і з env як резервного варіанта
  - Задайте `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «зламано конвеєр gateway agent»
  - Містить невеликі ізольовані регресії (приклад: OpenAI Responses/Codex Responses reasoning replay + tool-call flows)

### Шар 2: smoke-перевірка Gateway + dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити in-process gateway
  - Створити/пропатчити сеанс `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Перебрати моделі-з-ключами й перевірити:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (read probe)
    - необов’язкові додаткові probe інструментів (exec+read probe)
    - що регресійні шляхи OpenAI (лише tool-call → follow-up) і далі працюють
- Деталі probe (щоб можна було швидко пояснити збої):
  - `read` probe: тест записує nonce-файл у workspace і просить агента `read` його та повернути nonce.
  - `exec+read` probe: тест просить агента через `exec` записати nonce у тимчасовий файл, а потім `read` його назад.
  - image probe: тест додає згенерований PNG (кіт + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - Типово: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — псевдонім для modern allowlist
  - Або задайте `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Перевірки modern/all для gateway типово мають curated high-signal cap; задайте `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для повної modern-перевірки або додатне число для меншого обмеження.
- Як вибирати провайдерів (уникнути «усе через OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Probe інструментів + зображень у цьому live-тесті завжди ввімкнені:
  - `read` probe + `exec+read` probe (навантаження на інструменти)
  - image probe запускається, коли модель рекламує підтримку image input
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG з “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент передає моделі мультимодальне повідомлення користувача
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що можна тестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke-перевірка backend CLI (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent, використовуючи локальний backend CLI, не торкаючись вашої типової конфігурації.
- Типові параметри smoke backend залежать від конкретного розширення і знаходяться у визначенні `cli-backend.ts` розширення-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих плагіна CLI backend-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` — надіслати реальний image attachment (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` — передавати шляхи до файлів зображень як CLI args замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`) — керувати тим, як передаються аргументи зображень, коли задано `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` — надіслати другий хід і перевірити flow відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` — вимкнути типову перевірку безперервності тієї самої сесії Claude Sonnet -> Opus (задайте `1`, щоб примусово її ввімкнути, коли вибрана модель підтримує ціль перемикання).

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

Docker-рецепти для одного провайдера:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker runner розташовано в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke-перевірку CLI-backend усередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані CLI smoke з розширення-власника, а потім встановлює відповідний Linux CLI package (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс за адресою `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносної OAuth-підписки Claude Code через або `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він перевіряє прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI-backend без збереження env-змінних API-ключа Anthropic. Ця ланка підписки типово вимикає probe Claude MCP/tool і image, оскільки Claude зараз маршрутизує використання сторонніх застосунків через виставлення рахунків за додаткове використання замість звичайних лімітів тарифного плану підписки.
- Live smoke-перевірка CLI-backend тепер перевіряє той самий end-to-end потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик інструмента MCP `cron`, перевірений через CLI gateway.
- Типова smoke-перевірка Claude також патчить сеанс із Sonnet на Opus і перевіряє, що відновлений сеанс усе ще пам’ятає попередню нотатку.

## Live: smoke-перевірка ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік ACP conversation-bind із live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне follow-up у тій самій розмові
  - перевірити, що follow-up потрапляє в транскрипт прив’язаного сеансу ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP agents у Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - ACP backend: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.4`
- Примітки:
  - Ця ланка використовує поверхню gateway `chat.send` з доступними лише адміністратору синтетичними полями originating-route, щоб тести могли прив’язувати контекст каналу повідомлень без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів плагіна `acpx` для вибраного ACP harness agent.

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

Docker-рецепти для одного агента:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker runner розташовано в `scripts/test-live-acp-bind-docker.sh`.
- Типово він запускає smoke-перевірку ACP bind послідовно для всіх підтримуваних live CLI agent: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він зчитує `~/.profile`, розміщує відповідні матеріали автентифікації CLI в контейнері, встановлює `acpx` у записуваний npm-префікс, а потім установлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker runner задає `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера зі зчитаного профілю доступними для дочірнього harness CLI.

## Live: smoke-перевірка harness app-server Codex

- Мета: перевірити plugin-власний harness Codex через звичайний метод gateway
  `agent`:
  - завантажити bundled plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `openai/gpt-5.5` із примусово заданим harness Codex
  - надіслати другий хід у той самий сеанс OpenClaw і перевірити, що thread app-server
    може відновитися
  - запустити `/codex status` і `/codex models` через той самий командний
    шлях gateway
  - за потреби запустити дві перевірки escalated shell, перевірені Guardian: одну нешкідливу
    команду, яку слід схвалити, і одне фіктивне завантаження секрету, яке має бути
    відхилене, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.5`
- Необов’язкова image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke-перевірка задає `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний harness Codex
  не міг пройти, тихо перейшовши назад до PI.
- Автентифікація: автентифікація app-server Codex із локального логіна підписки Codex. Docker
  smoke також можуть надавати `OPENAI_API_KEY` для probe, не пов’язаних із Codex, коли це доречно,
  а також за потреби копіювати `~/.codex/auth.json` і `~/.codex/config.toml`.

Локальний рецепт:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker runner розташовано в `scripts/test-live-codex-harness-docker.sh`.
- Він зчитує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації Codex CLI, якщо вони є, встановлює `@openai/codex` у записуваний змонтований npm-префікс,
  розміщує дерево вихідного коду, а потім запускає лише live-тест Codex-harness.
- Docker типово вмикає image, MCP/tool і Guardian probe. Задайте
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий налагоджувальний
  запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, як і конфігурація
  live-тесту, щоб застарілі псевдоніми або резервний перехід до PI не могли приховати регресію
  harness Codex.

### Рекомендовані live-рецепти

Вузькі, явні allowlist — найшвидші й найменш нестабільні:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів через кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує API Gemini (API-ключ).
- `google-antigravity/...` використовує міст Antigravity OAuth (кінцева точка агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний CLI Gemini на вашій машині (окрема автентифікація + особливості інструментів).
- API Gemini проти CLI Gemini:
  - API: OpenClaw викликає розміщений Google API Gemini через HTTP (автентифікація через API-ключ / профіль); саме це більшість користувачів мають на увазі під “Gemini”.
  - CLI: OpenClaw виконує локальний binary `gemini`; він має власну автентифікацію і може поводитися інакше (streaming/tool support/version skew).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» немає (live — за явним увімкненням), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний smoke-набір (виклик інструментів + зображення)

Це запуск «поширених моделей», який, як ми очікуємо, має працювати:

- OpenAI (не Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск gateway smoke з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть принаймні одну модель для кожної сім’ї провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою `tools`, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (attachment → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень у `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити в live matrix (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні endpoint): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «усі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс доступні ключі.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знайти ті самі ключі.
- Якщо live-тест каже «no creds», налагоджуйте це так само, як ви налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «profile keys» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Застарілий каталог стану: `~/.openclaw/credentials/` (копіюється в staged live home, якщо існує, але не є основним сховищем profile keys)
- Локальні live-запуски типово копіюють активну конфігурацію, файли `auth-profiles.json` для окремих агентів, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI у тимчасовий test home; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб probe не торкалися вашого реального workspace хоста.

Якщо ви хочете покладатися на ключі з env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker runners нижче (вони можуть монтувати `~/.profile` у контейнер).

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
- Обсяг:
  - Перевіряє bundled-шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у поданні workflow comfy, polling, завантаженнях або реєстрації plugin

## Live генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований plugin провайдера генерації зображень
  - Завантажує відсутні env-змінні провайдера з вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Проганяє стандартні варіанти генерації зображень через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні bundled-провайдери, що покриваються:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` — примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Live генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний bundled-шлях провайдера генерації музики
  - Наразі покриває Google і MiniMax
  - Завантажує env-змінні провайдера з вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` з вхідними даними лише у вигляді prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної ланки:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не ця спільна перевірка
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` — примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Live генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний bundled-шлях провайдера генерації відео
  - Типово використовує безпечний для релізу smoke-шлях: провайдери без FAL, один запит text-to-video на провайдера, односекундний prompt про лобстера і обмеження операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (типово `180000`)
  - Типово пропускає FAL, оскільки затримка черги на боці провайдера може домінувати над часом релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні провайдера з вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі перед збереженими профілями автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Типово запускає лише `generate`
  - Задайте `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими трансформації, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальний вхід із зображенням на основі buffer у спільній перевірці
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальний вхід із відео на основі buffer у спільній перевірці
  - Поточні провайдери `imageToVideo`, оголошені, але пропущені в спільній перевірці:
    - `vydra`, оскільки bundled `veo3` підтримує лише text, а bundled `kling` потребує віддаленого URL зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс ланку `kling`, яка типово використовує фікстуру віддаленого URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, оголошені, але пропущені в спільній перевірці:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі вимагають віддалених еталонних URL `http(s)` / MP4
    - `google`, оскільки поточна спільна ланка Gemini/Veo використовує локальний вхід на основі buffer, а цей шлях не приймається в спільній перевірці
    - `openai`, оскільки поточна спільна ланка не має гарантій доступу до організаційно-специфічного video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` — включити кожного провайдера до типової перевірки, зокрема FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` — зменшити обмеження операції для кожного провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` — примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через один нативний для репозиторію entrypoint
  - Автоматично завантажує відсутні env-змінні провайдера з `~/.profile`
  - Автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію, за замовчуванням
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker runners (необов’язкові перевірки «працює в Linux»)

Ці Docker runners поділяються на дві категорії:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог конфігурації та workspace (і зчитуючи `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners типово використовують менший smoke-cap, щоб повна Docker-перевірка залишалася практичною:
  `test:docker:live-models` типово задає `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово задає `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для двох Docker live lanes. Він також збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для container smoke runners E2E, які перевіряють зібраний застосунок.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker runners для live-model також bind-mount-ять лише потрібні CLI auth home (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб зовнішній CLI OAuth міг оновлювати токени, не змінюючи сховище автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke-перевірка ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke-перевірка CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-перевірка harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke-перевірка Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-перевірка onboarding/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding з env-ref і типово Telegram, перевіряє, що ввімкнення plugin встановлює його runtime-залежності за потреби, запускає doctor і виконує один mock-хід агента OpenAI. Використовуйте готовий tarball повторно через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-перевірка глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled-провайдери зображень замість зависання. Використовуйте готовий tarball повторно через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш для своїх контейнерів root, update і direct-npm. Smoke-перевірка update типово використовує npm `latest` як стабільну базу перед оновленням до tarball-кандидата. Непривілейовані перевірки installer зберігають ізольований npm-кеш, щоб записи кешу, створені root, не маскували поведінку локального встановлення користувача. Задайте `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm у локальних повторних запусках.
- Install Smoke CI пропускає дубльоване пряме глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальна reasoning-регресія OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає mock-сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, а потім примусово спричиняє відхилення схеми провайдера й перевіряє, що необроблена деталь з’являється в журналах Gateway.
- Міст каналу MCP (ініціалізований Gateway + міст stdio + smoke-перевірка необробленого notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти Pi bundle MCP (реальний stdio MCP server + smoke-перевірка allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke-перевірка plugin update без змін: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-перевірка метаданих config reload: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності bundled plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий Docker runner image, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій Linux-інсталяції. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Під час ітерації звужуйте перевірку runtime-залежностей bundled plugin, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний built-app image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретного набору, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, і далі мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Тести Docker для QR та installer зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не runtime спільного built-app.

Docker runners для live-model також монтують поточний checkout лише для читання й
розміщують його у тимчасовому workdir усередині контейнера. Це зберігає runtime
image компактним, але все одно дозволяє запускати Vitest проти ваших точних локальних source/config.
Крок розміщення пропускає великі локальні кеші й артефакти збірки застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
Gradle output, щоб Docker live-запуски не витрачали хвилини на копіювання
специфічних для машини артефактів.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні worker-процеси каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` і далі запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити покриття gateway
live із цієї Docker-ланки.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
контейнер Gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає прив’язаний контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
image Open WebUI, а самому Open WebUI — завершити власне холодне стартове налаштування.
Ця ланка очікує придатний ключ live-моделі, і `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає ініціалізований
контейнер Gateway, запускає другий контейнер, який стартує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку live event queue, маршрутизацію вихідного надсилання і сповіщення каналу +
дозволів у стилі Claude через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо аналізує необроблені stdio MCP frames, тому smoke-перевірка перевіряє, що
міст насправді надсилає, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує ключа live-моделі.
Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
всередині контейнера, матеріалізує цей сервер через runtime MCP вбудованого bundle Pi,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа live-моделі.
Він запускає ініціалізований Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручна smoke-перевірка ACP plain-language thread (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і зчитується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, зчитані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої CLI-автентифікації
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Зовнішні каталоги/файли CLI-автентифікації в `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначення вручну: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний image `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke-перевірки Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke-перевірка Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити прив’язаний тег image Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли вам також потрібна перевірка заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечно для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, запис config + примусове auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock-виклик інструментів через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- End-to-end потоки майстра, які перевіряють обв’язку сеансу та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічено в prompt, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/args?
- **Контракти workflow:** багатохідні сценарії, які перевіряють порядок інструментів, перенесення історії сеансу й межі sandbox.

Майбутні eval-оцінювання мають залишатися спершу детермінованими:

- Runner сценаріїв, який використовує mock-провайдерів для перевірки викликів інструментів + порядку, читання skill-файлів і обв’язки сеансів.
- Невеликий набір сценаріїв, зосереджених на Skills (використовувати чи уникати, гейтінг, ін’єкція prompt).
- Необов’язкові live eval-оцінювання (за явним увімкненням, керовані env) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає
своєму інтерфейсному контракту. Вони перебирають усі знайдені plugin і запускають набір
перевірок форми та поведінки. Типова unit-ланка `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтесь спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** — базова форма plugin (id, name, capabilities)
- **setup** — контракт майстра налаштування
- **session-binding** — поведінка прив’язки сеансу
- **outbound-payload** — структура payload повідомлення
- **inbound** — обробка вхідних повідомлень
- **actions** — обробники дій channel
- **threading** — обробка ID thread
- **directory** — API directory/roster
- **group-policy** — застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** — probe-перевірки статусу channel
- **registry** — форма реєстру plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** — контракт потоку автентифікації
- **auth-choice** — вибір/визначення автентифікації
- **catalog** — API каталогу моделей
- **discovery** — виявлення plugin
- **loader** — завантаження plugin
- **runtime** — runtime provider
- **shape** — форма/інтерфейс plugin
- **wizard** — майстер налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни plugin channel або provider
- Після рефакторингу реєстрації plugin або виявлення

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену під час live:

- Додайте безпечну для CI регресію, якщо це можливо (mock/stub provider або фіксація точної трансформації форми запиту)
- Якщо це за своєю природою лише live-проблема (rate limit, політики автентифікації), залишайте live-тест вузьким і таким, що вмикається через env-змінні
- Намагайтеся цілити в найменший шар, який ловить помилку:
  - помилка конвертації/повторного програвання запиту provider → тест прямих моделей
  - помилка конвеєра gateway session/history/tool → gateway live smoke або безпечний для CI mock-тест gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується з помилкою для некласифікованих target id, щоб нові класи не можна було тихо пропустити.
