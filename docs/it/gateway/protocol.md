---
read_when:
    - Implementare o aggiornare client WS del Gateway
    - Debug del protocollo non corrispondente o degli errori di connessione
    - Rigenerare schema/modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-04-22T04:22:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6efa76f5f0faa6c10a8515b0cf457233e48551e3484a605dffaf6459ddff9231
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocollo Gateway (WebSocket)

Il protocollo WS del Gateway è il **singolo control plane + trasporto node** per
OpenClaw. Tutti i client (CLI, UI web, app macOS, node iOS/Android, node headless)
si connettono tramite WebSocket e dichiarano il proprio **role** + **scope** al
momento dell'handshake.

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
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` è facoltativo. `auth`
riporta il role/gli scope negoziati quando disponibili e include `deviceToken`
quando il gateway ne emette uno.

Quando non viene emesso alcun token dispositivo, `hello-ok.auth` può comunque riportare i
permessi negoziati:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

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

Durante il trusted bootstrap handoff, `hello-ok.auth` può anche includere ulteriori
voci di role limitate in `deviceTokens`:

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

Per il flusso bootstrap integrato node/operator, il token node primario resta
`scopes: []` e qualsiasi token operator trasferito resta limitato alla allowlist
bootstrap dell'operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli scope bootstrap restano
con prefisso del role: le voci operator soddisfano solo richieste operator, e i role
non-operator richiedono comunque scope sotto il prefisso del proprio role.

### Esempio node

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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedi schema).

## Role + scope

### Role

- `operator` = client control plane (CLI/UI/automazione).
- `node` = host di capacità (`camera`/`screen`/`canvas`/`system.run`).

### Scope (operator)

Scope comuni:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` richiede `operator.talk.secrets`
(o `operator.admin`).

I metodi RPC Gateway registrati dai Plugin possono richiedere il proprio scope operator, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) vengono sempre risolti in `operator.admin`.

