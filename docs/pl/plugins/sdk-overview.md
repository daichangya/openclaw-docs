---
read_when:
    - Musisz wiedzieć, z której ścieżki podrzędnej SDK importować
    - Chcesz mieć dokumentację wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK Overview
summary: Mapa importów, dokumentacja API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-08T02:18:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a41bd82d165dfbb7fbd6e4528cf322e9133a51efe55fa8518a7a0a626d9d30
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd Plugin SDK

Plugin SDK to typowany kontrakt między pluginami a rdzeniem. Ta strona jest
dokumentacją tego, **co importować** i **co można rejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
  - Pierwszy plugin? Zacznij od [Pierwsze kroki](/pl/plugins/building-plugins)
  - Plugin kanału? Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
  - Plugin dostawcy? Zobacz [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej ścieżki podrzędnej:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda ścieżka podrzędna to mały, samowystarczalny moduł. Dzięki temu uruchamianie pozostaje szybkie
i zapobiega to problemom z zależnościami cyklicznymi. W przypadku pomocników wejścia/budowania specyficznych dla kanału
preferuj `openclaw/plugin-sdk/channel-core`; zachowaj `openclaw/plugin-sdk/core` dla
szerszej powierzchni parasolowej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie polegaj na pomocniczych ścieżkach wygodnych nazwanych od dostawców, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ani
pomocniczych ścieżkach markowanych kanałami. Wbudowane pluginy powinny składać ogólne
ścieżki podrzędne SDK we własnych barrelach `api.ts` lub `runtime-api.ts`, a rdzeń
powinien używać albo tych lokalnych barrelów pluginu, albo dodać wąski ogólny kontrakt SDK, gdy potrzeba jest rzeczywiście międzykanałowa.

Wygenerowana mapa eksportów nadal zawiera mały zestaw pomocniczych ścieżek dla wbudowanych pluginów,
takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Te
ścieżki podrzędne istnieją wyłącznie dla utrzymania i zgodności wbudowanych pluginów; są
celowo pominięte w poniższej wspólnej tabeli i nie są zalecaną
ścieżką importu dla nowych zewnętrznych pluginów.

## Dokumentacja ścieżek podrzędnych

Najczęściej używane ścieżki podrzędne, pogrupowane według przeznaczenia. Wygenerowana pełna lista
ponad 200 ścieżek podrzędnych znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane pomocnicze ścieżki dla wbudowanych pluginów nadal pojawiają się w tej wygenerowanej liście.
Traktuj je jako powierzchnie szczegółów implementacyjnych/zgodności, chyba że strona dokumentacji
jawnie promuje którąś z nich jako publiczną.

### Wejście pluginu

| Subpath                     | Kluczowe eksporty                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Ścieżki podrzędne kanałów">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji, prompty allowlist, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji/wrót akcji dla wielu kont, helpery fallbacku konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania konta + fallbacku do domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie helpery listy kont/akcji na koncie |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem kontraktu wbudowanego |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery routingu przychodzącego + budowania kopert |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery rejestrowania i dispatchu danych przychodzących |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Helpery tożsamości wychodzącej/delegacji wysyłki |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia i adapterów powiązań wątków |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku mediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery powiązań rozmowy/wątku, pairingu i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Helpery rozstrzygania polityki grup w runtime |
    | `plugin-sdk/channel-status` | Współdzielone helpery migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisów konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preambuły pluginów kanałów |
    | `plugin-sdk/allowlist-config-edit` | Helpery edycji/odczytu konfiguracji allowlist |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone helpery uwierzytelniania/ochrony bezpośrednich DM |
    | `plugin-sdk/interactive-runtime` | Helpery normalizacji/redukcji ładunków odpowiedzi interaktywnych |
    | `plugin-sdk/channel-inbound` | Helpery debounce dla wejścia, dopasowywania wzmianek, polityki wzmianek i helpery kopert |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Powiązanie feedbacku/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, oraz typy celu sekretu |
  </Accordion>

  <Accordion title="Ścieżki podrzędne dostawców">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnych/samodzielnie hostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Skoncentrowane helpery konfiguracji samodzielnie hostowanego dostawcy zgodnego z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdoga |
    | `plugin-sdk/provider-auth-runtime` | Helpery runtime rozstrzygania klucza API dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery wdrażania/zapisu profilu klucza API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone interaktywne helpery logowania dla pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawców |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory polityki replay, helpery endpointów dostawców oraz helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery HTTP/zdolności endpointów dostawców |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej dostawców web-fetch |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz ustawiające/pobierające poświadczenia o ograniczonym zakresie |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/runtime dostawców web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpery łatek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Pomocniki singletonów/map/pamięci podręcznej lokalnych dla procesu |
  </Accordion>

  <Accordion title="Ścieżki podrzędne uwierzytelniania i bezpieczeństwa">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, helpery autoryzacji nadawcy |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozstrzygania zatwierdzającego i uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Natywne helpery profilu/filtru zatwierdzeń exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery zdolności/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozstrzygania gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery runtime obsługi zatwierdzeń; preferuj węższe ścieżki adapter/gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Natywne helpery celu zatwierdzeń + powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery ładunków odpowiedzi dla zatwierdzeń exec/pluginów |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń + natywne helpery celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-surface` | Helpery normalizacji treści poleceń i powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktów sekretów dla powierzchni sekretów kanałów/pluginów |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef dla parsowania kontraktów sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznej i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery allowlist hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-runtime` | Helpery pinned-dispatcher, fetch chronionego SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania wejścia sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery requestów/celów webhooków |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru body/timeoutu requestów |
  </Accordion>

  <Accordion title="Ścieżki podrzędne runtime i storage">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery runtime/logowania/kopii zapasowych/instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime, loggera, timeoutu, retry i backoff |
    | `plugin-sdk/channel-runtime-context` | Ogólne helpery rejestracji i wyszukiwania kontekstu runtime kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/http/interaktywności pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery pipeline webhooków/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/powiązań runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery exec procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania i wersji |
    | `plugin-sdk/gateway-runtime` | Helpery klienta gateway i łatek statusu kanałów |
    | `plugin-sdk/config-runtime` | Helpery ładowania/zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji nazw/opisów poleceń Telegram i kontroli duplikatów/konfliktów, nawet gdy powierzchnia kontraktu wbudowanego Telegrama jest niedostępna |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzeń exec/pluginów, konstruktory zdolności zatwierdzeń, helpery auth/profili, natywne helpery routingu/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery runtime wejścia/odpowiedzi, chunkingu, dispatchu, heartbeat i planisty odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatchu/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone helpery historii odpowiedzi dla krótkiego okna, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery chunkingu tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżek magazynu sesji + updated-at |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery routingu/klucza sesji/powiązania kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowań statusu kanałów/kont, domyślne stany runtime i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery resolvera celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnia ciągi URL z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Uruchamianie poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Typowe czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-send` | Wyodrębnia kanoniczne pola celu wysyłki z argumentów narzędzi |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowych pobrań |
    | `plugin-sdk/logging-core` | Logger subsystemu i helpery redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Rekurencyjne helpery blokowania plików |
    | `plugin-sdk/persistent-dedupe` | Helpery pamięci podręcznej deduplikacji na dysku |
    | `plugin-sdk/acp-runtime` | Helpery runtime/sesji ACP i dispatchu odpowiedzi |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Elastyczny czytnik parametrów logicznych |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozstrzygania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzenia i tokenów pairingu |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanałów pasywnych, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia `/models` / dostawców |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Natywne helpery rejestru/budowania/serializacji poleceń |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointów Z.AI |
    | `plugin-sdk/infra-runtime` | Helpery zdarzeń systemowych/heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy i helpery pinned lookup |
    | `plugin-sdk/host-runtime` | Helpery normalizacji hostname i hosta SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji retry i wykonawcy retry |
    | `plugin-sdk/agent-runtime` | Helpery katalogu/tożsamości/obszaru roboczego agenta |
    | `plugin-sdk/directory-runtime` | Zapytania o katalog oparte na konfiguracji/deduplikacja |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Ścieżki podrzędne capabilities i testów">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania/przekształcania/przechowywania mediów oraz konstruktory ładunków mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery failover generowania mediów, wybór kandydatów i komunikaty o brakujących modelach |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty helperów obrazu/audio dla dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel Markdown, helpery redakcji, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper chunkingu tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty helperów dyrektyw, rejestru i walidacji dla dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywy i helpery normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji realtime i helpery rejestru |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu realtime i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, failover, uwierzytelnianie i helpery rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/requestów/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery failover, wyszukiwanie dostawców i parsowanie model-ref |
    | `plugin-sdk/video-generation` | Typy dostawców/requestów/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery failover, wyszukiwanie dostawców i parsowanie model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr celów webhooków i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek webhooków |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania zdalnych/lokalnych mediów |
    | `plugin-sdk/zod` | Reeksportowane `zod` dla użytkowników plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Ścieżki podrzędne pamięci">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia helperów wbudowanego memory-core dla managera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika bazowego hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Eksporty silnika embeddingów hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika storage hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalnego hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery głównego runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias helperów głównego runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias helperów plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery zarządzanego Markdown dla pluginów sąsiadujących z pamięcią |
    | `plugin-sdk/memory-host-search` | Aktywna fasada runtime pamięci dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias helperów statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Powierzchnia helperów wbudowanego memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane ścieżki podrzędne wbudowanych helperów">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpery wsparcia wbudowanego pluginu przeglądarki (`browser-support` pozostaje barrelem zgodności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia helperów/runtime wbudowanego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia helperów/runtime wbudowanego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia helperów wbudowanego IRC |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Wbudowane ścieżki zgodności/helperów kanałów |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Wbudowane ścieżki helperów funkcji/pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z następującymi
metodami:

### Rejestracja capabilities

| Method                                           | What it registers                |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)      |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI |
| `api.registerChannel(...)`                       | Kanał wiadomości                 |
| `api.registerSpeechProvider(...)`                | Synteza tekst-na-mowę / STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja realtime |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosu realtime |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazu/audio/wideo       |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów              |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki               |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                |
| `api.registerWebFetchProvider(...)`              | Dostawca web fetch / scrape      |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci             |

### Narzędzia i polecenia

| Method                          | What it registers                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Polecenie niestandardowe (pomija LLM)         |

### Infrastruktura

| Method                                         | What it registers                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń                            |
| `api.registerHttpRoute(params)`                | Endpoint HTTP gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC gateway                      |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                        |
| `api.registerService(service)`                 | Usługa działająca w tle                 |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                    |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywna sekcja promptu sąsiadująca z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

Zarezerwowane przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
węższy zakres metody gateway. Dla metod należących do pluginów preferuj prefiksy specyficzne dla pluginu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie poleceń należące do rejestratora
- `descriptors`: deskryptory poleceń na etapie parsowania używane do pomocy głównego CLI,
  routingu i leniwej rejestracji CLI pluginów

Jeśli chcesz, aby polecenie pluginu pozostało ładowane leniwie w zwykłej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy korzeń poleceń najwyższego poziomu udostępniany przez ten
rejestrator.

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
        description: "Zarządzaj kontami Matrix, weryfikacją, urządzeniami i stanem profilu",
        hasSubcommands: true,
      },
    ],
  },
);
```

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji głównego CLI.
Ta ścieżka zgodności eager nadal jest obsługiwana, ale nie instaluje
placeholderów opartych na deskryptorach dla leniwego ładowania na etapie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi posiadać domyślną konfigurację lokalnego
backendu CLI AI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` z
  wartością domyślną pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend potrzebuje przeróbek zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Wyłączne sloty

| Method                                     | What it registers                     |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny naraz jest jeden) |
| `api.registerMemoryCapability(capability)` | Ujednolicona capability pamięci       |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci    |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci    |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci               |

### Adaptery embeddingów pamięci

| Method                                         | What it registers                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego pluginu |

- `registerMemoryCapability` to preferowane wyłączne API pluginów pamięci.
- `registerMemoryCapability` może też udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły używać eksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu
  konkretnego pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodne wstecz, wyłączne API starszych pluginów pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci zarejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` lub własny identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozstrzygana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Method                                       | What it does                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia     |
| `api.onConversationBindingResolved(handler)` | Callback rozstrzygnięcia powiązania rozmowy |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest ostateczne. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest ostateczne. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest ostateczne. Gdy dowolny handler przejmie dispatch, handlery o niższym priorytecie i domyślna ścieżka dispatchu modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest ostateczne. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                       |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                           |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalnie)                                                                |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalnie)                                                                  |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                    |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalnie)                                                        |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka runtime w pamięci, gdy jest dostępna)        |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Helpery runtime](/pl/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger o ograniczonym zakresie (`debug`, `info`, `warn`, `error`)                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | Rozstrzyga ścieżkę względem katalogu głównego pluginu                                       |

## Konwencja modułów wewnętrznych

Wewnątrz pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Publiczne eksporty dla odbiorców zewnętrznych
  runtime-api.ts    # Eksporty runtime tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko do konfiguracji (opcjonalnie)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie wbudowanych pluginów ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) teraz preferują
aktywną migawkę konfiguracji runtime, gdy OpenClaw już działa. Jeśli migawka runtime
jeszcze nie istnieje, wracają do rozstrzygniętego pliku konfiguracji na dysku.

Pluginy dostawców mogą także udostępniać wąski lokalny barrel kontraktu pluginu, gdy
helper jest celowo specyficzny dla dostawcy i jeszcze nie należy do ogólnej ścieżki podrzędnej SDK.
Aktualny wbudowany przykład: dostawca Anthropic przechowuje helpery strumienia Claude
we własnej publicznej ścieżce `api.ts` / `contract-api.ts` zamiast promować logikę
nagłówka beta Anthropic i `service_tier` do ogólnego kontraktu
`plugin-sdk/*`.

Inne aktualne wbudowane przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje konstruktory dostawców,
  helpery modeli domyślnych i konstruktory dostawców realtime
- `@openclaw/openrouter-provider`: `api.ts` eksportuje konstruktor dostawcy oraz
  helpery onboardingu/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien też unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnej ścieżki podrzędnej SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na capability, zamiast sprzęgać dwa pluginy ze sobą.
</Warning>

## Powiązane

- [Punkty wejścia](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Helpery runtime](/pl/plugins/sdk-runtime) — pełna dokumentacja przestrzeni nazw `api.runtime`
- [Konfiguracja i config](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testowanie](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [Migracja SDK](/pl/plugins/sdk-migration) — migracja ze zdeprecjonowanych powierzchni
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowa architektura i model capabilities
