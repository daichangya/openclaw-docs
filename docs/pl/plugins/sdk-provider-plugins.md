---
read_when:
    - Tworzysz nowy plugin providera modeli
    - Chcesz dodać zgodny z OpenAI proxy lub niestandardowy LLM do OpenClaw
    - Musisz zrozumieć uwierzytelnianie providera, katalogi i hooki runtime
sidebarTitle: Provider Plugins
summary: Przewodnik krok po kroku po tworzeniu pluginu providera modeli dla OpenClaw
title: Tworzenie pluginów providerów
x-i18n:
    generated_at: "2026-04-23T10:05:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Tworzenie pluginów providerów

Ten przewodnik przeprowadza przez budowę pluginu providera, który dodaje provider modeli
(LLM) do OpenClaw. Na końcu będziesz mieć providera z katalogiem modeli,
uwierzytelnianiem kluczem API i dynamicznym rozwiązywaniem modeli.

<Info>
  Jeśli nie tworzyłeś wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

<Tip>
  Pluginy providerów dodają modele do normalnej pętli inferencji OpenClaw. Jeśli model
  musi działać przez natywny daemon agenta, który zarządza wątkami, Compaction lub
  zdarzeniami narzędzi, sparuj providera z [agent harness](/pl/plugins/sdk-agent-harness)
  zamiast umieszczać szczegóły protokołu daemona w core.
</Tip>

