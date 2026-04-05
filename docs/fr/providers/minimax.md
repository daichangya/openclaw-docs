---
read_when:
    - Vous souhaitez utiliser des modèles MiniMax dans OpenClaw
    - Vous avez besoin d'instructions de configuration pour MiniMax
summary: Utiliser les modèles MiniMax dans OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-05T12:52:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 353e1d9ce1b48c90ccaba6cc0109e839c473ca3e65d0c5d8ba744e9011c2bf45
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

Le fournisseur MiniMax d'OpenClaw utilise par défaut **MiniMax M2.7**.

MiniMax fournit également :

- une synthèse vocale intégrée via T2A v2
- une compréhension d'image intégrée via `MiniMax-VL-01`
- un `web_search` intégré via l'API de recherche MiniMax Coding Plan

Répartition des fournisseurs :

- `minimax` : fournisseur de texte par clé API, plus génération d'images intégrée, compréhension d'image, parole et recherche web
- `minimax-portal` : fournisseur de texte OAuth, plus génération d'images intégrée et compréhension d'image

## Gamme de modèles

- `MiniMax-M2.7` : modèle de raisonnement hébergé par défaut.
- `MiniMax-M2.7-highspeed` : niveau de raisonnement M2.7 plus rapide.
- `image-01` : modèle de génération d'image (génération et édition image vers image).

## Génération d'images

Le plugin MiniMax enregistre le modèle `image-01` pour l'outil `image_generate`. Il prend en charge :

- **La génération de texte vers image** avec contrôle du ratio d'aspect.
- **L'édition image vers image** (référence de sujet) avec contrôle du ratio d'aspect.
- Jusqu'à **9 images de sortie** par requête.
- Jusqu'à **1 image de référence** par requête d'édition.
- Ratios d'aspect pris en charge : `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`.

Pour utiliser MiniMax pour la génération d'images, définissez-le comme fournisseur de génération d'images :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Le plugin utilise la même `MINIMAX_API_KEY` ou la même authentification OAuth que les modèles texte. Aucune configuration supplémentaire n'est nécessaire si MiniMax est déjà configuré.

`minimax` et `minimax-portal` enregistrent tous deux `image_generate` avec le même
modèle `image-01`. Les configurations par clé API utilisent `MINIMAX_API_KEY` ; les configurations OAuth peuvent utiliser
à la place le chemin d'authentification intégré `minimax-portal`.

Lorsque l'onboarding ou la configuration par clé API écrit des entrées explicites `models.providers.minimax`,
OpenClaw matérialise `MiniMax-M2.7` et
`MiniMax-M2.7-highspeed` avec `input: ["text", "image"]`.

Le catalogue de texte MiniMax intégré lui-même reste des métadonnées texte uniquement jusqu'à ce que cette configuration explicite du fournisseur existe. La compréhension d'image est exposée séparément via le fournisseur média appartenant au plugin `MiniMax-VL-01`.

## Compréhension d'image

Le plugin MiniMax enregistre la compréhension d'image séparément du catalogue
texte :

- `minimax` : modèle d'image par défaut `MiniMax-VL-01`
- `minimax-portal` : modèle d'image par défaut `MiniMax-VL-01`

C'est pourquoi le routage média automatique peut utiliser la compréhension d'image MiniMax même
lorsque le catalogue du fournisseur de texte intégré affiche encore des références de chat M2.7 limitées au texte.

## Recherche web

Le plugin MiniMax enregistre également `web_search` via l'API de recherche
MiniMax Coding Plan.

- ID du fournisseur : `minimax`
- Résultats structurés : titres, URLs, extraits, requêtes associées
- Variable d'environnement préférée : `MINIMAX_CODE_PLAN_KEY`
- Alias d'environnement accepté : `MINIMAX_CODING_API_KEY`
- Repli de compatibilité : `MINIMAX_API_KEY` lorsqu'il pointe déjà vers un jeton coding-plan
- Réutilisation de région : `plugins.entries.minimax.config.webSearch.region`, puis `MINIMAX_API_HOST`, puis URLs de base du fournisseur MiniMax
- La recherche reste sur l'ID de fournisseur `minimax` ; la configuration OAuth CN/globale peut tout de même orienter indirectement la région via `models.providers.minimax-portal.baseUrl`

La configuration se trouve sous `plugins.entries.minimax.config.webSearch.*`.
Voir [MiniMax Search](/tools/minimax-search).

## Choisir une configuration

### MiniMax OAuth (Coding Plan) - recommandé

**Idéal pour :** une configuration rapide avec MiniMax Coding Plan via OAuth, sans clé API requise.

Authentifiez-vous avec le choix OAuth régional explicite :

```bash
openclaw onboard --auth-choice minimax-global-oauth
# or
openclaw onboard --auth-choice minimax-cn-oauth
```

Correspondance des choix :

- `minimax-global-oauth` : utilisateurs internationaux (`api.minimax.io`)
- `minimax-cn-oauth` : utilisateurs en Chine (`api.minimaxi.com`)

Voir le README du package du plugin MiniMax dans le dépôt OpenClaw pour plus de détails.

### MiniMax M2.7 (clé API)

**Idéal pour :** MiniMax hébergé avec API compatible Anthropic.

Configurer via CLI :

- Onboarding interactif :

```bash
openclaw onboard --auth-choice minimax-global-api
# or
openclaw onboard --auth-choice minimax-cn-api
```

