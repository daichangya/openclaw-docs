---
read_when:
    - Vuoi lavoro in background/parallelo tramite l'agente
    - Stai modificando `sessions_spawn` o la policy dello strumento sub-agent
    - Stai implementando o risolvendo problemi di sessioni sub-agent vincolate al thread
summary: 'Sub-agent: avvio di esecuzioni isolate dell''agente che annunciano i risultati nella chat del richiedente'
title: Sub-agent
x-i18n:
    generated_at: "2026-04-22T04:28:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-agent

I sub-agent sono esecuzioni dell'agente in background avviate da un'esecuzione esistente dell'agente. Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e, quando terminano, **annunciano** il proprio risultato nel canale chat del richiedente. Ogni esecuzione di sub-agent viene tracciata come [task in background](/it/automation/tasks).

## Comando slash

Usa `/subagents` per ispezionare o controllare le esecuzioni dei sub-agent per la **sessione corrente**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controlli di binding del thread:

Questi comandi funzionano sui canali che supportano binding persistenti del thread. Vedi **Canali che supportano i thread** sotto.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, id sessione, percorso del transcript, cleanup).
Usa `sessions_history` per una vista di richiamo limitata e filtrata per sicurezza; ispeziona il
percorso del transcript su disco quando ti serve il transcript completo raw.

### Comportamento di spawn

`/subagents spawn` avvia un sub-agent in background come comando utente, non come relay interno, e invia un aggiornamento finale di completamento nella chat del richiedente quando l'esecuzione termina.

- Il comando spawn non è bloccante; restituisce immediatamente un id esecuzione.
- Al completamento, il sub-agent annuncia un messaggio di riepilogo/risultato nel canale chat del richiedente.
- La consegna del completamento è push-based. Una volta avviato, non fare polling di `/subagents list`,
  `sessions_list` o `sessions_history` in un loop solo per aspettarne la
  fine; ispeziona lo stato solo on-demand per debug o intervento.
- Al completamento, OpenClaw chiude in best-effort le schede/processi browser tracciati aperti da quella sessione sub-agent prima che il flusso di cleanup dell'annuncio prosegua.
- Per gli spawn manuali, la consegna è resiliente:
  - OpenClaw prova prima la consegna diretta `agent` con una chiave di idempotenza stabile.
  - Se la consegna diretta fallisce, usa come fallback il routing in coda.
  - Se il routing in coda continua a non essere disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima dell'abbandono finale.
- La consegna del completamento mantiene la route risolta del richiedente:
  - le route di completamento vincolate al thread o alla conversazione hanno priorità quando disponibili
  - se l'origine del completamento fornisce solo un canale, OpenClaw completa il target/account mancante dalla route risolta della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta continua a funzionare
