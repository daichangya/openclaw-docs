---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować.
    - Chcesz referencję wszystkich metod rejestracji w `OpenClawPluginApi`.
    - Szukasz konkretnego eksportu SDK.
sidebarTitle: SDK Overview
summary: Mapa importów, referencja API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-11T02:46:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bfeb5896f68e3e4ee8cf434d43a019e0d1fe5af57f5bf7a5172847c476def0c
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd Plugin SDK

Plugin SDK to typowany kontrakt między pluginami a podstawowym systemem. Ta strona jest
referencją dla **co importować** i **co można zarejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
  - Pierwszy plugin? Zacznij od [Getting Started](/pl/plugins/building-plugins)
  - Plugin kanału? Zobacz [Channel Plugins](/pl/plugins/sdk-channel-plugins)
  - Plugin dostawcy? Zobacz [Provider Plugins](/pl/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samowystarczalnym modułem. Dzięki temu uruchamianie jest szybkie
i zapobiega to problemom z zależnościami cyklicznymi. Dla pomocników wejścia/budowania specyficznych dla kanałów
preferuj `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` zachowaj dla
szerszej powierzchni zbiorczej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie polegaj na wygodnych warstwach nazwanych od dostawców, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ani
warstwach helperów oznaczonych marką kanału. Dołączone pluginy powinny składać ogólne
podścieżki SDK we własnych barrelach `api.ts` lub `runtime-api.ts`, a podstawowy system
powinien używać albo tych lokalnych barreli pluginu, albo dodać wąski ogólny kontrakt SDK,
gdy potrzeba faktycznie dotyczy wielu kanałów.

Wygenerowana mapa eksportów nadal zawiera mały zestaw pomocniczych warstw
dołączonych pluginów, takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Te
podścieżki istnieją wyłącznie dla utrzymania kompatybilności i konserwacji dołączonych pluginów;
celowo pominięto je w poniższej wspólnej tabeli i nie są zalecaną
ścieżką importu dla nowych zewnętrznych pluginów.

## Referencja podścieżek

Najczęściej używane podścieżki pogrupowane według przeznaczenia. Wygenerowana pełna lista
ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane podścieżki helperów dołączonych pluginów nadal pojawiają się na tej wygenerowanej liście.
Traktuj je jako szczegóły implementacyjne / powierzchnie zgodności, chyba że strona dokumentacji
wyraźnie promuje którąś z nich jako publiczną.

### Wejście pluginu

| Podścieżka                 | Kluczowe eksporty                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji, komunikaty listy dozwolonych modeli, konstruktory stanu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji / bram działania dla wielu kont oraz helpery fallback dla konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Wyszukiwanie konta + helpery fallback do wartości domyślnej |
    | `plugin-sdk/account-helpers` | Wąskie helpery list działań / działań na kontach |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji / walidacji niestandardowych poleceń Telegram z fallbackiem do dołączonego kontraktu |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery tras przychodzących + budowania kopert |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery zapisu i wysyłki odpowiedzi przychodzących |
    | `plugin-sdk/messaging-targets` | Helpery parsowania / dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Helpery tożsamości wychodzącej / delegatów wysyłania |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia i adapterów powiązań wątków |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku mediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery rozmowy / powiązań wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper migawki konfiguracji środowiska wykonawczego |
    | `plugin-sdk/runtime-group-policy` | Helpery rozwiązywania zasad grup środowiska wykonawczego |
    | `plugin-sdk/channel-status` | Współdzielone helpery migawki / podsumowania stanu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium pluginów kanałów |
    | `plugin-sdk/allowlist-config-edit` | Helpery odczytu / edycji konfiguracji listy dozwolonych modeli |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone helpery uwierzytelniania / ochrony direct-DM |
    | `plugin-sdk/interactive-runtime` | Helpery normalizacji / redukcji interaktywnych ładunków odpowiedzi |
    | `plugin-sdk/channel-inbound` | Helpery debounce wejścia, dopasowania wzmianek, zasad wzmianek i helpery kopert |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpery parsowania / dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie opinii / reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, oraz typy celów sekretów |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane helpery konfiguracji dostawców lokalnych / samohostowanych |
    | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji samohostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania kluczy API środowiska wykonawczego dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery wdrażania / zapisu profilu klucza API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone helpery logowania interaktywnego dla pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawców |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad odtwarzania, helpery endpointów dostawców oraz helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery HTTP / możliwości endpointów dostawców |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji / wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji / pamięci podręcznej dostawców web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji / poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji / poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji / pamięci podręcznej / środowiska wykonawczego dostawców web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów streamingu oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpery łatania konfiguracji wdrażania |
    | `plugin-sdk/global-singleton` | Helpery lokalnych dla procesu singletonów / map / pamięci podręcznej |
  </Accordion>

  <Accordion title="Podścieżki uwierzytelniania i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozwiązywania zatwierdzających i uwierzytelniania działań w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Helpery profili/filtrów zatwierdzania dla natywnego wykonywania |
    | `plugin-sdk/approval-delivery-runtime` | Adaptery możliwości/dostarczania natywnego zatwierdzania |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozwiązywania bramy zatwierdzania |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnych adapterów zatwierdzania dla gorących punktów wejścia kanału |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery środowiska wykonawczego obsługi zatwierdzania; preferuj węższe warstwy adaptera/bramy, jeśli są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Helpery celu natywnego zatwierdzania + powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery ładunku odpowiedzi zatwierdzania wykonywania/pluginu |
    | `plugin-sdk/command-auth-native` | Helpery natywnego uwierzytelniania poleceń + natywnego celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-surface` | Helpery normalizacji treści polecenia i powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktu sekretów dla powierzchni sekretów kanału/pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef dla parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, ograniczania DM, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery listy dozwolonych hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-runtime` | Helpery przypiętego dispatcher, fetch chronionego przed SSRF oraz polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania wejść sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów webhooków |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru treści / limitu czasu żądań |
  </Accordion>

  <Accordion title="Podścieżki środowiska wykonawczego i pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery środowiska wykonawczego / logowania / kopii zapasowych / instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery środowiska wykonawczego, loggera, limitów czasu, ponawiania i backoff |
    | `plugin-sdk/channel-runtime-context` | Ogólne helpery rejestracji i wyszukiwania kontekstu środowiska wykonawczego kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń / hooków / HTTP / interakcji pluginu |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery potoku webhooków / hooków wewnętrznych |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu / powiązań środowiska wykonawczego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania i wersji |
    | `plugin-sdk/gateway-runtime` | Helpery klienta bramy i łatania stanu kanału |
    | `plugin-sdk/config-runtime` | Helpery ładowania / zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji nazw/opisów poleceń Telegram oraz sprawdzania duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram nie jest dostępna |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzania wykonywania/pluginu, konstruktory możliwości zatwierdzania, helpery uwierzytelniania/profili, helpery natywnego routingu/środowiska wykonawczego |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery środowiska wykonawczego wejścia/odpowiedzi, dzielenia na fragmenty, wysyłki, heartbeat, planera odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery wysyłki / finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone helpery historii odpowiedzi dla krótkiego okna, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery dzielenia tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżki magazynu sesji + pola updated-at |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery tras / kluczy sesji / powiązań kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowania stanu kanału/konta, domyślne stany środowiska wykonawczego i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery rozwiązywania celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębniaj tekstowe adresy URL z danych wejściowych typu fetch/request |
    | `plugin-sdk/run-command` | Uruchamianie poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnia znormalizowane ładunki z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnia kanoniczne pola celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Helpery loggera podsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Helpery re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Helpery pamięci podręcznej deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Helpery środowiska wykonawczego/sesji ACP i wysyłki odpowiedzi |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska wykonawczego agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów logicznych |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozwiązywania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrap urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanałów pasywnych, stanu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery budowania / serializacji natywnego rejestru poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych pluginów dla niskopoziomowych uprzęży agentów: typy uprzęży, helpery sterowania/przerywania aktywnego uruchomienia, helpery mostu narzędzi OpenClaw i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointów Z.AI |
    | `plugin-sdk/infra-runtime` | Helpery zdarzeń systemowych/heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag diagnostycznych i zdarzeń |
    | `plugin-sdk/error-runtime` | Helpery grafu błędów, formatowania, współdzielonej klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy i helpery przypiętego wyszukiwania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazwy hosta i hosta SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji ponawiania i uruchamiania ponowień |
    | `plugin-sdk/agent-runtime` | Helpery katalogu / tożsamości / obszaru roboczego agenta |
    | `plugin-sdk/directory-runtime` | Zapytania do katalogów oparte na konfiguracji / deduplikacja |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania / transformacji / przechowywania mediów oraz konstruktory ładunków mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery failover generowania mediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców media-understanding oraz eksporty helperów obrazów/audio skierowane do dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/dzielenia/tabel Markdown, helpery redakcji, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty helperów dyrektyw, rejestru i walidacji skierowane do dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, helpery rejestru, dyrektyw i normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, helpery failover, uwierzytelniania i rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców / żądań / wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery failover, wyszukiwania dostawców i parsowania referencji modeli |
    | `plugin-sdk/video-generation` | Typy dostawców / żądań / wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery failover, wyszukiwania dostawców i parsowania referencji modeli |
    | `plugin-sdk/webhook-targets` | Rejestr celów webhooków i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek webhooków |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania mediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Reeksport `zod` dla użytkowników Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia helperów memory-core dla helperów manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska wykonawczego indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika foundation hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Eksporty silnika embeddingów hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika storage hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalnego hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery stanu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery środowiska wykonawczego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery podstawowego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików / środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny wobec dostawcy alias helperów podstawowego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny wobec dostawcy alias helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny wobec dostawcy alias helperów plików / środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery zarządzanego Markdown dla pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada aktywnego środowiska wykonawczego pamięci dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny wobec dostawcy alias helperów stanu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Dołączona powierzchnia helperów memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki helperów dołączonych">
    | Rodzina | Obecne podścieżki | Zamierzone zastosowanie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpery wsparcia dołączonego pluginu przeglądarki (`browser-support` pozostaje barrelem zgodności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia helperów / środowiska wykonawczego dołączonego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia helperów / środowiska wykonawczego dołączonego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia helperów dołączonego IRC |
    | Helpery specyficzne dla kanałów | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Warstwy zgodności / helperów dołączonych kanałów |
    | Helpery specyficzne dla uwierzytelniania / pluginów | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Warstwy helperów dołączonych funkcji / pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Wywołanie zwrotne `register(api)` otrzymuje obiekt `OpenClawPluginApi` z tymi
metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)           |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy wykonawca agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI      |
| `api.registerChannel(...)`                       | Kanał wiadomości                      |
| `api.registerSpeechProvider(...)`                | Synteza text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazu/audio/wideo            |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                   |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                    |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                     |
| `api.registerWebFetchProvider(...)`              | Dostawca web fetch / scrape           |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                  |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)           |

