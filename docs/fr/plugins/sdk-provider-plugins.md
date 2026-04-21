---
read_when:
    - Vous créez un nouveau Plugin de fournisseur de modèles
    - Vous voulez ajouter à OpenClaw un proxy compatible OpenAI ou un LLM personnalisé
    - Vous devez comprendre l’authentification fournisseur, les catalogues et les hooks runtime
sidebarTitle: Provider Plugins
summary: Guide étape par étape pour créer un Plugin de fournisseur de modèles pour OpenClaw
title: Créer des Plugins de fournisseur
x-i18n:
    generated_at: "2026-04-21T07:04:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 459761118c7394c1643c170edfec97c87e1c6323b436183b53ad7a2fed783b04
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Créer des Plugins de fournisseur

Ce guide explique étape par étape comment créer un Plugin de fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous aurez un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore jamais créé de Plugin OpenClaw, lisez d’abord
  [Prise en main](/fr/plugins/building-plugins) pour la structure de paquet
  de base et la configuration du manifeste.
</Info>

<Tip>
  Les Plugins de fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit passer par un daemon d’agent natif qui gère les fils, la Compaction ou les
  événements d’outils, associez le fournisseur à un [agent harness](/fr/plugins/sdk-agent-harness)
  au lieu de mettre les détails du protocole du daemon dans le cœur.
</Tip>

