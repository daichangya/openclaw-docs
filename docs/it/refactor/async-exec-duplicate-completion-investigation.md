---
x-i18n:
    generated_at: "2026-04-16T08:18:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95e56c5411204363676f002059c942201503e2359515d1a4b409882cc2e04920
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Indagine sul completamento duplicato di Async Exec

## Ambito

- Sessione: `agent:main:telegram:group:-1003774691294:topic:1`
- Sintomo: lo stesso completamento async exec per sessione/run `keen-nexus` è stato registrato due volte in LCM come turni utente.
- Obiettivo: identificare se la causa più probabile sia una duplicazione dell'iniezione nella sessione oppure un semplice retry della consegna in uscita.

## Conclusione

Con maggiore probabilità si tratta di **duplicazione dell'iniezione nella sessione**, non di un puro retry della consegna in uscita.

La lacuna più significativa lato gateway è nel **percorso di completamento exec del Node**:

1. Un completamento exec lato Node emette `exec.finished` con il `runId` completo.
2. Il Gateway `server-node-events` lo converte in un evento di sistema e richiede un Heartbeat.
3. L'esecuzione dell'Heartbeat inietta il blocco di eventi di sistema drenati nel prompt dell'agente.
4. Il runner incorporato persiste quel prompt come un nuovo turno utente nel transcript della sessione.

Se lo stesso `exec.finished` raggiunge il gateway due volte per lo stesso `runId` per qualsiasi motivo (replay, duplicato su reconnessione, resend a monte, producer duplicato), OpenClaw attualmente **non ha alcun controllo di idempotenza con chiave `runId`/`contextKey`** su questo percorso. La seconda copia diventerà un secondo messaggio utente con lo stesso contenuto.

## Percorso del codice esatto

### 1. Producer: evento di completamento exec del Node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emette `node.event` con evento `exec.finished`.
  - Il payload include `sessionKey` e il `runId` completo.

### 2. Ingestione eventi del Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Gestisce `exec.finished`.
  - Costruisce il testo:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Lo accoda tramite:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Richiede immediatamente un risveglio:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Debolezza nella deduplica degli eventi di sistema

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` sopprime solo i **duplicati consecutivi del testo**:
    - `if (entry.lastText === cleaned) return false`
  - Memorizza `contextKey`, ma **non** usa `contextKey` per l'idempotenza.
  - Dopo il drain, la soppressione dei duplicati si azzera.

Questo significa che un `exec.finished` riprodotto con lo stesso `runId` può essere accettato di nuovo in seguito, anche se il codice aveva già un candidato stabile per l'idempotenza (`exec:<runId>`).

### 4. La gestione del risveglio non è il duplicatore principale

- `src/infra/heartbeat-wake.ts:79-117`
  - I risvegli vengono coalescenti per `(agentId, sessionKey)`.
  - Le richieste di risveglio duplicate per la stessa destinazione collassano in una sola voce di risveglio in attesa.

Questo rende **la sola gestione duplicata dei risvegli** una spiegazione meno convincente rispetto alla duplicazione nell'ingestione eventi.

### 5. L'Heartbeat consuma l'evento e lo trasforma in input del prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - Il preflight esamina gli eventi di sistema in attesa e classifica le esecuzioni exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` drena la coda per la sessione.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Il blocco di eventi di sistema drenato viene anteposto al corpo del prompt dell'agente.

### 6. Punto di iniezione nel transcript

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` invia il prompt completo alla sessione PI incorporata.
  - Questo è il punto in cui il prompt derivato dal completamento diventa un turno utente persistito.

Quindi, una volta che lo stesso evento di sistema viene ricostruito due volte nel prompt, messaggi utente duplicati in LCM sono il comportamento atteso.

## Perché un semplice retry della consegna in uscita è meno probabile

Esiste un reale percorso di errore in uscita nel runner dell'Heartbeat:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - La risposta viene generata prima.
  - La consegna in uscita avviene dopo tramite `deliverOutboundPayloads(...)`.
  - Un errore lì restituisce `{ status: "failed" }`.

Tuttavia, per la stessa voce della coda di eventi di sistema, questo **da solo non è sufficiente** a spiegare i turni utente duplicati:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - La coda degli eventi di sistema è già stata drenata prima della consegna in uscita.

Quindi un retry dell'invio sul canale, da solo, non ricreerebbe esattamente lo stesso evento accodato. Può spiegare una consegna esterna mancante o fallita, ma non da solo un secondo messaggio utente identico nella sessione.

## Possibilità secondaria, con confidenza più bassa

Esiste un ciclo di retry dell'intera esecuzione nel runner dell'agente:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Alcuni errori transitori possono ritentare l'intera esecuzione e reinviare lo stesso `commandBody`.

Questo può duplicare un prompt utente persistito **all'interno della stessa esecuzione di risposta** se il prompt era già stato aggiunto prima che si verificasse la condizione di retry.

La considero meno probabile rispetto alla duplicazione dell'ingestione di `exec.finished` perché:

- il gap osservato era di circa 51 secondi, che sembra più un secondo risveglio/turno che un retry in-process;
- il report menziona già ripetuti errori di invio messaggi, il che punta di più a un turno separato successivo che a un retry immediato del modello/runtime.

## Ipotesi sulla causa radice

Ipotesi con il livello di confidenza più alto:

- Il completamento `keen-nexus` è passato attraverso il **percorso di evento exec del Node**.
- Lo stesso `exec.finished` è stato consegnato due volte a `server-node-events`.
- Il Gateway ha accettato entrambe le copie perché `enqueueSystemEvent(...)` non deduplica in base a `contextKey` / `runId`.
- Ogni evento accettato ha attivato un Heartbeat ed è stato iniettato come turno utente nel transcript PI.

## Piccola correzione chirurgica proposta

Se si desidera una correzione, la modifica minima ad alto valore è:

- far sì che l'idempotenza di exec/eventi di sistema rispetti `contextKey` per un breve intervallo, almeno per ripetizioni esatte di `(sessionKey, contextKey, text)`;
- oppure aggiungere una deduplica dedicata in `server-node-events` per `exec.finished`, con chiave `(sessionKey, runId, tipo di evento)`.

Questo bloccherebbe direttamente i duplicati di `exec.finished` dovuti a replay prima che diventino turni di sessione.
