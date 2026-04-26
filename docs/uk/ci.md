---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження області перевірок і локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-26T20:28:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6a7499389b8bf366cd6a244ec935edf13a557a1bdd61bf346bba46a12db0f82
    source_path: ci.md
    workflow: 15
---

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

QA Lab має окремі CI-лінії поза основним workflow з розумним обмеженням області.
Workflow `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він
збирає приватне QA runtime і порівнює агентні набори mock GPT-5.5 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через
ручний запуск; він розпаралелює mock parity gate, live Matrix lane і live
Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`,
а лінія Telegram використовує Convex leases. `OpenClaw Release
Checks` також запускає ті самі лінії QA Lab перед схваленням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і
закриває лише явно вказані PR, коли `apply=true`. Перед внесенням змін у GitHub
він перевіряє, що злитий PR справді merged, і що кожен дублікат має або спільне згадане issue,
або перетин змінених hunk-ів.

Workflow `Docs Agent` — це керована подіями лінія обслуговування Codex для підтримки
наявної документації у відповідності до нещодавно злитих змін. Вона не має окремого запуску за розкладом:
її може запустити успішний неблокований ботом CI run на `main`, а ручний запуск
може запускати її напряму. Виклики через workflow-run пропускаються, якщо
`main` уже змінився або якщо інший непропущений запуск Docs Agent було створено за останню годину.
Коли вона запускається, вона перевіряє діапазон комітів від попереднього непропущеного source SHA Docs Agent до
поточного `main`, тож один щогодинний запуск може охопити всі зміни в main,
накопичені з моменту останнього проходу документації.

Workflow `Test Performance Agent` — це керована подіями лінія обслуговування Codex
для повільних тестів. Вона не має окремого запуску за розкладом:
її може запустити успішний неблокований ботом CI run на `main`, але вона пропускається, якщо
інший виклик через workflow-run уже виконувався або виконується в той самий день UTC.
Ручний запуск обходить це денне обмеження активності. Лінія збирає повний згрупований звіт продуктивності Vitest,
дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів,
потім повторно запускає повний звіт і відхиляє зміни, що зменшують
кількість тестів базового рівня, які проходять. Якщо в базовому стані є тести, що падають, Codex
може виправляти лише очевидні збої, і повний звіт після роботи агента має успішно пройти, перш ніж
щось буде закомічено. Коли `main` просувається далі до того, як bot push потрапить у гілку,
лінія перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push;
застарілі патчі з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex
могла зберігати ту саму безпечну політику drop-sudo, що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                          | Призначення                                                                                  | Коли запускається                    |
| --------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                       | Виявлення змін лише в документації, змінених областей, змінених extensions і побудова CI manifest | Завжди для non-draft push і PR       |
| `security-scm-fast`               | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR       |
| `security-dependency-audit`       | Аудит production lockfile без залежностей щодо advisories npm                                | Завжди для non-draft push і PR       |
| `security-fast`                   | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для non-draft push і PR       |
| `build-artifacts`                 | Збирання `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні для Node           |
| `checks-fast-core`                | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels`  | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node           |
| `checks-node-extensions`          | Повні шардовані тести bundled-plugin по всьому набору extension                              | Зміни, релевантні для Node           |
| `checks-node-core-test`           | Шардовані тести core Node, окрім ліній каналів, bundled, контрактів і extensions             | Зміни, релевантні для Node           |
| `extension-fast`                  | Цільові тести лише для змінених bundled plugins                                              | Pull request із змінами в extension  |
| `check`                           | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`                | Шарди архітектури, меж, guards поверхні extension, package-boundary і gateway-watch          | Зміни, релевантні для Node           |
| `build-smoke`                     | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                               | Зміни, релевантні для Node           |
| `checks`                          | Верифікатор для built-artifact тестів каналів плюс сумісність Node 22 лише для push          | Зміни, релевантні для Node           |
| `check-docs`                      | Форматування документації, lint і перевірки на зламані посилання                             | Документацію змінено                 |
| `skills-python`                   | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills  |
| `checks-windows`                  | Специфічні для Windows тестові лінії                                                         | Зміни, релевантні для Windows        |
| `macos-node`                      | Лінія тестів TypeScript на macOS із використанням спільних зібраних artifacts                | Зміни, релевантні для macOS          |
| `macos-swift`                     | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS          |
| `android`                         | Android unit-тести для обох flavor плюс одна debug APK build                                 | Зміни, релевантні для Android        |
| `test-performance-agent`          | Щоденна Codex-оптимізація повільних тестів після довіреної активності                        | Успіх main CI або ручний запуск      |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих завдань матриці artifacts і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розпаралелюються важчі платформні та runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Редагування CI workflow перевіряють граф Node CI разом із linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії й надалі обмежуються змінами в платформному вихідному коді.
Редагування лише маршрутизації CI, вибрані дешеві зміни у фікстурах core-тестів і вузькі зміни в helper/test-routing для контрактів plugin використовують швидкий шлях manifest лише для Node: preflight, security і єдине завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних shard-ів core, shard-ів bundled-plugin і додаткових матриць guard, коли змінені файли обмежені лише поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Windows Node checks обмежені специфічними для Windows обгортками process/path, helper-ами npm/pnpm/UI runner, конфігурацією package manager і поверхнями CI workflow, що виконують цю лінію; не пов’язані зміни в source, plugin, install-smoke і test-only залишаються на Linux Node lanes, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у source bundled plugin, test-only edits і docs-only edits не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє build arg для bundled extension і запускає обмежений Docker profile bundled-plugin під агрегованим таймаутом команди в 240 секунд, де кожен Docker run сценарію окремо має власне обмеження. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запусків за розкладом, ручних запусків, workflow-call release checks і pull request, які справді зачіпають installer/package/Docker поверхні. Push до `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope на push запитує повне покриття, workflow залишає швидкий Docker smoke і переносить повний install smoke на нічну або релізну перевірку. Повільний smoke Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть явно його ввімкнути, але pull request і push до `main` його не запускають. Тести QR та installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image з `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke lanes із weighted scheduler і `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до provider, також 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких ліній за замовчуванням становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб лінії npm install і multi-service не перевантажували Docker, поки легші лінії все ще займають доступні слоти. Запуски ліній за замовчуванням зсуваються на 2 секунди, щоб уникати локальних штормів створення в Docker daemon; змінюйте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат спочатку перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних ліній, зберігає таймінги ліній для впорядкування від найдовших до найкоротших і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, і кожна лінія має резервний таймаут 120 хвилин, який можна змінити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lanes використовують жорсткіші індивідуальні обмеження. Повторно використовуваний workflow live/E2E збирає й публікує один Docker E2E image у GHCR із SHA-тегом, а потім запускає Docker suite релізного шляху максимум у трьох chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk один раз витягнув спільний image і виконав кілька ліній. Коли для suite релізного шляху запитується Open WebUI, він запускається всередині chunk plugins/integrations замість резервування четвертого Docker worker; Open WebUI зберігає окреме завдання лише для запусків openwebui-only. Запланований workflow live/E2E щодня запускає повний Docker suite релізного шляху. Матриця bundled update розділена за цільовим оновленням, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled checks.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широка платформна область CI: зміни у production core запускають typecheck production core плюс core-тести, зміни лише в core test запускають лише typecheck/tests для core test, зміни у production extension запускають typecheck production extension плюс extension-тести, а зміни лише в extension test запускають лише typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension, оскільки extensions залежать від цих контрактів core. Підвищення версій лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять перевірку на всі лінії.

