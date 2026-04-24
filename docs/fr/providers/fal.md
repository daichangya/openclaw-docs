---
read_when:
    - Vous souhaitez utiliser la génération d’images fal dans OpenClaw
    - Vous avez besoin du flux d’authentification `FAL_KEY`
    - Vous souhaitez des valeurs par défaut fal pour `image_generate` ou `video_generate`
summary: Configuration de la génération d’images et de vidéos fal dans OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-24T07:26:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw fournit un fournisseur `fal` intégré pour la génération hébergée d’images et de vidéos.

| Property | Value                                                         |
| -------- | ------------------------------------------------------------- |
| Fournisseur | `fal`                                                         |
| Auth     | `FAL_KEY` (canonique ; `FAL_API_KEY` fonctionne aussi en repli) |
| API      | Points de terminaison des modèles fal                         |

## Démarrage

<Steps>
  <Step title="Définir la clé API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Définir un modèle d’image par défaut">
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
  </Step>
</Steps>

## Génération d’images

Le fournisseur intégré de génération d’images `fal` utilise par défaut
`fal/fal-ai/flux/dev`.

| Capability     | Value                      |
| -------------- | -------------------------- |
| Nombre max d’images     | 4 par requête              |
| Mode édition      | Activé, 1 image de référence |
| Remplacements de taille | Pris en charge                  |
| Ratio d’aspect   | Pris en charge                  |
| Résolution     | Pris en charge                  |

<Warning>
Le point de terminaison d’édition d’image fal ne prend **pas** en charge les remplacements `aspectRatio`.
</Warning>

Pour utiliser fal comme fournisseur d’images par défaut :

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

| Capability | Value                                                        |
| ---------- | ------------------------------------------------------------ |
| Modes      | Texte vers vidéo, image de référence unique                  |
| Runtime    | Flux submit/status/result adossé à une file pour les tâches longues |

<AccordionGroup>
  <Accordion title="Modèles vidéo disponibles">
    **Agent vidéo HeyGen :**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0 :**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Exemple de configuration Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Exemple de configuration HeyGen video-agent">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
Utilisez `openclaw models list --provider fal` pour voir la liste complète des modèles fal disponibles,
y compris les entrées ajoutées récemment.
</Tip>

## Lié

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil image et sélection du fournisseur.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut de l’agent, y compris la sélection des modèles d’image et de vidéo.
  </Card>
</CardGroup>
