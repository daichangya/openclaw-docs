---
read_when:
    - Vous voulez utiliser Vercel AI Gateway avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration de Vercel AI Gateway (authentification + sélection de modèle)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-05T12:52:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30768dc3db49708b25042d317906f7ad9a2c72b0fa03263bc04f5eefbf7a507
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

Le [Vercel AI Gateway](https://vercel.com/ai-gateway) fournit une API unifiée pour accéder à des centaines de modèles via un seul point de terminaison.

- Fournisseur : `vercel-ai-gateway`
- Authentification : `AI_GATEWAY_API_KEY`
- API : compatible Anthropic Messages
- OpenClaw découvre automatiquement le catalogue Gateway `/v1/models`, donc `/models vercel-ai-gateway`
  inclut les références de modèle actuelles comme `vercel-ai-gateway/openai/gpt-5.4`.

## Démarrage rapide

1. Définissez la clé API (recommandé : la stocker pour la Gateway) :

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. Définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Remarque sur l’environnement

Si la Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `AI_GATEWAY_API_KEY`
est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`).

## Raccourci d’ID de modèle

OpenClaw accepte des références de modèle Claude abrégées pour Vercel et les normalise
à l’exécution :

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
