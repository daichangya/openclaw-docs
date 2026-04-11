---
read_when:
    - Tworzysz nowy plugin providera modeli for OpenClaw
    - Chcesz dodać do OpenClaw proxy zgodne z OpenAI lub niestandardowy LLM
    - Musisz zrozumieć uwierzytelnianie providera, katalogi i hooki runtime
sidebarTitle: Provider Plugins
summary: Przewodnik krok po kroku po tworzeniu pluginu providera modeli dla OpenClaw
title: Tworzenie pluginów providerów
x-i18n:
    generated_at: "2026-04-11T02:46:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d7c5da6556dc3d9673a31142ff65eb67ddc97fc0c1a6f4826a2c7693ecd5e3
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Tworzenie pluginów providerów

Ten przewodnik przeprowadza przez tworzenie pluginu providera, który dodaje provider modeli
(LLM) do OpenClaw. Na końcu będziesz mieć providera z katalogiem modeli,
uwierzytelnianiem kluczem API i dynamicznym rozpoznawaniem modeli.

<Info>
  Jeśli nie tworzyłeś wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

<Tip>
  Pluginy providerów dodają modele do zwykłej pętli inferencji OpenClaw. Jeśli model
  musi działać przez natywny demon agenta, który zarządza wątkami, kompaktacją lub zdarzeniami narzędzi,
  połącz providera z [uprzężą agenta](/pl/plugins/sdk-agent-harness),
  zamiast umieszczać szczegóły protokołu demona w rdzeniu.
</Tip>

