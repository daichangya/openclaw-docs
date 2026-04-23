---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущено.
    - Ви налагоджуєте збої перевірок GitHub Actions.
summary: Граф завдань CI, обмежувальні перевірки за обсягом змін і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-23T05:16:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне обмеження за обсягом змін, щоб пропускати дорогі завдання, коли змінювалися лише несуміжні ділянки.

QA Lab має виділені смуги CI поза основним workflow з розумним обмеженням за обсягом змін. Workflow `Parity gate` запускається для відповідних змін у PR і через manual dispatch; він збирає приватне середовище виконання QA і порівнює agentic-паки mock GPT-5.4 та Opus 4.6. Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгалужує mock parity gate, live Matrix lane і live Telegram lane як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а смуга Telegram використовує оренди Convex. `OpenClaw Release Checks` також запускає ті самі смуги QA Lab перед затвердженням релізу.

## Огляд завдань

| Завдання                         | Призначення                                                                                  | Коли запускається                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Визначення змін лише в документації, змінених областей, змінених extensions і побудова маніфесту CI | Завжди для non-draft push і PR      |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR      |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо advisories npm                                | Завжди для non-draft push і PR      |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для non-draft push і PR      |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, пов’язані з Node             |
| `checks-fast-core`               | Швидкі Linux-смуги коректності, такі як bundled/plugin-contract/protocol checks              | Зміни, пов’язані з Node             |
| `checks-fast-contracts-channels` | Розподілені перевірки контрактів каналів зі стабільним агрегованим результатом               | Зміни, пов’язані з Node             |
| `checks-node-extensions`         | Повні розподілені тестові смуги bundled-plugin для всього набору extensions                  | Зміни, пов’язані з Node             |
| `checks-node-core-test`          | Розподілені тести core Node, за винятком смуг каналів, bundled, контрактів і extensions      | Зміни, пов’язані з Node             |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                              | Pull request зі змінами в extensions |
| `check`                          | Розподілений еквівалент основної локальної перевірки: prod types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node             |
| `check-additional`               | Перевірки архітектури, меж, поверхонь extensions, меж пакетів і розподілені перевірки gateway-watch | Зміни, пов’язані з Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                          | Зміни, пов’язані з Node             |
| `checks`                         | Верифікатор для channel tests на built-artifact плюс сумісність Node 22 лише для push        | Зміни, пов’язані з Node             |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Зміни в документації                |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                    | Зміни, релевантні Python Skills     |
| `checks-windows`                 | Специфічні для Windows тестові смуги                                                         | Зміни, релевантні Windows           |
| `macos-node`                     | Смуга тестів TypeScript на macOS з використанням спільних built artifacts                    | Зміни, релевантні macOS             |
| `macos-swift`                    | Lint, збірка і тести Swift для застосунку macOS                                              | Зміни, релевантні macOS             |
| `android`                        | Модульні тести Android для обох flavor плюс одна збірка debug APK                            | Зміни, релевантні Android           |

## Порядок швидкого завершення при помилці

Завдання впорядковані так, щоб дешеві перевірки завершувалися з помилкою раніше, ніж запускатимуться дорогі:

