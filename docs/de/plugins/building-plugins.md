---
read_when:
    - Sie möchten ein neues OpenClaw-Plugin erstellen
    - Sie benötigen einen Schnellstart für die Plugin-Entwicklung
    - Sie fügen OpenClaw einen neuen Kanal, Provider, ein Tool oder eine andere Fähigkeit hinzu
sidebarTitle: Getting Started
summary: Erstellen Sie in wenigen Minuten Ihr erstes OpenClaw-Plugin
title: Building Plugins
x-i18n:
    generated_at: "2026-04-05T12:50:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26e780d3f04270b79d1d8f8076d6c3c5031915043e78fb8174be921c6bdd60c9
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Building Plugins

Plugins erweitern OpenClaw um neue Fähigkeiten: Kanäle, Modell-Provider,
Sprachausgabe, Echtzeit-Transkription, Echtzeit-Sprache, Medienverständnis,
Bildgenerierung, Videogenerierung, Web-Abruf, Websuche, Agent-Tools oder eine
beliebige Kombination davon.

Sie müssen Ihr Plugin nicht dem OpenClaw-Repository hinzufügen. Veröffentlichen Sie es in
[ClawHub](/tools/clawhub) oder auf npm, und Benutzer installieren es mit
`openclaw plugins install <package-name>`. OpenClaw versucht zuerst ClawHub und
fällt dann automatisch auf npm zurück.

## Voraussetzungen

- Node >= 22 und ein Paketmanager (npm oder pnpm)
- Vertrautheit mit TypeScript (ESM)
- Für In-Repo-Plugins: Repository geklont und `pnpm install` ausgeführt

## Welche Art von Plugin?

<CardGroup cols={3}>
  <Card title="Kanal-Plugin" icon="messages-square" href="/plugins/sdk-channel-plugins">
    OpenClaw mit einer Messaging-Plattform verbinden (Discord, IRC usw.)
  </Card>
  <Card title="Provider-Plugin" icon="cpu" href="/plugins/sdk-provider-plugins">
    Einen Modell-Provider hinzufügen (LLM, Proxy oder benutzerdefinierter Endpunkt)
  </Card>
  <Card title="Tool- / Hook-Plugin" icon="wrench">
    Agent-Tools, Event-Hooks oder Dienste registrieren — weiter unten
  </Card>
</CardGroup>

Wenn ein Kanal-Plugin optional ist und beim Onboarding/Setup
möglicherweise nicht installiert ist, verwenden Sie `createOptionalChannelSetupSurface(...)` aus
`openclaw/plugin-sdk/channel-setup`. Es erzeugt ein Setup-Adapter-/Wizard-Paar,
das auf die Installationsanforderung hinweist und echte Konfigurationsschreibvorgänge
blockiert, bis das Plugin installiert ist.

## Schnellstart: Tool-Plugin

