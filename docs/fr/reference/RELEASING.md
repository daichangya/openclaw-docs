---
read_when:
    - Recherche des définitions des canaux de release publics
    - Recherche de la convention de nommage des versions et de la cadence
summary: Canaux de release publics, convention de nommage des versions et cadence
title: Politique de release
x-i18n:
    generated_at: "2026-04-21T07:05:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# Politique de publication

OpenClaw a trois canaux de publication publics :

- stable : publications taguées qui publient vers npm `beta` par défaut, ou vers npm `latest` lorsque cela est explicitement demandé
- beta : tags de prépublication qui publient vers npm `beta`
- dev : la tête mobile de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de publication corrective stable : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de prépublication beta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne pas ajouter de zéros initiaux au mois ou au jour
- `latest` signifie la publication npm stable promue actuelle
- `beta` signifie la cible d’installation beta actuelle
- Les publications stables et les publications correctives stables publient vers npm `beta` par défaut ; les opérateurs de publication peuvent cibler `latest` explicitement, ou promouvoir plus tard une build beta validée
- Chaque publication stable d’OpenClaw livre le package npm et l’app macOS ensemble ;
  les publications beta valident et publient normalement d’abord le chemin npm/package, la build/signature/notarisation de l’app mac étant réservée à stable sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par beta
- Stable ne suit qu’après validation de la dernière beta
- Les mainteneurs créent normalement les publications depuis une branche `release/YYYY.M.D` créée
  à partir de `main` actuel, afin que la validation de publication et les correctifs ne bloquent pas les nouveaux
  développements sur `main`
- Si un tag beta a été poussé ou publié et nécessite un correctif, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag beta
- La procédure détaillée de publication, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Vérifications préalables de publication

- Exécuter `pnpm check:test-types` avant les vérifications préalables de publication afin que le TypeScript de test reste
  couvert en dehors du contrôle local plus rapide `pnpm check`
- Exécuter `pnpm check:architecture` avant les vérifications préalables de publication afin que les contrôles plus larges
  de cycles d’import et de limites d’architecture soient au vert en dehors du contrôle local plus rapide
