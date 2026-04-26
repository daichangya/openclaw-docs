---
read_when:
    - Запуск або виправлення тестів
summary: Як локально запускати тести (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-26T23:10:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac57661d94c1d83195f63c342356c44130b4c3c459dd3965caad8ae3826266e3
    source_path: reference/test.md
    workflow: 15
---

- Повний набір тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес Gateway, що утримує стандартний control port, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів із V8 coverage (через `vitest.unit.config.ts`). Це coverage-гейт unit-тестів для завантажених файлів, а не coverage всіх файлів у всьому репозиторії. Порогові значення: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, гейт вимірює файли, завантажені набором unit coverage, замість того, щоб вважати всі файли вихідного коду зі split lanes непокритими.
- `pnpm test:coverage:changed`: запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск changed tests. Він запускає точні цілі на основі прямих змін у тестах, сусідніх файлів `*.test.ts`, явних мапінгів вихідного коду та локального графа імпортів. Широкі зміни/config/package пропускаються, якщо вони не мапляться на точні тести.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск changed tests. Використовуйте його, коли редагування test harness/config/package має перейти до ширшої поведінки changed tests у Vitest.
- `pnpm changed:lanes`: показує архітектурні lanes, активовані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумний changed check gate для diff відносно `origin/main`. Він запускає typecheck, lint і guard-команди для зачеплених архітектурних lanes, але не запускає тести Vitest. Використовуйте `pnpm test:changed` або явний `pnpm test <target>` для підтвердження тестами.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped Vitest lanes. Запуски без цілі використовують фіксовані shard groups і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до конфігурацій shard для кожного extension окремо замість одного гігантського root-project process.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією для кожного shard.
- Повні, extension та include-pattern shard-запуски оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; пізніші запуски whole-config використовують ці таймінги, щоб балансувати повільні й швидкі shards. Include-pattern CI shards додають назву shard до ключа таймінгу, що зберігає видимість таймінгів відфільтрованих shard без заміни даних таймінгів whole-config. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через окремі легкі lanes, які залишають лише `test/setup.ts`, а випадки з важким runtime лишаються у своїх наявних lanes.
- Вихідні файли із сусідніми тестами мапляться на цей сусідній тест перед тим, як перейти до ширших glob шаблонів каталогу. Зміни helper у `test/helpers/channels` і `test/helpers/plugins` використовують локальний граф імпортів, щоб запускати тести-імпортери замість широкого запуску кожного shard, коли шлях залежності є точним.
- `auto-reply` тепер також розбито на три окремі конфігурації (`core`, `top-level`, `reply`), щоб reply harness не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний non-isolated runner увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі extension/plugin shards. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shards; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного bundled plugin lane.
- `pnpm test:perf:imports`: вмикає звітність Vitest про import-duration та import-breakdown, зберігаючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує benchmark routed changed-mode path порівняно з нативним root-project run для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного набору змін у worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf config Vitest повного набору й записує згруповані дані тривалості разом з JSON/log артефактами для кожної config. Агент продуктивності тестів використовує це як baseline перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, спрямованої на продуктивність.
- Інтеграція Gateway: opt-in через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає Gateway end-to-end smoke-тести (multi-instance WS/HTTP/node pairing). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потрібні API keys і `LIVE=1` (або специфічний для провайдера `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:all`: збирає спільний образ live-tests, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує bare Node/Git runner image і functional image, який встановлює цей tarball у `/app`, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для lanes installer/update/plugin-dependency; ці lanes монтують попередньо зібраний tarball замість використання скопійованих вихідних кодів репозиторію. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних lanes функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` — єдиний локальний/CI пакувальник пакетів, який перевіряє tarball і `dist/postinstall-inventory.json` перед тим, як Docker почне їх використовувати. Визначення Docker lanes містяться у `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. `node scripts/test-docker-all.mjs --plan-json` виводить план CI, яким володіє scheduler, для вибраних lanes, типів image, потреб package/live-image та перевірок credentials без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує кількістю process slots і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує provider-sensitive tail pool і типово також дорівнює 10. Обмеження для heavy lanes типово: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження для провайдерів типово допускають один heavy lane на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для потужніших хостів. Запуски lanes типово розносяться на 2 секунди, щоб уникнути локальних штормів create у Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner типово виконує попередню перевірку Docker, очищає застарілі контейнери OpenClaw E2E, виводить статус активних lanes кожні 30 секунд, ділиться кешами provider CLI tool між сумісними lanes, типово один раз повторює transient live-provider failures (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає таймінги lanes у `.artifacts/docker-tests/lane-timings.json` для впорядкування від найдовших до найкоротших у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести manifest lanes без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виводу статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0` для вимкнення повторного використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних lanes або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для lanes live-provider; package aliases — `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує main і tail live lanes в один пул longest-first, щоб provider buckets могли разом пакувати роботу Claude, Codex і Gemini. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lanes використовують жорсткіші обмеження для окремих lanes. Команди налаштування Docker для CLI backend мають окремий timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Логи для кожного lane, `summary.json`, `failures.json` і таймінги фаз записуються у `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб переглянути повільні lanes, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб вивести дешеві команди цільового повторного запуску.
- `pnpm test:docker:browser-cdp-snapshot`: збирає source E2E container на базі Chromium, запускає raw CDP плюс ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots містять URL-адреси посилань, clickables, підняті курсором, iframe refs і метадані frame.
- Live Docker probes для CLI backend можна запускати як цільові lanes, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Для Claude і Gemini є відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксійований чат через `/api/chat/completions`. Потребує придатний ключ live model (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається настільки стабільним для CI, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає seeded Gateway container і другий client container, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, метадані attachment, поведінку live event queue, outbound send routing і сповіщення каналу + дозволів у стилі Claude через реальний stdio bridge. Перевірка сповіщення Claude читає сирі stdio MCP frames безпосередньо, щоб smoke відображав те, що міст насправді надсилає.

## Локальний PR gate

Для локальних перевірок перед land/gate PR виконуйте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` флейкить на навантаженому хості, повторіть запуск один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

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

Набори preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори preset

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу й захоплення профілів використовують той самий harness.

Угоди для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює baseline fixture, закомічений у репозиторій, за шляхом `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Fixture, закомічений у репозиторій:

- `test/fixtures/cli-startup-bench.json`
- Оновіть через `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start flow у чистому Linux container:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає Gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що підтримуваний runtime helper QR завантажується в підтримуваних Docker runtime Node (типово Node 24, сумісність із Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
