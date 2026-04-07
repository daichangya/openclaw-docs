---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Plugin-Validierungsfehler debuggen
summary: Anforderungen an Plugin-Manifest + JSON-Schema (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-07T06:17:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22d41b9f8748b1b1b066ee856be4a8f41e88b9a8bc073d74fc79d2bb0982f01a
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (openclaw.plugin.json)

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Kompatible Bundle-Layouts finden Sie unter [Plugin bundles](/de/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponenten-
  Layout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch nicht
gegen das hier beschriebene Schema für `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten plus deklarierte
Skill-Stammverzeichnisse, Claude-Befehlsstammverzeichnisse, Standardwerte aus `settings.json` von Claude-Bundles,
Standardwerte für Claude-Bundle-LSPs und unterstützte Hook-Pakete, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** im
**Plugin-Stammverzeichnis** eine Datei `openclaw.plugin.json` ausliefern. OpenClaw verwendet dieses Manifest, um die Konfiguration zu validieren,
**ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Den vollständigen Leitfaden zum Plugin-System finden Sie unter: [Plugins](/de/tools/plugin).
Zum nativen Fähigkeitsmodell und den aktuellen Hinweisen zur externen Kompatibilität:
[Fähigkeitsmodell](/de/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor Ihr
Plugin-Code geladen wird.

Verwenden Sie sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Auth- und Onboarding-Metadaten, die verfügbar sein sollen, ohne die Plugin-
  Laufzeit zu starten
- Alias- und Autoaktivierungs-Metadaten, die aufgelöst werden sollen, bevor die Plugin-Laufzeit geladen wird
- Kurzmetadaten zur Besitzerschaft von Modellfamilien, die das
  Plugin vor dem Laden der Laufzeit automatisch aktivieren sollen
- statische Snapshots der Fähigkeitsbesitzerschaft, die für gebündelte Kompatibilitätsverkabelung und
  Vertragsabdeckung verwendet werden
- kanalspezifische Konfigurationsmetadaten, die vor dem Laden der Laufzeit in Katalog- und Validierungs-
  Oberflächen zusammengeführt werden sollen
- Hinweise für die Konfigurations-UI

Verwenden Sie sie nicht für:

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
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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

## Referenz der Felder auf oberster Ebene

| Feld                                | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                                     |
| ----------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Ja           | `string`                         | Kanonische Plugin-ID. Dies ist die ID, die in `plugins.entries.<id>` verwendet wird.                                                                                                                         |
| `configSchema`                      | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                                      |
| `enabledByDefault`                  | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie es weg oder setzen Sie einen beliebigen Wert ungleich `true`, damit das Plugin standardmäßig deaktiviert bleibt.                   |
| `legacyPluginIds`                   | Nein         | `string[]`                       | Legacy-IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                                           |
| `autoEnableWhenConfiguredProviders` | Nein         | `string[]`                       | Anbieter-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Auth, Konfiguration oder Modellreferenzen sie erwähnen.                                                                                  |
| `kind`                              | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                                              |
| `channels`                          | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Werden für Discovery und Konfigurationsvalidierung verwendet.                                                                                                           |
| `providers`                         | Nein         | `string[]`                       | Anbieter-IDs, die diesem Plugin gehören.                                                                                                                                                                      |
| `modelSupport`                      | Nein         | `object`                         | Manifest-eigene Kurzmetadaten zu Modellfamilien, die verwendet werden, um das Plugin vor der Laufzeit automatisch zu laden.                                                                                  |
| `cliBackends`                       | Nein         | `string[]`                       | IDs von CLI-Inferenz-Backends, die diesem Plugin gehören. Werden zur automatischen Aktivierung beim Start anhand expliziter Konfigurationsreferenzen verwendet.                                              |
| `providerAuthEnvVars`               | Nein         | `Record<string, string[]>`       | Günstige Anbieter-Auth-Env-Metadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden.                                                                                                                   |
| `channelEnvVars`                    | Nein         | `Record<string, string[]>`       | Günstige Kanal-Env-Metadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden. Verwenden Sie dies für env-gesteuerte Kanaleinrichtung oder Auth-Oberflächen, die generische Start-/Konfigurationshilfen sehen sollen. |
| `providerAuthChoices`               | Nein         | `object[]`                       | Günstige Metadaten zu Auth-Auswahlen für Onboarding-Auswahlen, bevorzugte Anbieterauflösung und einfache CLI-Flag-Verdrahtung.                                                                              |
| `contracts`                         | Nein         | `object`                         | Statischer gebündelter Fähigkeitssnapshot für Sprache, Echtzeittranskription, Echtzeitstimme, Medienverständnis, Bildgenerierung, Musikgenerierung, Videogenerierung, Web-Abruf, Websuche und Tool-Besitzerschaft. |
| `channelConfigs`                    | Nein         | `Record<string, object>`         | Manifest-eigene Kanal-Konfigurationsmetadaten, die in Discovery- und Validierungsoberflächen zusammengeführt werden, bevor die Laufzeit geladen wird.                                                        |
| `skills`                            | Nein         | `string[]`                       | Skill-Verzeichnisse, die relativ zum Plugin-Stammverzeichnis geladen werden.                                                                                                                                  |
| `name`                              | Nein         | `string`                         | Menschenlesbarer Plugin-Name.                                                                                                                                                                                 |
| `description`                       | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                                              |
| `version`                           | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                                   |
| `uiHints`                           | Nein         | `Record<string, object>`         | UI-Beschriftungen, Platzhalter und Sensitivitätshinweise für Konfigurationsfelder.                                                                                                                            |

## Referenz für `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Auth-Auswahl.
OpenClaw liest dies, bevor die Anbieter-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                     |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Anbieter-ID, zu der diese Auswahl gehört.                                                                     |
| `method`              | Ja           | `string`                                        | ID der Auth-Methode, an die weitergeleitet wird.                                                              |
| `choiceId`            | Ja           | `string`                                        | Stabile Auth-Auswahl-ID, die von Onboarding- und CLI-Abläufen verwendet wird.                                 |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitige Bezeichnung. Wenn weggelassen, greift OpenClaw auf `choiceId` zurück.                         |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                             |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.                    |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Auswahl in Assistenten-Auswahlen aus, erlaubt aber weiterhin die manuelle CLI-Auswahl.            |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Legacy-Auswahl-IDs, die Benutzer auf diese Ersatzauswahl umleiten sollen.                                     |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Auswahlen.                                                     |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitige Bezeichnung für diese Gruppe.                                                                 |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                              |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Auth-Abläufe mit einem einzelnen Flag.                                 |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, z. B. `--openrouter-api-key`.                                                             |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, z. B. `--openrouter-api-key <key>`.                                         |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                            |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Auswahl erscheinen soll. Wenn weggelassen, ist der Standard `["text-inference"]`. |

## Referenz für `uiHints`

`uiHints` ist eine Zuordnung von Konfigurationsfeldnamen zu kleinen Render-Hinweisen.

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

| Feld          | Typ        | Bedeutung                                   |
| ------------- | ---------- | ------------------------------------------- |
| `label`       | `string`   | Benutzerseitige Feldbezeichnung.            |
| `help`        | `string`   | Kurzer Hilfetext.                           |
| `tags`        | `string[]` | Optionale UI-Tags.                          |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.            |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.       |

## Referenz für `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Fähigkeitsbesitzerschaft, die OpenClaw
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

| Feld                             | Typ        | Bedeutung                                                      |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs von Sprachanbietern, die diesem Plugin gehören.            |
| `realtimeTranscriptionProviders` | `string[]` | IDs von Echtzeit-Transkriptionsanbietern, die diesem Plugin gehören. |
| `realtimeVoiceProviders`         | `string[]` | IDs von Echtzeit-Stimmanbietern, die diesem Plugin gehören.    |
| `mediaUnderstandingProviders`    | `string[]` | IDs von Medienverständnis-Anbietern, die diesem Plugin gehören. |
| `imageGenerationProviders`       | `string[]` | IDs von Bildgenerierungsanbietern, die diesem Plugin gehören.  |
| `videoGenerationProviders`       | `string[]` | IDs von Videogenerierungsanbietern, die diesem Plugin gehören. |
| `webFetchProviders`              | `string[]` | IDs von Web-Abruf-Anbietern, die diesem Plugin gehören.        |
| `webSearchProviders`             | `string[]` | IDs von Websuchanbietern, die diesem Plugin gehören.           |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für gebündelte Vertragsprüfungen gehören. |

## Referenz für `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin günstige Konfigurationsmetadaten benötigt, bevor
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
          "label": "Homeserver URL",
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

| Feld          | Typ                      | Bedeutung                                                                                       |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanal-Konfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Beschriftungen/Platzhalter/Sensitivitätshinweise für diesen Kanal-Konfigurationsabschnitt. |
| `label`       | `string`                 | Kanalbezeichnung, die in Auswahl- und Prüfoberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Prüf- und Katalogoberflächen.                                      |
| `preferOver`  | `string[]`               | Legacy- oder Plugins mit niedrigerer Priorität, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz für `modelSupport`

Verwenden Sie `modelSupport`, wenn OpenClaw Ihr Anbieter-Plugin aus
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

OpenClaw verwendet diese Reihenfolge:

- explizite `provider/model`-Referenzen verwenden die Manifest-Metadaten des besitzenden `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn ein nicht gebündeltes Plugin und ein gebündeltes Plugin beide passen, gewinnt das nicht gebündelte
  Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Anbieter angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden.    |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen von Profilsuffixen gegen Kurzform-Modell-IDs abgeglichen werden. |

Legacy-Fähigkeitsschlüssel auf oberster Ebene sind veraltet. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu
verschieben; das normale Laden von Manifesten behandelt diese Felder auf oberster Ebene nicht mehr als
Fähigkeitsbesitzerschaft.

## Manifest im Vergleich zu package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwenden Sie sie für                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Metadaten zu Auth-Auswahlen und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Abhängigkeitsinstallation und den Block `openclaw`, der für Entrypoints, Installations-Gating, Einrichtung oder Katalogmetadaten verwendet wird |

Wenn Sie unsicher sind, wohin ein Metadatenelement gehört, verwenden Sie diese Regel:

- wenn OpenClaw es kennen muss, bevor Plugin-Code geladen wird, gehört es in `openclaw.plugin.json`
- wenn es um Packaging, Eingabedateien oder das Installationsverhalten von npm geht, gehört es in `package.json`

### package.json-Felder, die die Discovery beeinflussen

Einige Plugin-Metadaten vor der Laufzeit befinden sich absichtlich in `package.json` unter dem
Block `openclaw` statt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Entrypoints.                                                                                                          |
| `openclaw.setupEntry`                                             | Leichtgewichtiger Entrypoint nur für die Einrichtung, der beim Onboarding und beim verzögerten Kanalstart verwendet wird.                    |
| `openclaw.channel`                                                | Günstige Kanal-Katalogmetadaten wie Bezeichnungen, Dokumentationspfade, Aliasse und Auswahltexte.                                            |
| `openclaw.channel.configuredState`                                | Leichtgewichtige Metadaten für die Prüfung des konfigurierten Zustands, die ohne Laden der vollständigen Kanal-Laufzeit beantworten können: "Existiert bereits eine rein env-basierte Einrichtung?" |
| `openclaw.channel.persistedAuthState`                             | Leichtgewichtige Metadaten für die Prüfung des persistierten Auth-Zustands, die ohne Laden der vollständigen Kanal-Laufzeit beantworten können: "Ist bereits etwas angemeldet?" |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Installations-/Aktualisierungshinweise für gebündelte und extern veröffentlichte Plugins.                                                     |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.                                                              |
| `openclaw.install.minHostVersion`                                 | Minimale unterstützte OpenClaw-Host-Version, mit einer semver-Untergrenze wie `>=2026.3.22`.                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen engen Wiederherstellungspfad für die Neuinstallation gebündelter Plugins, wenn die Konfiguration ungültig ist.                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Erlaubt das Laden von Kanaloberflächen nur für die Einrichtung vor dem vollständigen Kanal-Plugin während des Starts.                         |

`openclaw.install.minHostVersion` wird während der Installation und beim Laden des
Manifest-Registers erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das
Plugin auf älteren Hosts.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng gefasst. Es
macht nicht beliebige defekte Konfigurationen installierbar. Derzeit erlaubt es nur Installationsabläufen,
sich von bestimmten veralteten Upgrade-Fehlern bei gebündelten Plugins zu erholen, etwa einem
fehlenden gebündelten Plugin-Pfad oder einem veralteten `channels.<id>`-Eintrag für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und schicken Betreiber zu
`openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` ist Paketmetadaten für ein kleines Prüfermodul:

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

Verwenden Sie es, wenn Einrichtung, Doctor oder Abläufe zum konfigurierten Zustand vor dem Laden des vollständigen
Kanal-Plugins eine günstige Ja/Nein-Auth-Sondierung benötigen. Der Ziel-Export sollte eine kleine
Funktion sein, die nur persistierten Zustand liest; leiten Sie ihn nicht über die vollständige
Kanal-Laufzeit-Barrel-Datei.

`openclaw.channel.configuredState` folgt derselben Form für günstige rein env-basierte
Prüfungen des konfigurierten Zustands:

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

Verwenden Sie es, wenn ein Kanal den konfigurierten Zustand aus env oder anderen kleinen
Nicht-Laufzeit-Eingaben beantworten kann. Wenn die Prüfung vollständige Konfigurationsauflösung oder die echte
Kanal-Laufzeit benötigt, behalten Sie diese Logik stattdessen im Hook `config.hasConfiguredState`
des Plugins.

## Anforderungen an JSON Schema

- **Jedes Plugin muss ein JSON-Schema ausliefern**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemas werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, es sei denn, die Kanal-ID wird durch
  ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen sich auf **auffindbare** Plugin-IDs beziehen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration vorhanden ist, das Plugin aber **deaktiviert** ist, bleibt die Konfiguration erhalten und
  in Doctor + Protokollen wird eine **Warnung** angezeigt.

Das vollständige Schema für `plugins.*` finden Sie unter [Configuration reference](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge.
- Die Laufzeit lädt das Plugin-Modul weiterhin separat; das Manifest dient nur der
  Discovery + Validierung.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, nachgestellte Kommata und
  unquotierte Schlüssel zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie es,
  hier benutzerdefinierte Schlüssel auf oberster Ebene hinzuzufügen.
- `providerAuthEnvVars` ist der günstige Metadatenpfad für Auth-Sondierungen, Env-Marker-
  Validierung und ähnliche Anbieter-Auth-Oberflächen, die die Plugin-
  Laufzeit nicht starten sollten, nur um Env-Namen zu prüfen.
- `channelEnvVars` ist der günstige Metadatenpfad für Shell-Env-Fallbacks, Einrichtungs-
  Eingabeaufforderungen und ähnliche Kanaloberflächen, die die Plugin-Laufzeit nicht starten sollten,
  nur um Env-Namen zu prüfen.
- `providerAuthChoices` ist der günstige Metadatenpfad für Auth-Auswahl-Picker,
  Auflösung von `--auth-choice`, Zuordnung bevorzugter Anbieter und einfache Onboarding-
  Registrierung von CLI-Flags, bevor die Anbieter-Laufzeit geladen wird. Für Laufzeit-Wizard-
  Metadaten, die Anbieter-Code benötigen, siehe
  [Provider runtime hooks](/de/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird von `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird von `plugins.slots.contextEngine`
    ausgewählt (Standard: integriertes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein
  Plugin sie nicht benötigt.
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle
  Anforderungen an die Paketmanager-Zulassungsliste (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandt

- [Building Plugins](/de/plugins/building-plugins) — Erste Schritte mit Plugins
- [Plugin Architecture](/de/plugins/architecture) — interne Architektur
- [SDK Overview](/de/plugins/sdk-overview) — Referenz zum Plugin SDK
