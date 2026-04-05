---
read_when:
    - Sie müssen wissen, aus welchem SDK-Subpath importiert werden soll
    - Sie möchten eine Referenz für alle Registrierungsmethoden von OpenClawPluginApi
    - Sie schlagen einen bestimmten SDK-Export nach
sidebarTitle: SDK Overview
summary: Referenz für Import-Map, Registrierungs-API und SDK-Architektur
title: Überblick über das Plugin SDK
x-i18n:
    generated_at: "2026-04-05T12:52:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7d8b6add0623766d36e81588ae783b525357b2f5245c38c8e2b07c5fc1d2b5
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Überblick über das Plugin SDK

Das Plugin SDK ist der typisierte Vertrag zwischen Plugins und Core. Diese Seite
ist die Referenz dafür, **was importiert werden soll** und **was registriert werden kann**.

<Tip>
  **Sie suchen eine Schritt-für-Schritt-Anleitung?**
  - Erstes Plugin? Beginnen Sie mit [Erste Schritte](/plugins/building-plugins)
  - Kanal-Plugin? Siehe [Kanal-Plugins](/plugins/sdk-channel-plugins)
  - Provider-Plugin? Siehe [Provider-Plugins](/plugins/sdk-provider-plugins)
</Tip>

## Importkonvention

Importieren Sie immer aus einem spezifischen Subpath:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpath ist ein kleines, in sich abgeschlossenes Modul. Das hält den
Start schnell und verhindert Probleme mit zirkulären Abhängigkeiten. Für kanalspezifische
Einstiegs-/Build-Helfer sollten Sie `openclaw/plugin-sdk/channel-core` bevorzugen; verwenden Sie
`openclaw/plugin-sdk/core` für die umfassendere Dachoberfläche und gemeinsame Helfer wie
`buildChannelConfigSchema`.

Fügen Sie keine providerbenannten Convenience-Seams wie
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` oder
kanalmarkenspezifische Helper-Seams hinzu und machen Sie sich nicht von ihnen abhängig. Gebündelte Plugins
sollten generische SDK-Subpaths in ihren eigenen `api.ts`- oder `runtime-api.ts`-Barrels
zusammensetzen, und Core sollte entweder diese plugin-lokalen Barrels verwenden oder einen schmalen
generischen SDK-Vertrag hinzufügen, wenn der Bedarf wirklich kanalübergreifend ist.

Die generierte Export-Map enthält weiterhin eine kleine Menge an Hilfs-Seams für gebündelte Plugins
wie `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese
Subpaths existieren nur für die Wartung gebündelter Plugins und zur Kompatibilität; sie werden
absichtlich in der allgemeinen Tabelle unten ausgelassen und sind nicht der empfohlene
Importpfad für neue Drittanbieter-Plugins.

## Subpath-Referenz

Die am häufigsten verwendeten Subpaths, nach Zweck gruppiert. Die generierte vollständige Liste mit
mehr als 200 Subpaths befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte Hilfs-Subpaths für gebündelte Plugins erscheinen weiterhin in dieser generierten Liste.
Behandeln Sie sie als Implementierungsdetail-/Kompatibilitätsoberflächen, sofern nicht eine Dokumentationsseite
eine davon ausdrücklich als öffentlich bewirbt.

### Plugin-Einstieg

| Subpath                     | Wichtige Exporte                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                     |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                        |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                       |

