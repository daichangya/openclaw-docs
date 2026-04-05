---
read_when:
    - Vous voulez exécuter OpenClaw sur un serveur SGLang local
    - Vous voulez des points de terminaison `/v1` compatibles OpenAI avec vos propres modèles
summary: Exécuter OpenClaw avec SGLang (serveur autohébergé compatible OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-05T12:52:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9850277c6c5e318e60237688b4d8a5b1387d4e9586534ae2eb6ad953abba8948
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang peut servir des modèles open source via une API HTTP **compatible OpenAI**.
OpenClaw peut se connecter à SGLang en utilisant l’API `openai-completions`.

OpenClaw peut également **découvrir automatiquement** les modèles disponibles depuis SGLang lorsque vous
activez cette option avec `SGLANG_API_KEY` (n’importe quelle valeur fonctionne si votre serveur n’impose pas d’authentification)
et que vous ne définissez pas d’entrée explicite `models.providers.sglang`.

## Démarrage rapide

1. Démarrez SGLang avec un serveur compatible OpenAI.

Votre URL de base doit exposer des points de terminaison `/v1` (par exemple `/v1/models`,
`/v1/chat/completions`). SGLang s’exécute souvent sur :

- `http://127.0.0.1:30000/v1`

2. Activez l’option (n’importe quelle valeur fonctionne si aucune authentification n’est configurée) :

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Exécutez l’onboarding et choisissez `SGLang`, ou définissez directement un modèle :

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## Découverte de modèles (fournisseur implicite)

Lorsque `SGLANG_API_KEY` est défini (ou qu’un profil d’authentification existe) et que vous **ne**
définissez pas `models.providers.sglang`, OpenClaw interrogera :

- `GET http://127.0.0.1:30000/v1/models`

et convertira les ID renvoyés en entrées de modèle.

Si vous définissez explicitement `models.providers.sglang`, la découverte automatique est ignorée et
vous devez définir les modèles manuellement.

## Configuration explicite (modèles manuels)

Utilisez une configuration explicite lorsque :

- SGLang s’exécute sur un autre hôte/port.
- Vous voulez épingler les valeurs `contextWindow`/`maxTokens`.
- Votre serveur exige une vraie clé API (ou vous voulez contrôler les en-têtes).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
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
curl http://127.0.0.1:30000/v1/models
```

- Si les requêtes échouent avec des erreurs d’authentification, définissez une vraie `SGLANG_API_KEY` qui correspond
  à la configuration de votre serveur, ou configurez explicitement le fournisseur sous
  `models.providers.sglang`.

## Comportement de type proxy

SGLang est traité comme un backend `/v1` de type proxy compatible OpenAI, pas comme un
point de terminaison OpenAI natif.

- le façonnage de requête propre à OpenAI ne s’applique pas ici
- pas de `service_tier`, pas de `store` Responses, pas d’indications de cache de prompt, et pas
  de façonnage de charge utile de compatibilité de raisonnement OpenAI
- les en-têtes d’attribution cachés OpenClaw (`originator`, `version`, `User-Agent`)
  ne sont pas injectés sur les URL de base SGLang personnalisées
