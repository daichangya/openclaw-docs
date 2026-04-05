---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі областей і локальні еквіваленти команд
title: CI Pipeline
x-i18n:
    generated_at: "2026-04-05T18:00:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a95b6e584b4309bc249866ea436b4dfe30e0298ab8916eadbc344edae3d1194
    source_path: ci.md
    workflow: 15
---

# CI Pipeline

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані частини.

## Огляд завдань

| Завдання                 | Призначення                                                                              | Коли запускається                    |
| ------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`              | Визначення змін лише в документації, змінених областей, змінених розширень і збірка CI manifest | Завжди для push і PR, що не є draft  |
| `security-fast`          | Виявлення приватних ключів, аудит workflow через `zizmor`, аудит production-залежностей | Завжди для push і PR, що не є draft  |
| `build-artifacts`        | Збірка `dist/` і Control UI один раз, вивантаження повторно використовуваних артефактів для наступних завдань | Зміни, релевантні для Node           |
| `checks-fast-core`       | Швидкі Linux-етапи коректності, як-от перевірки bundled/plugin-contract/protocol         | Зміни, релевантні для Node           |
| `checks-fast-extensions` | Агрегація shard-етапів розширень після завершення `checks-fast-extensions-shard`         | Зміни, релевантні для Node           |
| `extension-fast`         | Цільові тести лише для змінених bundled plugins                                          | Коли виявлено зміни в розширеннях    |
| `check`                  | Основний локальний gate у CI: `pnpm check` плюс `pnpm build:strict-smoke`                | Зміни, релевантні для Node           |
| `check-additional`       | Архітектурні й межові перевірки плюс regression harness для gateway watch                 | Зміни, релевантні для Node           |
| `build-smoke`            | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                      | Зміни, релевантні для Node           |
| `checks`                 | Важчі Linux Node-етапи: повні тести, тести каналів і сумісність Node 22 лише для push    | Зміни, релевантні для Node           |
| `check-docs`             | Перевірки форматування документації, lint і битих посилань                               | Документацію змінено                 |
| `skills-python`          | Ruff + pytest для Skills на Python                                                       | Зміни, релевантні для Python Skills  |
| `checks-windows`         | Windows-специфічні етапи тестування                                                      | Зміни, релевантні для Windows        |
| `macos-node`             | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів            | Зміни, релевантні для macOS          |
| `macos-swift`            | Swift lint, збірка і тести для застосунку macOS                                          | Зміни, релевантні для macOS          |
| `android`                | Матриця збірки і тестування Android                                                      | Зміни, релевантні для Android        |

## Порядок швидкого завершення при збої

Завдання впорядковано так, щоб дешеві перевірки завершувалися зі збоєм раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються зі збоєм, не чекаючи важчих завдань із артефактами та платформених матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб наступні споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime-етапи: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт областей через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних етапах тестів/каналів.

## Runners

| Runner                           | Завдання                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, перевірки Linux, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Локальні еквіваленти

```bash
pnpm check          # типи + lint + форматування
pnpm build:strict-smoke
pnpm test:gateway:watch-regression
pnpm test           # vitest-тести
pnpm test:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # збірка dist, коли важливі етапи CI artifact/build-smoke
```
