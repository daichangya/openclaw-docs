---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, що завершуються з помилкою
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T23:47:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ada7a931acf451ef2dd3d132f701f3a87b6976fb476ed4f4f52ecc09c4191b12
    source_path: ci.md
    workflow: 15
---

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

QA Lab має окремі смуги CI поза основним workflow з розумним визначенням області дії. Workflow
`Parity gate` запускається для відповідних змін у PR і при ручному запуску; він
збирає приватне QA runtime і порівнює агентні пакети mock GPT-5.4 та Opus 4.6.
Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і при
ручному запуску; він розгалужує mock parity gate, live Matrix lane та live
Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`,
а Telegram lane використовує оренди Convex. `OpenClaw Release
Checks` також запускає ті самі смуги QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для
очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і
закриває лише явно перелічені PR, коли `apply=true`. Перед змінами на GitHub
він перевіряє, що злитий PR справді об’єднано, і що кожен дублікат має або
спільний згаданий issue, або перетин змінених фрагментів.

Workflow `Docs Agent` — це керована подіями смуга обслуговування Codex для
підтримання наявної документації у відповідності до нещодавно внесених змін. Вона не має окремого запуску за розкладом:
її може запустити успішний CI-прогін push не від бота на `main`, а також її можна
запустити вручну. Виклики через workflow-run пропускаються, якщо `main` уже пішов далі
або якщо інший непропущений запуск Docs Agent був створений протягом останньої години. Коли вона запускається,
вона переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до
поточного `main`, тож один щогодинний запуск може охопити всі зміни в main,
що накопичилися з часу останнього проходу документації.

Workflow `Test Performance Agent` — це керована подіями смуга обслуговування Codex
для повільних тестів. Вона не має окремого запуску за розкладом:
її може запустити успішний CI-прогін push не від бота на `main`, але
вона пропускається, якщо інший виклик через workflow-run уже відпрацював або виконується в ту ж UTC-добу.
Ручний запуск обходить цю добову перевірку активності. Смуга збирає
звіт про продуктивність Vitest для повного набору тестів із групуванням, дозволяє Codex
вносити лише невеликі виправлення продуктивності тестів без втрати покриття замість широких рефакторингів,
потім повторно запускає звіт для повного набору і відхиляє зміни, які
зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що падають,
Codex може виправляти лише очевидні збої, і післяагентний звіт для повного набору
має проходити, перш ніж щось буде закомічено. Коли `main` просувається далі до того, як push бота потрапить у гілку,
смуга перебазовує перевірений патч, повторно запускає `pnpm check:changed` і
повторює push; конфліктні застарілі патчі пропускаються. Вона використовує Ubuntu, розміщену на GitHub,
щоб дія Codex могла зберігати ту саму безпечну модель drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Job                              | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявлення змін лише в docs, змінених областей, змінених extensions і побудова CI-маніфесту  | Завжди для push і PR не в draft      |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR не в draft      |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для push і PR не в draft      |
| `security-fast`                  | Обов’язковий агрегат для швидких security-завдань                                            | Завжди для push і PR не в draft      |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, що стосуються Node            |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, наприклад перевірки bundled/plugin-contract/protocol         | Зміни, що стосуються Node            |
| `checks-fast-contracts-channels` | Розшардовані перевірки channel contract зі стабільним агрегованим результатом перевірки      | Зміни, що стосуються Node            |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin по всьому набору extension                                 | Зміни, що стосуються Node            |
| `checks-node-core-test`          | Шарди основних Node-тестів, без channel, bundled, contract і extension-смуг                  | Зміни, що стосуються Node            |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request зі змінами в extension  |
| `check`                          | Розшардований еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, що стосуються Node            |
| `check-additional`               | Архітектурні, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, що стосуються Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, що стосуються Node            |
| `checks`                         | Верифікатор для built-artifact channel tests плюс сумісність з Node 22 лише для push         | Зміни, що стосуються Node            |
| `check-docs`                     | Форматування docs, lint і перевірки битих посилань                                           | Docs змінено                         |
| `skills-python`                  | Ruff + pytest для Python-backed Skills                                                       | Зміни, що стосуються Python Skills   |
| `checks-windows`                 | Windows-специфічні тестові смуги                                                             | Зміни, що стосуються Windows         |
| `macos-node`                     | Смуга TypeScript-тестів на macOS із використанням спільних built artifacts                   | Зміни, що стосуються macOS           |
| `macos-swift`                    | Swift lint, збірка та тести для застосунку macOS                                             | Зміни, що стосуються macOS           |
| `android`                        | Android unit-тести для обох flavor плюс одна debug APK build                                 | Зміни, що стосуються Android         |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх main CI або ручний запуск      |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускаються дорогі:

1. `preflight` визначає, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих завдань артефактів і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, лише-PR `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни CI workflow перевіряють граф Node CI і lint для workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні смуги залишаються прив’язаними до змін у коді відповідних платформ.
Перевірки Windows Node прив’язані до Windows-специфічних обгорток process/path, допоміжних засобів npm/pnpm/UI runner, конфігурації package manager і поверхонь CI workflow, які запускають цю смугу; непов’язані зміни у вихідному коді, plugin, install-smoke і лише тестах залишаються на Linux Node-смугах, щоб не резервувати Windows worker на 16 vCPU для покриття, яке вже забезпечується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, що стосуються install, packaging, контейнерів, production-змін bundled extension і поверхонь core plugin/channel/gateway/Plugin SDK, які використовують завдання Docker smoke. Зміни лише в тестах і лише в docs не резервують Docker workers. Його QR package smoke змушує шар Docker `pnpm install` виконуватися повторно, зберігаючи кеш BuildKit pnpm store, тож він усе одно перевіряє встановлення без повторного завантаження залежностей при кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах цього завдання, тож додає реальне покриття WebSocket контейнер-до-контейнера без додавання ще однієї Docker-збірки. Локальна команда `test:docker:all` попередньо збирає один спільний live-test image і один спільний image зібраного застосунку `scripts/e2e/Dockerfile`, а потім запускає смуги live/E2E паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте стандартний паралелізм 4 через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегат за замовчуванням припиняє планувати нові pooled lanes після першої помилки, і кожна смуга має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Смуги, чутливі до startup або provider, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний workflow live/E2E віддзеркалює патерн спільного image, збираючи й публікуючи один Docker E2E image із SHA-тегом у GHCR перед Docker matrix, а потім запускаючи матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker-набір за шляхом релізу. Docker-тести QR та installer зберігають власні Dockerfile, орієнтовані на встановлення. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin з тайм-аутом команди 120 секунд: setup-entry repair залежностей плюс синтетична ізоляція збоїв bundled-loader. Повна матриця bundled update/channel залишається ручною/для повного набору, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка платформна область дії CI: зміни core production запускають core prod typecheck плюс core tests, зміни лише core test запускають лише core test typecheck/tests, зміни extension production запускають extension prod typecheck плюс extension tests, а зміни лише extension test запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на extension, оскільки extension залежать від цих core contracts. Зміни лише в метаданих релізу для version bump запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять виконання на всі смуги.

