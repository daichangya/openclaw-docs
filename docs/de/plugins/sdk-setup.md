---
read_when:
    - Sie fügen einem Plugin einen Einrichtungsassistenten hinzu.
    - Sie müssen `setup-entry.ts` im Vergleich zu `index.ts` verstehen.
    - Sie definieren Plugin-Konfigurationsschemas oder `package.json`-`openclaw`-Metadaten.
sidebarTitle: Setup and Config
summary: Einrichtungsassistenten, `setup-entry.ts`, Konfigurationsschemas und `package.json`-Metadaten
title: Plugin-Einrichtung und -Konfiguration
x-i18n:
    generated_at: "2026-04-23T14:04:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin-Einrichtung und -Konfiguration

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste
(`openclaw.plugin.json`), Setup-Einstiegspunkte und Konfigurationsschemas.

<Tip>
  **Suchen Sie nach einer Schritt-für-Schritt-Anleitung?** Die How-to-Guides behandeln die Paketierung im Kontext:
  [Kanal-Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und
  [Provider-Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paketmetadaten

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
      "blurb": "Kurze Beschreibung des Kanals."
    }
  }
}
```

**Provider-Plugin / ClawHub-Publish-Baseline:**

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

| Feld         | Typ        | Beschreibung                                                                                                                  |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Einstiegspunktdateien (relativ zum Paket-Root)                                                                                |
| `setupEntry` | `string`   | Leichter Setup-only-Einstiegspunkt (optional)                                                                                 |
| `channel`    | `object`   | Kanal-Katalogmetadaten für Setup-, Picker-, Schnellstart- und Status-Oberflächen                                              |
| `providers`  | `string[]` | Provider-IDs, die von diesem Plugin registriert werden                                                                        |
| `install`    | `object`   | Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags für das Startverhalten                                                                                                  |

### `openclaw.channel`

`openclaw.channel` sind günstige Paketmetadaten für die Kanalerkennung und
Setup-Oberflächen, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                        |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                             |
| `label`                                | `string`   | Primäre Kanalbezeichnung.                                                        |
| `selectionLabel`                       | `string`   | Bezeichnung in Picker/Setup, wenn sie sich von `label` unterscheiden soll.      |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für reichhaltigere Kanalkataloge und Status-Oberflächen. |
| `docsPath`                             | `string`   | Docs-Pfad für Setup- und Auswahl-Links.                                          |
| `docsLabel`                            | `string`   | Überschriebene Bezeichnung für Docs-Links, wenn sie sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Beschreibung für Onboarding/Katalog.                                       |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                            |
| `aliases`                              | `string[]` | Zusätzliche Lookup-Aliasse für die Kanalauswahl.                                 |
| `preferOver`                           | `string[]` | Plugin-/Kanal-IDs mit niedrigerer Priorität, die dieser Kanal übertreffen soll.  |
| `systemImage`                          | `string`   | Optionaler Symbol-/System-Image-Name für Kanal-UI-Kataloge.                      |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Docs-Links in Auswahloberflächen.                                 |
| `selectionDocsOmitLabel`               | `boolean`  | Den Docs-Pfad direkt statt eines beschrifteten Docs-Links im Auswahltext anzeigen. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Strings, die im Auswahltext angehängt werden.                  |
| `markdownCapable`                      | `boolean`  | Markiert den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Sichtbarkeitssteuerung des Kanals für Setup, konfigurierte Listen und Docs-Oberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Diesen Kanal in den Standard-Schnellstartablauf `allowFrom` einbeziehen.         |
| `forceAccountBinding`                  | `boolean`  | Explizite Kontobindung verlangen, auch wenn nur ein Konto existiert.             |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Session-Lookup beim Auflösen von Ankündigungszielen für diesen Kanal bevorzugen. |

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
      "blurb": "Webhook-basierte selbst gehostete Chat-Integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Anleitung:",
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

- `configured`: Den Kanal in konfigurierten/statusähnlichen Listenoberflächen einbeziehen
- `setup`: Den Kanal in interaktive Setup-/Konfigurations-Picker einbeziehen
- `docs`: Den Kanal in Docs-/Navigationsoberflächen als öffentlich markieren

`showConfigured` und `showInSetup` werden weiterhin als ältere Aliasse unterstützt. Bevorzugen Sie
`exposure`.

### `openclaw.install`

`openclaw.install` sind Paketmetadaten, keine Manifest-Metadaten.

| Feld                         | Typ                  | Bedeutung                                                                        |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanonische npm-Spec für Installations-/Update-Abläufe.                           |
| `localPath`                  | `string`             | Lokaler Entwicklungs- oder gebündelter Installationspfad.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                       |
| `minHostVersion`             | `string`             | Minimale unterstützte OpenClaw-Version im Format `>=x.y.z`.                      |
| `expectedIntegrity`          | `string`             | Erwarteter npm-dist-Integritätsstring, normalerweise `sha512-...`, für fixierte Installationen. |
| `allowInvalidConfigRecovery` | `boolean`            | Erlaubt gebündelten-Plugin-Neuinstallationsabläufen die Wiederherstellung bei bestimmten Fehlern mit veralteter Konfiguration. |

Interaktives Onboarding verwendet `openclaw.install` ebenfalls für
Install-on-Demand-Oberflächen. Wenn Ihr Plugin Provider-Auth-Auswahlen oder
Kanal-Setup-/Katalogmetadaten bereitstellt, bevor die Laufzeit geladen wird,
kann das Onboarding diese Auswahl anzeigen, nach npm- oder lokaler Installation fragen,
das Plugin installieren oder aktivieren und dann mit dem ausgewählten Ablauf fortfahren.
npm-Onboarding-Auswahlen erfordern vertrauenswürdige Katalogmetadaten mit einer Registry-
`npmSpec`; exakte Versionen und `expectedIntegrity` sind optionale Pins. Wenn
`expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Abläufe diesen Wert. Halten Sie die Metadaten für „was angezeigt werden soll“ in `openclaw.plugin.json` und die Metadaten für „wie es installiert werden soll“ in `package.json`.

