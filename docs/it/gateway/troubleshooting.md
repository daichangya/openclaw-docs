---
read_when:
    - L'hub di risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Hai bisogno di sezioni runbook stabili basate sui sintomi con comandi esatti
summary: Runbook approfondito per la risoluzione dei problemi di gateway, canali, automazione, Node e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-04-25T13:49:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi del Gateway

Questa pagina è il runbook approfondito.
Inizia da [/help/troubleshooting](/it/help/troubleshooting) se vuoi prima il flusso di triage rapido.

## Scala dei comandi

Esegui prima questi, in quest'ordine:

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
- `openclaw channels status --probe` mostra lo stato live del trasporto per account e,
  dove supportato, risultati di probe/audit come `works` o `audit ok`.

## Anthropic 429 extra usage required for long context

Usa questa sezione quando log/errori includono:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Controlla:

- Il modello Anthropic Opus/Sonnet selezionato ha `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea per l'uso long-context.
- Le richieste falliscono solo su sessioni lunghe/esecuzioni del modello che richiedono il percorso beta 1M.

Opzioni di correzione:

1. Disabilita `context1m` per quel modello per tornare alla normale finestra di contesto.
2. Usa una credenziale Anthropic idonea per richieste long-context, oppure passa a una chiave API Anthropic.
3. Configura modelli fallback in modo che le esecuzioni continuino quando le richieste long-context Anthropic vengono rifiutate.

Correlati:

- [Anthropic](/it/providers/anthropic)
- [Uso dei token e costi](/it/reference/token-use)
- [Perché vedo HTTP 429 da Anthropic?](/it/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend locale compatibile con OpenAI: i probe diretti passano ma le esecuzioni dell'agente falliscono

Usa questa sezione quando:

- `curl ... /v1/models` funziona
- piccole chiamate dirette `/v1/chat/completions` funzionano
- le esecuzioni del modello OpenClaw falliscono solo nei normali turni dell'agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Controlla:

- le chiamate dirette piccole riescono, ma le esecuzioni OpenClaw falliscono solo con prompt più grandi
- errori del backend relativi a `messages[].content` che si aspetta una stringa
- crash del backend che compaiono solo con conteggi di token prompt più grandi o con i prompt completi del runtime dell'agente

Firme comuni:

- `messages[...].content: invalid type: sequence, expected a string` → il backend
  rifiuta content part strutturate di Chat Completions. Correzione: imposta
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- le piccole richieste dirette riescono, ma le esecuzioni dell'agente OpenClaw falliscono con crash del backend/modello
  (ad esempio Gemma su alcune build di `inferrs`) → il trasporto OpenClaw è
  probabilmente già corretto; è il backend che fallisce sulla forma del prompt
  più grande del runtime agente.
- i fallimenti si riducono dopo aver disabilitato gli strumenti ma non scompaiono → gli schemi degli strumenti contribuivano alla pressione, ma il problema residuo è comunque un limite di capacità del server/modello upstream o un bug del backend.

Opzioni di correzione:

1. Imposta `compat.requiresStringContent: true` per backend Chat Completions che accettano solo stringhe.
2. Imposta `compat.supportsTools: false` per modelli/backend che non riescono a gestire
   in modo affidabile la superficie di schema strumenti di OpenClaw.
3. Riduci la pressione del prompt dove possibile: bootstrap del workspace più piccolo, cronologia di sessione più corta, modello locale più leggero o un backend con supporto long-context più forte.
4. Se le piccole richieste dirette continuano a riuscire mentre i turni dell'agente OpenClaw vanno ancora in crash
   dentro il backend, trattalo come un limite del server/modello upstream e apri lì un repro con la forma di payload accettata.

Correlati:

- [Modelli locali](/it/gateway/local-models)
- [Configurazione](/it/gateway/configuration)
- [Endpoint compatibili con OpenAI](/it/gateway/configuration-reference#openai-compatible-endpoints)

## Nessuna risposta

Se i canali sono attivi ma non arriva nessuna risposta, controlla instradamento e criteri prima di riconnettere qualsiasi cosa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Controlla:

- Abbinamento in attesa per i mittenti DM.
- Vincolo di menzione per i gruppi (`requireMention`, `mentionPatterns`).
- Mancate corrispondenze nelle allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato finché non viene menzionato.
- `pairing request` → il mittente richiede approvazione.
- `blocked` / `allowlist` → il mittente/canale è stato filtrato dai criteri.

Correlati:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)

## Connettività dashboard control UI

Quando dashboard/control UI non si connette, verifica URL, modalità auth e presupposti di secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Controlla:

- URL di probe e URL dashboard corretti.
- Mancata corrispondenza di modalità auth/token tra client e gateway.
- Uso HTTP quando è richiesta l'identità del dispositivo.

Firme comuni:

- `device identity required` → contesto non sicuro o auth del dispositivo mancante.
- `origin not allowed` → il browser `Origin` non è in `gateway.controlUi.allowedOrigins`
  (oppure ti stai connettendo da un'origine browser non loopback senza un'allowlist esplicita).
- `device nonce required` / `device nonce mismatch` → il client non sta completando il
  flusso auth del dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato
  (o con timestamp obsoleto) per l'handshake corrente.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può fare un retry trusted con il token del dispositivo in cache.
- Quel retry con token in cache riusa l'insieme di scope in cache memorizzato con il token del dispositivo abbinato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece l'insieme di scope richiesto.
- Fuori da quel percorso di retry, la precedenza auth di connessione è: token/password condivisi espliciti, poi `deviceToken` esplicito, poi token del dispositivo memorizzato, poi bootstrap token.
- Sul percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limiter registri il fallimento. Due retry concorrenti errati dello stesso client possono quindi mostrare `retry later` al secondo tentativo invece di due semplici mancate corrispondenze.
- `too many failed authentication attempts (retry later)` da un client loopback con origine browser → fallimenti ripetuti dalla stessa `Origin` normalizzata vengono temporaneamente bloccati; un'altra origine localhost usa un bucket separato.
- `unauthorized` ripetuto dopo quel retry → deriva del token condiviso/del dispositivo; aggiorna la configurazione del token e riapprova/ruota il token del dispositivo se necessario.
- `gateway connect failed:` → host/porta/URL di destinazione errati.

### Mappa rapida dei codici di dettaglio auth

Usa `error.details.code` dalla risposta `connect` fallita per scegliere l'azione successiva:

| Codice dettaglio             | Significato                                                                                                                                                                                  | Azione consigliata                                                                                                                                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso richiesto.                                                                                                                                        | Incolla/imposta il token nel client e riprova. Per i percorsi dashboard: `openclaw config get gateway.auth.token` poi incollalo nelle impostazioni della Control UI.                                                                                                                 |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrispondeva al token auth del gateway.                                                                                                                               | Se `canRetryWithDeviceToken=true`, consenti un trusted retry. I retry con token in cache riusano gli scope approvati memorizzati; i chiamanti con `deviceToken` / `scopes` espliciti mantengono gli scope richiesti. Se continua a fallire, esegui la [checklist di recupero deriva token](/it/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per-dispositivo in cache è obsoleto o revocato.                                                                                                                                      | Ruota/riapprova il token del dispositivo usando [devices CLI](/it/cli/devices), poi riconnettiti.                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | L'identità del dispositivo richiede approvazione. Controlla `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, e usa `requestId` / `remediationHint` quando presenti. | Approva la richiesta in sospeso: `openclaw devices list` poi `openclaw devices approve <requestId>`. Gli upgrade di scope/ruolo usano lo stesso flusso dopo aver esaminato l'accesso richiesto.                                                                                       |

