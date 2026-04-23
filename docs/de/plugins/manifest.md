---
read_when:
    - Sie entwickeln ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema bereitstellen oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest + Anforderungen an das JSON-Schema (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-23T14:03:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (`openclaw.plugin.json`)

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Für kompatible Bundle-Layouts siehe [Plugin bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das Standard-Layout für Claude-Komponenten
  ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, aber sie werden nicht
gegen das hier beschriebene Schema von `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten plus deklarierte
Skill-Roots, Claude-Command-Roots, Standardwerte aus `settings.json` von Claude-Bundles,
Standardwerte für Claude-Bundle-LSP und unterstützte Hook-Packs, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** enthalten. OpenClaw verwendet dieses Manifest, um die Konfiguration
**ohne Ausführen von Plugin-Code** zu validieren. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Siehe die vollständige Anleitung zum Plugin-System: [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und den aktuellen Hinweisen zur externen Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei tut

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor Ihr
Plugin-Code geladen wird.

Verwenden Sie sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Authentifizierungs- und Onboarding-Metadaten, die verfügbar sein sollen, ohne die Plugin-
  Laufzeit zu starten
- kostengünstige Aktivierungshinweise, die Control-Plane-Oberflächen vor dem Laden der Laufzeit prüfen können
- kostengünstige Setup-Deskriptoren, die Setup-/Onboarding-Oberflächen vor dem Laden der Laufzeit prüfen können
- Alias- und Auto-Enable-Metadaten, die vor dem Laden der Plugin-Laufzeit aufgelöst werden sollen
- Kurzmetadaten zur Eigentümerschaft von Modellfamilien, die das
  Plugin vor dem Laden der Laufzeit automatisch aktivieren sollen
- statische Snapshots der Fähigkeits-Eigentümerschaft, die für gebündelte Compat-Verdrahtung und
  Vertragsabdeckung verwendet werden
- kostengünstige QA-Runner-Metadaten, die der gemeinsame Host `openclaw qa` vor dem Laden der Plugin-Laufzeit prüfen kann
- channelspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen eingefügt werden sollen, ohne die Laufzeit zu laden
- Hinweise für die Konfigurations-UI

Nicht verwenden für:

- Registrierung von Laufzeitverhalten
- Deklaration von Code-Entrypoints
- npm-Installationsmetadaten

Diese gehören in Ihren Plugin-Code und in `package.json`.

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

## Umfangreiches Beispiel

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter-Provider-Plugin",
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
      "choiceLabel": "OpenRouter-API-Schlüssel",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter-API-Schlüssel",
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
| `id`                                 | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                                             |
| `configSchema`                       | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                                          |
| `enabledByDefault`                   | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg oder setzen Sie einen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.                                                     |
| `legacyPluginIds`                    | Nein         | `string[]`                       | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modell-Referenzen sie erwähnen.                                                                                        |
| `kind`                               | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                                                   |
| `channels`                           | Nein         | `string[]`                       | Channel-IDs, die diesem Plugin gehören. Wird für Discovery und Konfigurationsvalidierung verwendet.                                                                                                                               |
| `providers`                          | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                                          |
| `modelSupport`                       | Nein         | `object`                         | Dem Manifest gehörende Kurzmetadaten zu Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                                               |
| `providerEndpoints`                  | Nein         | `object[]`                       | Dem Manifest gehörende Metadaten zu Endpoint-Host/BaseUrl für Provider-Routen, die der Kern klassifizieren muss, bevor die Provider-Laufzeit geladen wird.                                                                        |
| `cliBackends`                        | Nein         | `string[]`                       | IDs von CLI-Inference-Backends, die diesem Plugin gehören. Werden für die automatische Aktivierung beim Start aus expliziten Konfigurationsreferenzen verwendet.                                                                  |
| `syntheticAuthRefs`                  | Nein         | `string[]`                       | Provider- oder CLI-Backend-Referenzen, deren plugin-eigener synthetischer Auth-Hook während der Cold-Model-Discovery geprüft werden soll, bevor die Laufzeit geladen wird.                                                        |
| `nonSecretAuthMarkers`               | Nein         | `string[]`                       | Platzhalter-API-Schlüsselwerte, die gebündelten Plugins gehören und nicht geheime lokale, OAuth- oder Ambient-Credential-Status darstellen.                                                                                       |
| `commandAliases`                     | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit pluginbewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                                          |
| `providerAuthEnvVars`                | Nein         | `Record<string, string[]>`       | Kostengünstige Env-Metadaten für Provider-Authentifizierung, die OpenClaw prüfen kann, ohne Plugin-Code zu laden.                                                                                                                |
| `providerAuthAliases`                | Nein         | `Record<string, string>`         | Provider-IDs, die für die Authentifizierung eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider verwendet.            |
| `channelEnvVars`                     | Nein         | `Record<string, string[]>`       | Kostengünstige Channel-Env-Metadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuerte Channel-Einrichtung oder Auth-Oberflächen, die generische Startup-/Konfigurationshelfer sehen sollen. |
| `providerAuthChoices`                | Nein         | `object[]`                       | Kostengünstige Metadaten für Auth-Auswahlmöglichkeiten für Onboarding-Picker, Preferred-Provider-Auflösung und einfache CLI-Flag-Verdrahtung.                                                                                    |
| `activation`                         | Nein         | `object`                         | Kostengünstige Aktivierungshinweise für provider-, befehls-, channel-, routen- und fähigkeitsgetriggertes Laden. Nur Metadaten; die tatsächliche Logik bleibt in der Plugin-Laufzeit.                                            |
| `setup`                              | Nein         | `object`                         | Kostengünstige Setup-/Onboarding-Deskriptoren, die Discovery- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                                           |
| `qaRunners`                          | Nein         | `object[]`                       | Kostengünstige QA-Runner-Deskriptoren, die der gemeinsame Host `openclaw qa` vor dem Laden der Plugin-Laufzeit verwendet.                                                                                                        |
| `contracts`                          | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeiten für externe Auth-Hooks, Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Eigentümerschaft. |
| `mediaUnderstandingProviderMetadata` | Nein         | `Record<string, object>`         | Kostengünstige Standardwerte für Medienverständnis für Provider-IDs, die in `contracts.mediaUnderstandingProviders` deklariert sind.                                                                                              |
| `channelConfigs`                     | Nein         | `Record<string, object>`         | Dem Manifest gehörende Channel-Konfigurationsmetadaten, die vor dem Laden der Laufzeit in Discovery- und Validierungsoberflächen zusammengeführt werden.                                                                          |
| `skills`                             | Nein         | `string[]`                       | Zu ladende Skills-Verzeichnisse, relativ zum Plugin-Root.                                                                                                                                                                          |
| `name`                               | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                                     |
| `description`                        | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                                                  |
| `version`                            | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                                       |
| `uiHints`                            | Nein         | `Record<string, object>`         | UI-Labels, Platzhalter und Sensitivitätshinweise für Konfigurationsfelder.                                                                                                                                                        |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                      |
| --------------------- | ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                                      |
| `method`              | Ja           | `string`                                        | ID der Authentifizierungsmethode, an die weitergeleitet wird.                                                  |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Auswahl-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                                 |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerorientiertes Label. Wenn nicht gesetzt, fällt OpenClaw auf `choiceId` zurück.                         |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für den Picker.                                                                               |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Pickern früher sortiert.                       |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistant-Pickern aus, erlaubt aber weiterhin die manuelle Auswahl über CLI.           |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Veraltete Auswahl-IDs, die Benutzer auf diese Ersatz-Auswahl umleiten sollen.                                 |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren zusammengehöriger Auswahlmöglichkeiten.                                    |
| `groupLabel`          | Nein         | `string`                                        | Benutzerorientiertes Label für diese Gruppe.                                                                   |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                               |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit nur einem Flag.                                        |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, zum Beispiel `--openrouter-api-key`.                                                       |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, zum Beispiel `--openrouter-api-key <key>`.                                  |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung für die CLI-Hilfe.                                                                                |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn nicht gesetzt, ist der Standard `["text-inference"]`. |

## Referenz für `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen besitzt, den Benutzer
möglicherweise irrtümlich in `plugins.allow` eintragen oder als Root-CLI-Befehl ausführen wollen. OpenClaw
verwendet diese Metadaten für Diagnosen, ohne Code aus der Plugin-Laufzeit zu importieren.

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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                    |
| ------------ | ------------ | ----------------- | ---------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                    |
| `kind`       | Nein         | `"runtime-slash"` | Kennzeichnet den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.      |
| `cliCommand` | Nein         | `string`          | Zugehöriger Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen werden kann, falls vorhanden. |

## Referenz für `activation`

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, durch welche Control-Plane-Events
es später aktiviert werden soll.

## Referenz für `qaRunners`

Verwenden Sie `qaRunners`, wenn ein Plugin einen oder mehrere Transport-Runner unterhalb des
gemeinsamen Roots `openclaw qa` beisteuert. Halten Sie diese Metadaten kostengünstig und statisch; die Plugin-
Laufzeit ist weiterhin für die tatsächliche CLI-Registrierung über eine leichtgewichtige
Oberfläche `runtime-api.ts` verantwortlich, die `qaRunnerCliRegistrations` exportiert.

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

| Feld          | Erforderlich | Typ      | Bedeutung                                                                 |
| ------------- | ------------ | -------- | ------------------------------------------------------------------------- |
| `commandName` | Ja           | `string` | Unterbefehl unter `openclaw qa`, zum Beispiel `matrix`.                   |
| `description` | Nein         | `string` | Fallback-Hilfetext, der verwendet wird, wenn der gemeinsame Host einen Stub-Befehl benötigt. |

Dieser Block besteht nur aus Metadaten. Er registriert kein Laufzeitverhalten und
ersetzt weder `register(...)`, `setupEntry` noch andere Laufzeit-/Plugin-Entrypoints.
Aktuelle Consumer verwenden ihn als Eingrenzungshinweis vor umfassenderem Laden von Plugins, daher
kosten fehlende Aktivierungsmetadaten in der Regel nur Performance; sie sollten die Korrektheit nicht
ändern, solange veraltete Fallbacks für die Eigentümerschaft im Manifest noch existieren.

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

| Feld             | Erforderlich | Typ                                                  | Bedeutung                                                            |
| ---------------- | ------------ | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `onProviders`    | Nein         | `string[]`                                           | Provider-IDs, die dieses Plugin aktivieren sollen, wenn sie angefordert werden. |
| `onCommands`     | Nein         | `string[]`                                           | Befehls-IDs, die dieses Plugin aktivieren sollen.                    |
| `onChannels`     | Nein         | `string[]`                                           | Channel-IDs, die dieses Plugin aktivieren sollen.                    |
| `onRoutes`       | Nein         | `string[]`                                           | Arten von Routen, die dieses Plugin aktivieren sollen.               |
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Capability-Hinweise, die bei der Aktivierungsplanung der Control Plane verwendet werden. |

Aktuelle Live-Consumer:

- CLI-Planung, die durch Befehle ausgelöst wird, fällt zurück auf die veralteten
  `commandAliases[].cliCommand` oder `commandAliases[].name`
- setup-/channelbezogene Planung, die durch Channels ausgelöst wird, fällt zurück auf die veraltete Eigentümerschaft in `channels[]`, wenn explizite Channel-Aktivierungsmetadaten fehlen
- setup-/laufzeitbezogene Planung, die durch Provider ausgelöst wird, fällt zurück auf die veraltete
  Eigentümerschaft in `providers[]` und auf Top-Level-`cliBackends[]`, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

## Referenz für `setup`

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen kostengünstige plugin-eigene Metadaten
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

Top-Level-`cliBackends` bleibt gültig und beschreibt weiterhin CLI-Inference-
Backends. `setup.cliBackends` ist die setup-spezifische Deskriptor-Oberfläche für
Control-Plane-/Setup-Abläufe, die rein metadatenbasiert bleiben sollen.

Wenn vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
deskriptororientierte Lookup-Oberfläche für Setup-Discovery. Wenn der Deskriptor das Kandidaten-
Plugin nur eingrenzt und das Setup trotzdem umfangreichere setupzeitbezogene Laufzeit-Hooks
benötigt, setzen Sie `requiresRuntime: true` und behalten `setup-api` als
Fallback-Ausführungspfad bei.

Da das Setup-Lookup plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte
Werte von `setup.providers[].id` und `setup.cliBackends[]` unter allen entdeckten Plugins eindeutig bleiben.
Mehrdeutige Eigentümerschaft wird fail-closed behandelt, statt anhand der Discovery-Reihenfolge einen Gewinner zu wählen.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                                  |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding bereitgestellt wird. Normalisierte IDs global eindeutig halten. |
| `authMethods` | Nein         | `string[]` | IDs von Setup-/Authentifizierungsmethoden, die dieser Provider ohne Laden der vollständigen Laufzeit unterstützt. |
| `envVars`     | Nein         | `string[]` | Umgebungsvariablen, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                              |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding bereitgestellt werden.                   |
| `cliBackends`      | Nein         | `string[]` | Setupzeitige Backend-IDs für deskriptororientiertes Setup-Lookup. Normalisierte IDs global eindeutig halten. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die zur Setup-Oberfläche dieses Plugins gehören.                    |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach dem Deskriptor-Lookup weiterhin `setup-api`-Ausführung benötigt.                     |

## Referenz für `uiHints`

`uiHints` ist eine Zuordnung von Namen von Konfigurationsfeldern zu kleinen Rendering-Hinweisen.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Jeder Feldhinweis kann Folgendes enthalten:

| Feld          | Typ        | Bedeutung                                |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Benutzerorientiertes Feldlabel.          |
| `help`        | `string`   | Kurzer Hilfetext.                        |
| `tags`        | `string[]` | Optionale UI-Tags.                       |
| `advanced`    | `boolean`  | Kennzeichnet das Feld als erweitert.     |
| `sensitive`   | `boolean`  | Kennzeichnet das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.    |

## Referenz für `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Eigentümerschaft von Fähigkeiten, die OpenClaw
lesen kann, ohne die Plugin-Laufzeit zu importieren.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
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

| Feld                             | Typ        | Bedeutung                                                                |
| -------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | IDs eingebetteter Laufzeiten, für die ein gebündeltes Plugin Factories registrieren kann. |
| `externalAuthProviders`          | `string[]` | Provider-IDs, deren Hook für externe Auth-Profile diesem Plugin gehört.  |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                          |
| `realtimeTranscriptionProviders` | `string[]` | Provider-IDs für Echtzeit-Transkription, die diesem Plugin gehören.      |
| `realtimeVoiceProviders`         | `string[]` | Provider-IDs für Echtzeit-Stimme, die diesem Plugin gehören.             |
| `mediaUnderstandingProviders`    | `string[]` | Provider-IDs für Medienverständnis, die diesem Plugin gehören.           |
| `imageGenerationProviders`       | `string[]` | Provider-IDs für Bildgenerierung, die diesem Plugin gehören.             |
| `videoGenerationProviders`       | `string[]` | Provider-IDs für Videogenerierung, die diesem Plugin gehören.            |
| `webFetchProviders`              | `string[]` | Provider-IDs für Web-Fetch, die diesem Plugin gehören.                   |
| `webSearchProviders`             | `string[]` | Provider-IDs für Websuche, die diesem Plugin gehören.                    |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für gebündelte Vertragsprüfungen gehören. |

Provider-Plugins, die `resolveExternalAuthProfiles` implementieren, sollten
`contracts.externalAuthProviders` deklarieren. Plugins ohne diese Deklaration laufen weiterhin
über einen veralteten Kompatibilitäts-Fallback, aber dieser Fallback ist langsamer und
wird nach dem Migrationsfenster entfernt.

## Referenz für `mediaUnderstandingProviderMetadata`

Verwenden Sie `mediaUnderstandingProviderMetadata`, wenn ein Provider für Medienverständnis
Standardmodelle, Auto-Auth-Fallback-Priorität oder native Dokumentunterstützung hat, die
generische Kern-Helfer benötigen, bevor die Laufzeit geladen wird. Schlüssel müssen zusätzlich in
`contracts.mediaUnderstandingProviders` deklariert sein.

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

Jeder Provider-Eintrag kann Folgendes enthalten:

| Feld                   | Typ                                 | Bedeutung                                                                    |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Medien-Fähigkeiten, die dieser Provider bereitstellt.                        |
| `defaultModels`        | `Record<string, string>`            | Standardzuordnung von Fähigkeit zu Modell, wenn in der Konfiguration kein Modell angegeben ist. |
| `autoPriority`         | `Record<string, number>`            | Niedrigere Zahlen werden bei automatischem credentialbasiertem Provider-Fallback früher sortiert. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Native Dokumenteingaben, die vom Provider unterstützt werden.                |

## Referenz für `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Channel-Plugin kostengünstige Konfigurationsmetadaten benötigt, bevor
die Laufzeit geladen wird.

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
      "description": "Verbindung zum Matrix-Homeserver",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Jeder Channel-Eintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Erforderlich für jeden deklarierten Channel-Konfigurationseintrag. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Labels/Platzhalter/Sensitivitätshinweise für diesen Channel-Konfigurationsabschnitt. |
| `label`       | `string`                 | Channel-Label, das in Picker- und Inspect-Oberflächen zusammengeführt wird, wenn Laufzeit-Metadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Channel-Beschreibung für Inspect- und Katalog-Oberflächen.                          |
| `preferOver`  | `string[]`               | Veraltete oder niedriger priorisierte Plugin-IDs, die dieser Channel in Auswahlsurfaces übertreffen soll. |

## Referenz für `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus
Kurzform-Modell-IDs wie `gpt-5.4` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit
geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw verwendet diese Priorität:

- Explizite `provider/model`-Referenzen verwenden die Metadaten des zugehörigen `providers`-Manifests
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- Wenn sowohl ein nicht gebündeltes Plugin als auch ein gebündeltes Plugin übereinstimmen, gewinnt das nicht gebündelte Plugin
- Verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                       |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` mit Kurzform-Modell-IDs abgeglichen werden.       |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen des Profil-Suffixes mit Kurzform-Modell-IDs abgeglichen werden. |

Veraltete Top-Level-Capability-Schlüssel sind deprecated. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; das normale
Laden des Manifests behandelt diese Top-Level-Felder nicht mehr als Eigentümerschaft von Capabilities.

## Manifest versus `package.json`

Die beiden Dateien haben unterschiedliche Aufgaben:

| Datei                  | Verwenden für                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Metadaten für Auth-Auswahl und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code läuft |
| `package.json`         | npm-Metadaten, Installieren von Abhängigkeiten und den `openclaw`-Block, der für Entrypoints, Install-Gating, Setup oder Katalog-Metadaten verwendet wird |

Wenn Sie sich nicht sicher sind, wohin ein Metadatum gehört, verwenden Sie diese Regel:

- Wenn OpenClaw es vor dem Laden des Plugin-Codes kennen muss, gehört es in `openclaw.plugin.json`
- Wenn es um Packaging, Entry-Dateien oder das npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die Discovery beeinflussen

Einige Plugin-Metadaten für die Zeit vor der Laufzeit liegen absichtlich in `package.json` unter dem
Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                              | Deklariert native Plugin-Entrypoints. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                                                        |
| `openclaw.runtimeExtensions`                                       | Deklariert gebaute JavaScript-Laufzeit-Entrypoints für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                 |
| `openclaw.setupEntry`                                              | Leichtgewichtiger, nur für Setup vorgesehener Entrypoint, der bei Onboarding, verzögertem Channel-Startup und schreibgeschützter Discovery von Channel-Status/SecretRefs verwendet wird. Muss innerhalb des Plugin-Paketverzeichnisses bleiben. |
| `openclaw.runtimeSetupEntry`                                       | Deklariert den gebauten JavaScript-Setup-Entrypoint für installierte Pakete. Muss innerhalb des Plugin-Paketverzeichnisses bleiben.                                                |
| `openclaw.channel`                                                 | Kostengünstige Katalogmetadaten für Channels wie Labels, Doku-Pfade, Aliasse und Auswahltexte.                                                                                     |
| `openclaw.channel.configuredState`                                 | Leichtgewichtige Metadaten für einen Configured-State-Checker, der beantworten kann: „Existiert env-only-Setup bereits?“ ohne die vollständige Channel-Laufzeit zu laden.          |
| `openclaw.channel.persistedAuthState`                              | Leichtgewichtige Metadaten für einen Persisted-Auth-Checker, der beantworten kann: „Ist bereits irgendwo eine Anmeldung vorhanden?“ ohne die vollständige Channel-Laufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`          | Hinweise für Installation/Aktualisierung gebündelter und extern veröffentlichter Plugins.                                                                                           |
| `openclaw.install.defaultChoice`                                   | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                                                                    |
| `openclaw.install.minHostVersion`                                  | Minimal unterstützte OpenClaw-Host-Version mit einem Semver-Minimum wie `>=2026.3.22`.                                                                                              |
| `openclaw.install.expectedIntegrity`                               | Erwartete npm-dist-Integritätszeichenfolge wie `sha512-...`; Installations- und Update-Abläufe prüfen das geladene Artefakt dagegen.                                               |
| `openclaw.install.allowInvalidConfigRecovery`                      | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`  | Erlaubt das Laden von nur-für-Setup gedachten Channel-Oberflächen vor dem vollständigen Channel-Plugin beim Start.                                                                  |

Manifest-Metadaten entscheiden, welche Provider-/Channel-/Setup-Auswahlen im
Onboarding erscheinen, bevor die Laufzeit geladen wird. `package.json#openclaw.install` teilt
dem Onboarding mit, wie dieses Plugin abgerufen oder aktiviert werden soll, wenn der Benutzer eine dieser
Auswahlen trifft. Verschieben Sie Installationshinweise nicht nach `openclaw.plugin.json`.

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-
Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das
Plugin auf älteren Hosts.

Exaktes Pinning von npm-Versionen liegt bereits in `npmSpec`, zum Beispiel
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Kombinieren Sie dies mit
`expectedIntegrity`, wenn Update-Abläufe fail-closed sein sollen, falls das geladene
npm-Artefakt nicht mehr zum gepinnten Release passt. Interaktives Onboarding
bietet vertrauenswürdige Registry-npm-Specs an, einschließlich nackter Paketnamen und Dist-Tags.
Wenn `expectedIntegrity` vorhanden ist, erzwingen Installations-/Update-Abläufe diese Prüfung; wenn es
fehlt, wird die Registry-Auflösung ohne Integrity-Pin protokolliert.

Channel-Plugins sollten `openclaw.setupEntry` bereitstellen, wenn Status, Channel-Liste
oder SecretRef-Scans konfigurierte Konten identifizieren müssen, ohne die vollständige
Laufzeit zu laden. Der Setup-Entrypoint sollte Channel-Metadaten plus setup-sichere Adapter für Konfiguration,
Status und Secrets bereitstellen; Netzwerk-Clients, Gateway-Listener und
Transport-Laufzeiten gehören in den Haupt-Extension-Entrypoint.

Laufzeit-Entrypoint-Felder überschreiben keine Package-Boundary-Prüfungen für
Quell-Entrypoint-Felder. Zum Beispiel kann `openclaw.runtimeExtensions` einen
Pfad aus `openclaw.extensions`, der aus dem Paket ausbricht, nicht ladbar machen.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es
macht nicht beliebige defekte Konfigurationen installierbar. Derzeit erlaubt es nur Installationsabläufen,
sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen, zum Beispiel von einem
fehlenden Pfad für ein gebündeltes Plugin oder einem veralteten `channels.<id>`-Eintrag für genau dieses
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die Installation und schicken Operatoren zu `openclaw doctor --fix`.

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

Verwenden Sie es, wenn Setup-, Doctor- oder Configured-State-Abläufe einen kostengünstigen Ja/Nein-
Auth-Probe benötigen, bevor das vollständige Channel-Plugin geladen wird. Das Ziel-Export sollte eine kleine
Funktion sein, die nur persistierten Status liest; leiten Sie es nicht über das vollständige
Barrel der Channel-Laufzeit.

`openclaw.channel.configuredState` folgt derselben Form für kostengünstige env-only-
Configured-Checks:

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

Verwenden Sie es, wenn ein Channel den konfigurierten Status aus Env oder anderen kleinen
Nicht-Laufzeit-Eingaben beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung oder die echte
Channel-Laufzeit benötigt, belassen Sie diese Logik stattdessen im Hook `config.hasConfiguredState` des Plugins.

## Discovery-Priorität (doppelte Plugin-IDs)

OpenClaw entdeckt Plugins aus mehreren Roots (gebündelt, global installiert, Workspace, explizit in der Konfiguration ausgewählte Pfade). Wenn zwei Discoveries dieselbe `id` teilen, wird nur das Manifest mit der **höchsten Priorität** beibehalten; Duplikate mit niedrigerer Priorität werden verworfen, statt parallel geladen zu werden.

Priorität, von hoch nach niedrig:

1. **Config-selected** — ein Pfad, der explizit in `plugins.entries.<id>` festgelegt ist
2. **Bundled** — Plugins, die mit OpenClaw ausgeliefert werden
3. **Global install** — Plugins, die im globalen OpenClaw-Plugin-Root installiert sind
4. **Workspace** — Plugins, die relativ zum aktuellen Workspace entdeckt werden

Auswirkungen:

- Eine geforkte oder veraltete Kopie eines gebündelten Plugins im Workspace überschattet den gebündelten Build nicht.
- Um ein gebündeltes Plugin tatsächlich mit einem lokalen Plugin zu überschreiben, pinnen Sie es über `plugins.entries.<id>`, damit es über die Priorität gewinnt, statt sich auf Workspace-Discovery zu verlassen.
- Verworfene Duplikate werden protokolliert, sodass Doctor und Startdiagnosen auf die verworfene Kopie verweisen können.

## Anforderungen an JSON Schema

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte Schlüssel unter `channels.*` sind **Fehler**, außer die Channel-ID wird von
  einem Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **entdeckbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  eine **Warnung** wird in Doctor + Logs angezeigt.

Siehe [Configuration reference](/de/gateway/configuration) für das vollständige Schema von `plugins.*`.

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge.
- Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur für
  Discovery + Validierung.
- Native Manifeste werden mit JSON5 geparst, daher werden Kommentare, nachgestellte Kommata und
  nicht zitierte Schlüssel akzeptiert, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifest-Felder werden vom Manifest-Loader gelesen. Vermeiden Sie es,
  hier benutzerdefinierte Top-Level-Schlüssel hinzuzufügen.
- `providerAuthEnvVars` ist der kostengünstige Metadatenpfad für Auth-Probes, Validierung von Env-Markern
  und ähnliche Oberflächen für Provider-Authentifizierung, die die Plugin-Laufzeit nicht starten sollen,
  nur um Env-Namen zu prüfen.
- `providerAuthAliases` erlaubt es Provider-Varianten, die Auth-
  Env-Variablen, Auth-Profile, konfigurationsgestützte Authentifizierung und die Onboarding-Auswahl für API-Schlüssel eines anderen Providers wiederzuverwenden,
  ohne diese Beziehung im Kern hart zu kodieren.
- `providerEndpoints` ermöglicht es Provider-Plugins, einfache Metadaten zum Abgleichen von Endpoint-Host/BaseUrl zu besitzen. Verwenden Sie dies nur für Endpoint-Klassen, die der Kern bereits unterstützt;
  das Plugin bleibt weiterhin Eigentümer des Laufzeitverhaltens.
- `syntheticAuthRefs` ist der kostengünstige Metadatenpfad für plugin-eigene synthetische
  Auth-Hooks, die für die Cold-Model-Discovery sichtbar sein müssen, bevor die Laufzeit-Registry existiert.
  Listen Sie nur Referenzen auf, deren Laufzeit-Provider oder CLI-Backend tatsächlich
  `resolveSyntheticAuth` implementiert.
- `nonSecretAuthMarkers` ist der kostengünstige Metadatenpfad für Platzhalter-API-Schlüssel
  gebündelter Plugins, etwa für lokale, OAuth- oder Ambient-Credential-Marker.
  Der Kern behandelt diese für die Anzeige von Authentifizierung und Secret-Audits als nicht geheim, ohne den zugehörigen Provider hart zu kodieren.
- `channelEnvVars` ist der kostengünstige Metadatenpfad für Shell-Env-Fallback, Setup-
  Prompts und ähnliche Channel-Oberflächen, die die Plugin-Laufzeit nicht starten sollen,
  nur um Env-Namen zu prüfen. Env-Namen sind Metadaten, nicht selbst Aktivierung: Status, Audit, Validierung der Cron-Zustellung und andere schreibgeschützte
  Oberflächen wenden weiterhin Plugin-Vertrauen und effektive Aktivierungs-Policy an, bevor sie eine Env-Variable als konfigurierten Channel behandeln.
- `providerAuthChoices` ist der kostengünstige Metadatenpfad für Auth-Auswahl-Picker,
  `--auth-choice`-Auflösung, Preferred-Provider-Mapping und einfache Registrierung von Onboarding-
  CLI-Flags, bevor die Provider-Laufzeit geladen wird. Zu Laufzeit-Assistenten-Metadaten, die Provider-Code erfordern, siehe
  [Provider runtime hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird durch `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird durch `plugins.slots.contextEngine`
    ausgewählt (Standard: integriertes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein
  Plugin sie nicht benötigt.
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle
  Anforderungen an die Allowlist des Paketmanagers (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandt

- [Building Plugins](/de/plugins/building-plugins) — Erste Schritte mit Plugins
- [Plugin Architecture](/de/plugins/architecture) — interne Architektur
- [SDK Overview](/de/plugins/sdk-overview) — Referenz für Plugin SDK
