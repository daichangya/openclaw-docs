---
read_when:
    - Ви хочете переглянути, перевірити або скасувати записи фонових завдань
    - Ви документуєте команди Task Flow у розділі `openclaw tasks flow`
summary: Довідка CLI для `openclaw tasks` (журналу фонових завдань і стану Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T07:00:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

Переглядайте стійкі фонові завдання та стан Task Flow. Без підкоманди
`openclaw tasks` еквівалентна `openclaw tasks list`.

Див. [Фонові завдання](/uk/automation/tasks) щодо життєвого циклу та моделі доставки.

## Використання

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Кореневі параметри

- `--json`: виводить JSON.
- `--runtime <name>`: фільтр за типом: `subagent`, `acp`, `cron` або `cli`.
- `--status <name>`: фільтр за статусом: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` або `lost`.

## Підкоманди

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Показує відстежувані фонові завдання, починаючи з найновіших.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Показує одне завдання за ID завдання, ID запуску або ключем сесії.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Змінює політику сповіщень для запущеного завдання.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Скасовує запущене фонове завдання.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Виявляє застарілі, втрачені, невдало доставлені або іншим чином неузгоджені записи завдань і Task Flow. Втрачені завдання, що зберігаються до `cleanupAfter`, є попередженнями; прострочені або не позначені часовою міткою втрачені завдання є помилками.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Попередньо переглядає або застосовує звіряння завдань і Task Flow, проставлення міток очищення та обрізання.
Для завдань Cron звіряння використовує збережені журнали запусків/стан завдань перед тим, як позначити
старе активне завдання як `lost`, тож завершені запуски Cron не стають хибними помилками аудиту
лише через те, що стан runtime у пам’яті Gateway більше недоступний. Офлайновий аудит CLI
не є авторитетним для набору активних завдань Cron, локального для процесу Gateway.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Переглядає або скасовує стійкий стан Task Flow у журналі завдань.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Фонові завдання](/uk/automation/tasks)
