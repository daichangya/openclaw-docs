---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie betreuen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Migrieren Sie von der alten Abwärtskompatibilitätsschicht zum modernen Plugin SDK
title: Plugin SDK-Migration
x-i18n:
    generated_at: "2026-04-05T12:52:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c420b8d7de17aee16c5aa67e3a88da5750f0d84b07dd541f061081080e081196
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK-Migration

OpenClaw hat sich von einer breiten Abwärtskompatibilitätsschicht zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Importen entwickelt. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins
alles importieren konnten, was sie über einen einzigen Einstiegspunkt benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von
  Hilfsfunktionen reexportierte. Er wurde eingeführt, um ältere hookbasierte Plugins
  funktionsfähig zu halten, während die neue Plugin-Architektur entwickelt wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Hilfsfunktionen wie den eingebetteten Agent-Runner gab.

Beide Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit noch, aber neue
Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten migriert werden, bevor die
nächste Hauptversion sie entfernt.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einer zukünftigen Hauptversion entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — der Import einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** — breite Reexports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin SDK behebt das: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, eigenständiges Modul mit klarem Zweck und dokumentiertem Vertrag.

Veraltete Komfortschnittstellen für Provider bei gebündelten Kanälen sind ebenfalls entfernt.
Importe wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanalmarkenspezifische Hilfsschnittstellen sowie
`openclaw/plugin-sdk/telegram-core` waren private Monorepo-Abkürzungen, keine
stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Subpaths. Innerhalb des
Workspace für gebündelte Plugins sollten providerspezifische Hilfsfunktionen im eigenen
`api.ts` oder `runtime-api.ts` dieses Plugins verbleiben.

Aktuelle Beispiele gebündelter Provider:

- Anthropic behält Claude-spezifische Stream-Hilfsfunktionen in der eigenen Schnittstelle `api.ts` /
  `contract-api.ts`
- OpenAI behält Provider-Builder, Hilfsfunktionen für Standardmodelle und Builder für Echtzeit-Provider
  in der eigenen `api.ts`
- OpenRouter behält Provider-Builder sowie Hilfsfunktionen für Onboarding/Konfiguration in der eigenen
  `api.ts`

## So migrieren Sie

<Steps>
  <Step title="Fallback-Verhalten des Windows-Wrappers prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    Wrapper `.cmd`/`.bat` jetzt standardmäßig fehl, sofern Sie nicht explizit
    `allowShellFallback: true` übergeben.

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Nur für vertrauenswürdige Kompatibilitätsaufrufer setzen, die
      // absichtlich einen shellvermittelten Fallback akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer nicht absichtlich auf einen Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Veraltete Importe finden">
    Durchsuchen Sie Ihr Plugin nach Importen aus einer der beiden veralteten Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Importe ersetzen">
    Jeder Export aus der alten Oberfläche wird einem bestimmten modernen Importpfad zugeordnet:

    ```typescript
    // Vorher (veraltete Abwärtskompatibilitätsschicht)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Nachher (moderne fokussierte Importe)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Verwenden Sie für hostseitige Hilfsfunktionen die injizierte Plugin-Runtime, anstatt direkt zu importieren:

    ```typescript
    // Vorher (veraltete extension-api-Brücke)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Nachher (injizierte Runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere alte Brückenhilfsfunktionen:

    | Alter Import | Modernes Äquivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Hilfsfunktionen für Session-Store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build und Tests ausführen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz der Importpfade

