---
read_when:
    - Ви хочете запустити один хід агента зі скриптів (необов’язково доставити відповідь)
summary: Довідка CLI для `openclaw agent` (надіслати один хід агента через Gateway)
title: Агент
x-i18n:
    generated_at: "2026-04-24T03:15:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Запустіть хід агента через Gateway (використовуйте `--local` для вбудованого режиму).
Використовуйте `--agent <id>`, щоб напряму націлитися на налаштованого агента.

Передайте принаймні один селектор сесії:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Пов’язане:

- Інструмент надсилання агента: [Agent send](/uk/tools/agent-send)

## Параметри

- `-m, --message <text>`: обов’язкове тіло повідомлення
- `-t, --to <dest>`: одержувач, що використовується для виведення ключа сесії
- `--session-id <id>`: явний ідентифікатор сесії
- `--agent <id>`: ідентифікатор агента; перевизначає прив’язки маршрутизації
- `--thinking <level>`: рівень мислення агента (`off`, `minimal`, `low`, `medium`, `high`, а також підтримувані провайдером власні рівні, як-от `xhigh`, `adaptive` або `max`)
- `--verbose <on|off>`: зберегти рівень деталізації для сесії
- `--channel <channel>`: канал доставки; пропустіть, щоб використовувати основний канал сесії
- `--reply-to <target>`: перевизначення цілі доставки
- `--reply-channel <channel>`: перевизначення каналу доставки
- `--reply-account <id>`: перевизначення облікового запису доставки
- `--local`: запустити вбудованого агента безпосередньо (після попереднього завантаження реєстру Plugin)
- `--deliver`: надіслати відповідь назад до вибраного каналу/цілі
- `--timeout <seconds>`: перевизначити тайм-аут агента (типово 600 або значення конфігурації)
- `--json`: вивести JSON

## Приклади

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Примітки

- Режим Gateway повертається до вбудованого агента, коли запит Gateway завершується помилкою. Використовуйте `--local`, щоб одразу примусово виконати вбудований режим.
- `--local` усе одно спочатку попередньо завантажує реєстр Plugin, тому провайдери, інструменти та канали, надані Plugin, залишаються доступними під час вбудованих запусків.
- `--channel`, `--reply-channel` і `--reply-account` впливають на доставку відповіді, а не на маршрутизацію сесії.
- Коли ця команда запускає повторну генерацію `models.json`, облікові дані провайдера, керовані SecretRef, зберігаються як не секретні маркери (наприклад, назви змінних середовища, `secretref-env:ENV_VAR_NAME` або `secretref-managed`), а не як розкритий відкритий текст секретів.
- Записи маркерів є авторитетними щодо джерела: OpenClaw зберігає маркери з активного знімка конфігурації джерела, а не з розв’язаних значень секретів середовища виконання.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Середовище виконання агента](/uk/concepts/agent)