Controllo migrazione auth dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se i log mostrano errori nonce/signature, aggiorna il client che si connette e verifica che:

1. attenda `connect.challenge`
2. firmi il payload legato alla challenge
3. invii `connect.params.device.nonce` con lo stesso nonce della challenge

Se `openclaw devices rotate` / `revoke` / `remove` viene negato in modo imprevisto:

- le sessioni con token di dispositivo abbinato possono gestire solo **il proprio** dispositivo a meno che il chiamante non abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo scope operatore che la sessione chiamante già possiede

Correlati:

- [Control UI](/it/web/control-ui)
- [Configurazione](/it/gateway/configuration) (modalità auth del gateway)
- [Auth trusted proxy](/it/gateway/trusted-proxy-auth)
- [Accesso remoto](/it/gateway/remote)
- [Devices](/it/cli/devices)

## Servizio Gateway non in esecuzione

Usa questa sezione quando il servizio è installato ma il processo non resta attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # scansiona anche i servizi a livello di sistema
```

Controlla:

- `Runtime: stopped` con indizi di uscita.
- Mancata corrispondenza della configurazione del servizio (`Config (cli)` vs `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks aggiuntive quando si usa `--deep`.
- Suggerimenti di pulizia `Other gateway-like services detected (best effort)`.

