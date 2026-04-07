---
read_when:
    - Ausführen oder Debuggen des Gateway-Prozesses
summary: Runbook für den Gateway-Dienst, seinen Lebenszyklus und seinen Betrieb
title: Gateway-Runbook
x-i18n:
    generated_at: "2026-04-07T06:14:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd2c21036e88612861ef2195b8ff7205aca31386bb11558614ade8d1a54fdebd
    source_path: gateway/index.md
    workflow: 15
---

# Gateway-Runbook

Verwenden Sie diese Seite für den Start am ersten Tag und den Betrieb des Gateway-Dienstes im laufenden Einsatz.

<CardGroup cols={2}>
  <Card title="Tiefgehende Fehlerbehebung" icon="siren" href="/de/gateway/troubleshooting">
    Symptomorientierte Diagnose mit exakten Befehlsabfolgen und Log-Signaturen.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Aufgabenorientierte Einrichtungsanleitung + vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Secrets-Management" icon="key-round" href="/de/gateway/secrets">
    SecretRef-Vertrag, Laufzeit-Snapshot-Verhalten und Vorgänge zum Migrieren/Neuladen.
  </Card>
  <Card title="Secrets-Plan-Vertrag" icon="shield-check" href="/de/gateway/secrets-plan-contract">
    Exakte Regeln für Ziele/Pfade von `secrets apply` und rein referenzbasiertes Auth-Profil-Verhalten.
  </Card>
</CardGroup>

## Lokaler Start in 5 Minuten

<Steps>
  <Step title="Gateway starten">

```bash
openclaw gateway --port 18789
# Debug/Trace nach stdio gespiegelt
openclaw gateway --port 18789 --verbose
# Listener auf dem ausgewählten Port zwangsweise beenden, dann starten
openclaw gateway --force
```

  </Step>

  <Step title="Dienstzustand überprüfen">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Gesunde Basislinie: `Runtime: running` und `RPC probe: ok`.

  </Step>

  <Step title="Bereitschaft der Channels prüfen">

```bash
openclaw channels status --probe
```

Bei einem erreichbaren Gateway führt dies Live-Probes pro Konto für Channels und optionale Prüfungen aus.
Wenn das Gateway nicht erreichbar ist, fällt die CLI stattdessen auf reine konfigurationsbasierte Channel-Zusammenfassungen zurück
anstatt auf Live-Probe-Ausgaben.

  </Step>
</Steps>

<Note>
Das Neuladen der Gateway-Konfiguration überwacht den Pfad der aktiven Konfigurationsdatei (aufgelöst aus Profil-/Status-Standards oder `OPENCLAW_CONFIG_PATH`, wenn gesetzt).
Der Standardmodus ist `gateway.reload.mode="hybrid"`.
Nach dem ersten erfolgreichen Laden bedient der laufende Prozess den aktiven In-Memory-Konfigurations-Snapshot; ein erfolgreiches Neuladen tauscht diesen Snapshot atomar aus.
</Note>

## Laufzeitmodell

