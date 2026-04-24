---
read_when:
    - Gateway-Prozess ausführen oder debuggen
summary: Runbook für den Gateway-Dienst, den Lebenszyklus und den Betrieb
title: Gateway-Runbook
x-i18n:
    generated_at: "2026-04-24T06:38:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

Verwenden Sie diese Seite für den Start am ersten Tag und den Betrieb am zweiten Tag des Gateway-Dienstes.

<CardGroup cols={2}>
  <Card title="Tiefgehende Fehlerbehebung" icon="siren" href="/de/gateway/troubleshooting">
    Symptomorientierte Diagnose mit exakten Befehlsleitern und Log-Signaturen.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Aufgabenorientierter Einrichtungsleitfaden + vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Secrets-Management" icon="key-round" href="/de/gateway/secrets">
    SecretRef-Vertrag, Verhalten von Laufzeit-Snapshots und Operationen für Migration/Reload.
  </Card>
  <Card title="Secrets-Plan-Vertrag" icon="shield-check" href="/de/gateway/secrets-plan-contract">
    Exakte Regeln für Ziel/Pfad von `secrets apply` und Auth-Profil-Verhalten nur mit Referenzen.
  </Card>
</CardGroup>

## Lokaler Start in 5 Minuten

<Steps>
  <Step title="Gateway starten">

```bash
openclaw gateway --port 18789
# debug/trace gespiegelt auf stdio
openclaw gateway --port 18789 --verbose
# Listener auf dem ausgewählten Port zwangsweise beenden, dann starten
openclaw gateway --force
```

  </Step>

  <Step title="Dienstzustand prüfen">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Gesunde Basislinie: `Runtime: running`, `Connectivity probe: ok` und `Capability: ...`, das dem entspricht, was Sie erwarten. Verwenden Sie `openclaw gateway status --require-rpc`, wenn Sie RPC-Nachweis mit Leseberechtigung benötigen, nicht nur Erreichbarkeit.

  </Step>

  <Step title="Kanalbereitschaft validieren">

```bash
openclaw channels status --probe
```

Mit einem erreichbaren Gateway führt dies Live-Channel-Probes pro Account und optionale Audits aus.
Wenn das Gateway nicht erreichbar ist, fällt die CLI auf reine Konfigurationszusammenfassungen für Kanäle zurück
statt auf Live-Probe-Ausgaben.

  </Step>
</Steps>

<Note>
Der Reload der Gateway-Konfiguration überwacht den aktiven Konfigurationsdateipfad (aufgelöst aus Profil-/Status-Standards oder `OPENCLAW_CONFIG_PATH`, falls gesetzt).
Der Standardmodus ist `gateway.reload.mode="hybrid"`.
Nach dem ersten erfolgreichen Laden liefert der laufende Prozess den aktiven In-Memory-Konfigurations-Snapshot aus; ein erfolgreicher Reload ersetzt diesen Snapshot atomar.
</Note>

## Laufzeitmodell

- Ein ständig laufender Prozess für Routing, Control Plane und Kanalverbindungen.
- Ein einzelner multiplexter Port für:
  - WebSocket-Control/RPC
  - HTTP-APIs, OpenAI-kompatibel (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI und Hooks
- Standard-Bind-Modus: `loopback`.
- Auth ist standardmäßig erforderlich. Setups mit gemeinsamem Secret verwenden
  `gateway.auth.token` / `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), und Reverse-Proxy-Setups ohne Loopback
  können `gateway.auth.mode: "trusted-proxy"` verwenden.

## OpenAI-kompatible Endpunkte

Die kompatible Oberfläche mit dem höchsten Hebel in OpenClaw ist jetzt:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Warum diese Auswahl wichtig ist:

- Die meisten Integrationen mit Open WebUI, LobeChat und LibreChat prüfen zuerst `/v1/models`.
- Viele RAG- und Memory-Pipelines erwarten `/v1/embeddings`.
- Agenten-native Clients bevorzugen zunehmend `/v1/responses`.

Hinweis zur Planung:

- `/v1/models` ist agentenorientiert: Es gibt `openclaw`, `openclaw/default` und `openclaw/<agentId>` zurück.
- `openclaw/default` ist der stabile Alias, der immer dem konfigurierten Standard-Agenten entspricht.
- Verwenden Sie `x-openclaw-model`, wenn Sie eine Überschreibung für Backend-Provider/-Modell möchten; andernfalls bleibt die normale Modell- und Embedding-Konfiguration des ausgewählten Agenten maßgeblich.

All dies läuft auf dem Hauptport des Gateway und verwendet dieselbe vertrauenswürdige Auth-Grenze für Operatoren wie der Rest der Gateway-HTTP-API.

### Priorität von Port und Bind

| Einstellung   | Auflösungsreihenfolge                                          |
| ------------- | -------------------------------------------------------------- |
| Gateway-Port  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind-Modus    | CLI/Override → `gateway.bind` → `loopback`                    |

### Hot-Reload-Modi

| `gateway.reload.mode` | Verhalten                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Kein Reload der Konfiguration              |
| `hot`                 | Nur hot-sichere Änderungen anwenden        |
| `restart`             | Bei reload-pflichtigen Änderungen neu starten |
| `hybrid` (Standard)   | Hot anwenden, wenn sicher, sonst Neustart  |

## Befehlssatz für Operatoren

```bash
openclaw gateway status
openclaw gateway status --deep   # fügt einen systemweiten Dienstscan hinzu
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` dient zusätzlicher Diensterkennung (LaunchDaemons/systemd-System-
Units/schtasks), nicht einer tieferen RPC-Zustandsprüfung.

## Mehrere Gateways (gleicher Host)

Die meisten Installationen sollten ein Gateway pro Rechner ausführen. Ein einzelnes Gateway kann mehrere
Agenten und Kanäle hosten.

Sie benötigen nur dann mehrere Gateways, wenn Sie absichtlich Isolation oder einen Rescue-Bot möchten.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Was zu erwarten ist:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)`
  melden und Hinweise zur Bereinigung ausgeben, wenn noch veraltete launchd/systemd/schtasks-Installationen vorhanden sind.
- `gateway probe` kann vor `multiple reachable gateways` warnen, wenn mehr als ein Ziel
  antwortet.
- Wenn das beabsichtigt ist, isolieren Sie Ports, Konfigurations-/Statusverzeichnisse und Workspace-Wurzeln pro Gateway.

Checkliste pro Instanz:

- Eindeutiger `gateway.port`
- Eindeutiger `OPENCLAW_CONFIG_PATH`
- Eindeutiges `OPENCLAW_STATE_DIR`
- Eindeutiger `agents.defaults.workspace`

Beispiel:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Detaillierte Einrichtung: [/gateway/multiple-gateways](/de/gateway/multiple-gateways).

## Remote-Zugriff

Bevorzugt: Tailscale/VPN.
Fallback: SSH-Tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Verbinden Sie dann Clients lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen Gateway-Auth nicht. Bei Auth mit gemeinsamem Secret müssen Clients
selbst über den Tunnel weiterhin `token`/`password` senden. Bei Modi mit Identität
muss die Anfrage weiterhin diesen Auth-Pfad erfüllen.
</Warning>

Siehe: [Remote Gateway](/de/gateway/remote), [Authentication](/de/gateway/authentication), [Tailscale](/de/gateway/tailscale).

## Überwachung und Dienstlebenszyklus

Verwenden Sie überwachte Ausführungen für produktionsähnliche Zuverlässigkeit.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent-Labels sind `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` prüft und repariert Konfigurationsdrift von Diensten.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aktivieren Sie für Persistenz nach dem Logout Lingering:

```bash
sudo loginctl enable-linger <user>
```

Beispiel für eine manuelle User-Unit, wenn Sie einen benutzerdefinierten Installationspfad benötigen:

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

  <Tab title="Windows (nativ)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Der verwaltete native Windows-Start verwendet eine geplante Aufgabe namens `OpenClaw Gateway`
(oder `OpenClaw Gateway (<profile>)` für benannte Profile). Wenn die Erstellung der geplanten Aufgabe
verweigert wird, fällt OpenClaw auf einen Starter im benutzerspezifischen Startup-Ordner zurück,
der auf `gateway.cmd` im Statusverzeichnis zeigt.

  </Tab>

  <Tab title="Linux (Systemdienst)">

Verwenden Sie eine System-Unit für Multi-User-/Always-on-Hosts.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie denselben Dienstinhalt wie bei der User-Unit, installieren Sie ihn aber unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, wenn sich Ihre `openclaw`-Binärdatei an einem anderen Ort befindet.

  </Tab>
</Tabs>

## Schneller Pfad für das Dev-Profil

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Die Standardwerte umfassen isolierten Status/Konfiguration und den Basis-Gateway-Port `19001`.

## Kurzreferenz zum Protokoll (Operator-Sicht)

- Der erste Client-Frame muss `connect` sein.
- Das Gateway gibt einen `hello-ok`-Snapshot zurück (`presence`, `health`, `stateVersion`, `uptimeMs`, Limits/Richtlinien).
- `hello-ok.features.methods` / `events` sind eine konservative Discovery-Liste, kein
  generierter Dump jeder aufrufbaren Hilfsroute.
- Requests: `req(method, params)` → `res(ok/payload|error)`.
- Häufige Ereignisse sind unter anderem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, Lebenszyklusereignisse für Pairing/Genehmigungen und `shutdown`.

Agentenläufe sind zweistufig:

1. Sofortiges Akzeptierungs-Ack (`status:"accepted"`)
2. Endgültige Completion-Response (`status:"ok"|"error"`), dazwischen gestreamte `agent`-Ereignisse.

Siehe vollständige Protokolldokumentation: [Gateway Protocol](/de/gateway/protocol).

## Betriebsprüfungen

### Liveness

- Öffnen Sie WS und senden Sie `connect`.
- Erwarten Sie eine `hello-ok`-Response mit Snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap-Recovery

Ereignisse werden nicht erneut abgespielt. Bei Sequenzlücken aktualisieren Sie den Zustand (`health`, `system-presence`), bevor Sie fortfahren.

## Häufige Fehlersignaturen

| Signatur                                                      | Wahrscheinliches Problem                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind ohne Loopback ohne gültigen Gateway-Auth-Pfad                                 |
| `another gateway instance is already listening` / `EADDRINUSE`| Portkonflikt                                                                       |
| `Gateway start blocked: set gateway.mode=local`               | Konfiguration auf Remote-Modus gesetzt, oder Local-Mode-Markierung fehlt in beschädigter Konfiguration |
| `unauthorized` während `connect`                              | Auth-Konflikt zwischen Client und Gateway                                          |

Verwenden Sie für vollständige Diagnoseleitern [Gateway Troubleshooting](/de/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokoll-Clients schlagen schnell fehl, wenn Gateway nicht verfügbar ist (kein impliziter direkter Kanal-Fallback).
- Ungültige erste Frames oder erste Frames ohne `connect` werden abgelehnt und geschlossen.
- Beim kontrollierten Herunterfahren wird vor dem Schließen des Sockets ein `shutdown`-Ereignis gesendet.

---

Verwandt:

- [Troubleshooting](/de/gateway/troubleshooting)
- [Background Process](/de/gateway/background-process)
- [Configuration](/de/gateway/configuration)
- [Health](/de/gateway/health)
- [Doctor](/de/gateway/doctor)
- [Authentication](/de/gateway/authentication)

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Remote-Zugriff](/de/gateway/remote)
- [Secrets-Management](/de/gateway/secrets)