<AccordionGroup>
  <Accordion title="Kanal-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schemaexport (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Helfer für Setup-Assistenten, Allowlist-Prompts, Builder für Setup-Status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helfer für Multi-Account-Konfiguration/Aktions-Gates, Helfer für Standardkonto-Fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helfer zur Account-ID-Normalisierung |
    | `plugin-sdk/account-resolution` | Helfer für Account-Lookup + Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Helfer für Kontolisten/Kontoaktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Kanal-Konfigurationsschemata |
    | `plugin-sdk/telegram-command-config` | Helfer zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf gebündelten Vertrag |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Helfer für eingehende Routen + Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Helfer zum Aufzeichnen und Dispatchen eingehender Ereignisse |
    | `plugin-sdk/messaging-targets` | Helfer zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Helfer zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Helfer für ausgehende Identität/Sende-Delegates |
    | `plugin-sdk/thread-bindings-runtime` | Helfer für den Lebenszyklus von Thread-Bindings und Adapter |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Media-Payloads |
    | `plugin-sdk/conversation-runtime` | Helfer für Conversation-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Helfer zur Auflösung von Gruppenrichtlinien zur Laufzeit |
    | `plugin-sdk/channel-status` | Gemeinsame Helfer für Kanalstatus-Snapshots/-Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Kanal-Konfigurationsschemata |
    | `plugin-sdk/channel-config-writes` | Helfer zur Autorisierung von Kanal-Konfigurationsschreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helfer zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Helfer für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Helfer für direkte-DM-Authentifizierung/Guards |
    | `plugin-sdk/interactive-runtime` | Helfer zur Normalisierung/Reduktion interaktiver Antwort-Payloads |
    | `plugin-sdk/channel-inbound` | Debounce-, Mention-Matching- und Envelope-Helfer |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helfer zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Kanal-Vertragstypen |
    | `plugin-sdk/channel-feedback` | Feedback-/Reaktions-Verkabelung |
  </Accordion>

  <Accordion title="Provider-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Helfer für die Einrichtung lokaler/self-hosted Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Helfer für die Einrichtung selbstgehosteter OpenAI-kompatibler Provider |
    | `plugin-sdk/cli-backend` | Standardwerte für CLI-Backends + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Helfer zur Runtime-Auflösung von API-Schlüsseln für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Helfer für API-Key-Onboarding/Profilschreibvorgänge |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Auth-Ergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame interaktive Login-Helfer für Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Helfer zum Nachschlagen von Provider-Auth-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Provider-Endpunkt-Helfer und Helfer zur Modell-ID-Normalisierung wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Helfer für Provider-HTTP/Endpunktfähigkeiten |
    | `plugin-sdk/provider-web-fetch` | Helfer für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search` | Helfer für Registrierung/Cache/Konfiguration von Web-Such-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnosefunktionen und xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Helfer für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helfer zum Patchen der Onboarding-Konfiguration |
    | `plugin-sdk/global-singleton` | Helfer für prozesslokale Singleton-/Map-/Cache-Strukturen |
  </Accordion>

  <Accordion title="Auth- und Sicherheits-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Helfer für Befehlsregistrierung, Helfer zur Sender-Autorisierung |
    | `plugin-sdk/approval-auth-runtime` | Helfer zur Approver-Auflösung und Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Helfer für native Exec-Freigabeprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für native Freigabefähigkeiten/-zustellung |
    | `plugin-sdk/approval-native-runtime` | Helfer für natives Freigabeziel + Account-Binding |
    | `plugin-sdk/approval-reply-runtime` | Helfer für Antwort-Payloads bei Exec-/Plugin-Freigaben |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung + Helfer für native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Helfer zur Befehlserkennung |
    | `plugin-sdk/command-surface` | Helfer für Befehls-Body-Normalisierung und Befehlsoberfläche |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Gemeinsame Helfer für Trust, DM-Gating, externe Inhalte und Secret-Erfassung |
    | `plugin-sdk/ssrf-policy` | Helfer für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-runtime` | Helfer für pinned dispatcher, SSRF-geschütztes Fetch und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Helfer zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Requests/-Ziele |
    | `plugin-sdk/webhook-request-guards` | Helfer für Body-Größe/Timeout von Requests |
  </Accordion>

  <Accordion title="Runtime- und Speicher-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Helfer für Runtime/Logging/Backups/Plugin-Installationen |
    | `plugin-sdk/runtime-env` | Schmale Helfer für Runtime-Umgebung, Logger, Timeouts, Retries und Backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer für Plugin-Befehle/-Hooks/-HTTP/-Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helfer für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Helfer für Lazy-Runtime-Import/Binding wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helfer für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Helfer für CLI-Formatierung, Warten und Versionsinformationen |
    | `plugin-sdk/gateway-runtime` | Helfer für Gateway-Client und Kanalstatus-Patches |
    | `plugin-sdk/config-runtime` | Helfer zum Laden/Schreiben von Konfiguration |
    | `plugin-sdk/telegram-command-config` | Helfer zur Normalisierung von Telegram-Befehlsnamen/-Beschreibungen und zur Prüfung von Duplikaten/Konflikten, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/approval-runtime` | Helfer für Exec-/Plugin-Freigaben, Builder für Freigabefähigkeiten, Auth-/Profil-Helfer, native Routing-/Runtime-Helfer |
    | `plugin-sdk/reply-runtime` | Gemeinsame Helfer für eingehende/Antwort-Runtime, Chunking, Dispatch, Heartbeat, Antwortplanung |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Antwort-Dispatch/Finalisierung |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer für Antwortverläufe in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Helfer für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helfer für Pfade zum Sitzungsspeicher + updated-at |
    | `plugin-sdk/state-paths` | Helfer für Pfade zu Status-/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Helfer für Route/Sitzungsschlüssel/Account-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer für Kanal-/Kontostatus-Zusammenfassungen, Standardwerte für Runtime-Status und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Helfer für Target-Resolver |
    | `plugin-sdk/string-normalization-runtime` | Helfer zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | Zeichenketten-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Command-Runner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gängige Parameterleser für Tool/CLI |
    | `plugin-sdk/tool-send` | Kanonische Sendefeld-Ziele aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Helfer für Pfade zu temporären Downloads |
    | `plugin-sdk/logging-core` | Helfer für Subsystem-Logger und Redaction |
    | `plugin-sdk/markdown-table-runtime` | Helfer für Markdown-Tabellenmodi |
    | `plugin-sdk/json-store` | Kleine Helfer zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/file-lock` | Reentrante Helfer für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Helfer für diskgestützte Dedupe-Caches |
    | `plugin-sdk/acp-runtime` | ACP-Runtime-/Sitzungs-Helfer |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Laufzeit-Konfigurationsschemata von Agenten |
    | `plugin-sdk/boolean-param` | Toleranter Reader für boolesche Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Auflösung gefährlicher Namensabgleiche |
    | `plugin-sdk/device-bootstrap` | Helfer für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle und Statushelfer |
    | `plugin-sdk/models-provider-runtime` | Helfer für Provider-Antworten beim `/models`-Befehl |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer zum Registrieren/Erstellen/Serialisieren nativer Befehle |
    | `plugin-sdk/provider-zai-endpoint` | Helfer zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/infra-runtime` | Helfer für Systemereignisse/Heartbeats |
    | `plugin-sdk/collection-runtime` | Kleine Helfer für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Helfer für Fehlergraph, Formatierung, gemeinsame Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helfer für umschlossenes Fetch, Proxy und gepinnte Lookups |
    | `plugin-sdk/host-runtime` | Helfer zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Helfer für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Helfer für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Dedupe |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Fähigkeits- und Test-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Helfer für Medienabruf/-Transformation/-Speicherung sowie Builder für Medien-Payloads |
    | `plugin-sdk/media-understanding` | Typen für Media-Understanding-Provider sowie providerseitige Hilfsexporte für Bilder/Audio |
    | `plugin-sdk/text-runtime` | Gemeinsame Helfer für Text/Markdown/Logging wie das Entfernen von für Assistenten sichtbarem Text, Helfer für Rendering/Chunking/Tabellen in Markdown, Redaction-Helfer, Directive-Tag-Helfer und Hilfsfunktionen für sicheren Text |
    | `plugin-sdk/text-chunking` | Helfer zum Chunking ausgehender Texte |
    | `plugin-sdk/speech` | Typen für Speech-Provider sowie providerseitige Helfer für Directives, Registries und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsame Helfer für Speech-Provider-Typen, Registry, Directives und Normalisierung |
    | `plugin-sdk/realtime-transcription` | Typen für Realtime-Transcription-Provider und Registry-Helfer |
    | `plugin-sdk/realtime-voice` | Typen für Realtime-Voice-Provider und Registry-Helfer |
    | `plugin-sdk/image-generation` | Typen für Image-Generation-Provider |
    | `plugin-sdk/image-generation-core` | Gemeinsame Helfer für Image-Generation-Typen, Failover, Auth und Registry |
    | `plugin-sdk/video-generation` | Typen für Video-Generation-Provider/-Requests/-Ergebnisse |
    | `plugin-sdk/video-generation-core` | Gemeinsame Helfer für Video-Generation-Typen, Failover-Helfer, Provider-Lookup und das Parsen von Modellreferenzen |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Helfer für die Routeninstallation |
    | `plugin-sdk/webhook-path` | Helfer zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Helfer zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Konsumenten des Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Helferoberfläche für Manager-/Konfigurations-/Datei-/CLI-Helfer |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine für Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exporte der Embedding-Engine für Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine für Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine für Memory-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Helfer für Memory-Hosts |
    | `plugin-sdk/memory-core-host-query` | Query-Helfer für Memory-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Secret-Helfer für Memory-Hosts |
    | `plugin-sdk/memory-core-host-status` | Statushelfer für Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Helfer für Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Helfer für Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Helfer für Memory-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte memory-lancedb-Helferoberfläche |
  </Accordion>

  <Accordion title="Reservierte Hilfs-Subpaths für gebündelte Plugins">
    | Familie | Aktuelle Subpaths | Vorgesehene Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support` | Unterstützungshelfer für gebündelte Browser-Plugins |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Hilfs-/Runtime-Oberfläche für gebündeltes Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Hilfs-/Runtime-Oberfläche für gebündeltes LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Hilfsoberfläche für gebündeltes IRC |
    | Kanalspezifische Helfer | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Kompatibilitäts-/Hilfs-Seams für gebündelte Kanäle |
    | Auth-/plugin-spezifische Helfer | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Funktions-/Plugin-Hilfs-Seams für gebündelte Features; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registrierungs-API

