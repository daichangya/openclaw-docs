---
read_when:
    - Vous devez comprendre pourquoi un job CI s'est exécuté ou non
    - Vous déboguez des vérifications GitHub Actions en échec
summary: Graphe des jobs CI, portes de portée et équivalents de commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-05T12:37:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a95b6e584b4309bc249866ea436b4dfe30e0298ab8916eadbc344edae3d1194
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI s'exécute à chaque push vers `main` et sur chaque pull request. Elle utilise un ciblage intelligent pour ignorer les jobs coûteux lorsque seules des zones non liées ont changé.

## Vue d'ensemble des jobs

| Job                      | Objectif                                                                                  | Quand il s'exécute                   |
| ------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`              | Détecter les changements de documentation uniquement, les portées modifiées, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PR non brouillons |
| `security-fast`          | Détection de clés privées, audit des workflows via `zizmor`, audit des dépendances de production | Toujours sur les pushes et PR non brouillons |
| `build-artifacts`        | Construire `dist/` et l'interface utilisateur de contrôle une fois, puis téléverser des artefacts réutilisables pour les jobs en aval | Changements pertinents pour Node     |
| `checks-fast-core`       | Voies Linux rapides de correction, comme les vérifications groupées/plugin-contrat/protocole | Changements pertinents pour Node     |
| `checks-fast-extensions` | Agréger les voies fragmentées d'extensions après la fin de `checks-fast-extensions-shard` | Changements pertinents pour Node     |
| `extension-fast`         | Tests ciblés uniquement pour les plugins intégrés modifiés                                | Lorsque des changements d'extension sont détectés |
| `check`                  | Porte locale principale dans la CI : `pnpm check` plus `pnpm build:strict-smoke`         | Changements pertinents pour Node     |
| `check-additional`       | Gardes d'architecture et de limites, ainsi que le harnais de régression de surveillance de la gateway | Changements pertinents pour Node     |
| `build-smoke`            | Tests smoke de la CLI buildée et smoke de mémoire au démarrage                            | Changements pertinents pour Node     |
| `checks`                 | Voies Linux Node plus lourdes : tests complets, tests de canaux et compatibilité Node 22 uniquement sur push | Changements pertinents pour Node     |
| `check-docs`             | Formatage de la documentation, lint et vérifications de liens cassés                      | Documentation modifiée               |
| `skills-python`          | Ruff + pytest pour les Skills adossées à Python                                           | Changements pertinents pour les Skills Python |
| `checks-windows`         | Voies de test spécifiques à Windows                                                       | Changements pertinents pour Windows  |
| `macos-node`             | Voie de test TypeScript sur macOS utilisant les artefacts buildés partagés                | Changements pertinents pour macOS    |
| `macos-swift`            | Lint, build et tests Swift pour l'application macOS                                       | Changements pertinents pour macOS    |
| `android`                | Matrice de build et de test Android                                                       | Changements pertinents pour Android  |

## Ordre d'échec rapide

Les jobs sont ordonnés de sorte que les vérifications peu coûteuses échouent avant l'exécution des plus coûteuses :

1. `preflight` décide quelles voies existent réellement. La logique `docs-scope` et `changed-scope` correspond à des étapes à l'intérieur de ce job, pas à des jobs autonomes.
2. `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds d'artefacts et de matrice de plateformes.
3. `build-artifacts` se chevauche avec les voies Linux rapides afin que les consommateurs en aval puissent démarrer dès que la build partagée est prête.
4. Les voies plus lourdes de plateforme et d'exécution se déploient ensuite : `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Le workflow distinct `install-smoke` réutilise le même script de portée via son propre job `preflight`. Il calcule `run_install_smoke` à partir du signal plus étroit `changed-smoke`, de sorte que le smoke Docker/install ne s'exécute que pour les changements pertinents pour l'installation, le packaging et les conteneurs.

Sur les pushes, la matrice `checks` ajoute la voie `compat-node22` réservée aux pushes. Sur les pull requests, cette voie est ignorée et la matrice reste centrée sur les voies normales de test/canal.

## Exécuteurs

| Exécuteur                        | Jobs                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, vérifications Linux, vérifications docs, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Équivalents locaux

```bash
pnpm check          # types + lint + format
pnpm build:strict-smoke
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm check:docs     # format docs + lint + liens cassés
pnpm build          # construit dist lorsque les voies CI artifact/build-smoke sont concernées
```
