---
read_when:
    - Vous souhaitez exécuter OpenClaw avec un serveur local vLLM
    - Vous souhaitez utiliser des points de terminaison `/v1` compatibles OpenAI avec vos propres modèles
summary: Exécuter OpenClaw avec vLLM (serveur local compatible OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-05T12:52:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebde34d0453586d10340680b8d51465fdc98bd28e8a96acfaeb24606886b50f4
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM peut servir des modèles open source (et certains modèles personnalisés) via une API HTTP **compatible OpenAI**. OpenClaw peut se connecter à vLLM en utilisant l'API `openai-completions`.

OpenClaw peut aussi **découvrir automatiquement** les modèles disponibles depuis vLLM lorsque vous activez cette option avec `VLLM_API_KEY` (n'importe quelle valeur fonctionne si votre serveur n'applique pas d'authentification) et que vous ne définissez pas d'entrée explicite `models.providers.vllm`.

## Démarrage rapide

1. Démarrez vLLM avec un serveur compatible OpenAI.

Votre URL de base doit exposer les points de terminaison `/v1` (par ex. `/v1/models`, `/v1/chat/completions`). vLLM s'exécute généralement sur :

- `http://127.0.0.1:8000/v1`

2. Activez l'option (n'importe quelle valeur fonctionne si aucune authentification n'est configurée) :

```bash
export VLLM_API_KEY="vllm-local"
```

3. Sélectionnez un modèle (remplacez par l'un de vos IDs de modèle vLLM) :

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Découverte de modèles (fournisseur implicite)

Lorsque `VLLM_API_KEY` est défini (ou qu'un profil d'authentification existe) et que vous **ne** définissez **pas** `models.providers.vllm`, OpenClaw interroge :

- `GET http://127.0.0.1:8000/v1/models`

…et convertit les IDs renvoyés en entrées de modèle.

Si vous définissez explicitement `models.providers.vllm`, la découverte automatique est ignorée et vous devez définir les modèles manuellement.

## Configuration explicite (modèles manuels)

Utilisez une configuration explicite lorsque :

- vLLM s'exécute sur un autre hôte/port.
- Vous souhaitez épingler les valeurs `contextWindow`/`maxTokens`.
- Votre serveur nécessite une vraie clé API (ou vous souhaitez contrôler les en-têtes).

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Dépannage

- Vérifiez que le serveur est joignable :

```bash
curl http://127.0.0.1:8000/v1/models
```

- Si les requêtes échouent avec des erreurs d'authentification, définissez une vraie `VLLM_API_KEY` correspondant à la configuration de votre serveur, ou configurez explicitement le fournisseur sous `models.providers.vllm`.

## Comportement de type proxy

vLLM est traité comme un backend `/v1` compatible OpenAI de type proxy, et non comme un point de terminaison
OpenAI natif.

- la mise en forme des requêtes spécifique à OpenAI natif ne s'applique pas ici
- pas de `service_tier`, pas de `store` Responses, pas d'indications de cache de prompt, et pas de mise en forme de charge utile de compatibilité de raisonnement OpenAI
- les en-têtes d'attribution cachés OpenClaw (`originator`, `version`, `User-Agent`) ne sont pas injectés sur des URLs de base vLLM personnalisées
