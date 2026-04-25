---
read_when:
    - Spiegare come funzionano lo streaming o la suddivisione in chunk sui canali
    - Modifica del comportamento di block streaming o della suddivisione in chunk del canale
    - Debug di risposte block duplicate/anticipate o dello streaming di anteprima del canale
summary: Comportamento di streaming + suddivisione in chunk (risposte block, streaming di anteprima del canale, mappatura delle modalità)
title: Streaming e suddivisione in chunk
x-i18n:
    generated_at: "2026-04-25T13:45:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw ha due livelli separati di streaming:

- **Block streaming (canali):** emette **blocchi** completati mentre l'assistente scrive. Si tratta di normali messaggi del canale (non delta di token).
- **Preview streaming (Telegram/Discord/Slack):** aggiorna un **messaggio di anteprima** temporaneo durante la generazione.

Oggi **non esiste un vero streaming token-delta** verso i messaggi del canale. Il preview streaming è basato sui messaggi (invio + modifiche/append).

## Block streaming (messaggi del canale)

Il block streaming invia l'output dell'assistente in chunk grossolani man mano che diventano disponibili.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legenda:

- `text_delta/events`: eventi di streaming del modello (possono essere radi per i modelli non streaming).
- `chunker`: `EmbeddedBlockChunker` che applica limiti min/max + preferenza di interruzione.
- `channel send`: messaggi effettivi in uscita (risposte block).