Для push матриця `checks` додає смугу `compat-node22`, що запускається лише для push. Для pull request ця смуга пропускається, а матриця залишається зосередженою на звичайних тестових/channel-смугах.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts виконуються у трьох зважених shards, тести bundled plugin збалансовані між шістьма extension worker-ами, невеликі core unit lanes попарно об’єднані, auto-reply виконується на трьох збалансованих worker-ах замість шести крихітних, а agentic gateway/plugin configs розподілено по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та miscellaneous plugin-тести використовують свої окремі конфігурації Vitest замість спільного універсального plugin catch-all. Завдання extension shards запускають групи plugin config послідовно з одним worker-ом Vitest і більшим heap Node, щоб пакети plugin із великим обсягом імпортів не перевантажували невеликі CI runner-и. Широка agents lane використовує спільний файлопаралельний планувальник Vitest, оскільки в ній домінують імпорти/планування, а не один окремий повільний тестовий файл. `runtime-config` виконується разом із shard `infra core-runtime`, щоб спільний runtime shard не затримував завершення. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви check як легкі завдання-верифікатори та уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його смуга unit-тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дублювання завдання пакування debug APK для кожного push, що стосується Android.
`extension-fast` є лише для PR, оскільки push-запуски вже виконують повні shard-и bundled plugin. Це зберігає швидкий зворотний зв’язок для changed-plugin під час рев’ю без резервування додаткового Blacksmith worker-а на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати заміщені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо лише найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard checks використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні збої shard-ів, але не ставали в чергу після того, як увесь workflow уже було заміщено.
Ключ конкурентності CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски `main`.

## Runner-и

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security-завдання та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, шардовані перевірки channel contract, shards `check`, окрім lint, shards і агрегати `check-additional`, aggregate verifiers Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували більше, ніж дали вигоди; Docker-збірки install-smoke, де вартість часу очікування 32-vCPU була вищою за вигоду                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # збірка dist, коли важливі смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумок wall time, queue time і найповільніших jobs
node scripts/ci-run-timings.mjs --recent 10   # порівняння нещодавніх успішних запусків main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
