---
read_when:
    - implémentation de hooks d’exécution de fournisseur, de cycle de vie de canal ou de packs de package
    - débogage de l’ordre de chargement des plugins ou de l’état du registre
    - ajout d’une nouvelle capacité de plugin ou d’un plugin de moteur de contexte
summary: 'internes de l’architecture des plugins : pipeline de chargement, registre, hooks d’exécution, routes HTTP et tableaux de référence'
title: internes de l’architecture des plugins
x-i18n:
    generated_at: "2026-04-24T07:21:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6a99b7be56b7042a0e58a8119066ccfcb898279e6d6668f2aaa7351b188b88e
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Pour le modèle de capacité public, les formes de plugin et les contrats de propriété/exécution,
voir [Architecture des plugins](/fr/plugins/architecture). Cette page est la
référence pour la mécanique interne : pipeline de chargement, registre, hooks d’exécution,
routes HTTP Gateway, chemins d’importation et tableaux de schéma.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvre les racines candidates de plugin
2. lit les manifestes natifs ou de bundles compatibles et les métadonnées de package
3. rejette les candidats non sûrs
4. normalise la configuration de plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation pour chaque candidat
6. charge les modules natifs activés : les modules intégrés compilés utilisent un chargeur natif ;
   les plugins natifs non compilés utilisent jiti
7. appelle les hooks natifs `register(api)` et collecte les enregistrements dans le registre de plugins
8. expose le registre aux surfaces de commandes/runtime

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même moment. Tous les plugins intégrés utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les barrières de sécurité se produisent **avant** l’exécution runtime. Les candidats sont bloqués
lorsque le point d’entrée s’échappe de la racine du plugin, que le chemin est modifiable par tous, ou que
la propriété du chemin paraît suspecte pour les plugins non intégrés.

### Comportement manifest-first

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schémas de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les labels/espaces réservés du Control UI
- afficher les métadonnées d’installation/catalogue
- conserver des descripteurs d’activation et de configuration peu coûteux sans charger le runtime du plugin

Pour les plugins natifs, le module runtime est la partie plan de données. Il enregistre
le comportement réel tel que hooks, outils, commandes ou flux fournisseur.

Les blocs de manifeste facultatifs `activation` et `setup` restent dans le plan de contrôle.
Ce sont des descripteurs de métadonnées uniquement pour la planification d’activation et la découverte de configuration ;
ils ne remplacent ni l’enregistrement runtime, ni `register(...)`, ni `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent maintenant les indications de manifeste sur les commandes, canaux et fournisseurs
pour restreindre le chargement des plugins avant une matérialisation plus large du registre :

- le chargement CLI se limite aux plugins qui possèdent la commande principale demandée
- la résolution configuration de canal/plugin se limite aux plugins qui possèdent l’id
  de canal demandé
- la résolution explicite configuration/runtime de fournisseur se limite aux plugins qui possèdent l’
  id de fournisseur demandé

Le planificateur d’activation expose à la fois une API ids-only pour les appelants existants et une
API de plan pour les nouveaux diagnostics. Les entrées de plan indiquent pourquoi un plugin a été sélectionné,
en séparant les indications explicites du planificateur `activation.*` du repli de propriété du manifeste
comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks. Cette séparation des raisons est la frontière de compatibilité :
les métadonnées de plugin existantes continuent de fonctionner, tandis que le nouveau code peut détecter des indices larges
ou un comportement de repli sans modifier la sémantique du chargement runtime.

La découverte de configuration préfère maintenant les ids possédés par les descripteurs tels que `setup.providers` et
`setup.cliBackends` pour restreindre les plugins candidats avant de revenir à
`setup-api` pour les plugins qui ont encore besoin de hooks runtime au moment de la configuration. Si plus d’un plugin découvert revendique le même id normalisé de fournisseur de configuration ou de backend CLI, la recherche de configuration refuse le propriétaire ambigu au lieu de s’appuyer sur l’ordre de découverte.

### Ce que le chargeur met en cache

OpenClaw conserve des caches courts en processus pour :

- les résultats de découverte
- les données du registre de manifestes
- les registres de plugins chargés

Ces caches réduisent les surcharges au démarrage et lors des commandes répétées. Il est correct
de les considérer comme des caches de performance de courte durée, pas comme de la persistance.

Remarque de performance :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne modifient pas directement des globaux arbitraires du cœur. Ils s’enregistrent dans un
registre central de plugins.

Le registre suit :

- les enregistrements de plugin (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC Gateway
- les routes HTTP
- les enregistreurs CLI
- les services d’arrière-plan
- les commandes possédées par le plugin

Les fonctionnalités du cœur lisent ensuite depuis ce registre au lieu de parler directement aux modules de plugin.
Cela maintient un chargement à sens unique :

- module de plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur
n’ont besoin que d’un seul point d’intégration : « lire le registre », et non « traiter spécialement chaque module de plugin ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une requête de liaison
a été approuvée ou refusée :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du callback :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les requêtes approuvées
- `request` : le résumé de la requête d’origine, l’indication de détachement, l’id de l’expéditeur et
  les métadonnées de conversation

Ce callback est uniquement une notification. Il ne modifie pas qui est autorisé à lier une
conversation, et il s’exécute une fois la gestion d’approbation du cœur terminée.

## Hooks runtime du fournisseur

Les plugins de fournisseur ont trois couches :

- **Métadonnées de manifeste** pour une recherche peu coûteuse avant le runtime : `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (anciennement `discovery`) plus
  `applyConfigDefaults`.
