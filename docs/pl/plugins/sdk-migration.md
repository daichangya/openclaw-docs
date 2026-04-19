---
read_when:
    - Widzisz ostrzeżenie `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Widzisz ostrzeżenie `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Aktualizujesz Plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Przejdź z przestarzałej warstwy kompatybilności wstecznej na nowoczesny Plugin SDK
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-19T01:11:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0df202ed35b3e72bfec1d23201d0e83294fe09cec2caf6e276835098491a899
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migracja Plugin SDK

OpenClaw przeszedł z szerokiej warstwy kompatybilności wstecznej na nowoczesną architekturę pluginów z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój Plugin został zbudowany przed wprowadzeniem nowej architektury, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie szeroko otwarte powierzchnie, które pozwalały pluginom importować wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który ponownie eksportował dziesiątki helperów. Został wprowadzony, aby utrzymać działanie starszych pluginów opartych na hookach podczas tworzenia nowej architektury pluginów.
- **`openclaw/extension-api`** — most, który dawał pluginom bezpośredni dostęp do helperów po stronie hosta, takich jak osadzony runner agenta.

Obie te powierzchnie są teraz **przestarzałe**. Nadal działają w czasie wykonywania, ale nowe pluginy nie mogą z nich korzystać, a istniejące pluginy powinny przeprowadzić migrację, zanim kolejna główna wersja je usunie.

<Warning>
  Warstwa kompatybilności wstecznej zostanie usunięta w jednej z przyszłych głównych wersji.
  Pluginy, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolne uruchamianie** — import jednego helpera ładował dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie ponowne eksporty ułatwiały tworzenie cykli importu
- **Niejasna powierzchnia API** — nie było sposobu, aby odróżnić stabilne eksporty od wewnętrznych

Nowoczesny Plugin SDK rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`) jest małym, samowystarczalnym modułem z jasno określonym przeznaczeniem i udokumentowanym kontraktem.

Usunięto także starsze wygodne warstwy providerów dla dołączonych kanałów. Importy takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, pomocnicze warstwy oznaczone marką kanału oraz `openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie stabilnymi kontraktami pluginów. Zamiast tego używaj wąskich, generycznych podścieżek SDK. Wewnątrz dołączonego workspace pluginów trzymaj helpery należące do providera we własnym `api.ts` lub `runtime-api.ts` tego pluginu.

Aktualne przykłady dołączonych providerów:

- Anthropic przechowuje helpery strumieni specyficzne dla Claude we własnej warstwie `api.ts` / `contract-api.ts`
- OpenAI przechowuje buildery providerów, helpery domyślnych modeli i buildery providerów realtime we własnym `api.ts`
- OpenRouter przechowuje builder providera oraz helpery onboardingu/konfiguracji we własnym `api.ts`

## Jak przeprowadzić migrację

