---
read_when:
    - Sie erstellen ein OpenClaw-Plugin
    - Sie müssen ein Plugin-Konfigurationsschema ausliefern oder Plugin-Validierungsfehler debuggen
summary: Anforderungen an Plugin-Manifest + JSON-Schema (strikte Konfigurationsvalidierung)
title: Plugin-Manifest
x-i18n:
    generated_at: "2026-04-05T12:51:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 702447ad39f295cfffd4214c3e389bee667d2f9850754f2e02e325dde8e4ac00
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin-Manifest (`openclaw.plugin.json`)

Diese Seite gilt nur für das **native OpenClaw-Plugin-Manifest**.

Informationen zu kompatiblen Bundle-Layouts finden Sie unter [Plugin-Bundles](/plugins/bundles).

Kompatible Bundle-Formate verwenden andere Manifestdateien:

- Codex-Bundle: `.codex-plugin/plugin.json`
- Claude-Bundle: `.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponenten-
  Layout ohne Manifest
- Cursor-Bundle: `.cursor-plugin/plugin.json`

OpenClaw erkennt diese Bundle-Layouts ebenfalls automatisch, sie werden jedoch
nicht gegen das hier beschriebene Schema von `openclaw.plugin.json` validiert.

Für kompatible Bundles liest OpenClaw derzeit Bundle-Metadaten sowie deklarierte
Skill-Roots, Claude-Befehls-Roots, Standardwerte aus `settings.json` des Claude-Bundles,
Claude-Bundle-LSP-Standardwerte und unterstützte Hook-Packs, wenn das Layout den
Laufzeiterwartungen von OpenClaw entspricht.

Jedes native OpenClaw-Plugin **muss** im **Plugin-Root** eine Datei `openclaw.plugin.json`
mitliefern. OpenClaw verwendet dieses Manifest, um die Konfiguration zu validieren,
**ohne Plugin-Code auszuführen**. Fehlende oder ungültige Manifeste werden als
Plugin-Fehler behandelt und blockieren die Konfigurationsvalidierung.

Den vollständigen Leitfaden zum Plugin-System finden Sie unter [Plugins](/tools/plugin).
Zum nativen Fähigkeitsmodell und den aktuellen Hinweisen zur externen Kompatibilität:
[Fähigkeitsmodell](/plugins/architecture#public-capability-model).

## Was diese Datei macht

`openclaw.plugin.json` sind die Metadaten, die OpenClaw liest, bevor Ihr
Plugin-Code geladen wird.

Verwenden Sie sie für:

- Plugin-Identität
- Konfigurationsvalidierung
- Authentifizierungs- und Onboarding-Metadaten, die verfügbar sein sollen, ohne die Plugin-
  Laufzeit zu starten
- Alias- und Autoaktivierungs-Metadaten, die aufgelöst werden sollen, bevor die Plugin-Laufzeit geladen wird
- Kurzform-Metadaten zur Besitzerschaft von Modellfamilien, die das
  Plugin vor dem Laden der Laufzeit automatisch aktivieren sollen
- statische Snapshots der Fähigkeits-Besitzerschaft, die für gebündelte Kompatibilitätsverdrahtung und Vertragsabdeckung verwendet werden
- kanalspezifische Konfigurationsmetadaten, die in Katalog- und Validierungsoberflächen zusammengeführt werden sollen, ohne die Laufzeit zu laden
- Hinweise für die Konfigurations-UI

Verwenden Sie sie nicht für:

- die Registrierung von Laufzeitverhalten
- die Deklaration von Code-Einstiegspunkten
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

| Feld                                | Erforderlich | Typ                              | Bedeutung                                                                                                                                                                                  |
| ----------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Ja           | `string`                         | Kanonische Plugin-ID. Diese ID wird in `plugins.entries.<id>` verwendet.                                                                                                                  |
| `configSchema`                      | Ja           | `object`                         | Inline-JSON-Schema für die Konfiguration dieses Plugins.                                                                                                                                   |
| `enabledByDefault`                  | Nein         | `true`                           | Markiert ein gebündeltes Plugin als standardmäßig aktiviert. Lassen Sie das Feld weg oder setzen Sie einen anderen Wert als `true`, damit das Plugin standardmäßig deaktiviert bleibt.   |
| `legacyPluginIds`                   | Nein         | `string[]`                       | Veraltete IDs, die auf diese kanonische Plugin-ID normalisiert werden.                                                                                                                     |
| `autoEnableWhenConfiguredProviders` | Nein         | `string[]`                       | Provider-IDs, die dieses Plugin automatisch aktivieren sollen, wenn Authentifizierung, Konfiguration oder Modellreferenzen sie erwähnen.                                                  |
| `kind`                              | Nein         | `"memory"` \| `"context-engine"` | Deklariert eine exklusive Plugin-Art, die von `plugins.slots.*` verwendet wird.                                                                                                           |
| `channels`                          | Nein         | `string[]`                       | Kanal-IDs, die diesem Plugin gehören. Werden für Discovery und Konfigurationsvalidierung verwendet.                                                                                       |
| `providers`                         | Nein         | `string[]`                       | Provider-IDs, die diesem Plugin gehören.                                                                                                                                                   |
| `modelSupport`                      | Nein         | `object`                         | Manifest-eigene Kurzform-Metadaten zu Modellfamilien, mit denen das Plugin vor der Laufzeit automatisch geladen wird.                                                                    |
| `cliBackends`                       | Nein         | `string[]`                       | IDs von CLI-Inferenz-Backends, die diesem Plugin gehören. Werden für die automatische Aktivierung beim Start aus expliziten Konfigurationsreferenzen verwendet.                          |
| `providerAuthEnvVars`               | Nein         | `Record<string, string[]>`       | Leichtgewichtige Provider-Auth-Umgebungsmetadaten, die OpenClaw prüfen kann, ohne Plugin-Code zu laden.                                                                                  |
| `providerAuthChoices`               | Nein         | `object[]`                       | Leichtgewichtige Authentifizierungswahl-Metadaten für Onboarding-Auswahlen, Auflösung bevorzugter Provider und einfache Verdrahtung von CLI-Flags.                                       |
| `contracts`                         | Nein         | `object`                         | Statischer Snapshot gebündelter Fähigkeiten für Speech, Realtime-Transcription, Realtime-Voice, Media-Understanding, Image-Generation, Video-Generation, Web-Fetch, Web Search und Tool-Besitzerschaft. |
| `channelConfigs`                    | Nein         | `Record<string, object>`         | Manifest-eigene Kanal-Konfigurationsmetadaten, die in Discovery- und Validierungsoberflächen zusammengeführt werden, bevor die Laufzeit geladen wird.                                    |
| `skills`                            | Nein         | `string[]`                       | Zu ladende Skills-Verzeichnisse relativ zum Plugin-Root.                                                                                                                                   |
| `name`                              | Nein         | `string`                         | Benutzerlesbarer Plugin-Name.                                                                                                                                                              |
| `description`                       | Nein         | `string`                         | Kurze Zusammenfassung, die in Plugin-Oberflächen angezeigt wird.                                                                                                                           |
| `version`                           | Nein         | `string`                         | Informative Plugin-Version.                                                                                                                                                                |
| `uiHints`                           | Nein         | `Record<string, object>`         | UI-Labels, Platzhalter und Hinweise zur Sensitivität für Konfigurationsfelder.                                                                                                             |

## Referenz zu `providerAuthChoices`

Jeder Eintrag in `providerAuthChoices` beschreibt eine Onboarding- oder Authentifizierungswahl.
OpenClaw liest dies, bevor die Provider-Laufzeit geladen wird.

| Feld                  | Erforderlich | Typ                                             | Bedeutung                                                                                                 |
| --------------------- | ------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Ja           | `string`                                        | Provider-ID, zu der diese Wahl gehört.                                                                    |
| `method`              | Ja           | `string`                                        | ID der Authentifizierungsmethode, an die weitergeleitet wird.                                             |
| `choiceId`            | Ja           | `string`                                        | Stabile Authentifizierungswahl-ID, die in Onboarding- und CLI-Abläufen verwendet wird.                   |
| `choiceLabel`         | Nein         | `string`                                        | Benutzerseitiges Label. Wenn es fehlt, verwendet OpenClaw als Fallback `choiceId`.                        |
| `choiceHint`          | Nein         | `string`                                        | Kurzer Hilfetext für die Auswahl.                                                                         |
| `assistantPriority`   | Nein         | `number`                                        | Niedrigere Werte werden in assistentengesteuerten interaktiven Auswahlen früher sortiert.                |
| `assistantVisibility` | Nein         | `"visible"` \| `"manual-only"`                  | Blendet die Wahl in Assistenten-Auswahlen aus, erlaubt aber weiterhin die manuelle Auswahl per CLI.      |
| `deprecatedChoiceIds` | Nein         | `string[]`                                      | Veraltete Wahl-IDs, die Benutzer auf diese Ersatzwahl umleiten sollen.                                   |
| `groupId`             | Nein         | `string`                                        | Optionale Gruppen-ID zum Gruppieren verwandter Wahlen.                                                    |
| `groupLabel`          | Nein         | `string`                                        | Benutzerseitiges Label für diese Gruppe.                                                                  |
| `groupHint`           | Nein         | `string`                                        | Kurzer Hilfetext für die Gruppe.                                                                          |
| `optionKey`           | Nein         | `string`                                        | Interner Optionsschlüssel für einfache Authentifizierungsabläufe mit einem Flag.                          |
| `cliFlag`             | Nein         | `string`                                        | Name des CLI-Flags, zum Beispiel `--openrouter-api-key`.                                                  |
| `cliOption`           | Nein         | `string`                                        | Vollständige Form der CLI-Option, zum Beispiel `--openrouter-api-key <key>`.                             |
| `cliDescription`      | Nein         | `string`                                        | Beschreibung, die in der CLI-Hilfe verwendet wird.                                                        |
| `onboardingScopes`    | Nein         | `Array<"text-inference" \| "image-generation">` | In welchen Onboarding-Oberflächen diese Wahl erscheinen soll. Wenn das Feld fehlt, ist der Standard `["text-inference"]`. |

## Referenz zu `uiHints`

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
| `label`       | `string`   | Benutzerseitiges Feld-Label.             |
| `help`        | `string`   | Kurzer Hilfetext.                        |
| `tags`        | `string[]` | Optionale UI-Tags.                       |
| `advanced`    | `boolean`  | Markiert das Feld als erweitert.         |
| `sensitive`   | `boolean`  | Markiert das Feld als geheim oder sensibel. |
| `placeholder` | `string`   | Platzhaltertext für Formulareingaben.    |

## Referenz zu `contracts`

Verwenden Sie `contracts` nur für statische Metadaten zur Besitzerschaft von Fähigkeiten, die OpenClaw
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

| Feld                             | Typ        | Bedeutung                                                       |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Speech-Provider-IDs, die diesem Plugin gehören.                 |
| `realtimeTranscriptionProviders` | `string[]` | IDs von Realtime-Transcription-Providern, die diesem Plugin gehören. |
| `realtimeVoiceProviders`         | `string[]` | IDs von Realtime-Voice-Providern, die diesem Plugin gehören.    |
| `mediaUnderstandingProviders`    | `string[]` | IDs von Media-Understanding-Providern, die diesem Plugin gehören. |
| `imageGenerationProviders`       | `string[]` | IDs von Image-Generation-Providern, die diesem Plugin gehören.  |
| `videoGenerationProviders`       | `string[]` | IDs von Video-Generation-Providern, die diesem Plugin gehören.  |
| `webFetchProviders`              | `string[]` | IDs von Web-Fetch-Providern, die diesem Plugin gehören.         |
| `webSearchProviders`             | `string[]` | IDs von Web-Search-Providern, die diesem Plugin gehören.        |
| `tools`                          | `string[]` | Namen von Agent-Tools, die diesem Plugin für gebündelte Vertragsprüfungen gehören. |

## Referenz zu `channelConfigs`

Verwenden Sie `channelConfigs`, wenn ein Kanal-Plugin vor dem Laden der
Laufzeit leichtgewichtige Konfigurationsmetadaten benötigt.

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

| Feld          | Typ                      | Bedeutung                                                                                      |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON-Schema für `channels.<id>`. Für jeden deklarierten Kanal-Konfigurationseintrag erforderlich. |
| `uiHints`     | `Record<string, object>` | Optionale UI-Labels/Platzhalter/Hinweise zur Sensitivität für diesen Kanal-Konfigurationsabschnitt. |
| `label`       | `string`                 | Kanal-Label, das in Auswahl- und Inspektionsoberflächen zusammengeführt wird, wenn Laufzeitmetadaten noch nicht bereit sind. |
| `description` | `string`                 | Kurze Kanalbeschreibung für Inspektions- und Katalogoberflächen.                               |
| `preferOver`  | `string[]`               | Veraltete oder weniger priorisierte Plugin-IDs, die dieser Kanal in Auswahloberflächen übertreffen soll. |

## Referenz zu `modelSupport`

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

OpenClaw wendet dabei folgende Priorität an:

- explizite Referenzen im Format `provider/model` verwenden die Manifest-Metadaten der besitzenden `providers`
- `modelPatterns` haben Vorrang vor `modelPrefixes`
- wenn sowohl ein nicht gebündeltes Plugin als auch ein gebündeltes Plugin übereinstimmen, gewinnt das nicht gebündelte Plugin
- verbleibende Mehrdeutigkeit wird ignoriert, bis der Benutzer oder die Konfiguration einen Provider angibt

Felder:

| Feld            | Typ        | Bedeutung                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Präfixe, die mit `startsWith` gegen Kurzform-Modell-IDs abgeglichen werden. |
| `modelPatterns` | `string[]` | Regex-Quellen, die nach dem Entfernen des Profilsuffixes gegen Kurzform-Modell-IDs abgeglichen werden. |

Veraltete Fähigkeits-Schlüssel auf oberster Ebene sind deprecated. Verwenden Sie `openclaw doctor --fix`, um
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` und `webSearchProviders` unter `contracts` zu verschieben;
das normale Laden von Manifesten behandelt diese Felder auf oberster Ebene nicht mehr als
Fähigkeits-Besitzerschaft.

