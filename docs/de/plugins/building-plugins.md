---
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie fügen OpenClaw einen neuen Kanal, Provider, ein neues Tool oder eine andere Fähigkeit hinzu
sidebarTitle: Getting Started
summary: Erstellen Sie in wenigen Minuten Ihr erstes OpenClaw-Plugin
title: Plugins erstellen
x-i18n:
    generated_at: "2026-04-07T06:16:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 509c1f5abe1a0a74966054ed79b71a1a7ee637a43b1214c424acfe62ddf48eef
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Plugins erstellen

Plugins erweitern OpenClaw um neue Fähigkeiten: Kanäle, Modell-Provider,
Speech, Realtime-Transkription, Realtime-Voice, Media Understanding, Image
Generation, Video Generation, Web Fetch, Web Search, Agent-Tools oder eine
beliebige Kombination davon.

Sie müssen Ihr Plugin nicht zum OpenClaw-Repository hinzufügen. Veröffentlichen Sie es auf
[ClawHub](/de/tools/clawhub) oder npm, und Benutzer installieren es mit
`openclaw plugins install <package-name>`. OpenClaw versucht zuerst ClawHub und
fällt dann automatisch auf npm zurück.

## Voraussetzungen

- Node >= 22 und ein Paketmanager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für In-Repo-Plugins: Repository geklont und `pnpm install` ausgeführt

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Kanal-Plugin" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Verbinden Sie OpenClaw mit einer Messaging-Plattform (Discord, IRC usw.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Fügen Sie einen Modell-Provider hinzu (LLM, Proxy oder benutzerdefinierter Endpunkt)
  </Card>
  <Card title="Tool-/Hook-Plugin" icon="wrench">
    Registrieren Sie Agent-Tools, Event-Hooks oder Services — unten weiterlesen
  </Card>
</CardGroup>

