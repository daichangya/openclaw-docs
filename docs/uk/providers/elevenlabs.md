---
read_when:
    - Ви хочете використовувати перетворення тексту на мовлення ElevenLabs в OpenClaw
    - Ви хочете використовувати ElevenLabs Scribe для перетворення мовлення на текст для аудіовкладень
    - Ви хочете використовувати транскрибування в реальному часі ElevenLabs для Voice Call
summary: Використання мовлення ElevenLabs, Scribe STT та транскрибування в реальному часі в OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T03:48:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw використовує ElevenLabs для перетворення тексту на мовлення, пакетного перетворення мовлення на текст за допомогою Scribe
v2 і потокового STT для Voice Call за допомогою Scribe v2 Realtime.

| Можливість               | Поверхня OpenClaw                              | За замовчуванням         |
| ------------------------ | ---------------------------------------------- | ------------------------ |
| Перетворення тексту на мовлення | `messages.tts` / `talk`                  | `eleven_multilingual_v2` |
| Пакетне перетворення мовлення на текст | `tools.media.audio`              | `scribe_v2`              |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Автентифікація

Задайте `ELEVENLABS_API_KEY` у середовищі. Також для
сумісності з наявними інструментами ElevenLabs підтримується `XI_API_KEY`.

```bash
export ELEVENLABS_API_KEY="..."
```

## Перетворення тексту на мовлення

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

## Перетворення мовлення на текст

Використовуйте Scribe v2 для вхідних аудіовкладень і коротких записаних голосових сегментів:

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

OpenClaw надсилає multipart audio до ElevenLabs `/v1/speech-to-text` з
`model_id: "scribe_v2"`. Підказки мови мапляться на `language_code`, якщо вони наявні.

## Потокове STT для Voice Call

Вбудований Plugin `elevenlabs` реєструє Scribe v2 Realtime для потокового
транскрибування Voice Call.

| Налаштування   | Шлях конфігурації                                                        | За замовчуванням                                  |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| API key        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Використовує резервне значення з `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Модель         | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                              |
| Формат аудіо   | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                       |
| Частота дискретизації | `...elevenlabs.sampleRate`                                        | `8000`                                            |
| Стратегія commit | `...elevenlabs.commitStrategy`                                         | `vad`                                             |
| Мова           | `...elevenlabs.languageCode`                                             | (не задано)                                       |

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
Voice Call отримує медіа Twilio як 8 kHz G.711 u-law. Provider realtime ElevenLabs
за замовчуванням використовує `ulaw_8000`, тому кадри телефонії можна пересилати без
транскодування.
</Note>

## Пов’язане

- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Вибір моделі](/uk/concepts/model-providers)
