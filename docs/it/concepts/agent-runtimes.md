---
read_when:
    - Stai scegliendo tra Pi, Codex, ACP o un altro runtime agente nativo
    - Sei confuso dalle etichette provider/modello/runtime in status o nella configurazione
    - Stai documentando la parità di supporto per un harness nativo
summary: Come OpenClaw separa provider di modelli, modelli, canali e runtime degli agenti
title: Runtime degli agenti
x-i18n:
    generated_at: "2026-04-26T11:26:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Un **runtime agente** è il componente che possiede un loop di modello preparato: riceve il prompt, guida l'output del modello, gestisce le chiamate native agli strumenti e restituisce il turno completato a OpenClaw.

I runtime si confondono facilmente con i provider perché entrambi compaiono vicino alla configurazione del modello. Sono livelli diversi:

| Livello       | Esempi                               | Cosa significa                                                      |
| ------------- | ------------------------------------ | ------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Come OpenClaw autentica, scopre i modelli e assegna nomi ai riferimenti dei modelli. |
| Model         | `gpt-5.5`, `claude-opus-4-6`         | Il modello selezionato per il turno dell'agente.                    |
| Runtime agente | `pi`, `codex`, `claude-cli`          | Il loop o backend di basso livello che esegue il turno preparato.   |
| Canale        | Telegram, Discord, Slack, WhatsApp   | Dove i messaggi entrano ed escono da OpenClaw.                      |

Nel codice vedrai anche la parola **harness**. Un harness è l'implementazione
che fornisce un runtime agente. Ad esempio, l'harness Codex incluso nel bundle
implementa il runtime `codex`. La configurazione pubblica usa `agentRuntime.id`; `openclaw
doctor --fix` riscrive le vecchie chiavi runtime-policy in quella forma.

Esistono due famiglie di runtime:

- Gli **harness incorporati** vengono eseguiti all'interno del loop agente preparato di OpenClaw. Oggi questo
  include il runtime `pi` integrato più harness di Plugin registrati come
  `codex`.
- I **backend CLI** eseguono un processo CLI locale mantenendo canonico il
  riferimento al modello. Ad esempio, `anthropic/claude-opus-4-7` con
  `agentRuntime.id: "claude-cli"` significa "seleziona il modello Anthropic, esegui
  tramite Claude CLI". `claude-cli` non è un ID di harness incorporato e non deve
  essere passato alla selezione AgentHarness.

## Tre cose chiamate Codex

La maggior parte della confusione deriva da tre superfici diverse che condividono il nome Codex:

| Superficie                                            | Nome/configurazione OpenClaw          | Cosa fa                                                                                             |
| ----------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Percorso provider OAuth Codex                         | riferimenti modello `openai-codex/*`  | Usa l'OAuth dell'abbonamento ChatGPT/Codex tramite il normale runner PI di OpenClaw.               |
| Runtime nativo Codex app-server                       | `agentRuntime.id: "codex"`            | Esegue il turno agente incorporato tramite l'harness Codex app-server incluso nel bundle.          |
| Adapter ACP Codex                                     | `runtime: "acp"`, `agentId: "codex"`  | Esegue Codex tramite il control plane ACP/acpx esterno. Usalo solo quando ACP/acpx è richiesto esplicitamente. |
| Set di comandi nativi di controllo chat Codex         | `/codex ...`                          | Associa, riprende, guida, arresta e ispeziona thread Codex app-server dalla chat.                  |
| Percorso OpenAI Platform API per modelli in stile GPT/Codex | riferimenti modello `openai/*`        | Usa l'autenticazione con chiave API OpenAI a meno che un override runtime, come `runtime: "codex"`, esegua il turno. |

Queste superfici sono intenzionalmente indipendenti. Abilitare il Plugin `codex` rende
disponibili le funzionalità native app-server; non riscrive
`openai-codex/*` in `openai/*`, non cambia le sessioni esistenti e non
rende ACP il valore predefinito per Codex. Selezionare `openai-codex/*` significa "usa il percorso
provider OAuth Codex" a meno che tu non forzi separatamente un runtime.

La configurazione Codex più comune usa il provider `openai` con il runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Questo significa che OpenClaw seleziona un riferimento di modello OpenAI, poi chiede al
runtime Codex app-server di eseguire il turno agente incorporato. Non significa che il canale, il
catalogo dei provider di modelli o l'archivio sessioni di OpenClaw diventino Codex.

