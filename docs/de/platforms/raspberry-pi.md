---
read_when:
    - OpenClaw auf einem Raspberry Pi einrichten
    - OpenClaw auf ARM-Geräten ausführen
    - Eine günstige, ständig aktive persönliche KI aufbauen
summary: OpenClaw auf Raspberry Pi (kostengünstiges Self-Hosting-Setup)
title: Raspberry Pi (Plattform)
x-i18n:
    generated_at: "2026-04-24T06:48:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw auf Raspberry Pi

## Ziel

Ein persistentes, ständig aktives OpenClaw-Gateway auf einem Raspberry Pi für **~35–80 $** Einmalkosten ausführen (keine monatlichen Gebühren).

Perfekt für:

- 24/7 persönlichen KI-Assistenten
- Home-Automation-Hub
- stromsparenden, immer verfügbaren Telegram-/WhatsApp-Bot

## Hardware-Anforderungen

| Pi-Modell       | RAM     | Funktioniert? | Hinweise                           |
| --------------- | ------- | ------------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Am besten  | Am schnellsten, empfohlen          |
| **Pi 4**        | 4GB     | ✅ Gut        | Optimal für die meisten Nutzer     |
| **Pi 4**        | 2GB     | ✅ OK         | Funktioniert, Swap hinzufügen      |
| **Pi 4**        | 1GB     | ⚠️ Knapp      | Möglich mit Swap, minimale Konfiguration |
| **Pi 3B+**      | 1GB     | ⚠️ Langsam    | Funktioniert, aber träge           |
| **Pi Zero 2 W** | 512MB   | ❌            | Nicht empfohlen                    |

**Mindestanforderungen:** 1 GB RAM, 1 Kern, 500 MB Speicher  
**Empfohlen:** 2 GB+ RAM, 64-Bit-OS, 16 GB+ SD-Karte (oder USB-SSD)

## Was Sie brauchen

- Raspberry Pi 4 oder 5 (2 GB+ empfohlen)
- MicroSD-Karte (16 GB+) oder USB-SSD (bessere Leistung)
- Netzteil (offizielles Pi-Netzteil empfohlen)
- Netzwerkverbindung (Ethernet oder WLAN)
- ~30 Minuten

## 1) Das OS flashen

Verwenden Sie **Raspberry Pi OS Lite (64-bit)** — für einen Headless-Server ist kein Desktop nötig.

