---
read_when:
    - Vous souhaitez utiliser des modèles GLM dans OpenClaw
    - Vous avez besoin de la convention de nommage des modèles et de la configuration
summary: Vue d’ensemble de la famille de modèles GLM + comment l’utiliser dans OpenClaw
title: Modèles GLM
x-i18n:
    generated_at: "2026-04-05T12:51:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59622edab5094d991987f9788fbf08b33325e737e7ff88632b0c3ac89412d4c7
    source_path: providers/glm.md
    workflow: 15
---

# Modèles GLM

GLM est une **famille de modèles** (et non une entreprise) disponible via la plateforme Z.AI. Dans OpenClaw, les modèles GLM
sont accessibles via le provider `zai` et des ID de modèle comme `zai/glm-5`.

## Configuration CLI

```bash
# Configuration générique par clé API avec auto-détection du point de terminaison
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, recommandé pour les utilisateurs de Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (région Chine), recommandé pour les utilisateurs de Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# API générale
openclaw onboard --auth-choice zai-global

# API générale CN (région Chine)
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
d’appliquer automatiquement la bonne URL de base. Utilisez les choix régionaux explicites lorsque
vous souhaitez forcer une surface Coding Plan spécifique ou la surface de l’API générale.

## Modèles GLM intégrés actuels

OpenClaw initialise actuellement le provider `zai` intégré avec ces références GLM :

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

- Les versions GLM et leur disponibilité peuvent changer ; consultez la documentation Z.AI pour les dernières informations.
- La référence de modèle intégrée par défaut est `zai/glm-5`.
- Pour les détails sur le provider, voir [/providers/zai](/providers/zai).
