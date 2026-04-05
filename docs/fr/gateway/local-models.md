---
read_when:
    - Vous souhaitez servir des modèles depuis votre propre machine GPU
    - Vous connectez LM Studio ou un proxy compatible OpenAI
    - Vous avez besoin des conseils les plus sûrs pour les modèles locaux
summary: Exécuter OpenClaw sur des LLM locaux (LM Studio, vLLM, LiteLLM, points de terminaison OpenAI personnalisés)
title: Modèles locaux
x-i18n:
    generated_at: "2026-04-05T12:42:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b99c8fb57f65c0b765fc75bd36933221b5aeb94c4a3f3428f92640ae064f8b6
    source_path: gateway/local-models.md
    workflow: 15
---

# Modèles locaux

Le local est possible, mais OpenClaw attend un grand contexte + de fortes défenses contre l’injection de prompt. Les petites cartes tronquent le contexte et affaiblissent la sécurité. Visez haut : **≥2 Mac Studios entièrement équipés ou une machine GPU équivalente (~30k$+)**. Un seul GPU de **24 GB** ne fonctionne que pour des prompts plus légers avec une latence plus élevée. Utilisez la **variante de modèle la plus grande / en taille complète que vous pouvez exécuter** ; les checkpoints fortement quantifiés ou « small » augmentent le risque d’injection de prompt (voir [Sécurité](/gateway/security)).

Si vous voulez la configuration locale la plus simple, commencez par [Ollama](/providers/ollama) et `openclaw onboard`. Cette page est le guide orienté pour les piles locales haut de gamme et les serveurs locaux personnalisés compatibles OpenAI.

## Recommandé : LM Studio + grand modèle local (Responses API)

Meilleure pile locale actuelle. Chargez un grand modèle dans LM Studio (par exemple, une version complète de Qwen, DeepSeek ou Llama), activez le serveur local (par défaut `http://127.0.0.1:1234`), et utilisez Responses API pour séparer le raisonnement du texte final.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Checklist de configuration**

- Installez LM Studio : [https://lmstudio.ai](https://lmstudio.ai)
- Dans LM Studio, téléchargez la **plus grande version de modèle disponible** (évitez les variantes « small »/fortement quantifiées), démarrez le serveur, vérifiez que `http://127.0.0.1:1234/v1/models` le liste.
- Remplacez `my-local-model` par l’ID réel du modèle affiché dans LM Studio.
- Gardez le modèle chargé ; un chargement à froid ajoute de la latence au démarrage.
- Ajustez `contextWindow`/`maxTokens` si votre build LM Studio diffère.
- Pour WhatsApp, restez sur Responses API afin que seul le texte final soit envoyé.

Gardez les modèles hébergés configurés même lorsque vous exécutez en local ; utilisez `models.mode: "merge"` afin que les replis restent disponibles.

### Configuration hybride : primaire hébergé, repli local

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Local en priorité avec filet de sécurité hébergé

Inversez l’ordre du primaire et du repli ; conservez le même bloc providers et `models.mode: "merge"` afin de pouvoir retomber sur Sonnet ou Opus lorsque la machine locale est indisponible.

### Hébergement régional / routage des données

- Des variantes MiniMax/Kimi/GLM hébergées existent aussi sur OpenRouter avec des points de terminaison épinglés par région (par ex., hébergés aux États-Unis). Choisissez la variante régionale là-bas pour conserver le trafic dans la juridiction choisie tout en utilisant `models.mode: "merge"` pour les replis Anthropic/OpenAI.
- Le local uniquement reste la voie la plus protectrice pour la confidentialité ; le routage régional hébergé est l’option intermédiaire lorsque vous avez besoin de fonctionnalités du fournisseur mais souhaitez garder le contrôle sur le flux de données.

## Autres proxys locaux compatibles OpenAI

vLLM, LiteLLM, OAI-proxy ou des gateways personnalisées fonctionnent s’ils exposent un point de terminaison `/v1` de style OpenAI. Remplacez le bloc provider ci-dessus par votre point de terminaison et votre ID de modèle :

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Conservez `models.mode: "merge"` afin que les modèles hébergés restent disponibles comme replis.

Remarque de comportement pour les backends locaux/proxifiés `/v1` :

- OpenClaw les traite comme des routes compatibles OpenAI de type proxy, et non comme des points de terminaison OpenAI natifs
- le façonnage de requête réservé à OpenAI natif ne s’applique pas ici : pas de
  `service_tier`, pas de `store` Responses, pas de façonnage de charge utile de compatibilité de raisonnement OpenAI, et pas d’indices de cache de prompt
- les en-têtes d’attribution OpenClaw cachés (`originator`, `version`, `User-Agent`)
  ne sont pas injectés sur ces URL de proxy personnalisées

## Dépannage

- Gateway peut-il atteindre le proxy ? `curl http://127.0.0.1:1234/v1/models`.
- Modèle LM Studio déchargé ? Rechargez-le ; le démarrage à froid est une cause fréquente de « blocage ».
- Erreurs de contexte ? Réduisez `contextWindow` ou augmentez la limite de votre serveur.
- Sécurité : les modèles locaux contournent les filtres côté fournisseur ; gardez des agents étroits et la compaction activée pour limiter le rayon d’explosion de l’injection de prompt.
