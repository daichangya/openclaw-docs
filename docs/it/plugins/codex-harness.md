---
read_when:
    - Vuoi usare l'harness app-server Codex incluso nel pacchetto
    - Hai bisogno di riferimenti al modello Codex ed esempi di configurazione
    - Vuoi disabilitare il fallback PI per le distribuzioni solo Codex
summary: Esegui i turni dell'agente incorporato di OpenClaw tramite l'harness app-server Codex incluso nel pacchetto
title: Harness Codex
x-i18n:
    generated_at: "2026-04-22T08:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45dbd39a7d8ebb3a39d8dca3a5125c07b7168d1658ca07b85792645fb98613c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Il plugin `codex` incluso nel pacchetto consente a OpenClaw di eseguire i turni dell'agente incorporato tramite l'app-server Codex invece che tramite l'harness PI integrato.

Usalo quando vuoi che Codex gestisca la sessione agente di basso livello: rilevamento dei modelli, ripresa nativa del thread, Compaction nativa ed esecuzione dell'app-server.
OpenClaw continua comunque a gestire i canali di chat, i file di sessione, la selezione del modello, gli strumenti, le approvazioni, la consegna dei contenuti multimediali e il mirror visibile della trascrizione.

L'harness è disattivato per impostazione predefinita. Viene selezionato solo quando il plugin `codex` è abilitato e il modello risolto è un modello `codex/*`, oppure quando forzi esplicitamente `embeddedHarness.runtime: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.
Se non configuri mai `codex/*`, le esecuzioni esistenti PI, OpenAI, Anthropic, Gemini, local e custom-provider mantengono il comportamento attuale.

## Scegli il prefisso di modello corretto

OpenClaw ha percorsi separati per l'accesso in stile OpenAI e Codex:

| Riferimento modello   | Percorso runtime                            | Usalo quando                                                             |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | Provider OpenAI tramite l'infrastruttura OpenClaw/PI | Vuoi l'accesso diretto all'API di OpenAI Platform con `OPENAI_API_KEY`.  |
| `openai-codex/gpt-5.4` | Provider OpenAI Codex OAuth tramite PI     | Vuoi ChatGPT/Codex OAuth senza l'harness app-server Codex.               |
| `codex/gpt-5.4`       | Provider Codex incluso più harness Codex    | Vuoi l'esecuzione nativa dell'app-server Codex per il turno dell'agente incorporato. |

L'harness Codex gestisce solo i riferimenti modello `codex/*`. I riferimenti esistenti `openai/*`, `openai-codex/*`, Anthropic, Gemini, xAI, local e custom provider mantengono i loro percorsi normali.

## Requisiti

- OpenClaw con il plugin `codex` incluso nel pacchetto disponibile.
- App-server Codex `0.118.0` o successivo.
- Autenticazione Codex disponibile per il processo dell'app-server.

Il plugin blocca gli handshake dell'app-server più vecchi o senza versione. In questo modo
OpenClaw resta sulla superficie di protocollo con cui è stato testato.

Per i test smoke live e Docker, l'autenticazione di solito proviene da `OPENAI_API_KEY`, più file facoltativi della CLI Codex come `~/.codex/auth.json` e
`~/.codex/config.toml`. Usa lo stesso materiale di autenticazione usato dal tuo app-server Codex locale.

## Configurazione minima

Usa `codex/gpt-5.4`, abilita il plugin incluso nel pacchetto e forza l'harness `codex`:

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Se la tua configurazione usa `plugins.allow`, includi anche `codex`:

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

Impostare `agents.defaults.model` o il modello di un agente su `codex/<model>` abilita automaticamente anche il plugin `codex` incluso nel pacchetto. La voce esplicita del plugin resta comunque utile nelle configurazioni condivise perché rende evidente l'intento di distribuzione.

## Aggiungere Codex senza sostituire gli altri modelli

Mantieni `runtime: "auto"` quando vuoi Codex per i modelli `codex/*` e PI per tutto il resto:

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
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Con questa configurazione:

- `/model codex` o `/model codex/gpt-5.4` usa l'harness app-server Codex.
- `/model gpt` o `/model openai/gpt-5.4` usa il percorso del provider OpenAI.
- `/model opus` usa il percorso del provider Anthropic.
- Se viene selezionato un modello non Codex, PI resta l'harness di compatibilità.

## Distribuzioni solo Codex

Disabilita il fallback PI quando devi dimostrare che ogni turno dell'agente incorporato usa l'harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
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
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disabilitato, OpenClaw fallisce subito se il plugin Codex è disabilitato, se il modello richiesto non è un riferimento `codex/*`, se l'app-server è troppo vecchio o se l'app-server non può avviarsi.

## Codex per singolo agente

Puoi rendere un agente solo Codex mentre l'agente predefinito mantiene la normale selezione automatica:

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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa i normali comandi di sessione per cambiare agenti e modelli. `/new` crea una nuova sessione OpenClaw e l'harness Codex crea o riprende il proprio thread sidecar dell'app-server secondo necessità. `/reset` cancella l'associazione della sessione OpenClaw per quel thread.

## Rilevamento dei modelli

Per impostazione predefinita, il plugin Codex chiede all'app-server i modelli disponibili. Se il rilevamento fallisce o va in timeout, usa il catalogo di fallback incluso nel pacchetto:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Puoi regolare il rilevamento in `plugins.entries.codex.config.discovery`:

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

Disabilita il rilevamento quando vuoi che l'avvio eviti di interrogare Codex e usi solo il catalogo di fallback:

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

## Connessione e policy dell'app-server

Per impostazione predefinita, il plugin avvia Codex localmente con:

