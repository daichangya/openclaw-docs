---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-23T13:58:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір для тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує всі завислі процеси gateway, що утримують типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб тести сервера не конфліктували із запущеним екземпляром. Використовуйте це, коли попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Це перевірка unit-покриття завантажених файлів, а не покриття всіх файлів у всьому репозиторії. Порогові значення: 70% для рядків/функцій/інструкцій і 55% для гілок. Оскільки `coverage.all` має значення false, перевірка вимірює файли, завантажені набором unit-покриття, замість того щоб вважати кожен файл вихідного коду з розділених lane непокритим.
- `pnpm test:coverage:changed`: Запускає unit-покриття лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені шляхи git у scoped Vitest lane, коли diff торкається лише routable файлів вихідного коду/тестів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску root projects, щоб за потреби зміни в обв’язці запускали ширший повторний прогін.
- `pnpm changed:lanes`: показує архітектурні lane, які запускаються через diff відносно `origin/main`.
- `pnpm check:changed`: запускає розумну перевірку changed для diff відносно `origin/main`. Вона запускає core-частину разом із lane тестів core, роботу extension — із lane тестів extension, зміни лише в тестах — тільки з typecheck/tests для тестів, розширює зміни публічного Plugin SDK або plugin-contract до перевірки extension, а також залишає метадані релізу з оновленням лише версії на цільових перевірках version/config/root-dependency.
- `pnpm test`: маршрутизує явні цілі файлів/каталогів через scoped Vitest lane. Запуски без конкретної цілі використовують фіксовані групи shard і розгортаються до leaf configs для локального паралельного виконання; група extension завжди розгортається до конфігурацій shard для кожного extension/plugin, а не в один великий процес root-project.
- Повні запуски та запуски shard extension оновлюють локальні дані часу в `.artifacts/vitest-shard-timings.json`; наступні запуски використовують ці дані, щоб балансувати повільні й швидкі shard. Встановіть `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, щоб ігнорувати локальний артефакт часу.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер маршрутизуються через окремі легкі lane, які залишають лише `test/setup.ts`, а важкі з погляду runtime випадки залишаються на наявних lane.
- Вибрані допоміжні файли вихідного коду `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lane, тож невеликі зміни в helper не спричиняють повторний запуск важких наборів, що спираються на runtime.
- `auto-reply` тепер також розділено на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими top-level тестами status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в конфігураціях усього репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` і `pnpm test extensions` запускають усі shard extension/plugin. Важкі channel extension і OpenAI запускаються як окремі shard; інші групи extension залишаються згрупованими. Використовуйте `pnpm test extensions/<id>` для одного lane bundled plugin.
- `pnpm test:perf:imports`: вмикає звітність Vitest щодо тривалості імпорту та розбивки імпортів, водночас і надалі використовуючи scoped lane routing для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` вимірює продуктивність маршрутизованого шляху changed-mode порівняно з нативним запуском root-project для того самого закоміченого git diff.
- `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного набору змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU + heap для unit runner (`.artifacts/vitest-runner-profile`).
- Інтеграція Gateway: увімкнення через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: Запускає наскрізні smoke-тести gateway (pairing кількох екземплярів WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивною кількістю worker у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних журналів встановіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: Запускає live-тести provider (minimax/zai). Потрібні API-ключі та `LIVE=1` (або специфічний для provider `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:all`: Один раз збирає спільний образ live-test і образ Docker E2E, а потім запускає Docker smoke lane з `OPENCLAW_SKIP_DOCKER_BUILD=1` із типовим паралелізмом 4. Налаштовується через `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Runner припиняє планувати нові lane у пулі після першої помилки, якщо не встановлено `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, а кожен lane має тайм-аут 120 хвилин, який можна перевизначити через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lane, чутливі до запуску або provider, виконуються ексклюзивно після паралельного пулу. Журнали для кожного lane записуються в `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: Запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live model (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не очікується настільки стабільним у CI, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: Запускає контейнер Gateway із підготовленими даними та другий контейнер-клієнт, який запускає `openclaw mcp serve`, а потім перевіряє пошук маршрутизованих розмов, читання транскриптів, метадані вкладень, поведінку live-черги подій, маршрутизацію вихідного надсилання та сповіщення про channel + permissions у стилі Claude через реальний міст stdio. Перевірка сповіщення Claude читає сирі stdio MCP-кадри напряму, щоб smoke відображав те, що міст фактично надсилає.

## Локальна перевірка PR

Для локальних перевірок перед злиттям/проходженням PR запустіть:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає flaky-результат на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові змінні середовища: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без розділових знаків або додаткового тексту.”

Останній запуск (2025-12-31, 20 прогонів):

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

Набори preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: обидва набори preset

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують профілі V8 для кожного прогону, щоб вимірювання часу та збір профілів використовували один і той самий harness.

Угоди щодо збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json`, використовуючи `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json`, використовуючи `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновити через `pnpm test:startup:bench:update`
- Порівняти поточні результати з fixture через `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start потік у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт проводить interactive wizard через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Гарантує, що `qrcode-terminal` завантажується в підтримуваних runtime Node у Docker (типово Node 24, сумісний Node 22):

```bash
pnpm test:docker:qr
```
