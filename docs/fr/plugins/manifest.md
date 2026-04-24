---
read_when:
    - Vous créez un plugin OpenClaw
    - Vous devez fournir un schéma de configuration de plugin ou déboguer des erreurs de validation de plugin
summary: Manifeste de plugin + exigences du schéma JSON (validation stricte de la configuration)
title: Manifeste de plugin
x-i18n:
    generated_at: "2026-04-24T07:22:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

Cette page concerne uniquement le **manifeste de plugin natif OpenClaw**.

Pour les formats de bundle compatibles, voir [Plugin bundles](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition par défaut des composants Claude
  sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement aussi ces dispositions de bundle, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de skill déclarées, les racines de commande Claude, les valeurs par défaut de `settings.json` des bundles Claude,
les valeurs par défaut LSP des bundles Claude et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes du runtime OpenClaw.

Chaque plugin natif OpenClaw **doit** fournir un fichier `openclaw.plugin.json` à la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du plugin**. Les manifestes manquants ou invalides sont traités comme
des erreurs de plugin et bloquent la validation de la configuration.

Voir le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle de capacités natif et les recommandations actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## À quoi sert ce fichier

`openclaw.plugin.json` est la métadonnée qu’OpenClaw lit **avant de charger le
code de votre plugin**. Tout ce qui suit doit être suffisamment peu coûteux à inspecter sans démarrer le
runtime du plugin.

**À utiliser pour :**

- l’identité du plugin, la validation de configuration et les indications d’interface pour la configuration
- les métadonnées d’authentification, d’onboarding et de configuration initiale (alias, activation automatique, variables d’environnement du fournisseur, choix d’authentification)
- les indications d’activation pour les surfaces du plan de contrôle
- la propriété abrégée des familles de modèles
- les instantanés statiques de propriété des capacités (`contracts`)
- les métadonnées du lanceur QA que l’hôte partagé `openclaw qa` peut inspecter
- les métadonnées de configuration spécifiques au canal fusionnées dans le catalogue et les surfaces de validation

**À ne pas utiliser pour :** enregistrer un comportement runtime, déclarer des points d’entrée de code,
ou des métadonnées d’installation npm. Cela relève du code de votre plugin et de `package.json`.

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

## Exemple riche

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

| Field                                | Obligatoire | Type                             | Signification                                                                                                                                                                                                                     |
| ------------------------------------ | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Oui         | `string`                         | Identifiant canonique du plugin. C’est l’identifiant utilisé dans `plugins.entries.<id>`.                                                                                                                                       |
| `configSchema`                       | Oui         | `object`                         | Schéma JSON inline pour la configuration de ce plugin.                                                                                                                                                                            |
| `enabledByDefault`                   | Non         | `true`                           | Marque un plugin inclus comme activé par défaut. Omettez-le, ou définissez n’importe quelle valeur différente de `true`, pour laisser le plugin désactivé par défaut.                                                           |
| `legacyPluginIds`                    | Non         | `string[]`                       | Identifiants hérités qui se normalisent vers cet identifiant canonique de plugin.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Non         | `string[]`                       | Identifiants de fournisseurs qui doivent activer automatiquement ce plugin lorsque l’authentification, la configuration ou les références de modèle les mentionnent.                                                             |
| `kind`                               | Non         | `"memory"` \| `"context-engine"` | Déclare un type de plugin exclusif utilisé par `plugins.slots.*`.                                                                                                                                                                 |
| `channels`                           | Non         | `string[]`                       | Identifiants de canaux possédés par ce plugin. Utilisé pour la découverte et la validation de configuration.                                                                                                                    |
| `providers`                          | Non         | `string[]`                       | Identifiants de fournisseurs possédés par ce plugin.                                                                                                                                                                              |
| `providerDiscoveryEntry`             | Non         | `string`                         | Chemin de module léger de découverte de fournisseur, relatif à la racine du plugin, pour les métadonnées de catalogue de fournisseur à portée du manifeste qui peuvent être chargées sans activer le runtime complet du plugin. |
| `modelSupport`                       | Non         | `object`                         | Métadonnées abrégées des familles de modèles appartenant au manifeste, utilisées pour charger automatiquement le plugin avant le runtime.                                                                                       |
| `providerEndpoints`                  | Non         | `object[]`                       | Métadonnées d’hôte/baseUrl des points de terminaison appartenant au manifeste pour les routes fournisseur que le cœur doit classifier avant le chargement du runtime fournisseur.                                               |
| `cliBackends`                        | Non         | `string[]`                       | Identifiants de backend d’inférence CLI possédés par ce plugin. Utilisés pour l’activation automatique au démarrage à partir de références de configuration explicites.                                                         |
| `syntheticAuthRefs`                  | Non         | `string[]`                       | Références de fournisseur ou de backend CLI dont le hook d’authentification synthétique appartenant au plugin doit être sondé pendant la découverte à froid des modèles avant le chargement du runtime.                       |
| `nonSecretAuthMarkers`               | Non         | `string[]`                       | Valeurs de clé API factices appartenant au plugin inclus qui représentent un état d’identifiants locaux, OAuth ou ambiants non secret.                                                                                        |
| `commandAliases`                     | Non         | `object[]`                       | Noms de commandes possédés par ce plugin qui doivent produire des diagnostics de configuration et de CLI conscients du plugin avant le chargement du runtime.                                                                  |
| `providerAuthEnvVars`                | Non         | `Record<string, string[]>`       | Métadonnées légères de variables d’environnement d’authentification fournisseur qu’OpenClaw peut inspecter sans charger le code du plugin.                                                                                    |
| `providerAuthAliases`                | Non         | `Record<string, string>`         | Identifiants de fournisseurs qui doivent réutiliser un autre identifiant de fournisseur pour la recherche d’authentification, par exemple un fournisseur de programmation qui partage la clé API et les profils d’authentification du fournisseur de base. |
| `channelEnvVars`                     | Non         | `Record<string, string[]>`       | Métadonnées légères de variables d’environnement de canal qu’OpenClaw peut inspecter sans charger le code du plugin. Utilisez cela pour les surfaces de configuration ou d’authentification de canal pilotées par l’environnement que les assistants génériques de démarrage/configuration doivent voir. |
| `providerAuthChoices`                | Non         | `object[]`                       | Métadonnées légères des choix d’authentification pour les sélecteurs d’onboarding, la résolution du fournisseur préféré et le câblage simple des options CLI.                                                                  |
| `activation`                         | Non         | `object`                         | Métadonnées légères du planificateur d’activation pour le chargement déclenché par fournisseur, commande, canal, route et capacité. Métadonnées uniquement ; le runtime du plugin reste propriétaire du comportement réel. |
| `setup`                              | Non         | `object`                         | Descripteurs légers de configuration initiale/onboarding que les surfaces de découverte et de configuration peuvent inspecter sans charger le runtime du plugin.                                                                |
| `qaRunners`                          | Non         | `object[]`                       | Descripteurs légers de lanceur QA utilisés par l’hôte partagé `openclaw qa` avant le chargement du runtime du plugin.                                                                                                           |
| `contracts`                          | Non         | `object`                         | Instantané statique des capacités incluses pour les hooks d’authentification externes, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération musicale, la génération vidéo, la récupération web, la recherche web et la propriété des outils. |
| `mediaUnderstandingProviderMetadata` | Non         | `Record<string, object>`         | Valeurs par défaut légères de compréhension des médias pour les identifiants de fournisseurs déclarés dans `contracts.mediaUnderstandingProviders`.                                                                              |
| `channelConfigs`                     | Non         | `Record<string, object>`         | Métadonnées de configuration de canal appartenant au manifeste fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                                                                      |
| `skills`                             | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du plugin.                                                                                                                                                                  |
| `name`                               | Non         | `string`                         | Nom de plugin lisible par l’humain.                                                                                                                                                                                                |
| `description`                        | Non         | `string`                         | Résumé court affiché dans les surfaces de plugin.                                                                                                                                                                                  |
| `version`                            | Non         | `string`                         | Version informative du plugin.                                                                                                                                                                                                     |
| `uiHints`                            | Non         | `Record<string, object>`         | Libellés d’interface, placeholders et indications de sensibilité pour les champs de configuration.                                                                                                                               |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw lit cela avant le chargement du runtime fournisseur.

| Field                 | Obligatoire | Type                                            | Signification                                                                                            |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | Identifiant du fournisseur auquel appartient ce choix.                                                   |
| `method`              | Oui         | `string`                                        | Identifiant de la méthode d’authentification à laquelle dispatcher.                                      |
| `choiceId`            | Oui         | `string`                                        | Identifiant stable du choix d’authentification utilisé par les flux d’onboarding et CLI.                |
| `choiceLabel`         | Non         | `string`                                        | Libellé visible par l’utilisateur. S’il est omis, OpenClaw revient à `choiceId`.                        |
| `choiceHint`          | Non         | `string`                                        | Court texte d’aide pour le sélecteur.                                                                    |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs plus faibles sont triées en premier dans les sélecteurs interactifs pilotés par assistant. |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs d’assistant tout en autorisant la sélection manuelle via CLI.       |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | Identifiants de choix hérités qui doivent rediriger les utilisateurs vers ce choix de remplacement.     |
| `groupId`             | Non         | `string`                                        | Identifiant de groupe facultatif pour regrouper des choix liés.                                          |
| `groupLabel`          | Non         | `string`                                        | Libellé visible par l’utilisateur pour ce groupe.                                                        |
| `groupHint`           | Non         | `string`                                        | Court texte d’aide pour le groupe.                                                                       |
| `optionKey`           | Non         | `string`                                        | Clé d’option interne pour les flux simples d’authentification à un seul indicateur.                     |
| `cliFlag`             | Non         | `string`                                        | Nom de l’indicateur CLI, comme `--openrouter-api-key`.                                                   |
| `cliOption`           | Non         | `string`                                        | Forme complète de l’option CLI, comme `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l’aide CLI.                                                                     |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d’onboarding ce choix doit apparaître. S’il est omis, la valeur par défaut est `["text-inference"]`. |

## Référence `commandAliases`

Utilisez `commandAliases` lorsqu’un plugin possède un nom de commande runtime que les utilisateurs peuvent
par erreur mettre dans `plugins.allow` ou essayer d’exécuter comme commande CLI racine. OpenClaw
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

| Field        | Obligatoire | Type              | Signification                                                           |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Oui         | `string`          | Nom de commande qui appartient à ce plugin.                             |
| `kind`       | Non         | `"runtime-slash"` | Marque l’alias comme commande slash de chat plutôt que comme commande CLI racine. |
| `cliCommand` | Non         | `string`          | Commande CLI racine liée à suggérer pour les opérations CLI, si elle existe. |

## Référence `activation`

Utilisez `activation` lorsque le plugin peut déclarer à faible coût quels événements du plan de contrôle
doivent l’inclure dans un plan d’activation/chargement.

Ce bloc est une métadonnée du planificateur, pas une API de cycle de vie. Il n’enregistre pas
de comportement runtime, ne remplace pas `register(...)`, et ne promet pas que
le code du plugin a déjà été exécuté. Le planificateur d’activation utilise ces champs pour
réduire les plugins candidats avant de retomber sur les métadonnées existantes de propriété du manifeste
comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks.

Préférez la métadonnée la plus étroite qui décrit déjà la propriété. Utilisez
`providers`, `channels`, `commandAliases`, les descripteurs de configuration initiale, ou `contracts`
lorsque ces champs expriment la relation. Utilisez `activation` pour des indications
supplémentaires du planificateur qui ne peuvent pas être représentées par ces champs de propriété.

Ce bloc est uniquement une métadonnée. Il n’enregistre pas de comportement runtime, et il ne
remplace pas `register(...)`, `setupEntry`, ni d’autres points d’entrée runtime/plugin.
Les consommateurs actuels l’utilisent comme indication de réduction avant un chargement plus large des plugins, donc
l’absence de métadonnées d’activation ne coûte généralement que des performances ; cela ne doit pas
modifier la correction tant que les replis hérités de propriété du manifeste existent encore.

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

| Field            | Obligatoire | Type                                                 | Signification                                                                                           |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Non         | `string[]`                                           | Identifiants de fournisseurs qui doivent inclure ce plugin dans les plans d’activation/chargement.     |
| `onCommands`     | Non         | `string[]`                                           | Identifiants de commandes qui doivent inclure ce plugin dans les plans d’activation/chargement.        |
| `onChannels`     | Non         | `string[]`                                           | Identifiants de canaux qui doivent inclure ce plugin dans les plans d’activation/chargement.           |
| `onRoutes`       | Non         | `string[]`                                           | Types de routes qui doivent inclure ce plugin dans les plans d’activation/chargement.                  |
| `onCapabilities` | Non         | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indications larges de capacités utilisées par la planification d’activation du plan de contrôle. Préférez des champs plus étroits lorsque c’est possible. |

Consommateurs actifs actuels :

- la planification CLI déclenchée par commande retombe sur
  `commandAliases[].cliCommand` ou `commandAliases[].name` hérités
- la planification de configuration initiale/canal déclenchée par canal retombe sur la propriété héritée `channels[]`
  lorsque les métadonnées explicites d’activation de canal sont absentes
- la planification de configuration initiale/runtime déclenchée par fournisseur retombe sur la propriété héritée
  `providers[]` et `cliBackends[]` de niveau supérieur lorsque les métadonnées explicites d’activation fournisseur sont absentes

Les diagnostics du planificateur peuvent distinguer les indications d’activation explicites du repli
sur la propriété du manifeste. Par exemple, `activation-command-hint` signifie que
`activation.onCommands` a correspondu, tandis que `manifest-command-alias` signifie que le
planificateur a utilisé la propriété `commandAliases` à la place. Ces étiquettes de raison sont destinées
aux diagnostics et aux tests de l’hôte ; les auteurs de plugins doivent continuer à déclarer les métadonnées
qui décrivent au mieux la propriété.

## Référence `qaRunners`

Utilisez `qaRunners` lorsqu’un plugin apporte un ou plusieurs lanceurs de transport sous la racine partagée `openclaw qa`. Gardez ces métadonnées peu coûteuses et statiques ; le
runtime du plugin reste propriétaire de l’enregistrement effectif en CLI via une surface légère
`runtime-api.ts` qui exporte `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Exécuter la voie QA live Matrix adossée à Docker contre un homeserver jetable"
    }
  ]
}
```

| Field         | Obligatoire | Type     | Signification                                                      |
| ------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Oui         | `string` | Sous-commande montée sous `openclaw qa`, par exemple `matrix`.     |
| `description` | Non         | `string` | Texte d’aide de repli utilisé lorsque l’hôte partagé a besoin d’une commande factice. |

## Référence `setup`

Utilisez `setup` lorsque les surfaces de configuration initiale et d’onboarding ont besoin de métadonnées légères appartenant au plugin
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

Le `cliBackends` de niveau supérieur reste valide et continue de décrire les backends d’inférence CLI. `setup.cliBackends` est la surface de descripteur spécifique à la configuration initiale pour les flux du plan de contrôle/de configuration qui doivent rester purement métadonnées.

Lorsqu’ils sont présents, `setup.providers` et `setup.cliBackends` sont la surface de recherche préférée, orientée descripteur d’abord, pour la découverte lors de la configuration initiale. Si le descripteur
ne fait que réduire le plugin candidat et que la configuration initiale a encore besoin de hooks runtime plus riches au moment de la configuration, définissez `requiresRuntime: true` et conservez `setup-api` comme chemin d’exécution de repli.

Comme la recherche de configuration initiale peut exécuter du code `setup-api` appartenant au plugin, les
valeurs normalisées `setup.providers[].id` et `setup.cliBackends[]` doivent rester uniques à travers les plugins découverts. Une propriété ambiguë échoue en mode fail-closed au lieu de choisir un gagnant selon l’ordre de découverte.

### Référence `setup.providers`

| Field         | Obligatoire | Type       | Signification                                                                        |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Oui         | `string`   | Identifiant de fournisseur exposé pendant la configuration initiale ou l’onboarding. Gardez les identifiants normalisés globalement uniques. |
| `authMethods` | Non         | `string[]` | Identifiants de méthodes de configuration/authentification que ce fournisseur prend en charge sans charger le runtime complet. |
| `envVars`     | Non         | `string[]` | Variables d’environnement que les surfaces génériques de configuration/état peuvent vérifier avant le chargement du runtime du plugin. |

### Champs `setup`

| Field              | Obligatoire | Type       | Signification                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Non         | `object[]` | Descripteurs de configuration de fournisseur exposés pendant la configuration initiale et l’onboarding. |
| `cliBackends`      | Non         | `string[]` | Identifiants de backend au moment de la configuration initiale utilisés pour la recherche orientée descripteur. Gardez les identifiants normalisés globalement uniques. |
| `configMigrations` | Non         | `string[]` | Identifiants de migration de configuration possédés par la surface de configuration initiale de ce plugin. |
| `requiresRuntime`  | Non         | `boolean`  | Indique si la configuration initiale nécessite encore l’exécution de `setup-api` après la recherche par descripteur. |

## Référence `uiHints`

`uiHints` est une carte des noms de champs de configuration vers de petites indications de rendu.

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

Chaque indication de champ peut inclure :

| Field         | Type       | Signification                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Libellé du champ visible par l’utilisateur. |
| `help`        | `string`   | Court texte d’aide.                     |
| `tags`        | `string[]` | Étiquettes d’interface facultatives.    |
| `advanced`    | `boolean`  | Marque le champ comme avancé.           |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible. |
| `placeholder` | `string`   | Texte de placeholder pour les entrées de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour les métadonnées statiques de propriété des capacités qu’OpenClaw peut
lire sans importer le runtime du plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Chaque liste est facultative :

| Field                            | Type       | Signification                                                     |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Identifiants runtime embarqués pour lesquels un plugin inclus peut enregistrer des fabriques. |
| `externalAuthProviders`          | `string[]` | Identifiants de fournisseurs dont ce plugin possède le hook de profil d’authentification externe. |
| `speechProviders`                | `string[]` | Identifiants de fournisseurs de parole possédés par ce plugin.    |
| `realtimeTranscriptionProviders` | `string[]` | Identifiants de fournisseurs de transcription en temps réel possédés par ce plugin. |
| `realtimeVoiceProviders`         | `string[]` | Identifiants de fournisseurs de voix en temps réel possédés par ce plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Identifiants de fournisseurs d’embedding Memory possédés par ce plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Identifiants de fournisseurs de compréhension des médias possédés par ce plugin. |
| `imageGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération d’images possédés par ce plugin. |
| `videoGenerationProviders`       | `string[]` | Identifiants de fournisseurs de génération vidéo possédés par ce plugin. |
| `webFetchProviders`              | `string[]` | Identifiants de fournisseurs de récupération web possédés par ce plugin. |
| `webSearchProviders`             | `string[]` | Identifiants de fournisseurs de recherche web possédés par ce plugin. |
| `tools`                          | `string[]` | Noms d’outils d’agent possédés par ce plugin pour les vérifications de contrat des plugins inclus. |

