---
read_when:
    - Vuoi inviare l'utilizzo dei modelli, il flusso dei messaggi o le metriche di sessione di OpenClaw a un collector OpenTelemetry
    - Stai collegando trace, metriche o log a Grafana, Datadog, Honeycomb, New Relic, Tempo o a un altro backend OTLP
    - Ti servono i nomi esatti delle metriche, i nomi degli span o le forme degli attributi per creare dashboard o avvisi
summary: Esporta la diagnostica di OpenClaw verso qualsiasi collector OpenTelemetry tramite il Plugin diagnostics-otel (OTLP/HTTP)
title: Esportazione OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T11:29:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw esporta la diagnostica tramite il Plugin `diagnostics-otel` incluso nel bundle
usando **OTLP/HTTP (protobuf)**. Qualsiasi collector o backend che accetta OTLP/HTTP
funziona senza modifiche al codice. Per i log locali su file e come leggerli, vedi
[Logging](/it/logging).

## Come si integra

- Gli **eventi diagnostici** sono record strutturati in-process emessi dal
  Gateway e dai Plugin inclusi nel bundle per esecuzioni di modelli, flusso dei messaggi, sessioni,
  code ed exec.
- Il **Plugin `diagnostics-otel`** si sottoscrive a questi eventi e li esporta come
  OpenTelemetry **metriche**, **trace** e **log** tramite OTLP/HTTP.
- Le **chiamate ai provider** ricevono un header W3C `traceparent` dal contesto span
  attendibile della chiamata al modello di OpenClaw quando il trasporto del provider accetta
  header personalizzati. Il contesto trace emesso dai Plugin non viene propagato.
- Gli exporter vengono collegati solo quando sia la superficie diagnostica sia il Plugin sono
  abilitati, quindi il costo in-process resta quasi nullo per impostazione predefinita.

## Avvio rapido

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

Puoi anche abilitare il Plugin dalla CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` attualmente supporta solo `http/protobuf`. `grpc` viene ignorato.
</Note>

## Segnali esportati

| Segnale     | Cosa contiene                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | Counter e histogram per uso dei token, costo, durata delle esecuzioni, flusso dei messaggi, lane delle code, stato delle sessioni, exec e pressione di memoria. |
| **Traces**  | Span per uso dei modelli, chiamate ai modelli, ciclo di vita dell'harness, esecuzione degli strumenti, exec, elaborazione di Webhook/messaggi, assemblaggio del contesto e loop degli strumenti. |
| **Logs**    | Record strutturati `logging.file` esportati tramite OTLP quando `diagnostics.otel.logs` è abilitato.                                      |

Puoi attivare o disattivare `traces`, `metrics` e `logs` in modo indipendente. Tutti e tre sono attivi per impostazione predefinita
quando `diagnostics.otel.enabled` è true.

## Riferimento della configurazione

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc viene ignorato
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // sampler dello span root, 0.0..1.0
      flushIntervalMs: 60000, // intervallo di esportazione delle metriche (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### Variabili d'ambiente

| Variabile                                                                                                          | Scopo                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                      | Sovrascrive `diagnostics.otel.endpoint`. Se il valore contiene già `/v1/traces`, `/v1/metrics` o `/v1/logs`, viene usato così com'è.                                                                                                     |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Override degli endpoint specifici per segnale usati quando la chiave di configurazione corrispondente `diagnostics.otel.*Endpoint` non è impostata. La configurazione specifica per segnale ha la precedenza sull'env specifico per segnale, che a sua volta ha la precedenza sull'endpoint condiviso. |
| `OTEL_SERVICE_NAME`                                                                                                | Sovrascrive `diagnostics.otel.serviceName`.                                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                      | Sovrascrive il protocollo wire (oggi viene rispettato solo `http/protobuf`).                                                                                                                                                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                    | Impostalo su `gen_ai_latest_experimental` per emettere il più recente attributo span sperimentale GenAI (`gen_ai.provider.name`) invece del legacy `gen_ai.system`. Le metriche GenAI usano sempre attributi semantici limitati e a bassa cardinalità. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                          | Impostalo su `1` quando un altro preload o processo host ha già registrato l'SDK OpenTelemetry globale. Il Plugin allora salta il proprio ciclo di vita NodeSDK ma collega comunque i listener diagnostici e rispetta `traces`/`metrics`/`logs`. |

## Privacy e acquisizione del contenuto

Il contenuto grezzo di modello/strumenti **non** viene esportato per impostazione predefinita. Gli span trasportano
identificatori limitati (canale, provider, modello, categoria di errore, request id con solo hash)
e non includono mai testo del prompt, testo della risposta, input degli strumenti, output degli strumenti o
chiavi di sessione.

Le richieste modello in uscita possono includere un header W3C `traceparent`. Questo header
viene generato solo dal contesto trace diagnostico posseduto da OpenClaw per la chiamata al modello
attiva. Gli header `traceparent` forniti dal chiamante vengono sostituiti, quindi Plugin o
opzioni personalizzate del provider non possono falsificare l'ascendenza trace cross-service.

Imposta `diagnostics.otel.captureContent.*` su `true` solo quando il tuo collector e la
policy di retention sono approvati per prompt, risposte, strumenti o testo del prompt di sistema. Ogni sottochiave è opt-in indipendente:

- `inputMessages` — contenuto del prompt utente.
- `outputMessages` — contenuto della risposta del modello.
- `toolInputs` — payload degli argomenti degli strumenti.
- `toolOutputs` — payload dei risultati degli strumenti.
- `systemPrompt` — prompt system/developer assemblato.

Quando una qualsiasi sottochiave è abilitata, gli span di modello e strumenti ricevono attributi
limitati e redatti `openclaw.content.*` solo per quella classe.

## Sampling e flush

- **Traces:** `diagnostics.otel.sampleRate` (solo span root, `0.0` elimina tutto,
  `1.0` conserva tutto).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (minimo `1000`).
- **Logs:** i log OTLP rispettano `logging.level` (livello di log su file). La
  redazione della console **non** si applica ai log OTLP. Le installazioni ad alto volume dovrebbero
  preferire sampling/filtering del collector OTLP invece del sampling locale.

## Metriche esportate

### Uso del modello

- `openclaw.tokens` (counter, attr: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attr: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attr: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attr: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, metrica semantic-conventions GenAI, attr: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, secondi, metrica semantic-conventions GenAI, attr: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` facoltativo)

