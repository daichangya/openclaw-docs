---
read_when:
    - Vous devez comprendre pourquoi un job CI s’est exécuté ou non.
    - Vous déboguez des vérifications GitHub Actions en échec.
summary: Graphe des jobs CI, contrôles de portée et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-22T06:57:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc7ec59123aee65634736320dbf1cf5cdfb08786a78cca82ce9596fedc68b3cc
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI s’exécute à chaque push vers `main` et à chaque pull request. Elle utilise une portée intelligente pour ignorer les jobs coûteux lorsque seules des zones non liées ont changé.

## Aperçu des jobs

| Job                              | Objectif                                                                                     | Quand il s’exécute                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Détecter les changements de documentation uniquement, les portées modifiées, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PR non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                               | Toujours sur les pushes et PR non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                    | Toujours sur les pushes et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les jobs rapides de sécurité                                             | Toujours sur les pushes et PR non brouillons |
| `build-artifacts`                | Construire `dist/` et l’interface Control UI une fois, puis téléverser des artefacts réutilisables pour les jobs en aval | Changements pertinents pour Node     |
| `checks-fast-core`               | Lanes Linux rapides de correction, comme les vérifications bundled/plugin-contract/protocol  | Changements pertinents pour Node     |
| `checks-fast-contracts-channels` | Vérifications fragmentées des contrats de canaux avec un résultat de vérification agrégé stable | Changements pertinents pour Node     |
| `checks-node-extensions`         | Fragments complets de tests de bundled-plugin sur toute la suite d’extensions                | Changements pertinents pour Node     |
| `checks-node-core-test`          | Fragments de tests du cœur Node, hors lanes de canaux, bundled, contrats et extensions      | Changements pertinents pour Node     |
| `extension-fast`                 | Tests ciblés pour uniquement les bundled plugins modifiés                                    | Lorsque des changements d’extension sont détectés |
| `check`                          | Équivalent du contrôle local principal fragmenté : types prod, lint, garde-fous, types de test et smoke strict | Changements pertinents pour Node     |
| `check-additional`               | Garde-fous d’architecture, de frontières, de surface d’extension, de frontière de paquet, et fragments gateway-watch | Changements pertinents pour Node     |
| `build-smoke`                    | Tests smoke du CLI compilé et smoke de mémoire au démarrage                                  | Changements pertinents pour Node     |
| `checks`                         | Lanes Linux Node restantes : tests de canaux et compatibilité Node 22 uniquement sur push   | Changements pertinents pour Node     |
| `check-docs`                     | Vérifications de formatage, lint et liens cassés de la documentation                         | Documentation modifiée               |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                              | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Lanes de test spécifiques à Windows                                                          | Changements pertinents pour Windows  |
| `macos-node`                     | Lane de test TypeScript sur macOS utilisant les artefacts partagés déjà construits           | Changements pertinents pour macOS    |
| `macos-swift`                    | Lint, build et tests Swift pour l’application macOS                                          | Changements pertinents pour macOS    |
| `android`                        | Matrice de build et de tests Android                                                         | Changements pertinents pour Android  |

## Ordre d’échec rapide

Les jobs sont ordonnés pour que les vérifications peu coûteuses échouent avant le lancement des jobs coûteux :

1. `preflight` décide quelles lanes existent réellement. La logique `docs-scope` et `changed-scope` correspond à des étapes dans ce job, pas à des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateformes.
3. `build-artifacts` s’exécute en parallèle avec les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateforme et d’exécution se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Le workflow `install-smoke` séparé réutilise le même script de portée via son propre job `preflight`. Il calcule `run_install_smoke` à partir du signal plus restreint changed-smoke, de sorte que le smoke Docker/install ne s’exécute que pour les changements pertinents pour l’installation, le packaging et les conteneurs.

La logique locale de lanes modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Ce contrôle local est plus strict concernant les frontières d’architecture que la portée large des plateformes CI : les changements de production du cœur exécutent le typecheck de prod du cœur plus les tests du cœur, les changements limités aux tests du cœur n’exécutent que le typecheck/tests du cœur, les changements de production des extensions exécutent le typecheck de prod des extensions plus les tests d’extensions, et les changements limités aux tests d’extensions n’exécutent que le typecheck/tests des extensions. Les changements du Plugin SDK public ou du plugin-contract étendent la validation aux extensions, car les extensions dépendent de ces contrats du cœur. Les hausses de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine. Les changements racine/config inconnus basculent prudemment vers toutes les lanes.

Sur les pushes, la matrice `checks` ajoute la lane `compat-node22`, uniquement pour les pushes. Sur les pull requests, cette lane est ignorée et la matrice reste concentrée sur les lanes normales de test/canal.

Les familles de tests Node les plus lentes sont divisées en fragments par fichiers inclus afin de garder chaque job de petite taille : les contrats de canaux divisent la couverture du registre et du cœur en huit fragments pondérés chacun, les tests de commande de réponse auto-reply sont divisés en quatre fragments par motif d’inclusion, et les autres grands groupes de préfixes de réponse auto-reply sont divisés en deux fragments chacun. `check-additional` sépare également le travail de compilation/canari de frontière de paquet du travail de topologie d’exécution gateway/architecture.

GitHub peut marquer des jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même ref `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même ref échoue elle aussi. Les vérifications agrégées de fragments signalent explicitement ce cas d’annulation afin de le distinguer plus facilement d’un échec de test.

## Runners

| Runner                           | Jobs                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight` ; le preflight de install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-16vcpu-ubuntu-2404`  | `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, vérifications Linux, vérifications de documentation, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                             |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local des lanes modifiées pour origin/main...HEAD
pnpm check:changed   # contrôle local intelligent : typecheck/lint/tests modifiés par lane de frontière
pnpm check          # contrôle local rapide : tsgo de production + lint fragmenté + garde-fous rapides en parallèle
pnpm check:test-types
pnpm check:timed    # même contrôle avec minutage par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + liens cassés de la documentation
pnpm build          # construire dist lorsque les lanes CI artifact/build-smoke sont concernées
```
