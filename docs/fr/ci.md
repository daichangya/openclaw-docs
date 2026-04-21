---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez des vérifications GitHub Actions en échec
summary: Graphe des tâches CI, portes de périmètre et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-21T19:20:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d01a178402976cdf7c3c864695e8a12d3f7d1d069a77ea1b02a8aef2a3497f7
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI s’exécute à chaque push vers `main` et à chaque pull request. Elle utilise un cadrage intelligent pour ignorer les tâches coûteuses lorsque seules des zones non liées ont changé.

## Vue d’ensemble des tâches

| Tâche                            | Objectif                                                                                     | Quand elle s’exécute                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Détecter les changements uniquement dans la doc, les périmètres modifiés, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PR non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les pushes et PR non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendance par rapport aux avis npm                     | Toujours sur les pushes et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les tâches de sécurité rapides                                           | Toujours sur les pushes et PR non brouillons |
| `build-artifacts`                | Construire `dist/` et l’UI Control une fois, puis téléverser des artefacts réutilisables pour les tâches en aval | Changements pertinents pour Node    |
| `checks-fast-core`               | Voies rapides de vérification Linux, comme les vérifications bundled/plugin-contract/protocol | Changements pertinents pour Node    |
| `checks-fast-contracts-channels` | Vérifications shardées des contrats de channel avec un résultat de vérification agrégé stable | Changements pertinents pour Node    |
| `checks-node-extensions`         | Shards complets de tests des plugins groupés sur l’ensemble de la suite d’extensions         | Changements pertinents pour Node    |
| `checks-node-core-test`          | Shards de tests Node du cœur, hors voies channel, bundled, contract et extension             | Changements pertinents pour Node    |
| `extension-fast`                 | Tests ciblés uniquement sur les plugins groupés modifiés                                     | Quand des changements d’extension sont détectés |
| `check`                          | Équivalent local principal shardé : types prod, lint, garde-fous, types de test, et smoke strict | Changements pertinents pour Node    |
| `check-additional`               | Architecture, frontières, garde-fous de surface d’extension, frontières de package et shards gateway-watch | Changements pertinents pour Node    |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                            | Changements pertinents pour Node    |
| `checks`                         | Voies Linux Node restantes : tests de channel et compatibilité Node 22 seulement sur push    | Changements pertinents pour Node    |
| `check-docs`                     | Formatage, lint et vérification des liens cassés de la documentation                         | Documentation modifiée              |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                              | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Voies de test spécifiques à Windows                                                          | Changements pertinents pour Windows |
| `macos-node`                     | Voie de test TypeScript sur macOS utilisant les artefacts construits partagés                | Changements pertinents pour macOS   |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                  | Changements pertinents pour macOS   |
| `android`                        | Matrice de build et de test Android                                                          | Changements pertinents pour Android |

## Ordre fail-fast

Les tâches sont ordonnées de sorte que les vérifications peu coûteuses échouent avant que les plus coûteuses ne s’exécutent :

1. `preflight` décide quelles voies existent tout court. La logique `docs-scope` et `changed-scope` correspond à des étapes dans cette tâche, pas à des tâches autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les artefacts plus lourds ni les tâches de matrice par plateforme.
3. `build-artifacts` s’exécute en parallèle avec les voies Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Les voies plus lourdes, par plateforme et d’exécution, se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Le workflow séparé `install-smoke` réutilise le même script de périmètre via sa propre tâche `preflight`. Il calcule `run_install_smoke` à partir du signal plus étroit changed-smoke, de sorte que le smoke Docker/install ne s’exécute que pour les changements pertinents pour l’installation, le packaging et les conteneurs.

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte locale est plus stricte sur les frontières d’architecture que le large périmètre CI par plateforme : les changements de production du cœur exécutent le typecheck prod du cœur ainsi que les tests du cœur, les changements limités aux tests du cœur n’exécutent que le typecheck/tests du cœur, les changements de production des extensions exécutent le typecheck prod des extensions ainsi que les tests des extensions, et les changements limités aux tests des extensions n’exécutent que le typecheck/tests des extensions. Les changements du Plugin SDK public ou du plugin-contract étendent la validation aux extensions, car celles-ci dépendent de ces contrats du cœur. Les changements inconnus à la racine/configuration activent par sécurité toutes les voies.

Sur les pushes, la matrice `checks` ajoute la voie `compat-node22`, réservée aux pushes. Sur les pull requests, cette voie est ignorée et la matrice reste centrée sur les voies normales de test/channel.

Les familles de tests Node les plus lentes sont découpées en shards par fichiers inclus afin que chaque tâche reste petite : les contrats de channel séparent la couverture registry et core en huit shards pondérés chacun, les tests de commande de réponse auto-reply sont répartis en quatre shards par motifs d’inclusion, et les autres grands groupes de préfixes de réponse auto-reply sont répartis en deux shards chacun. `check-additional` sépare également le travail compile/canary des frontières de package du travail de topologie d’exécution gateway/architecture.

GitHub peut marquer des tâches remplacées comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même référence `main`. Considérez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même référence échoue aussi. Les vérifications agrégées des shards signalent explicitement ce cas d’annulation afin qu’il soit plus facile de le distinguer d’un échec de test.

## Exécuteurs

| Exécuteur                        | Tâches                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, vérifications Linux, vérifications de la documentation, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                          |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classifieur local des voies modifiées pour origin/main...HEAD
pnpm check:changed   # porte locale intelligente : typecheck/lint/tests modifiés par voie de frontière
pnpm check          # porte locale rapide : tsgo de production + lint shardé + garde-fous rapides en parallèle
pnpm check:test-types
pnpm check:timed    # même porte avec temporisations par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formatage de la documentation + lint + liens cassés
pnpm build          # construire dist quand les voies CI artifact/build-smoke sont concernées
```
