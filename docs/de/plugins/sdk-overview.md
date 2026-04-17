---
read_when:
    - Sie müssen wissen, aus welchem SDK-Subpfad importiert werden soll.
    - Sie möchten eine Referenz für alle Registrierungsmethoden in `OpenClawPluginApi`.
    - Sie suchen nach einem bestimmten SDK-Export.
sidebarTitle: SDK Overview
summary: Import-Map, Referenz zur Registrierungs-API und SDK-Architektur
title: Überblick über das Plugin SDK
x-i18n:
    generated_at: "2026-04-17T06:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b177fdb6830f415d998a24812bc2c7db8124d3ba77b0174c9a67ac7d747f7e5a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Überblick über das Plugin SDK

Das Plugin SDK ist der typisierte Vertrag zwischen Plugins und dem Kern. Diese Seite ist die
Referenz dafür, **was importiert werden soll** und **was Sie registrieren können**.

<Tip>
  **Suchen Sie nach einer Anleitung?**
  - Erstes Plugin? Beginnen Sie mit [Erste Schritte](/de/plugins/building-plugins)
  - Channel Plugin? Siehe [Channel Plugins](/de/plugins/sdk-channel-plugins)
  - Provider Plugin? Siehe [Provider Plugins](/de/plugins/sdk-provider-plugins)
</Tip>

## Importkonvention

Importieren Sie immer aus einem spezifischen Subpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpfad ist ein kleines, in sich geschlossenes Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für eintragsspezifische Channel- und Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; verwenden Sie `openclaw/plugin-sdk/core` für
die breitere Dachoberfläche und gemeinsam genutzte Helfer wie
`buildChannelConfigSchema`.

Fügen Sie keine nach Providern benannten Convenience-Seams hinzu und hängen Sie auch nicht von ihnen ab, wie etwa
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` oder
an Channel gebrandete Helper-Seams. Gebündelte Plugins sollten generische
SDK-Subpfade innerhalb ihrer eigenen `api.ts`- oder `runtime-api.ts`-Barrels zusammensetzen, und der Kern
sollte entweder diese pluginlokalen Barrels verwenden oder einen schmalen generischen SDK-
Vertrag hinzufügen, wenn der Bedarf tatsächlich kanalübergreifend ist.

Die generierte Export-Map enthält weiterhin eine kleine Menge an Helper-
Seams für gebündelte Plugins wie `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese
Subpfade existieren nur für die Wartung gebündelter Plugins und die Kompatibilität; sie werden
absichtlich aus der allgemeinen Tabelle unten ausgelassen und sind nicht der empfohlene
Importpfad für neue Drittanbieter-Plugins.

## Referenz der Subpfade

Die am häufigsten verwendeten Subpfade, nach Zweck gruppiert. Die generierte vollständige Liste mit
mehr als 200 Subpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte Helper-Subpfade für gebündelte Plugins erscheinen weiterhin in dieser generierten Liste.
Behandeln Sie diese als Implementierungsdetail- oder Kompatibilitätsoberflächen, sofern nicht eine Dokumentationsseite
einen davon ausdrücklich als öffentlich hervorhebt.

### Plugin-Einstiegspunkt