## Omówienie krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pakiet i manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Manifest deklaruje `providerAuthEnvVars`, dzięki czemu OpenClaw może wykrywać
    poświadczenia bez ładowania runtime twojego pluginu. Dodaj `providerAuthAliases`,
    gdy wariant providera ma ponownie używać uwierzytelniania innego identyfikatora providera. `modelSupport`
    jest opcjonalne i pozwala OpenClaw automatycznie ładować twój plugin providera na podstawie skróconych
    identyfikatorów modeli takich jak `acme-large`, zanim hooki runtime będą dostępne. Jeśli publikujesz
    providera w ClawHub, pola `openclaw.compat` i `openclaw.build`
    są wymagane w `package.json`.

  </Step>

  <Step title="Zarejestruj providera">
    Minimalny provider potrzebuje `id`, `label`, `auth` i `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    To jest działający provider. Użytkownicy mogą teraz
    `openclaw onboard --acme-ai-api-key <key>` i wybrać
    `acme-ai/acme-large` jako swój model.

    Jeśli provider nadrzędny używa innych tokenów sterujących niż OpenClaw, dodaj
    małą dwukierunkową transformację tekstu zamiast zastępować ścieżkę strumieniowania:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` przepisuje końcowy prompt systemowy i treść wiadomości tekstowej przed
    transportem. `output` przepisuje delty tekstu asystenta i końcowy tekst, zanim
    OpenClaw przetworzy własne znaczniki sterujące lub dostarczanie kanałowe.

    W przypadku dołączonych providerów, które rejestrują tylko jednego providera tekstowego z
    uwierzytelnianiem kluczem API oraz pojedynczym runtime opartym na katalogu, preferuj węższy
    helper `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    Jeśli twój przepływ uwierzytelniania musi także aktualizować `models.providers.*`, aliasy oraz
    domyślny model agenta podczas onboardingu, użyj helperów presetów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe helpery to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` i
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint providera obsługuje strumieniowane bloki użycia na
    zwykłym transporcie `openai-completions`, preferuj współdzielone helpery katalogu z
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast wpisywać na sztywno sprawdzenia
    identyfikatora providera. `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie mapy możliwości endpointu,
    dzięki czemu natywne endpointy w stylu Moonshot/DashScope nadal mogą się włączyć, nawet gdy plugin używa niestandardowego identyfikatora providera.

  </Step>

  <Step title="Dodaj dynamiczne rozpoznawanie modeli">
    Jeśli twój provider akceptuje dowolne identyfikatory modeli (jak proxy lub router),
    dodaj `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog z powyższego przykładu

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    Jeśli rozpoznawanie wymaga wywołania sieciowego, użyj `prepareDynamicModel` do
    asynchronicznego przygotowania — po jego zakończeniu `resolveDynamicModel` zostanie uruchomione ponownie.

  </Step>

  <Step title="Dodaj hooki runtime (w razie potrzeby)">
    Większość providerów potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj hooki
    stopniowo, w miarę jak wymaga tego twój provider.

    Współdzielone buildery helperów obejmują teraz najczęstsze rodziny zgodności replay/narzędzi,
    więc pluginy zwykle nie muszą ręcznie podłączać każdego hooka osobno:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    Dostępne obecnie rodziny replay:

    | Rodzina | Co podłącza |
    | --- | --- |
    | `openai-compatible` | Współdzielone zasady replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym sanityzację identyfikatorów wywołań narzędzi, poprawki kolejności assistant-first oraz ogólną walidację tur Gemini tam, gdzie wymaga tego transport |
    | `anthropic-by-model` | Zasady replay świadome Claude wybierane według `modelId`, dzięki czemu transporty wiadomości Anthropic otrzymują czyszczenie bloków thinking specyficzne dla Claude tylko wtedy, gdy rozpoznany model jest faktycznie identyfikatorem Claude |
    | `google-gemini` | Natywne zasady replay Gemini plus sanityzację replay bootstrap i tryb wyjścia rozumowania z tagami |
    | `passthrough-gemini` | Sanityzację podpisu thought Gemini dla modeli Gemini uruchamianych przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisów bootstrap |
    | `hybrid-anthropic-openai` | Zasady hybrydowe dla providerów, którzy łączą powierzchnie modeli wiadomości Anthropic i zgodnych z OpenAI w jednym pluginie; opcjonalne usuwanie bloków thinking tylko dla Claude pozostaje ograniczone do strony Anthropic |

    Rzeczywiste dołączone przykłady:

    - `google` i `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` i `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` i `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` i `zai`: `openai-compatible`

    Dostępne obecnie rodziny strumieniowania:

    | Rodzina | Co podłącza |
    | --- | --- |
    | `google-thinking` | Normalizację ładunku thinking Gemini na współdzielonej ścieżce strumieniowania |
    | `kilocode-thinking` | Opakowanie rozumowania Kilo na współdzielonej ścieżce strumienia proxy, z pomijaniem wstrzykiwanego thinking dla `kilo/auto` i nieobsługiwanych identyfikatorów rozumowania proxy |
    | `moonshot-thinking` | Mapowanie binarnego natywnego ładunku thinking Moonshot z konfiguracji + poziomu `/think` |
    | `minimax-fast-mode` | Przepisywanie modelu MiniMax fast-mode na współdzielonej ścieżce strumieniowania |
    | `openai-responses-defaults` | Współdzielone natywne opakowania OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie w sieci Codex, kształtowanie ładunku zgodności rozumowania oraz zarządzanie kontekstem Responses |
    | `openrouter-thinking` | Opakowanie rozumowania OpenRouter dla ścieżek proxy, z centralnie obsługiwanym pomijaniem dla nieobsługiwanych modeli/`auto` |
    | `tool-stream-default-on` | Domyślnie włączone opakowanie `tool_stream` dla providerów takich jak Z.AI, którzy chcą strumieniowania narzędzi, o ile nie zostanie ono jawnie wyłączone |

    Rzeczywiste dołączone przykłady:

    - `google` i `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` i `minimax-portal`: `minimax-fast-mode`
    - `openai` i `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` eksportuje również enum
    rodziny replay oraz współdzielone helpery, na których te rodziny są zbudowane. Typowe eksporty publiczne
    obejmują:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - współdzielone buildery replay, takie jak `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` i
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpery replay Gemini, takie jak `sanitizeGoogleGeminiReplayHistory(...)`
      i `resolveTaggedReasoningOutputMode()`
    - helpery endpointów/modeli, takie jak `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` i
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` udostępnia zarówno builder rodziny, jak i
    publiczne helpery opakowujące, które te rodziny wykorzystują ponownie. Typowe eksporty publiczne
    obejmują:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - współdzielone opakowania OpenAI/Codex, takie jak
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` i
      `createCodexNativeWebSearchWrapper(...)`
    - współdzielone opakowania proxy/providerów, takie jak `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` i `createMinimaxFastModeWrapper(...)`

    Niektóre helpery strumieniowania celowo pozostają lokalne dla providera. Obecny dołączony
    przykład: `@openclaw/anthropic-provider` eksportuje
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz
    niższopoziomowe buildery opakowań Anthropic ze swojej publicznej granicy `api.ts` /
    `contract-api.ts`. Te helpery pozostają specyficzne dla Anthropic, ponieważ
    kodują również obsługę wersji beta Claude OAuth i bramkowanie `context1m`.

    Inni dołączeni providerzy również zachowują opakowania specyficzne dla transportu lokalnie, gdy
    zachowanie nie jest czysto współdzielone między rodzinami. Obecny przykład: plugin xAI
    dołączony do repozytorium zachowuje natywne kształtowanie Responses xAI we własnym
    `wrapStreamFn`, w tym przepisywanie aliasów `/fast`, domyślne `tool_stream`,
    czyszczenie nieobsługiwanych ścisłych narzędzi oraz usuwanie ładunku
    rozumowania specyficznego dla xAI.

    `openclaw/plugin-sdk/provider-tools` obecnie udostępnia jedną współdzieloną
    rodzinę schematów narzędzi oraz współdzielone helpery schematu/zgodności:

    - `ProviderToolCompatFamily` dokumentuje obecny zestaw współdzielonych rodzin.
    - `buildProviderToolCompatFamilyHooks("gemini")` podłącza czyszczenie
      schematu Gemini + diagnostykę dla providerów, którzy potrzebują schematów narzędzi bezpiecznych dla Gemini.
    - `normalizeGeminiToolSchemas(...)` i `inspectGeminiToolSchemas(...)`
      są bazowymi publicznymi helperami schematu Gemini.
    - `resolveXaiModelCompatPatch()` zwraca dołączoną łatkę zgodności xAI:
      `toolSchemaProfile: "xai"`, nieobsługiwane słowa kluczowe schematu, natywne
      wsparcie `web_search` oraz dekodowanie argumentów wywołań narzędzi z encji HTML.
    - `applyXaiModelCompat(model)` stosuje tę samą łatkę zgodności xAI do
      rozpoznanego modelu, zanim trafi on do runnera.

    Rzeczywisty dołączony przykład: plugin xAI używa `normalizeResolvedModel` oraz
    `contributeResolvedModelCompat`, aby zachować te metadane zgodności po stronie
    providera zamiast wpisywać reguły xAI na sztywno w rdzeniu.

    Ten sam wzorzec z katalogiem głównym pakietu wspiera również innych dołączonych providerów:

    - `@openclaw/openai-provider`: `api.ts` eksportuje buildery providerów,
      helpery modeli domyślnych oraz buildery providerów realtime
    - `@openclaw/openrouter-provider`: `api.ts` eksportuje builder providera
      oraz helpery onboarding/config

    <Tabs>
      <Tab title="Wymiana tokena">
        Dla providerów, którzy potrzebują wymiany tokena przed każdym wywołaniem inferencji:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Niestandardowe nagłówki">
        Dla providerów, którzy potrzebują niestandardowych nagłówków żądań lub modyfikacji treści:

        ```typescript
        // wrapStreamFn zwraca StreamFn pochodny od ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Tożsamość natywnego transportu">
        Dla providerów, którzy potrzebują natywnych nagłówków żądań/sesji lub metadanych na
        ogólnych transportach HTTP lub WebSocket:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Zużycie i rozliczenia">
        Dla providerów, którzy udostępniają dane o zużyciu/rozliczeniach:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="Wszystkie dostępne hooki providera">
      OpenClaw wywołuje hooki w tej kolejności. Większość providerów używa tylko 2–3:

      | # | Hook | Kiedy używać |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog modeli lub domyślne wartości `baseUrl` |
      | 2 | `applyConfigDefaults` | Globalne wartości domyślne należące do providera podczas materializacji konfiguracji |
      | 3 | `normalizeModelId` | Czyszczenie aliasów starszych/podglądowych identyfikatorów modeli przed wyszukiwaniem |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` rodziny providera przed ogólnym składaniem modelu |
      | 5 | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Przepisania zgodności natywnego strumieniowania użycia dla providerów konfiguracyjnych |
      | 7 | `resolveConfigApiKey` | Rozpoznawanie uwierzytelniania markerów env należące do providera |
      | 8 | `resolveSyntheticAuth` | Syntetyczne uwierzytelnianie lokalne/self-hosted lub oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżanie priorytetu syntetycznych placeholderów zapisanych profili względem uwierzytelniania env/config |
      | 10 | `resolveDynamicModel` | Akceptowanie dowolnych identyfikatorów modeli upstream |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobranie metadanych przed rozpoznaniem |
      | 12 | `normalizeResolvedModel` | Przepisania transportu przed runnerem |

    Uwagi dotyczące fallbacku runtime:

    - `normalizeConfig` najpierw sprawdza dopasowanego providera, a następnie inne
      pluginy providerów obsługujące hooki, dopóki któryś faktycznie nie zmieni konfiguracji.
      Jeśli żaden hook providera nie przepisze obsługiwanego wpisu konfiguracji rodziny Google,
      nadal zostanie zastosowany dołączony normalizator konfiguracji Google.
    - `resolveConfigApiKey` używa hooka providera, gdy jest on udostępniony. Dołączona
      ścieżka `amazon-bedrock` ma tu także wbudowany resolver markerów środowiska AWS,
      mimo że samo uwierzytelnianie runtime Bedrock nadal używa domyślnego
      łańcucha AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flagi zgodności dla modeli dostawcy działających za innym zgodnym transportem |
      | 14 | `capabilities` | Starszy statyczny zestaw możliwości; tylko dla zgodności |
      | 15 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi należące do providera przed rejestracją |
      | 16 | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do providera |
      | 17 | `resolveReasoningOutputMode` | Kontrakt wyjścia rozumowania: tagowane czy natywne |
      | 18 | `prepareExtraParams` | Domyślne parametry żądania |
      | 19 | `createStreamFn` | W pełni niestandardowy transport StreamFn |
      | 20 | `wrapStreamFn` | Opakowania niestandardowych nagłówków/treści na zwykłej ścieżce strumienia |
      | 21 | `resolveTransportTurnState` | Natywne nagłówki/metadane dla każdej tury |
      | 22 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS / czas odnowienia |
      | 23 | `formatApiKey` | Niestandardowy kształt tokena runtime |
      | 24 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 25 | `buildAuthDoctorHint` | Wskazówki naprawy uwierzytelniania |
      | 26 | `matchesContextOverflowError` | Wykrywanie przepełnienia należące do providera |
      | 27 | `classifyFailoverReason` | Klasyfikacja ograniczeń szybkości/przeciążenia należąca do providera |
      | 28 | `isCacheTtlEligible` | Bramka TTL pamięci podręcznej promptów |
      | 29 | `buildMissingAuthMessage` | Niestandardowa wskazówka o braku uwierzytelniania |
      | 30 | `suppressBuiltInModel` | Ukrywanie nieaktualnych wierszy upstream |
      | 31 | `augmentModelCatalog` | Syntetyczne wiersze zgodności z przyszłością |
      | 32 | `isBinaryThinking` | Binarne thinking włączone/wyłączone |
      | 33 | `supportsXHighThinking` | Obsługa rozumowania `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Domyślne zasady `/think` |
      | 35 | `isModernModelRef` | Dopasowanie modeli live/smoke |
      | 36 | `prepareRuntimeAuth` | Wymiana tokena przed inferencją |
      | 37 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń użycia |
      | 38 | `fetchUsageSnapshot` | Niestandardowy endpoint użycia |
      | 39 | `createEmbeddingProvider` | Adapter embeddingów należący do providera dla pamięci/wyszukiwania |
      | 40 | `buildReplayPolicy` | Niestandardowe zasady replay/kompaktacji transkryptu |
      | 41 | `sanitizeReplayHistory` | Przepisania replay specyficzne dla providera po ogólnym czyszczeniu |
      | 42 | `validateReplayTurns` | Ścisła walidacja tur replay przed osadzonym runnerem |
      | 43 | `onModelSelected` | Callback po wyborze modelu (np. telemetria) |

      Uwaga dotycząca dostrajania promptów:

      - `resolveSystemPromptContribution` pozwala providerowi wstrzykiwać wskazówki
        do promptu systemowego świadome pamięci podręcznej dla danej rodziny modeli. Preferuj to zamiast
        `before_prompt_build`, gdy zachowanie należy do jednej rodziny providera/modelu
        i powinno zachować stabilny/dynamiczny podział pamięci podręcznej.

      Szczegółowe opisy i przykłady z praktyki znajdziesz w
      [Wnętrza: Hooki runtime providera](/pl/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin providera może rejestrować mowę, transkrypcję realtime, głos realtime,
    rozumienie multimediów, generowanie obrazów, generowanie wideo, pobieranie z sieci
    i wyszukiwanie w sieci obok inferencji tekstu:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Acme Realtime Voice",
        isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
        createBridge: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          setMediaTimestamp: () => {},
          submitToolResult: () => {},
          acknowledgeMark: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Fetch pages through Acme's rendering backend.",
        envVars: ["ACME_FETCH_API_KEY"],
        placeholder: "acme-...",
        signupUrl: "https://acme.example.com/fetch",
        credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
        getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
        setCredentialValue: (fetchConfigTarget, value) => {
          const acme = (fetchConfigTarget.acme ??= {});
          acme.apiKey = value;
        },
        createTool: () => ({
          description: "Fetch a page through Acme Fetch.",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Acme Search",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    OpenClaw klasyfikuje to jako plugin o **możliwościach hybrydowych**. Jest to
    zalecany wzorzec dla pluginów firmowych (jeden plugin na dostawcę). Zobacz
    [Wnętrza: Własność możliwości](/pl/plugins/architecture#capability-ownership-model).

    W przypadku generowania wideo preferuj pokazany powyżej kształt możliwości
    uwzględniający tryby: `generate`, `imageToVideo` i `videoToVideo`. Płaskie pola zbiorcze, takie
    jak `maxInputImages`, `maxInputVideos` i `maxDurationSeconds`, nie
    wystarczają, aby w przejrzysty sposób reklamować obsługę trybów transformacji lub wyłączonych trybów.

    Providery generowania muzyki powinny stosować ten sam wzorzec:
    `generate` dla generowania wyłącznie na podstawie promptu i `edit` dla generowania
    opartego na obrazie referencyjnym. Płaskie pola zbiorcze, takie jak `maxInputImages`,
    `supportsLyrics` i `supportsFormat`, nie wystarczają do reklamowania obsługi
    edycji; oczekiwanym kontraktem są jawne bloki `generate` / `edit`.

  </Step>

  <Step title="Test">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Publikowanie do ClawHub

Pluginy providerów publikuje się tak samo jak każdy inny zewnętrzny plugin kodu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Nie używaj tutaj starszego aliasu publikowania tylko dla Skills; pakiety pluginów powinny używać
`clawhub package publish`.

## Struktura plików

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadane openclaw.providers
├── openclaw.plugin.json      # Manifest z metadanymi uwierzytelniania providera
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testy
    └── usage.ts              # Endpoint użycia (opcjonalnie)
```

## Dokumentacja referencyjna kolejności katalogu

`catalog.order` kontroluje, kiedy twój katalog jest scalany względem
wbudowanych providerów:

| Kolejność | Kiedy           | Przypadek użycia                                |
| --------- | --------------- | ----------------------------------------------- |
| `simple`  | Pierwsze przejście | Zwykli providerzy z kluczem API              |
| `profile` | Po simple       | Providery zależne od profili uwierzytelniania   |
| `paired`  | Po profile      | Syntetyzowanie wielu powiązanych wpisów         |
| `late`    | Ostatnie przejście | Nadpisywanie istniejących providerów (wygrywa przy kolizji) |

## Następne kroki

- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — jeśli twój plugin udostępnia także kanał
- [SDK Runtime](/pl/plugins/sdk-runtime) — helpery `api.runtime` (TTS, search, subagent)
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja referencyjna importów subpath
- [Wnętrza pluginów](/pl/plugins/architecture#provider-runtime-hooks) — szczegóły hooków i dołączone przykłady
