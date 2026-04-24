---
read_when:
    - Agentengesteuerte Browser-Automatisierung hinzufügen.
    - Debuggen, warum OpenClaw Ihr eigenes Chrome stört
    - Browsereinstellungen + Lifecycle in der macOS-App implementieren.
summary: Integrierter Browser-Control-Service + Action-Befehle
title: Browser (OpenClaw-verwaltet)
x-i18n:
    generated_at: "2026-04-24T07:01:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fb0fc0b6235fa8a0324b754e247e015d5ca19d114d324d565ed4a19f9313f7e
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw kann ein **dediziertes Chrome-/Brave-/Edge-/Chromium-Profil** ausführen, das der Agent steuert.
Es ist von Ihrem persönlichen Browser isoliert und wird über einen kleinen lokalen
Control-Service innerhalb des Gateway verwaltet (nur loopback).

Einfach erklärt:

- Stellen Sie es sich als **separaten Browser nur für den Agenten** vor.
- Das Profil `openclaw` berührt **nicht** Ihr persönliches Browser-Profil.
- Der Agent kann **Tabs öffnen, Seiten lesen, klicken und tippen** in einer sicheren Spur.
- Das eingebaute Profil `user` hängt sich über Chrome MCP an Ihre echte eingeloggte Chrome-Sitzung an.

## Was Sie bekommen

- Ein separates Browser-Profil namens **openclaw** (standardmäßig mit orangem Akzent).
- Deterministische Tab-Steuerung (auflisten/öffnen/fokussieren/schließen).
- Agent-Aktionen (klicken/tippen/ziehen/auswählen), Snapshots, Screenshots, PDFs.
- Optionale Unterstützung für mehrere Profile (`openclaw`, `work`, `remote`, ...).

Dieser Browser ist **nicht** Ihr Daily Driver. Er ist eine sichere, isolierte Oberfläche für
Agent-Automatisierung und Verifikation.

## Schnellstart

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Wenn Sie „Browser disabled“ erhalten, aktivieren Sie ihn in der Konfiguration (siehe unten) und starten Sie das
Gateway neu.

