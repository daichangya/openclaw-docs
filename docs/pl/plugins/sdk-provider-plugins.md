---
read_when:
    - Tworzysz nowy plugin providera modeli
    - Chcesz dodać do OpenClaw proxy zgodne z OpenAI lub niestandardowy LLM
    - Musisz zrozumieć uwierzytelnianie providera, katalogi i hooki środowiska uruchomieniowego
sidebarTitle: Provider plugins
summary: Przewodnik krok po kroku po tworzeniu pluginu providera modeli dla OpenClaw
title: Tworzenie pluginów providerów
x-i18n:
    generated_at: "2026-04-26T11:37:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Ten przewodnik prowadzi krok po kroku przez tworzenie pluginu providera, który dodaje providera modeli
(LLM) do OpenClaw. Na końcu będziesz mieć providera z katalogiem modeli,
uwierzytelnianiem kluczem API i dynamicznym rozwiązywaniem modeli.

<Info>
  Jeśli nie tworzyłeś wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

<Tip>
  Pluginy providerów dodają modele do standardowej pętli inferencji OpenClaw. Jeśli model
  musi działać przez natywny demon agenta, który zarządza wątkami, Compaction lub zdarzeniami
  narzędzi, sparuj providera z [agent harness](/pl/plugins/sdk-agent-harness),
  zamiast umieszczać szczegóły protokołu demona w rdzeniu.
</Tip>

