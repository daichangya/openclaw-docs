---
read_when:
    - Du fügst einem Plugin einen Einrichtungsassistenten hinzu.
    - Du musst `setup-entry.ts` im Vergleich zu `index.ts` verstehen.
    - Du definierst Plugin-Konfigurationsschemata oder `package.json`-`openclaw`-Metadaten.
sidebarTitle: Setup and Config
summary: Einrichtungsassistenten, setup-entry.ts, Konfigurationsschemata und package.json-Metadaten
title: Plugin-Einrichtung und -Konfiguration
x-i18n:
    generated_at: "2026-04-15T19:42:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf28e25e381a4a38ac478e531586f59612e1a278732597375f87c2eeefc521b
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin-Einrichtung und -Konfiguration

Referenz für Plugin-Paketierung (`package.json`-Metadaten), Manifeste
(`openclaw.plugin.json`), Setup-Einstiegspunkte und Konfigurationsschemata.

<Tip>
  **Suchst du nach einer Schritt-für-Schritt-Anleitung?** Die How-to-Guides behandeln die Paketierung im Kontext:
  [Channel Plugins](/de/plugins/sdk-channel-plugins#step-1-package-and-manifest) und
  [Provider Plugins](/de/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Paket-Metadaten

Deine `package.json` benötigt ein `openclaw`-Feld, das dem Plugin-System mitteilt,
was dein Plugin bereitstellt:

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

**Provider Plugin / ClawHub-Veröffentlichungsbasis:**

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

Wenn du das Plugin extern auf ClawHub veröffentlichst, sind diese `compat`- und `build`-
Felder erforderlich. Die kanonischen Veröffentlichungs-Snippets befinden sich in
`docs/snippets/plugin-publish/`.

### `openclaw`-Felder

| Feld         | Typ        | Beschreibung                                                                                           |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Einstiegspunktdateien (relativ zum Paketstamm)                                                         |
| `setupEntry` | `string`   | Leichtgewichtiger, nur für das Setup verwendeter Einstiegspunkt (optional)                             |
| `channel`    | `object`   | Kanal-Katalogmetadaten für Setup-, Auswahl-, Schnellstart- und Status-Oberflächen                     |
| `providers`  | `string[]` | Provider-IDs, die von diesem Plugin registriert werden                                                 |
| `install`    | `object`   | Installationshinweise: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags für das Startverhalten                                                                            |

### `openclaw.channel`

`openclaw.channel` sind kostengünstige Paket-Metadaten für die Kanalerkennung und
Setup-Oberflächen, bevor die Laufzeit geladen wird.

| Feld                                   | Typ        | Bedeutung                                                                      |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Kanonische Kanal-ID.                                                           |
| `label`                                | `string`   | Primäre Kanalbezeichnung.                                                      |
| `selectionLabel`                       | `string`   | Bezeichnung für Auswahl/Setup, wenn sie sich von `label` unterscheiden soll.   |
| `detailLabel`                          | `string`   | Sekundäre Detailbezeichnung für umfangreichere Kanalkataloge und Statusansichten. |
| `docsPath`                             | `string`   | Dokumentationspfad für Setup- und Auswahllinks.                                |
| `docsLabel`                            | `string`   | Überschriebene Bezeichnung für Dokumentationslinks, wenn sie sich von der Kanal-ID unterscheiden soll. |
| `blurb`                                | `string`   | Kurze Beschreibung für Onboarding/Katalog.                                     |
| `order`                                | `number`   | Sortierreihenfolge in Kanalkatalogen.                                          |
| `aliases`                              | `string[]` | Zusätzliche Suchaliase für die Kanalauswahl.                                   |
| `preferOver`                           | `string[]` | IDs von Plugins/Kanälen mit niedrigerer Priorität, die von diesem Kanal übertroffen werden sollen. |
| `systemImage`                          | `string`   | Optionaler Symbol-/Systembildname für Kanal-UI-Kataloge.                       |
| `selectionDocsPrefix`                  | `string`   | Präfixtext vor Dokumentationslinks in Auswahloberflächen.                      |
| `selectionDocsOmitLabel`               | `boolean`  | Zeigt den Dokumentationspfad direkt anstelle eines beschrifteten Dokumentationslinks im Auswahltext an. |
| `selectionExtras`                      | `string[]` | Zusätzliche kurze Zeichenfolgen, die im Auswahltext angehängt werden.          |
| `markdownCapable`                      | `boolean`  | Kennzeichnet den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung. |
| `exposure`                             | `object`   | Sichtbarkeitssteuerung des Kanals für Setup-, konfigurierte Listen- und Dokumentationsoberflächen. |
| `quickstartAllowFrom`                  | `boolean`  | Nimmt diesen Kanal in den standardmäßigen Schnellstart-`allowFrom`-Setup-Ablauf auf. |
| `forceAccountBinding`                  | `boolean`  | Erzwingt explizite Kontobindung, selbst wenn nur ein Konto vorhanden ist.      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Bevorzugt die Sitzungssuche beim Auflösen von Ankündigungszielen für diesen Kanal. |

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

- `configured`: nimmt den Kanal in konfigurierte/statusartige Listenoberflächen auf
- `setup`: nimmt den Kanal in interaktive Setup-/Konfigurationsauswahlen auf
- `docs`: markiert den Kanal als öffentlich sichtbar in Dokumentations-/Navigationsoberflächen

`showConfigured` und `showInSetup` werden weiterhin als Legacy-Aliase unterstützt. Bevorzuge
`exposure`.

### `openclaw.install`

`openclaw.install` sind Paket-Metadaten, keine Manifest-Metadaten.

| Feld                         | Typ                  | Bedeutung                                                                       |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Kanonische npm-Spezifikation für Installations-/Update-Abläufe.                 |
| `localPath`                  | `string`             | Lokaler Entwicklungs- oder gebündelter Installationspfad.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Bevorzugte Installationsquelle, wenn beide verfügbar sind.                      |
| `minHostVersion`             | `string`             | Minimal unterstützte OpenClaw-Version im Format `>=x.y.z`.                      |
| `allowInvalidConfigRecovery` | `boolean`            | Ermöglicht es Neuinstallationsabläufen gebündelter Plugins, sich von bestimmten Fehlern mit veralteter Konfiguration zu erholen. |

Wenn `minHostVersion` gesetzt ist, erzwingen sowohl die Installation als auch das Laden der Manifest-Registry
diese Angabe. Ältere Hosts überspringen das Plugin; ungültige Versionszeichenfolgen werden abgelehnt.

`allowInvalidConfigRecovery` ist keine allgemeine Umgehung für fehlerhafte Konfigurationen. Es ist
nur für die gezielte Wiederherstellung gebündelter Plugins gedacht, damit Neuinstallation/Setup bekannte
Upgrade-Überbleibsel reparieren können, wie einen fehlenden gebündelten Plugin-Pfad oder einen veralteten
`channels.<id>`-Eintrag für genau dieses Plugin. Wenn die Konfiguration aus anderen Gründen fehlerhaft ist,
schlägt die Installation weiterhin sicher fehl und weist den Operator an, `openclaw doctor --fix` auszuführen.

### Aufgeschobenes vollständiges Laden

Kanal-Plugins können sich mit Folgendem für aufgeschobenes Laden entscheiden:

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

Wenn dies aktiviert ist, lädt OpenClaw in der Startphase vor `listen` nur `setupEntry`,
selbst für bereits konfigurierte Kanäle. Der vollständige Einstiegspunkt wird geladen, nachdem das
Gateway begonnen hat zu lauschen.

<Warning>
  Aktiviere aufgeschobenes Laden nur, wenn dein `setupEntry` alles registriert, was das
  Gateway benötigt, bevor es beginnt zu lauschen (Kanalregistrierung, HTTP-Routen,
  Gateway-Methoden). Wenn der vollständige Einstiegspunkt erforderliche Startfähigkeiten besitzt,
  behalte das Standardverhalten bei.
</Warning>

Wenn dein Setup-/vollständiger Einstiegspunkt Gateway-RPC-Methoden registriert, halte sie auf einem
Plugin-spezifischen Präfix. Reservierte Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben im Besitz des Core und werden immer
zu `operator.admin` aufgelöst.

## Plugin-Manifest

Jedes native Plugin muss im Paketstamm ein `openclaw.plugin.json` enthalten.
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

Für Kanal-Plugins füge `kind` und `channels` hinzu:

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

Siehe [Plugin Manifest](/de/plugins/manifest) für die vollständige Schemareferenz.

## ClawHub-Veröffentlichung

Verwende für Plugin-Pakete den paket-spezifischen ClawHub-Befehl:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Der ältere, nur auf Skills bezogene Veröffentlichungsalias ist für Skills. Plugin-Pakete sollten
immer `clawhub package publish` verwenden.

## Setup-Einstiegspunkt

Die Datei `setup-entry.ts` ist eine leichtgewichtige Alternative zu `index.ts`, die
OpenClaw lädt, wenn nur Setup-Oberflächen benötigt werden (Onboarding, Konfigurationsreparatur,
Inspektion deaktivierter Kanäle).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Dadurch wird vermieden, schwere Laufzeitkomponenten (Kryptobibliotheken, CLI-Registrierungen,
Hintergrunddienste) während Setup-Abläufen zu laden.

Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Modulen behalten, können
`defineBundledChannelSetupEntry(...)` aus
`openclaw/plugin-sdk/channel-entry-contract` anstelle von
`defineSetupPluginEntry(...)` verwenden. Dieser gebündelte Vertrag unterstützt auch einen optionalen
`runtime`-Export, damit die Laufzeitverdrahtung zur Setup-Zeit leichtgewichtig und explizit bleiben kann.

**Wann OpenClaw `setupEntry` anstelle des vollständigen Einstiegspunkts verwendet:**

- Der Kanal ist deaktiviert, benötigt aber Setup-/Onboarding-Oberflächen
- Der Kanal ist aktiviert, aber nicht konfiguriert
- Aufgeschobenes Laden ist aktiviert (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Was `setupEntry` registrieren muss:**

- Das Kanal-Plugin-Objekt (über `defineSetupPluginEntry`)
- Alle HTTP-Routen, die vor dem Lauschen des Gateways erforderlich sind
- Alle Gateway-Methoden, die beim Start benötigt werden

Diese Gateway-Methoden für den Start sollten weiterhin reservierte Core-Admin-
Namespaces wie `config.*` oder `update.*` vermeiden.

**Was `setupEntry` NICHT enthalten sollte:**

- CLI-Registrierungen
- Hintergrunddienste
- Schwere Laufzeitimporte (Kryptografie, SDKs)
- Gateway-Methoden, die erst nach dem Start benötigt werden

### Schmale Importe für Setup-Hilfsfunktionen

Für reine Setup-Hotpaths solltest du die schmalen Hilfsseams für das Setup dem breiteren
`plugin-sdk/setup`-Umbrella vorziehen, wenn du nur einen Teil der Setup-Oberfläche benötigst:

| Importpfad                        | Verwende ihn für                                                                         | Wichtige Exporte                                                                                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | Laufzeit-Hilfsfunktionen zur Setup-Zeit, die in `setupEntry` / beim aufgeschobenen Kanalstart verfügbar bleiben | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | umgebungsbewusste Account-Setup-Adapter                                                 | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | CLI-/Archiv-/Dokumentations-Hilfsfunktionen für Setup/Installation                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Verwende den breiteren `plugin-sdk/setup`-Seam, wenn du die vollständige gemeinsame Setup-
Werkzeugkiste haben möchtest, einschließlich Hilfsfunktionen zum Patchen der Konfiguration wie
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Die Setup-Patch-Adapter bleiben beim Import hotpath-sicher. Ihr gebündeltes Nachschlagen der
Vertragsoberfläche für die Promotion eines Einzelkontos erfolgt lazy, sodass der Import von
`plugin-sdk/setup-runtime` die Erkennung gebündelter Vertragsoberflächen nicht vorzeitig lädt,
bevor der Adapter tatsächlich verwendet wird.

### Kanal-eigene Einzelkonto-Promotion

Wenn ein Kanal von einer Konfiguration auf oberster Ebene für ein Einzelkonto auf
`channels.<id>.accounts.*` umstellt, verschiebt das standardmäßige gemeinsame Verhalten die
promoteten konto-spezifischen Werte in `accounts.default`.

Gebündelte Kanäle können diese Promotion über ihre Setup-Vertragsoberfläche eingrenzen oder
überschreiben:

- `singleAccountKeysToMove`: zusätzliche Schlüssel auf oberster Ebene, die in das
  promotete Konto verschoben werden sollen
- `namedAccountPromotionKeys`: wenn bereits benannte Konten existieren, werden nur diese
  Schlüssel in das promotete Konto verschoben; gemeinsame Richtlinien-/Zustellungsschlüssel
  bleiben auf der Kanalwurzelebene
- `resolveSingleAccountPromotionTarget(...)`: wählt aus, welches vorhandene Konto die
  promoteten Werte erhält

Matrix ist das aktuelle gebündelte Beispiel. Wenn bereits genau ein benanntes Matrix-Konto
existiert oder wenn `defaultAccount` auf einen vorhandenen nicht-kanonischen Schlüssel wie
`Ops` zeigt, bewahrt die Promotion dieses Konto, anstatt einen neuen Eintrag
`accounts.default` zu erstellen.

## Konfigurationsschema

Die Plugin-Konfiguration wird gegen das JSON-Schema in deinem Manifest validiert. Benutzer
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

Dein Plugin erhält diese Konfiguration während der Registrierung als `api.pluginConfig`.

Verwende für kanal-spezifische Konfiguration stattdessen den Kanal-Konfigurationsabschnitt:

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

### Kanal-Konfigurationsschemata erstellen

Verwende `buildChannelConfigSchema` aus `openclaw/plugin-sdk/core`, um ein
Zod-Schema in den `ChannelConfigSchema`-Wrapper umzuwandeln, den OpenClaw validiert:

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
Siehe die gebündelten Plugin-Pakete (zum Beispiel das Discord-Plugin `src/channel.setup.ts`) für
vollständige Beispiele.

Für DM-Allowlist-Abfragen, die nur den Standardablauf
`note -> prompt -> parse -> merge -> patch` benötigen, solltest du die gemeinsamen Setup-
Hilfsfunktionen aus `openclaw/plugin-sdk/setup` bevorzugen: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` und
`createNestedChannelParsedAllowFromPrompt(...)`.

Für Kanal-Setup-Statusblöcke, die sich nur in Bezeichnungen, Bewertungen und optionalen
zusätzlichen Zeilen unterscheiden, solltest du `createStandardChannelSetupStatus(...)` aus
`openclaw/plugin-sdk/setup` bevorzugen, anstatt in jedem Plugin dasselbe `status`-Objekt
von Hand zu bauen.

Für optionale Setup-Oberflächen, die nur in bestimmten Kontexten erscheinen sollen, verwende
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
`createOptionalChannelSetupWizard(...)` bereit, wenn du nur eine Hälfte
dieser optionalen Installationsoberfläche benötigst.

Der generierte optionale Adapter/Assistent schlägt bei echten Konfigurationsschreibvorgängen sicher fehl. Sie
verwenden dieselbe Meldung „Installation erforderlich“ in `validateInput`,
`applyAccountConfig` und `finalize` wieder und hängen einen Dokumentationslink an, wenn `docsPath`
gesetzt ist.

Für binärgestützte Setup-UIs solltest du die gemeinsamen delegierten Hilfsfunktionen bevorzugen,
anstatt dieselbe Binär-/Status-Logik in jeden Kanal zu kopieren:

- `createDetectedBinaryStatus(...)` für Statusblöcke, die sich nur nach Bezeichnungen,
  Hinweisen, Bewertungen und Binärerkennung unterscheiden
- `createCliPathTextInput(...)` für pfadgestützte Texteingaben
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` und
  `createDelegatedResolveConfigured(...)`, wenn `setupEntry` lazy an
  einen schwergewichtigeren vollständigen Assistenten weiterleiten muss
- `createDelegatedTextInputShouldPrompt(...)`, wenn `setupEntry` nur eine
  `textInputs[*].shouldPrompt`-Entscheidung delegieren muss

## Veröffentlichen und installieren

**Externe Plugins:** Veröffentliche sie auf [ClawHub](/de/tools/clawhub) oder npm und installiere sie dann:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw versucht zuerst ClawHub und greift automatisch auf npm zurück. Du kannst ClawHub auch
explizit erzwingen:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # nur ClawHub
```

Es gibt kein entsprechendes `npm:`-Override. Verwende die normale npm-Paketspezifikation, wenn du
nach dem ClawHub-Fallback den npm-Pfad verwenden möchtest:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins im Repository:** Lege sie unter dem gebündelten Plugin-Workspace-Baum ab; dann werden sie beim Build automatisch
erkannt.

**Benutzer können installieren:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Für Installationen aus npm-Quellen führt `openclaw plugins install`
  `npm install --ignore-scripts` aus (keine Lifecycle-Skripte). Halte die Abhängigkeitsbäume von Plugins
  rein in JS/TS und vermeide Pakete, die `postinstall`-Builds erfordern.
</Info>

## Verwandt

- [SDK Entry Points](/de/plugins/sdk-entrypoints) -- `definePluginEntry` und `defineChannelPluginEntry`
- [Plugin Manifest](/de/plugins/manifest) -- vollständige Referenz des Manifestschemas
- [Building Plugins](/de/plugins/building-plugins) -- Schritt-für-Schritt-Einstiegsanleitung
