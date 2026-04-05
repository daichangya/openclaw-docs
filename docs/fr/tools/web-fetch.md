---
read_when:
    - Vous voulez récupérer une URL et extraire un contenu lisible
    - Vous devez configurer `web_fetch` ou son repli Firecrawl
    - Vous voulez comprendre les limites et le cache de `web_fetch`
sidebarTitle: Web Fetch
summary: outil web_fetch -- récupération HTTP avec extraction de contenu lisible
title: Récupération Web
x-i18n:
    generated_at: "2026-04-05T12:57:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60c933a25d0f4511dc1683985988e115b836244c5eac4c6667b67c8eb15401e0
    source_path: tools/web-fetch.md
    workflow: 15
---

# Récupération Web

L'outil `web_fetch` effectue un simple HTTP GET et extrait un contenu lisible
(HTML vers markdown ou texte). Il **n'exécute pas** JavaScript.

Pour les sites riches en JS ou les pages protégées par connexion, utilisez plutôt le
[Web Browser](/tools/browser).

## Démarrage rapide

`web_fetch` est **activé par défaut** -- aucune configuration n'est nécessaire. L'agent peut
l'appeler immédiatement :

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Paramètres de l'outil

| Parameter     | Type     | Description                                   |
| ------------- | -------- | --------------------------------------------- |
| `url`         | `string` | URL à récupérer (obligatoire, http/https uniquement) |
| `extractMode` | `string` | `"markdown"` (par défaut) ou `"text"`         |
| `maxChars`    | `number` | Tronquer la sortie à ce nombre de caractères  |

## Fonctionnement

<Steps>
  <Step title="Récupération">
    Envoie un HTTP GET avec un User-Agent de type Chrome et un en-tête `Accept-Language`.
    Bloque les noms d'hôte privés/internes et revérifie les redirections.
  </Step>
  <Step title="Extraction">
    Exécute Readability (extraction du contenu principal) sur la réponse HTML.
  </Step>
  <Step title="Repli (facultatif)">
    Si Readability échoue et que Firecrawl est configuré, réessaie via l'API
    Firecrawl avec le mode de contournement des bots.
  </Step>
  <Step title="Cache">
    Les résultats sont mis en cache pendant 15 minutes (configurable) afin de réduire les
    récupérations répétées de la même URL.
  </Step>
</Steps>

## Configuration

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // par défaut : true
        provider: "firecrawl", // facultatif ; omettez pour la détection automatique
        maxChars: 50000, // nombre maximal de caractères en sortie
        maxCharsCap: 50000, // limite stricte du paramètre maxChars
        maxResponseBytes: 2000000, // taille maximale de téléchargement avant troncature
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // utiliser l'extraction Readability
        userAgent: "Mozilla/5.0 ...", // remplacer le User-Agent
      },
    },
  },
}
```

## Repli Firecrawl

Si l'extraction Readability échoue, `web_fetch` peut se replier sur
[Firecrawl](/tools/firecrawl) pour le contournement des bots et une meilleure extraction :

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // facultatif ; omettez pour la détection automatique à partir des identifiants disponibles
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // facultatif si FIRECRAWL_API_KEY est défini
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // durée du cache (1 jour)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` prend en charge les objets SecretRef.
L'ancienne configuration `tools.web.fetch.firecrawl.*` est migrée automatiquement par `openclaw doctor --fix`.

<Note>
  Si Firecrawl est activé et que son SecretRef n'est pas résolu sans
  variable d'environnement de repli `FIRECRAWL_API_KEY`, le démarrage de la gateway échoue immédiatement.
</Note>

<Note>
  Les remplacements de `baseUrl` Firecrawl sont strictement encadrés : ils doivent utiliser `https://` et
  l'hôte officiel Firecrawl (`api.firecrawl.dev`).
</Note>

Comportement actuel à l'exécution :

- `tools.web.fetch.provider` sélectionne explicitement le fournisseur de repli de récupération.
- Si `provider` est omis, OpenClaw détecte automatiquement le premier fournisseur web-fetch
  prêt à partir des identifiants disponibles. Aujourd'hui, le fournisseur groupé est Firecrawl.
- Si Readability est désactivé, `web_fetch` passe directement au repli du
  fournisseur sélectionné. Si aucun fournisseur n'est disponible, il échoue de manière fermée.

## Limites et sécurité

- `maxChars` est limité à `tools.web.fetch.maxCharsCap`
- Le corps de la réponse est limité à `maxResponseBytes` avant analyse ; les réponses
  trop volumineuses sont tronquées avec un avertissement
- Les noms d'hôte privés/internes sont bloqués
- Les redirections sont vérifiées et limitées par `maxRedirects`
- `web_fetch` fonctionne au mieux -- certains sites nécessitent le [Web Browser](/tools/browser)

## Profils d'outils

Si vous utilisez des profils d'outils ou des listes d'autorisation, ajoutez `web_fetch` ou `group:web` :

```json5
{
  tools: {
    allow: ["web_fetch"],
    // ou : allow: ["group:web"]  (inclut web_fetch, web_search et x_search)
  },
}
```

## Lié

- [Web Search](/tools/web) -- rechercher sur le web avec plusieurs fournisseurs
- [Web Browser](/tools/browser) -- automatisation complète du navigateur pour les sites riches en JS
- [Firecrawl](/tools/firecrawl) -- outils Firecrawl de recherche et de scraping
