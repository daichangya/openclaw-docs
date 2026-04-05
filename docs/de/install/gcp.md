---
read_when:
    - Sie möchten OpenClaw 24/7 auf GCP ausführen
    - Sie möchten ein produktionsreifes, dauerhaft aktives Gateway auf Ihrer eigenen VM
    - Sie möchten volle Kontrolle über Persistenz, Binärdateien und Neustartverhalten
summary: OpenClaw Gateway 24/7 auf einer GCP Compute Engine-VM (Docker) mit dauerhaftem Zustand ausführen
title: GCP
x-i18n:
    generated_at: "2026-04-05T12:46:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73daaee3de71dad5175f42abf3e11355f2603b2f9e2b2523eac4d4c7015e3ebc
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw auf GCP Compute Engine (Docker, Produktionsleitfaden für VPS)

## Ziel

Ein persistentes OpenClaw Gateway auf einer GCP Compute Engine-VM mit Docker ausführen, mit dauerhaftem Zustand, eingebackenen Binärdateien und sicherem Neustartverhalten.

Wenn Sie „OpenClaw 24/7 für ~$5-12/Monat“ möchten, ist dies ein zuverlässiges Setup auf Google Cloud.
Die Preise variieren je nach Maschinentyp und Region; wählen Sie die kleinste VM, die zu Ihrer Workload passt, und skalieren Sie hoch, wenn OOMs auftreten.

## Was machen wir hier (einfach erklärt)?

- Ein GCP-Projekt erstellen und Abrechnung aktivieren
- Eine Compute Engine-VM erstellen
- Docker installieren (isolierte Laufzeit für Apps)
- Das OpenClaw Gateway in Docker starten
- `~/.openclaw` + `~/.openclaw/workspace` auf dem Host persistieren (überlebt Neustarts/Rebuilds)
- Über einen SSH-Tunnel vom Laptop auf die Control UI zugreifen

Dieser eingehängte Zustand in `~/.openclaw` umfasst `openclaw.json`, agent-spezifische
`agents/<agentId>/agent/auth-profiles.json` und `.env`.

Auf das Gateway kann zugegriffen werden über:

- SSH-Portweiterleitung von Ihrem Laptop
- Direkte Portfreigabe, wenn Sie Firewalling und Tokens selbst verwalten

Diese Anleitung verwendet Debian auf GCP Compute Engine.
Ubuntu funktioniert ebenfalls; ordnen Sie die Pakete entsprechend zu.
Für den generischen Docker-Ablauf siehe [Docker](/install/docker).

---

## Schnellpfad (für erfahrene Operatoren)

1. GCP-Projekt erstellen + Compute Engine API aktivieren
2. Compute Engine-VM erstellen (e2-small, Debian 12, 20GB)
3. Per SSH auf die VM verbinden
4. Docker installieren
5. OpenClaw-Repository klonen
6. Persistente Host-Verzeichnisse erstellen
7. `.env` und `docker-compose.yml` konfigurieren
8. Erforderliche Binärdateien einbacken, bauen und starten

---

## Was Sie benötigen

- GCP-Konto (Free-Tier-berechtigt für e2-micro)
- installierte gcloud CLI (oder Cloud Console verwenden)
- SSH-Zugriff von Ihrem Laptop
- Grundlegende Sicherheit im Umgang mit SSH + Copy/Paste
- ~20-30 Minuten
- Docker und Docker Compose
- Authentifizierungsdaten für Modelle
- Optionale Authentifizierungsdaten für Provider
  - WhatsApp-QR
  - Telegram-Bot-Token
  - Gmail OAuth

---