1. `preflight` визначає, які смуги взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` завершуються з помилкою швидко, не чекаючи важчих завдань із артефактами та платформною матрицею.
3. `build-artifacts` виконується паралельно зі швидкими Linux-смугами, щоб downstream-споживачі могли почати роботу, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформні та runtime-смуги: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, PR-only `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка обмеження за обсягом змін міститься в `scripts/ci-changed-scope.mjs` і покрита модульними тестами в `src/scripts/ci-changed-scope.test.ts`.
Зміни workflow CI перевіряють граф Node CI плюс lint workflow, але самі по собі не примушують запускати нативні збірки для Windows, Android або macOS; ці платформні смуги залишаються обмеженими змінами у вихідному коді відповідних платформ.
Перевірки Node для Windows обмежені специфічними для Windows обгортками process/path, допоміжними засобами npm/pnpm/UI runner, конфігурацією package manager і поверхнями workflow CI, які запускають цю смугу; несуміжні зміни в коді, plugins, install-smoke і зміни лише в тестах залишаються в Linux Node lanes, щоб не займати Windows worker із 16 vCPU для покриття, яке вже перевіряється звичайними test shards.
Окремий workflow `install-smoke` повторно використовує той самий script обмеження за обсягом змін через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається для змін, пов’язаних з install, packaging, контейнерами, production changes у bundled extensions і поверхнями core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише в тестах і документації не займають Docker workers. Його QR package smoke примушує Docker-layer `pnpm install` виконатися повторно, зберігаючи кеш BuildKit pnpm store, тож він усе одно перевіряє встановлення без повторного завантаження залежностей під час кожного запуску. Його gateway-network e2e повторно використовує runtime image, зібраний раніше в цьому завданні, тому додає реальне покриття WebSocket між контейнерами без додавання ще однієї Docker-збірки. Локальна команда `test:docker:all` попередньо збирає один спільний built-app image з `scripts/e2e/Dockerfile` і повторно використовує його в E2E container smoke runners; повторно використовуваний live/E2E workflow відтворює цей шаблон, збираючи та публікуючи один Docker E2E image GHCR із тегом SHA перед Docker-матрицею, а потім запускаючи матрицю з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Тести Docker для QR та installer зберігають власні Dockerfiles, орієнтовані на встановлення. Окреме завдання `docker-e2e-fast` запускає обмежений Docker profile bundled-plugin із тайм-аутом команди 120 секунд: repair залежностей setup-entry плюс ізоляція синтетичних збоїв bundled-loader. Повна bundled matrix для update/channel залишається manual/full-suite, оскільки виконує повторні реальні проходи npm update і doctor repair.

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широке CI-обмеження платформ: production changes у core запускають typecheck core prod плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для тестів core, production changes у extensions запускають typecheck extension prod плюс тести extensions, а зміни лише в тестах extensions запускають лише typecheck/tests для тестів extensions. Зміни в публічному Plugin SDK або plugin-contract розширюють валідацію на extensions, оскільки extensions залежать від цих контрактів core. Релізні version bumps лише в metadata запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config у безпечному режимі запускають усі смуги.

Для push матриця `checks` додає смугу `compat-node22`, яка запускається лише для push. Для pull request ця смуга пропускається, і матриця залишається зосередженою на звичайних test/channel lanes.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося невеликим: channel contracts розділяють покриття registry і core на шість зважених shard загалом, тести bundled plugin збалансовані на шість workers для extensions, auto-reply працює як три збалансовані workers замість шести дрібних workers, а конфігурації agentic gateway/plugin розподілені по наявних source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та miscellaneous plugin tests використовують свої виділені конфігурації Vitest замість спільного всеохопного набору plugin. Широка agents lane використовує спільний file-parallel scheduler Vitest, оскільки в ній домінують імпорти/планування, а не один повільний test file. `runtime-config` виконується разом із shard `infra core-runtime`, щоб спільний runtime shard не володів хвостом виконання. `check-additional` тримає разом compile/canary-роботи для меж пакетів і відокремлює архітектуру runtime topology від покриття gateway watch; shard boundary guard запускає свої невеликі незалежні guards паралельно в межах одного завдання. Gateway watch, channel tests і shard support-boundary для core запускаються паралельно в `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані, зберігаючи свої попередні імена перевірок як легкі завдання-верифікатори та уникаючи при цьому двох додаткових Blacksmith workers і другої черги споживачів артефактів.
Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Flavor third-party не має окремого source set чи manifest; його смуга модульних тестів усе одно компілює цей flavor з прапорцями SMS/call-log у BuildConfig, водночас уникаючи дубльованого завдання пакування debug APK при кожному Android-relevant push.
`extension-fast` є лише для PR, оскільки push-запуски вже виконують повні розподілені смуги bundled plugin. Це зберігає швидкий зворотний зв’язок щодо змінених plugins для рев’ю, не займаючи додатковий Blacksmith worker на `main` для покриття, яке вже наявне в `checks-node-extensions`.

GitHub може позначати замінені новішими завдання як `cancelled`, коли новіший push потрапляє в той самий ref PR або `main`. Ставтеся до цього як до шуму CI, якщо лише найновіший запуск для того самого ref також не завершується з помилкою. Агреговані shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже було замінено новішим.
Ключ concurrency для CI має версію (`CI-v7-*`), щоб zombie-процес на стороні GitHub у старій групі черги не міг безстроково блокувати новіші запуски на main.

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, розподілені перевірки контрактів каналів, shards `check`, крім lint, shards і агрегати `check-additional`, aggregate verifiers тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла раніше стати в чергу |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards тестів Linux Node, shards тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який залишається достатньо чутливим до CPU, тож 8 vCPU коштували більше, ніж давали економії; Docker-збірки install-smoke, де час очікування в черзі для 32 vCPU коштував більше, ніж давав економії                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується резервний `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # перевірити локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за boundary lane
pnpm check          # швидка локальна перевірка: production tsgo + sharded lint + паралельні fast guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + биті посилання
pnpm build          # зібрати dist, коли важливі смуги CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>  # підсумувати загальний час, час у черзі та найповільніші завдання
```