## Guide pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
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
      "description": "Fournisseur de modèles Acme AI",
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
          "choiceLabel": "Clé API Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Clé API Acme AI"
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
    identifiants sans charger le runtime de votre Plugin. Ajoutez `providerAuthAliases`
    lorsqu’une variante de fournisseur doit réutiliser l’auth de l’identifiant d’un autre fournisseur. `modelSupport`
    est optionnel et permet à OpenClaw de charger automatiquement votre Plugin fournisseur à partir
    d’identifiants de modèle abrégés comme `acme-large` avant l’existence des hooks runtime. Si vous publiez le
    fournisseur sur ClawHub, ces champs `openclaw.compat` et `openclaw.build`
    sont requis dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur minimal a besoin de `id`, `label`, `auth` et `catalog` :

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Fournisseur de modèles Acme AI",
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
              label: "Clé API Acme AI",
              hint: "Clé API depuis votre tableau de bord Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Saisissez votre clé API Acme AI",
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

    C’est un fournisseur fonctionnel. Les utilisateurs peuvent maintenant exécuter
    `openclaw onboard --acme-ai-api-key <key>` puis sélectionner
    `acme-ai/acme-large` comme modèle.

    Si le fournisseur amont utilise des jetons de contrôle différents de ceux d’OpenClaw, ajoutez une
    petite transformation de texte bidirectionnelle au lieu de remplacer le chemin de streaming :

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
    le transport. `output` réécrit les deltas de texte de l’assistant et le texte final avant
    qu’OpenClaw n’analyse ses propres marqueurs de contrôle ou la livraison au canal.

    Pour les fournisseurs fournis qui n’enregistrent qu’un seul fournisseur de texte avec une auth par clé API
    plus un runtime unique adossé à un catalogue, préférez le helper plus étroit
    `defineSingleProviderPluginEntry(...)` :

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Fournisseur de modèles Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Clé API Acme AI",
            hint: "Clé API depuis votre tableau de bord Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Saisissez votre clé API Acme AI",
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

    Si votre flux d’auth doit aussi modifier `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les helpers de préréglage depuis
    `openclaw/plugin-sdk/provider-onboard`. Les helpers les plus étroits sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsque le point de terminaison natif d’un fournisseur prend en charge des blocs d’usage streamés sur le
    transport normal `openai-completions`, préférez les helpers de catalogue partagés dans
    `openclaw/plugin-sdk/provider-catalog-shared` au lieu de coder en dur des vérifications d’identifiant de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la map de capacités du point de terminaison, afin que les points de terminaison natifs de style Moonshot/DashScope puissent toujours être activés même lorsqu’un Plugin utilise un identifiant de fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique de modèle">
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

    Si la résolution exige un appel réseau, utilisez `prepareDynamicModel` pour un
    préchauffage asynchrone — `resolveDynamicModel` s’exécute à nouveau une fois celui-ci terminé.

  </Step>

  <Step title="Ajouter des hooks runtime (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez des hooks
    progressivement selon les besoins de votre fournisseur.

    Les constructeurs de helpers partagés couvrent désormais les familles les plus courantes de replay / compatibilité d’outils,
    de sorte que les Plugins n’ont généralement pas besoin de câbler chaque hook à la main :

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

    | Famille | Ce qu’elle câble |
    | --- | --- |
    | `openai-compatible` | Politique de replay partagée de style OpenAI pour les transports compatibles OpenAI, y compris l’assainissement de `tool-call-id`, les corrections d’ordre assistant-first et la validation générique des tours Gemini lorsque le transport en a besoin |
    | `anthropic-by-model` | Politique de replay aware de Claude choisie par `modelId`, afin que les transports de messages Anthropic ne reçoivent le nettoyage spécifique des blocs de réflexion Claude que lorsque le modèle résolu est réellement un identifiant Claude |
    | `google-gemini` | Politique de replay Gemini native plus assainissement du replay d’amorçage et mode de sortie de raisonnement balisé |
    | `passthrough-gemini` | Assainissement de signature de pensée Gemini pour des modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation de replay Gemini native ni les réécritures d’amorçage |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles en messages Anthropic et compatibles OpenAI dans un même Plugin ; la suppression facultative des blocs de réflexion uniquement pour Claude reste limitée au côté Anthropic |

    Exemples fournis réels :

    - `google` et `google-gemini-cli` : `google-gemini`
    - `openrouter`, `kilocode`, `opencode` et `opencode-go` : `passthrough-gemini`
    - `amazon-bedrock` et `anthropic-vertex` : `anthropic-by-model`
    - `minimax` : `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` et `zai` : `openai-compatible`

    Familles de stream disponibles aujourd’hui :

    | Famille | Ce qu’elle câble |
    | --- | --- |
    | `google-thinking` | Normalisation de la charge utile de réflexion Gemini sur le chemin de stream partagé |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de stream proxy partagé, avec `kilo/auto` et les identifiants de raisonnement proxy non pris en charge qui ignorent la réflexion injectée |
    | `moonshot-thinking` | Mapping binaire de charge utile de réflexion native Moonshot à partir de la configuration + niveau `/think` |
    | `minimax-fast-mode` | Réécriture de modèle fast-mode MiniMax sur le chemin de stream partagé |
    | `openai-responses-defaults` | Wrappers natifs partagés OpenAI/Codex Responses : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web Codex native, mise en forme des charges utiles de compatibilité de raisonnement et gestion de contexte Responses |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec gestion centralisée des sauts pour modèles non pris en charge / `auto` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour des fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite |

    Exemples fournis réels :

    - `google` et `google-gemini-cli` : `google-thinking`
    - `kilocode` : `kilocode-thinking`
    - `moonshot` : `moonshot-thinking`
    - `minimax` et `minimax-portal` : `minimax-fast-mode`
    - `openai` et `openai-codex` : `openai-responses-defaults`
    - `openrouter` : `openrouter-thinking`
    - `zai` : `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exporte aussi l’énumération des familles de replay
    ainsi que les helpers partagés à partir desquels ces familles sont construites. Les
    exports publics courants incluent :

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - les constructeurs de replay partagés tels que `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` et
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - les helpers de replay Gemini tels que `sanitizeGoogleGeminiReplayHistory(...)`
      et `resolveTaggedReasoningOutputMode()`
    - les helpers de point de terminaison / modèle tels que `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` et
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expose à la fois le constructeur de famille et
    les helpers de wrapper publics que ces familles réutilisent. Les exports publics courants
    incluent :

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - les wrappers partagés OpenAI/Codex tels que
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` et
      `createCodexNativeWebSearchWrapper(...)`
    - les wrappers partagés proxy / fournisseur tels que `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` et `createMinimaxFastModeWrapper(...)`

    Certains helpers de stream restent volontairement locaux au fournisseur. Exemple fourni
    actuel : `@openclaw/anthropic-provider` exporte
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les
    constructeurs de wrappers Anthropic de plus bas niveau depuis sa jonction publique `api.ts` /
    `contract-api.ts`. Ces helpers restent spécifiques à Anthropic car
    ils encodent aussi la gestion bêta OAuth Claude et le contrôle `context1m`.

    D’autres fournisseurs fournis gardent aussi des wrappers spécifiques au transport en local lorsque
    le comportement n’est pas proprement partagé entre les familles. Exemple actuel : le
    Plugin xAI fourni garde la mise en forme native xAI Responses dans son propre
    `wrapStreamFn`, y compris les réécritures d’alias `/fast`, le `tool_stream` par défaut,
    le nettoyage des strict-tools non pris en charge et la
    suppression de charge utile de raisonnement spécifique à xAI.

    `openclaw/plugin-sdk/provider-tools` expose actuellement une famille partagée
    de schémas d’outils ainsi que des helpers partagés de schéma / compatibilité :

    - `ProviderToolCompatFamily` documente aujourd’hui l’inventaire des familles partagées.
    - `buildProviderToolCompatFamilyHooks("gemini")` câble le nettoyage de schéma
      Gemini + les diagnostics pour les fournisseurs qui ont besoin de schémas d’outils sûrs pour Gemini.
    - `normalizeGeminiToolSchemas(...)` et `inspectGeminiToolSchemas(...)`
      sont les helpers publics Gemini de schéma sous-jacents.
    - `resolveXaiModelCompatPatch()` renvoie le patch de compatibilité xAI fourni :
      `toolSchemaProfile: "xai"`, mots-clés de schéma non pris en charge, prise en charge native de
      `web_search` et décodage des arguments d’appel d’outil d’entité HTML.
    - `applyXaiModelCompat(model)` applique ce même patch de compatibilité xAI à un
      modèle résolu avant qu’il n’atteigne l’exécuteur.

    Exemple fourni réel : le Plugin xAI utilise `normalizeResolvedModel` plus
    `contributeResolvedModelCompat` pour que ces métadonnées de compatibilité restent détenues par le
    fournisseur au lieu de coder en dur les règles xAI dans le cœur.

    Le même modèle à racine de paquet prend aussi en charge d’autres fournisseurs fournis :

    - `@openclaw/openai-provider` : `api.ts` exporte des constructeurs de fournisseur,
      des helpers de modèle par défaut et des constructeurs de fournisseur realtime
    - `@openclaw/openrouter-provider` : `api.ts` exporte le constructeur de fournisseur
      ainsi que des helpers d’onboarding / config

    <Tabs>
      <Tab title="Échange de jetons">
        Pour les fournisseurs qui ont besoin d’un échange de jetons avant chaque appel d’inférence :

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
        Pour les fournisseurs qui ont besoin d’en-têtes ou métadonnées de requête/session natifs sur
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
        Pour les fournisseurs qui exposent des données d’usage / facturation :

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
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut de base URL |
      | 2 | `applyConfigDefaults` | Valeurs par défaut globales détenues par le fournisseur pendant la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d’identifiant de modèle hérités / preview avant la recherche |
      | 4 | `normalizeTransport` | Nettoyage `api` / `baseUrl` de famille de fournisseur avant l’assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité d’usage streamé natif pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution d’auth par marqueur d’env détenue par le fournisseur |
      | 8 | `resolveSyntheticAuth` | Auth synthétique locale / auto-hébergée ou adossée à la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abaisser les placeholders de profils stockés synthétiques derrière l’auth env / config |
      | 10 | `resolveDynamicModel` | Accepter des identifiants de modèle amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone de métadonnées avant résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant l’exécuteur |

    Remarques sur le repli runtime :

    - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres
      Plugins de fournisseur capables de hooks jusqu’à ce que l’un modifie réellement la configuration.
      Si aucun hook fournisseur ne réécrit une entrée de configuration prise en charge de la famille Google, le
      normaliseur de configuration Google fourni s’applique toujours.
    - `resolveConfigApiKey` utilise le hook fournisseur lorsqu’il est exposé. Le chemin
      fourni `amazon-bedrock` possède aussi ici un résolveur intégré par marqueur d’env AWS,
      même si l’auth runtime Bedrock elle-même continue d’utiliser la chaîne par défaut du SDK AWS.
      | 13 | `contributeResolvedModelCompat` | Indicateurs de compatibilité pour des modèles éditeur derrière un autre transport compatible |
      | 14 | `capabilities` | Sac de capacités statiques hérité ; compatibilité uniquement |
      | 15 | `normalizeToolSchemas` | Nettoyage de schéma d’outil détenu par le fournisseur avant enregistrement |
      | 16 | `inspectToolSchemas` | Diagnostics de schéma d’outil détenus par le fournisseur |
      | 17 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisée vs native |
      | 18 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 19 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 20 | `wrapStreamFn` | Wrappers d’en-têtes / corps personnalisés sur le chemin de stream normal |
      | 21 | `resolveTransportTurnState` | En-têtes / métadonnées natifs par tour |
      | 22 | `resolveWebSocketSessionPolicy` | En-têtes de session WS natifs / période de refroidissement |
      | 23 | `formatApiKey` | Forme de jeton runtime personnalisée |
      | 24 | `refreshOAuth` | Rafraîchissement OAuth personnalisé |
      | 25 | `buildAuthDoctorHint` | Indication de réparation d’auth |
      | 26 | `matchesContextOverflowError` | Détection de dépassement détenue par le fournisseur |
      | 27 | `classifyFailoverReason` | Classification détenue par le fournisseur des limitations de débit / surcharges |
      | 28 | `isCacheTtlEligible` | Contrôle TTL du cache de prompt |
      | 29 | `buildMissingAuthMessage` | Indication personnalisée d’auth manquante |
      | 30 | `suppressBuiltInModel` | Masquer des lignes amont obsolètes |
      | 31 | `augmentModelCatalog` | Lignes synthétiques de compatibilité avant |
      | 32 | `isBinaryThinking` | Réflexion binaire activée / désactivée |
      | 33 | `supportsXHighThinking` | Prise en charge du raisonnement `xhigh` |
      | 34 | `supportsAdaptiveThinking` | Prise en charge du raisonnement adaptatif |
      | 35 | `supportsMaxThinking` | Prise en charge du raisonnement `max` |
      | 36 | `resolveDefaultThinkingLevel` | Politique `/think` par défaut |
      | 37 | `isModernModelRef` | Correspondance de modèle live / smoke |
      | 38 | `prepareRuntimeAuth` | Échange de jetons avant l’inférence |
      | 39 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’usage |
      | 40 | `fetchUsageSnapshot` | Point de terminaison d’usage personnalisé |
      | 41 | `createEmbeddingProvider` | Adaptateur d’embeddings détenu par le fournisseur pour mémoire / recherche |
      | 42 | `buildReplayPolicy` | Politique personnalisée de replay / Compaction de transcription |
      | 43 | `sanitizeReplayHistory` | Réécritures spécifiques au fournisseur du replay après nettoyage générique |
      | 44 | `validateReplayTurns` | Validation stricte des tours de replay avant l’exécuteur embarqué |
      | 45 | `onModelSelected` | Callback post-sélection (par ex. télémétrie) |

      Remarque sur l’ajustement des prompts :

      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter une
        directive de prompt système sensible au cache pour une famille de modèles. Préférez-la à
        `before_prompt_build` lorsque le comportement appartient à une famille fournisseur / modèle
        et doit préserver la séparation stable / dynamique du cache.

      Pour des descriptions détaillées et des exemples réels, voir
      [Internes : Hooks runtime de fournisseur](/fr/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (optionnel)">
    <a id="step-5-add-extra-capabilities"></a>
    Un Plugin de fournisseur peut enregistrer la parole, la transcription realtime, la
    voix realtime, la compréhension des médias, la génération d’images, la génération de vidéos, la récupération web
    et la recherche web en plus de l’inférence de texte :

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

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

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Transcription Realtime Acme",
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
        label: "Voix Realtime Acme",
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
        describeImage: async (req) => ({ text: "Une photo de..." }),
        transcribeAudio: async (req) => ({ text: "Transcription..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Images Acme",
        generate: async (req) => ({ /* résultat d’image */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Vidéo Acme",
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
        hint: "Récupérer des pages via le backend de rendu d’Acme.",
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
          description: "Récupérer une page via Acme Fetch.",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Recherche Acme",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    OpenClaw classe cela comme un Plugin à **capacité hybride**. C’est le
    modèle recommandé pour les Plugins d’entreprise (un Plugin par éditeur). Voir
    [Internes : propriété des capacités](/fr/plugins/architecture#capability-ownership-model).

    Pour la génération de vidéos, préférez la forme de capacité sensible au mode montrée ci-dessus :
    `generate`, `imageToVideo` et `videoToVideo`. Les champs agrégés plats tels
    que `maxInputImages`, `maxInputVideos` et `maxDurationSeconds` ne
    suffisent pas à annoncer proprement la prise en charge des modes de transformation ou des modes désactivés.

    Les fournisseurs de génération musicale doivent suivre le même modèle :
    `generate` pour la génération à partir du seul prompt et `edit` pour la génération à partir d’une image de référence.
    Les champs agrégés plats tels que `maxInputImages`,
    `supportsLyrics` et `supportsFormat` ne suffisent pas à annoncer la prise en charge de l’édition ;
    des blocs explicites `generate` / `edit` constituent le contrat attendu.

  </Step>

  <Step title="Tester">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportez votre objet de configuration de fournisseur depuis index.ts ou un fichier dédié
    import { acmeProvider } from "./provider.js";

    describe("fournisseur acme-ai", () => {
      it("résout les modèles dynamiques", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("renvoie le catalogue lorsque la clé est disponible", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("renvoie un catalogue null lorsqu’il n’y a pas de clé", async () => {
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

Les Plugins de fournisseur se publient comme tout autre Plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’ancien alias de publication réservé aux skills ; les paquets de Plugin doivent utiliser
`clawhub package publish`.

## Structure des fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # métadonnées openclaw.providers
├── openclaw.plugin.json      # Manifeste avec métadonnées d’authentification fournisseur
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Point de terminaison d’usage (optionnel)
```

## Référence sur l’ordre du catalogue

`catalog.order` contrôle le moment où votre catalogue est fusionné par rapport aux
fournisseurs intégrés :

| Ordre     | Moment        | Cas d’usage                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs simples à clé API                |
| `profile` | Après simple  | Fournisseurs contrôlés par des profils d’auth   |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées             |
| `late`    | Dernier passage | Remplacer les fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — si votre Plugin fournit aussi un canal
- [Runtime SDK](/fr/plugins/sdk-runtime) — helpers `api.runtime` (TTS, recherche, sous-agent)
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Internes des Plugins](/fr/plugins/architecture#provider-runtime-hooks) — détails des hooks et exemples fournis