**Controlli:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predefinito off).
- Override per canale: `*.blockStreaming` (e varianti per account) per forzare `"on"`/`"off"` per canale.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (unisce i blocchi in streaming prima dell'invio).
- Limite rigido del canale: `*.textChunkLimit` (ad es. `channels.whatsapp.textChunkLimit`).
- Modalità chunk del canale: `*.chunkMode` (`length` predefinito, `newline` divide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza).
- Limite morbido Discord: `channels.discord.maxLinesPerMessage` (predefinito 17) divide le risposte alte per evitare il clipping dell'interfaccia.

**Semantica dei confini:**

- `text_end`: trasmette i blocchi non appena il chunker li emette; fa flush a ogni `text_end`.
- `message_end`: attende che il messaggio dell'assistente sia terminato, poi fa flush dell'output in buffer.

`message_end` usa comunque il chunker se il testo in buffer supera `maxChars`, quindi può emettere più chunk alla fine.

### Consegna dei media con il block streaming

Le direttive `MEDIA:` sono normali metadati di consegna. Quando il block streaming invia
in anticipo un blocco media, OpenClaw ricorda quella consegna per il turno. Se il payload
finale dell'assistente ripete lo stesso URL media, la consegna finale rimuove il media
duplicato invece di inviare di nuovo l'allegato.

I payload finali duplicati esatti vengono soppressi. Se il payload finale aggiunge
testo distinto attorno a media già trasmessi in streaming, OpenClaw invia comunque il
nuovo testo mantenendo il media a consegna singola. Questo evita note vocali o file
duplicati su canali come Telegram quando un agente emette `MEDIA:` durante lo
streaming e il provider lo include anche nella risposta completata.

## Algoritmo di chunking (limiti basso/alto)

Il block chunking è implementato da `EmbeddedBlockChunker`:

- **Limite basso:** non emettere finché il buffer non raggiunge `minChars` (a meno che non sia forzato).
- **Limite alto:** preferisce divisioni prima di `maxChars`; se forzato, divide a `maxChars`.
- **Preferenza di interruzione:** `paragraph` → `newline` → `sentence` → `whitespace` → interruzione rigida.
- **Code fence:** non dividere mai all'interno delle fence; quando viene forzata una divisione a `maxChars`, chiude e riapre la fence per mantenere valido il Markdown.

`maxChars` è limitato a `textChunkLimit` del canale, quindi non puoi superare i limiti per canale.

## Coalescing (unione dei blocchi trasmessi in streaming)

Quando il block streaming è abilitato, OpenClaw può **unire chunk di blocchi consecutivi**
prima di inviarli. Questo riduce lo “spam di righe singole” pur continuando a fornire
output progressivo.

- Il coalescing attende **pause di inattività** (`idleMs`) prima del flush.
- I buffer sono limitati da `maxChars` e fanno flush se lo superano.
- `minChars` impedisce l'invio di frammenti minuscoli finché non si accumula abbastanza testo
  (il flush finale invia sempre il testo rimanente).
- Il separatore deriva da `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spazio).
- Gli override per canale sono disponibili tramite `*.blockStreamingCoalesce` (incluse configurazioni per account).
- Il valore predefinito di coalesce `minChars` viene aumentato a 1500 per Signal/Slack/Discord salvo override.

## Ritmo umano tra i blocchi

Quando il block streaming è abilitato, puoi aggiungere una **pausa casuale** tra
le risposte block (dopo il primo blocco). Questo fa sembrare più naturali le
risposte multi-bolla.

- Configurazione: `agents.defaults.humanDelay` (override per agente tramite `agents.list[].humanDelay`).
- Modalità: `off` (predefinita), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Si applica solo alle **risposte block**, non alle risposte finali o ai riepiloghi degli strumenti.

## "Trasmettere i chunk o tutto"

Questo viene mappato a:

- **Trasmettere i chunk:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emette man mano). I canali diversi da Telegram richiedono anche `*.blockStreaming: true`.
- **Trasmettere tutto alla fine:** `blockStreamingBreak: "message_end"` (fa flush una volta, possibilmente in più chunk se molto lungo).
- **Nessun block streaming:** `blockStreamingDefault: "off"` (solo risposta finale).

**Nota sul canale:** il block streaming è **disattivato a meno che**
`*.blockStreaming` non sia impostato esplicitamente su `true`. I canali possono trasmettere un'anteprima live
(`channels.<channel>.streaming`) senza risposte block.

Promemoria posizione config: i valori predefiniti `blockStreaming*` si trovano sotto
`agents.defaults`, non nella config di root.

## Modalità di preview streaming

Chiave canonica: `channels.<channel>.streaming`

Modalità:

- `off`: disabilita il preview streaming.
- `partial`: singola anteprima sostituita con il testo più recente.
- `block`: aggiornamenti di anteprima in passaggi suddivisi/appesi.
- `progress`: anteprima di avanzamento/stato durante la generazione, risposta finale al completamento.

### Mappatura per canale

| Canale     | `off` | `partial` | `block` | `progress`         |
| ---------- | ----- | --------- | ------- | ------------------ |
| Telegram   | ✅    | ✅        | ✅      | mappato a `partial` |
| Discord    | ✅    | ✅        | ✅      | mappato a `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                 |
| Mattermost | ✅    | ✅        | ✅      | ✅                 |

Solo Slack:

- `channels.slack.streaming.nativeTransport` attiva/disattiva le chiamate API di streaming nativo di Slack quando `channels.slack.streaming.mode="partial"` (predefinito: `true`).
- Lo streaming nativo Slack e lo stato dei thread dell'assistente Slack richiedono un target di thread di risposta; i DM di primo livello non mostrano quell'anteprima in stile thread.

Migrazione delle chiavi legacy:

- Telegram: i valori legacy `streamMode` e i valori scalari/booleani `streaming` vengono rilevati e migrati dai percorsi di compatibilità doctor/config a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano vengono migrati automaticamente all'enum `streaming`.
- Slack: `streamMode` viene migrato automaticamente a `streaming.mode`; `streaming` booleano viene migrato automaticamente a `streaming.mode` più `streaming.nativeTransport`; il legacy `nativeStreaming` viene migrato automaticamente a `streaming.nativeTransport`.

### Comportamento di runtime

Telegram:

- Usa aggiornamenti di anteprima `sendMessage` + `editMessageText` in DM e gruppi/topic.
- Il preview streaming viene saltato quando il block streaming Telegram è esplicitamente abilitato (per evitare il doppio streaming).
- `/reasoning stream` può scrivere il ragionamento nell'anteprima.

Discord:

- Usa messaggi di anteprima con invio + modifica.
- La modalità `block` usa draft chunking (`draftChunk`).
- Il preview streaming viene saltato quando il block streaming Discord è esplicitamente abilitato.
- I payload finali di media, errore ed explicit-reply annullano le anteprime in sospeso senza fare flush di una nuova bozza, poi usano la consegna normale.

Slack:

- `partial` può usare lo streaming nativo Slack (`chat.startStream`/`append`/`stop`) quando disponibile.
- `block` usa anteprime bozza in stile append.
- `progress` usa testo di anteprima dello stato, poi risposta finale.
- Lo streaming nativo e lo streaming di anteprima bozza sopprimono le risposte block per quel turno, quindi una risposta Slack viene trasmessa da un solo percorso di consegna.
- I payload finali media/errore e i finali di progresso non creano messaggi bozza usa-e-getta; solo i finali testo/block che possono modificare l'anteprima fanno flush del testo bozza in sospeso.

Mattermost:

- Trasmette thinking, attività degli strumenti e testo parziale della risposta in un singolo post bozza di anteprima che si finalizza in posizione quando la risposta finale è sicura da inviare.
- Usa come fallback l'invio di un nuovo post finale se il post di anteprima è stato eliminato o non è più disponibile al momento della finalizzazione.
- I payload finali di media/errore annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale invece di fare flush di un post di anteprima temporaneo.

Matrix:

- Le anteprime bozza si finalizzano in posizione quando il testo finale può riutilizzare l'evento di anteprima.
- I finali solo media, errore e mismatch del target di risposta annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale; un'anteprima obsoleta già visibile viene redatta.

### Aggiornamenti di anteprima dell'avanzamento degli strumenti

Il preview streaming può includere anche aggiornamenti di **tool-progress** — brevi righe di stato come "ricerca sul web", "lettura file" o "chiamata strumento" — che compaiono nello stesso messaggio di anteprima mentre gli strumenti sono in esecuzione, prima della risposta finale. Questo mantiene visivamente vivi i turni multi-step degli strumenti invece di lasciarli silenziosi tra la prima anteprima di thinking e la risposta finale.

Superfici supportate:

- **Discord**, **Slack** e **Telegram** trasmettono per impostazione predefinita il tool-progress nella modifica dell'anteprima live quando il preview streaming è attivo.
- Telegram include aggiornamenti di anteprima tool-progress abilitati dalla release `v2026.4.22`; mantenerli abilitati preserva quel comportamento già rilasciato.
- **Mattermost** incorpora già l'attività degli strumenti nel suo singolo post bozza di anteprima (vedi sopra).
- Le modifiche di tool-progress seguono la modalità attiva di preview streaming; vengono saltate quando il preview streaming è `off` o quando il block streaming ha preso il controllo del messaggio.
- Per mantenere il preview streaming ma nascondere le righe di tool-progress, imposta `streaming.preview.toolProgress` su `false` per quel canale. Per disabilitare completamente le modifiche di anteprima, imposta `streaming.mode` su `off`.

Esempio:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Correlati

- [Messaggi](/it/concepts/messages) — ciclo di vita e consegna dei messaggi
- [Retry](/it/concepts/retry) — comportamento di retry in caso di errore di consegna
- [Canali](/it/channels) — supporto dello streaming per canale
