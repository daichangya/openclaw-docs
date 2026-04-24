---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для помилок моделі/провайдера
    - Налагодження поведінки Gateway + agent
summary: 'Набір для тестування: набори unit/e2e/live, Docker runner-и та що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-24T04:15:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf9205861eb454a848866ff30787bb66f83da8d4792efc7e8967a7adf5f1d0fa
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker runner-ів. Цей документ — посібник у стилі «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових workflow (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повна перевірка (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Прямий вибір файлу тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час роботи над однією помилкою спочатку надавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви торкаєтесь тестів або хочете мати більше впевненості:

- Перевірка покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Тихо запустити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker sweep живих моделей: `pnpm test:docker:live-models`
  - Для кожної вибраної моделі тепер виконується текстовий хід плюс невеликий probe у стилі читання файлу.
    Моделі, чиї metadata оголошують підтримку введення `image`, також виконують маленький хід із зображенням.
    Вимкніть додаткові probes через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, який включає окремі Docker matrix jobs живих моделей,
    розшардовані за провайдером.
  - Для цільових повторних запусків у CI викликайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні provider secrets до `scripts/ci-hydrate-live-auth.sh`
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane для шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення із зображенням
    проходять через native plugin binding, а не через ACP.
- Smoke вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє про Moonshot/K2.6 і що
  transcript помічника зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, надавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## Runner-и для QA

Ці команди стоять поряд з основними наборами тестів, коли вам потрібен реалізм qa-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається для відповідних PR і
через ручний запуск із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний запуск із mock parity gate, live Matrix lane і
live Telegram lane під керуванням Convex як паралельними завданнями. `OpenClaw Release Checks`
запускає ті самі смуги перед погодженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway worker-ами. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати кількість
    worker-ів, або `--concurrency 1` для старої послідовної смуги.
  - Завершується з ненульовим кодом, якщо будь-який сценарій падає. Використовуйте `--allow-failures`, коли
    хочете отримати artifacts без збійного коду виходу.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixtures і mock-протоколів без заміни сценарно-орієнтованої смуги `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають у guest підтримувані QA auth inputs, які практично використовувати:
    ключі провайдера на основі env, шлях до конфігурації live-провайдера QA і `CODEX_HOME`, якщо він наявний.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний звіт і підсумок QA, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської роботи з QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивне onboarding OpenAI API key, налаштовує Telegram
    за замовчуванням, перевіряє, що вмикання Plugin встановлює runtime dependencies на вимогу,
    запускає doctor і виконує один локальний хід agent проти mock OpenAI
    endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб виконати ту саму смугу
    packaged-install із Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує й встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    зі сконфігурованим OpenAI, а потім вмикає bundled channel/plugins через редагування config.
  - Перевіряє, що виявлення setup залишає невстановленими runtime dependencies
    для не налаштованих plugin, що перший налаштований запуск Gateway або doctor встановлює runtime dependencies кожного bundled
    plugin на вимогу, і що другий restart не перевстановлює dependencies, які
    вже були активовані.
  - Також встановлює відому старішу базову версію npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>`, і перевіряє, що post-update doctor
    кандидата виправляє runtime dependencies bundled channel без
    postinstall repair на боці harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA host наразі лише для repo/dev. Пакетні встановлення OpenClaw не постачають
    `qa-lab`, тому не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують bundled runner напряму; окремий крок встановлення plugin не потрібен.
  - Налаштовує трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) і одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки смуга локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, підсумок, artifact observed-events і комбінований журнал stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени bot-а driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулів облікових даних. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій падає. Використовуйте `--allow-failures`, коли
    хочете отримати artifacts без збійного коду виходу.
  - Потребує двох різних bot-ів в одній приватній групі, причому bot SUT має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot-ів і переконайтеся, що bot driver може спостерігати bot-трафік у групі.
  - Записує звіт Telegram QA, підсумок і artifact observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту надсилання driver до спостережуваної відповіді SUT.

Live transport lanes мають один спільний стандартний контракт, щоб нові транспорти не відхилялися:

`qa-channel` залишається широким синтетичним набором QA і не входить до matrix покриття live transport.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, підтримує Heartbeat
цієї оренди, поки смуга виконується, і звільняє оренду під час завершення роботи.

Шаблон довідкового проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні env:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні env:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback-URL Convex `http://` лише для локальної розробки.

У звичайному режимі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Адміністративні команди супровідника (add/remove/list для пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для супровідників:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машинозчитуваного виводу в скриптах і утилітах CI.

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
- `groupId` має бути числовим рядком Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання channel до QA

Додавання channel до markdown-системи QA потребує рівно двох речей:

1. Адаптер транспорту для channel.
2. Набір сценаріїв, який перевіряє контракт channel.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
володіти цим потоком.

`qa-lab` володіє спільною механікою хоста:

- коренем команди `openclaw qa`
- запуском і завершенням suite
- concurrency worker-ів
- записом artifacts
- генерацією звітів
- виконанням сценаріїв
- alias сумісності для старіших сценаріїв `qa-channel`

Plugins runner-ів володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як налаштовується gateway для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcripts і нормалізований стан транспорту
- як виконуються дії на базі транспорту
- як обробляються скидання або очищення, специфічні для транспорту

Мінімальний поріг прийняття для нового channel:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Тримайте механіку, специфічну для транспорту, всередині runner Plugin або harness channel.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Plugins runner-ів мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Тримайте `runtime-api.ts` легким; ліниві CLI і виконання runner-ів мають залишатися за окремими entrypoint-ами.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні helper-и сценаріїв для нових сценаріїв.
7. Зберігайте працездатність наявних alias сумісності, якщо репозиторій не виконує навмисну міграцію.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, тримайте її в цьому runner Plugin або harness Plugin.
- Якщо сценарію потрібна нова можливість, яку може використати більше ніж один channel, додавайте загальний helper замість channel-specific гілки в `suite.ts`.
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

Alias сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Для нової роботи з channel слід використовувати загальні назви helper-ів.
Alias сумісності існують, щоб уникнути міграції в один день, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалізму» (і зростання флакi, вартості):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shard-ів `vitest.full-*.config.ts` і можуть розгортати multi-project shard-и в конфігурації для окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, які покриває `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Внутрішньопроцесні integration-тести (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
    <AccordionGroup>
    <Accordion title="Проєкти, shard-и та смуги з обмеженням за обсягом"> - Нецільові запуски `pnpm test` використовують дванадцять менших конфігурацій shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу native root-project. Це зменшує піковий RSS на навантажених машинах і не дає роботі auto-reply/extension витісняти не пов’язані набори. - `pnpm test --watch` і далі використовує native граф проєктів root `vitest.config.ts`, тому що цикл watch із багатьма shard-ами непрактичний. - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі file/directory через смуги з обмеженням за обсягом, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не платить повну ціну запуску root project. - `pnpm test:changed` розгортає змінені git-шляхи в ті самі смуги з обмеженням за обсягом, коли diff торкається лише маршрутизованих source/test файлів; редагування config/setup усе ще повертаються до широкого повторного запуску root project. - `pnpm check:changed` — це звичайна розумна локальна перевірка для вузької роботи. Вона класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні смуги typecheck/lint/test. Зміни в публічному Plugin SDK і plugin-contract включають один прохід перевірки extension, оскільки extensions залежать від цих core contracts. Зміни лише у version bump release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни package поза полем версії верхнього рівня. - Unit-тести з легкими імпортами з agents, commands, plugins, helper-ів auto-reply, `plugin-sdk` та подібних чистих утилітних ділянок маршрутизуються через смугу `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом/важким runtime залишаються в наявних смугах. - Вибрані helper source files у `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними sibling tests у цих легких смугах, тож редагування helper-ів не призводять до повторного запуску повного важкого набору для цього каталогу. - `auto-reply` має три окремі кошики: helper-и core верхнього рівня, integration-тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це не дає найважчій harness-роботі reply потрапляти до дешевих тестів status/chunk/token.
    </Accordion>

      <Accordion title="Покриття embedded runner">
        - Коли ви змінюєте входи виявлення message-tool або runtime-контекст
          Compaction, зберігайте обидва рівні покриття.
        - Додавайте сфокусовані helper-регресії для чистих меж routing і
          нормалізації.
        - Підтримуйте справність наборів integration для embedded runner:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Ці набори перевіряють, що scoped ids і поведінка Compaction і далі проходять
          через реальні шляхи `run.ts` / `compact.ts`; тести лише для helper-ів
          не є достатньою заміною для цих integration-шляхів.
      </Accordion>

      <Accordion title="Типові налаштування pool і ізоляції Vitest">
        - Базова конфігурація Vitest типово використовує `threads`.
        - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
          runner без ізоляції для root projects, а також конфігурацій e2e і live.
        - Root UI lane зберігає свій `jsdom` setup і optimizer, але теж працює на
          спільному runner без ізоляції.
        - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
          зі спільної конфігурації Vitest.
        - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-
          процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
          Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.
      </Accordion>

      <Accordion title="Швидка локальна ітерація">
        - `pnpm changed:lanes` показує, які архітектурні смуги запускає diff.
        - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staging і
          не запускає lint, typecheck або тести.
        - Запускайте `pnpm check:changed` явно перед передачею роботи або push, коли
          вам потрібна розумна локальна перевірка. Зміни в публічному Plugin SDK і plugin-contract
          включають один прохід перевірки extension.
        - `pnpm test:changed` маршрутизує виконання через смуги з обмеженням за обсягом, коли змінені шляхи
          чисто зіставляються з меншим набором.
        - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
          лише з вищою межею worker-ів.
        - Автомасштабування локальних worker-ів навмисно консервативне й зменшує навантаження,
          коли середнє навантаження хоста вже високе, тож кілька одночасних
          запусків Vitest типово завдають менше шкоди.
        - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як
          `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли
          змінюється wiring тестів.
        - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
          хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
          одну явну локацію кешу для прямого профілювання.
      </Accordion>

      <Accordion title="Налагодження продуктивності">
        - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
          вивід розподілу імпортів.
        - `pnpm test:perf:imports:changed` обмежує той самий профілювальний вигляд
          файлами, зміненими від `origin/main`.
        - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
          тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
          напряму mock-айте цей seam замість deep-import runtime helper-ів лише для того,
          щоб передати їх у `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
          `test:changed` з native шляхом root-project для цього зафіксованого diff і виводить загальний час плюс max RSS на macOS.
        - `pnpm test:perf:changed:bench -- --worktree` бенчмаркає поточне брудне дерево,
          маршрутизуючи список змінених файлів через
          `scripts/test-projects.mjs` і root-конфігурацію Vitest.
        - `pnpm test:perf:profile:main` записує CPU profile головного потоку для
          накладних витрат запуску і трансформації Vitest/Vite.
        - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner-а для
          unit-набору з вимкненим файловим паралелізмом.
      </Accordion>
    </AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово з одним worker-ом
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Пропускає синтетичний churn gateway message, memory і large-payload через шлях діагностичних подій
  - Виконує запити до `diagnostics.stability` через Gateway WS RPC
  - Покриває helper-и збереження пакета stability diagnostics
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS не перевищують бюджет тиску, а глибини черг для кожної сесії повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька смуга для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled plugins у `extensions/`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість worker-ів (CI: до 2, локально: 1 за замовчуванням).
  - Працює в тихому режимі за замовчуванням, щоб зменшити накладні витрати на I/O консолі.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість worker-ів (не більше 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - End-to-end-поведінка gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, pairing Node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в конвеєрі)
  - Реальні ключі не потрібні
  - Має більше рухомих частин, ніж unit-тести (може бути повільнішим)

### E2E: smoke для бекенду OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє канонічну для віддаленого середовища поведінку файлової системи через міст fs sandbox
- Очікування:
  - Лише за явного ввімкнення; не входить до типового запуску `pnpm test:e2e`
  - Потребує локальний CLI `openshell` і робочий Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, після чого знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` щоб указати нестандартний CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled plugins у `extensions/`
- Типова поведінка: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей provider/model працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем auth і поведінки rate limit
- Очікування:
  - За дизайном не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / витрачає rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні API keys.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють config/auth-матеріали до тимчасового test home, щоб unit-fixtures не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише коли свідомо хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і приглушує журнали запуску gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація API key (залежно від провайдера): установлюйте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на повідомлення про rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб було видно активність довгих викликів провайдера, навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/gateway одразу передавалися під час live-запусків.
  - Налаштовуйте Heartbeat для прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змін було багато)
- Торкаєтесь мережевої взаємодії gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій bot не працює» / збої, специфічні для провайдера / виклики інструментів: запускайте звужений `pnpm test:live`

## Live-тести (із доступом до мережі)

Для live matrix моделей, smoke для бекендів CLI, smoke для ACP, harness
app-server Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також для обробки облікових даних під час live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker runner-и (необов’язкові перевірки «працює в Linux»)

Ці Docker runner-и поділяються на дві категорії:

- Runner-и живих моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний їм live-файл з ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint-и: `test:live:models-profiles` і `test:live:gateway-profiles`.
- За замовчуванням Docker runner-и live використовують менший ліміт smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` за замовчуванням має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  свідомо хочете більший вичерпний прогін.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для двох Docker lane-ів live. Він також збирає один спільний image `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для контейнерних E2E smoke runner-ів, які перевіряють already built app.

Docker runner-и живих моделей також монтують лише потрібні auth home для CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke бекенду CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding env-ref плюс Telegram за замовчуванням, перевіряє, що ввімкнення Plugin встановлює його runtime deps на вимогу, запускає doctor і виконує один хід agent проти mock OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть channel через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із already built Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke інсталятора Docker: `bash scripts/test-install-sh-docker.sh` використовує один спільний npm cache для своїх контейнерів root, update і direct-npm. Smoke оновлення за замовчуванням використовує npm `latest` як стабільну базову версію перед оновленням до tarball кандидата. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи кешу, створені root, не маскували поведінку локального встановлення користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm у локальних повторних запусках.
- Install Smoke CI пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальна reasoning-регресія `web_search` для OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає mock OpenAI server через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення provider schema і перевіряє, що сирі деталі з’являються в журналах Gateway.
- Міст channel MCP (seeded Gateway + stdio bridge + raw Claude smoke notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти Pi bundle MCP (реальний stdio MCP server + smoke allow/deny для вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke + alias `/plugin` + семантика restart для bundle Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps bundled plugins: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий Docker runner image, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен Linux-сценарій інсталяції. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте host rebuild після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вказуйте на наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Звужуйте перевірку runtime deps bundled plugins під час ітерацій, вимикаючи нерелевантні сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний image already built app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретного набору, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, як і раніше мають пріоритет, якщо встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та installer зберігають власні Dockerfile, тому що вони перевіряють поведінку пакування/встановлення, а не спільне runtime already built app.

Docker runner-и живих моделей також монтують поточний checkout лише для читання і
розгортають його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, але все одно запускає Vitest точно на вашому локальному source/config.
Під час цього етапу пропускаються великі локальні кеші й outputs збірки застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальні worker-и channel на кшталт Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити покриття gateway
live із цього Docker lane.
`test:docker:openwebui` — це smoke вищого рівня на сумісність: він запускає
контейнер gateway OpenClaw з увімкненими HTTP endpoints, сумісними з OpenAI,
запускає pinned контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, тому що Docker може потребувати завантаження
image Open WebUI, а Open WebUI — завершення власного cold-start setup.
Ця смуга очікує наявності придатного ключа live model, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом передати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального акаунта Telegram, Discord або iMessage. Він запускає seeded контейнер
Gateway, стартує другий контейнер, який запускає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутованих conversation, читання transcript, metadata вкладень,
поведінку черги live events, маршрутизацію вихідного надсилання й сповіщення про channel +
дозволи в стилі Claude через реальний міст stdio MCP. Перевірка сповіщень
безпосередньо перевіряє сирі кадри stdio MCP, тож smoke перевіряє те, що міст
справді виводить, а не лише те, що випадково показує певний client SDK.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує
ключа live model. Він збирає Docker image репозиторію, запускає всередині контейнера
реальний probe-сервер stdio MCP, матеріалізує цей сервер через вбудоване runtime
Pi bundle MCP, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live model.
Він запускає seeded Gateway з реальним probe-сервером stdio MCP, виконує ізольований
хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke простомовного thread ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Залишайте цей скрипт для workflow регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації thread ACP, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` щоб перевіряти лише env vars, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування auth зовнішніх CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установлень CLI всередині Docker
- Зовнішні каталоги/файли auth CLI під `$HOME` монтуються лише для читання в `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Для звужених запусків провайдерів монтуються лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ручне перевизначення: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` щоб відфільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1` щоб повторно використовувати наявний image `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` щоб переконатися, що облікові дані надходять зі сховища profile, а не з env
- `OPENCLAW_OPENWEBUI_MODEL=...` щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` щоб перевизначити prompt перевірки nonce, який використовується в smoke Open WebUI
- `OPENWEBUI_IMAGE=...` щоб перевизначити pinned tag image Open WebUI

## Перевірка документації

Запускайте перевірки docs після редагування docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків у межах сторінок: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний gateway + agent loop): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, примусовий запис config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності agent (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності agent»:

- Mock tool-calling через реальний gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end-потоки wizard, які перевіряють wiring сесії та ефекти config (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічено в prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає agent `SKILL.md` перед використанням і чи дотримується обов’язкових кроків/args?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні eval-и мають насамперед залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання skill files і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на Skills (використати чи уникнути, gating, prompt injection).
- Необов’язкові live eval-и (opt-in, керовані env) лише після того, як безпечний для CI набір буде готовий.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
інтерфейсному контракту. Вони перебирають усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit-смуга `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтесь спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (`id`, `name`, `capabilities`)
- **setup** - Контракт wizard setup
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка thread ID
- **directory** - API directory/roster
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
- **registry** - Форма registry Plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/selection auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Wizard setup

### Коли запускати

- Після зміни export-ів або subpath-ів plugin-sdk
- Після додавання або зміни channel чи provider Plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних API keys.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додавайте безпечну для CI регресію, якщо це можливо (mock/stub provider або фіксація точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), залишайте live-тест вузьким і opt-in через env vars
- Надавайте перевагу найменшому рівню, який виявляє помилку:
  - помилка конвертації/повторення запиту provider → direct models test
  - помилка pipeline gateway session/history/tool → live smoke gateway або безпечний для CI mock-тест gateway
- Захисне правило для обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить один вибірковий target для кожного класу SecretRef з metadata registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids у traversal-segment відхиляються.
  - Якщо ви додаєте нову сім’ю target-ів SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було пропустити безшумно.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
