---
read_when:
    - Vous souhaitez indexer ou rechercher la mémoire sémantique
    - Vous déboguez la disponibilité ou l’indexation de la mémoire
    - Vous souhaitez promouvoir la mémoire à court terme rappelée vers `MEMORY.md`
summary: Référence CLI pour `openclaw memory` (`status`/`index`/`search`/`promote`/`promote-explain`/`rem-harness`)
title: Memory
x-i18n:
    generated_at: "2026-04-24T07:04:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gérer l’indexation et la recherche de la mémoire sémantique.
Fourni par le plugin Active Memory actif (par défaut : `memory-core` ; définissez `plugins.slots.memory = "none"` pour le désactiver).

Articles connexes :

- Concept de mémoire : [Memory](/fr/concepts/memory)
- Wiki de la mémoire : [Memory Wiki](/fr/plugins/memory-wiki)
- CLI wiki : [wiki](/fr/cli/wiki)
- Plugins : [Plugins](/fr/tools/plugin)

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
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Options

`memory status` et `memory index` :

- `--agent <id>` : limiter à un seul agent. Sans cette option, ces commandes s’exécutent pour chaque agent configuré ; si aucune liste d’agents n’est configurée, elles se replient sur l’agent par défaut.
- `--verbose` : afficher des journaux détaillés pendant les sondes et l’indexation.

`memory status` :

- `--deep` : sonder la disponibilité des vecteurs et des embeddings.
- `--index` : exécuter une réindexation si le magasin est marqué comme modifié (implique `--deep`).
- `--fix` : réparer les verrous de rappel obsolètes et normaliser les métadonnées de promotion.
- `--json` : afficher une sortie JSON.

