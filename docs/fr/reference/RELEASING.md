---
read_when:
    - Vous recherchez les définitions des canaux de version publics
    - Vous recherchez le nommage et la cadence des versions
summary: canaux de version publics, nommage des versions et cadence
title: politique de version@endsection to=final code
x-i18n:
    generated_at: "2026-04-24T07:30:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw a trois voies de version publiques :

- stable : versions étiquetées qui publient sur npm `beta` par défaut, ou sur npm `latest` lorsque cela est explicitement demandé
- beta : tags de préversion qui publient sur npm `beta`
- dev : tête mobile de `main`

## Nommage des versions

- Version de version stable : `YYYY.M.D`
  - Tag git : `vYYYY.M.D`
- Version de correctif stable : `YYYY.M.D-N`
  - Tag git : `vYYYY.M.D-N`
- Version de préversion bêta : `YYYY.M.D-beta.N`
  - Tag git : `vYYYY.M.D-beta.N`
- Ne pas compléter le mois ou le jour avec des zéros
- `latest` signifie la version npm stable promue actuelle
- `beta` signifie la cible d’installation bêta actuelle
- Les versions stables et les correctifs stables publient sur npm `beta` par défaut ; les opérateurs de version peuvent cibler explicitement `latest`, ou promouvoir plus tard un build bêta validé
- Chaque version stable d’OpenClaw livre ensemble le package npm et l’app macOS ;
  les versions bêta valident et publient normalement d’abord le chemin npm/package, avec
  le build/la signature/la notarisation de l’app mac réservés au stable sauf demande explicite

## Cadence de version

- Les versions avancent d’abord par beta
- Le stable ne suit qu’après validation de la dernière bêta
- Les mainteneurs créent normalement les versions depuis une branche `release/YYYY.M.D` créée
  à partir de `main` courant, afin que la validation de version et les correctifs ne bloquent pas le nouveau
  développement sur `main`
- Si un tag bêta a été poussé ou publié et nécessite un correctif, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag bêta
- La procédure détaillée de version, les approbations, les identifiants et les notes
  de récupération sont réservées aux mainteneurs

## Prévalidation de version

- Exécutez `pnpm check:test-types` avant la prévalidation de version afin que le TypeScript de test reste
  couvert en dehors de la barrière locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la prévalidation de version afin que les vérifications plus larges
  des cycles d’importation et des frontières d’architecture soient au vert en dehors de la barrière locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de version attendus
  `dist/*` et le bundle de Control UI existent pour l’étape de
  validation du pack
- Exécutez `pnpm release:check` avant chaque version étiquetée
- Les vérifications de version s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute également la barrière de parité simulée QA Lab ainsi que les voies QA live
  Matrix et Telegram avant l’approbation de version. Les voies live utilisent l’
  environnement `qa-live-shared` ; Telegram utilise aussi des baux d’identifiants CI Convex.
- La validation d’exécution cross-OS d’installation et de mise à niveau est déclenchée depuis le
  workflow appelant privé
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  qui invoque le workflow public réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le chemin réel de version npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre voie afin de ne pas retarder ni bloquer la publication
- Les vérifications de version doivent être déclenchées depuis la référence de workflow `main` ou depuis une
  référence de workflow `release/YYYY.M.D` afin que la logique du workflow et les secrets restent
  contrôlés
- Ce workflow accepte soit un tag de version existant, soit le SHA de commit complet
  à 40 caractères de la branche de workflow actuelle
- En mode SHA de commit, il n’accepte que la tête actuelle de la branche de workflow ; utilisez un
  tag de version pour les anciens commits de version
- La prévalidation de `OpenClaw NPM Release`, en mode validation uniquement, accepte aussi le SHA de commit complet
  à 40 caractères de la branche de workflow actuelle sans exiger de tag poussé
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en véritable publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées
  du package ; la vraie publication exige toujours un vrai tag de version
- Les deux workflows gardent le vrai chemin de publication et de promotion sur des runners hébergés par GitHub, tandis que le chemin de validation non mutatif peut utiliser les plus gros
  runners Linux Blacksmith
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les deux secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La prévalidation de version npm n’attend plus la voie séparée de vérifications de version
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correctif correspondant) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/correctif correspondante) pour vérifier le chemin
  d’installation du registre publié dans un préfixe temporaire vierge
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’intégration du package installé, la configuration Telegram et un vrai E2E Telegram
  contre le package npm publié en utilisant le pool partagé d’identifiants Telegram loués.
  Les exécutions ponctuelles locales des mainteneurs peuvent omettre les variables Convex et passer directement les trois
  identifiants env `OPENCLAW_QA_TELEGRAM_*`.
- Les mainteneurs peuvent exécuter la même vérification post-publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est volontairement manuel uniquement et
  ne s’exécute pas sur chaque fusion.
