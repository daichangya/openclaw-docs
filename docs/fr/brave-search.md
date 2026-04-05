---
read_when:
    - Vous voulez utiliser Brave Search pour `web_search`
    - Vous avez besoin d’un `BRAVE_API_KEY` ou d’informations sur les forfaits
summary: Configuration de l’API Brave Search pour `web_search`
title: Brave Search (chemin hérité)
x-i18n:
    generated_at: "2026-04-05T12:34:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7788e4cee7dc460819e55095c87df8cea29ba3a8bd3cef4c0e98ac601b45b651
    source_path: brave-search.md
    workflow: 15
---

# API Brave Search

OpenClaw prend en charge l’API Brave Search en tant que fournisseur `web_search`.

## Obtenir une clé API

1. Créez un compte Brave Search API sur [https://brave.com/search/api/](https://brave.com/search/api/)
2. Dans le tableau de bord, choisissez le forfait **Search** et générez une clé API.
3. Stockez la clé dans la configuration ou définissez `BRAVE_API_KEY` dans l’environnement Gateway.

## Exemple de configuration

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // ou "llm-context"
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

Les paramètres de recherche Brave spécifiques au fournisseur se trouvent désormais sous `plugins.entries.brave.config.webSearch.*`.
L’ancien `tools.web.search.apiKey` est toujours chargé via la couche de compatibilité, mais ce n’est plus le chemin de configuration canonique.

`webSearch.mode` contrôle le transport Brave :

- `web` (par défaut) : recherche web Brave normale avec titres, URL et extraits
- `llm-context` : API Brave LLM Context avec segments de texte préextraits et sources pour l’ancrage

## Paramètres de l’outil

| Paramètre     | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| `query`       | Requête de recherche (obligatoire)                                   |
| `count`       | Nombre de résultats à renvoyer (1-10, par défaut : 5)                |
| `country`     | Code pays ISO à 2 lettres (par ex. "US", "DE")                       |
| `language`    | Code de langue ISO 639-1 pour les résultats de recherche (par ex. "en", "de", "fr") |
| `search_lang` | Code de langue de recherche Brave (par ex. `en`, `en-gb`, `zh-hans`) |
| `ui_lang`     | Code de langue ISO pour les éléments d’interface                     |
| `freshness`   | Filtre temporel : `day` (24 h), `week`, `month` ou `year`            |
| `date_after`  | Uniquement les résultats publiés après cette date (AAAA-MM-JJ)       |
| `date_before` | Uniquement les résultats publiés avant cette date (AAAA-MM-JJ)       |

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

- OpenClaw utilise le forfait Brave **Search**. Si vous disposez d’un abonnement hérité (par ex. l’ancien forfait Free avec 2 000 requêtes/mois), il reste valide mais n’inclut pas les fonctionnalités plus récentes comme LLM Context ou des limites de débit plus élevées.
- Chaque forfait Brave inclut **5 $/mois de crédit gratuit** (renouvelé). Le forfait Search coûte 5 $ pour 1 000 requêtes, donc le crédit couvre 1 000 requêtes/mois. Définissez votre limite d’utilisation dans le tableau de bord Brave pour éviter des frais inattendus. Consultez le [portail API Brave](https://brave.com/search/api/) pour les forfaits actuels.
- Le forfait Search inclut le point de terminaison LLM Context et les droits d’inférence IA. Le stockage des résultats pour entraîner ou ajuster des modèles nécessite un forfait avec des droits de stockage explicites. Consultez les [Conditions d’utilisation](https://api-dashboard.search.brave.com/terms-of-service) de Brave.
- Le mode `llm-context` renvoie des entrées de sources ancrées au lieu du format normal d’extraits de recherche web.
- Le mode `llm-context` ne prend pas en charge `ui_lang`, `freshness`, `date_after` ni `date_before`.
- `ui_lang` doit inclure un sous-tag de région comme `en-US`.
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via `cacheTtlMinutes`).

Consultez [Outils web](/tools/web) pour la configuration complète de `web_search`.
