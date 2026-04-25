---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-25T22:53:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f8b33a3a9b7769b7abe34095029b147fe6e18fa24925cf62243ff5c51032eb
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, що утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає набір unit-тестів з V8 coverage (через `vitest.unit.config.ts`). Це поріг unit coverage для завантажених файлів, а не загальнорепозиторне all-file coverage. Пороги становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit coverage, замість того щоб вважати кожен файл вихідного коду в розділених lane непокритим.
- `pnpm test:coverage:changed`: Запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи у scoped Vitest lane, коли diff зачіпає лише routable файли вихідного коду або тестів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску root projects, щоб за потреби зміни wiring перевиконувалися ширше.
- `pnpm changed:lanes`: показує архітектурні lane, активовані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Вона запускає core-роботи разом із core test lanes, роботу розширень — разом із extension test lanes, роботи лише з тестами — лише з test typecheck/tests, розгортає зміни публічного Plugin SDK або plugin-contract до одного проходу валідації розширень і залишає version bump, що стосуються лише release metadata, на цільових перевірках version/config/root-dependency.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped Vitest lane. Запуски без цілі використовують фіксовані shard groups і розгортаються до leaf config для локального паралельного виконання; група extension завжди розгортається до shard config для кожного extension окремо, а не до одного великого процесу root-project.
- Повні запуски, запуски extension і запуски shard за include-pattern оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; подальші запуски whole-config використовують ці таймінги для балансування повільних і швидких shard. CI shard за include-pattern додають назву shard до ключа таймінгу, що дозволяє зберігати видимість таймінгів відфільтрованих shard без заміни даних таймінгів whole-config. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через виділені легкі lane, які залишають лише `test/setup.ts`, а кейси з важким runtime залишаються на своїх наявних lane.
- Вибрані допоміжні файли вихідного коду `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними sibling tests у цих легких lane, щоб невеликі зміни helper не змушували повторно запускати важкі набори з runtime.
- `auto-reply` тепер також розділяється на три окремі config (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shard; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного bundled plugin lane.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпортів і import-breakdown, при цьому все ще використовує scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює продуктивність routed changed-mode шляху порівняно з нативним запуском root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного набору змін worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU і heap для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf config Vitest повного набору і записує згруповані дані тривалості разом з артефактами JSON/log для кожної config. Агент продуктивності тестів використовує це як baseline перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, орієнтованої на продуктивність.
- Інтеграція Gateway: увімкнення за запитом через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає end-to-end smoke-тести gateway (парування кількох екземплярів WS/HTTP/node). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних журналів.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потребує API-ключів і `LIVE=1` (або специфічного для провайдера `*_LIVE_TEST=1`) для зняття skip.
- `pnpm test:docker:all`: один раз збирає спільний образ live-тестів і образ Docker E2E, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами процесів і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням теж дорівнює 10. Обмеження важких lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження провайдерів за замовчуванням — один важкий lane на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Для потужніших хостів використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`. Запуски lane за замовчуванням розтягуються на 2 секунди, щоб уникнути локальних пікових навантажень створення в Docker daemon; змініть це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує попередню перевірку Docker, очищує застарілі контейнери OpenClaw E2E, виводить статус активних lane кожні 30 секунд, спільно використовує кеші CLI-інструментів провайдерів між сумісними lane, один раз повторює тимчасові збої live-провайдерів за замовчуванням (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає таймінги lane у `.artifacts/docker-tests/lane-timings.json` для порядку longest-first у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати маніфест lane без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування частоти виведення статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних lane або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для lane live-провайдерів; псевдоніми пакетів — `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує main і tail live lanes в один пул longest-first, щоб provider buckets могли разом пакувати завдання Claude, Codex і Gemini. Runner припиняє планування нових pooled lane після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має резервний timeout 120 хвилин, який можна змінити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; для вибраних live/tail lane використовуються жорсткіші обмеження для окремих lane. Команди налаштування CLI backend Docker мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Логи для кожного lane записуються до `.artifacts/docker-tests/<run-id>/`.
- Live Docker probes для CLI backend можна запускати як сфокусовані lane, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Для Claude і Gemini є відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається настільки CI-stable, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із попередньо підготовленими даними та другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання transcript, metadata вкладень, поведінку live event queue, outbound send routing і сповіщення про channel + permission у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає необроблені stdio MCP frames безпосередньо, щоб smoke-тест відображав те, що міст справді надсилає.

## Локальна перевірка PR

Для локальних перевірок перед land/gate PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно працює на перевантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте проблему через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Reply with a single word: ok. No punctuation or extra text.”

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

Набори:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу і збір профілів використовували один і той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксований у репозиторії baseline fixture за шляхом `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксований у репозиторії fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновити через `pnpm test:startup:bench:update`
- Порівняти поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker є необов’язковим; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що підтримуваний QR runtime helper завантажується в підтримуваних Docker Node runtime (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Тестування live](/uk/help/testing-live)
