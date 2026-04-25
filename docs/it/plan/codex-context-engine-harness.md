---
read_when:
    - Stai integrando il comportamento del ciclo di vita del motore di contesto nell'harness Codex
    - Ti serve che lossless-claw o un altro Plugin del motore di contesto funzioni con sessioni dell'harness integrato codex/*
    - Stai confrontando il comportamento del contesto tra PI integrato e app-server Codex
summary: Specifica per fare in modo che l'harness app-server Codex incluso rispetti i Plugin del motore di contesto di OpenClaw
title: Port del motore di contesto dell'Harness Codex
x-i18n:
    generated_at: "2026-04-25T13:50:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## Stato

Bozza di specifica di implementazione.

## Obiettivo

Fare in modo che l'harness app-server Codex incluso rispetti lo stesso contratto
di ciclo di vita del motore di contesto di OpenClaw che i turni PI integrati già rispettano.

Una sessione che usa `agents.defaults.embeddedHarness.runtime: "codex"` o un
modello `codex/*` dovrebbe comunque permettere al Plugin del motore di contesto selezionato, come
`lossless-claw`, di controllare l'assemblaggio del contesto, l'ingest post-turno, la manutenzione e la policy di Compaction a livello OpenClaw per quanto consentito dal confine dell'app-server Codex.

## Non obiettivi

- Non reimplementare gli interni dell'app-server Codex.
- Non fare in modo che la Compaction del thread nativo Codex produca un riepilogo lossless-claw.
- Non richiedere ai modelli non Codex di usare l'harness Codex.
- Non cambiare il comportamento delle sessioni ACP/acpx. Questa specifica riguarda solo il percorso dell'harness agente integrato non-ACP.
- Non fare in modo che Plugin di terze parti registrino factory di estensione dell'app-server Codex; il confine di fiducia esistente del Plugin incluso resta invariato.

## Architettura attuale

Il ciclo di esecuzione integrato risolve il motore di contesto configurato una volta per esecuzione prima
di selezionare un harness low-level concreto:

- `src/agents/pi-embedded-runner/run.ts`
  - inizializza i Plugin del motore di contesto
  - chiama `resolveContextEngine(params.config)`
  - passa `contextEngine` e `contextTokenBudget` a
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega all'harness agente selezionato:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

L'harness app-server Codex è registrato dal Plugin Codex incluso:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

L'implementazione dell'harness Codex riceve gli stessi `EmbeddedRunAttemptParams`
dei tentativi supportati da PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Ciò significa che il punto di hook richiesto si trova nel codice controllato da OpenClaw. Il confine esterno
è il protocollo stesso dell'app-server Codex: OpenClaw può controllare ciò che invia a `thread/start`, `thread/resume` e `turn/start`, e può osservare le notifiche, ma non può cambiare lo store interno dei thread di Codex o il suo compattatore nativo.

## Lacuna attuale

I tentativi PI integrati chiamano direttamente il ciclo di vita del motore di contesto:

- bootstrap/manutenzione prima del tentativo
- assemble prima della chiamata al modello
- afterTurn o ingest dopo il tentativo
- manutenzione dopo un turno riuscito
- Compaction del motore di contesto per i motori che possiedono la Compaction

Codice PI rilevante:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

I tentativi dell'app-server Codex attualmente eseguono hook generici dell'harness agente e fanno il mirror
della trascrizione, ma non chiamano `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` o
`params.contextEngine.maintain`.

Codice Codex rilevante:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamento desiderato

Per i turni dell'harness Codex, OpenClaw dovrebbe preservare questo ciclo di vita:

1. Leggere la trascrizione della sessione OpenClaw di cui è stato fatto il mirror.
2. Eseguire il bootstrap del motore di contesto attivo quando esiste un file di sessione precedente.
3. Eseguire la manutenzione di bootstrap quando disponibile.
4. Assemblare il contesto usando il motore di contesto attivo.
5. Convertire il contesto assemblato in input compatibili con Codex.
6. Avviare o riprendere il thread Codex con istruzioni developer che includono eventuali
   `systemPromptAddition` del motore di contesto.
7. Avviare il turno Codex con il prompt rivolto all'utente assemblato.
8. Fare il mirror del risultato Codex nella trascrizione OpenClaw.
9. Chiamare `afterTurn` se implementato, altrimenti `ingestBatch`/`ingest`, usando lo snapshot della trascrizione di cui è stato fatto il mirror.
10. Eseguire la manutenzione del turno dopo turni riusciti non interrotti.
11. Preservare i segnali di Compaction nativi di Codex e gli hook di Compaction di OpenClaw.

