---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad importiert werden soll
    - Sie möchten eine Referenz für alle Registrierungsmethoden auf OpenClawPluginApi
    - Sie suchen einen bestimmten SDK-Export nach
sidebarTitle: SDK Overview
summary: Import-Map, Registrierungs-API-Referenz und SDK-Architektur
title: Überblick über das Plugin SDK
x-i18n:
    generated_at: "2026-04-21T06:28:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4561c074bb45529cd94d9d23ce7820b668cbc4ff6317230fdd5a5f27c5f14c67
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Überblick über das Plugin SDK

Das Plugin SDK ist der typisierte Vertrag zwischen Plugins und Core. Diese Seite ist die
Referenz für **was importiert werden soll** und **was Sie registrieren können**.

<Tip>
  **Suchen Sie eine How-to-Anleitung?**
  - Erstes Plugin? Beginnen Sie mit [Erste Schritte](/de/plugins/building-plugins)
  - Kanal-Plugin? Siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins)
  - Provider-Plugin? Siehe [Provider-Plugins](/de/plugins/sdk-provider-plugins)
</Tip>

## Importkonvention

Importieren Sie immer aus einem spezifischen Unterpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Unterpfad ist ein kleines, in sich geschlossenes Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für kanalspezifische Entry-/Build-Hilfen
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere Oberflächen-Sammlung und gemeinsam genutzte Hilfen wie
`buildChannelConfigSchema`.

Fügen Sie keine nach Providern benannten Convenience-Seams hinzu und hängen Sie auch nicht von ihnen ab, wie
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` oder
kanalmarkenspezifische Helper-Seams. Gebündelte Plugins sollten generische
SDK-Unterpfade in ihren eigenen `api.ts`- oder `runtime-api.ts`-Barrels zusammensetzen, und Core
sollte entweder diese pluginlokalen Barrels verwenden oder einen schmalen generischen SDK-
Vertrag hinzufügen, wenn der Bedarf wirklich kanalübergreifend ist.

Die generierte Export-Map enthält weiterhin eine kleine Menge gebündelter Plugin-Helper-
Seams wie `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese
Unterpfade existieren nur für die Pflege und Kompatibilität gebündelter Plugins; sie werden
bewusst aus der gemeinsamen Tabelle unten ausgelassen und sind nicht der empfohlene
Importpfad für neue Drittanbieter-Plugins.

## Referenz der Unterpfade

Die am häufigsten verwendeten Unterpfade, nach Zweck gruppiert. Die generierte vollständige Liste von
mehr als 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte gebündelte Plugin-Helper-Unterpfade erscheinen weiterhin in dieser generierten Liste.
Behandeln Sie diese als Implementierungsdetail-/Kompatibilitätsoberflächen, sofern eine Dokumentationsseite
einen davon nicht explizit als öffentlich hervorhebt.

### Plugin-Entry

| Unterpfad                  | Wichtige Exporte                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                      |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                         |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                       |

