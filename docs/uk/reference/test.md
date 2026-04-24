---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-24T22:51:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15e68a95d68dd076862aa168a836c4918876afa1f925ed183f7fde8ec75f24a
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (сьюти, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, який утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: Запускає набір unit-тестів з V8 coverage (через `vitest.unit.config.ts`). Це перевірка unit coverage для завантажених файлів, а не coverage всіх файлів у всьому репозиторії. Порогові значення: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit coverage, замість того щоб вважати кожен файл вихідного коду з розбитих lane непокритим.
- `pnpm test:coverage:changed`: Запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи у scoped lane Vitest, коли diff зачіпає лише routable файли коду/тестів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску root project, щоб за потреби правки wiring перезапускали ширший набір.
- `pnpm changed:lanes`: показує архітектурні lane, які запускаються diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну changed-перевірку для diff відносно `origin/main`. Вона запускає core-роботи з lane core-тестів, extension-роботи з lane extension-тестів, test-only зміни лише з test typecheck/tests, розширює зміни публічного Plugin SDK або plugin-contract до одного проходу валідації extension і залишає підвищення версій лише в release metadata на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped lane Vitest. Запуски без цілей використовують фіксовані shard-групи та розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до per-extension shard config, а не до одного великого процесу root project.
- Повні запуски та запуски shard extension оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці таймінги для балансування повільних і швидких shard. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane, які зберігають лише `test/setup.ts`, залишаючи runtime-важкі випадки у наявних lane.
- Вибрані допоміжні файли коду `plugin-sdk` і `commands` також відображають `pnpm test:changed` на явні сусідні тести в цих легких lane, тому невеликі правки helper не змушують перезапускати важкі набори з підтримкою runtime.
- `auto-reply` тепер також розбивається на три окремі config (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнений у всіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shard; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для однієї bundled lane plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпорту та деталізацію імпорту, при цьому все ще використовує маршрутизацію scoped lane для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує benchmark маршрутизованого шляху changed-mode проти нативного запуску root project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf config Vitest повного набору та записує згруповані дані тривалості разом з JSON/log-артефактами для кожної config. Агент продуктивності тестів використовує це як базову лінію перед спробами виправлення повільних тестів.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, спрямованих на продуктивність.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає smoke-тести gateway end-to-end (pairing кількох екземплярів WS/HTTP/node). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю worker у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: Запускає live-тести провайдерів (minimax/zai). Потрібні API-ключі та `LIVE=1` (або провайдер-специфічний `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:all`: Один раз збирає спільний образ live-тестів і образ Docker E2E, а потім запускає Docker smoke lane з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує кількістю слотів процесів і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує чутливим до провайдера tail pool і за замовчуванням теж дорівнює 10. Обмеження для важких lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=4` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=5`; використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для більших хостів. Запуски lane за замовчуванням відтерміновуються на 2 секунди, щоб уникати локальних сплесків створення контейнерів у Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує попередню перевірку Docker, очищує застарілі контейнери OpenClaw E2E, виводить статус активних lane кожні 30 секунд і зберігає таймінги lane у `.artifacts/docker-tests/lane-timings.json` для впорядкування за принципом longest-first у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести manifest lane без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виводу статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Runner припиняє планувати нові pooled lane після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожна lane має резервний timeout у 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; окремі live/tail lane використовують жорсткіші ліміти для кожної lane. Логи для кожної lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потрібен придатний ключ live-моделі (наприклад, OpenAI у `~/.profile`), завантажується зовнішній образ Open WebUI, і від цього не очікується стабільність у CI на рівні звичайних unit/e2e-наборів.
- `pnpm test:docker:mcp-channels`: Запускає seeded контейнер Gateway і другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє routed discovery розмов, читання transcript, metadata вкладень, поведінку live event queue, маршрутизацію outbound send і сповіщення каналу + дозволів у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає необроблені stdio MCP frames безпосередньо, щоб smoke відображав те, що міст реально надсилає.

## Локальна PR-перевірка

Для локальних перевірок перед злиттям/гейтом PR запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flaky-результат на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 запусків):

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

Набори preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори preset

Вивід включає `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення максимального RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, щоб вимірювання часу та збирання профілів використовували той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з використанням `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з використанням `runs=5` і `warmup=1`

Fixture, закомічений у репозиторій:

- `test/fixtures/cli-startup-bench.json`
- Оновіть через `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture через `pnpm test:startup:bench:check`

## E2E онбордингу (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів онбордингу.

Повний потік cold-start у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, а потім запускає gateway і виконує `openclaw health`.

## Smoke для QR import (Docker)

Переконується, що підтримуваний helper runtime для QR завантажується в підтримуваних Node runtime у Docker (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
