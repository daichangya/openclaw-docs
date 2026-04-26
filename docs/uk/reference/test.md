---
read_when:
    - Запуск або виправлення тестів
summary: Як локально запускати тести (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-26T03:55:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 116cca51d259ca68c2547eac6f271b7ce7df20a995b9405022e06b7615bcfc6d
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес Gateway, який утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір модульних тестів із покриттям V8 (через `vitest.unit.config.ts`). Це поріг покриття модульних тестів для завантажених файлів, а не покриття всього репозиторію для всіх файлів. Пороги становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, поріг вимірює файли, завантажені набором модульного покриття, замість того щоб вважати всі файли вихідного коду з розділених lane непокритими.
- `pnpm test:coverage:changed`: запускає модульне покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені шляхи git у scoped lane Vitest, коли diff зачіпає лише маршрутизовані файли вихідного коду/тестів. Зміни конфігурації/налаштування, як і раніше, повертаються до нативного запуску кореневих проєктів, щоб за потреби зміни wiring повторно широко запускали перевірки.
- `pnpm changed:lanes`: показує архітектурні lane, активовані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний поріг changed для diff відносно `origin/main`. Він запускає основну частину core разом із lane тестів core, роботу розширень із lane тестів розширень, зміни лише в тестах — лише з перевіркою типів/тестами для тестів, розгортає зміни публічного Plugin SDK або plugin-contract до одного проходу валідації розширень і залишає зміни лише в метаданих релізу з підвищенням версії на цільових перевірках версії/конфігурації/кореневих залежностей.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped lane Vitest. Запуски без цілі використовують фіксовані shard-групи та розгортаються до leaf-конфігурацій для локального паралельного виконання; група розширень завжди розгортається до shard-конфігурацій окремих розширень, а не до одного гігантського процесу кореневого проєкту.
- Повні запуски, запуски розширень і shard-запуски за include-патернами оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; подальші запуски всієї конфігурації використовують ці дані, щоб збалансувати повільні та швидкі shard. CI shard за include-патернами додають ім’я shard до ключа часу, що зберігає видимість часу відфільтрованих shard без заміни даних часу для всієї конфігурації. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт часу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через виділені легкі lane, які зберігають лише `test/setup.ts`, залишаючи сценарії з важким runtime у наявних lane.
- Вибрані допоміжні файли вихідного коду `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lane, щоб невеликі зміни в helper не примушували повторно запускати важкі набори з підтримкою runtime.
- `auto-reply` тепер також розділено на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness відповідей не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` та `isolate: false`, а спільний неізольований runner увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard розширень/Plugin. Важкі channel Plugin, browser Plugin і OpenAI запускаються як окремі shard; інші групи Plugin залишаються пакетованими. Використовуйте `pnpm test extensions/<id>` для одного lane пакетного Plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпорту та деталізацію імпорту, водночас і далі використовуючи маршрутизацію scoped lane для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований шлях режиму changed з нативним запуском кореневого проєкту для того самого закоміченого diff git.
- `pnpm test:perf:changed:bench -- --worktree` порівнює поточний набір змін робочого дерева без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для основного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU- і heap-профілі для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf-конфігурацію Vitest повного набору і записує згруповані дані тривалості разом з JSON/лог-артефактами для кожної конфігурації. Агент продуктивності тестів використовує це як базову лінію перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, спрямованих на продуктивність.
- Інтеграція Gateway: увімкнення за запитом через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає smoke-тести gateway end-to-end (парування WS/HTTP/node з кількома екземплярами). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановлюйте `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потребує ключів API та `LIVE=1` (або специфічного для провайдера `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:all`: один раз збирає спільний образ live-тестів і образ Docker E2E, а потім запускає lane Docker smoke з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує кількістю слотів процесів і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує tail-пулом, чутливим до провайдерів, і типово також дорівнює 10. Обмеження важких lane типово встановлено як `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження провайдерів типово дорівнюють одному важкому lane на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для потужніших хостів. Запуски lane типово зміщуються на 2 секунди, щоб уникати локальних штормів створення Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner типово виконує попередню перевірку Docker, очищає застарілі контейнери OpenClaw E2E, виводить статус активних lane кожні 30 секунд, спільно використовує кеші CLI-інструментів провайдерів між сумісними lane, типово один раз повторює транзиторні збої live-провайдерів (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає час lane в `.artifacts/docker-tests/lane-timings.json` для впорядкування за принципом longest-first у подальших запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести маніфест lane без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виводу статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0` для вимкнення повторного використання даних часу. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних lane або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для lane live-провайдерів; пакетні псевдоніми — `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує основні й tail lane live в один пул longest-first, щоб кошики провайдерів могли пакувати роботу Claude, Codex і Gemini разом. Runner припиняє планувати нові об’єднані lane після першого збою, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має резервний timeout у 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; для вибраних live/tail lane використовуються жорсткіші обмеження для окремих lane. Команди налаштування Docker для CLI backend мають окремий timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Логи окремих lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: збирає вихідний контейнер E2E з підтримкою Chromium, запускає raw CDP та ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що знімки ролей CDP містять URL посилань, clickables, підвищені курсором, посилання iframe і метадані фреймів.
- Live Docker probes CLI backend можна запускати як сфокусовані lane, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Claude і Gemini мають відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається стабільним для CI так, як звичайні unit/e2e набори.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із попереднім заповненням і другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє виявлення маршрутованих розмов, читання транскриптів, метадані вкладень, поведінку черги live-подій, маршрутизацію вихідних надсилань і сповіщення про channel та дозволи в стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі кадри stdio MCP безпосередньо, щоб smoke відображав те, що міст фактично надсилає.

## Локальний поріг PR

Для локальних перевірок land/gate PR запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає нестабільний результат на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженнями пам’яті використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч латентності моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий запит: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 запусків):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## Бенч запуску CLI

Скрипт: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Використання:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Набори preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва preset

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу й захоплення профілів використовують один і той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксований у репозиторії baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксований у репозиторії fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновлюйте за допомогою `pnpm test:startup:bench:update`
- Порівнюйте поточні результати з fixture за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start потік у чистому контейнері Linux:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, а потім запускає Gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що підтримуваний допоміжний runtime-модуль QR завантажується в підтримуваних runtime Node у Docker (типово Node 24, сумісність із Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язані матеріали

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
