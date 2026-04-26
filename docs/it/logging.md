---
read_when:
    - Hai bisogno di una panoramica del logging di OpenClaw adatta ai principianti
    - Vuoi configurare livelli di log, formati o redazione
    - Stai risolvendo un problema e hai bisogno di trovare rapidamente i log
summary: Log file, output della console, tailing CLI e scheda Logs della Control UI
title: Logging
x-i18n:
    generated_at: "2026-04-26T11:32:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClaw ha due superfici principali di log:

- **Log file** (righe JSON) scritti dal Gateway.
- **Output della console** mostrato nei terminali e nella UI di debug del Gateway.

La scheda **Logs** della Control UI esegue il tail del log file del gateway. Questa pagina spiega dove
si trovano i log, come leggerli e come configurare livelli e formati di log.

## Dove si trovano i log

Per impostazione predefinita, il Gateway scrive un file di log rolling in:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La data usa il fuso orario locale dell'host gateway.

Ogni file ruota quando raggiunge `logging.maxFileBytes` (predefinito: 100 MB).
OpenClaw mantiene fino a cinque archivi numerati accanto al file attivo, come
`openclaw-YYYY-MM-DD.1.log`, e continua a scrivere in un nuovo file attivo invece di
sopprimere la diagnostica.

Puoi sovrascrivere questo comportamento in `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Come leggere i log

### CLI: tail live (consigliato)

Usa la CLI per eseguire il tail del file di log del gateway tramite RPC:

```bash
openclaw logs --follow
```

Opzioni utili attuali:

- `--local-time`: mostra i timestamp nel tuo fuso orario locale
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC standard del Gateway
- `--expect-final`: flag di attesa della risposta finale per RPC supportate da agente (accettato qui tramite il layer client condiviso)

Modalità di output:

- **Sessioni TTY**: righe di log strutturate, leggibili e colorate.
- **Sessioni non TTY**: testo semplice.
- `--json`: JSON delimitato da righe (un evento di log per riga).
- `--plain`: forza il testo semplice nelle sessioni TTY.
- `--no-color`: disabilita i colori ANSI.

Quando passi un `--url` esplicito, la CLI non applica automaticamente configurazione o
credenziali dell'ambiente; includi tu stesso `--token` se il Gateway di destinazione
richiede autenticazione.

In modalità JSON, la CLI emette oggetti con tag `type`:

- `meta`: metadati dello stream (file, cursore, dimensione)
- `log`: voce di log analizzata
- `notice`: suggerimenti di troncamento / rotazione
- `raw`: riga di log non analizzata

Se il Gateway loopback locale richiede pairing, `openclaw logs` usa come fallback
automaticamente il file di log locale configurato. Le destinazioni `--url` esplicite non
usano questo fallback.

Se il Gateway non è raggiungibile, la CLI stampa un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### Control UI (web)

La scheda **Logs** della Control UI esegue il tail dello stesso file usando `logs.tail`.
Vedi [/web/control-ui](/it/web/control-ui) per sapere come aprirla.

### Log solo canale

Per filtrare l'attività del canale (WhatsApp/Telegram/ecc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formati di log

### Log file (JSONL)

Ogni riga nel file di log è un oggetto JSON. La CLI e la Control UI analizzano queste
voci per mostrare output strutturato (ora, livello, sottosistema, messaggio).

### Output della console

I log della console sono **TTY-aware** e formattati per la leggibilità:

- Prefissi del sottosistema (ad es. `gateway/channels/whatsapp`)
- Colore per livello (info/warn/error)
- Modalità compatta o JSON facoltativa

La formattazione della console è controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` ha anche il logging del protocollo WebSocket per il traffico RPC:

- modalità normale: solo risultati interessanti (errori, errori di parsing, chiamate lente)
- `--verbose`: tutto il traffico richiesta/risposta
- `--ws-log auto|compact|full`: sceglie lo stile di rendering dettagliato
- `--compact`: alias di `--ws-log compact`

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

- `logging.level`: livello dei **log file** (JSONL).
- `logging.consoleLevel`: livello di verbosità della **console**.

Puoi sovrascrivere entrambi tramite la variabile d'ambiente **`OPENCLAW_LOG_LEVEL`** (ad es. `OPENCLAW_LOG_LEVEL=debug`). La variabile d'ambiente ha la precedenza sul file di configurazione, quindi puoi aumentare la verbosità per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l'opzione CLI globale **`--log-level <level>`** (ad esempio, `openclaw --log-level debug gateway run`), che sovrascrive la variabile d'ambiente per quel comando.

`--verbose` influisce solo sull'output della console e sulla verbosità del log WS; non cambia
i livelli dei log file.

### Stili della console

`logging.consoleStyle`:

- `pretty`: adatto alle persone, colorato, con timestamp.
- `compact`: output più compatto (ideale per sessioni lunghe).
- `json`: JSON per riga (per processori di log).

### Redazione

I riepiloghi degli strumenti possono redigere token sensibili prima che raggiungano la console:

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe regex per sovrascrivere l'insieme predefinito

La redazione si applica ai sink di logging per **output della console**, **diagnostica console instradata su stderr** e **log file**. I log file restano in JSONL, ma i
valori segreti corrispondenti vengono mascherati prima che la riga venga scritta su disco.

## Diagnostica e OpenTelemetry

La diagnostica è costituita da eventi strutturati e leggibili dalle macchine per le esecuzioni del modello e
la telemetria del flusso dei messaggi (webhook, accodamento, stato della sessione). **Non**
sostituiscono i log — alimentano metriche, trace ed exporter. Gli eventi vengono emessi
in-process indipendentemente dal fatto che tu li esporti o meno.

Due superfici adiacenti:

- **Export OpenTelemetry** — invia metriche, trace e log tramite OTLP/HTTP a
  qualsiasi collector o backend compatibile con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, ecc.). Configurazione completa, catalogo dei segnali,
  nomi di metriche/span, variabili d'ambiente e modello di privacy si trovano in una pagina dedicata:
  [Export OpenTelemetry](/it/gateway/opentelemetry).
- **Flag di diagnostica** — flag mirati per log di debug che instradano log extra a
  `logging.file` senza aumentare `logging.level`. I flag non distinguono tra maiuscole e minuscole
  e supportano wildcard (`telegram.*`, `*`). Configurali sotto `diagnostics.flags`
  o tramite l'override env `OPENCLAW_DIAGNOSTICS=...`. Guida completa:
  [Flag di diagnostica](/it/diagnostics/flags).

Per abilitare eventi diagnostici per Plugin o sink personalizzati senza export OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Per l'export OTLP verso un collector, vedi [Export OpenTelemetry](/it/gateway/opentelemetry).

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Verifica che il Gateway sia in esecuzione e stia scrivendo nel percorso del file
  in `logging.file`.
- **Ti servono più dettagli?** Imposta `logging.level` su `debug` o `trace` e riprova.

## Correlati

- [Export OpenTelemetry](/it/gateway/opentelemetry) — export OTLP/HTTP, catalogo metriche/span, modello di privacy
- [Flag di diagnostica](/it/diagnostics/flags) — flag mirati per log di debug
- [Interni del logging del Gateway](/it/gateway/logging) — stili di log WS, prefissi dei sottosistemi e cattura della console
- [Riferimento della configurazione](/it/gateway/configuration-reference#diagnostics) — riferimento completo dei campi `diagnostics.*`
