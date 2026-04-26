---
read_when:
    - Увімкнення перетворення тексту на мовлення для відповідей
    - Налаштування постачальників TTS або обмежень
    - Використання команд `/tts`
summary: Перетворення тексту на мовлення (TTS) для вихідних відповідей
title: Перетворення тексту на мовлення
x-i18n:
    generated_at: "2026-04-26T02:23:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38925c9b27808e36dde4016a0fc983be9ce50657ad2b571e987d2e850613771f
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо за допомогою Azure Speech, ElevenLabs, Google Gemini, Gradium, Inworld, Local CLI, Microsoft, MiniMax, OpenAI, Volcengine, Vydra, xAI або Xiaomi MiMo.
Це працює всюди, де OpenClaw може надсилати аудіо.

## Підтримувані служби

- **Azure Speech** (основний або резервний постачальник; використовує Azure AI Speech REST API)
- **ElevenLabs** (основний або резервний постачальник)
- **Google Gemini** (основний або резервний постачальник; використовує Gemini API TTS)
- **Gradium** (основний або резервний постачальник; підтримує вихід у форматі голосових нотаток і телефонії)
- **Inworld** (основний або резервний постачальник; використовує потоковий Inworld TTS API)
- **Local CLI** (основний або резервний постачальник; запускає налаштовану локальну TTS-команду)
- **Microsoft** (основний або резервний постачальник; поточна вбудована реалізація використовує `node-edge-tts`)
- **MiniMax** (основний або резервний постачальник; використовує T2A v2 API)
- **OpenAI** (основний або резервний постачальник; також використовується для підсумків)
- **Volcengine** (основний або резервний постачальник; використовує BytePlus Seed Speech HTTP API)
- **Vydra** (основний або резервний постачальник; спільний постачальник для зображень, відео та мовлення)
- **xAI** (основний або резервний постачальник; використовує xAI TTS API)
- **Xiaomi MiMo** (основний або резервний постачальник; використовує MiMo TTS через чат-завершення Xiaomi)

### Примітки щодо мовлення Microsoft

Поточний вбудований постачальник мовлення Microsoft використовує онлайн-сервіс
нейронного TTS від Microsoft Edge через бібліотеку `node-edge-tts`. Це хостований сервіс (не
локальний), він використовує кінцеві точки Microsoft і не потребує API-ключа.
`node-edge-tts` надає параметри конфігурації мовлення та формати виводу, але
не всі параметри підтримуються сервісом. Застаріла конфігурація та вхідні директиви
з використанням `edge` все ще працюють і нормалізуються до `microsoft`.

Оскільки цей шлях використовує публічний вебсервіс без опублікованих SLA або квот,
вважайте його best-effort. Якщо вам потрібні гарантовані ліміти та підтримка, використовуйте OpenAI
або ElevenLabs.

## Необов’язкові ключі

Якщо ви хочете використовувати Azure Speech, ElevenLabs, Google Gemini, Gradium, Inworld, MiniMax, OpenAI, Volcengine, Vydra, xAI або Xiaomi MiMo:

- `AZURE_SPEECH_KEY` плюс `AZURE_SPEECH_REGION` (також приймає
  `AZURE_SPEECH_API_KEY`, `SPEECH_KEY` і `SPEECH_REGION`)
