---
read_when:
    - Vous souhaitez utiliser Perplexity Search pour la recherche web
    - Vous devez configurer `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
summary: API de recherche Perplexity et compatibilité Sonar/OpenRouter pour web_search
title: Perplexity Search (chemin hérité)
x-i18n:
    generated_at: "2026-04-05T12:47:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba91e63e7412f3b6f889ee11f4a66563014932a1dc7be8593fe2262a4877b89b
    source_path: perplexity.md
    workflow: 15
---

# API Perplexity Search

OpenClaw prend en charge l'API Perplexity Search comme fournisseur `web_search`.
Elle renvoie des résultats structurés avec les champs `title`, `url` et `snippet`.

Pour des raisons de compatibilité, OpenClaw prend également en charge les configurations héritées Perplexity Sonar/OpenRouter.
Si vous utilisez `OPENROUTER_API_KEY`, une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`, ou si vous définissez `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, le fournisseur bascule vers le chemin chat-completions et renvoie des réponses synthétisées par l'IA avec citations au lieu de résultats structurés de l'API Search.

## Obtenir une clé API Perplexity

1. Créez un compte Perplexity sur [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Générez une clé API dans le dashboard
3. Stockez la clé dans la configuration ou définissez `PERPLEXITY_API_KEY` dans l'environnement de la gateway.

## Compatibilité OpenRouter

Si vous utilisiez déjà OpenRouter pour Perplexity Sonar, conservez `provider: "perplexity"` et définissez `OPENROUTER_API_KEY` dans l'environnement de la gateway, ou stockez une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`.

Contrôles de compatibilité facultatifs :

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Exemples de configuration

### API Perplexity Search native

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Compatibilité OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Où définir la clé

**Via la configuration :** exécutez `openclaw configure --section web`. La clé est stockée dans
`~/.openclaw/openclaw.json` sous `plugins.entries.perplexity.config.webSearch.apiKey`.
Ce champ accepte également les objets SecretRef.

**Via l'environnement :** définissez `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
dans l'environnement du processus gateway. Pour une installation gateway, placez-la dans
`~/.openclaw/.env` (ou dans l'environnement de votre service). Voir [Variables d'environnement](/help/faq#env-vars-and-env-loading).

Si `provider: "perplexity"` est configuré et que le SecretRef de clé Perplexity n'est pas résolu sans repli env, le démarrage/rechargement échoue immédiatement.

## Paramètres de l'outil

Ces paramètres s'appliquent au chemin natif de l'API Perplexity Search.

| Paramètre             | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `query`               | Requête de recherche (obligatoire)                         |
| `count`               | Nombre de résultats à renvoyer (1-10, défaut : 5)          |
| `country`             | Code pays ISO à 2 lettres (par ex. `"US"`, `"DE"`)         |
| `language`            | Code langue ISO 639-1 (par ex. `"en"`, `"de"`, `"fr"`)     |
| `freshness`           | Filtre temporel : `day` (24h), `week`, `month` ou `year`   |
| `date_after`          | Uniquement les résultats publiés après cette date (YYYY-MM-DD) |
| `date_before`         | Uniquement les résultats publiés avant cette date (YYYY-MM-DD) |
| `domain_filter`       | Tableau de liste d'autorisation/de refus de domaines (max 20) |
| `max_tokens`          | Budget total de contenu (défaut : 25000, max : 1000000)    |
| `max_tokens_per_page` | Limite de jetons par page (défaut : 2048)                  |

Pour le chemin de compatibilité hérité Sonar/OpenRouter :

- `query`, `count` et `freshness` sont acceptés
- `count` n'est là que pour la compatibilité ; la réponse reste une seule
  réponse synthétisée avec citations plutôt qu'une liste de N résultats
- Les filtres réservés à l'API Search comme `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` et `max_tokens_per_page`
  renvoient des erreurs explicites

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

// Filtrage de domaine (liste d'autorisation)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtrage de domaine (liste de refus - préfixer par -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Extraction de contenu plus importante
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Règles de filtre de domaine

- Maximum 20 domaines par filtre
- Impossible de mélanger liste d'autorisation et liste de refus dans une même requête
- Utilisez le préfixe `-` pour les entrées de liste de refus (par ex. `["-reddit.com"]`)

## Remarques

- L'API Perplexity Search renvoie des résultats de recherche web structurés (`title`, `url`, `snippet`)
- OpenRouter ou `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` explicites rebascule Perplexity vers les chat completions Sonar pour des raisons de compatibilité
- La compatibilité Sonar/OpenRouter renvoie une seule réponse synthétisée avec citations, pas des lignes de résultats structurées
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via `cacheTtlMinutes`)

Voir [Outils web](/tools/web) pour la configuration complète de `web_search`.
Voir la [documentation de l'API Perplexity Search](https://docs.perplexity.ai/docs/search/quickstart) pour plus de détails.
