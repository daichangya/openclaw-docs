---
read_when:
    - Spiegare come funzionano lo streaming o la suddivisione in chunk nei canali
    - Modificare il comportamento dello streaming a blocchi o della suddivisione in chunk del canale
    - Debug di risposte a blocchi duplicate/anticipate o dello streaming di anteprima del canale
summary: Comportamento di streaming + suddivisione in chunk (risposte a blocchi, streaming di anteprima del canale, mappatura delle modalità)
title: Streaming e suddivisione in chunk
x-i18n:
    generated_at: "2026-04-22T04:22:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + suddivisione in chunk

OpenClaw ha due livelli di streaming separati:

- **Streaming a blocchi (canali):** emette **blocchi** completati mentre l'assistente scrive. Questi sono normali messaggi del canale (non delta di token).
- **Streaming di anteprima (Telegram/Discord/Slack):** aggiorna un **messaggio di anteprima** temporaneo durante la generazione.

Oggi **non esiste un vero streaming di delta di token** verso i messaggi del canale. Lo streaming di anteprima è basato sui messaggi (invio + modifiche/append).

## Streaming a blocchi (messaggi del canale)

Lo streaming a blocchi invia l'output dell'assistente in chunk grossolani man mano che diventano disponibili.

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

- `text_delta/events`: eventi di stream del modello (possono essere radi per i modelli non streaming).
- `chunker`: `EmbeddedBlockChunker` che applica limiti min/max + preferenza di interruzione.
- `channel send`: messaggi in uscita effettivi (risposte a blocchi).