Les plugins fournisseurs qui implémentent `resolveExternalAuthProfiles` doivent déclarer
`contracts.externalAuthProviders`. Les plugins sans cette déclaration continuent de fonctionner
via un repli de compatibilité obsolète, mais ce repli est plus lent et
sera supprimé après la fenêtre de migration.

Les fournisseurs d’embedding Memory inclus doivent déclarer
`contracts.memoryEmbeddingProviders` pour chaque identifiant d’adaptateur qu’ils exposent, y compris
les adaptateurs intégrés tels que `local`. Les chemins CLI autonomes utilisent ce contrat manifeste
pour ne charger que le plugin propriétaire avant que le runtime complet du Gateway n’ait
enregistré les fournisseurs.

## Référence `mediaUnderstandingProviderMetadata`

Utilisez `mediaUnderstandingProviderMetadata` lorsqu’un fournisseur de compréhension des médias possède des
modèles par défaut, une priorité de repli d’authentification automatique, ou une prise en charge native de documents dont
les assistants génériques du cœur ont besoin avant le chargement du runtime. Les clés doivent aussi être déclarées dans
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

Chaque entrée de fournisseur peut inclure :

| Field                  | Type                                | Signification                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacités média exposées par ce fournisseur.                                 |
| `defaultModels`        | `Record<string, string>`            | Valeurs par défaut capacité-vers-modèle utilisées lorsque la configuration ne spécifie pas de modèle. |
| `autoPriority`         | `Record<string, number>`            | Les nombres plus faibles sont triés plus tôt pour le repli automatique de fournisseur basé sur les identifiants. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Entrées de document natives prises en charge par le fournisseur.             |

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

