---
read_when:
    - Vous souhaitez utiliser Kimi pour `web_search`
    - Vous avez besoin d’une `KIMI_API_KEY` ou d’une `MOONSHOT_API_KEY`
summary: Recherche web Kimi via la recherche web Moonshot
title: Recherche Kimi
x-i18n:
    generated_at: "2026-04-05T12:56:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753757a5497a683c35b4509ed3709b9514dc14a45612675d0f729ae6668c82a5
    source_path: tools/kimi-search.md
    workflow: 15
---

# Recherche Kimi

OpenClaw prend en charge Kimi comme fournisseur `web_search`, en utilisant la recherche web Moonshot
pour produire des réponses synthétisées par l’IA avec des citations.

## Obtenir une clé API

<Steps>
  <Step title="Créer une clé">
    Obtenez une clé API auprès de [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Stocker la clé">
    Définissez `KIMI_API_KEY` ou `MOONSHOT_API_KEY` dans l’environnement Gateway, ou
    configurez via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Lorsque vous choisissez **Kimi** pendant `openclaw onboard` ou
`openclaw configure --section web`, OpenClaw peut également demander :

- la région de l’API Moonshot :
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- le modèle de recherche web Kimi par défaut (par défaut `kimi-k2.5`)

## Configuration

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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

Si vous utilisez l’hôte de l’API Chine pour le chat (`models.providers.moonshot.baseUrl` :
`https://api.moonshot.cn/v1`), OpenClaw réutilise ce même hôte pour
`web_search` de Kimi lorsque `tools.web.search.kimi.baseUrl` est omis, afin que les clés de
[platform.moonshot.cn](https://platform.moonshot.cn/) n’atteignent pas par erreur
le point de terminaison international (qui renvoie souvent HTTP 401). Remplacez-le
avec `tools.web.search.kimi.baseUrl` lorsque vous avez besoin d’une URL de base de recherche différente.

**Alternative par variable d’environnement :** définissez `KIMI_API_KEY` ou `MOONSHOT_API_KEY` dans l’environnement
Gateway. Pour une installation Gateway, placez-la dans `~/.openclaw/.env`.

Si vous omettez `baseUrl`, OpenClaw utilise par défaut `https://api.moonshot.ai/v1`.
Si vous omettez `model`, OpenClaw utilise par défaut `kimi-k2.5`.

## Fonctionnement

Kimi utilise la recherche web Moonshot pour synthétiser des réponses avec des citations intégrées,
de manière similaire à l’approche de réponse ancrée de Gemini et Grok.

## Paramètres pris en charge

La recherche Kimi prend en charge `query`.

`count` est accepté pour la compatibilité partagée avec `web_search`, mais Kimi
renvoie toujours une réponse synthétisée avec des citations plutôt qu’une liste de N résultats.

Les filtres spécifiques au fournisseur ne sont pas actuellement pris en charge.

## Lié

- [Vue d’ensemble de la recherche web](/tools/web) -- tous les fournisseurs et la détection automatique
- [Moonshot AI](/fr/providers/moonshot) -- documentation du fournisseur de modèles Moonshot + Kimi Coding
- [Recherche Gemini](/tools/gemini-search) -- réponses synthétisées par l’IA via l’ancrage Google
- [Recherche Grok](/tools/grok-search) -- réponses synthétisées par l’IA via l’ancrage xAI
