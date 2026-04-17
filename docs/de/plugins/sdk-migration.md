---
read_when:
    - Sie sehen die Warnung `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Sie sehen die Warnung `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie warten ein externes OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: Migrieren Sie von der veralteten Abwärtskompatibilitätsschicht zum modernen Plugin SDK
title: Migration des Plugin SDK
x-i18n:
    generated_at: "2026-04-17T06:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0283f949eec358a12a0709db846cde2a1509f28e5c60db6e563cb8a540b979d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration des Plugin SDK

OpenClaw ist von einer breiten Abwärtskompatibilitätsschicht zu einer modernen Plugin-Architektur mit fokussierten, dokumentierten Imports übergegangen. Wenn Ihr Plugin vor der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins alles importieren konnten, was sie von einem einzigen Einstiegspunkt aus benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von Hilfsfunktionen erneut exportierte. Er wurde eingeführt, um ältere hook-basierte Plugins funktionsfähig zu halten, während die neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf hostseitige Hilfsfunktionen wie den eingebetteten Agent-Runner gab.

Beide Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit noch, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten migrieren, bevor sie mit der nächsten Hauptversion entfernt werden.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einer zukünftigen Hauptversion entfernt.
  Plugins, die weiterhin von diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — das Importieren einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Import-Zyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`) ist ein kleines, in sich geschlossenes Modul mit einem klaren Zweck und einem dokumentierten Vertrag.

Veraltete Convenience-Seams für Provider bei gebündelten Kanälen sind ebenfalls entfernt worden. Imports wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, kanalmarkenspezifische Helper-Seams und `openclaw/plugin-sdk/telegram-core` waren private Mono-Repo-Abkürzungen, keine stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Subpfade. Behalten Sie innerhalb des gebündelten Plugin-Workspace Provider-eigene Hilfsfunktionen im jeweiligen `api.ts` oder `runtime-api.ts` dieses Plugins.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic behält Claude-spezifische Stream-Hilfsfunktionen in seinem eigenen `api.ts`- / `contract-api.ts`-Seam
- OpenAI behält Provider-Builder, Hilfsfunktionen für Standardmodelle und Echtzeit-Provider-Builder in seinem eigenen `api.ts`
- OpenRouter behält Provider-Builder sowie Onboarding-/Konfigurationshilfsfunktionen in seinem eigenen `api.ts`

## So migrieren Sie

<Steps>
  <Step title="Migrieren Sie Approval-native-Handler zu Capability-Fakten">
    Channel-Plugins mit Approval-Unterstützung stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Laufzeitkontext-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie approval-spezifische Authentifizierung/Zustellung von der veralteten Verkabelung `plugin.auth` /
      `plugin.approvals` auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Vertrag für Channel-Plugins
      entfernt; verschieben Sie Felder für Zustellung/natives Verhalten/Rendering auf `approvalCapability`
    - `plugin.auth` bleibt nur für Channel-Anmelde-/Abmeldeabläufe erhalten; Approval-Auth-Hooks
      dort werden vom Core nicht mehr gelesen
    - Registrieren Sie Channel-eigene Laufzeitobjekte wie Clients, Tokens oder Bolt-Apps
      über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie aus nativen Approval-Handlern keine plugin-eigenen Hinweise zur Umleitung mehr;
      der Core übernimmt jetzt Hinweise zu Weiterleitungen aus tatsächlichen Zustellungsergebnissen
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der Approval-Capability.

  </Step>

  <Step title="Prüfen Sie das Fallback-Verhalten des Windows-Wrappers">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet,
    schlagen nicht aufgelöste Windows-Wrapper `.cmd`/`.bat` jetzt standardmäßig fehl, es sei denn, Sie übergeben ausdrücklich
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer nicht absichtlich auf Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Finden Sie veraltete Imports">
    Durchsuchen Sie Ihr Plugin nach Imports von einer der beiden veralteten Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ersetzen Sie sie durch fokussierte Imports">
    Jeder Export von der alten Oberfläche lässt sich einem spezifischen modernen Importpfad zuordnen:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Verwenden Sie für hostseitige Hilfsfunktionen die injizierte Plugin-Laufzeit, statt direkt zu importieren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere veraltete Bridge-Hilfsfunktionen:

    | Alter Import | Modernes Äquivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Hilfsfunktionen für den Sitzungsspeicher | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Erstellen und testen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz der Importpfade

  <Accordion title="Tabelle der gängigen Importpfade">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonische Hilfsfunktion für Plugin-Einstiegspunkte | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter übergreifender Re-Export für Definitionen/Builder von Channel-Einstiegspunkten | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Hilfsfunktion für Einstiegspunkte mit einem einzelnen Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Definitionen und Builder für Channel-Einstiegspunkte | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für den Setup-Assistenten | Allowlist-Eingabeaufforderungen, Builder für Setup-Status |
  | `plugin-sdk/setup-runtime` | Laufzeithilfsfunktionen für das Setup | Import-sichere Setup-Patch-Adapter, Hilfsfunktionen für Lookup-Hinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Hilfsfunktionen für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Setup-Tools | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Accounts | Hilfsfunktionen für Account-Liste/Konfiguration/Action-Gates |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Account-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Account-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für Account-Lookups | Hilfsfunktionen für Account-Lookup und Default-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Hilfsfunktionen für Accounts | Hilfsfunktionen für Account-Liste/Account-Aktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive Bausteine für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung von Antwortpräfix und Schreibanzeige | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemas | Typen für Channel-Konfigurationsschemas |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für die Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Nachverfolgung des Account-Status | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für eingehende Envelopes | Gemeinsame Hilfsfunktionen für Routing- und Envelope-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsfunktionen für eingehende Antworten | Gemeinsame Hilfsfunktionen zum Aufzeichnen und Dispatchen |
  | `plugin-sdk/messaging-targets` | Parsing von Nachrichtenzielen | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-runtime` | Laufzeithilfsfunktionen für ausgehende Nachrichten | Hilfsfunktionen für ausgehende Identität/Sende-Delegation |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindings | Hilfsfunktionen für den Lebenszyklus und Adapter von Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Veraltete Hilfsfunktionen für Media Payloads | Builder für Agent-Media-Payloads für veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur veraltete Utilities für Channel-Laufzeit |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Umfassende Laufzeithilfsfunktionen | Hilfsfunktionen für Laufzeit/Logging/Backups/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Hilfsfunktionen für die Laufzeitumgebung | Logger-/Runtime-Env-, Timeout-, Retry- und Backoff-Hilfsfunktionen |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Laufzeithilfsfunktionen | Hilfsfunktionen für Plugin-Befehle/Hooks/HTTP/Interaktivität |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für verzögerte Laufzeit | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Hilfsfunktionen für Prozesse | Gemeinsame `exec`-Hilfsfunktionen |
  | `plugin-sdk/cli-runtime` | CLI-Laufzeithilfsfunktionen | Hilfsfunktionen für Befehlsformatierung, Wartezeiten, Versionen |
  | `plugin-sdk/gateway-runtime` | Hilfsfunktionen für Gateway | Hilfsfunktionen für Gateway-Client und Patches für Channel-Status |
  | `plugin-sdk/config-runtime` | Hilfsfunktionen für Konfiguration | Hilfsfunktionen zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Fallback-stabile Hilfsfunktionen zur Telegram-Befehlsvalidierung, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Approval-Prompts | Payload-Hilfsfunktionen für Exec-/Plugin-Approvals, Hilfsfunktionen für Approval-Capability/Profile, native Approval-Routing-/Laufzeithilfsfunktionen |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Approval-Authentifizierung | Approver-Auflösung, Same-Chat-Action-Authentifizierung |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Approval-Clients | Hilfsfunktionen für native Exec-Approval-Profile/-Filter |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für Approval-Zustellung | Native Adapter für Approval-Capability/Zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Hilfsfunktionen für Approval-Gateway | Gemeinsame Hilfsfunktion für die Auflösung von Approval-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hilfsfunktionen für Approval-Adapter | Leichtgewichtige Hilfsfunktionen zum Laden nativer Approval-Adapter für heiße Channel-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Hilfsfunktionen für Approval-Handler | Umfassendere Laufzeithilfsfunktionen für Approval-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Approval-Ziele | Hilfsfunktionen für native Approval-Ziele/Account-Bindings |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Approval-Antworten | Payload-Hilfsfunktionen für Exec-/Plugin-Approval-Antworten |
  | `plugin-sdk/channel-runtime-context` | Hilfsfunktionen für den Channel-Runtime-Context | Generische Hilfsfunktionen zum Registrieren/Abrufen/Beobachten des Channel-Runtime-Context |
  | `plugin-sdk/security-runtime` | Hilfsfunktionen für Sicherheit | Gemeinsame Hilfsfunktionen für Trust, DM-Gating, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Laufzeithilfsfunktionen | Hilfsfunktionen für Pinned Dispatcher, geschütztes Fetch, SSRF-Richtlinien |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnostic-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für umschlossenes Fetch/Proxy | `resolveFetch`, Proxy-Hilfsfunktionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Retry | `RetryConfig`, `retryAsync`, Policy-Runner |
  | `plugin-sdk/allow-from` | Formatierung der Allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Command-Gating- und Befehlsoberflächen-Hilfsfunktionen | `resolveControlCommandGate`, Hilfsfunktionen für Sender-Autorisierung, Hilfsfunktionen für Befehlsregistry |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Hilfsfunktionen für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen | Utilities für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Guards von Webhook-Request-Bodies | Hilfsfunktionen zum Lesen/Begrenzen von Request-Bodies |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwortlaufzeit | Eingehender Dispatch, Heartbeat, Antwortplanung, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch | Hilfsfunktionen für Finalisierung und Provider-Dispatch |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwort-Chunks | Hilfsfunktionen für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsspeicher | Hilfsfunktionen für Speicherpfade und `updated-at` |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für Statuspfade | Hilfsfunktionen für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Sitzungsschlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Normalisierung von Sitzungsschlüsseln |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen für Channel-Status | Builder für Zusammenfassungen von Channel-/Account-Status, Standards für Laufzeitstatus, Hilfsfunktionen für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen für Target Resolver | Gemeinsame Hilfsfunktionen für Target Resolver |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für String-Normalisierung | Hilfsfunktionen für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen für Request-URLs | Extrahieren von URL-Strings aus Request-ähnlichen Eingaben |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitgesteuerte Befehle | Timed Command Runner mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Allgemeine Param-Reader für Tools/CLI |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payloads | Extrahieren normalisierter Payloads aus Tool-Ergebnisobjekten |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Sendeinformationen | Extrahieren kanonischer Zielfeldwerte für Sendungen aus Tool-Argumenten |
  | `plugin-sdk/temp-path` | Hilfsfunktionen für temporäre Pfade | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Hilfsfunktionen für Logging | Subsystem-Logger und Redaction-Hilfsfunktionen |
  | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellen | Hilfsfunktionen für Modi von Markdown-Tabellen |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für das Setup lokaler/self-hosted Provider | Hilfsfunktionen für Discovery/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für das Setup selbst gehosteter OpenAI-kompatibler Provider | Dieselben Hilfsfunktionen für Discovery/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/provider-auth-runtime` | Hilfsfunktionen für Provider-Authentifizierung zur Laufzeit | Hilfsfunktionen für die Auflösung von Runtime-API-Keys |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für die Einrichtung von Provider-API-Keys | Hilfsfunktionen für API-Key-Onboarding/Profilschreibung |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Authentifizierungsergebnisse | Standard-Builder für OAuth-Authentifizierungsergebnisse |
  | `plugin-sdk/provider-auth-login` | Hilfsfunktionen für interaktive Provider-Anmeldung | Gemeinsame Hilfsfunktionen für interaktive Anmeldung |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Umgebungsvariablen | Hilfsfunktionen für das Lookup von Provider-Auth-Umgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen für Provider-Modelle/Wiedergabe | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Hilfsfunktionen für Provider-Endpunkte und Hilfsfunktionen zur Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches für Provider-Onboarding | Hilfsfunktionen für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Hilfsfunktionen für Provider-HTTP | Generische Hilfsfunktionen für Provider-HTTP/Endpoint-Capabilities |
  | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Provider-Web-Fetch | Hilfsfunktionen für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Hilfsfunktionen für die Web-Search-Konfiguration von Providern | Schmale Hilfsfunktionen für Web-Search-Konfiguration/Credentials für Provider, die keine Plugin-Enable-Verdrahtung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Hilfsfunktionen für den Web-Search-Vertrag von Providern | Schmale Hilfsfunktionen für Verträge zu Web-Search-Konfiguration/Credentials wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` sowie bereichsspezifische Setter/Getter für Credentials |
  | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Provider-Web-Search | Hilfsfunktionen für Registrierung/Cache/Laufzeit von Web-Search-Providern |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnostik sowie xAI-Kompatibilitäts-Hilfsfunktionen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hilfsfunktionen für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und andere Hilfsfunktionen für Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper sowie gemeinsame Hilfsfunktionen für Wrapper von Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen für Medien | Hilfsfunktionen für Medienabruf/-umwandlung/-speicherung sowie Builder für Media Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Mediengenerierung | Gemeinsame Hilfsfunktionen für Failover, Kandidatenauswahl und Meldungen bei fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen für Media Understanding | Typen für Media-Understanding-Provider sowie providerseitige Exporte von Hilfsfunktionen für Bilder/Audio |
  | `plugin-sdk/text-runtime` | Gemeinsame Hilfsfunktionen für Text | Entfernen assistentensichtbaren Texts, Hilfsfunktionen für Markdown-Rendering/-Chunking/-Tabellen, Hilfsfunktionen für Redaction, Hilfsfunktionen für Directive-Tags, Safe-Text-Utilities und zugehörige Text-/Logging-Hilfsfunktionen |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text-Chunking | Hilfsfunktion für ausgehendes Text-Chunking |
  | `plugin-sdk/speech` | Hilfsfunktionen für Speech | Typen für Speech-Provider sowie providerseitige Hilfsfunktionen für Directives, Registry und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech-Core | Typen für Speech-Provider, Registry, Directives, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsfunktionen für Realtime-Transkription | Typen für Provider und Hilfsfunktionen für die Registry |
  | `plugin-sdk/realtime-voice` | Hilfsfunktionen für Realtime-Voice | Typen für Provider und Hilfsfunktionen für die Registry |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Hilfsfunktionen für Typen, Failover, Auth und Registry der Bildgenerierung |
  | `plugin-sdk/music-generation` | Hilfsfunktionen für Musikgenerierung | Typen für Provider/Requests/Ergebnisse der Musikgenerierung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Hilfsfunktionen für Typen, Failover, Provider-Lookup und Parsing von Model-Refs der Musikgenerierung |
  | `plugin-sdk/video-generation` | Hilfsfunktionen für Videogenerierung | Typen für Provider/Requests/Ergebnisse der Videogenerierung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Hilfsfunktionen für Typen, Failover, Provider-Lookup und Parsing von Model-Refs der Videogenerierung |
  | `plugin-sdk/interactive-runtime` | Hilfsfunktionen für interaktive Antworten | Normalisierung/Reduktion interaktiver Antwort-Payloads |
  | `plugin-sdk/channel-config-primitives` | Primitive Bausteine für Channel-Konfiguration | Schmale Primitive für Channel-Konfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Schreibvorgänge in der Channel-Konfiguration | Hilfsfunktionen für Autorisierung beim Schreiben von Channel-Konfiguration |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Channel-Prelude | Gemeinsame Prelude-Exporte für Channel-Plugins |
  | `plugin-sdk/channel-status` | Hilfsfunktionen für Channel-Status | Gemeinsame Hilfsfunktionen für Snapshots/Zusammenfassungen des Channel-Status |
  | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen für Allowlist-Konfiguration | Hilfsfunktionen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Hilfsfunktionen für Gruppenzugriff | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Hilfsfunktionen für direkte DMs | Gemeinsame Hilfsfunktionen für Auth/Guards bei direkten DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Hilfsfunktionen für Erweiterungen | Primitive Hilfsfunktionen für passive Channels/Status und Ambient-Proxy |
  | `plugin-sdk/webhook-targets` | Hilfsfunktionen für Webhook-Ziele | Registry für Webhook-Ziele und Hilfsfunktionen für die Installation von Routen |
  | `plugin-sdk/webhook-path` | Hilfsfunktionen für Webhook-Pfade | Hilfsfunktionen zur Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen für Web-Medien | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` für Plugin-SDK-Konsumenten |
  | `plugin-sdk/memory-core` | Gebündelte Hilfsfunktionen für Memory-Core | Oberfläche mit Hilfsfunktionen für Memory-Manager/Konfiguration/Dateien/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Memory-Engine | Laufzeit-Fassade für Memory-Index/Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Host-Foundation-Engine für Memory | Exporte der Host-Foundation-Engine für Memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Host-Embedding-Engine für Memory | Embedding-Verträge für Memory, Registry-Zugriff, lokaler Provider und generische Hilfsfunktionen für Batch/Remote; konkrete Remote-Provider liegen in den jeweils zuständigen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Host-QMD-Engine für Memory | Exporte der Host-QMD-Engine für Memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Host-Storage-Engine für Memory | Exporte der Host-Storage-Engine für Memory |
  | `plugin-sdk/memory-core-host-multimodal` | Host-Hilfsfunktionen für multimodales Memory | Host-Hilfsfunktionen für multimodales Memory |
  | `plugin-sdk/memory-core-host-query` | Host-Hilfsfunktionen für Memory-Abfragen | Host-Hilfsfunktionen für Memory-Abfragen |
  | `plugin-sdk/memory-core-host-secret` | Host-Hilfsfunktionen für Memory-Secrets | Host-Hilfsfunktionen für Memory-Secrets |
  | `plugin-sdk/memory-core-host-events` | Hilfsfunktionen für das Host-Event-Journal von Memory | Hilfsfunktionen für das Host-Event-Journal von Memory |
  | `plugin-sdk/memory-core-host-status` | Host-Hilfsfunktionen für Memory-Status | Host-Hilfsfunktionen für Memory-Status |
  | `plugin-sdk/memory-core-host-runtime-cli` | Host-CLI-Laufzeit für Memory | Host-CLI-Laufzeithilfsfunktionen für Memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Host-Core-Laufzeit für Memory | Host-Core-Laufzeithilfsfunktionen für Memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Host-Hilfsfunktionen für Memory-Dateien/Laufzeit | Host-Hilfsfunktionen für Memory-Dateien/Laufzeit |
  | `plugin-sdk/memory-host-core` | Alias für die Host-Core-Laufzeit von Memory | Vendor-neutraler Alias für Host-Core-Laufzeithilfsfunktionen von Memory |
  | `plugin-sdk/memory-host-events` | Alias für das Host-Event-Journal von Memory | Vendor-neutraler Alias für Hilfsfunktionen des Host-Event-Journals von Memory |
  | `plugin-sdk/memory-host-files` | Alias für Host-Dateien/Laufzeit von Memory | Vendor-neutraler Alias für Host-Hilfsfunktionen für Memory-Dateien/Laufzeit |
  | `plugin-sdk/memory-host-markdown` | Hilfsfunktionen für verwaltetes Markdown | Gemeinsame Hilfsfunktionen für verwaltetes Markdown bei Memory-nahen Plugins |
  | `plugin-sdk/memory-host-search` | Fassade für Active Memory-Suche | Verzögerte Laufzeit-Fassade des Search-Managers für Active Memory |
  | `plugin-sdk/memory-host-status` | Alias für Host-Status von Memory | Vendor-neutraler Alias für Host-Hilfsfunktionen für Memory-Status |
  | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsfunktionen für Memory-LanceDB | Oberfläche mit Hilfsfunktionen für Memory-LanceDB |
  | `plugin-sdk/testing` | Test-Utilities | Test-Hilfsfunktionen und Mocks |
</Accordion>

Diese Tabelle ist absichtlich die gängige Migrations-Teilmenge und nicht die vollständige SDK-Oberfläche. Die vollständige Liste mit mehr als 200 Einstiegspunkten befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Helper-Seams für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die Wartung gebündelter Plugins und aus Kompatibilitätsgründen exportiert, werden aber bewusst aus der gängigen Migrationstabelle ausgelassen und sind nicht das empfohlene Ziel für neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Hilfsfunktionen wie:

- Browser-Support-Hilfsfunktionen: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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

`plugin-sdk/github-copilot-token` stellt derzeit die schmale Token-Helper-Oberfläche
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwenden Sie den schmalsten Import, der zur Aufgabe passt. Wenn Sie einen Export nicht finden können,
prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie in Discord.

## Zeitplan für die Entfernung

| Wann | Was passiert |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt** | Veraltete Oberflächen geben Laufzeitwarnungen aus |
| **Nächste Hauptversion** | Veraltete Oberflächen werden entfernt; Plugins, die sie noch verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor der nächsten Hauptversion migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein temporärer Notausgang, keine dauerhafte Lösung.

## Verwandte Themen

- [Erste Schritte](/de/plugins/building-plugins) — Erstellen Sie Ihr erstes Plugin
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Imports
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) — Erstellen von Channel-Plugins
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Erstellen von Provider-Plugins
- [Plugin-Interna](/de/plugins/architecture) — tiefer Einblick in die Architektur
- [Plugin-Manifest](/de/plugins/manifest) — Referenz für das Manifest-Schema
