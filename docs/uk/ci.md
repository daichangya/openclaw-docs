---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої в перевірках GitHub Actions
summary: Граф завдань CI, перевірки за областю змін і локальні еквіваленти команд
title: пайплайн CI
x-i18n:
    generated_at: "2026-04-26T21:31:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b60445c01b9cc30be075c37c04ae827f68f9b08550abc3bfde498f8660c6fc2
    source_path: ci.md
    workflow: 15
---

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише нерелевантні ділянки.

QA Lab має окремі лінії CI поза основним робочим процесом із розумним обмеженням за областю змін. Робочий процес
`Parity gate` запускається для PR зі відповідними змінами та через manual dispatch; він
збирає приватне середовище виконання QA і порівнює агентні пакети mock GPT-5.5 та Opus 4.6.
Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і через
manual dispatch; він розгалужує mock parity gate, live-лінію Matrix і live-лінію
Telegram як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`,
а лінія Telegram використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі лінії QA Lab перед затвердженням релізу.

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес для мейнтейнерів для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і
закриває лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub,
він перевіряє, що злитий PR справді змерджено, і що кожен дублікат має або спільну пов’язану issue,
або перекривні змінені hunks.

Робочий процес `Docs Agent` — це керована подіями лінія обслуговування Codex для підтримки
наявної документації у відповідності до нещодавно злитих змін. У нього немає окремого розкладу:
його може запустити успішний запуск CI для push у `main`, виконаний не ботом,
а manual dispatch може запустити його безпосередньо. Виклики через workflow_run пропускаються,
якщо `main` уже пішла далі або якщо інший непропущений запуск Docs Agent був створений
протягом останньої години. Коли він запускається, він переглядає діапазон комітів від
попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один
щогодинний запуск може охопити всі зміни в main, накопичені з моменту останнього проходу документації.

Робочий процес `Test Performance Agent` — це керована подіями лінія обслуговування Codex
для повільних тестів. У нього немає окремого розкладу: його може запустити
успішний запуск CI для push у `main`, виконаний не ботом, але він пропускається,
якщо інший виклик через workflow_run уже виконався або виконується в той самий день UTC.
Manual dispatch обходить це денне обмеження активності. Лінія збирає згрупований звіт
про продуктивність Vitest для повного набору, дозволяє Codex вносити лише невеликі
виправлення продуктивності тестів без втрати покриття замість широких рефакторингів,
потім повторно запускає звіт для повного набору і відхиляє зміни, які зменшують
базову кількість тестів, що проходять. Якщо в базовому стані є тести, що падають,
Codex може виправляти лише очевидні збої, а звіт для повного набору після роботи агента
має бути успішним, перш ніж щось буде закомічено. Коли `main` просувається далі
до того, як bot push потрапляє в гілку, лінія перебазовує перевірений патч,
повторно запускає `pnpm check:changed` і повторює push; застарілі патчі з конфліктами пропускаються.
Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму
безпечну політику без sudo, що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявлення змін лише в документації, змінених областей, змінених розширень і побудова маніфесту CI | Завжди для push і PR, що не є draft  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                  | Завжди для push і PR, що не є draft  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                               | Завжди для push і PR, що не є draft  |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR, що не є draft  |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовуваних downstream-артефактів | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol            | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки      | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                               | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди основних Node-тестів, без урахування ліній каналів, bundled, контрактів і розширень   | Зміни, релевантні для Node           |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                             | Pull request зі змінами розширень    |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`               | Шарди архітектури, меж, захисту поверхні розширень, меж пакетів і gateway-watch             | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                              | Зміни, релевантні для Node           |
| `checks`                         | Верифікатор для тестів каналів на зібраних артефактах плюс сумісність Node 22 лише для push | Зміни, релевантні для Node           |
| `check-docs`                     | Перевірки форматування документації, lint і битих посилань                                  | Документацію змінено                 |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                   | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Специфічні для Windows тестові лінії                                                        | Зміни, релевантні для Windows        |
| `macos-node`                     | Лінія TypeScript-тестів на macOS із використанням спільних зібраних артефактів              | Зміни, релевантні для macOS          |
| `macos-swift`                    | Лінтинг, збірка та тести Swift для застосунку macOS                                         | Зміни, релевантні для macOS          |
| `android`                        | Модульні тести Android для обох flavor плюс одна збірка debug APK                           | Зміни, релевантні для Android        |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх main CI або manual dispatch    |

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко, не чекаючи на важчі матричні завдання артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей змін міститься в `scripts/ci-changed-scope.mjs` і покривається модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI та linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії й надалі обмежуються змінами у вихідному коді відповідних платформ.
Зміни лише в маршрутизації CI, окремі вибрані дешеві правки фікстур core-test, а також вузькі правки helper/test-routing для контрактів plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і єдине завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності Node 22, контрактів каналів, повних шард core, шардів bundled-plugin і додаткових матриць guard, коли змінені файли обмежені лише поверхнями маршрутизації або helper, які швидке завдання перевіряє безпосередньо.
Windows Node-перевірки обмежені Windows-специфічними обгортками process/path, helper для npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цю лінію; нерелевантні зміни у вихідному коді, plugin, install-smoke і зміни лише в тестах залишаються в Linux Node-лініях, щоб не займати Windows worker на 16 vCPU для покриття, яке вже перевіряється звичайними тестовими shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт областей змін через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin, зміни лише в тестах і зміни лише в документації не займають Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg для bundled extension і запускає обмежений Docker profile bundled-plugin із загальним timeout команди 240 секунд, де `docker run` для кожного сценарію обмежений окремо. Повний шлях зберігає покриття встановлення QR package і installer Docker/update для нічних запланованих запусків, manual dispatch, перевірок релізу через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commit, не примушують запускати повний шлях; коли логіка changed-scope запросила б повне покриття для push, workflow залишає швидкий Docker smoke, а повний install smoke відкладає до нічної або релізної перевірки. Повільний smoke image-provider для глобального встановлення Bun окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow перевірок релізу, а manual dispatch `install-smoke` може його явно ввімкнути, але pull request і push у `main` його не запускають. QR і installer Docker-тести зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний образ live-test і один спільний образ built-app з `scripts/e2e/Dockerfile`, а потім запускає smoke-лінії live/E2E із weighted scheduler та `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до provider, також 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких ліній за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб лінії npm install і multi-service не перевантажували Docker, поки легші лінії все ще заповнюють доступні слоти. Запуски ліній за замовчуванням зміщені на 2 секунди, щоб уникати локальних бур створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегований запуск попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить стан активних ліній, зберігає тривалості ліній для впорядкування за принципом longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для аналізу scheduler. Він за замовчуванням перестає планувати нові pooled-лінії після першої помилки, а кожна лінія має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail-лінії використовують жорсткіші обмеження для конкретної лінії. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні лінії scheduler, включно з лініями лише для релізів, такими як `install-e2e`, і розділеними лініями bundled update, такими як `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити одну проблемну лінію. Повторно використовуваний workflow live/E2E збирає і публікує один SHA-tagged Docker E2E-образ у GHCR, а потім запускає Docker-набір релізного шляху максимум у трьох chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk один раз витягував спільний образ і виконував кілька ліній через той самий weighted scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). Кожен chunk вивантажує `.artifacts/docker-tests/` із логами ліній, тривалостями, `summary.json` і командами повторного запуску для кожної лінії. Вхід `docker_lanes` workflow запускає вибрані лінії на підготовленому образі замість трьох chunk jobs, що обмежує налагодження проблемної лінії одним цільовим Docker job; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає образ live-test для цього повторного запуску. Коли Open WebUI запитується разом із набором release-path, він запускається всередині chunk plugins/integrations замість резервування четвертого Docker worker; Open WebUI зберігає окреме standalone job лише для dispatch типу openwebui-only. Запланований workflow live/E2E щодня запускає повний Docker-набір release-path. Матриця bundled update розділена за ціллю оновлення, щоб повторювані проходи npm update і doctor repair могли шардуватися разом з іншими bundled-перевірками.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широкий платформний scope у CI: зміни в production core запускають typecheck production core плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для тестів core, зміни в production extension запускають typecheck production extension плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/tests для тестів extension. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension, бо extensions залежать від цих core-контрактів. Version bump лише в метаданих релізу запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять у всі лінії.

