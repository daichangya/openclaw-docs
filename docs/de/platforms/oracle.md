---
read_when:
    - OpenClaw auf Oracle Cloud einrichten
    - Nach kostengünstigem VPS-Hosting für OpenClaw suchen
    - Sie möchten OpenClaw 24/7 auf einem kleinen Server betreiben
summary: OpenClaw auf Oracle Cloud (Always Free ARM)
title: Oracle Cloud (Plattform)
x-i18n:
    generated_at: "2026-04-24T06:48:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw auf Oracle Cloud (OCI)

## Ziel

Ein dauerhaftes OpenClaw Gateway auf der **Always Free**-ARM-Stufe von Oracle Cloud ausführen.

Die Free Tier von Oracle kann sehr gut zu OpenClaw passen (besonders wenn Sie bereits ein OCI-Konto haben), bringt aber Kompromisse mit sich:

- ARM-Architektur (das meiste funktioniert, aber einige Binärdateien können nur für x86 verfügbar sein)
- Kapazität und Registrierung können heikel sein

## Kostenvergleich (2026)

| Anbieter     | Tarif            | Spezifikationen          | Preis/Monat | Hinweise                |
| ------------ | ---------------- | ------------------------ | ----------- | ----------------------- |
| Oracle Cloud | Always Free ARM  | bis zu 4 OCPU, 24GB RAM  | $0          | ARM, begrenzte Kapazität |
| Hetzner      | CX22             | 2 vCPU, 4GB RAM          | ~ $4        | Günstigste kostenpflichtige Option |
| DigitalOcean | Basic            | 1 vCPU, 1GB RAM          | $6          | Einfache UI, gute Doku  |
| Vultr        | Cloud Compute    | 1 vCPU, 1GB RAM          | $6          | Viele Standorte         |
| Linode       | Nanode           | 1 vCPU, 1GB RAM          | $5          | Jetzt Teil von Akamai   |

---

## Voraussetzungen

