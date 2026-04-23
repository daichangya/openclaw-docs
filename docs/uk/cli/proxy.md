---
read_when:
    - Вам потрібно локально перехопити транспортний трафік OpenClaw для налагодження
    - Ви хочете перевірити сеанси проксі налагодження, двійкові об’єкти або вбудовані шаблони запитів
summary: Довідка CLI для `openclaw proxy`, локального проксі для налагодження та інспектора захоплення
title: проксі
x-i18n:
    generated_at: "2026-04-23T07:54:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Запустіть локальний явний проксі налагодження та переглядайте перехоплений трафік.

Це команда налагодження для дослідження на рівні транспорту. Вона може запускати
локальний проксі, виконувати дочірню команду з увімкненим перехопленням, виводити список сеансів перехоплення,
запитувати поширені шаблони трафіку, читати перехоплені двійкові об’єкти та очищати локальні дані
перехоплення.

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

- `start` за замовчуванням використовує `127.0.0.1`, якщо не вказано `--host`.
- `run` запускає локальний проксі налагодження, а потім виконує команду після `--`.
- Перехоплення — це локальні дані налагодження; після завершення використайте `openclaw proxy purge`.
