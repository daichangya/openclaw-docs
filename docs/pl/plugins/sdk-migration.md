---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Używałeś `api.registerEmbeddedExtensionFactory` przed OpenClaw 2026.4.25
    - Aktualizujesz Plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migracja ze starszej warstwy zgodności wstecznej do nowoczesnego Plugin SDK
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-26T11:37:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw przeszedł ze szerokiej warstwy zgodności wstecznej do nowoczesnej architektury pluginów
z ukierunkowanymi, udokumentowanymi importami. Jeśli twój Plugin został zbudowany przed
nową architekturą, ten przewodnik pomoże ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie szerokie powierzchnie, które pozwalały pluginom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który re-eksportował dziesiątki
  helperów. Został wprowadzony, aby utrzymać działanie starszych pluginów opartych na hookach, podczas gdy
  budowana była nowa architektura pluginów.
- **`openclaw/extension-api`** — most, który dawał pluginom bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.
- **`api.registerEmbeddedExtensionFactory(...)`** — usunięty hook dołączonych
  extension tylko dla Pi, który mógł obserwować zdarzenia embedded-runner, takie jak
  `tool_result`.

Te szerokie powierzchnie importu są teraz **przestarzałe**. Nadal działają w runtime,
ale nowe pluginy nie mogą ich używać, a istniejące pluginy powinny przeprowadzić migrację przed
następnym głównym wydaniem, które je usunie. API rejestracji embedded extension factory tylko dla Pi
zostało usunięte; zamiast niego użyj middleware wyniku narzędzia.

OpenClaw nie usuwa ani nie reinterpretuję udokumentowanego zachowania pluginów w tej samej
zmianie, która wprowadza zamiennik. Zmiany łamiące kontrakt muszą najpierw przejść przez
adapter zgodności, diagnostykę, dokumentację i okno deprecacji.
Dotyczy to importów SDK, pól manifestu, API konfiguracji, hooków i zachowania rejestracji runtime.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym głównym wydaniu.
  Pluginy, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
  Rejestracje embedded extension factory tylko dla Pi już nie są ładowane.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Wolny start** — zaimportowanie jednego helpera ładowało dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie re-eksporty ułatwiały tworzenie cykli importu
- **Niejasna powierzchnia API** — nie było sposobu, aby stwierdzić, które eksporty są stabilne, a które wewnętrzne

Nowoczesne Plugin SDK rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samowystarczalnym modułem o jasno określonym celu i udokumentowanym kontrakcie.

Starsze pomocnicze seamy wygody providera dla dołączonych kanałów również zniknęły. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seamy pomocnicze oznaczone marką kanału oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie
stabilnymi kontraktami pluginów. Używaj zamiast tego wąskich generycznych subścieżek SDK. Wewnątrz
obszaru roboczego dołączonego pluginu przechowuj helpery należące do providera we własnym
`api.ts` lub `runtime-api.ts` tego pluginu.

Bieżące przykłady dołączonych providerów:

- Anthropic przechowuje helpery strumieni specyficzne dla Claude we własnym seamu `api.ts` /
  `contract-api.ts`
- OpenAI przechowuje buildery providera, helpery modeli domyślnych i buildery providera realtime
  we własnym `api.ts`
- OpenRouter przechowuje builder providera oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Polityka zgodności

Dla zewnętrznych pluginów prace nad zgodnością przebiegają w tej kolejności:

1. dodaj nowy kontrakt
2. zachowaj stare zachowanie podłączone przez adapter zgodności
3. emituj diagnostykę lub ostrzeżenie wskazujące starą ścieżkę i zamiennik
4. obejmij testami obie ścieżki
5. udokumentuj deprecację i ścieżkę migracji
6. usuń dopiero po ogłoszonym oknie migracji, zwykle w głównym wydaniu

