---
read_when:
    - Spiegare come i messaggi in entrata diventano risposte
    - Chiarire sessioni, modalità di accodamento o comportamento dello streaming
    - Documentare la visibilità del ragionamento e le implicazioni d'uso
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-04-26T11:27:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b77d344ed0cab80566582f43127c91ec987e892eeed788aeb9988b377a96e06
    source_path: concepts/messages.md
    workflow: 15
---

Questa pagina collega il modo in cui OpenClaw gestisce i messaggi in entrata, le sessioni, l'accodamento,
lo streaming e la visibilità del ragionamento.

## Flusso dei messaggi (panoramica)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

I controlli principali si trovano nella configurazione:

- `messages.*` per prefissi, accodamento e comportamento dei gruppi.
- `agents.defaults.*` per i valori predefiniti di block streaming e chunking.
- Override di canale (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e toggle di streaming.

Vedi [Configurazione](/it/gateway/configuration) per lo schema completo.

## Deduplica in entrata

I canali possono riconsegnare lo stesso messaggio dopo una riconnessione. OpenClaw mantiene una
cache di breve durata indicizzata per channel/account/peer/session/message id, così le consegne duplicate
non attivano un'altra esecuzione dell'agente.

## Debounce in entrata

Messaggi rapidi consecutivi dallo **stesso mittente** possono essere raggruppati in un singolo
turno dell'agente tramite `messages.inbound`. Il debounce è applicato per canale + conversazione
e usa il messaggio più recente per threading/ID della risposta.

Configurazione (predefinito globale + override per canale):

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

Note:

- Il debounce si applica ai messaggi **solo testo**; media/allegati vengono svuotati immediatamente.
- I comandi di controllo aggirano il debounce così restano autonomi — **tranne** quando un canale abilita esplicitamente il coalescing DM dello stesso mittente (ad esempio [BlueBubbles `coalesceSameSenderDms`](/it/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), dove i comandi DM attendono nella finestra di debounce così un payload inviato in più parti può unirsi allo stesso turno dell'agente.

## Sessioni e dispositivi

Le sessioni appartengono al gateway, non ai client.

- Le chat dirette confluiscono nella chiave di sessione principale dell'agente.
- Gruppi/canali ricevono le proprie chiavi di sessione.
- Lo store delle sessioni e i transcript risiedono sull'host del gateway.

Più dispositivi/canali possono essere mappati alla stessa sessione, ma la cronologia non viene
sincronizzata completamente a ogni client. Raccomandazione: usa un dispositivo principale per le
conversazioni lunghe per evitare contesti divergenti. La Control UI e la TUI mostrano sempre il
transcript della sessione supportata dal gateway, quindi sono la fonte di verità.

Dettagli: [Gestione delle sessioni](/it/concepts/session).

## Metadati del risultato degli strumenti

Il `content` del risultato dello strumento è il risultato visibile al modello. `details` del risultato dello strumento è
metadato di runtime per rendering UI, diagnostica, consegna media e Plugin.

OpenClaw mantiene esplicito questo confine:

- `toolResult.details` viene rimosso prima del replay del provider e dell'input di Compaction.
- I transcript di sessione persistiti conservano solo `details` limitati; i metadati sovradimensionati
  vengono sostituiti con un riepilogo compatto contrassegnato con `persistedDetailsTruncated: true`.
- Plugin e strumenti dovrebbero inserire in `content` il testo che il modello deve leggere, non solo
  in `details`.

## Corpi in entrata e contesto della cronologia

OpenClaw separa il **corpo del prompt** dal **corpo del comando**:

- `Body`: testo del prompt inviato all'agente. Può includere envelope del canale e
  wrapper cronologici facoltativi.
- `CommandBody`: testo utente grezzo per il parsing di direttive/comandi.
- `RawBody`: alias legacy di `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce cronologia, usa un wrapper condiviso:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Per le **chat non dirette** (gruppi/canali/stanze), il **corpo del messaggio corrente** è prefissato con l'etichetta
del mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti
messaggi in tempo reale e messaggi in coda/cronologia nel prompt dell'agente.

I buffer della cronologia sono **solo pending**: includono i messaggi di gruppo che _non_
hanno attivato un'esecuzione (per esempio, messaggi protetti da menzione) ed **escludono** i messaggi
già presenti nel transcript della sessione.

La rimozione delle direttive si applica solo alla sezione **messaggio corrente** così la cronologia
resta intatta. I canali che wrappano la cronologia dovrebbero impostare `CommandBody` (o
`RawBody`) al testo del messaggio originale e mantenere `Body` come prompt combinato.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (predefinito
globale) e override per canale come `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e followup

Se un'esecuzione è già attiva, i messaggi in entrata possono essere accodati, instradati nell'esecuzione
corrente o raccolti per un turno di followup.

- Configura tramite `messages.queue` (e `messages.queue.byChannel`).
- Modalità: `interrupt`, `steer`, `followup`, `collect`, più varianti backlog.

Dettagli: [Accodamento](/it/concepts/queue).

## Streaming, chunking e batching

Il block streaming invia risposte parziali man mano che il modello produce blocchi di testo.
Il chunking rispetta i limiti di testo del canale ed evita di dividere il codice fenced.

Impostazioni principali:

- `agents.defaults.blockStreamingDefault` (`on|off`, predefinito off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato su idle)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra risposte a blocchi)
- Override di canale: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non-Telegram richiedono `*.blockStreaming: true` esplicito)

