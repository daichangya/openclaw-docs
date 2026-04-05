---
read_when:
    - Vous voulez un provider de recherche web auto-hébergé
    - Vous voulez utiliser SearXNG pour `web_search`
    - Vous avez besoin d'une option de recherche axée sur la confidentialité ou isolée du réseau
summary: Recherche web SearXNG -- provider de métarecherche auto-hébergé sans clé
title: Recherche SearXNG
x-i18n:
    generated_at: "2026-04-05T12:57:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# Recherche SearXNG

OpenClaw prend en charge [SearXNG](https://docs.searxng.org/) comme provider `web_search` **auto-hébergé et sans clé**. SearXNG est un moteur de métarecherche open source
qui agrège les résultats de Google, Bing, DuckDuckGo et d'autres sources.

Avantages :

- **Gratuit et illimité** -- aucune clé API ni abonnement commercial requis
- **Confidentialité / isolation réseau** -- les requêtes ne quittent jamais votre réseau
- **Fonctionne partout** -- aucune restriction régionale des API de recherche commerciales

## Configuration

<Steps>
  <Step title="Exécuter une instance SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ou utilisez tout déploiement SearXNG existant auquel vous avez accès. Consultez la
    [documentation SearXNG](https://docs.searxng.org/) pour une configuration en production.

  </Step>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Ou définissez la variable d'environnement et laissez la détection automatique la trouver :

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Configuration

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Paramètres au niveau du plugin pour l'instance SearXNG :

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Le champ `baseUrl` accepte également des objets SecretRef.

Règles de transport :

- `https://` fonctionne pour les hôtes SearXNG publics ou privés
- `http://` est accepté uniquement pour les hôtes privés de confiance ou en loopback
- les hôtes SearXNG publics doivent utiliser `https://`

## Variable d'environnement

Définissez `SEARXNG_BASE_URL` comme alternative à la configuration :

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Lorsque `SEARXNG_BASE_URL` est défini et qu'aucun provider explicite n'est configuré, la détection automatique
sélectionne automatiquement SearXNG (à la priorité la plus basse -- tout provider adossé à une API avec une
clé configurée est prioritaire).

## Référence de configuration du plugin

| Champ        | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL de base de votre instance SearXNG (obligatoire)                |
| `categories` | Catégories séparées par des virgules telles que `general`, `news` ou `science` |
| `language`   | Code de langue pour les résultats tel que `en`, `de` ou `fr`       |

## Remarques

- **API JSON** -- utilise le point de terminaison natif `format=json` de SearXNG, pas du scraping HTML
- **Aucune clé API** -- fonctionne immédiatement avec n'importe quelle instance SearXNG
- **Validation de l'URL de base** -- `baseUrl` doit être une URL `http://` ou `https://`
  valide ; les hôtes publics doivent utiliser `https://`
- **Ordre de détection automatique** -- SearXNG est vérifié en dernier (ordre 200) dans
  la détection automatique. Les providers adossés à une API avec des clés configurées sont traités en premier, puis
  DuckDuckGo (ordre 100), puis Ollama Web Search (ordre 110)
- **Auto-hébergé** -- vous contrôlez l'instance, les requêtes et les moteurs de recherche en amont
- **Categories** utilise `general` par défaut lorsqu'il n'est pas configuré

<Tip>
  Pour que l'API JSON SearXNG fonctionne, assurez-vous que votre instance SearXNG a le format `json`
  activé dans son `settings.yml` sous `search.formats`.
</Tip>

## Liens associés

- [Vue d'ensemble de Web Search](/tools/web) -- tous les providers et la détection automatique
- [DuckDuckGo Search](/tools/duckduckgo-search) -- une autre solution de repli sans clé
- [Brave Search](/tools/brave-search) -- résultats structurés avec niveau gratuit
