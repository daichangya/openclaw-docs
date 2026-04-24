---
read_when:
    - Remote-Gateway-Setups ausführen oder Fehler beheben
summary: Remote-Zugriff mit SSH-Tunneln (Gateway WS) und Tailnets
title: Remote-Zugriff
x-i18n:
    generated_at: "2026-04-24T06:39:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3753f29d6b3cc3f1a2f749cc0fdfdd60dfde8822f0ec6db0e18e5412de0980da
    source_path: gateway/remote.md
    workflow: 15
---

# Remote-Zugriff (SSH, Tunnel und Tailnets)

Dieses Repo unterstützt „remote over SSH“, indem ein einzelnes Gateway (der Master) auf einem dedizierten Host (Desktop/Server) ausgeführt wird und Clients sich damit verbinden.

- Für **Operatoren (Sie / die macOS-App)**: SSH-Tunneling ist der universelle Fallback.
- Für **Nodes (iOS/Android und zukünftige Geräte)**: Verbindung mit dem Gateway-**WebSocket** (LAN/Tailnet oder bei Bedarf per SSH-Tunnel).

## Die Kernidee

- Der Gateway-WebSocket bindet an **loopback** auf Ihrem konfigurierten Port (standardmäßig `18789`).
- Für Remote-Nutzung leiten Sie diesen Loopback-Port über SSH weiter (oder verwenden ein Tailnet/VPN und benötigen weniger Tunnel).

## Häufige VPN-/Tailnet-Setups (wo der Agent lebt)

Betrachten Sie den **Gateway-Host** als den Ort, „an dem der Agent lebt“. Er besitzt Sitzungen, Auth-Profile, Kanäle und Zustand.
Ihr Laptop/Desktop (und Nodes) verbinden sich mit diesem Host.

### 1) Immer aktives Gateway in Ihrem Tailnet (VPS oder Heimserver)

Führen Sie das Gateway auf einem persistenten Host aus und greifen Sie über **Tailscale** oder SSH darauf zu.

- **Beste UX:** Behalten Sie `gateway.bind: "loopback"` bei und verwenden Sie **Tailscale Serve** für die Control UI.
- **Fallback:** Behalten Sie Loopback + SSH-Tunnel von jedem Rechner, der Zugriff benötigt.
- **Beispiele:** [exe.dev](/de/install/exe-dev) (einfache VM) oder [Hetzner](/de/install/hetzner) (Produktions-VPS).

Das ist ideal, wenn Ihr Laptop oft in den Ruhezustand geht, Sie den Agenten aber permanent aktiv haben möchten.

### 2) Heim-Desktop führt das Gateway aus, Laptop ist die Fernsteuerung

Der Laptop führt den Agenten **nicht** aus. Er verbindet sich remote:

- Verwenden Sie den Modus **Remote over SSH** der macOS-App (Einstellungen → Allgemein → „OpenClaw runs“).
- Die App öffnet und verwaltet den Tunnel, sodass WebChat + Health Checks „einfach funktionieren“.

Runbook: [macOS remote access](/de/platforms/mac/remote).

### 3) Laptop führt das Gateway aus, Remote-Zugriff von anderen Rechnern

Behalten Sie das Gateway lokal, aber exponieren Sie es sicher:

- SSH-Tunnel zum Laptop von anderen Rechnern aus, oder
- Tailscale Serve für die Control UI und das Gateway nur auf Loopback halten.

Anleitung: [Tailscale](/de/gateway/tailscale) und [Web overview](/de/web).

## Befehlsfluss (was wo läuft)

Ein Gateway-Dienst besitzt Zustand + Kanäle. Nodes sind Peripheriegeräte.

Beispielablauf (Telegram → Node):

- Eine Telegram-Nachricht trifft beim **Gateway** ein.
- Das Gateway führt den **Agenten** aus und entscheidet, ob ein Node-Tool aufgerufen werden soll.
- Das Gateway ruft die **Node** über den Gateway-WebSocket auf (`node.*` RPC).
- Die Node liefert das Ergebnis zurück; das Gateway antwortet nach Telegram.

