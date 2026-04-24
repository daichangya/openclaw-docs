---
read_when:
    - Plugins installieren oder konfigurieren
    - Discovery- und Lade-Regeln für Plugins verstehen
    - Mit Codex-/Claude-kompatiblen Plugin-Bundles arbeiten
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-24T07:05:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a93114ddb312552f4c321b6e318f3e19810cf5059dd0c68fde93da41936566b8
    source_path: tools/plugin.md
    workflow: 15
---

Plugins erweitern OpenClaw um neue Fähigkeiten: Kanäle, Modell-Provider,
Tools, Skills, Speech, Realtime-Transkription, Realtime-Voice,
Medienverständnis, Bildgenerierung, Videogenerierung, Web-Fetch, Web-
Search und mehr. Einige Plugins sind **core** (mit OpenClaw ausgeliefert), andere
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

    Konfigurieren Sie anschließend unter `plugins.entries.\<id\>.config` in Ihrer Konfigurationsdatei.

  </Step>
</Steps>

Wenn Sie chat-native Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizites
`clawhub:<pkg>` oder nackte Paketspezifikation (zuerst ClawHub, dann npm-Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise geschlossen fehl und verweist Sie auf
`openclaw doctor --fix`. Die einzige Ausnahme zur Wiederherstellung ist ein schmaler Pfad zum Neuinstallieren gebündelter Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` anmelden.

Paketierte OpenClaw-Installationen installieren den Laufzeit-Abhängigkeitsbaum nicht im Voraus für jedes gebündelte Plugin.
Wenn ein gebündeltes, OpenClaw-eigenes Plugin über
Plugin-Konfiguration, alte Kanal-Konfiguration oder ein standardmäßig aktiviertes Manifest aktiv ist, repariert der Start
nur die vom Plugin deklarierten Laufzeit-Abhängigkeiten, bevor es importiert wird.
Externe Plugins und benutzerdefinierte Ladepfade müssen weiterhin über
`openclaw plugins install` installiert werden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                   | Beispiele                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; auf OpenClaw-Funktionen abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Details zu Bundles finden Sie unter [Plugin Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Building Plugins](/de/plugins/building-plugins)
und [Plugin SDK Overview](/de/plugins/sdk-overview).

## Offizielle Plugins

### Installierbar (npm)

| Plugin          | Paket                 | Dokumentation                          |
| --------------- | --------------------- | -------------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/de/channels/matrix)             |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/de/channels/msteams)   |
| Nostr           | `@openclaw/nostr`     | [Nostr](/de/channels/nostr)               |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/de/plugins/voice-call)      |
| Zalo            | `@openclaw/zalo`      | [Zalo](/de/channels/zalo)                 |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/de/plugins/zalouser)     |

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
    - `memory-lancedb` — On-Demand-Installation für Langzeitspeicher mit automatischem Recall/Capture (setzen Sie `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstiges">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, `openclaw browser` CLI, die Gateway-Methode `browser.request`, Browser-Laufzeit und den Standarddienst zur Browser-Steuerung (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — Bridge für VS Code Copilot Proxy (standardmäßig deaktiviert)
  </Accordion>
</AccordionGroup>

Suchen Sie nach Plugins von Drittanbietern? Siehe [Community Plugins](/de/plugins/community).

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

| Feld             | Beschreibung                                              |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Master-Schalter (Standard: `true`)                        |
| `allow`          | Plugin-Allowlist (optional)                               |
| `deny`           | Plugin-Denylist (optional; deny hat Vorrang)              |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                 |
| `slots`          | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Pluginspezifische Schalter + Konfiguration                |

Änderungen an der Konfiguration **erfordern einen Gateway-Neustart**. Wenn das Gateway mit Konfigurations-
Watch + In-Process-Neustart läuft (der Standardpfad von `openclaw gateway`), wird dieser
Neustart normalerweise kurz nach dem Schreiben der Konfiguration automatisch durchgeführt.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, wurde aber durch Aktivierungsregeln ausgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die durch Discovery nicht gefunden wurde.
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
    Mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Speech).
    Andere erfordern explizite Aktivierung.
  </Step>
