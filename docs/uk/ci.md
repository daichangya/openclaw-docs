---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте збої в перевірках GitHub Actions
summary: Граф завдань CI, обмеження за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T14:10:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a057845990dc78c2c883b0458d736b10a421a462f645e8b1213e0221d647a8
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflows через `zizmor`                                  | Завжди для push і PR, що не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі advisory npm                             | Завжди для push і PR, що не є draft |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, пов’язані з Node             |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, пов’язані з Node             |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом                 | Зміни, пов’язані з Node             |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору extensions                            | Зміни, пов’язані з Node             |
| `checks-node-core-test`          | Шардовані тести core Node, за винятком каналів, bundled, contracts і етапів extensions       | Зміни, пов’язані з Node             |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Коли виявлено зміни в extensions    |
| `check`                          | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node             |
| `check-additional`               | Guards для архітектури, меж, поверхні extensions, меж пакетів і шардів gateway-watch         | Зміни, пов’язані з Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                           | Зміни, пов’язані з Node             |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                    | Зміни, пов’язані з Node             |
| `check-docs`                     | Форматування документації, lint і перевірка битих посилань                                   | Змінено документацію                |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, що стосуються Skills на Python |
| `checks-windows`                 | Специфічні для Windows тестові етапи                                                         | Зміни, що стосуються Windows        |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, що стосуються macOS          |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, що стосуються macOS          |
| `android`                        | Матриця збірки й тестування Android                                                          | Зміни, що стосуються Android        |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих завдань артефактів і платформних матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні й runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за областю змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіший щодо архітектурних меж, ніж широка область CI за платформами: зміни в production core запускають перевірку типів core prod плюс тести core, зміни лише в тестах core запускають лише перевірку типів/тести core test, зміни в production extensions запускають перевірку типів extension prod плюс тести extensions, а зміни лише в тестах extensions запускають лише перевірку типів/тести extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extensions, оскільки extensions залежать від цих контрактів core. Зміни лише в метаданих релізу з оновленням версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно призводять до запуску всіх етапів.

Для push матриця `checks` додає етап `compat-node22`, який виконується лише для push. Для pull request цей етап пропускається, і матриця зосереджується на звичайних тестових/канальних етапах.

Найповільніші сімейства тестів Node поділено на шарди за include-файлами, щоб кожне завдання залишалося невеликим: контракти каналів ділять покриття registry і core на вісім зважених шардів кожне, тести команд відповіді auto-reply поділяються на чотири шарди за include-pattern, а інші великі групи префіксів відповіді auto-reply поділяються на два шарди кожна. `check-additional` також відокремлює compile/canary-роботи на межі пакетів від runtime-topology-робіт gateway/architecture.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується помилкою. Агреговані перевірки шардів окремо вказують на цей випадок скасування, щоб його було легше відрізнити від збою тесту.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, короткі агреговані завдання-перевірки (`security-fast`, `check`, `check-additional`, `checks-fast-contracts-channels`); preflight для install-smoke також використовує Ubuntu від GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`, `security-dependency-audit`, `build-artifacts`, Linux-перевірки, крім `check-lint`, довгі агреговані перевірки матриць, перевірки документації, Skills на Python, `android`                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається настільки чутливим до CPU, що 8 vCPU коштували дорожче, ніж давали користі                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                              |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: changed typecheck/lint/tests за граничними етапами
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
