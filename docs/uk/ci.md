---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T02:06:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cdc69642539ec9f647f773c83ec17b0683259c6995d2f79794528929a9b65a1
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише непов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в документації, змінені області дії, змінені розширення та збирає маніфест CI | Завжди для push і PR, що не є чернетками |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR, що не є чернетками |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm                               | Завжди для push і PR, що не є чернетками |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для push і PR, що не є чернетками |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для наступних завдань | Зміни, релевантні для Node           |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, такі як bundled/plugin-contract/protocol перевірки | Зміни, релевантні для Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, релевантні для Node           |
| `checks-node-core-test`          | Шарди основних Node-тестів, без етапів каналів, bundled, контрактів і розширень             | Зміни, релевантні для Node           |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                              | Pull request зі змінами в розширеннях |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node           |
| `check-additional`               | Шарди для architecture, boundary, extension-surface guards, package-boundary і gateway-watch | Зміни, релевантні для Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                          | Зміни, релевантні для Node           |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                    | Зміни, релевантні для Node           |
| `check-docs`                     | Перевірки форматування документації, lint і битих посилань                                   | Змінено документацію                 |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні для Python Skills  |
| `checks-windows`                 | Специфічні для Windows етапи тестування                                                      | Зміни, релевантні для Windows        |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів               | Зміни, релевантні для macOS          |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                              | Зміни, релевантні для macOS          |
| `android`                        | Android unit-тести для обох flavor і одна збірка debug APK                                   | Зміни, релевантні для Android        |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни у workflow CI перевіряють Node CI graph і lint workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні етапи залишаються прив’язаними до змін у коді відповідних платформ.
Перевірки Windows Node обмежені Windows-специфічними process/path wrapper, npm/pnpm/UI runner helper, конфігурацією package manager і поверхнями CI workflow, які виконують цей етап; непов’язані зміни вихідного коду, plugin, install-smoke і лише тестові зміни залишаються на Linux Node-етапах, щоб не займати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними test shard.
Окремий workflow `install-smoke` повторно використовує той самий script області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, релевантних install, packaging, контейнерам, production changes у bundled extension і поверхням core plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише в тестах і документації не займають Docker worker. Його QR package smoke примусово перезапускає шар Docker `pnpm install`, зберігаючи кеш BuildKit pnpm store, тому він усе ще перевіряє встановлення без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тому додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin із тайм-аутом команди 120 секунд: repair залежностей setup-entry плюс ізоляція synthetic bundled-loader failure. Повна матриця bundled update/channel залишається ручною/для повного набору, оскільки виконує повторювані реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо меж архітектури, ніж широка область дії платформ у CI: зміни у production core запускають core prod typecheck плюс core tests, зміни лише в core tests запускають лише core test typecheck/tests, зміни у production extension запускають extension prod typecheck плюс extension tests, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension validation, оскільки розширення залежать від цих core-контрактів. Підвищення версії лише в release metadata запускає точкові перевірки version/config/root-dependency. Невідомі зміни в root/config переводять виконання в безпечний режим із запуском усіх етапів.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця зосереджується на звичайних test/channel-етапах.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на шість зважених shard загалом, тести bundled plugin балансуються між шістьма worker для extension, auto-reply працює як три збалансовані worker замість шести дрібних worker, а agentic-конфігурації gateway/plugin розподіляються по наявних source-only agentic Node jobs, замість очікування на зібрані артефакти. Широкі тести browser, QA, media та miscellaneous plugin використовують свої окремі конфігурації Vitest замість спільного загального plugin catch-all. Широкий етап agents використовує спільний планувальник паралельності файлів Vitest, оскільки в ньому домінують імпорти/планування, а не окремий повільний тестовий файл. `runtime-config` виконується разом із shard `infra core-runtime`, щоб спільний runtime shard не залишався останнім вузьким місцем. `check-additional` тримає разом compile/canary-роботи package-boundary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання, а регресія gateway watch повторно використовує tar-артефакт `dist/` і `dist-runtime/`, зібраний у цьому ж запуску завданням `build-artifacts`, щоб вимірювати стабільність watch без повторної збірки runtime-артефактів у власному worker.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set чи manifest; його етап unit-тестів усе одно компілює цей flavor з прапорами BuildConfig для SMS/call-log, уникаючи дубльованого завдання пакування debug APK для кожного Android-релевантного push.
`extension-fast` запускається лише для PR, оскільки push already execute повні шарди bundled plugin. Це зберігає швидкий зворотний зв’язок щодо змінених plugin під час review, не займаючи додатковий Blacksmith worker у `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref теж не завершується з помилкою. Агреговані shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже був витіснений новішим.
Ключ concurrency CI має версію (`CI-v7-*`), щоб zombie-процес на боці GitHub у старій queue group не міг безстроково блокувати новіші запуски `main`.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегатори `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж давали вигоду; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                         |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли мають значення етапи CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час очікування в черзі та найповільніші завдання
```