1. Laden Sie den [Raspberry Pi Imager](https://www.raspberrypi.com/software/) herunter
2. Wählen Sie als OS: **Raspberry Pi OS Lite (64-bit)**
3. Klicken Sie auf das Zahnrad-Symbol (⚙️), um vorzukonfigurieren:
   - Hostname setzen: `gateway-host`
   - SSH aktivieren
   - Benutzername/Passwort setzen
   - WLAN konfigurieren (falls Sie kein Ethernet verwenden)
4. Auf Ihre SD-Karte / Ihr USB-Laufwerk flashen
5. Pi einsetzen und booten

## 2) Per SSH verbinden

```bash
ssh user@gateway-host
# oder die IP-Adresse verwenden
ssh user@192.168.x.x
```

## 3) System einrichten

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Wesentliche Pakete installieren
sudo apt install -y git curl build-essential

# Zeitzone setzen (wichtig für Cron/Erinnerungen)
sudo timedatectl set-timezone America/Chicago  # In Ihre Zeitzone ändern
```

## 4) Node.js 24 installieren (ARM64)

```bash
# Node.js über NodeSource installieren
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Prüfen
node --version  # Sollte v24.x.x anzeigen
npm --version
```

## 5) Swap hinzufügen (wichtig bei 2 GB oder weniger)

Swap verhindert Abstürze durch Speichermangel:

```bash
# 2-GB-Swap-Datei erstellen
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Dauerhaft machen
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Für wenig RAM optimieren (Swappiness reduzieren)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw installieren

### Option A: Standardinstallation (empfohlen)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Option B: Hackbare Installation (zum Tüfteln)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Die hackbare Installation gibt Ihnen direkten Zugriff auf Logs und Code — nützlich zum Debuggen ARM-spezifischer Probleme.

## 7) Onboarding ausführen

```bash
openclaw onboard --install-daemon
```

Folgen Sie dem Assistenten:

1. **Gateway-Modus:** Lokal
2. **Authentifizierung:** API-Schlüssel empfohlen (OAuth kann auf einem Headless-Pi schwierig sein)
3. **Kanäle:** Telegram ist am einfachsten für den Einstieg
4. **Daemon:** Ja (systemd)

## 8) Installation verifizieren

```bash
# Status prüfen
openclaw status

# Dienst prüfen (Standardinstallation = systemd-User-Unit)
systemctl --user status openclaw-gateway.service

# Logs anzeigen
journalctl --user -u openclaw-gateway.service -f
```

## 9) Auf das OpenClaw-Dashboard zugreifen

Ersetzen Sie `user@gateway-host` durch Ihren Pi-Benutzernamen und Hostnamen oder die IP-Adresse.

Lassen Sie den Pi auf Ihrem Computer eine frische Dashboard-URL ausgeben:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Der Befehl gibt `Dashboard URL:` aus. Je nachdem, wie `gateway.auth.token`
konfiguriert ist, kann die URL ein einfacher Link wie `http://127.0.0.1:18789/` sein oder
einer, der `#token=...` enthält.

Erstellen Sie in einem anderen Terminal auf Ihrem Computer den SSH-Tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Öffnen Sie dann die ausgegebene Dashboard-URL in Ihrem lokalen Browser.

Wenn die UI nach Shared-Secret-Authentifizierung fragt, fügen Sie das konfigurierte Token oder Passwort
in die Einstellungen der Control UI ein. Für Token-Authentifizierung verwenden Sie `gateway.auth.token` (oder
`OPENCLAW_GATEWAY_TOKEN`).

Für ständig aktiven Remote-Zugriff siehe [Tailscale](/de/gateway/tailscale).

---

## Leistungsoptimierungen

### Eine USB-SSD verwenden (enorme Verbesserung)

SD-Karten sind langsam und verschleißen. Eine USB-SSD verbessert die Leistung drastisch:

```bash
# Prüfen, ob von USB gebootet wird
lsblk
```

Siehe die [Pi-USB-Boot-Anleitung](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) für die Einrichtung.

### CLI-Start beschleunigen (Modul-Compile-Cache)

Auf Pi-Hosts mit geringerer Leistung aktivieren Sie den Modul-Compile-Cache von Node, damit wiederholte CLI-Läufe schneller sind:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Hinweise:

- `NODE_COMPILE_CACHE` beschleunigt spätere Läufe (`status`, `health`, `--help`).
- `/var/tmp` übersteht Neustarts besser als `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` vermeidet zusätzliche Startkosten durch Selbst-Respawn der CLI.
- Der erste Lauf wärmt den Cache auf; spätere Läufe profitieren am meisten.

### systemd-Start optimieren (optional)

Wenn dieser Pi hauptsächlich OpenClaw ausführt, fügen Sie ein Service-Drop-in hinzu, um Neustart-
Jitter zu reduzieren und die Startumgebung stabil zu halten:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Dann anwenden:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Wenn möglich, halten Sie OpenClaw-Zustand/Cache auf SSD-basiertem Speicher, um
Random-I/O-Flaschenhälse von SD-Karten bei Kaltstarts zu vermeiden.

Wenn dies ein Headless-Pi ist, aktivieren Sie einmal Linger, damit der User-Dienst
einen Logout überlebt:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Wie `Restart=`-Richtlinien die automatisierte Wiederherstellung unterstützen:
[systemd kann die Wiederherstellung von Diensten automatisieren](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Speicherverbrauch reduzieren

```bash
# GPU-Speicherzuweisung deaktivieren (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Bluetooth deaktivieren, wenn nicht benötigt
sudo systemctl disable bluetooth
```

### Ressourcen überwachen

```bash
# Speicher prüfen
free -h

# CPU-Temperatur prüfen
vcgencmd measure_temp

# Live-Monitoring
htop
```

---

## ARM-spezifische Hinweise

### Binärkompatibilität

Die meisten OpenClaw-Funktionen arbeiten auf ARM64, aber einige externe Binärdateien benötigen möglicherweise ARM-Builds:

| Tool               | ARM64-Status | Hinweise                            |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Funktioniert sehr gut               |
| WhatsApp (Baileys) | ✅           | Reines JS, keine Probleme           |
| Telegram           | ✅           | Reines JS, keine Probleme           |
| gog (Gmail-CLI)    | ⚠️           | Auf ARM-Release prüfen              |
| Chromium (Browser) | ✅           | `sudo apt install chromium-browser` |

Wenn ein Skill fehlschlägt, prüfen Sie, ob dessen Binärdatei einen ARM-Build hat. Viele Go-/Rust-Tools haben das; manche nicht.

### 32-Bit vs. 64-Bit

**Verwenden Sie immer ein 64-Bit-OS.** Node.js und viele moderne Tools benötigen es. Prüfen Sie mit:

```bash
uname -m
# Sollte anzeigen: aarch64 (64-Bit), nicht armv7l (32-Bit)
```

---

## Empfohlene Modellkonfiguration

Da der Pi nur das Gateway ist (Modelle laufen in der Cloud), verwenden Sie API-basierte Modelle:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**Versuchen Sie nicht, lokale LLMs auf einem Pi auszuführen** — selbst kleine Modelle sind zu langsam. Lassen Sie Claude/GPT die schwere Arbeit erledigen.

---

## Automatischer Start beim Booten

Das Onboarding richtet dies ein, aber zur Prüfung:

```bash
# Prüfen, ob der Dienst aktiviert ist
systemctl --user is-enabled openclaw-gateway.service

# Aktivieren, falls nicht
systemctl --user enable openclaw-gateway.service

# Beim Booten starten
systemctl --user start openclaw-gateway.service
```

---

## Fehlerbehebung

### Nicht genügend Speicher (OOM)

```bash
# Speicher prüfen
free -h

# Mehr Swap hinzufügen (siehe Schritt 5)
# Oder die Anzahl laufender Dienste auf dem Pi reduzieren
```

### Langsame Leistung

- USB-SSD statt SD-Karte verwenden
- Nicht verwendete Dienste deaktivieren: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU-Drosselung prüfen: `vcgencmd get_throttled` (sollte `0x0` zurückgeben)

### Dienst startet nicht

```bash
# Logs prüfen
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Häufige Lösung: neu bauen
cd ~/openclaw  # wenn Sie die hackbare Installation verwenden
npm run build
systemctl --user restart openclaw-gateway.service
```

### Probleme mit ARM-Binärdateien

Wenn ein Skill mit „exec format error“ fehlschlägt:

1. Prüfen Sie, ob die Binärdatei einen ARM64-Build hat
2. Versuchen Sie, sie aus dem Quellcode zu bauen
3. Oder verwenden Sie einen Docker-Container mit ARM-Unterstützung

### WLAN-Verbindung bricht ab

Für Headless-Pis im WLAN:

```bash
# WLAN-Energiesparen deaktivieren
sudo iwconfig wlan0 power off

# Dauerhaft machen
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Kostenvergleich

| Setup          | Einmalkosten | Monatliche Kosten | Hinweise                    |
| -------------- | ------------ | ----------------- | --------------------------- |
| **Pi 4 (2GB)** | ~$45         | $0                | + Strom (~$5/Jahr)          |
| **Pi 4 (4GB)** | ~$55         | $0                | Empfohlen                   |
| **Pi 5 (4GB)** | ~$60         | $0                | Beste Leistung              |
| **Pi 5 (8GB)** | ~$80         | $0                | Überdimensioniert, aber zukunftssicher |
| DigitalOcean   | $0           | $6/Monat          | $72/Jahr                    |
| Hetzner        | $0           | €3,79/Monat       | ~$50/Jahr                   |

**Break-even:** Ein Pi amortisiert sich in ~6–12 Monaten gegenüber einem Cloud-VPS.

---

## Verwandt

- [Linux guide](/de/platforms/linux) — allgemeine Linux-Einrichtung
- [DigitalOcean guide](/de/install/digitalocean) — Cloud-Alternative
- [Hetzner guide](/de/install/hetzner) — Docker-Setup
- [Tailscale](/de/gateway/tailscale) — Remote-Zugriff
- [Nodes](/de/nodes) — Ihren Laptop/Ihr Telefon mit dem Pi-Gateway koppeln