Jeśli pole manifestu jest nadal akceptowane, autorzy pluginów mogą nadal z niego korzystać,
dopóki dokumentacja i diagnostyka nie powiedzą inaczej. Nowy kod powinien preferować
udokumentowany zamiennik, ale istniejące pluginy nie powinny przestawać działać podczas zwykłych
pomniejszych wydań.

## Jak przeprowadzić migrację

<Steps>
  <Step title="Zmigruj extension wyniku narzędzia Pi do middleware">
    Dołączone pluginy muszą zastąpić handlery wyniku narzędzia tylko dla Pi
    `api.registerEmbeddedExtensionFactory(...)`
    middleware neutralnym względem runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Jednocześnie zaktualizuj manifest pluginu:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Zewnętrzne pluginy nie mogą rejestrować middleware wyniku narzędzia, ponieważ
    może ono przepisywać wynik narzędzia o wysokim zaufaniu, zanim model go zobaczy.

  </Step>

  <Step title="Zmigruj handlery approval-native do faktów możliwości">
    Pluginy kanałów obsługujące approval udostępniają teraz natywne zachowanie approval przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr kontekstu runtime.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś auth/dostarczanie specyficzne dla approval ze starszego okablowania `plugin.auth` /
      `plugin.approvals` na `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu
      pluginu kanału; przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów login/logout kanału; hooki
      auth approval nie są już odczytywane przez core
    - Rejestruj obiekty runtime należące do kanału, takie jak klienty, tokeny lub aplikacje
      Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj należących do pluginu komunikatów reroute z natywnych handlerów approval;
      core zarządza teraz komunikatami routed-elsewhere na podstawie rzeczywistych wyników dostarczenia
    - Gdy przekazujesz `channelRuntime` do `createChannelManager(...)`, podaj
      prawdziwą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby poznać bieżący układ
    capability approval.

  </Step>

  <Step title="Przeprowadź audyt zachowania fallback wrappera Windows">
    Jeśli twój Plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` kończą się teraz fail-closed, chyba że jawnie przekażesz
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

    Jeśli twój kod wywołujący nie polega celowo na fallbacku przez powłokę, nie ustawiaj
    `allowShellFallback`, tylko obsłuż zgłoszony błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj swój Plugin pod kątem importów z dowolnej z przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni mapuje się na określoną nowoczesną ścieżkę importu:

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

    Dla helperów po stronie hosta użyj wstrzykniętego runtime pluginu zamiast
    importować je bezpośrednio:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych starszych helperów mostu:

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

