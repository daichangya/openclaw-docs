---
read_when:
    - Vous ajoutez un assistant de configuration à un Plugin
    - Vous devez comprendre `setup-entry.ts` par rapport à `index.ts`
    - Vous définissez des schémas de configuration de Plugin ou des métadonnées OpenClaw dans `package.json`
sidebarTitle: Setup and Config
summary: Assistants de configuration, `setup-entry.ts`, schémas de configuration et métadonnées de `package.json`
title: Configuration et Setup du Plugin
x-i18n:
    generated_at: "2026-04-21T07:04:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuration et Setup du Plugin

Référence pour le packaging des plugins (métadonnées `package.json`), les manifestes
(`openclaw.plugin.json`), les entrées de setup et les schémas de configuration.

<Tip>
  **Vous cherchez un guide pas à pas ?** Les guides pratiques couvrent le packaging dans son contexte :
  [Channel Plugins](/fr/plugins/sdk-channel-plugins#step-1-package-and-manifest) et
  [Provider Plugins](/fr/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Métadonnées du package

Votre `package.json` doit contenir un champ `openclaw` qui indique au système de plugin ce
que votre Plugin fournit :

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
      "blurb": "Brève description du canal."
    }
  }
}
```

**Plugin de fournisseur / référence de publication ClawHub :**

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

Si vous publiez le Plugin en externe sur ClawHub, ces champs `compat` et `build`
sont obligatoires. Les extraits de publication canoniques se trouvent dans
`docs/snippets/plugin-publish/`.

### Champs `openclaw`

| Champ        | Type       | Description                                                                                            |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Fichiers de point d’entrée (relatifs à la racine du package)                                          |
| `setupEntry` | `string`   | Entrée légère réservée au setup (facultatif)                                                           |
| `channel`    | `object`   | Métadonnées de catalogue de canal pour le setup, le sélecteur, le démarrage rapide et les surfaces de statut |
| `providers`  | `string[]` | Identifiants de fournisseur enregistrés par ce Plugin                                                  |
| `install`    | `object`   | Indications d’installation : `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicateurs de comportement au démarrage                                                               |

### `openclaw.channel`

`openclaw.channel` correspond à des métadonnées de package peu coûteuses pour la découverte de canaux et les
surfaces de setup avant le chargement du runtime.

| Champ                                  | Type       | Ce que cela signifie                                                           |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | Identifiant canonique du canal.                                                |
| `label`                                | `string`   | Libellé principal du canal.                                                    |
| `selectionLabel`                       | `string`   | Libellé du sélecteur/setup lorsqu’il doit différer de `label`.                 |
| `detailLabel`                          | `string`   | Libellé de détail secondaire pour des catalogues de canaux et surfaces de statut plus riches. |
| `docsPath`                             | `string`   | Chemin de documentation pour les liens de setup et de sélection.               |
| `docsLabel`                            | `string`   | Libellé de substitution utilisé pour les liens de documentation lorsqu’il doit différer de l’identifiant du canal. |
| `blurb`                                | `string`   | Courte description d’intégration/catalogue.                                    |
| `order`                                | `number`   | Ordre de tri dans les catalogues de canaux.                                    |
| `aliases`                              | `string[]` | Alias de recherche supplémentaires pour la sélection du canal.                 |
| `preferOver`                           | `string[]` | Identifiants de Plugin/canal de priorité inférieure que ce canal doit surpasser. |
| `systemImage`                          | `string`   | Nom facultatif d’icône/system-image pour les catalogues UI de canaux.          |
| `selectionDocsPrefix`                  | `string`   | Texte préfixe avant les liens de documentation dans les surfaces de sélection. |
| `selectionDocsOmitLabel`               | `boolean`  | Affiche directement le chemin de documentation au lieu d’un lien libellé dans le texte de sélection. |
| `selectionExtras`                      | `string[]` | Chaînes courtes supplémentaires ajoutées au texte de sélection.                |
| `markdownCapable`                      | `boolean`  | Marque le canal comme compatible Markdown pour les décisions de mise en forme sortante. |
| `exposure`                             | `object`   | Contrôles de visibilité du canal pour le setup, les listes configurées et les surfaces de documentation. |
| `quickstartAllowFrom`                  | `boolean`  | Fait entrer ce canal dans le flux standard de setup rapide `allowFrom`.        |
| `forceAccountBinding`                  | `boolean`  | Exige une liaison de compte explicite même lorsqu’un seul compte existe.       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Préfère la recherche de session lors de la résolution des cibles d’annonce pour ce canal. |

