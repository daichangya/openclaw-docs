---
read_when:
    - Esecuzione o debug del processo Gateway
summary: Runbook per il servizio Gateway, il ciclo di vita e le operazioni
title: Runbook del Gateway
x-i18n:
    generated_at: "2026-04-25T13:47:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

Usa questa pagina per l'avvio day-1 e le operazioni day-2 del servizio Gateway.

<CardGroup cols={2}>
  <Card title="Risoluzione approfondita dei problemi" icon="siren" href="/it/gateway/troubleshooting">
    Diagnostica orientata ai sintomi con sequenze di comandi esatte e firme nei log.
  </Card>
  <Card title="Configurazione" icon="sliders" href="/it/gateway/configuration">
    Guida di configurazione orientata alle attività + riferimento completo della configurazione.
  </Card>
  <Card title="Gestione dei segreti" icon="key-round" href="/it/gateway/secrets">
    Contratto SecretRef, comportamento dello snapshot runtime e operazioni di migrazione/ricarica.
  </Card>
  <Card title="Contratto del piano dei segreti" icon="shield-check" href="/it/gateway/secrets-plan-contract">
    Regole esatte di target/percorso per `secrets apply` e comportamento dei profili auth solo-ref.
  </Card>
</CardGroup>

## Avvio locale in 5 minuti

<Steps>
  <Step title="Avvia il Gateway">

```bash
openclaw gateway --port 18789
# debug/trace rispecchiati su stdio
openclaw gateway --port 18789 --verbose
# termina forzatamente il listener sulla porta selezionata, poi avvia
openclaw gateway --force
```

  </Step>

  <Step title="Verifica lo stato del servizio">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline sana: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` che corrisponde a quanto ti aspetti. Usa `openclaw gateway status --require-rpc` quando ti serve la prova RPC con ambito di lettura, non solo la raggiungibilità.

  </Step>

  <Step title="Convalida la disponibilità del canale">

```bash
openclaw channels status --probe
```

Con un gateway raggiungibile, questo esegue probe live per canale per account e audit opzionali.
Se il gateway non è raggiungibile, la CLI torna ai riepiloghi dei canali basati solo sulla configurazione invece dell'output delle probe live.

  </Step>
</Steps>

<Note>
La ricarica della configurazione del Gateway osserva il percorso del file di configurazione attivo (risolto dai valori predefiniti di profilo/stato, o da `OPENCLAW_CONFIG_PATH` quando impostato).
La modalità predefinita è `gateway.reload.mode="hybrid"`.
Dopo il primo caricamento riuscito, il processo in esecuzione serve lo snapshot della configurazione attiva in memoria; una ricarica riuscita sostituisce quello snapshot in modo atomico.
</Note>

## Modello di runtime

- Un singolo processo sempre attivo per instradamento, control plane e connessioni ai canali.
- Una singola porta multiplexata per:
  - controllo/RPC WebSocket
  - API HTTP, compatibili con OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI e hook
- Modalità di bind predefinita: `loopback`.
- L'autenticazione è richiesta per impostazione predefinita. Le configurazioni con segreto condiviso usano `gateway.auth.token` / `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e le configurazioni reverse-proxy non loopback possono usare `gateway.auth.mode: "trusted-proxy"`.

## Endpoint compatibili con OpenAI

La superficie di compatibilità di OpenClaw a più alto impatto ora è:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Perché questo insieme è importante:

- La maggior parte delle integrazioni Open WebUI, LobeChat e LibreChat esegue prima una probe su `/v1/models`.
- Molte pipeline RAG e di memoria si aspettano `/v1/embeddings`.
- I client nativi per agenti preferiscono sempre più spesso `/v1/responses`.

Nota di pianificazione:

- `/v1/models` è agent-first: restituisce `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` è l'alias stabile che mappa sempre all'agente predefinito configurato.
- Usa `x-openclaw-model` quando vuoi un override di backend provider/modello; altrimenti restano in controllo il normale setup di modello ed embeddings dell'agente selezionato.

