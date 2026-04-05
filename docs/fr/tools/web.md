---
read_when:
    - Vous voulez activer ou configurer `web_search`
    - Vous voulez activer ou configurer `x_search`
    - Vous devez choisir un fournisseur de recherche
    - Vous voulez comprendre l'auto-détection et le basculement entre fournisseurs
sidebarTitle: Web Search
summary: '`web_search`, `x_search` et `web_fetch` -- rechercher sur le web, rechercher des publications X ou récupérer le contenu d''une page'
title: Web Search
x-i18n:
    generated_at: "2026-04-05T12:58:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8b9a5d641dcdcbe7c099c8862898f12646f43151b6c4152d69c26af9b17e0fa
    source_path: tools/web.md
    workflow: 15
---

# Web Search

L'outil `web_search` recherche sur le web à l'aide du fournisseur configuré et
renvoie les résultats. Les résultats sont mis en cache par requête pendant
15 minutes (paramétrable).

OpenClaw inclut également `x_search` pour les publications X (anciennement Twitter) et
`web_fetch` pour la récupération légère d'URL. Dans cette phase, `web_fetch` reste
local tandis que `web_search` et `x_search` peuvent utiliser xAI Responses en interne.

<Info>
  `web_search` est un outil HTTP léger, pas une automatisation de navigateur. Pour
  les sites fortement dépendants de JS ou les connexions, utilisez le [Web Browser](/tools/browser). Pour
  récupérer une URL spécifique, utilisez [Web Fetch](/tools/web-fetch).
</Info>

## Démarrage rapide

<Steps>
  <Step title="Choisir un fournisseur">
    Choisissez un fournisseur et effectuez toute configuration requise. Certains fournisseurs sont
    sans clé, tandis que d'autres utilisent des clés API. Consultez les pages des fournisseurs ci-dessous pour
    plus de détails.
  </Step>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    ```
    Cela enregistre le fournisseur et toute information d'identification nécessaire. Vous pouvez aussi définir une variable d'environnement
    (par exemple `BRAVE_API_KEY`) et ignorer cette étape pour les fournisseurs
    reposant sur une API.
  </Step>
  <Step title="L'utiliser">
    L'agent peut maintenant appeler `web_search` :

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Pour les publications X, utilisez :

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Choisir un fournisseur

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tools/brave-search">
    Résultats structurés avec extraits. Prend en charge le mode `llm-context` et les filtres pays/langue. Niveau gratuit disponible.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tools/duckduckgo-search">
    Secours sans clé. Aucune clé API nécessaire. Intégration non officielle basée sur HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/tools/exa-search">
    Recherche neuronale + par mots-clés avec extraction de contenu (surbrillances, texte, résumés).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tools/firecrawl">
    Résultats structurés. À associer de préférence avec `firecrawl_search` et `firecrawl_scrape` pour une extraction approfondie.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tools/gemini-search">
    Réponses synthétisées par IA avec citations via l'ancrage Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/tools/grok-search">
    Réponses synthétisées par IA avec citations via l'ancrage web xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/tools/kimi-search">
    Réponses synthétisées par IA avec citations via la recherche web Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tools/minimax-search">
    Résultats structurés via l'API de recherche MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tools/ollama-search">
    Recherche sans clé via votre hôte Ollama configuré. Nécessite `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/tools/perplexity-search">
    Résultats structurés avec contrôles d'extraction de contenu et filtrage de domaine.
  </Card>
  <Card title="SearXNG" icon="server" href="/tools/searxng-search">
    Méta-recherche auto-hébergée. Aucune clé API nécessaire. Agrège Google, Bing, DuckDuckGo, et plus encore.
  </Card>
  <Card title="Tavily" icon="globe" href="/tools/tavily">
    Résultats structurés avec profondeur de recherche, filtrage par sujet et `tavily_extract` pour l'extraction d'URL.
  </Card>
</CardGroup>

### Comparaison des fournisseurs

| Provider                                  | Style de résultat           | Filtres                                          | Clé API                                                                          |
| ----------------------------------------- | --------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/tools/brave-search)              | Extraits structurés         | Pays, langue, date, mode `llm-context`           | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/tools/duckduckgo-search)    | Extraits structurés         | --                                               | Aucune (sans clé)                                                                |
| [Exa](/tools/exa-search)                  | Structuré + extrait         | Mode neuronal/par mots-clés, date, extraction de contenu | `EXA_API_KEY`                                                                    |
| [Firecrawl](/tools/firecrawl)             | Extraits structurés         | Via l'outil `firecrawl_search`                   | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/tools/gemini-search)            | Synthétisé par IA + citations | --                                             | `GEMINI_API_KEY`                                                                 |
| [Grok](/tools/grok-search)                | Synthétisé par IA + citations | --                                             | `XAI_API_KEY`                                                                    |
| [Kimi](/tools/kimi-search)                | Synthétisé par IA + citations | --                                             | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/tools/minimax-search)   | Extraits structurés         | Région (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/tools/ollama-search) | Extraits structurés         | --                                               | Aucune par défaut ; `ollama signin` requis, peut réutiliser l'authentification bearer du fournisseur Ollama |
| [Perplexity](/tools/perplexity-search)    | Extraits structurés         | Pays, langue, date, domaines, limites de contenu | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/tools/searxng-search)          | Extraits structurés         | Catégories, langue                               | Aucune (auto-hébergé)                                                            |
| [Tavily](/tools/tavily)                   | Extraits structurés         | Via l'outil `tavily_search`                      | `TAVILY_API_KEY`                                                                 |

