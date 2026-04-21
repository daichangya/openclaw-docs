---
read_when:
    - Erklären, wie eingehende Nachrichten zu Antworten werden
    - Erläutern von Sitzungen, Warteschlangenmodi oder Streaming-Verhalten
    - Dokumentieren der Sichtbarkeit des Denkprozesses und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangenbildung und Sichtbarkeit des Denkprozesses
title: Nachrichten
x-i18n:
    generated_at: "2026-04-21T06:23:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf88b91f3489bfdfb4a84f8a287a1ec0b0d71a765dfe27c666c6f43d0145022
    source_path: concepts/messages.md
    workflow: 15
---

# Nachrichten

Diese Seite fasst zusammen, wie OpenClaw eingehende Nachrichten, Sitzungen, Warteschlangenbildung,
Streaming und die Sichtbarkeit des Denkprozesses verarbeitet.

## Nachrichtenfluss (Überblick)

```
Eingehende Nachricht
  -> Routing/Bindings -> Sitzungsschlüssel
  -> Warteschlange (wenn ein Lauf aktiv ist)
  -> Agent-Lauf (Streaming + Tools)
  -> Ausgehende Antworten (Kanalgrenzen + Aufteilung)
```

Wichtige Stellschrauben befinden sich in der Konfiguration:

- `messages.*` für Präfixe, Warteschlangenbildung und Gruppenverhalten.
- `agents.defaults.*` für Standardwerte bei Block-Streaming und Aufteilung.
- Kanalüberschreibungen (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Grenzen und Streaming-Umschalter.

Siehe [Konfiguration](/de/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Kanäle können nach Wiederverbindungen dieselbe Nachricht erneut zustellen. OpenClaw hält einen
kurzlebigen Cache, der nach Kanal/Konto/Peer/Sitzung/Nachrichten-ID geschlüsselt ist, damit doppelte
Zustellungen keinen weiteren Agent-Lauf auslösen.

## Entprellung eingehender Nachrichten

Schnell aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound`
zu einer einzelnen Agent-Runde zusammengefasst werden. Die Entprellung ist pro Kanal + Unterhaltung
begrenzt und verwendet die zuletzt eingegangene Nachricht für Antwort-Threading/IDs.

Konfiguration (globaler Standard + kanalbezogene Überschreibungen):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Hinweise:

- Entprellung gilt für **reine Textnachrichten**; Medien/Anhänge werden sofort durchgereicht.
- Steuerbefehle umgehen die Entprellung, damit sie eigenständig bleiben.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden auf den Hauptsitzungsschlüssel des Agenten zusammengeführt.
- Gruppen/Kanäle erhalten eigene Sitzungsschlüssel.
- Sitzungsspeicher und Transkripte liegen auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet sein, aber der Verlauf wird nicht vollständig
an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie für lange Unterhaltungen ein primäres Gerät,
um auseinanderlaufenden Kontext zu vermeiden. Die Control UI und die TUI zeigen immer das vom Gateway
gestützte Sitzungsprotokoll an und sind daher die Quelle der Wahrheit.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Eingehende Inhalte und Verlaufskontext

OpenClaw trennt den **Prompt-Text** vom **Befehlstext**:

- `Body`: Prompt-Text, der an den Agenten gesendet wird. Er kann Kanal-Umschläge und
  optionale Verlaufs-Wrapper enthalten.
- `CommandBody`: Rohtext des Nutzers für Richtlinien-/Befehls-Parsing.
- `RawBody`: veralteter Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Kanal Verlauf bereitstellt, verwendet er einen gemeinsamen Wrapper:

- `[Chat-Nachrichten seit Ihrer letzten Antwort - für Kontext]`
- `[Aktuelle Nachricht - antworten Sie darauf]`

Bei **Nicht-Direktchats** (Gruppen/Kanäle/Räume) wird dem **Inhalt der aktuellen Nachricht** das
Absender-Label vorangestellt (im selben Stil wie bei Verlaufseinträgen). So bleiben Echtzeit- und
Warteschlangen-/Verlaufsnachrichten im Agent-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_
Lauf ausgelöst haben (zum Beispiel durch Mention-Gating blockierte Nachrichten), und **schließen**
Nachrichten aus, die bereits im Sitzungsprotokoll vorhanden sind.

Das Entfernen von Richtlinien gilt nur für den Abschnitt der **aktuellen Nachricht**, damit der Verlauf
intakt bleibt. Kanäle, die Verlauf umschließen, sollten `CommandBody` (oder
`RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten.
Verlaufspuffer sind konfigurierbar über `messages.groupChat.historyLimit` (globaler
Standard) und kanalbezogene Überschreibungen wie `channels.slack.historyLimit` oder
`channels.telegram.accounts.<id>.historyLimit` (`0` zum Deaktivieren).

## Warteschlangenbildung und Nachfassaktionen

Wenn bereits ein Lauf aktiv ist, können eingehende Nachrichten in die Warteschlange gestellt, in den
aktuellen Lauf gelenkt oder für eine nachfolgende Runde gesammelt werden.

- Konfiguration über `messages.queue` (und `messages.queue.byChannel`).
- Modi: `interrupt`, `steer`, `followup`, `collect` sowie Backlog-Varianten.

Details: [Warteschlangenbildung](/de/concepts/queue).

## Streaming, Aufteilung und Bündelung

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt.
Die Aufteilung beachtet Textgrenzen der Kanäle und vermeidet das Trennen von eingefasstem Code.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, Standard aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (Leerlaufbasierte Bündelung)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Kanalüberschreibungen: `*.blockStreaming` und `*.blockStreamingCoalesce` (Kanäle außer Telegram erfordern explizit `*.blockStreaming: true`)

Details: [Streaming + Aufteilung](/de/concepts/streaming).

## Sichtbarkeit des Denkprozesses und Tokens

OpenClaw kann das Reasoning des Modells sichtbar machen oder verbergen:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalte zählen weiterhin zum Token-Verbrauch, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt das Streamen von Reasoning in die Entwurfsblase.

Details: [Thinking- + Reasoning-Richtlinien](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist zentral in `messages` gebündelt:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade für ausgehende Präfixe) sowie `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und kanalbezogene Standards

Details: [Konfiguration](/de/gateway/configuration-reference#messages) und die Kanaldokumentation.

## Stille Antworten

Das exakte stille Token `NO_REPLY` / `no_reply` bedeutet „keine für Nutzer sichtbare Antwort zustellen“.
OpenClaw löst dieses Verhalten je nach Unterhaltungstyp auf:

- Direkte Unterhaltungen erlauben standardmäßig keine Stille und schreiben eine reine stille
  Antwort in einen kurzen sichtbaren Fallback um.
- Gruppen/Kanäle erlauben standardmäßig Stille.
- Interne Orchestrierung erlaubt standardmäßig Stille.

Standardwerte liegen unter `agents.defaults.silentReply` und
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und
`surfaces.<id>.silentReplyRewrite` können sie pro Oberfläche überschreiben.

## Verwandt

- [Streaming](/de/concepts/streaming) — Nachrichtenzustellung in Echtzeit
- [Retry](/de/concepts/retry) — Wiederholungsverhalten bei der Nachrichtenzustellung
- [Queue](/de/concepts/queue) — Warteschlange für die Nachrichtenverarbeitung
- [Channels](/de/channels) — Integrationen für Messaging-Plattformen