Tutti questi endpoint girano sulla porta principale del Gateway e usano lo stesso confine di autenticazione dell'operatore fidato del resto dell'API HTTP del Gateway.

### Precedenza di porta e bind

| Impostazione | Ordine di risoluzione                                           |
| ------------ | --------------------------------------------------------------- |
| Porta Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modalità bind | CLI/override → `gateway.bind` → `loopback`                    |

### Modalità di hot reload

| `gateway.reload.mode` | Comportamento                             |
| --------------------- | ----------------------------------------- |
| `off`                 | Nessuna ricarica della configurazione     |
| `hot`                 | Applica solo modifiche hot-safe           |
| `restart`             | Riavvia in caso di modifiche che richiedono reload |
| `hybrid` (predefinito) | Applica a caldo quando è sicuro, riavvia quando richiesto |

## Set di comandi operatore

```bash
openclaw gateway status
openclaw gateway status --deep   # aggiunge una scansione del servizio a livello sistema
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` serve per un'ulteriore individuazione dei servizi (LaunchDaemons/unità di sistema systemd/schtasks), non per una probe RPC di health più approfondita.

## Gateway multipli (stesso host)

La maggior parte delle installazioni dovrebbe eseguire un solo gateway per macchina. Un singolo gateway può ospitare più agenti e canali.

Hai bisogno di più gateway solo quando vuoi intenzionalmente isolamento o un bot di emergenza.

Controlli utili:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Cosa aspettarsi:

- `gateway status --deep` può riportare `Other gateway-like services detected (best effort)` e stampare suggerimenti di pulizia quando sono ancora presenti installazioni launchd/systemd/schtasks obsolete.
- `gateway probe` può avvisare con `multiple reachable gateways` quando risponde più di una destinazione.
- Se ciò è intenzionale, isola porte, config/stato e radici workspace per gateway.

Checklist per istanza:

- `gateway.port` univoco
- `OPENCLAW_CONFIG_PATH` univoco
- `OPENCLAW_STATE_DIR` univoco
- `agents.defaults.workspace` univoco

Esempio:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Configurazione dettagliata: [/gateway/multiple-gateways](/it/gateway/multiple-gateways).

## Endpoint brain real-time VoiceClaw

OpenClaw espone un endpoint WebSocket real-time compatibile con VoiceClaw su `/voiceclaw/realtime`. Usalo quando un client desktop VoiceClaw deve parlare direttamente con un brain OpenClaw real-time invece di passare attraverso un processo relay separato.

L'endpoint usa Gemini Live per l'audio in tempo reale e chiama OpenClaw come brain esponendo direttamente a Gemini Live gli strumenti OpenClaw. Le chiamate agli strumenti restituiscono subito un risultato `working` per mantenere reattivo il turno vocale, poi OpenClaw esegue realmente lo strumento in modo asincrono e inietta il risultato nella sessione live. Imposta `GEMINI_API_KEY` nell'ambiente di processo del gateway. Se l'autenticazione del gateway è abilitata, il client desktop invia il token o la password del gateway nel suo primo messaggio `session.config`.

L'accesso al brain real-time esegue comandi dell'agente OpenClaw autorizzati dal proprietario. Mantieni `gateway.auth.mode: "none"` limitato alle istanze di test solo loopback. Le connessioni non locali al brain real-time richiedono l'autenticazione del gateway.

Per un gateway di test isolato, esegui un'istanza separata con porta, configurazione e stato propri:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Poi configura VoiceClaw per usare:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Accesso remoto

Preferito: Tailscale/VPN.
Fallback: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Poi collega i client localmente a `ws://127.0.0.1:18789`.

<Warning>
I tunnel SSH non bypassano l'autenticazione del gateway. Per l'autenticazione con segreto condiviso, i client devono comunque inviare `token`/`password` anche attraverso il tunnel. Per le modalità che portano identità, la richiesta deve comunque soddisfare quel percorso di autenticazione.
</Warning>

Vedi: [Gateway remoto](/it/gateway/remote), [Autenticazione](/it/gateway/authentication), [Tailscale](/it/gateway/tailscale).

