---
read_when:
    - Tworzysz nowy Plugin dostawcy modeli
    - Chcesz dodać zgodny z OpenAI serwer proxy lub niestandardowy LLM do OpenClaw
    - Musisz zrozumieć uwierzytelnianie dostawcy, katalogi i hooki runtime
sidebarTitle: Provider plugins
summary: Przewodnik krok po kroku dotyczący tworzenia Pluginu dostawcy modeli dla OpenClaw
title: Tworzenie Pluginów dostawców
x-i18n:
    generated_at: "2026-04-25T13:54:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Ten przewodnik krok po kroku pokazuje, jak zbudować Plugin dostawcy, który dodaje
dostawcę modeli (LLM) do OpenClaw. Na końcu będziesz mieć dostawcę z katalogiem
modeli, uwierzytelnianiem kluczem API i dynamicznym rozpoznawaniem modeli.

<Info>
  Jeśli nie tworzono wcześniej żadnego Pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

<Tip>
  Pluginy dostawców dodają modele do standardowej pętli inferencji OpenClaw. Jeśli model
  musi działać przez natywny demon agenta, który zarządza wątkami, Compaction lub
  zdarzeniami narzędzi, połącz dostawcę z [agent harness](/pl/plugins/sdk-agent-harness),
  zamiast umieszczać szczegóły protokołu demona w rdzeniu.
</Tip>

## Przewodnik

