---
read_when:
    - OpenClaw auf einem Pi einrichten
    - OpenClaw auf ARM-Geräten ausführen
    - Eine günstige, dauerhaft verfügbare persönliche AI aufbauen
summary: OpenClaw auf einem Pi für dauerhaftes Self-Hosting betreiben
title: Pi
x-i18n:
    generated_at: "2026-04-24T06:45:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

Betreiben Sie ein persistentes, dauerhaft aktives OpenClaw Gateway auf einem Pi. Da der Pi nur das Gateway ist (die Modelle laufen über API in der Cloud), bewältigt selbst ein bescheidener Pi die Last gut.

## Voraussetzungen

- Pi 4 oder 5 mit 2 GB+ RAM (4 GB empfohlen)
- MicroSD-Karte (16 GB+) oder USB-SSD (bessere Performance)
- Offizielles Pi-Netzteil
- Netzwerkverbindung (Ethernet oder WiFi)
- 64-Bit-Raspberry-Pi-OS (erforderlich -- kein 32-Bit verwenden)
- Etwa 30 Minuten

## Einrichtung

<Steps>
  <Step title="Das Betriebssystem flashen">
    Verwenden Sie **Raspberry Pi OS Lite (64-bit)** -- für einen Headless-Server wird kein Desktop benötigt.

    1. Laden Sie den [Raspberry Pi Imager](https://www.raspberrypi.com/software/) herunter.
    2. Wählen Sie als OS: **Raspberry Pi OS Lite (64-bit)**.
    3. Konfigurieren Sie im Einstellungsdialog vorab:
       - Hostname: `gateway-host`
       - SSH aktivieren
       - Benutzername und Passwort festlegen
       - WiFi konfigurieren (wenn Sie kein Ethernet verwenden)
    4. Auf Ihre SD-Karte oder Ihr USB-Laufwerk flashen, einsetzen und den Pi starten.

  </Step>

  <Step title="Per SSH verbinden">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Das System aktualisieren">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Zeitzone setzen (wichtig für Cron und Erinnerungen)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24 installieren">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Swap hinzufügen (wichtig bei 2 GB oder weniger)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Swappiness für Geräte mit wenig RAM reduzieren
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw installieren">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Folgen Sie dem Assistenten. API-Schlüssel werden für Headless-Geräte gegenüber OAuth empfohlen. Telegram ist der einfachste Channel für den Einstieg.

  </Step>

  <Step title="Überprüfen">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Auf die Control UI zugreifen">
    Holen Sie sich auf Ihrem Computer eine Dashboard-URL vom Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Erstellen Sie dann in einem anderen Terminal einen SSH-Tunnel:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Öffnen Sie die ausgegebene URL in Ihrem lokalen Browser. Für dauerhaft aktiven Remote-Zugriff siehe [Tailscale-Integration](/de/gateway/tailscale).

  </Step>
</Steps>

## Performance-Tipps

**Verwenden Sie eine USB-SSD** -- SD-Karten sind langsam und verschleißen. Eine USB-SSD verbessert die Performance erheblich. Siehe den [Leitfaden zum USB-Boot auf Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Module-Compile-Cache aktivieren** -- Beschleunigt wiederholte CLI-Aufrufe auf leistungsschwächeren Pi-Hosts:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Speichernutzung reduzieren** -- Geben Sie bei Headless-Setups GPU-Speicher frei und deaktivieren Sie ungenutzte Dienste:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Fehlerbehebung

**Kein Speicher mehr** -- Prüfen Sie mit `free -h`, ob Swap aktiv ist. Deaktivieren Sie ungenutzte Dienste (`sudo systemctl disable cups bluetooth avahi-daemon`). Verwenden Sie nur API-basierte Modelle.

**Langsame Performance** -- Verwenden Sie eine USB-SSD statt einer SD-Karte. Prüfen Sie CPU-Throttling mit `vcgencmd get_throttled` (sollte `0x0` zurückgeben).

**Dienst startet nicht** -- Prüfen Sie Logs mit `journalctl --user -u openclaw-gateway.service --no-pager -n 100` und führen Sie `openclaw doctor --non-interactive` aus. Wenn dies ein Headless-Pi ist, prüfen Sie außerdem, dass Linger aktiviert ist: `sudo loginctl enable-linger "$(whoami)"`.

**Probleme mit ARM-Binärdateien** -- Wenn ein Skill mit „exec format error“ fehlschlägt, prüfen Sie, ob die Binärdatei einen ARM64-Build hat. Verifizieren Sie die Architektur mit `uname -m` (sollte `aarch64` anzeigen).

**WiFi-Verbindungsabbrüche** -- Deaktivieren Sie WiFi-Energiesparen: `sudo iwconfig wlan0 power off`.

## Nächste Schritte

- [Channels](/de/channels) -- Telegram, WhatsApp, Discord und mehr verbinden
- [Gateway-Konfiguration](/de/gateway/configuration) -- alle Konfigurationsoptionen
- [Aktualisieren](/de/install/updating) -- OpenClaw aktuell halten

## Verwandt

- [Installationsüberblick](/de/install)
- [Linux-Server](/de/vps)
- [Plattformen](/de/platforms)