- Il handoff del completamento alla sessione del richiedente è un contesto interno generato a runtime (non testo scritto dall'utente) e include:
  - `Result` (testo più recente della risposta visibile `assistant`, altrimenti testo più recente sanificato di tool/toolResult; le esecuzioni terminali fallite non riusano il testo della risposta catturata)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistiche compatte runtime/token
  - un'istruzione di consegna che dice all'agente richiedente di riscrivere con la normale voce dell'assistente (non inoltrare metadati interni raw)
- `--model` e `--thinking` sovrascrivono i valori predefiniti per quella specifica esecuzione.
- Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
- `/subagents spawn` è modalità one-shot (`mode: "run"`). Per sessioni persistenti vincolate al thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
- Per sessioni harness ACP (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` e vedi [ACP Agents](/it/tools/acp-agents), in particolare il [modello di consegna ACP](/it/tools/acp-agents#delivery-model) quando fai debug di completamenti o loop agente-agente.

Obiettivi principali:

- Parallelizzare lavoro di tipo "ricerca / task lungo / tool lento" senza bloccare l'esecuzione principale.
- Mantenere i sub-agent isolati per impostazione predefinita (separazione della sessione + sandboxing facoltativo).
- Mantenere la superficie degli strumenti difficile da usare in modo improprio: i sub-agent **non** ricevono gli strumenti di sessione per impostazione predefinita.
- Supportare profondità di nesting configurabile per pattern orchestrator.

Nota sui costi: ogni sub-agent ha il **proprio** contesto e il proprio consumo di token. Per task pesanti o ripetitivi, imposta un modello più economico per i sub-agent e mantieni il tuo agente principale su un modello di qualità più alta.
Puoi configurarlo tramite `agents.defaults.subagents.model` o override per agente.

## Strumento

Usa `sessions_spawn`:

- Avvia un'esecuzione di sub-agent (`deliver: false`, lane globale: `subagent`)
- Poi esegue un passaggio di annuncio e pubblica la risposta di annuncio nel canale chat del richiedente
- Modello predefinito: eredita il chiamante a meno che tu non imposti `agents.defaults.subagents.model` (o `agents.list[].subagents.model` per agente); un `sessions_spawn.model` esplicito continua ad avere priorità.
- Thinking predefinito: eredita il chiamante a meno che tu non imposti `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` per agente); un `sessions_spawn.thinking` esplicito continua ad avere priorità.
- Timeout predefinito dell'esecuzione: se `sessions_spawn.runTimeoutSeconds` è omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti usa come fallback `0` (nessun timeout).

Parametri dello strumento:

- `task` (obbligatorio)
- `label?` (facoltativo)
- `agentId?` (facoltativo; avvia sotto un altro agent id se consentito)
- `model?` (facoltativo; sovrascrive il modello del sub-agent; i valori non validi vengono saltati e il sub-agent viene eseguito sul modello predefinito con un warning nel risultato dello strumento)
- `thinking?` (facoltativo; sovrascrive il livello di thinking per l'esecuzione del sub-agent)
- `runTimeoutSeconds?` (predefinito su `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`; quando impostato, l'esecuzione del sub-agent viene interrotta dopo N secondi)
- `thread?` (predefinito `false`; quando `true`, richiede il binding del thread di canale per questa sessione sub-agent)
- `mode?` (`run|session`)
  - il valore predefinito è `run`
  - se `thread: true` e `mode` è omesso, il valore predefinito diventa `session`
  - `mode: "session"` richiede `thread: true`
- `cleanup?` (`delete|keep`, predefinito `keep`)
- `sandbox?` (`inherit|require`, predefinito `inherit`; `require` rifiuta lo spawn a meno che il runtime figlio target non sia sandboxato)
- `sessions_spawn` **non** accetta parametri di consegna del canale (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa `message`/`sessions_send` dall'esecuzione avviata.

## Sessioni vincolate al thread

Quando i binding del thread sono abilitati per un canale, un sub-agent può restare vincolato a un thread così i messaggi successivi dell'utente in quel thread continuano a essere instradati alla stessa sessione sub-agent.

### Canali che supportano i thread

- Discord (attualmente l'unico canale supportato): supporta sessioni persistenti di sub-agent vincolate al thread (`sessions_spawn` con `thread: true`), controlli manuali del thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chiavi adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Flusso rapido:

1. Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"`).
2. OpenClaw crea o associa un thread a quel target di sessione nel canale attivo.
3. Risposte e messaggi successivi in quel thread vengono instradati alla sessione associata.
4. Usa `/session idle` per ispezionare/aggiornare il disaccoppiamento automatico per inattività e `/session max-age` per controllare il limite rigido.
5. Usa `/unfocus` per staccare manualmente.

Controlli manuali:

- `/focus <target>` associa il thread corrente (o ne crea uno) a un target sub-agent/sessione.
- `/unfocus` rimuove il binding per il thread attualmente associato.
- `/agents` elenca le esecuzioni attive e lo stato del binding (`thread:<id>` o `unbound`).
- `/session idle` e `/session max-age` funzionano solo per thread associati e focalizzati.

Interruttori di configurazione:

- Predefinito globale: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Override per canale e chiavi di auto-bind dello spawn sono specifici dell'adapter. Vedi **Canali che supportano i thread** sopra.

Vedi [Configuration Reference](/it/gateway/configuration-reference) e [Comandi slash](/it/tools/slash-commands) per i dettagli correnti dell'adapter.

Allowlist:

- `agents.list[].subagents.allowAgents`: elenco di agent id che possono essere target tramite `agentId` (`["*"]` per consentire qualunque). Predefinito: solo l'agente richiedente.
- `agents.defaults.subagents.allowAgents`: allowlist predefinita di agent target usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
- Guard di ereditarietà della sandbox: se la sessione del richiedente è sandboxata, `sessions_spawn` rifiuta target che verrebbero eseguiti senza sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza selezione esplicita del profilo). Predefinito: false.

Rilevamento:

- Usa `agents_list` per vedere quali agent id sono attualmente consentiti per `sessions_spawn`.

Auto-archiviazione:

- Le sessioni sub-agent vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito: 60).
- L'archiviazione usa `sessions.delete` e rinomina il transcript in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque il transcript tramite rinomina).
- L'auto-archiviazione è best-effort; i timer in sospeso vanno persi se il gateway viene riavviato.
- `runTimeoutSeconds` **non** esegue auto-archiviazione; interrompe solo l'esecuzione. La sessione resta fino all'auto-archiviazione.
- L'auto-archiviazione si applica allo stesso modo alle sessioni depth-1 e depth-2.
- Il cleanup del browser è separato dal cleanup dell'archivio: schede/processi browser tracciati vengono chiusi in best-effort quando l'esecuzione termina, anche se il transcript/record di sessione viene mantenuto.

