---
read_when:
    - Implementazione o aggiornamento dei client WS del gateway
    - Debug dei mismatch del protocollo o degli errori di connessione
    - Rigenerazione dello schema/modelli del protocollo
summary: 'Protocollo WebSocket Gateway: handshake, frame, versioning'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-04-25T13:48:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

Il protocollo WS del Gateway è il **singolo control plane + trasporto node** per
OpenClaw. Tutti i client (CLI, web UI, app macOS, node iOS/Android, node
headless) si connettono tramite WebSocket e dichiarano il proprio **role** + **scope** al
momento dell'handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connect sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  devono seguire i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  i frame in ingresso sovradimensionati e i buffer in uscita lenti emettono eventi `payload.large`
  prima che il gateway chiuda o scarti il frame interessato. Questi eventi mantengono
  dimensioni, limiti, superfici e codici motivo sicuri. Non mantengono il corpo del messaggio,
  contenuti degli allegati, corpo frame grezzo, token, cookie o valori secret.

## Handshake (connect)

Gateway → Client (challenge pre-connect):

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

`server`, `features`, `snapshot` e `policy` sono tutti richiesti dallo schema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` è facoltativo. `auth`
riporta role/scopes negoziati quando disponibili e include `deviceToken`
quando il gateway ne emette uno.

Quando non viene emesso alcun device token, `hello-ok.auth` può comunque riportare i
permessi negoziati:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Quando viene emesso un device token, `hello-ok` include anche:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Durante l'handoff di bootstrap affidabile, `hello-ok.auth` può anche includere ulteriori
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

Per il flusso di bootstrap node/operator integrato, il token node primario resta
`scopes: []` e qualsiasi token operator trasferito resta limitato all'allowlist
bootstrap operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli di scope del bootstrap restano
prefissati dal role: le voci operator soddisfano solo richieste operator, e i role non-operator
continuano a richiedere scope sotto il proprio prefisso role.

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

I metodi con effetti collaterali richiedono **idempotency keys** (vedi schema).

## Role + scope

### Role

- `operator` = client control plane (CLI/UI/automazione).
- `node` = host delle capability (camera/screen/canvas/system.run).

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

I metodi RPC gateway registrati da Plugin possono richiedere il proprio scope operator, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) vengono sempre risolti a `operator.admin`.

Lo scope del metodo è solo il primo controllo. Alcuni slash command raggiunti tramite
`chat.send` applicano sopra controlli più rigidi a livello comando. Per esempio, le
scritture persistenti `/config set` e `/config unset` richiedono `operator.admin`.

Anche `node.pair.approve` ha un controllo di scope aggiuntivo al momento dell'approvazione sopra lo
scope base del metodo:

- richieste senza comando: `operator.pairing`
- richieste con comandi node non-exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

I node dichiarano capability claim al momento della connessione:

- `caps`: categorie di capability di alto livello.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (ad esempio `screen.record`, `camera.capture`).

Il Gateway li tratta come **claim** e applica allowlist lato server.

## Presence

- `system-presence` restituisce voci con chiave per identità del dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operator** sia come **node**.

## Ambito degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono filtrati per scope così le sessioni
con scope pairing o solo-node non ricevono passivamente contenuto di sessione.

- **Frame chat, agent e risultati degli strumenti** (inclusi eventi `agent` in streaming e risultati delle chiamate agli strumenti) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- I **broadcast `plugin.*` definiti dai Plugin** sono filtrati su `operator.write` o `operator.admin`, a seconda di come il Plugin li ha registrati.
- Gli **eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni così la salute del trasporto rimane osservabile per ogni sessione autenticata.
- Le **famiglie di eventi broadcast sconosciute** sono filtrate per scope per impostazione predefinita (fail-closed), a meno che un handler registrato non le rilassi esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per client così i broadcast preservano l'ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi filtrati per scope differenti del flusso eventi.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi handshake/auth sopra. Questo
non è un dump generato — `hello-ok.features.methods` è una lista conservativa di
discovery costruita da `src/gateway/server-methods-list.ts` più esportazioni di metodi
plugin/channel caricati. Trattala come feature discovery, non come enumerazione completa di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce la snapshot di stato del gateway in cache o appena verificata.
    - `diagnostics.stability` restituisce il recente recorder di stabilità diagnostica limitato. Mantiene metadati operativi come nomi degli eventi, conteggi, dimensioni in byte, letture di memoria, stato di code/sessioni, nomi di canali/Plugin e id di sessione. Non mantiene testo chat, corpi Webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie o valori secret. È richiesto lo scope operator read.
    - `status` restituisce il riepilogo gateway in stile `/status`; i campi sensibili sono inclusi solo per client operator con scope admin.
    - `gateway.identity.get` restituisce l'identità del dispositivo gateway usata dai flussi relay e pairing.
    - `system-presence` restituisce la snapshot di presenza corrente per dispositivi operator/node connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'ultimo evento heartbeat persistito.
    - `set-heartbeats` attiva o disattiva l'elaborazione heartbeat sul gateway.
  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti dal runtime.
    - `usage.status` restituisce finestre di utilizzo provider/riepiloghi della quota residua.
    - `usage.cost` restituisce riepiloghi aggregati del costo di utilizzo per un intervallo di date.
    - `doctor.memory.status` restituisce lo stato di prontezza vector-memory / embedding per lo spazio di lavoro attivo dell'agente predefinito.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce serie temporali di utilizzo per una sessione.
    - `sessions.usage.logs` restituisce voci del log di utilizzo per una sessione.
  </Accordion>

  <Accordion title="Canali e helper di login">
    - `channels.status` restituisce riepiloghi di stato di canali/Plugin integrati + inclusi.
    - `channels.logout` esegue il logout di uno specifico canale/account dove il canale supporta il logout.
    - `web.login.start` avvia un flusso di login QR/web per l'attuale provider di canale web con supporto QR.
    - `web.login.wait` attende che quel flusso di login QR/web si completi e avvia il canale in caso di successo.
    - `push.test` invia un push APNs di test a un node iOS registrato.
    - `voicewake.get` restituisce i trigger wake-word memorizzati.
    - `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.
  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC di consegna diretta in uscita per invii mirati a canale/account/thread al di fuori del chat runner.
    - `logs.tail` restituisce la coda del file di log gateway configurato con controlli di cursore/limite e max-byte.
  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` restituisce il payload della configurazione Talk effettiva; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` imposta/trasmette lo stato della modalità Talk corrente per i client WebChat/Control UI.
    - `talk.speak` sintetizza la voce tramite il provider di sintesi attivo di Talk.
    - `tts.status` restituisce stato TTS abilitato, provider attivo, provider di fallback e stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` attivano/disattivano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech one-shot.
  </Accordion>

  <Accordion title="Secret, configurazione, aggiornamento e wizard">
    - `secrets.reload` risolve di nuovo i SecretRef attivi e sostituisce lo stato secret del runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni secret target del comando per uno specifico insieme comando/target.
    - `config.get` restituisce la snapshot della configurazione corrente e il relativo hash.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` convalida + sostituisce l'intero payload di configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati di schema di Plugin + canale quando il runtime può caricarli. Lo schema include i metadati di campo `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dalla UI, incluse le diramazioni annidate di oggetti, wildcard, elementi di array e composizioni `anyOf` / `oneOf` / `allOf` quando esiste documentazione di campo corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup limitato al percorso per un singolo percorso di configurazione: percorso normalizzato, nodo di schema superficiale, hint corrispondente + `hintPath` e riepiloghi dei figli immediati per drill-down UI/CLI. I nodi di schema lookup mantengono la documentazione visibile all'utente e i comuni campi di validazione (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del gateway e pianifica un riavvio solo quando l'aggiornamento stesso ha avuto successo.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono il wizard di onboarding tramite WS RPC.
  </Accordion>

  <Accordion title="Agente e helper dello spazio di lavoro">
    - `agents.list` restituisce le voci degli agenti configurati.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il collegamento dello spazio di lavoro.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file bootstrap dello spazio di lavoro esposti per un agente.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di un'esecuzione e restituisce la snapshot terminale quando disponibile.
  </Accordion>

  <Accordion title="Controllo sessione">
    - `sessions.list` restituisce l'indice delle sessioni correnti.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di modifica delle sessioni per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di transcript/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime transcript limitate per specifiche chiavi di sessione.
    - `sessions.resolve` risolve o rende canonico un target di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante interrompi-e-guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono manutenzione della sessione.
    - `sessions.get` restituisce l'intera riga di sessione memorizzata.
    - L'esecuzione chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamata strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati) e i token di controllo del modello ASCII/a larghezza piena trapelati vengono rimossi, le righe assistant con solo token silenzioso come esatto `NO_REPLY` / `no_reply` vengono omesse e le righe sovradimensionate possono essere sostituite con placeholder.
  </Accordion>

  <Accordion title="Pairing dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi accoppiati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di pairing dei dispositivi.
    - `device.token.rotate` ruota un token di dispositivo accoppiato entro i limiti approvati di role e scope.
    - `device.token.revoke` revoca un token di dispositivo accoppiato.
  </Accordion>

  <Accordion title="Pairing node, invoke e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` e `node.pair.verify` coprono il pairing dei node e la verifica del bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei node noti/connessi.
    - `node.rename` aggiorna l'etichetta di un node accoppiato.
    - `node.invoke` inoltra un comando a un node connesso.
    - `node.invoke.result` restituisce il risultato di una richiesta invoke.
    - `node.event` riporta nel gateway gli eventi originati dal node.
    - `node.canvas.capability.refresh` aggiorna i token di capability canvas limitati allo scope.
    - `node.pending.pull` e `node.pending.ack` sono le API di coda dei node connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro in sospeso durevole per node offline/disconnessi.
  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono richieste di approvazione exec one-shot più lookup/replay delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una specifica approvazione exec in sospeso e restituisce la decisione finale (oppure `null` in caso di timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono le snapshot delle policy di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale del node tramite comandi di relay del node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai Plugin.
  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione di testo di riattivazione immediata o al prossimo Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Famiglie comuni di eventi

- `chat`: aggiornamenti chat della UI come `chat.inject` e altri eventi chat
  solo-transcript.
- `session.message` e `session.tool`: aggiornamenti transcript/flusso eventi per una
  sessione sottoscritta.
- `sessions.changed`: l'indice delle sessioni o i metadati sono cambiati.
- `presence`: aggiornamenti della snapshot di presenza del sistema.
- `tick`: evento periodico di keepalive / verifica di vitalità.
- `health`: aggiornamento della snapshot di stato del gateway.
- `heartbeat`: aggiornamento del flusso eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/processo cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita del pairing dei node.
- `node.invoke.request`: broadcast della richiesta invoke del node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo accoppiato.
- `voicewake.changed`: la configurazione dei trigger wake-word è cambiata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell'approvazione Plugin.

### Metodi helper del node

- I node possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili
  delle Skills per i controlli di auto-allow.

### Metodi helper dell'operator

- Gli operator possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario
  dei comandi runtime per un agente.
  - `agentId` è facoltativo; omettilo per leggere lo spazio di lavoro dell'agente predefinito.
  - `scope` controlla quale superficie usa il `name` primario:
    - `text` restituisce il token primario del comando testuale senza il carattere iniziale `/`
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider
      quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando esiste.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa più sulla disponibilità
    dei comandi Plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati serializzati degli argomenti.
- Gli operator possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti runtime per un
  agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del Plugin quando `source="plugin"`
  - `optional`: se uno strumento Plugin è facoltativo
- Gli operator possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario
  effettivo degli strumenti runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto runtime affidabile dalla sessione lato server invece di accettare
    contesto auth o di consegna fornito dal chiamante.
  - La risposta è limitata alla sessione e riflette ciò che la conversazione attiva può usare in questo momento,
    inclusi strumenti core, Plugin e canale.
- Gli operator possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario
  visibile delle Skills per un agente.
  - `agentId` è facoltativo; omettilo per leggere lo spazio di lavoro dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e
    opzioni di installazione sanificate senza esporre valori secret grezzi.
- Gli operator possono chiamare `skills.search` e `skills.detail` (`operator.read`) per
  i metadati di discovery di ClawHub.
- Gli operator possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella Skill nella directory `skills/` dello spazio di lavoro dell'agente predefinito.
  - Modalità installer gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    esegue un'azione dichiarata `metadata.openclaw.install` sull'host del gateway.
- Gli operator possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nello
    spazio di lavoro dell'agente predefinito.
  - La modalità configurazione corregge valori `skills.entries.<skillKey>` come `enabled`,
    `apiKey` ed `env`.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operator risolvono chiamando `exec.approval.resolve` (richiede lo scope `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati di sessione canonici). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riusano quel
  `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra prepare e l'inoltro finale approvato di `system.run`, il
  gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback di consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene un comportamento rigoroso: le destinazioni di consegna irrisolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo-sessione quando non può essere risolto alcun percorso esterno consegnabile (ad esempio sessioni interne/webchat o configurazioni multi-canale ambigue).

## Versioning

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta i mismatch.
- Schemi + modelli vengono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti del client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono
stabili in tutto il protocollo v3 e sono la baseline prevista per i client di terze parti.

| Costante                                  | Predefinito                                           | Sorgente                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout richiesta (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff iniziale di riconnessione         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp del fast-retry dopo chiusura device-token | `250` ms                                         | `src/gateway/client.ts`                                    |
| Grace di force-stop prima di `terminate()` | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                     | `src/gateway/client.ts`                                    |
| Chiusura per tick-timeout                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                           |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Il server pubblicizza in `hello-ok` i valori effettivi `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes`; i client dovrebbero rispettare tali valori
piuttosto che i valori predefiniti pre-handshake.

## Auth

- L'auth del gateway con secret condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità auth configurata.
- Le modalità che portano identità come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"`
  non-loopback soddisfano il controllo auth di connect dai
  request header invece di `connect.params.auth.*`.
- L'ingresso privato `gateway.auth.mode: "none"` salta completamente l'auth di connect con secret condiviso; non esporre tale modalità su ingressi pubblici/non affidabili.
- Dopo il pairing, il Gateway emette un **device token** limitato al role + scope
  della connessione. Viene restituito in `hello-ok.auth.deviceToken` e il client dovrebbe
  renderlo persistente per connessioni future.
- I client dovrebbero rendere persistente il `hello-ok.auth.deviceToken` primario dopo ogni
  connessione riuscita.
- La riconnessione con quel **device token** memorizzato dovrebbe anche riusare l'insieme di scope approvati
  memorizzato per quel token. Questo preserva l'accesso read/probe/status già
  concesso ed evita di restringere silenziosamente le riconnessioni a uno
  scope implicito più ristretto solo admin.
- Assemblaggio auth di connect lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrata quando impostata.
  - `auth.token` viene popolato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, poi un token per-device memorizzato (con chiave per
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi device token risolto lo sopprime.
  - La promozione automatica di un device token memorizzato nel retry one-shot
    `AUTH_TOKEN_MISMATCH` è limitata **solo a endpoint affidabili** —
    loopback, oppure `wss://` con `tlsFingerprint` pinned. `wss://` pubblico
    senza pinning non è idoneo.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di handoff del bootstrap.
  Rendile persistenti solo quando la connessione ha usato bootstrap auth su un trasporto affidabile
  come `wss://` o loopback/local pairing.
- Se un client fornisce un **deviceToken** esplicito o **scopes** espliciti, quell'
  insieme di scope richiesto dal chiamante rimane autorevole; gli scope in cache vengono
  riusati solo quando il client sta riusando il token per-device memorizzato.
- I device token possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede lo scope `operator.pairing`).
- L'emissione/rotazione dei token resta limitata all'insieme di role approvati registrato nella
  voce di pairing di quel dispositivo; ruotare un token non può espandere il dispositivo in un
  role che l'approvazione del pairing non ha mai concesso.
- Per le sessioni token di dispositivo accoppiato, la gestione del dispositivo è auto-limitata a meno che il
  chiamante non abbia anche `operator.admin`: i chiamanti non-admin possono rimuovere/revocare/ruotare
  solo la **propria** voce di dispositivo.
- `device.token.rotate` controlla anche l'insieme di scope operator richiesto rispetto agli
  scope della sessione corrente del chiamante. I chiamanti non-admin non possono ruotare un token verso
  un insieme di scope operator più ampio di quello che già possiedono.
- I fallimenti auth includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client affidabili possono tentare un singolo retry limitato con un token per-device in cache.
  - Se quel retry fallisce, i client dovrebbero interrompere i loop automatici di riconnessione e mostrare indicazioni di azione all'operatore.

## Identità del dispositivo + pairing

- I node dovrebbero includere un'identità di dispositivo stabile (`device.id`) derivata dall'impronta
  di una coppia di chiavi.
- I gateway emettono token per dispositivo + role.
- Le approvazioni di pairing sono richieste per nuovi ID dispositivo a meno che l'auto-approvazione locale
  non sia abilitata.
- L'auto-approvazione del pairing è centrata sulle connessioni dirette locali loopback.
- OpenClaw ha anche uno stretto percorso self-connect backend/container-local per
  flussi helper affidabili con secret condiviso.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per il pairing e
  richiedono approvazione.
- Tutti i client WS devono includere l'identità `device` durante `connect` (operator + node).
  Control UI può ometterla solo in queste modalità:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità con HTTP insicuro solo localhost.
  - auth operator Control UI riuscita con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave downgrade di sicurezza).
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica di migrazione auth del dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori comuni di migrazione:

| Messaggio                    | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde all'impronta della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Il formato/canonicalizzazione della chiave pubblica non è riuscito. |

Obiettivo della migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi device/client/role/scopes/token/nonce.
- Le firme legacy `v2` continuano a essere accettate per compatibilità, ma il pinning dei
  metadati del dispositivo accoppiato continua comunque a controllare la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fare pinning dell'impronta del certificato del gateway (vedi configurazione `gateway.tls`
  più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone l'**intera API del gateway** (status, canali, modelli, chat,
agent, sessioni, node, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook Gateway](/it/gateway)