**Controlli:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predefinito off).
- Override del canale: `*.blockStreaming` (e varianti per-account) per forzare `"on"`/`"off"` per canale.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (unisce i blocchi in streaming prima dell'invio).
- Hard cap del canale: `*.textChunkLimit` (ad esempio, `channels.whatsapp.textChunkLimit`).
- Modalità di suddivisione in chunk del canale: `*.chunkMode` (`length` predefinito, `newline` divide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza).
- Soft cap Discord: `channels.discord.maxLinesPerMessage` (predefinito 17) divide le risposte alte per evitare clipping nell'interfaccia.

**Semantica dei confini:**

- `text_end`: trasmette i blocchi non appena il chunker li emette; fa flush a ogni `text_end`.
- `message_end`: aspetta che il messaggio dell'assistente finisca, poi fa flush dell'output bufferizzato.

`message_end` usa comunque il chunker se il testo bufferizzato supera `maxChars`, quindi può emettere più chunk alla fine.

## Algoritmo di suddivisione in chunk (limiti basso/alto)

La suddivisione in chunk a blocchi è implementata da `EmbeddedBlockChunker`:

- **Limite basso:** non emettere finché il buffer non è >= `minChars` (a meno che non sia forzato).
- **Limite alto:** preferisce le divisioni prima di `maxChars`; se forzato, divide a `maxChars`.
- **Preferenza di interruzione:** `paragraph` → `newline` → `sentence` → `whitespace` → interruzione rigida.
- **Recinti di codice:** non dividere mai all'interno dei recinti; quando viene forzato a `maxChars`, chiude e riapre il recinto per mantenere valido il Markdown.

`maxChars` è limitato a `textChunkLimit` del canale, quindi non puoi superare i limiti per-canale.

## Coalescenza (unione dei blocchi in streaming)

Quando lo streaming a blocchi è abilitato, OpenClaw può **unire chunk di blocco consecutivi**
prima di inviarli. Questo riduce lo “spam da singola riga” pur continuando a fornire
output progressivo.

- La coalescenza attende **pause di inattività** (`idleMs`) prima di fare flush.
- I buffer sono limitati da `maxChars` e fanno flush se li superano.
- `minChars` impedisce l'invio di frammenti minuscoli finché non si accumula abbastanza testo
  (il flush finale invia sempre il testo rimanente).
- Il separatore deriva da `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spazio).
- Sono disponibili override del canale tramite `*.blockStreamingCoalesce` (incluse configurazioni per-account).
- Il valore predefinito di coalescenza `minChars` viene alzato a 1500 per Signal/Slack/Discord salvo override.

## Ritmo umano tra i blocchi

Quando lo streaming a blocchi è abilitato, puoi aggiungere una **pausa casuale** tra
le risposte a blocchi (dopo il primo blocco). Questo rende le risposte multi-bolla
più naturali.

- Configurazione: `agents.defaults.humanDelay` (override per agente tramite `agents.list[].humanDelay`).
- Modalità: `off` (predefinito), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Si applica solo alle **risposte a blocchi**, non alle risposte finali o ai riepiloghi degli strumenti.

## "Trasmettere i chunk o tutto"

Questo corrisponde a:

- **Trasmettere i chunk:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emette mentre procede). I canali non Telegram richiedono anche `*.blockStreaming: true`.
- **Trasmettere tutto alla fine:** `blockStreamingBreak: "message_end"` (fa flush una volta, possibilmente in più chunk se molto lungo).
- **Nessuno streaming a blocchi:** `blockStreamingDefault: "off"` (solo risposta finale).

**Nota sul canale:** Lo streaming a blocchi è **disattivato a meno che**
`*.blockStreaming` non sia impostato esplicitamente su `true`. I canali possono mostrare un'anteprima live
(`channels.<channel>.streaming`) senza risposte a blocchi.

Promemoria sulla posizione della configurazione: i valori predefiniti `blockStreaming*` si trovano sotto
`agents.defaults`, non nella configurazione root.

## Modalità di streaming di anteprima

Chiave canonica: `channels.<channel>.streaming`

Modalità:

- `off`: disabilita lo streaming di anteprima.
- `partial`: singola anteprima sostituita con il testo più recente.
- `block`: l'anteprima si aggiorna in passaggi suddivisi in chunk/append.
- `progress`: anteprima di avanzamento/stato durante la generazione, risposta finale al completamento.

### Mappatura dei canali

| Canale     | `off` | `partial` | `block` | `progress`             |
| ---------- | ----- | --------- | ------- | ---------------------- |
| Telegram   | ✅    | ✅        | ✅      | mappa a `partial`      |
| Discord    | ✅    | ✅        | ✅      | mappa a `partial`      |
| Slack      | ✅    | ✅        | ✅      | ✅                     |
| Mattermost | ✅    | ✅        | ✅      | ✅                     |

Solo Slack:

- `channels.slack.streaming.nativeTransport` attiva/disattiva le chiamate all'API di streaming nativa di Slack quando `channels.slack.streaming.mode="partial"` (predefinito: `true`).
- Lo streaming nativo di Slack e lo stato del thread assistente di Slack richiedono una destinazione di thread di risposta; i DM di livello superiore non mostrano quell'anteprima in stile thread.

Migrazione delle chiavi legacy:

- Telegram: `streamMode` + booleano `streaming` vengono migrati automaticamente all'enum `streaming`.
- Discord: `streamMode` + booleano `streaming` vengono migrati automaticamente all'enum `streaming`.
- Slack: `streamMode` viene migrato automaticamente a `streaming.mode`; il booleano `streaming` viene migrato automaticamente a `streaming.mode` più `streaming.nativeTransport`; il legacy `nativeStreaming` viene migrato automaticamente a `streaming.nativeTransport`.

### Comportamento a runtime

Telegram:

- Usa `sendMessage` + `editMessageText` per gli aggiornamenti di anteprima in DM e gruppi/topic.
- Lo streaming di anteprima viene saltato quando lo streaming a blocchi di Telegram è esplicitamente abilitato (per evitare doppio streaming).
- `/reasoning stream` può scrivere il ragionamento nell'anteprima.

Discord:

- Usa messaggi di anteprima con invio + modifica.
- La modalità `block` usa la suddivisione in chunk della bozza (`draftChunk`).
- Lo streaming di anteprima viene saltato quando lo streaming a blocchi di Discord è esplicitamente abilitato.
- I payload finali di media, errore e risposta esplicita annullano le anteprime in sospeso senza fare flush di una nuova bozza, poi usano la normale consegna.

Slack:

- `partial` può usare lo streaming nativo di Slack (`chat.startStream`/`append`/`stop`) quando disponibile.
- `block` usa anteprime di bozza in stile append.
- `progress` usa il testo di anteprima dello stato, poi la risposta finale.
- I payload finali di media/errore e i finali di avanzamento non creano messaggi bozza usa e getta; solo i finali testo/blocco che possono modificare l'anteprima fanno flush del testo bozza in sospeso.

Mattermost:

- Trasmette pensieri, attività degli strumenti e testo parziale della risposta in un singolo post di anteprima bozza che viene finalizzato sul posto quando la risposta finale può essere inviata in sicurezza.
- Ripiega sull'invio di un nuovo post finale se il post di anteprima è stato eliminato o non è altrimenti disponibile al momento della finalizzazione.
- I payload finali di media/errore annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale invece di fare flush di un post di anteprima temporaneo.

Matrice:

- Le anteprime di bozza vengono finalizzate sul posto quando il testo finale può riutilizzare l'evento di anteprima.
- I finali solo-media, errore e con mancata corrispondenza della destinazione di risposta annullano gli aggiornamenti di anteprima in sospeso prima della consegna normale; un'anteprima obsoleta già visibile viene redatta.

### Aggiornamenti di anteprima dell'avanzamento degli strumenti

Lo streaming di anteprima può includere anche aggiornamenti di **avanzamento degli strumenti** — brevi righe di stato come "ricerca sul web", "lettura del file" o "chiamata dello strumento" — che compaiono nello stesso messaggio di anteprima mentre gli strumenti sono in esecuzione, prima della risposta finale. Questo mantiene visivamente vivi i turni con più passaggi degli strumenti invece di lasciarli silenziosi tra la prima anteprima di ragionamento e la risposta finale.

Superfici supportate:

- **Discord**, **Slack** e **Telegram** trasmettono l'avanzamento degli strumenti nella modifica live dell'anteprima.
- **Mattermost** integra già l'attività degli strumenti nel suo singolo post di anteprima bozza (vedi sopra).
- Le modifiche di avanzamento degli strumenti seguono la modalità attiva di streaming di anteprima; vengono saltate quando lo streaming di anteprima è `off` o quando lo streaming a blocchi ha preso il controllo del messaggio.

## Correlati

- [Messaggi](/it/concepts/messages) — ciclo di vita e consegna dei messaggi
- [Retry](/it/concepts/retry) — comportamento di retry in caso di errore di consegna
- [Canali](/it/channels) — supporto di streaming per canale