Exemple :

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (autohébergé)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Intégration de chat autohébergée basée sur Webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide :",
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

- `configured` : inclure le canal dans les surfaces de liste de type configuré/statut
- `setup` : inclure le canal dans les sélecteurs interactifs de setup/configuration
- `docs` : marquer le canal comme visible publiquement dans les surfaces de documentation/navigation

`showConfigured` et `showInSetup` restent pris en charge comme alias hérités. Préférez
`exposure`.

### `openclaw.install`

`openclaw.install` correspond à des métadonnées de package, et non à des métadonnées de manifeste.

| Champ                        | Type                 | Ce que cela signifie                                                            |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spécification npm canonique pour les flux d’installation/mise à jour.           |
| `localPath`                  | `string`             | Chemin d’installation local de développement ou fourni.                         |
| `defaultChoice`              | `"npm"` \| `"local"` | Source d’installation préférée lorsque les deux sont disponibles.               |
| `minHostVersion`             | `string`             | Version minimale prise en charge d’OpenClaw sous la forme `>=x.y.z`.            |
| `allowInvalidConfigRecovery` | `boolean`            | Permet aux flux de réinstallation de Plugin fourni de récupérer après certains échecs de configuration obsolète. |

Si `minHostVersion` est défini, l’installation et le chargement du registre de manifestes l’appliquent tous deux.
Les hôtes plus anciens ignorent le Plugin ; les chaînes de version invalides sont rejetées.

`allowInvalidConfigRecovery` n’est pas un contournement général pour des configurations cassées. Il sert
uniquement à une récupération ciblée pour les plugins fournis, afin que la réinstallation/le setup puisse réparer
des restes connus de mise à niveau comme un chemin de Plugin fourni manquant ou une entrée `channels.<id>`
obsolète pour ce même Plugin. Si la configuration est cassée pour des raisons non liées, l’installation
échoue quand même de manière fermée et indique à l’opérateur d’exécuter `openclaw doctor --fix`.

### Chargement complet différé

Les plugins de canal peuvent opter pour un chargement différé avec :

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

Lorsqu’il est activé, OpenClaw ne charge que `setupEntry` pendant la phase
de démarrage avant écoute, même pour les canaux déjà configurés. L’entrée complète est chargée après que la
gateway a commencé à écouter.

<Warning>
  Activez le chargement différé uniquement lorsque votre `setupEntry` enregistre tout ce dont la
  gateway a besoin avant de commencer à écouter (enregistrement du canal, routes HTTP,
  méthodes gateway). Si l’entrée complète possède des capacités de démarrage requises, conservez
  le comportement par défaut.
</Warning>

Si votre entrée setup/complète enregistre des méthodes RPC gateway, conservez-les sur un
préfixe spécifique au Plugin. Les espaces de noms admin réservés du core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent détenus par le core et se résolvent toujours
vers `operator.admin`.

## Manifeste de Plugin

Chaque Plugin natif doit fournir un `openclaw.plugin.json` à la racine du package.
OpenClaw s’en sert pour valider la configuration sans exécuter le code du Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Ajoute des capacités My Plugin à OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Secret de vérification Webhook"
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

Consultez [Plugin Manifest](/fr/plugins/manifest) pour la référence complète du schéma.

## Publication ClawHub

Pour les packages de Plugin, utilisez la commande ClawHub spécifique au package :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L’ancien alias de publication réservé à Skills est destiné à Skills. Les packages de Plugin doivent
toujours utiliser `clawhub package publish`.

## Entrée de setup