## Manifest im Vergleich zu package.json

Die beiden Dateien erfüllen unterschiedliche Aufgaben:

| Datei                  | Verwendung                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, Konfigurationsvalidierung, Authentifizierungswahl-Metadaten und UI-Hinweise, die vorhanden sein müssen, bevor Plugin-Code ausgeführt wird |
| `package.json`         | npm-Metadaten, Installation von Abhängigkeiten und der Block `openclaw`, der für Einstiegspunkte, Installations-Gating, Setup oder Katalogmetadaten verwendet wird |

Wenn Sie nicht sicher sind, wohin ein Metadatenelement gehört, verwenden Sie diese Regel:

- wenn OpenClaw es vor dem Laden von Plugin-Code kennen muss, gehört es in `openclaw.plugin.json`
- wenn es um Paketierung, Einstiegsdateien oder das npm-Installationsverhalten geht, gehört es in `package.json`

### `package.json`-Felder, die Discovery beeinflussen

Einige Plugin-Metadaten vor der Laufzeit befinden sich absichtlich im `openclaw`-Block von `package.json`
anstatt in `openclaw.plugin.json`.

Wichtige Beispiele:

| Feld                                                              | Bedeutung                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Deklariert native Plugin-Einstiegspunkte.                                                   |
| `openclaw.setupEntry`                                             | Leichtgewichtiger Einstiegspunkt nur für Setup, verwendet während Onboarding und verzögertem Kanalstart. |
| `openclaw.channel`                                                | Leichtgewichtige Kanal-Katalogmetadaten wie Labels, Dokumentationspfade, Aliase und Auswahltexte. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hinweise für Installation/Aktualisierung von gebündelten und extern veröffentlichten Plugins. |
| `openclaw.install.defaultChoice`                                  | Bevorzugter Installationspfad, wenn mehrere Installationsquellen verfügbar sind.            |
| `openclaw.install.minHostVersion`                                 | Mindestunterstützte OpenClaw-Host-Version mit einer Semver-Untergrenze wie `>=2026.3.22`.   |
| `openclaw.install.allowInvalidConfigRecovery`                     | Erlaubt einen eng begrenzten Wiederherstellungspfad für die Neuinstallation gebündelter Plugins bei ungültiger Konfiguration. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Ermöglicht das Laden von Kanaloberflächen nur für das Setup vor dem vollständigen Kanal-Plugin während des Starts. |

