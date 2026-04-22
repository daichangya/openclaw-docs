---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмеження за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T16:35:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5f5fdf924942372c4880b76055766590b40f57c6a1560dab2e0277f99f9ffa2
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише не пов’язані між собою частини.

## Огляд завдань

| Завдання                          | Призначення                                                                                  | Коли запускається                  |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                       | Визначає зміни лише в документації, змінені області, змінені extensions і будує маніфест CI | Завжди для push і PR, що не є draft |
| `security-scm-fast`               | Виявлення приватних ключів і аудит workflow через `zizmor`                                  | Завжди для push і PR, що не є draft |
| `security-dependency-audit`       | Аудит production lockfile без залежностей щодо advisory npm                                  | Завжди для push і PR, що не є draft |
| `security-fast`                   | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для push і PR, що не є draft |
| `build-artifacts`                 | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, пов’язані з Node            |
| `checks-fast-core`                | Швидкі Linux-ланки коректності, як-от перевірки bundled/plugin-contract/protocol            | Зміни, пов’язані з Node            |
| `checks-fast-contracts-channels`  | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки      | Зміни, пов’язані з Node            |
| `checks-node-extensions`          | Повні шарди тестів bundled-plugin для всього набору extensions                              | Зміни, пов’язані з Node            |
| `checks-node-core-test`           | Шарди core Node tests, окрім ланок каналів, bundled, контрактів і extensions                | Зміни, пов’язані з Node            |
| `extension-fast`                  | Сфокусовані тести лише для змінених bundled plugins                                         | Коли виявлено зміни extensions     |
| `check`                           | Шардований еквівалент основного локального gate: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node            |
| `check-additional`                | Шарди архітектури, меж, guards поверхні extensions, package-boundary і gateway-watch        | Зміни, пов’язані з Node            |
| `build-smoke`                     | Smoke-тести зібраного CLI і smoke-тест пам’яті на старті                                    | Зміни, пов’язані з Node            |
| `checks`                          | Решта Linux Node lanes: channel tests і сумісність Node 22 лише для push                    | Зміни, пов’язані з Node            |
| `check-docs`                      | Форматування документації, lint і перевірки на биті посилання                               | Коли змінено docs                  |
| `skills-python`                   | Ruff + pytest для Skills на основі Python                                                   | Зміни, релевантні Python Skills    |
| `checks-windows`                  | Специфічні для Windows test lanes                                                           | Зміни, релевантні Windows          |
| `macos-node`                      | Ланка TypeScript-тестів на macOS із використанням спільних зібраних артефактів              | Зміни, релевантні macOS            |
| `macos-swift`                     | Lint, build і тести Swift для застосунку macOS                                              | Зміни, релевантні macOS            |
| `android`                         | Матриця build і test для Android                                                            | Зміни, релевантні Android          |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які ланки взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко без очікування важчих завдань з артефактами та платформених матриць.
3. `build-artifacts` виконується паралельно зі швидкими Linux-ланками, щоб downstream-споживачі могли стартувати, щойно буде готовий спільний build.
4. Після цього розгалужуються важчі платформені та runtime-ланки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області змін розташована в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий script області змін через власне завдання `preflight`. Він обчислює `run_install_smoke` з вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних з install, packaging і контейнерами.

Локальна логіка changed-lane розташована в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний gate суворіше ставиться до архітектурних меж, ніж широка платформна область CI: зміни в core production запускають typecheck core prod плюс core tests, зміни лише в core tests запускають тільки typecheck/tests для core test, зміни в extension production запускають typecheck extension prod плюс extension tests, а зміни лише в extension tests запускають тільки typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до extension validation, оскільки extensions залежать від цих контрактів core. Підвищення версії лише в release metadata запускає цільові перевірки version/config/root-dependency. Невідомі зміни в root/config у безпечному режимі спрямовуються на всі ланки.

Для push матриця `checks` додає ланку `compat-node22`, яка виконується лише для push. Для pull request ця ланка пропускається, а матриця лишається зосередженою на звичайних test/channel lanes.

Найповільніші сімейства Node tests поділені або збалансовані так, щоб кожне завдання лишалося невеликим: контракти каналів ділять покриття registry і core на вісім зважених шардів кожне, тести команд відповіді auto-reply поділені на чотири шарди за include-pattern, інші великі групи префіксів відповіді auto-reply поділені на два шарди кожна, а agentic gateway/plugin configs розподілені між наявними agentic Node jobs лише з кодом замість очікування зібраних артефактів. `check-additional` також відокремлює compile/canary-роботу package-boundary від runtime topology gateway/architecture роботи.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо тільки найновіший запуск для того самого ref теж не завершується з помилкою. Агреговані шардовані перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже було витіснено новішим запуском.
Ключ конкурентності CI має версію (`CI-v2-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main.

## Runner-и

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu, розміщений у GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node tests, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який і далі достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж давали вигоди                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                              |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний gate: змінені typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний gate: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий gate з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі ланки CI artifact/build-smoke
```
