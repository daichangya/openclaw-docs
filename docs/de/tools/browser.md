---
read_when:
    - Agentengesteuerte Browser-Automatisierung hinzufügen
    - Debuggen, warum openclaw sich in Ihr eigenes Chrome einmischt
    - Browser-Einstellungen + Lebenszyklus in der macOS-App implementieren
summary: Integrierter Browser-Control-Service + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-04-05T12:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a41162efd397ea918469e16aa67e554bcbb517b3112df1d3e7927539b6a0926a
    source_path: tools/browser.md
    workflow: 15
---

# Browser (von openclaw verwaltet)

OpenClaw kann ein **dediziertes Chrome-/Brave-/Edge-/Chromium-Profil** ausführen, das vom Agenten gesteuert wird.
Es ist von Ihrem persönlichen Browser isoliert und wird über einen kleinen lokalen
Control-Service innerhalb des Gateways verwaltet (nur loopback).

Einfach erklärt:

- Stellen Sie es sich als **separaten Browser nur für den Agenten** vor.
- Das Profil `openclaw` **berührt nicht** Ihr persönliches Browserprofil.
- Der Agent kann **Tabs öffnen, Seiten lesen, klicken und tippen** in einer sicheren Spur.
- Das integrierte Profil `user` verbindet sich über Chrome MCP mit Ihrer echten angemeldeten Chrome-Sitzung.

## Was Sie erhalten

- Ein separates Browserprofil namens **openclaw** (standardmäßig mit orangem Akzent).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agentenaktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr täglicher Hauptbrowser. Er ist eine sichere, isolierte Oberfläche für
Agentenautomatisierung und Verifizierung.

## Schnellstart

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Wenn Sie „Browser disabled“ erhalten, aktivieren Sie ihn in der Konfiguration (siehe unten) und starten Sie das
Gateway neu.