<Steps>
  <Step title="gcloud CLI installieren (oder Console verwenden)">
    **Option A: gcloud CLI** (empfohlen für Automatisierung)

    Installation über [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Initialisieren und authentifizieren:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Option B: Cloud Console**

    Alle Schritte können über die Web-UI unter [https://console.cloud.google.com](https://console.cloud.google.com) durchgeführt werden

  </Step>

  <Step title="Ein GCP-Projekt erstellen">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Aktivieren Sie die Abrechnung unter [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (erforderlich für Compute Engine).

    Aktivieren Sie die Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Zu IAM & Admin > Create Project gehen
    2. Namen vergeben und erstellen
    3. Abrechnung für das Projekt aktivieren
    4. Zu APIs & Services > Enable APIs > nach „Compute Engine API“ suchen > Enable

  </Step>

  <Step title="Die VM erstellen">
    **Maschinentypen:**

    | Typ       | Spezifikationen           | Kosten            | Hinweise                                         |
    | --------- | ------------------------- | ----------------- | ------------------------------------------------ |
    | e2-medium | 2 vCPU, 4GB RAM           | ~$25/Monat        | Am zuverlässigsten für lokale Docker-Builds      |
    | e2-small  | 2 vCPU, 2GB RAM           | ~$12/Monat        | Minimal empfohlen für Docker-Build               |
    | e2-micro  | 2 vCPU (geteilt), 1GB RAM | Free-Tier-berechtigt | Scheitert oft mit Docker-Build-OOM (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Zu Compute Engine > VM instances > Create instance gehen
    2. Name: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Maschinentyp: `e2-small`
    5. Boot-Datenträger: Debian 12, 20GB
    6. Create

  </Step>

  <Step title="Per SSH auf die VM verbinden">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Klicken Sie im Compute Engine-Dashboard neben Ihrer VM auf die Schaltfläche „SSH“.

    Hinweis: Das Verteilen von SSH-Schlüsseln kann nach dem Erstellen der VM 1-2 Minuten dauern. Wenn die Verbindung verweigert wird, warten Sie und versuchen Sie es erneut.

  </Step>

  <Step title="Docker installieren (auf der VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Melden Sie sich ab und wieder an, damit die Gruppenänderung wirksam wird:

    ```bash
    exit
    ```

    Dann erneut per SSH verbinden:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Prüfen:

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

    Diese Anleitung geht davon aus, dass Sie ein benutzerdefiniertes Image bauen, um die Persistenz der Binärdateien zu garantieren.

  </Step>

  <Step title="Persistente Host-Verzeichnisse erstellen">
    Docker-Container sind flüchtig.
    Jeder langlebige Zustand muss auf dem Host liegen.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Umgebungsvariablen konfigurieren">
    Erstellen Sie `.env` im Stammverzeichnis des Repository.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Starke Secrets erzeugen:

    ```bash
    openssl rand -hex 32
    ```

    **Committen Sie diese Datei nicht.**

    Diese `.env`-Datei ist für Container-/Laufzeit-env wie `OPENCLAW_GATEWAY_TOKEN`.
    Gespeicherte OAuth-/API-Key-Authentifizierung für Provider liegt in dem eingehängten
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
          # Empfehlung: Das Gateway auf der VM nur an loopback binden; Zugriff über SSH-Tunnel.
          # Um es öffentlich freizugeben, das Präfix `127.0.0.1:` entfernen und die Firewall entsprechend konfigurieren.
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

    `--allow-unconfigured` dient nur dem Bootstrap-Komfort und ersetzt keine korrekte Gateway-Konfiguration. Setzen Sie weiterhin Authentifizierung (`gateway.auth.token` oder Passwort) und verwenden Sie sichere Bind-Einstellungen für Ihre Bereitstellung.

  </Step>

  <Step title="Gemeinsame Docker-VM-Laufzeitschritte">
    Verwenden Sie die gemeinsame Laufzeitanleitung für den üblichen Docker-Host-Ablauf:

    - [Erforderliche Binärdateien in das Image einbacken](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bauen und starten](/install/docker-vm-runtime#build-and-launch)
    - [Was wo persistiert](/install/docker-vm-runtime#what-persists-where)
    - [Updates](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-spezifische Hinweise zum Start">
    Wenn auf GCP der Build während `pnpm install --frozen-lockfile` mit `Killed` oder `exit code 137` fehlschlägt, hat die VM nicht genug Speicher. Verwenden Sie mindestens `e2-small` oder für zuverlässigere erste Builds `e2-medium`.

    Wenn Sie an LAN binden (`OPENCLAW_GATEWAY_BIND=lan`), konfigurieren Sie vor dem Fortfahren einen vertrauenswürdigen Browser-Ursprung:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Wenn Sie den Gateway-Port geändert haben, ersetzen Sie `18789` durch Ihren konfigurierten Port.

  </Step>

  <Step title="Zugriff von Ihrem Laptop">
    Erstellen Sie einen SSH-Tunnel, um den Gateway-Port weiterzuleiten:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Im Browser öffnen:

    `http://127.0.0.1:18789/`

    Einen sauberen Dashboard-Link erneut ausgeben:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Wenn die UI nach Shared-Secret-Authentifizierung fragt, fügen Sie das konfigurierte Token oder
    Passwort in die Einstellungen der Control UI ein. Dieser Docker-Ablauf schreibt standardmäßig ein Token; wenn Sie die Container-Konfiguration auf Passwortauthentifizierung umstellen, verwenden Sie stattdessen dieses
    Passwort.

    Wenn die Control UI `unauthorized` oder `disconnected (1008): pairing required` anzeigt, genehmigen Sie das Browser-Gerät:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Benötigen Sie erneut die Referenz für gemeinsame Persistenz und Updates?
    Siehe [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) und [Docker VM Runtime updates](/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Fehlerbehebung

**SSH-Verbindung verweigert**

Das Verteilen von SSH-Schlüsseln kann nach dem Erstellen der VM 1-2 Minuten dauern. Warten Sie und versuchen Sie es erneut.

**Probleme mit OS Login**

Prüfen Sie Ihr OS-Login-Profil:

```bash
gcloud compute os-login describe-profile
```

Stellen Sie sicher, dass Ihr Konto die erforderlichen IAM-Berechtigungen hat (Compute OS Login oder Compute OS Admin Login).

**Nicht genug Speicher (OOM)**

Wenn der Docker-Build mit `Killed` und `exit code 137` fehlschlägt, wurde die VM wegen OOM beendet. Wechseln Sie auf e2-small (Minimum) oder e2-medium (empfohlen für zuverlässige lokale Builds):

```bash
# Zuerst die VM stoppen
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Maschinentyp ändern
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Die VM starten
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Servicekonten (Best Practice für Sicherheit)

Für die persönliche Nutzung ist Ihr Standardbenutzerkonto völlig ausreichend.

Für Automatisierung oder CI/CD-Pipelines erstellen Sie ein dediziertes Servicekonto mit minimalen Berechtigungen:

1. Ein Servicekonto erstellen:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Die Rolle „Compute Instance Admin“ gewähren (oder eine engere benutzerdefinierte Rolle):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Verwenden Sie für Automatisierung nicht die Rolle Owner. Verwenden Sie das Prinzip der geringsten Privilegien.

Details zu IAM-Rollen finden Sie unter [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles).

---

## Nächste Schritte

- Messaging-Kanäle einrichten: [Channels](/channels)
- Lokale Geräte als Nodes koppeln: [Nodes](/nodes)
- Das Gateway konfigurieren: [Gateway configuration](/gateway/configuration)
