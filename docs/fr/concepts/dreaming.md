---
read_when:
    - Vous souhaitez que la promotion de la mémoire s’exécute automatiquement
    - Vous souhaitez comprendre ce que fait chaque phase de Dreaming
    - Vous souhaitez ajuster la consolidation sans polluer `MEMORY.md`
summary: Consolidation de la mémoire en arrière-plan avec des phases légères, profondes et REM, plus un journal des rêves
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T07:06:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming est le système de consolidation de la mémoire en arrière-plan dans `memory-core`.
Il aide OpenClaw à déplacer de forts signaux de court terme vers une mémoire durable tout en
gardant le processus explicable et vérifiable.

Dreaming est **opt-in** et désactivé par défaut.

## Ce que Dreaming écrit

Dreaming conserve deux types de sortie :

- **État machine** dans `memory/.dreams/` (magasin de rappel, signaux de phase, points de contrôle d’ingestion, verrous).
- **Sortie lisible par l’humain** dans `DREAMS.md` (ou le fichier existant `dreams.md`) et fichiers de rapport de phase facultatifs sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme continue d’écrire uniquement dans `MEMORY.md`.

## Modèle de phase

Dreaming utilise trois phases coopératives :

| Phase | Objectif                                   | Écriture durable  |
| ----- | ------------------------------------------ | ----------------- |
| Light | Trier et préparer le matériel récent à court terme | Non               |
| Deep  | Noter et promouvoir les candidats durables | Oui (`MEMORY.md`) |
| REM   | Réfléchir aux thèmes et idées récurrentes  | Non               |

Ces phases sont des détails d’implémentation internes, pas des « modes »
séparés configurés par l’utilisateur.

### Phase Light

La phase Light ingère les signaux de mémoire quotidienne récents et les traces de rappel, les déduplique,
et prépare les lignes candidates.

- Lit l’état de rappel à court terme, les fichiers de mémoire quotidienne récents et les transcriptions de session expurgées lorsqu’elles sont disponibles.
- Écrit un bloc géré `## Light Sleep` lorsque le stockage inclut une sortie inline.
- Enregistre des signaux de renforcement pour le classement Deep ultérieur.
- N’écrit jamais dans `MEMORY.md`.

### Phase Deep

La phase Deep décide de ce qui devient une mémoire à long terme.

- Classe les candidats à l’aide d’un score pondéré et de seuils de validation.
- Exige que `minScore`, `minRecallCount` et `minUniqueQueries` soient satisfaits.
- Réhydrate les extraits à partir des fichiers quotidiens actifs avant écriture, de sorte que les extraits obsolètes/supprimés sont ignorés.
- Ajoute les entrées promues à `MEMORY.md`.
- Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et écrit éventuellement `memory/dreaming/deep/YYYY-MM-DD.md`.

### Phase REM

La phase REM extrait les motifs et les signaux réflexifs.

- Construit des résumés de thèmes et de réflexions à partir des traces récentes à court terme.
- Écrit un bloc géré `## REM Sleep` lorsque le stockage inclut une sortie inline.
- Enregistre des signaux de renforcement REM utilisés par le classement Deep.
- N’écrit jamais dans `MEMORY.md`.

## Ingestion des transcriptions de session

Dreaming peut ingérer des transcriptions de session expurgées dans le corpus Dreaming. Lorsque
les transcriptions sont disponibles, elles sont injectées dans la phase Light en même temps que les
signaux de mémoire quotidienne et les traces de rappel. Le contenu personnel et sensible est expurgé
avant l’ingestion.

## Journal des rêves

Dreaming tient également un **journal des rêves** narratif dans `DREAMS.md`.
Après que chaque phase a accumulé suffisamment de matière, `memory-core` exécute un tour de
sous-agent en arrière-plan en mode best-effort (en utilisant le modèle d’exécution par défaut) et ajoute une courte entrée de journal.