## Sub-agent annidati

Per impostazione predefinita, i sub-agent non possono avviare propri sub-agent (`maxSpawnDepth: 1`). Puoi abilitare un livello di nesting impostando `maxSpawnDepth: 2`, che consente il **pattern orchestrator**: principale → sub-agent orchestrator → sub-sub-agent worker.

### Come abilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // consente ai sub-agent di avviare figli (predefinito: 1)
        maxChildrenPerAgent: 5, // massimo di figli attivi per sessione agente (predefinito: 5)
        maxConcurrent: 8, // limite globale di concorrenza della lane (predefinito: 8)
        runTimeoutSeconds: 900, // timeout predefinito per sessions_spawn quando omesso (0 = nessun timeout)
      },
    },
  },
}
```

### Livelli di profondità

| Depth | Forma della chiave di sessione               | Ruolo                                         | Può avviare?                  |
| ----- | -------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0     | `agent:<id>:main`                            | Agente principale                             | Sempre                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator quando depth 2 è consentito) | Solo se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (worker leaf)                   | Mai                           |

### Catena di annuncio

I risultati risalgono la catena:

1. Il worker depth-2 termina → annuncia al proprio parent (orchestrator depth-1)
2. L'orchestrator depth-1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale
3. L'agente principale riceve l'annuncio e consegna all'utente

Ogni livello vede solo gli annunci dei propri figli diretti.

Guida operativa:

- Avvia il lavoro figlio una sola volta e attendi gli eventi di completamento invece di costruire loop di polling attorno a `sessions_list`, `sessions_history`, `/subagents list` o
  comandi `exec` sleep.
- Se un evento di completamento figlio arriva dopo che hai già inviato la risposta finale,
  il follow-up corretto è il token silenzioso esatto `NO_REPLY` / `no_reply`.

### Policy degli strumenti per profondità

- Il ruolo e lo scope di controllo vengono scritti nei metadati della sessione al momento dello spawn. Questo impedisce che chiavi di sessione piatte o ripristinate riacquistino accidentalmente privilegi da orchestrator.
- **Depth 1 (orchestrator, quando `maxSpawnDepth >= 2`)**: riceve `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può gestire i propri figli. Gli altri strumenti di sessione/sistema restano negati.
- **Depth 1 (leaf, quando `maxSpawnDepth == 1`)**: nessuno strumento di sessione (comportamento predefinito attuale).
- **Depth 2 (worker leaf)**: nessuno strumento di sessione — `sessions_spawn` è sempre negato a depth 2. Non può avviare ulteriori figli.

### Limite di spawn per agente

Ogni sessione agente (a qualunque depth) può avere al massimo `maxChildrenPerAgent` (predefinito: 5) figli attivi contemporaneamente. Questo impedisce fan-out incontrollato da un singolo orchestrator.

### Arresto a cascata

L'arresto di un orchestrator depth-1 arresta automaticamente tutti i suoi figli depth-2:

- `/stop` nella chat principale arresta tutti gli agenti depth-1 e propaga l'arresto ai loro figli depth-2.
- `/subagents kill <id>` arresta uno specifico sub-agent e propaga l'arresto ai suoi figli.
- `/subagents kill all` arresta tutti i sub-agent per il richiedente e propaga l'arresto.

## Autenticazione

L'auth dei sub-agent viene risolta per **agent id**, non per tipo di sessione:

- La chiave di sessione del sub-agent è `agent:<agentId>:subagent:<uuid>`.
- L'auth store viene caricato da `agentDir` di quell'agente.
- I profili auth dell'agente principale vengono uniti come **fallback**; i profili dell'agente sovrascrivono i profili principali in caso di conflitto.

Nota: il merge è additivo, quindi i profili principali sono sempre disponibili come fallback. L'isolamento completo dell'auth per agente non è ancora supportato.

## Annuncio

I sub-agent riportano tramite un passaggio di annuncio:

- Il passaggio di annuncio viene eseguito dentro la sessione sub-agent (non nella sessione del richiedente).
- Se il sub-agent risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se il testo più recente dell'assistente è il token silenzioso esatto `NO_REPLY` / `no_reply`,
  l'output dell'annuncio viene soppresso anche se esisteva un precedente avanzamento visibile.
