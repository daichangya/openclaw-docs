---
read_when:
    - Sie suchen nach dem Status der Linux-Companion-App
    - Sie planen Plattformabdeckung oder Beiträge
summary: Linux-Unterstützung + Status der Companion-App
title: Linux-App
x-i18n:
    generated_at: "2026-04-05T12:49:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5dbfc89eb65e04347479fc6c9a025edec902fb0c544fb8d5bd09c24558ea03b1
    source_path: platforms/linux.md
    workflow: 15
---

# Linux-App

Das Gateway wird unter Linux vollständig unterstützt. **Node ist die empfohlene Runtime**.
Bun wird für das Gateway nicht empfohlen (WhatsApp-/Telegram-Bugs).

Native Linux-Companion-Apps sind geplant. Beiträge sind willkommen, wenn Sie beim Aufbau einer solchen App helfen möchten.

## Schneller Weg für Einsteiger (VPS)

1. Installieren Sie Node 24 (empfohlen; Node 22 LTS, derzeit `22.14+`, funktioniert aus Kompatibilitätsgründen weiterhin)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Von Ihrem Laptop aus: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Öffnen Sie `http://127.0.0.1:18789/` und authentifizieren Sie sich mit dem konfigurierten Shared Secret (standardmäßig Token; Passwort, wenn Sie `gateway.auth.mode: "password"` gesetzt haben)

Vollständige Anleitung für Linux-Server: [Linux Server](/vps). Schritt-für-Schritt-VPS-Beispiel: [exe.dev](/install/exe-dev)

## Installation

- [Getting Started](/de/start/getting-started)
- [Install & updates](/install/updating)
- Optionale Abläufe: [Bun (experimentell)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Gateway runbook](/gateway)
- [Configuration](/gateway/configuration)

## Gateway-Dienstinstallation (CLI)

Verwenden Sie eine dieser Möglichkeiten:

```
openclaw onboard --install-daemon
```

Oder:

```
openclaw gateway install
```

Oder:

```
openclaw configure
```

Wählen Sie bei Aufforderung **Gateway service**.

Reparieren/migrieren:

```
openclaw doctor
```

## Systemsteuerung (systemd-User-Unit)

OpenClaw installiert standardmäßig einen systemd-**User**-Dienst. Verwenden Sie einen **System**-Dienst für gemeinsam genutzte oder dauerhaft laufende Server. `openclaw gateway install` und
`openclaw onboard --install-daemon` rendern bereits die aktuelle kanonische Unit
für Sie; schreiben Sie nur dann selbst eine, wenn Sie eine benutzerdefinierte System-/Service-Manager-
Einrichtung benötigen. Die vollständige Dienstanleitung finden Sie im [Gateway runbook](/gateway).

Minimale Einrichtung:

Erstellen Sie `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (Profil: <profile>, v<version>)
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

Aktivieren Sie ihn:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
