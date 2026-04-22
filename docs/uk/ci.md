---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T14:02:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39c15fe36c2e3209672d16069aafd22c8acec7d770191339a5ccc63e4b117f07
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та будує маніфест CI  | Завжди для push і PR не в draft    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                     | Завжди для push і PR не в draft    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей проти advisory з npm                                 | Завжди для push і PR не в draft    |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                             | Завжди для push і PR не в draft    |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, такі як bundled/plugin-contract/protocol checks      | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом                   | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin у всьому наборі розширень                                 | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шардовані тести core Node, окрім каналів, bundled, контрактних і extension-етапів              | Зміни, релевантні для Node         |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                                | Коли виявлено зміни розширень      |
| `check`                          | Шардований еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди для architecture, boundary, extension-surface guards, package-boundary і gateway-watch   | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                            | Зміни, релевантні для Node         |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 тільки для push                    | Зміни, релевантні для Node         |
| `check-docs`                     | Форматування документації, lint і перевірка битих посилань                                     | Коли змінено документацію          |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                             | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows етапи тестування                                                        | Зміни, релевантні для Windows      |
| `macos-node`                     | TypeScript-етап тестування на macOS із використанням спільних зібраних артефактів              | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                                 | Зміни, релевантні для macOS        |
| `android`                        | Матриця збірки та тестування Android                                                           | Зміни, релевантні для Android      |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи на важчі матричні завдання артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні й runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних з інсталяцією, пакуванням і контейнерами.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка область платформ CI: зміни core production запускають typecheck core prod плюс тести core, зміни лише в core tests запускають тільки typecheck/tests для core tests, зміни extension production запускають typecheck extension prod плюс тести розширень, а зміни лише в extension tests запускають тільки typecheck/tests для extension tests. Зміни в public Plugin SDK або plugin-contract розширюють валідацію до розширень, тому що розширення залежать від цих core-контрактів. Зміни лише в метаданих релізу для підвищення версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять у всі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця зосереджується на звичайних етапах тестів/каналів.

Найповільніші сімейства тестів Node розбиті на include-file-шарди, щоб кожне завдання залишалося невеликим: контракти каналів розбивають registry і core coverage на вісім зважених шардів кожен, тести команд відповіді auto-reply розбиваються на чотири шарди за include-pattern, а інші великі групи префіксів відповіді auto-reply розбиваються на два шарди кожна. `check-additional` також відокремлює package-boundary compile/canary-роботу від runtime topology gateway/architecture-роботи.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані перевірки шардів явно вказують на цей випадок скасування, щоб його було легше відрізнити від збою тесту.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, короткі агреговані завдання-перевірки (`security-fast`, `check`, `check-additional`, `checks-fast-contracts-channels`); preflight для install-smoke також використовує Ubuntu від GitHub, щоб матриця Blacksmith могла ставитися в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`, `security-dependency-audit`, `build-artifacts`, Linux-перевірки, довгі агреговані перевірки матриці, перевірки документації, Python Skills, `android`                                              |
| `blacksmith-8vcpu-windows-2025`  | `checks-windows`                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                              |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами по етапах
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # збірка dist, коли важливі етапи CI artifact/build-smoke
```
