---
read_when:
    - Ви виконуєте початкове налаштування без повного онбордингу CLI
    - Ви хочете встановити типовий шлях до робочого простору
summary: Довідка CLI для `openclaw setup` (ініціалізація конфігурації + робочого простору)
title: Налаштування
x-i18n:
    generated_at: "2026-04-24T04:12:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Ініціалізуйте `~/.openclaw/openclaw.json` і робочий простір агента.

Пов’язане:

- Початок роботи: [Початок роботи](/uk/start/getting-started)
- Онбординг CLI: [Онбординг (CLI)](/uk/start/wizard)

## Приклади

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Параметри

- `--workspace <dir>`: каталог робочого простору агента (зберігається як `agents.defaults.workspace`)
- `--wizard`: запустити онбординг
- `--non-interactive`: запустити онбординг без запитів
- `--mode <local|remote>`: режим онбордингу
- `--remote-url <url>`: URL WebSocket віддаленого Gateway
- `--remote-token <token>`: токен віддаленого Gateway

Щоб запустити онбординг через setup:

```bash
openclaw setup --wizard
```

Примітки:

- Звичайний `openclaw setup` ініціалізує конфігурацію + робочий простір без повного потоку онбордингу.
- Онбординг запускається автоматично, коли присутні будь-які прапорці онбордингу (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Огляд встановлення](/uk/install)
