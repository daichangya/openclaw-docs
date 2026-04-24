---
read_when:
    - Vous voulez utiliser Gemini pour `web_search`
    - Vous avez besoin d’un `GEMINI_API_KEY`
    - Vous voulez l’ancrage Google Search
summary: Recherche web Gemini avec ancrage Google Search
title: Recherche Gemini
x-i18n:
    generated_at: "2026-04-24T07:36:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw prend en charge les modèles Gemini avec
[l’ancrage Google Search](https://ai.google.dev/gemini-api/docs/grounding) intégré,
qui renvoie des réponses synthétisées par IA adossées à des résultats Google Search en direct avec
citations.

## Obtenir une clé API

<Steps>
  <Step title="Créer une clé">
    Allez sur [Google AI Studio](https://aistudio.google.com/apikey) et créez une
    clé API.
  </Step>
  <Step title="Stocker la clé">
    Définissez `GEMINI_API_KEY` dans l’environnement du Gateway, ou configurez via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuration

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // facultatif si GEMINI_API_KEY est défini
            model: "gemini-2.5-flash", // valeur par défaut
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Alternative par variable d’environnement :** définissez `GEMINI_API_KEY` dans l’environnement du Gateway.
Pour une installation de gateway, placez-la dans `~/.openclaw/.env`.

## Comment cela fonctionne

Contrairement aux fournisseurs de recherche traditionnels qui renvoient une liste de liens et d’extraits,
Gemini utilise l’ancrage Google Search pour produire des réponses synthétisées par IA avec
des citations en ligne. Les résultats incluent à la fois la réponse synthétisée et les URLs
sources.

- Les URLs de citation issues de l’ancrage Gemini sont automatiquement résolues des
  URLs de redirection Google vers des URLs directes.
- La résolution des redirections utilise le chemin de garde SSRF (HEAD + contrôles de redirection +
  validation http/https) avant de renvoyer l’URL de citation finale.
- La résolution des redirections utilise des valeurs strictes SSRF par défaut, donc les redirections vers
  des cibles privées/internes sont bloquées.

## Paramètres pris en charge

La recherche Gemini prend en charge `query`.

`count` est accepté pour la compatibilité avec `web_search` partagé, mais l’ancrage Gemini
renvoie quand même une seule réponse synthétisée avec citations plutôt qu’une liste
de N résultats.

Les filtres spécifiques au fournisseur comme `country`, `language`, `freshness` et
`domain_filter` ne sont pas pris en charge.

## Sélection du modèle

Le modèle par défaut est `gemini-2.5-flash` (rapide et économique). Tout modèle Gemini
qui prend en charge l’ancrage peut être utilisé via
`plugins.entries.google.config.webSearch.model`.

## Associé

- [Vue d’ensemble de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Recherche Brave](/fr/tools/brave-search) -- résultats structurés avec extraits
- [Recherche Perplexity](/fr/tools/perplexity-search) -- résultats structurés + extraction de contenu
