---
read_when:
    - Sie fügen einem Plugin einen Setup-Assistenten hinzu
    - Sie müssen `setup-entry.ts` im Vergleich zu `index.ts` verstehen
    - Sie definieren Plugin-Konfigurationsschemas oder `openclaw`-Metadaten in `package.json`
sidebarTitle: Setup and Config
summary: Setup-Assistenten, `setup-entry.ts`, Konfigurationsschemas und `package.json`-Metadaten
title: Plugin-Setup und Konfiguration
x-i18n:
    generated_at: "2026-04-24T06:51:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste
(`openclaw.plugin.json`), Setup-Einträge und Konfigurationsschemas.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?** Die How-to-Guides behandeln Paketierung im Kontext:
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

**Provider-Plugin / ClawHub-Publish-Basis:**

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
erforderlich. Die kanonischen Publish-Snippets liegen in
`docs/snippets/plugin-publish/`.

### `openclaw`-Felder

| Feld         | Typ        | Beschreibung                                                                                                            |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Entry-Point-Dateien (relativ zum Paket-Root)                                                                           |
| `setupEntry` | `string`   | Leichtgewichtiger setup-only-Eintrag (optional)                                                                        |
| `channel`    | `object`   | Kanal-Katalog-Metadaten für Setup, Auswahl, Quickstart und Statusoberflächen                                          |
| `providers`  | `string[]` | Provider-IDs, die von diesem Plugin registriert werden                                                                 |
| `install`    | `object`   | Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags für das Startverhalten                                                                                           |

### `openclaw.channel`

`openclaw.channel` sind günstige Paket-Metadaten für Kanal-Discovery und Setup-
Oberflächen, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                      |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                           |
| `label`                                | `string`   | Primäre Kanalbezeichnung.                                                      |
| `selectionLabel`                       | `string`   | Bezeichnung für Auswahl/Setup, wenn sie sich von `label` unterscheiden soll.   |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für umfangreichere Kanal-Kataloge und Statusoberflächen. |
| `docsPath`                             | `string`   | Dokumentationspfad für Setup- und Auswahllinks.                                |
| `docsLabel`                            | `string`   | Überschreibt die für Dokumentationslinks verwendete Bezeichnung, wenn sie sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Beschreibung für Onboarding/Katalog.                                     |
| `order`                                | `number`   | Sortierreihenfolge in Kanal-Katalogen.                                         |
| `aliases`                              | `string[]` | Zusätzliche Lookup-Aliasse für die Kanalauswahl.                               |
| `preferOver`                           | `string[]` | Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Kanal übertreffen soll. |
| `systemImage`                          | `string`   | Optionaler Icon-/System-Image-Name für Kanal-UI-Kataloge.                      |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Dokumentationslinks in Auswahlsurfaces.                         |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt den Dokumentationspfad direkt statt eines beschrifteten Dokumentationslinks in Auswahltexten an. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Strings, die an den Auswahltext angehängt werden.            |
| `markdownCapable`                      | `boolean`  | Markiert den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Sichtbarkeitssteuerung des Kanals für Setup, konfigurierte Listen und Dokumentationsoberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Kanal in den standardmäßigen Quickstart-`allowFrom`-Setup-Ablauf auf. |
| `forceAccountBinding`                  | `boolean`  | Erzwingt explizites Account-Binding, selbst wenn nur ein Konto existiert.      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt Session-Lookup beim Auflösen von Announce-Zielen für diesen Kanal.   |

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

- `configured`: den Kanal in konfigurierten/statusartigen Listenoberflächen einschließen
- `setup`: den Kanal in interaktive Setup-/Configure-Auswahlen einschließen
- `docs`: den Kanal in Dokumentation-/Navigationsoberflächen als öffentlich sichtbar markieren

`showConfigured` und `showInSetup` bleiben als Legacy-Aliasse unterstützt. Bevorzugen Sie
`exposure`.

### `openclaw.install`

