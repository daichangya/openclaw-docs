---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущено.
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T19:49:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a3fd8d758be86be3b2845b8507d118b6dbe14d1e4886a7adc88d226d2817772
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Розподілені перевірки контрактів каналів зі стабільним агрегованим результатом перевірки     | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шарди тестів core Node, без етапів каналів, bundled, контрактів і розширень                  | Зміни, релевантні для Node          |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Коли виявлено зміни розширень       |
| `check`                          | Розподілений еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Захисти архітектури, меж, surface розширень, package-boundary і шарди gateway-watch          | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke стартової пам’яті                                         | Зміни, релевантні для Node          |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність лише для push із Node 22                 | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Коли змінено документацію           |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Windows-специфічні тестові етапи                                                             | Зміни, релевантні для Windows       |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                               | Зміни, релевантні для macOS         |
| `android`                        | Матриця збірки та тестів Android                                                             | Зміни, релевантні для Android       |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко без очікування важчих завдань з артефактами та платформних матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії знаходиться в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни у workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні етапи й надалі обмежені змінами у вихідному коді відповідної платформи.
Перевірки Windows Node обмежені Windows-специфічними обгортками для process/path, допоміжними засобами npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цей етап; не пов’язані зміни у вихідному коді, plugins, install-smoke і зміни лише в тестах залишаються на Linux Node-етапах, щоб не резервувати 16-vCPU Windows worker для покриття, яке вже виконується звичайними шардами тестів.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних до встановлення, пакування та контейнерів. Його smoke QR package примушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож він усе одно перевіряє встановлення без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує runtime-образ, зібраний раніше в межах завдання, тому додає реальне WebSocket-покриття між контейнерами без додавання ще однієї Docker-збірки.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка область дії платформ у CI: зміни core production запускають typecheck core prod плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для core test, зміни production у розширеннях запускають typecheck extension prod плюс тести розширень, а зміни лише в тестах розширень запускають лише typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію до розширень, оскільки розширення залежать від цих контрактів core. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config для безпеки запускають усі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних test/channel-етапах.

Найповільніші сімейства тестів Node розбиті або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, auto-reply працює як три збалансовані workers замість шести крихітних workers, а конфігурації agentic gateway/plugin розподілені по наявних agentic Node-завданнях лише для вихідного коду замість очікування зібраних артефактів. `check-additional` тримає разом compile/canary-роботи package-boundary і відокремлює їх від runtime topology gateway/architecture; шард boundary guard виконує свої невеликі незалежні guards паралельно в межах одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторного збирання повного набору sidecar-артефактів CI.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був витіснений.
Ключ конкурентності CI має версію (`CI-v4-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, розподілені перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегатори `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugins, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тому 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний перехід на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний перехід на `macos-latest`                                                                                                                                                                                                                                                                                                                                                                         |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидкий локальний шлюз: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
