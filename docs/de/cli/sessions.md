---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und die aktuelle Aktivität sehen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen und Nutzung auflisten)
title: Sitzungen
x-i18n:
    generated_at: "2026-04-24T06:32:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Gespeicherte Konversationssitzungen auflisten.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Bereichsauswahl:

- Standard: Speicher des konfigurierten Standard-Agenten
- `--verbose`: ausführliche Protokollierung
- `--agent <id>`: Speicher eines konfigurierten Agenten
- `--all-agents`: alle konfigurierten Agentenspeicher zusammenfassen
- `--store <path>`: expliziter Speicherpfad (kann nicht mit `--agent` oder `--all-agents` kombiniert werden)

`openclaw sessions --all-agents` liest konfigurierte Agentenspeicher. Gateway- und ACP-
Sitzungserkennung sind umfassender: Sie schließen auch nur auf Datenträger vorhandene Speicher ein, die unter dem
Standardstamm `agents/` oder einem templatisierten `session.store`-Stamm gefunden werden. Diese
entdeckten Speicher müssen sich zu regulären `sessions.json`-Dateien innerhalb des
Agentenstamms auflösen; Symlinks und Pfade außerhalb des Stammverzeichnisses werden übersprungen.

JSON-Beispiele:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Bereinigungswartung

Wartung jetzt ausführen (statt auf den nächsten Schreibzyklus zu warten):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` verwendet die Einstellungen `session.maintenance` aus der Konfiguration:

- Hinweis zum Bereich: `openclaw sessions cleanup` pflegt nur Sitzungsspeicher/-transkripte. Es bereinigt keine Cron-Run-Logs (`cron/runs/<jobId>.jsonl`), die über `cron.runLog.maxBytes` und `cron.runLog.keepLines` in der [Cron-Konfiguration](/de/automation/cron-jobs#configuration) verwaltet und in [Cron-Wartung](/de/automation/cron-jobs#maintenance) erläutert werden.

- `--dry-run`: Vorschau, wie viele Einträge bereinigt/begrenzt würden, ohne zu schreiben.
  - Im Textmodus gibt Dry-Run eine aktionsbezogene Tabelle pro Sitzung aus (`Action`, `Key`, `Age`, `Model`, `Flags`), damit Sie sehen können, was behalten bzw. entfernt würde.
- `--enforce`: Wartung anwenden, auch wenn `session.maintenance.mode` auf `warn` steht.
- `--fix-missing`: Einträge entfernen, deren Transkriptdateien fehlen, selbst wenn sie normalerweise noch nicht nach Alter/Anzahl herausfallen würden.
- `--active-key <key>`: einen bestimmten aktiven Schlüssel vor Verdrängung durch Datenträgerbudget schützen.
- `--agent <id>`: Bereinigung für einen konfigurierten Agentenspeicher ausführen.
- `--all-agents`: Bereinigung für alle konfigurierten Agentenspeicher ausführen.
- `--store <path>`: gegen eine bestimmte `sessions.json`-Datei ausführen.
- `--json`: eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Speicher.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Verwandt:

- Sitzungskonfiguration: [Konfigurationsreferenz](/de/gateway/config-agents#session)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Sitzungsverwaltung](/de/concepts/session)
