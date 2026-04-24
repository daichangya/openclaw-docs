---
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen.
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung.
    - Sie fügen OpenClaw einen neuen Channel, Provider, ein Tool oder eine andere Fähigkeit hinzu.
sidebarTitle: Getting Started
summary: Erstellen Sie Ihr erstes OpenClaw-Plugin in wenigen Minuten.
title: Building plugins
x-i18n:
    generated_at: "2026-04-24T06:49:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugins erweitern OpenClaw um neue Fähigkeiten: Channels, Modell-Provider,
Sprache, Echtzeit-Transkription, Echtzeit-Voice, Medienverarbeitung, Bild-
Generierung, Video-Generierung, Web-Fetch, Web-Suche, Agent-Tools oder jede
Kombination daraus.

Sie müssen Ihr Plugin nicht zum OpenClaw-Repository hinzufügen. Veröffentlichen Sie es auf
[ClawHub](/de/tools/clawhub) oder npm, und Benutzer installieren es mit
`openclaw plugins install <package-name>`. OpenClaw versucht zuerst ClawHub und
fällt automatisch auf npm zurück.

## Voraussetzungen

- Node >= 22 und ein Paketmanager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für In-Repo-Plugins: Repository geklont und `pnpm install` ausgeführt

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    OpenClaw mit einer Messaging-Plattform verbinden (Discord, IRC usw.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Einen Modell-Provider hinzufügen (LLM, Proxy oder benutzerdefinierter Endpunkt)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench">
    Agent-Tools, Event-Hooks oder Services registrieren — unten weiter
  </Card>
</CardGroup>

Für ein Channel-Plugin, das beim Onboarding/Setup nicht garantiert installiert ist,
verwenden Sie `createOptionalChannelSetupSurface(...)` aus
`openclaw/plugin-sdk/channel-setup`. Es erzeugt ein Setup-Adapter- + Wizard-Paar,
das die Installationsanforderung bekannt macht und bei echten Config-Schreibvorgängen fail-closed ist,
bis das Plugin installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agent-Tool registriert. Channel-
und Provider-Plugins haben eigene Anleitungen, auf die oben verlinkt wird.

<Steps>
  <Step title="Paket und Manifest erstellen">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Fügt OpenClaw ein benutzerdefiniertes Tool hinzu",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Jedes Plugin benötigt ein Manifest, auch ohne Konfiguration. Siehe
    [Manifest](/de/plugins/manifest) für das vollständige Schema. Die kanonischen ClawHub-
    Publish-Snippets befinden sich in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Den Einstiegspunkt schreiben">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Fügt ein benutzerdefiniertes Tool hinzu",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Eine Sache tun",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Erhalten: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` ist für Nicht-Channel-Plugins. Für Channels verwenden Sie
    `defineChannelPluginEntry` — siehe [Channel Plugins](/de/plugins/sdk-channel-plugins).
    Für alle Optionen des Einstiegspunkts siehe [Entry Points](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testen und veröffentlichen">

    **Externe Plugins:** mit ClawHub validieren und veröffentlichen, dann installieren:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw prüft ClawHub auch vor npm bei reinen Paketspezifikationen wie
    `@myorg/openclaw-my-plugin`.

    **In-Repo-Plugins:** unter dem Workspace-Baum für gebündelte Plugins ablegen — wird automatisch erkannt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Fähigkeiten

Ein einzelnes Plugin kann über das Objekt `api` beliebig viele Fähigkeiten registrieren:

| Fähigkeit               | Registrierungsmethode                         | Detaillierte Anleitung                                                            |
| ----------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| Text-Inferenz (LLM)     | `api.registerProvider(...)`                   | [Provider Plugins](/de/plugins/sdk-provider-plugins)                                 |
| CLI-Inferenz-Backend    | `api.registerCliBackend(...)`                 | [CLI Backends](/de/gateway/cli-backends)                                             |
| Channel / Messaging     | `api.registerChannel(...)`                    | [Channel Plugins](/de/plugins/sdk-channel-plugins)                                   |
| Sprache (TTS/STT)       | `api.registerSpeechProvider(...)`             | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Echtzeit-Transkription  | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeit-Voice          | `api.registerRealtimeVoiceProvider(...)`      | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Medienverarbeitung      | `api.registerMediaUnderstandingProvider(...)` | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Bild-Generierung        | `api.registerImageGenerationProvider(...)`    | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Musik-Generierung       | `api.registerMusicGenerationProvider(...)`    | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Video-Generierung       | `api.registerVideoGenerationProvider(...)`    | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Web-Fetch               | `api.registerWebFetchProvider(...)`           | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Web-Suche               | `api.registerWebSearchProvider(...)`          | [Provider Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)   |
| Embedded-Pi-Erweiterung | `api.registerEmbeddedExtensionFactory(...)`   | [SDK Overview](/de/plugins/sdk-overview#registration-api)                            |
| Agent-Tools             | `api.registerTool(...)`                       | Unten                                                                             |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                 | [Entry Points](/de/plugins/sdk-entrypoints)                                          |
| Event-Hooks             | `api.registerHook(...)`                       | [Entry Points](/de/plugins/sdk-entrypoints)                                          |
| HTTP-Routen             | `api.registerHttpRoute(...)`                  | [Internals](/de/plugins/architecture-internals#gateway-http-routes)                  |
| CLI-Unterbefehle        | `api.registerCli(...)`                        | [Entry Points](/de/plugins/sdk-entrypoints)                                          |

Für die vollständige Registrierungs-API siehe [SDK Overview](/de/plugins/sdk-overview#registration-api).

Verwenden Sie `api.registerEmbeddedExtensionFactory(...)`, wenn ein Plugin Pi-native
Hooks des Embedded-Runners benötigt, etwa asynchrones Umschreiben von `tool_result`, bevor die finale
Tool-Ergebnisnachricht ausgegeben wird. Bevorzugen Sie reguläre OpenClaw-Plugin-Hooks, wenn die Arbeit
kein Pi-Erweiterungs-Timing benötigt.

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, halten Sie diese auf einem
pluginspezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu
`operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope anfordert.

Semantik der Hook-Guards, die Sie beachten sollten:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agent-Ausführung und fordert den Benutzer zur Freigabe über das Exec-Freigabe-Overlay, Telegram-Buttons, Discord-Interaktionen oder den Befehl `/approve` in jedem Channel auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.
- `message_received`: bevorzugen Sie das typisierte Feld `threadId`, wenn Sie eingehendes Routing nach Thread/Thema benötigen. Behalten Sie `metadata` für channel-spezifische Extras.
- `message_sending`: bevorzugen Sie typisierte Routing-Felder `replyToId` / `threadId` gegenüber channel-spezifischen Schlüsseln in den Metadaten.

Der Befehl `/approve` verarbeitet sowohl Exec- als auch Plugin-Freigaben mit begrenztem Fallback: Wenn eine Exec-Freigabe-ID nicht gefunden wird, versucht OpenClaw dieselbe ID erneut über Plugin-Freigaben. Das Weiterleiten von Plugin-Freigaben kann unabhängig über `approvals.plugin` in der Konfiguration eingestellt werden.

Wenn benutzerdefinierte Freigabe-Logik genau diesen begrenzten Fallback-Fall erkennen muss,
verwenden Sie bevorzugt `isApprovalNotFoundError` aus `openclaw/plugin-sdk/error-runtime`,
anstatt Strings für abgelaufene Freigaben manuell zu matchen.

Siehe [SDK Overview hook decision semantics](/de/plugins/sdk-overview#hook-decision-semantics) für Details.

## Agent-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können erforderlich sein (immer
verfügbar) oder optional (Opt-in durch den Benutzer):

```typescript
register(api) {
  // Erforderliches Tool — immer verfügbar
  api.registerTool({
    name: "my_tool",
    description: "Eine Sache tun",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optionales Tool — Benutzer muss es zur Allowlist hinzufügen
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Einen Workflow ausführen",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Benutzer aktivieren optionale Tools in der Konfiguration:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tool-Namen dürfen nicht mit Core-Tools kollidieren (Konflikte werden übersprungen)
- Verwenden Sie `optional: true` für Tools mit Seiteneffekten oder zusätzlichen Anforderungen an Binärdateien
- Benutzer können alle Tools eines Plugins aktivieren, indem sie die Plugin-ID zu `tools.allow` hinzufügen

## Import-Konventionen

Importieren Sie immer aus fokussierten Pfaden `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Falsch: monolithischer Root (veraltet, wird entfernt)
import { ... } from "openclaw/plugin-sdk";
```

Für die vollständige Referenz der Subpfade siehe [SDK Overview](/de/plugins/sdk-overview).

Innerhalb Ihres Plugins verwenden Sie lokale Barrel-Dateien (`api.ts`, `runtime-api.ts`) für
interne Imports — importieren Sie Ihr eigenes Plugin niemals über dessen SDK-Pfad.

Bei Provider-Plugins sollten provider-spezifische Helfer in diesen Package-Root-
Barrels bleiben, es sei denn, die Schnittstelle ist wirklich generisch. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und Helfer für `service_tier` / Beta
- OpenAI: Provider-Builder, Default-Model-Helfer, Realtime-Provider
- OpenRouter: Provider-Builder plus Helfer für Onboarding/Konfiguration

Wenn ein Helfer nur innerhalb eines gebündelten Provider-Pakets nützlich ist, behalten Sie ihn auf dieser
Package-Root-Schnittstelle, statt ihn in `openclaw/plugin-sdk/*` hochzustufen.

Einige generierte Hilfsschnittstellen `openclaw/plugin-sdk/<bundled-id>` existieren weiterhin für die Wartung gebündelter Plugins und aus Kompatibilitätsgründen, zum Beispiel
`plugin-sdk/feishu-setup` oder `plugin-sdk/zalo-setup`. Behandeln Sie diese als reservierte
Oberflächen, nicht als Standardmuster für neue Third-Party-Plugins.

## Checkliste vor dem Einreichen

<Check>**package.json** hat korrekte `openclaw`-Metadaten</Check>
<Check>Manifest **openclaw.plugin.json** ist vorhanden und gültig</Check>
<Check>Der Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Imports verwenden fokussierte Pfade `plugin-sdk/<subpath>`</Check>
<Check>Interne Imports verwenden lokale Module, keine SDK-Self-Imports</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (In-Repo-Plugins)</Check>

## Beta-Release-Tests

1. Beobachten Sie GitHub-Release-Tags auf [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie sie über `Watch` > `Releases`. Beta-Tags sehen aus wie `v2026.3.N-beta.1`. Sie können auch Benachrichtigungen für das offizielle OpenClaw-X-Konto [@openclaw](https://x.com/openclaw) für Release-Ankündigungen aktivieren.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Fenster bis zur Stable-Version beträgt typischerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Channel `plugin-forum` entweder `all good` oder was kaputt ist. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas kaputt ist, öffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und versehen Sie es mit dem Label `beta-blocker`. Setzen Sie den Link zum Issue in Ihren Thread.
5. Öffnen Sie einen PR gegen `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Mitwirkende können PRs nicht labeln, daher ist der Titel das Signal auf PR-Seite für Maintainer und Automatisierung. Blocker mit PR werden gemergt; Blocker ohne PR könnten trotzdem ausgeliefert werden. Maintainer beobachten diese Threads während der Beta-Tests.
6. Schweigen bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Ein Messaging-Channel-Plugin bauen
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Ein Modell-Provider-Plugin bauen
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/de/plugins/sdk-overview">
    Referenz für Import-Map und Registrierungs-API
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/de/plugins/sdk-testing">
    Test-Utilities und Muster
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Referenz zum Manifest-Schema
  </Card>
</CardGroup>

## Verwandt

- [Plugin Architecture](/de/plugins/architecture) — tiefer Einblick in die interne Architektur
- [SDK Overview](/de/plugins/sdk-overview) — Referenz zum Plugin SDK
- [Manifest](/de/plugins/manifest) — Format des Plugin-Manifests
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Channel-Plugins bauen
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins bauen