Hinweise:

- **Nodes führen den Gateway-Dienst nicht aus.** Pro Host sollte nur ein Gateway laufen, sofern Sie nicht absichtlich isolierte Profile ausführen (siehe [Multiple gateways](/de/gateway/multiple-gateways)).
- Der „Node-Modus“ der macOS-App ist nur ein Node-Client über den Gateway-WebSocket.

## SSH-Tunnel (CLI + Tools)

Erstellen Sie einen lokalen Tunnel zum entfernten Gateway-WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Wenn der Tunnel aktiv ist:

- `openclaw health` und `openclaw status --deep` erreichen jetzt das entfernte Gateway über `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` können bei Bedarf ebenfalls die weitergeleitete URL über `--url` ansprechen.

Hinweis: Ersetzen Sie `18789` durch Ihren konfigurierten `gateway.port` (oder `--port`/`OPENCLAW_GATEWAY_PORT`).
Hinweis: Wenn Sie `--url` übergeben, greift die CLI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück.
Geben Sie `--token` oder `--password` ausdrücklich an. Fehlende explizite Anmeldedaten führen zu einem Fehler.

## CLI-Remote-Standards

Sie können ein Remote-Ziel persistent speichern, sodass CLI-Befehle es standardmäßig verwenden:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Wenn das Gateway nur auf Loopback gebunden ist, belassen Sie die URL auf `ws://127.0.0.1:18789` und öffnen Sie zuerst den SSH-Tunnel.

## Vorrangfolge bei Anmeldedaten

Die Auflösung der Gateway-Anmeldedaten folgt einem gemeinsamen Vertrag über Call-/Probe-/Status-Pfade und Discord-Exec-Approval-Monitoring hinweg. Node-Host verwendet denselben Basisvertrag mit einer Ausnahme im lokalen Modus (es ignoriert absichtlich `gateway.remote.*`):

- Explizite Anmeldedaten (`--token`, `--password` oder Tool `gatewayToken`) haben auf Call-Pfaden, die explizite Authentifizierung akzeptieren, immer Vorrang.
- Sicherheit bei URL-Überschreibungen:
  - CLI-URL-Überschreibungen (`--url`) verwenden niemals implizite Anmeldedaten aus Konfiguration/Umgebung erneut.
  - URL-Überschreibungen per Umgebung (`OPENCLAW_GATEWAY_URL`) dürfen nur Umgebungs-Anmeldedaten verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standardwerte im lokalen Modus:
  - Token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (Remote-Fallback gilt nur, wenn lokaler Eingabewert für Auth-Token nicht gesetzt ist)
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (Remote-Fallback gilt nur, wenn lokaler Eingabewert für Auth-Passwort nicht gesetzt ist)
- Standardwerte im Remote-Modus:
  - Token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ausnahme für Node-Host im lokalen Modus: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Token-Prüfungen für Remote-Probe/Status sind standardmäßig strikt: Sie verwenden nur `gateway.remote.token` (kein lokaler Token-Fallback), wenn der Remote-Modus angesprochen wird.
- Überschreibungen von Gateway-Umgebungswerten verwenden nur `OPENCLAW_GATEWAY_*`.

## Chat-UI über SSH

WebChat verwendet keinen separaten HTTP-Port mehr. Die SwiftUI-Chat-UI verbindet sich direkt mit dem Gateway-WebSocket.

- Leiten Sie `18789` über SSH weiter (siehe oben) und verbinden Sie Clients dann mit `ws://127.0.0.1:18789`.
- Unter macOS bevorzugen Sie den Modus „Remote over SSH“ der App, der den Tunnel automatisch verwaltet.

## macOS-App „Remote over SSH“

Die Menüleisten-App für macOS kann dasselbe Setup Ende zu Ende steuern (Remote-Statusprüfungen, WebChat und Voice-Wake-Weiterleitung).

Runbook: [macOS remote access](/de/platforms/mac/remote).

