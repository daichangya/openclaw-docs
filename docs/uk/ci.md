---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірки GitHub Actions, які завершуються з помилкою
summary: Граф завдань CI, обмеження за областю та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T19:04:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2340bc163801cb9c947b10895d307affb58a4d839aa1c8294c3ab6a99a783712
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне обмеження за областю, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо рекомендацій npm                               | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                            | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для наступних завдань | Зміни, що стосуються Node           |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, як-от bundled/plugin-contract/protocol перевірки    | Зміни, що стосуються Node           |
| `checks-fast-contracts-channels` | Розбиті на шарди перевірки контрактів каналів зі стабільним агрегованим результатом перевірки | Зміни, що стосуються Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                 | Зміни, що стосуються Node           |
| `checks-node-core-test`          | Шарди основних тестів Node, без урахування каналів, bundled, contract і extension етапів      | Зміни, що стосуються Node           |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                               | Коли виявлено зміни в розширеннях   |
| `check`                          | Розбитий на шарди еквівалент основної локальної перевірки: prod types, lint, guards, test types і strict smoke | Зміни, що стосуються Node           |
| `check-additional`               | Архітектурні перевірки, перевірки меж, extension-surface guards, package-boundary і gateway-watch шарди | Зміни, що стосуються Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                           | Зміни, що стосуються Node           |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність лише для push з Node 22                   | Зміни, що стосуються Node           |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                    | Змінено документацію                |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                       | Зміни, що стосуються Python Skills  |
| `checks-windows`                 | Специфічні для Windows етапи тестування                                                       | Зміни, що стосуються Windows        |
| `macos-node`                     | Етап тестування TypeScript на macOS із використанням спільних зібраних артефактів             | Зміни, що стосуються macOS          |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                               | Зміни, що стосуються macOS          |
| `android`                        | Матриця збірки і тестування Android                                                           | Зміни, що стосуються Android        |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань із артефактами та платформеними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформені та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за областю розміщена в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни у workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не змушують запускати нативні збірки для Windows, Android або macOS; ці платформені етапи залишаються прив’язаними до змін у коді відповідних платформ.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення області через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, що стосуються інсталяції, пакування та контейнерів. Його QR package smoke змушує шар Docker `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тому він усе одно перевіряє інсталяцію без повторного завантаження залежностей під час кожного запуску. Його e2e gateway-network повторно використовує runtime image, зібраний раніше в межах цього завдання, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки.

Локальна логіка changed-lane розміщена в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіше ставиться до архітектурних меж, ніж широке обмеження області платформ у CI: зміни у production core запускають prod typecheck core плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для тестів core, зміни у production extension запускають prod typecheck extension плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/tests для тестів extension. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, тому що extensions залежать від цих контрактів core. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять запуск на всі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних тестових/channel етапах.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти каналів ділять registry і core coverage на вісім зважених шардів кожен, тести відповідей auto-reply розділено за групою префіксів, а agentic gateway/plugin configs розподілено по наявних завданнях agentic Node лише для вихідного коду, замість того щоб чекати на зібрані артефакти. `check-additional` тримає разом compile/canary роботу на межі пакетів і відокремлює її від runtime topology gateway/architecture роботи; шард boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання, а регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної збірки повного набору sidecar-артефактів CI.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push надходить у той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні помилки шардів, але не стають у чергу після того, як увесь workflow уже було витіснено.
Ключ конкурентності CI має версіонування (`CI-v2-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски для main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled перевірки, розбиті на шарди перевірки контрактів каналів, шарди `check` окрім lint, шарди й агрегатори `check-additional`, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugins, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще достатньо чутливий до CPU, тому 8 vCPU коштували дорожче, ніж давали економію; Docker-збірки install-smoke, де вартість часу очікування для 32 vCPU була більшою за вигоду                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                          |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидка локальна перевірка: production tsgo + розбитий на шарди lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
