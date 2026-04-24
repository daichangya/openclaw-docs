---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої в перевірках GitHub Actions.
summary: Граф завдань CI, обмежувачі охоплення та локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-24T05:03:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e24efec145ff144b007e248ef0f9c56287619eb9af204d45d49984909a6136b
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push до `main` і кожного pull request. Він використовує розумне обмеження охоплення, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має окремі доріжки CI поза основним workflow із розумним обмеженням охоплення. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний dispatch; він збирає приватне середовище виконання QA та порівнює agentic-пакети mock GPT-5.4 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він розгалужує mock parity gate, live-доріжку Matrix і live-доріжку Telegram як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а доріжка Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі доріжки QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супроводу після злиття, призначений для очищення дублікатів. За замовчуванням він працює в режимі dry-run і закриває лише явно вказані PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що злитий PR справді merged і що кожен дублікат має або спільну згадану issue, або перетин змінених hunk-ів.

Workflow `Docs Agent` — це Codex-доріжка супроводу, що запускається за подіями, щоб підтримувати наявну документацію узгодженою з нещодавно злитими змінами. Вона не має окремого запуску за розкладом: її може запустити успішний небоговий запуск push CI на `main`, а ручний dispatch може запускати її безпосередньо. Виклики через workflow-run пропускаються, якщо `main` уже просунувся далі або якщо інший непропущений запуск Docs Agent був створений протягом останньої години. Коли вона запускається, вона переглядає діапазон комітів від попереднього source SHA непропущеного Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни в main, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це Codex-доріжка супроводу для повільних тестів, що запускається за подіями. Вона не має окремого запуску за розкладом: її може запустити успішний небоговий запуск push CI на `main`, але вона пропускається, якщо інший виклик через workflow-run уже виконувався або виконується в цю UTC-добу. Ручний dispatch обходить це денне обмеження активності. Доріжка збирає згрупований звіт про продуктивність Vitest для повного набору тестів, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору та відхиляє зміни, які зменшують кількість тестів, що проходять у базовому стані. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а звіт для повного набору після роботи агента має проходити, перш ніж щось буде закомічено. Коли `main` просувається до того, як бот устигне запушити зміни, доріжка робить rebase перевіреного патча, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну модель drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в docs, змінені області охоплення, змінені extensions і будує маніфест CI | Завжди для non-draft push і PR       |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR       |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для non-draft push і PR       |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для non-draft push і PR       |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі Linux-доріжки коректності, як-от bundled/plugin-contract/protocol checks              | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки channel contract зі стабільним агрегованим результатом                   | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extensions                               | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди core Node tests, за винятком доріжок channel, bundled, contract і extension            | Зміни, релевантні для Node           |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                              | Pull request із змінами в extension  |
| `check`                          | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`               | Шарди архітектури, меж, guards поверхні extension, меж пакетів і gateway-watch               | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести built-CLI і smoke перевірка пам’яті під час запуску                              | Зміни, релевантні для Node           |
| `checks`                         | Верифікатор для built-artifact channel tests плюс сумісність Node 22 лише для push           | Зміни, релевантні для Node           |
| `check-docs`                     | Форматування docs, lint і перевірки на биті посилання                                        | Docs змінено                         |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Специфічні для Windows тестові доріжки                                                       | Зміни, релевантні для Windows        |
| `macos-node`                     | Доріжка тестів TypeScript на macOS з використанням спільних built artifacts                  | Зміни, релевантні для macOS          |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS          |
| `android`                        | Android unit tests для обох flavor-ів плюс одна збірка debug APK                             | Зміни, релевантні для Android        |
| `test-performance-agent`         | Щоденна Codex-оптимізація повільних тестів після довіреної активності                        | Успіх main CI або ручний dispatch    |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих завдань матриці artifacts і платформ.
3. `build-artifacts` перекривається з швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка охоплення міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`.
Редагування workflow CI перевіряє граф Node CI плюс lint workflow, але саме по собі не змушує виконувати нативні збірки Windows, Android або macOS; ці платформні доріжки залишаються обмеженими змінами у вихідному коді відповідних платформ.
Перевірки Windows Node обмежені Windows-специфічними wrappers для process/path, допоміжними засобами npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цю доріжку; не пов’язані зміни у source, plugin, install-smoke і зміни лише в tests залишаються на Linux Node-доріжках, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт охоплення через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише в source bundled plugin, лише в tests і лише в docs не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker profile bundled-plugin з тайм-аутом команди 120 секунд. Повний шлях зберігає покриття QR package install і installer Docker/update для нічних запусків за розкладом, ручних dispatch-ів, workflow-call перевірок релізу і pull request, які справді торкаються поверхонь installer/package/Docker. Push у `main`, включно з merge commits, не змушують повний шлях; коли логіка changed-scope вимагала б повного покриття для push, workflow залишає швидкий Docker smoke, а повний install smoke переносить на нічну або релізну валідацію. Повільний smoke для image-provider із глобальним встановленням Bun окремо обмежується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch-и `install-smoke` можуть його ввімкнути, але pull request і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke-доріжки паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову паралельність основного пулу 8 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а паралельність tail-pool, чутливого до provider, теж 8 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Локальний агрегат за замовчуванням перестає планувати нові доріжки пулу після першого збою, а кожна доріжка має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Повторно використовуваний workflow live/E2E відтворює шаблон спільного image, збираючи й публікуючи один Docker E2E image із тегом SHA в GHCR перед Docker matrix, а потім запускаючи matrix з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker suite для релізного шляху. Повна матриця bundled update/channel залишається ручною/full-suite, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіше ставиться до архітектурних меж, ніж широке платформне охоплення CI: зміни у production core запускають typecheck prod core плюс core tests, зміни лише в tests core запускають лише typecheck/tests для test-коду core, зміни у production extension запускають typecheck prod extension плюс extension tests, а зміни лише в tests extension запускають лише typecheck/tests для test-коду extension. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на extension, тому що extension залежать від цих контрактів core. Зміни лише в release metadata version bump запускають точкові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно переводять виконання на всі доріжки.

