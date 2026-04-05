---
read_when:
    - Vous souhaitez mettre à jour une extraction source en toute sécurité
    - Vous devez comprendre le comportement abrégé de `--update`
summary: Référence CLI pour `openclaw update` (mise à jour relativement sûre du code source + redémarrage automatique de la gateway)
title: update
x-i18n:
    generated_at: "2026-04-05T12:39:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12c8098654b644c3666981d379f6c018e84fde56a5420f295d78052f9001bdad
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Mettez à jour OpenClaw en toute sécurité et passez entre les canaux stable/beta/dev.

Si vous avez installé via **npm/pnpm/bun** (installation globale, sans métadonnées git),
les mises à jour passent par le flux du gestionnaire de paquets dans [Updating](/install/updating).

## Utilisation

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Options

- `--no-restart`: ignorer le redémarrage du service gateway après une mise à jour réussie.
- `--channel <stable|beta|dev>`: définir le canal de mise à jour (git + npm ; persistant dans la configuration).
- `--tag <dist-tag|version|spec>`: remplacer la cible de package pour cette mise à jour uniquement. Pour les installations de package, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run`: prévisualiser les actions de mise à jour prévues (canal/tag/cible/flux de redémarrage) sans écrire la configuration, installer, synchroniser les plugins ni redémarrer.
- `--json`: afficher un JSON `UpdateRunResult` lisible par machine.
- `--timeout <seconds>`: délai par étape (1200 s par défaut).
- `--yes`: ignorer les invites de confirmation (par exemple la confirmation de rétrogradation)

Remarque : les rétrogradations nécessitent une confirmation, car les anciennes versions peuvent casser la configuration.

## `update status`

Afficher le canal de mise à jour actif + le tag/branche/SHA git (pour les extractions source), ainsi que la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json`: afficher un JSON d'état lisible par machine.
- `--timeout <seconds>`: délai pour les vérifications (3 s par défaut).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s'il faut redémarrer la gateway
après la mise à jour (le comportement par défaut est de redémarrer). Si vous sélectionnez `dev` sans extraction git, il
propose d'en créer une.

Options :

- `--timeout <seconds>`: délai pour chaque étape de mise à jour (par défaut `1200`)

## Ce que cela fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw garde aussi la
méthode d'installation alignée :

- `dev` → garantit une extraction git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  la met à jour, puis installe la CLI globale depuis cette extraction.
- `stable` → installe depuis npm en utilisant `latest`.
- `beta` → préfère le dist-tag npm `beta`, mais revient à `latest` lorsque beta est
  absent ou plus ancien que la version stable actuelle.

Le programme de mise à jour automatique du cœur de la gateway (lorsqu'il est activé via la configuration) réutilise ce même chemin de mise à jour.

## Flux d'extraction git

Canaux :

- `stable`: extraire le dernier tag non beta, puis exécuter build + doctor.
- `beta`: préférer le dernier tag `-beta`, mais revenir au dernier tag stable
  lorsque beta est absent ou plus ancien.
- `dev`: extraire `main`, puis fetch + rebase.

Vue d'ensemble :

1. Nécessite un worktree propre (aucune modification non commitée).
2. Passe au canal sélectionné (tag ou branche).
3. Récupère l'amont (dev uniquement).
4. Dev uniquement : exécute un lint de précontrôle + une build TypeScript dans un worktree temporaire ; si le tip échoue, remonte jusqu'à 10 commits pour trouver la build propre la plus récente.
5. Rebase sur le commit sélectionné (dev uniquement).
6. Installe les dépendances (pnpm préféré ; repli sur npm ; bun reste disponible comme repli de compatibilité secondaire).
7. Exécute la build + la build de l'interface utilisateur de contrôle.
8. Exécute `openclaw doctor` comme vérification finale de « mise à jour sûre ».
9. Synchronise les plugins avec le canal actif (dev utilise les extensions intégrées ; stable/beta utilise npm) et met à jour les plugins installés via npm.

## Abréviation `--update`

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Voir aussi

- `openclaw doctor` (propose d'exécuter d'abord update sur les extractions git)
- [Canaux de développement](/install/development-channels)
- [Updating](/install/updating)
- [Référence CLI](/cli)
