---
read_when:
    - Vous voulez utiliser des workflows ComfyUI locaux avec OpenClaw
    - Vous voulez utiliser Comfy Cloud avec des workflows d'image, de vidéo ou de musique
    - Vous avez besoin des clés de configuration du plugin comfy intégré
summary: Configuration de la génération d'images, de vidéos et de musique avec des workflows ComfyUI dans OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-06T03:10:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e645f32efdffdf4cd498684f1924bb953a014d3656b48f4b503d64e38c61ba9c
    source_path: providers/comfy.md
    workflow: 15
---

# ComfyUI

OpenClaw fournit un plugin `comfy` intégré pour les exécutions ComfyUI pilotées par workflow.

- Fournisseur : `comfy`
- Modèles : `comfy/workflow`
- Surfaces partagées : `image_generate`, `video_generate`, `music_generate`
- Authentification : aucune pour ComfyUI local ; `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour Comfy Cloud
- API : ComfyUI `/prompt` / `/history` / `/view` et Comfy Cloud `/api/*`

## Ce qui est pris en charge

- Génération d'image à partir d'un JSON de workflow
- Édition d'image avec 1 image de référence téléversée
- Génération de vidéo à partir d'un JSON de workflow
- Génération de vidéo avec 1 image de référence téléversée
- Génération de musique ou d'audio via l'outil partagé `music_generate`
- Téléchargement de sortie depuis un nœud configuré ou tous les nœuds de sortie correspondants

Le plugin intégré est piloté par workflow, donc OpenClaw n'essaie pas de mapper
des contrôles génériques comme `size`, `aspectRatio`, `resolution`, `durationSeconds` ou des contrôles de style TTS
sur votre graphe.

## Structure de configuration

Comfy prend en charge des paramètres de connexion partagés au niveau supérieur ainsi que des sections
de workflow par capacité :

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

Clés partagées :

- `mode` : `local` ou `cloud`
- `baseUrl` : vaut par défaut `http://127.0.0.1:8188` pour le mode local ou `https://cloud.comfy.org` pour le mode cloud
- `apiKey` : alternative facultative en ligne aux variables d'environnement
- `allowPrivateNetwork` : autoriser un `baseUrl` privé/LAN en mode cloud

Clés par capacité sous `image`, `video` ou `music` :

- `workflow` ou `workflowPath` : requis
- `promptNodeId` : requis
- `promptInputName` : vaut par défaut `text`
- `outputNodeId` : facultatif
- `pollIntervalMs` : facultatif
- `timeoutMs` : facultatif

Les sections image et vidéo prennent aussi en charge :

- `inputImageNodeId` : requis lorsque vous passez une image de référence
- `inputImageInputName` : vaut par défaut `image`

## Rétrocompatibilité

La configuration d'image existante au niveau supérieur fonctionne toujours :

```json5
{
  models: {
    providers: {
      comfy: {
        workflowPath: "./workflows/flux-api.json",
        promptNodeId: "6",
        outputNodeId: "9",
      },
    },
  },
}
```

OpenClaw traite cette forme héritée comme la configuration du workflow d'image.

## Workflows d'image

Définissez le modèle d'image par défaut :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "comfy/workflow",
      },
    },
  },
}
```

Exemple d'édition avec image de référence :

```json5
{
  models: {
    providers: {
      comfy: {
        image: {
          workflowPath: "./workflows/edit-api.json",
          promptNodeId: "6",
          inputImageNodeId: "7",
          inputImageInputName: "image",
          outputNodeId: "9",
        },
      },
    },
  },
}
```

## Workflows vidéo

Définissez le modèle vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "comfy/workflow",
      },
    },
  },
}
```

Les workflows vidéo Comfy prennent actuellement en charge le text-to-video et l'image-to-video via
le graphe configuré. OpenClaw ne transmet pas de vidéos d'entrée dans les workflows Comfy.

## Workflows musicaux

Le plugin intégré enregistre un fournisseur de génération musicale pour des sorties
audio ou musicales définies par workflow, exposées via l'outil partagé `music_generate` :

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

Utilisez la section de configuration `music` pour pointer vers votre JSON de workflow audio et votre
nœud de sortie.

## Comfy Cloud

Utilisez `mode: "cloud"` plus l'un de ces éléments :

- `COMFY_API_KEY`
- `COMFY_CLOUD_API_KEY`
- `models.providers.comfy.apiKey`

Le mode cloud utilise toujours les mêmes sections de workflow `image`, `video` et `music`.

## Tests live

Une couverture live activable existe pour le plugin intégré :

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Le test live ignore les cas individuels d'image, de vidéo ou de musique à moins que la section
de workflow Comfy correspondante ne soit configurée.

## Connexe

- [Image Generation](/fr/tools/image-generation)
- [Video Generation](/tools/video-generation)
- [Music Generation](/tools/music-generation)
- [Provider Directory](/fr/providers/index)
- [Configuration Reference](/fr/gateway/configuration-reference#agent-defaults)
