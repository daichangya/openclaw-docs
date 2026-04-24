---
read_when:
    - Sie möchten ein Systemereignis in die Warteschlange stellen, ohne einen Cron-Job zu erstellen
    - Sie müssen Heartbeats aktivieren oder deaktivieren
    - Sie möchten System-Presence-Einträge prüfen
summary: CLI-Referenz für `openclaw system` (Systemereignisse, Heartbeat, Presence)
title: System
x-i18n:
    generated_at: "2026-04-24T06:32:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Helfer auf Systemebene für das Gateway: Systemereignisse in die Warteschlange stellen, Heartbeats steuern
und Presence anzeigen.

Alle `system`-Unterbefehle verwenden Gateway-RPC und akzeptieren die gemeinsamen Client-Flags:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Häufige Befehle

```bash
openclaw system event --text "Nach dringenden Nachfassaktionen suchen" --mode now
openclaw system event --text "Nach dringenden Nachfassaktionen suchen" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Ein Systemereignis in der Warteschlange der **Haupt**sitzung einreihen. Der nächste Heartbeat fügt
es als Zeile `System:` in den Prompt ein. Verwenden Sie `--mode now`, um den Heartbeat
sofort auszulösen; `next-heartbeat` wartet auf den nächsten geplanten Tick.

Flags:

- `--text <text>`: erforderlicher Text des Systemereignisses.
- `--mode <mode>`: `now` oder `next-heartbeat` (Standard).
- `--json`: maschinenlesbare Ausgabe.
- `--url`, `--token`, `--timeout`, `--expect-final`: gemeinsame Gateway-RPC-Flags.

## `system heartbeat last|enable|disable`

Heartbeat-Steuerung:

- `last`: das letzte Heartbeat-Ereignis anzeigen.
- `enable`: Heartbeats wieder aktivieren (verwenden Sie dies, wenn sie deaktiviert wurden).
- `disable`: Heartbeats pausieren.

Flags:

- `--json`: maschinenlesbare Ausgabe.
- `--url`, `--token`, `--timeout`, `--expect-final`: gemeinsame Gateway-RPC-Flags.

## `system presence`

Die aktuellen System-Presence-Einträge auflisten, die dem Gateway bekannt sind (Nodes,
Instanzen und ähnliche Statuszeilen).

Flags:

- `--json`: maschinenlesbare Ausgabe.
- `--url`, `--token`, `--timeout`, `--expect-final`: gemeinsame Gateway-RPC-Flags.

## Hinweise

- Erfordert ein laufendes Gateway, das über Ihre aktuelle Konfiguration erreichbar ist (lokal oder entfernt).
- Systemereignisse sind flüchtig und werden nicht über Neustarts hinweg gespeichert.

## Verwandt

- [CLI-Referenz](/de/cli)
