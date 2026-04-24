---
read_when:
    - Vous voulez inspecter, auditer ou annuler des enregistrements de tâches en arrière-plan
    - Vous documentez les commandes Task Flow sous `openclaw tasks flow`
summary: Référence CLI pour `openclaw tasks` (registre des tâches en arrière-plan et état de Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T07:05:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

Inspectez les tâches durables en arrière-plan et l’état de Task Flow. Sans sous-commande,
`openclaw tasks` équivaut à `openclaw tasks list`.

Voir [Tâches en arrière-plan](/fr/automation/tasks) pour le cycle de vie et le modèle de livraison.

## Utilisation

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Options racine

- `--json` : sortie JSON.
- `--runtime <name>` : filtrer par type : `subagent`, `acp`, `cron` ou `cli`.
- `--status <name>` : filtrer par statut : `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` ou `lost`.

## Sous-commandes

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Liste les tâches en arrière-plan suivies, de la plus récente à la plus ancienne.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Affiche une tâche par ID de tâche, ID d’exécution ou clé de session.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Modifie la politique de notification pour une tâche en cours d’exécution.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Annule une tâche en arrière-plan en cours d’exécution.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Fait remonter les enregistrements de tâches et de Task Flow obsolètes, perdus, en échec de livraison ou autrement incohérents.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Prévisualise ou applique la réconciliation des tâches et de Task Flow, le marquage de nettoyage et l’élagage.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecte ou annule l’état durable de Task Flow sous le registre des tâches.

## Lié

- [Référence CLI](/fr/cli)
- [Tâches en arrière-plan](/fr/automation/tasks)
