---
read_when:
    - Stai modificando il runtime dell’agente embedded o il registro harness
    - Stai registrando un harness dell’agente da un plugin incluso o attendibile
    - Devi capire come il plugin Codex si relaziona ai provider di modelli
sidebarTitle: Agent Harness
summary: Superficie SDK sperimentale per i plugin che sostituiscono l’esecutore agente embedded di basso livello
title: Plugin Harness dell’agente
x-i18n:
    generated_at: "2026-04-22T08:20:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 728fef59ae3cce29a3348842820f1f71a2eac98ae6b276179bce6c85d16613df
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugin Harness dell’agente

Un **agent harness** è l’esecutore di basso livello per un singolo turno agente
OpenClaw preparato. Non è un provider di modelli, non è un canale e non è un registro di strumenti.

Usa questa superficie solo per plugin nativi inclusi o attendibili. Il contratto è
ancora sperimentale perché i tipi dei parametri rispecchiano intenzionalmente l’attuale
runner embedded.

## Quando usare un harness

Registra un agent harness quando una famiglia di modelli ha il proprio runtime
di sessione nativo e il normale trasporto provider di OpenClaw è l’astrazione sbagliata.

Esempi:

- un server di agenti di coding nativo che gestisce thread e Compaction
- una CLI o un demone locale che deve trasmettere in streaming eventi nativi di piano/ragionamento/strumenti
- un runtime di modello che richiede il proprio id di ripresa oltre alla
  trascrizione di sessione di OpenClaw

