---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи охоплення та локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-27T04:12:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643ebe0240bf4ee0636ff7398705b36873a7a8d7d5742ef2c7d36333cc94422d
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне визначення охоплення, щоб пропускати дорогі завдання, коли змінено лише не пов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне визначення охоплення та розгортають увесь звичайний граф CI для кандидатів на реліз або широкої валідації.

`Full Release Validation` — це ручний узагальнювальний workflow для сценарію «запустити все
перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає
ручний workflow `CI` із цією ціллю та запускає `OpenClaw Release Checks`
для перевірки встановлення, приймання пакета, Docker-наборів для шляху релізу, live/E2E,
OpenWebUI, паритету QA Lab, Matrix і Telegram. Він також може запускати
післяпублікаційний workflow `NPM Telegram Beta E2E`, коли надано специфікацію
опублікованого пакета.

`Package Acceptance` — це допоміжний workflow для валідації артефакту пакета
без блокування workflow релізу. Він визначає одного кандидата з
опублікованої npm-специфікації, довіреного `package_ref`, зібраного вибраною
обв’язкою `workflow_ref`, HTTPS-URL tarball-архіву з SHA-256 або tarball-артефакту
з іншого запуску GitHub Actions, завантажує його як артефакт `package-under-test`,
а потім повторно використовує Docker-планувальник release/E2E з цим tarball замість повторного пакування
checkout workflow. Профілі охоплюють вибір Docker-каналів smoke, package, product, full і custom.
Необов’язковий канал Telegram повторно використовує артефакт
`package-under-test` у workflow `NPM Telegram Beta E2E`, при цьому шлях
опублікованої npm-специфікації зберігається для окремих ручних запусків.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей
пакет OpenClaw, придатний до встановлення, як продукт?» Це відрізняється від звичайного CI:
звичайний CI валідує дерево вихідного коду, тоді як приймання пакета валідує
один tarball через той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

Workflow має чотири завдання:

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета,
   записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує
   `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як
   артефакт `package-under-test` і виводить джерело, workflow ref, package
   ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає
   `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і
   `package_artifact_name=package-under-test`. Повторно використовуваний workflow
   завантажує цей артефакт, валідує вміст tarball, за потреби готує package-digest
   Docker-образи та запускає вибрані Docker-канали для цього пакета замість пакування checkout workflow.
3. `npm_telegram` за потреби викликає `NPM Telegram Beta E2E`. Він запускається лише коли
   `telegram_mode` не дорівнює `none`, і лише для `source=npm`,
   оскільки цей канал встановлює специфікацію опублікованого пакета.
4. `summary` завершує workflow з помилкою, якщо не вдалося визначити пакет, перевірка Docker acceptance або
   необов’язковий канал Telegram.

Джерела кандидатів:

- `source=npm`: приймає лише `openclaw@beta`, `openclaw@latest` або точну
  версію релізу OpenClaw, таку як `openclaw@2026.4.27-beta.2`. Використовуйте це для
  приймання опублікованих бета-/стабільних версій.
- `source=ref`: пакує довірену гілку, тег або повний SHA коміту `package_ref`.
  Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт
  досяжний з історії гілок репозиторію або тега релізу, встановлює залежності у
  відокремленому worktree та пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact`: завантажує один `.tgz` із `artifact_run_id` та
  `artifact_name`; `package_sha256` необов’язковий, але його слід указувати для
  артефактів, поширених зовнішньо.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений
код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт,
який пакується, коли `source=ref`. Це дає змогу поточному test harness
валідувати старіші довірені коміти вихідного коду без запуску старої логіки workflow.

Профілі відповідають покриттю Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `install-e2e`, `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps`, `plugins`, `plugin-update`
- `product`: `package` плюс `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: повні Docker-чанки шляху релізу з OpenWebUI
- `custom`: точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Перевірки релізу викликають Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>` і
`suite_profile=package`. Цей профіль є нативною для GitHub заміною більшості
валідацій пакета/оновлення в Parallels. Cross-OS перевірки релізу й надалі покривають
специфічну для ОС адаптацію, інсталятор і платформену поведінку; валідацію
пакета/оновлення на рівні продукту слід починати з Package Acceptance.

Приклади:

```bash
# Валідувати поточний бета-пакет із покриттям на рівні product.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product

# Запакувати й валідувати гілку релізу з поточною обв’язкою.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package

# Валідувати tarball URL. SHA-256 є обов’язковим для source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Повторно використати tarball, завантажений іншим запуском Actions.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Під час налагодження збійного запуску package acceptance почніть із підсумку
`resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте
дочірній запуск `docker_acceptance` і його Docker-артефакти:
`.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали каналів, часові показники етапів
і команди повторного запуску. Надавайте перевагу повторному запуску збійного профілю пакета або
точних Docker-каналів замість повторного запуску повної валідації релізу.