## Dokumentacja ścieżek importu

  <Accordion title="Tabela typowych ścieżek importu">
  | Ścieżka importu | Cel | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny helper entry pluginu | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy re-eksport dla definicji/builderów entry kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entry pojedynczego providera | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery entry kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji | Monity allowlisty, buildery statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery runtime czasu konfiguracji | Bezpieczne importowo adaptery patch konfiguracji, helpery lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery listy kont/konfiguracji/bramki akcji |
  | `plugin-sdk/account-id` | Helpery account-id | `DEFAULT_ACCOUNT_ID`, normalizacja account-id |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont | Helpery wyszukiwania kont + fallbacku do domyślnego |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery listy kont/akcji na kontach |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Okablowanie prefiksu odpowiedzi + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematów konfiguracji | Współdzielone prymitywy schematu konfiguracji kanałów; eksporty nazwanych schematów bundled-channel są tylko starszą zgodnością |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozstrzyganie polityki grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpery statusu kont i cyklu życia strumienia draft | `createAccountStatusSink`, helpery finalizacji podglądu draftu |
  | `plugin-sdk/inbound-envelope` | Helpery inbound envelope | Współdzielone helpery trasy + buildera envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi przychodzących | Współdzielone helpery record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-send-deps` | Helpery zależności wysyłki wychodzącej | Lekkie wyszukiwanie `resolveOutboundSendDep` bez importowania pełnego outbound runtime |
  | `plugin-sdk/outbound-runtime` | Helpery outbound runtime | Helpery dostarczania wychodzącego, delegata tożsamości/wysyłki, sesji, formatowania i planowania payloadu |
  | `plugin-sdk/thread-bindings-runtime` | Helpery powiązań wątków | Helpery cyklu życia powiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze helpery payloadu mediów | Builder payloadu mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim zgodności | Tylko starsze narzędzia channel runtime |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwały magazyn pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery runtime | Helpery runtime/logowania/backup/instalacji pluginów |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime | Helpery loggera/środowiska runtime, timeoutu, retry i backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone helpery plugin runtime | Helpery poleceń/hooków/http/interaktywnych pluginu |
  | `plugin-sdk/hook-runtime` | Helpery pipeline hooków | Współdzielone helpery pipeline Webhooków/hooków wewnętrznych |
  | `plugin-sdk/lazy-runtime` | Helpery lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Współdzielone helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery CLI runtime | Helpery formatowania poleceń, waits, wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Klient Gateway i helpery patch statusu kanału |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery poleceń Telegram | Helpery walidacji poleceń Telegram stabilne względem fallbacku, gdy powierzchnia kontraktu dołączonego Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów approval | Helpery payloadu approval exec/plugin, capability/profilu approval, natywnego routingu/runtime approval oraz formatowania ścieżki wyświetlania structured approval |
  | `plugin-sdk/approval-auth-runtime` | Helpery auth approval | Rozstrzyganie approvera, auth akcji same-chat |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta approval | Helpery natywnego profilu/filtra approval exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania approval | Adaptery natywnego capability/dostarczania approval |
  | `plugin-sdk/approval-gateway-runtime` | Helpery Gateway approval | Współdzielony helper rozstrzygania Gateway approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpery adaptera approval | Lekkie helpery ładowania natywnego adaptera approval dla hot entrypointów kanałów |
  | `plugin-sdk/approval-handler-runtime` | Helpery handlera approval | Szersze helpery runtime handlera approval; preferuj węższe seamy adapter/gateway, gdy wystarczają |
  | `plugin-sdk/approval-native-runtime` | Helpery targetu approval | Helpery natywnego targetu approval/powiązań kont |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi approval | Helpery payloadu odpowiedzi approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpery channel runtime-context | Generyczne helpery register/get/watch channel runtime-context |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Współdzielone helpery trust, bramkowania DM, external-content i kolekcji sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery polityki SSRF | Helpery allowlisty hostów i polityki sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Helpery SSRF runtime | Helpery pinned-dispatcher, guarded fetch, polityki SSRF |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonego cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Helpery wrapped fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery retry | `RetryConfig`, `retryAsync`, runnery polityk |
  | `plugin-sdk/allow-from` | Formatowanie allowlisty | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlisty | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i helpery powierzchni poleceń | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru poleceń, w tym formatowanie dynamicznego menu argumentów |
  | `plugin-sdk/command-status` | Rendery statusu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie secret input | Helpery secret input |
  | `plugin-sdk/webhook-ingress` | Helpery żądań Webhook | Narzędzia celu Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpery guardów żądań Webhook | Helpery odczytu/limitów body żądania |
  | `plugin-sdk/reply-runtime` | Współdzielony reply runtime | Inbound dispatch, Heartbeat, planer odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatch odpowiedzi | Finalizacja, dispatch providera i helpery etykiet rozmowy |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery chunków odpowiedzi | Helpery chunkowania tekstu/markdown |
  | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji | Helpery ścieżek magazynu + updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogu stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/klucza sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji klucza sesji |
  | `plugin-sdk/status-helpers` | Helpery statusu kanału | Buildery podsumowań statusu kanału/konta, domyślne wartości stanu runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery rozstrzygania targetu | Współdzielone helpery rozstrzygania targetu |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji ciągów | Helpery normalizacji slugów/ciągów |
  | `plugin-sdk/request-url` | Helpery URL żądania | Wyodrębnianie ciągów URL z wejść podobnych do żądań |
  | `plugin-sdk/run-command` | Helpery poleceń z timeoutem | Runner poleceń z timeoutem ze znormalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Wspólne czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Ekstrakcja payloadu narzędzia | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Ekstrakcja wysyłki narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Współdzielone helpery ścieżek tymczasowych pobrań |
  | `plugin-sdk/logging-core` | Helpery logowania | Helpery loggera subsystemu i redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel markdown | Helpery trybów tabel markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy payloadu odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji providerów lokalnych/self-hosted | Helpery discovery/konfiguracji providerów self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji providerów self-hosted zgodnych z OpenAI | Te same helpery discovery/konfiguracji providerów self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helpery auth providera w runtime | Helpery rozstrzygania kluczy API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji klucza API providera | Helpery onboardingu/zapisu profilu klucza API |
  | `plugin-sdk/provider-auth-result` | Helpery wyniku auth providera | Standardowy builder wyniku auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania providera | Współdzielone helpery interaktywnego logowania |
  | `plugin-sdk/provider-selection-runtime` | Helpery wyboru providera | Wybór providera skonfigurowanego lub auto oraz scalanie surowej konfiguracji providera |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych env providera | Helpery wyszukiwania zmiennych env auth providera |
  | `plugin-sdk/provider-model-shared` | Współdzielone helpery modelu/replay providera | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityki replay, helpery endpointów providera i helpery normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone helpery katalogu providera | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patche onboardingu providera | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP providera | Generyczne helpery HTTP/capability endpointów providera, w tym helpery formularzy multipart dla transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch providera | Helpery rejestracji/cache providera web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpery konfiguracji web-search providera | Wąskie helpery konfiguracji/poświadczeń web-search dla providerów, którzy nie potrzebują okablowania plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | Helpery kontraktu web-search providera | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Helpery web-search providera | Helpery rejestracji/cache/runtime providera web-search |
  | `plugin-sdk/provider-tools` | Helpery zgodności narzędzi/schematu providera | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostyka schematu Gemini oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery użycia providera | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne helpery użycia providera |
  | `plugin-sdk/provider-stream` | Helpery wrappera strumienia providera | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone helpery wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpery transportu providera | Natywne helpery transportu providera, takie jak guarded fetch, transformacje wiadomości transportowych i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka async | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone helpery mediów | Helpery fetch/transform/store mediów oraz buildery payloadów mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone helpery generowania mediów | Współdzielone helpery failover, wyboru kandydatów i komunikatów o brakującym modelu dla generowania image/video/music |
  | `plugin-sdk/media-understanding` | Helpery rozumienia mediów | Typy providerów rozumienia mediów oraz eksporty helperów image/audio skierowane do providerów |
  | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu | Usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkowania/tabel markdown, helpery redakcji, helpery tagów dyrektyw, narzędzia bezpiecznego tekstu oraz powiązane helpery tekstu/logowania |
  | `plugin-sdk/text-chunking` | Helpery chunkowania tekstu | Helper chunkowania tekstu wychodzącego |
  | `plugin-sdk/speech` | Helpery mowy | Typy providerów mowy oraz helpery dyrektyw, rejestru i walidacji skierowane do providerów |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy providerów mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery transkrypcji realtime | Typy providerów, helpery rejestru i współdzielony helper sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Helpery głosu realtime | Typy providerów, helpery rejestru/rozstrzygania i helpery sesji bridge |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania image | Typy generowania image, helpery failover, auth i rejestru |
  | `plugin-sdk/music-generation` | Helpery generowania muzyki | Typy providera/żądania/wyniku generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, helpery failover, wyszukiwanie providera i parsowanie model-ref |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy providera/żądania/wyniku generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, helpery failover, wyszukiwanie providera i parsowanie model-ref |
  | `plugin-sdk/interactive-runtime` | Helpery odpowiedzi interaktywnych | Normalizacja/redukcja payloadu odpowiedzi interaktywnej |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpery zapisu konfiguracji kanału | Helpery autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Wspólne preludium kanału | Eksporty współdzielonego preludium pluginu kanału |
  | `plugin-sdk/channel-status` | Helpery statusu kanału | Współdzielone helpery snapshotu/podsumowania statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlisty | Helpery edycji/odczytu konfiguracji allowlisty |
  | `plugin-sdk/group-access` | Helpery dostępu grupowego | Współdzielone helpery decyzji group-access |
  | `plugin-sdk/direct-dm` | Helpery direct-DM | Współdzielone helpery auth/guard direct-DM |
  | `plugin-sdk/extension-shared` | Współdzielone helpery extension | Prymitywy helperów passive-channel/status i ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpery targetów Webhook | Rejestr targetów Webhook i helpery instalacji tras |
  | `plugin-sdk/webhook-path` | Helpery ścieżek Webhook | Helpery normalizacji ścieżek Webhook |
  | `plugin-sdk/web-media` | Współdzielone helpery web media | Helpery ładowania zdalnych/lokalnych mediów |
  | `plugin-sdk/zod` | Re-eksport Zod | Re-eksportowane `zod` dla konsumentów Plugin SDK |
  | `plugin-sdk/memory-core` | Dołączone helpery memory-core | Powierzchnia helperów menedżera/konfiguracji/pliku/CLI pamięci |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik foundation hosta pamięci | Eksporty silnika foundation hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta pamięci | Kontrakty embeddingów pamięci, dostęp do rejestru, lokalny provider i generyczne helpery batch/zdalne; konkretni zdalni providerzy znajdują się w należących do nich pluginach |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik przechowywania hosta pamięci | Eksporty silnika przechowywania hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci | Helpery multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci | Helpery zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci | Helpery sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci | Helpery dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci | Helpery statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Helpery runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime hosta pamięci | Helpery core runtime hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci | Helpery plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias core runtime hosta pamięci | Neutralny względem dostawcy alias helperów core runtime hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias helperów dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/runtime hosta pamięci | Neutralny względem dostawcy alias helperów plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Helpery managed markdown | Współdzielone helpery managed-markdown dla pluginów sąsiadujących z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Lazy fasada runtime menedżera wyszukiwania Active Memory |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny względem dostawcy alias helperów statusu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Dołączone helpery memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracji, a nie pełną powierzchnią
SDK. Pełna lista ponad 200 entrypointów znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre seamy helperów dołączonych pluginów, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz `plugin-sdk/matrix*`. Są one nadal eksportowane
na potrzeby utrzymania dołączonych pluginów i zgodności, ale celowo
pominięto je we wspólnej tabeli migracji i nie są zalecanym celem dla
nowego kodu pluginów.

Ta sama zasada dotyczy innych rodzin dołączonych helperów, takich jak:

- helpery wsparcia przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- powierzchnie helper/pluginów dołączonych, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`
  i `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` udostępnia obecnie wąską powierzchnię helpera tokenu:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` oraz `resolveCopilotApiToken`.

Używaj najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` albo zapytaj na Discord.

