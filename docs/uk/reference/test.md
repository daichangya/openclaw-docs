---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-24T07:42:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, який утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб тести сервера не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це поріг покриття unit-тестів для завантажених файлів, а не покриття всіх файлів у всьому репозиторії. Пороги становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, поріг вимірює файли, завантажені набором unit coverage, замість того щоб вважати кожен файл вихідного коду з розділених lane непокритим.
- `pnpm test:coverage:changed`: запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в scoped Vitest lanes, коли diff торкається лише routable файлів вихідного коду/тестів. Зміни в config/setup усе одно повертаються до нативного запуску кореневих проєктів, щоб зміни в підключенні запускали ширший повторний прогін там, де це потрібно.
- `pnpm changed:lanes`: показує архітектурні lanes, активовані diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed для diff відносно `origin/main`. Вона запускає core-роботи разом із core test lanes, роботу розширень — разом із extension test lanes, зміни лише в тестах — лише з test typecheck/tests, розгортає зміни в публічному Plugin SDK або plugin-contract до одного проходу валідації розширень і залишає підвищення версій лише в release metadata націленими перевірками version/config/root-dependency.
- `pnpm test`: спрямовує явні цілі file/directory через scoped Vitest lanes. Запуски без цілі використовують фіксовані shard-групи та розгортаються до leaf config для локального паралельного виконання; група extension завжди розгортається до shard config окремих extension/plugin, а не до одного великого процесу root-project.
- Повні запуски та запуски extension shard оновлюють локальні дані таймінгу в `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці таймінги, щоб збалансувати повільні й швидкі shard. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через спеціальні легкі lanes, які зберігають лише `test/setup.ts`, залишаючи runtime-heavy випадки на їхніх наявних lanes.
- Вибрані допоміжні вихідні файли `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lanes, щоб малі зміни в helper не примушували повторно запускати важкі набори тестів із підтримкою runtime.
- `auto-reply` тепер також розбивається на три спеціальні config (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в конфігураціях усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як окремі shard; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпорту та деталізацію імпорту, водночас і далі використовуючи scoped lane routing для явних цілей file/directory.
- `pnpm test:perf:imports:changed`: те саме профілювання імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює за бенчмарком routed changed-mode path із нативним запуском root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` порівнює за бенчмарком поточний набір змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для основного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf config повного набору Vitest і записує згруповані дані тривалості плюс JSON/log артефакти для кожної config. Агент продуктивності тестів використовує це як baseline перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, спрямованих на продуктивність.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає smoke-тести end-to-end для gateway (парування кількох екземплярів WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів установіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потрібні API-ключі та `LIVE=1` (або специфічний для провайдера `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: один раз збирає спільний образ live-test і образ Docker E2E, а потім запускає Docker smoke lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1` з типовим рівнем паралелізму 8. Налаштовуйте основний пул через `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` і чутливий до провайдера хвостовий пул через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`; обидва типово дорівнюють 8. Запуски lanes типово зміщуються на 2 секунди, щоб уникнути локальних штормів створення в Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner припиняє планувати нові pooled lanes після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, і кожен lane має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Логи для кожного lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потрібен придатний ключ live model (наприклад, OpenAI у `~/.profile`), завантажується зовнішній образ Open WebUI, і стабільність у CI тут не очікується такою самою, як для звичайних unit/e2e наборів.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із підготовленими даними та другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє виявлення routed conversation, читання transcript, метадані вкладень, поведінку черги live events, маршрутизацію outbound send, а також сповіщення про channel і permissions у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP frames безпосередньо, тож smoke відображає те, що міст фактично надсилає.

## Локальна PR-перевірка

Для локальних перевірок перед злиттям/проходженням PR виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flaky-результат на завантаженій машині, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для машин з обмеженнями пам’яті використовуйте:

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
- `all`: обидва preset

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8 profiles для кожного запуску, тож вимірювання часу й збирання profiles використовують один і той самий harness.

Угоди щодо збережених результатів:

- `pnpm test:startup:bench:smoke` записує цільовий smoke artifact у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує artifact повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксований у репозиторії baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксований у репозиторії fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновлення через `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker не є обов’язковим; це потрібно лише для контейнеризованих smoke-тестів onboarding.

Повний cold-start сценарій у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт проходить інтерактивний майстер через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що підтримуваний QR runtime helper завантажується в підтримуваних Node runtime у Docker (типово Node 24, сумісність із Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
