---
read_when:
    - Vous avez besoin de la signature de type exacte de `definePluginEntry` ou `defineChannelPluginEntry`
    - Vous voulez comprendre le mode d’enregistrement (full vs setup vs métadonnées CLI)
    - Vous recherchez les options des points d’entrée
sidebarTitle: Entry Points
summary: Référence pour `definePluginEntry`, `defineChannelPluginEntry` et `defineSetupPluginEntry`
title: Points d’entrée de plugin
x-i18n:
    generated_at: "2026-04-05T12:49:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 799dbfe71e681dd8ba929a7a631dfe745c3c5c69530126fea2f9c137b120f51f
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Points d’entrée de plugin

Chaque plugin exporte un objet d’entrée par défaut. Le SDK fournit trois helpers pour
les créer.

<Tip>
  **Vous cherchez un guide pas à pas ?** Voir [Plugins de canal](/plugins/sdk-channel-plugins)
  ou [Plugins de fournisseur](/plugins/sdk-provider-plugins) pour des guides étape par étape.
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

| Champ          | Type                                                             | Obligatoire | Par défaut          |
| -------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`           | `string`                                                         | Oui         | —                   |
| `name`         | `string`                                                         | Oui         | —                   |
| `description`  | `string`                                                         | Oui         | —                   |
| `kind`         | `string`                                                         | Non         | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Oui         | —                   |

- `id` doit correspondre à votre manifeste `openclaw.plugin.json`.
- `kind` sert pour les emplacements exclusifs : `"memory"` ou `"context-engine"`.
- `configSchema` peut être une fonction pour une évaluation paresseuse.
- OpenClaw résout et met ce schéma en cache lors du premier accès, de sorte que les constructeurs de schéma coûteux
  ne s’exécutent qu’une seule fois.

## `defineChannelPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Encapsule `definePluginEntry` avec le câblage spécifique aux canaux. Appelle automatiquement
`api.registerChannel({ plugin })`, expose une couture facultative de métadonnées CLI d’aide racine, et conditionne `registerFull` au mode d’enregistrement.

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

| Champ                 | Type                                                             | Obligatoire | Par défaut          |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                  | `string`                                                         | Oui         | —                   |
| `name`                | `string`                                                         | Oui         | —                   |
| `description`         | `string`                                                         | Oui         | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Oui         | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Non         | Schéma d’objet vide |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Non         | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Non         | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Non         | —                   |

- `setRuntime` est appelé pendant l’enregistrement afin que vous puissiez stocker la référence de runtime
  (généralement via `createPluginRuntimeStore`). Il est ignoré pendant la capture
  de métadonnées CLI.
- `registerCliMetadata` s’exécute à la fois lorsque `api.registrationMode === "cli-metadata"`
  et lorsque `api.registrationMode === "full"`.
  Utilisez-le comme emplacement canonique pour les descripteurs CLI détenus par le canal afin que l’aide racine
  reste non activante tout en gardant l’enregistrement normal des commandes CLI compatible
  avec les chargements complets de plugins.
- `registerFull` ne s’exécute que lorsque `api.registrationMode === "full"`. Il est ignoré
  lors du chargement setup-only.
- Comme pour `definePluginEntry`, `configSchema` peut être une fabrique paresseuse et OpenClaw
  met en cache le schéma résolu lors du premier accès.
- Pour les commandes CLI racine détenues par le plugin, préférez `api.registerCli(..., { descriptors: [...] })`
  lorsque vous voulez que la commande reste chargée paresseusement sans disparaître de
  l’arbre d’analyse de la CLI racine. Pour les plugins de canal, préférez enregistrer ces descripteurs
  depuis `registerCliMetadata(...)` et gardez `registerFull(...)` concentré sur le travail réservé au runtime.
- Si `registerFull(...)` enregistre aussi des méthodes Gateway RPC, gardez-les sur un
  préfixe spécifique au plugin. Les espaces de noms d’administration réservés au cœur (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) sont toujours forcés à
  `operator.admin`.

## `defineSetupPluginEntry`

**Import :** `openclaw/plugin-sdk/channel-core`

Pour le fichier léger `setup-entry.ts`. Renvoie simplement `{ plugin }` sans
câblage runtime ni CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw charge ceci à la place de l’entrée complète lorsqu’un canal est désactivé,
non configuré, ou lorsque le chargement différé est activé. Voir
[Setup et configuration](/plugins/sdk-setup#setup-entry) pour savoir quand cela compte.

En pratique, associez `defineSetupPluginEntry(...)` aux familles étroites de helpers setup :

- `openclaw/plugin-sdk/setup-runtime` pour des helpers setup sûrs côté runtime tels que
  les adaptateurs de patch setup import-safe, la sortie lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, et les proxys setup délégués
- `openclaw/plugin-sdk/channel-setup` pour les surfaces setup à installation facultative
- `openclaw/plugin-sdk/setup-tools` pour les helpers setup/install CLI/archive/docs

Gardez les SDK lourds, l’enregistrement CLI et les services runtime longue durée dans l’entrée complète.

## Mode d’enregistrement

`api.registrationMode` indique à votre plugin comment il a été chargé :

| Mode              | Quand                              | Ce qu’il faut enregistrer                                                             |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| `"full"`          | Démarrage normal de Gateway        | Tout                                                                                  |
| `"setup-only"`    | Canal désactivé/non configuré      | Enregistrement du canal uniquement                                                    |
| `"setup-runtime"` | Flux setup avec runtime disponible | Enregistrement du canal plus uniquement le runtime léger nécessaire avant le chargement de l’entrée complète |
| `"cli-metadata"`  | Aide racine / capture de métadonnées CLI | Descripteurs CLI uniquement                                                      |

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

Traitez `"setup-runtime"` comme la fenêtre où les surfaces de démarrage setup-only doivent
exister sans réentrer dans le runtime complet du canal intégré. Les bonnes utilisations sont
l’enregistrement du canal, les routes HTTP setup-safe, les méthodes gateway setup-safe, et
les helpers setup délégués. Les services d’arrière-plan lourds, les enregistreurs CLI et
les bootstrap SDK fournisseur/client appartiennent toujours à `"full"`.

Pour les enregistreurs CLI en particulier :

- utilisez `descriptors` lorsque l’enregistreur possède une ou plusieurs commandes racine et que vous
  voulez qu’OpenClaw charge paresseusement le vrai module CLI à la première invocation
- assurez-vous que ces descripteurs couvrent chaque racine de commande de premier niveau exposée par l’enregistreur
- utilisez `commands` seul uniquement pour des chemins de compatibilité eager

## Formes de plugin

OpenClaw classe les plugins chargés selon leur comportement d’enregistrement :

| Forme                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un seul type de capacité (par ex. fournisseur seul) |
| **hybrid-capability** | Plusieurs types de capacité (par ex. fournisseur + speech) |
| **hook-only**         | Seulement des hooks, aucune capacité               |
| **non-capability**    | Outils/commandes/services mais aucune capacité     |

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin.

## Liens associés

- [Vue d’ensemble du SDK](/plugins/sdk-overview) — API d’enregistrement et référence des sous-chemins
- [Helpers runtime](/plugins/sdk-runtime) — `api.runtime` et `createPluginRuntimeStore`
- [Setup et configuration](/plugins/sdk-setup) — manifeste, entrée setup, chargement différé
- [Plugins de canal](/plugins/sdk-channel-plugins) — construction de l’objet `ChannelPlugin`
- [Plugins de fournisseur](/plugins/sdk-provider-plugins) — enregistrement du fournisseur et hooks
