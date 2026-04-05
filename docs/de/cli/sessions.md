---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und die letzte Aktivität sehen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen auflisten + Nutzung)
title: sessions
x-i18n:
    generated_at: "2026-04-05T12:39:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47eb55d90bd0681676283310cfa50dcacc95dff7d9a39bf2bb188788c6e5e5ba
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

- Standard: konfigurierter Standardspeicher des Agent
- `--verbose`: ausführliche Protokollierung
- `--agent <id>`: ein konfigurierter Agent-Speicher
- `--all-agents`: alle konfigurierten Agent-Speicher zusammenfassen
- `--store <path>`: expliziter Speicherpfad (kann nicht mit `--agent` oder `--all-agents` kombiniert werden)

`openclaw sessions --all-agents` liest konfigurierte Agent-Speicher. Gateway- und ACP-Sitzungsermittlung
sind umfassender: Sie schließen auch reine Festplattenspeicher ein, die unter
dem Standardstamm `agents/` oder einem templatisierten Stamm `session.store`
gefunden werden. Diese ermittelten Speicher müssen sich in reguläre
`sessions.json`-Dateien innerhalb des Agent-Stamms auflösen; Symlinks und Pfade
außerhalb des Stamms werden übersprungen.

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

- Hinweis zum Geltungsbereich: `openclaw sessions cleanup` wartet nur Sitzungsspeicher/Transkripte. Es bereinigt keine Cron-Ausführungslogs (`cron/runs/<jobId>.jsonl`), die über `cron.runLog.maxBytes` und `cron.runLog.keepLines` in der [Cron-Konfiguration](/automation/cron-jobs#configuration) verwaltet und unter [Cron-Wartung](/automation/cron-jobs#maintenance) erklärt werden.

- `--dry-run`: Vorschau, wie viele Einträge ohne Schreiben bereinigt/begrenzt würden.
  - Im Textmodus gibt dry-run eine Aktionstabelle pro Sitzung aus (`Action`, `Key`, `Age`, `Model`, `Flags`), sodass Sie sehen können, was beibehalten bzw. entfernt würde.
- `--enforce`: Wartung auch anwenden, wenn `session.maintenance.mode` auf `warn` steht.
- `--fix-missing`: Einträge entfernen, deren Transkriptdateien fehlen, auch wenn sie normalerweise noch nicht nach Alter/Anzahl herausfallen würden.
- `--active-key <key>`: einen bestimmten aktiven Schlüssel vor Verdrängung durch das Festplattenbudget schützen.
- `--agent <id>`: Bereinigung für einen konfigurierten Agent-Speicher ausführen.
- `--all-agents`: Bereinigung für alle konfigurierten Agent-Speicher ausführen.
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

- Sitzungskonfiguration: [Konfigurationsreferenz](/gateway/configuration-reference#session)
