---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować.
    - Chcesz mieć dokumentację wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK Overview
summary: Mapa importów, dokumentacja API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-19T01:11:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 522c2c542bc0ea4793541fda18931b963ad71f07e9c83e4f22f05184eb1ba91a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd Plugin SDK

Plugin SDK to typowany kontrakt między pluginami a rdzeniem. Ta strona jest
dokumentacją referencyjną dla **tego, co importować** i **co można rejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
  - Pierwszy plugin? Zacznij od [Pierwsze kroki](/pl/plugins/building-plugins)
  - Plugin kanału? Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
  - Plugin dostawcy? Zobacz [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importów

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka to mały, samodzielny moduł. Dzięki temu uruchamianie jest szybkie i
zapobiega to problemom z zależnościami cyklicznymi. Dla pomocników wejścia/budowania specyficznych dla kanałów
preferuj `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` zachowaj dla
szerszej powierzchni parasolowej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie polegaj na wygodnych warstwach nazwanych od dostawców, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ani
warstwach helperów oznaczonych marką kanału. Pluginy dołączone do repozytorium powinny składać ogólne
podścieżki SDK we własnych barrelach `api.ts` lub `runtime-api.ts`, a rdzeń
powinien albo używać tych lokalnych barreli pluginu, albo dodać wąski ogólny kontrakt SDK,
gdy potrzeba rzeczywiście obejmuje wiele kanałów.

Wygenerowana mapa eksportów nadal zawiera mały zestaw helperowych warstw dołączonych pluginów,
takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Te
podścieżki istnieją wyłącznie na potrzeby utrzymania i zgodności dołączonych pluginów; zostały
celowo pominięte w poniższej wspólnej tabeli i nie są zalecaną
ścieżką importu dla nowych pluginów zewnętrznych.

## Dokumentacja referencyjna podścieżek

Najczęściej używane podścieżki, pogrupowane według przeznaczenia. Wygenerowana pełna lista
ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane helperowe podścieżki dołączonych pluginów nadal pojawiają się na tej wygenerowanej liście.
Traktuj je jako szczegóły implementacyjne/powierzchnie zgodności, chyba że jakaś strona dokumentacji
wyraźnie promuje którąś z nich jako publiczną.

### Wejście pluginu

| Podścieżka                 | Kluczowe eksporty                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji, prompty allowlist i konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji/wymuszania akcji dla wielu kont oraz helpery zapasowego konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania konta i zapasowego użycia domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie helpery list działań na kontach/list kont |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z awaryjnym użyciem kontraktu dołączonego |
    | `plugin-sdk/command-gating` | Wąskie helpery bramkowania autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery trasy wejściowej i budowania obwiedni |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery zapisu i dystrybucji odpowiedzi wejściowych |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Helpery tożsamości wychodzącej/delegowania wysyłki |
    | `plugin-sdk/poll-runtime` | Wąskie helpery normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia i adapterów powiązań wątków |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor payloadu mediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery konwersacji/powiązań wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper zrzutu konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Helpery rozstrzygania polityki grup w runtime |
    | `plugin-sdk/channel-status` | Współdzielone helpery zrzutu/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium pluginów kanałów |
    | `plugin-sdk/allowlist-config-edit` | Helpery odczytu/edycji konfiguracji allowlist |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone helpery auth/guard dla bezpośrednich DM |
    | `plugin-sdk/interactive-runtime` | Helpery normalizacji/redukcji interaktywnych payloadów odpowiedzi |
    | `plugin-sdk/channel-inbound` | Barrel zgodności dla debounce wejściowego, dopasowywania wzmianek, helperów polityki wzmianek i helperów obwiedni |
    | `plugin-sdk/channel-mention-gating` | Wąskie helpery polityki wzmianek bez szerszej powierzchni runtime wejściowego |
    | `plugin-sdk/channel-location` | Helpery kontekstu i formatowania lokalizacji kanału |
    | `plugin-sdk/channel-logging` | Helpery logowania kanału dla odrzuceń wejściowych i błędów typing/ack |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie feedbacku/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, oraz typy celu sekretów |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Wybrane helpery konfiguracji lokalnych/samohostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji samohostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI i stałe watchdoga |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozstrzygania kluczy API w runtime dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu/zapisu profilu klucza API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku auth OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone interaktywne helpery logowania dla pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych auth dostawców |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory polityki replay, helpery endpointów dostawców i helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery możliwości HTTP/endpointów dostawców |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej dostawców web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/runtime dostawców web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni i współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne helpery transportu dostawcy, takie jak guarded fetch, transformacje komunikatów transportowych i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Helpery łatania konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/cache lokalnych dla procesu |
  </Accordion>

  <Accordion title="Podścieżki auth i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory wiadomości poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozstrzygania zatwierdzającego i auth akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Natywne helpery profilu/filtra zatwierdzeń wykonania |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozstrzygania Gateway dla zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnych adapterów zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery runtime obsługi zatwierdzeń; preferuj węższe warstwy adapter/gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Natywne helpery celu zatwierdzeń i powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery payloadów odpowiedzi zatwierdzeń exec/pluginów |
    | `plugin-sdk/command-auth-native` | Natywne helpery auth poleceń i natywnych celów sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-surface` | Helpery normalizacji treści poleceń i powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktów sekretów dla powierzchni sekretów kanałów/pluginów |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef do parsowania kontraktów sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery allowlist hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery pinned-dispatcher bez szerokiej powierzchni runtime infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Helpery pinned-dispatcher, fetch chronionego przed SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania danych wejściowych sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/docelowych elementów Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru body/timeoutu żądań |
  </Accordion>

  <Accordion title="Podścieżki runtime i przechowywania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery runtime/logowania/kopii zapasowych/instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime, loggera, timeoutu, retry i backoff |
    | `plugin-sdk/channel-runtime-context` | Ogólne helpery rejestracji i wyszukiwania kontekstu runtime kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/HTTP/interaktywne dla pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery pipeline’ów Webhooków/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/powiązań runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania i wersji |
    | `plugin-sdk/gateway-runtime` | Helpery klienta Gateway i łatania statusu kanałów |
    | `plugin-sdk/config-runtime` | Helpery ładowania/zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram i sprawdzanie duplikatów/konfliktów, nawet gdy powierzchnia kontraktu dołączonego Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzeń exec/pluginów, konstruktory możliwości zatwierdzeń, helpery auth/profili, helpery natywnego routingu/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery runtime wejścia/odpowiedzi, chunking, dispatch, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatch/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone helpery historii odpowiedzi z krótkiego okna, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery chunkingu tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżki magazynu sesji i `updated-at` |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery routingu/klucza sesji/powiązań kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowania statusu kanałów/kont, domyślne ustawienia stanu runtime i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery rozstrzygania celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie URL-i w postaci ciągów znaków z danych wejściowych podobnych do fetch/request |
    | `plugin-sdk/run-command` | Uruchamianie poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzi |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Helpery loggera podsystemów i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Reentrantne helpery blokad plików |
    | `plugin-sdk/persistent-dedupe` | Helpery pamięci podręcznej deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Helpery ACP runtime/sesji i dispatchu odpowiedzi |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozstrzyganie powiązań ACP tylko do odczytu bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów boolowskich |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozstrzygania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanałów pasywnych, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia `/models` i dostawców |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Natywne helpery rejestru/budowania/serializacji poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych pluginów dla niskopoziomowych harnessów agentów: typy harnessów, helpery sterowania/przerywania aktywnego uruchomienia, helpery mostka narzędzi OpenClaw i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointów Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpery zdarzeń systemowych/Heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch, proxy i pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch świadomy dispatchera bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Odczyt body odpowiedzi z ograniczeniem bez szerokiej powierzchni runtime mediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania konwersacji bez routingu skonfigurowanych powiązań lub magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Helpery odczytu magazynu sesji bez szerokich importów zapisu/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozstrzyganie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery wymuszania i normalizacji rekordów/prymitywnych ciągów znaków bez importów markdown/logowania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji retry i wykonawcy retry |
    | `plugin-sdk/agent-runtime` | Helpery katalogów/tożsamości/obszarów roboczych agentów |
    | `plugin-sdk/directory-runtime` | Zapytania/deduplikacja katalogów oparte na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania/transformacji/przechowywania mediów oraz konstruktory payloadów mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery failover dla generowania mediów, wybór kandydatów i komunikaty o brakujących modelach |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty helperów obrazów/audio skierowane do dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel Markdown, helpery redakcji, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper chunkingu tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz skierowane do dostawców helpery dyrektyw, rejestru i walidacji |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, helpery rejestru, dyrektyw i normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, helpery failover, auth i rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery failover, wyszukiwania dostawców i parsowania model-ref |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery failover, wyszukiwania dostawców i parsowania model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania mediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Reeksport `zod` dla użytkowników Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Podścieżki Memory">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia helperów dołączonego memory-core dla helperów managera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksowania/wyszukiwania Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika foundation hosta Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta Memory, dostęp do rejestru, lokalny dostawca oraz ogólne helpery batch/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika storage hosta Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Wielomodalne helpery hosta Memory |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta Memory |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta Memory |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta Memory |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery runtime CLI hosta Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery głównego runtime hosta Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta Memory |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla helperów głównego runtime hosta Memory |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla helperów dziennika zdarzeń hosta Memory |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias dla helperów plików/runtime hosta Memory |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery managed-markdown dla pluginów powiązanych z memory |
    | `plugin-sdk/memory-host-search` | Fasada runtime Active Memory dla dostępu do managera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias dla helperów statusu hosta Memory |
    | `plugin-sdk/memory-lancedb` | Powierzchnia helperów dołączonego memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki helperów dołączonych">
    | Rodzina | Bieżące podścieżki | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpery wsparcia dołączonego pluginu browser (`browser-support` pozostaje barrel kompatybilności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia helperów/runtime dołączonego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia helperów/runtime dołączonego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia helperów dołączonego IRC |
    | Helpery specyficzne dla kanałów | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Warstwy zgodności/helperów dołączonych kanałów |
    | Helpery specyficzne dla auth/pluginów | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Warstwy helperów dołączonych funkcji/pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z następującymi
metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                              |
| ------------------------------------------------ | ------------------------------------------ |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)                |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI           |
| `api.registerChannel(...)`                       | Kanał komunikacyjny                        |
| `api.registerSpeechProvider(...)`                | Synteza text-to-speech / STT               |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazów/audio/wideo                |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                        |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                         |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                          |
| `api.registerWebFetchProvider(...)`              | Dostawca web fetch / scrapowania           |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                       |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)           |

### Infrastruktura

| Metoda                                         | Co rejestruje                            |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń                             |
| `api.registerHttpRoute(params)`                | Punkt końcowy HTTP Gateway               |
| `api.registerGatewayMethod(name, handler)`     | Metodę RPC Gateway                       |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                         |
| `api.registerService(service)`                 | Usługę działającą w tle                  |
| `api.registerInteractiveHandler(registration)` | Interaktywny handler                     |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywną sekcję promptu sąsiadującą z memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu memory |

Zarezerwowane przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
węższy zakres metod Gateway. Dla
metod należących do pluginu preferuj prefiksy specyficzne dla pluginu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` przyjmuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne główne polecenia należące do rejestratora
- `descriptors`: deskryptory poleceń używane podczas parsowania dla głównej pomocy CLI,
  routingu i leniwej rejestracji CLI pluginów

Jeśli chcesz, aby polecenie pluginu pozostało leniwie ładowane w normalnej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy główny korzeń poleceń udostępniany przez
ten rejestrator.

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
Ta zgodna wstecz ścieżka eager nadal jest wspierana, ale nie instaluje
placeholderów opartych na deskryptorach do leniwego ładowania na etapie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi zarządzać domyślną konfiguracją lokalnego
backendu AI CLI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` z
  domyślną konfiguracją pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga przepisania zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Gniazda wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny może być tylko jeden naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednoliconą możliwość memory                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu memory                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania memory                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memory                                                                                                                                  |

### Adaptery embeddingów memory

| Metoda                                         | Co rejestruje                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów memory dla aktywnego pluginu |

- `registerMemoryCapability` jest preferowanym wyłącznym API pluginów memory.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły korzystać z eksportowanych artefaktów memory przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu
  konkretnego pluginu memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to starsze, zgodne wstecz, wyłączne API pluginów memory.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi memory rejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` lub
  niestandardowy identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozstrzygana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                         |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia       |
| `api.onConversationBindingResolved(handler)` | Callback rozstrzygnięcia powiązania konwersacji |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest rozstrzygające. Gdy tylko którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest rozstrzygające. Gdy tylko którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest rozstrzygające. Gdy tylko którykolwiek handler przejmie dispatch, handlery o niższym priorytecie i domyślna ścieżka dispatchu modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest rozstrzygające. Gdy tylko którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                           |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                          |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                              |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalna)                                                                    |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalny)                                                                      |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                       |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalny)                                                            |
| `api.config`             | `OpenClawConfig`          | Bieżący zrzut konfiguracji (aktywny zrzut runtime w pamięci, gdy jest dostępny)               |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Helpery runtime](/pl/plugins/sdk-runtime)                                                        |
| `api.logger`             | `PluginLogger`            | Logger o zawężonym zakresie (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym entry |
| `api.resolvePath(input)` | `(string) => string`      | Rozstrzyga ścieżkę względem katalogu głównego pluginu                                          |

## Konwencja modułów wewnętrznych

Wewnątrz pluginu używaj lokalnych plików barrel do importów wewnętrznych:

````
my-plugin/
  api.ts            # Publiczne eksporty dla zewnętrznych konsumentów
  runtime-api.ts    # Eksporty runtime tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko dla konfiguracji (opcjonalnie)
````

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  w kodzie produkcyjnym. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie dołączonych pluginów ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują teraz
aktywny zrzut konfiguracji runtime, gdy OpenClaw jest już uruchomiony. Jeśli zrzut runtime
nie istnieje jeszcze, wracają do rozstrzygniętego pliku konfiguracji na dysku.

Pluginy dostawców mogą także udostępniać wąski lokalny barrel kontraktowy pluginu, gdy
helper jest celowo specyficzny dla dostawcy i nie należy jeszcze do ogólnej podścieżki SDK.
Bieżący dołączony przykład: dostawca Anthropic trzyma swoje helpery strumieni Claude
we własnej publicznej warstwie `api.ts` / `contract-api.ts` zamiast
przenosić logikę nagłówków beta Anthropic i `service_tier` do ogólnego
kontraktu `plugin-sdk/*`.

Inne bieżące dołączone przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje konstruktory dostawców,
  helpery modeli domyślnych i konstruktory dostawców realtime
- `@openclaw/openrouter-provider`: `api.ts` eksportuje konstruktor dostawcy oraz
  helpery onboardingu/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien również unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na możliwości, zamiast wiązać ze sobą dwa pluginy.
</Warning>

## Powiązane

- [Punkty wejścia](/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Helpery runtime](/plugins/sdk-runtime) — pełna dokumentacja przestrzeni nazw `api.runtime`
- [Konfiguracja i config](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testowanie](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [Migracja SDK](/pl/plugins/sdk-migration) — migracja z przestarzałych powierzchni
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowa architektura i model możliwości