- Altrimenti la consegna dipende dalla depth del richiedente:
  - le sessioni richiedenti di primo livello usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`)
  - le sessioni subagent richiedenti annidate ricevono un'iniezione interna di follow-up (`deliver=false`) così l'orchestrator può sintetizzare i risultati dei figli nella sessione
  - se una sessione subagent richiedente annidata non esiste più, OpenClaw usa come fallback il richiedente di quella sessione quando disponibile
- Per le sessioni richiedenti di primo livello, la consegna diretta in modalità completamento risolve prima eventuali route vincolate a conversazione/thread e override degli hook, poi completa i campi mancanti channel-target dalla route memorizzata della sessione del richiedente. Questo mantiene i completamenti sulla chat/topic corretta anche quando l'origine del completamento identifica solo il canale.
- L'aggregazione dei completamenti figli è limitata all'esecuzione richiedente corrente quando costruisce i risultati di completamento annidati, impedendo che output di figli di esecuzioni precedenti e ormai obsoleti trapelino nell'annuncio corrente.
- Le risposte di annuncio preservano l'instradamento thread/topic quando disponibile sugli adapter di canale.
- Il contesto di annuncio viene normalizzato in un blocco di evento interno stabile:
  - sorgente (`subagent` o `cron`)
  - chiave/id della sessione figlia
  - tipo di annuncio + etichetta del task
  - riga di stato derivata dai segnali dell'esito runtime (`success`, `error`, `timeout` o `unknown`)
  - contenuto del risultato selezionato dal testo visibile più recente dell'assistente, altrimenti dal testo sanificato più recente di tool/toolResult; le esecuzioni terminali fallite riportano lo stato di errore senza riprodurre il testo della risposta catturata
  - un'istruzione di follow-up che descrive quando rispondere e quando restare in silenzio
- `Status` non viene dedotto dall'output del modello; proviene dai segnali dell'esito runtime.
- In caso di timeout, se il figlio è arrivato solo fino alle chiamate tool, l'annuncio può comprimere quella cronologia in un breve riepilogo di avanzamento parziale invece di riprodurre output raw dei tool.

I payload di annuncio includono una riga di statistiche alla fine (anche quando sono racchiusi):

- Runtime (ad es. `runtime 5m12s`)
- Uso dei token (input/output/totale)
- Costo stimato quando il pricing del modello è configurato (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e percorso del transcript (così l'agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco)
- I metadati interni sono destinati solo all'orchestrazione; le risposte rivolte all'utente dovrebbero essere riscritte con la normale voce dell'assistente.

`sessions_history` è il percorso di orchestrazione più sicuro:

- il richiamo dell'assistente viene prima normalizzato:
  - i tag di thinking vengono rimossi
  - i blocchi scaffolding `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi di payload XML plain-text di tool-call come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload
    troncati che non si chiudono correttamente
  - scaffolding tool-call/result degradati e marker di contesto storico vengono rimossi
  - token di controllo del modello trapelati come `<|assistant|>`, altri token ASCII
    `<|...|>` e varianti full-width `<｜...｜>` vengono rimossi
  - XML di tool-call MiniMax malformato viene rimosso
- il testo simile a credenziali/token viene redatto
- i blocchi lunghi possono essere troncati
- cronologie molto grandi possono eliminare righe più vecchie o sostituire una riga troppo grande con
  `[sessions_history omitted: message too large]`
- l'ispezione raw del transcript su disco resta il fallback quando ti serve il transcript completo byte per byte

## Policy degli strumenti (strumenti sub-agent)

Per impostazione predefinita, i sub-agent ricevono **tutti gli strumenti tranne gli strumenti di sessione** e gli strumenti di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` resta una vista di richiamo limitata e sanificata; non è
un dump raw del transcript.

Quando `maxSpawnDepth >= 2`, i sub-agent orchestrator depth-1 ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` così possono gestire i propri figli.

Override tramite configurazione:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny ha priorità
        deny: ["gateway", "cron"],
        // se allow è impostato, diventa allow-only (deny continua ad avere priorità)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concorrenza

I sub-agent usano una lane di coda dedicata in-process:

- Nome lane: `subagent`
- Concorrenza: `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Arresto

- L'invio di `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta ogni esecuzione di sub-agent attiva avviata da essa, propagando l'arresto ai figli annidati.
- `/subagents kill <id>` arresta uno specifico sub-agent e propaga l'arresto ai suoi figli.

## Limitazioni

- L'annuncio dei sub-agent è **best-effort**. Se il gateway viene riavviato, il lavoro pendente di "annuncio di ritorno" viene perso.
- I sub-agent condividono comunque le stesse risorse di processo del gateway; tratta `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sub-agent inietta solo `AGENTS.md` + `TOOLS.md` (niente `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di nesting è 5 (intervallo `maxSpawnDepth`: 1–5). Depth 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito: 5, intervallo: 1–20).