Der Callback `register(api)` erhält ein Objekt vom Typ `OpenClawPluginApi` mit diesen
Methoden:

### Fähigkeitsregistrierung

| Methode                                         | Was registriert wird            |
| ----------------------------------------------- | ------------------------------- |
| `api.registerProvider(...)`                     | Textinferenz (LLM)              |
| `api.registerCliBackend(...)`                   | Lokales CLI-Inferenz-Backend    |
| `api.registerChannel(...)`                      | Messaging-Kanal                 |
| `api.registerSpeechProvider(...)`               | Text-to-Speech-/STT-Synthese    |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeit-Transkription |
| `api.registerRealtimeVoiceProvider(...)`        | Duplex-Echtzeit-Sprachsitzungen |
| `api.registerMediaUnderstandingProvider(...)`   | Bild-/Audio-/Videoanalyse       |
| `api.registerImageGenerationProvider(...)`      | Bildgenerierung                 |
| `api.registerVideoGenerationProvider(...)`      | Videogenerierung                |
| `api.registerWebFetchProvider(...)`             | Web-Fetch-/Scrape-Provider      |
| `api.registerWebSearchProvider(...)`            | Websuche                        |

### Tools und Befehle

| Methode                          | Was registriert wird                           |
| -------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)`  | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`       | Benutzerdefinierter Befehl (umgeht das LLM)    |

