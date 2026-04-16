---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-16T20:21:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: af2bc0e9b5e08ca3119806d355b517290f6078fda430109e7a0b153586215e34
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів.

Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює)
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm test`
- Швидший локальний запуск усього набору на потужній машині: `pnpm test:max`
- Прямий цикл Vitest watch: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Якщо ви ітеруєтеся над одним падінням, спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-ланка на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більшої впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + Gateway tool/image probes): `pnpm test:live`
- Тихий запуск одного live-файлу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Порада: якщо вам потрібен лише один проблемний випадок, звужуйте live-тести через змінні середовища allowlist, описані нижче.

## QA-специфічні ранери

Ці команди розташовані поруч з основними тестовими наборами, коли вам потрібна реалістичність qa-lab:

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими працівниками Gateway, до 64 працівників або кількості вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати кількість працівників, або `--concurrency 1` для старішої послідовної ланки.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані вхідні дані автентифікації QA, які практичні для гостьової системи:
    ключі провайдерів на основі env, шлях до конфігурації QA live provider і `CODEX_HOME`, якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через змонтований workspace.
  - Записує звичайний QA-звіт + підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської QA-роботи.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA-ланку проти одноразового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Пакетні встановлення OpenClaw не постачають `qa-lab`, тож вони не надають `openclaw qa`.
  - Клонування репозиторію завантажують вбудований раннер напряму; окремий крок встановлення plugin не потрібен.
  - Надає трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA Gateway із реальним Matrix Plugin як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки ця ланка локально створює одноразових користувачів.
  - Записує Matrix QA-звіт, підсумок, артефакт observed-events і комбінований журнал виводу stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA-ланку проти реальної приватної групи, використовуючи токени bot driver і SUT із env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Потребує двох різних bot у тій самій приватній групі, причому bot SUT має мати username Telegram.
  - Для стабільного bot-to-bot спостереження увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot і переконайтеся, що bot driver може спостерігати трафік bot у групі.
  - Записує Telegram QA-звіт, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`.

Live-транспортні ланки використовують один стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним QA-набором і не є частиною матриці покриття live-транспортів.

| Ланка    | Canary | Обмеження згадок | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у гілці | Ізоляція гілок | Спостереження за реакціями | Команда довідки |
| -------- | ------ | ---------------- | -------------------- | ------------------------- | ----------------------------- | -------------------------- | -------------- | -------------------------- | --------------- |
| Matrix   | x      | x                | x                    | x                         | x                             | x                          | x              | x                          |                 |
| Telegram | x      |                  |                      |                           |                               |                            |                |                            | x               |

### Спільні Telegram credentials через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди, доки ланка працює, і звільняє оренду під час завершення роботи.

Еталонна scaffold-структура проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі для credentials:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення з env: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback-URL Convex `http://` лише для локальної розробки.

