---
read_when:
    - Ви хочете поставити системну подію в чергу без створення завдання Cron
    - Вам потрібно ввімкнути або вимкнути Heartbeat
    - Ви хочете переглянути записи присутності системи
summary: Довідка CLI для `openclaw system` (системні події, Heartbeat, присутність)
title: Система
x-i18n:
    generated_at: "2026-04-24T04:13:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Допоміжні засоби рівня системи для Gateway: постановка системних подій у чергу, керування Heartbeat
і перегляд присутності.

Усі підкоманди `system` використовують Gateway RPC і приймають спільні прапорці клієнта:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Поширені команди

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Поставити системну подію в чергу в **головній** сесії. Наступний Heartbeat вставить
її як рядок `System:` у prompt. Використовуйте `--mode now`, щоб запустити Heartbeat
негайно; `next-heartbeat` чекає наступного запланованого такту.

Прапорці:

- `--text <text>`: обов’язковий текст системної події.
- `--mode <mode>`: `now` або `next-heartbeat` (типово).
- `--json`: машинозчитуваний вивід.
- `--url`, `--token`, `--timeout`, `--expect-final`: спільні прапорці Gateway RPC.

## `system heartbeat last|enable|disable`

Керування Heartbeat:

- `last`: показати останню подію Heartbeat.
- `enable`: знову ввімкнути Heartbeat (використовуйте це, якщо їх було вимкнено).
- `disable`: призупинити Heartbeat.

Прапорці:

- `--json`: машинозчитуваний вивід.
- `--url`, `--token`, `--timeout`, `--expect-final`: спільні прапорці Gateway RPC.

## `system presence`

Показати поточні записи присутності системи, про які знає Gateway (nodes,
екземпляри та подібні рядки стану).

Прапорці:

- `--json`: машинозчитуваний вивід.
- `--url`, `--token`, `--timeout`, `--expect-final`: спільні прапорці Gateway RPC.

## Примітки

- Потрібен запущений Gateway, доступний через вашу поточну конфігурацію (локальну або віддалену).
- Системні події є тимчасовими й не зберігаються після перезапусків.

## Пов’язане

- [Довідка CLI](/uk/cli)