## Omówienie krok po kroku

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
    poświadczenia bez ładowania środowiska uruchomieniowego pluginu. Dodaj `providerAuthAliases`,
    gdy wariant providera ma ponownie używać uwierzytelniania innego identyfikatora providera. `modelSupport`
    jest opcjonalne i pozwala OpenClaw automatycznie załadować Twój plugin providera ze skróconych
    identyfikatorów modeli, takich jak `acme-large`, zanim pojawią się hooki środowiska uruchomieniowego. Jeśli publikujesz
    providera w ClawHub, pola `openclaw.compat` i `openclaw.build`
    są wymagane w `package.json`.

  </Step>

  <Step title="Rejestracja providera">
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

    Jeśli upstream provider używa innych tokenów sterujących niż OpenClaw, dodaj
    małą dwukierunkową transformację tekstu zamiast zastępować ścieżkę streamingu:

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

    `input` przepisuje końcowy system prompt i treść wiadomości tekstowych przed
    transportem. `output` przepisuje delty tekstu asystenta i końcowy tekst przed
    analizą własnych znaczników sterujących OpenClaw lub dostarczeniem kanałowym.

    Dla bundlowanych providerów, które rejestrują tylko jednego providera tekstowego z uwierzytelnianiem kluczem API oraz pojedynczym środowiskiem uruchomieniowym opartym na katalogu, preferuj węższy
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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` to ścieżka katalogu na żywo używana wtedy, gdy OpenClaw może rozwiązać rzeczywiste
    uwierzytelnianie providera. Może wykonywać wykrywanie specyficzne dla providera. Używaj
    `buildStaticProvider` tylko dla wierszy offline, które można bezpiecznie wyświetlać przed skonfigurowaniem uwierzytelniania; nie może ono wymagać poświadczeń ani wykonywać żądań sieciowych.
    Widok `models list --all` w OpenClaw obecnie wykonuje katalogi statyczne
    tylko dla bundlowanych pluginów providerów, z pustą konfiguracją, pustym env i bez
    ścieżek agenta/obszaru roboczego.

    Jeśli Twój przepływ uwierzytelniania musi również aktualizować `models.providers.*`, aliasy
    i domyślny model agenta podczas onboardingu, użyj gotowych helperów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe helpery to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` oraz
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint providera obsługuje streamowane bloki użycia na
    standardowym transporcie `openai-completions`, preferuj współdzielone helpery katalogu z
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast sztywno kodować sprawdzenia provider-id. `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie mapy możliwości endpointu, więc natywne endpointy w stylu Moonshot/DashScope nadal mogą się włączyć nawet wtedy, gdy plugin używa niestandardowego provider id.

  </Step>

  <Step title="Dodawanie dynamicznego rozwiązywania modeli">
    Jeśli Twój provider akceptuje dowolne identyfikatory modeli (jak proxy lub router),
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

    Jeśli rozwiązywanie wymaga wywołania sieciowego, użyj `prepareDynamicModel` do asynchronicznego
    rozgrzewania — `resolveDynamicModel` uruchamia się ponownie po jego zakończeniu.

  </Step>

  <Step title="Dodawanie hooków środowiska uruchomieniowego (w razie potrzeby)">
    Większość providerów potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj hooki
    stopniowo, zgodnie z wymaganiami providera.

    Współdzielone kreatory helperów obejmują teraz najczęstsze rodziny zgodności replay/tool,
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

    | Family | Co podłącza | Przykłady bundlowane |
    | --- | --- | --- |
    | `openai-compatible` | Współdzielona polityka replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym sanityzacja tool-call-id, poprawki kolejności assistant-first oraz ogólna walidacja tur Gemini tam, gdzie wymaga tego transport | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Polityka replay świadoma Claude, wybierana według `modelId`, tak aby transporty wiadomości Anthropic otrzymywały czyszczenie bloków thinking specyficzne dla Claude tylko wtedy, gdy rozwiązany model jest rzeczywiście identyfikatorem Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Natywna polityka replay Gemini oraz sanityzacja bootstrap replay i tryb wyjścia reasoning z tagami | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanityzacja thought-signature Gemini dla modeli Gemini działających przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisywania bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Polityka hybrydowa dla providerów, które mieszają powierzchnie modeli wiadomości Anthropic i zgodne z OpenAI w jednym pluginie; opcjonalne usuwanie bloków thinking tylko dla Claude pozostaje ograniczone do strony Anthropic | `minimax` |

    Dostępne obecnie rodziny stream:

    | Family | Co podłącza | Przykłady bundlowane |
    | --- | --- | --- |
    | `google-thinking` | Normalizacja ładunku thinking Gemini na współdzielonej ścieżce streamingu | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper reasoning Kilo na współdzielonej ścieżce streamingu proxy, przy czym `kilo/auto` i nieobsługiwane identyfikatory reasoning proxy pomijają wstrzykiwany thinking | `kilocode` |
    | `moonshot-thinking` | Mapowanie binarnego natywnego ładunku thinking Moonshot na podstawie konfiguracji i poziomu `/think` | `moonshot` |
    | `minimax-fast-mode` | Przepisanie modelu MiniMax fast-mode na współdzielonej ścieżce streamingu | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Współdzielone natywne wrappery OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie w sieci Codex, kształtowanie ładunku reasoning-compat oraz zarządzanie kontekstem Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter dla tras proxy, z centralnie obsługiwanymi pominięciami dla nieobsługiwanych modeli/`auto` | `openrouter` |
    | `tool-stream-default-on` | Domyślnie włączony wrapper `tool_stream` dla providerów takich jak Z.AI, którzy chcą streamingu narzędzi, chyba że zostanie jawnie wyłączony | `zai` |

    <Accordion title="Seamy SDK zasilające kreatory rodzin">
      Każdy kreator rodziny jest złożony z niższego poziomu publicznych helperów eksportowanych z tego samego pakietu, po które możesz sięgnąć, gdy provider musi odejść od wspólnego wzorca:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` oraz surowe kreatory replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Eksportuje też helpery replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) oraz helpery endpointów/modeli (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, a także współdzielone wrappery OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper zgodny z OpenAI dla DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) oraz współdzielone wrappery proxy/providerów (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, bazowe helpery schematów Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) oraz helpery zgodności xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Bundlowany plugin xAI używa z nimi `normalizeResolvedModel` + `contributeResolvedModelCompat`, aby reguły xAI pozostały własnością providera.

      Niektóre helpery streamingu celowo pozostają lokalne dla providera. `@openclaw/anthropic-provider` utrzymuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz niższego poziomu kreatory wrapperów Anthropic we własnym publicznym seam `api.ts` / `contract-api.ts`, ponieważ kodują obsługę beta Claude OAuth i bramkowanie `context1m`. Plugin xAI podobnie utrzymuje natywne kształtowanie Responses xAI we własnym `wrapStreamFn` (aliasy `/fast`, domyślne `tool_stream`, czyszczenie nieobsługiwanych strict-tool, usuwanie ładunku reasoning specyficznego dla xAI).

      Ten sam wzorzec na poziomie katalogu głównego pakietu wspiera też `@openclaw/openai-provider` (kreatory providerów, helpery modeli domyślnych, kreatory providerów realtime) oraz `@openclaw/openrouter-provider` (kreator providera oraz helpery onboardingu/konfiguracji).
    </Accordion>

    <Tabs>
      <Tab title="Wymiana tokenów">
        Dla providerów, którzy wymagają wymiany tokena przed każdym wywołaniem inferencji:

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
        Dla providerów, którzy wymagają niestandardowych nagłówków żądań lub modyfikacji treści żądania:

        ```typescript
        // wrapStreamFn zwraca StreamFn wyprowadzone z ctx.streamFn
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
        Dla providerów, którzy wymagają natywnych nagłówków lub metadanych żądania/sesji na
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
      | 3 | `normalizeModelId` | Czyszczenie aliasów starszych/podglądowych identyfikatorów modeli przed wyszukaniem |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` dla rodziny providera przed ogólnym składaniem modelu |
      | 5 | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Przepisania zgodności natywnego streamingu użycia dla providerów konfiguracyjnych |
      | 7 | `resolveConfigApiKey` | Rozwiązywanie uwierzytelniania markerem env należące do providera |
      | 8 | `resolveSyntheticAuth` | Syntetyczne uwierzytelnianie lokalne/self-hosted lub oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżenie priorytetu syntetycznych placeholderów zapisanych profili względem uwierzytelniania env/config |
      | 10 | `resolveDynamicModel` | Akceptowanie dowolnych identyfikatorów modeli upstream |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobieranie metadanych przed rozwiązywaniem |
      | 12 | `normalizeResolvedModel` | Przepisania transportu przed runnerem |
      | 13 | `contributeResolvedModelCompat` | Flagi zgodności dla modeli dostawcy działających za innym zgodnym transportem |
      | 14 | `capabilities` | Starszy statyczny zbiór możliwości; tylko zgodność |
      | 15 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi należące do providera przed rejestracją |
      | 16 | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do providera |
      | 17 | `resolveReasoningOutputMode` | Kontrakt wyjścia reasoning: tagged vs native |
      | 18 | `prepareExtraParams` | Domyślne parametry żądania |
      | 19 | `createStreamFn` | W pełni niestandardowy transport `StreamFn` |
      | 20 | `wrapStreamFn` | Wrappery niestandardowych nagłówków/treści na standardowej ścieżce streamingu |
      | 21 | `resolveTransportTurnState` | Natywne nagłówki/metadane per tura |
      | 22 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS/cool-down |
      | 23 | `formatApiKey` | Niestandardowy kształt tokena środowiska uruchomieniowego |
      | 24 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 25 | `buildAuthDoctorHint` | Wskazówki naprawy uwierzytelniania |
      | 26 | `matchesContextOverflowError` | Wykrywanie przepełnienia należące do providera |
      | 27 | `classifyFailoverReason` | Klasyfikacja rate-limit/overload należąca do providera |
      | 28 | `isCacheTtlEligible` | Bramkowanie TTL pamięci podręcznej promptu |
      | 29 | `buildMissingAuthMessage` | Niestandardowa wskazówka o brakującym uwierzytelnianiu |
      | 30 | `suppressBuiltInModel` | Ukrywanie nieaktualnych wierszy upstream |
      | 31 | `augmentModelCatalog` | Syntetyczne wiersze zgodności forward |
      | 32 | `resolveThinkingProfile` | Zestaw opcji `/think` specyficzny dla modelu |
      | 33 | `isBinaryThinking` | Zgodność binarnego włączania/wyłączania thinking |
      | 34 | `supportsXHighThinking` | Zgodność obsługi reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Zgodność domyślnej polityki `/think` |
      | 36 | `isModernModelRef` | Dopasowanie modeli live/smoke |
      | 37 | `prepareRuntimeAuth` | Wymiana tokena przed inferencją |
      | 38 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń zużycia |
      | 39 | `fetchUsageSnapshot` | Niestandardowy endpoint zużycia |
      | 40 | `createEmbeddingProvider` | Adapter embeddingów należący do providera dla pamięci/wyszukiwania |
      | 41 | `buildReplayPolicy` | Niestandardowa polityka replay/Compaction transkryptu |
      | 42 | `sanitizeReplayHistory` | Przepisania replay specyficzne dla providera po ogólnym czyszczeniu |
      | 43 | `validateReplayTurns` | Ścisła walidacja tur replay przed osadzonym runnerem |
      | 44 | `onModelSelected` | Callback po wyborze modelu (np. telemetria) |

      Uwagi dotyczące fallbacków środowiska uruchomieniowego:

      - `normalizeConfig` najpierw sprawdza dopasowanego providera, a potem inne pluginy providerów obsługujące hooki, aż któryś faktycznie zmieni konfigurację. Jeśli żaden hook providera nie przepisze obsługiwanej konfiguracji z rodziny Google, nadal zostanie zastosowany bundlowany normalizator konfiguracji Google.
      - `resolveConfigApiKey` używa hooka providera, jeśli jest udostępniony. Bundlowana ścieżka `amazon-bedrock` ma tu także wbudowany resolver markerów env AWS, mimo że uwierzytelnianie środowiska uruchomieniowego Bedrock nadal używa domyślnego łańcucha AWS SDK.
      - `resolveSystemPromptContribution` pozwala providerowi wstrzykiwać wskazówki system prompt świadome pamięci podręcznej dla rodziny modeli. Preferuj to zamiast `before_prompt_build`, gdy zachowanie należy do jednej rodziny provider/model i powinno zachować stabilny/dynamiczny podział pamięci podręcznej.

      Szczegółowe opisy i przykłady z praktyki znajdziesz w [Internals: Hooki środowiska uruchomieniowego providera](/pl/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodawanie dodatkowych możliwości (opcjonalnie)">
    Plugin providera może rejestrować mowę, transkrypcję realtime, głos realtime, rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci
    i wyszukiwanie w sieci obok inferencji tekstowej. OpenClaw klasyfikuje to jako
    plugin **hybrid-capability** — zalecany wzorzec dla pluginów firmowych
    (jeden plugin na dostawcę). Zobacz
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

        Używaj `assertOkOrThrowProviderError(...)` dla błędów HTTP providera, aby
        pluginy współdzieliły ograniczone odczyty treści błędów, parsowanie błędów JSON oraz
        sufiksy request-id.
      </Tab>
      <Tab title="Transkrypcja realtime">
        Preferuj `createRealtimeTranscriptionWebSocketSession(...)` — współdzielony
        helper obsługuje przechwytywanie proxy, backoff ponownego łączenia, opróżnianie przy zamknięciu,
        handshaki gotowości, kolejkowanie audio oraz diagnostykę zdarzeń zamknięcia. Twój plugin
        mapuje tylko zdarzenia upstream.

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

        Providerzy batch STT, którzy wysyłają audio multipart przez POST, powinni używać
        `buildAudioTranscriptionFormData(...)` z
        `openclaw/plugin-sdk/provider-http`. Helper normalizuje nazwy plików
        przesyłanych danych, w tym przesyłanie AAC, które wymaga nazwy pliku w stylu M4A dla
        zgodnych API transkrypcji.
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
      <Tab title="Rozumienie mediów">
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
        Możliwości wideo używają struktury **zależnej od trybu**: `generate`,
        `imageToVideo` i `videoToVideo`. Płaskie pola zbiorcze takie jak
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` nie
        wystarczają, aby czysto ogłaszać obsługę trybów transformacji lub wyłączonych trybów.
        Generowanie muzyki działa według tego samego wzorca z jawnymi blokami `generate` /
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
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Pobieranie i wyszukiwanie w sieci">
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

  <Step title="Test">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Wyeksportuj obiekt konfiguracji providera z index.ts lub z dedykowanego pliku
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

Pluginy providerów publikuje się tak samo jak każdy inny zewnętrzny plugin kodu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Nie używaj tu starszego aliasu publikacji tylko dla Skills; pakiety pluginów powinny używać
`clawhub package publish`.

## Struktura plików

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadane openclaw.providers
├── openclaw.plugin.json      # Manifest z metadanymi uwierzytelniania providera
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testy
    └── usage.ts              # Endpoint zużycia (opcjonalnie)
```

## Odniesienie do kolejności katalogu

`catalog.order` kontroluje, kiedy Twój katalog scala się względem wbudowanych
providerów:

| Order     | Kiedy         | Przypadek użycia                               |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Pierwsze przejście | Prości providerzy z kluczem API              |
| `profile` | Po simple     | Providerzy zależni od profili uwierzytelniania |
| `paired`  | Po profile    | Syntezowanie wielu powiązanych wpisów          |
| `late`    | Ostatnie przejście | Nadpisywanie istniejących providerów (wygrywa przy kolizji) |

## Następne kroki

- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — jeśli Twój plugin udostępnia też kanał
- [Środowisko uruchomieniowe SDK](/pl/plugins/sdk-runtime) — helpery `api.runtime` (TTS, wyszukiwanie, subagent)
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odniesienie do importów subpath
- [Wewnętrzne mechanizmy pluginów](/pl/plugins/architecture-internals#provider-runtime-hooks) — szczegóły hooków i przykłady bundlowane

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Tworzenie pluginów kanałów](/pl/plugins/sdk-channel-plugins)