## Auto-détection

## Recherche web native Codex

Les modèles compatibles Codex peuvent éventuellement utiliser l'outil `web_search` natif du fournisseur Responses au lieu de la fonction `web_search` gérée par OpenClaw.

- Configurez-la sous `tools.web.search.openaiCodex`
- Elle ne s'active que pour les modèles compatibles Codex (`openai-codex/*` ou les fournisseurs utilisant `api: "openai-codex-responses"`)
- Le `web_search` géré continue de s'appliquer aux modèles non Codex
- `mode: "cached"` est le paramètre par défaut et recommandé
- `tools.web.search.enabled: false` désactive à la fois la recherche gérée et la recherche native

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Si la recherche native Codex est activée mais que le modèle actuel n'est pas compatible Codex, OpenClaw conserve le comportement normal de `web_search` géré.

## Configuration de la recherche web

Les listes de fournisseurs dans la documentation et les flux de configuration sont en ordre alphabétique. L'auto-détection conserve un
ordre de priorité distinct.

Si aucun `provider` n'est défini, OpenClaw vérifie les fournisseurs dans cet ordre et utilise le
premier qui est prêt :

Fournisseurs reposant sur une API en premier :

1. **Brave** -- `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey` (ordre 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey` (ordre 15)
3. **Gemini** -- `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey` (ordre 20)
4. **Grok** -- `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` (ordre 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey` (ordre 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey` (ordre 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey` (ordre 60)
8. **Exa** -- `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey` (ordre 65)
9. **Tavily** -- `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey` (ordre 70)

Secours sans clé ensuite :

10. **DuckDuckGo** -- secours HTML sans clé, sans compte ni clé API (ordre 100)
11. **Ollama Web Search** -- secours sans clé via votre hôte Ollama configuré ; nécessite qu'Ollama soit joignable et connecté avec `ollama signin` et peut réutiliser l'authentification bearer du fournisseur Ollama si l'hôte en a besoin (ordre 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (ordre 200)

Si aucun fournisseur n'est détecté, il bascule sur Brave (vous obtiendrez une
erreur de clé manquante vous invitant à en configurer une).

<Note>
  Tous les champs de clé de fournisseur prennent en charge les objets SecretRef. En mode auto-détection,
  OpenClaw ne résout que la clé du fournisseur sélectionné -- les SecretRefs non sélectionnés
  restent inactifs.
</Note>

## Config

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

La configuration spécifique au fournisseur (clés API, URL de base, modes) se trouve sous
`plugins.entries.<plugin>.config.webSearch.*`. Consultez les pages des fournisseurs pour
des exemples.

La sélection du fournisseur de repli de `web_fetch` est distincte :

- choisissez-le avec `tools.web.fetch.provider`
- ou omettez ce champ et laissez OpenClaw auto-détecter le premier fournisseur de web-fetch
  prêt à partir des informations d'identification disponibles
- aujourd'hui, le fournisseur web-fetch intégré est Firecrawl, configuré sous
  `plugins.entries.firecrawl.config.webFetch.*`

Lorsque vous choisissez **Kimi** pendant `openclaw onboard` ou
`openclaw configure --section web`, OpenClaw peut aussi demander :

- la région de l'API Moonshot (`https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`)
- le modèle par défaut de recherche web Kimi (par défaut `kimi-k2.5`)

Pour `x_search`, configurez `plugins.entries.xai.config.xSearch.*`. Il utilise la
même solution de repli `XAI_API_KEY` que la recherche web Grok.
L'ancienne configuration `tools.web.x_search.*` est migrée automatiquement par `openclaw doctor --fix`.
Lorsque vous choisissez Grok pendant `openclaw onboard` ou `openclaw configure --section web`,
OpenClaw peut également proposer la configuration facultative de `x_search` avec la même clé.
Il s'agit d'une étape de suivi distincte à l'intérieur du parcours Grok, et non d'un choix distinct de fournisseur
de recherche web de premier niveau. Si vous choisissez un autre fournisseur, OpenClaw n'affiche pas
l'invite `x_search`.

### Stockage des clés API

<Tabs>
  <Tab title="Fichier de config">
    Exécutez `openclaw configure --section web` ou définissez directement la clé :

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Variable d'environnement">
    Définissez la variable d'environnement du fournisseur dans l'environnement du processus Gateway :

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Pour une installation gateway, placez-la dans `~/.openclaw/.env`.
    Voir [Variables d'environnement](/fr/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Paramètres de l'outil

| Parameter             | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `query`               | Requête de recherche (obligatoire)                           |
| `count`               | Résultats à renvoyer (1-10, par défaut : 5)                  |
| `country`             | Code pays ISO à 2 lettres (par ex. "US", "DE")              |
| `language`            | Code de langue ISO 639-1 (par ex. "en", "de")               |
| `search_lang`         | Code de langue de recherche (Brave uniquement)               |
| `freshness`           | Filtre temporel : `day`, `week`, `month` ou `year`           |
| `date_after`          | Résultats après cette date (YYYY-MM-DD)                      |
| `date_before`         | Résultats avant cette date (YYYY-MM-DD)                      |
| `ui_lang`             | Code de langue de l'interface (Brave uniquement)             |
| `domain_filter`       | Tableau de liste d'autorisation/de refus de domaines (Perplexity uniquement) |
| `max_tokens`          | Budget total de contenu, par défaut 25000 (Perplexity uniquement) |
| `max_tokens_per_page` | Limite de jetons par page, par défaut 2048 (Perplexity uniquement) |

<Warning>
  Tous les paramètres ne fonctionnent pas avec tous les fournisseurs. Le mode `llm-context` de Brave
  rejette `ui_lang`, `freshness`, `date_after` et `date_before`.
  Gemini, Grok et Kimi renvoient une réponse synthétisée unique avec citations. Ils
  acceptent `count` pour la compatibilité avec les outils partagés, mais cela ne change pas la
  forme de la réponse ancrée.
  Perplexity se comporte de la même manière lorsque vous utilisez le chemin de compatibilité
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` ou `OPENROUTER_API_KEY`).
  SearXNG n'accepte `http://` que pour les hôtes de confiance en réseau privé ou en loopback ;
  les endpoints SearXNG publics doivent utiliser `https://`.
  Firecrawl et Tavily ne prennent en charge que `query` et `count` via `web_search`
  -- utilisez leurs outils dédiés pour les options avancées.
</Warning>

## x_search

`x_search` interroge les publications X (anciennement Twitter) à l'aide de xAI et renvoie
des réponses synthétisées par IA avec citations. Il accepte des requêtes en langage naturel et
des filtres structurés facultatifs. OpenClaw n'active l'outil `x_search`
xAI intégré que sur la requête qui sert cet appel d'outil.

<Note>
  xAI documente `x_search` comme prenant en charge la recherche par mot-clé, la recherche sémantique, la recherche d'utilisateur
  et la récupération de thread. Pour les statistiques d'engagement par publication telles que les reposts,
  réponses, marque-pages ou vues, préférez une recherche ciblée sur l'URL exacte de la publication
  ou son ID de statut. Les recherches larges par mot-clé peuvent trouver la bonne publication mais renvoyer
  des métadonnées moins complètes par publication. Un bon schéma est : localiser d'abord la publication, puis
  exécuter une seconde requête `x_search` ciblée sur cette publication exacte.
</Note>

### Configuration de x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### Paramètres de x_search

| Parameter                    | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `query`                      | Requête de recherche (obligatoire)                           |
| `allowed_x_handles`          | Restreindre les résultats à des identifiants X spécifiques   |
| `excluded_x_handles`         | Exclure des identifiants X spécifiques                       |
| `from_date`                  | Inclure uniquement les publications à partir de cette date (YYYY-MM-DD) |
| `to_date`                    | Inclure uniquement les publications jusqu'à cette date (YYYY-MM-DD) |
| `enable_image_understanding` | Permettre à xAI d'inspecter les images jointes aux publications correspondantes |
| `enable_video_understanding` | Permettre à xAI d'inspecter les vidéos jointes aux publications correspondantes |

### Exemple de x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Exemples

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profils d'outils

Si vous utilisez des profils d'outils ou des listes d'autorisation, ajoutez `web_search`, `x_search` ou `group:web` :

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Liens connexes

- [Web Fetch](/tools/web-fetch) -- récupérer une URL et extraire du contenu lisible
- [Web Browser](/tools/browser) -- automatisation complète du navigateur pour les sites fortement dépendants de JS
- [Grok Search](/tools/grok-search) -- Grok comme fournisseur `web_search`
- [Ollama Web Search](/tools/ollama-search) -- recherche web sans clé via votre hôte Ollama
