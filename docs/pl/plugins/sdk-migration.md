---
read_when:
    - Widzisz ostrzeżenie `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Widzisz ostrzeżenie `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Użyto `api.registerEmbeddedExtensionFactory` przed OpenClaw 2026.4.25
    - Aktualizujesz Plugin do nowoczesnej architektury Pluginów
    - Utrzymujesz zewnętrzny Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migracja ze starszej warstwy kompatybilności wstecznej do nowoczesnego SDK Pluginów
title: Migracja SDK Pluginów
x-i18n:
    generated_at: "2026-04-25T13:54:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw przeszedł od szerokiej warstwy zgodności wstecznej do nowoczesnej
architektury pluginów z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój plugin powstał przed
nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie szeroko otwarte powierzchnie, które pozwalały pluginom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który ponownie eksportował dziesiątki
  helperów. Został wprowadzony, aby utrzymać działanie starszych pluginów opartych na hookach podczas budowy
  nowej architektury pluginów.
- **`openclaw/extension-api`** — pomost, który dawał pluginom bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.
- **`api.registerEmbeddedExtensionFactory(...)`** — usunięty hook zbundlowanych
  rozszerzeń tylko dla Pi, który mógł obserwować zdarzenia osadzonego runnera, takie jak
  `tool_result`.

Szerokie powierzchnie importu są teraz **przestarzałe**. Nadal działają w runtime,
ale nowe pluginy nie mogą z nich korzystać, a istniejące pluginy powinny przeprowadzić migrację przed
następnym głównym wydaniem, które je usunie. API rejestracji fabryki osadzonych rozszerzeń tylko dla Pi
zostało usunięte; użyj zamiast tego middleware wyników narzędzi.

OpenClaw nie usuwa ani nie reinterpretuję udokumentowanego zachowania pluginów w tej samej
zmianie, która wprowadza zamiennik. Zmiany łamiące kontrakt muszą najpierw przejść przez
adapter zgodności, diagnostykę, dokumentację i okres deprecjacji.
Dotyczy to importów SDK, pól manifestu, API konfiguracji, hooków oraz zachowania rejestracji w runtime.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym głównym wydaniu.
  Pluginy, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
  Rejestracje fabryk osadzonych rozszerzeń tylko dla Pi już nie są ładowane.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolne uruchamianie** — zaimportowanie jednego helpera ładowało dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie ponowne eksporty ułatwiały tworzenie cykli importu
- **Niejasna powierzchnia API** — nie było sposobu, aby określić, które eksporty są stabilne, a które wewnętrzne

Nowoczesne SDK pluginów rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem o jasno określonym celu i udokumentowanym kontrakcie.

Zniknęły także wygodne starsze połączenia dostawców dla zbundlowanych kanałów. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
pomocnicze powierzchnie oznaczone marką kanału oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie
stabilnymi kontraktami pluginów. Używaj zamiast tego wąskich, generycznych ścieżek podrzędnych SDK. Wewnątrz
przestrzeni roboczej zbundlowanego plugina trzymaj helpery należące do dostawcy we własnym
`api.ts` lub `runtime-api.ts` tego plugina.

Aktualne przykłady zbundlowanych dostawców:

- Anthropic przechowuje helpery strumieni specyficzne dla Claude we własnej powierzchni `api.ts` /
  `contract-api.ts`
- OpenAI przechowuje buildery dostawcy, helpery domyślnych modeli i buildery
  dostawcy realtime we własnym `api.ts`
- OpenRouter przechowuje builder dostawcy oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Zasady zgodności

Dla zewnętrznych pluginów prace nad zgodnością przebiegają w tej kolejności:

1. dodaj nowy kontrakt
2. pozostaw stare zachowanie podłączone przez adapter zgodności
3. emituj diagnostykę lub ostrzeżenie, które wskazuje starą ścieżkę i zamiennik
4. obejmij testami obie ścieżki
5. udokumentuj deprecjację i ścieżkę migracji
6. usuń dopiero po ogłoszonym oknie migracji, zwykle w głównym wydaniu

