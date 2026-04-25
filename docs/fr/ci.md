---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non.
    - Vous déboguez des vérifications GitHub Actions en échec.
summary: Graphe des tâches CI, portes de portée et équivalents des commandes locales
title: pipeline CI
x-i18n:
    generated_at: "2026-04-25T18:17:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 841b8036e59b5b03620b301918549670870842cc42681321a9b8f9d01792d950
    source_path: ci.md
    workflow: 15
---

Le pipeline CI s’exécute sur chaque push vers `main` et sur chaque pull request. Il utilise une portée intelligente pour ignorer les tâches coûteuses lorsque seules des zones non liées ont changé.

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. Le
workflow `Parity gate` s’exécute sur les changements de PR correspondants et via déclenchement manuel ; il
construit le runtime QA privé et compare les packs agentiques mock GPT-5.5 et Opus 4.6.
Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et via
déclenchement manuel ; il répartit en tâches parallèles la voie mock parity gate, la voie Matrix live et la voie Telegram live.
Les tâches live utilisent l’environnement `qa-live-shared`,
et la voie Telegram utilise des baux Convex. `OpenClaw Release
Checks` exécute également ces mêmes voies QA Lab avant l’approbation de la release.

Le workflow `Duplicate PRs After Merge` est un workflow manuel réservé aux mainteneurs pour le nettoyage des doublons après intégration.
Il utilise par défaut le mode dry-run et ne ferme que les PR explicitement
listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR
intégrée est fusionnée et que chaque doublon a soit une issue référencée commune,
soit des hunks modifiés qui se chevauchent.

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour garder
la documentation existante alignée sur les changements récemment intégrés. Il n’a pas de planification pure :
une exécution CI réussie sur `main` après un push non-bot peut le déclencher,
et un déclenchement manuel peut l’exécuter directement. Les invocations via workflow-run sont ignorées si `main` a déjà avancé ou si
une autre exécution non ignorée de Docs Agent a été créée dans la dernière heure. Lorsqu’il s’exécute, il
examine la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’au
`main` actuel ; ainsi, une exécution horaire peut couvrir tous les changements sur main accumulés depuis
le dernier passage sur la documentation.

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements
pour les tests lents. Il n’a pas de planification pure :
une exécution CI réussie sur `main` après un push non-bot peut le déclencher, mais il est ignoré si une autre invocation workflow-run
s’est déjà exécutée ou est en cours ce jour UTC. Un déclenchement manuel contourne cette
barrière d’activité quotidienne. La voie construit un rapport de performance Vitest groupé sur toute la suite, permet à Codex
de n’apporter que de petites corrections de performance des tests préservant la couverture au lieu de refactorisations larges,
puis relance le rapport de toute la suite et rejette les changements qui réduisent le
nombre de tests réussis de la baseline. Si la baseline contient des tests en échec,
Codex ne peut corriger que les échecs évidents et le rapport de toute la suite après l’agent
doit réussir avant qu’un commit soit effectué. Lorsque `main` avance avant que le push du bot n’atterrisse,
la voie rebase le patch validé, relance `pnpm check:changed`, et retente le push ;
les patchs obsolètes en conflit sont ignorés. Elle utilise GitHub-hosted Ubuntu afin que l’action Codex
puisse conserver la même posture de sécurité drop-sudo que l’agent docs.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Vue d’ensemble des tâches

