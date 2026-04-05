---
read_when:
    - Vous voulez utiliser les modèles Grok dans OpenClaw
    - Vous configurez l’authentification xAI ou les ID de modèles
summary: Utiliser les modèles Grok de xAI dans OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-05T12:52:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: d11f27b48c69eed6324595977bca3506c7709424eef64cc73899f8d049148b82
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw inclut un plugin de fournisseur `xai` intégré pour les modèles Grok.

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

OpenClaw utilise désormais l’API xAI Responses comme transport xAI intégré. La même
clé `XAI_API_KEY` peut aussi alimenter `web_search` adossé à Grok, `x_search` de première classe,
et `code_execution` distant.
Si vous stockez une clé xAI sous `plugins.entries.xai.config.webSearch.apiKey`,
le fournisseur de modèle xAI intégré la réutilise désormais aussi comme solution de repli.
Le réglage de `code_execution` se trouve sous `plugins.entries.xai.config.codeExecution`.

## Catalogue actuel de modèles intégrés

OpenClaw inclut désormais ces familles de modèles xAI prêtes à l’emploi :

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Le plugin résout aussi en avant les nouveaux ID `grok-4*` et `grok-code-fast*` lorsque
leur forme API reste identique.

Remarques sur les modèles rapides :

- `grok-4-fast`, `grok-4-1-fast`, et les variantes `grok-4.20-beta-*` sont les
  références Grok actuelles compatibles image dans le catalogue intégré.
- `/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
  réécrit les requêtes xAI natives comme suit :
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Les alias de compatibilité hérités continuent d’être normalisés vers les ID intégrés canoniques. Par
exemple :

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Recherche web

Le fournisseur de recherche web `grok` intégré utilise aussi `XAI_API_KEY` :

```bash
openclaw config set tools.web.search.provider grok
```

## Limites connues

- L’authentification n’est aujourd’hui possible que par clé API. Il n’existe pas encore de flux OAuth/device-code xAI dans OpenClaw.
- `grok-4.20-multi-agent-experimental-beta-0304` n’est pas pris en charge sur le chemin normal du fournisseur xAI, car il nécessite une surface API amont différente du transport xAI standard d’OpenClaw.

## Remarques

- OpenClaw applique automatiquement des correctifs de compatibilité spécifiques à xAI pour les schémas d’outils et les appels d’outils sur le chemin partagé de l’exécuteur.
- Les requêtes xAI natives utilisent par défaut `tool_stream: true`. Définissez
  `agents.defaults.models["xai/<model>"].params.tool_stream` à `false` pour
  le désactiver.
- L’enveloppe xAI intégrée supprime les drapeaux stricts de schéma d’outils non pris en charge et
  les clés de charge utile de raisonnement avant d’envoyer les requêtes xAI natives.
- `web_search`, `x_search`, et `code_execution` sont exposés comme outils OpenClaw. OpenClaw active le builtin xAI spécifique dont il a besoin dans chaque requête d’outil au lieu d’attacher tous les outils natifs à chaque tour de chat.
- `x_search` et `code_execution` sont gérés par le plugin xAI intégré plutôt que codés en dur dans le runtime central des modèles.
- `code_execution` correspond à une exécution distante dans le sandbox xAI, pas à l’outil local [`exec`](/tools/exec).
- Pour une vue d’ensemble plus large des fournisseurs, voir [Fournisseurs de modèles](/providers/index).
