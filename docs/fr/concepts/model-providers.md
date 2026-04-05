---
read_when:
    - Vous avez besoin d’une référence de configuration des modèles fournisseur par fournisseur
    - Vous voulez des exemples de configuration ou des commandes CLI d’onboarding pour les fournisseurs de modèles
summary: Vue d’ensemble des fournisseurs de modèles avec exemples de configuration + flux CLI
title: Fournisseurs de modèles
x-i18n:
    generated_at: "2026-04-05T12:41:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d8f56a2a5319de03f7b86e7b19b9a89e7023f757930b5b5949568f680352a3a
    source_path: concepts/model-providers.md
    workflow: 15
---

# Fournisseurs de modèles

Cette page couvre les **fournisseurs de LLM/modèles** (et non les canaux de chat comme WhatsApp/Telegram).
Pour les règles de sélection des modèles, voir [/concepts/models](/concepts/models).

## Règles rapides

- Les références de modèle utilisent `provider/model` (exemple : `opencode/claude-opus-4-6`).
- Si vous définissez `agents.defaults.models`, cela devient la liste d’autorisation.
- Assistants CLI : `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Les règles d’exécution de repli, les sondes de cooldown et la persistance des surcharges de session sont
  documentées dans [/concepts/model-failover](/concepts/model-failover).
- `models.providers.*.models[].contextWindow` correspond aux métadonnées natives du modèle ;
  `models.providers.*.models[].contextTokens` correspond au plafond effectif d’exécution.
- Les plugins de fournisseur peuvent injecter des catalogues de modèles via `registerProvider({ catalog })` ;
  OpenClaw fusionne cette sortie dans `models.providers` avant d’écrire
  `models.json`.
- Les manifests de fournisseur peuvent déclarer `providerAuthEnvVars` afin que les sondes génériques
  d’authentification par variables d’environnement n’aient pas besoin de charger le runtime du plugin. La carte restante
  des variables d’environnement cœur sert désormais uniquement aux fournisseurs cœur/non plugin et à quelques cas
  de priorité générique, comme l’onboarding Anthropic en priorité par clé API.
- Les plugins de fournisseur peuvent aussi posséder le comportement d’exécution du fournisseur via
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, et
  `onModelSelected`.
- Remarque : les `capabilities` du runtime fournisseur sont des métadonnées partagées d’exécuteur (famille de fournisseur, particularités de transcription/outillage, indications de transport/cache). Ce n’est pas
  la même chose que le [modèle de capacité public](/plugins/architecture#public-capability-model)
  qui décrit ce qu’un plugin enregistre (inférence de texte, parole, etc.).

## Comportement de fournisseur possédé par le plugin

Les plugins de fournisseur peuvent désormais posséder la majeure partie de la logique spécifique au fournisseur tandis qu’OpenClaw conserve
la boucle d’inférence générique.

Répartition typique :

- `auth[].run` / `auth[].runNonInteractive` : le fournisseur possède les flux d’onboarding/connexion
  pour `openclaw onboard`, `openclaw models auth` et la configuration sans interface
- `wizard.setup` / `wizard.modelPicker` : le fournisseur possède les libellés de choix d’authentification,
  les alias historiques, les indices de liste d’autorisation d’onboarding et les entrées de configuration dans les sélecteurs onboarding/modèles
- `catalog` : le fournisseur apparaît dans `models.providers`
- `normalizeModelId` : le fournisseur normalise les IDs de modèle historiques/preview avant
  la recherche ou la canonicalisation
- `normalizeTransport` : le fournisseur normalise `api` / `baseUrl` de la famille de transport
  avant l’assemblage générique du modèle ; OpenClaw vérifie d’abord le fournisseur correspondant,
  puis les autres plugins de fournisseur capables de hooks jusqu’à ce que l’un modifie réellement le
  transport
- `normalizeConfig` : le fournisseur normalise la configuration `models.providers.<id>` avant que
  l’exécution ne l’utilise ; OpenClaw vérifie d’abord le fournisseur correspondant, puis les autres
  plugins de fournisseur capables de hooks jusqu’à ce que l’un modifie réellement la configuration. Si aucun
  hook de fournisseur ne réécrit la configuration, les assistants intégrés de la famille Google
  normalisent toujours les entrées de fournisseur Google prises en charge.
- `applyNativeStreamingUsageCompat` : le fournisseur applique des réécritures de compatibilité d’usage streaming natives pilotées par point de terminaison pour les fournisseurs configurés
- `resolveConfigApiKey` : le fournisseur résout l’authentification par marqueur d’environnement pour les fournisseurs configurés
  sans forcer le chargement complet de l’authentification runtime. `amazon-bedrock` possède aussi un
  résolveur intégré de marqueur d’environnement AWS ici, même si l’authentification runtime Bedrock utilise
  la chaîne par défaut du SDK AWS.
- `resolveSyntheticAuth` : le fournisseur peut exposer la disponibilité d’une authentification locale/auto-hébergée ou autre
  basée sur la configuration sans persister de secrets en clair
- `shouldDeferSyntheticProfileAuth` : le fournisseur peut marquer les espaces réservés de profil synthétique stockés
  comme ayant une priorité inférieure à l’authentification basée sur env/config
- `resolveDynamicModel` : le fournisseur accepte des IDs de modèle pas encore présents dans le catalogue statique local
- `prepareDynamicModel` : le fournisseur a besoin d’un rafraîchissement des métadonnées avant de retenter la résolution dynamique
- `normalizeResolvedModel` : le fournisseur a besoin de réécritures de transport ou de base URL
- `contributeResolvedModelCompat` : le fournisseur apporte des indicateurs de compatibilité pour ses
  modèles fournisseur même lorsqu’ils arrivent via un autre transport compatible
- `capabilities` : le fournisseur publie les particularités transcription/outillage/famille de fournisseur
- `normalizeToolSchemas` : le fournisseur nettoie les schémas d’outils avant que l’exécuteur embarqué ne les voie
- `inspectToolSchemas` : le fournisseur expose les avertissements de schéma spécifiques au transport
  après normalisation
- `resolveReasoningOutputMode` : le fournisseur choisit les contrats de sortie de raisonnement natifs ou balisés
- `prepareExtraParams` : le fournisseur définit par défaut ou normalise les paramètres de requête par modèle
- `createStreamFn` : le fournisseur remplace le chemin de streaming normal par un transport entièrement personnalisé
- `wrapStreamFn` : le fournisseur applique des wrappers de compatibilité en-têtes/corps/modèle à la requête
- `resolveTransportTurnState` : le fournisseur fournit les en-têtes natifs par tour de transport
  ou des métadonnées
- `resolveWebSocketSessionPolicy` : le fournisseur fournit des en-têtes de session WebSocket natifs
  ou une politique de cooldown de session
- `createEmbeddingProvider` : le fournisseur possède le comportement d’embedding mémoire lorsqu’il
  a plus de sens dans le plugin fournisseur que dans le sélecteur d’embedding cœur
- `formatApiKey` : le fournisseur formate les profils d’authentification stockés en chaîne
  `apiKey` attendue par le transport
- `refreshOAuth` : le fournisseur possède le rafraîchissement OAuth lorsque les rafraîchisseurs partagés `pi-ai`
  ne suffisent pas
- `buildAuthDoctorHint` : le fournisseur ajoute des indications de réparation lorsque le rafraîchissement OAuth
  échoue
- `matchesContextOverflowError` : le fournisseur reconnaît des erreurs de dépassement de fenêtre de contexte
  spécifiques au fournisseur que les heuristiques génériques manqueraient
- `classifyFailoverReason` : le fournisseur mappe les erreurs brutes transport/API spécifiques au fournisseur
  vers des raisons de repli comme la limitation de débit ou la surcharge
- `isCacheTtlEligible` : le fournisseur décide quels IDs de modèle amont prennent en charge le TTL de cache de prompt
- `buildMissingAuthMessage` : le fournisseur remplace l’erreur générique du magasin d’authentification
  par une indication de récupération spécifique au fournisseur
- `suppressBuiltInModel` : le fournisseur masque les lignes amont obsolètes et peut renvoyer une
  erreur possédée par le fournisseur pour les échecs de résolution directe
- `augmentModelCatalog` : le fournisseur ajoute des lignes synthétiques/finales au catalogue après
  la découverte et la fusion de configuration
- `isBinaryThinking` : le fournisseur possède l’UX de réflexion binaire activée/désactivée
- `supportsXHighThinking` : le fournisseur active `xhigh` pour les modèles sélectionnés
- `resolveDefaultThinkingLevel` : le fournisseur possède la politique `/think` par défaut pour une
  famille de modèles
- `applyConfigDefaults` : le fournisseur applique des valeurs par défaut globales spécifiques au fournisseur
  lors de la matérialisation de la configuration selon le mode d’authentification, l’environnement ou la famille de modèles
- `isModernModelRef` : le fournisseur possède la correspondance de modèle préféré live/smoke
- `prepareRuntimeAuth` : le fournisseur transforme un identifiant configuré en jeton runtime de courte durée
- `resolveUsageAuth` : le fournisseur résout les identifiants d’usage/quota pour `/usage`
  et les surfaces liées d’état/rapport
- `fetchUsageSnapshot` : le fournisseur possède la récupération/l’analyse du point de terminaison d’usage tandis que
  le cœur conserve l’enveloppe de résumé et le formatage
- `onModelSelected` : le fournisseur exécute des effets secondaires après sélection, comme
  la télémétrie ou un suivi de session possédé par le fournisseur

Exemples intégrés actuels :

- `anthropic` : repli de compatibilité anticipée Claude 4.6, indications de réparation d’authentification, récupération du point
  de terminaison d’usage, métadonnées TTL de cache/famille de fournisseur, et valeurs par défaut globales
  de configuration tenant compte de l’authentification
- `amazon-bedrock` : correspondance des dépassements de contexte et classification
  des raisons de repli pour les erreurs Bedrock spécifiques de throttling/non-prêt, ainsi que
  la famille partagée `anthropic-by-model` pour les garde-fous de politique de relecture réservés à Claude
  sur le trafic Anthropic
- `anthropic-vertex` : garde-fous de politique de relecture réservés à Claude sur le trafic
  de messages Anthropic
- `openrouter` : IDs de modèle pass-through, wrappers de requête, indications de capacités fournisseur,
  assainissement des signatures de pensée Gemini sur le trafic Gemini proxy, injection de raisonnement proxy
  via la famille de flux `openrouter-thinking`, transfert des métadonnées de routage,
  et politique TTL de cache
- `github-copilot` : onboarding/device login, repli de compatibilité anticipée des modèles,
  indications de transcription Claude-thinking, échange de jeton runtime, et récupération du point
  de terminaison d’usage
- `openai` : repli de compatibilité anticipée GPT-5.4, normalisation directe du transport OpenAI,
  indications d’authentification manquante tenant compte de Codex, suppression de Spark, lignes de catalogue synthétiques
  OpenAI/Codex, politique de réflexion/modèle live, normalisation des alias de jetons d’usage
  (`input` / `output` et familles `prompt` / `completion`), famille de flux partagée
  `openai-responses-defaults` pour les wrappers natifs OpenAI/Codex,
  et métadonnées de famille de fournisseur
- `google` et `google-gemini-cli` : repli de compatibilité anticipée Gemini 3.1,
  validation native de relecture Gemini, assainissement de relecture bootstrap, mode de sortie de raisonnement
  balisé, et correspondance de modèle moderne ; l’OAuth Gemini CLI possède aussi
  le formatage du jeton de profil d’authentification, l’analyse du jeton d’usage et la récupération du point
  de terminaison de quota pour les surfaces d’usage
- `moonshot` : transport partagé, normalisation possédée par le plugin de la charge utile de réflexion
- `kilocode` : transport partagé, en-têtes de requête possédés par le plugin, normalisation de la charge utile de raisonnement,
  assainissement des signatures de pensée Gemini en proxy, et politique TTL de cache
- `zai` : repli de compatibilité anticipée GLM-5, valeurs par défaut `tool_stream`, politique TTL de
  cache, politique de réflexion binaire/modèle live, et authentification usage + récupération de quota ;
  les IDs inconnus `glm-5*` sont synthétisés à partir du modèle intégré `glm-4.7`
- `xai` : normalisation native du transport Responses, réécritures d’alias `/fast` pour
  les variantes Grok fast, `tool_stream` par défaut, et nettoyage spécifique à xAI des schémas d’outils /
  charges utiles de raisonnement
- `mistral` : métadonnées de capacités possédées par le plugin
- `opencode` et `opencode-go` : métadonnées de capacités possédées par le plugin ainsi qu’assainissement
  des signatures de pensée Gemini en proxy
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi`,
  `nvidia`, `qianfan`, `stepfun`, `synthetic`, `together`, `venice`,
  `vercel-ai-gateway` et `volcengine` : catalogues possédés par le plugin uniquement
