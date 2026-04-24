---
read_when:
    - Vous gérez des Nodes associés (caméras, écran, canvas)
    - Vous devez approuver des demandes ou invoquer des commandes de Node
summary: Référence CLI pour `openclaw nodes` (statut, association, invocation, caméra/canvas/écran)
title: Nodes
x-i18n:
    generated_at: "2026-04-24T07:04:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gérez les Nodes associés (appareils) et invoquez les capacités des Nodes.

Lié :

- Vue d’ensemble des Nodes : [Nodes](/fr/nodes)
- Caméra : [Nodes caméra](/fr/nodes/camera)
- Images : [Nodes d’image](/fr/nodes/images)

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

`nodes list` affiche des tableaux des éléments en attente/associés. Les lignes associées incluent l’ancienneté de connexion la plus récente (Last Connect).
Utilisez `--connected` pour n’afficher que les Nodes actuellement connectés. Utilisez `--last-connected <duration>` pour
filtrer sur les Nodes qui se sont connectés dans une durée donnée (par ex. `24h`, `7d`).

Remarque sur l’approbation :

- `openclaw nodes pending` nécessite uniquement le scope d’association.
- `openclaw nodes approve <requestId>` hérite des exigences de scope supplémentaires de la
  demande en attente :
  - demande sans commande : association uniquement
  - commandes de Node non `exec` : association + écriture
  - `system.run` / `system.run.prepare` / `system.which` : association + admin

## Invocation

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Indicateurs d’invocation :

- `--params <json>` : chaîne d’objet JSON (par défaut `{}`).
- `--invoke-timeout <ms>` : délai d’attente d’invocation du Node (par défaut `15000`).
- `--idempotency-key <key>` : clé d’idempotence facultative.
- `system.run` et `system.run.prepare` sont bloqués ici ; utilisez l’outil `exec` avec `host=node` pour l’exécution shell.

Pour l’exécution shell sur un Node, utilisez l’outil `exec` avec `host=node` au lieu de `openclaw nodes run`.
Le CLI `nodes` est désormais centré sur les capacités : RPC direct via `nodes invoke`, plus l’association, la caméra,
l’écran, la localisation, le canvas et les notifications.

## Lié

- [Référence CLI](/fr/cli)
- [Nodes](/fr/nodes)
