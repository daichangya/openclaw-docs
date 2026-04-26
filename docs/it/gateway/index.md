---
read_when:
    - Esecuzione o debugging del processo Gateway
summary: Runbook per il servizio Gateway, il ciclo di vita e le operazioni
title: Runbook del Gateway
x-i18n:
    generated_at: "2026-04-26T11:28:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

Usa questa pagina per l’avvio day-1 e le operazioni day-2 del servizio Gateway.

<CardGroup cols={2}>
  <Card title="Risoluzione approfondita dei problemi" icon="siren" href="/it/gateway/troubleshooting">
    Diagnostica orientata ai sintomi con sequenze esatte di comandi e firme dei log.
  </Card>
  <Card title="Configuration" icon="sliders" href="/it/gateway/configuration">
    Guida di configurazione orientata alle attività + riferimento completo della configurazione.
  </Card>
  <Card title="Gestione dei segreti" icon="key-round" href="/it/gateway/secrets">
    Contratto SecretRef, comportamento dello snapshot runtime e operazioni di migrazione/reload.
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

  <Step title="Verifica lo stato di salute del servizio">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline sana: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` corrispondente a ciò che ti aspetti. Usa `openclaw gateway status --require-rpc` quando ti serve una prova RPC con scope di lettura, non solo raggiungibilità.

  </Step>

  <Step title="Convalida la disponibilità dei canali">

```bash
openclaw channels status --probe
```

Con un gateway raggiungibile questo esegue probe live per account sui canali e audit facoltativi.
Se il gateway non è raggiungibile, la CLI ripiega su riepiloghi dei canali basati solo sulla config
invece dell’output del probe live.

  </Step>
</Steps>

<Note>
Il reload della config del Gateway osserva il percorso del file config attivo (risolto dai valori predefiniti di profilo/stato o da `OPENCLAW_CONFIG_PATH` quando impostato).
La modalità predefinita è `gateway.reload.mode="hybrid"`.
Dopo il primo caricamento riuscito, il processo in esecuzione serve lo snapshot della config attiva in memoria; un reload riuscito sostituisce quello snapshot in modo atomico.
</Note>

## Modello runtime

- Un solo processo sempre attivo per routing, control plane e connessioni ai canali.
- Una singola porta multiplexata per:
  - controllo/RPC WebSocket
  - API HTTP, compatibili OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI e hook
- Modalità di bind predefinita: `loopback`.
- L’auth è richiesta per impostazione predefinita. Le configurazioni con segreto condiviso usano
  `gateway.auth.token` / `gateway.auth.password` (o
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e le configurazioni con reverse proxy
  non loopback possono usare `gateway.auth.mode: "trusted-proxy"`.

## Endpoint compatibili OpenAI

La superficie di compatibilità a più alto impatto di OpenClaw ora è:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Perché questo insieme è importante:

- La maggior parte delle integrazioni Open WebUI, LobeChat e LibreChat interroga prima `/v1/models`.
- Molte pipeline RAG e di memoria si aspettano `/v1/embeddings`.
- I client nativi per agenti preferiscono sempre più `/v1/responses`.

Nota di pianificazione:

- `/v1/models` è agent-first: restituisce `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` è l’alias stabile che mappa sempre all’agente predefinito configurato.
- Usa `x-openclaw-model` quando vuoi un override di provider/modello backend; altrimenti restano in controllo il normale setup di modello ed embedding dell’agente selezionato.

Tutti questi endpoint girano sulla porta principale del Gateway e usano lo stesso confine auth dell’operatore attendibile del resto dell’API HTTP del Gateway.

### Precedenza di porta e bind

| Impostazione  | Ordine di risoluzione                                         |
| ------------- | ------------------------------------------------------------- |
| Porta Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modalità bind | CLI/override → `gateway.bind` → `loopback`                    |

All’avvio del Gateway vengono usati la stessa porta effettiva e lo stesso bind anche per inizializzare
le origini locali della Control UI per bind non loopback. Ad esempio, `--bind lan --port 3000`
inizializza `http://localhost:3000` e `http://127.0.0.1:3000` prima che venga eseguita la
validazione runtime. Aggiungi esplicitamente eventuali origini browser remote, come URL HTTPS di proxy, a
`gateway.controlUi.allowedOrigins`.

