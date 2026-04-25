---
read_when:
    - Stai creando un plugin che richiede `before_tool_call`, `before_agent_reply`, Hook dei messaggi o Hook del ciclo di vita
    - Hai bisogno di bloccare, riscrivere o richiedere approvazione per le chiamate agli strumenti da un plugin
    - Stai decidendo tra Hook interni e Plugin hooks
summary: 'Plugin hooks: intercetta eventi del ciclo di vita dell''agente, degli strumenti, dei messaggi, della sessione e del Gateway'
title: Plugin hooks
x-i18n:
    generated_at: "2026-04-25T13:52:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

I Plugin hooks sono punti di estensione in-process per i Plugin OpenClaw. Usali
quando un plugin deve ispezionare o modificare esecuzioni dell'agente, chiamate agli strumenti, flusso dei messaggi,
ciclo di vita della sessione, instradamento dei subagent, installazioni o avvio del Gateway.

Usa invece gli [Hook interni](/it/automation/hooks) quando vuoi un piccolo
script `HOOK.md` installato dall'operatore per comandi ed eventi del Gateway come
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Avvio rapido

Registra Plugin hooks tipizzati con `api.on(...)` dal punto di ingresso del tuo plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Gli handler degli Hook vengono eseguiti in sequenza in ordine decrescente di `priority`. Gli Hook con la stessa priorità
mantengono l'ordine di registrazione.

## Catalogo degli Hook

Gli Hook sono raggruppati in base alla superficie che estendono. I nomi in **grassetto** accettano un
risultato decisionale (block, cancel, override o require approval); tutti gli altri servono solo
per osservazione.

**Turno dell'agente**

- `before_model_resolve` — sostituisce provider o modello prima che vengano caricati i messaggi della sessione
- `before_prompt_build` — aggiunge contesto dinamico o testo del system prompt prima della chiamata al modello
- `before_agent_start` — fase combinata solo per compatibilità; preferisci i due Hook sopra
- **`before_agent_reply`** — interrompe il turno del modello con una risposta sintetica o il silenzio
- `agent_end` — osserva messaggi finali, stato di successo e durata dell'esecuzione

**Osservazione della conversazione**

- `llm_input` — osserva l'input del provider (system prompt, prompt, cronologia)
- `llm_output` — osserva l'output del provider

**Strumenti**

- **`before_tool_call`** — riscrive i parametri dello strumento, blocca l'esecuzione o richiede approvazione
- `after_tool_call` — osserva risultati, errori e durata degli strumenti
- **`tool_result_persist`** — riscrive il messaggio assistant prodotto da un risultato di strumento
- **`before_message_write`** — ispeziona o blocca una scrittura di messaggio in corso (raro)

**Messaggi e consegna**

- **`inbound_claim`** — rivendica un messaggio in ingresso prima dell'instradamento dell'agente (risposte sintetiche)
- `message_received` — osserva contenuto in ingresso, mittente, thread e metadata
- **`message_sending`** — riscrive il contenuto in uscita o annulla la consegna
- `message_sent` — osserva il successo o il fallimento della consegna in uscita
- **`before_dispatch`** — ispeziona o riscrive una dispatch in uscita prima del handoff al canale
- **`reply_dispatch`** — partecipa alla pipeline finale di dispatch della risposta

**Sessioni e Compaction**

- `session_start` / `session_end` — tracciano i boundary del ciclo di vita della sessione
- `before_compaction` / `after_compaction` — osservano o annotano i cicli di Compaction
- `before_reset` — osserva gli eventi di reset della sessione (`/reset`, reset programmatici)

**Subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordinano l'instradamento dei subagent e la consegna al completamento

**Ciclo di vita**

- `gateway_start` / `gateway_stop` — avviano o arrestano servizi del plugin insieme al Gateway
- **`before_install`** — ispeziona le scansioni di installazione di skill o plugin e può opzionalmente bloccare

## Criteri per le chiamate agli strumenti

`before_tool_call` riceve:

- `event.toolName`
- `event.params`
- facoltativo `event.runId`
- facoltativo `event.toolCallId`
- campi di contesto come `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` e
  diagnostica `ctx.trace`

Può restituire:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Regole:

- `block: true` è terminale e salta gli handler a priorità inferiore.
- `block: false` viene trattato come nessuna decisione.
- `params` riscrive i parametri dello strumento per l'esecuzione.
- `requireApproval` mette in pausa l'esecuzione dell'agente e chiede all'utente tramite
  le approvazioni del plugin. Il comando `/approve` può approvare sia le approvazioni exec sia quelle del plugin.