Chaque entrée de canal peut inclure :

| Field         | Type                     | Signification                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Obligatoire pour chaque entrée déclarée de configuration de canal. |
| `uiHints`     | `Record<string, object>` | Libellés/placeholders/indications de sensibilité facultatifs pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé de canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Courte description du canal pour les surfaces d’inspection et de catalogue.               |
| `preferOver`  | `string[]`               | Identifiants de plugin hérités ou de priorité inférieure que ce canal doit surpasser dans les surfaces de sélection. |

## Référence `modelSupport`

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre plugin fournisseur à partir de
références abrégées de modèles comme `gpt-5.5` ou `claude-sonnet-4.6` avant le chargement du runtime du plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applique cette priorité :

- les références explicites `provider/model` utilisent les métadonnées de manifeste `providers` du plugin propriétaire
- `modelPatterns` l’emporte sur `modelPrefixes`
- si un plugin non inclus et un plugin inclus correspondent tous deux, le plugin non inclus
  l’emporte
- toute ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration spécifie un fournisseur

Champs :

| Field           | Type       | Signification                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes mis en correspondance avec `startsWith` sur les identifiants abrégés de modèle. |
| `modelPatterns` | `string[]` | Sources regex mises en correspondance avec les identifiants abrégés de modèle après suppression du suffixe de profil. |

