---
read_when:
    - Vous souhaitez configurer Perplexity comme provider de recherche web
    - Vous avez besoin de la clé API Perplexity ou de la configuration du proxy OpenRouter
summary: Configuration du provider de recherche web Perplexity (clé API, modes de recherche, filtrage)
title: Perplexity (provider)
x-i18n:
    generated_at: "2026-04-05T12:52:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9082d15d6a36a096e21efe8cee78e4b8643252225520f5b96a0b99cf5a7a4b
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (provider de recherche web)

Le plugin Perplexity fournit des capacités de recherche web via l’API Perplexity
Search ou Perplexity Sonar via OpenRouter.

<Note>
Cette page couvre la configuration du **provider** Perplexity. Pour l’**outil**
Perplexity (comment l’agent l’utilise), voir [Perplexity tool](/tools/perplexity-search).
</Note>

- Type : provider de recherche web (pas un provider de modèles)
- Authentification : `PERPLEXITY_API_KEY` (direct) ou `OPENROUTER_API_KEY` (via OpenRouter)
- Chemin de configuration : `plugins.entries.perplexity.config.webSearch.apiKey`

## Démarrage rapide

1. Définissez la clé API :

```bash
openclaw configure --section web
```

Ou définissez-la directement :

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. L’agent utilisera automatiquement Perplexity pour les recherches web lorsqu’il est configuré.

## Modes de recherche

Le plugin sélectionne automatiquement le transport selon le préfixe de la clé API :

| Préfixe de clé | Transport                    | Fonctionnalités                                  |
| -------------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`        | API Perplexity Search native | Résultats structurés, filtres de domaine/langue/date |
| `sk-or-`       | OpenRouter (Sonar)           | Réponses synthétisées par IA avec citations      |

## Filtrage de l’API native

Lors de l’utilisation de l’API Perplexity native (clé `pplx-`), les recherches prennent en charge :

- **Pays** : code pays à 2 lettres
- **Langue** : code langue ISO 639-1
- **Plage de dates** : jour, semaine, mois, année
- **Filtres de domaine** : liste d’autorisation/liste de refus (20 domaines max)
- **Budget de contenu** : `max_tokens`, `max_tokens_per_page`

## Remarque sur l’environnement

Si la Gateway s’exécute comme démon (launchd/systemd), assurez-vous que
`PERPLEXITY_API_KEY` est disponible pour ce processus (par exemple dans
`~/.openclaw/.env` ou via `env.shellEnv`).
