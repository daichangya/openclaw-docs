---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie betreuen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Von der Legacy-Abwärtskompatibilitätsschicht zum modernen Plugin-SDK migrieren
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-04-24T06:50:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1612fbdc0e472a0ba1ae310ceeca9c672afa5a7eba77637b94726ef1fedee87
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ist von einer breiten Abwärtskompatibilitätsschicht zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Imports übergegangen. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei sehr offene Oberflächen bereit, über die Plugins
alles importieren konnten, was sie über einen einzigen Einstiegspunkt benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von
  Hilfsfunktionen erneut exportierte. Er wurde eingeführt, damit ältere hookbasierte Plugins weiter funktionieren, während die
  neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Hilfsfunktionen wie den eingebetteten Agenten-Runner gab.

Beide Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit noch, aber neue
Plugins dürfen sie nicht mehr verwenden, und bestehende Plugins sollten migrieren, bevor
die nächste Hauptversion sie entfernt.

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht in derselben
Änderung neu, in der ein Ersatz eingeführt wird. Änderungen an brechenden Verträgen müssen zuerst
über einen Kompatibilitätsadapter, Diagnostik, Dokumentation und ein Deprecation-Fenster laufen.
Das gilt für SDK-Imports, Manifest-Felder, Setup-APIs, Hooks und das Verhalten bei der Laufzeitregistrierung.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einer zukünftigen Hauptversion entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — der Import einer Hilfsfunktion lud Dutzende nicht zusammenhängende Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es einfach, Import-Zyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin-SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, in sich geschlossenes Modul mit klarem Zweck und dokumentiertem Vertrag.

Legacy-Komfort-Schnittstellen für Provider in gebündelten Kanälen sind ebenfalls verschwunden. Imports
wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanalbezogene Hilfsschnittstellen mit Branding und
`openclaw/plugin-sdk/telegram-core` waren private Monorepo-Abkürzungen, keine
stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Unterpfade. Innerhalb des
gebündelten Plugin-Workspace bleiben provider-eigene Hilfsfunktionen in der eigenen
`api.ts` oder `runtime-api.ts` dieses Plugins.

Aktuelle Beispiele gebündelter Provider:

- Anthropic hält Claude-spezifische Stream-Hilfsfunktionen in seiner eigenen Schnittstelle `api.ts` /
  `contract-api.ts`
- OpenAI hält Provider-Builder, Hilfsfunktionen für Standardmodelle und Realtime-Provider-
  Builder in seiner eigenen `api.ts`
- OpenRouter hält Provider-Builder sowie Hilfsfunktionen für Onboarding/Konfiguration in seiner eigenen
  `api.ts`

## Kompatibilitätsrichtlinie

Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

1. den neuen Vertrag hinzufügen
2. das alte Verhalten über einen Kompatibilitätsadapter angeschlossen lassen
3. eine Diagnose oder Warnung ausgeben, die den alten Pfad und den Ersatz nennt
4. beide Pfade in Tests abdecken
5. die Deprecation und den Migrationspfad dokumentieren
6. erst nach dem angekündigten Migrationsfenster entfernen, normalerweise in einer Hauptversion

Wenn ein Manifest-Feld weiterhin akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis
Dokumentation und Diagnostik etwas anderes sagen. Neuer Code sollte den dokumentierten
Ersatz bevorzugen, aber bestehende Plugins sollten in normalen Minor-Releases nicht kaputtgehen.

## Wie Sie migrieren

