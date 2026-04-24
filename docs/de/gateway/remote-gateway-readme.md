---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Einrichtung eines SSH-Tunnels für die Verbindung von OpenClaw.app mit einem entfernten Gateway
title: Einrichtung eines entfernten Gateway
x-i18n:
    generated_at: "2026-04-24T06:39:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc5df551839db87a36be7c1b29023c687c418d13337075490436335a8bb1635d
    source_path: gateway/remote-gateway-readme.md
    workflow: 15
---

> Dieser Inhalt wurde in [Remote Access](/de/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent) zusammengeführt. Die aktuelle Anleitung finden Sie auf dieser Seite.

# OpenClaw.app mit einem entfernten Gateway ausführen

OpenClaw.app verwendet SSH-Tunneling, um sich mit einem entfernten Gateway zu verbinden. Diese Anleitung zeigt Ihnen, wie Sie das einrichten.

## Überblick

```mermaid
flowchart TB
    subgraph Client["Client-Rechner"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(lokaler Port)"]
        T["SSH-Tunnel"]

        A --> B
        B --> T
    end
    subgraph Remote["Entfernter Rechner"]
        direction TB
        C["Gateway-WebSocket"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Schnelleinrichtung

### Schritt 1: SSH-Konfiguration hinzufügen

Bearbeiten Sie `~/.ssh/config` und fügen Sie hinzu:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # z. B. 172.27.187.184
    User <REMOTE_USER>            # z. B. jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Ersetzen Sie `<REMOTE_IP>` und `<REMOTE_USER>` durch Ihre Werte.

### Schritt 2: SSH-Schlüssel kopieren

Kopieren Sie Ihren öffentlichen Schlüssel auf den entfernten Rechner (Passwort einmal eingeben):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Schritt 3: Authentifizierung des entfernten Gateway konfigurieren

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Verwenden Sie stattdessen `gateway.remote.password`, wenn Ihr entferntes Gateway Passwortauthentifizierung verwendet.
`OPENCLAW_GATEWAY_TOKEN` ist weiterhin als Überschreibung auf Shell-Ebene gültig, aber die dauerhafte
Einrichtung für Remote-Clients ist `gateway.remote.token` / `gateway.remote.password`.

### Schritt 4: SSH-Tunnel starten

```bash
ssh -N remote-gateway &
```

### Schritt 5: OpenClaw.app neu starten

```bash
# OpenClaw.app beenden (⌘Q), dann erneut öffnen:
open /path/to/OpenClaw.app
```

Die App verbindet sich nun über den SSH-Tunnel mit dem entfernten Gateway.

---

## Tunnel beim Anmelden automatisch starten

Damit der SSH-Tunnel beim Anmelden automatisch startet, erstellen Sie einen Launch Agent.

### Die PLIST-Datei erstellen

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

### Den Launch Agent laden

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Der Tunnel wird nun:

- automatisch starten, wenn Sie sich anmelden
- neu starten, wenn er abstürzt
- im Hintergrund weiterlaufen

Hinweis zu Altlasten: Entfernen Sie gegebenenfalls einen verbliebenen `com.openclaw.ssh-tunnel`-LaunchAgent.

---

## Fehlerbehebung

**Prüfen, ob der Tunnel läuft:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**Den Tunnel neu starten:**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**Den Tunnel stoppen:**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## Wie es funktioniert

| Komponente                           | Was sie macht                                                |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Leitet den lokalen Port 18789 auf den entfernten Port 18789 weiter |
| `ssh -N`                             | SSH ohne Ausführung entfernter Befehle (nur Portweiterleitung) |
| `KeepAlive`                          | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                          | Startet den Tunnel, wenn der Agent geladen wird              |

OpenClaw.app verbindet sich auf Ihrem Client-Rechner mit `ws://127.0.0.1:18789`. Der SSH-Tunnel leitet diese Verbindung an Port 18789 auf dem entfernten Rechner weiter, auf dem das Gateway läuft.

## Verwandt

- [Remote Access](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
