---
read_when:
    - Запуск або виправлення тестів
summary: Як локально запускати тести (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-06T23:41:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a25236a707860307cc324f32752ad13a53e448bee9341d8df2e11655561e841c
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, який утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, якщо попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Глобальні пороги становлять 70% для lines/branches/functions/statements. Із покриття виключено точки входу з важкою інтеграцією (CLI wiring, gateway/telegram bridges, webchat static server), щоб ціль залишалася зосередженою на логіці, придатній для unit-тестування.
- `pnpm test:coverage:changed`: запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в цільові lane-и Vitest, коли diff торкається лише маршрутизованих source/test файлів. Зміни config/setup, як і раніше, повертаються до нативного запуску root projects, щоб за потреби зміни в wiring запускали ширший прогін повторно.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через цільові lane-и Vitest. Запуски без цілей тепер виконують десять послідовних shard-конфігурацій (`vitest.full-core-unit-src.config.ts`, `vitest.full-core-unit-security.config.ts`, `vitest.full-core-unit-ui.config.ts`, `vitest.full-core-unit-support.config.ts`, `vitest.full-core-contracts.config.ts`, `vitest.full-core-bundled.config.ts`, `vitest.full-core-runtime.config.ts`, `vitest.full-agentic.config.ts`, `vitest.full-auto-reply.config.ts`, `vitest.full-extensions.config.ts`) замість одного великого процесу root-project.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через окремі легкі lane-и, які залишають лише `test/setup.ts`, залишаючи випадки з важким runtime на їхніх наявних lane-ах.
- Вибрані допоміжні source-файли `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lane-ах, тож невеликі зміни в helper-ах не змушують повторно запускати важкі набори з підтримкою runtime.
- `auto-reply` тепер також розбито на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими тестами top-level status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` запускає `vitest.extensions.config.ts`.
- `pnpm test:extensions`: запускає набори extension/plugin.
- `pnpm test:perf:imports`: вмикає звіти Vitest про тривалість імпорту та розбивку імпорту, при цьому все ще використовує маршрутизацію через цільові lane-и для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує benchmark маршрутизованого шляху changed-mode порівняно з нативним запуском root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного набору змін worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU і heap для unit runner (`.artifacts/vitest-runner-profile`).
- Інтеграція gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає gateway end-to-end smoke-тести (багатоекземплярне WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає provider live-тести (minimax/zai). Потрібні API keys і `LIVE=1` (або provider-specific `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксійований чат через `/api/chat/completions`. Потребує придатного live model key (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається настільки стабільним для CI, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає підготовлений контейнер Gateway і другий контейнер-клієнт, який запускає `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання transcript, metadata вкладень, поведінку live черги подій, outbound send routing і Claude-style сповіщення про channel + permission через реальний міст stdio. Перевірка сповіщень Claude читає сирі фрейми stdio MCP безпосередньо, щоб smoke-тест відображав те, що міст насправді надсилає.

## Локальний PR gate

Для локальних перевірок перед злиттям/пропуском PR запустіть:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно спрацьовує на завантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model latency bench (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без розділових знаків або додаткового тексту.”

Останній запуск (2025-12-31, 20 прогонів):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## CLI startup bench

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
- `all`: обидва набори preset

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язковий `--cpu-prof-dir` / `--heap-prof-dir` записує профілі V8 для кожного прогону, тож вимірювання часу і захоплення профілю використовують той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke artifact у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує artifact повного набору в `.artifacts/cli-startup-bench-all.json` з використанням `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксований у репозиторії baseline fixture у `test/fixtures/cli-startup-bench.json` з використанням `runs=5` і `warmup=1`

Зафіксований fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть через `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker є необов’язковим; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start flow у чистому Linux container:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що `qrcode-terminal` завантажується в підтримуваних Docker runtime Node (типово Node 24, сумісно з Node 22):

```bash
pnpm test:docker:qr
```
