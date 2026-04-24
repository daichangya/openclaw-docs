---
read_when:
    - Ви керуєте спареними вузлами (камерами, екраном, canvas)
    - Вам потрібно схвалювати запити або викликати команди вузла
summary: Довідник CLI для `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Вузли
x-i18n:
    generated_at: "2026-04-24T03:15:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Керуйте спареними вузлами (пристроями) і викликайте можливості вузлів.

Пов’язано:

- Огляд вузлів: [Вузли](/uk/nodes)
- Камера: [Вузли камери](/uk/nodes/camera)
- Зображення: [Вузли зображень](/uk/nodes/images)

Поширені параметри:

- `--url`, `--token`, `--timeout`, `--json`

## Поширені команди

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` виводить таблиці очікуваних і спарених вузлів. Рядки спарених вузлів містять час, що минув від останнього підключення (Last Connect).
Використовуйте `--connected`, щоб показувати лише вузли, підключені зараз. Використовуйте `--last-connected <duration>`, щоб
відфільтрувати вузли, які підключалися протягом указаного проміжку часу (наприклад, `24h`, `7d`).

Примітка щодо схвалення:

- `openclaw nodes pending` потребує лише області pairing.
- `openclaw nodes approve <requestId>` успадковує додаткові вимоги до області доступу з
  очікуваного запиту:
  - запит без команди: лише pairing
  - команди вузла без exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Виклик

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Прапорці виклику:

- `--params <json>`: рядок JSON-об’єкта (типово `{}`).
- `--invoke-timeout <ms>`: тайм-аут виклику вузла (типово `15000`).
- `--idempotency-key <key>`: необов’язковий ключ ідемпотентності.
- `system.run` і `system.run.prepare` тут заблоковані; для виконання shell-команд використовуйте інструмент `exec` із `host=node`.

Для виконання shell-команд на вузлі використовуйте інструмент `exec` із `host=node` замість `openclaw nodes run`.
CLI `nodes` тепер зосереджений на можливостях: прямий RPC через `nodes invoke`, а також pairing, камера,
екран, location, canvas і сповіщення.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Вузли](/uk/nodes)
