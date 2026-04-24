---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмежувальні перевірки за обсягом змін і локальні еквіваленти команд
title: конвеєр CI
x-i18n:
    generated_at: "2026-04-24T04:11:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 768f942c9624ba2339f31945dea73dea9488ac37c814b72d50c3485efe12596b
    source_path: ci.md
    workflow: 15
---

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне обмеження за обсягом змін, щоб пропускати дорогі завдання, коли змінено лише нерелевантні ділянки.

QA Lab має окремі смуги CI поза межами основного workflow з розумним обмеженням. Workflow `Parity gate` запускається для відповідних змін у PR і через ручний запуск; він збирає приватне середовище виконання QA та порівнює агентні пакети mock GPT-5.4 і Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний запуск; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а смуга Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі смуги QA Lab перед погодженням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників, призначений для очищення дублікатів після приземлення змін. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати стан у GitHub, він перевіряє, що приземлений PR змерджено і що кожен дублікат має або спільне згадане issue, або перекривні змінені hunks.

Workflow `Docs Agent` — це lane обслуговування Codex, що запускається за подіями, для підтримання наявної документації у відповідності до нещодавно приземлених змін. Він не має окремого запуску за розкладом: його може запустити успішний CI run після push до `main`, якщо він не від бота, а також його можна запустити напряму вручну. Виклики через workflow-run пропускаються, якщо `main` уже пішов уперед або якщо інший непропущений run Docs Agent був створений протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA для Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни в `main`, накопичені з часу останнього проходу документації.

Workflow `Test Performance Agent` — це lane обслуговування Codex, що запускається за подіями, для повільних тестів. Він не має окремого запуску за розкладом: його може запустити успішний CI run після push до `main`, якщо він не від бота, але він пропускається, якщо інший виклик через workflow-run уже відпрацював або виконується в той самий день UTC. Ручний запуск обходить це добове обмеження активності. Lane збирає звіт повного набору Vitest з групуванням за продуктивністю, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а підсумковий звіт повного набору після агента має бути успішним, перш ніж щось буде закомічено. Коли `main` просувається вперед до того, як bot push буде приземлено, lane перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює спробу push; конфліктні застарілі patch пропускаються. Він використовує Ubuntu від GitHub-hosted, щоб дія Codex могла зберігати ту саму безпечну модель без `sudo`, що й docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Виявляє зміни лише в docs, змінені області, змінені extensions і формує маніфест CI         | Завжди для не-draft push і PR        |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для не-draft push і PR        |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisories з npm                              | Завжди для не-draft push і PR        |
| `security-fast`                  | Обов’язковий агрегат для швидких security-завдань                                            | Завжди для не-draft push і PR        |
| `build-artifacts`                | Збірка `dist/`, Control UI, built-artifact перевірки та повторно використовувані downstream artifacts | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, такі як bundled/plugin-contract/protocol перевірки           | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Розшардовані перевірки channel contract зі стабільним агрегованим результатом перевірки      | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extensions                               | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди основних тестів Node, без channel, bundled, contract і extension lane                  | Зміни, релевантні для Node           |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                          | Pull request зі змінами в extensions |
| `check`                          | Розшардований еквівалент основної локальної перевірки: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`               | Архітектурні, boundary, extension-surface guards, package-boundary і gateway-watch shard     | Зміни, релевантні для Node           |
| `build-smoke`                    | Built-CLI smoke-тести та smoke-тести пам’яті під час запуску                                 | Зміни, релевантні для Node           |
| `checks`                         | Перевірник для channel-тестів built-artifact плюс сумісність Node 22 лише для push           | Зміни, релевантні для Node           |
| `check-docs`                     | Форматування docs, lint і перевірки зламаних посилань                                        | Змінено docs                         |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Специфічні для Windows тестові смуги                                                         | Зміни, релевантні для Windows        |
| `macos-node`                     | Смуга TypeScript-тестів на macOS із використанням спільних built artifacts                   | Зміни, релевантні для macOS          |
| `macos-swift`                    | Lint, build і тести Swift для застосунку macOS                                               | Зміни, релевантні для macOS          |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні для Android        |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                         | Успіх main CI або ручний запуск      |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не очікуючи важчих artifact- і platform-matrix-завдань.
3. `build-artifacts` перекривається з швидкими Linux-смугами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі platform- і runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за обсягом змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI разом із linting workflow, але самі по собі не змушують запускати нативні збірки Windows, Android або macOS; ці platform lanes залишаються обмеженими змінами у вихідному коді відповідної платформи.
Перевірки Windows Node обмежуються специфічними для Windows обгортками process/path, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями workflow CI, які запускають цю смугу; нерелевантні зміни у вихідному коді, plugin, install-smoke і зміни лише в тестах залишаються в Linux Node lanes, щоб не резервувати Windows worker на 16 vCPU для покриття, яке вже забезпечується звичайними test shards.
Окремий workflow `install-smoke` не є gate для PR або push до `main`. Він запускається один раз на день за розкладом, може бути запущений вручну і повторно використовується перевірками релізу через `workflow_call`. Запуски за розкладом і через release-call виконують повний шлях install smoke: імпорт пакета QR, root Dockerfile CLI smoke, gateway-network e2e, bundled extension build-arg smoke, installer Docker/update coverage, обмежений профіль Docker для bundled-plugin і smoke для глобального встановлення Bun image-provider, коли це ввімкнено. Для pull request слід використовувати основні смуги CI і цільове локальне підтвердження через Docker замість очікування `install-smoke`. QR- і installer Docker-тести зберігають власні install-орієнтовані Dockerfile. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один shared built-app image з `scripts/e2e/Dockerfile`, а потім паралельно запускає live/E2E smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`; стандартний рівень паралелізму 4 можна налаштувати через `OPENCLAW_DOCKER_ALL_PARALLELISM`. За замовчуванням локальний агрегат припиняє планувати нові pooled lanes після першого збою, а кожна lane має timeout у 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Смуги, чутливі до запуску або провайдера, виконуються ексклюзивно після паралельного пулу. Повторно використовуваний live/E2E workflow віддзеркалює шаблон shared-image: перед Docker matrix він збирає й публікує один Docker E2E image у GHCR з тегом SHA, а потім запускає matrix з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований live/E2E workflow щодня запускає повний релізний набір Docker-тестів. Повна matrix для bundled update/channel залишається ручною/full-suite, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широке обмеження платформ у CI: зміни в core production запускають core prod typecheck плюс core tests, зміни лише в core tests запускають лише core test typecheck/tests, зміни в extension production запускають extension prod typecheck плюс extension tests, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extensions, оскільки extensions залежать від цих core contracts. Зміни лише в release metadata version bumps запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config у безпечному режимі спрямовуються на всі смуги.

