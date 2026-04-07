---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Migration von der Legacy-Abwärtskompatibilitätsschicht zum modernen Plugin SDK
title: Plugin SDK Migration
x-i18n:
    generated_at: "2026-04-07T06:18:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3691060e9dc00ca8bee49240a047f0479398691bd14fb96e9204cc9243fdb32c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK Migration

OpenClaw ist von einer breiten Abwärtskompatibilitätsschicht zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Imports übergegangen. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen diese Anleitung bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins
alles importieren konnten, was sie von einem einzigen Einstiegspunkt benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von
  Hilfsfunktionen re-exportierte. Er wurde eingeführt, um ältere Hook-basierte Plugins funktionsfähig zu halten, während die
  neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Hilfsfunktionen wie den eingebetteten Agent-Runner gab.

Beide Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit weiterhin, aber neue
Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten vor dem nächsten
Major-Release migriert werden, in dem sie entfernt werden.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einem zukünftigen Major-Release entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — der Import einer einzelnen Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, in sich geschlossenes Modul mit einem klaren Zweck und einem dokumentierten Vertrag.

Legacy-Komfortschnittstellen für Provider bei gebündelten Kanälen sind ebenfalls verschwunden. Imports
wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanalmarkenspezifische Hilfsschnittstellen und
`openclaw/plugin-sdk/telegram-core` waren private Mono-Repo-Abkürzungen, keine
stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Subpfade. Innerhalb des
gebündelten Plugin-Workspaces halten Sie provider-eigene Hilfsfunktionen im eigenen
`api.ts` oder `runtime-api.ts` dieses Plugins.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic hält Claude-spezifische Stream-Hilfsfunktionen in seiner eigenen `api.ts` /
  `contract-api.ts`-Schnittstelle
- OpenAI hält Provider-Builder, Default-Model-Hilfsfunktionen und Realtime-Provider-
  Builder in seiner eigenen `api.ts`
- OpenRouter hält Provider-Builder und Onboarding-/Konfigurationshilfsfunktionen in seiner eigenen
  `api.ts`

## So migrieren Sie

<Steps>
  <Step title="Fallback-Verhalten des Windows-Wrappers prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    `.cmd`/`.bat`-Wrapper jetzt standardmäßig fehl, sofern Sie nicht explizit
    `allowShellFallback: true` übergeben.

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Setzen Sie dies nur für vertrauenswürdige Kompatibilitätsaufrufer, die
      // einen Shell-vermittelten Fallback absichtlich akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer nicht absichtlich auf einen Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Veraltete Imports finden">
    Durchsuchen Sie Ihr Plugin nach Imports aus einer der beiden veralteten Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Imports ersetzen">
    Jeder Export aus der alten Oberfläche wird einem bestimmten modernen Importpfad zugeordnet:

    ```typescript
    // Vorher (veraltete Abwärtskompatibilitätsschicht)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Nachher (moderne fokussierte Imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Verwenden Sie für hostseitige Hilfsfunktionen die injizierte Plugin-Laufzeit, statt direkt
    zu importieren:

    ```typescript
    // Vorher (veraltete extension-api-Brücke)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Nachher (injizierte Laufzeit)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere Legacy-Brückenhilfsfunktionen:

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

## Referenz für Importpfade