| Subpath                     | Wichtige Exporte                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Channel-Subpfade">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schema-Export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsam genutzte Setup-Wizard-Helfer, Allowlist-Aufforderungen, Setup-Status-Builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfen für Multi-Account-Konfiguration/Aktions-Gates, Hilfen für Standardkonto-Fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfen zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Hilfen für Account-Lookup + Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Helfer für Account-Liste/Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Channel-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Helfer zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback für gebündelte Verträge |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Gemeinsam genutzte Helfer für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsam genutzte Helfer zum Aufzeichnen und Verteilen eingehender Nachrichten |
    | `plugin-sdk/messaging-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsam genutzte Helfer zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Hilfen für ausgehende Identität/Sende-Delegates |
    | `plugin-sdk/thread-bindings-runtime` | Lifecycle- und Adapter-Helfer für Thread-Bindungen |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Media-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfen für Conversation-/Thread-Bindung, Pairing und konfigurierte Bindungen |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfen zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsam genutzte Helfer für Channel-Status-Snapshots/Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Channel-Konfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Hilfen zur Autorisierung von Channel-Konfigurationsschreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsam genutzte Prelude-Exporte für Channel Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helfer zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsam genutzte Helfer für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsam genutzte Helfer für Auth/Guards bei direkten DMs |
    | `plugin-sdk/interactive-runtime` | Helfer zur Normalisierung/Reduktion interaktiver Antwort-Payloads |
    | `plugin-sdk/channel-inbound` | Hilfen für eingehendes Debouncing, Mention-Abgleich, Mention-Richtlinien und Envelope-Helfer |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Typen für Channel-Verträge |
    | `plugin-sdk/channel-feedback` | Verdrahtung für Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helfer für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Subpfade">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Setup-Helfer für lokale/self-hosted Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Helfer für OpenAI-kompatible self-hosted Provider |
    | `plugin-sdk/cli-backend` | CLI-Backends-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-Helfer zur API-Key-Auflösung für Provider Plugins |
    | `plugin-sdk/provider-auth-api-key` | API-Key-Onboarding-/Profil-Schreibhelfer wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsam genutzte interaktive Login-Helfer für Provider Plugins |
    | `plugin-sdk/provider-env-vars` | Helfer zum Lookup von Auth-Umgebungsvariablen für Provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsam genutzte Builder für Replay-Richtlinien, Provider-Endpunkt-Helfer und Hilfen zur Modell-ID-Normalisierung wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Helfer für HTTP-/Endpunkt-Fähigkeiten von Providern |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Helfer für Web-Fetch-Konfigurations-/Auswahlverträge wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helfer für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Helfer für Web-Search-Konfiguration/Anmeldedaten für Provider, die keine Verdrahtung zur Plugin-Aktivierung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Helfer für Web-Search-Konfigurations-/Anmeldedatenverträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Helfer für Registrierung/Cache/Runtime von Web-Search-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Bereinigung + Diagnose von Gemini-Schemas und xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsam genutzte Wrapper-Helfer für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helfer für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Hilfen für prozesslokale Singleton-/Map-/Cache-Strukturen |
  </Accordion>

  <Accordion title="Subpfade für Authentifizierung und Sicherheit">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfen für die Befehlsregistrierung, Hilfen für die Absenderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfen für Approver-Auflösung und Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfen für native Ausführungs-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungsfunktionen/-zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsam genutzter Helfer zur Auflösung von Genehmigungs-Gateways |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Ladehilfen für native Genehmigungsadapter für schnelle Channel-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Umfassendere Runtime-Helfer für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfen für native Genehmigungsziele + Account-Bindungen |
    | `plugin-sdk/approval-reply-runtime` | Hilfen für Antwort-Payloads bei Ausführungs-/Plugin-Genehmigungen |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung + Hilfen für native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsam genutzte Helfer zur Befehlserkennung |
    | `plugin-sdk/command-surface` | Hilfen zur Normalisierung von Befehls-Body und für Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Sammelhilfen für Secret-Verträge für Secret-Oberflächen von Channels/Plugins |
    | `plugin-sdk/secret-ref-runtime` | Schmale `coerceSecretRef`- und SecretRef-Typisierungshilfen für Secret-Vertrags-/Konfigurations-Parsing |
    | `plugin-sdk/security-runtime` | Gemeinsam genutzte Hilfen für Vertrauen, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfen für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-runtime` | Hilfen für Pinned-Dispatcher, SSRF-geschützte Fetches und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfen für Webhook-Anfragen/-Ziele |
    | `plugin-sdk/webhook-request-guards` | Hilfen für Request-Body-Größe/Timeouts |
  </Accordion>

  <Accordion title="Subpfade für Runtime und Speicherung">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Umfassende Hilfen für Runtime/Logging/Backups/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Hilfen für Runtime-Umgebung, Logger, Timeouts, Wiederholungen und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfen für Registrierung und Lookup von Channel-Runtime-Kontexten |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsam genutzte Hilfen für Plugin-Befehle/Hooks/HTTP/Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsam genutzte Hilfen für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfen für Lazy-Runtime-Import/-Bindung wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfen zur Prozessausführung |
    | `plugin-sdk/cli-runtime` | Hilfen für CLI-Formatierung, Warten und Versionen |
    | `plugin-sdk/gateway-runtime` | Hilfen für Gateway-Clients und Channel-Status-Patches |
    | `plugin-sdk/config-runtime` | Hilfen zum Laden/Schreiben von Konfigurationen |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-Beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/approval-runtime` | Hilfen für Ausführungs-/Plugin-Genehmigungen, Builder für Genehmigungsfunktionen, Hilfen für Auth/Profile, native Routing-/Runtime-Helfer |
    | `plugin-sdk/reply-runtime` | Gemeinsam genutzte Hilfen für eingehende/Antwort-Runtime, Chunking, Dispatch, Heartbeat, Antwortplanung |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfen für Antwort-Dispatch/Finalisierung |
    | `plugin-sdk/reply-history` | Gemeinsam genutzte Hilfen für Antwortverläufe in kurzen Zeitfenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Hilfen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfen für Pfade von Session Stores + `updated-at` |
    | `plugin-sdk/state-paths` | Hilfen für Verzeichnispfade von State/OAuth |
    | `plugin-sdk/routing` | Hilfen für Routen-/Session-Key-/Account-Bindungen wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsam genutzte Hilfen für Statuszusammenfassungen von Channels/Accounts, Runtime-Standardzustände und Hilfen für Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsam genutzte Hilfen für Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Hilfen zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsrunner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Allgemeine Parameterleser für Tools/CLI |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Ziel-Felder zum Senden aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsam genutzte Hilfen für temporäre Download-Pfade |
    | `plugin-sdk/logging-core` | Hilfen für Subsystem-Logger und Redaktion |
    | `plugin-sdk/markdown-table-runtime` | Hilfen für Markdown-Tabellenmodi |
    | `plugin-sdk/json-store` | Kleine Hilfen zum Lesen/Schreiben von JSON-Statusdaten |
    | `plugin-sdk/file-lock` | Hilfen für reentrant File Locks |
    | `plugin-sdk/persistent-dedupe` | Hilfen für festplattenbasierte Dedupe-Caches |
    | `plugin-sdk/acp-runtime` | Hilfen für ACP-Runtime/Sitzungen und Antwort-Dispatch |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Agent-Runtime-Konfigurationsschemas |
    | `plugin-sdk/boolean-param` | Toleranter Leser für Boolean-Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Hilfen zur Auflösung von Dangerous-Name-Matches |
    | `plugin-sdk/device-bootstrap` | Hilfen für Device-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsam genutzte Primitive für passive Channels, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Hilfen für `/models`-Befehle/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfen zum Auflisten von Skills-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfen für Registrierung/Build/Serialisierung nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberfläche für Low-Level-Agent-Harnesses: Harness-Typen, Hilfen zum Steuern/Abbrechen aktiver Ausführungen, OpenClaw-Tool-Bridge-Helfer und Hilfsfunktionen für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Hilfen zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/infra-runtime` | Hilfen für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Hilfen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfen für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsam genutzte Hilfen zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Hilfen für umschlossene Fetches, Proxys und Pinned-Lookups |
    | `plugin-sdk/host-runtime` | Hilfen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfen für Wiederholungskonfiguration und Wiederholungsrunner |
    | `plugin-sdk/agent-runtime` | Hilfen für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpfade für Fähigkeiten und Tests">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsam genutzte Hilfen für Medienabruf/-umwandlung/-speicherung sowie Builder für Medien-Payloads |
    | `plugin-sdk/media-generation-runtime` | Gemeinsam genutzte Hilfen für Media-Generation-Failover, Kandidatenauswahl und Meldungen bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie bild-/audio-bezogene Helper-Exporte für Provider |
    | `plugin-sdk/text-runtime` | Gemeinsam genutzte Hilfen für Text/Markdown/Logging wie das Entfernen von für Assistenten sichtbarem Text, Hilfen für Markdown-Rendering/Chunking/Tabellen, Redaktionshilfen, Hilfen für Direktiven-Tags und Safe-Text-Utilities |
    | `plugin-sdk/text-chunking` | Hilfen für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen sowie providerseitige Hilfen für Direktiven, Registrierung und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsam genutzte Speech-Provider-Typen, Registrierung, Direktiven und Normalisierungshilfen |
    | `plugin-sdk/realtime-transcription` | Provider-Typen und Registrierungshilfen für Realtime-Transkription |
    | `plugin-sdk/realtime-voice` | Provider-Typen und Registrierungshilfen für Realtime-Voice |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung |
    | `plugin-sdk/image-generation-core` | Gemeinsam genutzte Typen, Failover-, Auth- und Registrierungshilfen für Bildgenerierung |
    | `plugin-sdk/music-generation` | Typen für Musikgenerierungs-Provider/-Requests/-Ergebnisse |
    | `plugin-sdk/music-generation-core` | Gemeinsam genutzte Typen, Failover-Helfer, Provider-Lookup und Model-Ref-Parsing für Musikgenerierung |
    | `plugin-sdk/video-generation` | Typen für Videogenerierungs-Provider/-Requests/-Ergebnisse |
    | `plugin-sdk/video-generation-core` | Gemeinsam genutzte Typen, Failover-Helfer, Provider-Lookup und Model-Ref-Parsing für Videogenerierung |
    | `plugin-sdk/webhook-targets` | Registrierung von Webhook-Zielen und Hilfen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Hilfen zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsam genutzte Hilfen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Plugin-SDK-Consumer |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpfade für Speicher">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte `memory-core`-Helper-Oberfläche für Hilfen zu Manager/Konfiguration/Dateien/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Speicherindex/-suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine für den Speicher-Host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Verträge für Speicher-Host-Embeddings, Zugriff auf die Registrierung, lokaler Provider und generische Batch-/Remote-Helfer |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine für den Speicher-Host |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine für den Speicher-Host |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfen für den Speicher-Host |
    | `plugin-sdk/memory-core-host-query` | Query-Helfer für den Speicher-Host |
    | `plugin-sdk/memory-core-host-secret` | Secret-Helfer für den Speicher-Host |
    | `plugin-sdk/memory-core-host-events` | Hilfen für Ereignisjournal des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-status` | Status-Helfer für den Speicher-Host |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Helfer für den Speicher-Host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Helfer für den Speicher-Host |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Helfer für den Speicher-Host |
    | `plugin-sdk/memory-host-core` | Herstellerneutraler Alias für Core-Runtime-Helfer des Speicher-Hosts |
    | `plugin-sdk/memory-host-events` | Herstellerneutraler Alias für Hilfen für Ereignisjournal des Speicher-Hosts |
    | `plugin-sdk/memory-host-files` | Herstellerneutraler Alias für Datei-/Runtime-Helfer des Speicher-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsam genutzte Hilfen für verwaltetes Markdown für speichernahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory Runtime-Fassade für den Zugriff auf Search-Manager |
    | `plugin-sdk/memory-host-status` | Herstellerneutraler Alias für Status-Helfer des Speicher-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte `memory-lancedb`-Helper-Oberfläche |
  </Accordion>

  <Accordion title="Reservierte gebündelte Helper-Subpfade">
    | Family | Aktuelle Subpfade | Vorgesehene Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Support-Helfer für gebündelte Browser-Plugins (`browser-support` bleibt das Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Helper-/Runtime-Oberfläche für Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte Helper-/Runtime-Oberfläche für LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte Helper-Oberfläche für IRC |
    | Channel-spezifische Helfer | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Kompatibilitäts-/Helper-Seams für gebündelte Channels |
    | Auth-/plugin-spezifische Helfer | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Helper-Seams für gebündelte Funktionen/Plugins; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Fähigkeitsregistrierung

| Method                                           | Was registriert wird                 |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                   |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend         |
| `api.registerChannel(...)`                       | Nachrichten-Channel                  |
| `api.registerSpeechProvider(...)`                | Text-to-Speech- / STT-Synthese       |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription      |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Voice-Sitzungen      |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse            |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                      |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                     |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                     |
| `api.registerWebFetchProvider(...)`              | Web-Fetch- / Scrape-Provider         |
| `api.registerWebSearchProvider(...)`             | Websuche                             |

### Tools und Befehle

| Method                          | Was registriert wird                          |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)   |

### Infrastruktur

| Method                                         | Was registriert wird                  |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Ereignis-Hook                         |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                   |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                       |
| `api.registerService(service)`                 | Hintergrunddienst                     |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                  |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver speichernaher Prompt-Abschnitt |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Korpus für Speichersuche/-lesen |

Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bleiben immer `operator.admin`, auch wenn ein Plugin versucht, einen
engeren Geltungsbereich für Gateway-Methoden zuzuweisen. Bevorzugen Sie pluginspezifische Präfixe für
plugin-eigene Methoden.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Befehlsdeskriptoren zur Parse-Zeit, verwendet für CLI-Hilfe auf Root-Ebene,
  Routing und Lazy-Registrierung von Plugin-CLI-Befehlen

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleiben soll,
geben Sie `descriptors` an, die jede Befehlswurzel auf oberster Ebene abdecken, die von diesem
Registrar bereitgestellt wird.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Matrix-Konten, Verifizierung, Geräte und Profilstatus verwalten",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` allein nur dann, wenn Sie keine Lazy-Root-CLI-Registrierung benötigen.
Dieser eager Kompatibilitätspfad wird weiterhin unterstützt, installiert aber keine
deskriptorbasierten Platzhalter für lazy Laden zur Parse-Zeit.

