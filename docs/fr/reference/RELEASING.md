---
read_when:
    - Recherche des définitions publiques des canaux de publication
    - Recherche du nommage des versions et de la cadence
summary: Canaux publics de publication, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-04-05T12:53:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb52a13264c802395aa55404c6baeec5c7b2a6820562e7a684057e70cc85668f
    source_path: reference/RELEASING.md
    workflow: 15
---

# Politique de publication

OpenClaw a trois voies publiques de publication :

- stable : publications taguées qui publient vers npm `beta` par défaut, ou vers npm `latest` sur demande explicite
- beta : tags de prépublication qui publient vers npm `beta`
- dev : la tête mobile de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de publication corrective stable : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de prépublication beta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne remplissez pas le mois ou le jour avec des zéros
- `latest` signifie la version npm stable promue actuelle
- `beta` signifie la cible d’installation beta actuelle
- Les publications stables et correctives stables publient vers npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir plus tard une build beta validée
- Chaque publication OpenClaw livre ensemble le package npm et l’application macOS

## Cadence de publication

- Les publications passent d’abord par beta
- Stable ne suit qu’après validation de la dernière beta
- La procédure détaillée de publication, les approbations, les identifiants et les notes de récupération sont réservées aux mainteneurs

## Pré-vérification de publication

- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication attendus `dist/*` et le bundle Control UI existent pour l’étape de validation du pack
- Exécutez `pnpm release:check` avant chaque publication taguée
- La pré-vérification npm de la branche main exécute aussi
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  avant l’empaquetage du tarball, en utilisant les secrets de workflow
  `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag beta/correctif correspondant) avant approbation
- Après publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version beta/corrective correspondante) pour vérifier le chemin
  d’installation depuis le registre publié dans un préfixe temporaire frais
- L’automatisation de publication des mainteneurs utilise maintenant preflight-then-promote :
  - la vraie publication npm doit réussir avec un `preflight_run_id` npm réussi
  - les publications npm stables ciblent par défaut `beta`
  - une publication npm stable peut cibler explicitement `latest` via une entrée de workflow
  - la promotion npm stable de `beta` vers `latest` reste disponible comme mode manuel explicite sur le workflow de confiance `OpenClaw NPM Release`
  - ce mode de promotion nécessite toujours un `NPM_TOKEN` valide dans l’environnement `npm-release` car la gestion des `dist-tag` npm est séparée de la publication de confiance
  - la publication publique `macOS Release` est uniquement une validation
  - la vraie publication mac privée doit réussir avec un
    `preflight_run_id` et `validate_run_id` mac privés réussis
  - les vrais chemins de publication promeuvent des artefacts préparés au lieu de
    les reconstruire à nouveau
- Pour les publications correctives stables comme `YYYY.M.D-N`, le vérificateur post-publication
  vérifie aussi le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de publication ne puissent pas silencieusement laisser
  d’anciennes installations globales sur la charge utile stable de base
- La pré-vérification de publication npm échoue de manière fermée sauf si le tarball inclut à la fois
  `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`
  afin d’éviter d’expédier de nouveau un tableau de bord navigateur vide
- Si le travail de publication a touché la planification CI, les manifestes de timing d’extension, ou les matrices de test rapides, régénérez et examinez les sorties de matrice de workflow `checks-fast-extensions`
  détenues par le planificateur depuis `.github/workflows/ci.yml`
  avant approbation afin que les notes de publication ne décrivent pas une disposition CI obsolète
- L’état de préparation de la publication stable macOS inclut aussi les surfaces de mise à jour :
  - la publication GitHub doit finir avec le `.zip`, `.dmg`, et `.dSYM.zip` empaquetés
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’application empaquetée doit conserver un bundle id non debug, une URL de flux Sparkle non vide
    et un `CFBundleVersion` supérieur ou égal au plancher canonique de build Sparkle
    pour cette version de publication

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de publication requis comme `v2026.4.2`, `v2026.4.2-1`, ou
  `v2026.4.2-beta.1`
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise
  le tarball préparé à partir de l’exécution preflight réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; vaut par défaut `beta`
- `promote_beta_to_latest` : `true` pour ignorer la publication et déplacer une build stable `beta` déjà publiée vers `latest`

Règles :

- Les tags stables et correctifs peuvent publier vers `beta` ou `latest`
- Les tags de prépublication beta ne peuvent publier que vers `beta`
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la pré-vérification ;
  le workflow vérifie ces métadonnées avant de poursuivre la publication
- Le mode promotion doit utiliser un tag stable ou correctif, `preflight_only=false`,
  un `preflight_run_id` vide, et `npm_dist_tag=beta`
- Le mode promotion nécessite aussi un `NPM_TOKEN` valide dans l’environnement `npm-release`
  car `npm dist-tag add` nécessite toujours une authentification npm classique

## Séquence de publication npm stable

Lors de la découpe d’une publication npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
2. Choisissez `npm_dist_tag=beta` pour le flux normal beta-first, ou `latest` seulement
   lorsque vous voulez délibérément une publication stable directe
3. Enregistrez le `preflight_run_id` réussi
4. Exécutez de nouveau `OpenClaw NPM Release` avec `preflight_only=false`, le même
   `tag`, le même `npm_dist_tag`, et le `preflight_run_id` enregistré
5. Si la publication a atterri sur `beta`, exécutez plus tard `OpenClaw NPM Release` avec le
   même `tag` stable, `promote_beta_to_latest=true`, `preflight_only=false`,
   `preflight_run_id` vide, et `npm_dist_tag=beta` lorsque vous voulez déplacer cette
   build publiée vers `latest`

Le mode promotion nécessite toujours l’approbation de l’environnement `npm-release` et un
`NPM_TOKEN` valide dans cet environnement.

Cela garde documentés et visibles pour l’opérateur à la fois le chemin de publication directe et le chemin beta-first avec promotion.

## Références publiques

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Les mainteneurs utilisent la documentation privée de publication dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le véritable runbook.
