---
read_when:
    - Vous voulez une connaissance persistante au-delà de simples notes MEMORY.md
    - Vous configurez le Plugin intégré memory-wiki
    - Vous voulez comprendre wiki_search, wiki_get ou le mode pont
summary: 'memory-wiki : coffre-fort de connaissances compilé avec provenance, assertions, tableaux de bord et mode pont'
title: Wiki memory
x-i18n:
    generated_at: "2026-04-24T07:22:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` est un plugin intégré qui transforme la memory durable en
coffre-fort de connaissances compilé.

Il ne **remplace pas** le plugin memory actif. Le plugin memory actif continue
de gérer le rappel, la promotion, l’indexation et Dreaming. `memory-wiki` se place à côté
et compile la connaissance durable en un wiki navigable avec des pages déterministes,
des assertions structurées, de la provenance, des tableaux de bord et des digests lisibles par machine.

Utilisez-le lorsque vous voulez que la memory se comporte davantage comme une couche de connaissance maintenue
et moins comme un empilement de fichiers Markdown.

## Ce qu’il ajoute

- Un coffre-fort wiki dédié avec une mise en page déterministe des pages
- Des métadonnées structurées d’assertions et de preuves, pas seulement de la prose
- Provenance, confiance, contradictions et questions ouvertes au niveau de la page
- Digests compilés pour les consommateurs agent/runtime
- Outils natifs au wiki pour search/get/apply/lint
- Mode pont facultatif qui importe les artefacts publics depuis le plugin memory actif
- Mode de rendu compatible Obsidian et intégration CLI facultatifs

## Comment il s’intègre à la memory

Pensez à la séparation comme ceci :

| Couche                                                  | Gère                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Plugin memory actif (`memory-core`, QMD, Honcho, etc.) | Rappel, recherche sémantique, promotion, Dreaming, runtime memory                         |
| `memory-wiki`                                           | Pages wiki compilées, synthèses riches en provenance, tableaux de bord, search/get/apply spécifiques au wiki |

Si le plugin memory actif expose des artefacts de rappel partagés, OpenClaw peut rechercher
dans les deux couches en un seul passage avec `memory_search corpus=all`.

Lorsque vous avez besoin d’un classement spécifique au wiki, de provenance ou d’un accès direct aux pages, utilisez
plutôt les outils natifs du wiki.

## Schéma hybride recommandé

Une valeur par défaut solide pour les configurations local-first est :

- QMD comme backend memory actif pour le rappel et la recherche sémantique large
- `memory-wiki` en mode `bridge` pour des pages de connaissance synthétisées durables

Cette séparation fonctionne bien parce que chaque couche reste concentrée :

- QMD garde les notes brutes, exports de session et collections supplémentaires recherchables
- `memory-wiki` compile les entités stables, assertions, tableaux de bord et pages sources

Règle pratique :

- utilisez `memory_search` lorsque vous voulez un rappel large unique à travers la memory
- utilisez `wiki_search` et `wiki_get` lorsque vous voulez des résultats wiki sensibles à la provenance
- utilisez `memory_search corpus=all` lorsque vous voulez qu’une recherche partagée couvre les deux couches

Si le mode pont signale zéro artefact exporté, le plugin memory actif n’expose pas
encore d’entrées de pont publiques. Exécutez d’abord `openclaw wiki doctor`,
puis confirmez que le plugin memory actif prend en charge les artefacts publics.

## Modes de coffre-fort

`memory-wiki` prend en charge trois modes de coffre-fort :

### `isolated`

Coffre-fort propre, sources propres, aucune dépendance à `memory-core`.

Utilisez-le lorsque vous voulez que le wiki soit son propre magasin de connaissances organisé.

### `bridge`

Lit les artefacts memory publics et les événements memory depuis le plugin memory actif
à travers les coutures publiques du SDK Plugin.

Utilisez-le lorsque vous voulez que le wiki compile et organise les
artefacts exportés par le plugin memory sans aller fouiller dans les internes privés du plugin.

Le mode pont peut indexer :

- artefacts memory exportés
- rapports de Dreaming
- notes quotidiennes
- fichiers racine memory
- journaux d’événements memory

### `unsafe-local`

Échappatoire explicite sur la même machine pour des chemins privés locaux.

Ce mode est volontairement expérimental et non portable. Utilisez-le uniquement lorsque vous
comprenez la limite de confiance et avez spécifiquement besoin d’un accès au système de fichiers local que
le mode pont ne peut pas fournir.

## Disposition du coffre-fort

Le plugin initialise un coffre-fort comme ceci :

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Le contenu géré reste dans des blocs générés. Les blocs de notes humains sont préservés.

Les principaux groupes de pages sont :

- `sources/` pour les matériaux bruts importés et les pages adossées au mode pont
- `entities/` pour les choses durables, personnes, systèmes, projets et objets
- `concepts/` pour les idées, abstractions, motifs et politiques
- `syntheses/` pour les résumés compilés et les consolidations maintenues
- `reports/` pour les tableaux de bord générés

## Assertions structurées et preuves

Les pages peuvent porter des `claims` dans le frontmatter structuré, et pas seulement du texte libre.

Chaque assertion peut inclure :

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Les entrées de preuve peuvent inclure :

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

C’est ce qui fait que le wiki agit davantage comme une couche de croyances qu’un simple
dépôt passif de notes. Les assertions peuvent être suivies, pondérées, contestées et résolues à partir des sources.

## Pipeline de compilation

L’étape de compilation lit les pages du wiki, normalise les résumés et émet des
artefacts stables orientés machine sous :

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Ces digests existent pour que les agents et le code d’exécution n’aient pas à parser
les pages Markdown.