Les clés de capacité héritées de niveau supérieur sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le
chargement normal du manifeste ne traite plus ces champs de niveau supérieur comme
propriété de capacité.

## Manifeste versus package.json

Les deux fichiers ont des rôles différents :

| File                   | Utilisation                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d’authentification et indications d’interface qui doivent exister avant l’exécution du code du plugin |
| `package.json`         | Métadonnées npm, installation des dépendances et bloc `openclaw` utilisé pour les points d’entrée, le contrôle d’installation, la configuration initiale ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers d’entrée ou le comportement d’installation npm, placez-la dans `package.json`

### Champs package.json qui affectent la découverte

Certaines métadonnées de plugin pré-runtime vivent intentionnellement dans `package.json` sous le
bloc `openclaw` plutôt que dans `openclaw.plugin.json`.

Exemples importants :

| Field                                                             | Signification                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Déclare les points d’entrée de plugin natif. Doit rester à l’intérieur du répertoire du package du plugin.                                                                          |
| `openclaw.runtimeExtensions`                                      | Déclare les points d’entrée runtime JavaScript compilés pour les packages installés. Doit rester à l’intérieur du répertoire du package du plugin.                                 |
| `openclaw.setupEntry`                                             | Point d’entrée léger réservé à la configuration initiale, utilisé pendant l’onboarding, le démarrage différé des canaux et la découverte en lecture seule de l’état des canaux/SecretRef. Doit rester à l’intérieur du répertoire du package du plugin. |
| `openclaw.runtimeSetupEntry`                                      | Déclare le point d’entrée de configuration initiale JavaScript compilé pour les packages installés. Doit rester à l’intérieur du répertoire du package du plugin.                  |
| `openclaw.channel`                                                | Métadonnées légères de catalogue de canaux comme les libellés, chemins de documentation, alias et texte de sélection.                                                               |
| `openclaw.channel.configuredState`                                | Métadonnées légères de vérification d’état configuré capables de répondre à « est-ce qu’une configuration uniquement via env existe déjà ? » sans charger le runtime complet du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères de vérification d’authentification persistée capables de répondre à « y a-t-il déjà quelque chose de connecté ? » sans charger le runtime complet du canal.     |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d’installation/mise à jour pour les plugins inclus et publiés en externe.                                                                                                |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                                                              |
| `openclaw.install.minHostVersion`                                 | Version minimale du host OpenClaw prise en charge, à l’aide d’un plancher semver comme `>=2026.3.22`.                                                                               |
| `openclaw.install.expectedIntegrity`                              | Chaîne d’intégrité attendue du dist npm telle que `sha512-...` ; les flux d’installation et de mise à jour vérifient l’artefact récupéré par rapport à celle-ci.                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin étroit de récupération par réinstallation de plugin inclus lorsque la configuration est invalide.                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration initiale de se charger avant le plugin complet du canal pendant le démarrage.                                            |

