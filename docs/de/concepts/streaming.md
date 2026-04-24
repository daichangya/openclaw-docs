---
read_when:
    - Erklären, wie Streaming oder Chunking auf Kanälen funktioniert
    - Ändern des Block-Streamings oder des Channel-Chunking-Verhaltens
    - Debuggen doppelter/früher Block-Antworten oder des Vorschau-Streamings für Kanäle
summary: Streaming- und Chunking-Verhalten (Block-Antworten, Vorschau-Streaming für Kanäle, Moduszuordnung)
title: Streaming und Chunking
x-i18n:
    generated_at: "2026-04-24T06:35:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + Chunking

OpenClaw hat zwei getrennte Streaming-Ebenen:

- **Block-Streaming (Kanäle):** abgeschlossene **Blöcke** ausgeben, während der Assistent schreibt. Das sind normale Kanalnachrichten (keine Token-Deltas).
- **Vorschau-Streaming (Telegram/Discord/Slack):** eine temporäre **Vorschaunachricht** während der Generierung aktualisieren.

Es gibt derzeit **kein echtes Token-Delta-Streaming** in Kanalnachrichten. Vorschau-Streaming ist nachrichtenbasiert (Senden + Bearbeitungen/Anhängen).

## Block-Streaming (Kanalnachrichten)

Block-Streaming sendet Assistentenausgaben in groben Chunks, sobald sie verfügbar werden.

```
Modellausgabe
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ Chunker gibt Blöcke aus, wenn der Puffer wächst
       └─ (blockStreamingBreak=message_end)
            └─ Chunker flusht bei message_end
                   └─ Kanalversand (Block-Antworten)
```

Legende:

- `text_delta/events`: Stream-Ereignisse des Modells (bei nicht streamenden Modellen möglicherweise spärlich).
- `chunker`: `EmbeddedBlockChunker`, der Min-/Max-Grenzen + bevorzugte Trennstellen anwendet.
- `channel send`: tatsächliche ausgehende Nachrichten (Block-Antworten).

