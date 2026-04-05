---
read_when:
    - Vous voulez supprimer le service Gateway et/ou l’état local
    - Vous voulez d’abord une exécution à blanc
summary: Référence CLI pour `openclaw uninstall` (supprimer le service Gateway + les données locales)
title: uninstall
x-i18n:
    generated_at: "2026-04-05T12:39:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Désinstalle le service Gateway + les données locales (la CLI reste en place).

Options :

- `--service` : supprimer le service Gateway
- `--state` : supprimer l’état et la configuration
- `--workspace` : supprimer les répertoires d’espace de travail
- `--app` : supprimer l’application macOS
- `--all` : supprimer le service, l’état, l’espace de travail et l’application
- `--yes` : ignorer les invites de confirmation
- `--non-interactive` : désactiver les invites ; nécessite `--yes`
- `--dry-run` : afficher les actions sans supprimer les fichiers

Exemples :

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Remarques :

- Exécutez d’abord `openclaw backup create` si vous voulez un instantané restaurable avant de supprimer l’état ou les espaces de travail.
- `--all` est un raccourci pour supprimer ensemble le service, l’état, l’espace de travail et l’application.
- `--non-interactive` nécessite `--yes`.
