---
read_when:
    - Vous voulez une extraction web basée sur Firecrawl
    - Vous avez besoin d’une clé API Firecrawl
    - Vous voulez utiliser Firecrawl comme fournisseur `web_search`
    - Vous voulez une extraction anti-bot pour `web_fetch`
summary: Recherche, extraction et solution de repli `web_fetch` avec Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-04-05T12:56:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

OpenClaw peut utiliser **Firecrawl** de trois façons :

- comme fournisseur `web_search`
- comme outils de plugin explicites : `firecrawl_search` et `firecrawl_scrape`
- comme extracteur de secours pour `web_fetch`

Il s’agit d’un service d’extraction/recherche hébergé qui prend en charge le contournement des bots et la mise en cache,
ce qui aide pour les sites riches en JS ou les pages qui bloquent les récupérations HTTP simples.

## Obtenir une clé API

1. Créez un compte Firecrawl et générez une clé API.
2. Stockez-la dans la configuration ou définissez `FIRECRAWL_API_KEY` dans l’environnement de la gateway.

## Configurer la recherche Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Remarques :

- Choisir Firecrawl lors de l’onboarding ou avec `openclaw configure --section web` active automatiquement le plugin Firecrawl intégré.
- `web_search` avec Firecrawl prend en charge `query` et `count`.
- Pour les contrôles spécifiques à Firecrawl comme `sources`, `categories` ou l’extraction des résultats, utilisez `firecrawl_search`.
- Les remplacements de `baseUrl` doivent rester sur `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` est la variable d’environnement de secours partagée pour les URL de base de recherche et d’extraction Firecrawl.

## Configurer l’extraction Firecrawl + la solution de repli `web_fetch`

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Remarques :

- Les tentatives de repli Firecrawl ne s’exécutent que lorsqu’une clé API est disponible (`plugins.entries.firecrawl.config.webFetch.apiKey` ou `FIRECRAWL_API_KEY`).
- `maxAgeMs` contrôle l’ancienneté maximale des résultats mis en cache (en ms). La valeur par défaut est de 2 jours.
- L’ancienne configuration `tools.web.fetch.firecrawl.*` est migrée automatiquement par `openclaw doctor --fix`.
- Les remplacements d’URL de base pour l’extraction Firecrawl sont limités à `https://api.firecrawl.dev`.

`firecrawl_scrape` réutilise les mêmes paramètres `plugins.entries.firecrawl.config.webFetch.*` et les mêmes variables d’environnement.

## Outils du plugin Firecrawl

### `firecrawl_search`

Utilisez-le lorsque vous voulez des contrôles de recherche spécifiques à Firecrawl plutôt que `web_search` générique.

Paramètres principaux :

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Utilisez-le pour les pages riches en JS ou protégées contre les bots lorsque `web_fetch` simple est insuffisant.

Paramètres principaux :

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Furtivité / contournement des bots

Firecrawl expose un paramètre de **mode proxy** pour le contournement des bots (`basic`, `stealth` ou `auto`).
OpenClaw utilise toujours `proxy: "auto"` avec `storeInCache: true` pour les requêtes Firecrawl.
Si `proxy` est omis, Firecrawl utilise `auto` par défaut. `auto` réessaie avec des proxys furtifs si une tentative de base échoue, ce qui peut consommer plus de crédits
qu’une extraction en mode basic uniquement.

## Comment `web_fetch` utilise Firecrawl

Ordre d’extraction de `web_fetch` :

1. Readability (local)
2. Firecrawl (s’il est sélectionné ou détecté automatiquement comme solution de repli active pour web fetch)
3. Nettoyage HTML de base (solution de repli finale)

Le paramètre de sélection est `tools.web.fetch.provider`. Si vous l’omettez, OpenClaw
détecte automatiquement le premier fournisseur web fetch prêt à l’emploi selon les identifiants disponibles.
Aujourd’hui, le fournisseur intégré est Firecrawl.

## Liens associés

- [Vue d’ensemble de Web Search](/tools/web) -- tous les fournisseurs et la détection automatique
- [Web Fetch](/tools/web-fetch) -- outil `web_fetch` avec solution de repli Firecrawl
- [Tavily](/tools/tavily) -- outils de recherche et d’extraction