Les métadonnées du manifeste déterminent quels choix de fournisseur/canal/configuration initiale apparaissent dans
l’onboarding avant le chargement du runtime. `package.json#openclaw.install` indique à
l’onboarding comment récupérer ou activer ce plugin lorsque l’utilisateur choisit l’un de ces
choix. Ne déplacez pas les indications d’installation dans `openclaw.plugin.json`.

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le chargement
du registre de manifestes. Les valeurs invalides sont rejetées ; les valeurs plus récentes mais valides
ignorent le plugin sur les hôtes plus anciens.

L’épinglage exact de version npm se trouve déjà dans `npmSpec`, par exemple
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Les entrées officielles du catalogue externe
doivent associer des spécifications exactes avec `expectedIntegrity` afin que les flux de mise à jour échouent
en mode fail-closed si l’artefact npm récupéré ne correspond plus à la version épinglée.
L’onboarding interactif continue de proposer des spécifications npm fiables du registre, y compris des noms de paquets seuls et des dist-tags, pour des raisons de compatibilité. Les diagnostics du catalogue peuvent
distinguer les sources exactes, flottantes, épinglées avec intégrité et sans intégrité.
Lorsque `expectedIntegrity` est présent, les flux d’installation/mise à jour l’appliquent ; lorsqu’il
est omis, la résolution du registre est enregistrée sans épinglage d’intégrité.

