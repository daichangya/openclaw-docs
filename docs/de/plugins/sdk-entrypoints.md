---
read_when:
    - Sie benötigen die genaue Typsignatur von definePluginEntry oder defineChannelPluginEntry.
    - Sie möchten den Registrierungsmodus verstehen (vollständig vs. Einrichtung vs. CLI-Metadaten).
    - Sie schlagen Einstiegspunktoptionen nach.
sidebarTitle: Entry Points
summary: Referenz für definePluginEntry, defineChannelPluginEntry und defineSetupPluginEntry
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-04-15T19:41:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: aabca25bc9b8ff1b5bb4852bafe83640ffeba006ea6b6a8eff4e2c37a10f1fe4
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Plugin-Einstiegspunkte

Jedes Plugin exportiert ein Standard-Einstiegsobjekt. Das SDK bietet drei Hilfsfunktionen, um diese zu erstellen.

<Tip>
  **Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins)
  oder [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Schritt-für-Schritt-Anleitungen.
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

| Feld           | Typ                                                              | Erforderlich | Standardwert        |
| -------------- | ---------------------------------------------------------------- | ------------ | ------------------- |
| `id`           | `string`                                                         | Ja           | —                   |
| `name`         | `string`                                                         | Ja           | —                   |
| `description`  | `string`                                                         | Ja           | —                   |
| `kind`         | `string`                                                         | Nein         | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja           | —                   |

- `id` muss mit Ihrem `openclaw.plugin.json`-Manifest übereinstimmen.
- `kind` ist für exklusive Slots gedacht: `"memory"` oder `"context-engine"`.
- `configSchema` kann eine Funktion zur verzögerten Auswertung sein.
- OpenClaw löst dieses Schema beim ersten Zugriff auf und memoisiert es, sodass aufwendige Schema-Builder nur einmal ausgeführt werden.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Umschließt `definePluginEntry` mit kanalspezifischer Verdrahtung. Ruft automatisch
`api.registerChannel({ plugin })` auf, stellt einen optionalen CLI-Metadaten-Einstiegspunkt
für die Root-Hilfe bereit und steuert `registerFull` anhand des Registrierungsmodus.

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

| Feld                  | Typ                                                              | Erforderlich | Standardwert        |
| --------------------- | ---------------------------------------------------------------- | ------------ | ------------------- |
| `id`                  | `string`                                                         | Ja           | —                   |
| `name`                | `string`                                                         | Ja           | —                   |
| `description`         | `string`                                                         | Ja           | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Ja           | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Leeres Objektschema |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | —                   |

- `setRuntime` wird bei der Registrierung aufgerufen, damit Sie die Runtime-Referenz speichern können
  (typischerweise über `createPluginRuntimeStore`). Beim Erfassen von CLI-Metadaten
  wird es übersprungen.
- `registerCliMetadata` wird sowohl bei `api.registrationMode === "cli-metadata"`
  als auch bei `api.registrationMode === "full"` ausgeführt.
  Verwenden Sie es als die kanonische Stelle für kanal-eigene CLI-Deskriptoren, damit die Root-Hilfe
  nicht aktivierend bleibt, während die normale CLI-Befehlsregistrierung mit
  vollständigen Plugin-Ladevorgängen kompatibel bleibt.
- `registerFull` wird nur ausgeführt, wenn `api.registrationMode === "full"` ist. Bei
  reinen Setup-Ladevorgängen wird es übersprungen.
- Wie bei `definePluginEntry` kann `configSchema` eine Lazy-Factory sein, und OpenClaw
  memoisiert das aufgelöste Schema beim ersten Zugriff.
- Für Plugin-eigene Root-CLI-Befehle sollten Sie `api.registerCli(..., { descriptors: [...] })`
  bevorzugen, wenn der Befehl lazy-loaded bleiben soll, ohne aus dem
  Root-CLI-Parse-Baum zu verschwinden. Bei Kanal-Plugins sollten Sie diese Deskriptoren
  vorzugsweise aus `registerCliMetadata(...)` registrieren und `registerFull(...)` auf
  Arbeiten beschränken, die nur zur Laufzeit nötig sind.
- Wenn `registerFull(...)` auch Gateway-RPC-Methoden registriert, halten Sie diese unter einem
  pluginspezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) werden immer zu
  `operator.admin` umgewandelt.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Für die schlanke Datei `setup-entry.ts`. Gibt nur `{ plugin }` ohne
Runtime- oder CLI-Verdrahtung zurück.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lädt dies anstelle des vollständigen Einstiegs, wenn ein Kanal deaktiviert,
nicht konfiguriert ist oder wenn verzögertes Laden aktiviert ist. Siehe
[Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry), wann dies wichtig ist.

In der Praxis kombinieren Sie `defineSetupPluginEntry(...)` mit den schmalen Setup-Hilfsfamilien:

- `openclaw/plugin-sdk/setup-runtime` für runtime-sichere Setup-Helfer wie
  importsichere Setup-Patch-Adapter, Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und delegierte Setup-Proxys
- `openclaw/plugin-sdk/channel-setup` für optionale Installations-Setup-Oberflächen
- `openclaw/plugin-sdk/setup-tools` für Setup-/Installations-CLI-/Archiv-/Dokumentations-Helfer

Behalten Sie schwere SDKs, CLI-Registrierung und langlebige Runtime-Dienste im vollständigen
Einstieg.

Gebündelte Workspace-Kanäle, die Setup- und Runtime-Oberflächen aufteilen, können stattdessen
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden. Dieser Vertrag ermöglicht es dem
Setup-Einstieg, setupsichere Plugin-/Secret-Exporte beizubehalten und gleichzeitig einen
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

Verwenden Sie diesen gebündelten Vertrag nur dann, wenn Setup-Flows wirklich einen leichtgewichtigen Runtime-Setter
benötigen, bevor der vollständige Kanaleinstieg geladen wird.

## Registrierungsmodus

`api.registrationMode` teilt Ihrem Plugin mit, wie es geladen wurde:

| Modus             | Wann                              | Was registriert werden soll                                                                 |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| `"full"`          | Normaler Gateway-Start            | Alles                                                                                        |
| `"setup-only"`    | Deaktivierter/nicht konfigurierter Kanal | Nur Kanalregistrierung                                                                 |
| `"setup-runtime"` | Setup-Flow mit verfügbarer Runtime | Kanalregistrierung plus nur die leichtgewichtige Runtime, die vor dem Laden des vollständigen Einstiegs benötigt wird |
| `"cli-metadata"`  | Root-Hilfe / Erfassung von CLI-Metadaten | Nur CLI-Deskriptoren                                                                  |

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

  // Schwere Registrierungen nur zur Laufzeit
  api.registerService(/* ... */);
}
```

Behandeln Sie `"setup-runtime"` als das Zeitfenster, in dem Setup-only-Startoberflächen
vorhanden sein müssen, ohne die vollständige gebündelte Kanal-Runtime erneut zu betreten. Geeignete Anwendungsfälle sind
Kanalregistrierung, setupsichere HTTP-Routen, setupsichere Gateway-Methoden und
delegierte Setup-Helfer. Schwere Hintergrunddienste, CLI-Registrare und
Provider-/Client-SDK-Bootstraps gehören weiterhin in `"full"`.

Speziell für CLI-Registrare gilt:

- verwenden Sie `descriptors`, wenn der Registrar einen oder mehrere Root-Befehle besitzt und Sie
  möchten, dass OpenClaw das eigentliche CLI-Modul beim ersten Aufruf lazy-loaded
- stellen Sie sicher, dass diese Deskriptoren jeden Top-Level-Befehls-Root abdecken, der vom
  Registrar bereitgestellt wird
- verwenden Sie nur `commands` für eager Kompatibilitätspfade

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins nach ihrem Registrierungsverhalten:

| Form                | Beschreibung                                      |
| ------------------- | ------------------------------------------------- |
| **plain-capability**  | Ein Fähigkeitstyp (z. B. nur Provider)          |
| **hybrid-capability** | Mehrere Fähigkeitstypen (z. B. Provider + Sprache) |
| **hook-only**         | Nur Hooks, keine Fähigkeiten                    |
| **non-capability**    | Tools/Befehle/Dienste, aber keine Fähigkeiten   |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins anzuzeigen.

## Verwandt

- [SDK-Überblick](/de/plugins/sdk-overview) — Registrierungs-API und Subpath-Referenz
- [Runtime-Helfer](/de/plugins/sdk-runtime) — `api.runtime` und `createPluginRuntimeStore`
- [Setup und Konfiguration](/de/plugins/sdk-setup) — Manifest, Setup-Einstieg, verzögertes Laden
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) — Erstellen des `ChannelPlugin`-Objekts
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Registrierung und Hooks