### Registrierung des CLI-Backends

`api.registerCliBackend(...)` ermöglicht es einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu besitzen.

- Die `id` des Backends wird zum Provider-Präfix in Modell-Refs wie `codex-cli/gpt-5`.
- Die `config` des Backends verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw führt `agents.defaults.cliBackends.<id>` über der
  Plugin-Standardeinstellung zusammen, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitätsanpassungen benötigt
  (zum Beispiel zum Normalisieren alter Flag-Formen).

### Exklusive Slots

| Method                                     | Was registriert wird                                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context Engine (immer nur eine gleichzeitig aktiv). Der Callback `assemble()` erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen passend gestalten kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Speicherfähigkeit                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | Builder für Speicher-Prompt-Abschnitte                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Speicher-Flush-Pläne                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | Speicher-Runtime-Adapter                                                                                                                                 |

### Speicher-Embedding-Adapter

| Method                                         | Was registriert wird                         |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Speicher-Embedding-Adapter für das aktive Plugin |

- `registerMemoryCapability` ist die bevorzugte exklusive Speicher-Plugin-API.
- `registerMemoryCapability` kann außerdem `publicArtifacts.listArtifacts(...)`
  bereitstellen, damit Begleit-Plugins exportierte Speicherartefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, statt in das private
  Layout eines bestimmten Speicher-Plugins zu greifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind Legacy-kompatible exklusive Speicher-Plugin-APIs.