## Sicherheitsregeln (Remote/VPN)

Kurzfassung: **Behalten Sie das Gateway nur auf Loopback**, es sei denn, Sie sind sicher, dass Sie eine Bindung benötigen.

- **Loopback + SSH/Tailscale Serve** ist der sicherste Standard (keine öffentliche Exponierung).
- Klartext-`ws://` ist standardmäßig nur für Loopback vorgesehen. Für vertrauenswürdige private Netzwerke
  setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` im Client-Prozess als Break-Glass.
- **Nicht-Loopback-Bindungen** (`lan`/`tailnet`/`custom` oder `auto`, wenn Loopback nicht verfügbar ist) müssen Gateway-Authentifizierung verwenden: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Anmeldedatenquellen des Clients. Sie konfigurieren den Server selbst **nicht**.
- Lokale Call-Pfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit per SecretRef konfiguriert, aber nicht aufgelöst sind, schlägt die Auflösung fail-closed fehl (kein Remote-Fallback zum Verdecken).
- `gateway.remote.tlsFingerprint` pinnt das entfernte TLS-Zertifikat bei Verwendung von `wss://`.
- **Tailscale Serve** kann Datenverkehr für Control UI/WebSocket über Identity-Header authentifizieren,
  wenn `gateway.auth.allowTailscale: true`; HTTP-API-Endpunkte verwenden diese
  Tailscale-Header-Authentifizierung nicht und folgen stattdessen dem normalen HTTP-
  Auth-Modus des Gateway. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Setzen Sie dies auf
  `false`, wenn Sie überall Shared-Secret-Authentifizierung möchten.
- Authentifizierung per **Trusted-Proxy** ist nur für identitätsbewusste Proxy-Setups mit Nicht-Loopback gedacht.
  Reverse-Proxys auf demselben Host mit Loopback erfüllen `gateway.auth.mode: "trusted-proxy"` nicht.
- Behandeln Sie Browsersteuerung wie Operatorzugriff: nur Tailnet + absichtliches Node Pairing.

Ausführliche Informationen: [Security](/de/gateway/security).

### macOS: Persistenter SSH-Tunnel über LaunchAgent

Für macOS-Clients, die sich mit einem entfernten Gateway verbinden, verwendet das einfachste persistente Setup einen SSH-Eintrag mit `LocalForward` in der Konfiguration plus einen LaunchAgent, um den Tunnel über Neustarts und Abstürze hinweg aktiv zu halten.

#### Schritt 1: SSH-Konfiguration hinzufügen

Bearbeiten Sie `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Ersetzen Sie `<REMOTE_IP>` und `<REMOTE_USER>` durch Ihre Werte.

#### Schritt 2: SSH-Schlüssel kopieren (einmalig)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Schritt 3: Gateway-Token konfigurieren

Speichern Sie das Token in der Konfiguration, damit es Neustarts überdauert:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Schritt 4: Den LaunchAgent erstellen

Speichern Sie dies als `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Schritt 5: Den LaunchAgent laden

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Der Tunnel startet automatisch beim Login, wird nach Abstürzen neu gestartet und hält den weitergeleiteten Port aktiv.

Hinweis: Wenn Sie einen verbliebenen LaunchAgent `com.openclaw.ssh-tunnel` aus einem älteren Setup haben, entladen und löschen Sie ihn.

#### Fehlerbehebung

Prüfen, ob der Tunnel läuft:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Den Tunnel neu starten:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Den Tunnel stoppen:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Konfigurationseintrag                | Was er bewirkt                                               |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Leitet den lokalen Port 18789 an den entfernten Port 18789 weiter |
| `ssh -N`                             | SSH ohne Ausführung entfernter Befehle (nur Portweiterleitung) |
| `KeepAlive`                          | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                          | Startet den Tunnel, wenn der LaunchAgent beim Login geladen wird |

## Verwandt

- [Tailscale](/de/gateway/tailscale)
- [Authentication](/de/gateway/authentication)
- [Remote gateway setup](/de/gateway/remote-gateway-readme)