Dettagli: [Streaming + chunking](/it/concepts/streaming).

## Visibilità del ragionamento e token

OpenClaw può esporre o nascondere il ragionamento del modello:

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto del ragionamento conta comunque nell'uso dei token quando viene prodotto dal modello.
- Telegram supporta lo stream del ragionamento nella bolla bozza.

Dettagli: [Direttive thinking + reasoning](/it/tools/thinking) e [Uso dei token](/it/reference/token-use).

## Prefissi, threading e risposte

La formattazione dei messaggi in uscita è centralizzata in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata dei prefissi in uscita), più `channels.whatsapp.messagePrefix` (prefisso in entrata di WhatsApp)
- Threading delle risposte tramite `replyToMode` e valori predefiniti per canale

Dettagli: [Configurazione](/it/gateway/config-agents#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso esatto `NO_REPLY` / `no_reply` significa “non inviare una risposta visibile all'utente”.
Quando un turno ha anche media di strumento in sospeso, come audio TTS generato, OpenClaw
rimuove il testo silenzioso ma consegna comunque l'allegato multimediale.
OpenClaw risolve questo comportamento in base al tipo di conversazione:

- Le conversazioni dirette non consentono il silenzio per impostazione predefinita e riscrivono una risposta
  puramente silenziosa in un breve fallback visibile.
- Gruppi/canali consentono il silenzio per impostazione predefinita.
- L'orchestrazione interna consente il silenzio per impostazione predefinita.

OpenClaw usa anche risposte silenziose per errori interni del runner che si verificano
prima di qualsiasi risposta dell'assistente nelle chat non dirette, così gruppi/canali non vedono
messaggi standard di errore del gateway. Le chat dirette mostrano per impostazione predefinita un testo di errore compatto;
i dettagli grezzi del runner vengono mostrati solo quando `/verbose` è `on` o `full`.

I valori predefiniti si trovano sotto `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` possono sovrascriverli per superficie.

Quando la sessione padre ha una o più esecuzioni di sottoagenti generate ancora in sospeso,
le risposte puramente silenziose vengono scartate su tutte le superfici invece di essere riscritte,
così il padre resta silenzioso finché l'evento di completamento del figlio non consegna la risposta reale.

## Correlati

- [Streaming](/it/concepts/streaming) — consegna dei messaggi in tempo reale
- [Retry](/it/concepts/retry) — comportamento di retry della consegna dei messaggi
- [Queue](/it/concepts/queue) — coda di elaborazione dei messaggi
- [Canali](/it/channels) — integrazioni con piattaforme di messaggistica
