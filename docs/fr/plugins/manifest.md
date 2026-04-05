---
read_when:
    - Vous développez un plugin OpenClaw
    - Vous devez livrer un schéma de configuration de plugin ou déboguer des erreurs de validation de plugin
summary: Manifeste de plugin + exigences JSON Schema (validation stricte de configuration)
title: Manifeste de plugin
x-i18n:
    generated_at: "2026-04-05T12:50:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 702447ad39f295cfffd4214c3e389bee667d2f9850754f2e02e325dde8e4ac00
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifeste de plugin (`openclaw.plugin.json`)

Cette page concerne **uniquement le manifeste de plugin natif OpenClaw**.

Pour les structures de bundle compatibles, voir [Bundles de plugins](/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la structure de composant Claude
  par défaut sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement ces structures de bundle également, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de Skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude, et les packs de hooks pris en charge lorsque la structure correspond
aux attentes du runtime OpenClaw.

Chaque plugin natif OpenClaw **doit** inclure un fichier `openclaw.plugin.json` à la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du plugin**. Les manifestes manquants ou invalides sont traités comme
des erreurs de plugin et bloquent la validation de configuration.

Voir le guide complet du système de plugins : [Plugins](/tools/plugin).
Pour le modèle natif de capacités et les indications actuelles de compatibilité externe :
[Modèle de capacités](/plugins/architecture#public-capability-model).

## À quoi sert ce fichier

`openclaw.plugin.json` correspond aux métadonnées qu'OpenClaw lit avant de charger le
code de votre plugin.

Utilisez-le pour :

- l'identité du plugin
- la validation de configuration
- les métadonnées d'authentification et d'onboarding qui doivent être disponibles sans démarrer le runtime du plugin
- les métadonnées d'alias et d'activation automatique qui doivent être résolues avant le chargement du runtime du plugin
- les métadonnées abrégées de propriété de famille de modèles qui doivent auto-activer le
  plugin avant le chargement du runtime
- les instantanés statiques de propriété de capacités utilisés pour le câblage de compatibilité groupée et
  la couverture de contrat
- les métadonnées de configuration spécifiques à un canal qui doivent être fusionnées dans les surfaces de catalogue et de validation sans charger le runtime
- les indications d'interface de configuration

Ne l'utilisez pas pour :

- enregistrer le comportement du runtime
- déclarer les points d'entrée du code
- les métadonnées d'installation npm

Ces éléments appartiennent à votre code de plugin et à `package.json`.

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

## Exemple enrichi

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
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| Champ                               | Obligatoire | Type                             | Signification                                                                                                                                                                             |
| ----------------------------------- | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Oui         | `string`                         | ID canonique du plugin. C'est l'ID utilisé dans `plugins.entries.<id>`.                                                                                                                  |
| `configSchema`                      | Oui         | `object`                         | JSON Schema inline pour la configuration de ce plugin.                                                                                                                                    |
| `enabledByDefault`                  | Non         | `true`                           | Marque un plugin groupé comme activé par défaut. Omettez-le, ou définissez toute valeur autre que `true`, pour laisser le plugin désactivé par défaut.                                  |
| `legacyPluginIds`                   | Non         | `string[]`                       | Anciens IDs normalisés vers cet ID canonique de plugin.                                                                                                                                   |
| `autoEnableWhenConfiguredProviders` | Non         | `string[]`                       | IDs de fournisseurs qui doivent auto-activer ce plugin lorsque l'authentification, la configuration ou les références de modèle les mentionnent.                                         |
| `kind`                              | Non         | `"memory"` \| `"context-engine"` | Déclare un type exclusif de plugin utilisé par `plugins.slots.*`.                                                                                                                        |
| `channels`                          | Non         | `string[]`                       | IDs de canaux appartenant à ce plugin. Utilisé pour la découverte et la validation de configuration.                                                                                     |
| `providers`                         | Non         | `string[]`                       | IDs de fournisseurs appartenant à ce plugin.                                                                                                                                              |
| `modelSupport`                      | Non         | `object`                         | Métadonnées abrégées de famille de modèles appartenant au manifeste, utilisées pour auto-charger le plugin avant le runtime.                                                             |
| `cliBackends`                       | Non         | `string[]`                       | IDs de backend d'inférence CLI appartenant à ce plugin. Utilisé pour l'auto-activation au démarrage à partir de références de configuration explicites.                                  |
| `providerAuthEnvVars`               | Non         | `Record<string, string[]>`       | Métadonnées légères d'environnement d'authentification fournisseur qu'OpenClaw peut inspecter sans charger le code du plugin.                                                           |
| `providerAuthChoices`               | Non         | `object[]`                       | Métadonnées légères de choix d'authentification pour les sélecteurs d'onboarding, la résolution du fournisseur préféré, et le câblage simple des drapeaux CLI.                           |
| `contracts`                         | Non         | `object`                         | Instantané statique de capacités groupées pour la parole, la transcription temps réel, la voix temps réel, la compréhension média, la génération d'image, la génération vidéo, web-fetch, la recherche web et la propriété d'outils. |
| `channelConfigs`                    | Non         | `Record<string, object>`         | Métadonnées de configuration de canal appartenant au manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement du runtime.                              |
| `skills`                            | Non         | `string[]`                       | Répertoires de Skills à charger, relatifs à la racine du plugin.                                                                                                                         |
| `name`                              | Non         | `string`                         | Nom lisible du plugin.                                                                                                                                                                    |
| `description`                       | Non         | `string`                         | Résumé court affiché dans les surfaces du plugin.                                                                                                                                         |
| `version`                           | Non         | `string`                         | Version informative du plugin.                                                                                                                                                            |
| `uiHints`                           | Non         | `Record<string, object>`         | Libellés UI, espaces réservés et indications de sensibilité pour les champs de configuration.                                                                                            |

## Référence `providerAuthChoices`

Chaque entrée `providerAuthChoices` décrit un choix d'onboarding ou d'authentification.
OpenClaw lit cela avant le chargement du runtime du fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                                  |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | ID du fournisseur auquel ce choix appartient.                                                                  |
| `method`              | Oui         | `string`                                        | ID de méthode d'authentification à utiliser.                                                                   |
| `choiceId`            | Oui         | `string`                                        | ID stable du choix d'authentification utilisé par les flux d'onboarding et CLI.                               |
| `choiceLabel`         | Non         | `string`                                        | Libellé destiné à l'utilisateur. S'il est omis, OpenClaw revient à `choiceId`.                                |
| `choiceHint`          | Non         | `string`                                        | Texte d'aide court pour le sélecteur.                                                                          |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs plus basses sont triées plus tôt dans les sélecteurs interactifs pilotés par l'assistant.         |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque le choix dans les sélecteurs d'assistant tout en autorisant toujours la sélection manuelle via CLI.    |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | Anciens IDs de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement.                     |
| `groupId`             | Non         | `string`                                        | ID de groupe facultatif pour regrouper des choix associés.                                                     |
| `groupLabel`          | Non         | `string`                                        | Libellé destiné à l'utilisateur pour ce groupe.                                                                |
| `groupHint`           | Non         | `string`                                        | Texte d'aide court pour le groupe.                                                                             |
| `optionKey`           | Non         | `string`                                        | Clé d'option interne pour les flux d'authentification simples à un seul drapeau.                               |
| `cliFlag`             | Non         | `string`                                        | Nom du drapeau CLI, tel que `--openrouter-api-key`.                                                            |
| `cliOption`           | Non         | `string`                                        | Forme complète de l'option CLI, telle que `--openrouter-api-key <key>`.                                        |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l'aide CLI.                                                                          |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d'onboarding ce choix doit apparaître. Si omis, la valeur par défaut est `["text-inference"]`. |

## Référence `uiHints`

`uiHints` est une map reliant les noms de champs de configuration à de petites indications de rendu.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Chaque indication de champ peut inclure :

| Champ         | Type       | Signification                                |
| ------------- | ---------- | -------------------------------------------- |
| `label`       | `string`   | Libellé du champ destiné à l'utilisateur.    |
| `help`        | `string`   | Texte d'aide court.                          |
| `tags`        | `string[]` | Balises UI facultatives.                     |
| `advanced`    | `boolean`  | Marque le champ comme avancé.                |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible.    |
| `placeholder` | `string`   | Texte d'espace réservé pour les entrées de formulaire. |

## Référence `contracts`

Utilisez `contracts` uniquement pour des métadonnées statiques de propriété de capacités qu'OpenClaw peut
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

| Champ                            | Type       | Signification                                              |
| -------------------------------- | ---------- | ---------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de fournisseurs de parole appartenant à ce plugin.     |
| `realtimeTranscriptionProviders` | `string[]` | IDs de fournisseurs de transcription temps réel appartenant à ce plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de fournisseurs de voix temps réel appartenant à ce plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de fournisseurs de compréhension média appartenant à ce plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de fournisseurs de génération d'image appartenant à ce plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de fournisseurs de génération vidéo appartenant à ce plugin. |
| `webFetchProviders`              | `string[]` | IDs de fournisseurs web-fetch appartenant à ce plugin.     |
| `webSearchProviders`             | `string[]` | IDs de fournisseurs de recherche web appartenant à ce plugin. |
| `tools`                          | `string[]` | Noms d'outils d'agent appartenant à ce plugin pour les vérifications de contrat groupées. |

## Référence `channelConfigs`

Utilisez `channelConfigs` lorsqu'un plugin de canal a besoin de métadonnées légères de configuration avant
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
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Chaque entrée de canal peut inclure :

| Champ         | Type                     | Signification                                                                                   |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema pour `channels.<id>`. Requis pour chaque entrée de configuration de canal déclarée. |
| `uiHints`     | `Record<string, object>` | Libellés/espaces réservés/indications de sensibilité UI facultatifs pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé de canal fusionné dans les surfaces de sélecteur et d'inspection lorsque les métadonnées runtime ne sont pas prêtes. |
| `description` | `string`                 | Description courte du canal pour les surfaces d'inspection et de catalogue.                     |
| `preferOver`  | `string[]`               | IDs de plugins hérités ou de priorité inférieure que ce canal doit dépasser dans les surfaces de sélection. |

## Référence `modelSupport`

Utilisez `modelSupport` lorsqu'OpenClaw doit déduire votre plugin fournisseur à partir de
noms abrégés de modèles comme `gpt-5.4` ou `claude-sonnet-4.6` avant le chargement
du runtime du plugin.

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
- `modelPatterns` l'emporte sur `modelPrefixes`
- si un plugin non groupé et un plugin groupé correspondent tous deux, le plugin non groupé
  l'emporte
- l'ambiguïté restante est ignorée jusqu'à ce que l'utilisateur ou la configuration spécifie un fournisseur

Champs :

| Champ           | Type       | Signification                                                                     |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux IDs abrégés de modèles.                  |
| `modelPatterns` | `string[]` | Sources regex comparées aux IDs abrégés de modèles après suppression du suffixe de profil. |

Les anciennes clés de capacité au niveau racine sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement normal
du manifeste ne traite plus ces champs de premier niveau comme de la propriété de capacités.

## Manifeste versus package.json

Les deux fichiers ont des rôles différents :

| Fichier                | Utilisez-le pour                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Découverte, validation de configuration, métadonnées de choix d'authentification et indications UI qui doivent exister avant l'exécution du code du plugin |
| `package.json`         | Métadonnées npm, installation des dépendances, et bloc `openclaw` utilisé pour les points d'entrée, le filtrage d'installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où placer une métadonnée, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, placez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers de point d'entrée ou le comportement d'installation npm, placez-la dans `package.json`

### Champs de `package.json` qui affectent la découverte

Certaines métadonnées de plugin avant runtime vivent intentionnellement dans `package.json` sous le
bloc `openclaw` plutôt que dans `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d'entrée natifs du plugin.                                           |
| `openclaw.setupEntry`                                             | Point d'entrée léger réservé à la configuration, utilisé pendant l'onboarding et le démarrage différé du canal. |
| `openclaw.channel`                                                | Métadonnées légères de catalogue de canal comme les libellés, chemins de documentation, alias et texte de sélection. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d'installation/mise à jour pour les plugins groupés et publiés en externe. |
| `openclaw.install.defaultChoice`                                  | Chemin d'installation préféré lorsque plusieurs sources d'installation sont disponibles. |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l'hôte OpenClaw, avec un plancher semver comme `>=2026.3.22`. |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin de récupération étroit de réinstallation de plugin groupé lorsque la configuration est invalide. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet pendant le démarrage. |

`openclaw.install.minHostVersion` est appliqué pendant l'installation et le chargement du
registre de manifeste. Les valeurs invalides sont rejetées ; les valeurs plus récentes mais valides ignorent le
plugin sur les hôtes plus anciens.

`openclaw.install.allowInvalidConfigRecovery` est volontairement étroit. Cela
ne rend pas arbitrairement installables les configurations cassées. Aujourd'hui, cela n'autorise que les
flux d'installation à récupérer de certains échecs obsolètes de mise à niveau de plugin groupé, tels
qu'un chemin de plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même
plugin groupé. Les erreurs de configuration non liées continuent de bloquer l'installation et redirigent les opérateurs
vers `openclaw doctor --fix`.

## Exigences JSON Schema

- **Chaque plugin doit fournir un JSON Schema**, même s'il n'accepte aucune configuration.
- Un schéma vide est acceptable (par exemple `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés lors de la lecture/écriture de configuration, pas au runtime.

## Comportement de validation

- Les clés inconnues `channels.*` sont des **erreurs**, sauf si l'ID du canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, et `plugins.slots.*`
  doivent référencer des IDs de plugin **détectables**. Les IDs inconnus sont des **erreurs**.
- Si un plugin est installé mais possède un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l'erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et
  un **avertissement** est affiché dans Doctor + les journaux.

Voir [Référence de configuration](/gateway/configuration) pour le schéma complet `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les plugins natifs OpenClaw**, y compris les chargements locaux depuis le système de fichiers.
- Le runtime charge toujours le module du plugin séparément ; le manifeste sert uniquement à la
  découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, virgules finales et
  clés non citées sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez d'ajouter
  ici des clés personnalisées au niveau supérieur.
- `providerAuthEnvVars` est le chemin léger de métadonnées pour les sondes d'authentification,
  la validation de marqueurs env et les surfaces similaires d'authentification fournisseur qui ne doivent pas démarrer le runtime du plugin juste pour inspecter des noms de variables d'environnement.
- `providerAuthChoices` est le chemin léger de métadonnées pour les sélecteurs de choix d'authentification,
  la résolution `--auth-choice`, le mapping du fournisseur préféré, et l'enregistrement simple
  des drapeaux CLI d'onboarding avant le chargement du runtime fournisseur. Pour les métadonnées
  d'assistant runtime qui nécessitent le code du fournisseur, voir
  [Hooks runtime de fournisseur](/plugins/architecture#provider-runtime-hooks).
- Les types exclusifs de plugin sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers`, `cliBackends`, et `skills` peuvent être omis lorsqu'un
  plugin n'en a pas besoin.
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toute
  exigence de liste d'autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Lié

- [Créer des plugins](/plugins/building-plugins) — démarrer avec les plugins
- [Architecture des plugins](/plugins/architecture) — architecture interne
- [Vue d'ensemble du SDK](/plugins/sdk-overview) — référence du SDK de plugin