`openclaw.install` sind Paket-Metadaten, nicht Manifest-Metadaten.

| Feld                         | Typ                  | Bedeutung                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanonische npm-Spezifikation für Installations-/Update-Flows.                    |
| `localPath`                  | `string`             | Lokaler Entwicklungs- oder gebündelter Installationspfad.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                       |
| `minHostVersion`             | `string`             | Minimal unterstützte OpenClaw-Version in der Form `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | Erwartete npm-Dist-Integrity-String, normalerweise `sha512-...`, für angeheftete Installationen. |
| `allowInvalidConfigRecovery` | `boolean`            | Erlaubt es Flows für die Neuinstallation gebündelter Plugins, sich von bestimmten Fehlern durch veraltete Konfiguration zu erholen. |

Interaktives Onboarding verwendet `openclaw.install` auch für Oberflächen mit Installation bei Bedarf.
Wenn Ihr Plugin Provider-Auth-Auswahlen oder Kanal-Setup-/Katalog-Metadaten bereitstellt, bevor die Runtime geladen wird,
kann Onboarding diese Auswahl anzeigen, nach npm vs. lokaler Installation fragen, das Plugin installieren oder aktivieren und dann den ausgewählten
Ablauf fortsetzen. Npm-Auswahlen im Onboarding erfordern vertrauenswürdige Katalog-Metadaten mit einer Registry-
`npmSpec`; exakte Versionen und `expectedIntegrity` sind optionale Pins. Wenn
`expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Flows diese. Halten Sie die „was anzeigen“-Metadaten in `openclaw.plugin.json` und die „wie installieren“-
Metadaten in `package.json`.

Wenn `minHostVersion` gesetzt ist, erzwingen sowohl Installation als auch das Laden der Manifest-Registry
dies. Ältere Hosts überspringen das Plugin; ungültige Versions-Strings werden abgelehnt.

Für angeheftete npm-Installationen behalten Sie die exakte Version in `npmSpec` bei und fügen die
erwartete Integrität des Artefakts hinzu:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` ist kein allgemeiner Bypass für kaputte Konfigurationen. Es
ist nur für schmale Recovery-Fälle bei gebündelten Plugins gedacht, damit Neuinstallation/Setup bekannte Upgrade-Reste wie einen fehlenden Pfad zu einem gebündelten Plugin oder einen veralteten Eintrag `channels.<id>`
für genau dieses Plugin reparieren können. Wenn die Konfiguration aus nicht zusammenhängenden Gründen defekt ist, schlägt die Installation dennoch fail-closed fehl und fordert den Operator auf, `openclaw doctor --fix` auszuführen.

### Verzögertes vollständiges Laden

Kanal-Plugins können sich mit Folgendem für verzögertes Laden entscheiden:

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

Wenn dies aktiviert ist, lädt OpenClaw während der Startphase vor dem Lauschen
nur `setupEntry`, selbst für bereits konfigurierte Kanäle. Der vollständige Entry wird nach dem Start
des Gateways geladen.

<Warning>
  Aktivieren Sie verzögertes Laden nur dann, wenn Ihr `setupEntry` alles registriert, was das
  Gateway vor dem Beginn des Lauschens benötigt (Kanalregistrierung, HTTP-Routen,
  Gateway-Methoden). Wenn der vollständige Entry erforderliche Startup-Capabilities besitzt, behalten Sie das
  Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/vollständiger Entry Gateway-RPC-Methoden registriert, halten Sie sie unter einem
pluginspezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben dem Core vorbehalten und werden immer zu
`operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss ein `openclaw.plugin.json` im Paket-Root mitliefern.
OpenClaw verwendet dieses, um die Konfiguration zu validieren, ohne Plugin-Code auszuführen.

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

Siehe [Plugin-Manifest](/de/plugins/manifest) für die vollständige Schema-Referenz.

## ClawHub-Veröffentlichung

