---
read_when:
    - Увімкнення text-to-speech для відповідей
    - Налаштування TTS-провайдерів або обмежень
    - Використання команд /tts
summary: Text-to-speech (TTS) для вихідних відповідей
title: Text-to-Speech (застарілий шлях)
x-i18n:
    generated_at: "2026-04-05T18:22:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca61773996299a582ab88e5a5db12d8f22ce8a28292ce97cc5dd5fdc2d3b83
    source_path: tts.md
    workflow: 15
---

# Text-to-speech (TTS)

OpenClaw може перетворювати вихідні відповіді на аудіо за допомогою ElevenLabs, Microsoft, MiniMax або OpenAI.
Це працює всюди, де OpenClaw може надсилати аудіо.

## Підтримувані сервіси

- **ElevenLabs** (основний або резервний провайдер)
- **Microsoft** (основний або резервний провайдер; поточна вбудована реалізація використовує `node-edge-tts`)
- **MiniMax** (основний або резервний провайдер; використовує API T2A v2)
- **OpenAI** (основний або резервний провайдер; також використовується для підсумків)

### Примітки щодо speech від Microsoft

Вбудований провайдер Microsoft speech наразі використовує онлайн-сервіс
нейронного TTS від Microsoft Edge через бібліотеку `node-edge-tts`. Це хостований сервіс (не
локальний), він використовує endpoints Microsoft і не потребує API key.
`node-edge-tts` надає параметри конфігурації speech і формати виводу, але
не всі параметри підтримуються сервісом. Застарілий config і директивний ввід
з `edge` усе ще працюють і нормалізуються до `microsoft`.

Оскільки цей шлях є публічним вебсервісом без опублікованого SLA або квоти,
сприймайте його як best-effort. Якщо вам потрібні гарантовані ліміти й підтримка, використовуйте OpenAI
або ElevenLabs.

## Необов’язкові ключі

Якщо ви хочете використовувати OpenAI, ElevenLabs або MiniMax:

