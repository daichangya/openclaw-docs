---
read_when:
    - Vous voulez utiliser la génération d’images fal dans OpenClaw
    - Vous avez besoin du flux d’authentification FAL_KEY
    - Vous voulez les valeurs par défaut fal pour image_generate ou video_generate
summary: Configuration de la génération d’images et de vidéos fal dans OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-06T03:10:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1922907d2c8360c5877a56495323d54bd846d47c27a801155e3d11e3f5706fbd
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw inclut un fournisseur `fal` intégré pour la génération d’images et de vidéos hébergée.

- Fournisseur : `fal`
- Authentification : `FAL_KEY` (canonique ; `FAL_API_KEY` fonctionne aussi en secours)
- API : endpoints de modèles fal

## Démarrage rapide

1. Définissez la clé API :

```bash
openclaw onboard --auth-choice fal-api-key
```

2. Définissez un modèle d’image par défaut :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Génération d’images

Le fournisseur intégré de génération d’images `fal` utilise par défaut
`fal/fal-ai/flux/dev`.

- Génération : jusqu’à 4 images par requête
- Mode édition : activé, 1 image de référence
- Prend en charge `size`, `aspectRatio` et `resolution`
- Limitation actuelle de l’édition : l’endpoint d’édition d’image fal ne prend **pas** en charge
  les remplacements de `aspectRatio`

Pour utiliser fal comme fournisseur d’images par défaut :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Génération de vidéos

Le fournisseur intégré de génération vidéo `fal` utilise par défaut
`fal/fal-ai/minimax/video-01-live`.

- Modes : texte vers vidéo et flux à image de référence unique
- Runtime : flux submit/status/result adossé à une file pour les tâches de longue durée

Pour utiliser fal comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/minimax/video-01-live",
      },
    },
  },
}
```

## Connexe

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/tools/video-generation)
- [Référence de configuration](/fr/gateway/configuration-reference#agent-defaults)
