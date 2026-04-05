---
read_when:
    - Sie fügen einem Plugin einen Setup-Assistenten hinzu
    - Sie müssen den Unterschied zwischen setup-entry.ts und index.ts verstehen
    - Sie definieren Plugin-Konfigurationsschemas oder openclaw-Metadaten in package.json
sidebarTitle: Setup and Config
summary: Setup-Assistenten, setup-entry.ts, Konfigurationsschemas und package.json-Metadaten
title: Plugin-Setup und -Konfiguration
x-i18n:
    generated_at: "2026-04-05T12:52:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68fda27be1c89ea6ba906833113e9190ddd0ab358eb024262fb806746d54f7bf
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin-Setup und -Konfiguration

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste
(`openclaw.plugin.json`), Setup-Entrypoints und Konfigurationsschemas.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?** Die How-to-Guides behandeln die Paketierung im Kontext:
  [Channel-Plugins](/plugins/sdk-channel-plugins#step-1-package-and-manifest) und
  [Provider-Plugins](/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paketmetadaten

Ihre `package.json` benötigt ein Feld `openclaw`, das dem Plugin-System mitteilt, was
Ihr Plugin bereitstellt:

**Channel-Plugin:**

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
erforderlich. Die kanonischen Veröffentlichungs-Snippets befinden sich in
`docs/snippets/plugin-publish/`.

### `openclaw`-Felder

| Feld         | Typ        | Beschreibung                                                                                          |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Entrypoint-Dateien (relativ zum Paketstamm)                                                           |
| `setupEntry` | `string`   | Leichtgewichtiger nur-für-Setup-Entry (optional)                                                      |
| `channel`    | `object`   | Channel-Katalogmetadaten für Setup-, Auswahl-, Schnellstart- und Statusoberflächen                    |
| `providers`  | `string[]` | Provider-IDs, die von diesem Plugin registriert werden                                                |
| `install`    | `object`   | Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags für das Startverhalten                                                                          |

### `openclaw.channel`

`openclaw.channel` sind kostengünstige Paketmetadaten für die Channel-Erkennung und
Setup-Oberflächen, bevor die Runtime geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                       |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Channel-ID.                                                          |
| `label`                                | `string`   | Primäre Channel-Bezeichnung.                                                    |
| `selectionLabel`                       | `string`   | Bezeichnung für Auswahl/Setup, wenn sie sich von `label` unterscheiden soll.    |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für reichhaltigere Channel-Kataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Docs-Pfad für Setup- und Auswahllinks.                                          |
| `docsLabel`                            | `string`   | Überschreibende Bezeichnung für Docs-Links, wenn sie sich von der Channel-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Beschreibung für Onboarding/Katalog.                                      |
| `order`                                | `number`   | Sortierreihenfolge in Channel-Katalogen.                                        |
| `aliases`                              | `string[]` | Zusätzliche Such-Aliasse für die Channel-Auswahl.                               |
| `preferOver`                           | `string[]` | IDs von Plugins/Channels mit niedrigerer Priorität, die dieser Channel übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Name für Icon/Systembild für Channel-UI-Kataloge.                    |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Docs-Links in Auswahloberflächen.                                |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt den Docs-Pfad direkt statt eines beschrifteten Docs-Links im Auswahltetext. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Strings, die im Auswahltext angehängt werden.                 |
| `markdownCapable`                      | `boolean`  | Kennzeichnet den Channel für Entscheidungen zur ausgehenden Formatierung als markdownfähig. |
| `showConfigured`                       | `boolean`  | Steuert, ob Oberflächen zur Auflistung konfigurierter Channels diesen Channel anzeigen. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Channel in den standardmäßigen Schnellstart-Ablauf `allowFrom` auf. |
| `forceAccountBinding`                  | `boolean`  | Erzwingt explizites Account-Binding, selbst wenn nur ein Account existiert.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt Session-Lookup bei der Auflösung von Announcement-Zielen für diesen Channel. |

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
      "quickstartAllowFrom": true
    }
  }
}
```

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifest-Metadaten.

| Feld                         | Typ                  | Bedeutung                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanonische npm-Spezifikation für Installations-/Update-Abläufe.                  |
| `localPath`                  | `string`             | Lokaler Entwicklungs- oder gebündelter Installationspfad.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                       |
| `minHostVersion`             | `string`             | Minimale unterstützte OpenClaw-Version im Format `>=x.y.z`.                      |
| `allowInvalidConfigRecovery` | `boolean`            | Ermöglicht es Wiederherstellungsabläufen für gebündelte Plugins, bestimmte Fehler mit veralteter Konfiguration zu reparieren. |

Wenn `minHostVersion` gesetzt ist, erzwingen sowohl Installation als auch das Laden der Manifest-Registry
diese Vorgabe. Ältere Hosts überspringen das Plugin; ungültige Versionsstrings werden abgelehnt.

`allowInvalidConfigRecovery` ist keine allgemeine Umgehung für defekte Konfigurationen. Es ist
nur für die enge Wiederherstellung gebündelter Plugins gedacht, damit Neuinstallation/Setup bekannte
Upgrade-Reste wie einen fehlenden Pfad eines gebündelten Plugins oder einen veralteten Eintrag `channels.<id>`
für genau dieses Plugin reparieren können. Wenn die Konfiguration aus anderen Gründen defekt ist, schlägt die Installation
weiterhin sicher fehl und weist den Betreiber an, `openclaw doctor --fix` auszuführen.

### Verzögertes vollständiges Laden

Channel-Plugins können sich für verzögertes Laden entscheiden mit:

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

Wenn dies aktiviert ist, lädt OpenClaw in der Startphase vor `listen`
nur `setupEntry`, selbst für bereits konfigurierte Channels. Der vollständige Entry wird geladen, nachdem das
Gateway auf eingehende Verbindungen hört.

<Warning>
  Aktivieren Sie verzögertes Laden nur dann, wenn Ihr `setupEntry` alles registriert, was das
  Gateway benötigt, bevor es auf eingehende Verbindungen hört (Channel-Registrierung, HTTP-Routen,
  Gateway-Methoden). Wenn der vollständige Entry erforderliche Startfähigkeiten besitzt, behalten Sie
  das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/Voll-Entry Gateway-RPC-Methoden registriert, behalten Sie dafür ein
pluginspezifisches Präfix bei. Reservierte Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben Core-eigen und werden immer
zu `operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss ein `openclaw.plugin.json` im Paketstamm mitliefern.
OpenClaw verwendet dies, um die Konfiguration zu validieren, ohne Plugin-Code auszuführen.

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

