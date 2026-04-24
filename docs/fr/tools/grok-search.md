---
read_when:
    - Vous souhaitez utiliser Grok pour `web_search`
    - Vous avez besoin d’un `XAI_API_KEY` pour la recherche web
summary: Recherche web Grok via des réponses xAI ancrées sur le web
title: Recherche Grok
x-i18n:
    generated_at: "2026-04-24T07:36:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

OpenClaw prend en charge Grok comme fournisseur `web_search`, en utilisant des
réponses xAI ancrées sur le web pour produire des réponses synthétisées par IA,
appuyées par des résultats de recherche en direct avec citations.

Le même `XAI_API_KEY` peut aussi alimenter l’outil intégré `x_search` pour la
recherche de publications X (anciennement Twitter). Si vous stockez la clé sous
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw la réutilise désormais
comme solution de repli pour le fournisseur de modèle xAI groupé également.

Pour les métriques X au niveau des publications, comme les reposts, réponses,
signets ou vues, préférez `x_search` avec l’URL exacte de la publication ou son
ID de statut plutôt qu’une requête de recherche large.

## Onboarding et configuration

Si vous choisissez **Grok** pendant :

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw peut afficher une étape de suivi séparée pour activer `x_search` avec le même
`XAI_API_KEY`. Cette étape de suivi :

- n’apparaît qu’après avoir choisi Grok pour `web_search`
- n’est pas un choix séparé de fournisseur de recherche web de premier niveau
- peut facultativement définir le modèle `x_search` dans le même flux

Si vous l’ignorez, vous pouvez activer ou modifier `x_search` plus tard dans la configuration.

## Obtenir une clé API

<Steps>
  <Step title="Créer une clé">
    Obtenez une clé API depuis [xAI](https://console.x.ai/).
  </Step>
  <Step title="Stocker la clé">
    Définissez `XAI_API_KEY` dans l’environnement du Gateway, ou configurez-la via :

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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
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

**Alternative par environnement :** définissez `XAI_API_KEY` dans l’environnement du Gateway.
Pour une installation gateway, placez-le dans `~/.openclaw/.env`.

## Fonctionnement

Grok utilise des réponses xAI ancrées sur le web pour synthétiser des réponses avec
des citations en ligne, de manière similaire à l’approche d’ancrage Google Search de Gemini.

## Paramètres pris en charge

La recherche Grok prend en charge `query`.

`count` est accepté pour la compatibilité partagée avec `web_search`, mais Grok renvoie
toujours une réponse synthétisée avec citations plutôt qu’une liste de N résultats.

Les filtres spécifiques au fournisseur ne sont pas actuellement pris en charge.

## Voir aussi

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [x_search dans Web Search](/fr/tools/web#x_search) -- recherche X de première classe via xAI
- [Gemini Search](/fr/tools/gemini-search) -- réponses synthétisées par IA via l’ancrage Google
