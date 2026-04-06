---
read_when:
    - Vous voulez utiliser la génération multimédia Vydra dans OpenClaw
    - Vous avez besoin d’instructions pour configurer la clé API Vydra
summary: Utiliser l’image, la vidéo et la voix Vydra dans OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-06T03:11:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fe999e8a5414b8a31a6d7d127bc6bcfc3b4492b8f438ab17dfa9680c5b079b7
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Le plugin Vydra intégré ajoute :

- la génération d’images via `vydra/grok-imagine`
- la génération de vidéos via `vydra/veo3` et `vydra/kling`
- la synthèse vocale via la route TTS de Vydra adossée à ElevenLabs

OpenClaw utilise la même `VYDRA_API_KEY` pour ces trois capacités.

## URL de base importante

Utilisez `https://www.vydra.ai/api/v1`.

L’hôte racine de Vydra (`https://vydra.ai/api/v1`) redirige actuellement vers `www`. Certains clients HTTP suppriment `Authorization` lors de cette redirection inter-hôte, ce qui transforme une clé API valide en échec d’authentification trompeur. Le plugin intégré utilise directement l’URL de base `www` pour éviter cela.

## Configuration

Onboarding interactif :

```bash
openclaw onboard --auth-choice vydra-api-key
```

Ou définissez directement la variable d’environnement :

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## Génération d’images

Modèle d’image par défaut :

- `vydra/grok-imagine`

Définissez-le comme fournisseur d’images par défaut :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "vydra/grok-imagine",
      },
    },
  },
}
```

La prise en charge intégrée actuelle se limite au texte vers image. Les routes d’édition hébergées de Vydra attendent des URL d’image distantes, et OpenClaw n’ajoute pas encore de pont d’upload spécifique à Vydra dans le plugin intégré.

Voir [Génération d’images](/fr/tools/image-generation) pour le comportement partagé de l’outil.

## Génération de vidéos

Modèles vidéo enregistrés :

- `vydra/veo3` pour le texte vers vidéo
- `vydra/kling` pour l’image vers vidéo

Définissez Vydra comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "vydra/veo3",
      },
    },
  },
}
```

Remarques :

- `vydra/veo3` est intégré uniquement en mode texte vers vidéo.
- `vydra/kling` exige actuellement une URL d’image distante comme référence. Les uploads de fichiers locaux sont rejetés d’emblée.
- Le plugin intégré reste conservateur et ne transmet pas des options de style non documentées comme le ratio d’aspect, la résolution, le filigrane ou l’audio généré.

Voir [Génération de vidéos](/tools/video-generation) pour le comportement partagé de l’outil.

## Synthèse vocale

Définissez Vydra comme fournisseur vocal :

```json5
{
  messages: {
    tts: {
      provider: "vydra",
      providers: {
        vydra: {
          apiKey: "${VYDRA_API_KEY}",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
      },
    },
  },
}
```

Valeurs par défaut :

- modèle : `elevenlabs/tts`
- id de voix : `21m00Tcm4TlvDq8ikWAM`

Le plugin intégré expose actuellement une seule voix par défaut connue comme fiable et renvoie des fichiers audio MP3.

## Liens associés

- [Répertoire des fournisseurs](/fr/providers/index)
- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéos](/tools/video-generation)
