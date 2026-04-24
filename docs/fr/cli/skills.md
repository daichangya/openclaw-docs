---
read_when:
    - Vous souhaitez voir quelles Skills sont disponibles et prêtes à être exécutées
    - Vous souhaitez rechercher, installer ou mettre à jour des Skills depuis ClawHub
    - Vous souhaitez déboguer des binaires/env/config manquants pour les Skills
summary: Référence CLI pour `openclaw skills` (`search`/`install`/`update`/`list`/`info`/`check`)
title: Skills
x-i18n:
    generated_at: "2026-04-24T07:05:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Inspecter les Skills locales et installer/mettre à jour des Skills depuis ClawHub.

Articles connexes :

- Système Skills : [Skills](/fr/tools/skills)
- Configuration des Skills : [Configuration des Skills](/fr/tools/skills-config)
- Installations ClawHub : [ClawHub](/fr/tools/clawhub)

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

`search`/`install`/`update` utilisent directement ClawHub et installent dans le répertoire `skills/` de l’espace de travail actif. `list`/`info`/`check` continuent d’inspecter les Skills locales visibles pour l’espace de travail et la configuration actuels.

Cette commande CLI `install` télécharge des dossiers de Skills depuis ClawHub. Les installations de dépendances de Skills déclenchées par le Gateway depuis l’onboarding ou les paramètres Skills utilisent à la place le chemin de requête séparé `skills.install`.

Remarques :

- `search [query...]` accepte une requête facultative ; omettez-la pour parcourir le flux de recherche ClawHub par défaut.
- `search --limit <n>` limite le nombre de résultats renvoyés.
- `install --force` écrase un dossier de Skill existant de l’espace de travail pour le même slug.
- `update --all` ne met à jour que les installations ClawHub suivies dans l’espace de travail actif.
- `list` est l’action par défaut lorsqu’aucune sous-commande n’est fournie.
- `list`, `info` et `check` écrivent leur sortie rendue sur stdout. Avec `--json`, cela signifie que la charge utile lisible par machine reste sur stdout pour les pipes et les scripts.

## Articles connexes

- [Référence CLI](/fr/cli)
- [Skills](/fr/tools/skills)
