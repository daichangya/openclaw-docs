---
read_when:
    - Preparare una segnalazione di bug o una richiesta di supporto
    - Debug di crash del Gateway, riavvii, pressione di memoria o payload sovradimensionati
    - Esaminare quali dati diagnostici vengono registrati o oscurati
summary: Crea bundle diagnostici del Gateway condivisibili per le segnalazioni di bug
title: Esportazione diagnostica
x-i18n:
    generated_at: "2026-04-26T11:28:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw può creare un file zip diagnostico locale sicuro da allegare alle
segnalazioni di bug. Combina stato del Gateway, health, log, forma della configurazione e
recenti eventi di stabilità senza payload, tutti sanificati.

## Avvio rapido

```bash
openclaw gateway diagnostics export
```

Il comando stampa il percorso del file zip scritto. Per scegliere un percorso:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Per l'automazione:

```bash
openclaw gateway diagnostics export --json
```

## Cosa contiene l'esportazione

Il file zip include:

- `summary.md`: panoramica leggibile da umani per il supporto.
- `diagnostics.json`: riepilogo leggibile da macchina di configurazione, log, stato, health
  e dati di stabilità.
- `manifest.json`: metadati dell'esportazione ed elenco dei file.
- Forma della configurazione sanificata e dettagli della configurazione non segreti.
- Riepiloghi dei log sanificati e recenti righe di log oscurate.
- Snapshot best-effort di stato e health del Gateway.
- `stability/latest.json`: bundle di stabilità persistito più recente, quando disponibile.

L'esportazione è utile anche quando il Gateway non è in buona salute. Se il Gateway non può
rispondere alle richieste di stato o health, i log locali, la forma della configurazione e l'ultimo
bundle di stabilità vengono comunque raccolti, quando disponibili.

## Modello di privacy

Le diagnostiche sono progettate per essere condivisibili. L'esportazione conserva dati operativi
utili per il debug, come:

- nomi dei sottosistemi, ID Plugin, ID provider, ID canale e modalità configurate
- codici di stato, durate, conteggi di byte, stato della queue e letture di memoria
- metadati dei log sanificati e messaggi operativi oscurati
- forma della configurazione e impostazioni di funzionalità non segrete

L'esportazione omette o oscura:

- testo della chat, prompt, istruzioni, corpi Webhook e output degli strumenti
- credenziali, chiavi API, token, cookie e valori segreti
- corpi grezzi di richieste o risposte
- ID account, ID messaggio, ID sessione grezzi, nomi host e nomi utente locali

Quando un messaggio di log sembra testo di payload utente, chat, prompt o strumento,
l'esportazione conserva solo l'informazione che un messaggio è stato omesso e il conteggio dei byte.

## Recorder di stabilità

Il Gateway registra per impostazione predefinita un flusso di stabilità limitato e senza payload quando
le diagnostiche sono abilitate. È pensato per fatti operativi, non per contenuti.

Ispeziona il recorder live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Ispeziona il bundle di stabilità persistito più recente dopo un'uscita fatale, un timeout di shutdown
o un errore di avvio dopo riavvio:

```bash
openclaw gateway stability --bundle latest
```

Crea un file zip diagnostico a partire dal bundle persistito più recente:

```bash
openclaw gateway stability --bundle latest --export
```

I bundle persistiti si trovano sotto `~/.openclaw/logs/stability/` quando esistono eventi.

## Opzioni utili

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: scrive in un percorso zip specifico.
- `--log-lines <count>`: numero massimo di righe di log sanificate da includere.
- `--log-bytes <bytes>`: numero massimo di byte di log da ispezionare.
- `--url <url>`: URL WebSocket del Gateway per snapshot di stato e health.
- `--token <token>`: token del Gateway per snapshot di stato e health.
- `--password <password>`: password del Gateway per snapshot di stato e health.
- `--timeout <ms>`: timeout per gli snapshot di stato e health.
- `--no-stability-bundle`: salta la ricerca del bundle di stabilità persistito.
- `--json`: stampa metadati di esportazione leggibili da macchina.

## Disabilitare le diagnostiche

Le diagnostiche sono abilitate per impostazione predefinita. Per disabilitare il recorder di stabilità e
la raccolta degli eventi diagnostici:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

La disattivazione delle diagnostiche riduce il livello di dettaglio delle segnalazioni di bug. Non influisce sul normale
logging del Gateway.

## Correlati

- [Controlli health](/it/gateway/health)
- [CLI del Gateway](/it/cli/gateway#gateway-diagnostics-export)
- [Protocollo del Gateway](/it/gateway/protocol#system-and-identity)
- [Logging](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — flusso separato per inviare diagnostiche in streaming a un collector