Quando il Plugin `codex` incluso nel bundle è abilitato, il controllo Codex in linguaggio naturale
dovrebbe usare la superficie di comandi nativa `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) invece di ACP. Usa ACP per
Codex solo quando l'utente richiede esplicitamente ACP/acpx o sta testando il
percorso adapter ACP. Claude Code, Gemini CLI, OpenCode, Cursor e harness esterni simili
continuano a usare ACP.

Questo è l'albero decisionale lato agente:

1. Se l'utente chiede **Codex bind/control/thread/resume/steer/stop**, usa la
   superficie di comandi nativa `/codex` quando il Plugin `codex` incluso nel bundle è abilitato.
2. Se l'utente chiede **Codex come runtime incorporato**, usa
   `openai/<model>` con `agentRuntime.id: "codex"`.
3. Se l'utente chiede **autenticazione OAuth/abbonamento Codex sul normale runner OpenClaw
   **, usa `openai-codex/<model>` e lascia il runtime come PI.
4. Se l'utente dice esplicitamente **ACP**, **acpx** o **adapter ACP Codex**, usa
   ACP con `runtime: "acp"` e `agentId: "codex"`.
5. Se la richiesta riguarda **Claude Code, Gemini CLI, OpenCode, Cursor, Droid o
   un altro harness esterno**, usa ACP/acpx, non il runtime nativo sub-agent.

| Intendi...                              | Usa...                                       |
| --------------------------------------- | -------------------------------------------- |
| Controllo chat/thread Codex app-server  | `/codex ...` dal Plugin `codex` incluso nel bundle |
| Runtime agente incorporato Codex app-server | `agentRuntime.id: "codex"`                |
| OAuth OpenAI Codex sul runner PI        | riferimenti modello `openai-codex/*`         |
| Claude Code o altro harness esterno     | ACP/acpx                                     |

Per la suddivisione dei prefissi della famiglia OpenAI, vedi [OpenAI](/it/providers/openai) e
[Provider di modelli](/it/concepts/model-providers). Per il contratto di supporto del runtime
Codex, vedi [Harness Codex](/it/plugins/codex-harness#v1-support-contract).

## Proprietà del runtime

Runtime diversi possiedono porzioni diverse del loop.

| Superficie                  | PI incorporato di OpenClaw               | Codex app-server                                                          |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Proprietario del loop modello | OpenClaw tramite il runner PI incorporato | Codex app-server                                                          |
| Stato canonico del thread   | transcript OpenClaw                      | thread Codex, più mirror del transcript OpenClaw                          |
| Strumenti dinamici OpenClaw | loop nativo degli strumenti OpenClaw     | Collegati tramite l'adapter Codex                                         |
| Strumenti nativi shell e file | percorso PI/OpenClaw                   | Strumenti nativi Codex, collegati tramite hook nativi dove supportato     |
| Motore di contesto          | assemblaggio nativo del contesto OpenClaw | Contesto dei progetti OpenClaw assemblato nel turno Codex                 |
| Compaction                  | OpenClaw o motore di contesto selezionato | Compaction nativo Codex, con notifiche OpenClaw e manutenzione del mirror |
| Consegna sul canale         | OpenClaw                                 | OpenClaw                                                                  |

Questa divisione della proprietà è la principale regola di progettazione:

- Se OpenClaw possiede la superficie, OpenClaw può fornire il normale comportamento degli hook dei Plugin.
- Se il runtime nativo possiede la superficie, OpenClaw ha bisogno di eventi runtime o hook nativi.
- Se il runtime nativo possiede lo stato canonico del thread, OpenClaw dovrebbe rispecchiare e proiettare il contesto, non riscrivere interni non supportati.

## Selezione del runtime

OpenClaw sceglie un runtime incorporato dopo la risoluzione di provider e modello:

1. Il runtime registrato di una sessione ha la precedenza. Le modifiche di configurazione non cambiano a caldo un
   transcript esistente verso un diverso sistema di thread nativo.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza quel runtime per le sessioni nuove o reimpostate.
3. `agents.defaults.agentRuntime.id` o `agents.list[].agentRuntime.id` possono impostare
   `auto`, `pi`, un ID di harness incorporato registrato come `codex`, oppure un
   alias backend CLI supportato come `claude-cli`.
4. In modalità `auto`, i runtime di Plugin registrati possono rivendicare coppie provider/model
   supportate.
5. Se nessun runtime rivendica un turno in modalità `auto` e `fallback: "pi"` è impostato
   (predefinito), OpenClaw usa PI come fallback di compatibilità. Imposta
   `fallback: "none"` per fare in modo che una selezione `auto` senza corrispondenza fallisca.

I runtime espliciti di Plugin falliscono in modo chiuso per impostazione predefinita. Ad esempio,
`runtime: "codex"` significa Codex o un chiaro errore di selezione, a meno che tu non imposti
`fallback: "pi"` nello stesso ambito di override. Un override runtime non eredita
un'impostazione di fallback più ampia, quindi un `runtime: "codex"` a livello di agente non viene instradato silenziosamente
di nuovo a PI solo perché i valori predefiniti usavano `fallback: "pi"`.

Gli alias backend CLI sono diversi dagli ID degli harness incorporati. La forma preferita per
Claude CLI è:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

I riferimenti legacy come `claude-cli/claude-opus-4-7` restano supportati per
compatibilità, ma la nuova configurazione dovrebbe mantenere provider/model canonici e mettere
il backend di esecuzione in `agentRuntime.id`.

La modalità `auto` è intenzionalmente conservativa. I runtime di Plugin possono rivendicare
coppie provider/model che comprendono, ma il Plugin Codex non rivendica il
provider `openai-codex` in modalità `auto`. Questo mantiene
`openai-codex/*` come percorso esplicito OAuth PI Codex ed evita di
spostare silenziosamente le configurazioni con autenticazione tramite abbonamento sull'harness nativo app-server.

Se `openclaw doctor` avverte che il Plugin `codex` è abilitato mentre
`openai-codex/*` continua a passare da PI, trattalo come una diagnosi, non come una
migrazione. Mantieni invariata la configurazione quando ciò che vuoi è PI Codex OAuth.
Passa a `openai/<model>` più `agentRuntime.id: "codex"` solo quando vuoi l'esecuzione nativa
Codex app-server.

## Contratto di compatibilità

Quando un runtime non è PI, dovrebbe documentare quali superfici OpenClaw supporta.
Usa questa forma per la documentazione dei runtime:

| Domanda                               | Perché è importante                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Chi possiede il loop del modello?     | Determina dove avvengono retry, continuazione degli strumenti e decisioni sulla risposta finale. |
| Chi possiede la cronologia canonica del thread? | Determina se OpenClaw può modificare la cronologia o solo rispecchiarla.                |
| Gli strumenti dinamici OpenClaw funzionano? | Messaggistica, sessioni, Cron e strumenti posseduti da OpenClaw dipendono da questo.     |
| Gli hook degli strumenti dinamici funzionano? | I Plugin si aspettano `before_tool_call`, `after_tool_call` e middleware attorno agli strumenti posseduti da OpenClaw. |
| Gli hook degli strumenti nativi funzionano? | Shell, patch e strumenti posseduti dal runtime richiedono supporto nativo agli hook per policy e osservazione. |
| Viene eseguito il ciclo di vita del motore di contesto? | I Plugin di memoria e contesto dipendono dal ciclo di vita assemble, ingest, after-turn e Compaction. |
| Quali dati di Compaction sono esposti? | Alcuni Plugin hanno bisogno solo di notifiche, mentre altri richiedono metadati mantenuti/scartati. |
| Cosa è intenzionalmente non supportato? | Gli utenti non dovrebbero presumere equivalenza con PI dove il runtime nativo possiede più stato. |

Il contratto di supporto del runtime Codex è documentato in
[Harness Codex](/it/plugins/codex-harness#v1-support-contract).

## Etichette di stato

L'output di stato può mostrare sia le etichette `Execution` sia `Runtime`. Interpretale come
diagnostica, non come nomi di provider.

- Un riferimento modello come `openai/gpt-5.5` ti dice provider/modello selezionati.
- Un ID runtime come `codex` ti dice quale loop sta eseguendo il turno.
- Un'etichetta di canale come Telegram o Discord ti dice dove sta avvenendo la conversazione.

Se una sessione continua a mostrare PI dopo aver cambiato la configurazione del runtime, avvia una nuova sessione
con `/new` oppure cancella quella corrente con `/reset`. Le sessioni esistenti mantengono il runtime
registrato così che un transcript non venga riprodotto attraverso due sistemi di sessione nativi incompatibili.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [OpenAI](/it/providers/openai)
- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Loop agente](/it/concepts/agent-loop)
- [Modelli](/it/concepts/models)
- [Status](/it/cli/status)