<Steps>
  <Step title="Approval-native Handler auf Fähigkeitsfakten migrieren">
    Approval-fähige Kanal-Plugins stellen natives Genehmigungsverhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Runtime-Context-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie approval-spezifische Auth/Zustellung weg von der Legacy-Verdrahtung `plugin.auth` /
      `plugin.approvals` und auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Vertrag für Kanal-Plugins
      entfernt; verschieben Sie Zustell-/Native-/Render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Login-/Logout-Abläufe von Kanälen erhalten; Approval-Auth-
      Hooks dort werden vom Core nicht mehr gelesen
    - Registrieren Sie kanalbezogene Runtime-Objekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Umleitungs-Hinweise aus nativen Approval-Handlern;
      der Core besitzt jetzt Hinweise vom Typ „routed elsewhere“ aus tatsächlichen Zustellergebnissen
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie
      eine echte `createPluginRuntime().channel`-Oberfläche bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der Approval-Fähigkeiten.

  </Step>

  <Step title="Fallback-Verhalten des Windows-Wrappers prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen aufgelöste Windows-
    Wrapper `.cmd`/`.bat` jetzt geschlossen fehl, sofern Sie nicht explizit `allowShellFallback: true` übergeben.

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Nur für vertrauenswürdige Kompatibilitätsaufrufer setzen, die
      // Shell-vermittelten Fallback bewusst akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer nicht absichtlich auf Shell-Fallback angewiesen ist, setzen Sie
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
    Jeder Export aus der alten Oberfläche wird auf einen bestimmten modernen Importpfad abgebildet:

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

    Verwenden Sie für hostseitige Hilfsfunktionen die injizierte Plugin-Runtime statt eines
    direkten Imports:

    ```typescript
    // Vorher (veraltete extension-api-Brücke)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Nachher (injizierte Runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere Legacy-Hilfsfunktionen der Brücke:

    | Alter Import | Moderner Ersatz |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Hilfsfunktionen für den Session-Store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Bauen und testen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz für Importpfade

  <Accordion title="Tabelle häufiger Importpfade">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonischer Plugin-Entry-Helper | `definePluginEntry` |
  | `plugin-sdk/core` | Legacy-Sammel-Re-Export für Kanal-Entry-Definitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Single-Provider-Entry-Helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Kanal-Entry-Definitionen und -Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Setup-Assistenten-Helfer | Allowlist-Prompts, Builder für Setup-Status |
  | `plugin-sdk/setup-runtime` | Laufzeit-Helfer zur Setup-Zeit | import-sichere Setup-Patch-Adapter, Hilfsfunktionen für Lookup-Notizen, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Helfer für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helfer für Setup-Tooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helfer für mehrere Accounts | Hilfsfunktionen für Account-Liste/Konfiguration/Aktions-Gates |
  | `plugin-sdk/account-id` | Account-ID-Helfer | `DEFAULT_ACCOUNT_ID`, Normalisierung von Account-IDs |
  | `plugin-sdk/account-resolution` | Helfer für Account-Lookups | Account-Lookup- und Default-Fallback-Helfer |
  | `plugin-sdk/account-helpers` | Schmale Account-Helfer | Hilfsfunktionen für Account-Liste/Account-Aktionen |
  | `plugin-sdk/channel-setup` | Adapter für Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung von Antwort-Präfix + Tippen | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemata | Typen für Kanal-Konfigurationsschemata |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helfer für Account-Status und Lebenszyklus von Entwurfs-Streams | `createAccountStatusSink`, Helfer zur Finalisierung von Entwurfs-Vorschauen |
  | `plugin-sdk/inbound-envelope` | Helfer für Inbound-Envelope | Gemeinsame Helfer zum Erstellen von Routen + Envelopes |
  | `plugin-sdk/inbound-reply-dispatch` | Helfer für eingehende Antworten | Gemeinsame Helfer für Aufzeichnen-und-Dispatch |
  | `plugin-sdk/messaging-targets` | Parsen von Messaging-Zielen | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Helfer für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-runtime` | Laufzeit-Helfer für ausgehende Nachrichten | Helfer für ausgehende Identität/Sende-Delegation und Nutzlastplanung |
  | `plugin-sdk/thread-bindings-runtime` | Helfer für Thread-Bindings | Helfer für Lebenszyklus und Adapter von Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Legacy-Helfer für Medien-Payloads | Builder für Agent-Medien-Payloads für Legacy-Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur Legacy-Utilities für Kanal-Laufzeit |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Laufzeit-Helfer | Helfer für Laufzeit/Logging/Backups/Plugin-Installationen |
  | `plugin-sdk/runtime-env` | Schmale Helfer für Laufzeit-Umgebungen | Logger-/Laufzeit-Umgebung, Timeout-, Retry- und Backoff-Helfer |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Laufzeit-Helfer | Gemeinsame Helfer für Plugin-Befehle/Hooks/HTTP/Interaktivität |
  | `plugin-sdk/hook-runtime` | Helfer für Hook-Pipelines | Gemeinsame Helfer für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Lazy-Runtime-Helfer | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozess-Helfer | Gemeinsame Exec-Helfer |
  | `plugin-sdk/cli-runtime` | CLI-Laufzeit-Helfer | Befehlsformatierung, Waits, Versions-Helfer |
  | `plugin-sdk/gateway-runtime` | Gateway-Helfer | Gateway-Client und Helfer für Patches des Kanalstatus |
  | `plugin-sdk/config-runtime` | Konfigurations-Helfer | Helfer zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Telegram-Befehlshelfer | Fallback-stabile Telegram-Befehlsvalidierungshelfer, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Helfer für Genehmigungs-Prompts | Payloads für Exec-/Plugin-Genehmigungen, Helfer für Genehmigungsfähigkeiten/-profile, native Helfer für Routing/Laufzeit von Genehmigungen |
  | `plugin-sdk/approval-auth-runtime` | Helfer für Genehmigungs-Auth | Auflösung von Genehmigern, Auth von Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Helfer für Genehmigungs-Clients | Native Helfer für Profile/Filter von Exec-Genehmigungen |
  | `plugin-sdk/approval-delivery-runtime` | Helfer für Genehmigungszustellung | Adapter für native Genehmigungsfähigkeiten/-zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Helfer für Genehmigungs-Gateway | Gemeinsamer Helfer zur Auflösung des Genehmigungs-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helfer für Genehmigungs-Adapter | Leichtgewichtige Lade-Helfer für native Genehmigungsadapter bei hot channel entrypoints |
  | `plugin-sdk/approval-handler-runtime` | Helfer für Genehmigungs-Handler | Umfassendere Laufzeit-Helfer für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Schnittstellen, wenn diese ausreichen |
  | `plugin-sdk/approval-native-runtime` | Helfer für Genehmigungsziele | Native Helfer für Ziel-/Account-Bindung von Genehmigungen |
  | `plugin-sdk/approval-reply-runtime` | Helfer für Genehmigungsantworten | Helfer für Antwort-Payloads von Exec-/Plugin-Genehmigungen |
  | `plugin-sdk/channel-runtime-context` | Helfer für Channel Runtime Context | Generische Helfer zum Registrieren/Abrufen/Beobachten von Channel Runtime Context |
  | `plugin-sdk/security-runtime` | Sicherheits-Helfer | Gemeinsame Helfer für Vertrauen, DM-Gating, externe Inhalte und Secret-Sammlung |
  | `plugin-sdk/ssrf-policy` | Helfer für SSRF-Richtlinien | Helfer für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Laufzeit-Helfer | Helfer für pinned dispatcher, guarded fetch und SSRF-Richtlinien |
  | `plugin-sdk/collection-runtime` | Helfer für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnostic-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helfer für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Helfer für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Helfer für gewrapptes Fetch/Proxy | `resolveFetch`, Proxy-Helfer |
  | `plugin-sdk/host-runtime` | Helfer für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Helfer | `RetryConfig`, `retryAsync`, Policy-Runner |
  | `plugin-sdk/allow-from` | Formatierung von Allowlists | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehls-Gating und Helfer für Befehlsoberflächen | `resolveControlCommandGate`, Helfer für Sender-Autorisierung, Helfer für Befehls-Registry |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsen von Secret-Eingaben | Helfer für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Anfragen | Utilities für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Helfer für Guards von Webhook-Bodys | Helfer für das Lesen/Limitieren von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Laufzeit | Inbound-Dispatch, Heartbeat, Antwort-Planer, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Antwort-Dispatch | Helfer für Finalisierung + Provider-Dispatch |
  | `plugin-sdk/reply-history` | Helfer für Antwort-Historie | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helfer für Antwort-Chunks | Helfer für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Helfer für Session-Store | Helfer für Store-Pfad + updated-at |
  | `plugin-sdk/state-paths` | Helfer für Statuspfade | Helfer für Status- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Helfer für Routing-/Session-Keys | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Helfer zur Normalisierung von Session-Keys |
  | `plugin-sdk/status-helpers` | Helfer für Kanalstatus | Builder für Zusammenfassungen von Kanal-/Account-Status, Standardwerte für Laufzeitstatus, Helfer für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Helfer für Zielauflösung | Gemeinsame Helfer für Zielauflösung |
  | `plugin-sdk/string-normalization-runtime` | Helfer für String-Normalisierung | Helfer für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Helfer für Request-URLs | String-URLs aus Request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Helfer für zeitgesteuerte Befehle | Runner für zeitgesteuerte Befehle mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Parameterleser | Gemeinsame Parameterleser für Tools/CLI |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payloads | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Send | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Helfer für Temp-Pfade | Gemeinsame Helfer für Temp-Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Helfer | Subsystem-Logger und Redaktions-Helfer |
  | `plugin-sdk/markdown-table-runtime` | Helfer für Markdown-Tabellen | Helfer für Markdown-Tabellenmodi |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Helfer für Setup lokaler/selbst gehosteter Provider | Helfer für Discovery/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Helfer für OpenAI-kompatible selbst gehostete Provider | Dieselben Helfer für Discovery/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/provider-auth-runtime` | Laufzeit-Helfer für Provider-Auth | Helfer zur Auflösung von API-Schlüsseln zur Laufzeit |
  | `plugin-sdk/provider-auth-api-key` | Helfer für Setup von Provider-API-Schlüsseln | Helfer für API-Key-Onboarding/Profile-Writes |
  | `plugin-sdk/provider-auth-result` | Helfer für Provider-Auth-Ergebnisse | Standard-Builder für OAuth-Auth-Ergebnisse |
  | `plugin-sdk/provider-auth-login` | Helfer für interaktiven Provider-Login | Gemeinsame Helfer für interaktiven Login |
  | `plugin-sdk/provider-selection-runtime` | Helfer für Providerauswahl | Auswahl konfigurierter oder automatischer Provider und Zusammenführen roher Provider-Konfiguration |
  | `plugin-sdk/provider-env-vars` | Helfer für Provider-Umgebungsvariablen | Lookup-Helfer für Auth-Umgebungsvariablen von Providern |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Helfer für Provider-Modell/Replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Helfer für Provider-Endpunkte und Helfer zur Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Helfer für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | Patches für Provider-Onboarding | Helfer für Onboarding-Konfiguration |
| `plugin-sdk/provider-http` | Provider-HTTP-Helfer | Generische Helfer für HTTP/Endpunkt-Fähigkeiten von Providern, einschließlich Multipart-Form-Helfern für Audiotranskription |
| `plugin-sdk/provider-web-fetch` | Helfer für Provider-Web-Fetch | Helfer für Registrierung/Cache von Web-Fetch-Providern |
| `plugin-sdk/provider-web-search-config-contract` | Helfer für Web-Search-Konfiguration von Providern | Schmale Helfer für Web-Search-Konfiguration/Anmeldedaten für Provider, die keine Verdrahtung zur Plugin-Aktivierung benötigen |
| `plugin-sdk/provider-web-search-contract` | Helfer für Web-Search-Verträge von Providern | Schmale Helfer für Verträge von Web-Search-Konfiguration/Anmeldedaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Anmeldedaten |
| `plugin-sdk/provider-web-search` | Helfer für Provider-Web-Search | Helfer für Registrierung/Cache/Laufzeit von Web-Search-Providern |
| `plugin-sdk/provider-tools` | Helfer für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Schema-Bereinigung + Diagnostik für Gemini und xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
| `plugin-sdk/provider-usage` | Helfer für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und andere Helfer für Provider-Nutzung |
| `plugin-sdk/provider-stream` | Helfer für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Helfer für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
| `plugin-sdk/provider-transport-runtime` | Helfer für Provider-Transport | Native Helfer für Provider-Transport wie guarded fetch, Transport-Nachrichtentransformationen und beschreibbare Event-Streams für den Transport |
| `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Queue | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | Gemeinsame Medien-Helfer | Helfer für Media-Fetch/Transformation/Speicherung sowie Builder für Medien-Payloads |
| `plugin-sdk/media-generation-runtime` | Gemeinsame Helfer für Mediengenerierung | Gemeinsame Helfer für Failover, Kandidatenauswahl und Meldungen bei fehlenden Modellen für Bild-/Video-/Musikgenerierung |
| `plugin-sdk/media-understanding` | Helfer für Medienverständnis | Typen für Provider von Medienverständnis sowie bild-/audio-bezogene Exporte für Provider |
| `plugin-sdk/text-runtime` | Gemeinsame Text-Helfer | Strippen von für Assistenten sichtbarem Text, Helfer für Markdown-Rendern/Chunking/Tabellen, Redaktions-Helfer, Helfer für Directive-Tags, Safe-Text-Utilities und verwandte Text-/Logging-Helfer |
| `plugin-sdk/text-chunking` | Helfer für Text-Chunking | Helfer für Chunking ausgehenden Texts |
| `plugin-sdk/speech` | Speech-Helfer | Typen für Speech-Provider sowie providerseitige Helfer für Direktiven, Registry und Validierung |
| `plugin-sdk/speech-core` | Gemeinsamer Speech-Core | Typen für Speech-Provider, Registry, Direktiven, Normalisierung |
| `plugin-sdk/realtime-transcription` | Helfer für Realtime-Transkription | Typen für Provider, Helfer für Registry und gemeinsamer Helfer für WebSocket-Sitzungen |
| `plugin-sdk/realtime-voice` | Helfer für Realtime-Voice | Typen für Provider, Helfer für Registry/Auflösung und Bridge-Sitzungshelfer |
| `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Typen für Bildgenerierung, Failover, Auth und Registry-Helfer |
| `plugin-sdk/music-generation` | Helfer für Musikgenerierung | Typen für Provider/Requests/Ergebnisse der Musikgenerierung |
| `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Typen für Musikgenerierung, Failover-Helfer, Provider-Lookup und Parsing von Modell-Refs |
| `plugin-sdk/video-generation` | Helfer für Videogenerierung | Typen für Provider/Requests/Ergebnisse der Videogenerierung |
| `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Typen für Videogenerierung, Failover-Helfer, Provider-Lookup und Parsing von Modell-Refs |
| `plugin-sdk/interactive-runtime` | Helfer für interaktive Antworten | Normalisierung/Reduktion interaktiver Antwort-Payloads |
| `plugin-sdk/channel-config-primitives` | Primitive für Kanal-Konfiguration | Schmale Primitive für Kanal-Konfigurationsschemata |
| `plugin-sdk/channel-config-writes` | Helfer für Schreibvorgänge in Kanal-Konfigurationen | Helfer für Autorisierung von Schreibvorgängen in Kanal-Konfigurationen |
| `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Prelude | Exporte des gemeinsamen Preludes für Kanal-Plugins |
| `plugin-sdk/channel-status` | Helfer für Kanalstatus | Gemeinsame Helfer für Snapshots/Zusammenfassungen des Kanalstatus |
| `plugin-sdk/allowlist-config-edit` | Helfer für Allowlist-Konfiguration | Helfer zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
| `plugin-sdk/group-access` | Helfer für Gruppenzugriff | Gemeinsame Helfer für Entscheidungen zum Gruppenzugriff |
| `plugin-sdk/direct-dm` | Helfer für direkte DMs | Gemeinsame Helfer für Auth/Guards direkter DMs |
| `plugin-sdk/extension-shared` | Gemeinsame Helfer für Extensions | Primitive für passive Kanäle/Status und Ambient-Proxy-Helfer |
| `plugin-sdk/webhook-targets` | Helfer für Webhook-Ziele | Registry für Webhook-Ziele und Helfer zur Installation von Routen |
| `plugin-sdk/webhook-path` | Helfer für Webhook-Pfade | Helfer zur Normalisierung von Webhook-Pfaden |
| `plugin-sdk/web-media` | Gemeinsame Helfer für Web-Medien | Helfer zum Laden von Remote-/lokalen Medien |
| `plugin-sdk/zod` | Re-Export von Zod | Re-exportiertes `zod` für Verbraucher des Plugin-SDK |
| `plugin-sdk/memory-core` | Gebündelte Helfer für memory-core | Helferoberfläche für Memory-Manager/Konfiguration/Dateien/CLI |
| `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade der Memory-Engine | Laufzeit-Fassade für Memory-Index/Suche |
| `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine des Memory-Hosts | Exporte der Foundation-Engine des Memory-Hosts |
| `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine des Memory-Hosts | Embedding-Verträge für Memory, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Helfer; konkrete Remote-Provider liegen in ihren jeweiligen Plugins |
| `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine des Memory-Hosts | Exporte der QMD-Engine des Memory-Hosts |
| `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine des Memory-Hosts | Exporte der Storage-Engine des Memory-Hosts |
| `plugin-sdk/memory-core-host-multimodal` | Multimodale Helfer des Memory-Hosts | Multimodale Helfer des Memory-Hosts |
| `plugin-sdk/memory-core-host-query` | Query-Helfer des Memory-Hosts | Query-Helfer des Memory-Hosts |
| `plugin-sdk/memory-core-host-secret` | Secret-Helfer des Memory-Hosts | Secret-Helfer des Memory-Hosts |
| `plugin-sdk/memory-core-host-events` | Helfer für Event-Journal des Memory-Hosts | Helfer für Event-Journal des Memory-Hosts |
| `plugin-sdk/memory-core-host-status` | Status-Helfer des Memory-Hosts | Status-Helfer des Memory-Hosts |
| `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeit des Memory-Hosts | CLI-Laufzeit-Helfer des Memory-Hosts |
| `plugin-sdk/memory-core-host-runtime-core` | Core-Laufzeit des Memory-Hosts | Core-Laufzeit-Helfer des Memory-Hosts |
| `plugin-sdk/memory-core-host-runtime-files` | Datei-/Laufzeit-Helfer des Memory-Hosts | Datei-/Laufzeit-Helfer des Memory-Hosts |
| `plugin-sdk/memory-host-core` | Alias für Core-Laufzeit des Memory-Hosts | Herstellerneutraler Alias für Core-Laufzeit-Helfer des Memory-Hosts |
| `plugin-sdk/memory-host-events` | Alias für Event-Journal des Memory-Hosts | Herstellerneutraler Alias für Helfer des Event-Journals des Memory-Hosts |
| `plugin-sdk/memory-host-files` | Alias für Datei-/Laufzeit des Memory-Hosts | Herstellerneutraler Alias für Datei-/Laufzeit-Helfer des Memory-Hosts |
| `plugin-sdk/memory-host-markdown` | Helfer für Managed Markdown | Gemeinsame Helfer für Managed Markdown für speichernahe Plugins |
| `plugin-sdk/memory-host-search` | Fassade für Active Memory Search | Lazy-Laufzeit-Fassade des Search-Managers für Active Memory |
| `plugin-sdk/memory-host-status` | Alias für Status des Memory-Hosts | Herstellerneutraler Alias für Status-Helfer des Memory-Hosts |
| `plugin-sdk/memory-lancedb` | Gebündelte Helfer für memory-lancedb | Helferoberfläche für memory-lancedb |
| `plugin-sdk/testing` | Test-Utilities | Test-Helfer und Mocks |
</Accordion>

