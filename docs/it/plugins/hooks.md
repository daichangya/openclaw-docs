---
read_when:
    - Stai creando un Plugin che ha bisogno di before_tool_call, before_agent_reply, hook dei messaggi o hook del ciclo di vita
    - Hai bisogno di bloccare, riscrivere o richiedere approvazione per chiamate agli strumenti da un Plugin
    - Stai decidendo tra hook interni e hook dei Plugin
summary: 'Hook dei Plugin: intercettare eventi del ciclo di vita di agente, strumento, messaggio, sessione e Gateway'
title: Hook dei Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Gli hook dei Plugin sono punti di estensione in-process per i Plugin OpenClaw. Usali
quando un Plugin deve ispezionare o modificare esecuzioni dell'agente, chiamate agli strumenti, flusso dei messaggi,
ciclo di vita della sessione, routing dei sottoagenti, installazioni o avvio del Gateway.

Usa invece gli [hook interni](/it/automation/hooks) quando vuoi un piccolo
script `HOOK.md` installato dall'operatore per comandi ed eventi del Gateway come
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Avvio rapido

Registra hook Plugin tipizzati con `api.on(...)` dal punto di ingresso del tuo Plugin:

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

Gli handler degli hook vengono eseguiti in sequenza in ordine decrescente di `priority`. Gli hook con la stessa priorità
mantengono l'ordine di registrazione.

## Catalogo degli hook

Gli hook sono raggruppati in base alla superficie che estendono. I nomi in **grassetto** accettano un
risultato decisionale (block, cancel, override o require approval); tutti gli altri servono solo all'osservazione.

**Turno dell'agente**

- `before_model_resolve` — sovrascrive provider o modello prima del caricamento dei messaggi di sessione
- `before_prompt_build` — aggiunge contesto dinamico o testo del prompt di sistema prima della chiamata al modello
- `before_agent_start` — fase combinata solo per compatibilità; preferisci i due hook sopra
- **`before_agent_reply`** — interrompe il turno del modello con una risposta sintetica o silenzio
- **`before_agent_finalize`** — ispeziona la risposta finale naturale e richiede un altro passaggio del modello
- `agent_end` — osserva messaggi finali, stato di successo e durata dell'esecuzione

**Osservazione della conversazione**

- `model_call_started` / `model_call_ended` — osservano metadati sanificati della chiamata provider/modello, tempi, esito e hash limitati degli id richiesta senza contenuto di prompt o risposta
- `llm_input` — osserva l'input del provider (prompt di sistema, prompt, cronologia)
- `llm_output` — osserva l'output del provider

**Strumenti**

- **`before_tool_call`** — riscrive i parametri dello strumento, blocca l'esecuzione o richiede approvazione
- `after_tool_call` — osserva risultati degli strumenti, errori e durata
- **`tool_result_persist`** — riscrive il messaggio dell'assistente prodotto da un risultato di strumento
- **`before_message_write`** — ispeziona o blocca una scrittura di messaggio in corso (raro)

**Messaggi e consegna**

- **`inbound_claim`** — rivendica un messaggio in entrata prima del routing dell'agente (risposte sintetiche)
- `message_received` — osserva contenuto in entrata, mittente, thread e metadati
- **`message_sending`** — riscrive il contenuto in uscita o annulla la consegna
- `message_sent` — osserva successo o fallimento della consegna in uscita
- **`before_dispatch`** — ispeziona o riscrive un dispatch in uscita prima del passaggio al canale
- **`reply_dispatch`** — partecipa alla pipeline finale di dispatch della risposta

**Sessioni e Compaction**

- `session_start` / `session_end` — tracciano i confini del ciclo di vita della sessione
- `before_compaction` / `after_compaction` — osservano o annotano i cicli di Compaction
- `before_reset` — osserva eventi di reset della sessione (`/reset`, reset programmatici)

**Sottoagenti**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordinano routing del sottoagente e consegna del completamento

**Ciclo di vita**

- `gateway_start` / `gateway_stop` — avviano o fermano servizi di proprietà del Plugin insieme al Gateway
- **`before_install`** — ispeziona scansioni di installazione di skill o Plugin e può facoltativamente bloccare

## Policy di chiamata agli strumenti

`before_tool_call` riceve:

- `event.toolName`
- `event.params`
- `event.runId` facoltativo
- `event.toolCallId` facoltativo
- campi di contesto come `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (impostato nelle esecuzioni guidate da Cron) e diagnostica `ctx.trace`

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

- `block: true` è terminale e salta gli handler con priorità inferiore.
- `block: false` viene trattato come nessuna decisione.
- `params` riscrive i parametri dello strumento per l'esecuzione.
- `requireApproval` mette in pausa l'esecuzione dell'agente e chiede all'utente tramite
  approvazioni Plugin. Il comando `/approve` può approvare sia approvazioni exec sia Plugin.
- Un `block: true` a priorità inferiore può ancora bloccare dopo che un hook a priorità superiore
  ha richiesto approvazione.
- `onResolution` riceve la decisione di approvazione risolta — `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

### Persistenza del risultato dello strumento

I risultati degli strumenti possono includere `details` strutturati per rendering UI, diagnostica,
routing dei media o metadati di proprietà del Plugin. Tratta `details` come metadati di runtime,
non come contenuto del prompt:

- OpenClaw rimuove `toolResult.details` prima del replay del provider e dell'input di Compaction
  così i metadati non diventano contesto del modello.