Lo scope del metodo è solo il primo controllo. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli a livello di comando ancora più rigidi. Ad esempio, le scritture
persistenti `/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo di scope aggiuntivo al momento dell'approvazione,
oltre allo scope base del metodo:

- richieste senza comando: `operator.pairing`
- richieste con comandi node non-exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

I node dichiarano le capability claim al momento della connessione:

- `caps`: categorie di capability di alto livello.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (ad es. `screen.record`, `camera.capture`).

Il Gateway li tratta come **claim** e applica allowlist lato server.

## Presence

- `system-presence` restituisce voci indicizzate per identità dispositivo.
- Le voci di presence includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operator** sia come **node**.

## Scope degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono limitati dagli scope in modo che le sessioni con scope pairing o solo-node non ricevano passivamente contenuti di sessione.

- I frame **chat, agent e tool-result** (inclusi gli eventi `agent` in streaming e i risultati delle chiamate tool) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- I **broadcast `plugin.*` definiti dai Plugin** sono limitati a `operator.write` o `operator.admin`, a seconda di come il Plugin li ha registrati.
- Gli **eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni così lo stato di salute del trasporto resta osservabile da ogni sessione autenticata.
- Le **famiglie di eventi broadcast sconosciute** sono limitate dagli scope per impostazione predefinita (fail-closed), a meno che un handler registrato non le allenti esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per-client, così i broadcast preservano l'ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi dello stream di eventi filtrati per scope.

## Famiglie comuni di metodi RPC

Questa pagina non è un dump generato completo, ma la superficie WS pubblica è più ampia
dei soli esempi di handshake/autenticazione qui sopra. Queste sono le principali famiglie di metodi che
il Gateway espone oggi.

`hello-ok.features.methods` è un elenco di discovery conservativo costruito da
`src/gateway/server-methods-list.ts` più le esportazioni dei metodi dei Plugin/canali caricati.
Trattalo come feature discovery, non come un dump generato di ogni helper invocabile
implementato in `src/gateway/server-methods/*.ts`.

### Sistema e identità

- `health` restituisce lo snapshot di integrità del gateway memorizzato in cache o sondato di recente.
- `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono
  inclusi solo per client operator con scope admin.
- `gateway.identity.get` restituisce l'identità dispositivo del gateway usata dai flussi relay e
  pairing.
- `system-presence` restituisce lo snapshot corrente di presence per i dispositivi
  operator/node connessi.
- `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto
  di presence.
- `last-heartbeat` restituisce l'ultimo evento Heartbeat persistito.
- `set-heartbeats` attiva o disattiva l'elaborazione di Heartbeat sul gateway.

### Modelli e utilizzo

- `models.list` restituisce il catalogo dei modelli consentiti a runtime.
- `usage.status` restituisce riepiloghi di finestre di utilizzo/quota residua del provider.
- `usage.cost` restituisce riepiloghi aggregati del costo per un intervallo di date.
- `doctor.memory.status` restituisce lo stato di prontezza di vector-memory / embedding per il
  workspace dell'agente predefinito attivo.
- `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
- `sessions.usage.timeseries` restituisce serie temporali di utilizzo per una sessione.
- `sessions.usage.logs` restituisce voci di log di utilizzo per una sessione.

### Canali e helper di login

- `channels.status` restituisce riepiloghi di stato dei canali/plugin integrati + inclusi.
- `channels.logout` esegue il logout di un canale/account specifico dove il canale
  supporta il logout.
- `web.login.start` avvia un flusso di login QR/web per l'attuale provider del
  canale web compatibile con QR.
- `web.login.wait` attende il completamento di quel flusso di login QR/web e avvia il
  canale in caso di successo.
- `push.test` invia una notifica push APNs di test a un node iOS registrato.
- `voicewake.get` restituisce i trigger wake-word memorizzati.
- `voicewake.set` aggiorna i trigger wake-word e ne trasmette la modifica.

### Messaggistica e log

- `send` è l'RPC di consegna diretta in uscita per invii mirati a canale/account/thread
  al di fuori del runner di chat.
- `logs.tail` restituisce il tail del file di log configurato del gateway con controlli per cursor/limit e
  max-byte.

### Talk e TTS

- `talk.config` restituisce il payload effettivo di configurazione Talk; `includeSecrets`
  richiede `operator.talk.secrets` (o `operator.admin`).
- `talk.mode` imposta/trasmette lo stato corrente della modalità Talk per i client
  WebChat/Control UI.
- `talk.speak` sintetizza voce tramite il provider di parlato Talk attivo.
- `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback
  e lo stato di configurazione del provider.
- `tts.providers` restituisce l'inventario visibile dei provider TTS.
- `tts.enable` e `tts.disable` attivano/disattivano lo stato delle preferenze TTS.
- `tts.setProvider` aggiorna il provider TTS preferito.
- `tts.convert` esegue una conversione text-to-speech one-shot.

### Secrets, configurazione, aggiornamento e wizard

- `secrets.reload` risolve nuovamente i SecretRef attivi e sostituisce lo stato runtime dei secret
  solo in caso di successo completo.
- `secrets.resolve` risolve le assegnazioni di secret di destinazione del comando per un insieme
  specifico di comando/destinazione.
- `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
- `config.set` scrive un payload di configurazione validato.
- `config.patch` unisce un aggiornamento parziale della configurazione.
- `config.apply` valida + sostituisce l'intero payload di configurazione.
- `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e
  dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi
  i metadati di schema di Plugin + canali quando il runtime può caricarli. Lo schema
  include metadati dei campi `title` / `description` derivati dalle stesse etichette
  e dallo stesso testo di aiuto usati dalla UI, inclusi rami annidati di oggetto, wildcard, item di array
  e composizioni `anyOf` / `oneOf` / `allOf` quando esiste documentazione
  di campo corrispondente.
- `config.schema.lookup` restituisce un payload di lookup con ambito percorso per un percorso di configurazione:
  percorso normalizzato, nodo di schema superficiale, hint corrispondente + `hintPath` e
  riepiloghi dei figli immediati per drill-down UI/CLI.
  - I nodi schema di lookup mantengono la documentazione rivolta all'utente e i comuni campi di validazione:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    limiti numerici/stringa/array/oggetto e flag booleani come
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`,
    `hasChildren`, più `hint` / `hintPath` corrispondenti.
- `update.run` esegue il flusso di aggiornamento del gateway e pianifica un riavvio solo quando
  l'aggiornamento stesso è riuscito.
- `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la
  procedura guidata di onboarding tramite WS RPC.

### Famiglie principali esistenti

#### Helper di agente e workspace

- `agents.list` restituisce le voci agente configurate.
- `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e
  il wiring del workspace.
- `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i
  file del workspace bootstrap esposti per un agente.
- `agent.identity.get` restituisce l'identità assistant effettiva per un agente o
  una sessione.
- `agent.wait` attende che un'esecuzione termini e restituisce lo snapshot terminale quando
  disponibile.

#### Controllo delle sessioni

- `sessions.list` restituisce l'indice corrente delle sessioni.
- `sessions.subscribe` e `sessions.unsubscribe` attivano/disattivano le sottoscrizioni
  agli eventi di modifica delle sessioni per il client WS corrente.
- `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano/disattivano
  le sottoscrizioni agli eventi transcript/messaggio per una sessione.
- `sessions.preview` restituisce anteprime bounded del transcript per specifiche
  chiavi di sessione.
- `sessions.resolve` risolve o canonicalizza una destinazione sessione.
- `sessions.create` crea una nuova voce di sessione.
- `sessions.send` invia un messaggio in una sessione esistente.
- `sessions.steer` è la variante interrupt-and-steer per una sessione attiva.
- `sessions.abort` interrompe il lavoro attivo per una sessione.
- `sessions.patch` aggiorna i metadati/override della sessione.
- `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione
  della sessione.
- `sessions.get` restituisce l'intera riga di sessione memorizzata.
- l'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e
  `chat.inject`.
- `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono
  rimossi dal testo visibile, i payload XML di tool-call in testo semplice (inclusi
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocchi tool-call troncati) e i token di controllo del modello ASCII/full-width trapelati
  vengono rimossi, le righe assistant composte solo da silent-token come esatto `NO_REPLY` /
  `no_reply` vengono omesse e le righe troppo grandi possono essere sostituite con placeholder.

#### Pairing dei dispositivi e token dispositivo

- `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
- `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono
  i record di pairing del dispositivo.
- `device.token.rotate` ruota un token di dispositivo associato entro i limiti
  del role e dello scope approvati.
- `device.token.revoke` revoca un token dispositivo associato.

#### Pairing node, invoke e lavoro in sospeso

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` e `node.pair.verify` coprono il pairing dei node e la
  verifica bootstrap.
- `node.list` e `node.describe` restituiscono lo stato dei node noti/connessi.
- `node.rename` aggiorna un'etichetta di node associato.
- `node.invoke` inoltra un comando a un node connesso.
- `node.invoke.result` restituisce il risultato di una richiesta invoke.
- `node.event` trasporta nel gateway gli eventi originati dal node.
- `node.canvas.capability.refresh` aggiorna i token di capability canvas con scope limitato.
- `node.pending.pull` e `node.pending.ack` sono le API di coda per i node connessi.
- `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro pending persistente
  per node offline/disconnessi.

#### Famiglie di approvazione

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e
  `exec.approval.resolve` coprono richieste di approvazione exec one-shot più ricerca/replay
  delle approvazioni pending.
- `exec.approval.waitDecision` attende una singola approvazione exec pending e restituisce
  la decisione finale (o `null` in caso di timeout).
- `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot della policy
  di approvazione exec del gateway.
- `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale del node
  tramite comandi relay del node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono
  i flussi di approvazione definiti dai Plugin.

#### Altre famiglie principali

- automazione:
  - `wake` pianifica un'iniezione di testo wake immediata o al prossimo Heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tool: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Famiglie comuni di eventi

- `chat`: aggiornamenti della chat UI come `chat.inject` e altri eventi di chat
  solo-transcript.
- `session.message` e `session.tool`: aggiornamenti transcript/stream di eventi per una
  sessione sottoscritta.
- `sessions.changed`: l'indice delle sessioni o i metadati sono cambiati.
- `presence`: aggiornamenti dello snapshot di presence del sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot di integrità del gateway.
- `heartbeat`: aggiornamento dello stream di eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/job Cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita del pairing node.
- `node.invoke.request`: broadcast della richiesta invoke del node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo associato.
- `voicewake.changed`: la configurazione dei trigger wake-word è cambiata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell'approvazione Plugin.

### Metodi helper per node

- I node possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili
  Skills per i controlli di auto-allow.

### Metodi helper per operator

- Gli operator possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario runtime
  dei comandi per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell'agente predefinito.
  - `scope` controlla quale superficie usa il `name` primario:
    - `text` restituisce il token del comando testuale primario senza la `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider
      quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando esiste.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa più la disponibilità
    dei comandi Plugin nativi.
  - `includeArgs=false` omette i metadati serializzati degli argomenti dalla risposta.
- Gli operator possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo runtime dei tool per un
  agente. La risposta include tool raggruppati e metadati di provenienza:
  - `source`: `core` oppure `plugin`
  - `pluginId`: proprietario del Plugin quando `source="plugin"`
  - `optional`: se un tool Plugin è facoltativo
- Gli operator possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario dei tool runtime-effettivi
  per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto runtime fidato dalla sessione lato server invece di accettare
    contesto auth o di consegna fornito dal chiamante.
  - La risposta ha scope di sessione e riflette ciò che la conversazione attiva può usare in questo momento,
    inclusi tool core, Plugin e canale.
- Gli operator possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario visibile
  delle Skills per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e
    opzioni di installazione sanificate senza esporre valori secret grezzi.
- Gli operator possono chiamare `skills.search` e `skills.detail` (`operator.read`) per
  i metadati di discovery di ClawHub.
- Gli operator possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella skill nella directory `skills/` del workspace dell'agente predefinito.
  - modalità installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    esegue un'azione `metadata.openclaw.install` dichiarata sull'host del gateway.
- Gli operator possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - la modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nel
    workspace dell'agente predefinito.
  - la modalità Config esegue patch dei valori `skills.entries.<skillKey>` come `enabled`,
    `apiKey` ed `env`.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operator risolvono chiamando `exec.approval.resolve` (richiede scope `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati di sessione canonici). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate `node.invoke system.run` inoltrate riusano quel
  `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra prepare e l'inoltro finale approvato di `system.run`, il
  gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback di consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene il comportamento rigoroso: le destinazioni di consegna non risolte o solo-internal restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback alla sola esecuzione di sessione quando non può essere risolta alcuna route esterna consegnabile (ad esempio sessioni internal/webchat o configurazioni multi-canale ambigue).

## Versionamento

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le incompatibilità.
- Schemi + modelli sono generati da definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono
stabili in tutto il protocollo v3 e costituiscono la baseline attesa per i client di terze parti.

| Constant                                  | Default                                               | Source                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout richiesta (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff di reconnessione iniziale         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff massimo di reconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp fast-retry dopo chiusura device-token | `250` ms                                            | `src/gateway/client.ts`                                    |
| Grace di arresto forzato prima di `terminate()` | `250` ms                                       | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout predefinito `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervallo tick predefinito (pre `hello-ok`) | `30_000` ms                                        | `src/gateway/client.ts`                                    |
| Chiusura per timeout tick                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Il server pubblicizza in `hello-ok` i valori effettivi `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes`; i client dovrebbero rispettare tali valori
piuttosto che i predefiniti pre-handshake.

## Autenticazione

- L'autenticazione del gateway con secret condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità che portano identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"` non-loopback,
  soddisfano il controllo di autenticazione `connect` dagli header della richiesta invece che da
  `connect.params.auth.*`.
- `gateway.auth.mode: "none"` su ingress privato salta completamente l'autenticazione `connect` con secret condiviso;
  non esporre questa modalità su ingress pubblici/non fidati.
- Dopo il pairing, il Gateway emette un **device token** con scope limitato al
  role + scope della connessione. Viene restituito in `hello-ok.auth.deviceToken` e dovrebbe essere
  persistito dal client per le connessioni future.
- I client dovrebbero persistere il `hello-ok.auth.deviceToken` primario dopo ogni
  connessione riuscita.
- La riconnessione con quel **device token** memorizzato dovrebbe anche riutilizzare l'insieme di scope
  approvati memorizzato per quel token. Questo preserva l'accesso read/probe/status
  già concesso ed evita che le riconnessioni collassino silenziosamente verso un
  scope implicito solo-admin più ristretto.
- Composizione lato client dell'autenticazione `connect` (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima token condiviso esplicito,
    poi `deviceToken` esplicito, poi un token per-dispositivo memorizzato (indicizzato da
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi device token risolto lo sopprime.
  - L'auto-promozione di un device token memorizzato nel retry one-shot
    `AUTH_TOKEN_MISMATCH` è limitata ai **trusted endpoint** —
    loopback, oppure `wss://` con `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è qualificato.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di bootstrap handoff.
  Persistile solo quando la connessione ha usato autenticazione bootstrap su un trasporto fidato
  come `wss://` o loopback/pairing locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme di scope
  richiesto dal chiamante resta autorevole; gli scope in cache vengono riutilizzati solo
  quando il client sta riusando il token per-dispositivo memorizzato.
- I device token possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede scope `operator.pairing`).
- L'emissione/rotazione dei token resta limitata all'insieme di role approvati registrato
  nella voce di pairing di quel dispositivo; ruotare un token non può espandere il dispositivo a un
  role che l'approvazione del pairing non ha mai concesso.
- Per le sessioni con token di dispositivo associato, la gestione dei dispositivi è con scope sul dispositivo stesso a meno che il
  chiamante non abbia anche `operator.admin`: i chiamanti non-admin possono rimuovere/revocare/ruotare
  solo la **propria** voce dispositivo.
- `device.token.rotate` controlla anche l'insieme di scope operator richiesto rispetto agli
  scope della sessione corrente del chiamante. I chiamanti non-admin non possono ruotare un token verso
  un insieme di scope operator più ampio di quello che già possiedono.
- I fallimenti di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client fidati possono tentare un retry limitato con un token per-dispositivo in cache.
  - Se quel retry fallisce, i client dovrebbero interrompere i loop di riconnessione automatica e mostrare indicazioni per l'azione dell'operatore.

## Identità dispositivo + pairing

- I node dovrebbero includere un'identità dispositivo stabile (`device.id`) derivata da una
  fingerprint della keypair.
- I gateway emettono token per dispositivo + role.
- Le approvazioni di pairing sono richieste per i nuovi ID dispositivo a meno che l'auto-approvazione locale
  non sia abilitata.
- L'auto-approvazione del pairing è centrata sulle connessioni dirette local loopback.
- OpenClaw ha anche un percorso ristretto di self-connect backend/container-local per
  flussi helper con secret condiviso fidati.
- Le connessioni tailnet o LAN sullo stesso host vengono comunque trattate come remote per il pairing e
  richiedono approvazione.
- Tutti i client WS devono includere l'identità `device` durante `connect` (operator + node).
  Control UI può ometterla solo in queste modalità:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP insicura solo localhost.
  - autenticazione riuscita di Control UI operator con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave downgrade di sicurezza).
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica di migrazione dell'autenticazione dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori comuni di migrazione:

| Message                     | details.code                     | details.reason           | Meaning                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde alla fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Il formato/canonicalizzazione della chiave pubblica non è riuscito. |

Obiettivo della migrazione:

- Attendere sempre `connect.challenge`.
- Firmare il payload v2 che include il nonce del server.
- Inviare lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi device/client/role/scopes/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati
  del dispositivo associato continua a controllare la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fissare la fingerprint del certificato del gateway (vedi config `gateway.tls`
  più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone l'**intera API del gateway** (stato, canali, modelli, chat,
agent, sessioni, node, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.