- **Hooks runtime** : plus de 40 hooks facultatifs couvrant l’authentification, la résolution de modèle,
  l’enveloppement de flux, les niveaux de réflexion, la politique de relecture et les points d’extrémité d’usage. Voir
  la liste complète sous [Ordre des hooks et utilisation](#hook-order-and-usage).

OpenClaw conserve toujours la boucle d’agent générique, le repli, la gestion des transcriptions et la
politique d’outils. Ces hooks constituent la surface d’extension pour un comportement spécifique au fournisseur sans nécessiter tout un transport d’inférence personnalisé.

Utilisez le manifeste `providerAuthEnvVars` lorsque le fournisseur possède des identifiants basés sur l’environnement que les chemins génériques auth/status/model-picker doivent voir sans charger le runtime du plugin. Utilisez le manifeste `providerAuthAliases` lorsqu’un id de fournisseur doit réutiliser les variables d’environnement, profils d’authentification, authentification adossée à la configuration et choix d’intégration par clé API d’un autre fournisseur. Utilisez le manifeste `providerAuthChoices` lorsque les surfaces CLI d’intégration/choix d’authentification doivent connaître l’id de choix du fournisseur, les labels de groupe et un câblage simple d’authentification à un seul indicateur sans charger le runtime du fournisseur. Conservez les `envVars` du runtime du fournisseur pour les indications destinées aux opérateurs comme les labels d’intégration ou les variables de configuration OAuth client-id/client-secret.

Utilisez le manifeste `channelEnvVars` lorsqu’un canal possède une authentification ou une configuration pilotée par l’environnement que le repli générique shell-env, les contrôles config/status ou les invites de configuration doivent voir sans charger le runtime du canal.

### Ordre des hooks et utilisation

Pour les plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide rapide de décision.

| #   | Hook                              | Ce qu’il fait                                                                                                  | Quand l’utiliser                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du fournisseur dans `models.providers` pendant la génération de `models.json`         | Le fournisseur possède un catalogue ou des valeurs par défaut d’URL de base                                                                   |
| 2   | `applyConfigDefaults`             | Applique les valeurs par défaut globales possédées par le fournisseur pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du fournisseur |
| --  | _(recherche intégrée de modèle)_  | OpenClaw essaie d’abord le chemin normal registre/catalogue                                                    | _(pas un hook de plugin)_                                                                                                                     |
| 3   | `normalizeModelId`                | Normalise les alias hérités ou de préversion de model-id avant la recherche                                    | Le fournisseur gère le nettoyage des alias avant la résolution canonique du modèle                                                            |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle              | Le fournisseur possède le nettoyage du transport pour des ids de fournisseur personnalisés dans la même famille de transport                  |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution runtime/fournisseur                                      | Le fournisseur a besoin d’un nettoyage de configuration qui doit vivre avec le plugin ; les helpers intégrés de la famille Google renforcent aussi les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique des réécritures de compatibilité d’usage du streaming natif aux fournisseurs de configuration         | Le fournisseur a besoin de correctifs de métadonnées d’usage du streaming natif pilotés par le point de terminaison                         |
| 7   | `resolveConfigApiKey`             | Résout l’authentification par marqueur d’environnement pour les fournisseurs de configuration avant le chargement de l’authentification runtime | Le fournisseur possède une résolution de clé API par marqueur d’environnement ; `amazon-bedrock` a aussi ici un résolveur intégré de marqueurs AWS |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/auto-hébergée ou adossée à la configuration sans persister le texte brut   | Le fournisseur peut fonctionner avec un marqueur d’identifiant synthétique/local                                                              |
| 9   | `resolveExternalAuthProfiles`     | Superpose des profils d’authentification externes possédés par le fournisseur ; `persistence` par défaut vaut `runtime-only` pour les identifiants possédés par la CLI/l’app | Le fournisseur réutilise des identifiants d’authentification externes sans persister les jetons de rafraîchissement copiés ; déclarez `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Relègue les espaces réservés de profils synthétiques stockés derrière l’authentification adossée à env/config | Le fournisseur stocke des profils synthétiques d’espace réservé qui ne doivent pas gagner en priorité                                        |
| 11  | `resolveDynamicModel`             | Repli synchrone pour les ids de modèle possédés par le fournisseur qui ne sont pas encore dans le registre local | Le fournisseur accepte des ids de modèle amont arbitraires                                                                                   |
| 12  | `prepareDynamicModel`             | Préparation asynchrone, puis `resolveDynamicModel` s’exécute de nouveau                                        | Le fournisseur a besoin de métadonnées réseau avant de résoudre des ids inconnus                                                             |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le runner intégré n’utilise le modèle résolu                                       | Le fournisseur a besoin de réécritures de transport tout en utilisant un transport du cœur                                                   |
| 14  | `contributeResolvedModelCompat`   | Contribue des indicateurs de compatibilité pour des modèles fournisseurs derrière un autre transport compatible | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                               |
| 15  | `capabilities`                    | Métadonnées de transcription/outillage possédées par le fournisseur et utilisées par la logique partagée du cœur | Le fournisseur a besoin de particularités de transcription/famille de fournisseur                                                            |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d’outils avant que le runner intégré ne les voie                                          | Le fournisseur a besoin d’un nettoyage de schéma propre à la famille de transport                                                             |
| 17  | `inspectToolSchemas`              | Expose des diagnostics de schéma possédés par le fournisseur après normalisation                               | Le fournisseur veut des avertissements sur les mots-clés sans enseigner au cœur des règles propres au fournisseur                           |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif vs balisé                                               | Le fournisseur a besoin d’une sortie de raisonnement/finale balisée au lieu de champs natifs                                                |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                        | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres propre au fournisseur                           |
| 20  | `createStreamFn`                  | Remplace entièrement le chemin normal de flux par un transport personnalisé                                    | Le fournisseur a besoin d’un protocole filaire personnalisé, pas seulement d’un wrapper                                                     |
| 21  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                      | Le fournisseur a besoin de wrappers de compatibilité requête/en-têtes/corps/modèle sans transport personnalisé                             |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées de transport natifs par tour                                               | Le fournisseur veut que les transports génériques envoient une identité de tour native au fournisseur                                       |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de cooldown de session                                  | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                             |
| 24  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne runtime `apiKey`                  | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton runtime personnalisée            |
| 25  | `refreshOAuth`                    | Redéfinition de rafraîchissement OAuth pour des points de terminaison de rafraîchissement personnalisés ou une politique d’échec de rafraîchissement | Le fournisseur ne correspond pas aux mécanismes de rafraîchissement partagés `pi-ai`                                                     |
| 26  | `buildAuthDoctorHint`             | Indication de réparation ajoutée lorsque le rafraîchissement OAuth échoue                                      | Le fournisseur a besoin d’indications de réparation d’authentification possédées par le fournisseur après échec de rafraîchissement       |
| 27  | `matchesContextOverflowError`     | Détecteur de dépassement de fenêtre de contexte possédé par le fournisseur                                     | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                             |
| 28  | `classifyFailoverReason`          | Classification du motif de repli possédée par le fournisseur                                                   | Le fournisseur peut mapper des erreurs brutes d’API/transport vers rate-limit/surcharge/etc.                                               |
| 29  | `isCacheTtlEligible`              | Politique de TTL du cache de prompt pour les fournisseurs proxy/backhaul                                       | Le fournisseur a besoin d’un filtrage de TTL du cache propre au proxy                                                                       |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’authentification manquante                                 | Le fournisseur a besoin d’une indication de récupération spécifique au fournisseur en cas d’authentification manquante                     |
| 31  | `suppressBuiltInModel`            | Suppression de modèles amont obsolètes avec indication d’erreur facultative côté utilisateur                   | Le fournisseur doit masquer des lignes amont obsolètes ou les remplacer par une indication fournisseur                                      |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                          | Le fournisseur a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                               |
| 33  | `resolveThinkingProfile`          | Ensemble de niveaux `/think` spécifiques au modèle, labels d’affichage et valeur par défaut                   | Le fournisseur expose une échelle de réflexion personnalisée ou un label binaire pour des modèles sélectionnés                            |
| 34  | `isBinaryThinking`                | Hook de compatibilité pour bascule de raisonnement on/off                                                      | Le fournisseur n’expose qu’un raisonnement binaire activé/désactivé                                                                         |
| 35  | `supportsXHighThinking`           | Hook de compatibilité pour la prise en charge du raisonnement `xhigh`                                          | Le fournisseur veut `xhigh` seulement sur un sous-ensemble de modèles                                                                       |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilité pour le niveau `/think` par défaut                                                       | Le fournisseur possède la politique par défaut `/think` pour une famille de modèles                                                         |
| 37  | `isModernModelRef`                | Correspondance de modèle moderne pour les filtres de profil live et la sélection smoke                         | Le fournisseur possède la logique de correspondance des modèles préférés live/smoke                                                          |
| 38  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre la véritable clé/jeton runtime juste avant l’inférence                | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête de courte durée                                                 |
| 39  | `resolveUsageAuth`                | Résout les identifiants d’usage/facturation pour `/usage` et les surfaces d’état associées                    | Le fournisseur a besoin d’une analyse personnalisée du jeton d’usage/quota ou d’un identifiant d’usage différent                            |
| 40  | `fetchUsageSnapshot`              | Récupère et normalise des instantanés d’usage/quota spécifiques au fournisseur après résolution de l’authentification | Le fournisseur a besoin d’un point de terminaison d’usage spécifique au fournisseur ou d’un parseur de charge utile                        |
| 41  | `createEmbeddingProvider`         | Construit un adaptateur d’embeddings possédé par le fournisseur pour la mémoire/recherche                     | Le comportement des embeddings de mémoire doit vivre avec le plugin fournisseur                                                               |
| 42  | `buildReplayPolicy`               | Renvoie une politique de relecture contrôlant la gestion des transcriptions pour le fournisseur               | Le fournisseur a besoin d’une politique personnalisée de transcription (par exemple, suppression de blocs de réflexion)                      |
| 43  | `sanitizeReplayHistory`           | Réécrit l’historique de relecture après le nettoyage générique des transcriptions                              | Le fournisseur a besoin de réécritures de relecture spécifiques au fournisseur au-delà des helpers partagés de Compaction                   |
| 44  | `validateReplayTurns`             | Validation ou remise en forme finale des tours de relecture avant le runner intégré                           | Le transport du fournisseur a besoin d’une validation plus stricte des tours après l’assainissement générique                                |
| 45  | `onModelSelected`                 | Exécute des effets de bord après sélection possédés par le fournisseur                                        | Le fournisseur a besoin de télémétrie ou d’état possédé par le fournisseur lorsqu’un modèle devient actif                                   |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin de fournisseur correspondant, puis parcourent les autres plugins de fournisseur capables de hooks
jusqu’à ce que l’un modifie réellement l’id du modèle ou le transport/la configuration. Cela permet aux
shims d’alias/compatibilité de fournisseur de fonctionner sans obliger l’appelant à savoir quel
plugin intégré possède la réécriture. Si aucun hook de fournisseur ne réécrit une entrée de configuration
prise en charge de la famille Google, le normaliseur de configuration Google intégré applique quand même
ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire totalement personnalisé ou d’un exécuteur de requête personnalisé,
cela relève d’une autre classe d’extension. Ces hooks concernent un comportement de fournisseur
qui s’exécute toujours dans la boucle d’inférence normale d’OpenClaw.

### Exemple de fournisseur

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Exemples intégrés

Les plugins de fournisseur intégrés combinent les hooks ci-dessus pour s’adapter au catalogue,
à l’authentification, à la réflexion, à la relecture et aux besoins d’usage de chaque fournisseur. L’ensemble
de hooks faisant autorité vit avec chaque plugin sous `extensions/` ; cette page illustre les formes
plutôt que de recopier la liste.

<AccordionGroup>
  <Accordion title="Fournisseurs de catalogue pass-through">
    OpenRouter, Kilocode, Z.AI, xAI enregistrent `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer des ids de modèles amont
    avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="Fournisseurs OAuth et points de terminaison d’usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` avec `resolveUsageAuth` +
    `fetchUsageSnapshot` pour gérer l’échange de jetons et l’intégration `/usage`.
  </Accordion>
  <Accordion title="Familles de nettoyage de relecture et de transcription">
    Des familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux fournisseurs d’opter pour une
    politique de transcription via `buildReplayPolicy` au lieu que chaque plugin
    réimplémente le nettoyage.
  </Accordion>
  <Accordion title="Fournisseurs uniquement catalogue">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, et
    `volcengine` enregistrent seulement `catalog` et utilisent la boucle d’inférence partagée.
  </Accordion>
  <Accordion title="Helpers de flux spécifiques à Anthropic">
    Les en-têtes bêta, `/fast` / `serviceTier`, et `context1m` vivent dans la
    couture publique `api.ts` / `contract-api.ts` du plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Helpers runtime

Les plugins peuvent accéder à certains helpers du cœur via `api.runtime`. Pour TTS :

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Remarques :

- `textToSpeech` renvoie la charge utile de sortie TTS normale du cœur pour les surfaces de fichier/note vocale.
- Utilise la configuration du cœur `messages.tts` et la sélection de fournisseur.
- Renvoie un buffer audio PCM + fréquence d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou flux de configuration possédés par le fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que la langue, le genre et des tags de personnalité pour des sélecteurs conscients du fournisseur.
- OpenAI et ElevenLabs prennent aujourd’hui en charge la téléphonie. Microsoft non.

Les plugins peuvent aussi enregistrer des fournisseurs de parole via `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Remarques :

- Conservez la politique TTS, le repli et la livraison de réponse dans le cœur.
- Utilisez les fournisseurs de parole pour le comportement de synthèse possédé par le fournisseur.
- L’entrée héritée Microsoft `edge` est normalisée vers l’id de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un plugin fournisseur
  peut posséder le texte, la parole, l’image et les futurs fournisseurs média à mesure qu’OpenClaw ajoute ces contrats de capacité.

Pour la compréhension image/audio/vidéo, les plugins enregistrent un fournisseur typé
de compréhension média plutôt qu’un sac clé/valeur générique :

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Remarques :

- Conservez l’orchestration, le repli, la configuration et le câblage de canal dans le cœur.
- Conservez le comportement fournisseur dans le plugin fournisseur.
- L’extension additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs facultatifs de résultat, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et le helper runtime
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les helpers runtime de compréhension média, les plugins peuvent appeler :

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Pour la transcription audio, les plugins peuvent utiliser soit le runtime de compréhension média
soit l’alias STT plus ancien :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour la
  compréhension image/audio/vidéo.
- Utilise la configuration audio de compréhension média du cœur (`tools.media.audio`) et l’ordre de repli des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité.

Les plugins peuvent aussi lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Remarques :

- `provider` et `model` sont des redéfinitions facultatives par exécution, pas des changements persistants de session.
- OpenClaw n’honore ces champs de redéfinition que pour les appelants de confiance.
- Pour les exécutions de repli possédées par un plugin, les opérateurs doivent activer explicitement `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les plugins de confiance à des cibles canoniques spécifiques `provider/model`, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de plugins non fiables fonctionnent quand même, mais les demandes de redéfinition sont rejetées au lieu de se rabattre silencieusement.

Pour la recherche web, les plugins peuvent consommer le helper runtime partagé au lieu
d’entrer dans le câblage de l’outil agent :

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Les plugins peuvent aussi enregistrer des fournisseurs de recherche web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Conservez dans le cœur la sélection du fournisseur, la résolution des identifiants et la sémantique partagée des requêtes.
- Utilisez des fournisseurs de recherche web pour des transports de recherche spécifiques au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper d’outil d’agent.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)` : génère une image en utilisant la chaîne de fournisseurs configurée pour la génération d’images.
- `listProviders(...)` : liste les fournisseurs de génération d’images disponibles et leurs capacités.

## Routes HTTP Gateway

Les plugins peuvent exposer des points de terminaison HTTP avec `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Champs de la route :

