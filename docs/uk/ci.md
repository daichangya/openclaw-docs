---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T15:01:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне обмеження області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має окремі смуги CI поза основним робочим процесом із розумним обмеженням області. Робочий процес `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватне середовище виконання QA та порівнює агентні пакети mock GPT-5.4 і Opus 4.6. Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а смуга Telegram використовує Convex leases. `OpenClaw Release Checks` також запускає ті самі смуги QA Lab перед погодженням релізу.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначення змін лише в документації, змінених областей, змінених розширень і побудова маніфесту CI | Завжди для push і PR, що не є draft  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR, що не є draft  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для push і PR, що не є draft  |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для push і PR, що не є draft  |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і багаторазово використовуваних downstream-артефактів | Зміни, релевантні Node               |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні Node               |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні Node               |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                | Зміни, релевантні Node               |
| `checks-node-core-test`          | Шарди тестів core Node, без смуг каналів, bundled, contract і extension                      | Зміни, релевантні Node               |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request зі змінами в extension  |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, релевантні Node               |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | Зміни, релевантні Node               |
| `build-smoke`                    | Smoke-тести built-CLI і smoke перевірка пам’яті під час запуску                              | Зміни, релевантні Node               |
| `checks`                         | Верифікатор для channel-тестів built-artifact плюс сумісність Node 22 лише для push          | Зміни, релевантні Node               |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Документацію змінено                 |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні Python Skills      |
| `checks-windows`                 | Windows-специфічні тестові смуги                                                             | Зміни, релевантні Windows            |
| `macos-node`                     | Смуга тестів TypeScript на macOS з використанням спільних built artifacts                    | Зміни, релевантні macOS              |
| `macos-swift`                    | Lint, збірка та тести Swift для застосунку macOS                                             | Зміни, релевантні macOS              |
| `android`                        | Юніт-тести Android для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні Android            |

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита юніт-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни в workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не примушують виконувати нативні збірки Windows, Android або macOS; ці платформні смуги залишаються прив’язаними до змін у вихідному коді відповідних платформ.
Перевірки Windows Node обмежені специфічними для Windows обгортками процесів/шляхів, допоміжними засобами запуску npm/pnpm/UI runner, конфігурацією менеджера пакунків і поверхнями workflow CI, які виконують цю смугу; не пов’язані зміни у вихідному коді, plugin, install-smoke і зміни лише в тестах залишаються в Linux Node lanes, щоб не резервувати Windows worker на 16 vCPU для покриття, яке вже виконується звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, релевантних встановленню, пакуванню, контейнерам, production changes у bundled extension, а також для поверхонь core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише в тестах і лише в документації не резервують Docker workers. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тому інсталяція все одно перевіряється без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах цього завдання, тому додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Локальна команда `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image `scripts/e2e/Dockerfile`, а потім паралельно запускає live/E2E smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштуйте типову паралельність 4 через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегатор типово припиняє планувати нові pooled lanes після першої помилки, а кожна смуга має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Смуги, чутливі до запуску або провайдера, виконуються ексклюзивно після паралельного пулу. Багаторазово використовуваний workflow live/E2E відтворює шаблон shared-image: спочатку збирає і публікує один Docker E2E image із тегом SHA у GHCR перед матрицею Docker, а потім запускає матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований workflow live/E2E щодня запускає повний Docker-набір для release-path. Тести QR та installer Docker зберігають власні Dockerfile, орієнтовані на встановлення. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin з тайм-аутом команди 120 секунд: repair залежностей setup-entry плюс ізоляція синтетичної помилки bundled-loader. Повна матриця bundled update/channel залишається ручною/для повного набору, оскільки вона виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широка платформа області дії CI: зміни production у core запускають перевірку типів core prod плюс тести core, зміни лише в тестах core запускають лише перевірку типів/тести core test, зміни production у extension запускають перевірку типів extension prod плюс тести extension, а зміни лише в тестах extension запускають лише перевірку типів/тести extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension, оскільки extension залежать від цих контрактів core. Зміни лише в метаданих релізу з оновленням версій запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно призводять до запуску всіх смуг.

Для push матриця `checks` додає смугу `compat-node22`, яка запускається лише для push. Для pull request ця смуга пропускається, і матриця зосереджується на звичайних test/channel lanes.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів запускаються як три зважені шарди, тести bundled plugin балансуються між шістьма workers extension, малі core unit lanes об’єднані в пари, auto-reply виконується на трьох збалансованих workers замість шести малих workers, а agentic gateway/plugin configs розподілено між наявними agentic Node jobs лише для вихідного коду, замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої спеціалізовані конфігурації Vitest замість спільного універсального набору plugin. Широка смуга agents використовує спільний планувальник file-parallel Vitest, оскільки в ній домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard infra core-runtime, щоб спільний runtime shard не утримував хвіст виконання. `check-additional` тримає compile/canary роботу package-boundary разом і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard виконує свої малі незалежні guards паралельно в межах одного завдання. Gateway watch, channel tests і shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи їхні старі назви перевірок як легкі завдання-верифікатори та уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Варіант third-party не має окремого source set або manifest; його смуга юніт-тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK для кожного push, релевантного Android.
`extension-fast` є лише для PR, оскільки push-запуски вже виконують повні шарди bundled plugin. Це зберігає швидкий зворотний зв’язок щодо змінених plugin для рев’ю, не резервуючи додатковий Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб і далі повідомляти про звичайні помилки shard, але не ставали в чергу після того, як увесь workflow уже було витіснено новішим запуском.
Ключ конкурентності CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегатори `check-additional`, агрегатори-верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu на GitHub-hosted, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, так що 8 vCPU коштували дорожче, ніж дали виграш; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав виграш                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                        |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # той самий gate із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # збирає dist, коли важливі смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати wall time, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
```
