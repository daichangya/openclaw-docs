---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, перевірки області охоплення та еквіваленти локальних команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T02:35:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57d0979f7b6667b023b1ee4887003a8408cd0028a856abc02eb3ad684e9a8235
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області охоплення, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                | Коли запускається                    |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| `preflight`                      | Виявляє зміни лише в документації, змінені області охоплення, змінені extensions і збирає маніфест CI | Завжди для нечернеткових push і PR   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                | Завжди для нечернеткових push і PR   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                               | Завжди для нечернеткових push і PR   |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                           | Завжди для нечернеткових push і PR   |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, пов’язані з Node              |
| `checks-fast-core`               | Швидкі Linux-перевірки коректності, такі як bundled/plugin-contract/protocol checks        | Зміни, пов’язані з Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів channel із стабільним агрегованим результатом перевірки     | Зміни, пов’язані з Node              |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                              | Зміни, пов’язані з Node              |
| `checks-node-core-test`          | Шарди основних Node-тестів, без channel, bundled, contract та extension lanes              | Зміни, пов’язані з Node              |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                            | Pull request із змінами в extension  |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node              |
| `check-additional`               | Архітектурні, boundary, extension-surface guards, package-boundary і gateway-watch шарди   | Зміни, пов’язані з Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                             | Зміни, пов’язані з Node              |
| `checks`                         | Верифікатор для channel-тестів зібраних артефактів плюс сумісність Node 22 лише для push   | Зміни, пов’язані з Node              |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                              | Змінено документацію                 |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                    | Зміни, пов’язані зі Skills на Python |
| `checks-windows`                 | Специфічні для Windows набори тестів                                                       | Зміни, пов’язані з Windows           |
| `macos-node`                     | Набір TypeScript-тестів для macOS із використанням спільних зібраних артефактів            | Зміни, пов’язані з macOS             |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                            | Зміни, пов’язані з macOS             |
| `android`                        | Android unit-тести для обох flavors плюс одна збірка debug APK                             | Зміни, пов’язані з Android           |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux lanes, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформені та runtime lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка визначення області охоплення міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не змушують виконувати нативні збірки для Windows, Android або macOS; ці платформені lanes залишаються прив’язаними до змін у вихідному коді відповідної платформи.
Перевірки Windows Node прив’язані до специфічних для Windows обгорток process/path, helper’ів npm/pnpm/UI runner, конфігурації package manager і поверхонь workflow CI, які виконують цей lane; не пов’язані зміни у вихідному коді, plugins, install-smoke і зміни лише в тестах залишаються на Linux Node lanes, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже виконується звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області охоплення через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін в install, packaging, container-relevant, production changes у bundled extension і в основних поверхнях plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише в тестах і лише в документації не резервують Docker workers. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тому встановлення все одно перевіряється без повторного завантаження залежностей при кожному запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах завдання, тому додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Окреме завдання `docker-e2e-fast` запускає обмежений Docker profile для bundled-plugin з тайм-аутом команди 120 секунд: repair залежностей setup-entry плюс ізоляція синтетичного збою bundled-loader. Повна bundled update/channel matrix залишається manual/full-suite, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широка область платформ CI: зміни в production core запускають typecheck core prod плюс core tests, зміни лише в core tests запускають лише typecheck/tests для core test, зміни в production extension запускають typecheck extension prod плюс extension tests, а зміни лише в extension tests запускають лише typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, тому що extension залежать від цих контрактів core. Підняття версій лише в release metadata запускає точкові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять у всі lanes.

Для push матриця `checks` додає lane `compat-node22`, який запускається лише для push. Для pull request цей lane пропускається, і матриця лишається зосередженою на звичайних test/channel lanes.

Найповільніші сімейства Node-тестів розбиті або збалансовані так, щоб кожне завдання залишалося невеликим: контракти channel розділяють registry і core coverage на шість зважених shards загалом, тести bundled plugin збалансовані між шістьма extension workers, auto-reply виконується як три збалансовані workers замість шести крихітних workers, а agentic gateway/plugin configs розподілені між наявними agentic Node jobs лише для вихідного коду, замість очікування на зібрані артефакти. Широкі browser, QA, media і miscellaneous plugin tests використовують свої окремі конфігурації Vitest замість спільного plugin catch-all. Широкий lanes agents використовує спільний файл-паралельний планувальник Vitest, оскільки в ньому домінують імпорти/планування, а не один повільний тестовий файл. `runtime-config` виконується з shard infra core-runtime, щоб спільний runtime shard не залишався найдовшим. `check-additional` тримає разом compile/canary для package-boundary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання. Gateway watch, channel tests і shard support-boundary core запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи їхні старі назви check як легкі завдання-верифікатори та уникаючи двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його lane unit-тестів усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дубльованого завдання пакування debug APK при кожному Android-relevant push.
`extension-fast` є лише для PR, тому що push-запуски вже виконують повні шарди bundled plugin. Це дає швидкий відгук щодо змінених plugins для review без резервування додаткового Blacksmith worker на `main` для покриття, яке вже є в `checks-node-extensions`.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref теж не завершується з помилкою. Агреговані shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже був витіснений новішим запуском.
Ключ concurrency CI має версіонування (`CI-v7-*`), щоб zombie-процес у старій групі черги на боці GitHub не міг безкінечно блокувати новіші запуски в main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів channel, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані верифікатори Node-тестів, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж заощаджував                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                         |

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
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # зібрати dist, коли мають значення CI lanes artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час виконання, час у черзі та найповільніші завдання
```
