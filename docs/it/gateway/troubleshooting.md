---
read_when:
    - L'hub di risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Hai bisogno di sezioni del runbook stabili e basate sui sintomi con comandi esatti
summary: Runbook di troubleshooting approfondito per Gateway, canali, automazione, Node e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-04-20T08:30:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d93a82407dbb1314b91a809ff9433114e1e9a3b56d46547ef53a8196bac06260
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi del Gateway

Questa pagina è il runbook approfondito.
Inizia da [/help/troubleshooting](/it/help/troubleshooting) se vuoi prima il flusso di triage rapido.

## Sequenza di comandi

Esegui prima questi, in questo ordine:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Segnali attesi di stato sano:

- `openclaw gateway status` mostra `Runtime: running`, `Connectivity probe: ok` e una riga `Capability: ...`.
- `openclaw doctor` non segnala problemi bloccanti di configurazione/servizio.
- `openclaw channels status --probe` mostra lo stato di trasporto live per account e,
  dove supportato, risultati di probe/audit come `works` o `audit ok`.

## Anthropic 429: utilizzo extra richiesto per contesto lungo

Usa questa sezione quando i log/errori includono:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cerca:

- Il modello Anthropic Opus/Sonnet selezionato ha `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea per l'uso del contesto lungo.
- Le richieste falliscono solo su sessioni lunghe/esecuzioni del modello che richiedono il percorso beta da 1M.

Opzioni di correzione:

1. Disabilita `context1m` per quel modello in modo da tornare alla finestra di contesto normale.
2. Usa una credenziale Anthropic idonea per le richieste a contesto lungo, oppure passa a una chiave API Anthropic.
3. Configura modelli di fallback in modo che le esecuzioni continuino quando le richieste Anthropic a contesto lungo vengono rifiutate.

Correlati:

- [/providers/anthropic](/it/providers/anthropic)
- [/reference/token-use](/it/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/it/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Il backend locale compatibile con OpenAI supera i probe diretti ma le esecuzioni dell'agente falliscono

Usa questa sezione quando:

- `curl ... /v1/models` funziona
- piccole chiamate dirette a `/v1/chat/completions` funzionano
- le esecuzioni del modello OpenClaw falliscono solo nei normali turni dell'agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cerca:

- le piccole chiamate dirette hanno esito positivo, ma le esecuzioni OpenClaw falliscono solo con prompt più grandi
- errori del backend su `messages[].content` che si aspetta una stringa
- crash del backend che compaiono solo con conteggi di token del prompt più elevati o con i prompt completi del runtime dell'agente

Firme comuni:

- `messages[...].content: invalid type: sequence, expected a string` → il backend
  rifiuta le parti strutturate del contenuto di Chat Completions. Correzione: imposta
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- le piccole richieste dirette hanno esito positivo, ma i turni dell'agente OpenClaw falliscono con
  crash del backend/modello (per esempio Gemma su alcune build `inferrs`) → il trasporto OpenClaw è
  probabilmente già corretto; è il backend che fallisce sulla forma più ampia del prompt
  del runtime dell'agente.
- i fallimenti si riducono dopo aver disabilitato i tool ma non scompaiono → gli schemi dei tool erano
  parte della pressione, ma il problema residuo è comunque a monte: capacità del modello/server
  o un bug del backend.

Opzioni di correzione:

1. Imposta `compat.requiresStringContent: true` per i backend Chat Completions che accettano solo stringhe.
2. Imposta `compat.supportsTools: false` per modelli/backend che non riescono a gestire
   in modo affidabile la superficie dello schema dei tool di OpenClaw.
3. Riduci la pressione del prompt dove possibile: bootstrap dello workspace più piccolo, cronologia
   della sessione più corta, modello locale più leggero o un backend con supporto più solido
   per il contesto lungo.
4. Se le piccole richieste dirette continuano a funzionare mentre i turni dell'agente OpenClaw continuano a bloccarsi
   nel backend, trattalo come un limite del server/modello a monte e apri lì
   un repro con la forma del payload accettata.

Correlati:

- [/gateway/local-models](/it/gateway/local-models)
- [/gateway/configuration](/it/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/it/gateway/configuration-reference#openai-compatible-endpoints)

## Nessuna risposta

Se i canali sono attivi ma non arriva alcuna risposta, controlla instradamento e policy prima di riconnettere qualsiasi cosa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cerca:

- Pairing in sospeso per i mittenti DM.
- Blocco per menzione nei gruppi (`requireMention`, `mentionPatterns`).
- Mancate corrispondenze nelle allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato fino a menzione.
- `pairing request` → il mittente necessita approvazione.
- `blocked` / `allowlist` → mittente/canale filtrato dalla policy.

Correlati:

- [/channels/troubleshooting](/it/channels/troubleshooting)
- [/channels/pairing](/it/channels/pairing)
- [/channels/groups](/it/channels/groups)

## Connettività della control UI della dashboard

Quando la dashboard/control UI non si connette, verifica URL, modalità di autenticazione e presupposti di contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cerca:

- URL del probe e URL della dashboard corretti.
- Mancata corrispondenza della modalità/token di autenticazione tra client e Gateway.
- Uso di HTTP dove è richiesta l'identità del dispositivo.

Firme comuni:

- `device identity required` → contesto non sicuro o autenticazione del dispositivo mancante.
- `origin not allowed` → l'`Origin` del browser non è in `gateway.controlUi.allowedOrigins`
  (oppure stai effettuando la connessione da un'origine browser non loopback senza una
  allowlist esplicita).
- `device nonce required` / `device nonce mismatch` → il client non completa il
  flusso di autenticazione del dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato
  (o con timestamp obsoleto) per l'handshake corrente.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può eseguire un solo retry affidabile con il token dispositivo in cache.
- Quel retry con token in cache riutilizza l'insieme di scope in cache memorizzato con il
  token del dispositivo associato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece
  l'insieme di scope richiesto.
- Al di fuori di quel percorso di retry, la precedenza dell'autenticazione in connessione è
  prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo memorizzato,
  quindi token bootstrap.
- Nel percorso asincrono della Control UI Tailscale Serve, i tentativi falliti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limitatore registri il fallimento. Due retry concorrenti errati dello stesso client possono quindi mostrare `retry later`
  al secondo tentativo invece di due semplici mismatch.
- `too many failed authentication attempts (retry later)` da un client loopback con origine browser
  → i fallimenti ripetuti da quello stesso `Origin` normalizzato vengono bloccati temporaneamente; un'altra origine localhost usa un bucket separato.
- `unauthorized` ripetuti dopo quel retry → deriva di token condiviso/token dispositivo; aggiorna la configurazione del token e riapprova/ruota il token dispositivo se necessario.
- `gateway connect failed:` → host/porta/URL di destinazione errati.

### Mappa rapida dei codici di dettaglio auth

Usa `error.details.code` dalla risposta `connect` fallita per scegliere l'azione successiva:

| Detail code                  | Meaning                                                                                                                                                                                      | Recommended action                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso richiesto.                                                                                                                                        | Incolla/imposta il token nel client e riprova. Per i percorsi dashboard: `openclaw config get gateway.auth.token` poi incollalo nelle impostazioni della Control UI.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrisponde al token auth del Gateway.                                                                                                                                | Se `canRetryWithDeviceToken=true`, consenti un retry affidabile. I retry con token in cache riutilizzano gli scope approvati memorizzati; i chiamanti con `deviceToken` / `scopes` espliciti mantengono gli scope richiesti. Se continua a fallire, esegui la [checklist di ripristino deriva token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per-dispositivo in cache è obsoleto o revocato.                                                                                                                                     | Ruota/riapprova il token dispositivo usando la [CLI dei dispositivi](/cli/devices), poi riconnettiti.                                                                                                                                                                                  |
| `PAIRING_REQUIRED`           | L'identità del dispositivo richiede approvazione. Controlla `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, e usa `requestId` / `remediationHint` quando presenti. | Approva la richiesta in sospeso: `openclaw devices list` poi `openclaw devices approve <requestId>`. Gli upgrade di scope/ruolo usano lo stesso flusso dopo aver esaminato l'accesso richiesto.                                                                                       |