- `ELEVENLABS_API_KEY` (або `XI_API_KEY`)
- `GEMINI_API_KEY` (або `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `INWORLD_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS також приймає автентифікацію Token Plan через
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` або
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VOLCENGINE_TTS_API_KEY` (або `BYTEPLUS_SEED_SPEECH_API_KEY`);
  застаріла автентифікація через AppID/token також приймає `VOLCENGINE_TTS_APPID` і
  `VOLCENGINE_TTS_TOKEN`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI і мовлення Microsoft **не** потребують API-ключа.

Якщо налаштовано кілька постачальників, спочатку використовується вибраний постачальник, а інші виступають як резервні варіанти.
Автоматичний підсумок використовує налаштований `summaryModel` (або `agents.defaults.model.primary`),
тому цей постачальник також має бути автентифікований, якщо ви вмикаєте підсумки.

## Посилання на служби

- [Посібник OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Постачальник Azure Speech](/uk/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/uk/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/uk/providers/volcengine#text-to-speech)
- [Синтез мовлення Xiaomi MiMo](/uk/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виводу мовлення Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Чи ввімкнено це за замовчуванням?

Ні. Авто‑TTS **вимкнено** за замовчуванням. Увімкніть його в конфігурації через
`messages.tts.auto` або локально через `/tts on`.

Коли `messages.tts.provider` не задано, OpenClaw вибирає першого налаштованого
постачальника мовлення в порядку автоматичного вибору реєстру.

## Конфігурація

Конфігурація TTS розміщується в `messages.tts` у `openclaw.json`.
Повна схема наведена в [Конфігурація Gateway](/uk/gateway/configuration).

### Мінімальна конфігурація (увімкнення + постачальник)

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

### Перевизначення голосу для окремих агентів

Використовуйте `agents.list[].tts`, коли один агент має говорити з іншим постачальником,
голосом, моделлю, стилем або режимом авто-TTS. Блок агента виконує глибоке злиття поверх
`messages.tts`, тому облікові дані постачальника можуть залишатися в глобальній конфігурації постачальника.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
        },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: {
              voiceId: "EXAVITQu4vr4xnSDxMaL",
            },
          },
        },
      },
    ],
  },
}
```

Пріоритет для автоматичних відповідей, `/tts audio`, `/tts status` і агентного інструмента `tts` такий:

1. `messages.tts`
2. активний `agents.list[].tts`
3. локальні налаштування `/tts` для цього хоста
4. вбудовані директиви `[[tts:...]]`, коли ввімкнено перевизначення моделі

### OpenAI як основний із резервним ElevenLabs

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

### Azure Speech як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          // apiKey falls back to AZURE_SPEECH_KEY.
          // region falls back to AZURE_SPEECH_REGION.
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```

Azure Speech використовує ключ ресурсу Speech, а не ключ Azure OpenAI. Порядок
визначення: `messages.tts.providers.azure-speech.apiKey` ->
`AZURE_SPEECH_KEY` -> `AZURE_SPEECH_API_KEY` -> `SPEECH_KEY`, а також
`messages.tts.providers.azure-speech.region` -> `AZURE_SPEECH_REGION` ->
`SPEECH_REGION` для регіону. У новій конфігурації слід використовувати `azure-speech`; `azure`
приймається як псевдонім постачальника.

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

Порядок визначення автентифікації MiniMax TTS: `messages.tts.providers.minimax.apiKey`, потім
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