- `ELEVENLABS_API_KEY` (або `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft speech **не** потребує API key.

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний провайдер, а інші стають резервними варіантами.
Автопідсумок використовує налаштований `summaryModel` (або `agents.defaults.model.primary`),
тому якщо ви вмикаєте підсумки, цей провайдер також має бути автентифікований.

## Посилання на сервіси

- [Посібник OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виводу Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Чи увімкнено це типово?

Ні. Авто‑TTS **вимкнено** типово. Увімкніть його в config через
`messages.tts.auto` або для окремої сесії через `/tts always` (псевдонім: `/tts on`).

Коли `messages.tts.provider` не задано, OpenClaw вибирає першого налаштованого
speech-провайдера в порядку автозаповнення реєстру.

## Config

Config TTS знаходиться в `messages.tts` у `openclaw.json`.
Повна схема наведена в [Конфігурація Gateway](/uk/gateway/configuration).

### Мінімальний config (увімкнення + провайдер)

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

### OpenAI як основний провайдер із резервним ElevenLabs

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

### Microsoft як основний провайдер (без API key)

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

### MiniMax як основний провайдер

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

### Власні обмеження + шлях до prefs

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

### Вимкнути автопідсумок для довгих відповідей

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

- `auto`: режим авто‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` надсилає аудіо лише після вхідного голосового повідомлення.
  - `tagged` надсилає аудіо лише тоді, коли відповідь містить теги `[[tts]]`.
- `enabled`: застарілий перемикач (doctor мігрує його до `auto`).
- `mode`: `"final"` (типово) або `"all"` (включає відповіді інструментів/блоків).
- `provider`: id speech-провайдера, наприклад `"elevenlabs"`, `"microsoft"`, `"minimax"` або `"openai"` (резервне перемикання відбувається автоматично).
- Якщо `provider` **не задано**, OpenClaw використовує першого налаштованого speech-провайдера в порядку автозаповнення реєстру.
- Застарілий `provider: "edge"` усе ще працює й нормалізується до `microsoft`.
- `summaryModel`: необов’язкова дешева модель для автопідсумку; типово `agents.defaults.model.primary`.
  - Приймає `provider/model` або псевдонім налаштованої моделі.
- `modelOverrides`: дозволити моделі виводити директиви TTS (типово увімкнено).
  - `allowProvider` типово дорівнює `false` (перемикання провайдера вмикається окремо).
- `providers.<id>`: налаштування провайдера, якими володіє провайдер, із ключем за id speech-провайдера.
- Застарілі прямі блоки провайдерів (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) автоматично мігруються в `messages.tts.providers.<id>` під час завантаження.
- `maxTextLength`: жорстке обмеження для вводу TTS (символи). `/tts audio` завершується помилкою, якщо ліміт перевищено.
- `timeoutMs`: тайм-аут запиту (мс).
- `prefsPath`: перевизначити локальний шлях до JSON prefs (провайдер/ліміт/підсумок).
- Значення `apiKey` використовують env vars як запасний варіант (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: перевизначити базовий URL API ElevenLabs.
- `providers.openai.baseUrl`: перевизначити endpoint OpenAI TTS.
  - Порядок резолюції: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Значення, відмінні від типових, трактуються як OpenAI-сумісні endpoints TTS, тому підтримуються власні назви моделей і голосів.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = нормально)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-літерний ISO 639-1 (наприклад, `en`, `de`)
- `providers.elevenlabs.seed`: ціле число `0..4294967295` (детермінованість у межах best-effort)
- `providers.minimax.baseUrl`: перевизначити базовий URL API MiniMax (типово `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: модель TTS (типово `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ідентифікатор голосу (типово `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: швидкість відтворення `0.5..2.0` (типово 1.0).
- `providers.minimax.vol`: гучність `(0, 10]` (типово 1.0; має бути більшою за 0).
- `providers.minimax.pitch`: зсув висоти тону `-12..12` (типово 0).
- `providers.microsoft.enabled`: дозволити використання Microsoft speech (типово `true`; без API key).
- `providers.microsoft.voice`: назва нейронного голосу Microsoft (наприклад, `en-US-MichelleNeural`).
- `providers.microsoft.lang`: код мови (наприклад, `en-US`).
- `providers.microsoft.outputFormat`: формат виводу Microsoft (наприклад, `audio-24khz-48kbitrate-mono-mp3`).
  - Допустимі значення див. у форматах виводу Microsoft Speech; не всі формати підтримуються вбудованим транспортом на базі Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: рядки з відсотками (наприклад, `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: записувати JSON-субтитри поруч з аудіофайлом.
- `providers.microsoft.proxy`: URL проксі для запитів Microsoft speech.
- `providers.microsoft.timeoutMs`: перевизначення тайм-ауту запиту (мс).
- `edge.*`: застарілий псевдонім для тих самих налаштувань Microsoft.

## Перевизначення, керовані моделлю (типово увімкнено)

Типово модель **може** виводити директиви TTS для однієї відповіді.
Коли `messages.tts.auto` дорівнює `tagged`, ці директиви потрібні для запуску аудіо.

Коли цю можливість увімкнено, модель може виводити директиви `[[tts:...]]`, щоб перевизначити голос
для однієї відповіді, а також необов’язковий блок `[[tts:text]]...[[/tts:text]]`, щоб
надати виразні теги (сміх, підказки для співу тощо), які мають з’являтися лише
в аудіо.

Директиви `provider=...` ігноруються, якщо не задано `modelOverrides.allowProvider: true`.

Приклад вмісту відповіді:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Доступні ключі директив (коли увімкнено):

- `provider` (id зареєстрованого speech-провайдера, наприклад `openai`, `elevenlabs`, `minimax` або `microsoft`; потребує `allowProvider: true`)
- `voice` (голос OpenAI) або `voiceId` (ElevenLabs / MiniMax)
- `model` (модель OpenAI TTS, id моделі ElevenLabs або модель MiniMax)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0-10)
- `pitch` (висота тону MiniMax, -12 до 12)
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

Необов’язковий allowlist (увімкнути перемикання провайдера, залишивши інші параметри налаштовуваними):

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

## Налаштування для користувача

Slash-команди записують локальні перевизначення в `prefsPath` (типово:
`~/.openclaw/settings/tts.json`, можна перевизначити через `OPENCLAW_TTS_PREFS` або
`messages.tts.prefsPath`).

Збережені поля:

- `enabled`
- `provider`
- `maxLength` (поріг підсумку; типово 1500 символів)
- `summarize` (типово `true`)

Вони перевизначають `messages.tts.*` для цього хоста.

## Формати виводу (фіксовані)

- **Feishu / Matrix / Telegram / WhatsApp**: голосове повідомлення Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48kHz / 64kbps — хороший компроміс для голосових повідомлень.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44.1kHz / 128kbps — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (`speech-2.8-hd`, частота дискретизації 32kHz). Формат voice note нативно не підтримується; використовуйте OpenAI або ElevenLabs для гарантованих голосових повідомлень Opus.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але не всі формати доступні в сервісі.
  - Значення формату виводу відповідають форматам виводу Microsoft Speech (включно з Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виводу Microsoft не спрацьовує, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка авто-TTS

Коли це увімкнено, OpenClaw:

- пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- пропускає дуже короткі відповіді (< 10 символів).
- підсумовує довгі відповіді, якщо це увімкнено, використовуючи `agents.defaults.model.primary` (або `summaryModel`).
- прикріплює згенероване аудіо до відповіді.

Якщо відповідь перевищує `maxLength`, а підсумок вимкнено (або немає API key для
моделі підсумку), аудіо
пропускається й надсилається звичайна текстова відповідь.

## Схема потоку

```
Reply -> TTS enabled?
  no  -> надіслати текст
  yes -> є медіа / MEDIA: / коротко?
          yes -> надіслати текст
          no  -> довжина > ліміт?
                   no  -> TTS -> прикріпити аудіо
                   yes -> підсумок увімкнено?
                            no  -> надіслати текст
                            yes -> підсумувати (summaryModel або agents.defaults.model.primary)
                                      -> TTS -> прикріпити аудіо
```

## Використання slash-команди

Є одна команда: `/tts`.
Подробиці про ввімкнення див. у [Slash commands](/tools/slash-commands).

Примітка для Discord: `/tts` — це вбудована команда Discord, тому OpenClaw реєструє
`/voice` як нативну команду там. Текстова команда `/tts ...` усе одно працює.

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Примітки:

- Команди потребують авторизованого відправника (правила allowlist/owner усе ще застосовуються).
- Має бути ввімкнено `commands.text` або реєстрацію нативних команд.
- `off|always|inbound|tagged` — це перемикачі для окремої сесії (`/tts on` — псевдонім для `/tts always`).
- `limit` і `summary` зберігаються в локальних prefs, а не в основному config.
- `/tts audio` генерує разову аудіовідповідь (не вмикає TTS постійно).
- `/tts status` містить інформацію про резервне переключення для останньої спроби:
  - успішне резервне переключення: `Fallback: <primary> -> <used>` плюс `Attempts: ...`
  - помилка: `Error: ...` плюс `Attempts: ...`
  - детальна діагностика: `Attempt details: provider:outcome(reasonCode) latency`
- Збої API OpenAI та ElevenLabs тепер містять розібрані деталі помилки провайдера й id запиту (коли провайдер його повертає), що відображається в помилках/журналах TTS.

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення та повертає аудіовкладення для
доставки відповіді. Коли канал — Feishu, Matrix, Telegram або WhatsApp,
аудіо доставляється як голосове повідомлення, а не як вкладений файл.

## Gateway RPC

Методи Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
