---
read_when:
    - Sie benötigen die exakte Semantik oder Standardwerte der Konfiguration auf Feldebene
    - Sie validieren Konfigurationsblöcke für Kanäle, Modelle, Gateway oder Tools
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu dedizierten Subsystem-Referenzen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-04-24T06:37:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6dc3b920ada38951086908713e9347141d8b11faa007df23a90a2532ac6f3bb2
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Zentrale Konfigurationsreferenz für `~/.openclaw/openclaw.json`. Für einen aufgabenorientierten Überblick siehe [Konfiguration](/de/gateway/configuration).

Diese Seite behandelt die wichtigsten Konfigurationsoberflächen von OpenClaw und verweist weiter, wenn ein Subsystem eine eigene ausführlichere Referenz hat. Sie versucht **nicht**, jeden befehlsbezogenen Katalog von Kanälen/Plugins oder jeden tiefen Regler für Memory/QMD auf einer Seite einzubetten.

Code-Quelle der Wahrheit:

- `openclaw config schema` gibt das Live-JSON-Schema aus, das für Validierung und Control UI verwendet wird, mit eingebundenen Metadaten aus gebündelten Plugins/Kanälen, wenn verfügbar
- `config.schema.lookup` gibt einen schemagebundenen Knoten für einen einzelnen Pfad für Drill-down-Tooling zurück
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash der Konfigurationsdokumentation gegen die aktuelle Schemaoberfläche

Dedizierte ausführliche Referenzen:

