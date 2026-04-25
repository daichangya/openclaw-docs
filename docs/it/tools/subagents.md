---
read_when:
    - Vuoi lavoro in background/parallelo tramite l'agente
    - Stai modificando `sessions_spawn` o la policy degli strumenti dei sottoagenti
    - Stai implementando o risolvendo problemi di sessioni di sottoagenti vincolate al thread
summary: 'Sottoagenti: avvio di esecuzioni isolate di agenti che annunciano i risultati nella chat del richiedente'
title: Sottoagenti
x-i18n:
    generated_at: "2026-04-25T13:59:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b262edf46b9c823dcf0ad6514e560d2d1a718e9081015ea8bb5c081206b88fce
    source_path: tools/subagents.md
    workflow: 15
---

I sottoagenti sono esecuzioni in background di agenti avviate da un'esecuzione esistente di un agente. Vengono eseguiti nella propria sessione (`agent:<agentId>:subagent:<uuid>`) e, quando terminano, **annunciano** il loro risultato di nuovo nel canale chat del richiedente. Ogni esecuzione di sottoagente viene tracciata come [attività in background](/it/automation/tasks).

## Comando slash

Usa `/subagents` per ispezionare o controllare le esecuzioni dei sottoagenti per la **sessione corrente**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controlli di binding del thread:

Questi comandi funzionano nei canali che supportano binding persistenti del thread. Vedi **Canali che supportano thread** qui sotto.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra i metadati dell'esecuzione (stato, timestamp, id sessione, percorso della trascrizione, cleanup).
Usa `sessions_history` per una vista di richiamo limitata e filtrata per la sicurezza; ispeziona il
percorso della trascrizione su disco quando hai bisogno della trascrizione completa grezza.

### Comportamento di spawn

`/subagents spawn` avvia un sottoagente in background come comando utente, non come relay interno, e invia un aggiornamento finale di completamento nella chat del richiedente quando l'esecuzione termina.

- Il comando di spawn è non bloccante; restituisce immediatamente un id esecuzione.
- Al completamento, il sottoagente annuncia un messaggio di riepilogo/risultato nel canale chat del richiedente.
- La consegna del completamento è push-based. Una volta avviato, non interrogare in loop `/subagents list`,
  `sessions_list` o `sessions_history` solo per aspettarne il
  completamento; ispeziona lo stato solo su richiesta per debug o intervento.
- Al completamento, OpenClaw prova a chiudere browser tab/processi tracciati aperti da quella sessione di sottoagente prima che il flusso di cleanup dell'annuncio prosegua.
- Per gli spawn manuali, la consegna è resiliente:
  - OpenClaw prova prima la consegna diretta `agent` con una chiave di idempotenza stabile.
  - Se la consegna diretta fallisce, esegue il fallback al routing della coda.
  - Se il routing della coda non è ancora disponibile, l'annuncio viene ritentato con un breve backoff esponenziale prima dell'abbandono finale.
- La consegna del completamento mantiene il percorso del richiedente risolto:
  - i percorsi di completamento vincolati al thread o alla conversazione hanno la precedenza quando disponibili
  - se l'origine del completamento fornisce solo un canale, OpenClaw completa target/account mancanti dal percorso risolto della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta continua a funzionare
