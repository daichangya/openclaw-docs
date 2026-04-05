---
read_when:
    - Erklären, wie Streaming oder Chunking in Channels funktioniert
    - Verhalten von Block-Streaming oder Channel-Chunking ändern
    - Doppelte/frühe Block-Antworten oder Channel-Vorschau-Streaming debuggen
summary: Verhalten von Streaming + Chunking (Block-Antworten, Channel-Vorschau-Streaming, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-04-05T12:41:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b0d08c7eafcb32030ef7c8d5719c2ea2d34e4bac5fdad8cc8b3f4e9e9fad97
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + Chunking

OpenClaw hat zwei separate Streaming-Ebenen:

- **Block-Streaming (Channels):** abgeschlossene **Blöcke** ausgeben, während der Assistant schreibt. Das sind normale Channel-Nachrichten (keine Token-Deltas).
- **Vorschau-Streaming (Telegram/Discord/Slack):** eine temporäre **Vorschau-Nachricht** während der Generierung aktualisieren.

Es gibt heute **kein echtes Token-Delta-Streaming** zu Channel-Nachrichten. Vorschau-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhängen).

## Block-Streaming (Channel-Nachrichten)

Block-Streaming sendet Assistant-Ausgaben in groben Chunks, sobald sie verfügbar werden.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legende:

- `text_delta/events`: Modell-Stream-Ereignisse (können bei nicht streamenden Modellen spärlich sein).
- `chunker`: `EmbeddedBlockChunker`, der Min-/Max-Grenzen + Umbruchpräferenz anwendet.
- `channel send`: tatsächliche ausgehende Nachrichten (Block-Antworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (Standard: aus).
- Channel-Überschreibungen: `*.blockStreaming` (und Varianten pro Konto), um pro Channel `"on"`/`"off"` zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen).
- Harte Channel-Grenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Channel-Chunk-Modus: `*.chunkMode` (`length` standardmäßig, `newline` trennt an Leerzeilen (Absatzgrenzen) vor dem Chunking nach Länge).
- Discord-Soft-Grenze: `channels.discord.maxLinesPerMessage` (Standard 17) teilt hohe Antworten, um UI-Abschneiden zu vermeiden.

**Semantik der Grenzen:**

- `text_end`: Blöcke streamen, sobald der Chunker sie ausgibt; bei jedem `text_end` flushen.
- `message_end`: warten, bis die Assistant-Nachricht abgeschlossen ist, dann gepufferte Ausgabe flushen.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird durch `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** nichts ausgeben, bis der Puffer >= `minChars` ist (außer wenn erzwungen).
- **Obere Grenze:** Trennungen vor `maxChars` bevorzugen; wenn erzwungen, bei `maxChars` trennen.
- **Umbruchpräferenz:** `paragraph` → `newline` → `sentence` → `whitespace` → harter Umbruch.
- **Code-Fences:** niemals innerhalb von Fences trennen; wenn bei `maxChars` erzwungen, die Fence schließen + erneut öffnen, damit Markdown gültig bleibt.

`maxChars` wird auf das Channel-`textChunkLimit` begrenzt, sodass per-Channel-Grenzen nicht überschritten werden können.

## Zusammenführen (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**,
bevor sie gesendet werden. Das reduziert „Einzeilen-Spam“, liefert aber weiterhin
schrittweise Ausgabe.

- Das Zusammenführen wartet vor dem Flush auf **Leerlaufabstände** (`idleMs`).
- Puffer sind durch `maxChars` begrenzt und werden geflusht, wenn sie diesen Wert überschreiten.
- `minChars` verhindert, dass winzige Fragmente gesendet werden, bevor genug Text zusammengekommen ist
  (der finale Flush sendet immer verbleibenden Text).
- Das Verbindungszeichen wird aus `blockStreamingChunk.breakPreference`
  abgeleitet (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Channel-Überschreibungen sind über `*.blockStreamingCoalesce` verfügbar (einschließlich Konfigurationen pro Konto).
- Der Standardwert für `minChars` beim Zusammenführen wird für Signal/Slack/Discord auf 1500 erhöht, sofern nicht überschrieben.

## Menschlich wirkendes Tempo zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie eine **zufällige Pause** zwischen
Block-Antworten hinzufügen (nach dem ersten Block). Dadurch wirken Antworten mit mehreren
Sprechblasen natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (Überschreibung pro Agent über `agents.list[].humanDelay`).
- Modi: `off` (Standard), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Block-Antworten**, nicht für finale Antworten oder Tool-Zusammenfassungen.

## „Chunks streamen oder alles“

Dies entspricht:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (währenddessen ausgeben). Nicht-Telegram-Channels benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal flushen, bei sehr langer Ausgabe eventuell mehrere Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur finale Antwort).

**Channel-Hinweis:** Block-Streaming ist **deaktiviert, sofern**
`*.blockStreaming` nicht explizit auf `true` gesetzt ist. Channels können eine Live-Vorschau streamen
(`channels.<channel>.streaming`) ohne Block-Antworten.

Hinweis zum Konfigurationsort: Die Standardwerte `blockStreaming*` liegen unter
`agents.defaults`, nicht in der Root-Konfiguration.

## Modi für Vorschau-Streaming

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Vorschau-Streaming deaktivieren.
- `partial`: einzelne Vorschau, die durch den neuesten Text ersetzt wird.
- `block`: Vorschau-Aktualisierungen in gechunkten/angehängten Schritten.
- `progress`: Fortschritts-/Statusvorschau während der Generierung, finale Antwort nach Abschluss.

### Channel-Zuordnung

| Channel  | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | wird zu `partial` zugeordnet |
| Discord  | ✅    | ✅        | ✅      | wird zu `partial` zugeordnet |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Nur Slack:

- `channels.slack.nativeStreaming` schaltet native Slack-Streaming-API-Aufrufe um, wenn `streaming=partial` gesetzt ist (Standard: `true`).

Migration von Legacy-Schlüsseln:

- Telegram: `streamMode` + boolesches `streaming` werden automatisch auf das Enum `streaming` migriert.
- Discord: `streamMode` + boolesches `streaming` werden automatisch auf das Enum `streaming` migriert.
- Slack: `streamMode` wird automatisch auf das Enum `streaming` migriert; boolesches `streaming` wird automatisch auf `nativeStreaming` migriert.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText` für Vorschau-Aktualisierungen in DMs und Gruppen/Themen.
- Vorschau-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Begründungen in die Vorschau schreiben.

Discord:

- Verwendet Senden + Bearbeiten von Vorschau-Nachrichten.
- Der Modus `block` verwendet Entwurfs-Chunking (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.

Slack:

- `partial` kann natives Slack-Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Entwurfsvorschauen im Append-Stil.
- `progress` verwendet Statusvorschautext und danach die finale Antwort.

## Verwandt

- [Messages](/concepts/messages) — Nachrichten-Lifecycle und Zustellung
- [Retry](/concepts/retry) — Retry-Verhalten bei Zustellfehlern
- [Channels](/channels) — Streaming-Unterstützung pro Channel