## Supervisione e ciclo di vita del servizio

Usa esecuzioni supervisionate per un'affidabilità di livello produzione.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Le etichette LaunchAgent sono `ai.openclaw.gateway` (predefinita) o `ai.openclaw.<profile>` (profilo con nome). `openclaw doctor` controlla e ripara la deriva della configurazione del servizio.

  </Tab>

  <Tab title="Linux (systemd utente)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Per la persistenza dopo il logout, abilita lingering:

```bash
sudo loginctl enable-linger <user>
```

Esempio di unità utente manuale quando ti serve un percorso di installazione personalizzato:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (nativo)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

L'avvio gestito nativo di Windows usa un'Attività pianificata chiamata `OpenClaw Gateway` (oppure `OpenClaw Gateway (<profile>)` per i profili con nome). Se la creazione dell'Attività pianificata viene negata, OpenClaw usa come fallback un launcher per utente nella cartella Startup che punta a `gateway.cmd` nella directory di stato.

  </Tab>

  <Tab title="Linux (servizio di sistema)">

Usa un'unità di sistema per host multiutente/sempre attivi.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usa lo stesso corpo del servizio dell'unità utente, ma installalo in `/etc/systemd/system/openclaw-gateway[-<profile>].service` e regola `ExecStart=` se il binario `openclaw` si trova altrove.

  </Tab>
</Tabs>

## Percorso rapido del profilo dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

I valori predefiniti includono stato/config isolati e porta gateway base `19001`.

## Riferimento rapido del protocollo (vista operatore)

- Il primo frame del client deve essere `connect`.
- Il Gateway restituisce lo snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limiti/policy).
- `hello-ok.features.methods` / `events` sono un elenco di individuazione conservativo, non un dump generato di ogni helper route richiamabile.
- Richieste: `req(method, params)` → `res(ok/payload|error)`.
- Gli eventi comuni includono `connect.challenge`, `agent`, `chat`, `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`, `health`, `heartbeat`, eventi del ciclo di vita pairing/approval e `shutdown`.

Le esecuzioni degli agenti sono a due stadi:

1. Ack immediato di accettazione (`status:"accepted"`)
2. Risposta finale di completamento (`status:"ok"|"error"`), con eventi `agent` in streaming nel mezzo.

Vedi la documentazione completa del protocollo: [Protocollo Gateway](/it/gateway/protocol).

## Controlli operativi

### Liveness

- Apri il WS e invia `connect`.
- Aspettati una risposta `hello-ok` con snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap recovery

Gli eventi non vengono riprodotti. In caso di gap di sequenza, aggiorna lo stato (`health`, `system-presence`) prima di continuare.

## Firme di errore comuni

| Firma                                                         | Problema probabile                                                               |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind non-loopback senza un percorso di autenticazione gateway valido             |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflitto di porta                                                               |
| `Gateway start blocked: set gateway.mode=local`               | Configurazione impostata in modalità remota, oppure stamp della modalità locale mancante in una configurazione danneggiata |
| `unauthorized` during connect                                 | Mancata corrispondenza dell'autenticazione tra client e gateway                  |

Per sequenze complete di diagnosi, usa [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting).

## Garanzie di sicurezza

- I client del protocollo Gateway falliscono rapidamente quando il Gateway non è disponibile (nessun fallback implicito diretto al canale).
- I primi frame non validi/non `connect` vengono rifiutati e la connessione viene chiusa.
- Lo shutdown graceful emette l'evento `shutdown` prima della chiusura del socket.

---

Correlati:

- [Risoluzione dei problemi](/it/gateway/troubleshooting)
- [Processo in background](/it/gateway/background-process)
- [Configurazione](/it/gateway/configuration)
- [Health](/it/gateway/health)
- [Doctor](/it/gateway/doctor)
- [Autenticazione](/it/gateway/authentication)

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
- [Accesso remoto](/it/gateway/remote)
- [Gestione dei segreti](/it/gateway/secrets)
