---
read_when:
    - Vous ajoutez un assistant de configuration à un plugin
    - Vous devez comprendre setup-entry.ts par rapport à index.ts
    - Vous définissez des schémas de configuration de plugin ou des métadonnées `openclaw` dans package.json
sidebarTitle: Setup and Config
summary: Assistants de configuration, setup-entry.ts, schémas de configuration et métadonnées package.json
title: Configuration et setup des plugins
x-i18n:
    generated_at: "2026-04-06T03:10:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: eac2586516d27bcd94cc4c259fe6274c792b3f9938c7ddd6dbf04a6dbb988dc9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuration et setup des plugins

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
sont obligatoires. Les extraits canoniques de publication se trouvent dans
`docs/snippets/plugin-publish/`.

### Champs `openclaw`

| Champ        | Type       | Description                                                                                              |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Fichiers de point d’entrée (relatifs à la racine du package)                                             |
| `setupEntry` | `string`   | Entrée légère réservée au setup (facultative)                                                            |
| `channel`    | `object`   | Métadonnées du catalogue de canaux pour les surfaces de setup, de sélection, de démarrage rapide et d’état |
| `providers`  | `string[]` | Identifiants de fournisseurs enregistrés par ce plugin                                                   |
| `install`    | `object`   | Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Drapeaux de comportement au démarrage                                                                    |

### `openclaw.channel`

`openclaw.channel` contient des métadonnées légères du package pour les surfaces de découverte et de setup
des canaux avant le chargement de l’exécution.

| Champ                                  | Type       | Signification                                                                    |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `id`                                   | `string`   | Identifiant canonique du canal.                                                  |
| `label`                                | `string`   | Libellé principal du canal.                                                      |
| `selectionLabel`                       | `string`   | Libellé de sélection/setup lorsqu’il doit différer de `label`.                   |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour des catalogues de canaux et surfaces d’état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de setup et de sélection.                 |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu’il doit différer de l’identifiant du canal. |
| `blurb`                                | `string`   | Courte description d’onboarding/catalogue.                                       |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                      |
| `aliases`                              | `string[]` | Alias supplémentaires pour la sélection du canal.                                |
| `preferOver`                           | `string[]` | Identifiants de plugin/canal de priorité plus basse que ce canal doit surpasser. |
| `systemImage`                          | `string`   | Nom facultatif d’icône/system-image pour les catalogues UI de canaux.            |
| `selectionDocsPrefix`                  | `string`   | Texte préfixe avant les liens de documentation dans les surfaces de sélection.   |
| `selectionDocsOmitLabel`               | `boolean`  | Afficher directement le chemin de documentation au lieu d’un lien documenté avec libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Courtes chaînes supplémentaires ajoutées dans le texte de sélection.             |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible Markdown pour les décisions de formatage sortant. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour les surfaces de setup, de listes configurées et de documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Fait participer ce canal au flux standard de setup rapide `allowFrom`.           |
| `forceAccountBinding`                  | `boolean`  | Exige un rattachement de compte explicite même lorsqu’un seul compte existe.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Privilégie la recherche de session lors de la résolution des cibles d’annonce pour ce canal. |

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

- `configured` : inclure le canal dans les surfaces de liste de type configuré/état
- `setup` : inclure le canal dans les sélecteurs interactifs de setup/configuration
- `docs` : marquer le canal comme orienté public dans les surfaces de documentation/navigation

`showConfigured` et `showInSetup` restent pris en charge comme alias historiques. Préférez
`exposure`.

### `openclaw.install`

`openclaw.install` est une métadonnée de package, pas une métadonnée de manifeste.

| Champ                        | Type                 | Signification                                                                       |
| ---------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux d’installation/mise à jour.               |
| `localPath`                  | `string`             | Chemin d’installation local de développement ou groupé.                             |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d’installation préférée lorsque les deux sont disponibles.                   |
| `minHostVersion`             | `string`             | Version minimale d’OpenClaw prise en charge, sous la forme `>=x.y.z`.               |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de plugin groupé de récupérer après certains échecs dus à une configuration obsolète. |

