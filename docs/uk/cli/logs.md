---
read_when:
    - Вам потрібно віддалено переглядати журнали Gateway у реальному часі (без SSH)
    - Вам потрібні рядки журналу у форматі JSON для інструментів
summary: Довідка CLI для `openclaw logs` (читати журнали Gateway у реальному часі через RPC)
title: Журнали
x-i18n:
    generated_at: "2026-04-24T04:12:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Переглядайте журнали файлів Gateway у реальному часі через RPC (працює у віддаленому режимі).

Пов’язане:

- Огляд журналювання: [Журналювання](/uk/logging)
- CLI Gateway: [gateway](/uk/cli/gateway)

## Параметри

- `--limit <n>`: максимальна кількість рядків журналу для повернення (типово `200`)
- `--max-bytes <n>`: максимальна кількість байтів для читання з файлу журналу (типово `250000`)
- `--follow`: стежити за потоком журналу
- `--interval <ms>`: інтервал опитування під час стеження (типово `1000`)
- `--json`: виводити події у форматі JSON, по одному на рядок
- `--plain`: звичайний текстовий вивід без стилізованого форматування
- `--no-color`: вимкнути кольори ANSI
- `--local-time`: відображати часові мітки у вашому локальному часовому поясі

## Спільні параметри Gateway RPC

`openclaw logs` також приймає стандартні прапорці клієнта Gateway:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: токен Gateway
- `--timeout <ms>`: час очікування в мс (типово `30000`)
- `--expect-final`: чекати на фінальну відповідь, коли виклик Gateway підтримується агентом

Коли ви передаєте `--url`, CLI не застосовує автоматично облікові дані з конфігурації або середовища. Явно додайте `--token`, якщо цільовий Gateway вимагає автентифікації.

## Приклади

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Примітки

- Використовуйте `--local-time`, щоб відображати часові мітки у вашому локальному часовому поясі.
- Якщо Gateway local loopback запитує сполучення, `openclaw logs` автоматично повертається до налаштованого локального файлу журналу. Явні цілі `--url` не використовують цей резервний механізм.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Журналювання Gateway](/uk/gateway/logging)
