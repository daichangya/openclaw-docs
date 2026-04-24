---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, перевірки за областями змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-24T03:42:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27f0244013dac350b60f05b1c96bf51a61ff15be5151759f39f5adb287f6caf7
    source_path: ci.md
    workflow: 15
---

CI запускається під час кожного push у `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані частини.

QA Lab має окремі доріжки CI поза основним workflow з розумним визначенням області. Workflow `Parity gate` запускається для відповідних змін у PR і через manual dispatch; він збирає приватний runtime QA та порівнює agentic packs mock GPT-5.4 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а доріжка Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі доріжки QA Lab перед схваленням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супроводжувачів для очищення дублікатів після злиття. Типово він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що злитий PR справді merged і що кожен дублікат має або спільний пов’язаний issue, або перетин змінених hunks.

Workflow `Docs Agent` — це event-driven доріжка супроводу Codex для підтримання наявної документації у відповідності до нещодавно злитих змін. Вона не має окремого розкладу: її може запустити успішний небутовий CI run після push у `main`, а manual dispatch може запускати її напряму. Виклики через workflow-run пропускаються, якщо `main` уже змінився або якщо інший незапропущений run Docs Agent був створений за останню годину. Коли вона запускається, вона переглядає діапазон комітів від попереднього source SHA незапропущеного Docs Agent до поточного `main`, тож один щогодинний запуск може охопити всі зміни в main, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven доріжка супроводу Codex для повільних тестів. Вона не має окремого розкладу: її може запустити успішний небутовий CI run після push у `main`, але її буде пропущено, якщо інший виклик workflow-run уже виконався або виконується в той самий день UTC. Manual dispatch обходить цю денну перевірку активності. Доріжка збирає звіт про продуктивність Vitest для повного набору тестів із групуванням, дозволяє Codex робити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору й відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а повний звіт після роботи агента має проходити до того, як щось буде закомічено. Коли `main` просувається далі до того, як push бота буде застосовано, доріжка перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; застарілі патчі з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати той самий безпечний режим drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначити зміни лише в документації, області змін, змінені extensions і зібрати маніфест CI  | Завжди для нечернеткових push і PR  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                                | Завжди для нечернеткових push і PR  |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                            | Завжди для нечернеткових push і PR  |
| `build-artifacts`                | Зібрати `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-доріжки коректності, такі як перевірки bundled/plugin-contract/protocol         | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                 | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шарди основних тестів Node, крім доріжок каналів, bundled, contract і extension              | Зміни, релевантні для Node          |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request зі змінами extension   |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Шарди архітектури, меж, guards поверхні extension, package-boundary і gateway-watch          | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                           | Зміни, релевантні для Node          |
| `checks`                         | Перевірник для built-artifact тестів каналів плюс сумісність Node 22 лише для push           | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Документацію змінено                |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows доріжки тестів                                                        | Зміни, релевантні для Windows       |
| `macos-node`                     | Доріжка тестів TypeScript на macOS із використанням спільних built artifacts                 | Зміни, релевантні для macOS         |
| `macos-swift`                    | Lint, збірка й тести Swift для застосунку macOS                                              | Зміни, релевантні для macOS         |
| `android`                        | Юніт-тести Android для обох варіантів плюс одна debug APK-збірка                             | Зміни, релевантні для Android       |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успішний CI на main або manual dispatch |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися помилкою раніше, ніж стартують дорогі:

