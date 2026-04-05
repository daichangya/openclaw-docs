---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Discovery und Laderegeln verstehen
    - Mit Codex-/Claude-kompatiblen Plugin-Bundles arbeiten
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-04-05T12:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 707bd3625596f290322aeac9fecb7f4c6f45d595fdfb82ded7cbc8e04457ac7f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins erweitern OpenClaw um neue Fähigkeiten: Channels, Modell-Provider,
Tools, Skills, Speech, Echtzeit-Transkription, Echtzeit-Stimme,
Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf, Web-
suche und mehr. Einige Plugins sind **Core** (werden mit OpenClaw ausgeliefert), andere
sind **extern** (werden von der Community auf npm veröffentlicht).

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

    Konfiguriere es dann unter `plugins.entries.\<id\>.config` in deiner Konfigurationsdatei.

  </Step>
</Steps>

Wenn du lieber chat-native Steuerung verwendest, aktiviere `commands.plugins: true` und nutze:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizit
`clawhub:<pkg>` oder einfache Paketspezifikation (zuerst ClawHub, dann npm-Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise sicher fehl und verweist dich auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein schmaler Pfad zur Neuinstallation gebündelter Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` entscheiden.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                   | Beispiele                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativ**  | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; auf OpenClaw-Features abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Details zu Bundles findest du unter [Plugin-Bundles](/plugins/bundles).

Wenn du ein natives Plugin schreibst, beginne mit [Plugins entwickeln](/plugins/building-plugins)
und dem [SDK-Überblick zu Plugins](/plugins/sdk-overview).

## Offizielle Plugins

### Installierbar (npm)

| Plugin          | Paket                 | Dokumentation                         |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/de/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/de/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/de/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/de/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/plugins/zalouser)   |

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
    - `memory-lancedb` — bei Bedarf installierbares Langzeit-Memory mit automatischem Recall/Capture (setze `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Andere">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die CLI `openclaw browser`, die Gateway-Methode `browser.request`, die Browser-Laufzeit und den Standarddienst zur Browser-Steuerung (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
    - `copilot-proxy` — VS Code Copilot Proxy bridge (standardmäßig deaktiviert)
  </Accordion>
</AccordionGroup>

Du suchst nach Drittanbieter-Plugins? Siehe [Community-Plugins](/plugins/community).

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
| `enabled`        | Master-Schalter (Standard: `true`)                        |
| `allow`          | Plugin-Allowlist (optional)                               |
| `deny`           | Plugin-Denylist (optional; deny hat Vorrang)              |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                 |
| `slots`          | Selektoren für exklusive Slots (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Schalter + Konfiguration pro Plugin                       |

Änderungen an der Konfiguration **erfordern einen Neustart des Gateways**. Wenn das Gateway mit Konfigurations-
Watching + In-Process-Neustart läuft (der Standardpfad `openclaw gateway`), wird dieser
Neustart in der Regel automatisch kurz nach dem Schreiben der Konfiguration durchgeführt.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Das Plugin existiert, wurde aber durch Aktivierungsregeln ausgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die von der Discovery nicht gefunden wurde.
  - **Ungültig**: Das Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema.
</Accordion>

## Discovery und Priorität

OpenClaw scannt in dieser Reihenfolge nach Plugins (der erste Treffer gewinnt):

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
    Mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Speech).
    Andere müssen explizit aktiviert werden.
  </Step>
</Steps>

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins
- `plugins.deny` hat immer Vorrang vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins mit Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen dem integrierten Satz standardmäßig aktivierter Plugins, sofern nichts überschrieben wird
- Exklusive Slots können das für diesen Slot ausgewählte Plugin zwangsaktivieren

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (es ist immer nur eines gleichzeitig aktiv):

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
| `contextEngine` | Aktive Context-Engine | `legacy` (integriert) |

## CLI-Referenz

```bash
openclaw plugins list                       # kompakte Bestandsübersicht
openclaw plugins list --enabled            # nur geladene Plugins
openclaw plugins list --verbose            # Detailzeilen pro Plugin
openclaw plugins list --json               # maschinenlesbare Bestandsübersicht
openclaw plugins inspect <id>              # tiefe Details
openclaw plugins inspect <id> --json       # maschinenlesbar
openclaw plugins inspect --all             # tabellarische Gesamtübersicht
openclaw plugins info <id>                 # Alias für inspect
openclaw plugins doctor                    # Diagnosen

openclaw plugins install <package>         # installieren (zuerst ClawHub, dann npm)
openclaw plugins install clawhub:<pkg>     # nur aus ClawHub installieren
openclaw plugins install <spec> --force    # vorhandene Installation überschreiben
openclaw plugins install <path>            # aus lokalem Pfad installieren
openclaw plugins install -l <path>         # für Entwicklung verlinken (kein Kopieren)
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

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack an Ort und Stelle.
Es wird mit `--link` nicht unterstützt, da dabei der Quellpfad wiederverwendet wird, statt
ein verwaltetes Installationsziel zu überschreiben.

`--pin` ist nur für npm verfügbar. Es wird mit `--marketplace` nicht unterstützt, weil
Marketplace-Installationen Metadaten zur Marketplace-Quelle statt einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist eine Notfall-Überschreibung für Fehlalarme
des integrierten Scanners für gefährlichen Code. Es erlaubt, dass Plugin-Installationen
und Plugin-Aktualisierungen trotz integrierter Befunde der Stufe `critical` fortgesetzt werden, aber es
umgeht weiterhin weder Plugin-Policy-Sperren von `before_install` noch das Blockieren bei Scan-Fehlern.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Aktualisierungsabläufe. Gateway-gestützte Skill-
Abhängigkeitsinstallationen verwenden stattdessen die passende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` weiterhin der separate ClawHub-
Ablauf zum Herunterladen/Installieren von Skills bleibt.

Kompatible Bundles nehmen am selben Ablauf `plugin list/inspect/enable/disable` teil.
Die aktuelle Laufzeitunterstützung umfasst Bundle-Skills, Claude-Command-Skills,
Standardwerte aus Claude-`settings.json`, Standardwerte aus Claude-`.lsp.json` und manifest-deklarierten
`lspServers`, Cursor-Command-Skills und kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie
unterstützte oder nicht unterstützte MCP- und LSP-Server-Einträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein bekannter Claude-Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, eine lokale Marketplace-Wurzel oder ein
Pfad zu `marketplace.json`, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-
URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repos bleiben und dürfen nur relative Pfadequellen verwenden.

Vollständige Details findest du in der [CLI-Referenz für `openclaw plugins`](/cli/plugins).

## Überblick über die Plugin-API

Native Plugins exportieren ein Einstiegsobjekt, das `register(api)` bereitstellt. Ältere
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

OpenClaw lädt das Einstiegsobjekt und ruft `register(api)` während der Plugin-
Aktivierung auf. Der Loader greift für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als öffentlichen Vertrag behandeln.

Häufige Registrierungsmethoden:

| Methode                                  | Was sie registriert         |
| ---------------------------------------- | --------------------------- |
| `registerProvider`                       | Modell-Provider (LLM)       |
| `registerChannel`                        | Chat-Channel                |
| `registerTool`                           | Agent-Tool                  |
| `registerHook` / `on(...)`               | Lebenszyklus-Hooks          |
| `registerSpeechProvider`                 | Text-to-Speech / STT        |
| `registerRealtimeTranscriptionProvider`  | Streaming-STT               |
| `registerRealtimeVoiceProvider`          | Duplex-Echtzeit-Stimme      |
| `registerMediaUnderstandingProvider`     | Bild-/Audio-Analyse         |
| `registerImageGenerationProvider`        | Bildgenerierung             |
| `registerVideoGenerationProvider`        | Videogenerierung            |
| `registerWebFetchProvider`               | Web-Abruf-/Scrape-Provider  |
| `registerWebSearchProvider`              | Websuche                    |
| `registerHttpRoute`                      | HTTP-Endpunkt               |
| `registerCommand` / `registerCli`        | CLI-Befehle                 |
| `registerContextEngine`                  | Context-Engine              |
| `registerService`                        | Hintergrunddienst           |

Verhalten der Hook-Schranken für typisierte Lebenszyklus-Hooks:

- `before_tool_call`: `{ block: true }` ist final; Handler mit geringerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist final; Handler mit geringerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist final; Handler mit geringerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt eine frühere Abbruchentscheidung nicht auf.

Vollständiges Verhalten typisierter Hooks findest du unter [SDK-Überblick](/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Plugins entwickeln](/plugins/building-plugins) — ein eigenes Plugin erstellen
- [Plugin-Bundles](/plugins/bundles) — Kompatibilität mit Codex-/Claude-/Cursor-Bundles
- [Plugin-Manifest](/plugins/manifest) — Manifest-Schema
- [Tools registrieren](/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community-Plugins](/plugins/community) — Drittanbieter-Listen
