---
read_when:
    - Vous devez comprendre pourquoi un job CI s’est exécuté ou non
    - Vous déboguez des vérifications GitHub Actions en échec
summary: Graphe des jobs CI, portes de portée et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-21T06:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI s’exécute à chaque push vers `main` et sur chaque pull request. Elle utilise un cadrage intelligent pour ignorer les jobs coûteux lorsque seules des zones non liées ont changé.

## Vue d’ensemble des jobs

| Job                              | Objectif                                                                                     | Quand il s’exécute                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les portées modifiées, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushs et PR non brouillons |
| `security-scm-fast`              | Détection des clés privées et audit des workflows via `zizmor`                              | Toujours sur les pushs et PR non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                   | Toujours sur les pushs et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                            | Toujours sur les pushs et PR non brouillons |
| `build-artifacts`                | Construire `dist/` et l’interface Control UI une seule fois, puis téléverser des artefacts réutilisables pour les jobs en aval | Changements pertinents pour Node    |
| `checks-fast-core`               | Lanes Linux rapides de correction, comme les vérifications bundled/plugin-contract/protocol | Changements pertinents pour Node    |
| `checks-fast-contracts-channels` | Vérifications shardées des contrats de canaux avec un résultat d’agrégation stable          | Changements pertinents pour Node    |
| `checks-node-extensions`         | Shards complets de tests de plugins intégrés sur toute la suite d’extensions                | Changements pertinents pour Node    |
| `checks-node-core-test`          | Shards de tests Node du cœur, hors lanes de canaux, bundles, contrats et extensions         | Changements pertinents pour Node    |
| `extension-fast`                 | Tests ciblés uniquement pour les plugins intégrés modifiés                                  | Lorsque des changements d’extension sont détectés |
| `check`                          | Équivalent principal local shardé : types prod, lint, garde-fous, types de test et smoke strict | Changements pertinents pour Node    |
| `check-additional`               | Shards d’architecture, de frontières, de garde-fous de surface d’extension, de frontière de paquet et de surveillance gateway | Changements pertinents pour Node    |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                           | Changements pertinents pour Node    |
| `checks`                         | Lanes Linux Node restantes : tests de canaux et compatibilité Node 22 uniquement sur push  | Changements pertinents pour Node    |
| `check-docs`                     | Formatage, lint et vérification des liens cassés dans la documentation                      | Documentation modifiée              |
| `skills-python`                  | Ruff + pytest pour les Skills basées sur Python                                             | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Lanes de test spécifiques à Windows                                                         | Changements pertinents pour Windows |
| `macos-node`                     | Lane de tests TypeScript sur macOS utilisant les artefacts construits partagés              | Changements pertinents pour macOS   |
| `macos-swift`                    | Lint, build et tests Swift pour l’application macOS                                         | Changements pertinents pour macOS   |
| `android`                        | Matrice de build et de tests Android                                                        | Changements pertinents pour Android |

## Ordre fail-fast

Les jobs sont ordonnés afin que les vérifications peu coûteuses échouent avant le lancement des plus coûteuses :

1. `preflight` décide quelles lanes existent réellement. La logique `docs-scope` et `changed-scope` correspond à des étapes à l’intérieur de ce job, pas à des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds d’artefacts et de matrices de plateforme.
3. `build-artifacts` se chevauche avec les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Ensuite, les lanes plus lourdes de plateforme et d’exécution se déploient : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Le workflow séparé `install-smoke` réutilise le même script de portée via son propre job `preflight`. Il calcule `run_install_smoke` à partir du signal plus restreint changed-smoke, de sorte que le smoke Docker/install ne s’exécute que pour les changements pertinents pour l’installation, le packaging et les conteneurs.

La logique locale des lanes modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte locale est plus stricte concernant les frontières d’architecture que la portée large des plateformes CI : les changements de production du cœur exécutent le typecheck prod du cœur ainsi que les tests du cœur, les changements limités aux tests du cœur n’exécutent que le typecheck/tests du cœur, les changements de production d’extensions exécutent le typecheck prod des extensions ainsi que les tests des extensions, et les changements limités aux tests d’extensions n’exécutent que le typecheck/tests des extensions. Les changements du Plugin SDK public ou des plugin-contracts étendent la validation aux extensions, car celles-ci dépendent de ces contrats du cœur. Les changements inconnus à la racine/configuration basculent prudemment vers toutes les lanes.

Lors des pushs, la matrice `checks` ajoute la lane `compat-node22`, uniquement sur push. Sur les pull requests, cette lane est ignorée et la matrice reste concentrée sur les lanes normales de test/canal.

Les familles de tests Node les plus lentes sont divisées en shards par fichiers inclus afin que chaque job reste réduit : les contrats de canaux divisent la couverture registry et core en huit shards pondérés chacun, les tests de commandes de réponse auto-reply sont divisés en quatre shards par motifs d’inclusion, et les autres grands groupes de préfixes de réponse auto-reply sont divisés en deux shards chacun. `check-additional` sépare également le travail de compilation/canari des frontières de paquets du travail de topologie d’exécution gateway/architecture.

GitHub peut marquer des jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même référence `main`. Considérez cela comme du bruit CI, sauf si l’exécution la plus récente pour cette même référence échoue aussi. Les vérifications agrégées de shards signalent explicitement ce cas d’annulation afin de le distinguer plus facilement d’un échec de test.

## Exécuteurs

| Exécuteur                        | Jobs                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, vérifications Linux, vérifications docs, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                           |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local des lanes modifiées pour origin/main...HEAD
pnpm check:changed   # porte locale intelligente : typecheck/lint/tests modifiés par lane de frontière
pnpm check          # porte locale rapide : tsgo de production + lint shardé + garde-fous rapides en parallèle
pnpm check:test-types
pnpm check:timed    # même porte avec durées par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + liens cassés de la documentation
pnpm build          # construire dist lorsque les lanes CI artifact/build-smoke sont pertinentes
```
