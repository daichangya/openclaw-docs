---
read_when:
    - Implementazione o aggiornamento dei client WS del gateway
    - Debug del protocollo non corrispondente o degli errori di connessione
    - Rigenerazione dello schema/dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-04-16T08:18:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 683e61ebe993a2d739bc34860060b0e3eda36b5c57267a2bcc03d177ec612fb3
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocollo Gateway (WebSocket)

Il protocollo WS del Gateway è il **singolo piano di controllo + trasporto dei nodi** per
OpenClaw. Tutti i client (CLI, interfaccia web, app macOS, nodi iOS/Android,
nodi headless) si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito**
al momento dell’handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.

## Handshake (`connect`)

Gateway → Client (challenge pre-connessione):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Client:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` e `policy` sono tutti obbligatori nello schema
(`src/gateway/protocol/schema/frames.ts`). `auth` e `canvasHostUrl` sono facoltativi.

Quando viene emesso un token dispositivo, `hello-ok` include anche:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Durante il passaggio affidabile del bootstrap, `hello-ok.auth` può includere anche
voci di ruolo aggiuntive limitate in `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Per il flusso di bootstrap integrato node/operator, il token primario del nodo resta
`scopes: []` e qualsiasi token operator trasferito resta limitato alla allowlist
dell’operatore di bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli ambiti del bootstrap restano
con prefisso del ruolo: le voci operator soddisfano solo richieste operator, e i ruoli non operator
continuano a richiedere ambiti con il prefisso del proprio ruolo.

### Esempio di nodo

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Framing

- **Richiesta**: `{type:"req", id, method, params}`
- **Risposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedi schema).

## Ruoli + ambiti

### Ruoli

- `operator` = client del piano di controllo (CLI/UI/automazione).
- `node` = host di capacità (`camera`/`screen`/`canvas`/`system.run`).

### Ambiti (`operator`)

Ambiti comuni:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` richiede `operator.talk.secrets`
(o `operator.admin`).

I metodi RPC del gateway registrati dai Plugin possono richiedere il proprio ambito operator, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) vengono sempre risolti in `operator.admin`.

L’ambito del metodo è solo il primo controllo. Alcuni slash command raggiunti tramite
`chat.send` applicano controlli più rigidi a livello di comando. Ad esempio, le scritture persistenti
di `/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo di ambito aggiuntivo al momento dell’approvazione, oltre al
controllo di base del metodo:

- richieste senza comandi: `operator.pairing`
- richieste con comandi del nodo non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (`node`)

I nodi dichiarano le proprie capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello.
- `commands`: allowlist di comandi per `invoke`.
- `permissions`: interruttori granulari (ad esempio `screen.record`, `camera.capture`).

Il Gateway le tratta come **dichiarazioni** e applica allowlist lato server.

## Presence

- `system-presence` restituisce voci indicizzate per identità del dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operator** sia come **node**.

## Famiglie comuni di metodi RPC

Questa pagina non è un dump completo generato, ma la superficie WS pubblica è più ampia
dei soli esempi di handshake/auth sopra. Queste sono le principali famiglie di metodi che il
Gateway espone oggi.

`hello-ok.features.methods` è un elenco conservativo di rilevamento funzionalità costruito da
`src/gateway/server-methods-list.ts` più le esportazioni dei metodi caricate da plugin/canali.
Trattalo come rilevamento delle funzionalità, non come un dump generato di ogni helper invocabile
implementato in `src/gateway/server-methods/*.ts`.

### Sistema e identità

- `health` restituisce l’istantanea di stato del gateway memorizzata in cache o appena verificata.
- `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono
  inclusi solo per i client operator con ambito admin.
- `gateway.identity.get` restituisce l’identità del dispositivo gateway usata dai flussi di relay e
  pairing.
- `system-presence` restituisce l’istantanea corrente della presenza per i dispositivi
  operator/node connessi.
- `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto
  di presenza.
- `last-heartbeat` restituisce l’ultimo evento Heartbeat persistito.
- `set-heartbeats` abilita o disabilita l’elaborazione degli Heartbeat sul gateway.

### Modelli e utilizzo

