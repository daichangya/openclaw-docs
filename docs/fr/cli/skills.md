---
read_when:
    - Vous voulez voir quelles Skills sont disponibles et prêtes à être exécutées
    - Vous voulez rechercher, installer ou mettre à jour des Skills depuis ClawHub
    - Vous voulez déboguer les binaires/env/config manquants pour les Skills
summary: Référence CLI pour `openclaw skills` (search/install/update/list/info/check)
title: skills
x-i18n:
    generated_at: "2026-04-05T12:38:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Inspectez les Skills locales et installez/mettez à jour des Skills depuis ClawHub.

Voir aussi :

- Système de Skills : [Skills](/tools/skills)
- Configuration des Skills : [Configuration des Skills](/tools/skills-config)
- Installations ClawHub : [ClawHub](/tools/clawhub)

## Commandes

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` utilisent directement ClawHub et installent dans le
répertoire `skills/` de l’espace de travail actif. `list`/`info`/`check` inspectent toujours les
Skills locales visibles pour l’espace de travail et la configuration actuels.

Cette commande CLI `install` télécharge des dossiers de Skills depuis ClawHub. Les installations de dépendances de
Skills déclenchées par la gateway depuis l’onboarding ou les paramètres Skills utilisent à la place le
chemin de requête distinct `skills.install`.

Remarques :

- `search [query...]` accepte une requête facultative ; omettez-la pour parcourir le flux de recherche
  ClawHub par défaut.
- `search --limit <n>` limite le nombre de résultats renvoyés.
- `install --force` écrase un dossier de Skill d’espace de travail existant pour le même
  slug.
- `update --all` ne met à jour que les installations ClawHub suivies dans l’espace de travail actif.
- `list` est l’action par défaut lorsqu’aucune sous-commande n’est fournie.
- `list`, `info` et `check` écrivent leur sortie rendue sur stdout. Avec
  `--json`, cela signifie que la charge utile lisible par machine reste sur stdout pour les pipes
  et les scripts.
