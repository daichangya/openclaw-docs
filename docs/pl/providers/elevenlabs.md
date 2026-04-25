---
read_when:
    - Chcesz korzystać z syntezy mowy ElevenLabs w OpenClaw
    - Chcesz korzystać z rozpoznawania mowy ElevenLabs Scribe dla załączników audio
    - Chcesz korzystać z transkrypcji w czasie rzeczywistym ElevenLabs dla Voice Call
summary: Używanie mowy ElevenLabs, Scribe STT i transkrypcji realtime z OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:56:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw używa ElevenLabs do syntezy mowy, wsadowego rozpoznawania mowy za pomocą Scribe
v2 oraz strumieniowego STT w Voice Call z użyciem Scribe v2 Realtime.

| Funkcja                  | Powierzchnia OpenClaw                          | Domyślnie               |
| ------------------------ | --------------------------------------------- | ----------------------- |
| Synteza mowy             | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Wsadowe rozpoznawanie mowy | `tools.media.audio`                         | `scribe_v2`             |
| Strumieniowe rozpoznawanie mowy | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Uwierzytelnianie

Ustaw `ELEVENLABS_API_KEY` w środowisku. `XI_API_KEY` jest również akceptowany
dla zgodności z istniejącymi narzędziami ElevenLabs.

```bash
export ELEVENLABS_API_KEY="..."
```

## Synteza mowy

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

Ustaw `modelId` na `eleven_v3`, aby używać ElevenLabs v3 TTS. OpenClaw zachowuje
`eleven_multilingual_v2` jako wartość domyślną dla istniejących instalacji.

## Rozpoznawanie mowy

Używaj Scribe v2 dla przychodzących załączników audio i krótkich nagranych segmentów głosowych:

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

OpenClaw wysyła wieloczęściowe audio do ElevenLabs `/v1/speech-to-text` z
`model_id: "scribe_v2"`. Wskazówki językowe są mapowane na `language_code`, jeśli są obecne.

## Strumieniowe STT w Voice Call

Dołączony Plugin `elevenlabs` rejestruje Scribe v2 Realtime dla
strumieniowej transkrypcji w Voice Call.

| Ustawienie       | Ścieżka konfiguracji                                                      | Domyślnie                                         |
| ---------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Klucz API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Używa `ELEVENLABS_API_KEY` / `XI_API_KEY` jako zapasowego |
| Model            | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Format audio     | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Częstotliwość próbkowania | `...elevenlabs.sampleRate`                                        | `8000`                                            |
| Strategia zatwierdzania | `...elevenlabs.commitStrategy`                                      | `vad`                                             |
| Język            | `...elevenlabs.languageCode`                                              | (nieustawione)                                    |

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
Voice Call odbiera multimedia Twilio jako 8 kHz G.711 u-law. Dostawca czasu rzeczywistego ElevenLabs
domyślnie używa `ulaw_8000`, więc ramki telefoniczne mogą być przekazywane dalej bez
transkodowania.
</Note>

## Powiązane

- [Synteza mowy](/pl/tools/tts)
- [Wybór modelu](/pl/concepts/model-providers)
