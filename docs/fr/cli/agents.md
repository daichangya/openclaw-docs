---
read_when:
    - Vous voulez plusieurs agents isolés (workspaces + routage + auth)
summary: Référence CLI pour `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agents
x-i18n:
    generated_at: "2026-04-05T12:37:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90b90c4915993bd8af322c0590d4cb59baabb8940598ce741315f8f95ef43179
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Gérez des agents isolés (workspaces + auth + routage).

Voir aussi :

- Routage multi-agent : [Multi-Agent Routing](/concepts/multi-agent)
- Workspace d’agent : [Agent workspace](/concepts/agent-workspace)
- Configuration de visibilité des Skills : [Skills config](/tools/skills-config)

## Exemples

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Liaisons de routage

Utilisez les liaisons de routage pour épingler le trafic entrant d’un canal à un agent spécifique.

Si vous voulez aussi des Skills visibles différents selon l’agent, configurez
`agents.defaults.skills` et `agents.list[].skills` dans `openclaw.json`. Voir
[Skills config](/tools/skills-config) et
[Configuration Reference](/gateway/configuration-reference#agentsdefaultsskills).

Lister les liaisons :

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Ajouter des liaisons :

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Si vous omettez `accountId` (`--bind <channel>`), OpenClaw le résout à partir des valeurs par défaut du canal et des hooks de configuration du plugin lorsqu’ils sont disponibles.

Si vous omettez `--agent` pour `bind` ou `unbind`, OpenClaw cible l’agent par défaut actuel.

### Comportement de portée des liaisons

- Une liaison sans `accountId` correspond uniquement au compte par défaut du canal.
- `accountId: "*"` est le repli à l’échelle du canal (tous les comptes) et est moins spécifique qu’une liaison de compte explicite.
- Si le même agent possède déjà une liaison de canal correspondante sans `accountId`, et que vous liez plus tard avec un `accountId` explicite ou résolu, OpenClaw met à niveau cette liaison existante sur place au lieu d’ajouter un doublon.

Exemple :

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Après la mise à niveau, le routage de cette liaison est limité à `telegram:ops`. Si vous voulez aussi le routage du compte par défaut, ajoutez-le explicitement (par exemple `--bind telegram:default`).

Supprimer des liaisons :

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` accepte soit `--all`, soit une ou plusieurs valeurs `--bind`, mais pas les deux.

## Surface de commande

### `agents`

Exécuter `openclaw agents` sans sous-commande équivaut à `openclaw agents list`.

### `agents list`

Options :

- `--json`
- `--bindings` : inclure les règles de routage complètes, pas seulement les comptes/résumés par agent

### `agents add [name]`

Options :

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (répétable)
- `--non-interactive`
- `--json`

Remarques :

- Le passage de n’importe quels indicateurs `add` explicites fait basculer la commande en mode non interactif.
- Le mode non interactif requiert à la fois un nom d’agent et `--workspace`.
- `main` est réservé et ne peut pas être utilisé comme nouvel identifiant d’agent.

### `agents bindings`

Options :

- `--agent <id>`
- `--json`

### `agents bind`

Options :

- `--agent <id>` (par défaut, l’agent par défaut actuel)
- `--bind <channel[:accountId]>` (répétable)
- `--json`

### `agents unbind`

Options :

- `--agent <id>` (par défaut, l’agent par défaut actuel)
- `--bind <channel[:accountId]>` (répétable)
- `--all`
- `--json`

### `agents delete <id>`

Options :

- `--force`
- `--json`

Remarques :

- `main` ne peut pas être supprimé.
- Sans `--force`, une confirmation interactive est requise.
- Les répertoires de workspace, d’état d’agent et de transcriptions de session sont déplacés vers la corbeille, pas supprimés définitivement.

## Fichiers d’identité

Chaque workspace d’agent peut inclure un `IDENTITY.md` à la racine du workspace :

- Exemple de chemin : `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lit depuis la racine du workspace (ou un `--identity-file` explicite)

Les chemins d’avatar sont résolus par rapport à la racine du workspace.

## Définir l’identité

`set-identity` écrit des champs dans `agents.list[].identity` :

- `name`
- `theme`
- `emoji`
- `avatar` (chemin relatif au workspace, URL http(s) ou URI de données)

Options :

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Remarques :

- `--agent` ou `--workspace` peuvent être utilisés pour sélectionner l’agent cible.
- Si vous utilisez `--workspace` et que plusieurs agents partagent ce workspace, la commande échoue et vous demande de fournir `--agent`.
- Lorsqu’aucun champ d’identité explicite n’est fourni, la commande lit les données d’identité depuis `IDENTITY.md`.

Charger depuis `IDENTITY.md` :

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Surcharger explicitement des champs :

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Exemple de configuration :

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