```bash
codex app-server --listen stdio://
```

Per impostazione predefinita, OpenClaw chiede a Codex di richiedere approvazioni native. Puoi regolare ulteriormente questa policy, ad esempio irrigidendola e instradando le revisioni tramite il guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| Campo               | Predefinito                              | Significato                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                |
| `command`           | `"codex"`                                | Eseguibile per il trasporto stdio.                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio.                                        |
| `url`               | non impostato                            | URL dell'app-server WebSocket.                                           |
| `authToken`         | non impostato                            | Bearer token per il trasporto WebSocket.                                 |
| `headers`           | `{}`                                     | Intestazioni WebSocket aggiuntive.                                       |
| `requestTimeoutMs`  | `60000`                                  | Timeout per le chiamate al control plane dell'app-server.                |
| `approvalPolicy`    | `"on-request"`                           | Policy di approvazione nativa Codex inviata a avvio/ripresa/turno del thread. |
| `sandbox`           | `"workspace-write"`                      | Modalità sandbox nativa Codex inviata a avvio/ripresa del thread.        |
| `approvalsReviewer` | `"user"`                                 | Usa `"guardian_subagent"` per lasciare che il guardian Codex esamini le approvazioni native. |
| `serviceTier`       | non impostato                            | Livello di servizio Codex facoltativo, ad esempio `"priority"`.          |

Le vecchie variabili d'ambiente funzionano ancora come fallback per i test locali quando il campo di configurazione corrispondente non è impostato:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

La configurazione è preferibile per distribuzioni ripetibili.

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

Validazione dell'harness solo Codex, con fallback PI disabilitato:

```json5
{
  embeddedHarness: {
    fallback: "none",
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

Approvazioni Codex esaminate dal guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remoto con intestazioni esplicite:

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

Il cambio di modello resta controllato da OpenClaw. Quando una sessione OpenClaw è collegata a un thread Codex esistente, il turno successivo invia di nuovo all'app-server il modello `codex/*`, il provider, la policy di approvazione, il sandbox e il livello di servizio attualmente selezionati. Passare da `codex/gpt-5.4` a `codex/gpt-5.2` mantiene l'associazione del thread ma chiede a Codex di continuare con il modello appena selezionato.

## Comando Codex

Il plugin incluso nel pacchetto registra `/codex` come comando slash autorizzato. È generico e funziona su qualsiasi canale che supporti i comandi testuali di OpenClaw.

Forme comuni:

- `/codex status` mostra connettività live dell'app-server, modelli, account, limiti di frequenza, server MCP e Skills.
- `/codex models` elenca i modelli live dell'app-server Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di eseguire la Compaction del thread collegato.
- `/codex review` avvia la revisione nativa Codex per il thread collegato.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le Skills dell'app-server Codex.

`/codex resume` scrive lo stesso file di associazione sidecar che l'harness usa per i turni normali. Nel messaggio successivo, OpenClaw riprende quel thread Codex, passa all'app-server il modello OpenClaw `codex/*` attualmente selezionato e mantiene abilitata la cronologia estesa.

La superficie dei comandi richiede Codex app-server `0.118.0` o successivo. I singoli metodi di controllo vengono segnalati come `unsupported by this Codex app-server` se un app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Strumenti, contenuti multimediali e Compaction

L'harness Codex cambia solo l'esecutore di basso livello dell'agente incorporato.

OpenClaw continua a costruire l'elenco degli strumenti e a ricevere risultati dinamici degli strumenti dall'harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica continuano a passare attraverso il normale percorso di consegna di OpenClaw.

Quando il modello selezionato usa l'harness Codex, la compattazione nativa del thread viene delegata all'app-server Codex. OpenClaw mantiene un mirror della trascrizione per la cronologia del canale, la ricerca, `/new`, `/reset` e futuri cambi di modello o harness. Il mirror include il prompt dell'utente, il testo finale dell'assistente e record leggeri di ragionamento o piano di Codex quando l'app-server li emette.

La generazione di contenuti multimediali non richiede PI. La generazione di immagini, video, musica, PDF, TTS e la comprensione dei contenuti multimediali continuano a usare le impostazioni provider/modello corrispondenti come `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e `messages.tts`.

## Risoluzione dei problemi

**Codex non compare in `/model`:** abilita `plugins.entries.codex.enabled`, imposta un riferimento modello `codex/*` oppure verifica se `plugins.allow` esclude `codex`.

**OpenClaw usa PI invece di Codex:** se nessun harness Codex gestisce l'esecuzione, OpenClaw può usare PI come backend di compatibilità. Imposta `embeddedHarness.runtime: "codex"` per forzare la selezione di Codex durante i test, oppure `embeddedHarness.fallback: "none"` per fallire quando nessun harness plugin corrisponde. Una volta selezionato Codex app-server, i suoi errori emergono direttamente senza configurazioni di fallback aggiuntive.

**L'app-server viene rifiutato:** aggiorna Codex in modo che l'handshake dell'app-server riporti la versione `0.118.0` o successiva.

**Il rilevamento dei modelli è lento:** riduci `plugins.entries.codex.config.discovery.timeoutMs` o disabilita il rilevamento.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken` e che l'app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non Codex usa PI:** è previsto. L'harness Codex gestisce solo i riferimenti modello `codex/*`.

## Correlati

- [Plugin Harness agente](/it/plugins/sdk-agent-harness)
- [Provider di modelli](/it/concepts/model-providers)
- [Riferimento configurazione](/it/gateway/configuration-reference)
- [Test](/it/help/testing#live-codex-app-server-harness-smoke)
