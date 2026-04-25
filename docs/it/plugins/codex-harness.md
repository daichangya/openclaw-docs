---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Hai bisogno di esempi di configurazione dell'harness Codex
    - Vuoi che i deployment solo-Codex falliscano invece di usare come fallback PI
summary: Eseguire i turni dell'agente integrato OpenClaw tramite l'harness app-server Codex incluso
title: Harness Codex
x-i18n:
    generated_at: "2026-04-25T13:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

Il Plugin `codex` incluso consente a OpenClaw di eseguire i turni dell'agente integrato tramite
l'app-server Codex invece dell'harness PI integrato.

Usalo quando vuoi che Codex gestisca la sessione agente di basso livello: individuazione del modello,
ripresa nativa del thread, Compaction nativa ed esecuzione app-server.
OpenClaw continua a gestire canali chat, file di sessione, selezione del modello, strumenti,
approvazioni, consegna dei media e il mirror del transcript visibile.

Se stai cercando di orientarti, inizia da
[Runtime degli agenti](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

I turni Codex nativi mantengono gli hook dei Plugin OpenClaw come layer pubblico di compatibilità.
Si tratta di hook OpenClaw in-process, non di hook di comando Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` per i record di transcript mirrorati
- `agent_end`

I Plugin possono anche registrare middleware neutrali rispetto al runtime per il risultato degli strumenti, per riscrivere i risultati dinamici degli strumenti OpenClaw dopo che OpenClaw esegue lo strumento e prima che il risultato venga restituito a Codex. Questo è separato dall'hook pubblico del Plugin `tool_result_persist`, che trasforma le scritture dei risultati degli strumenti nel transcript posseduto da OpenClaw.

Per la semantica degli hook dei Plugin, vedi [Hook dei Plugin](/it/plugins/hooks)
e [Comportamento di guardia dei Plugin](/it/tools/plugin).

L'harness è disattivato per impostazione predefinita. Le nuove configurazioni dovrebbero mantenere i riferimenti ai modelli OpenAI
canonici come `openai/gpt-*` e forzare esplicitamente
`embeddedHarness.runtime: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` quando
vogliono l'esecuzione nativa app-server. I riferimenti legacy ai modelli `codex/*` selezionano ancora automaticamente
l'harness per compatibilità, ma i prefissi provider legacy supportati dal runtime
non vengono mostrati come normali scelte di modello/provider.

## Scegli il prefisso modello corretto

I percorsi della famiglia OpenAI dipendono dal prefisso. Usa `openai-codex/*` quando vuoi
l'OAuth Codex tramite PI; usa `openai/*` quando vuoi accesso diretto all'API OpenAI o
quando stai forzando l'harness app-server Codex nativo:

| Riferimento modello                                  | Percorso runtime                              | Usalo quando                                                             |
| ---------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`                                     | Provider OpenAI tramite pipeline OpenClaw/PI  | Vuoi l'accesso attuale diretto alla Platform API OpenAI con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OAuth OpenAI Codex tramite OpenClaw/PI        | Vuoi l'auth dell'abbonamento ChatGPT/Codex con il runner PI predefinito. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex                      | Vuoi l'esecuzione nativa app-server Codex per il turno dell'agente integrato. |

GPT-5.5 in OpenClaw è attualmente solo subscription/OAuth. Usa
`openai-codex/gpt-5.5` per PI OAuth, oppure `openai/gpt-5.5` con l'harness
app-server Codex. L'accesso diretto via API key per `openai/gpt-5.5` è supportato
quando OpenAI abiliterà GPT-5.5 sulla API pubblica.

I riferimenti legacy `codex/gpt-*` restano accettati come alias di compatibilità. La
migrazione di compatibilità di doctor riscrive i riferimenti runtime primari legacy in riferimenti
canonici al modello e registra separatamente i criteri runtime, mentre i riferimenti legacy solo fallback
restano invariati perché il runtime è configurato per l'intero contenitore agente.
Le nuove configurazioni PI Codex OAuth dovrebbero usare `openai-codex/gpt-*`; le nuove
configurazioni dell'harness app-server nativo dovrebbero usare `openai/gpt-*` più
`embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` segue la stessa divisione per prefisso. Usa
`openai-codex/gpt-*` quando la comprensione delle immagini deve passare tramite il percorso provider OpenAI
Codex OAuth. Usa `codex/gpt-*` quando la comprensione delle immagini deve passare
tramite un turno app-server Codex limitato. Il modello app-server Codex deve
dichiarare supporto per input immagine; i modelli Codex solo testo falliscono prima che inizi
il turno media.

Usa `/status` per confermare l'harness effettivo per la sessione corrente. Se la
selezione è sorprendente, abilita il logging di debug per il sottosistema
`agents/harness` e ispeziona il record strutturato del gateway `agent harness selected`. Include
l'id dell'harness selezionato, il motivo della selezione, i criteri runtime/fallback e,
in modalità `auto`, il risultato di supporto di ogni candidato Plugin.

La selezione dell'harness non è un controllo live della sessione. Quando viene eseguito un turno integrato,
OpenClaw registra l'id dell'harness selezionato su quella sessione e continua a usarlo per
i turni successivi con lo stesso id sessione. Modifica la configurazione `embeddedHarness` o
`OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro harness;
usa `/new` o `/reset` per avviare una nuova sessione prima di passare una conversazione
esistente tra PI e Codex. Questo evita di riprodurre un transcript attraverso
due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin dell'harness vengono trattate come pin PI una volta
che hanno cronologia del transcript. Usa `/new` o `/reset` per far passare quella conversazione a
Codex dopo aver cambiato configurazione.

`/status` mostra il runtime effettivo del modello. L'harness PI predefinito appare come
`Runtime: OpenClaw Pi Default`, e l'harness app-server Codex appare come
`Runtime: OpenAI Codex`.

## Requisiti

- OpenClaw con il Plugin `codex` incluso disponibile.
- Codex app-server `0.118.0` o successivo.
- Auth Codex disponibile per il processo app-server.

Il Plugin blocca handshake di app-server più vecchi o senza versione. Questo mantiene
OpenClaw sulla superficie di protocollo contro cui è stato testato.

Per i test smoke live e Docker, l'auth di solito proviene da `OPENAI_API_KEY`, più
eventuali file CLI Codex come `~/.codex/auth.json` e
`~/.codex/config.toml`. Usa lo stesso materiale auth che usa il tuo app-server Codex locale.

## Configurazione minima

Usa `openai/gpt-5.5`, abilita il Plugin incluso e forza l'harness `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Se la tua configurazione usa `plugins.allow`, includi anche `codex` lì:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Le configurazioni legacy che impostano `agents.defaults.model` o un modello agente su
`codex/<model>` abilitano ancora automaticamente il Plugin `codex` incluso. Le nuove configurazioni dovrebbero
preferire `openai/<model>` più la voce esplicita `embeddedHarness` qui sopra.

## Aggiungi Codex insieme ad altri modelli

Non impostare `runtime: "codex"` globalmente se lo stesso agente deve poter passare liberamente
tra Codex e modelli provider non Codex. Un runtime forzato si applica a ogni
turno integrato per quell'agente o sessione. Se selezioni un modello Anthropic mentre
quel runtime è forzato, OpenClaw prova comunque l'harness Codex e fallisce in modo chiuso
invece di instradare silenziosamente quel turno tramite PI.

Usa invece una di queste forme:

- Metti Codex su un agente dedicato con `embeddedHarness.runtime: "codex"`.
- Mantieni l'agente predefinito su `runtime: "auto"` e fallback PI per il normale uso misto
  di provider.
- Usa i riferimenti legacy `codex/*` solo per compatibilità. Le nuove configurazioni dovrebbero preferire
  `openai/*` più un criterio runtime Codex esplicito.

Ad esempio, questa configurazione mantiene l'agente predefinito sulla normale selezione automatica e
aggiunge un agente Codex separato:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

Con questa forma:

- L'agente predefinito `main` usa il normale percorso provider e il fallback di compatibilità PI.
- L'agente `codex` usa l'harness app-server Codex.
- Se Codex manca o non è supportato per l'agente `codex`, il turno fallisce
  invece di usare silenziosamente PI.

## Deployment solo-Codex

Forza l'harness Codex quando devi dimostrare che ogni turno dell'agente integrato
usa Codex. I runtime Plugin espliciti usano per impostazione predefinita nessun fallback PI, quindi
`fallback: "none"` è facoltativo ma spesso utile come documentazione:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Override tramite ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzato, OpenClaw fallisce subito se il Plugin Codex è disabilitato, se
l'app-server è troppo vecchio o se l'app-server non può avviarsi. Imposta
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo se vuoi intenzionalmente che PI gestisca
la mancata selezione dell'harness.

## Codex per agente

Puoi rendere un agente solo-Codex mentre l'agente predefinito mantiene la normale
selezione automatica:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa i normali comandi di sessione per cambiare agenti e modelli. `/new` crea una nuova
sessione OpenClaw e l'harness Codex crea o riprende il suo thread sidecar app-server
quando necessario. `/reset` cancella il binding della sessione OpenClaw per quel thread
e consente al turno successivo di risolvere di nuovo l'harness dalla configurazione corrente.

## Individuazione del modello

Per impostazione predefinita, il Plugin Codex chiede all'app-server i modelli disponibili. Se
l'individuazione fallisce o va in timeout, usa un catalogo fallback incluso per:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puoi regolare l'individuazione sotto `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Disabilita l'individuazione quando vuoi che l'avvio eviti di fare probe a Codex e resti sul
catalogo fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Connessione e criteri dell'app-server

Per impostazione predefinita, il Plugin avvia Codex localmente con:

```bash
codex app-server --listen stdio://
```

Per impostazione predefinita, OpenClaw avvia le sessioni dell'harness Codex locale in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura trusted dell'operatore locale usata
per Heartbeat autonomi: Codex può usare strumenti shell e di rete senza fermarsi
su prompt di approvazione nativi quando non c'è nessuno a rispondere.

Per scegliere le approvazioni guardian-reviewed di Codex, imposta `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

La modalità Guardian usa il percorso di approvazione nativa con auto-review di Codex. Quando Codex chiede di
uscire dalla sandbox, scrivere fuori dal workspace o aggiungere permessi come l'accesso di rete,
Codex instrada la richiesta di approvazione al reviewer nativo invece che a un prompt umano. Il reviewer applica il framework di rischio di Codex e approva o nega
la richiesta specifica. Usa Guardian quando vuoi più guardrail della modalità YOLO
ma hai comunque bisogno che agenti unattended continuino a fare progressi.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
I singoli campi dei criteri continuano comunque a sovrascrivere `mode`, quindi i deployment avanzati possono combinare
il preset con scelte esplicite. Il valore reviewer più vecchio `guardian_subagent` è
ancora accettato come alias di compatibilità, ma le nuove configurazioni dovrebbero usare
`auto_review`.

Per un app-server già in esecuzione, usa il trasporto WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Campi `appServer` supportati:

| Campo               | Predefinito                              | Significato                                                                                                      |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` genera Codex; `"websocket"` si collega a `url`.                                                        |
| `command`           | `"codex"`                                | Eseguibile per il trasporto stdio.                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio.                                                                                |
| `url`               | non impostato                            | URL WebSocket dell'app-server.                                                                                   |
| `authToken`         | non impostato                            | Token bearer per il trasporto WebSocket.                                                                         |
| `headers`           | `{}`                                     | Header WebSocket extra.                                                                                          |
| `requestTimeoutMs`  | `60000`                                  | Timeout per le chiamate control-plane dell'app-server.                                                           |
| `mode`              | `"yolo"`                                 | Preset per esecuzione YOLO o con approvazioni guardian-reviewed.                                                 |
| `approvalPolicy`    | `"never"`                                | Criteri di approvazione Codex nativi inviati a start/resume/turn del thread.                                     |
| `sandbox`           | `"danger-full-access"`                   | Modalità sandbox Codex nativa inviata a start/resume del thread.                                                 |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` per lasciare a Codex la revisione dei prompt di approvazione nativi. `guardian_subagent` resta un alias legacy. |
| `serviceTier`       | non impostato                            | Tier di servizio facoltativo dell'app-server Codex: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati. |

Le vecchie variabili d'ambiente continuano a funzionare come fallback per test locali quando
il campo di configurazione corrispondente non è impostato:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stata rimossa. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` invece, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferibile per deployment ripetibili perché mantiene il comportamento del Plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Ricette comuni

Codex locale con trasporto stdio predefinito:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validazione harness solo-Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Approvazioni Codex guardian-reviewed:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remoto con header espliciti:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Il cambio modello resta controllato da OpenClaw. Quando una sessione OpenClaw è collegata
a un thread Codex esistente, il turno successivo invia di nuovo il modello
OpenAI attualmente selezionato, il provider, i criteri di approvazione, la sandbox e il service tier a
app-server. Passare da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
binding del thread ma chiede a Codex di continuare con il modello appena selezionato.

## Comando Codex

Il Plugin incluso registra `/codex` come comando slash autorizzato. È
generico e funziona su qualsiasi canale che supporti i comandi testuali OpenClaw.

Forme comuni:

- `/codex status` mostra connettività live dell'app-server, modelli, account, rate limit, server MCP e Skills.
- `/codex models` elenca i modelli live dell'app-server Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di eseguire la Compaction del thread collegato.
- `/codex review` avvia la revisione nativa Codex per il thread collegato.
- `/codex account` mostra stato account e rate limit.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le Skills dell'app-server Codex.

`/codex resume` scrive lo stesso file sidecar di binding che l'harness usa per
i turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il
modello OpenClaw attualmente selezionato in app-server e mantiene abilitata la
cronologia estesa.

La superficie di comando richiede Codex app-server `0.118.0` o successivo. I singoli
metodi di controllo vengono riportati come `unsupported by this Codex app-server` se un
app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Confini degli hook

L'harness Codex ha tre layer di hook:

| Layer                                 | Proprietario             | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Compatibilità prodotto/plugin tra harness PI e Codex.               |
| Middleware di estensione app-server Codex | Plugin inclusi OpenClaw | Comportamento adapter per turno intorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                    | Ciclo di vita Codex di basso livello e criteri degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file `hooks.json` di progetto o globali di Codex per instradare
il comportamento dei Plugin OpenClaw. Per il bridge supportato di strumenti e permessi nativi,
OpenClaw inietta una configurazione Codex per thread per `PreToolUse`, `PostToolUse` e
`PermissionRequest`. Altri hook Codex come `SessionStart`,
`UserPromptSubmit` e `Stop` restano controlli a livello Codex; non sono esposti
come hook dei Plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex ha richiesto la
chiamata, quindi OpenClaw attiva il comportamento di Plugin e middleware che possiede nell'
adapter dell'harness. Per gli strumenti nativi Codex, Codex possiede il record canonico dello strumento.
OpenClaw può mirrorare eventi selezionati, ma non può riscrivere il thread Codex nativo
a meno che Codex non esponga quell'operazione tramite app-server o callback di hook nativi.

Le proiezioni del ciclo di vita di Compaction e LLM provengono da notifiche dell'app-server Codex
e dallo stato dell'adapter OpenClaw, non da comandi di hook nativi Codex.
Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello adapter, non acquisizioni byte-per-byte
della richiesta interna di Codex o del payload di Compaction.

Le notifiche app-server native Codex `hook/started` e `hook/completed` vengono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano hook dei Plugin OpenClaw.

## Contratto di supporto v1

La modalità Codex non è PI con una chiamata a un modello diverso sotto. Codex gestisce di più del
ciclo nativo del modello, e OpenClaw adatta le proprie superfici di plugin e sessione
intorno a quel confine.

Supportato nel runtime Codex v1:

| Superficie                              | Supporto                                | Perché                                                                                                                                      |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Ciclo modello OpenAI tramite Codex      | Supportato                              | L'app-server Codex gestisce il turno OpenAI, la ripresa del thread nativo e la continuazione nativa degli strumenti.                      |
| Instradamento e consegna canali OpenClaw | Supportato                              | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                        |
| Strumenti dinamici OpenClaw             | Supportato                              | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                   |
| Plugin di prompt e contesto             | Supportato                              | OpenClaw costruisce overlay del prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                   |
| Ciclo di vita del motore di contesto    | Supportato                              | Assemble, ingest o manutenzione post-turno e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.    |
| Hook degli strumenti dinamici           | Supportato                              | `before_tool_call`, `after_tool_call` e middleware dei risultati degli strumenti vengono eseguiti intorno agli strumenti dinamici posseduti da OpenClaw. |
| Hook del ciclo di vita                  | Supportato come osservazioni adapter    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` vengono attivati con payload onesti in modalità Codex.  |
| Bloccare o osservare shell e patch native | Supportato tramite il relay di hook nativo | `PreToolUse` e `PostToolUse` di Codex vengono inoltrati per le superfici native degli strumenti impegnate. Il blocco è supportato; la riscrittura degli argomenti no. |
| Criteri nativi dei permessi             | Supportato tramite il relay di hook nativo | `PermissionRequest` di Codex può essere instradato tramite i criteri OpenClaw dove il runtime lo espone.                                 |
| Acquisizione della traiettoria app-server | Supportato                              | OpenClaw registra la richiesta inviata all'app-server e le notifiche dell'app-server che riceve.                                          |

Non supportato nel runtime Codex v1:

| Superficie                                          | Confine v1                                                                                                                                      | Percorso futuro                                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Mutazione degli argomenti degli strumenti nativi    | Gli hook nativi pre-tool di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi Codex.                      | Richiede supporto di hook/schema Codex per sostituire l'input dello strumento.                            |
| Cronologia del transcript nativo Codex modificabile | Codex possiede la cronologia canonica del thread nativo. OpenClaw possiede un mirror e può proiettare il contesto futuro, ma non dovrebbe mutare interni non supportati. | Aggiungere API esplicite dell'app-server Codex se è necessaria la chirurgia del thread nativo.            |
| `tool_result_persist` per record di strumenti nativi Codex | Questo hook trasforma scritture di transcript possedute da OpenClaw, non record di strumenti nativi Codex.                                    | Potrebbe mirrorare record trasformati, ma la riscrittura canonica richiede supporto Codex.               |
| Metadati ricchi di Compaction nativa                | OpenClaw osserva l'inizio e il completamento della Compaction, ma non riceve un elenco stabile di elementi mantenuti/scartati, delta token o payload di riepilogo. | Richiede eventi di Compaction Codex più ricchi.                                                           |
| Intervento sulla Compaction                         | Gli hook attuali di Compaction OpenClaw sono a livello di notifica in modalità Codex.                                                          | Aggiungere hook Codex pre/post Compaction se i Plugin devono poter bloccare o riscrivere la Compaction nativa. |
| Stop o gating della risposta finale                 | Codex ha hook di stop nativi, ma OpenClaw non espone il gating della risposta finale come contratto Plugin v1.                                 | Futuro primitivo opt-in con salvaguardie di loop e timeout.                                               |
| Parità degli hook MCP nativi come superficie v1 impegnata | Il relay è generico, ma OpenClaw non ha ancora versionato e testato end-to-end il comportamento degli hook MCP nativi pre/post.              | Aggiungere test e documentazione per il relay MCP OpenClaw una volta che il floor del protocollo app-server supportato coprirà quei payload. |
| Acquisizione byte-per-byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche dell'app-server, ma il core Codex costruisce internamente la richiesta finale alla API OpenAI.   | Richiede un evento di tracing della richiesta del modello Codex o una API di debug.                       |

## Strumenti, media e Compaction

L'harness Codex cambia solo l'esecutore di basso livello dell'agente integrato.

OpenClaw continua a costruire la lista degli strumenti e a ricevere i risultati degli strumenti dinamici dall'
harness. Testo, immagini, video, musica, TTS, approvazioni e output dello
strumento di messaggistica continuano a passare tramite il normale percorso di consegna OpenClaw.

Il relay di hook nativi è intenzionalmente generico, ma il contratto di supporto v1 è
limitato ai percorsi di strumenti e permessi nativi Codex che OpenClaw testa. Non
dare per scontato che ogni futuro evento di hook Codex sia una superficie Plugin OpenClaw finché il
contratto runtime non la nomina.

Le elicitazioni di approvazione degli strumenti MCP Codex vengono instradate tramite il flusso di
approvazione Plugin di OpenClaw quando Codex contrassegna `_meta.codex_approval_kind` come
`"mcp_tool_call"`. I prompt Codex `request_user_input` vengono reinviati alla
chat di origine, e il successivo messaggio di follow-up in coda risponde a quella richiesta
nativa del server invece di essere indirizzato come contesto aggiuntivo. Le altre richieste di elicitation MCP continuano a fallire in modo chiuso.

Quando il modello selezionato usa l'harness Codex, la Compaction del thread nativo viene
delegata all'app-server Codex. OpenClaw mantiene un mirror del transcript per la cronologia del canale,
la ricerca, `/new`, `/reset` e futuri cambi di modello o harness. Il
mirror include il prompt utente, il testo finale dell'assistente e leggeri record di
reasoning o piano di Codex quando l'app-server li emette. Oggi, OpenClaw registra solo i segnali nativi di inizio e completamento della Compaction. Non espone ancora un
riepilogo leggibile della Compaction né un elenco verificabile degli elementi che Codex
ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non
riscrive i record dei risultati degli strumenti nativi Codex. Si applica solo quando
OpenClaw sta scrivendo un risultato di strumento nel transcript di sessione posseduto da OpenClaw.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e comprensione
dei media continuano a usare le impostazioni provider/modello corrispondenti come
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** è il comportamento atteso per
le nuove configurazioni. Seleziona un modello `openai/gpt-*` con
`embeddedHarness.runtime: "codex"` (o un riferimento legacy `codex/*`), abilita
`plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude
`codex`.

**OpenClaw usa PI invece di Codex:** `runtime: "auto"` può ancora usare PI come backend
di compatibilità quando nessun harness Codex reclama l'esecuzione. Imposta
`embeddedHarness.runtime: "codex"` per forzare la selezione di Codex durante i test. Un
runtime Codex forzato ora fallisce invece di usare come fallback PI a meno che tu non
imposti esplicitamente `embeddedHarness.fallback: "pi"`. Una volta che l'app-server Codex è
selezionato, i suoi errori emergono direttamente senza configurazione aggiuntiva di fallback.

**L'app-server viene rifiutato:** aggiorna Codex affinché l'handshake dell'app-server
riporti la versione `0.118.0` o successiva.

**L'individuazione del modello è lenta:** riduci `plugins.entries.codex.config.discovery.timeoutMs`
oppure disabilita l'individuazione.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`
e che l'app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non Codex usa PI:** è il comportamento atteso a meno che tu non abbia forzato
`embeddedHarness.runtime: "codex"` per quell'agente o selezionato un riferimento legacy
`codex/*`. I normali riferimenti `openai/gpt-*` e quelli di altri provider restano sul loro normale
percorso provider in modalità `auto`. Se forzi `runtime: "codex"`, ogni turno integrato
per quell'agente deve essere un modello OpenAI supportato da Codex.

## Correlati

- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Status](/it/cli/status)
- [Hook dei Plugin](/it/plugins/hooks)
- [Riferimento della configurazione](/it/gateway/configuration-reference)
- [Testing](/it/help/testing-live#live-codex-app-server-harness-smoke)
