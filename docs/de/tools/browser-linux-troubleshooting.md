---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Behebe CDP-Startprobleme bei Chrome/Brave/Edge/Chromium für die OpenClaw-Browsersteuerung unter Linux
title: Browser-Fehlerbehebung
x-i18n:
    generated_at: "2026-04-05T12:56:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# Browser-Fehlerbehebung (Linux)

## Problem: "Failed to start Chrome CDP on port 18800"

Der Browser-Control-Server von OpenClaw kann Chrome/Brave/Edge/Chromium nicht mit folgendem Fehler starten:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Ursache

Unter Ubuntu (und vielen Linux-Distributionen) ist die Standardinstallation von Chromium ein **snap-Paket**. Die AppArmor-Isolierung von Snap stört dabei, wie OpenClaw den Browser-Prozess startet und überwacht.

Der Befehl `apt install chromium` installiert ein Stub-Paket, das auf snap umleitet:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Das ist KEIN echter Browser – es ist nur ein Wrapper.

### Lösung 1: Google Chrome installieren (empfohlen)

Installiere das offizielle Google-Chrome-`.deb`-Paket, das nicht durch snap sandboxed ist:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # falls Abhängigkeitsfehler auftreten
```

Aktualisiere dann deine OpenClaw-Konfiguration (`~/.openclaw/openclaw.json`):

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

Wenn du Snap-Chromium verwenden musst, konfiguriere OpenClaw so, dass es sich an einen manuell gestarteten Browser anhängt:

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

3. Optional einen systemd-User-Service erstellen, um Chrome automatisch zu starten:

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

### Überprüfen, ob der Browser funktioniert

Status prüfen:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Browsen testen:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Konfigurationsreferenz

| Option                   | Beschreibung                                                        | Standard                                                    |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Browsersteuerung aktivieren                                         | `true`                                                      |
| `browser.executablePath` | Pfad zu einer Chromium-basierten Browser-Binary (Chrome/Brave/Edge/Chromium) | automatisch erkannt (bevorzugt den Standardbrowser, wenn Chromium-basiert) |
| `browser.headless`       | Ohne GUI ausführen                                                  | `false`                                                     |
| `browser.noSandbox`      | Flag `--no-sandbox` hinzufügen (für einige Linux-Setups nötig)      | `false`                                                     |
| `browser.attachOnly`     | Browser nicht starten, nur an bestehenden anhängen                  | `false`                                                     |
| `browser.cdpPort`        | Chrome-DevTools-Protocol-Port                                       | `18800`                                                     |

### Problem: "No Chrome tabs found for profile=\"user\""

Du verwendest ein `existing-session`-/Chrome-MCP-Profil. OpenClaw kann lokales Chrome sehen,
aber es sind keine offenen Tabs zum Anhängen verfügbar.

Mögliche Lösungen:

1. **Den verwalteten Browser verwenden:** `openclaw browser start --browser-profile openclaw`
   (oder `browser.defaultProfile: "openclaw"` setzen).
2. **Chrome MCP verwenden:** Stelle sicher, dass lokales Chrome mit mindestens einem offenen Tab läuft, und versuche es dann erneut mit `--browser-profile user`.

Hinweise:

- `user` ist nur für den Host. Für Linux-Server, Container oder Remote-Hosts solltest du CDP-Profile bevorzugen.
- `user` / andere `existing-session`-Profile behalten die aktuellen Einschränkungen von Chrome MCP:
  ref-gesteuerte Aktionen, Hooks für Datei-Uploads mit nur einer Datei, keine Dialog-Timeout-Overrides, kein
  `wait --load networkidle` und kein `responsebody`, PDF-Export, Download-
  Abfangen oder Batch-Aktionen.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setze diese nur für Remote-CDP.
- Remote-CDP-Profile akzeptieren `http://`, `https://`, `ws://` und `wss://`.
  Verwende HTTP(S) für `/json/version`-Erkennung oder WS(S), wenn dein Browser-
  Service dir eine direkte DevTools-Socket-URL gibt.
