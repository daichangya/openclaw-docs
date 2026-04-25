---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-25T09:05:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, що утримує типовий control port, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: Запускає набір unit-тестів із V8 coverage (через `vitest.unit.config.ts`). Це поріг unit coverage для завантажених файлів, а не coverage всіх файлів у всьому репозиторії. Пороги становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, поріг вимірює файли, завантажені набором unit coverage, замість того щоб вважати всі файли вихідного коду з розбитих lane непокритими.
- `pnpm test:coverage:changed`: Запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в scoped Vitest lane, коли diff торкається лише routable файлів вихідного коду/тестів. Зміни config/setup, як і раніше, повертаються до нативного запуску root projects, щоб зміни в wiring за потреби повторно запускали ширший набір.
- `pnpm changed:lanes`: показує архітектурні lane, активовані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний changed gate для diff відносно `origin/main`. Він запускає core-роботи з core test lanes, роботу extension з extension test lanes, зміни лише в тестах — тільки з test typecheck/tests, розширює зміни public Plugin SDK або plugin-contract до одного проходу валідації extension, а для підвищень версій лише в release metadata залишає цільові перевірки version/config/root-dependencies.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped Vitest lanes. Запуски без цілей використовують фіксовані shard groups і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до shard configs для кожного extension, а не до одного великого root-project process.
- Повні запуски та запуски shard для extension оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці таймінги, щоб балансувати повільні й швидкі shard. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane, які залишають лише `test/setup.ts`, а випадки з важким runtime — у наявних lane.
- Вибрані допоміжні файли вихідного коду `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lane, щоб невеликі зміни в helper не перезапускали важкі набори, що спираються на runtime.
- `auto-reply` тепер також розділяється на три окремі config (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в конфігураціях усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel plugins, browser plugin і OpenAI виконуються як окремі shard; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane зібраного plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про import-duration та import-breakdown, водночас і далі використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: таке саме профілювання import, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрут changed-mode з нативним запуском root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` порівнює поточний набір змін у worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf config Vitest із повного набору та записує згруповані дані тривалості разом з JSON/log артефактами для кожної config. Агент продуктивності тестів використовує це як baseline перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, спрямованої на продуктивність.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести gateway (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів встановіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: запускає live-тести provider (minimax/zai). Потрібні API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: один раз збирає спільний образ live-test і образ Docker E2E, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами процесів і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і за замовчуванням також дорівнює 10. Обмеження важких lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження provider за замовчуванням дають по одному heavy lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Для потужніших хостів використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`. Запуски lane за замовчуванням розтягуються на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує preflight Docker, очищає застарілі контейнери OpenClaw E2E, виводить статус активних lane кожні 30 секунд, ділить кеші CLI-інструментів provider між сумісними lane, один раз повторює transient live-provider збої за замовчуванням (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає таймінги lane в `.artifacts/docker-tests/lane-timings.json` для подальшого longest-first впорядкування. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести маніфест lane без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` — щоб налаштувати виведення статусу, або `OPENCLAW_DOCKER_ALL_TIMINGS=0` — щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` для лише deterministic/local lane або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для lane live-provider; package aliases: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. У режимі лише live основні й tail live lanes зливаються в один longest-first pool, щоб кошики provider могли разом пакувати завдання Claude, Codex і Gemini. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має резервний timeout у 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; для окремих live/tail lane використовуються жорсткіші обмеження на рівні lane. Команди налаштування Docker для CLI backend мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Логи для кожного lane записуються в `.artifacts/docker-tests/<run-id>/`.
- Live Docker probes для CLI backend можна запускати як цільові lane, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Для Claude і Gemini є відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксійований чат через `/api/chat/completions`. Потрібен придатний ключ live model (наприклад, OpenAI у `~/.profile`), він завантажує зовнішній образ Open WebUI і не вважається стабільним у CI, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає seeded контейнер Gateway і другий контейнер клієнта, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, metadata attachment, поведінку live event queue, outbound send routing, а також сповіщення channel + permission у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP frames безпосередньо, щоб smoke відображав те, що міст насправді надсилає.

## Локальний PR gate

Для локальних перевірок перед злиттям/gate PR запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно спрацьовує на завантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Промпт за замовчуванням: “Відповідай одним словом: ok. Без розділових знаків чи додаткового тексту.”

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

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8 profiles для кожного запуску, щоб вимірювання часу й збирання profile використовували той самий harness.

Угоди для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксований у репозиторії baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксований у репозиторії fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновлення: `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture: `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний потік cold-start у чистому Linux container:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke-тест QR import (Docker)

Переконується, що підтримуваний helper середовища виконання QR завантажується в підтримуваних Docker Node runtimes (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
