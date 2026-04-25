---
read_when:
    - Stai creando un nuovo Plugin provider di modelli
    - Vuoi aggiungere un proxy compatibile con OpenAI o un LLM personalizzato a OpenClaw
    - Devi comprendere l'autenticazione del provider, i cataloghi e gli hook di runtime
sidebarTitle: Provider plugins
summary: Guida passo passo per creare un Plugin provider di modelli per OpenClaw
title: Creazione di Plugin provider 奥门ങ്ങി
x-i18n:
    generated_at: "2026-04-25T13:53:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Questa guida spiega come creare un Plugin provider che aggiunge un provider di modelli
(LLM) a OpenClaw. Alla fine avrai un provider con un catalogo di modelli,
autenticazione tramite chiave API e risoluzione dinamica dei modelli.

<Info>
  Se non hai ancora creato alcun Plugin OpenClaw, leggi prima
  [Per iniziare](/it/plugins/building-plugins) per la struttura di base del
  pacchetto e la configurazione del manifest.
</Info>

<Tip>
  I Plugin provider aggiungono modelli al normale ciclo di inferenza di OpenClaw. Se il modello
  deve essere eseguito tramite un demone nativo dell'agente che gestisce thread,
  Compaction o eventi degli strumenti, abbina invece il provider a un [agent harness](/it/plugins/sdk-agent-harness)
  anziché inserire i dettagli del protocollo del demone nel core.
</Tip>

## Procedura guidata

