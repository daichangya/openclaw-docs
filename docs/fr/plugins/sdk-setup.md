---
read_when:
    - Vous ajoutez un assistant de configuration à un plugin
    - Vous devez comprendre `setup-entry.ts` par rapport à `index.ts`
    - Vous définissez des schémas de configuration de plugin ou des métadonnées `openclaw` dans package.json
sidebarTitle: Setup and Config
summary: Assistants de configuration, setup-entry.ts, schémas de configuration et métadonnées `openclaw` dans package.json
title: Configuration et setup de plugin
x-i18n:
    generated_at: "2026-04-05T12:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68fda27be1c89ea6ba906833113e9190ddd0ab358eb024262fb806746d54f7bf
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuration et setup de plugin

Référence pour le packaging de plugin (métadonnées `package.json`), les manifestes
(`openclaw.plugin.json`), les entrées de setup et les schémas de configuration.

<Tip>
  **Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent le packaging dans son contexte :
  [Plugins de canal](/plugins/sdk-channel-plugins#step-1-package-and-manifest) et
  [Plugins de fournisseur](/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` doit inclure un champ `openclaw` qui indique au système de plugins ce
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

| Champ        | Type       | Description                                                                                           |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Fichiers de point d'entrée (relatifs à la racine du package)                                          |
| `setupEntry` | `string`   | Entrée légère réservée à la configuration (facultative)                                               |
| `channel`    | `object`   | Métadonnées de catalogue de canal pour les surfaces de configuration, sélecteur, démarrage rapide et état |
| `providers`  | `string[]` | IDs de fournisseurs enregistrés par ce plugin                                                         |
| `install`    | `object`   | Indications d'installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Drapeaux de comportement au démarrage                                                                  |

### `openclaw.channel`

`openclaw.channel` correspond à des métadonnées légères de package pour les surfaces de découverte et de configuration de canal
avant le chargement du runtime.

| Champ                                  | Type       | Signification                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canonique du canal.                                                         |
| `label`                                | `string`   | Libellé principal du canal.                                                    |
| `selectionLabel`                       | `string`   | Libellé du sélecteur/setup lorsqu'il doit différer de `label`.                 |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour des catalogues de canaux et surfaces d'état plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de configuration et de sélection.       |
| `docsLabel`                            | `string`   | Libellé de remplacement utilisé pour les liens de documentation lorsqu'il doit différer de l'ID du canal. |
| `blurb`                                | `string`   | Description courte pour l'onboarding/le catalogue.                             |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                    |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection du canal.                 |
| `preferOver`                           | `string[]` | IDs de plugin/canal de priorité inférieure que ce canal doit dépasser.         |
| `systemImage`                          | `string`   | Nom facultatif d'icône/system-image pour les catalogues UI du canal.           |
| `selectionDocsPrefix`                  | `string`   | Texte préfixe avant les liens de documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Afficher directement le chemin de documentation au lieu d'un lien de documentation libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Courtes chaînes supplémentaires ajoutées au texte de sélection.                |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible markdown pour les décisions de formatage sortant. |
| `showConfigured`                       | `boolean`  | Contrôle si les surfaces de liste de canaux configurés affichent ce canal.     |
| `quickstartAllowFrom`                  | `boolean`  | Intègre ce canal dans le flux standard de configuration rapide `allowFrom`.    |
| `forceAccountBinding`                  | `boolean`  | Exige une liaison de compte explicite même lorsqu'un seul compte existe.       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Préfère la recherche de session lors de la résolution des cibles d'annonce pour ce canal. |

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
      "quickstartAllowFrom": true
    }
  }
}
```

### `openclaw.install`

`openclaw.install` correspond à des métadonnées de package, pas à des métadonnées de manifeste.

| Champ                        | Type                 | Signification                                                                       |
| ---------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux d'installation/mise à jour.               |
| `localPath`                  | `string`             | Chemin d'installation local de développement ou groupée.                            |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d'installation préférée lorsque les deux sont disponibles.                   |
| `minHostVersion`             | `string`             | Version minimale prise en charge d'OpenClaw, sous la forme `>=x.y.z`.               |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de plugin groupé de récupérer de certains échecs de configuration obsolète. |

Si `minHostVersion` est défini, l'installation et le chargement du registre de manifeste
l'appliquent tous deux. Les hôtes plus anciens ignorent le plugin ; les chaînes de version invalides sont rejetées.

`allowInvalidConfigRecovery` n'est pas un contournement général pour les configurations cassées. Il
sert uniquement à une récupération étroite de plugins groupés, afin que la réinstallation/configuration puisse réparer
des résidus connus de mise à niveau, comme un chemin de plugin groupé manquant ou une entrée `channels.<id>`
obsolète pour ce même plugin. Si la configuration est cassée pour des raisons non liées, l'installation
échoue toujours proprement et indique à l'opérateur d'exécuter `openclaw doctor --fix`.

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

Lorsqu'il est activé, OpenClaw charge uniquement `setupEntry` pendant la phase
de démarrage avant écoute, même pour les canaux déjà configurés. L'entrée complète est chargée après que la
gateway a commencé à écouter.

<Warning>
  Activez le chargement différé uniquement lorsque votre `setupEntry` enregistre tout ce dont la
  gateway a besoin avant qu'elle ne commence à écouter (enregistrement du canal, routes HTTP,
  méthodes gateway). Si l'entrée complète possède des capacités de démarrage requises, conservez
  le comportement par défaut.
</Warning>

Si votre entrée de setup/complète enregistre des méthodes RPC gateway, gardez-les sur un
préfixe spécifique au plugin. Les espaces de noms admin réservés du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent la propriété du cœur et sont toujours résolus
vers `operator.admin`.

## Manifeste de plugin

Chaque plugin natif doit inclure un `openclaw.plugin.json` à la racine du package.
OpenClaw l'utilise pour valider la configuration sans exécuter le code du plugin.

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

Voir [Manifeste de plugin](/plugins/manifest) pour la référence complète du schéma.

## Publication ClawHub

Pour les packages de plugins, utilisez la commande ClawHub spécifique aux packages :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L'ancien alias de publication réservé aux Skills concerne les Skills. Les packages de plugins doivent
toujours utiliser `clawhub package publish`.

## Entrée de setup

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` que
OpenClaw charge lorsqu'il n'a besoin que des surfaces de configuration (onboarding, réparation de configuration,
inspection de canal désactivé).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger un code runtime lourd (bibliothèques de chiffrement, enregistrements CLI,
services d'arrière-plan) pendant les flux de configuration.

**Quand OpenClaw utilise `setupEntry` au lieu de l'entrée complète :**

- Le canal est désactivé mais a besoin des surfaces de configuration/onboarding
- Le canal est activé mais non configuré
- Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Ce que `setupEntry` doit enregistrer :**

- L'objet plugin de canal (via `defineSetupPluginEntry`)
- Toute route HTTP requise avant l'écoute de la gateway
- Toute méthode gateway nécessaire pendant le démarrage

Ces méthodes gateway de démarrage doivent toujours éviter les espaces de noms admin réservés du cœur
tels que `config.*` ou `update.*`.

**Ce que `setupEntry` ne doit PAS inclure :**

- Enregistrements CLI
- Services d'arrière-plan
- Imports runtime lourds (crypto, SDK)
- Méthodes gateway nécessaires uniquement après le démarrage

### Imports d'assistants de configuration étroits

Pour les chemins chauds réservés à la configuration, préférez les seams d'assistants de configuration étroits plutôt que le parapluie plus large
`plugin-sdk/setup` lorsque vous n'avez besoin que d'une partie de la surface de configuration :

| Chemin d'importation                | À utiliser pour                                                                          | Exports clés                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | assistants runtime au moment de la configuration qui restent disponibles dans `setupEntry` / démarrage différé de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptateurs de configuration de compte sensibles à l'environnement                        | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | assistants de configuration/installation CLI/archive/documentation                        | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Utilisez le seam plus large `plugin-sdk/setup` lorsque vous souhaitez la boîte à outils partagée complète de configuration,
y compris les assistants de patch de configuration tels que
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de patch de configuration restent sûrs à l'importation sur le chemin chaud. Leur recherche groupée
de surface de contrat de promotion mono-compte est paresseuse, de sorte qu'importer
`plugin-sdk/setup-runtime` ne charge pas de manière anticipée la découverte de surface de contrat groupée avant que l'adaptateur ne soit réellement utilisé.

### Promotion mono-compte appartenant au canal

Lorsqu'un canal passe d'une configuration mono-compte de premier niveau à
`channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les valeurs promues limitées au compte dans `accounts.default`.

Les canaux groupés peuvent restreindre ou remplacer cette promotion via leur surface de contrat
de configuration :

- `singleAccountKeysToMove` : clés de premier niveau supplémentaires qui doivent être déplacées dans le
  compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces
  clés sont déplacées dans le compte promu ; les clés partagées de politique/livraison restent à la
  racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisit quel compte existant
  reçoit les valeurs promues

Matrix est l'exemple groupé actuel. Si exactement un compte Matrix nommé
existe déjà, ou si `defaultAccount` pointe vers une clé non canonique existante
comme `Ops`, la promotion préserve ce compte au lieu de créer une nouvelle
entrée `accounts.default`.

## Schéma de configuration

La configuration du plugin est validée par rapport au JSON Schema de votre manifeste. Les utilisateurs
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

Votre plugin reçoit cette configuration sous `api.pluginConfig` lors de l'enregistrement.

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

## Assistants de configuration

Les plugins de canal peuvent fournir des assistants de configuration interactifs pour `openclaw onboard`.
L'assistant est un objet `ChannelSetupWizard` sur le `ChannelPlugin` :

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
Voir les packages de plugins groupés (par exemple le plugin Discord `src/channel.setup.ts`) pour
des exemples complets.

Pour les invites de liste d'autorisation DM qui n'ont besoin que du flux standard
`note -> prompt -> parse -> merge -> patch`, préférez les assistants partagés
de configuration depuis `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, et
`createNestedChannelParsedAllowFromPrompt(...)`.

Pour les blocs d'état de configuration de canal qui ne varient que par les libellés, scores et
lignes supplémentaires facultatives, préférez `createStandardChannelSetupStatus(...)` depuis
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
`createOptionalChannelSetupWizard(...)` lorsque vous n'avez besoin que d'une moitié de
cette surface d'installation facultative.

L'adaptateur/l'assistant facultatif généré échoue proprement sur les vraies écritures de configuration. Ils
réutilisent un même message d'installation requise dans `validateInput`,
`applyAccountConfig` et `finalize`, et ajoutent un lien de documentation lorsque `docsPath` est
défini.

Pour les interfaces de configuration adossées à un binaire, préférez les assistants délégués partagés plutôt que
de recopier la même colle binaire/état dans chaque canal :

- `createDetectedBinaryStatus(...)` pour les blocs d'état qui ne varient que par les libellés,
  indications, scores et détection de binaire
- `createCliPathTextInput(...)` pour les entrées de texte adossées à un chemin
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, et
  `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit déléguer paresseusement vers un assistant complet plus lourd
- `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` n'a besoin que
  de déléguer une décision `textInputs[*].shouldPrompt`

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/tools/clawhub) ou npm, puis installez :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw essaie d'abord ClawHub puis revient automatiquement à npm. Vous pouvez aussi
forcer explicitement ClawHub :

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub uniquement
```

Il n'existe pas de remplacement `npm:` équivalent. Utilisez la spécification normale du package npm lorsque vous
souhaitez le chemin npm après le repli ClawHub :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dans le dépôt :** placez-les sous l'arborescence d'espace de travail des plugins groupés et ils seront automatiquement
découverts pendant la build.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
  Pour les installations provenant de npm, `openclaw plugins install` exécute
  `npm install --ignore-scripts` (pas de scripts lifecycle). Gardez les arbres de dépendances du plugin
  en JS/TS pur et évitez les packages qui nécessitent des builds `postinstall`.
</Info>

## Lié

- [Points d'entrée du SDK](/plugins/sdk-entrypoints) -- `definePluginEntry` et `defineChannelPluginEntry`
- [Manifeste de plugin](/plugins/manifest) -- référence complète du schéma de manifeste
- [Créer des plugins](/plugins/building-plugins) -- guide pas à pas pour bien démarrer
