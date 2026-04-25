---
read_when:
    - Hai bisogno di una panoramica dei log adatta ai principianti
    - Vuoi configurare livelli o formati di log
    - Stai facendo troubleshooting e devi trovare rapidamente i log
summary: 'Panoramica dei log: log su file, output della console, tailing CLI e Control UI'
title: Panoramica dei log
x-i18n:
    generated_at: "2026-04-25T13:50:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw ha due superfici di log principali:

- **Log su file** (righe JSON) scritti dal Gateway.
- **Output della console** mostrato nei terminali e nella UI Debug del Gateway.

La scheda **Logs** della Control UI fa il tail del file di log del gateway. Questa pagina spiega dove
si trovano i log, come leggerli e come configurare livelli e formati dei log.

## Dove si trovano i log

Per impostazione predefinita, il Gateway scrive un file di log rolling in:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La data usa il fuso orario locale dell'host del gateway.

Puoi sovrascriverlo in `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Come leggere i log

### CLI: tail live (consigliato)

Usa la CLI per fare il tail del file di log del gateway tramite RPC:

```bash
openclaw logs --follow
```

Opzioni utili attuali:

- `--local-time`: mostra i timestamp nel tuo fuso orario locale
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC standard del Gateway
- `--expect-final`: flag di attesa della risposta finale RPC supportata da agente (accettato qui tramite il layer client condiviso)

Modalità di output:

- **Sessioni TTY**: righe di log strutturate, belle e colorate.
- **Sessioni non TTY**: testo semplice.
- `--json`: JSON delimitato per riga (un evento di log per riga).
- `--plain`: forza il testo semplice nelle sessioni TTY.
- `--no-color`: disabilita i colori ANSI.

Quando passi un `--url` esplicito, la CLI non applica automaticamente la configurazione o le
credenziali dell'ambiente; includi tu `--token` se il Gateway di destinazione
richiede autenticazione.

In modalità JSON, la CLI emette oggetti con tag `type`:

- `meta`: metadati dello stream (file, cursore, dimensione)
- `log`: voce di log analizzata
- `notice`: suggerimenti di troncamento / rotazione
- `raw`: riga di log non analizzata

Se il Gateway local loopback richiede pairing, `openclaw logs` usa come fallback
automaticamente il file di log locale configurato. Le destinazioni esplicite `--url` non
usano questo fallback.

Se il Gateway non è raggiungibile, la CLI stampa un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### Control UI (web)

La scheda **Logs** della Control UI fa il tail dello stesso file usando `logs.tail`.
Vedi [/web/control-ui](/it/web/control-ui) per sapere come aprirla.

### Log solo canale

Per filtrare l'attività del canale (WhatsApp/Telegram/etc), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formati di log

### Log su file (JSONL)

Ogni riga nel file di log è un oggetto JSON. La CLI e la Control UI analizzano queste
voci per mostrare output strutturato (ora, livello, sottosistema, messaggio).

### Output della console

I log della console sono **TTY-aware** e formattati per essere leggibili:

- Prefissi del sottosistema (ad esempio `gateway/channels/whatsapp`)
- Colori per livello (info/warn/error)
- Modalità compatta o JSON facoltativa

La formattazione della console è controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` ha anche il logging del protocollo WebSocket per il traffico RPC:

- modalità normale: solo risultati interessanti (errori, errori di parsing, chiamate lente)
- `--verbose`: tutto il traffico request/response
- `--ws-log auto|compact|full`: scegli lo stile di rendering verbose
- `--compact`: alias per `--ws-log compact`

Esempi:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurazione del logging