| Tâche                            | Objectif                                                                                     | Quand elle s’exécute                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Détecter les changements docs-only, les portées modifiées, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PR non draft |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les pushes et PR non draft |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                    | Toujours sur les pushes et PR non draft |
| `security-fast`                  | Agrégat requis pour les tâches de sécurité rapides                                           | Toujours sur les pushes et PR non draft |
| `build-artifacts`                | Construire `dist/`, l’UI de contrôle, les vérifications des artefacts construits, et les artefacts réutilisables pour l’aval | Changements pertinents pour Node     |
| `checks-fast-core`               | Voies Linux rapides de correction, comme les vérifications bundled/plugin-contract/protocol  | Changements pertinents pour Node     |
| `checks-fast-contracts-channels` | Vérifications sharded des contrats de canaux avec un résultat de vérification agrégé stable  | Changements pertinents pour Node     |
| `checks-node-extensions`         | Shards complets de tests des plugins intégrés sur l’ensemble de la suite d’extensions        | Changements pertinents pour Node     |
| `checks-node-core-test`          | Shards de tests du cœur Node, hors voies de canaux, bundled, contrats et extensions          | Changements pertinents pour Node     |
| `extension-fast`                 | Tests ciblés uniquement pour les plugins intégrés modifiés                                   | Pull requests avec changements d’extensions |
| `check`                          | Équivalent principal local sharded : types prod, lint, gardes, types de test, et smoke strict | Changements pertinents pour Node     |
| `check-additional`               | Architecture, limites, gardes de surface des extensions, limites de paquets, et shards gateway-watch | Changements pertinents pour Node     |
| `build-smoke`                    | Tests smoke du CLI construit et smoke de mémoire au démarrage                                | Changements pertinents pour Node     |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits plus compatibilité Node 22 uniquement sur push | Changements pertinents pour Node     |
| `check-docs`                     | Vérifications de formatage, lint et liens cassés de la documentation                         | Documentation modifiée               |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                              | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Voies de test spécifiques à Windows                                                          | Changements pertinents pour Windows  |
| `macos-node`                     | Voie de test TypeScript macOS utilisant les artefacts construits partagés                    | Changements pertinents pour macOS    |
| `macos-swift`                    | Lint, build et tests Swift pour l’application macOS                                          | Changements pertinents pour macOS    |
| `android`                        | Tests unitaires Android pour les deux saveurs plus un build APK debug                        | Changements pertinents pour Android  |
| `test-performance-agent`         | Optimisation quotidienne des tests lents par Codex après activité de confiance               | Succès de la CI main ou déclenchement manuel |

## Ordre fail-fast

Les tâches sont ordonnées de sorte que les vérifications peu coûteuses échouent avant que les tâches coûteuses ne s’exécutent :

