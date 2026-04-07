---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad Sie importieren sollen
    - Sie möchten eine Referenz für alle Registrierungsmethoden in OpenClawPluginApi
    - Sie suchen einen bestimmten SDK-Export nach
sidebarTitle: SDK Overview
summary: Importzuordnung, Referenz der Registrierungs-API und SDK-Architektur
title: Überblick über das Plugin SDK
x-i18n:
    generated_at: "2026-04-07T06:18:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe1fe41beaf73a7bdf807e281d181df7a5da5819343823c4011651fb234b0905
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Überblick über das Plugin SDK

Das Plugin SDK ist der typisierte Vertrag zwischen Plugins und dem Core. Diese Seite ist die
Referenz dafür, **was importiert werden soll** und **was Sie registrieren können**.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?**
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
verhindert Probleme mit zirkulären Abhängigkeiten. Für kanalbezogene Hilfen für Einstiegspunkt/Build
verwenden Sie bevorzugt `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere Oberflächenschnittstelle und gemeinsame Hilfen wie
`buildChannelConfigSchema` bei.

Fügen Sie keine praktischen providerbenannten Schnittstellen wie
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` oder
kanalgebrandete Helper-Schnittstellen hinzu und machen Sie sich nicht davon abhängig. Gebündelte Plugins sollten generische
SDK-Unterpfade innerhalb ihrer eigenen `api.ts`- oder `runtime-api.ts`-Barrels zusammensetzen, und der Core
sollte entweder diese pluginlokalen Barrels verwenden oder einen schmalen generischen SDK-
Vertrag hinzufügen, wenn der Bedarf wirklich kanalübergreifend ist.

