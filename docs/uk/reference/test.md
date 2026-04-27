---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-27T04:12:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4be52b573d7aad2f90d203491e8ccab0eefc507853c75ce14f3b12d52e365e81
    source_path: reference/test.md
    workflow: 15
---

- Повний набір інструментів для тестування (сьюти, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, що утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: запускає набір unit-тестів із V8 coverage (через `vitest.unit.config.ts`). Це поріг unit coverage для завантажених файлів, а не coverage всіх файлів у всьому репозиторії. Пороги становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit coverage, замість того щоб вважати кожен файл вихідного коду в розділених lane непокритим.
- `pnpm test:coverage:changed`: запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: дешевий розумний запуск тестів для змінених файлів. Він запускає точні цілі на основі прямих змін у тестах, сусідніх файлів `*.test.ts`, явних мапінгів вихідного коду та локального графа імпортів. Широкі зміни/config/package пропускаються, якщо вони не мапляться на точні тести.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явний широкий запуск тестів для змінених файлів. Використовуйте його, коли редагування test harness/config/package має перейти до ширшої поведінки changed-test у Vitest.
- `pnpm changed:lanes`: показує архітектурні lane, активовані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed gate для diff відносно `origin/main`. Він запускає typecheck, lint і guard-команди для затронутих архітектурних lane, але не запускає тести Vitest. Для підтвердження тестів використовуйте `pnpm test:changed` або явний `pnpm test <target>`.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped lane Vitest. Запуски без цілей використовують фіксовані групи shard і розгортаються до leaf config для локального паралельного виконання; група extension завжди розгортається до конфігурацій shard для кожного extension окремо, а не до одного великого кореневого процесу проєкту.
- Запуски test wrapper завершуються коротким підсумком `[test] passed|failed|skipped ... in ...`. Власний рядок тривалості Vitest залишається деталізацією на рівні shard.
- Повні запуски, запуски extension і shard-запуски за include-pattern оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; пізніші запуски всієї конфігурації використовують ці таймінги для балансування повільних і швидких shard. CI shard за include-pattern додають ім’я shard до ключа таймінгу, що зберігає видимість таймінгів відфільтрованих shard без заміни даних таймінгу всієї конфігурації. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через окремі легкі lane, які залишають лише `test/setup.ts`, а важкі runtime-випадки залишаються у своїх наявних lane.
- Вихідні файли із сусідніми тестами спочатку мапляться на цей сусідній тест, а вже потім переходять до ширших glob каталогу. Зміни helper під `test/helpers/channels` і `test/helpers/plugins` використовують локальний граф імпортів для запуску тестів, що імпортують їх, замість широкого запуску кожного shard, коли шлях залежності точний.
- `auto-reply` тепер також розділено на три окремі config (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими тестами top-level status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel plugin, browser plugin і OpenAI запускаються як окремі shard; інші групи plugin залишаються батчованими. Використовуйте `pnpm test extensions/<id>` для одного lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпортів і їх розбивку, водночас продовжуючи використовувати scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює шлях routed changed-mode із нативним запуском кореневого проєкту для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` порівнює поточний набір змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profile для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf config Vitest з повного набору й записує згруповані дані тривалості разом з JSON/log-артефактами для кожної config. Test Performance Agent використовує це як базову лінію перед спробами виправлення повільних тестів.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, сфокусованої на продуктивності.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає gateway end-to-end smoke-тести (спарювання кількох екземплярів WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивними worker у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а `OPENCLAW_E2E_VERBOSE=1` вмикає докладні логи.
- `pnpm test:live`: запускає live-тести provider (minimax/zai). Потрібні API-ключі та `LIVE=1` (або специфічний для provider `*_LIVE_TEST=1`), щоб зняти skip.
- `pnpm test:docker:all`: збирає спільний live-test image, один раз пакує OpenClaw як npm tarball, збирає/повторно використовує bare Node/Git runner image плюс functional image, який встановлює цей tarball у `/app`, а потім запускає Docker smoke lane з `OPENCLAW_SKIP_DOCKER_BUILD=1` через weighted scheduler. Bare image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) використовується для lane installer/update/plugin-dependency; ці lane монтують попередньо зібраний tarball замість використання скопійованих вихідних кодів репозиторію. Functional image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) використовується для звичайних lane функціональності зібраного застосунку. `scripts/package-openclaw-for-docker.mjs` — це єдиний локальний/CI пакувальник і він перевіряє tarball разом із `dist/postinstall-inventory.json`, перш ніж Docker почне їх використовувати. Описи Docker lane розміщені в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. `node scripts/test-docker-all.mjs --plan-json` виводить CI-план, яким керує scheduler, для вибраних lane, типів image, потреб package/live-image та перевірок credential без збирання або запуску Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує кількістю слотів процесів і типово дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує tail pool, чутливим до provider, і типово також дорівнює 10. Ліміти важких lane типово такі: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ліміти provider типово дозволяють один важкий lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Для більших хостів використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`. Якщо один lane перевищує ефективний ліміт ваги або ресурсів на хості з низьким паралелізмом, він усе одно може стартувати з порожнього pool і працюватиме самостійно, доки не звільнить ресурси. Запуски lane типово розносяться на 2 секунди, щоб уникнути локальних сплесків створення контейнерів Docker daemon; перевизначайте це через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner типово виконує попередню перевірку Docker, очищає застарілі контейнери OpenClaw E2E, виводить статус активних lane кожні 30 секунд, ділить кеші CLI tool provider між сумісними lane, типово один раз повторює transient live-provider збої (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає таймінги lane в `.artifacts/docker-tests/lane-timings.json` для порядку longest-first у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести маніфест lane без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виводу статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0`, щоб вимкнути повторне використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` для лише детермінованих/локальних lane або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для lane live-provider; псевдоніми package — `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує main і tail live lane в один pool longest-first, щоб provider-bucket могли разом пакувати завдання Claude, Codex і Gemini. Runner припиняє планувати нові pooled lane після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane використовують жорсткіші індивідуальні ліміти. Команди налаштування CLI backend Docker мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (типово 180). Логи для кожного lane, `summary.json`, `failures.json` і таймінги фаз записуються в `.artifacts/docker-tests/<run-id>/`; використовуйте `pnpm test:docker:timings <summary.json>`, щоб дослідити повільні lane, і `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, щоб вивести дешеві команди для точкового повторного запуску.
- `pnpm test:docker:browser-cdp-snapshot`: збирає source E2E container на базі Chromium, запускає raw CDP та ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshot містять URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Live Docker probes для CLI backend можна запускати як сфокусовані lane, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Для Claude і Gemini існують відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потрібен придатний ключ live model (наприклад, OpenAI у `~/.profile`), завантажується зовнішній image Open WebUI, і цей сценарій не вважається настільки CI-stable, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із попереднім заповненням і другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє routed conversation discovery, читання transcript, метадані attachment, поведінку черги live event, маршрутизацію вихідного надсилання та сповіщення про channel + permission у стилі Claude через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP frame безпосередньо, щоб smoke відображав те, що bridge реально надсилає.

## Локальний PR gate

Для локальних перевірок перед злиттям/проходженням gate PR запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` флейкне на завантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без розділових знаків або додаткового тексту.”

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

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і підсумки max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного запуску, тож вимірювання часу й збирання профілів використовують один і той самий harness.

Умовності для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть через `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start сценарій у чистому Linux container:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт проводить інтерактивний майстер через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що підтримуваний helper середовища виконання QR завантажується в підтримуваних середовищах виконання Docker Node (типово Node 24, сумісно з Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Живе тестування](/uk/help/testing-live)
