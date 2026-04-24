---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої перевірок GitHub Actions.
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: пайплайн CI
x-i18n:
    generated_at: "2026-04-24T07:42:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push у `main` і кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має окремі доріжки CI поза основним workflow з розумною областю дії. Workflow `Parity gate` запускається для відповідних змін у PR і при ручному запуску; він збирає приватне середовище виконання QA і порівнює агентні набори mock GPT-5.4 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі для `main` і при ручному запуску; він розгалужує mock parity gate, live доріжку Matrix і live доріжку Telegram як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а доріжка Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі доріжки QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub, він перевіряє, що злитий PR справді об’єднано, і що кожен дублікат має або спільне згадане issue, або перетин змінених фрагментів.

Workflow `Docs Agent` — це керована подіями доріжка обслуговування Codex для підтримання наявної документації у відповідності до нещодавно внесених змін. У неї немає окремого запуску за розкладом: її може запустити успішний CI-запуск для небота після push у `main`, а також її можна запустити вручну. Виклики через workflow-run пропускаються, якщо `main` уже просунувся далі або якщо інший непропущений запуск Docs Agent був створений протягом останньої години. Під час виконання він переглядає діапазон комітів від SHA джерела попереднього непропущеного Docs Agent до поточного `main`, тому один щогодинний запуск може охопити всі зміни в main, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це керована подіями доріжка обслуговування Codex для повільних тестів. У нього немає окремого запуску за розкладом: його може запустити успішний CI-запуск для небота після push у `main`, але він пропускається, якщо інший виклик через workflow-run уже виконався або виконується цього дня за UTC. Ручний запуск обходить цю щоденну перевірку активності. Доріжка будує згрупований звіт про продуктивність Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів без втрати покриття замість масштабних рефакторингів, потім повторно запускає звіт для повного набору і відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а повний звіт після роботи агента має пройти до будь-якого коміту. Коли `main` просувається вперед до того, як push бота потрапляє в репозиторій, доріжка перебазовує перевірений патч, повторно запускає `pnpm check:changed` і повторює push; застарілі патчі з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну політику drop-sudo, що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявлення змін лише в документації, змінених областей, змінених extensions і побудова CI-маніфесту | Завжди для push і PR не в режимі draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR не в режимі draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за advisory npm                                    | Завжди для push і PR не в режимі draft |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для push і PR не в режимі draft |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовуваних downstream-артефактів | Зміни, пов’язані з Node              |
| `checks-fast-core`               | Швидкі Linux-доріжки коректності, такі як перевірки bundled/plugin-contract/protocol         | Зміни, пов’язані з Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів channel зі стабільним агрегованим результатом                 | Зміни, пов’язані з Node              |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                | Зміни, пов’язані з Node              |
| `checks-node-core-test`          | Шарди тестів ядра Node, без доріжок channel, bundled, contract і extension                   | Зміни, пов’язані з Node              |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                          | Pull request зі змінами в extension  |
| `check`                          | Шардований еквівалент основного локального шлюзу: production-типи, lint, guards, test types і strict smoke | Зміни, пов’язані з Node              |
| `check-additional`               | Архітектурні перевірки, перевірки меж, guards поверхні extension, меж пакетів і шарди gateway-watch | Зміни, пов’язані з Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка стартової пам’яті                                | Зміни, пов’язані з Node              |
| `checks`                         | Верифікатор для тестів channel на зібраних артефактах плюс сумісність Node 22 лише для push  | Зміни, пов’язані з Node              |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Змінено документацію                 |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні Python Skills      |
| `checks-windows`                 | Специфічні для Windows тестові доріжки                                                       | Зміни, релевантні Windows            |
| `macos-node`                     | Доріжка тестів TypeScript для macOS з використанням спільних зібраних артефактів             | Зміни, релевантні macOS              |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                              | Зміни, релевантні macOS              |
| `android`                        | Юніт-тести Android для обох варіантів плюс одна збірка debug APK                             | Зміни, релевантні Android            |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успішний main CI або ручний запуск   |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запускаються дорогі:

