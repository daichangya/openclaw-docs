---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмежувальні перевірки за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-25T22:53:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного пушу в `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані частини.

QA Lab має окремі доріжки CI поза основним робочим процесом із розумним обмеженням за областю змін. Робочий процес
`Parity gate` запускається для PR зі змінами, що відповідають умовам, і через ручний запуск; він
збирає приватне середовище виконання QA і порівнює агентні пакети mock GPT-5.5 та Opus 4.6.
Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і через
ручний запуск; він розгалужує mock parity gate, live доріжку Matrix і live
доріжку Telegram як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`,
а доріжка Telegram використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі доріжки QA Lab перед затвердженням релізу.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес для мейнтейнерів для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно
перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє,
що злитий PR справді об’єднано, а також що кожен дублікат має або спільну згадану задачу,
або перетин змінених фрагментів.

Робочий процес `Docs Agent` — це керована подіями доріжка обслуговування Codex для підтримання
наявної документації у відповідності до нещодавно злитих змін. Він не має окремого запуску за розкладом:
його може запустити успішний неботовий запуск CI для пушу в `main`, а
ручний запуск може запустити його напряму. Виклики через запуск робочого процесу пропускаються,
якщо `main` уже просунувся далі або якщо протягом останньої години вже було створено
інший непроігнорований запуск Docs Agent. Коли він запускається, він
переглядає діапазон комітів від вихідного SHA попереднього непроігнорованого Docs Agent до
поточного `main`, тож один щогодинний запуск може охопити всі зміни в `main`,
накопичені з часу останнього проходу документації.

Робочий процес `Test Performance Agent` — це керована подіями доріжка обслуговування Codex
для повільних тестів. Він не має окремого запуску за розкладом: його може
запустити успішний неботовий запуск CI для пушу в `main`, але він пропускається, якщо
інший виклик через запуск робочого процесу вже відпрацював або працює того самого дня за UTC.
Ручний запуск обходить це щоденне обмеження активності. Доріжка будує повний
згрупований звіт продуктивності Vitest, дозволяє Codex вносити лише невеликі
зміни продуктивності тестів без втрати покриття замість широких рефакторингів,
потім повторно запускає повний звіт і відхиляє зміни, які зменшують
кількість тестів, що проходять, відносно базового рівня. Якщо в базовому стані є тести зі збоями,
Codex може виправляти лише очевидні збої, а повний звіт після роботи агента
має пройти успішно, перш ніж щось буде закомічено. Якщо `main` просувається далі до того, як
бот зможе запушити зміни, доріжка перебазовує перевірений патч, повторно запускає `pnpm check:changed`
і повторює спробу пушу; застарілі патчі з конфліктами пропускаються. Вона використовує
GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну модель без `sudo`,
що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявлення змін лише в документації, змінених областей, змінених розширень і побудова CI manifest | Завжди для недрафтових пушів і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових пушів і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                                | Завжди для недрафтових пушів і PR    |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для недрафтових пушів і PR    |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані артефакти нижчих етапів | Зміни, пов’язані з Node              |
| `checks-fast-core`               | Швидкі доріжки коректності Linux, як-от перевірки bundled/plugin-contract/protocol           | Зміни, пов’язані з Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом                 | Зміни, пов’язані з Node              |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору розширень                             | Зміни, пов’язані з Node              |
| `checks-node-core-test`          | Шардовані основні тести Node, за винятком доріжок channel, bundled, contract та extension    | Зміни, пов’язані з Node              |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request зі змінами в розширеннях |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node              |
| `check-additional`               | Шарди для architecture, boundary, guards поверхні extension, package-boundary і gateway-watch | Зміни, пов’язані з Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                          | Зміни, пов’язані з Node              |
| `checks`                         | Верифікатор для channel-тестів зібраних артефактів плюс сумісність Node 22 лише для push     | Зміни, пов’язані з Node              |
| `check-docs`                     | Перевірки форматування документації, lint і зламаних посилань                                | Документацію змінено                 |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, пов’язані з Python Skills     |
| `checks-windows`                 | Специфічні для Windows доріжки тестування                                                    | Зміни, пов’язані з Windows           |
| `macos-node`                     | Доріжка тестів TypeScript на macOS із використанням спільних зібраних артефактів             | Зміни, пов’язані з macOS             |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, пов’язані з macOS             |
| `android`                        | Модульні тести Android для обох варіантів плюс одна збірка debug APK                         | Зміни, пов’язані з Android           |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів через Codex після довіреної активності                  | Успіх CI в main або ручний запуск    |

## Порядок швидкого завершення при збої

