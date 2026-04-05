---
read_when:
    - Exécution ou correction des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/coverage
title: Tests
x-i18n:
    generated_at: "2026-04-05T12:54:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78390107a9ac2bdc4294d4d0204467c5efdd98faebaf308f3a4597ab966a6d26
    source_path: reference/test.md
    workflow: 15
---

# Tests

- Kit complet de tests (suites, live, Docker) : [Testing](/help/testing)

- `pnpm test:force` : tue tout processus de passerelle persistant qui retient le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port de passerelle isolé afin que les tests serveur n’entrent pas en collision avec une instance en cours d’exécution. Utilisez cette commande lorsqu’une précédente exécution de la passerelle a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec couverture V8 (via `vitest.unit.config.ts`). Les seuils globaux sont de 70 % pour les lignes/branches/fonctions/instructions. La couverture exclut les points d’entrée riches en intégration (câblage CLI, bridges gateway/telegram, serveur statique webchat) afin de garder la cible centrée sur une logique testable unitairement.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécute la configuration native des projets Vitest avec `--changed origin/main`. La configuration de base traite les fichiers de projets/configuration comme des `forceRerunTriggers`, de sorte que les changements de câblage relancent toujours largement quand nécessaire.
- `pnpm test` : exécute directement la configuration native des projets racine Vitest. Les filtres de fichiers fonctionnent nativement sur les projets configurés.
- La configuration Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec le runner partagé non isolé activé dans toute la configuration du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` exécute `vitest.extensions.config.ts`.
- `pnpm test:extensions` : exécute les suites extension/plugin.
- `pnpm test:perf:imports` : active le rapport de durée des imports + détail des imports de Vitest pour l’exécution native des projets racine.
- `pnpm test:perf:imports:changed` : même profilage d’imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- Intégration de la passerelle : opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke end-to-end de la passerelle (pairage WS/HTTP/nœud multi-instances). Utilise par défaut `threads` + `isolate: false` avec workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux verbeux.
- `pnpm test:live` : exécute les tests live des fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au fournisseur) pour retirer le skip.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dans Docker, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé live de modèle utilisable (par exemple OpenAI dans `~/.profile`), télécharge une image externe Open WebUI, et n’est pas censé être aussi stable en CI que les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway amorcé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte des conversations routées, les lectures de transcription, les métadonnées de pièces jointes, le comportement de file d’événements en direct, le routage des envois sortants, et les notifications de type Claude sur les canaux + autorisations via le vrai bridge stdio. L’assertion de notification Claude lit directement les trames stdio MCP brutes afin que le smoke reflète ce que le bridge émet réellement.

## Porte locale de PR

Pour les vérifications locales de PR avant atterrissage/validation, exécutez :

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` est flaky sur un hôte chargé, relancez une fois avant de considérer cela comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire contrainte, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Bench de latence modèle (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facultatif : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Invite par défaut : « Reply with a single word: ok. No punctuation or extra text. »

Dernière exécution (2025-12-31, 20 exécutions) :

- minimax médiane 1279ms (min 1114, max 2431)
- opus médiane 2454ms (min 1224, max 3170)

## Bench de démarrage CLI

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

La sortie inclut `sampleCount`, moyenne, p50, p95, min/max, distribution code de sortie/signal, et résumés max RSS pour chaque commande. Les options `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution afin que le chronométrage et la capture de profil utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de la suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise la fixture de référence versionnée dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture versionnée :

- `test/fixtures/cli-startup-bench.json`
- Actualisez-la avec `pnpm test:startup:bench:update`
- Comparez les résultats courants à la fixture avec `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker est facultatif ; ce n’est nécessaire que pour les tests smoke d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-TTY, vérifie les fichiers config/workspace/session, puis démarre la passerelle et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que `qrcode-terminal` se charge sous les runtimes Node Docker pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```
