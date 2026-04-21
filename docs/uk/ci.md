---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі перевірок і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-21T02:11:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc2fd83f9e122a40183ad7c31e1bfa5004d3362f7240297589962874b8c47f76
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені межі, змінені розширення та збирає маніфест CI   | Завжди для недрафтових push і PR   |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для недрафтових push і PR   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm advisories                    | Завжди для недрафтових push і PR   |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для недрафтових push і PR   |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для наступних завдань | Зміни, пов’язані з Node            |
| `checks-fast-core`               | Швидкі Linux-перевірки коректності, як-от bundled/plugin-contract/protocol checks            | Зміни, пов’язані з Node            |
| `checks-fast-contracts-channels` | Розшардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки    | Зміни, пов’язані з Node            |
| `checks-node-extensions`         | Повні шарди тестів bundled-plugin для всього набору розширень                                | Зміни, пов’язані з Node            |
| `checks-node-core-test`          | Шарди core Node тестів, без урахування каналів, bundled, contract і extension lane           | Зміни, пов’язані з Node            |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                          | Коли виявлено зміни розширень      |
| `check`                          | Розшардований еквівалент основної локальної перевірки: prod types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node            |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | Зміни, пов’язані з Node            |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                               | Зміни, пов’язані з Node            |
| `checks`                         | Решта Linux Node lane: тести каналів і лише для push сумісність Node 22                      | Зміни, пов’язані з Node            |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, пов’язані з Python Skills   |
| `checks-windows`                 | Windows-специфічні test lane                                                                  | Зміни, пов’язані з Windows         |
| `macos-node`                     | macOS lane тестів TypeScript із використанням спільно зібраних артефактів                    | Зміни, пов’язані з macOS           |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, пов’язані з macOS           |
| `android`                        | Матриця build і test для Android                                                              | Зміни, пов’язані з Android         |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускаються дорогі:

1. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань із артефактами та платформених матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane, щоб наступні споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформені й runtime lane: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка меж міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт меж через власне завдання `preflight`. Він обчислює `run_install_smoke` з вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широкі платформені межі CI: зміни core production запускають core prod typecheck і core tests, зміни лише в core tests запускають лише core test typecheck/tests, зміни extension production запускають extension prod typecheck і extension tests, а зміни лише в extension tests запускають лише extension test typecheck/tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension validation, оскільки розширення залежать від цих core contract. Невідомі зміни в root/config безпечно переводять у всі lane.

Для push матриця `checks` додає lane `compat-node22`, який запускається лише для push. Для pull request цей lane пропускається, і матриця залишається зосередженою на звичайних test/channel lane.

Найповільніші сімейства Node тестів розбиті на include-file шарди, щоб кожне завдання залишалося невеликим: channel contracts розділяють покриття registry і core на вісім зважених шардів кожне, тести команд відповіді auto-reply розбиті на чотири шарди за include-pattern, а інші великі групи префіксів відповідей auto-reply розбиті на два шарди кожна. `check-additional` також відокремлює роботу package-boundary compile/canary від роботи runtime topology gateway/architecture.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard checks явно вказують на цей випадок скасування, щоб його було легше відрізнити від збою тесту.

## Ранери

| Ранер                            | Завдання                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux checks, docs checks, Python skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                            |

Linux-завдання Blacksmith використовують `useblacksmith/checkout`, щоб повторні запуски CI могли повторно використовувати кеш git mirror від Blacksmith. Завдання Windows і macOS залишаються на стандартному `actions/checkout`.

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # збірка dist, коли важливі CI lane artifact/build-smoke
```
