---
read_when:
    - Einrichten von OpenClaw auf DigitalOcean
    - Suchen nach günstigem VPS-Hosting für OpenClaw
summary: OpenClaw auf DigitalOcean (einfache kostenpflichtige VPS-Option)
title: DigitalOcean (Plattform)
x-i18n:
    generated_at: "2026-04-24T06:46:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw auf DigitalOcean

## Ziel

Ein persistentes OpenClaw-Gateway auf DigitalOcean für **6 $/Monat** ausführen (oder 4 $/Monat mit reservierter Preisgestaltung).

Wenn Sie eine Option für 0 $/Monat möchten und ARM + provider-spezifische Einrichtung nicht stören, siehe den [Oracle-Cloud-Leitfaden](/de/install/oracle).

## Kostenvergleich (2026)

| Provider     | Plan            | Spezifikationen         | Preis/Monat | Hinweise                              |
| ------------ | --------------- | ----------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | bis zu 4 OCPU, 24 GB RAM | $0         | ARM, begrenzte Kapazität / knifflige Anmeldung |
| Hetzner      | CX22            | 2 vCPU, 4 GB RAM        | €3.79 (~$4) | Günstigste kostenpflichtige Option    |
| DigitalOcean | Basic           | 1 vCPU, 1 GB RAM        | $6          | Einfache UI, gute Dokumentation       |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB RAM        | $6          | Viele Standorte                       |
| Linode       | Nanode          | 1 vCPU, 1 GB RAM        | $5          | Jetzt Teil von Akamai                 |

**Wahl eines Providers:**

- DigitalOcean: einfachste UX + vorhersehbares Setup (dieser Leitfaden)
- Hetzner: gutes Preis-/Leistungsverhältnis (siehe [Hetzner-Leitfaden](/de/install/hetzner))
- Oracle Cloud: kann 0 $/Monat kosten, ist aber wählerischer und nur ARM (siehe [Oracle-Leitfaden](/de/install/oracle))

---

## Voraussetzungen

- DigitalOcean-Konto ([Anmeldung mit 200 $ Startguthaben](https://m.do.co/c/signup))
- SSH-Schlüsselpaar (oder Bereitschaft zur Verwendung von Passwort-Auth)
- ~20 Minuten

## 1) Ein Droplet erstellen

<Warning>
Verwenden Sie ein sauberes Basis-Image (Ubuntu 24.04 LTS). Vermeiden Sie One-Click-Images von Drittanbietern aus dem Marketplace, es sei denn, Sie haben deren Startskripte und Firewall-Standardwerte geprüft.
</Warning>

1. Melden Sie sich bei [DigitalOcean](https://cloud.digitalocean.com/) an
2. Klicken Sie auf **Create → Droplets**
3. Wählen Sie:
   - **Region:** die Ihnen (oder Ihren Benutzern) nächstgelegene
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **6 $/Monat** (1 vCPU, 1 GB RAM, 25 GB SSD)
   - **Authentication:** SSH key (empfohlen) oder Passwort
4. Klicken Sie auf **Create Droplet**
5. Notieren Sie sich die IP-Adresse

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

- Modell-Auth (API-Keys oder OAuth)
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

- Serve hält das Gateway nur auf loopback und authentifiziert Datenverkehr von Control UI/WebSocket über Tailscale-Identitäts-Header (tokenlose Auth setzt einen vertrauenswürdigen Gateway-Host voraus; HTTP-APIs verwenden diese Tailscale-Header nicht und folgen stattdessen dem normalen HTTP-Auth-Modus des Gateway).
- Um stattdessen explizite Credentials mit gemeinsamem Secret zu erzwingen, setzen Sie `gateway.auth.allowTailscale: false` und verwenden `gateway.auth.mode: "token"` oder `"password"`.

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

Siehe [Kanäle](/de/channels) für weitere Provider.

---

## Optimierungen für 1 GB RAM

Das Droplet für 6 $ hat nur 1 GB RAM. Damit alles flüssig läuft:

### Swap hinzufügen (empfohlen)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Ein leichteres Modell verwenden

Wenn Sie auf OOMs stoßen, überlegen Sie:

- API-basierte Modelle (Claude, GPT) statt lokaler Modelle zu verwenden
- `agents.defaults.model.primary` auf ein kleineres Modell zu setzen

### Speicher überwachen

```bash
free -h
htop
```

---

## Persistenz

Der gesamte Zustand liegt in:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` pro Agent, Kanal-/Provider-Zustand und Sitzungsdaten
- `~/.openclaw/workspace/` — Workspace (SOUL.md, Memory usw.)

Diese Daten überstehen Neustarts. Sichern Sie sie regelmäßig:

```bash
openclaw backup create
```

---

## Oracle Cloud Free als Alternative

Oracle Cloud bietet **Always Free**-ARM-Instanzen, die deutlich leistungsfähiger sind als jede kostenpflichtige Option hier — für 0 $/Monat.

| Was Sie bekommen  | Spezifikationen         |
| ----------------- | ----------------------- |
| **4 OCPUs**       | ARM Ampere A1           |
| **24 GB RAM**     | Mehr als ausreichend    |
| **200 GB Speicher** | Block-Volume          |
| **Für immer kostenlos** | Keine Kreditkartengebühren |

**Einschränkungen:**

- Die Anmeldung kann knifflig sein (erneut versuchen, wenn sie fehlschlägt)
- ARM-Architektur — die meisten Dinge funktionieren, aber manche Binärdateien benötigen ARM-Builds

Den vollständigen Einrichtungsleitfaden finden Sie unter [Oracle Cloud](/de/install/oracle). Für Tipps zur Anmeldung und Fehlerbehebung beim Registrierungsprozess siehe diesen [Community-Leitfaden](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

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

### Zu wenig Speicher

```bash
# Speicher prüfen
free -h

# Mehr Swap hinzufügen
# Oder auf ein Droplet für 12 $/Monat (2 GB RAM) upgraden
```

---

## Verwandt

- [Hetzner-Leitfaden](/de/install/hetzner) — günstiger, leistungsfähiger
- [Docker-Installation](/de/install/docker) — containerisiertes Setup
- [Tailscale](/de/gateway/tailscale) — sicherer Remote-Zugriff
- [Konfiguration](/de/gateway/configuration) — vollständige Konfigurationsreferenz
