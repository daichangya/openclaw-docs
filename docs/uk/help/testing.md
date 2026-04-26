---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір тестування: набори unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-26T10:36:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: f799299d1892d03242d43e6059a2b542fe5997f1fe1db805fbd7ef7a84440ef8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір раннерів Docker. Цей документ — посібник "як ми тестуємо":

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для поширених робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Набір live (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихий запуск одного live-файлу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід, а також невелику перевірку на кшталт читання файлу.
    Моделі, у метаданих яких вказано вхід `image`, також виконують невеликий хід із зображенням.
    Вимкніть додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдерів.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, який включає окремі матричні Docker job для live-моделей,
    розбиті за провайдерами.
  - Для цільових повторних запусків у CI запускайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release викликів.
- Native smoke-тест bound-chat Codex: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane для шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення
    із зображенням проходять через native-прив’язку Plugin, а не через ACP.
- Smoke-тест harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через harness app-server Codex, що належить Plugin,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням також перевіряє image,
    cron MCP, sub-agent і Guardian. Вимкніть перевірку sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої
    app-server Codex. Для цільової перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke-тест rescue-команди Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова опціональна перевірка message-channel rescue-command інтерфейсу.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke-тест planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на типізований
    запис конфігурації з audit.
- Docker smoke-тест першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує базовий `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord Plugin + SecretRef,
    валідує конфігурацію та перевіряє записи audit. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke-тест вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім окремий
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON вказує Moonshot/K2.6 і що
  transcript помічника зберігає нормалізований `usage.cost`.

Порада: якщо вам потрібен лише один проблемний випадок, віддавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## QA-специфічні раннери

Ці команди розташовані поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається для відповідних PR і
через ручний dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний dispatch із mock parity gate, live Matrix lane та
керованим Convex live Telegram lane як паралельними job. `OpenClaw Release Checks`
запускає ті самі lane перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    worker Gateway. `qa-channel` за замовчуванням має concurrency 4 (обмежене
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість worker, або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    хочете отримати артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни lane `mock-openai`,
    що враховує сценарії.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA всередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапори вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані вхідні дані автентифікації QA, які практично використовувати в guest:
    ключі провайдерів через env, шлях до конфігурації QA live provider і `CODEX_HOME`,
    якщо він присутній.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб guest міг записувати назад
    через змонтований workspace.
  - Записує звичайний QA-звіт і підсумок, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Створює npm tarball з поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивне onboarding із ключем OpenAI API, за замовчуванням налаштовує
    Telegram, перевіряє, що ввімкнення Plugin встановлює runtime-залежності за потреби,
    запускає doctor і виконує один локальний хід агента проти mock-endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий lane
    упакованого встановлення з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke-тест зібраного застосунку для transcript
    вбудованого runtime context. Він перевіряє, що прихований runtime context OpenClaw
    зберігається як спеціальне недисплейне повідомлення, а не витікає у видимий хід користувача,
    потім ініціалізує уражений зламаний JSONL сеансу й перевіряє, що
    `openclaw doctor --fix` переписує його до active branch з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, виконує onboarding для встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    QA lane live Telegram із цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі Telegram env-облікові дані або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`, а також
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret присутні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions надає цей lane як ручний workflow для maintainer
    `NPM Telegram Beta E2E`. Він не запускається при merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    зі сконфігурованим OpenAI, а потім вмикає bundled channel/plugins через
    зміни конфігурації.
  - Перевіряє, що виявлення setup залишає runtime-залежності не налаштованих
    Plugin відсутніми, перший сконфігурований запуск Gateway або doctor встановлює
    runtime-залежності кожного bundled Plugin за потреби, а другий перезапуск не
    перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу базову версію npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    відновлює runtime-залежності bundled channel без postinstall-відновлення
    з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke-тест оновлення упакованого встановлення на guest Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім виконує
    встановлену команду `openclaw update` у тому самому guest і перевіряє встановлену
    версію, статус оновлення, готовність gateway і один локальний хід агента.
  - Під час ітерації над одним guest використовуйте `--platform macos`, `--platform windows` або `--platform linux`.
    Використовуйте `--json` для шляху до підсумкового артефакту й
    статусу кожного lane.
  - Обгортайте довгі локальні запуски в host timeout, щоб збої транспорту Parallels
    не спожили решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали lane до `/tmp/openclaw-parallels-npm-update.*`.
    Перевіряйте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на post-update doctor/runtime
    repair залежностей на холодному guest; це все ще є здоровою поведінкою, якщо вкладений
    журнал npm debug продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-lane Parallels
    для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, подачі пакета або стану gateway guest.
  - Post-update proof запускає звичайну поверхню bundled Plugin, оскільки
    capability facade, такі як speech, image generation і media
    understanding, завантажуються через bundled runtime API навіть тоді, коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Упаковані встановлення OpenClaw не постачаються з
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout репозиторію завантажують bundled runner безпосередньо; окремий крок встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Plugin Matrix як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки lane локально створює тимчасових користувачів.
  - Записує QA-звіт Matrix, підсумок, артефакт observed-events і комбінований журнал виводу stdout/stderr до `.artifacts/qa-e2e/...`.
  - За замовчуванням показує прогрес і застосовує жорсткий тайм-аут виконання через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). Очищення обмежується через `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а в разі збоїв включається команда відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live QA lane Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим id чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулінгових облікових даних. За замовчуванням використовуйте режим env, або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пулінгові оренди.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
    хочете отримати артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів у тій самій приватній групі, причому бот SUT має мати username Telegram.
  - Для стабільного спостереження bot-to-bot увімкніть режим Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує QA-звіт Telegram, підсумок і артефакт observed-messages до `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту надсилання driver до спостережуваної відповіді SUT.

