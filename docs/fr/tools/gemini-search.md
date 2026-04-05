---
read_when:
    - Vous voulez utiliser Gemini pour `web_search`
    - Vous avez besoin d’une `GEMINI_API_KEY`
    - Vous voulez l’ancrage Google Search
summary: Recherche web Gemini avec ancrage Google Search
title: Recherche Gemini
x-i18n:
    generated_at: "2026-04-05T12:56:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Recherche Gemini

OpenClaw prend en charge les modèles Gemini avec
[l’ancrage Google Search](https://ai.google.dev/gemini-api/docs/grounding)
intégré, qui renvoie des réponses synthétisées par l’IA appuyées par des
résultats Google Search en direct avec citations.

## Obtenir une clé API

<Steps>
  <Step title="Créer une clé">
    Accédez à [Google AI Studio](https://aistudio.google.com/apikey) et créez une
    clé API.
  </Step>
  <Step title="Stocker la clé">
    Définissez `GEMINI_API_KEY` dans l’environnement de la Gateway, ou configurez-la via :

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
            model: "gemini-2.5-flash", // par défaut
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

**Alternative par variable d’environnement :** définissez `GEMINI_API_KEY` dans l’environnement de la Gateway.
Pour une installation Gateway, placez-la dans `~/.openclaw/.env`.

## Fonctionnement

Contrairement aux fournisseurs de recherche traditionnels qui renvoient une liste de liens et d’extraits,
Gemini utilise l’ancrage Google Search pour produire des réponses synthétisées par l’IA avec
des citations intégrées. Les résultats incluent à la fois la réponse synthétisée et les URL
sources.

- Les URL de citation issues de l’ancrage Gemini sont automatiquement résolues à partir des URL de redirection Google
  vers des URL directes.
- La résolution des redirections utilise le chemin de protection SSRF (HEAD + vérifications de redirection +
  validation http/https) avant de renvoyer l’URL de citation finale.
- La résolution des redirections utilise les valeurs par défaut strictes de SSRF, donc les redirections vers
  des cibles privées/internes sont bloquées.

## Paramètres pris en charge

La recherche Gemini prend en charge `query`.

`count` est accepté pour la compatibilité partagée avec `web_search`, mais l’ancrage Gemini
renvoie toujours une seule réponse synthétisée avec citations plutôt qu’une liste
de N résultats.

Les filtres spécifiques au fournisseur comme `country`, `language`, `freshness` et
`domain_filter` ne sont pas pris en charge.

## Sélection du modèle

Le modèle par défaut est `gemini-2.5-flash` (rapide et rentable). Tout modèle Gemini
prenant en charge l’ancrage peut être utilisé via
`plugins.entries.google.config.webSearch.model`.

## Voir aussi

- [Vue d’ensemble de la recherche web](/tools/web) -- tous les fournisseurs et la détection automatique
- [Brave Search](/tools/brave-search) -- résultats structurés avec extraits
- [Perplexity Search](/tools/perplexity-search) -- résultats structurés + extraction de contenu
