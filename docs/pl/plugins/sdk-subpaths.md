---
read_when:
    - Wybieranie właściwej podścieżki plugin-sdk dla importu Plugin
    - Audyt podścieżek dołączonych Plugin i powierzchni pomocników
summary: 'Katalog podścieżek Plugin SDK: które importy znajdują się gdzie, pogrupowane według obszaru'
title: Podścieżki Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:55:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK jest udostępniany jako zestaw wąskich podścieżek pod `openclaw/plugin-sdk/`.
  Ta strona kataloguje najczęściej używane podścieżki pogrupowane według przeznaczenia. Wygenerowana
  pełna lista ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`;
  zarezerwowane podścieżki pomocników dołączonych Plugin również się tam pojawiają, ale są
  szczegółem implementacyjnym, chyba że strona dokumentacji jawnie je promuje.

  Przewodnik po tworzeniu Plugin znajdziesz w [Przegląd Plugin SDK](/pl/plugins/sdk-overview).

  ## Entry Plugin

  | Podścieżka                 | Kluczowe eksporty                                                                                                                       |
  | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                     |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                        |
  | `plugin-sdk/provider-entry`| `defineSingleProviderPluginEntry`                                                                                                       |

  <AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora setup, prompty allowlist, budownicze statusu setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki config/bramek działań dla wielu kont, pomocniki zapasowego konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji ID konta |
    | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania konta + zapasowego domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki list kont/działań na koncie |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu config kanału |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji niestandardowych poleceń Telegram z zapasowym kontraktem dołączonym |
    | `plugin-sdk/command-gating` | Wąskie pomocniki bramek autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, pomocniki cyklu życia/finalizacji strumienia roboczego |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki routingu przychodzącego + budowania envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone pomocniki rejestrowania i dispatch przychodzących |
    | `plugin-sdk/messaging-targets` | Pomocniki parsowania/dopasowywania targetów |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Pomocniki dostarczania wychodzącego, tożsamości, delegata wysyłania, sesji, formatowania i planowania ładunku |
    | `plugin-sdk/poll-runtime` | Wąskie pomocniki normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia i adapterów powiązań wątków |
    | `plugin-sdk/agent-media-payload` | Starszy budowniczy ładunku mediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki rozmów/powiązań wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik snapshotu config runtime |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozwiązywania groupPolicy w runtime |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki snapshotu/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu config kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisów config kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium Plugin kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki edycji/odczytu config allowlist |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone pomocniki auth/guard dla bezpośrednich DM |
    | `plugin-sdk/interactive-runtime` | Prezentacja wiadomości semantycznych, dostarczanie i starsze pomocniki odpowiedzi interaktywnych. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Beczka zgodności dla debounce przychodzącego, dopasowywania wzmianek, pomocników zasad wzmianek i helperów envelope |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie pomocniki debounce przychodzącego |
    | `plugin-sdk/channel-mention-gating` | Wąskie pomocniki zasad wzmianek i tekstu wzmianek bez szerszej powierzchni runtime przychodzącego |
    | `plugin-sdk/channel-envelope` | Wąskie pomocniki formatowania przychodzących envelope |
    | `plugin-sdk/channel-location` | Pomocniki kontekstu i formatowania lokalizacji kanału |
    | `plugin-sdk/channel-logging` | Pomocniki logowania kanału dla porzuceń przychodzących i błędów typing/ack |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Pomocniki działań wiadomości kanału oraz przestarzałe pomocniki natywnego schematu zachowane dla zgodności Plugin |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania/dopasowywania targetów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Logika feedback/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, oraz typy celów sekretów |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratorowane pomocniki setup dla lokalnych/self-hosted dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Skoncentrowane pomocniki setup dla samohostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne backendy CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pomocniki runtime do rozwiązywania kluczy API dla Plugin dostawców |
    | `plugin-sdk/provider-auth-api-key` | Pomocniki onboarding/zapisu profilu klucza API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy budowniczy wyniku auth OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone interaktywne pomocniki logowania dla Plugin dostawców |
    | `plugin-sdk/provider-env-vars` | Pomocniki wyszukiwania zmiennych env dla auth dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone budownicze zasad replay, pomocniki endpointów dostawców oraz pomocniki normalizacji ID modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne pomocniki HTTP/możliwości endpointów dostawców, błędy HTTP dostawców i pomocniki formularzy multipart do transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie pomocniki kontraktu config/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pomocniki rejestracji/cache dostawców web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie pomocniki config/poświadczeń web-search dla dostawców, którzy nie potrzebują logiki włączania Plugin |
    | `plugin-sdk/provider-web-search-contract` | Wąskie pomocniki kontraktu config/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Pomocniki rejestracji/cache/runtime dostawców web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz pomocniki zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne pomocniki transportu dostawców, takie jak guarded fetch, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Pomocniki łatek config onboarding |
    | `plugin-sdk/global-singleton` | Pomocniki singletonów/map/cache lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie pomocniki trybu aktywacji grup i parsowania poleceń |
  </Accordion>

  <Accordion title="Podścieżki auth i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pomocniki rejestru poleceń, w tym formatowanie dynamicznego menu argumentów, pomocniki autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Budownicze wiadomości poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pomocniki rozwiązywania zatwierdzających i auth działań w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Pomocniki profilu/filtra natywnych zatwierdzeń exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptery możliwości/dostarczania natywnych zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony pomocnik rozwiązywania zatwierdzeń przez gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie pomocniki ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanału |
    | `plugin-sdk/approval-handler-runtime` | Szersze pomocniki runtime handlera zatwierdzeń; preferuj węższe seamy adapter/gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Pomocniki natywnego celu zatwierdzenia + powiązania konta |
    | `plugin-sdk/approval-reply-runtime` | Pomocniki ładunku odpowiedzi zatwierdzeń exec/Plugin |
    | `plugin-sdk/approval-runtime` | Pomocniki ładunku zatwierdzeń exec/Plugin, pomocniki natywnego routingu/runtime zatwierdzeń oraz pomocniki strukturalnego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie pomocniki resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie pomocniki testów kontraktu kanału bez szerokiej beczki testing |
    | `plugin-sdk/command-auth-native` | Auth natywnych poleceń, formatowanie dynamicznego menu argumentów i pomocniki natywnego celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone pomocniki wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanału |
    | `plugin-sdk/command-surface` | Normalizacja treści poleceń i pomocniki powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki zbierania kontraktu sekretów dla powierzchni sekretów kanału/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Wąskie `coerceSecretRef` i pomocniki typowania SecretRef dla parsowania kontraktu sekretów/config |
    | `plugin-sdk/security-runtime` | Współdzielone pomocniki zaufania, ograniczania DM, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Pomocniki listy dozwolonych hostów i zasad SSRF dla sieci prywatnej |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie pomocniki pinned-dispatcher bez szerokiej powierzchni infra runtime |
    | `plugin-sdk/ssrf-runtime` | Pomocniki pinned-dispatcher, fetch chronionego przez SSRF i zasad SSRF |
    | `plugin-sdk/secret-input` | Pomocniki parsowania wejścia sekretów |
    | `plugin-sdk/webhook-ingress` | Pomocniki żądań/targetów Webhook |
    | `plugin-sdk/webhook-request-guards` | Pomocniki rozmiaru ciała żądania/limitu czasu |
  </Accordion>

  <Accordion title="Podścieżki runtime i storage">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie pomocniki runtime/logowania/backup/installacji Plugin |
    | `plugin-sdk/runtime-env` | Wąskie pomocniki env runtime, loggera, limitu czasu, retry i backoff |
    | `plugin-sdk/channel-runtime-context` | Ogólne pomocniki rejestracji i wyszukiwania kontekstu runtime kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki poleceń/hooków/http/interaktywnych Plugin |
    | `plugin-sdk/hook-runtime` | Współdzielone pomocniki potoku Webhook/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Pomocniki leniwego importu/powiązania runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pomocniki exec procesu |
    | `plugin-sdk/cli-runtime` | Pomocniki formatowania CLI, oczekiwania, wersji, wywoływania argumentów i leniwych grup poleceń |
    | `plugin-sdk/gateway-runtime` | Pomocniki klienta Gateway i łatek statusu kanału |
    | `plugin-sdk/config-runtime` | Pomocniki ładowania/zapisu config i wyszukiwania config Plugin |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz sprawdzanie duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolink odwołań do plików bez szerokiej beczki text-runtime |
    | `plugin-sdk/approval-runtime` | Pomocniki zatwierdzeń exec/Plugin, budownicze możliwości zatwierdzeń, pomocniki auth/profilu, natywnego routingu/runtime i formatowania ścieżki strukturalnego wyświetlania zatwierdzeń |
    | `plugin-sdk/reply-runtime` | Współdzielone pomocniki runtime przychodzących/odpowiedzi, chunking, dispatch, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki dispatch/finalizacji odpowiedzi i etykiet rozmowy |
    | `plugin-sdk/reply-history` | Współdzielone pomocniki krótkiego okna historii odpowiedzi, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie pomocniki chunkingu tekstu/markdown |
    | `plugin-sdk/session-store-runtime` | Pomocniki ścieżki magazynu sesji + updated-at |
    | `plugin-sdk/state-paths` | Pomocniki ścieżek katalogów state/OAuth |
    | `plugin-sdk/routing` | Pomocniki routingu/klucza sesji/powiązań konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone pomocniki podsumowania statusu kanału/konta, domyślne stany runtime i pomocniki metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone pomocniki rozwiązywania targetów |
    | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnianie URL-i tekstowych z danych wejściowych typu fetch/request |
    | `plugin-sdk/run-command` | Uruchamianie poleceń z limitem czasu ze znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłania z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone pomocniki ścieżek tymczasowych pobrań |
    | `plugin-sdk/logging-core` | Pomocniki loggera podsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Pomocniki trybu tabel markdown i konwersji |
    | `plugin-sdk/json-store` | Małe pomocniki odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Pomocniki re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Pomocniki cache deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Pomocniki runtime/sesji ACP i reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozwiązywanie powiązań ACP tylko do odczytu bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu config runtime agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametru logicznego |
    | `plugin-sdk/dangerous-name-runtime` | Pomocniki rozwiązywania dopasowania niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Pomocniki bootstrapu urządzenia i tokenu parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy pomocników kanału pasywnego, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Pomocniki odpowiedzi polecenia `/models`/dostawcy |
    | `plugin-sdk/skill-commands-runtime` | Pomocniki listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Pomocniki rejestru/budowy/serializacji natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych Plugin dla niskopoziomowych wiązek agentów: typy wiązek, pomocniki sterowania/przerywania aktywnego uruchomienia, pomocniki mostu narzędzi OpenClaw, pomocniki formatowania/szczegółów postępu narzędzi i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Pomocniki wykrywania endpointu Z.AI |
    | `plugin-sdk/infra-runtime` | Pomocniki zdarzeń systemowych/Heartbeat |
    | `plugin-sdk/collection-runtime` | Małe pomocniki ograniczonego cache |
    | `plugin-sdk/diagnostic-runtime` | Pomocniki flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Pomocniki grafu błędów, formatowania, współdzielonej klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Pomocniki opakowanego fetch, proxy i pinned lookup |
    | `plugin-sdk/runtime-fetch` | Świadomy dispatcher runtime fetch bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik ciała odpowiedzi bez szerokiej powierzchni media runtime |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania rozmowy bez routingu skonfigurowanych powiązań albo magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Pomocniki odczytu session-store bez szerokich importów zapisów/utrzymania config |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów config/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie pomocniki coercji i normalizacji rekordów/ciągów prymitywnych bez importów markdown/logowania |
    | `plugin-sdk/host-runtime` | Pomocniki normalizacji hostname i hosta SCP |
    | `plugin-sdk/retry-runtime` | Pomocniki config retry i wykonawcy retry |
    | `plugin-sdk/agent-runtime` | Pomocniki katalogu/tożsamości/przestrzeni roboczej agenta |
    | `plugin-sdk/directory-runtime` | Zapytania/deduplikacja katalogów opartych na config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone pomocniki pobierania/przekształcania/przechowywania mediów oraz budownicze ładunków mediów |
    | `plugin-sdk/media-store` | Wąskie pomocniki magazynu mediów, takie jak `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki failover generowania mediów, wybór kandydatów i komunikaty o braku modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty pomocników obrazów/audio po stronie dostawcy |
    | `plugin-sdk/text-runtime` | Współdzielone pomocniki tekstu/markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, pomocniki renderowania/chunkingu/tabel markdown, pomocniki redakcji, dyrektyw tagów i bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Pomocnik chunkingu tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji i pomocników mowy po stronie dostawcy |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywy, normalizacja i eksporty pomocników mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, pomocniki rejestru i współdzielony pomocnik sesji WebSocket |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i pomocniki rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, failover, auth i pomocniki rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, pomocniki failover, wyszukiwanie dostawcy i parsowanie model-ref |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, pomocniki failover, wyszukiwanie dostawcy i parsowanie model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr targetów Webhook i pomocniki instalacji tras |
    | `plugin-sdk/webhook-path` | Pomocniki normalizacji ścieżki Webhook |
    | `plugin-sdk/web-media` | Współdzielone pomocniki ładowania zdalnych/lokalnych mediów |
    | `plugin-sdk/zod` | Ponownie eksportowany `zod` dla konsumentów Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Podścieżki Memory">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia pomocników memory-core dla helperów manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika foundation hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta pamięci, dostęp do rejestru, lokalny dostawca i ogólne pomocniki batch/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika storage hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Pomocniki dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Pomocniki runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Podstawowe pomocniki runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla podstawowych pomocników runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla pomocników dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias dla pomocników plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone pomocniki zarządzanego markdown dla Plugin sąsiadujących z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada runtime Active Memory dla dostępu do search-manager |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias dla pomocników statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Dołączona powierzchnia pomocników memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki pomocników dołączonych">
    | Rodzina | Bieżące podścieżki | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Pomocniki wsparcia dla dołączonego Plugin browser. `browser-profiles` eksportuje `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` i `ResolvedBrowserTabCleanupConfig` dla znormalizowanego kształtu `browser.tabCleanup`. `browser-support` pozostaje beczką zgodności. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia pomocników/runtime dołączonego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia pomocników/runtime dołączonego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia pomocników dołączonego IRC |
    | Pomocniki specyficzne dla kanału | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seamy zgodności/pomocników dołączonych kanałów |
    | Pomocniki specyficzne dla auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seamy pomocników dołączonych funkcji/Plugin; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Powiązane

- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Setup Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
