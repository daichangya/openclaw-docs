---
read_when:
    - Vous créez un nouveau plugin de fournisseur de modèles
    - Vous souhaitez ajouter un proxy compatible OpenAI ou un LLM personnalisé à OpenClaw
    - Vous devez comprendre l’authentification du fournisseur, les catalogues et les hooks d’exécution
sidebarTitle: Provider plugins
summary: Guide étape par étape pour créer un plugin de fournisseur de modèles pour OpenClaw
title: Créer des plugins de fournisseur
x-i18n:
    generated_at: "2026-04-25T18:20:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c31f73619aa8fecf1b409bbd079683fae9ba996dd6ce22bd894b47cc76d5e856
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Ce guide explique pas à pas comment créer un plugin de fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous disposerez d’un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore jamais créé de plugin OpenClaw, lisez d’abord
  [Getting Started](/fr/plugins/building-plugins) pour la structure de package
  de base et la configuration du manifeste.
</Info>

<Tip>
  Les plugins de fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit s’exécuter via un démon d’agent natif qui gère les threads, la Compaction ou les événements d’outils,
  associez le fournisseur à un [agent harness](/fr/plugins/sdk-agent-harness)
  au lieu de placer les détails du protocole du démon dans le cœur.
</Tip>

## Procédure pas à pas