</Steps>

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` hat immer Vorrang vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der integrierten Menge von standardmäßig aktivierten Plugins, sofern nicht überschrieben
- Exklusive Slots können das für diesen Slot ausgewählte Plugin zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  plugin-eigene Oberfläche benennt, etwa eine Provider-Modell-Ref, Kanal-Konfiguration oder Harness-
  Laufzeit
- Codex-Routen der OpenAI-Familie behalten separate Plugin-Grenzen:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin über `embeddedHarness.runtime: "codex"` oder Legacy-
  Modell-Refs `codex/*` ausgewählt wird

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (jeweils nur eine aktive gleichzeitig):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // oder "none", um es zu deaktivieren
      contextEngine: "legacy", // oder eine Plugin-ID
    },
  },
}
```

| Slot            | Wodurch er gesteuert wird | Standard             |
| --------------- | ------------------------- | -------------------- |
| `memory`        | Aktives Memory-Plugin     | `memory-core`        |
| `contextEngine` | Aktive Kontext-Engine     | `legacy` (integriert) |

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
openclaw plugins install clawhub:<pkg>     # nur aus ClawHub installieren
openclaw plugins install <spec> --force    # vorhandene Installation überschreiben
openclaw plugins install <path>            # von lokalem Pfad installieren
openclaw plugins install -l <path>         # linken (nicht kopieren) für Entwicklung
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # exakte aufgelöste npm-Spezifikation speichern
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

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele davon sind standardmäßig aktiviert (zum Beispiel
gebündelte Modell-Provider, gebündelte Speech-Provider und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack direkt. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-
Plugins. Es wird nicht zusammen mit `--link` unterstützt, da dort der Quellpfad weiterverwendet wird,
statt ihn über ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
installierte Plugin-ID dieser Allowlist hinzu, bevor es das Plugin aktiviert, sodass Installationen
nach dem Neustart sofort ladbar sind.

`openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte Installationen. Übergibt man
eine npm-Paketspezifikation mit Dist-Tag oder exakter Version, wird der Paketname zurück
auf den nachverfolgten Plugin-Datensatz aufgelöst und die neue Spezifikation für zukünftige Updates gespeichert.
Wenn nur der Paketname ohne Version übergeben wird, wird eine exakt gepinnte Installation wieder auf
die Standard-Release-Linie des Registry zurückgestellt. Wenn das installierte npm-Plugin bereits
zur aufgelösten Version und zur gespeicherten Artefakt-Identität passt, überspringt OpenClaw das Update,
ohne herunterzuladen, neu zu installieren oder Konfiguration neu zu schreiben.

`--pin` gilt nur für npm. Es wird nicht zusammen mit `--marketplace` unterstützt, da
Marketplace-Installationen Metadaten der Marketplace-Quelle statt einer npm-Spezifikation speichern.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Überschreibung für Fehlalarme
des integrierten Scanners für gefährlichen Code. Damit können Plugin-Installationen
und Plugin-Updates trotz integrierter `critical`-Befunde fortgesetzt werden, es
umgeht aber weiterhin weder `before_install`-Richtlinien von Plugins noch Blockierung durch Scan-Fehler.

Dieses CLI-Flag gilt nur für Abläufe zum Installieren/Aktualisieren von Plugins. Gateway-gestützte Skill-
Abhängigkeitsinstallationen verwenden stattdessen die passende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` weiterhin der separate ClawHub-Ablauf zum Herunterladen/Installieren von Skills bleibt.

Kompatible Bundles nehmen am selben Ablauf für plugin list/inspect/enable/disable teil.
Die aktuelle Laufzeitunterstützung umfasst Bundle-Skills, Claude command-skills,
Claude-Standards aus `settings.json`, Claude `.lsp.json` und in Manifests deklarierte
`lspServers`-Standards, Cursor command-skills und kompatible Codex-Hook-Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie
unterstützte oder nicht unterstützte MCP- und LSP-Server-Einträge für bundlegestützte Plugins.

Marketplace-Quellen können ein bekannter Claude-Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, eine lokale Marketplace-Wurzel oder ein
Pfad zu `marketplace.json`, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-
URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repositorys bleiben und dürfen nur relative Pfadquellen verwenden.

Vollständige Details finden Sie in der [`openclaw plugins` CLI reference](/de/cli/plugins).

## Überblick über die Plugin-API

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere
Plugins können noch `activate(api)` als Legacy-Alias verwenden, aber neue Plugins sollten
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

OpenClaw lädt das Entry-Objekt und ruft `register(api)` während der Plugin-
Aktivierung auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als den öffentlichen Vertrag behandeln.

Häufige Registrierungs-Methoden:

| Methode                                 | Was registriert wird         |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)        |
| `registerChannel`                       | Chat-Kanal                   |
| `registerTool`                          | Agenten-Tool                 |
| `registerHook` / `on(...)`              | Lifecycle-Hooks              |
| `registerSpeechProvider`                | Text-to-Speech / STT         |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                |
| `registerRealtimeVoiceProvider`         | Duplex-Realtime-Voice        |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse           |
| `registerImageGenerationProvider`       | Bildgenerierung              |
| `registerMusicGenerationProvider`       | Musikgenerierung             |
| `registerVideoGenerationProvider`       | Videogenerierung             |
| `registerWebFetchProvider`              | Web-Fetch-/Scrape-Provider   |
| `registerWebSearchProvider`             | Websuche                     |
| `registerHttpRoute`                     | HTTP-Endpunkt                |
| `registerCommand` / `registerCli`       | CLI-Befehle                  |
| `registerContextEngine`                 | Kontext-Engine               |
| `registerService`                       | Hintergrunddienst            |

Verhalten von Hook-Guards für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt ein früheres Cancel nicht auf.

Für das vollständige Verhalten typisierter Hooks siehe [SDK Overview](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Building Plugins](/de/plugins/building-plugins) — Ihr eigenes Plugin erstellen
- [Plugin Bundles](/de/plugins/bundles) — Kompatibilität mit Codex-/Claude-/Cursor-Bundles
- [Plugin Manifest](/de/plugins/manifest) — Manifest-Schema
- [Registering Tools](/de/plugins/building-plugins#registering-agent-tools) — Agenten-Tools in einem Plugin hinzufügen
- [Plugin Internals](/de/plugins/architecture) — Fähigkeitsmodell und Lade-Pipeline
- [Community Plugins](/de/plugins/community) — Listings von Drittanbietern
