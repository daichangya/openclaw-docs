---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, обмежувальні правила за областю змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T02:02:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2747878d3dee312caffb13f482b2260cb02fb9ddd3c172e176789ad9fbaa82a
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається під час кожного push до `main` і для кожного pull request. Він використовує розумне обмеження за областю змін, щоб пропускати дорогі завдання, коли змінено лише непов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Визначає зміни лише в docs, змінені області, змінені extensions і збирає маніфест CI         | Завжди для push і PR, що не є draft  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для push і PR, що не є draft  |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди для push і PR, що не є draft  |
| `security-fast`                  | Обов’язковий агрегатор для швидких завдань безпеки                                           | Завжди для push і PR, що не є draft  |
| `build-artifacts`                | Збирає `dist/` і Control UI один раз, завантажує повторно використовувані артефакти для downstream-завдань | Зміни, пов’язані з Node              |
| `checks-fast-core`               | Швидкі Linux-етапи перевірки коректності, як-от bundled/plugin-contract/protocol checks      | Зміни, пов’язані з Node              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Зміни, пов’язані з Node              |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору extensions                            | Зміни, пов’язані з Node              |
| `checks-node-core-test`          | Шардовані core Node тести, без channel, bundled, contract і extension етапів                | Зміни, пов’язані з Node              |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request із змінами в extension  |
| `check`                          | Шардований еквівалент основного локального бар’єра: prod types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node              |
| `check-additional`               | Шарди architecture, boundary, extension-surface guards, package-boundary і gateway-watch     | Зміни, пов’язані з Node              |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke перевірка пам’яті під час запуску                         | Зміни, пов’язані з Node              |
| `checks`                         | Решта Linux Node етапів: channel-тести та сумісність Node 22 лише для push                   | Зміни, пов’язані з Node              |
| `check-docs`                     | Форматування docs, lint і перевірки зламаних посилань                                        | Змінено docs                         |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, пов’язані з Python Skills     |
| `checks-windows`                 | Специфічні для Windows етапи тестування                                                      | Зміни, пов’язані з Windows           |
| `macos-node`                     | Етап TypeScript-тестів на macOS із використанням спільних зібраних артефактів                | Зміни, пов’язані з macOS             |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, пов’язані з macOS             |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                                | Зміни, пов’язані з Android           |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які етапи взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих artifact- і platform-matrix-завдань.
3. `build-artifacts` виконується паралельно зі швидкими Linux-етапами, щоб downstream-споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі platform- і runtime-етапи: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка областей змін міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Редагування workflow CI перевіряє граф Node CI разом із lint workflow, але саме по собі не примушує запускати нативні збірки Windows, Android або macOS; ці platform-етапи залишаються прив’язаними до змін у відповідних джерелах платформи.
Перевірки Windows Node обмежені Windows-специфічними process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями workflow CI, які запускають цей етап; непов’язані зміни у source, plugins, install-smoke і лише тестах залишаються на Linux Node-етапах, щоб не резервувати Windows worker із 16 vCPU для покриття, яке вже забезпечують звичайні test shards.
Окремий workflow `install-smoke` повторно використовує той самий скрипт областей змін через власне завдання `preflight`. Він обчислює `run_install_smoke` на основі вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, пов’язаних з install, packaging, containers, production-змінами bundled extensions, а також core поверхнями plugin/channel/gateway/Plugin SDK, які використовують Docker smoke jobs. Зміни лише в тестах і docs не резервують Docker workers. Його QR package smoke примушує шар Docker `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож інсталяція все одно перевіряється без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому ж завданні, тож додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Окреме завдання `docker-e2e-fast` запускає обмежений Docker-профіль bundled-plugin із тайм-аутом команди 120 секунд: repair залежностей setup-entry плюс ізоляція синтетичних збоїв bundled-loader. Повна матриця оновлення bundled і channel лишається manual/full-suite, бо вона виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний бар’єр суворіший щодо architecture boundaries, ніж широке platform-обмеження в CI: production-зміни core запускають prod typecheck для core плюс core-тести, зміни лише в core tests запускають лише typecheck/tests для core tests, production-зміни extensions запускають prod typecheck для extensions плюс extension-тести, а зміни лише в extension tests запускають лише typecheck/tests для extension tests. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку на extensions, оскільки extensions залежать від цих core-контрактів. Зміни лише в release metadata для version bumps запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config у безпечному режимі запускають усі етапи.

Для push матриця `checks` додає етап `compat-node22`, який запускається лише для push. Для pull request цей етап пропускається, і матриця залишається зосередженою на звичайних test/channel-етапах.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core загалом на шість зважених шардів, bundled plugin-тести балансуються між шістьма extension workers, auto-reply виконується на трьох збалансованих workers замість шести крихітних workers, а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin-тести використовують свої спеціалізовані конфігурації Vitest замість спільного універсального plugin-контуру. Широкий етап agents використовує спільний планувальник file-parallel у Vitest, оскільки в ньому домінують імпорти/планування, а не один повільний test file. `runtime-config` запускається разом із shard infra core-runtime, щоб спільний runtime shard не залишався єдиним на хвості. `check-additional` тримає разом compile/canary-роботи package-boundary і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно всередині одного завдання, а gateway watch regression повторно використовує кеш `dist/` і `dist-runtime/`, зібраний у тому ж запуску через `build-artifacts`, щоб вимірювати стабільність watch без повторної збірки runtime artifacts у власному worker.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set або manifest; його unit-test етап усе одно компілює цей flavor із прапорцями BuildConfig для SMS/call-log, водночас уникаючи дублювання завдання пакування debug APK для кожного Android-relevant push.
`extension-fast` є лише для PR, тому що push-запуски вже виконують повні шарди bundled plugin. Це дає швидкий зворотний зв’язок щодо змінених plugins під час review без резервування додаткового Blacksmith worker у `main` для покриття, яке вже присутнє в `checks-node-extensions`.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard-перевірки використовують `!cancelled() && always()`, щоб вони все одно повідомляли про звичайні збої шардів, але не ставали в чергу після того, як увесь workflow уже було витіснено новішим запуском.
Ключ concurrency для CI має версію (`CI-v7-*`), щоб GitHub-side zombie у старій групі черги не міг нескінченно блокувати новіші запуски main.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегатори (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, шардовані перевірки контрактів каналів, шарди `check` за винятком lint, шарди й агрегатори `check-additional`, агреговані верифікатори Node-тестів, перевірки docs, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu від GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node-тестів, шарди bundled plugin-тестів, решта споживачів built-artifacts, `android`                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який усе ще достатньо чутливий до CPU, тож 8 vCPU коштували дорожче, ніж заощаджували; Docker-збірки install-smoke, де час очікування в черзі на 32 vCPU коштував дорожче, ніж давав вигоду                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумний локальний бар’єр: changed typecheck/lint/tests за boundary lane
pnpm check          # швидкий локальний бар’єр: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # той самий бар’єр із вимірюванням часу для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування docs + lint + зламані посилання
pnpm build          # збірка dist, коли важливі етапи CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час у черзі та найповільніші завдання
```
