---
read_when:
    - Vous voulez utiliser des modèles Z.AI / GLM dans OpenClaw
    - Vous avez besoin d’une configuration simple avec `ZAI_API_KEY`
summary: Utiliser Z.AI (modèles GLM) avec OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-05T12:52:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48006cdd580484f0c62e2877b27a6a68d7bc44795b3e97a28213d95182d9acf9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI est la plateforme API des modèles **GLM**. Elle fournit des API REST pour GLM et utilise des clés API
pour l’authentification. Créez votre clé API dans la console Z.AI. OpenClaw utilise le fournisseur `zai`
avec une clé API Z.AI.

## Configuration CLI

```bash
# Generic API-key setup with endpoint auto-detection
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (China region), recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-cn

# General API
openclaw onboard --auth-choice zai-global

# General API CN (China region)
openclaw onboard --auth-choice zai-cn
```

## Extrait de configuration

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` permet à OpenClaw de détecter le point de terminaison Z.AI correspondant à partir de la clé et
d’appliquer automatiquement la bonne base URL. Utilisez les choix régionaux explicites lorsque
vous voulez imposer une surface spécifique Coding Plan ou API générale.

## Catalogue GLM intégré

OpenClaw initialise actuellement le fournisseur intégré `zai` avec :

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## Remarques

- Les modèles GLM sont disponibles sous la forme `zai/<model>` (exemple : `zai/glm-5`).
- Référence de modèle intégrée par défaut : `zai/glm-5`
- Les IDs inconnus `glm-5*` continuent d’être résolus en avant sur le chemin du fournisseur intégré en
  synthétisant des métadonnées possédées par le fournisseur à partir du modèle `glm-4.7` lorsque l’id
  correspond à la forme actuelle de la famille GLM-5.
- `tool_stream` est activé par défaut pour le streaming des appels d’outils Z.AI. Définissez
  `agents.defaults.models["zai/<model>"].params.tool_stream` sur `false` pour le désactiver.
- Voir [/providers/glm](/providers/glm) pour la vue d’ensemble de la famille de modèles.
- Z.AI utilise l’authentification Bearer avec votre clé API.
