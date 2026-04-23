---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T02:17:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5ba3c27be0b27e90ab490170be2570ab746f3c4805cf08726fe501300887e4d
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному пуші в `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для недрафтових пушів і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових пушів і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі advisory npm                             | Завжди для недрафтових пушів і PR    |
| `security-fast`                  | Обов’язковий агрегований результат для швидких завдань безпеки                               | Завжди для недрафтових пушів і PR    |
| `build-artifacts`                | Збирає `dist/`, Control UI, спостереження gateway і повторно використовувані downstream-артефакти | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі Linux-ланки перевірки коректності, такі як bundled/plugin-contract/protocol checks    | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору розширень                             | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шардовані core Node тести, за винятком ланок каналів, bundled, контрактів і розширень        | Зміни, релевантні для Node           |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request із змінами розширень    |
| `check`                          | Шардований еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`               | Архітектурні, boundary, extension-surface guards, package-boundary і шардовані gateway-watch | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke startup-memory                                             | Зміни, релевантні для Node           |
| `checks`                         | Решта Linux Node-ланок: тести каналів і сумісність Node 22 лише для пушів                    | Зміни, релевантні для Node           |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Змінено документацію                 |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Специфічні для Windows тестові ланки                                                         | Зміни, релевантні для Windows        |
| `macos-node`                     | Ланка тестів TypeScript на macOS з використанням спільних зібраних артефактів                | Зміни, релевантні для macOS          |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                              | Зміни, релевантні для macOS          |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні для Android        |

## Порядок швидкого завершення з помилкою

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань із артефактами та платформеною матрицею.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб downstream-споживачі могли стартувати, щойно спільна збірка готова.
4. Після цього розгалужуються важчі платформені та runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін знаходиться в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни CI workflow перевіряють Node CI graph разом із lint workflow, але самі по собі не змушують запускати нативні збірки Windows, Android або macOS; ці платформені ланки й надалі обмежуються змінами у вихідному коді відповідних платформ.
Windows Node checks обмежені Windows-специфічними process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які запускають цю ланку; не пов’язані зміни у вихідному коді, plugin, install-smoke і зміни лише в тестах залишаються в Linux Node-ланках, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, релевантних для встановлення, пакування, контейнерів, production-змін bundled extension, а також core-поверхонь plugin/channel/gateway/Plugin SDK, які перевіряються Docker smoke-завданнями. Зміни лише в тестах і документації не резервують Docker workers. Його smoke для QR package примусово перезапускає шар Docker `pnpm install`, зберігаючи кеш BuildKit pnpm store, тому він усе одно перевіряє встановлення без повторного завантаження залежностей при кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах цього завдання, тож додає реальне покриття WebSocket між контейнерами без додаткової Docker-збірки. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin із timeout команди 120 секунд: repair залежностей setup-entry плюс ізоляція синтетичних збоїв bundled-loader. Повна матриця оновлень bundled і каналів залишається ручною/для повного набору, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка CI-область платформ: production-зміни core запускають core prod typecheck плюс core тести, зміни лише в core tests запускають лише core test typecheck/tests, production-зміни extension запускають extension prod typecheck плюс extension тести, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, тому що розширення залежать від цих core-контрактів. Зміни лише в release metadata/version bumps запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно розширюються до всіх ланок.

Для пушів матриця `checks` додає ланку `compat-node22`, яка запускається лише для пушів. Для pull request ця ланка пропускається, і матриця зосереджується на звичайних test/channel-ланках.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів ділять coverage реєстру й core на шість зважених shard, bundled plugin тести балансуються між шістьма extension workers, auto-reply працює як три збалансовані workers замість шести крихітних workers, а agentic-конфігурації gateway/plugin розподілені між наявними source-only agentic Node jobs замість очікування зібраних артефактів. Широкі browser, QA, media і miscellaneous plugin тести використовують свої спеціалізовані конфігурації Vitest замість спільного plugin catch-all. Широка agents-ланка використовує спільний планувальник file-parallel Vitest, тому що в ній домінують імпорти й планування, а не один повільний тестовий файл. `runtime-config` запускається разом із infra core-runtime shard, щоб спільний runtime shard не залишався найдовшим. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює архітектуру runtime topology від gateway watch coverage; shard boundary guard виконує свої невеликі незалежні guards паралельно всередині одного завдання, а регресія gateway watch виконується всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, щоб вимірювати стабільність watch без резервування ще одного runner або повторної збірки runtime-артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його ланка unit-тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK при кожному Android-релевантному пуші.
`extension-fast` є лише для PR, тому що при пушах уже виконуються повні шардовані bundled plugin тести. Це зберігає швидкий зворотний зв’язок щодо змінених plugin для рев’ю, не резервуючи додатковий Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший пуш потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref теж не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже був замінений новішим.
Ключ concurrency у CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій queue group не міг безстроково блокувати новіші запуски для main.

## Runner-и

| Runner | Завдання |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, shard `check`, крім lint, shard і агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu від GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`, build-smoke, shard Linux Node-тестів, shard bundled plugin-тестів, решта споживачів built-artifact, `android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж давали економію; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав економію |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `macos-node` у `openclaw/openclaw`; форки повертаються до `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; форки повертаються до `macos-latest` |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + зламані посилання
pnpm build          # зібрати dist, коли важливі ланки CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час у черзі та найповільніші завдання
```
