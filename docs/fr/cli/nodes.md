---
read_when:
    - Vous gérez des nœuds appairés (caméras, écran, canvas)
    - Vous devez approuver des requêtes ou invoquer des commandes de nœud
summary: Référence CLI pour `openclaw nodes` (statut, pairage, invocation, caméra/canvas/écran)
title: nodes
x-i18n:
    generated_at: "2026-04-05T12:38:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gérez les nœuds appairés (appareils) et invoquez les capacités des nœuds.

Lié :

- Vue d’ensemble des nœuds : [Nodes](/nodes)
- Caméra : [Nœuds caméra](/nodes/camera)
- Images : [Nœuds d’image](/nodes/images)

Options courantes :

- `--url`, `--token`, `--timeout`, `--json`

## Commandes courantes

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` affiche les tableaux des nœuds en attente/appairés. Les lignes appairées incluent l’ancienneté de la connexion la plus récente (`Last Connect`).
Utilisez `--connected` pour n’afficher que les nœuds actuellement connectés. Utilisez `--last-connected <duration>` pour
filtrer les nœuds qui se sont connectés dans une durée donnée (par exemple `24h`, `7d`).

Remarque sur l’approbation :

- `openclaw nodes pending` ne nécessite que la portée de pairage.
- `openclaw nodes approve <requestId>` hérite des exigences de portée supplémentaires de la
  requête en attente :
  - requête sans commande : pairage uniquement
  - commandes de nœud sans `exec` : pairage + écriture
  - `system.run` / `system.run.prepare` / `system.which` : pairage + admin

## Invocation

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Options d’invocation :

- `--params <json>` : chaîne d’objet JSON (par défaut `{}`).
- `--invoke-timeout <ms>` : délai d’expiration d’invocation du nœud (par défaut `15000`).
- `--idempotency-key <key>` : clé d’idempotence facultative.
- `system.run` et `system.run.prepare` sont bloqués ici ; utilisez l’outil `exec` avec `host=node` pour l’exécution shell.

Pour exécuter des commandes shell sur un nœud, utilisez l’outil `exec` avec `host=node` au lieu de `openclaw nodes run`.
La CLI `nodes` est désormais centrée sur les capacités : RPC direct via `nodes invoke`, plus pairage, caméra,
écran, localisation, canvas et notifications.