<Accordion title="Tabelle häufiger Importpfade">
  | Importpfad | Zweck | Zentrale Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonische Hilfsfunktion für Plugin-Einstiegspunkte | `definePluginEntry` |
  | `plugin-sdk/core` | Legacy-Sammel-Re-Export für Kanal-Einstiegsdefinitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Hilfsfunktion für Einstiegspunkte mit einem einzelnen Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Kanal-Einstiegsdefinitionen und -Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für den Einrichtungsassistenten | Allowlist-Prompts, Builder für Einrichtungsstatus |
  | `plugin-sdk/setup-runtime` | Laufzeit-Hilfsfunktionen für die Einrichtung | Importsichere Setup-Patch-Adapter, Hilfsfunktionen für Lookup-Hinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Hilfsfunktionen für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Setup-Tools | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Konten | Hilfsfunktionen für Kontolisten/Konfiguration/Aktions-Gates |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für Kontosuche | Hilfsfunktionen für Kontosuche + Standard-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Kontohilfsfunktionen | Hilfsfunktionen für Kontolisten/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für Einrichtungsassistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive Bausteine für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verkabelung für Antwortpräfixe + Tippen | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemata | Typen für Kanal-Konfigurationsschemata |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Duplikat-/Konfliktvalidierung |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Nachverfolgung des Kontostatus | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für eingehende Envelopes | Gemeinsame Hilfsfunktionen für Routing- + Envelope-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsfunktionen für eingehende Antworten | Gemeinsame Hilfsfunktionen zum Erfassen und Dispatchen |
  | `plugin-sdk/messaging-targets` | Parsen von Nachrichtenzielen | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-runtime` | Laufzeit-Hilfsfunktionen für ausgehende Nachrichten | Hilfsfunktionen für ausgehende Identität/Sendedelegation |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindings | Hilfsfunktionen für Thread-Binding-Lebenszyklus und Adapter |
  | `plugin-sdk/agent-media-payload` | Legacy-Hilfsfunktionen für Medien-Payloads | Builder für Agent-Medien-Payloads für Legacy-Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur Legacy-Kanal-Laufzeitdienstprogramme |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Laufzeit-Hilfsfunktionen | Laufzeit-/Logging-/Backup-/Plugin-Installationshilfsfunktionen |
  | `plugin-sdk/runtime-env` | Schmale Laufzeit-Hilfsfunktionen für Umgebung | Logger/Laufzeitumgebung, Timeout-, Retry- und Backoff-Hilfsfunktionen |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Laufzeit-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für Plugin-Befehle/Hooks/HTTP/interaktive Funktionen |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für Lazy Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozess-Hilfsfunktionen | Gemeinsame Exec-Hilfsfunktionen |
  | `plugin-sdk/cli-runtime` | CLI-Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Befehlsformatierung, Wartezeiten und Versionen |
  | `plugin-sdk/gateway-runtime` | Gateway-Hilfsfunktionen | Gateway-Client und Patch-Hilfsfunktionen für Kanalstatus |
  | `plugin-sdk/config-runtime` | Konfigurationshilfsfunktionen | Hilfsfunktionen zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Fallback-stabile Hilfsfunktionen zur Telegram-Befehlsvalidierung, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Genehmigungsaufforderungen | Hilfsfunktionen für Payloads von Exec-/Plugin-Genehmigungen, Fähigkeiten/Profilen von Genehmigungen, natives Genehmigungsrouting/-runtime |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Genehmigungsauthentifizierung | Genehmigerauflösung, Autorisierung für Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Genehmigungs-Clients | Hilfsfunktionen für natives Exec-Genehmigungsprofil/-filter |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für Genehmigungszustellung | Adapter für native Genehmigungsfähigkeiten/-zustellung |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Genehmigungsziele | Hilfsfunktionen für native Genehmigungsziele/Kontobindung |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Genehmigungsantworten | Hilfsfunktionen für Antwort-Payloads von Exec-/Plugin-Genehmigungen |
  | `plugin-sdk/security-runtime` | Sicherheits-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte und Sammlung von Geheimnissen |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Pinned Dispatcher, geschütztes Fetch und SSRF-Richtlinien |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen zur Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für umschlossenes Fetch/Proxy | `resolveFetch`, Proxy-Hilfsfunktionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen zur Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Hilfsfunktionen | `RetryConfig`, `retryAsync`, Richtlinien-Runner |
  | `plugin-sdk/allow-from` | Formatierung von Allowlists | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehlsgating- und Befehlsschnittstellen-Hilfsfunktionen | `resolveControlCommandGate`, Hilfsfunktionen für Senderautorisierung, Hilfsfunktionen für Befehlsregistrierung |
  | `plugin-sdk/secret-input` | Parsen geheimer Eingaben | Hilfsfunktionen für geheime Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen | Dienstprogramme für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Guards von Webhook-Bodys | Hilfsfunktionen zum Lesen/Begrenzen von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Laufzeit | Eingehendes Dispatching, Heartbeat, Antwortplaner, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch | Hilfsfunktionen zum Finalisieren + Provider-Dispatch |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwort-Chunks | Hilfsfunktionen für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Session-Store | Hilfsfunktionen für Store-Pfade + updated-at |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für Statuspfade | Hilfsfunktionen für Status- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Sitzungsschlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Normalisierung von Sitzungsschlüsseln |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen für Kanalstatus | Builder für Zusammenfassungen von Kanal-/Kontostatus, Standardwerte für Laufzeitstatus, Hilfsfunktionen für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen für Zielauflösung | Gemeinsame Hilfsfunktionen für Zielauflösung |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen zur String-Normalisierung | Hilfsfunktionen zur Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen für Request-URLs | String-URLs aus request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitgesteuerte Befehle | Zeitgesteuerter Befehlsrunner mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Allgemeine Param-Reader für Tools/CLI |
  | `plugin-sdk/tool-send` | Extraktion für Tool-Sendungen | Kanonische Sendefelder aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Hilfsfunktionen für temporäre Pfade | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Hilfsfunktionen | Subsystem-Logger und Redaktionshilfsfunktionen |
  | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellen | Hilfsfunktionen für Modi von Markdown-Tabellen |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für die Einrichtung lokaler/self-hosted Provider | Hilfsfunktionen für Erkennung/Konfiguration self-hosted Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für die Einrichtung OpenAI-kompatibler self-hosted Provider | Dieselben Hilfsfunktionen für Erkennung/Konfiguration self-hosted Provider |
  | `plugin-sdk/provider-auth-runtime` | Laufzeit-Hilfsfunktionen für Provider-Authentifizierung | Hilfsfunktionen zur Auflösung von API-Schlüsseln zur Laufzeit |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen zur Einrichtung von Provider-API-Schlüsseln | Hilfsfunktionen für API-Key-Onboarding/Profilschreibung |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Auth-Ergebnisse | Standard-Builder für OAuth-Auth-Ergebnisse |
  | `plugin-sdk/provider-auth-login` | Hilfsfunktionen für interaktive Provider-Anmeldung | Gemeinsame Hilfsfunktionen für interaktive Anmeldung |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Umgebungsvariablen | Hilfsfunktionen für Suche von Provider-Auth-Umgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen für Provider-Modelle/-Replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfsfunktionen für Provider-Endpunkte und Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Onboarding-Patches für Provider | Hilfsfunktionen für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Hilfsfunktionen für Provider-HTTP | Generische Hilfsfunktionen für Provider-HTTP/Endpunkt-Fähigkeiten |
  | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Provider-Web-Fetch | Hilfsfunktionen für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search-contract` | Hilfsfunktionen für Web-Search-Verträge von Providern | Schmale Hilfsfunktionen für Verträge von Web-Search-Konfigurationen/-Anmeldedaten wie `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und konturierte Setter/Getter für Anmeldedaten |
  | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Provider-Websuche | Hilfsfunktionen für Registrierung/Cache/Laufzeit von Websuch-Providern |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für Provider-Tools/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnose und xAI-Kompatibilitätshilfsfunktionen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hilfsfunktionen für Providernutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und andere Hilfsfunktionen für Providernutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medien-Hilfsfunktionen | Hilfsfunktionen für Abruf/Transformation/Speicherung von Medien plus Builder für Medien-Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Mediengenerierung | Gemeinsame Failover-Hilfsfunktionen, Kandidatenauswahl und Meldungen für fehlende Modelle bei Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen für Medienverständnis | Typen für Media-Understanding-Provider plus providerseitige Bild-/Audio-Hilfsexporte |
  | `plugin-sdk/text-runtime` | Gemeinsame Text-Hilfsfunktionen | Entfernen assistant-sichtbarer Texte, Hilfsfunktionen für Markdown-Rendering/Chunking/Tabellen, Redaktionshilfsfunktionen, Directive-Tag-Hilfsfunktionen, Safe-Text-Dienstprogramme und verwandte Hilfsfunktionen für Text/Logging |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text-Chunking | Hilfsfunktion für ausgehendes Text-Chunking |
  | `plugin-sdk/speech` | Hilfsfunktionen für Sprache | Typen für Speech-Provider plus providerseitige Hilfsfunktionen für Direktiven, Registry und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Sprach-Core | Typen für Speech-Provider, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsfunktionen für Realtime-Transkription | Typen und Registry-Hilfsfunktionen für Provider |
  | `plugin-sdk/realtime-voice` | Hilfsfunktionen für Realtime-Voice | Typen und Registry-Hilfsfunktionen für Provider |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Hilfsfunktionen für Typen, Failover, Auth und Registry der Bildgenerierung |
  | `plugin-sdk/music-generation` | Hilfsfunktionen für Musikgenerierung | Typen für Musikgenerierungs-Provider/-Requests/-Ergebnisse |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Typen für Musikgenerierung, Failover-Hilfsfunktionen, Providersuche und Parsing von Modellreferenzen |
  | `plugin-sdk/video-generation` | Hilfsfunktionen für Videogenerierung | Typen für Videogenerierungs-Provider/-Requests/-Ergebnisse |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Typen für Videogenerierung, Failover-Hilfsfunktionen, Providersuche und Parsing von Modellreferenzen |
  | `plugin-sdk/interactive-runtime` | Hilfsfunktionen für interaktive Antworten | Normalisierung/Reduktion von Payloads interaktiver Antworten |
  | `plugin-sdk/channel-config-primitives` | Primitive Bausteine für Kanalkonfiguration | Schmale Primitive für Kanal-Konfigurationsschemata |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Schreibvorgänge in Kanalkonfigurationen | Autorisierungshilfsfunktionen für Schreibvorgänge in Kanalkonfigurationen |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Prelude | Gemeinsame Prelude-Exporte für Kanal-Plugins |
  | `plugin-sdk/channel-status` | Hilfsfunktionen für Kanalstatus | Gemeinsame Hilfsfunktionen für Snapshots/Zusammenfassungen von Kanalstatus |
  | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen für Allowlist-Konfiguration | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Hilfsfunktionen für Gruppenzugriff | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Hilfsfunktionen für direkte DMs | Gemeinsame Hilfsfunktionen für Auth/Guards bei direkten DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Erweiterungs-Hilfsfunktionen | Primitive Hilfsfunktionen für passive Kanal-/Status- und Ambient-Proxy-Funktionen |
  | `plugin-sdk/webhook-targets` | Hilfsfunktionen für Webhook-Ziele | Registry für Webhook-Ziele und Hilfsfunktionen zur Routeninstallation |
  | `plugin-sdk/webhook-path` | Hilfsfunktionen für Webhook-Pfade | Hilfsfunktionen zur Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen für Web-Medien | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` für Plugin-SDK-Konsumenten |
  | `plugin-sdk/memory-core` | Gebündelte Hilfsfunktionen für memory-core | Oberfläche für Hilfsfunktionen von Memory-Manager/Konfiguration/Datei/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Memory-Engine | Laufzeit-Fassade für Memory-Index/-Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine für Memory-Host | Exporte der Foundation-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine für Memory-Host | Exporte der Embedding-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine für Memory-Host | Exporte der QMD-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine für Memory-Host | Exporte der Storage-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen für Memory-Host | Multimodale Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-query` | Query-Hilfsfunktionen für Memory-Host | Query-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsfunktionen für Memory-Host | Secret-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-events` | Hilfsfunktionen für Event-Journal von Memory-Host | Hilfsfunktionen für Event-Journal von Memory-Host |
  | `plugin-sdk/memory-core-host-status` | Hilfsfunktionen für Status von Memory-Host | Hilfsfunktionen für Status von Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeit für Memory-Host | CLI-Laufzeit-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-Laufzeit für Memory-Host | Core-Laufzeit-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-files` | Hilfsfunktionen für Dateien/Laufzeit von Memory-Host | Hilfsfunktionen für Dateien/Laufzeit von Memory-Host |
  | `plugin-sdk/memory-host-core` | Alias für Core-Laufzeit von Memory-Host | Anbieterneutraler Alias für Core-Laufzeit-Hilfsfunktionen von Memory-Host |
  | `plugin-sdk/memory-host-events` | Alias für Event-Journal von Memory-Host | Anbieterneutraler Alias für Hilfsfunktionen des Event-Journals von Memory-Host |
  | `plugin-sdk/memory-host-files` | Alias für Dateien/Laufzeit von Memory-Host | Anbieterneutraler Alias für Datei-/Laufzeit-Hilfsfunktionen von Memory-Host |
  | `plugin-sdk/memory-host-markdown` | Hilfsfunktionen für verwaltetes Markdown | Gemeinsame Hilfsfunktionen für verwaltetes Markdown bei speicherbezogenen Plugins |
  | `plugin-sdk/memory-host-search` | Fassade für aktive Memory-Suche | Lazy Laufzeit-Fassade für Search Manager der aktiven Memory-Suche |
  | `plugin-sdk/memory-host-status` | Alias für Status von Memory-Host | Anbieterneutraler Alias für Status-Hilfsfunktionen von Memory-Host |
  | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsfunktionen für memory-lancedb | Oberfläche für Hilfsfunktionen von memory-lancedb |
  | `plugin-sdk/testing` | Testdienstprogramme | Testhilfsfunktionen und Mocks |
</Accordion>

Diese Tabelle ist absichtlich nur der häufige Migrationsausschnitt, nicht die vollständige SDK-
Oberfläche. Die vollständige Liste mit mehr als 200 Einstiegspunkten befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Hilfsschnittstellen für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die
Pflege gebündelter Plugins und aus Kompatibilitätsgründen exportiert, werden aber bewusst
aus der häufigen Migrationstabelle ausgelassen und sind nicht das empfohlene Ziel für
neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Hilfsfunktionen, etwa:

- Hilfsfunktionen für Browser-Unterstützung: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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
| **Nächstes Major-Release** | Veraltete Oberflächen werden entfernt; Plugins, die sie weiterhin verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor dem nächsten Major-Release
migriert werden.

## Warnungen vorübergehend unterdrücken

Setzen Sie während der Migration diese Umgebungsvariablen:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein vorübergehender Ausweg, keine dauerhafte Lösung.

## Verwandt

- [Getting Started](/de/plugins/building-plugins) — Ihr erstes Plugin erstellen
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Imports
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Erstellen von Kanal-Plugins
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Erstellen von Provider-Plugins
- [Plugin Internals](/de/plugins/architecture) — tiefer Einblick in die Architektur
- [Plugin Manifest](/de/plugins/manifest) — Referenz für das Manifest-Schema
