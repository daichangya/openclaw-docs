---
read_when:
    - Sie entwickeln ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema bereitstellen oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest- + JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-24T06:49:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: d27765f1efc9720bd68c73d3ede796a91e9afec479f89eda531dd14adc708e53
    source_path: plugins/manifest.md
    workflow: 15
---

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Für kompatible Bundle-Layouts siehe [Plugin bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das Standard-Layout von Claude-Komponenten
  ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch nicht
gegen das hier beschriebene Schema `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten plus deklarierte
Skill-Roots, Claude-Command-Roots, Standardwerte aus `settings.json` von Claude-Bundles,
LSP-Standardwerte von Claude-Bundles und unterstützte Hook-Packs, wenn das Layout
den Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** mitliefern. OpenClaw verwendet dieses Manifest, um Konfigurationen zu validieren,
**ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe die vollständige Anleitung zum Plugin-System: [Plugins](/de/tools/plugin).
Für das native Fähigkeitsmodell und die aktuelle Anleitung zur externen Kompatibilität:
[Capability model](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, **bevor Ihr
Plugin-Code geladen wird**. Alles darunter muss günstig genug zu prüfen sein, ohne die
Plugin-Laufzeit zu starten.

**Verwenden Sie sie für:**

- Plugin-Identität, Konfigurationsvalidierung und Hinweise für die Konfigurations-UI
- Metadaten für Authentifizierung, Onboarding und Einrichtung (Alias, automatische Aktivierung, Provider-Umgebungsvariablen, Auth-Auswahl)
- Aktivierungshinweise für Oberflächen der Control Plane
- Kurzformen für Besitz von Modellfamilien
- statische Snapshots zum Besitz von Fähigkeiten (`contracts`)
- QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa` prüfen kann
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden

**Verwenden Sie sie nicht für:** Registrierung von Laufzeitverhalten, Deklaration von
Code-Entry-Points oder npm-Installationsmetadaten. Diese gehören in Ihren Plugin-Code und in `package.json`.

## Minimales Beispiel

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Umfangreicheres Beispiel

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API-Schlüssel",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API-Schlüssel",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API-Schlüssel",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Referenz der Top-Level-Felder

| Feld                                 | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                                         |
| ------------------------------------ | ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                            |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                          |
| `enabledByDefault`                   | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg oder setzen Sie einen beliebigen Wert ungleich `true`, um das Plugin standardmäßig deaktiviert zu lassen.                                       |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modellreferenzen sie erwähnen.                                                                                          |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                  |
| `channels`                           | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Werden für Discovery und Konfigurationsvalidierung verwendet.                                                                                                                               |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                           |
| `providerDiscoveryEntry`             | Nein         | `string`                         | Pfad zu einem schlanken Provider-Discovery-Modul relativ zum Plugin-Root für manifestgebundene Provider-Katalogmetadaten, die ohne Aktivierung der vollständigen Plugin-Laufzeit geladen werden können.                         |
| `modelSupport`                       | Nein         | `object`                         | Manifest-eigene Kurzmetadaten zu Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                                                      |
| `providerEndpoints`                  | Nein         | `object[]`                       | Manifest-eigene Metadaten zu Endpoint-Host/baseUrl für Provider-Routen, die der Core klassifizieren muss, bevor die Provider-Laufzeit geladen wird.                                                                              |
| `cliBackends`                        | Nein         | `string[]`                       | CLI-Inferenz-Backend-IDs, die diesem Plugin gehören. Werden für automatische Aktivierung beim Start aus expliziten Konfigurationsreferenzen verwendet.                                                                          |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren plugin-eigener Synthetic-Auth-Hook während kalter Modell-Discovery vor dem Laden der Laufzeit geprüft werden soll.                                                                  |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalterwerte für API-Schlüssel, die gebündelten Plugins gehören und einen nicht geheimen lokalen, OAuth- oder Ambient-Credential-Zustand darstellen.                                                                        |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen, bevor die Laufzeit geladen wird.                                                                                   |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Günstige Metadaten zu Provider-Auth-Umgebungsvariablen, die OpenClaw prüfen kann, ohne Plugin-Code zu laden.                                                                                                                    |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die für die Authentifizierung eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider teilt.             |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Günstige Metadaten zu Kanal-Umgebungsvariablen, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuerte Kanaleinrichtung oder Auth-Oberflächen, die generische Start-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                       | Günstige Metadaten für Auth-Auswahl in Onboarding-Pickern, bevorzugte Provider-Auflösung und einfache CLI-Flag-Verdrahtung.                                                                                                     |
| `activation`                         | Nein         | `object`                         | Günstige Metadaten für den Aktivierungsplaner bei provider-, befehls-, kanal-, routen- und fähigkeitsgetriggertem Laden. Nur Metadaten; das tatsächliche Verhalten gehört weiterhin der Plugin-Laufzeit.                      |
| `setup`                              | Nein         | `object`                         | Günstige Setup-/Onboarding-Beschreibungen, die Discovery- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                               |
| `qaRunners`                          | Nein         | `object[]`                       | Günstige Beschreibungen für QA-Runner, die vom gemeinsamen Host `openclaw qa` verwendet werden, bevor die Plugin-Laufzeit geladen wird.                                                                                         |
| `contracts`                          | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeiten für externe Auth-Hooks, Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Media Understanding, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Besitz. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Günstige Standardwerte für Media Understanding für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                                 |
| `channelConfigs`                     | Nein         | `Record<string, object>`         | Manifest-eigene Metadaten zur Kanalkonfiguration, die in Discovery- und Validierungsoberflächen zusammengeführt werden, bevor die Laufzeit geladen wird.                                                                        |
| `skills`                             | Nein         | `string[]`                       | Zu ladende Skill-Verzeichnisse relativ zum Plugin-Root.                                                                                                                                                                            |
| `name`                               | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                                      |
| `description`                        | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                   |
| `version`                            | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                        |
| `uiHints`                            | Nein         | `Record<string, object>`         | UI-Labels, Platzhalter und Hinweise auf Sensitivität für Konfigurationsfelder.                                                                                                                                                     |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                  |
| --------------------- | ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                  |
| `method`              | Ja           | `string`                                        | ID der Auth-Methode, an die weitergeleitet werden soll.                                                    |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Choice-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                              |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitiges Label. Wenn ausgelassen, greift OpenClaw auf `choiceId` zurück.                          |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für den Picker.                                                                           |
| `assistantPriority`   | Nein         | `number`                                        | Kleinere Werte werden in assistentengesteuerten interaktiven Pickern früher sortiert.                     |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Verbirgt die Auswahl in Assistenten-Pickern, erlaubt aber weiterhin manuelle CLI-Auswahl.                 |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Veraltete Choice-IDs, die Benutzer zu dieser Ersatz-Auswahl umleiten sollen.                              |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlmöglichkeiten.                                       |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitiges Label für diese Gruppe.                                                                   |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                           |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit einem Flag.                                        |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, z. B. `--openrouter-api-key`.                                                          |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, z. B. `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                         |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn ausgelassen, ist der Standard `["text-inference"]`. |

## Referenz für `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen besitzt, den Benutzer
irrtümlich in `plugins.allow` eintragen oder als Root-CLI-Befehl ausführen möchten. OpenClaw
verwendet diese Metadaten für Diagnosen, ohne Laufzeitcode des Plugins zu importieren.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Feld         | Erforderlich | Typ               | Bedeutung                                                               |
| ------------ | ------------ | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der diesem Plugin gehört.                                  |
| `kind`       | Nein         | `"runtime-slash"` | Markiert den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.     |
| `cliCommand` | Nein         | `string`          | Verwandter Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen werden soll, falls vorhanden. |

## Referenz für `activation`

Verwenden Sie `activation`, wenn das Plugin günstig deklarieren kann, welche Control-Plane-Ereignisse
es in einen Aktivierungs-/Ladeplan aufnehmen sollen.

Dieser Block ist Planer-Metadaten, keine Lifecycle-API. Er registriert kein
Laufzeitverhalten, ersetzt nicht `register(...)` und verspricht nicht, dass
Plugin-Code bereits ausgeführt wurde. Der Aktivierungsplaner verwendet diese Felder, um Kandidaten-Plugins einzugrenzen, bevor auf bestehende Manifest-Eigentums-
metadaten wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks zurückgegriffen wird.

Bevorzugen Sie die engsten Metadaten, die Eigentum bereits beschreiben. Verwenden Sie
`providers`, `channels`, `commandAliases`, Setup-Beschreibungen oder `contracts`,
wenn diese Felder die Beziehung ausdrücken. Verwenden Sie `activation` für zusätzliche Hinweise an den Planer, die nicht durch diese Eigentumsfelder dargestellt werden können.

Dieser Block enthält nur Metadaten. Er registriert kein Laufzeitverhalten und ersetzt nicht
`register(...)`, `setupEntry` oder andere Laufzeit-/Plugin-Entry-Points.
Aktuelle Konsumenten verwenden ihn als Eingrenzungshinweis vor breiterem Plugin-Laden, sodass fehlende Aktivierungsmetadaten in der Regel nur Leistung kosten; sie sollten die Korrektheit nicht verändern, solange veraltete Manifest-Eigentums-Fallbacks noch existieren.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Feld             | Erforderlich | Typ                                                  | Bedeutung                                                                                              |
| ---------------- | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `onProviders`    | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                           |
| `onCommands`     | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                            |
| `onChannels`     | Nein         | `string[]`                                           | Kanal-IDs, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                              |
| `onRoutes`       | Nein         | `string[]`                                           | Route-Arten, die dieses Plugin in Aktivierungs-/Ladepläne aufnehmen sollen.                            |
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Breite Fähigkeitshinweise, die für die Aktivierungsplanung der Control Plane verwendet werden. Bevorzugen Sie nach Möglichkeit engere Felder. |

Aktuelle Live-Konsumenten:

- CLI-Planung, die durch Befehle ausgelöst wird, greift auf veraltete
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- Setup-/Kanal-Planung, die durch Kanäle ausgelöst wird, greift auf veraltetes Eigentum aus `channels[]`
  zurück, wenn explizite Aktivierungsmetadaten für den Kanal fehlen
- Setup-/Laufzeitplanung, die durch Provider ausgelöst wird, greift auf veraltetes
  Eigentum aus `providers[]` und `cliBackends[]` auf oberster Ebene zurück, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

Diagnosen des Planers können explizite Aktivierungshinweise von Fallbacks des Manifest-
Eigentums unterscheiden. Zum Beispiel bedeutet `activation-command-hint`, dass
`activation.onCommands` übereinstimmte, während `manifest-command-alias` bedeutet, dass der
Planer stattdessen Eigentum aus `commandAliases` verwendet hat. Diese Bezeichner sind für
Host-Diagnosen und Tests gedacht; Plugin-Autoren sollten weiterhin die Metadaten deklarieren,
die Eigentum am besten beschreiben.

## Referenz für `qaRunners`

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb des
gemeinsamen Roots `openclaw qa` bereitstellt. Halten Sie diese Metadaten günstig und statisch; die
Plugin-Laufzeit besitzt weiterhin die eigentliche CLI-Registrierung über eine leichte
Oberfläche `runtime-api.ts`, die `qaRunnerCliRegistrations` exportiert.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Feld          | Erforderlich | Typ      | Bedeutung                                                          |
| ------------- | ------------ | -------- | ------------------------------------------------------------------ |
| `commandName` | Ja           | `string` | Unterbefehl, der unter `openclaw qa` eingehängt wird, z. B. `matrix`. |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

## Referenz für `setup`

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen günstige plugin-eigene Metadaten
benötigen, bevor die Laufzeit geladen wird.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` auf oberster Ebene bleibt gültig und beschreibt weiterhin CLI-Inferenz-
Backends. `setup.cliBackends` ist die setup-spezifische Beschreibungsoberfläche für
Control-Plane-/Setup-Abläufe, die rein metadata-basiert bleiben sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
deskriptorbasierte Lookup-Oberfläche für Setup-Discovery. Wenn der Deskriptor das
Kandidaten-Plugin nur eingrenzt und Setup weiterhin reichere Laufzeit-Hooks zur Setup-Zeit benötigt,
setzen Sie `requiresRuntime: true` und behalten `setup-api` als Fallback-
Ausführungspfad bei.

Da das Setup-Lookup plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte
Werte in `setup.providers[].id` und `setup.cliBackends[]` über alle
entdeckten Plugins hinweg eindeutig bleiben. Mehrdeutiges Eigentum schlägt fail-closed fehl, statt
einen Gewinner anhand der Discovery-Reihenfolge auszuwählen.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                 |
| ------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------- |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding bereitgestellt wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods` | Nein         | `string[]` | IDs der Setup-/Auth-Methoden, die dieser Provider unterstützt, ohne die vollständige Laufzeit zu laden. |
| `envVars`     | Nein         | `string[]` | Umgebungsvariablen, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                         |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Setup-Beschreibungen für Provider, die während Setup und Onboarding bereitgestellt werden.        |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für deskriptorbasiertes Setup-Lookup verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins gehören.               |
| `requiresRuntime`  | Nein         | `boolean`  | Ob Setup nach dem deskriptorbasierten Lookup weiterhin `setup-api`-Ausführung benötigt.           |

## Referenz für `uiHints`

`uiHints` ist eine Zuordnung von Namen von Konfigurationsfeldern zu kleinen Rendering-Hinweisen.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API-Schlüssel",
      "help": "Wird für OpenRouter-Anfragen verwendet",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Jeder Feldhinweis kann Folgendes enthalten:

| Feld          | Typ        | Bedeutung                                  |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Benutzerseitiges Feldlabel.                |
| `help`        | `string`   | Kurzer Hilfetext.                          |
| `tags`        | `string[]` | Optionale UI-Tags.                         |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.           |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.      |

## Referenz für `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zum Besitz von Fähigkeiten, die OpenClaw
lesen kann, ohne die Plugin-Laufzeit zu importieren.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Jede Liste ist optional:

| Feld                             | Typ        | Bedeutung                                                                 |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs eingebetteter Laufzeiten, für die ein gebündeltes Plugin Factories registrieren darf. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Auth-Profile diesem Plugin gehört.   |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                           |
| `realtimeTranscriptionProviders` | `string[]` | Provider-IDs für Echtzeit-Transkription, die diesem Plugin gehören.       |
| `realtimeVoiceProviders`         | `string[]` | Provider-IDs für Echtzeit-Stimme, die diesem Plugin gehören.              |
| `memoryEmbeddingProviders`       | `string[]` | Provider-IDs für Memory Embedding, die diesem Plugin gehören.             |
| `mediaUnderstandingProviders`    | `string[]` | Media-Understanding-Provider-IDs, die diesem Plugin gehören.              |
| `imageGenerationProviders`       | `string[]` | Bildgenerierungs-Provider-IDs, die diesem Plugin gehören.                 |
| `videoGenerationProviders`       | `string[]` | Videogenerierungs-Provider-IDs, die diesem Plugin gehören.                |
| `webFetchProviders`              | `string[]` | Web-Fetch-Provider-IDs, die diesem Plugin gehören.                        |
| `webSearchProviders`             | `string[]` | Websuch-Provider-IDs, die diesem Plugin gehören.                          |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für gebündelte Vertragsprüfungen gehören. |

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten
`contracts.externalAuthProviders` deklarieren. Plugins ohne diese Deklaration laufen
weiterhin über einen veralteten Kompatibilitäts-Fallback, aber dieser Fallback ist langsamer und
wird nach dem Migrationsfenster entfernt.

Gebündelte Memory-Embedding-Provider sollten
`contracts.memoryEmbeddingProviders` für jede Adapter-ID deklarieren, die sie bereitstellen, einschließlich
integrierter Adapter wie `local`. Eigenständige CLI-Pfade verwenden diesen Manifest-
Vertrag, um nur das besitzende Plugin zu laden, bevor die vollständige Gateway-Laufzeit
Provider registriert hat.

## Referenz für `mediaUnderstandingProviderMetadata`

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Media-Understanding-Provider
Standardmodelle, Auto-Auth-Fallback-Priorität oder native Dokumentunterstützung hat, die
generische Core-Helfer benötigen, bevor die Laufzeit geladen wird. Schlüssel müssen außerdem in
`contracts.mediaUnderstandingProviders` deklariert werden.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Jeder Providereintrag kann Folgendes enthalten:

| Feld                   | Typ                                 | Bedeutung                                                                   |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medienfähigkeiten, die dieser Provider bereitstellt.                         |
| `defaultModels`        | `Record<string, string>`            | Standardwerte von Fähigkeit zu Modell, die verwendet werden, wenn die Konfiguration kein Modell angibt. |
| `autoPriority`         | `Record<string, number>`            | Kleinere Zahlen werden bei automatischem providerbasiertem Fallback aufgrund von Anmeldedaten früher sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.                |

## Referenz für `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin günstige Konfigurationsmetadaten benötigt,
bevor die Laufzeit geladen wird.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver-URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Jeder Kanaleintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Eintrag zur Kanalkonfiguration erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Labels/Platzhalter/Hinweise auf Sensitivität für diesen Abschnitt der Kanalkonfiguration. |
| `label`       | `string`                 | Kanal-Label, das in Picker- und Prüfoberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Prüf- und Katalogoberflächen.                                |
| `preferOver`  | `string[]`               | Veraltete oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz für `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus
Kurzformen von Modell-IDs wie `gpt-5.5` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit
geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw wendet dabei folgende Priorität an:

- explizite Referenzen `provider/model` verwenden die Manifest-Metadaten `providers` des besitzenden Plugins
- `modelPatterns` schlagen `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis Benutzer oder Konfiguration einen Provider angeben

Felder:

| Feld            | Typ        | Bedeutung                                                                          |
| --------------- | ---------- | ---------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die per `startsWith` gegen Kurzformen von Modell-IDs abgeglichen werden. |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach Entfernen von Profil-Suffixen gegen Kurzformen von Modell-IDs abgeglichen werden. |

Veraltete Fähigkeits-Schlüssel auf oberster Ebene sind deprecated. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; normales
Manifest-Laden behandelt diese Felder auf oberster Ebene nicht mehr als Besitz von Fähigkeiten.

## Manifest versus package.json

Die beiden Dateien dienen unterschiedlichen Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Metadaten zur Auth-Auswahl und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code läuft |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und den Block `openclaw`, der für Entry-Points, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wo ein Metadatum hingehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Entry-Dateien oder npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die Discovery beeinflussen

Einige Metadaten von Plugins vor der Laufzeit liegen absichtlich in `package.json` unter dem
Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                                                               |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                              | Deklariert native Plugin-Entry-Points. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                          |
| `openclaw.runtimeExtensions`                                       | Deklariert gebaute JavaScript-Laufzeit-Entry-Points für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                   |
| `openclaw.setupEntry`                                              | Leichter Entry-Point nur für Setup, der während Onboarding, verzögertem Kanalstart und schreibgeschützter Discovery von Kanalstatus/SecretRef verwendet wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                       | Deklariert den gebauten JavaScript-Setup-Entry-Point für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                  |
| `openclaw.channel`                                                 | Günstige Metadaten für den Kanalkatalog wie Labels, Doku-Pfade, Aliasse und Auswahltext.                                                                                               |
| `openclaw.channel.configuredState`                                 | Leichte Metadaten für einen Configured-State-Checker, der „existiert bereits eine nur per env konfigurierte Einrichtung?“ beantworten kann, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.channel.persistedAuthState`                              | Leichte Metadaten für einen Persisted-Auth-Checker, der „ist bereits irgendetwas eingeloggt?“ beantworten kann, ohne die vollständige Kanal-Laufzeit zu laden.                       |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`          | Installations-/Update-Hinweise für gebündelte und extern veröffentlichte Plugins.                                                                                                      |
| `openclaw.install.defaultChoice`                                   | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                       |
| `openclaw.install.minHostVersion`                                  | Minimal unterstützte OpenClaw-Host-Version, mit einem SemVer-Floor wie `>=2026.3.22`.                                                                                                  |
| `openclaw.install.expectedIntegrity`                               | Erwartete npm-dist-Integritätszeichenfolge wie `sha512-...`; Installations- und Update-Abläufe verifizieren das geladene Artefakt dagegen.                                           |
| `openclaw.install.allowInvalidConfigRecovery`                      | Erlaubt einen engen Wiederherstellungspfad per Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`  | Erlaubt das Laden von Kanaloberflächen nur für Setup vor dem vollständigen Kanal-Plugin während des Starts.                                                                            |

Manifest-Metadaten entscheiden, welche Provider-/Kanal-/Setup-Auswahlen im
Onboarding erscheinen, bevor die Laufzeit geladen wird. `package.json#openclaw.install` teilt
dem Onboarding mit, wie dieses Plugin geladen oder aktiviert werden soll, wenn der Benutzer
eine dieser Auswahlmöglichkeiten trifft. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-
Registry durchgesetzt. Ungültige Werte werden abgewiesen; neuere, aber gültige Werte überspringen
das Plugin auf älteren Hosts.

Exaktes Pinnen von npm-Versionen lebt bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Kombinieren Sie das mit
`expectedIntegrity`, wenn Update-Abläufe fail-closed fehlschlagen sollen, falls das geladene
npm-Artefakt nicht mehr zur gepinnten Release-Version passt. Interaktives Onboarding
bietet vertrauenswürdige npm-Spezifikationen aus der Registry an, einschließlich einfacher Paketnamen und Dist-Tags.
Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Abläufe dies; wenn es
weggelassen wird, wird die Registry-Auflösung ohne Integritäts-Pin protokolliert.

Kanal-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Kanalliste
oder SecretRef-Scans konfigurierte Konten erkennen müssen, ohne die vollständige
Laufzeit zu laden. Der Setup-Entry-Point sollte Kanalmetadaten sowie setupsichere Config-,
Status- und Secrets-Adapter bereitstellen; behalten Sie Netzwerk-Clients, Gateway-Listener und
Transport-Laufzeiten im Entry-Point der Haupterweiterung.

Felder für Laufzeit-Entry-Points überschreiben die Package-Boundary-Prüfungen für Source-
Entry-Point-Felder nicht. Zum Beispiel kann `openclaw.runtimeExtensions` einen ausbrechenden
Pfad in `openclaw.extensions` nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es
macht nicht beliebige kaputte Konfigurationen installierbar. Heute erlaubt es nur
Installationsabläufen, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, wie einem
fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten `channels.<id>`-Eintrag für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und schicken Operatoren
zu `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein kleines Checker-
Modul:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Verwenden Sie dies, wenn Setup-, Doctor- oder Configured-State-Abläufe eine günstige Ja/Nein-
Auth-Probe benötigen, bevor das vollständige Kanal-Plugin geladen wird. Das Ziel-Export sollte eine kleine
Funktion sein, die nur persistierten Zustand liest; leiten Sie es nicht über den vollständigen
Barrel der Kanal-Laufzeit.

`openclaw.channel.configuredState` folgt derselben Form für günstige Configured-State-
Prüfungen nur per env:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Verwenden Sie dies, wenn ein Kanal den konfigurierten Zustand aus env oder anderen kleinen
Nicht-Laufzeit-Eingaben beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung oder die echte
Kanal-Laufzeit benötigt, behalten Sie diese Logik stattdessen im Hook `config.hasConfiguredState` des Plugins.

## Vorrang bei Discovery (doppelte Plugin-IDs)

OpenClaw erkennt Plugins aus mehreren Roots (gebündelt, global installiert, Workspace, explizit per Konfiguration ausgewählte Pfade). Wenn zwei Funde dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Priorität** beibehalten; Duplikate mit niedrigerer Priorität werden verworfen, statt parallel dazu geladen zu werden.

Priorität, von hoch nach niedrig:

1. **Per Konfiguration ausgewählt** — ein Pfad, der explizit in `plugins.entries.<id>` fixiert ist
2. **Gebündelt** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Global installiert** — Plugins, die in den globalen OpenClaw-Plugin-Root installiert sind
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace erkannt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich durch ein lokales zu überschreiben, fixieren Sie es über `plugins.entries.<id>`, damit es durch Priorität gewinnt, statt sich auf Workspace-Discovery zu verlassen.
- Verworfene Duplikate werden protokolliert, sodass Doctor und Startdiagnosen auf die verworfene Kopie hinweisen können.

## Anforderungen an JSON-Schema

- **Jedes Plugin muss ein JSON-Schema mitliefern**, selbst wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte Schlüssel in `channels.*` sind **Fehler**, sofern die Kanal-ID nicht von
  einem Plugin-Manifest deklariert wird.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **erkennbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein kaputtes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  eine **Warnung** wird in Doctor + Logs angezeigt.

Siehe [Configuration reference](/de/gateway/configuration) für das vollständige Schema `plugins.*`.

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladungen. Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der Discovery + Validierung.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, nachgestellte Kommata und unquotierte Schlüssel zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifest-Felder werden vom Manifest-Loader gelesen. Vermeiden Sie benutzerdefinierte Top-Level-Schlüssel.
- `channels`, `providers`, `cliBackends` und `skills` können alle weggelassen werden, wenn ein Plugin sie nicht benötigt.
- `providerDiscoveryEntry` muss leichtgewichtig bleiben und sollte keinen breiten Laufzeitcode importieren; verwenden Sie ihn für statische Provider-Katalogmetadaten oder schmale Discovery-Beschreibungen, nicht für Ausführung zur Request-Zeit.
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt: `kind: "memory"` über `plugins.slots.memory`, `kind: "context-engine"` über `plugins.slots.contextEngine` (Standard `legacy`).
- Metadaten zu Umgebungsvariablen (`providerAuthEnvVars`, `channelEnvVars`) sind nur deklarativ. Status-, Audit-, Validierung von Cron-Zustellung und andere schreibgeschützte Oberflächen wenden weiterhin Plugin-Vertrauen und effektive Aktivierungsrichtlinien an, bevor eine Umgebungsvariable als konfiguriert behandelt wird.
- Für Laufzeit-Wizard-Metadaten, die Provider-Code benötigen, siehe [Provider runtime hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle Anforderungen an die Allowlist des Paketmanagers (zum Beispiel pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Verwandt

<CardGroup cols={3}>
  <Card title="Plugins bauen" href="/de/plugins/building-plugins" icon="rocket">
    Einstieg in Plugins.
  </Card>
  <Card title="Plugin-Architektur" href="/de/plugins/architecture" icon="diagram-project">
    Interne Architektur und Fähigkeitsmodell.
  </Card>
  <Card title="SDK-Überblick" href="/de/plugins/sdk-overview" icon="book">
    Referenz zum Plugin-SDK und Imports über Unterpfade.
  </Card>
</CardGroup>