Diese Tabelle ist bewusst die häufige Teilmenge für Migrationen, nicht die vollständige SDK-
Oberfläche. Die vollständige Liste mit über 200 Entry-Points befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Helferschnittstellen für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die
Wartung gebündelter Plugins und aus Kompatibilitätsgründen exportiert, werden aber absichtlich
aus der häufigen Migrationstabelle weggelassen und sind nicht das empfohlene Ziel für
neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Hilfsschnittstellen wie:

- Browser-Unterstützungshelfer: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- gebündelte Helfer-/Plugin-Oberflächen wie `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` und `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` stellt derzeit die schmale Oberfläche der Token-Helfer
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwenden Sie den schmalsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden können,
prüfen Sie die Quelle unter `src/plugin-sdk/` oder fragen Sie in Discord nach.

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Oberflächen geben Laufzeitwarnungen aus                     |
| **Nächste Hauptversion** | Veraltete Oberflächen werden entfernt; Plugins, die sie noch verwenden, schlagen dann fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor der nächsten Hauptversion
migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein temporärer Escape-Hatch, keine dauerhafte Lösung.

## Verwandt

- [Getting Started](/de/plugins/building-plugins) — Ihr erstes Plugin bauen
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Imports
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Kanal-Plugins bauen
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins bauen
- [Plugin Internals](/de/plugins/architecture) — tiefer Einblick in die Architektur
- [Plugin Manifest](/de/plugins/manifest) — Referenz für das Manifest-Schema