<AccordionGroup>
  <Accordion title="Kanal-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schema-Export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsam genutzte Hilfen für Setup-Assistenten, Allowlist-Abfragen, Builder für Setup-Status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfen für Multi-Account-Konfiguration/Aktions-Gating, Hilfen für Standardkonto-Fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfen zur Normalisierung von Konto-IDs |
    | `plugin-sdk/account-resolution` | Hilfen für Kontosuche + Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Hilfen für Kontolisten/Kontoaktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für das Kanal-Konfigurationsschema |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback für gebündelte Verträge |
    | `plugin-sdk/command-gating` | Schmale Hilfen für Autorisierungs-Gates von Befehlen |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Gemeinsam genutzte Hilfen für eingehendes Routing + Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsam genutzte Hilfen für eingehendes Aufzeichnen und Dispatch |
    | `plugin-sdk/messaging-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsam genutzte Hilfen zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Hilfen für ausgehende Identität, Sende-Delegation und Payload-Planung |
    | `plugin-sdk/poll-runtime` | Schmale Hilfen zur Normalisierung von Umfragen |
    | `plugin-sdk/thread-bindings-runtime` | Hilfen für Thread-Binding-Lebenszyklus und Adapter |
    | `plugin-sdk/agent-media-payload` | Veralteter Builder für Medien-Payloads von Agenten |
    | `plugin-sdk/conversation-runtime` | Hilfen für Konversation-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Laufzeit-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfen zur Auflösung von Gruppenrichtlinien zur Laufzeit |
    | `plugin-sdk/channel-status` | Gemeinsam genutzte Hilfen für Snapshots/Zusammenfassungen des Kanalstatus |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Kanal-Konfigurationsschemata |
    | `plugin-sdk/channel-config-writes` | Hilfen zur Autorisierung von Schreibvorgängen in die Kanalkonfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsam genutzte Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfen zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsam genutzte Hilfen für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsam genutzte Auth-/Guard-Hilfen für direkte DMs |
    | `plugin-sdk/interactive-runtime` | Hilfen zur Normalisierung/Reduktion interaktiver Antwort-Payloads |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Hilfen zu eingehendem Debounce, Mention-Matching, Mention-Policy und Envelope |
    | `plugin-sdk/channel-mention-gating` | Schmale Mention-Policy-Hilfen ohne die breitere eingehende Laufzeitoberfläche |
    | `plugin-sdk/channel-location` | Hilfen für Kanallokationskontext und Formatierung |
    | `plugin-sdk/channel-logging` | Kanal-Logging-Hilfen für verworfene eingehende Nachrichten und Fehler bei Typing/Ack |
    | `plugin-sdk/channel-send-result` | Antwortergebnistypen |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Kanalkontrakt-Typen |
    | `plugin-sdk/channel-feedback` | Verdrahtung für Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfen für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Typen für Secret-Ziele |
  </Accordion>

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Setup-Hilfen für lokale/selbst gehostete Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Hilfen für selbst gehostete OpenAI-kompatible Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Hilfen für die Auflösung von API-Schlüsseln zur Laufzeit für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hilfen für API-Key-Onboarding/Profile-Schreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Auth-Ergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsam genutzte interaktive Login-Hilfen für Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hilfen für die Suche nach Auth-Umgebungsvariablen von Providern |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsam genutzte Replay-Policy-Builder, Hilfen für Provider-Endpunkte und Hilfen zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfen für HTTP-/Endpunkt-Fähigkeiten von Providern |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Hilfen für Verträge zur Web-Fetch-Konfiguration/-Auswahl wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfen für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfen für Konfiguration/Anmeldedaten von Websuche für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Hilfen für Websuche-Konfigurations-/Anmeldedatenverträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfen für Registrierung/Cache/Laufzeit von Websuche-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Bereinigung + Diagnose von Gemini-Schemas und xAI-Kompatibilitätshilfen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsam genutzte Wrapper-Hilfen für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Hilfen für Provider-Transporte wie geschütztes Fetch, Transformationen von Transportnachrichten und beschreibbare Streams von Transportereignissen |
    | `plugin-sdk/provider-onboard` | Hilfen zum Patchen der Onboarding-Konfiguration |
    | `plugin-sdk/global-singleton` | Prozesslokale Hilfen für Singleton/Map/Cache |
  </Accordion>

  <Accordion title="Unterpfade für Authentifizierung und Sicherheit">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfen für Befehlsregistrierung, Hilfen für Absenderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfen für die Auflösung von Genehmigern und die Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfen für native Exec-Genehmigungsprofile/-filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungsfähigkeiten/-zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsam genutzte Hilfsfunktion zur Auflösung von Genehmigungs-Gateways |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfen zum Laden nativer Genehmigungsadapter für Hot-Channel-Entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeit-Hilfen für Genehmigungshandler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfen für native Genehmigungsziele + Konto-Binding |
    | `plugin-sdk/approval-reply-runtime` | Hilfen für Antwort-Payloads bei Exec-/Plugin-Genehmigungen |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung + native Hilfen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsam genutzte Hilfen zur Befehlserkennung |
    | `plugin-sdk/command-surface` | Hilfen für die Normalisierung von Befehls-Bodys und Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfen zum Sammeln von Secret-Verträgen für Secret-Oberflächen von Kanal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Schmale Hilfen für `coerceSecretRef` und SecretRef-Typisierung für Secret-Vertrags-/Konfigurations-Parsing |
    | `plugin-sdk/security-runtime` | Gemeinsam genutzte Hilfen für Vertrauen, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfen für Host-Allowlist und private-network-SSRF-Richtlinien |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfen für angeheftete Dispatcher ohne die breite Infrastruktur-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Hilfen für angehefteten Dispatcher, SSRF-geschütztes Fetch und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfen für Webhook-Anfragen/Ziele |
    | `plugin-sdk/webhook-request-guards` | Hilfen für Größe/Timeout von Request-Bodys |
  </Accordion>

  <Accordion title="Unterpfade für Laufzeit und Speicher">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Hilfen für Laufzeit/Logging/Backups/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Hilfen für Laufzeit-Umgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfen für Registrierung und Lookup von Channel-Runtime-Kontext |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsam genutzte Hilfen für Plugin-Befehle/Hooks/HTTP/interaktive Oberflächen |
    | `plugin-sdk/hook-runtime` | Gemeinsam genutzte Hilfen für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfen für Lazy-Runtime-Import/Binding wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfen für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Hilfen für CLI-Formatierung, Warten und Version |
    | `plugin-sdk/gateway-runtime` | Hilfen für Gateway-Client und Patches des Kanalstatus |
    | `plugin-sdk/config-runtime` | Hilfen zum Laden/Schreiben von Konfiguration |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Autolinks für Dateireferenzen ohne das breite `text-runtime`-Barrel |
    | `plugin-sdk/approval-runtime` | Hilfen für Exec-/Plugin-Genehmigungen, Builder für Genehmigungsfähigkeiten, Auth-/Profilhilfen, native Routing-/Laufzeithilfen |
    | `plugin-sdk/reply-runtime` | Gemeinsam genutzte Hilfen für eingehende/Antwort-Laufzeit, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfen für Antwort-Dispatch/-Finalisierung |
    | `plugin-sdk/reply-history` | Gemeinsam genutzte Hilfen für Reply-Verlauf in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Hilfen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfen für Session-Store-Pfad + `updated-at` |
    | `plugin-sdk/state-paths` | Hilfen für Pfade von State-/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Hilfen für Route/Sitzungsschlüssel/Konto-Binding wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsam genutzte Hilfen für Zusammenfassungen des Kanal-/Kontostatus, Standards für Laufzeitstatus und Hilfen für Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsam genutzte Hilfen für Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Hilfen zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus Fetch-/Request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsrunner mit normalisierten `stdout`-/`stderr`-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Param-Reader für Tools/CLI |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Sendefelder für Ziele aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsam genutzte Hilfen für Temp-Download-Pfade |
    | `plugin-sdk/logging-core` | Hilfen für Subsystem-Logger und Redigierung |
    | `plugin-sdk/markdown-table-runtime` | Hilfen für Markdown-Tabellenmodus |
    | `plugin-sdk/json-store` | Kleine Hilfen zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/file-lock` | Reentrante Hilfen für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Hilfen für festplattenbasierten Dedupe-Cache |
    | `plugin-sdk/acp-runtime` | Hilfen für ACP-Laufzeit/Sitzung und Reply-Dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startup-Imports |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Agent-Runtime-Konfigurationsschemata |
    | `plugin-sdk/boolean-param` | Lockerer Boolean-Param-Reader |
    | `plugin-sdk/dangerous-name-runtime` | Hilfen zur Auflösung beim Abgleich gefährlicher Namen |
    | `plugin-sdk/device-bootstrap` | Hilfen für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsam genutzte Primitive für passive Kanäle, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Hilfen für `/models`-Befehl/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfen zum Auflisten von Skills-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfen für Registry/Build/Serialisierung nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberfläche für Low-Level-Agent-Harnesses: Harness-Typen, Hilfen für Steuern/Abbrechen aktiver Läufe, OpenClaw-Tool-Bridge-Hilfen und Hilfsfunktionen für Versuchsresultate |
    | `plugin-sdk/provider-zai-endpoint` | Hilfen zur Erkennung von Z.A.I-Endpunkten |
    | `plugin-sdk/infra-runtime` | Hilfen für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Hilfen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfen für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Hilfen für Fehlergraph, Formatierung, gemeinsame Fehlerklassifikation, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Hilfen für umhülltes Fetch, Proxy und angeheftetes Lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Laufzeit-Fetch ohne Proxy-/Guarded-Fetch-Imports |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Reader für Response-Bodys ohne die breite Medien-Laufzeitoberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversations-Binding-Status ohne Routing für konfigurierte Bindings oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Hilfen zum Lesen des Session-Stores ohne breite Konfigurationsschreib-/Wartungs-Imports |
    | `plugin-sdk/context-visibility-runtime` | Hilfen zur Auflösung der Kontextsichtigkeit und Filterung von Zusatzkontext ohne breite Konfigurations-/Sicherheits-Imports |
    | `plugin-sdk/string-coerce-runtime` | Schmale Hilfen für primitive Record-/String-Coercion und Normalisierung ohne Markdown-/Logging-Imports |
    | `plugin-sdk/host-runtime` | Hilfen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfen für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Hilfen für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Abfrage/Deduplizierung von Verzeichnissen |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Unterpfade für Fähigkeiten und Tests">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsam genutzte Hilfen für Medien-Fetch/Transformation/Speicherung plus Builder für Medien-Payloads |
    | `plugin-sdk/media-generation-runtime` | Gemeinsam genutzte Hilfen für Media-Generation-Failover, Kandidatenauswahl und Hinweise bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis plus providerseitige Exporte für Bild-/Audio-Hilfen |
    | `plugin-sdk/text-runtime` | Gemeinsam genutzte Text-/Markdown-/Logging-Hilfen wie das Entfernen von für Assistenten sichtbarem Text, Hilfen für Markdown-Rendern/Chunking/Tabellen, Hilfen für Redigierung, Directive-Tag-Hilfen und Safe-Text-Utilities |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen plus providerseitige Hilfen für Directives, Registry und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsam genutzte Hilfen für Speech-Provider-Typen, Registry, Directives und Normalisierung |
    | `plugin-sdk/realtime-transcription` | Provider-Typen und Registry-Hilfen für Realtime-Transkription |
    | `plugin-sdk/realtime-voice` | Provider-Typen und Registry-Hilfen für Realtime-Voice |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung |
    | `plugin-sdk/image-generation-core` | Gemeinsam genutzte Hilfen für Bildgenerierungs-Typen, Failover, Auth und Registry |
    | `plugin-sdk/music-generation` | Typen für Music-Generation-Provider/Anfrage/Ergebnis |
    | `plugin-sdk/music-generation-core` | Gemeinsam genutzte Hilfen für Music-Generation-Typen, Failover, Provider-Lookup und Modell-Ref-Parsing |
    | `plugin-sdk/video-generation` | Typen für Video-Generation-Provider/Anfrage/Ergebnis |
    | `plugin-sdk/video-generation-core` | Gemeinsam genutzte Hilfen für Video-Generation-Typen, Failover, Provider-Lookup und Modell-Ref-Parsing |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Hilfen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Hilfen zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsam genutzte Hilfen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Verbraucher des Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte `memory-core`-Helper-Oberfläche für Hilfen zu Manager/Konfiguration/Datei/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Speicherindex/-suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Verträge für Memory-Host-Embeddings, Registry-Zugriff, lokaler Provider und generische Hilfen für Batches/Remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfen für den Memory-Host |
    | `plugin-sdk/memory-core-host-query` | Abfragehilfen für den Memory-Host |
    | `plugin-sdk/memory-core-host-secret` | Secret-Hilfen für den Memory-Host |
    | `plugin-sdk/memory-core-host-events` | Hilfen für das Ereignisjournal des Memory-Hosts |
    | `plugin-sdk/memory-core-host-status` | Statushilfen für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeithilfen für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Laufzeithilfen für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Laufzeithilfen für den Memory-Host |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Core-Laufzeithilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Hilfen des Ereignisjournals des Memory-Hosts |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Datei-/Laufzeithilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsam genutzte Hilfen für verwaltetes Markdown für speichernahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-Laufzeit-Fassade für den Zugriff auf den Such-Manager |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Statushilfen des Memory-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte `memory-lancedb`-Helper-Oberfläche |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Helfer">
    | Familie | Aktuelle Unterpfade | Vorgesehene Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Hilfen zur Unterstützung des gebündelten Browser-Plugins (`browser-support` bleibt das Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Helper-/Laufzeitoberfläche für Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte Helper-/Laufzeitoberfläche für LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte Helper-Oberfläche für IRC |
    | Kanalspezifische Helfer | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Gebündelte Kompatibilitäts-/Helper-Seams für Kanäle |
    | Auth-/pluginspezifische Helfer | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Gebündelte Feature-/Plugin-Helper-Seams; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Fähigkeitsregistrierung

| Methode                                          | Was sie registriert                    |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                     |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Ausführer |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend           |
| `api.registerChannel(...)`                       | Messaging-Kanal                        |
| `api.registerSpeechProvider(...)`                | Text-to-Speech-/STT-Synthese           |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Realtime-Transkription       |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Realtime-Voice-Sitzungen        |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse              |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                        |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                       |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                       |
| `api.registerWebFetchProvider(...)`              | Provider für Web-Fetch / Scraping      |
| `api.registerWebSearchProvider(...)`             | Websuche                               |

### Tools und Befehle

| Methode                         | Was sie registriert                            |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)    |