<Steps>
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

    Le manifeste déclare `providerAuthEnvVars` afin qu’OpenClaw puisse détecter les
    identifiants sans charger l’exécution de votre plugin. Ajoutez `providerAuthAliases`
    lorsqu’une variante de fournisseur doit réutiliser l’authentification d’un autre identifiant de fournisseur. `modelSupport`
    est facultatif et permet à OpenClaw de charger automatiquement votre plugin de fournisseur à partir
    d’identifiants abrégés de modèle comme `acme-large` avant que des hooks d’exécution n’existent. Si vous publiez le
    fournisseur sur ClawHub, ces champs `openclaw.compat` et `openclaw.build`
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

    Si le fournisseur amont utilise des tokens de contrôle différents de ceux d’OpenClaw, ajoutez une
    petite transformation de texte bidirectionnelle au lieu de remplacer le chemin de flux :

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

    `input` réécrit le prompt système final et le contenu textuel des messages avant
    le transport. `output` réécrit les deltas textuels de l’assistant et le texte final avant
    qu’OpenClaw analyse ses propres marqueurs de contrôle ou la livraison par canal.

    Pour les fournisseurs intégrés qui n’enregistrent qu’un seul fournisseur de texte avec authentification par clé API plus un seul runtime adossé à un catalogue, préférez l’assistant plus ciblé
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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` est le chemin du catalogue en direct utilisé lorsque OpenClaw peut résoudre une authentification réelle du
    fournisseur. Il peut effectuer une découverte spécifique au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour les entrées hors ligne qui peuvent être affichées sans risque avant la configuration de l’authentification ;
    il ne doit pas exiger d’identifiants ni effectuer de requêtes réseau.
    L’affichage `models list --all` d’OpenClaw exécute actuellement les catalogues statiques
    uniquement pour les plugins de fournisseurs intégrés, avec une configuration vide, un environnement vide et aucun
    chemin d’agent/espace de travail.

    Si votre flux d’authentification doit aussi corriger `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les assistants prédéfinis de
    `openclaw/plugin-sdk/provider-onboard`. Les assistants les plus ciblés sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsque le point de terminaison natif d’un fournisseur prend en charge des blocs d’usage diffusés sur le
    transport normal `openai-completions`, préférez les assistants de catalogue partagés de
    `openclaw/plugin-sdk/provider-catalog-shared` au lieu de coder en dur
    des vérifications d’identifiant de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la map des capacités du
    point de terminaison ; ainsi, les points de terminaison natifs de type Moonshot/DashScope
    peuvent toujours activer cette prise en charge même lorsqu’un plugin utilise un identifiant de fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique des modèles">
    Si votre fournisseur accepte des identifiants de modèle arbitraires (comme un proxy ou un routeur),
    ajoutez `resolveDynamicModel` :

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

    Si la résolution nécessite un appel réseau, utilisez `prepareDynamicModel` pour un préchauffage
    asynchrone — `resolveDynamicModel` s’exécute à nouveau une fois cette opération terminée.

  </Step>

  <Step title="Ajouter des hooks d’exécution (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez des hooks
    progressivement selon les besoins de votre fournisseur.

    Les assistants de construction partagés couvrent désormais les familles les plus courantes de relecture/compatibilité des outils,
    de sorte que les plugins n’ont généralement pas besoin de connecter manuellement chaque hook un par un :

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

    Familles de relecture disponibles actuellement :

    | Famille | Ce qu’elle connecte | Exemples intégrés |
    | --- | --- | --- |
    | `openai-compatible` | Politique partagée de relecture de style OpenAI pour les transports compatibles OpenAI, y compris l’assainissement des identifiants d’appel d’outils, les correctifs d’ordre assistant-en-premier et la validation générique des tours Gemini lorsque le transport en a besoin | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Politique de relecture compatible Claude choisie par `modelId`, de sorte que les transports Anthropic-message ne reçoivent le nettoyage spécifique aux blocs de réflexion Claude que lorsque le modèle résolu est réellement un identifiant Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Politique native de relecture Gemini plus assainissement de relecture bootstrap et mode de sortie de raisonnement balisé | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Assainissement des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation native de relecture Gemini ni les réécritures bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles Anthropic-message et compatibles OpenAI dans un même plugin ; la suppression facultative des blocs de réflexion réservée à Claude reste limitée au côté Anthropic | `minimax` |

    Familles de flux disponibles actuellement :

    | Famille | Ce qu’elle connecte | Exemples intégrés |
    | --- | --- | --- |
    | `google-thinking` | Normalisation des charges utiles de réflexion Gemini sur le chemin de flux partagé | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de flux proxy partagé, avec `kilo/auto` et les identifiants de raisonnement proxy non pris en charge qui ignorent la réflexion injectée | `kilocode` |
    | `moonshot-thinking` | Mappage Moonshot des charges utiles binaires natives de réflexion à partir de la configuration + niveau `/think` | `moonshot` |
    | `minimax-fast-mode` | Réécriture du modèle MiniMax en mode rapide sur le chemin de flux partagé | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers natifs partagés OpenAI/Codex Responses : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web native Codex, mise en forme des charges utiles de compatibilité du raisonnement et gestion du contexte Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec gestion centralisée des ignorances pour `auto`/modèles non pris en charge | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour des fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite | `zai` |

    <Accordion title="Interfaces SDK qui alimentent les constructeurs de familles">
      Chaque constructeur de famille est composé d’assistants publics de plus bas niveau exportés par le même package, que vous pouvez utiliser lorsqu’un fournisseur doit s’écarter du modèle commun :

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` et les constructeurs bruts de relecture (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporte aussi les assistants de relecture Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) et les assistants de point de terminaison/modèle (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ainsi que les wrappers partagés OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), le wrapper compatible OpenAI pour DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) et les wrappers partagés proxy/fournisseur (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, les assistants sous-jacents de schéma Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) et les assistants de compatibilité xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Le plugin xAI intégré utilise `normalizeResolvedModel` + `contributeResolvedModelCompat` avec ceux-ci pour que les règles xAI restent gérées par le fournisseur.

      Certains assistants de flux restent volontairement locaux au fournisseur. `@openclaw/anthropic-provider` conserve `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les constructeurs de wrappers Anthropic de plus bas niveau dans sa propre interface publique `api.ts` / `contract-api.ts`, car ils encapsulent la gestion bêta de Claude OAuth et le contrôle `context1m`. Le plugin xAI conserve de la même façon la mise en forme native xAI Responses dans son propre `wrapStreamFn` (alias `/fast`, `tool_stream` par défaut, nettoyage des outils stricts non pris en charge, suppression des charges utiles de raisonnement spécifiques à xAI).

      Le même modèle à la racine du package prend aussi en charge `@openclaw/openai-provider` (constructeurs de fournisseurs, assistants de modèle par défaut, constructeurs de fournisseurs temps réel) et `@openclaw/openrouter-provider` (constructeur de fournisseur plus assistants d’onboarding/configuration).
    </Accordion>

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
        Pour les fournisseurs qui nécessitent des en-têtes de requête personnalisés ou des modifications du corps :

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
      <Tab title="Identité native du transport">
        Pour les fournisseurs qui nécessitent des en-têtes ou métadonnées natives de requête/session sur
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
      | 2 | `applyConfigDefaults` | Valeurs globales par défaut gérées par le fournisseur pendant la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d’identifiant de modèle hérités/preview avant la recherche |
      | 4 | `normalizeTransport` | Nettoyage de `api` / `baseUrl` pour une famille de fournisseurs avant l’assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité d’usage natif en streaming pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution d’authentification par marqueur d’environnement gérée par le fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/auto-hébergée ou adossée à la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Reléguer les espaces réservés synthétiques de profils stockés derrière l’authentification env/config |
      | 10 | `resolveDynamicModel` | Accepter des identifiants de modèle amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone de métadonnées avant résolution |
      | 12 | `normalizeResolvedModel` | Réécritures du transport avant l’exécuteur |
      | 13 | `contributeResolvedModelCompat` | Indicateurs de compatibilité pour des modèles fournisseur derrière un autre transport compatible |
      | 14 | `capabilities` | Ancien ensemble statique de capacités ; compatibilité uniquement |
      | 15 | `normalizeToolSchemas` | Nettoyage des schémas d’outils géré par le fournisseur avant l’enregistrement |
      | 16 | `inspectToolSchemas` | Diagnostics des schémas d’outils gérés par le fournisseur |
      | 17 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisé ou natif |
      | 18 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 19 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 20 | `wrapStreamFn` | Wrappers personnalisés d’en-têtes/corps sur le chemin de flux normal |
      | 21 | `resolveTransportTurnState` | En-têtes/métadonnées natives par tour |
      | 22 | `resolveWebSocketSessionPolicy` | En-têtes de session WS natifs/temps de refroidissement |
      | 23 | `formatApiKey` | Format personnalisé de token à l’exécution |
      | 24 | `refreshOAuth` | Rafraîchissement OAuth personnalisé |
      | 25 | `buildAuthDoctorHint` | Guide de réparation d’authentification |
      | 26 | `matchesContextOverflowError` | Détection de dépassement gérée par le fournisseur |
      | 27 | `classifyFailoverReason` | Classification des limitations de débit/surcharge gérée par le fournisseur |
      | 28 | `isCacheTtlEligible` | Contrôle TTL du cache de prompt |
      | 29 | `buildMissingAuthMessage` | Indice personnalisé d’authentification manquante |
      | 30 | `suppressBuiltInModel` | Masquer les lignes amont obsolètes |
      | 31 | `augmentModelCatalog` | Lignes synthétiques de compatibilité ascendante |
      | 32 | `resolveThinkingProfile` | Ensemble d’options `/think` spécifique au modèle |
      | 33 | `isBinaryThinking` | Compatibilité réflexion binaire activée/désactivée |
      | 34 | `supportsXHighThinking` | Compatibilité de la prise en charge du raisonnement `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilité de la politique `/think` par défaut |
      | 36 | `isModernModelRef` | Correspondance de modèle live/smoke |
      | 37 | `prepareRuntimeAuth` | Échange de token avant l’inférence |
      | 38 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’usage |
      | 39 | `fetchUsageSnapshot` | Point de terminaison d’usage personnalisé |
      | 40 | `createEmbeddingProvider` | Adaptateur d’embeddings géré par le fournisseur pour la mémoire/recherche |
      | 41 | `buildReplayPolicy` | Politique personnalisée de relecture/Compaction du transcript |
      | 42 | `sanitizeReplayHistory` | Réécritures spécifiques au fournisseur de l’historique de relecture après nettoyage générique |
      | 43 | `validateReplayTurns` | Validation stricte des tours de relecture avant l’exécuteur embarqué |
      | 44 | `onModelSelected` | Callback post-sélection (par ex. télémétrie) |

      Remarques sur les replis d’exécution :

      - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres plugins de fournisseur capables de gérer des hooks jusqu’à ce que l’un modifie réellement la configuration. Si aucun hook de fournisseur ne réécrit une entrée de configuration prise en charge de la famille Google, le normaliseur de configuration Google intégré s’applique quand même.
      - `resolveConfigApiKey` utilise le hook du fournisseur lorsqu’il est exposé. Le chemin intégré `amazon-bedrock` dispose aussi ici d’un résolveur natif de marqueur d’environnement AWS, même si l’authentification Bedrock à l’exécution utilise toujours la chaîne par défaut du SDK AWS.
      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter des instructions de prompt système sensibles au cache pour une famille de modèles. Préférez-le à `before_prompt_build` lorsque le comportement appartient à une famille fournisseur/modèle et doit préserver la séparation stable/dynamique du cache.

      Pour des descriptions détaillées et des exemples concrets, voir [Internals: Provider Runtime Hooks](/fr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    Un plugin de fournisseur peut enregistrer la parole, la transcription temps réel, la
    voix temps réel, la compréhension de médias, la génération d’images, la génération de vidéos, la récupération web
    et la recherche web en plus de l’inférence de texte. OpenClaw classe cela comme un
    plugin à **capacité hybride** — le modèle recommandé pour les plugins d’entreprise
    (un plugin par fournisseur). Voir
    [Internals: Capability Ownership](/fr/plugins/architecture#capability-ownership-model).

    Enregistrez chaque capacité dans `register(api)` à côté de votre appel existant
    `api.registerProvider(...)`. Choisissez uniquement les onglets dont vous avez besoin :

    <Tabs>
      <Tab title="Parole (TTS)">
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

        Utilisez `assertOkOrThrowProviderError(...)` pour les échecs HTTP du fournisseur afin que
        les plugins partagent des lectures plafonnées du corps d’erreur, l’analyse des erreurs JSON et
        les suffixes d’identifiant de requête.
      </Tab>
      <Tab title="Transcription en temps réel">
        Préférez `createRealtimeTranscriptionWebSocketSession(...)` — cet assistant partagé
        gère la capture du proxy, le backoff de reconnexion, la vidange à la fermeture, les handshakes de disponibilité,
        la mise en file de l’audio et les diagnostics des événements de fermeture. Votre plugin
        ne fait que mapper les événements amont.

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

        Les fournisseurs STT par lot qui envoient de l’audio multipart par POST doivent utiliser
        `buildAudioTranscriptionFormData(...)` depuis
        `openclaw/plugin-sdk/provider-http`. Cet assistant normalise les noms de fichiers
        téléversés, y compris les téléversements AAC qui nécessitent un nom de fichier de type M4A pour
        les API de transcription compatibles.
      </Tab>
      <Tab title="Voix en temps réel">
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
      <Tab title="Compréhension des médias">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Génération d’images et de vidéos">
        Les capacités vidéo utilisent une forme **sensible au mode** : `generate`,
        `imageToVideo` et `videoToVideo`. Des champs agrégés plats comme
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ne suffisent
        pas à annoncer proprement la prise en charge des modes de transformation ou les modes désactivés.
        La génération musicale suit le même modèle avec des blocs explicites `generate` /
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
      <Tab title="Récupération web et recherche">
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

  <Step title="Tester">
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

N’utilisez pas ici l’ancien alias de publication réservé aux Skills ; les packages de plugins doivent utiliser
`clawhub package publish`.

## Structure des fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Référence de l’ordre du catalogue

`catalog.order` contrôle le moment où votre catalogue est fusionné par rapport aux
fournisseurs intégrés :

| Ordre     | Quand         | Cas d’usage                                     |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs simples à clé API                 |
| `profile` | Après `simple` | Fournisseurs dépendant de profils d’authentification |
| `paired`  | Après `profile` | Synthétiser plusieurs entrées liées            |
| `late`    | Dernier passage | Remplacer des fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — si votre plugin fournit aussi un canal
- [SDK Runtime](/fr/plugins/sdk-runtime) — assistants `api.runtime` (TTS, recherche, sous-agent)
- [Aperçu du SDK](/fr/plugins/sdk-overview) — référence complète des imports de sous-chemins
- [Internes des plugins](/fr/plugins/architecture-internals#provider-runtime-hooks) — détails des hooks et exemples intégrés

## Voir aussi

- [Configuration du Plugin SDK](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
- [Créer des plugins de canal](/fr/plugins/sdk-channel-plugins)