- Le voci di sessione persistite mantengono solo `details` limitati. I dettagli sovradimensionati vengono
  sostituiti con un riepilogo compatto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` vengono eseguiti prima del limite finale di
  persistenza. Gli hook dovrebbero comunque mantenere piccoli i `details` restituiti ed evitare
  di mettere in `details` testo rilevante per il prompt; l'output visibile al modello dello strumento
  va in `content`.

## Hook di prompt e modello

Usa gli hook specifici di fase per i nuovi Plugin:

- `before_model_resolve`: riceve solo il prompt corrente e i metadati
  degli allegati. Restituisci `providerOverride` o `modelOverride`.
- `before_prompt_build`: riceve il prompt corrente e i messaggi della sessione.
  Restituisci `prependContext`, `systemPrompt`, `prependSystemContext` o
  `appendSystemContext`.

`before_agent_start` resta per compatibilità. Preferisci gli hook espliciti sopra
così il tuo Plugin non dipende da una fase combinata legacy.

`before_agent_start` e `agent_end` includono `event.runId` quando OpenClaw può
identificare l'esecuzione attiva. Lo stesso valore è disponibile anche in `ctx.runId`.
Le esecuzioni guidate da Cron espongono anche `ctx.jobId` (l'id del processo Cron di origine) così
gli hook Plugin possono applicare metriche, effetti collaterali o stato a uno specifico processo pianificato.

Usa `model_call_started` e `model_call_ended` per telemetria delle chiamate provider
che non deve ricevere prompt grezzi, cronologia, risposte, header, corpi di richiesta
o id richiesta del provider. Questi hook includono metadati stabili come
`runId`, `callId`, `provider`, `model`, `api`/`transport` facoltativi, terminale
`durationMs`/`outcome` e `upstreamRequestIdHash` quando OpenClaw può derivare un
hash limitato dell'id richiesta provider.

`before_agent_finalize` viene eseguito solo quando un harness sta per accettare una
risposta finale naturale dell'assistente. Non è il percorso di annullamento `/stop` e non
viene eseguito quando l'utente interrompe un turno. Restituisci `{ action: "revise", reason }` per chiedere
all'harness un altro passaggio del modello prima della finalizzazione, `{ action:
"finalize", reason? }` per forzare la finalizzazione, oppure ometti un risultato per continuare.
Gli hook `Stop` nativi di Codex vengono inoltrati in questo hook come decisioni OpenClaw
`before_agent_finalize`.

I Plugin non inclusi nel bundle che hanno bisogno di `llm_input`, `llm_output`,
`before_agent_finalize` o `agent_end` devono impostare:

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

Gli hook che modificano il prompt possono essere disabilitati per Plugin con
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hook dei messaggi

Usa gli hook dei messaggi per routing a livello di canale e policy di consegna:

- `message_received`: osserva contenuto in entrata, mittente, `threadId`, `messageId`,
  `senderId`, correlazione facoltativa run/session e metadati.
- `message_sending`: riscrive `content` o restituisce `{ cancel: true }`.
- `message_sent`: osserva successo o fallimento finale.

Per risposte TTS solo audio, `content` può contenere la trascrizione parlata nascosta
anche quando il payload del canale non ha testo/caption visibile. Riscrivere quel
`content` aggiorna solo la trascrizione visibile all'hook; non viene renderizzata come
caption del media.

I contesti degli hook dei messaggi espongono campi di correlazione stabili quando disponibili:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Preferisci
questi campi di prima classe prima di leggere i metadati legacy.

Preferisci i campi tipizzati `threadId` e `replyToId` prima di usare metadati specifici del canale.

Regole decisionali:

- `message_sending` con `cancel: true` è terminale.
- `message_sending` con `cancel: false` viene trattato come nessuna decisione.
- Il `content` riscritto continua verso gli hook a priorità inferiore a meno che un hook successivo
  non annulli la consegna.

## Hook di installazione

`before_install` viene eseguito dopo la scansione integrata per installazioni di skill e Plugin.
Restituisci risultati aggiuntivi oppure `{ block: true, blockReason }` per fermare
l'installazione.

`block: true` è terminale. `block: false` viene trattato come nessuna decisione.

## Ciclo di vita del Gateway

Usa `gateway_start` per servizi Plugin che necessitano di stato di proprietà del Gateway. Il
contesto espone `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per
ispezione e aggiornamenti di Cron. Usa `gateway_stop` per pulire risorse di lunga durata.

Non fare affidamento sull'hook interno `gateway:startup` per servizi runtime di proprietà del Plugin.

## Deprecazioni imminenti

Alcune superfici vicine agli hook sono deprecate ma ancora supportate. Esegui la migrazione
prima della prossima major release:

- **Envelope di canale plaintext** negli handler `inbound_claim` e `message_received`.
  Leggi `BodyForAgent` e i blocchi strutturati di contesto utente
  invece di analizzare testo envelope piatto. Vedi
  [Envelope di canale plaintext → BodyForAgent](/it/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** resta per compatibilità. I nuovi Plugin dovrebbero usare
  `before_model_resolve` e `before_prompt_build` invece della fase
  combinata.
- **`onResolution` in `before_tool_call`** ora usa l'union tipizzata
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) invece di una `string` libera.

Per l'elenco completo — registrazione delle capacità memory, profilo thinking del provider, provider auth esterni, tipi di discovery del provider, accessor del runtime task e la rinomina `command-auth` → `command-status` — vedi
[Migrazione SDK Plugin → Deprecazioni attive](/it/plugins/sdk-migration#active-deprecations).

## Correlati

- [Migrazione SDK Plugin](/it/plugins/sdk-migration) — deprecazioni attive e timeline di rimozione
- [Creare Plugin](/it/plugins/building-plugins)
- [Panoramica SDK Plugin](/it/plugins/sdk-overview)
- [Punti di ingresso del Plugin](/it/plugins/sdk-entrypoints)
- [Hook interni](/it/automation/hooks)
- [Interni dell'architettura Plugin](/it/plugins/architecture-internals)
