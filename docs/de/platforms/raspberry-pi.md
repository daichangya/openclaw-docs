---
read_when:
    - Einrichten von OpenClaw auf einem Raspberry Pi
    - Ausführen von OpenClaw auf ARM-Geräten
    - Aufbau einer günstigen, ständig verfügbaren persönlichen KI
summary: OpenClaw auf Raspberry Pi (kostengünstiges Self-Hosting-Setup)
title: Raspberry Pi (Plattform)
x-i18n:
    generated_at: "2026-04-05T12:50:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07f34e91899b7e0a31d9b944f3cb0cfdd4ecdeba58b619ae554379abdbf37eaf
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw auf Raspberry Pi

## Ziel

Führen Sie ein persistentes, ständig verfügbares OpenClaw-Gateway auf einem Raspberry Pi aus – bei einmaligen Kosten von **ca. 35 bis 80 US-Dollar** (keine monatlichen Gebühren).

Perfekt für:

- persönlichen KI-Assistenten rund um die Uhr
- Home-Automation-Hub
- stromsparenden, immer verfügbaren Telegram-/WhatsApp-Bot

## Hardwareanforderungen

| Pi-Modell       | RAM     | Funktioniert? | Hinweise                           |
| --------------- | ------- | ------------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Am besten  | Am schnellsten, empfohlen          |
| **Pi 4**        | 4GB     | ✅ Gut        | Idealer Kompromiss für die meisten |
| **Pi 4**        | 2GB     | ✅ OK         | Funktioniert, Swap hinzufügen      |
| **Pi 4**        | 1GB     | ⚠️ Knapp      | Mit Swap und Minimal-Konfig möglich |
| **Pi 3B+**      | 1GB     | ⚠️ Langsam    | Funktioniert, aber träge           |
| **Pi Zero 2 W** | 512MB   | ❌            | Nicht empfohlen                    |

**Mindestanforderungen:** 1GB RAM, 1 Kern, 500MB Speicherplatz  
**Empfohlen:** 2GB+ RAM, 64-Bit-Betriebssystem, 16GB+ SD-Karte (oder USB-SSD)

## Was Sie benötigen

- Raspberry Pi 4 oder 5 (2GB+ empfohlen)
- MicroSD-Karte (16GB+) oder USB-SSD (bessere Leistung)
- Netzteil (offizielles Pi-Netzteil empfohlen)
- Netzwerkverbindung (Ethernet oder WiFi)
- ca. 30 Minuten

## 1) Betriebssystem flashen

Verwenden Sie **Raspberry Pi OS Lite (64-bit)** — für einen Headless-Server ist kein Desktop erforderlich.

