---
read_when:
    - Vous ajoutez un assistant de configuration à un plugin
    - Vous devez comprendre `setup-entry.ts` vs `index.ts`
    - Vous définissez des schémas de configuration de plugin ou des métadonnées `openclaw` dans `package.json`
sidebarTitle: Setup and Config
summary: Assistants de configuration, `setup-entry.ts`, schémas de configuration et métadonnées `package.json`
title: Configuration et setup des plugins
x-i18n:
    generated_at: "2026-04-24T07:24:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Référence pour le packaging des plugins (métadonnées `package.json`), les manifestes
(`openclaw.plugin.json`), les entrées de setup et les schémas de configuration.

<Tip>
  **Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent le packaging dans son contexte :
  [Plugins de canal](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et
  [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` doit contenir un champ `openclaw` qui indique au système de plugins ce
que fournit votre plugin :

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

| Champ        | Type       | Description                                                                                                                  |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Fichiers de point d’entrée (relatifs à la racine du package)                                                                 |
| `setupEntry` | `string`   | Entrée légère réservée au setup (facultatif)                                                                                 |
| `channel`    | `object`   | Métadonnées du catalogue de canaux pour les surfaces de setup, de sélection, de démarrage rapide et d’état                 |
| `providers`  | `string[]` | Identifiants de fournisseurs enregistrés par ce plugin                                                                       |
| `install`    | `object`   | Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Drapeaux de comportement au démarrage                                                                                        |

### `openclaw.channel`

`openclaw.channel` est une métadonnée légère de package pour la découverte de canaux et les
surfaces de setup avant le chargement du runtime.

| Champ                                  | Type       | Signification                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Identifiant canonique du canal.                                                |
| `label`                                | `string`   | Libellé principal du canal.                                                    |
| `selectionLabel`                       | `string`   | Libellé dans le sélecteur/setup lorsqu’il doit différer de `label`.            |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour des catalogues de canaux et surfaces d’état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de setup et de sélection.               |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu’il doit différer de l’identifiant du canal. |
| `blurb`                                | `string`   | Description courte pour l’onboarding/catalogue.                                |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                    |
| `aliases`                              | `string[]` | Alias supplémentaires de recherche pour la sélection de canal.                 |
| `preferOver`                           | `string[]` | Identifiants plugin/canal de priorité inférieure que ce canal doit dépasser.   |
| `systemImage`                          | `string`   | Nom facultatif d’icône/image système pour les catalogues UI de canaux.         |
| `selectionDocsPrefix`                  | `string`   | Texte préfixe avant les liens de documentation dans les surfaces de sélection.  |
| `selectionDocsOmitLabel`               | `boolean`  | Afficher directement le chemin de documentation au lieu d’un lien de documentation avec libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Chaînes courtes supplémentaires ajoutées au texte de sélection.                |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible Markdown pour les décisions de formatage sortant. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour les surfaces de setup, de listes configurées et de documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Fait participer ce canal au flux standard de setup rapide `allowFrom`.         |
| `forceAccountBinding`                  | `boolean`  | Exiger une liaison explicite de compte même lorsqu’un seul compte existe.      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Préférer la recherche de session lors de la résolution des cibles d’annonce pour ce canal. |

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
- `setup` : inclure le canal dans les sélecteurs interactifs de setup/configuration
- `docs` : marquer le canal comme visible publiquement dans les surfaces de documentation/navigation

`showConfigured` et `showInSetup` restent pris en charge comme alias hérités. Préférez
`exposure`.

### `openclaw.install`

`openclaw.install` est une métadonnée de package, pas une métadonnée de manifeste.

| Champ                        | Type                 | Signification                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux d’installation/mise à jour.            |
| `localPath`                  | `string`             | Chemin d’installation local de développement ou inclus.                          |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d’installation préférée lorsque les deux sont disponibles.                |
| `minHostVersion`             | `string`             | Version minimale prise en charge d’OpenClaw sous la forme `>=x.y.z`.             |
| `expectedIntegrity`          | `string`             | Chaîne d’intégrité attendue du dist npm, généralement `sha512-...`, pour les installations épinglées. |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de plugins inclus de récupérer certains échecs de configuration obsolète. |

L’onboarding interactif utilise aussi `openclaw.install` pour les
surfaces d’installation à la demande. Si votre plugin expose des choix
d’authentification fournisseur ou des métadonnées de setup/catalogue de canal avant le chargement du runtime,
l’onboarding peut afficher ce choix, demander npm vs installation locale, installer
ou activer le plugin, puis poursuivre le flux sélectionné. Les choix npm dans l’onboarding exigent des métadonnées de catalogue de confiance avec un `npmSpec` de registre ; les versions exactes et `expectedIntegrity` sont des épingles facultatives. Si
`expectedIntegrity` est présent, les flux d’installation/mise à jour l’appliquent. Gardez les métadonnées « quoi afficher » dans `openclaw.plugin.json` et les métadonnées « comment l’installer »
dans `package.json`.

Si `minHostVersion` est défini, l’installation et le chargement du registre de manifestes l’appliquent tous deux.
Les hôtes plus anciens ignorent le plugin ; les chaînes de version invalides sont rejetées.

Pour les installations npm épinglées, gardez la version exacte dans `npmSpec` et ajoutez
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

`allowInvalidConfigRecovery` n’est pas un contournement général pour des configurations cassées. Il est destiné
uniquement à une récupération étroite de plugin inclus, afin que la réinstallation/le setup puisse réparer des restes connus de mise à niveau comme un chemin manquant de plugin inclus ou une entrée `channels.<id>`
obsolète pour ce même plugin. Si la configuration est cassée pour des raisons sans rapport, l’installation
échoue tout de même en mode fermé et indique à l’opérateur d’exécuter `openclaw doctor --fix`.

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

Lorsqu’il est activé, OpenClaw ne charge que `setupEntry` pendant la phase de démarrage
pré-écoute, même pour les canaux déjà configurés. L’entrée complète est chargée après que le
gateway a commencé à écouter.

<Warning>
  N’activez le chargement différé que lorsque votre `setupEntry` enregistre tout ce dont le
  gateway a besoin avant de commencer à écouter (enregistrement du canal, routes HTTP,
  méthodes gateway). Si l’entrée complète possède des capacités de démarrage requises, conservez
  le comportement par défaut.
</Warning>

Si votre entrée setup/complète enregistre des méthodes RPC gateway, gardez-les sur un
préfixe spécifique au plugin. Les espaces de noms admin cœur réservés (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent détenus par le cœur et se résolvent toujours
vers `operator.admin`.

## Manifeste du plugin

Chaque plugin natif doit fournir un `openclaw.plugin.json` à la racine du package.
OpenClaw s’en sert pour valider la configuration sans exécuter le code du plugin.

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

Voir [Manifeste de plugin](/fr/plugins/manifest) pour la référence complète du schéma.

## Publication ClawHub

Pour les packages plugin, utilisez la commande ClawHub spécifique aux packages :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L’ancien alias de publication réservé aux Skills ne concerne que les Skills. Les packages plugin doivent
toujours utiliser `clawhub package publish`.

## Entrée de setup

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` que
OpenClaw charge lorsqu’il n’a besoin que des surfaces de setup (onboarding, réparation de configuration,
inspection de canaux désactivés).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code runtime lourd (bibliothèques crypto, enregistrements CLI,
services d’arrière-plan) pendant les flux de setup.

Les canaux inclus de l’espace de travail qui conservent des exports sûrs pour le setup dans des modules sidecar peuvent
utiliser `defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` au lieu de
`defineSetupPluginEntry(...)`. Ce contrat inclus prend aussi en charge un export
`runtime` facultatif afin que le câblage runtime au moment du setup reste léger et explicite.

**Quand OpenClaw utilise `setupEntry` au lieu de l’entrée complète :**

- Le canal est désactivé mais a besoin de surfaces de setup/onboarding
- Le canal est activé mais non configuré
- Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Ce que `setupEntry` doit enregistrer :**

- L’objet plugin de canal (via `defineSetupPluginEntry`)
- Toute route HTTP requise avant l’écoute du gateway
- Toute méthode gateway nécessaire pendant le démarrage

Ces méthodes gateway de démarrage doivent toujours éviter les espaces de noms admin
cœur réservés tels que `config.*` ou `update.*`.

**Ce que `setupEntry` ne doit PAS inclure :**

- Enregistrements CLI
- Services d’arrière-plan
- Imports runtime lourds (crypto, SDK)
- Méthodes gateway nécessaires uniquement après le démarrage

### Imports étroits de helpers setup

Pour les chemins setup-only sensibles au temps, préférez les coutures étroites de helpers setup plutôt que l’ombrelle plus large
`plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface setup :

| Chemin d’import                    | À utiliser pour                                                                          | Exports clés                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helpers runtime au moment du setup qui restent disponibles dans `setupEntry` / démarrage différé de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptateurs de setup de compte sensibles à l’environnement                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helpers CLI/archive/docs de setup/install                                                | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Utilisez la couture plus large `plugin-sdk/setup` lorsque vous voulez la boîte à outils setup partagée complète,
y compris des helpers de patch de configuration tels que
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de patch setup restent sûrs à importer sur le chemin chaud. Leur
recherche lazy de surface de contrat de promotion single-account incluse est paresseuse, donc importer
`plugin-sdk/setup-runtime` ne charge pas avidement la découverte de surface de contrat incluse avant que l’adaptateur ne soit réellement utilisé.

### Promotion single-account détenue par le canal

Lorsqu’un canal passe d’une configuration top-level single-account à
`channels.<id>.accounts.*`, le comportement partagé par défaut est de déplacer les valeurs promues
limitées au compte vers `accounts.default`.

Les canaux inclus peuvent réduire ou surcharger cette promotion via leur surface de contrat setup :

- `singleAccountKeysToMove` : clés top-level supplémentaires qui doivent être déplacées dans le
  compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces
  clés sont déplacées dans le compte promu ; les clés partagées de politique/livraison restent à la
  racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisir quel compte existant
  reçoit les valeurs promues

Matrix est l’exemple inclus actuel. Si exactement un compte Matrix nommé existe déjà,
ou si `defaultAccount` pointe vers une clé non canonique existante telle que `Ops`,
la promotion conserve ce compte au lieu de créer une nouvelle entrée
`accounts.default`.

## Schéma de configuration

La configuration du plugin est validée par rapport au schéma JSON Schema de votre manifeste. Les utilisateurs
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

Votre plugin reçoit cette configuration sous `api.pluginConfig` pendant l’enregistrement.

Pour une configuration spécifique au canal, utilisez à la place la section de configuration du canal :

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

### Construire des schémas de configuration de canal

Utilisez `buildChannelConfigSchema` depuis `openclaw/plugin-sdk/core` pour convertir un
schéma Zod en wrapper `ChannelConfigSchema` que OpenClaw valide :

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

## Assistants de setup

Les plugins de canal peuvent fournir des assistants de setup interactifs pour `openclaw onboard`.
L’assistant est un objet `ChannelSetupWizard` sur le `ChannelPlugin` :

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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, et plus encore.
Voir les packages de plugins inclus (par exemple le plugin Discord `src/channel.setup.ts`) pour
des exemples complets.

Pour les invites de liste d’autorisation DM qui n’ont besoin que du flux standard
`note -> prompt -> parse -> merge -> patch`, préférez les helpers setup
partagés depuis `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, et
`createNestedChannelParsedAllowFromPrompt(...)`.

Pour les blocs d’état de setup de canal qui ne varient que par les libellés, scores et éventuelles
lignes supplémentaires, préférez `createStandardChannelSetupStatus(...)` depuis
`openclaw/plugin-sdk/setup` au lieu de réécrire le même objet `status` dans
chaque plugin.

Pour les surfaces setup facultatives qui ne doivent apparaître que dans certains contextes, utilisez
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

`plugin-sdk/channel-setup` expose aussi les builders de plus bas niveau
`createOptionalChannelSetupAdapter(...)` et
`createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une moitié
de cette surface d’installation facultative.

L’adaptateur/l’assistant facultatif généré échoue en mode fermé sur les vraies écritures de configuration. Ils
réutilisent un message unique d’installation requise à travers `validateInput`,
`applyAccountConfig`, et `finalize`, et ajoutent un lien de documentation lorsque `docsPath` est
défini.

Pour les interfaces setup adossées à des binaires, préférez les helpers délégués partagés au lieu de
copier la même colle binaire/état dans chaque canal :

- `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés,
  indices, scores, et détection de binaire
- `createCliPathTextInput(...)` pour les entrées texte adossées à un chemin
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, et
  `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit transférer paresseusement vers
  un assistant complet plus lourd
- `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` n’a besoin que de
  déléguer une décision `textInputs[*].shouldPrompt`

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/fr/tools/clawhub) ou npm, puis installez :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw essaie d’abord ClawHub puis revient automatiquement à npm. Vous pouvez aussi
forcer explicitement ClawHub :

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub uniquement
```

Il n’existe pas d’équivalent `npm:`. Utilisez la spécification normale du package npm lorsque vous
voulez le chemin npm après le repli ClawHub :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dans le dépôt :** placez-les sous l’arborescence d’espace de travail des plugins inclus et ils seront automatiquement
découverts pendant le build.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
  Pour les installations provenant de npm, `openclaw plugins install` exécute
  `npm install --ignore-scripts` (aucun script de cycle de vie). Gardez les arbres de dépendances des plugins
  en JS/TS pur et évitez les packages qui nécessitent des builds `postinstall`.
</Info>

Les plugins inclus détenus par OpenClaw sont la seule exception de réparation au démarrage : lorsqu’une
installation packagée en voit un activé par la configuration du plugin, par une configuration de canal héritée, ou par son manifeste inclus activé par défaut, le démarrage installe les dépendances runtime manquantes de ce plugin avant l’import. Les plugins tiers ne doivent pas compter sur des installations au démarrage ; continuez à utiliser l’installateur explicite de plugins.

## Articles connexes

- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) -- `definePluginEntry` et `defineChannelPluginEntry`
- [Manifeste de plugin](/fr/plugins/manifest) -- référence complète du schéma de manifeste
- [Créer des plugins](/fr/plugins/building-plugins) -- guide pas à pas pour démarrer
