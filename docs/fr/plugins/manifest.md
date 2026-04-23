---
read_when:
    - Vous créez un Plugin OpenClaw
    - Vous devez livrer un schéma de configuration de Plugin ou déboguer des erreurs de validation du Plugin
summary: Exigences du manifeste de Plugin + schéma JSON (validation stricte de la configuration)
title: Manifeste de Plugin
x-i18n:
    generated_at: "2026-04-23T14:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifeste de Plugin (`openclaw.plugin.json`)

Cette page concerne uniquement le **manifeste de Plugin OpenClaw natif**.

Pour les dispositions de bundle compatibles, consultez [Bundles de Plugin](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition
  par défaut des composants Claude sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte aussi automatiquement ces dispositions de bundle, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de Skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude, et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes d’exécution d’OpenClaw.

Chaque Plugin OpenClaw natif **doit** fournir un fichier `openclaw.plugin.json` à la
**racine du Plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du Plugin**. Les manifestes manquants ou invalides sont traités comme
des erreurs de Plugin et bloquent la validation de la configuration.

Consultez le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle de capacités natif et les indications actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## Ce que fait ce fichier

`openclaw.plugin.json` est la métadonnée qu’OpenClaw lit avant de charger le
code de votre Plugin.

Utilisez-le pour :

- l’identité du plugin
- la validation de la configuration
- les métadonnées d’authentification et d’onboarding qui doivent être disponibles sans démarrer le runtime du Plugin
- les indications d’activation légères que les surfaces du plan de contrôle peuvent inspecter avant le chargement du runtime
- les descripteurs de configuration légers que les surfaces de configuration/onboarding peuvent inspecter avant le chargement du runtime
- les métadonnées d’alias et d’activation automatique qui doivent être résolues avant le chargement du runtime du Plugin
- les métadonnées abrégées de propriété de famille de modèles qui doivent auto-activer le Plugin avant le chargement du runtime
- les instantanés statiques de propriété des capacités utilisés pour le câblage de compatibilité intégré et la couverture des contrats
- les métadonnées légères du lanceur QA que l’hôte partagé `openclaw qa` peut inspecter avant le chargement du runtime du Plugin
- les métadonnées de configuration spécifiques au canal qui doivent être fusionnées dans les surfaces de catalogue et de validation sans charger le runtime
- les indications d’UI de configuration

Ne l’utilisez pas pour :

- enregistrer le comportement d’exécution
- déclarer des points d’entrée de code
- des métadonnées d’installation npm

Ces éléments appartiennent à votre code de Plugin et à `package.json`.

## Exemple minimal

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Exemple complet

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin fournisseur OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Clé API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Clé API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Clé API",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Référence des champs de niveau supérieur

| Champ                                | Obligatoire | Type                             | Signification                                                                                                                                                                                                                     |
| ------------------------------------ | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Oui         | `string`                         | ID canonique du Plugin. C’est l’ID utilisé dans `plugins.entries.<id>`.                                                                                                                                                          |
| `configSchema`                       | Oui         | `object`                         | Schéma JSON inline pour la configuration de ce Plugin.                                                                                                                                                                            |
| `enabledByDefault`                   | Non         | `true`                           | Marque un plugin intégré comme activé par défaut. Omettez-le, ou définissez toute valeur autre que `true`, pour laisser le plugin désactivé par défaut.                                                                         |
| `legacyPluginIds`                    | Non         | `string[]`                       | IDs historiques qui se normalisent vers cet ID canonique de Plugin.                                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | Non         | `string[]`                       | IDs de fournisseurs qui doivent activer automatiquement ce Plugin lorsque l’authentification, la configuration ou les références de modèle les mentionnent.                                                                      |
| `kind`                               | Non         | `"memory"` \| `"context-engine"` | Déclare un type exclusif de Plugin utilisé par `plugins.slots.*`.                                                                                                                                                                 |
| `channels`                           | Non         | `string[]`                       | IDs de canaux possédés par ce Plugin. Utilisés pour la découverte et la validation de la configuration.                                                                                                                           |
| `providers`                          | Non         | `string[]`                       | IDs de fournisseurs possédés par ce Plugin.                                                                                                                                                                                       |
| `modelSupport`                       | Non         | `object`                         | Métadonnées abrégées de famille de modèles possédées par le manifeste et utilisées pour charger automatiquement le Plugin avant le runtime.                                                                                       |
| `providerEndpoints`                  | Non         | `object[]`                       | Métadonnées d’hôte/baseUrl des endpoints possédées par le manifeste pour les routes de fournisseur que le cœur doit classifier avant le chargement du runtime du fournisseur.                                                     |
| `cliBackends`                        | Non         | `string[]`                       | IDs de backends d’inférence CLI possédés par ce Plugin. Utilisés pour l’auto-activation au démarrage à partir de références explicites de configuration.                                                                         |
| `syntheticAuthRefs`                  | Non         | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d’authentification synthétique possédé par le Plugin doit être sondé pendant la découverte à froid des modèles avant le chargement du runtime.                           |
| `nonSecretAuthMarkers`               | Non         | `string[]`                       | Valeurs d’espace réservé de clé API, possédées par un plugin intégré, qui représentent un état d’identifiants local, OAuth ou ambiant non secret.                                                                                |
| `commandAliases`                     | Non         | `object[]`                       | Noms de commandes possédés par ce Plugin qui doivent produire des diagnostics de configuration et de CLI conscients du Plugin avant le chargement du runtime.                                                                     |
| `providerAuthEnvVars`                | Non         | `Record<string, string[]>`       | Métadonnées légères de variables d’environnement d’authentification fournisseur qu’OpenClaw peut inspecter sans charger le code du Plugin.                                                                                       |
| `providerAuthAliases`                | Non         | `Record<string, string>`         | IDs de fournisseurs qui doivent réutiliser un autre ID de fournisseur pour la recherche d’authentification, par exemple un fournisseur de code qui partage la clé API et les profils d’authentification du fournisseur de base. |
| `channelEnvVars`                     | Non         | `Record<string, string[]>`       | Métadonnées légères de variables d’environnement de canal qu’OpenClaw peut inspecter sans charger le code du Plugin. Utilisez-les pour les surfaces de configuration ou d’authentification de canal pilotées par env que les aides génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non         | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’onboarding, la résolution du fournisseur préféré et le câblage simple des indicateurs CLI.                                                                  |
| `activation`                         | Non         | `object`                         | Indications d’activation légères pour le chargement déclenché par le fournisseur, la commande, le canal, la route et la capacité. Métadonnées uniquement ; le runtime du Plugin reste propriétaire du comportement réel.         |
| `setup`                              | Non         | `object`                         | Descripteurs légers de configuration/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger le runtime du Plugin.                                                                           |
| `qaRunners`                          | Non         | `object[]`                       | Descripteurs légers de lanceurs QA utilisés par l’hôte partagé `openclaw qa` avant le chargement du runtime du Plugin.                                                                                                           |
| `contracts`                          | Non         | `object`                         | Instantané statique de capacités intégrées pour les hooks d’authentification externes, la parole, la transcription temps réel, la voix temps réel, la compréhension média, la génération d’images, la génération musicale, la génération vidéo, la récupération web, la recherche web et la propriété des outils. |
| `mediaUnderstandingProviderMetadata` | Non         | `Record<string, object>`         | Valeurs par défaut légères de compréhension média pour les IDs de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                                            |
| `channelConfigs`                     | Non         | `Record<string, object>`         | Métadonnées de configuration de canal possédées par le manifeste et fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                                                   |
| `skills`                             | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du Plugin.                                                                                                                                                                  |
| `name`                               | Non         | `string`                         | Nom lisible du Plugin.                                                                                                                                                                                                             |
| `description`                        | Non         | `string`                         | Résumé court affiché dans les surfaces de Plugin.                                                                                                                                                                                  |
| `version`                            | Non         | `string`                         | Version informative du Plugin.                                                                                                                                                                                                     |
| `uiHints`                            | Non         | `Record<string, object>`         | Libellés UI, placeholders et indications de sensibilité pour les champs de configuration.                                                                                                                                         |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw lit cela avant le chargement du runtime du fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                              |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | ID du fournisseur auquel appartient ce choix.                                                              |
| `method`              | Oui         | `string`                                        | ID de méthode d’authentification vers lequel répartir.                                                     |
| `choiceId`            | Oui         | `string`                                        | ID stable de choix d’authentification utilisé par les flux d’onboarding et CLI.                            |
| `choiceLabel`         | Non         | `string`                                        | Libellé destiné à l’utilisateur. S’il est omis, OpenClaw revient à `choiceId`.                            |
| `choiceHint`          | Non         | `string`                                        | Court texte d’aide pour le sélecteur.                                                                      |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs les plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l’assistant. |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs de l’assistant tout en autorisant une sélection CLI manuelle.         |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | IDs historiques de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.            |
| `groupId`             | Non         | `string`                                        | ID de groupe facultatif pour regrouper des choix associés.                                                 |
| `groupLabel`          | Non         | `string`                                        | Libellé destiné à l’utilisateur pour ce groupe.                                                            |
| `groupHint`           | Non         | `string`                                        | Court texte d’aide pour le groupe.                                                                         |
| `optionKey`           | Non         | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul indicateur.                       |
| `cliFlag`             | Non         | `string`                                        | Nom d’indicateur CLI, tel que `--openrouter-api-key`.                                                      |
| `cliOption`           | Non         | `string`                                        | Forme complète de l’option CLI, telle que `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l’aide CLI.                                                                      |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d’onboarding ce choix doit apparaître. Si omis, la valeur par défaut est `["text-inference"]`. |

## Référence `commandAliases`

Utilisez `commandAliases` lorsqu’un plugin possède un nom de commande d’exécution que les utilisateurs peuvent
par erreur placer dans `plugins.allow` ou essayer d’exécuter comme commande CLI racine. OpenClaw
utilise ces métadonnées pour les diagnostics sans importer le code runtime du Plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Champ        | Obligatoire | Type              | Signification                                                              |
| ------------ | ----------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Oui         | `string`          | Nom de commande qui appartient à ce Plugin.                                |
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme une commande slash de chat plutôt qu’une commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine associée à suggérer pour les opérations CLI, si elle existe. |

## Référence `activation`

Utilisez `activation` lorsque le plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’activer plus tard.

## Référence `qaRunners`

Utilisez `qaRunners` lorsqu’un plugin fournit un ou plusieurs lanceurs de transport sous
la racine partagée `openclaw qa`. Gardez ces métadonnées légères et statiques ; le runtime du plugin
reste propriétaire de l’enregistrement CLI réel via une surface légère
`runtime-api.ts` qui exporte `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Exécute la voie QA live Matrix adossée à Docker sur un homeserver jetable"
    }
  ]
}
```

| Champ         | Obligatoire | Type     | Signification                                                         |
| ------------- | ----------- | -------- | --------------------------------------------------------------------- |
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.        |
| `description` | Non         | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande stub. |

Ce bloc ne contient que des métadonnées. Il n’enregistre pas de comportement d’exécution, et il
ne remplace pas `register(...)`, `setupEntry` ni d’autres points d’entrée runtime/plugin.
Les consommateurs actuels l’utilisent comme indication de réduction avant un chargement plus large des plugins, donc
l’absence de métadonnées d’activation ne coûte généralement que des performances ; elle ne devrait pas
modifier la correction tant que les replis historiques de propriété dans le manifeste existent encore.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Champ            | Obligatoire | Type                                                 | Signification                                                     |
| ---------------- | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | Non         | `string[]`                                           | IDs de fournisseurs qui doivent activer ce Plugin lorsqu’ils sont demandés. |
| `onCommands`     | Non         | `string[]`                                           | IDs de commandes qui doivent activer ce Plugin.                   |
| `onChannels`     | Non         | `string[]`                                           | IDs de canaux qui doivent activer ce Plugin.                      |
| `onRoutes`       | Non         | `string[]`                                           | Types de routes qui doivent activer ce Plugin.                    |
| `onCapabilities` | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications larges de capacité utilisées par la planification d’activation du plan de contrôle. |

Consommateurs live actuels :

- la planification CLI déclenchée par commande revient au comportement historique
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification de configuration/canal déclenchée par canal revient à la propriété
  historique `channels[]` lorsque les métadonnées explicites d’activation de canal sont absentes
- la planification de configuration/runtime déclenchée par fournisseur revient à la propriété
  historique `providers[]` et `cliBackends[]` de niveau supérieur lorsque des métadonnées explicites d’activation
  fournisseur sont absentes

## Référence `setup`

Utilisez `setup` lorsque les surfaces de configuration et d’onboarding ont besoin de métadonnées légères propres au plugin
avant le chargement du runtime.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Le `cliBackends` de niveau supérieur reste valide et continue de décrire les
backends d’inférence CLI. `setup.cliBackends` est la surface de descripteur spécifique à la configuration pour les
flux du plan de contrôle/de configuration qui doivent rester purement métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface de recherche privilégiée
orientée descripteur pour la découverte de configuration. Si le descripteur ne fait que réduire le plugin candidat et que la configuration a encore besoin de hooks runtime plus riches au moment de la configuration,
définissez `requiresRuntime: true` et gardez `setup-api` comme
chemin d’exécution de repli.

Comme la recherche de configuration peut exécuter du code `setup-api` appartenant au plugin, les valeurs
normalisées `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques à travers
les plugins découverts. Une propriété ambiguë échoue de manière fermée au lieu de choisir un
gagnant selon l’ordre de découverte.

