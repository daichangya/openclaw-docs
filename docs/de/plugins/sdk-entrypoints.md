---
read_when:
    - Sie benötigen die genaue Typsignatur von definePluginEntry oder defineChannelPluginEntry
    - Sie möchten den Registrierungsmodus verstehen (vollständig vs. Setup vs. CLI-Metadaten)
    - Sie schlagen Optionen für Einstiegspunkte nach
sidebarTitle: Entry Points
summary: Referenz für definePluginEntry, defineChannelPluginEntry und defineSetupPluginEntry
title: Plugin-Einstiegspunkte
x-i18n:
    generated_at: "2026-04-05T12:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 799dbfe71e681dd8ba929a7a631dfe745c3c5c69530126fea2f9c137b120f51f
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Plugin-Einstiegspunkte

Jedes Plugin exportiert ein Standard-Einstiegsobjekt. Das SDK bietet drei Hilfsfunktionen
zu seiner Erstellung.

<Tip>
  **Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Unter [Channel Plugins](/plugins/sdk-channel-plugins)
  oder [Provider Plugins](/plugins/sdk-provider-plugins) finden Sie Anleitungen mit einzelnen Schritten.
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
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Schema für leeres Objekt |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ja           | —                   |

- `id` muss mit Ihrem `openclaw.plugin.json`-Manifest übereinstimmen.
- `kind` ist für exklusive Slots: `"memory"` oder `"context-engine"`.
- `configSchema` kann eine Funktion zur verzögerten Auswertung sein.
- OpenClaw löst dieses Schema beim ersten Zugriff auf und memoisiert es, sodass aufwendige Schema-
  Builder nur einmal ausgeführt werden.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Kapselt `definePluginEntry` mit kanalspezifischer Verdrahtung. Ruft automatisch
`api.registerChannel({ plugin })` auf, stellt eine optionale CLI-Metadaten-Nahtstelle
für die Root-Hilfe bereit und steuert `registerFull` über den Registrierungsmodus.

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
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nein         | Schema für leeres Objekt |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nein         | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nein         | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nein         | —                   |

- `setRuntime` wird während der Registrierung aufgerufen, damit Sie die Runtime-Referenz speichern können
  (typischerweise über `createPluginRuntimeStore`). Während der Erfassung von CLI-Metadaten
  wird dies übersprungen.
- `registerCliMetadata` wird sowohl bei `api.registrationMode === "cli-metadata"`
  als auch bei `api.registrationMode === "full"` ausgeführt.
  Verwenden Sie dies als maßgeblichen Ort für dem Kanal gehörende CLI-Deskriptoren, damit die Root-Hilfe
  nicht aktivierend bleibt, während die normale Registrierung von CLI-Befehlen mit vollständigen Plugin-Ladevorgängen
  kompatibel bleibt.
- `registerFull` wird nur ausgeführt, wenn `api.registrationMode === "full"` gilt. Es wird
  beim reinen Setup-Laden übersprungen.
- Wie bei `definePluginEntry` kann `configSchema` eine Lazy-Factory sein, und OpenClaw
  memoisiert das aufgelöste Schema beim ersten Zugriff.
- Für Root-CLI-Befehle, die dem Plugin gehören, bevorzugen Sie `api.registerCli(..., { descriptors: [...] })`,
  wenn der Befehl lazy-loaded bleiben soll, ohne aus dem Root-CLI-Parsebaum zu verschwinden.
  Bei Channel-Plugins sollten diese Deskriptoren bevorzugt aus `registerCliMetadata(...)`
  registriert werden, und `registerFull(...)` sollte sich auf reine Laufzeitarbeit konzentrieren.
