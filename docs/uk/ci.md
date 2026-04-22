---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі перевірок і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T17:22:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8a41e29b4b656aef96947510e00ced6bf59860c9baa2afad1d71fb253eafb1
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається для кожного push у `main` і для кожного pull request. Він використовує розумне визначення меж, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                          | Призначення                                                                                   | Коли запускається                  |
| --------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                       | Визначає зміни лише в документації, змінені межі, змінені розширення та збирає маніфест CI   | Завжди для недрафтових push і PR   |
| `security-scm-fast`               | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для недрафтових push і PR   |
| `security-dependency-audit`       | Аудит production lockfile без залежностей щодо npm advisories                                 | Завжди для недрафтових push і PR   |
| `security-fast`                   | Обов’язковий агрегований результат для швидких завдань безпеки                                | Завжди для недрафтових push і PR   |
| `build-artifacts`                 | Один раз збирає `dist/` і Control UI, вивантажує повторно використовувані артефакти для downstream-завдань | Зміни, релевантні для Node         |
| `checks-fast-core`                | Швидкі Linux-лінії перевірки коректності, такі як bundled/plugin-contract/protocol перевірки  | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels`  | Шардовані перевірки контрактів channel зі стабільним агрегованим результатом                  | Зміни, релевантні для Node         |
| `checks-node-extensions`          | Повні шарди тестів bundled-plugin для всього набору розширень                                 | Зміни, релевантні для Node         |
| `checks-node-core-test`           | Шарди основних Node-тестів, окрім ліній channel, bundled, contract і extension                | Зміни, релевантні для Node         |
| `extension-fast`                  | Сфокусовані тести лише для змінених bundled plugins                                           | Коли виявлено зміни в extension    |
| `check`                           | Шардований еквівалент основної локальної перевірки: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`                | Шарди архітектурних і boundary-перевірок, extension-surface guard, package-boundary і gateway-watch | Зміни, релевантні для Node         |
| `build-smoke`                     | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                           | Зміни, релевантні для Node         |
| `checks`                          | Решта Linux Node-ліній: channel-тести й сумісність Node 22 лише для push                      | Зміни, релевантні для Node         |
| `check-docs`                      | Перевірки форматування, lint і битих посилань у документації                                  | Коли змінено документацію          |
| `skills-python`                   | Ruff + pytest для Skills на базі Python                                                       | Зміни, релевантні для Python Skills |
| `checks-windows`                  | Специфічні для Windows лінії тестування                                                       | Зміни, релевантні для Windows      |
| `macos-node`                      | Лінія TypeScript-тестів на macOS із використанням спільних зібраних артефактів                | Зміни, релевантні для macOS        |
| `macos-swift`                     | Swift lint, збірка і тести для застосунку macOS                                               | Зміни, релевантні для macOS        |
| `android`                         | Матриця збірки й тестів Android                                                               | Зміни, релевантні для Android      |

## Порядок fail-fast

Завдання впорядковано так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` визначає, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих завдань зі збіркою артефактів і платформеними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати, щойно буде готова спільна збірка.
4. Після цього розгалужуються важчі платформені та runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка меж міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни у workflow CI перевіряють Node-граф CI разом із lint-перевіркою workflow, але самі по собі не примушують запускати нативні збірки для Windows, Android або macOS; ці платформені лінії й далі прив’язані до змін у вихідному коді відповідних платформ.
Окремий workflow `install-smoke` повторно використовує той самий скрипт меж через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому smoke-перевірка Docker/інсталяції запускається лише для змін, релевантних до інсталяції, пакування та контейнерів.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж ширші межі платформ у CI: зміни core production запускають typecheck core prod плюс core-тести, зміни лише в core tests запускають лише typecheck/tests для core tests, зміни extension production запускають typecheck extension prod плюс extension-тести, а зміни лише в extension tests запускають лише typecheck/tests для extension tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extension, оскільки extension залежать від цих core-контрактів. Зміни лише в metadata релізу з підвищенням версії запускають цільові перевірки version/config/root-dependency. Невідомі зміни в root/config у безпечному режимі ведуть до запуску всіх ліній.

Для push матриця `checks` додає лінію `compat-node22`, яка запускається лише для push. Для pull request ця лінія пропускається, і матриця залишається зосередженою на звичайних test/channel-лініях.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим: channel contracts розділяють registry і core-покриття на вісім зважених шардів кожне, тести auto-reply reply поділено за групами префіксів, а конфігурації agentic gateway/plugin розподілено по наявних agentic Node-завданнях лише для source замість очікування зібраних артефактів. `check-additional` тримає разом package-boundary compile/canary-роботи і відокремлює їх від runtime topology gateway/architecture-робіт; shard boundary guard запускає свої невеликі незалежні guard-перевірки паралельно в межах одного завдання, а regression для gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної повної збірки всього набору sidecar-артефактів CI.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб і далі повідомляти про звичайні збої shard, але не ставати в чергу після того, як увесь workflow уже було витіснено новішим.
Ключ конкурентності CI має версію (`CI-v2-*`), щоб zombie-процес на боці GitHub у старій групі черги не міг безкінечно блокувати новіші запуски для main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів channel, шарди `check`, окрім lint, шарди й агрегати `check-additional`, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu від GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди тестів bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який досі настільки чутливий до CPU, що 8 vCPU коштували дорожче, ніж давали вигоди                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` в `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` в `openclaw/openclaw`; для форків використовується `macos-latest`                                                                                                                                                                                                                                                                                                                                                               |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary-лініями
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі guard-перевірки
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest-тести
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі лінії CI artifact/build-smoke
```
