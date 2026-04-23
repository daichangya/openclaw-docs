---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (Vitest) et quand utiliser les modes force/coverage
title: Tests
x-i18n:
    generated_at: "2026-04-23T14:02:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# Tests

- Kit de test complet (suites, live, Docker) : [Testing](/fr/help/testing)

- `pnpm test:force` : tue tout processus Gateway persistant qui occupe le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port Gateway isolé afin que les tests serveur n’entrent pas en collision avec une instance en cours d’exécution. Utilisez cette commande lorsqu’une exécution précédente de la Gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unit avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une barrière de couverture unitaire sur les fichiers chargés, et non d’une couverture globale de tous les fichiers du dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et 55 % pour les branches. Comme `coverage.all` vaut false, la barrière mesure les fichiers chargés par la suite de couverture unit au lieu de considérer chaque fichier source des lanes découpées comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unit uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : développe les chemins git modifiés en lanes Vitest ciblées lorsque le diff ne touche que des fichiers source/test routables. Les modifications de configuration/setup reviennent toujours à l’exécution native des projets racine afin que les changements de câblage relancent largement lorsque c’est nécessaire.
- `pnpm changed:lanes` : affiche les lanes d’architecture déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute la barrière intelligente pour les changements du diff par rapport à `origin/main`. Elle exécute le travail core avec les lanes de test core, le travail des extensions avec les lanes de test des extensions, le travail uniquement test avec uniquement le typecheck/tests des tests, étend les changements publics de SDK Plugin ou de contrat de plugin à la validation des extensions, et maintient les vérifications ciblées de version/configuration/dépendances racine pour les simples bumps de version de métadonnées de release.
- `pnpm test` : route les cibles explicites de fichier/répertoire via des lanes Vitest ciblées. Les exécutions sans cible utilisent des groupes de shards fixes et s’étendent aux configurations leaf pour une exécution parallèle locale ; le groupe des extensions s’étend toujours aux configurations shard par extension/plugin au lieu d’un seul énorme processus de projet racine.
- Les exécutions complètes et celles des shards d’extensions mettent à jour les données locales de timing dans `.artifacts/vitest-shard-timings.json` ; les exécutions suivantes utilisent ces timings pour équilibrer les shards lents et rapides. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact de timing local.
- Certains fichiers de test `plugin-sdk` et `commands` passent désormais par des lanes légères dédiées qui ne conservent que `test/setup.ts`, laissant les cas lourds à l’exécution sur leurs lanes existantes.
- Certains fichiers source helper de `plugin-sdk` et `commands` font aussi correspondre `pnpm test:changed` à des tests siblings explicites dans ces lanes légères, afin que de petites modifications de helper évitent de relancer les suites lourdes adossées à l’exécution.
- `auto-reply` est désormais également découpé en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/jeton/helper de niveau supérieur.
- La configuration Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec le runner partagé non isolé activé dans les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extensions/plugins. Les extensions de canaux lourdes et OpenAI s’exécutent comme shards dédiés ; les autres groupes d’extensions restent groupés. Utilisez `pnpm test extensions/<id>` pour une lane de Plugin fourni avec le bundle.
- `pnpm test:perf:imports` : active le reporting Vitest sur la durée d’import + le détail des imports, tout en utilisant le routage par lane ciblée pour les cibles explicites de fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mesure le chemin routé en mode changed par rapport à l’exécution native des projets racine pour le même diff git validé.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’ensemble actuel de modifications du worktree sans commit préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unit (`.artifacts/vitest-runner-profile`).
- Intégration Gateway : opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke end-to-end de la Gateway (appairage multi-instance WS/HTTP/node). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux détaillés.
- `pnpm test:live` : exécute les tests live des fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au fournisseur) pour désactiver le skip.
- `pnpm test:docker:all` : construit une seule fois l’image partagée de test live et l’image Docker E2E, puis exécute les lanes smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` avec une concurrence de 4 par défaut. Ajustez avec `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. Le runner arrête de planifier de nouvelles lanes mutualisées après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque lane a un délai d’expiration de 120 minutes remplaçable via `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Les lanes sensibles au démarrage ou au fournisseur s’exécutent exclusivement après le pool parallèle. Les journaux par lane sont écrits dans `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui` : démarre OpenClaw dockerisé + Open WebUI, ouvre une session via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxyfié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), télécharge une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unit/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway initialisé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversation routée, les lectures de transcription, les métadonnées de pièces jointes, le comportement live de la file d’événements, le routage d’envoi sortant et les notifications de canal + autorisation de style Claude via le vrai pont stdio. L’assertion de notification Claude lit directement les frames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.

## Barrière PR locale

Pour les vérifications locales de landing/barrière PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` flanche sur un hôte chargé, relancez une fois avant de le traiter comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire contrainte, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latence de modèle (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facultatif : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : “Reply with a single word: ok. No punctuation or extra text.”

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

Préréglages :

- `startup` : `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real` : `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all` : les deux préréglages

La sortie inclut `sampleCount`, moyenne, p50, p95, min/max, distribution exit-code/signal et résumés RSS max pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution afin que la mesure de temps et la capture de profils utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` rafraîchit le fixture de référence versionné dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture versionné :

- `test/fixtures/cli-startup-bench.json`
- Rafraîchissez-le avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## E2E d’onboarding (Docker)

Docker est facultatif ; cela n’est nécessaire que pour les tests smoke d’onboarding en conteneur.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de configuration/espace de travail/session, puis démarre la Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que `qrcode-terminal` se charge sous les runtimes Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```