`openclaw.install.minHostVersion` wird während der Installation und beim Laden der
Manifest-Registry erzwungen. Ungültige Werte werden abgelehnt; neuere, aber gültige Werte überspringen das
Plugin auf älteren Hosts.

`openclaw.install.allowInvalidConfigRecovery` ist absichtlich eng begrenzt. Es
macht nicht beliebige defekte Konfigurationen installierbar. Derzeit erlaubt es nur Installationsabläufen die
Wiederherstellung nach bestimmten veralteten Upgrade-Fehlern bei gebündelten Plugins, zum Beispiel einem
fehlenden Pfad zu einem gebündelten Plugin oder einem veralteten `channels.<id>`-Eintrag für dasselbe
gebündelte Plugin. Nicht zusammenhängende Konfigurationsfehler blockieren die Installation weiterhin und schicken Betreiber zu `openclaw doctor --fix`.

## JSON-Schema-Anforderungen

- **Jedes Plugin muss ein JSON-Schema mitliefern**, auch wenn es keine Konfiguration akzeptiert.
- Ein leeres Schema ist zulässig (zum Beispiel `{ "type": "object", "additionalProperties": false }`).
- Schemata werden beim Lesen/Schreiben der Konfiguration validiert, nicht zur Laufzeit.

## Validierungsverhalten