Firme comuni:

- `Gateway start blocked: set gateway.mode=local` oppure `existing config is missing gateway.mode` → la modalità Gateway locale non è abilitata, oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella tua configurazione, oppure esegui di nuovo `openclaw onboard --mode local` / `openclaw setup` per ristampare la configurazione prevista per la modalità locale. Se esegui OpenClaw tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso auth Gateway valido (token/password, oppure trusted-proxy dove configurato).
- `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
- `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. La maggior parte delle configurazioni dovrebbe mantenere un gateway per macchina; se te ne serve più di uno, isola porte + config/stato/workspace. Vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).

Correlati:

- [Exec in background e strumento process](/it/gateway/background-process)
- [Configurazione](/it/gateway/configuration)
- [Doctor](/it/gateway/doctor)

## Il Gateway ha ripristinato la configurazione last-known-good

Usa questa sezione quando il Gateway si avvia, ma i log dicono che ha ripristinato `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Controlla:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un file `openclaw.json.clobbered.*` con timestamp accanto alla configurazione attiva
- Un evento di sistema dell'agente principale che inizia con `Config recovery warning`

Cosa è successo:

- La configurazione rifiutata non ha superato la validazione durante l'avvio o il reload a caldo.
- OpenClaw ha conservato il payload rifiutato come `.clobbered.*`.
- La configurazione attiva è stata ripristinata dall'ultima copia last-known-good validata.
- Il turno successivo dell'agente principale viene avvisato di non riscrivere ciecamente la configurazione rifiutata.
- Se tutti i problemi di validazione erano sotto `plugins.entries.<id>...`, OpenClaw non
  avrebbe ripristinato l'intero file. I problemi locali del plugin restano evidenti, mentre le impostazioni
  utente non correlate restano nella configurazione attiva.

Ispeziona e ripara:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Firme comuni:

- `.clobbered.*` esiste → una modifica diretta esterna o una lettura all'avvio è stata ripristinata.
- `.rejected.*` esiste → una scrittura di configurazione gestita da OpenClaw ha fallito i controlli di schema o clobber prima del commit.
- `Config write rejected:` → la scrittura ha provato a eliminare una struttura richiesta, ridurre drasticamente la dimensione del file o rendere persistente una configurazione non valida.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oppure `size-drop-vs-last-good:*` → all'avvio il file corrente è stato trattato come clobbered perché ha perso campi o dimensione rispetto al backup last-known-good.
- `Config last-known-good promotion skipped` → il candidato conteneva segnaposto di segreti redatti come `***`.

Opzioni di correzione:

1. Mantieni la configurazione attiva ripristinata se è corretta.
2. Copia solo le chiavi desiderate da `.clobbered.*` o `.rejected.*`, quindi applicale con `openclaw config set` o `config.patch`.
3. Esegui `openclaw config validate` prima di riavviare.
4. Se modifichi a mano, mantieni l'intera configurazione JSON5, non solo l'oggetto parziale che volevi cambiare.

Correlati:

- [Configurazione: validazione rigorosa](/it/gateway/configuration#strict-validation)
- [Configurazione: hot reload](/it/gateway/configuration#config-hot-reload)
- [Config](/it/cli/config)
- [Doctor](/it/gateway/doctor)

## Avvisi di probe del Gateway

Usa questa sezione quando `openclaw gateway probe` raggiunge qualcosa, ma stampa comunque un blocco di avviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Controlla:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda il fallback SSH, gateway multipli, scope mancanti o SecretRef auth non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH è fallita, ma il comando ha comunque provato i target configurati/loopback diretti.
- `multiple reachable gateways detected` → ha risposto più di un target. Di solito significa una configurazione multi-gateway intenzionale o listener obsoleti/duplicati.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione ha funzionato, ma l'RPC di dettaglio è limitata dagli scope; abbina l'identità del dispositivo oppure usa credenziali con `operator.read`.
- `Capability: pairing-pending` oppure `gateway closed (1008): pairing required` → il gateway ha risposto, ma questo client richiede ancora abbinamento/approvazione prima del normale accesso operatore.
- testo di avviso SecretRef `gateway.auth.*` / `gateway.remote.*` non risolto → il materiale auth non era disponibile in questo percorso di comando per il target fallito.

Correlati:

- [Gateway](/it/cli/gateway)
- [Gateway multipli sullo stesso host](/it/gateway#multiple-gateways-same-host)
- [Accesso remoto](/it/gateway/remote)

## Canale connesso ma messaggi non in transito

Se lo stato del canale è connesso ma il flusso dei messaggi è fermo, concentrati su criteri, permessi e regole di consegna specifiche del canale.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Controlla:

- Criteri DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist di gruppo e requisiti di menzione.
- Permessi/scope API del canale mancanti.

Firme comuni:

- `mention required` → messaggio ignorato dai criteri di menzione del gruppo.
- tracce `pairing` / approvazione in sospeso → il mittente non è approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di auth/permessi del canale.

Correlati:

- [Risoluzione dei problemi del canale](/it/channels/troubleshooting)
- [WhatsApp](/it/channels/whatsapp)
- [Telegram](/it/channels/telegram)
- [Discord](/it/channels/discord)

## Consegna Cron e Heartbeat

Se Cron o Heartbeat non sono stati eseguiti o non hanno effettuato la consegna, verifica prima lo stato dello scheduler, poi il target di consegna.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Controlla:

- Cron abilitato e prossima attivazione presente.
- Stato della cronologia delle esecuzioni del job (`ok`, `skipped`, `error`).
- Motivi di skip di Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firme comuni:

- `cron: scheduler disabled; jobs will not run automatically` → Cron disabilitato.
- `cron: timer tick failed` → il tick dello scheduler è fallito; controlla errori di file/log/runtime.
- `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra di ore attive.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote / intestazioni markdown, quindi OpenClaw salta la chiamata al modello.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è dovuta in questo tick.
- `heartbeat: unknown accountId` → id account non valido per il target di consegna Heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → il target Heartbeat è stato risolto in una destinazione in stile DM mentre `agents.defaults.heartbeat.directPolicy` (o un override per agente) è impostato su `block`.