Завдання впорядковано так, щоб дешеві перевірки завершувалися зі збоєм раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються при збої, не очікуючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими доріжками Linux, щоб залежні споживачі могли стартувати одразу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за областю змін міститься в `scripts/ci-changed-scope.mjs` і покривається модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни в CI workflow перевіряють граф Node CI разом із linting для workflow, але самі по собі не примушують запускати нативні збірки для Windows, Android або macOS; ці платформні доріжки, як і раніше, обмежуються змінами у вихідних кодах відповідних платформ.
Зміни лише в маршрутизації CI, вибрані дешеві зміни у фікстурах core-test і вузькі зміни в helper/test-routing для контрактів плагінів використовують швидкий шлях manifest лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних шардів core, шардів bundled-plugin і додаткових матриць guard, коли змінені файли обмежуються поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Перевірки Windows Node обмежуються специфічними для Windows обгортками process/path, helper для npm/pnpm/UI runner, конфігурацією package manager і поверхнями CI workflow, які запускають цю доріжку; не пов’язані зміни у вихідному коді, плагінах, install-smoke і зміни лише в тестах залишаються на Linux Node доріжках, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт обмеження через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає root Dockerfile image, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений профіль Docker для bundled-plugin із сукупним timeout команди 240 секунд, де кожен сценарій `docker run` окремо обмежений. Повний шлях зберігає QR package install і покриття installer Docker/update для нічних запусків за розкладом, ручних запусків, перевірок релізів через workflow-call і pull request, які справді торкаються поверхонь installer/package/Docker. Пуші в `main`, включно з merge commits, не примушують запускати повний шлях; коли логіка changed-scope запитує повне покриття для push, workflow залишає швидкий Docker smoke, а повний install smoke відкладає до нічної або релізної перевірки. Повільний smoke для image-provider із глобальним встановленням Bun окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow перевірок релізу, а ручні запуски `install-smoke` можуть увімкнути його окремо, але pull request і пуші в `main` його не запускають. QR і installer Docker тести зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image з `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke lanes із ваговим планувальником і `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу — 10 — через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до provider, — теж 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких доріжок за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб доріжки npm install і multi-service не перевантажували Docker, поки легші доріжки все ще займають доступні слоти. Запуск доріжок за замовчуванням розноситься на 2 секунди, щоб уникнути локальних сплесків створення контейнерів у Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних доріжок, зберігає таймінги доріжок для впорядкування за принципом «найдовші спочатку» і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він припиняє планувати нові pooled lanes після першого збою, і кожна доріжка має резервний timeout у 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; для вибраних live/tail lanes використовуються жорсткіші індивідуальні обмеження. Повторно використовуваний live/E2E workflow віддзеркалює шаблон зі спільним image, збираючи й публікуючи один SHA-tagged GHCR Docker E2E image перед Docker matrix, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований live/E2E workflow щодня запускає повний Docker suite для шляху релізу. Матриця bundled update поділена за цільовим оновленням, щоб повторні проходи npm update і doctor repair можна було шардити разом з іншими bundled checks.

Логіка локальних changed-lanes міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широке CI-обмеження платформ: зміни core production запускають typecheck для core prod разом із core tests, зміни лише в core tests запускають лише typecheck/tests для core test, зміни extension production запускають typecheck для extension prod разом із extension tests, а зміни лише в extension tests запускають лише typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension, тому що розширення залежать від цих core-контрактів. Зміни лише в release metadata з оновленням версій запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config переходять у безпечний режим і запускають усі доріжки.

Для push матриця `checks` додає доріжку `compat-node22`, що запускається лише для push. Для pull request ця доріжка пропускається, і матриця лишається зосередженою на звичайних test/channel lanes.

Найповільніші сімейства Node-тестів поділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів запускаються як три вагово збалансовані шарди, тести bundled plugin балансуються між шістьма worker-ами для розширень, невеликі core unit lanes поєднуються попарно, auto-reply працює на чотирьох збалансованих worker-ах із розділенням піддерева reply на шарди agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподіляються по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin тести використовують власні конфігурації Vitest замість спільного універсального набору для плагінів. Extension shard jobs запускають до двох груп конфігурацій плагінів одночасно з одним Vitest worker на групу та більшим heap для Node, щоб пакетні набори плагінів із важкими import не створювали зайвих CI jobs. Широка доріжка agents використовує спільний планувальник паралельності файлів Vitest, оскільки в ній домінують import/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard `infra core-runtime`, щоб спільний runtime shard не ставав хвостовим. Include-pattern shards записують дані про таймінг, використовуючи ім’я CI shard, тож `.artifacts/vitest-shard-timings.json` може розрізняти цілу конфігурацію і фільтрований shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guard паралельно в межах одного завдання. Gateway watch, channel tests і shard support-boundary для core виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні попередні імена перевірок як полегшені verifier jobs і водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Для third-party flavor немає окремого source set або manifest; його доріжка модульних тестів усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, водночас уникаючи дублювання завдання пакування debug APK на кожен Android-релевантний push.
`extension-fast` працює лише для PR, тому що push-запуски вже виконують повні shard-и bundled plugin. Це зберігає швидкий зворотний зв’язок для review змінених плагінів, не резервуючи зайвий Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені новішими jobs як `cancelled`, коли новий push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується збоєм. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ конкурентності CI має версію (`CI-v7-*`), щоб zombie-процес у старій групі черги на стороні GitHub не міг безстроково блокувати нові запуски в main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали вигоди; Docker-збірки install-smoke, де час очікування в черзі для 32-vCPU коштував дорожче, ніж давав вигоди                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі guard
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # збірка dist, коли важливі доріжки CI artifact/build-smoke
pnpm ci:timings                               # зведення для останнього запуску CI push у origin/main
pnpm ci:timings:recent                        # порівняння останніх успішних запусків CI у main
node scripts/ci-run-timings.mjs <run-id>      # зведення wall time, queue time і найповільніших завдань
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти останні успішні запуски CI у main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
