---
read_when:
    - Vous créez un nouveau plugin de fournisseur de modèles
    - Vous souhaitez ajouter à OpenClaw un proxy compatible OpenAI ou un LLM personnalisé
    - Vous devez comprendre l’authentification fournisseur, les catalogues et les hooks runtime
sidebarTitle: Provider plugins
summary: Guide étape par étape pour créer un plugin de fournisseur de modèles pour OpenClaw
title: Création de plugins de fournisseur
x-i18n:
    generated_at: "2026-04-24T07:23:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Ce guide explique étape par étape comment créer un plugin de fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous aurez un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore jamais créé de plugin OpenClaw, lisez d’abord
  [Getting Started](/fr/plugins/building-plugins) pour la structure de base du paquet
  et la configuration du manifeste.
</Info>

<Tip>
  Les plugins de fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit s’exécuter via un daemon d’agent natif qui gère les fils, la Compaction ou les événements d’outil,
  associez le fournisseur à un [agent harness](/fr/plugins/sdk-agent-harness)
  au lieu de placer les détails du protocole du daemon dans le cœur.
</Tip>

## Procédure

<Steps>
  <Step title="Paquet et manifeste">
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
    identifiants sans charger le runtime de votre plugin. Ajoutez `providerAuthAliases`
    lorsqu’une variante de fournisseur doit réutiliser l’authentification d’un autre ID de fournisseur. `modelSupport`
    est facultatif et permet à OpenClaw de charger automatiquement votre plugin fournisseur à partir d’identifiants
    de modèle abrégés comme `acme-large` avant même que les hooks runtime n’existent. Si vous publiez le
    fournisseur sur ClawHub, les champs `openclaw.compat` et `openclaw.build`
    sont requis dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur minimal nécessite un `id`, un `label`, un `auth` et un `catalog` :

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

    Cela suffit pour avoir un fournisseur fonctionnel. Les utilisateurs peuvent désormais
    faire `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

    Si le fournisseur amont utilise des jetons de contrôle différents de ceux d’OpenClaw, ajoutez une
    petite transformation bidirectionnelle de texte au lieu de remplacer le chemin de flux :

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

    `input` réécrit le prompt système final et le contenu des messages texte avant
    transport. `output` réécrit les deltas de texte assistant et le texte final avant
    qu’OpenClaw n’analyse ses propres marqueurs de contrôle ou la livraison par canal.

    Pour les fournisseurs groupés qui n’enregistrent qu’un seul fournisseur texte avec une authentification
    par clé API plus un seul runtime adossé à un catalogue, préférez le helper plus étroit
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

    `buildProvider` est le chemin de catalogue live utilisé lorsqu’OpenClaw peut résoudre une véritable
    authentification fournisseur. Il peut effectuer une découverte spécifique au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour des lignes hors ligne qui peuvent être affichées sans danger avant que l’authentification
    ne soit configurée ; il ne doit ni nécessiter d’identifiants ni effectuer de requêtes réseau.
    L’affichage `models list --all` d’OpenClaw exécute actuellement les catalogues statiques
    uniquement pour les plugins fournisseurs groupés, avec une configuration vide, un env vide et aucun
    chemin d’agent/espace de travail.

    Si votre flux d’authentification doit aussi patcher `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les helpers prédéfinis de
    `openclaw/plugin-sdk/provider-onboard`. Les helpers les plus étroits sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, et
    `createModelCatalogPresetAppliers(...)`.

    Lorsqu’un point de terminaison natif de fournisseur prend en charge des blocs d’usage streamés sur le
    transport normal `openai-completions`, préférez les helpers de catalogue partagé dans
    `openclaw/plugin-sdk/provider-catalog-shared` plutôt que de coder en dur des vérifications par ID
    de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge depuis la carte de capacités du point de terminaison,
    de sorte que des points de terminaison natifs de type Moonshot/DashScope optent tout de même
    même lorsqu’un plugin utilise un ID de fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique des modèles">
    Si votre fournisseur accepte des ID de modèles arbitraires (comme un proxy ou un routeur),
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
    préchauffage asynchrone — `resolveDynamicModel` sera réexécuté une fois ce préchauffage terminé.

  </Step>

  <Step title="Ajouter des hooks runtime (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez les hooks
    progressivement selon les besoins de votre fournisseur.

    Les constructeurs de helpers partagés couvrent désormais les familles les plus courantes de replay et de compatibilité outils,
    de sorte que les plugins n’ont généralement pas besoin de raccorder manuellement chaque hook :

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

    Familles de replay disponibles aujourd’hui :

    | Famille | Ce qu’elle raccorde | Exemples groupés |
    | --- | --- | --- |
    | `openai-compatible` | Politique de replay partagée de style OpenAI pour les transports compatibles OpenAI, y compris l’assainissement des tool-call-id, les correctifs d’ordre assistant-first et la validation générique des tours Gemini lorsque le transport en a besoin | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Politique de replay sensible à Claude choisie par `modelId`, afin que les transports de type message Anthropic ne reçoivent le nettoyage spécifique des blocs de réflexion Claude que lorsque le modèle résolu est réellement un ID Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Politique de replay Gemini native plus assainissement du bootstrap de replay et mode de sortie de raisonnement balisé | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Assainissement des signatures de réflexion Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation native du replay Gemini ni les réécritures de bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles de type message Anthropic et compatibles OpenAI dans un même plugin ; la suppression facultative des blocs de réflexion limitée à Claude reste cantonnée au côté Anthropic | `minimax` |

    Familles de flux disponibles aujourd’hui :

    | Famille | Ce qu’elle raccorde | Exemples groupés |
    | --- | --- | --- |
    | `google-thinking` | Normalisation de la charge utile de réflexion Gemini sur le chemin de flux partagé | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de flux proxy partagé, avec saut de `kilo/auto` et des identifiants de raisonnement proxy non pris en charge injectés | `kilocode` |
    | `moonshot-thinking` | Mappage de la charge utile native de réflexion binaire Moonshot depuis la configuration + niveau `/think` | `moonshot` |
    | `minimax-fast-mode` | Réécriture de modèle MiniMax fast-mode sur le chemin de flux partagé | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers natifs OpenAI/Codex Responses partagés : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité texte, recherche web native Codex, mise en forme de charge utile de compatibilité de raisonnement et gestion de contexte Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec gestion centralisée des sauts sur modèles non pris en charge/`auto` | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour des fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite | `zai` |

    <Accordion title="Points d’extension SDK alimentant les constructeurs de familles">
      Chaque constructeur de famille est composé à partir de helpers publics de plus bas niveau exportés depuis le même paquet, que vous pouvez utiliser lorsqu’un fournisseur doit sortir du modèle commun :

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, et les constructeurs bruts de replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporte aussi des helpers de replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) et des helpers de point de terminaison/modèle (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus les wrappers partagés OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) et les wrappers partagés proxy/fournisseur (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, les helpers sous-jacents de schéma Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), ainsi que les helpers de compatibilité xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Le plugin xAI groupé utilise `normalizeResolvedModel` + `contributeResolvedModelCompat` avec ceux-ci pour conserver les règles xAI sous la responsabilité du fournisseur.

      Certains helpers de flux restent volontairement locaux au fournisseur. `@openclaw/anthropic-provider` garde `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les constructeurs de wrappers Anthropic de plus bas niveau dans son propre point d’extension public `api.ts` / `contract-api.ts`, car ils encodent la gestion bêta de Claude OAuth et le contrôle `context1m`. Le plugin xAI garde de la même manière la mise en forme native xAI Responses dans son propre `wrapStreamFn` (alias `/fast`, `tool_stream` par défaut, nettoyage strict d’outils non pris en charge, suppression de charge utile de raisonnement propre à xAI).

      Le même modèle de paquet racine alimente aussi `@openclaw/openai-provider` (constructeurs de fournisseur, helpers de modèle par défaut, constructeurs de fournisseur realtime) et `@openclaw/openrouter-provider` (constructeur de fournisseur plus helpers d’onboarding/configuration).
    </Accordion>

    <Tabs>
      <Tab title="Échange de jetons">
        Pour les fournisseurs qui nécessitent un échange de jeton avant chaque appel d’inférence :

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
        Pour les fournisseurs qui ont besoin d’en-têtes ou de métadonnées natives de requête/session sur
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

    <Accordion title="Tous les hooks fournisseur disponibles">
      OpenClaw appelle les hooks dans cet ordre. La plupart des fournisseurs n’en utilisent que 2 à 3 :

      | # | Hook | Quand l’utiliser |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut de `baseUrl` |
      | 2 | `applyConfigDefaults` | Valeurs par défaut globales appartenant au fournisseur pendant la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d’ID de modèle legacy/preview avant lookup |
      | 4 | `normalizeTransport` | Nettoyage de `api` / `baseUrl` de famille fournisseur avant assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité native streaming-usage pour les fournisseurs configurés |
      | 7 | `resolveConfigApiKey` | Résolution d’authentification via marqueur env appartenant au fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/auto-hébergée ou adossée à la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Faire passer les placeholders synthétiques de profils stockés derrière l’authentification env/config |
      | 10 | `resolveDynamicModel` | Accepter des ID de modèles amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone de métadonnées avant résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant le runner |
      | 13 | `contributeResolvedModelCompat` | Indicateurs de compatibilité pour les modèles vendeurs derrière un autre transport compatible |
      | 14 | `capabilities` | Ancien sac statique de capacités ; compatibilité uniquement |
      | 15 | `normalizeToolSchemas` | Nettoyage des schémas d’outils appartenant au fournisseur avant enregistrement |
      | 16 | `inspectToolSchemas` | Diagnostics des schémas d’outils appartenant au fournisseur |
      | 17 | `resolveReasoningOutputMode` | Contrat tagged vs native pour la sortie de raisonnement |
      | 18 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 19 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 20 | `wrapStreamFn` | Wrappers d’en-têtes/corps personnalisés sur le chemin normal de flux |
      | 21 | `resolveTransportTurnState` | En-têtes/métadonnées natives par tour |
      | 22 | `resolveWebSocketSessionPolicy` | En-têtes de session WS natives / refroidissement |
      | 23 | `formatApiKey` | Forme de jeton runtime personnalisée |
      | 24 | `refreshOAuth` | Rafraîchissement OAuth personnalisé |
      | 25 | `buildAuthDoctorHint` | Guide de réparation d’authentification |
      | 26 | `matchesContextOverflowError` | Détection de débordement appartenant au fournisseur |
      | 27 | `classifyFailoverReason` | Classification de limitation de débit/surcharge appartenant au fournisseur |
      | 28 | `isCacheTtlEligible` | Contrôle TTL du cache de prompts |
      | 29 | `buildMissingAuthMessage` | Indication personnalisée d’authentification manquante |
      | 30 | `suppressBuiltInModel` | Masquer les anciennes lignes amont |
      | 31 | `augmentModelCatalog` | Lignes synthétiques de compatibilité anticipée |
      | 32 | `resolveThinkingProfile` | Jeu d’options `/think` spécifique au modèle |
      | 33 | `isBinaryThinking` | Compatibilité réflexion binaire on/off |
      | 34 | `supportsXHighThinking` | Compatibilité de prise en charge du raisonnement `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilité de politique par défaut `/think` |
      | 36 | `isModernModelRef` | Correspondance de modèle live/smoke |
      | 37 | `prepareRuntimeAuth` | Échange de jetons avant l’inférence |
      | 38 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’usage |
      | 39 | `fetchUsageSnapshot` | Point de terminaison d’usage personnalisé |
      | 40 | `createEmbeddingProvider` | Adaptateur d’embedding appartenant au fournisseur pour mémoire/recherche |
      | 41 | `buildReplayPolicy` | Politique personnalisée de replay/Compaction du transcript |
      | 42 | `sanitizeReplayHistory` | Réécritures de replay propres au fournisseur après nettoyage générique |
      | 43 | `validateReplayTurns` | Validation stricte des tours de replay avant le runner intégré |
      | 44 | `onModelSelected` | Callback post-sélection (par ex. télémétrie) |

      Remarques de repli runtime :

      - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres plugins fournisseurs disposant de hooks jusqu’à ce que l’un d’eux modifie réellement la configuration. Si aucun hook fournisseur ne réécrit une entrée de configuration de famille Google prise en charge, le normaliseur de configuration Google groupé s’applique quand même.
      - `resolveConfigApiKey` utilise le hook fournisseur lorsqu’il est exposé. Le chemin `amazon-bedrock` groupé dispose aussi d’un résolveur intégré de marqueur env AWS à cet endroit, même si l’authentification runtime Bedrock elle-même utilise toujours la chaîne par défaut du SDK AWS.
      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter des consignes de prompt système conscientes du cache pour une famille de modèles. Préférez-le à `before_prompt_build` lorsque le comportement appartient à un fournisseur/une famille de modèles spécifique et doit préserver la séparation cache stable/dynamique.

      Pour des descriptions détaillées et des exemples concrets, voir [Internals: Provider Runtime Hooks](/fr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    Un plugin fournisseur peut enregistrer la synthèse vocale, la transcription realtime, la voix realtime, la compréhension de médias, la génération d’images, la génération vidéo, la récupération web et la recherche web en plus de l’inférence texte. OpenClaw classe cela comme un plugin à **capacités hybrides** — le modèle recommandé pour les plugins d’entreprise (un plugin par vendeur). Voir
    [Internals: Capability Ownership](/fr/plugins/architecture#capability-ownership-model).

    Enregistrez chaque capacité dans `register(api)` à côté de votre appel existant
    `api.registerProvider(...)`. Choisissez uniquement les onglets dont vous avez besoin :

    <Tabs>
      <Tab title="Synthèse vocale (TTS)">
        ```typescript
        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => ({
            audioBuffer: Buffer.from(/* données PCM */),
            outputFormat: "mp3",
            fileExtension: ".mp3",
            voiceCompatible: false,
          }),
        });
        ```
      </Tab>
      <Tab title="Transcription realtime">
        Préférez `createRealtimeTranscriptionWebSocketSession(...)` — le helper partagé
        gère la capture du proxy, le backoff de reconnexion, le vidage à la fermeture, les handshakes ready, la mise en file d’attente audio et les diagnostics d’événements de fermeture. Votre plugin
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

        Les fournisseurs STT batch qui envoient de l’audio en multipart POST doivent utiliser
        `buildAudioTranscriptionFormData(...)` de
        `openclaw/plugin-sdk/provider-http`. Le helper normalise les noms de
        fichiers téléversés, y compris les téléversements AAC qui nécessitent un nom de fichier de style M4A pour
        les API de transcription compatibles.
      </Tab>
      <Tab title="Voix realtime">
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
        `imageToVideo`, et `videoToVideo`. Les champs agrégés plats comme
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ne suffisent pas
        pour annoncer proprement la prise en charge des modes de transformation ou les modes désactivés.
        La génération de musique suit le même modèle avec des blocs explicites `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* résultat image */ }),
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
      <Tab title="Récupération et recherche web">
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
    // Exportez votre objet de configuration fournisseur depuis index.ts ou un fichier dédié
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("résout les modèles dynamiques", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("renvoie le catalogue lorsqu’une clé est disponible", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("renvoie un catalogue nul lorsqu’il n’y a pas de clé", async () => {
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

Les plugins fournisseur se publient de la même manière que n’importe quel plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’ancien alias de publication réservé aux Skills ; les paquets de plugin doivent utiliser
`clawhub package publish`.

## Structure de fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # métadonnées openclaw.providers
├── openclaw.plugin.json      # manifeste avec métadonnées d’authentification fournisseur
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # tests
    └── usage.ts              # point de terminaison d’usage (facultatif)
```

## Référence d’ordre du catalogue

`catalog.order` contrôle le moment où votre catalogue fusionne par rapport aux
fournisseurs intégrés :

| Ordre     | Moment        | Cas d’usage                                      |
| --------- | ------------- | ------------------------------------------------ |
| `simple`  | Premier passage | Fournisseurs simples avec clé API               |
| `profile` | Après simple  | Fournisseurs contrôlés par des profils d’authentification |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées              |
| `late`    | Dernier passage | Remplacer des fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — si votre plugin fournit aussi un canal
- [SDK Runtime](/fr/plugins/sdk-runtime) — helpers `api.runtime` (TTS, recherche, sous-agent)
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports de sous-chemins
- [Internes des plugins](/fr/plugins/architecture-internals#provider-runtime-hooks) — détails des hooks et exemples groupés

## Associé

- [Configuration du Plugin SDK](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
- [Création de plugins de canal](/fr/plugins/sdk-channel-plugins)
