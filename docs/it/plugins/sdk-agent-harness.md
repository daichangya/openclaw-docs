---
read_when:
    - Stai modificando il runtime agente embedded o il registro harness
    - Stai registrando un harness dell'agente da un Plugin incluso o attendibile
    - Hai bisogno di capire come il Plugin Codex si relaziona ai provider di modelli
sidebarTitle: Agent Harness
summary: Superficie SDK sperimentale per Plugin che sostituiscono l'esecutore agente embedded di basso livello
title: Plugin harness dell'agente
x-i18n:
    generated_at: "2026-04-26T11:34:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Un **harness dell'agente** è l'esecutore di basso livello per un turno agente OpenClaw preparato. Non è un provider di modelli, non è un canale e non è un registro di strumenti.
Per il modello mentale orientato all'utente, vedi [Runtime degli agenti](/it/concepts/agent-runtimes).

Usa questa superficie solo per Plugin nativi inclusi o attendibili. Il contratto è
ancora sperimentale perché i tipi dei parametri rispecchiano intenzionalmente l'attuale runner embedded.

## Quando usare un harness

Registra un harness dell'agente quando una famiglia di modelli ha il proprio
runtime di sessione nativo e il normale trasporto provider OpenClaw è l'astrazione sbagliata.

Esempi:

- un server nativo di coding-agent che gestisce thread e Compaction
- una CLI o un demone locale che deve trasmettere eventi nativi di piano/ragionamento/strumento
- un runtime di modello che ha bisogno di un proprio id di ripresa oltre al
  transcript di sessione OpenClaw

