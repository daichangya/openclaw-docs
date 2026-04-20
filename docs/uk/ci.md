---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі охоплення перевірок і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-20T12:19:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1cb9b7f5febd691d214575edb52def3292e746710123c990366c677ba90adc37
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення меж охоплення, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані між собою ділянки.

## Огляд завдань

| Завдання                 | Призначення                                                                           | Коли запускається                    |
| ------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`              | Визначає зміни лише в docs, змінені межі охоплення, змінені extensions і будує CI manifest | Завжди для нечернеткових push і PR   |
| `security-fast`          | Виявлення приватних ключів, аудит workflow через `zizmor`, аудит production dependencies | Завжди для нечернеткових push і PR   |
| `build-artifacts`        | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані artifacts для наступних завдань | Зміни, релевантні для Node           |
| `checks-fast-core`       | Швидкі Linux-перевірки коректності, такі як bundled/plugin-contract/protocol checks   | Зміни, релевантні для Node           |
| `checks-node-extensions` | Повні шарди тестів bundled-plugin для всього набору extension                         | Зміни, релевантні для Node           |
| `checks-node-core-test`  | Шарди тестів core Node, за винятком channel, bundled, contract і extension lanes      | Зміни, релевантні для Node           |
| `extension-fast`         | Цільові тести лише для змінених bundled plugins                                       | Коли виявлено зміни в extension      |
| `check`                  | Основна локальна перевірка в CI: `pnpm check` плюс `pnpm build:strict-smoke`          | Зміни, релевантні для Node           |
| `check-additional`       | Architecture, boundary, import-cycle guards плюс gateway watch regression harness      | Зміни, релевантні для Node           |
| `build-smoke`            | Smoke-тести для зібраного CLI і smoke-тест використання пам’яті під час запуску       | Зміни, релевантні для Node           |
| `checks`                 | Решта Linux Node-етапів: channel tests і сумісність лише для push із Node 22          | Зміни, релевантні для Node           |
| `check-docs`             | Форматування docs, lint і перевірки битих посилань                                    | Змінено docs                         |
| `skills-python`          | Ruff + pytest для Skills на основі Python                                             | Зміни, релевантні для Python Skills  |
| `checks-windows`         | Специфічні для Windows етапи тестування                                               | Зміни, релевантні для Windows        |
| `macos-node`             | Етап тестів TypeScript на macOS із використанням спільно зібраних artifacts           | Зміни, релевантні для macOS          |
| `macos-swift`            | Swift lint, збірка і тести для застосунку macOS                                       | Зміни, релевантні для macOS          |
| `android`                | Матриця збірки й тестів Android                                                       | Зміни, релевантні для Android        |

## Порядок швидкого завершення при помилках

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються при помилці, не чекаючи важчих завдань artifact і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка меж охоплення знаходиться в `scripts/ci-changed-scope.mjs` і покривається unit tests у `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення меж охоплення через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних install, packaging і containers.

Для push матриця `checks` додає етап `compat-node22`, що запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних test/channel lanes.

## Runners

| Runner                           | Завдання                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux checks, docs checks, Python skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Локальні еквіваленти

```bash
pnpm check          # швидка локальна перевірка: project-reference tsgo + lint + fast guards
pnpm check:timed    # та сама перевірка з таймінгами по кожному етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest тести
pnpm test:channels
pnpm check:docs     # форматування docs + lint + перевірка битих посилань
pnpm build          # збірка dist, коли важливі етапи CI artifact/build-smoke
```
