---
read_when:
    - Vous voulez une seule clé API pour de nombreux LLM
    - Vous voulez exécuter des modèles via Kilo Gateway dans OpenClaw
summary: Utiliser l’API unifiée de Kilo Gateway pour accéder à de nombreux modèles dans OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-04-05T12:51:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 857266967b4a7553d501990631df2bae0f849d061521dc9f34e29687ecb94884
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway fournit une **API unifiée** qui route les requêtes vers de nombreux modèles derrière un seul
point de terminaison et une seule clé API. Elle est compatible OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant simplement l’URL de base.

## Obtenir une clé API

1. Allez sur [app.kilo.ai](https://app.kilo.ai)
2. Connectez-vous ou créez un compte
3. Accédez à API Keys et générez une nouvelle clé

## Configuration CLI

```bash
openclaw onboard --auth-choice kilocode-api-key
```

Ou définissez la variable d’environnement :

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## Extrait de configuration

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Modèle par défaut

Le modèle par défaut est `kilocode/kilo/auto`, un modèle de routage intelligent détenu par le fournisseur
et géré par Kilo Gateway.

OpenClaw traite `kilocode/kilo/auto` comme la référence par défaut stable, mais ne
publie pas de correspondance documentée entre tâches et modèles amont pour cette route.

## Modèles disponibles

OpenClaw découvre dynamiquement les modèles disponibles depuis Kilo Gateway au démarrage. Utilisez
`/models kilocode` pour voir la liste complète des modèles disponibles avec votre compte.

Tout modèle disponible sur la gateway peut être utilisé avec le préfixe `kilocode/` :

```
kilocode/kilo/auto              (par défaut - routage intelligent)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...et bien d'autres
```

## Remarques

- Les références de modèle sont `kilocode/<model-id>` (par exemple, `kilocode/anthropic/claude-sonnet-4`).
- Modèle par défaut : `kilocode/kilo/auto`
- Base URL : `https://api.kilo.ai/api/gateway/`
- Le catalogue de repli intégré inclut toujours `kilocode/kilo/auto` (`Kilo Auto`) avec
  `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`,
  et `maxTokens: 128000`
- Au démarrage, OpenClaw essaie `GET https://api.kilo.ai/api/gateway/models` et
  fusionne les modèles découverts avant le catalogue statique de repli
- Le routage amont exact derrière `kilocode/kilo/auto` est géré par Kilo Gateway,
  et non codé en dur dans OpenClaw
- Kilo Gateway est documentée dans le code source comme compatible OpenRouter, elle reste donc
  sur le chemin compatible OpenAI de type proxy plutôt que sur le façonnage natif des requêtes OpenAI
- Les références Kilo adossées à Gemini restent sur le chemin proxy-Gemini, donc OpenClaw conserve
  la sanitation des thought-signatures Gemini sans activer la validation native de relecture Gemini
  ni les réécritures bootstrap.
- L’enveloppe de stream partagée de Kilo ajoute l’en-tête d’application fournisseur et normalise
  les charges utiles de raisonnement proxy pour les références de modèles concrets prises en charge. `kilocode/kilo/auto`
  et d’autres indices ne prenant pas en charge le raisonnement proxy ignorent cette injection de raisonnement.
- Pour plus d’options de modèles/fournisseurs, voir [/concepts/model-providers](/concepts/model-providers).
- Kilo Gateway utilise en interne un Bearer token avec votre clé API.
