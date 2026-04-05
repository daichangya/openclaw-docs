---
read_when:
    - Запуск або виправлення тестів
summary: Як запускати тести локально (vitest) і коли використовувати режими force/coverage
title: Тести
x-i18n:
    generated_at: "2026-04-05T18:17:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78390107a9ac2bdc4294d4d0204467c5efdd98faebaf308f3a4597ab966a6d26
    source_path: reference/test.md
    workflow: 15
---

# Тести

- Повний набір інструментів тестування (набори, live, Docker): [Тестування](/uk/help/testing)

- `pnpm test:force`: завершує всі завислі процеси gateway, які утримують типовий контрольний порт, а потім запускає повний набір Vitest з ізольованим портом gateway, щоб серверні тести не конфліктували із запущеним екземпляром. Використовуйте це, якщо попередній запуск gateway залишив порт 18789 зайнятим.
- `pnpm test:coverage`: запускає набір unit-тестів із покриттям V8 (через `vitest.unit.config.ts`). Глобальні пороги становлять 70% для lines/branches/functions/statements. Покриття виключає entrypoint-и з великою часткою інтеграції (обв’язка CLI, мости gateway/telegram, статичний сервер webchat), щоб ціль залишалася зосередженою на логіці, придатній для unit-тестування.
- `pnpm test:coverage:changed`: запускає покриття unit-тестів лише для файлів, змінених відносно `origin/main`.
- `pnpm test:changed`: запускає нативну конфігурацію проєктів Vitest з `--changed origin/main`. Базова конфігурація розглядає файли проєктів/конфігурації як `forceRerunTriggers`, тому зміни в обв’язці за потреби все одно спричиняють ширший повторний запуск.
- `pnpm test`: напряму запускає нативну кореневу конфігурацію проєктів Vitest. Фільтри файлів нативно працюють у всіх налаштованих проєктах.
- Базова конфігурація Vitest тепер типово використовує `pool: "threads"` і `isolate: false`, із увімкненим спільним неізольованим runner-ом у конфігураціях репозиторію.
- `pnpm test:channels` запускає `vitest.channels.config.ts`.
- `pnpm test:extensions` запускає `vitest.extensions.config.ts`.
- `pnpm test:extensions`: запускає набори для extensions/plugins.
- `pnpm test:perf:imports`: вмикає звітність Vitest про тривалість імпорту та деталізацію імпортів для нативного запуску кореневих проєктів.
- `pnpm test:perf:imports:changed`: те саме профілювання імпортів, але лише для файлів, змінених відносно `origin/main`.
- `pnpm test:perf:profile:main`: записує CPU-профіль для головного потоку Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записує CPU- і heap-профілі для unit runner-а (`.artifacts/vitest-runner-profile`).
- Інтеграція gateway: вмикається через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` або `pnpm test:gateway`.
- `pnpm test:e2e`: запускає наскрізні smoke-тести gateway (парування кількох екземплярів WS/HTTP/node). Типово використовує `threads` + `isolate: false` з адаптивною кількістю workers у `vitest.e2e.config.ts`; налаштовується через `OPENCLAW_E2E_WORKERS=<n>`, а для докладних логів установіть `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: запускає live-тести провайдерів (minimax/zai). Потрібні API-ключі та `LIVE=1` (або специфічний для провайдера `*_LIVE_TEST=1`), щоб зняти пропуск.
- `pnpm test:docker:openwebui`: запускає Dockerized OpenClaw + Open WebUI, виконує вхід через Open WebUI, перевіряє `/api/models`, а потім запускає реальний проксійований чат через `/api/chat/completions`. Потребує придатного ключа live-моделі (наприклад, OpenAI у `~/.profile`), завантажує зовнішній образ Open WebUI і не вважається стабільним для CI так, як звичайні набори unit/e2e.
- `pnpm test:docker:mcp-channels`: запускає контейнер Gateway із наповненими даними та другий клієнтський контейнер, який запускає `openclaw mcp serve`, а потім перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень, поведінку черги live-подій, маршрутизацію вихідного надсилання та сповіщення про channel + permission у стилі Claude через реальний міст stdio. Перевірка сповіщень Claude читає сирі stdio MCP-кадри напряму, щоб smoke-тест відображав те, що міст справді надсилає.

## Локальний PR gate

Для локальних перевірок land/gate PR запустіть:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Якщо `pnpm test` нестабільно працює на завантаженому хості, перезапустіть його один раз, перш ніж вважати це регресією, а потім ізолюйте через `pnpm test <path/to/test>`. Для хостів з обмеженою пам’яттю використовуйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенч затримки моделі (локальні ключі)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Використання:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Необов’язкові env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Типовий prompt: “Відповідай одним словом: ok. Без розділових знаків чи додаткового тексту.”

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
- `all`: обидва preset-и

Вивід містить `sampleCount`, avg, p50, p95, min/max, розподіл exit-code/signal і зведення максимального RSS для кожної команди. Необов’язкові `--cpu-prof-dir` / `--heap-prof-dir` записують V8-профілі для кожного запуску, щоб вимірювання часу та збір профілів використовували однаковий harness.

Умовні правила для збереженого виводу:

- `pnpm test:startup:bench:smoke` записує цільовий smoke-артефакт у `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записує артефакт повного набору в `.artifacts/cli-startup-bench-all.json` з `runs=5` і `warmup=1`
- `pnpm test:startup:bench:update` оновлює зафіксований у репозиторії baseline fixture у `test/fixtures/cli-startup-bench.json` з `runs=5` і `warmup=1`

Зафіксований у репозиторії fixture:

- `test/fixtures/cli-startup-bench.json`
- Оновити: `pnpm test:startup:bench:update`
- Порівняти поточні результати з fixture: `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker необов’язковий; це потрібно лише для контейнеризованих onboarding smoke-тестів.

Повний cold-start-процес у чистому Linux-контейнері:

```bash
scripts/e2e/onboard-docker.sh
```

Цей скрипт керує інтерактивним майстром через pseudo-tty, перевіряє файли config/workspace/session, потім запускає gateway і виконує `openclaw health`.

## Smoke-тест імпорту QR (Docker)

Переконується, що `qrcode-terminal` завантажується в підтримуваних Docker runtime Node (типово Node 24, сумісний Node 22):

```bash
pnpm test:docker:qr
```
