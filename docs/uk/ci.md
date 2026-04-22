---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T16:32:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d07714551511319c4ecde300dc817a325a301d24f5727b61001fc17c5d4dbe7a
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені розширення та збирає маніфест CI | Завжди для недрафтових push і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для недрафтових push і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо попереджень npm advisories                     | Завжди для недрафтових push і PR    |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для недрафтових push і PR    |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, такі як перевірки bundled/plugin-contract/protocol            | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом                  | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору розширень                              | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шарди основних Node-тестів, без каналів, bundled, contract і extension-ліній                  | Зміни, релевантні для Node          |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                               | Коли виявлено зміни розширень       |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Перевірки архітектури, меж, поверхні розширень, меж пакетів і шарди gateway-watch             | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-перевірка пам’яті під час запуску                            | Зміни, релевантні для Node          |
| `checks`                         | Решта Linux Node-ліній: тести каналів і сумісність лише для push з Node 22                    | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                    | Змінено документацію                |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                            | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Специфічні для Windows тестові лінії                                                          | Зміни, релевантні для Windows       |
| `macos-node`                     | Лінія TypeScript-тестів на macOS із використанням спільних зібраних артефактів                | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                               | Зміни, релевантні для macOS         |
| `android`                        | Матриця збірки і тестів Android                                                               | Зміни, релевантні для Android       |

## Порядок fail-fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих матричних завдань артефактів і платформ.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за областю змін міститься в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт областей через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних із встановленням, пакуванням і контейнерами.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широка CI-область платформ: зміни в core production запускають typecheck core prod плюс core tests, зміни лише в core tests запускають лише typecheck/tests для core test, зміни в extension production запускають typecheck extension prod плюс extension tests, а зміни лише в extension tests запускають лише typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extensions, оскільки extensions залежать від цих контрактів core. Зміни лише в метаданих релізу під час підвищення версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config безпечно переводять у всі лінії.

Для push матриця `checks` додає лінію `compat-node22`, яка запускається лише для push. Для pull request цю лінію пропускають, і матриця зосереджується на звичайних test/channel-лініях.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених шардів кожне, тести команд відповіді auto-reply розділяються на чотири шарди за include-pattern, інші великі групи префіксів відповідей auto-reply — на два шарди кожна, а agentic gateway/plugin configs розподіляються по наявних source-only agentic Node jobs замість очікування зібраних артефактів. `check-additional` також відокремлює compile/canary-роботу для меж пакетів від runtime topology-роботи gateway/architecture.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже було витіснено.
Ключ concurrency CI має версію (`CI-v2-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски для main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та їх агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check` крім lint, шарди й агрегати `check-additional`, перевірки документації, Python Skills, build-smoke, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, Linux Node test shards, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали виграш                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                         |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі лінії CI artifact/build-smoke
```
