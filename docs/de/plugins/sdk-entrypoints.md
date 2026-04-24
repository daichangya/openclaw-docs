---
read_when:
    - Sie benötigen die exakte Typsignatur von `definePluginEntry` oder `defineChannelPluginEntry`
    - Sie möchten den Registrierungsmodus verstehen (full vs setup vs CLI-Metadaten)
    - "Sie schlagen Optionen für Einstiegspunkte nach\tRTLUanalysis to=functions.read 彩娱乐彩票  天天中彩票提款json  亚洲男人天堂{\"path\":\"src/plugin-sdk/types.ts\",\"offset\":1,\"limit\":260}"
sidebarTitle: Entry Points
summary: Referenz für `definePluginEntry`, `defineChannelPluginEntry` und `defineSetupPluginEntry`
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-04-24T06:50:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Jedes Plugin exportiert ein Standard-Entry-Objekt. Das SDK stellt drei Hilfsfunktionen bereit, um diese zu erstellen.

Für installierte Plugins sollte `package.json` das Runtime-Laden auf gebautes
JavaScript verweisen, wenn verfügbar:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` und `setupEntry` bleiben gültige Source-Einträge für die Entwicklung in Workspaces und Git-Checkouts. `runtimeExtensions` und `runtimeSetupEntry` werden bevorzugt, wenn OpenClaw ein installiertes Paket lädt, und ermöglichen es npm-Paketen, TypeScript-Kompilierung zur Laufzeit zu vermeiden. Wenn ein installiertes Paket nur einen TypeScript-Source-Eintrag deklariert, verwendet OpenClaw einen passenden gebauten `dist/*.js`-Peer, wenn einer vorhanden ist, und fällt andernfalls auf die TypeScript-Quelle zurück.

Alle Entry-Pfade müssen innerhalb des Plugin-Paketverzeichnisses bleiben. Runtime-Einträge
und abgeleitete gebaute JavaScript-Peers machen einen `extensions`- oder `setupEntry`-Quellpfad, der aus dem Paketverzeichnis herausführt, nicht gültig.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?** Siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins)
  oder [Provider-Plugins](/de/plugins/sdk-provider-plugins).
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Für Provider-Plugins, Tool-Plugins, Hook-Plugins und alles, was **kein**
Messaging-Kanal ist.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Feld           | Typ                                                              | Erforderlich | Standard            |
| -------------- | ---------------------------------------------------------------- | ------------ | ------------------- |
| `id`           | `string`                                                         | Ja           | —                   |
| `name`         | `string`                                                         | Ja           | —                   |
| `description`  | `string`                                                         | Ja           | —                   |
| `kind`         | `string`                                                         | Nein         | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja           | —                   |

- `id` muss mit Ihrem `openclaw.plugin.json`-Manifest übereinstimmen.
- `kind` ist für exklusive Slots: `"memory"` oder `"context-engine"`.
- `configSchema` kann eine Funktion für verzögerte Auswertung sein.
- OpenClaw löst dieses Schema beim ersten Zugriff auf und memoisiert es, sodass teure Schema-
  Builder nur einmal ausgeführt werden.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit kanalspezifischer Verdrahtung. Ruft automatisch
`api.registerChannel({ plugin })` auf, stellt eine optionale CLI-Metadata-Nahtstelle für Root-Help bereit
und begrenzt `registerFull` anhand des Registrierungsmodus.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Feld                  | Typ                                                              | Erforderlich | Standard            |
| --------------------- | ---------------------------------------------------------------- | ------------ | ------------------- |
| `id`                  | `string`                                                         | Ja           | —                   |
| `name`                | `string`                                                         | Ja           | —                   |
| `description`         | `string`                                                         | Ja           | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Ja           | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | —                   |

- `setRuntime` wird während der Registrierung aufgerufen, sodass Sie die Runtime-Referenz speichern können
  (typischerweise über `createPluginRuntimeStore`). Es wird während der Erfassung von CLI-
  Metadaten übersprungen.
- `registerCliMetadata` läuft sowohl bei `api.registrationMode === "cli-metadata"`
  als auch bei `api.registrationMode === "full"`.
  Verwenden Sie es als kanonische Stelle für kanalbesessene CLI-Deskriptoren, damit Root-Help
  nicht aktivierend bleibt und die normale Registrierung von CLI-Befehlen weiterhin mit vollständigen Plugin-Ladevorgängen kompatibel bleibt.
- `registerFull` läuft nur, wenn `api.registrationMode === "full"`. Es wird
  beim setup-only-Laden übersprungen.
- Wie bei `definePluginEntry` kann `configSchema` eine Lazy-Factory sein, und OpenClaw
  memoisiert das aufgelöste Schema beim ersten Zugriff.
- Für root-eigene CLI-Befehle eines Plugins bevorzugen Sie `api.registerCli(..., { descriptors: [...] })`,
  wenn der Befehl lazy geladen bleiben soll, ohne aus dem
  Root-CLI-Parse-Baum zu verschwinden. Für Kanal-Plugins sollten Sie diese Deskriptoren bevorzugt aus
  `registerCliMetadata(...)` registrieren und `registerFull(...)` auf runtime-exklusive Arbeit konzentrieren.
- Wenn `registerFull(...)` zusätzlich Gateway-RPC-Methoden registriert, halten Sie sie unter einem
  pluginspezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) werden immer zu
  `operator.admin` gezwungen.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die leichtgewichtige Datei `setup-entry.ts`. Gibt nur `{ plugin }` ohne
Runtime- oder CLI-Verdrahtung zurück.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt dies anstelle des vollständigen Entry, wenn ein Kanal deaktiviert,
unkonfiguriert ist oder wenn verzögertes Laden aktiviert ist. Siehe
[Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry), wann das relevant ist.

In der Praxis kombinieren Sie `defineSetupPluginEntry(...)` mit den schmalen Setup-Helfer-
Familien:

- `openclaw/plugin-sdk/setup-runtime` für runtime-sichere Setup-Helfer wie
  import-sichere Setup-Patch-Adapter, Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und delegierte Setup-Proxys
- `openclaw/plugin-sdk/channel-setup` für optionale Installationsoberflächen im Setup
- `openclaw/plugin-sdk/setup-tools` für Setup-/Installations-CLI-/Archiv-/Dokumentations-Helfer

Behalten Sie schwere SDKs, CLI-Registrierung und langlebige Runtime-Dienste im vollständigen
Entry.

Gebündelte Workspace-Kanäle, die Setup- und Runtime-Oberflächen aufteilen, können stattdessen
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden. Dieser Vertrag erlaubt es dem
Setup-Entry, setupsichere Plugin-/Secrets-Exporte beizubehalten und dennoch einen
Runtime-Setter bereitzustellen:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

Verwenden Sie diesen gebündelten Vertrag nur dann, wenn Setup-Flows wirklich einen leichtgewichtigen Runtime-
Setter benötigen, bevor der vollständige Kanal-Entry geladen wird.

## Registrierungsmodus

`api.registrationMode` teilt Ihrem Plugin mit, wie es geladen wurde:

| Modus             | Wann                               | Was zu registrieren ist                                                                |
| ----------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `"full"`          | Normaler Gateway-Start             | Alles                                                                                  |
| `"setup-only"`    | Deaktivierter/unkonfigurierter Kanal | Nur Kanalregistrierung                                                               |
| `"setup-runtime"` | Setup-Flow mit verfügbarer Runtime | Kanalregistrierung plus nur die leichtgewichtige Runtime, die vor dem Laden des vollständigen Entry benötigt wird |
| `"cli-metadata"`  | Root-Help / Erfassung von CLI-Metadaten | Nur CLI-Deskriptoren                                                              |

`defineChannelPluginEntry` behandelt diese Aufteilung automatisch. Wenn Sie
`definePluginEntry` direkt für einen Kanal verwenden, prüfen Sie den Modus selbst:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Schwere, nur zur Laufzeit benötigte Registrierungen
  api.registerService(/* ... */);
}
```

Behandeln Sie `"setup-runtime"` als das Zeitfenster, in dem surfaces für setup-only-Startup
existieren müssen, ohne erneut in die vollständige gebündelte Kanal-Runtime einzutreten. Geeignete Kandidaten
sind Kanalregistrierung, setupsichere HTTP-Routen, setupsichere Gateway-Methoden und
delegierte Setup-Helfer. Schwere Hintergrunddienste, CLI-Registrierungen und
Provider-/Client-SDK-Bootstraps gehören weiterhin in `"full"`.

Speziell für CLI-Registrierungen:

- verwenden Sie `descriptors`, wenn die Registrierung einen oder mehrere Root-Befehle besitzt und Sie
  möchten, dass OpenClaw das eigentliche CLI-Modul beim ersten Aufruf lazy lädt
- stellen Sie sicher, dass diese Deskriptoren jeden obersten Befehls-Root abdecken, den die
  Registrierung bereitstellt
- verwenden Sie `commands` allein nur für eager Kompatibilitätspfade

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins nach ihrem Registrierungsverhalten:

| Form                | Beschreibung                                         |
| ------------------- | ---------------------------------------------------- |
| **plain-capability**  | Ein Capability-Typ (z. B. nur Provider)            |
| **hybrid-capability** | Mehrere Capability-Typen (z. B. Provider + Sprache) |
| **hook-only**         | Nur Hooks, keine Capabilities                      |
| **non-capability**    | Tools/Befehle/Dienste, aber keine Capabilities     |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins zu sehen.

## Verwandt

- [SDK-Überblick](/de/plugins/sdk-overview) — Registrierungs-API und Referenz für Unterpfade
- [Runtime-Helfer](/de/plugins/sdk-runtime) — `api.runtime` und `createPluginRuntimeStore`
- [Setup und Konfiguration](/de/plugins/sdk-setup) — Manifest, Setup-Entry, verzögertes Laden
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) — das `ChannelPlugin`-Objekt erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Registrierung und Hooks
