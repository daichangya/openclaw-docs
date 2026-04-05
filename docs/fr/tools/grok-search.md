---
read_when:
    - Vous voulez utiliser Grok pour `web_search`
    - Vous avez besoin d’une `XAI_API_KEY` pour la recherche web
summary: Recherche web Grok via les réponses xAI ancrées sur le web
title: Recherche Grok
x-i18n:
    generated_at: "2026-04-05T12:56:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Recherche Grok

OpenClaw prend en charge Grok comme fournisseur `web_search`, en utilisant des
réponses xAI ancrées sur le web pour produire des réponses synthétisées par l’IA appuyées par des résultats de recherche en direct
avec citations.

La même `XAI_API_KEY` peut également alimenter l’outil intégré `x_search` pour la recherche de publications sur X
(anciennement Twitter). Si vous stockez la clé sous
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw la réutilise désormais aussi comme solution de secours pour le
fournisseur de modèles xAI intégré.

Pour les métriques X au niveau des publications, comme les reposts, les réponses, les signets ou les vues, privilégiez
`x_search` avec l’URL exacte de la publication ou l’ID du statut plutôt qu’une requête de recherche
large.

## Onboarding et configuration

Si vous choisissez **Grok** pendant :

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw peut afficher une étape de suivi distincte pour activer `x_search` avec la même
`XAI_API_KEY`. Cette étape de suivi :

- n’apparaît qu’après avoir choisi Grok pour `web_search`
- n’est pas un choix distinct de fournisseur de recherche web de premier niveau
- peut définir facultativement le modèle `x_search` pendant le même flux

Si vous l’ignorez, vous pourrez activer ou modifier `x_search` plus tard dans la configuration.

## Obtenir une clé API

<Steps>
  <Step title="Créer une clé">
    Obtenez une clé API auprès de [xAI](https://console.x.ai/).
  </Step>
  <Step title="Stocker la clé">
    Définissez `XAI_API_KEY` dans l’environnement de la Gateway, ou configurez-la via :

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // facultatif si XAI_API_KEY est défini
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternative par variable d’environnement :** définissez `XAI_API_KEY` dans l’environnement de la Gateway.
Pour une installation Gateway, placez-la dans `~/.openclaw/.env`.

## Fonctionnement

Grok utilise des réponses xAI ancrées sur le web pour synthétiser des réponses avec des
citations intégrées, de manière similaire à l’approche d’ancrage Google Search de Gemini.

## Paramètres pris en charge

La recherche Grok prend en charge `query`.

`count` est accepté pour la compatibilité partagée avec `web_search`, mais Grok
renvoie toujours une seule réponse synthétisée avec citations plutôt qu’une liste
de N résultats.

Les filtres spécifiques au fournisseur ne sont actuellement pas pris en charge.

## Voir aussi

- [Vue d’ensemble de la recherche web](/tools/web) -- tous les fournisseurs et la détection automatique
- [x_search dans la recherche web](/tools/web#x_search) -- recherche X de premier plan via xAI
- [Recherche Gemini](/tools/gemini-search) -- réponses synthétisées par l’IA via l’ancrage Google