### Référence `setup.providers`

| Champ         | Obligatoire | Type       | Signification                                                                            |
| ------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------- |
| `id`          | Oui         | `string`   | ID du fournisseur exposé pendant la configuration ou l’onboarding. Gardez les IDs normalisés globalement uniques. |
| `authMethods` | Non         | `string[]` | IDs de méthodes de configuration/authentification que ce fournisseur prend en charge sans charger le runtime complet. |
| `envVars`     | Non         | `string[]` | Variables d’environnement que les surfaces génériques de configuration/état peuvent vérifier avant le chargement du runtime du plugin. |

### Champs `setup`

| Champ              | Obligatoire | Type       | Signification                                                                                          |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Non         | `object[]` | Descripteurs de configuration du fournisseur exposés pendant la configuration et l’onboarding.        |
| `cliBackends`      | Non         | `string[]` | IDs de backend au moment de la configuration utilisés pour la recherche orientée descripteur. Gardez les IDs normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | IDs de migration de configuration appartenant à la surface de configuration de ce Plugin.              |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration a encore besoin d’exécuter `setup-api` après la recherche par descripteur. |

## Référence `uiHints`

`uiHints` est une map des noms de champs de configuration vers de petites indications de rendu.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clé API",
      "help": "Utilisée pour les requêtes OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Chaque indication de champ peut inclure :

