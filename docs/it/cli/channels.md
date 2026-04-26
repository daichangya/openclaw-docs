---
read_when:
    - Vuoi aggiungere/rimuovere account di canale (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Vuoi controllare lo stato del canale o seguire i log del canale in tempo reale
summary: Riferimento CLI per `openclaw channels` (account, stato, accesso/uscita, log)
title: Canali
x-i18n:
    generated_at: "2026-04-26T12:24:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gestisci gli account dei canali di chat e il loro stato di runtime sul Gateway.

Documentazione correlata:

- Guide ai canali: [Canali](/it/channels/index)
- Configurazione del Gateway: [Configurazione](/it/gateway/configuration)

## Comandi comuni

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Stato / capacità / risoluzione / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (solo con `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` è il percorso live: su un gateway raggiungibile esegue controlli `probeAccount` per account e, facoltativamente, `auditAccount`, quindi l'output può includere lo stato del trasporto più risultati del probe come `works`, `probe failed`, `audit ok` o `audit failed`.
Se il gateway non è raggiungibile, `channels status` torna a riepiloghi basati solo sulla configurazione invece di mostrare l'output del probe live.

## Aggiungere / rimuovere account

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Suggerimento: `openclaw channels add --help` mostra i flag specifici per canale (token, chiave privata, app token, percorsi signal-cli, ecc.).

Le superfici comuni di aggiunta non interattiva includono:

- canali con bot token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campi di trasporto Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campi Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campi Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campi Nostr: `--private-key`, `--relay-urls`
- campi Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` per l'autenticazione supportata, basata su variabili d'ambiente, dell'account predefinito

Se durante un comando di aggiunta guidato da flag è necessario installare un Plugin del canale, OpenClaw usa la sorgente di installazione predefinita del canale senza aprire il prompt interattivo di installazione del Plugin.

Quando esegui `openclaw channels add` senza flag, la procedura guidata interattiva può richiedere:

- gli ID account per ogni canale selezionato
- nomi visualizzati facoltativi per quegli account
- `Associare ora gli account di canale configurati agli agenti?`

Se confermi l'associazione immediata, la procedura guidata chiede quale agente debba possedere ogni account di canale configurato e scrive associazioni di instradamento con ambito account.

Puoi anche gestire le stesse regole di instradamento in seguito con `openclaw agents bindings`, `openclaw agents bind` e `openclaw agents unbind` (vedi [agents](/it/cli/agents)).

Quando aggiungi un account non predefinito a un canale che usa ancora impostazioni di livello superiore per account singolo, OpenClaw promuove i valori di livello superiore con ambito account nella mappa degli account del canale prima di scrivere il nuovo account. La maggior parte dei canali inserisce questi valori in `channels.<channel>.accounts.default`, ma i canali inclusi possono invece preservare un account promosso esistente corrispondente. Matrix è l'esempio attuale: se esiste già un account con nome, oppure `defaultAccount` punta a un account con nome esistente, la promozione preserva quell'account invece di creare un nuovo `accounts.default`.

Il comportamento di instradamento rimane coerente:

- Le associazioni esistenti solo-canale (senza `accountId`) continuano a corrispondere all'account predefinito.
- `channels add` non crea né riscrive automaticamente le associazioni in modalità non interattiva.
- La configurazione interattiva può facoltativamente aggiungere associazioni con ambito account.

Se la tua configurazione era già in uno stato misto (account con nome presenti e valori singoli di livello superiore ancora impostati), esegui `openclaw doctor --fix` per spostare i valori con ambito account nell'account promosso scelto per quel canale. La maggior parte dei canali promuove in `accounts.default`; Matrix può preservare invece una destinazione con nome/predefinita esistente.

## Accesso / uscita (interattivo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Note:

- `channels login` supporta `--verbose`.
- `channels login` / `logout` possono dedurre il canale quando è configurata una sola destinazione di accesso supportata.

## Risoluzione dei problemi

- Esegui `openclaw status --deep` per un probe ampio.
- Usa `openclaw doctor` per correzioni guidate.
- `openclaw channels list` stampa `Claude: HTTP 403 ... user:profile` → l'istantanea di utilizzo richiede l'ambito `user:profile`. Usa `--no-usage`, oppure fornisci una chiave di sessione claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), oppure autentìcati di nuovo tramite Claude CLI.
- `openclaw channels status` torna a riepiloghi basati solo sulla configurazione quando il gateway non è raggiungibile. Se una credenziale di canale supportata è configurata tramite SecretRef ma non è disponibile nel percorso di comando corrente, segnala quell'account come configurato con note di degrado invece di mostrarlo come non configurato.

## Probe delle capacità

Recupera suggerimenti sulle capacità del provider (intent/ambiti, dove disponibili) più il supporto statico delle funzionalità:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Note:

- `--channel` è facoltativo; omettilo per elencare ogni canale (incluse le estensioni).
- `--account` è valido solo con `--channel`.
- `--target` accetta `channel:<id>` o un ID canale numerico grezzo e si applica solo a Discord.
- I probe sono specifici del provider: intent Discord + permessi del canale facoltativi; ambiti bot + utente Slack; flag bot + Webhook Telegram; versione del demone Signal; app token Microsoft Teams + ruoli/ambiti Graph (annotati dove noti). I canali senza probe riportano `Probe: unavailable`.

## Risolvere nomi in ID

Risolvi nomi di canale/utente in ID usando la directory del provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Note:

- Usa `--kind user|group|auto` per forzare il tipo di destinazione.
- La risoluzione preferisce le corrispondenze attive quando più voci condividono lo stesso nome.
- `channels resolve` è in sola lettura. Se un account selezionato è configurato tramite SecretRef ma quella credenziale non è disponibile nel percorso di comando corrente, il comando restituisce risultati degradati non risolti con note invece di interrompere l'intera esecuzione.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica dei canali](/it/channels)
