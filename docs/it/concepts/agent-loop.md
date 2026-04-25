---
read_when:
    - Hai bisogno di una spiegazione dettagliata e precisa del loop dell'agente o degli eventi del ciclo di vita
    - Stai modificando l'accodamento delle sessioni, le scritture della trascrizione o il comportamento del lock di scrittura della sessione
summary: Ciclo di vita del loop dell'agente, stream e semantica di attesa
title: loop dell'agente
x-i18n:
    generated_at: "2026-04-25T13:44:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

Un loop agentico è l'intera esecuzione “reale” di un agente: intake → assemblaggio del contesto → inferenza del modello →
esecuzione degli strumenti → risposte in streaming → persistenza. È il percorso autorevole che trasforma un messaggio
in azioni e in una risposta finale, mantenendo coerente lo stato della sessione.

In OpenClaw, un loop è una singola esecuzione serializzata per sessione che emette eventi di ciclo di vita e di stream
mentre il modello ragiona, chiama strumenti e trasmette output in streaming. Questo documento spiega come quel loop autentico è
collegato end-to-end.

## Punti di ingresso

- Gateway RPC: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Come funziona (alto livello)

1. L'RPC `agent` convalida i parametri, risolve la sessione (sessionKey/sessionId), rende persistenti i metadati della sessione e restituisce subito `{ runId, acceptedAt }`.
2. `agentCommand` esegue l'agente:
   - risolve i valori predefiniti di modello + thinking/verbose/trace
   - carica lo snapshot delle Skills
   - chiama `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emette **lifecycle end/error** se il loop incorporato non ne emette uno
3. `runEmbeddedPiAgent`:
   - serializza le esecuzioni tramite code per-sessione + globale
   - risolve il profilo modello + auth e costruisce la sessione Pi
   - si sottoscrive agli eventi Pi e trasmette in streaming i delta assistant/tool
   - applica il timeout -> interrompe l'esecuzione se viene superato
   - restituisce payload e metadati di utilizzo
4. `subscribeEmbeddedPiSession` collega gli eventi pi-agent-core allo stream `agent` di OpenClaw:
   - eventi tool => `stream: "tool"`
   - delta assistant => `stream: "assistant"`
   - eventi lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - attende **lifecycle end/error** per `runId`
   - restituisce `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Accodamento + concorrenza

- Le esecuzioni sono serializzate per chiave di sessione (corsia di sessione) e facoltativamente tramite una corsia globale.
- Questo evita race tra strumenti/sessione e mantiene coerente la cronologia della sessione.
- I canali di messaggistica possono scegliere modalità di coda (collect/steer/followup) che alimentano questo sistema di corsie.
  Vedi [Command Queue](/it/concepts/queue).
- Anche le scritture della trascrizione sono protette da un lock di scrittura della sessione sul file della sessione. Il lock è
  consapevole del processo e basato su file, quindi intercetta scrittori che aggirano la coda in-processo o provengono
  da un altro processo.
- I lock di scrittura della sessione non sono rientranti per impostazione predefinita. Se un helper annida intenzionalmente l'acquisizione dello
  stesso lock preservando un solo writer logico, deve abilitarlo esplicitamente con
  `allowReentrant: true`.

## Preparazione della sessione + workspace

- Il workspace viene risolto e creato; le esecuzioni sandbox possono reindirizzare a una root workspace sandbox.
- Le Skills vengono caricate (o riutilizzate da uno snapshot) e iniettate nell'env e nel prompt.
- I file bootstrap/context vengono risolti e iniettati nel report del system prompt.
- Viene acquisito un lock di scrittura della sessione; `SessionManager` viene aperto e preparato prima dello streaming. Qualsiasi
  successivo percorso di riscrittura della trascrizione, Compaction o troncamento deve acquisire lo stesso lock prima di aprire o
  modificare il file della trascrizione.

## Assemblaggio del prompt + system prompt

- Il system prompt viene costruito a partire dal prompt base di OpenClaw, dal prompt delle Skills, dal contesto bootstrap e dagli override per esecuzione.
- Vengono applicati i limiti specifici del modello e i token riservati per Compaction.
- Vedi [System prompt](/it/concepts/system-prompt) per ciò che vede il modello.

## Punti di Hook (dove puoi intercettare)

OpenClaw ha due sistemi di Hook:

- **Hook interni** (Gateway hooks): script guidati da eventi per comandi ed eventi del ciclo di vita.
- **Plugin hooks**: punti di estensione all'interno del ciclo di vita agente/strumento e della pipeline del gateway.

### Hook interni (Gateway hooks)

- **`agent:bootstrap`**: viene eseguito durante la costruzione dei file bootstrap prima che il system prompt sia finalizzato.
  Usalo per aggiungere/rimuovere file di contesto bootstrap.
- **Hook dei comandi**: `/new`, `/reset`, `/stop` e altri eventi di comando (vedi documento Hooks).

Vedi [Hooks](/it/automation/hooks) per configurazione ed esempi.

### Plugin hooks (ciclo di vita agente + gateway)

Questi vengono eseguiti all'interno del loop dell'agente o della pipeline del gateway:

- **`before_model_resolve`**: viene eseguito prima della sessione (senza `messages`) per sostituire deterministicamente provider/modello prima della risoluzione del modello.
- **`before_prompt_build`**: viene eseguito dopo il caricamento della sessione (con `messages`) per iniettare `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` prima dell'invio del prompt. Usa `prependContext` per testo dinamico per-turno e i campi di contesto di sistema per una guida stabile che deve stare nello spazio del system prompt.
- **`before_agent_start`**: Hook legacy di compatibilità che può essere eseguito in entrambe le fasi; preferisci gli Hook espliciti sopra.
- **`before_agent_reply`**: viene eseguito dopo le azioni inline e prima della chiamata LLM, consentendo a un plugin di rivendicare il turno e restituire una risposta sintetica o silenziare del tutto il turno.
- **`agent_end`**: ispeziona l'elenco finale dei messaggi e i metadati dell'esecuzione dopo il completamento.
- **`before_compaction` / `after_compaction`**: osserva o annota i cicli di Compaction.
- **`before_tool_call` / `after_tool_call`**: intercetta parametri/risultati degli strumenti.
- **`before_install`**: ispeziona i risultati della scansione integrata e può opzionalmente bloccare installazioni di skill o plugin.
- **`tool_result_persist`**: trasforma sincronicamente i risultati degli strumenti prima che vengano scritti in una trascrizione di sessione di proprietà OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: Hook per messaggi in ingresso + in uscita.
- **`session_start` / `session_end`**: boundary del ciclo di vita della sessione.
- **`gateway_start` / `gateway_stop`**: eventi del ciclo di vita del gateway.

Regole decisionali degli Hook per i guard di uscita/strumenti:

- `before_tool_call`: `{ block: true }` è terminale e ferma gli handler a priorità inferiore.
- `before_tool_call`: `{ block: false }` non ha effetto e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale e ferma gli handler a priorità inferiore.
- `before_install`: `{ block: false }` non ha effetto e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale e ferma gli handler a priorità inferiore.
- `message_sending`: `{ cancel: false }` non ha effetto e non annulla una cancellazione precedente.

Vedi [Plugin hooks](/it/plugins/hooks) per i dettagli sull'API degli Hook e sulla registrazione.

Gli harness possono adattare questi Hook in modo diverso. L'harness app-server di Codex mantiene
i plugin hook di OpenClaw come contratto di compatibilità per le superfici rispecchiate documentate,
mentre gli hook nativi Codex restano un meccanismo Codex separato di livello inferiore.

## Streaming + risposte parziali

- I delta assistant vengono trasmessi in streaming da pi-agent-core ed emessi come eventi `assistant`.
- Lo streaming a blocchi può emettere risposte parziali su `text_end` o `message_end`.
- Lo streaming del reasoning può essere emesso come stream separato o come risposte a blocchi.
- Vedi [Streaming](/it/concepts/streaming) per il comportamento di chunking e risposte a blocchi.

## Esecuzione degli strumenti + strumenti di messaggistica

- Gli eventi start/update/end degli strumenti vengono emessi sullo stream `tool`.
- I risultati degli strumenti vengono sanificati per dimensione e payload immagine prima del logging/emissione.
- Gli invii degli strumenti di messaggistica vengono tracciati per sopprimere conferme assistant duplicate.

## Modellazione della risposta + soppressione

- I payload finali vengono assemblati a partire da:
  - testo assistant (e reasoning facoltativo)
  - riepiloghi inline degli strumenti (quando verbose + consentiti)
  - testo di errore assistant quando il modello restituisce un errore
- Il token esatto di silenzio `NO_REPLY` / `no_reply` viene filtrato dai
  payload in uscita.
- I duplicati degli strumenti di messaggistica vengono rimossi dall'elenco finale dei payload.
- Se non restano payload renderizzabili e uno strumento ha restituito un errore, viene emessa una risposta fallback di errore dello strumento
  (a meno che uno strumento di messaggistica non abbia già inviato una risposta visibile all'utente).

## Compaction + tentativi ripetuti

- La Compaction automatica emette eventi stream `compaction` e può attivare un tentativo ripetuto.
- Al tentativo ripetuto, i buffer in memoria e i riepiloghi degli strumenti vengono reimpostati per evitare output duplicati.
- Vedi [Compaction](/it/concepts/compaction) per la pipeline di Compaction.

## Stream di eventi (oggi)

- `lifecycle`: emesso da `subscribeEmbeddedPiSession` (e come fallback da `agentCommand`)
- `assistant`: delta in streaming da pi-agent-core
- `tool`: eventi degli strumenti in streaming da pi-agent-core

## Gestione del canale di chat

- I delta assistant vengono bufferizzati in messaggi chat `delta`.
- Un chat `final` viene emesso su **lifecycle end/error**.

## Timeout

- Predefinito `agent.wait`: 30s (solo l'attesa). Il parametro `timeoutMs` lo sostituisce.
- Runtime dell'agente: predefinito `agents.defaults.timeoutSeconds` 172800s (48 ore); applicato nel timer di interruzione `runEmbeddedPiAgent`.
- Timeout idle LLM: `agents.defaults.llm.idleTimeoutSeconds` interrompe una richiesta al modello quando non arrivano chunk di risposta prima della finestra idle. Impostalo esplicitamente per modelli locali lenti o provider di reasoning/tool-call; impostalo a 0 per disabilitarlo. Se non è impostato, OpenClaw usa `agents.defaults.timeoutSeconds` quando configurato, altrimenti 120s. Le esecuzioni attivate da Cron senza timeout LLM o agente esplicito disabilitano il watchdog idle e si affidano al timeout esterno di Cron.

## Dove le cose possono terminare in anticipo

- Timeout dell'agente (interruzione)
- AbortSignal (annullamento)
- Disconnessione del Gateway o timeout RPC
- Timeout di `agent.wait` (solo attesa, non arresta l'agente)

## Correlati

- [Tools](/it/tools) — strumenti dell'agente disponibili
- [Hooks](/it/automation/hooks) — script guidati da eventi attivati dagli eventi del ciclo di vita dell'agente
- [Compaction](/it/concepts/compaction) — come vengono riepilogate le conversazioni lunghe
- [Exec Approvals](/it/tools/exec-approvals) — gate di approvazione per i comandi shell
- [Thinking](/it/tools/thinking) — configurazione del livello di thinking/reasoning
