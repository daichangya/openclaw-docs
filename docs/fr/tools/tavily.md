---
read_when:
    - Vous souhaitez une recherche web basée sur Tavily
    - Vous avez besoin d’une clé API Tavily
    - Vous souhaitez utiliser Tavily comme fournisseur `web_search`
    - Vous souhaitez extraire du contenu à partir d’URL
summary: Outils de recherche et d’extraction Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-05T12:57:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: db530cc101dc930611e4ca54e3d5972140f116bfe168adc939dc5752322d205e
    source_path: tools/tavily.md
    workflow: 15
---

# Tavily

OpenClaw peut utiliser **Tavily** de deux façons :

- comme fournisseur `web_search`
- comme outils de plugin explicites : `tavily_search` et `tavily_extract`

Tavily est une API de recherche conçue pour les applications d’IA, qui renvoie des résultats structurés
optimisés pour la consommation par les LLM. Elle prend en charge une profondeur de recherche configurable, le
filtrage par sujet, les filtres de domaine, les résumés de réponse générés par l’IA, ainsi que l’extraction de contenu
à partir d’URL (y compris les pages rendues en JavaScript).

## Obtenir une clé API

1. Créez un compte Tavily sur [tavily.com](https://tavily.com/).
2. Générez une clé API dans le tableau de bord.
3. Stockez-la dans la configuration ou définissez `TAVILY_API_KEY` dans l’environnement de la gateway.

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

Remarques :

- Choisir Tavily dans l’onboarding ou via `openclaw configure --section web` active
  automatiquement le plugin Tavily intégré.
- Stockez la configuration Tavily sous `plugins.entries.tavily.config.webSearch.*`.
- `web_search` avec Tavily prend en charge `query` et `count` (jusqu’à 20 résultats).
- Pour les contrôles spécifiques à Tavily comme `search_depth`, `topic`, `include_answer`,
  ou les filtres de domaine, utilisez `tavily_search`.

## Outils du plugin Tavily

### `tavily_search`

Utilisez-le lorsque vous souhaitez des contrôles de recherche spécifiques à Tavily plutôt que le
`web_search` générique.

| Paramètre         | Description                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| `query`           | Chaîne de requête de recherche (à garder sous 400 caractères)          |
| `search_depth`    | `basic` (par défaut, équilibré) ou `advanced` (pertinence maximale, plus lent) |
| `topic`           | `general` (par défaut), `news` (mises à jour en temps réel) ou `finance` |
| `max_results`     | Nombre de résultats, 1-20 (par défaut : 5)                             |
| `include_answer`  | Inclure un résumé de réponse généré par l’IA (par défaut : false)      |
| `time_range`      | Filtrer par récence : `day`, `week`, `month` ou `year`                 |
| `include_domains` | Tableau de domaines auxquels limiter les résultats                     |
| `exclude_domains` | Tableau de domaines à exclure des résultats                            |

**Profondeur de recherche :**

| Profondeur | Vitesse | Pertinence | Idéal pour                          |
| ---------- | ------- | ---------- | ----------------------------------- |
| `basic`    | Plus rapide | Élevée   | Requêtes générales (par défaut)     |
| `advanced` | Plus lent | Maximale  | Précision, faits spécifiques, recherche |

### `tavily_extract`

Utilisez-le pour extraire du contenu propre à partir d’une ou plusieurs URL. Gère les
pages rendues en JavaScript et prend en charge le découpage orienté requête pour une
extraction ciblée.

| Paramètre           | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `urls`              | Tableau d’URL à extraire (1-20 par requête)                |
| `query`             | Réordonner les segments extraits selon leur pertinence par rapport à cette requête |
| `extract_depth`     | `basic` (par défaut, rapide) ou `advanced` (pour les pages fortement basées sur JS) |
| `chunks_per_source` | Segments par URL, 1-5 (nécessite `query`)                  |
| `include_images`    | Inclure les URL d’image dans les résultats (par défaut : false) |

**Profondeur d’extraction :**

| Profondeur | Quand l’utiliser                             |
| ---------- | -------------------------------------------- |
| `basic`    | Pages simples - à essayer en premier         |
| `advanced` | SPA rendues en JS, contenu dynamique, tableaux |

Conseils :

- Maximum 20 URL par requête. Répartissez les listes plus longues en plusieurs appels.
- Utilisez `query` + `chunks_per_source` pour n’obtenir que le contenu pertinent au lieu de pages complètes.
- Essayez d’abord `basic` ; utilisez `advanced` en repli si le contenu est manquant ou incomplet.

## Choisir le bon outil

| Besoin                                | Outil            |
| ------------------------------------- | ---------------- |
| Recherche web rapide, sans options spéciales | `web_search`     |
| Recherche avec profondeur, sujet, réponses IA | `tavily_search`  |
| Extraire du contenu à partir d’URL spécifiques | `tavily_extract` |

## Lié

- [Vue d’ensemble de la recherche web](/tools/web) -- tous les fournisseurs et la détection automatique
- [Firecrawl](/tools/firecrawl) -- recherche + scraping avec extraction de contenu
- [Recherche Exa](/tools/exa-search) -- recherche neuronale avec extraction de contenu
