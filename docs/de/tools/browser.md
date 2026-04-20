---
read_when:
    - Hinzufügen von agentengesteuerter Browser-Automatisierung
    - Fehlersuche, warum openclaw Ihr eigenes Chrome beeinträchtigt
    - Implementierung von Browser-Einstellungen + Lebenszyklus in der macOS-App
summary: Integrierter Browser-Steuerungsdienst + Aktionsbefehle
title: Browser (von OpenClaw verwaltet)
x-i18n:
    generated_at: "2026-04-20T06:30:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f7d37b34ba48dc7c38f8c2e77f8bb97af987eac6a874ebfc921f950fb59de4b
    source_path: tools/browser.md
    workflow: 15
---

# Browser (von openclaw verwaltet)

OpenClaw kann ein **dediziertes Chrome-/Brave-/Edge-/Chromium-Profil** ausführen, das vom Agenten gesteuert wird.
Es ist von Ihrem persönlichen Browser getrennt und wird über einen kleinen lokalen
Steuerungsdienst innerhalb des Gateway verwaltet (nur loopback).

Ansicht für Einsteiger:

- Stellen Sie es sich als einen **separaten Browser nur für Agenten** vor.
- Das Profil `openclaw` greift **nicht** auf Ihr persönliches Browserprofil zu.
- Der Agent kann in einer sicheren Umgebung **Tabs öffnen, Seiten lesen, klicken und tippen**.
- Das integrierte Profil `user` verbindet sich über Chrome MCP mit Ihrer echten angemeldeten Chrome-Sitzung.

## Was Sie bekommen

