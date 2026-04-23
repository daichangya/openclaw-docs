---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: модульні/e2e/live набори тестів, runners Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-23T22:45:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57fce59b28490a2a1e5d434fe05ef94356d76adf4bf6d7165d03d1a05df9f3bd
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір runners Docker. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір тестів (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести виявляють облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на машині з достатніми ресурсами: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над окремим збоєм спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-смуга на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір e2e: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Набір live (моделі + зонди інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невеликий зонд у стилі читання файлу.
    Моделі, у чиїх метаданих заявлено вхід `image`, також виконують мініатюрний хід із зображенням.
    Вимкніть додаткові зонди через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, який включає окремі матричні завдання Docker для live-моделей,
    розшардовані за провайдерами.
  - Для цільових повторних запусків у CI викликайте `OpenClaw Live And E2E Checks (Reusable)` з
    `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів у `scripts/ci-hydrate-live-auth.sh`,
    а також у `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    заплановані/релізні виклики.
- Перевірка вартості Moonshot/Kimi: якщо задано `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє про Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізоване `usage.cost`.

Порада: якщо вам потрібен лише один проблемний випадок, звужуйте live-тести через env-змінні allowlist, описані нижче.

## Спеціалізовані runners для QA

Ці команди розташовані поруч з основними наборами тестів, коли вам потрібна реалістичність qa-lab:

CI запускає QA Lab в окремих workflows. `Parity gate` запускається для відповідних PR і
з ручного виклику з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного виклику з mock parity gate, live-смугою Matrix і live-смугою Telegram,
керованою Convex, як паралельні завдання. `OpenClaw Release Checks`
запускає ті самі смуги перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на базі репозиторію безпосередньо на хості.
  - Типово запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками Gateway. `qa-channel` типово має concurrency 4 (обмежене
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб
    налаштувати кількість працівників, або `--concurrency 1` для старішої послідовної смуги.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`,
    якщо вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстурами та mock-протоколом без заміни сценарно-орієнтованої
    смуги `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають у гостьове середовище підтримувані вхідні дані автентифікації QA, які є практичними:
    ключі провайдерів на основі env, шлях до конфігурації live-провайдера QA і `CODEX_HOME`, якщо наявний.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гість міг записувати назад
    через змонтований workspace.
  - Записує звичайний звіт QA + підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторського QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивний онбординг ключа OpenAI API, типово налаштовує Telegram,
    перевіряє, що ввімкнення plugin встановлює runtime-залежності на вимогу,
    запускає doctor і виконує один локальний хід агента проти mock-endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму
    смугу packaged-install із Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує й установлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає runtime-залежності
    неналаштованих plugins відсутніми, що перший налаштований запуск Gateway або doctor
    встановлює runtime-залежності кожного bundled plugin на вимогу, і що другий перезапуск
    не перевстановлює залежності, які вже були активовані.
  - Також установлює відомий старіший базовий npm-пакет, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що
    post-update doctor у кандидата відновлює runtime-залежності bundled channel
    без відновлення postinstall з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-смугу Matrix проти одноразового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Упаковані інсталяції OpenClaw не постачають
    `qa-lab`, тому не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують bundled runner безпосередньо; окремий крок встановлення plugin не потрібен.
  - Надає трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) і одну приватну кімнату, а потім запускає дочірній QA gateway з реальним plugin Matrix як транспортом SUT.
  - Типово використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки смуга локально створює одноразових користувачів.
  - Записує звіт Matrix QA, підсумок, артефакт observed-events і комбінований лог виводу stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live QA-смугу Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потрібні `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим id чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулінгованих облікових даних. Типово використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб перейти на пулінговані оренди.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`,
    якщо вам потрібні артефакти без коду завершення з помилкою.
  - Потрібні два різні боти в одній приватній групі, причому бот SUT має мати username Telegram.
  - Для стабільного спостереження бот-до-бота ввімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на відправлення driver до спостереженої відповіді SUT.

Live-смуги транспорту мають один спільний стандартний контракт, щоб нові транспорти не відхилялися від нього:

`qa-channel` залишається широким синтетичним QA-набором і не входить до матриці покриття live-транспорту.

| Смуга    | Canary | Mention gating | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження реакцій | Команда help |
| -------- | ------ | -------------- | -------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | --------------------- | ------------ |
| Matrix   | x      | x              | x                    | x                         | x                             | x                          | x               | x                     |              |
| Telegram | x      |                |                      |                           |                               |                            |                 |                       | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
qa-lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди, поки смуга працює, і звільняє оренду під час завершення роботи.

Довідковий шаблон проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env-змінні:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові env-змінні:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі має використовувати `https://`.

Адміністративні команди maintainer (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машинозчитуваного виводу в скриптах і CI-утилітах.

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
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим id чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до системи markdown QA потребує рівно двох речей:

1. Адаптер транспорту для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний вузол верхнього рівня, коли спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` керує спільною механікою хоста:

- кореневий вузол команди `openclaw qa`
- запуском і завершенням suite
- паралелізмом workers
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner plugins керують транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти й нормалізований стан транспорту
- як виконуються дії на основі транспорту
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг упровадження для нового каналу:

1. Зберігайте `qa-lab` як власника спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Зберігайте механіку, специфічну для транспорту, всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючий кореневий вузол команди.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Зберігайте `runtime-api.ts` легким; лінивий CLI і виконання runner мають залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Для нових сценаріїв використовуйте узагальнені helper.
7. Зберігайте наявні compatibility aliases працездатними, якщо тільки репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, зберігайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте узагальнений helper замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, зберігайте сценарій специфічним для цього транспорту й явно зазначайте це в контракті сценарію.

Бажані назви узагальнених helper для нових сценаріїв:

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

Нова робота над каналами має використовувати узагальнені назви helper.
Compatibility aliases існують, щоб уникнути міграції в стилі flag day, а не як модель
для написання нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «щораз реалістичніші» (і щораз більш нестабільні/дорогі):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: ненаправлені запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в конфігурації на рівні окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, що покриваються `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Інтеграційні тести в межах процесу (автентифікація Gateway, маршрутизація, інструментарій, парсинг, конфігурація)
  - Детерміновані регресійні тести для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
    <AccordionGroup>
    <Accordion title="Проєкти, шарди та scoped lanes"> - Ненаправлений `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного величезного нативного кореневого процесу проєкту. Це зменшує піковий RSS на завантажених машинах і не дає роботі `auto-reply`/extensions виснажувати не пов’язані набори. - `pnpm test --watch` і далі використовує нативний граф проєктів кореня `vitest.config.ts`, оскільки цикл спостереження з багатьма шардами непрактичний. - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу маршрутизують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не змушує платити за повний запуск кореневого проєкту. - `pnpm test:changed` розгортає змінені шляхи git у ті самі scoped lanes, коли diff торкається лише маршрутизованих файлів вихідного коду/тестів; редагування config/setup усе ще повертаються до широкого повторного запуску кореневого проєкту. - `pnpm check:changed` — це звичайний розумний локальний gate для вузьких змін. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, метадані релізу та tooling, а потім запускає відповідні typecheck/lint/test lanes. Зміни публічного Plugin SDK і plugin-contract включають валідацію extension, бо extensions залежать від цих контрактів core. Для змін лише в метаданих релізу з підвищенням версії запускаються цільові перевірки version/config/root-dependency замість повного набору, із захистом, що відхиляє зміни package поза полем версії верхнього рівня. - Легкі щодо імпортів unit-тести з agents, commands, plugins, helper `auto-reply`, `plugin-sdk` та подібних чистих утилітних областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; файли зі станом/важкі щодо runtime залишаються на наявних lanes. - Вибрані helper-файли вихідного коду `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними sibling-тестами в цих легких lanes, тому редагування helper не змушують повторно запускати весь важкий набір для цього каталогу. - `auto-reply` має три окремі бакети: helper верхнього рівня core, інтеграційні тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це не дає найважчій роботі harness `reply` потрапляти на дешеві тести status/chunk/token.
    </Accordion>

      <Accordion title="Покриття embedded runner">
        - Коли ви змінюєте вхідні дані виявлення message-tool або контекст runtime Compaction, зберігайте обидва рівні покриття.
        - Додавайте вузькоспрямовані helper-регресії для чистих меж маршрутизації та нормалізації.
        - Підтримуйте інтеграційні набори embedded runner у справному стані:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Ці набори перевіряють, що scoped id і поведінка Compaction і далі проходять
          реальними шляхами `run.ts` / `compact.ts`; тести лише для helper не є достатньою заміною для цих інтеграційних шляхів.
      </Accordion>

      <Accordion title="Типові значення пулу та ізоляції Vitest">
        - Базова конфігурація Vitest типово використовує `threads`.
        - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
          неізольований runner у кореневих проєктах, конфігураціях e2e і live.
        - Коренева UI lane зберігає свій `jsdom` setup та optimizer, але теж працює на
          спільному неізольованому runner.
        - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
        - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
          Задайте `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
          поведінкою V8.
      </Accordion>

      <Accordion title="Швидка локальна ітерація">
        - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
        - Хук pre-commit запускає `pnpm check:changed --staged` після staged
          formatting/linting, тому коміти лише core не оплачують вартість тестів extension,
          якщо вони не торкаються публічних контрактів, орієнтованих на extension. Коміти лише з
          метаданими релізу залишаються на цільовій lane
          version/config/root-dependency.
        - Якщо точний staged-набір змін уже був перевірений
          gate-перевірками не слабшими або сильнішими, використовуйте
          `scripts/committer --fast "<message>" <files...>`, щоб пропустити лише повторний запуск хука changed-scope. Staged format/lint усе ще запускаються. Згадайте
          виконані gate-перевірки у вашому handoff. Це також допустимо після повторного запуску ізольованого нестабільного хука, якщо він проходить із scoped-доказом.
        - `pnpm test:changed` маршрутизується через scoped lanes, коли змінені шляхи
          чітко відповідають меншому набору.
        - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
          лише з вищим лімітом workers.
        - Автоматичне масштабування локальних workers навмисно консервативне і знижує навантаження,
          коли середнє навантаження хоста вже високе, тому кілька одночасних
          запусків Vitest типово завдають менше шкоди.
        - Базова конфігурація Vitest позначає проєкти/файли конфігурації як
          `forceRerunTriggers`, тож повторні запуски в режимі changed лишаються коректними,
          коли змінюється зв’язування тестів.
        - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на
          підтримуваних хостах; задайте `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
          одну явну локацію кешу для прямого профілювання.
      </Accordion>

      <Accordion title="Налагодження продуктивності">
        - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпорту плюс
          вивід розбивки імпортів.
        - `pnpm test:perf:imports:changed` звужує той самий вигляд профілювання до
          файлів, змінених від `origin/main`.
        - Коли один гарячий тест усе ще витрачає більшість часу на імпорти під час запуску,
          зберігайте важкі залежності за вузьким локальним seam `*.runtime.ts` і mock-айте цей seam безпосередньо замість глибоких імпортів helper runtime лише для того, щоб передати їх через `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
          `test:changed` з нативним шляхом кореневого проєкту для цього зафіксованого
          diff і виводить wall time плюс macOS max RSS.
        - `pnpm test:perf:changed:bench -- --worktree` вимірює поточне брудне дерево,
          маршрутизуючи список змінених файлів через
          `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
        - `pnpm test:perf:profile:main` записує профіль CPU головного потоку для накладних витрат запуску й трансформації Vitest/Vite.
        - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для
          unit-набору з вимкненим паралелізмом файлів.
      </Accordion>
    </AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Проганяє синтетичне churn повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Виконує запити до `diagnostics.stability` через WS RPC Gateway
  - Покриває helper збереження пакетів діагностики стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS лишаються в межах бюджету тиску, а глибини черг на сесію повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька lane для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (smoke-тести gateway)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled plugin у `extensions/`
- Типові параметри runtime:
  - Використовує `threads` у Vitest з `isolate: false`, як і в решті репозиторію.
  - Використовує адаптивну кількість workers (CI: до 2, локально: 1 за замовчуванням).
  - Типово запускається в тихому режимі, щоб зменшити накладні витрати на консольний I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний консольний вивід.
- Обсяг:
  - Наскрізна поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, парування Node і важчі мережеві сценарії
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Має більше рухомих частин, ніж unit-тести (може бути повільнішим)

### E2E: smoke-тест бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox з тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє поведінку файлової системи з віддаленим канонічним доступом через bridge файлової системи sandbox
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локальний CLI `openshell` і працездатний Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, після чого знищує тестовий Gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний CLI-бінарний файл або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (задає `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдерів, особливостей виклику інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - Навмисно не є CI-стабільним (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limit
  - Переважно запускайте звужені піднабори, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий тестовий home, щоб unit-фікстури не могли змінювати ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і приглушує логи bootstrap Gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні логи запуску.
- Ротація API-ключів (залежно від провайдера): задавайте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях із rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів помітно активні, навіть коли перехоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway відразу транслювалися під час live-запусків.
  - Налаштовуйте Heartbeat прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat Gateway/зондів через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Користуйтеся цією таблицею рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої взаємодії Gateway / протоколу WS / парування: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live: прогін можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, що зараз оголошена** підключеним Android Node, і перевірити поведінку контракту команд.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/не запускає/не виконує парування застосунку).
  - Перевірка `node.invoke` Gateway для вибраного Android Node, команда за командою.
- Необхідне попереднє налаштування:
  - Android-застосунок уже підключений і спарений із gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте як успішні.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke-тест моделей (ключі профілів)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Пряма модель» повідомляє нам, чи може провайдер/модель взагалі відповісти з даним ключем.
- «Smoke-тест Gateway» повідомляє нам, чи працює для цієї моделі повний pipeline gateway+agent (сесії, історія, інструменти, політика sandbox тощо).

### Шар 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике completion для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб цей набір справді запускався; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на smoke-тестах gateway
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Прогони modern/all за замовчуванням обмежені ретельно підібраною високосигнальною межею; задайте `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern-прогону або додатне число для меншої межі.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні варіанти з env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ невалідний» від «pipeline агента gateway зламаний»
  - Містить невеликі ізольовані регресії (приклад: повторне відтворення reasoning для OpenAI Responses/Codex Responses + потоки tool-call)

### Шар 2: smoke-тест Gateway + dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити gateway у межах процесу
  - Створити/оновити сесію `agent:dev:*` (з перевизначенням моделі для кожного запуску)
  - Ітерувати за моделями з ключами і перевіряти:
    - «змістовну» відповідь (без інструментів)
    - що реальний виклик інструмента працює (зонд read)
    - необов’язкові додаткові зонди інструментів (зонд exec+read)
    - що регресійні шляхи OpenAI (лише tool-call → подальший крок) і далі працюють
- Деталі зондів (щоб ви могли швидко пояснювати збої):
  - зонд `read`: тест записує nonce-файл у workspace і просить агента `read` його та повернути nonce у відповіді.
  - зонд `exec+read`: тест просить агента записати nonce у тимчасовий файл через `exec`, а потім зчитати його назад через `read`.
  - зонд зображення: тест прикріплює згенерований PNG (кіт + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - За замовчуванням: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для сучасного allowlist
  - Або задайте `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Прогони modern/all для gateway за замовчуванням обмежені ретельно підібраною високосигнальною межею; задайте `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern-прогону або додатне число для меншої межі.
- Як вибирати провайдерів (уникати «OpenRouter everything»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Зонди інструментів і зображень у цьому live-тесті завжди увімкнені:
  - зонд `read` + зонд `exec+read` (навантаження на інструменти)
  - зонд зображення запускається, коли модель заявляє підтримку введення зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG з “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент пересилає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що саме можна протестувати на вашій машині (і точні id `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke-тест бекенда CLI (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити pipeline Gateway + agent за допомогою локального CLI-бекенда, не торкаючись вашої типової конфігурації.
- Типові параметри smoke-тесту для конкретного бекенда знаходяться у визначенні `cli-backend.ts` відповідного extension.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image надходить із метаданих plugin відповідного CLI-бекенда.
- Перевизначення (необов’язкові):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли задано `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типовий зонд безперервності в тій самій сесії Claude Sonnet -> Opus (задайте `1`, щоб примусово ввімкнути його, коли вибрана модель підтримує ціль перемикання).

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

- Docker runner розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke-тест CLI-бекенда всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані CLI smoke-тесту з extension-власника, а потім встановлює відповідний пакет Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс за адресою `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносної OAuth-підписки Claude Code через або `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він підтверджує прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI-бекенда без збереження env-змінних API-ключа Anthropic. Ця смуга підписки типово вимикає зонди Claude MCP/tool і image, оскільки Claude наразі маршрутизує використання сторонніх застосунків через тарифікацію додаткового використання, а не через звичайні ліміти тарифного плану підписки.
- Live smoke-тест CLI-бекенда тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через CLI gateway.
- Типовий smoke-тест Claude також патчить сесію з Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язки розмови ACP із live ACP-агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайний подальший крок у тій самій розмові
  - перевірити, що подальший крок потрапляє в транскрипт прив’язаної сесії ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP-агенти в Docker: `claude,codex,gemini`
  - ACP-агент для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - ACP-бекенд: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.4`
- Примітки:
  - Ця смуга використовує поверхню gateway `chat.send` з синтетичними полями originating-route, доступними лише адміністратору, щоб тести могли приєднувати контекст message-channel без удавання зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів plugin `acpx` для вибраного ACP harness agent.

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

- Docker runner розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає ACP bind smoke проти всіх підтримуваних live CLI-агентів послідовно: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він підключає `~/.profile`, розміщує відповідні матеріали CLI-auth у контейнері, установлює `acpx` у записуваний npm-префікс, а потім установлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker runner задає `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера з підключеного профілю доступними для дочірнього harness CLI.

## Live: smoke-тест harness app-server Codex

- Мета: перевірити harness Codex, що належить plugin, через звичайний метод gateway
  `agent`:
  - завантажити bundled plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід агента gateway до `openai/gpt-5.5` із примусовим використанням harness Codex
  - надіслати другий хід у ту саму сесію OpenClaw і перевірити, що потік
    app-server може відновитися
  - виконати `/codex status` і `/codex models` через той самий командний шлях gateway
  - за бажанням виконати два ескальовані shell-зонди, перевірені Guardian: одну безпечну
    команду, яку слід схвалити, і одне фальшиве вивантаження секрету, яке має бути
    відхилене, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.5`
- Необов’язковий image-зонд: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язковий MCP/tool-зонд: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язковий зонд Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke-тест задає `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний harness Codex
  не міг пройти перевірку, тихо повернувшись до PI.
- Auth: `OPENAI_API_KEY` з оболонки/профілю, плюс необов’язково скопійовані
  `~/.codex/auth.json` і `~/.codex/config.toml`

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

- Docker runner розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він підключає змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  auth CLI Codex, якщо вони є, установлює `@openai/codex` у записуваний змонтований npm-префікс,
  розміщує дерево вихідного коду, а потім запускає лише live-тест Codex-harness.
- Docker типово вмикає зонди image, MCP/tool і Guardian. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли вам потрібен вужчий налагоджувальний
  запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, що збігається з live-
  конфігурацією тесту, тож застарілі aliases або fallback до PI не можуть приховати
  регресію harness Codex.

### Рекомендовані live-рецепти

Вузькі явні allowlist — найшвидші та найменш нестабільні:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, smoke-тест gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів у кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст Antigravity OAuth (endpoint агента в стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема auth + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API-ключ / auth профілю); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний бінарний файл `gemini`; він має власну auth і може поводитися інакше (streaming/підтримка інструментів/розходження версій).

## Live: матриця моделей (що ми покриваємо)

Немає фіксованого «списку моделей CI» (live — opt-in), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний набір smoke-тестів (виклик інструментів + image)

Це запуск «типових моделей», який ми очікуємо зберігати працездатним:

- OpenAI (не-Codex): `openai/gpt-5.5` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex OAuth: `openai/gpt-5.5` (`openai-codex/gpt-*` залишається застарілим alias)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск smoke-тесту gateway з інструментами + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язково Exec)

Виберіть щонайменше одну модель для кожної сім’ї провайдерів:

- OpenAI: `openai/gpt-5.5` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (добре мати):

- xAI: `xai/grok-4` (або найновішу доступну)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою інструментів, яку ви ввімкнули)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання image (вкладення → мультимодальне повідомлення)

Додайте щонайменше одну модель із підтримкою image до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI із підтримкою vision тощо), щоб перевірити image-зонд.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (auth через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до live-матриці (якщо у вас є creds/config):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoint): `minimax` (хмара/API), а також будь-який OpenAI/Anthropic-сумісний проксі (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати «всі моделі» в документації. Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині + які ключі доступні.

## Облікові дані (ніколи не комітьте)

Live-тести виявляють облікові дані так само, як CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі auth для кожного агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «ключі профілів» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Застарілий каталог стану: `~/.openclaw/credentials/` (копіюється у staged live home, якщо наявний, але не є основним сховищем ключів профілів)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного агента, застарілий `credentials/` і підтримувані зовнішні каталоги auth CLI до тимчасового тестового home; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб зонди не торкалися вашого реального робочого простору хоста.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker runners нижче (вони можуть монтувати `~/.profile` у контейнер).

## Deepgram live (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє bundled шляхи comfy image, video і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін подання workflow comfy, polling, завантажень або реєстрації plugin

## Image generation live

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований plugin-провайдер генерації image
  - Завантажує відсутні env-змінні провайдерів із вашої оболонки входу (`~/.profile`) перед виконанням зондів
  - За замовчуванням використовує API-ключі live/env раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатних auth/профілю/моделі
  - Проганяє стандартні варіанти генерації image через спільну runtime-можливість:
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
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth сховища профілів і ігнорувати перевизначення лише через env

## Music generation live

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний bundled-шлях провайдера генерації music
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні провайдерів із вашої оболонки входу (`~/.profile`) перед виконанням зондів
  - За замовчуванням використовує API-ключі live/env раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатних auth/профілю/моделі
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` з введенням лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, а не цей спільний прогін
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth сховища профілів і ігнорувати перевизначення лише через env

## Video generation live

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний bundled-шлях провайдера генерації video
  - За замовчуванням використовує безпечний для релізу smoke-шлях: не-FAL провайдери, один запит text-to-video на провайдера, односекундний lobster prompt і обмеження операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (типово `180000`)
  - Типово пропускає FAL, оскільки затримка черги на стороні провайдера може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні провайдерів із вашої оболонки входу (`~/.profile`) перед виконанням зондів
  - За замовчуванням використовує API-ключі live/env раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатних auth/профілю/моделі
  - Типово запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими трансформації, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальне введення image на основі buffer у спільному прогоні
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальне введення video на основі buffer у спільному прогоні
  - Поточні провайдери `imageToVideo`, оголошені, але пропущені у спільному прогоні:
    - `vydra`, оскільки bundled `veo3` підтримує лише text, а bundled `kling` потребує віддалений URL image
  - Покриття, специфічне для провайдера Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс lane `kling`, яка за замовчуванням використовує віддалений URL image як фікстуру
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, оголошені, але пропущені у спільному прогоні:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі потребують віддалених референсних URL `http(s)` / MP4
    - `google`, оскільки поточна спільна lane Gemini/Veo використовує локальне введення на основі buffer, а цей шлях не приймається у спільному прогоні
    - `openai`, оскільки поточна спільна lane не гарантує доступ до org-специфічних можливостей video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типового прогону, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження тривалості операції для кожного провайдера під час агресивного smoke-прогону
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth сховища профілів і ігнорувати перевизначення лише через env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори image, music і video через один native-ентрипойнт репозиторію
  - Автоматично завантажує відсутні env-змінні провайдерів із `~/.profile`
  - Автоматично звужує кожен набір до провайдерів, які наразі мають придатні auth, за замовчуванням
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker runners (необов’язкові перевірки «працює в Linux»)

Ці Docker runners поділяються на дві групи:

- Runners live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог config і workspace (і підключаючи `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker runners live за замовчуванням використовують менше обмеження smoke-прогону, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох Docker-смуг live. Він також збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для container smoke runners E2E, які перевіряють зібраний застосунок.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або більше реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker runners live-моделей також bind-mount лише потрібні домашні каталоги CLI auth (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб зовнішній CLI OAuth міг оновлювати токени без зміни host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffold): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-тест онбордингу/каналу/агента через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref плюс Telegram за замовчуванням, перевіряє, що ввімкнення plugin встановлює його runtime-залежності на вимогу, запускає doctor і виконує один mock-хід агента OpenAI. Повторно використайте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled-провайдерів image замість зависання. Повторно використайте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` зі зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` використовує один спільний npm-кеш для своїх контейнерів root, update і direct-npm. Smoke-тест оновлення за замовчуванням використовує npm `latest` як стабільну базу перед оновленням до tarball кандидата. Непривілейовані перевірки installer зберігають ізольований npm-кеш, щоб записи кешу, створені root, не маскували поведінку встановлення для локального користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване пряме глобальне оновлення через npm за допомогою `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цієї env-змінної, коли потрібне покриття прямого `npm install -g`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальна reasoning-регресія OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає mock-сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера і перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст MCP channel (ініціалізований Gateway + міст stdio + smoke сирих notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти Pi bundle MCP (реальний stdio MCP-сервер + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-тест встановлення + alias `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke-тест оновлення Plugin без змін: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності bundled plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий Docker runner image, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використайте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Звужуйте runtime-залежності bundled plugin під час ітерацій, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використати спільний образ зібраного застосунку:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для набору перевизначення image, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та installer зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакування/встановлення, а не спільний runtime зібраного застосунку.

Docker runners live-моделей також монтують поточний checkout лише для читання і
розміщують його в тимчасовому workdir усередині контейнера. Це зберігає runtime
image компактним, водночас дозволяючи запускати Vitest точно на вашому локальному вихідному коді/config.
Крок staging пропускає великі локальні кеші та результати збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб live-зонди gateway не запускали
реальні workers каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити покриття gateway
live із цієї Docker-смуги.
`test:docker:openwebui` — це smoke-тест сумісності вищого рівня: він запускає
контейнер gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
image Open WebUI, а Open WebUI може потребувати завершення власного холодного старту.
Ця смуга очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON-payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає ініціалізований контейнер
Gateway, запускає другий контейнер, який стартує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та повідомлення каналу +
дозволів у стилі Claude через реальний міст stdio MCP. Перевірка повідомлень
безпосередньо інспектує сирі кадри stdio MCP, тож smoke-тест перевіряє те, що
міст реально надсилає, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує ключа
live-моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через runtime вбудованого Pi bundle
MCP, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає ініціалізований Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний ACP smoke-тест plain-language thread (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для регресійних/налагоджувальних сценаріїв. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і підключається перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, підключені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішніх CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установлень CLI усередині Docker
- Зовнішні каталоги/файли CLI auth в `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, як-от `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані надходять зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовується в smoke-тесті Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег image Open WebUI

## Перевірка документації

Запускайте перевірки docs після редагування документації: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам потрібні також перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, запис config + примусове auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock-виклик інструментів через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють прив’язування сесії та ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічені в prompt, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні eval мають насамперед залишатися детермінованими:

- Runner сценаріїв, що використовує mock-провайдерів для перевірки викликів інструментів + їх порядку, читання skill-файлів і прив’язування сесій.
- Невеликий набір сценаріїв, зосереджених на Skills (використати чи уникнути, gating, prompt injection).
- Необов’язкові live eval (opt-in, керовані через env) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає
своєму інтерфейсному контракту. Вони перебирають усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit-lane `pnpm test` навмисно
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
- **session-binding** - Поведінка прив’язування сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API каталогу/списку учасників
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Зонди статусу channel
- **registry** - Форма реєстру plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/добір auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або змінення channel чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- За можливості додайте безпечну для CI регресію (mock/stub provider або фіксацію точної трансформації форми запиту)
- Якщо вона за своєю природою можлива лише в live (rate limit, політики auth), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому шару, який ловить помилку:
  - помилка конвертації/повторення запиту provider → тест прямих моделей
  - помилка pipeline сесії/історії/інструментів gateway → live smoke-тест gateway або безпечний для CI mock-тест gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить по одній вибраній цілі на клас SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id із сегментами обходу відхиляються.
  - Якщо ви додаєте нову родину цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою на некласифікованих id цілей, щоб нові класи не можна було тихо пропустити.
