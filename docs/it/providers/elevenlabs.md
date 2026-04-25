---
read_when:
    - Vuoi la sintesi vocale ElevenLabs in OpenClaw
    - Vuoi speech-to-text ElevenLabs Scribe per allegati audio
    - Vuoi la trascrizione realtime ElevenLabs per Voice Call
summary: Usa la voce ElevenLabs, Scribe STT e la trascrizione realtime con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:55:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw usa ElevenLabs per text-to-speech, speech-to-text batch con Scribe
v2 e STT in streaming Voice Call con Scribe v2 Realtime.

| Capacità                 | Superficie OpenClaw                            | Predefinito              |
| ------------------------ | ---------------------------------------------- | ------------------------ |
| Text-to-speech           | `messages.tts` / `talk`                        | `eleven_multilingual_v2` |
| Speech-to-text batch     | `tools.media.audio`                            | `scribe_v2`              |
| Speech-to-text streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Autenticazione

Imposta `ELEVENLABS_API_KEY` nell'ambiente. Anche `XI_API_KEY` è accettato per
compatibilità con gli strumenti ElevenLabs esistenti.

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-speech

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

Imposta `modelId` su `eleven_v3` per usare ElevenLabs v3 TTS. OpenClaw mantiene
`eleven_multilingual_v2` come predefinito per le installazioni esistenti.

## Speech-to-text

Usa Scribe v2 per allegati audio in entrata e brevi segmenti vocali registrati:

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

OpenClaw invia audio multipart a ElevenLabs `/v1/speech-to-text` con
`model_id: "scribe_v2"`. Gli hint di lingua vengono mappati a `language_code` quando presenti.

## STT streaming Voice Call

Il Plugin `elevenlabs` incluso registra Scribe v2 Realtime per la
trascrizione streaming di Voice Call.

| Impostazione      | Percorso config                                                           | Predefinito                                       |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Chiave API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Usa come fallback `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modello           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Formato audio     | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Frequenza campione | `...elevenlabs.sampleRate`                                               | `8000`                                            |
| Strategia di commit | `...elevenlabs.commitStrategy`                                          | `vad`                                             |
| Lingua            | `...elevenlabs.languageCode`                                              | (non impostato)                                   |

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
Voice Call riceve media Twilio come G.711 u-law a 8 kHz. Il provider realtime ElevenLabs
usa come predefinito `ulaw_8000`, quindi i frame di telefonia possono essere inoltrati senza
transcodifica.
</Note>

## Correlati

- [Text-to-speech](/it/tools/tts)
- [Selezione del modello](/it/concepts/model-providers)
