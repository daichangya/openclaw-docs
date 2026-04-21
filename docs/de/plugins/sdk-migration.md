---
read_when:
    - Sie sehen die Warnung `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`.
    - Sie sehen die Warnung `OPENCLAW_EXTENSION_API_DEPRECATED`.
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur.
    - Sie pflegen ein externes OpenClaw-Plugin.
sidebarTitle: Migrate to SDK
summary: Von der Legacy-Abwärtskompatibilitätsschicht auf das moderne Plugin SDK migrieren
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-04-21T06:28:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d2ea9a8cc869b943ad774ac0ddb8828b80ce86432ece7b9aeed4f1edb30859
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin-SDK-Migration

OpenClaw ist von einer breiten Abwärtskompatibilitätsschicht zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Imports übergegangen. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins
alles importieren konnten, was sie aus einem einzigen Einstiegspunkt benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von
  Helfern re-exportierte. Er wurde eingeführt, um ältere Hook-basierte Plugins weiter funktionsfähig zu halten, während die
  neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/extension-api`** — eine Bridge, die Plugins direkten Zugriff auf
  hostseitige Helfer wie den eingebetteten Agent-Runner gab.

Beide Oberflächen sind jetzt **deprecated**. Sie funktionieren zur Laufzeit noch,
aber neue Plugins dürfen sie nicht mehr verwenden, und bestehende Plugins sollten vor dem nächsten
Major-Release migrieren, das sie entfernt.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einem zukünftigen Major-Release entfernt.
  Plugins, die weiterhin von diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — durch den Import eines Hilfsmittels wurden Dutzende nicht zusammenhängender Module geladen
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, in sich geschlossenes Modul mit einem klaren Zweck und dokumentiertem Vertrag.

Legacy-Provider-Convenience-Seams für gebündelte Channels sind ebenfalls verschwunden. Imports
wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
channelgebrandete Helper-Seams und
`openclaw/plugin-sdk/telegram-core` waren private Monorepo-Abkürzungen, keine
stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Subpaths. Innerhalb des
gebündelten Plugin-Workspaces behalten Sie provider-eigene Helfer im eigenen
`api.ts` oder `runtime-api.ts` dieses Plugins.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic behält Claude-spezifische Stream-Helper in seinem eigenen `api.ts` /
  `contract-api.ts`-Seam
- OpenAI behält Provider-Builder, Helper für Standardmodelle und Realtime-Provider-
  Builder in seinem eigenen `api.ts`
- OpenRouter behält Provider-Builder sowie Onboarding-/Konfigurations-Helper in seinem eigenen
  `api.ts`

## So migrieren Sie

<Steps>
  <Step title="Approval-native Handler auf Capability-Facts umstellen">
    Approval-fähige Channel-Plugins stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Runtime-Context-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie approval-spezifische Auth/Delivery aus dem Legacy-Wiring `plugin.auth` /
      `plugin.approvals` auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Vertrag für Channel-Plugins
      entfernt; verschieben Sie Felder für Delivery/Native/Render auf `approvalCapability`
    - `plugin.auth` bleibt nur für Login-/Logout-Flows von Channels erhalten; Approval-Auth-
      Hooks dort werden vom Core nicht mehr gelesen
    - Registrieren Sie channel-eigene Runtime-Objekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Hinweise zur Umleitung aus nativen Approval-Handlern;
      der Core verwaltet nun Hinweise zu anderweitiger Weiterleitung aus echten Delivery-Ergebnissen
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der
    Approval-Capability.

  </Step>

  <Step title="Fallback-Verhalten von Windows-Wrappern prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet,
    schlagen nicht aufgelöste Windows-Wrapper `.cmd`/`.bat` jetzt fail-closed fehl, sofern Sie
    nicht ausdrücklich `allowShellFallback: true` übergeben.

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Nur für vertrauenswürdige Kompatibilitäts-Caller setzen, die absichtlich
      // shellvermittelten Fallback akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Caller nicht absichtlich auf Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Deprecated Imports finden">
    Durchsuchen Sie Ihr Plugin nach Imports aus einer der beiden deprecated Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Imports ersetzen">
    Jeder Export der alten Oberfläche wird einem spezifischen modernen Importpfad zugeordnet:

    ```typescript
    // Vorher (deprecated Abwärtskompatibilitätsschicht)
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

    Verwenden Sie für hostseitige Helfer die injizierte Plugin-Runtime, statt direkt
    zu importieren:

    ```typescript
    // Vorher (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Nachher (injizierte Runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere Legacy-Bridge-Helper:

    | Alter Import | Modernes Äquivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Session-Store-Helper | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Builden und testen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz für Importpfade

  <Accordion title="Tabelle gängiger Importpfade">
  | Importpfad | Zweck | Zentrale Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonischer Helper für Plugin-Einstiegspunkte | `definePluginEntry` |
  | `plugin-sdk/core` | Legacy-Umbrella-Re-Export für Channel-Einstiegsdefinitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper für Single-Provider-Einstiegspunkte | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Channel-Einstiegsdefinitionen und -Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Helper für den Setup-Assistenten | Allowlist-Prompts, Builder für den Setup-Status |
  | `plugin-sdk/setup-runtime` | Runtime-Helper zur Setup-Zeit | Importsichere Setup-Patch-Adapter, Lookup-Note-Helper, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Helper für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Tooling-Helper für Setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper für mehrere Accounts | Helper für Account-Liste/Konfiguration/Aktions-Gates |
  | `plugin-sdk/account-id` | Helper für Account-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Account-IDs |
  | `plugin-sdk/account-resolution` | Helper für Account-Lookups | Helper für Account-Lookup + Default-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Account-Helper | Helper für Account-Liste/Account-Aktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring für Reply-Präfix + Typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemas | Typen für Channel-Konfigurationsschemas |
  | `plugin-sdk/telegram-command-config` | Helper für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Tracking des Account-Status | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helper für Inbound-Envelopes | Gemeinsame Helper für Routing + Envelope-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Helper für Inbound-Replies | Gemeinsame Helper für Recording und Dispatch |
  | `plugin-sdk/messaging-targets` | Parsing von Messaging-Zielen | Helper für Parsing/Matching von Zielen |
  | `plugin-sdk/outbound-media` | Helper für Outbound-Medien | Gemeinsames Laden von Outbound-Medien |
  | `plugin-sdk/outbound-runtime` | Runtime-Helper für Outbound | Helper für Outbound-Identität/Sende-Delegation und Payload-Planung |
  | `plugin-sdk/thread-bindings-runtime` | Helper für Thread-Bindings | Helper für Lebenszyklus und Adapter von Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Legacy-Helper für Media-Payloads | Builder für Agent-Media-Payloads für Legacy-Feldlayouts |
  | `plugin-sdk/channel-runtime` | Deprecated Kompatibilitäts-Shim | Nur Legacy-Hilfsprogramme für Channel-Runtime |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Reply-Ergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Runtime-Helper | Helper für Runtime/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Runtime-Env-Helper | Helper für Logger/Runtime-Env, Timeout, Retry und Backoff |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Helper für Plugin-Runtime | Helper für Plugin-Befehle/Hooks/HTTP/interaktive Funktionen |
  | `plugin-sdk/hook-runtime` | Helper für Hook-Pipelines | Gemeinsame Pipeline-Helper für Webhooks/interne Hooks |
  | `plugin-sdk/lazy-runtime` | Helper für Lazy-Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozess-Helper | Gemeinsame Helper für `exec` |
  | `plugin-sdk/cli-runtime` | CLI-Runtime-Helper | Helper für Befehlsformatierung, Waits, Versionen |
  | `plugin-sdk/gateway-runtime` | Gateway-Helper | Helper für Gateway-Client und Patches des Channel-Status |
  | `plugin-sdk/config-runtime` | Konfigurations-Helper | Helper zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Helper für Telegram-Befehle | Fallback-stabile Validierungs-Helper für Telegram-Befehle, wenn die gebündelte Telegram-Contract-Oberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Helper für Approval-Prompts | Payload für Exec-/Plugin-Approval, Helper für Approval-Capability/Profile, native Approval-Routing-/Runtime-Helper |
  | `plugin-sdk/approval-auth-runtime` | Auth-Helper für Approval | Auflösung von Genehmigenden, Auth für Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Client-Helper für Approval | Native Helper für Profile/Filter bei Exec-Approval |
  | `plugin-sdk/approval-delivery-runtime` | Delivery-Helper für Approval | Native Adapter für Approval-Capability/Delivery |
  | `plugin-sdk/approval-gateway-runtime` | Gateway-Helper für Approval | Gemeinsamer Helper zur Auflösung von Approval-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Adapter-Helper für Approval | Leichtgewichtige Lade-Helper für native Approval-Adapter für heiße Channel-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Handler-Helper für Approval | Breitere Runtime-Helper für Approval-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
  | `plugin-sdk/approval-native-runtime` | Ziel-Helper für Approval | Native Helper für Ziel-/Account-Binding bei Approval |
  | `plugin-sdk/approval-reply-runtime` | Reply-Helper für Approval | Helper für Reply-Payload bei Exec-/Plugin-Approval |
  | `plugin-sdk/channel-runtime-context` | Helper für Runtime-Context von Channels | Generische Helper für Registrieren/Abrufen/Beobachten von Runtime-Context in Channels |
  | `plugin-sdk/security-runtime` | Sicherheits-Helper | Gemeinsame Helper für Trust, DM-Gating, externe Inhalte und Secret-Sammlung |
  | `plugin-sdk/ssrf-policy` | SSRF-Richtlinien-Helper | Helper für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Runtime-Helper | Helper für pinned dispatcher, guarded fetch und SSRF-Richtlinien |
  | `plugin-sdk/collection-runtime` | Helper für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper für Diagnostic-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Helper für Error-Graphs |
  | `plugin-sdk/fetch-runtime` | Helper für Wrapped Fetch/Proxy | `resolveFetch`, Proxy-Helper |
  | `plugin-sdk/host-runtime` | Helper für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Helper | `RetryConfig`, `retryAsync`, Runner für Richtlinien |
  | `plugin-sdk/allow-from` | Formatierung von Allowlists | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helper für Command-Gating und Command-Oberflächen | `resolveControlCommandGate`, Helper für Absender-Autorisierung, Helper für Command-Registry |
  | `plugin-sdk/command-status` | Renderer für Command-Status/Hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Helper für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Helper für Webhook-Anfragen | Hilfsprogramme für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Guard-Helper für Webhook-Bodys | Helper zum Lesen/Begrenzen von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Reply-Runtime | Inbound-Dispatch, Heartbeat, Reply-Planer, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Dispatch-Helper für Replies | Helper für Finalisierung + Provider-Dispatch |
  | `plugin-sdk/reply-history` | Helper für Reply-History | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Reply-Referenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Chunk-Helper für Replies | Helper für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Helper für Session-Store | Helper für Store-Pfad + `updated-at` |
  | `plugin-sdk/state-paths` | Helper für State-Pfade | Helper für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Helper für Routing/Session-Keys | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Helper für Normalisierung von Session-Keys |
  | `plugin-sdk/status-helpers` | Helper für Channel-Status | Builder für Zusammenfassungen des Channel-/Account-Status, Defaults für Runtime-State, Helper für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Resolver-Helper für Ziele | Gemeinsame Helper für Zielauflösung |
  | `plugin-sdk/string-normalization-runtime` | Helper für String-Normalisierung | Helper für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Helper für Request-URLs | String-URLs aus requestähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Helper für zeitgesteuerte Befehle | Runner für zeitgesteuerte Befehle mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Gemeinsame Param-Reader für Tools/CLI |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payloads | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Sends | Kanonische Zielfelder zum Senden aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Helper für temporäre Pfade | Gemeinsame Helper für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Helper | Helper für Subsystem-Logger und Redaction |
  | `plugin-sdk/markdown-table-runtime` | Helper für Markdown-Tabellen | Helper für Modi von Markdown-Tabellen |
  | `plugin-sdk/reply-payload` | Typen für Nachrichten-Replies | Typen für Reply-Payload |
  | `plugin-sdk/provider-setup` | Kuratierte Setup-Helper für lokale/self-hosted Provider | Helper für Discovery/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Helper für OpenAI-kompatible self-hosted Provider | Dieselben Helper für Discovery/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/provider-auth-runtime` | Runtime-Auth-Helper für Provider | Runtime-Helper zur Auflösung von API-Keys |
  | `plugin-sdk/provider-auth-api-key` | Setup-Helper für API-Keys von Providern | Helper für Onboarding/Profile-Schreiben mit API-Key |
  | `plugin-sdk/provider-auth-result` | Helper für Auth-Ergebnisse von Providern | Standard-Builder für OAuth-Auth-Ergebnisse |
  | `plugin-sdk/provider-auth-login` | Interaktive Login-Helper für Provider | Gemeinsame Helper für interaktives Login |
  | `plugin-sdk/provider-env-vars` | Env-Var-Helper für Provider | Helper zum Lookup von Env-Variablen für Provider-Auth |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Helper für Provider-Modelle/Replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Helper für Provider-Endpunkte und Helper zur Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Helper für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Onboarding-Patches für Provider | Konfigurations-Helper für Onboarding |
  | `plugin-sdk/provider-http` | HTTP-Helper für Provider | Generische HTTP-/Endpoint-Capability-Helper für Provider |
  | `plugin-sdk/provider-web-fetch` | Web-Fetch-Helper für Provider | Helper für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Konfigurations-Helper für Websuche von Providern | Schmale Konfigurations-/Credential-Helper für Websuche bei Providern, die kein Wiring zum Aktivieren von Plugins benötigen |
  | `plugin-sdk/provider-web-search-contract` | Contract-Helper für Websuche von Providern | Schmale Contract-Helper für Konfiguration/Credentials der Websuche wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und scoped Setter/Getter für Credentials |
  | `plugin-sdk/provider-web-search` | Websuch-Helper für Provider | Helper für Registrierung/Cache/Runtime von Websuch-Providern |
  | `plugin-sdk/provider-tools` | Kompatibilitäts-Helper für Provider-Tools/-Schemas | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Bereinigung + Diagnose für Gemini-Schemas und xAI-Kompatibilitäts-Helper wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Nutzungs-Helper für Provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Nutzungs-Helper für Provider |
  | `plugin-sdk/provider-stream` | Wrapper-Helper für Provider-Streams | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Helper für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Transport-Helper für Provider | Native Transport-Helper für Provider wie guarded fetch, Nachrichtentransformationen im Transport und beschreibbare Event-Streams im Transport |
  | `plugin-sdk/keyed-async-queue` | Geordnete Async-Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Media-Helper | Helper für Media-Fetch/Transform/Store plus Builder für Media-Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Helper für Media-Generierung | Gemeinsame Failover-Helper, Kandidatenauswahl und Meldungen für fehlende Modelle bei Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Helper für Media Understanding | Providertypen für Media Understanding plus providerseitige Exporte von Bild-/Audio-Helpern |
  | `plugin-sdk/text-runtime` | Gemeinsame Text-Helper | Entfernen von für Assistenten sichtbarem Text, Helper für Rendern/Chunking/Tabellen in Markdown, Redaction-Helper, Directive-Tag-Helper, sichere Text-Hilfsfunktionen und verwandte Text-/Logging-Helper |
  | `plugin-sdk/text-chunking` | Helper für Text-Chunking | Helper für Outbound-Text-Chunking |
  | `plugin-sdk/speech` | Speech-Helper | Providertypen für Speech plus providerseitige Helper für Directives, Registry und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech-Core | Speech-Providertypen, Registry, Directives, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Helper für Realtime-Transkription | Providertypen und Registry-Helper |
  | `plugin-sdk/realtime-voice` | Helper für Realtime-Voice | Providertypen und Registry-Helper |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Typen, Failover-, Auth- und Registry-Helper für Bildgenerierung |
  | `plugin-sdk/music-generation` | Helper für Musikgenerierung | Typen für Provider/Requests/Ergebnisse der Musikgenerierung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Typen für Musikgenerierung, Failover-Helper, Provider-Lookup und Parsing von Modell-Refs |
  | `plugin-sdk/video-generation` | Helper für Videogenerierung | Typen für Provider/Requests/Ergebnisse der Videogenerierung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Typen für Videogenerierung, Failover-Helper, Provider-Lookup und Parsing von Modell-Refs |
  | `plugin-sdk/interactive-runtime` | Helper für interaktive Replies | Normalisierung/Reduktion interaktiver Reply-Payloads |
  | `plugin-sdk/channel-config-primitives` | Primitive für Channel-Konfiguration | Schmale Primitive für Channel-Konfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Schreib-Helper für Channel-Konfiguration | Helper für Autorisierung beim Schreiben von Channel-Konfiguration |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Channel-Prelude | Gemeinsame Prelude-Exporte für Channel-Plugins |
  | `plugin-sdk/channel-status` | Status-Helper für Channels | Gemeinsame Snapshot-/Zusammenfassungs-Helper für Channel-Status |
  | `plugin-sdk/allowlist-config-edit` | Konfigurations-Helper für Allowlists | Helper zum Bearbeiten/Lesen von Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Helper für Gruppenzugriff | Gemeinsame Entscheidungs-Helper für Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Helper für direkte DMs | Gemeinsame Auth-/Guard-Helper für direkte DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Extension-Helper | Primitive für Passive-Channel-/Status- und Ambient-Proxy-Helper |
  | `plugin-sdk/webhook-targets` | Ziel-Helper für Webhooks | Registry für Webhook-Ziele und Helper zum Installieren von Routen |
  | `plugin-sdk/webhook-path` | Pfad-Helper für Webhooks | Helper zur Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Helper für Web-Medien | Helper zum Laden lokaler/entfernter Medien |
  | `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` für Nutzer des Plugin SDK |
  | `plugin-sdk/memory-core` | Gebündelte `memory-core`-Helper | Helper-Oberfläche für Memory-Manager/Konfiguration/Dateien/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Engine | Runtime-Fassade für Memory-Index/Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine für Memory-Host | Exporte der Foundation-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine für Memory-Host | Embedding-Contracts für Memory, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Helper; konkrete Remote-Provider liegen in ihren jeweiligen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine für Memory-Host | Exporte der QMD-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine für Memory-Host | Exporte der Storage-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Helper für Memory-Host | Multimodale Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-query` | Query-Helper für Memory-Host | Query-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-secret` | Secret-Helper für Memory-Host | Secret-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-events` | Event-Journal-Helper für Memory-Host | Event-Journal-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-status` | Status-Helper für Memory-Host | Status-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime für Memory-Host | CLI-Runtime-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime für Memory-Host | Core-Runtime-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Helper für Memory-Host | Datei-/Runtime-Helper für Memory-Host |
  | `plugin-sdk/memory-host-core` | Alias für Core-Runtime des Memory-Host | Herstellerneutraler Alias für Core-Runtime-Helper des Memory-Host |
  | `plugin-sdk/memory-host-events` | Alias für Event-Journal des Memory-Host | Herstellerneutraler Alias für Event-Journal-Helper des Memory-Host |
  | `plugin-sdk/memory-host-files` | Alias für Datei-/Runtime des Memory-Host | Herstellerneutraler Alias für Datei-/Runtime-Helper des Memory-Host |
  | `plugin-sdk/memory-host-markdown` | Helper für verwaltetes Markdown | Gemeinsame Helper für verwaltetes Markdown für Plugins im Umfeld von Memory |
  | `plugin-sdk/memory-host-search` | Such-Fassade für Active Memory | Lazy Runtime-Fassade für den Search-Manager von Active Memory |
  | `plugin-sdk/memory-host-status` | Alias für Status des Memory-Host | Herstellerneutraler Alias für Status-Helper des Memory-Host |
  | `plugin-sdk/memory-lancedb` | Gebündelte `memory-lancedb`-Helper | Helper-Oberfläche für `memory-lancedb` |
  | `plugin-sdk/testing` | Test-Hilfsprogramme | Test-Helper und Mocks |
