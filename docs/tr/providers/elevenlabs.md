---
read_when:
    - OpenClaw'da ElevenLabs metinden konuşmaya özelliğini istiyorsunuz
    - Ses ekleri için ElevenLabs Scribe speech-to-text istiyorsunuz
    - Voice Call için ElevenLabs realtime transcription istiyorsunuz
summary: OpenClaw ile ElevenLabs konuşma, Scribe STT ve realtime transcription kullanma
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:55:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw, metinden konuşmaya, Scribe
v2 ile toplu speech-to-text ve Voice Call akışlı STT için Scribe v2 Realtime amacıyla ElevenLabs kullanır.

| Yetenek                  | OpenClaw yüzeyi                               | Varsayılan               |
| ------------------------ | --------------------------------------------- | ------------------------ |
| Metinden konuşmaya       | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Toplu speech-to-text     | `tools.media.audio`                           | `scribe_v2`              |
| Akışlı speech-to-text    | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Kimlik doğrulama

Ortamda `ELEVENLABS_API_KEY` ayarlayın. Mevcut
ElevenLabs araçlarıyla uyumluluk için `XI_API_KEY` de kabul edilir.

```bash
export ELEVENLABS_API_KEY="..."
```

## Metinden konuşmaya

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

ElevenLabs v3 TTS kullanmak için `modelId` değerini `eleven_v3` olarak ayarlayın. OpenClaw
mevcut kurulumlar için varsayılan olarak `eleven_multilingual_v2` değerini korur.

## Speech-to-text

Gelen ses ekleri ve kısa kaydedilmiş ses segmentleri için Scribe v2 kullanın:

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

OpenClaw, çok parçalı sesi ElevenLabs `/v1/speech-to-text` uç noktasına
`model_id: "scribe_v2"` ile gönderir. Dil ipuçları mevcut olduğunda `language_code` alanına eşlenir.

## Voice Call akışlı STT

Paketlenmiş `elevenlabs` Plugin'i, Voice Call
akışlı transcription için Scribe v2 Realtime'ı kaydeder.

| Ayar            | Yapılandırma yolu                                                        | Varsayılan                                        |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| API anahtarı    | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` değerine geri düşer |
| Model           | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                              |
| Ses biçimi      | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                       |
| Örnekleme oranı | `...elevenlabs.sampleRate`                                               | `8000`                                            |
| Commit stratejisi | `...elevenlabs.commitStrategy`                                         | `vad`                                             |
| Dil             | `...elevenlabs.languageCode`                                             | (ayarlanmamış)                                    |

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
Voice Call, Twilio medyasını 8 kHz G.711 u-law olarak alır. ElevenLabs realtime
sağlayıcısı varsayılan olarak `ulaw_8000` kullandığı için telefon çerçeveleri
yeniden kodlama olmadan iletilebilir.
</Note>

## İlgili

- [Metinden konuşmaya](/tr/tools/tts)
- [Model seçimi](/tr/concepts/model-providers)
