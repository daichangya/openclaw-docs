---
read_when:
    - Vous souhaitez utiliser MiniMax pour `web_search`
    - Vous avez besoin d’une clé MiniMax Coding Plan
    - Vous souhaitez des indications sur les hôtes de recherche MiniMax CN/global
summary: Recherche MiniMax via l’API de recherche du Coding Plan
title: Recherche MiniMax
x-i18n:
    generated_at: "2026-04-24T07:37:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw prend en charge MiniMax comme fournisseur `web_search` via l’API de recherche Coding Plan de MiniMax. Elle renvoie des résultats de recherche structurés avec titres, URL, extraits et requêtes associées.

## Obtenir une clé Coding Plan

<Steps>
  <Step title="Créer une clé">
    Créez ou copiez une clé MiniMax Coding Plan depuis
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Stocker la clé">
    Définissez `MINIMAX_CODE_PLAN_KEY` dans l’environnement du Gateway, ou configurez via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accepte aussi `MINIMAX_CODING_API_KEY` comme alias de variable d’environnement. `MINIMAX_API_KEY`
est encore lu comme repli de compatibilité lorsqu’il pointe déjà vers un jeton coding-plan.

## Configuration

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // facultatif si MINIMAX_CODE_PLAN_KEY est défini
            region: "global", // ou "cn"
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

**Alternative via environnement :** définissez `MINIMAX_CODE_PLAN_KEY` dans l’environnement du Gateway.
Pour une installation gateway, placez-la dans `~/.openclaw/.env`.

## Sélection de région

MiniMax Search utilise ces points de terminaison :

- Global : `https://api.minimax.io/v1/coding_plan/search`
- CN : `https://api.minimaxi.com/v1/coding_plan/search`

Si `plugins.entries.minimax.config.webSearch.region` n’est pas défini, OpenClaw résout
la région dans cet ordre :

1. `tools.web.search.minimax.region` / `webSearch.region` appartenant au plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Cela signifie que l’onboarding CN ou `MINIMAX_API_HOST=https://api.minimaxi.com/...`
garde automatiquement MiniMax Search sur l’hôte CN également.

Même lorsque vous avez authentifié MiniMax via le chemin OAuth `minimax-portal`,
la recherche web s’enregistre toujours avec l’identifiant de fournisseur `minimax` ; l’URL de base du fournisseur OAuth
n’est utilisée que comme indication de région pour la sélection d’hôte CN/global.

## Paramètres pris en charge

MiniMax Search prend en charge :

- `query`
- `count` (OpenClaw tronque la liste de résultats renvoyée au nombre demandé)

Les filtres spécifiques au fournisseur ne sont pas actuellement pris en charge.

## Lié

- [Aperçu Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [MiniMax](/fr/providers/minimax) -- configuration du modèle, de l’image, de la parole et de l’authentification