Die generierte Exportzuordnung enthält weiterhin eine kleine Menge gebündelter Plugin-Helfer-
Schnittstellen wie `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese
Unterpfade existieren nur für die Wartung gebündelter Plugins und zur Kompatibilität; sie werden
bewusst aus der allgemeinen Tabelle unten ausgelassen und sind nicht der empfohlene
Importpfad für neue Drittanbieter-Plugins.

## Referenz der Unterpfade

Die am häufigsten verwendeten Unterpfade, gruppiert nach Zweck. Die generierte vollständige Liste von
über 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte Helfer-Unterpfade für gebündelte Plugins erscheinen weiterhin in dieser generierten Liste.
Behandeln Sie diese als Implementierungsdetail-/Kompatibilitätsoberflächen, es sei denn, eine Dokumentationsseite
stellt einen davon ausdrücklich als öffentlich dar.

### Plugin-Einstiegspunkt

| Unterpfad                  | Wichtige Exporte                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Kanal-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Zod-Schema-Export für Root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfen für Setup-Wizards, Allowlist-Aufforderungen und Builder für den Setup-Status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfen für Multi-Account-Konfiguration/Aktions-Gates und Hilfen für den Fallback auf Standardkonten |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Normalisierungshilfen für Account-IDs |
    | `plugin-sdk/account-resolution` | Hilfen für Kontosuche und Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Hilfen für Kontolisten/Kontoaktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Schematypen für Kanalkonfiguration |
    | `plugin-sdk/telegram-command-config` | Normalisierungs-/Validierungshilfen für benutzerdefinierte Telegram-Befehle mit Fallback auf den gebündelten Vertrag |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfen für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Hilfen für das Aufzeichnen und Dispatchen eingehender Nachrichten |
    | `plugin-sdk/messaging-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfen zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Hilfen für ausgehende Identität/Sende-Delegation |
    | `plugin-sdk/thread-bindings-runtime` | Lifecycle- und Adapter-Hilfen für Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Media-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfen für Konversations-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfen zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfen für Snapshots/Zusammenfassungen des Kanalstatus |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive des Kanalkonfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Autorisierungshilfen für Schreibvorgänge in der Kanalkonfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsame Hilfen für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Hilfen für Auth/Guards bei direkten DMs |
    | `plugin-sdk/interactive-runtime` | Hilfen zur Normalisierung/Reduzierung interaktiver Antwort-Payloads |
    | `plugin-sdk/channel-inbound` | Hilfen für Debounce, Mention-Matching und Envelopes |
    | `plugin-sdk/channel-send-result` | Ergebnistypen für Antworten |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Typen des Kanalvertrags |
    | `plugin-sdk/channel-feedback` | Verkabelung von Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfen für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Typen für Secret-Ziele |
  </Accordion>

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Setup-Hilfen für lokale/self-hosted Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Hilfen für self-hosted OpenAI-kompatible Provider |
    | `plugin-sdk/cli-backend` | Standardwerte für CLI-Backends + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Hilfen zur Auflösung von API-Schlüsseln für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hilfen für API-Key-Onboarding/Profil-Schreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame interaktive Login-Hilfen für Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hilfen für Nachschlagen von Umgebungsvariablen zur Provider-Authentifizierung |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfen für Provider-Endpunkte und Hilfen zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfen für HTTP-/Endpunkt-Fähigkeiten von Providern |
    | `plugin-sdk/provider-web-fetch` | Registrierungs-/Cache-Hilfen für Web-Fetch-Provider |
    | `plugin-sdk/provider-web-search-contract` | Schmale Hilfen für Verträge zu Web-Search-Konfiguration/-Anmeldedaten wie `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und Setter/Getter für begrenzte Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Registrierungs-/Cache-/Runtime-Hilfen für Web-Search-Provider |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Bereinigung + Diagnose von Gemini-Schemata und xAI-Kompatibilitätshilfen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Hilfen für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Hilfen für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Hilfen für prozesslokale Singletons/Maps/Caches |
  </Accordion>

  <Accordion title="Unterpfade für Authentifizierung und Sicherheit">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfen für die Befehlsregistrierung und Absenderautorisierung |
    | `plugin-sdk/approval-auth-runtime` | Hilfen zur Auflösung von Genehmigenden und derselben Chat-Aktionsauthentifizierung |
    | `plugin-sdk/approval-client-runtime` | Native Hilfen für Exec-Genehmigungsprofile/-filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungsfähigkeiten/-zustellung |
    | `plugin-sdk/approval-native-runtime` | Native Hilfen für Genehmigungsziele und Account-Bindings |
    | `plugin-sdk/approval-reply-runtime` | Hilfen für Antwort-Payloads bei Exec-/Plugin-Genehmigungen |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung + native Hilfen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfen zur Befehlserkennung |
    | `plugin-sdk/command-surface` | Hilfen zur Normalisierung von Befehlsinhalten und Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Sammlungshilfen für Secret-Verträge bei Kanal-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfen für Vertrauen, DM-Gating, externe Inhalte und Secret-Erfassung |
    | `plugin-sdk/ssrf-policy` | Hilfen für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-runtime` | Hilfen für gepinnten Dispatcher, SSRF-geschützten Fetch und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfen für Webhook-Anfragen/-Ziele |
    | `plugin-sdk/webhook-request-guards` | Hilfen für Größe/Timeout von Request-Bodys |
  </Accordion>

  <Accordion title="Unterpfade für Runtime und Speicherung">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Hilfen für Runtime/Logging/Backups/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Hilfen für Runtime-Umgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfen für Plugin-Befehle/Hooks/HTTP/Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfen für Webhooks/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfen für lazy Runtime-Import/Binding wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfen zum Ausführen von Prozessen |
    | `plugin-sdk/cli-runtime` | Hilfen für CLI-Formatierung, Warten und Version |
    | `plugin-sdk/gateway-runtime` | Hilfen für Gateway-Client und Patches des Kanalstatus |
    | `plugin-sdk/config-runtime` | Hilfen zum Laden/Schreiben von Konfiguration |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung von Telegram-Befehlsnamen/-Beschreibungen und zu Duplikat-/Konfliktprüfungen, selbst wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/approval-runtime` | Hilfen für Exec-/Plugin-Genehmigungen, Builder für Genehmigungsfähigkeiten, Auth-/Profilhilfen und native Routing-/Runtime-Hilfen |
    | `plugin-sdk/reply-runtime` | Gemeinsame Runtime-Hilfen für eingehende Nachrichten/Antworten, Chunking, Dispatch, Heartbeat, Antwortplanung |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfen für Antwort-Dispatch/Finalisierung |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfen für den Antwortverlauf in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Hilfen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfen für Pfade des Sitzungsspeichers + `updated-at` |
    | `plugin-sdk/state-paths` | Hilfen für Pfade von Status-/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Hilfen für Routen/Sitzungsschlüssel/Account-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfen für Zusammenfassungen des Kanal-/Kontostatus, Standardwerte für Runtime-Status und Hilfen für Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Hilfen zur Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Hilfen zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | Extrahieren von String-URLs aus Fetch-/Request-ähnlichen Eingaben |
    | `plugin-sdk/run-command` | Zeitgesteuerter Command-Runner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gängige Parameterleser für Tools/CLI |
    | `plugin-sdk/tool-send` | Extrahieren kanonischer Felder für Sendeziele aus Tool-Argumenten |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfen für temporäre Download-Pfade |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Hilfen für Redaction |
    | `plugin-sdk/markdown-table-runtime` | Hilfen für Modi von Markdown-Tabellen |
    | `plugin-sdk/json-store` | Kleine Hilfen zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/file-lock` | Wiederbetretbare Hilfen für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Hilfen für deduplizierenden Cache auf Datenträgerbasis |
    | `plugin-sdk/acp-runtime` | Hilfen für ACP-Runtime/Sitzung und Reply-Dispatch |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive des Agent-Runtime-Konfigurationsschemas |
    | `plugin-sdk/boolean-param` | Loser Leser für boolesche Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Hilfen zur Auflösung von Übereinstimmungen bei gefährlichen Namen |
    | `plugin-sdk/device-bootstrap` | Hilfen für Device-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Ambient-Proxy-Hilfen |
    | `plugin-sdk/models-provider-runtime` | Hilfen für `/models`-Befehle/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfen zum Registrieren/Erstellen/Serialisieren nativer Befehle |
    | `plugin-sdk/provider-zai-endpoint` | Hilfen zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/infra-runtime` | Hilfen für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Hilfen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfen für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Hilfen zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Umhüllter Fetch, Proxy und Hilfen für gepinnte Nachschlagevorgänge |
    | `plugin-sdk/host-runtime` | Hilfen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfen für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Hilfen für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Unterpfade für Fähigkeiten und Tests">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfen zum Abrufen/Transformieren/Speichern von Medien sowie Builder für Media-Payloads |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfen für Failover bei Mediengenerierung, Kandidatenauswahl und Meldungen bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Typen für Media-Understanding-Provider sowie providerseitige Exporte von Hilfen für Bilder/Audio |
    | `plugin-sdk/text-runtime` | Gemeinsame Hilfen für Text/Markdown/Logging wie Entfernen von für Assistenten sichtbarem Text, Hilfen für Rendern/Chunking/Tabellen in Markdown, Redaction-Hilfen, Hilfen für Directive-Tags und sichere Text-Hilfen |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für Chunking ausgehenden Texts |
    | `plugin-sdk/speech` | Typen für Speech-Provider sowie providerseitige Hilfen für Direktiven, Registrierung und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsame Typen für Speech-Provider sowie Hilfen für Registrierung, Direktiven und Normalisierung |
    | `plugin-sdk/realtime-transcription` | Typen für Realtime-Transkriptions-Provider und Hilfen zur Registrierung |
    | `plugin-sdk/realtime-voice` | Typen für Realtime-Voice-Provider und Hilfen zur Registrierung |
    | `plugin-sdk/image-generation` | Typen für Image-Generation-Provider |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen für Image Generation sowie Hilfen für Failover, Authentifizierung und Registrierung |
    | `plugin-sdk/music-generation` | Typen für Music-Generation-Provider/Anfragen/Ergebnisse |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen für Music Generation sowie Hilfen für Failover, Providersuche und Parsing von Modell-Refs |
    | `plugin-sdk/video-generation` | Typen für Video-Generation-Provider/Anfragen/Ergebnisse |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen für Video Generation sowie Hilfen für Failover, Providersuche und Parsing von Modell-Refs |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Hilfen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Hilfen zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Hilfen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Verbraucher des Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte Helper-Oberfläche für memory-core für Manager-/Konfigurations-/Datei-/CLI-Hilfen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte für die Foundation-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exporte für die Embedding-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte für die QMD-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte für die Storage-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfen für den Memory-Host |
    | `plugin-sdk/memory-core-host-query` | Query-Hilfen für den Memory-Host |
    | `plugin-sdk/memory-core-host-secret` | Secret-Hilfen für den Memory-Host |
    | `plugin-sdk/memory-core-host-events` | Hilfen für das Event-Journal des Memory-Hosts |
    | `plugin-sdk/memory-core-host-status` | Status-Hilfen für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-cli` | Hilfen für die CLI-Runtime des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Hilfen für die Core-Runtime des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Hilfen für Datei-/Runtime des Memory-Hosts |
    | `plugin-sdk/memory-host-core` | Herstellerneutraler Alias für Core-Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Herstellerneutraler Alias für Hilfen des Event-Journals des Memory-Hosts |
    | `plugin-sdk/memory-host-files` | Herstellerneutraler Alias für Datei-/Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Hilfen für verwaltetes Markdown bei memorynahen Plugins |
    | `plugin-sdk/memory-host-search` | Aktive Memory-Runtime-Fassade für den Zugriff auf Search-Manager |
    | `plugin-sdk/memory-host-status` | Herstellerneutraler Alias für Status-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte Helper-Oberfläche für memory-lancedb |
  </Accordion>

  <Accordion title="Reservierte Helper-Unterpfade für gebündelte Plugins">
    | Familie | Aktuelle Unterpfade | Beabsichtigte Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Unterstützende Hilfen für das gebündelte Browser-Plugin (`browser-support` bleibt das Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Helper-/Runtime-Oberfläche für Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte Helper-/Runtime-Oberfläche für LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte Helper-Oberfläche für IRC |
    | Kanalspezifische Hilfen | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Gebündelte Kompatibilitäts-/Helper-Schnittstellen für Kanäle |
    | Auth-/pluginspezifische Hilfen | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Gebündelte Hilfsschnittstellen für Funktionen/Plugins; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Registrierung von Fähigkeiten

| Methode                                          | Was sie registriert             |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Text-Inferenz (LLM)             |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend    |
| `api.registerChannel(...)`                       | Messaging-Kanal                 |
| `api.registerSpeechProvider(...)`                | Text-to-Speech- / STT-Synthese  |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Realtime-Transkription |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Realtime-Voice-Sitzungen |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Video-Analyse      |
| `api.registerImageGenerationProvider(...)`       | Image Generation                |
| `api.registerMusicGenerationProvider(...)`       | Music Generation                |
| `api.registerVideoGenerationProvider(...)`       | Video Generation                |
| `api.registerWebFetchProvider(...)`              | Web-Fetch- / Scrape-Provider    |
| `api.registerWebSearchProvider(...)`             | Web Search                      |

### Tools und Befehle

| Methode                         | Was sie registriert                             |
| ------------------------------- | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)     |