### Infrastruktur

| Methode                                        | Was sie registriert                     |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Ereignis-Hook                           |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                     |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                         |
| `api.registerService(service)`                 | Hintergrunddienst                       |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                    |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver speichernaher Prompt-Abschnitt |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Korpus für Speicher-Suche/-Lesen |

Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bleiben immer `operator.admin`, auch wenn ein Plugin versucht, einen
engeren Scope für eine Gateway-Methode zuzuweisen. Bevorzugen Sie pluginspezifische Präfixe für
plugin-eigene Methoden.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Befehlsdeskriptoren zur Parse-Zeit, die für Root-CLI-Hilfe,
  Routing und die Lazy-Registrierung von Plugin-CLI verwendet werden

Wenn Sie möchten, dass ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleibt,
stellen Sie `descriptors` bereit, die jede Befehlswurzel auf oberster Ebene abdecken, die von diesem
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

Verwenden Sie `commands` allein nur dann, wenn Sie keine lazy Root-CLI-Registrierung benötigen.
Dieser eager-Kompatibilitätspfad bleibt unterstützt, installiert aber keine
deskriptorbasierten Platzhalter für Lazy Loading zur Parse-Zeit.

### CLI-Backend-Registrierung

`api.registerCliBackend(...)` ermöglicht es einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu verwalten.

