---
read_when:
    - Stai creando un nuovo Plugin provider di modelli
    - Vuoi aggiungere un proxy compatibile con OpenAI o un LLM personalizzato a OpenClaw
    - Hai bisogno di comprendere l'autenticazione del provider, i cataloghi e gli hook runtime
sidebarTitle: Provider Plugins
summary: Guida passo passo per creare un Plugin provider di modelli per OpenClaw
title: Creazione di Plugin provider
x-i18n:
    generated_at: "2026-04-22T04:26:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99376d2abfc968429ed19f03451beb0f3597d57c703f2ce60c6c51220656e850
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Creazione di Plugin provider

Questa guida illustra come creare un Plugin provider che aggiunge un provider di modelli
(LLM) a OpenClaw. Alla fine avrai un provider con catalogo modelli,
autenticazione con chiave API e risoluzione dinamica dei modelli.

<Info>
  Se non hai mai creato prima alcun Plugin OpenClaw, leggi prima
  [Per iniziare](/it/plugins/building-plugins) per la struttura di base del
  pacchetto e la configurazione del manifest.
</Info>

<Tip>
  I Plugin provider aggiungono modelli al normale ciclo di inferenza di OpenClaw. Se il modello
  deve essere eseguito tramite un demone agente nativo che possiede thread, Compaction o eventi degli strumenti,
  abbina il provider a un [agent harness](/it/plugins/sdk-agent-harness)
  invece di inserire i dettagli del protocollo del demone nel core.
</Tip>