Si `minHostVersion` est défini, l’installation et le chargement du registre de manifestes
l’appliquent tous deux. Les hôtes plus anciens ignorent le plugin ; les chaînes de version invalides sont rejetées.

`allowInvalidConfigRecovery` n’est pas un contournement général des configurations cassées. Il sert
uniquement à la récupération étroite de plugins groupés, afin que la réinstallation/le setup puisse réparer des restes
connus de mise à niveau comme un chemin de plugin groupé manquant ou une entrée `channels.<id>`
obsolète pour ce même plugin. Si la configuration est cassée pour des raisons non liées, l’installation
échoue quand même de façon fermée et indique à l’opérateur d’exécuter `openclaw doctor --fix`.

### Chargement complet différé

Les plugins de canal peuvent choisir le chargement différé avec :

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
précédant l’écoute, même pour les canaux déjà configurés. L’entrée complète est chargée après
le début de l’écoute de la gateway.

<Warning>
  N’activez le chargement différé que si votre `setupEntry` enregistre tout ce dont la
  gateway a besoin avant de commencer à écouter (enregistrement du canal, routes HTTP,
  méthodes de gateway). Si l’entrée complète possède des capacités requises au démarrage, conservez
  le comportement par défaut.
</Warning>

Si votre setup/entrée complète enregistre des méthodes RPC de gateway, conservez-les sur un
préfixe spécifique au plugin. Les espaces de noms d’administration du noyau réservés (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent possédés par le noyau et sont toujours résolus
vers `operator.admin`.

## Manifeste du plugin

Chaque plugin natif doit livrer un `openclaw.plugin.json` à la racine du package.
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

Même les plugins sans configuration doivent livrer un schéma. Un schéma vide est valide :

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

## Publication sur ClawHub

Pour les packages de plugins, utilisez la commande ClawHub spécifique au package :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L’ancien alias de publication réservé aux skills concerne les skills. Les packages de plugins doivent
toujours utiliser `clawhub package publish`.

## Entrée de setup

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` que
OpenClaw charge lorsqu’il n’a besoin que des surfaces de setup (onboarding, réparation de configuration,
inspection de canal désactivé).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code d’exécution lourd (bibliothèques de chiffrement, enregistrements CLI,
services d’arrière-plan) pendant les flux de setup.

**Quand OpenClaw utilise `setupEntry` au lieu de l’entrée complète :**

- Le canal est désactivé mais a besoin des surfaces de setup/onboarding
- Le canal est activé mais non configuré
- Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Ce que `setupEntry` doit enregistrer :**

- L’objet plugin de canal (via `defineSetupPluginEntry`)
- Toute route HTTP requise avant l’écoute de la gateway
- Toute méthode de gateway nécessaire au démarrage

Ces méthodes de gateway de démarrage doivent toujours éviter les espaces de noms
d’administration du noyau réservés comme `config.*` ou `update.*`.

**Ce que `setupEntry` ne doit PAS inclure :**

- Enregistrements CLI
- Services d’arrière-plan
- Imports d’exécution lourds (crypto, SDK)
- Méthodes de gateway nécessaires uniquement après le démarrage

### Imports d’assistants de setup étroits

Pour les chemins chauds réservés au setup, préférez les points d’accès étroits des assistants de setup plutôt que le point d’accès plus large
`plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de setup :

| Chemin d’import                     | À utiliser pour                                                                       | Exports clés                                                                                                                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | assistants d’exécution au moment du setup qui restent disponibles dans `setupEntry` / démarrage différé de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adaptateurs de setup de compte sensibles à l’environnement                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                             |
| `plugin-sdk/setup-tools`            | assistants setup/install CLI/archive/documentation                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                   |

Utilisez le point d’accès plus large `plugin-sdk/setup` lorsque vous voulez la boîte à outils de setup partagée complète,
y compris les assistants de patch de configuration tels que
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de patch de setup restent sûrs pour le chemin chaud à l’import. Leur recherche groupée
de surface de contrat de promotion de compte unique est paresseuse, donc l’import de
`plugin-sdk/setup-runtime` ne charge pas de manière anticipée la découverte de surface de contrat groupée avant que l’adaptateur soit réellement utilisé.

### Promotion de compte unique possédée par le canal

Lorsqu’un canal passe d’une configuration de niveau supérieur à compte unique vers
`channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les
valeurs promues à portée de compte dans `accounts.default`.

Les canaux groupés peuvent restreindre ou remplacer cette promotion via leur surface de contrat
de setup :

- `singleAccountKeysToMove` : clés supplémentaires de niveau supérieur qui doivent être déplacées dans le
  compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces
  clés sont déplacées dans le compte promu ; les clés partagées de politique/livraison restent à la
  racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisit quel compte existant
  reçoit les valeurs promues

Matrix est l’exemple groupé actuel. Si exactement un compte Matrix nommé
existe déjà, ou si `defaultAccount` pointe vers une clé existante non canonique
telle que `Ops`, la promotion conserve ce compte au lieu de créer une nouvelle
entrée `accounts.default`.

## Schéma de configuration

La configuration du plugin est validée par rapport au schéma JSON de votre manifeste. Les utilisateurs
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

Votre plugin reçoit cette configuration sous la forme `api.pluginConfig` pendant l’enregistrement.

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

### Construire des schémas de configuration de canal

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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, etc.
Consultez les packages de plugins groupés (par exemple le plugin Discord `src/channel.setup.ts`) pour
des exemples complets.

Pour les invites de liste d’autorisation DM qui n’ont besoin que du flux standard
`note -> prompt -> parse -> merge -> patch`, préférez les assistants de setup partagés
de `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` et
`createNestedChannelParsedAllowFromPrompt(...)`.

Pour les blocs d’état de setup de canal qui ne varient que par les libellés, les scores et d’éventuelles
lignes supplémentaires, préférez `createStandardChannelSetupStatus(...)` depuis
`openclaw/plugin-sdk/setup` au lieu de recréer à la main le même objet `status` dans
chaque plugin.

Pour les surfaces de setup facultatives qui ne doivent apparaître que dans certains contextes, utilisez
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

`plugin-sdk/channel-setup` expose également les constructeurs de plus bas niveau
`createOptionalChannelSetupAdapter(...)` et
`createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une moitié
de cette surface d’installation facultative.

L’adaptateur/l’assistant facultatif généré échoue de manière fermée sur les vraies écritures de configuration. Ils
réutilisent un message unique d’installation requise dans `validateInput`,
`applyAccountConfig` et `finalize`, et ajoutent un lien de documentation lorsque `docsPath` est
défini.

Pour les UI de setup pilotées par binaire, préférez les assistants partagés délégués au lieu de
copier la même logique de binaire/état dans chaque canal :

- `createDetectedBinaryStatus(...)` pour les blocs d’état qui ne varient que par les libellés,
  indications, scores et détection de binaire
- `createCliPathTextInput(...)` pour les entrées texte adossées à un chemin
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` et
  `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit transférer vers
  un assistant complet plus lourd de manière paresseuse
- `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` n’a besoin que de
  déléguer une décision `textInputs[*].shouldPrompt`

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/fr/tools/clawhub) ou npm, puis installez :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw essaie d’abord ClawHub puis bascule automatiquement vers npm. Vous pouvez aussi
forcer explicitement ClawHub :

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub uniquement
```

Il n’existe pas de remplacement `npm:` correspondant. Utilisez la spécification de package npm normale lorsque vous
voulez le chemin npm après le repli ClawHub :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dans le dépôt :** placez-les sous l’arborescence de workspace des plugins groupés et ils seront automatiquement
détectés pendant le build.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
  Pour les installations issues de npm, `openclaw plugins install` exécute
  `npm install --ignore-scripts` (sans scripts de cycle de vie). Conservez des arbres de dépendances de plugin
  purs JS/TS et évitez les packages qui nécessitent des builds `postinstall`.
</Info>

## Lié

- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) -- `definePluginEntry` et `defineChannelPluginEntry`
- [Manifeste de plugin](/fr/plugins/manifest) -- référence complète du schéma de manifeste
- [Créer des plugins](/fr/plugins/building-plugins) -- guide pas à pas pour démarrer
