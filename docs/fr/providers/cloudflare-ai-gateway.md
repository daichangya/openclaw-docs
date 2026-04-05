---
read_when:
    - Vous souhaitez utiliser Cloudflare AI Gateway avec OpenClaw
    - Vous avez besoin de l'ID de compte, de l'ID de gateway ou de la variable d'environnement de clé API
summary: Configuration de Cloudflare AI Gateway (authentification + sélection du modèle)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-05T12:51:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway se place devant les API des fournisseurs et vous permet d'ajouter de l'analytique, du cache et des contrôles. Pour Anthropic, OpenClaw utilise l'API Anthropic Messages via votre point de terminaison Gateway.

- Fournisseur : `cloudflare-ai-gateway`
- URL de base : `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Modèle par défaut : `cloudflare-ai-gateway/claude-sonnet-4-5`
- Clé API : `CLOUDFLARE_AI_GATEWAY_API_KEY` (votre clé API fournisseur pour les requêtes passant par la gateway)

Pour les modèles Anthropic, utilisez votre clé API Anthropic.

## Démarrage rapide

1. Définissez la clé API du fournisseur et les détails de la gateway :

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Gateways authentifiées

Si vous avez activé l'authentification Gateway dans Cloudflare, ajoutez l'en-tête `cf-aig-authorization` (en plus de votre clé API fournisseur).

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## Remarque sur l'environnement

Si la gateway s'exécute comme daemon (launchd/systemd), assurez-vous que `CLOUDFLARE_AI_GATEWAY_API_KEY` est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).
