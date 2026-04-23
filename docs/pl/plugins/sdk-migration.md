---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Aktualizujesz plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migruj ze starszej warstwy kompatybilności wstecznej do nowoczesnego SDK pluginów
title: Migracja SDK pluginów
x-i18n:
    generated_at: "2026-04-23T10:05:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migracja SDK pluginów

OpenClaw przeszedł od szerokiej warstwy kompatybilności wstecznej do nowoczesnej architektury pluginów
z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój plugin został zbudowany przed
nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie szeroko otwarte powierzchnie, które pozwalały pluginom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który reeksportował dziesiątki
  helperów. Został wprowadzony, aby starsze pluginy oparte na hookach nadal działały podczas budowy
  nowej architektury pluginów.
- **`openclaw/extension-api`** — most, który dawał pluginom bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.

Obie powierzchnie są teraz **przestarzałe**. Nadal działają w runtime, ale nowe
pluginy nie mogą z nich korzystać, a istniejące pluginy powinny przejść migrację przed następnym
dużym wydaniem, które je usunie.

<Warning>
  Warstwa kompatybilności wstecznej zostanie usunięta w przyszłym dużym wydaniu.
  Pluginy, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolne uruchamianie** — import jednego helpera ładował dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie reeksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** — nie było sposobu, by odróżnić eksporty stabilne od wewnętrznych

Nowoczesne SDK pluginów to naprawia: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem o jasnym przeznaczeniu i udokumentowanym kontrakcie.

Usunięto również starsze wygodne szczeliny dostawców dla dołączonych kanałów. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
szczeliny helperów oznaczone marką kanału oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie
stabilnymi kontraktami pluginów. Zamiast tego używaj wąskich, ogólnych podścieżek SDK. Wewnątrz
workspace dołączonego pluginu przechowuj helpery należące do dostawcy we własnym
`api.ts` lub `runtime-api.ts` tego pluginu.

Aktualne przykłady dołączonych dostawców:

- Anthropic przechowuje helpery strumieniowania specyficzne dla Claude we własnej szczelinie `api.ts` /
  `contract-api.ts`
- OpenAI przechowuje buildery dostawcy, helpery modeli domyślnych i buildery dostawcy realtime
  we własnym `api.ts`
- OpenRouter przechowuje builder dostawcy oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Jak przeprowadzić migrację