Les plugins de canal doivent fournir `openclaw.setupEntry` lorsque les analyses d’état, de liste de canaux,
ou de SecretRef doivent identifier les comptes configurés sans charger le runtime complet.
L’entrée de configuration initiale doit exposer les métadonnées du canal ainsi que les adaptateurs sûrs pour la configuration initiale,
l’état et les secrets ; gardez les clients réseau, les écouteurs gateway et les
runtimes de transport dans le point d’entrée principal de l’extension.

Les champs de point d’entrée runtime ne remplacent pas les vérifications de frontière de package pour les champs de point d’entrée source.
Par exemple, `openclaw.runtimeExtensions` ne peut pas rendre chargeable un chemin `openclaw.extensions` qui s’échappe du package.

`openclaw.install.allowInvalidConfigRecovery` est volontairement étroit. Il ne
rend pas des configurations arbitrairement cassées installables. Aujourd’hui, il permet seulement aux flux d’installation de récupérer de certains échecs de mise à niveau de plugin inclus obsolètes, comme un
chemin de plugin inclus manquant ou une entrée `channels.<id>` obsolète pour ce même
plugin inclus. Les erreurs de configuration sans rapport bloquent toujours l’installation et envoient les opérateurs
vers `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` est une métadonnée de package pour un petit module de vérification :

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

