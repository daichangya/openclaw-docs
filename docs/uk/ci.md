---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області змін і локальні еквіваленти команд
title: пайплайн CI
x-i18n:
    generated_at: "2026-04-26T23:10:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b84dd1e40ca04120d8a4a9c53e1c2cca682920e89f4f6f181d6720be7a731b91
    source_path: ci.md
    workflow: 15
---

CI запускається під час кожного push у `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

QA Lab має окремі лінії CI поза основним workflow з розумним визначенням області змін. Workflow `Parity gate` запускається для PR зі змінами, що відповідають умовам, і через ручний dispatch; він
збирає приватне середовище виконання QA і порівнює агентні набори mock GPT-5.5 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через
ручний dispatch; він розгалужує mock parity gate, live-лінію Matrix і live-лінію
Telegram у вигляді паралельних завдань. Live-завдання використовують середовище `qa-live-shared`,
а лінія Telegram використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі лінії QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно вказані PR, коли `apply=true`. Перед зміною стану на GitHub він перевіряє, що злитий PR справді об’єднано, і що кожен дублікат має або спільний згаданий issue,
або перетин змінених hunk-ів.

Workflow `Docs Agent` — це керована подіями лінія обслуговування Codex для підтримки
наявної документації у відповідності до нещодавно злитих змін. Вона не має окремого запуску за розкладом: її може запустити успішний не-ботовий прогін CI після push у `main`, а ручний dispatch може
запустити її безпосередньо. Виклики через workflow_run пропускаються, якщо `main` уже просунувся далі або якщо за останню годину вже було створено інший непропущений запуск Docs Agent. Коли вона виконується, вона
переглядає діапазон комітів від source SHA попереднього непропущеного Docs Agent до
поточного `main`, тож один щогодинний запуск може охопити всі зміни в main, накопичені
з часу останнього проходу документації.

Workflow `Test Performance Agent` — це керована подіями лінія обслуговування Codex
для повільних тестів. Вона не має окремого запуску за розкладом: її може запустити успішний не-ботовий прогін CI після push у `main`, але вона пропускається, якщо інший виклик через workflow_run уже виконався або виконується в ту саму добу UTC. Ручний dispatch обходить це денне обмеження активності. Лінія збирає повний згрупований звіт продуктивності Vitest, дозволяє Codex
вносити лише невеликі зміни продуктивності тестів без втрати покриття замість широких рефакторингів, потім повторно запускає повний звіт і відхиляє зміни, які зменшують кількість тестів, що проходять, у базовому стані. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а повний звіт після роботи агента має пройти, перш ніж щось буде закомічено. Коли `main` просувається далі до того, як bot push буде застосовано, лінія
робить rebase перевіреного патча, повторно запускає `pnpm check:changed` і повторює push;
застарілі патчі з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex
могла зберігати ту саму безпечну політику drop-sudo, що й агент документації.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Job                              | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявлення змін лише в документації, змінених областей, змінених розширень і побудова CI manifest | Завжди для non-draft push і PR       |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                  | Завжди для non-draft push і PR       |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для non-draft push і PR       |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для non-draft push і PR       |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, пов’язані з Node              |
| `checks-fast-core`               | Швидкі лінії коректності Linux, такі як перевірки bundled/plugin-contract/protocol          | Зміни, пов’язані з Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки      | Зміни, пов’язані з Node              |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                               | Зміни, пов’язані з Node              |
| `checks-node-core-test`          | Шарди основних тестів Node, за винятком ліній каналів, bundled, contracts і extensions      | Зміни, пов’язані з Node              |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugin                                               | Pull request зі змінами розширень    |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node              |
| `check-additional`               | Шарди архітектури, меж, guards поверхні розширень, package-boundary і gateway-watch         | Зміни, пов’язані з Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                          | Зміни, пов’язані з Node              |
| `checks`                         | Верифікатор для built-artifact тестів каналів плюс сумісність Node 22 лише для push         | Зміни, пов’язані з Node              |
| `check-docs`                     | Перевірки форматування документації, lint і пошкоджених посилань                             | Документацію змінено                 |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні Python Skills      |
| `checks-windows`                 | Специфічні для Windows тестові лінії                                                         | Зміни, релевантні Windows            |
| `macos-node`                     | Лінія тестів TypeScript на macOS із використанням спільних зібраних артефактів              | Зміни, релевантні macOS              |
| `macos-swift`                    | Lint, збирання і тести Swift для застосунку macOS                                            | Зміни, релевантні macOS              |
| `android`                        | Модульні тести Android для обох flavor плюс одне збирання debug APK                          | Зміни, релевантні Android            |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів через Codex після довіреної активності                  | Успішний main CI або ручний dispatch |

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не очікуючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб downstream-споживачі могли почати роботу, щойно буде готове спільне збирання.
4. Після цього розгалужуються важчі платформні лінії та лінії середовища виконання: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін живе в `scripts/ci-changed-scope.mjs` і покривається модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI разом із lint-перевіркою workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні лінії й надалі обмежуються змінами у вихідному коді відповідних платформ.
Зміни лише маршрутизації CI, окремі дешеві зміни fixture для core-тестів і вузькі зміни helper/test-routing для контрактів plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних shard core, shard bundled-plugin і додаткових матриць guard, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання безпосередньо перевіряє.
Перевірки Windows Node обмежені Windows-специфічними обгортками процесів/шляхів, helper для npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цю лінію; не пов’язані зміни у вихідному коді, plugin, install-smoke і зміни лише в тестах залишаються на Linux Node-лініях, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже перевіряється звичайними shard тестів.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення області через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Для pull request запускається швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke `agents delete shared-workspace`, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker profile для bundled-plugin із загальним тайм-аутом команди 240 секунд, де кожен сценарій `docker run` має власне окреме обмеження. Повний шлях зберігає QR package install і покриття installer Docker/update для нічних запусків за розкладом, ручних dispatch, workflow-call перевірок релізу і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge-комітами, не примушують повний шлях; коли логіка changed-scope запросила б повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної перевірки або валідації релізу. Повільний smoke Bun global install image-provider окремо контролюється через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch `install-smoke` можуть явно його ввімкнути, але pull request і push у `main` його не запускають. QR і installer Docker-тести зберігають власні Dockerfile, орієнтовані на встановлення. Локальна команда `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для ліній installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній. Визначення Docker-ліній живуть у `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM` і кількість слотів tail-пулу, чутливого до provider, 10 через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження для важких ліній за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб лінії npm install і multi-service не перевантажували Docker, тоді як легші лінії й далі заповнюють доступні слоти. Запуски ліній за замовчуванням зміщуються на 2 секунди, щоб уникати локальних штормів create в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегатний запуск попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних ліній, зберігає час виконання ліній для порядку longest-first і підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він припиняє планування нових pooled-ліній після першої помилки, і кожна лінія має запасний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail-лінії використовують жорсткіші індивідуальні обмеження. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні лінії планувальника, включно з лініями лише для релізу, як-от `install-e2e`, і розділеними лініями оновлення bundled, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити одну збоїлу лінію. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, яке package, image kind, live image, lane і покриття credentials потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summary. Він пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, перевіряє inventory tarball, збирає і публікує один Docker E2E образ bare GHCR з тегом SHA, коли плану потрібні лінії install/update/plugin-dependency, і збирає один Docker E2E образ functional GHCR з тегом SHA, коли плану потрібні лінії функціональності зі встановленим package; якщо будь-який із цих образів із тегом SHA вже існує, workflow пропускає його повторну збірку, але все одно створює свіжий tarball artifact, потрібний для цільових повторних запусків. Docker-набір для шляху релізу запускається максимум як три chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу і виконував кілька ліній через той самий зважений планувальник (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). Кожен chunk завантажує `.artifacts/docker-tests/` із логами ліній, часами виконання, `summary.json`, `failures.json`, часами етапів, JSON плану планувальника і командами повторного запуску для кожної лінії. Вхід `docker_lanes` workflow запускає вибрані лінії проти підготовлених образів замість трьох chunked-завдань, що обмежує налагодження збоїлої лінії одним цільовим Docker-завданням і готує свіжий npm tarball для вибраного ref; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає live-test image для цього повторного запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker artifacts із GitHub run і вивести комбіновані/поканальні команди цільового повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для підсумків повільних ліній і критичного шляху фаз. Коли для release-path suite запитується Open WebUI, він виконується всередині chunk `plugins/integrations`, а не резервує четвертий Docker worker; Open WebUI зберігає окреме standalone-завдання лише для dispatch, що стосуються тільки openwebui. Запланований workflow live/E2E щодня запускає повний release-path Docker suite. Матриця bundled update розділена за ціллю оновлення, щоб повторні проходи npm update і doctor repair могли шардитися разом з іншими bundled-перевірками.

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз перевірки суворіший щодо архітектурних меж, ніж широка CI-область платформ: зміни core production запускають перевірку типів core prod і core test разом із core lint/guards, зміни лише в core-тестах запускають лише перевірку типів core test і core lint, зміни extension production запускають перевірку типів extension prod і extension test разом із extension lint, а зміни лише в extension-тестах запускають перевірку типів extension test і extension lint. Зміни у публічному Plugin SDK або plugin-contract розширюють перевірку до typecheck extension, бо extensions залежать від цих core-контрактів, але повні проходи Vitest для extension — це явна тестова робота. Версійні зміни лише в метаданих релізу запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно розширюються до всіх ліній перевірки.