</Accordion>

Diese Tabelle ist bewusst die gängige Teilmenge für die Migration, nicht die vollständige
SDK-Oberfläche. Die vollständige Liste mit mehr als 200 Einstiegspunkten steht in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Helper-Seams für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die Wartung
gebündelter Plugins und aus Kompatibilitätsgründen exportiert, werden aber bewusst
aus der gängigen Migrationstabelle weggelassen und sind nicht das empfohlene Ziel für
neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Helper wie:

- Browser-Support-Helper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- gebündelte Helper-/Plugin-Oberflächen wie `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` und `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` stellt derzeit die schmale
Token-Helper-Oberfläche `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwenden Sie den schmalsten Import, der zur Aufgabe passt. Wenn Sie einen Export
nicht finden können, prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie in Discord.

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                             |
| ---------------------- | ------------------------------------------------------------------------ |
| **Jetzt**              | Deprecated Oberflächen geben Runtime-Warnungen aus                       |
| **Nächstes Major-Release** | Deprecated Oberflächen werden entfernt; Plugins, die sie noch verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor dem nächsten
Major-Release migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Das ist ein temporärer Escape Hatch, keine dauerhafte Lösung.

## Verwandt

- [Getting Started](/de/plugins/building-plugins) — Ihr erstes Plugin erstellen
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Imports
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Channel-Plugins erstellen
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
- [Plugin Internals](/de/plugins/architecture) — Deep Dive in die Architektur
- [Plugin Manifest](/de/plugins/manifest) — Referenz für das Manifest-Schema
