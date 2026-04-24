---
read_when:
    - Sie möchten Agent-Läufe aus Skripten oder über die Befehlszeile auslösen.
    - Sie möchten Antworten des Agenten programmatisch an einen Chat-Kanal zustellen.
summary: Agent-Turns über die CLI ausführen und Antworten optional an Kanäle zustellen
title: Agent senden
x-i18n:
    generated_at: "2026-04-24T07:01:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent` führt einen einzelnen Agent-Turn über die Befehlszeile aus, ohne dass
eine eingehende Chat-Nachricht erforderlich ist. Verwenden Sie es für skriptbasierte Workflows, Tests und
programmatische Zustellung.

## Schnellstart

<Steps>
  <Step title="Einen einfachen Agent-Turn ausführen">
    ```bash
    openclaw agent --message "Wie ist heute das Wetter?"
    ```

    Dies sendet die Nachricht über das Gateway und gibt die Antwort aus.

  </Step>

  <Step title="Einen bestimmten Agenten oder eine Sitzung ansprechen">
    ```bash
    # Einen bestimmten Agenten ansprechen
    openclaw agent --agent ops --message "Logs zusammenfassen"

    # Eine Telefonnummer ansprechen (leitet Sitzungsschlüssel ab)
    openclaw agent --to +15555550123 --message "Status-Update"

    # Eine bestehende Sitzung wiederverwenden
    openclaw agent --session-id abc123 --message "Die Aufgabe fortsetzen"
    ```

  </Step>

  <Step title="Die Antwort an einen Kanal zustellen">
    ```bash
    # An WhatsApp zustellen (Standardkanal)
    openclaw agent --to +15555550123 --message "Bericht fertig" --deliver

    # An Slack zustellen
    openclaw agent --agent ops --message "Bericht erzeugen" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flags

| Flag                          | Beschreibung                                               |
| ----------------------------- | ---------------------------------------------------------- |
| `--message \<text\>`          | Zu sendende Nachricht (erforderlich)                       |
| `--to \<dest\>`               | Sitzungsschlüssel aus einem Ziel ableiten (Telefon, Chat-ID) |
| `--agent \<id\>`              | Einen konfigurierten Agenten ansprechen (verwendet dessen `main`-Sitzung) |
| `--session-id \<id\>`         | Eine bestehende Sitzung anhand der ID wiederverwenden      |
| `--local`                     | Lokale eingebettete Runtime erzwingen (Gateway überspringen) |
| `--deliver`                   | Die Antwort an einen Chat-Kanal senden                     |
| `--channel \<name\>`          | Zustellkanal (whatsapp, telegram, discord, slack usw.)     |
| `--reply-to \<target\>`       | Überschreibung des Zustellziels                            |
| `--reply-channel \<name\>`    | Überschreibung des Zustellkanals                           |
| `--reply-account \<id\>`      | Überschreibung der Zustell-Account-ID                      |
| `--thinking \<level\>`        | Thinking-Level für das ausgewählte Modellprofil setzen     |
| `--verbose \<on\|full\|off\>` | Verbose-Level setzen                                       |
| `--timeout \<seconds\>`       | Agent-Timeout überschreiben                                |
| `--json`                      | Strukturiertes JSON ausgeben                               |

## Verhalten

- Standardmäßig läuft die CLI **über das Gateway**. Fügen Sie `--local` hinzu, um die
  eingebettete Runtime auf dem aktuellen Rechner zu erzwingen.
- Wenn das Gateway nicht erreichbar ist, **fällt** die CLI auf einen lokalen eingebetteten Lauf zurück.
- Sitzungsauswahl: `--to` leitet den Sitzungsschlüssel ab (Gruppen-/Kanalziele
  erhalten die Isolierung; direkte Chats werden auf `main` reduziert).
- Thinking- und Verbose-Flags werden im Session Store persistiert.
- Ausgabe: standardmäßig Klartext oder mit `--json` strukturierte Nutzlast + Metadaten.

## Beispiele

```bash
# Einfacher Turn mit JSON-Ausgabe
openclaw agent --to +15555550123 --message "Logs nachverfolgen" --verbose on --json

# Turn mit Thinking-Level
openclaw agent --session-id 1234 --message "Posteingang zusammenfassen" --thinking medium

# An einen anderen Kanal als die Sitzung zustellen
openclaw agent --agent ops --message "Alarm" --deliver --reply-channel telegram --reply-to "@admin"
```

## Verwandt

- [Agent-CLI-Referenz](/de/cli/agent)
- [Sub-Agenten](/de/tools/subagents) — Starten von Sub-Agenten im Hintergrund
- [Sitzungen](/de/concepts/session) — wie Sitzungsschlüssel funktionieren
