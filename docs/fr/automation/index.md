---
read_when:
    - Décider comment automatiser le travail avec OpenClaw
    - Choisir entre Heartbeat, Cron, hooks et ordres permanents
    - Trouver le bon point d’entrée d’automatisation
summary: 'Aperçu des mécanismes d’automatisation : tâches, Cron, hooks, ordres permanents et TaskFlow'
title: Automatisation et tâches
x-i18n:
    generated_at: "2026-04-24T06:59:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b4615cc05a6d0ef7c92f44072d11a2541bc5e17b7acb88dc27ddf0c36b2dcab
    source_path: automation/index.md
    workflow: 15
---

OpenClaw exécute du travail en arrière-plan via des tâches, des travaux planifiés, des hooks d’événements et des instructions permanentes. Cette page vous aide à choisir le bon mécanisme et à comprendre comment ils s’articulent.

## Guide de décision rapide

```mermaid
flowchart TD
    START([De quoi avez-vous besoin ?]) --> Q1{Planifier du travail ?}
    START --> Q2{Suivre du travail détaché ?}
    START --> Q3{Orchestrer des flux en plusieurs étapes ?}
    START --> Q4{Réagir à des événements du cycle de vie ?}
    START --> Q5{Donner à l’agent des instructions persistantes ?}

    Q1 -->|Oui| Q1a{Moment exact ou flexible ?}
    Q1a -->|Exact| CRON["Tâches planifiées (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Oui| TASKS[Tâches en arrière-plan]
    Q3 -->|Oui| FLOW[Task Flow]
    Q4 -->|Oui| HOOKS[Hooks]
    Q5 -->|Oui| SO[Ordres permanents]
```

| Cas d’usage                             | Recommandé             | Pourquoi                                        |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| Envoyer un rapport quotidien à 9 h pile | Tâches planifiées (Cron) | Horaire exact, exécution isolée                |
| Me rappeler dans 20 minutes             | Tâches planifiées (Cron) | Exécution unique avec horaire précis (`--at`)  |
| Exécuter une analyse approfondie hebdomadaire | Tâches planifiées (Cron) | Tâche autonome, peut utiliser un autre modèle |
| Vérifier la boîte de réception toutes les 30 min | Heartbeat              | Regroupe avec d’autres vérifications, sensible au contexte |
| Surveiller le calendrier pour les événements à venir | Heartbeat              | Adapté naturellement à une veille périodique   |
| Inspecter le statut d’un sous-agent ou d’une exécution ACP | Tâches en arrière-plan | Le registre des tâches suit tout le travail détaché |
| Auditer ce qui a été exécuté et quand   | Tâches en arrière-plan | `openclaw tasks list` et `openclaw tasks audit` |
| Recherche en plusieurs étapes puis synthèse | Task Flow              | Orchestration durable avec suivi des révisions |
| Exécuter un script lors de la réinitialisation de session | Hooks                  | Piloté par événements, se déclenche sur les événements du cycle de vie |
| Exécuter du code à chaque appel d’outil | Hooks                  | Les hooks peuvent filtrer par type d’événement |
| Toujours vérifier la conformité avant de répondre | Ordres permanents        | Injectés automatiquement dans chaque session   |

### Tâches planifiées (Cron) vs Heartbeat

| Dimension       | Tâches planifiées (Cron)            | Heartbeat                            |
| --------------- | ----------------------------------- | ------------------------------------- |
| Horodatage      | Exact (expressions cron, exécution unique) | Approximatif (toutes les 30 min par défaut) |
| Contexte de session | Nouveau (isolé) ou partagé      | Contexte complet de la session principale |
| Enregistrements de tâches | Toujours créés            | Jamais créés                          |
| Livraison       | Canal, Webhook ou silencieuse       | En ligne dans la session principale   |
| Idéal pour      | Rapports, rappels, travaux en arrière-plan | Vérifications de boîte de réception, calendrier, notifications |

Utilisez les tâches planifiées (Cron) lorsque vous avez besoin d’un horaire précis ou d’une exécution isolée. Utilisez Heartbeat lorsque le travail bénéficie du contexte complet de la session et qu’un horaire approximatif convient.

