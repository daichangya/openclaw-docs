---
read_when:
    - OpenClaw auf Oracle Cloud einrichten
    - Nach kostengünstigem VPS-Hosting für OpenClaw suchen
    - OpenClaw rund um die Uhr auf einem kleinen Server nutzen wollen
summary: OpenClaw auf Oracle Cloud (Always Free ARM)
title: Oracle Cloud (Plattform)
x-i18n:
    generated_at: "2026-04-05T12:50:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw auf Oracle Cloud (OCI)

## Ziel

Ein persistentes OpenClaw-Gateway auf der **Always Free**-ARM-Stufe von Oracle Cloud ausführen.

Die kostenlose Stufe von Oracle kann sehr gut zu OpenClaw passen (insbesondere, wenn Sie bereits ein OCI-Konto haben), bringt aber einige Abwägungen mit sich:

- ARM-Architektur (die meisten Dinge funktionieren, aber einige Binärdateien könnten nur für x86 verfügbar sein)
- Kapazität und Registrierung können heikel sein

## Kostenvergleich (2026)

| Anbieter     | Tarif           | Spezifikationen        | Preis/Monat | Hinweise              |
| ------------ | --------------- | ---------------------- | ----------- | --------------------- |
| Oracle Cloud | Always Free ARM | bis zu 4 OCPU, 24 GB RAM | $0        | ARM, begrenzte Kapazität |
| Hetzner      | CX22            | 2 vCPU, 4 GB RAM       | ~ $4        | Günstigste kostenpflichtige Option |
| DigitalOcean | Basic           | 1 vCPU, 1 GB RAM       | $6          | Einfache UI, gute Dokumentation |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB RAM       | $6          | Viele Standorte       |
| Linode       | Nanode          | 1 vCPU, 1 GB RAM       | $5          | Jetzt Teil von Akamai |

---

## Voraussetzungen

