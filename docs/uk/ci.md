---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, гейти області змін і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-25T01:53:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: da983f025479feb82baf407e723bb663b1239f1abd931827a4c9f419ea88df67
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push у `main` і кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має окремі доріжки CI поза основним workflow з розумним визначенням області змін. Workflow `Parity gate` запускається для PR зі відповідними змінами та через manual dispatch; він збирає приватний рантайм QA і порівнює агентні пакети mock GPT-5.4 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а доріжка Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі доріжки QA Lab перед погодженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників для очищення дублікатів після злиття. Типово він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що злитий PR справді об’єднано, і що кожен дублікат має або спільну згадану issue, або перекривні змінені hunks.

Workflow `Docs Agent` — це керована подіями доріжка обслуговування Codex для підтримання наявної документації у відповідності до нещодавно злитих змін. Він не має чистого запуску за розкладом: його може запустити успішний запуск CI для push у `main`, виконаний не ботом, а manual dispatch може запускати його напряму. Виклики через workflow_run пропускаються, якщо `main` уже пішов далі або якщо за останню годину вже було створено інший непропущений запуск Docs Agent. Під час виконання він переглядає діапазон комітів від вихідного SHA попереднього непропущеного Docs Agent до поточного `main`, тому один погодинний запуск може охопити всі зміни `main`, накопичені з моменту останнього проходу документації.

Workflow `Test Performance Agent` — це керована подіями доріжка обслуговування Codex для повільних тестів. Він не має чистого запуску за розкладом: його може запустити успішний запуск CI для push у `main`, виконаний не ботом, але він пропускається, якщо інший виклик через workflow_run уже виконався або виконується в той самий день UTC. Manual dispatch обходить цей денний гейт активності. Ця доріжка збирає звіт про продуктивність Vitest для повного набору тестів, згрупований за категоріями, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору тестів і відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а звіт для повного набору тестів після роботи агента має пройти повністю, перш ніж щось буде закомічено. Якщо `main` просувається далі до того, як потрапить push від бота, ця доріжка перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну політику drop-sudo, що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує CI-маніфест   | Завжди для push і PR не в статусі draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR не в статусі draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для push і PR не в статусі draft |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                            | Завжди для push і PR не в статусі draft |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні для Node       |
| `checks-fast-core`               | Швидкі Linux-доріжки коректності, такі як перевірки bundled/plugin-contract/protocol          | Зміни, релевантні для Node            |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки        | Зміни, релевантні для Node            |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для набору extensions                                       | Зміни, релевантні для Node            |
| `checks-node-core-test`          | Шарди core Node test, за винятком channel, bundled, contract і extension lanes               | Зміни, релевантні для Node            |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                           | Pull request зі змінами в extensions  |
| `check`                          | Шардований еквівалент основного локального gate: типи prod, lint, guards, test types і strict smoke | Зміни, релевантні для Node       |
| `check-additional`               | Шарди архітектури, меж, extension-surface guards, package-boundary і gateway-watch            | Зміни, релевантні для Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                           | Зміни, релевантні для Node            |
| `checks`                         | Перевіряльник для channel tests з built-artifact плюс сумісність Node 22 лише для push        | Зміни, релевантні для Node            |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                    | Змінено документацію                  |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                     | Зміни, релевантні для Python Skills   |
| `checks-windows`                 | Специфічні для Windows тестові доріжки                                                        | Зміни, релевантні для Windows         |
| `macos-node`                     | Доріжка тестів TypeScript на macOS із використанням спільних built artifacts                  | Зміни, релевантні для macOS           |
| `macos-swift`                    | Swift lint, збірка і тести для програми macOS                                                 | Зміни, релевантні для macOS           |
| `android`                        | Android unit tests для обох flavor плюс одна збірка debug APK                                 | Зміни, релевантні для Android         |
| `test-performance-agent`         | Щоденна Codex-оптимізація повільних тестів після довіреної активності                         | Успішний main CI або manual dispatch  |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих матричних завдань artifacts і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та рантайм-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін живе в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Редагування workflow CI перевіряє граф Node CI плюс linting workflow, але саме по собі не примушує запускати нативні збірки Windows, Android або macOS; ці платформні доріжки залишаються прив’язаними до змін у вихідному коді відповідних платформ.
Перевірки Windows Node прив’язані до специфічних для Windows обгорток процесів/шляхів, допоміжних засобів npm/pnpm/UI runner, конфігурації пакетного менеджера та поверхонь workflow CI, які запускають цю доріжку; не пов’язані зміни у вихідному коді, plugins, install-smoke і зміни лише в тестах залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugins і поверхонь core plugin/channel/gateway/Plugin SDK, які покривають Docker smoke jobs. Зміни лише у вихідному коді bundled plugins, зміни лише в тестах і лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає smoke CLI `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений профіль bundled-plugin Docker з тайм-аутом команди 120 секунд. Повний шлях зберігає покриття встановлення QR package і installer Docker/update для нічних запусків за розкладом, manual dispatch, workflow-call release checks і pull request, які справді торкаються поверхонь installer/package/Docker. Push у `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope вимагала б повного покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний smoke глобального встановлення Bun image-provider додатково контролюється через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а manual dispatch `install-smoke` може явно його увімкнути, але pull request і push у `main` його не запускають. Тести QR та installer Docker зберігають власні Dockerfiles, орієнтовані на встановлення. Локальний агрегат `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke lanes зі зваженим планувальником і `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів хвостового пулу 10, чутливого до provider, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких доріжок типово становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб доріжки npm install і multi-service не перевантажували Docker, поки легші доріжки все ще заповнюють доступні слоти. Запуск доріжок за замовчуванням зсувається на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, показує статус активних доріжок, зберігає таймінги доріжок для порядку від найдовших до коротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. Типово він припиняє планувати нові pooled lanes після першої помилки, і кожна доріжка має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lanes використовують жорсткіші індивідуальні обмеження. Повторно використовуваний workflow live/E2E повторює шаблон зі спільним образом: він збирає і пушить один Docker E2E image у GHCR з тегом SHA перед Docker matrix, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Workflow запланованого live/E2E щодня запускає повний Docker-набір за релізним шляхом. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled checks.

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широка CI-область платформ: зміни в core production запускають перевірку типів core prod плюс тести core, зміни лише в тестах core запускають лише перевірку типів/тести core test, зміни в extension production запускають перевірку типів extension prod плюс тести extension, а зміни лише в тестах extension запускають лише перевірку типів/тести extension test. Публічні зміни Plugin SDK або plugin-contract розширюють валідацію до extensions, оскільки extensions залежать від цих core-контрактів. Підвищення версій лише в release metadata запускає цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно призводять до запуску всіх lanes.