| Champ         | Type       | Signification                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Libellé de champ destiné à l’utilisateur. |
| `help`        | `string`   | Court texte d’aide.                     |
| `tags`        | `string[]` | Étiquettes UI facultatives.             |
| `advanced`    | `boolean`  | Marque le champ comme avancé.           |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte d’espace réservé pour les entrées de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété de capacité qu’OpenClaw peut
lire sans importer le runtime du plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Chaque liste est facultative :

| Champ                            | Type       | Signification                                                       |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | IDs runtime intégrés pour lesquels un plugin intégré peut enregistrer des fabriques. |
| `externalAuthProviders`          | `string[]` | IDs de fournisseurs dont ce plugin possède le hook de profil d’authentification externe. |
| `speechProviders`                | `string[]` | IDs de fournisseurs de parole possédés par ce plugin.               |
| `realtimeTranscriptionProviders` | `string[]` | IDs de fournisseurs de transcription temps réel possédés par ce plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de fournisseurs de voix temps réel possédés par ce plugin.      |
| `mediaUnderstandingProviders`    | `string[]` | IDs de fournisseurs de compréhension média possédés par ce plugin.  |
| `imageGenerationProviders`       | `string[]` | IDs de fournisseurs de génération d’images possédés par ce plugin.  |
| `videoGenerationProviders`       | `string[]` | IDs de fournisseurs de génération vidéo possédés par ce plugin.     |
| `webFetchProviders`              | `string[]` | IDs de fournisseurs de récupération web possédés par ce plugin.     |
| `webSearchProviders`             | `string[]` | IDs de fournisseurs de recherche web possédés par ce plugin.        |
| `tools`                          | `string[]` | Noms d’outils d’agent possédés par ce plugin pour les vérifications de contrat intégrées. |

