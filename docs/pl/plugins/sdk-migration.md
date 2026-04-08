---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Aktualizujesz plugin do nowoczesnej architektury pluginów OpenClaw
    - Utrzymujesz zewnętrzny plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migracja ze starszej warstwy zgodności wstecznej do nowoczesnego Plugin SDK
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-08T02:17:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 155a8b14bc345319c8516ebdb8a0ccdea2c5f7fa07dad343442996daee21ecad
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migracja Plugin SDK

OpenClaw przeszedł od szerokiej warstwy zgodności wstecznej do nowoczesnej architektury
pluginów z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój plugin powstał przed
nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie bardzo szerokie powierzchnie, które pozwalały pluginom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który reeksportował dziesiątki
  pomocników. Został wprowadzony po to, aby starsze pluginy oparte na hookach nadal działały
  podczas budowy nowej architektury pluginów.
- **`openclaw/extension-api`** — most, który dawał pluginom bezpośredni dostęp do
  pomocników po stronie hosta, takich jak osadzony runner agenta.

Obie powierzchnie są teraz **przestarzałe**. Nadal działają w czasie działania, ale nowe
pluginy nie mogą ich używać, a istniejące pluginy powinny przeprowadzić migrację przed następnym
głównym wydaniem, które je usunie.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w jednym z przyszłych głównych wydań.
  Pluginy, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolne uruchamianie** — zaimportowanie jednego pomocnika ładowało dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie reeksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** — nie było sposobu, aby odróżnić stabilne eksporty od wewnętrznych

Nowoczesny Plugin SDK to naprawia: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem o jasno określonym celu i udokumentowanym kontrakcie.

Starsze wygodne warstwy dostawców dla dołączonych kanałów również zniknęły. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
warstwy pomocnicze oznaczone marką kanału oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie
stabilnymi kontraktami pluginów. Zamiast tego używaj wąskich, ogólnych podścieżek SDK. Wewnątrz
dołączonego obszaru roboczego pluginów trzymaj pomocniki należące do dostawcy we własnym
`api.ts` lub `runtime-api.ts` tego pluginu.

Aktualne przykłady dołączonych dostawców:

- Anthropic przechowuje pomocniki strumieni specyficzne dla Claude we własnej warstwie `api.ts` /
  `contract-api.ts`
- OpenAI przechowuje konstruktory dostawców, pomocniki modeli domyślnych i konstruktory dostawców realtime
  we własnym `api.ts`
- OpenRouter przechowuje konstruktor dostawcy oraz pomocniki onboardingu/konfiguracji we własnym
  `api.ts`

## Jak przeprowadzić migrację

<Steps>
  <Step title="Przenieś handlery natywne dla zatwierdzeń na fakty możliwości">
    Pluginy kanałów obsługujące zatwierdzenia udostępniają teraz natywne zachowanie zatwierdzeń przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr runtime-context.

    Najważniejsze zmiany:

    - Zamień `approvalCapability.handler.loadRuntime(...)` na
      `approvalCapability.nativeRuntime`
    - Przenieś uwierzytelnianie/dostarczanie specyficzne dla zatwierdzeń ze starszego okablowania `plugin.auth` /
      `plugin.approvals` na `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu pluginów kanałowych;
      przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki
      uwierzytelniania zatwierdzeń nie są już tam odczytywane przez core
    - Rejestruj obiekty runtime należące do kanału, takie jak klienci, tokeny lub aplikacje
      Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj komunikatów o przekierowaniu należących do pluginu z natywnych handlerów zatwierdzeń;
      core odpowiada teraz za komunikaty „dostarczono gdzie indziej” na podstawie rzeczywistych wyników dostarczenia
    - Przy przekazywaniu `channelRuntime` do `createChannelManager(...)` podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby poznać bieżący układ
    approval capability.

  </Step>

  <Step title="Sprawdź zachowanie zapasowe wrapperów Windows">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` teraz domyślnie kończą się błędem, chyba że jawnie przekażesz
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

    Jeśli wywołujący nie polega celowo na zapasowym użyciu powłoki, nie ustawiaj
    `allowShellFallback`, tylko obsłuż zgłaszany błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj plugin w poszukiwaniu importów z którejkolwiek z przestarzałych powierzchni:

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

    W przypadku pomocników po stronie hosta używaj wstrzykniętego runtime pluginu zamiast
    bezpośredniego importu:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych starszych pomocników mostu:

    | Stary import | Nowoczesny odpowiednik |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | pomocniki magazynu sesji | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Zbuduj i przetestuj">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Dokumentacja ścieżek importu

