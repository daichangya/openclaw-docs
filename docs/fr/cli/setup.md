---
read_when:
    - Vous effectuez une configuration de première exécution sans onboarding CLI complet
    - Vous souhaitez définir le chemin d'espace de travail par défaut
summary: Référence CLI pour `openclaw setup` (initialiser la configuration + l'espace de travail)
title: setup
x-i18n:
    generated_at: "2026-04-05T12:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: f538aac341c749043ad959e35f2ed99c844ab8c3500ff59aa159d940bd301792
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Initialisez `~/.openclaw/openclaw.json` et l'espace de travail de l'agent.

Lié :

- Premiers pas : [Getting started](/fr/start/getting-started)
- Onboarding CLI : [Onboarding (CLI)](/fr/start/wizard)

## Exemples

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Options

- `--workspace <dir>`: répertoire d'espace de travail de l'agent (stocké comme `agents.defaults.workspace`)
- `--wizard`: exécuter l'onboarding
- `--non-interactive`: exécuter l'onboarding sans invites
- `--mode <local|remote>`: mode d'onboarding
- `--remote-url <url>`: URL WebSocket de la gateway distante
- `--remote-token <token>`: jeton de la gateway distante

Pour exécuter l'onboarding via setup :

```bash
openclaw setup --wizard
```

Remarques :

- `openclaw setup` simple initialise la configuration + l'espace de travail sans le flux d'onboarding complet.
- L'onboarding s'exécute automatiquement lorsqu'un drapeau d'onboarding est présent (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).
