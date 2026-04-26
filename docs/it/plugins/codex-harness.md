---
read_when:
    - Vuoi usare l’harness app-server Codex incluso
    - Ti servono esempi di configurazione dell’harness Codex
    - Vuoi che i deployment solo-Codex falliscano invece di ripiegare su PI
summary: Esegui i turni dell’agente incorporato di OpenClaw tramite l’harness app-server Codex incluso
title: Harness Codex
x-i18n:
    generated_at: "2026-04-26T11:34:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

Il Plugin `codex` incluso permette a OpenClaw di eseguire i turni dell’agente incorporato tramite l’app-server Codex invece che tramite l’harness PI integrato.

Usalo quando vuoi che Codex gestisca la sessione agente a basso livello: rilevamento dei modelli, resume nativo del thread, Compaction nativa ed esecuzione dell’app-server.
OpenClaw continua a gestire canali chat, file di sessione, selezione del modello, strumenti,
approvazioni, recapito multimediale e il mirror visibile della trascrizione.

Se stai cercando di orientarti, inizia da
[Agent runtimes](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il model ref, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Cosa cambia questo Plugin

Il Plugin `codex` incluso aggiunge diverse capability separate:

| Capability                        | Come si usa                                      | Cosa fa                                                                    |
| --------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Runtime incorporato nativo        | `agentRuntime.id: "codex"`                       | Esegue i turni dell’agente incorporato di OpenClaw tramite l’app-server Codex. |
| Comandi nativi di controllo chat  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Associa e controlla i thread dell’app-server Codex da una conversazione di messaggistica. |
| Provider/catalogo app-server Codex | interni `codex`, esposti tramite l’harness      | Permette al runtime di rilevare e validare i modelli dell’app-server.      |
| Percorso di comprensione media Codex | percorsi di compatibilità del modello immagine `codex/*` | Esegue turni limitati dell’app-server Codex per modelli supportati di comprensione immagini. |
| Relay di hook nativo              | Hook Plugin attorno a eventi nativi Codex        | Permette a OpenClaw di osservare/bloccare eventi supportati nativi di tool/finalizzazione Codex. |

Abilitare il Plugin rende disponibili queste capability. **Non**:

- inizia a usare Codex per ogni modello OpenAI
- converte i model ref `openai-codex/*` nel runtime nativo
- rende ACP/acpx il percorso Codex predefinito
- cambia a caldo le sessioni esistenti che hanno già registrato un runtime PI
- sostituisce il recapito dei canali OpenClaw, i file di sessione, l’archiviazione dei profili auth o
  il routing dei messaggi

Lo stesso Plugin gestisce anche la superficie nativa dei comandi di controllo chat `/codex`. Se
il Plugin è abilitato e l’utente chiede di associare, riprendere, dirigere, fermare o ispezionare
thread Codex dalla chat, gli agenti dovrebbero preferire `/codex ...` rispetto ad ACP. ACP resta
il fallback esplicito quando l’utente chiede ACP/acpx o sta testando l’adattatore ACP
Codex.

I turni nativi Codex mantengono gli hook Plugin di OpenClaw come livello di compatibilità pubblico.
Questi sono hook OpenClaw in-process, non hook di comandi Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` per i record mirrorizzati della trascrizione
- `before_agent_finalize` tramite relay Codex `Stop`
- `agent_end`

I Plugin possono anche registrare middleware neutrali rispetto al runtime per il risultato degli strumenti, per riscrivere
i risultati degli strumenti dinamici di OpenClaw dopo che OpenClaw ha eseguito lo strumento e prima che il
risultato venga restituito a Codex. Questo è separato dall’hook pubblico del Plugin
`tool_result_persist`, che trasforma le scritture dei risultati degli strumenti nella trascrizione
di proprietà di OpenClaw.

Per la semantica degli hook Plugin in sé, consulta [Plugin hooks](/it/plugins/hooks)
e [Plugin guard behavior](/it/tools/plugin).

L’harness è disattivato per impostazione predefinita. Le nuove config dovrebbero mantenere i model ref OpenAI
canonici come `openai/gpt-*` e forzare esplicitamente
`agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` quando
vogliono l’esecuzione nativa dell’app-server. I model ref legacy `codex/*` selezionano ancora automaticamente
l’harness per compatibilità, ma i prefissi provider legacy supportati da runtime
non vengono mostrati come normali scelte di modello/provider.

Se il Plugin `codex` è abilitato ma il modello primario è ancora
`openai-codex/*`, `openclaw doctor` avvisa invece di cambiare il percorso. È
intenzionale: `openai-codex/*` resta il percorso PI Codex OAuth/abbonamento, e
l’esecuzione nativa dell’app-server resta una scelta runtime esplicita.

## Mappa dei percorsi

Usa questa tabella prima di cambiare la config:

| Comportamento desiderato                     | Model ref                  | Config runtime                           | Requisito Plugin             | Etichetta di stato attesa      |
| -------------------------------------------- | -------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------ |
| API OpenAI tramite il normale runner OpenClaw | `openai/gpt-*`            | omesso o `runtime: "pi"`                 | Provider OpenAI              | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/abbonamento tramite PI           | `openai-codex/gpt-*`       | omesso o `runtime: "pi"`                 | Provider OpenAI Codex OAuth  | `Runtime: OpenClaw Pi Default` |
| Turni incorporati nativi dell’app-server Codex | `openai/gpt-*`           | `agentRuntime.id: "codex"`               | Plugin `codex`               | `Runtime: OpenAI Codex`        |
| Provider misti con modalità auto conservativa | ref specifici del provider | `agentRuntime.id: "auto"`                | Runtime Plugin facoltativi   | Dipende dal runtime selezionato |
| Sessione esplicita con adattatore ACP Codex  | dipende da prompt/modello ACP | `sessions_spawn` con `runtime: "acp"` | backend `acpx` sano          | stato attività/sessione ACP    |

La separazione importante è tra provider e runtime:

- `openai-codex/*` risponde a "quale percorso provider/auth dovrebbe usare PI?"
- `agentRuntime.id: "codex"` risponde a "quale loop dovrebbe eseguire questo
  turno incorporato?"
- `/codex ...` risponde a "quale conversazione Codex nativa dovrebbe essere associata
  o controllata da questa chat?"
- ACP risponde a "quale processo harness esterno dovrebbe avviare acpx?"

## Scegli il prefisso modello corretto

I percorsi della famiglia OpenAI sono specifici per prefisso. Usa `openai-codex/*` quando vuoi
Codex OAuth tramite PI; usa `openai/*` quando vuoi accesso diretto all’API OpenAI oppure
quando stai forzando l’harness nativo dell’app-server Codex:

| Model ref                                     | Percorso runtime                              | Usalo quando                                                              |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provider OpenAI tramite plumbing OpenClaw/PI  | Vuoi l’accesso attuale diretto all’API OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth tramite OpenClaw/PI        | Vuoi auth con abbonamento ChatGPT/Codex con il runner PI predefinito.    |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                      | Vuoi l’esecuzione nativa dell’app-server Codex per il turno agente incorporato. |

GPT-5.5 in OpenClaw è attualmente solo abbonamento/OAuth. Usa
`openai-codex/gpt-5.5` per PI OAuth, oppure `openai/gpt-5.5` con l’harness
app-server Codex. L’accesso diretto con chiave API per `openai/gpt-5.5` è supportato
una volta che OpenAI abilita GPT-5.5 sull’API pubblica.

I ref legacy `codex/gpt-*` restano accettati come alias di compatibilità. La migrazione di compatibilità
di Doctor riscrive i ref runtime primari legacy in model ref canonici
e registra la policy runtime separatamente, mentre i ref legacy solo-fallback
restano invariati perché il runtime è configurato per l’intero contenitore dell’agente.
Le nuove config PI Codex OAuth dovrebbero usare `openai-codex/gpt-*`; le nuove config native
con harness app-server dovrebbero usare `openai/gpt-*` più
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue la stessa separazione dei prefissi. Usa
`openai-codex/gpt-*` quando la comprensione delle immagini deve passare attraverso il percorso provider OpenAI
Codex OAuth. Usa `codex/gpt-*` quando la comprensione delle immagini deve passare
attraverso un turno limitato dell’app-server Codex. Il modello dell’app-server Codex deve
pubblicizzare il supporto all’input immagine; i modelli Codex solo testo falliscono prima che inizi il
turno multimediale.

Usa `/status` per confermare l’harness effettivo per la sessione corrente. Se la
selezione è sorprendente, abilita il logging di debug per il sottosistema `agents/harness`
e ispeziona il record strutturato del gateway `agent harness selected`. Include
l’id dell’harness selezionato, il motivo della selezione, la policy runtime/fallback e,
in modalità `auto`, il risultato del supporto di ogni candidato Plugin.

### Cosa significano gli avvisi di Doctor

`openclaw doctor` avvisa quando tutte queste condizioni sono vere:

- il Plugin `codex` incluso è abilitato o consentito
- il modello primario di un agente è `openai-codex/*`
- il runtime effettivo di quell’agente non è `codex`

Questo avviso esiste perché gli utenti spesso si aspettano che "Plugin Codex abilitato" implichi
"runtime nativo dell’app-server Codex". OpenClaw non fa questo salto. L’avviso
significa:

- **Nessuna modifica è richiesta** se volevi ChatGPT/Codex OAuth tramite PI.
- Cambia il modello in `openai/<model>` e imposta
  `agentRuntime.id: "codex"` se volevi l’esecuzione nativa
  dell’app-server.
- Le sessioni esistenti richiedono comunque `/new` o `/reset` dopo un cambio
  runtime, perché i pin runtime di sessione sono sticky.

La selezione dell’harness non è un controllo live della sessione. Quando viene eseguito un turno incorporato,
OpenClaw registra l’id dell’harness selezionato su quella sessione e continua a usarlo per
i turni successivi nello stesso id di sessione. Cambia la config `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro harness;
usa `/new` o `/reset` per avviare una sessione nuova prima di passare una conversazione esistente tra PI e Codex. Questo evita di riprodurre una singola trascrizione attraverso due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin harness vengono trattate come pin PI una volta che
hanno cronologia di trascrizione. Usa `/new` o `/reset` per far adottare Codex a quella conversazione dopo aver cambiato la config.

`/status` mostra il runtime effettivo del modello. L’harness PI predefinito appare come
`Runtime: OpenClaw Pi Default`, e l’harness app-server Codex appare come
`Runtime: OpenAI Codex`.

## Requisiti

- OpenClaw con il Plugin `codex` incluso disponibile.
- App-server Codex `0.125.0` o più recente. Il Plugin incluso gestisce per impostazione predefinita
  un binario app-server Codex compatibile, quindi i comandi `codex` locali su `PATH`
  non influenzano il normale avvio dell’harness.
- Auth Codex disponibile per il processo app-server.

Il Plugin blocca handshake app-server più vecchi o privi di versione. Così
OpenClaw resta sulla superficie di protocollo contro cui è stato testato.

Per test smoke live e Docker, l’auth di solito arriva da `OPENAI_API_KEY`, più
eventuali file facoltativi della CLI Codex come `~/.codex/auth.json` e
`~/.codex/config.toml`. Usa lo stesso materiale auth usato dal tuo app-server Codex locale.

## Config minima

Usa `openai/gpt-5.5`, abilita il Plugin incluso e forza l’harness `codex`:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Se la tua config usa `plugins.allow`, includi anche `codex` lì:

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

Le config legacy che impostano `agents.defaults.model` o un modello agente a
`codex/<model>` continuano ad abilitare automaticamente il Plugin `codex` incluso. Le nuove config dovrebbero
preferire `openai/<model>` più la voce esplicita `agentRuntime` qui sopra.

## Aggiungere Codex insieme ad altri modelli

Non impostare `agentRuntime.id: "codex"` globalmente se lo stesso agente deve passare liberamente
tra Codex e modelli provider non Codex. Un runtime forzato si applica a ogni
turno incorporato per quell’agente o sessione. Se selezioni un modello Anthropic mentre
quel runtime è forzato, OpenClaw prova comunque l’harness Codex e fallisce in modalità chiusa
invece di instradare silenziosamente quel turno tramite PI.

Usa invece una di queste forme:

- Metti Codex su un agente dedicato con `agentRuntime.id: "codex"`.
- Mantieni l’agente predefinito su `agentRuntime.id: "auto"` e fallback PI per il normale utilizzo misto
  dei provider.
- Usa i ref legacy `codex/*` solo per compatibilità. Le nuove config dovrebbero preferire
  `openai/*` più una policy runtime Codex esplicita.

Ad esempio, questa configurazione mantiene l’agente predefinito sulla normale selezione automatica e
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
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Con questa forma:

- L’agente predefinito `main` usa il normale percorso provider e il fallback di compatibilità PI.
- L’agente `codex` usa l’harness app-server Codex.
- Se Codex manca o non è supportato per l’agente `codex`, il turno fallisce
  invece di usare silenziosamente PI.

## Routing dei comandi dell’agente

Gli agenti dovrebbero instradare le richieste utente in base all’intento, non solo alla parola "Codex":

| L’utente chiede...                                     | L’agente dovrebbe usare...                      |
| ------------------------------------------------------ | ----------------------------------------------- |
| "Associa questa chat a Codex"                          | `/codex bind`                                   |
| "Riprendi qui il thread Codex `<id>`"                  | `/codex resume <id>`                            |
| "Mostra i thread Codex"                                | `/codex threads`                                |
| "Usa Codex come runtime per questo agente"             | modifica della config a `agentRuntime.id`       |
| "Usa il mio abbonamento ChatGPT/Codex con il normale OpenClaw" | model ref `openai-codex/*`           |
| "Esegui Codex tramite ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`   |
| "Avvia Claude Code/Gemini/OpenCode/Cursor in un thread" | ACP/acpx, non `/codex` e non sottoagenti nativi |

OpenClaw pubblicizza la guida allo spawn ACP agli agenti solo quando ACP è abilitato,
dispatchable e supportato da un backend runtime caricato. Se ACP non è disponibile,
il system prompt e le Skills Plugin non dovrebbero insegnare all’agente il routing
ACP.

## Deployment solo-Codex

Forza l’harness Codex quando devi dimostrare che ogni turno dell’agente incorporato
usa Codex. I runtime Plugin espliciti usano per impostazione predefinita nessun fallback PI, quindi
`fallback: "none"` è facoltativo ma spesso utile come documentazione:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
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

Con Codex forzato, OpenClaw fallisce presto se il Plugin Codex è disabilitato, se
l’app-server è troppo vecchio o se l’app-server non riesce ad avviarsi. Imposta
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo se vuoi intenzionalmente che PI gestisca
la selezione di harness mancante.

## Codex per agente

Puoi rendere un agente solo-Codex mentre l’agente predefinito mantiene la normale
selezione automatica:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa i normali comandi di sessione per cambiare agenti e modelli. `/new` crea una
nuova sessione OpenClaw e l’harness Codex crea o riprende il proprio thread sidecar app-server
secondo necessità. `/reset` cancella l’associazione della sessione OpenClaw per quel thread
e permette al turno successivo di risolvere di nuovo l’harness dalla config corrente.

## Rilevamento dei modelli

Per impostazione predefinita, il Plugin Codex chiede all’app-server i modelli disponibili. Se
il rilevamento fallisce o va in timeout, usa un catalogo di fallback incluso per:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puoi regolare il rilevamento sotto `plugins.entries.codex.config.discovery`:

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

Disabilita il rilevamento quando vuoi che l’avvio eviti di interrogare Codex e resti sul
catalogo di fallback:

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

## Connessione e policy dell’app-server

Per impostazione predefinita, il Plugin avvia localmente il binario Codex gestito da OpenClaw con:

```bash
codex app-server --listen stdio://
```

Il binario gestito è dichiarato come dipendenza runtime del Plugin incluso e viene preparato
insieme al resto delle dipendenze del Plugin `codex`. Così la versione dell’app-server
resta legata al Plugin incluso invece che a qualsiasi CLI Codex separata
eventualmente installata in locale. Imposta `appServer.command` solo quando
vuoi intenzionalmente eseguire un altro eseguibile.

Per impostazione predefinita, OpenClaw avvia le sessioni locali dell’harness Codex in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura dell’operatore locale attendibile usata
per heartbeat autonomi: Codex può usare shell e strumenti di rete senza
fermarsi su prompt di approvazione nativi che nessuno è presente per rispondere.

Per eseguire l’opt-in alle approvazioni revisionate dal guardian di Codex, imposta `appServer.mode:
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

La modalità Guardian usa il percorso di approvazione auto-review nativo di Codex. Quando Codex chiede di
uscire dalla sandbox, scrivere fuori dal workspace o aggiungere permessi come l’accesso di rete,
Codex instrada quella richiesta di approvazione al revisore nativo invece che a
un prompt umano. Il revisore applica il framework di rischio di Codex e approva o nega
la richiesta specifica. Usa Guardian quando vuoi più guardrail della modalità YOLO
ma hai comunque bisogno che agenti non presidiati continuino a progredire.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
I singoli campi di policy fanno comunque override di `mode`, quindi i deployment avanzati possono combinare
il preset con scelte esplicite. Il vecchio valore reviewer `guardian_subagent` è
ancora accettato come alias di compatibilità, ma le nuove config dovrebbero usare
`auto_review`.

Per un app-server già in esecuzione, usa il transport WebSocket:

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

| Campo               | Predefinito                               | Significato                                                                                                   |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                     |
| `command`           | binario Codex gestito                     | Eseguibile per il transport stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per un override esplicito. |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Argomenti per il transport stdio.                                                                             |
| `url`               | non impostato                             | URL WebSocket dell’app-server.                                                                                |
| `authToken`         | non impostato                             | Bearer token per il transport WebSocket.                                                                      |
| `headers`           | `{}`                                      | Header WebSocket extra.                                                                                       |
| `requestTimeoutMs`  | `60000`                                   | Timeout per le chiamate control-plane dell’app-server.                                                        |
| `mode`              | `"yolo"`                                  | Preset per esecuzione YOLO o con approvazioni revisionate da guardian.                                       |
| `approvalPolicy`    | `"never"`                                 | Policy di approvazione nativa Codex inviata a start/resume/turn del thread.                                  |
| `sandbox`           | `"danger-full-access"`                    | Modalità sandbox nativa Codex inviata a start/resume.                                                         |
| `approvalsReviewer` | `"user"`                                  | Usa `"auto_review"` per lasciare a Codex la revisione dei prompt di approvazione nativi. `guardian_subagent` resta un alias legacy. |
| `serviceTier`       | non impostato                             | Tier di servizio facoltativo dell’app-server Codex: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati. |

Restano disponibili override tramite ambiente per test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` aggira il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La config è
preferita per deployment ripetibili perché mantiene il comportamento del Plugin nello
stesso file revisionato del resto della configurazione dell’harness Codex.

## Ricette comuni

Codex locale con transport stdio predefinito:

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

Validazione dell’harness solo-Codex:

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
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Approvazioni Codex revisionate da Guardian:

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

Il cambio di modello resta controllato da OpenClaw. Quando una sessione OpenClaw è collegata
a un thread Codex esistente, il turno successivo invia di nuovo all’app-server il
modello OpenAI attualmente selezionato, il provider, la policy di approvazione, la
sandbox e il service tier.
Passare da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
binding del thread ma chiede a Codex di continuare con il modello appena selezionato.

## Comando Codex

Il Plugin incluso registra `/codex` come slash command autorizzato. È
generico e funziona su qualsiasi canale che supporta i comandi testuali OpenClaw.

Forme comuni:

- `/codex status` mostra connettività live dell’app-server, modelli, account, rate limit, server MCP e Skills.
- `/codex models` elenca i modelli live dell’app-server Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede all’app-server Codex di eseguire Compaction del thread collegato.
- `/codex review` avvia la review nativa Codex per il thread collegato.
- `/codex account` mostra lo stato dell’account e dei rate limit.
- `/codex mcp` elenca lo stato dei server MCP dell’app-server Codex.
- `/codex skills` elenca le Skills dell’app-server Codex.

`/codex resume` scrive lo stesso file di binding sidecar che l’harness usa per i
turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il
modello OpenClaw attualmente selezionato nell’app-server e mantiene abilitata la
cronologia estesa.

La superficie dei comandi richiede app-server Codex `0.125.0` o più recente. I singoli
metodi di controllo vengono riportati come `unsupported by this Codex app-server` se un
app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Confini degli hook

L’harness Codex ha tre livelli di hook:

| Livello                               | Proprietario              | Scopo                                                               |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                  | Compatibilità prodotto/Plugin tra harness PI e Codex.               |
| Middleware di estensione app-server Codex | Plugin inclusi OpenClaw | Comportamento adattatore per turno attorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                     | Ciclo di vita Codex a basso livello e policy sugli strumenti nativi dalla config Codex. |

OpenClaw non usa file `hooks.json` Codex di progetto o globali per instradare
il comportamento dei Plugin OpenClaw. Per il bridge supportato di strumenti nativi e permessi,
OpenClaw inietta config Codex per thread per `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Altri hook Codex come `SessionStart` e
`UserPromptSubmit` restano controlli a livello Codex; non sono esposti come
hook Plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex ha chiesto la
chiamata, quindi OpenClaw attiva il comportamento Plugin e middleware che possiede nell’
adattatore harness. Per gli strumenti nativi Codex, Codex possiede il record canonico dello strumento.
OpenClaw può rispecchiare eventi selezionati, ma non può riscrivere il thread
Codex nativo a meno che Codex non esponga quell’operazione tramite app-server o callback
di hook nativi.

Le proiezioni di Compaction e del ciclo di vita LLM arrivano da notifiche dell’app-server Codex
e dallo stato dell’adattatore OpenClaw, non da comandi di hook nativi Codex.
Gli eventi OpenClaw `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` sono osservazioni a livello adattatore, non catture byte-per-byte
della richiesta interna o del payload di Compaction di Codex.

Le notifiche native dell’app-server Codex `hook/started` e `hook/completed` sono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debugging.
Non invocano gli hook Plugin OpenClaw.

## Contratto di supporto V1

La modalità Codex non è PI con una diversa chiamata al modello sotto il cofano. Codex gestisce di più del
loop nativo del modello, e OpenClaw adatta le proprie superfici Plugin e sessione
attorno a quel confine.

Supportato nel runtime Codex v1:

| Superficie                                    | Supporto                                | Perché                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop modello OpenAI tramite Codex             | Supportato                              | L’app-server Codex gestisce il turno OpenAI, il resume nativo del thread e la continuazione nativa degli strumenti.                                                                                    |
| Routing e recapito dei canali OpenClaw        | Supportato                              | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                      |
| Strumenti dinamici OpenClaw                   | Supportato                              | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                                 |
| Plugin di prompt e contesto                   | Supportato                              | OpenClaw costruisce overlay di prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                                   |
| Ciclo di vita del motore di contesto          | Supportato                              | Assemble, ingest o manutenzione after-turn e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.                                                                  |
| Hook degli strumenti dinamici                 | Supportato                              | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti girano attorno agli strumenti dinamici di proprietà di OpenClaw.                                                   |
| Hook del ciclo di vita                        | Supportati come osservazioni dell’adattatore | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` si attivano con payload onesti in modalità Codex.                                                                  |
| Gate di revisione della risposta finale       | Supportato tramite il relay di hook nativo | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un altro passaggio del modello prima della finalizzazione.                                                           |
| Bloccare o osservare shell, patch e MCP nativi | Supportato tramite il relay di hook nativo | `PreToolUse` e `PostToolUse` di Codex vengono inoltrati per superfici native di strumenti consolidate, inclusi i payload MCP su app-server Codex `0.125.0` o più recente. Il blocco è supportato; la riscrittura degli argomenti no. |
| Policy sui permessi nativi                    | Supportata tramite il relay di hook nativo | `PermissionRequest` di Codex può essere instradato tramite la policy OpenClaw dove il runtime la espone. Se OpenClaw non restituisce alcuna decisione, Codex continua tramite il normale percorso di approvazione guardian o utente. |
| Acquisizione della traiettoria dell’app-server | Supportata                             | OpenClaw registra la richiesta inviata all’app-server e le notifiche dell’app-server che riceve.                                                                                                        |

Non supportato nel runtime Codex v1:

| Superficie                                           | Confine V1                                                                                                                                      | Percorso futuro                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Mutazione degli argomenti degli strumenti nativi     | Gli hook nativi pre-tool di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi Codex.                        | Richiede supporto Codex di hook/schema per sostituire l’input degli strumenti.             |
| Cronologia del transcript nativo Codex modificabile  | Codex possiede la cronologia canonica del thread nativo. OpenClaw possiede un mirror e può proiettare il contesto futuro, ma non dovrebbe modificare interni non supportati. | Aggiungere API esplicite dell’app-server Codex se serve chirurgia sul thread nativo. |
| `tool_result_persist` per record di strumenti nativi Codex | Quell’hook trasforma scritture di trascrizione di proprietà di OpenClaw, non record di strumenti nativi Codex.                          | Potrebbe rispecchiare record trasformati, ma la riscrittura canonica richiede supporto Codex. |
| Metadati ricchi di Compaction nativa                 | OpenClaw osserva inizio e completamento della Compaction, ma non riceve una lista stabile kept/dropped, delta di token o payload di riepilogo. | Richiede eventi di Compaction Codex più ricchi.                                            |
| Intervento sulla Compaction                          | Gli attuali hook OpenClaw di Compaction sono a livello di notifica in modalità Codex.                                                           | Aggiungere hook Codex pre/post Compaction se i Plugin devono poter bloccare o riscrivere la Compaction nativa. |
| Acquisizione byte-per-byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche dell’app-server, ma il core Codex costruisce internamente la richiesta finale all’API OpenAI. | Richiede un evento di tracing della richiesta del modello Codex o una API di debug.        |

## Strumenti, media e Compaction

L’harness Codex cambia solo l’esecutore a basso livello dell’agente incorporato.

OpenClaw continua a costruire la lista degli strumenti e riceve i risultati degli strumenti dinamici dall’
harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica
continuano a passare attraverso il normale percorso di recapito OpenClaw.

Il relay di hook nativo è intenzionalmente generico, ma il contratto di supporto v1 è
limitato ai percorsi di strumenti nativi e permessi Codex che OpenClaw testa. In
questo runtime Codex, ciò include payload `PreToolUse`,
`PostToolUse` e `PermissionRequest` per shell, patch e MCP. Non presumere che ogni futuro
evento di hook Codex sia una superficie Plugin OpenClaw finché il contratto runtime non lo
nomina.

Per `PermissionRequest`, OpenClaw restituisce decisioni esplicite di allow o deny
solo quando decide la policy. Un risultato senza decisione non è un allow. Codex lo tratta come nessuna
decisione dell’hook e ricade nel proprio percorso di approvazione guardian o utente.

Le elicitazioni di approvazione degli strumenti MCP Codex vengono instradate tramite il flusso di approvazione
dei Plugin OpenClaw quando Codex contrassegna `_meta.codex_approval_kind` come
`"mcp_tool_call"`. I prompt Codex `request_user_input` vengono rimandati alla chat
di origine e il messaggio successivo in coda risponde a quella richiesta nativa del server
invece di essere diretto come contesto extra. Le altre richieste di elicitation MCP continuano a fallire in modalità chiusa.

Quando il modello selezionato usa l’harness Codex, la Compaction nativa del thread viene
delegata all’app-server Codex. OpenClaw mantiene un mirror della trascrizione per la
cronologia del canale, la ricerca, `/new`, `/reset` e i futuri cambi di modello o
harness. Il mirror include il prompt utente, il testo finale dell’assistente e record leggeri
di reasoning o piano Codex quando l’app-server li emette. Oggi, OpenClaw registra solo i
segnali di inizio e completamento della Compaction nativa. Non espone ancora un
riepilogo di Compaction leggibile da umani né un elenco verificabile di quali voci Codex
ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` al momento non
riscrive i record dei risultati degli strumenti nativi Codex. Si applica solo quando
OpenClaw sta scrivendo un risultato di strumento nella trascrizione di sessione di proprietà di OpenClaw.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e
comprensione media continuano a usare le impostazioni provider/modello corrispondenti come
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** è previsto per le
nuove config. Seleziona un modello `openai/gpt-*` con
`agentRuntime.id: "codex"` (oppure un ref legacy `codex/*`), abilita
`plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude
`codex`.

**OpenClaw usa PI invece di Codex:** `agentRuntime.id: "auto"` può ancora usare PI come
backend di compatibilità quando nessun harness Codex reclama l’esecuzione. Imposta
`agentRuntime.id: "codex"` per forzare la selezione di Codex durante i test. Un
runtime Codex forzato ora fallisce invece di ripiegare su PI, a meno che tu
non imposti esplicitamente `agentRuntime.fallback: "pi"`. Una volta che viene
selezionato l’app-server Codex, i suoi errori emergono direttamente senza ulteriore config di fallback.

**L’app-server viene rifiutato:** aggiorna Codex in modo che l’handshake dell’app-server
riporti la versione `0.125.0` o successiva. Le prerelease della stessa versione o le
versioni con suffisso di build come `0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché la soglia stabile del protocollo `0.125.0` è quella che OpenClaw testa.

**Il rilevamento del modello è lento:** abbassa `plugins.entries.codex.config.discovery.timeoutMs`
oppure disabilita il rilevamento.

**Il transport WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`
e che l’app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non Codex usa PI:** è previsto a meno che tu non abbia forzato
`agentRuntime.id: "codex"` per quell’agente oppure selezionato un ref
legacy `codex/*`. I semplici ref `openai/gpt-*` e gli altri ref provider restano sul loro normale
percorso provider in modalità `auto`. Se forzi `agentRuntime.id: "codex"`, ogni turno incorporato
per quell’agente deve essere un modello OpenAI supportato da Codex.

## Correlati

- [Agent harness plugins](/it/plugins/sdk-agent-harness)
- [Agent runtimes](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Status](/it/cli/status)
- [Plugin hooks](/it/plugins/hooks)
- [Configuration reference](/it/gateway/configuration-reference)
- [Testing](/it/help/testing-live#live-codex-app-server-harness-smoke)