<Steps>
  <Step title="Migruj natywne handlery zatwierdzeń do faktów capability">
    Pluginy kanałów obsługujące zatwierdzenia udostępniają teraz natywne zachowanie zatwierdzeń przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr kontekstu runtime.

    Kluczowe zmiany:

    - Zamień `approvalCapability.handler.loadRuntime(...)` na
      `approvalCapability.nativeRuntime`
    - Przenieś uwierzytelnianie/dostarczanie specyficzne dla zatwierdzeń ze starszego okablowania `plugin.auth` /
      `plugin.approvals` do `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu
      pluginu kanału; przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki uwierzytelniania zatwierdzeń
      tam nie są już odczytywane przez rdzeń
    - Rejestruj obiekty runtime należące do kanału, takie jak klienci, tokeny lub
      aplikacje Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj komunikatów o przekierowaniu należących do pluginu z natywnych handlerów zatwierdzeń;
      rdzeń zarządza teraz komunikatami routed-elsewhere na podstawie rzeczywistych wyników dostarczenia
    - Przy przekazywaniu `channelRuntime` do `createChannelManager(...)` zapewnij
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby poznać aktualny układ capability
    zatwierdzeń.

  </Step>

  <Step title="Przeanalizuj zachowanie zapasowe wrappera Windows">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozpoznane wrappery Windows
    `.cmd`/`.bat` teraz kończą się bezpiecznym odrzuceniem, chyba że jawnie przekażesz
    `allowShellFallback: true`.

    ```typescript
    // Przed
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Po
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ustawiaj to tylko dla zaufanych wywołujących zgodności, którzy celowo
      // akceptują zapasowe użycie przez powłokę.
      allowShellFallback: true,
    });
    ```

    Jeśli Twój wywołujący nie polega celowo na zapasowym użyciu powłoki, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłoszony błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Wyszukaj w swoim pluginie importy z którejkolwiek z przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni mapuje się na konkretną nowoczesną ścieżkę importu:

    ```typescript
    // Przed (przestarzała warstwa kompatybilności wstecznej)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Po (nowoczesne ukierunkowane importy)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Dla helperów po stronie hosta używaj wstrzykniętego runtime pluginu zamiast importować
    bezpośrednio:

    ```typescript
    // Przed (przestarzały most extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Po (wstrzyknięty runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych helperów starszego mostu:

    | Old import | Nowoczesny odpowiednik |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpery magazynu sesji | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Zbuduj i przetestuj">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Dokumentacja ścieżek importu

  <Accordion title="Tabela typowych ścieżek importu">
  | Import path | Przeznaczenie | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny helper punktu wejścia pluginu | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy reeksport dla definicji/builderów punktów wejścia kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport schematu konfiguracji głównej | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery punktów wejścia kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji | Prompty allowlisty, buildery stanu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery runtime czasu konfiguracji | Adaptery łatek konfiguracji bezpieczne dla importu, helpery notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery listy kont/konfiguracji/bramki działań |
  | `plugin-sdk/account-id` | Helpery account-id | `DEFAULT_ACCOUNT_ID`, normalizacja account-id |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont | Helpery wyszukiwania kont i domyślnych wartości zapasowych |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery listy kont/działań na koncie |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Okablowanie prefiksu odpowiedzi i pisania | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematów konfiguracji | Typy schematów konfiguracji kanałów |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozpoznawanie polityk grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpery stanu kont i cyklu życia strumienia szkiców | `createAccountStatusSink`, helpery finalizacji podglądu szkicu |
  | `plugin-sdk/inbound-envelope` | Helpery koperty przychodzącej | Współdzielone helpery routingu i budowania kopert |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi przychodzących | Współdzielone helpery zapisu i dispatch |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Helpery multimediów wychodzących | Współdzielone ładowanie multimediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Helpery runtime wyjścia | Helpery tożsamości wyjścia/delegata wysyłki i planowania ładunków |
  | `plugin-sdk/thread-bindings-runtime` | Helpery powiązań wątków | Helpery cyklu życia powiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze helpery ładunku multimediów | Builder ładunku multimediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim zgodności | Tylko starsze narzędzia runtime kanałów |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwały magazyn pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery runtime | Helpery runtime/logowania/kopii zapasowych/instalacji pluginów |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime | Logger/pomocniki środowiska runtime, limity czasu, ponawianie i backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone helpery runtime pluginów | Helpery poleceń/hooków/http/interaktywności pluginów |
  | `plugin-sdk/hook-runtime` | Helpery potoku hooków | Współdzielone helpery potoku webhooków/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Helpery lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Współdzielone helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery runtime CLI | Formatowanie poleceń, oczekiwania, helpery wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Klient Gateway i helpery łatek stanu kanałów |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery poleceń Telegram | Helpery walidacji poleceń Telegram ze stabilnym fallbackiem, gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów zatwierdzeń | Ładunek zatwierdzeń exec/plugin, helpery capability/profili zatwierdzeń, helpery routingu/runtime natywnych zatwierdzeń |
  | `plugin-sdk/approval-auth-runtime` | Helpery uwierzytelniania zatwierdzeń | Rozpoznawanie zatwierdzających, uwierzytelnianie działań w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta zatwierdzeń | Helpery natywnych profili/filtrów zatwierdzeń exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania zatwierdzeń | Adaptery capability/dostarczania natywnych zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Helpery Gateway zatwierdzeń | Współdzielony helper rozpoznawania gateway zatwierdzeń |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpery adaptera zatwierdzeń | Lekkie helpery ładowania adaptera natywnych zatwierdzeń dla gorących punktów wejścia kanałów |
  | `plugin-sdk/approval-handler-runtime` | Helpery handlera zatwierdzeń | Szersze helpery runtime handlera zatwierdzeń; preferuj węższe szczeliny adaptera/gateway, gdy są wystarczające |
  | `plugin-sdk/approval-native-runtime` | Helpery celu zatwierdzeń | Helpery powiązań natywnego celu/konta zatwierdzeń |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi zatwierdzeń | Helpery ładunku odpowiedzi zatwierdzeń exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpery kontekstu runtime kanału | Ogólne helpery rejestrowania/pobierania/obserwowania kontekstu runtime kanału |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery polityki SSRF | Helpery allowlisty hostów i polityki sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Helpery runtime SSRF | Pinned-dispatcher, guarded fetch, helpery polityki SSRF |
  | `plugin-sdk/collection-runtime` | Helpery cache o ograniczonym rozmiarze | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery ponawiania | `RetryConfig`, `retryAsync`, executory polityk |
  | `plugin-sdk/allow-from` | Formatowanie allowlisty | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlisty | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i helpery powierzchni poleceń | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru poleceń |
  | `plugin-sdk/command-status` | Renderery stanu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie sekretów wejściowych | Helpery wejścia sekretów |
  | `plugin-sdk/webhook-ingress` | Helpery żądań webhooków | Narzędzia celu webhooka |
  | `plugin-sdk/webhook-request-guards` | Helpery guardów ciała żądania webhooka | Helpery odczytu/limitów ciała żądania |
  | `plugin-sdk/reply-runtime` | Współdzielony runtime odpowiedzi | Dispatch przychodzący, Heartbeat, planer odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatch odpowiedzi | Helpery finalize i dispatch dostawcy |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery fragmentów odpowiedzi | Helpery chunkingu tekstu/Markdown |
  | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji | Ścieżka magazynu + helpery updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/klucza sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji kluczy sesji |
  | `plugin-sdk/status-helpers` | Helpery stanu kanałów | Buildery podsumowań stanu kanałów/kont, domyślne wartości stanu runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery rozpoznawania celu | Współdzielone helpery rozpoznawania celu |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji ciągów | Helpery normalizacji slugów/ciągów |
  | `plugin-sdk/request-url` | Helpery adresów URL żądań | Wyodrębniaj tekstowe URL-e z wejść podobnych do żądań |
  | `plugin-sdk/run-command` | Helpery poleceń z limitem czasu | Runner poleceń z limitem czasu i znormalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Typowe czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Ekstrakcja ładunku narzędzi | Wyodrębniaj znormalizowane ładunki z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Ekstrakcja wysyłki narzędzi | Wyodrębniaj kanoniczne pola celu wysyłki z argumentów narzędzi |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Współdzielone helpery ścieżek tymczasowych pobrań |
  | `plugin-sdk/logging-core` | Helpery logowania | Logger podsystemu i helpery redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel Markdown | Helpery trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy ładunku odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnych/self-hosted dostawców | Helpery wykrywania/konfiguracji self-hosted dostawców |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji self-hosted dostawców zgodnych z OpenAI | Te same helpery wykrywania/konfiguracji self-hosted dostawców |
  | `plugin-sdk/provider-auth-runtime` | Helpery runtime uwierzytelniania dostawców | Helpery runtime rozpoznawania kluczy API |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji kluczy API dostawców | Helpery onboardingu/zapisu profilu kluczy API |
  | `plugin-sdk/provider-auth-result` | Helpery wyniku uwierzytelniania dostawcy | Standardowy builder wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania dostawcy | Współdzielone helpery interaktywnego logowania |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych środowiskowych dostawców | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawców |
  | `plugin-sdk/provider-model-shared` | Współdzielone helpery modeli/replay dostawców | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityki replay, helpery punktów końcowych dostawców i helpery normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone helpery katalogu dostawców | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Łatki onboardingu dostawcy | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP dostawców | Ogólne helpery HTTP/capability punktów końcowych dostawców, w tym helpery formularzy multipart do transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch dostawców | Helpery rejestracji/cache dostawców web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpery konfiguracji web-search dostawców | Wąskie helpery konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
  | `plugin-sdk/provider-web-search-contract` | Helpery kontraktu web-search dostawców | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz ograniczone settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Helpery web-search dostawców | Helpery rejestracji/cache/runtime dostawców web-search |
  | `plugin-sdk/provider-tools` | Helpery zgodności narzędzi/schematów dostawców | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery użycia dostawców | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` oraz inne helpery użycia dostawców |
  | `plugin-sdk/provider-stream` | Helpery wrapperów strumieni dostawców | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpery transportu dostawców | Natywne helpery transportu dostawców, takie jak guarded fetch, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka asynchroniczna | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone helpery multimediów | Helpery pobierania/transformacji/przechowywania multimediów oraz buildery ładunków multimediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone helpery generowania multimediów | Współdzielone helpery failover, wyboru kandydatów i komunikatów o braku modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Helpery rozumienia multimediów | Typy dostawców rozumienia multimediów oraz eksporty helperów obrazów/audio skierowane do dostawców |
  | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu | Usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel Markdown, helpery redakcji, helpery tagów dyrektyw, narzędzia bezpiecznego tekstu i powiązane helpery tekstu/logowania |
  | `plugin-sdk/text-chunking` | Helpery chunkingu tekstu | Helper chunkingu tekstu wychodzącego |
  | `plugin-sdk/speech` | Helpery mowy | Typy dostawców mowy oraz helpery dyrektyw, rejestru i walidacji skierowane do dostawców |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery transkrypcji realtime | Typy dostawców, helpery rejestru i współdzielony helper sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Helpery głosu realtime | Typy dostawców i helpery rejestru |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, helpery failover, uwierzytelniania i rejestru |
  | `plugin-sdk/music-generation` | Helpery generowania muzyki | Typy dostawców/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, helpery failover, wyszukiwanie dostawców i parsowanie referencji modeli |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, helpery failover, wyszukiwanie dostawców i parsowanie referencji modeli |
  | `plugin-sdk/interactive-runtime` | Helpery odpowiedzi interaktywnych | Normalizacja/redukcja ładunków odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanałów | Wąskie prymitywy channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpery zapisów konfiguracji kanałów | Helpery autoryzacji zapisu konfiguracji kanałów |
  | `plugin-sdk/channel-plugin-common` | Wspólne preludium kanału | Współdzielone eksporty preludium pluginów kanałów |
  | `plugin-sdk/channel-status` | Helpery stanu kanałów | Współdzielone helpery migawek/podsumowań stanu kanałów |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlisty | Helpery edycji/odczytu konfiguracji allowlisty |
  | `plugin-sdk/group-access` | Helpery dostępu do grup | Współdzielone helpery decyzji dostępu do grup |
  | `plugin-sdk/direct-dm` | Helpery bezpośrednich DM | Współdzielone helpery uwierzytelniania/guardów bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Współdzielone helpery rozszerzeń | Prymitywy helperów passive-channel/status i ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpery celów webhooków | Rejestr celów webhooków i helpery instalacji tras |
  | `plugin-sdk/webhook-path` | Helpery ścieżek webhooków | Helpery normalizacji ścieżek webhooków |
  | `plugin-sdk/web-media` | Współdzielone helpery web media | Helpery ładowania zdalnych/lokalnych multimediów |
  | `plugin-sdk/zod` | Reeksport Zod | Reeksportowane `zod` dla odbiorców SDK pluginów |
  | `plugin-sdk/memory-core` | Dołączone helpery memory-core | Powierzchnia helperów menedżera/konfiguracji/plików/CLI pamięci |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik foundation hosta pamięci | Eksporty silnika foundation hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta pamięci | Kontrakty embeddingów pamięci, dostęp do rejestru, lokalny dostawca oraz ogólne helpery batch/zdalne; konkretni zdalni dostawcy znajdują się we własnych pluginach |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik storage hosta pamięci | Eksporty silnika storage hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci | Helpery multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci | Helpery zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci | Helpery sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci | Helpery dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Helpery stanu hosta pamięci | Helpery stanu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Helpery runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Główny runtime hosta pamięci | Helpery głównego runtime hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci | Helpery plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias głównego runtime hosta pamięci | Neutralny względem dostawcy alias helperów głównego runtime hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias helperów dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/runtime hosta pamięci | Neutralny względem dostawcy alias helperów plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Helpery zarządzanego Markdown | Współdzielone helpery zarządzanego Markdown dla pluginów powiązanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada runtime menedżera wyszukiwania Active Memory |
  | `plugin-sdk/memory-host-status` | Alias stanu hosta pamięci | Neutralny względem dostawcy alias helperów stanu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Dołączone helpery memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracji, a nie pełną powierzchnią SDK.
Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre szczeliny helperów dołączonych pluginów, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Pozostają one eksportowane dla
utrzymania dołączonych pluginów i zgodności, ale celowo pominięto je w
wspólnej tabeli migracji i nie są zalecanym celem dla nowego kodu pluginów.

Ta sama zasada dotyczy innych rodzin dołączonych helperów, takich jak:

- helpery obsługi przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- dołączone powierzchnie helperów/pluginów, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` i `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską
powierzchnię helperów tokenów `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` oraz `resolveCopilotApiToken`.

Używaj najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` albo zapytaj na Discord.

## Harmonogram usunięcia

| Kiedy                  | Co się dzieje                                                          |
| ---------------------- | ---------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia runtime                  |
| **Następne duże wydanie** | Przestarzałe powierzchnie zostaną usunięte; pluginy nadal ich używające przestaną działać |

Wszystkie pluginy rdzenia zostały już zmigrowane. Zewnętrzne pluginy powinny przeprowadzić
migrację przed następnym dużym wydaniem.

## Tymczasowe wyciszanie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka awaryjna, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) — zbuduj swój pierwszy plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — budowanie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — budowanie pluginów dostawców
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest pluginu](/pl/plugins/manifest) — dokumentacja schematu manifestu
