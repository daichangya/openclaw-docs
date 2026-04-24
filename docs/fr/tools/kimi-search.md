---
read_when:
    - Vous souhaitez utiliser Kimi pour `web_search`
    - You need a KIMI_API_KEY or MOONSHOT_API_KEY
summary: Recherche web Kimi via la recherche web Moonshot
title: Recherche Kimi
x-i18n:
    generated_at: "2026-04-24T07:37:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw prend en charge Kimi comme fournisseur `web_search`, en utilisant la recherche web Moonshot
pour produire des réponses synthétisées par IA avec citations.

## Obtenir une clé API

<Steps>
  <Step title="Créer une clé">
    Obtenez une clé API depuis [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Stocker la clé">
    Définissez `KIMI_API_KEY` ou `MOONSHOT_API_KEY` dans l’environnement du Gateway, ou
    configurez via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Lorsque vous choisissez **Kimi** pendant `openclaw onboard` ou
`openclaw configure --section web`, OpenClaw peut aussi demander :

- la région de l’API Moonshot :
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- le modèle par défaut de recherche web Kimi (par défaut `kimi-k2.6`)

## Configuration

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // facultatif si KIMI_API_KEY ou MOONSHOT_API_KEY est défini
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
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

Si vous utilisez l’hôte API Chine pour le chat (`models.providers.moonshot.baseUrl` :
`https://api.moonshot.cn/v1`), OpenClaw réutilise ce même hôte pour Kimi
`web_search` lorsque `tools.web.search.kimi.baseUrl` est omis, afin que les clés issues de
[platform.moonshot.cn](https://platform.moonshot.cn/) ne frappent pas
le point de terminaison international par erreur (qui renvoie souvent HTTP 401). Remplacez cela
avec `tools.web.search.kimi.baseUrl` lorsque vous avez besoin d’une autre base URL de recherche.

**Alternative par environnement :** définissez `KIMI_API_KEY` ou `MOONSHOT_API_KEY` dans l’environnement du
Gateway. Pour une installation gateway, placez-la dans `~/.openclaw/.env`.

Si vous omettez `baseUrl`, OpenClaw utilise par défaut `https://api.moonshot.ai/v1`.
Si vous omettez `model`, OpenClaw utilise par défaut `kimi-k2.6`.

## Fonctionnement

Kimi utilise la recherche web Moonshot pour synthétiser des réponses avec des citations inline,
de façon similaire à l’approche de réponse ancrée de Gemini et Grok.

## Paramètres pris en charge

La recherche Kimi prend en charge `query`.

`count` est accepté pour la compatibilité avec `web_search` partagé, mais Kimi
renvoie toujours une seule réponse synthétisée avec citations plutôt qu’une liste de N résultats.

Les filtres spécifiques au fournisseur ne sont pas actuellement pris en charge.

## Associé

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Moonshot AI](/fr/providers/moonshot) -- documentation du fournisseur Moonshot model + Kimi Coding
- [Gemini Search](/fr/tools/gemini-search) -- réponses synthétisées par IA via l’ancrage Google
- [Grok Search](/fr/tools/grok-search) -- réponses synthétisées par IA via l’ancrage xAI