Les plugins fournisseurs qui implémentent `resolveExternalAuthProfiles` doivent déclarer
`contracts.externalAuthProviders`. Les plugins sans cette déclaration continuent de fonctionner
via un repli de compatibilité obsolète, mais ce repli est plus lent et
sera supprimé après la fenêtre de migration.

## Référence `mediaUnderstandingProviderMetadata`

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de compréhension média a
des modèles par défaut, une priorité de repli d’authentification automatique, ou une prise en charge native des documents dont
les aides génériques du cœur ont besoin avant le chargement du runtime. Les clés doivent aussi être déclarées dans
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Chaque entrée de fournisseur peut inclure :

| Champ                  | Type                                | Signification                                                                  |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités média exposées par ce fournisseur.                                   |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut capacité-vers-modèle utilisées lorsque la configuration ne spécifie pas de modèle. |
| `autoPriority`         | `Record<string, number>`            | Les nombres plus faibles sont triés plus tôt pour le repli automatique de fournisseur basé sur les identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de document natives prises en charge par le fournisseur.                |

## Référence `channelConfigs`

Utilisez `channelConfigs` lorsqu’un plugin de canal a besoin de métadonnées de configuration légères avant
le chargement du runtime.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL du homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Connexion au homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Chaque entrée de canal peut inclure :