- Il passaggio del completamento alla sessione del richiedente è un contesto interno generato a runtime (non testo scritto dall'utente) e include:
  - `Result` (ultimo testo visibile di risposta `assistant`, altrimenti ultimo testo `tool`/`toolResult` sanificato; le esecuzioni terminali fallite non riutilizzano il testo di risposta catturato)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - statistiche compatte di runtime/token
  - un'istruzione di consegna che dice all'agente richiedente di riscrivere in normale voce assistant (non inoltrare metadati interni grezzi)
- `--model` e `--thinking` sovrascrivono i predefiniti per quella specifica esecuzione.
- Usa `info`/`log` per ispezionare dettagli e output dopo il completamento.
- `/subagents spawn` è in modalità one-shot (`mode: "run"`). Per sessioni persistenti vincolate al thread, usa `sessions_spawn` con `thread: true` e `mode: "session"`.
- Per sessioni ACP harness (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` e vedi [ACP Agents](/it/tools/acp-agents), in particolare il [modello di consegna ACP](/it/tools/acp-agents#delivery-model) quando fai debug di completamenti o loop agente-agente.

Obiettivi principali:

- Parallelizzare lavoro "ricerca / attività lunga / strumento lento" senza bloccare l'esecuzione principale.
- Mantenere i sottoagenti isolati per impostazione predefinita (separazione della sessione + sandboxing opzionale).
- Mantenere la superficie degli strumenti difficile da usare in modo improprio: i sottoagenti **non** ottengono gli strumenti di sessione per impostazione predefinita.
- Supportare una profondità di nesting configurabile per pattern di orchestrazione.

Nota sui costi: ogni sottoagente ha per impostazione predefinita il **proprio** contesto e il proprio utilizzo di token. Per attività pesanti o
ripetitive, imposta un modello più economico per i sottoagenti e mantieni l'agente principale su un
modello di qualità superiore. Puoi configurarlo tramite `agents.defaults.subagents.model` o con
override per agente. Quando un figlio ha davvero bisogno della trascrizione corrente del richiedente, l'agente può richiedere
`context: "fork"` in quel singolo spawn.

## Modalità di contesto

I sottoagenti nativi si avviano isolati a meno che il chiamante non chieda esplicitamente di fare fork della
trascrizione corrente.

| Modalità   | Quando usarla                                                                                                                           | Comportamento                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Ricerca nuova, implementazione indipendente, lavoro con strumenti lenti o qualsiasi attività che possa essere descritta brevemente nel testo del task | Crea una trascrizione figlia pulita. È il valore predefinito e mantiene più basso l'uso di token. |
| `fork`     | Lavoro che dipende dalla conversazione corrente, da risultati di strumenti precedenti o da istruzioni sfumate già presenti nella trascrizione del richiedente | Dirama la trascrizione del richiedente nella sessione figlia prima che il figlio inizi. |

Usa `fork` con parsimonia. Serve per delega sensibile al contesto, non come sostituto
della scrittura di un prompt del task chiaro.

## Strumento

Usa `sessions_spawn`:

- Avvia un'esecuzione di sottoagente (`deliver: false`, lane globale: `subagent`)
- Quindi esegue una fase di annuncio e pubblica la risposta di annuncio nel canale chat del richiedente
- Modello predefinito: eredita dal chiamante a meno che non imposti `agents.defaults.subagents.model` (o per agente `agents.list[].subagents.model`); un `sessions_spawn.model` esplicito continua comunque ad avere la precedenza.
- Thinking predefinito: eredita dal chiamante a meno che non imposti `agents.defaults.subagents.thinking` (o per agente `agents.list[].subagents.thinking`); un `sessions_spawn.thinking` esplicito continua comunque ad avere la precedenza.
- Timeout predefinito dell'esecuzione: se `sessions_spawn.runTimeoutSeconds` viene omesso, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando impostato; altrimenti ricade su `0` (nessun timeout).

Parametri dello strumento:

- `task` (obbligatorio)
- `label?` (facoltativo)
- `agentId?` (facoltativo; avvia sotto un altro id agente se consentito)
- `model?` (facoltativo; sovrascrive il modello del sottoagente; i valori non validi vengono ignorati e il sottoagente viene eseguito sul modello predefinito con un avviso nel risultato dello strumento)
- `thinking?` (facoltativo; sovrascrive il livello di thinking per l'esecuzione del sottoagente)
- `runTimeoutSeconds?` (predefinito a `agents.defaults.subagents.runTimeoutSeconds` quando impostato, altrimenti `0`; quando impostato, l'esecuzione del sottoagente viene interrotta dopo N secondi)
- `thread?` (predefinito `false`; quando `true`, richiede il binding del thread del canale per questa sessione di sottoagente)
- `mode?` (`run|session`)
  - il valore predefinito è `run`
  - se `thread: true` e `mode` è omesso, il predefinito diventa `session`
  - `mode: "session"` richiede `thread: true`
- `cleanup?` (`delete|keep`, predefinito `keep`)
- `sandbox?` (`inherit|require`, predefinito `inherit`; `require` rifiuta lo spawn a meno che il runtime figlio di destinazione non sia in sandbox)
- `context?` (`isolated|fork`, predefinito `isolated`; solo sottoagenti nativi)
  - `isolated` crea una trascrizione figlia pulita ed è il valore predefinito.
  - `fork` dirama la trascrizione corrente del richiedente nella sessione figlia così il figlio parte con lo stesso contesto di conversazione.
  - Usa `fork` solo quando il figlio ha bisogno della trascrizione corrente. Per lavoro circoscritto, ometti `context`.
- `sessions_spawn` **non** accetta parametri di consegna del canale (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Per la consegna, usa `message`/`sessions_send` dall'esecuzione generata.

## Sessioni vincolate al thread

Quando i binding del thread sono abilitati per un canale, un sottoagente può restare vincolato a un thread così i messaggi utente successivi in quel thread continuano a essere instradati alla stessa sessione di sottoagente.

### Canali che supportano thread

- Discord (attualmente l'unico canale supportato): supporta sessioni persistenti di sottoagenti vincolate al thread (`sessions_spawn` con `thread: true`), controlli manuali del thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chiavi adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Flusso rapido:

1. Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"`).
2. OpenClaw crea o collega un thread a quel target di sessione nel canale attivo.
3. Le risposte e i messaggi successivi in quel thread vengono instradati alla sessione collegata.
4. Usa `/session idle` per ispezionare/aggiornare l'auto-unfocus per inattività e `/session max-age` per controllare il limite rigido.
5. Usa `/unfocus` per scollegare manualmente.

Controlli manuali:

- `/focus <target>` collega il thread corrente (o ne crea uno) a un target di sottoagente/sessione.
- `/unfocus` rimuove il binding per il thread attualmente collegato.
- `/agents` elenca le esecuzioni attive e lo stato del binding (`thread:<id>` o `unbound`).
- `/session idle` e `/session max-age` funzionano solo per thread collegati in focus.

Interruttori di configurazione:

- Predefinito globale: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- L'override del canale e le chiavi di auto-bind allo spawn sono specifiche dell'adapter. Vedi **Canali che supportano thread** qui sopra.

Vedi [Riferimento della configurazione](/it/gateway/configuration-reference) e [Comandi slash](/it/tools/slash-commands) per i dettagli attuali degli adapter.

Allowlist:

- `agents.list[].subagents.allowAgents`: elenco di id agente che possono essere usati come target tramite `agentId` (`["*"]` per consentire qualunque agente). Predefinito: solo l'agente richiedente.
- `agents.defaults.subagents.allowAgents`: allowlist predefinita degli agenti target usata quando l'agente richiedente non imposta il proprio `subagents.allowAgents`.
- Guardia di ereditarietà della sandbox: se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta i target che verrebbero eseguiti fuori sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo). Predefinito: false.

