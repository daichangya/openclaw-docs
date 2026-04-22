---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі охоплення, і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T21:11:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a496ff4d9d6f4926bf098e12410b5edd987b36ba26de1a245824eca77eb241de
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення охоплення, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisory                                  | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні Node              |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, як-от bundled/plugin-contract/protocol перевірки             | Зміни, релевантні Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом                 | Зміни, релевантні Node              |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору розширень                             | Зміни, релевантні Node              |
| `checks-node-core-test`          | Шарди тестів core Node, окрім етапів каналів, bundled, contract і extension                  | Зміни, релевантні Node              |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                              | Коли виявлено зміни розширень       |
| `check`                          | Шардований еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні Node              |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | Зміни, релевантні Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke перевірка пам’яті під час запуску                         | Зміни, релевантні Node              |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                    | Зміни, релевантні Node              |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Документацію змінено                |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні Python Skills     |
| `checks-windows`                 | Windows-специфічні тестові етапи                                                             | Зміни, релевантні Windows           |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, релевантні macOS             |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                               | Зміни, релевантні macOS             |
| `android`                        | Матриця збирання і тестування Android                                                        | Зміни, релевантні Android           |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих завдань з артефактами та платформних матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка охоплення міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни в CI workflow перевіряють Node CI graph разом із linting workflow, але самі по собі не примушують запускати нативні збірки Windows, Android або macOS; ці платформні етапи й далі обмежені змінами в платформному коді.
Перевірки Windows Node обмежені Windows-специфічними обгортками process/path, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які запускають цей етап; не пов’язані зміни в source, plugin, install-smoke і зміни лише в тестах залишаються на Linux Node-етапах, щоб не резервувати Windows worker на 16 vCPU для покриття, яке вже виконується звичайними тестовими шардами.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення охоплення через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних встановленню, пакуванню та контейнерам. Його smoke перевірка QR package змушує Docker-шар `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож вона все одно перевіряє встановлення без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в межах цього завдання, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо меж архітектури, ніж широке CI-охоплення платформ: зміни core production запускають core prod typecheck разом із core tests, зміни лише в core tests запускають лише core test typecheck/tests, зміни extension production запускають extension prod typecheck разом із extension tests, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в public Plugin SDK або plugin-contract розширюють перевірку до extension validation, тому що розширення залежать від цих core-контрактів. Підвищення версій лише в release metadata запускають точкові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять виконання на всі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, а матриця зосереджується на звичайних тестових/channel етапах.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим: channel contracts розділяють покриття registry і core на вісім зважених шардів кожне, bundled plugin tests збалансовані між шістьма workers розширень, auto-reply виконується як три збалансовані workers замість шести дрібних workers, а agentic gateway/plugin configs розподілені по наявних source-only agentic Node jobs замість очікування зібраних артефактів. Широкий етап agents використовує спільний file-parallel scheduler Vitest, бо в ньому домінують імпорти/планування, а не окремий повільний тестовий файл. `check-additional` тримає package-boundary compile/canary разом і відокремлює їх від runtime topology gateway/architecture робіт; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної повної перебудови всього набору sidecar-артефактів CI.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої в шардах, але не стають у чергу після того, як увесь workflow уже був витіснений новішим запуском.
Ключ concurrency у CI має версію (`CI-v6-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски на main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегатори `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі настільки чутливий до CPU, що 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі на 32 vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                                                                                                                                                                                                                        |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate із вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