- [Memory-Konfigurationsreferenz](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und die Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`
- [Slash-Befehle](/de/tools/slash-commands) für den aktuellen integrierten + gebündelten Befehlskatalog
- zuständige Kanal-/Plugin-Seiten für kanalspezifische Befehlsoberflächen

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommata erlaubt). Alle Felder sind optional — OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

---

## Kanäle

Kanalspezifische Konfigurationsschlüssel wurden auf eine eigene Seite verschoben — siehe
[Konfiguration — Kanäle](/de/gateway/config-channels) für `channels.*`,
einschließlich Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und anderer
gebündelter Kanäle (Authentifizierung, Zugriffskontrolle, mehrere Konten, Erwähnungsbindung).

## Agent-Standards, Multi-Agent, Sitzungen und Nachrichten

Auf eine eigene Seite verschoben — siehe
[Konfiguration — Agenten](/de/gateway/config-agents) für:

- `agents.defaults.*` (Workspace, Modell, Thinking, Heartbeat, Memory, Medien, Skills, Sandbox)
- `multiAgent.*` (Multi-Agent-Routing und Bindings)
- `session.*` (Sitzungslebenszyklus, Compaction, Bereinigung)
- `messages.*` (Nachrichtenzustellung, TTS, Markdown-Rendering)
- `talk.*` (Talk-Modus)
  - `talk.silenceTimeoutMs`: wenn nicht gesetzt, verwendet Talk das plattformspezifische Standard-Pausenfenster vor dem Senden des Transkripts (`700 ms auf macOS und Android, 900 ms auf iOS`)

## Tools und benutzerdefinierte Provider

Tool-Richtlinien, experimentelle Umschalter, providergestützte Tool-Konfiguration und benutzerdefinierte
Provider-/Basis-URL-Einrichtung wurden auf eine eigene Seite verschoben — siehe
[Konfiguration — Tools und benutzerdefinierte Provider](/de/gateway/config-tools).

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: optionale Allowlist nur für gebündelte Skills (verwaltete/Workspace-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche gemeinsam genutzte Skill-Roots (niedrigste Priorität).
- `install.preferBrew`: wenn `true`, werden Homebrew-Installer bevorzugt, wenn `brew`
  verfügbar ist, bevor auf andere Installer-Arten zurückgegriffen wird.
- `install.nodeManager`: bevorzugter Node-Installer für `metadata.openclaw.install`-
  Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, selbst wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfeld für Skills, die eine primäre Env-Variable deklarieren (Klartext-String oder SecretRef-Objekt).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Geladen aus `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` sowie `plugins.load.paths`.
- Discovery akzeptiert native OpenClaw-Plugins sowie kompatible Codex-Bundles und Claude-Bundles, einschließlich manifestloser Claude-Bundles im Standardlayout.
- **Konfigurationsänderungen erfordern einen Gateway-Neustart.**
- `allow`: optionale Allowlist (nur aufgeführte Plugins werden geladen). `deny` hat Vorrang.
- `plugins.entries.<id>.apiKey`: pluginbezogenes Komfortfeld für API-Keys (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: pluginbezogene Env-Variablen-Map.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Core `before_prompt_build` und ignoriert promptmutierende Felder aus dem veralteten `before_agent_start`, während veraltete `modelOverride` und `providerOverride` erhalten bleiben. Gilt für native Plugin-Hooks und unterstützte von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.subagent.allowModelOverride`: diesem Plugin ausdrücklich vertrauen, pro Lauf `provider`- und `model`-Überschreibungen für Hintergrund-Sub-Agent-Läufe anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Allowlist kanonischer `provider/model`-Ziele für vertrauenswürdige Sub-Agent-Überschreibungen. Verwenden Sie `"*"` nur, wenn Sie absichtlich jedes Modell zulassen möchten.
- `plugins.entries.<id>.config`: vom Plugin definiertes Konfigurationsobjekt (validiert durch das native OpenClaw-Plugin-Schema, wenn verfügbar).
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-Web-Fetch-Provider-Einstellungen.
  - `apiKey`: Firecrawl-API-Key (akzeptiert SecretRef). Fällt zurück auf `plugins.entries.firecrawl.config.webSearch.apiKey`, veraltetes `tools.web.fetch.firecrawl.apiKey` oder die Env-Variable `FIRECRAWL_API_KEY`.
  - `baseUrl`: Firecrawl-API-Basis-URL (Standard: `https://api.firecrawl.dev`).
  - `onlyMainContent`: nur den Hauptinhalt von Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Timeout für Scrape-Requests in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: den X-Search-Provider aktivieren.
  - `model`: Grok-Modell, das für die Suche verwendet werden soll (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Memory-Dreaming-Einstellungen. Siehe [Dreaming](/de/concepts/dreaming) für Phasen und Schwellenwerte.
  - `enabled`: globaler Dreaming-Schalter (Standard `false`).
  - `frequency`: Cron-Rhythmus für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - Phasenrichtlinien und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Memory-Konfiguration befindet sich in der [Memory-Konfigurationsreferenz](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können auch eingebettete Pi-Standardeinstellungen aus `settings.json` beitragen; OpenClaw wendet diese als bereinigte Agenteneinstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: die aktive Memory-Plugin-ID auswählen oder `"none"`, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: die aktive Context-Engine-Plugin-ID auswählen; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.
- `plugins.installs`: von der CLI verwaltete Installationsmetadaten, die von `openclaw plugins update` verwendet werden.
  - Enthält `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Behandeln Sie `plugins.installs.*` als verwalteten Zustand; bevorzugen Sie CLI-Befehle gegenüber manuellen Bearbeitungen.

Siehe [Plugins](/de/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` deaktiviert `act:evaluate` und `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist deaktiviert, wenn es nicht gesetzt ist, sodass die Browser-Navigation standardmäßig strikt bleibt.
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur dann, wenn Sie private Netzwerk-Browser-Navigation bewusst vertrauen.
- Im strikten Modus unterliegen Endpoints von Remote-CDP-Profilen (`profiles.*.cdpUrl`) derselben Sperrung privater Netzwerke während Erreichbarkeits-/Discovery-Prüfungen.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als veralteter Alias unterstützt.
- Verwenden Sie im strikten Modus `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Remote-Profile sind nur zum Anhängen geeignet (start/stop/reset deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` entdecken soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL gibt.
- `existing-session`-Profile verwenden Chrome MCP statt CDP und können auf
  dem ausgewählten Host oder über einen verbundenen Browser-Node anhängen.
- `existing-session`-Profile können `userDataDir` setzen, um ein bestimmtes
  Chromium-basiertes Browser-Profil wie Brave oder Edge anzusprechen.
- `existing-session`-Profile behalten die aktuellen Einschränkungen der Chrome-MCP-Route:
  snapshot-/referenzgesteuerte Aktionen statt CSS-Selektor-Targeting, Hooks zum Hochladen einzelner Dateien, keine Dialog-Timeout-Überschreibungen, kein `wait --load networkidle` und kein `responsebody`, kein PDF-Export, keine Download-Interception und keine Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur explizit für Remote-CDP.
- Reihenfolge der Auto-Erkennung: Standardbrowser, wenn Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control-Dienst: nur loopback (Port wird von `gateway.port` abgeleitet, Standard `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an (zum Beispiel
  `--disable-gpu`, Fenstergröße oder Debug-Flags).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: Akzentfarbe für den nativen App-UI-Rahmen (Talk-Mode-Blasentönung usw.).
- `assistant`: Identitätsüberschreibung für die Control UI. Fällt auf die aktive Agentenidentität zurück.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Details zu Gateway-Feldern">

- `mode`: `local` (Gateway ausführen) oder `remote` (mit Remote-Gateway verbinden). Das Gateway verweigert den Start, sofern nicht `local`.
- `port`: einzelner multiplexter Port für WS + HTTP. Vorrang: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Veraltete Bind-Aliasse**: Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), nicht Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Das standardmäßige Bind `loopback` lauscht innerhalb des Containers auf `127.0.0.1`. Bei Docker-Bridge-Netzwerk (`-p 18789:18789`) kommt Datenverkehr auf `eth0` an, sodass das Gateway nicht erreichbar ist. Verwenden Sie `--network host` oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Interfaces zu lauschen.
- **Auth**: Standardmäßig erforderlich. Nicht-Loopback-Binds erfordern Gateway-Authentifizierung. In der Praxis bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start- sowie Dienstinstallations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und `mode` nicht gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Authentifizierung. Verwenden Sie dies nur für vertrauenswürdige lokale local loopback-Setups; diese Option wird in Onboarding-Prompts absichtlich nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Authentifizierung an einen identitätsbewussten Reverse-Proxy delegieren und Identitäts-Headern von `gateway.trustedProxies` vertrauen (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet eine **Nicht-Loopback**-Proxyquelle; gleichhostige Loopback-Reverse-Proxys erfüllen trusted-proxy-Auth nicht.
- `gateway.auth.allowTailscale`: wenn `true`, können Identitäts-Header von Tailscale Serve die Authentifizierung für Control UI/WebSocket erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpoints verwenden diese Tailscale-Header-Auth **nicht**; sie folgen stattdessen dem normalen HTTP-Auth-Modus des Gateway. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Authentifizierung. Gilt pro Client-IP und pro Auth-Bereich (gemeinsames Secret und Device-Token werden unabhängig verfolgt). Geblockte Versuche geben `429` + `Retry-After` zurück.
  - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für denselben `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige falsche Versuche desselben Clients können daher den Limiter beim zweiten Request auslösen, statt dass beide als normale Nichtübereinstimmungen durchlaufen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie es auf `false`, wenn Sie localhost-Datenverkehr absichtlich ebenfalls ratenlimitieren möchten (für Test-Setups oder strikte Proxy-Bereitstellungen).
- Browser-originierte WS-Authentifizierungsversuche werden immer mit deaktivierter Loopback-Ausnahme gedrosselt (Defense-in-Depth gegen browserbasiertes Brute-Force auf localhost).
- Auf loopback sind diese Sperren browser-originierter Versuche pro normalisiertem `Origin`-
  Wert isoliert, sodass wiederholte Fehlschläge von einer localhost-Origin nicht automatisch
  eine andere Origin sperren.
- `tailscale.mode`: `serve` (nur tailnet, loopback-Bind) oder `funnel` (öffentlich, erfordert Auth).
- `controlUi.allowedOrigins`: explizite Browser-Origin-Allowlist für Gateway-WebSocket-Verbindungen. Erforderlich, wenn Browser-Clients von Nicht-Loopback-Origins erwartet werden.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der Host-Header-Origin-Fallback für Bereitstellungen aktiviert, die sich absichtlich auf eine Origin-Richtlinie über den Host-Header verlassen.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` `ws://` oder `wss://` sein.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: clientseitige Break-Glass-Überschreibung, die unverschlüsseltes `ws://` zu vertrauenswürdigen privaten Netzwerk-IPs erlaubt; Standard bleibt für unverschlüsseltes Protokoll weiterhin nur loopback.
- `gateway.remote.token` / `.password` sind Anmeldedatenfelder des Remote-Clients. Sie konfigurieren für sich genommen keine Gateway-Authentifizierung.
- `gateway.push.apns.relay.baseUrl`: Basis-HTTPS-URL für das externe APNs-Relay, das von offiziellen/TestFlight-iOS-Builds verwendet wird, nachdem diese relaygestützte Registrierungen beim Gateway veröffentlicht haben. Diese URL muss mit der Relay-URL übereinstimmen, die in den iOS-Build einkompiliert wurde.
- `gateway.push.apns.relay.timeoutMs`: Gateway-zu-Relay-Sende-Timeout in Millisekunden. Standardwert ist `10000`.
- Relaygestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, schließt diese Identität in die Relay-Registrierung ein und leitet eine registrierungsbezogene Sendeberechtigung an das Gateway weiter. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Env-Überschreibungen für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: nur für die Entwicklung gedachte Escape-Hatch für loopback-HTTP-Relay-URLs. Produktions-Relay-URLs sollten auf HTTPS bleiben.
- `gateway.channelHealthCheckMinutes`: Intervall des Kanal-Health-Monitors in Minuten. Setzen Sie `0`, um Neustarts durch den Health-Monitor global zu deaktivieren. Standard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwelle für stale sockets in Minuten. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`. Standard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Anzahl von Neustarts durch den Health-Monitor pro Kanal/Konto innerhalb einer gleitenden Stunde. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: kanalbezogener Opt-out für Neustarts durch den Health-Monitor, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: kontobezogene Überschreibung für Kanäle mit mehreren Konten. Wenn gesetzt, hat sie Vorrang vor der Überschreibung auf Kanalebene.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert sind und nicht aufgelöst werden können, schlägt die Auflösung fail-closed fehl (kein Remote-Fallback, das dies verdeckt).
- `trustedProxies`: IPs von Reverse-Proxys, die TLS terminieren oder weitergeleitete Client-Header injizieren. Listen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind weiterhin für Setups mit Proxy-Erkennung/gleichem Host gültig (zum Beispiel Tailscale Serve oder ein lokaler Reverse-Proxy), machen Loopback-Requests jedoch **nicht** für `gateway.auth.mode: "trusted-proxy"` zulässig.
- `allowRealIpFallback`: wenn `true`, akzeptiert das Gateway `X-Real-IP`, wenn `X-Forwarded-For` fehlt. Standard `false` für fail-closed-Verhalten.
- `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert werden (erweitert die Standard-Deny-Liste).
- `gateway.tools.allow`: Tool-Namen aus der Standard-HTTP-Deny-Liste entfernen.

</Accordion>

### OpenAI-kompatible Endpoints

- Chat Completions: standardmäßig deaktiviert. Aktivieren mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Härtung für URL-Eingaben bei Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Allowlists werden als nicht gesetzt behandelt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false`
    und/oder `gateway.http.endpoints.responses.images.allowUrl=false`, um das Abrufen per URL zu deaktivieren.
- Optionaler Härtungs-Header für Antworten:
  - `gateway.http.securityHeaders.strictTransportSecurity` (nur für HTTPS-Ursprünge setzen, die Sie kontrollieren; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolation mehrerer Instanzen

Führen Sie mehrere Gateways auf einem Host mit eindeutigen Ports und State-Dirs aus:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Komfort-Flags: `--dev` (verwendet `~/.openclaw-dev` + Port `19001`), `--profile <name>` (verwendet `~/.openclaw-<name>`).

Siehe [Multiple Gateways](/de/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: aktiviert TLS-Terminierung am Gateway-Listener (HTTPS/WSS) (Standard: `false`).
- `autoGenerate`: erzeugt automatisch ein lokales selbstsigniertes Zertifikats-/Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokal/Entwicklung.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zum privaten TLS-Schlüssel; Zugriff sollte auf Berechtigte beschränkt sein.
- `caPath`: optionaler Pfad zu einem CA-Bundle für Client-Validierung oder benutzerdefinierte Trust-Chains.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: steuert, wie Konfigurationsbearbeitungen zur Laufzeit angewendet werden.
  - `"off"`: Live-Bearbeitungen ignorieren; Änderungen erfordern einen expliziten Neustart.
  - `"restart"`: den Gateway-Prozess bei Konfigurationsänderungen immer neu starten.
  - `"hot"`: Änderungen im Prozess anwenden, ohne neu zu starten.
  - `"hybrid"` (Standard): zuerst Hot-Reload versuchen; bei Bedarf auf Neustart zurückfallen.
- `debounceMs`: Debounce-Fenster in ms, bevor Konfigurationsänderungen angewendet werden (nichtnegative Ganzzahl).
- `deferralTimeoutMs`: maximale Wartezeit in ms auf laufende Operationen, bevor ein Neustart erzwungen wird (Standard: `300000` = 5 Minuten).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` oder `x-openclaw-token: <token>`.
Hook-Tokens in der Query-String werden abgelehnt.

Hinweise zu Validierung und Sicherheit:

- `hooks.enabled=true` erfordert ein nicht leeres `hooks.token`.
- `hooks.token` muss sich von `gateway.auth.token` **unterscheiden**; die Wiederverwendung des Gateway-Tokens wird abgelehnt.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true`, schränken Sie `hooks.allowedSessionKeyPrefixes` ein (zum Beispiel `["hook:"]`).
- Wenn ein Mapping oder Preset einen templatisierten `sessionKey` verwendet, setzen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true`. Statische Mapping-Schlüssel erfordern dieses Opt-in nicht.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus der Request-Payload wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` (Standard: `false`).
- `POST /hooks/<name>` → aufgelöst über `hooks.mappings`
  - Per Template gerenderte `sessionKey`-Werte aus Mappings werden als extern geliefert behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Details zu Mappings">

- `match.path` vergleicht den Unterpfad nach `/hooks` (z. B. `/hooks/gmail` → `gmail`).
- `match.source` vergleicht ein Payload-Feld für generische Pfade.
- Templates wie `{{messages[0].subject}}` lesen aus der Payload.
- `transform` kann auf ein JS-/TS-Modul zeigen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Traversal werden abgelehnt).
- `agentId` routet an einen bestimmten Agenten; unbekannte IDs fallen auf den Standard zurück.
- `allowedAgentIds`: schränkt explizites Routing ein (`*` oder weggelassen = alle erlauben, `[]` = alle verweigern).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agent-Läufe ohne expliziten `sessionKey`.
- `allowRequestSessionKey`: erlaubt Aufrufern von `/hooks/agent` und templategesteuerten Mapping-Sitzungsschlüsseln, `sessionKey` zu setzen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Allowlist für explizite `sessionKey`-Werte (Request + Mapping), z. B. `["hook:"]`. Sie wird erforderlich, wenn ein Mapping oder Preset einen templatisierten `sessionKey` verwendet.
- `deliver: true` sendet die finale Antwort an einen Kanal; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss erlaubt sein, wenn ein Modellkatalog gesetzt ist).

</Accordion>

### Gmail-Integration

- Das integrierte Gmail-Preset verwendet `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Wenn Sie dieses Routing pro Nachricht beibehalten, setzen Sie `hooks.allowRequestSessionKey: true` und schränken `hooks.allowedSessionKeyPrefixes` so ein, dass sie zum Gmail-Namespace passen, zum Beispiel `["hook:", "hook:gmail:"]`.
- Wenn Sie `hooks.allowRequestSessionKey: false` benötigen, überschreiben Sie das Preset mit einem statischen `sessionKey` statt mit dem templatisierten Standard.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Das Gateway startet `gog gmail watch serve` beim Booten automatisch, wenn es konfiguriert ist. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.
- Führen Sie nicht zusätzlich zu dem Gateway einen separaten `gog gmail watch serve` aus.

---

## Canvas-Host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Stellt vom Agenten bearbeitbares HTML/CSS/JS und A2UI über HTTP unter dem Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: behalten Sie `gateway.bind: "loopback"` (Standard) bei.
- Nicht-Loopback-Binds: Canvas-Routen erfordern Gateway-Auth (Token/Passwort/trusted-proxy), genauso wie andere HTTP-Oberflächen des Gateway.
- Node-WebViews senden typischerweise keine Auth-Header; nachdem ein Node gekoppelt und verbunden ist, veröffentlicht das Gateway nodebezogene Fähigkeits-URLs für den Zugriff auf Canvas/A2UI.
- Fähigkeits-URLs sind an die aktive Node-WS-Sitzung gebunden und laufen schnell ab. Es wird kein IP-basierter Fallback verwendet.
- Injiziert einen Live-Reload-Client in ausgeliefertes HTML.
- Erstellt automatisch eine Starter-`index.html`, wenn leer.
- Stellt A2UI auch unter `/__openclaw__/a2ui/` bereit.
- Änderungen erfordern einen Gateway-Neustart.
- Deaktivieren Sie Live-Reload bei großen Verzeichnissen oder `EMFILE`-Fehlern.

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (Standard): `cliPath` + `sshPort` aus TXT-Records weglassen.
- `full`: `cliPath` + `sshPort` einschließen.
- Der Hostname ist standardmäßig `openclaw`. Überschreiben Sie ihn mit `OPENCLAW_MDNS_HOSTNAME`.

### Wide-Area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Für netzwerkübergreifende Discovery kombinieren Sie dies mit einem DNS-Server (CoreDNS empfohlen) + Tailscale Split DNS.

Einrichtung: `openclaw dns setup --apply`.

---

## Umgebung

### `env` (Inline-Env-Variablen)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Inline-Env-Variablen werden nur angewendet, wenn der Prozess-Env der Schlüssel fehlt.
- `.env`-Dateien: `.env` im aktuellen Arbeitsverzeichnis + `~/.openclaw/.env` (keine von beiden überschreibt vorhandene Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus Ihrem Login-Shell-Profil.
- Siehe [Umgebung](/de/help/environment) für die vollständige Priorität.

### Env-Variablen-Substitution

Referenzieren Sie Env-Variablen in jedem Konfigurations-String mit `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Es werden nur Großschreibungsnamen passend zu `[A-Z_][A-Z0-9_]*` erkannt.
- Fehlende/leere Variablen werfen beim Laden der Konfiguration einen Fehler.
- Mit `$${VAR}` escapen Sie für ein literales `${VAR}`.
- Funktioniert mit `$include`.

---

## Secrets

SecretRefs sind additiv: Klartextwerte funktionieren weiterhin.

### `SecretRef`

Verwenden Sie eine Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validierung:

- `provider`-Muster: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id-Muster: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: absoluter JSON-Pointer (zum Beispiel `"/providers/openai/apiKey"`)
- `source: "exec"` id-Muster: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"`-IDs dürfen keine punktbasierten Slash-getrennten Pfadsegmente `.` oder `..` enthalten (zum Beispiel wird `a/../b` abgelehnt)

### Unterstützte Credential-Oberfläche

- Kanonische Matrix: [SecretRef Credential Surface](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte Credential-Pfade in `openclaw.json`.
- Refs in `auth-profiles.json` sind in Laufzeitauflösung und Audit-Abdeckung eingeschlossen.

### Konfiguration von Secret-Providern

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Hinweise:

- Der Provider `file` unterstützt `mode: "json"` und `mode: "singleValue"` (`id` muss im Modus singleValue `"value"` sein).
- Pfade von Datei- und Exec-Providern schlagen fail-closed fehl, wenn die Windows-ACL-Prüfung nicht verfügbar ist. Setzen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade, die nicht verifiziert werden können.
- Der Provider `exec` erfordert einen absoluten `command`-Pfad und verwendet Protokoll-Payloads über stdin/stdout.
- Standardmäßig werden Symlink-Befehlspfade abgelehnt. Setzen Sie `allowSymlinkCommand: true`, um Symlink-Pfade zuzulassen, während der aufgelöste Zielpfad validiert wird.
- Wenn `trustedDirs` konfiguriert ist, gilt die trusted-dir-Prüfung für den aufgelösten Zielpfad.
- Die Child-Umgebung von `exec` ist standardmäßig minimal; übergeben Sie erforderliche Variablen explizit mit `passEnv`.
- SecretRefs werden zur Aktivierungszeit in einen In-Memory-Snapshot aufgelöst; Request-Pfade lesen danach nur noch diesen Snapshot.
- Active-surface filtering gilt während der Aktivierung: nicht auflösbare Refs auf aktiven Oberflächen verhindern Start/Reload, während inaktive Oberflächen mit Diagnosen übersprungen werden.

---

## Speicherung von Authentifizierung

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Profile pro Agent werden unter `<agentDir>/auth-profiles.json` gespeichert.
- `auth-profiles.json` unterstützt Refs auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Credential-Modi.
- OAuth-Modus-Profile (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine SecretRef-gestützten Credentials in Auth-Profilen.
- Statische Runtime-Credentials stammen aus aufgelösten In-Memory-Snapshots; veraltete statische Einträge in `auth.json` werden bereinigt, wenn sie gefunden werden.
- Veraltete OAuth-Importe aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Runtime-Verhalten für Secrets und Tooling für `audit/configure/apply`: [Secrets Management](/de/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: Basis-Backoff in Stunden, wenn ein Profil aufgrund echter
  Abrechnungs-/unzureichender-Guthaben-Fehler fehlschlägt (Standard: `5`). Expliziter Abrechnungstext kann
  selbst bei Antworten `401`/`403` hier landen, aber provider-spezifische Text-
  Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter
  `Key limit exceeded`). Wiederholbare HTTP-`402`-Nutzungsfenster- oder
  Ausgabenlimit-Nachrichten für Organisation/Workspace bleiben stattdessen im Pfad `rate_limit`.
- `billingBackoffHoursByProvider`: optionale providerbezogene Überschreibungen für Abrechnungs-Backoff-Stunden.
- `billingMaxHours`: Obergrenze in Stunden für exponentielles Wachstum des Abrechnungs-Backoff (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für hochsichere Fehler vom Typ `auth_permanent` (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für das Wachstum des `auth_permanent`-Backoff (Standard: `60`).
- `failureWindowHours`: gleitendes Fenster in Stunden, das für Backoff-Zähler verwendet wird (Standard: `24`).
- `overloadedProfileRotations`: maximale Anzahl von Auth-Profil-Rotationen desselben Providers bei Überlastungsfehlern, bevor auf Modell-Fallback umgeschaltet wird (Standard: `1`). Provider-Busy-Formen wie `ModelNotReadyException` landen hier.
- `overloadedBackoffMs`: feste Verzögerung vor dem erneuten Versuch einer Provider-/Profilrotation bei Überlastung (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Anzahl von Auth-Profil-Rotationen desselben Providers bei Rate-Limit-Fehlern, bevor auf Modell-Fallback umgeschaltet wird (Standard: `1`). Dieser Rate-Limit-Bucket umfasst providergeformten Text wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Standard-Logdatei: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Setzen Sie `logging.file` für einen stabilen Pfad.
- `consoleLevel` wird bei `--verbose` auf `debug` angehoben.
- `maxFileBytes`: maximale Größe der Logdatei in Bytes, bevor Schreibvorgänge unterdrückt werden (positive Ganzzahl; Standard: `524288000` = 500 MB). Verwenden Sie externe Logrotation für Produktionsbereitstellungen.

---

## Diagnostik

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: globaler Schalter für die Ausgabe von Instrumentierung (Standard: `true`).
- `flags`: Array aus Flag-Strings zum Aktivieren gezielter Logausgabe (unterstützt Wildcards wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersschwelle in ms, ab der Warnungen für hängende Sitzungen ausgegeben werden, solange eine Sitzung im Verarbeitungsstatus bleibt.
- `otel.enabled`: aktiviert die OpenTelemetry-Export-Pipeline (Standard: `false`).
- `otel.endpoint`: Collector-URL für den OTel-Export.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP-/gRPC-Metadaten-Header, die mit OTel-Export-Requests gesendet werden.
- `otel.serviceName`: Dienstname für Resource-Attribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: Export von Traces, Metriken oder Logs aktivieren.
- `otel.sampleRate`: Trace-Sampling-Rate `0`–`1`.
- `otel.flushIntervalMs`: Intervall in ms für periodisches Leeren von Telemetrie.
- `cacheTrace.enabled`: Cache-Trace-Snapshots für eingebettete Runs protokollieren (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuern, was in der Cache-Trace-Ausgabe enthalten ist (alle standardmäßig `true`).

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: Release-Kanal für npm-/git-Installationen — `"stable"`, `"beta"` oder `"dev"`.
- `checkOnStart`: beim Start des Gateway nach npm-Updates suchen (Standard: `true`).
- `auto.enabled`: Hintergrund-Auto-Update für Paketinstallationen aktivieren (Standard: `false`).
- `auto.stableDelayHours`: minimale Verzögerung in Stunden vor dem automatischen Anwenden im Stable-Kanal (Standard: `6`; max: `168`).
- `auto.stableJitterHours`: zusätzliches Rollout-Streuungsfenster für den Stable-Kanal in Stunden (Standard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: wie oft Prüfungen für den Beta-Kanal in Stunden laufen (Standard: `1`; max: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: globales ACP-Feature-Gate (Standard: `false`).
- `dispatch.enabled`: unabhängiges Gate für die Turn-Dispatch von ACP-Sitzungen (Standard: `true`). Setzen Sie `false`, um ACP-Befehle verfügbar zu halten, während die Ausführung blockiert wird.
- `backend`: Standard-ID des ACP-Runtime-Backends (muss zu einem registrierten ACP-Runtime-Plugin passen).
- `defaultAgent`: Fallback-Ziel-Agent-ID für ACP-Spawns, wenn keine explizite Zielvorgabe gemacht wird.
- `allowedAgents`: Allowlist von Agent-IDs, die für ACP-Runtime-Sitzungen erlaubt sind; leer bedeutet keine zusätzliche Einschränkung.
- `maxConcurrentSessions`: maximale Anzahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Leerlauf-Flush-Fenster in ms für gestreamten Text.
- `stream.maxChunkChars`: maximale Chunk-Größe, bevor die Projektion gestreamter Blöcke aufgeteilt wird.
- `stream.repeatSuppression`: wiederholte Status-/Tool-Zeilen pro Turn unterdrücken (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu terminalen Turn-Ereignissen.
- `stream.hiddenBoundarySeparator`: Trennzeichen vor sichtbarem Text nach versteckten Tool-Ereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Anzahl an Zeichen der Assistentenausgabe, die pro ACP-Turn projiziert werden.
- `stream.maxSessionUpdateChars`: maximale Anzahl von Zeichen für projizierte ACP-Status-/Update-Zeilen.
- `stream.tagVisibility`: Zuordnung von Tag-Namen zu booleschen Sichtbarkeitsüberschreibungen für gestreamte Ereignisse.
- `runtime.ttlMinutes`: Leerlauf-TTL in Minuten für ACP-Sitzungs-Worker, bevor sie zur Bereinigung infrage kommen.
- `runtime.installCommand`: optionaler Installationsbefehl, der beim Bootstrap einer ACP-Runtime-Umgebung ausgeführt wird.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` steuert den Stil des Banner-Slogans:
  - `"random"` (Standard): rotierende lustige/saisonale Slogans.
  - `"default"`: fester neutraler Slogan (`All your chats, one OpenClaw.`).
  - `"off"`: kein Slogantext (Banner-Titel/Version werden weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur Slogans), setzen Sie die Env-Variable `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Von CLI-geführten Setup-Abläufen (`onboard`, `configure`, `doctor`) geschriebene Metadaten:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identität

Siehe Identitätsfelder von `agents.list` unter [Agent-Standards](/de/gateway/config-agents#agent-defaults).

---

## Bridge (veraltet, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes verbinden sich über den Gateway-WebSocket. Schlüssel unter `bridge.*` sind nicht mehr Teil des Konfigurationsschemas (die Validierung schlägt fehl, bis sie entfernt werden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

<Accordion title="Veraltete Bridge-Konfiguration (historische Referenz)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: wie lange abgeschlossene isolierte Cron-Run-Sitzungen aufbewahrt werden, bevor sie aus `sessions.json` entfernt werden. Steuert auch die Bereinigung archivierter gelöschter Cron-Transkripte. Standard: `24h`; setzen Sie `false`, um dies zu deaktivieren.
- `runLog.maxBytes`: maximale Größe pro Run-Log-Datei (`cron/runs/<jobId>.jsonl`) vor der Bereinigung. Standard: `2_000_000` Bytes.
- `runLog.keepLines`: neueste Zeilen, die bei Auslösung der Run-Log-Bereinigung beibehalten werden. Standard: `2000`.
- `webhookToken`: Bearer-Token, das für die POST-Zustellung von Cron-Webhooks (`delivery.mode = "webhook"`) verwendet wird; wenn weggelassen, wird kein Auth-Header gesendet.
- `webhook`: veraltete Legacy-Fallback-Webhook-URL (http/https), die nur für gespeicherte Jobs verwendet wird, die noch `notify: true` haben.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: maximale Wiederholungen für einmalige Jobs bei transienten Fehlern (Standard: `3`; Bereich: `0`–`10`).
- `backoffMs`: Array aus Backoff-Verzögerungen in ms für jeden Wiederholungsversuch (Standard: `[30000, 60000, 300000]`; 1–10 Einträge).
- `retryOn`: Fehlertypen, die Wiederholungen auslösen — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Weglassen, um alle transienten Typen zu wiederholen.

Gilt nur für einmalige Cron-Jobs. Wiederkehrende Jobs verwenden eine separate Fehlerbehandlung.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Failure-Alerts für Cron-Jobs aktivieren (Standard: `false`).
- `after`: aufeinanderfolgende Fehler, bevor ein Alert ausgelöst wird (positive Ganzzahl, min: `1`).
- `cooldownMs`: minimale Millisekunden zwischen wiederholten Alerts für denselben Job (nichtnegative Ganzzahl).
- `mode`: Zustellungsmodus — `"announce"` sendet über eine Kanalnachricht; `"webhook"` postet an den konfigurierten Webhook.
- `accountId`: optionale Konto- oder Kanal-ID zur Eingrenzung der Alert-Zustellung.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Standardziel für Cron-Fehlerbenachrichtigungen über alle Jobs hinweg.
- `mode`: `"announce"` oder `"webhook"`; standardmäßig `"announce"`, wenn genügend Zieldaten vorhanden sind.
- `channel`: Kanalüberschreibung für die Zustellung per Announce. `"last"` verwendet den zuletzt bekannten Zustellungskanal erneut.
- `to`: explizites Announce-Ziel oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionale Kontoüberschreibung für die Zustellung.
- `delivery.failureDestination` pro Job überschreibt diesen globalen Standard.
- Wenn weder global noch pro Job ein Fehlerziel gesetzt ist, fallen Jobs, die bereits über `announce` zustellen, bei Fehlern auf dieses primäre Announce-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, sofern der primäre `delivery.mode` des Jobs nicht `"webhook"` ist.

Siehe [Cron-Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.

---

## Template-Variablen für Medienmodelle

Template-Platzhalter, die in `tools.media.models[].args` expandiert werden:

| Variable           | Beschreibung                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Vollständiger eingehender Nachrichtentext         |
| `{{RawBody}}`      | Roher Nachrichtentext (ohne Verlaufs-/Absender-Wrapper) |
| `{{BodyStripped}}` | Nachrichtentext mit entfernten Gruppenerwähnungen |
| `{{From}}`         | Absenderkennung                                   |
| `{{To}}`           | Zielkennung                                       |
| `{{MessageSid}}`   | Kanal-Nachrichten-ID                              |
| `{{SessionId}}`    | Aktuelle Sitzungs-UUID                            |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde   |
| `{{MediaUrl}}`     | Pseudo-URL der eingehenden Medien                 |
| `{{MediaPath}}`    | Lokaler Medienpfad                                |
| `{{MediaType}}`    | Medientyp (Bild/Audio/Dokument/…)                 |
| `{{Transcript}}`   | Audio-Transkript                                  |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge        |
| `{{MaxChars}}`     | Aufgelöste maximale Ausgabemenge an Zeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                         |
| `{{GroupSubject}}` | Gruppenbetreff (Best Effort)                      |
| `{{GroupMembers}}` | Vorschau der Gruppenmitglieder (Best Effort)      |
| `{{SenderName}}`   | Anzeigename des Absenders (Best Effort)           |
| `{{SenderE164}}`   | Telefonnummer des Absenders (Best Effort)         |
| `{{Provider}}`     | Provider-Hinweis (whatsapp, telegram, discord usw.) |

---

## Config-Includes (`$include`)

Teilen Sie die Konfiguration in mehrere Dateien auf:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Merge-Verhalten:**

- Einzelne Datei: ersetzt das umgebende Objekt.
- Array von Dateien: wird in Reihenfolge tief zusammengeführt (spätere überschreiben frühere).
- Benachbarte Schlüssel: werden nach den Includes zusammengeführt (überschreiben eingeschlossene Werte).
- Verschachtelte Includes: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur einbindenden Datei aufgelöst, müssen aber innerhalb des Konfigurationsverzeichnisses der obersten Ebene bleiben (`dirname` von `openclaw.json`). Absolute Formen/`../` sind nur erlaubt, wenn sie dennoch innerhalb dieser Grenze aufgelöst werden.
- Von OpenClaw verwaltete Schreibvorgänge, die nur einen einzigen Abschnitt der obersten Ebene ändern, der durch ein Single-File-Include gestützt wird, schreiben in diese eingebundene Datei durch. Zum Beispiel aktualisiert `plugins install` `plugins: { $include: "./plugins.json5" }` in `plugins.json5` und lässt `openclaw.json` unverändert.
- Root-Includes, Include-Arrays und Includes mit benachbarten Überschreibungen sind für von OpenClaw verwaltete Schreibvorgänge schreibgeschützt; solche Schreibvorgänge schlagen fail-closed fehl, statt die Konfiguration abzuflachen.
- Fehler: klare Meldungen für fehlende Dateien, Parse-Fehler und zirkuläre Includes.

---

_Verwandt: [Konfiguration](/de/gateway/configuration) · [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Doctor](/de/gateway/doctor)_

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples)