Для push матриця `checks` додає лінію лише для push — `compat-node22`. Для pull request ця лінія пропускається, і матриця зосереджується на звичайних тестових/канальних лініях.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів виконуються як три weighted shards, тести bundled plugin балансуються між шістьма workers для extensions, невеликі core unit-лінії об’єднуються в пари, auto-reply запускається на чотирьох збалансованих workers із піддеревом reply, розділеним на shards agent-runner, dispatch і commands/state-routing, а конфігурації agentic gateway/plugin розподіляються між наявними Node-завданнями agentic лише для вихідного коду замість очікування на built artifacts. Широкі browser-, QA-, media- і miscellaneous plugin-тести використовують свої окремі конфігурації Vitest замість спільної універсальної конфігурації plugin. Завдання shard для extensions запускають до двох груп конфігурацій plugin одночасно з одним worker Vitest на групу та більшим heap Node, щоб великі пакети plugin з важкими import не створювали додаткових завдань CI. Широка лінія agents використовує спільний file-parallel scheduler Vitest, бо в ній домінують import/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard infra core-runtime, щоб спільний runtime-shard не утримував tail. Шарди за include-pattern записують записи часу з використанням імені CI-shard, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard. `check-additional` тримає compile/canary-роботи package-boundary разом і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання. Gateway watch, channel-тести та shard support-boundary core запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви перевірок як lightweight verifier jobs і водночас уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його лінія модульних тестів усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, уникаючи при цьому дублювання завдання пакування debug APK на кожному Android-релевантному push.
`extension-fast` є лише для PR, бо push-запуски вже виконують повні shards bundled plugin. Це зберігає швидкий зворотний зв’язок для змінених plugin під час рев’ю без резервування додаткового Blacksmith worker у `main` для покриття, яке вже присутнє в `checks-node-extensions`.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже був замінений новішим.
Ключ concurrency у CI має версію (`CI-v7-*`), щоб zombie-елемент на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски для main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shards `check`, окрім lint, shards і агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards Linux Node-тестів, shards тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали виграш; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав виграш                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # збірка dist, коли важливі лінії CI artifact/build-smoke
pnpm ci:timings                               # підсумувати останній запуск push CI для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні запуски main CI
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати issue/comment noise і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