### Infrastruktur

| Methode                                         | Was registriert wird    |
| ----------------------------------------------- | ----------------------- |
| `api.registerHook(events, handler, opts?)`      | Ereignis-Hook           |
| `api.registerHttpRoute(params)`                 | Gateway-HTTP-Endpunkt   |
| `api.registerGatewayMethod(name, handler)`      | Gateway-RPC-Methode     |
| `api.registerCli(registrar, opts?)`             | CLI-Unterbefehl         |
| `api.registerService(service)`                  | Hintergrunddienst       |
| `api.registerInteractiveHandler(registration)`  | Interaktiver Handler    |

Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bleiben immer `operator.admin`, auch wenn ein Plugin versucht, einen
engeren Scope für die Gateway-Methode zuzuweisen. Verwenden Sie für plugin-eigene
Methoden vorzugsweise plugin-spezifische Präfixe.

### Registrierungsmetadaten für die CLI

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Parse-Zeit-Befehlsdeskriptoren für Root-CLI-Hilfe,
  Routing und Lazy-Registrierung der Plugin-CLI

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleiben soll,
geben Sie `descriptors` an, die jede oberste Befehlswurzel abdecken, die von diesem
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

Verwenden Sie `commands` allein nur dann, wenn Sie keine lazy Registrierung
in der Root-CLI benötigen. Dieser eager Kompatibilitätspfad bleibt unterstützt,
installiert aber keine deskriptorbasierten Platzhalter für lazy Laden zur Parse-Zeit.

### Registrierung von CLI-Backends

