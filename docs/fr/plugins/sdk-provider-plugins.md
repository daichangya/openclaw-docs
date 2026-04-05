---
read_when:
    - Vous créez un nouveau plugin de fournisseur de modèles
    - Vous voulez ajouter un proxy compatible OpenAI ou un LLM personnalisé à OpenClaw
    - Vous devez comprendre l’authentification du fournisseur, les catalogues et les hooks runtime
sidebarTitle: Provider Plugins
summary: Guide pas à pas pour créer un plugin de fournisseur de modèles pour OpenClaw
title: Créer des plugins de fournisseur
x-i18n:
    generated_at: "2026-04-05T12:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e781e5fc436b2189b9f8cc63e7611f49df1fd2526604a0596a0631f49729b085
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Créer des plugins de fournisseur

Ce guide explique pas à pas comment créer un plugin de fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous aurez un fournisseur avec un catalogue de modèles,
une auth par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore jamais créé de plugin OpenClaw, lisez d’abord
  [Premiers pas](/plugins/building-plugins) pour la structure de base du package
  et la configuration du manifeste.
</Info>

## Guide pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package et manifeste">
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

    Le manifeste déclare `providerAuthEnvVars` afin qu’OpenClaw puisse détecter
    les identifiants sans charger le runtime de votre plugin. `modelSupport` est facultatif
    et permet à OpenClaw de charger automatiquement votre plugin de fournisseur à partir d’identifiants de modèle abrégés
    comme `acme-large` avant que les hooks runtime n’existent. Si vous publiez le
    fournisseur sur ClawHub, ces champs `openclaw.compat` et `openclaw.build`
    sont obligatoires dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur minimal a besoin d’un `id`, `label`, `auth`, et `catalog` :

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

    C’est un fournisseur fonctionnel. Les utilisateurs peuvent maintenant
    exécuter `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

    Pour les fournisseurs intégrés qui n’enregistrent qu’un seul fournisseur texte avec une auth par clé API
    plus un seul runtime adossé à un catalogue, préférez le helper plus étroit
    `defineSingleProviderPluginEntry(...)` :

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

    Si votre flux d’auth doit aussi patcher `models.providers.*`, les alias, et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les helpers prédéfinis de
    `openclaw/plugin-sdk/provider-onboard`. Les helpers les plus étroits sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, et
    `createModelCatalogPresetAppliers(...)`.

    Lorsqu’un point de terminaison natif du fournisseur prend en charge les blocs d’usage streamés sur le
    transport normal `openai-completions`, préférez les helpers de catalogue partagés de
    `openclaw/plugin-sdk/provider-catalog-shared` plutôt que de coder en dur des vérifications d’ID fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la carte des capacités du point de terminaison, de sorte que les points de terminaison natifs de type Moonshot/DashScope puissent encore activer cette compatibilité même lorsqu’un plugin utilise un ID fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique des modèles">
    Si votre fournisseur accepte des ID de modèle arbitraires (comme un proxy ou un routeur),
    ajoutez `resolveDynamicModel` :

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog ci-dessus

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

    Si la résolution nécessite un appel réseau, utilisez `prepareDynamicModel` pour un
    préchauffage asynchrone — `resolveDynamicModel` s’exécute à nouveau après sa fin.

  </Step>

  <Step title="Ajouter des hooks runtime (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez les hooks
    progressivement à mesure que votre fournisseur en a besoin.

    Des builders de helpers partagés couvrent maintenant les familles les plus courantes de relecture/compatibilité d’outils,
    de sorte que les plugins n’ont généralement plus besoin de câbler chaque hook un par un :

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

    Familles de relecture disponibles aujourd’hui :

    | Famille | Ce qu’elle câble |
    | --- | --- |
    | `openai-compatible` | Politique partagée de relecture de style OpenAI pour les transports compatibles OpenAI, y compris la sanitation des tool-call-id, les correctifs d’ordre assistant-first, et la validation générique des tours Gemini lorsque le transport en a besoin |
    | `anthropic-by-model` | Politique de relecture adaptée à Claude choisie par `modelId`, de sorte que les transports de messages Anthropic ne reçoivent le nettoyage des thinking-blocks spécifique à Claude que lorsque le modèle résolu est réellement un identifiant Claude |
    | `google-gemini` | Politique native de relecture Gemini plus sanitation de bootstrap replay et mode de sortie de raisonnement tagué |
    | `passthrough-gemini` | Sanitation des thought-signatures Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation native de relecture Gemini ni les réécritures de bootstrap |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles Anthropics-message et compatibles OpenAI dans un seul plugin ; l’abandon facultatif des thinking-blocks uniquement pour Claude reste limité au côté Anthropic |

    Exemples intégrés réels :

    - `google` et `google-gemini-cli` : `google-gemini`
    - `openrouter`, `kilocode`, `opencode`, et `opencode-go` : `passthrough-gemini`
    - `amazon-bedrock` et `anthropic-vertex` : `anthropic-by-model`
    - `minimax` : `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai`, et `zai` : `openai-compatible`

    Familles de stream disponibles aujourd’hui :

    | Famille | Ce qu’elle câble |
    | --- | --- |
    | `google-thinking` | Normalisation des charges utiles de thinking Gemini sur le chemin de stream partagé |
    | `kilocode-thinking` | Enveloppe de raisonnement Kilo sur le chemin de stream proxy partagé, avec `kilo/auto` et les identifiants de raisonnement proxy non pris en charge qui ignorent l’injection de thinking |
    | `moonshot-thinking` | Mappage de charge utile native-thinking binaire Moonshot depuis la config + niveau `/think` |
    | `minimax-fast-mode` | Réécriture de modèle fast-mode MiniMax sur le chemin de stream partagé |
    | `openai-responses-defaults` | Enveloppes Responses natives partagées OpenAI/Codex : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité texte, recherche web native Codex, façonnage de charge utile de compatibilité de raisonnement, et gestion du contexte Responses |
    | `openrouter-thinking` | Enveloppe de raisonnement OpenRouter pour les routes proxy, avec gestion centralisée des modèles non pris en charge/du mode `auto` |
    | `tool-stream-default-on` | Enveloppe `tool_stream` activée par défaut pour les fournisseurs comme Z.AI qui veulent le streaming des outils sauf désactivation explicite |

    Exemples intégrés réels :

    - `google` et `google-gemini-cli` : `google-thinking`
    - `kilocode` : `kilocode-thinking`
    - `moonshot` : `moonshot-thinking`
    - `minimax` et `minimax-portal` : `minimax-fast-mode`
    - `openai` et `openai-codex` : `openai-responses-defaults`
    - `openrouter` : `openrouter-thinking`
    - `zai` : `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exporte aussi l’enum des familles de relecture
    ainsi que les helpers partagés à partir desquels ces familles sont construites. Les
    exports publics courants incluent :

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - des builders de relecture partagés tels que `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)`, et
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - des helpers de relecture Gemini comme `sanitizeGoogleGeminiReplayHistory(...)`
      et `resolveTaggedReasoningOutputMode()`
    - des helpers endpoint/modèle comme `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)`, et
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expose à la fois le builder de famille et
    les helpers publics d’enveloppe réutilisés par ces familles. Les exports publics
    courants incluent :

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - des enveloppes partagées OpenAI/Codex comme
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)`, et
      `createCodexNativeWebSearchWrapper(...)`
    - des enveloppes partagées proxy/fournisseur comme `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)`, et `createMinimaxFastModeWrapper(...)`

    Certains helpers de stream restent volontairement locaux au fournisseur. Exemple intégré
    actuel : `@openclaw/anthropic-provider` exporte
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, et les
    builders Anthropic de plus bas niveau depuis sa couture publique `api.ts` /
    `contract-api.ts`. Ces helpers restent spécifiques à Anthropic parce
    qu’ils encodent aussi la gestion du bêta OAuth Claude et le contrôle `context1m`.

    D’autres fournisseurs intégrés gardent également des enveloppes spécifiques au transport en local lorsque
    le comportement ne se partage pas proprement entre familles. Exemple actuel : le
    plugin xAI intégré garde la mise en forme native xAI Responses dans son propre
    `wrapStreamFn`, y compris les réécritures d’alias `/fast`, le `tool_stream`
    activé par défaut, le nettoyage des strict-tool non pris en charge, et la suppression
    des charges utiles de raisonnement spécifiques à xAI.

    `openclaw/plugin-sdk/provider-tools` expose actuellement une seule famille partagée
    de schéma d’outils plus des helpers de schéma/compatibilité partagés :

    - `ProviderToolCompatFamily` documente l’inventaire partagé des familles aujourd’hui.
    - `buildProviderToolCompatFamilyHooks("gemini")` câble le nettoyage
      + les diagnostics des schémas Gemini pour les fournisseurs qui ont besoin de schémas d’outils compatibles Gemini.
    - `normalizeGeminiToolSchemas(...)` et `inspectGeminiToolSchemas(...)`
      sont les helpers publics sous-jacents pour les schémas Gemini.
    - `resolveXaiModelCompatPatch()` renvoie le patch de compatibilité xAI intégré :
      `toolSchemaProfile: "xai"`, mots-clés de schéma non pris en charge, prise en charge native de
      `web_search`, et décodage des arguments d’appel d’outil avec entités HTML.
    - `applyXaiModelCompat(model)` applique ce même patch de compatibilité xAI à un
      modèle résolu avant qu’il n’atteigne l’exécuteur.

    Exemple intégré réel : le plugin xAI utilise `normalizeResolvedModel` plus
    `contributeResolvedModelCompat` pour garder ces métadonnées de compatibilité
    détenues par le fournisseur au lieu de coder en dur des règles xAI dans le cœur.

    Ce même motif à la racine du package alimente aussi d’autres fournisseurs intégrés :

    - `@openclaw/openai-provider` : `api.ts` exporte les builders de fournisseur,
      les helpers de modèle par défaut, et les builders de fournisseur realtime
    - `@openclaw/openrouter-provider` : `api.ts` exporte le builder de fournisseur
      ainsi que les helpers d’onboarding/configuration

    <Tabs>
      <Tab title="Échange de jeton">
        Pour les fournisseurs qui ont besoin d’un échange de jeton avant chaque appel d’inférence :

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
      <Tab title="En-têtes personnalisés">
        Pour les fournisseurs qui ont besoin d’en-têtes de requête personnalisés ou de modifications du corps :

        ```typescript
        // wrapStreamFn renvoie un StreamFn dérivé de ctx.streamFn
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
      <Tab title="Identité de transport native">
        Pour les fournisseurs qui ont besoin d’en-têtes ou de métadonnées de requête/session natifs sur
        des transports HTTP ou WebSocket génériques :

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
      <Tab title="Usage et facturation">
        Pour les fournisseurs qui exposent des données d’usage/facturation :

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

    <Accordion title="Tous les hooks de fournisseur disponibles">
      OpenClaw appelle les hooks dans cet ordre. La plupart des fournisseurs n’en utilisent que 2 ou 3 :

      | # | Hook | Quand l’utiliser |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut de `baseUrl` |
      | 2 | `applyConfigDefaults` | Valeurs par défaut globales détenues par le fournisseur lors de la matérialisation de la config |
      | 3 | `normalizeModelId` | Nettoyage des alias d’identifiants de modèle hérités/preview avant la recherche |
      | 4 | `normalizeTransport` | Nettoyage `api` / `baseUrl` de la famille de fournisseur avant l’assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité d’usage streamé natif pour les fournisseurs de config |
      | 7 | `resolveConfigApiKey` | Résolution d’auth à marqueur env détenue par le fournisseur |
      | 8 | `resolveSyntheticAuth` | Auth synthétique locale/self-hosted ou adossée à la config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Reléguer les espaces réservés de profils stockés synthétiques derrière l’auth env/config |
      | 10 | `resolveDynamicModel` | Accepter des ID de modèle amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone de métadonnées avant résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant l’exécuteur |

      Remarques sur le repli runtime :

      - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres
        plugins de fournisseur capables de hook jusqu’à ce que l’un modifie effectivement la config.
        Si aucun hook de fournisseur ne réécrit une entrée de config de famille Google prise en charge, le
        normaliseur de config Google intégré s’applique tout de même.
      - `resolveConfigApiKey` utilise le hook du fournisseur lorsqu’il est exposé. Le chemin intégré
        `amazon-bedrock` possède aussi un résolveur intégré de marqueur env AWS ici,
        même si l’auth runtime Bedrock elle-même utilise toujours la chaîne par défaut du SDK AWS.
      | 13 | `contributeResolvedModelCompat` | Drapeaux de compatibilité pour les modèles d’un fournisseur derrière un autre transport compatible |
      | 14 | `capabilities` | Sac statique de capacités hérité ; compatibilité uniquement |
      | 15 | `normalizeToolSchemas` | Nettoyage des schémas d’outils détenu par le fournisseur avant enregistrement |
      | 16 | `inspectToolSchemas` | Diagnostics de schémas d’outils détenus par le fournisseur |
      | 17 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement tagué vs natif |
      | 18 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 19 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 20 | `wrapStreamFn` | Enveloppes d’en-têtes/corps personnalisées sur le chemin de stream normal |
      | 21 | `resolveTransportTurnState` | En-têtes/métadonnées natifs par tour |
      | 22 | `resolveWebSocketSessionPolicy` | En-têtes/cooldown de session WS natifs |
      | 23 | `formatApiKey` | Format personnalisé du jeton runtime |
      | 24 | `refreshOAuth` | Rafraîchissement OAuth personnalisé |
      | 25 | `buildAuthDoctorHint` | Conseils de réparation d’auth |
      | 26 | `matchesContextOverflowError` | Détection de dépassement détenue par le fournisseur |
      | 27 | `classifyFailoverReason` | Classification de limite de débit/surcharge détenue par le fournisseur |
      | 28 | `isCacheTtlEligible` | Contrôle TTL du cache de prompt |
      | 29 | `buildMissingAuthMessage` | Indice personnalisé d’auth manquante |
      | 30 | `suppressBuiltInModel` | Masquer des lignes amont obsolètes |
      | 31 | `augmentModelCatalog` | Lignes synthétiques de compatibilité ascendante |
      | 32 | `isBinaryThinking` | Thinking binaire activé/désactivé |
      | 33 | `supportsXHighThinking` | Prise en charge du raisonnement `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Politique `/think` par défaut |
      | 35 | `isModernModelRef` | Correspondance live/smoke des modèles |
      | 36 | `prepareRuntimeAuth` | Échange de jeton avant l’inférence |
      | 37 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’usage |
      | 38 | `fetchUsageSnapshot` | Point de terminaison d’usage personnalisé |
      | 39 | `createEmbeddingProvider` | Adaptateur d’embedding détenu par le fournisseur pour mémoire/recherche |
      | 40 | `buildReplayPolicy` | Politique personnalisée de relecture/compaction de transcription |
      | 41 | `sanitizeReplayHistory` | Réécritures spécifiques au fournisseur après nettoyage générique |
      | 42 | `validateReplayTurns` | Validation stricte des tours de relecture avant l’exécuteur embarqué |
      | 43 | `onModelSelected` | Callback post-sélection (par ex. télémétrie) |

      Pour des descriptions détaillées et des exemples concrets, voir
      [Internals: Hooks runtime de fournisseur](/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    <a id="step-5-add-extra-capabilities"></a>
    Un plugin de fournisseur peut enregistrer la synthèse vocale, la transcription temps réel, la voix temps réel,
    la compréhension média, la génération d’image, la génération de vidéo, la récupération web,
    et la recherche web en plus de l’inférence texte :

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
          maxVideos: 1,
          maxDurationSeconds: 10,
          supportsResolution: true,
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

    OpenClaw classe cela comme un plugin **hybrid-capability**. C’est le
    modèle recommandé pour les plugins d’entreprise (un plugin par fournisseur). Voir
    [Internals: Propriété des capacités](/plugins/architecture#capability-ownership-model).

  </Step>

  <Step title="Tester">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportez votre objet de configuration de fournisseur depuis index.ts ou un fichier dédié
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

## Publier sur ClawHub

Les plugins de fournisseur se publient comme n’importe quel autre plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’alias hérité réservé à la publication de Skills ; les packages de plugin doivent utiliser
`clawhub package publish`.

## Structure de fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # métadonnées openclaw.providers
├── openclaw.plugin.json      # Manifeste avec providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Point de terminaison d’usage (facultatif)
```

## Référence de l’ordre de catalogue

`catalog.order` contrôle quand votre catalogue est fusionné par rapport aux
fournisseurs intégrés :

| Ordre     | Quand         | Cas d’usage                                    |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs simples à clé API               |
| `profile` | Après simple  | Fournisseurs filtrés par profils d’auth       |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées           |
| `late`    | Dernier passage | Remplacer des fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/plugins/sdk-channel-plugins) — si votre plugin fournit aussi un canal
- [SDK Runtime](/plugins/sdk-runtime) — helpers `api.runtime` (TTS, recherche, sous-agent)
- [Vue d’ensemble du SDK](/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Internals des plugins](/plugins/architecture#provider-runtime-hooks) — détails des hooks et exemples intégrés
