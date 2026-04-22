---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте невдалі перевірки GitHub Actions
summary: Граф завдань CI, шлюзи охоплення та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T16:27:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e815d95ff3a5b4cabea76f9f5799e6240c86cc63a653d212b043c21f0d6644bf
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push до `main` і для кожного pull request. Він використовує розумне визначення охоплення, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                   | Коли запускається                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і будує маніфест CI  | Завжди для non-draft push і PR      |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для non-draft push і PR      |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisory з npm                                 | Завжди для non-draft push і PR      |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                              | Завжди для non-draft push і PR      |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node          |
| `checks-fast-core`               | Швидкі Linux-етапи коректності, наприклад bundled/plugin-contract/protocol перевірки         | Зміни, релевантні для Node          |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, релевантні для Node          |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin у всьому наборі extensions                              | Зміни, релевантні для Node          |
| `checks-node-core-test`          | Шардовані тести core Node, за винятком етапів channel, bundled, contract і extension         | Зміни, релевантні для Node          |
| `extension-fast`                 | Точкові тести лише для змінених bundled plugins                                               | Коли виявлено зміни в extensions    |
| `check`                          | Шардований еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node          |
| `check-additional`               | Архітектурні перевірки, boundary-перевірки, guards поверхні extension, package-boundary і shard-и gateway-watch | Зміни, релевантні для Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест пам’яті під час запуску                                | Зміни, релевантні для Node          |
| `checks`                         | Решта Linux Node-етапів: тести каналів і сумісність Node 22 лише для push                    | Зміни, релевантні для Node          |
| `check-docs`                     | Форматування документації, lint і перевірки зламаних посилань                                 | Змінено документацію                |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                       | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Тести, специфічні для Windows                                                                 | Зміни, релевантні для Windows       |
| `macos-node`                     | Етап TypeScript-тестів на macOS з використанням спільних зібраних артефактів                 | Зміни, релевантні для macOS         |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                                | Зміни, релевантні для macOS         |
| `android`                        | Матриця build і тестів Android                                                                | Зміни, релевантні для Android       |

## Порядок Fail-Fast

Завдання впорядковано так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань артефактів і платформної матриці.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні й runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка охоплення знаходиться в `scripts/ci-changed-scope.mjs` і покривається unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт охоплення через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, релевантних для install, packaging і контейнерів.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широке CI-охоплення платформ: зміни core production запускають prod typecheck для core плюс тести core, зміни лише в core tests запускають лише typecheck/tests для core tests, зміни extension production запускають prod typecheck для extension плюс тести extension, а зміни лише в extension tests запускають лише typecheck/tests для extension tests. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на extensions, тому що extensions залежать від цих core-контрактів. Підвищення версії лише в release metadata запускають точкові перевірки version/config/root-dependency. Невідомі зміни в root/config у безпечний спосіб запускають усі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних test/channel-етапах.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють registry і core coverage на вісім зважених shard-ів кожен, тести команд відповіді auto-reply розділяються на чотири shard-и за include-pattern, інші великі групи префіксів відповіді auto-reply розділяються на два shard-и кожна, а agentic gateway/plugin configs розподіляються по наявних Node-завданнях agentic лише з source-кодом, замість того щоб чекати на built artifacts. `check-additional` також відокремлює compile/canary-роботи package-boundary від runtime topology gateway/architecture-робіт.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо лише найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні помилки shard-ів, але не стають у чергу після того, як увесь workflow вже було витіснено.
Ключ concurrency для CI версіонований (`CI-v2-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски на main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), шардовані перевірки контрактів каналів, короткі завдання-верифікатори агрегатів (`check`, `check-additional`, `checks-fast-contracts-channels`), workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu від GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, Linux-перевірки, окрім `check-lint` і контрактів каналів, верифікатори довгих матричних агрегатів, перевірки документації, Python Skills, `android`                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується `macos-latest`                                                                                                                                                                                                                                                                                                                     |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary-етапом
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка зламаних посилань
pnpm build          # збірка dist, коли важливі етапи CI artifact/build-smoke
```
