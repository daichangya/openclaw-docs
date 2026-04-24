---
read_when:
    - Sie möchten OpenClaw 24/7 auf GCP ausführen
    - Sie möchten ein produktionsreifes, ständig laufendes Gateway auf Ihrer eigenen VM
    - Sie möchten volle Kontrolle über Persistenz, Binärdateien und Neustartverhalten
summary: OpenClaw Gateway 24/7 auf einer GCP-Compute-Engine-VM (Docker) mit dauerhaftem Status ausführen
title: GCP
x-i18n:
    generated_at: "2026-04-24T06:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw auf GCP Compute Engine (Docker, Production-VPS-Leitfaden)

## Ziel

Ein dauerhaftes OpenClaw Gateway auf einer GCP-Compute-Engine-VM mit Docker ausführen, mit dauerhaftem Status, eingebetteten Binärdateien und sicherem Neustartverhalten.

Wenn Sie „OpenClaw 24/7 für ~$5-12/Monat“ möchten, ist dies ein zuverlässiges Setup auf Google Cloud.
Die Preise variieren je nach Maschinentyp und Region; wählen Sie die kleinste VM, die zu Ihrer Last passt, und skalieren Sie hoch, wenn Sie auf OOMs stoßen.

## Was machen wir hier (einfach erklärt)?

- Ein GCP-Projekt erstellen und Abrechnung aktivieren
- Eine Compute-Engine-VM erstellen
- Docker installieren (isolierte App-Laufzeit)
- Das OpenClaw Gateway in Docker starten
- `~/.openclaw` + `~/.openclaw/workspace` auf dem Host persistent speichern (überlebt Neustarts/Neuaufbauten)
- Über einen SSH-Tunnel von Ihrem Laptop aus auf die Control UI zugreifen

Dieser eingehängte Status unter `~/.openclaw` enthält `openclaw.json`, pro Agent
`agents/<agentId>/agent/auth-profiles.json` und `.env`.

Auf das Gateway kann zugegriffen werden über:

- SSH-Portweiterleitung von Ihrem Laptop
- Direkte Portfreigabe, wenn Sie Firewalling und Tokens selbst verwalten

Dieser Leitfaden verwendet Debian auf GCP Compute Engine.
Ubuntu funktioniert ebenfalls; passen Sie die Pakete entsprechend an.
Für den generischen Docker-Ablauf siehe [Docker](/de/install/docker).

---

## Schneller Pfad (erfahrene Operatoren)

1. GCP-Projekt erstellen + Compute Engine API aktivieren
2. Compute-Engine-VM erstellen (e2-small, Debian 12, 20GB)
3. Per SSH in die VM einloggen
4. Docker installieren
5. OpenClaw-Repository klonen
6. Persistente Host-Verzeichnisse erstellen
7. `.env` und `docker-compose.yml` konfigurieren
8. Erforderliche Binärdateien einbacken, bauen und starten

---

## Was Sie brauchen

- GCP-Konto (für e2-micro für Free Tier berechtigt)
- installierte gcloud CLI (oder Cloud Console verwenden)
- SSH-Zugriff von Ihrem Laptop
- Grundlegende Vertrautheit mit SSH + Copy/Paste
- ~20-30 Minuten
- Docker und Docker Compose
- Authentifizierungsdaten für Modelle
- Optionale Provider-Anmeldedaten
  - WhatsApp-QR
  - Telegram-Bot-Token
  - Gmail-OAuth

---