Controllo della migrazione auth dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se i log mostrano errori di nonce/firma, aggiorna il client che si connette e verifica che:

1. attenda `connect.challenge`
2. firmi il payload associato alla challenge
3. invii `connect.params.device.nonce` con lo stesso nonce della challenge

Se `openclaw devices rotate` / `revoke` / `remove` viene negato in modo imprevisto:

- le sessioni con token di dispositivo associato possono gestire solo **il proprio**
  dispositivo a meno che il chiamante non abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo scope operatore che
  la sessione chiamante possiede già

Correlati:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/it/gateway/configuration) (modalità auth del Gateway)
- [/gateway/trusted-proxy-auth](/it/gateway/trusted-proxy-auth)
- [/gateway/remote](/it/gateway/remote)
- [/cli/devices](/cli/devices)

## Servizio Gateway non in esecuzione

Usa questa sezione quando il servizio è installato ma il processo non rimane attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # esegue anche la scansione dei servizi a livello di sistema
```

Cerca:

- `Runtime: stopped` con indicazioni sull'uscita.
- Mancata corrispondenza della configurazione del servizio (`Config (cli)` vs `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks aggiuntive quando viene usato `--deep`.
- Indicazioni di pulizia `Other gateway-like services detected (best effort)`.

Firme comuni:

