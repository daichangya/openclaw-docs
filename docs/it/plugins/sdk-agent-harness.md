---
read_when:
    - Stai modificando il runtime agente embedded o il registro dell'harness
    - Stai registrando un harness agente da un Plugin incluso o fidato
    - Devi capire come il Plugin Codex si relaziona ai provider di modelli
sidebarTitle: Agent Harness
summary: Superficie SDK sperimentale per Plugin che sostituiscono l'esecutore agente embedded di basso livello
title: Plugin dell'harness agente
x-i18n:
    generated_at: "2026-04-25T13:52:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Un **agent harness** è l'esecutore di basso livello per un singolo turno agente OpenClaw preparato.
Non è un provider di modelli, non è un canale e non è un registro di strumenti.
Per il modello mentale rivolto all'utente, vedi [Runtime degli agenti](/it/concepts/agent-runtimes).

Usa questa superficie solo per Plugin nativi inclusi o fidati. Il contratto è
ancora sperimentale perché i tipi dei parametri riflettono intenzionalmente l'attuale
runner embedded.

## Quando usare un harness

Registra un agent harness quando una famiglia di modelli ha il proprio runtime
di sessione nativo e il normale trasporto provider di OpenClaw è l'astrazione sbagliata.

Esempi:

- un server di coding-agent nativo che possiede thread e Compaction
- una CLI o un daemon locale che deve trasmettere eventi nativi di piano/ragionamento/strumenti
- un runtime del modello che necessita del proprio resume id oltre alla
  trascrizione della sessione OpenClaw

