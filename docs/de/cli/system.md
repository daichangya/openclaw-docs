---
read_when:
    - Sie möchten ein Systemereignis in die Warteschlange stellen, ohne einen Cron-Job zu erstellen
    - Sie müssen Heartbeats aktivieren oder deaktivieren
    - Sie möchten System-Präsenzeinträge prüfen
summary: CLI-Referenz für `openclaw system` (Systemereignisse, Heartbeat, Präsenz)
title: system
x-i18n:
    generated_at: "2026-04-05T12:39:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7d19afde9d9cde8a79b0bb8cec6e5673466f4cb9b575fb40111fc32f4eee5d7
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Hilfsfunktionen auf Systemebene für das Gateway: Systemereignisse in die Warteschlange stellen, Heartbeats steuern
und Präsenz anzeigen.

Alle `system`-Subcommands verwenden Gateway-RPC und akzeptieren die gemeinsamen Client-Flags:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Häufige Befehle

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Stellen Sie ein Systemereignis in der **Hauptsitzung** in die Warteschlange. Der nächste Heartbeat fügt
es als Zeile `System:` in den Prompt ein. Verwenden Sie `--mode now`, um den Heartbeat
sofort auszulösen; `next-heartbeat` wartet auf den nächsten geplanten Tick.

Flags:

- `--text <text>`: erforderlicher Text des Systemereignisses.
- `--mode <mode>`: `now` oder `next-heartbeat` (Standard).
- `--json`: maschinenlesbare Ausgabe.
- `--url`, `--token`, `--timeout`, `--expect-final`: gemeinsame Gateway-RPC-Flags.

## `system heartbeat last|enable|disable`

Heartbeat-Steuerung:

- `last`: letztes Heartbeat-Ereignis anzeigen.
- `enable`: Heartbeats wieder einschalten (verwenden Sie dies, wenn sie deaktiviert wurden).
- `disable`: Heartbeats pausieren.

Flags:

- `--json`: maschinenlesbare Ausgabe.
- `--url`, `--token`, `--timeout`, `--expect-final`: gemeinsame Gateway-RPC-Flags.

## `system presence`

Listet die aktuellen System-Präsenzeinträge auf, die dem Gateway bekannt sind (Nodes,
Instanzen und ähnliche Statuszeilen).

Flags:

- `--json`: maschinenlesbare Ausgabe.
- `--url`, `--token`, `--timeout`, `--expect-final`: gemeinsame Gateway-RPC-Flags.

## Hinweise

- Erfordert ein laufendes Gateway, das über Ihre aktuelle Konfiguration erreichbar ist (lokal oder remote).
- Systemereignisse sind flüchtig und bleiben über Neustarts hinweg nicht erhalten.
