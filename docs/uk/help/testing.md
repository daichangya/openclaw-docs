---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделей/провайдерів
    - Налагодження поведінки Gateway + агентів
summary: 'Набір для тестування: набори unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-26T03:02:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03ada15a8113b371529ca62f0816442e724dcf837061db871c90212acc87b690
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
ранерів Docker. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових робочих сценаріїв (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск усіх наборів на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над однією помилкою спершу віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потребує реальних облікових даних):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід і невелику перевірку у стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують крихітний хід із зображенням.
    Вимкніть додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, що включає окремі matrix jobs Docker live model,
    розбиті за провайдером.
  - Для цільових повторних запусків у CI запускайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    планових/релізних викликів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення-зображення
    проходять через native Plugin binding, а не через ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Пропускає ходи агентів Gateway через harness app-server Codex, що належить Plugin,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням також виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимкніть перевірку sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої app-server Codex.
    Для цільової перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершиться після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke команди відновлення Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова belt-and-suspenders-перевірка поверхні команди відновлення message-channel за явним увімкненням.
    Вона виконує `/crestodian status`, ставить у чергу постійну
    зміну моделі, відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у container без config із підробним Claude CLI у `PATH`
    і перевіряє, що резервний fuzzy planner перетворюється на audited typed
    запис config.
- Docker smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього каталогу стану OpenClaw, спрямовує простий `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord Plugin + SecretRef,
    валідує config і перевіряє записи audit. Той самий шлях налаштування Ring 0
    також покривається в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke перевірка вартості Moonshot/Kimi: коли задано `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6 і що
  transcript помічника зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через env vars allowlist, описані нижче.

## Ранери, специфічні для QA

