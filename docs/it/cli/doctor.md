---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi un controllo di integrità
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:25:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e2c21765f8c287c8d2aa066004ac516566c76a455337c377cf282551619e92a
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Controlli di integrità + correzioni rapide per il gateway e i canali.

Correlati:

- Risoluzione dei problemi: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Audit di sicurezza: [Sicurezza](/it/gateway/security)

## Esempi

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opzioni

- `--no-workspace-suggestions`: disabilita i suggerimenti per memoria/ricerca del workspace
- `--yes`: accetta i valori predefiniti senza chiedere conferma
- `--repair`: applica le riparazioni consigliate senza chiedere conferma
- `--fix`: alias di `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione di servizio personalizzata quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure
- `--generate-gateway-token`: genera e configura un token gateway
- `--deep`: analizza i servizi di sistema per installazioni gateway aggiuntive

Note:

- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (Cron, Telegram, nessun terminale) saltano i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei Plugin, così i controlli di integrità headless restano rapidi. Le sessioni interattive continuano comunque a caricare completamente i Plugin quando un controllo richiede il loro contributo.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove le chiavi di configurazione sconosciute, elencando ogni rimozione.
- I controlli di integrità dello stato ora rilevano i file transcript orfani nella directory delle sessioni e possono archiviarli come `.deleted.<timestamp>` per recuperare spazio in sicurezza.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) per trovare formati legacy dei processi cron e può riscriverli sul posto prima che lo scheduler debba auto-normalizzarli in fase di runtime.
- Doctor ripara le dipendenze runtime mancanti dei Plugin inclusi senza scrivere nelle installazioni globali pacchettizzate. Per installazioni npm di proprietà root o unità systemd rinforzate, imposta `OPENCLAW_PLUGIN_STAGE_DIR` su una directory scrivibile come `/var/lib/openclaw/plugin-runtime-deps`.
- Imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore gestisce il ciclo di vita del gateway. Doctor continua a segnalare l'integrità del gateway/servizio e applica le riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio e pulizia dei servizi legacy.
- Doctor migra automaticamente la configurazione piatta legacy di Talk (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione di Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di disponibilità della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alto segnale con correzione consigliata (`install Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso del comando corrente, doctor segnala un avviso in sola lettura e non scrive credenziali di fallback in chiaro.
- Se l'ispezione SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di uscire anticipatamente.
- L'auto-risoluzione dei nomi utente Telegram `allowFrom` (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta l'auto-risoluzione per quel passaggio.

## macOS: override env `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), quel valore sovrascrive il file di configurazione e può causare errori persistenti di tipo “unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor del Gateway](/it/gateway/doctor)
