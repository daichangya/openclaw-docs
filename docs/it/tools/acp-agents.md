---
read_when:
    - Esecuzione di harness di coding tramite ACP
    - Configurazione di sessioni ACP associate alla conversazione sui canali di messaggistica
    - Associazione di una conversazione su un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del wiring di backend e Plugin ACP
    - Debug di consegna del completamento ACP o loop agente-agente
    - Uso dei comandi `/acp` dalla chat
summary: Usa sessioni runtime ACP per Claude Code, Cursor, Gemini CLI, fallback ACP Codex esplicito, OpenClaw ACP e altri agenti harness
title: Agenti ACP
x-i18n:
    generated_at: "2026-04-25T13:57:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

Le sessioni [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permettono a OpenClaw di eseguire harness di coding esterni (ad esempio Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e altri harness ACPX supportati) tramite un Plugin backend ACP.

Se chiedi a OpenClaw in linguaggio naturale di associare o controllare Codex nella conversazione corrente, OpenClaw dovrebbe usare il Plugin app-server Codex nativo (`/codex bind`, `/codex threads`, `/codex resume`). Se chiedi `/acp`, ACP, acpx o una sessione figlia in background di Codex, OpenClaw può comunque instradare Codex tramite ACP. Ogni spawn di sessione ACP viene tracciato come [task in background](/it/automation/tasks).

Se chiedi a OpenClaw in linguaggio naturale di "avviare Claude Code in un thread" o di usare un altro harness esterno, OpenClaw dovrebbe instradare quella richiesta al runtime ACP (non al runtime sub-agent nativo).

Se vuoi che Codex o Claude Code si connettano come client MCP esterni direttamente alle conversazioni di canale OpenClaw esistenti, usa [`openclaw mcp serve`](/it/cli/mcp) invece di ACP.

## Quale pagina mi serve?

Ci sono tre superfici vicine facili da confondere:

| Vuoi...                                                                                         | Usa questo                            | Note                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Associare o controllare Codex nella conversazione corrente                                       | `/codex bind`, `/codex threads`       | Percorso app-server Codex nativo; include risposte chat associate, inoltro immagini, model/fast/permissions, controlli stop e steer. ACP è un fallback esplicito |
| Eseguire Claude Code, Gemini CLI, ACP Codex esplicito o un altro harness esterno _tramite_ OpenClaw | Questa pagina: Agenti ACP         | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, task in background, controlli runtime                                       |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o client                  | [`openclaw acp`](/it/cli/acp)            | Modalità bridge. L'IDE/client parla ACP con OpenClaw tramite stdio/WebSocket                                                                                   |
| Riutilizzare una AI CLI locale come modello fallback solo testo                                  | [Backend CLI](/it/gateway/cli-backends)  | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                                                             |

## Funziona out of the box?

Di solito sì. Le installazioni fresh distribuiscono il Plugin runtime `acpx` incluso abilitato per impostazione predefinita, con un binario `acpx` fissato a livello Plugin che OpenClaw verifica e auto-ripara all'avvio. Esegui `/acp doctor` per un controllo di prontezza.

Possibili problemi al primo avvio:

- Gli adapter dell'harness di destinazione (Codex, Claude, ecc.) possono essere recuperati on demand con `npx` la prima volta che li usi.
- L'autenticazione del vendor deve comunque esistere sull'host per quell'harness.
- Se l'host non ha npm o accesso di rete, i primi recuperi degli adapter falliscono finché le cache non vengono preriscaldate o l'adapter non viene installato in altro modo.

## Runbook operatore

Flusso rapido `/acp` dalla chat:

1. **Spawn** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto`, oppure esplicito `/acp spawn codex --bind here`
2. **Lavora** nella conversazione o thread associato (oppure punta esplicitamente alla chiave di sessione).
3. **Controlla lo stato** — `/acp status`
4. **Regola** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Guida** senza sostituire il contesto — `/acp steer tighten logging and continue`
6. **Ferma** — `/acp cancel` (turno corrente) oppure `/acp close` (sessione + binding)

Trigger in linguaggio naturale che dovrebbero essere instradati al Plugin Codex nativo:

- "Bind this Discord channel to Codex."
- "Attach this chat to Codex thread `<id>`."
- "Show Codex threads, then bind this one."

L'associazione della conversazione Codex nativa è il percorso predefinito di controllo chat. Gli strumenti dinamici OpenClaw continuano a essere eseguiti tramite OpenClaw, mentre gli strumenti nativi Codex come shell/apply-patch vengono eseguiti dentro Codex. Per gli eventi degli strumenti nativi Codex, OpenClaw inietta un relay di hook nativi per turno così gli hook dei Plugin possono bloccare `before_tool_call`, osservare `after_tool_call` e instradare gli eventi `PermissionRequest` di Codex tramite le approvazioni OpenClaw. Il relay v1 è deliberatamente conservativo: non modifica gli argomenti degli strumenti nativi Codex, non riscrive i record dei thread Codex e non controlla le risposte finali/gli hook Stop. Usa ACP esplicito solo quando vuoi il modello di sessione/runtime ACP. Il confine di supporto integrato di Codex è documentato nel [contratto di supporto v1 dell'harness Codex](/it/plugins/codex-harness#v1-support-contract).

Trigger in linguaggio naturale che dovrebbero essere instradati al runtime ACP:

- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
- "Run Codex through ACP in a background thread."

OpenClaw sceglie `runtime: "acp"`, risolve l'harness `agentId`, si associa alla conversazione o al thread corrente quando supportato e instrada i follow-up a quella sessione fino a chiusura/scadenza. Codex segue questo percorso solo quando ACP è esplicito o il runtime in background richiesto richiede ancora ACP.

## ACP versus sub-agents

Usa ACP quando vuoi un runtime harness esterno. Usa l'app-server Codex nativo per associare/controllare una conversazione Codex. Usa i sub-agent quando vuoi esecuzioni delegate native OpenClaw.

| Area          | Sessione ACP                           | Esecuzione sub-agent                 |
| ------------- | -------------------------------------- | ------------------------------------ |
| Runtime       | Plugin backend ACP (ad esempio acpx)   | Runtime sub-agent nativo OpenClaw    |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`    |
| Comandi principali | `/acp ...`                        | `/subagents ...`                     |
| Strumento di spawn | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agent](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Control plane delle sessioni ACP OpenClaw
2. Plugin runtime `acpx` incluso
3. Adapter Claude ACP
4. Meccanismo runtime/sessione lato Claude

Distinzione importante:

- Claude ACP è una sessione harness con controlli ACP, resume della sessione, tracciamento dei task in background e binding opzionale a conversazione/thread.
- I backend CLI sono runtime fallback locali separati solo testo. Vedi [Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- vuoi `/acp spawn`, sessioni associabili, controlli runtime o lavoro harness persistente: usa ACP
- vuoi un semplice fallback testo locale tramite CLI grezza: usa backend CLI

## Sessioni associate

### Binding alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla sessione ACP generata — nessun thread figlio, stessa superficie di chat. OpenClaw continua a possedere transport, autenticazione, sicurezza e consegna; i messaggi successivi in quella conversazione vengono instradati alla stessa sessione; `/new` e `/reset` reimpostano la sessione sul posto; `/acp close` rimuove il binding.

Modello mentale:

- **superficie di chat** — dove le persone continuano a parlare (canale Discord, topic Telegram, chat iMessage).
- **sessione ACP** — lo stato runtime durevole di Codex/Claude/Gemini a cui OpenClaw instrada.
- **thread/topic figlio** — una superficie di messaggistica extra opzionale creata solo da `--thread ...`.
- **workspace runtime** — la posizione del filesystem (`cwd`, checkout repo, workspace backend) in cui gira l'harness. Indipendente dalla superficie di chat.

Esempi:

- `/codex bind` — mantieni questa chat, genera o collega l'app-server Codex nativo, instrada qui i messaggi futuri.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — regola dalla chat il thread Codex nativo associato.
- `/codex stop` oppure `/codex steer focus on the failing tests first` — controlla il turno Codex nativo attivo.
- `/acp spawn codex --bind here` — fallback ACP esplicito per Codex.
- `/acp spawn codex --thread auto` — OpenClaw può creare un thread/topic figlio e associarlo lì.
- `/acp spawn codex --bind here --cwd /workspace/repo` — stesso binding di chat, Codex gira in `/workspace/repo`.

Note:

- `--bind here` e `--thread ...` si escludono a vicenda.
- `--bind here` funziona solo sui canali che pubblicizzano il binding alla conversazione corrente; altrimenti OpenClaw restituisce un chiaro messaggio di non supporto. I binding persistono attraverso i riavvii del gateway.
- Su Discord, `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare un thread figlio per `--thread auto|here` — non per `--bind here`.
- Se fai spawn verso un agente ACP diverso senza `--cwd`, OpenClaw eredita per impostazione predefinita il workspace dell'**agente di destinazione**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) ricadono sul predefinito del backend; altri errori di accesso (ad esempio `EACCES`) emergono come errori di spawn.

### Sessioni associate a thread

Quando i binding dei thread sono abilitati per un adapter di canale, le sessioni ACP possono essere associate ai thread:

- OpenClaw associa un thread a una sessione ACP di destinazione.
- I messaggi successivi in quel thread vengono instradati alla sessione ACP associata.
- L'output ACP viene riconsegnato allo stesso thread.
- Unfocus/close/archive/idle-timeout o scadenza per età massima rimuovono il binding.

Il supporto ai thread binding è specifico dell'adapter. Se l'adapter di canale attivo non supporta i thread binding, OpenClaw restituisce un chiaro messaggio di non supporto/non disponibilità.

Flag di funzionalità richiesti per ACP associato a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per sospendere il dispatch ACP)
- Flag di spawn del thread ACP dell'adapter di canale abilitato (specifico dell'adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canali che supportano i thread

- Qualsiasi adapter di canale che espone la capability di binding sessione/thread.
- Supporto built-in attuale:
  - Thread/canali Discord
  - Topic Telegram (topic forum in gruppi/supergruppi e topic DM)
- I canali Plugin possono aggiungere supporto tramite la stessa interfaccia di binding.

## Impostazioni specifiche del canale

Per workflow non effimeri, configura binding ACP persistenti nelle voci top-level `bindings[]`.

### Modello di binding

- `bindings[].type="acp"` contrassegna un binding persistente di conversazione ACP.
- `bindings[].match` identifica la conversazione di destinazione:
  - Canale o thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Topic forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/gruppo BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferisci `chat_id:*` o `chat_identifier:*` per binding di gruppo stabili.
  - Chat DM/gruppo iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferisci `chat_id:*` per binding di gruppo stabili.
- `bindings[].agentId` è l'ID dell'agente OpenClaw proprietario.
- Gli override ACP facoltativi si trovano in `bindings[].acp`:
  - `mode` (`persistent` o `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Runtime predefiniti per agente

Usa `agents.list[].runtime` per definire una sola volta i valori predefiniti ACP per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID dell'harness, ad esempio `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedenza degli override per sessioni associate ACP:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valori predefiniti ACP globali (ad esempio `acp.backend`)

Esempio:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Comportamento:

- OpenClaw garantisce che la sessione ACP configurata esista prima dell'uso.
- I messaggi in quel canale o topic vengono instradati alla sessione ACP configurata.
- Nelle conversazioni associate, `/new` e `/reset` reimpostano sul posto la stessa chiave di sessione ACP.
- I binding runtime temporanei (ad esempio creati dai flussi di thread-focus) si applicano comunque quando presenti.
- Per gli spawn ACP cross-agent senza un `cwd` esplicito, OpenClaw eredita il workspace dell'agente di destinazione dalla configurazione dell'agente.
- I percorsi del workspace ereditato mancanti ricadono sul cwd predefinito del backend; i fallimenti di accesso su percorsi esistenti emergono come errori di spawn.

## Avviare sessioni ACP (interfacce)

### Da `sessions_spawn`

Usa `runtime: "acp"` per avviare una sessione ACP da un turno agente o da una chiamata strumento.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Note:

- `runtime` ha come predefinito `subagent`, quindi imposta esplicitamente `runtime: "acp"` per le sessioni ACP.
- Se `agentId` è omesso, OpenClaw usa `acp.defaultAgent` quando configurato.
- `mode: "session"` richiede `thread: true` per mantenere una conversazione associata persistente.

Dettagli dell'interfaccia:

- `task` (obbligatorio): prompt iniziale inviato alla sessione ACP.
- `runtime` (obbligatorio per ACP): deve essere `"acp"`.
- `agentId` (facoltativo): ID dell'harness ACP di destinazione. Usa come fallback `acp.defaultAgent` se impostato.
- `thread` (facoltativo, predefinito `false`): richiede il flusso di binding del thread quando supportato.
- `mode` (facoltativo): `run` (one-shot) o `session` (persistente).
  - il valore predefinito è `run`
  - se `thread: true` e mode è omesso, OpenClaw può usare un comportamento persistente come predefinito in base al percorso runtime
  - `mode: "session"` richiede `thread: true`
- `cwd` (facoltativo): directory di lavoro runtime richiesta (validata dalla policy backend/runtime). Se omesso, lo spawn ACP eredita il workspace dell'agente di destinazione quando configurato; i percorsi ereditati mancanti ricadono sui predefiniti del backend, mentre i veri errori di accesso vengono restituiti.
- `label` (facoltativo): etichetta rivolta all'operatore usata nel testo di sessione/banner.
- `resumeSessionId` (facoltativo): riprende una sessione ACP esistente invece di crearne una nuova. L'agente riproduce la propria cronologia di conversazione tramite `session/load`. Richiede `runtime: "acp"`.
- `streamTo` (facoltativo): `"parent"` rimanda i riepiloghi iniziali di avanzamento della sessione ACP alla sessione richiedente come eventi di sistema.
  - Quando disponibile, le risposte accepted includono `streamLogPath` che punta a un log JSONL con ambito sessione (`<sessionId>.acp-stream.jsonl`) che puoi seguire per la cronologia completa del relay.
- `model` (facoltativo): override esplicito del modello per la sessione figlia ACP. Rispettato per `runtime: "acp"` così il figlio usa il modello richiesto invece di ricadere silenziosamente sul predefinito dell'agente di destinazione.

## Modello di consegna

Le sessioni ACP possono essere workspace interattivi oppure lavoro in background posseduto dal parent. Il percorso di consegna dipende da questa forma.

### Sessioni ACP interattive

Le sessioni interattive sono pensate per continuare a parlare su una superficie di chat visibile:

- `/acp spawn ... --bind here` associa la conversazione corrente alla sessione ACP.
- `/acp spawn ... --thread ...` associa un thread/topic di canale alla sessione ACP.
- I `bindings[].type="acp"` persistenti e configurati instradano le conversazioni corrispondenti alla stessa sessione ACP.

I messaggi successivi nella conversazione associata vengono instradati direttamente alla sessione ACP e l'output ACP viene riconsegnato allo stesso canale/thread/topic.

### Sessioni ACP one-shot possedute dal parent

Le sessioni ACP one-shot generate da un'altra esecuzione agente sono figli in background, simili ai sub-agent:

- Il parent chiede lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Il figlio gira nella propria sessione harness ACP.
- Il completamento viene riportato tramite il percorso interno di announce di completamento del task.
- Il parent riscrive il risultato del figlio con la normale voce assistant quando è utile una risposta rivolta all'utente.

Non trattare questo percorso come una chat peer-to-peer tra parent e figlio. Il figlio ha già un canale di completamento verso il parent.

### `sessions_send` e consegna A2A

`sessions_send` può puntare a un'altra sessione dopo lo spawn. Per le normali sessioni peer, OpenClaw usa un percorso di follow-up agent-to-agent (A2A) dopo aver iniettato il messaggio:

- attende la risposta della sessione di destinazione
- facoltativamente lascia che richiedente e destinazione scambino un numero limitato di turni di follow-up
- chiede alla destinazione di produrre un messaggio di announce
- consegna quell'announce al canale o thread visibile

Quel percorso A2A è un fallback per gli invii peer quando il mittente ha bisogno di un follow-up visibile. Resta abilitato quando una sessione non correlata può vedere e inviare messaggi a una destinazione ACP, ad esempio con impostazioni ampie di `tools.sessions.visibility`.

OpenClaw salta il follow-up A2A solo quando il richiedente è il parent del proprio figlio ACP one-shot posseduto dal parent. In quel caso, eseguire A2A sopra al completamento del task può risvegliare il parent con il risultato del figlio, inoltrare la risposta del parent di nuovo al figlio e creare un loop eco parent/child. Il risultato di `sessions_send` riporta `delivery.status="skipped"` per quel caso di figlio posseduto perché il percorso di completamento è già responsabile del risultato.

### Riprendere una sessione esistente

Usa `resumeSessionId` per continuare una sessione ACP precedente invece di ricominciare da zero. L'agente riproduce la propria cronologia di conversazione tramite `session/load`, così riprende con il pieno contesto di ciò che c'era prima.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casi d'uso comuni:

- Passare una sessione Codex dal laptop al telefono — chiedi al tuo agente di riprendere da dove eri rimasto
- Continuare una sessione di coding iniziata interattivamente nella CLI, ora in modo headless tramite il tuo agente
- Riprendere lavoro interrotto da un riavvio del gateway o da un idle timeout

Note:

- `resumeSessionId` richiede `runtime: "acp"` — restituisce un errore se usato con il runtime sub-agent.
- `resumeSessionId` ripristina la cronologia di conversazione ACP upstream; `thread` e `mode` si applicano comunque normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` continua a richiedere `thread: true`.
- L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo fanno).
- Se l'ID sessione non viene trovato, lo spawn fallisce con un errore chiaro — nessun fallback silenzioso a una nuova sessione.

<Accordion title="Smoke test post-deploy">

Dopo un deploy del gateway, esegui un controllo live end-to-end invece di fidarti dei test unitari:

1. Verifica versione del gateway e commit distribuito sull'host di destinazione.
2. Apri una sessione bridge ACPX temporanea verso un agente live.
3. Chiedi a quell'agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e task `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Verifica `accepted=yes`, un vero `childSessionKey` e nessun errore di validazione.
5. Pulisci la sessione bridge temporanea.

Mantieni il gate su `mode: "run"` e salta `streamTo: "parent"` — i percorsi `mode: "session"` associati a thread e i percorsi stream-relay sono passaggi di integrazione separati e più ricchi.

</Accordion>

## Compatibilità del sandbox

Le sessioni ACP attualmente girano sull'host runtime, non dentro il sandbox OpenClaw.

Limitazioni attuali:

- Se la sessione richiedente è sandboxed, gli spawn ACP sono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
  - Errore: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.
  - Errore: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` quando ti serve un'esecuzione forzata dal sandbox.

### Dal comando `/acp`

Usa `/acp spawn` per un controllo esplicito dell'operatore dalla chat quando necessario.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Flag chiave:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Vedi [Slash Commands](/it/tools/slash-commands).

## Risoluzione della destinazione della sessione

La maggior parte delle azioni `/acp` accetta una destinazione di sessione facoltativa (`session-key`, `session-id` o `session-label`).

Ordine di risoluzione:

1. Argomento esplicito di destinazione (oppure `--session` per `/acp steer`)
   - prova prima la chiave
   - poi l'ID sessione in formato UUID
   - poi l'etichetta
2. Binding del thread corrente (se questa conversazione/thread è associato a una sessione ACP)
3. Fallback alla sessione richiedente corrente

I binding alla conversazione corrente e quelli ai thread partecipano entrambi al passaggio 2.

Se nessuna destinazione viene risolta, OpenClaw restituisce un errore chiaro (`Unable to resolve session target: ...`).

## Modalità di bind dello spawn

`/acp spawn` supporta `--bind here|off`.

| Modalità | Comportamento                                                             |
| -------- | ------------------------------------------------------------------------- |
| `here`   | Associa sul posto la conversazione attiva corrente; fallisce se non ce n'è una attiva. |
| `off`    | Non crea un binding alla conversazione corrente.                          |

Note:

- `--bind here` è il percorso operatore più semplice per "rendere questo canale o questa chat supportati da Codex."
- `--bind here` non crea un thread figlio.
- `--bind here` è disponibile solo sui canali che espongono il supporto al binding della conversazione corrente.
- `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

## Modalità di thread dello spawn

`/acp spawn` supporta `--thread auto|here|off`.

| Modalità | Comportamento                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------ |
| `auto`   | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio quando supportato. |
| `here`   | Richiede un thread attivo corrente; fallisce se non sei dentro un thread.                             |
| `off`    | Nessun binding. La sessione parte non associata.                                                       |

Note:

- Sulle superfici che non supportano i thread binding, il comportamento predefinito è di fatto `off`.
- Lo spawn associato a thread richiede supporto della policy del canale:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

## Controlli ACP

| Comando              | Cosa fa                                                   | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; binding corrente o binding thread facoltativo. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione steer alla sessione in esecuzione.    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e rimuove il binding delle destinazioni thread. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, capability. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione di destinazione. | `/acp set-mode plan`                                          |
| `/acp set`           | Scrittura generica di un'opzione di configurazione runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro runtime.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.          | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout runtime (secondi).                     | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello runtime.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store.               | `/acp sessions`                                               |
| `/acp doctor`        | Stato del backend, capability, fix attuabili.             | `/acp doctor`                                                 |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp status` mostra le opzioni runtime effettive più gli identificatori di sessione a livello runtime e backend. Gli errori di controllo non supportato emergono chiaramente quando un backend non ha una capability. `/acp sessions` legge lo store per la sessione attualmente associata o richiedente; i token di destinazione (`session-key`, `session-id` o `session-label`) vengono risolti tramite individuazione della sessione gateway, incluse root personalizzate `session.store` per agente.

## Mappatura delle opzioni runtime

`/acp` ha comandi di utilità e un setter generico.

Operazioni equivalenti:

- `/acp model <id>` mappa alla chiave di configurazione runtime `model`.
- `/acp permissions <profile>` mappa alla chiave di configurazione runtime `approval_policy`.
- `/acp timeout <seconds>` mappa alla chiave di configurazione runtime `timeout`.
- `/acp cwd <path>` aggiorna direttamente l'override cwd runtime.
- `/acp set <key> <value>` è il percorso generico.
  - Caso speciale: `key=cwd` usa il percorso di override cwd.
- `/acp reset-options` cancella tutti gli override runtime per la sessione di destinazione.

## Harness acpx, configurazione del Plugin e permessi

Per la configurazione dell'harness acpx (alias Claude Code / Codex / Gemini CLI), i bridge MCP plugin-tools e OpenClaw-tools e le modalità di permesso ACP, vedi [Agenti ACP — configurazione](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                  | Correzione                                                                                                                                                                 |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend mancante o disabilitato.                                          | Installa e abilita il Plugin backend, poi esegui `/acp doctor`.                                                                                                           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                    | Imposta `acp.enabled=true`.                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Il dispatch dai normali messaggi del thread è disabilitato.                      | Imposta `acp.dispatch.enabled=true`.                                                                                                                                       |
| `ACP agent "<id>" is not allowed by policy`                                 | L'agente non è nella allowlist.                                                  | Usa un `agentId` consentito oppure aggiorna `acp.allowedAgents`.                                                                                                          |
| `Unable to resolve session target: ...`                                     | Token chiave/id/etichetta errato.                                                | Esegui `/acp sessions`, copia chiave/etichetta esatta, riprova.                                                                                                           |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva associabile.                  | Spostati nella chat/canale di destinazione e riprova, oppure usa uno spawn non associato.                                                                                |
| `Conversation bindings are unavailable for <channel>.`                      | L'adapter non ha la capability ACP di binding della conversazione corrente.      | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di primo livello oppure spostati in un canale supportato.                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto thread.                               | Spostati nel thread di destinazione oppure usa `--thread auto`/`off`.                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di binding attiva.                      | Ricollega come proprietario oppure usa una conversazione o un thread diverso.                                                                                             |
| `Thread bindings are unavailable for <channel>.`                            | L'adapter non ha la capability di thread binding.                                | Usa `--thread off` oppure spostati su adapter/canale supportati.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è sandboxed.                 | Usa `runtime="subagent"` dalle sessioni sandboxed, oppure esegui lo spawn ACP da una sessione non sandboxed.                                                             |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` richiesto per il runtime ACP.                                | Usa `runtime="subagent"` per sandbox obbligatorio, oppure usa ACP con `sandbox="inherit"` da una sessione non sandboxed.                                                 |
| Metadati ACP mancanti per la sessione associata                             | Metadati della sessione ACP obsoleti/eliminati.                                  | Ricrea con `/acp spawn`, poi ricollega/rifocalizza il thread.                                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/exec in una sessione ACP non interattiva.      | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il gateway. Vedi [Configurazione dei permessi](/it/tools/acp-agents-setup#permission-configuration). |
| La sessione ACP fallisce presto con poco output                             | I prompt di permesso sono bloccati da `permissionMode`/`nonInteractivePermissions`. | Controlla i log del gateway per `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per degrado controllato, imposta `nonInteractivePermissions=deny`. |
| La sessione ACP resta bloccata indefinitamente dopo aver completato il lavoro | Il processo harness è terminato ma la sessione ACP non ha segnalato il completamento. | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti.                                                                                              |

## Correlati

- [Sub-agent](/it/tools/subagents)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [Agent send](/it/tools/agent-send)