Si `memory status` affiche `Dreaming status: blocked`, le Cron Dreaming géré est activé mais le Heartbeat qui le pilote ne se déclenche pas pour l’agent par défaut. Voir [Dreaming never runs](/fr/concepts/dreaming#dreaming-never-runs-status-shows-blocked) pour les deux causes courantes.

`memory index` :

- `--force` : forcer une réindexation complète.

`memory search` :

- Entrée de requête : passez soit `[query]` en positionnel, soit `--query <text>`.
- Si les deux sont fournis, `--query` l’emporte.
- Si aucun n’est fourni, la commande se termine avec une erreur.
- `--agent <id>` : limiter à un seul agent (par défaut : l’agent par défaut).
- `--max-results <n>` : limiter le nombre de résultats renvoyés.
- `--min-score <n>` : filtrer les correspondances avec un score faible.
- `--json` : afficher les résultats en JSON.

`memory promote` :

Prévisualiser et appliquer les promotions de mémoire à court terme.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- écrire les promotions dans `MEMORY.md` (par défaut : prévisualisation uniquement).
- `--limit <n>` -- limiter le nombre de candidats affichés.
- `--include-promoted` -- inclure les entrées déjà promues lors de cycles précédents.

Options complètes :

- Classe les candidats à court terme depuis `memory/YYYY-MM-DD.md` à l’aide de signaux de promotion pondérés (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Utilise des signaux à court terme provenant à la fois des rappels mémoire et des passes d’ingestion quotidiennes, ainsi que des signaux de renforcement des phases light/REM.
- Lorsque Dreaming est activé, `memory-core` gère automatiquement un job Cron qui exécute un balayage complet (`light -> REM -> deep`) en arrière-plan (aucun `openclaw cron add` manuel requis).
- `--agent <id>` : limiter à un seul agent (par défaut : l’agent par défaut).
- `--limit <n>` : nombre maximal de candidats à renvoyer/appliquer.
- `--min-score <n>` : score de promotion pondéré minimal.
- `--min-recall-count <n>` : nombre minimal de rappels requis pour un candidat.
- `--min-unique-queries <n>` : nombre minimal de requêtes distinctes requis pour un candidat.
- `--apply` : ajouter les candidats sélectionnés dans `MEMORY.md` et les marquer comme promus.
- `--include-promoted` : inclure les candidats déjà promus dans la sortie.
- `--json` : afficher une sortie JSON.

`memory promote-explain` :

Expliquer un candidat de promotion spécifique et le détail de son score.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>` : clé de candidat, fragment de chemin ou fragment d’extrait à rechercher.
- `--agent <id>` : limiter à un seul agent (par défaut : l’agent par défaut).
- `--include-promoted` : inclure les candidats déjà promus.
- `--json` : afficher une sortie JSON.

`memory rem-harness` :

Prévisualiser les réflexions REM, les vérités candidates et la sortie de promotion deep sans rien écrire.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>` : limiter à un seul agent (par défaut : l’agent par défaut).
- `--include-promoted` : inclure les candidats deep déjà promus.
- `--json` : afficher une sortie JSON.

## Dreaming

Dreaming est le système de consolidation de mémoire en arrière-plan avec trois phases coopératives : **light** (trier/préparer le matériel à court terme), **deep** (promouvoir les faits durables dans `MEMORY.md`) et **REM** (réfléchir et faire émerger les thèmes).

- Activez-le avec `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Activez/désactivez-le depuis le chat avec `/dreaming on|off` (ou inspectez avec `/dreaming status`).
- Dreaming s’exécute selon une planification de balayage gérée unique (`dreaming.frequency`) et exécute les phases dans l’ordre : light, REM, deep.
- Seule la phase deep écrit la mémoire durable dans `MEMORY.md`.
- La sortie des phases en texte lisible et les entrées de journal sont écrites dans `DREAMS.md` (ou dans `dreams.md` existant), avec des rapports facultatifs par phase dans `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Le classement utilise des signaux pondérés : fréquence de rappel, pertinence de récupération, diversité des requêtes, récence temporelle, consolidation interjournalière et richesse conceptuelle dérivée.
- La promotion relit la note quotidienne active avant d’écrire dans `MEMORY.md`, de sorte que les extraits à court terme modifiés ou supprimés ne soient pas promus depuis des instantanés obsolètes du magasin de rappels.
- Les exécutions planifiées et manuelles de `memory promote` partagent les mêmes paramètres par défaut de la phase deep, sauf si vous passez des surcharges de seuil via la CLI.
- Les exécutions automatiques se répartissent entre les espaces de travail mémoire configurés.

Planification par défaut :

- **Cadence de balayage** : `dreaming.frequency = 0 3 * * *`
- **Seuils deep** : `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Exemple :

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Remarques :

- `memory index --verbose` affiche les détails par phase (fournisseur, modèle, sources, activité des lots).
- `memory status` inclut tous les chemins supplémentaires configurés via `memorySearch.extraPaths`.
- Si les champs de clé API distante de Active Memory effectivement actifs sont configurés comme SecretRefs, la commande résout ces valeurs depuis l’instantané actif du Gateway. Si le Gateway n’est pas disponible, la commande échoue immédiatement.
- Remarque sur le décalage de version du Gateway : ce chemin de commande nécessite un Gateway prenant en charge `secrets.resolve` ; les anciens Gateways renvoient une erreur de méthode inconnue.
- Ajustez la cadence de balayage planifiée avec `dreaming.frequency`. La politique de promotion deep est sinon interne ; utilisez les drapeaux CLI sur `memory promote` lorsque vous avez besoin de surcharges manuelles ponctuelles.
- `memory rem-harness --path <file-or-dir> --grounded` prévisualise `What Happened`, `Reflections` et `Possible Lasting Updates` ancrés à partir de notes quotidiennes historiques sans rien écrire.
- `memory rem-backfill --path <file-or-dir>` écrit des entrées de journal ancrées réversibles dans `DREAMS.md` pour examen dans l’interface.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` injecte également des candidats durables ancrés dans le magasin actif de promotion à court terme afin que la phase deep normale puisse les classer.
- `memory rem-backfill --rollback` supprime les entrées de journal ancrées précédemment écrites, et `memory rem-backfill --rollback-short-term` supprime les candidats ancrés à court terme précédemment préparés.
- Voir [Dreaming](/fr/concepts/dreaming) pour la description complète des phases et la référence de configuration.

## Articles connexes

- [Référence CLI](/fr/cli)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
