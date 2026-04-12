---
read_when:
    - Stai modificando il runtime dell'agente incorporato o il registro dell'harness
    - Stai registrando un harness dell'agente da un plugin incluso o attendibile
    - Devi capire come il plugin Codex si relaziona ai provider di modelli
sidebarTitle: Agent Harness
summary: Superficie SDK sperimentale per i plugin che sostituiscono l'esecutore dell'agente incorporato di basso livello
title: Plugin Harness dell'agente
x-i18n:
    generated_at: "2026-04-12T00:19:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62b88fd24ce8b600179db27e16e8d764a2cd7a14e5c5df76374c33121aa5e365
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugin Harness dell'agente

Un **agent harness** è l'esecutore di basso livello per un turno preparato di un agente OpenClaw. Non è un provider di modelli, non è un canale e non è un registro di strumenti.

Usa questa superficie solo per plugin nativi inclusi o attendibili. Il contratto è ancora sperimentale perché i tipi dei parametri rispecchiano intenzionalmente l'attuale runner incorporato.

## Quando usare un harness

Registra un agent harness quando una famiglia di modelli ha un proprio runtime di sessione nativo e il normale trasporto provider di OpenClaw è l'astrazione sbagliata.

Esempi:

- un server nativo per agenti di coding che gestisce thread e compattazione
- una CLI o un demone locale che deve trasmettere eventi nativi di piano/ragionamento/strumenti
- un runtime di modelli che ha bisogno di un proprio ID di ripresa oltre alla trascrizione di sessione OpenClaw

**Non** registrare un harness solo per aggiungere una nuova API LLM. Per normali API di modelli HTTP o WebSocket, crea un [plugin provider](/it/plugins/sdk-provider-plugins).

## Cosa rimane di competenza del core

Prima che venga selezionato un harness, OpenClaw ha già risolto:

- provider e modello
- stato di autenticazione del runtime
- livello di reasoning e budget di contesto
- la trascrizione OpenClaw / il file di sessione
- workspace, sandbox e policy degli strumenti
- callback di risposta del canale e callback di streaming
- fallback del modello e policy di cambio del modello live

Questa separazione è intenzionale. Un harness esegue un tentativo preparato; non sceglie i provider, non sostituisce la consegna del canale e non cambia silenziosamente modello.

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

## Criterio di selezione

OpenClaw sceglie un harness dopo la risoluzione di provider/modello:

1. `OPENCLAW_AGENT_RUNTIME=<id>` forza un harness registrato con quell'id.
2. `OPENCLAW_AGENT_RUNTIME=pi` forza l'harness PI integrato.
3. `OPENCLAW_AGENT_RUNTIME=auto` chiede agli harness registrati se supportano il provider/modello risolto.
4. Se nessun harness registrato corrisponde, OpenClaw usa PI a meno che il fallback a PI non sia disabilitato.