**Steuerungen:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (Standard: aus).
- Kanal-Overrides: `*.blockStreaming` (und Varianten pro Konto), um `"on"`/`"off"` pro Kanal zu erzwingen.
- `agents.defaults.blockStreamingBreak`: `"text_end"` oder `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gestreamte Blöcke vor dem Senden zusammenführen).
- Feste Kanalgrenze: `*.textChunkLimit` (z. B. `channels.whatsapp.textChunkLimit`).
- Kanal-Chunk-Modus: `*.chunkMode` (`length` Standard, `newline` trennt an Leerzeilen (Absatzgrenzen) vor der Längenteilung).
- Discord-Softcap: `channels.discord.maxLinesPerMessage` (Standard: 17) teilt hohe Antworten, um UI-Abschneidungen zu vermeiden.

**Semantik der Grenzen:**

- `text_end`: Blöcke streamen, sobald der Chunker ausgibt; bei jedem `text_end` flushen.
- `message_end`: warten, bis die Assistentennachricht fertig ist, dann gepufferte Ausgabe flushen.

`message_end` verwendet weiterhin den Chunker, wenn der gepufferte Text `maxChars` überschreitet, sodass am Ende mehrere Chunks ausgegeben werden können.

## Chunking-Algorithmus (untere/obere Grenzen)

Block-Chunking wird durch `EmbeddedBlockChunker` implementiert:

- **Untere Grenze:** nicht ausgeben, bis der Puffer >= `minChars` ist (außer wenn erzwungen).
- **Obere Grenze:** Trennungen vor `maxChars` bevorzugen; falls erzwungen, bei `maxChars` trennen.
- **Bevorzugte Trennstellen:** `paragraph` → `newline` → `sentence` → `whitespace` → harte Trennung.
- **Code-Fences:** niemals innerhalb von Fences trennen; wenn bei `maxChars` erzwungen wird, wird die Fence geschlossen und wieder geöffnet, damit Markdown gültig bleibt.

`maxChars` wird auf das Kanal-`textChunkLimit` begrenzt, sodass kanalbezogene Limits nicht überschritten werden können.

## Coalescing (gestreamte Blöcke zusammenführen)

Wenn Block-Streaming aktiviert ist, kann OpenClaw **aufeinanderfolgende Block-Chunks zusammenführen**, bevor sie gesendet werden. Das reduziert „Single-Line-Spam“, während
progressive Ausgabe erhalten bleibt.

- Coalescing wartet vor dem Flush auf **Leerlauflücken** (`idleMs`).
- Puffer werden durch `maxChars` begrenzt und flushen, wenn sie diese überschreiten.
- `minChars` verhindert das Senden winziger Fragmente, bis genug Text angesammelt ist
  (der finale Flush sendet verbleibenden Text immer).
- Der Verbinder wird aus `blockStreamingChunk.breakPreference`
  abgeleitet (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → Leerzeichen).
- Kanal-Overrides sind über `*.blockStreamingCoalesce` verfügbar (einschließlich Konfigurationen pro Konto).
- Das Standard-Coalesce-`minChars` wird für Signal/Slack/Discord auf 1500 erhöht, sofern nicht überschrieben.

## Menschenähnliches Timing zwischen Blöcken

Wenn Block-Streaming aktiviert ist, können Sie eine **zufällige Pause** zwischen
Block-Antworten hinzufügen (nach dem ersten Block). Dadurch wirken Antworten in mehreren Bubbles
natürlicher.

- Konfiguration: `agents.defaults.humanDelay` (pro Agent mit `agents.list[].humanDelay` überschreibbar).
- Modi: `off` (Standard), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Gilt nur für **Block-Antworten**, nicht für finale Antworten oder Tool-Zusammenfassungen.

## „Chunks streamen oder alles“

Das wird wie folgt zugeordnet:

- **Chunks streamen:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (während der Generierung ausgeben). Nicht-Telegram-Kanäle benötigen außerdem `*.blockStreaming: true`.
- **Alles am Ende streamen:** `blockStreamingBreak: "message_end"` (einmal flushen, bei sehr langer Ausgabe möglicherweise mehrere Chunks).
- **Kein Block-Streaming:** `blockStreamingDefault: "off"` (nur finale Antwort).

**Kanalhinweis:** Block-Streaming ist **aus, sofern**
`*.blockStreaming` nicht explizit auf `true` gesetzt ist. Kanäle können eine Live-Vorschau
streamen (`channels.<channel>.streaming`), ohne Block-Antworten zu verwenden.

Hinweis zum Speicherort der Konfiguration: Die Standardwerte `blockStreaming*` befinden sich unter
`agents.defaults`, nicht auf Root-Ebene der Konfiguration.

## Vorschau-Streaming-Modi

Kanonischer Schlüssel: `channels.<channel>.streaming`

Modi:

- `off`: Vorschau-Streaming deaktivieren.
- `partial`: einzelne Vorschau, die durch den neuesten Text ersetzt wird.
- `block`: Vorschau-Updates in gechunkten/angehängten Schritten.
- `progress`: Fortschritts-/Statusvorschau während der Generierung, finale Antwort nach Abschluss.

### Kanalzuordnung

| Kanal      | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | wird zu `partial` zugeordnet |
| Discord    | ✅    | ✅        | ✅      | wird zu `partial` zugeordnet |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

Nur Slack:

- `channels.slack.streaming.nativeTransport` schaltet native Slack-Streaming-API-Aufrufe um, wenn `channels.slack.streaming.mode="partial"` (Standard: `true`).
- Natives Slack-Streaming und der Slack-Assistenten-Thread-Status benötigen ein Antwort-Thread-Ziel; Top-Level-DMs zeigen diese Thread-artige Vorschau nicht.

Migration von Legacy-Schlüsseln:

- Telegram: `streamMode` + boolesches `streaming` werden automatisch auf das Enum `streaming` migriert.
- Discord: `streamMode` + boolesches `streaming` werden automatisch auf das Enum `streaming` migriert.
- Slack: `streamMode` wird automatisch auf `streaming.mode` migriert; boolesches `streaming` wird automatisch auf `streaming.mode` plus `streaming.nativeTransport` migriert; Legacy-`nativeStreaming` wird automatisch auf `streaming.nativeTransport` migriert.

### Laufzeitverhalten

Telegram:

- Verwendet `sendMessage` + `editMessageText` für Vorschau-Updates in DMs und Gruppen/Themen.
- Vorschau-Streaming wird übersprungen, wenn Telegram-Block-Streaming explizit aktiviert ist (um doppeltes Streaming zu vermeiden).
- `/reasoning stream` kann Reasoning in die Vorschau schreiben.

Discord:

- Verwendet Vorschau-Nachrichten mit Senden + Bearbeiten.
- Der Modus `block` verwendet Draft-Chunking (`draftChunk`).
- Vorschau-Streaming wird übersprungen, wenn Discord-Block-Streaming explizit aktiviert ist.
- Finale Medien-, Fehler- und explizite Antwort-Payloads brechen ausstehende Vorschauen ab, ohne einen neuen Draft zu flushen, und verwenden dann normale Zustellung.

Slack:

- `partial` kann natives Slack-Streaming (`chat.startStream`/`append`/`stop`) verwenden, wenn verfügbar.
- `block` verwendet Vorschau-Entwürfe im Append-Stil.
- `progress` verwendet Statusvorschautext und danach die finale Antwort.
- Finale Medien-/Fehler-Payloads und Progress-Finals erzeugen keine wegwerfbaren Draft-Nachrichten; nur Text-/Block-Finals, die die Vorschau bearbeiten können, flushen ausstehenden Draft-Text.

Mattermost:

- Streamt Reasoning, Tool-Aktivitäten und partiellen Antworttext in einen einzelnen Draft-Vorschau-Beitrag, der direkt an Ort und Stelle finalisiert wird, wenn die endgültige Antwort sicher gesendet werden kann.
- Greift auf das Senden eines neuen finalen Beitrags zurück, wenn der Vorschau-Beitrag gelöscht wurde oder beim Finalisieren anderweitig nicht verfügbar ist.
- Finale Medien-/Fehler-Payloads brechen ausstehende Vorschau-Updates vor normaler Zustellung ab, statt einen temporären Vorschau-Beitrag zu flushen.

Matrix:

- Draft-Vorschauen werden an Ort und Stelle finalisiert, wenn der finale Text das Vorschau-Ereignis wiederverwenden kann.
- Finale nur mit Medien, Fehler und Finals mit nicht passendem Antwortziel brechen ausstehende Vorschau-Updates vor normaler Zustellung ab; eine bereits sichtbare veraltete Vorschau wird redigiert.

### Vorschau-Updates für Tool-Fortschritt

Vorschau-Streaming kann auch **Tool-Fortschritts**-Updates enthalten — kurze Statuszeilen wie „searching the web“, „reading file“ oder „calling tool“ —, die in derselben Vorschau-Nachricht erscheinen, während Tools laufen, noch vor der finalen Antwort. Dadurch wirken mehrstufige Tool-Durchläufe visuell lebendig statt zwischen der ersten Reasoning-Vorschau und der finalen Antwort stumm zu bleiben.

Unterstützte Oberflächen:

- **Discord**, **Slack** und **Telegram** streamen Tool-Fortschritt in die Live-Bearbeitung der Vorschau.
- **Mattermost** integriert Tool-Aktivitäten bereits in seinen einzelnen Draft-Vorschau-Beitrag (siehe oben).
- Bearbeitungen für Tool-Fortschritt folgen dem aktiven Vorschau-Streaming-Modus; sie werden übersprungen, wenn Vorschau-Streaming `off` ist oder wenn Block-Streaming die Nachricht übernommen hat.

## Verwandt

- [Nachrichten](/de/concepts/messages) — Nachrichtenlebenszyklus und Zustellung
- [Retry](/de/concepts/retry) — Retry-Verhalten bei Zustellfehlern
- [Kanäle](/de/channels) — Streaming-Unterstützung pro Kanal