<Steps>
  <Step title="gcloud CLI installieren (oder Console verwenden)">
    **Option A: gcloud CLI** (empfohlen für Automatisierung)

    Installation von [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Initialisieren und authentifizieren:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Option B: Cloud Console**

    Alle Schritte können über die Web-UI unter [https://console.cloud.google.com](https://console.cloud.google.com) ausgeführt werden.

  </Step>

  <Step title="Ein GCP-Projekt erstellen">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Aktivieren Sie die Abrechnung unter [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (für Compute Engine erforderlich).

    Aktivieren Sie die Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Gehen Sie zu IAM & Admin > Create Project
    2. Benennen Sie das Projekt und erstellen Sie es
    3. Aktivieren Sie die Abrechnung für das Projekt
    4. Navigieren Sie zu APIs & Services > Enable APIs > suchen Sie nach "Compute Engine API" > Enable

  </Step>

  <Step title="Die VM erstellen">
    **Maschinentypen:**

    | Typ       | Spezifikationen            | Kosten             | Hinweise                                      |
    | --------- | -------------------------- | ------------------ | --------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM            | ~$25/Monat         | Am zuverlässigsten für lokale Docker-Builds   |
    | e2-small  | 2 vCPU, 2GB RAM            | ~$12/Monat         | Empfohlenes Minimum für Docker-Build          |
    | e2-micro  | 2 vCPU (geteilt), 1GB RAM  | Für Free Tier geeignet | Scheitert oft mit Docker-Build-OOM (Exit 137) |

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

    1. Gehen Sie zu Compute Engine > VM instances > Create instance
    2. Name: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Maschinentyp: `e2-small`
    5. Boot-Disk: Debian 12, 20GB
    6. Erstellen

  </Step>

  <Step title="Per SSH in die VM einloggen">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Klicken Sie im Compute-Engine-Dashboard neben Ihrer VM auf die Schaltfläche „SSH“.

    Hinweis: Die Weitergabe von SSH-Schlüsseln kann 1-2 Minuten nach Erstellung der VM dauern. Wenn die Verbindung abgelehnt wird, warten Sie und versuchen Sie es erneut.

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

    Dieser Leitfaden setzt voraus, dass Sie ein benutzerdefiniertes Image bauen, um die Persistenz von Binärdateien zu garantieren.

  </Step>

  <Step title="Persistente Host-Verzeichnisse erstellen">
    Docker-Container sind ephemer.
    Jeder langlebige Status muss auf dem Host liegen.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Umgebungsvariablen konfigurieren">
    Erstellen Sie `.env` im Root des Repository.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Lassen Sie `OPENCLAW_GATEWAY_TOKEN` leer, außer wenn Sie es explizit über `.env`
    verwalten möchten; OpenClaw schreibt beim ersten Start ein zufälliges Gateway-Token in die
    Konfiguration. Erzeugen Sie ein Passwort für den Keyring und fügen Sie es in
    `GOG_KEYRING_PASSWORD` ein:

    ```bash
    openssl rand -hex 32
    ```

    **Committen Sie diese Datei nicht.**

    Diese `.env`-Datei ist für Container-/Laufzeit-Umgebung wie `OPENCLAW_GATEWAY_TOKEN`.
    Gespeicherte Provider-OAuth-/API-Key-Authentifizierung liegt in der eingehängten
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
          # Empfohlen: Gateway auf der VM nur an Loopback binden; Zugriff über SSH-Tunnel.
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

    `--allow-unconfigured` dient nur der Bequemlichkeit beim Bootstrap; es ersetzt keine ordentliche Gateway-Konfiguration. Setzen Sie weiterhin Authentifizierung (`gateway.auth.token` oder Passwort) und verwenden Sie für Ihr Deployment sichere Bind-Einstellungen.

  </Step>

  <Step title="Gemeinsame Docker-VM-Laufzeitschritte">
    Verwenden Sie den gemeinsamen Laufzeitleitfaden für den allgemeinen Docker-Host-Ablauf:

    - [Erforderliche Binärdateien in das Image einbacken](/de/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bauen und starten](/de/install/docker-vm-runtime#build-and-launch)
    - [Was wo persistent gespeichert wird](/de/install/docker-vm-runtime#what-persists-where)
    - [Updates](/de/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-spezifische Hinweise zum Start">
    Wenn auf GCP der Build während `pnpm install --frozen-lockfile` mit `Killed` oder `exit code 137` fehlschlägt, hat die VM zu wenig Arbeitsspeicher. Verwenden Sie mindestens `e2-small` oder für zuverlässigere erste Builds `e2-medium`.

    Wenn Sie an LAN binden (`OPENCLAW_GATEWAY_BIND=lan`), konfigurieren Sie vor dem Fortfahren eine vertrauenswürdige Browser-Origin:

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

    Öffnen Sie in Ihrem Browser:

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

    Benötigen Sie erneut die Referenz zu gemeinsamer Persistenz und Updates?
    Siehe [Docker-VM-Laufzeit](/de/install/docker-vm-runtime#what-persists-where) und [Updates für Docker-VM-Laufzeit](/de/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Fehlerbehebung

**SSH-Verbindung abgelehnt**

Die Weitergabe von SSH-Schlüsseln kann 1-2 Minuten nach Erstellung der VM dauern. Warten Sie und versuchen Sie es erneut.

**Probleme mit OS Login**

Prüfen Sie Ihr OS-Login-Profil:

```bash
gcloud compute os-login describe-profile
```

Stellen Sie sicher, dass Ihr Konto die erforderlichen IAM-Berechtigungen hat (Compute OS Login oder Compute OS Admin Login).

**Zu wenig Arbeitsspeicher (OOM)**

Wenn der Docker-Build mit `Killed` und `exit code 137` fehlschlägt, wurde die VM wegen OOM beendet. Upgraden Sie auf e2-small (Minimum) oder e2-medium (empfohlen für zuverlässige lokale Builds):

```bash
# VM zuerst stoppen
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Maschinentyp ändern
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM starten
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Service Accounts (Best Practice für Sicherheit)

Für den persönlichen Gebrauch ist Ihr Standard-Benutzerkonto völlig ausreichend.

Für Automatisierung oder CI/CD-Pipelines erstellen Sie ein dediziertes Service Account mit minimalen Berechtigungen:

1. Ein Service Account erstellen:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Rolle „Compute Instance Admin“ gewähren (oder eine enger gefasste benutzerdefinierte Rolle):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Verwenden Sie für Automatisierung nicht die Owner-Rolle. Halten Sie sich an das Prinzip der minimalen Rechte.

Siehe [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) für Details zu IAM-Rollen.

---

## Nächste Schritte

- Messaging-Kanäle einrichten: [Kanäle](/de/channels)
- Lokale Geräte als Nodes pairen: [Nodes](/de/nodes)
- Das Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)

## Verwandt

- [Installationsüberblick](/de/install)
- [Azure](/de/install/azure)
- [VPS-Hosting](/de/vps)
