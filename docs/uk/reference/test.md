---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (Vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-24T04:19:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a333c438357bc719cc3cda536c417f044ea5e03a366b76d2c7d1ff434ca1587b
    source_path: reference/test.md
    workflow: 15
---

- Повний набір тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, який утримує типовий control port, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб server-тести не конфліктували з уже запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: Запускає unit-набір з покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття unit для завантажених файлів, а не покриття всього репозиторію для всіх файлів. Пороги: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` вимкнено, перевірка вимірює файли, завантажені набором unit coverage, замість того щоб вважати кожен source file у split-lane непокритим.
- `pnpm test:coverage:changed`: Запускає unit coverage лише для файлів, змінених від `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в обмежені смуги Vitest, коли diff торкається лише маршрутизованих source/test файлів. Зміни config/setup усе ще повертаються до native запуску root projects, щоб за потреби зміни wiring повторно запускали все ширше.
- `pnpm changed:lanes`: показує архітектурні смуги, які запускає diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed для diff відносно `origin/main`. Вона запускає core-роботу з core test lanes, роботу extension — з extension test lanes, роботу лише з тестами — лише з test typecheck/tests, розширює зміни в публічному Plugin SDK або plugin-contract до одного проходу перевірки extension і залишає version bump-и лише в release metadata на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі file/directory через обмежені смуги Vitest. Нецільові запуски використовують фіксовані групи shard-ів і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до конфігурацій shard-ів для кожного extension, а не до одного гігантського процесу root-project.
- Повні запуски та запуски shard-ів extension оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; пізніші запуски використовують ці таймінги для балансування повільних і швидких shard-ів. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний artifact таймінгів.
- Вибрані test files у `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі смуги, які залишають лише `test/setup.ts`, залишаючи важкі runtime-випадки у їхніх наявних смугах.
- Вибрані helper source files у `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними sibling tests у цих легких смугах, тож невеликі правки helper-ів не призводять до повторного запуску важких наборів на базі runtime.
- `auto-reply` тепер також розділено на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими тестами status/token/helper верхнього рівня.
- Базова конфігурація Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний runner без ізоляції увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard-и extension/plugin. Важкі channel plugins, browser Plugin і OpenAI виконуються як окремі shard-и; інші групи plugins залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для однієї смуги bundled Plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпортів + розподіл імпортів, водночас зберігаючи маршрутизацію через обмежені смуги для явних цілей file/directory.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених від `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` бенчмаркає маршрутизований шлях changed-mode проти native запуску root-project для того самого зафіксованого git diff.
- `pnpm test:perf:changed:bench -- --worktree` бенчмаркає поточний набір змін у worktree без попереднього commit.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU + heap для unit runner-а (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf config повного набору Vitest і записує згруповані дані тривалості плюс JSON/log artifacts для кожної config. Test Performance Agent використовує це як базову лінію перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, спрямованої на продуктивність.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає gateway smoke-тести end-to-end (кілька екземплярів, WS/HTTP/pairing Node). За замовчуванням використовує `threads` + `isolate: false` з адаптивними worker-ами у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних журналів.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потребує API keys і `LIVE=1` (або специфічного для провайдера `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:all`: один раз збирає спільний image live-test і Docker E2E image, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` при concurrency 4 за замовчуванням. Налаштовуйте через `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Runner припиняє планувати нові pooled lanes після першого збою, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожна lane має timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Смуги, чутливі до запуску або провайдера, виконуються ексклюзивно після паралельного пулу. Журнали для кожної lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксійований chat через `/api/chat/completions`. Потребує придатного ключа live model (наприклад, OpenAI в `~/.profile`), завантажує зовнішній image Open WebUI і не вважається стабільним для CI так, як звичайні unit/e2e-набори.
- `pnpm test:docker:mcp-channels`: запускає seeded контейнер Gateway і другий клієнтський контейнер, який стартує `openclaw mcp serve`, а потім перевіряє виявлення маршрутованих conversation, читання transcript, metadata вкладень, поведінку черги live events, маршрутизацію вихідного надсилання й сповіщення про channel + дозволи в стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі кадри stdio MCP напряму, тому smoke відображає те, що міст справді виводить.

## Локальна перевірка PR

Для локальних перевірок перед приземленням PR запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає флак на навантаженому хості, повторіть запуск один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч latency моделей (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
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

Набори preset-ів:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори preset-ів

Вивід включає `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу й захоплення профілів використовують той самий harness.

Умовності для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke artifact у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує artifact повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксований у репозиторії baseline fixture у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Зафіксований fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновлення: `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture: `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним wizard через pseudo-tty, перевіряє файли config/workspace/session, а потім запускає gateway і виконує `openclaw health`.

## Smoke імпорту QR (Docker)

Гарантує, що підтримуваний runtime helper QR завантажується в підтримуваних Docker Node runtime (типово Node 24, сумісний Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Тестування live](/uk/help/testing-live)
