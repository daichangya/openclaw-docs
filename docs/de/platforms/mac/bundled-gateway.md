---
read_when:
    - OpenClaw.app paketieren
    - Den macOS-Gateway-launchd-Dienst debuggen
    - Die Gateway-CLI für macOS installieren
summary: Gateway-Laufzeit auf macOS (externer launchd-Dienst)
title: Gateway auf macOS
x-i18n:
    generated_at: "2026-04-24T06:47:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app bündelt nicht mehr Node/Bun oder die Gateway-Laufzeit. Die macOS-App
erwartet eine **externe** Installation der `openclaw`-CLI, startet das Gateway nicht als
Child-Prozess und verwaltet einen launchd-Dienst pro Benutzer, damit das Gateway
weiterläuft (oder verbindet sich mit einem bereits laufenden lokalen Gateway, falls eines schon läuft).

## Die CLI installieren (erforderlich für den lokalen Modus)

Node 24 ist die Standardlaufzeit auf dem Mac. Node 22 LTS, derzeit `22.14+`, funktioniert aus Kompatibilitätsgründen weiterhin. Installieren Sie dann `openclaw` global:

```bash
npm install -g openclaw@<version>
```

Die Schaltfläche **Install CLI** der macOS-App führt denselben globalen Installationsablauf aus, den die App
intern verwendet: Sie bevorzugt zuerst npm, dann pnpm und dann bun, wenn dies der einzige
erkannte Paketmanager ist. Node bleibt die empfohlene Gateway-Laufzeit.

## launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (oder `ai.openclaw.<profile>`; Legacy-`com.openclaw.*` kann weiterhin vorhanden sein)

Plist-Speicherort (pro Benutzer):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (oder `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manager:

- Die macOS-App verwaltet die Installation/Aktualisierung des LaunchAgent im lokalen Modus.
- Die CLI kann ihn ebenfalls installieren: `openclaw gateway install`.

Verhalten:

- „OpenClaw Active“ aktiviert/deaktiviert den LaunchAgent.
- Das Beenden der App stoppt das Gateway **nicht** (launchd hält es am Leben).
- Wenn auf dem konfigurierten Port bereits ein Gateway läuft, verbindet sich die App
  damit, anstatt ein neues zu starten.

Logging:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Versionskompatibilität

Die macOS-App prüft die Gateway-Version gegen ihre eigene Version. Wenn sie
inkompatibel sind, aktualisieren Sie die globale CLI so, dass sie zur App-Version passt.

## Smoke-Check

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Dann:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Gateway-Runbook](/de/gateway)