Wenn `openclaw browser` vollständig fehlt oder der Agent meldet, dass das Browser-Tool
nicht verfügbar ist, springen Sie zu [Fehlender Browser-Befehl oder Tool](/tools/browser#missing-browser-command-or-tool).

## Plugin-Steuerung

Das Standard-Tool `browser` ist jetzt ein gebündeltes Plugin, das standardmäßig
aktiviert ausgeliefert wird. Das bedeutet, dass Sie es deaktivieren oder ersetzen können, ohne den Rest des
Plugin-Systems von OpenClaw zu entfernen:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Deaktivieren Sie das gebündelte Plugin, bevor Sie ein anderes Plugin installieren, das denselben
Tool-Namen `browser` bereitstellt. Das Standard-Browser-Erlebnis benötigt beides:

- `plugins.entries.browser.enabled` darf nicht deaktiviert sein
- `browser.enabled=true`

Wenn Sie nur das Plugin deaktivieren, verschwinden die gebündelte Browser-CLI (`openclaw browser`),
die Gateway-Methode (`browser.request`), das Agenten-Tool und der Standard-Browser-Control-Service
gemeinsam. Ihre `browser.*`-Konfiguration bleibt unverändert erhalten, damit ein Ersatz-Plugin sie wiederverwenden kann.

Das gebündelte Browser-Plugin besitzt jetzt auch die Browser-Laufzeitimplementierung.
Der Core behält nur gemeinsame Hilfsfunktionen des Plugin SDK plus Kompatibilitäts-Re-Exports für
ältere interne Importpfade. In der Praxis bedeutet das: Wenn Sie das Browser-Plugin-Paket entfernen oder ersetzen,
verschwindet der Browser-Funktionsumfang, statt dass eine zweite, dem Core gehörende Laufzeit übrig bleibt.

Änderungen an der Browser-Konfiguration erfordern weiterhin einen Gateway-Neustart, damit das gebündelte Plugin
seinen Browser-Service mit den neuen Einstellungen erneut registrieren kann.

## Fehlender Browser-Befehl oder Tool

Wenn `openclaw browser` nach einem Upgrade plötzlich ein unbekannter Befehl ist oder
der Agent meldet, dass das Browser-Tool fehlt, ist die häufigste Ursache eine
restriktive `plugins.allow`-Liste, die `browser` nicht enthält.

Beispiel für eine fehlerhafte Konfiguration:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Beheben Sie das, indem Sie `browser` zur Plugin-Allowlist hinzufügen:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Wichtige Hinweise:

- `browser.enabled=true` allein reicht nicht aus, wenn `plugins.allow` gesetzt ist.
- `plugins.entries.browser.enabled=true` allein reicht ebenfalls nicht aus, wenn `plugins.allow` gesetzt ist.
- `tools.alsoAllow: ["browser"]` lädt das gebündelte Browser-Plugin **nicht**. Es passt nur die Tool-Richtlinie an, nachdem das Plugin bereits geladen wurde.
- Wenn Sie keine restriktive Plugin-Allowlist benötigen, stellt auch das Entfernen von `plugins.allow` das standardmäßige gebündelte Browser-Verhalten wieder her.

Typische Symptome:

- `openclaw browser` ist ein unbekannter Befehl.
- `browser.request` fehlt.
- Der Agent meldet das Browser-Tool als nicht verfügbar oder fehlend.

## Profile: `openclaw` vs `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Verbindungsprofil für Ihre **echte angemeldete Chrome**-
  Sitzung.

Für Browser-Tool-Aufrufe des Agenten:

- Standard: den isolierten Browser `openclaw` verwenden.
- `profile="user"` bevorzugen, wenn bestehende angemeldete Sitzungen wichtig sind und der Benutzer
  am Rechner sitzt, um eine Verbindungsabfrage anzuklicken/zu bestätigen.
- `profile` ist die explizite Überschreibung, wenn Sie einen bestimmten Browsermodus möchten.

Setzen Sie `browser.defaultProfile: "openclaw"`, wenn standardmäßig der verwaltete Modus verwendet werden soll.

## Konfiguration

Die Browser-Einstellungen befinden sich in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

Hinweise:

- Der Browser-Control-Service bindet an loopback auf einem von `gateway.port`
  abgeleiteten Port (Standard: `18791`, also Gateway + 2).
- Wenn Sie den Gateway-Port überschreiben (`gateway.port` oder `OPENCLAW_GATEWAY_PORT`),
  verschieben sich die abgeleiteten Browser-Ports, damit sie in derselben „Familie“ bleiben.
- `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn es nicht gesetzt ist.
- `remoteCdpTimeoutMs` gilt für Erreichbarkeitsprüfungen entfernter (nicht-loopback) CDP-Endpunkte.
- `remoteCdpHandshakeTimeoutMs` gilt für Erreichbarkeitsprüfungen des WebSocket-Handshakes bei entferntem CDP.
- Browser-Navigation/Tab-Öffnen ist vor der Navigation durch SSRF geschützt und wird nach der Navigation auf die endgültige `http(s)`-URL nach bestem Bemühen erneut geprüft.
- Im strikten SSRF-Modus werden auch Erkennung und Prüfungen entfernter CDP-Endpunkte (`cdpUrl`, einschließlich `/json/version`-Lookups) geprüft.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig `true` (Trusted-Network-Modell). Setzen Sie es auf `false` für strikt nur öffentliches Browsing.
- `browser.ssrfPolicy.allowPrivateNetwork` bleibt als veralteter Alias aus Kompatibilitätsgründen unterstützt.
- `attachOnly: true` bedeutet: „Niemals einen lokalen Browser starten; nur verbinden, wenn er bereits läuft.“
- `color` + profilspezifisches `color` färben die Browser-UI ein, damit Sie sehen können, welches Profil aktiv ist.
- Standardprofil ist `openclaw` (von OpenClaw verwalteter eigenständiger Browser). Verwenden Sie `defaultProfile: "user"`, um stattdessen den angemeldeten Benutzer-Browser zu verwenden.
- Reihenfolge der automatischen Erkennung: systemweiter Standardbrowser, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu — setzen Sie diese nur für entferntes CDP.
- `driver: "existing-session"` verwendet Chrome DevTools MCP anstelle von rohem CDP. Setzen Sie für
  diesen Treiber kein `cdpUrl`.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn sich ein existing-session-Profil
  mit einem nicht standardmäßigen Chromium-Benutzerprofil wie Brave oder Edge verbinden soll.

## Brave verwenden (oder einen anderen Chromium-basierten Browser)

Wenn Ihr **systemweiter Standardbrowser** Chromium-basiert ist (Chrome/Brave/Edge/etc.),
verwendet OpenClaw ihn automatisch. Setzen Sie `browser.executablePath`, um die
automatische Erkennung zu überschreiben:

CLI-Beispiel:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Lokale vs entfernte Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den loopback-Control-Service und kann einen lokalen Browser starten.
- **Entfernte Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Rechner aus, auf dem sich der Browser befindet; das Gateway leitet Browser-Aktionen an ihn weiter.
- **Entferntes CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  sich mit einem entfernten Chromium-basierten Browser zu verbinden. In diesem Fall startet OpenClaw keinen lokalen Browser.

Das Stoppen verhält sich je nach Profilmodus unterschiedlich:

- lokal verwaltete Profile: `openclaw browser stop` beendet den Browserprozess, den
  OpenClaw gestartet hat
- attach-only- und entfernte CDP-Profile: `openclaw browser stop` schließt die aktive
  Control-Sitzung und entfernt Playwright-/CDP-Emulationsüberschreibungen (Viewport,
  Farbschema, Gebietsschema, Zeitzone, Offline-Modus und ähnlichen Status), auch
  wenn kein Browserprozess von OpenClaw gestartet wurde

Entfernte CDP-URLs können Authentifizierung enthalten:

- Query-Token (z. B. `https://provider.example?token=<token>`)
- HTTP-Basic-Auth (z. B. `https://user:pass@provider.example`)

OpenClaw bewahrt die Authentifizierung beim Aufruf von `/json/*`-Endpunkten und bei der Verbindung
mit dem CDP-WebSocket. Bevorzugen Sie für Token Umgebungsvariablen oder Secret-Manager, statt
sie in Konfigurationsdateien einzuchecken.

## Node-Browser-Proxy (Zero-Config-Standard)

Wenn Sie einen **Node-Host** auf dem Rechner ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe automatisch an diesen Node weiterleiten, ohne zusätzliche Browser-Konfiguration.
Dies ist der Standardpfad für entfernte Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Control-Server über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Node (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es leer für das veraltete/standardmäßige Verhalten: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw es als Least-Privilege-Grenze: Nur allowlistete Profile können angesprochen werden, und Routen zum Erstellen/Löschen persistenter Profile werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren, wenn Sie es nicht möchten:
  - Auf dem Node: `nodeHost.browserProxy.enabled=false`
  - Auf dem Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (gehostetes entferntes CDP)

[Browserless](https://browserless.io) ist ein gehosteter Chromium-Service, der
CDP-Verbindungs-URLs über HTTPS und WebSocket bereitstellt. OpenClaw kann beide Formen verwenden, aber
für ein entferntes Browserprofil ist die direkte WebSocket-URL aus der Browserless-Dokumentation zur Verbindung am einfachsten.

Beispiel:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Hinweise:

- Ersetzen Sie `<BROWSERLESS_API_KEY>` durch Ihr echtes Browserless-Token.
- Wählen Sie den Regionsendpunkt, der zu Ihrem Browserless-Konto passt (siehe deren Dokumentation).
- Wenn Browserless Ihnen eine HTTPS-Basis-URL gibt, können Sie sie entweder in
  `wss://` für eine direkte CDP-Verbindung umwandeln oder die HTTPS-URL beibehalten und OpenClaw
  `/json/version` erkennen lassen.

## Direkte WebSocket-CDP-Provider

Einige gehostete Browser-Services stellen einen **direkten WebSocket**-Endpunkt anstelle der
standardmäßigen HTTP-basierten CDP-Erkennung (`/json/version`) bereit. OpenClaw unterstützt beides:

- **HTTP(S)-Endpunkte** — OpenClaw ruft `/json/version` auf, um die
  WebSocket-Debugger-URL zu erkennen, und verbindet sich dann.
- **WebSocket-Endpunkte** (`ws://` / `wss://`) — OpenClaw verbindet sich direkt
  und überspringt `/json/version`. Verwenden Sie dies für Services wie
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com) oder jeden Provider, der Ihnen eine
  WebSocket-URL gibt.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
headless Browser mit integrierter CAPTCHA-Lösung, Stealth-Modus und Residential
Proxies.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Hinweise:

- [Registrieren Sie sich](https://www.browserbase.com/sign-up) und kopieren Sie Ihren **API Key**
  aus dem [Overview-Dashboard](https://www.browserbase.com/overview).
- Ersetzen Sie `<BROWSERBASE_API_KEY>` durch Ihren echten Browserbase-API-Schlüssel.
- Browserbase erstellt beim WebSocket-Verbindungsaufbau automatisch eine Browser-Sitzung, daher ist
  kein manueller Schritt zur Sitzungserstellung erforderlich.
- Die kostenlose Stufe erlaubt eine gleichzeitige Sitzung und eine Browserstunde pro Monat.
  Siehe [Preisübersicht](https://www.browserbase.com/pricing) für Limits kostenpflichtiger Tarife.
- Die vollständige API-Referenz, SDK-Anleitungen und Integrationsbeispiele finden Sie in der [Browserbase-Dokumentation](https://docs.browserbase.com).

## Sicherheit

Zentrale Punkte:

- Browser-Steuerung ist nur über loopback erreichbar; der Zugriff erfolgt über die Gateway-Authentifizierung oder Node-Pairing.
- Die eigenständige loopback-Browser-HTTP-API verwendet **nur Shared-Secret-Authentifizierung**:
  Gateway-Token-Bearer-Auth, `x-openclaw-password` oder HTTP Basic Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale-Serve-Identitätsheader und `gateway.auth.mode: "trusted-proxy"` authentifizieren diese eigenständige loopback-Browser-API **nicht**.
- Wenn Browser-Steuerung aktiviert ist und keine Shared-Secret-Authentifizierung konfiguriert wurde, generiert OpenClaw
  beim Start automatisch `gateway.auth.token` und speichert es in der Konfiguration.
- OpenClaw generiert dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Erreichbarkeit.
- Behandeln Sie entfernte CDP-URLs/Token wie Secrets; bevorzugen Sie Umgebungsvariablen oder einen Secret-Manager.

Tipps für entferntes CDP:

- Bevorzugen Sie verschlüsselte Endpunkte (HTTPS oder WSS) und nach Möglichkeit kurzlebige Token.
- Vermeiden Sie es, langlebige Token direkt in Konfigurationsdateien einzubetten.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **openclaw-verwaltet**: eine dedizierte Chromium-basierte Browserinstanz mit eigenem User-Data-Verzeichnis + CDP-Port
- **entfernt**: eine explizite CDP-URL (Chromium-basierter Browser läuft anderswo)
- **bestehende Sitzung**: Ihr bestehendes Chrome-Profil über automatische Verbindung mit Chrome DevTools MCP

Standards:

- Das Profil `openclaw` wird automatisch erstellt, wenn es fehlt.
- Das Profil `user` ist für die Verbindung zu einer bestehenden Sitzung über Chrome MCP integriert.
- Existing-session-Profile sind zusätzlich zu `user` Opt-in; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800–18899** zugewiesen.
- Beim Löschen eines Profils wird dessen lokales Datenverzeichnis in den Papierkorb verschoben.

Alle Control-Endpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Existing-session über Chrome DevTools MCP

OpenClaw kann sich auch über den offiziellen Chrome DevTools MCP-Server mit einem laufenden Chromium-basierten Browserprofil verbinden. Dadurch werden die Tabs und der Anmeldestatus
wiederverwendet, die bereits in diesem Browserprofil geöffnet sind.

Offizielle Hintergrund- und Einrichtungsreferenzen:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes existing-session-Profil, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis möchten.

Standardverhalten:

- Das integrierte Profil `user` verwendet die automatische Verbindung von Chrome MCP, die das
  standardmäßige lokale Google-Chrome-Profil anspricht.

Verwenden Sie `userDataDir` für Brave, Edge, Chromium oder ein nicht standardmäßiges Chrome-Profil:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Dann im entsprechenden Browser:

1. Öffnen Sie die Inspektionsseite dieses Browsers für Remote-Debugging.
2. Aktivieren Sie Remote-Debugging.
3. Lassen Sie den Browser weiterlaufen und bestätigen Sie die Verbindungsabfrage, wenn OpenClaw sich verbindet.

Häufige Inspektionsseiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke-Test für Live-Verbindung:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

So sieht Erfolg aus:

- `status` zeigt `driver: existing-session`
- `status` zeigt `transport: chrome-mcp`
- `status` zeigt `running: true`
- `tabs` listet Ihre bereits geöffneten Browser-Tabs auf
- `snapshot` gibt Refs aus dem ausgewählten Live-Tab zurück

Was Sie prüfen sollten, wenn die Verbindung nicht funktioniert:

- der Zielbrowser auf Chromium-Basis hat Version `144+`
- Remote-Debugging ist auf der Inspektionsseite dieses Browsers aktiviert
- der Browser hat die Verbindungszustimmungsabfrage angezeigt und Sie haben sie bestätigt
- `openclaw doctor` migriert alte browserbasierte Konfigurationen mit Erweiterung und prüft, ob
  Chrome lokal installiert ist für automatische Verbindungsprofile mit Standardwerten, kann jedoch browserseitiges Remote-Debugging nicht für Sie aktivieren

Nutzung durch Agenten:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browser-Status des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes existing-session-Profil verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Rechner ist, um die Verbindungsabfrage zu bestätigen.
- das Gateway oder der Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist risikoreicher als das isolierte Profil `openclaw`, weil er
  innerhalb Ihrer angemeldeten Browser-Sitzung handeln kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es verbindet sich nur mit einer
  bestehenden Sitzung.
- OpenClaw verwendet hier den offiziellen Flow `--autoConnect` von Chrome DevTools MCP. Wenn
  `userDataDir` gesetzt ist, reicht OpenClaw es weiter, um dieses explizite
  Chromium-Benutzerdatenverzeichnis anzusprechen.
- Screenshots bei existing-session unterstützen Seitenaufnahmen und `--ref`-Elementaufnahmen
  aus Snapshot-Ausgaben, aber keine CSS-Selektoren mit `--element`.
- Seitenscreenshots bei existing-session funktionieren ohne Playwright über Chrome MCP.
  Ref-basierte Element-Screenshots (`--ref`) funktionieren dort ebenfalls, aber `--full-page`
  kann nicht mit `--ref` oder `--element` kombiniert werden.
- Aktionen bei existing-session sind weiterhin eingeschränkter als beim verwalteten Browser-
  Pfad:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern
    Snapshot-Refs statt CSS-Selektoren
  - `click` unterstützt nur die linke Maustaste (keine Button-Überschreibungen oder Modifier)
  - `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`
  - `press` unterstützt `delayMs` nicht
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen
    keine Timeout-Überschreibungen pro Aufruf
  - `select` unterstützt derzeit nur einen einzelnen Wert
- Existing-session `wait --url` unterstützt exakte, Teilstring- und Glob-Muster
  wie andere Browser-Treiber. `wait --load networkidle` wird noch nicht unterstützt.
- Upload-Hooks bei existing-session erfordern `ref` oder `inputRef`, unterstützen jeweils nur eine Datei
  und unterstützen kein CSS-Targeting über `element`.
- Dialog-Hooks bei existing-session unterstützen keine Timeout-Überschreibungen.
- Einige Funktionen erfordern weiterhin den verwalteten Browser-Pfad, darunter Batch-
  Aktionen, PDF-Export, Download-Abfangung und `responsebody`.
- Existing-session ist hostlokal. Wenn Chrome auf einem anderen Rechner oder in einem
  anderen Netzwerk-Namespace läuft, verwenden Sie stattdessen entferntes CDP oder einen Node-Host.

## Isolationsgarantien

- **Dediziertes Benutzer-Datenverzeichnis**: berührt niemals Ihr persönliches Browserprofil.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungs-Workflows zu verhindern.
- **Deterministische Tab-Steuerung**: zielt auf Tabs über `targetId`, nicht auf „letzten Tab“.

## Browser-Auswahl

Beim lokalen Start wählt OpenClaw den ersten verfügbaren:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Sie können dies mit `browser.executablePath` überschreiben.

Plattformen:

- macOS: prüft `/Applications` und `~/Applications`.
- Linux: sucht nach `google-chrome`, `brave`, `microsoft-edge`, `chromium` usw.
- Windows: prüft übliche Installationsorte.

## Control API (optional)

Für nur lokale Integrationen stellt das Gateway eine kleine loopback-HTTP-API bereit:

- Status/Start/Stopp: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/Screenshot: `GET /snapshot`, `POST /screenshot`
- Aktionen: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Netzwerk: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Einstellungen: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Alle Endpunkte akzeptieren `?profile=<name>`.

Wenn Shared-Secret-Gateway-Authentifizierung konfiguriert ist, erfordern Browser-HTTP-Routen ebenfalls Authentifizierung:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oder HTTP Basic Auth mit diesem Passwort

Hinweise:

- Diese eigenständige loopback-Browser-API nutzt **nicht** Trusted-Proxy- oder
  Tailscale-Serve-Identitätsheader.
- Wenn `gateway.auth.mode` `none` oder `trusted-proxy` ist, übernehmen diese loopback-Browser-
  Routen diese identitätsbasierten Modi nicht; halten Sie sie nur über loopback erreichbar.

### Playwright-Anforderung

Einige Funktionen (navigate/act/AI snapshot/role snapshot, Element-Screenshots,
PDF) benötigen Playwright. Wenn Playwright nicht installiert ist, geben diese Endpunkte
einen klaren 501-Fehler zurück.

Was ohne Playwright weiterhin funktioniert:

- ARIA-Snapshots
- Seiten-Screenshots für den verwalteten Browser `openclaw`, wenn ein CDP-
  WebSocket pro Tab verfügbar ist
- Seiten-Screenshots für `existing-session`-/Chrome-MCP-Profile
- Ref-basierte Screenshots (`--ref`) bei `existing-session` aus Snapshot-Ausgaben

Was weiterhin Playwright benötigt:

- `navigate`
- `act`
- AI-Snapshots / Role-Snapshots
- CSS-Selektor-Element-Screenshots (`--element`)
- vollständiger PDF-Export des Browsers

Element-Screenshots lehnen auch `--full-page` ab; die Route gibt `fullPage is
not supported for element screenshots` zurück.

Wenn Sie `Playwright is not available in this gateway build` sehen, installieren Sie das vollständige
Playwright-Paket (nicht `playwright-core`) und starten Sie das Gateway neu, oder installieren Sie
OpenClaw mit Browser-Unterstützung neu.

#### Docker-Playwright-Installation

Wenn Ihr Gateway in Docker läuft, vermeiden Sie `npx playwright` (Konflikte mit npm-Overrides).
Verwenden Sie stattdessen die gebündelte CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Um Browser-Downloads dauerhaft zu speichern, setzen Sie `PLAYWRIGHT_BROWSERS_PATH` (zum Beispiel
`/home/node/.cache/ms-playwright`) und stellen Sie sicher, dass `/home/node` über `OPENCLAW_HOME_VOLUME`
oder ein Bind-Mount persistent ist. Siehe [Docker](/de/install/docker).

## So funktioniert es (intern)

Ablauf auf hoher Ebene:

- Ein kleiner **Control-Server** akzeptiert HTTP-Anfragen.
- Er verbindet sich über **CDP** mit Chromium-basierten Browsern (Chrome/Brave/Edge/Chromium).
- Für erweiterte Aktionen (klicken/tippen/snapshot/PDF) verwendet er **Playwright** auf CDP aufbauend.
- Wenn Playwright fehlt, sind nur Nicht-Playwright-Operationen verfügbar.

Dieses Design hält den Agenten auf einer stabilen, deterministischen Schnittstelle, während
Sie lokale/entfernte Browser und Profile austauschen können.

## Schnelle CLI-Referenz

Alle Befehle akzeptieren `--browser-profile <name>`, um ein bestimmtes Profil anzusprechen.
Alle Befehle akzeptieren außerdem `--json` für maschinenlesbare Ausgabe (stabile Nutzlasten).

Grundlagen:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Inspektion:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Hinweis zum Lebenszyklus:

- Für attach-only- und entfernte CDP-Profile ist `openclaw browser stop` weiterhin der
  richtige Aufräumbefehl nach Tests. Er schließt die aktive Control-Sitzung und
  entfernt temporäre Emulationsüberschreibungen, anstatt den zugrunde liegenden
  Browser zu beenden.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Aktionen:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Status:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Hinweise:

- `upload` und `dialog` sind **Scharfschalt-Aufrufe**; führen Sie sie vor dem Klick/Drücken aus,
  der den Dateiauswähler/Dialog auslöst.
- Download- und Trace-Ausgabepfade sind auf OpenClaw-Temp-Wurzeln beschränkt:
  - Traces: `/tmp/openclaw` (Fallback: `${os.tmpdir()}/openclaw`)
  - Downloads: `/tmp/openclaw/downloads` (Fallback: `${os.tmpdir()}/openclaw/downloads`)
- Upload-Pfade sind auf eine OpenClaw-Temp-Wurzel für Uploads beschränkt:
  - Uploads: `/tmp/openclaw/uploads` (Fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` kann Dateieingaben auch direkt über `--input-ref` oder `--element` setzen.
- `snapshot`:
  - `--format ai` (Standard, wenn Playwright installiert ist): gibt einen AI-Snapshot mit numerischen Refs (`aria-ref="<n>"`) zurück.
  - `--format aria`: gibt den Accessibility-Baum zurück (keine Refs; nur Inspektion).
  - `--efficient` (oder `--mode efficient`): kompakte Role-Snapshot-Voreinstellung (interaktiv + kompakt + Tiefe + geringeres `maxChars`).
  - Konfigurationsstandard (nur Tool/CLI): Setzen Sie `browser.snapshotDefaults.mode: "efficient"`, um effiziente Snapshots zu verwenden, wenn der Aufrufer keinen Modus übergibt (siehe [Gateway-Konfiguration](/de/gateway/configuration-reference#browser)).
  - Optionen für Role-Snapshots (`--interactive`, `--compact`, `--depth`, `--selector`) erzwingen einen rollenbasierten Snapshot mit Refs wie `ref=e12`.
  - `--frame "<iframe selector>"` begrenzt Role-Snapshots auf ein iframe (kombiniert mit Rollen-Refs wie `e12`).
  - `--interactive` gibt eine flache, leicht auswählbare Liste interaktiver Elemente aus (am besten zum Auslösen von Aktionen).
  - `--labels` fügt einen Screenshot nur des Viewports mit eingeblendeten Ref-Labels hinzu (gibt `MEDIA:<path>` aus).
- `click`/`type`/etc benötigen einen `ref` aus `snapshot` (entweder numerisch `12` oder Rollen-Ref `e12`).
  CSS-Selektoren werden für Aktionen absichtlich nicht unterstützt.

## Snapshots und Refs

OpenClaw unterstützt zwei Arten von „Snapshots“:

- **AI-Snapshot (numerische Refs)**: `openclaw browser snapshot` (Standard; `--format ai`)
  - Ausgabe: ein Text-Snapshot mit numerischen Refs.
  - Aktionen: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wird der Ref über Playwrights `aria-ref` aufgelöst.

- **Role-Snapshot (Rollen-Refs wie `e12`)**: `openclaw browser snapshot --interactive` (oder `--compact`, `--depth`, `--selector`, `--frame`)
  - Ausgabe: eine rollenbasierte Liste/ein Baum mit `[ref=e12]` (und optional `[nth=1]`).
  - Aktionen: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wird der Ref über `getByRole(...)` (plus `nth()` bei Duplikaten) aufgelöst.
  - Fügen Sie `--labels` hinzu, um einen Viewport-Screenshot mit eingeblendeten `e12`-Labels einzuschließen.

Verhalten von Refs:

- Refs sind **über Navigationen hinweg nicht stabil**; wenn etwas fehlschlägt, führen Sie `snapshot` erneut aus und verwenden Sie einen frischen Ref.
- Wenn der Role-Snapshot mit `--frame` aufgenommen wurde, sind Rollen-Refs bis zum nächsten Role-Snapshot auf dieses iframe begrenzt.

## Verbesserte Wait-Funktionen

Sie können auf mehr als nur Zeit/Text warten:

- Auf URL warten (Globs unterstützt von Playwright):
  - `openclaw browser wait --url "**/dash"`
- Auf Ladezustand warten:
  - `openclaw browser wait --load networkidle`
- Auf ein JS-Prädikat warten:
  - `openclaw browser wait --fn "window.ready===true"`
- Warten, bis ein Selektor sichtbar wird:
  - `openclaw browser wait "#main"`

Diese können kombiniert werden:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Debug-Workflows

Wenn eine Aktion fehlschlägt (z. B. „not visible“, „strict mode violation“, „covered“):

1. `openclaw browser snapshot --interactive`
2. Verwenden Sie `click <ref>` / `type <ref>` (im interaktiven Modus bevorzugt Rollen-Refs)
3. Wenn es weiterhin fehlschlägt: `openclaw browser highlight <ref>`, um zu sehen, worauf Playwright zielt
4. Wenn sich die Seite seltsam verhält:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Für tieferes Debugging: einen Trace aufzeichnen:
   - `openclaw browser trace start`
   - Problem reproduzieren
   - `openclaw browser trace stop` (gibt `TRACE:<path>` aus)

## JSON-Ausgabe

`--json` ist für Skripting und strukturierte Tooling-Nutzung.

Beispiele:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role-Snapshots in JSON enthalten `refs` plus einen kleinen Block `stats` (Zeilen/Zeichen/Refs/interaktiv), damit Tools über Nutzlastgröße und Dichte nachdenken können.

## Status- und Umgebungsoptionen

Diese sind nützlich für Workflows wie „die Website soll sich wie X verhalten“:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (veraltet: `set headers --json '{"X-Debug":"1"}'` wird weiterhin unterstützt)
- HTTP-Basic-Auth: `set credentials user pass` (oder `--clear`)
- Geolokalisierung: `set geo <lat> <lon> --origin "https://example.com"` (oder `--clear`)
- Medien: `set media dark|light|no-preference|none`
- Zeitzone / Gebietsschema: `set timezone ...`, `set locale ...`
- Gerät / Viewport:
  - `set device "iPhone 14"` (Playwright-Gerätevoreinstellungen)
  - `set viewport 1280 720`

## Sicherheit und Datenschutz

- Das Browserprofil openclaw kann angemeldete Sitzungen enthalten; behandeln Sie es als sensibel.
- `browser act kind=evaluate` / `openclaw browser evaluate` und `wait --fn`
  führen beliebiges JavaScript im Seitenkontext aus. Prompt Injection kann
  dies beeinflussen. Deaktivieren Sie es mit `browser.evaluateEnabled=false`, wenn Sie es nicht benötigen.
- Für Logins und Hinweise zu Anti-Bot-Systemen (X/Twitter usw.) siehe [Browser-Login + X/Twitter posting](/tools/browser-login).
- Halten Sie Gateway/Node-Host privat (nur loopback oder Tailnet).
- Entfernte CDP-Endpunkte sind mächtig; tunneln und schützen Sie sie.

Beispiel für strikten Modus (private/interne Ziele standardmäßig blockieren):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Fehlerbehebung

Für Linux-spezifische Probleme (insbesondere snap Chromium) siehe
[Browser-Fehlerbehebung](/tools/browser-linux-troubleshooting).

Für Setups mit WSL2-Gateway + Windows-Chrome auf getrennten Hosts siehe
[WSL2 + Windows + Fehlerbehebung für entferntes Chrome CDP](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Agenten-Tools + wie die Steuerung funktioniert

Der Agent erhält **ein Tool** für Browser-Automatisierung:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (AI oder ARIA).
- `browser act` verwendet die Snapshot-`ref`-IDs zum Klicken/Tippen/Ziehen/Auswählen.
- `browser screenshot` nimmt Pixel auf (ganze Seite oder Element).
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browserprofil auszuwählen (openclaw, chrome oder entferntes CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo sich der Browser befindet.
  - In sandboxed Sitzungen erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` fehlt: sandboxed Sitzungen verwenden standardmäßig `sandbox`, nicht-sandboxed Sitzungen standardmäßig `host`.
  - Wenn ein browserfähiger Node verbunden ist, kann das Tool automatisch dorthin routen, sofern Sie nicht `target="host"` oder `target="node"` festlegen.

Dadurch bleibt der Agent deterministisch und vermeidet fragile Selektoren.

## Verwandt

- [Tools-Überblick](/tools) — alle verfügbaren Agenten-Tools
- [Sandboxing](/de/gateway/sandboxing) — Browser-Steuerung in sandboxed Umgebungen
- [Sicherheit](/de/gateway/security) — Risiken und Härtung der Browser-Steuerung