<Steps>
  <Step title="Przenieś handlery natywne dla approval na fakty capabilities">
    Pluginy kanałów obsługujące approval udostępniają teraz natywne zachowanie approval przez
    `approvalCapability.nativeRuntime` wraz ze współdzielonym rejestrem kontekstu runtime.

    Najważniejsze zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś uwierzytelnianie/dostarczanie specyficzne dla approval ze starszego okablowania `plugin.auth` /
      `plugin.approvals` do `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu pluginu kanału;
      przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki
      uwierzytelniania approval w tym miejscu nie są już odczytywane przez core
    - Rejestruj obiekty runtime należące do kanału, takie jak klienty, tokeny lub aplikacje
      Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj komunikatów o przekierowaniu należących do pluginu z natywnych handlerów approval;
      core obsługuje teraz komunikaty „dostarczono gdzie indziej” na podstawie rzeczywistych wyników dostarczenia
    - Przy przekazywaniu `channelRuntime` do `createChannelManager(...)` podaj
      prawdziwą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby sprawdzić aktualny układ
    capabilities approval.

  </Step>

  <Step title="Sprawdź zachowanie fallback wrappera Windows">
    Jeśli Twój Plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` kończą się teraz zamkniętą awarią, chyba że jawnie przekażesz
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Jeśli Twój kod wywołujący nie polega świadomie na fallbacku powłoki, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłaszany błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Wyszukaj w swoim Pluginie importy z jednej z tych przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp je ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni odpowiada konkretnej nowoczesnej ścieżce importu:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    W przypadku helperów po stronie hosta użyj wstrzykniętego runtime pluginu zamiast importować je bezpośrednio:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych helperów starszego mostu:

    | Stary import | Nowoczesny odpowiednik |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpery session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Zbuduj i przetestuj">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Odniesienie do ścieżek importu

  <Accordion title="Tabela typowych ścieżek importu">
  | Ścieżka importu | Przeznaczenie | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny helper punktu wejścia pluginu | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy ponowny eksport dla definicji/builderów punktów wejścia kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper punktu wejścia pojedynczego providera | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery punktów wejścia kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji | Prompty allowlist, buildery statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery runtime dla czasu konfiguracji | Bezpieczne importowo adaptery poprawek konfiguracji, helpery notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery listy kont/konfiguracji/bramek akcji |
  | `plugin-sdk/account-id` | Helpery identyfikatora konta | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont | Helpery wyszukiwania kont i fallbacku domyślnego |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery listy kont/akcji na kontach |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Okablowanie prefiksu odpowiedzi i wskaźnika pisania | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematu konfiguracji | Typy schematu konfiguracji kanału |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji komend Telegram | Normalizacja nazw komend, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie zasad grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Śledzenie statusu konta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpery kopert przychodzących | Współdzielone helpery routingu i budowania kopert |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi przychodzących | Współdzielone helpery zapisu i dyspozycji |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Helpery runtime dla wiadomości wychodzących | Helpery tożsamości wychodzącej/delegowania wysyłki |
  | `plugin-sdk/thread-bindings-runtime` | Helpery powiązań wątków | Helpery cyklu życia i adapterów powiązań wątków |
  | `plugin-sdk/agent-media-payload` | Starsze helpery payloadów mediów | Builder payloadu mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim kompatybilności | Tylko starsze narzędzia runtime kanału |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwałe przechowywanie pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery runtime | Helpery runtime/logowania/backupu/instalacji pluginów |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime | Logger/środowisko runtime, timeout, retry i helpery backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone helpery runtime pluginu | Helpery komend/hooków/http/interaktywne pluginu |
  | `plugin-sdk/hook-runtime` | Helpery pipeline hooków | Współdzielone helpery pipeline webhooków/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Helpery leniwego runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Współdzielone helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery runtime CLI | Formatowanie komend, oczekiwanie, helpery wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Klient Gateway i helpery poprawek statusu kanału |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery komend Telegram | Pomocnicze helpery walidacji komend Telegram ze stabilnym fallbackiem, gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów approval | Payload exec/plugin approval, helpery capability/profili approval, natywne helpery routingu/runtime approval |
  | `plugin-sdk/approval-auth-runtime` | Helpery uwierzytelniania approval | Rozwiązywanie approvera, uwierzytelnianie akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta approval | Natywne helpery profili/filtrów approval exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania approval | Natywne adaptery capability/dostarczania approval |
  | `plugin-sdk/approval-gateway-runtime` | Helpery Gateway dla approval | Współdzielony helper rozwiązywania Gateway dla approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpery adaptera approval | Lekkie helpery ładowania natywnego adaptera approval dla gorących punktów wejścia kanału |
  | `plugin-sdk/approval-handler-runtime` | Helpery handlera approval | Szersze helpery runtime handlera approval; preferuj węższe warstwy adapter/gateway, gdy są wystarczające |
  | `plugin-sdk/approval-native-runtime` | Helpery celu approval | Natywne helpery powiązań celu/konta approval |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi approval | Helpery payloadów odpowiedzi approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpery kontekstu runtime kanału | Generyczne helpery rejestrowania/pobierania/obserwowania kontekstu runtime kanału |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Współdzielone helpery zaufania, bramek DM, zewnętrznej zawartości i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery zasad SSRF | Helpery allowlist hostów i zasad sieci prywatnych |
  | `plugin-sdk/ssrf-runtime` | Helpery runtime SSRF | Przypięty dispatcher, strzeżony fetch, helpery zasad SSRF |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Opakowane helpery fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery retry | `RetryConfig`, `retryAsync`, uruchamiacze zasad |
  | `plugin-sdk/allow-from` | Formatowanie allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie komend i helpery powierzchni komend | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru komend |
  | `plugin-sdk/command-status` | Renderery statusu/pomocy komend | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie sekretów wejściowych | Helpery wejścia sekretów |
  | `plugin-sdk/webhook-ingress` | Helpery żądań Webhook | Narzędzia celu Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpery strażników treści żądań Webhook | Helpery odczytu/limitów treści żądania |
  | `plugin-sdk/reply-runtime` | Współdzielony runtime odpowiedzi | Dyspozycja przychodząca, Heartbeat, planer odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dyspozycji odpowiedzi | Finalizacja i helpery dyspozycji providera |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie odwołań odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery chunków odpowiedzi | Helpery chunkingu tekstu/markdown |
  | `plugin-sdk/session-store-runtime` | Helpery session store | Ścieżka store i helpery updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/kluczy sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji kluczy sesji |
  | `plugin-sdk/status-helpers` | Helpery statusu kanału | Buildery podsumowania statusu kanału/konta, domyślne ustawienia stanu runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery rozwiązywania celu | Współdzielone helpery rozwiązywania celu |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji ciągów | Helpery normalizacji slugów/ciągów |
  | `plugin-sdk/request-url` | Helpery URL żądania | Wyodrębnianie URL-i tekstowych z wejść podobnych do żądań |
  | `plugin-sdk/run-command` | Helpery komend z pomiarem czasu | Runner komend z unormowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Wspólne czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie payloadu narzędzia | Wyodrębnianie unormowanych payloadów z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Współdzielone helpery ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Helpery logowania | Logger podsystemu i helpery redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel Markdown | Helpery trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy payloadów odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnych/samohostowanych providerów | Helpery wykrywania/konfiguracji samohostowanych providerów |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji samohostowanych providerów zgodnych z OpenAI | Te same helpery wykrywania/konfiguracji samohostowanych providerów |
  | `plugin-sdk/provider-auth-runtime` | Helpery uwierzytelniania providera w runtime | Helpery rozwiązywania klucza API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji klucza API providera | Helpery onboardingu/zapisu profilu klucza API |
  | `plugin-sdk/provider-auth-result` | Helpery wyniku uwierzytelniania providera | Standardowy builder wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania providera | Współdzielone helpery interaktywnego logowania |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych środowiskowych providera | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania providera |
  | `plugin-sdk/provider-model-shared` | Współdzielone helpery modelu/replay providera | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery zasad replay, helpery endpointów providera i helpery normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone helpery katalogu providerów | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Poprawki onboardingu providera | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP providera | Generyczne helpery HTTP/capabilities endpointów providera |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch providera | Helpery rejestracji/pamięci podręcznej providera web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpery konfiguracji web-search providera | Wąskie helpery konfiguracji/poświadczeń web-search dla providerów, które nie potrzebują okablowania włączania pluginu |
  | `plugin-sdk/provider-web-search-contract` | Helpery kontraktu web-search providera | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Helpery web-search providera | Helpery rejestracji/pamięci podręcznej/runtime providera web-search |
  | `plugin-sdk/provider-tools` | Helpery kompatybilności narzędzi/schematów providera | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery kompatybilności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery użycia providera | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne helpery użycia providera |
  | `plugin-sdk/provider-stream` | Helpery opakowań strumieni providera | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy opakowań strumieni oraz współdzielone helpery opakowań Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpery transportu providera | Natywne helpery transportu providera, takie jak strzeżony fetch, transformacje komunikatów transportu oraz zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka async | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone helpery mediów | Helpery pobierania/transformacji/przechowywania mediów oraz buildery payloadów mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone helpery generowania mediów | Współdzielone helpery failover, wyboru kandydatów i komunikatów o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Helpery rozumienia mediów | Typy providerów rozumienia mediów oraz eksporty helperów obrazów/audio skierowane do providerów |
  | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu | Usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel Markdown, helpery redakcji, helpery tagów dyrektyw, narzędzia safe-text oraz powiązane helpery tekstu/logowania |
  | `plugin-sdk/text-chunking` | Helpery chunkingu tekstu | Helper chunkingu tekstu wychodzącego |
  | `plugin-sdk/speech` | Helpery mowy | Typy providerów mowy oraz eksporty helperów dyrektyw, rejestru i walidacji skierowane do providerów |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy providerów mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery transkrypcji realtime | Typy providerów i helpery rejestru |
  | `plugin-sdk/realtime-voice` | Helpery głosu realtime | Typy providerów i helpery rejestru |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, failover, uwierzytelnianie i helpery rejestru |
  | `plugin-sdk/music-generation` | Helpery generowania muzyki | Typy providera/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, helpery failover, wyszukiwanie providera i parsowanie model-ref |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy providera/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, helpery failover, wyszukiwanie providera i parsowanie model-ref |
  | `plugin-sdk/interactive-runtime` | Helpery odpowiedzi interaktywnych | Normalizacja/redukcja payloadów odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy config-schema kanału |
  | `plugin-sdk/channel-config-writes` | Helpery zapisu konfiguracji kanału | Helpery autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielone preludium kanału | Współdzielone eksporty preludium pluginu kanału |
  | `plugin-sdk/channel-status` | Helpery statusu kanału | Współdzielone helpery snapshotów/podsumowań statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlist | Helpery edycji/odczytu konfiguracji allowlist |
  | `plugin-sdk/group-access` | Helpery dostępu grupowego | Współdzielone helpery decyzji o dostępie grupowym |
  | `plugin-sdk/direct-dm` | Helpery bezpośrednich DM | Współdzielone helpery uwierzytelniania/ochrony bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Współdzielone helpery rozszerzeń | Prymitywy helperów kanałów pasywnych/statusu i ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpery celów Webhook | Rejestr celów Webhook i helpery instalacji tras |
  | `plugin-sdk/webhook-path` | Helpery ścieżek Webhook | Helpery normalizacji ścieżek Webhook |
  | `plugin-sdk/web-media` | Współdzielone helpery mediów webowych | Helpery ładowania mediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Ponowny eksport Zod | Ponownie eksportowany `zod` dla odbiorców Plugin SDK |
  | `plugin-sdk/memory-core` | Dołączone helpery memory-core | Powierzchnia helperów menedżera/configu/plików/CLI pamięci |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik fundamentów hosta pamięci | Eksporty silnika fundamentów hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta pamięci | Kontrakty embeddingów pamięci, dostęp do rejestru, lokalny provider i generyczne helpery batch/zdalne; konkretni zdalni providerzy znajdują się we własnych pluginach |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik storage hosta pamięci | Eksporty silnika storage hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci | Helpery multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci | Helpery zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci | Helpery sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci | Helpery dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci | Helpery statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Helpery runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Rdzeniowy runtime hosta pamięci | Helpery rdzeniowego runtime hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci | Helpery plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias rdzeniowego runtime hosta pamięci | Neutralny względem dostawcy alias helperów rdzeniowego runtime hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias helperów dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/runtime hosta pamięci | Neutralny względem dostawcy alias helperów plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Helpery zarządzanego Markdown | Współdzielone helpery zarządzanego Markdown dla pluginów powiązanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada runtime menedżera wyszukiwania active-memory |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny względem dostawcy alias helperów statusu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Dołączone helpery memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracyjnym, a nie pełną powierzchnią