Diese Anleitung erstellt ein minimales Plugin, das ein Agent-Tool registriert. Kanal-
und Provider-Plugins haben eigene Anleitungen, die oben verlinkt sind.

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
    [Manifest](/plugins/manifest) für das vollständige Schema. Die kanonischen
    ClawHub-Veröffentlichungssnippets befinden sich in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Den Einstiegspunkt schreiben">

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

    `definePluginEntry` ist für Nicht-Kanal-Plugins. Für Kanäle verwenden Sie
    `defineChannelPluginEntry` — siehe [Kanal-Plugins](/plugins/sdk-channel-plugins).
    Die vollständigen Optionen für Einstiegspunkte finden Sie unter [Einstiegspunkte](/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testen und veröffentlichen">

    **Externe Plugins:** Mit ClawHub validieren und veröffentlichen, dann installieren:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw prüft bei einfachen Paketspezifikationen wie
    `@myorg/openclaw-my-plugin` ebenfalls zuerst ClawHub vor npm.

    **In-Repo-Plugins:** Im Workspace-Baum der gebündelten Plugins ablegen — werden automatisch erkannt.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin-Fähigkeiten

Ein einzelnes Plugin kann über das `api`-Objekt eine beliebige Anzahl von Fähigkeiten registrieren:

| Fähigkeit              | Registrierungsmethode                           | Detaillierte Anleitung                                                         |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Textinferenz (LLM)     | `api.registerProvider(...)`                      | [Provider-Plugins](/plugins/sdk-provider-plugins)                              |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | [CLI-Backends](/de/gateway/cli-backends)                                          |
| Kanal / Messaging      | `api.registerChannel(...)`                       | [Kanal-Plugins](/plugins/sdk-channel-plugins)                                  |
| Sprache (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Provider-Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider-Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Echtzeit-Sprache       | `api.registerRealtimeVoiceProvider(...)`         | [Provider-Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | [Provider-Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`       | [Provider-Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`       | [Provider-Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | [Provider-Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Websuche               | `api.registerWebSearchProvider(...)`             | [Provider-Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Agent-Tools            | `api.registerTool(...)`                          | Unten                                                                          |
| Benutzerdefinierte Befehle | `api.registerCommand(...)`                   | [Einstiegspunkte](/plugins/sdk-entrypoints)                                    |
| Event-Hooks            | `api.registerHook(...)`                          | [Einstiegspunkte](/plugins/sdk-entrypoints)                                    |
| HTTP-Routen            | `api.registerHttpRoute(...)`                     | [Interna](/plugins/architecture#gateway-http-routes)                           |
| CLI-Unterbefehle       | `api.registerCli(...)`                           | [Einstiegspunkte](/plugins/sdk-entrypoints)                                    |

Die vollständige Registrierungs-API finden Sie unter [SDK Overview](/plugins/sdk-overview#registration-api).

Wenn Ihr Plugin benutzerdefinierte Gateway-RPC-Methoden registriert, verwenden Sie dafür
ein pluginspezifisches Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu
`operator.admin` aufgelöst, auch wenn ein Plugin einen engeren Scope anfordert.

Zu beachtende Semantik für Hook-Guards:

- `before_tool_call`: `{ block: true }` ist endgültig und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` wird als keine Entscheidung behandelt.
- `before_tool_call`: `{ requireApproval: true }` pausiert die Agent-Ausführung und fordert den Benutzer zur Freigabe über das Overlay für Ausführungsfreigaben, Telegram-Schaltflächen, Discord-Interaktionen oder den Befehl `/approve` auf jedem Kanal auf.
- `before_install`: `{ block: true }` ist endgültig und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` wird als keine Entscheidung behandelt.
- `message_sending`: `{ cancel: true }` ist endgültig und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` wird als keine Entscheidung behandelt.

Der Befehl `/approve` verarbeitet sowohl Ausführungs- als auch Plugin-Freigaben mit begrenztem Fallback: Wenn eine ID für eine Ausführungsfreigabe nicht gefunden wird, versucht OpenClaw dieselbe ID erneut über Plugin-Freigaben. Die Weiterleitung von Plugin-Freigaben kann unabhängig über `approvals.plugin` in der Konfiguration konfiguriert werden.

Wenn eine benutzerdefinierte Freigabelogik genau diesen begrenzten Fallback-Fall erkennen muss,
verwenden Sie bevorzugt `isApprovalNotFoundError` aus `openclaw/plugin-sdk/error-runtime`,
anstatt manuell auf Zeichenfolgen für abgelaufene Freigaben zu prüfen.

Einzelheiten finden Sie unter [SDK Overview hook decision semantics](/plugins/sdk-overview#hook-decision-semantics).

## Agent-Tools registrieren

Tools sind typisierte Funktionen, die das LLM aufrufen kann. Sie können erforderlich (immer
verfügbar) oder optional (Benutzer aktiviert sie explizit) sein:

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
- Verwenden Sie `optional: true` für Tools mit Seiteneffekten oder zusätzlichen Binäranforderungen
- Benutzer können alle Tools eines Plugins aktivieren, indem sie die Plugin-ID zu `tools.allow` hinzufügen

## Importkonventionen

Importieren Sie immer aus fokussierten `openclaw/plugin-sdk/<subpath>`-Pfaden:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Falsch: monolithische Root (veraltet, wird entfernt)
import { ... } from "openclaw/plugin-sdk";
```

Die vollständige Referenz der Subpaths finden Sie unter [SDK Overview](/plugins/sdk-overview).

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien (`api.ts`, `runtime-api.ts`) für
interne Importe — importieren Sie niemals Ihr eigenes Plugin über seinen SDK-Pfad.

Behalten Sie bei Provider-Plugins providerspezifische Hilfsfunktionen in diesen paketweiten
Barrels, sofern die Schnittstelle nicht wirklich generisch ist. Aktuelle gebündelte Beispiele:

- Anthropic: Claude-Stream-Wrapper und Hilfsfunktionen für `service_tier` / Beta
- OpenAI: Provider-Builder, Hilfsfunktionen für Standardmodelle, Echtzeit-Provider
- OpenRouter: Provider-Builder plus Hilfsfunktionen für Onboarding/Konfiguration

Wenn eine Hilfsfunktion nur innerhalb eines gebündelten Provider-Pakets nützlich ist, behalten Sie sie auf dieser
paketweiten Schnittstelle, anstatt sie nach `openclaw/plugin-sdk/*` hochzustufen.

Einige generierte Hilfsschnittstellen unter `openclaw/plugin-sdk/<bundled-id>` existieren weiterhin für
die Wartung gebündelter Plugins und aus Kompatibilitätsgründen, zum Beispiel
`plugin-sdk/feishu-setup` oder `plugin-sdk/zalo-setup`. Behandeln Sie diese als reservierte
Oberflächen, nicht als Standardmuster für neue Drittanbieter-Plugins.

## Checkliste vor der Einreichung

<Check>**package.json** hat korrekte `openclaw`-Metadaten</Check>
<Check>**openclaw.plugin.json**-Manifest ist vorhanden und gültig</Check>
<Check>Der Einstiegspunkt verwendet `defineChannelPluginEntry` oder `definePluginEntry`</Check>
<Check>Alle Importe verwenden fokussierte `plugin-sdk/<subpath>`-Pfade</Check>
<Check>Interne Importe verwenden lokale Module, keine SDK-Selbstimporte</Check>
<Check>Tests bestehen (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` besteht (In-Repo-Plugins)</Check>

## Beta-Release-Tests

1. Achten Sie auf GitHub-Release-Tags auf [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) und abonnieren Sie sie über `Watch` > `Releases`. Beta-Tags sehen etwa so aus: `v2026.3.N-beta.1`. Sie können auch Benachrichtigungen für das offizielle OpenClaw-X-Konto [@openclaw](https://x.com/openclaw) aktivieren, um Release-Ankündigungen zu erhalten.
2. Testen Sie Ihr Plugin gegen das Beta-Tag, sobald es erscheint. Das Zeitfenster bis zum Stable-Release beträgt typischerweise nur wenige Stunden.
3. Posten Sie nach dem Testen im Thread Ihres Plugins im Discord-Kanal `plugin-forum` entweder `all good` oder was nicht funktioniert hat. Wenn Sie noch keinen Thread haben, erstellen Sie einen.
4. Wenn etwas nicht funktioniert, öffnen oder aktualisieren Sie ein Issue mit dem Titel `Beta blocker: <plugin-name> - <summary>` und versehen Sie es mit dem Label `beta-blocker`. Fügen Sie den Issue-Link in Ihren Thread ein.
5. Öffnen Sie einen PR gegen `main` mit dem Titel `fix(<plugin-id>): beta blocker - <summary>` und verlinken Sie das Issue sowohl im PR als auch in Ihrem Discord-Thread. Beitragende können PRs nicht labeln, daher ist der Titel das PR-seitige Signal für Maintainer und Automatisierung. Blocker mit einem PR werden zusammengeführt; Blocker ohne PR könnten trotzdem ausgeliefert werden. Maintainer beobachten diese Threads während der Beta-Tests.
6. Schweigen bedeutet grün. Wenn Sie das Zeitfenster verpassen, landet Ihr Fix wahrscheinlich im nächsten Zyklus.

## Nächste Schritte

<CardGroup cols={2}>
  <Card title="Kanal-Plugins" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Ein Messaging-Kanal-Plugin erstellen
  </Card>
  <Card title="Provider-Plugins" icon="cpu" href="/plugins/sdk-provider-plugins">
    Ein Modell-Provider-Plugin erstellen
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/plugins/sdk-overview">
    Referenz für Import-Map und Registrierungs-API
  </Card>
  <Card title="Runtime-Hilfsfunktionen" icon="settings" href="/plugins/sdk-runtime">
    TTS, Suche, Subagent über api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/plugins/sdk-testing">
    Testwerkzeuge und Muster
  </Card>
  <Card title="Plugin-Manifest" icon="file-json" href="/plugins/manifest">
    Referenz für das vollständige Manifest-Schema
  </Card>
</CardGroup>

## Verwandt

- [Plugin-Architektur](/plugins/architecture) — tiefer Einblick in die interne Architektur
- [SDK Overview](/plugins/sdk-overview) — Referenz zum Plugin SDK
- [Manifest](/plugins/manifest) — Format des Plugin-Manifests
- [Kanal-Plugins](/plugins/sdk-channel-plugins) — Kanal-Plugins erstellen
- [Provider-Plugins](/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
