---
read_when:
    - Вам потрібно локально захоплювати транспортний трафік OpenClaw для налагодження
    - Вам потрібно перевіряти сесії проксі налагодження, великі двійкові об’єкти або вбудовані шаблони запитів
summary: Довідка CLI для `openclaw proxy`, локального проксі налагодження та інспектора захоплень
title: Проксі
x-i18n:
    generated_at: "2026-04-24T04:12:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Запускайте локальний явний проксі налагодження та перевіряйте захоплений трафік.

Це команда для налагодження на рівні транспорту. Вона може запускати
локальний проксі, виконувати дочірню команду з увімкненим захопленням, показувати список сесій захоплення,
робити запити до поширених шаблонів трафіку, читати захоплені великі двійкові об’єкти та очищати локальні дані
захоплення.

## Команди

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Шаблони запитів

`openclaw proxy query --preset <name>` приймає:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Примітки

- `start` типово використовує `127.0.0.1`, якщо не задано `--host`.
- `run` запускає локальний проксі налагодження, а потім виконує команду після `--`.
- Захоплення — це локальні дані налагодження; після завершення використовуйте `openclaw proxy purge`.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth)