## Vincoli di progettazione

### L'app-server Codex resta canonico per lo stato del thread nativo

Codex possiede il suo thread nativo e qualsiasi cronologia estesa interna. OpenClaw non dovrebbe tentare
di modificare la cronologia interna dell'app-server se non tramite chiamate di protocollo supportate.

Il mirror della trascrizione di OpenClaw resta la fonte per le funzionalità OpenClaw:

- cronologia chat
- ricerca
- bookkeeping di `/new` e `/reset`
- futuro cambio di modello o harness
- stato del Plugin del motore di contesto

### L'assemblaggio del motore di contesto deve essere proiettato negli input Codex

L'interfaccia del motore di contesto restituisce `AgentMessage[]` di OpenClaw, non una patch del thread Codex. `turn/start` dell'app-server Codex accetta un input utente corrente, mentre `thread/start` e `thread/resume` accettano istruzioni developer.

Pertanto l'implementazione ha bisogno di un livello di proiezione. La prima versione sicura
dovrebbe evitare di fingere di poter sostituire la cronologia interna di Codex. Dovrebbe iniettare il contesto assemblato come materiale deterministico di prompt/istruzioni developer attorno al turno corrente.

### La stabilità della prompt-cache è importante

Per motori come lossless-claw, il contesto assemblato dovrebbe essere deterministico per input invariati. Non aggiungere timestamp, ID casuali o ordinamento non deterministico al testo del contesto generato.

### La semantica di fallback di PI non cambia

La selezione dell'harness resta invariata:

- `runtime: "pi"` forza PI
- `runtime: "codex"` seleziona l'harness Codex registrato
- `runtime: "auto"` permette agli harness Plugin di reclamare provider/modelli supportati
- `fallback: "none"` disabilita il fallback a PI quando nessun harness Plugin corrisponde

Questo lavoro cambia ciò che accade dopo che l'harness Codex è stato selezionato.

## Piano di implementazione

### 1. Esportare o ricollocare helper riutilizzabili del tentativo del motore di contesto

Oggi gli helper riutilizzabili del ciclo di vita si trovano sotto il runner PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex non dovrebbe importare da un percorso di implementazione il cui nome implica PI, se possiamo evitarlo.

Crea un modulo neutrale rispetto all'harness, per esempio:

- `src/agents/harness/context-engine-lifecycle.ts`

Sposta o riesporta:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un piccolo wrapper attorno a `runContextEngineMaintenance`

Mantieni funzionanti gli import PI o riesportando dai vecchi file oppure aggiornando i call site PI nella stessa PR.

I nomi degli helper neutrali non dovrebbero menzionare PI.

Nomi suggeriti:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Aggiungere un helper di proiezione del contesto Codex

Aggiungi un nuovo modulo:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilità:

- Accettare `AgentMessage[]` assemblati, la cronologia originale di cui è stato fatto il mirror e il prompt corrente.
- Determinare quale contesto appartiene alle istruzioni developer rispetto all'input utente corrente.
- Preservare il prompt utente corrente come richiesta finale azionabile.
- Rendere i messaggi precedenti in un formato stabile ed esplicito.
- Evitare metadati volatili.

API proposta:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Prima proiezione raccomandata:

- Mettere `systemPromptAddition` nelle istruzioni developer.
- Mettere il contesto della trascrizione assemblata prima del prompt corrente in `promptText`.
- Etichettarlo chiaramente come contesto assemblato da OpenClaw.
- Mantenere il prompt corrente per ultimo.
- Escludere il prompt utente corrente duplicato se compare già in coda.

Forma di prompt di esempio:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Questa soluzione è meno elegante della chirurgia sulla cronologia nativa di Codex, ma è implementabile all'interno di OpenClaw e preserva la semantica del motore di contesto.

Miglioramento futuro: se l'app-server Codex espone un protocollo per sostituire o integrare la cronologia del thread, sostituire questo livello di proiezione per usare quell'API.

### 3. Collegare bootstrap prima dell'avvio del thread Codex

In `extensions/codex/src/app-server/run-attempt.ts`:

- Leggere la cronologia della sessione di cui è stato fatto il mirror come oggi.
- Determinare se il file di sessione esisteva prima di questa esecuzione. Preferire un helper
  che controlli `fs.stat(params.sessionFile)` prima delle scritture del mirror.