Для push матриця `checks` додає доріжку `compat-node22`, що запускається лише для push. Для pull request ця доріжка пропускається, і матриця зосереджується на звичайних test/channel-доріжках.

Найповільніші сімейства Node tests розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts виконуються у трьох зважених shards, bundled plugin tests балансуються між шістьма worker-ами extension, малі core unit lanes об’єднані в пари, auto-reply працює у трьох збалансованих worker-ах замість шести крихітних worker-ів, а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та різні plugin tests використовують свої окремі конфігурації Vitest замість спільного універсального plugin catch-all. Завдання shard для extension запускають групи конфігурацій plugin послідовно з одним worker-ом Vitest і більшим Node heap, щоб batch-і plugin з великим обсягом імпортів не перевантажували малі CI runner-и. Широка доріжка agents використовує спільний планувальник файлового паралелізму Vitest, оскільки в ній домінують імпорти/планування, а не один повільний test file. `runtime-config` запускається разом із shard `infra core-runtime`, щоб спільний shard runtime не замикався на хвості. `check-additional` тримає compile/canary-роботи для меж пакетів разом і відокремлює архітектуру топології runtime від покриття gateway watch; shard boundary guard виконує свої малі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і shard support-boundary core виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви check як легковагі verifier-завдання й водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів artifacts.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого набору source або manifest; його доріжка unit tests усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK на кожному push, релевантному для Android.
`extension-fast` є лише для PR, тому що push-запуски вже виконують повні shard-и bundled plugin. Це зберігає швидкий зворотний зв’язок щодо змінених plugin для рев’ю, не резервуючи додатковий Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо лише найновіший запуск для того самого ref також не падає. Агреговані shard checks використовують `!cancelled() && always()`, тож вони все ще повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже було замінено.
Ключ concurrency у CI має версіонування (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, шардовані перевірки channel contract, shard-и `check`, крім lint, shard-и та агрегати `check-additional`, aggregate verifier-и Node tests, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и Linux Node tests, shard-и bundled plugin tests, `android`                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, так що 8 vCPU коштували більше, ніж дали вигоди; Docker builds для install-smoke, де час очікування в черзі для 32 vCPU коштував більше, ніж давав вигоди                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # збірка dist, коли мають значення доріжки CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # зведення wall time, queue time і найповільніших завдань
node scripts/ci-run-timings.mjs --recent 10   # порівняння недавніх успішних запусків main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