На push матриця `checks` додає лінію `compat-node22`, яка запускається лише на push. У pull request цю лінію пропускають, і матриця зосереджується на звичайних test/channel lanes.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts запускаються як три зважені shard-и, bundled plugin tests балансуються між шістьма worker-ами extension, невеликі core unit lanes об’єднуються в пари, auto-reply виконується на чотирьох збалансованих worker-ах із розбиттям subtree reply на shard-и agent-runner, dispatch і commands/state-routing, а конфігурації agentic gateway/plugin розподіляються по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої окремі конфігурації Vitest замість спільного catch-all для plugin. Завдання shard extension запускають до двох груп конфігурацій plugin одночасно з одним Vitest worker на групу і збільшеним heap Node, щоб важкі за імпортами пакети plugin не створювали додаткових CI jobs. Широка agents lane використовує спільний scheduler паралельності файлів Vitest, оскільки в ній домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard-ом infra core-runtime, щоб спільний runtime shard не залишався останнім. Шарди з include-pattern записують таймінги, використовуючи назву CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від фільтрованого shard-а. `check-additional` тримає разом compile/canary-роботи package-boundary і відокремлює архітектуру топології runtime від покриття gateway watch; shard boundary guard виконує свої невеликі незалежні guard-ів паралельно всередині одного завдання. Gateway watch, channel tests і shard меж core support виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви перевірок як легкі verifier-завдання й уникаючи двох додаткових Blacksmith worker-ів та другої черги споживачів artifacts.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає debug APK для Play. Flavor third-party не має окремого source set або manifest; його лінія unit-тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, при цьому уникаючи дубльованого пакування debug APK на кожен Android-релевантний push.
`extension-fast` є лише для PR, тому що push-запуски вже виконують повні shard-и bundled plugin. Це зберігає швидкий зворотний зв’язок для review щодо змінених plugin, не резервуючи додатковий Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не падає. Агреговані shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже було витіснено.
Ключ concurrency для CI має версіонування (`CI-v7-*`), тому zombie-процес на боці GitHub у старій групі черги не може безстроково блокувати новіші запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard-и `check`, окрім lint, shard-и та агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и Linux Node-тестів, shard-и тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за lane меж
pnpm check          # швидкий локальний gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий gate із таймінгами по кожному етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # зібрати dist, коли важливі CI-лінії artifact/build-smoke
pnpm ci:timings                               # підсумувати останній push CI run для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні main CI runs
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
