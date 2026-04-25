---
read_when:
    - Anda ingin text-to-speech ElevenLabs di OpenClaw
    - Anda ingin speech-to-text ElevenLabs Scribe untuk lampiran audio
    - Anda ingin transkripsi realtime ElevenLabs untuk Panggilan Suara
summary: Gunakan suara ElevenLabs, Scribe STT, dan transkripsi realtime dengan OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:54:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw menggunakan ElevenLabs untuk text-to-speech, batch speech-to-text dengan Scribe
v2, dan streaming STT Voice Call dengan Scribe v2 Realtime.

| Kemampuan               | Permukaan OpenClaw                              | Default                  |
| ----------------------- | ----------------------------------------------- | ------------------------ |
| Text-to-speech          | `messages.tts` / `talk`                         | `eleven_multilingual_v2` |
| Batch speech-to-text    | `tools.media.audio`                             | `scribe_v2`              |
| Streaming speech-to-text | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Autentikasi

Setel `ELEVENLABS_API_KEY` di environment. `XI_API_KEY` juga diterima untuk
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

Setel `modelId` ke `eleven_v3` untuk menggunakan ElevenLabs v3 TTS. OpenClaw tetap menggunakan
`eleven_multilingual_v2` sebagai default untuk instalasi yang sudah ada.

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
`model_id: "scribe_v2"`. Petunjuk bahasa dipetakan ke `language_code` jika ada.

## Streaming STT Voice Call

Plugin `elevenlabs` bawaan mendaftarkan Scribe v2 Realtime untuk transkripsi
streaming Voice Call.

| Pengaturan      | Jalur config                                                              | Default                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Menggunakan `ELEVENLABS_API_KEY` / `XI_API_KEY` jika tidak disetel |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Laju sampel     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Strategi commit | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Bahasa          | `...elevenlabs.languageCode`                                              | (tidak disetel)                                   |

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
secara default menggunakan `ulaw_8000`, sehingga frame teleponi dapat diteruskan tanpa
transcoding.
</Note>

## Terkait

- [Text-to-speech](/id/tools/tts)
- [Pemilihan model](/id/concepts/model-providers)
