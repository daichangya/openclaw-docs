---
read_when:
    - Sie möchten OpenClaw 24/7 auf einem Cloud-VPS ausführen (nicht auf Ihrem Laptop)
    - Sie möchten ein produktionsreifes, dauerhaft laufendes Gateway auf Ihrem eigenen VPS
    - Sie möchten volle Kontrolle über Persistenz, Binärdateien und Neustartverhalten
    - Sie führen OpenClaw in Docker auf Hetzner oder einem ähnlichen Anbieter aus
summary: OpenClaw Gateway 24/7 auf einem günstigen Hetzner-VPS ausführen (Docker) mit dauerhaftem Status und eingebetteten Binärdateien
title: Hetzner
x-i18n:
    generated_at: "2026-04-05T12:46:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: d859e4c0943040b022835f320708f879a11eadef70f2816cf0f2824eaaf165ef
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw auf Hetzner (Docker, Leitfaden für Produktions-VPS)

## Ziel

Ein persistentes OpenClaw Gateway auf einem Hetzner-VPS mit Docker ausführen, mit dauerhaftem Status, eingebetteten Binärdateien und sicherem Neustartverhalten.

Wenn Sie „OpenClaw 24/7 für ~5 $“ möchten, ist dies das einfachste zuverlässige Setup.
Die Preise bei Hetzner ändern sich; wählen Sie den kleinsten Debian-/Ubuntu-VPS und skalieren Sie hoch, wenn Sie auf OOMs stoßen.

Erinnerung an das Sicherheitsmodell:

- Von Unternehmen gemeinsam genutzte Agents sind in Ordnung, wenn sich alle innerhalb derselben Vertrauensgrenze befinden und die Laufzeit nur geschäftlich genutzt wird.
- Halten Sie eine strikte Trennung ein: dedizierter VPS/Laufzeit + dedizierte Accounts; keine persönlichen Apple-/Google-/Browser-/Passwortmanager-Profile auf diesem Host.
- Wenn Benutzer sich gegenseitig adversarial gegenüberstehen, trennen Sie nach Gateway/Host/OS-Benutzer.

Siehe [Sicherheit](/gateway/security) und [VPS hosting](/vps).

## Was tun wir hier (einfach erklärt)?

- Einen kleinen Linux-Server mieten (Hetzner-VPS)
- Docker installieren (isolierte App-Laufzeit)
- Das OpenClaw Gateway in Docker starten
- `~/.openclaw` + `~/.openclaw/workspace` auf dem Host persistieren (übersteht Neustarts/Rebuilds)
- Über einen SSH-Tunnel von Ihrem Laptop auf die Control UI zugreifen

Dieser eingehängte Status unter `~/.openclaw` enthält `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`
pro Agent und `.env`.

Auf das Gateway kann zugegriffen werden über:

- SSH-Portweiterleitung von Ihrem Laptop
- Direkte Portfreigabe, wenn Sie Firewalling und Tokens selbst verwalten

Diese Anleitung setzt Ubuntu oder Debian auf Hetzner voraus.  
Wenn Sie auf einem anderen Linux-VPS sind, passen Sie die Pakete entsprechend an.
Für den generischen Docker-Ablauf siehe [Docker](/install/docker).

---

## Schneller Weg (für erfahrene Betreiber)

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
- Grundlegende Vertrautheit mit SSH + Copy/Paste
- ~20 Minuten
- Docker und Docker Compose
- Modellauthentifizierungs-Anmeldeinformationen
- Optionale Provider-Anmeldeinformationen
  - WhatsApp-QR
  - Telegram-Bot-Token
  - Gmail-OAuth

---

<Steps>
  <Step title="Den VPS bereitstellen">
    Erstellen Sie einen Ubuntu- oder Debian-VPS bei Hetzner.

    Verbinden Sie sich als Root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Diese Anleitung setzt voraus, dass der VPS zustandsbehaftet ist.
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

  <Step title="Das OpenClaw-Repository klonen">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Diese Anleitung setzt voraus, dass Sie ein benutzerdefiniertes Image bauen, um die Persistenz der Binärdateien zu garantieren.

  </Step>

  <Step title="Persistente Host-Verzeichnisse erstellen">
    Docker-Container sind ephemer.
    Jeder langlebige Status muss auf dem Host liegen.

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
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Erzeugen Sie starke Secrets:

    ```bash
    openssl rand -hex 32
    ```

    **Committen Sie diese Datei nicht.**

    Diese Datei `.env` ist für Container-/Laufzeit-Umgebungsvariablen wie `OPENCLAW_GATEWAY_TOKEN`.
    Gespeicherte OAuth-/API-Key-Authentifizierung für Provider liegt in der eingehängten Datei
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
          # Empfohlen: das Gateway auf dem VPS nur über Loopback bereitstellen; Zugriff per SSH-Tunnel.
          # Um es öffentlich bereitzustellen, entfernen Sie das Präfix `127.0.0.1:` und konfigurieren Sie die Firewall entsprechend.
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

    `--allow-unconfigured` ist nur als Bequemlichkeit für den Bootstrap gedacht und kein Ersatz für eine ordentliche Gateway-Konfiguration. Setzen Sie trotzdem Auth (`gateway.auth.token` oder Passwort) und verwenden Sie sichere Bind-Einstellungen für Ihre Bereitstellung.

  </Step>

  <Step title="Gemeinsame Docker-VM-Laufzeitschritte">
    Verwenden Sie den gemeinsamen Laufzeitleitfaden für den allgemeinen Docker-Host-Ablauf:

    - [Erforderliche Binärdateien in das Image einbetten](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bauen und starten](/install/docker-vm-runtime#build-and-launch)
    - [Was wo persistiert](/install/docker-vm-runtime#what-persists-where)
    - [Updates](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-spezifischer Zugriff">
    Nach den gemeinsamen Schritten zum Bauen und Starten tunneln Sie von Ihrem Laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Öffnen Sie:

    `http://127.0.0.1:18789/`

    Fügen Sie das konfigurierte Shared Secret ein. Diese Anleitung verwendet standardmäßig das Gateway-Token; wenn Sie auf Passwort-Authentifizierung umgestellt haben, verwenden Sie stattdessen dieses Passwort.

  </Step>
</Steps>

Die gemeinsame Persistenzübersicht finden Sie unter [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Für Teams, die Infrastructure-as-Code-Workflows bevorzugen, bietet ein von der Community gepflegtes Terraform-Setup:

- Modulare Terraform-Konfiguration mit Verwaltung von Remote-Status
- Automatisierte Bereitstellung über cloud-init
- Deployment-Skripte (Bootstrap, Deployment, Backup/Wiederherstellung)
- Sicherheits-Härtung (Firewall, UFW, nur SSH-Zugriff)
- SSH-Tunnel-Konfiguration für Gateway-Zugriff

**Repos:**

- Infrastruktur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker-Konfiguration: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Dieser Ansatz ergänzt das obige Docker-Setup um reproduzierbare Deployments, versionskontrollierte Infrastruktur und automatisierte Wiederherstellung im Katastrophenfall.

> **Hinweis:** Von der Community gepflegt. Für Probleme oder Beiträge siehe die obigen Repo-Links.

## Nächste Schritte

- Messaging-Kanäle einrichten: [Kanäle](/channels)
- Das Gateway konfigurieren: [Gateway-Konfiguration](/gateway/configuration)
- OpenClaw aktuell halten: [Updating](/install/updating)