<Steps>
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

    Manifest deklaruje `providerAuthEnvVars`, aby OpenClaw mógł wykrywać
    poświadczenia bez ładowania runtime Twojego Pluginu. Dodaj `providerAuthAliases`,
    gdy wariant dostawcy ma ponownie używać uwierzytelniania innego identyfikatora dostawcy. `modelSupport`
    jest opcjonalne i pozwala OpenClaw automatycznie ładować Plugin dostawcy na podstawie skróconych
    identyfikatorów modeli, takich jak `acme-large`, zanim pojawią się hooki runtime. Jeśli publikujesz
    dostawcę w ClawHub, pola `openclaw.compat` i `openclaw.build`
    są wymagane w `package.json`.

  </Step>

  <Step title="Zarejestruj dostawcę">
    Minimalny dostawca potrzebuje `id`, `label`, `auth` i `catalog`:

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

    To jest działający dostawca. Użytkownicy mogą teraz uruchomić
    `openclaw onboard --acme-ai-api-key <key>` i wybrać
    `acme-ai/acme-large` jako swój model.

    Jeśli nadrzędny dostawca używa innych tokenów sterujących niż OpenClaw, dodaj
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

    W przypadku wbudowanych dostawców, którzy rejestrują tylko jednego dostawcę tekstowego z
    uwierzytelnianiem kluczem API oraz jednym runtime opartym na katalogu, preferuj węższą
    funkcję pomocniczą `defineSingleProviderPluginEntry(...)`:

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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` to ścieżka katalogu na żywo używana wtedy, gdy OpenClaw może rozpoznać rzeczywiste
    uwierzytelnianie dostawcy. Może wykonywać wykrywanie specyficzne dla dostawcy. Używaj
    `buildStaticProvider` tylko dla wierszy offline, które można bezpiecznie pokazać przed
    skonfigurowaniem uwierzytelniania; nie może ono wymagać poświadczeń ani wykonywać żądań sieciowych.
    Widok `models list --all` w OpenClaw obecnie wykonuje katalogi statyczne
    tylko dla wbudowanych Pluginów dostawców, z pustą konfiguracją, pustym środowiskiem i bez
    ścieżek agenta/obszaru roboczego.

    Jeśli przepływ uwierzytelniania musi także poprawiać `models.providers.*`,
    aliasy i domyślny model agenta podczas onboardingu, użyj gotowych funkcji pomocniczych z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe funkcje pomocnicze to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` i
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint dostawcy obsługuje strumieniowane bloki użycia w
    standardowym transporcie `openai-completions`, preferuj współdzielone funkcje pomocnicze katalogu z
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast na sztywno kodować sprawdzanie identyfikatora dostawcy.
    `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie mapy możliwości endpointu,
    więc natywne endpointy w stylu Moonshot/DashScope nadal mogą się włączyć, nawet gdy Plugin używa
    niestandardowego identyfikatora dostawcy.

  </Step>

  <Step title="Dodaj dynamiczne rozpoznawanie modeli">
    Jeśli Twój dostawca akceptuje dowolne identyfikatory modeli (jak serwer proxy lub router),
    dodaj `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

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

    Jeśli rozpoznanie wymaga wywołania sieciowego, użyj `prepareDynamicModel` do asynchronicznego
    przygotowania — po jego zakończeniu `resolveDynamicModel` zostanie uruchomione ponownie.

  </Step>

  <Step title="Dodaj hooki runtime (w razie potrzeby)">
    Większość dostawców potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj hooki
    stopniowo, w miarę jak Twój dostawca będzie ich wymagał.

    Współdzielone konstruktory pomocnicze obejmują teraz najczęstsze rodziny zgodności
    replay/narzędzi, więc Pluginy zwykle nie muszą ręcznie podpinać każdego hooka osobno:

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

    | Rodzina | Co podłącza | Przykłady wbudowane |
    | --- | --- | --- |
    | `openai-compatible` | Współdzielona polityka replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym sanityzacja identyfikatora wywołania narzędzia, poprawki kolejności assistant-first i ogólna walidacja tur Gemini tam, gdzie wymaga tego transport | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Polityka replay rozpoznająca Claude wybierana według `modelId`, dzięki czemu transporty wiadomości Anthropic otrzymują czyszczenie bloków myślenia specyficzne dla Claude tylko wtedy, gdy rozpoznany model jest rzeczywiście identyfikatorem Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Natywna polityka replay Gemini oraz sanityzacja bootstrap replay i tryb oznaczonego wyjścia rozumowania | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanityzacja sygnatur myśli Gemini dla modeli Gemini działających przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisywania bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Polityka hybrydowa dla dostawców, którzy łączą powierzchnie modeli wiadomości Anthropic i modele zgodne z OpenAI w jednym Pluginie; opcjonalne usuwanie bloków myślenia tylko dla Claude pozostaje ograniczone do strony Anthropic | `minimax` |

    Dostępne obecnie rodziny strumieniowania:

    | Rodzina | Co podłącza | Przykłady wbudowane |
    | --- | --- | --- |
    | `google-thinking` | Normalizacja ładunku myślenia Gemini na współdzielonej ścieżce strumieniowania | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Otoczka rozumowania Kilo na współdzielonej ścieżce strumienia proxy, przy czym `kilo/auto` i nieobsługiwane identyfikatory rozumowania proxy pomijają wstrzyknięte myślenie | `kilocode` |
    | `moonshot-thinking` | Mapowanie binarnego natywnego ładunku myślenia Moonshot na podstawie konfiguracji i poziomu `/think` | `moonshot` |
    | `minimax-fast-mode` | Przepisywanie modelu MiniMax fast-mode na współdzielonej ścieżce strumieniowania | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Współdzielone natywne otoczki OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie w sieci Codex, kształtowanie ładunku zgodności rozumowania i zarządzanie kontekstem Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Otoczka rozumowania OpenRouter dla tras proxy, z centralnie obsługiwanym pomijaniem nieobsługiwanych modeli/`auto` | `openrouter` |
    | `tool-stream-default-on` | Domyślnie włączona otoczka `tool_stream` dla dostawców takich jak Z.AI, którzy chcą strumieniowania narzędzi, chyba że zostanie ono jawnie wyłączone | `zai` |

    <Accordion title="Granice SDK zasilające konstruktory rodzin">
      Każdy konstruktor rodziny jest złożony z niższopoziomowych publicznych funkcji pomocniczych eksportowanych z tego samego pakietu, po które możesz sięgnąć, gdy dostawca musi odejść od typowego wzorca:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` i surowe konstruktory replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Eksportuje także funkcje pomocnicze replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) oraz funkcje pomocnicze endpointów/modeli (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, a także współdzielone otoczki OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) oraz współdzielone otoczki proxy/dostawców (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, bazowe funkcje pomocnicze schematów Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) oraz funkcje pomocnicze zgodności xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Wbudowany Plugin xAI używa `normalizeResolvedModel` + `contributeResolvedModelCompat` razem z nimi, aby reguły xAI pozostały własnością dostawcy.

      Niektóre funkcje pomocnicze strumieniowania celowo pozostają lokalne dla dostawcy. `@openclaw/anthropic-provider` przechowuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz niższopoziomowe konstruktory otoczek Anthropic we własnej publicznej granicy `api.ts` / `contract-api.ts`, ponieważ kodują one obsługę Claude OAuth beta i bramkowanie `context1m`. Plugin xAI podobnie utrzymuje natywne kształtowanie Responses xAI we własnym `wrapStreamFn` (aliasy `/fast`, domyślne `tool_stream`, czyszczenie nieobsługiwanych ścisłych narzędzi, usuwanie ładunku rozumowania specyficznego dla xAI).

      Ten sam wzorzec katalogu głównego pakietu wspiera także `@openclaw/openai-provider` (konstruktory dostawców, funkcje pomocnicze modeli domyślnych, konstruktory dostawców realtime) oraz `@openclaw/openrouter-provider` (konstruktor dostawcy oraz funkcje pomocnicze onboardingu/konfiguracji).
    </Accordion>

    <Tabs>
      <Tab title="Wymiana tokenu">
        Dla dostawców, którzy wymagają wymiany tokenu przed każdym wywołaniem inferencji:

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
        Dla dostawców, którzy wymagają niestandardowych nagłówków żądania lub modyfikacji treści żądania:

        ```typescript
        // wrapStreamFn zwraca StreamFn pochodne od ctx.streamFn
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
        Dla dostawców, którzy potrzebują natywnych nagłówków żądania/sesji lub metadanych na
        generycznych transportach HTTP lub WebSocket:

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
      <Tab title="Użycie i rozliczenia">
        Dla dostawców, którzy udostępniają dane o użyciu/rozliczeniach:

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

    <Accordion title="Wszystkie dostępne hooki dostawcy">
      OpenClaw wywołuje hooki w tej kolejności. Większość dostawców używa tylko 2–3:

      | # | Hook | Kiedy używać |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog modeli lub domyślne wartości `baseUrl` |
      | 2 | `applyConfigDefaults` | Globalne wartości domyślne należące do dostawcy podczas materializacji konfiguracji |
      | 3 | `normalizeModelId` | Czyszczenie aliasów starszych/podglądowych identyfikatorów modeli przed wyszukiwaniem |
      | 4 | `normalizeTransport` | Czyszczenie rodziny dostawcy `api` / `baseUrl` przed generycznym składaniem modelu |
      | 5 | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Przepisania zgodności natywnego użycia strumieniowego dla dostawców konfiguracyjnych |
      | 7 | `resolveConfigApiKey` | Rozpoznawanie uwierzytelniania znacznika środowiska należące do dostawcy |
      | 8 | `resolveSyntheticAuth` | Syntetyczne uwierzytelnianie lokalne/self-hosted lub oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżenie priorytetu syntetycznych placeholderów zapisanych profili względem uwierzytelniania env/config |
      | 10 | `resolveDynamicModel` | Akceptowanie dowolnych nadrzędnych identyfikatorów modeli |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobieranie metadanych przed rozpoznaniem |
      | 12 | `normalizeResolvedModel` | Przepisania transportu przed runnerem |
      | 13 | `contributeResolvedModelCompat` | Flagi zgodności dla modeli dostawcy działających za innym zgodnym transportem |
      | 14 | `capabilities` | Starszy statyczny zbiór możliwości; tylko zgodność |
      | 15 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi należące do dostawcy przed rejestracją |
      | 16 | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do dostawcy |
      | 17 | `resolveReasoningOutputMode` | Kontrakt oznaczonego vs natywnego wyjścia rozumowania |
      | 18 | `prepareExtraParams` | Domyślne parametry żądania |
      | 19 | `createStreamFn` | W pełni niestandardowy transport StreamFn |
      | 20 | `wrapStreamFn` | Niestandardowe otoczki nagłówków/treści żądania na zwykłej ścieżce strumienia |
      | 21 | `resolveTransportTurnState` | Natywne nagłówki/metadane dla każdej tury |
      | 22 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS/czas ochłodzenia |
      | 23 | `formatApiKey` | Niestandardowy kształt tokenu runtime |
      | 24 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 25 | `buildAuthDoctorHint` | Wskazówki naprawy uwierzytelniania |
      | 26 | `matchesContextOverflowError` | Wykrywanie przepełnienia należące do dostawcy |
      | 27 | `classifyFailoverReason` | Klasyfikacja rate limit/overload należąca do dostawcy |
      | 28 | `isCacheTtlEligible` | Bramkowanie TTL pamięci podręcznej promptu |
      | 29 | `buildMissingAuthMessage` | Niestandardowa wskazówka brakującego uwierzytelniania |
      | 30 | `suppressBuiltInModel` | Ukrywanie nieaktualnych nadrzędnych wierszy |
      | 31 | `augmentModelCatalog` | Syntetyczne wiersze zgodności na przyszłość |
      | 32 | `resolveThinkingProfile` | Zbiór opcji `/think` specyficzny dla modelu |
      | 33 | `isBinaryThinking` | Zgodność binarnego myślenia włącz/wyłącz |
      | 34 | `supportsXHighThinking` | Zgodność obsługi rozumowania `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Zgodność domyślnej polityki `/think` |
      | 36 | `isModernModelRef` | Dopasowanie modeli live/smoke |
      | 37 | `prepareRuntimeAuth` | Wymiana tokenu przed inferencją |
      | 38 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń użycia |
      | 39 | `fetchUsageSnapshot` | Niestandardowy endpoint użycia |
      | 40 | `createEmbeddingProvider` | Adapter embeddingów należący do dostawcy dla pamięci/wyszukiwania |
      | 41 | `buildReplayPolicy` | Niestandardowa polityka replay/Compaction transkryptu |
      | 42 | `sanitizeReplayHistory` | Przepisania replay specyficzne dla dostawcy po generycznym czyszczeniu |
      | 43 | `validateReplayTurns` | Ścisła walidacja tur replay przed osadzonym runnerem |
      | 44 | `onModelSelected` | Callback po wyborze modelu (np. telemetria) |

      Uwagi o fallback runtime:

      - `normalizeConfig` najpierw sprawdza dopasowanego dostawcę, a potem inne Pluginy dostawców obsługujące hooki, aż któryś faktycznie zmieni konfigurację. Jeśli żaden hook dostawcy nie przepisze obsługiwanego wpisu konfiguracji rodziny Google, nadal zostanie zastosowany wbudowany normalizator konfiguracji Google.
      - `resolveConfigApiKey` używa hooka dostawcy, jeśli jest on udostępniony. Wbudowana ścieżka `amazon-bedrock` ma tu także wbudowany resolver uwierzytelniania znaczników środowiska AWS, mimo że samo uwierzytelnianie runtime Bedrock nadal używa domyślnego łańcucha AWS SDK.
      - `resolveSystemPromptContribution` pozwala dostawcy wstrzykiwać wskazówki dotyczące promptu systemowego uwzględniające pamięć podręczną dla rodziny modeli. Preferuj ten hook zamiast `before_prompt_build`, gdy zachowanie należy do jednej rodziny dostawcy/modeli i powinno zachować stabilny/dynamiczny podział cache.

      Szczegółowe opisy i przykłady z rzeczywistego użycia znajdziesz w [Internals: Hooki runtime dostawcy](/pl/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    Plugin dostawcy może rejestrować mowę, transkrypcję realtime, głos realtime,
    rozumienie multimediów, generowanie obrazów, generowanie wideo, web fetch
    i web search obok inferencji tekstowej. OpenClaw klasyfikuje to jako
    Plugin **hybrid-capability** — zalecany wzorzec dla Pluginów firmowych
    (jeden Plugin na dostawcę). Zobacz
    [Internals: Własność możliwości](/pl/plugins/architecture#capability-ownership-model).

    Zarejestruj każdą możliwość wewnątrz `register(api)` obok istniejącego
    wywołania `api.registerProvider(...)`. Wybierz tylko te zakładki, których potrzebujesz:

    <Tabs>
      <Tab title="Mowa (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        Używaj `assertOkOrThrowProviderError(...)` dla błędów HTTP dostawcy, aby
        Pluginy współdzieliły ograniczone odczyty treści błędów, parsowanie błędów JSON
        i sufiksy request-id.
      </Tab>
      <Tab title="Transkrypcja realtime">
        Preferuj `createRealtimeTranscriptionWebSocketSession(...)` — współdzielona
        funkcja pomocnicza obsługuje przechwytywanie proxy, backoff ponownych połączeń,
        opróżnianie przy zamknięciu, handshaki gotowości, kolejkowanie audio oraz diagnostykę
        zdarzeń zamknięcia. Twój Plugin tylko mapuje zdarzenia nadrzędne.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        Dostawcy wsadowego STT, którzy wysyłają dźwięk multipart metodą POST, powinni używać
        `buildAudioTranscriptionFormData(...)` z
        `openclaw/plugin-sdk/provider-http`. Ta funkcja pomocnicza normalizuje
        nazwy plików przesyłanych na upload, w tym uploady AAC, które wymagają nazwy pliku
        w stylu M4A dla zgodnych API transkrypcji.
      </Tab>
      <Tab title="Głos realtime">
        ```typescript
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
        ```
      </Tab>
      <Tab title="Rozumienie multimediów">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Generowanie obrazów i wideo">
        Możliwości wideo używają kształtu **mode-aware**: `generate`,
        `imageToVideo` i `videoToVideo`. Płaskie pola agregujące, takie jak
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`, nie wystarczają,
        aby w czysty sposób reklamować obsługę trybu transformacji lub wyłączone tryby.
        Generowanie muzyki stosuje ten sam wzorzec z jawnymi blokami `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch i web search">
        ```typescript
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Testuj">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Wyeksportuj obiekt konfiguracji dostawcy z index.ts lub dedykowanego pliku
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

