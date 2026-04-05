---
read_when:
    - OpenClaw auf DigitalOcean einrichten
    - Nach günstigem VPS-Hosting für OpenClaw suchen
summary: OpenClaw auf DigitalOcean (einfache kostenpflichtige VPS-Option)
title: DigitalOcean (Plattform)
x-i18n:
    generated_at: "2026-04-05T12:48:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ee4ad84c421f87064534a4fb433df1f70304502921841ec618318ed862d4092
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw auf DigitalOcean

## Ziel

Ein persistentes OpenClaw-Gateway auf DigitalOcean für **6 $/Monat** ausführen (oder 4 $/Monat mit Reservierungspreisen).

Wenn Sie eine Option für 0 $/Monat möchten und ARM + providerspezifische Einrichtung nicht stören, siehe den [Oracle Cloud-Leitfaden](/platforms/oracle).

## Kostenvergleich (2026)

| Provider     | Tarif            | Spezifikationen         | Preis/Monat | Hinweise                              |
| ------------ | ---------------- | ----------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM  | bis zu 4 OCPU, 24GB RAM | $0          | ARM, begrenzte Kapazität / Eigenheiten bei der Anmeldung |
| Hetzner      | CX22             | 2 vCPU, 4GB RAM         | €3.79 (~$4) | Günstigste kostenpflichtige Option    |
| DigitalOcean | Basic            | 1 vCPU, 1GB RAM         | $6          | Einfache UI, gute Dokumentation       |
| Vultr        | Cloud Compute    | 1 vCPU, 1GB RAM         | $6          | Viele Standorte                       |
| Linode       | Nanode           | 1 vCPU, 1GB RAM         | $5          | Jetzt Teil von Akamai                 |

**Einen Provider auswählen:**

- DigitalOcean: einfachste UX + vorhersehbare Einrichtung (dieser Leitfaden)
- Hetzner: gutes Preis-/Leistungsverhältnis (siehe [Hetzner-Leitfaden](/install/hetzner))
- Oracle Cloud: kann 0 $/Monat kosten, ist aber empfindlicher und nur ARM (siehe [Oracle-Leitfaden](/platforms/oracle))

---

## Voraussetzungen

