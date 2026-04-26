---
read_when:
    - Esecuzione dell'host Node headless
    - Abbinamento di un Node non macOS per system.run
summary: Riferimento CLI per `openclaw node` (host Node headless)
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Esegui un **host Node headless** che si connette al WebSocket del Gateway ed espone
`system.run` / `system.which` su questa macchina.

## Perché usare un host Node?

Usa un host Node quando vuoi che gli agenti **eseguano comandi su altre macchine** nella tua
rete senza installare lì un'app companion macOS completa.

Casi d'uso comuni:

- Eseguire comandi su macchine Linux/Windows remote (server di build, macchine di laboratorio, NAS).
- Mantenere l'exec **sandboxed** sul gateway, ma delegare le esecuzioni approvate ad altri host.
- Fornire un target di esecuzione leggero e headless per nodi di automazione o CI.

L'esecuzione resta comunque protetta da **approvazioni exec** e da allowlist per agente sull'host
Node, così puoi mantenere l'accesso ai comandi limitato ed esplicito.

## Proxy browser (zero-config)

Gli host Node pubblicizzano automaticamente un proxy browser se `browser.enabled` non è
disabilitato sul nodo. Questo consente all'agente di usare l'automazione del browser su quel nodo
senza configurazione aggiuntiva.

Per impostazione predefinita, il proxy espone la normale superficie del profilo browser del nodo. Se
imposti `nodeHost.browserProxy.allowProfiles`, il proxy diventa restrittivo:
il targeting di profili non presenti nella allowlist viene rifiutato e le route di
creazione/eliminazione di profili persistenti vengono bloccate tramite il proxy.

Disabilitalo sul nodo, se necessario:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Esecuzione (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (predefinito: `18789`)
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint attesa del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'ID del nodo (cancella il token di abbinamento)
- `--display-name <name>`: sovrascrive il nome visualizzato del nodo

## Autenticazione Gateway per host Node

`openclaw node run` e `openclaw node install` risolvono l'autenticazione del gateway da config/env (nessun flag `--token`/`--password` nei comandi del nodo):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` vengono controllati per primi.
- Poi fallback alla configurazione locale: `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node intenzionalmente non eredita `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non viene risolto, la risoluzione dell'autenticazione del nodo fallisce in modo chiuso (nessun fallback remoto a mascherarlo).
- In `gateway.mode=remote`, anche i campi del client remoto (`gateway.remote.token` / `gateway.remote.password`) sono idonei secondo le regole di precedenza remota.
- La risoluzione dell'autenticazione dell'host Node onora solo le variabili d'ambiente `OPENCLAW_GATEWAY_*`.

Per un nodo che si connette a un Gateway `ws://` non-loopback su una rete privata
fidata, imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Senza questa impostazione, l'avvio del nodo
fallisce in modo chiuso e richiede di usare `wss://`, un tunnel SSH o Tailscale.
Si tratta di un opt-in dell'ambiente di processo, non di una chiave di configurazione in `openclaw.json`.
`openclaw node install` lo rende persistente nel servizio del nodo supervisionato quando è
presente nell'ambiente del comando di installazione.

## Servizio (background)

Installa un host Node headless come servizio utente.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (predefinito: `18789`)
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint attesa del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'ID del nodo (cancella il token di abbinamento)
- `--display-name <name>`: sovrascrive il nome visualizzato del nodo
- `--runtime <runtime>`: runtime del servizio (`node` o `bun`)
- `--force`: reinstalla/sovrascrive se già installato

Gestisci il servizio:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` per un host Node in foreground (senza servizio).

I comandi del servizio accettano `--json` per output leggibile dalle macchine.

L'host Node ritenta riavvio del Gateway e chiusure di rete all'interno del processo. Se il
Gateway segnala una pausa terminale di autenticazione token/password/bootstrap, l'host Node
registra il dettaglio della chiusura ed esce con codice diverso da zero così launchd/systemd può
riavviarlo con configurazione e credenziali aggiornate. Le pause che richiedono abbinamento restano nel flusso
foreground così la richiesta in sospeso può essere approvata.

## Abbinamento

La prima connessione crea una richiesta di abbinamento dispositivo in sospeso (`role: node`) sul Gateway.
Approvala tramite:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Su reti di nodi strettamente controllate, l'operatore del Gateway può scegliere esplicitamente
di approvare automaticamente il primo abbinamento del nodo da CIDR fidati:

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

Questa opzione è disabilitata per impostazione predefinita. Si applica solo ad abbinamenti iniziali `role: node` con
nessuno scope richiesto. Client operatore/browser, Control UI, WebChat e aggiornamenti di ruolo,
scope, metadati o chiave pubblica richiedono comunque approvazione manuale.

Se il nodo ritenta l'abbinamento con dettagli di autenticazione cambiati (ruolo/scope/chiave pubblica),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

L'host Node memorizza ID nodo, token, nome visualizzato e informazioni di connessione al gateway in
`~/.openclaw/node.json`.

## Approvazioni exec

`system.run` è protetto dalle approvazioni exec locali:

- `~/.openclaw/exec-approvals.json`
- [Approvazioni exec](/it/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifica dal Gateway)

Per exec asincrono del nodo approvato, OpenClaw prepara un `systemRunPlan` canonico
prima della richiesta di approvazione. Il successivo inoltro `system.run` approvato riutilizza quel piano
memorizzato, quindi le modifiche ai campi command/cwd/session dopo la creazione della richiesta di approvazione
vengono rifiutate invece di cambiare ciò che il nodo esegue.

## Correlati

- [Riferimento CLI](/it/cli)
- [Nodes](/it/nodes)