- `minimax-global-api` : utilisateurs internationaux (`api.minimax.io`)
- `minimax-cn-api` : utilisateurs en Chine (`api.minimaxi.com`)

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Sur le chemin de streaming compatible Anthropic, OpenClaw désactive désormais
la réflexion MiniMax par défaut sauf si vous définissez explicitement `thinking` vous-même. Le
point de terminaison de streaming de MiniMax émet `reasoning_content` dans des blocs delta de style OpenAI
au lieu de blocs de réflexion Anthropic natifs, ce qui peut exposer le raisonnement interne
dans la sortie visible si cela reste implicitement activé.

### MiniMax M2.7 comme repli (exemple)

**Idéal pour :** conserver votre modèle principal le plus puissant de dernière génération comme primaire, avec bascule vers MiniMax M2.7.
L'exemple ci-dessous utilise Opus comme modèle principal concret ; remplacez-le par votre modèle principal de dernière génération préféré.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

## Configurer via `openclaw configure`

Utilisez l'assistant de configuration interactif pour définir MiniMax sans modifier le JSON :

1. Exécutez `openclaw configure`.
2. Sélectionnez **Model/auth**.
3. Choisissez une option d'authentification **MiniMax**.
4. Choisissez votre modèle par défaut lorsque l'invite s'affiche.

Choix actuels d'authentification MiniMax dans l'assistant/CLI :

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## Options de configuration

- `models.providers.minimax.baseUrl` : préférez `https://api.minimax.io/anthropic` (compatible Anthropic) ; `https://api.minimax.io/v1` est facultatif pour les charges utiles compatibles OpenAI.
- `models.providers.minimax.api` : préférez `anthropic-messages` ; `openai-completions` est facultatif pour les charges utiles compatibles OpenAI.
- `models.providers.minimax.apiKey` : clé API MiniMax (`MINIMAX_API_KEY`).
- `models.providers.minimax.models` : définir `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models` : définir des alias pour les modèles que vous souhaitez dans la liste d'autorisation.
- `models.mode` : conservez `merge` si vous souhaitez ajouter MiniMax aux côtés des modèles intégrés.

## Remarques

- Les références de modèle suivent le chemin d'authentification :
  - configuration par clé API : `minimax/<model>`
  - configuration OAuth : `minimax-portal/<model>`
- Modèle de chat par défaut : `MiniMax-M2.7`
- Modèle de chat alternatif : `MiniMax-M2.7-highspeed`
- Sur `api: "anthropic-messages"`, OpenClaw injecte
  `thinking: { type: "disabled" }` sauf si la réflexion est déjà explicitement définie dans
  params/config.
- `/fast on` ou `params.fastMode: true` réécrit `MiniMax-M2.7` en
  `MiniMax-M2.7-highspeed` sur le chemin de flux compatible Anthropic.
- L'onboarding et la configuration directe par clé API écrivent des définitions explicites de modèle avec
  `input: ["text", "image"]` pour les deux variantes M2.7
- Le catalogue du fournisseur intégré expose actuellement les références de chat comme des métadonnées texte uniquement jusqu'à l'existence d'une configuration explicite du fournisseur MiniMax
- API d'utilisation Coding Plan : `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (nécessite une clé coding plan).
- OpenClaw normalise l'utilisation du coding plan MiniMax au même affichage `% left`
  utilisé par les autres fournisseurs. Les champs bruts `usage_percent` / `usagePercent` de MiniMax
  correspondent au quota restant, pas au quota consommé, donc OpenClaw les inverse.
  Les champs basés sur le comptage sont prioritaires lorsqu'ils sont présents. Lorsque l'API renvoie `model_remains`,
  OpenClaw privilégie l'entrée du modèle de chat, dérive le libellé de fenêtre à partir de
  `start_time` / `end_time` lorsque nécessaire, et inclut le nom du modèle sélectionné
  dans le libellé du plan afin que les fenêtres coding-plan soient plus faciles à distinguer.
- Les instantanés d'utilisation traitent `minimax`, `minimax-cn` et `minimax-portal` comme la
  même surface de quota MiniMax, et privilégient l'OAuth MiniMax stocké avant de revenir
  aux variables d'environnement de clé Coding Plan.
- Mettez à jour les valeurs tarifaires dans `models.json` si vous avez besoin d'un suivi précis des coûts.
- Lien de parrainage pour MiniMax Coding Plan (10 % de réduction) : [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Voir [/concepts/model-providers](/concepts/model-providers) pour les règles de fournisseur.
- Utilisez `openclaw models list` pour confirmer l'ID actuel du fournisseur, puis changez-le avec
  `openclaw models set minimax/MiniMax-M2.7` ou
  `openclaw models set minimax-portal/MiniMax-M2.7`.

## Dépannage

### "Unknown model: minimax/MiniMax-M2.7"

Cela signifie généralement que le **fournisseur MiniMax n'est pas configuré** (aucune entrée
de fournisseur correspondante et aucune clé/env/profil d'authentification MiniMax trouvé). Un correctif pour cette
détection est disponible dans **2026.1.12**. Corrigez cela en :

- mettant à niveau vers **2026.1.12** (ou en exécutant depuis le code source `main`), puis en redémarrant la gateway.
- exécutant `openclaw configure` et en sélectionnant une option d'authentification **MiniMax**, ou
- ajoutant manuellement le bloc `models.providers.minimax` ou
  `models.providers.minimax-portal` correspondant, ou
- définissant `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, ou un profil d'authentification MiniMax
  afin que le fournisseur correspondant puisse être injecté.

Assurez-vous que l'ID du modèle est **sensible à la casse** :

- chemin clé API : `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
- chemin OAuth : `minimax-portal/MiniMax-M2.7` ou
  `minimax-portal/MiniMax-M2.7-highspeed`

Vérifiez ensuite à nouveau avec :

```bash
openclaw models list
```