### Modalità hot reload

| `gateway.reload.mode` | Comportamento                               |
| --------------------- | ------------------------------------------- |
| `off`                 | Nessun reload della config                  |
| `hot`                 | Applica solo modifiche sicure per hot reload |
| `restart`             | Riavvia per modifiche che richiedono reload |
| `hybrid` (predefinita) | Applica a caldo quando sicuro, riavvia quando necessario |

## Set di comandi per l’operatore

```bash
openclaw gateway status
openclaw gateway status --deep   # aggiunge una scansione del servizio a livello di sistema
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` serve per un rilevamento aggiuntivo dei servizi (LaunchDaemons/unità systemd di sistema
/schtasks), non per un probe di salute RPC più approfondito.

## Gateway multipli (stesso host)

La maggior parte delle installazioni dovrebbe eseguire un solo gateway per macchina. Un singolo gateway può ospitare più
agenti e canali.

Hai bisogno di più gateway solo quando vuoi intenzionalmente isolamento o un bot di emergenza.

Controlli utili:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Cosa aspettarsi:

- `gateway status --deep` può segnalare `Other gateway-like services detected (best effort)`
  e stampare suggerimenti di pulizia quando sono ancora presenti installazioni launchd/systemd/schtasks obsolete.
- `gateway probe` può avvisare di `multiple reachable gateways` quando risponde più di un target.
- Se è intenzionale, isola porte, config/stato e root del workspace per ogni gateway.

Checklist per istanza:

- `gateway.port` univoca
- `OPENCLAW_CONFIG_PATH` univoco
- `OPENCLAW_STATE_DIR` univoco
- `agents.defaults.workspace` univoco

Esempio:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Configurazione dettagliata: [/gateway/multiple-gateways](/it/gateway/multiple-gateways).

## Endpoint brain in tempo reale di VoiceClaw

OpenClaw espone un endpoint WebSocket in tempo reale compatibile con VoiceClaw su
`/voiceclaw/realtime`. Usalo quando un client desktop VoiceClaw deve parlare
direttamente con un brain OpenClaw in tempo reale invece di passare attraverso un processo relay
separato.

L’endpoint usa Gemini Live per l’audio in tempo reale e chiama OpenClaw come
brain esponendo gli strumenti OpenClaw direttamente a Gemini Live. Le chiamate agli strumenti restituiscono
un risultato immediato `working` per mantenere reattivo il turno vocale, poi OpenClaw
esegue realmente lo strumento in modo asincrono e inserisce il risultato nella
sessione live. Imposta `GEMINI_API_KEY` nell’ambiente del processo gateway. Se
l’auth del gateway è abilitata, il client desktop invia il token o la password del gateway
nel suo primo messaggio `session.config`.

L’accesso al brain in tempo reale esegue comandi dell’agente OpenClaw autorizzati dal proprietario. Limita
`gateway.auth.mode: "none"` a istanze di test solo loopback. Le connessioni non locali
al brain in tempo reale richiedono auth del gateway.

Per un gateway di test isolato, esegui un’istanza separata con porta, config
e stato propri:

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
I tunnel SSH non aggirano l’auth del gateway. Per l’auth con segreto condiviso, i client devono
comunque inviare `token`/`password` anche attraverso il tunnel. Per le modalità che portano identità,
la richiesta deve comunque soddisfare quel percorso auth.
</Warning>

Consulta: [Remote Gateway](/it/gateway/remote), [Authentication](/it/gateway/authentication), [Tailscale](/it/gateway/tailscale).