Correlati:

- [Attività pianificate: risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting)
- [Attività pianificate](/it/automation/cron-jobs)
- [Heartbeat](/it/gateway/heartbeat)

## Strumento Node abbinato non funziona

Se un Node è abbinato ma gli strumenti falliscono, isola stato foreground, permessi e approvazione.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Controlla:

- Node online con le capacità previste.
- Permessi OS concessi per camera/microfono/posizione/schermo.
- Stato di approvazioni exec e allowlist.

Firme comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l'app Node deve essere in foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permesso OS mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dalla allowlist.

Correlati:

- [Risoluzione dei problemi dei Node](/it/nodes/troubleshooting)
- [Node](/it/nodes/index)
- [Approvazioni exec](/it/tools/exec-approvals)

## Errore dello strumento browser

Usa questa sezione quando le azioni dello strumento browser falliscono anche se il gateway stesso è sano.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Controlla:

- Se `plugins.allow` è impostato e include `browser`.
- Percorso dell'eseguibile browser valido.
- Raggiungibilità del profilo CDP.
- Disponibilità di Chrome locale per i profili `existing-session` / `user`.

Firme comuni:

- `unknown command "browser"` oppure `unknown command 'browser'` → il Plugin browser incluso è escluso da `plugins.allow`.
- strumento browser mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il Plugin non è mai stato caricato.
- `Failed to start Chrome CDP on port` → il processo browser non è riuscito ad avviarsi.
- `browser.executablePath not found` → il percorso configurato non è valido.
- `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato come `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta errata o fuori intervallo.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session non è ancora riuscito ad agganciarsi alla directory dati browser selezionata. Apri la pagina di ispezione del browser, abilita il debug remoto, tieni il browser aperto, approva il primo prompt di aggancio, poi riprova. Se lo stato di accesso non è richiesto, preferisci il profilo gestito `openclaw`.
- `No Chrome tabs found for profile="user"` → il profilo attach Chrome MCP non ha schede Chrome locali aperte.
- `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host del gateway.
- `Browser attachOnly is enabled ... not reachable` oppure `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo attach-only non ha un target raggiungibile, oppure l'endpoint HTTP ha risposto ma il WebSocket CDP non è comunque riuscito ad aprirsi.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione corrente del gateway non include la dipendenza runtime `playwright-core` del Plugin browser incluso; esegui `openclaw doctor --fix`, poi riavvia il gateway. Gli snapshot ARIA e gli screenshot di pagina di base possono comunque funzionare, ma navigazione, snapshot AI, screenshot di elementi con selettore CSS ed esportazione PDF resteranno non disponibili.
- `fullPage is not supported for element screenshots` → la richiesta screenshot ha combinato `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate screenshot Chrome MCP / `existing-session` devono usare acquisizione della pagina o uno snapshot `--ref`, non CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di upload Chrome MCP richiedono riferimenti snapshot, non selettori CSS.
- `existing-session file uploads currently support one file at a time.` → invia un upload per chiamata sui profili Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → gli hook dialog sui profili Chrome MCP non supportano override di timeout.
- `existing-session type does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:type` su profili `profile="user"` / Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
- `existing-session evaluate does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:evaluate` su profili `profile="user"` / Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
- `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP grezzo.
- override obsoleti di viewport / dark-mode / locale / offline su profili attach-only o remote CDP → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero gateway.