Utilisez-le lorsque la configuration initiale, doctor, ou les flux d’état configuré ont besoin d’une sonde d’authentification bon marché oui/non
avant le chargement du plugin complet de canal. L’export cible doit être une petite
fonction qui lit uniquement l’état persisté ; ne le faites pas passer par le barrel complet
du runtime de canal.

`openclaw.channel.configuredState` suit la même forme pour des vérifications légères
d’état configuré uniquement basées sur l’environnement :

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

Utilisez-le lorsqu’un canal peut répondre à l’état configuré à partir de variables d’environnement ou d’autres petites
entrées non runtime. Si la vérification a besoin de la résolution complète de configuration ou du
runtime réel du canal, gardez cette logique dans le hook `config.hasConfiguredState`
du plugin à la place.

## Priorité de découverte (identifiants de plugin dupliqués)

OpenClaw découvre les plugins à partir de plusieurs racines (inclus, installation globale, espace de travail, chemins explicitement sélectionnés par la configuration). Si deux découvertes partagent le même `id`, seul le manifeste de **plus haute priorité** est conservé ; les doublons de priorité inférieure sont supprimés au lieu d’être chargés à côté.

Priorité, de la plus haute à la plus basse :

1. **Sélectionné par la configuration** — un chemin explicitement épinglé dans `plugins.entries.<id>`
2. **Inclus** — plugins livrés avec OpenClaw
3. **Installation globale** — plugins installés dans la racine globale des plugins OpenClaw
4. **Espace de travail** — plugins découverts relativement à l’espace de travail courant