La sortie compilée alimente aussi :

- l’indexation wiki de premier passage pour les flux search/get
- la recherche d’ID d’assertion vers la page propriétaire
- des compléments d’invite compacts
- la génération de rapports/tableaux de bord

## Tableaux de bord et rapports de santé

Lorsque `render.createDashboards` est activé, la compilation maintient des tableaux de bord sous
`reports/`.

Les rapports intégrés incluent :

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Ces rapports suivent des éléments comme :

- clusters de notes contradictoires
- clusters d’assertions concurrentes
- assertions sans preuve structurée
- pages et assertions à faible confiance
- fraîcheur obsolète ou inconnue
- pages avec questions non résolues

## Recherche et récupération

`memory-wiki` prend en charge deux backends de recherche :

- `shared` : utiliser le flux partagé de recherche memory lorsqu’il est disponible
- `local` : rechercher localement dans le wiki

Il prend aussi en charge trois corpus :

- `wiki`
- `memory`
- `all`

Comportement important :

- `wiki_search` et `wiki_get` utilisent si possible les digests compilés comme premier passage
- les ID d’assertion peuvent se résoudre vers la page propriétaire
- les assertions contestées/obsolètes/fraîches influencent le classement
- les étiquettes de provenance peuvent survivre dans les résultats

Règle pratique :

- utilisez `memory_search corpus=all` pour un rappel large unique
- utilisez `wiki_search` + `wiki_get` lorsque vous vous souciez du classement spécifique au wiki,
  de la provenance ou de la structure de croyance au niveau de la page

## Outils d’agent

Le plugin enregistre ces outils :

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Ce qu’ils font :

- `wiki_status` : mode actuel du coffre-fort, santé, disponibilité de l’Obsidian CLI
- `wiki_search` : recherche dans les pages wiki et, lorsqu’il est configuré, dans les corpus memory partagés
- `wiki_get` : lit une page wiki par id/chemin ou revient au corpus memory partagé
- `wiki_apply` : mutations ciblées de synthèse/métadonnées sans chirurgie libre de page
- `wiki_lint` : contrôles structurels, lacunes de provenance, contradictions, questions ouvertes

Le plugin enregistre aussi un complément de corpus memory non exclusif, de sorte que
`memory_search` et `memory_get` partagés peuvent atteindre le wiki lorsque le plugin memory actif prend en charge la sélection de corpus.

## Comportement des invites et du contexte

Lorsque `context.includeCompiledDigestPrompt` est activé, les sections d’invite memory
ajoutent un snapshot compilé compact depuis `agent-digest.json`.

Ce snapshot est volontairement petit et à fort signal :

- pages principales uniquement
- assertions principales uniquement
- nombre de contradictions
- nombre de questions
- qualificateurs de confiance/fraîcheur

C’est une option d’activation explicite parce que cela change la forme de l’invite et n’est
surtout utile que pour les moteurs de contexte ou l’assemblage d’invite hérité qui consomment explicitement des compléments memory.

## Configuration

Placez la configuration sous `plugins.entries.memory-wiki.config` :

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Principales bascules :

- `vaultMode` : `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode` : `native` ou `obsidian`
- `bridge.readMemoryArtifacts` : importer les artefacts publics du plugin memory actif
- `bridge.followMemoryEvents` : inclure les journaux d’événements en mode pont
- `search.backend` : `shared` ou `local`
- `search.corpus` : `wiki`, `memory` ou `all`
- `context.includeCompiledDigestPrompt` : ajouter un snapshot de digest compact aux sections d’invite memory
- `render.createBacklinks` : générer des blocs liés déterministes
- `render.createDashboards` : générer des pages de tableau de bord

### Exemple : QMD + mode pont

Utilisez cela lorsque vous voulez QMD pour le rappel et `memory-wiki` pour une couche
de connaissance maintenue :

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Cela permet de garder :

- QMD en charge du rappel memory actif
- `memory-wiki` concentré sur les pages compilées et les tableaux de bord
- la forme de l’invite inchangée jusqu’à ce que vous activiez volontairement les invites de digest compilé

## CLI

`memory-wiki` expose aussi une surface CLI de niveau supérieur :

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Voir [CLI : wiki](/fr/cli/wiki) pour la référence complète des commandes.

## Prise en charge d’Obsidian

Lorsque `vault.renderMode` vaut `obsidian`, le plugin écrit un
Markdown compatible Obsidian et peut éventuellement utiliser la CLI officielle `obsidian`.

Les workflows pris en charge incluent :

- sondage d’état
- recherche dans le coffre-fort
- ouverture d’une page
- invocation d’une commande Obsidian
- saut vers la note quotidienne

C’est facultatif. Le wiki fonctionne toujours en mode natif sans Obsidian.

## Workflow recommandé

1. Gardez votre plugin memory actif pour le rappel/la promotion/Dreaming.
2. Activez `memory-wiki`.
3. Commencez par le mode `isolated` sauf si vous voulez explicitement le mode pont.
4. Utilisez `wiki_search` / `wiki_get` lorsque la provenance compte.
5. Utilisez `wiki_apply` pour des synthèses ciblées ou des mises à jour de métadonnées.
6. Exécutez `wiki_lint` après des changements significatifs.
7. Activez les tableaux de bord si vous voulez de la visibilité sur l’obsolescence/les contradictions.

## Documentation associée

- [Vue d’ensemble de memory](/fr/concepts/memory)
- [CLI : memory](/fr/cli/memory)
- [CLI : wiki](/fr/cli/wiki)
- [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview)
