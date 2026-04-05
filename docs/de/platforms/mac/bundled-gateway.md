---
read_when:
    - Packaging von OpenClaw.app
    - Debuggen des macOS-launchd-Dienstes für das Gateway
    - Installieren der Gateway-CLI für macOS
summary: Gateway-Laufzeit auf macOS (externer launchd-Dienst)
title: Gateway auf macOS
x-i18n:
    generated_at: "2026-04-05T12:49:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# Gateway auf macOS (externes launchd)

OpenClaw.app bündelt Node/Bun oder die Gateway-Laufzeit nicht mehr. Die macOS-App
erwartet eine **externe** Installation der `openclaw`-CLI, startet das Gateway nicht als
Kindprozess und verwaltet einen launchd-Dienst pro Benutzer, um das Gateway
am Laufen zu halten (oder verbindet sich mit einem bestehenden lokalen Gateway, falls bereits eines läuft).

## Die CLI installieren (für den lokalen Modus erforderlich)

Node 24 ist die Standard-Laufzeit auf dem Mac. Node 22 LTS, derzeit `22.14+`, funktioniert aus Kompatibilitätsgründen weiterhin. Installieren Sie dann `openclaw` global:

```bash
npm install -g openclaw@<version>
```

Die Schaltfläche **Install CLI** der macOS-App führt denselben globalen Installationsablauf aus, den die App
intern verwendet: Sie bevorzugt zuerst npm, dann pnpm und dann bun, wenn das der einzig
erkannte Paketmanager ist. Node bleibt die empfohlene Gateway-Laufzeit.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (oder `ai.openclaw.<profile>`; das veraltete `com.openclaw.*` kann weiterhin vorhanden sein)

Speicherort der Plist (pro Benutzer):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (oder `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Verwaltung:

- Die macOS-App besitzt die Installation/Aktualisierung des LaunchAgent im lokalen Modus.
- Die CLI kann ihn ebenfalls installieren: `openclaw gateway install`.

Verhalten:

- „OpenClaw Active“ aktiviert/deaktiviert den LaunchAgent.
- Das Beenden der App stoppt das Gateway **nicht** (launchd hält es aktiv).
- Wenn auf dem konfigurierten Port bereits ein Gateway läuft, verbindet sich die App
  damit, statt ein neues zu starten.

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