- Oracle-Cloud-Konto ([Registrierung](https://www.oracle.com/cloud/free/)) — siehe [Community-Anleitung zur Registrierung](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), falls Probleme auftreten
- Tailscale-Konto (kostenlos unter [tailscale.com](https://tailscale.com))
- ~30 Minuten

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

**Tipp:** Wenn das Erstellen der Instanz mit „Out of capacity“ fehlschlägt, versuchen Sie eine andere Availability Domain oder versuchen Sie es später erneut. Die Kapazität der Free Tier ist begrenzt.

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
# Hostname setzen
sudo hostnamectl set-hostname openclaw

# Passwort für Benutzer ubuntu setzen
sudo passwd ubuntu

# Lingering aktivieren (hält Benutzerdienste nach Logout am Laufen)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscale installieren

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Dies aktiviert Tailscale SSH, sodass Sie sich von jedem Gerät in Ihrem Tailnet per `ssh openclaw` verbinden können — keine öffentliche IP erforderlich.

Verifizieren:

```bash
tailscale status
```

**Ab jetzt per Tailscale verbinden:** `ssh ubuntu@openclaw` (oder die Tailscale-IP verwenden).

## 5) OpenClaw installieren

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Wenn Sie gefragt werden „How do you want to hatch your bot?“, wählen Sie **„Do this later“**.

> Hinweis: Wenn Sie auf ARM-native Build-Probleme stoßen, beginnen Sie mit Systempaketen (z. B. `sudo apt install -y build-essential`), bevor Sie zu Homebrew greifen.

## 6) Gateway konfigurieren (Loopback + Token-Auth) und Tailscale Serve aktivieren

Verwenden Sie Token-Authentifizierung als Standard. Sie ist vorhersehbar und vermeidet „insecure auth“-Flags für die Control UI.

```bash
# Gateway auf der VM privat halten
openclaw config set gateway.bind loopback

# Auth für Gateway + Control UI verlangen
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Über Tailscale Serve exponieren (HTTPS + Tailnet-Zugriff)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` ist hier nur für die lokale weitergeleitete IP-/Local-Client-Behandlung des Tailscale-Serve-Proxys gedacht. Es ist **nicht** `gateway.auth.mode: "trusted-proxy"`. Viewer-Routen für Diffs behalten in diesem Setup ihr fail-closed-Verhalten: rohe `127.0.0.1`-Viewer-Anfragen ohne weitergeleitete Proxy-Header können `Diff not found` zurückgeben. Verwenden Sie `mode=file` / `mode=both` für Anhänge oder aktivieren Sie bewusst Remote-Viewer und setzen Sie `plugins.entries.diffs.config.viewerBaseUrl` (oder übergeben Sie ein Proxy-`baseUrl`), wenn Sie teilbare Viewer-Links benötigen.

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

Sobald alles funktioniert, sichern Sie das VCN ab, sodass außer Tailscale sämtlicher Verkehr blockiert wird. Das Virtual Cloud Network von OCI fungiert als Firewall am Rand des Netzwerks — Verkehr wird blockiert, bevor er Ihre Instanz erreicht.

1. Gehen Sie in der OCI Console zu **Networking → Virtual Cloud Networks**
2. Klicken Sie auf Ihr VCN → **Security Lists** → Default Security List
3. **Entfernen** Sie alle Ingress-Regeln außer:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Behalten Sie die Standard-Egress-Regeln bei (allen ausgehenden Verkehr erlauben)

Dadurch werden SSH auf Port 22, HTTP, HTTPS und alles andere am Netzwerkrand blockiert. Ab jetzt können Sie sich nur noch über Tailscale verbinden.

---

## Zugriff auf die Control UI

Von jedem Gerät in Ihrem Tailscale-Netzwerk:

```
https://openclaw.<tailnet-name>.ts.net/
```

Ersetzen Sie `<tailnet-name>` durch Ihren Tailnet-Namen (sichtbar in `tailscale status`).

Es ist kein SSH-Tunnel erforderlich. Tailscale bietet:

- HTTPS-Verschlüsselung (automatische Zertifikate)
- Authentifizierung über Ihre Tailscale-Identität
- Zugriff von jedem Gerät in Ihrem Tailnet (Laptop, Telefon usw.)

---

## Sicherheit: VCN + Tailscale (empfohlene Basis)

Wenn das VCN abgesichert ist (nur UDP 41641 offen) und das Gateway an Loopback gebunden ist, erhalten Sie starke Defense-in-Depth: öffentlicher Verkehr wird am Netzwerkrand blockiert und administrativer Zugriff erfolgt über Ihr Tailnet.

Dieses Setup nimmt oft die _Notwendigkeit_ zusätzlicher hostbasierter Firewall-Regeln rein zum Stoppen weltweiter SSH-Bruteforce-Angriffe — Sie sollten das Betriebssystem aber dennoch aktuell halten, `openclaw security audit` ausführen und prüfen, dass Sie nicht versehentlich auf öffentlichen Interfaces lauschen.

### Bereits geschützt

| Traditioneller Schritt | Erforderlich? | Warum                                                                        |
| ---------------------- | ------------- | ---------------------------------------------------------------------------- |
| UFW-Firewall           | Nein          | VCN blockiert, bevor Verkehr die Instanz erreicht                            |
| fail2ban               | Nein          | Kein Bruteforce, wenn Port 22 im VCN blockiert ist                           |
| sshd-Härtung           | Nein          | Tailscale SSH verwendet nicht sshd                                           |
| Root-Login deaktivieren | Nein         | Tailscale verwendet Tailscale-Identität, nicht Systembenutzer                |
| Nur SSH-Key-Authentifizierung | Nein    | Tailscale authentifiziert über Ihr Tailnet                                   |
| IPv6-Härtung           | Normalerweise nicht | Hängt von Ihren VCN-/Subnetz-Einstellungen ab; prüfen Sie, was tatsächlich zugewiesen/offen ist |

### Weiterhin empfohlen

- **Berechtigungen für Credentials:** `chmod 700 ~/.openclaw`
- **Sicherheitsaudit:** `openclaw security audit`
- **Systemupdates:** regelmäßig `sudo apt update && sudo apt upgrade`
- **Tailscale überwachen:** Geräte in der [Tailscale-Admin-Konsole](https://login.tailscale.com/admin) prüfen

### Sicherheitsstatus verifizieren

```bash
# Bestätigen, dass keine öffentlichen Ports lauschen
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verifizieren, dass Tailscale SSH aktiv ist
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: sshd vollständig deaktivieren
sudo systemctl disable --now ssh
```

---

## Fallback: SSH-Tunnel

Wenn Tailscale Serve nicht funktioniert, verwenden Sie einen SSH-Tunnel:

```bash
# Von Ihrem lokalen Rechner (über Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Öffnen Sie dann `http://localhost:18789`.

---

## Fehlerbehebung

### Erstellung der Instanz schlägt fehl ("Out of capacity")

ARM-Instanzen der Free Tier sind beliebt. Versuchen Sie:

- Eine andere Availability Domain
- Einen erneuten Versuch außerhalb der Stoßzeiten (früher Morgen)
- Verwenden Sie beim Auswählen der Shape den Filter „Always Free“

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

### Control UI nicht erreichbar

```bash
# Verifizieren, dass Tailscale Serve läuft
tailscale serve status

# Prüfen, ob das Gateway lauscht
curl http://localhost:18789

# Bei Bedarf neu starten
systemctl --user restart openclaw-gateway.service
```

### Probleme mit ARM-Binärdateien

Einige Tools haben möglicherweise keine ARM-Builds. Prüfen Sie:

```bash
uname -m  # Sollte aarch64 anzeigen
```

Die meisten npm-Pakete funktionieren problemlos. Suchen Sie bei Binärdateien nach Releases für `linux-arm64` oder `aarch64`.

---

## Persistenz

Der gesamte Status liegt in:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` pro Agent, Kanal-/Provider-Status und Sitzungsdaten
- `~/.openclaw/workspace/` — Workspace (SOUL.md, Memory, Artefakte)

Regelmäßig sichern:

```bash
openclaw backup create
```

---

## Verwandt

- [Remote-Zugriff auf das Gateway](/de/gateway/remote) — weitere Muster für Remote-Zugriff
- [Tailscale-Integration](/de/gateway/tailscale) — vollständige Tailscale-Dokumentation
- [Gateway-Konfiguration](/de/gateway/configuration) — alle Konfigurationsoptionen
- [DigitalOcean-Leitfaden](/de/install/digitalocean) — wenn Sie kostenpflichtig + einfachere Registrierung möchten
- [Hetzner-Leitfaden](/de/install/hetzner) — Docker-basierte Alternative
