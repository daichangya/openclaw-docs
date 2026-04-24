---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/coverage
title: Tests
x-i18n:
    generated_at: "2026-04-24T07:32:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4ad5808ddbc06c704c9bcf9f780b06f9be94ac213ed22e79d880dedcaa6d3b
    source_path: reference/test.md
    workflow: 15
---

- Kit de test complet (suites, live, Docker) : [Testing](/fr/help/testing)

- `pnpm test:force` : tue tout processus gateway résiduel tenant le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port gateway isolé afin que les tests serveur n’entrent pas en collision avec une instance en cours d’exécution. Utilisez-le lorsqu’une exécution précédente du gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unit avec couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une barrière de couverture unitaire des fichiers chargés, pas d’une couverture globale de tous les fichiers du dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et 55 % pour les branches. Comme `coverage.all` vaut false, la barrière mesure les fichiers chargés par la suite de couverture unitaire au lieu de considérer tous les fichiers source des lanes séparées comme non couverts.
- `pnpm test:coverage:changed` : exécute la couverture unit uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : développe les chemins git modifiés en lanes Vitest ciblées lorsque le diff ne touche que des fichiers source/test routables. Les changements de configuration/setup reviennent toujours à l’exécution native des projets racine afin que les modifications de câblage relancent largement si nécessaire.
- `pnpm changed:lanes` : affiche les lanes architecturales déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute la barrière intelligente sur les changements du diff par rapport à `origin/main`. Il exécute le travail cœur avec les lanes de test cœur, le travail d’extension avec les lanes de test d’extension, le travail uniquement test avec seulement le typecheck/tests de test, étend les changements du Plugin SDK public ou du contrat de plugin à un passage de validation d’extension, et limite les bumps de version portant uniquement sur les métadonnées de publication aux vérifications ciblées de version/configuration/dépendances racine.
- `pnpm test` : route des cibles explicites de fichier/répertoire via des lanes Vitest ciblées. Les exécutions non ciblées utilisent des groupes de shards fixes et se développent en configurations feuille pour une exécution locale parallèle ; le groupe d’extensions se développe toujours vers les configurations de shard par extension au lieu d’un immense processus de projet racine.
- Les exécutions complètes et par shard d’extension mettent à jour les données de timing locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions suivantes utilisent ces timings pour équilibrer les shards lents et rapides. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact local de timing.
- Certains fichiers de test `plugin-sdk` et `commands` sont désormais routés via des lanes légères dédiées qui ne conservent que `test/setup.ts`, laissant les cas lourds au runtime sur leurs lanes existantes.
- Certains fichiers source auxiliaires `plugin-sdk` et `commands` mappent également `pnpm test:changed` vers des tests frères explicites dans ces lanes légères, afin que de petites modifications d’helpers évitent de relancer les suites lourdes adossées au runtime.
- `auto-reply` se divise désormais lui aussi en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/jeton/helper de niveau supérieur.
- La configuration Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec le runner partagé non isolé activé dans les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extension/plugin. Les plugins de canal lourds, le plugin navigateur et OpenAI s’exécutent comme shards dédiés ; les autres groupes de plugins restent regroupés. Utilisez `pnpm test extensions/<id>` pour une lane d’un plugin intégré.
- `pnpm test:perf:imports` : active le reporting Vitest de durée d’import + détail des imports, tout en utilisant toujours le routage ciblé de lanes pour les cibles explicites fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage d’import, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le chemin routé en mode changed avec l’exécution native du projet racine pour le même diff git validé.
- `pnpm test:perf:changed:bench -- --worktree` compare l’ensemble de changements du worktree actuel sans devoir valider d’abord.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute en série chaque configuration feuille Vitest de la suite complète et écrit des données de durée groupées ainsi que des artefacts JSON/log par configuration. Le Test Performance Agent utilise cela comme base de référence avant de tenter des correctifs de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après un changement orienté performances.
- Intégration Gateway : opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les smoke tests de bout en bout du gateway (multi-instance WS/HTTP/jumelage de nœuds). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux détaillés.
- `pnpm test:live` : exécute les tests live des fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou un `*_LIVE_TEST=1` spécifique au fournisseur) pour enlever le skip.
- `pnpm test:docker:all` : construit une fois l’image partagée de live-test et l’image Docker E2E, puis exécute les lanes smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` à une concurrence de 8 par défaut. Ajustez le pool principal avec `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` et le pool de fin sensible aux fournisseurs avec `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ; les deux valent 8 par défaut. Le runner cesse de planifier de nouvelles lanes du pool après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque lane a un délai d’attente de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Les journaux par lane sont écrits sous `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui` : démarre OpenClaw dockerisé + Open WebUI, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live exploitable (par exemple OpenAI dans `~/.profile`), récupère une image Open WebUI externe, et n’est pas censé être stable en CI comme les suites unit/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway pré-initialisé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversations routées, les lectures de transcript, les métadonnées de pièces jointes, le comportement de la file d’événements live, le routage des envois sortants, ainsi que les notifications de style canal Claude + permissions sur le vrai pont stdio. L’assertion des notifications Claude lit directement les trames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.

## Barrière locale de PR

Pour les vérifications locales de PR/atterrissage, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` flake sur une machine chargée, relancez une fois avant de le traiter comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les machines à mémoire limitée, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables env facultatives : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : « Reply with a single word: ok. No punctuation or extra text. »

Dernière exécution (2025-12-31, 20 runs) :

- minimax médiane 1279ms (min 1114, max 2431)
- opus médiane 2454ms (min 1224, max 3170)

## Benchmark de démarrage CLI

Script : [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Utilisation :

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Préréglages :

- `startup` : `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real` : `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all` : les deux préréglages

La sortie inclut `sampleCount`, moyenne, p50, p95, min/max, distribution exit-code/signal, et résumés RSS max pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution afin que la mesure de temps et la capture de profil utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise le fixture de référence versionné dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture versionné :

- `test/fixtures/cli-startup-bench.json`
- Actualisez-le avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## E2E onboarding (Docker)

Docker est facultatif ; il n’est nécessaire que pour les smoke tests d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de configuration/espace de travail/session, puis démarre le gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que l’assistant runtime QR maintenu se charge sous les runtimes Node Docker pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Associé

- [Testing](/fr/help/testing)
- [Testing live](/fr/help/testing-live)
