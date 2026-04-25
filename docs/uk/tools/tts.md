---
read_when:
    - Увімкнення перетворення тексту на мовлення для відповідей
    - Налаштування провайдерів TTS або обмежень
    - Використання команд `/tts`
summary: Перетворення тексту на мовлення (TTS) для вихідних відповідей
title: Перетворення тексту на мовлення
x-i18n:
    generated_at: "2026-04-25T20:39:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b780ad48492ebc91a28d252bec53116a265eabde7ff658b031d9785fba8df34e
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо за допомогою ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI або Xiaomi MiMo.
Це працює всюди, де OpenClaw може надсилати аудіо.

## Підтримувані сервіси

- **ElevenLabs** (основний або резервний провайдер)
- **Google Gemini** (основний або резервний провайдер; використовує Gemini API TTS)
- **Gradium** (основний або резервний провайдер; підтримує вихід у форматі голосових повідомлень і телефонії)
- **Local CLI** (основний або резервний провайдер; запускає налаштовану локальну команду TTS)
- **Microsoft** (основний або резервний провайдер; поточна вбудована реалізація використовує `node-edge-tts`)
- **MiniMax** (основний або резервний провайдер; використовує API T2A v2)
- **OpenAI** (основний або резервний провайдер; також використовується для зведень)
- **Vydra** (основний або резервний провайдер; спільний провайдер для зображень, відео та мовлення)
- **xAI** (основний або резервний провайдер; використовує xAI TTS API)
- **Xiaomi MiMo** (основний або резервний провайдер; використовує MiMo TTS через Xiaomi chat completions)

### Примітки щодо мовлення Microsoft

Поточний вбудований провайдер мовлення Microsoft використовує онлайновий
нейронний сервіс TTS Microsoft Edge через бібліотеку `node-edge-tts`. Це
хостований сервіс (не локальний), він використовує кінцеві точки Microsoft і
не потребує API-ключа.
`node-edge-tts` надає параметри конфігурації мовлення та формати виводу, але
не всі параметри підтримуються сервісом. Застаріла конфігурація та введення
директив із використанням `edge` усе ще працюють і нормалізуються до `microsoft`.

Оскільки цей шлях використовує публічний вебсервіс без опублікованого SLA або квоти,
сприймайте його як best-effort. Якщо вам потрібні гарантовані ліміти та підтримка,
використовуйте OpenAI або ElevenLabs.

## Необов’язкові ключі

Якщо ви хочете використовувати OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI або Xiaomi MiMo:

