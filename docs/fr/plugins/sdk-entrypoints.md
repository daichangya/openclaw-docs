---
read_when:
    - Vous avez besoin de la signature de type exacte de `definePluginEntry` ou `defineChannelPluginEntry`
    - Vous souhaitez comprendre le mode d’enregistrement (full vs setup vs métadonnées CLI)
    - Vous recherchez les options de point d’entrée
sidebarTitle: Entry Points
summary: Référence pour `definePluginEntry`, `defineChannelPluginEntry`, et `defineSetupPluginEntry`
title: Points d’entrée de Plugin
x-i18n:
    generated_at: "2026-04-24T07:23:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Chaque plugin exporte un objet d’entrée par défaut. Le SDK fournit trois helpers pour
les créer.

Pour les plugins installés, `package.json` doit pointer le chargement runtime vers du
JavaScript construit lorsqu’il est disponible :

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` et `setupEntry` restent des entrées source valides pour le développement
en espace de travail et en checkout git. `runtimeExtensions` et `runtimeSetupEntry` sont préférés
lorsqu’OpenClaw charge un package installé et permettent aux packages npm d’éviter
la compilation TypeScript au runtime. Si un package installé ne déclare qu’une entrée source
TypeScript, OpenClaw utilisera un pair construit `dist/*.js` correspondant lorsqu’il
existe, puis reviendra à la source TypeScript.

Tous les chemins d’entrée doivent rester à l’intérieur du répertoire du package plugin. Les entrées runtime
et les pairs JavaScript construits déduits ne rendent pas valide un chemin source `extensions` ou
`setupEntry` qui s’échappe du package.

<Tip>
  **Vous cherchez un guide pas à pas ?** Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  ou [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins).
</Tip>

## `definePluginEntry`

**Import :** `openclaw/plugin-sdk/plugin-entry`

Pour les plugins de fournisseur, les plugins d’outils, les plugins de hooks, et tout ce qui **n’est pas**
un canal de messagerie.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Champ          | Type                                                             | Requis | Par défaut          |
| -------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`           | `string`                                                         | Oui    | —                   |
| `name`         | `string`                                                         | Oui    | —                   |
| `description`  | `string`                                                         | Oui    | —                   |
| `kind`         | `string`                                                         | Non    | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non    | Schéma objet vide   |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Oui    | —                   |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- `kind` concerne les slots exclusifs : `"memory"` ou `"context-engine"`.
- `configSchema` peut être une fonction pour une évaluation paresseuse.
- OpenClaw résout et mémorise ce schéma au premier accès, de sorte que les constructeurs de schéma coûteux
  ne s’exécutent qu’une seule fois.

## `defineChannelPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Encapsule `definePluginEntry` avec un câblage spécifique aux canaux. Appelle automatiquement
`api.registerChannel({ plugin })`, expose une couture facultative de métadonnées CLI d’aide racine, et limite `registerFull` selon le mode d’enregistrement.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Champ                 | Type                                                             | Requis | Par défaut          |
| --------------------- | ---------------------------------------------------------------- | ------ | ------------------- |
| `id`                  | `string`                                                         | Oui    | —                   |
| `name`                | `string`                                                         | Oui    | —                   |
| `description`         | `string`                                                         | Oui    | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Oui    | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non    | Schéma objet vide   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non    | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non    | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non    | —                   |

- `setRuntime` est appelé pendant l’enregistrement afin que vous puissiez stocker la référence runtime
  (généralement via `createPluginRuntimeStore`). Il est ignoré pendant la capture
  des métadonnées CLI.
- `registerCliMetadata` s’exécute pendant `api.registrationMode === "cli-metadata"`
  et `api.registrationMode === "full"`.
  Utilisez-le comme emplacement canonique pour les descripteurs CLI détenus par le canal afin que l’aide racine
  reste non activante tout en gardant la compatibilité avec les chargements complets de plugins pour l’enregistrement CLI normal.
- `registerFull` ne s’exécute que lorsque `api.registrationMode === "full"`. Il est ignoré
  lors du chargement setup-only.
- Comme `definePluginEntry`, `configSchema` peut être une fabrique paresseuse et OpenClaw
  mémorise le schéma résolu au premier accès.
- Pour les commandes CLI racine détenues par un plugin, préférez `api.registerCli(..., { descriptors: [...] })`
  lorsque vous voulez que la commande reste chargée paresseusement sans disparaître de
  l’arbre d’analyse de la CLI racine. Pour les plugins de canal, préférez enregistrer ces descripteurs
  depuis `registerCliMetadata(...)` et gardez `registerFull(...)` centré sur le travail runtime uniquement.
- Si `registerFull(...)` enregistre aussi des méthodes RPC gateway, gardez-les sur un
  préfixe spécifique au plugin. Les espaces de noms admin cœur réservés (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours coercés vers
  `operator.admin`.

## `defineSetupPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Renvoie simplement `{ plugin }` sans
câblage runtime ni CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw charge ceci au lieu de l’entrée complète lorsqu’un canal est désactivé,
non configuré, ou lorsque le chargement différé est activé. Voir
[Setup et configuration](/fr/plugins/sdk-setup#setup-entry) pour savoir quand cela importe.

En pratique, associez `defineSetupPluginEntry(...)` aux familles étroites de helpers setup :

- `openclaw/plugin-sdk/setup-runtime` pour des helpers setup sûrs au runtime tels que
  les adaptateurs setup patch import-safe, la sortie de lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, et les proxys setup délégués
- `openclaw/plugin-sdk/channel-setup` pour les surfaces setup d’installation facultative
- `openclaw/plugin-sdk/setup-tools` pour les helpers CLI/archive/docs de setup/install

Gardez les SDK lourds, l’enregistrement CLI et les services runtime de longue durée dans l’entrée complète.

Les canaux inclus d’espace de travail qui séparent les surfaces setup et runtime peuvent utiliser
`defineBundledChannelSetupEntry(...)` depuis
`openclaw/plugin-sdk/channel-entry-contract` à la place. Ce contrat permet à
l’entrée setup de conserver des exports plugin/secrets sûrs pour le setup tout en exposant un
setter runtime :

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

N’utilisez ce contrat inclus que lorsque les flux setup ont réellement besoin d’un setter runtime léger
avant le chargement de l’entrée complète du canal.

## Mode d’enregistrement

`api.registrationMode` indique à votre plugin comment il a été chargé :

| Mode              | Quand                               | Ce qu’il faut enregistrer                                                              |
| ----------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| `"full"`          | Démarrage normal du gateway         | Tout                                                                                   |
| `"setup-only"`    | Canal désactivé/non configuré       | Enregistrement du canal uniquement                                                     |
| `"setup-runtime"` | Flux setup avec runtime disponible  | Enregistrement du canal plus uniquement le runtime léger nécessaire avant le chargement de l’entrée complète |
| `"cli-metadata"`  | Aide racine / capture des métadonnées CLI | Descripteurs CLI uniquement                                                       |

`defineChannelPluginEntry` gère automatiquement cette séparation. Si vous utilisez
`definePluginEntry` directement pour un canal, vérifiez vous-même le mode :

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Enregistrements lourds réservés au runtime
  api.registerService(/* ... */);
}
```

Traitez `"setup-runtime"` comme la fenêtre où des surfaces setup-only au démarrage doivent
exister sans réentrer dans le runtime complet du canal inclus. Les bons cas d’usage sont
l’enregistrement du canal, les routes HTTP setup-safe, les méthodes gateway setup-safe, et
les helpers setup délégués. Les services d’arrière-plan lourds, les enregistreurs CLI, et
l’amorçage de SDK fournisseur/client appartiennent toujours à `"full"`.

Pour les enregistreurs CLI en particulier :

- utilisez `descriptors` lorsque l’enregistreur possède une ou plusieurs commandes racine et que vous
  voulez qu’OpenClaw charge paresseusement le vrai module CLI lors de la première invocation
- assurez-vous que ces descripteurs couvrent chaque racine de commande de haut niveau exposée par l’enregistreur
- utilisez `commands` seuls uniquement pour des chemins de compatibilité eager

## Formes de plugins

OpenClaw classe les plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un seul type de capacité (par ex. fournisseur uniquement) |
| **hybrid-capability** | Plusieurs types de capacités (par ex. fournisseur + parole) |
| **hook-only**         | Uniquement des hooks, aucune capacité              |
| **non-capability**    | Outils/commandes/services mais aucune capacité     |

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin.

## Articles connexes

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — API d’enregistrement et référence des sous-chemins
- [Helpers runtime](/fr/plugins/sdk-runtime) — `api.runtime` et `createPluginRuntimeStore`
- [Setup et configuration](/fr/plugins/sdk-setup) — manifeste, entrée setup, chargement différé
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — construire l’objet `ChannelPlugin`
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — enregistrement des fournisseurs et hooks
