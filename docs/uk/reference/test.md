---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (`vitest`) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-26T09:31:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- Повний набір для тестування (сьюти, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує будь-який завислий процес gateway, який утримує стандартний порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив зайнятим порт 18789.
- `pnpm test:coverage`: запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка покриття unit-тестів для завантажених файлів, а не покриття всього репозиторію для всіх файлів. Пороги становлять 70% для lines/functions/statements і 55% для branches. Оскільки `coverage.all` має значення false, перевірка оцінює файли, завантажені набором unit coverage, замість того щоб вважати всі файли вихідного коду в розділених lane непокритими.
- `pnpm test:coverage:changed`: запускає unit coverage лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в scoped lane Vitest, коли diff зачіпає лише маршрутизовані файли source/test. Зміни config/setup, як і раніше, повертаються до нативного запуску кореневих project, щоб зміни wiring за потреби повторно запускали ширший набір.
- `pnpm test:changed:focused`: запуск змінених тестів для внутрішнього циклу розробки. Запускає лише точні цілі на основі прямих змін у тестах, сусідніх файлів `*.test.ts`, явних зіставлень source та локального графа імпортів. Широкі зміни config/package пропускаються замість розгортання до повного резервного запуску changed-test.
- `pnpm changed:lanes`: показує архітектурні lane, які запускаються diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну changed-перевірку для diff відносно `origin/main`. Вона запускає core-роботи з lane core tests, роботу extension — з lane extension tests, зміни лише в тестах — лише з typecheck/tests для тестів, розгортає зміни публічного Plugin SDK або plugin-contract до одного проходу валідації extension і залишає підвищення версій лише в metadata release на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі file/directory через scoped lane Vitest. Запуски без цілей використовують фіксовані shard-групи й розгортаються до leaf config для локального паралельного виконання; група extension завжди розгортається до shard config кожного extension окремо, а не до одного великого кореневого process.
- Повні запуски shard, shard extension і shard за include-pattern оновлюють локальні дані таймінгів у `.artifacts/vitest-shard-timings.json`; наступні запуски всього config використовують ці таймінги для балансування повільних і швидких shard. CI-shard за include-pattern додають ім’я shard до ключа таймінгу, що дозволяє зберігати таймінги відфільтрованих shard без заміни даних таймінгів для всього config. Установіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт таймінгів.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через виділені легкі lane, які зберігають лише `test/setup.ts`, залишаючи runtime-важкі сценарії на їхніх наявних lane.
- Файли source із сусідніми тестами зіставляються спочатку з цими сусідніми тестами, перш ніж переходити до ширших glob-шаблонів каталогу. Зміни helper у `test/helpers/channels` і `test/helpers/plugins` використовують локальний граф імпортів, щоб запускати тести, які їх імпортують, замість широкого запуску кожного shard, коли шлях залежності є точним.
- `auto-reply` тепер також розбито на три виділені config (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими top-level тестами status/token/helper.
- Базовий config Vitest тепер за замовчуванням використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в усіх config репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel plugins, browser plugin і OpenAI запускаються як виділені shard; інші групи plugin залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного bundled lane plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпортів і їх розбивку, при цьому все ще використовує маршрутизацію scoped lane для явних цілей file/directory.
- `pnpm test:perf:imports:changed`: той самий профайлінг імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює продуктивність маршрутизованого шляху changed-mode порівняно з нативним запуском кореневих project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує профіль CPU для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU і heap для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: послідовно запускає кожен leaf config Vitest із повного набору й записує згруповані дані про тривалість разом з JSON/log-артефактами для кожного config. Агент Test Performance використовує це як базову лінію перед спробами виправити повільні тести.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: порівнює згруповані звіти після змін, орієнтованих на продуктивність.
- Інтеграція Gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає smoke-тести gateway end-to-end (спарювання кількох екземплярів WS/HTTP/node). За замовчуванням використовує `threads` + `isolate: false` з адаптивною кількістю worker у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів установіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: запускає live-тести provider (minimax/zai). Потрібні API-ключі та `LIVE=1` (або специфічний для provider `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:all`: один раз збирає спільний образ для live-тестів і образ Docker E2E, а потім запускає Docker smoke lane з `OPENCLAW_SKIP_DOCKER_BUILD=1` через зважений планувальник. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` керує кількістю слотів process і за замовчуванням дорівнює 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` керує tail pool, чутливим до provider, і також за замовчуванням дорівнює 10. Обмеження для важких lane за замовчуванням: `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; обмеження для provider за замовчуванням допускають один важкий lane на provider через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` і `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Для більших хостів використовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`. Запуск lane за замовчуванням зміщується на 2 секунди, щоб уникнути локальних штормів створення Docker daemon; перевизначайте через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner за замовчуванням виконує попередню перевірку Docker, очищає застарілі контейнери OpenClaw E2E, кожні 30 секунд виводить статус активних lane, спільно використовує кеші інструментів CLI provider між сумісними lane, один раз за замовчуванням повторює тимчасові збої live-provider (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) і зберігає таймінги lane у `.artifacts/docker-tests/lane-timings.json` для впорядкування за принципом longest-first у наступних запусках. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести manifest lane без запуску Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для налаштування виведення статусу або `OPENCLAW_DOCKER_ALL_TIMINGS=0` для вимкнення повторного використання таймінгів. Використовуйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` для лише детермінованих/локальних lane або `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` лише для lane live-provider; псевдоніми package: `pnpm test:docker:local:all` і `pnpm test:docker:live:all`. Режим лише live об’єднує основні та tail live lane в один pool longest-first, щоб кошики provider могли разом пакувати роботу Claude, Codex і Gemini. Runner припиняє планування нових pooled lane після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має резервний timeout 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; вибрані live/tail lane використовують жорсткіші обмеження для кожного lane. Команди налаштування Docker для CLI backend мають власний timeout через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (за замовчуванням 180). Логи для кожного lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: збирає E2E-контейнер source на базі Chromium, запускає raw CDP і ізольований Gateway, виконує `browser doctor --deep` і перевіряє, що CDP role snapshot містять URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Live Docker probes для CLI backend можна запускати як фокусні lane, наприклад `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` або `pnpm test:docker:live-cli-backend:codex:mcp`. Для Claude і Gemini є відповідні псевдоніми `:resume` і `:mcp`.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, входить через Open WebUI, перевіряє `/api/models`, а потім виконує реальний проксований чат через `/api/chat/completions`. Потребує придатного ключа live model (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається стабільним для CI так, як звичайні unit/e2e-набори.
- `pnpm test:docker:mcp-channels`: запускає seed-контейнер Gateway і другий клієнтський контейнер, який піднімає `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання transcript, метадані attachment, поведінку черги live event, маршрутизацію outbound send і сповіщення про channel + permission у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP frame безпосередньо, щоб smoke відображав те, що міст реально надсилає.

## Локальна PR-перевірка

Для локальних перевірок перед злиттям PR/проходження gate виконайте:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flaky-результат на завантаженому хості, повторіть запуск один раз, перш ніж вважати це регресією, а потім ізолюйте проблему через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки model (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Промпт за замовчуванням: “Відповідай одним словом: ok. Без розділових знаків або додаткового тексту.”

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

Пресети:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва пресети

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8-профілі для кожного запуску, щоб вимірювання часу та збирання профілів використовували один і той самий harness.

Умови збереження виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює baseline fixture, що зберігається в репозиторії, у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Fixture у репозиторії:

- `test/fixtures/cli-startup-bench.json`
- Оновити через `pnpm test:startup:bench:update`
- Порівняти поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker є необов’язковим; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start потік у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що підтримуваний helper QR runtime завантажується в підтримуваних Docker runtime Node (Node 24 за замовчуванням, Node 22 сумісний):

```bash
pnpm test:docker:qr
```

## Пов’язане

- [Тестування](/uk/help/testing)
- [Тестування live](/uk/help/testing-live)