- L’automatisation de version des mainteneurs utilise désormais prévalidation puis promotion :
  - la vraie publication npm doit réussir avec un `preflight_run_id` npm réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l’exécution de prévalidation réussie
  - les versions npm stables ciblent `beta` par défaut
  - une publication npm stable peut cibler explicitement `latest` via une entrée de workflow
  - la mutation de dist-tag npm basée sur jeton vit désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour des raisons de sécurité, car `npm dist-tag add` nécessite encore `NPM_TOKEN` alors que le
    dépôt public conserve une publication OIDC uniquement
  - le workflow public `macOS Release` est réservé à la validation
  - la vraie publication mac privée doit réussir avec des
    `preflight_run_id` et `validate_run_id` privés mac réussis
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire à nouveau
- Pour les correctifs stables comme `YYYY.M.D-N`, le vérificateur post-publication
  vérifie aussi le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les correctifs de version ne puissent pas laisser silencieusement les anciennes installations globales sur la charge utile stable de base
- La prévalidation de version npm échoue de manière stricte sauf si la tarball inclut à la fois
  `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`
  afin d’éviter de livrer à nouveau un tableau de bord navigateur vide
- La vérification post-publication vérifie aussi que l’installation du registre publié
  contient des dépendances runtime intégrées non vides de plugins sous la disposition racine `dist/*`.
  Une version qui est livrée avec des charges utiles de dépendances de plugin intégrées manquantes ou vides
  échoue au vérificateur postpublication et ne peut pas être promue
  vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget `unpackedSize` du pack npm sur
  la tarball candidate de mise à jour, afin que l’e2e d’installation détecte un gonflement accidentel du pack
  avant le chemin de publication de version
- Si le travail de version a touché la planification CI, les manifestes de timing d’extension ou
  les matrices de test d’extension, régénérez et examinez les sorties de matrice
  `checks-node-extensions` possédées par le planificateur depuis `.github/workflows/ci.yml`
  avant approbation afin que les notes de version ne décrivent pas une disposition CI obsolète
- La préparation d’une version stable macOS inclut aussi les surfaces de mise à jour :
  - la version GitHub doit contenir à la fin les fichiers empaquetés `.zip`, `.dmg`, et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app empaquetée doit conserver un identifiant de bundle non debug, une URL
    de flux Sparkle non vide et un `CFBundleVersion` au moins égal au plancher canonique de build Sparkle
    pour cette version

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de version requis tel que `v2026.4.2`, `v2026.4.2-1`, ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi être le SHA de commit complet
  à 40 caractères de la branche de workflow actuelle pour une prévalidation réservée à la validation
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise
  la tarball préparée de l’exécution de prévalidation réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; par défaut `beta`

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : tag de version existant ou SHA complet à 40 caractères du commit `main`
  actuel à valider lorsqu’il est déclenché depuis `main` ; depuis une branche de version, utilisez un
  tag de version existant ou le SHA complet à 40 caractères du commit actuel de la branche de version

Règles :

- Les tags stables et de correction peuvent publier soit vers `beta` soit vers `latest`
- Les tags de préversion bêta ne peuvent publier que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` est toujours réservé à la validation et accepte aussi le
  SHA de commit de la branche de workflow actuelle
- Le mode SHA de commit des vérifications de version exige aussi la tête actuelle de la branche de workflow
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la prévalidation ;
  le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de version npm stable

Lorsqu’une version npm stable est créée :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag n’existe, vous pouvez utiliser le SHA de commit complet actuel de la branche de workflow
     pour une simulation de validation uniquement du workflow de prévalidation
2. Choisissez `npm_dist_tag=beta` pour le flux normal beta-first, ou `latest` seulement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `OpenClaw Release Checks` séparément avec le même tag ou le
   SHA complet actuel de la branche de workflow lorsque vous voulez une couverture live du cache de prompt,
   de la parité QA Lab, de Matrix et de Telegram
   - Ceci est séparé volontairement afin que la couverture live reste disponible sans
     recoupler des vérifications longues ou instables au workflow de publication
4. Conservez le `preflight_run_id` réussi
5. Exécutez à nouveau `OpenClaw NPM Release` avec `preflight_only=false`, le même
   `tag`, le même `npm_dist_tag`, et le `preflight_run_id` enregistré
6. Si la version a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
7. Si la version a été intentionnellement publiée directement sur `latest` et que `beta`
   doit immédiatement suivre le même build stable, utilisez ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa
   synchronisation auto-réparatrice planifiée déplacer `beta` plus tard

La mutation de dist-tag vit dans le dépôt privé pour des raisons de sécurité car elle
nécessite encore `NPM_TOKEN`, tandis que le dépôt public conserve une publication OIDC uniquement.

Cela permet de documenter et de rendre visibles pour les opérateurs à la fois le chemin de publication directe et le chemin de promotion beta-first.

## Références publiques

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Les mainteneurs utilisent la documentation privée de version dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
comme véritable guide opératoire.

## Liens associés

- [Canaux de version](/fr/install/development-channels)
