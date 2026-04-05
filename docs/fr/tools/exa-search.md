---
read_when:
    - Vous souhaitez utiliser Exa pour `web_search`
    - Vous avez besoin d'un `EXA_API_KEY`
    - Vous voulez une recherche neuronale ou l'extraction de contenu
summary: Recherche Exa AI -- recherche neuronale et par mots-clés avec extraction de contenu
title: Recherche Exa
x-i18n:
    generated_at: "2026-04-05T12:56:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# Recherche Exa

OpenClaw prend en charge [Exa AI](https://exa.ai/) comme fournisseur `web_search`. Exa
propose des modes de recherche neuronale, par mots-clés et hybrides avec une
extraction de contenu intégrée (surlignages, texte, résumés).

## Obtenir une clé API

<Steps>
  <Step title="Créer un compte">
    Inscrivez-vous sur [exa.ai](https://exa.ai/) et générez une clé API depuis votre
    tableau de bord.
  </Step>
  <Step title="Stocker la clé">
    Définissez `EXA_API_KEY` dans l'environnement de la Gateway, ou configurez-la via :

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // facultatif si EXA_API_KEY est défini
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternative par environnement :** définissez `EXA_API_KEY` dans l'environnement de la Gateway.
Pour une installation de gateway, placez-la dans `~/.openclaw/.env`.

## Paramètres de l'outil

| Parameter     | Description                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| `query`       | Requête de recherche (obligatoire)                                             |
| `count`       | Résultats à renvoyer (1-100)                                                   |
| `type`        | Mode de recherche : `auto`, `neural`, `fast`, `deep`, `deep-reasoning` ou `instant` |
| `freshness`   | Filtre temporel : `day`, `week`, `month` ou `year`                             |
| `date_after`  | Résultats après cette date (YYYY-MM-DD)                                        |
| `date_before` | Résultats avant cette date (YYYY-MM-DD)                                        |
| `contents`    | Options d'extraction de contenu (voir ci-dessous)                              |

### Extraction de contenu

Exa peut renvoyer du contenu extrait en plus des résultats de recherche. Passez un
objet `contents` pour l'activer :

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // texte complet de la page
    highlights: { numSentences: 3 }, // phrases clés
    summary: true, // résumé IA
  },
});
```

| Contents option | Type                                                                  | Description                 |
| --------------- | --------------------------------------------------------------------- | --------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Extraire le texte complet de la page |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extraire les phrases clés   |
| `summary`       | `boolean \| { query }`                                                | Résumé généré par IA        |

### Modes de recherche

| Mode             | Description                              |
| ---------------- | ---------------------------------------- |
| `auto`           | Exa choisit le meilleur mode (par défaut) |
| `neural`         | Recherche sémantique / basée sur le sens |
| `fast`           | Recherche rapide par mots-clés           |
| `deep`           | Recherche approfondie complète           |
| `deep-reasoning` | Recherche approfondie avec raisonnement  |
| `instant`        | Résultats les plus rapides               |

## Notes

- Si aucune option `contents` n'est fournie, Exa utilise par défaut `{ highlights: true }`
  afin que les résultats incluent des extraits de phrases clés
- Les résultats conservent les champs `highlightScores` et `summary` de la réponse
  API Exa lorsqu'ils sont disponibles
- Les descriptions des résultats sont résolues d'abord à partir des surlignages, puis du résumé, puis du
  texte complet — selon ce qui est disponible
- `freshness` et `date_after`/`date_before` ne peuvent pas être combinés — utilisez un seul
  mode de filtrage temporel
- Jusqu'à 100 résultats peuvent être renvoyés par requête (sous réserve des limites
  du type de recherche Exa)
- Les résultats sont mis en cache pendant 15 minutes par défaut (configurable via
  `cacheTtlMinutes`)
- Exa est une intégration officielle d'API avec des réponses JSON structurées

## Lié

- [Vue d'ensemble de Web Search](/tools/web) -- tous les fournisseurs et la détection automatique
- [Brave Search](/tools/brave-search) -- résultats structurés avec filtres de pays/langue
- [Perplexity Search](/tools/perplexity-search) -- résultats structurés avec filtrage de domaine