Під час push matrix `checks` додає lane `compat-node22`, який запускається лише для push. Для pull request ця lane пропускається, і matrix залишається зосередженою на звичайних test/channel lanes.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: channel contracts запускаються як три зважені shard-и, тести bundled plugins балансуються між шістьма worker-ами extension, невеликі core unit lanes поєднуються в пари, auto-reply виконується як три збалансовані worker-и замість шести крихітних worker-ів, а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування на built artifacts. Широкі browser, QA, media та різні plugin-тести використовують свої окремі конфігурації Vitest замість спільного універсального набору для plugins. Завдання shard-ів extension послідовно запускають групи конфігурацій plugin з одним worker-ом Vitest і більшим Node heap, щоб партії plugins з великим обсягом імпортів не перевантажували невеликі CI runner-и. Широка смуга agents використовує спільний file-parallel scheduler Vitest, тому що в ній домінують імпорти/планування, а не один повільний test file. `runtime-config` виконується разом із shard-ом infra core-runtime, щоб спільний runtime shard не залишався власником хвоста. `check-additional` тримає разом compile/canary-роботи для package-boundary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard паралельно запускає свої невеликі незалежні guards усередині одного завдання. Gateway watch, channel-тести та shard core support-boundary виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої старі назви перевірок як легковагові verifier-завдання, але уникаючи двох додаткових Blacksmith worker-ів і другої черги для споживачів artifacts.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Для flavor third-party немає окремого source set чи manifest; його смуга unit-тестів однаково компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK під час кожного push, релевантного для Android.
`extension-fast` призначено лише для PR, тому що push-запуски вже виконують повні shard-и тестів bundled plugins. Це зберігає швидкий зворотний зв’язок для змінених plugins під час рев’ю, не резервуючи додатковий Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший run для того самого ref також не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні збої shard-ів, але не ставали в чергу після того, як увесь workflow уже було замінено новішим.
Ключ concurrency для CI має версіонування (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски `main`.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security-завдання й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, розшардовані перевірки channel contract, shard-и `check`, окрім lint, shard-и та агрегати `check-additional`, aggregate verifier-и Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла раніше ставати в чергу |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard-и Linux Node-тестів, shard-и тестів bundled plugins, `android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який досі настільки чутливий до CPU, що 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував більше, ніж давав вигоди                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; fork-и переходять на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; fork-и переходять на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + зламані посилання
pnpm build          # збирає dist, коли мають значення CI artifact/build-smoke lanes
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі та найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски main CI
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали релізів](/uk/install/development-channels)
