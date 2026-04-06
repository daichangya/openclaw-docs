---
read_when:
    - Запуск або виправлення тестів
summary: Як локально запускати тести (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-06T18:25:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: daae3a499d78023da270e7d0e190c94a2eee2a3d42cd6c15cf551db48a18e6f4
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, що утримує типовий control port, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб тести сервера не конфліктували з уже запущеним екземпляром. Використовуйте це, якщо після попереднього запуску gateway порт 18789 залишився зайнятим.
- `pnpm test:coverage`: Запускає набір unit-тестів із V8 coverage (через `vitest.unit.config.ts`). Глобальні пороги становлять 70% для lines/branches/functions/statements. Із coverage виключено entrypoint-и з великою інтеграційною складовою (CLI wiring, gateway/telegram bridges, webchat static server), щоб ціль залишалася зосередженою на логіці, придатній для unit-тестування.
- `pnpm test:coverage:changed`: Запускає coverage unit-тестів лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи у scoped lane-и Vitest, коли diff зачіпає лише routable файли вихідного коду/тестів. Зміни конфігурації/налаштування, як і раніше, повертаються до нативного запуску root projects, щоб за потреби зміни wiring перевірялися ширше.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped lane-и Vitest. Запуски без конкретних цілей тепер виконують шість послідовних shard-конфігурацій (`vitest.full-core-unit-src.config.ts`, `vitest.full-core-unit-support.config.ts`, `vitest.full-core-runtime.config.ts`, `vitest.full-agentic.config.ts`, `vitest.full-auto-reply.config.ts`, `vitest.full-extensions.config.ts`) замість одного гігантського процесу root-project.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через окремі легкі lane-и, у яких зберігається лише `test/setup.ts`, а важкі runtime-кейси залишаються у своїх наявних lane-ах.
- Вибрані допоміжні вихідні файли `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lane-ах, щоб невеликі зміни в helper-ах не запускали повторно важкі набори з runtime-backed тестами.
- `auto-reply` тепер також розбито на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими тестами верхнього рівня для status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` запускає `vitest.extensions.config.ts`.
- `pnpm test:extensions`: запускає набори extension/plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest за тривалістю імпорту та деталізацією імпортів, при цьому для явних цілей файлів/каталогів усе ще використовується маршрутизація через scoped lane-и.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює продуктивність маршрутизованого шляху changed-mode порівняно з нативним запуском root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU- і heap-профілі для unit runner (`.artifacts/vitest-runner-profile`).
- Інтеграція gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає наскрізні smoke-тести gateway (multi-instance WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з адаптивною кількістю worker-ів у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: Запускає live-тести провайдерів (minimax/zai). Потрібні API-ключі та `LIVE=1` (або специфічний для провайдера `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксований чат через `/api/chat/completions`. Потрібен придатний ключ live-моделі (наприклад, OpenAI у `~/.profile`), завантажується зовнішній образ Open WebUI, і цей сценарій не вважається CI-stable, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: Запускає seeded Gateway container і другий client container, який піднімає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, metadata вкладень, поведінку live event queue, маршрутизацію outbound send, а також сповіщення про channel + permission у стилі Claude через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP-кадри безпосередньо, щоб smoke відображав те, що bridge реально надсилає.

## Локальний PR gate

Для локальних перевірок land/gate PR запустіть:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно відпрацьовує на навантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без розділових знаків або зайвого тексту.”

Останній запуск (2025-12-31, 20 запусків):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## Бенчмарк запуску CLI

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

Набори preset-ів:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва preset-и

Вихідні дані містять `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу та захоплення профілів використовували один і той самий harness.

Умовні позначення для збережених результатів:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start flow у чистому Linux container:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт проходить інтерактивний wizard через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke-тест QR-імпорту (Docker)

Гарантує, що `qrcode-terminal` завантажується в підтримуваних Docker Node runtime-ах (типово Node 24, сумісно з Node 22):

```bash
pnpm test:docker:qr
```
