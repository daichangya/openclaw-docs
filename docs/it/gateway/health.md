---
read_when:
    - Diagnosi della connettività del canale o dello stato di salute del gateway
    - Capire i comandi CLI di health check e le opzioni
summary: Comandi di health check e monitoraggio dello stato di salute del gateway
title: Health check
x-i18n:
    generated_at: "2026-04-25T13:47:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

Guida rapida per verificare la connettività del canale senza andare a tentativi.

## Controlli rapidi

- `openclaw status` — riepilogo locale: raggiungibilità/modalità del gateway, suggerimento di aggiornamento, età dell'autenticazione del canale collegato, sessioni e attività recente.
- `openclaw status --all` — diagnosi locale completa (sola lettura, a colori, sicura da incollare per il debug).
- `openclaw status --deep` — chiede al gateway in esecuzione una probe di health live (`health` con `probe:true`), incluse probe per canale per account quando supportate.
- `openclaw health` — chiede al gateway in esecuzione il suo snapshot di health (solo WS; nessun socket di canale diretto dalla CLI).
- `openclaw health --verbose` — forza una probe di health live e stampa i dettagli della connessione del gateway.
- `openclaw health --json` — output dello snapshot di health leggibile da macchina.
- Invia `/status` come messaggio autonomo in WhatsApp/WebChat per ottenere una risposta di stato senza invocare l'agente.
- Log: fai tail di `/tmp/openclaw/openclaw-*.log` e filtra per `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostica approfondita

- Credenziali su disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (il valore mtime dovrebbe essere recente).
- Archivio sessioni: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (il percorso può essere sovrascritto nella configurazione). Conteggio e destinatari recenti vengono mostrati da `status`.
- Flusso di ricollegamento: `openclaw channels logout && openclaw channels login --verbose` quando nei log compaiono codici di stato 409–515 o `loggedOut`. (Nota: il flusso di login tramite QR riavvia automaticamente una volta per lo stato 515 dopo il pairing.)
- La diagnostica è abilitata per impostazione predefinita. Il gateway registra fatti operativi a meno che non sia impostato `diagnostics.enabled: false`. Gli eventi di memoria registrano conteggi in byte di RSS/heap, pressione di soglia e pressione di crescita. Gli eventi di payload troppo grandi registrano ciò che è stato rifiutato, troncato o suddiviso in blocchi, oltre a dimensioni e limiti quando disponibili. Non registrano il testo del messaggio, il contenuto degli allegati, il body del webhook, il body grezzo della richiesta o della risposta, token, cookie o valori segreti. Lo stesso Heartbeat avvia il registratore di stabilità limitato, disponibile tramite `openclaw gateway stability` o tramite la RPC del Gateway `diagnostics.stability`. Le uscite fatali del Gateway, i timeout di shutdown e gli errori di avvio al riavvio rendono persistente l'ultimo snapshot del registratore in `~/.openclaw/logs/stability/` quando esistono eventi; controlla il bundle salvato più recente con `openclaw gateway stability --bundle latest`.
- Per i bug report, esegui `openclaw gateway diagnostics export` e allega il file zip generato. L'export combina un riepilogo Markdown, il bundle di stabilità più recente, metadati dei log sanitizzati, snapshot sanitizzati di stato/health del Gateway e forma della configurazione. È pensato per essere condiviso: testo della chat, body dei webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggi e valori segreti vengono omessi o redatti. Vedi [Export della diagnostica](/it/gateway/diagnostics).

## Configurazione del monitor di health

- `gateway.channelHealthCheckMinutes`: frequenza con cui il gateway controlla la health del canale. Predefinito: `5`. Imposta `0` per disabilitare globalmente i riavvii del monitor di health.
- `gateway.channelStaleEventThresholdMinutes`: per quanto tempo un canale connesso può restare inattivo prima che il monitor di health lo consideri stale e lo riavvii. Predefinito: `30`. Mantieni questo valore maggiore o uguale a `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: limite mobile di un'ora per i riavvii del monitor di health per canale/account. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: disabilita i riavvii del monitor di health per un canale specifico lasciando abilitato il monitoraggio globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-account che ha la precedenza sull'impostazione a livello canale.
- Questi override per canale si applicano ai monitor dei canali integrati che oggi li espongono: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram e WhatsApp.

## Quando qualcosa fallisce

- `logged out` o stato 409–515 → ricollega con `openclaw channels logout` poi `openclaw channels login`.
- Gateway irraggiungibile → avvialo: `openclaw gateway --port 18789` (usa `--force` se la porta è occupata).
- Nessun messaggio in entrata → conferma che il telefono collegato sia online e che il mittente sia consentito (`channels.whatsapp.allowFrom`); per le chat di gruppo, assicurati che allowlist e regole di menzione corrispondano (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicato "health"

`openclaw health` chiede al gateway in esecuzione il suo snapshot di health (nessun socket di canale diretto dalla CLI). Per impostazione predefinita può restituire uno snapshot recente del gateway preso dalla cache; il gateway poi aggiorna quella cache in background. `openclaw health --verbose` forza invece una probe live. Il comando riporta credenziali collegate/età dell'autenticazione quando disponibili, riepiloghi delle probe per canale, riepilogo dell'archivio sessioni e durata della probe. Termina con codice non zero se il gateway è irraggiungibile o se la probe fallisce/va in timeout.

Opzioni:

- `--json`: output JSON leggibile da macchina
- `--timeout <ms>`: sovrascrive il timeout predefinito della probe di 10s
- `--verbose`: forza una probe live e stampa i dettagli della connessione del gateway
- `--debug`: alias di `--verbose`

Lo snapshot di health include: `ok` (booleano), `ts` (timestamp), `durationMs` (tempo della probe), stato per canale, disponibilità degli agenti e riepilogo dell'archivio sessioni.

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Export della diagnostica](/it/gateway/diagnostics)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
