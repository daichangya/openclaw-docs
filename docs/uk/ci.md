---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T16:50:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91447f3fa150d7d1269f19aeb18e232e75261d533981a4be08bfefe8a177b8a0
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані між собою ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory npm                                   | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні Node              |
| `checks-fast-core`               | Швидкі Linux-ланки коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів channel із стабільним агрегованим результатом перевірки       | Зміни, релевантні Node              |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору розширень                             | Зміни, релевантні Node              |
| `checks-node-core-test`          | Шарди основних Node-тестів, без ланок channel, bundled, contract і extension                 | Зміни, релевантні Node              |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                               | Коли виявлено зміни в розширеннях   |
| `check`                          | Шардований еквівалент головного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, релевантні Node              |
| `check-additional`               | Захист архітектури, меж, поверхні розширень, меж пакетів і шарди gateway-watch               | Зміни, релевантні Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke-тест пам’яті під час запуску                              | Зміни, релевантні Node              |
| `checks`                         | Решта Linux Node-ланок: тести channel і сумісність Node 22 лише для push                     | Зміни, релевантні Node              |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Документацію змінено                |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                     | Зміни, релевантні Python Skills     |
| `checks-windows`                 | Специфічні для Windows тестові ланки                                                          | Зміни, релевантні Windows           |
| `macos-node`                     | Ланка TypeScript-тестів на macOS із використанням спільних зібраних артефактів               | Зміни, релевантні macOS             |
| `macos-swift`                    | Swift lint, збірка та тести для застосунку macOS                                              | Зміни, релевантні macOS             |
| `android`                        | Матриця збірки й тестів Android                                                               | Зміни, релевантні Android           |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються помилкою швидко, не чекаючи важчих завдань із артефактами та платформними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб downstream-споживачі могли почати роботу, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, що стосуються встановлення, пакування та контейнерів.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка платформна область дії CI: зміни в core production запускають typecheck core prod плюс core-тести, зміни лише в core tests запускають тільки typecheck/tests для core tests, зміни в extension production запускають typecheck extension prod плюс extension-тести, а зміни лише в extension tests запускають тільки typecheck/tests для extension tests. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію до розширень, оскільки розширення залежать від цих контрактів core. Зміни лише в release metadata version bump запускають цільові перевірки версій/конфігурації/root-dependency. Невідомі зміни в root/config безпечно переводять у всі ланки.

Для push матриця `checks` додає ланку `compat-node22`, яка запускається лише для push. Для pull request ця ланка пропускається, і матриця залишається зосередженою на звичайних test/channel-ланках.

Найповільніші сімейства Node-тестів розбиті або збалансовані так, щоб кожне завдання залишалося невеликим: контракти channel розділяють покриття registry і core на вісім зважених шардів кожне, тести auto-reply reply поділяються за групою префіксів, а конфігурації agentic gateway/plugin розподіляються по наявних source-only agentic Node-завданнях замість очікування зібраних артефактів. `check-additional` тримає разом compile/canary-роботи для меж пакетів і відокремлює їх від runtime topology gateway/architecture-робіт.

GitHub може позначати витіснені новішим запуском завдання як `cancelled`, коли новий push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref теж не завершується помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні помилки шардів, але не ставали в чергу після того, як увесь workflow уже було витіснено.
Ключ concurrency у CI має версіонування (`CI-v2-*`), тому zombie-процес на боці GitHub у старій групі черги не може безстроково блокувати новіші запуски на `main`.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів channel, шарди `check`, окрім lint, шарди й агрегати `check-additional`, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди bundled plugin-тестів, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували більше, ніж давали вигоди                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                         |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за граничними ланками
pnpm check          # швидкий локальний шлюз: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + перевірка зламаних посилань
pnpm build          # збирає dist, коли важливі ланки CI artifact/build-smoke
```
