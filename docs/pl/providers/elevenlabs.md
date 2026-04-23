---
read_when:
    - Chcesz używać text-to-speech ElevenLabs w OpenClaw
    - Chcesz używać speech-to-text ElevenLabs Scribe dla załączników audio
    - Chcesz używać transkrypcji realtime ElevenLabs dla Voice Call
summary: Używanie mowy ElevenLabs, Scribe STT i transkrypcji realtime z OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T10:07:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw używa ElevenLabs do text-to-speech, batch speech-to-text z Scribe
v2 oraz strumieniowego STT dla Voice Call z Scribe v2 Realtime.

| Możliwość               | Surface OpenClaw                                | Domyślnie                |
| ----------------------- | ----------------------------------------------- | ------------------------ |
| Text-to-speech          | `messages.tts` / `talk`                         | `eleven_multilingual_v2` |
| Batch speech-to-text    | `tools.media.audio`                             | `scribe_v2`              |
| Strumieniowe speech-to-text | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Uwierzytelnianie

Ustaw `ELEVENLABS_API_KEY` w środowisku. `XI_API_KEY` jest również akceptowane dla
zgodności z istniejącymi narzędziami ElevenLabs.

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

Użyj Scribe v2 dla przychodzących załączników audio i krótkich nagranych segmentów głosowych:

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

OpenClaw wysyła multipart audio do ElevenLabs `/v1/speech-to-text` z
`model_id: "scribe_v2"`. Wskazówki językowe są mapowane do `language_code`, gdy są obecne.

## Strumieniowe STT dla Voice Call

Dołączony plugin `elevenlabs` rejestruje Scribe v2 Realtime dla strumieniowej
transkrypcji Voice Call.

| Ustawienie      | Ścieżka konfiguracji                                                      | Domyślnie                                         |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Klucz API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Awaryjnie używa `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Sample rate     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Strategia commit | `...elevenlabs.commitStrategy`                                           | `vad`                                             |
| Język           | `...elevenlabs.languageCode`                                              | (nieustawione)                                    |

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
Voice Call odbiera media Twilio jako 8 kHz G.711 u-law. Provider realtime ElevenLabs
domyślnie używa `ulaw_8000`, więc ramki telefoniczne mogą być przekazywane dalej bez
transkodowania.
</Note>
