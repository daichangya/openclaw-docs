---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T21:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d2aa581f173b7171373a9292cef3da20621b845d81a8550bd8b4c8e743d27a4b
    source_path: ci.md
    workflow: 15
---

CI запускається для кожного push до `main` і кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

QA Lab має окремі CI-лінії поза основним workflow з розумним визначенням області. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний dispatch; він збирає приватне QA runtime і порівнює agentic pack-и mock GPT-5.4 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram lane використовує lease-и Convex. `OpenClaw Release Checks` також запускає ті самі лінії QA Lab перед затвердженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників для очищення дублікатів після злиття. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що злитий PR справді об’єднано, і що кожен дублікат має або спільну пов’язану issue, або перетин змінених hunks.

Workflow `Test Performance Agent` — це event-driven лінія обслуговування Codex для повільних тестів. Вона не має окремого розкладу: її може запустити успішний неблокований push CI на `main`, але вона пропускається, якщо того ж дня за UTC вже був або виконується інший виклик workflow-run. Ручний dispatch обходить це денне обмеження активності. Лінія збирає grouped Vitest performance report для повного набору тестів, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору тестів і відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а after-agent звіт для повного набору тестів має пройти, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push буде застосовано, лінія перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; застарілі patch-і з конфліктами пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну політику drop-sudo, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в docs, змінені області, змінені extensions і будує CI manifest         | Завжди для недрафтових push і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                  | Завжди для недрафтових push і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для недрафтових push і PR    |
| `security-fast`                  | Обов’язковий агрегатор для швидких security-завдань                                          | Завжди для недрафтових push і PR    |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки      | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extensions                              | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шарди основних Node-тестів, без channel, bundled, contract і extension-ліній                | Зміни, релевантні для Node          |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request-и зі змінами extensions |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Шарди для архітектури, меж, extension-surface guards, package-boundary і gateway-watch      | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести built-CLI і smoke стартової пам’яті                                              | Зміни, релевантні для Node          |
| `checks`                         | Верифікатор для built-artifact тестів каналів плюс сумісність Node 22 лише для push         | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування docs, lint і перевірки битих посилань                                           | Змінено docs                        |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові лінії                                                         | Зміни, релевантні для Windows       |
| `macos-node`                     | Лінія TypeScript-тестів для macOS з використанням спільних built artifacts                   | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, релевантні для macOS         |
| `android`                        | Android unit-тести для обох flavor-ів плюс одна debug APK збірка                             | Зміни, релевантні для Android       |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успішний CI на main або ручний dispatch |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих artifact- і platform matrix-завдань.
3. `build-artifacts` перекривається з швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі platform- і runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` лише для PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють Node CI graph плюс lint workflow, але самі по собі не примушують запускати нативні збірки для Windows, Android або macOS; ці platform-лінії залишаються прив’язаними до змін у коді відповідної платформи.
Перевірки Windows Node прив’язані до специфічних для Windows process/path wrappers, npm/pnpm/UI runner helpers, конфігурації package manager і поверхонь CI workflow, які виконують цю лінію; не пов’язані зміни вихідного коду, plugins, install-smoke і зміни лише тестів залишаються на Linux Node-лініях, щоб не резервувати Windows worker на 16 vCPU для покриття, яке вже перевіряється звичайними test shard-ами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення області через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, пов’язаних з установленням, пакуванням, контейнерами, production-змін bundled extension, а також для поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише тестів і лише docs не резервують Docker workers. Його QR package smoke примушує Docker-шар `pnpm install` виконатися повторно, водночас зберігаючи кеш BuildKit pnpm store, тож установка все одно перевіряється без повторного завантаження залежностей у кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Локально `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image з `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke-лінії паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; стандартний рівень паралелізму 4 можна налаштувати через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегатор за замовчуванням припиняє планувати нові pooled lanes після першого збою, а кожна лінія має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Лінії, чутливі до запуску або provider-ів, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний live/E2E workflow відтворює шаблон спільного image, збираючи й публікуючи один SHA-tagged GHCR Docker E2E image перед Docker matrix, а потім запускає matrix з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований live/E2E workflow щодня запускає повний релізний Docker-набір. QR і installer Docker-тести зберігають власні Dockerfile, орієнтовані на встановлення. Окреме завдання `docker-e2e-fast` запускає обмежений профіль bundled-plugin у Docker з тайм-аутом команди 120 секунд: repair залежностей setup-entry плюс synthetic bundled-loader failure isolation. Повна matrix для оновлення bundled і channel залишається ручною/для повного набору, оскільки виконує повторні реальні проходи `npm update` і `doctor repair`.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка platform-область у CI: production-зміни core запускають production typecheck core плюс тести core, зміни лише test-коду core запускають лише typecheck/tests для тестів core, production-зміни extensions запускають production typecheck extensions плюс тести extensions, а зміни лише test-коду extensions запускають лише typecheck/tests для тестів extensions. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extensions, тому що extensions залежать від цих core-контрактів. Версійні зміни лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять у всі лінії.

Для push matrix `checks` додає лінію `compat-node22`, що запускається лише для push. Для pull request-ів ця лінія пропускається, і matrix залишається зосередженою на звичайних test/channel-лініях.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти каналів виконуються як три зважені шарди, тести bundled plugin розподіляються між шістьма worker-ами extension, малі core unit-лінії об’єднуються в пари, auto-reply працює на трьох збалансованих worker-ах замість шести дрібних, а конфігурації agentic gateway/plugin розподіляються по наявних source-only agentic Node-завданнях замість очікування built artifacts. Широкі browser-, QA-, media- та miscellaneous plugin-тести використовують свої виділені конфігурації Vitest замість спільного універсального plugin-набору. Завдання shard-ів extensions запускають групи конфігурацій plugin послідовно з одним Vitest worker-ом і більшим Node heap, щоб import-інтенсивні пакети plugin-ів не перевантажували малі CI runner-и. Широка лінія agents використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують import-и/планування, а не один повільний тестовий файл. `runtime-config` виконується разом із shard-ом infra core-runtime, щоб спільний runtime-shard не утримував tail. `check-additional` тримає package-boundary compile/canary-перевірки разом і відокремлює runtime topology architecture від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guard-и паралельно в межах одного завдання. Gateway watch, channel-тести та shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано, зберігаючи свої старі назви перевірок як легкі verifier-завдання та водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги artifact-consumer.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює цей flavor із прапорцями SMS/call-log BuildConfig, водночас уникаючи дубльованого завдання пакування debug APK при кожному Android-релевантному push.

`extension-fast` доступний лише для PR, оскільки push-запуски вже виконують повні шарди bundled plugin. Це зберігає зворотний зв’язок для змінених plugin-ів під час review без резервування додаткового Blacksmith worker-а на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже був замінений.

Ключ concurrency CI має версіонування (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій queue group не міг безстроково блокувати новіші запуски `main`.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security-завдання й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, aggregate verifier-и Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і надалі достатньо чутливий до CPU, так що 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де вартість часу очікування 32-vCPU перевищувала виграш                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork-ів відбувається fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork-ів відбувається fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guard-и
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # зібрати dist, коли важливі CI artifact/build-smoke лінії
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```
