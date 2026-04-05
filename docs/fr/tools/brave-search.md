---
read_when:
    - Vous voulez utiliser Brave Search pour `web_search`
    - Vous avez besoin d'un `BRAVE_API_KEY` ou de détails sur les forfaits
summary: Configuration de l'API Brave Search pour `web_search`
title: Brave Search
x-i18n:
    generated_at: "2026-04-05T12:55:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc026a69addf74375a0e407805b875ff527c77eb7298b2f5bb0e165197f77c0c
    source_path: tools/brave-search.md
    workflow: 15
---

# API Brave Search

OpenClaw prend en charge l'API Brave Search comme provider `web_search`.

## Obtenir une clé API

1. Créez un compte API Brave Search sur [https://brave.com/search/api/](https://brave.com/search/api/)
2. Dans le tableau de bord, choisissez le forfait **Search** et générez une clé API.
3. Stockez la clé dans la configuration ou définissez `BRAVE_API_KEY` dans l'environnement du Gateway.

## Exemple de configuration

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Les paramètres de recherche Brave spécifiques au provider se trouvent désormais sous `plugins.entries.brave.config.webSearch.*`.
L'ancien `tools.web.search.apiKey` est toujours chargé via la couche de compatibilité, mais ce n'est plus le chemin de configuration canonique.

`webSearch.mode` contrôle le transport Brave :

- `web` (par défaut) : recherche web Brave normale avec titres, URL et extraits
- `llm-context` : API Brave LLM Context avec blocs de texte pré-extraits et sources pour l'ancrage

## Paramètres de l'outil

| Paramètre     | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Requête de recherche (obligatoire)                                  |
| `count`       | Nombre de résultats à renvoyer (1-10, par défaut : 5)               |
| `country`     | Code pays ISO à 2 lettres (par ex. "US", "DE")                     |
| `language`    | Code de langue ISO 639-1 pour les résultats de recherche (par ex. "en", "de", "fr") |
| `search_lang` | Code de langue de recherche Brave (par ex. `en`, `en-gb`, `zh-hans`) |
| `ui_lang`     | Code de langue ISO pour les éléments d'interface                    |
| `freshness`   | Filtre temporel : `day` (24 h), `week`, `month` ou `year`           |
| `date_after`  | Uniquement les résultats publiés après cette date (YYYY-MM-DD)      |
| `date_before` | Uniquement les résultats publiés avant cette date (YYYY-MM-DD)      |

**Exemples :**

```javascript
// Recherche spécifique à un pays et à une langue
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Résultats récents (semaine passée)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Recherche sur une plage de dates
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Remarques

- OpenClaw utilise le forfait Brave **Search**. Si vous avez un abonnement hérité (par exemple le forfait Free d'origine avec 2 000 requêtes/mois), il reste valide mais n'inclut pas les fonctionnalités plus récentes comme LLM Context ou des limites de débit plus élevées.
- Chaque forfait Brave inclut **5 $/mois de crédit gratuit** (renouvelé). Le forfait Search coûte 5 $ pour 1 000 requêtes, donc ce crédit couvre 1 000 requêtes/mois. Définissez votre limite d'utilisation dans le tableau de bord Brave pour éviter des frais imprévus. Consultez le [portail API Brave](https://brave.com/search/api/) pour les forfaits actuels.
- Le forfait Search inclut le point de terminaison LLM Context et les droits d'inférence IA. Le stockage des résultats pour entraîner ou ajuster des modèles nécessite un forfait avec des droits de stockage explicites. Consultez les [Conditions d'utilisation](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- Le mode `llm-context` renvoie des entrées de sources ancrées au lieu du format normal d'extrait de recherche web.
- Le mode `llm-context` ne prend pas en charge `ui_lang`, `freshness`, `date_after` ni `date_before`.
- `ui_lang` doit inclure un sous-tag de région comme `en-US`.
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via `cacheTtlMinutes`).

## Liens associés

- [Vue d'ensemble de Web Search](/tools/web) -- tous les providers et la détection automatique
- [Perplexity Search](/tools/perplexity-search) -- résultats structurés avec filtrage par domaine
- [Exa Search](/tools/exa-search) -- recherche neuronale avec extraction de contenu
