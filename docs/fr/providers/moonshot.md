---
read_when:
    - Vous voulez configurer Moonshot K2 (Moonshot Open Platform) ou Kimi Coding
    - Vous devez comprendre les points de terminaison, clés et références de modèle séparés
    - Vous voulez une configuration prête à copier-coller pour l’un ou l’autre fournisseur
summary: Configurer Moonshot K2 vs Kimi Coding (fournisseurs + clés séparés)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-05T12:52:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80c71ef432b778e296bd60b7d9ec7c72d025d13fd9bdae474b3d58436d15695
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot fournit l’API Kimi avec des points de terminaison compatibles OpenAI. Configurez le
fournisseur et définissez le modèle par défaut sur `moonshot/kimi-k2.5`, ou utilisez
Kimi Coding avec `kimi/kimi-code`.

ID actuels des modèles Kimi K2 :

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
- `kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
openclaw onboard --auth-choice moonshot-api-key
# ou
openclaw onboard --auth-choice moonshot-api-key-cn
```

Kimi Coding :

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

Remarque : Moonshot et Kimi Coding sont des fournisseurs distincts. Les clés ne sont pas interchangeables, les points de terminaison diffèrent et les références de modèle diffèrent (Moonshot utilise `moonshot/...`, Kimi Coding utilise `kimi/...`).

La recherche web Kimi utilise aussi le plugin Moonshot :

```bash
openclaw configure --section web
```

Choisissez **Kimi** dans la section de recherche web pour stocker
`plugins.entries.moonshot.config.webSearch.*`.

## Extrait de configuration (API Moonshot)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        // moonshot-kimi-k2-aliases:start
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
        "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
        "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
        "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
        // moonshot-kimi-k2-aliases:end
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          // moonshot-kimi-k2-models:start
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-thinking",
            name: "Kimi K2 Thinking",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-thinking-turbo",
            name: "Kimi K2 Thinking Turbo",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-turbo",
            name: "Kimi K2 Turbo",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 16384,
          },
          // moonshot-kimi-k2-models:end
        ],
      },
    },
  },
}
```

## Kimi Coding

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: {
        "kimi/kimi-code": { alias: "Kimi" },
      },
    },
  },
}
```

## Recherche web Kimi

OpenClaw inclut aussi **Kimi** comme fournisseur `web_search`, adossé à la recherche web Moonshot.

La configuration interactive peut demander :

- la région de l’API Moonshot :
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- le modèle de recherche web Kimi par défaut (par défaut `kimi-k2.5`)

La configuration se trouve sous `plugins.entries.moonshot.config.webSearch` :

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // ou utilisez KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Remarques

- Les références de modèle Moonshot utilisent `moonshot/<modelId>`. Les références de modèle Kimi Coding utilisent `kimi/<modelId>`.
- La référence de modèle par défaut actuelle pour Kimi Coding est `kimi/kimi-code`. L’ancien `kimi/k2p5` reste accepté comme identifiant de modèle de compatibilité.
- La recherche web Kimi utilise `KIMI_API_KEY` ou `MOONSHOT_API_KEY`, et utilise par défaut `https://api.moonshot.ai/v1` avec le modèle `kimi-k2.5`.
- Les points de terminaison natifs Moonshot (`https://api.moonshot.ai/v1` et
  `https://api.moonshot.cn/v1`) annoncent une compatibilité d’usage streamé sur le
  transport partagé `openai-completions`. OpenClaw s’appuie désormais sur les capacités du point de terminaison pour cela, de sorte que les ID de fournisseur personnalisés compatibles ciblant les mêmes hôtes Moonshot natifs héritent du même comportement d’usage streamé.
- Remplacez la tarification et les métadonnées de contexte dans `models.providers` si nécessaire.
- Si Moonshot publie des limites de contexte différentes pour un modèle, ajustez
  `contextWindow` en conséquence.
- Utilisez `https://api.moonshot.ai/v1` pour le point de terminaison international, et `https://api.moonshot.cn/v1` pour le point de terminaison Chine.
- Choix d’onboarding :
  - `moonshot-api-key` pour `https://api.moonshot.ai/v1`
  - `moonshot-api-key-cn` pour `https://api.moonshot.cn/v1`

## Mode thinking natif (Moonshot)

Moonshot Kimi prend en charge un thinking natif binaire :

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Configurez-le par modèle via `agents.defaults.models.<provider/model>.params` :

```json5
{
  agents: {
    defaults: {
      models: {
        "moonshot/kimi-k2.5": {
          params: {
            thinking: { type: "disabled" },
          },
        },
      },
    },
  },
}
```

OpenClaw mappe aussi les niveaux runtime `/think` pour Moonshot :

- `/think off` -> `thinking.type=disabled`
- tout niveau de thinking différent de off -> `thinking.type=enabled`

Lorsque le thinking Moonshot est activé, `tool_choice` doit être `auto` ou `none`. OpenClaw normalise les valeurs `tool_choice` incompatibles vers `auto` pour des raisons de compatibilité.