Jeśli pole manifestu jest nadal akceptowane, autorzy pluginów mogą dalej z niego korzystać, dopóki
dokumentacja i diagnostyka nie powiedzą inaczej. Nowy kod powinien preferować udokumentowany
zamiennik, ale istniejące pluginy nie powinny przestawać działać w zwykłych wydaniach minor.

## Jak przeprowadzić migrację

<Steps>
  <Step title="Przenieś rozszerzenia wyników narzędzi Pi do middleware">
    Zbundlowane pluginy muszą zastąpić obsługę wyników narzędzi tylko dla Pi w
    `api.registerEmbeddedExtensionFactory(...)`
    neutralnym względem runtime middleware.

    ```typescript
    // Dynamic tools dla runtime Pi i Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Jednocześnie zaktualizuj manifest plugina:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Zewnętrzne pluginy nie mogą rejestrować middleware wyników narzędzi, ponieważ może ono
    przepisywać wynik narzędzia o wysokim poziomie zaufania, zanim model go zobaczy.

  </Step>

  <Step title="Przenieś handlery natywne dla zatwierdzeń do faktów zdolności">
    Pluginy kanałów obsługujące zatwierdzenia udostępniają teraz natywne zachowanie zatwierdzeń przez
    `approvalCapability.nativeRuntime` wraz ze współdzielonym rejestrem kontekstu runtime.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)`
      przez `approvalCapability.nativeRuntime`
    - Przenieś uwierzytelnianie/dostarczanie specyficzne dla zatwierdzeń ze starszego połączenia `plugin.auth` /
      `plugin.approvals` do `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu pluginu kanału;
      przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki uwierzytelniania
      zatwierdzeń nie są już odczytywane przez rdzeń
    - Rejestruj obiekty runtime należące do kanału, takie jak klienci, tokeny lub aplikacje
      Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj komunikatów o przekierowaniu należących do plugina z natywnych handlerów zatwierdzeń;
      rdzeń odpowiada teraz za komunikaty o dostarczeniu w inne miejsce na podstawie rzeczywistych wyników dostarczenia
    - Podczas przekazywania `channelRuntime` do `createChannelManager(...)` podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Aktualny układ zdolności zatwierdzeń znajdziesz w `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Sprawdź zachowanie awaryjne wrapperów Windows">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` teraz kończą się bezpieczną porażką, chyba że jawnie przekażesz `allowShellFallback: true`.

    ```typescript
    // Przed
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Po
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ustaw to tylko dla zaufanych wywołań zgodności, które celowo
      // akceptują fallback pośredniczony przez shell.
      allowShellFallback: true,
    });
    ```

    Jeśli Twój caller nie polega celowo na fallbacku shella, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłoszony błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj swój plugin pod kątem importów z jednej z przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp je ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni mapuje się na konkretną nowoczesną ścieżkę importu:

    ```typescript
    // Przed (przestarzała warstwa zgodności wstecznej)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Po (nowoczesne, ukierunkowane importy)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    W przypadku helperów po stronie hosta użyj wstrzykniętego runtime plugina zamiast importować
    je bezpośrednio:

    ```typescript
    // Przed (przestarzały pomost extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Po (wstrzyknięty runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych starszych helperów pomostu:

    | Stary import | Nowoczesny odpowiednik |
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