Wenn `openclaw browser` vollständig fehlt oder der Agent sagt, dass das Browser-Tool
nicht verfügbar ist, springen Sie zu [Missing browser command or tool](/de/tools/browser#missing-browser-command-or-tool).

## Plugin-Steuerung

Das Standard-Tool `browser` ist ein gebündeltes Plugin. Deaktivieren Sie es, um es durch ein anderes Plugin zu ersetzen, das denselben Tool-Namen `browser` registriert:

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

Standardeinstellungen benötigen sowohl `plugins.entries.browser.enabled` **als auch** `browser.enabled=true`. Wenn Sie nur das Plugin deaktivieren, verschwinden `openclaw browser` CLI, die Gateway-Methode `browser.request`, das Agent-Tool und der Control-Service als Einheit; Ihre `browser.*`-Konfiguration bleibt für einen Ersatz intakt.

Änderungen an der Browser-Konfiguration erfordern einen Neustart des Gateway, damit das Plugin seinen Service neu registrieren kann.

## Fehlender Browser-Befehl oder fehlendes Tool

Wenn `openclaw browser` nach einem Upgrade unbekannt ist, `browser.request` fehlt oder der Agent meldet, dass das Browser-Tool nicht verfügbar ist, ist die übliche Ursache eine `plugins.allow`-Liste, in der `browser` fehlt. Fügen Sie es hinzu:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` und `tools.alsoAllow: ["browser"]` ersetzen die Mitgliedschaft in der Allowlist nicht — die Allowlist steuert das Laden von Plugins, und die Tool-Richtlinie greift erst nach dem Laden. Das vollständige Entfernen von `plugins.allow` stellt ebenfalls das Standardverhalten wieder her.

## Profile: `openclaw` vs `user`

- `openclaw`: verwalteter, isolierter Browser (keine Extension erforderlich).
- `user`: eingebautes Chrome-MCP-Attach-Profil für Ihre **echte eingeloggte Chrome**-
  Sitzung.

Für Browser-Tool-Aufrufe des Agenten:

- Standard: den isolierten Browser `openclaw` verwenden.
- `profile="user"` bevorzugen, wenn bestehende eingeloggte Sitzungen wichtig sind und der Benutzer
  am Rechner sitzt, um auf ein mögliches Attach-Prompt zu klicken/zuzustimmen.
- `profile` ist die explizite Überschreibung, wenn Sie einen bestimmten Browser-Modus möchten.

Setzen Sie `browser.defaultProfile: "openclaw"`, wenn Sie den verwalteten Modus standardmäßig möchten.

## Konfiguration

Browser-Einstellungen liegen in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // Standard: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // nur bewusst für vertrauenswürdigen Zugriff auf private Netzwerke aktivieren
      // allowPrivateNetwork: true, // Legacy-Alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // alte Single-Profile-Überschreibung
    remoteCdpTimeoutMs: 1500, // Remote-CDP-HTTP-Timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // Remote-CDP-WebSocket-Handshake-Timeout (ms)
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

<AccordionGroup>

<Accordion title="Ports und Erreichbarkeit">

- Der Control-Service bindet an loopback auf einem Port, der aus `gateway.port` abgeleitet wird (Standard `18791` = gateway + 2). Wenn `gateway.port` oder `OPENCLAW_GATEWAY_PORT` überschrieben wird, verschieben sich die abgeleiteten Ports derselben Familie entsprechend.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setzen Sie diese nur für Remote-CDP. `cdpUrl` verwendet standardmäßig den verwalteten lokalen CDP-Port, wenn nicht gesetzt.
- `remoteCdpTimeoutMs` gilt für HTTP-Erreichbarkeitsprüfungen bei Remote-CDP (nicht-loopback); `remoteCdpHandshakeTimeoutMs` gilt für WebSocket-Handshakes bei Remote-CDP.

</Accordion>

<Accordion title="SSRF-Richtlinie">

- Browser-Navigation und Öffnen von Tabs werden vor der Navigation durch SSRF-Gates geschützt und anschließend best-effort erneut anhand der finalen `http(s)`-URL geprüft.
- Im strikten SSRF-Modus werden auch Discovery von Remote-CDP-Endpunkten und Probes auf `/json/version` (`cdpUrl`) geprüft.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig deaktiviert; aktivieren Sie es nur, wenn Browser-Zugriff auf private Netzwerke bewusst als vertrauenswürdig gilt.
- `browser.ssrfPolicy.allowPrivateNetwork` bleibt als Legacy-Alias unterstützt.

</Accordion>

<Accordion title="Profilverhalten">

- `attachOnly: true` bedeutet, niemals einen lokalen Browser zu starten; nur anhängen, wenn bereits einer läuft.
- `color` (Top-Level und pro Profil) färbt die Browser-UI ein, damit Sie sehen können, welches Profil aktiv ist.
- Standardprofil ist `openclaw` (verwaltete Standalone-Variante). Verwenden Sie `defaultProfile: "user"`, um standardmäßig den eingeloggten Benutzer-Browser zu verwenden.
- Reihenfolge der Auto-Erkennung: Standardbrowser des Systems, wenn Chromium-basiert; andernfalls Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` verwendet Chrome DevTools MCP statt rohem CDP. Setzen Sie für diesen Treiber kein `cdpUrl`.
- Setzen Sie `browser.profiles.<name>.userDataDir`, wenn ein Profil mit `existing-session` an ein nicht standardmäßiges Chromium-Benutzerprofil (Brave, Edge usw.) angehängt werden soll.

</Accordion>

</AccordionGroup>

## Brave verwenden (oder einen anderen Chromium-basierten Browser)

Wenn Ihr **Standardbrowser des Systems** Chromium-basiert ist (Chrome/Brave/Edge/etc),
verwendet OpenClaw ihn automatisch. Setzen Sie `browser.executablePath`, um die
Auto-Erkennung zu überschreiben:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Oder setzen Sie es in der Konfiguration, je Plattform:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## Lokale vs. Remote-Steuerung

- **Lokale Steuerung (Standard):** Das Gateway startet den loopback-Control-Service und kann einen lokalen Browser starten.
- **Remote-Steuerung (Node-Host):** Führen Sie einen Node-Host auf der Maschine aus, die den Browser hat; das Gateway proxyt Browser-Aktionen dorthin.
- **Remote-CDP:** Setzen Sie `browser.profiles.<name>.cdpUrl` (oder `browser.cdpUrl`), um
  sich an einen entfernten Chromium-basierten Browser anzuhängen. In diesem Fall startet OpenClaw keinen lokalen Browser.

Das Verhalten beim Stoppen unterscheidet sich je nach Profilmodus:

- lokal verwaltete Profile: `openclaw browser stop` stoppt den Browser-Prozess, den
  OpenClaw gestartet hat
- Attach-only- und Remote-CDP-Profile: `openclaw browser stop` schließt die aktive
  Control-Sitzung und gibt Emulations-Overrides von Playwright/CDP frei (Viewport,
  Farbschema, Locale, Zeitzone, Offline-Modus und ähnlichen Zustand), auch
  wenn kein Browser-Prozess von OpenClaw gestartet wurde

Remote-CDP-URLs können Auth enthalten:

- Query-Tokens (z. B. `https://provider.example?token=<token>`)
- HTTP Basic auth (z. B. `https://user:pass@provider.example`)

OpenClaw behält die Auth bei Aufrufen von Endpunkten `/json/*` und bei der Verbindung
zum CDP-WebSocket bei. Bevorzugen Sie Umgebungsvariablen oder Secrets-Manager für
Tokens, statt sie in Konfigurationsdateien zu committen.

## Browser-Proxy für Nodes (Zero-Config-Standard)

Wenn Sie einen **Node-Host** auf der Maschine ausführen, die Ihren Browser hat, kann OpenClaw
Browser-Tool-Aufrufe ohne zusätzliche Browser-Konfiguration automatisch an diesen Node routen.
Dies ist der Standardpfad für Remote-Gateways.

Hinweise:

- Der Node-Host stellt seinen lokalen Browser-Control-Server über einen **Proxy-Befehl** bereit.
- Profile kommen aus der eigenen `browser.profiles`-Konfiguration des Node (wie lokal).
- `nodeHost.browserProxy.allowProfiles` ist optional. Lassen Sie es leer für das alte/Standardverhalten: Alle konfigurierten Profile bleiben über den Proxy erreichbar, einschließlich Routen zum Erstellen/Löschen von Profilen.
- Wenn Sie `nodeHost.browserProxy.allowProfiles` setzen, behandelt OpenClaw dies als Least-Privilege-Grenze: Nur Profile auf der Allowlist können angesprochen werden, und dauerhafte Routen zum Erstellen/Löschen von Profilen werden auf der Proxy-Oberfläche blockiert.
- Deaktivieren Sie es, wenn Sie es nicht möchten:
  - Auf dem Node: `nodeHost.browserProxy.enabled=false`
  - Auf dem Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (gehostetes Remote-CDP)

[Browserless](https://browserless.io) ist ein gehosteter Chromium-Service, der
CDP-Verbindungs-URLs über HTTPS und WebSocket bereitstellt. OpenClaw kann beide Formen verwenden, aber
für ein Remote-Browserprofil ist die einfachste Option die direkte WebSocket-URL
aus der Verbindungsdokumentation von Browserless.

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
- Wenn Browserless Ihnen eine HTTPS-Base-URL gibt, können Sie sie entweder zu
  `wss://` für eine direkte CDP-Verbindung umwandeln oder die HTTPS-URL beibehalten und OpenClaw
  `/json/version` erkennen lassen.

## Direkte WebSocket-CDP-Provider

Einige gehostete Browser-Dienste stellen einen **direkten WebSocket**-Endpunkt bereit statt
der standardmäßigen HTTP-basierten CDP-Discovery (`/json/version`). OpenClaw akzeptiert drei
CDP-URL-Formen und wählt die richtige Verbindungsstrategie automatisch:

- **HTTP(S)-Discovery** — `http://host[:port]` oder `https://host[:port]`.
  OpenClaw ruft `/json/version` auf, um die WebSocket-Debugger-URL zu erkennen, und
  verbindet sich dann. Kein WebSocket-Fallback.
- **Direkte WebSocket-Endpunkte** — `ws://host[:port]/devtools/<kind>/<id>` oder
  `wss://...` mit einem Pfad `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw verbindet sich direkt über einen WebSocket-Handshake und überspringt
  `/json/version` vollständig.
- **Bare WebSocket roots** — `ws://host[:port]` oder `wss://host[:port]` ohne
  `/devtools/...`-Pfad (z. B. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw versucht zuerst HTTP-
  Discovery über `/json/version` (normalisiert das Schema zu `http`/`https`);
  wenn die Discovery ein `webSocketDebuggerUrl` zurückgibt, wird diese verwendet, andernfalls fällt OpenClaw
  auf einen direkten WebSocket-Handshake am nackten Root zurück. Dadurch kann ein
  nacktes `ws://`, das auf lokales Chrome zeigt, trotzdem verbinden, da Chrome WebSocket-Upgrades nur auf dem spezifischen Pfad pro Ziel aus
  `/json/version` akzeptiert.

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

- [Registrieren](https://www.browserbase.com/sign-up) und Ihren **API Key**
  aus dem [Overview-Dashboard](https://www.browserbase.com/overview) kopieren.
- Ersetzen Sie `<BROWSERBASE_API_KEY>` durch Ihren echten Browserbase-API-Key.
- Browserbase erstellt beim WebSocket-Connect automatisch eine Browser-Sitzung, daher ist
  kein manueller Schritt zum Erstellen einer Sitzung erforderlich.
- Das kostenlose Tier erlaubt eine gleichzeitige Sitzung und eine Browser-Stunde pro Monat.
  Siehe [pricing](https://www.browserbase.com/pricing) für Limits kostenpflichtiger Pläne.
- Siehe die [Browserbase-Dokumentation](https://docs.browserbase.com) für die vollständige API-
  Referenz, SDK-Anleitungen und Integrationsbeispiele.

## Sicherheit

Wichtige Grundideen:

- Browser-Steuerung ist nur über loopback erreichbar; der Zugriff läuft über die Authentifizierung des Gateway oder über Node-Pairing.
- Die eigenständige loopback-Browser-HTTP-API verwendet **nur Shared-Secret-Authentifizierung**:
  Gateway-Token-Bearer-Auth, `x-openclaw-password` oder HTTP Basic Auth mit dem
  konfigurierten Gateway-Passwort.
- Tailscale-Serve-Identitäts-Header und `gateway.auth.mode: "trusted-proxy"` authentifizieren
  diese eigenständige loopback-Browser-API **nicht**.
- Wenn Browser-Steuerung aktiviert ist und keine Shared-Secret-Authentifizierung konfiguriert ist, erzeugt OpenClaw
  beim Start automatisch `gateway.auth.token` und persistiert es in der Konfiguration.
- OpenClaw erzeugt dieses Token **nicht** automatisch, wenn `gateway.auth.mode` bereits
  `password`, `none` oder `trusted-proxy` ist.
- Halten Sie das Gateway und alle Node-Hosts in einem privaten Netzwerk (Tailscale); vermeiden Sie öffentliche Exposition.
- Behandeln Sie Remote-CDP-URLs/-Tokens als Secrets; bevorzugen Sie Env-Variablen oder einen Secrets-Manager.

Tipps für Remote-CDP:

- Bevorzugen Sie verschlüsselte Endpunkte (HTTPS oder WSS) und nach Möglichkeit kurzlebige Tokens.
- Vermeiden Sie es, langlebige Tokens direkt in Konfigurationsdateien einzubetten.

## Profile (mehrere Browser)

OpenClaw unterstützt mehrere benannte Profile (Routing-Konfigurationen). Profile können sein:

- **openclaw-managed**: eine dedizierte Chromium-basierte Browser-Instanz mit eigenem User-Data-Directory + CDP-Port
- **remote**: eine explizite CDP-URL (Chromium-basierter Browser, der anderswo läuft)
- **existing session**: Ihr bestehendes Chrome-Profil über Chrome DevTools MCP Auto-Connect

Standards:

- Das Profil `openclaw` wird automatisch erstellt, falls es fehlt.
- Das Profil `user` ist eingebaut für das Anhängen an eine bestehende Sitzung über Chrome MCP.
- Existing-Session-Profile sind jenseits von `user` Opt-in; erstellen Sie sie mit `--driver existing-session`.
- Lokale CDP-Ports werden standardmäßig aus **18800–18899** zugewiesen.
- Beim Löschen eines Profils wird sein lokales Datenverzeichnis in den Papierkorb verschoben.

Alle Control-Endpunkte akzeptieren `?profile=<name>`; die CLI verwendet `--browser-profile`.

## Existing-session über Chrome DevTools MCP

OpenClaw kann sich auch über den
offiziellen Chrome DevTools MCP-Server an ein laufendes Chromium-basiertes Browser-Profil anhängen. Dadurch werden die in diesem Browser-Profil bereits
offenen Tabs und Login-Zustände wiederverwendet.

Offizieller Hintergrund und Referenzen zur Einrichtung:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Eingebautes Profil:

- `user`

Optional: Erstellen Sie Ihr eigenes benutzerdefiniertes Existing-Session-Profil, wenn Sie einen
anderen Namen, eine andere Farbe oder ein anderes Browser-Datenverzeichnis möchten.

Standardverhalten:

- Das eingebaute Profil `user` verwendet Chrome-MCP-Auto-Connect, das auf das
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

Dann im passenden Browser:

1. Öffnen Sie die Inspect-Seite dieses Browsers für Remote-Debugging.
2. Aktivieren Sie Remote-Debugging.
3. Lassen Sie den Browser laufen und bestätigen Sie das Verbindungs-Prompt, wenn OpenClaw sich anhängt.

Häufige Inspect-Seiten:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-Attach-Smoke-Test:

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

Was Sie prüfen sollten, wenn das Anhängen nicht funktioniert:

- der Zielbrowser auf Chromium-Basis ist Version `144+`
- Remote-Debugging ist auf der Inspect-Seite dieses Browsers aktiviert
- der Browser hat das Attach-Consent-Prompt angezeigt und Sie haben es bestätigt
- `openclaw doctor` migriert alte browserbasierte Konfigurationen und prüft, ob
  Chrome lokal für Standardprofile mit Auto-Connect installiert ist, aber es kann
  browserseitiges Remote-Debugging nicht für Sie aktivieren

Verwendung durch Agents:

- Verwenden Sie `profile="user"`, wenn Sie den eingeloggten Browser-Zustand des Benutzers benötigen.
- Wenn Sie ein benutzerdefiniertes Existing-Session-Profil verwenden, übergeben Sie diesen expliziten Profilnamen.
- Wählen Sie diesen Modus nur, wenn der Benutzer am Rechner sitzt, um das Attach-
  Prompt zu bestätigen.
- das Gateway oder der Node-Host kann `npx chrome-devtools-mcp@latest --autoConnect` starten

Hinweise:

- Dieser Pfad ist riskanter als das isolierte Profil `openclaw`, weil er
  innerhalb Ihrer eingeloggten Browser-Sitzung handeln kann.
- OpenClaw startet den Browser für diesen Treiber nicht; es hängt sich nur an.
- OpenClaw verwendet hier den offiziellen Flow `--autoConnect` von Chrome DevTools MCP. Wenn
  `userDataDir` gesetzt ist, wird es weitergereicht, um dieses User-Data-Directory anzusteuern.
- Existing-session kann sich auf dem ausgewählten Host oder über einen verbundenen
  Browser-Node anhängen. Wenn Chrome anderswo läuft und kein Browser-Node verbunden ist, verwenden Sie
  stattdessen Remote-CDP oder einen Node-Host.

<Accordion title="Einschränkungen der Existing-Session-Funktion">

Im Vergleich zum verwalteten Profil `openclaw` sind Existing-Session-Treiber stärker eingeschränkt:

- **Screenshots** — Seitenaufnahmen und Elementaufnahmen mit `--ref` funktionieren; CSS-`--element`-Selektoren nicht. `--full-page` kann nicht mit `--ref` oder `--element` kombiniert werden. Für Seiten- oder ref-basierte Element-Screenshots ist Playwright nicht erforderlich.
- **Aktionen** — `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Snapshot-Refs (keine CSS-Selektoren). `click` unterstützt nur die linke Maustaste. `type` unterstützt `slowly=true` nicht; verwenden Sie `fill` oder `press`. `press` unterstützt `delayMs` nicht. `hover`, `scrollIntoView`, `drag`, `select`, `fill` und `evaluate` unterstützen keine Timeouts pro Aufruf. `select` akzeptiert einen einzelnen Wert.
- **Wait / upload / dialog** — `wait --url` unterstützt exakte, Substring- und Glob-Muster; `wait --load networkidle` wird nicht unterstützt. Upload-Hooks erfordern `ref` oder `inputRef`, jeweils nur eine Datei, kein CSS-`element`. Dialog-Hooks unterstützen keine Überschreibung des Timeouts.
- **Nur verwaltete Features** — Batch-Aktionen, PDF-Export, Download-Interception und `responsebody` erfordern weiterhin den verwalteten Browser-Pfad.

</Accordion>

## Isolationsgarantien

- **Dediziertes User-Data-Directory**: berührt niemals Ihr persönliches Browser-Profil.
- **Dedizierte Ports**: vermeidet `9222`, um Kollisionen mit Entwicklungs-Workflows zu verhindern.
- **Deterministische Tab-Steuerung**: Tabs werden per `targetId` angesprochen, nicht per „letzter Tab“.

## Browser-Auswahl

Wenn lokal gestartet wird, wählt OpenClaw den ersten verfügbaren Browser:

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

## Control API (optional)

Für Skripting und Debugging stellt das Gateway eine kleine **nur loopback erreichbare HTTP-
Control-API** plus eine passende `openclaw browser`-CLI bereit (Snapshots, Refs, Wait-
Power-ups, JSON-Ausgabe, Debug-Workflows). Siehe
[Browser control API](/de/tools/browser-control) für die vollständige Referenz.

## Fehlerbehebung

Für Linux-spezifische Probleme (insbesondere Snap-Chromium) siehe
[Browser troubleshooting](/de/tools/browser-linux-troubleshooting).

Für Setups mit WSL2-Gateway + Windows-Chrome auf getrennten Hosts siehe
[WSL2 + Windows + remote Chrome CDP troubleshooting](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-Startfehler vs. SSRF-Block bei Navigation

Dies sind unterschiedliche Fehlerklassen und sie zeigen auf unterschiedliche Codepfade.

- **CDP-Start- oder Bereitschaftsfehler** bedeutet, dass OpenClaw nicht bestätigen kann, dass die Browser-Control-Plane funktionsfähig ist.
- **Navigation-SSRF-Block** bedeutet, dass die Browser-Control-Plane funktionsfähig ist, aber ein Seitenziel durch die Richtlinie abgelehnt wird.

Häufige Beispiele:

- CDP-Start- oder Bereitschaftsfehler:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Navigation-SSRF-Block:
  - `open`, `navigate`, Snapshot- oder Tab-Öffnungs-Flows schlagen mit einem Browser-/Netzwerk-Richtlinienfehler fehl, während `start` und `tabs` weiterhin funktionieren

Verwenden Sie diese minimale Sequenz, um die beiden zu unterscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

So lesen Sie die Ergebnisse:

- Wenn `start` mit `not reachable after start` fehlschlägt, beheben Sie zuerst die CDP-Bereitschaft.
- Wenn `start` erfolgreich ist, aber `tabs` fehlschlägt, ist die Control-Plane weiterhin ungesund. Behandeln Sie das als CDP-Erreichbarkeitsproblem, nicht als Problem der Seitennavigation.
- Wenn `start` und `tabs` erfolgreich sind, aber `open` oder `navigate` fehlschlägt, ist die Browser-Control-Plane aktiv und der Fehler liegt in der Navigationsrichtlinie oder im Seitenziel.
- Wenn `start`, `tabs` und `open` alle erfolgreich sind, ist der grundlegende Pfad der verwalteten Browser-Steuerung gesund.

Wichtige Verhaltensdetails:

- Die Browser-Konfiguration verwendet standardmäßig ein fail-closed-SSRF-Richtlinienobjekt, selbst wenn Sie `browser.ssrfPolicy` nicht konfigurieren.
- Für das lokal über loopback verwaltete Profil `openclaw` überspringen CDP-Health-Checks absichtlich die SSRF-Erreichbarkeitsprüfung des Browsers für die eigene lokale Control-Plane von OpenClaw.
- Navigationsschutz ist separat. Ein erfolgreiches Ergebnis bei `start` oder `tabs` bedeutet nicht, dass ein späteres Ziel für `open` oder `navigate` erlaubt ist.

Sicherheitshinweise:

- Schwächen Sie die Browser-SSRF-Richtlinie nicht standardmäßig ab.
- Bevorzugen Sie enge Host-Ausnahmen wie `hostnameAllowlist` oder `allowedHostnames` statt breiten Zugriff auf private Netzwerke.
- Verwenden Sie `dangerouslyAllowPrivateNetwork: true` nur in bewusst vertrauenswürdigen Umgebungen, in denen Browser-Zugriff auf private Netzwerke erforderlich und geprüft ist.

## Agent-Tools + wie die Steuerung funktioniert

Der Agent erhält **ein Tool** für Browser-Automatisierung:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Zuordnung:

- `browser snapshot` gibt einen stabilen UI-Baum zurück (AI oder ARIA).
- `browser act` verwendet die Snapshot-`ref`-IDs zum Klicken/Tippen/Ziehen/Auswählen.
- `browser screenshot` erfasst Pixel (ganze Seite oder Element).
- `browser` akzeptiert:
  - `profile`, um ein benanntes Browser-Profil zu wählen (openclaw, chrome oder remote CDP).
  - `target` (`sandbox` | `host` | `node`), um auszuwählen, wo der Browser lebt.
  - In sandboxed Sitzungen erfordert `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Wenn `target` weggelassen wird: sandboxed Sitzungen verwenden standardmäßig `sandbox`, nicht-sandboxed Sitzungen standardmäßig `host`.
  - Wenn ein browserfähiger Node verbunden ist, kann das Tool automatisch dorthin routen, außer Sie pinnen `target="host"` oder `target="node"`.

Dadurch bleibt der Agent deterministisch und vermeidet fragile Selektoren.

## Verwandt

- [Tools Overview](/de/tools) — alle verfügbaren Agent-Tools
- [Sandboxing](/de/gateway/sandboxing) — Browser-Steuerung in sandboxed Umgebungen
- [Security](/de/gateway/security) — Risiken und Härtung der Browser-Steuerung