У звичайному режимі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Адміністративні команди для maintainer (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для maintainer:

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
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим ідентифікатором чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректний payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA вимагає рівно двох речей:

1. Транспортного адаптера для каналу.
2. Пакета сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab`
може володіти цим потоком.

`qa-lab` володіє спільною механікою хоста:

- коренем команди `openclaw qa`
- запуском і завершенням набору
- паралелізмом працівників
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- compatibility aliases для старих сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії, прив’язані до транспорту
- як обробляються скидання чи очищення, специфічні для транспорту

Мінімальна планка впровадження для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний runner на спільному хостовому seam `qa-lab`.
3. Зберігайте транспортно-специфічну механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючий кореневий простір команд.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Залишайте `runtime-api.ts` легким; лінивий CLI і виконання runner мають бути винесені за окремі entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в `qa/scenarios/`.
6. Використовуйте загальні scenario helpers для нових сценаріїв.
7. Зберігайте наявні compatibility aliases працездатними, якщо тільки репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспортного каналу, зберігайте її в цьому runner plugin або harness plugin.
- Якщо сценарій потребує нової можливості, яку може використовувати більше ніж один канал, додайте загальний helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій transport-specific і явно відображайте це в контракті сценарію.

Бажані назви загальних helpers для нових сценаріїв:

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

Нова робота над каналами має використовувати загальні назви helpers.
Compatibility aliases існують, щоб уникнути міграції одним днем, а не як модель
для написання нових сценаріїв.

## Тестові набори (що де запускається)

Думайте про набори як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (типовий)

- Команда: `pnpm test`
- Конфігурація: десять послідовних shard-запусків (`vitest.full-*.config.ts`) поверх наявних scoped-проєктів Vitest
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, що охоплюються `vitest.unit.config.ts`
- Охоплення:
  - Чисті unit-тести
  - In-process integration tests (автентифікація Gateway, маршрутизація, tooling, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка щодо проєктів:
  - Нетаргетований `pnpm test` тепер запускає одинадцять менших shard-конфігурацій (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
  - `pnpm test --watch` усе ще використовує native root-граф проєктів `vitest.config.ts`, тому що багатошардовий watch-цикл непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped-ланки, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає витрат на запуск усього root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped-ланки, коли diff торкається лише routable-файлів source/test; редагування config/setup, як і раніше, повертаються до широкого повторного запуску root-project.
  - Легкі щодо імпортів unit-тести з agents, commands, plugins, helpers auto-reply, `plugin-sdk` і схожих чистих utility-областей маршрутизуються через ланку `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних ланках.
  - Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють запуски changed-mode з явними sibling-тестами в цих легких ланках, тож зміни helpers не змушують повторно запускати весь важкий набір для цього каталогу.
  - `auto-reply` тепер має три виділені кошики: helpers верхнього рівня core, integration-тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це не дає найважчій harness-роботі reply заважати дешевим тестам status/chunk/token.
- Примітка щодо embedded runner:
  - Коли ви змінюєте вхідні дані для виявлення message-tool або runtime-контекст Compaction,
    підтримуйте обидва рівні покриття.
  - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації/нормалізації.
  - Також підтримуйте в доброму стані integration-набори embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped ids і поведінка Compaction усе ще проходять
    через реальні шляхи `run.ts` / `compact.ts`; одних лише helper-тестів
    для цих integration-шляхів недостатньо.
- Примітка щодо pool:
  - Базова конфігурація Vitest тепер за замовчуванням використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує неізольований runner для root projects, конфігурацій e2e і live.
  - Коренева ланка UI зберігає своє налаштування `jsdom` і optimizer, але тепер теж запускається на спільному неізольованому runner.
  - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також за замовчуванням додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо потрібно порівняти зі стандартною поведінкою V8.
- Примітка щодо швидкої локальної ітерації:
  - `pnpm test:changed` маршрутизується через scoped-ланки, коли змінені шляхи чисто зіставляються з меншим набором.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим лімітом працівників.
  - Автомасштабування локальних працівників тепер навмисно більш консервативне й також зменшує навантаження, коли середнє навантаження хоста вже високе, тож кілька одночасних запусків Vitest за замовчуванням шкодять менше.
  - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється тестова обв’язка.
  - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого профілювання.
- Примітка щодо налагодження продуктивності:
  - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпорту плюс вивід розбивки імпортів.
  - `pnpm test:perf:imports:changed` обмежує той самий режим профілювання файлами, зміненими відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` із native root-project шляхом для цього зафіксованого diff і виводить wall time та macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` вимірює поточне брудне дерево, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
  - `pnpm test:perf:profile:main` записує CPU-профіль головного потоку для витрат на запуск і трансформацію Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує CPU+heap-профілі runner для unit-набору з вимкненим файловим паралелізмом.

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, узгоджено з рештою репозиторію.
  - Використовує адаптивну кількість працівників (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням запускається в тихому режимі, щоб зменшити витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` — примусово задати кількість працівників (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` — знову увімкнути докладний console output.
- Охоплення:
  - Наскрізна поведінка кількох екземплярів Gateway
  - Поверхні WebSocket/HTTP, pairing вузлів і більш важке мережеве навантаження
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж в unit-тестах (може бути повільніше)

### E2E: smoke бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Охоплення:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише за запитом; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий Gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний CLI-бінарник або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- Типовий режим: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Охоплення:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними credentials?»
  - Виявлення змін формату провайдера, особливостей виклику tools, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий тестовий home, щоб unit-fixtures не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли свідомо хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням використовує тихіший режим: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і глушить логи bootstrap Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (специфічна для провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або окреме live-перевизначення через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб під час довгих викликів провайдерів було видно, що вони активні, навіть коли Vitest тихо перехоплює console output.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тож рядки прогресу провайдера/Gateway надходять одразу під час live-запусків.
  - Налаштовуйте Heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для Gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо зміни великі)
- Торкаєтеся мережевої взаємодії Gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій bot не працює» / специфічні для провайдера збої / виклики tools: запускайте звужений `pnpm test:live`

## Live: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, що наразі оголошена** підключеним Android Node, і перевірити поведінку контракту команди.
- Охоплення:
  - Передумови/ручне налаштування (набір не встановлює, не запускає і не pair-ить застосунок).
  - Перевірка `node.invoke` Gateway для вибраного Android Node, команда за командою.
- Потрібне попереднє налаштування:
  - Android-застосунок уже підключений і pair-ений до Gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте як успішні.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke-тест моделі (profile keys)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Direct model» показує, чи може провайдер/модель взагалі відповісти з даним ключем.
- «Gateway smoke» показує, чи працює повний конвеєр Gateway+agent для цієї моделі (sessions, history, tools, sandbox policy тощо).

### Шар 1: Direct model completion (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перерахувати виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є credentials
  - Виконати невелике completion для кожної моделі (і цільові регресії, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб цей набір справді виконувався; інакше він пропускається, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Режими modern/all за замовчуванням використовують curated high-signal обмеження; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern-проходу або додатне число для меншого ліміту.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: profile store і env fallback
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише profile store**
- Навіщо це існує:
  - Відокремлює «API провайдера зламаний / ключ невалідний» від «pipeline Gateway agent зламаний»
  - Містить невеликі ізольовані регресії (наприклад, replay reasoning у OpenAI Responses/Codex Responses + потоки tool-call)

### Шар 2: Gateway + smoke dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process Gateway
  - Створити/оновити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі з ключами й перевіряти:
    - «змістовну» відповідь (без tools)
    - що реальний виклик tool працює (`read` probe)
    - необов’язкові додаткові probes tools (`exec+read` probe)
    - що шляхи регресії OpenAI (лише tool-call → follow-up) продовжують працювати
- Деталі probe (щоб ви могли швидко пояснювати збої):
  - `read` probe: тест записує файл із nonce у workspace і просить агента `read` його та повернути nonce.
  - `exec+read` probe: тест просить агента записати nonce у тимчасовий файл через `exec`, а потім прочитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Проходи modern/all для gateway за замовчуванням використовують curated high-signal обмеження; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern-проходу або додатне число для меншого ліміту.
- Як вибрати провайдерів (уникати «OpenRouter everything»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Tool + image probes у цьому live-тесті завжди увімкнені:
  - `read` probe + `exec+read` probe (stress-тест tools)
  - image probe запускається, коли модель заявляє підтримку image input
  - Потік (на високому рівні):
    - Тест генерує маленький PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway парсить attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent пересилає multimodal user message до моделі
    - Перевірка: відповідь містить `cat` + код (допускаються незначні OCR-помилки)

Порада: щоб побачити, що саме можна тестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke-тест бекенда CLI (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent, використовуючи локальний CLI-бекенд, не торкаючись вашої типової конфігурації.
- Типові параметри smoke для конкретного бекенда розміщені у визначенні `cli-backend.ts` відповідного extension.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих Plugin CLI backend, якому вона належить.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання аргументів зображень, коли задано `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типовий probe безперервності тієї самої сесії Claude Sonnet -> Opus (встановіть `1`, щоб примусово увімкнути його, коли вибрана модель підтримує ціль перемикання).

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

- Docker-ранер розташовано в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke-тест CLI backend усередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані CLI smoke з extension-власника, а потім встановлює відповідний Linux-пакет CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує portable Claude Code subscription OAuth через `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він підтверджує прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI backend без збереження env-змінних Anthropic API key. Ця subscription-ланка за замовчуванням вимикає Claude MCP/tool і image probes, оскільки Claude наразі маршрутизує використання стороннього застосунку через тарифікацію extra usage, а не через звичайні ліміти плану підписки.
- Smoke-тест live CLI backend тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик tool `cron` через MCP, перевірений через Gateway CLI.
- Типовий smoke-тест Claude також оновлює сесію з Sonnet до Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: smoke-тест прив’язки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік conversation-bind ACP із live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати synthetic message-channel conversation на місці
  - надіслати звичайне follow-up у тій самій conversation
  - перевірити, що follow-up потрапляє в transcript прив’язаної ACP-сесії
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP-агенти в Docker: `claude,codex,gemini`
  - ACP-агент для прямого `pnpm test:live ...`: `claude`
  - Synthetic channel: контекст conversation у стилі Slack DM
  - ACP-бекенд: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Примітки:
  - Ця ланка використовує поверхню gateway `chat.send` з admin-only synthetic originating-route fields, щоб тести могли прикріпити контекст message-channel, не вдаючи зовнішню доставку.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів Plugin `acpx` для вибраного harness-агента ACP.

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

- Docker-ранер розташовано в `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає smoke-тест прив’язки ACP послідовно для всіх підтримуваних live CLI agent: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він підвантажує `~/.profile`, підготовлює відповідні auth-матеріали CLI в контейнері, встановлює `acpx` у записуваний npm-префікс, а потім встановлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker раннер встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера із підвантаженого profile доступними для дочірнього harness CLI.

## Live: smoke-тест app-server harness Codex

- Мета: перевірити harness Codex, яким володіє plugin, через звичайний
  метод gateway `agent`:
  - завантажити вбудований plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `codex/gpt-5.4`
  - надіслати другий хід у ту саму сесію OpenClaw і перевірити, що потік
    app-server може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях
    команди gateway
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `codex/gpt-5.4`
- Необов’язковий image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язковий MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke-тест установлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний
  harness Codex не міг пройти перевірку через тихий fallback на PI.
- Автентифікація: `OPENAI_API_KEY` із shell/profile, а також необов’язково скопійовані
  `~/.codex/auth.json` і `~/.codex/config.toml`

Локальний рецепт:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker-ранер розташовано в `scripts/test-live-codex-harness-docker.sh`.
- Він підвантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації CLI Codex, якщо вони присутні, встановлює `@openai/codex` у записуваний змонтований npm-префікс,
  готує дерево вихідного коду, а потім запускає лише live-тест Codex harness.
- У Docker probes image та MCP/tool увімкнено за замовчуванням. Встановіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, коли потрібен вужчий налагоджувальний запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, узгоджено з live-
  конфігурацією тесту, щоб fallback `openai-codex/*` або PI не міг приховати
  регресію harness Codex.

### Рекомендовані live-рецепти

Звужені явні allowlist — найшвидші й найменш нестабільні:

- Одна модель, direct (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик tools через кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API key).
- `google-antigravity/...` використовує міст OAuth Antigravity (endpoint агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (автентифікація через API key / profile); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний бінарник `gemini`; він має власну автентифікацію й може поводитися інакше (streaming/підтримка tools/розсинхрон версій).

## Live: матриця моделей (що ми охоплюємо)

Фіксованого «списку моделей CI» немає (live — opt-in), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний smoke-набір (tool calling + image)

Це запуск «поширених моделей», який ми очікуємо зберігати працездатним:

- OpenAI (не Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старих моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск gateway smoke з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик tools (Read + необов’язковий Exec)

Виберіть щонайменше одну модель на сімейство провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою `tools`, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик tools залежить від режиму API)

### Vision: надсилання image (вкладення → multimodal message)

Додайте щонайменше одну модель із підтримкою image до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI-варіанти з підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до live-матриці (якщо у вас є credentials/config):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні endpoint): `minimax` (хмара/API), а також будь-який OpenAI/Anthropic-сумісний proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «всі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс доступні ключі.

## Credentials (ніколи не комітьте)

Live-тести знаходять credentials так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає credentials», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це в live-тестах означає «profile keys»)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог legacy-стану: `~/.openclaw/credentials/` (копіюється до staged live home, якщо присутній, але не є основним сховищем profile keys)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного агента, legacy `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового тестового home; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` вилучаються, щоб probes не торкалися вашого реального workspace на хості.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

## Live: Deepgram (транскрибування аудіо)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live: coding plan BytePlus

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live: ComfyUI workflow media

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Охоплення:
  - Перевіряє вбудовані шляхи comfy image, video і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у поданні workflow comfy, polling, завантаженнях або реєстрації plugin

## Live: генерація image

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Охоплення:
  - Перераховує кожен зареєстрований Plugin провайдера генерації image
  - Підвантажує відсутні env-змінні провайдера з вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/profile/model
  - Запускає стандартні варіанти генерації image через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери, які охоплено:
  - `openai`
  - `google`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

## Live: генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Охоплення:
  - Перевіряє спільний шлях вбудованих провайдерів генерації музики
  - Наразі охоплює Google і MiniMax
  - Підвантажує env-змінні провайдера з вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/profile/model
  - Запускає обидва заявлені runtime-режими, коли вони доступні:
    - `generate` з вхідними даними лише у вигляді prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної ланки:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, а не цей спільний прохід
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

## Live: генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Охоплення:
  - Перевіряє спільний шлях вбудованих провайдерів генерації відео
  - За замовчуванням використовує smoke-шлях, безпечний для релізу: провайдери без FAL, один запит text-to-video на провайдера, one-second lobster prompt і обмеження операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці провайдера може домінувати над часом релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб явно його запустити
  - Підвантажує env-змінні провайдера з вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/profile/model
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати заявлені режими перетворення, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальне введення image на основі buffer у спільному проході
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальне введення video на основі buffer у спільному проході
  - Поточні провайдери `imageToVideo`, заявлені, але пропущені у спільному проході:
    - `vydra`, тому що вбудований `veo3` підтримує лише text, а вбудований `kling` вимагає віддалений image URL
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс ланку `kling`, яка за замовчуванням використовує фікстуру віддаленого image URL
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, заявлені, але пропущені у спільному проході:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі потребують віддалені опорні URL `http(s)` / MP4
    - `google`, оскільки поточна спільна ланка Gemini/Veo використовує локальне введення на основі buffer, а цей шлях не приймається у спільному проході
    - `openai`, оскільки поточна спільна ланка не гарантує доступ до video inpaint/remix, специфічний для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера у типовий прохід, зокрема FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження часу операції для кожного провайдера під час агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

## Harness для media live

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори image, music і video через один рідний для репозиторію entrypoint
  - Автоматично підвантажує відсутні env-змінні провайдерів із `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тож поведінка Heartbeat і quiet-mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві категорії:

- Live-model ранери: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний profile-key live-файл усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та workspace (і підвантажують `~/.profile`, якщо він змонтований). Відповідні локальні entrypoint: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери за замовчуванням використовують менший smoke-ліміт, щоб повний Docker-прохід залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  свідомо хочете більший вичерпний прохід.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох live Docker-ланок.
- Container smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` і `test:docker:plugins` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker-ранери також bind-mount-ять лише потрібні homes автентифікації CLI (або всі підтримувані, якщо запуск не звужений), а потім копіюють їх у home контейнера перед запуском, щоб зовнішній CLI OAuth міг оновлювати токени без зміни сховища автентифікації на хості:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Wizard онбордингу (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Мережева взаємодія Gateway (два контейнери, автентифікація WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Міст каналу MCP (seeded Gateway + stdio bridge + smoke сирих notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke встановлення + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)

Live-model Docker-ранери також bind-mount-ять поточний checkout лише для читання і
переносять його до тимчасового workdir усередині контейнера. Це зберігає runtime-
образ компактним, але водночас дозволяє запускати Vitest точно на вашому локальному source/config.
Крок перенесення пропускає великі локальні кеші й артефакти збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальних працівників каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цієї Docker-ланки.
`test:docker:openwebui` — це smoke-тест сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними endpoint HTTP, запускає
закріплений контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через proxy `/api/chat/completions` у Open WebUI.
Перший запуск може бути помітно повільнішим, тому що Docker може знадобитися витягнути
образ Open WebUI, а самому Open WebUI — завершити власне холодне стартове налаштування.
Ця ланка очікує придатний ключ live-моделі, і `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Docker-ізольованих запусках.
Успішні запуски виводять невеликий JSON-payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway-
контейнер, стартує другий контейнер, який викликає `openclaw mcp serve`, а потім
перевіряє виявлення conversation через маршрутизацію, читання transcript, метадані вкладень,
поведінку live event queue, маршрутизацію outbound send і сповіщення у стилі Claude про channel +
permissions через реальний stdio MCP bridge. Перевірка сповіщень
напряму перевіряє сирі stdio MCP frames, тож smoke-тест валідує те, що міст
справді випромінює, а не лише те, що випадково показує конкретний SDK клієнта.

Ручний smoke-тест plain-language thread ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для валідації маршрутизації ACP thread, тож не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, підвантажені з `OPENCLAW_PROFILE_FILE`, з використанням тимчасових каталогів config/workspace і без монтування зовнішньої автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI в `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібна нова збірка
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що credentials беруться зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway показує для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки docs після редагування документації: `pnpm check:docs`.
Запускайте повну перевірку якірних посилань Mintlify, коли також потрібні перевірки внутрішніх заголовків сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечні для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Виклик tools Gateway (імітація OpenAI, реальний цикл Gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, примусовий запис config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності agent (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності agent»:

- Імітація виклику tools через реальний цикл Gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки wizard, які перевіряють wiring сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічено в prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає agent `SKILL.md` перед використанням і чи дотримується обов’язкових кроків/аргументів?
- **Контракти робочих процесів:** багатохідові сценарії, які перевіряють порядок tools, перенесення історії сесії та межі sandbox.

Майбутні evals мають насамперед залишатися детермінованими:

- Runner сценаріїв, що використовує mock-провайдери для перевірки викликів tools + їхнього порядку, читання skill-файлів і wiring сесії.
- Невеликий набір skill-орієнтованих сценаріїв (використовувати чи уникати, gate-умови, prompt injection).
- Необов’язкові live-evals (opt-in, керовані env) — лише після появи безпечного для CI набору.

## Contract tests (форма plugin і channel)

Contract tests перевіряють, що кожен зареєстрований plugin і channel відповідає
своєму interface contract. Вони проходять по всіх виявлених plugins і запускають набір
перевірок форми та поведінки. Типова unit-ланка `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте contract-команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** — базова форма plugin (id, name, capabilities)
- **setup** — контракт setup wizard
- **session-binding** — поведінка прив’язки сесії
- **outbound-payload** — структура payload повідомлення
- **inbound** — обробка вхідних повідомлень
- **actions** — обробники дій channel
- **threading** — обробка ID гілок
- **directory** — API каталогу/складу
- **group-policy** — застосування group policy

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** — probes статусу channel
- **registry** — форма реєстру Plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** — контракт потоку автентифікації
- **auth-choice** — вибір/selection автентифікації
- **catalog** — API каталогу моделей
- **discovery** — виявлення Plugin
- **loader** — завантаження Plugin
- **runtime** — runtime provider
- **shape** — форма/interface plugin
- **wizard** — setup wizard

### Коли запускати

- Після зміни експорту `plugin-sdk` або subpath
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації чи виявлення Plugin

Contract tests запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додайте безпечну для CI регресію, якщо це можливо (mock/stub провайдера або фіксація точного перетворення форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики автентифікації), залишайте live-тест вузьким і opt-in через env-змінні
- Намагайтеся цілитися в найменший шар, який виявляє баг:
  - баг перетворення/повторення запиту провайдера → тест direct models
  - баг у pipeline Gateway session/history/tool → gateway live smoke або безпечний для CI mock-тест Gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids сегментів обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не могли бути тихо пропущені.
