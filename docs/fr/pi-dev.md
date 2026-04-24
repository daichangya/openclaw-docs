---
read_when:
    - Travailler sur le code ou les tests d’intégration Pi
    - Exécuter les flux Pi spécifiques de lint, typecheck et tests en direct
summary: 'Workflow de développement pour l’intégration Pi : build, test et validation en direct'
title: Workflow de développement Pi
x-i18n:
    generated_at: "2026-04-24T07:19:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

Ce guide résume un workflow raisonnable pour travailler sur l’intégration Pi dans OpenClaw.

## Vérification de types et linting

- Contrôle local par défaut : `pnpm check`
- Contrôle de build : `pnpm build` lorsque le changement peut affecter la sortie de build, le packaging ou les limites de lazy-loading/modules
- Contrôle complet avant intégration pour les changements lourds liés à Pi : `pnpm check && pnpm test`

## Exécuter les tests Pi

Exécutez directement l’ensemble de tests centré sur Pi avec Vitest :

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Pour inclure l’exercice du fournisseur en direct :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Cela couvre les principales suites unitaires Pi :

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Tests manuels

Flux recommandé :

- Exécuter le gateway en mode développement :
  - `pnpm gateway:dev`
- Déclencher l’agent directement :
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Utiliser la TUI pour le débogage interactif :
  - `pnpm tui`

Pour le comportement des appels d’outils, demandez une action `read` ou `exec` afin de voir le streaming des outils et la gestion des charges utiles.

## Réinitialisation complète

L’état vit sous le répertoire d’état OpenClaw. La valeur par défaut est `~/.openclaw`. Si `OPENCLAW_STATE_DIR` est défini, utilisez ce répertoire à la place.

Pour tout réinitialiser :

- `openclaw.json` pour la configuration
- `agents/<agentId>/agent/auth-profiles.json` pour les profils d’authentification des modèles (clés API + OAuth)
- `credentials/` pour l’état fournisseur/canal qui vit encore hors du magasin de profils d’authentification
- `agents/<agentId>/sessions/` pour l’historique des sessions de l’agent
- `agents/<agentId>/sessions/sessions.json` pour l’index des sessions
- `sessions/` si des chemins hérités existent
- `workspace/` si vous voulez un espace de travail vide

Si vous voulez seulement réinitialiser les sessions, supprimez `agents/<agentId>/sessions/` pour cet agent. Si vous voulez conserver l’authentification, laissez en place `agents/<agentId>/agent/auth-profiles.json` ainsi que tout état fournisseur sous `credentials/`.

## Références

- [Tests](/fr/help/testing)
- [Bien démarrer](/fr/start/getting-started)

## Associé

- [Architecture de l’intégration Pi](/fr/pi)
