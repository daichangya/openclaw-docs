---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи за обсягом змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-20T16:32:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb1eafb1f53a57f6bf5351d6f45be4f9759dcf6c61e87050a430455fdd0c4b0
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення обсягу змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для push і PR, що не є draft |
| `security-fast`                  | Виявлення приватних ключів, аудит workflow через `zizmor`, аудит production-залежностей      | Завжди для push і PR, що не є draft |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-смуги перевірки коректності, як-от bundled/plugin-contract/protocol перевірки   | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node         |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin у всьому наборі розширень                               | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шардовані Node-тести ядра, крім смуг каналів, bundled, контрактів і розширень                | Зміни, релевантні для Node         |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Коли виявлено зміни розширень      |
| `check`                          | Шардований еквівалент основного локального шлюзу: prod-типи, lint, guards, типи тестів і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Шарди архітектури, меж, guards поверхні розширень, меж пакетів і gateway-watch               | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                               | Зміни, релевантні для Node         |
| `checks`                         | Решта Linux Node-смуг: тести каналів і сумісність лише для push з Node 22                    | Зміни, релевантні для Node         |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Windows-специфічні смуги тестів                                                              | Зміни, релевантні для Windows      |
| `macos-node`                     | Смуга TypeScript-тестів на macOS із використанням спільних зібраних артефактів               | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                              | Зміни, релевантні для macOS        |
| `android`                        | Матриця збірки й тестів Android                                                              | Зміни, релевантні для Android      |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні й runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка визначення обсягу змін розміщена в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт визначення обсягу через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Локальна логіка changed-lane розміщена в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широкий обсяг платформ CI: зміни у production ядра запускають prod typecheck ядра плюс тести ядра, зміни лише в тестах ядра запускають лише core test typecheck/tests, зміни у production розширень запускають extension prod typecheck плюс тести розширень, а зміни лише в тестах розширень запускають лише extension test typecheck/tests. Зміни у публічному Plugin SDK або plugin-contract розширюють перевірку до валідації розширень, тому що розширення залежать від цих контрактів ядра. Невідомі зміни в root/config у безпечному режимі вмикають усі смуги.

Для push матриця `checks` додає смугу `compat-node22`, яка запускається лише для push. Для pull request ця смуга пропускається, і матриця залишається зосередженою на звичайних смугах тестів/каналів.

Найповільніші сімейства Node-тестів розбиті на шарди через include-файли, щоб кожне завдання залишалося невеликим: контракти каналів розбивають покриття registry/core/extension на цільові шарди, а тести auto-reply reply розбивають кожну велику групу префіксів на два шарди за include-шаблонами. `check-additional` також відокремлює compile/canary-роботу меж пакетів від runtime-topology робіт gateway/architecture.

## Виконавці

| Виконавець                       | Завдання                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux-перевірки, перевірки документації, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                      |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                           |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за граничною смугою
pnpm check          # швидкий локальний шлюз: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm check:docs     # форматування документації + lint + перевірка зламаних посилань
pnpm build          # зібрати dist, коли важливі смуги CI artifact/build-smoke
```
