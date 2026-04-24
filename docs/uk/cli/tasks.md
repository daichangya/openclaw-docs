---
read_when:
    - Ви хочете переглянути, перевірити або скасувати записи фонових завдань
    - Ви документуєте команди TaskFlow у розділі `openclaw tasks flow`
summary: Довідник CLI для `openclaw tasks` (реєстр фонових завдань і стан TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T04:13:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

Переглядайте стійкі фонові завдання та стан TaskFlow. Без підкоманди
`openclaw tasks` еквівалентно `openclaw tasks list`.

Див. [Фонові завдання](/uk/automation/tasks) щодо моделі життєвого циклу та доставки.

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

- `--json`: вивести JSON.
- `--runtime <name>`: фільтрувати за типом: `subagent`, `acp`, `cron` або `cli`.
- `--status <name>`: фільтрувати за статусом: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` або `lost`.

## Підкоманди

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Показує відстежувані фонові завдання, спочатку найновіші.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Показує одне завдання за task ID, run ID або ключем сесії.

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

Виявляє застарілі, втрачені, з помилками доставки або іншим чином неузгоджені записи завдань і TaskFlow.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Попередньо переглядає або застосовує узгодження завдань і TaskFlow, позначення очищення та обрізання.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Переглядає або скасовує стійкий стан TaskFlow в межах реєстру завдань.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Фонові завдання](/uk/automation/tasks)
