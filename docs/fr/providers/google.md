---
read_when:
    - Vous voulez utiliser les modèles Google Gemini avec OpenClaw
    - Vous avez besoin du flux d’authentification par clé API
summary: Configuration de Google Gemini (clé API, génération d’images, compréhension des médias, recherche web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-06T03:10:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358d33a68275b01ebd916a3621dd651619cb9a1d062e2fb6196a7f3c501c015a
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Le plugin Google fournit l’accès aux modèles Gemini via Google AI Studio, ainsi que
la génération d’images, la compréhension des médias (image/audio/vidéo) et la recherche web via
Gemini Grounding.

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY` ou `GOOGLE_API_KEY`
- API : API Google Gemini

## Démarrage rapide

1. Définissez la clé API :

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## Capacités

| Capability             | Pris en charge    |
| ---------------------- | ----------------- |
| Complétions de chat    | Oui               |
| Génération d’images    | Oui               |
| Génération de musique  | Oui               |
| Compréhension d’image  | Oui               |
| Transcription audio    | Oui               |
| Compréhension vidéo    | Oui               |
| Recherche web (Grounding) | Oui            |
| Thinking/reasoning     | Oui (Gemini 3.1+) |

## Réutilisation directe du cache Gemini

Pour les exécutions directes de l’API Gemini (`api: "google-generative-ai"`), OpenClaw
transmet désormais un handle `cachedContent` configuré aux requêtes Gemini.

- Configurez les paramètres par modèle ou globaux avec
  `cachedContent` ou l’ancien `cached_content`
- Si les deux sont présents, `cachedContent` est prioritaire
- Exemple de valeur : `cachedContents/prebuilt-context`
- L’utilisation des cache-hit Gemini est normalisée dans OpenClaw sous `cacheRead` à partir de
  `cachedContentTokenCount` en amont

Exemple :

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## Génération d’images

Le fournisseur intégré de génération d’images `google` utilise par défaut
`google/gemini-3.1-flash-image-preview`.

- Prend aussi en charge `google/gemini-3-pro-image-preview`
- Génération : jusqu’à 4 images par requête
- Mode édition : activé, jusqu’à 5 images d’entrée
- Contrôles de géométrie : `size`, `aspectRatio` et `resolution`

La génération d’images, la compréhension des médias et Gemini Grounding restent tous sur
l’id de fournisseur `google`.

Pour utiliser Google comme fournisseur d’images par défaut :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

Voir [Génération d’images](/fr/tools/image-generation) pour les paramètres
d’outil partagés, la sélection du fournisseur et le comportement de basculement.

## Génération de vidéos

Le plugin intégré `google` enregistre aussi la génération de vidéos via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `google/veo-3.1-fast-generate-preview`
- Modes : texte vers vidéo, image vers vidéo et flux de référence à vidéo unique
- Prend en charge `aspectRatio`, `resolution` et `audio`
- Limitation actuelle de durée : **4 à 8 secondes**

Pour utiliser Google comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

Voir [Génération de vidéos](/tools/video-generation) pour les paramètres
d’outil partagés, la sélection du fournisseur et le comportement de basculement.

## Génération de musique

Le plugin intégré `google` enregistre aussi la génération de musique via l’outil partagé
`music_generate`.

- Modèle de musique par défaut : `google/lyria-3-clip-preview`
- Prend aussi en charge `google/lyria-3-pro-preview`
- Contrôles de prompt : `lyrics` et `instrumental`
- Format de sortie : `mp3` par défaut, ainsi que `wav` sur `google/lyria-3-pro-preview`
- Entrées de référence : jusqu’à 10 images
- Les exécutions adossées à une session se détachent via le flux partagé tâche/statut, y compris `action: "status"`

Pour utiliser Google comme fournisseur de musique par défaut :

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

Voir [Génération de musique](/tools/music-generation) pour les paramètres
d’outil partagés, la sélection du fournisseur et le comportement de basculement.

## Remarque sur l’environnement

Si la Gateway s’exécute comme démon (launchd/systemd), assurez-vous que `GEMINI_API_KEY`
est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`).