Für Channel-Plugins fügen Sie `kind` und `channels` hinzu:

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

Auch Plugins ohne Konfiguration müssen ein Schema mitliefern. Ein leeres Schema ist gültig:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Siehe [Plugin-Manifest](/plugins/manifest) für die vollständige Schemareferenz.

## ClawHub-Veröffentlichung

Für Plugin-Pakete verwenden Sie den paketspezifischen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Der ältere nur-für-Skills-Publish-Alias ist für Skills. Plugin-Pakete sollten
immer `clawhub package publish` verwenden.

## Setup-Entry

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die
OpenClaw lädt, wenn nur Setup-Oberflächen benötigt werden (Onboarding, Reparatur der Konfiguration,
Prüfung deaktivierter Channels).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, während Setup-Abläufen schwere Runtime-Komponenten zu laden (Kryptobibliotheken, CLI-Registrierungen,
Hintergrunddienste).

**Wann OpenClaw `setupEntry` statt des vollständigen Entry-Points verwendet:**

- Der Channel ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen
- Der Channel ist aktiviert, aber nicht konfiguriert
- Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Was `setupEntry` registrieren muss:**

- Das Channel-Plugin-Objekt (über `defineSetupPluginEntry`)
- Alle HTTP-Routen, die vor dem `listen` des Gateways erforderlich sind
- Alle Gateway-Methoden, die während des Starts benötigt werden

Diese Startup-Gateway-Methoden sollten weiterhin reservierte Core-Admin-
Namespaces wie `config.*` oder `update.*` vermeiden.

**Was `setupEntry` NICHT enthalten sollte:**

- CLI-Registrierungen
- Hintergrunddienste
- Schwere Runtime-Importe (Krypto, SDKs)
- Gateway-Methoden, die erst nach dem Start benötigt werden

### Schmale Setup-Helper-Importe

Für Hot-Paths nur für Setup sollten Sie schmale Setup-Helper-Schnittstellen der breiteren
Dachoberfläche `plugin-sdk/setup` vorziehen, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                         | Verwenden Sie ihn für                                                                  | Wichtige Exporte                                                                                                                                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Setup-Zeit-Runtime-Helfer, die in `setupEntry` / beim verzögerten Channel-Start verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Account-Setup-Adapter                                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | Setup-/Installations-CLI-/Archiv-/Docs-Helfer                                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Verwenden Sie die breitere Schnittstelle `plugin-sdk/setup`, wenn Sie die vollständige gemeinsame Setup-
Werkzeugkiste möchten, einschließlich Konfigurations-Patch-Helpern wie
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben im Import Hot-Path-sicher. Ihr gebündeltes
Lookup der Contract-Surface für Single-Account-Promotion ist lazy, sodass das Importieren von
`plugin-sdk/setup-runtime` die Erkennung gebündelter Contract-Surfaces nicht vorzeitig lädt, bevor der Adapter tatsächlich verwendet wird.

### Channel-eigene Single-Account-Promotion

