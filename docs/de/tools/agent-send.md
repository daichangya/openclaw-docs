---
read_when:
    - Sie möchten Agent-Läufe aus Skripten oder über die Befehlszeile auslösen
    - Sie müssen Agent-Antworten programmgesteuert an einen Chat-Kanal zustellen
summary: Agent-Züge über die CLI ausführen und Antworten optional an Kanäle zustellen
title: Agent Send
x-i18n:
    generated_at: "2026-04-05T12:56:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42ea2977e89fb28d2afd07e5f6b1560ad627aea8b72fde36d8e324215c710afc
    source_path: tools/agent-send.md
    workflow: 15
---

# Agent Send

`openclaw agent` führt einen einzelnen Agent-Zug über die Befehlszeile aus, ohne dass
eine eingehende Chat-Nachricht erforderlich ist. Verwenden Sie es für skriptgesteuerte Workflows, Tests und
programmgesteuerte Zustellung.

## Schnellstart

<Steps>
  <Step title="Einen einfachen Agent-Zug ausführen">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Dies sendet die Nachricht über das Gateway und gibt die Antwort aus.

  </Step>

  <Step title="Einen bestimmten Agenten oder eine Sitzung ansprechen">
    ```bash
    # Einen bestimmten Agenten ansprechen
    openclaw agent --agent ops --message "Summarize logs"

    # Eine Telefonnummer ansprechen (leitet den Sitzungsschlüssel ab)
    openclaw agent --to +15555550123 --message "Status update"

    # Eine vorhandene Sitzung wiederverwenden
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Die Antwort an einen Kanal zustellen">
    ```bash
    # An WhatsApp zustellen (Standardkanal)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # An Slack zustellen
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flags

| Flag                          | Beschreibung                                               |
| ----------------------------- | ---------------------------------------------------------- |
| `--message \<text\>`          | Zu sendende Nachricht (erforderlich)                       |
| `--to \<dest\>`               | Sitzungsschlüssel aus einem Ziel ableiten (Telefon, Chat-ID) |
| `--agent \<id\>`              | Einen konfigurierten Agenten ansprechen (verwendet seine `main`-Sitzung) |
| `--session-id \<id\>`         | Eine vorhandene Sitzung anhand der ID wiederverwenden      |
| `--local`                     | Lokale eingebettete Laufzeit erzwingen (Gateway überspringen) |
| `--deliver`                   | Die Antwort an einen Chat-Kanal senden                     |
| `--channel \<name\>`          | Zustellkanal (whatsapp, telegram, discord, slack usw.)     |
| `--reply-to \<target\>`       | Überschreibung des Zustellziels                            |
| `--reply-channel \<name\>`    | Überschreibung des Zustellkanals                           |
| `--reply-account \<id\>`      | Überschreibung der Zustellkonto-ID                         |
| `--thinking \<level\>`        | Thinking-Level setzen (off, minimal, low, medium, high, xhigh) |
| `--verbose \<on\|full\|off\>` | Verbose-Level setzen                                       |
| `--timeout \<seconds\>`       | Agent-Timeout überschreiben                                |
| `--json`                      | Strukturiertes JSON ausgeben                               |

## Verhalten

- Standardmäßig läuft die CLI **über das Gateway**. Fügen Sie `--local` hinzu, um die
  eingebettete Laufzeit auf der aktuellen Maschine zu erzwingen.
- Wenn das Gateway nicht erreichbar ist, fällt die CLI **auf den lokalen eingebetteten Lauf** zurück.
- Sitzungsauswahl: `--to` leitet den Sitzungsschlüssel ab (Gruppen-/Kanalziele
  behalten die Isolation bei; direkte Chats werden zu `main` zusammengeführt).
- Thinking- und Verbose-Flags werden im Sitzungsspeicher persistiert.
- Ausgabe: standardmäßig Klartext oder mit `--json` als strukturierte Payload + Metadaten.

## Beispiele

```bash
# Einfacher Zug mit JSON-Ausgabe
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Zug mit Thinking-Level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# An einen anderen Kanal als die Sitzung zustellen
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Verwandte Themen

- [Referenz zur Agent-CLI](/cli/agent)
- [Sub-Agents](/tools/subagents) — Erzeugen von Sub-Agenten im Hintergrund
- [Sitzungen](/de/concepts/session) — wie Sitzungsschlüssel funktionieren
