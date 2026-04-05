---
read_when:
    - Génération d'images via l'agent
    - Configuration des fournisseurs et modèles de génération d'images
    - Compréhension des paramètres de l'outil image_generate
summary: Générez et modifiez des images à l'aide de fournisseurs configurés (OpenAI, Google Gemini, fal, MiniMax)
title: Génération d'images
x-i18n:
    generated_at: "2026-04-05T12:56:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d38a8a583997ceff6523ce4f51808c97a2b59fe4e5a34cf79cdcb70d7e83aec2
    source_path: tools/image-generation.md
    workflow: 15
---

# Génération d'images

L'outil `image_generate` permet à l'agent de créer et de modifier des images à l'aide de vos fournisseurs configurés. Les images générées sont automatiquement livrées en tant que pièces jointes multimédias dans la réponse de l'agent.

<Note>
L'outil n'apparaît que lorsqu'au moins un fournisseur de génération d'images est disponible. Si vous ne voyez pas `image_generate` dans les outils de votre agent, configurez `agents.defaults.imageGenerationModel` ou définissez une clé API de fournisseur.
</Note>

## Démarrage rapide

1. Définissez une clé API pour au moins un fournisseur (par exemple `OPENAI_API_KEY` ou `GEMINI_API_KEY`).
2. Définissez éventuellement votre modèle préféré :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: "openai/gpt-image-1",
    },
  },
}
```

3. Demandez à l'agent : _"Generate an image of a friendly lobster mascot."_

L'agent appelle `image_generate` automatiquement. Aucune allow-list d'outils n'est nécessaire : il est activé par défaut lorsqu'un fournisseur est disponible.

## Fournisseurs pris en charge

| Provider | Default model                    | Edit support            | API key                                               |
| -------- | -------------------------------- | ----------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-1`                    | Yes (up to 5 images)    | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | Yes                     | `GEMINI_API_KEY` or `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | Yes                     | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | Yes (subject reference) | `MINIMAX_API_KEY` or MiniMax OAuth (`minimax-portal`) |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles disponibles à l'exécution :

```
/tool image_generate action=list
```

## Paramètres de l'outil

| Parameter     | Type     | Description                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt de génération d'image (obligatoire pour `action: "generate"`)                  |
| `action`      | string   | `"generate"` (par défaut) ou `"list"` pour inspecter les fournisseurs                 |
| `model`       | string   | Remplacement fournisseur/modèle, par ex. `openai/gpt-image-1`                         |
| `image`       | string   | Chemin ou URL d'image de référence unique pour le mode édition                        |
| `images`      | string[] | Plusieurs chemins d'images de référence pour le mode édition (jusqu'à 5)              |
| `size`        | string   | Indication de taille : `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024` |
| `aspectRatio` | string   | Ratio d'aspect : `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Indication de résolution : `1K`, `2K` ou `4K`                                         |
| `count`       | number   | Nombre d'images à générer (1–4)                                                       |
| `filename`    | string   | Indication de nom de fichier de sortie                                                |

Tous les fournisseurs ne prennent pas en charge tous les paramètres. L'outil transmet ce que chaque fournisseur prend en charge et ignore le reste.

## Configuration

### Sélection du modèle

```json5
{
  agents: {
    defaults: {
      // Forme chaîne : modèle principal uniquement
      imageGenerationModel: "google/gemini-3.1-flash-image-preview",

      // Forme objet : principal + fallbacks ordonnés
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Ordre de sélection du fournisseur

Lors de la génération d'une image, OpenClaw essaie les fournisseurs dans cet ordre :

1. **Paramètre `model`** de l'appel d'outil (si l'agent en spécifie un)
2. **`imageGenerationModel.primary`** depuis la configuration
3. **`imageGenerationModel.fallbacks`** dans l'ordre
4. **Détection automatique** — utilise uniquement les valeurs par défaut de fournisseur adossées à l'authentification :
   - d'abord le fournisseur par défaut actuel
   - puis les autres fournisseurs de génération d'images enregistrés, dans l'ordre des ids de fournisseur

Si un fournisseur échoue (erreur d'authentification, limite de débit, etc.), le candidat suivant est essayé automatiquement. Si tous échouent, l'erreur inclut les détails de chaque tentative.

Remarques :

- La détection automatique tient compte de l'authentification. Une valeur par défaut de fournisseur n'entre dans la liste des candidats que lorsque OpenClaw peut effectivement authentifier ce fournisseur.
- Utilisez `action: "list"` pour inspecter les fournisseurs actuellement enregistrés, leurs modèles par défaut et les indications de variables d'environnement d'authentification.

### Édition d'image

OpenAI, Google, fal et MiniMax prennent en charge l'édition d'images de référence. Transmettez un chemin ou une URL d'image de référence :

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI et Google prennent en charge jusqu'à 5 images de référence via le paramètre `images`. fal et MiniMax en prennent en charge 1.

La génération d'images MiniMax est disponible via les deux chemins d'authentification MiniMax intégrés :

- `minimax/image-01` pour les configurations avec clé API
- `minimax-portal/image-01` pour les configurations avec OAuth

## Capacités des fournisseurs

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- |
| Generate              | Yes (up to 4)        | Yes (up to 4)        | Yes (up to 4)       | Yes (up to 9)              |
| Edit/reference        | Yes (up to 5 images) | Yes (up to 5 images) | Yes (1 image)       | Yes (1 image, subject ref) |
| Size control          | Yes                  | Yes                  | Yes                 | No                         |
| Aspect ratio          | No                   | Yes                  | Yes (generate only) | Yes                        |
| Resolution (1K/2K/4K) | No                   | Yes                  | Yes                 | No                         |

## Liens associés

- [Vue d'ensemble des outils](/tools) — tous les outils d'agent disponibles
- [Référence de configuration](/fr/gateway/configuration-reference#agent-defaults) — configuration `imageGenerationModel`
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement
