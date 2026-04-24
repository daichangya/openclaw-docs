---
read_when:
    - Vous effectuez la configuration du premier lancement sans l’onboarding complet de la CLI
    - Vous souhaitez définir le chemin de l’espace de travail par défaut
summary: Référence CLI pour `openclaw setup` (initialiser la configuration et l’espace de travail)
title: Configuration initiale
x-i18n:
    generated_at: "2026-04-24T07:05:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Initialiser `~/.openclaw/openclaw.json` et l’espace de travail de l’agent.

Lié :

- Premiers pas : [Getting started](/fr/start/getting-started)
- Onboarding CLI : [Onboarding (CLI)](/fr/start/wizard)

## Exemples

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Options

- `--workspace <dir>` : répertoire de l’espace de travail de l’agent (stocké comme `agents.defaults.workspace`)
- `--wizard` : exécuter l’onboarding
- `--non-interactive` : exécuter l’onboarding sans invites
- `--mode <local|remote>` : mode d’onboarding
- `--remote-url <url>` : URL WebSocket du Gateway distant
- `--remote-token <token>` : jeton du Gateway distant

Pour exécuter l’onboarding via setup :

```bash
openclaw setup --wizard
```

Remarques :

- Un simple `openclaw setup` initialise la configuration et l’espace de travail sans le flux d’onboarding complet.
- L’onboarding s’exécute automatiquement dès qu’un indicateur d’onboarding est présent (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

## Lié

- [Référence CLI](/fr/cli)
- [Aperçu de l’installation](/fr/install)
