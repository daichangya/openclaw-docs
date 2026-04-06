---
read_when:
    - Vous construisez un plugin OpenClaw
    - Vous devez livrer un schéma de configuration de plugin ou déboguer des erreurs de validation de plugin
summary: Manifeste de plugin + exigences du schéma JSON (validation stricte de la configuration)
title: Manifeste de plugin
x-i18n:
    generated_at: "2026-04-06T03:09:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f915a761cdb5df77eba5d2ccd438c65445bd2ab41b0539d1200e63e8cf2c3a
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifeste de plugin (openclaw.plugin.json)

Cette page concerne uniquement le **manifeste de plugin natif OpenClaw**.

Pour les dispositions de bundle compatibles, voir [Bundles de plugins](/fr/plugins/bundles).

Les formats de bundle compatibles utilisent des fichiers de manifeste différents :

- Bundle Codex : `.codex-plugin/plugin.json`
- Bundle Claude : `.claude-plugin/plugin.json` ou la disposition de composant Claude par défaut
  sans manifeste
- Bundle Cursor : `.cursor-plugin/plugin.json`

OpenClaw détecte automatiquement aussi ces dispositions de bundle, mais elles ne sont pas validées
par rapport au schéma `openclaw.plugin.json` décrit ici.

Pour les bundles compatibles, OpenClaw lit actuellement les métadonnées du bundle ainsi que les
racines de skills déclarées, les racines de commandes Claude, les valeurs par défaut `settings.json` du bundle Claude,
les valeurs par défaut LSP du bundle Claude et les packs de hooks pris en charge lorsque la disposition correspond
aux attentes d’exécution d’OpenClaw.

Chaque plugin natif OpenClaw **doit** livrer un fichier `openclaw.plugin.json` dans la
**racine du plugin**. OpenClaw utilise ce manifeste pour valider la configuration
**sans exécuter le code du plugin**. Les manifestes manquants ou invalides sont traités comme
des erreurs de plugin et bloquent la validation de la configuration.

