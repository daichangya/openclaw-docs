---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T14:54:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: b119ade4cd0f7459ac38dda0eaff949585b803ce573a54b9a62b8638b5fbdf98
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області дії, змінені розширення та збирає маніфест CI | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей на відповідність попередженням npm                 | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегований результат для швидких завдань безпеки                               | Завжди для non-draft push і PR     |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, пов’язані з Node            |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, як-от bundled/plugin-contract/protocol перевірки   | Зміни, пов’язані з Node            |
| `checks-fast-contracts-channels` | Розбиті на шарди перевірки контрактів каналів зі стабільним агрегованим результатом перевірки | Зміни, пов’язані з Node            |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, пов’язані з Node            |
| `checks-node-core-test`          | Шарди core Node тестів, без урахування каналів, bundled, контрактних і extension-етапів      | Зміни, пов’язані з Node            |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Коли виявлено зміни розширень      |
| `check`                          | Розбитий на шарди еквівалент основного локального шлюзу: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node            |
| `check-additional`               | Шарди для архітектури, меж, extension-surface guards, package-boundary і gateway-watch       | Зміни, пов’язані з Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                           | Зміни, пов’язані з Node            |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                    | Зміни, пов’язані з Node            |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, пов’язані з Python Skills   |
| `checks-windows`                 | Специфічні для Windows етапи тестування                                                      | Зміни, пов’язані з Windows         |
| `macos-node`                     | Етап TypeScript тестів на macOS із використанням спільних зібраних артефактів                | Зміни, пов’язані з macOS           |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                              | Зміни, пов’язані з macOS           |
| `android`                        | Матриця збірки й тестування Android                                                          | Зміни, пов’язані з Android         |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформні та runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка CI-область платформ: production-зміни core запускають core prod typecheck плюс core тести, зміни лише в core tests запускають лише core test typecheck/tests, production-зміни extension запускають extension prod typecheck плюс extension тести, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до validation розширень, оскільки розширення залежать від цих core-контрактів. Зміни лише в метаданих релізу для підвищення версії запускають цільові перевірки версій/config/root-dependency. Невідомі зміни в root/config безпечно переводять у всі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця зосереджується на звичайних test/channel-етапах.

Найповільніші сімейства Node тестів розбиті на шарди за include-файлами, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, тести команди відповіді auto-reply розділяються на чотири шарди за include-патернами, а інші великі групи префіксів відповіді auto-reply розділяються на два шарди кожна. `check-additional` також відокремлює compile/canary-роботи package-boundary від runtime topology gateway/architecture-робіт.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref теж не завершується з помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої шардів, але не ставляться в чергу після того, як увесь workflow уже був замінений новішим.

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, короткі завдання-агрегатори (`security-fast`, `check`, `check-additional`, `checks-fast-contracts-channels`), workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu на GitHub-hosted, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`, `security-dependency-audit`, `build-artifacts`, Linux-перевірки, крім `check-lint`, довгі завдання-агрегатори матриці, перевірки документації, Python Skills, `android`                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували більше, ніж заощаджували                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                               |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: змінені typecheck/lint/tests за boundary-етапом
pnpm check          # швидкий локальний шлюз: production tsgo + розбитий на шарди lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі етапи CI artifact/build-smoke
```
