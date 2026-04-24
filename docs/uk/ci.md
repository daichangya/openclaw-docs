---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі перевірок і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-24T00:54:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43550d4c57343a35eb8b725936a50963cb5886e589eaebcec2168c25ae2891ac
    source_path: ci.md
    workflow: 15
---

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має окремі доріжки CI поза основним workflow з розумним обмеженням за областю змін. Workflow
`Parity gate` запускається для відповідних змін у PR і через manual dispatch; він
збирає приватне середовище виконання QA та порівнює агентні набори mock GPT-5.4 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через
manual dispatch; він розгалужує mock parity gate, live-доріжку Matrix і live-доріжку
Telegram як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`,
а доріжка Telegram використовує Convex leases. `OpenClaw Release
Checks` також запускає ті самі доріжки QA Lab перед схваленням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супроводу від maintainer
для очищення дублікатів після злиття. За замовчуванням він працює в dry-run режимі й
закриває лише явно вказані PR, коли `apply=true`. Перш ніж змінювати GitHub,
він перевіряє, що злитий PR справді merged, і що кожен дублікат має або спільне посилання на issue,
або перекривні змінені hunks.

Workflow `Docs Agent` — це event-driven доріжка обслуговування Codex для підтримання
узгодженості наявної документації з нещодавно внесеними змінами. Вона не має окремого запуску за розкладом:
її може запустити успішний небойовий push CI на `main`, а manual dispatch може
запустити її напряму. Виклики через workflow-run пропускаються, якщо `main` уже змінився або якщо
за останню годину вже було створено інший неперепущений запуск Docs Agent. Коли вона виконується, вона
переглядає діапазон комітів від попереднього неперепущеного source SHA Docs Agent до
поточного `main`, тому один щогодинний запуск може охопити всі зміни в main, накопичені
з моменту останнього проходу документації.

Workflow `Test Performance Agent` — це event-driven доріжка обслуговування Codex
для повільних тестів. Вона не має окремого запуску за розкладом:
її може запустити успішний небойовий push CI на `main`, але вона пропускається, якщо інший виклик через workflow-run
уже виконався або виконується цього UTC-дня. Manual dispatch обходить це щоденне
обмеження активності. Доріжка будує згрупований звіт про продуктивність Vitest для повного набору тестів,
дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість
широких рефакторингів, потім повторно запускає звіт для повного набору та відхиляє зміни,
які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що падають,
Codex може виправляти лише очевидні збої, а післяагентний звіт для повного набору тестів має пройти,
перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push буде застосовано, доріжка
перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push;
застарілі патчі з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія
Codex могла зберігати ту саму безпечну модель drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                          | Призначення                                                                                  | Коли запускається                    |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                       | Визначає зміни лише в документації, змінені області, змінені розширення та будує маніфест CI | Завжди для недрафтових pushes і PR   |
| `security-scm-fast`               | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових pushes і PR   |
| `security-dependency-audit`       | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для недрафтових pushes і PR   |
| `security-fast`                   | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових pushes і PR   |
| `build-artifacts`                 | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream артефакти | Зміни, релевантні для Node           |
| `checks-fast-core`                | Швидкі доріжки коректності Linux, як-от перевірки bundled/plugin-contract/protocol           | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels`  | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом                 | Зміни, релевантні для Node           |
| `checks-node-extensions`          | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, релевантні для Node           |
| `checks-node-core-test`           | Шарди основних Node-тестів, без доріжок каналів, bundled, контрактів і розширень             | Зміни, релевантні для Node           |
| `extension-fast`                  | Прицільні тести лише для змінених bundled plugins                                            | Pull requests зі змінами в розширеннях |
| `check`                           | Шардований еквівалент основної локальної перевірки: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`                | Перевірки архітектури, меж, поверхні розширень, меж пакетів і шарди gateway-watch            | Зміни, релевантні для Node           |
| `build-smoke`                     | Smoke-тести зібраного CLI та smoke перевірка пам’яті під час запуску                         | Зміни, релевантні для Node           |
| `checks`                          | Верифікатор для тестів каналів зі зібраними артефактами плюс сумісність Node 22 лише для push | Зміни, релевантні для Node           |
| `check-docs`                      | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено                 |
| `skills-python`                   | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills  |
| `checks-windows`                  | Специфічні для Windows доріжки тестування                                                    | Зміни, релевантні для Windows        |
| `macos-node`                      | Доріжка тестів TypeScript на macOS з використанням спільних зібраних артефактів              | Зміни, релевантні для macOS          |
| `macos-swift`                     | Swift lint, збірка та тести для застосунку macOS                                             | Зміни, релевантні для macOS          |
| `android`                         | Android unit-тести для обох flavors плюс одна збірка debug APK                               | Зміни, релевантні для Android        |
| `test-performance-agent`          | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успішний main CI або manual dispatch |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні доріжки й доріжки виконання: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише-PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI і lint workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні доріжки й далі обмежуються змінами в коді відповідних платформ.
Перевірки Windows Node обмежені Windows-специфічними обгортками process/path, допоміжними утилітами npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями workflow CI, які запускають цю доріжку; не пов’язані зміни у вихідному коді, plugin, install-smoke та лише тестах залишаються на Linux Node-доріжках, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже виконується звичайними шардами тестів.
Окремий workflow `install-smoke` повторно використовує той самий скрипт обмеження областей змін через власне завдання `preflight`. Він ділить smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull requests запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin, лише в тестах і лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker profile bundled-plugin із timeout команди 120 секунд. Повний шлях зберігає покриття встановлення QR package і installer Docker/update для pushes у `main`, нічних запусків за розкладом, manual dispatch, release checks через workflow-call і справжніх змін installer/package/Docker. Повільний smoke для image-provider із глобальним встановленням Bun керується окремо через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а manual dispatch `install-smoke` може явно його ввімкнути, але pull requests його не запускають. Тести QR і installer Docker зберігають власні Dockerfiles, орієнтовані на встановлення. Локальний `test:docker:all` заздалегідь збирає один спільний образ live-test і один спільний образ built-app `scripts/e2e/Dockerfile`, а потім запускає доріжки live/E2E smoke паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте типову паралельність 4 через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегат за замовчуванням припиняє планувати нові pooled-доріжки після першої помилки, а кожна доріжка має timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Доріжки, чутливі до запуску або provider, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний workflow live/E2E віддзеркалює шаблон спільного образу: він збирає й публікує один GHCR Docker E2E image із тегом SHA до Docker-матриці, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker-набір для шляху релізу. Повна матриця bundled update/channel залишається ручною/full-suite, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широке CI-обмеження за платформами: зміни в core production запускають prod typecheck для core плюс тести core, зміни лише в core tests запускають лише typecheck/tests для тестів core, зміни в extension production запускають prod typecheck для extension плюс тести extension, а зміни лише в extension tests запускають лише typecheck/tests для тестів extension. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, оскільки extensions залежать від цих контрактів core. Підвищення версії лише в release metadata запускають прицільні перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно розширюються до всіх доріжок.

Для pushes матриця `checks` додає доріжку `compat-node22`, яка запускається лише для push. Для pull requests ця доріжка пропускається, і матриця залишається зосередженою на звичайних доріжках тестів/каналів.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування раннерів: контракти каналів працюють у трьох зважених шардах, тести bundled plugin збалансовані між шістьма workers для розширень, малі core unit-доріжки об’єднані в пари, auto-reply виконується у трьох збалансованих workers замість шести дрібних workers, а конфігурації agentic gateway/plugin розподілені між наявними source-only agentic Node-завданнями замість очікування на зібрані артефакти. Широкі browser-, QA-, media- та різні plugin-тести використовують свої окремі конфігурації Vitest замість спільного універсального набору для plugins. Завдання шардінгу розширень виконують групи конфігурацій plugin послідовно з одним worker Vitest і більшим Node heap, щоб пакетні набори plugins із великим імпортним навантаженням не перевантажували невеликі CI-раннери. Широка доріжка agents використовує спільний файлово-паралельний планувальник Vitest, оскільки в ній домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` виконується разом із шардом infra core-runtime, щоб спільний runtime-shard не замикав на собі хвіст. `check-additional` тримає разом package-boundary compile/canary-роботи й відокремлює архітектуру runtime topology від покриття gateway watch; шард boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання. Gateway watch, тести каналів і core support-boundary shard працюють паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви перевірок як легкі завдання-верифікатори й водночас уникаючи двох додаткових workers Blacksmith і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Для flavor third-party немає окремого source set чи manifest; його доріжка unit-тестів усе одно компілює цей flavor із прапорцями SMS/call-log у BuildConfig, водночас уникаючи дублювання завдання пакування debug APK для кожного Android-релевантного push.

`extension-fast` виконується лише для PR, оскільки push-запуски вже виконують повні шарди bundled plugin. Це зберігає швидкий зворотний зв’язок щодо змінених plugins під час review, не резервуючи додатковий worker Blacksmith на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується збоєм. Агреговані перевірки шардів використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже було замінено новішим.

Ключ конкурентності CI має версіонування (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски `main`.

## Раннери

| Раннер                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла раніше стати в чергу |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж давали вигоди; Docker-збірки install-smoke, де витрати часу на чергу для 32 vCPU перевищували виграш                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; forks використовують `macos-latest` як запасний варіант                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; forks використовують `macos-latest` як запасний варіант                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за граничною доріжкою
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # збірка dist, коли важливі CI-доріжки artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
