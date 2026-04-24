---
read_when:
    - Vous voulez utiliser la recherche Perplexity pour la recherche web
    - Vous devez configurer `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
summary: API de recherche Perplexity et compatibilité Sonar/OpenRouter pour `web_search`
title: recherche Perplexity
x-i18n:
    generated_at: "2026-04-24T07:38:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# API de recherche Perplexity

OpenClaw prend en charge l’API de recherche Perplexity comme fournisseur `web_search`.
Elle renvoie des résultats structurés avec les champs `title`, `url` et `snippet`.

Pour la compatibilité, OpenClaw prend également en charge les anciennes configurations Perplexity Sonar/OpenRouter.
Si vous utilisez `OPENROUTER_API_KEY`, une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`, ou définissez `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, le fournisseur bascule vers le chemin chat-completions et renvoie des réponses synthétisées par l’IA avec citations au lieu des résultats structurés de l’API Search.

## Obtenir une clé API Perplexity

1. Créez un compte Perplexity sur [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Générez une clé API dans le tableau de bord
3. Stockez la clé dans la configuration ou définissez `PERPLEXITY_API_KEY` dans l’environnement de la Gateway.

## Compatibilité OpenRouter

Si vous utilisiez déjà OpenRouter pour Perplexity Sonar, conservez `provider: "perplexity"` et définissez `OPENROUTER_API_KEY` dans l’environnement de la Gateway, ou stockez une clé `sk-or-...` dans `plugins.entries.perplexity.config.webSearch.apiKey`.

Contrôles de compatibilité facultatifs :

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Exemples de configuration

### API de recherche Perplexity native

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

**Via la configuration :** exécutez `openclaw configure --section web`. Cela stocke la clé dans
`~/.openclaw/openclaw.json` sous `plugins.entries.perplexity.config.webSearch.apiKey`.
Ce champ accepte aussi les objets SecretRef.

**Via l’environnement :** définissez `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
dans l’environnement du processus Gateway. Pour une installation gateway, placez-la dans
`~/.openclaw/.env` (ou dans l’environnement de votre service). Voir [Variables d’environnement](/fr/help/faq#env-vars-and-env-loading).

Si `provider: "perplexity"` est configuré et que le SecretRef de clé Perplexity n’est pas résolu sans solution de repli via l’environnement, le démarrage/rechargement échoue immédiatement.

## Paramètres de l’outil

Ces paramètres s’appliquent au chemin natif de l’API de recherche Perplexity.

<ParamField path="query" type="string" required>
Requête de recherche.
</ParamField>

<ParamField path="count" type="number" default="5">
Nombre de résultats à renvoyer (1–10).
</ParamField>

<ParamField path="country" type="string">
Code pays ISO à 2 lettres (par ex. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Code langue ISO 639-1 (par ex. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtre temporel — `day` correspond à 24 heures.
</ParamField>

<ParamField path="date_after" type="string">
Uniquement les résultats publiés après cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Uniquement les résultats publiés avant cette date (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Tableau de liste d’autorisation/de refus de domaines (max 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Budget total de contenu (max 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limite de tokens par page.
</ParamField>

Pour le chemin de compatibilité Sonar/OpenRouter hérité :

- `query`, `count` et `freshness` sont acceptés
- `count` n’y est accepté que pour compatibilité ; la réponse reste une seule
  réponse synthétisée avec citations plutôt qu’une liste de N résultats
- Les filtres réservés à l’API Search tels que `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` et `max_tokens_per_page`
  renvoient des erreurs explicites

**Exemples :**

```javascript
// Recherche spécifique à un pays et une langue
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

// Filtrage de domaines (liste d’autorisation)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtrage de domaines (liste de refus - préfixer avec -)
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

### Règles du filtre de domaine

- Maximum de 20 domaines par filtre
- Impossible de mélanger liste d’autorisation et liste de refus dans une même requête
- Utilisez le préfixe `-` pour les entrées de liste de refus (par ex. `["-reddit.com"]`)

## Remarques

- L’API de recherche Perplexity renvoie des résultats de recherche web structurés (`title`, `url`, `snippet`)
- OpenRouter ou `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` explicite rebascule Perplexity vers les chat completions Sonar pour compatibilité
- La compatibilité Sonar/OpenRouter renvoie une réponse synthétisée avec citations, pas des lignes de résultats structurées
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via `cacheTtlMinutes`)

## Liens associés

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Documentation de l’API de recherche Perplexity](https://docs.perplexity.ai/docs/search/quickstart) -- documentation officielle Perplexity
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec filtres pays/langue
- [Exa Search](/fr/tools/exa-search) -- recherche neuronale avec extraction de contenu
