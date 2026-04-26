---
read_when:
    - Stai creando un nuovo Plugin provider di modelli
    - Vuoi aggiungere un proxy compatibile con OpenAI o un LLM personalizzato a OpenClaw
    - Devi comprendere autenticazione provider, cataloghi e hook runtime
sidebarTitle: Provider plugins
summary: Guida passo passo per creare un Plugin provider di modelli per OpenClaw
title: Creazione di Plugin provider
x-i18n:
    generated_at: "2026-04-26T11:35:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Questa guida illustra passo dopo passo come creare un Plugin provider che aggiunge un provider di modelli
(LLM) a OpenClaw. Alla fine avrai un provider con catalogo modelli,
autenticazione tramite chiave API e risoluzione dinamica dei modelli.

<Info>
  Se non hai mai creato prima un Plugin OpenClaw, leggi prima
  [Per iniziare](/it/plugins/building-plugins) per la struttura base del package
  e la configurazione del manifest.
</Info>

<Tip>
  I Plugin provider aggiungono modelli al normale ciclo di inferenza di OpenClaw. Se il modello
  deve essere eseguito tramite un daemon agente nativo che possiede thread, Compaction
  o eventi degli strumenti, abbina il provider a un [agent harness](/it/plugins/sdk-agent-harness)
  invece di inserire i dettagli del protocollo del daemon nel core.
</Tip>

## Procedura guidata

