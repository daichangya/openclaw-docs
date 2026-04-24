---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-24T19:52:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4393562f7ab8471d44ab1573bc14b041fb50058bfc61de628e02328793193ed7
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори, live, Docker): [Testing](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, що утримує типовий control port, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб тести сервера не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає unit-набір із V8 coverage (через `vitest.unit.config.ts`). Це перевірка unit coverage для завантажених файлів, а не coverage всіх файлів у всьому репозиторії. Пороги становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit coverage, замість того щоб вважати непокритими всі файли вихідного коду з розділених lane-ів.
- `pnpm test:coverage:changed`: запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи у scoped Vitest lane-и, коли diff зачіпає лише routable файли вихідного коду/тестів. Зміни config/setup, як і раніше, повертаються до нативного запуску root projects, щоб зміни в wiring за потреби повторно запускали ширший набір.
- `pnpm changed:lanes`: показує архітектурні lane-и, активовані diff-ом відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff-а відносно `origin/main`. Вона запускає core-роботи з core test lane-ами, роботу extensions — з extension test lane-ами, зміни лише в тестах — тільки з test typecheck/tests, розширює зміни в публічному SDK Plugin-ів або plugin-contract до одного проходу валідації extensions і залишає version bumps лише в release metadata на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі file/directory через scoped Vitest lane-и. Запуски без цілі використовують фіксовані shard-групи та розгортаються до leaf config-ів для локального паралельного виконання; група extensions завжди розгортається до shard config-ів для кожного extension/plugin, а не до одного великого процесу root-project.
- Повні запуски та shard-запуски extensions оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці таймінги для балансування повільних і швидких shard-ів. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane-и, які зберігають лише `test/setup.ts`, залишаючи runtime-важкі випадки на їхніх наявних lane-ах.
- Вибрані файли вихідного коду helper-ів `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lane-ах, тож невеликі правки helper-ів не спричиняють повторного запуску важких наборів із підтримкою runtime.
- `auto-reply` тепер також розділено на три окремі config-и (`core`, `top-level`, `reply`), тож harness reply не домінує над легшими тестами top-level status/token/helper.
- Базовий config Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний non-isolated runner увімкнено в config-ах репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard-и extensions/Plugin-ів. Важкі channel Plugin-и, browser Plugin і OpenAI запускаються як окремі shard-и; інші групи Plugin-ів залишаються пакетованими. Використовуйте `pnpm test extensions/<id>` для одного lane вбудованого Plugin-а.
- `pnpm test:perf:imports`: вмикає звітність Vitest про import-duration + import-breakdown, водночас зберігаючи scoped lane routing для явних цілей file/directory.
- `pnpm test:perf:imports:changed`: те саме профілювання import-ів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує benchmark маршрутизованого шляху в режимі changed проти нативного запуску root-project для того самого закоміченого git diff-а.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner-а (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожен leaf config Vitest повного набору й записує згруповані дані тривалості разом з JSON/log артефактами для кожного config-а. Агент продуктивності тестів використовує це як базову лінію перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, зосередженої на продуктивності.
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає smoke-тести gateway end-to-end (multi-instance WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з адаптивними worker-ами у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановлюйте `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потребує API-ключів і `LIVE=1` (або специфічного для провайдера `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:all`: один раз збирає спільний image для live-тестів і Docker E2E image, а потім запускає Docker smoke lane-и з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує слотами процесів і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує tail pool, чутливим до провайдерів, і також типово дорівнює 10. Обмеження важких lane-ів типово становлять `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=4` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=5`; для потужніших хостів використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`. Запуски lane-ів за замовчуванням зсуваються на 2 секунди, щоб уникнути локальних піків створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner припиняє планувати нові pooled lane-и після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Логи для кожного lane-а записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live model (наприклад, OpenAI у `~/.profile`), завантажує зовнішній image Open WebUI і не очікується як CI-стабільний, на відміну від звичайних unit/e2e наборів.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із початковим наповненням і другий контейнер клієнта, який запускає `openclaw mcp serve`, а потім перевіряє виявлення маршрутованих розмов, читання транскриптів, метадані вкладень, поведінку черги live events, маршрутизацію вихідних надсилань і сповіщення про канал + дозволи в стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP-кадри напряму, щоб smoke-тест відображав те, що міст реально надсилає.

## Локальний PR gate

Для локальних перевірок перед приземленням PR/gate запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flaky-результат на навантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark затримки моделей (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типова підказка: “Reply with a single word: ok. No punctuation or extra text.”

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

Preset-и:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва preset-и

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8 profiles для кожного запуску, тому захоплення таймінгів і profiles використовує той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з використанням `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює fixture baseline, що зберігається в репозиторії, у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Fixture, що зберігається в репозиторії:

- `test/fixtures/cli-startup-bench.json`
- Оновлення через `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, а потім запускає gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що підтримуваний runtime helper для QR завантажується в підтримуваних Docker Node runtime-ах (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Testing](/uk/help/testing)
- [Testing live](/uk/help/testing-live)