Під час push матриця `checks` додає лінію лише для push `compat-node22`. Для pull request ця лінія пропускається, і матриця залишається зосередженою на звичайних лініях тестів/каналів.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надлишкового резервування runner-ів: контракти каналів виконуються як три зважені shard, тести bundled plugin балансуються між шістьма workers для extension, малі core unit-лінії об’єднані в пари, auto-reply виконується на чотирьох збалансованих workers із розділенням піддерева reply на shard `agent-runner`, `dispatch` і `commands/state-routing`, а конфігурації agentic gateway/plugin розподіляються по наявних Node-завданнях agentic лише для source замість очікування на built artifacts. Широкі тести browser, QA, media і miscellaneous plugin використовують власні конфігурації Vitest замість спільної універсальної конфігурації plugin. Shard-завдання extension одночасно запускають до двох груп конфігурацій plugin з одним worker Vitest на групу і збільшеною heap-пам’яттю Node, щоб batch-и plugin з важкими імпортами не створювали додаткові CI-завдання. Широка лінія agents використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard `infra core-runtime`, щоб спільний runtime-shard не залишався «хвостом». Shard-и include-pattern записують значення часу з використанням назви CI-shard, тож `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard. `check-additional` тримає разом package-boundary compile/canary-роботу і відокремлює архітектуру topology runtime від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guard-и паралельно всередині одного завдання. Gateway watch, channel-тести і shard support-boundary для core запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви перевірок як легкі завдання-верифікатори й уникаючи двох додаткових Blacksmith workers і другої черги споживачів artifact.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його лінія модульних тестів однаково компілює цей flavor із прапорцями BuildConfig для SMS/call-log, уникаючи при цьому дубльованого завдання пакування debug APK при кожному Android-релевантному push.
`extension-fast` працює лише для PR, оскільки push-запуски вже виконують повні shard bundled plugin. Це зберігає швидкий зворотний зв’язок щодо змінених plugin під час review, не резервуючи додатковий Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ конкурентності CI версіонується (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати нові запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агрегатні верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32-vCPU коштував дорожче, ніж заощаджував                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз перевірок: changed typecheck/lint/guards за граничною лінією
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із часом виконання для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні цільові changed-запуски Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + пошкоджені посилання
pnpm build          # зібрати dist, коли важливі CI-лінії artifact/build-smoke
pnpm ci:timings                               # підсумок останнього запуску push CI для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні запуски main CI
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, queue time і найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати шум issue/comment і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
