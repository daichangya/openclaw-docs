---
read_when:
    - Vous souhaitez utiliser le CLI memory-wiki
    - Vous documentez ou modifiez `openclaw wiki`
summary: Référence CLI pour `openclaw wiki` (statut du coffre-fort memory-wiki, recherche, compilation, lint, application, bridge et helpers Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-24T07:05:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Inspectez et maintenez le coffre-fort `memory-wiki`.

Fourni par le Plugin intégré `memory-wiki`.

Lié :

- [Plugin Memory Wiki](/fr/plugins/memory-wiki)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [CLI : memory](/fr/cli/memory)

## À quoi cela sert

Utilisez `openclaw wiki` lorsque vous voulez un coffre de connaissances compilé avec :

- recherche native au wiki et lecture de pages
- synthèses riches en provenance
- rapports de contradiction et de fraîcheur
- imports bridge depuis le Plugin mémoire actif
- helpers CLI Obsidian facultatifs

## Commandes courantes

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Commandes

### `wiki status`

Inspecte le mode actuel du coffre-fort, son état de santé et la disponibilité du CLI Obsidian.

Utilisez d’abord cette commande lorsque vous ne savez pas si le coffre-fort est initialisé, si le mode bridge
est sain, ou si l’intégration Obsidian est disponible.

### `wiki doctor`

Exécute les vérifications de santé du wiki et met en évidence les problèmes de configuration ou de coffre-fort.

Problèmes typiques :

- mode bridge activé sans artefacts de mémoire publique
- disposition de coffre-fort invalide ou manquante
- CLI Obsidian externe manquant alors que le mode Obsidian est attendu

### `wiki init`

Crée la structure du coffre-fort wiki et les pages de départ.

Cette commande initialise la structure racine, y compris les index de premier niveau et les répertoires
de cache.

### `wiki ingest <path-or-url>`

Importe du contenu dans la couche source du wiki.

Remarques :

- l’import par URL est contrôlé par `ingest.allowUrlIngest`
- les pages source importées conservent leur provenance dans le frontmatter
- la compilation automatique peut s’exécuter après l’import lorsqu’elle est activée

### `wiki compile`

Reconstruit les index, blocs liés, tableaux de bord et condensés compilés.

Cette commande écrit des artefacts stables orientés machine sous :

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Si `render.createDashboards` est activé, la compilation actualise aussi les pages de rapport.

### `wiki lint`

Vérifie le coffre-fort et signale :

- problèmes structurels
- lacunes de provenance
- contradictions
- questions ouvertes
- pages/affirmations à faible confiance
- pages/affirmations obsolètes

Exécutez cette commande après des mises à jour significatives du wiki.

### `wiki search <query>`

Recherche dans le contenu du wiki.

Le comportement dépend de la configuration :

- `search.backend` : `shared` ou `local`
- `search.corpus` : `wiki`, `memory` ou `all`

Utilisez `wiki search` lorsque vous voulez un classement spécifique au wiki ou des détails de provenance.
Pour un passage de rappel partagé large, préférez `openclaw memory search` lorsque le
Plugin mémoire actif expose une recherche partagée.

### `wiki get <lookup>`

Lit une page du wiki par identifiant ou chemin relatif.

Exemples :

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Applique des mutations ciblées sans chirurgie libre sur les pages.

Les flux pris en charge incluent :

- création/mise à jour d’une page de synthèse
- mise à jour des métadonnées d’une page
- attachement d’identifiants source
- ajout de questions
- ajout de contradictions
- mise à jour de la confiance/du statut
- écriture d’affirmations structurées

Cette commande existe pour que le wiki puisse évoluer en toute sécurité sans modifier manuellement
les blocs gérés.

### `wiki bridge import`

Importe des artefacts de mémoire publique depuis le Plugin mémoire actif vers des pages source
adossées au bridge.

Utilisez cette commande en mode `bridge` lorsque vous voulez récupérer dans le coffre-fort wiki les derniers artefacts mémoire
exportés.

### `wiki unsafe-local import`

Importe depuis des chemins locaux explicitement configurés en mode `unsafe-local`.

Cette fonctionnalité est volontairement expérimentale et limitée à la même machine.

### `wiki obsidian ...`

Helpers Obsidian pour les coffres-forts exécutés en mode compatible Obsidian.

Sous-commandes :

- `status`
- `search`
- `open`
- `command`
- `daily`

Celles-ci nécessitent le CLI officiel `obsidian` dans le `PATH` lorsque
`obsidian.useOfficialCli` est activé.

## Guide d’utilisation pratique

- Utilisez `wiki search` + `wiki get` lorsque la provenance et l’identité des pages comptent.
- Utilisez `wiki apply` au lieu de modifier à la main les sections générées gérées.
- Utilisez `wiki lint` avant de faire confiance à un contenu contradictoire ou à faible confiance.
- Utilisez `wiki compile` après des imports en masse ou des changements de source lorsque vous voulez immédiatement des
  tableaux de bord et des condensés compilés à jour.
- Utilisez `wiki bridge import` lorsque le mode bridge dépend d’artefacts mémoire nouvellement exportés.

## Liens avec la configuration

Le comportement de `openclaw wiki` est façonné par :

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Voir [Plugin Memory Wiki](/fr/plugins/memory-wiki) pour le modèle de configuration complet.

## Lié

- [Référence CLI](/fr/cli)
- [Memory wiki](/fr/plugins/memory-wiki)
