---
read_when:
    - Vous voulez utiliser des workflows ComfyUI locaux avec OpenClaw
    - Vous voulez utiliser Comfy Cloud avec des workflows d’image, de vidéo ou de musique
    - Vous avez besoin des clés de configuration du plugin comfy intégré
summary: Configuration de la génération d’images, de vidéos et de musique avec les workflows ComfyUI dans OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T07:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8b39c49df3ad23018372b481681ce89deac3271da5dbdf94580712ace7fef7f
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw inclut un plugin intégré `comfy` pour les exécutions ComfyUI pilotées par workflow. Le plugin est entièrement piloté par workflow, donc OpenClaw n’essaie pas de mapper des contrôles génériques comme `size`, `aspectRatio`, `resolution`, `durationSeconds` ou des contrôles de type TTS sur votre graphe.

| Property        | Detail                                                                                |
| --------------- | ------------------------------------------------------------------------------------- |
| Provider        | `comfy`                                                                               |
| Models          | `comfy/workflow`                                                                      |
| Shared surfaces | `image_generate`, `video_generate`, `music_generate`                                 |
| Auth            | Aucune pour ComfyUI local ; `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` pour Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` et Comfy Cloud `/api/*`                     |

## Ce qui est pris en charge

- Génération d’image à partir d’un JSON de workflow
- Édition d’image avec 1 image de référence téléversée
- Génération vidéo à partir d’un JSON de workflow
- Génération vidéo avec 1 image de référence téléversée
- Génération de musique ou d’audio via l’outil partagé `music_generate`
- Téléchargement de sortie depuis un nœud configuré ou tous les nœuds de sortie correspondants

## Bien démarrer

Choisissez entre exécuter ComfyUI sur votre propre machine ou utiliser Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Idéal pour :** exécuter votre propre instance ComfyUI sur votre machine ou votre LAN.

    <Steps>
      <Step title="Démarrer ComfyUI en local">
        Assurez-vous que votre instance locale de ComfyUI est en cours d’exécution (par défaut sur `http://127.0.0.1:8188`).
      </Step>
      <Step title="Préparer votre JSON de workflow">
        Exportez ou créez un fichier JSON de workflow ComfyUI. Notez les ID de nœud du nœud d’entrée de prompt et du nœud de sortie que vous voulez qu’OpenClaw lise.
      </Step>
      <Step title="Configurer le fournisseur">
        Définissez `mode: "local"` et pointez vers votre fichier de workflow. Voici un exemple minimal pour une image :

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
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Définir le modèle par défaut">
        Pointez OpenClaw vers le modèle `comfy/workflow` pour la capacité que vous avez configurée :

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
      </Step>
      <Step title="Vérifier">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Idéal pour :** exécuter des workflows sur Comfy Cloud sans gérer de ressources GPU locales.

    <Steps>
      <Step title="Obtenir une clé API">
        Inscrivez-vous sur [comfy.org](https://comfy.org) et générez une clé API depuis le tableau de bord de votre compte.
      </Step>
      <Step title="Définir la clé API">
        Fournissez votre clé via l’une de ces méthodes :

        ```bash
        # Variable d’environnement (préférée)
        export COMFY_API_KEY="your-key"

        # Variable d’environnement alternative
        export COMFY_CLOUD_API_KEY="your-key"

        # Ou inline dans la configuration
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="Préparer votre JSON de workflow">
        Exportez ou créez un fichier JSON de workflow ComfyUI. Notez les ID de nœud pour le nœud d’entrée de prompt et le nœud de sortie.
      </Step>
      <Step title="Configurer le fournisseur">
        Définissez `mode: "cloud"` et pointez vers votre fichier de workflow :

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        En mode cloud, `baseUrl` vaut par défaut `https://cloud.comfy.org`. Vous n’avez besoin de définir `baseUrl` que si vous utilisez un endpoint cloud personnalisé.
        </Tip>
      </Step>
      <Step title="Définir le modèle par défaut">
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
      </Step>
      <Step title="Vérifier">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuration

Comfy prend en charge des paramètres de connexion partagés au niveau supérieur ainsi que des sections de workflow par capacité (`image`, `video`, `music`) :

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

### Clés partagées

| Key                   | Type                   | Description                                                                                 |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                | `"local"` ou `"cloud"` | Mode de connexion.                                                                          |
| `baseUrl`             | string                 | Vaut par défaut `http://127.0.0.1:8188` en local ou `https://cloud.comfy.org` dans le cloud. |
| `apiKey`              | string                 | Clé inline facultative, alternative aux variables d’environnement `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Autoriser un `baseUrl` privé/LAN en mode cloud.                                             |

### Clés par capacité

Ces clés s’appliquent à l’intérieur des sections `image`, `video` ou `music` :

| Key                          | Required | Default  | Description                                                                  |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` ou `workflowPath` | Oui      | --       | Chemin vers le fichier JSON du workflow ComfyUI.                             |
| `promptNodeId`               | Oui      | --       | ID du nœud qui reçoit le prompt textuel.                                     |
| `promptInputName`            | Non      | `"text"` | Nom d’entrée sur le nœud de prompt.                                          |
| `outputNodeId`               | Non      | --       | ID du nœud à partir duquel lire la sortie. Si omis, tous les nœuds de sortie correspondants sont utilisés. |
| `pollIntervalMs`             | Non      | --       | Intervalle d’interrogation en millisecondes pour l’achèvement du job.        |
| `timeoutMs`                  | Non      | --       | Délai d’expiration en millisecondes pour l’exécution du workflow.            |

Les sections `image` et `video` prennent aussi en charge :

| Key                   | Required                             | Default   | Description                                          |
| --------------------- | ------------------------------------ | --------- | ---------------------------------------------------- |
| `inputImageNodeId`    | Oui (lorsqu’une image de référence est passée) | --        | ID du nœud qui reçoit l’image de référence téléversée. |
| `inputImageInputName` | Non                                  | `"image"` | Nom d’entrée sur le nœud image.                      |

## Détails des workflows

<AccordionGroup>
  <Accordion title="Workflows d’image">
    Définissez le modèle d’image par défaut sur `comfy/workflow` :

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

    **Exemple d’édition avec image de référence :**

    Pour activer l’édition d’image avec une image de référence téléversée, ajoutez `inputImageNodeId` à votre configuration d’image :

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

  </Accordion>

  <Accordion title="Workflows vidéo">
    Définissez le modèle vidéo par défaut sur `comfy/workflow` :

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

    Les workflows vidéo Comfy prennent en charge le texte-vers-vidéo et l’image-vers-vidéo via le graphe configuré.

    <Note>
    OpenClaw ne transmet pas de vidéos d’entrée dans les workflows Comfy. Seuls les prompts textuels et les images de référence uniques sont pris en charge comme entrées.
    </Note>

  </Accordion>

  <Accordion title="Workflows musicaux">
    Le plugin intégré enregistre un fournisseur de génération musicale pour les sorties audio ou musique définies par workflow, exposé via l’outil partagé `music_generate` :

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Utilisez la section de configuration `music` pour pointer vers votre JSON de workflow audio et votre nœud de sortie.

  </Accordion>

  <Accordion title="Compatibilité descendante">
    La configuration d’image héritée au niveau supérieur (sans la section imbriquée `image`) fonctionne toujours :

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

    OpenClaw traite cette forme héritée comme la configuration du workflow d’image. Vous n’avez pas besoin de migrer immédiatement, mais les sections imbriquées `image` / `video` / `music` sont recommandées pour les nouvelles configurations.

    <Tip>
    Si vous n’utilisez que la génération d’image, la configuration plate héritée et la nouvelle section imbriquée `image` sont fonctionnellement équivalentes.
    </Tip>

  </Accordion>

  <Accordion title="Tests en direct">
    Une couverture en direct optionnelle existe pour le plugin intégré :

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Le test en direct ignore individuellement les cas image, vidéo ou musique sauf si la section de workflow Comfy correspondante est configurée.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Configuration et utilisation de l’outil de génération d’images.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Configuration et utilisation de l’outil de génération vidéo.
  </Card>
  <Card title="Génération musicale" href="/fr/tools/music-generation" icon="music">
    Configuration de l’outil de génération musicale et audio.
  </Card>
  <Card title="Répertoire des fournisseurs" href="/fr/providers/index" icon="layers">
    Vue d’ensemble de tous les fournisseurs et références de modèle.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Référence complète de configuration, y compris les valeurs par défaut des agents.
  </Card>
</CardGroup>
