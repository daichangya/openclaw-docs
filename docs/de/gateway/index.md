---
read_when:
    - Den Gateway-Prozess ausführen oder debuggen
summary: Runbook für den Gateway-Dienst, Lifecycle und Betrieb
title: Gateway-Runbook
x-i18n:
    generated_at: "2026-04-05T12:42:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec17674370de4e171779389c83580317308a4f07ebf335ad236a47238af18e1
    source_path: gateway/index.md
    workflow: 15
---

# Gateway-Runbook

Verwenden Sie diese Seite für den Start am ersten Tag und den Betrieb am zweiten Tag des Gateway-Dienstes.

<CardGroup cols={2}>
  <Card title="Tiefgehende Fehlerbehebung" icon="siren" href="/gateway/troubleshooting">
    Symptomorientierte Diagnose mit exakten Befehlsabfolgen und Log-Signaturen.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/gateway/configuration">
    Aufgabenorientierte Einrichtungsanleitung + vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Secrets Management" icon="key-round" href="/gateway/secrets">
    SecretRef-Vertrag, Verhalten von Laufzeit-Snapshots und Migrate-/Reload-Operationen.
  </Card>
  <Card title="Secrets-Plan-Vertrag" icon="shield-check" href="/gateway/secrets-plan-contract">
    Exakte Regeln für `secrets apply`-Ziele/-Pfade und ref-only-Auth-Profile.
  </Card>
</CardGroup>

## Lokaler Start in 5 Minuten

<Steps>
  <Step title="Gateway starten">

```bash
openclaw gateway --port 18789
# Debug/Trace auf stdio gespiegelt
openclaw gateway --port 18789 --verbose
# Listener auf dem ausgewählten Port zwangsweise beenden, dann starten
openclaw gateway --force
```

  </Step>

  <Step title="Dienststatus prüfen">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Gesunde Basis: `Runtime: running` und `RPC probe: ok`.

  </Step>

  <Step title="Channel-Bereitschaft validieren">

```bash
openclaw channels status --probe
```

Mit einem erreichbaren Gateway führt dies Live-Probes pro Konto und optionale Audits aus.
Wenn das Gateway nicht erreichbar ist, greift die CLI statt auf Live-Probe-Ausgabe
auf reine, konfigurationsbasierte Channel-Zusammenfassungen zurück.

  </Step>
</Steps>

<Note>
Das Neuladen der Gateway-Konfiguration überwacht den aktiven Konfigurationsdateipfad (aufgelöst aus Profil-/State-Standardwerten oder `OPENCLAW_CONFIG_PATH`, falls gesetzt).
Der Standardmodus ist `gateway.reload.mode="hybrid"`.
Nach dem ersten erfolgreichen Laden stellt der laufende Prozess den aktiven In-Memory-Konfigurations-Snapshot bereit; ein erfolgreiches Neuladen ersetzt diesen Snapshot atomar.
</Note>

## Laufzeitmodell

