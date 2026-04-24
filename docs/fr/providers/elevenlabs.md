---
read_when:
    - Vous voulez utiliser la synthèse vocale ElevenLabs dans OpenClaw
    - Vous voulez utiliser la conversion parole-texte ElevenLabs Scribe pour les pièces jointes audio
    - Vous voulez utiliser la transcription en temps réel ElevenLabs pour Voice Call
summary: Utiliser la parole ElevenLabs, Scribe STT et la transcription en temps réel avec OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T07:26:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw utilise ElevenLabs pour la synthèse vocale, la conversion parole-texte en lot avec Scribe
v2, et la transcription STT en streaming pour Voice Call avec Scribe v2 Realtime.

| Capacité                 | Surface OpenClaw                                | Valeur par défaut        |
| ------------------------ | ----------------------------------------------- | ------------------------ |
| Synthèse vocale          | `messages.tts` / `talk`                         | `eleven_multilingual_v2` |
| Conversion parole-texte en lot | `tools.media.audio`                     | `scribe_v2`              |
| Conversion parole-texte en streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Authentification

Définissez `ELEVENLABS_API_KEY` dans l’environnement. `XI_API_KEY` est aussi accepté pour
la compatibilité avec les outils ElevenLabs existants.

```bash
export ELEVENLABS_API_KEY="..."
```

## Synthèse vocale

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

## Conversion parole-texte

Utilisez Scribe v2 pour les pièces jointes audio entrantes et les courts segments vocaux enregistrés :

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw envoie de l’audio multipart à ElevenLabs `/v1/speech-to-text` avec
`model_id: "scribe_v2"`. Les indications de langue sont mappées vers `language_code` lorsqu’elles sont présentes.

## STT en streaming pour Voice Call

Le Plugin `elevenlabs` intégré enregistre Scribe v2 Realtime pour la
transcription en streaming de Voice Call.

| Paramètre       | Chemin de configuration                                                     | Valeur par défaut                                  |
| --------------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| Clé API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`   | Repli sur `ELEVENLABS_API_KEY` / `XI_API_KEY`      |
| Modèle          | `...elevenlabs.modelId`                                                     | `scribe_v2_realtime`                               |
| Format audio    | `...elevenlabs.audioFormat`                                                 | `ulaw_8000`                                        |
| Fréquence d’échantillonnage | `...elevenlabs.sampleRate`                                      | `8000`                                             |
| Stratégie de commit | `...elevenlabs.commitStrategy`                                           | `vad`                                              |
| Langue          | `...elevenlabs.languageCode`                                                | (non défini)                                       |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call reçoit les médias Twilio en G.711 u-law à 8 kHz. Le fournisseur temps réel ElevenLabs
utilise par défaut `ulaw_8000`, donc les trames de téléphonie peuvent être transférées sans
transcodage.
</Note>

## Lié

- [Synthèse vocale](/fr/tools/tts)
- [Sélection de modèle](/fr/concepts/model-providers)