- `models.list` restituisce il catalogo dei modelli consentiti a runtime.
- `usage.status` restituisce riepiloghi delle finestre di utilizzo del provider/quota rimanente.
- `usage.cost` restituisce riepiloghi aggregati dei costi di utilizzo per un intervallo di date.
- `doctor.memory.status` restituisce lo stato di prontezza della memoria vettoriale / degli embedding per lo
  spazio di lavoro dell’agente predefinito attivo.
- `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
- `sessions.usage.timeseries` restituisce la serie temporale di utilizzo per una sessione.
- `sessions.usage.logs` restituisce le voci del log di utilizzo per una sessione.

### Canali e helper di login

- `channels.status` restituisce riepiloghi di stato dei canali/plugin integrati + inclusi.
- `channels.logout` esegue il logout di un canale/account specifico dove il canale
  supporta il logout.
- `web.login.start` avvia un flusso di login QR/web per l’attuale provider di canale web con supporto QR.
- `web.login.wait` attende il completamento di quel flusso di login QR/web e avvia il
  canale in caso di esito positivo.
- `push.test` invia una push APNs di test a un nodo iOS registrato.
- `voicewake.get` restituisce i trigger della parola di attivazione memorizzati.
- `voicewake.set` aggiorna i trigger della parola di attivazione e ne trasmette la modifica.

### Messaggistica e log

- `send` è l’RPC di consegna diretta in uscita per invii
  verso canale/account/thread di destinazione al di fuori del runner della chat.
- `logs.tail` restituisce la coda del log file del gateway configurato con cursore/limite e
  controlli di byte massimi.

### Talk e TTS

- `talk.config` restituisce il payload effettivo della configurazione Talk; `includeSecrets`
  richiede `operator.talk.secrets` (o `operator.admin`).
- `talk.mode` imposta/trasmette lo stato corrente della modalità Talk per i client
  WebChat/Control UI.
- `talk.speak` sintetizza la voce tramite il provider speech Talk attivo.
- `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback
  e lo stato di configurazione del provider.
- `tts.providers` restituisce l’inventario visibile dei provider TTS.
- `tts.enable` e `tts.disable` attivano o disattivano lo stato delle preferenze TTS.
- `tts.setProvider` aggiorna il provider TTS preferito.
- `tts.convert` esegue una conversione text-to-speech una tantum.

### Secret, configurazione, aggiornamento e wizard

- `secrets.reload` risolve nuovamente i SecretRef attivi e sostituisce lo stato dei secret a runtime
  solo in caso di pieno successo.
- `secrets.resolve` risolve le assegnazioni di secret di destinazione dei comandi per un insieme specifico
  di comando/destinazione.
- `config.get` restituisce l’istantanea della configurazione corrente e il relativo hash.
- `config.set` scrive un payload di configurazione validato.
- `config.patch` unisce un aggiornamento parziale della configurazione.
- `config.apply` valida + sostituisce l’intero payload di configurazione.
- `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e
  strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi
  i metadati di schema di plugin + canali quando il runtime può caricarli. Lo schema
  include i metadati dei campi `title` / `description` derivati dalle stesse etichette
  e testo di aiuto usati dall’interfaccia, inclusi oggetti nidificati, wildcard, elementi di array,
  e rami di composizione `anyOf` / `oneOf` / `allOf` quando esiste la documentazione del campo
  corrispondente.
- `config.schema.lookup` restituisce un payload di lookup con ambito di percorso per un percorso di configurazione:
  percorso normalizzato, un nodo di schema superficiale, `hint` + `hintPath` corrispondenti, e
  riepiloghi immediati dei figli per il drill-down in UI/CLI.
  - I nodi di schema del lookup mantengono la documentazione rivolta all’utente e i comuni campi di validazione:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    limiti numerici/stringa/array/oggetto e flag booleani come
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`,
    `hasChildren`, più `hint` / `hintPath` corrispondenti.
- `update.run` esegue il flusso di aggiornamento del gateway e pianifica un riavvio solo quando
  l’aggiornamento stesso è riuscito.
- `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono il
  wizard di onboarding tramite WS RPC.

### Famiglie principali esistenti

#### Helper per agente e spazio di lavoro

- `agents.list` restituisce le voci degli agenti configurati.
- `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e
  il collegamento dello spazio di lavoro.