1. Laden Sie [Raspberry Pi Imager](https://www.raspberrypi.com/software/) herunter.
2. Wählen Sie als Betriebssystem **Raspberry Pi OS Lite (64-bit)**.
3. Klicken Sie auf das Zahnradsymbol (⚙️), um die Vorkonfiguration festzulegen:
   - Hostname setzen: `gateway-host`
   - SSH aktivieren
   - Benutzername/Passwort setzen
   - WiFi konfigurieren (falls Sie kein Ethernet verwenden)
4. Auf die SD-Karte / das USB-Laufwerk flashen
5. Pi einsetzen und starten

## 2) Über SSH verbinden

```bash
ssh user@gateway-host
# oder die IP-Adresse verwenden
ssh user@192.168.x.x
```

## 3) System einrichten

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Wichtige Pakete installieren
sudo apt install -y git curl build-essential

# Zeitzone festlegen (wichtig für cron/Erinnerungen)
sudo timedatectl set-timezone America/Chicago  # Auf Ihre Zeitzone ändern
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

## 5) Swap hinzufügen (wichtig bei 2GB oder weniger)

Swap verhindert Abstürze durch Speichermangel:

```bash
# 2GB-Swap-Datei erstellen
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Dauerhaft aktivieren
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

### Option B: Hackbare Installation (zum Basteln)

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

1. **Gateway-Modus:** Local
2. **Authentifizierung:** API-Schlüssel empfohlen (OAuth kann auf einem Headless-Pi empfindlich sein)
3. **Kanäle:** Telegram ist am einfachsten für den Einstieg
4. **Daemon:** Ja (systemd)

## 8) Installation prüfen

```bash
# Status prüfen
openclaw status

# Dienst prüfen (Standardinstallation = systemd-User-Unit)
systemctl --user status openclaw-gateway.service

# Logs anzeigen
journalctl --user -u openclaw-gateway.service -f
```

## 9) Auf das OpenClaw-Dashboard zugreifen

Ersetzen Sie `user@gateway-host` durch Ihren Pi-Benutzernamen und den Hostnamen oder die IP-Adresse.

Bitten Sie auf Ihrem Computer den Pi, eine neue Dashboard-URL auszugeben:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Der Befehl gibt `Dashboard URL:` aus. Je nachdem, wie `gateway.auth.token`
konfiguriert ist, kann die URL ein einfacher Link wie `http://127.0.0.1:18789/` sein oder
`#token=...` enthalten.

Erstellen Sie in einem anderen Terminal auf Ihrem Computer den SSH-Tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Öffnen Sie dann die ausgegebene Dashboard-URL in Ihrem lokalen Browser.

Wenn die UI nach Shared-Secret-Authentifizierung fragt, fügen Sie das konfigurierte Token oder Passwort
in die Einstellungen der Control UI ein. Für Token-Authentifizierung verwenden Sie `gateway.auth.token` (oder
`OPENCLAW_GATEWAY_TOKEN`).

Für ständig verfügbaren Fernzugriff siehe [Tailscale](/de/gateway/tailscale).

---

## Leistungsoptimierungen

### Eine USB-SSD verwenden (große Verbesserung)

SD-Karten sind langsam und verschleißen. Eine USB-SSD verbessert die Leistung erheblich:

```bash
# Prüfen, ob von USB gebootet wird
lsblk
```

Siehe [Pi-USB-Boot-Anleitung](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) für die Einrichtung.

### CLI-Start beschleunigen (Module Compile Cache)

Auf leistungsschwächeren Pi-Hosts können Sie den Module Compile Cache von Node aktivieren, damit wiederholte CLI-Ausführungen schneller sind:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Hinweise:

- `NODE_COMPILE_CACHE` beschleunigt nachfolgende Ausführungen (`status`, `health`, `--help`).
- `/var/tmp` bleibt über Neustarts hinweg eher erhalten als `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` vermeidet zusätzliche Startkosten durch den CLI-Selbst-Neustart.
- Der erste Lauf wärmt den Cache auf; spätere Läufe profitieren am meisten.

### systemd-Startoptimierung (optional)

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

Speichern Sie OpenClaw-Status und -Cache nach Möglichkeit auf SSD-basiertem Speicher, um Random-I/O-
Engpässe von SD-Karten bei Kaltstarts zu vermeiden.

Wenn dies ein Headless-Pi ist, aktivieren Sie `linger` einmalig, damit der User-Service ein
Logout überlebt:

```bash
sudo loginctl enable-linger "$(whoami)"
```

So helfen `Restart=`-Richtlinien bei der automatisierten Wiederherstellung:
[systemd kann die Dienstwiederherstellung automatisieren](https://www.redhat.com/en/blog/systemd-automate-recovery).

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

# Live-Überwachung
htop
```

---

## ARM-spezifische Hinweise

### Binärkompatibilität

Die meisten OpenClaw-Funktionen arbeiten auf ARM64, aber manche externen Binärdateien benötigen eventuell ARM-Builds:

| Tool               | ARM64-Status | Hinweise                            |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Funktioniert sehr gut               |
| WhatsApp (Baileys) | ✅           | Reines JS, keine Probleme           |
| Telegram           | ✅           | Reines JS, keine Probleme           |
| gog (Gmail CLI)    | ⚠️           | Auf ARM-Release prüfen              |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Wenn ein Skill fehlschlägt, prüfen Sie, ob seine Binärdatei einen ARM-Build hat. Viele Go-/Rust-Tools haben einen, manche nicht.

### 32-Bit vs. 64-Bit

**Verwenden Sie immer ein 64-Bit-Betriebssystem.** Node.js und viele moderne Tools setzen es voraus. Prüfen Sie das mit:

```bash
uname -m
# Sollte anzeigen: aarch64 (64-Bit) und nicht armv7l (32-Bit)
```

---

## Empfohlenes Modell-Setup

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

**Versuchen Sie nicht, lokale LLMs auf einem Pi auszuführen** — selbst kleine Modelle sind zu langsam. Lassen Sie Claude/GPT die Schwerstarbeit übernehmen.

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

### Speicherfehler (OOM)

```bash
# Speicher prüfen
free -h

# Mehr Swap hinzufügen (siehe Schritt 5)
# Oder die auf dem Pi laufenden Dienste reduzieren
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
cd ~/openclaw  # falls die hackbare Installation verwendet wird
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM-Binärprobleme

Wenn ein Skill mit „exec format error“ fehlschlägt:

1. Prüfen Sie, ob die Binärdatei einen ARM64-Build hat.
2. Versuchen Sie, sie aus dem Quellcode zu bauen.
3. Oder verwenden Sie einen Docker-Container mit ARM-Unterstützung.

### WiFi-Aussetzer

Für Headless-Pis mit WiFi:

```bash
# WiFi-Energiesparmodus deaktivieren
sudo iwconfig wlan0 power off

# Dauerhaft machen
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Kostenvergleich

| Setup          | Einmalige Kosten | Monatliche Kosten | Hinweise                  |
| -------------- | ---------------- | ----------------- | ------------------------- |
| **Pi 4 (2GB)** | ~$45             | $0                | + Strom (~$5/Jahr)        |
| **Pi 4 (4GB)** | ~$55             | $0                | Empfohlen                 |
| **Pi 5 (4GB)** | ~$60             | $0                | Beste Leistung            |
| **Pi 5 (8GB)** | ~$80             | $0                | Übertrieben, aber zukunftssicher |
| DigitalOcean   | $0               | $6/Monat          | $72/Jahr                  |
| Hetzner        | $0               | €3,79/Monat       | ~$50/Jahr                 |

**Break-even:** Ein Pi amortisiert sich gegenüber einem Cloud-VPS in etwa 6 bis 12 Monaten.

---

## Siehe auch

- [Linux-Anleitung](/de/platforms/linux) — allgemeine Linux-Einrichtung
- [DigitalOcean-Anleitung](/de/install/digitalocean) — Cloud-Alternative
- [Hetzner-Anleitung](/de/install/hetzner) — Docker-Setup
- [Tailscale](/de/gateway/tailscale) — Fernzugriff
- [Knoten](/de/nodes) — koppeln Sie Ihren Laptop/Ihr Telefon mit dem Pi-Gateway
