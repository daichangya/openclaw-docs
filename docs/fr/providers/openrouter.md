---
read_when:
    - Vous voulez une clé API unique pour de nombreux LLM
    - Vous voulez exécuter des modèles via OpenRouter dans OpenClaw
summary: Utiliser l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-05T12:52:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dd354ba060bcb47724c89ae17c8e2af8caecac4bd996fcddb584716c1840b87
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter fournit une **API unifiée** qui route les requêtes vers de nombreux modèles derrière un point de terminaison
unique et une clé API unique. Elle est compatible OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant simplement l’URL de base.

## Configuration CLI

```bash
openclaw onboard --auth-choice openrouter-api-key
```

## Extrait de configuration

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Remarques

- Les références de modèle sont `openrouter/<provider>/<model>`.
- L’onboarding utilise par défaut `openrouter/auto`. Passez plus tard à un modèle concret avec
  `openclaw models set openrouter/<provider>/<model>`.
- Pour plus d’options de modèles/fournisseurs, voir [/concepts/model-providers](/concepts/model-providers).
- OpenRouter utilise en interne un jeton Bearer avec votre clé API.
- Sur les vraies requêtes OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw ajoute également
  les en-têtes documentés d’attribution d’application OpenRouter :
  `HTTP-Referer: https://openclaw.ai`, `X-OpenRouter-Title: OpenClaw`, et
  `X-OpenRouter-Categories: cli-agent`.
- Sur les routes OpenRouter vérifiées, les références de modèle Anthropic conservent également les
  marqueurs `cache_control` Anthropic spécifiques à OpenRouter qu’OpenClaw utilise pour
  une meilleure réutilisation du cache de prompt sur les blocs de prompt système/développeur.
- Si vous redirigez le fournisseur OpenRouter vers un autre proxy/URL de base, OpenClaw
  n’injecte pas ces en-têtes spécifiques à OpenRouter ni les marqueurs de cache Anthropic.
- OpenRouter passe toujours par le chemin de type proxy compatible OpenAI, donc
  le façonnage de requêtes natif propre à OpenAI comme `serviceTier`, `store` de Responses,
  les charges utiles de compatibilité de raisonnement OpenAI, et les indications de cache de prompt ne sont pas retransmis.
- Les références OpenRouter adossées à Gemini restent sur le chemin proxy-Gemini : OpenClaw conserve
  l’assainissement de thought-signature Gemini à cet endroit, mais n’active pas la validation de relecture Gemini native
  ni les réécritures de bootstrap.
- Sur les routes prises en charge non `auto`, OpenClaw mappe le niveau de réflexion sélectionné vers
  les charges utiles de raisonnement proxy OpenRouter. Les indices de modèle non pris en charge et
  `openrouter/auto` ignorent cette injection de raisonnement.
- Si vous passez le routage de fournisseur OpenRouter sous les paramètres du modèle, OpenClaw le retransmet
  comme métadonnées de routage OpenRouter avant l’exécution des enveloppes de flux partagées.
