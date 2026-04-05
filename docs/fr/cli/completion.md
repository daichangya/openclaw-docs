---
read_when:
    - Vous voulez l’autocomplétion du shell pour zsh/bash/fish/PowerShell
    - Vous devez mettre en cache les scripts d’autocomplétion sous l’état OpenClaw
summary: Référence CLI pour `openclaw completion` (générer/installer des scripts d’autocomplétion du shell)
title: completion
x-i18n:
    generated_at: "2026-04-05T12:37:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Générez des scripts d’autocomplétion du shell et installez-les éventuellement dans votre profil de shell.

## Utilisation

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Options

- `-s, --shell <shell>` : cible du shell (`zsh`, `bash`, `powershell`, `fish` ; par défaut : `zsh`)
- `-i, --install` : installer l’autocomplétion en ajoutant une ligne `source` à votre profil de shell
- `--write-state` : écrire le ou les scripts d’autocomplétion dans `$OPENCLAW_STATE_DIR/completions` sans les afficher sur stdout
- `-y, --yes` : ignorer les invites de confirmation d’installation

## Remarques

- `--install` écrit un petit bloc « OpenClaw Completion » dans votre profil de shell et le fait pointer vers le script en cache.
- Sans `--install` ni `--write-state`, la commande affiche le script sur stdout.
- La génération de l’autocomplétion charge de manière anticipée les arbres de commandes afin que les sous-commandes imbriquées soient incluses.
