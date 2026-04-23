---
read_when:
    - Musisz wiedzieć, z którego subpath SDK importować
    - Chcesz referencji wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK Overview
summary: Mapa importów, referencja API rejestracji i architektura SDK
title: Przegląd SDK Pluginów
x-i18n:
    generated_at: "2026-04-23T10:05:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd SDK Pluginów

SDK Pluginów to typowany kontrakt między Pluginami a core. Ta strona jest
referencją dla **tego, co importować** i **co można rejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
  - Pierwszy Plugin? Zacznij od [Pierwsze kroki](/pl/plugins/building-plugins)
  - Plugin kanału? Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
  - Plugin providera? Zobacz [Pluginy providerów](/pl/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importu

Zawsze importuj z konkretnego subpath:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każdy subpath to mały, samowystarczalny moduł. Dzięki temu start jest szybki
i unika się problemów z zależnościami cyklicznymi. Dla helperów wejścia/buildu specyficznych dla kanałów
preferuj `openclaw/plugin-sdk/channel-core`; zachowaj `openclaw/plugin-sdk/core` dla
szerszej powierzchni parasolowej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie polegaj na wygodnych interfejsach nazwanych od providerów, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ani
interfejsach helperów markowanych kanałami. Dołączone Pluginy powinny składać generyczne
subpathy SDK we własnych barrelach `api.ts` lub `runtime-api.ts`, a core
powinien albo używać tych lokalnych barrelli Pluginów, albo dodać wąski generyczny kontrakt SDK,
gdy potrzeba jest naprawdę międzykanałowa.

Wygenerowana mapa eksportów nadal zawiera mały zestaw interfejsów helperów dołączonych Pluginów,
takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Te
subpathy istnieją wyłącznie dla utrzymania i zgodności dołączonych Pluginów; celowo
pominięto je w poniższej wspólnej tabeli i nie są zalecaną ścieżką importu
dla nowych zewnętrznych Pluginów.

## Referencja subpath

Najczęściej używane subpathy, pogrupowane według przeznaczenia. Wygenerowana pełna lista
ponad 200 subpath znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane subpathy helperów dołączonych Pluginów nadal pojawiają się w tej wygenerowanej liście.
Traktuj je jako powierzchnie szczegółów implementacyjnych/zgodności, chyba że strona dokumentacji
jawnie promuje któryś z nich jako publiczny.

### Wejście Pluginu

| Subpath                     | Kluczowe eksporty                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subpathy kanałów">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji, prompty allowlist i buildery statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji/bramkowania akcji dla wielu kont i helpery fallbacku konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji account-id |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania konta + fallbacku domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie helpery list kont/akcji na kontach |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem kontraktu dołączonego |
    | `plugin-sdk/command-gating` | Wąskie helpery bramek autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpery cyklu życia/finalizacji draft stream |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery budowania tras przychodzących + koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery rejestrowania i dispatchu odpowiedzi przychodzących |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Helpery tożsamości wychodzącej, delegata wysyłki i planowania ładunków |
    | `plugin-sdk/poll-runtime` | Wąskie helpery normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia powiązań wątków i adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy builder ładunku mediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery rozmów/powiązań wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Helpery rozstrzygania groupPolicy w runtime |
    | `plugin-sdk/channel-status` | Współdzielone helpery migawek/podsumowań statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisów konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium Pluginów kanałów |
    | `plugin-sdk/allowlist-config-edit` | Helpery edycji/odczytu konfiguracji allowlist |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji dostępu do grup |
    | `plugin-sdk/direct-dm` | Współdzielone helpery auth/guard dla bezpośrednich DM |
    | `plugin-sdk/interactive-runtime` | Semantyczne helpery prezentacji wiadomości, dostarczania i starszych interaktywnych odpowiedzi. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel zgodności dla helperów debounce wejścia, dopasowania wzmianek, polityki wzmianek i kopert |
    | `plugin-sdk/channel-mention-gating` | Wąskie helpery polityki wzmianek bez szerszej powierzchni inbound runtime |
    | `plugin-sdk/channel-location` | Helpery kontekstu i formatowania lokalizacji kanału |
    | `plugin-sdk/channel-logging` | Helpery logowania kanału dla odrzuceń wiadomości przychodzących i błędów typing/ack |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Helpery akcji wiadomości kanału oraz przestarzałe natywne helpery schematu zachowane dla zgodności Pluginów |
    | `plugin-sdk/channel-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktów kanału |
    | `plugin-sdk/channel-feedback` | Integracja feedbacku/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` i typy celów sekretów |
  </Accordion>

  <Accordion title="Subpathy providerów">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnych/własnych providerów |
    | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji własnych providerów zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozstrzygania kluczy API w runtime dla Pluginów providerów |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu/zapisu profili kluczy API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy builder wyniku auth OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone interaktywne helpery logowania dla Pluginów providerów |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych env auth providerów |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityk replay, helpery endpointów providerów i helpery normalizacji model-id, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generyczne helpery możliwości HTTP/endpointów providerów, w tym helpery formularzy multipart dla transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/cache providerów web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń web-search dla providerów, które nie potrzebują integracji włączania Pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` i helpery ustawiania/pobierania poświadczeń w określonym zakresie |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/cache/runtime providerów web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne helpery transportu providerów, takie jak guarded fetch, transformacje wiadomości transportowych i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Helpery patchowania konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/cache lokalnych dla procesu |
  </Accordion>

  <Accordion title="Subpathy auth i bezpieczeństwa">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Buildery poleceń/wiadomości pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozstrzygania zatwierdzających i auth akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Natywne helpery profili/filtrów zatwierdzeń exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozstrzygania gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnych adapterów zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery runtime handlerów zatwierdzeń; preferuj węższe interfejsy adapter/gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Natywne helpery celów zatwierdzeń + powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery ładunków odpowiedzi zatwierdzeń exec/Plugin |
    | `plugin-sdk/command-auth-native` | Natywne helpery auth poleceń + natywne helpery celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-surface` | Helpery normalizacji treści poleceń i powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktów sekretów dla powierzchni sekretów kanałów/Pluginów |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef do parsowania kontraktów sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznej i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery allowlist hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery pinned-dispatcher bez szerokiej powierzchni runtime infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Helpery pinned-dispatcher, fetch chronionego przez SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania wejścia sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru treści żądania/timeoutu |
  </Accordion>

  <Accordion title="Subpathy runtime i magazynu">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery runtime/logowania/backupu/instalacji Pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery env runtime, loggera, timeoutu, ponownych prób i backoff |
    | `plugin-sdk/channel-runtime-context` | Generyczne helpery rejestracji i wyszukiwania kontekstu runtime kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/http/interaktywne Pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery potoku Webhooków/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/bindowania runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery exec procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania i wersji |
    | `plugin-sdk/gateway-runtime` | Helpery klienta Gateway i patchowania statusu kanału |
    | `plugin-sdk/config-runtime` | Helpery ładowania/zapisu konfiguracji i wyszukiwania konfiguracji Pluginów |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz kontrole duplikatów/konfliktów, nawet gdy powierzchnia kontraktu dołączonego Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzeń exec/Plugin, buildery możliwości zatwierdzeń, helpery auth/profili, natywne helpery routingu/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery runtime wejścia/odpowiedzi, chunkingu, dispatchu, Heartbeat, planera odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatchu/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone helpery historii odpowiedzi krótkiego okna, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery chunkingu tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżki magazynu sesji + updated-at |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery tras/powiązań session-key/konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowań statusu kanału/konta, domyślnych stanów runtime i metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery rozstrzygania celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slug/string |
    | `plugin-sdk/request-url` | Wyodrębnianie URL string z wejść typu fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z timeoutem i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólni czytelnicy parametrów tools/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzi |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Helpery loggera subsystemów i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Rekurencyjne helpery blokad plików |
    | `plugin-sdk/persistent-dedupe` | Helpery cache deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Helpery runtime/sesji ACP i dispatchu odpowiedzi |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozstrzyganie powiązań ACP tylko do odczytu bez importów uruchomienia cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów boolean |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozstrzygania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzeń i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanałów pasywnych, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia/providera `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery budowania/serializacji/rejestru natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia dla zaufanych Pluginów dla niskopoziomowych harnessów agentów: typy harnessów, helpery steer/abort aktywnych uruchomień, helpery mostu narzędzi OpenClaw i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointów Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpery system event/Heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonych cache |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch, proxy i pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch świadome dispatcher bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik treści odpowiedzi bez szerokiej powierzchni media runtime |
    | `plugin-sdk/session-binding-runtime` | Stan bieżącego powiązania rozmowy bez routingu skonfigurowanych powiązań lub magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Helpery odczytu magazynu sesji bez szerokich importów zapisów/konserwacji konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozstrzyganie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery wymuszania i normalizacji rekordów/stringów prymitywnych bez importów markdown/logowania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji i runnera ponownych prób |
    | `plugin-sdk/agent-runtime` | Helpery katalogu/tożsamości/obszaru roboczego agenta |
    | `plugin-sdk/directory-runtime` | Zapytania/deduplikacja katalogów wspierane konfiguracją |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpathy możliwości i testowania">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania/transformacji/magazynu mediów oraz buildery ładunków mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery failover generowania mediów, wyboru kandydatów i komunikatów o brakujących modelach |
    | `plugin-sdk/media-understanding` | Typy providerów rozumienia mediów oraz eksporty helperów obrazów/audio skierowane do providerów |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel Markdown, helpery redakcji, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper chunkingu tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy providerów mowy oraz helpery dyrektyw, rejestru i walidacji skierowane do providerów |
    | `plugin-sdk/speech-core` | Współdzielone typy providerów mowy, helpery rejestru, dyrektyw i normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy providerów transkrypcji w czasie rzeczywistym, helpery rejestru i współdzielony helper sesji WebSocket |
    | `plugin-sdk/realtime-voice` | Typy providerów głosu w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy providerów generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, helpery failover, auth i rejestru |
    | `plugin-sdk/music-generation` | Typy providerów/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery failover, wyszukiwania providerów i parsowania model-ref |
    | `plugin-sdk/video-generation` | Typy providerów/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery failover, wyszukiwania providerów i parsowania model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania zdalnych/lokalnych mediów |
    | `plugin-sdk/zod` | Ponownie eksportowany `zod` dla odbiorców SDK Pluginów |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpathy pamięci">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia helperów memory-core dla helperów managera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika foundation hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta pamięci, dostęp do rejestru, lokalny provider i generyczne helpery batch/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika magazynu hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodalne helpery hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery głównego runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla helperów głównego runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias dla helperów plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery zarządzanego Markdown dla Pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada runtime Active Memory dla dostępu do managera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias dla helperów statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Dołączona powierzchnia helperów memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane subpathy helperów dołączonych">
    | Rodzina | Obecne subpathy | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpery wsparcia dołączonego Pluginu browser (`browser-support` pozostaje barrelem zgodności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia helperów/runtime dołączonego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia helperów/runtime dołączonego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia helperów dołączonego IRC |
    | Helpery specyficzne dla kanału | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfejsy zgodności/helperów dołączonych kanałów |
    | Helpery auth/specyficzne dla Pluginu | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfejsy helperów dołączonych funkcji/Pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z poniższymi
metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferencję tekstową (LLM)             |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend inferencji CLI        |
| `api.registerChannel(...)`                       | Kanał wiadomości                      |
| `api.registerSpeechProvider(...)`                | Syntezę tekst-na-mowę / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniową transkrypcję w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosu w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analizę obrazów/audio/wideo           |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                   |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                    |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                     |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrapingu        |
| `api.registerWebSearchProvider(...)`             | Web search                            |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Polecenie niestandardowe (omija LLM)          |

### Infrastruktura

| Metoda                                          | Co rejestruje                         |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook zdarzeń                          |
| `api.registerHttpRoute(params)`                 | Punkt końcowy HTTP Gateway            |
| `api.registerGatewayMethod(name, handler)`      | Metodę RPC Gateway                    |
| `api.registerCli(registrar, opts?)`             | Podpolecenie CLI                      |
| `api.registerService(service)`                  | Usługę działającą w tle               |
| `api.registerInteractiveHandler(registration)`  | Handler interaktywny                  |
| `api.registerEmbeddedExtensionFactory(factory)` | Fabrykę rozszerzeń embedded-runner PI |
| `api.registerMemoryPromptSupplement(builder)`   | Addytywną sekcję promptu powiązaną z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`   | Addytywny korpus wyszukiwania/odczytu pamięci |

Zarezerwowane główne przestrzenie nazw administracyjnych (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli Plugin próbuje przypisać
węższy zakres metodzie gateway. Dla metod należących do Pluginu preferuj prefiksy
specyficzne dla Pluginu.

Używaj `api.registerEmbeddedExtensionFactory(...)`, gdy Plugin potrzebuje natywnego dla PI
czasowania zdarzeń podczas osadzonych uruchomień OpenClaw, na przykład asynchronicznych przepisań `tool_result`,
które muszą nastąpić przed emisją końcowej wiadomości z wynikiem narzędzia.
Obecnie jest to interfejs dla dołączonych Pluginów: tylko dołączone Pluginy mogą go rejestrować i
muszą zadeklarować `contracts.embeddedExtensionFactories: ["pi"]` w
`openclaw.plugin.json`. Zachowaj zwykłe hooki Pluginów OpenClaw dla wszystkiego,
co nie wymaga tego niższego poziomu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie poleceń należące do registrara
- `descriptors`: deskryptory poleceń w czasie parsowania używane dla pomocy głównego CLI,
  routingu i leniwej rejestracji CLI Pluginów

Jeśli chcesz, aby polecenie Pluginu pozostało leniwie ładowane w zwykłej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy korzeń polecenia najwyższego poziomu udostępniany przez tego
registrara.

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

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji głównego CLI.
Ta ścieżka zgodności eager pozostaje obsługiwana, ale nie instaluje
placeholderów opartych na descriptorach dla leniwego ładowania w czasie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala Pluginowi zarządzać domyślną konfiguracją lokalnego
backendu AI CLI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem providera w referencjach modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` na
  domyślną wartość Pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend potrzebuje przepisań zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Ekskluzywne sloty

| Metoda                                     | Co rejestruje                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny może być tylko jeden naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednoliconą możliwość pamięci                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Builder sekcji promptu pamięci                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu flush pamięci                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci                                                                                                                                 |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                              |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego Pluginu |

- `registerMemoryCapability` to preferowane ekskluzywne API Pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  dzięki czemu Pluginy towarzyszące mogą korzystać z eksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu
  konkretnego Pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to starsze, zgodne wstecz ekskluzywne API Pluginu pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu Pluginowi pamięci rejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` lub niestandardowy identyfikator zdefiniowany przez Plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, rozstrzyga się względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                       |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia     |
| `api.onConversationBindingResolved(handler)` | Callback powiązania rozmowy   |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest końcowe. Gdy dowolny handler przejmie dispatch, handlery o niższym priorytecie i domyślna ścieżka dispatchu modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: używaj typowanego pola `threadId`, gdy potrzebujesz routingu przychodzących wątków/tematów. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: używaj typowanych pól routingu `replyToId` / `threadId`, zanim wrócisz do specyficznego dla kanału `metadata`.
- `gateway_start`: używaj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu uruchomienia należącego do gateway zamiast polegać na wewnętrznych hookach `gateway:startup`.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                          |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator Pluginu                                                                         |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                             |
| `api.version`            | `string?`                 | Wersja Pluginu (opcjonalnie)                                                                  |
| `api.description`        | `string?`                 | Opis Pluginu (opcjonalnie)                                                                    |
| `api.source`             | `string`                  | Ścieżka źródła Pluginu                                                                        |
| `api.rootDir`            | `string?`                 | Katalog główny Pluginu (opcjonalnie)                                                          |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka runtime w pamięci, gdy dostępna)               |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla Pluginu z `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Helpery runtime](/pl/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | Logger o ograniczonym zakresie (`debug`, `info`, `warn`, `error`)                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno startu/konfiguracji przed pełnym punktem wejścia |
| `api.resolvePath(input)` | `(string) => string`      | Rozstrzyga ścieżkę względem katalogu głównego Pluginu                                         |

## Konwencja modułów wewnętrznych

W obrębie własnego Pluginu używaj lokalnych plików barrel dla importów wewnętrznych:

```
my-plugin/
  api.ts            # Eksporty publiczne dla zewnętrznych odbiorców
  runtime-api.ts    # Eksporty runtime tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia Pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko do konfiguracji (opcjonalnie)
```

<Warning>
  Nigdy nie importuj własnego Pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Powierzchnie publiczne dołączonych Pluginów ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne pliki publicznych punktów wejścia) teraz preferują
aktywną migawkę konfiguracji runtime, gdy OpenClaw już działa. Jeśli migawka runtime
nie istnieje jeszcze, wracają do rozstrzygniętego pliku konfiguracji na dysku.

Pluginy providerów mogą także udostępniać wąski lokalny barrel kontraktu Pluginu, gdy helper
jest celowo specyficzny dla providera i jeszcze nie należy do generycznego subpath SDK.
Obecny dołączony przykład: provider Anthropic trzyma swoje helpery strumienia Claude
we własnym publicznym interfejsie `api.ts` / `contract-api.ts` zamiast promować logikę
nagłówków beta Anthropic i `service_tier` do generycznego kontraktu
`plugin-sdk/*`.

Inne obecne dołączone przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje buildery providerów,
  helpery modeli domyślnych i buildery providerów czasu rzeczywistego
- `@openclaw/openrouter-provider`: `api.ts` eksportuje builder providera oraz
  helpery onboardingu/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, promuj go do neutralnego subpath SDK,
  takiego jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na możliwości, zamiast wiązać ze sobą dwa Pluginy.
</Warning>

## Powiązane

- [Punkty wejścia](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Helpery runtime](/pl/plugins/sdk-runtime) — pełna referencja przestrzeni nazw `api.runtime`
- [Setup i konfiguracja](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testowanie](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [Migracja SDK](/pl/plugins/sdk-migration) — migracja z przestarzałych powierzchni
- [Wewnętrzne elementy Pluginów](/pl/plugins/architecture) — szczegółowa architektura i model możliwości
