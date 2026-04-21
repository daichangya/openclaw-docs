---
read_when:
    - Spiegazione di come i messaggi in entrata diventano risposte
    - Chiarire sessioni, modalità di accodamento o comportamento dello streaming
    - Documentare la visibilità del ragionamento e le implicazioni d'uso
summary: Flusso dei messaggi, sessioni, accodamento e visibilità del ragionamento
title: Messaggi
x-i18n:
    generated_at: "2026-04-21T13:35:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f535d01872e7fcf0f3d99a5c5ac01feddbf7fb562ff61d9ccdf18f109f9922f
    source_path: concepts/messages.md
    workflow: 15
---

# Messaggi

Questa pagina collega tra loro il modo in cui OpenClaw gestisce i messaggi in entrata, le sessioni, l'accodamento,
lo streaming e la visibilità del ragionamento.

## Flusso dei messaggi (panoramica di alto livello)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Le principali opzioni di configurazione si trovano in:

- `messages.*` per prefissi, accodamento e comportamento dei gruppi.
- `agents.defaults.*` per i valori predefiniti di block streaming e chunking.
- Override del canale (`channels.whatsapp.*`, `channels.telegram.*`, ecc.) per limiti e interruttori dello streaming.

Vedi [Configuration](/it/gateway/configuration) per lo schema completo.

## Deduplicazione in entrata

I canali possono riconsegnare lo stesso messaggio dopo le riconnessioni. OpenClaw mantiene una
cache di breve durata indicizzata per channel/account/peer/session/message id, in modo che le consegne duplicate
non attivino un'altra esecuzione dell'agente.

## Debouncing in entrata

Messaggi rapidi e consecutivi provenienti dallo **stesso mittente** possono essere raggruppati in un singolo
turno dell'agente tramite `messages.inbound`. Il debouncing è applicato per channel + conversation
e usa il messaggio più recente per threading/ID della risposta.

Configurazione (valore predefinito globale + override per canale):

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

- Il debounce si applica ai messaggi **solo testo**; contenuti multimediali/allegati vengono inviati immediatamente.
- I comandi di controllo bypassano il debouncing così da rimanere autonomi — **tranne** quando un canale abilita esplicitamente la coalescenza dei DM dello stesso mittente (ad esempio [BlueBubbles `coalesceSameSenderDms`](/it/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), dove i comandi DM attendono all'interno della finestra di debounce così che un payload split-send possa unirsi allo stesso turno dell'agente.

## Sessioni e dispositivi

Le sessioni sono di proprietà del Gateway, non dei client.

- Le chat dirette confluiscono nella chiave di sessione principale dell'agente.
- I gruppi/canali hanno le proprie chiavi di sessione.
- L'archivio delle sessioni e le trascrizioni risiedono sull'host del Gateway.

Più dispositivi/canali possono essere mappati alla stessa sessione, ma la cronologia non viene
sincronizzata completamente con tutti i client. Raccomandazione: usa un solo dispositivo principale per le conversazioni lunghe
per evitare contesti divergenti. La Control UI e la TUI mostrano sempre la
trascrizione della sessione supportata dal Gateway, quindi sono la fonte di verità.

Dettagli: [Session management](/it/concepts/session).

## Corpi in entrata e contesto della cronologia

OpenClaw separa il **corpo del prompt** dal **corpo del comando**:

- `Body`: testo del prompt inviato all'agente. Può includere envelope del canale e
  wrapper della cronologia opzionali.
- `CommandBody`: testo utente grezzo per il parsing di direttive/comandi.
- `RawBody`: alias legacy per `CommandBody` (mantenuto per compatibilità).

Quando un canale fornisce la cronologia, usa un wrapper condiviso:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Per le **chat non dirette** (gruppi/canali/stanze), il **corpo del messaggio corrente** è prefissato con
l'etichetta del mittente (lo stesso stile usato per le voci della cronologia). Questo mantiene coerenti
nell'agente prompt i messaggi in tempo reale e quelli in coda/cronologia.

I buffer della cronologia sono **solo pending**: includono i messaggi dei gruppi che _non_
hanno attivato un'esecuzione (per esempio, messaggi soggetti a mention gating) ed **escludono** i messaggi
già presenti nella trascrizione della sessione.

La rimozione delle direttive si applica solo alla sezione del **messaggio corrente** così che la cronologia
rimanga intatta. I canali che incapsulano la cronologia dovrebbero impostare `CommandBody` (o
`RawBody`) sul testo originale del messaggio e mantenere `Body` come prompt combinato.
I buffer della cronologia sono configurabili tramite `messages.groupChat.historyLimit` (valore predefinito
globale) e override per canale come `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (imposta `0` per disabilitare).

## Accodamento e followup

Se un'esecuzione è già attiva, i messaggi in entrata possono essere accodati, instradati verso l'esecuzione
corrente oppure raccolti per un turno di followup.

- Configura tramite `messages.queue` (e `messages.queue.byChannel`).
- Modalità: `interrupt`, `steer`, `followup`, `collect`, più le varianti backlog.

Dettagli: [Queueing](/it/concepts/queue).

## Streaming, chunking e batching

Il block streaming invia risposte parziali mentre il modello produce blocchi di testo.
Il chunking rispetta i limiti di testo del canale ed evita di spezzare blocchi di codice fenced.

Impostazioni principali:

- `agents.defaults.blockStreamingDefault` (`on|off`, disattivato per impostazione predefinita)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching basato sull'inattività)
- `agents.defaults.humanDelay` (pausa simile a quella umana tra le risposte a blocchi)
- Override del canale: `*.blockStreaming` e `*.blockStreamingCoalesce` (i canali non Telegram richiedono `*.blockStreaming: true` esplicito)

Dettagli: [Streaming + chunking](/it/concepts/streaming).

## Visibilità del ragionamento e token

OpenClaw può esporre o nascondere il ragionamento del modello:

- `/reasoning on|off|stream` controlla la visibilità.
- Il contenuto del ragionamento conta comunque nell'uso dei token quando viene prodotto dal modello.
- Telegram supporta lo stream del ragionamento nella bolla di bozza.

Dettagli: [Thinking + reasoning directives](/it/tools/thinking) e [Token use](/it/reference/token-use).

## Prefissi, threading e risposte

La formattazione dei messaggi in uscita è centralizzata in `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata del prefisso in uscita), oltre a `channels.whatsapp.messagePrefix` (prefisso in entrata di WhatsApp)
- Reply threading tramite `replyToMode` e valori predefiniti per canale

Dettagli: [Configuration](/it/gateway/configuration-reference#messages) e documentazione dei canali.

## Risposte silenziose

Il token silenzioso esatto `NO_REPLY` / `no_reply` significa “non inviare una risposta visibile all'utente”.
OpenClaw applica questo comportamento in base al tipo di conversazione:

- Le conversazioni dirette non consentono il silenzio per impostazione predefinita e riscrivono una risposta silenziosa pura
  in un breve fallback visibile.
- I gruppi/canali consentono il silenzio per impostazione predefinita.
- L'orchestrazione interna consente il silenzio per impostazione predefinita.

I valori predefiniti si trovano in `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` possono sostituirli per singola surface.

## Correlati

- [Streaming](/it/concepts/streaming) — consegna dei messaggi in tempo reale
- [Retry](/it/concepts/retry) — comportamento di ritentativo della consegna dei messaggi
- [Queue](/it/concepts/queue) — coda di elaborazione dei messaggi
- [Channels](/it/channels) — integrazioni con piattaforme di messaggistica
