---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-24T05:03:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4ad5808ddbc06c704c9bcf9f780b06f9be94ac213ed22e79d880dedcaa6d3b
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, що утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували з уже запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття unit-тестів для завантажених файлів, а не покриття всіх файлів у всьому репозиторії. Порогові значення: 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка оцінює файли, завантажені набором unit coverage, замість того щоб вважати всі файли вихідного коду в розділених lane-ах непокритими.
- `pnpm test:coverage:changed`: запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в scoped Vitest lane-и, коли diff зачіпає лише routable файли коду/тестів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску кореневих проєктів, щоб зміни wiring за потреби повторно запускали ширший набір.
- `pnpm changed:lanes`: показує архітектурні lane-и, які активує diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку змін для diff відносно `origin/main`. Вона запускає core-роботи з core test lane-ами, роботу розширень — з extension test lane-ами, зміни лише в тестах — лише з test typecheck/tests, розширює зміни публічного Plugin SDK або plugin-contract до одного проходу валідації розширень, і залишає зміни лише в release metadata version bumps на цільових перевірках version/config/root-dependency.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через scoped Vitest lane-и. Запуски без цілей використовують фіксовані групи shard-ів і розгортаються до leaf config-ів для локального паралельного виконання; група extension завжди розгортається до per-extension shard config-ів замість одного великого процесу root-project.
- Повні запуски та запуски shard-ів розширень оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці таймінги, щоб збалансувати повільні й швидкі shard-и. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через виділені легкі lane-и, у яких залишається лише `test/setup.ts`, а важкі runtime-кейси залишаються на своїх наявних lane-ах.
- Вибрані допоміжні файли коду `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` із явними сусідніми тестами в цих легких lane-ах, тому невеликі зміни хелперів не змушують повторно запускати важкі набори, що залежать від runtime.
- `auto-reply` тепер також розділяється на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в конфігураціях усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard-и extension/plugin. Важкі channel plugin-и, browser plugin і OpenAI запускаються як окремі shard-и; інші групи plugin-ів залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпортів і їх розбивку, водночас усе ще використовуючи маршрутизацію scoped lane-ів для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: такий самий профайлінг імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює в режимі benchmark маршрут changed-mode із нативним запуском root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` порівнює поточний набір змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожну leaf config повного набору Vitest і записує згруповані дані тривалості разом із JSON/лог-артефактами для кожної конфігурації. Test Performance Agent використовує це як базову лінію перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після зміни, зосередженої на продуктивності.
- Інтеграція Gateway: вмикається явно через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести gateway (парування multi-instance WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановлюйте `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потрібні API-ключі та `LIVE=1` (або специфічний для провайдера `*_LIVE_TEST=1`) для зняття skip.
- `pnpm test:docker:all`: один раз збирає спільний образ live-тестів і Docker E2E image, а потім запускає Docker smoke lane-и з `OPENCLAW_SKIP_DOCKER_BUILD=1` із типовим рівнем паралелізму 8. Налаштовуйте основний пул через `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`, а хвостовий пул, чутливий до провайдера, через `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`; обидва типово мають значення 8. Runner припиняє планувати нові lane-и в пулі після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а для кожного lane діє тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Логи для кожного lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксійований чат через `/api/chat/completions`. Потрібен робочий ключ live model (наприклад, OpenAI у `~/.profile`), завантажується зовнішній образ Open WebUI, і цей сценарій не очікується стабільним у CI так, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із попереднім заповненням і другий клієнтський контейнер, який піднімає `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання transcript, метадані вкладень, поведінку черги live-подій, маршрутизацію outbound send, а також сповіщення про channel і permission у стилі Claude через реальний stdio bridge. Перевірка сповіщень Claude читає сирі stdio MCP frames безпосередньо, щоб smoke-тест відображав те, що міст насправді надсилає.

## Локальна PR-перевірка

Для локальних перевірок перед злиттям/gate PR запускайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flaky-результат на навантаженому хості, повторіть запуск один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Reply with a single word: ok. No punctuation or extra text.”

Останній запуск (2025-12-31, 20 runs):

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

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва presets

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8 profiles для кожного запуску, тож вимірювання часу й захоплення профілів використовують той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує артефакт цільового smoke у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновлення: `pnpm test:startup:bench:update`
- Порівняння поточних результатів із fixture: `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих onboarding smoke-тестів.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke-тест QR-імпорту (Docker)

Гарантує, що підтримуваний допоміжний QR runtime коректно завантажується в підтримуваних Docker Node runtime-ах (типово Node 24, сумісний Node 22):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Live-тестування](/uk/help/testing-live)
