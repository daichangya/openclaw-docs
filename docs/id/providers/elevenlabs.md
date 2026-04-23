---
read_when:
    - Anda menginginkan text-to-speech ElevenLabs di OpenClaw
    - Anda menginginkan speech-to-text ElevenLabs Scribe untuk lampiran audio
    - Anda menginginkan transkripsi realtime ElevenLabs untuk Voice Call
summary: Gunakan speech ElevenLabs, Scribe STT, dan transkripsi realtime dengan OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T09:26:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw menggunakan ElevenLabs untuk text-to-speech, batch speech-to-text dengan Scribe
v2, dan streaming STT Voice Call dengan Scribe v2 Realtime.

| Kemampuan                | Surface OpenClaw                                | Default                  |
| ------------------------ | ----------------------------------------------- | ------------------------ |
| Text-to-speech           | `messages.tts` / `talk`                         | `eleven_multilingual_v2` |
| Batch speech-to-text     | `tools.media.audio`                             | `scribe_v2`              |
| Streaming speech-to-text | Voice Call `streaming.provider: "elevenlabs"`   | `scribe_v2_realtime`     |

## Autentikasi

Tetapkan `ELEVENLABS_API_KEY` di environment. `XI_API_KEY` juga diterima untuk
kompatibilitas dengan tooling ElevenLabs yang sudah ada.

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

## Speech-to-text

Gunakan Scribe v2 untuk lampiran audio masuk dan segmen suara rekaman pendek:

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

OpenClaw mengirim audio multipart ke ElevenLabs `/v1/speech-to-text` dengan
`model_id: "scribe_v2"`. Petunjuk bahasa dipetakan ke `language_code` saat ada.

## Streaming STT Voice Call

Plugin `elevenlabs` bawaan mendaftarkan Scribe v2 Realtime untuk transkripsi
streaming Voice Call.

| Pengaturan      | Path konfigurasi                                                           | Default                                           |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`  | Fallback ke `ELEVENLABS_API_KEY` / `XI_API_KEY`   |
| Model           | `...elevenlabs.modelId`                                                    | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                                | `ulaw_8000`                                       |
| Sample rate     | `...elevenlabs.sampleRate`                                                 | `8000`                                            |
| Strategi commit | `...elevenlabs.commitStrategy`                                             | `vad`                                             |
| Bahasa          | `...elevenlabs.languageCode`                                               | (tidak diatur)                                    |

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
Voice Call menerima media Twilio sebagai G.711 u-law 8 kHz. Provider realtime ElevenLabs
secara default menggunakan `ulaw_8000`, sehingga frame telefoni dapat diteruskan tanpa
transcoding.
</Note>