- Unbekannte `channels.*`-Schlüssel sind **Fehler**, es sei denn, die Kanal-ID wird
  durch ein Plugin-Manifest deklariert.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` und `plugins.slots.*`
  müssen auf **auffindbare** Plugin-IDs verweisen. Unbekannte IDs sind **Fehler**.
- Wenn ein Plugin installiert ist, aber ein defektes oder fehlendes Manifest oder Schema hat,
  schlägt die Validierung fehl und Doctor meldet den Plugin-Fehler.
- Wenn eine Plugin-Konfiguration existiert, das Plugin aber **deaktiviert** ist, wird die Konfiguration beibehalten und
  eine **Warnung** in Doctor + Protokollen ausgegeben.

Die vollständige `plugins.*`-Struktur finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration).

## Hinweise

- Das Manifest ist **für native OpenClaw-Plugins erforderlich**, einschließlich lokaler Dateisystem-Ladevorgänge.
- Zur Laufzeit wird das Plugin-Modul weiterhin separat geladen; das Manifest dient nur
  der Discovery + Validierung.
- Native Manifeste werden mit JSON5 geparst, daher sind Kommentare, nachgestellte Kommata und
  nicht in Anführungszeichen gesetzte Schlüssel zulässig, solange der endgültige Wert weiterhin ein Objekt ist.
- Nur dokumentierte Manifestfelder werden vom Manifest-Loader gelesen. Vermeiden Sie es,
  hier benutzerdefinierte Schlüssel auf oberster Ebene hinzuzufügen.
- `providerAuthEnvVars` ist der leichtgewichtige Metadatenpfad für Authentifizierungsprüfungen, Validierung von
  Umgebungsmarkern und ähnliche Provider-Auth-Oberflächen, die die Plugin-Laufzeit nicht starten sollten, nur um Umgebungsnamen zu prüfen.
- `providerAuthChoices` ist der leichtgewichtige Metadatenpfad für Auswahlen von Authentifizierungsoptionen,
  die Auflösung von `--auth-choice`, Zuordnung bevorzugter Provider und einfache Registrierung von
  CLI-Flags im Onboarding, bevor die Provider-Laufzeit geladen wird. Für Laufzeit-
  Wizard-Metadaten, die Provider-Code erfordern, siehe
  [Provider-Laufzeit-Hooks](/plugins/architecture#provider-runtime-hooks).
- Exklusive Plugin-Arten werden über `plugins.slots.*` ausgewählt.
  - `kind: "memory"` wird über `plugins.slots.memory` ausgewählt.
  - `kind: "context-engine"` wird über `plugins.slots.contextEngine`
    ausgewählt (Standard: eingebautes `legacy`).
- `channels`, `providers`, `cliBackends` und `skills` können weggelassen werden, wenn ein
  Plugin sie nicht benötigt.
- Wenn Ihr Plugin von nativen Modulen abhängt, dokumentieren Sie die Build-Schritte und alle
  Anforderungen an die Paketmanager-Allowlist (zum Beispiel pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Verwandt

- [Plugins erstellen](/plugins/building-plugins) — Erste Schritte mit Plugins
- [Plugin-Architektur](/plugins/architecture) — interne Architektur
- [SDK-Überblick](/plugins/sdk-overview) — Referenz zum Plugin SDK