| Champ         | Type                     | Signification                                                                               |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Obligatoire pour chaque entrée déclarée de configuration de canal. |
| `uiHints`     | `Record<string, object>` | Libellés UI/placeholders/indications de sensibilité facultatifs pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé du canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Courte description du canal pour les surfaces d’inspection et de catalogue.                 |
| `preferOver`  | `string[]`               | IDs de plugin historiques ou de priorité inférieure que ce canal doit surpasser dans les surfaces de sélection. |

## Référence `modelSupport`

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre plugin fournisseur à partir
d’IDs de modèles abrégés comme `gpt-5.4` ou `claude-sonnet-4.6` avant le chargement du runtime du plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cet ordre de priorité :

- les références explicites `provider/model` utilisent les métadonnées de manifeste `providers` du propriétaire
- `modelPatterns` prime sur `modelPrefixes`
- si un plugin non intégré et un plugin intégré correspondent tous deux, le plugin non intégré
  l’emporte
- l’ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                     |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux IDs de modèles abrégés.                   |
| `modelPatterns` | `string[]` | Sources regex comparées aux IDs de modèles abrégés après suppression du suffixe de profil. |

Les clés historiques de capacité de niveau supérieur sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, et `webSearchProviders` sous `contracts` ; le chargement normal
du manifeste ne traite plus ces champs de niveau supérieur comme
une propriété de capacité.

## Manifeste versus package.json

Les deux fichiers ont des rôles différents :

| Fichier                | À utiliser pour                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de la configuration, métadonnées de choix d’authentification et indications UI qui doivent exister avant l’exécution du code du plugin |
| `package.json`         | Métadonnées npm, installation des dépendances, et bloc `openclaw` utilisé pour les points d’entrée, le contrôle d’installation, la configuration, ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers d’entrée, ou le comportement d’installation npm, placez-la dans `package.json`

### Champs `package.json` qui affectent la découverte

Certaines métadonnées de plugin avant runtime se trouvent intentionnellement dans `package.json` sous le
bloc `openclaw` au lieu de `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Déclare les points d’entrée natifs du Plugin. Ils doivent rester dans le répertoire du package du Plugin.                                                                           |
| `openclaw.runtimeExtensions`                                      | Déclare les points d’entrée runtime JavaScript compilés pour les packages installés. Ils doivent rester dans le répertoire du package du Plugin.                                    |
| `openclaw.setupEntry`                                             | Point d’entrée léger réservé à la configuration, utilisé pendant l’onboarding, le démarrage différé des canaux, et la découverte en lecture seule de l’état du canal/SecretRef. Il doit rester dans le répertoire du package du Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Déclare le point d’entrée de configuration JavaScript compilé pour les packages installés. Il doit rester dans le répertoire du package du Plugin.                                  |
| `openclaw.channel`                                                | Métadonnées légères du catalogue de canaux telles que libellés, chemins de documentation, alias et texte de sélection.                                                              |
| `openclaw.channel.configuredState`                                | Métadonnées légères de vérification de l’état configuré, capables de répondre à « une configuration uniquement par env existe-t-elle déjà ? » sans charger le runtime complet du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères de vérification de l’état d’authentification persisté, capables de répondre à « y a-t-il déjà une session ouverte quelque part ? » sans charger le runtime complet du canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d’installation/mise à jour pour les plugins intégrés et publiés en externe.                                                                                              |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                              |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l’hôte OpenClaw, en utilisant un plancher semver tel que `>=2026.3.22`.                                                                        |
| `openclaw.install.expectedIntegrity`                              | Chaîne d’intégrité npm dist attendue telle que `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré par rapport à elle.                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin étroit de récupération par réinstallation de plugin intégré lorsque la configuration est invalide.                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet pendant le démarrage.                                                       |