Tutta la configurazione del logging si trova sotto `logging` in `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Livelli di log

- `logging.level`: livello dei **log su file** (JSONL).
- `logging.consoleLevel`: livello di verbosità della **console**.

Puoi sovrascrivere entrambi tramite la variabile d'ambiente **`OPENCLAW_LOG_LEVEL`** (ad esempio `OPENCLAW_LOG_LEVEL=debug`). La variabile d'ambiente ha la precedenza sul file di configurazione, così puoi aumentare la verbosità per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l'opzione CLI globale **`--log-level <level>`** (ad esempio, `openclaw --log-level debug gateway run`), che sovrascrive la variabile d'ambiente per quel comando.

`--verbose` influisce solo sull'output della console e sulla verbosità dei log WS; non cambia
i livelli dei log su file.

### Stili della console

`logging.consoleStyle`:

- `pretty`: adatto alle persone, colorato, con timestamp.
- `compact`: output più compatto (ideale per sessioni lunghe).
- `json`: JSON per riga (per processori di log).

### Redazione

I riepiloghi degli strumenti possono redigere token sensibili prima che arrivino alla console:

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe regex per sovrascrivere l'insieme predefinito

La redazione influisce **solo sull'output della console** e non altera i log su file.

## Diagnostics + OpenTelemetry

Le Diagnostics sono eventi strutturati e leggibili da macchina per le esecuzioni dei modelli **e**
per la telemetria del flusso dei messaggi (webhook, accodamento, stato della sessione). **Non**
sostituiscono i log; esistono per alimentare metriche, trace e altri exporter.

Gli eventi Diagnostics vengono emessi in-process, ma gli exporter si collegano solo quando
sono abilitati sia diagnostics sia il Plugin exporter.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: il modello dati + gli SDK per trace, metriche e log.
- **OTLP**: il protocollo wire usato per esportare i dati OTel verso un collector/backend.
- Oggi OpenClaw esporta tramite **OTLP/HTTP (protobuf)**.

### Segnali esportati

- **Metriche**: contatori + istogrammi (uso token, flusso messaggi, accodamento).
- **Trace**: span per uso del modello + elaborazione webhook/messaggi.
- **Log**: esportati tramite OTLP quando `diagnostics.otel.logs` è abilitato. Il
  volume dei log può essere elevato; tieni presenti `logging.level` e i filtri dell'exporter.

### Catalogo degli eventi diagnostici

Uso del modello:

- `model.usage`: token, costo, durata, contesto, provider/modello/canale, id sessione.

Flusso messaggi:

- `webhook.received`: ingresso webhook per canale.
- `webhook.processed`: webhook gestito + durata.
- `webhook.error`: errori dell'handler webhook.
- `message.queued`: messaggio accodato per l'elaborazione.
- `message.processed`: esito + durata + errore facoltativo.
- `message.delivery.started`: tentativo di consegna in uscita avviato.
- `message.delivery.completed`: tentativo di consegna in uscita terminato + durata/conteggio risultati.
- `message.delivery.error`: tentativo di consegna in uscita fallito + durata/categoria di errore delimitata.

Coda + sessione:

- `queue.lane.enqueue`: enqueue della lane della coda comandi + profondità.
- `queue.lane.dequeue`: dequeue della lane della coda comandi + tempo di attesa.
- `session.state`: transizione di stato della sessione + motivo.
- `session.stuck`: avviso di sessione bloccata + età.
- `run.attempt`: metadati di tentativo/retry dell'esecuzione.
- `diagnostic.heartbeat`: contatori aggregati (webhook/coda/sessione).

Exec:

- `exec.process.completed`: esito del processo exec terminale, durata, target, modalità,
  codice di uscita e tipo di errore. Il testo del comando e le directory di lavoro non
  sono inclusi.

### Abilitare diagnostics (senza exporter)

Usa questo se vuoi che gli eventi diagnostics siano disponibili per Plugin o sink personalizzati:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flag Diagnostics (log mirati)

Usa i flag per attivare log di debug aggiuntivi e mirati senza aumentare `logging.level`.
I flag non distinguono maiuscole/minuscole e supportano wildcard (ad esempio `telegram.*` o `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Override via env (one-off):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Note:

- I log dei flag vanno nel file di log standard (uguale a `logging.file`).
- L'output viene comunque redatto secondo `logging.redactSensitive`.
- Guida completa: [/diagnostics/flags](/it/diagnostics/flags).

### Esportazione verso OpenTelemetry

Le Diagnostics possono essere esportate tramite il Plugin `diagnostics-otel` (OTLP/HTTP). Questo
funziona con qualsiasi collector/backend OpenTelemetry che accetti OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