QA Lab має виділені канали CI поза основним workflow з розумним визначенням охоплення. Workflow
`Parity gate` запускається для відповідних змін у PR і через ручний запуск; він
збирає приватне середовище виконання QA та порівнює mock agentic packs GPT-5.5 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через
ручний запуск; він розгортає mock parity gate, live-канал Matrix і live-канал
Telegram як паралельні завдання. Live-завдання використовують середовище
`qa-live-shared`, а канал Telegram використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі канали QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває
лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub, він перевіряє, що
злитий PR справді об’єднано і що кожен дублікат або посилається на спільну issue,
або має перекривні змінені фрагменти.

Workflow `Docs Agent` — це lane обслуговування Codex, що запускається за подіями, для
підтримання наявної документації у відповідності до нещодавно злитих змін. Він не має окремого розкладу:
його може запустити успішний неботовий push-запуск CI на `main`, а
ручний запуск може запускати його напряму. Виклики через workflow-run пропускаються, якщо `main`
вже просунувся далі або якщо інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він запускається, він
переглядає діапазон комітів від попереднього непропущеного SHA джерела Docs Agent до
поточного `main`, тож один погодинний запуск може охопити всі зміни в main,
накопичені з моменту останнього проходу документації.

Workflow `Test Performance Agent` — це lane обслуговування Codex, що запускається за подіями,
для повільних тестів. Він не має окремого розкладу: його може запустити
успішний неботовий push-запуск CI на `main`, але він пропускається, якщо інший виклик через workflow-run
уже виконався або виконується в цю добу UTC. Ручний запуск обходить це денне
обмеження активності. Канал збирає звіт про продуктивність Vitest для повного набору тестів,
дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких
рефакторингів, потім повторно запускає звіт для повного набору тестів і відхиляє зміни,
які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести зі збоями,
Codex може виправити лише очевидні збої, а після-агентний звіт для повного набору тестів
має пройти, перш ніж щось буде закомічено. Коли `main` просувається до того, як bot push буде злитий,
канал перебазовує валідований патч, повторно запускає `pnpm check:changed` і повторює push;
застарілі патчі з конфліктами пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex
могла зберігати ту саму безпечну позицію drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                          | Призначення                                                                                  | Коли запускається                  |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                       | Визначення змін лише в документації, змінених областей охоплення, змінених розширень і побудова маніфесту CI | Завжди для push і PR без draft     |
| `security-scm-fast`               | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR без draft     |
| `security-dependency-audit`       | Аудит production lockfile без залежностей щодо advisory з npm                                | Завжди для push і PR без draft     |
| `security-fast`                   | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для push і PR без draft     |
| `build-artifacts`                 | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні для Node         |
| `checks-fast-core`                | Швидкі Linux-канали коректності, як-от bundled/plugin-contract/protocol checks               | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels`  | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-extensions`          | Повністю шардовані тести bundled-plugin для всього набору розширень                          | Зміни, релевантні для Node         |
| `checks-node-core-test`           | Шарди тестів core Node, без каналів, bundled, contract і каналів розширень                   | Зміни, релевантні для Node         |
| `check`                           | Шардований еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`                | Шарди архітектури, меж, extension-surface guards, package-boundary і gateway-watch           | Зміни, релевантні для Node         |
| `build-smoke`                     | Smoke-тести зібраного CLI та smoke-перевірка пам’яті під час запуску                         | Зміни, релевантні для Node         |
| `checks`                          | Верифікатор для тестів каналів на зібраних артефактах                                        | Зміни, релевантні для Node         |
| `checks-node-compat-node22`       | Канал сумісності з Node 22 для збірки та smoke-перевірки                                     | Ручний запуск CI для релізів       |
| `check-docs`                      | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено               |
| `skills-python`                   | Ruff + pytest для Skills на Python                                                           | Зміни, релевантні для Python Skills |
| `checks-windows`                  | Специфічні для Windows тестові канали                                                        | Зміни, релевантні для Windows      |
| `macos-node`                      | Канал тестів TypeScript на macOS із використанням спільних зібраних артефактів               | Зміни, релевантні для macOS        |
| `macos-swift`                     | Lint, збірка і тести Swift для застосунку macOS                                              | Зміни, релевантні для macOS        |
| `android`                         | Модульні тести Android для обох flavor плюс одна збірка debug APK                            | Зміни, релевантні для Android      |
| `test-performance-agent`          | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх CI в main або ручний запуск  |

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але
примусово вмикають усі канали з визначенням охоплення: Linux Node shards, bundled-plugin shards, channel contracts,
сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації,
Python Skills, Windows, macOS, Android і i18n для Control UI. Ручні запуски використовують
унікальну групу concurrency, щоб повний набір перевірок для кандидата на реліз не був скасований
іншим запуском push або PR на тому самому ref. Необов’язковий вхід `target_ref` дає змогу
довіреному виклику запускати цей граф для гілки, тега або повного SHA коміту, використовуючи
файл workflow із вибраного ref запуску.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запускаються дорогі:

1. `preflight` визначає, які канали взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються помилкою без очікування важчих завдань для артефактів і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-каналами, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього паралельно розгортаються важчі платформні та runtime-канали: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка визначення охоплення міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Ручний запуск пропускає визначення changed-scope і змушує маніфест preflight
працювати так, ніби змінено кожну область із визначенням охоплення.
Редагування workflow CI валідують граф Node CI плюс linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні канали й надалі визначаються лише змінами у вихідному коді відповідних платформ.
Редагування лише маршрутизації CI, окремі вибрані дешеві правки фікстур core-test і вузькі правки helper/test-routing для контрактів plugin використовують швидкий шлях маніфесту лише для Node: preflight, security і одне завдання `checks-fast-core`. Цей шлях уникає build artifacts, сумісності з Node 22, контрактів каналів, повних шард core, шард bundled-plugin і додаткових матриць guard, коли змінені файли обмежені поверхнями маршрутизації або helper, які швидке завдання безпосередньо перевіряє.
Перевірки Windows Node обмежені обгортками процесів/шляхів, специфічними для Windows, helper для запуску npm/pnpm/UI, конфігурацією менеджера пакетів і поверхнями workflow CI, які виконують цей канал; не пов’язані зміни вихідного коду, plugin, install-smoke і лише тестів залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже виконується звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення охоплення через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest у bundled plugin, а також поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише вихідного коду bundled plugin, зміни лише тестів і лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає smoke CLI для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним лімітом часу команди 240 секунд, де для кожного сценарію `docker run` обмежується окремо. Повний шлях зберігає QR package install і інсталяторне Docker/update покриття для нічних запусків за розкладом, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. Push у `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope вимагала б повного покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації. Повільний smoke для Bun global install image-provider окремо керується через `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть явно його ввімкнути, але pull request і push у `main` його не запускають. QR і installer Docker-тести зберігають власні Dockerfile, орієнтовані на встановлення. Локальний `test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`: базовий runner Node/Git для каналів installer/update/plugin-dependency і функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних каналів. Визначення Docker-каналів містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожного каналу за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає канали з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу 10 через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до провайдера, теж 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Ліміти для важких каналів за замовчуванням — `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, щоб канали npm install і багатосервісні канали не перевантажували Docker, поки легші канали все ще займають доступні слоти. Один канал, важчий за ефективні ліміти, усе одно може стартувати з порожнього пулу, а потім виконуватиметься самостійно, доки не звільнить ресурси. Запуск каналів за замовчуванням відбувається зі зміщенням у 2 секунди, щоб уникнути локальних піків створення контейнерів Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний сукупний запуск виконує попередню перевірку Docker, видаляє застарілі контейнери OpenClaw E2E, показує стан активних каналів, зберігає часові показники каналів для порядку найдовших спочатку та підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки scheduler. За замовчуванням він припиняє планування нових каналів у пулах після першої помилки, і кожен канал має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail-канали використовують жорсткіші індивідуальні ліміти. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` запускає точні канали scheduler, включно з каналами лише для релізу, як-от `install-e2e`, і розділеними каналами bundled update, як-от `bundled-channel-update-acpx`, пропускаючи cleanup smoke, щоб агенти могли відтворити один збійний канал. Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, який package, image kind, live image, lane і покриття credential потрібні, після чого `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує package artifact, наданий викликачем, валідує вміст tarball, збирає та публікує package-digest-tagged образи GHCR Docker E2E bare/functional, коли плану потрібні канали з установленим package, і повторно використовує ці образи, коли той самий digest пакета вже було підготовлено. Workflow `Package Acceptance` є високорівневим шлюзом для пакетів: він визначає кандидата з npm, довіреного `package_ref`, HTTPS tarball разом із SHA-256 або артефакту попереднього workflow, а потім передає цей єдиний артефакт `package-under-test` у повторно використовуваний Docker E2E workflow. Він тримає `workflow_ref` окремо від `package_ref`, щоб поточна логіка acceptance могла валідувати старіші довірені коміти без checkout старого коду workflow. Release checks запускають профіль acceptance `package` для цільового ref; цей профіль покриває контракти package/update/plugin і є типовою GitHub-native заміною більшості покриття package/update у Parallels. Набір Docker для шляху релізу виконується максимум як три розбиті на чанки завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен чанк отримував лише потрібний йому вид образу і виконував кілька каналів через той самий ваговий scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`). Кожен чанк завантажує `.artifacts/docker-tests/` з журналами каналів, часовими показниками, `summary.json`, `failures.json`, timings етапів, JSON-планом scheduler і командами повторного запуску для кожного каналу. Вхід workflow `docker_lanes` запускає вибрані канали на підготовлених образах замість трьох chunk jobs, що обмежує налагодження збійного каналу одним цільовим завданням Docker і готує або завантажує package artifact для цього запуску; якщо вибраний канал є live Docker lane, цільове завдання збирає live-test image локально для цього повторного запуску. Використовуйте `pnpm test:docker:rerun <run-id>`, щоб завантажити Docker-артефакти із запуску GitHub і вивести комбіновані/поканальні цільові команди повторного запуску; використовуйте `pnpm test:docker:timings <summary.json>` для зведень про повільні канали та критичний шлях етапів. Коли з набором release-path запитується Open WebUI, він запускається всередині чанка plugins/integrations замість резервування четвертого Docker worker; Open WebUI зберігає окреме самостійне завдання лише для запусків тільки openwebui. Запланований workflow live/E2E щодня запускає повний набір Docker для шляху релізу. Матриця bundled update розбита за ціллю оновлення, щоб повторювані проходи npm update і doctor repair могли шардуватися разом з іншими bundled checks.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз перевірок суворіше ставиться до архітектурних меж, ніж широка CI-область платформ: зміни core production запускають typecheck core prod і core test плюс lint/guards core, зміни лише core test запускають тільки typecheck core test плюс lint core, зміни extension production запускають typecheck extension prod і extension test плюс lint extension, а зміни лише extension test запускають typecheck extension test плюс lint extension. Зміни у публічному Plugin SDK або plugin-contract розширюють охоплення до typecheck extension, оскільки розширення залежать від цих контрактів core, але повні прогінні перевірки Vitest для розширень — це окрема явна тестова робота. Зміни лише метаданих релізу з оновленням версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config у безпечному режимі розширюються до всіх перевірочних каналів.

Ручні запуски CI виконують `checks-node-compat-node22` як покриття сумісності для кандидатів на реліз. Звичайні pull request і push у `main` пропускають цей канал і зберігають матрицю сфокусованою на каналах тестів/каналів Node 24.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів виконуються як три вагові шарди, тести bundled plugin балансуються між шістьма workers розширень, малі канали модульних тестів core об’єднані попарно, auto-reply виконується на чотирьох збалансованих workers, де reply subtree розділено на шарди agent-runner, dispatch і commands/state-routing, а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування на built artifacts. Широкі browser-, QA-, media- та різні plugin-тести використовують свої виділені конфігурації Vitest замість спільного універсального набору для plugin. Завдання шард extension запускають до двох груп конфігурацій plugin одночасно з одним worker Vitest на групу та більшим heap Node, щоб партії plugin з важкими імпортами не створювали додаткових завдань CI. Широкий канал agents використовує спільний file-parallel scheduler Vitest, оскільки в ньому домінують імпорт і планування, а не один повільний тестовий файл. `runtime-config` виконується разом із shard infra core-runtime, щоб спільний runtime shard не опинявся в хвості. Шарди include-pattern записують timing entries з використанням назви CI shard, тож `.artifacts/vitest-shard-timings.json` може розрізняти цілу конфігурацію і відфільтрований shard. `check-additional` тримає разом роботу package-boundary compile/canary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої малі незалежні guards паралельно в межах одного завдання. Gateway watch, channel tests і shard support-boundary core виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви перевірок як легкі завдання-верифікатори, але уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; її канал модульних тестів усе одно компілює цей flavor з прапорцями SMS/call-log у BuildConfig, водночас уникаючи дублювання завдання пакування debug APK на кожному push, релевантному для Android.
GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref теж не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ автоматичної concurrency CI має версіонування (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски main. Ручні повні прогони використовують `CI-manual-v1-*` і не скасовують уже запущені виконання.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла раніше стати в чергу |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32-vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз перевірок: changed typecheck/lint/guards за архітектурною межею
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із часовими показниками для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:changed   # дешеві розумні changed-цілі Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі канали CI artifact/build-smoke
pnpm ci:timings                               # звести останній запуск push CI для origin/main
pnpm ci:timings:recent                        # порівняти нещодавні успішні запуски main CI
node scripts/ci-run-timings.mjs <run-id>      # звести загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --latest-main # ігнорувати issue/comment noise і вибрати push CI для origin/main
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізу](/uk/install/development-channels)
