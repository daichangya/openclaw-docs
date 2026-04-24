---
read_when:
    - Sie möchten einen Agent-Durchlauf aus Skripten ausführen (optional mit Zustellung der Antwort)
summary: CLI-Referenz für `openclaw agent` (einen Agent-Durchlauf über das Gateway senden)
title: Agent
x-i18n:
    generated_at: "2026-04-24T06:30:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Einen Agent-Durchlauf über das Gateway ausführen (verwenden Sie `--local` für eingebettet).
Verwenden Sie `--agent <id>`, um direkt einen konfigurierten Agenten anzusprechen.

Geben Sie mindestens einen Sitzungsselektor an:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Verwandt:

- Tool zum Senden an einen Agenten: [Agent send](/de/tools/agent-send)

## Optionen

- `-m, --message <text>`: erforderlicher Nachrichtentext
- `-t, --to <dest>`: Empfänger, der zur Ableitung des Sitzungsschlüssels verwendet wird
- `--session-id <id>`: explizite Sitzungs-ID
- `--agent <id>`: Agent-ID; überschreibt Routing-Bindungen
- `--thinking <level>`: Thinking-Stufe des Agenten (`off`, `minimal`, `low`, `medium`, `high` sowie providerunterstützte benutzerdefinierte Stufen wie `xhigh`, `adaptive` oder `max`)
- `--verbose <on|off>`: Verbose-Stufe für die Sitzung persistieren
- `--channel <channel>`: Zustellungskanal; weglassen, um den Hauptkanal der Sitzung zu verwenden
- `--reply-to <target>`: Überschreibung des Zustellziels
- `--reply-channel <channel>`: Überschreibung des Zustellungskanals
- `--reply-account <id>`: Überschreibung des Zustellungskontos
- `--local`: den eingebetteten Agenten direkt ausführen (nach Vorladen der Plugin-Registry)
- `--deliver`: die Antwort zurück an den ausgewählten Kanal/das ausgewählte Ziel senden
- `--timeout <seconds>`: Agent-Timeout überschreiben (Standard 600 oder Konfigurationswert)
- `--json`: JSON ausgeben

## Beispiele

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Hinweise

- Der Gateway-Modus greift auf den eingebetteten Agenten zurück, wenn die Gateway-Anfrage fehlschlägt. Verwenden Sie `--local`, um die eingebettete Ausführung von vornherein zu erzwingen.
- `--local` lädt die Plugin-Registry weiterhin zuerst vor, sodass von Plugins bereitgestellte Provider, Tools und Kanäle auch bei eingebetteten Ausführungen verfügbar bleiben.
- `--channel`, `--reply-channel` und `--reply-account` wirken sich auf die Antwortzustellung aus, nicht auf das Sitzungsrouting.
- Wenn dieser Befehl eine Regenerierung von `models.json` auslöst, werden von SecretRef verwaltete Provider-Anmeldedaten als nicht geheime Marker persistiert (zum Beispiel Namen von Umgebungsvariablen, `secretref-env:ENV_VAR_NAME` oder `secretref-managed`), nicht als aufgelöster Klartext geheimer Werte.
- Marker-Schreibvorgänge sind quellautoritätlich: OpenClaw persistiert Marker aus dem aktiven Quellkonfigurations-Snapshot, nicht aus aufgelösten Laufzeit-Secret-Werten.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Agent-Laufzeit](/de/concepts/agent)
