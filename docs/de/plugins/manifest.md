---
read_when:
    - Sie erstellen ein OpenClaw Plugin
    - Sie müssen ein Plugin-Konfigurationsschema bereitstellen oder Plugin-Validierungsfehler debuggen
summary: Plugin-Manifest- und JSON-Schema-Anforderungen (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-12T23:28:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b57c7373e4ccd521b10945346db67991543bd2bed4cc8b6641e1f215b48579
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (`openclaw.plugin.json`)

Diese Seite gilt nur für das **native OpenClaw Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponenten-
  Layout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch
nicht gegen das hier beschriebene Schema für `openclaw.plugin.json` validiert.

Bei kompatiblen Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte
Skill-Roots, Claude-Befehls-Roots, Standardwerte aus `settings.json` für Claude-Bundles,
Claude-Bundle-LSP-Standards und unterstützte Hook-Packs, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw Plugin **muss** eine Datei `openclaw.plugin.json` im
**Plugin-Root** enthalten. OpenClaw verwendet dieses Manifest, um die Konfiguration
zu validieren, **ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste
werden als Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Den vollständigen Leitfaden zum Plugin-System finden Sie unter: [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und zur aktuellen Anleitung für externe Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor Ihr
Plugin-Code geladen wird.

Verwenden Sie sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Auth- und Onboarding-Metadaten, die verfügbar sein sollen, ohne die Plugin-
  Laufzeit zu starten
- günstige Aktivierungshinweise, die Control-Plane-Oberflächen vor dem Laden der Laufzeit prüfen können
- günstige Setup-Deskriptoren, die Setup-/Onboarding-Oberflächen vor dem Laden der Laufzeit prüfen können
- Alias- und Auto-Enable-Metadaten, die vor dem Laden der Plugin-Laufzeit aufgelöst werden sollen
- verkürzte Besitz-Metadaten für Modellfamilien, die das Plugin vor dem Laden der Laufzeit automatisch aktivieren sollen
- statische Snapshots der Capability-Zuständigkeit, die für gebündelte Compat-Verdrahtung und Vertragsabdeckung verwendet werden
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden sollen, ohne die Laufzeit zu laden
- Konfigurations-UI-Hinweise

Verwenden Sie sie nicht für:

- das Registrieren von Laufzeitverhalten
- das Deklarieren von Code-Entrypoints
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
  "cliBackends": ["openrouter-cli"],
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

| Feld                                | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                    |
| ----------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                        |
| `configSchema`                      | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                     |
| `enabledByDefault`                  | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie das Feld weg oder setzen Sie einen anderen Wert als `true`, damit das Plugin standardmäßig deaktiviert bleibt.                    |
| `legacyPluginIds`                   | Nein         | `string[]`                       | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                       |
| `autoEnableWhenConfiguredProviders` | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modell-Refs sie erwähnen.                                                                                      |
| `kind`                              | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                             |
| `channels`                          | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Wird für Discovery und Konfigurationsvalidierung verwendet.                                                                                                           |
| `providers`                         | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                                     |
| `modelSupport`                      | Nein         | `object`                         | Manifest-eigene Kurzform-Metadaten für Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                          |
| `cliBackends`                       | Nein         | `string[]`                       | CLI-Inference-Backend-IDs, die diesem Plugin gehören. Werden für die automatische Aktivierung beim Start aus expliziten Konfigurations-Refs verwendet.                                                     |
| `commandAliases`                    | Nein         | `object[]`                       | Befehlsnamen, die diesem Plugin gehören und vor dem Laden der Laufzeit Plugin-bewusste Konfigurations- und CLI-Diagnosen erzeugen sollen.                                                                  |
| `providerAuthEnvVars`               | Nein         | `Record<string, string[]>`       | Günstige Provider-Auth-Umgebungsmetadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden.                                                                                                             |
| `providerAuthAliases`               | Nein         | `Record<string, string>`         | Provider-IDs, die für die Auth-Suche eine andere Provider-ID wiederverwenden sollen, zum Beispiel ein Coding-Provider, der denselben API-Schlüssel und dieselben Auth-Profile wie der Basis-Provider teilt. |
| `channelEnvVars`                    | Nein         | `Record<string, string[]>`       | Günstige Kanal-Umgebungsmetadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuerte Kanal-Setup- oder Auth-Oberflächen, die generische Start-/Konfigurationshilfen sehen sollen. |
| `providerAuthChoices`               | Nein         | `object[]`                       | Günstige Metadaten zu Auth-Auswahlmöglichkeiten für Onboarding-Auswahlfelder, die Auflösung bevorzugter Provider und einfache CLI-Flag-Verdrahtung.                                                        |
| `activation`                        | Nein         | `object`                         | Günstige Aktivierungshinweise für durch Provider, Befehl, Kanal, Route und Capability ausgelöstes Laden. Nur Metadaten; die eigentliche Verhaltenslogik gehört weiterhin der Plugin-Laufzeit.            |
| `setup`                             | Nein         | `object`                         | Günstige Setup-/Onboarding-Deskriptoren, die Discovery- und Setup-Oberflächen prüfen können, ohne die Plugin-Laufzeit zu laden.                                                                            |
| `contracts`                         | Nein         | `object`                         | Statischer Snapshot gebündelter Capabilities für Sprache, Echtzeit-Transkription, Echtzeit-Stimme, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Fetch, Websuche und Tool-Besitz. |
| `channelConfigs`                    | Nein         | `Record<string, object>`         | Manifest-eigene Kanal-Konfigurationsmetadaten, die vor dem Laden der Laufzeit in Discovery- und Validierungsoberflächen zusammengeführt werden.                                                             |
| `skills`                            | Nein         | `string[]`                       | Skill-Verzeichnisse, die relativ zum Plugin-Root geladen werden sollen.                                                                                                                                      |
| `name`                              | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                |
| `description`                       | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                             |
| `version`                           | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                  |
| `uiHints`                           | Nein         | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Sensitivitätshinweise für Konfigurationsfelder.                                                                                                                          |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder
Auth-Auswahlmöglichkeit. OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                               |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Auswahl gehört.                                                               |
| `method`              | Ja           | `string`                                        | ID der Auth-Methode, an die weitergeleitet wird.                                                        |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Choice-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                           |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Bezeichnung. Wenn sie fehlt, verwendet OpenClaw als Fallback `choiceId`.               |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                       |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.              |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistenten-Auswahlen aus, erlaubt aber weiterhin die manuelle CLI-Auswahl.     |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Veraltete Choice-IDs, die Benutzer auf diese Ersatz-Auswahl umleiten sollen.                           |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlen.                                              |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Bezeichnung für diese Gruppe.                                                           |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                        |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit nur einem Flag.                                |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, z. B. `--openrouter-api-key`.                                                       |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, z. B. `--openrouter-api-key <key>`.                                  |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                     |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn dies fehlt, ist der Standard `["text-inference"]`. |

## Referenz für `commandAliases`

Verwenden Sie `commandAliases`, wenn ein Plugin einen Laufzeit-Befehlsnamen besitzt, den Benutzer
versehentlich in `plugins.allow` eintragen oder als Root-CLI-Befehl auszuführen versuchen könnten. OpenClaw
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

| Feld         | Erforderlich | Typ               | Bedeutung                                                                     |
| ------------ | ------------ | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | Ja           | `string`          | Befehlsname, der zu diesem Plugin gehört.                                     |
| `kind`       | Nein         | `"runtime-slash"` | Markiert den Alias als Chat-Slash-Befehl statt als Root-CLI-Befehl.           |
| `cliCommand` | Nein         | `string`          | Zugehöriger Root-CLI-Befehl, der für CLI-Operationen vorgeschlagen werden soll, falls vorhanden. |

## Referenz für `activation`

Verwenden Sie `activation`, wenn das Plugin kostengünstig deklarieren kann, welche Control-Plane-Ereignisse
es später aktivieren sollen.

Dieser Block besteht nur aus Metadaten. Er registriert kein Laufzeitverhalten und
ersetzt weder `register(...)`, `setupEntry` noch andere Laufzeit-/Plugin-Entrypoints.
Aktuelle Verbraucher verwenden ihn als Eingrenzungshinweis vor einem breiteren Laden von Plugins, daher
kosten fehlende Aktivierungsmetadaten normalerweise nur Performance; sie sollten die
Korrektheit nicht verändern, solange weiterhin Fallbacks für veraltete Manifest-Zuständigkeiten existieren.

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
| `onChannels`     | Nein         | `string[]`                                           | Kanal-IDs, die dieses Plugin aktivieren sollen.                      |
| `onRoutes`       | Nein         | `string[]`                                           | Routenarten, die dieses Plugin aktivieren sollen.                    |
| `onCapabilities` | Nein         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Allgemeine Capability-Hinweise, die von der Aktivierungsplanung der Control Plane verwendet werden. |

Aktuelle Live-Verbraucher:

- CLI-Planung mit Befehlsauslösung fällt auf veraltete
  `commandAliases[].cliCommand` oder `commandAliases[].name` zurück
- kanalgetriggerte Setup-/Kanalplanung fällt auf die veraltete Zuständigkeit
  `channels[]` zurück, wenn explizite Aktivierungsmetadaten für Kanäle fehlen
- providergetriggerte Setup-/Laufzeitplanung fällt auf die veraltete
  Zuständigkeit `providers[]` und Top-Level-`cliBackends[]` zurück, wenn explizite Provider-
  Aktivierungsmetadaten fehlen

## Referenz für `setup`

Verwenden Sie `setup`, wenn Setup- und Onboarding-Oberflächen kostengünstige Plugin-eigene Metadaten
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
Backends. `setup.cliBackends` ist die setupspezifische Beschreibungsoberfläche für
Control-Plane-/Setup-Abläufe, die nur metadatenbasiert bleiben sollen.

Falls vorhanden, sind `setup.providers` und `setup.cliBackends` die bevorzugte
deskriptororientierte Lookup-Oberfläche für die Setup-Erkennung. Wenn der Deskriptor nur das
Kandidaten-Plugin eingrenzt und das Setup weiterhin umfassendere Setup-Laufzeit-Hooks benötigt,
setzen Sie `requiresRuntime: true` und behalten Sie `setup-api` als
Fallback-Ausführungspfad bei.

Da das Setup-Lookup Plugin-eigenen `setup-api`-Code ausführen kann, müssen normalisierte
Werte in `setup.providers[].id` und `setup.cliBackends[]` für alle
erkannten Plugins eindeutig bleiben. Mehrdeutige Zuständigkeit schlägt fail-closed fehl, anstatt
anhand der Discovery-Reihenfolge einen Gewinner auszuwählen.

### Referenz für `setup.providers`

| Feld          | Erforderlich | Typ        | Bedeutung                                                                            |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Ja           | `string`   | Provider-ID, die während Setup oder Onboarding bereitgestellt wird. Halten Sie normalisierte IDs global eindeutig. |
| `authMethods` | Nein         | `string[]` | Setup-/Auth-Methoden-IDs, die dieser Provider unterstützt, ohne die vollständige Laufzeit zu laden. |
| `envVars`     | Nein         | `string[]` | Env Vars, die generische Setup-/Status-Oberflächen prüfen können, bevor die Plugin-Laufzeit geladen wird. |

### `setup`-Felder

| Feld               | Erforderlich | Typ        | Bedeutung                                                                                          |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | Nein         | `object[]` | Provider-Setup-Deskriptoren, die während Setup und Onboarding bereitgestellt werden.               |
| `cliBackends`      | Nein         | `string[]` | Backend-IDs zur Setup-Zeit, die für deskriptororientiertes Setup-Lookup verwendet werden. Halten Sie normalisierte IDs global eindeutig. |
| `configMigrations` | Nein         | `string[]` | IDs von Konfigurationsmigrationen, die der Setup-Oberfläche dieses Plugins gehören.                |
| `requiresRuntime`  | Nein         | `boolean`  | Ob das Setup nach dem Deskriptor-Lookup weiterhin die Ausführung von `setup-api` benötigt.         |

## Referenz für `uiHints`

`uiHints` ist eine Zuordnung von Namen von Konfigurationsfeldern zu kleinen Render-Hinweisen.

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

Jeder Feld-Hinweis kann Folgendes enthalten:

| Feld          | Typ        | Bedeutung                                  |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Benutzerseitige Feldbezeichnung.           |
| `help`        | `string`   | Kurzer Hilfetext.                          |
| `tags`        | `string[]` | Optionale UI-Tags.                         |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.           |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.      |

## Referenz für `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Capability-Zuständigkeit, die OpenClaw
lesen kann, ohne die Plugin-Laufzeit zu importieren.

```json
{
  "contracts": {
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

| Feld                            | Typ        | Bedeutung                                                  |
| -------------------------------- | ---------- | ---------------------------------------------------------- |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.            |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-Transcription-Provider-IDs, die diesem Plugin gehören. |
| `realtimeVoiceProviders`         | `string[]` | Realtime-Voice-Provider-IDs, die diesem Plugin gehören.    |
| `mediaUnderstandingProviders`    | `string[]` | Media-Understanding-Provider-IDs, die diesem Plugin gehören. |
| `imageGenerationProviders`       | `string[]` | Image-Generation-Provider-IDs, die diesem Plugin gehören.  |
| `videoGenerationProviders`       | `string[]` | Video-Generation-Provider-IDs, die diesem Plugin gehören.  |
| `webFetchProviders`              | `string[]` | Web-Fetch-Provider-IDs, die diesem Plugin gehören.         |
| `webSearchProviders`             | `string[]` | Web-Search-Provider-IDs, die diesem Plugin gehören.        |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für Prüfungen gebündelter Verträge gehören. |

## Referenz für `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin kostengünstige Konfigurationsmetadaten benötigt, bevor
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
      "description": "Matrix-Homeserver-Verbindung",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Jeder Kanaleintrag kann Folgendes enthalten:

| Feld          | Typ                      | Bedeutung                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanal-Konfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen/Platzhalter/Sensitivitätshinweise für diesen Abschnitt der Kanal-Konfiguration. |
| `label`       | `string`                 | Kanalbezeichnung, die in Auswahl- und Inspektionsoberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                          |
| `preferOver`  | `string[]`               | Veraltete oder niedriger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz für `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Provider-Plugin aus verkürzten
Modell-IDs wie `gpt-5.4` oder `claude-sonnet-4.6` ableiten soll, bevor die Plugin-Laufzeit
geladen wird.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw verwendet die folgende Vorrangfolge:

- explizite `provider/model`-Refs verwenden die Manifest-Metadaten des zuständigen `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide übereinstimmen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                     |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die per `startsWith` mit verkürzten Modell-IDs abgeglichen werden.  |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen von Profil-Suffixen mit verkürzten Modell-IDs abgeglichen werden. |

Veraltete Top-Level-Capability-Schlüssel sind deprecated. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben; das normale
Laden von Manifesten behandelt diese Top-Level-Felder nicht mehr als
Capability-Zuständigkeit.

## Manifest im Vergleich zu `package.json`

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Auth-Choice-Metadaten und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und den `openclaw`-Block, der für Entrypoints, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wohin ein Metadatenelement gehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Entry-Dateien oder das npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die die Discovery beeinflussen

Einige Plugin-Metadaten vor der Laufzeit befinden sich absichtlich in `package.json` unter dem
`openclaw`-Block statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Entrypoints.                                                                                                        |
| `openclaw.setupEntry`                                             | Leichtgewichtiger Setup-only-Entrypoint, der beim Onboarding und beim verzögerten Kanalstart verwendet wird.                               |
| `openclaw.channel`                                                | Kostengünstige Kanal-Katalogmetadaten wie Bezeichnungen, Dokumentationspfade, Aliasse und Auswahltexte.                                    |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für den Checker des konfigurierten Zustands, die beantworten können: „Existiert bereits ein nur per Env konfiguriertes Setup?“, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für den Checker des persistierten Auth-Zustands, die beantworten können: „Ist bereits irgendwo angemeldet?“, ohne die vollständige Kanal-Laufzeit zu laden. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hinweise für Installation/Aktualisierung von gebündelten und extern veröffentlichten Plugins.                                              |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                            |
| `openclaw.install.minHostVersion`                                 | Minimal unterstützte OpenClaw-Host-Version unter Verwendung einer Semver-Untergrenze wie `>=2026.3.22`.                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen eng begrenzten Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.      |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Ermöglicht das Laden von Setup-only-Kanaloberflächen vor dem vollständigen Kanal-Plugin beim Start.                                        |

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der Manifest-
Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das
Plugin auf älteren Hosts.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es
macht nicht beliebige fehlerhafte Konfigurationen installierbar. Derzeit erlaubt es nur
Installationsabläufen, sich von bestimmten veralteten Upgrade-Fehlern gebündelter Plugins zu erholen,
wie einem fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten Eintrag `channels.<id>` für
dasselbe gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren weiterhin die Installation und verweisen Operatoren
auf `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` sind Paketmetadaten für ein kleines Checker-
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

Verwenden Sie dies, wenn Setup-, Doctor- oder Configured-State-Abläufe eine kostengünstige Ja/Nein-
Auth-Abfrage benötigen, bevor das vollständige Kanal-Plugin geladen wird. Das Zielexport sollte eine kleine
Funktion sein, die nur persistierten Zustand liest; leiten Sie sie nicht über das vollständige
Kanal-Laufzeit-Barrel.

`openclaw.channel.configuredState` folgt derselben Form für kostengünstige Prüfungen des
konfigurierten Zustands nur per Env:

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

Verwenden Sie dies, wenn ein Kanal den konfigurierten Zustand aus Env oder anderen kleinen
Nicht-Laufzeiteingaben beantworten kann. Wenn die Prüfung eine vollständige Konfigurationsauflösung oder die echte
Kanal-Laufzeit benötigt, belassen Sie diese Logik stattdessen im Hook `config.hasConfiguredState`
des Plugins.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema bereitstellen**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, es sei denn, die Kanal-ID wird durch
  ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **auffindbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein fehlerhaftes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, bleibt die
  Konfiguration erhalten und in Doctor + Logs wird eine **Warnung** ausgegeben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration) für das vollständige Schema `plugins.*`.

## Hinweise

- Das Manifest ist **für native OpenClaw Plugins erforderlich**, einschließlich lokaler Loads aus dem Dateisystem.
- Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur
  der Discovery und Validierung.
- Native Manifeste werden mit JSON5 geparst, daher werden Kommentare, nachgestellte Kommata und
  nicht in Anführungszeichen gesetzte Schlüssel akzeptiert, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie es,
  hier benutzerdefinierte Top-Level-Schlüssel hinzuzufügen.
- `providerAuthEnvVars` ist der kostengünstige Metadatenpfad für Auth-Prüfungen, Env-Marker-
  Validierung und ähnliche Oberflächen für Provider-Auth, bei denen die Plugin-Laufzeit nicht
  gestartet werden sollte, nur um Env-Namen zu prüfen.
- `providerAuthAliases` ermöglicht es Provider-Varianten, die Auth-Env-Variablen,
  Auth-Profile, konfigurationsgestützte Auth und die API-Key-Onboarding-Auswahl eines anderen Providers wiederzuverwenden,
  ohne diese Beziehung im Core fest zu codieren.
- `channelEnvVars` ist der kostengünstige Metadatenpfad für Shell-Env-Fallback, Setup-
  Prompts und ähnliche Kanal-Oberflächen, bei denen die Plugin-Laufzeit nicht gestartet werden sollte,
  nur um Env-Namen zu prüfen.
- `providerAuthChoices` ist der kostengünstige Metadatenpfad für Auth-Choice-Auswahlfelder,
  die Auflösung von `--auth-choice`, das Mapping bevorzugter Provider und die einfache Registrierung von Onboarding-
  CLI-Flags, bevor die Provider-Laufzeit geladen wird. Runtime-Wizard-Metadaten,
  die Provider-Code erfordern, finden Sie unter
  [Provider-Laufzeit-Hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird durch `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird durch `plugins.slots.contextEngine`
    ausgewählt (Standard: integriertes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein
  Plugin sie nicht benötigt.
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle
  Anforderungen an die Allowlist des Paketmanagers (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandte Themen

- [Building Plugins](/de/plugins/building-plugins) — Einstieg in Plugins
- [Plugin Architecture](/de/plugins/architecture) — interne Architektur
- [SDK Overview](/de/plugins/sdk-overview) — Referenz für das Plugin SDK
