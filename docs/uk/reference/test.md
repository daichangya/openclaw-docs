---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-23T21:58:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3753fd6f29598318f15a34e623a06fac80430cae34d6b42ad06657a46c72fc54
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (сьюти, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, що утримує порт керування за замовчуванням, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів з покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття unit-тестів для завантажених файлів, а не покриття всього репозиторію для всіх файлів. Порогові значення: 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit-тестів з покриттям, замість того щоб вважати всі файли вихідного коду з розбитих lane непокритими.
- `pnpm test:coverage:changed`: запускає покриття unit-тестів лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені шляхи git у scoped lane Vitest, коли diff торкається лише routable файлів джерела/тестів. Зміни конфігурації/налаштування, як і раніше, повертаються до нативного запуску root projects, щоб за потреби правки wiring запускали ширший прогін.
- `pnpm changed:lanes`: показує архітектурні lane, які запускаються diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Вона запускає core-роботи разом із core test lane, роботу над розширеннями — з extension test lane, роботу лише над тестами — лише з typecheck/tests для тестів, розгортає зміни публічного Plugin SDK або plugin-contract до перевірки розширень і залишає version bump лише в release metadata на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped lane Vitest. Запуски без цілі використовують фіксовані shard-групи та розгортаються в leaf configs для локального паралельного виконання; група розширень завжди розгортається в shard-конфіги для кожного extension/plugin, а не в один великий процес root-project.
- Повні запуски та запуски shard розширень оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці таймінги для балансування повільних і швидких shard. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane, які залишають тільки `test/setup.ts`, а ресурсомісткі runtime-кейси лишаються на своїх наявних lane.
- Вибрані файли вихідного коду helper у `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lane, щоб невеликі правки helper не перезапускали важкі сьюти, що залежать від runtime.
- `auto-reply` тепер також поділяється на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness для reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний non-isolated runner увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel plugin, browser plugin і OpenAI запускаються як окремі shard; інші групи plugin лишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest щодо тривалості імпорту та деталізації імпорту, при цьому все ще використовує маршрутизацію scoped lane для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує benchmark маршрутизованого changed-режиму проти нативного запуску root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU + heap для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf-конфігурацію Vitest повного набору та записує дані про тривалість за групами, а також JSON/лог-артефакти для кожної конфігурації. Агент Test Performance використовує це як базову лінію перед спробою виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, спрямованих на продуктивність.
- Інтеграція Gateway: увімкнення за бажанням через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести gateway (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю worker у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів установіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: запускає live-тести provider (minimax/zai). Потрібні API-ключі та `LIVE=1` (або provider-специфічний `*_LIVE_TEST=1`) для зняття `skip`.
- `pnpm test:docker:all`: один раз збирає спільний образ для live-тестів і Docker E2E image, а потім запускає Docker smoke lane з `OPENCLAW_SKIP_DOCKER_BUILD=1` і типовим паралелізмом 4. Налаштовується через `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Runner припиняє планувати нові pooled lane після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а для кожного lane діє тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lane, чутливі до старту або provider, запускаються ексклюзивно після паралельного пулу. Логи для кожного lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксований чат через `/api/chat/completions`. Потрібен робочий live model key (наприклад, OpenAI у `~/.profile`), завантажується зовнішній образ Open WebUI, і цей сценарій не очікується стабільним у CI так, як звичайні unit/e2e сьюти.
- `pnpm test:docker:mcp-channels`: запускає seeded-контейнер Gateway і другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, метадані вкладень, поведінку live event queue, маршрутизацію outbound send і сповіщення про channel + permissions у стилі Claude через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP-фрейми напряму, щоб smoke-тест відображав те, що міст фактично надсилає.

## Локальна PR-перевірка

Для локальних перевірок перед злиттям PR запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно працює на завантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте проблему через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без розділових знаків або додаткового тексту.”

Останній запуск (2025-12-31, 20 прогонів):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## Benchmark запуску CLI

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

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва preset

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8-профілі для кожного прогону, тож вимірювання часу та захоплення профілю використовують той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновлення: `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture: `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих onboarding smoke-тестів.

Повний cold-start сценарій у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Переконується, що підтримуваний QR runtime helper завантажується в підтримуваних Docker runtime Node (типово Node 24, сумісно з Node 22):

```bash
pnpm test:docker:qr
```
