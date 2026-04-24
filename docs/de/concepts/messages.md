---
read_when:
    - Erklären, wie aus eingehenden Nachrichten Antworten werden
    - Sitzungen, Warteschlangenmodi oder Streaming-Verhalten klären
    - Sichtbarkeit des Denkprozesses und Auswirkungen auf die Nutzung dokumentieren
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit des Denkprozesses
title: Nachrichten
x-i18n:
    generated_at: "2026-04-24T06:34:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

Diese Seite verbindet, wie OpenClaw eingehende Nachrichten, Sitzungen, Warteschlangen,
Streaming und die Sichtbarkeit des Denkprozesses behandelt.

## Nachrichtenfluss (Überblick)

```
Eingehende Nachricht
  -> Routing/Bindings -> SessionKey
  -> Warteschlange (wenn ein Lauf aktiv ist)
  -> Agentenlauf (Streaming + Tools)
  -> Ausgehende Antworten (Kanallimits + Chunking)
```

Wichtige Stellschrauben befinden sich in der Konfiguration:

- `messages.*` für Präfixe, Warteschlangen und Gruppenverhalten.
- `agents.defaults.*` für Standardwerte von Block-Streaming und Chunking.
- Kanalüberschreibungen (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Caps und Streaming-Toggles.

Siehe [Configuration](/de/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Kanäle können dieselbe Nachricht nach Wiederverbindungen erneut zustellen. OpenClaw hält einen
kurzlebigen Cache, der nach Kanal/Konto/Peer/Sitzung/Nachrichten-ID geschlüsselt ist, sodass doppelte
Zustellungen keinen weiteren Agentenlauf auslösen.

## Debouncing eingehender Nachrichten

Schnell aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound` zu einem einzelnen
Agenten-Turnus gebündelt werden. Debouncing ist pro Kanal + Konversation scoped
und verwendet die zuletzt empfangene Nachricht für Antwort-Threading/IDs.

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

- Debounce gilt für **reine Textnachrichten**; Medien/Anhänge werden sofort geleert.
- Steuerbefehle umgehen Debouncing, damit sie eigenständig bleiben — **außer** wenn ein Kanal ausdrücklich Same-Sender-DM-Coalescing aktiviert (z. B. [BlueBubbles `coalesceSameSenderDms`](/de/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), wobei DM-Befehle innerhalb des Debounce-Fensters warten, damit eine per Split-Send gesendete Payload in denselben Agenten-Turnus aufgenommen werden kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden in den Haupt-SessionKey des Agenten zusammengefasst.
- Gruppen/Kanäle erhalten ihre eigenen SessionKeys.
- Sitzungsspeicher und Transkripte befinden sich auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet sein, aber der Verlauf wird nicht vollständig
an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie für lange
Konversationen ein primäres Gerät, um divergierenden Kontext zu vermeiden. Die Control UI und die TUI zeigen immer das
gatewaygestützte Sitzungsprotokoll an und sind daher die maßgebliche Quelle.

Details: [Session management](/de/concepts/session).

## Eingehende Bodys und Verlaufskontext

OpenClaw trennt den **Prompt-Body** vom **Command-Body**:

- `Body`: Prompt-Text, der an den Agenten gesendet wird. Dies kann Kanal-Umschläge und
  optionale Verlaufs-Wrapper enthalten.
- `CommandBody`: roher Benutzertext für die Analyse von Direktiven/Befehlen.
- `RawBody`: veralteter Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Kanal Verlauf liefert, verwendet er einen gemeinsamen Wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Bei **nicht direkten Chats** (Gruppen/Kanäle/Räume) wird dem **aktuellen Nachrichten-Body** das
Absenderlabel vorangestellt (derselbe Stil wie bei Verlaufseinträgen). Dadurch bleiben Echtzeit- und Warteschlangen-/Verlaufs-
nachrichten im Agenten-Prompt konsistent.

Verlaufs-Puffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_
Lauf ausgelöst haben (zum Beispiel Nachrichten, die durch Erwähnungs-Gating blockiert wurden), und **schließen** Nachrichten aus,
die bereits im Sitzungsprotokoll enthalten sind.

Das Entfernen von Direktiven gilt nur für den Abschnitt der **aktuellen Nachricht**, damit der Verlauf
unverändert bleibt. Kanäle, die Verlauf umschließen, sollten `CommandBody` (oder
`RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten.
Verlaufs-Puffer sind über `messages.groupChat.historyLimit` (globaler
Standard) und Überschreibungen pro Kanal wie `channels.slack.historyLimit` oder
`channels.telegram.accounts.<id>.historyLimit` konfigurierbar (auf `0` setzen, um zu deaktivieren).

## Warteschlangen und Follow-ups

Wenn bereits ein Lauf aktiv ist, können eingehende Nachrichten in die Warteschlange gestellt, in den
aktuellen Lauf gelenkt oder für einen Follow-up-Turnus gesammelt werden.

- Konfiguration über `messages.queue` (und `messages.queue.byChannel`).
- Modi: `interrupt`, `steer`, `followup`, `collect` sowie Backlog-Varianten.

Details: [Queueing](/de/concepts/queue).

## Streaming, Chunking und Batching

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt.
Chunking berücksichtigt die Textlimits des Kanals und vermeidet das Aufteilen von eingefasstem Code.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, Standard aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (Leerlauf-basiertes Batching)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Kanalüberschreibungen: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`)

Details: [Streaming + chunking](/de/concepts/streaming).

## Sichtbarkeit des Denkprozesses und Tokens

OpenClaw kann Modell-Reasoning anzeigen oder verbergen:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalte zählen weiterhin zur Token-Nutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt das Streamen von Reasoning in die Entwurfsblase.

Details: [Thinking + reasoning directives](/de/tools/thinking) und [Token use](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist zentral in `messages` geregelt:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade für ausgehende Präfixe) sowie `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und Standardwerte pro Kanal

Details: [Configuration](/de/gateway/config-agents#messages) und Kanaldokumentation.

## Stille Antworten

Das exakte Silent-Token `NO_REPLY` / `no_reply` bedeutet: „keine für Benutzer sichtbare Antwort zustellen“.
OpenClaw löst dieses Verhalten nach Konversationstyp auf:

- Direkte Konversationen erlauben standardmäßig keine Stille und schreiben eine reine stille
  Antwort in einen kurzen sichtbaren Fallback um.
- Gruppen/Kanäle erlauben standardmäßig Stille.
- Interne Orchestrierung erlaubt standardmäßig Stille.

Standardwerte befinden sich unter `agents.defaults.silentReply` und
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und
`surfaces.<id>.silentReplyRewrite` können sie pro Oberfläche überschreiben.

Wenn die übergeordnete Sitzung einen oder mehrere ausstehende erzeugte Subagent-Läufe hat, werden reine
stille Antworten auf allen Oberflächen verworfen, statt umgeschrieben zu werden, sodass die
übergeordnete Sitzung still bleibt, bis das Abschlussereignis des Child-Laufs die echte Antwort zustellt.

## Verwandt

- [Streaming](/de/concepts/streaming) — Echtzeit-Nachrichtenzustellung
- [Retry](/de/concepts/retry) — Retry-Verhalten bei Nachrichtenzustellung
- [Queue](/de/concepts/queue) — Warteschlange für Nachrichtenverarbeitung
- [Channels](/de/channels) — Integrationen für Messaging-Plattformen
