---
read_when:
    - Vous souhaitez une recherche web alimentée par Tavily
    - Vous avez besoin d’une clé API Tavily
    - Vous souhaitez Tavily comme fournisseur `web_search`
    - Vous souhaitez extraire le contenu depuis des URL
summary: Outils de recherche et d’extraction Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-24T07:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 15
---

OpenClaw peut utiliser **Tavily** de deux façons :

- comme fournisseur `web_search`
- comme outils de Plugin explicites : `tavily_search` et `tavily_extract`

Tavily est une API de recherche conçue pour les applications IA, qui renvoie des résultats structurés
optimisés pour la consommation par les LLM. Elle prend en charge une profondeur de recherche configurable, le
filtrage par sujet, les filtres de domaine, les résumés de réponses générés par IA, et l’extraction de contenu
depuis des URL (y compris des pages rendues en JavaScript).

## Obtenir une clé API

1. Créez un compte Tavily sur [tavily.com](https://tavily.com/).
2. Générez une clé API dans le tableau de bord.
3. Stockez-la dans la configuration ou définissez `TAVILY_API_KEY` dans l’environnement du gateway.

## Configurer la recherche Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Remarques :

- Choisir Tavily dans l’onboarding ou `openclaw configure --section web` active
  automatiquement le Plugin Tavily groupé.
- Stockez la configuration Tavily sous `plugins.entries.tavily.config.webSearch.*`.
- `web_search` avec Tavily prend en charge `query` et `count` (jusqu’à 20 résultats).
- Pour les contrôles spécifiques à Tavily comme `search_depth`, `topic`, `include_answer`,
  ou les filtres de domaine, utilisez `tavily_search`.

## Outils de Plugin Tavily

### `tavily_search`

Utilisez-le lorsque vous voulez des contrôles de recherche spécifiques à Tavily au lieu de
`web_search` générique.

| Paramètre         | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `query`           | Chaîne de requête de recherche (à garder sous 400 caractères)        |
| `search_depth`    | `basic` (par défaut, équilibré) ou `advanced` (pertinence maximale, plus lent) |
| `topic`           | `general` (par défaut), `news` (mises à jour en temps réel), ou `finance` |
| `max_results`     | Nombre de résultats, 1-20 (par défaut : 5)                           |
| `include_answer`  | Inclure un résumé de réponse généré par IA (par défaut : false)      |
| `time_range`      | Filtrer par récence : `day`, `week`, `month`, ou `year`              |
| `include_domains` | Tableau de domaines auxquels restreindre les résultats               |
| `exclude_domains` | Tableau de domaines à exclure des résultats                          |

**Profondeur de recherche :**

| Profondeur | Vitesse | Pertinence | Idéal pour                          |
| ---------- | ------- | ---------- | ----------------------------------- |
| `basic`    | Plus rapide | Élevée  | Requêtes généralistes (par défaut)  |
| `advanced` | Plus lent | Maximale | Précision, faits spécifiques, recherche |

### `tavily_extract`

Utilisez-le pour extraire un contenu propre depuis une ou plusieurs URL. Gère
les pages rendues en JavaScript et prend en charge le découpage centré sur la requête pour une
extraction ciblée.

| Paramètre           | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `urls`              | Tableau d’URL à extraire (1-20 par requête)                |
| `query`             | Reranker les fragments extraits par pertinence pour cette requête |
| `extract_depth`     | `basic` (par défaut, rapide) ou `advanced` (pour les pages riches en JS) |
| `chunks_per_source` | Fragments par URL, 1-5 (exige `query`)                     |
| `include_images`    | Inclure les URL d’image dans les résultats (par défaut : false) |

**Profondeur d’extraction :**

| Profondeur | Quand l’utiliser                              |
| ---------- | --------------------------------------------- |
| `basic`    | Pages simples - essayez d’abord celle-ci      |
| `advanced` | SPA rendues en JS, contenu dynamique, tableaux |

Conseils :

- Maximum 20 URL par requête. Répartissez les listes plus longues en plusieurs appels.
- Utilisez `query` + `chunks_per_source` pour n’obtenir que le contenu pertinent au lieu des pages complètes.
- Essayez d’abord `basic` ; revenez à `advanced` si le contenu est absent ou incomplet.

## Choisir le bon outil

| Besoin                               | Outil            |
| ------------------------------------ | ---------------- |
| Recherche web rapide, sans options spéciales | `web_search`     |
| Recherche avec profondeur, sujet, réponses IA | `tavily_search`  |
| Extraire du contenu depuis des URL spécifiques | `tavily_extract` |

## Voir aussi

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et l’auto-détection
- [Firecrawl](/fr/tools/firecrawl) -- recherche + scraping avec extraction de contenu
- [Exa Search](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