SDK. Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre warstwy helperów dołączonych pluginów, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz `plugin-sdk/matrix*`. Nadal są one eksportowane na
potrzeby utrzymania dołączonych pluginów i kompatybilności, ale celowo pominięto
je we wspólnej tabeli migracyjnej i nie są zalecanym celem dla nowego kodu
pluginów.

Ta sama zasada dotyczy innych rodzin dołączonych helperów, takich jak:

- helpery obsługi przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- powierzchnie dołączonych helperów/pluginów, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` i `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską
powierzchnię helperów tokena `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` oraz `resolveCopilotApiToken`.

Używaj możliwie najwęższego importu, który pasuje do danego zadania. Jeśli nie
możesz znaleźć eksportu, sprawdź źródło w `src/plugin-sdk/` albo zapytaj na Discord.

## Oś czasu usunięcia

| Kiedy | Co się stanie |
| ---------------------- | ----------------------------------------------------------------------- |
| **Teraz** | Przestarzałe powierzchnie emitują ostrzeżenia w runtime |
| **Następne główne wydanie** | Przestarzałe powierzchnie zostaną usunięte; pluginy, które nadal z nich korzystają, przestaną działać |

Wszystkie podstawowe pluginy zostały już zmigrowane. Zewnętrzne pluginy powinny
przeprowadzić migrację przed następnym głównym wydaniem.

## Tymczasowe wyciszenie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowy mechanizm awaryjny, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) — zbuduj swój pierwszy Plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odniesienie do importów subpath
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie pluginów kanałów
- [Pluginy providerów](/pl/plugins/sdk-provider-plugins) — tworzenie pluginów providerów
- [Wnętrze Pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest Pluginu](/pl/plugins/manifest) — odniesienie do schematu manifestu
