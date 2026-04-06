---
read_when:
    - Vous voulez utiliser les modèles Grok dans OpenClaw
    - Vous configurez l’authentification xAI ou les identifiants de modèle
summary: Utiliser les modèles Grok de xAI dans OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-06T03:11:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64bc899655427cc10bdc759171c7d1ec25ad9f1e4f9d803f1553d3d586c6d71d
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw inclut un plugin de fournisseur `xai` groupé pour les modèles Grok.

## Configuration

1. Créez une clé API dans la console xAI.
2. Définissez `XAI_API_KEY`, ou exécutez :

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Choisissez un modèle tel que :

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw utilise désormais l’API xAI Responses comme transport xAI groupé. La même
`XAI_API_KEY` peut également alimenter `web_search` basé sur Grok, `x_search` de première classe
et `code_execution` distant.
Si vous stockez une clé xAI sous `plugins.entries.xai.config.webSearch.apiKey`,
le fournisseur de modèles xAI groupé réutilise désormais aussi cette clé comme solution de repli.
Le réglage de `code_execution` se trouve sous `plugins.entries.xai.config.codeExecution`.

## Catalogue actuel des modèles groupés

OpenClaw inclut désormais ces familles de modèles xAI prêtes à l’emploi :

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Le plugin résout également à la volée les identifiants plus récents `grok-4*` et `grok-code-fast*` lorsqu’ils
suivent la même forme d’API.

Remarques sur les modèles rapides :

- `grok-4-fast`, `grok-4-1-fast` et les variantes `grok-4.20-beta-*` sont les
  références Grok actuellement compatibles avec les images dans le catalogue groupé.
- `/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
  réécrit les requêtes xAI natives comme suit :
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Les alias de compatibilité historiques continuent de se normaliser vers les identifiants groupés canoniques. Par
exemple :

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Recherche web

Le fournisseur groupé de recherche web `grok` utilise aussi `XAI_API_KEY` :

```bash
openclaw config set tools.web.search.provider grok
```

## Génération vidéo

Le plugin `xai` groupé enregistre également la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `xai/grok-imagine-video`
- Modes : text-to-video, image-to-video et flux distants de modification/extension vidéo
- Prend en charge `aspectRatio` et `resolution`
- Limite actuelle : les tampons vidéo locaux ne sont pas acceptés ; utilisez des URL `http(s)`
  distantes pour les entrées de référence/édition vidéo

Pour utiliser xAI comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "xai/grok-imagine-video",
      },
    },
  },
}
```

Voir [Génération vidéo](/tools/video-generation) pour les paramètres
partagés de l’outil, la sélection du fournisseur et le comportement de bascule.

## Limites connues

- L’authentification se fait uniquement par clé API pour le moment. Il n’existe pas encore de flux xAI OAuth/device-code dans OpenClaw.
- `grok-4.20-multi-agent-experimental-beta-0304` n’est pas pris en charge sur le chemin normal du fournisseur xAI car il nécessite une surface API amont différente du transport xAI standard d’OpenClaw.

## Remarques

- OpenClaw applique automatiquement des corrections de compatibilité spécifiques à xAI pour les schémas d’outils et les appels d’outils sur le chemin d’exécution partagé.
- Les requêtes xAI natives utilisent par défaut `tool_stream: true`. Définissez
  `agents.defaults.models["xai/<model>"].params.tool_stream` sur `false` pour
  le désactiver.
- Le wrapper xAI groupé retire les drapeaux stricts de schéma d’outil non pris en charge et
  les clés de charge utile de reasoning avant d’envoyer des requêtes xAI natives.
- `web_search`, `x_search` et `code_execution` sont exposés comme outils OpenClaw. OpenClaw active le built-in xAI spécifique dont il a besoin dans chaque requête d’outil au lieu d’attacher tous les outils natifs à chaque tour de discussion.
- `x_search` et `code_execution` appartiennent au plugin xAI groupé plutôt que d’être codés en dur dans le runtime de modèle du noyau.
- `code_execution` est une exécution distante dans le sandbox xAI, et non un [`exec`](/fr/tools/exec) local.
- Pour une vue d’ensemble plus large des fournisseurs, voir [Fournisseurs de modèles](/fr/providers/index).