1. `preflight` визначає, які доріжки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих завдань із артефактами та платформенних матриць.
3. `build-artifacts` перекривається з швидкими Linux-доріжками, щоб downstream-споживачі могли стартувати, щойно спільна збірка готова.
4. Після цього розгалужуються важчі платформенні й runtime-доріжки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише-PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покривається юніт-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни в CI workflow перевіряють граф Node CI плюс lint workflow, але самі по собі не змушують запускати нативні збірки Windows, Android або macOS; ці платформенні доріжки й далі залишаються прив’язаними до змін у вихідному коді відповідної платформи.
Перевірки Windows Node обмежуються специфічними для Windows обгортками process/path, допоміжними засобами npm/pnpm/UI runner, конфігурацією менеджера пакетів і поверхнями CI workflow, які виконують цю доріжку; не пов’язані зміни у вихідному коді, plugins, install-smoke і зміни лише в тестах залишаються на Linux Node-доріжках, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними шардами тестів.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін у package/manifest bundled plugins і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke-завдання. Зміни лише у вихідному коді bundled plugins, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin з тайм-аутом команди 120 секунд. Повний шлях зберігає покриття встановлення QR package і встановлювача Docker/update для нічних запусків за розкладом, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge-комітами, не примушують повний шлях; коли логіка changed-scope запитує повне покриття під час push, workflow залишає швидкий Docker smoke, а повний install smoke відкладає до нічної або релізної валідації. Повільний smoke глобального встановлення Bun image-provider окремо керується `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow перевірок релізу, а ручні запуски `install-smoke` можуть явно його увімкнути, але pull request і push у `main` його не запускають. Тести QR і installer Docker зберігають власні Dockerfile, зосереджені на встановленні. Локальний `test:docker:all` попередньо збирає один спільний образ live-test і один спільний образ зібраного застосунку `scripts/e2e/Dockerfile`, а потім запускає доріжки live/E2E smoke паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартний паралелізм основного пулу 8 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і паралелізм tail-пулу 8, чутливого до провайдерів, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Запуски доріжок за замовчуванням зсунуті на 2 секунди, щоб уникати локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат за замовчуванням припиняє планувати нові pooled-доріжки після першого збою, а кожна доріжка має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Повторно використовуваний workflow live/E2E віддзеркалює шаблон спільного образу, збираючи й публікуючи один Docker E2E-образ GHCR із тегом SHA до запуску матриці Docker, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker-набір релізного шляху. Повна матриця bundled update/channel залишається ручною/full-suite, бо виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка платформенна область дії CI: зміни у production-коді ядра запускають typecheck core prod плюс тести ядра, зміни лише в тестах ядра запускають лише typecheck/tests core test, зміни у production-коді extension запускають typecheck extension prod плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/tests extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на extension, бо extension залежать від цих контрактів ядра. Підвищення версії лише в метаданих релізу запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config для безпеки запускають усі доріжки.

Для push матриця `checks` додає доріжку `compat-node22`, яка запускається лише для push. Для pull request цю доріжку пропускають, і матриця залишається зосередженою на звичайних доріжках тестів/channel.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти channel запускаються у трьох зважених шардах, тести bundled plugin балансуються між шістьма worker-ами extension, невеликі core unit-доріжки об’єднані в пари, auto-reply виконується у трьох збалансованих worker-ах замість шести дрібних worker-ів, а агентні конфігурації gateway/plugin розподіляються між наявними source-only агентними Node-завданнями замість очікування на зібрані артефакти. Широкі тести browser, QA, media і різних plugins використовують свої окремі конфігурації Vitest замість спільної універсальної конфігурації plugin. Завдання шард extension запускають групи конфігурацій plugin послідовно з одним worker-ом Vitest і більшим heap Node, щоб пакети plugin з великим імпортом не перевантажували невеликі CI runner-и. Широка доріжка agents використовує спільний file-parallel scheduler Vitest, тому що в ній домінують імпорт/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із шардом infra core-runtime, щоб спільний runtime-шард не залишався найповільнішим. `check-additional` тримає compile/canary-роботи меж пакетів разом і відокремлює архітектуру topology runtime від покриття gateway watch; шард boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання. Gateway watch, тести channel і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі імена перевірок як легковагі завдання-верифікатори, водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Варіант third-party не має окремого source set або manifest; його доріжка юніт-тестів усе одно компілює цей варіант із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK для кожного push, релевантного Android.
`extension-fast` доступний лише для PR, оскільки push-запуски вже виконують повні шарди bundled plugin. Це зберігає швидкий зворотний зв’язок для змінених plugins під час review, не резервуючи додатковий Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже був замінений новішим.
Ключ паралельності CI має версіонування (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів channel, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж дали користі; Docker-збірки install-smoke, де вартість часу очікування в черзі для 32 vCPU була вищою, ніж користь                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; fork-репозиторії повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; fork-репозиторії повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                  |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: змінені typecheck/lint/tests за доріжкою меж
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # зібрати dist, коли важливі доріжки CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні main CI-запуски
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
