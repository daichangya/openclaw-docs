---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої в перевірках GitHub Actions
summary: Граф завдань CI, межі перевірок і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-24T22:51:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfcd687e6555b15ddebe3c061a814911d4f8a49c0db1c42aff357976a82bbbd5
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має окремі смуги CI поза основним workflow з розумним визначенням області змін. Workflow
`Parity gate` запускається для відповідних змін у PR і через ручний запуск; він
збирає приватне середовище виконання QA та порівнює agentic pack-и mock GPT-5.4 і Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через
ручний запуск; він розгалужує mock parity gate, live Matrix lane і live
Telegram lane як паралельні завдання. Live-завдання використовують середовище
`qa-live-shared`, а Telegram lane використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі смуги QA Lab перед погодженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і
закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub
він перевіряє, що злитий PR справді об’єднано, і що кожен дублікат має або спільну
пов’язану issue, або перетин змінених фрагментів.

Workflow `Docs Agent` — це maintenance lane Codex на основі подій для підтримання
наявної документації у відповідності до нещодавно злитих змін. Він не має окремого запуску за розкладом:
його може запустити успішний CI run не-бота для push у `main`, а також він може
запускатися безпосередньо вручну. Запуски через workflow-run пропускаються, якщо
`main` уже пішов уперед або якщо інший непропущений запуск Docs Agent був створений
протягом останньої години. Коли він запускається, він переглядає діапазон комітів
від вихідного SHA попереднього непропущеного Docs Agent до поточного `main`,
тож один щогодинний запуск може охопити всі зміни в main, накопичені з часу
останнього проходу документації.

Workflow `Test Performance Agent` — це maintenance lane Codex на основі подій
для повільних тестів. Він не має окремого запуску за розкладом: його може запустити
успішний CI run не-бота для push у `main`, але він пропускається, якщо інший запуск
через workflow-run уже виконався або виконується в ту саму добу UTC. Ручний запуск
обходить це добове обмеження активності. Lane будує згрупований звіт продуктивності
Vitest для повного набору тестів, дозволяє Codex вносити лише невеликі зміни
продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім
повторно запускає звіт для повного набору й відхиляє зміни, які зменшують базову
кількість успішних тестів. Якщо в базі є тести, що падають, Codex може виправляти
лише очевидні збої, і звіт повного набору після роботи агента має пройти повністю,
перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push
буде застосовано, lane перебазовує перевірений патч, повторно запускає
`pnpm check:changed` і повторює спробу push; конфліктні застарілі патчі пропускаються.
Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму
безпечну модель без `sudo`, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначення змін лише в документації, змінених областей, змінених extensions і побудова маніфесту CI | Завжди для non-draft push і PR      |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR      |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для non-draft push і PR      |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для non-draft push і PR      |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, пов’язані з Node             |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, такі як перевірки bundled/plugin-contract/protocol           | Зміни, пов’язані з Node             |
| `checks-fast-contracts-channels` | Розбиті на шарди перевірки channel contract зі стабільним агрегованим результатом перевірки  | Зміни, пов’язані з Node             |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                | Зміни, пов’язані з Node             |
| `checks-node-core-test`          | Шарди основних Node-тестів, за винятком channel, bundled, contract і extension lanes         | Зміни, пов’язані з Node             |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request із змінами в extension |
| `check`                          | Еквівалент основної локальної перевірки, розбитої на шарди: prod types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node             |
| `check-additional`               | Шарди архітектурних, boundary, extension-surface, package-boundary і gateway-watch перевірок | Зміни, пов’язані з Node             |
| `build-smoke`                    | Smoke-тести built-CLI і smoke-тест пам’яті під час запуску                                   | Зміни, пов’язані з Node             |
| `checks`                         | Верифікатор для built-artifact channel tests плюс сумісність Node 22 лише для push           | Зміни, пов’язані з Node             |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Змінено документацію                |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, пов’язані з Python Skills    |
| `checks-windows`                 | Windows-специфічні тестові смуги                                                             | Зміни, пов’язані з Windows          |
| `macos-node`                     | Смуга тестів TypeScript на macOS з використанням спільних built artifacts                    | Зміни, пов’язані з macOS            |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                              | Зміни, пов’язані з macOS            |
| `android`                        | Android unit-тести для обох flavor плюс одна debug APK збірка                                | Зміни, пов’язані з Android          |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успішний Main CI або ручний запуск  |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні смуги й смуги виконання: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише для PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка визначення області змін знаходиться в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни у workflow CI перевіряють граф Node CI і lint workflow, але самі по собі не примушують запускати native-збірки Windows, Android або macOS; ці платформні смуги й далі залежать лише від змін у коді відповідних платформ.
Перевірки Windows Node обмежені Windows-специфічними wrappers для process/path, допоміжними засобами npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цю смугу; не пов’язані зміни у коді, plugins, install-smoke і лише тестах залишаються на Linux Node lanes, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже забезпечується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення області змін через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`. Pull request запускають швидкий шлях для поверхонь Docker/package, змін package/manifest bundled plugin і поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряються Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, лише в тестах і лише в документації не резервують Docker workers. Швидкий шлях один раз збирає root Dockerfile image, перевіряє CLI, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений профіль Docker для bundled-plugin із тайм-аутом команди 120 секунд. Повний шлях зберігає покриття встановлення QR package і installer Docker/update для нічних запусків за розкладом, ручних запусків, workflow-call release checks і pull request, які справді торкаються поверхонь installer/package/Docker. Push у `main`, включно з merge commits, не примушують повний шлях; коли логіка changed-scope вимагала б повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної перевірки. Повільний smoke для Bun global install image-provider додатково захищається прапорцем `run_bun_global_install_smoke`; він запускається за нічним розкладом і з workflow release checks, а ручні запуски `install-smoke` можуть явно його ввімкнути, але pull request і push у `main` його не запускають. Тести QR і installer Docker мають власні Dockerfile, зосереджені на встановленні. Локальний агрегат `test:docker:all` попередньо збирає один спільний live-test image і один built-app image `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke lanes із ваговим планувальником і `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте типову кількість слотів основного пулу — 10 — через `OPENCLAW_DOCKER_ALL_PARALLELISM`, а кількість слотів tail-пулу, чутливого до provider, — 10 — через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Обмеження важких смуг за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=4` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=5`, щоб смуги npm install і multi-service не перевантажували Docker, поки легші смуги все ще використовують доступні слоти. Запуски смуг за замовчуванням розносяться на 2 секунди, щоб уникати локальних штормів створення контейнерів Docker; перевизначте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` або інше значення в мілісекундах. Локальний агрегат перед стартом перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних смуг, зберігає таймінги смуг для впорядкування за принципом найдовші спочатку й підтримує `OPENCLAW_DOCKER_ALL_DRY_RUN=1` для перевірки планувальника. За замовчуванням він припиняє планувати нові pooled lanes після першої помилки, а кожна смуга має резервний тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші індивідуальні обмеження. Повторно використовуваний workflow live/E2E віддзеркалює шаблон спільного image: він збирає і публікує один GHCR Docker E2E image з тегом SHA перед Docker matrix, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Workflow scheduled live/E2E щодня запускає повний Docker suite за релізним сценарієм. Матрицю bundled update поділено за ціллю оновлення, щоб повторні проходи npm update і doctor repair можна було шардувати разом з іншими bundled checks.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіше ставиться до архітектурних меж, ніж широка платформна область CI: зміни core production запускають typecheck для core prod плюс тести core, зміни лише в core tests запускають лише typecheck/tests для core tests, зміни extension production запускають typecheck для extension prod плюс тести extension, а зміни лише в extension tests запускають лише typecheck/tests для extension tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extensions, оскільки extensions залежать від цих core-контрактів. Підвищення версії лише в метаданих релізу запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять перевірку на всі смуги.