Mit `api.registerCliBackend(...)` kann ein Plugin die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `claude-cli` oder `codex-cli` besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `claude-cli/opus`.
- Die Backend-`config` verwendet dieselbe Struktur wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw merged `agents.defaults.cliBackends.<id>` über den
  Plugin-Standardwert, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Merge Kompatibilitätsumschreibungen benötigt
  (zum Beispiel zur Normalisierung alter Flag-Formen).

### Exklusive Slots

| Methode                                     | Was registriert wird                 |
| ------------------------------------------- | ------------------------------------ |
| `api.registerContextEngine(id, factory)`    | Kontext-Engine (immer nur eine aktiv) |
| `api.registerMemoryPromptSection(builder)`  | Builder für Memory-Prompt-Abschnitt  |
| `api.registerMemoryFlushPlan(resolver)`     | Resolver für Memory-Flush-Plan       |
| `api.registerMemoryRuntime(runtime)`        | Adapter für Memory-Runtime           |

### Memory-Embedding-Adapter

| Methode                                         | Was registriert wird                         |
| ----------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)`  | Memory-Embedding-Adapter für das aktive Plugin |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind exklusiv für Memory-Plugins.
- `registerMemoryEmbeddingProvider` erlaubt es dem aktiven Memory-Plugin, einen
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder
  eine benutzerdefinierte, vom Plugin definierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                       | Was sie tut                  |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lebenszyklus-Hook |
| `api.onConversationBindingResolved(handler)` | Callback für Conversation-Binding |

### Semantik von Hook-Entscheidungen

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Überschreibung.

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                 |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                    |
| `api.name`               | `string`                  | Anzeigename                                                                                  |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                    |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                               |
| `api.source`             | `string`                  | Quellpfad des Plugins                                                                        |
| `api.rootDir`            | `string?`                 | Root-Verzeichnis des Plugins (optional)                                                      |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, wenn verfügbar)      |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helfer](/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Fenster für Start/Setup vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Root auflösen                                                        |

## Interne Modulkonvention

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Konsumenten
  runtime-api.ts    # Nur interne Runtime-Exporte
  index.ts          # Plugin-Einstiegspunkt
  setup-entry.ts    # Optionaler leichtgewichtiger reiner Setup-Einstieg
```

<Warning>
  Importieren Sie Ihr eigenes Plugin im Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Fassadengeladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen jetzt den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Falls noch kein Runtime-Snapshot
existiert, greifen sie auf die auf dem Datenträger aufgelöste Konfigurationsdatei zurück.

Provider-Plugins können auch ein schmales plugin-lokales Vertrags-Barrel bereitstellen, wenn ein
Helfer absichtlich providerspezifisch ist und noch nicht in einen generischen SDK-Subpath gehört.
Aktuelles gebündeltes Beispiel: Der Anthropic-Provider behält seine Claude-
Stream-Helfer in seinem eigenen öffentlichen `api.ts`- / `contract-api.ts`-Seam, anstatt
Anthropic-Beta-Header- und `service_tier`-Logik in einen generischen
`plugin-sdk/*`-Vertrag hochzustufen.

Weitere aktuelle gebündelte Beispiele:

- `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
  Helfer für Standardmodelle und Builder für Realtime-Provider
- `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder sowie
  Helfer für Onboarding/Konfiguration

<Warning>
  Produktionscode von Erweiterungen sollte auch Importe von `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helfer wirklich gemeinsam genutzt wird, verschieben Sie ihn in einen neutralen SDK-Subpath
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  fähigkeitsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandte Themen

- [Einstiegspunkte](/plugins/sdk-entrypoints) — Optionen für `definePluginEntry` und `defineChannelPluginEntry`
- [Runtime-Helfer](/plugins/sdk-runtime) — vollständige Referenz für den Namespace `api.runtime`
- [Setup und Konfiguration](/plugins/sdk-setup) — Packaging, Manifeste, Konfigurationsschemata
- [Tests](/plugins/sdk-testing) — Test-Hilfsfunktionen und Lint-Regeln
- [SDK-Migration](/plugins/sdk-migration) — Migration von veralteten Oberflächen
- [Plugin-Interna](/plugins/architecture) — Vertiefte Architektur und Fähigkeitsmodell