Google Gemini TTS використовує шлях ключа Gemini API. Тут також підходить ключ API з Google Cloud Console,
обмежений Gemini API, і це той самий тип ключа, що використовується
вбудованим постачальником генерації зображень Google. Порядок визначення:
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### Inworld як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "inworld_api_key",
          baseUrl: "https://api.inworld.ai",
          voiceId: "Sarah",
          modelId: "inworld-tts-1.5-max",
          temperature: 0.8,
        },
      },
    },
  },
}
```

Значення `apiKey` має бути рядком облікових даних у Base64, скопійованим
дослівно з панелі Inworld (Workspace > API Keys). Постачальник
надсилає його як `Authorization: Basic <apiKey>` без будь-якого додаткового
кодування, тому не передавайте сирий bearer-токен і не кодуйте його в Base64
самостійно. Ключ резервно береться зі змінної середовища `INWORLD_API_KEY`. Див.
[постачальник Inworld](/uk/providers/inworld) для повного налаштування.

### Volcengine як основний

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Volcengine TTS використовує ключ API BytePlus Seed Speech із Speech Console,
а не OpenAI-сумісний `VOLCANO_ENGINE_API_KEY`, який використовується для постачальників моделей Doubao.
Порядок визначення: `messages.tts.providers.volcengine.apiKey` ->
`VOLCENGINE_TTS_API_KEY` -> `BYTEPLUS_SEED_SPEECH_API_KEY`. Застаріла автентифікація AppID/token
усе ще працює через `messages.tts.providers.volcengine.appId` / `token` або
`VOLCENGINE_TTS_APPID` / `VOLCENGINE_TTS_TOKEN`. Цілі голосових нотаток
запитують рідний для постачальника формат `ogg_opus`; звичайні цілі аудіофайлів запитують `mp3`.

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

xAI TTS використовує той самий шлях `XAI_API_KEY`, що й вбудований постачальник моделей Grok.
Порядок визначення: `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal` і `una`; `eve` —
значення за замовчуванням. `language` приймає тег BCP-47 або `auto`.

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
          style: "Яскравий, природний, розмовний тон.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS використовує той самий шлях `XIAOMI_API_KEY`, що й вбудований постачальник моделей Xiaomi.
Ідентифікатор постачальника мовлення — `xiaomi`; `mimo` також приймається як псевдонім.
Цільовий текст надсилається як повідомлення помічника, що відповідає контракту TTS Xiaomi.
Необов’язковий `style` надсилається як інструкція користувача і не озвучується.

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
постачальник моделей OpenRouter. Порядок визначення:
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
текст для озвучення до stdin. `outputFormat` приймає `mp3`, `opus` або `wav`.
Цілі голосових нотаток перекодовуються в Ogg/Opus, а вихід для телефонії
перекодовується в raw 16 kHz mono PCM за допомогою `ffmpeg`. Застарілий псевдонім постачальника
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

### Вимкнення мовлення Microsoft

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

### Власні ліміти + шлях до налаштувань

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

### Вимкнення автоматичного підсумку для довгих відповідей

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

- `auto`: режим авто-TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` надсилає аудіо лише після вхідного голосового повідомлення.
  - `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:key=value]]` або блок `[[tts:text]]...[[/tts:text]]`.
- `enabled`: застарілий перемикач (doctor мігрує його в `auto`).
- `mode`: `"final"` (типово) або `"all"` (включає відповіді інструментів/блоків).
- `provider`: ідентифікатор постачальника мовлення, наприклад `"elevenlabs"`, `"google"`, `"gradium"`, `"inworld"`, `"microsoft"`, `"minimax"`, `"openai"`, `"volcengine"`, `"vydra"`, `"xai"` або `"xiaomi"` (резервний варіант вибирається автоматично).
- Якщо `provider` **не задано**, OpenClaw використовує першого налаштованого постачальника мовлення в порядку автоматичного вибору реєстру.
- Застаріла конфігурація `provider: "edge"` виправляється командою `openclaw doctor --fix` і
  переписується на `provider: "microsoft"`.
- `summaryModel`: необов’язкова недорога модель для автоматичного підсумку; типово використовується `agents.defaults.model.primary`.
  - Приймає `provider/model` або псевдонім налаштованої моделі.
- `modelOverrides`: дозволяє моделі видавати TTS-директиви (увімкнено за замовчуванням).
  - `allowProvider` типово має значення `false` (перемикання постачальника вимагає явного ввімкнення).