Wenn ein Kanal-Plugin optional ist und beim Ausführen von Onboarding/Setup
möglicherweise nicht installiert ist, verwenden Sie `createOptionalChannelSetupSurface(...)` aus
`openclaw/plugin-sdk/channel-setup`. Es erzeugt ein Setup-Adapter-/Wizard-Paar,
das die Installationsanforderung bekannt gibt und bei echten Konfigurationsschreibvorgängen
fehlschlägt, bis das Plugin installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agent-Tool registriert. Kanal-
und Provider-Plugins haben eigene Leitfäden, die oben verlinkt sind.

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
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Jedes Plugin benötigt ein Manifest, auch ohne Konfiguration. Siehe
    [Manifest](/de/plugins/manifest) für das vollständige Schema. Die kanonischen ClawHub-
    Publish-Snippets befinden sich unter `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Einstiegspunkt schreiben">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` ist für Nicht-Kanal-Plugins gedacht. Für Kanäle verwenden Sie
    `defineChannelPluginEntry` — siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins).
    Vollständige Optionen für Einstiegspunkte finden Sie unter [Einstiegspunkte](/de/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testen und veröffentlichen">

    **Externe Plugins:** mit ClawHub validieren und veröffentlichen, dann installieren:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw prüft auch ClawHub vor npm bei reinen Paketspezifikationen wie
    `@myorg/openclaw-my-plugin`.

    **In-Repo-Plugins:** unter dem gebündelten Plugin-Workspace-Baum ablegen — werden automatisch erkannt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Fähigkeiten

Ein einzelnes Plugin kann über das `api`-Objekt beliebig viele Fähigkeiten registrieren:

| Fähigkeit              | Registrierungsmethode                            | Detaillierter Leitfaden                                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Text-Inferenz (LLM)    | `api.registerProvider(...)`                      | [Provider-Plugins](/de/plugins/sdk-provider-plugins)                              |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | [CLI-Backends](/de/gateway/cli-backends)                                          |
| Kanal / Messaging      | `api.registerChannel(...)`                       | [Kanal-Plugins](/de/plugins/sdk-channel-plugins)                                  |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime-Voice         | `api.registerRealtimeVoiceProvider(...)`         | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Media Understanding    | `api.registerMediaUnderstandingProvider(...)`    | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Image Generation       | `api.registerImageGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Music Generation       | `api.registerMusicGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video Generation       | `api.registerVideoGenerationProvider(...)`       | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web Fetch              | `api.registerWebFetchProvider(...)`              | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web Search             | `api.registerWebSearchProvider(...)`             | [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Agent-Tools            | `api.registerTool(...)`                          | Unten                                                                          |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                   | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                    |
| Event-Hooks            | `api.registerHook(...)`                          | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                    |
| HTTP-Routen            | `api.registerHttpRoute(...)`                     | [Internals](/de/plugins/architecture#gateway-http-routes)                         |
| CLI-Unterbefehle       | `api.registerCli(...)`                           | [Einstiegspunkte](/de/plugins/sdk-entrypoints)                                    |

Die vollständige Registrierungs-API finden Sie unter [SDK Overview](/de/plugins/sdk-overview#registration-api).

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, behalten Sie sie unter einem
pluginspezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu
`operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Scope anfordert.

Hook-Guard-Semantik, die Sie beachten sollten:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agent-Ausführung und fordert den Benutzer zur Genehmigung über das Exec-Genehmigungs-Overlay, Telegram-Schaltflächen, Discord-Interaktionen oder den Befehl `/approve` auf jedem Kanal auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.

Der Befehl `/approve` verarbeitet sowohl Exec- als auch Plugin-Genehmigungen mit begrenztem Fallback: Wenn eine Exec-Genehmigungs-ID nicht gefunden wird, versucht OpenClaw dieselbe ID erneut über Plugin-Genehmigungen. Die Weiterleitung von Plugin-Genehmigungen kann unabhängig über `approvals.plugin` in der Konfiguration konfiguriert werden.

Wenn eine benutzerdefinierte Genehmigungsverkabelung denselben begrenzten Fallback-Fall erkennen muss,
verwenden Sie bevorzugt `isApprovalNotFoundError` aus `openclaw/plugin-sdk/error-runtime`,
anstatt Ablaufstrings für Genehmigungen manuell abzugleichen.

Details finden Sie unter [SDK Overview hook decision semantics](/de/plugins/sdk-overview#hook-decision-semantics).

## Agent-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können erforderlich (immer
verfügbar) oder optional (Opt-in durch den Benutzer) sein:

```typescript
register(api) {
  // Erforderliches Tool — immer verfügbar
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optionales Tool — Benutzer muss es zur Allowlist hinzufügen
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
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
- Verwenden Sie `optional: true` für Tools mit Nebeneffekten oder zusätzlichen Binäranforderungen
- Benutzer können alle Tools eines Plugins aktivieren, indem sie die Plugin-ID zu `tools.allow` hinzufügen

## Import-Konventionen

Importieren Sie immer aus gezielten `openclaw/plugin-sdk/<subpath>`-Pfaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Falsch: monolithische Root-Ebene (veraltet, wird entfernt)
import { ... } from "openclaw/plugin-sdk";
```

Die vollständige Referenz der Unterpfade finden Sie unter [SDK Overview](/de/plugins/sdk-overview).

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien (`api.ts`, `runtime-api.ts`) für
interne Importe — importieren Sie niemals Ihr eigenes Plugin über seinen SDK-Pfad.

Für Provider-Plugins sollten providerspezifische Hilfsfunktionen in diesen package-root-
Barrels bleiben, sofern die Schnittstelle nicht wirklich generisch ist. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und `service_tier`- / Beta-Hilfsfunktionen
- OpenAI: Provider-Builder, Hilfsfunktionen für Standardmodelle, Realtime-Provider
- OpenRouter: Provider-Builder sowie Onboarding-/Konfigurationshilfen

Wenn eine Hilfsfunktion nur innerhalb eines gebündelten Provider-Pakets nützlich ist, belassen Sie sie an dieser
package-root-Schnittstelle, anstatt sie in `openclaw/plugin-sdk/*` hochzustufen.

Einige generierte Hilfsschnittstellen unter `openclaw/plugin-sdk/<bundled-id>` existieren weiterhin für
die Wartung gebündelter Plugins und zur Kompatibilität, zum Beispiel
`plugin-sdk/feishu-setup` oder `plugin-sdk/zalo-setup`. Behandeln Sie diese als reservierte
Oberflächen, nicht als Standardmuster für neue Drittanbieter-Plugins.

## Checkliste vor der Einreichung

<Check>**package.json** hat korrekte `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Der Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden gezielte `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Importe verwenden lokale Module, keine SDK-Selbstimporte</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (In-Repo-Plugins)</Check>

## Beta-Release-Tests

1. Achten Sie auf GitHub-Release-Tags auf [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie sie über `Watch` > `Releases`. Beta-Tags sehen aus wie `v2026.3.N-beta.1`. Sie können auch Benachrichtigungen für das offizielle OpenClaw-X-Konto [@openclaw](https://x.com/openclaw) für Release-Ankündigungen aktivieren.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Zeitfenster vor dem stabilen Release beträgt typischerweise nur wenige Stunden.
3. Schreiben Sie nach dem Testen im `plugin-forum`-Discord-Kanal im Thread Ihres Plugins entweder `all good` oder was nicht funktioniert hat. Falls Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas kaputtgeht, eröffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und versehen Sie es mit dem Label `beta-blocker`. Fügen Sie den Issue-Link in Ihren Thread ein.
5. Eröffnen Sie einen PR gegen `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Mitwirkende können PRs nicht labeln, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit PR werden zusammengeführt; Blocker ohne PR werden möglicherweise trotzdem ausgeliefert. Maintainer beobachten diese Threads während der Beta-Tests.
6. Schweigen bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Kanal-Plugins" icon="messages-square" href="/de/plugins/sdk-channel-plugins">
    Erstellen Sie ein Messaging-Kanal-Plugin
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/de/plugins/sdk-provider-plugins">
    Erstellen Sie ein Modell-Provider-Plugin
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/de/plugins/sdk-overview">
    Referenz für Importzuordnung und Registrierungs-API
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/de/plugins/sdk-testing">
    Testhilfen und Muster
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/de/plugins/manifest">
    Vollständige Referenz des Manifest-Schemas
  </Card>
</CardGroup>

## Verwandt

- [Plugin-Architektur](/de/plugins/architecture) — tiefgehender Einblick in die interne Architektur
- [SDK Overview](/de/plugins/sdk-overview) — Referenz zum Plugin SDK
- [Manifest](/de/plugins/manifest) — Plugin-Manifestformat
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) — Kanal-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
