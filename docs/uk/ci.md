---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої в перевірках GitHub Actions.
summary: Граф завдань CI, межі перевірок і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-24T19:51:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8407768803b8d92e03a7fb453307a64cb4f2342ba3894b51d4c928dd434fede6
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push до `main` і кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має виділені смуги CI поза межами основного workflow з розумним визначенням меж. Workflow
`Parity gate` запускається для відповідних змін у PR і через ручний dispatch; він
збирає приватний runtime QA і порівнює agentic-паки mock GPT-5.4 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через
ручний dispatch; він розгалужує mock parity gate, live Matrix lane і live
Telegram lane як паралельні завдання. Live-завдання використовують environment `qa-live-shared`,
а смуга Telegram використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі смуги QA Lab перед погодженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і
закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub
він перевіряє, що злитий PR має статус merged, і що кожен дублікат має або
спільну згадану issue, або перекривні змінені hunks.

Workflow `Docs Agent` — це event-driven смуга технічного обслуговування Codex для підтримання
наявної документації у відповідності до нещодавно злитих змін. У нього немає окремого запуску за розкладом:
його може запустити успішний неботовий CI run push до `main`, а
ручний dispatch може запустити його напряму. Виклики через workflow-run пропускаються,
якщо `main` уже пішов далі або якщо інший непропущений запуск Docs Agent
було створено протягом останньої години. Коли він запускається, він
переглядає діапазон комітів від SHA джерела попереднього непропущеного Docs Agent до
поточного `main`, тож один щогодинний запуск може охопити всі зміни в main,
накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven смуга технічного обслуговування Codex
для повільних тестів. У нього немає окремого запуску за розкладом:
його може запустити успішний неботовий CI run push до `main`, але
він пропускається, якщо інший виклик через workflow-run уже виконався або виконується
цього дня за UTC. Ручний dispatch обходить це денне обмеження активності.
Смуга будує повний згрупований звіт продуктивності Vitest, дозволяє Codex
робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість
широких рефакторингів, потім повторно запускає повний звіт і відхиляє
зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести зі збоями,
Codex може виправляти лише очевидні збої, а повний звіт після роботи агента
має пройти, перш ніж щось буде закомічено. Коли `main` просувається далі до того,
як bot push буде застосовано, смуга перебазовує перевірений патч,
повторно запускає `pnpm check:changed` і повторює push;
застарілі патчі з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб
дія Codex могла зберігати ту саму безпекову модель drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені межі, змінені extensions і будує маніфест CI    | Завжди для push і PR не в draft     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR не в draft     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для push і PR не в draft     |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR не в draft     |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі смуги коректності Linux, як-от перевірки bundled/plugin-contract/protocol            | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки channel contract зі стабільним агрегованим результатом перевірки         | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шарди основних Node-тестів, без channel, bundled, contract і extension-смуг                  | Зміни, релевантні для Node          |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                              | Pull request зі змінами в extension |
| `check`                          | Шардований еквівалент основної локальної перевірки: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Архітектурні, boundary, extension-surface guards, package-boundary і gateway-watch шарди     | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, релевантні для Node          |
| `checks`                         | Перевіряльник для built-artifact channel tests плюс сумісність Node 22 лише для push         | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Змінено документацію                |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові смуги                                                         | Зміни, релевантні для Windows       |
| `macos-node`                     | Смуга тестів TypeScript на macOS із використанням спільних built artifacts                   | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS         |
| `android`                        | Модульні тести Android для обох flavor плюс одна збірка debug APK                            | Зміни, релевантні для Android       |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх main CI або ручний dispatch   |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих artifact- і platform-matrix-завдань.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати, щойно спільна збірка готова.
4. Після цього розгалужуються важчі platform- і runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка меж знаходиться в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці platform-смуги лишаються прив’язаними до змін у платформенному коді.
Перевірки Windows Node прив’язані до специфічних для Windows обгорток process/path, npm/pnpm/UI runner helpers, конфігурації package manager і поверхонь workflow CI, які запускають цю смугу; не пов’язані зміни вихідного коду, plugin, install-smoke і лише тестів залишаються на Linux Node-смугах, щоб не резервувати Windows worker на 16 vCPU заради покриття, яке вже проходить у звичайних test shards.
Окремий workflow `install-smoke` повторно використовує той самий сценарій визначення меж через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin, лише в тестах і лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin з тайм-аутом команди 120 секунд. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запусків за розкладом, ручних dispatch, workflow-call release checks і pull request, які справді торкаються поверхонь installer/package/Docker. Push у `main`, включно з merge commits, не примушують запускати повний шлях; коли логіка changed-scope намагається запитати повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний smoke Bun global install для image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `install-smoke` можуть його ввімкнути, але pull request і push у `main` його не запускають. Тести QR та installer Docker зберігають власні install-орієнтовані Dockerfile. Локальний агрегат `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke lanes із зваженим планувальником і `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів tail-pool 10, чутливих до provider, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких смуг за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=4` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=5`, щоб смуги npm install і multi-service не перевантажували Docker, поки легші смуги все ще заповнюють доступні слоти. Запуски смуг за замовчуванням розносяться на 2 секунди, щоб уникати локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат за замовчуванням припиняє планування нових pooled lanes після першої помилки, а кожна смуга має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Повторно використовуваний workflow live/E2E віддзеркалює шаблон спільного image, збираючи й публікуючи один Docker E2E image з тегом SHA у GHCR перед Docker matrix, а потім запускає matrix з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker-набір релізного шляху. Повна матриця bundled update/channel залишається ручною/повною, оскільки виконує повторні справжні проходи `npm update` і `doctor repair`.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіше ставиться до архітектурних меж, ніж широка platform-scope CI: зміни в core production запускають typecheck для core prod плюс тести core, зміни лише в тестах core запускають лише typecheck/тести для core test, зміни в extension production запускають typecheck для extension prod плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/тести для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, оскільки extension залежать від цих контрактів core. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config переходять у безпечний режим і запускають усі смуги.