## Przewodnik

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
      "description": "Provider modeli Acme AI",
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
          "choiceLabel": "Klucz API Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Klucz API Acme AI"
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
    poświadczenia bez ładowania runtime Twojego pluginu. Dodaj `providerAuthAliases`,
    gdy wariant providera powinien ponownie używać uwierzytelniania innego id providera. `modelSupport`
    jest opcjonalne i pozwala OpenClaw automatycznie wczytać Twój plugin providera z krótkich
    identyfikatorów modeli, takich jak `acme-large`, zanim pojawią się hooki runtime. Jeśli publikujesz
    providera w ClawHub, te pola `openclaw.compat` i `openclaw.build`
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
      description: "Provider modeli Acme AI",
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
              label: "Klucz API Acme AI",
              hint: "Klucz API z panelu Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Wprowadź klucz API Acme AI",
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

    Jeśli provider upstream używa innych tokenów sterujących niż OpenClaw, dodaj
    małą dwukierunkową transformację tekstu zamiast zastępować ścieżkę strumienia:

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

    `input` przepisuje końcowy system prompt i tekstową treść wiadomości przed
    transportem. `output` przepisuje delty tekstu asystenta i końcowy tekst przed
    tym, jak OpenClaw sparsuje własne markery sterujące lub dostarczanie do kanału.

    Dla dołączonych providerów, które rejestrują tylko jednego providera tekstowego z uwierzytelnianiem
    kluczem API oraz jednym runtime opartym na katalogu, preferuj węższy
    pomocnik `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Provider modeli Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Klucz API Acme AI",
            hint: "Klucz API z panelu Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Wprowadź klucz API Acme AI",
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

    `buildProvider` to ścieżka katalogu na żywo używana wtedy, gdy OpenClaw może rozwiązać prawdziwe
    uwierzytelnianie providera. Może wykonywać specyficzne dla providera wykrywanie. Używaj
    `buildStaticProvider` tylko dla wierszy offline, które bezpiecznie można pokazać przed
    skonfigurowaniem uwierzytelniania; nie może wymagać poświadczeń ani wykonywać żądań sieciowych.
    Wyświetlanie `models list --all` w OpenClaw obecnie wykonuje statyczne katalogi
    tylko dla dołączonych pluginów providerów, z pustą konfiguracją, pustym env i bez
    ścieżek agenta / workspace.

    Jeśli Twój przepływ uwierzytelniania musi także poprawiać `models.providers.*`, aliasy i
    domyślny model agenta podczas onboardingu, użyj pomocników presetów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe pomocniki to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` oraz
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny punkt końcowy providera obsługuje strumieniowane bloki użycia na
    zwykłym transporcie `openai-completions`, preferuj współdzielone pomocniki katalogów z
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast wpisywać na sztywno kontrole provider-id. `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie mapy możliwości punktu końcowego, dzięki czemu natywne punkty końcowe w stylu Moonshot / DashScope nadal
    opt-in nawet wtedy, gdy plugin używa niestandardowego provider id.

  </Step>

  <Step title="Dodaj dynamiczne rozwiązywanie modeli">
    Jeśli Twój provider akceptuje dowolne identyfikatory modeli (jak proxy lub router),
    dodaj `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog z powyższego

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

    Jeśli rozwiązywanie wymaga wywołania sieciowego, użyj `prepareDynamicModel` do asynchronicznego
    rozgrzewania — `resolveDynamicModel` uruchomi się ponownie po jego zakończeniu.

  </Step>

  <Step title="Dodaj hooki runtime (w razie potrzeby)">
    Większość providerów potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj hooki
    stopniowo, zgodnie z potrzebami providera.

    Współdzielone konstruktory pomocnicze obejmują teraz najczęstsze rodziny
    zgodności replay / narzędzi, więc pluginy zwykle nie muszą ręcznie podpinać
    każdego hooka osobno:

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

    Obecnie dostępne rodziny replay:

    | Rodzina | Co podłącza |
    | --- | --- |
    | `openai-compatible` | Współdzielona polityka replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym sanityzacja tool-call-id, poprawki kolejności assistant-first oraz ogólna walidacja tur Gemini tam, gdzie transport tego wymaga |
    | `anthropic-by-model` | Polityka replay świadoma Claude wybierana przez `modelId`, dzięki czemu transporty Anthropic-message dostają czyszczenie bloków thinking specyficzne dla Claude tylko wtedy, gdy rozwiązany model jest rzeczywiście identyfikatorem Claude |
    | `google-gemini` | Natywna polityka replay Gemini oraz sanityzacja bootstrap replay i tryb wyjścia rozumowania oznaczony tagami |
    | `passthrough-gemini` | Sanityzacja thought-signature Gemini dla modeli Gemini działających przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisywania bootstrap |
    | `hybrid-anthropic-openai` | Hybrydowa polityka dla providerów, którzy mieszają powierzchnie modeli Anthropic-message i zgodnych z OpenAI w jednym pluginie; opcjonalne usuwanie bloków thinking tylko dla Claude pozostaje ograniczone do strony Anthropic |

    Rzeczywiste dołączone przykłady:

    - `google` i `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` i `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` i `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` i `zai`: `openai-compatible`

    Obecnie dostępne rodziny stream:

    | Rodzina | Co podłącza |
    | --- | --- |
    | `google-thinking` | Normalizacja ładunku thinking Gemini na współdzielonej ścieżce stream |
    | `kilocode-thinking` | Opakowanie rozumowania Kilo na współdzielonej ścieżce stream proxy, z pomijaniem wstrzykniętego thinking dla `kilo/auto` i nieobsługiwanych identyfikatorów rozumowania proxy |
    | `moonshot-thinking` | Mapowanie binarnego natywnego ładunku thinking Moonshot z config + poziomu `/think` |
    | `minimax-fast-mode` | Przepisywanie modeli MiniMax fast-mode na współdzielonej ścieżce stream |
    | `openai-responses-defaults` | Współdzielone natywne opakowania OpenAI / Codex Responses: nagłówki atrybucji, `/fast` / `serviceTier`, szczegółowość tekstu, natywne `web_search` Codex, kształtowanie ładunku zgodności rozumowania i zarządzanie kontekstem Responses |
    | `openrouter-thinking` | Opakowanie rozumowania OpenRouter dla tras proxy, z centralnie obsługiwanym pomijaniem dla nieobsługiwanych modeli / `auto` |
    | `tool-stream-default-on` | Domyślnie włączone opakowanie `tool_stream` dla providerów takich jak Z.AI, którzy chcą strumieniowania narzędzi, jeśli nie zostało jawnie wyłączone |

    Rzeczywiste dołączone przykłady:

    - `google` i `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` i `minimax-portal`: `minimax-fast-mode`
    - `openai` i `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` eksportuje także enum
    rodzin replay oraz współdzielone pomocniki, z których te rodziny są zbudowane. Typowe publiczne
    eksporty obejmują:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - współdzielone konstruktory replay, takie jak `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` oraz
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - pomocniki replay Gemini, takie jak `sanitizeGoogleGeminiReplayHistory(...)`
      i `resolveTaggedReasoningOutputMode()`
    - pomocniki punktów końcowych / modeli, takie jak `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` oraz
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` udostępnia zarówno konstruktor rodziny, jak i
    publiczne pomocniki opakowań, których te rodziny używają ponownie. Typowe publiczne eksporty
    obejmują:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - współdzielone opakowania OpenAI / Codex, takie jak
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` oraz
      `createCodexNativeWebSearchWrapper(...)`
    - współdzielone opakowania proxy / providerów, takie jak `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` i `createMinimaxFastModeWrapper(...)`

    Niektóre pomocniki stream celowo pozostają lokalne dla providera. Obecny dołączony
    przykład: `@openclaw/anthropic-provider` eksportuje
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz
    niższopoziomowe konstruktory opakowań Anthropic ze swojej publicznej granicy `api.ts` /
    `contract-api.ts`. Te pomocniki pozostają specyficzne dla Anthropic, ponieważ
    kodują także obsługę bet Claude OAuth i bramkowanie `context1m`.

    Inni dołączeni providerzy również trzymają opakowania specyficzne dla transportu lokalnie, gdy
    zachowanie nie daje się czysto współdzielić między rodzinami. Obecny przykład:
    dołączony plugin xAI trzyma natywne kształtowanie xAI Responses we własnym
    `wrapStreamFn`, w tym przepisywanie aliasów `/fast`, domyślne `tool_stream`,
    czyszczenie nieobsługiwanych ścisłych narzędzi i usuwanie ładunku
    rozumowania specyficznego dla xAI.

    `openclaw/plugin-sdk/provider-tools` obecnie udostępnia jedną współdzieloną
    rodzinę zgodności schematów narzędzi oraz współdzielone pomocniki schematów / zgodności:

    - `ProviderToolCompatFamily` dokumentuje dzisiejszy wspólny zbiór rodzin.
    - `buildProviderToolCompatFamilyHooks("gemini")` podłącza czyszczenie schematów Gemini
      + diagnostykę dla providerów, którzy potrzebują schematów narzędzi bezpiecznych dla Gemini.
    - `normalizeGeminiToolSchemas(...)` i `inspectGeminiToolSchemas(...)`
      to bazowe publiczne pomocniki schematów Gemini.
    - `resolveXaiModelCompatPatch()` zwraca dołączoną łatkę zgodności xAI:
      `toolSchemaProfile: "xai"`, nieobsługiwane słowa kluczowe schematu, natywne
      wsparcie `web_search` i dekodowanie argumentów wywołań narzędzi z encjami HTML.
    - `applyXaiModelCompat(model)` stosuje tę samą łatkę zgodności xAI do
      rozwiązango modelu, zanim trafi on do runnera.

    Rzeczywisty dołączony przykład: plugin xAI używa `normalizeResolvedModel` plus
    `contributeResolvedModelCompat`, aby utrzymać te metadane zgodności jako własność
    providera zamiast wpisywać reguły xAI na sztywno w core.

    Ten sam wzorzec katalogu głównego pakietu wspiera także innych dołączonych providerów:

    - `@openclaw/openai-provider`: `api.ts` eksportuje konstruktory providerów,
      pomocniki modeli domyślnych i konstruktory providerów realtime
    - `@openclaw/openrouter-provider`: `api.ts` eksportuje konstruktor providera
      oraz pomocniki onboardingu / konfiguracji

    <Tabs>
      <Tab title="Wymiana tokenów">
        Dla providerów, które wymagają wymiany tokenu przed każdym wywołaniem inferencji:

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
        Dla providerów, które wymagają niestandardowych nagłówków żądań lub modyfikacji treści:

        ```typescript
        // wrapStreamFn zwraca StreamFn pochodzący z ctx.streamFn
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
        Dla providerów, które potrzebują natywnych nagłówków lub metadanych żądań / sesji na
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
      <Tab title="Użycie i rozliczenia">
        Dla providerów, którzy udostępniają dane użycia / rozliczeń:

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

    <Accordion title="Wszystkie dostępne hooki providerów">
      OpenClaw wywołuje hooki w tej kolejności. Większość providerów używa tylko 2–3:

      | # | Hook | Kiedy używać |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog modeli lub domyślne wartości `baseUrl` |
      | 2 | `applyConfigDefaults` | Globalne ustawienia domyślne należące do providera podczas materializacji konfiguracji |
      | 3 | `normalizeModelId` | Czyszczenie aliasów starszych / podglądowych model-id przed wyszukiwaniem |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` rodziny providerów przed ogólnym składaniem modelu |
      | 5 | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Natywne przepisywanie zgodności strumieniowanego użycia dla providerów konfiguracji |
      | 7 | `resolveConfigApiKey` | Rozwiązywanie uwierzytelniania env-marker należące do providera |
      | 8 | `resolveSyntheticAuth` | Syntetyczne uwierzytelnianie lokalne / samohostowane lub oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżanie priorytetu syntetycznych placeholderów zapisanych profili za uwierzytelnianiem env / config |
      | 10 | `resolveDynamicModel` | Akceptowanie dowolnych identyfikatorów modeli upstream |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobieranie metadanych przed rozwiązaniem |
      | 12 | `normalizeResolvedModel` | Przepisywanie transportu przed runnerem |

    Uwagi o runtime fallback:

    - `normalizeConfig` najpierw sprawdza dopasowanego providera, a następnie inne
      pluginy providerów obsługujące hooki, dopóki któryś rzeczywiście nie zmieni konfiguracji.
      Jeśli żaden hook providera nie przepisze wspieranego wpisu konfiguracji rodziny Google,
      nadal zostanie zastosowany dołączony normalizator konfiguracji Google.
    - `resolveConfigApiKey` używa hooka providera, jeśli jest udostępniony. Dołączona
      ścieżka `amazon-bedrock` ma tu także wbudowany resolver env-marker AWS,
      mimo że samo runtime auth Bedrock nadal używa domyślnego łańcucha AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flagi zgodności dla modeli dostawców działających za innym kompatybilnym transportem |
      | 14 | `capabilities` | Starszy statyczny zestaw możliwości; tylko zgodność |
      | 15 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi należące do providera przed rejestracją |
      | 16 | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do providera |
      | 17 | `resolveReasoningOutputMode` | Oznaczony tagami vs natywny kontrakt wyjścia rozumowania |
      | 18 | `prepareExtraParams` | Domyślne parametry żądania |
      | 19 | `createStreamFn` | W pełni niestandardowy transport StreamFn |
      | 20 | `wrapStreamFn` | Opakowania niestandardowych nagłówków / treści na zwykłej ścieżce strumienia |
      | 21 | `resolveTransportTurnState` | Natywne nagłówki / metadane per tura |
      | 22 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS / cooldown |
      | 23 | `formatApiKey` | Niestandardowy kształt tokenu runtime |
      | 24 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 25 | `buildAuthDoctorHint` | Wskazówki naprawy uwierzytelniania |
      | 26 | `matchesContextOverflowError` | Wykrywanie overflow należące do providera |
      | 27 | `classifyFailoverReason` | Klasyfikacja rate-limit / przeciążenia należąca do providera |
      | 28 | `isCacheTtlEligible` | Bramkowanie TTL cache promptu |
      | 29 | `buildMissingAuthMessage` | Niestandardowa wskazówka o brakującym uwierzytelnianiu |
      | 30 | `suppressBuiltInModel` | Ukrywanie nieaktualnych wierszy upstream |
      | 31 | `augmentModelCatalog` | Syntetyczne wiersze zgodności przyszłościowej |
      | 32 | `resolveThinkingProfile` | Zestaw opcji `/think` specyficzny dla modelu |
      | 33 | `isBinaryThinking` | Zgodność binarnego thinking on / off |
      | 34 | `supportsXHighThinking` | Zgodność wsparcia rozumowania `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Zgodność domyślnej polityki `/think` |
      | 36 | `isModernModelRef` | Dopasowanie modeli live / smoke |
      | 37 | `prepareRuntimeAuth` | Wymiana tokenów przed inferencją |
      | 38 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń użycia |
      | 39 | `fetchUsageSnapshot` | Niestandardowy punkt końcowy użycia |
      | 40 | `createEmbeddingProvider` | Adapter embeddingów należący do providera dla pamięci / wyszukiwania |
      | 41 | `buildReplayPolicy` | Niestandardowa polityka replay / Compaction transkrypcji |
      | 42 | `sanitizeReplayHistory` | Przepisywanie replay specyficzne dla providera po ogólnym czyszczeniu |
      | 43 | `validateReplayTurns` | Ścisła walidacja tur replay przed osadzonym runnerem |
      | 44 | `onModelSelected` | Callback po wyborze modelu (np. telemetry) |

      Uwaga o dostrajaniu promptu:

      - `resolveSystemPromptContribution` pozwala providerowi wstrzykiwać wskazówki
        system prompt świadome cache dla rodziny modeli. Preferuj je zamiast
        `before_prompt_build`, gdy zachowanie należy do jednej rodziny providera / modelu
        i powinno zachować stabilny / dynamiczny podział cache.

      Szczegółowe opisy i przykłady ze świata rzeczywistego znajdziesz w
      [Internals: Hooki runtime providera](/pl/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin providera może rejestrować mowę, transkrypcję realtime, głos realtime,
    rozumienie mediów, generowanie obrazów, generowanie wideo, web fetch
    i web search obok inferencji tekstu:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* dane PCM */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

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
        describeImage: async (req) => ({ text: "Zdjęcie przedstawiające..." }),
        transcribeAudio: async (req) => ({ text: "Transkrypcja..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Obrazy Acme",
        generate: async (req) => ({ /* wynik obrazu */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Wideo Acme",
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
        hint: "Pobieraj strony przez backend renderujący Acme.",
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
          description: "Pobierz stronę przez Acme Fetch.",
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

    OpenClaw klasyfikuje to jako plugin **hybrid-capability**. To
    zalecany wzorzec dla pluginów firmowych (jeden plugin na dostawcę). Zobacz
    [Internals: Własność możliwości](/pl/plugins/architecture#capability-ownership-model).

    W przypadku generowania wideo preferuj pokazany powyżej kształt możliwości zależny od trybu:
    `generate`, `imageToVideo` i `videoToVideo`. Płaskie pola zbiorcze, takie
    jak `maxInputImages`, `maxInputVideos` i `maxDurationSeconds`, nie
    wystarczają do czystego reklamowania obsługi trybów transformacji lub trybów wyłączonych.

    Preferuj współdzielony pomocnik WebSocket dla providerów strumieniowego STT. Utrzymuje on
    spójność przechwytywania proxy, backoff ponownych połączeń, flush przy zamknięciu, handshake gotowości, kolejkowania audio i diagnostyki zdarzeń zamknięcia między providerami,
    pozostawiając kodowi providera odpowiedzialność jedynie za mapowanie zdarzeń upstream.

    Batch providerzy STT, którzy wysyłają multipart audio przez POST, powinni używać
    `buildAudioTranscriptionFormData(...)` z
    `openclaw/plugin-sdk/provider-http` razem z pomocnikami żądań HTTP providerów.
    Pomocnik formularza normalizuje nazwy plików przesyłanych uploadem, w tym uploady AAC,
    które potrzebują nazwy pliku w stylu M4A dla zgodnych API transkrypcji.

    Providerzy generowania muzyki powinni stosować ten sam wzorzec:
    `generate` dla generowania wyłącznie z promptu oraz `edit` dla generowania opartego na obrazie referencyjnym.
    Płaskie pola zbiorcze, takie jak `maxInputImages`,
    `supportsLyrics` i `supportsFormat`, nie wystarczają do reklamowania obsługi `edit`;
    oczekiwanym kontraktem są jawne bloki `generate` / `edit`.

  </Step>

  <Step title="Przetestuj">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Eksportuj obiekt konfiguracji providera z index.ts lub dedykowanego pliku
    import { acmeProvider } from "./provider.js";

    describe("provider acme-ai", () => {
      it("rozwiązuje modele dynamiczne", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("zwraca katalog, gdy klucz jest dostępny", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("zwraca null dla katalogu bez klucza", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Publikacja w ClawHub

Pluginy providerów publikuje się tak samo jak każdy inny zewnętrzny plugin kodu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Nie używaj tutaj starszego aliasu publikacji tylko dla Skills; pakiety pluginów powinny używać
`clawhub package publish`.

## Struktura plików

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadane openclaw.providers
├── openclaw.plugin.json      # Manifest z metadanymi auth providera
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testy
    └── usage.ts              # Punkt końcowy użycia (opcjonalnie)
```

## Dokumentacja `catalog.order`

`catalog.order` kontroluje, kiedy Twój katalog jest scalany względem wbudowanych
providerów:

| Kolejność | Kiedy         | Przypadek użycia                                |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Pierwsze przejście | Zwykli providerzy z kluczem API            |
| `profile` | Po `simple`   | Providerzy zależni od profili auth              |
| `paired`  | Po `profile`  | Syntezowanie wielu powiązanych wpisów           |
| `late`    | Ostatnie przejście | Nadpisanie istniejących providerów (wygrywa przy kolizji) |

## Kolejne kroki

- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — jeśli Twój plugin dostarcza też kanał
- [SDK Runtime](/pl/plugins/sdk-runtime) — pomocniki `api.runtime` (TTS, search, subagent)
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów subpath
- [Wnętrze pluginów](/pl/plugins/architecture#provider-runtime-hooks) — szczegóły hooków i dołączone przykłady
