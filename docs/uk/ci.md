---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-21T18:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d01a178402976cdf7c3c864695e8a12d3f7d1d069a77ea1b02a8aef2a3497f7
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення області змін, щоб пропускати дорогі завдання, коли змінено лише нерелевантні частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, області змін, змінені розширення та будує маніфест CI    | Завжди для push і PR не в чернетці  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR не в чернетці  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на основі advisories npm                           | Завжди для push і PR не в чернетці  |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR не в чернетці  |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, як-от bundled/plugin-contract/protocol checks      | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Розшардовані перевірки контрактів каналів зі стабільним агрегованим результатом              | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шарди тестів core Node, за винятком каналів, bundled, контрактних і extension-етапів         | Зміни, релевантні для Node          |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Коли виявлено зміни в розширеннях   |
| `check`                          | Розшардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Шарди архітектурних, boundary, extension-surface guards, package-boundary і gateway-watch перевірок | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                           | Зміни, релевантні для Node          |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                    | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірка на биті посилання                                | Документацію змінено                |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Windows-специфічні тестові етапи                                                             | Зміни, релевантні для Windows       |
| `macos-node`                     | Етап тестів TypeScript на macOS із використанням спільних зібраних артефактів                | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS         |
| `android`                        | Матриця збірки та тестів Android                                                             | Зміни, релевантні для Android       |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін розміщена в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних до встановлення, пакування та контейнерів.

Логіка локальних changed-lanes розміщена в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка область платформ у CI: зміни core production запускають typecheck core prod плюс тести core, зміни лише в core tests запускають лише typecheck/tests для core tests, зміни extension production запускають typecheck extension prod плюс тести розширень, а зміни лише в extension tests запускають лише typecheck/tests для extension tests. Зміни в public Plugin SDK або plugin-contract розширюють перевірку до validation розширень, тому що розширення залежать від цих core-контрактів. Невідомі зміни в корені/config безпечно переводять виконання на всі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних test/channel-етапах.

Найповільніші сімейства тестів Node розбиті на include-file шарди, щоб кожне завдання залишалося невеликим: channel contracts розділяють покриття registry і core на вісім зважених шардів кожне, тести auto-reply reply command поділено на чотири шарди за include-pattern, а інші великі групи auto-reply reply prefix — на два шарди кожна. `check-additional` також відокремлює compile/canary-роботи package-boundary від runtime topology gateway/architecture-робіт.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо лише найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard-перевірки явно вказують на цей випадок скасування, щоб його було легше відрізнити від помилки тесту.

## Runners

| Runner                           | Завдання                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux checks, docs checks, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` у `openclaw/openclaw`; для forks використовується fallback на `macos-latest`                                            |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lanes для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: змінені typecheck/lint/tests за boundary-етапом
pnpm check          # швидкий локальний шлюз: production tsgo + розшардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + перевірка битих посилань
pnpm build          # збірка dist, коли важливі етапи CI artifact/build-smoke
```
