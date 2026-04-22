---
read_when:
    - Vous créez un plugin OpenClaw
    - Vous devez livrer un schéma de configuration de plugin ou déboguer des erreurs de validation de plugin
summary: Exigences du manifeste Plugin + du schéma JSON (validation stricte de la configuration)
title: Manifeste Plugin
x-i18n:
    generated_at: "2026-04-22T06:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: b80735690799682939e8c8c27b6a364caa3ceadcf6319155ddeb20eb0538c313
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifeste Plugin (`openclaw.plugin.json`)

Cette page concerne uniquement le **manifeste de plugin OpenClaw natif**.

Pour les dispositions de bundles compatibles, voir [Bundles Plugin](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition de composant Claude
  par défaut sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte aussi automatiquement ces dispositions de bundle, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de Skills déclarées, les racines de commandes Claude, les valeurs par défaut de `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude, et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes du runtime OpenClaw.

Chaque plugin OpenClaw natif **doit** fournir un fichier `openclaw.plugin.json` à la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du plugin**. Les manifestes manquants ou invalides sont traités comme
des erreurs de plugin et bloquent la validation de la configuration.

Consultez le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle de capacité natif et les indications actuelles sur la compatibilité externe :
[Modèle de capacité](/fr/plugins/architecture#public-capability-model).

## À quoi sert ce fichier

`openclaw.plugin.json` correspond aux métadonnées qu’OpenClaw lit avant de charger le
code de votre plugin.

Utilisez-le pour :

- l’identité du plugin
- la validation de la configuration
- les métadonnées d’authentification et d’onboarding qui doivent être disponibles sans démarrer le runtime du plugin
- les indications d’activation légères que les surfaces du plan de contrôle peuvent inspecter avant le chargement du runtime
- les descripteurs de configuration légers que les surfaces de configuration/onboarding peuvent inspecter avant le chargement du runtime
- les métadonnées d’alias et d’activation automatique qui doivent être résolues avant le chargement du runtime du plugin
- les métadonnées abrégées de propriété de famille de modèles qui doivent activer automatiquement le
  plugin avant le chargement du runtime
- les instantanés statiques de propriété de capacité utilisés pour le câblage de compatibilité des plugins groupés et la couverture des contrats
- les métadonnées légères du runner QA que l’hôte partagé `openclaw qa` peut inspecter
  avant le chargement du runtime du plugin
- les métadonnées de configuration spécifiques aux canaux qui doivent être fusionnées dans les surfaces de catalogue et de validation sans charger le runtime
- les indications d’interface pour la configuration

Ne l’utilisez pas pour :

- enregistrer un comportement d’exécution
- déclarer des points d’entrée de code
- les métadonnées d’installation npm

Ces éléments doivent se trouver dans le code de votre plugin et dans `package.json`.

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

## Référence des champs de premier niveau

| Champ                                | Obligatoire | Type                             | Signification                                                                                                                                                                                                 |
| ------------------------------------ | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Oui         | `string`                         | ID canonique du plugin. C’est l’ID utilisé dans `plugins.entries.<id>`.                                                                                                                                        |
| `configSchema`                       | Oui         | `object`                         | Schéma JSON inline pour la configuration de ce plugin.                                                                                                                                                         |
| `enabledByDefault`                   | Non         | `true`                           | Marque un plugin groupé comme activé par défaut. Omettez-le, ou définissez une valeur autre que `true`, pour laisser le plugin désactivé par défaut.                                                        |
| `legacyPluginIds`                    | Non         | `string[]`                       | Anciens IDs normalisés vers cet ID canonique de plugin.                                                                                                                                                        |
| `autoEnableWhenConfiguredProviders`  | Non         | `string[]`                       | IDs de fournisseurs qui doivent activer automatiquement ce plugin lorsque l’authentification, la configuration ou les références de modèles les mentionnent.                                                |
| `kind`                               | Non         | `"memory"` \| `"context-engine"` | Déclare un type exclusif de plugin utilisé par `plugins.slots.*`.                                                                                                                                              |
| `channels`                           | Non         | `string[]`                       | IDs de canaux possédés par ce plugin. Utilisés pour la découverte et la validation de la configuration.                                                                                                       |
| `providers`                          | Non         | `string[]`                       | IDs de fournisseurs possédés par ce plugin.                                                                                                                                                                    |
| `modelSupport`                       | Non         | `object`                         | Métadonnées abrégées de famille de modèles, possédées par le manifeste, utilisées pour charger automatiquement le plugin avant le runtime.                                                                   |
| `providerEndpoints`                  | Non         | `object[]`                       | Métadonnées d’hôte/baseUrl de point de terminaison, possédées par le manifeste, pour les routes de fournisseur que le cœur doit classifier avant le chargement du runtime du fournisseur.                   |
| `cliBackends`                        | Non         | `string[]`                       | IDs de backends d’inférence CLI possédés par ce plugin. Utilisés pour l’auto-activation au démarrage à partir de références de configuration explicites.                                                    |
| `syntheticAuthRefs`                  | Non         | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d’authentification synthétique, possédé par le plugin, doit être sondé lors de la découverte à froid des modèles avant le chargement du runtime. |
| `nonSecretAuthMarkers`               | Non         | `string[]`                       | Valeurs d’espace réservé de clé API, possédées par un plugin groupé, qui représentent un état d’identifiants local, OAuth ou ambiant non secret.                                                            |
| `commandAliases`                     | Non         | `object[]`                       | Noms de commandes possédés par ce plugin qui doivent produire une configuration sensible au plugin et des diagnostics CLI avant le chargement du runtime.                                                    |
| `providerAuthEnvVars`                | Non         | `Record<string, string[]>`       | Métadonnées légères d’authentification de fournisseur par variables d’environnement qu’OpenClaw peut inspecter sans charger le code du plugin.                                                              |
| `providerAuthAliases`                | Non         | `Record<string, string>`         | IDs de fournisseurs qui doivent réutiliser un autre ID de fournisseur pour la recherche d’authentification, par exemple un fournisseur de code qui partage la clé API du fournisseur de base et les profils d’authentification. |
| `channelEnvVars`                     | Non         | `Record<string, string[]>`       | Métadonnées légères de canal par variables d’environnement qu’OpenClaw peut inspecter sans charger le code du plugin. Utilisez-les pour les surfaces de configuration ou d’authentification de canal pilotées par l’environnement que les helpers génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non         | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’onboarding, la résolution de fournisseur préféré et le câblage simple des flags CLI.                                                   |
| `activation`                         | Non         | `object`                         | Indications d’activation légères pour le chargement déclenché par un fournisseur, une commande, un canal, une route ou une capacité. Métadonnées uniquement ; le runtime du plugin reste propriétaire du comportement réel. |
| `setup`                              | Non         | `object`                         | Descripteurs légers de configuration/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger le runtime du plugin.                                                      |
| `qaRunners`                          | Non         | `object[]`                       | Descripteurs légers de runner QA utilisés par l’hôte partagé `openclaw qa` avant le chargement du runtime du plugin.                                                                                         |
| `contracts`                          | Non         | `object`                         | Instantané statique des capacités groupées pour la parole, la transcription temps réel, la voix temps réel, la compréhension des médias, la génération d’images, la génération musicale, la génération vidéo, la récupération web, la recherche web et la propriété des outils. |
| `mediaUnderstandingProviderMetadata` | Non         | `Record<string, object>`         | Valeurs par défaut légères de compréhension des médias pour les IDs de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                    |
| `channelConfigs`                     | Non         | `Record<string, object>`         | Métadonnées de configuration de canal, possédées par le manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                               |
| `skills`                             | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du plugin.                                                                                                                                              |
| `name`                               | Non         | `string`                         | Nom lisible du plugin.                                                                                                                                                                                         |
| `description`                        | Non         | `string`                         | Résumé court affiché dans les surfaces du plugin.                                                                                                                                                              |
| `version`                            | Non         | `string`                         | Version informative du plugin.                                                                                                                                                                                 |
| `uiHints`                            | Non         | `Record<string, object>`         | Libellés d’interface, placeholders et indications de sensibilité pour les champs de configuration.                                                                                                            |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw lit ceci avant le chargement du runtime du fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                                 |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | ID du fournisseur auquel ce choix appartient.                                                                  |
| `method`              | Oui         | `string`                                        | ID de méthode d’authentification vers laquelle router.                                                         |
| `choiceId`            | Oui         | `string`                                        | ID stable de choix d’authentification utilisé par les flux d’onboarding et de CLI.                            |
| `choiceLabel`         | Non         | `string`                                        | Libellé destiné à l’utilisateur. S’il est omis, OpenClaw retombe sur `choiceId`.                              |
| `choiceHint`          | Non         | `string`                                        | Court texte d’aide pour le sélecteur.                                                                          |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l’assistant.        |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs de l’assistant tout en autorisant encore la sélection manuelle via CLI.   |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | Anciens IDs de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.                     |
| `groupId`             | Non         | `string`                                        | ID de groupe facultatif pour regrouper des choix liés.                                                         |
| `groupLabel`          | Non         | `string`                                        | Libellé destiné à l’utilisateur pour ce groupe.                                                                |
| `groupHint`           | Non         | `string`                                        | Court texte d’aide pour le groupe.                                                                             |
| `optionKey`           | Non         | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul flag.                                  |
| `cliFlag`             | Non         | `string`                                        | Nom du flag CLI, par exemple `--openrouter-api-key`.                                                           |
| `cliOption`           | Non         | `string`                                        | Forme complète de l’option CLI, par exemple `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l’aide CLI.                                                                           |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d’onboarding ce choix doit apparaître. S’il est omis, la valeur par défaut est `["text-inference"]`. |

## Référence `commandAliases`

Utilisez `commandAliases` lorsqu’un plugin possède un nom de commande d’exécution que les utilisateurs peuvent
mettre par erreur dans `plugins.allow` ou essayer d’exécuter comme commande CLI racine. OpenClaw
utilise ces métadonnées pour les diagnostics sans importer le code runtime du plugin.

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
| `name`       | Oui         | `string`          | Nom de commande qui appartient à ce plugin.                                |
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme commande slash de chat plutôt que comme commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine associée à suggérer pour les opérations CLI, si elle existe. |

## Référence `activation`

Utilisez `activation` lorsque le plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’activer plus tard.

## Référence `qaRunners`

Utilisez `qaRunners` lorsqu’un plugin fournit un ou plusieurs runners de transport sous
la racine partagée `openclaw qa`. Gardez ces métadonnées légères et statiques ; le runtime
du plugin reste propriétaire de l’enregistrement CLI réel via une surface légère
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

| Champ         | Obligatoire | Type     | Signification                                                        |
| ------------- | ----------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.       |
| `description` | Non         | `string` | Texte d’aide de secours utilisé lorsque l’hôte partagé a besoin d’une commande factice. |

Ce bloc contient uniquement des métadonnées. Il n’enregistre pas de comportement d’exécution, et il
ne remplace pas `register(...)`, `setupEntry` ni les autres points d’entrée runtime/plugin.
Les consommateurs actuels l’utilisent comme indication de restriction avant un chargement plus large du plugin, donc
l’absence de métadonnées d’activation coûte généralement seulement en performances ; elle ne devrait pas
modifier la correction tant que les mécanismes de repli hérités de propriété du manifeste existent encore.

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

| Champ            | Obligatoire | Type                                                 | Signification                                                      |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | Non         | `string[]`                                           | IDs de fournisseurs qui doivent activer ce plugin lorsqu’ils sont demandés. |
| `onCommands`     | Non         | `string[]`                                           | IDs de commandes qui doivent activer ce plugin.                    |
| `onChannels`     | Non         | `string[]`                                           | IDs de canaux qui doivent activer ce plugin.                       |
| `onRoutes`       | Non         | `string[]`                                           | Types de routes qui doivent activer ce plugin.                     |
| `onCapabilities` | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications larges de capacité utilisées par la planification d’activation du plan de contrôle. |

Consommateurs actifs actuels :

- la planification CLI déclenchée par commande retombe sur l’ancien
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification de configuration/canal déclenchée par canal retombe sur l’ancienne propriété
  `channels[]` lorsque des métadonnées explicites d’activation de canal sont absentes
- la planification de configuration/runtime déclenchée par fournisseur retombe sur l’ancienne
  propriété `providers[]` et sur la propriété de premier niveau `cliBackends[]` lorsque des métadonnées explicites
  d’activation de fournisseur sont absentes

## Référence `setup`

Utilisez `setup` lorsque les surfaces de configuration et d’onboarding ont besoin de métadonnées légères possédées par le plugin
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

Le `cliBackends` de premier niveau reste valide et continue de décrire les backends
d’inférence CLI. `setup.cliBackends` est la surface de descripteur spécifique à la configuration pour
les flux de plan de contrôle/configuration qui doivent rester limités aux métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface
de recherche privilégiée, orientée descripteur d’abord, pour la découverte de configuration. Si le descripteur ne fait
que restreindre le plugin candidat et que la configuration a encore besoin de hooks runtime plus riches au moment de la configuration,
définissez `requiresRuntime: true` et conservez `setup-api` comme
chemin d’exécution de repli.

Comme la recherche de configuration peut exécuter du code `setup-api` possédé par le plugin,
les valeurs normalisées de `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi
les plugins découverts. Une propriété ambiguë échoue en mode fermé au lieu de choisir un
gagnant selon l’ordre de découverte.

### Référence `setup.providers`

| Champ         | Obligatoire | Type       | Signification                                                                            |
| ------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------- |
| `id`          | Oui         | `string`   | ID de fournisseur exposé pendant la configuration ou l’onboarding. Gardez les IDs normalisés globalement uniques. |
| `authMethods` | Non         | `string[]` | IDs de méthodes de configuration/authentification que ce fournisseur prend en charge sans charger le runtime complet. |
| `envVars`     | Non         | `string[]` | Variables d’environnement que les surfaces génériques de configuration/statut peuvent vérifier avant le chargement du runtime du plugin. |

### Champs `setup`

| Champ              | Obligatoire | Type       | Signification                                                                                           |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | Non         | `object[]` | Descripteurs de configuration de fournisseur exposés pendant la configuration et l’onboarding.          |
| `cliBackends`      | Non         | `string[]` | IDs de backend utilisés au moment de la configuration pour la recherche orientée descripteur d’abord. Gardez les IDs normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | IDs de migration de configuration possédés par la surface de configuration de ce plugin.                |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration a encore besoin d’exécuter `setup-api` après la recherche par descripteur. |

## Référence `uiHints`

`uiHints` est une table de correspondance des noms de champs de configuration vers de petites indications de rendu.

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

| Champ         | Type       | Signification                              |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Libellé du champ destiné à l’utilisateur.  |
| `help`        | `string`   | Court texte d’aide.                        |
| `tags`        | `string[]` | Tags d’interface facultatifs.              |
| `advanced`    | `boolean`  | Marque le champ comme avancé.              |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible.  |
| `placeholder` | `string`   | Texte de placeholder pour les champs de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété de capacité qu’OpenClaw peut
lire sans importer le runtime du plugin.

```json
{
  "contracts": {
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

| Champ                            | Type       | Signification                                                        |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de fournisseurs de parole possédés par ce plugin.               |
| `realtimeTranscriptionProviders` | `string[]` | IDs de fournisseurs de transcription temps réel possédés par ce plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de fournisseurs de voix temps réel possédés par ce plugin.      |
| `mediaUnderstandingProviders`    | `string[]` | IDs de fournisseurs de compréhension des médias possédés par ce plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de fournisseurs de génération d’images possédés par ce plugin.  |
| `videoGenerationProviders`       | `string[]` | IDs de fournisseurs de génération vidéo possédés par ce plugin.     |
| `webFetchProviders`              | `string[]` | IDs de fournisseurs de récupération web possédés par ce plugin.     |
| `webSearchProviders`             | `string[]` | IDs de fournisseurs de recherche web possédés par ce plugin.        |
| `tools`                          | `string[]` | Noms d’outils d’agent possédés par ce plugin pour les vérifications de contrat des plugins groupés. |

## Référence `mediaUnderstandingProviderMetadata`

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de compréhension des médias a
des modèles par défaut, une priorité de repli d’authentification automatique ou une prise en charge native des documents
dont les helpers génériques du cœur ont besoin avant le chargement du runtime. Les clés doivent aussi être déclarées dans
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

| Champ                  | Type                                | Signification                                                             |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités média exposées par ce fournisseur.                              |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut capacité-vers-modèle utilisées lorsque la configuration ne précise pas de modèle. |
| `autoPriority`         | `Record<string, number>`            | Les nombres plus faibles sont triés plus tôt pour le repli automatique de fournisseur basé sur les identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de document natives prises en charge par le fournisseur.          |

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

| Champ         | Type                     | Signification                                                                                 |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Obligatoire pour chaque entrée déclarée de configuration de canal. |
| `uiHints`     | `Record<string, object>` | Libellés d’interface/placeholders/indications de sensibilité facultatifs pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé de canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Courte description du canal pour les surfaces d’inspection et de catalogue.                  |
| `preferOver`  | `string[]`               | IDs de plugins hérités ou de priorité inférieure que ce canal doit dépasser dans les surfaces de sélection. |

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
- `modelPatterns` a priorité sur `modelPrefixes`
- si un plugin non groupé et un plugin groupé correspondent tous deux, le plugin non groupé
  l’emporte
- l’ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration précise un fournisseur

Champs :

| Champ           | Type       | Signification                                                                      |
| --------------- | ---------- | ---------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes testés avec `startsWith` sur les IDs de modèles abrégés.                  |
| `modelPatterns` | `string[]` | Sources regex testées sur les IDs de modèles abrégés après suppression du suffixe de profil. |

Les anciennes clés de capacité de premier niveau sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal
du manifeste ne traite plus ces champs de premier niveau comme propriété
de capacité.

## Manifeste versus package.json

Les deux fichiers remplissent des fonctions différentes :

| Fichier                | À utiliser pour                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification et indications d’interface qui doivent exister avant l’exécution du code du plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, le contrôle d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où une métadonnée doit aller, appliquez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers de point d’entrée ou le comportement d’installation npm, placez-la dans `package.json`

### Champs `package.json` qui affectent la découverte

Certaines métadonnées de plugin avant runtime résident intentionnellement dans `package.json` sous le bloc
`openclaw` plutôt que dans `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d’entrée de plugin natifs. Doit rester dans le répertoire de package du plugin.                                                                                  |
| `openclaw.runtimeExtensions`                                      | Déclare les points d’entrée runtime JavaScript compilés pour les packages installés. Doit rester dans le répertoire de package du plugin.                                          |
| `openclaw.setupEntry`                                             | Point d’entrée léger réservé à la configuration utilisé pendant l’onboarding, le démarrage différé de canal et la découverte en lecture seule du statut de canal/SecretRef. Doit rester dans le répertoire de package du plugin. |
| `openclaw.runtimeSetupEntry`                                      | Déclare le point d’entrée de configuration JavaScript compilé pour les packages installés. Doit rester dans le répertoire de package du plugin.                                     |
| `openclaw.channel`                                                | Métadonnées légères de catalogue de canal comme les libellés, les chemins de documentation, les alias et le texte de sélection.                                                    |
| `openclaw.channel.configuredState`                                | Métadonnées légères de vérificateur d’état configuré pouvant répondre à « une configuration uniquement par variables d’environnement existe-t-elle déjà ? » sans charger le runtime complet du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères de vérificateur d’état d’authentification persisté pouvant répondre à « quelque chose est-il déjà connecté ? » sans charger le runtime complet du canal.       |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d’installation/mise à jour pour les plugins groupés et publiés en externe.                                                                                              |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                             |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l’hôte OpenClaw, avec un plancher semver comme `>=2026.3.22`.                                                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin de récupération étroit de réinstallation de plugin groupé lorsque la configuration est invalide.                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet au démarrage.                                                             |

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement
du registre des manifestes. Les valeurs invalides sont rejetées ; les valeurs valides mais plus récentes ignorent le
plugin sur les hôtes plus anciens.

Les plugins de canal devraient fournir `openclaw.setupEntry` lorsque le statut, la liste des canaux
ou les analyses SecretRef doivent identifier les comptes configurés sans charger le runtime complet.
Le point d’entrée de configuration doit exposer les métadonnées du canal ainsi que des adaptateurs sûrs pour la configuration,
le statut et les secrets ; gardez les clients réseau, les écouteurs Gateway et les runtimes de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée runtime ne remplacent pas les vérifications de limite de package pour les champs
de point d’entrée source. Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre chargeable
un chemin `openclaw.extensions` qui s’échappe du package.

`openclaw.install.allowInvalidConfigRecovery` est volontairement limité. Il
ne rend pas installables des configurations cassées arbitraires. Aujourd’hui, il permet seulement aux flux d’installation
de récupérer après certains échecs périmés de mise à niveau de plugin groupé, comme
un chemin de plugin groupé manquant ou une entrée `channels.<id>` périmée pour ce même
plugin groupé. Les erreurs de configuration non liées bloquent toujours l’installation et dirigent les opérateurs
vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un minuscule module
de vérification :

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

Utilisez-le lorsque les flux de configuration, de doctor ou d’état configuré ont besoin d’une
sonde d’authentification légère en oui/non avant le chargement du plugin de canal complet. L’export cible doit être une petite
fonction qui lit uniquement l’état persisté ; ne le faites pas passer par le barrel runtime
complet du canal.

`openclaw.channel.configuredState` suit la même forme pour des vérifications légères
d’état configuré basées uniquement sur l’environnement :

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

Utilisez-le lorsqu’un canal peut répondre sur l’état configuré à partir de l’environnement ou d’autres
petites entrées non runtime. Si la vérification nécessite une résolution complète de la configuration ou le vrai
runtime du canal, gardez plutôt cette logique dans le hook `config.hasConfiguredState`
du plugin.

## Priorité de découverte (IDs de plugin dupliqués)

OpenClaw découvre les plugins à partir de plusieurs racines (groupés, installation globale, workspace, chemins explicites sélectionnés par la configuration). Si deux découvertes partagent le même `id`, seul le manifeste à la **priorité la plus élevée** est conservé ; les doublons de priorité inférieure sont ignorés au lieu d’être chargés à côté.

Priorité, de la plus élevée à la plus basse :

1. **Sélectionné par la configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Groupé** — plugins livrés avec OpenClaw
3. **Installation globale** — plugins installés dans la racine globale des plugins OpenClaw
4. **Workspace** — plugins découverts relativement au workspace actuel

Conséquences :

- Une copie forkée ou obsolète d’un plugin groupé présente dans le workspace ne masquera pas la version groupée.
- Pour réellement remplacer un plugin groupé par un plugin local, épinglez-le via `plugins.entries.<id>` afin qu’il l’emporte par priorité plutôt qu’en comptant sur la découverte du workspace.
- Les doublons ignorés sont journalisés afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.

## Exigences du schéma JSON

- **Chaque plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas au runtime.

## Comportement de validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l’ID de canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des IDs de plugin **découvrables**. Les IDs inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et
  un **avertissement** apparaît dans Doctor + les logs.

Consultez [Référence de configuration](/fr/gateway/configuration) pour le schéma complet de `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local.
- Le runtime charge toujours le module du plugin séparément ; le manifeste sert uniquement à
  la découverte + la validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, les virgules finales et
  les clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez d’ajouter
  ici des clés personnalisées de premier niveau.
- `providerAuthEnvVars` est le chemin de métadonnées léger pour les sondes d’authentification, la validation
  des marqueurs d’environnement et les surfaces similaires d’authentification de fournisseur qui ne doivent pas démarrer le runtime du plugin juste pour inspecter les noms d’environnement.
- `providerAuthAliases` permet à des variantes de fournisseur de réutiliser les variables d’environnement d’authentification,
  les profils d’authentification, l’authentification basée sur la configuration et le choix d’onboarding de clé API
  d’un autre fournisseur sans coder cette relation en dur dans le cœur.
- `providerEndpoints` permet aux plugins fournisseur de posséder de simples métadonnées de correspondance
  d’hôte/baseUrl de point de terminaison. Utilisez-le uniquement pour les classes de point de terminaison déjà prises en charge par le cœur ;
  le plugin reste propriétaire du comportement runtime.
- `syntheticAuthRefs` est le chemin de métadonnées léger pour les hooks d’authentification synthétique
  possédés par un fournisseur qui doivent être visibles pour la découverte à froid des modèles avant que le registre runtime n’existe.
  N’indiquez que les références dont le fournisseur runtime ou le backend CLI implémente réellement
  `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` est le chemin de métadonnées léger pour les clés API d’espace réservé
  possédées par des plugins groupés, comme les marqueurs d’identifiants locaux, OAuth ou ambiants.
  Le cœur les traite comme non secrets pour l’affichage de l’authentification et les audits de secrets sans
  coder en dur le fournisseur propriétaire.
- `channelEnvVars` est le chemin de métadonnées léger pour le repli sur les variables d’environnement du shell, les invites de configuration
  et les surfaces de canal similaires qui ne doivent pas démarrer le runtime du plugin
  juste pour inspecter les noms d’environnement. Les noms d’environnement sont des métadonnées, pas une activation
  en eux-mêmes : le statut, l’audit, la validation de livraison Cron et les autres surfaces en lecture seule
  appliquent toujours la politique de confiance du plugin et la politique d’activation effective avant de
  traiter une variable d’environnement comme un canal configuré.
- `providerAuthChoices` est le chemin de métadonnées léger pour les sélecteurs de choix d’authentification,
  la résolution `--auth-choice`, le mapping de fournisseur préféré et l’enregistrement simple
  de flags CLI d’onboarding avant le chargement du runtime du fournisseur. Pour les métadonnées d’assistant runtime
  qui nécessitent du code fournisseur, voir
  [Hooks runtime de fournisseur](/fr/plugins/architecture#provider-runtime-hooks).
- Les types exclusifs de plugin sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers`, `cliBackends` et `skills` peuvent être omis lorsqu’un
  plugin n’en a pas besoin.
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toutes
  les exigences d’allowlist du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Liés

- [Créer des plugins](/fr/plugins/building-plugins) — démarrer avec les plugins
- [Architecture des plugins](/fr/plugins/architecture) — architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK Plugin