## Concepts de base

### Tâches planifiées (cron)

Cron est le planificateur intégré du Gateway pour un horodatage précis. Il persiste les travaux, réveille l’agent au bon moment et peut livrer la sortie vers un canal de chat ou un point de terminaison Webhook. Il prend en charge les rappels à exécution unique, les expressions récurrentes et les déclencheurs Webhook entrants.

Voir [Tâches planifiées](/fr/automation/cron-jobs).

### Tâches

Le registre des tâches en arrière-plan suit tout le travail détaché : exécutions ACP, lancements de sous-agents, exécutions cron isolées et opérations CLI. Les tâches sont des enregistrements, pas des planificateurs. Utilisez `openclaw tasks list` et `openclaw tasks audit` pour les inspecter.

Voir [Tâches en arrière-plan](/fr/automation/tasks).

### Task Flow

Task Flow est la couche d’orchestration de flux au-dessus des tâches en arrière-plan. Il gère des flux durables en plusieurs étapes avec des modes de synchronisation gérés et miroir, le suivi des révisions, et `openclaw tasks flow list|show|cancel` pour l’inspection.

Voir [Task Flow](/fr/automation/taskflow).

### Ordres permanents

Les ordres permanents accordent à l’agent une autorité opérationnelle permanente pour des programmes définis. Ils résident dans les fichiers de l’espace de travail (généralement `AGENTS.md`) et sont injectés dans chaque session. Combinez-les avec cron pour une application basée sur le temps.

Voir [Ordres permanents](/fr/automation/standing-orders).

### Hooks

Les hooks sont des scripts pilotés par événements déclenchés par des événements du cycle de vie de l’agent (`/new`, `/reset`, `/stop`), la Compaction de session, le démarrage du gateway, le flux de messages et les appels d’outils. Les hooks sont automatiquement découverts à partir des répertoires et peuvent être gérés avec `openclaw hooks`.

Voir [Hooks](/fr/automation/hooks).

### Heartbeat

Heartbeat est un tour périodique de la session principale (toutes les 30 minutes par défaut). Il regroupe plusieurs vérifications (boîte de réception, calendrier, notifications) en un seul tour d’agent avec le contexte complet de la session. Les tours Heartbeat ne créent pas d’enregistrements de tâches. Utilisez `HEARTBEAT.md` pour une petite checklist, ou un bloc `tasks:` lorsque vous souhaitez des vérifications périodiques seulement à échéance dans heartbeat lui-même. Les fichiers heartbeat vides sont ignorés avec `empty-heartbeat-file` ; le mode tâche seulement à échéance est ignoré avec `no-tasks-due`.

Voir [Heartbeat](/fr/gateway/heartbeat).

## Comment ils fonctionnent ensemble

- **Cron** gère les planifications précises (rapports quotidiens, revues hebdomadaires) et les rappels à exécution unique. Toutes les exécutions cron créent des enregistrements de tâches.
- **Heartbeat** gère la surveillance de routine (boîte de réception, calendrier, notifications) dans un tour regroupé toutes les 30 minutes.
- **Hooks** réagissent à des événements spécifiques (appels d’outils, réinitialisations de session, Compaction) avec des scripts personnalisés.
- **Ordres permanents** donnent à l’agent un contexte persistant et des limites d’autorité.
- **Task Flow** coordonne des flux en plusieurs étapes au-dessus des tâches individuelles.
- **Tâches** suivent automatiquement tout le travail détaché afin que vous puissiez l’inspecter et l’auditer.

## Lié

- [Tâches planifiées](/fr/automation/cron-jobs) — planification précise et rappels à exécution unique
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour tout le travail détaché
- [Task Flow](/fr/automation/taskflow) — orchestration durable de flux en plusieurs étapes
- [Hooks](/fr/automation/hooks) — scripts de cycle de vie pilotés par événements
- [Ordres permanents](/fr/automation/standing-orders) — instructions persistantes de l’agent
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de la session principale
- [Référence de configuration](/fr/gateway/configuration-reference) — toutes les clés de configuration
