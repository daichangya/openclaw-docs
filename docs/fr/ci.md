---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez des vérifications GitHub Actions en échec
summary: Graphe des tâches CI, portes de portée et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-23T13:58:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI s’exécute sur chaque push vers `main` et sur chaque pull request. Elle utilise une portée intelligente pour ignorer les tâches coûteuses lorsque seules des zones sans rapport ont changé.

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. Le
workflow `Parity gate` s’exécute sur les changements de PR correspondants et via déclenchement manuel ; il
construit le runtime QA privé et compare les packs agentiques simulés GPT-5.4 et Opus 4.6.
Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et via
déclenchement manuel ; il répartit en tâches parallèles la porte de parité simulée, la voie Matrix en direct et la voie Telegram en direct.
Les tâches en direct utilisent l’environnement `qa-live-shared`,
et la voie Telegram utilise des baux Convex. `OpenClaw Release
Checks` exécute également les mêmes voies QA Lab avant l’approbation d’une version.

## Vue d’ensemble des tâches

| Tâche                            | Objectif                                                                                     | Quand elle s’exécute                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les portées modifiées, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PR non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les pushes et PR non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendance contre les avis npm                          | Toujours sur les pushes et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les tâches de sécurité rapides                                           | Toujours sur les pushes et PR non brouillons |
| `build-artifacts`                | Construire `dist/`, l’interface Control UI, les vérifications des artefacts construits, et les artefacts réutilisables en aval | Changements pertinents pour Node      |
| `checks-fast-core`               | Voies rapides de validation Linux, comme les vérifications bundled/plugin-contract/protocol  | Changements pertinents pour Node      |
| `checks-fast-contracts-channels` | Vérifications fragmentées des contrats de canaux avec un résultat de vérification agrégé stable | Changements pertinents pour Node   |
| `checks-node-extensions`         | Fragments complets de tests de plugins intégrés sur l’ensemble de la suite d’extensions      | Changements pertinents pour Node      |
| `checks-node-core-test`          | Fragments de tests Node du cœur, hors voies canaux, intégrées, contrats et extensions        | Changements pertinents pour Node      |
| `extension-fast`                 | Tests ciblés pour seulement les plugins intégrés modifiés                                    | Pull requests avec changements d’extensions |
| `check`                          | Équivalent local principal fragmenté : types prod, lint, gardes, types de test et smoke strict | Changements pertinents pour Node   |
| `check-additional`               | Fragments d’architecture, limites, gardes de surface d’extension, limites de package, et gateway-watch | Changements pertinents pour Node |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                            | Changements pertinents pour Node      |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits plus la compatibilité Node 22 réservée aux pushes | Changements pertinents pour Node |
| `check-docs`                     | Vérifications de formatage, lint et liens cassés de la documentation                         | Documentation modifiée                |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                              | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Voies de test spécifiques à Windows                                                          | Changements pertinents pour Windows   |
| `macos-node`                     | Voie de test TypeScript macOS utilisant les artefacts construits partagés                    | Changements pertinents pour macOS     |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                  | Changements pertinents pour macOS     |
| `android`                        | Tests unitaires Android pour les deux variantes plus un build d’APK debug                    | Changements pertinents pour Android   |

## Ordre Fail-Fast

Les tâches sont ordonnées pour que les vérifications peu coûteuses échouent avant le lancement des plus coûteuses :