Scoperta:

- Usa `agents_list` per vedere quali id agente sono attualmente consentiti per `sessions_spawn`.

Archiviazione automatica:

- Le sessioni dei sottoagenti vengono archiviate automaticamente dopo `agents.defaults.subagents.archiveAfterMinutes` (predefinito: 60).
- L'archivio usa `sessions.delete` e rinomina la trascrizione in `*.deleted.<timestamp>` (stessa cartella).
- `cleanup: "delete"` archivia immediatamente dopo l'annuncio (mantiene comunque la trascrizione tramite rinomina).
- L'archiviazione automatica è best-effort; i timer in sospeso vengono persi se il gateway viene riavviato.
- `runTimeoutSeconds` **non** archivia automaticamente; interrompe solo l'esecuzione. La sessione resta fino all'archiviazione automatica.
- L'archiviazione automatica si applica allo stesso modo alle sessioni di profondità 1 e 2.
- Il cleanup del browser è separato dal cleanup dell'archivio: browser tab/processi tracciati vengono chiusi in best-effort quando l'esecuzione termina, anche se il record di trascrizione/sessione viene conservato.

## Sottoagenti annidati

Per impostazione predefinita, i sottoagenti non possono avviare altri sottoagenti (`maxSpawnDepth: 1`). Puoi abilitare un livello di nesting impostando `maxSpawnDepth: 2`, che consente il **pattern di orchestrazione**: main → sottoagente orchestratore → sotto-sottoagenti worker.

