---
read_when:
    - Sie fügen einem Plugin einen Setup-Assistenten hinzu
    - Sie müssen `setup-entry.ts` im Vergleich zu `index.ts` verstehen
    - Sie definieren Plugin-Konfigurationsschemas oder `package.json`-`openclaw`-Metadaten
sidebarTitle: Setup and Config
summary: Setup-Assistenten, `setup-entry.ts`, Konfigurationsschemas und `package.json`-Metadaten
title: Plugin-Setup und -Konfiguration
x-i18n:
    generated_at: "2026-04-21T06:29:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin-Setup und -Konfiguration

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste
(`openclaw.plugin.json`), Setup-Einträge und Konfigurationsschemas.

<Tip>
  **Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Die How-to-Guides behandeln die Paketierung im Kontext:
  [Kanal-Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und
  [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket-Metadaten

Ihre `package.json` benötigt ein Feld `openclaw`, das dem Plugin-System mitteilt, was
Ihr Plugin bereitstellt:

**Kanal-Plugin:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Provider-Plugin / ClawHub-Veröffentlichungsbasis:**

```json openclaw-clawhub-package.json
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

Wenn Sie das Plugin extern auf ClawHub veröffentlichen, sind diese Felder `compat` und `build`
erforderlich. Die kanonischen Snippets für die Veröffentlichung befinden sich in
`docs/snippets/plugin-publish/`.

### `openclaw`-Felder

| Feld         | Typ        | Beschreibung                                                                                          |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Entry-Point-Dateien (relativ zum Paket-Root)                                                          |
| `setupEntry` | `string`   | Leichtgewichtiger Entry nur für Setup (optional)                                                      |
| `channel`    | `object`   | Kanal-Katalogmetadaten für Setup, Auswahl, Schnellstart und Status-Oberflächen                        |
| `providers`  | `string[]` | Provider-IDs, die von diesem Plugin registriert werden                                                |
| `install`    | `object`   | Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags für das Startverhalten                                                                          |

### `openclaw.channel`

`openclaw.channel` sind kostengünstige Paket-Metadaten für Kanalerkennung und Setup-
Oberflächen, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                     |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                          |
| `label`                                | `string`   | Primäres Kanal-Label.                                                         |
| `selectionLabel`                       | `string`   | Label für Auswahl/Setup, wenn es sich von `label` unterscheiden soll.         |
| `detailLabel`                          | `string`   | Sekundäres Detail-Label für umfangreichere Kanalkataloge und Status-Oberflächen. |
| `docsPath`                             | `string`   | Doku-Pfad für Setup- und Auswahllinks.                                        |
| `docsLabel`                            | `string`   | Überschriebenes Label für Doku-Links, wenn es sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Beschreibung für Onboarding/Katalog.                                    |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                         |
| `aliases`                              | `string[]` | Zusätzliche Lookup-Aliase für die Kanalauswahl.                               |
| `preferOver`                           | `string[]` | IDs von Plugins/Kanälen mit niedrigerer Priorität, die dieser Kanal übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Name für Icon/Systembild in Kanal-UI-Katalogen.                    |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Doku-Links in Auswahloberflächen.                              |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt den Doku-Pfad direkt statt eines beschrifteten Doku-Links im Auswahltext. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Zeichenfolgen, die im Auswahltext angehängt werden.         |
| `markdownCapable`                      | `boolean`  | Markiert den Kanal als markdownfähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Sichtbarkeitssteuerung des Kanals für Setup, konfigurierte Listen und Doku-Oberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Kanal in den Standard-Schnellstartablauf `allowFrom` auf.        |
| `forceAccountBinding`                  | `boolean`  | Erzwingt explizite Kontobindung, selbst wenn nur ein Konto vorhanden ist.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt Session-Lookup beim Auflösen von Ankündigungszielen für diesen Kanal. |

Beispiel:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` unterstützt:

- `configured`: nimmt den Kanal in Auflistungsoberflächen für konfiguriert/Status auf
- `setup`: nimmt den Kanal in interaktive Picker für Setup/Konfiguration auf
- `docs`: markiert den Kanal als öffentlich sichtbar in Doku-/Navigationsoberflächen

`showConfigured` und `showInSetup` werden weiterhin als alte Aliase unterstützt. Bevorzugen Sie
`exposure`.

### `openclaw.install`

`openclaw.install` sind Paket-Metadaten, keine Manifest-Metadaten.

| Feld                         | Typ                  | Bedeutung                                                                       |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanonische npm-Spezifikation für Installations-/Update-Abläufe.                 |
| `localPath`                  | `string`             | Lokaler Entwicklungs- oder gebündelter Installationspfad.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                      |
| `minHostVersion`             | `string`             | Minimal unterstützte OpenClaw-Version in der Form `>=x.y.z`.                    |
| `allowInvalidConfigRecovery` | `boolean`            | Erlaubt gebündelten Plugin-Neuinstallationsabläufen, sich von bestimmten Fehlern mit Alt-Konfigurationen zu erholen. |

Wenn `minHostVersion` gesetzt ist, erzwingen sowohl die Installation als auch das Laden der Manifest-Registry
es. Ältere Hosts überspringen das Plugin; ungültige Versionszeichenfolgen werden abgelehnt.

`allowInvalidConfigRecovery` ist kein allgemeiner Bypass für fehlerhafte Konfigurationen. Es ist
nur für eng begrenzte Wiederherstellung gebündelter Plugins gedacht, damit Neuinstallation/Setup bekannte
Upgrade-Überbleibsel reparieren können, wie einen fehlenden Pfad eines gebündelten Plugins oder einen veralteten Eintrag `channels.<id>`
für dasselbe Plugin. Wenn die Konfiguration aus nicht zusammenhängenden Gründen fehlerhaft ist, schlägt die Installation
weiterhin geschlossen fehl und fordert den Operator auf, `openclaw doctor --fix` auszuführen.

### Verzögertes vollständiges Laden

Kanal-Plugins können sich für verzögertes Laden entscheiden mit:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Wenn aktiviert, lädt OpenClaw in der Startphase vor `listen`
nur `setupEntry`, selbst bei bereits konfigurierten Kanälen. Der vollständige Entry wird geladen, nachdem
das Gateway mit dem Lauschen begonnen hat.

<Warning>
  Aktivieren Sie verzögertes Laden nur, wenn Ihr `setupEntry` alles registriert, was
  das Gateway benötigt, bevor es mit dem Lauschen beginnt (Kanalregistrierung, HTTP-Routen,
  Gateway-Methoden). Wenn der vollständige Entry erforderliche Startfähigkeiten besitzt, behalten Sie
  das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/Voll-Entry Gateway-RPC-Methoden registriert, behalten Sie sie auf einem
pluginspezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben im Besitz des Core und lösen immer
zu `operator.admin` auf.

## Plugin-Manifest

Jedes native Plugin muss im Paket-Root ein `openclaw.plugin.json` mitliefern.
OpenClaw verwendet dies, um Konfigurationen zu validieren, ohne Plugin-Code auszuführen.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Für Kanal-Plugins fügen Sie `kind` und `channels` hinzu:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Selbst Plugins ohne Konfiguration müssen ein Schema mitliefern. Ein leeres Schema ist gültig:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Siehe [Plugin-Manifest](/de/plugins/manifest) für die vollständige Schema-Referenz.

## ClawHub-Veröffentlichung

Für Plugin-Pakete verwenden Sie den paketspezifischen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Der alte Veröffentlichungsalias nur für Skills ist für Skills gedacht. Plugin-Pakete sollten
immer `clawhub package publish` verwenden.

## Setup-Entry

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die
OpenClaw lädt, wenn es nur Setup-Oberflächen benötigt (Onboarding, Reparatur von Konfigurationen,
Inspektion deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird verhindert, dass bei Setup-Abläufen schwere Laufzeitlogik (Krypto-Bibliotheken, CLI-Registrierungen,
Hintergrunddienste) geladen wird.

Gebündelte Workspace-Kanäle, die Setup-sichere Exporte in Sidecar-Modulen behalten, können
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` statt
`defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Vertrag unterstützt außerdem einen optionalen
Export `runtime`, sodass laufzeitbezogene Verdrahtung zur Setup-Zeit leichtgewichtig und explizit bleiben kann.

**Wann OpenClaw `setupEntry` statt des vollständigen Entry verwendet:**

- Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen
- Der Kanal ist aktiviert, aber nicht konfiguriert
- Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Was `setupEntry` registrieren muss:**

- Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`)
- Alle HTTP-Routen, die vor `gateway listen` erforderlich sind
- Alle Gateway-Methoden, die während des Starts benötigt werden

Diese Gateway-Methoden für den Start sollten weiterhin reservierte Core-Admin-
Namespaces wie `config.*` oder `update.*` vermeiden.

**Was `setupEntry` NICHT enthalten sollte:**

- CLI-Registrierungen
- Hintergrunddienste
- Schwere Laufzeitimporte (Krypto, SDKs)
- Gateway-Methoden, die erst nach dem Start benötigt werden

### Schmale Importe von Setup-Helfern

Für stark frequentierte reine Setup-Pfade bevorzugen Sie die schmalen Setup-Helfer-Schnittstellen gegenüber dem breiteren
Sammelmodul `plugin-sdk/setup`, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                         | Verwenden Sie ihn für                                                                    | Wichtige Exporte                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Laufzeithelfer zur Setup-Zeit, die in `setupEntry` / beim verzögerten Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Adapter für Konten-Setup                                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | CLI-/Archiv-/Doku-Helfer für Setup/Installation                                          | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Verwenden Sie die breitere Schnittstelle `plugin-sdk/setup`, wenn Sie die vollständige gemeinsame Setup-
Toolbox möchten, einschließlich Hilfsfunktionen zum Patchen der Konfiguration wie
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import hot-path-sicher. Ihre gebündelte
Lookup-Oberfläche für die Promotion einzelner Konten lädt lazy, sodass der Import von
`plugin-sdk/setup-runtime` nicht vorzeitig die Erkennung gebündelter Vertragsoberflächen lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanal-eigene Promotion einzelner Konten

Wenn ein Kanal von einer Top-Level-Konfiguration mit nur einem Konto auf
`channels.<id>.accounts.*` umsteigt, verschiebt das standardmäßige gemeinsame Verhalten
hochgestufte kontobezogene Werte in `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-
Vertragsoberfläche einschränken oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Top-Level-Schlüssel, die in das
  hochgestufte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Konten bereits existieren, werden nur diese
  Schlüssel in das hochgestufte Konto verschoben; gemeinsame Richtlinien-/Delivery-Schlüssel bleiben an der
  Kanalwurzel
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welches vorhandene Konto
  die hochgestuften Werte erhält

Matrix ist das aktuelle gebündelte Beispiel. Wenn genau ein benanntes Matrix-Konto
bereits existiert oder wenn `defaultAccount` auf einen vorhandenen nicht-kanonischen Schlüssel
wie `Ops` zeigt, bewahrt die Promotion dieses Konto, statt einen neuen Eintrag
`accounts.default` zu erstellen.

## Konfigurationsschema

Die Plugin-Konfiguration wird gegen das JSON-Schema in Ihrem Manifest validiert. Nutzer
konfigurieren Plugins über:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Ihr Plugin erhält diese Konfiguration bei der Registrierung als `api.pluginConfig`.

Verwenden Sie für kanalspezifische Konfiguration stattdessen den Abschnitt der Kanalkonfiguration:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Konfigurationsschemas für Kanäle erstellen

Verwenden Sie `buildChannelConfigSchema` aus `openclaw/plugin-sdk/core`, um ein
Zod-Schema in den Wrapper `ChannelConfigSchema` umzuwandeln, den OpenClaw validiert:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Setup-Assistenten

Kanal-Plugins können interaktive Setup-Assistenten für `openclaw onboard` bereitstellen.
Der Assistent ist ein Objekt `ChannelSetupWizard` auf dem `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

Der Typ `ChannelSetupWizard` unterstützt `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` und mehr.
Siehe gebündelte Plugin-Pakete (zum Beispiel das Discord-Plugin `src/channel.setup.ts`) für
vollständige Beispiele.

Für Aufforderungen zur DM-Allowlist, die nur den Standardfluss
`note -> prompt -> parse -> merge -> patch` benötigen, bevorzugen Sie die gemeinsamen Setup-
Helfer aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` und
`createNestedChannelParsedAllowFromPrompt(...)`.

Für Statusblöcke im Kanal-Setup, die nur nach Labels, Scores und optionalen
Zusatzzeilen variieren, bevorzugen Sie `createStandardChannelSetupStatus(...)` aus
`openclaw/plugin-sdk/setup`, statt in jedem Plugin dasselbe Objekt `status` manuell zu bauen.

Für optionale Setup-Oberflächen, die nur in bestimmten Kontexten erscheinen sollen, verwenden Sie
`createOptionalChannelSetupSurface` aus `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Gibt { setupAdapter, setupWizard } zurück
```

`plugin-sdk/channel-setup` stellt außerdem die niedrigere Ebene
`createOptionalChannelSetupAdapter(...)` und
`createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte
dieser optionalen Installationsoberfläche benötigen.

Die generierten optionalen Adapter/Assistenten schlagen bei echten Konfigurationsschreibvorgängen geschlossen fehl. Sie
verwenden dieselbe Meldung „Installation erforderlich“ in `validateInput`,
`applyAccountConfig` und `finalize` wieder und hängen einen Doku-Link an, wenn `docsPath`
gesetzt ist.

Für Binary-gestützte Setup-UIs bevorzugen Sie die gemeinsam genutzten delegierten Helfer, statt
denselben Binary-/Status-Klebstoff in jeden Kanal zu kopieren:

- `createDetectedBinaryStatus(...)` für Statusblöcke, die nur nach Labels,
  Hinweisen, Scores und Binary-Erkennung variieren
- `createCliPathTextInput(...)` für pfadgestützte Texteingaben
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und
  `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an einen
  schwereren vollständigen Assistenten weiterleiten muss
- `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur die Entscheidung
  `textInputs[*].shouldPrompt` delegieren muss

## Veröffentlichen und installieren

**Externe Plugins:** auf [ClawHub](/de/tools/clawhub) oder npm veröffentlichen, dann installieren:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw versucht zuerst ClawHub und fällt automatisch auf npm zurück. Sie können ClawHub auch
explizit erzwingen:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # Nur ClawHub
```

Es gibt keine entsprechende Überschreibung `npm:`. Verwenden Sie die normale npm-Paketspezifikation, wenn Sie
den npm-Pfad nach dem ClawHub-Fallback möchten:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins im Repository:** unter dem Workspace-Baum für gebündelte Plugins ablegen; sie werden während des Builds automatisch
erkannt.

**Nutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Für Installationen aus npm führt `openclaw plugins install`
  `npm install --ignore-scripts` aus (keine Lifecycle-Skripte). Halten Sie Abhängigkeitsbäume von Plugins
  rein in JS/TS und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

Gebündelte Plugins im Besitz von OpenClaw sind die einzige Ausnahme bei der Startreparatur: Wenn eine
gepackte Installation eines davon aktiviert sieht — per Plugin-Konfiguration, alter Kanal-Konfiguration oder
seinem gebündelten standardmäßig aktivierten Manifest — installiert der Start fehlende
Laufzeitabhängigkeiten dieses Plugins vor dem Import. Plugins von Drittanbietern sollten sich nicht auf
Installationen beim Start verlassen; verwenden Sie weiterhin den expliziten Plugin-Installer.

## Verwandt

- [SDK Entry Points](/de/plugins/sdk-entrypoints) -- `definePluginEntry` und `defineChannelPluginEntry`
- [Plugin-Manifest](/de/plugins/manifest) -- vollständige Referenz für das Manifest-Schema
- [Plugins erstellen](/de/plugins/building-plugins) -- Schritt-für-Schritt-Anleitung für den Einstieg
