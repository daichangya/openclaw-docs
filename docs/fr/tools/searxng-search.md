---
read_when:
    - Vous souhaitez un fournisseur de recherche web auto-hébergé
    - Vous souhaitez utiliser SearXNG pour `web_search`
    - Vous avez besoin d’une option de recherche axée sur la confidentialité ou isolée du réseau
summary: Recherche web SearXNG -- fournisseur de méta-recherche auto-hébergé, sans clé
title: Recherche SearXNG
x-i18n:
    generated_at: "2026-04-24T07:38:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClaw prend en charge [SearXNG](https://docs.searxng.org/) comme fournisseur `web_search` **auto-hébergé,
sans clé**. SearXNG est un moteur de méta-recherche open source
qui agrège des résultats de Google, Bing, DuckDuckGo et d’autres sources.

Avantages :

- **Gratuit et illimité** -- aucune clé API ni abonnement commercial requis
- **Confidentialité / isolement réseau** -- les requêtes ne quittent jamais votre réseau
- **Fonctionne partout** -- aucune restriction régionale des API de recherche commerciales

## Configuration

<Steps>
  <Step title="Lancer une instance SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ou utilisez tout déploiement SearXNG existant auquel vous avez accès. Voir la
    [documentation SearXNG](https://docs.searxng.org/) pour une configuration de production.

  </Step>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Ou définissez la variable d’environnement et laissez l’auto-détection la trouver :

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

Paramètres au niveau du Plugin pour l’instance SearXNG :

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

Règles de transport :

- `https://` fonctionne pour les hôtes SearXNG publics ou privés
- `http://` n’est accepté que pour des hôtes de réseau privé de confiance ou en loopback
- les hôtes SearXNG publics doivent utiliser `https://`

## Variable d’environnement

Définissez `SEARXNG_BASE_URL` comme alternative à la configuration :

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Lorsque `SEARXNG_BASE_URL` est défini et qu’aucun fournisseur explicite n’est configuré, l’auto-détection
choisit automatiquement SearXNG (à la priorité la plus basse -- tout fournisseur adossé à une API avec une
clé configurée passe en premier).

## Référence de configuration du Plugin

| Champ        | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL de base de votre instance SearXNG (obligatoire)                |
| `categories` | Catégories séparées par des virgules, telles que `general`, `news` ou `science` |
| `language`   | Code de langue des résultats, tel que `en`, `de` ou `fr`           |

## Remarques

- **API JSON** -- utilise le point de terminaison natif `format=json` de SearXNG, pas du scraping HTML
- **Aucune clé API** -- fonctionne immédiatement avec toute instance SearXNG
- **Validation de l’URL de base** -- `baseUrl` doit être une URL `http://` ou `https://`
  valide ; les hôtes publics doivent utiliser `https://`
- **Ordre d’auto-détection** -- SearXNG est vérifié en dernier (ordre 200) dans
  l’auto-détection. Les fournisseurs adossés à une API avec des clés configurées passent d’abord, puis
  DuckDuckGo (ordre 100), puis Ollama Web Search (ordre 110)
- **Auto-hébergé** -- vous contrôlez l’instance, les requêtes et les moteurs de recherche amont
- **Categories** vaut par défaut `general` lorsqu’il n’est pas configuré

<Tip>
  Pour que l’API JSON SearXNG fonctionne, assurez-vous que votre instance SearXNG a le format `json`
  activé dans son `settings.yml` sous `search.formats`.
</Tip>

## Voir aussi

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et l’auto-détection
- [Recherche DuckDuckGo](/fr/tools/duckduckgo-search) -- un autre repli sans clé
- [Recherche Brave](/fr/tools/brave-search) -- résultats structurés avec offre gratuite