Für Plugin-Pakete verwenden Sie den paketspezifischen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Der Legacy-Publish-Alias nur für Skills ist für Skills gedacht. Plugin-Pakete sollten
immer `clawhub package publish` verwenden.

## Setup-Eintrag

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die
OpenClaw lädt, wenn es nur Setup-Oberflächen benötigt (Onboarding, Konfigurationsreparatur,
Inspektion deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird verhindert, dass während Setup-Flows schwerer Runtime-Code (Krypto-Bibliotheken, CLI-Registrierungen,
Hintergrunddienste) geladen wird.

Gebündelte Workspace-Kanäle, die setupsichere Exporte in Sidecar-Modulen halten, können
statt `defineSetupPluginEntry(...)` `defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` verwenden.
Dieser gebündelte Vertrag unterstützt außerdem einen optionalen Export `runtime`, sodass Runtime-Verdrahtung zur Setup-Zeit leichtgewichtig und explizit bleiben kann.

**Wann OpenClaw `setupEntry` statt des vollständigen Entry verwendet:**

- Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen
- Der Kanal ist aktiviert, aber nicht konfiguriert
- Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Was `setupEntry` registrieren muss:**

- Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`)
- Alle HTTP-Routen, die vor dem Gateway-Listen erforderlich sind
- Alle Gateway-Methoden, die während des Starts benötigt werden

Diese Gateway-Methoden für den Start sollten weiterhin reservierte Core-Admin-
Namespaces wie `config.*` oder `update.*` vermeiden.

**Was `setupEntry` NICHT enthalten sollte:**

- CLI-Registrierungen
- Hintergrunddienste
- Schwere Runtime-Imports (Krypto, SDKs)
- Gateway-Methoden, die erst nach dem Start benötigt werden

### Schmale Setup-Helfer-Imports

Für heiße setup-only-Pfade sollten Sie die schmalen Setup-Helfer-Seams statt des breiteren
`plugin-sdk/setup`-Schirms bevorzugen, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                        | Verwenden Sie ihn für                                                                   | Wichtige Exporte                                                                                                                                                                                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Runtime-Helfer zur Setup-Zeit, die in `setupEntry` / verzögertem Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Setup-Adapter für Konten                                              | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | Setup-/Installations-CLI-/Archiv-/Dokumentations-Helfer                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Verwenden Sie den breiteren Seam `plugin-sdk/setup`, wenn Sie das vollständige gemeinsame Setup-
Werkzeugset möchten, einschließlich Konfigurations-Patch-Helfern wie
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import sicher für Hot Paths. Ihr Lookup der gebündelten
Vertragsoberfläche für Single-Account-Promotion ist lazy, sodass der Import von
`plugin-sdk/setup-runtime` nicht vorzeitig die Discovery gebündelter Vertragsoberflächen lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanal-eigene Single-Account-Promotion

Wenn ein Kanal von einer Single-Account-Konfiguration auf Top-Level auf
`channels.<id>.accounts.*` aktualisiert wird, verschiebt das gemeinsame Standardverhalten
promovierte konto-spezifische Werte nach `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-
Vertragsoberfläche eingrenzen oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Top-Level-Schlüssel, die in das
  promovierte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn benannte Konten bereits existieren, werden nur diese
  Schlüssel in das promovierte Konto verschoben; gemeinsame Richtlinien-/Zustellschlüssel bleiben auf
  der Root des Kanals
- `resolveSingleAccountPromotionTarget(...)`: wählen, welches bestehende Konto
  die promovierten Werte erhält

Matrix ist das aktuelle gebündelte Beispiel. Wenn bereits genau ein benanntes Matrix-Konto
existiert oder wenn `defaultAccount` auf einen bestehenden nicht-kanonischen Schlüssel
wie `Ops` zeigt, bewahrt die Promotion dieses Konto, statt einen neuen
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

Ihr Plugin erhält diese Konfiguration während der Registrierung als `api.pluginConfig`.

Für kanalspezifische Konfiguration verwenden Sie stattdessen den Abschnitt für die Kanal-Konfiguration:

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
Zod-Schema in den Wrapper `ChannelConfigSchema` umzuwandeln, gegen den OpenClaw validiert:

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
Vollständige Beispiele finden Sie in gebündelten Plugin-Paketen (zum Beispiel im Discord-Plugin `src/channel.setup.ts`).

Für DM-Allowlist-Prompts, die nur den standardmäßigen Ablauf
`note -> prompt -> parse -> merge -> patch` benötigen, bevorzugen Sie die gemeinsamen Setup-
Helfer aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` und
`createNestedChannelParsedAllowFromPrompt(...)`.

Für Statusblöcke bei Kanal-Setup, die sich nur in Labels, Scores und optionalen
zusätzlichen Zeilen unterscheiden, bevorzugen Sie `createStandardChannelSetupStatus(...)` aus
`openclaw/plugin-sdk/setup`, statt in jedem Plugin dasselbe `status`-Objekt
von Hand zu bauen.

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

`plugin-sdk/channel-setup` stellt außerdem die Low-Level-Builder
`createOptionalChannelSetupAdapter(...)` und
`createOptionalChannelSetupWizard(...)` bereit, wenn Sie nur eine Hälfte
dieser optionalen Installationsoberfläche benötigen.

Die generierten optionalen Adapter/Assistenten schlagen bei echten Konfigurationsschreibvorgängen fail-closed fehl. Sie
verwenden eine gemeinsame Meldung „Installation erforderlich“ über `validateInput`,
`applyAccountConfig` und `finalize` hinweg erneut und fügen einen Dokumentationslink an, wenn `docsPath`
gesetzt ist.

Für binarygestützte Setup-UIs sollten Sie die gemeinsamen delegierten Helfer bevorzugen, statt
denselben Binary-/Status-Kleber in jeden Kanal zu kopieren:

- `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur in Labels,
  Hinweisen, Scores und Binary-Erkennung unterscheiden
- `createCliPathTextInput(...)` für pfadgestützte Texteingaben
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und
  `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an einen schwereren vollständigen Assistenten weiterleiten muss
- `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur eine Entscheidung für `textInputs[*].shouldPrompt` delegieren muss

## Veröffentlichen und installieren

**Externe Plugins:** auf [ClawHub](/de/tools/clawhub) oder npm veröffentlichen und dann installieren:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw versucht zuerst ClawHub und greift automatisch auf npm zurück. Sie können ClawHub auch explizit erzwingen:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # nur ClawHub
```

Es gibt kein entsprechendes Override `npm:`. Verwenden Sie die normale npm-Paketspezifikation, wenn Sie
nach dem ClawHub-Fallback den npm-Pfad möchten:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins im Repo:** unter dem Workspace-Baum für gebündelte Plugins ablegen; sie werden beim Build automatisch
gefunden.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Für Installationen aus npm führt `openclaw plugins install`
  `npm install --ignore-scripts` aus (keine Lifecycle-Skripte). Halten Sie die Abhängigkeitsbäume von Plugins
  in reinem JS/TS und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.
</Info>

Gebündelte, OpenClaw-eigene Plugins sind die einzige Ausnahme bei der Startreparatur: Wenn eine
paketierte Installation eines davon als durch Plugin-Konfiguration, Legacy-Kanal-Konfiguration oder
sein gebündeltes standardmäßig aktiviertes Manifest aktiviert sieht, installiert der Start fehlende
Runtime-Abhängigkeiten dieses Plugins vor dem Import. Drittanbieter-Plugins sollten sich nicht auf Installationen beim Start verlassen; verwenden Sie weiterhin den expliziten Plugin-Installer.

## Verwandt

- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) -- `definePluginEntry` und `defineChannelPluginEntry`
- [Plugin-Manifest](/de/plugins/manifest) -- vollständige Referenz des Manifest-Schemas
- [Plugins erstellen](/de/plugins/building-plugins) -- Schritt-für-Schritt-Leitfaden für den Einstieg
