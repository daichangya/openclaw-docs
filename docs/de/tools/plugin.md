---
read_when:
    - Plugins installieren oder konfigurieren
    - Verstehen von Plugin-Erkennung und Laderegeln
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-21T06:31:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins erweitern OpenClaw um neue Fähigkeiten: Kanäle, Modell-Provider,
Tools, Skills, Speech, Echtzeit-Transkription, Echtzeitstimme,
Medienverständnis, Bildgenerierung, Videogenerierung, Web-Fetch, Web-
Suche und mehr. Einige Plugins sind **core** (werden mit OpenClaw ausgeliefert), andere
sind **extern** (von der Community auf npm veröffentlicht).

## Schnellstart

<Steps>
  <Step title="Anzeigen, was geladen ist">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Ein Plugin installieren">
    ```bash
    # Von npm
    openclaw plugins install @openclaw/voice-call

    # Aus einem lokalen Verzeichnis oder Archiv
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Das Gateway neu starten">
    ```bash
    openclaw gateway restart
    ```

    Konfigurieren Sie es danach unter `plugins.entries.\<id\>.config` in Ihrer Konfigurationsdatei.

  </Step>
</Steps>

Wenn Sie native Chat-Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizit
`clawhub:<pkg>` oder eine nackte Paketspezifikation (zuerst ClawHub, dann npm-Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise geschlossen fehl und verweist Sie an
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein eng begrenzter Neuinstallationspfad für gebündelte Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` entscheiden.

Gepackte OpenClaw-Installationen installieren nicht eager den
gesamten Laufzeit-Abhängigkeitsbaum jedes gebündelten Plugins. Wenn ein gebündeltes Plugin im Besitz von OpenClaw aktiv ist durch
Plugin-Konfiguration, alte Kanal-Konfiguration oder ein standardmäßig aktiviertes Manifest, repariert der Start
nur die deklarierten Laufzeitabhängigkeiten dieses Plugins vor dem Import.
Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin über
`openclaw plugins install` installiert werden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                     | Beispiele                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Laufzeitmodul; wird In-Process ausgeführt | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; wird auf OpenClaw-Funktionen abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Siehe [Plugin-Bundles](/de/plugins/bundles) für Details zu Bundles.

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins)
und der [Übersicht zum Plugin SDK](/de/plugins/sdk-overview).

## Offizielle Plugins

### Installierbar (npm)

| Plugin          | Paket                 | Doku                                 |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/de/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/de/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/de/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/de/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/de/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/de/plugins/zalouser)   |

### Core (mit OpenClaw ausgeliefert)

<AccordionGroup>
  <Accordion title="Modell-Provider (standardmäßig aktiviert)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory-Plugins">
    - `memory-core` — gebündelte Memory-Suche (Standard über `plugins.slots.memory`)
    - `memory-lancedb` — Long-Term-Memory mit Installation bei Bedarf und automatischem Recall/Capture (setzen Sie `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstiges">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die CLI `openclaw browser`, die Gateway-Methode `browser.request`, die Browser-Laufzeit und den standardmäßigen Browser-Control-Service (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — VS-Code-Copilot-Proxy-Bridge (standardmäßig deaktiviert)
  </Accordion>
</AccordionGroup>

Suchen Sie nach Plugins von Drittanbietern? Siehe [Community-Plugins](/de/plugins/community).

## Konfiguration

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Feld             | Beschreibung                                              |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Hauptschalter (Standard: `true`)                          |
| `allow`          | Plugin-Allowlist (optional)                               |
| `deny`           | Plugin-Denylist (optional; deny gewinnt)                  |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                 |
| `slots`          | Exklusive Slot-Auswahlfelder (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin-spezifische Schalter + Konfiguration               |

Änderungen an der Konfiguration **erfordern einen Neustart des Gateway**. Wenn das Gateway mit Config-
Watch + In-Process-Neustart läuft (der Standardpfad `openclaw gateway`), wird dieser
Neustart normalerweise automatisch kurz nach dem Schreiben der Konfiguration ausgeführt.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, aber Aktivierungsregeln haben es abgeschaltet. Konfiguration bleibt erhalten.
  - **Fehlend**: Konfiguration verweist auf eine Plugin-ID, die von der Erkennung nicht gefunden wurde.
  - **Ungültig**: Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema.
</Accordion>

## Erkennung und Vorrang

OpenClaw scannt nach Plugins in dieser Reihenfolge (erster Treffer gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade.
  </Step>

  <Step title="Workspace-Erweiterungen">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Erweiterungen">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Speech).
    Andere erfordern explizite Aktivierung.
  </Step>
</Steps>

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` gewinnt immer gegenüber allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der eingebauten Standardmenge mit default-on, sofern sie nicht überschrieben wird
- Exklusive Slots können das für diesen Slot ausgewählte Plugin zwangsaktivieren

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (immer nur eines aktiv):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // oder "none" zum Deaktivieren
      contextEngine: "legacy", // oder eine Plugin-ID
    },
  },
}
```

| Slot            | Was er steuert        | Standard            |
| --------------- | --------------------- | ------------------- |
| `memory`        | Aktives Memory-Plugin | `memory-core`       |
| `contextEngine` | Aktive Context Engine | `legacy` (integriert) |

## CLI-Referenz

```bash
openclaw plugins list                       # kompaktes Inventar
openclaw plugins list --enabled            # nur geladene Plugins
openclaw plugins list --verbose            # Detailzeilen pro Plugin
openclaw plugins list --json               # maschinenlesbares Inventar
openclaw plugins inspect <id>              # tiefe Details
openclaw plugins inspect <id> --json       # maschinenlesbar
openclaw plugins inspect --all             # Tabelle für die gesamte Flotte
openclaw plugins info <id>                 # Alias für inspect
openclaw plugins doctor                    # Diagnostik