- DigitalOcean-Konto ([signup with $200 free credit](https://m.do.co/c/signup))
- SSH-Schlüsselpaar (oder Bereitschaft, Passwort-Auth zu verwenden)
- ~20 Minuten

## 1) Ein Droplet erstellen

<Warning>
Verwenden Sie ein sauberes Basis-Image (Ubuntu 24.04 LTS). Vermeiden Sie Marketplace-1-Click-Images von Drittanbietern, sofern Sie deren Startskripte und Firewall-Standardeinstellungen nicht geprüft haben.
</Warning>

1. Bei [DigitalOcean](https://cloud.digitalocean.com/) anmelden
2. Auf **Create → Droplets** klicken
3. Wählen Sie:
   - **Region:** am nächsten bei Ihnen (oder Ihren Benutzern)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **6 $/Monat** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** SSH-Schlüssel (empfohlen) oder Passwort
4. Auf **Create Droplet** klicken
5. Die IP-Adresse notieren

## 2) Per SSH verbinden

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClaw installieren

```bash
# System aktualisieren
apt update && apt upgrade -y

# Node.js 24 installieren
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# OpenClaw installieren
curl -fsSL https://openclaw.ai/install.sh | bash

# Prüfen
openclaw --version
```

## 4) Onboarding ausführen

```bash
openclaw onboard --install-daemon
```

Der Assistent führt Sie durch:

- Modell-Auth (API-Schlüssel oder OAuth)
- Kanaleinrichtung (Telegram, WhatsApp, Discord usw.)
- Gateway-Token (automatisch generiert)
- Daemon-Installation (systemd)

## 5) Das Gateway prüfen

```bash
# Status prüfen
openclaw status

# Dienst prüfen
systemctl --user status openclaw-gateway.service

# Logs anzeigen
journalctl --user -u openclaw-gateway.service -f
```

## 6) Auf das Dashboard zugreifen

Das Gateway bindet standardmäßig an loopback. Um auf die Control UI zuzugreifen:

**Option A: SSH-Tunnel (empfohlen)**

```bash
# Von Ihrem lokalen Rechner
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Dann öffnen: http://localhost:18789
```

**Option B: Tailscale Serve (HTTPS, nur loopback)**

```bash
# Auf dem Droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Gateway für Tailscale Serve konfigurieren
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Öffnen: `https://<magicdns>/`

Hinweise:

- Serve hält das Gateway auf loopback-only und authentifiziert Datenverkehr für Control UI/WebSocket über Tailscale-Identitäts-Header (tokenlose Auth setzt einen vertrauenswürdigen Gateway-Host voraus; HTTP-APIs verwenden diese Tailscale-Header nicht und folgen stattdessen dem normalen HTTP-Auth-Modus des Gateways).
- Um stattdessen explizite Shared-Secret-Anmeldedaten zu verlangen, setzen Sie `gateway.auth.allowTailscale: false` und verwenden Sie `gateway.auth.mode: "token"` oder `"password"`.

**Option C: Tailnet-Bind (ohne Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Öffnen: `http://<tailscale-ip>:18789` (Token erforderlich).

## 7) Ihre Kanäle verbinden

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# QR-Code scannen
```

Siehe [Channels](/channels) für andere Provider.

---

## Optimierungen für 1GB RAM

Das 6-$-Droplet hat nur 1GB RAM. Damit alles reibungslos läuft:

### Swap hinzufügen (empfohlen)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Ein leichteres Modell verwenden

Wenn OOMs auftreten, ziehen Sie Folgendes in Betracht:

- API-basierte Modelle (Claude, GPT) statt lokaler Modelle verwenden
- `agents.defaults.model.primary` auf ein kleineres Modell setzen

### Speicher überwachen

```bash
free -h
htop
```

---

## Persistenz

Der gesamte Status liegt in:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` pro Agent, Kanal-/Provider-Status und Sitzungsdaten
- `~/.openclaw/workspace/` — Workspace (SOUL.md, Memory usw.)

Diese überstehen Neustarts. Sichern Sie sie regelmäßig:

```bash
openclaw backup create
```

---

## Oracle Cloud als kostenlose Alternative

Oracle Cloud bietet **Always Free**-ARM-Instanzen, die deutlich leistungsfähiger sind als jede kostenpflichtige Option hier — für 0 $/Monat.

| Was Sie erhalten   | Spezifikationen       |
| ------------------ | --------------------- |
| **4 OCPUs**        | ARM Ampere A1         |
| **24GB RAM**       | Mehr als ausreichend  |
| **200GB storage**  | Block Volume          |
| **Forever free**   | Keine Kreditkartenbelastung |

**Einschränkungen:**

- Die Anmeldung kann empfindlich sein (bei Fehlschlag erneut versuchen)
- ARM-Architektur — die meisten Dinge funktionieren, aber einige Binärdateien benötigen ARM-Builds

Den vollständigen Einrichtungsleitfaden finden Sie unter [Oracle Cloud](/platforms/oracle). Tipps zur Anmeldung und Fehlerbehebung beim Registrierungsprozess finden Sie in diesem [Community-Leitfaden](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Fehlerbehebung

### Gateway startet nicht

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Port wird bereits verwendet

```bash
lsof -i :18789
kill <PID>
```

### Nicht genug Speicher

```bash
# Speicher prüfen
free -h

# Mehr Swap hinzufügen
# Oder auf ein Droplet für 12 $/Monat (2GB RAM) upgraden
```

---

## Siehe auch

- [Hetzner guide](/install/hetzner) — günstiger, leistungsstärker
- [Docker install](/install/docker) — containerisiertes Setup
- [Tailscale](/gateway/tailscale) — sicherer Fernzugriff
- [Configuration](/gateway/configuration) — vollständige Konfigurationsreferenz