Для push матриця `checks` додає lane `compat-node22`, який запускається лише для push. Для pull request цей lane пропускається, і матриця залишається зосередженою на звичайних test/channel lanes.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts запускаються як три зважені шарди, тести bundled plugin балансуються між шістьма extension worker-ами, невеликі core unit lanes поєднуються попарно, auto-reply працює на трьох збалансованих worker-ах замість шести дрібних worker-ів, а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі тести browser, QA, media і miscellaneous plugin використовують свої окремі конфігурації Vitest замість спільного універсального набору plugin. Завдання extension shard запускають до двох груп конфігурацій plugin одночасно з одним worker-ом Vitest на групу та більшим heap Node, щоб import-інтенсивні пакети plugin не створювали зайві завдання CI. Широка agents lane використовує спільний планувальник файлового паралелізму Vitest, оскільки тут домінують import/планування, а не один окремий повільний test file. `runtime-config` запускається разом із shard `infra core-runtime`, щоб спільний shard runtime не володів хвостом. `check-additional` тримає разом package-boundary compile/canary роботу і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої малі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і shard core support-boundary запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі імена перевірок як легкі завдання-верифікатори, водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його lane unit-тестів усе одно компілює цей flavor з прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK для кожного Android-релевантного push.
`extension-fast` є лише для PR, оскільки push-запуски вже виконують повні шарди bundled plugin. Це дає швидкий зворотний зв’язок щодо змінених plugin для рев’ю, не резервуючи додатковий Blacksmith worker у `main` для покриття, яке вже присутнє в `checks-node-extensions`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні збої shard-ів, але не ставали в чергу після того, як весь workflow уже був витіснений.
Ключ concurrency у CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, перевірки channel contract, розбиті на шарди, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла потрапити в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, так що 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де вартість часу в черзі для 32 vCPU була вищою за вигоду                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + lint, розбитий на шарди + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # зібрати dist, коли важливі смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізу](/uk/install/development-channels)