Note:

- Puoi anche abilitare il Plugin con `openclaw plugins enable diagnostics-otel`.
- `protocol` al momento supporta solo `http/protobuf`. `grpc` viene ignorato.
- Le metriche includono uso token, costo, dimensione del contesto, durata dell'esecuzione e
  contatori/istogrammi del flusso messaggi (webhook, accodamento, stato sessione, profondità/attesa coda).
- Trace/metriche possono essere attivati/disattivati con `traces` / `metrics` (predefinito: attivi). Le trace
  includono span di utilizzo del modello più span di elaborazione webhook/messaggi quando abilitati.
- Il contenuto raw del modello/strumento non viene esportato per impostazione predefinita. Usa
  `diagnostics.otel.captureContent` solo quando collector e retention policy
  sono approvati per prompt, risposta, strumento o testo del system prompt.
- Imposta `headers` quando il tuo collector richiede autenticazione.
- Variabili d'ambiente supportate: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Imposta `OPENCLAW_OTEL_PRELOADED=1` quando un altro preload o processo host ha già
  registrato l'SDK globale OpenTelemetry. In quella modalità il Plugin non avvia
  né arresta il proprio SDK, ma collega comunque i listener diagnostici OpenClaw e
  rispetta `diagnostics.otel.traces`, `metrics` e `logs`.

### Metriche esportate (nomi + tipi)

Uso del modello:

- `openclaw.tokens` (counter, attributi: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attributi: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attributi: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attributi: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Flusso messaggi:

- `openclaw.webhook.received` (counter, attributi: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attributi: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attributi: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attributi: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attributi: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attributi: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attributi: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attributi:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

Code + sessioni:

- `openclaw.queue.lane.enqueue` (counter, attributi: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attributi: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attributi: `openclaw.lane` oppure
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attributi: `openclaw.lane`)
- `openclaw.session.state` (counter, attributi: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attributi: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attributi: `openclaw.state`)
- `openclaw.run.attempt` (counter, attributi: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (histogram, attributi: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Span esportati (nomi + attributi chiave)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

Quando l'acquisizione del contenuto è esplicitamente abilitata, gli span di modello/strumento possono includere anche attributi `openclaw.content.*` delimitati e redatti per le specifiche classi di contenuto a cui hai fatto opt-in.

### Campionamento + flush

- Campionamento delle trace: `diagnostics.otel.sampleRate` (0.0–1.0, solo span root).
- Intervallo di esportazione delle metriche: `diagnostics.otel.flushIntervalMs` (min 1000ms).

### Note sul protocollo

- Gli endpoint OTLP/HTTP possono essere impostati tramite `diagnostics.otel.endpoint` oppure
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Se l'endpoint contiene già `/v1/traces` o `/v1/metrics`, viene usato così com'è.
- Se l'endpoint contiene già `/v1/logs`, viene usato così com'è per i log.
- `OPENCLAW_OTEL_PRELOADED=1` riusa un SDK OpenTelemetry registrato esternamente
  per trace/metriche invece di avviare un NodeSDK posseduto dal Plugin.
- `diagnostics.otel.logs` abilita l'esportazione dei log OTLP per l'output del logger principale.

### Comportamento dell'esportazione dei log

- I log OTLP usano gli stessi record strutturati scritti in `logging.file`.
- Rispettano `logging.level` (livello dei log su file). La redazione della console **non** si applica
  ai log OTLP.
- Le installazioni ad alto volume dovrebbero preferire campionamento/filtraggio nel collector OTLP.

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Controlla che il Gateway sia in esecuzione e stia scrivendo nel percorso file
  indicato in `logging.file`.
- **Serve più dettaglio?** Imposta `logging.level` su `debug` o `trace` e riprova.

## Correlati

- [Gateway Logging Internals](/it/gateway/logging) — stili di log WS, prefissi dei sottosistemi e acquisizione della console
- [Diagnostics](/it/gateway/configuration-reference#diagnostics) — esportazione OpenTelemetry e configurazione delle trace della cache