### Flusso dei messaggi

- `openclaw.webhook.received` (counter, attr: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attr: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attr: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attr: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attr: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attr: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attr: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attr: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Code e sessioni

- `openclaw.queue.lane.enqueue` (counter, attr: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attr: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attr: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attr: `openclaw.lane`)
- `openclaw.session.state` (counter, attr: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attr: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attr: `openclaw.state`)
- `openclaw.run.attempt` (counter, attr: `openclaw.attempt`)

### Ciclo di vita dell'harness

- `openclaw.harness.duration_ms` (histogram, attr: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` sugli errori)

### Exec

- `openclaw.exec.duration_ms` (histogram, attr: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Interni della diagnostica (memoria e loop strumenti)

- `openclaw.memory.heap_used_bytes` (histogram, attr: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histogram)
- `openclaw.memory.pressure` (counter, attr: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (counter, attr: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histogram, attr: `openclaw.toolName`, `openclaw.outcome`)

## Span esportati

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` per impostazione predefinita, oppure `gen_ai.provider.name` quando si attivano le semantic conventions GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` per impostazione predefinita, oppure `gen_ai.provider.name` quando si attivano le semantic conventions GenAI più recenti
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (hash limitato basato su SHA dell'ID richiesta del provider upstream; gli ID grezzi non vengono esportati)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Al completamento: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - In caso di errore: `openclaw.harness.phase`, `openclaw.errorCategory`, facoltativamente `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (nessun contenuto di prompt, cronologia, risposta o chiave di sessione)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (nessun messaggio del loop, parametro o output dello strumento)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando l'acquisizione del contenuto è esplicitamente abilitata, gli span di modello e strumenti possono anche
includere attributi `openclaw.content.*` limitati e redatti per le specifiche
classi di contenuto che hai scelto.

## Catalogo degli eventi diagnostici

Gli eventi seguenti alimentano le metriche e gli span sopra. I Plugin possono anche sottoscriversi
direttamente a questi eventi senza esportazione OTLP.

**Uso del modello**

- `model.usage` — token, costo, durata, contesto, provider/modello/canale,
  ID sessione. `usage` è la contabilità provider/turno per costo e telemetria;
  `context.used` è lo snapshot corrente del prompt/contesto e può essere inferiore a
  `usage.total` del provider quando sono coinvolti input in cache o chiamate del loop degli strumenti.

**Flusso dei messaggi**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Coda e sessione**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (contatori aggregati: Webhook/coda/sessione)

**Ciclo di vita dell'harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  ciclo di vita per esecuzione dell'harness agente. Include `harnessId`, facoltativamente
  `pluginId`, provider/modello/canale e ID esecuzione. Il completamento aggiunge
  `durationMs`, `outcome`, facoltativamente `resultClassification`, `yieldDetected`
  e conteggi `itemLifecycle`. Gli errori aggiungono `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  facoltativamente `cleanupFailed`.

**Exec**

- `exec.process.completed` — esito terminale, durata, target, modalità, exit
  code e tipo di errore. Il testo del comando e le directory di lavoro non sono
  inclusi.

## Senza un exporter

Puoi mantenere gli eventi diagnostici disponibili per Plugin o sink personalizzati senza
eseguire `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Per output di debug mirato senza aumentare `logging.level`, usa i flag
diagnostici. I flag non distinguono maiuscole/minuscole e supportano wildcard (ad esempio `telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Oppure come override env una tantum:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

L'output dei flag va nel file di log standard (`logging.file`) ed è comunque
redatto da `logging.redactSensitive`. Guida completa:
[Flag diagnostici](/it/diagnostics/flags).

## Disabilitare

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Puoi anche lasciare `diagnostics-otel` fuori da `plugins.allow`, oppure eseguire
`openclaw plugins disable diagnostics-otel`.

## Correlati

- [Logging](/it/logging) — log su file, output della console, tailing CLI e scheda Logs della UI di controllo
- [Interni del logging Gateway](/it/gateway/logging) — stili di log WS, prefissi dei sottosistemi e acquisizione della console
- [Flag diagnostici](/it/diagnostics/flags) — flag di debug-log mirati
- [Esportazione diagnostica](/it/gateway/diagnostics) — strumento operatore per il support bundle (separato dall'esportazione OTEL)
- [Riferimento della configurazione](/it/gateway/configuration-reference#diagnostics) — riferimento completo dei campi `diagnostics.*`
