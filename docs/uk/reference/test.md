---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-26T21:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc575df6f7a6edd72fe5db766b140587e16c2daf887bb3ce3f9d273a0e7cf311
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (сьюти, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес Gateway, який утримує стандартний порт керування, а потім запускає повний набір Vitest з ізольованим портом Gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск Gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття unit-тестами для завантажених файлів, а не загальнорепозиторне покриття всіх файлів. Порогові значення становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit-тестів із покриттям, замість того щоб вважати всі вихідні файли split-lane непокритими.
- `pnpm test:coverage:changed`: запускає unit-покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені шляхи git у відповідні маршрутизовані lane-и Vitest, коли diff торкається лише маршрутизованих вихідних/тестових файлів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску root projects, щоб зміни в wiring перевірялися ширше, коли це потрібно.
- `pnpm test:changed:focused`: запуск змінених тестів для внутрішнього циклу розробки. Він запускає лише точні цілі з прямих змін тестів, сусідніх файлів `*.test.ts`, явних мапінгів вихідних файлів і локального графа імпортів. Широкі зміни/config/package пропускаються замість розгортання до повного резервного запуску changed-test.
- `pnpm changed:lanes`: показує архітектурні lane-и, активовані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Вона запускає core-роботи разом із core test lanes, роботу extension — разом із extension test lanes, зміни лише в тестах — лише з test typecheck/tests, розгортає зміни публічного Plugin SDK або plugin-contract до одного проходу валідації extension, а також залишає version bumps лише в release metadata на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через відповідні lane-и Vitest. Запуски без цілей використовують фіксовані групи shard-ів і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до конфігурацій shard-ів окремих extension, а не до одного гігантського процесу root-project.
- Повні запуски, запуски extension і запуски shard-ів за include-pattern оновлюють локальні дані часу виконання в `.artifacts/vitest-shard-timings.json`; наступні запуски всієї конфігурації використовують ці дані, щоб збалансувати повільні та швидкі shard-и. CI-shard-и за include-pattern додають ім’я shard-а до ключа часу, що дозволяє зберігати видимість часу відфільтрованих shard-ів, не замінюючи дані часу всієї конфігурації. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт часу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane-и, які залишають лише `test/setup.ts`, а сценарії з важким runtime залишаються на наявних lane-ах.
- Вихідні файли із сусідніми тестами спочатку мапляться на цей сусідній тест, а вже потім переходять до ширших glob-шаблонів каталогів. Зміни helper-ів у `test/helpers/channels` і `test/helpers/plugins` використовують локальний граф імпортів, щоб запускати тести, які їх імпортують, замість широкого запуску кожного shard-а, коли шлях залежності точний.
- `auto-reply` тепер також поділяється на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими тестами status/token/helper верхнього рівня.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard-и extension/plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shard-и; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane-а зібраного plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпорту та import-breakdown, водночас і далі використовуючи маршрутизацію відповідних lane-ів для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: той самий import profiling, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` виконує бенчмарк маршрутизованого режиму changed-mode порівняно з нативним запуском root-project для того самого зафіксованого git diff.
- `pnpm test:perf:changed:bench -- --worktree` виконує бенчмарк поточного набору змін worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU- і heap-профілі для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf config Vitest повного набору і записує згруповані дані тривалості разом з JSON/log-артефактами для кожної конфігурації. Агент продуктивності тестів використовує це як базову лінію перед спробами виправлення повільних тестів.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, орієнтованої на продуктивність.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести Gateway (multi-instance WS/HTTP/node pairing). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів встановіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потрібні API-ключі та `LIVE=1` (або специфічний для провайдера `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: один раз збирає спільний образ live-тестів і два образи Docker E2E, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. Базовий образ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для lane-ів installer/update/plugin-dependency; функціональний образ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) заздалегідь готує залежності runtime для bundled plugin для звичайних lane-ів функціональності. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує кількістю слотів процесів і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує чутливим до провайдерів tail pool і за замовчуванням також дорівнює 10. Обмеження для важких lane-ів за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження провайдерів за замовчуванням — один важкий lane на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Для більших хостів використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`. Запуски lane-ів за замовчуванням відтерміновуються на 2 секунди, щоб уникати локальних сплесків створення контейнерів демоном Docker; змінити це можна через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує попередню перевірку Docker, очищує застарілі контейнери OpenClaw E2E, кожні 30 секунд виводить статус активних lane-ів, спільно використовує кеші CLI-інструментів провайдерів між сумісними lane-ами, за замовчуванням один раз повторює тимчасові збої live-провайдерів (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає час виконання lane-ів у `.artifacts/docker-tests/lane-timings.json` для впорядкування від найдовших до найкоротших у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести маніфест lane-ів без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування інтервалу статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0` для вимкнення повторного використання даних часу. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` лише для детермінованих/локальних lane-ів або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для lane-ів live-провайдерів; package aliases — `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. У режимі лише live основні та tail live lane-и об’єднуються в один пул із пріоритетом найдовших, щоб кошики провайдерів могли спільно пакувати навантаження Claude, Codex і Gemini. Runner припиняє планувати нові pooled lane-и після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має резервний timeout 120 хвилин, який можна змінити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; для деяких live/tail lane-ів використовуються жорсткіші обмеження на рівні lane-а. Команди налаштування Docker для CLI backend мають окремий timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Логи кожного lane-а та часи фаз `summary.json` записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: збирає вихідний E2E-контейнер на базі Chromium, запускає raw CDP разом з ізольованим Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots містять URL-посилань, clickables, підняті курсором, iframe refs і метадані frame.
- Live Docker probes для CLI backend можна запускати як цільові lane-и, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Для Claude і Gemini є відповідні aliases `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує працездатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається CI-стабільним, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає seeded-контейнер Gateway і другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, метадані вкладень, поведінку live event queue, маршрутизацію outbound send, а також сповіщення про channel + permissions у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає необроблені stdio MCP frames безпосередньо, щоб smoke-тест відображав те, що міст реально надсилає.

## Локальна перевірка PR

Для локальних перевірок land/gate PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flaky-результат на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Стандартний prompt: “Reply with a single word: ok. No punctuation or extra text.”

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

Preset-и:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва preset-и

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу й збір профілів використовують один і той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Закомічений fixture:

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

Гарантує, що підтримуваний helper runtime для QR завантажується в підтримуваних Node runtime Docker (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Тестування live](/uk/help/testing-live)
