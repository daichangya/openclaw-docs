---
read_when:
    - Sie möchten OpenClaw 24/7 auf einem Cloud-VPS ausführen (nicht auf Ihrem Laptop)
    - Sie möchten ein produktionsreifes, ständig aktives Gateway auf Ihrem eigenen VPS
    - Sie möchten vollständige Kontrolle über Persistenz, Binärdateien und Neustartverhalten
    - Sie führen OpenClaw in Docker auf Hetzner oder einem ähnlichen Anbieter aus
summary: OpenClaw Gateway 24/7 auf einem günstigen Hetzner-VPS (Docker) mit dauerhaftem Zustand und eingebetteten Binärdateien ausführen
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T06:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw auf Hetzner (Docker, Leitfaden für Produktions-VPS)

## Ziel

Ein persistentes OpenClaw-Gateway auf einem Hetzner-VPS mit Docker ausführen, mit dauerhaftem Zustand, eingebetteten Binärdateien und sicherem Neustartverhalten.

Wenn Sie „OpenClaw 24/7 für ~5 $“ möchten, ist dies das einfachste zuverlässige Setup.
Die Preise von Hetzner ändern sich; wählen Sie den kleinsten Debian-/Ubuntu-VPS und skalieren Sie hoch, wenn Sie auf OOMs stoßen.

Erinnerung an das Sicherheitsmodell:

- Gemeinsam genutzte Agenten für Unternehmen sind in Ordnung, wenn alle dieselbe Vertrauensgrenze haben und die Laufzeit nur geschäftlich genutzt wird.
- Halten Sie die Trennung strikt: dedizierter VPS/Laufzeit + dedizierte Konten; keine persönlichen Apple-/Google-/Browser-/Passwortmanager-Profile auf diesem Host.
- Wenn Benutzer einander gegenüber adversarial sind, teilen Sie nach Gateway/Host/OS-Benutzer auf.

Siehe [Security](/de/gateway/security) und [VPS hosting](/de/vps).

## Was machen wir hier eigentlich (einfach erklärt)?

- Einen kleinen Linux-Server mieten (Hetzner-VPS)
- Docker installieren (isolierte Laufzeit für Apps)
- Das OpenClaw-Gateway in Docker starten
- `~/.openclaw` + `~/.openclaw/workspace` auf dem Host persistent speichern (überlebt Neustarts/Neu-Builds)
- Über einen SSH-Tunnel vom Laptop aus auf die Control UI zugreifen

Dieser eingebundene Zustand unter `~/.openclaw` enthält `openclaw.json`, agentenspezifische
`agents/<agentId>/agent/auth-profiles.json` und `.env`.

Auf das Gateway kann zugegriffen werden über:

- SSH-Portweiterleitung von Ihrem Laptop
- Direkte Portfreigabe, wenn Sie Firewalling und Tokens selbst verwalten

Dieser Leitfaden setzt Ubuntu oder Debian auf Hetzner voraus.  
Wenn Sie auf einem anderen Linux-VPS sind, ordnen Sie die Pakete entsprechend zu.
Für den generischen Docker-Ablauf siehe [Docker](/de/install/docker).

---

## Schneller Pfad (für erfahrene Operatoren)

1. Hetzner-VPS bereitstellen
2. Docker installieren
3. OpenClaw-Repository klonen
4. Persistente Host-Verzeichnisse erstellen
5. `.env` und `docker-compose.yml` konfigurieren
6. Erforderliche Binärdateien in das Image einbetten
7. `docker compose up -d`
8. Persistenz und Gateway-Zugriff verifizieren

---

## Was Sie benötigen

- Hetzner-VPS mit Root-Zugriff
- SSH-Zugriff von Ihrem Laptop
- Grundlegende Vertrautheit mit SSH + Copy-and-paste
- ~20 Minuten
- Docker und Docker Compose
- Modell-Authentifizierungsdaten
- Optionale Provider-Anmeldedaten
  - WhatsApp-QR
  - Telegram-Bot-Token
  - Gmail-OAuth

---