Live transport lane використовують один стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним набором QA і не входить до матриці покриття live transport.

| Lane     | Канарка | Гейтінг згадок | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда довідки |
| -------- | ------- | -------------- | -------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | --------------- |
| Matrix   | x       | x              | x                    | x                         | x                             | x                          | x               | x                          |                 |
| Telegram | x       |                |                      |                           |                               |                            |                 |                            | x               |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди, поки lane працює, і звільняє оренду під час завершення.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Потрібні змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback-URL Convex `http://` лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Для команд адміністрування maintainer (додавання/видалення/перелік пулу) потрібен
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker,
префікс endpoint, HTTP-тайм-аут і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машинозчитуваного виводу в скриптах і утилітах CI.

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
- `groupId` має бути рядком із числовим id чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Адаптер транспорту для каналу.
2. Набір сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` відповідає за спільну хост-механіку:

- корінь команд `openclaw qa`
- запуск і завершення наборів
- concurrency worker
- запис артефактів
- генерацію звітів
- виконання сценаріїв
- alias сумісності для старіших сценаріїв `qa-channel`

Runner Plugin відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcript і нормалізований стан транспорту
- як виконуються дії, що підтримуються транспортом
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг впровадження для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Залиште специфічну для транспорту механіку всередині runner Plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючий кореневий командний простір.
   Runner Plugin мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Залишайте `runtime-api.ts` легким; лінивий CLI і виконання runner мають залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте generic-хелпери сценаріїв для нових сценаріїв.
7. Зберігайте роботу наявних alias сумісності, якщо тільки репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від транспорту одного каналу, залишайте її в runner Plugin або harness цього Plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте generic-хелпер замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту й явно зазначайте це в контракті сценарію.

Бажані назви generic-хелперів для нових сценаріїв:

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

Для нової роботи з каналами слід використовувати generic-назви хелперів.
Alias сумісності існують, щоб уникнути міграції за один день, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як “зростання реалізму” (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нетаргетовані запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати shard з кількома проєктами в конфігурації на кожен проєкт для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, які покриває `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Внутрішньопроцесні integration-тести (автентифікація gateway, маршрутизація, інструментарій, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, shard і scoped lane">

    - Нетаргетований `pnpm test` запускає дванадцять менших shard-конфігурацій (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу root-project. Це зменшує піковий RSS на навантажених машинах і не дає роботі `auto-reply`/extension виснажувати не пов’язані набори.
    - `pnpm test --watch` усе ще використовує нативний граф проєктів root `vitest.config.ts`, оскільки цикл watch із кількома shard непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lane, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` дозволяє уникнути повної вартості запуску root project.
    - `pnpm test:changed` розгортає змінені шляхи git у ті самі scoped lane, коли diff зачіпає лише routable-файли source/test; редагування config/setup, як і раніше, повертаються до ширшого повторного запуску root-project.
    - `pnpm check:changed` — це звичайний розумний локальний gate для вузької роботи. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні lane typecheck/lint/test. Зміни публічного Plugin SDK і plugin-contract включають один validation-pass extension, оскільки extension залежать від цих контрактів core. Version bump лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із запобіжником, який відхиляє зміни package поза полем version верхнього рівня.
    - Редагування live Docker ACP harness запускають сфокусований локальний gate: синтаксис shell для скриптів live Docker auth, dry-run планувальника live Docker, unit-тести ACP bind і тести extension ACPX. Зміни `package.json` включаються лише тоді, коли diff обмежено `scripts["test:docker:live-*"]`; зміни dependency, export, version та інші редагування поверхні package, як і раніше, використовують ширші запобіжники.
    - Unit-тести з легкими import із агентів, команд, Plugin, хелперів `auto-reply`, `plugin-sdk` та подібних чистих утилітарних зон маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lane.
    - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють changed-mode запуски з явними sibling-тестами в цих легких lane, тому редагування helper уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має окремі bucket для helper верхнього рівня core, integration-тестів верхнього рівня `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково ділить піддерево reply на shard agent-runner, dispatch і commands/state-routing, щоб один bucket із важкими import не володів усім tail Node.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime context Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації та
      нормалізації.
    - Підтримуйте integration-набори embedded runner у здоровому стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction, як і раніше, проходять
      через реальні шляхи `run.ts` / `compact.ts`; helper-only тести
      не є достатньою заміною для цих integration-шляхів.

  </Accordion>

  <Accordion title="Типові значення пулу та ізоляції Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у root project, а також у конфігураціях e2e і live.
    - Root lane UI зберігає свій `jsdom` setup і optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення
      `threads` + `isolate: false` зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх процесів Node Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lane запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staging і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею або push, коли вам
      потрібен розумний локальний gate. Зміни публічного Plugin SDK і plugin-contract
      включають один validation-pass extension.
    - `pnpm test:changed` маршрутизує через scoped lane, коли змінені шляхи
      чисто відповідають меншому набору.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом worker.
    - Автомасштабування локальних worker навмисно є консервативним і знижує навантаження,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як
      `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється wiring тестів.
    - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну локацію кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість import, а також
      вивід деталізації import.
    - `pnpm test:perf:imports:changed` обмежує той самий профілювальний вигляд
      файлами, зміненими відносно `origin/main`.
    - Дані про час виконання shard записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски цілої конфігурації використовують шлях конфігурації як ключ; shard CI
      з include-pattern додають назву shard, щоб відфільтровані shard можна було
      відстежувати окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на startup import,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      мокайте цей seam безпосередньо, замість глибоких import runtime-хелперів
      лише для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` з нативним шляхом root-project для цього закоміченого
      diff і виводить wall time плюс максимальний RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
      брудного дерева, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root-конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує профіль CPU main-thread для
      startup Vitest/Vite і transform-overhead.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для
      unit-набору з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Проганяє синтетичне навантаження повідомленнями gateway, пам’яттю та великими payload через шлях діагностичних подій
  - Виконує запит до `diagnostics.stability` через WS RPC Gateway
  - Покриває helper збереження діагностичного stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні зразки RSS залишаються в межах бюджету тиску, а глибина черги на рівні сеансу повертається до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшої роботи зі stability-регресіями, а не заміна повного набору Gateway

### E2E (smoke gateway)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled Plugin у `extensions/`
- Типові значення runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і в решті репозиторію.
  - Використовує adaptive worker (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням запускається в silent mode, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість worker (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути детальний вивід у console.
- Обсяг:
  - End-to-end поведінка gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, pairing Node і важче мережеве навантаження
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестів (може бути повільніше)

### E2E: smoke backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Виконує backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` щоб указати нестандартний CLI-бінарник або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled Plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - “Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?”
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом нестабільні для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштують грошей / використовують rate limit
  - Краще запускати звужені підмножини, а не “все”
- Live-запуски підвантажують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth до тимчасового test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але пригнічує додаткове повідомлення `~/.profile` і вимикає bootstrap-логи gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup-логи.
- Ротація API-ключів (залежно від провайдера): встановіть `*_API_KEYS` у форматі ком/крапок з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або per-live перевизначення через `OPENCLAW_LIVE_*_KEY`; тести виконують повторні спроби при відповідях rate limit.
- Вивід progress/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів помітно активні, навіть коли захоплення console у Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення console у Vitest, тож рядки прогресу провайдера/gateway одразу транслюються під час live-запусків.
  - Налаштовуйте Heartbeat direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої взаємодії gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте “мій бот не працює” / специфічні збої провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live (мережеві) тести

Для live-матриці моделей, smoke-тестів CLI backend, smoke-тестів ACP, harness app-server Codex
і всіх live-тестів media-provider (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Раннери Docker (необов’язкові перевірки "працює в Linux")

Ці раннери Docker поділяються на дві групи:

- Раннери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint: `test:live:models-profiles` і `test:live:gateway-profiles`.
- За замовчуванням раннери Docker live мають менший smoke-ліміт, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає Docker-образ live через `test:docker:live-build`, а потім повторно використовує його для lane Docker live. Він також збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для раннерів E2E container smoke, які тестують зібраний застосунок. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як ресурсні ліміти не дають важким lane live, npm-install і multi-service запускатися всі одночасно. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. За замовчуванням раннер виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, виводить статус кожні 30 секунд, зберігає час успішних lane у `.artifacts/docker-tests/lane-timings.json` і використовує ці дані часу, щоб у наступних запусках спочатку запускати довші lane. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест lane без збирання або запуску Docker.
- Раннери container smoke: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Раннери Docker для live-моделей також bind-mount лише потрібні каталоги auth CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни host-сховища auth:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово покриває Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повний scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-тест onboarding/channel/agent для npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding env-ref і типово Telegram, перевіряє, що doctor відновлює активовані runtime-залежності Plugin, і виконує один mock-хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host-збирання через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-тест session runtime context: `pnpm test:docker:session-runtime-context` перевіряє збереження transcript прихованого runtime context, а також doctor-repair для уражених дубльованих гілок prompt-rewrite.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled-провайдери image замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host-збирання через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` використовує спільний кеш npm для своїх контейнерів root, update і direct-npm. Smoke-тест update типово використовує npm `latest` як стабільну базову версію перед оновленням до tarball-кандидата. Перевірки installer без root зберігають ізольований кеш npm, щоб записи кешу, що належать root, не маскували поведінку локального встановлення користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними перезапусками.
- Install Smoke CI пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke-тест CLI agents delete shared workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає образ root Dockerfile, ініціалізує двох агентів із одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє коректний JSON та поведінку зі збереженням workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-тест Browser CDP snapshot: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source-образ E2E плюс шар Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що snapshot ролей CDP охоплюють URL посилань, clickable-елементи з просуванням курсора, iframe-ref і метадані frame.
- Регресія мінімального reasoning для OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає mock-сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера й перевіряє, що сирі деталі з’являються в журналах Gateway.
- Міст MCP channel (ініціалізований Gateway + stdio bridge + raw Claude smoke для notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP-сервер + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-тест встановлення, встановлення/видалення ClawHub, оновлення marketplace і ввімкнення/перевірка пакета Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Встановіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити live-блок ClawHub, або перевизначте типовий пакет через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke-тест незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності bundled Plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий образ раннера Docker, один раз збирає й пакує OpenClaw на host, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть host-збирання після свіжого локального збирання через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегат попередньо пакує цей tarball один раз, а потім ділить перевірки bundled channel на незалежні lane, зокрема окремі lane оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю channel при прямому запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують doctor/runtime-dependency repair.
- Звужуйте runtime-залежності bundled Plugin під час ітерацій, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використати спільний образ built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для набору перевизначення образів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, як і раніше, мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та installer зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Раннери Docker для live-моделей також bind-mount поточний checkout у режимі лише читання і
розміщують його в тимчасовому workdir усередині контейнера. Це зберігає runtime-образ
компактним, але водночас дозволяє запускати Vitest точно на вашому локальному source/config.
Крок staging пропускає великі локальні кеші та результати збірки застосунку, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунку каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні worker каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття gateway з цього Docker lane.
`test:docker:openwebui` — це суміснісний smoke-тест вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими HTTP-endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, тому що Docker може знадобитися завантажити
образ Open WebUI, а самому Open WebUI може знадобитися завершити власне cold-start налаштування.
Цей lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає
контейнер Gateway з попередньою ініціалізацією, запускає другий контейнер, який піднімає `openclaw mcp serve`, а потім
перевіряє маршрутизоване виявлення розмов, читання transcript, метадані вкладень,
поведінку live-черги подій, маршрутизацію outbound-надсилання та сповіщення каналу +
дозволів у стилі Claude через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо аналізує сирі stdio MCP frame, тож smoke-тест перевіряє те, що
міст справді надсилає, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує
ключа live-моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe-сервер
усередині контейнера, матеріалізує цей сервер через вбудований runtime MCP пакета Pi,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає Gateway з попередньою ініціалізацією з реальним stdio MCP probe-сервером, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний ACP smoke plain-language thread (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування auth зовнішнього CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Зовнішні каталоги/файли auth CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, як-от `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне нове збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані надходять зі сховища profile, а не з env
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt nonce-check, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка коректності docs

Запускайте перевірки docs після редагування документації: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Offline-регресія (безпечна для CI)

Це регресії “реального pipeline” без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, запис config + auth із примусовим контролем): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Evals надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як “evals надійності агента”:

- Mock-виклик інструментів через реальний gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, що перевіряють wiring сеансу та ефекти config (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічені в prompt, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сеансу та межі sandbox.

Майбутні evals мають спочатку залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання Skill-файлів і wiring сеансу.
- Невеликий набір сценаріїв, орієнтованих на Skills (використовувати чи уникати, гейтінг, prompt injection).
- Необов’язкові live-evals (opt-in, з керуванням через env) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма Plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і канал відповідає своєму
контракту інтерфейсу. Вони проходять по всіх виявлених Plugin і запускають набір
перевірок форми та поведінки. Типовий unit-lane `pnpm test` навмисно
пропускає ці файли спільного seam і smoke; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь каналу або провайдера.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сеансу
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID thread
- **directory** - API каталогу/реєстру
- **group-policy** - Застосування групової політики

### Контракти статусу провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу каналу
- **registry** - Форма реєстру Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/selection auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни Plugin каналу чи провайдера
- Після рефакторингу реєстрації Plugin або механізму виявлення

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub провайдера або фіксацію точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limit, політики auth), залишайте live-тест вузьким і opt-in через змінні середовища
- Віддавайте перевагу найменшому шару, який виявляє баг:
  - баг перетворення/відтворення запиту провайдера → тест direct models
  - баг pipeline сеансу/історії/інструментів gateway → live smoke gateway або безпечний для CI mock-тест gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id для сегмента обходу відхиляються.
  - Якщо ви додаєте нову цільову сім’ю SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою на некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