openclaw plugins install <package>         # installieren (zuerst ClawHub, dann npm)
openclaw plugins install clawhub:<pkg>     # nur von ClawHub installieren
openclaw plugins install <spec> --force    # vorhandene Installation überschreiben
openclaw plugins install <path>            # von lokalem Pfad installieren
openclaw plugins install -l <path>         # linken (ohne Kopie) für Entwicklung
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # exakte aufgelöste npm-Spezifikation speichern
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # ein Plugin aktualisieren
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # alle aktualisieren
openclaw plugins uninstall <id>          # Konfigurations-/Installationsdatensätze entfernen
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (zum Beispiel
gebündelte Modell-Provider, gebündelte Speech-Provider und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack direkt.
Es wird mit `--link` nicht unterstützt, da dabei der Quellpfad wiederverwendet wird statt
eine verwaltete Installationszieldatei zu überschreiben.

`--pin` ist nur für npm. Es wird mit `--marketplace` nicht unterstützt, weil
Marketplace-Installationen Metadaten der Marketplace-Quelle statt einer npm-Spezifikation speichern.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Überschreibung für False
Positives des eingebauten Scanners für gefährlichen Code. Es erlaubt Plugin-Installationen
und Plugin-Updates, trotz eingebauter `critical`-Findings fortzufahren, aber es umgeht
weiterhin keine Policy-Blocks von Plugins vom Typ `before_install` und auch kein Blocking bei fehlgeschlagenen Scans.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Skill-
Abhängigkeitsinstallationen verwenden stattdessen die passende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` der separate ClawHub-Download-/Installationsfluss für Skills bleibt.

Kompatible Bundles nehmen am selben Ablauf `plugins list/inspect/enable/disable` teil. Die aktuelle Laufzeitunterstützung umfasst Bundle-Skills, Claude-Befehlsskills,
Claude-Standardeinstellungen in `settings.json`, Claude-Standardeinstellungen für `.lsp.json` und im Manifest deklarierte `lspServers`, Cursor-Befehlsskills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie
unterstützte oder nicht unterstützte MCP- und LSP-Server-Einträge für bundlegestützte Plugins.

Marketplace-Quellen können ein Claude-bekannter Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder
Pfad zu `marketplace.json`, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-
URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repositorys bleiben und dürfen nur relative Pfadquellen verwenden.

Siehe [`openclaw plugins` CLI-Referenz](/cli/plugins) für vollständige Details.

## Überblick über die Plugin-API

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere
Plugins können weiterhin `activate(api)` als alten Alias verwenden, aber neue Plugins sollten
`register` verwenden.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw lädt das Entry-Objekt und ruft während der Plugin-
Aktivierung `register(api)` auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als
öffentlichen Vertrag behandeln.

Gängige Registrierungsmethoden:

| Methode                                  | Was sie registriert         |
| ---------------------------------------- | --------------------------- |
| `registerProvider`                       | Modell-Provider (LLM)       |
| `registerChannel`                        | Chat-Kanal                  |
| `registerTool`                           | Agent-Tool                  |
| `registerHook` / `on(...)`               | Lifecycle-Hooks             |
| `registerSpeechProvider`                 | Text-to-Speech / STT        |
| `registerRealtimeTranscriptionProvider`  | Streaming-STT               |
| `registerRealtimeVoiceProvider`          | Duplex-Echtzeitstimme       |
| `registerMediaUnderstandingProvider`     | Bild-/Audioanalyse          |
| `registerImageGenerationProvider`        | Bildgenerierung             |
| `registerMusicGenerationProvider`        | Musikgenerierung            |
| `registerVideoGenerationProvider`        | Videogenerierung            |
| `registerWebFetchProvider`               | Web-Fetch-/Scrape-Provider  |
| `registerWebSearchProvider`              | Web-Suche                   |
| `registerHttpRoute`                      | HTTP-Endpunkt               |
| `registerCommand` / `registerCli`        | CLI-Befehle                 |
| `registerContextEngine`                  | Context Engine              |
| `registerService`                        | Hintergrunddienst           |

Verhalten von Hook-Guards für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist final; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist final; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist final; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt ein früheres Cancel nicht auf.

Für das vollständige Verhalten typisierter Hooks siehe [SDK-Übersicht](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — Ihr eigenes Plugin erstellen
- [Plugin-Bundles](/de/plugins/bundles) — Kompatibilität mit Codex-/Claude-/Cursor-Bundles
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community-Plugins](/de/plugins/community) — Auflistungen von Drittanbietern