Для push матриця `checks` додає смугу `compat-node22`, що виконується лише для push. Для pull request ця смуга пропускається, і матриця зосереджується на звичайних test/channel-смугах.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим і не резервувало зайві runner-и: channel contracts виконуються як три зважені шарди, тести bundled plugin балансуються між шістьма workers для extension, невеликі core unit-смуги об’єднані попарно, auto-reply працює на трьох збалансованих workers замість шести маленьких, а конфігурації agentic gateway/plugin розподілені між наявними source-only agentic Node-завданнями замість очікування built artifacts. Широкі browser-, QA-, media- та різні plugin-тести використовують свої виділені конфігурації Vitest замість спільного catch-all для plugin. Завдання шардованих extension запускають до двох груп конфігурацій plugin одночасно з одним worker Vitest на групу та збільшеною купою Node, щоб партії plugin з великою кількістю імпортів не створювали додаткові CI-завдання. Широка смуга agents використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують імпорти/планування, а не один окремий повільний тестовий файл. `runtime-config` виконується разом із шардом infra core-runtime, щоб спільний runtime-shard не тягнув хвіст. `check-additional` тримає разом package-boundary compile/canary-роботи й відокремлює архітектуру runtime topology від покриття gateway watch; шард boundary guard запускає свої невеликі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і шард core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі імена перевірок як легкі verifier-завдання та уникаючи двох додаткових workers Blacksmith і другої черги споживачів artifact.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає debug APK для Play. Для third-party flavor немає окремого source set або manifest; його смуга unit-тестів усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK при кожному push, релевантному для Android.
`extension-fast` призначено лише для PR, оскільки push-запуски вже виконують повні шарди bundled plugin. Це дає зворотний зв’язок для changed-plugin під час рев’ю, не резервуючи додатковий worker Blacksmith на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший run для того самого ref також не завершується збоєм. Агреговані шардовані перевірки використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ concurrency CI має версію (`CI-v7-*`), тож zombie на боці GitHub у старій queue group не може безкінечно блокувати новіші запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки channel contract, шарди `check` окрім lint, шарди й агрегати `check-additional`, aggregate verifiers тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо чутливим до CPU, так що 8 vCPU коштували більше, ніж зекономили; Docker-збірки install-smoke, де витрати часу черги 32-vCPU були більшими за вигоду                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки переходять на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки переходять на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # збірка dist, коли важливі смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти останні успішні запуски CI для main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