- Aprire un `SessionManager` o usare un adattatore ristretto del session manager se l'helper lo richiede.
- Chiamare l'helper bootstrap neutrale quando `params.contextEngine` esiste.

Pseudo-flusso:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Usa la stessa convenzione `sessionKey` del bridge degli strumenti Codex e del mirror della trascrizione. Oggi Codex calcola `sandboxSessionKey` da `params.sessionKey` o `params.sessionId`; usalo in modo coerente a meno che non ci sia un motivo per preservare il `params.sessionKey` grezzo.

### 4. Collegare assemble prima di `thread/start` / `thread/resume` e `turn/start`

In `runCodexAppServerAttempt`:

1. Costruire prima gli strumenti dinamici, così il motore di contesto vede i nomi reali degli strumenti disponibili.
2. Leggere la cronologia di cui è stato fatto il mirror.
3. Eseguire `assemble(...)` del motore di contesto quando `params.contextEngine` esiste.
4. Proiettare il risultato assemblato in:
   - aggiunta alle istruzioni developer
   - testo del prompt per `turn/start`

L'attuale chiamata hook:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

dovrebbe diventare consapevole del contesto:

1. calcolare le istruzioni developer di base con `buildDeveloperInstructions(params)`
2. applicare l'assemblaggio/proiezione del motore di contesto
3. eseguire `before_prompt_build` con il prompt/istruzioni developer proiettati

Questo ordine permette agli hook generici del prompt di vedere lo stesso prompt che riceverà Codex. Se abbiamo bisogno di una parità rigorosa con PI, esegui l'assemblaggio del motore di contesto prima della composizione degli hook, perché PI applica `systemPromptAddition` del motore di contesto al system prompt finale dopo la sua pipeline del prompt. L'invariante importante è che sia il motore di contesto sia gli hook ottengano un ordine deterministico e documentato.

Ordine raccomandato per la prima implementazione:

1. `buildDeveloperInstructions(params)`
2. `assemble()` del motore di contesto
3. aggiungere/preporre `systemPromptAddition` alle istruzioni developer
4. proiettare i messaggi assemblati nel testo del prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. passare le istruzioni developer finali a `startOrResumeThread(...)`
7. passare il testo del prompt finale a `buildTurnStartParams(...)`

La specifica dovrebbe essere codificata nei test così che modifiche future non la riordinino accidentalmente.

### 5. Preservare una formattazione stabile per la prompt-cache

L'helper di proiezione deve produrre output stabile a livello di byte per input identici:

- ordine stabile dei messaggi
- etichette di ruolo stabili
- nessun timestamp generato
- nessuna fuga dell'ordine delle chiavi degli oggetti
- nessun delimitatore casuale
- nessun ID per esecuzione

Usa delimitatori fissi e sezioni esplicite.

### 6. Collegare il post-turno dopo il mirror della trascrizione

`CodexAppServerEventProjector` di Codex costruisce uno `messagesSnapshot` locale per il turno corrente. `mirrorTranscriptBestEffort(...)` scrive quello snapshot nel mirror della trascrizione OpenClaw.

Dopo che il mirror riesce o fallisce, chiama il finalizzatore del motore di contesto con il miglior snapshot dei messaggi disponibile:

- Preferisci il contesto completo della sessione sottoposta a mirror dopo la scrittura, perché `afterTurn` si aspetta lo snapshot della sessione, non solo il turno corrente.
- Usa come fallback `historyMessages + result.messagesSnapshot` se il file di sessione non può essere riaperto.

Pseudo-flusso:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Se il mirror fallisce, chiama comunque `afterTurn` con lo snapshot di fallback, ma registra che il motore di contesto sta eseguendo l'ingest da dati di turno di fallback.

### 7. Normalizzare usage e contesto runtime della prompt-cache

I risultati Codex includono usage normalizzato dalle notifiche token dell'app-server quando disponibili. Passa quello usage nel contesto runtime del motore di contesto.

Se l'app-server Codex in futuro espone dettagli cache read/write, mappali in `ContextEnginePromptCacheInfo`. Fino ad allora, ometti `promptCache` invece di inventare zeri.

### 8. Policy di Compaction

Esistono due sistemi di Compaction:

1. `compact()` del motore di contesto OpenClaw
2. `thread/compact/start` nativo dell'app-server Codex

Non confonderli silenziosamente.

#### `/compact` e Compaction esplicita OpenClaw

Quando il motore di contesto selezionato ha `info.ownsCompaction === true`, la Compaction esplicita di OpenClaw dovrebbe preferire il risultato di `compact()` del motore di contesto per il mirror della trascrizione OpenClaw e per lo stato del Plugin.

