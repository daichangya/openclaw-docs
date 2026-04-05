---
read_when:
    - Sie Remote-Gateway-Setups ausführen oder Fehler darin beheben
summary: Remote-Zugriff über SSH-Tunnel (Gateway WS) und Tailnets
title: Remote Access
x-i18n:
    generated_at: "2026-04-05T12:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8596fa2a7fd44117dfe92b70c9d8f28c0e16d7987adf0d0769a9eff71d5bc081
    source_path: gateway/remote.md
    workflow: 15
---

# Remote-Zugriff (SSH, Tunnel und Tailnets)

Dieses Repository unterstützt „remote über SSH“, indem ein einzelnes Gateway (das Master-Gateway) auf einem dedizierten Host (Desktop/Server) läuft und Clients damit verbunden werden.

- Für **Operatoren (Sie / die macOS-App)**: SSH-Tunneling ist der universelle Fallback.
- Für **Nodes (iOS/Android und zukünftige Geräte)**: Verbindung zum Gateway-**WebSocket** herstellen (LAN/Tailnet oder bei Bedarf SSH-Tunnel).

## Die Grundidee

- Das Gateway WebSocket bindet auf **Loopback** an Ihren konfigurierten Port (standardmäßig 18789).
- Für die Remote-Nutzung leiten Sie diesen Loopback-Port über SSH weiter (oder verwenden ein Tailnet/VPN und benötigen weniger Tunneling).

## Gängige VPN-/Tailnet-Setups (wo der Agent lebt)

Betrachten Sie den **Gateway-Host** als den Ort, „an dem der Agent lebt“. Er besitzt Sitzungen, Auth-Profile, Kanäle und Status.
Ihr Laptop/Desktop (und Nodes) verbinden sich mit diesem Host.

### 1) Immer aktives Gateway in Ihrem Tailnet (VPS oder Heimserver)

Führen Sie das Gateway auf einem persistenten Host aus und greifen Sie über **Tailscale** oder SSH darauf zu.

- **Beste UX:** `gateway.bind: "loopback"` beibehalten und **Tailscale Serve** für die Control UI verwenden.
- **Fallback:** Loopback beibehalten + SSH-Tunnel von jeder Maschine, die Zugriff benötigt.
- **Beispiele:** [exe.dev](/install/exe-dev) (einfache VM) oder [Hetzner](/install/hetzner) (VPS für Produktion).

Das ist ideal, wenn Ihr Laptop oft schläft, Sie den Agenten aber immer aktiv haben möchten.

### 2) Heim-Desktop führt das Gateway aus, Laptop ist die Remote-Steuerung

Der Laptop führt den Agenten **nicht** aus. Er verbindet sich remote:

- Verwenden Sie den Modus **Remote over SSH** der macOS-App (Einstellungen → Allgemein → „OpenClaw runs“).
- Die App öffnet und verwaltet den Tunnel, sodass WebChat + Integritätsprüfungen „einfach funktionieren“.

Ablauf: [macOS remote access](/platforms/mac/remote).

### 3) Laptop führt das Gateway aus, Remote-Zugriff von anderen Maschinen

Behalten Sie das Gateway lokal bei, stellen Sie es aber sicher bereit:

- SSH-Tunnel zum Laptop von anderen Maschinen aus, oder
- Tailscale Serve für die Control UI und das Gateway nur auf Loopback belassen.

Leitfaden: [Tailscale](/gateway/tailscale) und [Web overview](/web).

## Befehlsfluss (was wo ausgeführt wird)

Ein Gateway-Dienst besitzt Status + Kanäle. Nodes sind Peripheriegeräte.

Beispielablauf (Telegram → Node):

- Eine Telegram-Nachricht trifft beim **Gateway** ein.
- Das Gateway führt den **Agenten** aus und entscheidet, ob ein Node-Tool aufgerufen werden soll.
- Das Gateway ruft den **Node** über das Gateway WebSocket (`node.*` RPC) auf.
- Der Node gibt das Ergebnis zurück; das Gateway antwortet zurück an Telegram.

Hinweise:

- **Nodes führen den Gateway-Dienst nicht aus.** Es sollte nur ein Gateway pro Host laufen, außer Sie führen absichtlich isolierte Profile aus (siehe [Multiple gateways](/gateway/multiple-gateways)).
- Der „node mode“ der macOS-App ist nur ein Node-Client über das Gateway WebSocket.

## SSH-Tunnel (CLI + Tools)

Erstellen Sie einen lokalen Tunnel zum entfernten Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Wenn der Tunnel aktiv ist:

- `openclaw health` und `openclaw status --deep` erreichen jetzt das entfernte Gateway über `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` können bei Bedarf ebenfalls die weitergeleitete URL über `--url` ansprechen.

Hinweis: Ersetzen Sie `18789` durch Ihren konfigurierten `gateway.port` (oder `--port`/`OPENCLAW_GATEWAY_PORT`).
Hinweis: Wenn Sie `--url` übergeben, greift die CLI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück.
Geben Sie `--token` oder `--password` explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.

## Standardwerte für CLI-Remote

Sie können ein Remote-Ziel dauerhaft speichern, sodass CLI-Befehle es standardmäßig verwenden:

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

## Vorrang von Anmeldedaten

Die Auflösung von Gateway-Anmeldedaten folgt einem gemeinsamen Vertrag über call/probe/status-Pfade und die Überwachung von Discord-Exec-Genehmigungen hinweg. Node-host verwendet denselben Basisvertrag mit einer Ausnahme für den lokalen Modus (dort wird `gateway.remote.*` absichtlich ignoriert):