1. `preflight` décide quelles voies existent überhaupt. La logique `docs-scope` et `changed-scope` correspond à des étapes dans cette tâche, pas à des tâches autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, et `skills-python` échouent rapidement sans attendre les tâches plus lourdes de matrice d’artefacts et de plateformes.
3. `build-artifacts` s’exécute en parallèle avec les voies Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Ensuite, les voies plus lourdes de plateforme et de runtime se répartissent : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` seulement pour les PR, `checks`, `checks-windows`, `macos-node`, `macos-swift`, et `android`.

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Les modifications du workflow CI valident le graphe CI Node ainsi que le lint des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces voies de plateforme restent limitées aux changements du code source de la plateforme.
Les modifications limitées au routage CI, certaines modifications sélectionnées de fixtures de tests core peu coûteuses, et les modifications étroites d’helpers/tests de routage de contrats de plugin utilisent un chemin de manifeste Node rapide uniquement : preflight, sécurité, et une seule tâche `checks-fast-core`. Ce chemin évite les artefacts de build, la compatibilité Node 22, les contrats de canaux, les shards core complets, les shards de plugins intégrés, et les matrices de gardes supplémentaires lorsque les fichiers modifiés sont limités aux surfaces de routage ou d’helpers que la tâche rapide exerce directement.
Les vérifications Windows Node sont limitées aux wrappers spécifiques à Windows pour les processus et les chemins, aux helpers d’exécution npm/pnpm/UI, à la configuration du gestionnaire de paquets, et aux surfaces de workflow CI qui exécutent cette voie ; les changements non liés dans le code source, les plugins, install-smoke et les modifications de tests uniquement restent sur les voies Linux Node afin de ne pas réserver un worker Windows 16 vCPU pour une couverture déjà exercée par les shards de tests normaux.
Le workflow séparé `install-smoke` réutilise le même script de portée via sa propre tâche `preflight`. Il divise la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`. Les pull requests exécutent le chemin rapide pour les surfaces Docker/package, les changements de package/manifest de plugins intégrés, et les surfaces core plugin/channel/gateway/Plugin SDK que les tâches Docker smoke exercent. Les changements de plugins intégrés limités au code source, les modifications de tests uniquement et les modifications de documentation uniquement ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image Dockerfile racine, vérifie la CLI, exécute le smoke CLI agents delete shared-workspace, exécute l’e2e container gateway-network, vérifie un argument de build d’extension intégrée, et exécute le profil Docker de plugin intégré borné avec un délai global de commande de 240 secondes, chaque scénario ayant en plus son propre plafond séparé pour `docker run`. Le chemin complet conserve l’installation du package QR ainsi que la couverture Docker/update de l’installateur pour les exécutions planifiées nocturnes, les déclenchements manuels, les workflow-call de vérifications de release, et les pull requests qui touchent réellement les surfaces de l’installateur, des packages ou de Docker. Les pushes vers `main`, y compris les merge commits, ne forcent pas le chemin complet ; lorsque la logique changed-scope demanderait une couverture complète sur un push, le workflow conserve le Docker smoke rapide et laisse l’install smoke complet à la validation nocturne ou de release. Le smoke lent du fournisseur d’images d’installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke` ; il s’exécute dans la planification nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels de `install-smoke` peuvent l’inclure, mais les pull requests et les pushes vers `main` ne l’exécutent pas. Les tests Docker QR et installateur conservent leurs propres Dockerfiles orientés installation. En local, `test:docker:all` préconstruit une image shared live-test et une image built-app partagée `scripts/e2e/Dockerfile`, puis exécute les voies smoke live/E2E avec un ordonnanceur pondéré et `OPENCLAW_SKIP_DOCKER_BUILD=1` ; ajustez le nombre de slots par défaut du pool principal à 10 avec `OPENCLAW_DOCKER_ALL_PARALLELISM` et le nombre de slots du tail-pool sensible aux fournisseurs à 10 avec `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Les plafonds des voies lourdes sont par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` afin que les voies npm install et multi-services ne surchargent pas Docker pendant que les voies plus légères continuent d’occuper les slots disponibles. Le démarrage des voies est échelonné de 2 secondes par défaut pour éviter les tempêtes locales de création du démon Docker ; remplacez cela avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` ou une autre valeur en millisecondes. L’agrégat local effectue des vérifications préalables Docker, supprime les conteneurs OpenClaw E2E obsolètes, affiche l’état des voies actives, persiste les durées des voies pour un ordre du plus long au plus court, et prend en charge `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour l’inspection de l’ordonnanceur. Par défaut, il cesse de planifier de nouvelles voies groupées après le premier échec, et chaque voie a un délai de secours de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/tail sélectionnées utilisent des plafonds plus stricts par voie. Le workflow réutilisable live/E2E reproduit le modèle d’image partagée en construisant et en poussant une image Docker E2E GHCR taggée par SHA avant la matrice Docker, puis en exécutant la matrice avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Le workflow planifié live/E2E exécute chaque jour l’ensemble complet Docker du chemin de release. La matrice bundled update est divisée par cible de mise à jour afin que les passages répétés de npm update et de doctor repair puissent être shardés avec d’autres vérifications bundled.

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte locale est plus stricte concernant les limites d’architecture que la large portée de plateforme en CI : les changements de production core exécutent le typecheck prod core plus les tests core, les changements limités aux tests core n’exécutent que le typecheck/tests des tests core, les changements de production d’extensions exécutent le typecheck prod des extensions plus les tests d’extensions, et les changements limités aux tests d’extensions n’exécutent que le typecheck/tests des tests d’extensions. Les modifications publiques de Plugin SDK ou de plugin-contract étendent la validation aux extensions parce que celles-ci dépendent de ces contrats core. Les augmentations de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine. Les changements inconnus dans la racine ou la configuration basculent prudemment vers toutes les voies.

Sur les pushes, la matrice `checks` ajoute la voie `compat-node22`, uniquement pour les pushes. Sur les pull requests, cette voie est ignorée et la matrice reste concentrée sur les voies normales de tests/canaux.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque tâche reste petite sans sur-réserver de runners : les contrats de canaux s’exécutent en trois shards pondérés, les tests de plugins intégrés sont équilibrés sur six workers d’extensions, les petites voies unitaires core sont appariées, auto-reply s’exécute sur trois workers équilibrés au lieu de six petits workers, et les configs gateway/plugin agentiques sont réparties sur les tâches agentiques Node existantes limitées au code source au lieu d’attendre les artefacts construits. Les tests étendus de navigateur, QA, médias, et plugins divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé des plugins. Les tâches de shards d’extensions exécutent jusqu’à deux groupes de config de plugins à la fois avec un worker Vitest par groupe et un tas Node plus grand afin que les lots de plugins gourmands en imports ne créent pas de tâches CI supplémentaires. La large voie agents utilise l’ordonnanceur parallèle par fichiers partagé de Vitest parce qu’elle est dominée par les imports et l’ordonnancement, et non par un seul fichier de test lent. `runtime-config` s’exécute avec le shard infra core-runtime pour éviter que le shard runtime partagé ne possède toute la traîne. `check-additional` garde ensemble le travail compile/canary des limites de paquets et sépare l’architecture de topologie runtime de la couverture gateway watch ; le shard des gardes de limites exécute ses petits gardes indépendants en parallèle à l’intérieur d’une seule tâche. Gateway watch, les tests de canaux, et le shard core support-boundary s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` sont déjà construits, en conservant leurs anciens noms de vérification comme tâches de vérification légères tout en évitant deux workers Blacksmith supplémentaires et une seconde file d’attente de consommateurs d’artefacts.
La CI Android exécute `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La saveur third-party n’a pas de source set ni de manifest séparés ; sa voie de tests unitaires compile tout de même cette saveur avec les drapeaux BuildConfig SMS/call-log, tout en évitant une tâche dupliquée de packaging d’APK debug sur chaque push pertinent pour Android.
`extension-fast` est réservé aux PR parce que les exécutions sur push exécutent déjà les shards complets des plugins intégrés. Cela permet un retour sur les plugins modifiés pendant les revues sans réserver un worker Blacksmith supplémentaire sur `main` pour une couverture déjà présente dans `checks-node-extensions`.

GitHub peut marquer les tâches remplacées comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même ref `main`. Considérez cela comme du bruit CI sauf si l’exécution la plus récente pour cette même ref échoue également. Les vérifications agrégées de shards utilisent `!cancelled() && always()` afin de continuer à signaler les échecs normaux des shards, mais sans se mettre en file d’attente après que l’ensemble du workflow a déjà été remplacé.
La clé de concurrence CI est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions sur main.

## Runners

| Runner                           | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, tâches de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/bundled, vérifications sharded des contrats de canaux, shards `check` sauf lint, shards et agrégats `check-additional`, vérificateurs agrégés des tests Node, vérifications de documentation, Skills Python, workflow-sanity, labeler, auto-response ; le preflight de install-smoke utilise également Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse entrer en file d’attente plus tôt |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de tests Linux Node, shards de tests de plugins intégrés, `android`                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, qui reste suffisamment sensible au CPU pour que 8 vCPU coûtent plus qu’ils ne font gagner ; builds Docker install-smoke, où le coût en temps de file d’attente de 32 vCPU était supérieur au gain                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks reviennent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks reviennent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local des voies modifiées pour origin/main...HEAD
pnpm check:changed   # porte locale intelligente : typecheck/lint/tests modifiés par voie de limite
pnpm check          # porte locale rapide : tsgo de production + lint sharded + gardes rapides parallèles
pnpm check:test-types
pnpm check:timed    # même porte avec durées par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + liens cassés de la documentation
pnpm build          # construire dist lorsque les voies CI artifact/build-smoke sont pertinentes
node scripts/ci-run-timings.mjs <run-id>      # résumer le temps mur, le temps de file d’attente, et les tâches les plus lentes
node scripts/ci-run-timings.mjs --recent 10   # comparer les exécutions CI récentes réussies sur main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Liens associés

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de release](/fr/install/development-channels)
