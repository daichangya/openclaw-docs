---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T13:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

QA Lab має окремі смуги CI поза основним workflow із розумним визначенням області змін. Workflow `Parity gate` запускається для відповідних змін у PR і через manual dispatch; він збирає приватний runtime QA та порівнює агентні пакети mock GPT-5.4 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram lane використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі смуги QA Lab перед схваленням релізу.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і будує CI-маніфест | Завжди для нечернеткових push і PR   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі advisories npm                           | Завжди для нечернеткових push і PR   |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для нечернеткових push і PR   |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built artifacts і повторно використовувані downstream artifacts | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі смуги коректності Linux, такі як bundled/plugin-contract/protocol checks              | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Розшардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки    | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled plugins для всього набору extensions                              | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди основних Node-тестів, за винятком смуг каналів, bundled, контрактів і extensions       | Зміни, релевантні для Node           |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                              | Pull request зі змінами в extensions |
| `check`                          | Розшардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`               | Шарди архітектури, меж, захисту extension-surface, package-boundary і gateway-watch          | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke-тест пам’яті під час запуску                              | Зміни, релевантні для Node           |
| `checks`                         | Верифікатор для тестів каналів built artifacts плюс сумісність Node 22 лише для push         | Зміни, релевантні для Node           |
| `check-docs`                     | Перевірки форматування документації, lint і битих посилань                                   | Змінено документацію                 |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Skills на Python |
| `checks-windows`                 | Смуги тестів, специфічні для Windows                                                         | Зміни, релевантні для Windows        |
| `macos-node`                     | Смуга TypeScript-тестів на macOS із використанням спільних built artifacts                   | Зміни, релевантні для macOS          |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS          |
| `android`                        | Android unit tests для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні для Android        |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих завдань артефактів і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` лише для PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`.
Зміни у workflow CI перевіряють граф Node CI плюс linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні смуги залишаються прив’язаними до змін у коді відповідних платформ.
Перевірки Windows Node прив’язані до специфічних для Windows wrappers для process/path, helper-утиліт npm/pnpm/UI runner, конфігурації package manager і поверхонь workflow CI, які запускають цю смугу; непов’язані зміни в коді, plugins, install-smoke і лише тестах залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже виконується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, пов’язаних із встановленням, пакуванням, контейнерами, production changes у bundled extension і основними поверхнями plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише в тестах і документації не резервують Docker workers. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож він усе ще перевіряє встановлення без повторного завантаження залежностей у кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в завданні, тому додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image з `scripts/e2e/Dockerfile`, а потім запускає смуги live/E2E паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову паралельність 4 через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегатор типово припиняє планувати нові pooled lanes після першої помилки, а кожна смуга має timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Смуги, чутливі до запуску або provider, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний workflow live/E2E віддзеркалює шаблон спільного image: спочатку будує й публікує один Docker E2E image у GHCR, позначений SHA, перед Docker matrix, а потім запускає matrix із `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker-набір релізного шляху. Docker-тести QR та installer зберігають власні Dockerfile, орієнтовані на встановлення. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin із timeout команди 120 секунд: repair залежностей setup-entry плюс ізоляцію синтетичних збоїв bundled-loader. Повна матриця bundled update/channel залишається manual/full-suite, тому що виконує повторні реальні проходи npm update і doctor repair.

Логіка локальних changed lanes міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка область платформ CI: зміни в основному production-коді запускають typecheck основного production-коду плюс основні тести, зміни лише в основних тестах запускають лише typecheck/tests основних тестів, production changes в extensions запускають typecheck production-коду extensions плюс тести extensions, а зміни лише в тестах extensions запускають лише typecheck/tests тестів extensions. Зміни у публічному Plugin SDK або plugin-contract розширюють валідацію на extensions, тому що extensions залежать від цих основних контрактів. Підвищення версій лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config переводять виконання в безпечний режим усіх смуг.

Для push матриця `checks` додає смугу `compat-node22`, яка запускається лише для push. Для pull request ця смуга пропускається, і матриця зосереджується на звичайних test/channel lanes.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на шість зважених шардів загалом, тести bundled plugins балансуються між шістьма workers для extensions, auto-reply працює як три збалансовані workers замість шести дрібних workers, а конфігурації agentic gateway/plugin розподіляються по наявних agentic Node jobs лише для вихідного коду замість очікування built artifacts. Широкі тести browser, QA, media та різних plugins використовують свої окремі конфігурації Vitest замість спільного універсального набору plugin-тестів. Широка agents lane використовує спільний планувальник паралельного виконання файлів Vitest, оскільки в ній домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard `infra core-runtime`, щоб спільний runtime shard не залишався найдовшим. `check-additional` утримує разом compile/canary роботу package-boundary та відокремлює архітектуру runtime topology від покриття gateway watch; shard захисту boundary запускає свої невеликі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і shard core support-boundary запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви перевірок як легкі завдання-верифікатори й водночас уникаючи двох додаткових workers Blacksmith і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Варіант third-party не має окремого source set або manifest; його смуга unit-тестів усе одно компілює цей flavor із прапорцями SMS/call-log BuildConfig, водночас уникаючи дубльованого завдання пакування debug APK при кожному push, релевантному для Android.
`extension-fast` є лише для PR, тому що push-запуски вже виконують повні шарди bundled plugin. Це зберігає швидкий зворотний зв’язок для змінених plugins під час рев’ю без резервування додаткового worker Blacksmith на `main` для покриття, яке вже присутнє в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується помилкою. Агреговані shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні помилки shard, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ concurrency для CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, розшардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегатори `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu від GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugins, `android`                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж заощаджував                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                               |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed lanes для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + розшардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час у черзі та найповільніші завдання
```
