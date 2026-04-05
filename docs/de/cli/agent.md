---
read_when:
    - Sie einen Agent-Turn aus Skripten ausführen möchten (optional mit Zustellung der Antwort)
summary: CLI-Referenz für `openclaw agent` (einen Agent-Turn über das Gateway senden)
title: agent
x-i18n:
    generated_at: "2026-04-05T12:37:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0627f943bc7f3556318008f76dc6150788cf06927dccdc7d2681acb98f257d56
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Führen Sie einen Agent-Turn über das Gateway aus (verwenden Sie `--local` für eingebettete Ausführung).
Verwenden Sie `--agent <id>`, um direkt einen konfigurierten Agenten anzusprechen.

Geben Sie mindestens einen Sitzungsselektor an:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Verwandt:

- Agent-Send-Tool: [Agent send](/tools/agent-send)

## Optionen

- `-m, --message <text>`: erforderlicher Nachrichtentext
- `-t, --to <dest>`: Empfänger, der zur Ableitung des SessionKeys verwendet wird
- `--session-id <id>`: explizite Sitzungs-ID
- `--agent <id>`: Agent-ID; überschreibt Routing-Bindings
- `--thinking <off|minimal|low|medium|high|xhigh>`: Thinking-Level des Agenten
- `--verbose <on|off>`: Verbose-Level dauerhaft für die Sitzung speichern
- `--channel <channel>`: Zustellungskanal; weglassen, um den Kanal der Hauptsitzung zu verwenden
- `--reply-to <target>`: Überschreibung des Zustellungsziels
- `--reply-channel <channel>`: Überschreibung des Zustellungskanals
- `--reply-account <id>`: Überschreibung des Zustellungskontos
- `--local`: den eingebetteten Agenten direkt ausführen (nach Vorabladen der Plugin-Registry)
- `--deliver`: die Antwort an den ausgewählten Kanal/das ausgewählte Ziel zurücksenden
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

- Der Gateway-Modus greift auf den eingebetteten Agenten zurück, wenn die Gateway-Anfrage fehlschlägt. Verwenden Sie `--local`, um die eingebettete Ausführung direkt zu erzwingen.
- `--local` lädt weiterhin zuerst die Plugin-Registry vor, sodass von Plugins bereitgestellte Provider, Tools und Kanäle während eingebetteter Ausführungen verfügbar bleiben.
- `--channel`, `--reply-channel` und `--reply-account` beeinflussen die Zustellung der Antwort, nicht das Sitzungsrouting.
- Wenn dieser Befehl die Regenerierung von `models.json` auslöst, werden von SecretRef verwaltete Provider-Anmeldedaten als Nicht-Secret-Markierungen gespeichert (zum Beispiel Namen von Umgebungsvariablen, `secretref-env:ENV_VAR_NAME` oder `secretref-managed`), nicht als aufgelöster Geheimtext.
- Marker-Schreibvorgänge sind quellenautoritativ: OpenClaw speichert Marker aus dem aktiven Konfigurations-Snapshot der Quelle, nicht aus aufgelösten Laufzeit-Geheimwerten.
