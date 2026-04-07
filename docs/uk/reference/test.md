---
read_when:
    - Запуск або виправлення тестів
summary: Як локально запускати тести (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-07T08:14:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7c19390f7577b3a29796c67514c96fe4c86c9fa0c7686cd4e377c6e31dcd085
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір інструментів для тестування (набори тестів, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: Завершує будь-який завислий процес gateway, що утримує типовий порт керування, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб тести сервера не конфліктували із запущеним екземпляром. Використовуйте це, якщо попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: Запускає набір модульних тестів із покриттям V8 (через `vitest.unit.config.ts`). Глобальні пороги становлять 70% для рядків/гілок/функцій/інструкцій. Із покриття виключено точки входу з великою інтеграційною складовою (зв’язування CLI, мости gateway/telegram, статичний сервер webchat), щоб ціль залишалася зосередженою на логіці, придатній для модульного тестування.
- `pnpm test:coverage:changed`: Запускає покриття модульних тестів лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: розгортає змінені git-шляхи в цільові lanes Vitest, якщо diff торкається лише маршрутизовних файлів коду/тестів. Зміни конфігурації/налаштування все одно повертаються до нативного запуску кореневих проєктів, щоб зміни у зв’язуванні за потреби повторно запускали тести ширше.
- `pnpm test`: спрямовує явні цілі файлів/каталогів через цільові lanes Vitest. Запуски без указання цілі тепер виконують одинадцять послідовних конфігурацій shard (`vitest.full-core-unit-src.config.ts`, `vitest.full-core-unit-security.config.ts`, `vitest.full-core-unit-ui.config.ts`, `vitest.full-core-unit-support.config.ts`, `vitest.full-core-support-boundary.config.ts`, `vitest.full-core-contracts.config.ts`, `vitest.full-core-bundled.config.ts`, `vitest.full-core-runtime.config.ts`, `vitest.full-agentic.config.ts`, `vitest.full-auto-reply.config.ts`, `vitest.full-extensions.config.ts`) замість одного великого процесу кореневого проєкту.
- Вибрані тестові файли `plugin-sdk` і `commands` тепер спрямовуються через окремі легкі lanes, які залишають лише `test/setup.ts`, а важкі з погляду runtime сценарії — у наявних lanes.
- Вибрані допоміжні файли коду `plugin-sdk` і `commands` також зіставляють `pnpm test:changed` з явними сусідніми тестами в цих легких lanes, щоб невеликі зміни в допоміжних функціях не спричиняли повторний запуск важких наборів із підтримкою runtime.
- `auto-reply` тепер також розділено на три окремі конфігурації (`core`, `top-level`, `reply`), щоб harness reply не домінував над легшими тестами верхнього рівня для status/token/helper.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, а спільний неізольований runner увімкнено в усіх конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` запускає `vitest.extensions.config.ts`.
- `pnpm test:extensions`: запускає набори тестів extension/plugin.
- `pnpm test:perf:imports`: вмикає звітування Vitest про тривалість імпорту та деталізацію імпорту, і при цьому все ще використовує маршрутизацію через цільові lanes для явних цілей файлів/каталогів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпорту, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутний шлях режиму changed із нативним запуском кореневого проєкту для того самого зафіксованого git diff.
- `pnpm test:perf:changed:bench -- --worktree` порівнює поточний набір змін у worktree без попереднього коміту.
- `pnpm test:perf:profile:main`: записує CPU profile для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує профілі CPU + heap для unit runner (`.artifacts/vitest-runner-profile`).
- Інтеграція gateway: увімкнення за бажанням через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести gateway (багатоекземплярне сполучення WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовуйте через `OPENCLAW_E2E_WORKERS=<n>` і встановіть `OPENCLAW_E2E_VERBOSE=1` для докладних логів.
- `pnpm test:live`: запускає live-тести provider (minimax/zai). Потребує API-ключів і `LIVE=1` (або специфічного для provider `*_LIVE_TEST=1`) для зняття пропуску.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не очікується як стабільний для CI, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає seeded-контейнер Gateway і другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень, поведінку черги live-подій, маршрутизацію вихідного надсилання та сповіщення в стилі Claude про channel + permission через реальний міст stdio. Перевірка сповіщень Claude читає необроблені кадри stdio MCP напряму, щоб smoke-тест відображав те, що міст насправді надсилає.

## Локальний PR gate

Для локальних перевірок перед приземленням/проходженням gate PR запустіть:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` дає нестабільний збій на завантаженому хості, перезапустіть один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

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
- `all`: обидва presets

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення max RSS для кожної команди. Необов’язковий `--cpu-prof-dir` / `--heap-prof-dir` записує профілі V8 для кожного запуску, щоб вимірювання часу та захоплення профілю використовували той самий harness.

Умовні позначення для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з використанням `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює закомічений baseline fixture у `test/fixtures/cli-startup-bench.json` з використанням `runs=5` і `warmup=1`

Закомічений fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновіть за допомогою `pnpm test:startup:bench:update`
- Порівняйте поточні результати з fixture за допомогою `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для containerized smoke-тестів onboarding.

Повний cold-start flow у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## QR import smoke (Docker)

Гарантує, що `qrcode-terminal` завантажується в підтримуваних Docker runtime Node (типово Node 24, сумісно з Node 22):

```bash
pnpm test:docker:qr
```