- `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file
  dello spazio di lavoro di bootstrap esposti per un agente.
- `agent.identity.get` restituisce l’identità effettiva dell’assistente per un agente o
  una sessione.
- `agent.wait` attende il termine di un’esecuzione e restituisce l’istantanea finale quando
  disponibile.

#### Controllo della sessione

- `sessions.list` restituisce l’indice corrente delle sessioni.
- `sessions.subscribe` e `sessions.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi
  di modifica della sessione per il client WS corrente.
- `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano o disattivano
  le sottoscrizioni agli eventi di trascrizione/messaggi per una sessione.
- `sessions.preview` restituisce anteprime limitate della trascrizione per specifiche
  chiavi di sessione.
- `sessions.resolve` risolve o canonicalizza una destinazione di sessione.
- `sessions.create` crea una nuova voce di sessione.
- `sessions.send` invia un messaggio in una sessione esistente.
- `sessions.steer` è la variante interrompi-e-guida per una sessione attiva.
- `sessions.abort` interrompe il lavoro attivo per una sessione.
- `sessions.patch` aggiorna i metadati/le sostituzioni della sessione.
- `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la
  manutenzione della sessione.
- `sessions.get` restituisce la riga completa della sessione memorizzata.
- l’esecuzione della chat continua a usare `chat.history`, `chat.send`, `chat.abort` e
  `chat.inject`.
- `chat.history` è normalizzato per la visualizzazione per i client UI: i tag direttiva inline vengono
  rimossi dal testo visibile, i payload XML delle chiamate agli strumenti in testo semplice (inclusi
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, e
  blocchi di chiamata agli strumenti troncati) e i token di controllo del modello ASCII/a larghezza piena trapelati
  vengono rimossi, le righe assistant composte solo da token silenziosi come l’esatto `NO_REPLY` /
  `no_reply` vengono omesse e le righe troppo grandi possono essere sostituite con segnaposto.

#### Associazione dei dispositivi e token dispositivo

- `device.pair.list` restituisce i dispositivi associati in attesa e approvati.
- `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono
  i record di associazione dei dispositivi.
- `device.token.rotate` ruota un token di dispositivo associato entro i limiti approvati di ruolo
  e ambito.
- `device.token.revoke` revoca un token di dispositivo associato.

#### Associazione dei nodi, invoke e lavoro in sospeso

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` e `node.pair.verify` coprono l’associazione dei nodi e la verifica
  del bootstrap.
- `node.list` e `node.describe` restituiscono lo stato dei nodi noti/connessi.
- `node.rename` aggiorna un’etichetta di nodo associato.
- `node.invoke` inoltra un comando a un nodo connesso.
- `node.invoke.result` restituisce il risultato di una richiesta invoke.
- `node.event` trasporta gli eventi originati dal nodo di nuovo nel gateway.
- `node.canvas.capability.refresh` aggiorna i token di capacità canvas con ambito limitato.
- `node.pending.pull` e `node.pending.ack` sono le API di coda dei nodi connessi.
- `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro durevole in sospeso
  per nodi offline/disconnessi.

#### Famiglie di approvazione

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e
  `exec.approval.resolve` coprono le richieste di approvazione exec one-shot più la
  ricerca/riproduzione delle approvazioni in sospeso.
- `exec.approval.waitDecision` attende una approvazione exec in sospeso e restituisce
  la decisione finale (o `null` in caso di timeout).
- `exec.approvals.get` e `exec.approvals.set` gestiscono le istantanee delle policy di approvazione exec
  del gateway.
- `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec
  locale del nodo tramite comandi relay del nodo.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono
  i flussi di approvazione definiti dai Plugin.

#### Altre famiglie principali

- automazione:
  - `wake` pianifica un’iniezione di testo wake immediata o al prossimo Heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Famiglie comuni di eventi

- `chat`: aggiornamenti della chat UI come `chat.inject` e altri eventi di chat
  solo di trascrizione.
- `session.message` e `session.tool`: aggiornamenti del flusso di eventi/trascrizione per una
  sessione sottoscritta.