Le fichier `setup-entry.ts` est une alternative légère à `index.ts` que
OpenClaw charge lorsqu’il n’a besoin que des surfaces de setup (intégration, réparation de configuration,
inspection de canal désactivé).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Cela évite de charger du code runtime lourd (bibliothèques cryptographiques, enregistrements CLI,
services en arrière-plan) pendant les flux de setup.

Les canaux d’espace de travail fournis qui conservent des exportations sûres pour le setup dans des modules compagnons peuvent
utiliser `defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` au lieu de
`defineSetupPluginEntry(...)`. Ce contrat fourni prend aussi en charge un export `runtime`
facultatif afin que le câblage runtime au moment du setup reste léger et explicite.

**Quand OpenClaw utilise `setupEntry` au lieu de l’entrée complète :**

- Le canal est désactivé mais a besoin des surfaces de setup/intégration
- Le canal est activé mais non configuré
- Le chargement différé est activé (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Ce que `setupEntry` doit enregistrer :**

- L’objet Plugin de canal (via `defineSetupPluginEntry`)
- Toute route HTTP requise avant l’écoute de la gateway
- Toute méthode gateway nécessaire pendant le démarrage

Ces méthodes gateway de démarrage doivent toujours éviter les espaces de noms admin
réservés du core tels que `config.*` ou `update.*`.

**Ce que `setupEntry` ne doit PAS inclure :**

- Enregistrements CLI
- Services en arrière-plan
- Imports runtime lourds (crypto, SDK)
- Méthodes Gateway nécessaires uniquement après le démarrage

### Imports étroits d’aides de setup

Pour les chemins chauds réservés au setup, préférez les points d’extension étroits d’aides de setup plutôt que l’interface plus large
`plugin-sdk/setup` lorsque vous n’avez besoin que d’une partie de la surface de setup :

| Chemin d’import                     | À utiliser pour                                                                            | Exportations clés                                                                                                                                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | aides runtime au moment du setup qui restent disponibles dans `setupEntry` / démarrage différé de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adaptateurs de setup de compte sensibles à l’environnement                                 | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`            | aides CLI/archive/docs pour le setup/l’installation                                        | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Utilisez le point d’extension plus large `plugin-sdk/setup` lorsque vous voulez l’ensemble complet des outils de setup partagés,
y compris les aides de patch de configuration telles que
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Les adaptateurs de patch de setup restent sûrs à importer sur le chemin chaud. Leur
recherche groupée de surface de contrat de promotion de compte unique est paresseuse ; ainsi, importer
`plugin-sdk/setup-runtime` ne charge pas de façon anticipée la découverte de surface de contrat fournie avant que l’adaptateur ne soit réellement utilisé.

### Promotion à compte unique détenue par le canal

Lorsqu’un canal passe d’une configuration de premier niveau à compte unique à
`channels.<id>.accounts.*`, le comportement partagé par défaut consiste à déplacer les valeurs
promues à portée compte dans `accounts.default`.

Les canaux fournis peuvent restreindre ou remplacer cette promotion via leur surface
de contrat de setup :

- `singleAccountKeysToMove` : clés de premier niveau supplémentaires qui doivent être déplacées dans le
  compte promu
- `namedAccountPromotionKeys` : lorsque des comptes nommés existent déjà, seules ces
  clés sont déplacées dans le compte promu ; les clés partagées de politique/livraison restent à la
  racine du canal
- `resolveSingleAccountPromotionTarget(...)` : choisit quel compte existant
  reçoit les valeurs promues

Matrix est l’exemple fourni actuel. Si exactement un compte Matrix nommé existe déjà,
ou si `defaultAccount` pointe vers une clé existante non canonique telle que `Ops`,
la promotion préserve ce compte au lieu de créer une nouvelle entrée
`accounts.default`.

## Schéma de configuration

La configuration du Plugin est validée par rapport au JSON Schema de votre manifeste. Les utilisateurs
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

Votre Plugin reçoit cette configuration sous la forme `api.pluginConfig` pendant l’enregistrement.

Pour une configuration spécifique au canal, utilisez plutôt la section de configuration du canal :

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
    configuredLabel: "Connecté",
    unconfiguredLabel: "Non configuré",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Jeton du bot",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Utiliser MY_CHANNEL_BOT_TOKEN depuis l’environnement ?",
      keepPrompt: "Conserver le jeton actuel ?",
      inputPrompt: "Saisissez votre jeton de bot :",
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
Consultez les packages de Plugin fournis (par exemple le Plugin Discord `src/channel.setup.ts`) pour
des exemples complets.

Pour les prompts de liste d’autorisation DM qui n’ont besoin que du flux standard
`note -> prompt -> parse -> merge -> patch`, préférez les aides de setup partagées
de `openclaw/plugin-sdk/setup` : `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` et
`createNestedChannelParsedAllowFromPrompt(...)`.

Pour les blocs de statut de setup de canal qui ne varient que par les libellés, les scores et d’éventuelles
lignes supplémentaires, préférez `createStandardChannelSetupStatus(...)` depuis
`openclaw/plugin-sdk/setup` au lieu de réécrire à la main le même objet `status` dans
chaque Plugin.

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
// Renvoie { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` expose aussi les constructeurs de plus bas niveau
`createOptionalChannelSetupAdapter(...)` et
`createOptionalChannelSetupWizard(...)` lorsque vous n’avez besoin que d’une moitié
de cette surface d’installation facultative.

L’adaptateur/l’assistant facultatif généré échoue de manière fermée sur les écritures de configuration réelles. Ils
réutilisent un même message d’installation requise dans `validateInput`,
`applyAccountConfig` et `finalize`, et ajoutent un lien vers la documentation lorsque `docsPath` est
défini.

Pour les interfaces de setup adossées à un binaire, préférez les aides déléguées partagées au lieu de
copier le même code de collage binaire/statut dans chaque canal :

- `createDetectedBinaryStatus(...)` pour les blocs de statut qui ne varient que par les libellés,
  indications, scores et détection de binaire
- `createCliPathTextInput(...)` pour les entrées de texte adossées à un chemin
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` et
  `createDelegatedResolveConfigured(...)` lorsque `setupEntry` doit déléguer paresseusement vers
  un assistant complet plus lourd
- `createDelegatedTextInputShouldPrompt(...)` lorsque `setupEntry` n’a besoin de
  déléguer qu’une décision `textInputs[*].shouldPrompt`

## Publication et installation

**Plugins externes :** publiez sur [ClawHub](/fr/tools/clawhub) ou sur npm, puis installez :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw essaie d’abord ClawHub et revient automatiquement à npm en cas d’échec. Vous pouvez aussi
forcer explicitement ClawHub :

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub uniquement
```

Il n’existe pas de substitution `npm:` équivalente. Utilisez la spécification normale du package npm lorsque vous
voulez le chemin npm après le repli ClawHub :

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dans le dépôt :** placez-les sous l’arborescence d’espace de travail des plugins fournis et ils seront automatiquement
découverts pendant la build.

**Les utilisateurs peuvent installer :**

```bash
openclaw plugins install <package-name>
```

<Info>
  Pour les installations provenant de npm, `openclaw plugins install` exécute
  `npm install --ignore-scripts` (aucun script de cycle de vie). Gardez les arbres de dépendances des plugins
  en JS/TS pur et évitez les packages qui nécessitent des builds `postinstall`.
</Info>

Les plugins fournis détenus par OpenClaw sont la seule exception de réparation au démarrage : lorsqu’une
installation packagée en voit un activé par configuration de Plugin, configuration de canal héritée ou son manifeste fourni activé par défaut,
le démarrage installe les dépendances runtime manquantes de ce Plugin avant import. Les plugins tiers ne doivent pas s’appuyer sur
des installations au démarrage ; continuez à utiliser l’installateur explicite de Plugin.

## Liens connexes

- [SDK Entry Points](/fr/plugins/sdk-entrypoints) -- `definePluginEntry` et `defineChannelPluginEntry`
- [Plugin Manifest](/fr/plugins/manifest) -- référence complète du schéma de manifeste
- [Building Plugins](/fr/plugins/building-plugins) -- guide pas à pas pour démarrer
