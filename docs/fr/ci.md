---
read_when:
    - Vous devez comprendre pourquoi un job CI s’est ou ne s’est pas exécuté
    - Vous déboguez des vérifications GitHub Actions en échec
summary: Graphe des jobs CI, barrières de portée et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-24T07:02:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e24efec145ff144b007e248ef0f9c56287619eb9af204d45d49984909a6136b
    source_path: ci.md
    workflow: 15
---

La CI s’exécute à chaque push vers `main` et sur chaque pull request. Elle utilise un ciblage intelligent pour ignorer les jobs coûteux lorsque seules des zones sans rapport ont changé.

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. Le workflow `Parity gate` s’exécute sur les changements de PR correspondants et par déclenchement manuel ; il construit le runtime QA privé et compare les packs agentiques mock GPT-5.4 et Opus 4.6. Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et par déclenchement manuel ; il distribue en parallèle le parity gate mock, la voie Matrix en direct et la voie Telegram en direct. Les jobs en direct utilisent l’environnement `qa-live-shared`, et la voie Telegram utilise des baux Convex. `OpenClaw Release Checks` exécute également les mêmes voies QA Lab avant l’approbation d’une release.

Le workflow `Duplicate PRs After Merge` est un workflow manuel de maintenance pour le nettoyage des doublons après intégration. Il utilise par défaut le mode dry-run et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon a soit une issue référencée partagée, soit des hunks modifiés qui se chevauchent.

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour maintenir la documentation existante alignée sur les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie sur `main` après un push non effectué par un bot peut le déclencher, et un déclenchement manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées si `main` a déjà avancé ou si une autre exécution `Docs Agent` non ignorée a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source du précédent `Docs Agent` non ignoré jusqu’au `main` actuel, de sorte qu’une exécution horaire puisse couvrir tous les changements accumulés sur main depuis le dernier passage documentation.

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie sur `main` après un push non effectué par un bot peut le déclencher, mais il est ignoré si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le déclenchement manuel contourne cette barrière d’activité quotidienne. Cette voie construit un rapport complet des performances Vitest groupées, laisse Codex effectuer uniquement de petites corrections de performance de test préservant la couverture plutôt que de larges refactorings, puis relance le rapport complet et rejette les changements qui réduisent le nombre de tests de référence réussis. Si la référence comporte des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport complet après intervention de l’agent doit réussir avant qu’un quelconque commit soit effectué. Lorsque `main` avance avant que le push du bot validé n’atterrisse, la voie rebase le correctif validé, relance `pnpm check:changed` et réessaie le push ; les correctifs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent docs.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Vue d’ensemble des jobs

| Job                              | But                                                                                          | Quand il s’exécute                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les portées modifiées, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PR non brouillon |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les pushes et PR non brouillon |
| `security-dependency-audit`      | Audit sans dépendances du lockfile de production par rapport aux avis npm                    | Toujours sur les pushes et PR non brouillon |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                             | Toujours sur les pushes et PR non brouillon |
| `build-artifacts`                | Construire `dist/`, la Control UI, les vérifications d’artefacts construits, et les artefacts réutilisables en aval | Changements pertinents pour Node      |
| `checks-fast-core`               | Voies rapides de correction Linux, comme les vérifications bundled/plugin-contract/protocol  | Changements pertinents pour Node      |
| `checks-fast-contracts-channels` | Vérifications shardées des contrats de canaux avec un résultat de vérification agrégé stable | Changements pertinents pour Node      |
| `checks-node-extensions`         | Shards complets de tests de plugins inclus sur toute la suite d’extensions                   | Changements pertinents pour Node      |
| `checks-node-core-test`          | Shards de tests Node du cœur, hors canaux, plugins inclus, contrats et voies d’extensions    | Changements pertinents pour Node      |
| `extension-fast`                 | Tests ciblés uniquement pour les plugins inclus modifiés                                     | Pull requests avec changements d’extensions |
| `check`                          | Équivalent local principal shardé : types prod, lint, gardes, types de test et smoke strict | Changements pertinents pour Node      |
| `check-additional`               | Architecture, limites, gardes de surface d’extension, limites de package, et shards gateway-watch | Changements pertinents pour Node  |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                            | Changements pertinents pour Node      |
| `checks`                         | Vérificateur pour les tests de canaux d’artefacts construits plus compatibilité Node 22 uniquement sur push | Changements pertinents pour Node |
| `check-docs`                     | Formatage docs, lint et vérifications de liens cassés                                        | Documentation modifiée                |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                              | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Voies de test spécifiques à Windows                                                          | Changements pertinents pour Windows   |
| `macos-node`                     | Voie de test TypeScript macOS utilisant les artefacts construits partagés                    | Changements pertinents pour macOS     |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                  | Changements pertinents pour macOS     |
| `android`                        | Tests unitaires Android pour les deux variantes plus un build APK debug                      | Changements pertinents pour Android   |
| `test-performance-agent`         | Optimisation quotidienne des tests lents par Codex après activité de confiance               | Succès CI sur main ou déclenchement manuel |