### Come abilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // consente ai sottoagenti di avviare figli (predefinito: 1)
        maxChildrenPerAgent: 5, // massimo numero di figli attivi per sessione agente (predefinito: 5)
        maxConcurrent: 8, // limite globale di concorrenza della lane (predefinito: 8)
        runTimeoutSeconds: 900, // timeout predefinito per sessions_spawn quando omesso (0 = nessun timeout)
      },
    },
  },
}
```

### Livelli di profondità

| Profondità | Forma della chiave di sessione               | Ruolo                                         | Può avviare altri?             |
| ---------- | -------------------------------------------- | --------------------------------------------- | ------------------------------ |
| 0          | `agent:<id>:main`                            | Agente principale                             | Sempre                         |
| 1          | `agent:<id>:subagent:<uuid>`                 | Sottoagente (orchestratore quando è consentita profondità 2) | Solo se `maxSpawnDepth >= 2` |
| 2          | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sotto-sottoagente (worker foglia)             | Mai                            |

### Catena di annuncio

I risultati risalgono la catena:

1. Il worker di profondità 2 termina → annuncia al proprio genitore (orchestratore di profondità 1)
2. L'orchestratore di profondità 1 riceve l'annuncio, sintetizza i risultati, termina → annuncia al principale
3. L'agente principale riceve l'annuncio e lo consegna all'utente

Ogni livello vede solo gli annunci dei propri figli diretti.

Linee guida operative:

- Avvia il lavoro figlio una sola volta e attendi gli eventi di completamento invece di costruire loop di polling
  attorno a `sessions_list`, `sessions_history`, `/subagents list` o
  comandi `exec` con sleep.
- `sessions_list` e `/subagents list` mantengono le relazioni tra sessioni figlie focalizzate
  sul lavoro live: i figli live restano collegati, quelli terminati rimangono visibili per una
  breve finestra recente, e i link figlio solo nel datastore ma obsoleti vengono ignorati dopo la loro
  finestra di freschezza. Questo impedisce ai vecchi metadati `spawnedBy` / `parentSessionKey`
  di far riapparire figli fantasma dopo un riavvio.
- Se un evento di completamento figlio arriva dopo che hai già inviato la risposta finale,
  il follow-up corretto è l'esatto token silenzioso `NO_REPLY` / `no_reply`.

### Policy degli strumenti per profondità

- Il ruolo e l'ambito di controllo vengono scritti nei metadati della sessione al momento dello spawn. Questo impedisce che chiavi di sessione piatte o ripristinate riacquisiscano accidentalmente privilegi di orchestrazione.
- **Profondità 1 (orchestratore, quando `maxSpawnDepth >= 2`)**: ottiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` così può gestire i propri figli. Gli altri strumenti di sessione/sistema restano negati.
- **Profondità 1 (foglia, quando `maxSpawnDepth == 1`)**: nessuno strumento di sessione (comportamento predefinito attuale).
- **Profondità 2 (worker foglia)**: nessuno strumento di sessione — `sessions_spawn` è sempre negato alla profondità 2. Non può avviare altri figli.

### Limite di spawn per agente

Ogni sessione agente (a qualsiasi profondità) può avere al massimo `maxChildrenPerAgent` (predefinito: 5) figli attivi alla volta. Questo evita una proliferazione incontrollata da un singolo orchestratore.

### Arresto a cascata

L'arresto di un orchestratore di profondità 1 arresta automaticamente tutti i suoi figli di profondità 2:

- `/stop` nella chat principale arresta tutti gli agenti di profondità 1 e propaga l'arresto ai loro figli di profondità 2.
- `/subagents kill <id>` arresta un sottoagente specifico e propaga l'arresto ai suoi figli.
- `/subagents kill all` arresta tutti i sottoagenti del richiedente e propaga l'arresto.

## Autenticazione

L'autenticazione del sottoagente viene risolta per **id agente**, non per tipo di sessione:

- La chiave di sessione del sottoagente è `agent:<agentId>:subagent:<uuid>`.
- L'archivio auth viene caricato da `agentDir` di quell'agente.
- I profili auth dell'agente principale vengono uniti come **fallback**; in caso di conflitto, i profili dell'agente prevalgono su quelli del principale.

Nota: l'unione è additiva, quindi i profili del principale sono sempre disponibili come fallback. L'autenticazione completamente isolata per agente non è ancora supportata.

## Annuncio

I sottoagenti riportano i risultati tramite una fase di annuncio:

- La fase di annuncio viene eseguita all'interno della sessione del sottoagente (non della sessione del richiedente).
- Se il sottoagente risponde esattamente `ANNOUNCE_SKIP`, non viene pubblicato nulla.
- Se l'ultimo testo assistant è l'esatto token silenzioso `NO_REPLY` / `no_reply`,
  l'output dell'annuncio viene soppresso anche se prima era visibile del progresso.
- Altrimenti la consegna dipende dalla profondità del richiedente:
  - le sessioni richiedenti di primo livello usano una chiamata `agent` di follow-up con consegna esterna (`deliver=true`)
  - le sessioni richiedenti di sottoagente annidate ricevono un'iniezione interna di follow-up (`deliver=false`) così l'orchestratore può sintetizzare i risultati dei figli nella sessione
  - se una sessione richiedente di sottoagente annidata non esiste più, OpenClaw esegue il fallback al richiedente di quella sessione quando disponibile
- Per le sessioni richiedenti di primo livello, la consegna diretta in modalità completamento risolve prima qualsiasi percorso di conversazione/thread vincolato e override dell'hook, poi completa i campi target del canale mancanti dal percorso memorizzato della sessione richiedente. In questo modo i completamenti restano nella chat/topic corretti anche quando l'origine del completamento identifica solo il canale.
- L'aggregazione dei completamenti figli è limitata all'esecuzione richiedente corrente quando costruisce i finding di completamento annidato, evitando che vecchi output di figli di esecuzioni precedenti trapelino nell'annuncio corrente.
- Le risposte di annuncio preservano il routing di thread/topic quando disponibile negli adapter del canale.
- Il contesto dell'annuncio viene normalizzato in un blocco evento interno stabile:
  - sorgente (`subagent` o `cron`)
  - chiave/id della sessione figlia
  - tipo di annuncio + etichetta del task
  - riga di stato derivata dal risultato runtime (`success`, `error`, `timeout` o `unknown`)
  - contenuto del risultato selezionato dall'ultimo testo assistant visibile, altrimenti ultimo testo `tool`/`toolResult` sanificato; le esecuzioni terminali fallite riportano stato di fallimento senza riprodurre il testo di risposta catturato
  - un'istruzione di follow-up che descrive quando rispondere e quando restare in silenzio
- `Status` non viene dedotto dall'output del modello; proviene dai segnali di risultato runtime.
- In caso di timeout, se il figlio è arrivato solo alle chiamate di strumenti, l'annuncio può comprimere quella cronologia in un breve riepilogo di avanzamento parziale invece di riprodurre l'output grezzo degli strumenti.

I payload di annuncio includono una riga di statistiche alla fine (anche quando sono incapsulati):