Implications :

- Une copie forkée ou obsolète d’un plugin inclus présente dans l’espace de travail ne masquera pas la build incluse.
- Pour réellement remplacer un plugin inclus par une version locale, épinglez-le via `plugins.entries.<id>` afin qu’il gagne par priorité au lieu de compter sur la découverte dans l’espace de travail.
- Les suppressions de doublons sont journalisées afin que Doctor et les diagnostics de démarrage puissent pointer vers la copie écartée.

## Exigences du schéma JSON

- **Chaque plugin doit fournir un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l’exécution.

## Comportement de validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l’identifiant de canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, et `plugins.slots.*`
  doivent référencer des identifiants de plugin **découvrables**. Les identifiants inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et
  un **avertissement** apparaît dans Doctor + les journaux.

Voir [Référence de configuration](/fr/gateway/configuration) pour le schéma complet de `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les plugins natifs OpenClaw**, y compris ceux chargés depuis le système de fichiers local. Le runtime charge toujours le module du plugin séparément ; le manifeste n’est utilisé que pour la découverte + la validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, virgules finales et clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs documentés du manifeste sont lus par le chargeur de manifeste. Évitez les clés de niveau supérieur personnalisées.
- `channels`, `providers`, `cliBackends` et `skills` peuvent tous être omis lorsqu’un plugin n’en a pas besoin.
- `providerDiscoveryEntry` doit rester léger et ne doit pas importer de code runtime large ; utilisez-le pour les métadonnées statiques du catalogue fournisseur ou des descripteurs de découverte étroits, pas pour l’exécution au moment des requêtes.
- Les types de plugin exclusifs sont sélectionnés via `plugins.slots.*` : `kind: "memory"` via `plugins.slots.memory`, `kind: "context-engine"` via `plugins.slots.contextEngine` (par défaut `legacy`).
- Les métadonnées de variables d’environnement (`providerAuthEnvVars`, `channelEnvVars`) sont uniquement déclaratives. Les surfaces d’état, d’audit, de validation de livraison Cron et autres surfaces en lecture seule appliquent toujours la confiance du plugin et la politique d’activation effective avant de traiter une variable d’environnement comme configurée.
- Pour les métadonnées runtime de l’assistant qui nécessitent le code fournisseur, voir [Provider runtime hooks](/fr/plugins/architecture-internals#provider-runtime-hooks).
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toute exigence de liste d’autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Lié

<CardGroup cols={3}>
  <Card title="Créer des plugins" href="/fr/plugins/building-plugins" icon="rocket">
    Démarrer avec les plugins.
  </Card>
  <Card title="Architecture des plugins" href="/fr/plugins/architecture" icon="diagram-project">
    Architecture interne et modèle de capacités.
  </Card>
  <Card title="Aperçu du SDK" href="/fr/plugins/sdk-overview" icon="book">
    Référence du SDK de Plugin et imports par sous-chemin.
  </Card>
</CardGroup>