Ce journal est destiné à la lecture humaine dans l’interface Dreams, pas à servir de source de promotion.
Les artefacts de journal/rapport générés par Dreaming sont exclus de la
promotion à court terme. Seuls les extraits mémoire ancrés peuvent être promus dans
`MEMORY.md`.

Il existe également une voie de remplissage historique ancrée pour les travaux de révision et de récupération :

- `memory rem-harness --path ... --grounded` prévisualise la sortie du journal ancré à partir de notes historiques `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` écrit des entrées de journal ancrées réversibles dans `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prépare des candidats durables ancrés dans le même magasin de preuves à court terme que celui déjà utilisé par la phase Deep normale.
- `memory rem-backfill --rollback` et `--rollback-short-term` suppriment ces artefacts de remplissage préparés sans toucher aux entrées ordinaires du journal ni au rappel actif à court terme.

L’interface Control expose le même flux de remplissage/réinitialisation du journal afin que vous puissiez inspecter
les résultats dans la scène Dreams avant de décider si les candidats ancrés
méritent une promotion. La scène affiche aussi une voie ancrée distincte afin que vous puissiez voir
quelles entrées préparées à court terme proviennent d’une relecture historique, quels éléments promus ont été guidés par l’ancrage, et effacer uniquement les entrées préparées ancrées sans
toucher à l’état ordinaire actif à court terme.

## Signaux de classement Deep

Le classement Deep utilise six signaux de base pondérés plus un renforcement par phase :

| Signal              | Poids  | Description                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Frequency           | 0.24   | Nombre de signaux à court terme accumulés par l’entrée |
| Relevance           | 0.30   | Qualité moyenne de récupération pour l’entrée     |
| Query diversity     | 0.15   | Contextes distincts de requête/jour qui l’ont fait émerger |
| Recency             | 0.15   | Score de fraîcheur à décroissance temporelle      |
| Consolidation       | 0.10   | Force de récurrence sur plusieurs jours           |
| Conceptual richness | 0.06   | Densité d’étiquettes de concepts issue de l’extrait/du chemin |

Les occurrences des phases Light et REM ajoutent un léger bonus à décroissance temporelle depuis
`memory/.dreams/phase-signals.json`.

## Planification

Lorsqu’il est activé, `memory-core` gère automatiquement une tâche cron pour un balayage
Dreaming complet. Chaque balayage exécute les phases dans l’ordre : Light -> REM -> Deep.

Comportement de cadence par défaut :

| Setting              | Default     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Démarrage rapide

Activer Dreaming :

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

Activer Dreaming avec une cadence de balayage personnalisée :

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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flux CLI

Utilisez la promotion CLI pour une prévisualisation ou une application manuelle :

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Le `memory promote` manuel utilise par défaut les seuils de la phase Deep sauf remplacement
par des options CLI.

Expliquer pourquoi un candidat donné serait ou ne serait pas promu :

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Prévisualiser les réflexions REM, les vérités candidates et la sortie de promotion Deep sans
rien écrire :

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valeurs par défaut clés

Tous les paramètres se trouvent sous `plugins.entries.memory-core.config.dreaming`.

| Key         | Default     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

La politique de phase, les seuils et le comportement de stockage sont des détails d’implémentation
internes (pas une configuration destinée à l’utilisateur).

Voir [Référence de configuration Memory](/fr/reference/memory-config#dreaming)
pour la liste complète des clés.

## Interface Dreams

Lorsqu’il est activé, l’onglet **Dreams** du Gateway affiche :

- l’état d’activation actuel de Dreaming
- l’état au niveau des phases et la présence d’un balayage géré
- les compteurs de court terme, ancrés, de signaux et promus aujourd’hui
- l’heure du prochain lancement planifié
- une voie Scene ancrée distincte pour les entrées préparées de relecture historique
- un lecteur extensible du journal des rêves alimenté par `doctor.memory.dreamDiary`

## Lié

- [Memory](/fr/concepts/memory)
- [Recherche Memory](/fr/concepts/memory-search)
- [CLI memory](/fr/cli/memory)
- [Référence de configuration Memory](/fr/reference/memory-config)