Les métadonnées du manifeste déterminent quels choix de fournisseur/canal/configuration apparaissent dans
l’onboarding avant le chargement du runtime. `package.json#openclaw.install` indique à
l’onboarding comment récupérer ou activer ce plugin lorsque l’utilisateur choisit l’un de ces
choix. Ne déplacez pas les indications d’installation dans `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du registre
de manifestes. Les valeurs invalides sont rejetées ; les valeurs plus récentes mais valides ignorent le
plugin sur les hôtes plus anciens.

L’épinglage exact de version npm se trouve déjà dans `npmSpec`, par exemple
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Associez-le à
`expectedIntegrity` lorsque vous voulez que les flux de mise à jour échouent de manière fermée si l’artefact
npm récupéré ne correspond plus à la version épinglée. L’onboarding interactif
propose des npm specs de registre de confiance, y compris les noms de package nus et les dist-tags.
Lorsque `expectedIntegrity` est présent, les flux d’installation/mise à jour l’appliquent ; lorsqu’il
est omis, la résolution du registre est enregistrée sans épingle d’intégrité.

Les plugins de canal doivent fournir `openclaw.setupEntry` lorsque l’état, la liste des canaux,
ou les analyses SecretRef doivent identifier des comptes configurés sans charger le
runtime complet. Le point d’entrée de configuration doit exposer les métadonnées du canal ainsi que des adaptateurs sûrs pour la configuration,
l’état et les secrets ; gardez les clients réseau, les listeners Gateway et les
runtimes de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée runtime ne remplacent pas les vérifications de frontière de package pour les champs
de point d’entrée source. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre
chargeable un chemin `openclaw.extensions` qui s’échappe du package.

`openclaw.install.allowInvalidConfigRecovery` est intentionnellement étroit. Il ne
rend pas installables des configurations arbitrairement cassées. Aujourd’hui, il autorise seulement les
flux d’installation à récupérer de certains échecs obsolètes de mise à niveau de plugin intégré, comme un
chemin de plugin intégré manquant ou une entrée `channels.<id>` obsolète pour ce même
plugin intégré. Les erreurs de configuration sans rapport bloquent toujours l’installation et orientent les opérateurs
vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un minuscule
module de vérification :

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Utilisez-la lorsque les flux de configuration, doctor ou d’état configuré ont besoin d’une sonde d’authentification
légère oui/non avant le chargement du plugin de canal complet. L’export cible doit être une petite
fonction qui lit uniquement l’état persisté ; ne la faites pas passer par le barrel runtime complet
du canal.

`openclaw.channel.configuredState` suit la même forme pour des vérifications légères
de configuration uniquement par env :

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Utilisez-la lorsqu’un canal peut répondre à l’état configuré à partir de env ou d’autres petites
entrées non runtime. Si la vérification nécessite la résolution complète de la configuration ou le vrai
runtime du canal, gardez cette logique dans le hook `config.hasConfiguredState` du Plugin.

## Priorité de découverte (IDs de Plugin dupliqués)

OpenClaw découvre les plugins à partir de plusieurs racines (intégrés, installation globale, espace de travail, chemins explicitement sélectionnés par configuration). Si deux découvertes partagent le même `id`, seul le manifeste de **plus haute priorité** est conservé ; les doublons de priorité inférieure sont ignorés au lieu d’être chargés à côté.

Ordre de priorité, du plus élevé au plus faible :

1. **Sélectionné par configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Intégré** — plugins livrés avec OpenClaw
3. **Installation globale** — plugins installés dans la racine globale des plugins OpenClaw
4. **Espace de travail** — plugins découverts par rapport à l’espace de travail actuel

Conséquences :

- Une copie forkée ou obsolète d’un plugin intégré présente dans l’espace de travail ne masquera pas la version intégrée.
- Pour réellement remplacer un plugin intégré par une version locale, épinglez-le via `plugins.entries.<id>` afin qu’il gagne par priorité au lieu de compter sur la découverte de l’espace de travail.
- Les doublons ignorés sont journalisés afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.

## Exigences du schéma JSON

- **Chaque Plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l’exécution.

## Comportement de validation

- Les clés inconnues `channels.*` sont des **erreurs**, sauf si l’ID du canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, et `plugins.slots.*`
  doivent référencer des IDs de Plugin **détectables**. Les IDs inconnus sont des **erreurs**.
- Si un Plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du Plugin.
- Si une configuration de Plugin existe mais que le Plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est affiché dans Doctor + les logs.

Consultez [Référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local.
- Le runtime charge toujours le module du plugin séparément ; le manifeste sert uniquement à la
  découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, virgules finales et
  clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez d’ajouter
  ici des clés de niveau supérieur personnalisées.
- `providerAuthEnvVars` est le chemin léger de métadonnées pour les sondes d’authentification, la validation
  des marqueurs env et les surfaces similaires d’authentification fournisseur qui ne doivent pas démarrer le runtime du plugin
  juste pour inspecter les noms de variables d’environnement.
- `providerAuthAliases` permet aux variantes de fournisseur de réutiliser les variables d’environnement d’authentification,
  profils d’authentification, authentification adossée à la configuration, et choix d’onboarding de clé API
  d’un autre fournisseur sans coder en dur cette relation dans le cœur.
- `providerEndpoints` permet aux plugins fournisseurs de posséder des métadonnées simples de
  correspondance hôte/baseUrl d’endpoint. Utilisez-le uniquement pour les classes d’endpoint déjà prises en charge par le cœur ;
  le plugin reste propriétaire du comportement d’exécution.
- `syntheticAuthRefs` est le chemin léger de métadonnées pour les hooks d’authentification synthétique
  appartenant au fournisseur qui doivent être visibles à la découverte à froid des modèles avant l’existence du registre runtime. Ne listez que les références dont le fournisseur runtime ou le backend CLI
  implémente réellement `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` est le chemin léger de métadonnées pour les clés API d’espace réservé
  appartenant à des plugins intégrés, comme les marqueurs d’identifiants locaux, OAuth ou ambiants.
  Le cœur les traite comme non secrets pour l’affichage de l’authentification et les audits de secrets sans coder en dur le fournisseur propriétaire.
- `channelEnvVars` est le chemin léger de métadonnées pour le repli sur env du shell, les invites de configuration
  et les surfaces de canal similaires qui ne doivent pas démarrer le runtime du plugin
  juste pour inspecter les noms de variables d’environnement. Les noms env sont des métadonnées, pas
  une activation en eux-mêmes : l’état, l’audit, la validation de livraison Cron et les autres surfaces en lecture seule
  appliquent toujours la politique de confiance du plugin et la politique d’activation effective avant de
  traiter une variable d’environnement comme un canal configuré.
- `providerAuthChoices` est le chemin léger de métadonnées pour les sélecteurs de choix d’authentification,
  la résolution de `--auth-choice`, le mappage du fournisseur préféré, et l’enregistrement simple
  des indicateurs CLI d’onboarding avant le chargement du runtime du fournisseur. Pour les métadonnées d’assistant runtime
  qui nécessitent du code fournisseur, consultez
  [Hooks runtime du fournisseur](/fr/plugins/architecture#provider-runtime-hooks).
- Les types exclusifs de Plugin sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers`, `cliBackends`, et `skills` peuvent être omis lorsqu’un
  plugin n’en a pas besoin.
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toute
  exigence de liste d’autorisation du gestionnaire de packages (par exemple, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Associé

- [Création de plugins](/fr/plugins/building-plugins) — bien démarrer avec les plugins
- [Architecture des plugins](/fr/plugins/architecture) — architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK de Plugin
