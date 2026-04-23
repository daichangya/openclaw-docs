---
read_when:
    - Реалізація режиму Talk на macOS/iOS/Android
    - Змінення поведінки голосу/TTS/переривання
summary: 'Режим Talk: безперервні голосові розмови з ElevenLabs TTS'
title: Режим Talk
x-i18n:
    generated_at: "2026-04-23T23:01:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

Режим Talk — це безперервний цикл голосової розмови:

1. Слухати мовлення
2. Надіслати транскрипт моделі (основна сесія, `chat.send`)
3. Дочекатися відповіді
4. Озвучити її через налаштованого провайдера Talk (`talk.speak`)

## Поведінка (macOS)

- **Завжди активний оверлей**, поки ввімкнено режим Talk.
- Переходи між фазами **Listening → Thinking → Speaking**.
- Після **короткої паузи** (вікно тиші) поточний транскрипт надсилається.
- Відповіді **записуються у WebChat** (так само, як під час введення тексту).
- **Переривання мовленням** (типово ввімкнено): якщо користувач починає говорити, поки assistant говорить, ми зупиняємо відтворення й фіксуємо часову мітку переривання для наступного prompt.

## Голосові директиви у відповідях

Assistant може додати на початку відповіді **один рядок JSON**, щоб керувати голосом:

```json
{ "voice": "<voice-id>", "once": true }
```

Правила:

- Лише перший непорожній рядок.
- Невідомі ключі ігноруються.
- `once: true` застосовується лише до поточної відповіді.
- Без `once` голос стає новим типовим голосом для режиму Talk.
- Рядок JSON прибирається перед відтворенням TTS.

Підтримувані ключі:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Типові значення:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: якщо не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms` на macOS і Android, `900 ms` на iOS)
- `voiceId`: як запасний варіант використовується `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (або перший голос ElevenLabs, якщо доступний API key)
- `modelId`: якщо не задано, типово використовується `eleven_v3`
- `apiKey`: як запасний варіант використовується `ELEVENLABS_API_KEY` (або shell profile gateway, якщо доступний)
- `outputFormat`: типово `pcm_44100` на macOS/iOS і `pcm_24000` на Android (встановіть `mp3_*`, щоб примусово використовувати потокове MP3)

## UI macOS

- Перемикач у рядку меню: **Talk**
- Вкладка config: група **Talk Mode** (voice id + перемикач переривання)
- Оверлей:
  - **Listening**: хмара пульсує з рівнем мікрофона
  - **Thinking**: анімація занурення
  - **Speaking**: кільця, що розходяться
  - Натискання на хмару: зупинити озвучення
  - Натискання X: вийти з режиму Talk

## Примітки

- Потребує дозволів Speech і Microphone.
- Використовує `chat.send` для ключа сесії `main`.
- Gateway виконує відтворення Talk через `talk.speak`, використовуючи активного провайдера Talk. Android використовує локальний системний TTS як запасний варіант лише тоді, коли цей RPC недоступний.
- `stability` для `eleven_v3` перевіряється на значення `0.0`, `0.5` або `1.0`; інші моделі приймають `0..1`.
- `latency_tier`, якщо задано, перевіряється в діапазоні `0..4`.
- Android підтримує формати виводу `pcm_16000`, `pcm_22050`, `pcm_24000` і `pcm_44100` для низькозатримкового потокового AudioTrack.

## Пов’язане

- [Пробудження голосом](/uk/nodes/voicewake)
- [Аудіо та голосові нотатки](/uk/nodes/audio)
- [Розуміння медіа](/uk/nodes/media-understanding)
