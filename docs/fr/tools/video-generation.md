---
read_when:
    - Générer des vidéos via l’agent
    - Configurer des fournisseurs et des modèles de génération vidéo
    - Comprendre les paramètres de l’outil `video_generate`
summary: Générez des vidéos à partir de texte, d’images ou de vidéos existantes à l’aide de 12 backends fournisseurs
title: Génération de vidéos
x-i18n:
    generated_at: "2026-04-06T03:13:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4afec87368232221db1aa5a3980254093d6a961b17271b2dcbf724e6bd455b16
    source_path: tools/video-generation.md
    workflow: 15
---

# Génération de vidéos

Les agents OpenClaw peuvent générer des vidéos à partir de prompts textuels, d’images de référence ou de vidéos existantes. Douze backends fournisseurs sont pris en charge, chacun avec différentes options de modèle, différents modes d’entrée et différents ensembles de fonctionnalités. L’agent choisit automatiquement le bon fournisseur en fonction de votre configuration et des clés API disponibles.

<Note>
L’outil `video_generate` n’apparaît que lorsqu’au moins un fournisseur de génération vidéo est disponible. Si vous ne le voyez pas dans les outils de votre agent, définissez une clé API de fournisseur ou configurez `agents.defaults.videoGenerationModel`.
</Note>

## Démarrage rapide

1. Définissez une clé API pour n’importe quel fournisseur pris en charge :

```bash
export GEMINI_API_KEY="your-key"
```

2. Épinglez éventuellement un modèle par défaut :

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Demandez à l’agent :

> Générez une vidéo cinématique de 5 secondes d’un homard sympathique faisant du surf au coucher du soleil.

L’agent appelle automatiquement `video_generate`. Aucune liste d’autorisation d’outils n’est nécessaire.

## Ce qui se passe lorsque vous générez une vidéo

La génération vidéo est asynchrone. Lorsque l’agent appelle `video_generate` dans une session :

1. OpenClaw soumet la requête au fournisseur et renvoie immédiatement un ID de tâche.
2. Le fournisseur traite le job en arrière-plan (généralement de 30 secondes à 5 minutes selon le fournisseur et la résolution).
3. Lorsque la vidéo est prête, OpenClaw réveille la même session avec un événement interne d’achèvement.
4. L’agent republie la vidéo finale dans la conversation d’origine.

Lorsqu’un job est en cours, les appels `video_generate` en doublon dans la même session renvoient l’état actuel de la tâche au lieu de démarrer une nouvelle génération. Utilisez `openclaw tasks list` ou `openclaw tasks show <taskId>` pour vérifier l’avancement depuis la CLI.

En dehors des exécutions d’agent adossées à une session (par exemple, appels d’outils directs), l’outil bascule vers une génération inline et renvoie le chemin final du média dans le même tour.

## Fournisseurs pris en charge

| Fournisseur | Modèle par défaut               | Texte | Image de référence | Vidéo de référence | Clé API                                  |
| ----------- | ------------------------------- | ----- | ------------------ | ------------------ | ---------------------------------------- |
| Alibaba     | `wan2.6-t2v`                    | Oui   | Oui (URL distante) | Oui (URL distante) | `MODELSTUDIO_API_KEY`                    |
| BytePlus    | `seedance-1-0-lite-t2v-250428`  | Oui   | 1 image            | Non                | `BYTEPLUS_API_KEY`                       |
| ComfyUI     | `workflow`                      | Oui   | 1 image            | Non                | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| fal         | `fal-ai/minimax/video-01-live`  | Oui   | 1 image            | Non                | `FAL_KEY`                                |
| Google      | `veo-3.1-fast-generate-preview` | Oui   | 1 image            | 1 vidéo            | `GEMINI_API_KEY`                         |
| MiniMax     | `MiniMax-Hailuo-2.3`            | Oui   | 1 image            | Non                | `MINIMAX_API_KEY`                        |
| OpenAI      | `sora-2`                        | Oui   | 1 image            | 1 vidéo            | `OPENAI_API_KEY`                         |
| Qwen        | `wan2.6-t2v`                    | Oui   | Oui (URL distante) | Oui (URL distante) | `QWEN_API_KEY`                           |
| Runway      | `gen4.5`                        | Oui   | 1 image            | 1 vidéo            | `RUNWAYML_API_SECRET`                    |
| Together    | `Wan-AI/Wan2.2-T2V-A14B`        | Oui   | 1 image            | Non                | `TOGETHER_API_KEY`                       |
| Vydra       | `veo3`                          | Oui   | 1 image (`kling`)  | Non                | `VYDRA_API_KEY`                          |
| xAI         | `grok-imagine-video`            | Oui   | 1 image            | 1 vidéo            | `XAI_API_KEY`                            |