- Wenn `registerFull(...)` auch Gateway-RPC-Methoden registriert, behalten Sie diese unter einem
  pluginspezifischen Präfix. Reservierte Kern-Admin-Namespaces (`config.*`,
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

OpenClaw lädt dies anstelle des vollständigen Einstiegspunkts, wenn ein Kanal deaktiviert,
nicht konfiguriert ist oder wenn verzögertes Laden aktiviert ist. Unter
[Setup and Config](/plugins/sdk-setup#setup-entry) finden Sie Informationen dazu, wann das wichtig ist.

In der Praxis kombinieren Sie `defineSetupPluginEntry(...)` mit den schmalen Setup-Hilfsfamilien:

- `openclaw/plugin-sdk/setup-runtime` für laufzeitsichere Setup-Hilfen wie
  import-sichere Setup-Patch-Adapter, Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und delegierte Setup-Proxys
- `openclaw/plugin-sdk/channel-setup` für optionale Installations-Setup-Oberflächen
- `openclaw/plugin-sdk/setup-tools` für Setup-/Installations-CLI-/Archiv-/Dokumentationshilfen

Behalten Sie schwere SDKs, CLI-Registrierung und langlebige Laufzeitdienste im vollständigen
Einstiegspunkt.

## Registrierungsmodus

`api.registrationMode` zeigt Ihrem Plugin, wie es geladen wurde:

| Modus             | Wann                               | Was registriert werden soll                                                             |
| ----------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| `"full"`          | Normaler Gateway-Start             | Alles                                                                                   |
| `"setup-only"`    | Deaktivierter/nicht konfigurierter Kanal | Nur Kanalregistrierung                                                                  |
| `"setup-runtime"` | Setup-Ablauf mit verfügbarer Runtime | Kanalregistrierung plus nur die schlanke Runtime, die vor dem Laden des vollständigen Einstiegspunkts benötigt wird |
| `"cli-metadata"`  | Root-Hilfe / Erfassung von CLI-Metadaten | Nur CLI-Deskriptoren                                                                    |

`defineChannelPluginEntry` übernimmt diese Aufteilung automatisch. Wenn Sie
`definePluginEntry` direkt für einen Kanal verwenden, prüfen Sie den Modus selbst:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Schwere Registrierungen nur für die Laufzeit
  api.registerService(/* ... */);
}
```

Behandeln Sie `"setup-runtime"` als das Fenster, in dem reine Setup-Startoberflächen
vorhanden sein müssen, ohne die vollständige gebündelte Kanal-Runtime erneut zu betreten. Geeignet sind
Kanalregistrierung, setupsichere HTTP-Routen, setupsichere Gateway-Methoden und
delegierte Setup-Hilfen. Schwere Hintergrunddienste, CLI-Registrierer und
Provider-/Client-SDK-Bootstraps gehören weiterhin in `"full"`.

Speziell für CLI-Registrierer gilt:

- verwenden Sie `descriptors`, wenn der Registrierer einen oder mehrere Root-Befehle besitzt und Sie
  möchten, dass OpenClaw das echte CLI-Modul beim ersten Aufruf lazy lädt
- stellen Sie sicher, dass diese Deskriptoren jeden Top-Level-Befehlsstamm abdecken, der vom
  Registrierer bereitgestellt wird
- verwenden Sie `commands` allein nur für eager-kompatible Pfade

## Plugin-Formen

OpenClaw klassifiziert geladene Plugins nach ihrem Registrierungsverhalten:

| Form                | Beschreibung                                      |
| ------------------- | ------------------------------------------------- |
| **plain-capability**  | Ein Funktionstyp (z. B. nur Provider)           |
| **hybrid-capability** | Mehrere Funktionstypen (z. B. Provider + Speech) |
| **hook-only**         | Nur Hooks, keine Funktionen                     |
| **non-capability**    | Tools/Befehle/Dienste, aber keine Funktionen    |

Verwenden Sie `openclaw plugins inspect <id>`, um die Form eines Plugins anzuzeigen.

## Verwandt

- [SDK-Überblick](/plugins/sdk-overview) — Registrierungs-API und Subpfad-Referenz
- [Runtime-Hilfen](/plugins/sdk-runtime) — `api.runtime` und `createPluginRuntimeStore`
- [Setup und Konfiguration](/plugins/sdk-setup) — Manifest, Setup-Einstiegspunkt, verzögertes Laden
- [Channel Plugins](/plugins/sdk-channel-plugins) — das `ChannelPlugin`-Objekt erstellen
- [Provider Plugins](/plugins/sdk-provider-plugins) — Provider-Registrierung und Hooks
