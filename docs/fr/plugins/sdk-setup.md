---
read_when:
    - Vous ajoutez un assistant de configuration à un plugin
    - Vous devez comprendre `setup-entry.ts` par rapport à `index.ts`
    - Vous définissez des schémas de configuration de plugins ou des métadonnées OpenClaw dans `package.json`
sidebarTitle: Setup and Config
summary: Assistants de configuration, setup-entry.ts, schémas de configuration et métadonnées package.json
title: Configuration et config des plugins
x-i18n:
    generated_at: "2026-04-23T14:01:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuration et config des plugins

Référence pour le packaging des plugins (métadonnées `package.json`), les manifestes
(`openclaw.plugin.json`), les entrées de configuration et les schémas de configuration.

<Tip>
  **Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent le packaging dans son contexte :
  [Plugins de canal](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et
  [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` doit contenir un champ `openclaw` qui indique au système de plugins ce que
votre plugin fournit :

**Plugin de canal :**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Plugin de fournisseur / base de publication ClawHub :**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
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

Si vous publiez le plugin en externe sur ClawHub, ces champs `compat` et `build`
sont requis. Les extraits canoniques de publication se trouvent dans
`docs/snippets/plugin-publish/`.

### Champs `openclaw`

| Champ        | Type       | Description                                                                                                                 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Fichiers de point d’entrée (relatifs à la racine du package)                                                                |
| `setupEntry` | `string`   | Entrée légère réservée à la configuration (facultative)                                                                     |
| `channel`    | `object`   | Métadonnées de catalogue de canal pour les surfaces de configuration, de sélection, de démarrage rapide et d’état         |
| `providers`  | `string[]` | Identifiants de fournisseur enregistrés par ce plugin                                                                       |
| `install`    | `object`   | Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicateurs de comportement au démarrage                                                                                    |

### `openclaw.channel`

`openclaw.channel` est une métadonnée légère du package pour la découverte des canaux et les
surfaces de configuration avant le chargement à l’exécution.

| Champ                                  | Type       | Signification                                                                  |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Identifiant canonique du canal.                                               |
| `label`                                | `string`   | Libellé principal du canal.                                                   |
| `selectionLabel`                       | `string`   | Libellé de sélection/configuration lorsqu’il doit différer de `label`.        |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour des catalogues de canaux et surfaces d’état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de configuration et de sélection.      |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu’il doit différer de l’identifiant du canal. |
| `blurb`                                | `string`   | Courte description pour l’intégration/le catalogue.                           |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                   |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection du canal.                |
| `preferOver`                           | `string[]` | Identifiants de plugin/canal de priorité inférieure que ce canal doit dépasser. |
| `systemImage`                          | `string`   | Nom facultatif d’icône/d’image système pour les catalogues d’interface de canal. |
| `selectionDocsPrefix`                  | `string`   | Texte préfixe avant les liens de documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Affiche directement le chemin de documentation au lieu d’un lien libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Courtes chaînes supplémentaires ajoutées dans le texte de sélection.          |
| `markdownCapable`                      | `boolean`  | Indique que le canal prend en charge Markdown pour les décisions de formatage sortant. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour les surfaces de configuration, listes configurées et documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Inclut ce canal dans le flux standard de démarrage rapide `allowFrom`.        |
| `forceAccountBinding`                  | `boolean`  | Exige une liaison explicite de compte même lorsqu’un seul compte existe.      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Préfère la recherche de session lors de la résolution des cibles d’annonce pour ce canal. |

Exemple :

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` prend en charge :

- `configured` : inclure le canal dans les surfaces de type liste configurée/état
- `setup` : inclure le canal dans les sélecteurs interactifs de configuration
- `docs` : marquer le canal comme public dans les surfaces de documentation/navigation

`showConfigured` et `showInSetup` restent pris en charge comme alias hérités. Préférez
`exposure`.

### `openclaw.install`

`openclaw.install` est une métadonnée de package, pas une métadonnée de manifeste.

| Champ                        | Type                 | Signification                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux d’installation/mise à jour.           |
| `localPath`                  | `string`             | Chemin d’installation local de développement ou intégré.                         |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d’installation préférée lorsque les deux sont disponibles.                |
| `minHostVersion`             | `string`             | Version minimale prise en charge d’OpenClaw sous la forme `>=x.y.z`.             |
| `expectedIntegrity`          | `string`             | Chaîne d’intégrité attendue pour le dist npm, généralement `sha512-...`, pour les installations épinglées. |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de plugins intégrés de récupérer de certaines erreurs de configuration obsolète. |

L’intégration interactive utilise aussi `openclaw.install` pour les
surfaces d’installation à la demande. Si votre plugin expose des choix d’authentification de fournisseur ou des métadonnées
de configuration/catalogue de canal avant le chargement à l’exécution, l’intégration peut
afficher ce choix, demander npm ou installation locale, installer ou activer le plugin, puis poursuivre le
flux sélectionné. Les choix d’intégration npm exigent des métadonnées de catalogue fiables avec un
`npmSpec` de registre ; les versions exactes et `expectedIntegrity` sont des épingles facultatives. Si
`expectedIntegrity` est présent, les flux d’installation/mise à jour l’appliquent. Conservez les métadonnées
« quoi afficher » dans `openclaw.plugin.json` et les métadonnées
« comment l’installer » dans `package.json`.

Si `minHostVersion` est défini, l’installation et le chargement du registre de manifestes l’appliquent
tous deux. Les hôtes plus anciens ignorent le plugin ; les chaînes de version invalides sont rejetées.

Pour les installations npm épinglées, conservez la version exacte dans `npmSpec` et ajoutez
l’intégrité attendue de l’artefact :

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` n’est pas un contournement général des configurations cassées. Il est
réservé à une récupération ciblée des plugins intégrés, afin que la réinstallation/configuration puisse réparer des restes de mise à niveau connus
comme un chemin de plugin intégré manquant ou une entrée `channels.<id>`
obsolète pour ce même plugin. Si la configuration est cassée pour des raisons non liées, l’installation
échoue quand même de manière fermée et indique à l’opérateur d’exécuter `openclaw doctor --fix`.

### Chargement complet différé

Les plugins de canal peuvent activer le chargement différé avec :

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Lorsque cette option est activée, OpenClaw ne charge que `setupEntry` pendant la
phase de démarrage pré-écoute, même pour les canaux déjà configurés. L’entrée complète est chargée après que le
gateway commence à écouter.

<Warning>
  Activez le chargement différé uniquement lorsque votre `setupEntry` enregistre tout ce dont le
  gateway a besoin avant de commencer à écouter (enregistrement du canal, routes HTTP,
  méthodes gateway). Si l’entrée complète possède des capacités de démarrage requises, conservez le comportement par défaut.
</Warning>

Si votre entrée setup/complète enregistre des méthodes RPC du gateway, conservez-les sur un
préfixe spécifique au plugin. Les espaces de noms d’administration réservés du noyau (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent la propriété du noyau et se résolvent toujours
vers `operator.admin`.

## Manifeste du plugin

Chaque plugin natif doit fournir un `openclaw.plugin.json` à la racine du package.
OpenClaw l’utilise pour valider la configuration sans exécuter le code du plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Pour les plugins de canal, ajoutez `kind` et `channels` :

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Même les plugins sans configuration doivent fournir un schéma. Un schéma vide est valide :

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Voir [Manifeste du plugin](/fr/plugins/manifest) pour la référence complète du schéma.

## Publication ClawHub

Pour les packages de plugins, utilisez la commande ClawHub spécifique au package :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L’ancien alias de publication réservé aux Skills est destiné aux Skills. Les packages de plugins doivent
toujours utiliser `clawhub package publish`.

## Entrée de configuration

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` que
OpenClaw charge lorsqu’il n’a besoin que des surfaces de configuration (intégration, réparation de configuration,
inspection des canaux désactivés).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code d’exécution lourd (bibliothèques crypto, enregistrements CLI,
services d’arrière-plan) pendant les flux de configuration.

Les canaux intégrés de l’espace de travail qui conservent des exports sûrs pour la configuration dans des modules annexes peuvent
utiliser `defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` au lieu de
`defineSetupPluginEntry(...)`. Ce contrat intégré prend aussi en charge un export
`runtime` facultatif afin que le câblage d’exécution au moment de la configuration reste léger et explicite.

**Quand OpenClaw utilise `setupEntry` au lieu de l’entrée complète :**

- Le canal est désactivé mais a besoin des surfaces de configuration/d’intégration
- Le canal est activé mais non configuré
- Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Ce que `setupEntry` doit enregistrer :**

- L’objet plugin de canal (via `defineSetupPluginEntry`)
- Toute route HTTP requise avant que le gateway n’écoute
- Toute méthode gateway nécessaire au démarrage

Ces méthodes gateway de démarrage doivent toujours éviter les
espaces de noms d’administration réservés du noyau tels que `config.*` ou `update.*`.

**Ce que `setupEntry` ne doit PAS inclure :**

- Enregistrements CLI
- Services d’arrière-plan
- Imports d’exécution lourds (crypto, SDK)
- Méthodes gateway nécessaires uniquement après le démarrage

### Imports ciblés des assistants de configuration

Pour les chemins à chaud réservés à la configuration, préférez les surfaces ciblées des assistants de configuration plutôt que le point d’entrée plus large
`plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de configuration :

| Chemin d’importation               | À utiliser pour                                                                          | Exports clés                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | assistants d’exécution au moment de la configuration qui restent disponibles dans `setupEntry` / le démarrage différé du canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptateurs de configuration de compte tenant compte de l’environnement                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | assistants CLI/archive/documentation pour la configuration/l’installation                | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Utilisez la surface plus large `plugin-sdk/setup` lorsque vous voulez la boîte à outils partagée complète de configuration,
y compris les assistants de patch de configuration tels que
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de patch de configuration restent sûrs pour le chemin à chaud lors de l’importation. Leur recherche de surface de contrat de promotion
intégrée pour compte unique est paresseuse, donc importer
`plugin-sdk/setup-runtime` ne charge pas avec empressement la découverte de surface de contrat intégrée avant que l’adaptateur ne soit réellement utilisé.

### Promotion mono-compte détenue par le canal

Lorsqu’un canal passe d’une configuration de premier niveau mono-compte vers
`channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les valeurs promues à portée de compte vers `accounts.default`.

Les canaux intégrés peuvent restreindre ou remplacer cette promotion via leur surface de contrat de configuration :

- `singleAccountKeysToMove` : clés de premier niveau supplémentaires qui doivent être déplacées vers le
  compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces
  clés sont déplacées vers le compte promu ; les clés partagées de politique/de remise restent à la
  racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisit quel compte existant
  reçoit les valeurs promues

Matrix est l’exemple intégré actuel. Si exactement un compte Matrix nommé existe
déjà, ou si `defaultAccount` pointe vers une clé non canonique existante
comme `Ops`, la promotion préserve ce compte au lieu de créer une nouvelle entrée
`accounts.default`.

## Schéma de configuration

La configuration du plugin est validée par rapport au schéma JSON dans votre manifeste. Les utilisateurs
configurent les plugins via :

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Votre plugin reçoit cette configuration sous la forme de `api.pluginConfig` pendant l’enregistrement.

Pour une configuration spécifique à un canal, utilisez plutôt la section de configuration du canal :

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Création de schémas de configuration de canal

Utilisez `buildChannelConfigSchema` depuis `openclaw/plugin-sdk/core` pour convertir un
schéma Zod dans l’enveloppe `ChannelConfigSchema` qu’OpenClaw valide :

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Assistants de configuration

Les plugins de canal peuvent fournir des assistants de configuration interactifs pour `openclaw onboard`.
L’assistant est un objet `ChannelSetupWizard` sur `ChannelPlugin` :

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

Le type `ChannelSetupWizard` prend en charge `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, etc.
Consultez les packages de plugins intégrés (par exemple le plugin Discord `src/channel.setup.ts`) pour des
exemples complets.

Pour les invites de liste d’autorisation des MP qui n’ont besoin que du flux standard
`note -> prompt -> parse -> merge -> patch`, préférez les assistants de configuration
partagés depuis `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, et
`createNestedChannelParsedAllowFromPrompt(...)`.

Pour les blocs d’état de configuration de canal qui ne varient que par les libellés, les scores et d’éventuelles
lignes supplémentaires, préférez `createStandardChannelSetupStatus(...)` depuis
`openclaw/plugin-sdk/setup` au lieu de réécrire le même objet `status` dans
chaque plugin.

Pour les surfaces de configuration facultatives qui ne doivent apparaître que dans certains contextes, utilisez
`createOptionalChannelSetupSurface` depuis `openclaw/plugin-sdk/channel-setup` :

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` expose aussi les constructeurs de plus bas niveau
`createOptionalChannelSetupAdapter(...)` et
`createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une moitié de
cette surface d’installation facultative.

L’adaptateur/l’assistant facultatif généré échoue de manière fermée sur les écritures réelles de configuration. Ils
réutilisent un même message d’installation requise dans `validateInput`,
`applyAccountConfig` et `finalize`, et ajoutent un lien vers la documentation lorsque `docsPath` est
défini.

Pour les interfaces de configuration adossées à un binaire, préférez les assistants partagés délégués au lieu de
copier la même logique de binaire/état dans chaque canal :

- `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés,
  les indications, les scores et la détection du binaire
- `createCliPathTextInput(...)` pour les entrées de texte adossées à un chemin
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, et
  `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit transférer paresseusement vers un assistant complet plus lourd
- `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` n’a besoin que de
  déléguer une décision `textInputs[*].shouldPrompt`

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/fr/tools/clawhub) ou npm, puis installez :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw essaie d’abord ClawHub et revient automatiquement à npm. Vous pouvez aussi
forcer explicitement ClawHub :

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub uniquement
```

Il n’existe pas de remplacement `npm:` équivalent. Utilisez la spécification normale du package npm lorsque vous
voulez le chemin npm après le repli ClawHub :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dans le dépôt :** placez-les sous l’arborescence de l’espace de travail des plugins intégrés et ils seront automatiquement
découverts pendant la build.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
  Pour les installations depuis npm, `openclaw plugins install` exécute
  `npm install --ignore-scripts` (aucun script de cycle de vie). Gardez les arbres de dépendances des plugins
  en pur JS/TS et évitez les packages qui nécessitent des builds `postinstall`.
</Info>

Les plugins intégrés gérés par OpenClaw sont la seule exception de réparation au démarrage : lorsqu’une
installation empaquetée en voit un activé par la configuration du plugin, une configuration de canal héritée, ou
son manifeste intégré activé par défaut, le démarrage installe les dépendances d’exécution manquantes de ce plugin avant l’importation. Les plugins tiers ne doivent pas compter sur les installations au démarrage ; continuez d’utiliser le programme d’installation explicite des plugins.

## Liens connexes

- [Points d’entrée SDK](/fr/plugins/sdk-entrypoints) -- `definePluginEntry` et `defineChannelPluginEntry`
- [Manifeste du plugin](/fr/plugins/manifest) -- référence complète du schéma de manifeste
- [Création de plugins](/fr/plugins/building-plugins) -- guide de démarrage pas à pas
