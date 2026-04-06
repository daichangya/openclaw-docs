---
read_when:
    - Vous voulez que la promotion de la mémoire s'exécute automatiquement
    - Vous voulez comprendre le rôle de chaque phase de dreaming
    - Vous voulez ajuster la consolidation sans polluer `MEMORY.md`
summary: Consolidation de la mémoire en arrière-plan avec des phases légères, profondes et REM, ainsi qu'un Dream Diary
title: Dreaming (expérimental)
x-i18n:
    generated_at: "2026-04-06T03:06:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f27da718176bebf59fe8a80fddd4fb5b6d814ac5647f6c1e8344bcfb328db9de
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (expérimental)

Dreaming est le système de consolidation de la mémoire en arrière-plan dans `memory-core`.
Il aide OpenClaw à déplacer des signaux forts de court terme vers une mémoire durable tout en
gardant le processus explicable et vérifiable.

Dreaming est **optionnel** et désactivé par défaut.

## Ce que dreaming écrit

Dreaming conserve deux types de sortie :

- **État machine** dans `memory/.dreams/` (magasin de rappel, signaux de phase, points de contrôle d'ingestion, verrous).
- **Sortie lisible par les humains** dans `DREAMS.md` (ou `dreams.md` existant) et fichiers de rapport de phase facultatifs sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme continue d'écrire uniquement dans `MEMORY.md`.

## Modèle de phase

Dreaming utilise trois phases coopératives :

| Phase | Objectif                                  | Écriture durable   |
| ----- | ----------------------------------------- | ------------------ |
| Light | Trier et préparer le matériel récent à court terme | Non                |
| Deep  | Évaluer et promouvoir les candidats durables      | Oui (`MEMORY.md`) |
| REM   | Réfléchir aux thèmes et aux idées récurrentes     | Non                |

Ces phases sont des détails d'implémentation internes, pas des « modes »
distincts configurés par l'utilisateur.

### Phase Light

La phase Light ingère les signaux de mémoire quotidienne récents et les traces de rappel, les déduplique
et prépare des lignes candidates.

- Lit l'état de rappel à court terme et les fichiers de mémoire quotidienne récents.
- Écrit un bloc `## Light Sleep` géré lorsque le stockage inclut une sortie intégrée.
- Enregistre des signaux de renforcement pour le classement Deep ultérieur.
- N'écrit jamais dans `MEMORY.md`.

### Phase Deep

La phase Deep décide de ce qui devient une mémoire à long terme.

- Classe les candidats à l'aide d'un score pondéré et de seuils de validation.
- Exige que `minScore`, `minRecallCount` et `minUniqueQueries` soient atteints.
- Réhydrate les extraits à partir des fichiers quotidiens en direct avant l'écriture, afin que les extraits obsolètes/supprimés soient ignorés.
- Ajoute les entrées promues à `MEMORY.md`.
- Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et écrit éventuellement `memory/dreaming/deep/YYYY-MM-DD.md`.

### Phase REM

La phase REM extrait des motifs et des signaux réflexifs.

- Génère des résumés de thèmes et de réflexion à partir des traces récentes à court terme.
- Écrit un bloc `## REM Sleep` géré lorsque le stockage inclut une sortie intégrée.
- Enregistre des signaux de renforcement REM utilisés par le classement Deep.
- N'écrit jamais dans `MEMORY.md`.

## Dream Diary

Dreaming conserve aussi un **Dream Diary** narratif dans `DREAMS.md`.
Après que chaque phase a accumulé assez de matière, `memory-core` exécute en arrière-plan, au mieux,
un tour de sous-agent (en utilisant le modèle d'exécution par défaut) et ajoute une courte entrée de journal.

Ce journal est destiné à la lecture humaine dans l'interface Dreams, pas à servir de source de promotion.

## Signaux de classement Deep

Le classement Deep utilise six signaux de base pondérés plus le renforcement des phases :

| Signal              | Poids | Description                                       |
| ------------------- | ----- | ------------------------------------------------- |
| Fréquence           | 0.24  | Nombre de signaux à court terme accumulés par l'entrée |
| Pertinence          | 0.30  | Qualité moyenne de récupération pour l'entrée     |
| Diversité des requêtes | 0.15  | Contextes distincts de requête/jour qui l'ont fait remonter |
| Récence             | 0.15  | Score de fraîcheur décroissant dans le temps      |
| Consolidation       | 0.10  | Force de récurrence sur plusieurs jours           |
| Richesse conceptuelle | 0.06  | Densité de balises conceptuelles de l'extrait/chemin |

Les occurrences dans les phases Light et REM ajoutent un petit bonus décroissant avec le temps à partir de
`memory/.dreams/phase-signals.json`.

## Planification

Lorsqu'il est activé, `memory-core` gère automatiquement une tâche cron pour un balayage complet
de dreaming. Chaque balayage exécute les phases dans l'ordre : light -> REM -> deep.

Comportement de cadence par défaut :

| Paramètre            | Par défaut |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Démarrage rapide

Activer dreaming :

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

Activer dreaming avec une cadence de balayage personnalisée :

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Commande slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Workflow CLI

Utilisez la promotion CLI pour prévisualiser ou appliquer manuellement :

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

La commande manuelle `memory promote` utilise par défaut les seuils de la phase Deep, sauf en cas de remplacement
par des drapeaux CLI.

## Valeurs par défaut clés

Tous les paramètres se trouvent sous `plugins.entries.memory-core.config.dreaming`.

| Clé         | Par défaut |
| ----------- | ---------- |
| `enabled`   | `false`    |
| `frequency` | `0 3 * * *` |

La politique des phases, les seuils et le comportement de stockage sont des détails
d'implémentation internes (pas une configuration destinée aux utilisateurs).

Voir [Référence de configuration de la mémoire](/fr/reference/memory-config#dreaming-experimental)
pour la liste complète des clés.

## Interface Dreams

Lorsqu'il est activé, l'onglet **Dreams** du Gateway affiche :

- l'état actuel d'activation de dreaming
- le statut au niveau des phases et la présence d'un balayage géré
- les nombres de mémoires à court terme, à long terme et promues aujourd'hui
- l'heure de la prochaine exécution planifiée
- un lecteur Dream Diary extensible basé sur `doctor.memory.dreamDiary`

## Lié

- [Memory](/fr/concepts/memory)
- [Memory Search](/fr/concepts/memory-search)
- [CLI memory](/cli/memory)
- [Référence de configuration de la mémoire](/fr/reference/memory-config)
