---
read_when:
    - Vous voulez servir des modèles depuis votre propre machine GPU
    - Vous connectez LM Studio ou un proxy compatible OpenAI
    - Vous avez besoin des conseils les plus sûrs pour les modèles locaux
summary: Exécuter OpenClaw sur des LLM locaux (LM Studio, vLLM, LiteLLM, points de terminaison OpenAI personnalisés)
title: Modèles locaux
x-i18n:
    generated_at: "2026-04-24T07:11:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

Le local est possible, mais OpenClaw s’attend à un grand contexte et à de fortes défenses contre l’injection de prompt. Les petites cartes tronquent le contexte et affaiblissent la sécurité. Visez haut : **≥2 Mac Studio au maximum ou une machine GPU équivalente (~30 k$+)**. Un seul GPU de **24 GB** ne fonctionne que pour des prompts plus légers avec une latence plus élevée. Utilisez la **variante de modèle la plus grande / taille complète que vous pouvez exécuter** ; les checkpoints fortement quantifiés ou « small » augmentent le risque d’injection de prompt (voir [Sécurité](/fr/gateway/security)).

Si vous voulez la configuration locale la plus simple, commencez par [LM Studio](/fr/providers/lmstudio) ou [Ollama](/fr/providers/ollama) et `openclaw onboard`. Cette page est le guide orienté pour des piles locales haut de gamme et des serveurs locaux personnalisés compatibles OpenAI.

## Recommandé : LM Studio + grand modèle local (API Responses)

Meilleure pile locale actuelle. Chargez un grand modèle dans LM Studio (par exemple une version taille complète de Qwen, DeepSeek ou Llama), activez le serveur local (par défaut `http://127.0.0.1:1234`), et utilisez l’API Responses pour garder le raisonnement séparé du texte final.

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
- Dans LM Studio, téléchargez la **plus grande version de modèle disponible** (évitez les variantes « small » / fortement quantifiées), démarrez le serveur, confirmez que `http://127.0.0.1:1234/v1/models` le liste.
- Remplacez `my-local-model` par l’ID réel du modèle affiché dans LM Studio.
- Gardez le modèle chargé ; le chargement à froid ajoute de la latence au démarrage.
- Ajustez `contextWindow`/`maxTokens` si votre version LM Studio diffère.
- Pour WhatsApp, restez sur l’API Responses afin que seul le texte final soit envoyé.

Conservez les modèles hébergés configurés même lorsque vous exécutez en local ; utilisez `models.mode: "merge"` afin que les modèles de repli restent disponibles.

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

### Priorité au local avec filet de sécurité hébergé

Inversez l’ordre primaire/repli ; conservez le même bloc de fournisseurs et `models.mode: "merge"` afin de pouvoir revenir à Sonnet ou Opus lorsque la machine locale est indisponible.

### Hébergement régional / routage des données

- Des variantes hébergées de MiniMax/Kimi/GLM existent aussi sur OpenRouter avec des points de terminaison épinglés par région (par ex. hébergés aux États-Unis). Choisissez la variante régionale là-bas pour garder le trafic dans la juridiction voulue tout en utilisant `models.mode: "merge"` pour les replis Anthropic/OpenAI.
- Le tout-local reste le chemin de confidentialité le plus fort ; le routage régional hébergé est le compromis intermédiaire lorsque vous avez besoin de fonctionnalités fournisseur mais voulez garder le contrôle sur le flux de données.

## Autres proxys locaux compatibles OpenAI

vLLM, LiteLLM, OAI-proxy ou des gateways personnalisés fonctionnent s’ils exposent un point de terminaison `/v1` de style OpenAI. Remplacez le bloc fournisseur ci-dessus par votre point de terminaison et votre ID de modèle :

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

Gardez `models.mode: "merge"` afin que les modèles hébergés restent disponibles comme replis.

Remarque de comportement pour les backends locaux/proxifiés `/v1` :

- OpenClaw les traite comme des routes compatibles OpenAI de type proxy, et non comme
  des points de terminaison OpenAI natifs
- la mise en forme de requêtes propre à OpenAI native ne s’applique pas ici : pas de
  `service_tier`, pas de `store` Responses, pas de mise en forme de charge utile de compatibilité de raisonnement OpenAI,
  et pas d’indices de cache de prompt
- les en-têtes d’attribution OpenClaw cachés (`originator`, `version`, `User-Agent`)
  ne sont pas injectés sur ces URL de proxy personnalisées

Remarques de compatibilité pour les backends compatibles OpenAI plus stricts :

- Certains serveurs n’acceptent que des chaînes dans `messages[].content` sur Chat Completions, et non
  des tableaux structurés de parties de contenu. Définissez
  `models.providers.<provider>.models[].compat.requiresStringContent: true` pour
  ces points de terminaison.
- Certains backends locaux plus petits ou plus stricts sont instables avec la forme complète
  du prompt d’exécution d’agent d’OpenClaw, en particulier lorsque les schémas d’outils sont inclus. Si le
  backend fonctionne pour de petits appels directs `/v1/chat/completions` mais échoue sur des tours normaux
  d’agent OpenClaw, essayez d’abord
  `agents.defaults.experimental.localModelLean: true` pour supprimer des outils par défaut lourds
  comme `browser`, `cron` et `message` ; il s’agit d’un indicateur expérimental, pas d’un paramètre stable de mode par défaut. Voir
  [Fonctionnalités expérimentales](/fr/concepts/experimental-features). Si cela échoue encore, essayez
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Si le backend échoue encore uniquement sur de plus grandes exécutions OpenClaw, le problème restant
  est généralement une limite de capacité du modèle/serveur amont ou un bug du backend, pas la couche de transport d’OpenClaw.

## Dépannage

- Le Gateway peut-il joindre le proxy ? `curl http://127.0.0.1:1234/v1/models`.
- Modèle LM Studio déchargé ? Rechargez-le ; le démarrage à froid est une cause fréquente de « blocage ».
- OpenClaw avertit lorsque la fenêtre de contexte détectée est inférieure à **32k** et bloque en dessous de **16k**. Si vous atteignez cette vérification préalable, augmentez la limite de contexte du serveur/modèle ou choisissez un modèle plus grand.
- Erreurs de contexte ? Réduisez `contextWindow` ou augmentez la limite de votre serveur.
- Le serveur compatible OpenAI renvoie `messages[].content ... expected a string` ?
  Ajoutez `compat.requiresStringContent: true` sur cette entrée de modèle.
- Les petits appels directs `/v1/chat/completions` fonctionnent, mais `openclaw infer model run`
  échoue sur Gemma ou un autre modèle local ? Désactivez d’abord les schémas d’outils avec
  `compat.supportsTools: false`, puis retestez. Si le serveur plante encore uniquement
  sur de plus grands prompts OpenClaw, traitez cela comme une limitation du modèle/serveur amont.
- Sécurité : les modèles locaux ignorent les filtres côté fournisseur ; gardez les agents limités et la Compaction activée afin de réduire le rayon d’impact d’une injection de prompt.

## Lié

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Basculement de modèle](/fr/concepts/model-failover)
