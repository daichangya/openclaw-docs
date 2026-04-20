---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-20T17:48:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 638b1c7dce952e8df09a17f5dc64461d96ab82b74c513d8e76c3aa1733ee0967
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і будує маніфест CI   | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                     | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                                  | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                               | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, що стосуються Node          |
| `checks-fast-core`               | Швидкі Linux-ланки коректності, такі як bundled/plugin-contract/protocol перевірки             | Зміни, що стосуються Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки         | Зміни, що стосуються Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extensions                                 | Зміни, що стосуються Node          |
| `checks-node-core-test`          | Шарди основних Node-тестів, без каналів, bundled, contract і extension-ланок                   | Зміни, що стосуються Node          |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                            | Коли виявлено зміни extensions     |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, що стосуються Node          |
| `check-additional`               | Шарди архітектури, меж, guards поверхні extensions, package-boundary і gateway-watch           | Зміни, що стосуються Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                            | Зміни, що стосуються Node          |
| `checks`                         | Решта Linux Node-ланок: тести каналів і сумісність лише для push із Node 22                    | Зміни, що стосуються Node          |
| `check-docs`                     | Форматування документації, lint і перевірка зламаних посилань                                  | Коли змінено документацію          |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                        | Зміни, що стосуються Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові ланки                                                           | Зміни, що стосуються Windows       |
| `macos-node`                     | Ланка TypeScript-тестів на macOS із використанням спільних зібраних артефактів                 | Зміни, що стосуються macOS         |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                                 | Зміни, що стосуються macOS         |
| `android`                        | Матриця build і test для Android                                                               | Зміни, що стосуються Android       |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускаються дорогі:

1. `preflight` визначає, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих артефактних і платформних матричних завдань.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, що стосуються install, packaging і контейнерів.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка область дії платформ CI: зміни в core production запускають typecheck core prod і тести core, зміни лише в core tests запускають лише typecheck/tests для core test, зміни в extension production запускають typecheck extension prod і тести extensions, а зміни лише в extension tests запускають лише typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extensions, оскільки extensions залежать від цих core-контрактів. Невідомі зміни в корені/конфігурації безпечно переводять до всіх ланок.

Для push матриця `checks` додає ланку `compat-node22`, яка запускається лише для push. Для pull request ця ланка пропускається, і матриця залишається зосередженою на звичайних test/channel-ланках.

Найповільніші сімейства Node-тестів розділені на include-file-шарди, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry/core/extension на сфокусовані шарди, а тести auto-reply reply розділяють кожну велику prefix-групу на два шарди за include-pattern. `check-additional` також відокремлює роботу compile/canary для package-boundary від runtime topology gateway/architecture.

## Runners

| Runner                           | Завдання                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, перевірки Linux, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                            |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: змінені typecheck/lint/tests за boundary-ланкою
pnpm check          # швидкий локальний шлюз: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm check:docs     # форматування документації + lint + перевірка зламаних посилань
pnpm build          # зібрати dist, коли важливі ланки CI artifact/build-smoke
```