<Accordion title="Tabela najczęściej używanych ścieżek importu">
  | Import path | Cel | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny pomocnik punktu wejścia pluginu | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy reeksport dla definicji/builderów punktów wejścia kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pomocnik punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery punktów wejścia kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji | Prompty allowlist, buildery statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Pomocniki runtime na etapie konfiguracji | Bezpieczne importowo adaptery łatek konfiguracji, pomocniki notatek lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Pomocniki adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Pomocniki narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pomocniki dla wielu kont | Pomocniki list kont/konfiguracji/bram akcji |
  | `plugin-sdk/account-id` | Pomocniki identyfikatorów kont | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania kont | Wyszukiwanie konta + pomocniki zapasowego wyboru domyślnego |
  | `plugin-sdk/account-helpers` | Wąskie pomocniki kont | Pomocniki list kont/akcji na kontach |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Okablowanie prefiksu odpowiedzi + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematów konfiguracji | Typy schematu konfiguracji kanału |
  | `plugin-sdk/telegram-command-config` | Pomocniki konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozstrzyganie polityk grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Śledzenie statusu konta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Pomocniki kopert wejściowych | Współdzielone pomocniki routingu + buildera kopert |
  | `plugin-sdk/inbound-reply-dispatch` | Pomocniki odpowiedzi wejściowych | Współdzielone pomocniki zapisu i dispatchu |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Pomocniki parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Pomocniki mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Pomocniki runtime wychodzącego | Pomocniki tożsamości wychodzącej/delegatów wysyłki |
  | `plugin-sdk/thread-bindings-runtime` | Pomocniki powiązań wątków | Cykl życia powiązań wątków i pomocniki adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze pomocniki payloadów mediów | Builder payloadu mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim zgodności | Tylko starsze narzędzia channel runtime |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwałe przechowywanie pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie pomocniki runtime | Pomocniki runtime/logowania/kopii zapasowych/instalacji pluginów |
  | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska runtime | Logger/runtime env, timeout, retry i pomocniki backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki runtime pluginów | Pomocniki poleceń/hooków/http/interakcji pluginów |
  | `plugin-sdk/hook-runtime` | Pomocniki potoku hooków | Współdzielone pomocniki potoku webhooków/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Pomocniki leniwego runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pomocniki procesów | Współdzielone pomocniki exec |
  | `plugin-sdk/cli-runtime` | Pomocniki runtime CLI | Formatowanie poleceń, oczekiwania, pomocniki wersji |
  | `plugin-sdk/gateway-runtime` | Pomocniki gateway | Klient gateway i pomocniki łat statusu kanału |
  | `plugin-sdk/config-runtime` | Pomocniki konfiguracji | Pomocniki ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Pomocniki poleceń Telegram | Pomocniki walidacji poleceń Telegram stabilne jako fallback, gdy powierzchnia kontraktu dołączonego Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Pomocniki promptów zatwierdzeń | Payload exec/plugin approval, pomocniki approval capability/profile, natywne pomocniki routingu/runtime zatwierdzeń |
  | `plugin-sdk/approval-auth-runtime` | Pomocniki auth zatwierdzeń | Rozstrzyganie osoby zatwierdzającej, uwierzytelnianie akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Pomocniki klienta zatwierdzeń | Natywne pomocniki profili/filtrów zatwierdzeń exec |
  | `plugin-sdk/approval-delivery-runtime` | Pomocniki dostarczania zatwierdzeń | Adaptery natywnych approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | Pomocniki gateway zatwierdzeń | Współdzielony pomocnik rozstrzygania approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pomocniki adaptera zatwierdzeń | Lekkie pomocniki ładowania natywnych adapterów zatwierdzeń dla gorących punktów wejścia kanałów |
  | `plugin-sdk/approval-handler-runtime` | Pomocniki handlerów zatwierdzeń | Szersze pomocniki runtime handlerów zatwierdzeń; preferuj węższe warstwy adapter/gateway, gdy wystarczą |
  | `plugin-sdk/approval-native-runtime` | Pomocniki celów zatwierdzeń | Pomocniki natywnych powiązań celu/konta zatwierdzeń |
  | `plugin-sdk/approval-reply-runtime` | Pomocniki odpowiedzi zatwierdzeń | Pomocniki payloadów odpowiedzi exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | Pomocniki channel runtime-context | Ogólne pomocniki register/get/watch dla channel runtime-context |
  | `plugin-sdk/security-runtime` | Pomocniki bezpieczeństwa | Współdzielone pomocniki trust, bramkowania DM, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Pomocniki polityki SSRF | Pomocniki allowlist hostów i polityki sieci prywatnych |
  | `plugin-sdk/ssrf-runtime` | Pomocniki runtime SSRF | Pinned-dispatcher, guarded fetch, pomocniki polityki SSRF |
  | `plugin-sdk/collection-runtime` | Pomocniki ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pomocniki bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pomocniki formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, pomocniki grafu błędów |
  | `plugin-sdk/fetch-runtime` | Pomocniki opakowanego fetch/proxy | `resolveFetch`, pomocniki proxy |
  | `plugin-sdk/host-runtime` | Pomocniki normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pomocniki retry | `RetryConfig`, `retryAsync`, uruchamiacze polityk |
  | `plugin-sdk/allow-from` | Formatowanie allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i pomocniki powierzchni poleceń | `resolveControlCommandGate`, pomocniki autoryzacji nadawcy, pomocniki rejestru poleceń |
  | `plugin-sdk/secret-input` | Parsowanie tajnych danych wejściowych | Pomocniki secret input |
  | `plugin-sdk/webhook-ingress` | Pomocniki żądań webhooków | Narzędzia celu webhooka |
  | `plugin-sdk/webhook-request-guards` | Pomocniki guardów żądań webhooków | Pomocniki odczytu/limitowania treści żądań |
  | `plugin-sdk/reply-runtime` | Współdzielony runtime odpowiedzi | Inbound dispatch, heartbeat, planner odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki dispatchu odpowiedzi | Finalizacja + pomocniki dispatchu dostawcy |
  | `plugin-sdk/reply-history` | Pomocniki historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pomocniki dzielenia odpowiedzi | Pomocniki dzielenia tekstu/markdown |
  | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji | Ścieżka magazynu + pomocniki updated-at |
  | `plugin-sdk/state-paths` | Pomocniki ścieżek stanu | Pomocniki katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Pomocniki routingu/kluczy sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pomocniki normalizacji kluczy sesji |
  | `plugin-sdk/status-helpers` | Pomocniki statusu kanału | Buildery podsumowań statusu kanału/konta, domyślne stany runtime, pomocniki metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Pomocniki rozstrzygania celów | Współdzielone pomocniki target resolver |
  | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji tekstu | Pomocniki normalizacji slugów/ciągów |
  | `plugin-sdk/request-url` | Pomocniki URL żądań | Wyodrębnianie URL jako ciągów z danych wejściowych podobnych do żądania |
  | `plugin-sdk/run-command` | Pomocniki poleceń z pomiarem czasu | Runner poleceń z normalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Typowe czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki z narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Pomocniki ścieżek tymczasowych | Współdzielone pomocniki ścieżek tymczasowych pobrań |
  | `plugin-sdk/logging-core` | Pomocniki logowania | Logger podsystemu i pomocniki redakcji |
  | `plugin-sdk/markdown-table-runtime` | Pomocniki tabel markdown | Pomocniki trybów tabel markdown |
  | `plugin-sdk/reply-payload` | Typy payloadów odpowiedzi | Typy payloadów odpowiedzi wiadomości |
  | `plugin-sdk/provider-setup` | Dobrane pomocniki konfiguracji lokalnych/samohostowanych dostawców | Pomocniki wykrywania/konfiguracji samohostowanych dostawców |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane pomocniki konfiguracji samohostowanych dostawców zgodnych z OpenAI | Te same pomocniki wykrywania/konfiguracji samohostowanych dostawców |
  | `plugin-sdk/provider-auth-runtime` | Pomocniki auth runtime dostawców | Pomocniki rozstrzygania kluczy API runtime |
  | `plugin-sdk/provider-auth-api-key` | Pomocniki konfiguracji kluczy API dostawców | Pomocniki onboardingu/zapisu profilu dla kluczy API |
  | `plugin-sdk/provider-auth-result` | Pomocniki wyników auth dostawców | Standardowy builder wyniku auth OAuth |
  | `plugin-sdk/provider-auth-login` | Pomocniki interaktywnego logowania dostawców | Współdzielone pomocniki interaktywnego logowania |
  | `plugin-sdk/provider-env-vars` | Pomocniki zmiennych środowiskowych dostawców | Pomocniki wyszukiwania zmiennych środowiskowych auth dostawców |
  | `plugin-sdk/provider-model-shared` | Współdzielone pomocniki modeli/replay dostawców | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityk replay, pomocniki endpointów dostawców i normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone pomocniki katalogów dostawców | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Łatki onboardingu dostawców | Pomocniki konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Pomocniki HTTP dostawców | Ogólne pomocniki HTTP/możliwości endpointów dostawców |
  | `plugin-sdk/provider-web-fetch` | Pomocniki web-fetch dostawców | Pomocniki rejestracji/cache dostawców web-fetch |
  | `plugin-sdk/provider-web-search-contract` | Pomocniki kontraktu web-search dostawców | Wąskie pomocniki kontraktu konfiguracji/poświadczeń web-search, takie jak `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz funkcje ustawiania/pobierania poświadczeń o ograniczonym zakresie |
  | `plugin-sdk/provider-web-search` | Pomocniki web-search dostawców | Pomocniki rejestracji/cache/runtime dostawców web-search |
  | `plugin-sdk/provider-tools` | Pomocniki zgodności narzędzi/schematów dostawców | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz pomocniki zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Pomocniki użycia dostawców | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne pomocniki użycia dostawców |
  | `plugin-sdk/provider-stream` | Pomocniki wrapperów strumieni dostawców | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka async | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone pomocniki mediów | Pomocniki pobierania/przekształcania/przechowywania mediów oraz buildery payloadów mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki generowania mediów | Współdzielone pomocniki failover, wyboru kandydatów i komunikatów o braku modeli dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Pomocniki media-understanding | Typy dostawców media understanding oraz eksporty pomocników obrazów/audio dla dostawców |
  | `plugin-sdk/text-runtime` | Współdzielone pomocniki tekstu | Usuwanie tekstu widocznego dla asystenta, pomocniki renderowania/dzielenia/tabel markdown, redakcji, tagów dyrektyw, bezpiecznego tekstu oraz powiązane pomocniki tekstowe/logowania |
  | `plugin-sdk/text-chunking` | Pomocniki dzielenia tekstu | Pomocnik dzielenia tekstu wychodzącego |
  | `plugin-sdk/speech` | Pomocniki speech | Typy dostawców speech oraz eksporty pomocników dyrektyw, rejestru i walidacji dla dostawców |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń speech | Typy dostawców speech, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Pomocniki transkrypcji realtime | Typy dostawców i pomocniki rejestru |
  | `plugin-sdk/realtime-voice` | Pomocniki głosu realtime | Typy dostawców i pomocniki rejestru |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Pomocniki typów, failover, auth i rejestru generowania obrazów |
  | `plugin-sdk/music-generation` | Pomocniki generowania muzyki | Typy dostawców/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Pomocniki typów, failover, wyszukiwania dostawców i parsowania model-ref dla generowania muzyki |
  | `plugin-sdk/video-generation` | Pomocniki generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Pomocniki typów, failover, wyszukiwania dostawców i parsowania model-ref dla generowania wideo |
  | `plugin-sdk/interactive-runtime` | Pomocniki odpowiedzi interaktywnych | Normalizacja/redukcja payloadów odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy channel config-schema |
  | `plugin-sdk/channel-config-writes` | Pomocniki zapisu konfiguracji kanału | Pomocniki autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Wspólny prelude kanału | Eksporty wspólnego preludium pluginu kanału |
  | `plugin-sdk/channel-status` | Pomocniki statusu kanału | Współdzielone pomocniki snapshotów/podsumowań statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Pomocniki konfiguracji allowlist | Pomocniki edycji/odczytu konfiguracji allowlist |
  | `plugin-sdk/group-access` | Pomocniki dostępu grupowego | Współdzielone pomocniki decyzji o dostępie grupowym |
  | `plugin-sdk/direct-dm` | Pomocniki bezpośrednich DM | Współdzielone pomocniki auth/guard bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Współdzielone pomocniki rozszerzeń | Prymitywy pomocników pasywnego kanału/statusu i ambient proxy |
  | `plugin-sdk/webhook-targets` | Pomocniki celów webhooków | Rejestr celów webhooków i pomocniki instalacji tras |
  | `plugin-sdk/webhook-path` | Pomocniki ścieżek webhooków | Pomocniki normalizacji ścieżek webhooków |
  | `plugin-sdk/web-media` | Współdzielone pomocniki web media | Pomocniki ładowania zdalnych/lokalnych mediów |
  | `plugin-sdk/zod` | Reeksport Zod | Reeksport `zod` dla użytkowników Plugin SDK |
  | `plugin-sdk/memory-core` | Dołączone pomocniki memory-core | Powierzchnia pomocników menedżera/konfiguracji/plików/CLI pamięci |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bazowy silnik hosta pamięci | Eksporty bazowego silnika hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta pamięci | Eksporty silnika embeddingów hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik przechowywania hosta pamięci | Eksporty silnika przechowywania hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Wielomodalne pomocniki hosta pamięci | Wielomodalne pomocniki hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci | Pomocniki zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci | Pomocniki sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Pomocniki dziennika zdarzeń hosta pamięci | Pomocniki dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci | Pomocniki statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Pomocniki runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core hosta pamięci | Pomocniki runtime core hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/runtime hosta pamięci | Pomocniki plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias runtime core hosta pamięci | Neutralny względem dostawcy alias pomocników runtime core hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/runtime hosta pamięci | Neutralny względem dostawcy alias pomocników plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Pomocniki zarządzanego markdown | Współdzielone pomocniki zarządzanego markdown dla pluginów powiązanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada aktywnego wyszukiwania pamięci | Leniwa fasada runtime menedżera wyszukiwania aktywnej pamięci |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny względem dostawcy alias pomocników statusu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Dołączone pomocniki memory-lancedb | Powierzchnia pomocników memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Pomocniki testowe i mocki |
</Accordion>

Ta tabela celowo obejmuje wspólny podzbiór do migracji, a nie pełną powierzchnię SDK.
Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre warstwy pomocnicze dołączonych pluginów, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Nadal są one eksportowane dla
utrzymania zgodności i konserwacji dołączonych pluginów, ale celowo
pominięto je w tabeli najczęstszych migracji i nie są zalecanym celem dla
nowego kodu pluginów.

Ta sama zasada dotyczy innych rodzin dołączonych pomocników, takich jak:

- pomocniki wsparcia przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- dołączone powierzchnie pomocnicze/pluginów, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` i `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską
powierzchnię pomocników tokenów `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` oraz `resolveCopilotApiToken`.

Używaj najwęższego importu, który pasuje do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` albo zapytaj na Discord.

## Harmonogram usunięcia

| Kiedy | Co się dzieje |
| ---------------------- | ----------------------------------------------------------------------- |
| **Teraz**                | Przestarzałe powierzchnie emitują ostrzeżenia w czasie działania                               |
| **Następne główne wydanie** | Przestarzałe powierzchnie zostaną usunięte; pluginy nadal z nich korzystające przestaną działać |

Wszystkie główne pluginy zostały już zmigrowane. Zewnętrzne pluginy powinny przeprowadzić migrację
przed następnym głównym wydaniem.

## Tymczasowe wyciszenie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka awaryjna, a nie trwałe rozwiązanie.

## Powiązane

- [Getting Started](/pl/plugins/building-plugins) — zbuduj swój pierwszy plugin
- [SDK Overview](/pl/plugins/sdk-overview) — pełna dokumentacja importów podścieżek
- [Channel Plugins](/pl/plugins/sdk-channel-plugins) — budowanie pluginów kanałów
- [Provider Plugins](/pl/plugins/sdk-provider-plugins) — budowanie pluginów dostawców
- [Plugin Internals](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Plugin Manifest](/pl/plugins/manifest) — dokumentacja schematu manifestu
