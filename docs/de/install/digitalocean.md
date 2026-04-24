---
read_when:
    - OpenClaw auf DigitalOcean einrichten
    - Auf der Suche nach einem einfachen kostenpflichtigen VPS für OpenClaw
summary: OpenClaw auf einem DigitalOcean Droplet hosten
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-24T06:43:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

OpenClaw dauerhaft auf einem DigitalOcean Droplet ausführen.

## Voraussetzungen

- DigitalOcean-Konto ([Registrierung](https://cloud.digitalocean.com/registrations/new))
- SSH-Schlüsselpaar (oder Bereitschaft, Passwortauthentifizierung zu verwenden)
- Etwa 20 Minuten

## Einrichtung

<Steps>
  <Step title="Ein Droplet erstellen">
    <Warning>
    Verwenden Sie ein sauberes Basis-Image (Ubuntu 24.04 LTS). Vermeiden Sie Marketplace-1-Click-Images von Drittanbietern, sofern Sie deren Startskripte und Firewall-Standards nicht geprüft haben.
    </Warning>

    1. Melden Sie sich bei [DigitalOcean](https://cloud.digitalocean.com/) an.
    2. Klicken Sie auf **Create > Droplets**.
    3. Wählen Sie:
       - **Region:** Die Ihnen nächstgelegene
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH-Schlüssel (empfohlen) oder Passwort
    4. Klicken Sie auf **Create Droplet** und notieren Sie sich die IP-Adresse.

  </Step>

  <Step title="Verbinden und installieren">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Node.js 24 installieren
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # OpenClaw installieren
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Der Assistent führt Sie durch Modell-Authentifizierung, Kanaleinrichtung, Generierung des Gateway-Tokens und die Installation des Daemons (systemd).

  </Step>

  <Step title="Swap hinzufügen (empfohlen für 1-GB-Droplets)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Das Gateway verifizieren">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Auf die Control UI zugreifen">
    Das Gateway bindet standardmäßig an Loopback. Wählen Sie eine dieser Optionen.

    **Option A: SSH-Tunnel (am einfachsten)**

    ```bash
    # Von Ihrem lokalen Rechner
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Öffnen Sie dann `http://localhost:18789`.

    **Option B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Öffnen Sie dann `https://<magicdns>/` von einem beliebigen Gerät in Ihrem Tailnet.

    **Option C: Tailnet-Bind (ohne Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Öffnen Sie dann `http://<tailscale-ip>:18789` (Token erforderlich).

  </Step>
</Steps>

## Fehlerbehebung

**Gateway startet nicht** -- Führen Sie `openclaw doctor --non-interactive` aus und prüfen Sie die Logs mit `journalctl --user -u openclaw-gateway.service -n 50`.

**Port wird bereits verwendet** -- Führen Sie `lsof -i :18789` aus, um den Prozess zu finden, und stoppen Sie ihn dann.

**Zu wenig Arbeitsspeicher** -- Prüfen Sie mit `free -h`, ob Swap aktiv ist. Wenn weiterhin OOM auftritt, verwenden Sie API-basierte Modelle (Claude, GPT) statt lokaler Modelle oder upgraden Sie auf ein 2-GB-Droplet.

## Nächste Schritte

- [Kanäle](/de/channels) -- Telegram, WhatsApp, Discord und mehr verbinden
- [Gateway-Konfiguration](/de/gateway/configuration) -- alle Konfigurationsoptionen
- [Aktualisieren](/de/install/updating) -- OpenClaw aktuell halten

## Verwandt

- [Installationsüberblick](/de/install)
- [Fly.io](/de/install/fly)
- [Hetzner](/de/install/hetzner)
- [VPS-Hosting](/de/vps)