- `path` : chemin de route sous le serveur HTTP Gateway.
- `auth` : requis. Utilisez `"gateway"` pour exiger l’authentification normale de la gateway, ou `"plugin"` pour l’authentification gérée par le plugin / la vérification des Webhook.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement de plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec différents niveaux `auth` sont rejetées. Conservez les chaînes de fallback `exact`/`prefix` au même niveau d’authentification uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées runtime opérateur. Elles servent aux Webhook / à la vérification de signature gérés par le plugin, pas aux appels privilégiés aux helpers Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée runtime de requête Gateway, mais cette portée est volontairement conservatrice :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) garde les portées runtime des routes plugin fixées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP de confiance porteurs d’identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) n’honorent `x-openclaw-scopes` que lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route plugin porteuses d’identité, la portée runtime revient à `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin authentifiée par la gateway soit implicitement une surface d’administration. Si votre route a besoin d’un comportement réservé à l’administration, exigez un mode d’authentification porteur d’identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’importation du SDK de plugin

Utilisez des sous-chemins SDK étroits au lieu du barrel racine monolithique `openclaw/plugin-sdk`
lorsque vous créez de nouveaux plugins. Sous-chemins principaux :

| Sous-chemin                         | Usage                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitifs d’enregistrement de plugin               |
| `openclaw/plugin-sdk/channel-core`  | Helpers d’entrée/de construction de canal          |
| `openclaw/plugin-sdk/core`          | Helpers partagés génériques et contrat englobant   |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les plugins de canal choisissent dans une famille de coutures étroites — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation devrait se consolider
sur un seul contrat `approvalCapability` plutôt que d’être mélangé à travers des champs de
plugin sans rapport. Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les helpers runtime et configuration vivent sous des sous-chemins `*-runtime`
correspondants (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` est obsolète — un shim de compatibilité pour
les anciens plugins. Le nouveau code doit importer des primitives génériques plus étroites à la place.
</Info>