- Un `block: true` a priorità inferiore può comunque bloccare dopo che un Hook a priorità più alta
  ha richiesto approvazione.
- `onResolution` riceve la decisione di approvazione risolta — `allow-once`,
  `allow-always`, `deny`, `timeout` oppure `cancelled`.

## Hook di prompt e modello

Usa gli Hook specifici per fase per i nuovi Plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadata
  degli allegati. Restituisce `providerOverride` o `modelOverride`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi della sessione.
  Restituisce `prependContext`, `systemPrompt`, `prependSystemContext` oppure
  `appendSystemContext`.

`before_agent_start` rimane per compatibilità. Preferisci gli Hook espliciti sopra
così il tuo plugin non dipende da una fase combinata legacy.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può
identificare l'esecuzione attiva. Lo stesso valore è disponibile anche in `ctx.runId`.

I Plugin non bundled che necessitano di `llm_input`, `llm_output` o `agent_end` devono impostare:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Gli Hook che modificano il prompt possono essere disabilitati per plugin con
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hook dei messaggi

Usa gli Hook dei messaggi per instradamento e criteri di consegna a livello di canale:

- `message_received`: osserva contenuto in ingresso, mittente, `threadId`, `messageId`,
  `senderId`, correlazione facoltativa esecuzione/sessione e metadata.
- `message_sending`: riscrive `content` o restituisce `{ cancel: true }`.
- `message_sent`: osserva il successo o il fallimento finale.

Per le risposte TTS solo audio, `content` può contenere la trascrizione parlata nascosta
anche quando il payload del canale non ha testo/caption visibile. Riscrivere quel
`content` aggiorna solo la trascrizione visibile all'Hook; non viene resa come
caption del media.

I contesti degli Hook dei messaggi espongono campi di correlazione stabili quando disponibili:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Preferisci
questi campi di prima classe prima di leggere i metadata legacy.

Preferisci i campi tipizzati `threadId` e `replyToId` prima di usare metadata specifici del canale.

Regole decisionali:

- `message_sending` con `cancel: true` è terminale.
- `message_sending` con `cancel: false` viene trattato come nessuna decisione.
- Il `content` riscritto continua verso gli Hook a priorità inferiore a meno che un Hook successivo
  non annulli la consegna.

## Hook di installazione

`before_install` viene eseguito dopo la scansione integrata per le installazioni di skill e plugin.
Restituisce risultati aggiuntivi oppure `{ block: true, blockReason }` per fermare
l'installazione.

`block: true` è terminale. `block: false` viene trattato come nessuna decisione.

## Ciclo di vita del Gateway

Usa `gateway_start` per i servizi del plugin che necessitano di stato gestito dal Gateway. Il
contesto espone `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per
l'ispezione e l'aggiornamento di Cron. Usa `gateway_stop` per pulire risorse a lunga durata.

Non fare affidamento sull'Hook interno `gateway:startup` per servizi runtime posseduti dal plugin.

## Deprecazioni imminenti

Alcune superfici adiacenti agli Hook sono deprecate ma ancora supportate. Effettua la migrazione
prima della prossima release major:

- **Envelope di canale in chiaro** negli handler `inbound_claim` e `message_received`.
  Leggi `BodyForAgent` e i blocchi strutturati di contesto utente
  invece di analizzare il testo piatto dell'envelope. Vedi
  [Plaintext channel envelopes → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** rimane per compatibilità. I nuovi Plugin dovrebbero usare
  `before_model_resolve` e `before_prompt_build` invece della fase
  combinata.
- **`onResolution` in `before_tool_call`** ora usa l'unione tipizzata
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) invece di una `string` libera.

Per l'elenco completo — registrazione delle capability di memoria, profilo di thinking
del provider, provider auth esterni, tipi di discovery del provider, accessor
runtime dei task e la rinomina `command-auth` → `command-status` — vedi
[Plugin SDK migration → Active deprecations](/it/plugins/sdk-migration#active-deprecations).

## Correlati

- [Plugin SDK migration](/it/plugins/sdk-migration) — deprecazioni attive e timeline di rimozione
- [Building plugins](/it/plugins/building-plugins)
- [Plugin SDK overview](/it/plugins/sdk-overview)
- [Plugin entry points](/it/plugins/sdk-entrypoints)
- [Internal hooks](/it/automation/hooks)
- [Plugin architecture internals](/it/plugins/architecture-internals)
