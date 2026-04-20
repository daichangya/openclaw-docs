---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої в перевірках GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-20T18:17:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: bba00867dbd27c036958f4eae9540dbfcdd68abbac4364cf8fefbef1228c357b
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області дії, змінені extensions і збирає маніфест CI | Завжди для push і PR без draft-статусу |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR без draft-статусу |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm advisories                    | Завжди для push і PR без draft-статусу |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR без draft-статусу |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, що стосуються Node           |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, як-от bundled/plugin-contract/protocol перевірки             | Зміни, що стосуються Node           |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів channel зі стабільним агрегованим результатом                 | Зміни, що стосуються Node           |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору extension                                | Зміни, що стосуються Node           |
| `checks-node-core-test`          | Шарди основних Node-тестів, окрім channel, bundled, contract і extension-етапів             | Зміни, що стосуються Node           |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                          | Коли виявлено зміни в extension     |
| `check`                          | Шардований еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, що стосуються Node           |
| `check-additional`               | Шарди для architecture, boundary, extension-surface guards, package-boundary і gateway-watch | Зміни, що стосуються Node           |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                          | Зміни, що стосуються Node           |
| `checks`                         | Решта Linux Node-етапів: channel-тести і сумісність Node 22 лише для push                    | Зміни, що стосуються Node           |
| `check-docs`                     | Форматування документації, lint і перевірка битих посилань                                   | Документацію змінено                |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, що стосуються Skills на Python |
| `checks-windows`                 | Специфічні для Windows тестові етапи                                                         | Зміни, що стосуються Windows        |
| `macos-node`                     | macOS-етап тестів TypeScript із використанням спільних зібраних артефактів                   | Зміни, що стосуються macOS          |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, що стосуються macOS          |
| `android`                        | Матриця збирання і тестування Android                                                        | Зміни, що стосуються Android        |

## Порядок швидкого завершення при збої

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` визначає, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою без очікування важчих завдань артефактів і платформних матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка визначення області дії міститься в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, що стосуються встановлення, пакування й контейнерів.

Логіка локальних changed-lanes міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка платформна область дії CI: зміни core production запускають core prod typecheck і core tests, зміни лише в core tests запускають лише core test typecheck/tests, зміни в extension production запускають extension prod typecheck і extension tests, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на extensions, оскільки extensions залежать від цих core-контрактів. Невідомі зміни в root/config безпечно переводять виконання на всі етапи.

Для push матриця `checks` додає етап `compat-node22`, що запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних test/channel-етапах.

Найповільніші сімейства Node-тестів розбито на include-file шарди, щоб кожне завдання залишалося невеликим: контракти channel розділяють покриття registry і core на чотири збалансовані шарди для кожного, тести команд відповіді auto-reply розділено на чотири шарди за include-pattern, а інші великі групи префіксів відповідей auto-reply розділено на два шарди кожна. `check-additional` також відокремлює compile/canary-роботи package-boundary від runtime topology-робіт для gateway/architecture.

## Ранери

| Ранер                            | Завдання                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Skills на Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                            |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lanes для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