Points d’entrée internes au dépôt (par racine de package de plugin intégré) :

- `index.js` — entrée du plugin intégré
- `api.js` — barrel de helpers/types
- `runtime-api.js` — barrel runtime-only
- `setup-entry.js` — entrée du plugin de configuration

Les plugins externes ne doivent importer que les sous-chemins `openclaw/plugin-sdk/*`. N’importez jamais
`src/*` d’un autre package de plugin depuis le cœur ou depuis un autre plugin.
Les points d’entrée chargés via façade préfèrent l’instantané de configuration runtime actif lorsqu’il existe,
puis reviennent au fichier de configuration résolu sur le disque.

Les sous-chemins spécifiques à une capacité tels que `image-generation`, `media-understanding`,
et `speech` existent parce que les plugins intégrés les utilisent aujourd’hui. Ce ne sont pas
automatiquement des contrats externes figés à long terme — vérifiez la page de référence SDK
appropriée lorsque vous vous appuyez sur eux.

## Schémas de l’outil de message

Les plugins doivent posséder les contributions de schéma `describeMessageTool(...)` spécifiques au canal
pour les primitives non liées au message telles que les réactions, les lectures et les sondages.
La présentation d’envoi partagée doit utiliser le contrat générique `MessagePresentation`
au lieu de champs natifs fournisseur pour boutons, composants, blocs ou cartes.
Voir [Présentation de message](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, le mappage fournisseur et la liste de contrôle pour les auteurs de plugins.

Les plugins capables d’envoyer déclarent ce qu’ils peuvent rendre via les capacités de message :

- `presentation` pour les blocs de présentation sémantiques (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s’il doit rendre la présentation nativement ou la dégrader en texte.
N’exposez pas d’échappatoires d’interface natives au fournisseur depuis l’outil de message générique.
Les helpers SDK obsolètes pour les anciens schémas natifs restent exportés pour les
plugins tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique de cible spécifique au canal. Gardez l’hôte
sortant partagé générique et utilisez la surface d’adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type id au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du plugin lorsque le
  cœur a besoin d’une résolution finale possédée par le fournisseur après normalisation ou après un
  échec de recherche dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction spécifique au fournisseur
  de la route de session une fois la cible résolue.

Séparation recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant
  la recherche dans les pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un id de cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation spécifique au fournisseur, pas pour une
  recherche large dans l’annuaire.
- Conservez les ids natifs du fournisseur comme ids de chat, ids de fil, JID, handles et ids de salon
  dans les valeurs `target` ou les paramètres spécifiques au fournisseur, pas dans les champs génériques du SDK.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d’annuaire à partir de la configuration doivent conserver cette logique dans le
plugin et réutiliser les helpers partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration tels que :

- pairs DM pilotés par liste d’autorisation
- maps configurées de canal/groupe
- replis d’annuaire statiques limités par compte

Les helpers partagés dans `directory-runtime` ne gèrent que des opérations génériques :

- filtrage des requêtes
- application des limites
- helpers de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte spécifique au canal et la normalisation des ids doivent rester dans l’
implémentation du plugin.

## Catalogues de fournisseurs

Les plugins de fournisseur peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une seule entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le plugin possède des ids de modèle spécifiques au fournisseur, des valeurs
par défaut d’URL de base ou des métadonnées de modèles conditionnées par l’authentification.

`catalog.order` contrôle le moment où le catalogue d’un plugin fusionne par rapport aux
fournisseurs implicites intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs l’emportent en cas de collision de clé, de sorte que les plugins peuvent volontairement remplacer une entrée de fournisseur intégrée avec le même id de fournisseur.

Compatibilité :

- `discovery` fonctionne toujours comme alias hérité
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en plus de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin runtime. Il peut supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque les secrets requis sont absents.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux doctor/réparation de config
  ne devraient pas avoir besoin de matérialiser les identifiants runtime juste pour
  décrire la configuration.

Comportement recommandé pour `inspectAccount(...)` :

- Renvoyer uniquement un état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure des champs source/statut d’identifiant lorsque c’est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons pour signaler une
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source
  correspondant) suffit pour les commandes de type status.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande courant.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande » au lieu de planter ou de signaler à tort que le compte n’est pas configuré.

## Packs de package

Un répertoire de plugin peut inclure un `package.json` avec `openclaw.extensions` :

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l’id du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Barrière de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire du plugin
après résolution des symlinks. Les entrées qui s’échappent du répertoire du package sont
rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances du plugin avec
`npm install --omit=dev --ignore-scripts` (pas de scripts de cycle de vie, pas de dépendances de développement au runtime). Gardez les arbres de dépendances des plugins en « JS/TS pur » et évitez les packages qui nécessitent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Quand OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais encore non configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela garde le démarrage et la configuration plus légers
lorsque l’entrée principale du plugin câble aussi des outils, hooks ou autre code réservé au runtime.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un plugin de canal pour le même chemin `setupEntry` pendant la
phase de démarrage avant écoute de la gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement si `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que la gateway ne commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer toutes les capacités possédées par le canal dont le démarrage dépend, comme :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant que la gateway ne commence à écouter
- toute méthode gateway, outil ou service qui doit exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Gardez le plugin sur le comportement par défaut et laissez OpenClaw charger l’entrée
complète au démarrage.

Les canaux intégrés peuvent aussi publier des helpers de surface de contrat réservés à la configuration que le cœur
peut consulter avant que le runtime complet du canal ne soit chargé. La surface actuelle de
promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une ancienne configuration de canal mono-compte
vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple intégré actuel : il déplace seulement les clés auth/bootstrap dans un
compte nommé promu lorsque des comptes nommés existent déjà, et peut préserver une
clé de compte par défaut configurée non canonique au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration gardent la découverte de surface de contrat intégrée paresseuse. Le temps
d’import reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de
réentrer dans le démarrage du canal intégré à l’import du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC Gateway, conservez-les sur un
préfixe spécifique au plugin. Les espaces de noms d’administration du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
vers `operator.admin`, même si un plugin demande une portée plus étroite.

Exemple :

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Métadonnées de catalogue de canal

Les plugins de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela permet de garder les données de catalogue du cœur vides de contenu.

Exemple :

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Champs `openclaw.channel` utiles au-delà de l’exemple minimal :

- `detailLabel` : label secondaire pour des surfaces de catalogue/statut plus riches
- `docsLabel` : redéfinit le texte du lien vers la documentation
- `preferOver` : ids de plugin/canal de priorité inférieure que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de copie pour la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste des canaux configurés lorsqu’il est défini sur `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration/onboarding lorsqu’il est défini sur `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : alias hérités encore acceptés pour la compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait participer le canal au flux standard quickstart `allowFrom`
- `forceAccountBinding` : exige une liaison de compte explicite même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, un export
de registre MPM). Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgules/points-virgules/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités de la clé `"entries"`.

Les entrées générées du catalogue de canaux et les entrées du catalogue d’installation de fournisseurs exposent
des faits normalisés sur la source d’installation à côté du bloc brut `openclaw.install`. Les
faits normalisés identifient si la spécification npm est une version exacte ou un sélecteur flottant,
si les métadonnées d’intégrité attendues sont présentes et si un chemin de source local
est aussi disponible. Les consommateurs doivent traiter `installSource` comme un champ
facultatif additif, afin que les anciennes entrées construites à la main et les shims de compatibilité n’aient pas à
le synthétiser. Cela permet à l’intégration et aux diagnostics d’expliquer l’état du plan de source sans importer le runtime du plugin.

Les entrées npm externes officielles doivent préférer un `npmSpec` exact plus
`expectedIntegrity`. Les noms de package nus et les dist-tags fonctionnent toujours pour
la compatibilité, mais ils exposent des avertissements du plan de source afin que le catalogue puisse évoluer
vers des installations épinglées et vérifiées par intégrité sans casser les plugins existants.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez cela lorsque votre plugin doit remplacer ou étendre le pipeline de contexte par défaut
au lieu de simplement ajouter une recherche de mémoire ou des hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Si votre moteur **ne** possède **pas** l’algorithme de Compaction, gardez `compact()`
implémenté et déléguez-le explicitement :

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Ajouter une nouvelle capacité

Lorsqu’un plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas
le système de plugins avec un accès privé. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez du comportement partagé que le cœur doit posséder : politique, repli, fusion de configuration,
   cycle de vie, sémantique côté canal et forme du helper runtime.
2. ajouter des surfaces d’enregistrement/runtime de plugin typées
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface
   de capacité typée utile.
3. câbler les consommateurs cœur + canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   pas en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins fournisseurs enregistrent ensuite leurs backends sur cette capacité.
5. ajouter une couverture contractuelle
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste structuré sans devenir codé en dur selon la vision du monde
d’un seul fournisseur. Voir le [Capability Cookbook](/fr/plugins/architecture)
pour une liste concrète de fichiers et un exemple complet.

### Liste de contrôle de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ces
surfaces ensemble :

- types du contrat du cœur dans `src/<capability>/types.ts`
- runner/helper runtime du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API de plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition du runtime de plugin dans `src/plugins/runtime/*` lorsque des plugins de fonctionnalité/canal
  doivent la consommer
- helpers de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore complètement intégrée.

### Modèle de capacité

Motif minimal :

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Motif de test contractuel :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde la règle simple :

- le cœur possède le contrat de capacité + l’orchestration
- les plugins fournisseurs possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les helpers runtime
- les tests contractuels gardent la propriété explicite

## Liens associés

- [Architecture des plugins](/fr/plugins/architecture) — modèle de capacité public et formes
- [Sous-chemins SDK de plugin](/fr/plugins/sdk-subpaths)
- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
