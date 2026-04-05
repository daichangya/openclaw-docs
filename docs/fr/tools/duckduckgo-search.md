---
read_when:
    - Vous voulez un fournisseur de recherche web ne nécessitant aucune clé API
    - Vous voulez utiliser DuckDuckGo pour `web_search`
    - Vous avez besoin d'un secours de recherche sans configuration
summary: Recherche web DuckDuckGo -- fournisseur de secours sans clé (expérimental, basé sur HTML)
title: Recherche DuckDuckGo
x-i18n:
    generated_at: "2026-04-05T12:56:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# Recherche DuckDuckGo

OpenClaw prend en charge DuckDuckGo comme fournisseur `web_search` **sans clé**. Aucune clé API ni aucun compte n'est requis.

<Warning>
  DuckDuckGo est une intégration **expérimentale et non officielle** qui extrait les résultats des pages de recherche non JavaScript de DuckDuckGo — et non d'une API officielle. Attendez-vous à des dysfonctionnements occasionnels dus aux pages de défi anti-bot ou aux changements de HTML.
</Warning>

## Configuration

Aucune clé API nécessaire — définissez simplement DuckDuckGo comme fournisseur :

<Steps>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Config

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Paramètres facultatifs au niveau du plugin pour la région et SafeSearch :

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Paramètres de l'outil

| Parameter    | Description                                                |
| ------------ | ---------------------------------------------------------- |
| `query`      | Requête de recherche (obligatoire)                         |
| `count`      | Résultats à renvoyer (1-10, par défaut : 5)                |
| `region`     | Code région DuckDuckGo (par ex. `us-en`, `uk-en`, `de-de`) |
| `safeSearch` | Niveau SafeSearch : `strict`, `moderate` (par défaut) ou `off` |

La région et SafeSearch peuvent également être définis dans la config du plugin (voir ci-dessus) — les paramètres de l'outil remplacent les valeurs de config pour chaque requête.

## Remarques

- **Aucune clé API** — fonctionne immédiatement, sans configuration
- **Expérimental** — collecte les résultats à partir des pages de recherche HTML non JavaScript de DuckDuckGo, et non d'une API ou d'un SDK officiel
- **Risque de défi anti-bot** — DuckDuckGo peut afficher des CAPTCHAs ou bloquer les requêtes en cas d'usage intensif ou automatisé
- **Analyse HTML** — les résultats dépendent de la structure de la page, qui peut changer sans préavis
- **Ordre d'auto-détection** — DuckDuckGo est le premier secours sans clé (ordre 100) dans l'auto-détection. Les fournisseurs avec API configurée s'exécutent d'abord, puis Ollama Web Search (ordre 110), puis SearXNG (ordre 200)
- **SafeSearch utilise `moderate` par défaut** lorsqu'il n'est pas configuré

<Tip>
  Pour un usage en production, envisagez [Brave Search](/tools/brave-search) (niveau gratuit disponible) ou un autre fournisseur reposant sur une API.
</Tip>

## Liens connexes

- [Vue d'ensemble de Web Search](/tools/web) -- tous les fournisseurs et l'auto-détection
- [Brave Search](/tools/brave-search) -- résultats structurés avec niveau gratuit
- [Exa Search](/tools/exa-search) -- recherche neuronale avec extraction de contenu