### Infrastruktur

| Methode                                        | Was sie registriert                   |
| --------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-Hook                            |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                   |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                       |
| `api.registerService(service)`                 | Hintergrundservice                    |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                  |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver promptnaher Abschnitt für Memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Memory-Such-/Lesekorpus     |

Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht, einer
schmaleren Gateway-Methoden-Scope zuzuweisen. Verwenden Sie für plugin-eigene
Methoden bevorzugt pluginspezifische Präfixe.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Befehlsdeskriptoren zur Parse-Zeit, die für Root-CLI-Hilfe,
  Routing und lazy CLI-Registrierung von Plugins verwendet werden

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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` allein nur dann, wenn Sie keine lazy Root-CLI-Registrierung benötigen.
Dieser eager Kompatibilitätspfad wird weiterhin unterstützt, installiert aber keine
descriptorbasierten Platzhalter für lazy Laden zur Parse-Zeit.

### Registrierung von CLI-Backends

`api.registerCliBackend(...)` erlaubt es einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modell-Refs wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Die Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw merged `agents.defaults.cliBackends.<id>` über den
  Plugin-Standard, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Merge Kompatibilitäts-Umschreibungen benötigt
  (zum Beispiel zur Normalisierung alter Flag-Formen).

### Exklusive Slots

| Methode                                    | Was sie registriert                  |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Context Engine (jeweils nur eine aktiv) |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitt  |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Plan       |
| `api.registerMemoryRuntime(runtime)`       | Adapter für die Memory-Runtime       |

### Memory-Embedding-Adapter

| Methode                                        | Was sie registriert                                  |
| --------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin       |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind exklusiv für Memory-Plugins.
- `registerMemoryEmbeddingProvider` erlaubt dem aktiven Memory-Plugin, einen
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte Plugin-ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lifecycle

| Methode                                      | Was sie tut                  |
| ------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook   |
| `api.onConversationBindingResolved(handler)` | Callback für Conversation-Binding |

### Semantik von Hook-Entscheidungen

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für den Modell-Dispatch übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Überschreibung.

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Quellpfad des Plugins                                                                       |
| `api.rootDir`            | `string?`                 | Root-Verzeichnis des Plugins (optional)                                                     |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, falls verfügbar)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspezifische Konfiguration aus `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Runtime Helpers](/de/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Fenster für Start/Setup vor dem vollständigen Einstiegspunkt |
| `api.resolvePath(input)` | `(string) => string`      | Löst einen Pfad relativ zum Plugin-Root auf                                                 |

## Konvention für interne Module

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Verbraucher
  runtime-api.ts    # Nur interne Runtime-Exporte
  index.ts          # Einstiegspunkt des Plugins
  setup-entry.ts    # Leichtgewichtiger Setup-only-Einstiegspunkt (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin in Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Über Fassaden geladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Einstiegsdateien) bevorzugen nun den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Falls noch kein Runtime-
Snapshot existiert, greifen sie auf die auf dem Datenträger aufgelöste Konfigurationsdatei zurück.

Provider-Plugins können auch ein schmal gehaltenes, pluginlokales Vertrags-Barrel bereitstellen, wenn eine
Hilfsfunktion absichtlich providerspezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Aktuelles gebündeltes Beispiel: Der Anthropic-Provider belässt seine Claude-
Stream-Hilfen in seiner eigenen öffentlichen `api.ts`- / `contract-api.ts`-Schnittstelle, anstatt Logik
für Anthropic-Beta-Header und `service_tier` in einen generischen
`plugin-sdk/*`-Vertrag hochzustufen.

Weitere aktuelle gebündelte Beispiele:

- `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
  Hilfen für Standardmodelle und Builder für Realtime-Provider
- `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder sowie
  Hilfen für Onboarding/Konfiguration

<Warning>
  Produktionscode von Extensions sollte auch Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn eine Hilfsfunktion wirklich geteilt werden soll, stufen Sie sie zu einem neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder einer anderen
  fähigkeitsorientierten Oberfläche hoch, anstatt zwei Plugins aneinander zu koppeln.
</Warning>

## Verwandt

- [Einstiegspunkte](/de/plugins/sdk-entrypoints) — Optionen für `definePluginEntry` und `defineChannelPluginEntry`
- [Runtime Helpers](/de/plugins/sdk-runtime) — vollständige Referenz des `api.runtime`-Namespace
- [Setup und Konfiguration](/de/plugins/sdk-setup) — Packaging, Manifeste, Konfigurationsschemas
- [Testing](/de/plugins/sdk-testing) — Testhilfen und Lint-Regeln
- [SDK-Migration](/de/plugins/sdk-migration) — Migration von veralteten Oberflächen
- [Plugin-Interna](/de/plugins/architecture) — tiefe Architektur und Fähigkeitsmodell