- `sessions.changed`: l’indice delle sessioni o i metadati sono cambiati.
- `presence`: aggiornamenti dell’istantanea della presenza di sistema.
- `tick`: evento periodico di keepalive / rilevamento attività.
- `health`: aggiornamento dell’istantanea di stato del gateway.
- `heartbeat`: aggiornamento del flusso di eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/job Cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell’associazione dei nodi.
- `node.invoke.request`: trasmissione della richiesta invoke del nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo associato.
- `voicewake.changed`: la configurazione dei trigger della parola di attivazione è cambiata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell’approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell’approvazione del Plugin.

### Metodi helper del nodo

- I nodi possono chiamare `skills.bins` per recuperare l’elenco corrente degli eseguibili delle Skills
  per i controlli di auto-allow.

### Metodi helper dell’operator

- Gli operator possono chiamare `commands.list` (`operator.read`) per recuperare l’inventario dei comandi a runtime per un
  agente.
  - `agentId` è facoltativo; ometterlo per leggere lo spazio di lavoro dell’agente predefinito.
  - `scope` controlla quale superficie prende di mira il `name` primario:
    - `text` restituisce il token primario del comando testuale senza la `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi dipendenti dal provider
      quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo dipendente dal provider quando esiste.
  - `provider` è facoltativo e influenza solo il naming nativo più la disponibilità dei comandi
    nativi del Plugin.
  - `includeArgs=false` omette dal risultato i metadati serializzati degli argomenti.
- Gli operator possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti a runtime per un
  agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del Plugin quando `source="plugin"`
  - `optional`: se uno strumento del Plugin è facoltativo
- Gli operator possono chiamare `tools.effective` (`operator.read`) per recuperare l’inventario effettivo degli strumenti a runtime
  per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto runtime affidabile dalla sessione lato server invece di accettare
    contesti auth o di consegna forniti dal chiamante.
  - La risposta ha ambito di sessione e riflette ciò che la conversazione attiva può usare in questo momento,
    inclusi strumenti core, Plugin e canale.
- Gli operator possono chiamare `skills.status` (`operator.read`) per recuperare l’inventario visibile delle
  Skills per un agente.
  - `agentId` è facoltativo; ometterlo per leggere lo spazio di lavoro dell’agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e
    opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operator possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i
  metadati di rilevamento di ClawHub.
- Gli operator possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella Skill nella directory `skills/` dello spazio di lavoro dell’agente predefinito.
  - modalità installer del gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    esegue un’azione dichiarata `metadata.openclaw.install` sull’host del gateway.
- Gli operator possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - la modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nello
    spazio di lavoro dell’agente predefinito.
  - la modalità config aggiorna con patch i valori `skills.entries.<skillKey>` come `enabled`,
    `apiKey` ed `env`.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operator risolvono chiamando `exec.approval.resolve` (richiede l’ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati di sessione canonici). Le richieste senza `systemRunPlan` vengono rifiutate.
- Dopo l’approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel
  `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra la preparazione e l’inoltro finale approvato di `system.run`, il
  gateway rifiuta l’esecuzione invece di fidarsi del payload modificato.

## Fallback di consegna dell’agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene il comportamento rigoroso: le destinazioni di consegna non risolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all’esecuzione solo di sessione quando non è possibile risolvere alcun percorso esterno consegnabile (ad esempio sessioni interne/webchat o configurazioni multi-canale ambigue).

## Versionamento

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le incompatibilità.
- Schemi + modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti del client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono
stabili nel protocollo v3 e rappresentano la base prevista per i client di terze parti.

| Costante                                  | Predefinito                                           | Origine                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout della richiesta (per RPC)         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff iniziale di riconnessione         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp di tentativo rapido dopo chiusura con device-token | `250` ms                                 | `src/gateway/client.ts`                                    |
| Periodo di tolleranza force-stop prima di `terminate()` | `250` ms                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                    |
| Chiusura per timeout tick                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Il server pubblicizza i valori effettivi `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` in `hello-ok`; i client dovrebbero rispettare tali valori
anziché i predefiniti precedenti all’handshake.

## Auth

