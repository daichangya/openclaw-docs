---
read_when:
    - Увімкнення text-to-speech для відповідей
    - Налаштування провайдерів або обмежень TTS
    - Використання команд /tts
summary: Text-to-speech (TTS) для вихідних відповідей
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-23T23:08:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba760f48e203a090ddc8f18198439541de8886422fca07edb94a46295684da02
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо за допомогою ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI або xAI.
Це працює всюди, де OpenClaw може надсилати аудіо.

## Підтримувані сервіси

- **ElevenLabs** (основний або резервний провайдер)
- **Google Gemini** (основний або резервний провайдер; використовує Gemini API TTS)
- **Microsoft** (основний або резервний провайдер; поточна bundled-реалізація використовує `node-edge-tts`)
- **MiniMax** (основний або резервний провайдер; використовує T2A v2 API)
- **OpenAI** (основний або резервний провайдер; також використовується для зведень)
- **xAI** (основний або резервний провайдер; використовує xAI TTS API)

### Примітки щодо Microsoft speech

Bundled-провайдер Microsoft speech наразі використовує онлайн-сервіс
нейронного TTS Microsoft Edge через бібліотеку `node-edge-tts`. Це розміщений сервіс (не
локальний), використовує endpoint Microsoft і не потребує API key.
`node-edge-tts` надає параметри конфігурації мовлення та формати виводу, але
не всі параметри підтримуються сервісом. Застаріла конфігурація і вхідні директиви,
що використовують `edge`, і далі працюють і нормалізуються до `microsoft`.

Оскільки цей шлях використовує публічний вебсервіс без опублікованого SLA або квоти,
ставтеся до нього як до best-effort. Якщо вам потрібні гарантовані ліміти й підтримка, використовуйте OpenAI
або ElevenLabs.

## Необов’язкові ключі

Якщо ви хочете використовувати OpenAI, ElevenLabs, Google Gemini, MiniMax або xAI:

- `ELEVENLABS_API_KEY` (або `XI_API_KEY`)
- `GEMINI_API_KEY` (або `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft speech **не** потребує API key.

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний провайдер, а інші є резервними варіантами.
Автоматичне зведення використовує налаштований `summaryModel` (або `agents.defaults.model.primary`),
тому якщо ви вмикаєте зведення, цей провайдер також має бути автентифікований.

## Посилання на сервіси

- [Посібник OpenAI з Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виводу Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Чи ввімкнено це за замовчуванням?

Ні. Автоматичний TTS **вимкнено** за замовчуванням. Увімкніть його в конфігурації через
`messages.tts.auto` або локально через `/tts on`.

Коли `messages.tts.provider` не задано, OpenClaw вибирає перший налаштований
speech-провайдер у порядку автоматичного вибору реєстру.

## Конфігурація

Конфігурація TTS розміщується в `messages.tts` у `openclaw.json`.
Повна схема наведена в [Конфігурація Gateway](/uk/gateway/configuration).

### Мінімальна конфігурація (увімкнення + провайдер)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI як основний з резервним переходом на ElevenLabs

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft як основний (без API key)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Google Gemini як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS використовує шлях API key Gemini. Ключ API Google Cloud Console,
обмежений Gemini API, тут є дійсним, і це той самий тип ключа, який використовує
bundled-провайдер генерації зображень Google. Порядок визначення:
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS використовує той самий шлях `XAI_API_KEY`, що й bundled-провайдер моделей Grok.
Порядок визначення: `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Поточні live-голоси: `ara`, `eve`, `leo`, `rex`, `sal` і `una`; типовим є `eve`.
`language` приймає тег BCP-47 або `auto`.

### Вимкнути Microsoft speech

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Власні обмеження + шлях prefs

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Відповідати аудіо лише після вхідного голосового повідомлення

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Вимкнути автоматичне зведення для довгих відповідей

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Потім виконайте:

```
/tts summary off
```

### Примітки щодо полів

- `auto`: режим автоматичного TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` надсилає аудіо лише після вхідного голосового повідомлення.
  - `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:key=value]]` або блок `[[tts:text]]...[[/tts:text]]`.
- `enabled`: застарілий перемикач (doctor мігрує це до `auto`).
- `mode`: `"final"` (типово) або `"all"` (включає відповіді інструментів/блоків).
- `provider`: id speech-провайдера, наприклад `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` або `"openai"` (резервний перехід відбувається автоматично).
- Якщо `provider` **не задано**, OpenClaw використовує перший налаштований speech-провайдер у порядку автоматичного вибору реєстру.
- Застаріле `provider: "edge"` і далі працює і нормалізується до `microsoft`.
- `summaryModel`: необов’язкова недорога модель для автоматичного зведення; типово `agents.defaults.model.primary`.
  - Приймає `provider/model` або налаштований псевдонім моделі.
- `modelOverrides`: дозволяє моделі видавати директиви TTS (типово ввімкнено).
  - `allowProvider` типово дорівнює `false` (перемикання провайдера вимагає явного ввімкнення).
- `providers.<id>`: налаштування провайдера-власника, ключовані за id speech-провайдера.
- Застарілі прямі блоки провайдерів (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) автоматично мігруються до `messages.tts.providers.<id>` під час завантаження.
- `maxTextLength`: жорстке обмеження для вхідного тексту TTS (символи). `/tts audio` завершується помилкою, якщо ліміт перевищено.
- `timeoutMs`: тайм-аут запиту (мс).
- `prefsPath`: перевизначає шлях до локального JSON prefs (provider/limit/summary).
- Значення `apiKey` переходять до env-змінних (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: перевизначає базовий URL API ElevenLabs.
- `providers.openai.baseUrl`: перевизначає endpoint OpenAI TTS.
  - Порядок визначення: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Нетипові значення обробляються як OpenAI-сумісні TTS endpoint, тому приймаються власні назви моделей і голосів.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = нормальна)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-літерний ISO 639-1 (наприклад, `en`, `de`)
- `providers.elevenlabs.seed`: ціле число `0..4294967295` (best-effort детермінізм)
- `providers.minimax.baseUrl`: перевизначає базовий URL API MiniMax (типово `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS-модель (типово `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ідентифікатор голосу (типово `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: швидкість відтворення `0.5..2.0` (типово 1.0).
- `providers.minimax.vol`: гучність `(0, 10]` (типово 1.0; має бути більшою за 0).
- `providers.minimax.pitch`: зсув тону `-12..12` (типово 0).
- `providers.google.model`: TTS-модель Gemini (типово `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: назва вбудованого голосу Gemini (типово `Kore`; також приймається `voice`).
- `providers.google.baseUrl`: перевизначає базовий URL Gemini API. Приймається лише `https://generativelanguage.googleapis.com`.
  - Якщо `messages.tts.providers.google.apiKey` не вказано, TTS може повторно використати `models.providers.google.apiKey` перед переходом до env.
- `providers.xai.apiKey`: API key xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: перевизначає базовий URL xAI TTS (типово `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id голосу xAI (типово `eve`; поточні live-голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: код мови BCP-47 або `auto` (типово `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` або `alaw` (типово `mp3`).
- `providers.xai.speed`: нативне перевизначення швидкості провайдера.
- `providers.microsoft.enabled`: дозволити використання Microsoft speech (типово `true`; без API key).
- `providers.microsoft.voice`: назва нейронного голосу Microsoft (наприклад, `en-US-MichelleNeural`).
- `providers.microsoft.lang`: код мови (наприклад, `en-US`).
- `providers.microsoft.outputFormat`: формат виводу Microsoft (наприклад, `audio-24khz-48kbitrate-mono-mp3`).
  - Див. формати виводу Microsoft Speech для коректних значень; не всі формати підтримуються bundled-транспортом на основі Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: рядки відсотків (наприклад, `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: записувати JSON-субтитри поряд з аудіофайлом.
- `providers.microsoft.proxy`: proxy URL для запитів Microsoft speech.
- `providers.microsoft.timeoutMs`: перевизначення тайм-ауту запиту (мс).
- `edge.*`: застарілий псевдонім для тих самих налаштувань Microsoft.

## Перевизначення, керовані моделлю (типово ввімкнено)

За замовчуванням модель **може** видавати директиви TTS для однієї відповіді.
Коли `messages.tts.auto` має значення `tagged`, ці директиви потрібні для запуску аудіо.

Коли це ввімкнено, модель може видавати директиви `[[tts:...]]`, щоб перевизначити голос
для однієї відповіді, а також необов’язковий блок `[[tts:text]]...[[/tts:text]]`, щоб
надати експресивні теги (сміх, підказки для співу тощо), які мають з’являтися
лише в аудіо.

Директиви `provider=...` ігноруються, якщо не задано `modelOverrides.allowProvider: true`.

Приклад payload відповіді:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Доступні ключі директив (коли ввімкнено):

- `provider` (id зареєстрованого speech-провайдера, наприклад `openai`, `elevenlabs`, `google`, `minimax` або `microsoft`; потребує `allowProvider: true`)
- `voice` (голос OpenAI), `voiceName` / `voice_name` / `google_voice` (голос Google) або `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (TTS-модель OpenAI, id моделі ElevenLabs або модель MiniMax) або `google_model` (TTS-модель Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0-10)
- `pitch` (тон MiniMax, від -12 до 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Вимкнути всі перевизначення моделі:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Необов’язковий allowlist (увімкнути перемикання провайдера, зберігаючи можливість налаштовувати інші параметри):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Налаштування для окремого користувача

Слеш-команди записують локальні перевизначення в `prefsPath` (типово:
`~/.openclaw/settings/tts.json`, перевизначається через `OPENCLAW_TTS_PREFS` або
`messages.tts.prefsPath`).

Поля, що зберігаються:

- `enabled`
- `provider`
- `maxLength` (поріг зведення; типово 1500 символів)
- `summarize` (типово `true`)

Вони перевизначають `messages.tts.*` для цього хоста.

## Формати виводу (фіксовані)

- **Feishu / Matrix / Telegram / WhatsApp**: голосове повідомлення Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48 кГц / 64 кбіт/с — хороший компроміс для голосового повідомлення.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44,1 кГц / 128 кбіт/с — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32 кГц). Формат голосових нотаток нативно не підтримується; використовуйте OpenAI або ElevenLabs для гарантованих голосових повідомлень Opus.
- **Google Gemini**: Gemini API TTS повертає сирий PCM 24 кГц. OpenClaw обгортає його у WAV для аудіовкладень і повертає PCM напряму для Talk/телефонії. Нативний формат голосових нотаток Opus цим шляхом не підтримується.
- **xAI**: типово MP3; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує пакетний REST TTS endpoint xAI і повертає готове аудіовкладення; потоковий WebSocket TTS xAI цим шляхом провайдера не використовується. Нативний формат голосових нотаток Opus цим шляхом не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Bundled-транспорт приймає `outputFormat`, але не всі формати доступні в сервісі.
  - Значення форматів виводу відповідають форматам виводу Microsoft Speech (зокрема Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам
    потрібні гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виводу Microsoft завершується помилкою, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs зафіксовані для кожного каналу (див. вище).

## Поведінка автоматичного TTS

Коли функцію ввімкнено, OpenClaw:

- пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- пропускає дуже короткі відповіді (< 10 символів).
- робить зведення довгих відповідей, якщо це ввімкнено, використовуючи `agents.defaults.model.primary` (або `summaryModel`).
- додає згенероване аудіо до відповіді.

Якщо відповідь перевищує `maxLength`, а зведення вимкнено (або немає API key для
моделі зведення), аудіо
пропускається й надсилається звичайна текстова відповідь.

## Схема потоку

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Використання слеш-команд

Є одна команда: `/tts`.
Докладно про ввімкнення див. у [Слеш-команди](/uk/tools/slash-commands).

Примітка для Discord: `/tts` — це вбудована команда Discord, тому OpenClaw реєструє
`/voice` як нативну команду там. Текстова форма `/tts ...` і далі працює.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Примітки:

- Команди потребують авторизованого відправника (правила allowlist/owner і далі застосовуються).
- Має бути ввімкнено `commands.text` або реєстрацію нативних команд.
- Конфігурація `messages.tts.auto` приймає `off|always|inbound|tagged`.
- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- Використовуйте конфігурацію, якщо вам потрібні типові значення `inbound` або `tagged`.
- `limit` і `summary` зберігаються в локальних prefs, а не в основній конфігурації.
- `/tts audio` генерує одноразову аудіовідповідь (не вмикає TTS назавжди).
- `/tts status` містить видимість резервного переходу для останньої спроби:
  - успішний резервний перехід: `Fallback: <primary> -> <used>` плюс `Attempts: ...`
  - збій: `Error: ...` плюс `Attempts: ...`
  - докладна діагностика: `Attempt details: provider:outcome(reasonCode) latency`
- Збої API OpenAI і ElevenLabs тепер містять розібрані деталі помилки провайдера та id запиту (коли провайдер його повертає), які відображаються в помилках/журналах TTS.

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення і повертає аудіовкладення для
доставки у відповіді. Коли каналом є Feishu, Matrix, Telegram або WhatsApp,
аудіо доставляється як голосове повідомлення, а не як файлове вкладення.

## Gateway RPC

Методи Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Пов’язане

- [Огляд медіа](/uk/tools/media-overview)
- [Генерація музики](/uk/tools/music-generation)
- [Генерація відео](/uk/tools/video-generation)
