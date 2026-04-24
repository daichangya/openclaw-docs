---
read_when:
    - Den richtigen Unterpfad von plugin-sdk für einen Plugin-Import auswählen
    - Unterpfade und Hilfsoberflächen gebündelter Plugins prüfen
summary: 'Katalog der Plugin-SDK-Unterpfade: welche Importe wo liegen, nach Bereichen gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-04-24T06:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753c7202a8a59ae9e420d436c7f3770ea455d810f2af52b716d438b84b8b986e
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Das Plugin SDK wird als Satz schmaler Unterpfade unter `openclaw/plugin-sdk/` bereitgestellt.
  Diese Seite katalogisiert die häufig verwendeten Unterpfade, nach ihrem Zweck gruppiert. Die generierte
  vollständige Liste mit mehr als 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`;
  reservierte Hilfs-Unterpfade für gebündelte Plugins erscheinen dort, sind aber ein
  Implementierungsdetail, sofern nicht eine Dokumentationsseite sie ausdrücklich hervorhebt.

  Den Leitfaden zum Schreiben von Plugins finden Sie unter [Überblick über das Plugin SDK](/de/plugins/sdk-overview).

  ## Plugin-Entry

  | Unterpfad                  | Wichtige Exporte                                                                                                                     |
  | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                  |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                     |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                   |

  <AccordionGroup>
  <Accordion title="Channel-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Zod-Schema-Export für das Root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Helfer für den Setup-Assistenten, Allowlist-Prompts, Builder für Setup-Status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helfer für Multi-Account-Konfiguration/Aktions-Gating, Helfer für Default-Account-Fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helfer zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Helfer für Account-Lookup + Default-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Helfer für Account-Liste/Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Channel-Konfigurationsschema |
    | `plugin-sdk/telegram-command-config` | Helfer zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback für gebündelte Verträge |
    | `plugin-sdk/command-gating` | Schmale Helfer für Command-Autorisierungs-Gating |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, Lifecycle-/Finalisierungshelfer für Draft-Streams |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Helfer für eingehende Routen + Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Helfer zum Aufzeichnen und Weiterleiten eingehender Nachrichten |
    | `plugin-sdk/messaging-targets` | Helfer zum Parsen/Abgleichen von Targets |
    | `plugin-sdk/outbound-media` | Gemeinsame Helfer zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Helfer für ausgehende Identität, Send-Delegate und Payload-Planung |
    | `plugin-sdk/poll-runtime` | Schmale Helfer zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Helfer für Thread-Binding-Lifecycle und Adapter |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Media-Payload |
    | `plugin-sdk/conversation-runtime` | Helfer für Konversations-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Runtime-Konfigurationssnapshot |
    | `plugin-sdk/runtime-group-policy` | Helfer zur Auflösung von Group-Policy zur Laufzeit |
    | `plugin-sdk/channel-status` | Gemeinsame Helfer für Channel-Status-Snapshot/-Zusammenfassung |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Channel-Konfigurationsschema |
    | `plugin-sdk/channel-config-writes` | Helfer zur Autorisierung von Schreibvorgängen in Channel-Konfigurationen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helfer zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Helfer für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Helfer für direkte DM-Auth/Guards |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtenpräsentation, Zustellung und Legacy-Helfer für interaktive Antworten. Siehe [Message Presentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Inbound-Debounce, Mention-Matching, Mention-Policy-Helfer und Envelope-Helfer |
    | `plugin-sdk/channel-inbound-debounce` | Schmale Inbound-Debounce-Helfer |
    | `plugin-sdk/channel-mention-gating` | Schmale Helfer für Mention-Policy und Mention-Text ohne die breitere Inbound-Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope` | Schmale Helfer zur Formatierung eingehender Envelopes |
    | `plugin-sdk/channel-location` | Helfer für Channel-Standortkontext und -Formatierung |
    | `plugin-sdk/channel-logging` | Logging-Helfer für Channel bei Inbound-Drops sowie Fehlern bei Typing/Ack |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | Helfer für Channel-Nachrichtenaktionen sowie veraltete native Schema-Helfer, die aus Plugin-Kompatibilitätsgründen beibehalten werden |
    | `plugin-sdk/channel-targets` | Helfer zum Parsen/Abgleichen von Targets |
    | `plugin-sdk/channel-contract` | Typen für Channel-Verträge |
    | `plugin-sdk/channel-feedback` | Verdrahtung für Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Secret-Vertragshelfer wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Typen für Secret-Ziele |
  </Accordion>

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Helfer für die Einrichtung lokaler/selbstgehosteter Anbieter |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Einrichtungshelfer für selbstgehostete OpenAI-kompatible Anbieter |
    | `plugin-sdk/cli-backend` | Standardwerte für CLI-Backends + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Helfer zur Auflösung von API-Schlüsseln für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Helfer für API-Key-Onboarding/Profile-Schreiben wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Auth-Ergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame Helfer für interaktiven Login bei Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Lookup-Helfer für Auth-Env-Variablen von Anbietern |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Policies, Helfer für Anbieter-Endpunkte und Helfer zur Modell-ID-Normalisierung wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Helfer für HTTP-/Endpunktfähigkeiten von Anbietern, einschließlich Multipart-Form-Helfern für Audio-Transkription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Helfer für Verträge zu Web-Fetch-Konfiguration/-Auswahl wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helfer für Registrierung/Cache von Web-Fetch-Anbietern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Helfer für Web-Suche-Konfiguration/Anmeldedaten bei Anbietern, die kein Plugin-Enable-Wiring benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Helfer für Verträge zu Web-Suche-Konfiguration/Anmeldedaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und scoped Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Helfer für Registrierung/Cache/Runtime von Web-Suche-Anbietern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Bereinigung + Diagnose von Gemini-Schemas und xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und ähnliche |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Helfer für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Helfer für Provider-Transport wie guarded fetch, Message-Transforms im Transport und beschreibbare Event-Streams im Transport |
    | `plugin-sdk/provider-onboard` | Helfer zum Patchen von Onboarding-Konfigurationen |
    | `plugin-sdk/global-singleton` | Prozesslokale Helfer für Singleton/Map/Cache |
    | `plugin-sdk/group-activation` | Schmale Helfer für Aktivierungsmodus von Gruppen und Parsing von Befehlen |
  </Accordion>

  <Accordion title="Unterpfade für Auth und Sicherheit">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Helfer für Command-Registry, Helfer für Sender-Autorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helfer für Auflösung von Approvern und Action-Auth im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Helfer für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungs-Capability/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsamer Helfer zur Auflösung von Approval-Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Helfer zum Laden nativer Approval-Adapter für Hot-Channel-Entry-Points |
    | `plugin-sdk/approval-handler-runtime` | Breitere Runtime-Helfer für Approval-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Native Helfer für Approval-Target + Account-Binding |
    | `plugin-sdk/approval-reply-runtime` | Payload-Helfer für Antworten auf Exec-/Plugin-Genehmigungen |
    | `plugin-sdk/reply-dedupe` | Schmale Reset-Helfer für Dedupe eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Helfer für Channel-Vertragstests ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Command-Auth + Helfer für natives Session-Target |
    | `plugin-sdk/command-detection` | Gemeinsame Helfer zur Erkennung von Befehlen |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Prädikate für Befehlstext in Hot-Channel-Pfaden |
    | `plugin-sdk/command-surface` | Helfer für Normalisierung von Command-Bodys und Command-Surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helfer zur Sammlung von Secret-Verträgen für Secret-Oberflächen von Channel/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Schmale Helfer für `coerceSecretRef` und SecretRef-Typisierung für das Parsen von Secret-Verträgen/Konfiguration |
    | `plugin-sdk/security-runtime` | Gemeinsame Helfer für Vertrauen, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Helfer für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfen für pinned dispatcher ohne die breite Infra-Runtime-Oberfläche |
    | `plugin-sdk/ssrf-runtime` | Pinned dispatcher, SSRF-geschütztes fetch und SSRF-Richtlinien-Helfer |
    | `plugin-sdk/secret-input` | Helfer zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Anfragen/-Targets |
    | `plugin-sdk/webhook-request-guards` | Helfer für Body-Größe/Timeout von Anfragen |
  </Accordion>

  <Accordion title="Unterpfade für Runtime und Speicherung">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Helfer für Runtime/Logging/Backup/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Helfer für Runtime-Env, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Helfer für Registrierung und Lookup von Channel-Runtime-Kontext |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer für Plugin-Command/Hook/HTTP/interaktiv |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helfer für Pipeline von Webhook/internen Hooks |
    | `plugin-sdk/lazy-runtime` | Helfer für Lazy-Import/Binding von Runtime wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helfer für Prozess-`exec` |
    | `plugin-sdk/cli-runtime` | CLI-Helfer für Formatierung, Warten und Version |
    | `plugin-sdk/gateway-runtime` | Helfer für Gateway-Client und Channel-Status-Patches |
    | `plugin-sdk/config-runtime` | Helfer zum Laden/Schreiben von Konfiguration und Lookup-Helfer für Plugin-Konfiguration |
    | `plugin-sdk/telegram-command-config` | Helfer zur Normalisierung von Name/Beschreibung für Telegram-Befehle und zur Prüfung von Duplikaten/Konflikten, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Autolinks für Dateiverweise ohne das breite Barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helfer für Exec-/Plugin-Genehmigungen, Builder für Approval-Capabilities, Auth-/Profil-Helfer, native Routing-/Runtime-Helfer |
    | `plugin-sdk/reply-runtime` | Gemeinsame Runtime-Helfer für Inbound/Antwort, Chunking, Dispatch, Heartbeat, Reply-Planer |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Dispatch/Finalisierung von Antworten |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer für Reply-History in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Helfer für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helfer für Pfad und updated-at von Session Store |
    | `plugin-sdk/state-paths` | Helfer für Pfade von State/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Helfer für Route/Sitzungsschlüssel/Account-Binding wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer für Zusammenfassungen von Channel-/Account-Status, Standardwerte für Runtime-Status und Helfer für Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Helfer für Target-Resolver |
    | `plugin-sdk/string-normalization-runtime` | Helfer zur Normalisierung von Slugs/Strings |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Command-Runner mit normalisierten Ergebnissen für stdout/stderr |
    | `plugin-sdk/param-readers` | Gängige Leser für Tool-/CLI-Parameter |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Send-Target-Felder aus Tool-Args extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Helfer für temporäre Download-Pfade |
    | `plugin-sdk/logging-core` | Helfer für Subsystem-Logger und Redaction |
    | `plugin-sdk/markdown-table-runtime` | Helfer für Modus und Konvertierung von Markdown-Tabellen |
    | `plugin-sdk/json-store` | Kleine Helfer zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/file-lock` | Wiedereintrittsfähige File-Lock-Helfer |
    | `plugin-sdk/persistent-dedupe` | Helfer für festplattenbasierten Dedupe-Cache |
    | `plugin-sdk/acp-runtime` | ACP-Runtime-/Sitzungs- und Reply-Dispatch-Helfer |
    | `plugin-sdk/acp-binding-resolve-runtime` | Nur-Lese-Auflösung von ACP-Bindings ohne Imports für Lifecycle-Start |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Agenten-Runtime-Konfigurationsschema |
    | `plugin-sdk/boolean-param` | Leser für lose Boolean-Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Auflösung von Dangerous-Name-Matching |
    | `plugin-sdk/device-bootstrap` | Helfer für Device-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Channels, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Helfer für Antworten von `/models`-Befehl/Anbieter |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer für Registry/Build/Serialize nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins zu Low-Level-Agent-Harnesses: Harness-Typen, Hilfen für Steuerung/Abbruch aktiver Läufe, Hilfen für OpenClaw-Tool-Bridge und Utilities für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Helfer zur Erkennung von Z.A.I-Endpunkten |
    | `plugin-sdk/infra-runtime` | Helfer für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Helfer für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Helfer zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helfer für gewrapptes fetch, Proxy und pinned Lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-fetch ohne Importe von Proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Reader für Response-Bodys ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Zustand der Konversationsbindung ohne Routing für konfigurierte Bindings oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Lesehilfen für Session Store ohne breite Imports für Config-Schreibvorgänge/Wartung |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Sichtbarkeit von Kontext und Filterung von ergänzendem Kontext ohne breite Imports für Konfiguration/Sicherheit |
    | `plugin-sdk/string-coerce-runtime` | Schmale Helfer zur primitiven Coercion/Normalisierung von Records/Strings ohne Markdown-/Logging-Imports |
    | `plugin-sdk/host-runtime` | Helfer zur Normalisierung von Hostname und SCP-Host |
    | `plugin-sdk/retry-runtime` | Helfer für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Helfer für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Unterpfade für Capability und Testing">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Helfer für Fetch/Transformation/Speicherung von Medien plus Builder für Media-Payload |
    | `plugin-sdk/media-store` | Schmale Media-Store-Helfer wie `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Helfer für Failover bei Mediengenerierung, Auswahl von Kandidaten und Meldungen bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Typen für Anbieter von Medienverständnis plus anbieterorientierte Exporte für Bild-/Audio-Helfer |
    | `plugin-sdk/text-runtime` | Gemeinsame Helfer für Text/Markdown/Logging wie Entfernen von assitentensichtbarem Text, Helfer für Rendern/Chunking/Tabellen in Markdown, Hilfen für Redaction, Directive-Tag-Helfer und Utilities für sicheren Text |
    | `plugin-sdk/text-chunking` | Helfer für Chunking von ausgehendem Text |
    | `plugin-sdk/speech` | Typen für Speech-Anbieter plus anbieterorientierte Helfer für Directives, Registry und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsame Typen für Speech-Anbieter, Registry-, Directive- und Normalisierungshelfer |
    | `plugin-sdk/realtime-transcription` | Typen für Realtime-Transkriptionsanbieter, Registry-Helfer und gemeinsamer WebSocket-Sitzungshelfer |
    | `plugin-sdk/realtime-voice` | Typen für Realtime-Voice-Anbieter und Registry-Helfer |
    | `plugin-sdk/image-generation` | Typen für Anbieter von Bildgenerierung |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen für Bildgenerierung, Failover, Auth und Registry-Helfer |
    | `plugin-sdk/music-generation` | Typen für Anbieter/Anfragen/Ergebnisse der Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen für Musikgenerierung, Failover-Helfer, Provider-Lookup und Parsing von Modellreferenzen |
    | `plugin-sdk/video-generation` | Typen für Anbieter/Anfragen/Ergebnisse der Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen für Videogenerierung, Failover-Helfer, Provider-Lookup und Parsing von Modellreferenzen |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Targets und Helfer zum Installieren von Routen |
    | `plugin-sdk/webhook-path` | Helfer zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Helfer zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Konsumenten des Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte Hilfsoberfläche für memory-core für Manager-/Konfigurations-/Datei-/CLI-Helfer |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine für den Memory-Host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Verträge für den Memory-Host, Zugriff auf die Registry, lokaler Anbieter und generische Batch-/Remote-Helfer |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine für den Memory-Host |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine für den Memory-Host |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Helfer für den Memory-Host |
    | `plugin-sdk/memory-core-host-query` | Query-Helfer für den Memory-Host |
    | `plugin-sdk/memory-core-host-secret` | Secret-Helfer für den Memory-Host |
    | `plugin-sdk/memory-core-host-events` | Helfer für das Ereignisjournal des Memory-Host |
    | `plugin-sdk/memory-core-host-status` | Status-Helfer für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Helfer für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Helfer für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Helfer für den Memory-Host |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Core-Runtime-Helfer des Memory-Host |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Helfer des Ereignisjournals des Memory-Host |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Datei-/Runtime-Helfer des Memory-Host |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Helfer für memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Runtime-Fassade des Active Memory für Zugriff auf den Search-Manager |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Status-Helfer des Memory-Host |
    | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsoberfläche für memory-lancedb |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Helfer">
    | Familie | Aktuelle Unterpfade | Vorgesehene Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helfer zur Unterstützung des gebündelten Browser-Plugins (`browser-support` bleibt das Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Hilfs-/Runtime-Oberfläche für Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte Hilfs-/Runtime-Oberfläche für LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte Hilfsoberfläche für IRC |
    | Channel-spezifische Helfer | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Kompatibilitäts-/Helfer-Seams für gebündelte Channels |
    | Auth-/plugin-spezifische Helfer | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Helfer-Seams für gebündelte Features/Plugins; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Verwandt

- [Überblick über das Plugin SDK](/de/plugins/sdk-overview)
- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
