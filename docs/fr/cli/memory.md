---
read_when:
    - Vous souhaitez indexer ou rechercher dans la mémoire sémantique
    - Vous déboguez la disponibilité ou l’indexation de la mémoire
    - Vous souhaitez promouvoir la mémoire à court terme rappelée dans `MEMORY.md`
summary: Référence CLI pour `openclaw memory` (statut/indexation/recherche/promotion)
title: memory
x-i18n:
    generated_at: "2026-04-05T12:38:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a89e3a819737bb63521128ae63d9e25b5cd9db35c3ea4606d087a8ad48b41eab
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gérez l’indexation et la recherche dans la mémoire sémantique.
Fourni par le plugin de mémoire actif (par défaut : `memory-core` ; définissez `plugins.slots.memory = "none"` pour le désactiver).

Lié :

- Concept de mémoire : [Memory](/concepts/memory)
- Plugins : [Plugins](/tools/plugin)

## Exemples

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Options

`memory status` et `memory index` :

- `--agent <id>` : limite à un seul agent. Sans cette option, ces commandes s’exécutent pour chaque agent configuré ; si aucune liste d’agents n’est configurée, elles reviennent à l’agent par défaut.
- `--verbose` : émettre des journaux détaillés pendant les sondes et l’indexation.

`memory status` :

- `--deep` : sonder la disponibilité des vecteurs et des embeddings.
- `--index` : exécuter une réindexation si le magasin est sale (implique `--deep`).
- `--fix` : réparer les verrous de rappel obsolètes et normaliser les métadonnées de promotion.
- `--json` : afficher la sortie JSON.

`memory index` :

- `--force` : forcer une réindexation complète.

`memory search` :

- Entrée de requête : passez soit `[query]` en positionnel, soit `--query <text>`.
- Si les deux sont fournis, `--query` est prioritaire.
- Si aucun n’est fourni, la commande quitte avec une erreur.
- `--agent <id>` : limite à un seul agent (par défaut : l’agent par défaut).
- `--max-results <n>` : limiter le nombre de résultats renvoyés.
- `--min-score <n>` : filtrer les correspondances à faible score.
- `--json` : afficher les résultats JSON.

`memory promote` :

Prévisualisez et appliquez les promotions de mémoire à court terme.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- écrire les promotions dans `MEMORY.md` (par défaut : prévisualisation uniquement).
- `--limit <n>` -- limiter le nombre de candidats affichés.
- `--include-promoted` -- inclure les entrées déjà promues lors de cycles précédents.

Options complètes :

- Classe les candidats à court terme depuis `memory/YYYY-MM-DD.md` à l’aide de signaux de rappel pondérés (`frequency`, `relevance`, `query diversity`, `recency`).
- Utilise les événements de rappel capturés lorsque `memory_search` renvoie des résultats de mémoire quotidienne.
- Mode dreaming automatique facultatif : lorsque `plugins.entries.memory-core.config.dreaming.mode` vaut `core`, `deep` ou `rem`, `memory-core` gère automatiquement une tâche cron qui déclenche la promotion en arrière-plan (aucun `openclaw cron add` manuel n’est nécessaire).
- `--agent <id>` : limite à un seul agent (par défaut : l’agent par défaut).
- `--limit <n>` : nombre maximal de candidats à renvoyer/appliquer.
- `--min-score <n>` : score pondéré minimal de promotion.
- `--min-recall-count <n>` : nombre minimal de rappels requis pour un candidat.
- `--min-unique-queries <n>` : nombre minimal de requêtes distinctes requis pour un candidat.
- `--apply` : ajouter les candidats sélectionnés dans `MEMORY.md` et les marquer comme promus.
- `--include-promoted` : inclure dans la sortie les candidats déjà promus.
- `--json` : afficher la sortie JSON.

## Dreaming (expérimental)

Dreaming est la passe de réflexion nocturne pour la mémoire. On parle de "dreaming" parce que le système revisite ce qui a été rappelé pendant la journée et décide ce qui mérite d’être conservé à long terme.

- C’est facultatif et désactivé par défaut.
- Activez-le avec `plugins.entries.memory-core.config.dreaming.mode`.
- Vous pouvez basculer entre les modes depuis le chat avec `/dreaming off|core|rem|deep`. Exécutez `/dreaming` (ou `/dreaming options`) pour voir ce que fait chaque mode.
- Lorsqu’il est activé, `memory-core` crée et maintient automatiquement une tâche cron gérée.
- Définissez `dreaming.limit` sur `0` si vous souhaitez que dreaming soit activé mais que la promotion automatique soit effectivement en pause.
- Le classement utilise des signaux pondérés : fréquence de rappel, pertinence de récupération, diversité des requêtes et récence temporelle (les rappels récents décroissent avec le temps).
- La promotion dans `MEMORY.md` n’a lieu que lorsque les seuils de qualité sont atteints, afin que la mémoire à long terme reste à fort signal au lieu d’accumuler des détails isolés.

Préréglages de mode par défaut :

- `core` : tous les jours à `0 3 * * *`, `minScore=0.75`, `minRecallCount=3`, `minUniqueQueries=2`
- `deep` : toutes les 12 heures (`0 */12 * * *`), `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`
- `rem` : toutes les 6 heures (`0 */6 * * *`), `minScore=0.85`, `minRecallCount=4`, `minUniqueQueries=3`

Exemple :

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

Remarques :

- `memory index --verbose` affiche des détails par phase (fournisseur, modèle, sources, activité par lot).
- `memory status` inclut tous les chemins supplémentaires configurés via `memorySearch.extraPaths`.
- Si les champs de clé API distante de mémoire effectivement actifs sont configurés comme SecretRef, la commande résout ces valeurs à partir de l’instantané actif de la passerelle. Si la passerelle n’est pas disponible, la commande échoue immédiatement.
- Remarque sur le décalage de version de la passerelle : ce chemin de commande nécessite une passerelle qui prend en charge `secrets.resolve` ; les passerelles plus anciennes renvoient une erreur de méthode inconnue.
- Par défaut, la cadence de dreaming suit la planification prédéfinie de chaque mode. Remplacez-la avec `plugins.entries.memory-core.config.dreaming.frequency` comme expression cron (par exemple `0 3 * * *`) et ajustez finement avec `timezone`, `limit`, `minScore`, `minRecallCount` et `minUniqueQueries`.
