---
read_when:
    - Esecuzione di harness di coding tramite ACP
    - Configurazione di sessioni ACP collegate alla conversazione sui canali di messaggistica
    - Collegare una conversazione di un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP e del wiring del Plugin
    - Debug della consegna del completamento ACP o dei loop agente-agente
    - Uso dei comandi `/acp` dalla chat
summary: Usa le sessioni runtime ACP per Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e altri agenti harness
title: Agenti ACP
x-i18n:
    generated_at: "2026-04-22T04:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agenti ACP

Le sessioni [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) consentono a OpenClaw di eseguire harness di coding esterni (ad esempio Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e altri harness ACPX supportati) tramite un Plugin backend ACP.

Se chiedi a OpenClaw in linguaggio naturale di "eseguire questo in Codex" o "avviare Claude Code in un thread", OpenClaw dovrebbe instradare quella richiesta al runtime ACP (non al runtime nativo dei sottoagenti). Ogni avvio di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

Se vuoi che Codex o Claude Code si colleghino direttamente come client MCP esterni
a conversazioni di canale OpenClaw esistenti, usa invece [`openclaw mcp serve`](/cli/mcp) di ACP.

## Quale pagina mi serve?

Ci sono tre superfici vicine che è facile confondere:

| Vuoi... | Usa | Note |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Eseguire Codex, Claude Code, Gemini CLI o un altro harness esterno _tramite_ OpenClaw | Questa pagina: agenti ACP | Sessioni collegate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o client | [`openclaw acp`](/cli/acp) | Modalità bridge. L'IDE/client parla ACP con OpenClaw su stdio/WebSocket |
| Riutilizzare una CLI AI locale come modello di fallback solo testo | [Backend CLI](/it/gateway/cli-backends) | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness |

## Funziona subito?

Di solito sì.

- Le installazioni nuove ora includono il Plugin runtime `acpx` incluso abilitato per impostazione predefinita.
- Il Plugin `acpx` incluso preferisce il proprio binario `acpx` locale al Plugin e vincolato.
- All'avvio, OpenClaw esegue un probe di quel binario e lo autoripara se necessario.
- Inizia con `/acp doctor` se vuoi un rapido controllo di disponibilità.

Cosa può comunque succedere al primo utilizzo:

- Un adapter harness di destinazione può essere recuperato su richiesta con `npx` la prima volta che usi quell'harness.
- L'autenticazione del vendor deve comunque esistere sull'host per quell'harness.
- Se l'host non ha accesso npm/rete, i recuperi del primo avvio degli adapter possono fallire finché le cache non vengono preriscaldate o l'adapter non viene installato in altro modo.

Esempi:

- `/acp spawn codex`: OpenClaw dovrebbe essere pronto a inizializzare `acpx`, ma l'adapter ACP di Codex potrebbe comunque aver bisogno di un primo recupero.
- `/acp spawn claude`: stesso discorso per l'adapter ACP di Claude, più l'autenticazione lato Claude su quell'host.

## Flusso rapido per operatori

Usalo quando vuoi un runbook pratico per `/acp`:

1. Avvia una sessione:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Lavora nella conversazione o nel thread collegati (oppure indirizza esplicitamente quella chiave di sessione).
3. Controlla lo stato del runtime:
   - `/acp status`
4. Regola le opzioni runtime secondo necessità:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dai un impulso a una sessione attiva senza sostituire il contesto:
   - `/acp steer restringi il logging e continua`
6. Interrompi il lavoro:
   - `/acp cancel` (interrompe il turno corrente), oppure
   - `/acp close` (chiude la sessione + rimuove i binding)

## Guida rapida per gli utenti

Esempi di richieste naturali:

- "Collega questo canale Discord a Codex."
- "Avvia una sessione Codex persistente in un thread qui e mantienila focalizzata."
- "Esegui questo come sessione ACP Claude Code one-shot e riassumi il risultato."
- "Collega questa chat iMessage a Codex e mantieni i follow-up nello stesso workspace."
- "Usa Gemini CLI per questa attività in un thread, poi mantieni i follow-up nello stesso thread."

Cosa dovrebbe fare OpenClaw:

1. Scegliere `runtime: "acp"`.
2. Risolvere il target harness richiesto (`agentId`, ad esempio `codex`).
3. Se viene richiesto il binding alla conversazione corrente e il canale attivo lo supporta, collegare la sessione ACP a quella conversazione.
4. Altrimenti, se viene richiesto il binding al thread e il canale corrente lo supporta, collegare la sessione ACP al thread.
5. Instradare i messaggi di follow-up collegati alla stessa sessione ACP finché non viene tolto il focus/chiusa/scaduta.

## ACP rispetto ai sottoagenti

Usa ACP quando vuoi un runtime harness esterno. Usa i sottoagenti quando vuoi esecuzioni delegate native di OpenClaw.

| Area | Sessione ACP | Esecuzione sottoagente |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime | Plugin backend ACP (ad esempio acpx) | Runtime nativo dei sottoagenti OpenClaw |
| Chiave di sessione | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| Comandi principali | `/acp ...` | `/subagents ...` |
| Strumento di avvio | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sottoagenti](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Control plane della sessione ACP di OpenClaw
2. Plugin runtime `acpx` incluso
3. Adapter ACP Claude
4. Macchinario runtime/sessione lato Claude

Distinzione importante:

- ACP Claude è una sessione harness con controlli ACP, resume della sessione, tracciamento delle attività in background e binding facoltativo a conversazione/thread.
- I backend CLI sono runtime di fallback locali separati solo testo. Vedi [Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- vuoi `/acp spawn`, sessioni collegabili, controlli runtime o lavoro harness persistente: usa ACP
- vuoi un semplice fallback testuale locale tramite la CLI raw: usa i backend CLI

## Sessioni collegate

### Binding alla conversazione corrente

Usa `/acp spawn <harness> --bind here` quando vuoi che la conversazione corrente diventi un workspace ACP durevole senza creare un thread figlio.

Comportamento:

- OpenClaw continua a possedere il trasporto del canale, l'autenticazione, la sicurezza e la consegna.
- La conversazione corrente viene fissata alla chiave della sessione ACP avviata.
- I messaggi di follow-up in quella conversazione vengono instradati alla stessa sessione ACP.
- `/new` e `/reset` reimpostano la stessa sessione ACP collegata sul posto.
- `/acp close` chiude la sessione e rimuove il binding alla conversazione corrente.

Cosa significa in pratica:

- `--bind here` mantiene la stessa superficie di chat. Su Discord, il canale corrente resta il canale corrente.
- `--bind here` può comunque creare una nuova sessione ACP se stai avviando lavoro nuovo. Il binding collega quella sessione alla conversazione corrente.
- `--bind here` non crea da solo un thread figlio Discord o un topic Telegram.
- Il runtime ACP può comunque avere il proprio working directory (`cwd`) o workspace su disco gestito dal backend. Quel workspace runtime è separato dalla superficie di chat e non implica un nuovo thread di messaggistica.
- Se avvii verso un agente ACP diverso e non passi `--cwd`, OpenClaw eredita per impostazione predefinita il workspace **dell'agente di destinazione**, non quello del richiedente.
- Se quel percorso del workspace ereditato manca (`ENOENT`/`ENOTDIR`), OpenClaw torna al cwd predefinito del backend invece di riutilizzare silenziosamente l'albero sbagliato.
- Se il workspace ereditato esiste ma non è accessibile (ad esempio `EACCES`), l'avvio restituisce il vero errore di accesso invece di eliminare `cwd`.

Modello mentale:

- superficie di chat: dove le persone continuano a parlare (`canale Discord`, `topic Telegram`, `chat iMessage`)
- sessione ACP: lo stato durevole del runtime Codex/Claude/Gemini a cui OpenClaw instrada
- thread/topic figlio: una superficie di messaggistica extra facoltativa creata solo da `--thread ...`
- workspace runtime: la posizione del filesystem in cui l'harness viene eseguito (`cwd`, checkout del repo, workspace backend)

Esempi:

- `/acp spawn codex --bind here`: mantieni questa chat, avvia o collega una sessione ACP Codex e instrada i messaggi futuri qui verso di essa
- `/acp spawn codex --thread auto`: OpenClaw può creare un thread/topic figlio e collegarvi la sessione ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: stesso binding alla chat di sopra, ma Codex viene eseguito in `/workspace/repo`

Supporto del binding alla conversazione corrente:

- I canali chat/messaggio che pubblicizzano il supporto al binding della conversazione corrente possono usare `--bind here` tramite il percorso condiviso di conversation-binding.
- I canali con semantiche personalizzate di thread/topic possono comunque fornire la canonicalizzazione specifica del canale dietro la stessa interfaccia condivisa.
- `--bind here` significa sempre "collega sul posto la conversazione corrente".
- I binding generici alla conversazione corrente usano lo store di binding condiviso di OpenClaw e sopravvivono ai normali riavvii del Gateway.

Note:

- `--bind here` e `--thread ...` si escludono a vicenda su `/acp spawn`.
- Su Discord, `--bind here` collega sul posto il canale o thread corrente. `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare un thread figlio per `--thread auto|here`.
- Se il canale attivo non espone binding ACP alla conversazione corrente, OpenClaw restituisce un chiaro messaggio di non supporto.
- `resume` e le domande "nuova sessione" sono domande sulla sessione ACP, non sul canale. Puoi riutilizzare o sostituire lo stato runtime senza cambiare la superficie di chat corrente.

### Sessioni collegate al thread

Quando i thread binding sono abilitati per un adapter di canale, le sessioni ACP possono essere collegate ai thread:

- OpenClaw collega un thread a una sessione ACP di destinazione.
- I messaggi di follow-up in quel thread vengono instradati alla sessione ACP collegata.
- L'output ACP viene consegnato di nuovo allo stesso thread.
- Unfocus/close/archive/idle-timeout o la scadenza max-age rimuovono il binding.

Il supporto al thread binding è specifico dell'adapter. Se l'adapter del canale attivo non supporta i thread binding, OpenClaw restituisce un chiaro messaggio di non supporto/non disponibilità.

Flag di funzionalità richiesti per ACP collegato al thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per sospendere il dispatch ACP)
- Flag di thread-spawn ACP dell'adapter di canale abilitato (specifico dell'adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canali che supportano i thread

- Qualsiasi adapter di canale che espone la funzionalità di session/thread binding.
- Supporto integrato attuale:
  - thread/canali Discord
  - topic Telegram (topic forum in gruppi/supergruppi e topic DM)
- I canali Plugin possono aggiungere supporto tramite la stessa interfaccia di binding.

## Impostazioni specifiche del canale

Per i flussi di lavoro non effimeri, configura binding ACP persistenti nelle voci di livello superiore `bindings[]`.

### Modello di binding

- `bindings[].type="acp"` contrassegna un binding persistente di conversazione ACP.
- `bindings[].match` identifica la conversazione di destinazione:
  - canale o thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - topic forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - chat DM/di gruppo BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferisci `chat_id:*` o `chat_identifier:*` per binding di gruppo stabili.
  - chat DM/di gruppo iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferisci `chat_id:*` per binding di gruppo stabili.
- `bindings[].agentId` è l'ID dell'agente OpenClaw proprietario.
- Gli override ACP facoltativi si trovano sotto `bindings[].acp`:
  - `mode` (`persistent` oppure `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valori predefiniti del runtime per agente

Usa `agents.list[].runtime` per definire una sola volta i valori predefiniti ACP per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID dell'harness, ad esempio `codex` oppure `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedenza degli override per le sessioni ACP collegate:

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

- OpenClaw assicura che la sessione ACP configurata esista prima dell'uso.
- I messaggi in quel canale o topic vengono instradati alla sessione ACP configurata.
- Nelle conversazioni collegate, `/new` e `/reset` reimpostano sul posto la stessa chiave di sessione ACP.
- I binding runtime temporanei (ad esempio creati dai flussi di thread-focus) continuano ad applicarsi dove presenti.
- Per gli avvii ACP cross-agent senza un `cwd` esplicito, OpenClaw eredita il workspace dell'agente di destinazione dalla configurazione dell'agente.
- I percorsi del workspace ereditato mancanti tornano al cwd predefinito del backend; i veri errori di accesso su percorsi esistenti emergono come errori di avvio.

## Avviare sessioni ACP (interfacce)

### Da `sessions_spawn`

Usa `runtime: "acp"` per avviare una sessione ACP da un turno agente o una chiamata di strumento.

```json
{
  "task": "Apri il repository e riassumi i test non riusciti",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Note:

- `runtime` ha come predefinito `subagent`, quindi imposta esplicitamente `runtime: "acp"` per le sessioni ACP.
- Se `agentId` viene omesso, OpenClaw usa `acp.defaultAgent` quando configurato.
- `mode: "session"` richiede `thread: true` per mantenere una conversazione collegata persistente.

Dettagli dell'interfaccia:

- `task` (obbligatorio): prompt iniziale inviato alla sessione ACP.
- `runtime` (obbligatorio per ACP): deve essere `"acp"`.
- `agentId` (facoltativo): ID dell'harness ACP di destinazione. Torna a `acp.defaultAgent` se impostato.
- `thread` (facoltativo, predefinito `false`): richiede il flusso di thread binding dove supportato.
- `mode` (facoltativo): `run` (one-shot) oppure `session` (persistente).
  - il predefinito è `run`
  - se `thread: true` e la modalità è omessa, OpenClaw può usare un comportamento persistente predefinito in base al percorso runtime
  - `mode: "session"` richiede `thread: true`
- `cwd` (facoltativo): working directory runtime richiesta (convalidata dal criterio backend/runtime). Se omesso, l'avvio ACP eredita il workspace dell'agente di destinazione quando configurato; i percorsi ereditati mancanti tornano ai valori predefiniti del backend, mentre i veri errori di accesso vengono restituiti.
- `label` (facoltativo): etichetta rivolta all'operatore usata nel testo della sessione/banner.
- `resumeSessionId` (facoltativo): riprende una sessione ACP esistente invece di crearne una nuova. L'agente rigioca la propria cronologia della conversazione tramite `session/load`. Richiede `runtime: "acp"`.
- `streamTo` (facoltativo): `"parent"` invia in streaming i riepiloghi di avanzamento dell'esecuzione ACP iniziale alla sessione richiedente come eventi di sistema.
  - Quando disponibile, le risposte accettate includono `streamLogPath` che punta a un log JSONL con scope di sessione (`<sessionId>.acp-stream.jsonl`) che puoi seguire per la cronologia completa del relay.

## Modello di consegna

Le sessioni ACP possono essere workspace interattivi oppure lavoro in background posseduto dal parent. Il percorso di consegna dipende da questa forma.

### Sessioni ACP interattive

Le sessioni interattive sono pensate per continuare a parlare su una superficie di chat visibile:

- `/acp spawn ... --bind here` collega la conversazione corrente alla sessione ACP.
- `/acp spawn ... --thread ...` collega un thread/topic del canale alla sessione ACP.
- I `bindings[].type="acp"` persistenti configurati instradano le conversazioni corrispondenti alla stessa sessione ACP.

I messaggi di follow-up nella conversazione collegata vengono instradati direttamente alla sessione ACP, e l'output ACP viene consegnato di nuovo allo stesso canale/thread/topic.

### Sessioni ACP one-shot possedute dal parent

Le sessioni ACP one-shot avviate da un'altra esecuzione agente sono figli in background, simili ai sottoagenti:

- Il parent richiede lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Il figlio viene eseguito nella propria sessione harness ACP.
- Il completamento viene riportato tramite il percorso interno di annuncio del completamento dell'attività.
- Il parent riscrive il risultato del figlio nella normale voce dell'assistente quando è utile una risposta visibile all'utente.

Non trattare questo percorso come una chat peer-to-peer tra parent e figlio. Il figlio ha già un canale di completamento verso il parent.

### `sessions_send` e consegna A2A

`sessions_send` può indirizzarsi a un'altra sessione dopo l'avvio. Per le normali sessioni peer, OpenClaw usa un percorso di follow-up agent-to-agent (A2A) dopo aver iniettato il messaggio:

- attendere la risposta della sessione di destinazione
- facoltativamente lasciare che richiedente e destinazione si scambino un numero limitato di turni di follow-up
- chiedere alla destinazione di produrre un messaggio di annuncio
- consegnare quell'annuncio al canale o thread visibile

Quel percorso A2A è un fallback per invii peer in cui il mittente ha bisogno di un follow-up visibile. Resta abilitato quando una sessione non correlata può vedere e inviare messaggi a una destinazione ACP, ad esempio sotto impostazioni ampie di `tools.sessions.visibility`.

OpenClaw salta il follow-up A2A solo quando il richiedente è il parent del proprio figlio ACP one-shot posseduto dal parent. In quel caso, eseguire A2A sopra il completamento dell'attività può riattivare il parent con il risultato del figlio, inoltrare la risposta del parent di nuovo nel figlio e creare un loop di eco parent/child. Il risultato di `sessions_send` riporta `delivery.status="skipped"` per quel caso di figlio posseduto perché il percorso di completamento è già responsabile del risultato.

### Riprendere una sessione esistente

Usa `resumeSessionId` per continuare una sessione ACP precedente invece di ricominciare da zero. L'agente rigioca la propria cronologia della conversazione tramite `session/load`, così riprende con il contesto completo di ciò che è avvenuto prima.

```json
{
  "task": "Continua da dove ci siamo fermati — correggi i test rimanenti non riusciti",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casi d'uso comuni:

- Passare una sessione Codex dal laptop al telefono — chiedi al tuo agente di riprendere da dove avevi lasciato
- Continuare una sessione di coding avviata in modo interattivo nella CLI, ora in modalità headless tramite il tuo agente
- Riprendere lavoro interrotto da un riavvio del Gateway o da un idle timeout

Note:

- `resumeSessionId` richiede `runtime: "acp"` — restituisce un errore se usato con il runtime dei sottoagenti.
- `resumeSessionId` ripristina la cronologia della conversazione ACP upstream; `thread` e `mode` continuano comunque ad applicarsi normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede ancora `thread: true`.
- L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo supportano).
- Se l'ID della sessione non viene trovato, l'avvio fallisce con un errore chiaro — nessun fallback silenzioso a una nuova sessione.

### Smoke test per operatori

Usalo dopo un deploy del Gateway quando vuoi un rapido controllo live che l'avvio ACP
stia davvero funzionando end-to-end, non solo superando unit test.

Gate consigliato:

1. Verifica la versione/commit del Gateway distribuito sull'host di destinazione.
2. Conferma che il sorgente distribuito includa l'accettazione della lineage ACP in
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Apri una sessione bridge ACPX temporanea verso un agente live (ad esempio
   `razor(main)` su `jpclawhq`).
4. Chiedi a quell'agente di chiamare `sessions_spawn` con:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifica che l'agente riporti:
   - `accepted=yes`
   - un vero `childSessionKey`
   - nessun errore di validazione
6. Ripulisci la sessione bridge ACPX temporanea.

Esempio di prompt per l'agente live:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Note:

- Mantieni questo smoke test su `mode: "run"` a meno che tu non stia intenzionalmente testando
  sessioni ACP persistenti collegate a thread.
- Non richiedere `streamTo: "parent"` per il gate di base. Quel percorso dipende dalle
  funzionalità di richiedente/sessione ed è un controllo di integrazione separato.
- Tratta il test di `mode: "session"` collegato a thread come un secondo passaggio
  di integrazione più ricco da un vero thread Discord o topic Telegram.

## Compatibilità con la sandbox

Le sessioni ACP al momento vengono eseguite sul runtime host, non dentro la sandbox di OpenClaw.

Limitazioni attuali:

- Se la sessione richiedente è in sandbox, gli avvii ACP vengono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
  - Errore: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.
  - Errore: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` quando hai bisogno di esecuzione forzata dalla sandbox.

### Dal comando `/acp`

Usa `/acp spawn` per un controllo esplicito dell'operatore dalla chat quando necessario.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Flag principali:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Vedi [Comandi slash](/it/tools/slash-commands).

## Risoluzione del target della sessione

La maggior parte delle azioni `/acp` accetta un target di sessione facoltativo (`session-key`, `session-id` oppure `session-label`).

Ordine di risoluzione:

1. Argomento di target esplicito (oppure `--session` per `/acp steer`)
   - prova prima la chiave
   - poi l'ID sessione in formato UUID
   - poi l'etichetta
2. Binding del thread corrente (se questa conversazione/thread è collegata a una sessione ACP)
3. Fallback alla sessione del richiedente corrente

Sia i binding alla conversazione corrente sia quelli al thread partecipano al passaggio 2.

Se nessun target viene risolto, OpenClaw restituisce un errore chiaro (`Unable to resolve session target: ...`).

## Modalità di binding all'avvio

`/acp spawn` supporta `--bind here|off`.

| Modalità | Comportamento |
| ------ | ---------------------------------------------------------------------- |
| `here` | Collega sul posto la conversazione attiva corrente; fallisce se non ce n'è una attiva. |
| `off`  | Non creare un binding alla conversazione corrente. |

Note:

- `--bind here` è il percorso operatore più semplice per "rendere questo canale o chat supportato da Codex."
- `--bind here` non crea un thread figlio.
- `--bind here` è disponibile solo sui canali che espongono il supporto al binding della conversazione corrente.
- `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

## Modalità thread all'avvio

`/acp spawn` supporta `--thread auto|here|off`.

| Modalità | Comportamento |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | In un thread attivo: collega quel thread. Fuori da un thread: crea/collega un thread figlio quando supportato. |
| `here` | Richiede il thread attivo corrente; fallisce se non ti trovi in un thread. |
| `off`  | Nessun binding. La sessione viene avviata senza binding. |

Note:

- Su superfici che non supportano thread binding, il comportamento predefinito è di fatto `off`.
- L'avvio con thread binding richiede il supporto del criterio del canale:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

## Controlli ACP

Famiglia di comandi disponibili:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` mostra le opzioni runtime effettive e, quando disponibili, sia gli identificatori di sessione a livello runtime sia quelli a livello backend.

Alcuni controlli dipendono dalle funzionalità del backend. Se un backend non supporta un controllo, OpenClaw restituisce un chiaro errore di controllo non supportato.

## Cookbook dei comandi ACP

| Comando | Cosa fa | Esempio |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; binding facoltativo alla conversazione corrente o al thread. | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer`         | Invia un'istruzione di steering alla sessione in esecuzione. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e scollega i target thread. | `/acp close` |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, funzionalità. | `/acp status` |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione di destinazione. | `/acp set-mode plan` |
| `/acp set`           | Scrittura generica di opzione di configurazione runtime. | `/acp set model openai/gpt-5.4` |
| `/acp cwd`           | Imposta l'override della working directory runtime. | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions`   | Imposta il profilo del criterio di approvazione. | `/acp permissions strict` |
| `/acp timeout`       | Imposta il timeout runtime (secondi). | `/acp timeout 120` |
| `/acp model`         | Imposta l'override del modello runtime. | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options` |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store. | `/acp sessions` |
| `/acp doctor`        | Stato del backend, funzionalità, correzioni attuabili. | `/acp doctor` |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install` |

`/acp sessions` legge lo store per la sessione corrente collegata o del richiedente. I comandi che accettano token `session-key`, `session-id` o `session-label` risolvono i target tramite la discovery delle sessioni del Gateway, inclusi i root personalizzati `session.store` per agente.

## Mappatura delle opzioni runtime

`/acp` ha comandi di comodo e un setter generico.

Operazioni equivalenti:

- `/acp model <id>` viene mappato alla chiave di configurazione runtime `model`.
- `/acp permissions <profile>` viene mappato alla chiave di configurazione runtime `approval_policy`.
- `/acp timeout <seconds>` viene mappato alla chiave di configurazione runtime `timeout`.
- `/acp cwd <path>` aggiorna direttamente l'override del cwd runtime.
- `/acp set <key> <value>` è il percorso generico.
  - Caso speciale: `key=cwd` usa il percorso di override del cwd.
- `/acp reset-options` cancella tutti gli override runtime per la sessione di destinazione.

## Supporto harness acpx (attuale)

Alias harness integrati attuali di acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId` a meno che la tua configurazione acpx non definisca alias agente personalizzati.
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sostituisci il comando dell'agente `cursor` nella tua configurazione acpx invece di cambiare il valore predefinito integrato.

L'uso diretto della CLI acpx può anche indirizzarsi ad adapter arbitrari tramite `--agent <command>`, ma questa via di fuga raw è una funzionalità della CLI acpx (non il normale percorso `agentId` di OpenClaw).

## Configurazione richiesta

Baseline ACP del core:

```json5
{
  acp: {
    enabled: true,
    // Facoltativo. Il valore predefinito è true; imposta false per sospendere il dispatch ACP mantenendo i controlli /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configurazione dei thread binding è specifica dell'adapter di canale. Esempio per Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Se l'avvio ACP collegato a thread non funziona, verifica prima il flag di funzionalità dell'adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

I binding alla conversazione corrente non richiedono la creazione di un thread figlio. Richiedono un contesto di conversazione attivo e un adapter di canale che esponga binding ACP della conversazione.

Vedi [Riferimento della configurazione](/it/gateway/configuration-reference).

## Configurazione del Plugin per il backend acpx

Le installazioni nuove includono il Plugin runtime `acpx` abilitato per impostazione predefinita, quindi ACP
di solito funziona senza un passaggio manuale di installazione del Plugin.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, l'hai negato tramite `plugins.allow` / `plugins.deny`, oppure vuoi
passare a un checkout locale di sviluppo, usa il percorso esplicito del Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione del workspace locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Poi verifica lo stato del backend:

```text
/acp doctor
```

### Configurazione di comando e versione di acpx

Per impostazione predefinita, il Plugin backend acpx incluso (`acpx`) usa il binario locale al Plugin e vincolato:

1. Il comando ha come predefinito `node_modules/.bin/acpx` locale al Plugin all'interno del pacchetto Plugin ACPX.
2. La versione attesa ha come predefinito il pin dell'estensione.
3. All'avvio il backend ACP viene registrato immediatamente come non pronto.
4. Un job di verifica in background esegue `acpx --version`.
5. Se il binario locale al Plugin manca o non corrisponde, esegue:
   `npm install --omit=dev --no-save acpx@<pinned>` e verifica di nuovo.

Puoi sostituire comando/versione nella configurazione del Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Note:

- `command` accetta un percorso assoluto, un percorso relativo o un nome comando (`acpx`).
- I percorsi relativi vengono risolti dalla directory workspace di OpenClaw.
- `expectedVersion: "any"` disabilita il controllo rigoroso della versione.
- Quando `command` punta a un binario/percorso personalizzato, l'installazione automatica locale al Plugin viene disabilitata.
- L'avvio di OpenClaw resta non bloccante mentre viene eseguito il controllo di stato del backend.

Vedi [Plugin](/it/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime di acpx
(binari specifici della piattaforma) vengono installate automaticamente
tramite un hook postinstall. Se l'installazione automatica fallisce, il Gateway si avvia comunque
normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP degli strumenti Plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono al
harness ACP gli strumenti registrati dai Plugin OpenClaw.

Se vuoi che agenti ACP come Codex o Claude Code possano chiamare strumenti
dei Plugin OpenClaw installati, come memory recall/store, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-plugin-tools` nel bootstrap
  della sessione ACPX.
- Espone gli strumenti Plugin già registrati dai Plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disattivata per impostazione predefinita.

Note di sicurezza e fiducia:

- Questo amplia la superficie degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti Plugin già attivi nel Gateway.
- Trattalo come lo stesso confine di fiducia di consentire a quei Plugin di eseguire codice in
  OpenClaw stesso.
- Rivedi i Plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato plugin-tools è una
comodità aggiuntiva opt-in, non un sostituto della configurazione generica del server MCP.

### Configurazione del timeout runtime

Il Plugin `acpx` incluso imposta per impostazione predefinita i turni runtime incorporati a un
timeout di 120 secondi. Questo offre a harness più lenti come Gemini CLI tempo sufficiente per completare
avvio e inizializzazione ACP. Sostituiscilo se il tuo host ha bisogno di un
limite runtime diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Riavvia il Gateway dopo aver modificato questo valore.

### Configurazione dell'agente del probe di stato

Il Plugin `acpx` incluso esegue il probe di un harness agent mentre decide se il
backend runtime incorporato è pronto. Per impostazione predefinita usa `codex`. Se il tuo deploy
usa un agente ACP predefinito diverso, imposta l'agente di probe sullo stesso ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il Gateway dopo aver modificato questo valore.

## Configurazione dei permessi

Le sessioni ACP vengono eseguite in modalità non interattiva — non c'è alcun TTY per approvare o negare i prompt di permesso di scrittura file e esecuzione shell. Il Plugin acpx fornisce due chiavi di configurazione che controllano come vengono gestiti i permessi:

Questi permessi dell'harness ACPX sono separati dalle approvazioni exec di OpenClaw e separati dai flag di bypass del vendor dei backend CLI, come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l'interruttore break-glass a livello di harness per le sessioni ACP.

### `permissionMode`

Controlla quali operazioni l'agente harness può eseguire senza prompt.

| Valore | Comportamento |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture di file e i comandi shell. |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed exec richiedono prompt. |
| `deny-all`      | Nega tutti i prompt di permesso. |

### `nonInteractivePermissions`

Controlla cosa succede quando verrebbe mostrato un prompt di permesso ma non è disponibile alcun TTY interattivo (cosa che vale sempre per le sessioni ACP).

| Valore | Comportamento |
| ------ | ----------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)** |
| `deny` | Nega silenziosamente il permesso e continua (degrado graduale). |

### Configurazione

Imposta tramite la configurazione del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il Gateway dopo aver modificato questi valori.

> **Importante:** OpenClaw al momento usa come predefiniti `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o exec che attivi un prompt di permesso può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se devi limitare i permessi, imposta `nonInteractivePermissions` su `deny` così le sessioni degradano gradualmente invece di bloccarsi.

## Risoluzione dei problemi

| Sintomo | Causa probabile | Correzione |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured` | Plugin backend mancante o disabilitato. | Installa e abilita il Plugin backend, poi esegui `/acp doctor`. |
| `ACP is disabled by policy (acp.enabled=false)` | ACP disabilitato globalmente. | Imposta `acp.enabled=true`. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | Il dispatch dai normali messaggi del thread è disabilitato. | Imposta `acp.dispatch.enabled=true`. |
| `ACP agent "<id>" is not allowed by policy` | Agente non presente nell'allowlist. | Usa un `agentId` consentito oppure aggiorna `acp.allowedAgents`. |
| `Unable to resolve session target: ...` | Token chiave/id/etichetta non valido. | Esegui `/acp sessions`, copia la chiave/etichetta esatta e riprova. |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva collegabile. | Vai nella chat/canale di destinazione e riprova, oppure usa un avvio senza binding. |
| `Conversation bindings are unavailable for <channel>.` | L'adapter non ha la funzionalità ACP di binding alla conversazione corrente. | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di livello superiore oppure passa a un canale supportato. |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` usato fuori da un contesto thread. | Vai nel thread di destinazione oppure usa `--thread auto`/`off`. |
| `Only <user-id> can rebind this channel/conversation/thread.` | Un altro utente possiede il target di binding attivo. | Ricollega come proprietario oppure usa una conversazione o un thread diverso. |
| `Thread bindings are unavailable for <channel>.` | L'adapter non ha la funzionalità di thread binding. | Usa `--thread off` oppure passa a un adapter/canale supportato. |
| `Sandboxed sessions cannot spawn ACP sessions ...` | Il runtime ACP è lato host; la sessione richiedente è in sandbox. | Usa `runtime="subagent"` da sessioni in sandbox, oppure esegui l'avvio ACP da una sessione non in sandbox. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | Richiesto `sandbox="require"` per il runtime ACP. | Usa `runtime="subagent"` per una sandbox obbligatoria, oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox. |
| Metadati ACP mancanti per la sessione collegata | Metadati della sessione ACP obsoleti/eliminati. | Ricrea con `/acp spawn`, poi ricollega/rifocalizza il thread. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blocca scritture/exec nella sessione ACP non interattiva. | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il Gateway. Vedi [Configurazione dei permessi](#permission-configuration). |
| La sessione ACP fallisce presto con poco output | I prompt di permesso sono bloccati da `permissionMode`/`nonInteractivePermissions`. | Controlla i log del Gateway per `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per un degrado graduale, imposta `nonInteractivePermissions=deny`. |
| La sessione ACP resta bloccata indefinitamente dopo aver completato il lavoro | Il processo harness è terminato ma la sessione ACP non ha segnalato il completamento. | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti. |