### Infrastruktura

| Metoda                                         | Co rejestruje                          |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzenia                         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP bramy                    |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC bramy                       |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                       |
| `api.registerService(service)`                 | Usługa działająca w tle                |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                   |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywna sekcja promptu powiązana z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

Zarezerwowane podstawowe przestrzenie nazw administratora (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin spróbuje przypisać
węższy zakres metodzie bramy. Dla metod zarządzanych przez plugin preferuj prefiksy
specyficzne dla pluginu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie poleceń należące do registrara
- `descriptors`: deskryptory poleceń używane na etapie parsowania dla głównej pomocy CLI,
  routingu i leniwej rejestracji CLI pluginu

Jeśli chcesz, aby polecenie pluginu pozostawało ładowane leniwie w normalnej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy korzeń polecenia najwyższego poziomu udostępniany przez ten registrar.

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
Ta zgodna wstecz ścieżka eager nadal jest obsługiwana, ale nie instaluje
placeholderów opartych na descriptorach dla leniwego ładowania na etapie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi zarządzać domyślną konfiguracją lokalnego
backendu CLI AI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w referencjach modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` z domyślną konfiguracją
  pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga przepisania zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny może być tylko jeden naraz). Wywołanie zwrotne `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dopasować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednolicona możliwość pamięci                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adapter środowiska wykonawczego pamięci                                                                                                                    |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego pluginu |

- `registerMemoryCapability` to preferowane API wyłącznego pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły korzystać z eksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu
  konkretnego pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to starsze, zgodne wstecz API wyłącznych pluginów pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci rejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` lub
  niestandardowy identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozwiązywana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                     |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia   |
| `api.onConversationBindingResolved(handler)` | Callback rozwiązania powiązania rozmowy |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest końcowe. Gdy dowolny handler przejmie wysyłkę, handlery o niższym priorytecie i domyślna ścieżka wysyłki modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Pole                    | Typ                       | Opis                                                                                       |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                | `string`                  | Identyfikator pluginu                                                                      |
| `api.name`              | `string`                  | Nazwa wyświetlana                                                                          |
| `api.version`           | `string?`                 | Wersja pluginu (opcjonalnie)                                                               |
| `api.description`       | `string?`                 | Opis pluginu (opcjonalnie)                                                                 |
| `api.source`            | `string`                  | Ścieżka źródłowa pluginu                                                                   |
| `api.rootDir`           | `string?`                 | Katalog główny pluginu (opcjonalnie)                                                       |
| `api.config`            | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywną migawkę środowiska wykonawczego w pamięci, jeśli jest dostępna) |
| `api.pluginConfig`      | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                       |
| `api.runtime`           | `PluginRuntime`           | [Helpery środowiska wykonawczego](/pl/plugins/sdk-runtime)                                    |
| `api.logger`            | `PluginLogger`            | Logger z zakresem (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`  | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekki okres uruchamiania/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`     | Rozwiązuje ścieżkę względem katalogu głównego pluginu                                      |

## Konwencja modułów wewnętrznych

Wewnątrz pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Publiczne eksporty dla odbiorców zewnętrznych
  runtime-api.ts    # Eksporty środowiska wykonawczego tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko do konfiguracji (opcjonalny)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  w kodzie produkcyjnym. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Ładowane przez fasadę publiczne powierzchnie dołączonych pluginów (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują teraz
aktywną migawkę konfiguracji środowiska wykonawczego, gdy OpenClaw jest już uruchomiony. Jeśli
migawka środowiska wykonawczego jeszcze nie istnieje, wracają awaryjnie do rozpoznanego pliku konfiguracji na dysku.

Pluginy dostawców mogą także udostępniać wąski, lokalny barrel kontraktu pluginu, gdy
helper jest celowo specyficzny dla dostawcy i nie należy jeszcze do ogólnej
podścieżki SDK. Obecny dołączony przykład: dostawca Anthropic przechowuje swoje
helpery streamingu Claude we własnej publicznej warstwie `api.ts` / `contract-api.ts` zamiast
promować logikę nagłówków beta Anthropic i `service_tier` do ogólnego
kontraktu `plugin-sdk/*`.

Inne obecne dołączone przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje konstruktory dostawców,
  helpery modeli domyślnych i konstruktory dostawców realtime
- `@openclaw/openrouter-provider`: `api.ts` eksportuje konstruktor dostawcy oraz
  helpery wdrażania/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien również unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest faktycznie współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na możliwości, zamiast łączyć ze sobą dwa pluginy.
</Warning>

## Powiązane

- [Entry Points](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Runtime Helpers](/pl/plugins/sdk-runtime) — pełna referencja przestrzeni nazw `api.runtime`
- [Setup and Config](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testing](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [SDK Migration](/pl/plugins/sdk-migration) — migracja ze zdeprecjonowanych powierzchni
- [Plugin Internals](/pl/plugins/architecture) — szczegółowa architektura i model możliwości
