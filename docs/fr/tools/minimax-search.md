---
read_when:
    - Vous souhaitez utiliser MiniMax pour `web_search`
    - Vous avez besoin d’une clé MiniMax Coding Plan
    - Vous souhaitez obtenir des indications sur l’hôte de recherche MiniMax CN/global
summary: Recherche MiniMax via l’API de recherche Coding Plan
title: Recherche MiniMax
x-i18n:
    generated_at: "2026-04-05T12:56:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# Recherche MiniMax

OpenClaw prend en charge MiniMax comme fournisseur `web_search` via l’API de recherche
MiniMax Coding Plan. Elle renvoie des résultats de recherche structurés avec des titres, des URL,
des extraits et des requêtes associées.

## Obtenir une clé Coding Plan

<Steps>
  <Step title="Créer une clé">
    Créez ou copiez une clé MiniMax Coding Plan depuis
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Stocker la clé">
    Définissez `MINIMAX_CODE_PLAN_KEY` dans l’environnement Gateway, ou configurez via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accepte également `MINIMAX_CODING_API_KEY` comme alias de variable d’environnement. `MINIMAX_API_KEY`
est toujours lu comme solution de repli de compatibilité lorsqu’il pointe déjà vers un jeton coding-plan.

## Configuration

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if MINIMAX_CODE_PLAN_KEY is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Alternative par variable d’environnement :** définissez `MINIMAX_CODE_PLAN_KEY` dans l’environnement Gateway.
Pour une installation Gateway, placez-la dans `~/.openclaw/.env`.

## Sélection de la région

La recherche MiniMax utilise ces points de terminaison :

- Global : `https://api.minimax.io/v1/coding_plan/search`
- CN : `https://api.minimaxi.com/v1/coding_plan/search`

Si `plugins.entries.minimax.config.webSearch.region` n’est pas défini, OpenClaw résout
la région dans cet ordre :

1. `tools.web.search.minimax.region` / `webSearch.region` appartenant au plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Cela signifie que l’onboarding CN ou `MINIMAX_API_HOST=https://api.minimaxi.com/...`
conserve automatiquement aussi la recherche MiniMax sur l’hôte CN.

Même lorsque vous avez authentifié MiniMax via le chemin OAuth `minimax-portal`,
la recherche web s’enregistre toujours avec l’identifiant de fournisseur `minimax` ; l’URL de base du fournisseur OAuth
n’est utilisée que comme indication de région pour la sélection de l’hôte CN/global.

## Paramètres pris en charge

La recherche MiniMax prend en charge :

- `query`
- `count` (OpenClaw tronque la liste des résultats renvoyés au nombre demandé)

Les filtres spécifiques au fournisseur ne sont pas actuellement pris en charge.

## Lié

- [Vue d’ensemble de la recherche web](/tools/web) -- tous les fournisseurs et la détection automatique
- [MiniMax](/fr/providers/minimax) -- configuration du modèle, de l’image, de la parole et de l’authentification