- Ein immer laufender Prozess für Routing, Control Plane und Channel-Verbindungen.
- Ein einzelner multiplexter Port für:
  - WebSocket-Control/RPC
  - HTTP-APIs, OpenAI-kompatibel (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI und Hooks
- Standard-Bind-Modus: `loopback`.
- Authentifizierung ist standardmäßig erforderlich. Setups mit gemeinsamem Secret verwenden
  `gateway.auth.token` / `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), und Reverse-Proxy-Setups
  ohne loopback können `gateway.auth.mode: "trusted-proxy"` verwenden.

## OpenAI-kompatible Endpunkte

Die OpenAI-kompatible Oberfläche mit dem höchsten Hebel in OpenClaw ist jetzt:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Warum diese Menge wichtig ist:

- Die meisten Integrationen mit Open WebUI, LobeChat und LibreChat prüfen zuerst `/v1/models`.
- Viele RAG- und Memory-Pipelines erwarten `/v1/embeddings`.
- Agent-native Clients bevorzugen zunehmend `/v1/responses`.

Planungshinweis:

- `/v1/models` ist agent-first: Es gibt `openclaw`, `openclaw/default` und `openclaw/<agentId>` zurück.
- `openclaw/default` ist der stabile Alias, der immer dem konfigurierten Standard-Agent zugeordnet ist.
- Verwenden Sie `x-openclaw-model`, wenn Sie eine Überschreibung von Backend-Provider/Modell möchten; andernfalls bleibt das normale Modell- und Embedding-Setup des ausgewählten Agents maßgeblich.

All diese Endpunkte laufen auf dem Haupt-Gateway-Port und verwenden dieselbe vertrauenswürdige Operator-Authentifizierungsgrenze wie der Rest der Gateway-HTTP-API.

### Port- und Bind-Priorität

| Einstellung   | Auflösungsreihenfolge                                         |
| ------------- | ------------------------------------------------------------- |
| Gateway-Port  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind-Modus    | CLI/Überschreibung → `gateway.bind` → `loopback`              |

### Hot-Reload-Modi

| `gateway.reload.mode` | Verhalten                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Kein Neuladen der Konfiguration            |
| `hot`                 | Nur Hot-safe-Änderungen anwenden           |
| `restart`             | Bei reload-pflichtigen Änderungen neustarten |
| `hybrid` (Standard)   | Wenn sicher hot anwenden, sonst neustarten |

## Operator-Befehlssatz

```bash
openclaw gateway status
openclaw gateway status --deep   # fügt einen Dienstscan auf Systemebene hinzu
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` dient der zusätzlichen Diensterkennung (LaunchDaemons/systemd-System-
Units/schtasks), nicht einer tieferen RPC-Health-Probe.

## Mehrere Gateways (gleicher Host)

Die meisten Installationen sollten ein Gateway pro Maschine ausführen. Ein einzelnes Gateway kann mehrere
Agents und Channels hosten.

Sie benötigen mehrere Gateways nur, wenn Sie bewusst Isolierung oder einen Rescue-Bot möchten.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Was zu erwarten ist:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)`
  melden und Bereinigungshinweise ausgeben, wenn noch veraltete Launchd-/systemd-/schtasks-Installationen vorhanden sind.
- `gateway probe` kann vor `multiple reachable gateways` warnen, wenn mehr als ein Ziel
  antwortet.
- Wenn das beabsichtigt ist, trennen Sie Ports, Konfiguration/State und Workspace-Wurzeln pro Gateway.

Detaillierte Einrichtung: [/gateway/multiple-gateways](/gateway/multiple-gateways).

## Remote-Zugriff

Bevorzugt: Tailscale/VPN.
Fallback: SSH-Tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Verbinden Sie Clients dann lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen die Gateway-Authentifizierung nicht. Bei Authentifizierung mit gemeinsamem Secret müssen Clients
auch über den Tunnel weiterhin `token`/`password` senden. Bei identitätstragenden Modi
muss die Anfrage weiterhin diesen Auth-Pfad erfüllen.
</Warning>

Siehe: [Remote Gateway](/gateway/remote), [Authentication](/gateway/authentication), [Tailscale](/gateway/tailscale).

## Überwachung und Service-Lifecycle

Verwenden Sie überwachte Läufe für produktionsähnliche Zuverlässigkeit.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent-Labels sind `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` prüft und repariert Abweichungen in der Service-Konfiguration.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Für Persistenz nach dem Logout aktivieren Sie lingering:

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

Der native verwaltete Start unter Windows verwendet eine Scheduled Task namens `OpenClaw Gateway`
(oder `OpenClaw Gateway (<profile>)` für benannte Profile). Wenn das Erstellen der Scheduled Task
verweigert wird, greift OpenClaw auf einen Starter im Startup-Ordner pro Benutzer zurück,
der auf `gateway.cmd` im State-Verzeichnis zeigt.

  </Tab>

  <Tab title="Linux (Systemdienst)">

Verwenden Sie für Multi-User-/Always-on-Hosts eine System-Unit.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie denselben Service-Body wie bei der User-Unit, installieren Sie ihn aber unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, wenn sich Ihr `openclaw`-Binary an einem anderen Ort befindet.

  </Tab>
</Tabs>

## Mehrere Gateways auf einem Host

Die meisten Setups sollten **ein** Gateway ausführen.
Verwenden Sie mehrere nur für strikte Isolierung/Redundanz (zum Beispiel ein Rescue-Profil).

Checkliste pro Instanz:

- Eindeutiges `gateway.port`
- Eindeutiges `OPENCLAW_CONFIG_PATH`
- Eindeutiges `OPENCLAW_STATE_DIR`
- Eindeutiges `agents.defaults.workspace`

Beispiel:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Siehe: [Multiple gateways](/gateway/multiple-gateways).

### Schnellpfad für Dev-Profil

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Standardwerte umfassen isolierten State/isolierte Konfiguration und den Basis-Gateway-Port `19001`.

## Kurzübersicht zum Protokoll (Operator-Sicht)

- Das erste Client-Frame muss `connect` sein.
- Das Gateway gibt einen `hello-ok`-Snapshot zurück (`presence`, `health`, `stateVersion`, `uptimeMs`, Limits/Policy).
- `hello-ok.features.methods` / `events` sind eine konservative Discovery-Liste, kein
  generierter Dump jedes aufrufbaren Helper-Routs.
- Anfragen: `req(method, params)` → `res(ok/payload|error)`.
- Häufige Ereignisse sind `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, Pairing-/Approval-Lifecycle-Ereignisse und `shutdown`.

Agent-Läufe sind zweistufig:

1. Sofortige Accepted-Bestätigung (`status:"accepted"`)
2. Finale Abschlussantwort (`status:"ok"|"error"`), mit gestreamten `agent`-Ereignissen dazwischen.

Siehe vollständige Protokolldokumentation: [Gateway Protocol](/gateway/protocol).

## Betriebliche Prüfungen

### Liveness

- WS öffnen und `connect` senden.
- Als Antwort einen `hello-ok`-Snapshot erwarten.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap Recovery

Ereignisse werden nicht erneut abgespielt. Bei Sequenzlücken den Status (`health`, `system-presence`) aktualisieren, bevor Sie fortfahren.

## Häufige Fehlersignaturen

| Signatur                                                      | Wahrscheinliches Problem                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Nicht-loopback-Bind ohne gültigen Gateway-Auth-Pfad                               |
| `another gateway instance is already listening` / `EADDRINUSE` | Portkonflikt                                                                      |
| `Gateway start blocked: set gateway.mode=local`               | Konfiguration auf Remote-Modus gesetzt, oder Local-Mode-Stempel fehlt in beschädigter Konfiguration |
| `unauthorized` during connect                                 | Auth-Mismatch zwischen Client und Gateway                                         |

Für vollständige Diagnoseleitern verwenden Sie [Gateway Troubleshooting](/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokoll-Clients schlagen schnell fehl, wenn das Gateway nicht verfügbar ist (kein impliziter direkter Channel-Fallback).
- Ungültige/nicht-`connect`-erste Frames werden abgewiesen und geschlossen.
- Graceful Shutdown sendet ein `shutdown`-Ereignis vor dem Schließen des Sockets.

---

Verwandt:

- [Troubleshooting](/gateway/troubleshooting)
- [Background Process](/gateway/background-process)
- [Configuration](/gateway/configuration)
- [Health](/gateway/health)
- [Doctor](/gateway/doctor)
- [Authentication](/gateway/authentication)