- `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → la modalità Gateway locale non è abilitata, oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella tua configurazione, oppure esegui di nuovo `openclaw onboard --mode local` / `openclaw setup` per ripristinare la configurazione prevista per la modalità locale. Se stai eseguendo OpenClaw tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non loopback senza un percorso auth Gateway valido (token/password, oppure trusted-proxy dove configurato).
- `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
- `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. La maggior parte delle configurazioni dovrebbe mantenere un solo Gateway per macchina; se te ne serve più di uno, isola porte + configurazione/stato/workspace. Vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).

Correlati:

- [/gateway/background-process](/it/gateway/background-process)
- [/gateway/configuration](/it/gateway/configuration)
- [/gateway/doctor](/it/gateway/doctor)

## Avvisi del probe del Gateway

Usa questa sezione quando `openclaw gateway probe` raggiunge qualcosa, ma stampa comunque un blocco di avviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cerca:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda fallback SSH, più Gateway, scope mancanti o riferimenti auth non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH non è riuscita, ma il comando ha comunque provato i target diretti configurati/loopback.
- `multiple reachable gateways detected` → ha risposto più di un target. Di solito questo indica una configurazione multi-Gateway intenzionale o listener obsoleti/duplicati.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione ha funzionato, ma il dettaglio RPC è limitato dagli scope; associa l'identità del dispositivo o usa credenziali con `operator.read`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → il Gateway ha risposto, ma questo client necessita ancora di pairing/approvazione prima del normale accesso operatore.
- testo di avviso SecretRef `gateway.auth.*` / `gateway.remote.*` non risolto → il materiale auth non era disponibile in questo percorso di comando per il target non riuscito.

Correlati:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host)
- [/gateway/remote](/it/gateway/remote)

## Il canale è connesso ma i messaggi non fluiscono

Se lo stato del canale è connesso ma il flusso dei messaggi è fermo, concentrati su policy, permessi e regole di consegna specifiche del canale.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Cerca:

- Policy DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist dei gruppi e requisiti di menzione.
- Permessi/scope API del canale mancanti.

Firme comuni:

- `mention required` → messaggio ignorato dalla policy di menzione del gruppo.
- tracce `pairing` / approvazione in sospeso → il mittente non è approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di auth/permessi del canale.

Correlati:

- [/channels/troubleshooting](/it/channels/troubleshooting)
- [/channels/whatsapp](/it/channels/whatsapp)
- [/channels/telegram](/it/channels/telegram)
- [/channels/discord](/it/channels/discord)

## Consegna di Cron e Heartbeat

Se Cron o Heartbeat non sono stati eseguiti o non hanno recapitato nulla, verifica prima lo stato dello scheduler, poi la destinazione della consegna.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cerca:

- Cron abilitato e prossima attivazione presente.
- Stato della cronologia delle esecuzioni del job (`ok`, `skipped`, `error`).
- Motivi di salto di Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firme comuni:

- `cron: scheduler disabled; jobs will not run automatically` → Cron disabilitato.
- `cron: timer tick failed` → tick dello scheduler non riuscito; controlla errori di file/log/runtime.
- `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra di ore attive.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote / intestazioni markdown, quindi OpenClaw salta la chiamata al modello.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è in scadenza in questo tick.
- `heartbeat: unknown accountId` → account id non valido per la destinazione di consegna di Heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → la destinazione di Heartbeat è stata risolta in una destinazione di tipo DM mentre `agents.defaults.heartbeat.directPolicy` (o l'override per agente) è impostato su `block`.

Correlati:

- [/automation/cron-jobs#troubleshooting](/it/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/it/automation/cron-jobs)
- [/gateway/heartbeat](/it/gateway/heartbeat)

## Il tool del Node associato fallisce

Se un Node è associato ma i tool falliscono, isola lo stato di foreground, permessi e approvazione.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cerca:

- Node online con le capability previste.
- Permessi OS concessi per fotocamera/microfono/posizione/schermo.
- Stato delle approvazioni exec e dell'allowlist.

Firme comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l'app del Node deve essere in foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permesso OS mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dall'allowlist.

Correlati:

- [/nodes/troubleshooting](/it/nodes/troubleshooting)
- [/nodes/index](/it/nodes/index)
- [/tools/exec-approvals](/it/tools/exec-approvals)

## Il tool browser fallisce

Usa questa sezione quando le azioni del tool browser falliscono anche se il Gateway stesso è sano.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cerca:

- Se `plugins.allow` è impostato e include `browser`.
- Percorso eseguibile del browser valido.
- Raggiungibilità del profilo CDP.
- Disponibilità di Chrome locale per i profili `existing-session` / `user`.

Firme comuni:

- `unknown command "browser"` o `unknown command 'browser'` → il Plugin browser integrato è escluso da `plugins.allow`.
- tool browser mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il Plugin non è mai stato caricato.
- `Failed to start Chrome CDP on port` → il processo del browser non è riuscito ad avviarsi.
- `browser.executablePath not found` → il percorso configurato non è valido.
- `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato come `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta errata o fuori intervallo.
- `No Chrome tabs found for profile="user"` → il profilo di collegamento Chrome MCP non ha schede Chrome locali aperte.
- `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host Gateway.
- `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo solo attach non ha un target raggiungibile, oppure l'endpoint HTTP ha risposto ma il WebSocket CDP non può comunque essere aperto.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione corrente del Gateway non include il pacchetto completo di Playwright; gli snapshot ARIA e gli screenshot di pagina di base possono comunque funzionare, ma navigazione, snapshot AI, screenshot di elementi con selettori CSS ed esportazione PDF restano non disponibili.
- `fullPage is not supported for element screenshots` → la richiesta di screenshot ha combinato `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate di screenshot Chrome MCP / `existing-session` devono usare l'acquisizione della pagina o un `--ref` da snapshot, non `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di upload file di Chrome MCP richiedono riferimenti snapshot, non selettori CSS.
- `existing-session file uploads currently support one file at a time.` → invia un upload per chiamata sui profili Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → gli hook di dialogo sui profili Chrome MCP non supportano override di timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP raw.
- override obsoleti di viewport / dark mode / locale / offline su profili solo attach o CDP remoti → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero Gateway.

Correlati:

- [/tools/browser-linux-troubleshooting](/it/tools/browser-linux-troubleshooting)
- [/tools/browser](/it/tools/browser)

## Se hai aggiornato e qualcosa si è rotto improvvisamente

La maggior parte dei problemi dopo un aggiornamento è dovuta a deriva della configurazione o a impostazioni predefinite più rigide ora applicate.

### 1) Il comportamento di auth e override URL è cambiato

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Cosa controllare:

- Se `gateway.mode=remote`, le chiamate CLI potrebbero puntare al remoto mentre il tuo servizio locale funziona correttamente.
- Le chiamate esplicite con `--url` non usano fallback alle credenziali memorizzate.

Firme comuni:

- `gateway connect failed:` → target URL errato.
- `unauthorized` → endpoint raggiungibile ma auth errata.

### 2) I guardrail di bind e auth sono più rigidi

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Cosa controllare:

- I bind non loopback (`lan`, `tailnet`, `custom`) richiedono un percorso auth Gateway valido: auth con token/password condivisi, oppure un deployment `trusted-proxy` non loopback configurato correttamente.
- Chiavi vecchie come `gateway.token` non sostituiscono `gateway.auth.token`.

Firme comuni:

- `refusing to bind gateway ... without auth` → bind non loopback senza un percorso auth Gateway valido.
- `Connectivity probe: failed` mentre il runtime è in esecuzione → Gateway attivo ma inaccessibile con auth/URL correnti.

### 3) Lo stato di pairing e identità del dispositivo è cambiato

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Cosa controllare:

- Approvazioni dispositivo in sospeso per dashboard/Node.
- Approvazioni pairing DM in sospeso dopo modifiche di policy o identità.

Firme comuni:

- `device identity required` → auth dispositivo non soddisfatta.
- `pairing required` → mittente/dispositivo deve essere approvato.

Se la configurazione del servizio e il runtime continuano a non corrispondere dopo i controlli, reinstalla i metadati del servizio dalla stessa directory di profilo/stato:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Correlati:

- [/gateway/pairing](/it/gateway/pairing)
- [/gateway/authentication](/it/gateway/authentication)
- [/gateway/background-process](/it/gateway/background-process)