Для push матриця `checks` додає доріжку `compat-node22`, яка запускається лише для push. Для pull request ця доріжка пропускається, і матриця залишається зосередженою на звичайних test/channel lanes.

Найповільніші сімейства Node test поділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування раннерів: контракти каналів виконуються у вигляді трьох зважених shards, тести bundled plugin збалансовано між шістьма extension workers, малі core unit lanes попарно об’єднані, auto-reply виконується на трьох збалансованих workers замість шести дрібних workers, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser-, QA-, media- і miscellaneous plugin tests використовують свої окремі конфігурації Vitest замість спільної універсальної конфігурації plugin. Завдання extension shard запускають до двох груп plugin config одночасно з одним worker Vitest на групу і більшим heap Node, щоб важкі за імпортами пакети plugin не створювали додаткові CI jobs. Широка доріжка agents використовує спільний file-parallel планувальник Vitest, оскільки в ній домінують імпорти/планування, а не один окремий повільний test file. `runtime-config` виконується разом із shard `infra core-runtime`, щоб спільний runtime shard не лишався в хвості. `check-additional` тримає разом package-boundary compile/canary роботу та відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard виконує свої малі незалежні guards конкурентно в межах одного job. Gateway watch, channel tests і shard `core support-boundary` виконуються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви checks як легкі jobs-перевіряльники та водночас уникаючи двох додаткових Blacksmith workers і другої черги споживачів artifacts.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його доріжка unit-test усе одно компілює цей flavor з прапорами BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK для кожного Android-релевантного push.
`extension-fast` є лише для PR, тому що push-запуски вже виконують повні bundled plugin shards. Це зберігає швидкий зворотний зв’язок щодо змінених plugins для рев’ю, не резервуючи додатковий Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shards, але не стають у чергу після того, як увесь workflow уже було витіснено.
Ключ конкурентності CI має версію (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски `main`.

## Раннери

| Раннер                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shards `check` окрім lint, shards і агрегати `check-additional`, aggregate verifiers Node test, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards Linux Node test, shards bundled plugin test, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштують більше, ніж дають вигоди; Docker builds для install-smoke, де час очікування в черзі на 32 vCPU коштував більше, ніж давав вигоди                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: змінені typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі CI-доріжки artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші jobs
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізу](/uk/install/development-channels)