- L’autenticazione del gateway con secret condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità auth configurata.
- Le modalità che portano identità come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"`
  non-loopback soddisfano il controllo auth di connessione tramite
  gli header della richiesta invece di `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingressi privati salta completamente l’auth di connessione con secret condiviso; non esporre questa modalità su ingressi pubblici/non affidabili.
- Dopo l’associazione, il Gateway emette un **token dispositivo** con ambito limitato al ruolo + agli ambiti della connessione. Viene restituito in `hello-ok.auth.deviceToken` e il client dovrebbe
  salvarlo per le connessioni future.
- I client dovrebbero salvare il `hello-ok.auth.deviceToken` primario dopo ogni
  connessione riuscita.
- Quando si riconnette con quel token dispositivo **memorizzato**, il client dovrebbe anche riutilizzare l’insieme di ambiti approvati memorizzato per quel token. Questo preserva l’accesso di lettura/verifica/stato
  già concesso ed evita che le riconnessioni si riducano silenziosamente a un
  ambito implicito più ristretto limitato all’admin.
- Composizione auth di connessione lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, poi un token per-dispositivo memorizzato (indicizzato da
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi token dispositivo risolto lo sopprime.
  - L’auto-promozione di un token dispositivo memorizzato nel retry one-shot
    `AUTH_TOKEN_MISMATCH` è limitata **solo agli endpoint affidabili** —
    loopback, oppure `wss://` con `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è considerato idoneo.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di passaggio bootstrap.
  Salvale solo quando la connessione ha usato auth bootstrap su un trasporto affidabile
  come `wss://` o loopback/local pairing.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell’insieme di ambiti richiesto dal chiamante resta autorevole; gli ambiti in cache vengono riutilizzati solo
  quando il client sta riutilizzando il token per-dispositivo memorizzato.
- I token dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l’ambito `operator.pairing`).
- L’emissione/rotazione del token resta limitata all’insieme di ruoli approvato registrato nella
  voce di pairing di quel dispositivo; la rotazione di un token non può estendere il dispositivo a un
  ruolo che l’approvazione del pairing non ha mai concesso.
- Per le sessioni di token di dispositivo associato, la gestione del dispositivo ha ambito limitato al dispositivo stesso a meno che il
  chiamante non abbia anche `operator.admin`: i chiamanti non admin possono rimuovere/revocare/ruotare
  solo la **propria** voce di dispositivo.
- `device.token.rotate` controlla anche l’insieme di ambiti operator richiesto rispetto agli
  ambiti della sessione corrente del chiamante. I chiamanti non admin non possono ruotare un token verso
  un insieme di ambiti operator più ampio di quello che già possiedono.
- I fallimenti auth includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client affidabili possono tentare un retry limitato con un token per-dispositivo in cache.
  - Se quel retry fallisce, i client dovrebbero interrompere i loop di riconnessione automatica e mostrare indicazioni operative all’operatore.

## Identità del dispositivo + pairing

- I nodi dovrebbero includere un’identità del dispositivo stabile (`device.id`) derivata da una
  fingerprint della coppia di chiavi.
- I gateway emettono token per dispositivo + ruolo.
- Le approvazioni di pairing sono necessarie per nuovi ID dispositivo a meno che non sia abilitata
  l’auto-approvazione locale.
- L’auto-approvazione del pairing è centrata sulle connessioni loopback locali dirette.
- OpenClaw ha anche un percorso ristretto di self-connect backend/container-local per flussi helper con secret condiviso affidabili.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per il pairing e
  richiedono approvazione.
- Tutti i client WS devono includere l’identità `device` durante `connect` (`operator` + `node`).
  Control UI può ometterla solo in queste modalità:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo su localhost.
  - autenticazione riuscita di Control UI operator con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave downgrade di sicurezza).
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica di migrazione auth del dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` in `error.details.code` con un `error.details.reason` stabile.

Errori di migrazione comuni:

| Messaggio                    | details.code                     | details.reason           | Significato                                         |
| ---------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`      | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`      | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato.  |
| `device signature invalid`   | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`   | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch`   | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde alla fingerprint della chiave pubblica. |
| `device public key invalid`  | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Il formato/canonicalizzazione della chiave pubblica non è riuscito. |

Obiettivo della migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che associa `platform` e `deviceFamily`
  oltre ai campi device/client/role/scopes/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei
  metadati del dispositivo associato continua a controllare la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fissare la fingerprint del certificato del gateway (vedi configurazione `gateway.tls`
  più `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone l’**API completa del gateway** (stato, canali, modelli, chat,
agente, sessioni, nodi, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.
