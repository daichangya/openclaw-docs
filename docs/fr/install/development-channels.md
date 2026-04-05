---
read_when:
    - Vous souhaitez basculer entre stable/beta/dev
    - Vous souhaitez épingler une version, un tag ou un SHA spécifique
    - Vous balisez ou publiez des préversions
sidebarTitle: Release Channels
summary: 'Canaux stable, bêta et dev : sémantique, bascule, épinglage et balisage'
title: Canaux de publication
x-i18n:
    generated_at: "2026-04-05T12:45:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# Canaux de développement

OpenClaw propose trois canaux de mise à jour :

- **stable** : dist-tag npm `latest`. Recommandé pour la plupart des utilisateurs.
- **beta** : dist-tag npm `beta` lorsqu’il est à jour ; si beta est absent ou plus ancien que
  la dernière version stable, le flux de mise à jour retombe sur `latest`.
- **dev** : tête mobile de `main` (git). Dist-tag npm : `dev` (lorsqu’il est publié).
  La branche `main` est destinée à l’expérimentation et au développement actif. Elle peut contenir
  des fonctionnalités incomplètes ou des changements cassants. Ne l’utilisez pas pour des passerelles de production.

Nous publions généralement d’abord les builds stables sur **beta**, nous les y testons, puis nous exécutons une
étape explicite de promotion qui déplace le build validé vers `latest` sans
changer le numéro de version. Les mainteneurs peuvent également publier une version stable
directement sur `latest` si nécessaire. Les dist-tags sont la source de vérité pour les
installations npm.

## Bascule entre canaux

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` enregistre votre choix dans la configuration (`update.channel`) et aligne
la méthode d’installation :

- **`stable`** (installations package) : met à jour via le dist-tag npm `latest`.
- **`beta`** (installations package) : préfère le dist-tag npm `beta`, mais retombe sur
  `latest` lorsque `beta` est absent ou plus ancien que le tag stable actuel.
- **`stable`** (installations git) : extrait le dernier tag git stable.
- **`beta`** (installations git) : préfère le dernier tag git bêta, mais retombe sur
  le dernier tag git stable lorsque beta est absent ou plus ancien.
- **`dev`** : garantit une extraction git (par défaut `~/openclaw`, remplacement avec
  `OPENCLAW_GIT_DIR`), bascule sur `main`, rebase sur l’amont, construit, puis
  installe la CLI globale depuis cette extraction.

Astuce : si vous voulez stable + dev en parallèle, gardez deux clones et faites pointer votre
passerelle vers le clone stable.

## Ciblage ponctuel d’une version ou d’un tag

Utilisez `--tag` pour cibler un dist-tag, une version ou un package spec spécifique pour une seule
mise à jour **sans** modifier votre canal enregistré :

```bash
# Installer une version spécifique
openclaw update --tag 2026.4.1-beta.1

# Installer depuis le dist-tag beta (ponctuel, non enregistré)
openclaw update --tag beta

# Installer depuis la branche GitHub main (tarball npm)
openclaw update --tag main

# Installer depuis un package spec npm spécifique
openclaw update --tag openclaw@2026.4.1-beta.1
```

Remarques :

- `--tag` s’applique **uniquement aux installations package (npm)**. Les installations git l’ignorent.
- Le tag n’est pas enregistré. Votre prochain `openclaw update` utilisera comme d’habitude votre
  canal configuré.
- Protection contre le downgrade : si la version cible est plus ancienne que votre version actuelle,
  OpenClaw demande confirmation (ignorez avec `--yes`).
- `--channel beta` est différent de `--tag beta` : le flux de canal peut retomber
  sur stable/latest lorsque beta est absent ou plus ancien, tandis que `--tag beta` cible
  le dist-tag `beta` brut pour cette seule exécution.

## Exécution à blanc

Prévisualisez ce que `openclaw update` ferait sans apporter de modifications :

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

L’exécution à blanc affiche le canal effectif, la version cible, les actions prévues et
si une confirmation de downgrade serait requise.

## Plugins et canaux

Lorsque vous changez de canal avec `openclaw update`, OpenClaw synchronise également les
sources de plugins :

- `dev` préfère les plugins intégrés depuis l’extraction git.
- `stable` et `beta` restaurent les packages de plugins installés via npm.
- Les plugins installés via npm sont mis à jour une fois la mise à jour du cœur terminée.

## Vérifier l’état actuel

```bash
openclaw update status
```

Affiche le canal actif, le type d’installation (git ou package), la version actuelle et
la source (config, tag git, branche git ou valeur par défaut).

## Bonnes pratiques de balisage

- Balisez les versions sur lesquelles vous souhaitez faire atterrir les extractions git (`vYYYY.M.D` pour stable,
  `vYYYY.M.D-beta.N` pour beta).
- `vYYYY.M.D.beta.N` est également reconnu pour compatibilité, mais préférez `-beta.N`.
- Les anciens tags `vYYYY.M.D-<patch>` sont toujours reconnus comme stables (non bêta).
- Gardez les tags immuables : ne déplacez ni ne réutilisez jamais un tag.
- Les dist-tags npm restent la source de vérité pour les installations npm :
  - `latest` -> stable
  - `beta` -> build candidate ou build stable publié d’abord sur bêta
  - `dev` -> instantané de `main` (facultatif)

## Disponibilité de l’app macOS

Les builds bêta et dev peuvent **ne pas** inclure de version de l’app macOS. C’est acceptable :

- Le tag git et le dist-tag npm peuvent quand même être publiés.
- Indiquez « pas de build macOS pour cette bêta » dans les notes de version ou le changelog.
