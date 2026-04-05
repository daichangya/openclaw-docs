---
read_when:
    - Sie verwenden `openclaw browser` und möchten Beispiele für häufige Aufgaben
    - Sie möchten einen Browser auf einem anderen Rechner über einen Node-Host steuern
    - Sie möchten sich über Chrome MCP an Ihr lokal angemeldetes Chrome anhängen
summary: CLI-Referenz für `openclaw browser` (Lebenszyklus, Profile, Tabs, Aktionen, Zustand und Debugging)
title: browser
x-i18n:
    generated_at: "2026-04-05T12:37:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: c89a7483dd733863dd8ebd47a14fbb411808ad07daaed515c1270978de9157e7
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Verwalten Sie die Browser-Steuerungsoberfläche von OpenClaw und führen Sie Browser-Aktionen aus (Lebenszyklus, Profile, Tabs, Snapshots, Screenshots, Navigation, Eingabe, Zustands-Emulation und Debugging).

Verwandt:

- Browser-Tool + API: [Browser tool](/tools/browser)

## Häufige Flags

- `--url <gatewayWsUrl>`: Gateway-WebSocket-URL (standardmäßig aus der Konfiguration).
- `--token <token>`: Gateway-Token (falls erforderlich).
- `--timeout <ms>`: Anfrage-Timeout (ms).
- `--expect-final`: auf eine endgültige Gateway-Antwort warten.
- `--browser-profile <name>`: ein Browser-Profil auswählen (Standard aus der Konfiguration).
- `--json`: maschinenlesbare Ausgabe (wo unterstützt).

## Schnellstart (lokal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Lebenszyklus

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Hinweise:

- Für `attachOnly`- und entfernte CDP-Profile schließt `openclaw browser stop` die
  aktive Steuerungssitzung und löscht temporäre Emulationsüberschreibungen, auch wenn
  OpenClaw den Browser-Prozess nicht selbst gestartet hat.
- Für lokal verwaltete Profile beendet `openclaw browser stop` den gestarteten Browser-
  Prozess.

## Wenn der Befehl fehlt

Wenn `openclaw browser` ein unbekannter Befehl ist, prüfen Sie `plugins.allow` in
`~/.openclaw/openclaw.json`.

Wenn `plugins.allow` vorhanden ist, muss das gebündelte Browser-Plugin explizit
aufgeführt werden:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` stellt den CLI-Unterbefehl nicht wieder her, wenn die Plugin-
Allowlist `browser` ausschließt.

Verwandt: [Browser tool](/tools/browser#missing-browser-command-or-tool)

## Profile

Profile sind benannte Browser-Routing-Konfigurationen. In der Praxis:

- `openclaw`: startet oder verbindet sich mit einer dedizierten, von OpenClaw verwalteten Chrome-Instanz (isoliertes Benutzer-Datenverzeichnis).
- `user`: steuert Ihre bestehende angemeldete Chrome-Sitzung über Chrome DevTools MCP.
- benutzerdefinierte CDP-Profile: verweisen auf einen lokalen oder entfernten CDP-Endpunkt.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Ein bestimmtes Profil verwenden:

```bash
openclaw browser --browser-profile work tabs
```

## Tabs

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / Screenshot / Aktionen

Snapshot:

```bash
openclaw browser snapshot
```

Screenshot:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Hinweise:

- `--full-page` ist nur für Seitenaufnahmen gedacht; es kann nicht mit `--ref`
  oder `--element` kombiniert werden.
- `existing-session`- / `user`-Profile unterstützen Seiten-Screenshots und `--ref`-
  Screenshots aus Snapshot-Ausgaben, aber keine CSS-`--element`-Screenshots.

Navigieren/Klicken/Tippen (Ref-basierte UI-Automatisierung):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Datei- + Dialog-Helfer:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

## Zustand und Speicher

Viewport + Emulation:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + Speicher:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Debugging

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Bestehendes Chrome über MCP

Verwenden Sie das integrierte `user`-Profil oder erstellen Sie Ihr eigenes `existing-session`-Profil:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Dieser Pfad ist nur für den Host. Für Docker, headless Server, Browserless oder andere entfernte Setups verwenden Sie stattdessen ein CDP-Profil.

Aktuelle Einschränkungen von existing-session:

- Snapshot-gesteuerte Aktionen verwenden Refs, keine CSS-Selektoren
- `click` ist nur Linksklick
- `type` unterstützt `slowly=true` nicht
- `press` unterstützt `delayMs` nicht
- `hover`, `scrollintoview`, `drag`, `select`, `fill` und `evaluate` lehnen
  Timeout-Überschreibungen pro Aufruf ab
- `select` unterstützt nur einen Wert
- `wait --load networkidle` wird nicht unterstützt
- Datei-Uploads erfordern `--ref` / `--input-ref`, unterstützen kein CSS-
  `--element` und unterstützen derzeit jeweils nur eine Datei
- Dialog-Hooks unterstützen `--timeout` nicht
- Screenshots unterstützen Seitenaufnahmen und `--ref`, aber kein CSS-`--element`
- `responsebody`, Download-Abfangung, PDF-Export und Batch-Aktionen erfordern weiterhin
  einen verwalteten Browser oder ein rohes CDP-Profil

## Entfernte Browser-Steuerung (Node-Host-Proxy)

Wenn das Gateway auf einem anderen Rechner läuft als der Browser, führen Sie einen **Node-Host** auf dem Rechner aus, auf dem sich Chrome/Brave/Edge/Chromium befindet. Das Gateway leitet Browser-Aktionen an diesen Node weiter (kein separater Browser-Steuerungsserver erforderlich).

Verwenden Sie `gateway.nodes.browser.mode`, um das automatische Routing zu steuern, und `gateway.nodes.browser.node`, um einen bestimmten Node festzulegen, wenn mehrere verbunden sind.

Sicherheit + Remote-Setup: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)
