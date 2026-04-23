---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження області, і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T18:24:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 089e7b4dc59bf11ad643ced552537b761da62314717a15b7971e2abc7053a38b
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push у `main` і для кожного pull request. Він використовує розумне обмеження області, щоб пропускати дорогі завдання, коли змінено лише непов’язані частини.

QA Lab має окремі смуги CI поза основним workflow з розумним обмеженням області. Workflow `Parity gate` запускається для відповідних змін у PR і через manual dispatch; він збирає приватне середовище виконання QA і порівнює агентні набори mock GPT-5.4 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram lane використовує Convex leases. `OpenClaw Release Checks` також запускає ті самі смуги QA Lab перед схваленням релізу.

Workflow `Duplicate PRs After Merge` — це ручний workflow для супровідників для очищення дублікатів після приземлення змін. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перш ніж змінювати GitHub, він перевіряє, що приземлений PR злитий, і що кожен дублікат має або спільний згаданий issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в docs, змінені області, змінені extensions і будує маніфест CI          | Завжди для non-draft push і PR       |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR       |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                   | Завжди для non-draft push і PR       |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                            | Завжди для non-draft push і PR       |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built artifacts і багаторазово використовувані downstream artifacts | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі correctness-смуги Linux, такі як bundled/plugin-contract/protocol checks              | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів channel зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled plugin у всьому наборі extension                                  | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди тестів core Node, за винятком смуг channel, bundled, contract та extension             | Зміни, релевантні для Node           |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugin                                           | Pull request із змінами extension    |
| `check`                          | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node      |
| `check-additional`               | Architecture, boundary, guards поверхні extension, package-boundary та шарди gateway-watch   | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка startup-memory                                   | Зміни, релевантні для Node           |
| `checks`                         | Верифікатор для built-artifact тестів channel плюс compat-напрям Node 22 лише для push       | Зміни, релевантні для Node           |
| `check-docs`                     | Форматування docs, lint і перевірки зламаних посилань                                        | Змінено docs                         |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Специфічні для Windows тестові смуги                                                         | Зміни, релевантні для Windows        |
| `macos-node`                     | Смуга тестів TypeScript на macOS з використанням спільних built artifacts                    | Зміни, релевантні для macOS          |
| `macos-swift`                    | Lint, build і тести Swift для застосунку macOS                                               | Зміни, релевантні для macOS          |
| `android`                        | Юніт-тести Android для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні для Android        |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко без очікування важчих завдань артефактів і платформених матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли стартувати, щойно спільна збірка готова.
4. Після цього розгалужуються важчі платформені та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` лише для PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформені смуги залишаються обмеженими змінами у вихідному коді відповідних платформ.
Перевірки Windows Node обмежені специфічними для Windows обгортками process/path, допоміжними засобами для npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, що виконують цю смугу; непов’язані зміни вихідного коду, plugin, install-smoke і лише тестів залишаються в Linux Node smугам, щоб не резервувати Windows worker на 16 vCPU для покриття, яке вже виконується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тож Docker/install smoke запускається для змін, пов’язаних з install, packaging, контейнерами, production-змін bundled extension, а також для поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише тестів і лише docs не резервують Docker workers. Його smoke QR package змушує шар Docker `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож він усе одно перевіряє встановлення без повторного завантаження залежностей при кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тож додає реальне покриття WebSocket контейнер-до-контейнера без додавання ще однієї Docker build. Локальний `test:docker:all` попередньо збирає один спільний live-test image і один спільний built-app image `scripts/e2e/Dockerfile`, а потім запускає live/E2E smoke-смуги паралельно з `OPENCLAW_SKIP_DOCKER_BUILD=1`; налаштовуйте стандартний паралелізм 4 через `OPENCLAW_DOCKER_ALL_PARALLELISM`. Локальний агрегатор за замовчуванням припиняє планувати нові pooled-smуги після першої помилки, а кожна смуга має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Смуги, чутливі до startup або provider, виконуються ексклюзивно після паралельного пулу. Багаторазово використовуваний live/E2E workflow повторює шаблон спільного image, збираючи й публікуючи один GHCR Docker E2E image з тегом SHA перед Docker matrix, а потім запускає matrix з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Запланований live/E2E workflow щодня запускає повний Docker suite шляху релізу. Docker-тести QR та installer зберігають власні install-орієнтовані Dockerfile. Окреме завдання `docker-e2e-fast` запускає обмежений профіль Docker для bundled plugin з тайм-аутом команди 120 секунд: відновлення залежностей setup-entry плюс ізоляція синтетичного збою bundled-loader. Повна матриця bundled update/channel залишається ручною/повним набором, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широка платформена область CI: production-зміни core запускають перевірку типів core prod плюс тести core, зміни лише тестів core запускають лише перевірку типів/тести core test, production-зміни extension запускають перевірку типів extension prod плюс тести extension, а зміни лише тестів extension запускають лише перевірку типів/тести extension test. Зміни публічного Plugin SDK або plugin-contract розширюють перевірку на extension, тому що extension залежать від цих контрактів core. Підвищення версії лише в метаданих релізу запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config безпечно переводять до всіх смуг.

Для push матриця `checks` додає смугу `compat-node22`, яка запускається лише для push. Для pull request ця смуга пропускається, і матриця залишається зосередженою на звичайних test/channel смугах.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти channel запускаються в трьох зважених shards, тести bundled plugin балансуються між шістьма worker-ами extension, малі core unit-смуги поєднані в пари, auto-reply запускається на трьох збалансованих worker-ах замість шести дрібних worker-ів, а конфігурації agentic gateway/plugin розподілені по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser-, QA-, media- і miscellaneous plugin-тести використовують власні конфігурації Vitest замість спільного plugin catch-all. Завдання shard extension можуть запускати дві групи конфігурацій plugin одночасно, але обмежують кожну конфігурацію Vitest одним worker-ом, щоб важкі за імпортом пакети plugin не перевантажували малі CI runner-и. Широка agents-смуга використовує спільний Vitest file-parallel scheduler, тому що в ній домінують імпорт і планування, а не один повільний тестовий файл. `runtime-config` запускається разом із shard infra core-runtime, щоб спільний runtime shard не залишався хвостом. `check-additional` тримає package-boundary compile/canary-роботи разом і відокремлює архітектуру topology runtime від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви перевірок як легкі verifier jobs, водночас уникаючи двох додаткових Blacksmith worker-ів і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його смуга unit-тестів усе одно компілює цей flavor із прапорцями SMS/call-log у BuildConfig, водночас уникаючи дубльованого завдання пакування debug APK для кожного релевантного Android push.
`extension-fast` доступне лише для PR, тому що push-запуски вже виконують повні шарди bundled plugin. Це дає швидкий зворотний зв’язок щодо змінених plugin під час review без резервування додаткового Blacksmith worker-а на `main` для покриття, яке вже присутнє в `checks-node-extensions`.

GitHub може позначати заміщені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується з помилкою. Агреговані перевірки shards використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shards, але не стають у чергу після того, як увесь workflow уже було заміщено.
Ключ concurrency для CI має версію (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски `main`.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів channel, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu, розміщений на GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще достатньо чутливий до CPU, тож 8 vCPU коштували більше, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі на 32 vCPU коштував більше, ніж заощаджував                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + зламані посилання
pnpm build          # зібрати dist, коли важливі смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # підсумувати загальний час, час у черзі й найповільніші завдання
node scripts/ci-run-timings.mjs --recent 10   # порівняти нещодавні успішні запуски CI для main
```