**Non** registrare un harness solo per aggiungere una nuova API LLM. Per normali API di modelli HTTP o
WebSocket, crea un [Plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa continua a gestire il core

Prima che venga selezionato un harness, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione runtime
- livello di thinking e budget di contesto
- transcript OpenClaw/file di sessione
- workspace, sandbox e policy degli strumenti
- callback di risposta del canale e callback di streaming
- policy di fallback del modello e cambio modello live

Questa suddivisione è intenzionale. Un harness esegue un tentativo preparato; non sceglie
provider, non sostituisce la consegna del canale e non cambia modello in silenzio.

Il tentativo preparato include anche `params.runtimePlan`, un bundle di policy di proprietà di OpenClaw per decisioni runtime che devono restare condivise tra gli harness PI e nativi:

- `runtimePlan.tools.normalize(...)` e
  `runtimePlan.tools.logDiagnostics(...)` per la policy degli schemi degli strumenti consapevole del provider
- `runtimePlan.transcript.resolvePolicy(...)` per la sanitizzazione del transcript e
  la policy di riparazione delle chiamate agli strumenti
- `runtimePlan.delivery.isSilentPayload(...)` per la soppressione condivisa di `NO_REPLY` e
  della consegna dei media
- `runtimePlan.outcome.classifyRunResult(...)` per la classificazione del fallback del modello
- `runtimePlan.observability` per i metadati risolti provider/modello/harness

Gli harness possono usare il piano per decisioni che devono corrispondere al comportamento PI, ma
devono comunque trattarlo come stato di tentativo di proprietà dell'host. Non mutarlo e non usarlo per
cambiare provider/modelli all'interno di un turno.

## Registrare un harness

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

## Policy di selezione

OpenClaw sceglie un harness dopo la risoluzione di provider/modello:

1. L'id dell'harness registrato di una sessione esistente prevale, così le modifiche di config/env non
   cambiano a caldo quel transcript verso un altro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza un harness registrato con quell'id per
   sessioni che non sono già fissate.
3. `OPENCLAW_AGENT_RUNTIME=pi` forza l'harness PI integrato.
4. `OPENCLAW_AGENT_RUNTIME=auto` chiede agli harness registrati se supportano il
   provider/modello risolto.
5. Se nessun harness registrato corrisponde, OpenClaw usa PI a meno che il fallback a PI non sia
   disabilitato.

I guasti dell'harness del Plugin emergono come errori di esecuzione. In modalità `auto`, il fallback a PI viene
usato solo quando nessun harness Plugin registrato supporta il provider/modello
risolto. Una volta che un harness Plugin ha rivendicato un'esecuzione, OpenClaw non
ripete lo stesso turno tramite PI perché ciò può cambiare la semantica di autenticazione/runtime
o duplicare effetti collaterali.

L'id dell'harness selezionato viene mantenuto persistente con l'id della sessione dopo un'esecuzione embedded.
Le sessioni legacy create prima dei pin dell'harness vengono trattate come fissate a PI una volta che
hanno cronologia di transcript. Usa una nuova sessione o un reset quando cambi tra PI e un
harness Plugin nativo. `/status` mostra id di harness non predefiniti come `codex`
accanto a `Fast`; PI resta nascosto perché è il percorso di compatibilità predefinito.
Se l'harness selezionato è sorprendente, abilita il logging di debug `agents/harness` e
ispeziona il record strutturato del gateway `agent harness selected`. Include
l'id dell'harness selezionato, il motivo della selezione, la policy runtime/fallback e, in
modalità `auto`, il risultato di supporto di ogni candidato Plugin.

Il Plugin Codex incluso registra `codex` come id del suo harness. Il core tratta questo
come un normale id di harness Plugin; gli alias specifici di Codex appartengono al Plugin
o alla configurazione dell'operator, non al selettore runtime condiviso.

## Accoppiamento provider più harness

La maggior parte degli harness deve anche registrare un provider. Il provider rende i riferimenti dei modelli,
lo stato di autenticazione, i metadati del modello e la selezione `/model` visibili al resto di
OpenClaw. L'harness poi rivendica quel provider in `supports(...)`.

Il Plugin Codex incluso segue questo schema:

- riferimenti modello preferiti per l'utente: `openai/gpt-5.5` più
  `agentRuntime.id: "codex"`
- riferimenti di compatibilità: i riferimenti legacy `codex/gpt-*` restano accettati, ma le nuove
  configurazioni non devono usarli come normali riferimenti provider/modello
- id harness: `codex`
- autenticazione: disponibilità sintetica del provider, perché l'harness Codex possiede il login/sessione Codex nativi
- richiesta app-server: OpenClaw invia a Codex l'id del modello semplice e lascia
  che l'harness parli con il protocollo nativo dell'app-server

Il Plugin Codex è additivo. I semplici riferimenti `openai/gpt-*` continuano a usare il
normale percorso provider OpenClaw a meno che tu non forzi l'harness Codex con
`agentRuntime.id: "codex"`. I riferimenti meno recenti `codex/gpt-*` continuano invece a selezionare il
provider e l'harness Codex per compatibilità.

Per configurazione operator, esempi di prefisso dei modelli e configurazioni solo Codex, vedi
[Harness Codex](/it/plugins/codex-harness).

OpenClaw richiede Codex app-server `0.125.0` o più recente. Il Plugin Codex controlla
l'handshake di inizializzazione dell'app-server e blocca server meno recenti o non versionati così
OpenClaw viene eseguito solo sulla superficie di protocollo su cui è stato testato. Il
limite minimo `0.125.0` include il supporto nativo al payload degli hook MCP arrivato in
Codex `0.124.0`, fissando al tempo stesso OpenClaw sulla linea stabile più recente testata.

### Middleware dei risultati degli strumenti

I Plugin inclusi possono collegare middleware dei risultati degli strumenti neutrali rispetto al runtime tramite
`api.registerAgentToolResultMiddleware(...)` quando il loro manifest dichiara gli
id runtime di destinazione in `contracts.agentToolResultMiddleware`. Questa seam attendibile
serve per trasformazioni asincrone dei risultati degli strumenti che devono essere eseguite prima che PI o Codex reinseriscano
l'output dello strumento nel modello.

I Plugin inclusi legacy possono ancora usare
`api.registerCodexAppServerExtensionFactory(...)` per middleware solo app-server Codex, ma le nuove trasformazioni dei risultati devono usare l'API neutrale rispetto al runtime.
L'hook solo Pi `api.registerEmbeddedExtensionFactory(...)` è stato rimosso;
le trasformazioni dei risultati degli strumenti Pi devono usare middleware neutrali rispetto al runtime.

### Classificazione dell'esito terminale

Gli harness nativi che gestiscono la propria proiezione di protocollo possono usare
`classifyAgentHarnessTerminalOutcome(...)` da
`openclaw/plugin-sdk/agent-harness-runtime` quando un turno completato non ha prodotto
testo visibile dell'assistente. L'helper restituisce `empty`, `reasoning-only` o
`planning-only` così la policy di fallback di OpenClaw può decidere se riprovare su un
modello diverso. Intenzionalmente lascia non classificati errori di prompt, turni in corso e
risposte silenziose intenzionali come `NO_REPLY`.

### Modalità harness Codex nativa

L'harness `codex` incluso è la modalità Codex nativa per i turni agente embedded di OpenClaw.
Abilita prima il Plugin `codex` incluso e includi `codex` in
`plugins.allow` se la tua configurazione usa una allowlist restrittiva. Le configurazioni native app-server devono usare `openai/gpt-*` con `agentRuntime.id: "codex"`.
Usa invece `openai-codex/*` per Codex OAuth tramite PI. I riferimenti modello legacy `codex/*`
restano alias di compatibilità per l'harness nativo.

Quando questa modalità è in esecuzione, Codex gestisce l'id thread nativo, il comportamento di ripresa,
Compaction e l'esecuzione dell'app-server. OpenClaw continua invece a gestire il canale chat,
il mirror del transcript visibile, la policy degli strumenti, le approvazioni, la consegna dei media e la selezione della sessione. Usa `agentRuntime.id: "codex"` senza override `fallback`
quando devi dimostrare che solo il percorso app-server Codex può rivendicare l'esecuzione.
I runtime Plugin espliciti falliscono già in modalità chiusa per impostazione predefinita. Imposta `fallback: "pi"`
solo quando vuoi intenzionalmente che PI gestisca la selezione mancante dell'harness. I guasti dell'app-server Codex falliscono già direttamente invece di ritentare tramite PI.

## Disabilitare il fallback a PI

Per impostazione predefinita, OpenClaw esegue gli agenti embedded con `agents.defaults.agentRuntime`
impostato su `{ id: "auto", fallback: "pi" }`. In modalità `auto`, gli harness Plugin registrati
possono rivendicare una coppia provider/modello. Se nessuno corrisponde, OpenClaw usa come fallback PI.

In modalità `auto`, imposta `fallback: "none"` quando hai bisogno che la mancata selezione dell'harness Plugin
fallisca invece di usare PI. I runtime Plugin espliciti come
`runtime: "codex"` falliscono già in modalità chiusa per impostazione predefinita, a meno che `fallback: "pi"` non sia
impostato nello stesso ambito di configurazione o override env. I guasti dell'harness Plugin selezionato
falliscono sempre in modo netto. Questo non blocca un esplicito `runtime: "pi"` o
`OPENCLAW_AGENT_RUNTIME=pi`.

Per esecuzioni embedded solo Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Se vuoi che qualsiasi harness Plugin registrato rivendichi i modelli corrispondenti ma non
vuoi mai che OpenClaw usi in silenzio il fallback a PI, mantieni `runtime: "auto"` e disabilita
il fallback:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Gli override per agente usano la stessa struttura:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` continua a sovrascrivere il runtime configurato. Usa
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` per disabilitare il fallback a PI
dall'ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disabilitato, una sessione fallisce presto quando l'harness richiesto non è
registrato, non supporta il provider/modello risolto o fallisce prima di
produrre effetti collaterali del turno. Questo è intenzionale per le distribuzioni solo Codex e
per i test live che devono dimostrare che il percorso app-server Codex è effettivamente in uso.

Questa impostazione controlla solo l'harness dell'agente embedded. Non disabilita
l'instradamento specifico del provider per immagine, video, musica, TTS, PDF o altri modelli.

## Sessioni native e mirror del transcript

Un harness può mantenere un id sessione nativo, un id thread o un token di ripresa lato demone.
Mantieni quell'associazione collegata esplicitamente alla sessione OpenClaw e continua a
rispecchiare l'output visibile di assistente/strumento nel transcript OpenClaw.

Il transcript OpenClaw resta il layer di compatibilità per:

- cronologia della sessione visibile nel canale
- ricerca e indicizzazione del transcript
- ritorno all'harness PI integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione della sessione

Se il tuo harness memorizza un binding sidecar, implementa `reset(...)` così OpenClaw può
cancellarlo quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di strumenti e media

Il core costruisce l'elenco degli strumenti OpenClaw e lo passa nel tentativo preparato.
Quando un harness esegue una chiamata a strumento dinamica, restituisci il risultato dello strumento tramite
la forma del risultato dell'harness invece di inviare tu stesso i media del canale.

Questo mantiene output di testo, immagine, video, musica, TTS, approvazione e degli strumenti di messaggistica
sullo stesso percorso di consegna delle esecuzioni supportate da PI.

## Limitazioni attuali

- Il percorso di import pubblico è generico, ma alcuni alias di tipo attempt/result mantengono ancora
  nomi `Pi` per compatibilità.
- L'installazione di harness di terze parti è sperimentale. Preferisci i Plugin provider
  finché non hai bisogno di un runtime di sessione nativo.
- Il cambio di harness è supportato tra turni. Non cambiare harness nel mezzo di un turno dopo che
  sono iniziati strumenti nativi, approvazioni, testo dell'assistente o invii di messaggi.

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview)
- [Helper runtime](/it/plugins/sdk-runtime)
- [Plugin provider](/it/plugins/sdk-provider-plugins)
- [Harness Codex](/it/plugins/codex-harness)
- [Provider di modelli](/it/concepts/model-providers)