- `providers.<id>`: налаштування постачальника, що належать постачальнику, із ключем за ідентифікатором постачальника мовлення.
- Застарілі прямі блоки постачальників (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) виправляються командою `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `messages.tts.providers.<id>`.
- Застарілий `messages.tts.providers.edge` також виправляється командою `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `messages.tts.providers.microsoft`.
- `maxTextLength`: жорстке обмеження для TTS-входу (символи). Якщо межу перевищено, `/tts audio` завершується помилкою.
- `timeoutMs`: таймаут запиту (мс).
- `prefsPath`: перевизначає локальний шлях до JSON-файлу налаштувань (postачальник/ліміт/підсумок).
- Значення `apiKey` резервно беруться зі змінних середовища (`AZURE_SPEECH_KEY`/`AZURE_SPEECH_API_KEY`/`SPEECH_KEY`, `ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `INWORLD_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`). Volcengine натомість використовує `appId`/`token`.
- `providers.azure-speech.apiKey`: ключ ресурсу Azure Speech (env:
  `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`).
- `providers.azure-speech.region`: регіон Azure Speech, наприклад `eastus` (env:
  `AZURE_SPEECH_REGION` або `SPEECH_REGION`).
- `providers.azure-speech.endpoint` / `providers.azure-speech.baseUrl`: необов’язкове
  перевизначення endpoint/base URL Azure Speech.
- `providers.azure-speech.voice`: ShortName голосу Azure (типово
  `en-US-JennyNeural`).
- `providers.azure-speech.lang`: код мови SSML (типово `en-US`).
- `providers.azure-speech.outputFormat`: Azure `X-Microsoft-OutputFormat` для
  стандартного аудіовиходу (типово `audio-24khz-48kbitrate-mono-mp3`).
- `providers.azure-speech.voiceNoteOutputFormat`: Azure
  `X-Microsoft-OutputFormat` для виходу голосових нотаток (типово
  `ogg-24khz-16bit-mono-opus`).
- `providers.elevenlabs.baseUrl`: перевизначає базовий URL API ElevenLabs.
- `providers.openai.baseUrl`: перевизначає endpoint OpenAI TTS.
  - Порядок визначення: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Нестандартні значення розглядаються як OpenAI-сумісні TTS-endpoint-и, тому користувацькі назви моделей і голосів дозволені.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = звичайна)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-літерний ISO 639-1 (наприклад, `en`, `de`)
- `providers.elevenlabs.seed`: ціле число `0..4294967295` (best-effort детермінованість)
- `providers.minimax.baseUrl`: перевизначає базовий URL API MiniMax (типово `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: модель TTS (типово `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ідентифікатор голосу (типово `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: швидкість відтворення `0.5..2.0` (типово 1.0).
- `providers.minimax.vol`: гучність `(0, 10]` (типово 1.0; має бути більшою за 0).
- `providers.minimax.pitch`: цілий зсув висоти тону `-12..12` (типово 0). Дробові значення відкидаються перед викликом MiniMax T2A, оскільки API відхиляє нецілі значення висоти тону.
- `providers.tts-local-cli.command`: локальний виконуваний файл або рядок команди для CLI TTS.
- `providers.tts-local-cli.args`: аргументи команди; підтримує заповнювачі `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` і `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: очікуваний формат виводу CLI (`mp3`, `opus` або `wav`; типово `mp3` для аудіовкладень).
- `providers.tts-local-cli.timeoutMs`: таймаут команди в мілісекундах (типово `120000`).
- `providers.tts-local-cli.cwd`: необов’язковий робочий каталог команди.
- `providers.tts-local-cli.env`: необов’язкові рядкові перевизначення середовища для команди.
- `providers.inworld.baseUrl`: перевизначає базовий URL API Inworld (типово `https://api.inworld.ai`).
- `providers.inworld.voiceId`: ідентифікатор голосу Inworld (типово `Sarah`).
- `providers.inworld.modelId`: модель Inworld TTS (типово `inworld-tts-1.5-max`; також підтримує `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`).
- `providers.inworld.temperature`: температура семплування `0..2` (необов’язково).
- `providers.google.model`: модель Gemini TTS (типово `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: назва вбудованого голосу Gemini (типово `Kore`; також приймається `voice`).
- `providers.google.audioProfile`: підказка стилю природною мовою, що додається перед текстом для озвучення.
- `providers.google.speakerName`: необов’язкова мітка мовця, що додається перед текстом для озвучення, коли ваш TTS-підказка використовує іменованого мовця.
- `providers.google.baseUrl`: перевизначає базовий URL Gemini API. Дозволено лише `https://generativelanguage.googleapis.com`.
  - Якщо `messages.tts.providers.google.apiKey` пропущено, TTS може повторно використати `models.providers.google.apiKey` перед резервним переходом до env.
- `providers.gradium.baseUrl`: перевизначає базовий URL API Gradium (типово `https://api.gradium.ai`).
- `providers.gradium.voiceId`: ідентифікатор голосу Gradium (типово Emma, `YTpq7expH9539ERJ`).
- `providers.volcengine.apiKey`: ключ API BytePlus Seed Speech (env:
  `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY`).
- `providers.volcengine.resourceId`: ідентифікатор ресурсу BytePlus Seed Speech (типово
  `seed-tts-1.0`, env: `VOLCENGINE_TTS_RESOURCE_ID`; використовуйте `seed-tts-2.0`, коли
  ваш проєкт BytePlus має entitlement для TTS 2.0).
- `providers.volcengine.appKey`: заголовок app key для BytePlus Seed Speech (типово
  `aGjiRDfUWi`, env: `VOLCENGINE_TTS_APP_KEY`).
- `providers.volcengine.baseUrl`: перевизначає HTTP-endpoint Seed Speech TTS
  (env: `VOLCENGINE_TTS_BASE_URL`).
- `providers.volcengine.appId`: застарілий ідентифікатор застосунку Volcengine Speech Console (env: `VOLCENGINE_TTS_APPID`).
- `providers.volcengine.token`: застарілий токен доступу Volcengine Speech Console (env: `VOLCENGINE_TTS_TOKEN`).
- `providers.volcengine.cluster`: застарілий кластер Volcengine TTS (типово `volcano_tts`, env: `VOLCENGINE_TTS_CLUSTER`).
- `providers.volcengine.voice`: тип голосу (типово `en_female_anna_mars_bigtts`, env: `VOLCENGINE_TTS_VOICE`).
- `providers.volcengine.speedRatio`: власне співвідношення швидкості постачальника.
- `providers.volcengine.emotion`: власний тег емоції постачальника.
- `providers.xai.apiKey`: ключ API xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: перевизначає базовий URL xAI TTS (типово `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: ідентифікатор голосу xAI (типово `eve`; поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: код мови BCP-47 або `auto` (типово `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` або `alaw` (типово `mp3`).
- `providers.xai.speed`: власне перевизначення швидкості постачальника.
- `providers.xiaomi.apiKey`: ключ API Xiaomi MiMo (env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: перевизначає базовий URL API Xiaomi MiMo (типово `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: модель TTS (типово `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; також підтримується `mimo-v2-tts`).
- `providers.xiaomi.voice`: ідентифікатор голосу MiMo (типово `mimo_default`, env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` або `wav` (типово `mp3`, env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: необов’язкова інструкція стилю природною мовою, що надсилається як повідомлення користувача; вона не озвучується.
- `providers.openrouter.apiKey`: ключ API OpenRouter (env: `OPENROUTER_API_KEY`; може повторно використовувати `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: перевизначає базовий URL OpenRouter TTS (типово `https://openrouter.ai/api/v1`; застарілий `https://openrouter.ai/v1` нормалізується).
- `providers.openrouter.model`: ідентифікатор моделі OpenRouter TTS (типово `hexgrad/kokoro-82m`; також приймається `modelId`).
- `providers.openrouter.voice`: ідентифікатор голосу, специфічний для постачальника (типово `af_alloy`; також приймається `voiceId`).
- `providers.openrouter.responseFormat`: `mp3` або `pcm` (типово `mp3`).
- `providers.openrouter.speed`: власне перевизначення швидкості постачальника.
- `providers.microsoft.enabled`: дозволяє використання мовлення Microsoft (типово `true`; без API-ключа).
- `providers.microsoft.voice`: назва нейронного голосу Microsoft (наприклад, `en-US-MichelleNeural`).
- `providers.microsoft.lang`: код мови (наприклад, `en-US`).
- `providers.microsoft.outputFormat`: формат виводу Microsoft (наприклад, `audio-24khz-48kbitrate-mono-mp3`).
  - Дійсні значення дивіться у форматах виводу Microsoft Speech; не всі формати підтримуються вбудованим транспортом на базі Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: рядки у відсотках (наприклад, `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: записує JSON-субтитри поруч з аудіофайлом.
- `providers.microsoft.proxy`: URL проксі для запитів мовлення Microsoft.
- `providers.microsoft.timeoutMs`: перевизначення таймауту запиту (мс).
- `edge.*`: застарілий псевдонім для тих самих налаштувань Microsoft. Виконайте
  `openclaw doctor --fix`, щоб переписати збережену конфігурацію на `providers.microsoft`.

## Перевизначення, керовані моделлю (увімкнено за замовчуванням)

За замовчуванням модель **може** видавати TTS-директиви для однієї відповіді.
Коли `messages.tts.auto` має значення `tagged`, ці директиви потрібні для запуску аудіо.

Коли це ввімкнено, модель може видавати директиви `[[tts:...]]` для перевизначення голосу
для однієї відповіді, а також необов’язковий блок `[[tts:text]]...[[/tts:text]]`, щоб
надати виразні теги (сміх, підказки для співу тощо), які мають з’являтися лише
в аудіо.

Директиви `provider=...` ігноруються, якщо не задано `modelOverrides.allowProvider: true`.

Приклад корисного навантаження відповіді:

```
Ось, будь ласка.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](сміється) Прочитай пісню ще раз.[[/tts:text]]
```

Доступні ключі директив (коли ввімкнено):

- `provider` (ідентифікатор зареєстрованого постачальника мовлення, наприклад `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `volcengine`, `vydra`, `xai` або `xiaomi`; потребує `allowProvider: true`)
- `voice` (голос OpenAI, Gradium, Volcengine або Xiaomi), `voiceName` / `voice_name` / `google_voice` (голос Google) або `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (модель OpenAI TTS, ідентифікатор моделі ElevenLabs, модель MiniMax або модель Xiaomi MiMo TTS) або `google_model` (модель Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0-10)
- `pitch` (цілий зсув висоти тону MiniMax, від -12 до 12; дробові значення відкидаються перед запитом до MiniMax)
- `emotion` (тег емоції Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Вимкнення всіх перевизначень моделі:

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

Необов’язковий список дозволених значень (увімкнути перемикання постачальника, зберігаючи можливість налаштовувати інші параметри):

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

Збережені поля:

- `enabled`
- `provider`
- `maxLength` (поріг для підсумку; типово 1500 символів)
- `summarize` (типово `true`)

Вони перевизначають ефективну конфігурацію з `messages.tts` разом з активним
блоком `agents.list[].tts` для цього хоста.

## Формати виводу (фіксовані)

- **Feishu / Matrix / Telegram / WhatsApp**: відповіді у форматі голосових нотаток надають перевагу Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48kHz / 64kbps — це хороший компроміс для голосових повідомлень.
- **Feishu**: коли відповідь-голосова нотатка створюється як MP3/WAV/M4A або в іншому
  імовірному форматі аудіофайлу, Plugin Feishu перекодовує її в 48kHz Ogg/Opus за допомогою
  `ffmpeg` перед надсиланням рідної бульбашки `audio`. Якщо перетворення не вдається, Feishu
  отримує оригінальний файл як вкладення.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44.1kHz / 128kbps — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32kHz) для звичайних аудіовкладень. Для цілей голосових нотаток, таких як Feishu і Telegram, OpenClaw перекодовує MP3 від MiniMax у 48kHz Opus за допомогою `ffmpeg` перед доставкою.
- **Xiaomi MiMo**: типово MP3 або WAV, якщо це налаштовано. Для цілей голосових нотаток, таких як Feishu і Telegram, OpenClaw перекодовує вивід Xiaomi у 48kHz Opus за допомогою `ffmpeg` перед доставкою.
- **Local CLI**: використовує налаштований `outputFormat`. Цілі голосових нотаток
  перетворюються в Ogg/Opus, а вихід для телефонії перетворюється в raw 16 kHz mono PCM
  за допомогою `ffmpeg`.
- **Google Gemini**: Gemini API TTS повертає raw 24kHz PCM. OpenClaw обгортає його у WAV для аудіовкладень, перекодовує в 48kHz Opus для цілей голосових нотаток і повертає PCM напряму для Talk/телефонії.
- **Gradium**: WAV для аудіовкладень, Opus для цілей голосових нотаток і `ulaw_8000` на 8 kHz для телефонії.
- **Inworld**: MP3 для звичайних аудіовкладень, рідний `OGG_OPUS` для цілей голосових нотаток і raw `PCM` на 22050 Hz для Talk/телефонії.
- **xAI**: типово MP3; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує пакетний REST TTS-endpoint xAI і повертає готове аудіовкладення; потоковий WebSocket TTS xAI цим шляхом постачальника не використовується. Рідний формат голосових нотаток Opus цим шляхом не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але не всі формати доступні в сервісі.
  - Значення формату виводу відповідають форматам виводу Microsoft Speech (включно з Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення у форматі Opus.
  - Якщо налаштований формат виводу Microsoft не спрацьовує, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка авто-TTS

Коли цю функцію ввімкнено, OpenClaw:

- пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- пропускає дуже короткі відповіді (< 10 символів).
- підсумовує довгі відповіді, якщо це ввімкнено, за допомогою `agents.defaults.model.primary` (або `summaryModel`).
- додає згенероване аудіо до відповіді.

Якщо відповідь перевищує `maxLength`, а підсумок вимкнено (або немає API-ключа для
моделі підсумку), аудіо
пропускається і надсилається звичайна текстова відповідь.

## Схема потоку

```
Відповідь -> TTS увімкнено?
  ні  -> надіслати текст
  так -> є медіа / MEDIA: / коротка?
          так -> надіслати текст
          ні  -> довжина > ліміт?
                   ні  -> TTS -> прикріпити аудіо
                   так -> підсумок увімкнено?
                            ні  -> надіслати текст
                            так -> підсумувати (summaryModel або agents.defaults.model.primary)
                                      -> TTS -> прикріпити аудіо
```

## Використання слеш-команд

Є одна команда: `/tts`.
Подробиці щодо ввімкнення див. у [Слеш-команди](/uk/tools/slash-commands).

Примітка для Discord: `/tts` — це вбудована команда Discord, тому OpenClaw реєструє
там `/voice` як рідну команду. Текстова команда `/tts ...` усе ще працює.

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
- Має бути ввімкнено `commands.text` або реєстрацію рідних команд.
- Конфігурація `messages.tts.auto` приймає `off|always|inbound|tagged`.
- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- Використовуйте конфігурацію, якщо вам потрібні типові значення `inbound` або `tagged`.
- `limit` і `summary` зберігаються в локальних налаштуваннях, а не в основній конфігурації.
- `/tts audio` генерує одноразову аудіовідповідь (не вмикає TTS).
- `/tts status` містить видимість резервного переходу для останньої спроби:
  - успішний резервний перехід: `Fallback: <primary> -> <used>` плюс `Attempts: ...`
  - помилка: `Error: ...` плюс `Attempts: ...`
  - детальна діагностика: `Attempt details: provider:outcome(reasonCode) latency`
- Збої API OpenAI і ElevenLabs тепер включають розібрані деталі помилки постачальника та ідентифікатор запиту (коли його повертає постачальник), і це відображається в помилках/логах TTS.

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення і повертає аудіовкладення для
доставки відповіді. Коли каналом є Feishu, Matrix, Telegram або WhatsApp,
аудіо доставляється як голосове повідомлення, а не як файлове вкладення.
Feishu може перекодовувати нерідний Opus TTS-вивід цим шляхом, якщо доступний `ffmpeg`.
WhatsApp надсилає видимий текст окремо від аудіо PTT-голосової нотатки, оскільки клієнти
не завжди стабільно відображають підписи до голосових нотаток.
Він приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` — це
таймаут запиту постачальника для окремого виклику в мілісекундах.

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
