---
read_when:
    - Sie OpenClaw häufig mit Docker ausführen und kürzere Alltagsbefehle möchten
    - Sie eine Helfer-Schicht für Dashboard, Logs, Token-Einrichtung und Pairing-Abläufe möchten
summary: ClawDock-Shell-Helfer für Docker-basierte OpenClaw-Installationen
title: ClawDock
x-i18n:
    generated_at: "2026-04-05T12:45:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d67d1d979450d8c9c11854d2f40977c958f1c300e75a5c42ce4c31de86735a
    source_path: install/clawdock.md
    workflow: 15
---

# ClawDock

ClawDock ist eine kleine Shell-Helfer-Schicht für Docker-basierte OpenClaw-Installationen.

Sie bietet kurze Befehle wie `clawdock-start`, `clawdock-dashboard` und `clawdock-fix-token` anstelle längerer Aufrufe mit `docker compose ...`.

Wenn Sie Docker noch nicht eingerichtet haben, beginnen Sie mit [Docker](/install/docker).

## Installation

Verwenden Sie den kanonischen Helferpfad:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock zuvor über `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, installieren Sie es erneut über den neuen Pfad `scripts/clawdock/clawdock-helpers.sh`. Der alte Raw-GitHub-Pfad wurde entfernt.

## Was Sie erhalten

### Grundlegende Operationen

| Befehl            | Beschreibung                |
| ----------------- | --------------------------- |
| `clawdock-start`   | Das Gateway starten         |
| `clawdock-stop`    | Das Gateway stoppen         |
| `clawdock-restart` | Das Gateway neu starten     |
| `clawdock-status`  | Container-Status prüfen     |
| `clawdock-logs`    | Gateway-Logs verfolgen      |

### Container-Zugriff

| Befehl                   | Beschreibung                                      |
| ------------------------- | ------------------------------------------------ |
| `clawdock-shell`          | Eine Shell im Gateway-Container öffnen           |
| `clawdock-cli <command>`  | OpenClaw-CLI-Befehle in Docker ausführen         |
| `clawdock-exec <command>` | Einen beliebigen Befehl im Container ausführen   |

### Web-UI und Pairing

| Befehl                 | Beschreibung                     |
| ----------------------- | ------------------------------- |
| `clawdock-dashboard`    | Die URL der Control UI öffnen   |
| `clawdock-devices`      | Ausstehende Geräte-Pairings auflisten |
| `clawdock-approve <id>` | Eine Pairing-Anfrage genehmigen |

### Einrichtung und Wartung

| Befehl              | Beschreibung                                           |
| -------------------- | ----------------------------------------------------- |
| `clawdock-fix-token` | Das Gateway-Token im Container konfigurieren          |
| `clawdock-update`    | Pullen, neu bauen und neu starten                     |
| `clawdock-rebuild`   | Nur das Docker-Image neu bauen                        |
| `clawdock-clean`     | Container und Volumes entfernen                       |

### Hilfsprogramme

| Befehl                | Beschreibung                                |
| ---------------------- | ------------------------------------------ |
| `clawdock-health`      | Eine Gateway-Integritätsprüfung ausführen  |
| `clawdock-token`       | Das Gateway-Token ausgeben                 |
| `clawdock-cd`          | Zum OpenClaw-Projektverzeichnis wechseln   |
| `clawdock-config`      | `~/.openclaw` öffnen                       |
| `clawdock-show-config` | Konfigurationsdateien mit geschwärzten Werten ausgeben |
| `clawdock-workspace`   | Das Workspace-Verzeichnis öffnen           |

## Ablauf beim ersten Start

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Wenn der Browser sagt, dass Pairing erforderlich ist:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Konfiguration und Geheimnisse

ClawDock funktioniert mit derselben Docker-Konfigurationsaufteilung, die unter [Docker](/install/docker) beschrieben ist:

- `<project>/.env` für Docker-spezifische Werte wie Image-Name, Ports und das Gateway-Token
- `~/.openclaw/.env` für env-gestützte Provider-Schlüssel und Bot-Tokens
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` für gespeicherte Provider-OAuth-/API-Key-Authentifizierung
- `~/.openclaw/openclaw.json` für Verhaltenskonfiguration

Verwenden Sie `clawdock-show-config`, wenn Sie die `.env`-Dateien und `openclaw.json` schnell prüfen möchten. Dabei werden `.env`-Werte in der Ausgabe geschwärzt.

## Verwandte Seiten

- [Docker](/install/docker)
- [Docker VM Runtime](/install/docker-vm-runtime)
- [Aktualisieren](/install/updating)