- Runtime (ad esempio, `runtime 5m12s`)
- Utilizzo dei token (input/output/totale)
- Costo stimato quando è configurato il pricing del modello (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e percorso della trascrizione (così l'agente principale può recuperare la cronologia tramite `sessions_history` o ispezionare il file su disco)
- I metadati interni sono destinati solo all'orchestrazione; le risposte rivolte all'utente devono essere riscritte con la normale voce assistant.

`sessions_history` è il percorso di orchestrazione più sicuro:

- il richiamo assistant viene normalizzato prima:
  - i thinking tag vengono rimossi
  - i blocchi di struttura `<relevant-memories>` / `<relevant_memories>` vengono rimossi
  - i blocchi payload XML di chiamata strumento in testo semplice come `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` vengono rimossi, inclusi i payload
    troncati che non si chiudono correttamente
  - vengono rimosse le strutture degradate di chiamata/risultato strumento e i marcatori del contesto storico
  - vengono rimossi i token di controllo del modello trapelati come `<|assistant|>`, altri token ASCII
    `<|...|>` e le varianti full-width `<｜...｜>`
  - viene rimosso l'XML malformato di chiamata strumento MiniMax
- il testo simile a credenziali/token viene redatto
- i blocchi lunghi possono essere troncati
- le cronologie molto grandi possono eliminare le righe più vecchie o sostituire una riga sovradimensionata con
  `[sessions_history omitted: message too large]`
- l'ispezione grezza della trascrizione su disco è il fallback quando hai bisogno della trascrizione completa byte per byte

## Policy degli strumenti (strumenti dei sottoagenti)

Per impostazione predefinita, i sottoagenti ottengono **tutti gli strumenti tranne gli strumenti di sessione** e di sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Anche qui `sessions_history` resta una vista di richiamo limitata e sanificata; non è
un dump grezzo della trascrizione.

Quando `maxSpawnDepth >= 2`, i sottoagenti orchestratori di profondità 1 ricevono inoltre `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` così possono gestire i propri figli.

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
        // deny vince
        deny: ["gateway", "cron"],
        // se allow è impostato, diventa solo allow (deny continua a vincere)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concorrenza

I sottoagenti usano una lane di coda in-process dedicata:

- Nome lane: `subagent`
- Concorrenza: `agents.defaults.subagents.maxConcurrent` (predefinito `8`)

## Attività e ripristino

OpenClaw non considera l'assenza di `endedAt` una prova permanente che un sottoagente
sia ancora attivo. Le esecuzioni non terminate più vecchie della finestra delle esecuzioni obsolete smettono di essere conteggiate come
attive/in sospeso in `/subagents list`, nei riepiloghi di stato, nel gating dei completamenti dei discendenti
e nei controlli di concorrenza per sessione.

Dopo un riavvio del gateway, le esecuzioni obsolete non terminate ripristinate vengono eliminate a meno che la loro
sessione figlia non sia marcata `abortedLastRun: true`. Quelle sessioni figlie interrotte dal riavvio
restano recuperabili tramite il flusso di ripristino degli orfani dei sottoagenti, che
invia un messaggio sintetico di ripresa prima di cancellare il marker di interruzione.

## Arresto

- Inviare `/stop` nella chat del richiedente interrompe la sessione del richiedente e arresta tutte le esecuzioni attive dei sottoagenti avviate da essa, propagando l'arresto ai figli annidati.
- `/subagents kill <id>` arresta un sottoagente specifico e propaga l'arresto ai suoi figli.

## Limitazioni

- L'annuncio del sottoagente è **best-effort**. Se il gateway viene riavviato, il lavoro pendente di "annuncio di ritorno" viene perso.
- I sottoagenti condividono comunque le stesse risorse del processo gateway; considera `maxConcurrent` come una valvola di sicurezza.
- `sessions_spawn` è sempre non bloccante: restituisce immediatamente `{ status: "accepted", runId, childSessionKey }`.
- Il contesto del sottoagente inietta solo `AGENTS.md` + `TOOLS.md` (non `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` o `BOOTSTRAP.md`).
- La profondità massima di nesting è 5 (intervallo `maxSpawnDepth`: 1–5). La profondità 2 è consigliata per la maggior parte dei casi d'uso.
- `maxChildrenPerAgent` limita i figli attivi per sessione (predefinito: 5, intervallo: 1–20).

## Correlati

- [ACP agents](/it/tools/acp-agents)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [Invio agente](/it/tools/agent-send)
