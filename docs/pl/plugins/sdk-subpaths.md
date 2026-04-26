---
read_when:
    - Wybór właściwej ścieżki podrzędnej plugin-sdk dla importu Plugin
    - Audyt ścieżek podrzędnych dołączonych Plugin i powierzchni pomocniczych
summary: 'Katalog ścieżek podrzędnych SDK Plugin: które importy znajdują się gdzie, pogrupowane według obszaru'
title: Ścieżki podrzędne SDK Plugin
x-i18n:
    generated_at: "2026-04-26T11:38:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  SDK Plugin jest udostępniane jako zestaw wąskich ścieżek podrzędnych pod `openclaw/plugin-sdk/`.
  Ta strona kataloguje najczęściej używane ścieżki podrzędne pogrupowane według przeznaczenia. Wygenerowana
  pełna lista ponad 200 ścieżek podrzędnych znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`;
  zastrzeżone ścieżki podrzędne helperów dołączonych Plugin też się tam pojawiają, ale są szczegółem implementacji,
  chyba że jakaś strona dokumentacji jawnie je promuje.

  Przewodnik po tworzeniu Plugin znajdziesz w [Plugin SDK overview](/pl/plugins/sdk-overview).

  ## Wejście Plugin

  | Ścieżka podrzędna          | Kluczowe eksporty                                                                                                                      |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Ścieżki podrzędne kanałów">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery wizard konfiguracji, prompty list dozwolonych, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji/bramkowania akcji dla wielu kont, helpery fallbacku do konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji account-id |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania konta + fallbacku do ustawienia domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie helpery list kont/akcji kont |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem do kontraktu dołączonego |
    | `plugin-sdk/command-gating` | Wąskie helpery bramkowania autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpery cyklu życia/finalizacji draft stream |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery routingu przychodzącego + budowania koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery rejestrowania i dispatchu przychodzącego |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących |
    | `plugin-sdk/outbound-send-deps` | Lekkie wyszukiwanie zależności wysyłania wychodzącego dla adapterów kanałów |
    | `plugin-sdk/outbound-runtime` | Helpery dostarczania wychodzącego, tożsamości, delegata wysyłania, sesji, formatowania i planowania payloadów |
    | `plugin-sdk/poll-runtime` | Wąskie helpery normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia powiązań wątków i adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor payloadów mediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery powiązań rozmów/wątków, Pairing i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Helpery rozstrzygania polityki grup runtime |
    | `plugin-sdk/channel-status` | Współdzielone helpery migawek/podsumowań statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisów konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty prelude Plugin kanału |
    | `plugin-sdk/allowlist-config-edit` | Helpery edycji/odczytu konfiguracji allowlist |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone helpery auth/guard bezpośrednich DM |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja wiadomości, dostarczanie i starsze helpery interaktywnych odpowiedzi. Zobacz [Message Presentation](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibility barrel dla inbound debounce, dopasowywania wzmianek, helperów polityki wzmianek i helperów kopert |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie helpery inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Wąskie helpery polityki wzmianek i tekstu wzmianek bez szerszej powierzchni inbound runtime |
    | `plugin-sdk/channel-envelope` | Wąskie helpery formatowania kopert przychodzących |
    | `plugin-sdk/channel-location` | Helpery kontekstu lokalizacji kanału i formatowania |
    | `plugin-sdk/channel-logging` | Helpery logowania kanału dla odrzuceń przychodzących i błędów typing/ack |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Helpery akcji wiadomości kanału oraz przestarzałe helpery natywnych schematów zachowane dla zgodności Plugin |
    | `plugin-sdk/channel-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie feedbacku/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, oraz typy celów sekretów |
  </Accordion>

  <Accordion title="Ścieżki podrzędne dostawców">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji dostawców lokalnych/samohostowanych |
    | `plugin-sdk/self-hosted-provider-setup` | Skoncentrowane helpery konfiguracji samohostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania klucza API w runtime dla Plugin dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu/zapisu profili kluczy API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyników auth OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone helpery interaktywnego logowania dla Plugin dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych env auth dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory polityki replay, helpery endpointów dostawców oraz helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generyczne helpery możliwości HTTP/endpointów dostawcy, błędy HTTP dostawcy i helpery formularzy multipart do transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/cache dostawców web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączania Plugin |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/cache/runtime dostawców web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostyka schematów Gemini oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone helpery wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne helpery transportu dostawców, takie jak guarded fetch, transformacje wiadomości transportowych i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Helpery patchy konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/cache lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie helpery trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

  <Accordion title="Ścieżki podrzędne auth i bezpieczeństwa">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, w tym formatowanie dynamicznego menu argumentów, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozstrzygania zatwierdzającego i auth akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Helpery profili/filtrów natywnych zatwierdzeń exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptery możliwości/dostarczania natywnych zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozstrzygania gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnych adapterów zatwierdzeń dla hot channel entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery runtime obsługi zatwierdzeń; preferuj węższe adapter/gateway seams, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Helpery celu natywnych zatwierdzeń + powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery payloadów odpowiedzi zatwierdzeń exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helpery payloadów zatwierdzeń exec/Plugin, helpery routingu/runtime natywnych zatwierdzeń oraz helpery uporządkowanego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie helpery resetu deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie helpery testów kontraktu kanału bez szerokiego testing barrel |
    | `plugin-sdk/command-auth-native` | Natywne auth poleceń, formatowanie dynamicznego menu argumentów i helpery celów natywnych sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla hot channel paths |
    | `plugin-sdk/command-surface` | Helpery normalizacji ciała polecenia i powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktu sekretów dla powierzchni sekretów kanałów/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef dla parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery allowlist hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery pinned-dispatcher bez szerokiej powierzchni infra runtime |
    | `plugin-sdk/ssrf-runtime` | Helpery pinned-dispatcher, fetch chronionego przed SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania sekretnego wejścia |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru treści żądania/timeoutu |
  </Accordion>

  <Accordion title="Ścieżki podrzędne runtime i storage">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery runtime/logowania/backupu/instalacji Plugin |
    | `plugin-sdk/runtime-env` | Wąskie helpery env runtime, loggera, timeoutu, retry i backoff |
    | `plugin-sdk/channel-runtime-context` | Generyczne helpery rejestracji i wyszukiwania kontekstu runtime kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/http/interaktywności Plugin |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery pipeline Webhook/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Helpery lazy import/binding runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery exec procesu |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, wait, version, wywołania argumentów i leniwych grup poleceń |
    | `plugin-sdk/gateway-runtime` | Helpery klienta Gateway i patchy statusu kanału |
    | `plugin-sdk/config-runtime` | Helpery ładowania/zapisu konfiguracji i wyszukiwania konfiguracji Plugin |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji nazw/opisów poleceń Telegram oraz kontroli duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram nie jest dostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków referencji plików bez szerokiego text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzeń exec/Plugin, konstruktory możliwości zatwierdzeń, helpery auth/profili, helpery natywnego routingu/runtime oraz formatowanie uporządkowanych ścieżek wyświetlania zatwierdzeń |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery runtime przychodzących/odpowiedzi, chunking, dispatch, Heartbeat, planner odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatch/finalizacji odpowiedzi i etykiet rozmów |
    | `plugin-sdk/reply-history` | Współdzielone helpery historii odpowiedzi dla krótkiego okna, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery chunkingu tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżek magazynu sesji + updated-at |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery routingu/kluczy sesji/powiązań kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowań statusu kanałów/kont, domyślne ustawienia runtime-state i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery resolvera celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slug/string |
    | `plugin-sdk/request-url` | Wyodrębnia string URL z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólni czytelnicy parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnia znormalizowane payloady z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnia kanoniczne pola celu wysyłania z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowych pobrań |
    | `plugin-sdk/logging-core` | Helpery loggera podsystemów i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu i konwersji tabel Markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Helpery re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Helpery cache deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Helpery runtime/sesji ACP i reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only rozstrzyganie powiązań ACP bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów logicznych |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozstrzygania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrap urządzeń i tokenów Pairing |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanałów pasywnych, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia `/models` / dostawcy |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/budowy/serializacji natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych Plugin dla niskopoziomowych harnessów agentów: typy harnessów, helpery steer/abort aktywnych uruchomień, helpery mostka narzędzi OpenClaw, helpery polityki narzędzia runtime-plan, klasyfikacja wyników terminalnych, helpery formatowania/szczegółów postępu narzędzi i utility wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointów Z.AI |
    | `plugin-sdk/infra-runtime` | Helpery zdarzeń systemowych/Heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery cache o ograniczonym rozmiarze |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Helpery grafu błędów, formatowania, współdzielonej klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch, proxy i pinned lookup |
    | `plugin-sdk/runtime-fetch` | Fetch runtime świadomy dispatcher bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Czytnik treści odpowiedzi o ograniczonym rozmiarze bez szerokiej powierzchni media runtime |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania rozmowy bez routingu skonfigurowanych powiązań lub magazynów Pairing |
    | `plugin-sdk/session-store-runtime` | Helpery odczytu session-store bez szerokich importów zapisów/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozstrzyganie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów config/security |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery wymuszania i normalizacji prymitywnych rekordów/string bez importów markdown/logging |
    | `plugin-sdk/host-runtime` | Helpery normalizacji hostname i hostów SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji retry i runnera retry |
    | `plugin-sdk/agent-runtime` | Helpery katalogu/tożsamości/workspace agenta |
    | `plugin-sdk/directory-runtime` | Zapytania/dedup katalogów wspierane konfiguracją |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Ścieżki podrzędne możliwości i testów">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery fetch/transform/store mediów oraz konstruktory payloadów mediów |
    | `plugin-sdk/media-store` | Wąskie helpery media store, takie jak `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery failover generowania mediów, wybór kandydatów i komunikaty o brakujących modelach |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty helperów obrazu/audio skierowane do dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel Markdown, helpery redakcji, helpery tagów dyrektyw i utility bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper chunkingu tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty helperów dyrektyw, rejestru, walidacji i mowy skierowane do dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywy, normalizacja i helpery mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji realtime, helpery rejestru i współdzielony helper sesji WebSocket |
    | `plugin-sdk/realtime-voice` | Typy dostawców realtime voice i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy, failover, auth i helpery rejestru generowania obrazów |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery failover, wyszukiwanie dostawców i parsowanie referencji modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery failover, wyszukiwanie dostawców i parsowanie referencji modeli |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania zdalnych/lokalnych mediów |
    | `plugin-sdk/zod` | Reeksportowane `zod` dla konsumentów SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Ścieżki podrzędne pamięci">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia helperów memory-core dla helperów manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksowania/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty foundation engine hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta pamięci, dostęp do rejestru, lokalny dostawca i generyczne helpery batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty QMD engine hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty storage engine hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodal hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery CLI runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Podstawowe helpery runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla podstawowych helperów runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias dla helperów plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery managed-markdown dla Plugin powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada runtime Active Memory dla dostępu do search-manager |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias dla helperów statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Dołączona powierzchnia helperów memory-lancedb |
  </Accordion>

  <Accordion title="Zastrzeżone ścieżki podrzędne dołączonych helperów">
    | Rodzina | Bieżące ścieżki podrzędne | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpery wsparcia dołączonego Plugin przeglądarki. `browser-profiles` eksportuje `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` i `ResolvedBrowserTabCleanupConfig` dla znormalizowanego kształtu `browser.tabCleanup`. `browser-support` pozostaje compatibility barrel. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Dołączona powierzchnia helperów/runtime Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Dołączona powierzchnia helperów/runtime LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Dołączona powierzchnia helperów IRC |
    | Helpery specyficzne dla kanału | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Dołączone seams zgodności/helperów kanałowych |
    | Helpery specyficzne dla auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Dołączone seams helperów funkcji/Plugin; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Powiązane

- [Plugin SDK overview](/pl/plugins/sdk-overview)
- [Plugin SDK setup](/pl/plugins/sdk-setup)
- [Building plugins](/pl/plugins/building-plugins)
