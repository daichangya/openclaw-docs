---
read_when:
    - Modifica dell'output o dei formati di logging
    - Debug dell'output della CLI o del gateway
summary: Superfici di logging, log su file, stili di log WS e formattazione della console
title: Logging del Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c005cfc4cfe456b3734d3928a16c9cd131a2b465d46f2aba9c9c61db22dcc399
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Per una panoramica lato utente (CLI + UI di controllo + configurazione), vedi [/logging](/it/logging).

OpenClaw ha due “superfici” di log:

- **Output della console** (quello che vedi nel terminale / nella Debug UI).
- **Log su file** (righe JSON) scritti dal logger del gateway.

## Logger basato su file

- Il file di log rotante predefinito si trova in `/tmp/openclaw/` (un file al giorno): `openclaw-YYYY-MM-DD.log`
  - La data usa il fuso orario locale dell'host del gateway.
- I file di log attivi ruotano a `logging.maxFileBytes` (predefinito: 100 MB), mantenendo
  fino a cinque archivi numerati e continuando a scrivere in un nuovo file attivo.
- Il percorso del file di log e il livello possono essere configurati tramite `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Il formato del file è un oggetto JSON per riga.

La scheda Logs della UI di controllo esegue il tail di questo file tramite il gateway (`logs.tail`).
Anche la CLI può farlo:

```bash
openclaw logs --follow
```

**Verbose vs. livelli di log**

- I **log su file** sono controllati esclusivamente da `logging.level`.
- `--verbose` influisce solo sulla **verbosità della console** (e sullo stile dei log WS); **non**
  aumenta il livello dei log su file.
- Per acquisire nei log su file i dettagli visibili solo in modalità verbose, imposta `logging.level` su `debug` o
  `trace`.

## Acquisizione della console

La CLI intercetta `console.log/info/warn/error/debug/trace` e li scrive nei log su file,
continuando comunque a stamparli su stdout/stderr.

Puoi regolare la verbosità della console in modo indipendente tramite:

- `logging.consoleLevel` (predefinito `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redazione dei riepiloghi degli strumenti

I riepiloghi verbose degli strumenti (ad esempio `🛠️ Exec: ...`) possono mascherare i token sensibili prima che raggiungano
lo stream della console. Questo vale **solo per gli strumenti** e non altera i log su file.

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: array di stringhe regex (sovrascrive i valori predefiniti)
  - Usa stringhe regex raw (auto `gi`), oppure `/pattern/flags` se ti servono flag personalizzati.
  - Le corrispondenze vengono mascherate mantenendo i primi 6 + gli ultimi 4 caratteri (lunghezza >= 18), altrimenti `***`.
  - I valori predefiniti coprono assegnazioni comuni di chiavi, flag CLI, campi JSON, header bearer, blocchi PEM e prefissi di token diffusi.

## Log WebSocket del gateway

Il gateway stampa i log del protocollo WebSocket in due modalità:

- **Modalità normale** (senza `--verbose`): vengono stampati solo i risultati RPC “interessanti”:
  - errori (`ok=false`)
  - chiamate lente (soglia predefinita: `>= 50ms`)
  - errori di parsing
- **Modalità verbose** (`--verbose`): stampa tutto il traffico WS di richiesta/risposta.

### Stile dei log WS

`openclaw gateway` supporta un selettore di stile per gateway:

- `--ws-log auto` (predefinito): la modalità normale è ottimizzata; la modalità verbose usa output compatto
- `--ws-log compact`: output compatto (richiesta/risposta accoppiate) in modalità verbose
- `--ws-log full`: output completo per frame in modalità verbose
- `--compact`: alias di `--ws-log compact`

Esempi:

```bash
# ottimizzato (solo errori/lentezza)
openclaw gateway

# mostra tutto il traffico WS (accoppiato)
openclaw gateway --verbose --ws-log compact

# mostra tutto il traffico WS (metadati completi)
openclaw gateway --verbose --ws-log full
```

## Formattazione della console (logging del sottosistema)

Il formatter della console è **consapevole del TTY** e stampa righe coerenti con prefisso.
I logger dei sottosistemi mantengono l'output raggruppato e facile da scorrere.

Comportamento:

- **Prefissi del sottosistema** su ogni riga (ad esempio `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colori del sottosistema** (stabili per sottosistema) più colorazione del livello
- **Colore quando l'output è un TTY o l'ambiente sembra un terminale avanzato** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), con rispetto di `NO_COLOR`
- **Prefissi del sottosistema abbreviati**: rimuove `gateway/` + `channels/` iniziali, mantiene gli ultimi 2 segmenti (ad esempio `whatsapp/outbound`)
- **Sotto-logger per sottosistema** (prefisso automatico + campo strutturato `{ subsystem }`)
- **`logRaw()`** per output QR/UX (senza prefisso, senza formattazione)
- **Stili della console** (ad esempio `pretty | compact | json`)
- **Livello di log della console** separato dal livello di log su file (il file mantiene il dettaglio completo quando `logging.level` è impostato su `debug`/`trace`)
- **I corpi dei messaggi WhatsApp** vengono registrati a livello `debug` (usa `--verbose` per vederli)

Questo mantiene stabili i log su file esistenti rendendo allo stesso tempo più leggibile l'output interattivo.

## Correlati

- [Logging](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry)
- [Esportazione diagnostica](/it/gateway/diagnostics)