## Ordre fail-fast

Les jobs sont ordonnés de sorte que les vérifications peu coûteuses échouent avant que les plus coûteuses ne s’exécutent :

1. `preflight` décide quelles voies existent réellement. La logique `docs-scope` et `changed-scope` correspond à des étapes dans ce job, et non à des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateformes.
3. `build-artifacts` se chevauche avec les voies Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Les voies de plateforme et de runtime plus lourdes se distribuent ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` réservé aux PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Les modifications du workflow CI valident le graphe CI Node ainsi que le lint des workflows, mais n’imposent pas à elles seules les builds natifs Windows, Android ou macOS ; ces voies de plateforme restent limitées aux changements du code source de la plateforme.
Les vérifications Node Windows sont limitées aux wrappers Windows spécifiques aux processus/chemins, aux helpers d’exécution npm/pnpm/UI, à la configuration du gestionnaire de packages, et aux surfaces de workflow CI qui exécutent cette voie ; les changements sans rapport dans le code source, les plugins, l’install-smoke et les tests seuls restent sur les voies Linux Node afin de ne pas réserver un worker Windows 16 vCPU pour une couverture déjà exercée par les shards de test normaux.
Le workflow séparé `install-smoke` réutilise le même script de portée via son propre job `preflight`. Il répartit la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`. Les pull requests exécutent le chemin rapide pour les surfaces Docker/package, les changements de package/manifeste de plugins inclus, et les surfaces cœur plugin/canal/gateway/Plugin SDK que les jobs Docker smoke exercent. Les changements uniquement de code source dans les plugins inclus, les modifications de tests seules et les modifications docs-only ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image du Dockerfile racine, vérifie la CLI, exécute l’e2e gateway-network en conteneur, vérifie un argument de build d’extension incluse, et exécute le profil Docker de plugin inclus borné avec un délai de commande de 120 secondes. Le chemin complet conserve la couverture d’installation par QR package ainsi que la couverture installateur Docker/update pour les exécutions nocturnes planifiées, les déclenchements manuels, les vérifications de release par workflow-call et les pull requests qui touchent réellement les surfaces installateur/package/Docker. Les pushes sur `main`, y compris les commits de fusion, n’imposent pas le chemin complet ; lorsque la logique changed-scope demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release. Le smoke lent d’installation globale Bun image-provider est contrôlé séparément par `run_bun_global_install_smoke` ; il s’exécute sur la planification nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels de `install-smoke` peuvent l’inclure, mais les pull requests et les pushes sur `main` ne l’exécutent pas. Les tests Docker QR et installateur conservent leurs propres Dockerfiles centrés installation. En local, `test:docker:all` préconstruit une image partagée de test live et une image partagée d’application construite `scripts/e2e/Dockerfile`, puis exécute en parallèle les voies smoke live/E2E avec `OPENCLAW_SKIP_DOCKER_BUILD=1` ; ajustez le parallélisme par défaut du pool principal de 8 avec `OPENCLAW_DOCKER_ALL_PARALLELISM` et le parallélisme du pool de fin sensible au fournisseur de 8 avec `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. L’agrégat local arrête par défaut de planifier de nouvelles voies mutualisées après le premier échec, et chaque voie dispose d’un délai de 120 minutes, modifiable via `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Le workflow live/E2E réutilisable reproduit le modèle à image partagée en construisant et publiant une image Docker E2E GHCR taguée par SHA avant la matrice Docker, puis en exécutant la matrice avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Le workflow live/E2E planifié exécute chaque jour la suite Docker complète du chemin de release. La matrice complète d’update/canal inclus reste manuelle/full-suite car elle effectue des passes répétées réelles de mise à jour npm et de réparation doctor.

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette barrière locale est plus stricte sur les limites d’architecture que la large portée de plateforme en CI : les changements de production du cœur exécutent le typecheck prod du cœur plus les tests du cœur, les changements uniquement de tests du cœur n’exécutent que le typecheck/tests du cœur, les changements de production d’extension exécutent le typecheck prod des extensions plus les tests d’extensions, et les changements uniquement de tests d’extensions n’exécutent que le typecheck/tests d’extensions. Les changements du Plugin SDK public ou du plugin-contract étendent la validation aux extensions car celles-ci dépendent de ces contrats du cœur. Les hausses de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine. Les changements inconnus de racine/configuration échouent prudemment vers toutes les voies.

