---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Probleme beim CDP-Start von Chrome/Brave/Edge/Chromium für die OpenClaw-Browsersteuerung unter Linux beheben
title: Fehlerbehebung für den Browser
x-i18n:
    generated_at: "2026-04-24T07:01:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problem: „Failed to start Chrome CDP on port 18800“

Der Browser-Control-Server von OpenClaw kann Chrome/Brave/Edge/Chromium nicht starten und meldet den Fehler:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Ursache

Unter Ubuntu (und vielen Linux-Distributionen) ist die Standardinstallation von Chromium ein **Snap-Paket**. Die AppArmor-Isolation von Snap interferiert mit der Art, wie OpenClaw den Browserprozess startet und überwacht.

Der Befehl `apt install chromium` installiert ein Stub-Paket, das zu Snap umleitet:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Das ist KEIN echter Browser — nur ein Wrapper.

### Lösung 1: Google Chrome installieren (empfohlen)

Installieren Sie das offizielle `.deb`-Paket von Google Chrome, das nicht durch Snap sandboxed ist:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # falls Abhängigkeitsfehler auftreten
```

Aktualisieren Sie dann Ihre OpenClaw-Konfiguration (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Lösung 2: Snap-Chromium mit Attach-Only-Modus verwenden

Wenn Sie Snap-Chromium verwenden müssen, konfigurieren Sie OpenClaw so, dass es sich mit einem manuell gestarteten Browser verbindet:

1. Konfiguration aktualisieren:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Chromium manuell starten:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Optional einen systemd-User-Dienst erstellen, um Chrome automatisch zu starten:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Aktivieren mit: `systemctl --user enable --now openclaw-browser.service`

### Prüfen, ob der Browser funktioniert

Status prüfen:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Browsing testen:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Konfigurationsreferenz

| Option                   | Beschreibung                                                          | Standard                                                    |
| ------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Browsersteuerung aktivieren                                           | `true`                                                      |
| `browser.executablePath` | Pfad zu einer Chromium-basierten Browser-Binärdatei (Chrome/Brave/Edge/Chromium) | automatisch erkannt (bevorzugt den Standardbrowser, wenn Chromium-basiert) |
| `browser.headless`       | Ohne GUI ausführen                                                    | `false`                                                     |
| `browser.noSandbox`      | Flag `--no-sandbox` hinzufügen (für einige Linux-Setups erforderlich) | `false`                                                     |
| `browser.attachOnly`     | Browser nicht starten, nur mit einem bestehenden verbinden            | `false`                                                     |
| `browser.cdpPort`        | Port für Chrome DevTools Protocol                                     | `18800`                                                     |

### Problem: „No Chrome tabs found for profile=\"user\"“

Sie verwenden ein `existing-session`- / Chrome-MCP-Profil. OpenClaw kann lokales Chrome sehen,
aber es gibt keine offenen Tabs, an die es sich anhängen kann.

Lösungsmöglichkeiten:

1. **Den verwalteten Browser verwenden:** `openclaw browser start --browser-profile openclaw`
   (oder `browser.defaultProfile: "openclaw"` setzen).
2. **Chrome MCP verwenden:** Stellen Sie sicher, dass lokales Chrome läuft und mindestens ein Tab geöffnet ist, und versuchen Sie es dann erneut mit `--browser-profile user`.

Hinweise:

- `user` ist nur für den Host. Für Linux-Server, Container oder Remote-Hosts bevorzugen Sie CDP-Profile.
- `user` / andere Profile vom Typ `existing-session` behalten die aktuellen Chrome-MCP-Limits:
  ref-basierte Aktionen, Hooks für Upload einzelner Dateien, keine Überschreibungen für Dialog-Timeouts, kein
  `wait --load networkidle` sowie kein `responsebody`, kein PDF-Export, keine Download-
  Interception und keine Batch-Aktionen.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setzen Sie diese nur für Remote-CDP.
- Remote-CDP-Profile akzeptieren `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S) für die Erkennung über `/json/version` oder WS(S), wenn Ihr Browser-
  Dienst Ihnen eine direkte DevTools-Socket-URL bereitstellt.

## Verwandt

- [Browser](/de/tools/browser)
- [Browser login](/de/tools/browser-login)
- [Browser WSL2 troubleshooting](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