- Die Backend-`id` wird zum Provider-Präfix in Modell-Refs wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Die Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw legt `agents.defaults.cliBackends.<id>` über den
  Plugin-Standardwert, bevor das CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitätsumschreibungen benötigt
  (zum Beispiel zur Normalisierung älterer Flag-Formen).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (immer nur eine aktiv). Der Callback `assemble()` erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Speicherfähigkeit                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Builder für Speicher-Prompt-Abschnitte                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Speicher-Flush-Pläne                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | Speicher-Laufzeitadapter                                                                                                                                |

### Adapter für Speicher-Embeddings

| Methode                                        | Was sie registriert                           |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter für Speicher-Embeddings für das aktive Plugin |

- `registerMemoryCapability` ist die bevorzugte exklusive Speicher-Plugin-API.
- `registerMemoryCapability` kann auch `publicArtifacts.listArtifacts(...)` bereitstellen,
  sodass Companion-Plugins exportierte Speicherartefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, statt in das private
  Layout eines bestimmten Speicher-Plugins einzugreifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind ältere, kompatible exklusive Speicher-Plugin-APIs.
- `registerMemoryEmbeddingProvider` ermöglicht dem aktiven Speicher-Plugin, einen
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte, vom Plugin definierte ID).
- Die Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie tut                  |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lebenszyklus-Hook |
| `api.onConversationBindingResolved(handler)` | Callback für Konversations-Binding |