Sur les pushes, la matrice `checks` ajoute la voie `compat-node22`, réservée aux pushes. Sur les pull requests, cette voie est ignorée et la matrice reste focalisée sur les voies normales de test/canal.

Les familles de tests Node les plus lentes sont fractionnées ou équilibrées afin que chaque job reste compact sans sur-réserver les runners : les contrats de canal s’exécutent en trois shards pondérés, les tests de plugins inclus sont équilibrés sur six workers d’extension, les petites voies unitaires du cœur sont appariées, auto-reply s’exécute sur trois workers équilibrés au lieu de six minuscules workers, et les configurations agentiques gateway/plugin sont réparties sur les jobs Node agentiques existants réservés au code source au lieu d’attendre les artefacts construits. Les tests généraux de navigateur, QA, médias et plugins divers utilisent leurs configurations Vitest dédiées plutôt que le fourre-tout partagé des plugins. Les jobs de shards d’extensions exécutent les groupes de configuration de plugins en série avec un seul worker Vitest et un heap Node plus grand afin que les lots de plugins lourds en imports ne surchargent pas les petits runners CI. La large voie agents utilise l’ordonnanceur parallèle par fichiers Vitest partagé, car elle est dominée par les imports/la planification plutôt que par un seul fichier de test lent. `runtime-config` s’exécute avec le shard infra core-runtime pour éviter que le shard runtime partagé ne porte la fin de queue. `check-additional` conserve ensemble le travail de compilation/canary des limites de package et sépare l’architecture de topologie runtime de la couverture gateway watch ; le shard des gardes de limites exécute ses petits gardes indépendants en concurrence dans un seul job. Gateway watch, les tests de canaux et le shard core support-boundary s’exécutent en concurrence dans `build-artifacts` après que `dist/` et `dist-runtime/` sont déjà construits, ce qui conserve leurs anciens noms de vérification comme jobs légers de vérification tout en évitant deux workers Blacksmith supplémentaires et une seconde file d’attente de consommateurs d’artefacts.

La CI Android exécute `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante third-party n’a ni source set ni manifeste séparés ; sa voie de tests unitaires compile tout de même cette variante avec les drapeaux BuildConfig SMS/journal d’appels, tout en évitant un job de packaging APK debug dupliqué à chaque push pertinent pour Android.
`extension-fast` est réservé aux PR, car les exécutions sur push exécutent déjà les shards complets des plugins inclus. Cela permet un retour rapide sur les plugins modifiés pendant les revues sans réserver un worker Blacksmith supplémentaire sur `main` pour une couverture déjà présente dans `checks-node-extensions`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même ref `main`. Considérez cela comme du bruit CI, sauf si l’exécution la plus récente pour cette même ref échoue également. Les vérifications agrégées de shards utilisent `!cancelled() && always()` afin qu’elles signalent toujours les échecs normaux de shards, sans toutefois se mettre en file d’attente après que l’ensemble du workflow a déjà été remplacé.
La clé de concurrence CI est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions sur main.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/plugins inclus, vérifications shardées des contrats de canaux, shards `check` sauf lint, shards et agrégats `check-additional`, vérificateurs agrégés des tests Node, vérifications docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse entrer en file plus tôt |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de tests Node Linux, shards de tests de plugins inclus, `android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, qui reste suffisamment sensible au CPU pour que 8 vCPU coûtent plus qu’ils ne rapportent ; builds Docker install-smoke, où le coût en temps de file d’attente de 32 vCPU dépassait le gain                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local des voies modifiées pour origin/main...HEAD
pnpm check:changed   # barrière locale intelligente : typecheck/lint/tests modifiés par voie de limite
pnpm check          # barrière locale rapide : tsgo production + lint shardé + gardes rapides en parallèle
pnpm check:test-types
pnpm check:timed    # même barrière avec temps par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint docs + liens cassés
pnpm build          # construire dist lorsque les voies CI artifact/build-smoke comptent
node scripts/ci-run-timings.mjs <run-id>      # résumer le temps mur, le temps de file d’attente et les jobs les plus lents
node scripts/ci-run-timings.mjs --recent 10   # comparer les exécutions CI réussies récentes sur main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Articles connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de release](/fr/install/development-channels)
