---
read_when:
    - Sie führen OpenClaw häufig mit Docker aus und möchten kürzere Befehle für den Alltag
    - Sie möchten eine Hilfsebene für Dashboard, Logs, Token-Setup und Pairing-Abläufe
summary: ClawDock-Shell-Helfer für Docker-basierte OpenClaw-Installationen
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T06:43:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock ist eine kleine Shell-Hilfsebene für Docker-basierte OpenClaw-Installationen.

Sie bietet Ihnen kurze Befehle wie `clawdock-start`, `clawdock-dashboard` und `clawdock-fix-token` anstelle längerer `docker compose ...`-Aufrufe.

Wenn Sie Docker noch nicht eingerichtet haben, beginnen Sie mit [Docker](/de/install/docker).

## Installation

Verwenden Sie den kanonischen Helper-Pfad:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock zuvor von `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, installieren Sie es erneut vom neuen Pfad `scripts/clawdock/clawdock-helpers.sh`. Der alte Raw-GitHub-Pfad wurde entfernt.

## Was Sie erhalten

### Grundlegende Operationen

| Befehl             | Beschreibung              |
| ------------------ | ------------------------- |
| `clawdock-start`   | Das Gateway starten       |
| `clawdock-stop`    | Das Gateway stoppen       |
| `clawdock-restart` | Das Gateway neu starten   |
| `clawdock-status`  | Container-Status prüfen   |
| `clawdock-logs`    | Gateway-Logs verfolgen    |

### Container-Zugriff

| Befehl                    | Beschreibung                                   |
| ------------------------- | ---------------------------------------------- |
| `clawdock-shell`          | Eine Shell im Gateway-Container öffnen         |
| `clawdock-cli <command>`  | OpenClaw-CLI-Befehle in Docker ausführen       |
| `clawdock-exec <command>` | Einen beliebigen Befehl im Container ausführen |

### Web-UI und Pairing

| Befehl                  | Beschreibung                    |
| ----------------------- | ------------------------------- |
| `clawdock-dashboard`    | Die URL der Control UI öffnen   |
| `clawdock-devices`      | Ausstehende Geräte-Pairings auflisten |
| `clawdock-approve <id>` | Eine Pairing-Anfrage genehmigen |

### Einrichtung und Wartung

| Befehl               | Beschreibung                                           |
| -------------------- | ------------------------------------------------------ |
| `clawdock-fix-token` | Das Gateway-Token im Container konfigurieren           |
| `clawdock-update`    | Pullen, neu bauen und neu starten                      |
| `clawdock-rebuild`   | Nur das Docker-Image neu bauen                         |
| `clawdock-clean`     | Container und Volumes entfernen                        |

### Hilfsprogramme

| Befehl                 | Beschreibung                             |
| ---------------------- | ---------------------------------------- |
| `clawdock-health`      | Einen Gateway-Health-Check ausführen     |
| `clawdock-token`       | Das Gateway-Token ausgeben               |
| `clawdock-cd`          | In das OpenClaw-Projektverzeichnis wechseln |
| `clawdock-config`      | `~/.openclaw` öffnen                     |
| `clawdock-show-config` | Konfigurationsdateien mit redigierten Werten ausgeben |
| `clawdock-workspace`   | Das Workspace-Verzeichnis öffnen         |

## Ablauf beim ersten Mal

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Wenn der Browser meldet, dass Pairing erforderlich ist:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Konfiguration und Secrets

ClawDock arbeitet mit derselben Docker-Aufteilung der Konfiguration, die unter [Docker](/de/install/docker) beschrieben ist:

- `<project>/.env` für Docker-spezifische Werte wie Image-Name, Ports und das Gateway-Token
- `~/.openclaw/.env` für env-gestützte Provider-Schlüssel und Bot-Tokens
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` für gespeicherte Provider-OAuth-/API-Key-Authentifizierung
- `~/.openclaw/openclaw.json` für Verhaltenskonfiguration

Verwenden Sie `clawdock-show-config`, wenn Sie die `.env`-Dateien und `openclaw.json` schnell untersuchen möchten. Es redigiert `.env`-Werte in der gedruckten Ausgabe.

## Verwandte Seiten

- [Docker](/de/install/docker)
- [Docker-VM-Laufzeit](/de/install/docker-vm-runtime)
- [Aktualisieren](/de/install/updating)