- Exécuter `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication attendus
  `dist/*` et le bundle de l’interface Control UI existent pour l’étape de
  validation du pack
- Exécuter `pnpm release:check` avant chaque publication taguée
- Les vérifications de publication s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- La validation d’exécution d’installation et de mise à niveau inter-OS est déclenchée depuis le
  workflow appelant privé
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  qui invoque le workflow public réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : elle maintient le vrai chemin de publication npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre canal afin de ne pas ralentir ou bloquer la publication
- Les vérifications de publication doivent être déclenchées depuis la référence de workflow `main` ou depuis une
  référence de workflow `release/YYYY.M.D` afin que la logique du workflow et les secrets restent
  contrôlés
- Ce workflow accepte soit un tag de publication existant, soit le SHA de commit complet de 40 caractères de la branche de workflow actuelle
- En mode SHA de commit, il n’accepte que le HEAD actuel de la branche de workflow ; utiliser un
  tag de publication pour les anciens commits de publication
- La vérification préalable validation-only de `OpenClaw NPM Release` accepte également le SHA de commit complet de 40 caractères
  de la branche de workflow actuelle sans exiger de tag poussé
- Ce chemin SHA est uniquement destiné à la validation et ne peut pas être promu en véritable publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées
  du package ; la vraie publication exige toujours un vrai tag de publication
- Les deux workflows conservent le vrai chemin de publication et de promotion sur des runners hébergés par GitHub, tandis que le chemin de validation non mutatif peut utiliser les plus grands
  runners Linux Blacksmith
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant à la fois les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La vérification préalable de publication npm n’attend plus le canal séparé de vérifications de publication
- Exécuter `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag beta/correctif correspondant) avant approbation
- Après la publication npm, exécuter
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version beta/corrective correspondante) pour vérifier le chemin
  d’installation du registre publié dans un préfixe temporaire neuf
- L’automatisation de publication des mainteneurs utilise désormais preflight-then-promote :
  - la vraie publication npm doit réussir avec un `preflight_run_id` npm réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l’exécution de vérification préalable réussie
  - les publications npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler `latest` explicitement via une entrée de workflow
  - la mutation de dist-tag npm basée sur un jeton vit désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour des raisons de sécurité, parce que `npm dist-tag add` a toujours besoin de `NPM_TOKEN` tandis que le
    dépôt public conserve une publication OIDC-only
  - le `macOS Release` public est validation-only
  - la vraie publication mac privée doit réussir avec des exécutions privées mac
    `preflight_run_id` et `validate_run_id`
  - les vrais chemins de publication promeuvent des artefacts préparés au lieu de les reconstruire
    à nouveau
- Pour les publications correctives stables comme `YYYY.M.D-N`, le vérificateur post-publication
  vérifie également le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de publication ne puissent pas laisser silencieusement les anciennes installations globales sur la charge utile stable de base
- La vérification préalable de publication npm échoue en mode fermé sauf si le tarball inclut à la fois
  `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`
  afin d’éviter d’expédier à nouveau un tableau de bord navigateur vide
- `pnpm test:install:smoke` applique aussi le budget `unpackedSize` du pack npm sur le tarball candidat à la mise à jour, afin que l’e2e de l’installateur détecte un gonflement accidentel du pack
  avant le chemin de publication de release
- Si le travail de publication a touché la planification CI, les manifestes de timing des extensions, ou
  les matrices de test des extensions, régénérez et examinez les sorties de matrice du workflow
  `checks-node-extensions` détenues par le planificateur depuis `.github/workflows/ci.yml`
  avant approbation afin que les notes de publication ne décrivent pas une disposition CI obsolète
- L’état de préparation d’une publication stable macOS inclut aussi les surfaces de mise à jour :
  - la GitHub release doit finalement contenir les fichiers empaquetés `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app empaquetée doit conserver un bundle id non debug, une URL de flux Sparkle non vide,
    et un `CFBundleVersion` au moins égal au plancher canonique de build Sparkle
    pour cette version de publication

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de publication requis tel que `v2026.4.2`, `v2026.4.2-1`, ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, cela peut aussi être le SHA de commit complet de 40 caractères
  de la branche de workflow actuelle pour une vérification préalable validation-only
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise
  le tarball préparé depuis l’exécution de vérification préalable réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; `beta` par défaut

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : tag de publication existant ou SHA de commit complet de 40 caractères du `main` actuel
  à valider lorsqu’il est déclenché depuis `main` ; depuis une branche de publication, utiliser un
  tag de publication existant ou le SHA de commit complet de 40 caractères de la branche de publication actuelle

Règles :

- Les tags stables et correctifs peuvent publier vers `beta` ou `latest`
- Les tags de prépublication beta peuvent publier uniquement vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet est autorisée uniquement lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` est toujours validation-only et accepte aussi le SHA de commit de la branche de workflow actuelle
- Le mode SHA de commit des vérifications de publication exige aussi le HEAD actuel de la branche de workflow
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la vérification préalable ;
  le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de publication npm stable

Lors de la création d’une publication npm stable :

1. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag n’existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow actuelle
     pour un essai à blanc validation-only du workflow de vérification préalable
2. Choisir `npm_dist_tag=beta` pour le flux normal beta-first, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécuter `OpenClaw Release Checks` séparément avec le même tag ou le
   SHA complet actuel de la branche de workflow lorsque vous voulez une couverture live du prompt cache
   - Ceci est séparé volontairement afin que la couverture live reste disponible sans
     recoupler des vérifications longues ou instables au workflow de publication
4. Enregistrer le `preflight_run_id` réussi
5. Exécuter à nouveau `OpenClaw NPM Release` avec `preflight_only=false`, le même
   `tag`, le même `npm_dist_tag`, et le `preflight_run_id` enregistré
6. Si la publication a été effectuée sur `beta`, utiliser le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
7. Si la publication a été intentionnellement faite directement vers `latest` et que `beta`
   doit immédiatement suivre avec la même build stable, utiliser ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laisser sa synchronisation
   autoréparatrice planifiée déplacer `beta` plus tard

La mutation de dist-tag se trouve dans le dépôt privé pour des raisons de sécurité car elle
nécessite toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication OIDC-only.

Cela permet de garder à la fois le chemin de publication directe et le chemin de promotion beta-first
documentés et visibles pour l’opérateur.

## Références publiques

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Les mainteneurs utilisent la documentation privée de publication dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
comme véritable runbook.
