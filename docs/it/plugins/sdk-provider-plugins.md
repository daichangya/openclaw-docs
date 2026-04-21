---
read_when:
    - Stai creando un nuovo plugin provider di modelli
    - Vuoi aggiungere un proxy compatibile con OpenAI o un LLM personalizzato a OpenClaw
    - Devi comprendere l'autenticazione del provider, i cataloghi e gli hook di runtime
sidebarTitle: Provider Plugins
summary: Guida passo passo alla creazione di un plugin provider di modelli per OpenClaw
title: Creazione di plugin provider
x-i18n:
    generated_at: "2026-04-21T13:35:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08494658def4a003a1e5752f68d9232bfbbbf76348cf6f319ea1a6855c2ae439
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Creazione di plugin provider

Questa guida illustra la creazione di un plugin provider che aggiunge un provider
di modelli (LLM) a OpenClaw. Alla fine avrai un provider con un catalogo di modelli,
autenticazione tramite chiave API e risoluzione dinamica dei modelli.

<Info>
  Se non hai mai creato prima un plugin OpenClaw, leggi prima
  [Introduzione](/it/plugins/building-plugins) per la struttura di base del
  pacchetto e la configurazione del manifest.
</Info>

<Tip>
  I plugin provider aggiungono modelli al normale ciclo di inferenza di OpenClaw. Se il modello
  deve essere eseguito tramite un demone agente nativo che gestisce thread,
  Compaction o eventi degli strumenti, abbina il provider a un [agent harness](/it/plugins/sdk-agent-harness)
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
    le credenziali senza caricare il runtime del tuo plugin. Aggiungi `providerAuthAliases`
    quando una variante del provider deve riutilizzare l'autenticazione di un altro id provider. `modelSupport`
    è facoltativo e consente a OpenClaw di caricare automaticamente il tuo plugin provider a partire da
    id modello abbreviati come `acme-large` prima che esistano hook di runtime. Se pubblichi il
    provider su ClawHub, i campi `openclaw.compat` e `openclaw.build`
    sono obbligatori in `package.json`.

  </Step>

  <Step title="Registra il provider">
    Un provider minimo richiede `id`, `label`, `auth` e `catalog`:

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

    Questo è un provider funzionante. Gli utenti ora possono
    `openclaw onboard --acme-ai-api-key <key>` e selezionare
    `acme-ai/acme-large` come modello.

    Se il provider upstream usa token di controllo diversi da quelli di OpenClaw, aggiungi una
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

    `input` riscrive il prompt di sistema finale e il contenuto dei messaggi di testo prima
    del trasporto. `output` riscrive i delta di testo dell'assistente e il testo finale prima che
    OpenClaw analizzi i propri marcatori di controllo o la consegna al canale.

    Per i provider inclusi che registrano solo un provider di testo con autenticazione tramite chiave API
    più un singolo runtime basato su catalogo, preferisci l'helper più specifico
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
        },
      },
    });
    ```

    Se il tuo flusso di autenticazione deve anche correggere `models.providers.*`, alias e
    il modello predefinito dell'agente durante l'onboarding, usa gli helper preset da
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più specifici sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando un endpoint nativo del provider supporta blocchi di utilizzo in streaming sul
    normale trasporto `openai-completions`, preferisci gli helper di catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di codificare controlli basati su id provider.
    `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla mappa delle capacità dell'endpoint,
    così gli endpoint nativi in stile Moonshot/DashScope possono comunque aderire anche quando un plugin usa un id provider personalizzato.

  </Step>

  <Step title="Aggiungi la risoluzione dinamica dei modelli">
    Se il tuo provider accetta id modello arbitrari, come un proxy o un router,
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
    warm-up asincrono — `resolveDynamicModel` viene eseguito di nuovo al termine.

  </Step>

  <Step title="Aggiungi hook di runtime, se necessario">
    La maggior parte dei provider richiede solo `catalog` + `resolveDynamicModel`. Aggiungi gli hook
    in modo incrementale in base alle esigenze del tuo provider.

    I builder di helper condivisi ora coprono le famiglie più comuni di replay/compatibilità strumenti,
    quindi di solito i plugin non devono collegare manualmente ogni hook uno per uno:

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
    | `openai-compatible` | Policy di replay condivisa in stile OpenAI per trasporti compatibili con OpenAI, inclusa la sanificazione di tool-call-id, le correzioni dell'ordinamento assistant-first e la validazione generica dei turni Gemini dove il trasporto la richiede |
    | `anthropic-by-model` | Policy di replay compatibile con Claude scelta in base a `modelId`, così i trasporti di messaggi Anthropic ricevono la pulizia dei blocchi di thinking specifica per Claude solo quando il modello risolto è effettivamente un id Claude |
    | `google-gemini` | Policy di replay Gemini nativa più sanificazione del replay bootstrap e modalità di output del ragionamento con tag |
    | `passthrough-gemini` | Sanificazione della thought signature Gemini per modelli Gemini eseguiti tramite trasporti proxy compatibili con OpenAI; non abilita la validazione nativa del replay Gemini né le riscritture bootstrap |
    | `hybrid-anthropic-openai` | Policy ibrida per provider che combinano superfici di modelli di messaggi Anthropic e compatibili con OpenAI in un unico plugin; l'eliminazione facoltativa dei blocchi di thinking solo-Claude resta limitata al lato Anthropic |

    Esempi reali inclusi:

    - `google` e `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` e `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` e `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` e `zai`: `openai-compatible`

    Famiglie di stream disponibili oggi:

    | Famiglia | Cosa collega |
    | --- | --- |
    | `google-thinking` | Normalizzazione del payload di thinking Gemini sul percorso di stream condiviso |
    | `kilocode-thinking` | Wrapper di ragionamento Kilo sul percorso di stream proxy condiviso, con `kilo/auto` e id di ragionamento proxy non supportati che saltano il thinking iniettato |
    | `moonshot-thinking` | Mappatura del payload binario di native-thinking Moonshot da config + livello `/think` |
    | `minimax-fast-mode` | Riscrittura del modello MiniMax fast-mode sul percorso di stream condiviso |
    | `openai-responses-defaults` | Wrapper condivisi nativi OpenAI/Codex Responses: header di attribuzione, `/fast`/`serviceTier`, verbosità del testo, ricerca web nativa Codex, modellazione del payload compatibile con il ragionamento e gestione del contesto Responses |
    | `openrouter-thinking` | Wrapper di ragionamento OpenRouter per percorsi proxy, con salti per modelli non supportati/`auto` gestiti centralmente |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo per impostazione predefinita per provider come Z.AI che vogliono lo streaming degli strumenti salvo esplicita disattivazione |

    Esempi reali inclusi:

    - `google` e `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` e `minimax-portal`: `minimax-fast-mode`
    - `openai` e `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` esporta anche l'enum
    della famiglia di replay più gli helper condivisi su cui si basano tali famiglie. Le esportazioni
    pubbliche comuni includono:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - builder di replay condivisi come `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` e
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helper di replay Gemini come `sanitizeGoogleGeminiReplayHistory(...)`
      e `resolveTaggedReasoningOutputMode()`
    - helper di endpoint/modello come `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` e
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` espone sia il builder della famiglia sia
    gli helper wrapper pubblici riutilizzati da quelle famiglie. Le esportazioni
    pubbliche comuni includono:

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
    builder di wrapper Anthropic di livello inferiore dal proprio seam pubblico `api.ts` /
    `contract-api.ts`. Questi helper restano specifici per Anthropic perché
    codificano anche la gestione beta di Claude OAuth e il gating `context1m`.

    Anche altri provider inclusi mantengono wrapper specifici del trasporto a livello locale quando
    il comportamento non è condivisibile in modo pulito tra famiglie. Esempio attuale: il
    plugin xAI incluso mantiene la modellazione nativa xAI Responses nel proprio
    `wrapStreamFn`, inclusi riscritture degli alias `/fast`, `tool_stream` predefinito,
    pulizia degli strict-tool non supportati e rimozione del payload di ragionamento
    specifica di xAI.

    `openclaw/plugin-sdk/provider-tools` attualmente espone una famiglia condivisa
    per lo schema degli strumenti più helper condivisi di schema/compatibilità:

    - `ProviderToolCompatFamily` documenta oggi l'inventario delle famiglie condivise.
    - `buildProviderToolCompatFamilyHooks("gemini")` collega la pulizia dello schema Gemini
      + la diagnostica per i provider che necessitano di schemi strumenti sicuri per Gemini.
    - `normalizeGeminiToolSchemas(...)` e `inspectGeminiToolSchemas(...)`
      sono i relativi helper pubblici sottostanti per gli schemi Gemini.
    - `resolveXaiModelCompatPatch()` restituisce la patch di compatibilità xAI inclusa:
      `toolSchemaProfile: "xai"`, parole chiave di schema non supportate, supporto nativo
      `web_search` e decodifica degli argomenti di chiamata strumento con entità HTML.
    - `applyXaiModelCompat(model)` applica la stessa patch di compatibilità xAI a un
      modello risolto prima che raggiunga il runner.

    Esempio reale incluso: il plugin xAI usa `normalizeResolvedModel` più
    `contributeResolvedModelCompat` per mantenere quei metadati di compatibilità sotto la responsabilità del
    provider invece di codificare regole xAI nel core.

    Lo stesso pattern di package-root supporta anche altri provider inclusi:

    - `@openclaw/openai-provider`: `api.ts` esporta builder di provider,
      helper per i modelli predefiniti e builder di provider realtime
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
        // wrapStreamFn restituisce uno StreamFn derivato da ctx.streamFn
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
      <Tab title="Identità del trasporto nativo">
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
      | 1 | `catalog` | Catalogo modelli o valori predefiniti di base URL |
      | 2 | `applyConfigDefaults` | Valori predefiniti globali del provider durante la materializzazione della configurazione |
      | 3 | `normalizeModelId` | Pulizia di alias legacy/preview degli id modello prima della ricerca |
      | 4 | `normalizeTransport` | Pulizia di `api` / `baseUrl` della famiglia provider prima dell'assemblaggio generico del modello |
      | 5 | `normalizeConfig` | Normalizza la configurazione `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità native per streaming-usage per provider configurati |
      | 7 | `resolveConfigApiKey` | Risoluzione dell'autenticazione dei marker env gestita dal provider |
      | 8 | `resolveSyntheticAuth` | Autenticazione sintetica locale/self-hosted o basata su config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abbassa la priorità dei placeholder sintetici dei profili memorizzati rispetto all'autenticazione env/config |
      | 10 | `resolveDynamicModel` | Accetta id modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |

    Note sul fallback di runtime:

    - `normalizeConfig` controlla prima il provider corrispondente, poi gli altri
      plugin provider con capacità di hook finché uno non modifica effettivamente la configurazione.
      Se nessun hook provider riscrive una voce di configurazione supportata della famiglia Google, continua comunque ad applicarsi
      il normalizzatore di configurazione Google incluso.
    - `resolveConfigApiKey` usa l'hook provider quando disponibile. Anche il percorso incluso
      `amazon-bedrock` ha qui un resolver integrato di marker env AWS,
      anche se l'autenticazione runtime Bedrock continua comunque a usare la catena predefinita dell'AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flag di compatibilità per modelli vendor dietro un altro trasporto compatibile |
      | 14 | `capabilities` | Vecchio contenitore statico di capacità; solo compatibilità |
      | 15 | `normalizeToolSchemas` | Pulizia dello schema strumenti gestita dal provider prima della registrazione |
      | 16 | `inspectToolSchemas` | Diagnostica dello schema strumenti gestita dal provider |
      | 17 | `resolveReasoningOutputMode` | Contratto di output del ragionamento con tag o nativo |
      | 18 | `prepareExtraParams` | Parametri di richiesta predefiniti |
      | 19 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 20 | `wrapStreamFn` | Wrapper personalizzati di header/body sul normale percorso di stream |
      | 21 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 22 | `resolveWebSocketSessionPolicy` | Header di sessione WS nativi/cool-down |
      | 23 | `formatApiKey` | Forma personalizzata del token runtime |
      | 24 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 25 | `buildAuthDoctorHint` | Indicazioni per la riparazione dell'autenticazione |
      | 26 | `matchesContextOverflowError` | Rilevamento dell'overflow gestito dal provider |
      | 27 | `classifyFailoverReason` | Classificazione di rate-limit/sovraccarico gestita dal provider |
      | 28 | `isCacheTtlEligible` | Gating TTL della cache dei prompt |
      | 29 | `buildMissingAuthMessage` | Suggerimento personalizzato per autenticazione mancante |
      | 30 | `suppressBuiltInModel` | Nasconde righe upstream obsolete |
      | 31 | `augmentModelCatalog` | Righe sintetiche di forward-compat |
      | 32 | `resolveThinkingProfile` | Insieme di opzioni `/think` specifico del modello |
      | 33 | `isBinaryThinking` | Compatibilità on/off del thinking binario |
      | 34 | `supportsXHighThinking` | Compatibilità del supporto al ragionamento `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilità della policy `/think` predefinita |
      | 36 | `isModernModelRef` | Corrispondenza del modello live/smoke |
      | 37 | `prepareRuntimeAuth` | Scambio di token prima dell'inferenza |
      | 38 | `resolveUsageAuth` | Parsing personalizzato delle credenziali di utilizzo |
      | 39 | `fetchUsageSnapshot` | Endpoint di utilizzo personalizzato |
      | 40 | `createEmbeddingProvider` | Adattatore embedding gestito dal provider per memoria/ricerca |
      | 41 | `buildReplayPolicy` | Policy personalizzata di replay/Compaction della trascrizione |
      | 42 | `sanitizeReplayHistory` | Riscritture di replay specifiche del provider dopo la pulizia generica |
      | 43 | `validateReplayTurns` | Validazione rigorosa dei turni di replay prima del runner incorporato |
      | 44 | `onModelSelected` | Callback post-selezione, ad esempio telemetria |

      Nota sull'ottimizzazione dei prompt:

      - `resolveSystemPromptContribution` consente a un provider di iniettare
        indicazioni del prompt di sistema compatibili con la cache per una famiglia di modelli. Preferiscilo a
        `before_prompt_build` quando il comportamento appartiene a una singola famiglia provider/modello
        e deve preservare la suddivisione cache stabile/dinamica.

      Per descrizioni dettagliate ed esempi reali, vedi
      [Interni: Hook di runtime del provider](/it/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi capacità extra, facoltative">
    <a id="step-5-add-extra-capabilities"></a>
    Un plugin provider può registrare sintesi vocale, trascrizione realtime, voce realtime,
    comprensione dei media, generazione di immagini, generazione di video, web fetch
    e web search insieme all'inferenza testuale:

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
        hint: "Recupera pagine tramite il backend di rendering di Acme.",
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
          description: "Recupera una pagina tramite Acme Fetch.",
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

    OpenClaw lo classifica come plugin **hybrid-capability**. Questo è il
    pattern consigliato per i plugin aziendali, un plugin per vendor. Vedi
    [Interni: Proprietà delle capacità](/it/plugins/architecture#capability-ownership-model).

    Per la generazione di video, preferisci la forma di capacità sensibile alla modalità mostrata sopra:
    `generate`, `imageToVideo` e `videoToVideo`. Campi aggregati piatti come
    `maxInputImages`, `maxInputVideos` e `maxDurationSeconds` non sono
    sufficienti per pubblicizzare in modo pulito il supporto alle modalità di trasformazione o le modalità disabilitate.

    I provider di generazione musicale dovrebbero seguire lo stesso pattern:
    `generate` per la generazione basata solo su prompt e `edit` per la generazione
    basata su immagine di riferimento. Campi aggregati piatti come `maxInputImages`,
    `supportsLyrics` e `supportsFormat` non sono sufficienti per pubblicizzare il supporto alla modifica;
    i blocchi espliciti `generate` / `edit` sono il contratto previsto.

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

I plugin provider si pubblicano allo stesso modo di qualsiasi altro plugin di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Non usare qui il vecchio alias di pubblicazione solo per Skills; i pacchetti plugin devono usare
`clawhub package publish`.

## Struttura dei file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # Metadati openclaw.providers
├── openclaw.plugin.json      # Manifest con metadati di autenticazione del provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Test
    └── usage.ts              # Endpoint di utilizzo, facoltativo
```

## Riferimento per l'ordine del catalogo

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai
provider integrati:

| Ordine    | Quando        | Caso d'uso                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primo passaggio | Provider semplici con chiave API              |
| `profile` | Dopo simple   | Provider vincolati ai profili di autenticazione |
| `paired`  | Dopo profile  | Sintetizza più voci correlate                   |
| `late`    | Ultimo passaggio | Sovrascrive provider esistenti, vince in caso di collisione |

## Passaggi successivi

- [Plugin di canale](/it/plugins/sdk-channel-plugins) — se il tuo plugin fornisce anche un canale
- [Runtime SDK](/it/plugins/sdk-runtime) — helper `api.runtime`, TTS, search, subagent
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento completo per le importazioni dei sottopercorsi
- [Interni dei plugin](/it/plugins/architecture#provider-runtime-hooks) — dettagli degli hook ed esempi inclusi
