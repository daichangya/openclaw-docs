---
read_when:
    - Erklären, wie eingehende Nachrichten zu Antworten werden
    - Klären von Sitzungen, Warteschlangenmodi oder Streaming-Verhalten
    - Dokumentieren der Sichtbarkeit von Reasoning und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit von Reasoning
title: Nachrichten
x-i18n:
    generated_at: "2026-04-05T12:40:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475f892bd534fdb10a2ee5d3c57a3d4a7fb8e1ab68d695189ba186004713f6f3
    source_path: concepts/messages.md
    workflow: 15
---

# Nachrichten

Diese Seite führt zusammen, wie OpenClaw eingehende Nachrichten, Sitzungen, Warteschlangen,
Streaming und die Sichtbarkeit von Reasoning verarbeitet.

## Nachrichtenfluss (allgemein)

```
Eingehende Nachricht
  -> Routing/Bindings -> Sitzungsschlüssel
  -> Warteschlange (wenn ein Lauf aktiv ist)
  -> Agent-Lauf (Streaming + Tools)
  -> Ausgehende Antworten (Kanallimits + Chunking)
```

Wichtige Stellschrauben befinden sich in der Konfiguration:

- `messages.*` für Präfixe, Warteschlangen und Gruppenverhalten.
- `agents.defaults.*` für Standardwerte bei Block-Streaming und Chunking.
- Kanalüberschreibungen (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Obergrenzen und Streaming-Toggles.

Siehe [Configuration](/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Kanäle können nach Wiederverbindungen dieselbe Nachricht erneut zustellen. OpenClaw führt einen
kurzlebigen Cache, der nach Kanal/Konto/Peer/Sitzung/Nachrichten-ID geschlüsselt ist, sodass doppelte
Zustellungen keinen weiteren Agent-Lauf auslösen.

## Debouncing eingehender Nachrichten

Schnell aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound` zu einem einzelnen
Agent-Durchlauf gebündelt werden. Debouncing ist pro Kanal + Konversation abgegrenzt
und verwendet die neueste Nachricht für Antwort-Threading/IDs.

Konfiguration (globaler Standard + Überschreibungen pro Kanal):

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

- Debouncing gilt für **nur Text**-Nachrichten; Medien/Anhänge werden sofort geleert.
- Kontrollbefehle umgehen Debouncing, damit sie eigenständig bleiben.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden in den Hauptsitzungsschlüssel des Agent zusammengeführt.
- Gruppen/Kanäle erhalten ihre eigenen Sitzungsschlüssel.
- Der Sitzungsspeicher und die Transkripte liegen auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet werden, aber der Verlauf wird nicht vollständig
an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie für lange
Konversationen ein primäres Gerät, um divergierenden Kontext zu vermeiden. Die Control UI und TUI zeigen immer das
gatewaygestützte Sitzungs-Transkript an und sind damit die Quelle der Wahrheit.

Details: [Session management](/concepts/session).

## Eingehende Bodys und Verlaufskontext

OpenClaw trennt den **Prompt-Body** vom **Command-Body**:

- `Body`: an den Agent gesendeter Prompt-Text. Dieser kann Kanal-Envelopes und
  optionale Verlaufs-Wrapper enthalten.
- `CommandBody`: roher Benutzertext für Directive-/Command-Parsing.
- `RawBody`: veralteter Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Kanal Verlauf bereitstellt, verwendet er einen gemeinsamen Wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Für **nicht direkte Chats** (Gruppen/Kanäle/Räume) wird dem **Body der aktuellen Nachricht** das
Absenderlabel vorangestellt (derselbe Stil wie bei Verlaufseinträgen). So bleiben Echtzeit- und in Warteschlangen/Verlauf
gespeicherte Nachrichten im Agent-Prompt konsistent.

Verlaufspuffer enthalten **nur ausstehende** Nachrichten: Sie umfassen Gruppennachrichten, die _keinen_
Lauf ausgelöst haben (zum Beispiel durch Mention-Gating gefilterte Nachrichten), und **schließen** Nachrichten
aus, die bereits im Sitzungs-Transkript stehen.

Directive-Stripping gilt nur für den Abschnitt der **aktuellen Nachricht**, damit der Verlauf
intakt bleibt. Kanäle, die Verlauf umschließen, sollten `CommandBody` (oder
`RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt belassen.
Verlaufspuffer sind über `messages.groupChat.historyLimit` (globaler
Standard) und Überschreibungen pro Kanal wie `channels.slack.historyLimit` oder
`channels.telegram.accounts.<id>.historyLimit` konfigurierbar (`0` zum Deaktivieren).

## Warteschlangen und Followups

Wenn bereits ein Lauf aktiv ist, können eingehende Nachrichten in die Warteschlange gestellt, in den
aktuellen Lauf gelenkt oder für einen Followup-Durchlauf gesammelt werden.

- Konfiguration über `messages.queue` (und `messages.queue.byChannel`).
- Modi: `interrupt`, `steer`, `followup`, `collect` sowie Backlog-Varianten.

Details: [Queueing](/concepts/queue).

## Streaming, Chunking und Batching

Block-Streaming sendet partielle Antworten, während das Modell Textblöcke erzeugt.
Chunking beachtet die Textlimits des Kanals und vermeidet das Aufteilen von Fenced Code.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, Standard off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (idle-basiertes Batching)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Block-Antworten)
- Kanalüberschreibungen: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`)

Details: [Streaming + chunking](/concepts/streaming).

## Sichtbarkeit von Reasoning und Tokens

OpenClaw kann das Reasoning des Modells anzeigen oder ausblenden:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalte zählen weiterhin zur Token-Nutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt Reasoning-Streaming in die Entwurfsblase.

Details: [Thinking + reasoning directives](/tools/thinking) und [Token use](/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist in `messages` zentralisiert:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade ausgehender Präfixe) sowie `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und Standards pro Kanal

Details: [Configuration](/gateway/configuration-reference#messages) und Kanaldokumentation.

## Verwandt

- [Streaming](/concepts/streaming) — Echtzeit-Zustellung von Nachrichten
- [Retry](/concepts/retry) — Wiederholungsverhalten bei der Nachrichtenzustellung
- [Queue](/concepts/queue) — Warteschlange der Nachrichtenverarbeitung
- [Channels](/channels) — Integrationen für Messaging-Plattformen
