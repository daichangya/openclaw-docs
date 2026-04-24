---
read_when:
    - Vous souhaitez supprimer le service Gateway et/ou l’état local
    - Vous souhaitez d’abord un essai à blanc
summary: Référence CLI pour `openclaw uninstall` (supprimer le service Gateway et les données locales)
title: Désinstaller
x-i18n:
    generated_at: "2026-04-24T07:05:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Désinstaller le service Gateway + les données locales (la CLI reste).

Options :

- `--service` : supprimer le service Gateway
- `--state` : supprimer l’état et la configuration
- `--workspace` : supprimer les répertoires d’espace de travail
- `--app` : supprimer l’app macOS
- `--all` : supprimer le service, l’état, l’espace de travail et l’app
- `--yes` : ignorer les invites de confirmation
- `--non-interactive` : désactiver les invites ; nécessite `--yes`
- `--dry-run` : afficher les actions sans supprimer de fichiers

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

- Exécutez d’abord `openclaw backup create` si vous souhaitez un instantané restaurable avant de supprimer l’état ou les espaces de travail.
- `--all` est un raccourci pour supprimer ensemble le service, l’état, l’espace de travail et l’app.
- `--non-interactive` nécessite `--yes`.

## Articles connexes

- [Référence CLI](/fr/cli)
- [Désinstallation](/fr/install/uninstall)