Quando l'harness Codex selezionato ha un thread binding nativo, possiamo inoltre richiedere la Compaction nativa Codex per mantenere sano il thread dell'app-server, ma questo deve essere riportato come azione backend separata nei dettagli.

Comportamento raccomandato:

- Se `contextEngine.info.ownsCompaction === true`:
  - chiama prima `compact()` del motore di contesto
  - poi chiama in best-effort la Compaction nativa Codex quando esiste un thread binding
  - restituisci il risultato del motore di contesto come risultato primario
  - includi lo stato della Compaction nativa Codex in `details.codexNativeCompaction`
- Se il motore di contesto attivo non possiede la Compaction:
  - preserva l'attuale comportamento di Compaction nativa Codex

Questo probabilmente richiede di modificare `extensions/codex/src/app-server/compact.ts` oppure di incapsularlo dal percorso generico di Compaction, a seconda di dove viene invocato `maybeCompactAgentHarnessSession(...)`.

#### Eventi `contextCompaction` nativi Codex in turno

Codex può emettere eventi item `contextCompaction` durante un turno. Mantieni l'attuale emissione degli hook before/after compaction in `event-projector.ts`, ma non trattarla come una Compaction completata del motore di contesto.

Per i motori che possiedono la Compaction, emetti una diagnostica esplicita quando Codex esegue comunque la Compaction nativa:

- nome stream/evento: lo stream `compaction` esistente è accettabile
- dettagli: `{ backend: "codex-app-server", ownsCompaction: true }`

Questo rende verificabile la separazione.

### 9. Reset della sessione e comportamento dei binding

L'attuale `reset(...)` dell'harness Codex cancella il binding dell'app-server Codex dal file di sessione OpenClaw. Preserva questo comportamento.

Assicurati inoltre che la pulizia dello stato del motore di contesto continui ad avvenire tramite i percorsi esistenti del ciclo di vita della sessione OpenClaw. Non aggiungere pulizia specifica di Codex a meno che il ciclo di vita del motore di contesto attualmente non perda eventi di reset/delete per tutti gli harness.

### 10. Gestione degli errori

Segui la semantica PI:

- i fallimenti di bootstrap avvisano e continuano
- i fallimenti di assemble avvisano e tornano ai messaggi/prompt della pipeline non assemblata
- i fallimenti di afterTurn/ingest avvisano e marcano come non riuscita la finalizzazione post-turno
- la manutenzione viene eseguita solo dopo turni riusciti, non interrotti e non yield
- gli errori di Compaction non devono essere ritentati come nuovi prompt

Aggiunte specifiche Codex:

- Se la proiezione del contesto fallisce, avvisa e torna al prompt originale.
- Se il mirror della trascrizione fallisce, tenta comunque la finalizzazione del motore di contesto con messaggi di fallback.
- Se la Compaction nativa Codex fallisce dopo il successo della Compaction del motore di contesto, non far fallire l'intera Compaction OpenClaw quando il motore di contesto è primario.

## Piano di test

### Test unitari

Aggiungi test sotto `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex chiama `bootstrap` quando esiste un file di sessione.
   - Codex chiama `assemble` con messaggi sottoposti a mirror, token budget, nomi degli strumenti, modalità citations, model id e prompt.
   - `systemPromptAddition` viene inclusa nelle istruzioni developer.
   - I messaggi assemblati vengono proiettati nel prompt prima della richiesta corrente.
   - Codex chiama `afterTurn` dopo il mirror della trascrizione.
   - Senza `afterTurn`, Codex chiama `ingestBatch` o `ingest` per messaggio.
   - La manutenzione del turno viene eseguita dopo turni riusciti.
   - La manutenzione del turno non viene eseguita in caso di prompt error, abort o yield abort.

2. `context-engine-projection.test.ts`
   - output stabile per input identici
   - nessun prompt corrente duplicato quando la cronologia assemblata lo include
   - gestisce cronologia vuota
   - preserva l'ordine dei ruoli
   - include system prompt addition solo nelle istruzioni developer

3. `compact.context-engine.test.ts`
   - vince il risultato primario del motore di contesto proprietario
   - lo stato della Compaction nativa Codex compare nei dettagli quando viene tentata anch'essa
   - il fallimento nativo Codex non fa fallire la Compaction del motore di contesto proprietario
   - il motore di contesto non proprietario preserva l'attuale comportamento della Compaction nativa

### Test esistenti da aggiornare

- `extensions/codex/src/app-server/run-attempt.test.ts` se presente, altrimenti i test di esecuzione più vicini dell'app-server Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` solo se cambiano i dettagli degli eventi di Compaction.
- `src/agents/harness/selection.test.ts` non dovrebbe richiedere modifiche a meno che non cambi il comportamento della configurazione; dovrebbe restare stabile.
- I test PI del motore di contesto dovrebbero continuare a passare invariati.