- `ELEVENLABS_API_KEY` (або `XI_API_KEY`)
- `GEMINI_API_KEY` (або `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS також приймає автентифікацію Token Plan через
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` або
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI і мовлення Microsoft **не** потребують API-ключа.

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний провайдер, а решта слугують резервними варіантами.
Автоматичне зведення використовує налаштований `summaryModel` (або `agents.defaults.model.primary`),
тому цей провайдер також має бути автентифікований, якщо ви вмикаєте зведення.

## Посилання на сервіси

- [Посібник OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/uk/providers/gradium)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [Синтез мовлення Xiaomi MiMo](/uk/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виводу Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Чи ввімкнено це за замовчуванням?

Ні. Auto‑TTS **вимкнено** за замовчуванням. Увімкніть його в конфігурації через
`messages.tts.auto` або локально через `/tts on`.

Коли `messages.tts.provider` не задано, OpenClaw вибирає перший налаштований
провайдер мовлення в порядку автовибору реєстру.

## Конфігурація

Конфігурація TTS знаходиться в `messages.tts` у `openclaw.json`.
Повну схему наведено в [Конфігурація Gateway](/uk/gateway/configuration).

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

### OpenAI як основний, ElevenLabs як резервний

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

### Microsoft як основний (без API-ключа)

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

Порядок визначення автентифікації MiniMax TTS такий: `messages.tts.providers.minimax.apiKey`, потім
збережені профілі OAuth/token `minimax-portal`, потім ключі середовища Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), потім `MINIMAX_API_KEY`. Якщо явний TTS
`baseUrl` не задано, OpenClaw може повторно використати налаштований OAuth-хост
`minimax-portal` для мовлення Token Plan.

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

Google Gemini TTS використовує шлях API-ключа Gemini. API-ключ Google Cloud Console,
обмежений Gemini API, тут є дійсним, і це той самий тип ключа, який використовується
вбудованим провайдером генерації зображень Google. Порядок визначення:
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

xAI TTS використовує той самий шлях `XAI_API_KEY`, що й вбудований провайдер моделі Grok.
Порядок визначення: `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal` і `una`; типовим є
`eve`. `language` приймає тег BCP-47 або `auto`.

### Xiaomi MiMo як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS використовує той самий шлях `XIAOMI_API_KEY`, що й вбудований провайдер моделі Xiaomi.
Ідентифікатор провайдера мовлення — `xiaomi`; `mimo` також приймається як псевдонім.
Цільовий текст надсилається як повідомлення помічника, що відповідає контракту TTS
Xiaomi. Необов’язковий `style` надсилається як інструкція користувача і не озвучується.

### OpenRouter як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS використовує той самий шлях `OPENROUTER_API_KEY`, що й вбудований
провайдер моделі OpenRouter. Порядок визначення:
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```

Local CLI TTS запускає налаштовану команду на хості Gateway. Заповнювачі `{{Text}}`,
`{{OutputPath}}`, `{{OutputDir}}` і `{{OutputBase}}`
розгортаються в `args`; якщо заповнювач `{{Text}}` відсутній, OpenClaw записує
текст для озвучення у stdin. `outputFormat` приймає `mp3`, `opus` або `wav`.
Цілі для голосових повідомлень перекодовуються в Ogg/Opus, а вихід для телефонії
перекодовується в raw 16 kHz mono PCM за допомогою `ffmpeg`. Застарілий псевдонім провайдера
`cli` усе ще працює, але в новій конфігурації слід використовувати `tts-local-cli`.

### Gradium як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Вимкнути мовлення Microsoft

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

### Власні ліміти + шлях до prefs

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

- `auto`: режим auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` надсилає аудіо лише після вхідного голосового повідомлення.
  - `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:key=value]]` або блок `[[tts:text]]...[[/tts:text]]`.
- `enabled`: застарілий перемикач (doctor мігрує його до `auto`).
- `mode`: `"final"` (типово) або `"all"` (включає відповіді інструментів/блоків).
- `provider`: ідентифікатор провайдера мовлення, наприклад `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` або `"xiaomi"` (резервний перехід відбувається автоматично).
- Якщо `provider` **не задано**, OpenClaw використовує перший налаштований провайдер мовлення в порядку автовибору реєстру.
- Застаріла конфігурація `provider: "edge"` виправляється командою `openclaw doctor --fix` і
  переписується на `provider: "microsoft"`.
- `summaryModel`: необов’язкова недорога модель для автоматичного зведення; типово використовується `agents.defaults.model.primary`.
  - Приймає `provider/model` або псевдонім налаштованої моделі.
- `modelOverrides`: дозволяє моделі виводити директиви TTS (увімкнено за замовчуванням).
  - `allowProvider` типово має значення `false` (перемикання провайдера потребує явного дозволу).
- `providers.<id>`: налаштування, що належать провайдеру, із ключем за ідентифікатором провайдера мовлення.
- Застарілі прямі блоки провайдерів (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) виправляються командою `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `messages.tts.providers.<id>`.
- Застарілий `messages.tts.providers.edge` також виправляється командою `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `messages.tts.providers.microsoft`.
- `maxTextLength`: жорстке обмеження для вхідного тексту TTS (символи). `/tts audio` завершується помилкою, якщо його перевищено.
- `timeoutMs`: тайм-аут запиту (мс).
- `prefsPath`: перевизначає локальний шлях до JSON-файлу налаштувань (провайдер/ліміт/зведення).
- Значення `apiKey` беруться з env vars як резервний варіант (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: перевизначає базову URL-адресу API ElevenLabs.
- `providers.openai.baseUrl`: перевизначає кінцеву точку OpenAI TTS.
  - Порядок визначення: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Нетипові значення трактуються як OpenAI-сумісні кінцеві точки TTS, тому дозволені власні назви моделей і голосів.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = звичайна швидкість)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-літерний ISO 639-1 (наприклад, `en`, `de`)
- `providers.elevenlabs.seed`: ціле число `0..4294967295` (best-effort детермінованість)
- `providers.minimax.baseUrl`: перевизначає базову URL-адресу API MiniMax (типово `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: модель TTS (типово `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ідентифікатор голосу (типово `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: швидкість відтворення `0.5..2.0` (типово 1.0).
- `providers.minimax.vol`: гучність `(0, 10]` (типово 1.0; має бути більшою за 0).
- `providers.minimax.pitch`: цілочисельне зміщення тону `-12..12` (типово 0). Дробові значення відкидаються перед викликом MiniMax T2A, оскільки API відхиляє нецілі значення тону.
- `providers.tts-local-cli.command`: локальний виконуваний файл або рядок команди для CLI TTS.
- `providers.tts-local-cli.args`: аргументи команди; підтримуються заповнювачі `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` і `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: очікуваний формат виводу CLI (`mp3`, `opus` або `wav`; типово `mp3` для аудіовкладень).
- `providers.tts-local-cli.timeoutMs`: тайм-аут команди в мілісекундах (типово `120000`).
- `providers.tts-local-cli.cwd`: необов’язковий робочий каталог команди.
- `providers.tts-local-cli.env`: необов’язкові рядкові перевизначення змінних середовища для команди.
- `providers.google.model`: модель Gemini TTS (типово `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: назва вбудованого голосу Gemini (типово `Kore`; також приймається `voice`).
- `providers.google.audioProfile`: підказка природною мовою щодо стилю, яка додається перед текстом для озвучення.
- `providers.google.speakerName`: необов’язкова мітка мовця, яка додається перед текстом для озвучення, коли ваш TTS-запит використовує іменованого мовця.
- `providers.google.baseUrl`: перевизначає базову URL-адресу Gemini API. Дозволено лише `https://generativelanguage.googleapis.com`.
  - Якщо `messages.tts.providers.google.apiKey` пропущено, TTS може повторно використати `models.providers.google.apiKey` перед переходом до значення з env.
- `providers.gradium.baseUrl`: перевизначає базову URL-адресу API Gradium (типово `https://api.gradium.ai`).
- `providers.gradium.voiceId`: ідентифікатор голосу Gradium (типово Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: API-ключ xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: перевизначає базову URL-адресу xAI TTS (типово `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: ідентифікатор голосу xAI (типово `eve`; поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: код мови BCP-47 або `auto` (типово `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` або `alaw` (типово `mp3`).
- `providers.xai.speed`: перевизначення швидкості на рівні провайдера.
- `providers.xiaomi.apiKey`: API-ключ Xiaomi MiMo (env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: перевизначає базову URL-адресу API Xiaomi MiMo (типово `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: модель TTS (типово `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; також підтримується `mimo-v2-tts`).
- `providers.xiaomi.voice`: ідентифікатор голосу MiMo (типово `mimo_default`, env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` або `wav` (типово `mp3`, env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: необов’язкова інструкція стилю природною мовою, що надсилається як повідомлення користувача; вона не озвучується.
- `providers.openrouter.apiKey`: API-ключ OpenRouter (env: `OPENROUTER_API_KEY`; може повторно використовувати `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: перевизначає базову URL-адресу OpenRouter TTS (типово `https://openrouter.ai/api/v1`; застарілий `https://openrouter.ai/v1` нормалізується).
- `providers.openrouter.model`: ідентифікатор моделі OpenRouter TTS (типово `hexgrad/kokoro-82m`; також приймається `modelId`).
- `providers.openrouter.voice`: специфічний для провайдера ідентифікатор голосу (типово `af_alloy`; також приймається `voiceId`).
- `providers.openrouter.responseFormat`: `mp3` або `pcm` (типово `mp3`).
- `providers.openrouter.speed`: перевизначення швидкості на рівні провайдера.
- `providers.microsoft.enabled`: дозволяє використання мовлення Microsoft (типово `true`; без API-ключа).
- `providers.microsoft.voice`: назва нейронного голосу Microsoft (наприклад, `en-US-MichelleNeural`).
- `providers.microsoft.lang`: код мови (наприклад, `en-US`).
- `providers.microsoft.outputFormat`: формат виводу Microsoft (наприклад, `audio-24khz-48kbitrate-mono-mp3`).
  - Дійсні значення див. у Microsoft Speech output formats; не всі формати підтримуються вбудованим транспортом на базі Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: рядки з відсотками (наприклад, `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: записує JSON-субтитри поруч з аудіофайлом.
- `providers.microsoft.proxy`: URL-адреса проксі для запитів мовлення Microsoft.
- `providers.microsoft.timeoutMs`: перевизначення тайм-ауту запиту (мс).
- `edge.*`: застарілий псевдонім для тих самих налаштувань Microsoft. Виконайте
  `openclaw doctor --fix`, щоб переписати збережену конфігурацію на `providers.microsoft`.

## Перевизначення, керовані моделлю (увімкнено за замовчуванням)

За замовчуванням модель **може** виводити директиви TTS для однієї відповіді.
Коли `messages.tts.auto` має значення `tagged`, ці директиви потрібні для запуску аудіо.

Коли цю можливість увімкнено, модель може виводити директиви `[[tts:...]]`, щоб перевизначити голос
для однієї відповіді, а також необов’язковий блок `[[tts:text]]...[[/tts:text]]`, щоб
надати експресивні теги (сміх, підказки для співу тощо), які мають з’являтися лише
в аудіо.

Директиви `provider=...` ігноруються, якщо не встановлено `modelOverrides.allowProvider: true`.

Приклад корисного навантаження відповіді:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Доступні ключі директив (коли можливість увімкнено):

- `provider` (ідентифікатор зареєстрованого провайдера мовлення, наприклад `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` або `xiaomi`; потребує `allowProvider: true`)
- `voice` (голос OpenAI, Gradium або Xiaomi), `voiceName` / `voice_name` / `google_voice` (голос Google) або `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (модель OpenAI TTS, ідентифікатор моделі ElevenLabs, модель MiniMax або модель Xiaomi MiMo TTS) або `google_model` (модель Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0-10)
- `pitch` (цілочисельний тон MiniMax, від -12 до 12; дробові значення відкидаються перед запитом до MiniMax)
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

Необов’язковий список дозволів (увімкнути перемикання провайдера, залишивши інші параметри налаштовуваними):

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

Команди зі слешем записують локальні перевизначення в `prefsPath` (типово:
`~/.openclaw/settings/tts.json`, можна перевизначити через `OPENCLAW_TTS_PREFS` або
`messages.tts.prefsPath`).

Збережені поля:

- `enabled`
- `provider`
- `maxLength` (поріг зведення; типово 1500 символів)
- `summarize` (типово `true`)

Вони перевизначають `messages.tts.*` для цього хоста.

## Формати виводу (фіксовані)

- **Feishu / Matrix / Telegram / WhatsApp**: відповіді у форматі голосових повідомлень переважно використовують Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48 кГц / 64 кбіт/с — це вдалий компроміс для голосових повідомлень.
- **Feishu**: коли відповідь-голосове повідомлення створюється як MP3/WAV/M4A або в іншому
  імовірному форматі аудіофайлу, Plugin Feishu перекодовує її в 48 кГц Ogg/Opus за допомогою
  `ffmpeg` перед надсиланням нативної бульбашки `audio`. Якщо конвертація завершується помилкою, Feishu
  отримує оригінальний файл як вкладення.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44,1 кГц / 128 кбіт/с — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32 кГц) для звичайних аудіовкладень. Для цілей голосових повідомлень, таких як Feishu і Telegram, OpenClaw перекодовує MP3 MiniMax у 48 кГц Opus за допомогою `ffmpeg` перед доставленням.
- **Xiaomi MiMo**: типово MP3 або WAV, якщо це налаштовано. Для цілей голосових повідомлень, таких як Feishu і Telegram, OpenClaw перекодовує вихід Xiaomi у 48 кГц Opus за допомогою `ffmpeg` перед доставленням.
- **Local CLI**: використовує налаштований `outputFormat`. Цілі голосових повідомлень
  конвертуються в Ogg/Opus, а вихід для телефонії конвертується в raw 16 кГц mono PCM
  за допомогою `ffmpeg`.
- **Google Gemini**: Gemini API TTS повертає raw 24 кГц PCM. OpenClaw обгортає його у WAV для аудіовкладень, перекодовує у 48 кГц Opus для цілей голосових повідомлень і повертає PCM напряму для Talk/телефонії.
- **Gradium**: WAV для аудіовкладень, Opus для цілей голосових повідомлень і `ulaw_8000` на 8 кГц для телефонії.
- **xAI**: типово MP3; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує пакетну REST-кінцеву точку xAI TTS і повертає завершене аудіовкладення; потоковий TTS WebSocket xAI не використовується в цьому шляху провайдера. Нативний формат голосових повідомлень Opus у цьому шляху не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але не всі формати доступні в сервісі.
  - Значення формату виводу відповідають Microsoft Speech output formats (включно з Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення у форматі Opus.
  - Якщо налаштований формат виводу Microsoft завершується помилкою, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs є фіксованими для кожного каналу (див. вище).

## Поведінка Auto-TTS

Коли цю можливість увімкнено, OpenClaw:

- пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- пропускає дуже короткі відповіді (< 10 символів).
- робить зведення довгих відповідей, коли це ввімкнено, за допомогою `agents.defaults.model.primary` (або `summaryModel`).
- додає згенероване аудіо до відповіді.

Якщо відповідь перевищує `maxLength`, а зведення вимкнено (або немає API-ключа для
моделі зведення), аудіо
пропускається і надсилається звичайна текстова відповідь.

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

## Використання слеш-команди

Є одна команда: `/tts`.
Докладніше про ввімкнення див. у [Слеш-команди](/uk/tools/slash-commands).

Примітка щодо Discord: `/tts` — це вбудована команда Discord, тому OpenClaw реєструє
там `/voice` як нативну команду. Текстова команда `/tts ...` усе ще працює.

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

- Команди потребують авторизованого відправника (правила allowlist/owner усе ще застосовуються).
- Має бути ввімкнено `commands.text` або реєстрацію нативних команд.
- Конфігурація `messages.tts.auto` приймає `off|always|inbound|tagged`.
- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- Використовуйте конфігурацію, якщо хочете типові значення `inbound` або `tagged`.
- `limit` і `summary` зберігаються в локальних налаштуваннях, а не в основній конфігурації.
- `/tts audio` генерує одноразову аудіовідповідь (не вмикає TTS).
- `/tts status` включає видимість резервного переходу для останньої спроби:
  - успішний резервний перехід: `Fallback: <primary> -> <used>` плюс `Attempts: ...`
  - помилка: `Error: ...` плюс `Attempts: ...`
  - докладна діагностика: `Attempt details: provider:outcome(reasonCode) latency`
- Збої API OpenAI та ElevenLabs тепер включають розібрані деталі помилки провайдера та request id (коли їх повертає провайдер), що відображається в помилках/журналах TTS.

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення і повертає аудіовкладення для
доставлення відповіді. Коли каналом є Feishu, Matrix, Telegram або WhatsApp,
аудіо доставляється як голосове повідомлення, а не як вкладення файлу.
Feishu може перекодовувати вихід TTS не у форматі Opus у цьому шляху, якщо `ffmpeg`
доступний.
WhatsApp надсилає видимий текст окремо від PTT-аудіо голосового повідомлення, оскільки клієнти
не завжди коректно відображають підписи до голосових повідомлень.
Він приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` — це
тайм-аут запиту до провайдера для одного виклику в мілісекундах.

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
