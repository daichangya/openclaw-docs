---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests en local (Vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-04-21T07:05:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# Tests

- Kit de test complet (suites, live, Docker) : [Testing](/fr/help/testing)

- `pnpm test:force` : tue tout processus gateway persistant qui conserve le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. À utiliser lorsqu’une exécution précédente de la gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une barrière de couverture unitaire sur les fichiers chargés, et non d’une couverture tous fichiers sur l’ensemble du dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et 55 % pour les branches. Comme `coverage.all` vaut false, la barrière mesure les fichiers chargés par la suite de couverture unitaire au lieu de traiter chaque fichier source des voies fractionnées comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : développe les chemins git modifiés en voies Vitest ciblées lorsque le diff ne touche que des fichiers source/test routables. Les modifications de configuration/setup reviennent toujours à l’exécution native des projets racine afin que les modifications de câblage relancent largement si nécessaire.
- `pnpm changed:lanes` : affiche les voies architecturales déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute la barrière intelligente des changements pour le diff par rapport à `origin/main`. Elle exécute le travail core avec les voies de test core, le travail d’extension avec les voies de test d’extension, le travail test-only avec uniquement typecheck/tests des tests, et étend les modifications du Plugin SDK public ou des contrats de Plugin à la validation des extensions.
- `pnpm test` : route les cibles explicites fichier/répertoire via les voies Vitest ciblées. Les exécutions sans cible utilisent des groupes de fragments fixes et se développent en configurations feuilles pour l’exécution parallèle locale ; le groupe d’extensions se développe toujours en configurations de fragments par extension au lieu d’un énorme processus unique de projet racine.
- Les exécutions complètes et par fragments d’extension mettent à jour les données locales de timing dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures utilisent ces timings pour équilibrer les fragments lents et rapides. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact local de timing.
- Certains fichiers de test `plugin-sdk` et `commands` passent désormais par des voies légères dédiées qui ne conservent que `test/setup.ts`, laissant les cas lourds en runtime sur leurs voies existantes.
- Certains fichiers source d’aide `plugin-sdk` et `commands` mappent aussi `pnpm test:changed` vers des tests frères explicites dans ces voies légères, afin que de petites modifications d’aide évitent de relancer les suites lourdes adossées au runtime.
- `auto-reply` est désormais aussi divisé en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/jeton/aide de premier niveau.
- La configuration Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec l’exécuteur partagé non isolé activé sur les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les fragments d’extension/Plugin. Les extensions de canal lourdes et OpenAI s’exécutent comme fragments dédiés ; les autres groupes d’extensions restent regroupés. Utilisez `pnpm test extensions/<id>` pour une voie de Plugin fourni unique.
- `pnpm test:perf:imports` : active les rapports Vitest de durée d’import + ventilation des imports, tout en utilisant toujours le routage par voie ciblée pour les cibles explicites fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mesure le chemin changed-mode routé par rapport à l’exécution native du projet racine pour le même diff git validé.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’ensemble des modifications de l’arbre de travail courant sans devoir valider d’abord.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + tas pour l’exécuteur unitaire (`.artifacts/vitest-runner-profile`).
- Intégration Gateway : opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke end-to-end de la gateway (multi-instance WS/HTTP/appairage de nœud). Utilise par défaut `threads` + `isolate: false` avec workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux verbeux.
- `pnpm test:live` : exécute les tests live des fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au fournisseur) pour ne plus être ignoré.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI conteneurisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), télécharge une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway amorcé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversation routée, les lectures de transcription, les métadonnées de pièce jointe, le comportement de la file d’événements live, le routage des envois sortants, et les notifications de type canal + autorisation à la manière de Claude sur le vrai pont stdio. L’assertion de notification Claude lit directement les trames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.

## Barrière PR locale

Pour les vérifications locales de barrière/atterrissage PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` devient instable sur un hôte chargé, relancez une fois avant de le considérer comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire contrainte, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latence de modèle (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables d’environnement facultatives : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : « Reply with a single word: ok. No punctuation or extra text. »

Dernière exécution (2025-12-31, 20 exécutions) :

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

Presets :

- `startup` : `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real` : `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all` : les deux presets

La sortie inclut `sampleCount`, avg, p50, p95, min/max, la distribution exit-code/signal, ainsi que des résumés max RSS pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution afin que le timing et la capture de profil utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de suite complète dans `.artifacts/cli-startup-bench-all.json` en utilisant `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise la fixture de référence versionnée dans `test/fixtures/cli-startup-bench.json` en utilisant `runs=5` et `warmup=1`

Fixture versionnée :

- `test/fixtures/cli-startup-bench.json`
- Actualisez-la avec `pnpm test:startup:bench:update`
- Comparez les résultats courants à la fixture avec `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker est facultatif ; ceci n’est nécessaire que pour les tests smoke d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de config/espace de travail/session, puis démarre la gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que `qrcode-terminal` se charge sous les runtimes Node Docker pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```