### Test di integrazione / live

Aggiungi o estendi smoke test live dell'harness Codex:

- configura `plugins.slots.contextEngine` su un motore di test
- configura `agents.defaults.model` su un modello `codex/*`
- configura `agents.defaults.embeddedHarness.runtime = "codex"`
- verifica che il motore di test abbia osservato:
  - bootstrap
  - assemble
  - afterTurn o ingest
  - manutenzione

Evita di richiedere lossless-claw nei test core di OpenClaw. Usa un piccolo Plugin finto del motore di contesto nel repo.

## Osservabilità

Aggiungi log di debug attorno alle chiamate del ciclo di vita del motore di contesto Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` con motivo
- `codex native compaction completed alongside context-engine compaction`

Evita di registrare prompt completi o contenuti della trascrizione.

Aggiungi campi strutturati quando utili:

- `sessionId`
- `sessionKey` redatto o omesso secondo la pratica di logging esistente
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migrazione / compatibilità

Questo dovrebbe essere retrocompatibile:

- Se nessun motore di contesto è configurato, il comportamento legacy del motore di contesto dovrebbe essere equivalente al comportamento attuale dell'harness Codex.
- Se `assemble` del motore di contesto fallisce, Codex dovrebbe continuare con il percorso del prompt originale.
- I thread binding Codex esistenti dovrebbero restare validi.
- Il fingerprinting degli strumenti dinamici non dovrebbe includere l'output del motore di contesto; altrimenti ogni modifica del contesto potrebbe forzare un nuovo thread Codex. Solo il catalogo degli strumenti dovrebbe influenzare il fingerprint dinamico degli strumenti.

## Questioni aperte

1. Il contesto assemblato dovrebbe essere iniettato interamente nel prompt utente, interamente nelle istruzioni developer o diviso?

   Raccomandazione: diviso. Metti `systemPromptAddition` nelle istruzioni developer; metti il contesto della trascrizione assemblata nel wrapper del prompt utente. Questo corrisponde meglio all'attuale protocollo Codex senza modificare la cronologia nativa del thread.

2. La Compaction nativa Codex dovrebbe essere disabilitata quando un motore di contesto possiede la Compaction?

   Raccomandazione: no, non inizialmente. La Compaction nativa Codex può comunque essere necessaria per mantenere vivo il thread dell'app-server. Ma deve essere riportata come Compaction nativa Codex, non come Compaction del motore di contesto.

3. `before_prompt_build` dovrebbe essere eseguito prima o dopo l'assemblaggio del motore di contesto?

   Raccomandazione: dopo la proiezione del motore di contesto per Codex, così gli hook generici dell'harness vedono il prompt/le istruzioni developer reali che Codex riceverà. Se la parità PI richiede il contrario, codifica l'ordine scelto nei test e documentalo qui.

4. L'app-server Codex può accettare in futuro un override strutturato del contesto/della cronologia?

   Sconosciuto. Se può, sostituisci il livello di proiezione testuale con quel protocollo e mantieni invariate le chiamate del ciclo di vita.

## Criteri di accettazione

- Un turno dell'harness integrato `codex/*` invoca il ciclo di vita assemble del motore di contesto selezionato.
- Un `systemPromptAddition` del motore di contesto influisce sulle istruzioni developer di Codex.
- Il contesto assemblato influisce in modo deterministico sull'input del turno Codex.
- I turni Codex riusciti chiamano `afterTurn` o il fallback ingest.
- I turni Codex riusciti eseguono la manutenzione del turno del motore di contesto.
- I turni falliti/interrotti/yield-aborted non eseguono la manutenzione del turno.
- La Compaction posseduta dal motore di contesto resta primaria per lo stato OpenClaw/Plugin.
- La Compaction nativa Codex resta verificabile come comportamento nativo Codex.
- Il comportamento del motore di contesto PI esistente resta invariato.
- Il comportamento esistente dell'harness Codex resta invariato quando non è selezionato alcun motore di contesto non legacy o quando l'assemblaggio fallisce.