## Odwołanie do ścieżek importu

  <Accordion title="Tabela typowych ścieżek importu">
  | Ścieżka importu | Przeznaczenie | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny helper punktu wejścia plugina | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy parasolowy re-eksport dla definicji/builderów wejścia kanału | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery wejścia kanału | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji | Prompty allowlisty, buildery statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery runtime na etapie konfiguracji | Bezpieczne do importu adaptery łatek konfiguracji, helpery notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery listy kont/konfiguracji/bramkowania akcji |
  | `plugin-sdk/account-id` | Helpery account-id | `DEFAULT_ACCOUNT_ID`, normalizacja account-id |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont | Helpery wyszukiwania kont + fallbacku domyślnego |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery listy kont/akcji na kontach |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Łączenie prefiksu odpowiedzi i pisania | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematu konfiguracji | Współdzielone prymitywy schematu konfiguracji kanału; eksporty schematu nazwanych zbundlowanych kanałów są wyłącznie starszą zgodnością |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji komend Telegram | Normalizacja nazw komend, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie zasad grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpery statusu konta i cyklu życia strumienia szkiców | `createAccountStatusSink`, helpery finalizacji podglądu szkicu |
  | `plugin-sdk/inbound-envelope` | Helpery kopert przychodzących | Współdzielone helpery tras i builderów kopert |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi przychodzących | Współdzielone helpery zapisywania i wysyłki |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Helpery runtime dla ruchu wychodzącego | Helpery dostarczania wychodzącego, delegata tożsamości/wysyłki, sesji, formatowania i planowania ładunku |
  | `plugin-sdk/thread-bindings-runtime` | Helpery wiązań wątków | Helpery cyklu życia wiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze helpery ładunku mediów | Builder ładunku mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim zgodności | Wyłącznie starsze narzędzia runtime kanału |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwały magazyn plugina | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery runtime | Helpery runtime/logowania/kopii zapasowych/instalacji pluginów |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime | Logger/runtime env, helpery timeoutów, ponowień i backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone helpery runtime plugina | Helpery komend/hooków/http/interaktywne plugina |
  | `plugin-sdk/hook-runtime` | Helpery pipeline hooków | Współdzielone helpery pipeline Webhooków/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Helpery leniwego runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Współdzielone helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery runtime CLI | Helpery formatowania komend, oczekiwań, wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Helpery klienta Gateway i łatek statusu kanału |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery komend Telegram | Stabilne fallbackowe helpery walidacji komend Telegram, gdy powierzchnia kontraktu zbundlowanego Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów zatwierdzeń | Helpery ładunku zatwierdzeń exec/plugin, helpery zdolności/profilu zatwierdzeń, natywnego routingu/runtime zatwierdzeń oraz formatowania ścieżek strukturalnego wyświetlania zatwierdzeń |
  | `plugin-sdk/approval-auth-runtime` | Helpery uwierzytelniania zatwierdzeń | Rozwiązywanie approvera, autoryzacja akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta zatwierdzeń | Helpery profilu/filtrowania natywnych zatwierdzeń exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania zatwierdzeń | Adaptery natywnej zdolności/dostarczania zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Helpery Gateway zatwierdzeń | Współdzielony helper rozwiązywania Gateway zatwierdzeń |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpery adaptera zatwierdzeń | Lekkie helpery ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanału |
  | `plugin-sdk/approval-handler-runtime` | Helpery handlera zatwierdzeń | Szersze helpery runtime handlera zatwierdzeń; preferuj węższe powierzchnie adaptera/gateway, gdy są wystarczające |
  | `plugin-sdk/approval-native-runtime` | Helpery celu zatwierdzeń | Helpery natywnego wiązania celu/konta zatwierdzeń |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi zatwierdzeń | Helpery ładunku odpowiedzi zatwierdzeń exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpery kontekstu runtime kanału | Generyczne helpery register/get/watch dla kontekstu runtime kanału |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznej i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery zasad SSRF | Helpery allowlisty hostów i zasad sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Helpery runtime SSRF | Helpery pinned-dispatcher, guarded fetch, zasad SSRF |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery ponawiania | `RetryConfig`, `retryAsync`, executory zasad |
  | `plugin-sdk/allow-from` | Formatowanie allowlisty | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlisty | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie komend i helpery powierzchni komend | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru komend, w tym formatowanie dynamicznego menu argumentów |
  | `plugin-sdk/command-status` | Renderery statusu/pomocy komend | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie wejścia sekretów | Helpery wejścia sekretów |
  | `plugin-sdk/webhook-ingress` | Helpery żądań Webhook | Narzędzia docelowe Webhooków |
  | `plugin-sdk/webhook-request-guards` | Helpery guardów żądań Webhook | Helpery odczytu/limitów treści żądania |
  | `plugin-sdk/reply-runtime` | Współdzielony runtime odpowiedzi | Wysyłka przychodząca, Heartbeat, planista odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery wysyłki odpowiedzi | Helpery finalizacji, wysyłki dostawcy i etykiet konwersacji |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery chunków odpowiedzi | Helpery chunkowania tekstu/markdown |
  | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji | Helpery ścieżek magazynu i updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/kluczy sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji kluczy sesji |
  | `plugin-sdk/status-helpers` | Helpery statusu kanału | Buildery podsumowania statusu kanału/konta, domyślne wartości stanu runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery rozwiązywania celów | Współdzielone helpery rozwiązywania celów |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji ciągów | Helpery normalizacji slugów/ciągów |
  | `plugin-sdk/request-url` | Helpery URL żądania | Wyodrębniaj URL-e ciągów znaków z danych wejściowych podobnych do żądania |
  | `plugin-sdk/run-command` | Helpery komend z limitem czasu | Runner komend z normalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Odczyt parametrów | Typowe odczyty parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie ładunku narzędzia | Wyodrębnia znormalizowane ładunki z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzia | Wyodrębnia kanoniczne pola celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Współdzielone helpery ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Helpery logowania | Logger podsystemu i helpery redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel markdown | Helpery trybu tabel markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy ładunku odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji dostawców lokalnych/self-hosted | Helpery wykrywania/konfiguracji samohostowanych dostawców |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji samohostowanych dostawców kompatybilnych z OpenAI | Te same helpery wykrywania/konfiguracji samohostowanych dostawców |
  | `plugin-sdk/provider-auth-runtime` | Helpery uwierzytelniania runtime dostawcy | Helpery rozwiązywania klucza API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji klucza API dostawcy | Helpery onboardingu/zapisu profilu klucza API |
  | `plugin-sdk/provider-auth-result` | Helpery wyniku uwierzytelnienia dostawcy | Standardowy builder wyniku uwierzytelnienia OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania dostawcy | Współdzielone helpery interaktywnego logowania |
  | `plugin-sdk/provider-selection-runtime` | Helpery wyboru dostawcy | Helpery wyboru skonfigurowanego lub automatycznego dostawcy oraz scalania surowej konfiguracji dostawcy |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych środowiskowych dostawcy | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
  | `plugin-sdk/provider-model-shared` | Współdzielone helpery modeli/replay dostawców | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery zasad replay, helpery endpointów dostawców oraz helpery normalizacji model-id |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone helpery katalogu dostawców | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Łatki onboardingu dostawcy | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP dostawców | Generyczne helpery HTTP/zdolności endpointów dostawców, w tym helpery formularzy multipart do transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch dostawców | Helpery rejestracji/pamięci podręcznej dostawców web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpery konfiguracji web-search dostawców | Wąskie helpery konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują połączenia włączania pluginów |
  | `plugin-sdk/provider-web-search-contract` | Helpery kontraktu web-search dostawców | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Helpery web-search dostawców | Helpery rejestracji/pamięci podręcznej/runtime dostawców web-search |
  | `plugin-sdk/provider-tools` | Helpery zgodności narzędzi/schematów dostawców | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery użycia dostawców | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` oraz inne helpery użycia dostawców |
  | `plugin-sdk/provider-stream` | Helpery wrapperów strumieni dostawców | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpery transportu dostawców | Natywne helpery transportu dostawców, takie jak guarded fetch, transformacje komunikatów transportu oraz zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka async | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone helpery mediów | Helpery pobierania/transformacji/przechowywania mediów oraz buildery ładunków mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone helpery generowania mediów | Współdzielone helpery failover, wybór kandydatów oraz komunikaty o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Helpery rozumienia mediów | Typy dostawców rozumienia mediów oraz eksporty helperów obrazów/audio skierowane do dostawców |
  | `plugin-sdk/text-runtime` | Współdzielone helpery tekstowe | Usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel markdown, helpery redakcji, helpery tagów dyrektyw, narzędzia bezpiecznego tekstu oraz powiązane helpery tekstowe/logowania |
  | `plugin-sdk/text-chunking` | Helpery chunkingu tekstu | Helper chunkingu tekstu wychodzącego |
  | `plugin-sdk/speech` | Helpery mowy | Typy dostawców mowy oraz eksporty helperów dyrektyw, rejestru i walidacji skierowane do dostawców |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery transkrypcji realtime | Typy dostawców, helpery rejestru oraz współdzielony helper sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Helpery głosu realtime | Typy dostawców, helpery rejestru/rozwiązywania oraz helpery sesji mostka |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, failover, uwierzytelnianie i helpery rejestru |
  | `plugin-sdk/music-generation` | Helpery generowania muzyki | Typy dostawców/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, helpery failover, wyszukiwanie dostawców i parsowanie model-ref |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, helpery failover, wyszukiwanie dostawców i parsowanie model-ref |
  | `plugin-sdk/interactive-runtime` | Helpery odpowiedzi interaktywnych | Normalizacja/redukcja ładunków odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpery zapisu konfiguracji kanału | Helpery autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielone preludium kanału | Eksporty współdzielonego preludium pluginu kanału |
  | `plugin-sdk/channel-status` | Helpery statusu kanału | Współdzielone helpery migawki/podsumowania statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlisty | Helpery edycji/odczytu konfiguracji allowlisty |
  | `plugin-sdk/group-access` | Helpery dostępu grupowego | Współdzielone helpery decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm` | Helpery bezpośrednich DM | Współdzielone helpery auth/guard bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Współdzielone helpery rozszerzeń | Prymitywy helperów kanału pasywnego/statusu i ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpery celów Webhooków | Rejestr celów Webhooków i helpery instalacji tras |
  | `plugin-sdk/webhook-path` | Helpery ścieżek Webhooków | Helpery normalizacji ścieżek Webhooków |
  | `plugin-sdk/web-media` | Współdzielone helpery mediów webowych | Helpery ładowania mediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Re-eksport Zod | Re-eksportowany `zod` dla odbiorców plugin SDK |
  | `plugin-sdk/memory-core` | Zbundlowane helpery memory-core | Powierzchnia helperów menedżera pamięci/konfiguracji/plików/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik bazowy hosta pamięci | Eksporty silnika bazowego hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta pamięci | Kontrakty embeddingów pamięci, dostęp do rejestru, lokalny dostawca oraz generyczne helpery wsadowe/zdalne; konkretni zdalni dostawcy znajdują się we własnych pluginach |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik magazynu hosta pamięci | Eksporty silnika magazynu hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodalne helpery hosta pamięci | Multimodalne helpery hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci | Helpery zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci | Helpery sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci | Helpery dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci | Helpery statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Helpery runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Główny runtime hosta pamięci | Helpery głównego runtime hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci | Helpery plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias głównego runtime hosta pamięci | Neutralny względem dostawcy alias helperów głównego runtime hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias helperów dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/runtime hosta pamięci | Neutralny względem dostawcy alias helperów plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Helpery zarządzanego markdown | Współdzielone helpery zarządzanego markdown dla pluginów powiązanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada runtime menedżera wyszukiwania active-memory |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny względem dostawcy alias helperów statusu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Zbundlowane helpery memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracyjnym, a nie pełną powierzchnią
