---
read_when:
    - Vous voulez effacer l’état local tout en gardant la CLI installée
    - Vous voulez une exécution à blanc de ce qui serait supprimé
summary: Référence CLI pour `openclaw reset` (réinitialiser l’état/la configuration locale)
title: reset
x-i18n:
    generated_at: "2026-04-05T12:38:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Réinitialise la configuration/l’état local (garde la CLI installée).

Options :

- `--scope <scope>` : `config`, `config+creds+sessions`, ou `full`
- `--yes` : ignorer les invites de confirmation
- `--non-interactive` : désactiver les invites ; nécessite `--scope` et `--yes`
- `--dry-run` : afficher les actions sans supprimer les fichiers

Exemples :

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Remarques :

- Exécutez d’abord `openclaw backup create` si vous voulez un instantané restaurable avant de supprimer l’état local.
- Si vous omettez `--scope`, `openclaw reset` utilise une invite interactive pour choisir ce qui doit être supprimé.
- `--non-interactive` n’est valide que lorsque `--scope` et `--yes` sont tous deux définis.
