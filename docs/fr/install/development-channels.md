---
read_when:
    - Vous voulez basculer entre stable/bêta/dev
    - Vous voulez épingler une version, un tag ou un SHA spécifique
    - Vous étiquetez ou publiez des préversions
sidebarTitle: Release Channels
summary: 'canaux stable, bêta et dev : sémantique, changement, épinglage et étiquetage'
title: canaux de version
x-i18n:
    generated_at: "2026-04-24T07:16:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# Canaux de développement

OpenClaw propose trois canaux de mise à jour :

- **stable** : dist-tag npm `latest`. Recommandé pour la plupart des utilisateurs.
- **beta** : dist-tag npm `beta` lorsqu’il est à jour ; si beta est absent ou plus ancien que
  la dernière version stable, le flux de mise à jour revient à `latest`.
- **dev** : tête mobile de `main` (git). Dist-tag npm : `dev` (lorsqu’il est publié).
  La branche `main` sert à l’expérimentation et au développement actif. Elle peut contenir
  des fonctionnalités incomplètes ou des changements cassants. Ne l’utilisez pas pour des Gateways de production.

Nous livrons généralement les builds stables vers **beta** d’abord, nous les testons là, puis lançons une
étape de promotion explicite qui déplace le build validé vers `latest` sans
changer le numéro de version. Les mainteneurs peuvent aussi publier une version stable
directement vers `latest` si nécessaire. Les dist-tags sont la source de vérité pour les
installations npm.

## Basculer entre les canaux

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserve votre choix dans la configuration (`update.channel`) et aligne la
méthode d’installation :

- **`stable`** (installations package) : met à jour via le dist-tag npm `latest`.
- **`beta`** (installations package) : préfère le dist-tag npm `beta`, mais revient à
  `latest` lorsque `beta` est absent ou plus ancien que le tag stable courant.
- **`stable`** (installations git) : extrait le dernier tag git stable.
- **`beta`** (installations git) : préfère le dernier tag git bêta, mais revient au
  dernier tag git stable si beta est absent ou plus ancien.
- **`dev`** : garantit un checkout git (par défaut `~/openclaw`, redéfinition avec
  `OPENCLAW_GIT_DIR`), bascule sur `main`, rebase sur l’amont, construit et
  installe la CLI globale depuis ce checkout.

Conseil : si vous voulez stable + dev en parallèle, gardez deux clones et pointez votre
gateway vers celui en stable.

## Ciblage ponctuel d’une version ou d’un tag

Utilisez `--tag` pour cibler un dist-tag, une version ou une spécification de package spécifique pour une
mise à jour unique **sans** changer votre canal conservé :

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Remarques :

- `--tag` s’applique **uniquement aux installations package (npm)**. Les installations git l’ignorent.
- Le tag n’est pas conservé. Votre prochain `openclaw update` utilisera comme d’habitude votre
  canal configuré.
- Protection contre les rétrogradations : si la version cible est plus ancienne que votre version actuelle,
  OpenClaw demande confirmation (ignorez avec `--yes`).
- `--channel beta` est différent de `--tag beta` : le flux du canal peut revenir
  à stable/latest lorsque beta est absent ou plus ancien, tandis que `--tag beta` cible le
  dist-tag `beta` brut pour cette seule exécution.

## Exécution à blanc

Prévisualisez ce que `openclaw update` ferait sans effectuer de modifications :

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

L’exécution à blanc affiche le canal effectif, la version cible, les actions prévues et
si une confirmation de rétrogradation serait nécessaire.

## Plugins et canaux

Lorsque vous changez de canal avec `openclaw update`, OpenClaw synchronise aussi les
sources des plugins :

- `dev` préfère les plugins intégrés depuis le checkout git.
- `stable` et `beta` restaurent les packages de Plugin installés par npm.
- Les plugins installés par npm sont mis à jour après l’achèvement de la mise à jour du cœur.

## Vérifier l’état actuel

```bash
openclaw update status
```

Affiche le canal actif, le type d’installation (git ou package), la version actuelle et
la source (configuration, tag git, branche git ou valeur par défaut).

## Bonnes pratiques d’étiquetage

- Étiquetez les versions sur lesquelles vous voulez que les checkouts git atterrissent (`vYYYY.M.D` pour stable,
  `vYYYY.M.D-beta.N` pour bêta).
- `vYYYY.M.D.beta.N` est aussi reconnu pour compatibilité, mais préférez `-beta.N`.
- Les anciens tags `vYYYY.M.D-<patch>` sont toujours reconnus comme stables (non bêta).
- Gardez les tags immuables : ne déplacez ni ne réutilisez jamais un tag.
- Les dist-tags npm restent la source de vérité pour les installations npm :
  - `latest` -> stable
  - `beta` -> build candidate ou build stable livré d’abord en bêta
  - `dev` -> instantané de `main` (facultatif)

## Disponibilité de l’app macOS

Les builds bêta et dev peuvent **ne pas** inclure de version de l’app macOS. C’est acceptable :

- Le tag git et le dist-tag npm peuvent quand même être publiés.
- Indiquez « pas de build macOS pour cette bêta » dans les notes de version ou le changelog.

## Liens associés

- [Mise à jour](/fr/install/updating)
- [Internes de l’installeur](/fr/install/installer)