1. `preflight` décide quelles voies existent réellement. La logique `docs-scope` et `changed-scope` se trouve dans des étapes à l’intérieur de cette tâche, et non dans des tâches autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les tâches plus lourdes de matrice d’artefacts et de plateformes.
3. `build-artifacts` se chevauche avec les voies Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Les voies plus lourdes de plateforme et de runtime sont ensuite réparties : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` réservé aux PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Les modifications du workflow CI valident le graphe CI Node ainsi que le lint des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces voies de plateforme restent limitées aux changements du code source de la plateforme.
Les vérifications Node Windows sont limitées aux wrappers de processus/chemins spécifiques à Windows, aux helpers d’exécution npm/pnpm/UI, à la configuration du gestionnaire de paquets, et aux surfaces de workflow CI qui exécutent cette voie ; les changements sans rapport dans le code source, les plugins, `install-smoke` et les tests uniquement restent sur les voies Linux Node afin de ne pas réserver un worker Windows 16-vCPU pour une couverture déjà exercée par les fragments de test normaux.
Le workflow distinct `install-smoke` réutilise le même script de portée via sa propre tâche `preflight`. Il calcule `run_install_smoke` à partir du signal plus étroit `changed-smoke`, de sorte que les smoke Docker/install s’exécutent pour les changements liés à l’installation, au packaging, aux conteneurs, aux changements de production des extensions intégrées, ainsi qu’aux surfaces cœur plugin/channel/Gateway/Plugin SDK exercées par les tâches smoke Docker. Les modifications limitées aux tests et à la documentation ne réservent pas de workers Docker. Son smoke de package QR force la réexécution de la couche Docker `pnpm install` tout en préservant le cache BuildKit du store pnpm, de sorte qu’il continue à exercer l’installation sans retélécharger les dépendances à chaque exécution. Son e2e `gateway-network` réutilise l’image runtime construite plus tôt dans la tâche, ce qui ajoute une couverture WebSocket réelle entre conteneurs sans ajouter un autre build Docker. L’agrégat local `test:docker:all` préconstruit une image de test en direct partagée et une image d’application construite partagée `scripts/e2e/Dockerfile`, puis exécute les voies smoke live/E2E en parallèle avec `OPENCLAW_SKIP_DOCKER_BUILD=1` ; ajustez le parallélisme par défaut de 4 avec `OPENCLAW_DOCKER_ALL_PARALLELISM`. Par défaut, l’agrégat local cesse de planifier de nouvelles voies mutualisées après le premier échec, et chaque voie dispose d’un délai maximal de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Les voies sensibles au démarrage ou au provider s’exécutent exclusivement après le pool parallèle. Le workflow live/E2E réutilisable reflète ce modèle d’image partagée en construisant et en poussant une image Docker E2E GHCR taguée par SHA avant la matrice Docker, puis en exécutant la matrice avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Le workflow live/E2E planifié exécute chaque jour la suite Docker complète du chemin de version. Les tests Docker QR et d’installateur conservent leurs propres Dockerfiles centrés sur l’installation. Une tâche distincte `docker-e2e-fast` exécute le profil Docker borné des plugins intégrés sous un délai de commande de 120 secondes : réparation des dépendances setup-entry plus isolation synthétique des échecs du bundled-loader. La matrice complète de mise à jour intégrée/canal reste manuelle/suite complète, car elle effectue des passes répétées réelles de mise à jour npm et de réparation doctor.

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte locale est plus stricte sur les limites d’architecture que la large portée de plateforme de la CI : les changements de production du cœur exécutent le typecheck prod du cœur plus les tests du cœur, les changements limités aux tests du cœur n’exécutent que le typecheck/tests des tests du cœur, les changements de production des extensions exécutent le typecheck prod des extensions plus les tests des extensions, et les changements limités aux tests des extensions n’exécutent que le typecheck/tests des tests des extensions. Les changements du Plugin SDK public ou du plugin-contract élargissent la validation aux extensions, car celles-ci dépendent de ces contrats du cœur. Les hausses de version limitées aux métadonnées de version exécutent des vérifications ciblées version/config/dépendances racine. Les changements inconnus sur la racine/configuration basculent par sécurité sur toutes les voies.

Sur les pushes, la matrice `checks` ajoute la voie `compat-node22` réservée aux pushes. Sur les pull requests, cette voie est ignorée et la matrice reste concentrée sur les voies normales de test/canal.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque tâche reste petite : les contrats de canaux divisent la couverture registre et cœur en six fragments pondérés au total, les tests de plugins intégrés sont équilibrés sur six workers d’extension, auto-reply s’exécute sur trois workers équilibrés au lieu de six très petits workers, et les configurations agentiques Gateway/plugin sont réparties sur les tâches Node agentiques existantes limitées au code source au lieu d’attendre les artefacts construits. Les tests larges navigateur, QA, média et plugins divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé des plugins. La large voie agents utilise le planificateur partagé Vitest parallèle par fichier, car elle est dominée par les imports et l’ordonnancement plutôt que par un seul fichier de test lent. `runtime-config` s’exécute avec le fragment infra core-runtime pour éviter que le fragment runtime partagé ne porte la fin de queue. `check-additional` garde ensemble le travail compile/canary des limites de package et sépare l’architecture de topologie runtime de la couverture gateway watch ; le fragment boundary guard exécute ses petites gardes indépendantes en parallèle à l’intérieur d’une seule tâche. Gateway watch, les tests de canaux et le fragment cœur support-boundary s’exécutent en parallèle dans `build-artifacts` une fois que `dist/` et `dist-runtime/` sont déjà construits, en conservant leurs anciens noms de vérification comme tâches légères de vérification tout en évitant deux workers Blacksmith supplémentaires et une seconde file de consommateurs d’artefacts.
La CI Android exécute `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante third-party n’a pas de source set ni de manifeste distincts ; sa voie de tests unitaires compile tout de même cette variante avec les drapeaux BuildConfig SMS/call-log, tout en évitant une tâche de packaging d’APK debug dupliquée à chaque push pertinent pour Android.
`extension-fast` est réservé aux PR, car les pushes exécutent déjà les fragments complets de plugins intégrés. Cela conserve un retour ciblé sur les plugins modifiés pour les revues sans réserver un worker Blacksmith supplémentaire sur `main` pour une couverture déjà présente dans `checks-node-extensions`.

GitHub peut marquer les tâches remplacées comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même ref `main`. Considérez cela comme du bruit CI, sauf si la dernière exécution pour la même ref échoue aussi. Les vérifications agrégées de fragments utilisent `!cancelled() && always()` afin de continuer à signaler les échecs normaux des fragments, sans se mettre en file d’attente après que tout le workflow a déjà été remplacé.
La clé de concurrence CI est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions sur `main`.

## Exécuteurs

| Exécuteur                        | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, tâches de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides protocol/contract/bundled, vérifications fragmentées des contrats de canaux, fragments `check` sauf le lint, fragments et agrégats `check-additional`, vérificateurs agrégés de tests Node, vérifications docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragments de tests Linux Node, fragments de tests des plugins intégrés, `android`                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, qui reste suffisamment sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent ; builds Docker install-smoke, où le coût du temps d’attente en file d’un 32-vCPU dépassait le gain                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local des voies modifiées pour origin/main...HEAD
pnpm check:changed   # porte locale intelligente : typecheck/lint/tests modifiés par voie de limite
pnpm check          # porte locale rapide : tsgo de production + lint fragmenté + gardes rapides en parallèle
pnpm check:test-types
pnpm check:timed    # même porte avec des timings par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + liens cassés
pnpm build          # construire dist lorsque les voies CI artifact/build-smoke sont concernées
node scripts/ci-run-timings.mjs <run-id>  # résumer le temps total, le temps d’attente en file et les tâches les plus lentes
```
