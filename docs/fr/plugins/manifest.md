---
read_when:
    - Vous créez un Plugin OpenClaw
    - Vous devez fournir un schéma de configuration du plugin ou déboguer des erreurs de validation du plugin
summary: Exigences relatives au manifeste du Plugin + au schéma JSON (validation stricte de la configuration)
title: Manifeste du Plugin
x-i18n:
    generated_at: "2026-04-19T01:11:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2dfc00759108ddee7bfcda8c42acf7f2d47451676447ba3caf8b5950f8a1c181
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifeste du Plugin (`openclaw.plugin.json`)

Cette page concerne uniquement le **manifeste natif de Plugin OpenClaw**.

Pour les dispositions de bundle compatibles, consultez [Bundles de Plugin](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte aussi automatiquement ces dispositions de bundle, mais elles ne sont pas validées par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les racines de skills déclarées, les racines de commandes Claude, les valeurs par défaut de `settings.json` du bundle Claude, les valeurs par défaut LSP du bundle Claude et les packs de hooks pris en charge lorsque la disposition correspond aux attentes d’exécution d’OpenClaw.

Chaque Plugin OpenClaw natif **doit** fournir un fichier `openclaw.plugin.json` dans la **racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration **sans exécuter le code du plugin**. Les manifestes manquants ou invalides sont traités comme des erreurs de plugin et bloquent la validation de la configuration.

Consultez le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle de capacités natif et les recommandations actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## Rôle de ce fichier

`openclaw.plugin.json` contient les métadonnées qu’OpenClaw lit avant de charger le code de votre plugin.

Utilisez-le pour :

- l’identité du plugin
- la validation de la configuration
- les métadonnées d’authentification et d’onboarding qui doivent être disponibles sans démarrer l’exécution du plugin
- les indices d’activation légers que les surfaces du plan de contrôle peuvent inspecter avant le chargement de l’exécution
- les descripteurs de configuration légers que les surfaces de configuration/onboarding peuvent inspecter avant le chargement de l’exécution
- les métadonnées d’alias et d’activation automatique qui doivent être résolues avant le chargement de l’exécution du plugin
- les métadonnées abrégées de propriété de famille de modèles qui doivent activer automatiquement le plugin avant le chargement de l’exécution
- les instantanés statiques de propriété de capacités utilisés pour le câblage de compatibilité intégré et la couverture des contrats
- les métadonnées légères de l’exécuteur QA que l’hôte partagé `openclaw qa` peut inspecter avant le chargement de l’exécution du plugin
- les métadonnées de configuration spécifiques aux canaux qui doivent être fusionnées dans les surfaces de catalogue et de validation sans charger l’exécution
- les indications d’interface pour la configuration

Ne l’utilisez pas pour :

- enregistrer un comportement d’exécution
- déclarer des points d’entrée de code
- des métadonnées d’installation npm

Ces éléments appartiennent au code de votre plugin et à `package.json`.

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

| Champ                               | Obligatoire | Type                             | Signification                                                                                                                                                                                                 |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Oui         | `string`                         | ID canonique du plugin. Il s’agit de l’ID utilisé dans `plugins.entries.<id>`.                                                                                                                               |
| `configSchema`                      | Oui         | `object`                         | Schéma JSON inline pour la configuration de ce plugin.                                                                                                                                                        |
| `enabledByDefault`                  | Non         | `true`                           | Marque un plugin intégré comme activé par défaut. Omettez-le, ou définissez toute valeur différente de `true`, pour laisser le plugin désactivé par défaut.                                                |
| `legacyPluginIds`                   | Non         | `string[]`                       | IDs hérités normalisés vers cet ID canonique de plugin.                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders` | Non         | `string[]`                       | IDs de fournisseurs qui doivent activer automatiquement ce plugin lorsque l’authentification, la configuration ou des références de modèles les mentionnent.                                                |
| `kind`                              | Non         | `"memory"` \| `"context-engine"` | Déclare un type de plugin exclusif utilisé par `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | Non         | `string[]`                       | IDs de canaux appartenant à ce plugin. Utilisés pour la découverte et la validation de la configuration.                                                                                                      |
| `providers`                         | Non         | `string[]`                       | IDs de fournisseurs appartenant à ce plugin.                                                                                                                                                                  |
| `modelSupport`                      | Non         | `object`                         | Métadonnées abrégées de famille de modèles appartenant au manifeste, utilisées pour charger automatiquement le plugin avant l’exécution.                                                                     |
| `providerEndpoints`                 | Non         | `object[]`                       | Métadonnées d’hôte/baseUrl de point de terminaison appartenant au manifeste pour les routes de fournisseur que le cœur doit classer avant le chargement de l’exécution du fournisseur.                     |
| `cliBackends`                       | Non         | `string[]`                       | IDs de backends d’inférence CLI appartenant à ce plugin. Utilisés pour l’activation automatique au démarrage à partir de références de configuration explicites.                                            |
| `syntheticAuthRefs`                 | Non         | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d’authentification synthétique appartenant au plugin doit être sondé pendant la découverte à froid des modèles avant le chargement de l’exécution. |
| `nonSecretAuthMarkers`              | Non         | `string[]`                       | Valeurs d’espace réservé de clé API appartenant aux plugins intégrés qui représentent un état d’identifiants local, OAuth ou ambiant non secret.                                                            |
| `commandAliases`                    | Non         | `object[]`                       | Noms de commandes appartenant à ce plugin qui doivent produire une configuration sensible au plugin et des diagnostics CLI avant le chargement de l’exécution.                                               |
| `providerAuthEnvVars`               | Non         | `Record<string, string[]>`       | Métadonnées légères d’environnement d’authentification du fournisseur qu’OpenClaw peut inspecter sans charger le code du plugin.                                                                            |
| `providerAuthAliases`               | Non         | `Record<string, string>`         | IDs de fournisseurs qui doivent réutiliser un autre ID de fournisseur pour la recherche d’authentification, par exemple un fournisseur de code qui partage la clé API et les profils d’authentification du fournisseur de base. |
| `channelEnvVars`                    | Non         | `Record<string, string[]>`       | Métadonnées légères d’environnement de canal qu’OpenClaw peut inspecter sans charger le code du plugin. Utilisez ceci pour les surfaces de configuration ou d’authentification de canaux pilotés par variables d’environnement que les assistants génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`               | Non         | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’onboarding, la résolution du fournisseur préféré et le raccordement simple des options CLI.                                            |
| `activation`                        | Non         | `object`                         | Indices d’activation légers pour le chargement déclenché par un fournisseur, une commande, un canal, une route ou une capacité. Métadonnées uniquement ; l’exécution du plugin reste propriétaire du comportement réel. |
| `setup`                             | Non         | `object`                         | Descripteurs légers de configuration/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger l’exécution du plugin.                                                    |
| `qaRunners`                         | Non         | `object[]`                       | Descripteurs légers d’exécuteurs QA utilisés par l’hôte partagé `openclaw qa` avant le chargement de l’exécution du plugin.                                                                                 |
| `contracts`                         | Non         | `object`                         | Instantané statique des capacités intégrées pour la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération musicale, la génération vidéo, `web-fetch`, la recherche Web et la propriété des outils. |
| `channelConfigs`                    | Non         | `Record<string, object>`         | Métadonnées de configuration de canal appartenant au manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement de l’exécution.                                              |
| `skills`                            | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du plugin.                                                                                                                                              |
| `name`                              | Non         | `string`                         | Nom du plugin lisible par l’humain.                                                                                                                                                                            |
| `description`                       | Non         | `string`                         | Bref résumé affiché dans les surfaces de plugin.                                                                                                                                                               |
| `version`                           | Non         | `string`                         | Version informative du plugin.                                                                                                                                                                                 |
| `uiHints`                           | Non         | `Record<string, object>`         | Libellés d’interface, placeholders et indications de sensibilité pour les champs de configuration.                                                                                                            |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw lit cela avant le chargement de l’exécution du fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                              |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | ID du fournisseur auquel ce choix appartient.                                                              |
| `method`              | Oui         | `string`                                        | ID de la méthode d’authentification vers laquelle dispatcher.                                              |
| `choiceId`            | Oui         | `string`                                        | ID stable du choix d’authentification utilisé par les flux d’onboarding et CLI.                            |
| `choiceLabel`         | Non         | `string`                                        | Libellé destiné à l’utilisateur. S’il est omis, OpenClaw utilise `choiceId` par défaut.                   |
| `choiceHint`          | Non         | `string`                                        | Court texte d’aide pour le sélecteur.                                                                      |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs plus faibles sont triées en premier dans les sélecteurs interactifs pilotés par l’assistant.  |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque ce choix dans les sélecteurs de l’assistant tout en autorisant encore la sélection manuelle en CLI. |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | IDs hérités de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.                 |
| `groupId`             | Non         | `string`                                        | ID de groupe facultatif pour regrouper des choix liés.                                                     |
| `groupLabel`          | Non         | `string`                                        | Libellé destiné à l’utilisateur pour ce groupe.                                                            |
| `groupHint`           | Non         | `string`                                        | Court texte d’aide pour le groupe.                                                                         |
| `optionKey`           | Non         | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul flag.                             |
| `cliFlag`             | Non         | `string`                                        | Nom du flag CLI, tel que `--openrouter-api-key`.                                                           |
| `cliOption`           | Non         | `string`                                        | Forme complète de l’option CLI, telle que `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l’aide CLI.                                                                      |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d’onboarding ce choix doit apparaître. Si omis, la valeur par défaut est `["text-inference"]`. |

## Référence `commandAliases`

Utilisez `commandAliases` lorsqu’un plugin possède un nom de commande d’exécution que les utilisateurs peuvent, par erreur, placer dans `plugins.allow` ou essayer d’exécuter comme une commande CLI racine. OpenClaw utilise ces métadonnées pour les diagnostics sans importer le code d’exécution du plugin.

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
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme une commande slash de chat plutôt qu’une commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine associée à suggérer pour les opérations CLI, s’il en existe une. |

## Référence `activation`

Utilisez `activation` lorsque le plugin peut déclarer à faible coût quels événements du plan de contrôle doivent l’activer plus tard.

## Référence `qaRunners`

Utilisez `qaRunners` lorsqu’un plugin fournit un ou plusieurs exécuteurs de transport sous la racine partagée `openclaw qa`. Conservez ces métadonnées légères et statiques ; l’exécution du plugin reste propriétaire de l’enregistrement CLI réel via une surface légère `runtime-api.ts` qui exporte `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Exécuter la voie QA live Matrix, adossée à Docker, contre un homeserver jetable"
    }
  ]
}
```

| Champ         | Obligatoire | Type     | Signification                                                        |
| ------------- | ----------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.       |
| `description` | Non         | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande factice. |

Ce bloc est uniquement constitué de métadonnées. Il n’enregistre pas de comportement d’exécution et ne remplace pas `register(...)`, `setupEntry` ni d’autres points d’entrée d’exécution/plugin.
Les consommateurs actuels l’utilisent comme indice de réduction avant un chargement plus large du plugin ; des métadonnées d’activation manquantes n’ont donc généralement qu’un coût de performance et ne devraient pas modifier le comportement correct tant que les mécanismes hérités de repli de propriété du manifeste existent encore.

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

| Champ            | Obligatoire | Type                                                 | Signification                                                       |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `onProviders`    | Non         | `string[]`                                           | IDs de fournisseurs qui doivent activer ce plugin lorsqu’ils sont demandés. |
| `onCommands`     | Non         | `string[]`                                           | IDs de commandes qui doivent activer ce plugin.                     |
| `onChannels`     | Non         | `string[]`                                           | IDs de canaux qui doivent activer ce plugin.                        |
| `onRoutes`       | Non         | `string[]`                                           | Types de routes qui doivent activer ce plugin.                      |
| `onCapabilities` | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indices généraux de capacité utilisés par la planification d’activation du plan de contrôle. |

Consommateurs actifs actuels :

- la planification CLI déclenchée par une commande retombe sur les valeurs héritées
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification de configuration/de canal déclenchée par un canal retombe sur la propriété héritée `channels[]`
  lorsque les métadonnées explicites d’activation de canal sont absentes
- la planification de configuration/d’exécution déclenchée par un fournisseur retombe sur la propriété héritée
  `providers[]` et `cliBackends[]` de niveau supérieur lorsque les métadonnées explicites d’activation de fournisseur sont absentes

## Référence `setup`

Utilisez `setup` lorsque les surfaces de configuration et d’onboarding ont besoin de métadonnées légères appartenant au plugin avant le chargement de l’exécution.

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

Le champ `cliBackends` de niveau supérieur reste valide et continue de décrire les backends d’inférence CLI. `setup.cliBackends` est la surface de descripteur spécifique à la configuration pour les flux de configuration/plan de contrôle qui doivent rester purement fondés sur des métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` constituent la surface de recherche privilégiée, d’abord fondée sur les descripteurs, pour la découverte de la configuration. Si le descripteur ne fait que restreindre le plugin candidat et que la configuration a encore besoin de hooks d’exécution plus riches au moment de la configuration, définissez `requiresRuntime: true` et conservez `setup-api` comme chemin d’exécution de repli.

Comme la recherche de configuration peut exécuter du code `setup-api` appartenant au plugin, les valeurs normalisées de `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi les plugins découverts. En cas de propriété ambiguë, le système échoue de manière fermée au lieu de choisir un gagnant selon l’ordre de découverte.

### Référence `setup.providers`

| Champ         | Obligatoire | Type       | Signification                                                                        |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Oui         | `string`   | ID du fournisseur exposé pendant la configuration ou l’onboarding. Gardez les IDs normalisés globalement uniques. |
| `authMethods` | Non         | `string[]` | IDs de méthodes de configuration/authentification que ce fournisseur prend en charge sans charger l’exécution complète. |
| `envVars`     | Non         | `string[]` | Variables d’environnement que les surfaces génériques de configuration/statut peuvent vérifier avant le chargement de l’exécution du plugin. |

### Champs `setup`

| Champ              | Obligatoire | Type       | Signification                                                                                         |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Non         | `object[]` | Descripteurs de configuration de fournisseur exposés pendant la configuration et l’onboarding.        |
| `cliBackends`      | Non         | `string[]` | IDs de backend au moment de la configuration utilisés pour la recherche de configuration fondée d’abord sur les descripteurs. Gardez les IDs normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | IDs de migration de configuration appartenant à la surface de configuration de ce plugin.             |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration a encore besoin de l’exécution de `setup-api` après la recherche par descripteur. |

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
| `label`       | `string`   | Libellé du champ destiné à l’utilisateur. |
| `help`        | `string`   | Court texte d’aide.                     |
| `tags`        | `string[]` | Tags d’interface facultatifs.           |
| `advanced`    | `boolean`  | Marque le champ comme avancé.           |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte de placeholder pour les champs de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour des métadonnées statiques de propriété de capacités qu’OpenClaw peut lire sans importer l’exécution du plugin.

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

| Champ                            | Type       | Signification                                                  |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de fournisseurs de parole appartenant à ce plugin.         |
| `realtimeTranscriptionProviders` | `string[]` | IDs de fournisseurs de transcription en temps réel appartenant à ce plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de fournisseurs de voix en temps réel appartenant à ce plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de fournisseurs de compréhension des médias appartenant à ce plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de fournisseurs de génération d’images appartenant à ce plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de fournisseurs de génération vidéo appartenant à ce plugin. |
| `webFetchProviders`              | `string[]` | IDs de fournisseurs `web-fetch` appartenant à ce plugin.       |
| `webSearchProviders`             | `string[]` | IDs de fournisseurs de recherche Web appartenant à ce plugin.  |
| `tools`                          | `string[]` | Noms d’outils d’agent appartenant à ce plugin pour les vérifications de contrats intégrés. |

## Référence `channelConfigs`

Utilisez `channelConfigs` lorsqu’un plugin de canal a besoin de métadonnées de configuration légères avant le chargement de l’exécution.

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

| Champ         | Type                     | Signification                                                                              |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Obligatoire pour chaque entrée de configuration de canal déclarée. |
| `uiHints`     | `Record<string, object>` | Libellés/placeholders/indications de sensibilité d’interface facultatifs pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé du canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées d’exécution ne sont pas prêtes. |
| `description` | `string`                 | Courte description du canal pour les surfaces d’inspection et de catalogue.                |
| `preferOver`  | `string[]`               | IDs de plugins hérités ou de priorité inférieure que ce canal doit surpasser dans les surfaces de sélection. |

## Référence `modelSupport`

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre plugin fournisseur à partir d’IDs de modèles abrégés comme `gpt-5.4` ou `claude-sonnet-4.6` avant le chargement de l’exécution du plugin.

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
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un plugin non intégré et un plugin intégré correspondent tous deux, le plugin non intégré l’emporte
- toute ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux IDs de modèles abrégés.                  |
| `modelPatterns` | `string[]` | Sources regex comparées aux IDs de modèles abrégés après suppression du suffixe de profil. |

Les clés de capacité héritées de niveau supérieur sont obsolètes. Utilisez `openclaw doctor --fix` pour déplacer `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal du manifeste ne traite plus ces champs de niveau supérieur comme une propriété de capacité.

## Manifeste versus package.json

Les deux fichiers ont des rôles différents :

| Fichier                | Utilisation                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de la configuration, métadonnées de choix d’authentification et indications d’interface qui doivent exister avant l’exécution du code du plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, le contrôle d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où une métadonnée doit se trouver, appliquez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers d’entrée ou le comportement d’installation npm, placez-la dans `package.json`

### Champs `package.json` qui affectent la découverte

Certaines métadonnées de plugin avant exécution vivent intentionnellement dans `package.json` sous le bloc `openclaw` plutôt que dans `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d’entrée des plugins natifs.                                                                                              |
| `openclaw.setupEntry`                                             | Point d’entrée léger réservé à la configuration, utilisé pendant l’onboarding et le démarrage différé du canal.                             |
| `openclaw.channel`                                                | Métadonnées légères du catalogue de canaux comme les libellés, chemins de documentation, alias et texte de sélection.                       |
| `openclaw.channel.configuredState`                                | Métadonnées légères du vérificateur d’état configuré pouvant répondre à « une configuration uniquement via l’environnement existe-t-elle déjà ? » sans charger l’exécution complète du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères du vérificateur d’authentification persistée pouvant répondre à « y a-t-il déjà une session ouverte ? » sans charger l’exécution complète du canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d’installation/mise à jour pour les plugins intégrés et les plugins publiés en externe.                                         |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                     |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l’hôte OpenClaw, en utilisant un plancher semver comme `>=2026.3.22`.                                   |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin de récupération étroit de réinstallation de plugin intégré lorsque la configuration est invalide.                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet au démarrage.                      |

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement du registre de manifestes. Les valeurs invalides sont rejetées ; les valeurs valides mais plus récentes ignorent le plugin sur les hôtes plus anciens.

`openclaw.install.allowInvalidConfigRecovery` est volontairement limité. Il ne rend pas installables des configurations arbitrairement cassées. Aujourd’hui, il permet seulement aux flux d’installation de récupérer de certaines défaillances obsolètes de mise à niveau de plugin intégré, comme un chemin de plugin intégré manquant ou une entrée `channels.<id>` obsolète pour ce même plugin intégré. Les erreurs de configuration non liées continuent de bloquer l’installation et redirigent les opérateurs vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un minuscule module de vérification :

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

Utilisez-le lorsque les flux de configuration, de Doctor ou d’état configuré ont besoin d’une sonde d’authentification oui/non légère avant le chargement du plugin de canal complet. L’export cible doit être une petite fonction qui lit uniquement l’état persistant ; ne le faites pas passer par le barrel d’exécution du canal complet.

`openclaw.channel.configuredState` suit la même forme pour des vérifications légères d’état configuré uniquement via l’environnement :

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

Utilisez-le lorsqu’un canal peut répondre à l’état configuré à partir de l’environnement ou d’autres entrées non liées à l’exécution. Si la vérification nécessite la résolution complète de la configuration ou la véritable exécution du canal, conservez plutôt cette logique dans le hook `config.hasConfiguredState` du plugin.

## Exigences du schéma JSON

- **Chaque plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l’exécution.

## Comportement de validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l’ID du canal est déclaré par un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*` doivent référencer des IDs de plugin **découvrables**. Les IDs inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma cassé ou manquant, la validation échoue et Doctor signale l’erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et un **avertissement** apparaît dans Doctor + les logs.

Consultez la [Référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les Plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local.
- L’exécution charge toujours le module du plugin séparément ; le manifeste sert uniquement à la découverte + à la validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, les virgules finales et les clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez d’ajouter ici des clés personnalisées de niveau supérieur.
- `providerAuthEnvVars` est le chemin de métadonnées léger pour les sondes d’authentification, la validation des marqueurs d’environnement et les surfaces similaires d’authentification fournisseur qui ne doivent pas démarrer l’exécution du plugin simplement pour inspecter des noms de variables d’environnement.
- `providerAuthAliases` permet à des variantes de fournisseur de réutiliser les variables d’environnement d’authentification, les profils d’authentification, l’authentification adossée à la configuration et le choix d’onboarding de clé API d’un autre fournisseur sans coder cette relation en dur dans le cœur.
- `providerEndpoints` permet aux plugins fournisseurs d’être propriétaires de métadonnées simples de correspondance d’hôte/baseUrl de point de terminaison. Utilisez-le uniquement pour les classes de points de terminaison déjà prises en charge par le cœur ; le plugin reste propriétaire du comportement d’exécution.
- `syntheticAuthRefs` est le chemin de métadonnées léger pour les hooks d’authentification synthétique appartenant au fournisseur qui doivent être visibles pour la découverte à froid des modèles avant que le registre d’exécution n’existe. N’indiquez que les références dont le fournisseur d’exécution ou le backend CLI implémente réellement `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` est le chemin de métadonnées léger pour les clés API d’espace réservé appartenant aux plugins intégrés, comme les marqueurs d’identifiants locaux, OAuth ou ambiants. Le cœur les traite comme non secrètes pour l’affichage de l’authentification et les audits de secrets sans coder en dur le fournisseur propriétaire.
- `channelEnvVars` est le chemin de métadonnées léger pour le repli via variables d’environnement du shell, les invites de configuration et les surfaces de canal similaires qui ne doivent pas démarrer l’exécution du plugin simplement pour inspecter des noms de variables d’environnement.
- `providerAuthChoices` est le chemin de métadonnées léger pour les sélecteurs de choix d’authentification, la résolution de `--auth-choice`, le mappage du fournisseur préféré et l’enregistrement simple de flags CLI d’onboarding avant le chargement de l’exécution du fournisseur. Pour les métadonnées d’assistant d’exécution qui nécessitent du code fournisseur, consultez
  [Hooks d’exécution du fournisseur](/fr/plugins/architecture#provider-runtime-hooks).
- Les types de plugin exclusifs sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers`, `cliBackends` et `skills` peuvent être omis lorsqu’un plugin n’en a pas besoin.
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toute exigence de liste d’autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Lié

- [Créer des Plugins](/fr/plugins/building-plugins) — bien démarrer avec les plugins
- [Architecture des Plugins](/fr/plugins/architecture) — architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK de Plugin