1. `preflight` визначає, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко з помилкою, не чекаючи важчих завдань із artifacts і platform matrix.
3. `build-artifacts` виконується паралельно зі швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати, щойно спільна збірка готова.
4. Після цього розгалужуються важчі платформні та runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише-PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита юніт-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не змушують запускати native-збірки Windows, Android чи macOS; ці платформні доріжки залишаються прив’язаними до змін у коді відповідної платформи.
Перевірки Windows Node обмежені Windows-специфічними wrappers для process/path, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями workflow CI, які запускають цю доріжку; непов’язані зміни у вихідному коді, plugins, install-smoke і лише тестах залишаються на Linux Node-доріжках, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже виконується звичайними шардованими тестами.
Окремий workflow `install-smoke` не є обов’язковою перевіркою для PR або push у `main`. Він запускається раз на день за розкладом, може бути запущений вручну й повторно використовується перевірками релізу через `workflow_call`. Запуски за розкладом і через release-call виконують повний шлях install smoke: імпорт QR package, CLI smoke для root Dockerfile, gateway-network e2e, smoke build-arg для bundled extension, покриття installer Docker/update, обмежений Docker profile для bundled-plugin і smoke для image-provider через глобальне встановлення Bun, коли це ввімкнено. Для pull request слід використовувати основні доріжки CI та цільове локальне Docker-підтвердження замість очікування `install-smoke`. Тести QR і installer Docker зберігають власні Dockerfiles, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image `scripts/e2e/Dockerfile`, а потім паралельно запускає доріжки live/E2E smoke з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте типову паралельність 4 через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегат типово припиняє планувати нові pooled lanes після першої помилки, а кожна доріжка має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Доріжки, чутливі до startup або provider, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний workflow live/E2E віддзеркалює шаблон спільного image, збираючи та публікуючи один Docker E2E image у GHCR із тегом SHA перед Docker matrix, а потім запускає matrix з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker-набір для шляху релізу. Повна матриця bundled update/channel залишається ручною/full-suite, оскільки виконує повторні реальні проходи npm update і doctor repair.

Логіка локальних changed lanes міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широка область платформ у CI: зміни в core production запускають typecheck core prod плюс тести core, зміни лише в core tests запускають лише typecheck/tests для core tests, зміни в extension production запускають typecheck extension prod плюс тести extension, а зміни лише в extension tests запускають лише typecheck/tests для extension tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, оскільки extension залежать від цих core-контрактів. Version bumps лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно призводять до запуску всіх доріжок.

Для push matrix `checks` додає доріжку `compat-node22`, яка запускається лише для push. Для pull request ця доріжка пропускається, і matrix залишається зосередженою на звичайних test/channel-доріжках.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без зайвого резервування runner-ів: контракти каналів виконуються як три зважені шарди, тести bundled plugin збалансовано між шістьма workers для extension, невеликі доріжки core unit поєднано в пари, auto-reply виконується як три збалансовані workers замість шести дрібних workers, а конфігурації agentic gateway/plugin розподілено по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser-, QA-, media- та різні plugin-тести використовують свої окремі конфігурації Vitest замість спільного універсального набору для plugin. Завдання shard для extension виконують групи конфігурацій plugin послідовно з одним worker Vitest і збільшеним heap Node, щоб batches plugin з великим імпортом не перевантажували малі CI runner-и. Широка доріжка agents використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують імпорт/планування, а не один повільний тестовий файл. `runtime-config` виконується разом із шардом infra core-runtime, щоб спільний runtime-shard не залишався в хвості. `check-additional` тримає разом compile/canary-роботи package-boundary і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи їхні старі імена перевірок як легкі verifier jobs і водночас уникаючи двох додаткових Blacksmith workers та другої черги споживачів artifacts.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Варіант third-party не має окремого source set чи manifest; його доріжка юніт-тестів усе одно компілює цей варіант із прапорцями BuildConfig для SMS/call-log, уникаючи при цьому дублювання завдання пакування debug APK при кожному push, релевантному для Android.
`extension-fast` є лише для PR, оскільки push-запуски вже виконують повні шарди bundled plugin. Це зберігає швидкий зворотний зв’язок щодо змінених plugin для рев’ю, не резервуючи додатковий Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Вважайте це шумом CI, якщо тільки найновіший run для того самого ref також не падає. Агреговані перевірки shard використовують `!cancelled() && always()`, тому вони все ще повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже був замінений новішим.
Ключ concurrency у CI має версію (`CI-v7-*`), щоб zombie в старій queue group на боці GitHub не міг безкінечно блокувати новіші runs для main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані verifier-и Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла раніше стати в чергу |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який досі достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж заощаджували; Docker-збірки install-smoke, де вартість часу очікування в черзі для 32 vCPU була вищою за вигоду                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для forks використовується fallback на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для forks використовується fallback на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + зламані посилання
pnpm build          # збірка dist, коли важливі доріжки CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні runs CI для main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