<Steps>
  <Step title="Package e manifest">
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
    quando una variante di provider deve riutilizzare l'autenticazione di un altro id provider. `modelSupport`
    è facoltativo e permette a OpenClaw di caricare automaticamente il tuo Plugin provider da id
    modello shorthand come `acme-large` prima che esistano gli hook runtime. Se pubblichi il
    provider su ClawHub, quei campi `openclaw.compat` e `openclaw.build`
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
              hint: "Chiave API dalla dashboard Acme AI",
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

    Questo è un provider funzionante. Gli utenti possono ora eseguire
    `openclaw onboard --acme-ai-api-key <key>` e selezionare
    `acme-ai/acme-large` come proprio modello.

    Se il provider upstream usa token di controllo diversi da quelli di OpenClaw, aggiungi una
    piccola trasformazione bidirezionale del testo invece di sostituire il percorso di stream:

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

    `input` riscrive il prompt di sistema finale e il contenuto dei messaggi testuali prima
    del trasporto. `output` riscrive i delta di testo dell'assistente e il testo finale prima che
    OpenClaw analizzi i propri marker di controllo o la consegna sul canale.

    Per provider inclusi che registrano solo un provider testuale con autenticazione
    tramite chiave API più un singolo runtime supportato da catalogo, preferisci l'helper più ristretto
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
            hint: "Chiave API dalla dashboard Acme AI",
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

    `buildProvider` è il percorso del catalogo live usato quando OpenClaw può risolvere una vera
    autenticazione del provider. Può eseguire discovery specifica del provider. Usa
    `buildStaticProvider` solo per righe offline sicure da mostrare prima che l'autenticazione
    sia configurata; non deve richiedere credenziali né fare richieste di rete.
    Il display di OpenClaw `models list --all` attualmente esegue cataloghi statici
    solo per i Plugin provider inclusi, con configurazione vuota, env vuoto e senza
    percorsi agente/workspace.

    Se il tuo flusso di autenticazione deve anche modificare `models.providers.*`, alias
    e il modello predefinito dell'agente durante l'onboarding, usa gli helper preset di
    `openclaw/plugin-sdk/provider-onboard`. Gli helper più stretti sono
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` e
    `createModelCatalogPresetAppliers(...)`.

    Quando l'endpoint nativo di un provider supporta blocchi di uso in streaming sul
    normale trasporto `openai-completions`, preferisci gli helper di catalogo condivisi in
    `openclaw/plugin-sdk/provider-catalog-shared` invece di hardcodare controlli sull'id del
    provider. `supportsNativeStreamingUsageCompat(...)` e
    `applyProviderNativeStreamingUsageCompat(...)` rilevano il supporto dalla mappa delle capacità
    dell'endpoint, così endpoint nativi in stile Moonshot/DashScope continuano a partecipare anche
    quando un Plugin usa un id provider personalizzato.

  </Step>

  <Step title="Aggiungi la risoluzione dinamica dei modelli">
    Se il tuo provider accetta id modello arbitrari (come un proxy o un router),
    aggiungi `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog dall'esempio sopra

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

    Se la risoluzione richiede una chiamata di rete, usa `prepareDynamicModel` per un
    warm-up asincrono — `resolveDynamicModel` viene eseguito di nuovo dopo il completamento.

  </Step>

  <Step title="Aggiungi hook runtime (se necessario)">
    La maggior parte dei provider ha bisogno solo di `catalog` + `resolveDynamicModel`. Aggiungi hook
    in modo incrementale man mano che il tuo provider lo richiede.

    Gli helper builder condivisi ora coprono le famiglie replay/tool-compat più comuni,
    quindi di solito i Plugin non hanno bisogno di collegare manualmente ogni hook uno per uno:

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

    Famiglie replay disponibili oggi:

    | Famiglia | Cosa collega | Esempi inclusi |
    | --- | --- | --- |
    | `openai-compatible` | Policy replay condivisa in stile OpenAI per trasporti compatibili con OpenAI, inclusa sanitizzazione degli id delle chiamate tool, correzioni di ordinamento assistant-first e validazione generica dei turni Gemini dove il trasporto la richiede | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Policy replay consapevole di Claude scelta da `modelId`, così i trasporti Anthropic-message ottengono la pulizia dei blocchi thinking specifici di Claude solo quando il modello risolto è davvero un id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Policy replay Gemini nativa più sanitizzazione del replay bootstrap e modalità tagged reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanitizzazione della thought-signature Gemini per modelli Gemini eseguiti tramite trasporti proxy compatibili con OpenAI; non abilita la validazione replay Gemini nativa né riscritture bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Policy ibrida per provider che mescolano superfici di modelli Anthropic-message e OpenAI-compatible in un unico Plugin; l'eventuale rimozione dei blocchi thinking solo-Claude resta limitata al lato Anthropic | `minimax` |

    Famiglie stream disponibili oggi:

    | Famiglia | Cosa collega | Esempi inclusi |
    | --- | --- | --- |
    | `google-thinking` | Normalizzazione del payload thinking di Gemini sul percorso di stream condiviso | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper del reasoning di Kilo sul percorso di stream proxy condiviso, con `kilo/auto` e id di reasoning proxy non supportati che saltano il thinking iniettato | `kilocode` |
    | `moonshot-thinking` | Mapping del payload native-thinking binario di Moonshot da configurazione + livello `/think` | `moonshot` |
    | `minimax-fast-mode` | Riscrittura del modello fast-mode MiniMax sul percorso di stream condiviso | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrapper condivisi nativi OpenAI/Codex Responses: header di attribuzione, `/fast`/`serviceTier`, verbosità del testo, ricerca Web Codex nativa, shaping del payload reasoning-compat e gestione del contesto Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper del reasoning OpenRouter per route proxy, con skip per modelli non supportati/`auto` gestiti centralmente | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` attivo per impostazione predefinita per provider come Z.AI che vogliono lo streaming degli strumenti salvo disabilitazione esplicita | `zai` |

    <Accordion title="Punti di giunzione SDK che alimentano i family builder">
      Ogni family builder è composto da helper pubblici di livello inferiore esportati dallo stesso package, a cui puoi ricorrere quando un provider deve uscire dallo schema comune:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` e i builder replay grezzi (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Esporta anche helper replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) e helper endpoint/modello (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, più i wrapper condivisi OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), il wrapper compatibile con OpenAI per DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) e wrapper condivisi proxy/provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, gli helper di schema Gemini sottostanti (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) e helper di compatibilità xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Il Plugin xAI incluso usa `normalizeResolvedModel` + `contributeResolvedModelCompat` con questi per mantenere le regole xAI di proprietà del provider.

      Alcuni helper di stream restano intenzionalmente locali al provider. `@openclaw/anthropic-provider` mantiene `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder wrapper Anthropic di livello inferiore nel proprio punto di giunzione pubblico `api.ts` / `contract-api.ts` perché codificano la gestione beta di Claude OAuth e il gating `context1m`. Allo stesso modo il Plugin xAI mantiene il shaping nativo xAI Responses nel proprio `wrapStreamFn` (alias `/fast`, `tool_stream` predefinito, pulizia strict-tool non supportata, rimozione del payload reasoning specifica di xAI).

      Lo stesso schema package-root supporta anche `@openclaw/openai-provider` (builder del provider, helper del modello predefinito, builder del provider realtime) e `@openclaw/openrouter-provider` (builder del provider più helper di onboarding/configurazione).
    </Accordion>

    <Tabs>
      <Tab title="Scambio token">
        Per provider che richiedono uno scambio token prima di ogni chiamata di inferenza:

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
        Per provider che richiedono header o metadati nativi di richiesta/sessione su
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
      <Tab title="Uso e fatturazione">
        Per provider che espongono dati di uso/fatturazione:

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
      OpenClaw chiama gli hook in quest'ordine. La maggior parte dei provider ne usa solo 2-3:

      | # | Hook | Quando usarlo |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogo modelli o valori predefiniti di base URL |
      | 2 | `applyConfigDefaults` | Valori predefiniti globali di proprietà del provider durante la materializzazione della configurazione |
      | 3 | `normalizeModelId` | Pulizia di alias legacy/preview dell'id modello prima del lookup |
      | 4 | `normalizeTransport` | Pulizia `api` / `baseUrl` della famiglia provider prima dell'assemblaggio generico del modello |
      | 5 | `normalizeConfig` | Normalizza la configurazione `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Riscritture di compatibilità per native streaming-usage per provider configurati |
      | 7 | `resolveConfigApiKey` | Risoluzione dell'autenticazione tramite env-marker di proprietà del provider |
      | 8 | `resolveSyntheticAuth` | Autenticazione sintetica locale/self-hosted o supportata da configurazione |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abbassa i placeholder del profilo archiviato sintetico dietro autenticazione env/config |
      | 10 | `resolveDynamicModel` | Accetta id modello upstream arbitrari |
      | 11 | `prepareDynamicModel` | Recupero asincrono dei metadati prima della risoluzione |
      | 12 | `normalizeResolvedModel` | Riscritture del trasporto prima del runner |
      | 13 | `contributeResolvedModelCompat` | Flag di compatibilità per modelli vendor dietro un altro trasporto compatibile |
      | 14 | `capabilities` | Bag legacy di capacità statiche; solo compatibilità |
      | 15 | `normalizeToolSchemas` | Pulizia degli schema degli strumenti di proprietà del provider prima della registrazione |
      | 16 | `inspectToolSchemas` | Diagnostica degli schema degli strumenti di proprietà del provider |
      | 17 | `resolveReasoningOutputMode` | Contratto tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Parametri di richiesta predefiniti |
      | 19 | `createStreamFn` | Trasporto StreamFn completamente personalizzato |
      | 20 | `wrapStreamFn` | Wrapper personalizzati di header/body sul normale percorso di stream |
      | 21 | `resolveTransportTurnState` | Header/metadati nativi per turno |
      | 22 | `resolveWebSocketSessionPolicy` | Header sessione WS nativi/cool-down |
      | 23 | `formatApiKey` | Forma personalizzata del token runtime |
      | 24 | `refreshOAuth` | Refresh OAuth personalizzato |
      | 25 | `buildAuthDoctorHint` | Indicazioni per la riparazione dell'autenticazione |
      | 26 | `matchesContextOverflowError` | Rilevamento dell'overflow di proprietà del provider |
      | 27 | `classifyFailoverReason` | Classificazione rate-limit/overload di proprietà del provider |
      | 28 | `isCacheTtlEligible` | Gating TTL della cache del prompt |
      | 29 | `buildMissingAuthMessage` | Suggerimento personalizzato per autenticazione mancante |
      | 30 | `suppressBuiltInModel` | Nasconde righe upstream obsolete |
      | 31 | `augmentModelCatalog` | Righe sintetiche di forward-compat |
      | 32 | `resolveThinkingProfile` | Insieme di opzioni `/think` specifico del modello |
      | 33 | `isBinaryThinking` | Compatibilità thinking binario on/off |
      | 34 | `supportsXHighThinking` | Compatibilità del supporto al reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilità della policy predefinita `/think` |
      | 36 | `isModernModelRef` | Corrispondenza del modello live/smoke |
      | 37 | `prepareRuntimeAuth` | Scambio token prima dell'inferenza |
      | 38 | `resolveUsageAuth` | Parsing personalizzato delle credenziali d'uso |
      | 39 | `fetchUsageSnapshot` | Endpoint d'uso personalizzato |
      | 40 | `createEmbeddingProvider` | Adattatore embedding di proprietà del provider per memory/search |
      | 41 | `buildReplayPolicy` | Policy personalizzata di replay/Compaction del transcript |
      | 42 | `sanitizeReplayHistory` | Riscritture replay specifiche del provider dopo la pulizia generica |
      | 43 | `validateReplayTurns` | Validazione rigorosa dei turni replay prima dell'embedded runner |
      | 44 | `onModelSelected` | Callback post-selezione (ad esempio telemetria) |

      Note sul fallback runtime:

      - `normalizeConfig` controlla prima il provider corrispondente, poi altri Plugin provider con hook-capable finché uno non modifica effettivamente la configurazione. Se nessun hook provider riscrive una voce di configurazione Google-family supportata, continua comunque ad applicarsi il normalizzatore di configurazione Google incluso.
      - `resolveConfigApiKey` usa l'hook provider quando esposto. Il percorso incluso `amazon-bedrock` ha anche un resolver integrato di env-marker AWS qui, anche se l'autenticazione runtime Bedrock stessa continua a usare la catena predefinita dell'SDK AWS.
      - `resolveSystemPromptContribution` consente a un provider di iniettare indicazioni del prompt di sistema consapevoli della cache per una famiglia di modelli. Preferiscilo a `before_prompt_build` quando il comportamento appartiene a una famiglia provider/modello e dovrebbe preservare la separazione cache stabile/dinamica.

      Per descrizioni dettagliate ed esempi reali, vedi [Interni: Hook runtime del provider](/it/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Aggiungi capacità extra (facoltativo)">
    Un Plugin provider può registrare voce, trascrizione realtime, voce
    realtime, comprensione dei media, generazione immagini, generazione video, recupero Web
    e ricerca Web insieme all'inferenza testuale. OpenClaw classifica questo come un
    Plugin **hybrid-capability** — il modello consigliato per i Plugin aziendali
    (un Plugin per vendor). Vedi
    [Interni: Proprietà delle capacità](/it/plugins/architecture#capability-ownership-model).

    Registra ogni capacità all'interno di `register(api)` accanto alla tua chiamata
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

        Usa `assertOkOrThrowProviderError(...)` per gli errori HTTP del provider così
        i Plugin condividono letture del body di errore con limite, parsing degli errori JSON e
        suffissi request-id.
      </Tab>
      <Tab title="Trascrizione realtime">
        Preferisci `createRealtimeTranscriptionWebSocketSession(...)` — l'helper condiviso
        gestisce cattura del proxy, backoff di riconnessione, flush alla chiusura, handshake di ready,
        accodamento audio e diagnostica degli eventi di chiusura. Il tuo Plugin
        mappa solo gli eventi upstream.

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

        I provider batch STT che fanno POST di audio multipart dovrebbero usare
        `buildAudioTranscriptionFormData(...)` da
        `openclaw/plugin-sdk/provider-http`. L'helper normalizza i nomi dei file
        in upload, inclusi gli upload AAC che richiedono un nome file in stile M4A per
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
      <Tab title="Generazione immagini e video">
        Le capacità video usano una forma **consapevole della modalità**: `generate`,
        `imageToVideo` e `videoToVideo`. Campi aggregati piatti come
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` non sono
        sufficienti per pubblicizzare pulitamente il supporto alle modalità di trasformazione o le modalità disabilitate.
        La generazione musicale segue lo stesso schema con blocchi espliciti `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* risultato immagine */ }),
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
      <Tab title="Recupero e ricerca Web">
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
      it("risolve modelli dinamici", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("restituisce il catalogo quando la chiave è disponibile", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("restituisce un catalogo nullo quando non c'è chiave", async () => {
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

Non usare qui l'alias di pubblicazione legacy solo Skills; i package Plugin dovrebbero usare
`clawhub package publish`.

## Struttura dei file

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadati openclaw.providers
├── openclaw.plugin.json      # Manifest con metadati di autenticazione provider
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Test
    └── usage.ts              # Endpoint d'uso (facoltativo)
```

## Riferimento all'ordine del catalogo

`catalog.order` controlla quando il tuo catalogo viene unito rispetto ai
provider incorporati:

| Ordine    | Quando        | Caso d'uso                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Primo passaggio | Provider semplici con chiave API              |
| `profile` | Dopo simple   | Provider regolati da profili di autenticazione |
| `paired`  | Dopo profile  | Sintetizza più voci correlate                  |
| `late`    | Ultimo passaggio | Sovrascrive provider esistenti (vince in caso di collisione) |

## Passaggi successivi

- [Plugin di canale](/it/plugins/sdk-channel-plugins) — se il tuo Plugin fornisce anche un canale
- [Runtime SDK](/it/plugins/sdk-runtime) — helper `api.runtime` (TTS, ricerca, subagent)
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo agli import dei sottopercorsi
- [Dettagli interni dei Plugin](/it/plugins/architecture-internals#provider-runtime-hooks) — dettagli degli hook ed esempi inclusi

## Correlati

- [Configurazione SDK Plugin](/it/plugins/sdk-setup)
- [Creare Plugin](/it/plugins/building-plugins)
- [Creazione di Plugin di canale](/it/plugins/sdk-channel-plugins)
