---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделей/провайдерів
    - Налагодження поведінки Gateway + agent
summary: 'Набір для тестування: набори unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-26T23:47:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c423c19712f405d6264f65a42b9b9d270d702b0617bbf79c5ce798cb1e22a93
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
ранерів Docker. Цей документ — це посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повна перевірка (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією помилкою спочатку надавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-лінія на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Перевірка покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику перевірку у стилі читання файла.
    Моделі, чиї метадані оголошують вхід `image`, також виконують маленький хід із зображенням.
    Вимкніть додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, який включає окремі Docker-завдання матриці live-моделей,
    розбиті за провайдером.
  - Для цільових повторних запусків у CI запускайте `OpenClaw Live And E2E Checks (Reusable)` з
    `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів за розкладом/релізом.
- Нативний smoke-тест прив’язаного чату Codex: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live-лінію проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, потім перевіряє, що звичайна відповідь і вкладення-зображення
    маршрутизуються через нативну прив’язку plugin, а не через ACP.
- Smoke-тест harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Пропускає ходи агента Gateway через harness app-server Codex, що належить plugin,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням також виконує перевірки image,
    Cron MCP, sub-agent і Guardian. Вимкніть перевірку sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої app-server Codex.
    Для цільової перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke-тест rescue-команди Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова опційна belt-and-suspenders перевірка поверхні rescue-команд каналу повідомлень.
    Вона виконує `/crestodian status`, ставить у чергу постійну
    зміну моделі, відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke-тест планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з підробним Claude CLI у `PATH`
    і перевіряє, що нечіткий резервний шлях планувальника перетворюється на
    протоколований запис типізованої конфігурації.
- Docker smoke-тест першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього каталогу стану OpenClaw, маршрутизує звичайний `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord plugin + SecretRef,
    перевіряє конфігурацію та записи аудиту. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke-тест вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє про Moonshot/K2.6 і що
  транскрипт помічника зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, надавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## QA-специфічні ранери

Ці команди розміщені поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається на відповідних PR і
з ручного запуску з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного запуску з mock parity gate, live-лінією Matrix та
керованою Convex live-лінією Telegram як паралельними завданнями. `OpenClaw Release Checks`
запускає ті самі лінії перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    воркерами Gateway. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість воркерів, або `--concurrency 1` для старої послідовної лінії.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершився невдачею. Використовуйте `--allow-failures`, коли
    хочете отримати артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і mock-протоколів без заміни сценарно-орієнтованої
    лінії `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані вхідні дані авторизації QA, практичні для гостьової системи:
    ключі провайдерів через env, шлях до конфігурації live-провайдера QA і `CODEX_HOME`, якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через
    змонтований робочий простір.
  - Записує звичайний QA-звіт і підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-робіт у стилі оператора.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивне onboarding з API-ключем OpenAI, за замовчуванням налаштовує Telegram,
    перевіряє, що ввімкнення plugin встановлює runtime-залежності на вимогу,
    запускає doctor і виконує один локальний хід агента проти mock-endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму лінію
    встановлення упакованої версії з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke-тест зібраного застосунку для транскриптів
    вбудованого runtime-контексту. Він перевіряє, що прихований runtime-контекст OpenClaw
    зберігається як недисплейне кастомне повідомлення замість витоку у видимий хід користувача,
    потім створює проблемний зламаний JSONL сеансу та перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, запускає onboarding
    встановленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    QA-лінію live Telegram з цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі облікові дані Telegram через env або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` разом із
    `OPENCLAW_QA_CONVEX_SITE_URL` і секретом ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    обгортка Docker автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї лінії.
  - GitHub Actions надає цю лінію як ручний workflow для мейнтейнерів
    `NPM Telegram Beta E2E`. Вона не запускається при merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway з налаштованим OpenAI,
    потім вмикає вбудовані channel/plugin через редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає runtime-залежності
    не налаштованих plugin відсутніми, що перший налаштований запуск Gateway або doctor встановлює
    runtime-залежності кожного вбудованого plugin на вимогу, і що другий перезапуск не перевстановлює
    залежності, які вже були активовані.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>`, і перевіряє, що post-update doctor кандидатної версії
    відновлює runtime-залежності вбудованого каналу без відновлення postinstall
    з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає нативний smoke-тест оновлення встановленого пакета на гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі й перевіряє встановлену
    версію, статус оновлення, готовність gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій над однією гостьовою системою. Використовуйте `--json` для шляху до підсумкового артефакту
    і статусу кожної лінії.
  - За замовчуванням лінія OpenAI використовує `openai/gpt-5.5` для підтвердження live-ходу агента.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, якщо навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту Parallels
    не з’їдало решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на post-update doctor/відновлення
    runtime-залежностей на холодній гостьовій системі; це все ще нормально, якщо вкладений
    лог налагодження npm продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-лініями Parallels
    для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, роздачі пакета або стану gateway у гостьовій системі.
  - Підтвердження після оновлення виконує звичайну поверхню вбудованих plugin, оскільки
    фасади можливостей, такі як мовлення, генерація зображень і
    розуміння медіа, завантажуються через вбудовані runtime API, навіть якщо сам
    хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live-лінію QA Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Упаковані встановлення OpenClaw не постачають
    `qa-lab`, тож вони не надають `openclaw qa`.
  - Checkout репозиторію завантажують вбудований ранер напряму; окремий крок встановлення plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) і одну приватну кімнату, після чого запускає дочірній QA gateway з реальним plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки ця лінія локально створює тимчасових користувачів.
  - Записує звіт QA Matrix, підсумок, артефакт observed-events і комбінований лог виводу stdout/stderr у `.artifacts/qa-e2e/...`.
  - За замовчуванням виводить прогрес і застосовує жорсткий timeout запуску через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). Очищення обмежується через `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а в разі збоїв включається команда відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live-лінію QA Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулінгових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пулінгові оренди.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується невдачею. Використовуйте `--allow-failures`, коли
    хочете отримати артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт QA Telegram, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на відправлення driver до спостереженої відповіді SUT.

Live-лінії транспорту мають спільний стандартний контракт, щоб нові транспорти не розходилися в поведінці:

`qa-channel` залишається широким синтетичним QA-набором і не входить до матриці покриття live-транспорту.

| Лінія    | Canary | Контроль згадок | Блок allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша дія в потоці | Ізоляція потоку | Спостереження реакцій | Команда help |
| -------- | ------ | --------------- | -------------- | ------------------------- | ----------------------------- | --------------------- | --------------- | --------------------- | ------------ |
| Matrix   | x      | x               | x              | x                         | x                             | x                     | x               | x                     |              |
| Telegram | x      |                 |                |                           |                               |                       |                 |                       | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
цієї оренди під час виконання лінії та звільняє оренду під час завершення роботи.

Еталонний каркас проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення через env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback URL Convex через `http://` лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Адміністративні команди для мейнтейнерів (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні команди CLI для мейнтейнерів:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker,
префікс endpoint, HTTP timeout і доступність admin/list без виведення
секретних значень. Використовуйте `--json` для машиночитаного виводу в скриптах і утилітах CI.

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
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректний payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Адаптер транспорту для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` володіє спільною механікою хоста:

- кореневою командою `openclaw qa`
- запуском і завершенням набору
- concurrency воркерів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- сумісними псевдонімами для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як налаштовується gateway для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як відкриваються транскрипти й нормалізований стан транспорту
- як виконуються дії на базі транспорту
- як обробляються специфічні для транспорту скидання чи очищення

Мінімальний поріг впровадження для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному хостовому seam `qa-lab`.
3. Тримайте специфічну для транспорту механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючу кореневу команду.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Залишайте `runtime-api.ts` легким; лінивий CLI і виконання runner мають залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте узагальнені helper для нових сценаріїв.
7. Зберігайте наявні compatibility aliases працездатними, якщо тільки репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного канального транспорту, тримайте її в runner plugin або harness цього plugin.
- Якщо сценарію потрібна нова можливість, яку можуть використовувати більше ніж один канал, додайте узагальнений helper замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту й явно вказуйте це в контракті сценарію.

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
Compatibility aliases існують, щоб уникнути міграції одним днем, а не як модель для
авторингу нових сценаріїв.

## Набори тестів (що де запускається)

Думайте про набори як про «зростаючий реалізм» (і зростаючу нестабільність/вартість):

### Unit / integration (типовий)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в конфігурації окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelist-нуті node-тести `ui`, які покриває `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Інтеграційні тести в межах процесу (auth gateway, маршрутизація, tooling, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, шарди та scoped-лінії">

    - Нецільовий `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу root-project. Це зменшує піковий RSS на завантажених машинах і не дає роботі `auto-reply`/extension виснажувати не пов’язані набори.
    - `pnpm test --watch` як і раніше використовує нативний граф проєктів кореневого `vitest.config.ts`, оскільки цикл спостереження з кількома шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped-лінії, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` за замовчуванням розгортає змінені шляхи git у дешеві scoped-лінії: прямі редагування тестів, сусідні файли `*.test.ts`, явні зіставлення вихідного коду та локальні залежні елементи графа імпорту. Редагування config/setup/package не запускають тести широко, якщо ви явно не використовуєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний контрольний gate для вузьких змін. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, метадані релізу, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для підтвердження тестами викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підняття версій лише в метаданих релізу запускає цільові перевірки version/config/root-dependency з guard, який відхиляє зміни package поза полем версії верхнього рівня.
    - Редагування live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для скриптів авторизації live Docker і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежено `scripts["test:docker:live-*"]`; зміни залежностей, export, версії та інших поверхонь package, як і раніше, використовують ширші guard.
    - Легкі щодо імпорту unit-тести з agents, commands, plugins, helper `auto-reply`, `plugin-sdk` та подібних чистих утилітних областей маршрутизуються через лінію `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом/важким runtime залишаються на наявних лініях.
    - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними сусідніми тестами в цих легких лініях, тож зміни helper уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має окремі кошики для helper верхнього рівня core, інтеграційних тестів верхнього рівня `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розбиває піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один кошик з важким імпортом не контролював увесь довгий хвіст Node.

  </Accordion>

  <Accordion title="Покриття вбудованого runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime-контекст Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресії helper для чистих меж
      маршрутизації та нормалізації.
    - Підтримуйте інтеграційні набори вбудованого runner у здоровому стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction, як і раніше, проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helper
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Типові значення пулу та ізоляції Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, конфігураціях e2e і live.
    - Коренева лінія UI зберігає свій setup і optimizer для `jsdom`, але також працює на
      спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні лінії запускає diff.
    - Pre-commit hook відповідає лише за форматування. Він повторно додає відформатовані файли до staged і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею або push, коли вам
      потрібен розумний локальний контрольний gate.
    - `pnpm test:changed` за замовчуванням маршрутизує через дешеві scoped-лінії. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що редагування harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом воркерів.
    - Автоматичне локальне масштабування воркерів навмисно консервативне й зменшується,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає файли проєктів/конфігурацій як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли
      змінюється зв’язування тестів.
    - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпорту плюс
      вивід деталізації імпорту.
    - `pnpm test:perf:imports:changed` обмежує той самий вигляд профілювання
      файлами, зміненими відносно `origin/main`.
    - Дані таймінгів шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски цілих конфігурацій використовують шлях конфігурації як ключ; шарди CI за include-pattern
      додають ім’я шарда, щоб відфільтровані шарди можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на імпорти під час запуску,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      робіть mock цього seam напряму замість глибокого імпорту helper runtime
      лише для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` з нативним шляхом root-project для цього зафіксованого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` вимірює поточне
      брудне дерево, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує профіль CPU головного потоку для
      накладних витрат запуску та трансформації Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для
      unit-набору з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один воркер
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Пропускає синтетичне навантаження повідомленнями gateway, пам’яттю та великими payload через шлях діагностичних подій
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helper збереження діагностичного пакета стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS залишаються нижче бюджету тиску, а глибина черг на сеанс знову зменшується до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька лінія для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих plugin у `extensions/`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних воркерів (CI: до 2, локально: типово 1).
  - За замовчуванням запускається в silent-режимі, щоб зменшити накладні витрати на консольний I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість воркерів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний консольний вивід.
- Обсяг:
  - Наскрізна поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing вузлів і важчі мережеві сценарії
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Має більше рухомих частин, ніж unit-тести (може бути повільніше)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + виконання SSH
  - Перевіряє віддалено-канонічну поведінку файлової системи через fs bridge sandbox
- Очікування:
  - Лише за запитом; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестові gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем авторизації та поведінки обмеження швидкості
- Очікування:
  - Навмисно нестабільні для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштують грошей / використовують обмеження швидкості
  - Краще запускати звужені підмножини замість «усього»
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий тестовий home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він залишає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення про `~/.profile` і вимикає логи запуску gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете знову отримати повні логи запуску.
- Ротація API-ключів (специфічна для провайдера): встановіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для конкретного live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях з обмеженням швидкості.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів залишаються видимо активними, навіть коли перехоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/gateway транслювалися негайно під час live-запусків.
  - Налаштовуйте Heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої частини gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live-матриці моделей, smoke-тестів CLI backend, smoke-тестів ACP, harness app-server Codex
і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Ранери Docker (необов’язкові перевірки «працює в Linux»)

Ці ранери Docker поділяються на дві категорії:

- Live-модельні ранери: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл за ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог config і робочий простір (і підвантажуючи `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери за замовчуванням використовують менший smoke-ліміт, щоб повний прогін Docker залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  явно хочете більший вичерпний прогін.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ — це лише Node/Git runner для ліній install/update/plugin-dependency; ці лінії монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для ліній функціональності зібраного застосунку. Визначення Docker-ліній живуть у `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають усім важким live-, npm-install- і multi-service-лініям стартувати одночасно. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більший запас ресурсів. Ранер за замовчуванням виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, друкує статус кожні 30 секунд, зберігає таймінги успішних ліній у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках спершу стартували довші лінії. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест ліній без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб вивести CI-план для вибраних ліній, потреб package/image та облікових даних.
- Контейнерні smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або більше реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-модельні Docker-ранери також bind-mount лише потрібні каталоги авторизації CLI (або всі підтримувані, якщо запуск не звужений), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін у сховищі авторизації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke-тест ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke-тест CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-тест harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-тест спостережуваності Docker: включено до `pnpm test:docker:all` і `pnpm test:docker:local:all` (скрипт: `scripts/e2e/docker-observability-smoke.sh`). Він запускає перевірки діагностики OTEL і Prometheus QA-lab усередині Docker-образу на базі вихідного коду. Встановіть `OPENCLAW_DOCKER_OBSERVABILITY_LOOPS=<count>`, щоб повторити обидві перевірки в межах одного запуску контейнера.
- Live smoke-тест Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffold): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-тест onboarding/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` встановлює запакований tarball OpenClaw глобально в Docker, налаштовує OpenAI через onboarding env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновлює runtime-залежності активованих plugin, і виконує один mock-хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-тест перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` встановлює запакований tarball OpenClaw глобально в Docker, перемикається з package `stable` на git `dev`, перевіряє, що збережений канал і plugin після оновлення працюють, потім повертається до package `stable` і перевіряє статус оновлення.
- Smoke-тест runtime-контексту сеансу: `pnpm test:docker:session-runtime-context` перевіряє збереження транскрипту прихованого runtime-контексту плюс відновлення doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудовані image-провайдери замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` зі зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache між своїми контейнерами root, update і direct-npm. Smoke-тест оновлення за замовчуванням використовує npm `latest` як стабільний baseline перед оновленням до кандидатного tarball. Локально перевизначайте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через вхід `update_baseline_version` workflow Install Smoke на GitHub. Нерутові перевірки installer зберігають ізольований npm cache, щоб записи кешу, що належать root, не маскували поведінку локального встановлення користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними перезапусками.
- CI Install Smoke пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- CLI smoke-тест видалення спільного робочого простору агентів: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає image кореневого Dockerfile, створює два агенти з одним робочим простором в ізольованому home контейнера, запускає `agents delete --json` і перевіряє коректний JSON та поведінку зі збереженим робочим простором. Повторно використовуйте image install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-тест знімка Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що знімки ролей CDP охоплюють URL посилань, clickables, підняті курсором, посилання iframe і метадані frame.
- Регресія мінімального reasoning для OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає mock-сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера і перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст каналу MCP (попередньо ініціалізований Gateway + stdio-міст + raw smoke-тест notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP server + smoke-тест allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + teardown дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-тест встановлення, встановлення/видалення ClawHub, оновлення marketplace і увімкнення/перевірка пакета Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Встановіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначайте типовий package через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke-тест незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованих plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає малий Docker runner image, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте host rebuild після свіжого локального build через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вказуйте на наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегатор один раз попередньо пакує цей tarball, а потім розбиває перевірки bundled channel на незалежні лінії, зокрема окремі лінії оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску bundled-лінії, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Лінія також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення runtime-залежностей doctor.
- Звужуйте runtime-залежності вбудованих plugin під час ітерацій, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати і повторно використовувати спільний функціональний image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image, специфічні для набору, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та installer зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Live-модельні Docker-ранери також bind-mount поточний checkout лише для читання і
розгортають його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, водночас дозволяючи запускати Vitest точно проти вашого локального source/config.
Крок staging пропускає великі локальні кеші та результати збірки застосунку, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунку каталоги `.build` або
Gradle output, щоб live-запуски Docker не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-перевірки gateway не запускали
реальні воркери каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цієї Docker-лінії.
`test:docker:openwebui` — це smoke-тест сумісності вищого рівня: він запускає
контейнер gateway OpenClaw з увімкненими OpenAI-сумісними HTTP endpoint,
запускає зафіксований контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний чат-запит через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
image Open WebUI, а самому Open WebUI може знадобитися завершити власне налаштування холодного старту.
Ця лінія очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — це основний спосіб надати його в Docker-запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord чи iMessage. Він запускає заздалегідь ініціалізований контейнер
Gateway, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію надсилання назовні та сповіщення у стилі Claude про канал +
дозволи через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо аналізує сирі stdio MCP frame, тож smoke-тест підтверджує, що міст
справді надсилає, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує
ключа live-моделі. Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
всередині контейнера, матеріалізує цей server через вбудований runtime
MCP пакета Pi, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа live-моделі.
Він запускає заздалегідь ініціалізований Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke-тест ACP plain-language для потоку (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflow регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації потоків ACP, тож не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`), монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`), монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`), монтується в `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої CLI-авторизації
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`), монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли CLI-авторизації в `$HOME` монтуються лише для читання в `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний image `openclaw:local-live` для повторних запусків, яким не потрібне нове збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані походять зі сховища профілю (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити тег зафіксованого image Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечно для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності agent (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності agent»:

- Mock-виклик інструментів через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють session wiring і ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли Skills перелічено в prompt, чи вибирає agent правильний Skill (або уникає нерелевантних)?
- **Дотримання:** чи читає agent `SKILL.md` перед використанням і чи виконує обов’язкові кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals мають спочатку залишатися детермінованими:

- Runner сценаріїв з mock-провайдерами для перевірки викликів інструментів + їх порядку, читання файлів skill і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на Skills (використати чи уникнути, gating, prompt injection).
- Необов’язкові live-eval (opt-in, з керуванням через env) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
контракту інтерфейсу. Вони ітерують усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit-лінія `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; явно запускайте
контрактні команди, коли змінюєте спільні поверхні channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID потоку
- **directory** - API каталогу/реєстру
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
- **registry** - Форма реєстру plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/селекція auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI й не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додавайте безпечну для CI регресію, якщо це можливо (mock/stub provider або фіксація точного перетворення форми запиту)
- Якщо це за своєю природою лише live-випадок (обмеження швидкості, політики auth), залишайте live-тест вузьким і opt-in через env vars
- Надавайте перевагу найменшому шару, який виявляє баг:
  - баг перетворення/повторення запиту provider → тест прямих моделей
  - баг сесії/історії/пайплайна інструментів gateway → live-smoke gateway або безпечний для CI mock-тест gateway
- Захист від traversal для SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів traversal відхиляються.
  - Якщо ви додаєте нову родину цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується невдачею для некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [CI](/uk/ci)