- `qwen` : catalogues de texte possédés par le plugin ainsi qu’enregistrements partagés
  de fournisseur media-understanding et video-generation pour ses surfaces multimodales ;
  la génération vidéo Qwen utilise les points de terminaison vidéo DashScope Standard avec les modèles Wan intégrés
  comme `wan2.6-t2v` et `wan2.7-r2v`
- `minimax` : catalogues possédés par le plugin, sélection hybride de politique de relecture Anthropic/OpenAI,
  et logique d’authentification/instantané d’usage
- `xiaomi` : catalogues possédés par le plugin ainsi que logique d’authentification/instantané d’usage

Le plugin intégré `openai` possède désormais les deux IDs fournisseur : `openai` et
`openai-codex`.

Cela couvre les fournisseurs qui s’intègrent encore dans les transports normaux d’OpenClaw. Un fournisseur
qui nécessite un exécuteur de requête totalement personnalisé relève d’une surface d’extension
distincte et plus profonde.

## Rotation des clés API

- Prend en charge une rotation générique des fournisseurs pour certains fournisseurs.
- Configurez plusieurs clés via :
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (surcharge live unique, priorité la plus élevée)
  - `<PROVIDER>_API_KEYS` (liste séparée par virgules ou points-virgules)
  - `<PROVIDER>_API_KEY` (clé principale)
  - `<PROVIDER>_API_KEY_*` (liste numérotée, par ex. `<PROVIDER>_API_KEY_1`)
