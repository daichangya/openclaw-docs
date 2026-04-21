---
read_when:
    - Vous créez un plugin OpenClaw
    - Vous devez livrer un schéma de configuration de plugin ou déboguer des erreurs de validation du plugin
summary: Exigences du manifeste de Plugin + schéma JSON (validation stricte de la configuration)
title: Manifeste de Plugin
x-i18n:
    generated_at: "2026-04-21T19:20:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304c08035724dfb1ce6349972729b621aafc00880d4d259db78c22b86e9056ba
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifeste de Plugin (`openclaw.plugin.json`)

Cette page concerne uniquement le **manifeste de plugin OpenClaw natif**.

Pour les mises en page de bundles compatibles, voir [Bundles de plugins](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la mise en page par défaut du composant Claude
  sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement ces mises en page de bundle également, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de skills déclarées, les racines de commandes Claude, les valeurs par défaut de `settings.json` des bundles Claude,
les valeurs par défaut LSP des bundles Claude, et les packs de hooks pris en charge lorsque la mise en page correspond
aux attentes d'exécution d'OpenClaw.

Chaque plugin OpenClaw natif **doit** inclure un fichier `openclaw.plugin.json` dans la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du plugin**. Les manifestes manquants ou invalides sont traités comme
des erreurs de plugin et bloquent la validation de la configuration.

Voir le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle de capacités natif et les indications actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## Ce que fait ce fichier

`openclaw.plugin.json` contient les métadonnées qu'OpenClaw lit avant de charger le
code de votre plugin.

Utilisez-le pour :

- l'identité du plugin
- la validation de la configuration
- les métadonnées d'authentification et d'onboarding qui doivent être disponibles sans démarrer l'environnement d'exécution du plugin
- les indications d'activation peu coûteuses que les surfaces du plan de contrôle peuvent inspecter avant le chargement de l'environnement d'exécution
- les descripteurs de configuration peu coûteux que les surfaces de configuration/onboarding peuvent inspecter avant le chargement de l'environnement d'exécution
- les métadonnées d'alias et d'activation automatique qui doivent être résolues avant le chargement de l'environnement d'exécution du plugin
- les métadonnées abrégées de propriété de famille de modèles qui doivent activer automatiquement le
  plugin avant le chargement de l'environnement d'exécution
- les instantanés statiques de propriété de capacités utilisés pour le câblage de compatibilité des plugins intégrés et la couverture des contrats
- les métadonnées peu coûteuses du lanceur QA que l'hôte partagé `openclaw qa` peut inspecter
  avant le chargement de l'environnement d'exécution du plugin
- les métadonnées de configuration spécifiques aux canaux qui doivent être fusionnées dans les
  surfaces de catalogue et de validation sans charger l'environnement d'exécution
- les indications d'interface utilisateur pour la configuration

Ne l'utilisez pas pour :

- enregistrer le comportement d'exécution
- déclarer les points d'entrée du code
- les métadonnées d'installation npm

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
  "description": "OpenRouter provider plugin",
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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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

| Champ                               | Obligatoire | Type                             | Signification                                                                                                                                                                                                 |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Oui         | `string`                         | ID canonique du plugin. C'est l'ID utilisé dans `plugins.entries.<id>`.                                                                                                                                       |
| `configSchema`                      | Oui         | `object`                         | Schéma JSON intégré pour la configuration de ce plugin.                                                                                                                                                       |
| `enabledByDefault`                  | Non         | `true`                           | Indique qu'un plugin intégré est activé par défaut. Omettez-le, ou définissez toute valeur différente de `true`, pour laisser le plugin désactivé par défaut.                                              |
| `legacyPluginIds`                   | Non         | `string[]`                       | IDs historiques normalisés vers cet ID de plugin canonique.                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders` | Non         | `string[]`                       | IDs de providers qui doivent activer automatiquement ce plugin lorsque l'authentification, la configuration ou les références de modèle les mentionnent.                                                     |
| `kind`                              | Non         | `"memory"` \| `"context-engine"` | Déclare un type de plugin exclusif utilisé par `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | Non         | `string[]`                       | IDs de canaux appartenant à ce plugin. Utilisés pour la découverte et la validation de la configuration.                                                                                                      |
| `providers`                         | Non         | `string[]`                       | IDs de providers appartenant à ce plugin.                                                                                                                                                                     |
| `modelSupport`                      | Non         | `object`                         | Métadonnées abrégées de famille de modèles appartenant au manifeste, utilisées pour charger automatiquement le plugin avant l'environnement d'exécution.                                                      |
| `providerEndpoints`                 | Non         | `object[]`                       | Métadonnées d'hôte/baseUrl d'endpoint appartenant au manifeste pour les routes de provider que le noyau doit classifier avant le chargement de l'environnement d'exécution du provider.                      |
| `cliBackends`                       | Non         | `string[]`                       | IDs de backends d'inférence CLI appartenant à ce plugin. Utilisés pour l'auto-activation au démarrage à partir de références de configuration explicites.                                                   |
| `syntheticAuthRefs`                 | Non         | `string[]`                       | Références de provider ou de backend CLI dont le hook d'authentification synthétique appartenant au plugin doit être sondé pendant la découverte à froid des modèles avant le chargement de l'environnement d'exécution. |
| `nonSecretAuthMarkers`              | Non         | `string[]`                       | Valeurs d'espace réservé de clé API appartenant à un plugin intégré qui représentent un état d'identifiants local, OAuth ou ambiant non secret.                                                             |
| `commandAliases`                    | Non         | `object[]`                       | Noms de commandes appartenant à ce plugin qui doivent produire une configuration tenant compte du plugin et des diagnostics CLI avant le chargement de l'environnement d'exécution.                           |
| `providerAuthEnvVars`               | Non         | `Record<string, string[]>`       | Métadonnées légères de variables d'environnement d'authentification de provider qu'OpenClaw peut inspecter sans charger le code du plugin.                                                                   |
| `providerAuthAliases`               | Non         | `Record<string, string>`         | IDs de providers qui doivent réutiliser un autre ID de provider pour la recherche d'authentification, par exemple un provider de code qui partage la clé API et les profils d'authentification du provider de base. |
| `channelEnvVars`                    | Non         | `Record<string, string[]>`       | Métadonnées légères de variables d'environnement de canal qu'OpenClaw peut inspecter sans charger le code du plugin. Utilisez ceci pour la configuration de canal pilotée par env ou les surfaces d'authentification que les aides génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`               | Non         | `object[]`                       | Métadonnées légères de choix d'authentification pour les sélecteurs d'onboarding, la résolution du provider préféré et le câblage simple des drapeaux CLI.                                                   |
| `activation`                        | Non         | `object`                         | Indications légères d'activation pour le chargement déclenché par provider, commande, canal, route et capacité. Métadonnées uniquement ; l'environnement d'exécution du plugin reste responsable du comportement réel. |
| `setup`                             | Non         | `object`                         | Descripteurs légers de configuration/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger l'environnement d'exécution du plugin.                                      |
| `qaRunners`                         | Non         | `object[]`                       | Descripteurs légers de lanceurs QA utilisés par l'hôte partagé `openclaw qa` avant le chargement de l'environnement d'exécution du plugin.                                                                   |
| `contracts`                         | Non         | `object`                         | Instantané statique des capacités intégrées pour la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d'images, la génération de musique, la génération de vidéos, la récupération Web, la recherche Web et la propriété des outils. |
| `channelConfigs`                    | Non         | `Record<string, object>`         | Métadonnées de configuration de canal appartenant au manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement de l'environnement d'exécution.                               |
| `skills`                            | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du plugin.                                                                                                                                              |
| `name`                              | Non         | `string`                         | Nom lisible du plugin.                                                                                                                                                                                        |
| `description`                       | Non         | `string`                         | Résumé court affiché dans les surfaces de plugin.                                                                                                                                                             |
| `version`                           | Non         | `string`                         | Version informative du plugin.                                                                                                                                                                                |
| `uiHints`                           | Non         | `Record<string, object>`         | Libellés d'interface utilisateur, espaces réservés et indications de sensibilité pour les champs de configuration.                                                                                           |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d'onboarding ou d'authentification.
OpenClaw lit ceci avant le chargement de l'environnement d'exécution du provider.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                             |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | ID du provider auquel ce choix appartient.                                                                |
| `method`              | Oui         | `string`                                        | ID de méthode d'authentification vers lequel répartir.                                                    |
| `choiceId`            | Oui         | `string`                                        | ID stable de choix d'authentification utilisé par les flux d'onboarding et CLI.                           |
| `choiceLabel`         | Non         | `string`                                        | Libellé destiné à l'utilisateur. S'il est omis, OpenClaw utilise `choiceId` comme repli.                 |
| `choiceHint`          | Non         | `string`                                        | Court texte d'aide pour le sélecteur.                                                                     |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs les plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l'assistant. |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs de l'assistant tout en autorisant la sélection manuelle via la CLI.  |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | IDs historiques de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.           |
| `groupId`             | Non         | `string`                                        | ID de groupe facultatif pour regrouper des choix liés.                                                    |
| `groupLabel`          | Non         | `string`                                        | Libellé destiné à l'utilisateur pour ce groupe.                                                           |
| `groupHint`           | Non         | `string`                                        | Court texte d'aide pour le groupe.                                                                        |
| `optionKey`           | Non         | `string`                                        | Clé d'option interne pour les flux d'authentification simples à un seul drapeau.                          |
| `cliFlag`             | Non         | `string`                                        | Nom du drapeau CLI, tel que `--openrouter-api-key`.                                                       |
| `cliOption`           | Non         | `string`                                        | Forme complète de l'option CLI, telle que `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l'aide CLI.                                                                     |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d'onboarding ce choix doit apparaître. Si omis, la valeur par défaut est `["text-inference"]`. |

## Référence `commandAliases`

Utilisez `commandAliases` lorsqu'un plugin possède un nom de commande d'exécution que les utilisateurs peuvent
par erreur placer dans `plugins.allow` ou essayer d'exécuter comme commande CLI racine. OpenClaw
utilise ces métadonnées pour les diagnostics sans importer le code d'exécution du plugin.

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
| `name`       | Oui         | `string`          | Nom de commande appartenant à ce plugin.                                   |
| `kind`       | Non         | `"runtime-slash"` | Marque l'alias comme une commande slash de chat plutôt qu'une commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine liée à suggérer pour les opérations CLI, si elle existe. |

## Référence `activation`

Utilisez `activation` lorsque le plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l'activer plus tard.

## Référence `qaRunners`

Utilisez `qaRunners` lorsqu'un plugin fournit un ou plusieurs lanceurs de transport sous la racine partagée
`openclaw qa`. Gardez ces métadonnées légères et statiques ; l'environnement d'exécution du plugin
reste responsable de l'enregistrement CLI réel via une surface légère
`runtime-api.ts` qui exporte `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Exécuter la voie QA Matrix en direct, adossée à Docker, sur un homeserver jetable"
    }
  ]
}
```

| Champ         | Obligatoire | Type     | Signification                                                       |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.      |
| `description` | Non         | `string` | Texte d'aide de repli utilisé lorsque l'hôte partagé a besoin d'une commande factice. |

Ce bloc ne contient que des métadonnées. Il n'enregistre pas de comportement d'exécution et
ne remplace pas `register(...)`, `setupEntry` ni les autres points d'entrée d'exécution/de plugin.
Les consommateurs actuels l'utilisent comme indication de réduction avant un chargement plus large du plugin, donc
l'absence de métadonnées d'activation ne coûte généralement que des performances ; elle ne devrait pas
modifier la correction tant que les mécanismes de repli historiques de propriété du manifeste existent encore.

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
| `onProviders`    | Non         | `string[]`                                           | IDs de providers qui doivent activer ce plugin lorsqu'ils sont demandés. |
| `onCommands`     | Non         | `string[]`                                           | IDs de commandes qui doivent activer ce plugin.                    |
| `onChannels`     | Non         | `string[]`                                           | IDs de canaux qui doivent activer ce plugin.                       |
| `onRoutes`       | Non         | `string[]`                                           | Types de routes qui doivent activer ce plugin.                     |
| `onCapabilities` | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications larges de capacité utilisées par la planification de l'activation du plan de contrôle. |

Consommateurs actifs actuels :

- la planification CLI déclenchée par commande revient en repli à
  `commandAliases[].cliCommand` ou `commandAliases[].name`
- la planification de configuration/de canal déclenchée par canal revient en repli à la propriété historique
  `channels[]` lorsque les métadonnées d'activation explicites du canal sont absentes
- la planification de configuration/d'exécution déclenchée par provider revient en repli à la propriété historique
  `providers[]` et à la propriété de premier niveau `cliBackends[]` lorsque les métadonnées d'activation
  explicites du provider sont absentes

## Référence `setup`

Utilisez `setup` lorsque les surfaces de configuration et d'onboarding ont besoin de métadonnées légères appartenant au plugin
avant le chargement de l'environnement d'exécution.

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

La propriété de premier niveau `cliBackends` reste valide et continue de décrire les
backends d'inférence CLI. `setup.cliBackends` est la surface de descripteur spécifique à la configuration pour les
flux de plan de contrôle/configuration qui doivent rester uniquement des métadonnées.

Lorsqu'ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface de recherche
préférée, orientée descripteur d'abord, pour la découverte de configuration. Si le descripteur ne fait que
restreindre le plugin candidat et que la configuration a encore besoin de hooks d'exécution plus riches au moment de la configuration,
définissez `requiresRuntime: true` et conservez `setup-api` comme
chemin d'exécution de repli.

Comme la recherche de configuration peut exécuter le code `setup-api` appartenant au plugin,
les valeurs normalisées de `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques parmi
les plugins découverts. Une propriété ambiguë échoue en mode fermé au lieu de choisir un
gagnant selon l'ordre de découverte.

### Référence `setup.providers`

| Champ         | Obligatoire | Type       | Signification                                                                              |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------------ |
| `id`          | Oui         | `string`   | ID de provider exposé pendant la configuration ou l'onboarding. Gardez les IDs normalisés globalement uniques. |
| `authMethods` | Non         | `string[]` | IDs de méthodes de configuration/authentification prises en charge par ce provider sans charger l'environnement d'exécution complet. |
| `envVars`     | Non         | `string[]` | Variables d'environnement que les surfaces génériques de configuration/statut peuvent vérifier avant le chargement de l'environnement d'exécution du plugin. |

### Champs `setup`

| Champ              | Obligatoire | Type       | Signification                                                                                          |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `providers`        | Non         | `object[]` | Descripteurs de configuration de provider exposés pendant la configuration et l'onboarding.            |
| `cliBackends`      | Non         | `string[]` | IDs de backend au moment de la configuration utilisés pour la recherche de configuration orientée descripteur d'abord. Gardez les IDs normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | IDs de migration de configuration appartenant à la surface de configuration de ce plugin.              |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration a encore besoin de l'exécution de `setup-api` après la recherche par descripteur. |

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

| Champ         | Type       | Signification                              |
| ------------- | ---------- | ------------------------------------------ |
| `label`       | `string`   | Libellé du champ destiné à l'utilisateur.  |
| `help`        | `string`   | Court texte d'aide.                        |
| `tags`        | `string[]` | Balises d'interface utilisateur facultatives. |
| `advanced`    | `boolean`  | Marque le champ comme avancé.              |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible.  |
| `placeholder` | `string`   | Texte d'espace réservé pour les champs de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété des capacités qu'OpenClaw peut
lire sans importer l'environnement d'exécution du plugin.

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
| `speechProviders`                | `string[]` | IDs de providers de parole appartenant à ce plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | IDs de providers de transcription en temps réel appartenant à ce plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de providers de voix en temps réel appartenant à ce plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de providers de compréhension des médias appartenant à ce plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de providers de génération d'images appartenant à ce plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de providers de génération de vidéos appartenant à ce plugin. |
| `webFetchProviders`              | `string[]` | IDs de providers de récupération Web appartenant à ce plugin.  |
| `webSearchProviders`             | `string[]` | IDs de providers de recherche Web appartenant à ce plugin.     |
| `tools`                          | `string[]` | Noms d'outils d'agent appartenant à ce plugin pour les vérifications de contrat des plugins intégrés. |

## Référence `channelConfigs`

Utilisez `channelConfigs` lorsqu'un plugin de canal a besoin de métadonnées de configuration légères avant
le chargement de l'environnement d'exécution.

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
| `uiHints`     | `Record<string, object>` | Libellés d'interface utilisateur/espaces réservés/indications de sensibilité facultatifs pour cette section de configuration du canal. |
| `label`       | `string`                 | Libellé du canal fusionné dans les surfaces de sélection et d'inspection lorsque les métadonnées d'exécution ne sont pas prêtes. |
| `description` | `string`                 | Description courte du canal pour les surfaces d'inspection et de catalogue.                |
| `preferOver`  | `string[]`               | IDs de plugins historiques ou de priorité plus faible que ce canal doit devancer dans les surfaces de sélection. |

## Référence `modelSupport`

Utilisez `modelSupport` lorsqu'OpenClaw doit déduire votre plugin provider à partir
d'IDs de modèle abrégés comme `gpt-5.4` ou `claude-sonnet-4.6` avant le chargement de l'environnement d'exécution du plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cette priorité :

- les références explicites `provider/model` utilisent les métadonnées de manifeste `providers` du propriétaire
- `modelPatterns` a priorité sur `modelPrefixes`
- si un plugin non intégré et un plugin intégré correspondent tous deux, le plugin non intégré
  l'emporte
- toute ambiguïté restante est ignorée jusqu'à ce que l'utilisateur ou la configuration spécifie un provider

Champs :

| Champ           | Type       | Signification                                                                    |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux IDs de modèle abrégés.                   |
| `modelPatterns` | `string[]` | Sources regex comparées aux IDs de modèle abrégés après suppression du suffixe de profil. |

Les clés de capacité historiques de premier niveau sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal
du manifeste ne traite plus ces champs de premier niveau comme la propriété
de capacités.

## Manifeste versus package.json

Les deux fichiers ont des rôles différents :

| Fichier                | Utilisation                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de la configuration, métadonnées de choix d'authentification et indications d'interface utilisateur qui doivent exister avant l'exécution du code du plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d'entrée, le contrôle d'installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où une métadonnée doit aller, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers de point d'entrée ou le comportement d'installation npm, placez-la dans `package.json`

### Champs `package.json` qui affectent la découverte

Certaines métadonnées de plugin avant exécution se trouvent intentionnellement dans `package.json` sous le bloc
`openclaw` plutôt que dans `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d'entrée de plugin natifs.                                                                                                |
| `openclaw.setupEntry`                                             | Point d'entrée léger réservé à la configuration utilisé pendant l'onboarding, le démarrage différé des canaux et la découverte en lecture seule de l'état du canal/SecretRef. |
| `openclaw.channel`                                                | Métadonnées légères du catalogue de canaux comme les libellés, chemins de documentation, alias et texte de sélection.                       |
| `openclaw.channel.configuredState`                                | Métadonnées légères de vérification de l'état configuré pouvant répondre à « une configuration uniquement par env existe-t-elle déjà ? » sans charger l'environnement d'exécution complet du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères de vérification de l'état d'authentification persistant pouvant répondre à « quelque chose est-il déjà connecté ? » sans charger l'environnement d'exécution complet du canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d'installation/mise à jour pour les plugins intégrés et publiés en externe.                                                     |
| `openclaw.install.defaultChoice`                                  | Chemin d'installation préféré lorsque plusieurs sources d'installation sont disponibles.                                                     |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l'hôte OpenClaw, avec une borne semver comme `>=2026.3.22`.                                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin étroit de récupération de réinstallation de plugin intégré lorsque la configuration est invalide.                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet pendant le démarrage.              |

`openclaw.install.minHostVersion` est appliqué lors de l'installation et du chargement du registre
de manifestes. Les valeurs invalides sont rejetées ; les valeurs valides mais plus récentes ignorent le
plugin sur les hôtes plus anciens.

Les plugins de canal doivent fournir `openclaw.setupEntry` lorsque le statut, la liste des canaux
ou les analyses SecretRef doivent identifier les comptes configurés sans charger l'environnement d'exécution complet.
Le point d'entrée de configuration doit exposer les métadonnées du canal ainsi que des adaptateurs sûrs pour la configuration,
le statut et les secrets ; gardez les clients réseau, les écouteurs Gateway et les environnements d'exécution de transport
dans le point d'entrée principal de l'extension.

`openclaw.install.allowInvalidConfigRecovery` est volontairement limité. Il
ne rend pas installables des configurations arbitrairement cassées. Aujourd'hui, il permet uniquement aux flux d'installation
de récupérer de certains échecs anciens de mise à niveau de plugins intégrés, comme un chemin de plugin intégré manquant ou une entrée
`channels.<id>` obsolète pour ce même plugin intégré. Les erreurs de configuration sans rapport bloquent toujours l'installation et orientent les opérateurs
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

Utilisez-le lorsque les flux de configuration, doctor ou d'état configuré ont besoin d'une
sonde d'authentification légère oui/non avant le chargement du plugin de canal complet. L'export cible doit être une petite
fonction qui lit uniquement l'état persistant ; ne la faites pas passer par le barrel d'environnement d'exécution complet du
canal.

`openclaw.channel.configuredState` suit la même structure pour des vérifications légères
d'état configuré uniquement par env :

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

Utilisez-le lorsqu'un canal peut répondre à l'état configuré à partir de env ou d'autres entrées minuscules
hors environnement d'exécution. Si la vérification a besoin de la résolution complète de la configuration ou du véritable
environnement d'exécution du canal, gardez cette logique dans le hook `config.hasConfiguredState`
du plugin à la place.

## Exigences du schéma JSON

- **Chaque plugin doit inclure un schéma JSON**, même s'il n'accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l'exécution.

## Comportement de validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l'ID du canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des IDs de plugin **détectables**. Les IDs inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l'erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est remonté dans Doctor + les journaux.

Voir [Référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les plugins OpenClaw natifs**, y compris les chargements depuis le système de fichiers local.
- L'environnement d'exécution charge toujours séparément le module du plugin ; le manifeste sert uniquement à la
  découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, virgules finales et
  clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez d'ajouter
  ici des clés de premier niveau personnalisées.
- `providerAuthEnvVars` est le chemin de métadonnées léger pour les sondes d'authentification, la
  validation des marqueurs env et les surfaces similaires d'authentification de provider qui ne doivent pas démarrer l'environnement d'exécution du plugin
  uniquement pour inspecter les noms env.
- `providerAuthAliases` permet à des variantes de provider de réutiliser les variables d'environnement d'authentification,
  profils d'authentification, authentification adossée à la configuration et choix d'onboarding par clé API d'un autre provider
  sans coder en dur cette relation dans le noyau.
- `providerEndpoints` permet aux plugins provider de posséder de simples métadonnées de
  correspondance d'hôte/baseUrl d'endpoint. Utilisez-le uniquement pour les classes d'endpoint déjà prises en charge par le noyau ;
  le plugin reste responsable du comportement d'exécution.
- `syntheticAuthRefs` est le chemin de métadonnées léger pour les hooks d'authentification synthétique appartenant au provider
  qui doivent être visibles pour la découverte à froid des modèles avant l'existence du registre d'exécution.
  Ne listez que les références dont le provider d'exécution ou le backend CLI implémente réellement
  `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` est le chemin de métadonnées léger pour les clés API d'espace réservé appartenant à des plugins intégrés
  telles que les marqueurs d'identifiants locaux, OAuth ou ambiants.
  Le noyau les traite comme non secrètes pour l'affichage d'authentification et les audits de secrets sans
  coder en dur le provider propriétaire.
- `channelEnvVars` est le chemin de métadonnées léger pour le repli shell-env, les invites de configuration
  et les surfaces de canal similaires qui ne doivent pas démarrer l'environnement d'exécution du plugin
  uniquement pour inspecter les noms env.
- `providerAuthChoices` est le chemin de métadonnées léger pour les sélecteurs de choix d'authentification,
  la résolution de `--auth-choice`, le mappage du provider préféré et l'enregistrement simple
  des drapeaux CLI d'onboarding avant le chargement de l'environnement d'exécution du provider. Pour les métadonnées
  d'assistant d'exécution qui nécessitent du code provider, voir
  [Hooks d'exécution du provider](/fr/plugins/architecture#provider-runtime-hooks).
- Les types exclusifs de plugin sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers`, `cliBackends` et `skills` peuvent être omis lorsqu'un
  plugin n'en a pas besoin.
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toute
  exigence de liste d'autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Lié

- [Créer des plugins](/fr/plugins/building-plugins) — prise en main des plugins
- [Architecture des plugins](/fr/plugins/architecture) — architecture interne
- [Vue d'ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK de Plugin