## Procedura guidata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
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
      "description": "Provider di modelli Acme AI",
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
          "choiceLabel": "Chiave API Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Chiave API Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Il manifest dichiara `providerAuthEnvVars` così OpenClaw può rilevare
    le credenziali senza caricare il runtime del tuo Plugin. Aggiungi `providerAuthAliases`
    quando una variante del provider deve riutilizzare l'autenticazione di un altro ID provider. `modelSupport`
    è facoltativo e consente a OpenClaw di caricare automaticamente il tuo Plugin provider a partire da
    ID modello abbreviati come `acme-large` prima che esistano hook runtime. Se pubblichi il
    provider su ClawHub, i campi `openclaw.compat` e `openclaw.build`
    sono obbligatori in `package.json`.

  </Step>

  <Step title="Registra il provider">
    Un provider minimo ha bisogno di `id`, `label`, `auth` e `catalog`:

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

    Questo è un provider funzionante. Gli utenti ora possono eseguire
    `openclaw onboard --acme-ai-api-key <key>` e selezionare
    `acme-ai/acme-large` come modello.

    Se il provider upstream usa token di controllo diversi da OpenClaw, aggiungi una
    piccola trasformazione bidirezionale del testo invece di sostituire il percorso di streaming:

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

    `input` riscrive il prompt di sistema finale e il contenuto dei messaggi di testo prima del
    trasporto. `output` riscrive i delta di testo dell'assistente e il testo finale prima che
    OpenClaw analizzi i propri marker di controllo o la consegna del canale.

    Per i provider inclusi che registrano solo un provider di testo con
    autenticazione tramite chiave API più un unico runtime supportato dal catalogo, preferisci l'helper più ristretto
    `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` è il percorso del catalogo live usato quando OpenClaw può risolvere una vera
    autenticazione del provider. Può eseguire discovery specifica del provider. Usa
    `buildStaticProvider` solo per righe offline sicure da mostrare prima che l'autenticazione
    sia configurata; non deve richiedere credenziali né fare richieste di rete.
    La visualizzazione `models list --all` di OpenClaw al momento esegue cataloghi statici
    solo per i Plugin provider inclusi, con configurazione vuota, env vuoto e senza
    percorsi agente/workspace.

    Se il tuo flusso di autenticazione deve anche modificare `models.providers.*`, alias
    e il modello predefinito dell'agente durante l'onboarding, usa gli helper preset da
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più stretti sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando l'endpoint nativo di un provider supporta blocchi di utilizzo in streaming sul
    normale trasporto `openai-completions`, preferisci gli helper di catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di hardcodare
    controlli su provider-id. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla mappa delle funzionalità dell'endpoint,
    così gli endpoint nativi in stile Moonshot/DashScope possono comunque aderire anche quando un Plugin usa un ID provider personalizzato.

  </Step>

  <Step title="Aggiungi la risoluzione dinamica dei modelli">
    Se il tuo provider accetta ID modello arbitrari (come un proxy o un router),
    aggiungi `resolveDynamicModel`:

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

    Se la risoluzione richiede una chiamata di rete, usa `prepareDynamicModel` per il
    warm-up asincrono — `resolveDynamicModel` viene eseguito di nuovo dopo il completamento.

  </Step>

  <Step title="Aggiungi hook runtime (se necessario)">
    La maggior parte dei provider ha bisogno solo di `catalog` + `resolveDynamicModel`. Aggiungi gli hook
    in modo incrementale in base alle necessità del tuo provider.

    I builder helper condivisi ora coprono le famiglie più comuni di replay/compatibilità strumenti,
    quindi di solito i Plugin non devono collegare manualmente ogni hook uno per uno:

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

    Famiglie di replay disponibili oggi:

    | Famiglia | Cosa collega |
    | --- | --- |
    | `openai-compatible` | Policy di replay condivisa in stile OpenAI per trasporti compatibili con OpenAI, inclusa la sanitizzazione di tool-call-id, correzioni dell'ordinamento assistant-first e validazione generica dei turni Gemini dove il trasporto ne ha bisogno |
    | `anthropic-by-model` | Policy di replay consapevole di Claude scelta tramite `modelId`, così i trasporti Anthropic-message ricevono la pulizia specifica dei thinking-block di Claude solo quando il modello risolto è davvero un ID Claude |
    | `google-gemini` | Policy di replay nativa Gemini più sanitizzazione del bootstrap replay e modalità di output reasoning con tag |
    | `passthrough-gemini` | Sanitizzazione thought-signature di Gemini per modelli Gemini eseguiti tramite trasporti proxy compatibili con OpenAI; non abilita validazione di replay Gemini nativa né riscritture del bootstrap |
    | `hybrid-anthropic-openai` | Policy ibrida per provider che mescolano superfici di modello Anthropic-message e OpenAI-compatible in un unico Plugin; l'eliminazione facoltativa dei thinking-block solo-Claude resta confinata al lato Anthropic |

    Esempi inclusi reali:

    - `google` e `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famiglie di stream disponibili oggi:

    | Famiglia | Cosa collega |
    | --- | --- |
    | `google-thinking` | Normalizzazione del payload thinking di Gemini sul percorso di stream condiviso |
    | `kilocode-thinking` | Wrapper reasoning di Kilo sul percorso di stream proxy condiviso, con `kilo/auto` e ID reasoning proxy non supportati che saltano il thinking iniettato |
    | `moonshot-thinking` | Mappatura del payload native-thinking binario di Moonshot da configurazione + livello `/think` |
    | `minimax-fast-mode` | Riscrittura del modello fast-mode di MiniMax sul percorso di stream condiviso |
    | `openai-responses-defaults` | Wrapper condivisi nativi OpenAI/Codex Responses: header di attribuzione, `/fast`/`serviceTier`, verbosità del testo, ricerca web nativa Codex, modellazione del payload compatibile con il reasoning e gestione del contesto Responses |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter per route proxy, con skip di modello non supportato/`auto` gestiti centralmente |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo per impostazione predefinita per provider come Z.AI che vogliono lo streaming degli strumenti salvo disabilitazione esplicita |

    Esempi inclusi reali:

    - `google` e `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` esporta anche l'enum della
    famiglia replay più gli helper condivisi da cui queste famiglie sono costruite. Gli
    export pubblici comuni includono:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builder replay condivisi come `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` e
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helper replay di Gemini come `sanitizeGoogleGeminiReplayHistory(...)`
      e `resolveTaggedReasoningOutputMode()`
    - helper endpoint/modello come `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` e
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` espone sia il builder di famiglia sia
    gli helper wrapper pubblici riusati da queste famiglie. Gli export pubblici comuni
    includono:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - wrapper condivisi OpenAI/Codex come
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` e
      `createCodexNativeWebSearchWrapper(...)`
    - wrapper condivisi proxy/provider come `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` e `createMinimaxFastModeWrapper(...)`

    Alcuni helper di stream restano intenzionalmente locali al provider. Esempio
    incluso attuale: `@openclaw/anthropic-provider` esporta
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i
    builder wrapper Anthropic di livello più basso dalla propria seam pubblica `api.ts` /
    `contract-api.ts`. Questi helper restano specifici di Anthropic perché
    codificano anche la gestione beta di Claude OAuth e il gating `context1m`.

    Anche altri provider inclusi mantengono locali i wrapper specifici del trasporto quando
    il comportamento non è condivisibile in modo pulito tra le famiglie. Esempio attuale: il
    Plugin xAI incluso mantiene nel proprio
    `wrapStreamFn` la modellazione nativa xAI Responses, inclusi riscritture alias `/fast`, `tool_stream` predefinito,
    pulizia strict-tool non supportata e rimozione del
    payload reasoning specifico di xAI.

    `openclaw/plugin-sdk/provider-tools` al momento espone una sola famiglia condivisa di
    tool-schema più helper condivisi di schema/compatibilità:

    - `ProviderToolCompatFamily` documenta oggi l'inventario delle famiglie condivise.
    - `buildProviderToolCompatFamilyHooks("gemini")` collega la
      pulizia dello schema Gemini + diagnostica per provider che necessitano di tool schema sicuri per Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      sono i sottostanti helper pubblici di schema Gemini.
    - `resolveXaiModelCompatPatch()` restituisce la patch di compatibilità xAI inclusa:
      `toolSchemaProfile: "xai"`, keyword di schema non supportate, supporto nativo
      `web_search` e decodifica degli argomenti di tool-call con entità HTML.
    - `applyXaiModelCompat(model)` applica la stessa patch di compatibilità xAI a un
      modello risolto prima che raggiunga il runner.

    Esempio incluso reale: il Plugin xAI usa `normalizeResolvedModel` più
    `contributeResolvedModelCompat` per mantenere questi metadati di compatibilità sotto il controllo del
    provider invece di hardcodare le regole xAI nel core.

    Lo stesso pattern a radice di pacchetto supporta anche altri provider inclusi:

    - `@openclaw/openai-provider`: `api.ts` esporta builder di provider,
      helper per modelli predefiniti e builder di provider realtime
    - `@openclaw/openrouter-provider`: `api.ts` esporta il builder del provider
      più helper di onboarding/configurazione

    <Tabs>
      <Tab title="Scambio di token">
        Per i provider che richiedono uno scambio di token prima di ogni chiamata di inferenza:

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
      <Tab title="Header personalizzati">
        Per i provider che richiedono header di richiesta personalizzati o modifiche al body:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
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
      <Tab title="Identità nativa del trasporto">
        Per i provider che richiedono header o metadati nativi di richiesta/sessione su
        trasporti HTTP o WebSocket generici:

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
      <Tab title="Utilizzo e fatturazione">
        Per i provider che espongono dati di utilizzo/fatturazione:

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

    <Accordion title="Tutti gli hook provider disponibili">
      OpenClaw chiama gli hook in questo ordine. La maggior parte dei provider ne usa solo 2-3:

      | # | Hook | Quando usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogo modelli o valori predefiniti `baseUrl` |
      | 2 | `applyConfigDefaults` | Valori predefiniti globali posseduti dal provider durante la materializzazione della configurazione |
      | 3 | `normalizeModelId` | Pulizia degli alias legacy/preview degli ID modello prima della ricerca |
      | 4 | `normalizeTransport` | Pulizia della famiglia provider `api` / `baseUrl` prima dell'assemblaggio generico del modello |
      | 5 | `normalizeConfig` | Normalizzare la configurazione `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità native dello streaming-usage per provider di configurazione |
      | 7 | `resolveConfigApiKey` | Risoluzione dell'autenticazione env-marker posseduta dal provider |
      | 8 | `resolveSyntheticAuth` | Autenticazione sintetica locale/self-hosted o supportata da configurazione |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abbassare i placeholder sintetici dei profili memorizzati dietro l'autenticazione env/configurazione |
      | 10 | `resolveDynamicModel` | Accettare ID modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |

    Note sul fallback runtime:

    - `normalizeConfig` controlla prima il provider corrispondente, poi gli altri
      Plugin provider con hook-capable finché uno non cambia effettivamente la configurazione.
      Se nessun hook provider riscrive una voce di configurazione supportata della famiglia Google, viene comunque applicato il normalizzatore di configurazione Google incluso.
    - `resolveConfigApiKey` usa l'hook del provider quando esposto. Il percorso incluso
      `amazon-bedrock` ha anche qui un resolver integrato di env-marker AWS,
      anche se l'autenticazione runtime di Bedrock continua a usare la catena predefinita dell'AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flag di compatibilità per modelli vendor dietro un altro trasporto compatibile |
      | 14 | `capabilities` | Vecchio bag statico di funzionalità; solo compatibilità |
      | 15 | `normalizeToolSchemas` | Pulizia dei tool-schema posseduta dal provider prima della registrazione |
      | 16 | `inspectToolSchemas` | Diagnostica dei tool-schema posseduta dal provider |
      | 17 | `resolveReasoningOutputMode` | Contratto dell'output reasoning con tag vs nativo |
      | 18 | `prepareExtraParams` | Parametri di richiesta predefiniti |
      | 19 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 20 | `wrapStreamFn` | Wrapper personalizzati di header/body sul normale percorso di stream |
      | 21 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 22 | `resolveWebSocketSessionPolicy` | Header/cool-down della sessione WS nativa |
      | 23 | `formatApiKey` | Forma personalizzata del token runtime |
      | 24 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 25 | `buildAuthDoctorHint` | Indicazioni per la riparazione dell'autenticazione |
      | 26 | `matchesContextOverflowError` | Rilevamento overflow posseduto dal provider |
      | 27 | `classifyFailoverReason` | Classificazione di rate-limit/sovraccarico posseduta dal provider |
      | 28 | `isCacheTtlEligible` | Gating TTL della cache dei prompt |
      | 29 | `buildMissingAuthMessage` | Suggerimento personalizzato per autenticazione mancante |
      | 30 | `suppressBuiltInModel` | Nascondere righe upstream obsolete |
      | 31 | `augmentModelCatalog` | Righe sintetiche forward-compat |
      | 32 | `resolveThinkingProfile` | Set di opzioni `/think` specifico del modello |
      | 33 | `isBinaryThinking` | Compatibilità thinking binario on/off |
      | 34 | `supportsXHighThinking` | Compatibilità del supporto reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilità del criterio predefinito `/think` |
      | 36 | `isModernModelRef` | Corrispondenza del modello live/smoke |
      | 37 | `prepareRuntimeAuth` | Scambio di token prima dell'inferenza |
      | 38 | `resolveUsageAuth` | Parsing personalizzato delle credenziali di utilizzo |
      | 39 | `fetchUsageSnapshot` | Endpoint di utilizzo personalizzato |
      | 40 | `createEmbeddingProvider` | Adapter di embedding posseduto dal provider per memoria/ricerca |
      | 41 | `buildReplayPolicy` | Policy personalizzata di replay/Compaction della trascrizione |
      | 42 | `sanitizeReplayHistory` | Riscritture di replay specifiche del provider dopo la pulizia generica |
      | 43 | `validateReplayTurns` | Validazione strict dei turni di replay prima del runner incorporato |
      | 44 | `onModelSelected` | Callback post-selezione (ad es. telemetria) |

      Nota sul prompt tuning:

      - `resolveSystemPromptContribution` consente a un provider di iniettare
        indicazioni del prompt di sistema consapevoli della cache per una famiglia di modelli. Preferiscilo rispetto a
        `before_prompt_build` quando il comportamento appartiene a una famiglia provider/modello
        e dovrebbe preservare la suddivisione stabile/dinamica della cache.

      Per descrizioni dettagliate ed esempi reali, vedi
      [Internals: Provider Runtime Hooks](/it/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi funzionalità extra (facoltativo)">
    <a id="step-5-add-extra-capabilities"></a>
    Un Plugin provider può registrare speech, trascrizione realtime, voce
    realtime, comprensione dei contenuti multimediali, generazione di immagini, generazione video, web fetch
    e ricerca web insieme all'inferenza testuale:

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

    OpenClaw lo classifica come Plugin **hybrid-capability**. Questo è il
    pattern consigliato per i Plugin aziendali (un Plugin per vendor). Vedi
    [Internals: Capability Ownership](/it/plugins/architecture#capability-ownership-model).

    Per la generazione video, preferisci la forma di funzionalità consapevole della modalità mostrata sopra:
    `generate`, `imageToVideo` e `videoToVideo`. Campi aggregati piatti come
    `maxInputImages`, `maxInputVideos` e `maxDurationSeconds` non sono
    sufficienti per pubblicizzare in modo pulito il supporto alle modalità di trasformazione o alle modalità disabilitate.

    I provider di generazione musicale dovrebbero seguire lo stesso pattern:
    `generate` per la generazione basata solo su prompt e `edit` per la generazione basata su immagine di riferimento.
    Campi aggregati piatti come `maxInputImages`,
    `supportsLyrics` e `supportsFormat` non sono sufficienti per pubblicizzare il supporto a
    edit; i blocchi espliciti `generate` / `edit` sono il contratto previsto.

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

## Pubblica su ClawHub

I Plugin provider si pubblicano allo stesso modo di qualsiasi altro Plugin di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Non usare qui l'alias legacy di pubblicazione solo per Skills; i pacchetti Plugin dovrebbero usare
`clawhub package publish`.

## Struttura dei file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadati openclaw.providers
├── openclaw.plugin.json      # Manifest con metadati di autenticazione del provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Test
    └── usage.ts              # Endpoint di utilizzo (facoltativo)
```

## Riferimento dell'ordine del catalogo

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai
provider integrati:

| Ordine    | Quando        | Caso d'uso                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primo passaggio | Provider semplici con chiave API               |
| `profile` | Dopo simple   | Provider subordinati ai profili di autenticazione |
| `paired`  | Dopo profile  | Sintetizzare più voci correlate                 |
| `late`    | Ultimo passaggio | Sostituire provider esistenti (vince in caso di collisione) |

## Passi successivi

- [Plugin di canale](/it/plugins/sdk-channel-plugins) — se il tuo Plugin fornisce anche un canale
- [SDK Runtime](/it/plugins/sdk-runtime) — helper `api.runtime` (TTS, ricerca, sottoagente)
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo degli import dei sottopercorsi
- [Internals del Plugin](/it/plugins/architecture#provider-runtime-hooks) — dettagli degli hook ed esempi inclusi