<Steps>
  <Step title="VPS bereitstellen">
    Erstellen Sie einen Ubuntu- oder Debian-VPS bei Hetzner.

    Als Root verbinden:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Dieser Leitfaden geht davon aus, dass der VPS zustandsbehaftet ist.
    Behandeln Sie ihn nicht als wegwerfbare Infrastruktur.

  </Step>

  <Step title="Docker installieren (auf dem VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Verifizieren:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw-Repository klonen">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Dieser Leitfaden geht davon aus, dass Sie ein benutzerdefiniertes Image bauen, um die Persistenz von Binärdateien zu garantieren.

  </Step>

  <Step title="Persistente Host-Verzeichnisse erstellen">
    Docker-Container sind ephemer.
    Jeder langlebige Zustand muss auf dem Host liegen.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Eigentümer auf den Container-Benutzer setzen (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Umgebungsvariablen konfigurieren">
    Erstellen Sie `.env` im Root des Repositorys.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Lassen Sie `OPENCLAW_GATEWAY_TOKEN` leer, es sei denn, Sie möchten es
    ausdrücklich über `.env` verwalten; OpenClaw schreibt beim ersten Start ein zufälliges Gateway-Token in die
    Konfiguration. Generieren Sie ein Keyring-Passwort und fügen Sie es in
    `GOG_KEYRING_PASSWORD` ein:

    ```bash
    openssl rand -hex 32
    ```

    **Committen Sie diese Datei nicht.**

    Diese `.env`-Datei ist für Container-/Laufzeit-Umgebungsvariablen wie `OPENCLAW_GATEWAY_TOKEN`.
    Gespeicherte OAuth-/API-Key-Authentifizierung für Provider befindet sich in der eingebundenen
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker-Compose-Konfiguration">
    Erstellen oder aktualisieren Sie `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Empfohlen: Gateway auf dem VPS nur auf Loopback halten; Zugriff per SSH-Tunnel.
          # Um es öffentlich freizugeben, entfernen Sie das Präfix `127.0.0.1:` und konfigurieren Sie die Firewall entsprechend.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` dient nur der Bequemlichkeit beim Bootstrap, es ist kein Ersatz für eine ordentliche Gateway-Konfiguration. Setzen Sie weiterhin Authentifizierung (`gateway.auth.token` oder Passwort) und verwenden Sie sichere Bind-Einstellungen für Ihre Bereitstellung.

  </Step>

  <Step title="Gemeinsame Laufzeitschritte für Docker-VM">
    Verwenden Sie den gemeinsamen Laufzeitleitfaden für den allgemeinen Docker-Host-Ablauf:

    - [Erforderliche Binärdateien in das Image einbetten](/de/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bauen und starten](/de/install/docker-vm-runtime#build-and-launch)
    - [Was wo persistent bleibt](/de/install/docker-vm-runtime#what-persists-where)
    - [Updates](/de/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-spezifischer Zugriff">
    Nach den gemeinsamen Schritten zum Bauen und Starten tunneln Sie von Ihrem Laptop aus:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Öffnen Sie:

    `http://127.0.0.1:18789/`

    Fügen Sie das konfigurierte Shared Secret ein. Dieser Leitfaden verwendet standardmäßig das Gateway-Token; wenn Sie zu Passwort-Authentifizierung gewechselt sind, verwenden Sie stattdessen dieses Passwort.

  </Step>
</Steps>

Die gemeinsame Persistenzzuordnung finden Sie unter [Docker VM Runtime](/de/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Für Teams, die Infrastructure-as-Code-Workflows bevorzugen, bietet ein von der Community gepflegtes Terraform-Setup:

- Modulare Terraform-Konfiguration mit Remote-State-Management
- Automatisierte Bereitstellung über cloud-init
- Deployment-Skripte (Bootstrap, Deploy, Backup/Restore)
- Sicherheits-Härtung (Firewall, UFW, nur SSH-Zugriff)
- SSH-Tunnel-Konfiguration für den Gateway-Zugriff

**Repositories:**

- Infrastruktur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker-Konfiguration: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Dieser Ansatz ergänzt das oben beschriebene Docker-Setup um reproduzierbare Bereitstellungen, versionskontrollierte Infrastruktur und automatisierte Notfallwiederherstellung.

> **Hinweis:** Von der Community gepflegt. Bei Problemen oder Beiträgen siehe die obigen Repository-Links.

## Nächste Schritte

- Messaging-Kanäle einrichten: [Channels](/de/channels)
- Das Gateway konfigurieren: [Gateway configuration](/de/gateway/configuration)
- OpenClaw aktuell halten: [Updating](/de/install/updating)

## Verwandt

- [Install overview](/de/install)
- [Fly.io](/de/install/fly)
- [Docker](/de/install/docker)
- [VPS hosting](/de/vps)