- Oracle-Cloud-Konto ([Registrierung](https://www.oracle.com/cloud/free/)) — siehe den [Community-Leitfaden zur Registrierung](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), falls Probleme auftreten
- Tailscale-Konto (kostenlos auf [tailscale.com](https://tailscale.com))
- ca. 30 Minuten

## 1) Eine OCI-Instanz erstellen

1. Melden Sie sich bei der [Oracle Cloud Console](https://cloud.oracle.com/) an
2. Navigieren Sie zu **Compute → Instances → Create Instance**
3. Konfigurieren Sie:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (oder bis zu 4)
   - **Memory:** 12 GB (oder bis zu 24 GB)
   - **Boot volume:** 50 GB (bis zu 200 GB kostenlos)
   - **SSH key:** Fügen Sie Ihren öffentlichen Schlüssel hinzu
4. Klicken Sie auf **Create**
5. Notieren Sie sich die öffentliche IP-Adresse

**Tipp:** Wenn die Erstellung der Instanz mit „Out of capacity“ fehlschlägt, versuchen Sie eine andere Availability Domain oder probieren Sie es später erneut. Die Kapazität der kostenlosen Stufe ist begrenzt.

## 2) Verbinden und aktualisieren

```bash
# Über öffentliche IP verbinden
ssh ubuntu@YOUR_PUBLIC_IP

# System aktualisieren
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Hinweis:** `build-essential` ist für die ARM-Kompilierung einiger Abhängigkeiten erforderlich.

## 3) Benutzer und Hostname konfigurieren

```bash
# Hostname festlegen
sudo hostnamectl set-hostname openclaw

# Passwort für den Benutzer ubuntu festlegen
sudo passwd ubuntu

# Lingering aktivieren (hält Benutzerdienste nach dem Abmelden aktiv)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscale installieren

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Dadurch wird Tailscale SSH aktiviert, sodass Sie sich von jedem Gerät in Ihrem Tailnet über `ssh openclaw` verbinden können — keine öffentliche IP erforderlich.

Prüfen:

```bash
tailscale status
```

**Ab jetzt über Tailscale verbinden:** `ssh ubuntu@openclaw` (oder die Tailscale-IP verwenden).

## 5) OpenClaw installieren

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Wenn die Frage „How do you want to hatch your bot?“ erscheint, wählen Sie **„Do this later“**.

> Hinweis: Wenn ARM-native Build-Probleme auftreten, beginnen Sie mit Systempaketen (z. B. `sudo apt install -y build-essential`), bevor Sie zu Homebrew greifen.

## 6) Gateway konfigurieren (local loopback + Token-Authentifizierung) und Tailscale Serve aktivieren

Verwenden Sie standardmäßig die Token-Authentifizierung. Sie ist vorhersehbar und vermeidet zusätzliche „insecure auth“-Flags in der Control UI.

```bash
# Gateway auf der VM privat halten
openclaw config set gateway.bind loopback

# Authentifizierung für Gateway + Control UI erzwingen
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Über Tailscale Serve bereitstellen (HTTPS + Tailnet-Zugriff)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` dient hier nur der Verarbeitung von weitergeleiteten IPs/lokalen Clients durch den lokalen Tailscale-Serve-Proxy. Es ist **nicht** `gateway.auth.mode: "trusted-proxy"`. Diff-Viewer-Routen behalten in dieser Konfiguration ihr Fail-Closed-Verhalten: Rohe `127.0.0.1`-Viewer-Anfragen ohne weitergeleitete Proxy-Header können `Diff not found` zurückgeben. Verwenden Sie `mode=file` / `mode=both` für Anhänge oder aktivieren Sie bewusst Remote-Viewer und setzen Sie `plugins.entries.diffs.config.viewerBaseUrl` (oder übergeben Sie eine Proxy-`baseUrl`), wenn Sie teilbare Viewer-Links benötigen.

## 7) Verifizieren

```bash
# Version prüfen
openclaw --version

# Daemon-Status prüfen
systemctl --user status openclaw-gateway.service

# Tailscale Serve prüfen
tailscale serve status

# Lokale Antwort testen
curl http://localhost:18789
```

## 8) VCN-Sicherheit absichern

Sobald alles funktioniert, sichern Sie das VCN ab, sodass sämtlicher Datenverkehr außer Tailscale blockiert wird. Das Virtual Cloud Network von OCI fungiert als Firewall am Netzwerkrand — Datenverkehr wird blockiert, bevor er Ihre Instanz erreicht.

1. Gehen Sie in der OCI Console zu **Networking → Virtual Cloud Networks**
2. Klicken Sie auf Ihr VCN → **Security Lists** → Default Security List
3. **Entfernen** Sie alle eingehenden Regeln außer:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Behalten Sie die Standardregeln für ausgehenden Datenverkehr bei (alle ausgehend erlauben)

Dadurch werden SSH auf Port 22, HTTP, HTTPS und alles andere bereits am Netzwerkrand blockiert. Ab jetzt können Sie sich nur noch über Tailscale verbinden.

---

## Auf die Control UI zugreifen

Von jedem Gerät in Ihrem Tailscale-Netzwerk:

```
https://openclaw.<tailnet-name>.ts.net/
```

Ersetzen Sie `<tailnet-name>` durch den Namen Ihres Tailnets (sichtbar in `tailscale status`).

Kein SSH-Tunnel erforderlich. Tailscale bietet:

- HTTPS-Verschlüsselung (automatische Zertifikate)
- Authentifizierung über die Tailscale-Identität
- Zugriff von jedem Gerät in Ihrem Tailnet (Laptop, Telefon usw.)

---

## Sicherheit: VCN + Tailscale (empfohlene Basis)

Mit einem abgesicherten VCN (nur UDP 41641 offen) und einem an loopback gebundenen Gateway erhalten Sie eine starke Defense-in-Depth-Strategie: Öffentlicher Datenverkehr wird am Netzwerkrand blockiert, und der Admin-Zugriff erfolgt über Ihr Tailnet.

Diese Konfiguration macht zusätzliche hostbasierte Firewall-Regeln, die nur Internet-weite SSH-Brute-Force-Angriffe verhindern sollen, oft _unnötig_ — dennoch sollten Sie das Betriebssystem aktuell halten, `openclaw security audit` ausführen und prüfen, dass Sie nicht versehentlich auf öffentlichen Schnittstellen lauschen.

### Bereits geschützt

| Traditioneller Schritt | Erforderlich? | Warum                                                                        |
| ---------------------- | ------------- | ---------------------------------------------------------------------------- |
| UFW-Firewall           | Nein          | VCN blockiert, bevor Datenverkehr die Instanz erreicht                       |
| fail2ban               | Nein          | Kein Brute Force, wenn Port 22 im VCN blockiert ist                          |
| sshd-Härtung           | Nein          | Tailscale SSH verwendet nicht `sshd`                                         |
| Root-Login deaktivieren | Nein         | Tailscale verwendet die Tailscale-Identität, nicht Systembenutzer            |
| Nur SSH-Schlüssel-Auth | Nein          | Tailscale authentifiziert über Ihr Tailnet                                   |
| IPv6-Härtung           | Meist nicht   | Hängt von Ihren VCN-/Subnetz-Einstellungen ab; prüfen Sie, was tatsächlich zugewiesen/offengelegt ist |

### Weiterhin empfohlen

- **Berechtigungen für Anmeldedaten:** `chmod 700 ~/.openclaw`
- **Sicherheitsaudit:** `openclaw security audit`
- **Systemaktualisierungen:** regelmäßig `sudo apt update && sudo apt upgrade`
- **Tailscale überwachen:** Geräte in der [Tailscale-Admin-Konsole](https://login.tailscale.com/admin) prüfen

### Sicherheitsstatus verifizieren

```bash
# Bestätigen, dass keine öffentlichen Ports lauschen
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Prüfen, dass Tailscale SSH aktiv ist
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: sshd vollständig deaktivieren
sudo systemctl disable --now ssh
```

---

## Fallback: SSH-Tunnel

Wenn Tailscale Serve nicht funktioniert, verwenden Sie einen SSH-Tunnel:

```bash
# Von Ihrem lokalen Rechner aus (über Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Öffnen Sie dann `http://localhost:18789`.

---

## Fehlerbehebung

### Erstellung der Instanz schlägt fehl („Out of capacity“)

Kostenlose ARM-Instanzen sind beliebt. Versuchen Sie:

- Eine andere Availability Domain
- Wiederholung außerhalb der Spitzenzeiten (früher Morgen)
- Den Filter „Always Free“ bei der Auswahl der Shape verwenden

### Tailscale verbindet sich nicht

```bash
# Status prüfen
sudo tailscale status

# Erneut authentifizieren
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway startet nicht

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Control UI ist nicht erreichbar

```bash
# Prüfen, ob Tailscale Serve läuft
tailscale serve status

# Prüfen, ob das Gateway lauscht
curl http://localhost:18789

# Bei Bedarf neu starten
systemctl --user restart openclaw-gateway.service
```

### ARM-Binärprobleme

Einige Tools haben möglicherweise keine ARM-Builds. Prüfen Sie:

```bash
uname -m  # Sollte aarch64 anzeigen
```

Die meisten npm-Pakete funktionieren problemlos. Suchen Sie bei Binärdateien nach Releases für `linux-arm64` oder `aarch64`.

---

## Persistenz

Der gesamte Status befindet sich in:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` pro Agent, Kanal-/Provider-Status und Sitzungsdaten
- `~/.openclaw/workspace/` — Arbeitsbereich (SOUL.md, Speicher, Artefakte)

Regelmäßig sichern:

```bash
openclaw backup create
```

---

## Siehe auch

- [Remote-Zugriff auf das Gateway](/de/gateway/remote) — andere Muster für den Remote-Zugriff
- [Tailscale-Integration](/de/gateway/tailscale) — vollständige Tailscale-Dokumentation
- [Gateway-Konfiguration](/de/gateway/configuration) — alle Konfigurationsoptionen
- [DigitalOcean-Leitfaden](/de/install/digitalocean) — falls Sie kostenpflichtig + einfachere Registrierung möchten
- [Hetzner-Leitfaden](/de/install/hetzner) — Docker-basierte Alternative