Correlati:

- [Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting)
- [Browser (gestito da OpenClaw)](/it/tools/browser)

## Se hai aggiornato e qualcosa si è improvvisamente rotto

La maggior parte dei problemi post-aggiornamento è dovuta a derive della configurazione o a valori predefiniti più rigidi che ora vengono applicati.

### 1) Il comportamento di auth e override URL è cambiato

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Cosa controllare:

- Se `gateway.mode=remote`, le chiamate CLI potrebbero puntare al remoto mentre il tuo servizio locale funziona correttamente.
- Le chiamate esplicite con `--url` non usano come fallback le credenziali memorizzate.

Firme comuni:

- `gateway connect failed:` → URL di destinazione errato.
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

- I bind non-loopback (`lan`, `tailnet`, `custom`) richiedono un percorso auth Gateway valido: auth con token/password condivisi, oppure un deployment `trusted-proxy` non-loopback configurato correttamente.
- Chiavi vecchie come `gateway.token` non sostituiscono `gateway.auth.token`.

Firme comuni:

- `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso auth Gateway valido.
- `Connectivity probe: failed` mentre il runtime è in esecuzione → gateway vivo ma inaccessibile con l'auth/URL corrente.

### 3) Lo stato di abbinamento e identità del dispositivo è cambiato

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Cosa controllare:

- Approvazioni dispositivo in sospeso per dashboard/Node.
- Approvazioni di abbinamento DM in sospeso dopo modifiche ai criteri o all'identità.

Firme comuni:

- `device identity required` → auth del dispositivo non soddisfatta.
- `pairing required` → mittente/dispositivo deve essere approvato.

Se la configurazione del servizio e il runtime continuano a non coincidere dopo i controlli, reinstalla i metadati del servizio dallo stesso profilo/directory di stato:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Correlati:

- [Abbinamento gestito dal Gateway](/it/gateway/pairing)
- [Autenticazione](/it/gateway/authentication)
- [Exec in background e strumento process](/it/gateway/background-process)

## Correlati

- [Runbook Gateway](/it/gateway)
- [Doctor](/it/gateway/doctor)
- [FAQ](/it/help/faq)
