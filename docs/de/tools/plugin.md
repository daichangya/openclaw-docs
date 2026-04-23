---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Discovery und Laderegeln verstehen
    - Mit Codex-/Claude-kompatiblen Plugin-Bundles arbeiten
sidebarTitle: Install and Configure
summary: Plugins für OpenClaw installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-23T14:07:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins erweitern OpenClaw um neue Fähigkeiten: Channels, Modell-Provider,
Tools, Skills, Speech, Echtzeit-Transkription, Echtzeit-Stimme,
Medienverständnis, Bildgenerierung, Videogenerierung, Web-Fetch, Web-
Suche und mehr. Einige Plugins sind **core** (werden mit OpenClaw ausgeliefert), andere
sind **external** (von der Community auf npm veröffentlicht).

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

    Dann unter `plugins.entries.\<id\>.config` in Ihrer Konfigurationsdatei konfigurieren.

  </Step>
</Steps>

Wenn Sie eine chatnative Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizites
`clawhub:<pkg>` oder nackte Package-Spec (erst ClawHub, dann npm-Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise fail-closed fehl und verweist auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein enger Neuinstallationspfad für gebündelte Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` entscheiden.

Paketierte OpenClaw-Installationen installieren nicht eager den gesamten Laufzeit-Abhängigkeitsbaum jedes gebündelten Plugins.
Wenn ein gebündeltes, OpenClaw-eigenes Plugin über die Plugin-Konfiguration, veraltete Channel-Konfiguration oder ein standardmäßig aktiviertes Manifest aktiv ist,
repariert der Start nur die deklarierten Laufzeit-Abhängigkeiten dieses Plugins, bevor es importiert wird.
Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin über
`openclaw plugins install` installiert werden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                     | Beispiele                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; auf OpenClaw-Fähigkeiten abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Siehe [Plugin Bundles](/de/plugins/bundles) für Details zu Bundles.

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Building Plugins](/de/plugins/building-plugins)
und der [Plugin SDK Overview](/de/plugins/sdk-overview).

## Offizielle Plugins

### Installierbar (npm)

| Plugin          | Paket                  | Dokumentation                        |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/de/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/de/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/de/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/de/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/de/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/de/plugins/zalouser)   |

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
    - `memory-lancedb` — On-Demand installierbarer Langzeitspeicher mit Auto-Recall/-Capture (setzen Sie `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Weitere">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die CLI `openclaw browser`, die Gateway-Methode `browser.request`, die Browser-Laufzeit und den Standard-Browser-Control-Service (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — VS Code Copilot Proxy bridge (standardmäßig deaktiviert)
  </Accordion>
</AccordionGroup>

Sie suchen nach Plugins von Drittanbietern? Siehe [Community Plugins](/de/plugins/community).

## Konfiguration

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Feld             | Beschreibung                                            |
| ---------------- | ------------------------------------------------------- |
| `enabled`        | Master-Schalter (Standard: `true`)                      |
| `allow`          | Plugin-Allowlist (optional)                             |
| `deny`           | Plugin-Denylist (optional; deny gewinnt)                |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse               |
| `slots`          | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Umschalter + Konfiguration pro Plugin                   |

Änderungen an der Konfiguration **erfordern einen Neustart des Gateway**. Wenn das Gateway mit Konfigurations-
Watch + In-Process-Neustart läuft (der Standardpfad `openclaw gateway`), wird dieser
Neustart in der Regel kurz nach dem Schreiben der Konfiguration automatisch durchgeführt.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, aber Aktivierungsregeln haben es ausgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die von Discovery nicht gefunden wurde.
  - **Ungültig**: Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema.
</Accordion>

## Discovery und Priorität

OpenClaw durchsucht Plugins in dieser Reihenfolge (erster Treffer gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade.
  </Step>

  <Step title="Workspace-Plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Speech).
    Andere erfordern eine explizite Aktivierung.
  </Step>
</Steps>

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` gewinnt immer vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins mit Ursprung im Workspace sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen dem eingebauten Standard-On-Set, sofern nicht überschrieben
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsweise aktivieren

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (es kann jeweils nur eine aktiv sein):

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

| Slot            | Was er steuert          | Standard            |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Aktives Memory-Plugin   | `memory-core`       |
| `contextEngine` | Aktive Context Engine   | `legacy` (integriert) |

## CLI-Referenz

```bash
openclaw plugins list                       # kompaktes Inventar
openclaw plugins list --enabled            # nur geladene Plugins
openclaw plugins list --verbose            # Detailzeilen pro Plugin
openclaw plugins list --json               # maschinenlesbares Inventar
openclaw plugins inspect <id>              # tiefe Details
openclaw plugins inspect <id> --json       # maschinenlesbar
openclaw plugins inspect --all             # tabellenweite Flottenansicht
openclaw plugins info <id>                 # Alias für inspect
openclaw plugins doctor                    # Diagnosen

openclaw plugins install <package>         # installieren (erst ClawHub, dann npm)
openclaw plugins install clawhub:<pkg>     # nur aus ClawHub installieren
openclaw plugins install <spec> --force    # bestehende Installation überschreiben
openclaw plugins install <path>            # aus lokalem Pfad installieren
openclaw plugins install -l <path>         # verlinken (ohne Kopie) für Entwicklung
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # exakt aufgelöste npm-Spec protokollieren
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # ein Plugin aktualisieren
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
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

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack an Ort und Stelle. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-
Plugins. Es wird mit `--link` nicht unterstützt, da dabei der Quellpfad wiederverwendet wird,
anstatt über ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
installierte Plugin-ID dieser Allowlist hinzu, bevor es sie aktiviert, sodass Installationen
nach dem Neustart sofort geladen werden können.

`openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte Installationen. Die Übergabe
einer npm-Package-Spec mit Dist-Tag oder exakter Version löst den Paketnamen
zurück auf den nachverfolgten Plugin-Datensatz auf und protokolliert die neue Spec für künftige Updates.
Die Übergabe des Paketnamens ohne Version verschiebt eine exakt gepinnte Installation zurück auf
die Standard-Release-Linie der Registry. Wenn das installierte npm-Plugin bereits der
aufgelösten Version und der protokollierten Artefaktidentität entspricht, überspringt OpenClaw das Update,
ohne herunterzuladen, neu zu installieren oder die Konfiguration neu zu schreiben.

`--pin` ist nur für npm. Es wird mit `--marketplace` nicht unterstützt, weil
Marketplace-Installationen Quellmetadaten des Marketplace anstelle einer npm-Spec persistieren.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Überschreibung für False Positives
des eingebauten Scanners für gefährlichen Code. Sie erlaubt Plugin-Installationen
und Plugin-Updates, trotz eingebauter `critical`-Findings fortzufahren, umgeht aber weiterhin
weder `before_install`-Policy-Blocks des Plugins noch die Blockierung bei fehlgeschlagenem Scan.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Skill-
Abhängigkeitsinstallationen verwenden stattdessen die passende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` der separate ClawHub-
Skill-Download-/Installationsablauf bleibt.

Kompatible Bundles nehmen am selben Ablauf für plugin list/inspect/enable/disable
teil. Die aktuelle Laufzeitunterstützung umfasst Bundle-Skills, Claude-Command-Skills,
Standardwerte aus Claude-`settings.json`, Claude-`.lsp.json` und manifestdeklarierte
Standardwerte für `lspServers`, Cursor-Command-Skills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie
unterstützte oder nicht unterstützte MCP- und LSP-Server-Einträge für bundlegestützte Plugins.

Marketplace-Quellen können ein bekannter Marketplace-Name von Claude aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder
ein Pfad zu `marketplace.json`, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-
URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repositorys bleiben und dürfen nur relative Pfadquellen verwenden.

Siehe [CLI-Referenz für `openclaw plugins`](/de/cli/plugins) für vollständige Details.

## Überblick über die Plugin-API

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere
Plugins können weiterhin `activate(api)` als veralteten Alias verwenden, aber neue Plugins sollten
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
aber gebündelte Plugins und neue externe Plugins sollten `register` als öffentlichen Vertrag behandeln.

Häufige Registrierungsmethoden:

| Methode                                  | Was sie registriert            |
| ---------------------------------------- | ------------------------------ |
| `registerProvider`                       | Modell-Provider (LLM)          |
| `registerChannel`                        | Chat-Channel                   |
| `registerTool`                           | Agent-Tool                     |
| `registerHook` / `on(...)`               | Lifecycle-Hooks                |
| `registerSpeechProvider`                 | Text-to-Speech / STT           |
| `registerRealtimeTranscriptionProvider`  | Streaming-STT                  |
| `registerRealtimeVoiceProvider`          | Duplex-Echtzeitstimme          |
| `registerMediaUnderstandingProvider`     | Bild-/Audioanalyse             |
| `registerImageGenerationProvider`        | Bildgenerierung                |
| `registerMusicGenerationProvider`        | Musikgenerierung               |
| `registerVideoGenerationProvider`        | Videogenerierung               |
| `registerWebFetchProvider`               | Provider für Web-Fetch / Scraping |
| `registerWebSearchProvider`              | Websuche                       |
| `registerHttpRoute`                      | HTTP-Endpoint                  |
| `registerCommand` / `registerCli`        | CLI-Befehle                    |
| `registerContextEngine`                  | Context Engine                 |
| `registerService`                        | Hintergrunddienst              |

Guard-Verhalten für getypte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt ein früheres Cancel nicht auf.

Zum vollständigen Verhalten getypter Hooks siehe [SDK Overview](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Building Plugins](/de/plugins/building-plugins) — eigenes Plugin erstellen
- [Plugin Bundles](/de/plugins/bundles) — Kompatibilität mit Codex-/Claude-/Cursor-Bundles
- [Plugin Manifest](/de/plugins/manifest) — Manifest-Schema
- [Registering Tools](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin Internals](/de/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community Plugins](/de/plugins/community) — Listings von Drittanbietern