Wenn `minHostVersion` gesetzt ist, erzwingen sowohl Installation als auch Laden aus der Manifest-Registry
diesen Wert. Ältere Hosts überspringen das Plugin; ungültige Versionsstrings werden abgelehnt.

Für fixierte npm-Installationen behalten Sie die exakte Version in `npmSpec` und fügen die
erwartete Artefaktintegrität hinzu:

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

`allowInvalidConfigRecovery` ist kein allgemeiner Bypass für defekte Konfigurationen. Es ist
nur für schmale Wiederherstellung bei gebündelten Plugins gedacht, damit Neuinstallation/Setup
bekannte Upgrade-Reste wie einen fehlenden Pfad für gebündelte Plugins oder einen veralteten Eintrag `channels.<id>`
für dasselbe Plugin reparieren können. Wenn die Konfiguration aus nicht zusammenhängenden Gründen defekt ist, schlägt die Installation weiterhin fail-closed fehl und fordert den Operator auf, `openclaw doctor --fix` auszuführen.

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

Wenn aktiviert, lädt OpenClaw während der Startup-Phase vor dem Lauschen nur `setupEntry`,
selbst für bereits konfigurierte Kanäle. Der vollständige Einstiegspunkt wird geladen, nachdem
das Gateway auf Verbindungen lauscht.

<Warning>
  Aktivieren Sie verzögertes Laden nur, wenn Ihr `setupEntry` alles registriert, was das
  Gateway vor dem Start des Listen-Zustands benötigt (Kanalregistrierung, HTTP-Routen,
  Gateway-Methoden). Wenn der vollständige Einstiegspunkt erforderliche Startup-Fähigkeiten besitzt, behalten Sie das Standardverhalten bei.
</Warning>

Wenn Ihr Setup-/vollständiger Einstiegspunkt Gateway-RPC-Methoden registriert, behalten Sie diese unter einem
Plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben Eigentum des Cores und werden immer
zu `operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss im Paket-Root ein `openclaw.plugin.json` enthalten.
OpenClaw verwendet dies, um die Konfiguration zu validieren, ohne Plugin-Code auszuführen.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Fügt OpenClaw Funktionen von My Plugin hinzu",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook-Verifikationsgeheimnis"
      }
    }
  }
}
```

Fügen Sie für Kanal-Plugins `kind` und `channels` hinzu:

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