<Accordion title="Tabelle häufiger Importpfade">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonische Hilfsfunktion für den Plugin-Einstiegspunkt | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter gebündelter Reexport für Kanal-Einstiegsdefinitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Hilfsfunktion für Einstiegspunkte mit einem einzelnen Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Kanal-Einstiegsdefinitionen und -Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für Setup-Wizards | Allowlist-Prompts, Builder für Setup-Status |
  | `plugin-sdk/setup-runtime` | Runtime-Hilfsfunktionen zur Setup-Zeit | Importsichere Setup-Patch-Adapter, Hilfsfunktionen für Lookup-Notizen, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Hilfsfunktionen für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Setup-Tools | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Konten | Hilfsfunktionen für Kontoliste/Konfiguration/Aktions-Gating |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für Konto-Lookups | Hilfsfunktionen für Konto-Lookups und Standard-Fallbacks |
  | `plugin-sdk/account-helpers` | Schmale Hilfsfunktionen für Konten | Hilfsfunktionen für Kontoliste/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für Setup-Wizards | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring für Antwortpräfixe und Tippstatus | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemata | Typen für Kanal-Konfigurationsschemata |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Beschreibungs-Trimmen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Tracking des Kontostatus | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für eingehende Umschläge | Gemeinsame Hilfsfunktionen für Routen- und Umschlag-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsfunktionen für eingehende Antworten | Gemeinsame Hilfsfunktionen zum Aufzeichnen und Weiterleiten |
  | `plugin-sdk/messaging-targets` | Parsing von Messaging-Zielen | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-runtime` | Runtime-Hilfsfunktionen für ausgehende Nachrichten | Hilfsfunktionen für ausgehende Identität/Sendedelegation |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindings | Hilfsfunktionen für Thread-Binding-Lebenszyklus und Adapter |
  | `plugin-sdk/agent-media-payload` | Veraltete Hilfsfunktionen für Medien-Payloads | Builder für Agent-Medien-Payloads für veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur alte Kanal-Runtime-Hilfsfunktionen |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Runtime-Hilfsfunktionen | Hilfsfunktionen für Runtime/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Hilfsfunktionen für Runtime-Umgebungen | Hilfsfunktionen für Logger/Runtime-Umgebung, Timeout, Retry und Backoff |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen für Plugin-Runtime | Gemeinsame Hilfsfunktionen für Plugin-Befehle/Hooks/HTTP/interaktive Abläufe |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für Lazy Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozesshilfsfunktionen | Gemeinsame Hilfsfunktionen für Exec |
  | `plugin-sdk/cli-runtime` | CLI-Runtime-Hilfsfunktionen | Hilfsfunktionen für Befehlsformatierung, Waits, Versionen |
  | `plugin-sdk/gateway-runtime` | Gateway-Hilfsfunktionen | Hilfsfunktionen für Gateway-Client und Patches für Kanalstatus |
  | `plugin-sdk/config-runtime` | Konfigurationshilfsfunktionen | Hilfsfunktionen zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Fallback-stabile Validierungshilfsfunktionen für Telegram-Befehle, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Freigabe-Prompts | Payload für Exec-/Plugin-Freigaben, Hilfsfunktionen für Freigabefähigkeiten/-profile, native Freigaberouting-/Runtime-Hilfsfunktionen |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Freigabe-Authentifizierung | Auflösung von Genehmigenden, Authentifizierung von Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Freigabe-Clients | Hilfsfunktionen für native Exec-Freigabeprofile/-filter |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für Freigabezustellung | Native Adapter für Freigabefähigkeiten/-zustellung |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Freigabeziele | Native Hilfsfunktionen für Freigabeziel-/Kontobindung |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Freigabeantworten | Hilfsfunktionen für Antwort-Payloads bei Exec-/Plugin-Freigaben |
  | `plugin-sdk/security-runtime` | Sicherheitshilfsfunktionen | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | Runtime-Hilfsfunktionen für SSRF | Pinned-Dispatcher, geschütztes Fetch, SSRF-Richtlinien-Hilfsfunktionen |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen zur Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für umschlossenes Fetch/Proxy | `resolveFetch`, Proxy-Hilfsfunktionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen zur Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Hilfsfunktionen | `RetryConfig`, `retryAsync`, Richtlinien-Runner |
  | `plugin-sdk/allow-from` | Formatierung von Allowlists | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehls-Gating und Hilfsfunktionen für Befehlsoberflächen | `resolveControlCommandGate`, Hilfsfunktionen für Senderautorisierung, Hilfsfunktionen für Befehlsregistrierung |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Hilfsfunktionen für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen | Hilfsfunktionen für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Guards bei Webhook-Requests | Hilfsfunktionen zum Lesen/Begrenzen von Request-Bodies |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Runtime | Eingehende Weiterleitung, Heartbeat, Antwortplanung, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch | Hilfsfunktionen für Finalisierung und Provider-Dispatch |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwort-Chunks | Hilfsfunktionen für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Session-Stores | Hilfsfunktionen für Store-Pfade und updated-at |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für State-Pfade | Hilfsfunktionen für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Session-Keys | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Normalisierung von Session-Keys |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen für Kanalstatus | Builder für Kanal-/Kontostatus-Zusammenfassungen, Standards für Runtime-Status, Hilfsfunktionen für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen für Zielauflösung | Gemeinsame Hilfsfunktionen für Zielauflösung |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen zur String-Normalisierung | Hilfsfunktionen für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen für Request-URLs | String-URLs aus requestähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitgesteuerte Befehle | Timed-Command-Runner mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Parameter-Reader | Gemeinsame Parameter-Reader für Tool/CLI |
  | `plugin-sdk/tool-send` | Extraktion für Tool-Send | Extrahiert kanonische Ziel-Felder für Sendungen aus Tool-Argumenten |
  | `plugin-sdk/temp-path` | Hilfsfunktionen für Temp-Pfade | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Hilfsfunktionen | Logger für Subsysteme und Hilfsfunktionen für Redaction |
  | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellen | Hilfsfunktionen für Markdown-Tabellenmodi |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für Setup lokaler/selbstgehosteter Provider | Hilfsfunktionen für Erkennung/Konfiguration selbstgehosteter Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für Setup selbstgehosteter OpenAI-kompatibler Provider | Dieselben Hilfsfunktionen für Erkennung/Konfiguration selbstgehosteter Provider |
  | `plugin-sdk/provider-auth-runtime` | Runtime-Hilfsfunktionen für Provider-Authentifizierung | Hilfsfunktionen zur Auflösung von API-Schlüsseln zur Laufzeit |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für Setup von Provider-API-Schlüsseln | Hilfsfunktionen für Onboarding/Profilschreibung mit API-Schlüsseln |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Auth-Resultate | Standard-Builder für OAuth-Auth-Resultate |
  | `plugin-sdk/provider-auth-login` | Interaktive Hilfsfunktionen für Provider-Login | Gemeinsame Hilfsfunktionen für interaktiven Login |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Umgebungsvariablen | Hilfsfunktionen für Lookup von Auth-Umgebungsvariablen bei Providern |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen für Provider-Modelle/Replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfsfunktionen für Provider-Endpunkte und Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches für Provider-Onboarding | Hilfsfunktionen für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Hilfsfunktionen für Provider-HTTP | Generische Hilfsfunktionen für Provider-HTTP/Endpunktfähigkeiten |
  | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Web-Fetch bei Providern | Hilfsfunktionen für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Websuche bei Providern | Hilfsfunktionen für Registrierung/Cache/Konfiguration von Websuch-Providern |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnose sowie xAI-Kompatibilitätshilfen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hilfsfunktionen für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und andere Hilfsfunktionen zur Providernutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper sowie gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medienhilfsfunktionen | Hilfsfunktionen für Abruf/Transformation/Speicherung von Medien sowie Builder für Medien-Payloads |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen für Medienverständnis | Typen für Provider von Medienverständnis sowie providerseitige Exporte für Bild-/Audio-Hilfsfunktionen |
  | `plugin-sdk/text-runtime` | Gemeinsame Texthilfsfunktionen | Entfernen von für Assistenten sichtbarem Text, Hilfsfunktionen für Rendern/Chunking/Tabellen in Markdown, Redaction-Hilfsfunktionen, Hilfsfunktionen für Direktive-Tags, Safe-Text-Hilfsfunktionen und verwandte Text-/Logging-Hilfsfunktionen |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text-Chunking | Hilfsfunktion für Chunking ausgehender Texte |
  | `plugin-sdk/speech` | Sprachhilfsfunktionen | Typen für Sprach-Provider sowie providerseitige Hilfsfunktionen für Direktiven, Registries und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Sprach-Core | Typen für Sprach-Provider, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsfunktionen für Echtzeit-Transkription | Provider-Typen und Hilfsfunktionen für Registries |
  | `plugin-sdk/realtime-voice` | Hilfsfunktionen für Echtzeit-Sprache | Provider-Typen und Hilfsfunktionen für Registries |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Typen für Bildgenerierung, Failover, Authentifizierung und Hilfsfunktionen für Registries |
  | `plugin-sdk/video-generation` | Hilfsfunktionen für Videogenerierung | Typen für Video-Provider/Requests/Ergebnisse |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Typen für Videogenerierung, Hilfsfunktionen für Failover, Provider-Lookup und Parsing von Modell-Referenzen |
  | `plugin-sdk/interactive-runtime` | Hilfsfunktionen für interaktive Antworten | Normalisierung/Reduktion interaktiver Antwort-Payloads |
  | `plugin-sdk/channel-config-primitives` | Primitive für Kanal-Konfiguration | Schmale Primitive für Kanal-Konfigurationsschemata |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Konfigurationsschreibvorgänge bei Kanälen | Hilfsfunktionen zur Autorisierung von Kanal-Konfigurationsschreibvorgängen |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Präludium | Gemeinsame Exporte des Kanal-Präludiums |
  | `plugin-sdk/channel-status` | Hilfsfunktionen für Kanalstatus | Gemeinsame Hilfsfunktionen für Snapshots/Zusammenfassungen des Kanalstatus |
  | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen für Allowlist-Konfiguration | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
  | `plugin-sdk/group-access` | Hilfsfunktionen für Gruppenzugriff | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Hilfsfunktionen für direkte DMs | Gemeinsame Hilfsfunktionen für Authentifizierung/Guards bei direkten DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Hilfsfunktionen für Erweiterungen | Primitive Hilfsfunktionen für passive Kanäle/Status |
  | `plugin-sdk/webhook-targets` | Hilfsfunktionen für Webhook-Ziele | Registry für Webhook-Ziele und Hilfsfunktionen für Routeninstallation |
  | `plugin-sdk/webhook-path` | Hilfsfunktionen für Webhook-Pfade | Hilfsfunktionen zur Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen für Web-Medien | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Zod-Reexport | Reexportiertes `zod` für Plugin SDK-Konsumenten |
  | `plugin-sdk/memory-core` | Gebündelte Hilfsfunktionen für memory-core | Hilfsoberfläche für Speicherverwaltung/Konfiguration/Datei/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade der Memory-Engine | Runtime-Fassade für Speicherindex/-suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine für Memory-Host | Exporte der Foundation-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine für Memory-Host | Exporte der Embedding-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine für Memory-Host | Exporte der QMD-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine für Memory-Host | Exporte der Storage-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen für Memory-Host | Multimodale Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-query` | Query-Hilfsfunktionen für Memory-Host | Query-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsfunktionen für Memory-Host | Secret-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-status` | Status-Hilfsfunktionen für Memory-Host | Status-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime für Memory-Host | CLI-Runtime-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime für Memory-Host | Core-Runtime-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsfunktionen für Memory-Host | Datei-/Runtime-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsfunktionen für memory-lancedb | Hilfsoberfläche für memory-lancedb |
  | `plugin-sdk/testing` | Testwerkzeuge | Testhilfsfunktionen und Mocks |
</Accordion>

Diese Tabelle ist absichtlich nur die häufige Migrations-Teilmenge und nicht die vollständige SDK-
Oberfläche. Die vollständige Liste mit über 200 Einstiegspunkten befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Hilfsschnittstellen für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die Wartung gebündelter
Plugins und aus Kompatibilitätsgründen exportiert, werden aber absichtlich
nicht in der häufigen Migrationstabelle aufgeführt und sind nicht das empfohlene Ziel für
neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Hilfsfunktionen wie:

- Browser-Unterstützungshilfen: `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- gebündelte Hilfs-/Plugin-Oberflächen wie `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` und `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` stellt derzeit die schmale Token-Hilfsoberfläche
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwenden Sie den schmalsten Import, der zur Aufgabe passt. Wenn Sie einen Export nicht finden können,
prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie in Discord nach.

## Zeitplan für die Entfernung

| Wann | Was passiert |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt** | Veraltete Oberflächen geben Laufzeitwarnungen aus |
| **Nächste Hauptversion** | Veraltete Oberflächen werden entfernt; Plugins, die sie weiter verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor der
nächsten Hauptversion migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein vorübergehender Ausweg, keine dauerhafte Lösung.

## Verwandt

- [Erste Schritte](/plugins/building-plugins) — Ihr erstes Plugin erstellen
- [SDK Overview](/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [Kanal-Plugins](/plugins/sdk-channel-plugins) — Kanal-Plugins erstellen
- [Provider-Plugins](/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
- [Plugin-Interna](/plugins/architecture) — tiefer Einblick in die Architektur
- [Plugin-Manifest](/plugins/manifest) — Referenz für das Manifest-Schema
