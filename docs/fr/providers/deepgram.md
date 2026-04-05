---
read_when:
    - Vous souhaitez utiliser la reconnaissance vocale Deepgram pour les pièces jointes audio
    - Vous avez besoin d'un exemple rapide de configuration Deepgram
summary: Transcription Deepgram pour les notes vocales entrantes
title: Deepgram
x-i18n:
    generated_at: "2026-04-05T12:51:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: dabd1f6942c339fbd744fbf38040b6a663b06ddf4d9c9ee31e3ac034de9e79d9
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (transcription audio)

Deepgram est une API de transcription vocale. Dans OpenClaw, elle est utilisée pour la **transcription audio/des notes vocales entrantes** via `tools.media.audio`.

Lorsqu'elle est activée, OpenClaw téléverse le fichier audio vers Deepgram et injecte la transcription dans le pipeline de réponse (`{{Transcript}}` + bloc `[Audio]`). Il ne s'agit **pas d'un flux en continu** ; cela utilise le point de terminaison de transcription préenregistrée.

Site web : [https://deepgram.com](https://deepgram.com)  
Documentation : [https://developers.deepgram.com](https://developers.deepgram.com)

## Démarrage rapide

1. Définissez votre clé API :

```
DEEPGRAM_API_KEY=dg_...
```

2. Activez le fournisseur :

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Options

- `model`: ID du modèle Deepgram (par défaut : `nova-3`)
- `language`: indication de langue (facultatif)
- `tools.media.audio.providerOptions.deepgram.detect_language`: activer la détection de langue (facultatif)
- `tools.media.audio.providerOptions.deepgram.punctuate`: activer la ponctuation (facultatif)
- `tools.media.audio.providerOptions.deepgram.smart_format`: activer le formatage intelligent (facultatif)

Exemple avec langue :

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

Exemple avec options Deepgram :

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## Remarques

- L'authentification suit l'ordre standard d'authentification des fournisseurs ; `DEEPGRAM_API_KEY` est le chemin le plus simple.
- Remplacez les points de terminaison ou les en-têtes avec `tools.media.audio.baseUrl` et `tools.media.audio.headers` lorsque vous utilisez un proxy.
- La sortie suit les mêmes règles audio que les autres fournisseurs (limites de taille, délais d'expiration, injection de transcription).
