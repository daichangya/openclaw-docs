---
read_when:
    - Vous souhaitez que la promotion de mémoire s’exécute automatiquement
    - Vous voulez comprendre les modes et seuils de dreaming
    - Vous voulez ajuster la consolidation sans polluer MEMORY.md
summary: Promotion en arrière-plan de la mémoire à court terme vers la mémoire à long terme
title: Dreaming (expérimental)
x-i18n:
    generated_at: "2026-04-05T12:39:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9dbb29e9b49e940128c4e08c3fd058bb6ebb0148ca214b78008e3d5763ef1ab
    source_path: concepts/memory-dreaming.md
    workflow: 15
---

# Dreaming (expérimental)

Dreaming est la passe de consolidation de mémoire en arrière-plan dans `memory-core`.

On l’appelle « dreaming » parce que le système revisite ce qui est apparu au cours de la journée
et décide ce qui mérite d’être conservé comme contexte durable.

Dreaming est **expérimental**, **sur opt-in**, et **désactivé par défaut**.

## Ce que fait dreaming

1. Suit les événements de rappel à court terme issus des résultats `memory_search` dans
   `memory/YYYY-MM-DD.md`.
2. Attribue un score à ces candidats au rappel avec des signaux pondérés.
3. Ne promeut dans `MEMORY.md` que les candidats qualifiés.

Cela permet à la mémoire à long terme de rester concentrée sur un contexte durable et répété, plutôt que sur
des détails ponctuels.

## Signaux de promotion

Dreaming combine quatre signaux :

- **Fréquence** : à quelle fréquence le même candidat a été rappelé.
- **Pertinence** : force des scores de rappel lors de sa récupération.
- **Diversité des requêtes** : combien d’intentions de requête distinctes l’ont fait remonter.
- **Récence** : pondération temporelle sur les rappels récents.

La promotion exige le passage de tous les seuils configurés, pas d’un seul signal.

### Pondération des signaux

| Signal    | Poids | Description                                      |
| --------- | ----- | ------------------------------------------------ |
| Fréquence | 0.35  | À quelle fréquence la même entrée a été rappelée |
| Pertinence | 0.35 | Scores moyens de rappel lors de la récupération  |
| Diversité | 0.15  | Nombre d’intentions de requête distinctes l’ayant fait remonter |
| Récence   | 0.15  | Décroissance temporelle (demi-vie de 14 jours)   |

## Fonctionnement

1. **Suivi du rappel** -- Chaque résultat `memory_search` est enregistré dans
   `memory/.dreams/short-term-recall.json` avec le nombre de rappels, les scores et le hash
   de la requête.
2. **Attribution planifiée des scores** -- Selon la cadence configurée, les candidats sont classés
   à l’aide de signaux pondérés. Tous les seuils doivent être satisfaits simultanément.
3. **Promotion** -- Les entrées admissibles sont ajoutées à `MEMORY.md` avec un
   horodatage de promotion.
4. **Nettoyage** -- Les entrées déjà promues sont exclues des cycles futurs. Un
   verrou de fichier empêche les exécutions concurrentes.

## Modes

`dreaming.mode` contrôle la cadence et les seuils par défaut :

| Mode   | Cadence        | minScore | minRecallCount | minUniqueQueries |
| ------ | -------------- | -------- | -------------- | ---------------- |
| `off`  | Désactivé      | --       | --             | --               |
| `core` | Tous les jours à 3 h | 0.75 | 3              | 2                |
| `rem`  | Toutes les 6 heures | 0.85 | 4              | 3                |
| `deep` | Toutes les 12 heures | 0.80 | 3              | 3                |

## Modèle de planification

Lorsque dreaming est activé, `memory-core` gère automatiquement la planification récurrente.
Vous n’avez pas besoin de créer manuellement une tâche cron pour cette fonctionnalité.

Vous pouvez toujours ajuster le comportement avec des remplacements explicites tels que :

- `dreaming.frequency` (expression cron)
- `dreaming.timezone`
- `dreaming.limit`
- `dreaming.minScore`
- `dreaming.minRecallCount`
- `dreaming.minUniqueQueries`

## Configuration

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

## Commandes de chat

Changer de mode et vérifier l’état depuis le chat :

```
/dreaming core          # Passer au mode core (nuit)
/dreaming rem           # Passer au mode rem (toutes les 6 h)
/dreaming deep          # Passer au mode deep (toutes les 12 h)
/dreaming off           # Désactiver dreaming
/dreaming status        # Afficher la configuration actuelle et la cadence
/dreaming help          # Afficher le guide des modes
```

## Commandes CLI

Prévisualiser et appliquer les promotions depuis la ligne de commande :

```bash
# Prévisualiser les candidats à la promotion
openclaw memory promote

# Appliquer les promotions à MEMORY.md
openclaw memory promote --apply

# Limiter le nombre d’éléments prévisualisés
openclaw memory promote --limit 5

# Inclure les entrées déjà promues
openclaw memory promote --include-promoted

# Vérifier l’état de dreaming
openclaw memory status --deep
```

Voir [CLI memory](/cli/memory) pour la référence complète des drapeaux.

## UI Dreams

Lorsque dreaming est activé, la barre latérale de Gateway affiche un onglet **Dreams** avec
les statistiques de mémoire (nombre à court terme, nombre à long terme, nombre promu) et l’heure
du prochain cycle planifié.

## Pour aller plus loin

- [Mémoire](/concepts/memory)
- [Recherche en mémoire](/concepts/memory-search)
- [CLI memory](/cli/memory)
- [Référence de configuration de la mémoire](/reference/memory-config)