- Ein dauerhaft laufender Prozess für Routing, Steuerungsebene und Channel-Verbindungen.
- Ein einzelner multiplexter Port für:
  - WebSocket-Steuerung/RPC
  - HTTP-APIs, OpenAI-kompatibel (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI und Hooks
- Standard-Bind-Modus: `loopback`.
- Auth ist standardmäßig erforderlich. Setups mit gemeinsamem Secret verwenden
  `gateway.auth.token` / `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), und Nicht-Loopback-
  Reverse-Proxy-Setups können `gateway.auth.mode: "trusted-proxy"` verwenden.

## OpenAI-kompatible Endpunkte

Die OpenAI-kompatible Oberfläche mit dem höchsten Nutzen in OpenClaw ist jetzt:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Warum diese Auswahl wichtig ist:

- Die meisten Integrationen mit Open WebUI, LobeChat und LibreChat prüfen zuerst `/v1/models`.
- Viele RAG- und Memory-Pipelines erwarten `/v1/embeddings`.
- Agent-native Clients bevorzugen zunehmend `/v1/responses`.

Hinweis zur Planung:

- `/v1/models` ist agentenorientiert: Es gibt `openclaw`, `openclaw/default` und `openclaw/<agentId>` zurück.
- `openclaw/default` ist der stabile Alias, der immer auf den konfigurierten Standard-Agenten verweist.
- Verwenden Sie `x-openclaw-model`, wenn Sie eine Überschreibung für Backend-Provider/-Modell möchten; andernfalls bleiben das normale Modell und die Embedding-Konfiguration des ausgewählten Agenten maßgeblich.

Alle diese Endpunkte laufen auf dem Hauptport des Gateway und verwenden dieselbe vertrauenswürdige Operator-Auth-Grenze wie der Rest der Gateway-HTTP-API.

### Port- und Bind-Priorität

| Einstellung  | Auflösungsreihenfolge                                          |
| ------------ | -------------------------------------------------------------- |
| Gateway-Port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind-Modus   | CLI/Überschreibung → `gateway.bind` → `loopback`               |

### Hot-Reload-Modi

| `gateway.reload.mode` | Verhalten                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Kein Neuladen der Konfiguration            |
| `hot`                 | Nur Hot-safe-Änderungen anwenden           |
| `restart`             | Bei reload-pflichtigen Änderungen neu starten |
| `hybrid` (Standard)   | Wenn sicher hot anwenden, sonst neu starten |

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

`gateway status --deep` ist für zusätzliche Diensterkennung (LaunchDaemons/systemd-System-
Units/schtasks) gedacht, nicht für eine tiefere RPC-Zustandsprüfung.

## Mehrere Gateways (gleicher Host)

Die meisten Installationen sollten ein Gateway pro Maschine ausführen. Ein einzelnes Gateway kann mehrere
Agenten und Channels hosten.

Sie benötigen mehrere Gateways nur dann, wenn Sie bewusst Isolation oder einen Rescue-Bot möchten.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Was zu erwarten ist:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)`
  melden und Hinweise zur Bereinigung ausgeben, wenn noch veraltete launchd-/systemd-/schtasks-Installationen vorhanden sind.
- `gateway probe` kann vor `multiple reachable gateways` warnen, wenn mehr als ein Ziel
  antwortet.
- Falls dies beabsichtigt ist, isolieren Sie Ports, Konfiguration/Status und Workspace-Wurzeln pro Gateway.

Detaillierte Einrichtung: [/gateway/multiple-gateways](/de/gateway/multiple-gateways).

## Remote-Zugriff

Bevorzugt: Tailscale/VPN.
Fallback: SSH-Tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Verbinden Sie Clients dann lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen die Gateway-Auth nicht. Bei Auth mit gemeinsamem Secret müssen Clients
auch über den Tunnel weiterhin `token`/`password` senden. Bei Modi mit Identität
muss die Anfrage weiterhin diesen Auth-Pfad erfüllen.
</Warning>

Siehe: [Remote Gateway](/de/gateway/remote), [Authentifizierung](/de/gateway/authentication), [Tailscale](/de/gateway/tailscale).

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

LaunchAgent-Labels sind `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` prüft und repariert Konfigurationsabweichungen des Dienstes.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aktivieren Sie für Persistenz nach dem Abmelden lingering:

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
(oder `OpenClaw Gateway (<profile>)` für benannte Profile). Wenn das Erstellen der geplanten Aufgabe
verweigert wird, greift OpenClaw auf einen Launcher im Startup-Ordner pro Benutzer zurück,
der auf `gateway.cmd` im Statusverzeichnis verweist.

  </Tab>

  <Tab title="Linux (Systemdienst)">

Verwenden Sie für Mehrbenutzer-/Always-on-Hosts eine System-Unit.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie denselben Dienstinhalt wie bei der User-Unit, installieren Sie ihn jedoch unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, wenn sich Ihr `openclaw`-Binary an einem anderen Ort befindet.

  </Tab>
</Tabs>

## Mehrere Gateways auf einem Host

Die meisten Setups sollten **ein** Gateway ausführen.
Verwenden Sie mehrere nur für strikte Isolation/Redundanz (zum Beispiel ein Rescue-Profil).

Checkliste pro Instanz:

- Eindeutiges `gateway.port`
- Eindeutiger `OPENCLAW_CONFIG_PATH`
- Eindeutiges `OPENCLAW_STATE_DIR`
- Eindeutiges `agents.defaults.workspace`

Beispiel:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Siehe: [Mehrere Gateways](/de/gateway/multiple-gateways).

### Schnellpfad für Dev-Profil

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Die Standards umfassen isolierten Status/Konfiguration und den Basis-Gateway-Port `19001`.

## Schnelle Protokollreferenz (Operator-Sicht)

- Der erste Client-Frame muss `connect` sein.
- Das Gateway gibt den Snapshot `hello-ok` zurück (`presence`, `health`, `stateVersion`, `uptimeMs`, Limits/Richtlinie).
- `hello-ok.features.methods` / `events` sind eine konservative Discovery-Liste, kein
  generierter Dump jeder aufrufbaren Helper-Route.
- Anfragen: `req(method, params)` → `res(ok/payload|error)`.
- Häufige Events sind unter anderem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, Pairing-/Genehmigungs-Lebenszyklus-Events und `shutdown`.

Agent-Läufe sind zweistufig:

1. Sofortige Bestätigungsannahme (`status:"accepted"`)
2. Finale Abschlussantwort (`status:"ok"|"error"`), mit gestreamten `agent`-Events dazwischen.

Vollständige Protokolldokumentation: [Gateway-Protokoll](/de/gateway/protocol).

## Betriebsprüfungen

### Liveness

- WebSocket öffnen und `connect` senden.
- `hello-ok`-Antwort mit Snapshot erwarten.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap-Recovery

Events werden nicht erneut abgespielt. Bei Sequenzlücken den Status aktualisieren (`health`, `system-presence`), bevor Sie fortfahren.

## Häufige Fehlersignaturen

| Signatur                                                       | Wahrscheinliches Problem                                                           |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Nicht-Loopback-Bind ohne gültigen Gateway-Auth-Pfad                                |
| `another gateway instance is already listening` / `EADDRINUSE` | Portkonflikt                                                                       |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguration auf Remote-Modus gesetzt oder Local-Mode-Stempel fehlt in beschädigter Konfiguration |
| `unauthorized` during connect                                  | Auth-Abweichung zwischen Client und Gateway                                        |

Für vollständige Diagnoseabläufe verwenden Sie [Gateway-Fehlerbehebung](/de/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokoll-Clients schlagen schnell fehl, wenn Gateway nicht verfügbar ist (kein impliziter direkter Channel-Fallback).
- Ungültige/keine-`connect`-ersten Frames werden abgelehnt und geschlossen.
- Beim kontrollierten Herunterfahren wird vor dem Schließen des Sockets ein `shutdown`-Event gesendet.

---

Verwandt:

- [Fehlerbehebung](/de/gateway/troubleshooting)
- [Hintergrundprozess](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Health](/de/gateway/health)
- [Doctor](/de/gateway/doctor)
- [Authentifizierung](/de/gateway/authentication)