## Supervisione e ciclo di vita del servizio

Usa esecuzioni supervisionate per un’affidabilità simile alla produzione.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Usa `openclaw gateway restart` per i riavvii. Non concatenare `openclaw gateway stop` e `openclaw gateway start`; su macOS, `gateway stop` disabilita intenzionalmente il LaunchAgent prima di arrestarlo.

Le etichette del LaunchAgent sono `ai.openclaw.gateway` (predefinita) o `ai.openclaw.<profile>` (profilo con nome). `openclaw doctor` verifica e ripara la deriva della config del servizio.

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

Esempio manuale di unità utente quando ti serve un percorso di installazione personalizzato:

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

L’avvio gestito nativo di Windows usa un’attività pianificata chiamata `OpenClaw Gateway`
(o `OpenClaw Gateway (<profile>)` per profili con nome). Se la creazione dell’attività pianificata
viene negata, OpenClaw ripiega su un launcher per utente nella cartella Startup
che punta a `gateway.cmd` dentro la directory di stato.

  </Tab>

  <Tab title="Linux (servizio di sistema)">

Usa un’unità di sistema per host multiutente/sempre attivi.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usa lo stesso corpo del servizio dell’unità utente, ma installalo sotto
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e regola
`ExecStart=` se il tuo binario `openclaw` si trova altrove.

  </Tab>
</Tabs>

## Percorso rapido per il profilo dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

I valori predefiniti includono stato/config isolati e porta base del gateway `19001`.

## Riferimento rapido del protocollo (vista operatore)

- Il primo frame client deve essere `connect`.
- Il Gateway restituisce uno snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limiti/policy).
- `hello-ok.features.methods` / `events` sono un elenco di rilevamento conservativo, non
  un dump generato di ogni route helper invocabile.
- Richieste: `req(method, params)` → `res(ok/payload|error)`.
- Gli eventi comuni includono `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventi del ciclo di vita di pairing/approval e `shutdown`.

Le esecuzioni dell’agente sono in due fasi:

1. Ack immediato di accettazione (`status:"accepted"`)
2. Risposta finale di completamento (`status:"ok"|"error"`), con eventi `agent` in streaming nel mezzo.

Consulta la documentazione completa del protocollo: [Gateway Protocol](/it/gateway/protocol).

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

### Recupero dei gap

Gli eventi non vengono riprodotti. In caso di gap di sequenza, aggiorna lo stato (`health`, `system-presence`) prima di continuare.

## Firme comuni di errore

| Firma                                                          | Problema probabile                                                               |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non loopback senza un percorso auth del gateway valido                      |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflitto di porta                                                               |
| `Gateway start blocked: set gateway.mode=local`                | Config impostata in modalità remota, oppure manca il marcatore della modalità locale in una config danneggiata |
| `unauthorized` durante `connect`                               | Mancata corrispondenza auth tra client e gateway                                 |

Per sequenze complete di diagnosi, usa [Gateway Troubleshooting](/it/gateway/troubleshooting).

## Garanzie di sicurezza

- I client del protocollo Gateway falliscono rapidamente quando il Gateway non è disponibile (nessun fallback implicito diretto al canale).
- I primi frame non validi/non `connect` vengono rifiutati e la connessione viene chiusa.
- Lo shutdown ordinato emette l’evento `shutdown` prima della chiusura del socket.

---

Correlati:

- [Troubleshooting](/it/gateway/troubleshooting)
- [Background Process](/it/gateway/background-process)
- [Configuration](/it/gateway/configuration)
- [Health](/it/gateway/health)
- [Doctor](/it/gateway/doctor)
- [Authentication](/it/gateway/authentication)

## Correlati

- [Configuration](/it/gateway/configuration)
- [Gateway troubleshooting](/it/gateway/troubleshooting)
- [Accesso remoto](/it/gateway/remote)
- [Gestione dei segreti](/it/gateway/secrets)