**Non** registrare un harness solo per aggiungere una nuova API LLM. Per normali API di modelli HTTP o
WebSocket, crea un [plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa continua a gestire il core

Prima che venga selezionato un harness, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione del runtime
- livello di ragionamento e budget di contesto
- il file di trascrizione/sessione di OpenClaw
- workspace, sandbox e policy degli strumenti
- callback di risposta del canale e callback di streaming
- fallback del modello e policy di cambio modello live

Questa separazione è intenzionale. Un harness esegue un tentativo preparato; non sceglie
provider, non sostituisce la consegna del canale e non cambia modello in modo silenzioso.

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

1. `OPENCLAW_AGENT_RUNTIME=<id>` forza un harness registrato con quell’id.
2. `OPENCLAW_AGENT_RUNTIME=pi` forza l’harness PI integrato.
3. `OPENCLAW_AGENT_RUNTIME=auto` chiede agli harness registrati se supportano la
   coppia provider/modello risolta.
4. Se nessun harness registrato corrisponde, OpenClaw usa PI a meno che il fallback PI non sia
   disabilitato.

Gli errori degli harness plugin emergono come errori di esecuzione. In modalità `auto`, il fallback PI viene
usato solo quando nessun harness plugin registrato supporta la
coppia provider/modello risolta. Una volta che un harness plugin ha preso in carico un’esecuzione, OpenClaw non
riesegue quello stesso turno tramite PI perché ciò può cambiare la semantica di autenticazione/runtime
o duplicare gli effetti collaterali.

Il plugin Codex incluso registra `codex` come id del proprio harness. Il core tratta questo valore
come un normale id di harness plugin; gli alias specifici di Codex appartengono al plugin
o alla configurazione dell’operatore, non al selettore di runtime condiviso.

## Abbinamento provider più harness

La maggior parte degli harness dovrebbe registrare anche un provider. Il provider rende riferimenti di modello,
stato di autenticazione, metadati del modello e selezione `/model` visibili al resto di
OpenClaw. L’harness poi prende in carico quel provider in `supports(...)`.

Il plugin Codex incluso segue questo schema:

- id provider: `codex`
- riferimenti di modello utente: `codex/gpt-5.4`, `codex/gpt-5.2` o un altro modello restituito
  dal server app Codex
- id harness: `codex`
- autenticazione: disponibilità sintetica del provider, perché l’harness Codex gestisce
  il login/sessione Codex nativo
- richiesta app-server: OpenClaw invia a Codex l’id modello puro e lascia che l’harness parli con il protocollo app-server nativo

Il plugin Codex è additivo. I riferimenti semplici `openai/gpt-*` restano riferimenti del provider OpenAI
e continuano a usare il normale percorso provider di OpenClaw. Seleziona `codex/gpt-*`
quando vuoi autenticazione gestita da Codex, rilevamento dei modelli Codex, thread nativi e
esecuzione tramite app-server Codex. `/model` può passare tra i modelli Codex restituiti
dal server app Codex senza richiedere credenziali del provider OpenAI.

Per la configurazione dell’operatore, esempi di prefissi di modello e configurazioni solo Codex, vedi
[Codex Harness](/it/plugins/codex-harness).

OpenClaw richiede Codex app-server `0.118.0` o successivo. Il plugin Codex controlla
l’handshake di inizializzazione dell’app-server e blocca server più vecchi o senza versione, così
OpenClaw viene eseguito solo sulla superficie di protocollo su cui è stato testato.

### Modalità harness Codex nativa

L’harness `codex` incluso è la modalità Codex nativa per i turni agente embedded di
OpenClaw. Abilita prima il plugin `codex` incluso e includi `codex` in
`plugins.allow` se la tua configurazione usa una allowlist restrittiva. È diverso
da `openai-codex/*`:

- `openai-codex/*` usa OAuth ChatGPT/Codex tramite il normale percorso provider di OpenClaw.
- `codex/*` usa il provider Codex incluso e instrada il turno tramite Codex
  app-server.

Quando questa modalità è in esecuzione, Codex gestisce l’id thread nativo, il comportamento di ripresa,
Compaction e l’esecuzione dell’app-server. OpenClaw continua comunque a gestire il canale di chat,
il mirror della trascrizione visibile, la policy degli strumenti, le approvazioni, la consegna dei media e la
selezione della sessione. Usa `embeddedHarness.runtime: "codex"` con
`embeddedHarness.fallback: "none"` quando devi dimostrare che solo il percorso Codex
app-server può prendere in carico l’esecuzione. Questa configurazione è solo una protezione di selezione:
gli errori dell’app-server Codex falliscono già direttamente invece di ritentare tramite PI.

## Disabilitare il fallback PI

Per impostazione predefinita, OpenClaw esegue gli agenti embedded con `agents.defaults.embeddedHarness`
impostato su `{ runtime: "auto", fallback: "pi" }`. In modalità `auto`, gli harness plugin registrati
possono prendere in carico una coppia provider/modello. Se nessuno corrisponde, OpenClaw torna a PI.

Imposta `fallback: "none"` quando vuoi che la mancata selezione di un harness plugin provochi un errore
invece di usare PI. Gli errori degli harness plugin selezionati falliscono già in modo definitivo. Questo
non blocca un esplicito `runtime: "pi"` o `OPENCLAW_AGENT_RUNTIME=pi`.

Per esecuzioni embedded solo Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Se vuoi che qualsiasi harness plugin registrato prenda in carico i modelli corrispondenti ma non
vuoi mai che OpenClaw ricada silenziosamente su PI, mantieni `runtime: "auto"` e disabilita
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

Le sovrascritture per agente usano la stessa struttura:

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
        "model": "codex/gpt-5.4",
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
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` per disabilitare il fallback PI tramite
l’ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disabilitato, una sessione fallisce in anticipo quando l’harness richiesto non è
registrato, non supporta la coppia provider/modello risolta o fallisce prima di
produrre effetti collaterali del turno. Questo è intenzionale per deployment solo Codex e
per test live che devono dimostrare che il percorso Codex app-server è effettivamente in uso.

Questa impostazione controlla solo l’harness dell’agente embedded. Non disabilita
il routing specifico del provider per immagini, video, musica, TTS, PDF o altri modelli.

## Sessioni native e mirror della trascrizione

Un harness può mantenere un id di sessione nativo, un id thread o un token di ripresa lato demone.
Mantieni questa associazione esplicitamente collegata alla sessione OpenClaw e continua
a rispecchiare l’output di assistente/strumenti visibile all’utente nella trascrizione OpenClaw.

La trascrizione OpenClaw resta il livello di compatibilità per:

- cronologia della sessione visibile nel canale
- ricerca e indicizzazione della trascrizione
- ritorno all’harness PI integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione della sessione

Se il tuo harness memorizza un’associazione sidecar, implementa `reset(...)` affinché OpenClaw possa
cancellarla quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di strumenti e media

Il core costruisce l’elenco strumenti di OpenClaw e lo passa al tentativo preparato.
Quando un harness esegue una chiamata a strumento dinamica, restituisci il risultato dello strumento tramite
la forma del risultato dell’harness invece di inviare tu stesso i media del canale.

Questo mantiene testo, immagine, video, musica, TTS, approvazione e output degli strumenti di messaggistica
sullo stesso percorso di consegna delle esecuzioni supportate da PI.

## Limitazioni attuali

- Il percorso di import pubblico è generico, ma alcuni alias di tipi tentativo/risultato
  portano ancora nomi `Pi` per compatibilità.
- L’installazione di harness di terze parti è sperimentale. Preferisci i plugin provider
  finché non ti serve un runtime di sessione nativo.
- Il cambio di harness è supportato tra i turni. Non cambiare harness nel
  mezzo di un turno dopo che strumenti nativi, approvazioni, testo dell’assistente o invii di messaggi
  sono già iniziati.

## Correlati

- [Panoramica dell’SDK](/it/plugins/sdk-overview)
- [Helper di runtime](/it/plugins/sdk-runtime)
- [Plugin Provider](/it/plugins/sdk-provider-plugins)
- [Codex Harness](/it/plugins/codex-harness)
- [Provider di modelli](/it/concepts/model-providers)
