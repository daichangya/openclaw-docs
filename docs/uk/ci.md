---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи областей дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T20:07:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d619a217c6352919defa20206eacef48fa19926c9f1b912f07896ab6b7041526
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push у `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і будує маніфест CI | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для non-draft push і PR     |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, що стосуються Node          |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, наприклад перевірки bundled/plugin-contract/protocol         | Зміни, що стосуються Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, що стосуються Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extensions                               | Зміни, що стосуються Node          |
| `checks-node-core-test`          | Шарди тестів ядра Node, за винятком етапів каналів, bundled, контрактів і extensions         | Зміни, що стосуються Node          |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                              | Коли виявлено зміни в extensions   |
| `check`                          | Шардований еквівалент основного локального шлюзу: production-типи, lint, guards, test types і strict smoke | Зміни, що стосуються Node          |
| `check-additional`               | Архітектурні, boundary, extension-surface guards, package-boundary і gateway-watch шарди     | Зміни, що стосуються Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke перевірка пам’яті під час запуску                         | Зміни, що стосуються Node          |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                    | Зміни, що стосуються Node          |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, що стосуються Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові етапи                                                         | Зміни, що стосуються Windows       |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, що стосуються macOS         |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                              | Зміни, що стосуються macOS         |
| `android`                        | Матриця збірки й тестів Android                                                              | Зміни, що стосуються Android       |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` визначає, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні й runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни у workflow CI перевіряють граф Node CI разом із lint перевірок workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні етапи залишаються прив’язаними до змін у вихідному коді відповідних платформ.
Перевірки Windows Node прив’язані до Windows-специфічних wrapper-ів process/path, допоміжних засобів npm/pnpm/UI runner, конфігурації пакетного менеджера та поверхонь workflow CI, які виконують цей етап; не пов’язані зміни у вихідному коді, plugins, install-smoke і зміни лише в тестах залишаються на Linux Node-етапах, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, що стосуються встановлення, пакування та контейнерів. Його smoke для QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш сховища BuildKit pnpm, тож він усе ще перевіряє встановлення без повторного завантаження залежностей під час кожного запуску. Його e2e gateway-network повторно використовує runtime image, зібраний раніше в межах завдання, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка область дії платформ у CI: зміни production-коду ядра запускають перевірку типів core prod плюс тести ядра, зміни лише в тестах ядра запускають лише перевірку типів/тести core test, зміни production-коду extensions запускають перевірку типів extension prod плюс тести extensions, а зміни лише в тестах extensions запускають лише перевірку типів/тести extension test. Зміни у публічному Plugin SDK або plugin-contract розширюють перевірку до extensions, оскільки extensions залежать від цих контрактів ядра. Зміни лише в release metadata із підвищенням версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять виконання на всі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця зосереджується на звичайних етапах test/channel.

Найповільніші сімейства тестів Node поділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти каналів ділять покриття registry і core на вісім зважених шардів кожне, тести bundled plugin збалансовано між шістьма workers для extensions, auto-reply виконується як три збалансовані workers замість шести дрібних workers, а agentic-конфігурації gateway/plugin розподіляються між наявними source-only agentic Node jobs замість очікування на зібрані артефакти. `check-additional` тримає package-boundary compile/canary разом і відокремлює їх від topology gateway/architecture на рівні runtime; shard boundary guard виконує свої невеликі незалежні guards паралельно в межах одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної збірки повного набору sidecar-артефактів CI.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був замінений новішим.
Ключ concurrency CI має версіонування (`CI-v5-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тому 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де вартість часу очікування в черзі для 32 vCPU була більшою, ніж отримана економія                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; fork-и повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + зламані посилання
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
