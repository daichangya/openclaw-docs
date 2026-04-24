---
read_when:
    - Sie möchten Datensätze von Hintergrundaufgaben prüfen, auditieren oder abbrechen
    - Sie dokumentieren TaskFlow-Befehle unter `openclaw tasks flow`
summary: CLI-Referenz für `openclaw tasks` (Protokoll für Hintergrundaufgaben und TaskFlow-Status)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T06:32:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

Prüfen Sie dauerhafte Hintergrundaufgaben und den TaskFlow-Status. Ohne Unterbefehl
ist `openclaw tasks` gleichbedeutend mit `openclaw tasks list`.

Siehe [Background Tasks](/de/automation/tasks) für das Lebenszyklus- und Zustellmodell.

## Verwendung

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

## Root-Optionen

- `--json`: JSON ausgeben.
- `--runtime <name>`: nach Art filtern: `subagent`, `acp`, `cron` oder `cli`.
- `--status <name>`: nach Status filtern: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` oder `lost`.

## Unterbefehle

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Listet verfolgte Hintergrundaufgaben mit den neuesten zuerst auf.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Zeigt eine Aufgabe anhand von Aufgaben-ID, Run-ID oder Sitzungsschlüssel.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Ändert die Benachrichtigungsrichtlinie für eine laufende Aufgabe.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Bricht eine laufende Hintergrundaufgabe ab.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Macht veraltete, verlorene, bei der Zustellung fehlgeschlagene oder anderweitig inkonsistente Datensätze von Aufgaben und TaskFlow sichtbar.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Zeigt eine Vorschau oder wendet die Abstimmung, Cleanup-Markierung und Bereinigung von Aufgaben und TaskFlow an.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Prüft oder bricht dauerhaften TaskFlow-Status unter dem Aufgabenprotokoll ab.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Hintergrundaufgaben](/de/automation/tasks)