**Non** registrare un harness solo per aggiungere una nuova API LLM. Per normali API di modelli HTTP o
WebSocket, crea un [Plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa resta di proprietà del core

Prima che un harness venga selezionato, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione del runtime
- livello di thinking e budget di contesto
- la trascrizione/sessione OpenClaw
- workspace, sandbox e criterio degli strumenti
- callback di risposta del canale e callback di streaming
- criterio di fallback del modello e cambio live del modello

Questa suddivisione è intenzionale. Un harness esegue un tentativo preparato; non sceglie
provider, non sostituisce la consegna del canale e non cambia modello in modo silenzioso.

## Registra un harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Criterio di selezione

OpenClaw sceglie un harness dopo la risoluzione di provider/modello:

1. L'id harness registrato di una sessione esistente ha la precedenza, così i cambiamenti di config/env non
   cambiano a caldo quel transcript verso un altro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza un harness registrato con quell'id per
   sessioni che non sono già fissate.
3. `OPENCLAW_AGENT_RUNTIME=pi` forza l'harness PI integrato.
4. `OPENCLAW_AGENT_RUNTIME=auto` chiede agli harness registrati se supportano la
   coppia provider/modello risolta.
5. Se nessun harness registrato corrisponde, OpenClaw usa PI a meno che il fallback PI non sia
   disabilitato.

I fallimenti dell'harness del Plugin emergono come errori di esecuzione. In modalità `auto`, il fallback PI viene
usato solo quando nessun harness di Plugin registrato supporta la coppia
provider/modello risolta. Una volta che un harness di Plugin ha rivendicato un'esecuzione, OpenClaw non
riesegue lo stesso turno tramite PI perché ciò può cambiare la semantica di auth/runtime
o duplicare effetti collaterali.

L'id dell'harness selezionato viene reso persistente con l'id della sessione dopo un'esecuzione embedded.
Le sessioni legacy create prima dei pin dell'harness vengono trattate come fissate su PI una volta che
hanno cronologia di transcript. Usa una nuova sessione o `/reset` quando passi tra PI e un
harness nativo di Plugin. `/status` mostra id harness non predefiniti come `codex`
accanto a `Fast`; PI resta nascosto perché è il percorso di compatibilità predefinito.
Se l'harness selezionato sorprende, abilita il logging di debug `agents/harness` e
ispeziona il record strutturato del gateway `agent harness selected`. Include
l'id dell'harness selezionato, il motivo della selezione, il criterio di runtime/fallback e, in
modalità `auto`, il risultato di supporto di ciascun candidato Plugin.

Il Plugin Codex incluso registra `codex` come proprio harness id. Il core lo tratta
come un normale harness id di Plugin; gli alias specifici di Codex appartengono nel Plugin
o nella configurazione dell'operatore, non nel selettore runtime condiviso.

## Coppia provider più harness

La maggior parte degli harness dovrebbe anche registrare un provider. Il provider rende visibili al resto di
OpenClaw i model ref, lo stato di autenticazione, i metadati del modello e la selezione `/model`.
L'harness poi rivendica quel provider in `supports(...)`.

Il Plugin Codex incluso segue questo schema:

- model ref utente preferiti: `openai/gpt-5.5` più
  `embeddedHarness.runtime: "codex"`
- ref di compatibilità: i vecchi ref `codex/gpt-*` restano accettati, ma le nuove
  configurazioni non dovrebbero usarli come normali ref provider/model
- harness id: `codex`
- auth: disponibilità sintetica del provider, perché l'harness Codex possiede il
  login/sessione Codex nativo
- richiesta app-server: OpenClaw invia a Codex l'id del modello nudo e lascia che
  l'harness parli con il protocollo nativo dell'app-server

Il Plugin Codex è additivo. I semplici ref `openai/gpt-*` continuano a usare il
normale percorso provider di OpenClaw a meno che tu non forzi l'harness Codex con
`embeddedHarness.runtime: "codex"`. I vecchi ref `codex/gpt-*` continuano a selezionare il
provider e l'harness Codex per compatibilità.

Per la configurazione dell'operatore, esempi di prefissi modello e configurazioni solo Codex, vedi
[Codex Harness](/it/plugins/codex-harness).

OpenClaw richiede Codex app-server `0.118.0` o più recente. Il Plugin Codex controlla
l'handshake di inizializzazione dell'app-server e blocca i server più vecchi o senza versione così
OpenClaw viene eseguito solo contro la superficie di protocollo con cui è stato testato.

### Middleware del risultato degli strumenti

I Plugin inclusi possono allegare middleware di risultato degli strumenti neutrali rispetto al runtime tramite
`api.registerAgentToolResultMiddleware(...)` quando il loro manifest dichiara gli
id runtime mirati in `contracts.agentToolResultMiddleware`. Questa seam fidata
serve per trasformazioni asincrone del risultato degli strumenti che devono essere eseguite prima che PI o Codex reimmettano
l'output dello strumento nel modello.

I Plugin inclusi legacy possono ancora usare
`api.registerCodexAppServerExtensionFactory(...)` per middleware
solo app-server Codex, ma le nuove trasformazioni dei risultati dovrebbero usare l'API neutrale rispetto al runtime.
L'hook solo Pi `api.registerEmbeddedExtensionFactory(...)` è stato rimosso;
le trasformazioni del risultato degli strumenti Pi devono usare middleware neutrali rispetto al runtime.

### Modalità harness Codex nativa

L'harness `codex` incluso è la modalità Codex nativa per i turni agente
embedded di OpenClaw. Abilita prima il Plugin `codex` incluso e includi `codex` in
`plugins.allow` se la tua configurazione usa una allowlist restrittiva. Le configurazioni app-server native dovrebbero usare `openai/gpt-*` con `embeddedHarness.runtime: "codex"`.
Usa invece `openai-codex/*` per OAuth Codex tramite PI. I vecchi model ref `codex/*`
restano alias di compatibilità per l'harness nativo.

Quando questa modalità è in esecuzione, Codex possiede il thread id nativo, il comportamento di resume,
la Compaction e l'esecuzione dell'app-server. OpenClaw continua però a possedere il canale chat,
il mirror del transcript visibile, il criterio degli strumenti, le approvazioni, la consegna dei media e la selezione della sessione. Usa `embeddedHarness.runtime: "codex"` senza un override `fallback`
quando devi dimostrare che solo il percorso app-server Codex può rivendicare l'esecuzione.
I runtime di Plugin espliciti falliscono già in modalità fail-closed per impostazione predefinita. Imposta `fallback: "pi"`
solo quando vuoi intenzionalmente che PI gestisca l'assenza di selezione dell'harness. I fallimenti dell'app-server Codex già falliscono direttamente invece di ritentare tramite PI.

## Disabilita il fallback PI

Per impostazione predefinita, OpenClaw esegue gli agenti embedded con `agents.defaults.embeddedHarness`
impostato su `{ runtime: "auto", fallback: "pi" }`. In modalità `auto`, gli harness di Plugin registrati
possono rivendicare una coppia provider/modello. Se nessuno corrisponde, OpenClaw usa come fallback PI.

In modalità `auto`, imposta `fallback: "none"` quando hai bisogno che l'assenza di selezione dell'harness del Plugin
fallisca invece di usare PI. I runtime di Plugin espliciti come
`runtime: "codex"` falliscono già in modalità fail-closed per impostazione predefinita, a meno che `fallback: "pi"` non sia
impostato nello stesso ambito di configurazione o override env. I fallimenti dell'harness di Plugin selezionato
falliscono sempre in modo netto. Questo non blocca un esplicito `runtime: "pi"` o
`OPENCLAW_AGENT_RUNTIME=pi`.

Per esecuzioni embedded solo Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

Se vuoi che qualsiasi harness di Plugin registrato rivendichi i modelli corrispondenti ma non
vuoi mai che OpenClaw usi in modo silenzioso il fallback a PI, mantieni `runtime: "auto"` e disabilita
il fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Gli override per agente usano la stessa forma:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` continua a sovrascrivere il runtime configurato. Usa
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` per disabilitare il fallback PI dall'ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disabilitato, una sessione fallisce presto quando l'harness richiesto non è
registrato, non supporta la coppia provider/modello risolta o fallisce prima di
produrre effetti collaterali del turno. Questo è intenzionale per le distribuzioni solo Codex e
per i test live che devono dimostrare che il percorso app-server Codex è realmente in uso.

Questa impostazione controlla solo l'harness agente embedded. Non disabilita
l'instradamento del modello specifico del provider per immagini, video, musica, TTS, PDF o altro.

## Sessioni native e mirror del transcript

Un harness può mantenere un session id nativo, thread id o token di resume lato daemon.
Mantieni questa associazione esplicitamente collegata alla sessione OpenClaw e continua a
rispecchiare l'output visibile all'utente di assistente/strumenti nel transcript OpenClaw.

Il transcript OpenClaw resta il livello di compatibilità per:

- cronologia della sessione visibile nel canale
- ricerca e indicizzazione del transcript
- ritorno all'harness PI integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione della sessione

Se il tuo harness memorizza un'associazione sidecar, implementa `reset(...)` così OpenClaw possa
cancellarla quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di strumenti e media

Il core costruisce la lista degli strumenti OpenClaw e la passa nel tentativo preparato.
Quando un harness esegue una chiamata a strumento dinamica, restituisci il risultato dello strumento tramite
la forma di risultato dell'harness invece di inviare tu stesso i media del canale.

Questo mantiene testo, immagine, video, musica, TTS, approvazione e output degli strumenti di messaggistica
sullo stesso percorso di consegna delle esecuzioni supportate da PI.

## Limitazioni attuali

- Il percorso di import pubblico è generico, ma alcuni alias di tipo tentativo/risultato
  portano ancora nomi `Pi` per compatibilità.
- L'installazione di harness di terze parti è sperimentale. Preferisci i Plugin provider
  finché non ti serve un runtime di sessione nativo.
- Il cambio di harness è supportato tra turni. Non cambiare harness nel
  mezzo di un turno dopo che sono iniziati strumenti nativi, approvazioni, testo dell'assistente o
  invio di messaggi.

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview)
- [Helper runtime](/it/plugins/sdk-runtime)
- [Plugin provider](/it/plugins/sdk-provider-plugins)
- [Codex Harness](/it/plugins/codex-harness)
- [Provider dei modelli](/it/concepts/model-providers)