Selbst Plugins ohne Konfiguration müssen ein Schema enthalten. Ein leeres Schema ist gültig:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Siehe [Plugin-Manifest](/de/plugins/manifest) für die vollständige Schemoreferenz.

## ClawHub-Veröffentlichung

Verwenden Sie für Plugin-Pakete den paketspezifischen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Der ältere Publish-Alias nur für Skills ist für Skills. Plugin-Pakete sollten
immer `clawhub package publish` verwenden.

## Setup-Einstiegspunkt

Die Datei `setup-entry.ts` ist eine leichte Alternative zu `index.ts`, die
OpenClaw lädt, wenn es nur Setup-Oberflächen benötigt (Onboarding, Konfigurationsreparatur,
Inspektion deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, dass während Setup-Abläufen schwerer Laufzeitcode geladen wird (Kryptobibliotheken, CLI-Registrierungen, Hintergrunddienste).

Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Modulen halten, können
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` anstelle von
`defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Vertrag unterstützt außerdem einen optionalen
Export `runtime`, sodass die Laufzeitverdrahtung zur Setup-Zeit leichtgewichtig und explizit bleiben kann.

**Wann OpenClaw `setupEntry` statt des vollständigen Einstiegspunkts verwendet:**

- Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen
- Der Kanal ist aktiviert, aber nicht konfiguriert
- Verzögertes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Was `setupEntry` registrieren muss:**

- Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`)
- Alle HTTP-Routen, die vor dem Gateway-Listen erforderlich sind
- Alle Gateway-Methoden, die während des Starts benötigt werden

Diese Startup-Gateway-Methoden sollten weiterhin reservierte Core-Admin-Namespaces wie
`config.*` oder `update.*` vermeiden.

**Was `setupEntry` NICHT enthalten sollte:**

- CLI-Registrierungen
- Hintergrunddienste
- Schwere Laufzeitimporte (Krypto, SDKs)
- Gateway-Methoden, die erst nach dem Start benötigt werden

### Schmale Setup-Helferimporte

Für reine Hot-Paths im Setup sollten Sie die schmalen Setup-Helfer-Seams den breiteren
Oberflächen von `plugin-sdk/setup` vorziehen, wenn Sie nur einen Teil der Setup-Oberfläche benötigen:

| Importpfad                        | Verwenden Sie ihn für                                                                | Wichtige Exporte                                                                                                                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | Laufzeithelfer zur Setup-Zeit, die in `setupEntry` / verzögertem Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Account-Setup-Adapter                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`          | Setup-/Installations-CLI-/Archiv-/Docs-Helfer                                       | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Verwenden Sie den breiteren Seam `plugin-sdk/setup`, wenn Sie die vollständige gemeinsame Setup-Toolbox möchten, einschließlich Helfern zum Patchen der Konfiguration wie
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import hot-path-sicher. Ihr gebündeltes
Lookup für die Oberfläche des Single-Account-Promotion-Vertrags ist lazy, sodass der Import von
`plugin-sdk/setup-runtime` die gebündelte Discovery der Vertragsoberfläche nicht eager lädt, bevor der Adapter tatsächlich verwendet wird.

### Kanal-eigene Single-Account-Promotion

Wenn ein Kanal von einer Single-Account-Top-Level-Konfiguration zu
`channels.<id>.accounts.*` migriert, verschiebt das standardmäßige gemeinsame Verhalten
Account-bezogene Werte nach `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-Vertragsoberfläche eingrenzen oder überschreiben:

- `singleAccountKeysToMove`: zusätzliche Top-Level-Schlüssel, die in das
  hochgestufte Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn bereits benannte Konten existieren, werden nur diese
  Schlüssel in das hochgestufte Konto verschoben; gemeinsame Policy-/Zustellschlüssel bleiben an der Kanalwurzel
- `resolveSingleAccountPromotionTarget(...)`: auswählt, welches vorhandene Konto
  die hochgestuften Werte erhält

Matrix ist das aktuelle gebündelte Beispiel. Wenn bereits genau ein benanntes Matrix-Konto
existiert oder wenn `defaultAccount` auf einen vorhandenen nicht kanonischen Schlüssel wie
`Ops` zeigt, bewahrt die Promotion dieses Konto, statt einen neuen Eintrag
`accounts.default` zu erzeugen.

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

Verwenden Sie für kanalspezifische Konfiguration stattdessen den Kanal-Konfigurationsabschnitt:

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

### Kanal-Konfigurationsschemas erstellen

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

## Einrichtungsassistenten

Kanal-Plugins können interaktive Einrichtungsassistenten für `openclaw onboard` bereitstellen.
Der Assistent ist ein Objekt `ChannelSetupWizard` auf dem `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Verbunden",
    unconfiguredLabel: "Nicht konfiguriert",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot-Token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "MY_CHANNEL_BOT_TOKEN aus der Umgebung verwenden?",
      keepPrompt: "Aktuelles Token behalten?",
      inputPrompt: "Geben Sie Ihr Bot-Token ein:",
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

Für DM-Allowlist-Eingabeaufforderungen, die nur den Standardablauf
`note -> prompt -> parse -> merge -> patch` benötigen, bevorzugen Sie die gemeinsamen Setup-
Helfer aus `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` und
`createNestedChannelParsedAllowFromPrompt(...)`.

Für Statusblöcke in der Kanal-Einrichtung, die sich nur in Labels, Scores und optionalen
Zusatzzeilen unterscheiden, bevorzugen Sie `createStandardChannelSetupStatus(...)` aus
`openclaw/plugin-sdk/setup`, statt in jedem Plugin dasselbe `status`-Objekt
von Hand zu erstellen.

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

Der generierte optionale Adapter/Assistent schlägt bei echten Konfigurationsschreibvorgängen fail-closed fehl. Er
verwendet dieselbe Nachricht zur erforderlichen Installation in `validateInput`,
`applyAccountConfig` und `finalize` wieder und hängt einen Docs-Link an, wenn `docsPath`
gesetzt ist.

Für Binary-gestützte Setup-UIs bevorzugen Sie die gemeinsamen delegierten Helfer, statt
denselben Binary-/Status-Klebstoff in jeden Kanal zu kopieren:

- `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur in Labels,
  Hinweisen, Scores und Binary-Erkennung unterscheiden
- `createCliPathTextInput(...)` für pfadgestützte Texteingaben
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und
  `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an
  einen schwereren vollständigen Assistenten weiterleiten muss
- `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur
  eine Entscheidung für `textInputs[*].shouldPrompt` delegieren muss

## Veröffentlichen und installieren

**Externe Plugins:** Auf [ClawHub](/de/tools/clawhub) oder npm veröffentlichen, dann installieren:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw versucht zuerst ClawHub und fällt automatisch auf npm zurück. Sie können ClawHub auch
explizit erzwingen:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # nur ClawHub
```

Es gibt keine entsprechende Überschreibung `npm:`. Verwenden Sie die normale npm-Package-Spec, wenn Sie
den npm-Pfad nach dem ClawHub-Fallback möchten:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**In-Repo-Plugins:** Unter dem Workspace-Baum für gebündelte Plugins ablegen; sie werden während des Builds automatisch
erkannt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Für Installationen aus npm führt `openclaw plugins install`
  `npm install --ignore-scripts` aus (keine Lifecycle-Skripte). Halten Sie Abhängigkeitsbäume von Plugins
  rein in JS/TS und vermeiden Sie Pakete, die `postinstall`-Builds benötigen.
</Info>

Gebündelte, OpenClaw-eigene Plugins sind die einzige Ausnahme für Startup-Reparaturen: Wenn eine
paketierte Installation eines davon durch Plugin-Konfiguration, ältere Kanal-Konfiguration oder
sein gebündeltes standardmäßig aktiviertes Manifest aktiviert sieht, installiert der Start die fehlenden
Laufzeitabhängigkeiten dieses Plugins vor dem Import. Drittanbieter-Plugins sollten sich nicht auf Installationen
beim Start verlassen; verwenden Sie weiterhin den expliziten Plugin-Installer.

## Verwandt

- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) -- `definePluginEntry` und `defineChannelPluginEntry`
- [Plugin-Manifest](/de/plugins/manifest) -- vollständige Referenz für das Manifest-Schema
- [Plugins erstellen](/de/plugins/building-plugins) -- Schritt-für-Schritt-Einstiegsleitfaden
