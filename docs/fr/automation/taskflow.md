---
read_when:
    - Vous voulez comprendre comment Task Flow se rapporte aux tâches en arrière-plan
    - Vous rencontrez Task Flow ou openclaw tasks flow dans les notes de version ou la documentation
    - Vous voulez inspecter ou gérer l’état de flux persistant
summary: Couche d’orchestration de flux Task Flow au-dessus des tâches en arrière-plan
title: Task Flow
x-i18n:
    generated_at: "2026-04-05T12:34:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172871206b839845db807d9c627015890f7733b862e276853d5dbfbe29e03883
    source_path: automation/taskflow.md
    workflow: 15
---

# Task Flow

Task Flow est la couche d’orchestration de flux qui se situe au-dessus des [tâches en arrière-plan](/automation/tasks). Il gère des flux persistants à plusieurs étapes avec leur propre état, le suivi des révisions et des mécanismes de synchronisation, tandis que les tâches individuelles restent l’unité de travail détachée.

## Quand utiliser Task Flow

Utilisez Task Flow lorsque le travail s’étend sur plusieurs étapes séquentielles ou à embranchements et que vous avez besoin d’un suivi de progression persistant lors des redémarrages de la passerelle. Pour les opérations uniques en arrière-plan, une simple [tâche](/automation/tasks) suffit.

| Scenario                              | Utilisation           |
| ------------------------------------- | --------------------- |
| Travail en arrière-plan unique        | Tâche simple          |
| Pipeline en plusieurs étapes (A puis B puis C) | Task Flow (géré)      |
| Observer des tâches créées à l’extérieur      | Task Flow (mis en miroir) |
| Rappel ponctuel                       | Tâche cron            |

## Modes de synchronisation

### Mode géré

Task Flow gère le cycle de vie de bout en bout. Il crée des tâches comme étapes de flux, les mène jusqu’à leur achèvement et fait progresser automatiquement l’état du flux.

Exemple : un flux de rapport hebdomadaire qui (1) collecte des données, (2) génère le rapport et (3) le livre. Task Flow crée chaque étape comme une tâche en arrière-plan, attend qu’elle se termine, puis passe à l’étape suivante.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mode miroir

Task Flow observe les tâches créées en externe et maintient l’état du flux synchronisé sans prendre en charge la création des tâches. Cela est utile lorsque les tâches proviennent de tâches cron, de commandes CLI ou d’autres sources et que vous souhaitez une vue unifiée de leur progression en tant que flux.

Exemple : trois tâches cron indépendantes qui forment ensemble une routine « morning ops ». Un flux en miroir suit leur progression collective sans contrôler quand ni comment elles s’exécutent.

## État persistant et suivi des révisions

Chaque flux persiste son propre état et suit les révisions afin que la progression survive aux redémarrages de la passerelle. Le suivi des révisions permet la détection des conflits lorsque plusieurs sources tentent de faire progresser le même flux simultanément.

## Comportement de l’annulation

`openclaw tasks flow cancel` définit une intention d’annulation persistante sur le flux. Les tâches actives dans le flux sont annulées, et aucune nouvelle étape n’est lancée. L’intention d’annulation persiste après les redémarrages, de sorte qu’un flux annulé reste annulé même si la passerelle redémarre avant que toutes les tâches enfants ne soient terminées.

## Commandes CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Commande                         | Description                                       |
| -------------------------------- | ------------------------------------------------- |
| `openclaw tasks flow list`       | Affiche les flux suivis avec leur statut et leur mode de synchronisation |
| `openclaw tasks flow show <id>`  | Inspecte un flux par identifiant de flux ou clé de recherche |
| `openclaw tasks flow cancel <id>` | Annule un flux en cours d’exécution et ses tâches actives |

## Comment les flux se rapportent aux tâches

Les flux coordonnent les tâches, ils ne les remplacent pas. Un même flux peut piloter plusieurs tâches en arrière-plan au cours de son cycle de vie. Utilisez `openclaw tasks` pour inspecter les enregistrements de tâches individuelles et `openclaw tasks flow` pour inspecter le flux d’orchestration.

## Lié

- [Tâches en arrière-plan](/automation/tasks) — le registre de travail détaché que les flux coordonnent
- [CLI: tasks](/cli/index#tasks) — référence des commandes CLI pour `openclaw tasks flow`
- [Vue d’ensemble de l’automatisation](/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches cron](/automation/cron-jobs) — travaux planifiés qui peuvent alimenter les flux