Certains fournisseurs acceptent des variables d’environnement de clé API supplémentaires ou alternatives. Consultez les [pages fournisseur](#related) individuelles pour plus de détails.

Exécutez `video_generate action=list` pour inspecter les fournisseurs et modèles disponibles à l’exécution.

## Paramètres de l’outil

### Obligatoires

| Paramètre | Type   | Description                                                                        |
| --------- | ------ | ---------------------------------------------------------------------------------- |
| `prompt`  | string | Description textuelle de la vidéo à générer (requis pour `action: "generate"`)    |

### Entrées de contenu

| Paramètre | Type     | Description                              |
| --------- | -------- | ---------------------------------------- |
| `image`   | string   | Image de référence unique (chemin ou URL) |
| `images`  | string[] | Plusieurs images de référence (jusqu’à 5) |
| `video`   | string   | Vidéo de référence unique (chemin ou URL) |
| `videos`  | string[] | Plusieurs vidéos de référence (jusqu’à 4) |

### Contrôles de style

| Paramètre         | Type    | Description                                                                 |
| ----------------- | ------- | --------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`    |
| `resolution`      | string  | `480P`, `720P` ou `1080P`                                                   |
| `durationSeconds` | number  | Durée cible en secondes (arrondie à la valeur prise en charge la plus proche par le fournisseur) |
| `size`            | string  | Indication de taille lorsque le fournisseur la prend en charge              |
| `audio`           | boolean | Activer l’audio généré lorsque pris en charge                               |
| `watermark`       | boolean | Activer ou désactiver le filigrane du fournisseur lorsque pris en charge    |

### Avancé

| Paramètre  | Type   | Description                                     |
| ---------- | ------ | ----------------------------------------------- |
| `action`   | string | `"generate"` (par défaut), `"status"` ou `"list"` |
| `model`    | string | Surcharge fournisseur/modèle (par ex. `runway/gen4.5`) |
| `filename` | string | Indication de nom de fichier de sortie          |

Tous les fournisseurs ne prennent pas en charge tous les paramètres. Les surcharges non prises en charge sont ignorées dans la mesure du possible et signalées sous forme d’avertissements dans le résultat de l’outil. Les limites strictes de capacité (par exemple trop d’entrées de référence) échouent avant la soumission.

## Actions

- **generate** (par défaut) -- crée une vidéo à partir du prompt fourni et d’entrées de référence facultatives.
- **status** -- vérifie l’état de la tâche vidéo en cours pour la session actuelle sans démarrer une autre génération.
- **list** -- affiche les fournisseurs, les modèles et leurs capacités disponibles.

## Sélection du modèle

Lors de la génération d’une vidéo, OpenClaw résout le modèle dans cet ordre :

1. **Paramètre d’outil `model`** -- si l’agent en spécifie un dans l’appel.
2. **`videoGenerationModel.primary`** -- depuis la configuration.
3. **`videoGenerationModel.fallbacks`** -- essayés dans l’ordre.
4. **Auto-détection** -- utilise les fournisseurs qui disposent d’une authentification valide, en commençant par le fournisseur par défaut actuel, puis les autres fournisseurs dans l’ordre alphabétique.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous les candidats échouent, l’erreur inclut les détails de chaque tentative.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Notes sur les fournisseurs

| Fournisseur | Notes                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba     | Utilise le point de terminaison asynchrone DashScope/Model Studio. Les images et vidéos de référence doivent être des URL `http(s)` distantes. |
| BytePlus    | Une seule image de référence.                                                                                                            |
| ComfyUI     | Exécution locale ou cloud pilotée par workflow. Prend en charge le text-to-video et l’image-vers-vidéo via le graphe configuré.        |
| fal         | Utilise un flux adossé à une file d’attente pour les jobs de longue durée. Une seule image de référence.                               |
| Google      | Utilise Gemini/Veo. Prend en charge une image ou une vidéo de référence.                                                                |
| MiniMax     | Une seule image de référence.                                                                                                            |
| OpenAI      | Seule la surcharge `size` est transmise. Les autres surcharges de style (`aspectRatio`, `resolution`, `audio`, `watermark`) sont ignorées avec un avertissement. |
| Qwen        | Même backend DashScope qu’Alibaba. Les entrées de référence doivent être des URL `http(s)` distantes ; les fichiers locaux sont rejetés d’emblée. |
| Runway      | Prend en charge les fichiers locaux via des URI de données. Le video-to-video nécessite `runway/gen4_aleph`. Les exécutions texte seul exposent les rapports d’aspect `16:9` et `9:16`. |
| Together    | Une seule image de référence.                                                                                                            |
| Vydra       | Utilise directement `https://www.vydra.ai/api/v1` pour éviter les redirections qui perdent l’authentification. `veo3` est fourni uniquement en text-to-video ; `kling` nécessite une URL d’image distante. |
| xAI         | Prend en charge les flux text-to-video, image-to-video et d’édition/extension de vidéo distante.                                       |

## Configuration

Définissez le modèle par défaut de génération vidéo dans votre configuration OpenClaw :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Ou via la CLI :

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Lié

- [Tools Overview](/fr/tools)
- [Background Tasks](/fr/automation/tasks) -- suivi des tâches pour la génération vidéo asynchrone
- [Alibaba Model Studio](/fr/providers/alibaba)
- [BytePlus](/providers/byteplus)
- [ComfyUI](/fr/providers/comfy)
- [fal](/fr/providers/fal)
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [OpenAI](/fr/providers/openai)
- [Qwen](/fr/providers/qwen)
- [Runway](/fr/providers/runway)
- [Together AI](/fr/providers/together)
- [Vydra](/fr/providers/vydra)
- [xAI](/fr/providers/xai)
- [Configuration Reference](/fr/gateway/configuration-reference#agent-defaults)
- [Models](/fr/concepts/models)
