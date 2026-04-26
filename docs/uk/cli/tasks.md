---
read_when:
    - Ви хочете переглянути, перевірити або скасувати записи фонових завдань
    - Ви документуєте команди Task Flow у розділі `openclaw tasks flow`
summary: Довідник CLI для `openclaw tasks` (реєстр фонових завдань і стан Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T03:02:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87f64c2e41704b73cac60924be0f52dad9addec29d543cf5bab06c3045761a0
    source_path: cli/tasks.md
    workflow: 15
---

Переглядайте довготривалі фонові завдання та стан Task Flow. Якщо не вказано підкоманду,
`openclaw tasks` еквівалентно `openclaw tasks list`.

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

Виводить список відстежуваних фонових завдань, починаючи з найновіших.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Показує одне завдання за ідентифікатором завдання, ідентифікатором запуску або ключем сесії.

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

Виявляє застарілі, втрачені, з невдалою доставкою або іншим чином неузгоджені записи завдань і Task Flow. Втрачені завдання, що зберігаються до `cleanupAfter`, є попередженнями; прострочені або непозначені втрачені завдання є помилками.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Попередньо переглядає або застосовує звіряння завдань і Task Flow, проставлення позначок очищення та обрізання.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Переглядає або скасовує довготривалий стан Task Flow у реєстрі завдань.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Фонові завдання](/uk/automation/tasks)
