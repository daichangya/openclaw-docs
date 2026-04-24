---
read_when:
    - Sie suchen den Status der Linux-Begleit-App
    - Planung von Plattformabdeckung oder Beiträgen
    - Fehlerbehebung bei Linux-OOM-Kills oder Exit 137 auf einem VPS oder in einem Container
summary: Linux-Unterstützung + Status der Begleit-App
title: Linux-App
x-i18n:
    generated_at: "2026-04-24T06:47:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Das Gateway wird unter Linux vollständig unterstützt. **Node ist die empfohlene Laufzeitumgebung**.
Bun wird für das Gateway nicht empfohlen (WhatsApp-/Telegram-Bugs).

Native Linux-Begleit-Apps sind geplant. Beiträge sind willkommen, wenn Sie beim Bau einer solchen App helfen möchten.

## Schneller Einsteigerpfad (VPS)

1. Node 24 installieren (empfohlen; Node 22 LTS, derzeit `22.14+`, funktioniert aus Kompatibilitätsgründen weiterhin)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Von Ihrem Laptop aus: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` öffnen und sich mit dem konfigurierten Shared Secret authentifizieren (standardmäßig Token; Passwort, wenn Sie `gateway.auth.mode: "password"` gesetzt haben)

Vollständige Linux-Server-Anleitung: [Linux Server](/de/vps). Schritt-für-Schritt-VPS-Beispiel: [exe.dev](/de/install/exe-dev)

## Installation

- [Erste Schritte](/de/start/getting-started)
- [Installation & Updates](/de/install/updating)
- Optionale Wege: [Bun (experimentell)](/de/install/bun), [Nix](/de/install/nix), [Docker](/de/install/docker)

## Gateway

- [Gateway-Runbook](/de/gateway)
- [Konfiguration](/de/gateway/configuration)

## Installation des Gateway-Dienstes (CLI)

Verwenden Sie eines davon:

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

Wählen Sie **Gateway service**, wenn Sie dazu aufgefordert werden.

Reparieren/migrieren:

```
openclaw doctor
```

## Systemsteuerung (systemd user unit)

OpenClaw installiert standardmäßig einen systemd-**Benutzerdienst**. Verwenden Sie einen **System**dienst für gemeinsam genutzte oder Always-on-Server. `openclaw gateway install` und `openclaw onboard --install-daemon` rendern bereits die aktuelle kanonische Unit für Sie; schreiben Sie nur dann selbst eine von Hand, wenn Sie ein benutzerdefiniertes System-/Service-Manager-Setup benötigen. Die vollständigen Hinweise zum Dienst finden Sie im [Gateway-Runbook](/de/gateway).

Minimales Setup:

Erstellen Sie `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
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

Aktivieren:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Speicherdruck und OOM-Kills

Unter Linux wählt der Kernel ein OOM-Opfer aus, wenn einem Host, einer VM oder einer Container-cgroup
der Speicher ausgeht. Das Gateway kann ein schlechtes Opfer sein, weil es langlebige
Sitzungen und Kanalverbindungen besitzt. OpenClaw sorgt daher nach Möglichkeit dafür,
dass vorübergehende Kindprozesse vor dem Gateway beendet werden.

Für geeignete Linux-Child-Spawns startet OpenClaw das Child über einen kurzen
`/bin/sh`-Wrapper, der den eigenen `oom_score_adj` des Child auf `1000` erhöht und dann
den eigentlichen Befehl per `exec` ausführt. Das ist eine nicht privilegierte Operation, weil das Child
nur seine eigene Wahrscheinlichkeit erhöht, durch OOM beendet zu werden.

Zu den abgedeckten Oberflächen für Kindprozesse gehören:

- vom Supervisor verwaltete Command-Children,
- PTY-Shell-Children,
- MCP-stdio-Server-Children,
- von OpenClaw gestartete Browser-/Chrome-Prozesse.

Der Wrapper ist nur für Linux und wird übersprungen, wenn `/bin/sh` nicht verfügbar ist. Er wird
außerdem übersprungen, wenn die Child-Umgebung `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` oder `off` setzt.

So prüfen Sie einen Kindprozess:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Der erwartete Wert für abgedeckte Children ist `1000`. Der Gateway-Prozess sollte
seinen normalen Score behalten, gewöhnlich `0`.

Dies ersetzt keine normale Speicherabstimmung. Wenn ein VPS oder Container wiederholt
Children beendet, erhöhen Sie das Speicherlimit, reduzieren Sie Parallelität oder fügen Sie stärkere
Ressourcenkontrollen hinzu, etwa `MemoryMax=` in systemd oder Speicherlimits auf Containerebene.

## Verwandt

- [Installationsübersicht](/de/install)
- [Linux Server](/de/vps)
- [Raspberry Pi](/de/install/raspberry-pi)