SDK. Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre powierzchnie helperów zbundlowanych pluginów, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz `plugin-sdk/matrix*`. Pozostają one eksportowane na potrzeby
utrzymania i zgodności zbundlowanych pluginów, ale celowo
pominięto je we wspólnej tabeli migracyjnej i nie są zalecanym celem dla
nowego kodu pluginów.

Ta sama zasada dotyczy innych rodzin zbundlowanych helperów, takich jak:

- helpery obsługi przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- zbundlowane powierzchnie helperów/pluginów, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` oraz `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską
powierzchnię helpera tokenu `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` oraz `resolveCopilotApiToken`.

Używaj najwęższego importu, który pasuje do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` lub zapytaj na Discord.

## Aktywne deprecjacje

Węższe deprecjacje, które obowiązują w całym plugin SDK, kontrakcie dostawcy,
powierzchni runtime i manifeście. Każda z nich nadal działa dzisiaj, ale zostanie usunięta
w przyszłym głównym wydaniu. Wpis pod każdym elementem mapuje stare API na jego
kanoniczny zamiennik.

<AccordionGroup>
  <Accordion title="buildHelpery command-auth → command-status">
    **Stare (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nowe (`openclaw/plugin-sdk/command-status`)**: te same sygnatury, te same
    eksporty — tylko importowane z węższej podścieżki. `command-auth`
    ponownie eksportuje je jako stuby zgodności.

    ```typescript
    // Przed
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Po
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helpery bramkowania wzmianek → resolveInboundMentionDecision">
    **Stare**: `resolveInboundMentionRequirement({ facts, policy })` oraz
    `shouldDropInboundForMention(...)` z
    `openclaw/plugin-sdk/channel-inbound` lub
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nowe**: `resolveInboundMentionDecision({ facts, policy })` — zwraca
    pojedynczy obiekt decyzji zamiast dwóch rozdzielonych wywołań.

    Zależne pluginy kanałów (Slack, Discord, Matrix, Microsoft Teams) zostały już
    przełączone.

  </Accordion>

  <Accordion title="Shim runtime kanału i helpery działań kanału">
    `openclaw/plugin-sdk/channel-runtime` jest shimem zgodności dla starszych
    pluginów kanałów. Nie importuj go w nowym kodzie; używaj
    `openclaw/plugin-sdk/channel-runtime-context` do rejestrowania obiektów
    runtime.

    Helpery `channelActions*` w `openclaw/plugin-sdk/channel-actions` są
    przestarzałe razem z surowymi eksportami kanału „actions”. Zamiast tego udostępniaj
    zdolności przez semantyczną powierzchnię `presentation` — pluginy kanałów
    deklarują, co renderują (karty, przyciski, selektory), a nie które surowe
    nazwy akcji akceptują.

  </Accordion>

  <Accordion title="Helper tool() dostawcy web search → createTool() w pluginie">
    **Stare**: fabryka `tool()` z `openclaw/plugin-sdk/provider-web-search`.

    **Nowe**: implementuj `createTool(...)` bezpośrednio w pluginie dostawcy.
    OpenClaw nie potrzebuje już helpera SDK do rejestrowania wrappera narzędzia.

  </Accordion>

  <Accordion title="Kanałowe koperty plaintext → BodyForAgent">
    **Stare**: `formatInboundEnvelope(...)` (oraz
    `ChannelMessageForAgent.channelEnvelope`) do budowy płaskiej koperty promptu plaintext
    z przychodzących wiadomości kanału.

    **Nowe**: `BodyForAgent` oraz strukturalne bloki kontekstu użytkownika. Pluginy kanałów
    dołączają metadane routingu (wątek, temat, reply-to, reakcje) jako
    typowane pola zamiast konkatenować je w ciąg promptu. Helper
    `formatAgentEnvelope(...)` jest nadal wspierany dla syntetyzowanych
    kopert skierowanych do asystenta, ale przychodzące koperty plaintext są już wycofywane.

    Obszary, których to dotyczy: `inbound_claim`, `message_received` oraz każdy własny
    plugin kanału, który post-processował tekst `channelEnvelope`.

  </Accordion>

  <Accordion title="Typy wykrywania dostawców → typy katalogu dostawców">
    Cztery aliasy typów wykrywania są teraz cienkimi wrapperami nad typami
    z ery katalogu:

    | Stary alias                 | Nowy typ                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Dodatkowo starszy statyczny zestaw `ProviderCapabilities` — pluginy dostawców
    powinny dołączać fakty zdolności przez kontrakt runtime dostawcy,
    a nie przez statyczny obiekt.

  </Accordion>

  <Accordion title="Hooki zasad Thinking → resolveThinkingProfile">
    **Stare** (trzy oddzielne hooki w `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` oraz
    `resolveDefaultThinkingLevel(ctx)`.

    **Nowe**: pojedyncze `resolveThinkingProfile(ctx)`, które zwraca
    `ProviderThinkingProfile` z kanonicznym `id`, opcjonalną `label` oraz
    uporządkowaną listą poziomów. OpenClaw automatycznie obniża nieaktualne zapisane wartości według
    rangi profilu.

    Zaimplementuj jeden hook zamiast trzech. Starsze hooki nadal działają podczas
    okna deprecjacji, ale nie są składane z wynikiem profilu.

  </Accordion>

  <Accordion title="Fallback zewnętrznego dostawcy OAuth → contracts.externalAuthProviders">
    **Stare**: implementacja `resolveExternalOAuthProfiles(...)` bez
    deklarowania dostawcy w manifeście plugina.

    **Nowe**: zadeklaruj `contracts.externalAuthProviders` w manifeście plugina
    **oraz** zaimplementuj `resolveExternalAuthProfiles(...)`. Stara ścieżka
    „auth fallback” emituje ostrzeżenie w runtime i zostanie usunięta.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Wyszukiwanie env-var dostawcy → setup.providers[].envVars">
    **Stare** pole manifestu: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nowe**: odzwierciedl to samo wyszukiwanie env-var w `setup.providers[].envVars`
    w manifeście. Konsoliduje to metadane env konfiguracji/statusu w jednym
    miejscu i pozwala uniknąć uruchamiania runtime plugina tylko po to, by odpowiedzieć na
    wyszukiwania env-var.

    `providerAuthEnvVars` pozostaje wspierane przez adapter zgodności
    do końca okna deprecjacji.

  </Accordion>

  <Accordion title="Rejestracja pluginów pamięci → registerMemoryCapability">
    **Stare**: trzy oddzielne wywołania —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nowe**: jedno wywołanie na API stanu pamięci —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Te same sloty, jedno wywołanie rejestracji. Addytywne helpery pamięci
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) nie są objęte tą zmianą.

  </Accordion>

  <Accordion title="Zmieniono nazwy typów wiadomości sesji subagenta">
    Dwa starsze aliasy typów są nadal eksportowane z `src/plugins/runtime/types.ts`:

    | Stare                           | Nowe                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metoda runtime `readSession` jest przestarzała na rzecz
    `getSessionMessages`. Ta sama sygnatura; stara metoda wywołuje
    nową.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Stare**: `runtime.tasks.flow` (liczba pojedyncza) zwracało aktywny accessor TaskFlow.

    **Nowe**: `runtime.tasks.flows` (liczba mnoga) zwraca dostęp do TaskFlow oparty na DTO,
    który jest bezpieczny do importu i nie wymaga załadowania pełnego runtime zadań.

    ```typescript
    // Przed
    const flow = api.runtime.tasks.flow(ctx);
    // Po
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Osadzone fabryki rozszerzeń → middleware wyników narzędzi agenta">
    Omówiono to wyżej w sekcji „Jak przeprowadzić migrację → Przenieś rozszerzenia wyników narzędzi Pi do
    middleware”. Uwzględniono tutaj dla kompletności: usunięta ścieżka tylko dla Pi
    `api.registerEmbeddedExtensionFactory(...)` została zastąpiona przez
    `api.registerAgentToolResultMiddleware(...)` z jawną listą runtime
    w `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` ponownie eksportowane z `openclaw/plugin-sdk` jest teraz
    jednolinijkowym aliasem dla `OpenClawConfig`. Preferuj nazwę kanoniczną.

    ```typescript
    // Przed
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Po
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecjacje na poziomie rozszerzeń (wewnątrz zbundlowanych pluginów kanałów/dostawców w
`extensions/`) są śledzone we własnych barrelach `api.ts` i `runtime-api.ts`.
Nie wpływają na kontrakty pluginów firm trzecich i nie są tutaj wymienione.
Jeśli bezpośrednio korzystasz z lokalnego barrel zbundlowanego plugina, przed
aktualizacją przeczytaj komentarze o deprecjacjach w tym barrelu.
</Note>

## Harmonogram usunięcia

| Kiedy                   | Co się dzieje                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Teraz**                | Przestarzałe powierzchnie emitują ostrzeżenia runtime                               |
| **Następne główne wydanie** | Przestarzałe powierzchnie zostaną usunięte; pluginy, które nadal z nich korzystają, przestaną działać |

Wszystkie pluginy rdzenia zostały już zmigrowane. Zewnętrzne pluginy powinny przeprowadzić migrację
przed następnym głównym wydaniem.

## Tymczasowe wyciszanie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka awaryjna, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) — zbuduj swój pierwszy plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odwołanie do importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — tworzenie pluginów dostawców
- [Wewnętrzne elementy pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest plugina](/pl/plugins/manifest) — odwołanie do schematu manifestu