Ці команди розташовані поруч із основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflows. `Parity gate` запускається на відповідних PR і
з ручного запуску з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного запуску з mock parity gate, live Matrix lane та
live Telegram lane під керуванням Convex як паралельними jobs. `OpenClaw Release Checks`
запускає ті самі lane перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками Gateway. `qa-channel` за замовчуванням має concurrency 4 (обмежене
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість worker, або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдався. Використовуйте `--allow-failures`, коли
    хочете отримати артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни lane `mock-openai`,
    орієнтованого на сценарії.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані вхідні дані автентифікації QA, практичні для guest:
    ключі провайдерів на основі env, шлях config live-провайдера QA і `CODEX_HOME`, якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайні QA report + summary, а також журнали Multipass до
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивний onboarding з API-ключем OpenAI, налаштовує Telegram
    за замовчуванням, перевіряє, що ввімкнення Plugin встановлює runtime dependencies за потреби,
    запускає doctor і виконує один локальний хід агента проти змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий lane
    встановлення пакета з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke built-app для transcript із вбудованим runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    недисплейне кастомне повідомлення, а не витікає у видимий хід користувача,
    потім створює початковий JSONL зламаної сесії та перевіряє, що
    `openclaw doctor --fix` переписує його на active branch із резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, запускає onboarding
    встановленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA lane з цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі env credentials Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/релізу встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` разом із
    `OPENCLAW_QA_CONVEX_SITE_URL` і секретом ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    обгортка Docker автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions надає цей lane як ручний workflow для мейнтейнерів
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через редагування config.
  - Перевіряє, що виявлення setup залишає runtime dependencies не налаштованого Plugin
    відсутніми, що перший налаштований запуск Gateway або doctor встановлює runtime dependencies
    кожного bundled Plugin за потреби, і що другий перезапуск не перевстановлює
    dependencies, які вже були активовані.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>`, і перевіряє, що doctor кандидата після
    оновлення відновлює runtime dependencies bundled channel без
    postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke оновлення packaged-install через гостьові системи Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний baseline package, потім виконує
    встановлену команду `openclaw update` у тій самій guest-системі та перевіряє встановлену
    версію, статус оновлення, готовність gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерації над однією guest-системою. Використовуйте `--json` для шляху до summary artifact і
    статусу для кожного lane.
  - Обгортайте тривалі локальні запуски у host timeout, щоб зависання транспорту Parallels не
    з’їло решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали lane до `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на відновлення doctor/runtime
    dependencies після оновлення на холодній guest-системі; це все ще є нормальним, якщо вкладений
    npm debug log просувається.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke lane Parallels
    для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, обслуговування package або стану gateway guest-системи.
  - Доведення після оновлення запускає звичайну поверхню bundled Plugin, тому що
    фасади можливостей, такі як speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть якщо сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти одноразового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Пакетні встановлення OpenClaw не постачають
    `qa-lab`, тому не надають `openclaw qa`.
  - Checkout репозиторію завантажують bundled runner напряму; окремий крок встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) і одну приватну кімнату, потім запускає дочірній QA gateway з реальним Plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки lane локально створює одноразових користувачів.
  - Записує звіт Matrix QA, summary, артефакт observed-events і об’єднаний журнал виводу stdout/stderr до `.artifacts/qa-e2e/...`.
  - За замовчуванням виводить прогрес і застосовує жорсткий timeout виконання через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). Очищення обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а помилки включають команду відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени бота driver і бота SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних pooled credentials. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдався. Використовуйте `--allow-failures`, коли
    хочете отримати артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів у тій самій приватній групі, причому бот SUT має мати Telegram username.
  - Для стабільного спостереження бот-до-бота увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, summary і артефакт observed-messages до `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостережуваної відповіді SUT.

Live transport lanes мають один спільний стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним набором QA і не є частиною матриці покриття live transport.

| Lane     | Canary | Контроль згадок | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальше повідомлення у треді | Ізоляція тредів | Спостереження за реакціями | Команда help |
| -------- | ------ | --------------- | -------------------- | ------------------------- | ----------------------------- | ----------------------------- | --------------- | -------------------------- | ------------ |
| Matrix   | x      | x               | x                    | x                         | x                             | x                             | x               | x                          |              |
| Telegram | x      |                 |                      |                           |                               |                               |                 |                            | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), QA lab отримує ексклюзивну lease із пулу на базі Convex, надсилає Heartbeat для цієї lease під час роботи lane і звільняє lease під час завершення.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення з env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Адміністративні команди мейнтейнера (додавання/видалення/список пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для мейнтейнерів:

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
- `POST /admin/add` (лише секрет мейнтейнера)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет мейнтейнера)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет мейнтейнера)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком числового ідентифікатора чату Telegram.
- `admin/add` валідує цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Адаптера транспорту для каналу.
2. Набору сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, коли спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` відповідає за спільну механіку хоста:

- кореневу команду `openclaw qa`
- запуск і завершення набору
- паралелізм worker
- запис артефактів
- генерацію звітів
- виконання сценаріїв
- сумісні псевдоніми для старіших сценаріїв `qa-channel`

Runner Plugins відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcript і нормалізований стан транспорту
- як виконуються дії на базі транспорту
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг впровадження для нового каналу:

1. Зберігайте `qa-lab` як власника спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Зберігайте специфічну для транспорту механіку всередині runner Plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючу кореневу команду.
   Runner Plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Зберігайте `runtime-api.ts` легким; ледаче виконання CLI і runner має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні допоміжні функції сценаріїв для нових сценаріїв.
7. Зберігайте роботу наявних псевдонімів сумісності, якщо в репозиторії не виконується навмисна міграція.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного канального транспорту, зберігайте її в runner Plugin або harness цього Plugin.
- Якщо сценарію потрібна нова можливість, якою може користуватися більше ніж один канал, додайте загальну helper-функцію замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, зберігайте сценарій специфічним для цього транспорту й явно вказуйте це в контракті сценарію.

Бажані імена загальних helper-функцій для нових сценаріїв:

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

Нова робота над каналами має використовувати загальні назви helper-функцій.
Псевдоніми сумісності існують, щоб уникнути одномоментної міграції, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Думайте про набори як про «зростаючий реалізм» (і зростаючу нестабільність/вартість):

### Unit / integration (типово)

- Команда: `pnpm test`
- Config: ненаправлені запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у конфігурації для кожного проєкту для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelisted node-тести `ui`, які покриває `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Внутрішньопроцесні integration-тести (автентифікація gateway, маршрутизація, інструменти, парсинг, config)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускаються в CI
  - Реальні ключі не потрібні
  - Мають бути швидкими та стабільними

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненаправлений `pnpm test` запускає дванадцять менших shard-конфігурацій (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу native root-project. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
    - `pnpm test --watch` усе ще використовує native граф проєктів root `vitest.config.ts`, тому що цикл watch із кількома shards є непрактичним.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` розгортає змінені шляхи git у ті самі scoped lanes, коли diff торкається лише source/test-файлів, які можна маршрутизувати; редагування config/setup усе ще повертаються до широкого повторного запуску root-project.
    - `pnpm check:changed` — це звичайний smart local gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні lanes typecheck/lint/test. Зміни публічного Plugin SDK і plugin-contract включають один прохід валідації extension, оскільки extensions залежать від цих контрактів core. Оновлення версій лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни package поза полем version верхнього рівня.
    - Редагування live Docker ACP harness запускають цільовий local gate: shell-синтаксис для live Docker auth scripts, dry-run live Docker scheduler, unit-тести ACP bind і тести ACPX extension. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; редагування dependency, export, version та інших поверхонь package усе ще використовують ширші захисти.
    - Unit-тести з легкими імпортами для agents, commands, plugins, helper-функцій auto-reply, `plugin-sdk` та подібних чистих утилітних областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними sibling tests у цих легких lanes, тому редагування helper-функцій не змушують повторно запускати весь важкий набір для цього каталогу.
    - `auto-reply` має окремі buckets для helper-функцій core верхнього рівня, integration-тестів `reply.*` верхнього рівня та піддерева `src/auto-reply/reply/**`. У CI піддерево reply додатково розбивається на shards agent-runner, dispatch і commands/state-routing, щоб один bucket із важкими імпортами не забирав увесь Node tail.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime context Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте цільові helper-регресії для чистих меж маршрутизації та
      нормалізації.
    - Підтримуйте здоровий стан integration-наборів embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка Compaction усе ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише для helper-функцій
      не є достатньою заміною для цих integration-шляхів.

  </Accordion>

  <Accordion title="Типові значення pool та isolation у Vitest">

    - Базова config Vitest типово використовує `threads`.
    - Спільна config Vitest фіксує `isolate: false` і використовує
      non-isolated runner у root projects, e2e та live configs.
    - Root lane UI зберігає свої `jsdom` setup та optimizer, але також працює на
      спільному non-isolated runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної config Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook відповідає лише за форматування. Він повторно додає
      відформатовані файли до staging і не запускає lint, typecheck чи тести.
    - Явно запускайте `pnpm check:changed` перед передачею роботи або push, коли вам
      потрібен smart local gate. Зміни публічного Plugin SDK і plugin-contract
      включають один прохід валідації extension.
    - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи
      чисто відображаються на менший набір.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом worker.
    - Автомасштабування локальних worker навмисно консервативне і зменшує навантаження,
      коли середнє навантаження хоста вже високе, тому кілька паралельних
      запусків Vitest типово завдають менше шкоди.
    - Базова config Vitest позначає файли projects/config як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними,
      коли змінюється wiring тестів.
    - Config зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на
      підтримуваних хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну локацію cache для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітність Vitest щодо тривалості імпорту та
      вивід breakdown імпортів.
    - `pnpm test:perf:imports:changed` обмежує той самий вигляд профілювання
      файлами, зміненими відносно `origin/main`.
    - Дані про час shard записуються до `.artifacts/vitest-shard-timings.json`.
      Запуски всієї config використовують шлях config як ключ; CI-shards з include-pattern
      додають ім’я shard, щоб відфільтровані shards можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на імпорти під час запуску,
      тримайте важкі dependencies за вузьким локальним seam `*.runtime.ts` і
      мокайте цей seam напряму, замість глибокого імпорту runtime helper-функцій
      лише для того, щоб передати їх у `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із native root-project path для цього закоміченого
      diff і виводить wall time та максимальний RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` вимірює поточне брудне дерево,
      маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root config Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile основного потоку для
      накладних витрат запуску та трансформації Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit-набору з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Stability (Gateway)

- Команда: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Пропускає синтетичне churn повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Виконує запит до `diagnostics.stability` через Gateway WS RPC
  - Покриває helper-функції збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS не перевищують бюджет тиску, а глибина черг для кожної сесії знову зменшується до нуля
- Очікування:
  - Безпечний для CI і без ключів
  - Вузький lane для подальшого аналізу regression stability, а не заміна повного набору Gateway

### E2E (Gateway smoke)

- Команда: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Типові значення runtime:
  - Використовує `threads` Vitest з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних worker (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в silent mode, щоб зменшити накладні витрати виводу в консоль.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість worker (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка кількох екземплярів gateway
  - Поверхні WebSocket/HTTP, pairing Node і важчий мережевий трафік
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж в unit-тестах (може бути повільніше)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє поведінку remote-canonical файлової системи через bridge fs sandbox
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і справного демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний бінарний файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - Навмисно не є стабільними для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштують грошей / використовують rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підвантажують `~/.profile`, щоб підібрати відсутні API-ключі.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють config/auth-матеріали до тимчасового test home, щоб unit fixtures не могли змінювати ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово використовує тихіший режим: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення `~/.profile` і приглушує журнали bootstrap Gateway/Bonjour chatter. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація API-ключів (залежно від провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для окремого live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід progress/Heartbeat:
  - Live-набори тепер виводять рядки progress у stderr, щоб було видно активність під час довгих викликів провайдера, навіть коли перехоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки progress провайдера/gateway одразу транслюються під час live-запусків.
  - Налаштовуйте Heartbeat direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви багато чого змінили)
- Торкаєтесь мережевої взаємодії gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live-матриці моделей, smoke-перевірок CLI backend, ACP smoke, harness Codex app-server
і всіх live-тестів медіа-провайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також для обробки облікових даних під час live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker runners (необов’язкові перевірки «працює в Linux»)

Ці Docker runners поділяються на дві категорії:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл з ключем профілю всередині Docker image репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і підвантажують `~/.profile`, якщо він змонтований). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners типово мають меншу межу smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для live Docker lanes. Він також збирає один спільний image `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для container smoke runners E2E, які перевіряють built app. Агрегат використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дозволяють усім важким lanes live, npm-install і multi-service запускатися одночасно. Типові значення — 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли хост Docker має більший запас ресурсів. Runner типово виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, виводить статус кожні 30 секунд, зберігає час виконання успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці дані, щоб у наступних запусках стартувати з довших lanes. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест lane без збирання чи запуску Docker.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker runners для live-моделей також bind-mount лише потрібні auth homes CLI (або всі підтримувані, якщо запуск не звужений), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін у host auth store:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово покриває Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness Codex app-server: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, повний scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent для npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновлює активовані runtime dependencies Plugin, і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження transcript прихованого runtime context, а також відновлення doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` зі зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` використовує один спільний npm cache для своїх root-, update- і direct-npm-контейнерів. Smoke оновлення типово використовує npm `latest` як стабільний baseline перед оновленням до candidate tarball. Перевірки installer без root зберігають ізольований npm cache, щоб записи cache, що належать root, не маскували поведінку локального встановлення користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm у локальних повторних запусках.
- Install Smoke у CI пропускає дубльоване пряме глобальне оновлення npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke CLI для видалення shared workspace агентів: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає image root Dockerfile, створює два агенти з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє коректний JSON та поведінку зі збереженим workspace. Повторно використовуйте image install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева взаємодія Gateway (два контейнери, автентифікація WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера й перевіряє, що сирі деталі з’являються в журналах Gateway.
- Міст каналу MCP (ініціалізований Gateway + stdio bridge + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти Pi bundle MCP (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke без змін оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime dependencies bundled Plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий Docker runner image, один раз збирає й пакує OpenClaw на host, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть host rebuild після свіжого локального збирання через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate один раз попередньо пакує цей tarball, а потім розбиває перевірки bundled channel на незалежні lanes, зокрема окремі lanes оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити channel matrix під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Звужуйте runtime dependencies bundled Plugin під час ітерації, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати та повторно використати спільний built-app image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретних наборів, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають вищий пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо він ще не локальний. Тести Docker для QR та installer зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільне runtime built app.

Docker runners для live-моделей також bind-mount поточний checkout у режимі лише для читання й
розміщують його в тимчасовому workdir усередині контейнера. Це зберігає runtime
image компактним, але водночас запускає Vitest точно проти вашого локального source/config.
Крок staging пропускає великі локальні кеші та результати збирання app, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для app каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probes gateway не запускали
реальні channel workers Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цього Docker lane.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
контейнер gateway OpenClaw з увімкненими HTTP endpoint, сумісними з OpenAI,
запускає pinned контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний chat-запит через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
image Open WebUI, а самому Open WebUI може знадобитися завершити власний cold-start setup.
Цей lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на зразок `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального облікового запису Telegram, Discord чи iMessage. Він запускає контейнер
Gateway із початковими даними, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє маршрутизоване виявлення розмов, читання transcript, метадані вкладень,
поведінку черги live events, маршрутизацію вихідного надсилання, а також повідомлення
про channel + permission у стилі Claude через реальний міст stdio MCP. Перевірка повідомлень
безпосередньо аналізує сирі кадри stdio MCP, тому smoke-перевірка валідує те, що
міст реально виводить, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує
ключа live-моделі. Він збирає Docker image репозиторію, запускає реальний probe server stdio MCP
усередині контейнера, матеріалізує цей сервер через вбудований runtime bundle MCP Pi,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає Gateway із початковими даними та реальним probe server stdio MCP, виконує
ізольований cron-хід і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручна smoke-перевірка plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для сценаріїв регресії/налагодження. Він може знову знадобитися для валідації маршрутизації thread ACP, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace без зовнішніх auth-mount CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли auth CLI в `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків, яким не потрібне повторне збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити pinned tag image Open WebUI

## Перевірка коректності docs

Після редагування docs запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну валідацію anchor у Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, примусовий запис config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (Skills)

У нас уже є кілька безпечних для CI тестів, що поводяться як «оцінювання надійності агентів»:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки wizard, які перевіряють wiring сесії та ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Рішення:** коли Skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатоходові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні оцінювання мають спочатку залишатися детермінованими:

- Scenario runner з mock-провайдерами для перевірки викликів інструментів + порядку, читання skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live-оцінювання (за явним увімкненням, керовані env) — лише після появи безпечного для CI набору.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає
своєму інтерфейсному контракту. Вони перебирають усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли змінюєте спільні поверхні channel або provider.

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
- **inbound** - Обробка вхідного повідомлення
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API каталогу/реєстру
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
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
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни channel чи provider Plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI й не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему provider/model, виявлену в live:

- За можливості додайте безпечну для CI регресію (mock/stub provider або захопіть точну трансформацію форми запиту)
- Якщо проблема за своєю природою стосується лише live (rate limits, політики auth), залишайте live-тест вузьким і з увімкненням через env vars
- Віддавайте перевагу націлюванню на найменший шар, який виявляє баг:
  - баг перетворення/повторення запиту provider → direct models test
  - баг pipeline сесії/історії/інструментів gateway → gateway live smoke або безпечний для CI mock-тест gateway
- Захист проходження SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що `exec id` сегмента проходження відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