Consultez le guide complet du système de plugins : [Plugins](/fr/tools/plugin).
Pour le modèle de capacités natif et les recommandations actuelles de compatibilité externe :
[Modèle de capacités](/fr/plugins/architecture#public-capability-model).

## À quoi sert ce fichier

`openclaw.plugin.json` contient les métadonnées qu’OpenClaw lit avant de charger le
code de votre plugin.

Utilisez-le pour :

- l’identité du plugin
- la validation de la configuration
- les métadonnées d’authentification et d’onboarding qui doivent être disponibles sans démarrer l’exécution du plugin
- les métadonnées d’alias et d’activation automatique qui doivent être résolues avant le chargement de l’exécution du plugin
- les métadonnées abrégées de possession de famille de modèles qui doivent activer automatiquement le
  plugin avant le chargement de l’exécution
- les instantanés statiques de possession de capacités utilisés pour le câblage de compatibilité groupée et
  la couverture des contrats
- les métadonnées de configuration spécifiques à un canal qui doivent être fusionnées dans les surfaces de catalogue et de validation
  sans charger l’exécution
- les indications d’UI pour la configuration

Ne l’utilisez pas pour :

- enregistrer un comportement d’exécution
- déclarer des points d’entrée de code
- les métadonnées d’installation npm

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

## Exemple enrichi

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin de fournisseur OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| Champ                               | Obligatoire | Type                             | Signification                                                                                                                                                                                                |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Oui         | `string`                         | Identifiant canonique du plugin. C’est l’identifiant utilisé dans `plugins.entries.<id>`.                                                                                                                   |
| `configSchema`                      | Oui         | `object`                         | Schéma JSON inline pour la configuration de ce plugin.                                                                                                                                                       |
| `enabledByDefault`                  | Non         | `true`                           | Marque un plugin groupé comme activé par défaut. Omettez-le, ou définissez toute valeur autre que `true`, pour laisser le plugin désactivé par défaut.                                                    |
| `legacyPluginIds`                   | Non         | `string[]`                       | Identifiants historiques qui se normalisent vers cet identifiant de plugin canonique.                                                                                                                       |
| `autoEnableWhenConfiguredProviders` | Non         | `string[]`                       | Identifiants de fournisseurs qui doivent activer automatiquement ce plugin lorsque l’authentification, la configuration ou des références de modèle les mentionnent.                                       |
| `kind`                              | Non         | `"memory"` \| `"context-engine"` | Déclare un type exclusif de plugin utilisé par `plugins.slots.*`.                                                                                                                                            |
| `channels`                          | Non         | `string[]`                       | Identifiants de canaux possédés par ce plugin. Utilisés pour la découverte et la validation de la configuration.                                                                                            |
| `providers`                         | Non         | `string[]`                       | Identifiants de fournisseurs possédés par ce plugin.                                                                                                                                                         |
| `modelSupport`                      | Non         | `object`                         | Métadonnées abrégées de famille de modèles possédées par le manifeste, utilisées pour charger automatiquement le plugin avant l’exécution.                                                                  |
| `providerAuthEnvVars`               | Non         | `Record<string, string[]>`       | Métadonnées d’environnement d’authentification de fournisseur légères qu’OpenClaw peut inspecter sans charger le code du plugin.                                                                           |
| `providerAuthChoices`               | Non         | `object[]`                       | Métadonnées légères de choix d’authentification pour les sélecteurs d’onboarding, la résolution du fournisseur préféré et le câblage simple des drapeaux CLI.                                              |
| `contracts`                         | Non         | `object`                         | Instantané statique des capacités groupées pour speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search et la possession d’outils. |
| `channelConfigs`                    | Non         | `Record<string, object>`         | Métadonnées de configuration de canal possédées par le manifeste, fusionnées dans les surfaces de découverte et de validation avant le chargement de l’exécution.                                          |
| `skills`                            | Non         | `string[]`                       | Répertoires de skills à charger, relatifs à la racine du plugin.                                                                                                                                             |
| `name`                              | Non         | `string`                         | Nom lisible par des humains du plugin.                                                                                                                                                                       |
| `description`                       | Non         | `string`                         | Résumé court affiché dans les surfaces du plugin.                                                                                                                                                            |
| `version`                           | Non         | `string`                         | Version informative du plugin.                                                                                                                                                                               |
| `uiHints`                           | Non         | `Record<string, object>`         | Libellés UI, placeholders et indications de sensibilité pour les champs de configuration.                                                                                                                   |

## Référence de providerAuthChoices

Chaque entrée `providerAuthChoices` décrit un choix d’onboarding ou d’authentification.
OpenClaw le lit avant le chargement de l’exécution du fournisseur.

| Champ                 | Obligatoire | Type                                            | Signification                                                                                       |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `provider`            | Oui         | `string`                                        | Identifiant du fournisseur auquel appartient ce choix.                                              |
| `method`              | Oui         | `string`                                        | Identifiant de la méthode d’authentification vers laquelle router.                                  |
| `choiceId`            | Oui         | `string`                                        | Identifiant stable du choix d’authentification utilisé par les flux d’onboarding et CLI.           |
| `choiceLabel`         | Non         | `string`                                        | Libellé destiné à l’utilisateur. S’il est omis, OpenClaw retombe sur `choiceId`.                   |
| `choiceHint`          | Non         | `string`                                        | Court texte d’aide pour le sélecteur.                                                               |
| `assistantPriority`   | Non         | `number`                                        | Les valeurs plus faibles sont triées plus tôt dans les sélecteurs interactifs pilotés par l’assistant. |
| `assistantVisibility` | Non         | `"visible"` \| `"manual-only"`                  | Masque le choix des sélecteurs de l’assistant tout en autorisant la sélection manuelle via la CLI. |
| `deprecatedChoiceIds` | Non         | `string[]`                                      | Anciens identifiants de choix qui doivent rediriger les utilisateurs vers ce choix de remplacement. |
| `groupId`             | Non         | `string`                                        | Identifiant de groupe facultatif pour regrouper des choix liés.                                    |
| `groupLabel`          | Non         | `string`                                        | Libellé destiné à l’utilisateur pour ce groupe.                                                     |
| `groupHint`           | Non         | `string`                                        | Court texte d’aide pour le groupe.                                                                  |
| `optionKey`           | Non         | `string`                                        | Clé d’option interne pour les flux d’authentification simples à un seul drapeau.                    |
| `cliFlag`             | Non         | `string`                                        | Nom de drapeau CLI, tel que `--openrouter-api-key`.                                                 |
| `cliOption`           | Non         | `string`                                        | Forme complète de l’option CLI, telle que `--openrouter-api-key <key>`.                             |
| `cliDescription`      | Non         | `string`                                        | Description utilisée dans l’aide CLI.                                                                |
| `onboardingScopes`    | Non         | `Array<"text-inference" \| "image-generation">` | Sur quelles surfaces d’onboarding ce choix doit apparaître. Si omis, la valeur par défaut est `["text-inference"]`. |

## Référence de uiHints

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

| Champ         | Type       | Signification                                  |
| ------------- | ---------- | ---------------------------------------------- |
| `label`       | `string`   | Libellé du champ destiné à l’utilisateur.      |
| `help`        | `string`   | Court texte d’aide.                            |
| `tags`        | `string[]` | Étiquettes UI facultatives.                    |
| `advanced`    | `boolean`  | Marque le champ comme avancé.                  |
| `sensitive`   | `boolean`  | Marque le champ comme secret ou sensible.      |
| `placeholder` | `string`   | Texte de placeholder pour les champs de formulaire. |

## Référence de contracts

Utilisez `contracts` uniquement pour les métadonnées statiques de possession de capacités qu’OpenClaw peut
lire sans importer l’exécution du plugin.

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
| `speechProviders`                | `string[]` | Identifiants de fournisseurs speech possédés par ce plugin. |
| `realtimeTranscriptionProviders` | `string[]` | Identifiants de fournisseurs de realtime transcription possédés par ce plugin. |
| `realtimeVoiceProviders`         | `string[]` | Identifiants de fournisseurs de realtime voice possédés par ce plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Identifiants de fournisseurs media-understanding possédés par ce plugin. |
| `imageGenerationProviders`       | `string[]` | Identifiants de fournisseurs d’image-generation possédés par ce plugin. |
| `videoGenerationProviders`       | `string[]` | Identifiants de fournisseurs de vidéo-generation possédés par ce plugin. |
| `webFetchProviders`              | `string[]` | Identifiants de fournisseurs web-fetch possédés par ce plugin. |
| `webSearchProviders`             | `string[]` | Identifiants de fournisseurs web-search possédés par ce plugin. |
| `tools`                          | `string[]` | Noms d’outils d’agent possédés par ce plugin pour les vérifications de contrat groupées. |

## Référence de channelConfigs

Utilisez `channelConfigs` lorsqu’un plugin de canal a besoin de métadonnées de configuration légères avant
le chargement de l’exécution.

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
| `schema`      | `object`                 | Schéma JSON pour `channels.<id>`. Obligatoire pour chaque entrée de configuration de canal déclarée. |
| `uiHints`     | `Record<string, object>` | Libellés UI/placeholders/indications de sensibilité facultatifs pour cette section de configuration de canal. |
| `label`       | `string`                 | Libellé du canal fusionné dans les surfaces de sélection et d’inspection lorsque les métadonnées d’exécution ne sont pas prêtes. |
| `description` | `string`                 | Courte description du canal pour les surfaces d’inspection et de catalogue.                   |
| `preferOver`  | `string[]`               | Identifiants de plugin historiques ou de priorité plus basse que ce canal doit dépasser dans les surfaces de sélection. |

## Référence de modelSupport

Utilisez `modelSupport` lorsqu’OpenClaw doit déduire votre plugin fournisseur à partir
d’identifiants de modèle abrégés comme `gpt-5.4` ou `claude-sonnet-4.6` avant le chargement
de l’exécution du plugin.

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
- `modelPatterns` ont priorité sur `modelPrefixes`
- si un plugin non groupé et un plugin groupé correspondent tous les deux, le plugin non groupé
  l’emporte
- l’ambiguïté restante est ignorée jusqu’à ce que l’utilisateur ou la configuration précise un fournisseur

Champs :

| Champ           | Type       | Signification                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Préfixes comparés avec `startsWith` aux identifiants de modèle abrégés.        |
| `modelPatterns` | `string[]` | Sources regex comparées aux identifiants de modèle abrégés après suppression du suffixe de profil. |

Les anciennes clés de capacité de niveau supérieur sont obsolètes. Utilisez `openclaw doctor --fix` pour
déplacer `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` et `webSearchProviders` sous `contracts` ; le chargement
normal du manifeste ne traite plus ces champs de niveau supérieur comme
possession de capacité.

## Manifeste versus package.json

Les deux fichiers remplissent des rôles différents :

| Fichier                 | À utiliser pour                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json`  | Découverte, validation de la configuration, métadonnées de choix d’authentification et indications d’UI qui doivent exister avant l’exécution du code du plugin |
| `package.json`          | Métadonnées npm, installation des dépendances, et bloc `openclaw` utilisé pour les points d’entrée, le contrôle d’installation, la configuration ou les métadonnées de catalogue |

Si vous ne savez pas où une métadonnée doit aller, utilisez cette règle :

- si OpenClaw doit la connaître avant de charger le code du plugin, mettez-la dans `openclaw.plugin.json`
- si elle concerne le packaging, les fichiers d’entrée ou le comportement d’installation npm, mettez-la dans `package.json`

### Champs de package.json qui affectent la découverte

Certaines métadonnées de plugin avant exécution vivent intentionnellement dans `package.json` sous le
bloc `openclaw` au lieu de `openclaw.plugin.json`.

Exemples importants :

| Champ                                                             | Signification                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Déclare les points d’entrée de plugin natifs.                                                                                                |
| `openclaw.setupEntry`                                             | Point d’entrée léger réservé à la configuration utilisé pendant l’onboarding et le démarrage différé des canaux.                           |
| `openclaw.channel`                                                | Métadonnées légères de catalogue de canal comme les libellés, chemins de documentation, alias et texte de sélection.                       |
| `openclaw.channel.configuredState`                                | Métadonnées légères de vérification d’état configuré qui peuvent répondre à « une configuration via environnement uniquement existe-t-elle déjà ? » sans charger l’exécution complète du canal. |
| `openclaw.channel.persistedAuthState`                             | Métadonnées légères de vérification d’authentification persistée qui peuvent répondre à « quelque chose est-il déjà connecté ? » sans charger l’exécution complète du canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Indications d’installation/mise à jour pour les plugins groupés et publiés en externe.                                                      |
| `openclaw.install.defaultChoice`                                  | Chemin d’installation préféré lorsque plusieurs sources d’installation sont disponibles.                                                     |
| `openclaw.install.minHostVersion`                                 | Version minimale prise en charge de l’hôte OpenClaw, utilisant un plancher semver comme `>=2026.3.22`.                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | Autorise un chemin étroit de récupération par réinstallation de plugin groupé lorsque la configuration est invalide.                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permet aux surfaces de canal réservées à la configuration de se charger avant le plugin de canal complet pendant le démarrage.             |

`openclaw.install.minHostVersion` est appliqué pendant l’installation et le
chargement du registre de manifestes. Les valeurs invalides sont rejetées ; les
valeurs valides mais plus récentes ignorent le plugin sur les hôtes plus anciens.

`openclaw.install.allowInvalidConfigRecovery` est intentionnellement étroit. Cela
ne rend pas installables des configurations cassées arbitraires. Aujourd’hui, cela n’autorise les flux d’installation
à récupérer que d’échecs spécifiques d’upgrade de plugin groupé obsolète, tels qu’un
chemin de plugin groupé manquant ou une entrée `channels.<id>` obsolète pour ce même
plugin groupé. Les erreurs de configuration non liées bloquent toujours l’installation et envoient les opérateurs
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

Utilisez-la lorsque la configuration, doctor ou les flux d’état configuré ont besoin d’une sonde
d’authentification légère oui/non avant le chargement du plugin de canal complet. L’export cible
doit être une petite fonction qui lit uniquement l’état persistant ; ne la faites pas
passer par le barrel d’exécution complet du canal.

`openclaw.channel.configuredState` suit la même forme pour des vérifications légères
d’état configuré via environnement uniquement :

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

Utilisez-la lorsqu’un canal peut répondre à l’état configuré à partir de l’environnement ou d’autres
entrées minuscules non liées à l’exécution. Si la vérification nécessite une résolution complète de la configuration ou la
véritable exécution du canal, conservez cette logique dans le hook `config.hasConfiguredState` du plugin.

## Exigences du schéma JSON

- **Chaque plugin doit livrer un schéma JSON**, même s’il n’accepte aucune configuration.
- Un schéma vide est acceptable (par exemple, `{ "type": "object", "additionalProperties": false }`).
- Les schémas sont validés au moment de la lecture/écriture de la configuration, pas à l’exécution.

## Comportement de validation

- Les clés `channels.*` inconnues sont des **erreurs**, sauf si l’identifiant de canal est déclaré par
  un manifeste de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` et `plugins.slots.*`
  doivent référencer des identifiants de plugin **détectables**. Les identifiants inconnus sont des **erreurs**.
- Si un plugin est installé mais a un manifeste ou un schéma cassé ou manquant,
  la validation échoue et Doctor signale l’erreur du plugin.
- Si une configuration de plugin existe mais que le plugin est **désactivé**, la configuration est conservée et
  un **avertissement** apparaît dans Doctor + les journaux.

Voir [Référence de configuration](/fr/gateway/configuration) pour le schéma complet `plugins.*`.

## Remarques

- Le manifeste est **obligatoire pour les plugins natifs OpenClaw**, y compris les chargements locaux depuis le système de fichiers.
- L’exécution charge toujours le module du plugin séparément ; le manifeste sert uniquement à la
  découverte + validation.
- Les manifestes natifs sont analysés avec JSON5, donc les commentaires, virgules finales et
  clés non entre guillemets sont acceptés tant que la valeur finale reste un objet.
- Seuls les champs de manifeste documentés sont lus par le chargeur de manifeste. Évitez d’ajouter
  ici des clés personnalisées de niveau supérieur.
- `providerAuthEnvVars` est le chemin léger de métadonnées pour les sondes d’authentification,
  la validation des marqueurs d’environnement et des surfaces similaires d’authentification de fournisseur qui ne doivent pas démarrer l’exécution du plugin
  juste pour inspecter les noms d’environnement.
- `providerAuthChoices` est le chemin léger de métadonnées pour les sélecteurs de choix d’authentification,
  la résolution `--auth-choice`, le mapping du fournisseur préféré et l’enregistrement simple
  des drapeaux CLI d’onboarding avant le chargement de l’exécution du fournisseur. Pour les métadonnées
  d’assistant d’exécution qui nécessitent le code du fournisseur, voir
  [Hooks d’exécution du fournisseur](/fr/plugins/architecture#provider-runtime-hooks).
- Les types exclusifs de plugin sont sélectionnés via `plugins.slots.*`.
  - `kind: "memory"` est sélectionné par `plugins.slots.memory`.
  - `kind: "context-engine"` est sélectionné par `plugins.slots.contextEngine`
    (par défaut : `legacy` intégré).
- `channels`, `providers` et `skills` peuvent être omis lorsqu’un
  plugin n’en a pas besoin.
- Si votre plugin dépend de modules natifs, documentez les étapes de build et toute
  exigence de liste d’autorisation du gestionnaire de paquets (par exemple, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Lié

- [Créer des plugins](/fr/plugins/building-plugins) — démarrer avec les plugins
- [Architecture des plugins](/fr/plugins/architecture) — architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK de plugin