### Semantik von Hook-Entscheidungen

- `before_tool_call`: die Rückgabe von `{ block: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie beim Weglassen von `block`), nicht als Überschreibung.
- `before_install`: die Rückgabe von `{ block: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie beim Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: die Rückgabe von `{ handled: true, ... }` ist final. Sobald ein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der Standard-Dispatch-Pfad des Modells übersprungen.
- `message_sending`: die Rückgabe von `{ cancel: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie beim Weglassen von `cancel`), nicht als Überschreibung.

### API-Objektfelder

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Pfad zur Plugin-Quelle                                                                      |
| `api.rootDir`            | `string?`                 | Plugin-Root-Verzeichnis (optional)                                                          |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Laufzeit-Snapshot, wenn verfügbar)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Laufzeit-Hilfen](/de/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Startup-/Setup-Fenster vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Root auflösen                                                       |

## Konvention für interne Module

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Verbraucher
  runtime-api.ts    # Nur interne Laufzeit-Exporte
  index.ts          # Plugin-Entrypoint
  setup-entry.ts    # Leichtgewichtiger Entry nur für Setup (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin in Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Über Facades geladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen jetzt den
aktiven Laufzeit-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Laufzeit-
Snapshot existiert, greifen sie auf die auf Datenträger aufgelöste Konfigurationsdatei zurück.

Provider-Plugins können auch ein schmales pluginlokales Vertrags-Barrel bereitstellen, wenn ein
Helper absichtlich providerspezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Aktuelles gebündeltes Beispiel: Der Anthropic-Provider behält seine Claude-
Stream-Hilfen in seinem eigenen öffentlichen `api.ts`- / `contract-api.ts`-Seam, statt
Anthropic-Beta-Header- und `service_tier`-Logik in einen generischen
`plugin-sdk/*`-Vertrag zu verschieben.

Weitere aktuelle gebündelte Beispiele:

- `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
  Hilfen für Standardmodelle und Builder für Realtime-Provider
- `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder sowie
  Hilfen für Onboarding/Konfiguration

<Warning>
  Produktionscode von Extensions sollte außerdem Importe von `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helper wirklich gemeinsam genutzt wird, verschieben Sie ihn in einen neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  fähigkeitsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

- [Entrypoints](/de/plugins/sdk-entrypoints) — Optionen für `definePluginEntry` und `defineChannelPluginEntry`
- [Laufzeit-Hilfen](/de/plugins/sdk-runtime) — vollständige Referenz des Namespace `api.runtime`
- [Setup und Konfiguration](/de/plugins/sdk-setup) — Packaging, Manifeste, Konfigurationsschemata
- [Testen](/de/plugins/sdk-testing) — Test-Utilities und Lint-Regeln
- [SDK-Migration](/de/plugins/sdk-migration) — Migration von veralteten Oberflächen
- [Plugin-Interna](/de/plugins/architecture) — tiefe Architektur und Fähigkeitsmodell