- Ein separates Browserprofil namens **openclaw** (standardmäßig mit orangefarbenem Akzent).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agentenaktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr Alltagsbrowser. Er ist eine sichere, isolierte Oberfläche für
Agentenautomatisierung und Überprüfung.

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
nicht verfügbar ist, springen Sie zu [Fehlender Browser-Befehl oder fehlendes Tool](/de/tools/browser#missing-browser-command-or-tool).

## Plugin-Steuerung

Das standardmäßige `browser`-Tool ist jetzt ein gebündeltes Plugin, das standardmäßig
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
`browser`-Toolnamen bereitstellt. Die standardmäßige Browser-Erfahrung benötigt beides:

- `plugins.entries.browser.enabled` darf nicht deaktiviert sein
- `browser.enabled=true`

Wenn Sie nur das Plugin deaktivieren, verschwinden die gebündelte Browser-CLI (`openclaw browser`),
die Gateway-Methode (`browser.request`), das Agenten-Tool und der standardmäßige Browser-Steuerungsdienst
zusammen. Ihre `browser.*`-Konfiguration bleibt für ein Ersatz-Plugin weiterhin intakt.

Das gebündelte Browser-Plugin ist jetzt auch für die Browser-Laufzeitimplementierung zuständig.
Der Core behält nur gemeinsame Plugin-SDK-Helfer sowie Kompatibilitäts-Re-Exports für
ältere interne Importpfade. In der Praxis bedeutet das: Wenn Sie das Browser-Plugin-Paket entfernen oder ersetzen,
wird der Browser-Funktionsumfang entfernt, statt dass eine zweite Core-eigene Laufzeit zurückbleibt.

Änderungen an der Browser-Konfiguration erfordern weiterhin einen Neustart des Gateway, damit das gebündelte Plugin
seinen Browser-Dienst mit den neuen Einstellungen erneut registrieren kann.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade plötzlich ein unbekannter Befehl ist oder
der Agent meldet, dass das Browser-Tool fehlt, ist die häufigste Ursache eine restriktive
`plugins.allow`-Liste, die `browser` nicht enthält.

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
- Wenn Sie keine restriktive Plugin-Allowlist benötigen, stellt das Entfernen von `plugins.allow` ebenfalls das standardmäßige Verhalten des gebündelten Browsers wieder her.

Typische Symptome:

- `openclaw browser` ist ein unbekannter Befehl.
- `browser.request` fehlt.
- Der Agent meldet das Browser-Tool als nicht verfügbar oder fehlend.

## Profile: `openclaw` vs `user`

- `openclaw`: verwalteter, isolierter Browser (keine Erweiterung erforderlich).
- `user`: integriertes Chrome-MCP-Anbindungsprofil für Ihre **echte angemeldete Chrome-**
  Sitzung.

Für Browser-Tool-Aufrufe des Agenten:

- Standard: Verwenden Sie den isolierten Browser `openclaw`.
- Bevorzugen Sie `profile="user"`, wenn bestehende angemeldete Sitzungen wichtig sind und der Benutzer
  am Computer ist, um eine eventuelle Verbindungsaufforderung anzuklicken/zu bestätigen.
- `profile` ist die explizite Überschreibung, wenn Sie einen bestimmten Browsermodus möchten.

Setzen Sie `browser.defaultProfile: "openclaw"`, wenn Sie den verwalteten Modus standardmäßig verwenden möchten.

## Konfiguration

Die Browser-Einstellungen befinden sich in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // Standard: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // nur aktivieren, wenn Zugriff auf vertrauenswürdige private Netzwerke beabsichtigt ist
      // allowPrivateNetwork: true, // veralteter Alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // veraltete Überschreibung für ein einzelnes Profil
    remoteCdpTimeoutMs: 1500, // HTTP-Timeout für Erreichbarkeitsprüfungen von remote CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // WebSocket-Handshake-Timeout für remote CDP (ms)
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

- Der Browser-Steuerungsdienst bindet an loopback auf einem Port, der von `gateway.port`
  abgeleitet wird (Standard: `18791`, also Gateway + 2).
- Wenn Sie den Gateway-Port überschreiben (`gateway.port` oder `OPENCLAW_GATEWAY_PORT`),
  verschieben sich die abgeleiteten Browser-Ports entsprechend, damit sie in derselben „Familie“ bleiben.
- `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn er nicht gesetzt ist.
- `remoteCdpTimeoutMs` gilt für Erreichbarkeitsprüfungen von remote (nicht-loopback) CDP.
- `remoteCdpHandshakeTimeoutMs` gilt für Erreichbarkeitsprüfungen des remote-CDP-WebSocket-Handshakes.
- Browser-Navigation/Tab-Öffnung wird vor der Navigation durch SSRF-Schutz abgesichert und nach der Navigation bestmöglich erneut anhand der endgültigen `http(s)`-URL geprüft.
- Im strikten SSRF-Modus werden auch Discovery/Prüfungen von remote-CDP-Endpunkten (`cdpUrl`, einschließlich `/json/version`-Lookups) geprüft.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert. Setzen Sie es nur auf `true`, wenn Sie Browser-Zugriff auf private Netzwerke bewusst als vertrauenswürdig einstufen.
- `browser.ssrfPolicy.allowPrivateNetwork` wird aus Kompatibilitätsgründen weiterhin als veralteter Alias unterstützt.
- `attachOnly: true` bedeutet: „Niemals einen lokalen Browser starten; nur verbinden, wenn er bereits läuft.“
- `color` + profilspezifisches `color` färben die Browser-Oberfläche ein, damit Sie sehen können, welches Profil aktiv ist.
- Das Standardprofil ist `openclaw` (eigenständiger, von OpenClaw verwalteter Browser). Verwenden Sie `defaultProfile: "user"`, um standardmäßig den angemeldeten Benutzer-Browser zu nutzen.
- Reihenfolge der automatischen Erkennung: Standardbrowser des Systems, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu — setzen Sie diese nur für remote CDP.
- `driver: "existing-session"` verwendet Chrome DevTools MCP statt rohem CDP. Setzen Sie
  für diesen Treiber kein `cdpUrl`.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn sich ein Existing-Session-Profil
  mit einem nicht standardmäßigen Chromium-Benutzerprofil wie Brave oder Edge verbinden soll.

## Brave verwenden (oder einen anderen Chromium-basierten Browser)

Wenn Ihr **Standardbrowser des Systems** Chromium-basiert ist (Chrome/Brave/Edge/usw.),
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

## Lokale vs. remote Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den loopback-Steuerungsdienst und kann einen lokalen Browser starten.
- **Remote-Steuerung (Node-Host):** Führen Sie einen Node-Host auf dem Rechner aus, auf dem sich der Browser befindet; das Gateway leitet Browser-Aktionen an ihn weiter.
- **Remote CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  eine Verbindung zu einem remote Chromium-basierten Browser herzustellen. In diesem Fall startet OpenClaw keinen lokalen Browser.

Das Verhalten beim Stoppen unterscheidet sich je nach Profilmodus:

- lokal verwaltete Profile: `openclaw browser stop` beendet den Browser-Prozess, den
  OpenClaw gestartet hat
- Attach-only- und remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Steuerungssitzung und gibt Playwright-/CDP-Emulationsüberschreibungen frei (Viewport,
  Farbschema, Gebietsschema, Zeitzone, Offline-Modus und ähnliche Zustände), auch
  wenn kein Browser-Prozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Authentifizierung enthalten:

- Query-Token (z. B. `https://provider.example?token=<token>`)
- HTTP Basic Auth (z. B. `https://user:pass@provider.example`)

OpenClaw behält die Authentifizierung bei Aufrufen von `/json/*`-Endpunkten und beim Verbinden
mit dem CDP-WebSocket bei. Bevorzugen Sie Umgebungsvariablen oder Secret-Manager für
Tokens, anstatt sie in Konfigurationsdateien zu committen.

## Node-Browser-Proxy (standardmäßig ohne Konfiguration)

Wenn Sie einen **Node-Host** auf dem Rechner ausführen, auf dem sich Ihr Browser befindet, kann OpenClaw
Browser-Tool-Aufrufe ohne zusätzliche Browser-Konfiguration automatisch an diesen Node weiterleiten.
Dies ist der Standardpfad für remote Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Steuerungsserver über einen **Proxy-Befehl** bereit.
- Profile stammen aus der eigenen `browser.profiles`-Konfiguration des Node (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es leer für das veraltete/standardmäßige Verhalten: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw dies als Least-Privilege-Grenze: Nur allowlistete Profile können angesprochen werden, und dauerhafte Routen zum Erstellen/Löschen von Profilen werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren, wenn Sie es nicht möchten:
  - Auf dem Node: `nodeHost.browserProxy.enabled=false`
  - Auf dem Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (gehostetes remote CDP)

[Browserless](https://browserless.io) ist ein gehosteter Chromium-Dienst, der
CDP-Verbindungs-URLs über HTTPS und WebSocket bereitstellt. OpenClaw kann beide Formen verwenden, aber
für ein remote Browserprofil ist die direkte WebSocket-URL aus der Browserless-Verbindungsdokumentation
die einfachste Option.

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

## Direkte WebSocket-CDP-Anbieter

Einige gehostete Browser-Dienste stellen einen **direkten WebSocket**-Endpunkt statt
der standardmäßigen HTTP-basierten CDP-Erkennung (`/json/version`) bereit. OpenClaw akzeptiert drei
CDP-URL-Formen und wählt automatisch die richtige Verbindungsstrategie:

- **HTTP(S)-Erkennung** — `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu erkennen, und
  verbindet sich dann. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** — `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem Pfad `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw verbindet sich direkt über einen WebSocket-Handshake und überspringt
  `/json/version` vollständig.
- **Einfache WebSocket-Wurzeln** — `ws://host[:port]` oder `wss://host[:port]` ohne
  `/devtools/...`-Pfad (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zuerst die HTTP-
  `/json/version`-Erkennung (unter Normalisierung des Schemas auf `http`/`https`);
  wenn die Erkennung eine `webSocketDebuggerUrl` zurückgibt, wird diese verwendet, andernfalls greift OpenClaw
  auf einen direkten WebSocket-Handshake an der einfachen Wurzel zurück. Dies deckt
  sowohl Chrome-ähnliche Remote-Debug-Ports als auch reine WebSocket-Anbieter ab.

Einfaches `ws://host:port` / `wss://host:port` ohne `/devtools/...`-Pfad,
das auf eine lokale Chrome-Instanz zeigt, wird über den Erkennung-zuerst-
Fallback unterstützt — Chrome akzeptiert WebSocket-Upgrades nur auf dem spezifischen Browser-
oder Zielpfad, der von `/json/version` zurückgegeben wird, daher würde ein einfacher Root-Handshake allein
fehlschlagen.

### Browserbase

[Browserbase](https://www.browserbase.com) ist eine Cloud-Plattform zum Ausführen
von headless Browsern mit integrierter CAPTCHA-Lösung, Tarnmodus und Residential-
Proxys.

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

- [Registrieren Sie sich](https://www.browserbase.com/sign-up) und kopieren Sie Ihren **API-Schlüssel**
  aus dem [Overview-Dashboard](https://www.browserbase.com/overview).
- Ersetzen Sie `<BROWSERBASE_API_KEY>` durch Ihren echten Browserbase-API-Schlüssel.
- Browserbase erstellt beim WebSocket-Verbindungsaufbau automatisch eine Browser-Sitzung, daher ist
  kein manueller Schritt zur Sitzungserstellung erforderlich.
- Die kostenlose Stufe erlaubt eine gleichzeitige Sitzung und eine Browserstunde pro Monat.
  Siehe [Preise](https://www.browserbase.com/pricing) für Limits kostenpflichtiger Tarife.
- Siehe die [Browserbase-Dokumentation](https://docs.browserbase.com) für die vollständige API-
  Referenz, SDK-Anleitungen und Integrationsbeispiele.

## Sicherheit

Wichtige Konzepte:

- Die Browser-Steuerung ist nur über loopback erreichbar; der Zugriff läuft über die Authentifizierung oder Node-Kopplung des Gateway.
- Die eigenständige loopback-Browser-HTTP-API verwendet **nur Shared-Secret-Authentifizierung**:
  Gateway-Token-Bearer-Auth, `x-openclaw-password` oder HTTP Basic Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale-Serve-Identitäts-Header und `gateway.auth.mode: "trusted-proxy"` authentifizieren
  diese eigenständige loopback-Browser-API **nicht**.
- Wenn die Browser-Steuerung aktiviert ist und keine Shared-Secret-Authentifizierung konfiguriert wurde, generiert OpenClaw
  beim Start automatisch `gateway.auth.token` und speichert es in der Konfiguration.
- OpenClaw generiert dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie das Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Freigabe.
- Behandeln Sie remote CDP-URLs/-Tokens als Geheimnisse; bevorzugen Sie Umgebungsvariablen oder einen Secret-Manager.

Tipps zu remote CDP:

- Bevorzugen Sie verschlüsselte Endpunkte (HTTPS oder WSS) und nach Möglichkeit kurzlebige Tokens.
- Vermeiden Sie es, langlebige Tokens direkt in Konfigurationsdateien einzubetten.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **von openclaw verwaltet**: eine dedizierte Chromium-basierte Browser-Instanz mit eigenem User-Data-Verzeichnis + CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser, der anderswo läuft)
- **bestehende Sitzung**: Ihr bestehendes Chrome-Profil über die automatische Verbindung von Chrome DevTools MCP

Standardwerte:

- Das Profil `openclaw` wird automatisch erstellt, falls es fehlt.
- Das Profil `user` ist für die Anbindung einer bestehenden Sitzung über Chrome MCP integriert.
- Profile für bestehende Sitzungen sind zusätzlich zu `user` optional; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800–18899** zugewiesen.
- Beim Löschen eines Profils wird dessen lokales Datenverzeichnis in den Papierkorb verschoben.

Alle Steuerungsendpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Bestehende Sitzung über Chrome DevTools MCP

OpenClaw kann sich auch über den offiziellen Chrome DevTools MCP-Server an ein laufendes Chromium-basiertes Browserprofil anhängen. Dadurch werden die Tabs und der Anmeldestatus
wiederverwendet, die in diesem Browserprofil bereits geöffnet sind.

Offizielle Hintergrund- und Einrichtungsreferenzen:

- [Chrome for Developers: Chrome DevTools MCP mit Ihrer Browsersitzung verwenden](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Integriertes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes Existing-Session-Profil, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis möchten.

Standardverhalten:

- Das integrierte Profil `user` verwendet die automatische Verbindung von Chrome MCP, die auf das
  lokale Standardprofil von Google Chrome zielt.

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
3. Lassen Sie den Browser weiterlaufen und bestätigen Sie die Verbindungsaufforderung, wenn OpenClaw sich anhängt.

Häufige Inspektionsseiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-Smoke-Test für das Anhängen:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Woran Sie Erfolg erkennen:

- `status` zeigt `driver: existing-session`
- `status` zeigt `transport: chrome-mcp`
- `status` zeigt `running: true`
- `tabs` listet Ihre bereits geöffneten Browser-Tabs auf
- `snapshot` gibt Refs vom ausgewählten Live-Tab zurück

Was Sie prüfen sollten, wenn das Anhängen nicht funktioniert:

- der Zielbrowser auf Chromium-Basis hat Version `144+`
- Remote-Debugging ist auf der Inspektionsseite dieses Browsers aktiviert
- der Browser hat die Zustimmungsaufforderung zum Anhängen angezeigt und Sie haben sie bestätigt
- `openclaw doctor` migriert alte browserbasierte Konfigurationen mit Erweiterungen und prüft, dass
  Chrome lokal für Standardprofile mit automatischer Verbindung installiert ist, kann jedoch
  browserseitiges Remote-Debugging nicht für Sie aktivieren

Agenten-Nutzung:

- Verwenden Sie `profile="user"`, wenn Sie den angemeldeten Browser-Zustand des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Existing-Session-Profil verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Computer sitzt, um die Verbindungsaufforderung
  zu bestätigen.
- das Gateway oder der Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Weg ist risikoreicher als das isolierte Profil `openclaw`, da er
  innerhalb Ihrer angemeldeten Browser-Sitzung agieren kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es hängt sich nur an eine
  bestehende Sitzung an.
- OpenClaw verwendet hier den offiziellen `--autoConnect`-Ablauf von Chrome DevTools MCP. Wenn
  `userDataDir` gesetzt ist, gibt OpenClaw ihn weiter, um dieses explizite
  Chromium-User-Data-Verzeichnis anzusprechen.
- Screenshots bei bestehenden Sitzungen unterstützen Seitenaufnahmen und `--ref`-Element-
  Aufnahmen aus Snapshots, aber keine CSS-Selektoren über `--element`.
- Seiten-Screenshots bei bestehenden Sitzungen funktionieren ohne Playwright über Chrome MCP.
  Ref-basierte Element-Screenshots (`--ref`) funktionieren dort ebenfalls, aber `--full-page`
  kann nicht mit `--ref` oder `--element` kombiniert werden.
- Aktionen bei bestehenden Sitzungen sind weiterhin eingeschränkter als im verwalteten Browser-
  Pfad:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern
    Snapshot-Refs statt CSS-Selektoren
  - `click` unterstützt nur die linke Maustaste (keine Überschreibung der Taste oder Modifikatoren)
  - `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`
  - `press` unterstützt `delayMs` nicht
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen
    keine Timeout-Überschreibungen pro Aufruf
  - `select` unterstützt derzeit nur einen einzelnen Wert
- Existing-Session-`wait --url` unterstützt exakte, Teilstring- und Glob-Muster
  wie andere Browser-Treiber. `wait --load networkidle` wird noch nicht unterstützt.
- Upload-Hooks für bestehende Sitzungen erfordern `ref` oder `inputRef`, unterstützen jeweils
  nur eine Datei und unterstützen keine CSS-`element`-Adressierung.
- Dialog-Hooks für bestehende Sitzungen unterstützen keine Timeout-Überschreibungen.
- Einige Funktionen erfordern weiterhin den verwalteten Browser-Pfad, darunter Batch-
  Aktionen, PDF-Export, Download-Interception und `responsebody`.
- Existing-Session kann sich auf dem ausgewählten Host oder über einen verbundenen
  Browser-Node anhängen. Wenn sich Chrome anderswo befindet und kein Browser-Node verbunden ist, verwenden Sie
  stattdessen remote CDP oder einen Node-Host.

## Isolationsgarantien

- **Dediziertes User-Data-Verzeichnis**: greift niemals auf Ihr persönliches Browserprofil zu.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungsabläufen zu verhindern.
- **Deterministische Tab-Steuerung**: zielt auf Tabs über `targetId`, nicht über den „letzten Tab“.

## Browser-Auswahl

Beim lokalen Start wählt OpenClaw den ersten verfügbaren Browser:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Sie können dies mit `browser.executablePath` überschreiben.

Plattformen:

- macOS: prüft `/Applications` und `~/Applications`.
- Linux: sucht nach `google-chrome`, `brave`, `microsoft-edge`, `chromium` usw.
- Windows: prüft gängige Installationsorte.

## Steuerungs-API (optional)

Nur für lokale Integrationen stellt das Gateway eine kleine loopback-HTTP-API bereit:

- Status/Start/Stopp: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/Screenshot: `GET /snapshot`, `POST /screenshot`
- Aktionen: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Netzwerk: `POST /response/body`
- Zustand: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Zustand: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Einstellungen: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Alle Endpunkte akzeptieren `?profile=<name>`.

Wenn Shared-Secret-Gateway-Authentifizierung konfiguriert ist, erfordern auch die Browser-HTTP-Routen Authentifizierung:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oder HTTP Basic Auth mit diesem Passwort

Hinweise:

- Diese eigenständige loopback-Browser-API verarbeitet **keine** Trusted-Proxy- oder
  Tailscale-Serve-Identitäts-Header.
- Wenn `gateway.auth.mode` `none` oder `trusted-proxy` ist, übernehmen diese loopback-Browser-
  Routen diese identitätstragenden Modi nicht; halten Sie sie auf loopback beschränkt.

### Fehlervertrag für `/act`

`POST /act` verwendet eine strukturierte Fehlerantwort für Validierung auf Routenebene und
Richtlinienfehler:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktuelle `code`-Werte:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` fehlt oder wird nicht erkannt.
- `ACT_INVALID_REQUEST` (HTTP 400): Die Aktions-Payload hat die Normalisierung oder Validierung nicht bestanden.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` wurde mit einer nicht unterstützten Aktionsart verwendet.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oder `wait --fn`) ist per Konfiguration deaktiviert.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` auf oberster Ebene oder in Stapelaktionen steht im Konflikt mit dem Anforderungsziel.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): Die Aktion wird für Existing-Session-Profile nicht unterstützt.

Andere Laufzeitfehler können weiterhin `{ "error": "<message>" }` ohne ein
Feld `code` zurückgeben.

### Playwright-Anforderung

Einige Funktionen (navigate/act/AI-Snapshot/Role-Snapshot, Element-Screenshots,
PDF) erfordern Playwright. Wenn Playwright nicht installiert ist, geben diese Endpunkte
einen klaren 501-Fehler zurück.

Was ohne Playwright weiterhin funktioniert:

- ARIA-Snapshots
- Seiten-Screenshots für den verwalteten Browser `openclaw`, wenn ein CDP-
  WebSocket pro Tab verfügbar ist
- Seiten-Screenshots für Profile `existing-session` / Chrome MCP
- Ref-basierte Screenshots (`--ref`) aus Snapshot-Ausgaben für `existing-session`

Was weiterhin Playwright benötigt:

- `navigate`
- `act`
- AI-Snapshots / Role-Snapshots
- CSS-Selektor-Element-Screenshots (`--element`)
- vollständiger Browser-PDF-Export

Element-Screenshots lehnen auch `--full-page` ab; die Route gibt `fullPage is
not supported for element screenshots` zurück.

Wenn Sie `Playwright is not available in this gateway build` sehen, installieren Sie das vollständige
Playwright-Paket (nicht `playwright-core`) und starten Sie das Gateway neu oder installieren Sie
OpenClaw mit Browser-Unterstützung neu.

#### Docker-Playwright-Installation

Wenn Ihr Gateway in Docker läuft, vermeiden Sie `npx playwright` (npm-Override-Konflikte).
Verwenden Sie stattdessen die gebündelte CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Um Browser-Downloads dauerhaft zu speichern, setzen Sie `PLAYWRIGHT_BROWSERS_PATH` (zum Beispiel
`/home/node/.cache/ms-playwright`) und stellen Sie sicher, dass `/home/node` über
`OPENCLAW_HOME_VOLUME` oder ein Bind-Mount persistent gespeichert wird. Siehe [Docker](/de/install/docker).

## Funktionsweise (intern)

Ablauf auf hoher Ebene:

- Ein kleiner **Steuerungsserver** akzeptiert HTTP-Anfragen.
- Er verbindet sich über **CDP** mit Chromium-basierten Browsern (Chrome/Brave/Edge/Chromium).
- Für erweiterte Aktionen (click/type/snapshot/PDF) verwendet er **Playwright** auf Basis
  von CDP.
- Wenn Playwright fehlt, sind nur Operationen ohne Playwright verfügbar.

Dieses Design hält den Agenten auf einer stabilen, deterministischen Schnittstelle, während
Sie lokale/remote Browser und Profile austauschen können.

## CLI-Kurzreferenz

Alle Befehle akzeptieren `--browser-profile <name>`, um ein bestimmtes Profil anzusprechen.
Alle Befehle akzeptieren außerdem `--json` für maschinenlesbare Ausgaben (stabile Payloads).

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

- Für Attach-only- und remote-CDP-Profile ist `openclaw browser stop` weiterhin der
  richtige Bereinigungsbefehl nach Tests. Er schließt die aktive Steuerungssitzung und
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

Zustand:

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

- `upload` und `dialog` sind **Vorbereitungs**-Aufrufe; führen Sie sie vor dem Klick/Tastendruck aus,
  der den Dateiauswahldialog/Dialog auslöst.
- Download- und Trace-Ausgabepfade sind auf OpenClaw-Temp-Wurzeln beschränkt:
  - Traces: `/tmp/openclaw` (Fallback: `${os.tmpdir()}/openclaw`)
  - Downloads: `/tmp/openclaw/downloads` (Fallback: `${os.tmpdir()}/openclaw/downloads`)
- Upload-Pfade sind auf eine OpenClaw-Temp-Wurzel für Uploads beschränkt:
  - Uploads: `/tmp/openclaw/uploads` (Fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` kann Dateieingaben auch direkt über `--input-ref` oder `--element` setzen.
- `snapshot`:
  - `--format ai` (Standard, wenn Playwright installiert ist): gibt einen AI-Snapshot mit numerischen Refs (`aria-ref="<n>"`) zurück.
  - `--format aria`: gibt den Barrierefreiheitsbaum zurück (keine Refs; nur Inspektion).
  - `--efficient` (oder `--mode efficient`): kompaktes Preset für Role-Snapshots (interaktiv + kompakt + Tiefe + geringere maxChars).
  - Konfigurationsstandard (nur Tool/CLI): Setzen Sie `browser.snapshotDefaults.mode: "efficient"`, um effiziente Snapshots zu verwenden, wenn der Aufrufer keinen Modus übergibt (siehe [Gateway-Konfiguration](/de/gateway/configuration-reference#browser)).
  - Role-Snapshot-Optionen (`--interactive`, `--compact`, `--depth`, `--selector`) erzwingen einen rollenbasierten Snapshot mit Refs wie `ref=e12`.
  - `--frame "<iframe selector>"` begrenzt Role-Snapshots auf ein iframe (gepaart mit Rollen-Refs wie `e12`).
  - `--interactive` gibt eine flache, leicht auswählbare Liste interaktiver Elemente aus (am besten zum Ausführen von Aktionen).
  - `--labels` fügt einen Screenshot nur des Viewports mit eingeblendeten Ref-Labels hinzu (gibt `MEDIA:<path>` aus).
- `click`/`type`/usw. erfordern einen `ref` aus `snapshot` (entweder numerisch `12` oder Rollen-Ref `e12`).
  CSS-Selektoren werden für Aktionen absichtlich nicht unterstützt.

## Snapshots und Refs

OpenClaw unterstützt zwei Arten von „Snapshots“:

- **AI-Snapshot (numerische Refs)**: `openclaw browser snapshot` (Standard; `--format ai`)
  - Ausgabe: ein Text-Snapshot, der numerische Refs enthält.
  - Aktionen: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wird der Ref über Playwrights `aria-ref` aufgelöst.

- **Role-Snapshot (Rollen-Refs wie `e12`)**: `openclaw browser snapshot --interactive` (oder `--compact`, `--depth`, `--selector`, `--frame`)
  - Ausgabe: eine rollenbasierte Liste/ein Baum mit `[ref=e12]` (und optional `[nth=1]`).
  - Aktionen: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wird der Ref über `getByRole(...)` aufgelöst (plus `nth()` bei Duplikaten).
  - Fügen Sie `--labels` hinzu, um einen Viewport-Screenshot mit eingeblendeten `e12`-Labels einzuschließen.

Ref-Verhalten:

- Refs sind **über Navigationen hinweg nicht stabil**; wenn etwas fehlschlägt, führen Sie `snapshot` erneut aus und verwenden Sie einen neuen Ref.
- Wenn der Role-Snapshot mit `--frame` aufgenommen wurde, sind Rollen-Refs bis zum nächsten Role-Snapshot auf dieses iframe beschränkt.

## Erweiterte Wartefunktionen

Sie können auf mehr als nur Zeit/Text warten:

- Auf URL warten (Globs werden von Playwright unterstützt):
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
2. Verwenden Sie `click <ref>` / `type <ref>` (bevorzugen Sie Rollen-Refs im interaktiven Modus)
3. Wenn es weiterhin fehlschlägt: `openclaw browser highlight <ref>`, um zu sehen, worauf Playwright zielt
4. Wenn sich die Seite seltsam verhält:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Für tiefgehendes Debugging: Zeichnen Sie einen Trace auf:
   - `openclaw browser trace start`
   - reproduzieren Sie das Problem
   - `openclaw browser trace stop` (gibt `TRACE:<path>` aus)

## JSON-Ausgabe

`--json` ist für Skripting und strukturierte Tooling-Ausgaben gedacht.

Beispiele:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role-Snapshots in JSON enthalten `refs` plus einen kleinen Block `stats` (Zeilen/Zeichen/Refs/interaktiv), damit Tools über Payload-Größe und Dichte entscheiden können.

## Zustands- und Umgebungsoptionen

Diese sind nützlich für Workflows wie „die Website soll sich wie X verhalten“:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (das ältere `set headers --json '{"X-Debug":"1"}'` wird weiterhin unterstützt)
- HTTP Basic Auth: `set credentials user pass` (oder `--clear`)
- Geolokalisierung: `set geo <lat> <lon> --origin "https://example.com"` (oder `--clear`)
- Medien: `set media dark|light|no-preference|none`
- Zeitzone / Gebietsschema: `set timezone ...`, `set locale ...`
- Gerät / Viewport:
  - `set device "iPhone 14"` (Playwright-Gerätevoreinstellungen)
  - `set viewport 1280 720`

## Sicherheit & Datenschutz

- Das Browserprofil `openclaw` kann angemeldete Sitzungen enthalten; behandeln Sie es als sensibel.
- `browser act kind=evaluate` / `openclaw browser evaluate` und `wait --fn`
  führen beliebiges JavaScript im Seitenkontext aus. Prompt Injection kann dies
  beeinflussen. Deaktivieren Sie es mit `browser.evaluateEnabled=false`, wenn Sie es nicht benötigen.
- Für Anmeldungen und Hinweise zu Anti-Bot-Systemen (X/Twitter usw.) siehe [Browser-Anmeldung + X/Twitter-Posting](/de/tools/browser-login).
- Halten Sie das Gateway/den Node-Host privat (nur loopback oder Tailnet).
- Remote-CDP-Endpunkte sind mächtig; tunneln und schützen Sie sie.

Beispiel für den Strict-Mode (private/interne Ziele standardmäßig blockieren):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optionale exakte Freigabe
    },
  },
}
```

## Fehlerbehebung

Für Linux-spezifische Probleme (insbesondere snap Chromium) siehe
[Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting).

Für WSL2-Gateway- + Windows-Chrome-Setups mit aufgeteilten Hosts siehe
[Fehlerbehebung für WSL2 + Windows + remote Chrome CDP](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. SSRF-Blockierung bei Navigation

Dies sind unterschiedliche Fehlerklassen und sie verweisen auf unterschiedliche Codepfade.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Steuerungsebene fehlerfrei funktioniert.
- **SSRF-Blockierung bei Navigation** bedeutet, dass die Browser-Steuerungsebene fehlerfrei funktioniert, aber ein Navigationsziel der Seite von der Richtlinie abgelehnt wird.

Häufige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- SSRF-Blockierung bei Navigation:
  - `open`, `navigate`, Snapshot- oder Tab-Öffnungsabläufe schlagen mit einem Browser-/Netzwerk-Richtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um die beiden Fälle zu unterscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So lesen Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Steuerungsebene weiterhin fehlerhaft. Behandeln Sie dies als CDP-Erreichbarkeitsproblem, nicht als Problem bei der Seitennavigation.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Steuerungsebene aktiv und der Fehler liegt in der Navigationsrichtlinie oder auf der Zielseite.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende Steuerungspfad des verwalteten Browsers fehlerfrei.

Wichtige Verhaltensdetails:

- Die Browser-Konfiguration verwendet standardmäßig ein fehlersicher geschlossenes SSRF-Richtlinienobjekt, auch wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokale loopback-verwaltete Profil `openclaw` überspringen CDP-Health-Checks absichtlich die SSRF-Erreichbarkeitsprüfung des Browsers für die eigene lokale Steuerungsebene von OpenClaw.
- Der Navigationsschutz ist davon getrennt. Ein erfolgreiches Ergebnis bei `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel von `open` oder `navigate` zulässig ist.

Sicherheitshinweise:

- Lockern Sie die Browser-SSRF-Richtlinie standardmäßig **nicht**.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` statt breiten Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in bewusst vertrauenswürdigen Umgebungen, in denen Browser-Zugriff auf private Netzwerke erforderlich und geprüft ist.

Beispiel: Navigation blockiert, Steuerungsebene fehlerfrei

- `start` erfolgreich
- `tabs` erfolgreich
- `open http://internal.example` fehlschlägt

Das bedeutet in der Regel, dass der Browser-Start in Ordnung ist und das Navigationsziel richtlinienseitig überprüft werden muss.

Beispiel: Start blockiert, bevor Navigation relevant wird

- `start` schlägt mit `not reachable after start` fehl
- `tabs` schlägt ebenfalls fehl oder kann nicht ausgeführt werden

Das weist auf Browser-Start oder CDP-Erreichbarkeit hin, nicht auf ein Problem mit der Allowlist für Seiten-URLs.

## Agenten-Tools + wie die Steuerung funktioniert

Der Agent erhält **ein Tool** für Browser-Automatisierung:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (AI oder ARIA).
- `browser act` verwendet die `ref`-IDs aus dem Snapshot für click/type/drag/select.
- `browser screenshot` erfasst Pixel (gesamte Seite oder Element).
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browserprofil auszuwählen (openclaw, chrome oder remote CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo sich der Browser befindet.
  - In Sandbox-Sitzungen erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` weggelassen wird: In Sandbox-Sitzungen ist der Standard `sandbox`, in Nicht-Sandbox-Sitzungen `host`.
  - Wenn ein browserfähiger Node verbunden ist, kann das Tool automatisch dorthin weiterleiten, sofern Sie nicht `target="host"` oder `target="node"` festlegen.

Dadurch bleibt der Agent deterministisch und vermeidet fragile Selektoren.

## Verwandt

- [Tools-Übersicht](/de/tools) — alle verfügbaren Agenten-Tools
- [Sandboxing](/de/gateway/sandboxing) — Browser-Steuerung in Sandbox-Umgebungen
- [Sicherheit](/de/gateway/security) — Risiken und Härtung der Browser-Steuerung
