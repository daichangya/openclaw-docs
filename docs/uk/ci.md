---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, шлюзи області дії та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T17:18:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d74acc63510d20121d2f1f5c0882d5c6a1f5c30c634d19de1ff68158d9f6d4a
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінено лише не пов’язані частини.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області, змінені extensions і збирає маніфест CI | Завжди для не-draft push і PR       |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для не-draft push і PR       |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди для не-draft push і PR       |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для не-draft push і PR       |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, пов’язані з Node             |
| `checks-fast-core`               | Швидкі Linux-ланцюжки перевірок, як-от bundled/plugin-contract/protocol перевірки            | Зміни, пов’язані з Node             |
| `checks-fast-contracts-channels` | Шардовані перевірки channel contract зі стабільним агрегованим результатом перевірки         | Зміни, пов’язані з Node             |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору extensions                            | Зміни, пов’язані з Node             |
| `checks-node-core-test`          | Шардовані тести core Node, без channel, bundled, contract і extension lane                   | Зміни, пов’язані з Node             |
| `extension-fast`                 | Сфокусовані тести лише для змінених bundled plugins                                          | Коли виявлено зміни в extensions    |
| `check`                          | Шардований еквівалент основного локального шлюзу: prod types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node             |
| `check-additional`               | Шарди архітектурних, boundary, extension-surface guards, package-boundary і gateway-watch    | Зміни, пов’язані з Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка стартової пам’яті                                | Зміни, пов’язані з Node             |
| `checks`                         | Решта Linux Node lane: channel тести та сумісність Node 22 лише для push                     | Зміни, пов’язані з Node             |
| `check-docs`                     | Форматування docs, lint і перевірка битих посилань                                           | Змінено docs                        |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, пов’язані з Python Skills    |
| `checks-windows`                 | Специфічні для Windows test lane                                                             | Зміни, пов’язані з Windows          |
| `macos-node`                     | Ланцюжок TypeScript-тестів на macOS із використанням спільних зібраних артефактів            | Зміни, пов’язані з macOS            |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, пов’язані з macOS            |
| `android`                        | Матриця build і test для Android                                                             | Зміни, пов’язані з Android          |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються швидко без очікування важчих завдань із артефактами та платформеними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime lane: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI разом із lint workflow, але самі по собі не змушують запускати нативні збірки Windows, Android або macOS; ці платформені lane залишаються прив’язаними до змін у коді відповідних платформ.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних з install, packaging і контейнерами.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз суворіший щодо архітектурних меж, ніж широка область дії CI для платформ: зміни core production запускають typecheck core prod і core тести, зміни лише в core tests запускають лише typecheck/tests для core test, зміни extension production запускають typecheck extension prod і extension тести, а зміни лише в extension tests запускають лише typecheck/tests для extension test. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extensions, оскільки extensions залежать від цих core-контрактів. Підвищення версії лише в release metadata запускають цільові перевірки версій/config/root-dependency. Невідомі зміни в root/config безпечно переводять виконання на всі lane.

Для push матриця `checks` додає lane `compat-node22`, який запускається лише для push. Для pull request цей lane пропускається, і матриця залишається зосередженою на звичайних test/channel lane.

Найповільніші сімейства Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося невеликим: channel contracts розділяють покриття registry і core на вісім зважених shard для кожного, auto-reply reply тести розділяються за групами префіксів, а agentic gateway/plugin configs розподіляються по наявних source-only agentic Node jobs замість очікування зібраних артефактів. `check-additional` тримає разом package-boundary compile/canary роботу й відокремлює її від runtime topology gateway/architecture роботи; регресія gateway watch використовує мінімальний профіль збірки `gatewayWatch` замість повторної збірки повного набору побічних артефактів CI.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні помилки shard, але не стають у чергу після того, як увесь workflow уже було замінено.
Ключ concurrency для CI має версію (`CI-v2-*`), щоб GitHub-side zombie у старій групі черги не міг безстроково блокувати новіші запуски на main.

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled перевірки, шардовані перевірки channel contract, шарди `check`, крім lint, шарди й агрегатори `check-additional`, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu від GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шардовані Linux Node-тести, шардовані тести bundled plugin, решта споживачів зібраних артефактів, `android`                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще достатньо чутливий до CPU, тому 8 vCPU коштували дорожче, ніж дали користі                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для форків використовується fallback на `macos-latest`                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для форків використовується fallback на `macos-latest`                                                                                                                                                                                                                                                                                                                                                  |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний шлюз: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний шлюз: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий шлюз із вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + биті посилання
pnpm build          # збірка dist, коли важливі lane CI artifact/build-smoke
```
