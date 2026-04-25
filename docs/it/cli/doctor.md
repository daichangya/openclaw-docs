---
read_when:
    - Hai problemi di connettività/autenticazione e vuoi correzioni guidate
    - Hai aggiornato e vuoi un controllo rapido di integrità
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Controlli di integrità + correzioni rapide per il Gateway e i canali.

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

- `--no-workspace-suggestions`: disabilita i suggerimenti di memoria/ricerca dello spazio di lavoro
- `--yes`: accetta i valori predefiniti senza chiedere conferma
- `--repair`: applica le riparazioni consigliate senza chiedere conferma
- `--fix`: alias di `--repair`
- `--force`: applica riparazioni aggressive, inclusa la sovrascrittura della configurazione di servizio personalizzata quando necessario
- `--non-interactive`: esegue senza prompt; solo migrazioni sicure
- `--generate-gateway-token`: genera e configura un token Gateway
- `--deep`: analizza i servizi di sistema per installazioni Gateway aggiuntive

Note:

- I prompt interattivi (come le correzioni keychain/OAuth) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (Cron, Telegram, nessun terminale) salteranno i prompt.
- Prestazioni: le esecuzioni non interattive di `doctor` saltano il caricamento anticipato dei Plugin, così i controlli di integrità headless restano rapidi. Le sessioni interattive continuano invece a caricare completamente i Plugin quando un controllo richiede il loro contributo.
- `--fix` (alias di `--repair`) scrive un backup in `~/.openclaw/openclaw.json.bak` e rimuove le chiavi di configurazione sconosciute, elencando ogni rimozione.
- I controlli di integrità dello stato ora rilevano i file di trascrizione orfani nella directory delle sessioni e possono archiviarli come `.deleted.<timestamp>` per recuperare spazio in sicurezza.
- Doctor analizza anche `~/.openclaw/cron/jobs.json` (o `cron.store`) alla ricerca di formati legacy dei job Cron e può riscriverli sul posto prima che il pianificatore debba normalizzarli automaticamente in fase di esecuzione.
- Doctor ripara le dipendenze runtime mancanti dei Plugin inclusi senza scrivere nelle installazioni globali pacchettizzate. Per installazioni npm possedute da root o unità systemd rafforzate, imposta `OPENCLAW_PLUGIN_STAGE_DIR` su una directory scrivibile come `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migra automaticamente la vecchia configurazione piatta di Talk (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`.
- Esecuzioni ripetute di `doctor --fix` non riportano né applicano più la normalizzazione di Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo di disponibilità della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali di embedding.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alta visibilità con indicazioni operative (`installa Docker` oppure `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti da SecretRef e non disponibili nel percorso di comando corrente, doctor segnala un avviso in sola lettura e non scrive credenziali di fallback in chiaro.
- Se l'ispezione di SecretRef del canale fallisce in un percorso di correzione, doctor continua e segnala un avviso invece di terminare in anticipo.
- La risoluzione automatica dei nomi utente Telegram in `allowFrom` (`doctor --fix`) richiede un token Telegram risolvibile nel percorso di comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e salta la risoluzione automatica per quell'esecuzione.

## macOS: override dell'ambiente `launchctl`

Se in precedenza hai eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oppure `...PASSWORD`), quel valore sovrascrive il tuo file di configurazione e può causare errori persistenti di “non autorizzato”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor del Gateway](/it/gateway/doctor)
