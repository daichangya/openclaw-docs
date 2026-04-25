---
read_when:
    - Esecuzione dell'host Node headless
    - Abbinamento di un Node non macOS per `system.run`
summary: Riferimento CLI per `openclaw node` (host Node headless)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Esegui un **host Node headless** che si connette al Gateway WebSocket ed espone
`system.run` / `system.which` su questa macchina.

## Perché usare un host Node?

Usa un host Node quando vuoi che gli agenti **eseguano comandi su altre macchine** nella tua
rete senza installare lì un'app companion macOS completa.

Casi d'uso comuni:

- Eseguire comandi su macchine Linux/Windows remote (server di build, macchine di laboratorio, NAS).
- Mantenere exec **isolato** sul gateway, ma delegare le esecuzioni approvate ad altri host.
- Fornire una destinazione di esecuzione leggera e headless per nodi di automazione o CI.

L'esecuzione è comunque protetta da **approvazioni exec** e allowlist per agente sull'host
Node, così puoi mantenere l'accesso ai comandi limitato ed esplicito.

## Proxy browser (zero-config)

Gli host Node pubblicizzano automaticamente un proxy browser se `browser.enabled` non è
disabilitato sul Node. Questo consente all'agente di usare l'automazione del browser su quel Node
senza configurazione aggiuntiva.

Per impostazione predefinita, il proxy espone la normale superficie del profilo browser del Node. Se
imposti `nodeHost.browserProxy.allowProfiles`, il proxy diventa restrittivo:
la selezione di profili non presenti nella allowlist viene rifiutata, e le route di
creazione/eliminazione di profili persistenti vengono bloccate tramite il proxy.

Disabilitalo sul Node se necessario:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Esegui (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (predefinita: `18789`)
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint prevista del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'ID del Node (cancella il token di pairing)
- `--display-name <name>`: sovrascrive il nome visualizzato del Node

## Autenticazione del Gateway per l'host Node

`openclaw node run` e `openclaw node install` risolvono l'autenticazione del gateway da config/env (nessun flag `--token`/`--password` sui comandi node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` vengono controllati per primi.
- Poi fallback alla configurazione locale: `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node intenzionalmente non eredita `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` è esplicitamente configurato tramite SecretRef e non risolto, la risoluzione dell'autenticazione del Node fallisce in modalità chiusa (nessun fallback remoto che mascheri il problema).
- In `gateway.mode=remote`, anche i campi del client remoto (`gateway.remote.token` / `gateway.remote.password`) sono idonei secondo le regole di precedenza remote.
- La risoluzione dell'autenticazione dell'host Node considera solo le variabili d'ambiente `OPENCLAW_GATEWAY_*`.

Per un Node che si connette a un Gateway `ws://` non loopback su una rete privata
fidata, imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Senza questa impostazione,
l'avvio del Node fallisce in modalità chiusa e chiede di usare `wss://`, un tunnel SSH o Tailscale.
Si tratta di un opt-in tramite ambiente di processo, non di una chiave di configurazione `openclaw.json`.
`openclaw node install` la rende persistente nel servizio Node supervisionato quando è
presente nell'ambiente del comando di installazione.

## Servizio (background)

Installa un host Node headless come servizio utente.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (predefinita: `18789`)
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint prevista del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'ID del Node (cancella il token di pairing)
- `--display-name <name>`: sovrascrive il nome visualizzato del Node
- `--runtime <runtime>`: runtime del servizio (`node` o `bun`)
- `--force`: reinstalla/sovrascrive se già installato

Gestisci il servizio:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` per un host Node in foreground (senza servizio).

I comandi del servizio accettano `--json` per un output leggibile da macchina.

## Pairing

La prima connessione crea una richiesta di pairing del dispositivo in attesa (`role: node`) sul Gateway.
Approvala con:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nelle reti Node strettamente controllate, l'operatore del Gateway può scegliere esplicitamente
di approvare automaticamente il pairing iniziale dei Node provenienti da CIDR attendibili:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Questa funzione è disabilitata per impostazione predefinita. Si applica solo al nuovo pairing `role: node` con
nessun ambito richiesto. Client operatore/browser, Control UI, WebChat e aggiornamenti di ruolo,
ambito, metadati o chiave pubblica richiedono comunque approvazione manuale.

Se il Node ritenta il pairing con dettagli di autenticazione cambiati (ruolo/ambiti/chiave pubblica),
la precedente richiesta in attesa viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

L'host Node memorizza ID Node, token, nome visualizzato e informazioni di connessione al gateway in
`~/.openclaw/node.json`.

## Approvazioni exec

`system.run` è protetto da approvazioni exec locali:

- `~/.openclaw/exec-approvals.json`
- [Approvazioni exec](/it/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifica dal Gateway)

Per exec asincrono approvato sul Node, OpenClaw prepara un `systemRunPlan`
canonico prima di richiedere il prompt. Il successivo inoltro `system.run` approvato riutilizza quel
piano memorizzato, quindi le modifiche ai campi command/cwd/session dopo la creazione della richiesta
di approvazione vengono rifiutate invece di cambiare ciò che il Node esegue.

## Correlati

- [Riferimento CLI](/it/cli)
- [Nodes](/it/nodes)