<Steps>
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

    Il manifest dichiara `providerAuthEnvVars` in modo che OpenClaw possa rilevare
    le credenziali senza caricare il runtime del tuo Plugin. Aggiungi `providerAuthAliases`
    quando una variante del provider deve riutilizzare l'autenticazione di un altro id provider. `modelSupport`
    è facoltativo e consente a OpenClaw di caricare automaticamente il tuo Plugin provider a partire da id modello
    abbreviati come `acme-large` prima che esistano hook di runtime. Se pubblichi il
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
      description: "Provider di modelli Acme AI",
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
              label: "Chiave API Acme AI",
              hint: "Chiave API dalla dashboard di Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Inserisci la tua chiave API Acme AI",
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
    piccola trasformazione di testo bidirezionale invece di sostituire il percorso dello stream:

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
    OpenClaw analizzi i propri marker di controllo o la consegna del canale.

    Per i provider inclusi che registrano solo un provider di testo con autenticazione tramite chiave API
    più un singolo runtime basato su catalogo, preferisci l'helper più specifico
    `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Provider di modelli Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Chiave API Acme AI",
            hint: "Chiave API dalla dashboard di Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Inserisci la tua chiave API Acme AI",
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

    `buildProvider` è il percorso del catalogo live usato quando OpenClaw può risolvere
    l'autenticazione reale del provider. Può eseguire il rilevamento specifico del provider. Usa
    `buildStaticProvider` solo per righe offline che è sicuro mostrare prima che l'autenticazione
    sia configurata; non deve richiedere credenziali né effettuare richieste di rete.
    La visualizzazione `models list --all` di OpenClaw attualmente esegue cataloghi statici
    solo per i Plugin provider inclusi, con una configurazione vuota, env vuoto e nessun
    percorso agente/workspace.

    Se il tuo flusso di autenticazione deve anche aggiornare `models.providers.*`,
    alias e il modello predefinito dell'agente durante l'onboarding, usa gli helper preset da
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più specifici sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando un endpoint nativo del provider supporta blocchi di utilizzo in streaming sul normale
    trasporto `openai-completions`, preferisci gli helper di catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di codificare controlli sull'id provider.
    `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla
    mappa delle capacità dell'endpoint, quindi gli endpoint nativi in stile Moonshot/DashScope continuano
    ad aderire anche quando un Plugin usa un id provider personalizzato.

  </Step>

  <Step title="Aggiungi la risoluzione dinamica dei modelli">
    Se il tuo provider accetta id modello arbitrari (come un proxy o un router),
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
    warm-up asincrono — `resolveDynamicModel` viene eseguito di nuovo al completamento.

  </Step>

  <Step title="Aggiungi hook di runtime (se necessario)">
    La maggior parte dei provider richiede solo `catalog` + `resolveDynamicModel`. Aggiungi gli hook
    in modo incrementale secondo le esigenze del tuo provider.

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

    Famiglie di replay attualmente disponibili:

    | Family | Cosa collega | Esempi inclusi |
    | --- | --- | --- |
    | `openai-compatible` | Policy di replay condivisa in stile OpenAI per trasporti compatibili con OpenAI, inclusa la sanificazione di tool-call-id, correzioni dell'ordine assistant-first e validazione generica dei turni Gemini dove il trasporto lo richiede | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Policy di replay compatibile con Claude scelta in base a `modelId`, così i trasporti di messaggi Anthropic ricevono la pulizia dei blocchi di thinking specifica di Claude solo quando il modello risolto è davvero un id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Policy di replay Gemini nativa più sanificazione del replay bootstrap e modalità di output reasoning con tag | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanificazione della thought-signature Gemini per modelli Gemini eseguiti tramite trasporti proxy compatibili con OpenAI; non abilita la validazione di replay Gemini nativa né riscritture bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Policy ibrida per provider che combinano superfici di modelli di messaggi Anthropic e compatibili con OpenAI in un unico Plugin; l'eventuale rimozione dei blocchi di thinking solo-Claude resta limitata al lato Anthropic | `minimax` |

    Famiglie di stream attualmente disponibili:

    | Family | Cosa collega | Esempi inclusi |
    | --- | --- | --- |
    | `google-thinking` | Normalizzazione del payload di thinking Gemini nel percorso stream condiviso | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper di reasoning Kilo nel percorso stream proxy condiviso, con `kilo/auto` e id di reasoning proxy non supportati che saltano il thinking iniettato | `kilocode` |
    | `moonshot-thinking` | Mappatura del payload native-thinking binario di Moonshot da config + livello `/think` | `moonshot` |
    | `minimax-fast-mode` | Riscrittura del modello fast-mode MiniMax nel percorso stream condiviso | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper nativi condivisi OpenAI/Codex Responses: header di attribuzione, `/fast`/`serviceTier`, verbosità del testo, ricerca web nativa Codex, modellazione del payload compatibile con reasoning e gestione del contesto Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper di reasoning OpenRouter per percorsi proxy, con skip per modello non supportato/`auto` gestiti centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` abilitato per impostazione predefinita per provider come Z.AI che vogliono lo streaming degli strumenti salvo disattivazione esplicita | `zai` |

    <Accordion title="Interfacce SDK che alimentano i builder di famiglia">
      Ogni builder di famiglia è composto da helper pubblici di livello inferiore esportati dallo stesso package, che puoi usare quando un provider deve uscire dal pattern comune:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e i builder raw di replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Esporta anche helper di replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helper per endpoint/modello (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, più i wrapper condivisi OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) e i wrapper proxy/provider condivisi (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, helper di schema Gemini sottostanti (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) e helper di compatibilità xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Il Plugin xAI incluso usa `normalizeResolvedModel` + `contributeResolvedModelCompat` con questi helper per mantenere le regole xAI di proprietà del provider.

      Alcuni helper di stream restano volutamente locali al provider. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder wrapper Anthropic di livello inferiore nella propria interfaccia pubblica `api.ts` / `contract-api.ts` perché codificano la gestione beta di Claude OAuth e il gating `context1m`. Allo stesso modo il Plugin xAI mantiene la modellazione nativa xAI Responses nel proprio `wrapStreamFn` (alias `/fast`, `tool_stream` predefinito, pulizia strict-tool non supportata, rimozione del payload di reasoning specifica di xAI).

      Lo stesso pattern alla radice del package supporta anche `@openclaw/openai-provider` (builder provider, helper per il modello predefinito, builder provider realtime) e `@openclaw/openrouter-provider` (builder provider più helper per onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Scambio di token">
        Per provider che richiedono uno scambio di token prima di ogni chiamata di inferenza:

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
        Per provider che richiedono header di richiesta personalizzati o modifiche al body:

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
      <Tab title="Identità del trasporto nativo">
        Per provider che richiedono header di richiesta/sessione nativi o metadati su
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
        Per provider che espongono dati di utilizzo/fatturazione:

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
      | 1 | `catalog` | Catalogo dei modelli o valori predefiniti di base URL |
      | 2 | `applyConfigDefaults` | Valori predefiniti globali di proprietà del provider durante la materializzazione della config |
      | 3 | `normalizeModelId` | Pulizia degli alias di model-id legacy/preview prima della ricerca |
      | 4 | `normalizeTransport` | Pulizia di `api` / `baseUrl` per la famiglia del provider prima dell'assemblaggio generico del modello |
      | 5 | `normalizeConfig` | Normalizza la config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità native streaming-usage per i provider di config |
      | 7 | `resolveConfigApiKey` | Risoluzione dell'autenticazione con marker env di proprietà del provider |
      | 8 | `resolveSyntheticAuth` | Autenticazione sintetica locale/self-hosted o basata su config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Fa passare i placeholder sintetici del profilo memorizzato dietro l'autenticazione env/config |
      | 10 | `resolveDynamicModel` | Accetta id modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |
      | 13 | `contributeResolvedModelCompat` | Flag di compatibilità per modelli vendor dietro un altro trasporto compatibile |
      | 14 | `capabilities` | Bag statico di capacità legacy; solo compatibilità |
      | 15 | `normalizeToolSchemas` | Pulizia degli schema degli strumenti di proprietà del provider prima della registrazione |
      | 16 | `inspectToolSchemas` | Diagnostica degli schema degli strumenti di proprietà del provider |
      | 17 | `resolveReasoningOutputMode` | Contratto di output reasoning con tag vs nativo |
      | 18 | `prepareExtraParams` | Parametri di richiesta predefiniti |
      | 19 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 20 | `wrapStreamFn` | Wrapper personalizzati di header/body nel normale percorso stream |
      | 21 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 22 | `resolveWebSocketSessionPolicy` | Header di sessione/cool-down WS nativi |
      | 23 | `formatApiKey` | Forma personalizzata del token di runtime |
      | 24 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 25 | `buildAuthDoctorHint` | Guida alla riparazione dell'autenticazione |
      | 26 | `matchesContextOverflowError` | Rilevamento overflow di proprietà del provider |
      | 27 | `classifyFailoverReason` | Classificazione rate-limit/sovraccarico di proprietà del provider |
      | 28 | `isCacheTtlEligible` | Gating TTL della cache dei prompt |
      | 29 | `buildMissingAuthMessage` | Suggerimento personalizzato per autenticazione mancante |
      | 30 | `suppressBuiltInModel` | Nasconde righe upstream obsolete |
      | 31 | `augmentModelCatalog` | Righe sintetiche di forward-compat |
      | 32 | `resolveThinkingProfile` | Set di opzioni `/think` specifico per modello |
      | 33 | `isBinaryThinking` | Compatibilità thinking binario on/off |
      | 34 | `supportsXHighThinking` | Compatibilità con supporto reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilità con policy `/think` predefinita |
      | 36 | `isModernModelRef` | Corrispondenza del modello live/smoke |
      | 37 | `prepareRuntimeAuth` | Scambio di token prima dell'inferenza |
      | 38 | `resolveUsageAuth` | Parsing personalizzato delle credenziali di utilizzo |
      | 39 | `fetchUsageSnapshot` | Endpoint di utilizzo personalizzato |
      | 40 | `createEmbeddingProvider` | Adattatore embedding di proprietà del provider per memoria/ricerca |
      | 41 | `buildReplayPolicy` | Policy personalizzata di replay/Compaction della trascrizione |
      | 42 | `sanitizeReplayHistory` | Riscritture di replay specifiche del provider dopo la pulizia generica |
      | 43 | `validateReplayTurns` | Validazione rigorosa dei turni di replay prima del runner incorporato |
      | 44 | `onModelSelected` | Callback post-selezione (ad esempio telemetria) |

      Note sul fallback di runtime:

      - `normalizeConfig` controlla prima il provider corrispondente, poi altri Plugin provider capaci di hook finché uno non modifica davvero la config. Se nessun hook provider riscrive una voce di config supportata della famiglia Google, continua comunque ad applicarsi il normalizzatore di config Google incluso.
      - `resolveConfigApiKey` usa l'hook provider quando esposto. Anche il percorso `amazon-bedrock` incluso ha qui un resolver integrato per marker env AWS, anche se l'autenticazione runtime di Bedrock continua a usare la catena predefinita dell'SDK AWS.
      - `resolveSystemPromptContribution` consente a un provider di iniettare indicazioni del prompt di sistema consapevoli della cache per una famiglia di modelli. Preferiscilo a `before_prompt_build` quando il comportamento appartiene a una sola famiglia provider/modello e deve preservare la suddivisione stabile/dinamica della cache.

      Per descrizioni dettagliate ed esempi reali, vedi [Internals: Provider Runtime Hooks](/it/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi capacità extra (facoltativo)">
    Un Plugin provider può registrare voce, trascrizione realtime, voce realtime,
    comprensione dei media, generazione di immagini, generazione di video, recupero web
    e ricerca web insieme all'inferenza testuale. OpenClaw lo classifica come
    Plugin **hybrid-capability** — il pattern consigliato per i Plugin aziendali
    (un Plugin per vendor). Vedi
    [Internals: Capability Ownership](/it/plugins/architecture#capability-ownership-model).

    Registra ogni capacità all'interno di `register(api)` insieme alla tua chiamata
    `api.registerProvider(...)` esistente. Scegli solo le schede di cui hai bisogno:

    <Tabs>
      <Tab title="Voce (TTS)">
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
              await assertOkOrThrowProviderError(response, "Errore API Acme Speech");
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

        Usa `assertOkOrThrowProviderError(...)` per gli errori HTTP del provider, così
        i Plugin condividono letture del body degli errori con limite massimo, parsing degli errori JSON e
        suffissi request-id.
      </Tab>
      <Tab title="Trascrizione realtime">
        Preferisci `createRealtimeTranscriptionWebSocketSession(...)` — l'helper
        condiviso gestisce acquisizione proxy, backoff di riconnessione, flush alla chiusura,
        handshake di disponibilità, accodamento audio e diagnostica degli eventi di chiusura. Il tuo Plugin
        si limita a mappare gli eventi upstream.

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

        I provider STT batch che inviano audio multipart tramite POST dovrebbero usare
        `buildAudioTranscriptionFormData(...)` da
        `openclaw/plugin-sdk/provider-http`. L'helper normalizza i
        nomi file di upload, inclusi gli upload AAC che richiedono un nome file in stile M4A per
        API di trascrizione compatibili.
      </Tab>
      <Tab title="Voce realtime">
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
      <Tab title="Comprensione dei media">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Una foto di..." }),
          transcribeAudio: async (req) => ({ text: "Trascrizione..." }),
        });
        ```
      </Tab>
      <Tab title="Generazione di immagini e video">
        Le capacità video usano una forma **mode-aware**: `generate`,
        `imageToVideo` e `videoToVideo`. Campi aggregati piatti come
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` non
        sono sufficienti per dichiarare in modo pulito il supporto alla modalità di trasformazione o le modalità disabilitate.
        La generazione musicale segue lo stesso pattern con blocchi espliciti `generate` /
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
      <Tab title="Recupero e ricerca web">
        ```typescript
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Esporta il tuo oggetto di configurazione provider da index.ts o da un file dedicato
    import { acmeProvider } from "./provider.js";

    describe("provider acme-ai", () => {
      it("risolve i modelli dinamici", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("restituisce il catalogo quando è disponibile una chiave", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("restituisce un catalogo null quando non c'è una chiave", async () => {
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

I Plugin provider vengono pubblicati allo stesso modo di qualsiasi altro Plugin di codice esterno:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Non usare qui l'alias legacy di pubblicazione solo-Skills; i pacchetti Plugin devono usare
`clawhub package publish`.

## Struttura dei file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Manifest con metadata di autenticazione provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Test
    └── usage.ts              # Endpoint di utilizzo (facoltativo)
```

## Riferimento per l'ordine del catalogo

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai
provider integrati:

| Order     | Quando        | Caso d'uso                                     |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Primo passaggio | Provider semplici con chiave API              |
| `profile` | Dopo simple   | Provider vincolati a profili di autenticazione |
| `paired`  | Dopo profile  | Sintetizza più voci correlate                  |
| `late`    | Ultimo passaggio | Sovrascrive provider esistenti (vince in caso di collisione) |

## Prossimi passi

- [Plugin di canale](/it/plugins/sdk-channel-plugins) — se il tuo Plugin fornisce anche un canale
- [Runtime SDK](/it/plugins/sdk-runtime) — helper `api.runtime` (TTS, ricerca, subagent)
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo agli import dei sottopercorsi
- [Internals dei Plugin](/it/plugins/architecture-internals#provider-runtime-hooks) — dettagli degli hook ed esempi inclusi

## Correlati

- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Creazione di Plugin di canale](/it/plugins/sdk-channel-plugins)