## Aktywne deprecacje

Węższe deprecacje, które dotyczą całego Plugin SDK, kontraktu providera,
powierzchni runtime i manifestu. Każda z nich nadal działa dziś, ale zostanie usunięta
w przyszłym głównym wydaniu. Wpis pod każdym elementem mapuje stare API na jego
kanoniczny zamiennik.

<AccordionGroup>
  <Accordion title="buildHelpMessage w command-auth → command-status">
    **Stare (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nowe (`openclaw/plugin-sdk/command-status`)**: te same sygnatury, te same
    eksporty — tylko importowane z węższej subścieżki. `command-auth`
    re-eksportuje je jako stuby zgodności.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helpery bramkowania wzmianek → resolveInboundMentionDecision">
    **Stare**: `resolveInboundMentionRequirement({ facts, policy })` i
    `shouldDropInboundForMention(...)` z
    `openclaw/plugin-sdk/channel-inbound` lub
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nowe**: `resolveInboundMentionDecision({ facts, policy })` — zwraca
    pojedynczy obiekt decyzji zamiast dwóch rozdzielonych wywołań.

    Pluginy kanałów downstream (Slack, Discord, Matrix, Microsoft Teams) już się przełączyły.

  </Accordion>

  <Accordion title="Shim channel runtime i helpery działań kanału">
    `openclaw/plugin-sdk/channel-runtime` to shim zgodności dla starszych
    pluginów kanałów. Nie importuj go z nowego kodu; używaj
    `openclaw/plugin-sdk/channel-runtime-context` do rejestrowania obiektów runtime.

    Helpery `channelActions*` w `openclaw/plugin-sdk/channel-actions` są
    przestarzałe razem z surowymi eksportami kanałów „actions”. Udostępniaj
    możliwości przez semantyczną powierzchnię `presentation` — pluginy kanałów
    deklarują, co renderują (cards, buttons, selects), zamiast tego, jakie surowe
    nazwy akcji akceptują.

  </Accordion>

  <Accordion title="Helper tool() providera web search → createTool() w pluginie">
    **Stare**: fabryka `tool()` z `openclaw/plugin-sdk/provider-web-search`.

    **Nowe**: implementuj `createTool(...)` bezpośrednio w pluginie providera.
    OpenClaw nie potrzebuje już helpera SDK do rejestracji wrappera narzędzia.

  </Accordion>

  <Accordion title="Jawnotekstowe envelope kanału → BodyForAgent">
    **Stare**: `formatInboundEnvelope(...)` (oraz
    `ChannelMessageForAgent.channelEnvelope`) do budowania płaskiego envelope promptu
    w jawnym tekście z przychodzących wiadomości kanału.

    **Nowe**: `BodyForAgent` plus strukturalne bloki kontekstu użytkownika. Pluginy
    kanałów dołączają metadane routingu (wątek, temat, reply-to, reakcje) jako
    typowane pola zamiast doklejać je do ciągu promptu. Helper
    `formatAgentEnvelope(...)` jest nadal obsługiwany dla syntetyzowanych
    envelope widocznych dla asystenta, ale przychodzące envelope jawnotekstowe są wycofywane.

    Dotknięte obszary: `inbound_claim`, `message_received` oraz wszelkie niestandardowe
    pluginy kanałów, które przetwarzały tekst `channelEnvelope` po stronie post-processingu.

  </Accordion>

  <Accordion title="Typy discovery providera → typy katalogu providera">
    Cztery aliasy typów discovery są teraz cienkimi wrapperami nad typami
    ery katalogu:

    | Stary alias                 | Nowy typ                  |
    | --------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`    | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`  | `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult`   | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery`   | `ProviderPluginCatalog`   |

    Dodatkowo starszy statyczny zbiór `ProviderCapabilities` — pluginy providerów
    powinny dołączać fakty możliwości przez kontrakt runtime providera,
    a nie przez obiekt statyczny.

  </Accordion>

  <Accordion title="Hooki polityki thinking → resolveThinkingProfile">
    **Stare** (trzy osobne hooki w `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` i
    `resolveDefaultThinkingLevel(ctx)`.

    **Nowe**: pojedyncze `resolveThinkingProfile(ctx)`, które zwraca
    `ProviderThinkingProfile` z kanonicznym `id`, opcjonalnym `label` i
    rankingowaną listą poziomów. OpenClaw automatycznie degraduje stare zapisane
    wartości według rangi profilu.

    Zaimplementuj jeden hook zamiast trzech. Starsze hooki nadal działają podczas
    okna deprecacji, ale nie są składane z wynikiem profilu.

  </Accordion>

  <Accordion title="Fallback zewnętrznego providera OAuth → contracts.externalAuthProviders">
    **Stare**: implementacja `resolveExternalOAuthProfiles(...)` bez
    deklarowania providera w manifeście pluginu.

    **Nowe**: zadeklaruj `contracts.externalAuthProviders` w manifeście pluginu
    **oraz** zaimplementuj `resolveExternalAuthProfiles(...)`. Stara ścieżka
    „fallback auth” emituje ostrzeżenie w runtime i zostanie usunięta.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup zmiennych env providera → setup.providers[].envVars">
    **Stare** pole manifestu: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nowe**: odwzoruj ten sam lookup zmiennych env do `setup.providers[].envVars`
    w manifeście. Konsoliduje to metadane env setup/status w jednym
    miejscu i pozwala uniknąć uruchamiania runtime pluginu tylko po to, by odpowiedzieć na
    lookup zmiennych env.

    `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności
    aż do zamknięcia okna deprecacji.

  </Accordion>

  <Accordion title="Rejestracja pluginu pamięci → registerMemoryCapability">
    **Stare**: trzy osobne wywołania —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nowe**: jedno wywołanie na API stanu pamięci —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Te same sloty, jedno wywołanie rejestracji. Addytywne helpery pamięci
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) nie są dotknięte.

  </Accordion>

  <Accordion title="Zmiana nazw typów wiadomości sesji subagenta">
    Dwa starsze aliasy typów nadal eksportowane z `src/plugins/runtime/types.ts`:

    | Stare                         | Nowe                              |
    | ----------------------------- | --------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metoda runtime `readSession` jest przestarzała na rzecz
    `getSessionMessages`. Ta sama sygnatura; stara metoda wywołuje
    nową.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Stare**: `runtime.tasks.flow` (liczba pojedyncza) zwracało aktywny accessor TaskFlow.

    **Nowe**: `runtime.tasks.flows` (liczba mnoga) zwraca oparty na DTO dostęp do TaskFlow,
    który jest bezpieczny importowo i nie wymaga załadowania pełnego task runtime.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → middleware wyniku narzędzia agenta">
    Omówione powyżej w „Jak przeprowadzić migrację → Zmigruj extension wyniku narzędzia Pi do
    middleware”. Dla kompletności: usunięta ścieżka
    `api.registerEmbeddedExtensionFactory(...)` tylko dla Pi została zastąpiona przez
    `api.registerAgentToolResultMiddleware(...)` z jawną listą runtime
    w `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` re-eksportowany z `openclaw/plugin-sdk` jest teraz
    jednolinijkowym aliasem `OpenClawConfig`. Preferuj nazwę kanoniczną.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecacje na poziomie extension (wewnątrz dołączonych pluginów kanałów/providerów w
`extensions/`) są śledzone we własnych barrelach `api.ts` i `runtime-api.ts`.
Nie wpływają na kontrakty pluginów firm trzecich i nie są tutaj wymienione.
Jeśli bezpośrednio korzystasz z lokalnego barrela dołączonego pluginu, przed
aktualizacją przeczytaj komentarze o deprecacji w tym barrelu.
</Note>

## Harmonogram usunięcia

| Kiedy                  | Co się dzieje                                                         |
| ---------------------- | --------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia runtime                 |
| **Następne główne wydanie** | Przestarzałe powierzchnie zostaną usunięte; pluginy nadal z nich korzystające przestaną działać |

Wszystkie pluginy core zostały już zmigrowane. Zewnętrzne pluginy powinny przeprowadzić migrację
przed następnym głównym wydaniem.

## Tymczasowe wyciszanie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka awaryjna, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) — zbuduj swój pierwszy Plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja subścieżek importu
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — budowanie pluginów kanałów
- [Pluginy providerów](/pl/plugins/sdk-provider-plugins) — budowanie pluginów providerów
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest pluginu](/pl/plugins/manifest) — dokumentacja schematu manifestu