- Explizite Anmeldedaten (`--token`, `--password` oder Tool-`gatewayToken`) haben auf Call-Pfaden, die explizite Auth akzeptieren, immer Vorrang.
- Sicherheit bei URL-Überschreibungen:
  - CLI-URL-Überschreibungen (`--url`) verwenden niemals implizite Konfigurations-/Umgebungs-Anmeldedaten wieder.
  - URL-Überschreibungen per Env (`OPENCLAW_GATEWAY_URL`) dürfen nur Env-Anmeldedaten verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standardwerte im lokalen Modus:
  - Token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (der Remote-Fallback gilt nur, wenn die lokale Auth-Token-Eingabe nicht gesetzt ist)
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (der Remote-Fallback gilt nur, wenn die lokale Auth-Passwort-Eingabe nicht gesetzt ist)
- Standardwerte im Remote-Modus:
  - Token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ausnahme im lokalen Modus von Node-host: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Prüfungen von Remote probe/status für Tokens sind standardmäßig strikt: Sie verwenden nur `gateway.remote.token` (kein lokaler Token-Fallback), wenn der Remote-Modus angesprochen wird.
- Gateway-Env-Überschreibungen verwenden nur `OPENCLAW_GATEWAY_*`.

## Chat-UI über SSH

WebChat verwendet keinen separaten HTTP-Port mehr. Die SwiftUI-Chat-UI verbindet sich direkt mit dem Gateway WebSocket.

- Leiten Sie `18789` über SSH weiter (siehe oben) und verbinden Sie Clients dann mit `ws://127.0.0.1:18789`.
- Unter macOS sollten Sie den Modus „Remote over SSH“ der App bevorzugen, der den Tunnel automatisch verwaltet.

## macOS-App „Remote over SSH“

Die macOS-Menüleisten-App kann dasselbe Setup vollständig Ende zu Ende steuern (Remote-Statusprüfungen, WebChat und Voice Wake Forwarding).

Ablauf: [macOS remote access](/platforms/mac/remote).

## Sicherheitsregeln (remote/VPN)

Kurzfassung: **Behalten Sie das Gateway nur auf Loopback**, es sei denn, Sie sind sicher, dass Sie ein anderes Binding benötigen.

- **Loopback + SSH/Tailscale Serve** ist der sicherste Standard (keine öffentliche Exposition).
- Unverschlüsseltes `ws://` ist standardmäßig nur auf Loopback erlaubt. Für vertrauenswürdige private Netzwerke
  setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` im Client-Prozess als Break-Glass.
- **Nicht-Loopback-Bindings** (`lan`/`tailnet`/`custom` oder `auto`, wenn Loopback nicht verfügbar ist) müssen Gateway-Auth verwenden: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Quellen für Client-Anmeldedaten. Sie konfigurieren nicht selbst die Server-Auth.
- Lokale Call-Pfade können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst werden, schlägt die Auflösung fail-closed fehl (kein Remote-Fallback, der dies verdeckt).
- `gateway.remote.tlsFingerprint` pinnt das entfernte TLS-Zertifikat bei Verwendung von `wss://`.
- **Tailscale Serve** kann den Datenverkehr von Control UI/WebSocket über Identitäts-Header authentifizieren, wenn `gateway.auth.allowTailscale: true`; HTTP-API-Endpunkte verwenden diese Tailscale-Header-Auth nicht, sondern folgen dem normalen HTTP-Auth-Modus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Setzen Sie dies auf `false`, wenn Sie überall Shared-Secret-Auth möchten.
- **Trusted-proxy**-Auth ist nur für Nicht-Loopback-Setups mit identitätsbewusstem Proxy gedacht.
  Reverse-Proxys auf demselben Host über Loopback erfüllen `gateway.auth.mode: "trusted-proxy"` nicht.
- Behandeln Sie Browser-Steuerung wie Operatorzugriff: nur Tailnet + bewusstes Node-Pairing.

Vertiefung: [Sicherheit](/gateway/security).

### macOS: persistenter SSH-Tunnel über LaunchAgent

Für macOS-Clients, die sich mit einem entfernten Gateway verbinden, verwendet das einfachste persistente Setup einen SSH-`LocalForward`-Konfigurationseintrag plus einen LaunchAgent, um den Tunnel über Neustarts und Abstürze hinweg aktiv zu halten.

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

#### Schritt 3: das Gateway-Token konfigurieren

Speichern Sie das Token in der Konfiguration, damit es Neustarts übersteht:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Schritt 4: den LaunchAgent erstellen

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

#### Schritt 5: den LaunchAgent laden

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Der Tunnel startet automatisch bei der Anmeldung, wird nach Abstürzen neu gestartet und hält den weitergeleiteten Port aktiv.

Hinweis: Wenn Sie einen verbleibenden LaunchAgent `com.openclaw.ssh-tunnel` aus einem älteren Setup haben, entladen und löschen Sie ihn.

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

| Konfigurationseintrag                  | Was er bewirkt                                               |
| -------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`   | Leitet den lokalen Port 18789 an den entfernten Port 18789 weiter |
| `ssh -N`                               | SSH ohne Ausführung entfernter Befehle (nur Port-Weiterleitung) |
| `KeepAlive`                            | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                            | Startet den Tunnel, wenn der LaunchAgent bei der Anmeldung geladen wird |