- `registerMemoryEmbeddingProvider` ermöglicht es dem aktiven Speicher-Plugin, einen
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine
  benutzerdefinierte, vom Plugin definierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Method                                       | Was sie bewirkt              |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook   |
| `api.onConversationBindingResolved(handler)` | Callback für Conversation-Bindung |

### Entscheidungssemantik von Hooks

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist endgültig. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist endgültig. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist endgültig. Sobald ein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für den Modell-Dispatch übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist endgültig. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Überschreibung.

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                            |
| `api.rootDir`            | `string?`                 | Plugin-Root-Verzeichnis (optional)                                                          |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, falls verfügbar)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspezifische Konfiguration aus `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helfer](/de/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger mit Scope (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Start-/Setup-Fenster vor dem vollständigen Einstieg |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Root auflösen                                                       |

## Internes Modulkonzept

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Consumer
  runtime-api.ts    # Nur interne Runtime-Exporte
  index.ts          # Plugin-Einstiegspunkt
  setup-entry.ts    # Leichtgewichtiger Einstieg nur für Setup (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin in Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Öffentliche Oberflächen gebündelter Plugins, die per Fassade geladen werden (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Einstiegspunkte), bevorzugen jetzt den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Falls noch kein Runtime-
Snapshot existiert, greifen sie auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück.

Provider Plugins können außerdem ein schmales pluginlokales Vertrags-Barrel bereitstellen, wenn ein
Helfer absichtlich providerspezifisch ist und noch nicht in einen generischen SDK-
Subpfad gehört. Aktuelles gebündeltes Beispiel: Der Anthropic-Provider belässt seine Claude-
Stream-Helfer in seinem eigenen öffentlichen `api.ts`-/`contract-api.ts`-Seam, statt
Anthropic-Beta-Header- und `service_tier`-Logik in einen generischen
`plugin-sdk/*`-Vertrag zu verschieben.

Weitere aktuelle gebündelte Beispiele:

- `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
  Hilfen für Standardmodelle und Realtime-Provider-Builder
- `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder sowie
  Helfer für Onboarding/Konfiguration

<Warning>
  Produktionscode von Erweiterungen sollte auch Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helfer wirklich gemeinsam genutzt wird, verschieben Sie ihn in einen neutralen SDK-Subpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  fähigkeitsorientierte Oberfläche, statt zwei Plugins aneinander zu koppeln.
</Warning>

## Verwandt

- [Einstiegspunkte](/de/plugins/sdk-entrypoints) — Optionen für `definePluginEntry` und `defineChannelPluginEntry`
- [Runtime-Helfer](/de/plugins/sdk-runtime) — vollständige Referenz des Namensraums `api.runtime`
- [Setup und Konfiguration](/de/plugins/sdk-setup) — Packaging, Manifeste, Konfigurationsschemas
- [Tests](/de/plugins/sdk-testing) — Test-Utilities und Lint-Regeln
- [SDK-Migration](/de/plugins/sdk-migration) — Migration von veralteten Oberflächen
- [Plugin-Interna](/de/plugins/architecture) — tiefergehende Architektur und Fähigkeitsmodell