Wenn ein Channel von einer Single-Account-Konfiguration auf oberster Ebene zu
`channels.<id>.accounts.*` aktualisiert wird, verschiebt das standardmäßige gemeinsame Verhalten
kontobezogene Werte in `accounts.default`.

Gebündelte Channels können diese Promotion über ihre Setup-
Contract-Surface einschränken oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Schlüssel auf oberster Ebene, die in den
  hochgestuften Account verschoben werden sollen
- `namedAccountPromotionKeys`: wenn bereits benannte Accounts existieren, werden nur diese
  Schlüssel in den hochgestuften Account verschoben; gemeinsam genutzte Richtlinien-/Zustellungsschlüssel bleiben auf der
  Channel-Wurzel
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welcher vorhandene Account die
  hochgestuften Werte erhält

Matrix ist das aktuelle gebündelte Beispiel. Wenn genau ein benannter Matrix-Account
bereits existiert oder wenn `defaultAccount` auf einen vorhandenen nicht kanonischen Schlüssel
wie `Ops` zeigt, erhält die Promotion diesen Account, statt einen neuen
Eintrag `accounts.default` zu erstellen.

## Konfigurationsschema

Die Plugin-Konfiguration wird gegen das JSON-Schema in Ihrem Manifest validiert. Benutzer
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

Für channelspezifische Konfiguration verwenden Sie stattdessen den Abschnitt für die Channel-Konfiguration:

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

### Channel-Konfigurationsschemas erstellen

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

Channel-Plugins können interaktive Setup-Assistenten für `openclaw onboard` bereitstellen.
Der Assistent ist ein `ChannelSetupWizard`-Objekt auf dem `ChannelPlugin`:

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
Sehen Sie sich gebündelte Plugin-Pakete an (zum Beispiel das Discord-Plugin `src/channel.setup.ts`) für
vollständige Beispiele.

Für DM-Allowlist-Aufforderungen, die nur den Standardablauf
`note -> prompt -> parse -> merge -> patch` benötigen, bevorzugen Sie die gemeinsamen Setup-
Helfer aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` und
`createNestedChannelParsedAllowFromPrompt(...)`.

Für Statusblöcke im Channel-Setup, die sich nur durch Bezeichnungen, Scores und optionale
Zusatzzeilen unterscheiden, bevorzugen Sie `createStandardChannelSetupStatus(...)` aus
`openclaw/plugin-sdk/setup`, statt in jedem Plugin dasselbe `status`-Objekt manuell
zu erstellen.

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
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` stellt außerdem die Low-Level-Builder
`createOptionalChannelSetupAdapter(...)` und
`createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte
dieser optionalen Installationsoberfläche benötigen.

Der generierte optionale Adapter/Assistent schlägt bei echten Konfigurationsschreibvorgängen sicher fehl. Er
verwendet dieselbe Meldung zur erforderlichen Installation für `validateInput`,
`applyAccountConfig` und `finalize` wieder und fügt einen Docs-Link an, wenn `docsPath` gesetzt ist.

Für binärgestützte Setup-UIs bevorzugen Sie die gemeinsamen delegierten Helfer, statt
denselben Binary-/Status-Kleber in jeden Channel zu kopieren:

- `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur nach Bezeichnungen,
  Hinweisen, Scores und Binary-Erkennung unterscheiden
- `createCliPathTextInput(...)` für pfadgestützte Texteingaben
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und
  `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an einen
  schwereren vollständigen Assistenten weiterleiten muss
- `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur die Entscheidung
  `textInputs[*].shouldPrompt` delegieren muss

## Veröffentlichen und installieren

**Externe Plugins:** auf [ClawHub](/tools/clawhub) oder npm veröffentlichen, dann installieren:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw versucht zuerst ClawHub und greift automatisch auf npm zurück. Sie können ClawHub auch
explizit erzwingen:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # Nur ClawHub
```

Es gibt keine entsprechende Überschreibung `npm:`. Verwenden Sie die normale npm-Paketspezifikation, wenn Sie
nach dem ClawHub-Fallback den npm-Pfad möchten:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins im Repository:** unter dem gebündelten Plugin-Workspace-Baum platzieren; sie werden während des Builds automatisch
erkannt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Für Installationen aus npm-Quellen führt `openclaw plugins install`
  `npm install --ignore-scripts` aus (keine Lifecycle-Skripte). Halten Sie Plugin-Abhängigkeits-
  bäume rein in JS/TS und vermeiden Sie Pakete, die `postinstall`-Builds benötigen.
</Info>

## Verwandt

- [SDK-Entry-Points](/plugins/sdk-entrypoints) -- `definePluginEntry` und `defineChannelPluginEntry`
- [Plugin-Manifest](/plugins/manifest) -- vollständige Referenz für das Manifest-Schema
- [Plugins erstellen](/plugins/building-plugins) -- Schritt-für-Schritt-Anleitung für den Einstieg