Gli errori forzati dell'harness del plugin emergono come errori di esecuzione. In modalità `auto`, OpenClaw può ricadere su PI quando l'harness del plugin selezionato fallisce prima che un turno produca effetti collaterali. Imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none` o `embeddedHarness.fallback: "none"` per rendere invece quel fallback un errore irreversibile.

Il plugin Codex incluso registra `codex` come ID del proprio harness. Il core lo tratta come un normale ID di harness del plugin; gli alias specifici di Codex appartengono al plugin o alla configurazione dell'operatore, non al selettore di runtime condiviso.

## Associazione provider più harness

La maggior parte degli harness dovrebbe anche registrare un provider. Il provider rende visibili al resto di OpenClaw i riferimenti ai modelli, lo stato di autenticazione, i metadati del modello e la selezione `/model`. L'harness poi rivendica quel provider in `supports(...)`.

Il plugin Codex incluso segue questo schema:

- id provider: `codex`
- riferimenti ai modelli per l'utente: `codex/gpt-5.4`, `codex/gpt-5.2` o un altro modello restituito dal server app Codex
- id harness: `codex`
- autenticazione: disponibilità sintetica del provider, perché l'harness Codex gestisce il login/sessione Codex nativo
- richiesta al server app: OpenClaw invia l'ID del modello senza prefissi a Codex e lascia che l'harness comunichi con il protocollo nativo del server app

Il plugin Codex è aggiuntivo. I riferimenti semplici `openai/gpt-*` restano riferimenti del provider OpenAI e continuano a usare il normale percorso provider di OpenClaw. Seleziona `codex/gpt-*` quando vuoi autenticazione gestita da Codex, rilevamento dei modelli Codex, thread nativi ed esecuzione del server app Codex. `/model` può passare tra i modelli Codex restituiti dal server app Codex senza richiedere credenziali del provider OpenAI.

Per la configurazione dell'operatore, esempi di prefissi di modello e configurazioni solo Codex, vedi [Codex Harness](/it/plugins/codex-harness).

OpenClaw richiede Codex app-server `0.118.0` o successivo. Il plugin Codex controlla l'handshake di inizializzazione dell'app-server e blocca i server più vecchi o senza versione, così OpenClaw viene eseguito solo sulla superficie di protocollo con cui è stato testato.

### Modalità harness Codex nativa

L'harness `codex` incluso è la modalità Codex nativa per i turni degli agenti OpenClaw incorporati. Abilita prima il plugin `codex` incluso e includi `codex` in `plugins.allow` se la tua configurazione usa una allowlist restrittiva. È diverso da `openai-codex/*`:

- `openai-codex/*` usa OAuth ChatGPT/Codex tramite il normale percorso provider di OpenClaw.
- `codex/*` usa il provider Codex incluso e instrada il turno tramite il server app Codex.

Quando questa modalità è in esecuzione, Codex gestisce l'ID del thread nativo, il comportamento di ripresa, la compattazione e l'esecuzione dell'app-server. OpenClaw continua comunque a gestire il canale di chat, il mirror della trascrizione visibile, la policy degli strumenti, le approvazioni, la consegna dei contenuti multimediali e la selezione della sessione. Usa `embeddedHarness.runtime: "codex"` con `embeddedHarness.fallback: "none"` quando devi dimostrare che viene usato il percorso del server app Codex e che il fallback a PI non sta nascondendo un harness nativo non funzionante.

## Disabilitare il fallback a PI

Per impostazione predefinita, OpenClaw esegue gli agenti incorporati con `agents.defaults.embeddedHarness` impostato su `{ runtime: "auto", fallback: "pi" }`. In modalità `auto`, gli harness dei plugin registrati possono rivendicare una coppia provider/modello. Se nessuno corrisponde, oppure se un harness del plugin selezionato automaticamente fallisce prima di produrre output, OpenClaw ricade su PI.

Imposta `fallback: "none"` quando devi dimostrare che un harness del plugin è l'unico runtime realmente utilizzato. Questo disabilita il fallback automatico a PI; non blocca un `runtime: "pi"` esplicito o `OPENCLAW_AGENT_RUNTIME=pi`.

Per esecuzioni incorporate solo Codex:

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

Se vuoi che qualunque harness del plugin registrato possa rivendicare i modelli corrispondenti ma non vuoi mai che OpenClaw ricada silenziosamente su PI, mantieni `runtime: "auto"` e disabilita il fallback:

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

Le override per agente usano la stessa struttura:

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

`OPENCLAW_AGENT_RUNTIME` continua a sovrascrivere il runtime configurato. Usa `OPENCLAW_AGENT_HARNESS_FALLBACK=none` per disabilitare il fallback a PI dall'ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disabilitato, una sessione fallisce subito quando l'harness richiesto non è registrato, non supporta il provider/modello risolto o fallisce prima di produrre effetti collaterali del turno. Questo è intenzionale per i deployment solo Codex e per i test live che devono dimostrare che il percorso del server app Codex è effettivamente in uso.

Questa impostazione controlla solo l'harness dell'agente incorporato. Non disabilita l'instradamento specifico del provider per immagini, video, musica, TTS, PDF o altri modelli.

## Sessioni native e mirror della trascrizione

Un harness può mantenere un ID di sessione nativo, un ID di thread o un token di ripresa lato demone. Mantieni tale associazione esplicitamente legata alla sessione OpenClaw e continua a riflettere l'output visibile all'utente di assistente/strumenti nella trascrizione OpenClaw.

La trascrizione OpenClaw rimane il livello di compatibilità per:

- cronologia della sessione visibile nel canale
- ricerca e indicizzazione della trascrizione
- ritorno all'harness PI integrato in un turno successivo
- comportamento generico di `/new`, `/reset` ed eliminazione della sessione

Se il tuo harness memorizza un'associazione sidecar, implementa `reset(...)` così OpenClaw può cancellarla quando la sessione OpenClaw proprietaria viene reimpostata.

## Risultati di strumenti e contenuti multimediali

Il core costruisce l'elenco degli strumenti OpenClaw e lo passa nel tentativo preparato. Quando un harness esegue una chiamata a strumento dinamica, restituisci il risultato dello strumento tramite la forma del risultato dell'harness invece di inviare tu stesso i contenuti multimediali al canale.

Questo mantiene output di testo, immagine, video, musica, TTS, approvazione e strumenti di messaggistica sullo stesso percorso di consegna delle esecuzioni supportate da PI.

## Limitazioni attuali

- Il percorso di import pubblico è generico, ma alcuni alias di tipo attempt/result riportano ancora nomi `Pi` per compatibilità.
- L'installazione di harness di terze parti è sperimentale. Preferisci i plugin provider finché non ti serve un runtime di sessione nativo.
- Il cambio di harness è supportato tra i turni. Non cambiare harness nel mezzo di un turno dopo che sono iniziati strumenti nativi, approvazioni, testo dell'assistente o invii di messaggi.

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview)
- [Helper di runtime](/it/plugins/sdk-runtime)
- [Plugin provider](/it/plugins/sdk-provider-plugins)
- [Codex Harness](/it/plugins/codex-harness)
- [Provider di modelli](/it/concepts/model-providers)