## Publikowanie w ClawHub

Pluginy dostawców publikuje się tak samo jak każdy inny zewnętrzny Plugin kodu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Nie używaj tutaj starszego aliasu publikacji tylko dla Skills; pakiety Pluginów powinny używać
`clawhub package publish`.

## Struktura plików

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadane openclaw.providers
├── openclaw.plugin.json      # Manifest z metadanymi uwierzytelniania dostawcy
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testy
    └── usage.ts              # Endpoint użycia (opcjonalnie)
```

## Dokumentacja `catalog.order`

`catalog.order` kontroluje, kiedy Twój katalog jest scalany względem
wbudowanych dostawców:

| Kolejność | Kiedy | Przypadek użycia |
| --------- | ----- | ---------------- |
| `simple`  | Pierwsze przejście | Zwykli dostawcy z kluczem API |
| `profile` | Po `simple` | Dostawcy zależni od profili auth |
| `paired`  | Po `profile` | Syntetyzowanie wielu powiązanych wpisów |
| `late`    | Ostatnie przejście | Nadpisywanie istniejących dostawców (wygrywa przy kolizji) |

## Następne kroki

- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — jeśli Twój Plugin udostępnia także kanał
- [SDK Runtime](/pl/plugins/sdk-runtime) — funkcje pomocnicze `api.runtime` (TTS, search, subagent)
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów subpath
- [Wnętrze Pluginów](/pl/plugins/architecture-internals#provider-runtime-hooks) — szczegóły hooków i przykłady wbudowane

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
- [Tworzenie Pluginów kanałów](/pl/plugins/sdk-channel-plugins)
