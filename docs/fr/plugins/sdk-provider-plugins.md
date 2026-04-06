---
read_when:
    - Vous créez un nouveau plugin de fournisseur de modèles
    - Vous voulez ajouter à OpenClaw un proxy compatible OpenAI ou un LLM personnalisé
    - Vous devez comprendre l’authentification des fournisseurs, les catalogues et les hooks d’exécution
sidebarTitle: Provider Plugins
summary: Guide étape par étape pour créer un plugin de fournisseur de modèles pour OpenClaw
title: Créer des plugins de fournisseur
x-i18n:
    generated_at: "2026-04-06T03:10:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69500f46aa2cfdfe16e85b0ed9ee3c0032074be46f2d9c9d2940d18ae1095f47
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Créer des plugins de fournisseur

Ce guide explique comment créer un plugin de fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous disposerez d’un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore créé aucun plugin OpenClaw, lisez d’abord
  [Bien démarrer](/fr/plugins/building-plugins) pour la structure de package
  de base et la configuration du manifeste.
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
    et permet à OpenClaw de charger automatiquement votre plugin de fournisseur à partir
    d’identifiants de modèle abrégés comme `acme-large` avant l’existence de hooks runtime.
    Si vous publiez le fournisseur sur ClawHub, ces champs `openclaw.compat` et `openclaw.build`
    sont obligatoires dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur minimal a besoin d’un `id`, d’un `label`, d’une `auth` et d’un `catalog` :

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

    Pour les fournisseurs intégrés qui n’enregistrent qu’un seul fournisseur texte avec authentification par clé API
    et un seul runtime adossé à un catalogue, préférez l’assistant plus ciblé
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

    Si votre flux d’authentification doit aussi modifier `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les assistants prédéfinis de
    `openclaw/plugin-sdk/provider-onboard`. Les assistants les plus ciblés sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsque le point de terminaison natif d’un fournisseur prend en charge les blocs d’usage en streaming sur le
    transport normal `openai-completions`, préférez les assistants de catalogue partagés dans
    `openclaw/plugin-sdk/provider-catalog-shared` plutôt que de coder en dur des vérifications sur l’id du fournisseur.
    `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la carte des capacités du point de terminaison, de sorte que les points de terminaison natifs de type Moonshot/DashScope
    s’activent toujours même lorsqu’un plugin utilise un id de fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique des modèles">
    Si votre fournisseur accepte des identifiants de modèle arbitraires (comme un proxy ou un routeur),
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

    Si la résolution nécessite un appel réseau, utilisez `prepareDynamicModel` pour le
    préchauffage asynchrone — `resolveDynamicModel` s’exécute de nouveau une fois cela terminé.

  </Step>

  <Step title="Ajouter des hooks runtime (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez les hooks
    progressivement selon les besoins de votre fournisseur.

    Les builders d’assistance partagés couvrent maintenant les familles les plus courantes de rejeu/compatibilité d’outils,
    de sorte que les plugins n’ont généralement pas besoin de câbler chaque hook à la main :

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

    Familles de rejeu disponibles aujourd’hui :

    | Family | Ce qu’elle connecte |
    | --- | --- |
    | `openai-compatible` | Politique de rejeu partagée de style OpenAI pour les transports compatibles OpenAI, y compris l’assainissement des tool-call-id, les corrections d’ordre assistant-first et la validation générique de tours Gemini lorsque le transport en a besoin |
    | `anthropic-by-model` | Politique de rejeu tenant compte de Claude choisie par `modelId`, afin que les transports de messages Anthropic ne reçoivent le nettoyage des blocs de réflexion spécifiques à Claude que lorsque le modèle résolu est réellement un id Claude |
    | `google-gemini` | Politique de rejeu Gemini native plus assainissement du rejeu de bootstrap et mode de sortie de raisonnement balisé |
    | `passthrough-gemini` | Assainissement de signature de réflexion Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active ni la validation native de rejeu Gemini ni les réécritures de bootstrap |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles de type messages Anthropic et compatibles OpenAI dans un même plugin ; la suppression facultative des blocs de réflexion réservés à Claude reste limitée à la partie Anthropic |

    Exemples intégrés réels :

    - `google` : `google-gemini`
    - `openrouter`, `kilocode`, `opencode` et `opencode-go` : `passthrough-gemini`
    - `amazon-bedrock` et `anthropic-vertex` : `anthropic-by-model`
    - `minimax` : `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` et `zai` : `openai-compatible`

    Familles de flux disponibles aujourd’hui :

    | Family | Ce qu’elle connecte |
    | --- | --- |
    | `google-thinking` | Normalisation des payloads de réflexion Gemini sur le chemin de flux partagé |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de flux proxy partagé, avec `kilo/auto` et les ids de raisonnement proxy non pris en charge qui ignorent la réflexion injectée |
    | `moonshot-thinking` | Mappage des payloads natifs de réflexion binaire Moonshot à partir de la configuration + niveau `/think` |
    | `minimax-fast-mode` | Réécriture de modèle en mode rapide MiniMax sur le chemin de flux partagé |
    | `openai-responses-defaults` | Wrappers natifs partagés OpenAI/Codex Responses : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web native Codex, mise en forme de payload compatible raisonnement et gestion du contexte Responses |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec la gestion centralisée des modèles non pris en charge/`auto` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour les fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite |

    Exemples intégrés réels :

    - `google` : `google-thinking`
    - `kilocode` : `kilocode-thinking`
    - `moonshot` : `moonshot-thinking`
    - `minimax` et `minimax-portal` : `minimax-fast-mode`
    - `openai` et `openai-codex` : `openai-responses-defaults`
    - `openrouter` : `openrouter-thinking`
    - `zai` : `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exporte également l’énumération
    des familles de rejeu ainsi que les assistants partagés sur lesquels ces familles sont construites. Les exports publics courants
    comprennent :

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - les builders de rejeu partagés tels que `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` et
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - les assistants de rejeu Gemini tels que `sanitizeGoogleGeminiReplayHistory(...)`
      et `resolveTaggedReasoningOutputMode()`
    - les assistants de point de terminaison/modèle tels que `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` et
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expose à la fois le builder de familles et
    les assistants de wrapper publics réutilisés par ces familles. Les exports publics courants
    comprennent :

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - des wrappers partagés OpenAI/Codex tels que
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` et
      `createCodexNativeWebSearchWrapper(...)`
    - des wrappers proxy/fournisseur partagés tels que `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` et `createMinimaxFastModeWrapper(...)`

    Certains assistants de flux restent volontairement locaux au fournisseur. Exemple intégré
    actuel : `@openclaw/anthropic-provider` exporte
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les
    builders de wrapper Anthropic de niveau inférieur depuis sa couture publique `api.ts` /
    `contract-api.ts`. Ces assistants restent spécifiques à Anthropic parce
    qu’ils encodent aussi la gestion des bêtas Claude OAuth et le filtrage `context1m`.

    D’autres fournisseurs intégrés gardent également des wrappers propres au transport en local lorsque
    le comportement n’est pas partagé proprement entre familles. Exemple actuel : le
    plugin xAI intégré garde la mise en forme native xAI Responses dans son propre
    `wrapStreamFn`, y compris les réécritures d’alias `/fast`, le `tool_stream` par
    défaut, le nettoyage des strict-tool non pris en charge et la suppression de payload
    de raisonnement spécifique à xAI.

    `openclaw/plugin-sdk/provider-tools` expose actuellement une famille partagée de schémas d’outils
    ainsi que des assistants partagés de schéma/compatibilité :

    - `ProviderToolCompatFamily` documente aujourd’hui l’inventaire des familles partagées.
    - `buildProviderToolCompatFamilyHooks("gemini")` connecte le nettoyage de schéma Gemini
      + les diagnostics pour les fournisseurs qui ont besoin de schémas d’outils sûrs pour Gemini.
    - `normalizeGeminiToolSchemas(...)` et `inspectGeminiToolSchemas(...)`
      sont les assistants publics sous-jacents de schéma Gemini.
    - `resolveXaiModelCompatPatch()` renvoie le correctif de compatibilité xAI intégré :
      `toolSchemaProfile: "xai"`, mots-clés de schéma non pris en charge, prise en charge native de
      `web_search` et décodage des arguments d’appel d’outil avec entités HTML.
    - `applyXaiModelCompat(model)` applique ce même correctif de compatibilité xAI à un
      modèle résolu avant qu’il n’atteigne l’exécuteur.

    Exemple intégré réel : le plugin xAI utilise `normalizeResolvedModel` plus
    `contributeResolvedModelCompat` pour que ces métadonnées de compatibilité restent gérées
    par le fournisseur au lieu de coder en dur des règles xAI dans le core.

    Le même motif de racine de package sert aussi à d’autres fournisseurs intégrés :

    - `@openclaw/openai-provider` : `api.ts` exporte des builders de fournisseur,
      des assistants de modèle par défaut et des builders de fournisseur realtime
    - `@openclaw/openrouter-provider` : `api.ts` exporte le builder de fournisseur
      ainsi que des assistants d’onboarding/configuration

    <Tabs>
      <Tab title="Échange de token">
        Pour les fournisseurs qui nécessitent un échange de token avant chaque appel d’inférence :

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
        // wrapStreamFn renvoie une StreamFn dérivée de ctx.streamFn
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
      <Tab title="Identité native du transport">
        Pour les fournisseurs qui ont besoin d’en-têtes ou métadonnées de requête/session natives sur
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
      | 2 | `applyConfigDefaults` | Valeurs par défaut globales gérées par le fournisseur pendant la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d’id de modèle anciens/preview avant recherche |
      | 4 | `normalizeTransport` | Nettoyage `api` / `baseUrl` de la famille du fournisseur avant assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité native streaming-usage pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution de l’authentification par marqueur d’environnement gérée par le fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/autohébergée ou adossée à la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Reléguer les espaces réservés synthétiques de profil stocké derrière l’authentification env/config |
      | 10 | `resolveDynamicModel` | Accepter des ids de modèle amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone des métadonnées avant résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant l’exécuteur |

    Remarques sur les solutions de secours à l’exécution :

    - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres
      plugins de fournisseur capables de hooks jusqu’à ce que l’un d’eux modifie réellement la configuration.
      Si aucun hook de fournisseur ne réécrit une entrée de configuration Google-family prise en charge, le
      normaliseur de configuration Google intégré continue de s’appliquer.
    - `resolveConfigApiKey` utilise le hook du fournisseur lorsqu’il est exposé. Le chemin intégré
      `amazon-bedrock` possède également ici un résolveur intégré de marqueur d’environnement AWS,
      même si l’authentification runtime Bedrock elle-même utilise encore la chaîne par défaut du SDK AWS.
      | 13 | `contributeResolvedModelCompat` | Drapeaux de compatibilité pour des modèles fournisseur derrière un autre transport compatible |
      | 14 | `capabilities` | Sac de capacités statiques ancien ; compatibilité uniquement |
      | 15 | `normalizeToolSchemas` | Nettoyage des schémas d’outils géré par le fournisseur avant l’enregistrement |
      | 16 | `inspectToolSchemas` | Diagnostics de schémas d’outils gérés par le fournisseur |
      | 17 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisé vs natif |
      | 18 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 19 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 20 | `wrapStreamFn` | Wrappers d’en-têtes/corps personnalisés sur le chemin de flux normal |
      | 21 | `resolveTransportTurnState` | En-têtes/métadonnées natives par tour |
      | 22 | `resolveWebSocketSessionPolicy` | En-têtes de session WS natifs / période de refroidissement |
      | 23 | `formatApiKey` | Forme de token runtime personnalisée |
      | 24 | `refreshOAuth` | Rafraîchissement OAuth personnalisé |
      | 25 | `buildAuthDoctorHint` | Conseils de réparation d’authentification |
      | 26 | `matchesContextOverflowError` | Détection de dépassement gérée par le fournisseur |
      | 27 | `classifyFailoverReason` | Classification des limites de débit/surcharge gérée par le fournisseur |
      | 28 | `isCacheTtlEligible` | Filtrage TTL du cache de prompt |
      | 29 | `buildMissingAuthMessage` | Indice personnalisé d’authentification manquante |
      | 30 | `suppressBuiltInModel` | Masquer les lignes amont obsolètes |
      | 31 | `augmentModelCatalog` | Lignes synthétiques de compatibilité future |
      | 32 | `isBinaryThinking` | Réflexion binaire activée/désactivée |
      | 33 | `supportsXHighThinking` | Prise en charge du raisonnement `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Politique par défaut de `/think` |
      | 35 | `isModernModelRef` | Correspondance de modèles live/smoke |
      | 36 | `prepareRuntimeAuth` | Échange de token avant inférence |
      | 37 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’usage |
      | 38 | `fetchUsageSnapshot` | Point de terminaison d’usage personnalisé |
      | 39 | `createEmbeddingProvider` | Adaptateur d’embedding géré par le fournisseur pour mémoire/recherche |
      | 40 | `buildReplayPolicy` | Politique personnalisée de rejeu/compaction de transcription |
      | 41 | `sanitizeReplayHistory` | Réécritures de rejeu spécifiques au fournisseur après le nettoyage générique |
      | 42 | `validateReplayTurns` | Validation stricte des tours de rejeu avant l’exécuteur embarqué |
      | 43 | `onModelSelected` | Callback après sélection (par ex. télémétrie) |

      Remarque sur le réglage des prompts :

      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter
        des consignes de prompt système sensibles au cache pour une famille de modèles. Préférez-le à
        `before_prompt_build` lorsque le comportement appartient à une famille de fournisseur/modèle
        et doit préserver la séparation stable/dynamique du cache.

      Pour des descriptions détaillées et des exemples réels, voir
      [Internals: Provider Runtime Hooks](/fr/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    <a id="step-5-add-extra-capabilities"></a>
    Un plugin de fournisseur peut enregistrer la voix, la transcription realtime, la
    voix realtime, la compréhension de médias, la génération d’images, la génération de vidéos, la récupération web
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

    OpenClaw classe cela comme un plugin à **capacité hybride**. C’est le
    motif recommandé pour les plugins d’entreprise (un plugin par fournisseur). Voir
    [Internals: Capability Ownership](/fr/plugins/architecture#capability-ownership-model).

  </Step>

  <Step title="Tester">
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

## Publier sur ClawHub

Les plugins de fournisseur se publient de la même manière que tout autre plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’ancien alias de publication réservé aux Skills ; les packages de plugin doivent utiliser
`clawhub package publish`.

## Structure des fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # métadonnées openclaw.providers
├── openclaw.plugin.json      # manifeste avec providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # tests
    └── usage.ts              # point de terminaison d’usage (facultatif)
```

## Référence de l’ordre du catalogue

`catalog.order` contrôle le moment où votre catalogue est fusionné par rapport aux
fournisseurs intégrés :

| Order     | Moment        | Cas d’usage                                     |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs simples à clé API                |
| `profile` | Après simple  | Fournisseurs filtrés par profils d’authentification |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées             |
| `late`    | Dernier passage | Remplacer des fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — si votre plugin fournit aussi un canal
- [Runtime SDK](/fr/plugins/sdk-runtime) — assistants `api.runtime` (TTS, recherche, sous-agent)
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Internals du plugin](/fr/plugins/architecture#provider-runtime-hooks) — détails des hooks et exemples intégrés