- Pour les fournisseurs Google, `GOOGLE_API_KEY` est aussi inclus comme repli.
- L’ordre de sélection des clés préserve la priorité et déduplique les valeurs.
- Les requêtes sont retentées avec la clé suivante uniquement en cas de réponses de limitation de débit (par
  exemple `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, ou des messages périodiques de limite d’usage).
- Les échecs hors limitation de débit échouent immédiatement ; aucune rotation de clé n’est tentée.
- Lorsque toutes les clés candidates échouent, l’erreur finale est renvoyée depuis la dernière tentative.

## Fournisseurs intégrés (catalogue pi-ai)

OpenClaw est livré avec le catalogue pi-ai. Ces fournisseurs ne nécessitent **aucune**
configuration `models.providers` ; définissez simplement l’authentification et choisissez un modèle.

### OpenAI

- Fournisseur : `openai`
- Authentification : `OPENAI_API_KEY`
- Rotation facultative : `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (surcharge unique)
- Exemples de modèles : `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI : `openclaw onboard --auth-choice openai-api-key`
- Le transport par défaut est `auto` (WebSocket d’abord, repli SSE)
- Surcharge par modèle via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- Le warm-up WebSocket OpenAI Responses est activé par défaut via `params.openaiWsWarmup` (`true`/`false`)
- Le traitement prioritaire OpenAI peut être activé via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` et `params.fastMode` mappent les requêtes directes `openai/*` Responses vers `service_tier=priority` sur `api.openai.com`
- Utilisez `params.serviceTier` lorsque vous voulez un niveau explicite au lieu du basculement partagé `/fast`
- Les en-têtes d’attribution OpenClaw cachés (`originator`, `version`,
  `User-Agent`) s’appliquent uniquement au trafic OpenAI natif vers `api.openai.com`, pas
  aux proxys génériques compatibles OpenAI
- Les routes OpenAI natives conservent aussi `store` de Responses, les indications de cache de prompt et
  la mise en forme de charge utile de compatibilité de raisonnement OpenAI ; ce n’est pas le cas des routes proxy
- `openai/gpt-5.3-codex-spark` est volontairement supprimé dans OpenClaw car l’API OpenAI live le rejette ; Spark est traité comme réservé à Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Fournisseur : `anthropic`
- Authentification : `ANTHROPIC_API_KEY`
- Rotation facultative : `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (surcharge unique)
- Exemple de modèle : `anthropic/claude-opus-4-6`
- CLI : `openclaw onboard --auth-choice apiKey` ou `openclaw onboard --auth-choice anthropic-cli`
- Les requêtes Anthropic publiques directes prennent en charge le basculement partagé `/fast` et `params.fastMode`, y compris le trafic authentifié par clé API et OAuth envoyé à `api.anthropic.com` ; OpenClaw mappe cela vers `service_tier` Anthropic (`auto` vs `standard_only`)
- Remarque de facturation : la documentation publique Claude Code d’Anthropic inclut toujours l’utilisation directe du terminal Claude Code dans les limites des offres Claude. Séparément, Anthropic a informé les utilisateurs OpenClaw le **4 avril 2026 à 12:00 PM PT / 8:00 PM BST** que le chemin de connexion Claude d’**OpenClaw** est compté comme une utilisation de harnais tiers et nécessite une **Extra Usage** facturée séparément de l’abonnement.
- Le setup-token Anthropic est de nouveau disponible comme chemin OpenClaw historique/manuel. Utilisez-le en gardant à l’esprit qu’Anthropic a indiqué aux utilisateurs OpenClaw que ce chemin nécessite **Extra Usage**.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Fournisseur : `openai-codex`
- Authentification : OAuth (ChatGPT)
- Exemple de modèle : `openai-codex/gpt-5.4`
- CLI : `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- Le transport par défaut est `auto` (WebSocket d’abord, repli SSE)
- Surcharge par modèle via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` est aussi transféré sur les requêtes Responses Codex natives (`chatgpt.com/backend-api`)
- Les en-têtes d’attribution OpenClaw cachés (`originator`, `version`,
  `User-Agent`) ne sont attachés qu’au trafic Codex natif vers
  `chatgpt.com/backend-api`, pas aux proxys génériques compatibles OpenAI
- Partage le même basculement `/fast` et la même configuration `params.fastMode` que `openai/*` direct ; OpenClaw mappe cela vers `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` reste disponible lorsque le catalogue OAuth Codex l’expose ; dépend des droits
- `openai-codex/gpt-5.4` conserve le `contextWindow = 1050000` natif et un `contextTokens = 272000` d’exécution par défaut ; surchargez le plafond runtime avec `models.providers.openai-codex.models[].contextTokens`
- Remarque de politique : l’OAuth OpenAI Codex est explicitement pris en charge pour les outils/workflows externes comme OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Autres options hébergées de style abonnement

- [Qwen Cloud](/providers/qwen) : surface fournisseur Qwen Cloud plus mappage des points de terminaison Alibaba DashScope et Coding Plan
- [MiniMax](/providers/minimax) : accès OAuth MiniMax Coding Plan ou par clé API
- [GLM Models](/providers/glm) : Z.AI Coding Plan ou points de terminaison API généraux

### OpenCode

- Authentification : `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Fournisseur runtime Zen : `opencode`
- Fournisseur runtime Go : `opencode-go`
- Exemples de modèles : `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI : `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (clé API)

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY`
- Rotation facultative : `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, repli `GOOGLE_API_KEY`, et `OPENCLAW_LIVE_GEMINI_KEY` (surcharge unique)
- Exemples de modèles : `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilité : l’ancienne configuration OpenClaw utilisant `google/gemini-3.1-flash-preview` est normalisée en `google/gemini-3-flash-preview`
- CLI : `openclaw onboard --auth-choice gemini-api-key`
- Les exécutions Gemini directes acceptent aussi `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou l’ancien `cached_content`) pour transférer un handle
  `cachedContents/...` natif au fournisseur ; les hits de cache Gemini remontent comme `cacheRead` OpenClaw

### Google Vertex et Gemini CLI

- Fournisseurs : `google-vertex`, `google-gemini-cli`
- Authentification : Vertex utilise gcloud ADC ; Gemini CLI utilise son propre flux OAuth
- Attention : l’OAuth Gemini CLI dans OpenClaw est une intégration non officielle. Certains utilisateurs ont signalé des restrictions de compte Google après utilisation de clients tiers. Consultez les conditions Google et utilisez un compte non critique si vous choisissez de continuer.
- L’OAuth Gemini CLI est fourni dans le plugin `google` intégré.
  - Installez d’abord Gemini CLI :
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Activer : `openclaw plugins enable google`
  - Connexion : `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modèle par défaut : `google-gemini-cli/gemini-3.1-pro-preview`
  - Remarque : vous ne collez **pas** d’identifiant client ni de secret dans `openclaw.json`. Le flux de connexion CLI stocke
    les jetons dans les profils d’authentification sur l’hôte gateway.
  - Si les requêtes échouent après connexion, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte gateway.
  - Les réponses JSON Gemini CLI sont analysées depuis `response` ; l’usage se replie sur
    `stats`, avec `stats.cached` normalisé en `cacheRead` OpenClaw.

### Z.AI (GLM)

- Fournisseur : `zai`
- Authentification : `ZAI_API_KEY`
- Exemple de modèle : `zai/glm-5`
- CLI : `openclaw onboard --auth-choice zai-api-key`
  - Alias : `z.ai/*` et `z-ai/*` sont normalisés en `zai/*`
  - `zai-api-key` détecte automatiquement le point de terminaison Z.AI correspondant ; `zai-coding-global`, `zai-coding-cn`, `zai-global` et `zai-cn` forcent une surface spécifique

### Vercel AI Gateway

- Fournisseur : `vercel-ai-gateway`
- Authentification : `AI_GATEWAY_API_KEY`
- Exemple de modèle : `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI : `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Fournisseur : `kilocode`
- Authentification : `KILOCODE_API_KEY`
- Exemple de modèle : `kilocode/kilo/auto`
- CLI : `openclaw onboard --auth-choice kilocode-api-key`
- Base URL : `https://api.kilo.ai/api/gateway/`
- Le catalogue statique de repli fournit `kilocode/kilo/auto` ; la découverte live
  `https://api.kilo.ai/api/gateway/models` peut étendre davantage le catalogue
  runtime.
- Le routage amont exact derrière `kilocode/kilo/auto` appartient à Kilo Gateway,
  il n’est pas codé en dur dans OpenClaw.

Voir [/providers/kilocode](/providers/kilocode) pour les détails de configuration.

### Autres plugins de fournisseur intégrés

- OpenRouter : `openrouter` (`OPENROUTER_API_KEY`)
- Exemple de modèle : `openrouter/auto`
- OpenClaw applique les en-têtes d’attribution d’application documentés par OpenRouter uniquement lorsque
  la requête cible réellement `openrouter.ai`
- Les marqueurs Anthropic `cache_control` spécifiques à OpenRouter sont également limités aux routes OpenRouter vérifiées, pas aux URL proxy arbitraires
- OpenRouter reste sur le chemin de type proxy compatible OpenAI, donc la mise en forme de requête réservée à OpenAI native (`serviceTier`, `store` de Responses,
  indications de cache de prompt, charges utiles de compatibilité de raisonnement OpenAI) n’est pas transférée
- Les références OpenRouter basées sur Gemini conservent uniquement l’assainissement des signatures de pensée Gemini en proxy ;
  la validation native de relecture Gemini et les réécritures bootstrap restent désactivées
- Kilo Gateway : `kilocode` (`KILOCODE_API_KEY`)
- Exemple de modèle : `kilocode/kilo/auto`
- Les références Kilo basées sur Gemini conservent le même chemin d’assainissement
  des signatures de pensée Gemini en proxy ; `kilocode/kilo/auto` et les autres indices
  de raisonnement proxy non pris en charge ignorent l’injection de raisonnement proxy
- MiniMax : `minimax` (clé API) et `minimax-portal` (OAuth)
- Authentification : `MINIMAX_API_KEY` pour `minimax` ; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` pour `minimax-portal`
- Exemple de modèle : `minimax/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7`
- L’onboarding/la configuration par clé API MiniMax écrit des définitions explicites du modèle M2.7 avec
  `input: ["text", "image"]` ; le catalogue intégré du fournisseur garde les références de chat
  en texte seul jusqu’à la matérialisation de cette configuration fournisseur
- Moonshot : `moonshot` (`MOONSHOT_API_KEY`)
- Exemple de modèle : `moonshot/kimi-k2.5`
- Kimi Coding : `kimi` (`KIMI_API_KEY` ou `KIMICODE_API_KEY`)
- Exemple de modèle : `kimi/kimi-code`
- Qianfan : `qianfan` (`QIANFAN_API_KEY`)
- Exemple de modèle : `qianfan/deepseek-v3.2`
- Qwen Cloud : `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` ou `DASHSCOPE_API_KEY`)
- Exemple de modèle : `qwen/qwen3.5-plus`
- NVIDIA : `nvidia` (`NVIDIA_API_KEY`)
- Exemple de modèle : `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun : `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Exemples de modèles : `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together : `together` (`TOGETHER_API_KEY`)
- Exemple de modèle : `together/moonshotai/Kimi-K2.5`
- Venice : `venice` (`VENICE_API_KEY`)
- Xiaomi : `xiaomi` (`XIAOMI_API_KEY`)
- Exemple de modèle : `xiaomi/mimo-v2-flash`
- Vercel AI Gateway : `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference : `huggingface` (`HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`)
- Cloudflare AI Gateway : `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine : `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Exemple de modèle : `volcengine-plan/ark-code-latest`
- BytePlus : `byteplus` (`BYTEPLUS_API_KEY`)
- Exemple de modèle : `byteplus-plan/ark-code-latest`
- xAI : `xai` (`XAI_API_KEY`)
  - Les requêtes xAI natives intégrées utilisent le chemin xAI Responses
  - `/fast` ou `params.fastMode: true` réécrit `grok-3`, `grok-3-mini`,
    `grok-4` et `grok-4-0709` vers leurs variantes `*-fast`
  - `tool_stream` est activé par défaut ; définissez
    `agents.defaults.models["xai/<model>"].params.tool_stream` sur `false` pour
    le désactiver
- Mistral : `mistral` (`MISTRAL_API_KEY`)
- Exemple de modèle : `mistral/mistral-large-latest`
- CLI : `openclaw onboard --auth-choice mistral-api-key`
- Groq : `groq` (`GROQ_API_KEY`)
- Cerebras : `cerebras` (`CEREBRAS_API_KEY`)
  - Les modèles GLM sur Cerebras utilisent les IDs `zai-glm-4.7` et `zai-glm-4.6`.
  - Base URL compatible OpenAI : `https://api.cerebras.ai/v1`.
- GitHub Copilot : `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Exemple de modèle Hugging Face Inference : `huggingface/deepseek-ai/DeepSeek-R1` ; CLI : `openclaw onboard --auth-choice huggingface-api-key`. Voir [Hugging Face (Inference)](/providers/huggingface).

## Fournisseurs via `models.providers` (personnalisé/base URL)

Utilisez `models.providers` (ou `models.json`) pour ajouter des **fournisseurs personnalisés** ou des proxys
compatibles OpenAI/Anthropic.

Beaucoup des plugins de fournisseur intégrés ci-dessous publient déjà un catalogue par défaut.
Utilisez des entrées explicites `models.providers.<id>` uniquement lorsque vous voulez surcharger la
base URL, les en-têtes ou la liste de modèles par défaut.

### Moonshot AI (Kimi)

Moonshot est fourni comme plugin de fournisseur intégré. Utilisez le fournisseur intégré par
défaut, et ajoutez une entrée explicite `models.providers.moonshot` uniquement lorsque vous
devez surcharger la base URL ou les métadonnées de modèle :

- Fournisseur : `moonshot`
- Authentification : `MOONSHOT_API_KEY`
- Exemple de modèle : `moonshot/kimi-k2.5`
- CLI : `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modèle Kimi K2 :

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding utilise le point de terminaison compatible Anthropic de Moonshot AI :

- Fournisseur : `kimi`
- Authentification : `KIMI_API_KEY`
- Exemple de modèle : `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

L’ancien `kimi/k2p5` reste accepté comme ID de modèle de compatibilité.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) donne accès à Doubao et à d’autres modèles en Chine.

- Fournisseur : `volcengine` (coding : `volcengine-plan`)
- Authentification : `VOLCANO_ENGINE_API_KEY`
- Exemple de modèle : `volcengine-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

L’onboarding utilise par défaut la surface coding, mais le catalogue général `volcengine/*`
est enregistré en même temps.

Dans les sélecteurs onboarding/configuration de modèles, le choix d’authentification Volcengine privilégie à la fois
les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas encore chargés,
OpenClaw se replie sur le catalogue non filtré au lieu d’afficher un sélecteur vide limité au fournisseur.

Modèles disponibles :

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modèles coding (`volcengine-plan`) :

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (International)

BytePlus ARK donne accès aux mêmes modèles que Volcano Engine pour les utilisateurs internationaux.

- Fournisseur : `byteplus` (coding : `byteplus-plan`)
- Authentification : `BYTEPLUS_API_KEY`
- Exemple de modèle : `byteplus-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

L’onboarding utilise par défaut la surface coding, mais le catalogue général `byteplus/*`
est enregistré en même temps.

Dans les sélecteurs onboarding/configuration de modèles, le choix d’authentification BytePlus privilégie à la fois
les lignes `byteplus/*` et `byteplus-plan/*`. Si ces modèles ne sont pas encore chargés,
OpenClaw se replie sur le catalogue non filtré au lieu d’afficher un sélecteur vide limité au fournisseur.

Modèles disponibles :

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modèles coding (`byteplus-plan`) :

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic fournit des modèles compatibles Anthropic derrière le fournisseur `synthetic` :

- Fournisseur : `synthetic`
- Authentification : `SYNTHETIC_API_KEY`
- Exemple de modèle : `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI : `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax se configure via `models.providers` car il utilise des points de terminaison personnalisés :

- OAuth MiniMax (Global) : `--auth-choice minimax-global-oauth`
- OAuth MiniMax (CN) : `--auth-choice minimax-cn-oauth`
- Clé API MiniMax (Global) : `--auth-choice minimax-global-api`
- Clé API MiniMax (CN) : `--auth-choice minimax-cn-api`
- Authentification : `MINIMAX_API_KEY` pour `minimax` ; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` pour `minimax-portal`

Voir [/providers/minimax](/providers/minimax) pour les détails de configuration, les options de modèle et les extraits de configuration.

Sur le chemin de streaming compatible Anthropic de MiniMax, OpenClaw désactive la réflexion par
défaut sauf si vous la définissez explicitement, et `/fast on` réécrit
`MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.

Répartition des capacités possédées par le plugin :

- Les valeurs par défaut texte/chat restent sur `minimax/MiniMax-M2.7`
- La génération d’image est `minimax/image-01` ou `minimax-portal/image-01`
- La compréhension d’image est `MiniMax-VL-01`, possédée par le plugin sur les deux chemins d’authentification MiniMax
- La recherche web reste sur l’ID fournisseur `minimax`

### Ollama

Ollama est fourni comme plugin de fournisseur intégré et utilise l’API native d’Ollama :

- Fournisseur : `ollama`
- Authentification : aucune requise (serveur local)
- Exemple de modèle : `ollama/llama3.3`
- Installation : [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama est détecté localement à `http://127.0.0.1:11434` lorsque vous l’activez via
`OLLAMA_API_KEY`, et le plugin de fournisseur intégré ajoute directement Ollama à
`openclaw onboard` et au sélecteur de modèles. Voir [/providers/ollama](/providers/ollama)
pour l’onboarding, le mode cloud/local et la configuration personnalisée.

### vLLM

vLLM est fourni comme plugin de fournisseur intégré pour les serveurs locaux/auto-hébergés
compatibles OpenAI :

- Fournisseur : `vllm`
- Authentification : facultative (dépend de votre serveur)
- Base URL par défaut : `http://127.0.0.1:8000/v1`

Pour activer l’auto-découverte locale (n’importe quelle valeur fonctionne si votre serveur n’impose pas d’authentification) :

```bash
export VLLM_API_KEY="vllm-local"
```

Ensuite, définissez un modèle (remplacez par l’un des IDs renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Voir [/providers/vllm](/providers/vllm) pour les détails.

### SGLang

SGLang est fourni comme plugin de fournisseur intégré pour les serveurs rapides auto-hébergés
compatibles OpenAI :

- Fournisseur : `sglang`
- Authentification : facultative (dépend de votre serveur)
- Base URL par défaut : `http://127.0.0.1:30000/v1`

Pour activer l’auto-découverte locale (n’importe quelle valeur fonctionne si votre serveur n’impose pas
d’authentification) :

```bash
export SGLANG_API_KEY="sglang-local"
```

Ensuite, définissez un modèle (remplacez par l’un des IDs renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Voir [/providers/sglang](/providers/sglang) pour les détails.

### Proxys locaux (LM Studio, vLLM, LiteLLM, etc.)

Exemple (compatible OpenAI) :

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Remarques :

- Pour les fournisseurs personnalisés, `reasoning`, `input`, `cost`, `contextWindow` et `maxTokens` sont facultatifs.
  Lorsqu’ils sont omis, OpenClaw utilise par défaut :
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recommandé : définissez des valeurs explicites correspondant aux limites de votre proxy/modèle.
- Pour `api: "openai-completions"` sur des points de terminaison non natifs (toute `baseUrl` non vide dont l’hôte n’est pas `api.openai.com`), OpenClaw force `compat.supportsDeveloperRole: false` afin d’éviter les erreurs 400 du fournisseur sur les rôles `developer` non pris en charge.
- Les routes de type proxy compatibles OpenAI ignorent également la mise en forme de requête réservée à OpenAI native :
  pas de `service_tier`, pas de `store` de Responses, pas d’indications de cache de prompt, pas de mise en forme de charge utile de compatibilité de raisonnement OpenAI, ni d’en-têtes d’attribution OpenClaw cachés.
- Si `baseUrl` est vide/omise, OpenClaw conserve le comportement OpenAI par défaut (qui se résout vers `api.openai.com`).
- Par sécurité, une valeur explicite `compat.supportsDeveloperRole: true` est quand même surchargée sur les points de terminaison `openai-completions` non natifs.

## Exemples CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Voir aussi : [/gateway/configuration](/gateway/configuration) pour les exemples complets de configuration.

## Voir aussi

- [Models](/concepts/models) — configuration des modèles et alias
- [Model Failover](/concepts/model-failover) — chaînes de repli et comportement de nouvelle tentative
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — clés de configuration des modèles
- [Providers](/providers) — guides de configuration par fournisseur
