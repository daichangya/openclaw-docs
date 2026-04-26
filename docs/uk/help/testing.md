---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделей/провайдерів
    - Налагодження поведінки Gateway + агентів
summary: 'Набір для тестування: набори unit/e2e/live, раннери Docker і що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-26T03:54:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f85e04b4e7edee9223a47a08e6df71f8157e59d718063e6b84e31d3be10ccd8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір раннерів Docker. Цей документ — посібник «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

## Швидкий старт

У більшості випадків:

- Повний гейт (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск усіх наборів на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-лейн на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Гейт покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + probes інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику probe у стилі читання файлу. Моделі, чиї метадані оголошують вхід `image`, також виконують маленький хід із зображенням. Вимкніть додаткові probes за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з `include_live_suites: true`, який включає окремі matrix jobs Docker live-моделей, розшардовані за провайдером.
  - Для цільових повторних запусків у CI запускайте `OpenClaw Live And E2E Checks (Reusable)` з `include_live_suites: true` і `live_models_only: true`.
  - Додайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`, а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його запланованих/release-викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live-лейн проти шляху app-server Codex, прив’язує синтетичний Slack DM через `/codex bind`, виконує `/codex fast` і `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення із зображенням проходять через native Plugin binding, а не через ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Проганяє ходи агентів Gateway через app-server harness Codex, що належить Plugin, перевіряє `/codex status` і `/codex models`, а за замовчуванням також виконує probes для image, cron MCP, sub-agent і Guardian. Вимкніть probe sub-agent за допомогою `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої app-server Codex. Для сфокусованої перевірки sub-agent вимкніть інші probes: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершиться після probe sub-agent, якщо не встановлено `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke команди порятунку Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Добровільна додаткова перевірка поверхні команди порятунку message-channel. Вона виконує `/crestodian status`, ставить у чергу стійку зміну моделі, відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH` і перевіряє, що fallback нечіткого планувальника перетворюється на типізований запис конфігурації з audit.
- Docker smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до Crestodian, застосовує записи setup/model/agent/Discord Plugin + SecretRef, валідує конфігурацію та перевіряє записи audit. Той самий шлях налаштування Ring 0 також покривається в QA Lab командою
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, запустіть
  `openclaw models list --provider moonshot --json`, а потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6, а транскрипт помічника зберігає нормалізоване `usage.cost`.

Порада: якщо вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## Раннери, специфічні для QA

Ці команди розташовані поруч із основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається на відповідних PR і з ручного запуску з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на `main` і з ручного запуску з mock parity gate, live Matrix lane і керованим Convex live Telegram lane як паралельними jobs. `OpenClaw Release Checks` запускає ті самі лейни перед схваленням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими воркерами Gateway. `qa-channel` за замовчуванням використовує concurrency 4 (обмежується кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати кількість воркерів, або `--concurrency 1` для старішого послідовного лейна.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли хочете отримати артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального покриття фікстур і моків протоколу без заміни сценарно-орієнтованого лейна `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у тимчасовій Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски прокидають підтримувані QA-входи автентифікації, практичні для гостьової системи:
    ключі провайдера на основі env, шлях до конфігурації QA live provider і `CODEX_HOME`, якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через змонтований workspace.
  - Записує звичайний QA-звіт і підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської роботи з QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в Docker, виконує неінтерактивний онбординг із ключем OpenAI API, за замовчуванням налаштовує Telegram, перевіряє, що ввімкнення Plugin встановлює runtime dependencies на вимогу, запускає doctor і виконує один локальний хід агента проти змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий лейн пакетної інсталяції з Discord.
- `pnpm test:docker:session-runtime-context`
  - Виконує детермінований Docker smoke built-app для вбудованих транскриптів runtime context. Перевіряє, що прихований runtime context OpenClaw зберігається як користувацьке повідомлення, яке не відображається, замість витоку у видимий хід користувача, а потім підкладає уражений зламаний JSONL сеансу й перевіряє, що `openclaw doctor --fix` переписує його в active branch з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, виконує онбординг для встановленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує live Telegram QA-лейн із цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо в CI присутні
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret, обгортка Docker автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього лейна.
  - GitHub Actions надає цей лейн як ручний workflow для супроводжувачів
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує environment `qa-live-shared` і CI leases облікових даних Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway з налаштованим OpenAI, а потім вмикає bundled channel/plugins через редагування конфігурації.
  - Перевіряє, що виявлення setup залишає runtime dependencies не налаштованих Plugin відсутніми, що перший налаштований запуск Gateway або doctor встановлює runtime dependencies кожного bundled Plugin на вимогу, і що другий перезапуск не перевстановлює залежності, які вже були активовані.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата відновлює runtime dependencies bundled channel без postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke оновлення пакетної інсталяції через гостьові системи Parallels. Кожна вибрана платформа спочатку встановлює запитаний baseline package, потім запускає встановлену команду `openclaw update` у тій самій гостьовій системі та перевіряє встановлену версію, статус оновлення, готовність gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux`, коли ітеруєте над однією гостьовою системою. Використовуйте `--json` для шляху до підсумкового артефакту та статусу кожного лейна.
  - Обгортайте довгі локальні запуски в тайм-аут хоста, щоб зависання транспорту Parallels не з’їдало решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи лейнів у `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на post-update doctor/runtime dependency repair на холодній гостьовій системі; це все ще вважається нормальним, якщо вкладений npm debug log продовжує рухатися.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-лейнами Parallels для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час відновлення snapshot, видачі пакета або стану gateway гостьової системи.
  - Post-update proof запускає звичайну поверхню bundled Plugin, оскільки capability facades, такі як speech, генерація зображень і розуміння медіа, завантажуються через bundled runtime APIs, навіть коли сам хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-лейн Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для repo/dev. Пакетні інсталяції OpenClaw не постачають `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують bundled runner безпосередньо; окремий крок встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Matrix Plugin як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки лейн локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, підсумок, артефакт observed-events і комбінований лог stdout/stderr у `.artifacts/qa-e2e/...`.
  - За замовчуванням виводить прогрес і застосовує жорсткий тайм-аут виконання через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (за замовчуванням 30 хвилин). Очищення обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а в разі збоїв включається команда відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live QA-лейн Telegram проти реальної приватної групи, використовуючи токени bot driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. За замовчуванням використовуйте режим env, або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути спільні lease.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли хочете отримати артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, при цьому бот SUT має надавати ім’я користувача Telegram.
  - Для стабільного спостереження бот-до-бота увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати груповий трафік ботів.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту надсилання driver до спостережуваної відповіді SUT.

Live transport-лейни мають один стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним QA-набором і не є частиною матриці покриття live transport.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), QA lab отримує ексклюзивний lease із пулу на базі Convex, надсилає Heartbeat для цього lease, поки лейн виконується, і звільняє lease під час завершення роботи.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback URL-и Convex `http://` лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Адміністративні команди супроводжувача (додати/видалити/перелічити пул) потребують саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для супроводжувачів:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker, префікс endpoint, HTTP timeout і доступність admin/list без виведення значень секретів. Використовуйте `--json` для машинозчитуваного виводу в скриптах і утилітах CI.

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
  - Захист активного lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` валідовує цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Transport adapter для каналу.
2. Набір сценаріїв, що перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний root верхнього рівня, коли спільний хост `qa-lab` може керувати цим потоком.

`qa-lab` володіє спільною механікою хоста:

- коренем команди `openclaw qa`
- запуском і зупинкою набору
- concurrency воркерів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner Plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як налаштовується gateway для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти й нормалізований стан транспорту
- як виконуються дії на базі транспорту
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг прийняття для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Тримайте механіку, специфічну для транспорту, всередині runner Plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner Plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Тримайте `runtime-api.ts` легким; лінивий CLI і виконання runner мають залишатися за окремими entrypoints.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні хелпери сценаріїв для нових сценаріїв.
7. Зберігайте роботу наявних compatibility aliases, якщо тільки в репозиторії не виконується навмисна міграція.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому runner Plugin або harness Plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте загальний helper замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, робіть сценарій специфічним для цього транспорту й явно відображайте це в контракті сценарію.

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

Compatibility aliases залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Для нових каналів слід використовувати загальні назви helper.
Compatibility aliases існують, щоб уникнути міграції прапором одного дня, а не як модель для написання нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростаючий реалізм» (і зростаючу нестабільність/вартість):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: нетаргетовані запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати мультипроєктні шарди в конфігурації для кожного проєкту для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelisted node-тести `ui`, які покриваються `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, tooling, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускаються в CI
  - Реальні ключі не потрібні
  - Мають бути швидкими й стабільними

<AccordionGroup>
  <Accordion title="Проєкти, шарди та scoped-лейни">

    - Нетаргетований `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу root project. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
    - `pnpm test --watch` усе ще використовує нативний граф проєктів root `vitest.config.ts`, оскільки цикл watch із багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped-лейни, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної ціни запуску root project.
    - `pnpm test:changed` розгортає змінені шляхи git у ті самі scoped-лейни, коли diff торкається лише source/test-файлів, які можна маршрутизувати; редагування config/setup усе ще повертаються до широкого повторного запуску root project.
    - `pnpm check:changed` — це звичайний розумний локальний гейт для вузької роботи. Він класифікує diff у core, тести core, extensions, тести extension, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні лейни typecheck/lint/test. Публічні зміни Plugin SDK і plugin-contract включають один прохід валідації extension, оскільки extensions залежать від цих контрактів core. Оновлення версій лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни package поза полем версії верхнього рівня.
    - Зміни live Docker ACP harness запускають сфокусований локальний гейт: shell syntax для скриптів автентифікації live Docker, dry-run планувальника live Docker, unit-тести ACP bind і тести extension ACPX. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; редагування dependency, export, version та інших поверхонь package усе ще використовують ширші захисти.
    - Unit-тести з легкими import із agents, commands, plugins, helper auto-reply, `plugin-sdk` і подібних чистих утилітних областей маршрутизуються через лейн `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних лейнах.
    - Вибрані helper source-файли `plugin-sdk` і `commands` також відображають запуски в режимі changed на явні sibling-тести в цих легких лейнах, тож редагування helper уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має окремі кошики для helper верхнього рівня core, integration-тестів верхнього рівня `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один кошик із важкими import не володів усім хвостом Node.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime context Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації та нормалізації.
    - Підтримуйте інтеграційні набори embedded runner у справному стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction усе ще проходять через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Типові значення Vitest pool та isolation">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує non-isolated runner у root projects, конфігураціях e2e та live.
    - Root UI-лейн зберігає своє налаштування `jsdom` і optimizer, але також працює на спільному non-isolated runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх процесів Node Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні лейни запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно індексує відформатовані файли й не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею або push, коли вам потрібен розумний локальний гейт. Публічні зміни Plugin SDK і plugin-contract включають один прохід валідації extension.
    - `pnpm test:changed` маршрутизує через scoped-лейни, коли змінені шляхи чітко відповідають меншому набору.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищою верхньою межею воркерів.
    - Автомасштабування локальних воркерів навмисно консервативне й знижує навантаження, коли середнє навантаження хоста вже високе, тож кілька одночасних запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає файли projects/config як `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли змінюється wiring тестів.
    - Конфігурація зберігає ввімкненим `OPENCLAW_VITEST_FS_MODULE_CACHE` на підтримуваних хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість import плюс вивід розбивки import.
    - `pnpm test:perf:imports:changed` обмежує той самий профільований огляд файлами, зміненими відносно `origin/main`.
    - Дані часу шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски цілих конфігурацій використовують шлях конфігурації як ключ; шарди CI з include-pattern додають назву шарда, щоб відфільтровані шарди можна було відстежувати окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові import, тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і мокайте цей seam безпосередньо замість глибокого import helper runtime лише для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` з нативним шляхом root project для цього закоміченого diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркує поточне брудне дерево, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і root-конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує профіль CPU головного потоку для накладних витрат запуску та трансформації Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для unit-набору з вимкненим файловим паралелізмом.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один воркер
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Проганяє синтетичне churn повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Виконує запит `diagnostics.stability` через WS RPC Gateway
  - Покриває helper persistence пакета діагностичної стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS не перевищують бюджет тиску, а глибини черг для кожної сесії повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький лейн для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Типові значення runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість воркерів (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в тихому режимі, щоб зменшити накладні витрати на консольний I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості воркерів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - End-to-end-поведінка gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, парування Node і складніша мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований gateway OpenShell на хості через Docker
  - Створює sandbox з тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє поведінку файлової системи remote-canonical через sandbox fs bridge
- Очікування:
  - Лише за явним увімкненням; не є частиною типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний бінарний файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін форматів провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки обмеження швидкості
- Очікування:
  - Навмисно нестабільні для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштують грошей / використовують ліміти швидкості
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає логи bootstrap gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup-логи.
- Ротація API-ключів (залежно від провайдера): установіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або використовуйте перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби при відповідях із rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдера помітно активні, навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/gateway одразу передавалися під час live-запусків.
  - Налаштовуйте Heartbeat прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запустіть `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтесь мережевої взаємодії gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої конкретного провайдера / виклик інструментів: запустіть звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live matrix моделей, smoke CLI backend, smoke ACP, harness app-server Codex і всіх live-тестів media-provider (Deepgram, BytePlus, ComfyUI, image, music, video, media harness) — а також для обробки облікових даних під час live-запусків — див. [Тестування — live-набори](/uk/help/testing-live).

## Раннери Docker (необов’язкові перевірки «працює в Linux»)

Ці раннери Docker поділяються на дві категорії:

- Live-model раннери: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і використовують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoints — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-раннери за замовчуванням використовують меншу верхню межу smoke, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли вам
  явно потрібен більший вичерпний прогін.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для live Docker-лейнів. Також він збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для контейнерних smoke-раннерів E2E, які перевіряють built app. Агрегатор використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають важким live-, npm-install- і multi-service-лейнам стартувати одночасно. За замовчуванням використовуються 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли хост Docker має більший запас ресурсів. Раннер за замовчуванням виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, виводить стан кожні 30 секунд, зберігає часи успішних лейнів у `.artifacts/docker-tests/lane-timings.json` і використовує ці часи, щоб у наступних запусках спочатку стартували довші лейни. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест лейнів без збирання чи запуску Docker.
- Container smoke-раннери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або більше реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-раннери live-model також bind-mount лише потрібні CLI auth home-каталоги (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін у host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням покриває Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повний scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke онбордингу/каналу/агента через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновлює активовані runtime deps Plugin, і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого транскрипту runtime context плюс відновлення doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із built Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` ділить один npm cache між своїми контейнерами root, update і direct-npm. Smoke оновлення за замовчуванням використовує npm `latest` як стабільний baseline перед оновленням до tarball кандидата. Перевірки installer без root зберігають ізольований npm cache, щоб записи cache, що належать root, не маскували поведінку локального встановлення користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними повторними запусками.
- Install Smoke у CI пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; локально запускайте скрипт без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke CLI для видалення shared workspace агентів: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає образ із кореневого Dockerfile, створює два агенти з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє коректний JSON та поведінку збереженого workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot браузерного CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють URL-и посилань, клікабельні елементи, підняті курсором, iframe refs і метадані frame.
- Регресія мінімального reasoning OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, а потім примусово викликає відхилення provider schema й перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст каналу MCP (seeded Gateway + stdio bridge + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + teardown дочірнього stdio MCP після ізольованого запуску cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + псевдонім `/plugin` + семантика перезапуску пакета Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps bundled Plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий образ Docker runner, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть host rebuild після свіжого локального збирання через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate попередньо пакує цей tarball один раз, а потім шардить перевірки bundled channel на незалежні лейни, зокрема окремі лейни оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску bundled-лейна, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Лейн також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Під час ітерації звужуйте runtime deps bundled Plugin, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використати спільний built-app image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для наборів перевизначення image, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо він ще не локальний. Тести Docker для QR та installer зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільний runtime built app.

Docker-раннери live-model також bind-mount поточний checkout у режимі лише читання й розгортають його в тимчасовий workdir всередині контейнера. Це зберігає runtime image компактним і водночас дозволяє запускати Vitest саме на вашому локальному source/config.
Крок розгортання пропускає великі локальні кеші й артефакти збирання app, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для app каталоги `.build` або вивід Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probes gateway не запускали
реальні channel workers Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити gateway live-покриття з цього Docker-лейна.
`test:docker:openwebui` — це smoke вищого рівня для перевірки сумісності: він запускає
контейнер gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
image Open WebUI, а Open WebUI може потребувати завершення власного cold-start-налаштування.
Цей лейн очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway
контейнер, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live events, маршрутизацію вихідного надсилання та сповіщення про channel +
дозволи у стилі Claude через реальний міст stdio MCP. Перевірка сповіщень
безпосередньо інспектує сирі кадри stdio MCP, тож smoke перевіряє те, що міст
справді випромінює, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує
ключа live-моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через вбудований runtime Pi bundle
MCP, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає seeded Gateway з реальним stdio MCP probe server, виконує ізольований
хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflows регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації thread ACP, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і використовується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, підхоплені з `OPENCLAW_PROFILE_FILE`, із використанням тимчасових каталогів config/workspace і без монтування зовнішніх CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні auth-каталоги/файли CLI під `$HOME` монтуються в режимі лише читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків, які не потребують перебудови
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовується для smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег image Open WebUI

## Перевірка коректності docs

Після редагування docs запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Offline-регресія (безпечно для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + примусову auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінки надійності агентів (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінки надійності агентів»:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- End-to-end-потоки майстра, які перевіряють wiring сесії й ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли Skills наведено в prompt, чи вибирає агент правильний Skills (або уникає нерелевантних)?
- **Compliance:** чи читає агент `SKILL.md` перед використанням і чи дотримується потрібних кроків/аргументів?
- **Workflow contracts:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні оцінки мають передусім залишатися детермінованими:

- Scenario runner, що використовує mock-провайдерів для перевірки викликів інструментів + порядку, читання skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на Skills (використати vs уникнути, gating, ін’єкція prompt).
- Необов’язкові live-evals (opt-in, керовані env) лише після того, як буде готовий безпечний для CI набір.

## Contract tests (форма Plugin і channel)

Contract tests перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
інтерфейсному контракту. Вони перебирають усі виявлені Plugins і запускають набір
перевірок форми та поведінки. Unit-лейн за замовчуванням `pnpm test` навмисно
пропускає ці файли спільних seams і smoke; запускайте contract-команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт майстра setup
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API каталогу/реєстру
- **group-policy** - Забезпечення дотримання групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probes статусу channel
- **registry** - Форма реєстру Plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/селекція auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер setup

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни channel чи provider Plugin
- Після рефакторингу реєстрації або виявлення Plugin

Contract tests запускаються в CI й не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- За можливості додавайте безпечну для CI регресію (mock/stub provider або фіксацію точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), залишайте live-тест вузьким і opt-in через env vars
- Віддавайте перевагу націлюванню на найменший шар, який виявляє баг:
  - баг конвертації/повторення запиту provider → тест прямих моделей
  - баг у pipeline сесії/історії/інструментів gateway → live smoke gateway або безпечний для CI mock-тест gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
