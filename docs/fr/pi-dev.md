---
read_when:
    - Travail sur le code ou les tests d’intégration Pi
    - Exécution des flux Pi spécifiques de lint, typecheck et tests en conditions réelles
summary: 'Flux de développement pour l’intégration Pi : build, test et validation en conditions réelles'
title: Flux de développement Pi
x-i18n:
    generated_at: "2026-04-05T12:47:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# Flux de développement Pi

Ce guide résume un flux de travail raisonnable pour travailler sur l’intégration pi dans OpenClaw.

## Vérification de types et linting

- Garde locale par défaut : `pnpm check`
- Garde de build : `pnpm build` lorsque la modification peut affecter la sortie de build, le packaging ou les frontières de chargement différé/de modules
- Garde complète avant livraison pour les changements fortement liés à Pi : `pnpm check && pnpm test`

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

Pour inclure l’exercice fournisseur en conditions réelles :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Cela couvre les principales suites de tests unitaires Pi :

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Tests manuels

Flux recommandé :

- Exécuter la Gateway en mode dev :
  - `pnpm gateway:dev`
- Déclencher l’agent directement :
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Utiliser le TUI pour le débogage interactif :
  - `pnpm tui`

Pour le comportement des appels d’outils, demandez une action `read` ou `exec` afin de pouvoir voir le streaming des outils et la gestion des charges utiles.

## Réinitialisation complète

L’état se trouve sous le répertoire d’état OpenClaw. Par défaut c’est `~/.openclaw`. Si `OPENCLAW_STATE_DIR` est défini, utilisez ce répertoire à la place.

Pour tout réinitialiser :

- `openclaw.json` pour la configuration
- `agents/<agentId>/agent/auth-profiles.json` pour les profils d’authentification des modèles (clés API + OAuth)
- `credentials/` pour l’état fournisseur/canal qui vit encore en dehors du magasin de profils d’authentification
- `agents/<agentId>/sessions/` pour l’historique de session de l’agent
- `agents/<agentId>/sessions/sessions.json` pour l’index des sessions
- `sessions/` si des chemins hérités existent
- `workspace/` si vous voulez un espace de travail vierge

Si vous voulez seulement réinitialiser les sessions, supprimez `agents/<agentId>/sessions/` pour cet agent. Si vous voulez conserver l’authentification, laissez `agents/<agentId>/agent/auth-profiles.json` et tout état fournisseur sous `credentials/` en place.

## Références

- [Tests](/help/testing)
- [Bien démarrer](/fr/start/getting-started)
