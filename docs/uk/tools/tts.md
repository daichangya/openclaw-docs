---
read_when:
    - Увімкнення перетворення тексту на мовлення для відповідей
    - Налаштування провайдерів TTS або обмежень
    - Використання команд `/tts`
summary: Перетворення тексту на мовлення (TTS) для вихідних відповідей
title: Перетворення тексту на мовлення
x-i18n:
    generated_at: "2026-04-26T02:32:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 710036289a2dc35d70c8c51aecd696e5c90a56903a588c3aaf8e88f40c2851d1
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо за допомогою Azure Speech, ElevenLabs, Google Gemini, Gradium, Inworld, Local CLI, Microsoft, MiniMax, OpenAI, Volcengine, Vydra, xAI або Xiaomi MiMo.
Це працює всюди, де OpenClaw може надсилати аудіо.

## Підтримувані сервіси

- **Azure Speech** (основний або резервний провайдер; використовує Azure AI Speech REST API)
- **ElevenLabs** (основний або резервний провайдер)
- **Google Gemini** (основний або резервний провайдер; використовує Gemini API TTS)
- **Gradium** (основний або резервний провайдер; підтримує вихід для голосових нотаток і телефонії)
- **Inworld** (основний або резервний провайдер; використовує потоковий TTS API Inworld)
- **Local CLI** (основний або резервний провайдер; запускає налаштовану локальну команду TTS)
- **Microsoft** (основний або резервний провайдер; поточна вбудована реалізація використовує `node-edge-tts`)
- **MiniMax** (основний або резервний провайдер; використовує T2A v2 API)
- **OpenAI** (основний або резервний провайдер; також використовується для підсумків)
- **Volcengine** (основний або резервний провайдер; використовує BytePlus Seed Speech HTTP API)
- **Vydra** (основний або резервний провайдер; спільний провайдер зображень, відео та мовлення)
- **xAI** (основний або резервний провайдер; використовує xAI TTS API)
- **Xiaomi MiMo** (основний або резервний провайдер; використовує MiMo TTS через chat completions Xiaomi)

### Примітки щодо мовлення Microsoft

Поточний вбудований провайдер мовлення Microsoft використовує онлайновий
нейронний сервіс TTS Microsoft Edge через бібліотеку `node-edge-tts`. Це
хостований сервіс (не локальний), він використовує кінцеві точки Microsoft і
не потребує API-ключа. `node-edge-tts` надає параметри конфігурації мовлення та
формати виводу, але сервіс підтримує не всі параметри. Застаріла конфігурація
та вхідні директиви з `edge` усе ще працюють і нормалізуються до `microsoft`.

Оскільки цей шлях є публічним вебсервісом без опублікованого SLA або квоти,
вважайте його варіантом best-effort. Якщо вам потрібні гарантовані ліміти та
підтримка, використовуйте OpenAI або ElevenLabs.

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
  застаріла автентифікація AppID/токеном також приймає `VOLCENGINE_TTS_APPID` і
  `VOLCENGINE_TTS_TOKEN`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI і мовлення Microsoft **не** потребують API-ключа.

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний провайдер, а інші слугують резервними варіантами.
Автоматичний підсумок використовує налаштований `summaryModel` (або `agents.defaults.model.primary`),
тому цей провайдер також має бути автентифікований, якщо ви вмикаєте підсумки.

## Посилання на сервіси

- [Посібник OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідник OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Провайдер Azure Speech](/uk/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/uk/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/uk/providers/volcengine#text-to-speech)
- [Синтез мовлення Xiaomi MiMo](/uk/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виводу Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Чи ввімкнено це за замовчуванням?

Ні. Auto‑TTS **вимкнено** за замовчуванням. Увімкніть його в конфігурації за допомогою
`messages.tts.auto` або локально за допомогою `/tts on`.

Якщо `messages.tts.provider` не задано, OpenClaw вибирає перший налаштований
провайдер мовлення в порядку автовибору реєстру.

## Конфігурація

Конфігурація TTS розміщена в `messages.tts` у `openclaw.json`.
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

### Перевизначення голосу для окремих агентів

Використовуйте `agents.list[].tts`, якщо один агент має говорити з іншим провайдером,
голосом, моделлю, стилем або режимом auto-TTS. Блок агента виконує глибоке злиття поверх
`messages.tts`, тому облікові дані провайдера можуть залишатися в глобальній конфігурації провайдера.

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

Пріоритет для автоматичних відповідей, `/tts audio`, `/tts status` і інструмента агента `tts` такий:

1. `messages.tts`
2. активний `agents.list[].tts`
3. локальні параметри `/tts` для цього хоста
4. вбудовані директиви `[[tts:...]]`, коли ввімкнено перевизначення моделі

### OpenAI як основний і ElevenLabs як резервний

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
приймається як псевдонім провайдера.

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

Порядок визначення автентифікації MiniMax TTS: `messages.tts.providers.minimax.apiKey`, далі
збережені OAuth/token профілі `minimax-portal`, потім ключі середовища Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), а потім `MINIMAX_API_KEY`. Якщо явний TTS
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

Google Gemini TTS використовує шлях API-ключа Gemini. Тут дійсний API-ключ Google Cloud Console,
обмежений Gemini API, і це той самий тип ключа, що використовується
вбудованим провайдером генерації зображень Google. Порядок визначення:
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
дослівно з панелі керування Inworld (Workspace > API Keys). Провайдер
надсилає його як `Authorization: Basic <apiKey>` без жодного додаткового
кодування, тому не передавайте сирий bearer-токен і не кодуйте його в Base64
самостійно. Ключ використовує `INWORLD_API_KEY` як резервну змінну середовища. Докладніше див.
у [Провайдер Inworld](/uk/providers/inworld) для повного налаштування.

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

Volcengine TTS використовує API-ключ BytePlus Seed Speech із Speech Console,
а не OpenAI-сумісний `VOLCANO_ENGINE_API_KEY`, що використовується для провайдерів
моделей Doubao. Порядок визначення: `messages.tts.providers.volcengine.apiKey` ->
`VOLCENGINE_TTS_API_KEY` -> `BYTEPLUS_SEED_SPEECH_API_KEY`. Застаріла автентифікація AppID/токеном
усе ще працює через `messages.tts.providers.volcengine.appId` / `token` або
`VOLCENGINE_TTS_APPID` / `VOLCENGINE_TTS_TOKEN`. Цілі голосових нотаток запитують
власний для провайдера формат `ogg_opus`; звичайні цілі аудіофайлів запитують `mp3`.

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
Поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal` і `una`; `eve` —
типовий. `language` приймає тег BCP-47 або `auto`.

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

Xiaomi MiMo TTS використовує той самий шлях `XIAOMI_API_KEY`, що й вбудований провайдер
моделей Xiaomi. Ідентифікатор провайдера мовлення — `xiaomi`; `mimo` приймається як псевдонім.
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
провайдер моделей OpenRouter. Порядок визначення:
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
`{{OutputPath}}`, `{{OutputDir}}` і `{{OutputBase}}` розгортаються в `args`; якщо заповнювач
`{{Text}}` відсутній, OpenClaw записує озвучуваний текст до stdin. `outputFormat`
приймає `mp3`, `opus` або `wav`. Цілі голосових нотаток перекодовуються в Ogg/Opus, а вихід
для телефонії перекодовується в сирий моно PCM 16 кГц за допомогою `ffmpeg`. Застарілий псевдонім провайдера
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

- `auto`: режим auto-TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` надсилає аудіо лише після вхідного голосового повідомлення.
  - `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:key=value]]` або блок `[[tts:text]]...[[/tts:text]]`.
- `enabled`: застарілий перемикач (doctor переносить це до `auto`).
- `mode`: `"final"` (типово) або `"all"` (включає відповіді інструментів/блоків).
- `provider`: ідентифікатор провайдера мовлення, наприклад `"elevenlabs"`, `"google"`, `"gradium"`, `"inworld"`, `"microsoft"`, `"minimax"`, `"openai"`, `"volcengine"`, `"vydra"`, `"xai"` або `"xiaomi"` (резервне перемикання відбувається автоматично).
- Якщо `provider` **не задано**, OpenClaw використовує перший налаштований провайдер мовлення в порядку автовибору реєстру.
- Застаріла конфігурація `provider: "edge"` виправляється командою `openclaw doctor --fix` і
  переписується на `provider: "microsoft"`.
- `summaryModel`: необов’язкова недорога модель для автоматичного підсумку; типово використовується `agents.defaults.model.primary`.
  - Приймає `provider/model` або налаштований псевдонім моделі.
- `modelOverrides`: дозволяє моделі видавати директиви TTS (увімкнено за замовчуванням).
  - `allowProvider` типово має значення `false` (перемикання провайдера вмикається явно).
- `providers.<id>`: параметри, що належать провайдеру, із ключем за ідентифікатором провайдера мовлення.
- Застарілі прямі блоки провайдерів (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) виправляються командою `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `messages.tts.providers.<id>`.
- Застарілий `messages.tts.providers.edge` також виправляється командою `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `messages.tts.providers.microsoft`.
- `maxTextLength`: жорстке обмеження для вхідного тексту TTS (символи). Якщо його перевищено, `/tts audio` завершується помилкою.
- `timeoutMs`: тайм-аут запиту (мс).
- `prefsPath`: перевизначає локальний шлях до JSON-файлу prefs (провайдер/ліміт/підсумок).
- Значення `apiKey` беруть змінні середовища як резервні (`AZURE_SPEECH_KEY`/`AZURE_SPEECH_API_KEY`/`SPEECH_KEY`, `ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `INWORLD_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`). Volcengine натомість використовує `appId`/`token`.
- `providers.azure-speech.apiKey`: ключ ресурсу Azure Speech (змінні середовища:
  `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`).
- `providers.azure-speech.region`: регіон Azure Speech, наприклад `eastus` (змінні середовища:
  `AZURE_SPEECH_REGION` або `SPEECH_REGION`).
- `providers.azure-speech.endpoint` / `providers.azure-speech.baseUrl`: необов’язкове
  перевизначення endpoint/base URL Azure Speech.
- `providers.azure-speech.voice`: ShortName голосу Azure (типово
  `en-US-JennyNeural`).
- `providers.azure-speech.lang`: мовний код SSML (типово `en-US`).
- `providers.azure-speech.outputFormat`: Azure `X-Microsoft-OutputFormat` для
  стандартного виводу аудіо (типово `audio-24khz-48kbitrate-mono-mp3`).
- `providers.azure-speech.voiceNoteOutputFormat`: Azure
  `X-Microsoft-OutputFormat` для виводу голосових нотаток (типово
  `ogg-24khz-16bit-mono-opus`).
- `providers.elevenlabs.baseUrl`: перевизначає базову URL-адресу API ElevenLabs.
- `providers.openai.baseUrl`: перевизначає endpoint OpenAI TTS.
  - Порядок визначення: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Нетипові значення розглядаються як OpenAI-сумісні TTS endpoint, тому приймаються власні назви моделей і голосів.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = звичайна швидкість)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-літерний ISO 639-1 (наприклад, `en`, `de`)
- `providers.elevenlabs.seed`: ціле число `0..4294967295` (best-effort детермінізм)
- `providers.minimax.baseUrl`: перевизначає базову URL-адресу API MiniMax (типово `https://api.minimax.io`, змінна середовища: `MINIMAX_API_HOST`).
- `providers.minimax.model`: модель TTS (типово `speech-2.8-hd`, змінна середовища: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ідентифікатор голосу (типово `English_expressive_narrator`, змінна середовища: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: швидкість відтворення `0.5..2.0` (типово 1.0).
- `providers.minimax.vol`: гучність `(0, 10]` (типово 1.0; має бути більшою за 0).
- `providers.minimax.pitch`: ціле зміщення висоти тону `-12..12` (типово 0). Дробові значення усікаються перед викликом MiniMax T2A, оскільки API відхиляє нецілі значення висоти тону.
- `providers.tts-local-cli.command`: локальний виконуваний файл або рядок команди для CLI TTS.
- `providers.tts-local-cli.args`: аргументи команди; підтримує заповнювачі `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` і `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: очікуваний формат виводу CLI (`mp3`, `opus` або `wav`; типово `mp3` для аудіовкладень).
- `providers.tts-local-cli.timeoutMs`: тайм-аут команди в мілісекундах (типово `120000`).
- `providers.tts-local-cli.cwd`: необов’язковий робочий каталог команди.
- `providers.tts-local-cli.env`: необов’язкові перевизначення змінних середовища типу string для команди.
- `providers.inworld.baseUrl`: перевизначає базову URL-адресу API Inworld (типово `https://api.inworld.ai`).
- `providers.inworld.voiceId`: ідентифікатор голосу Inworld (типово `Sarah`).
- `providers.inworld.modelId`: модель TTS Inworld (типово `inworld-tts-1.5-max`; також підтримуються `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`).
- `providers.inworld.temperature`: температура семплювання `0..2` (необов’язково).
- `providers.google.model`: модель Gemini TTS (типово `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: назва вбудованого голосу Gemini (типово `Kore`; також приймається `voice`).
- `providers.google.audioProfile`: підказка природною мовою щодо стилю, яка додається перед озвучуваним текстом.
- `providers.google.speakerName`: необов’язкова мітка мовця, яка додається перед озвучуваним текстом, якщо ваш TTS prompt використовує іменованого мовця.
- `providers.google.baseUrl`: перевизначає базову URL-адресу Gemini API. Приймається лише `https://generativelanguage.googleapis.com`.
  - Якщо `messages.tts.providers.google.apiKey` пропущено, TTS може повторно використати `models.providers.google.apiKey` перед переходом до резервних змінних середовища.
- `providers.gradium.baseUrl`: перевизначає базову URL-адресу API Gradium (типово `https://api.gradium.ai`).
- `providers.gradium.voiceId`: ідентифікатор голосу Gradium (типово Emma, `YTpq7expH9539ERJ`).
- `providers.volcengine.apiKey`: API-ключ BytePlus Seed Speech (змінні середовища:
  `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY`).
- `providers.volcengine.resourceId`: ідентифікатор ресурсу BytePlus Seed Speech (типово
  `seed-tts-1.0`, змінна середовища: `VOLCENGINE_TTS_RESOURCE_ID`; використовуйте `seed-tts-2.0`, коли
  ваш проєкт BytePlus має entitlement для TTS 2.0).
- `providers.volcengine.appKey`: заголовок app key BytePlus Seed Speech (типово
  `aGjiRDfUWi`, змінна середовища: `VOLCENGINE_TTS_APP_KEY`).
- `providers.volcengine.baseUrl`: перевизначає HTTP endpoint Seed Speech TTS
  (змінна середовища: `VOLCENGINE_TTS_BASE_URL`).
- `providers.volcengine.appId`: застарілий ідентифікатор застосунку Volcengine Speech Console (змінна середовища: `VOLCENGINE_TTS_APPID`).
- `providers.volcengine.token`: застарілий токен доступу Volcengine Speech Console (змінна середовища: `VOLCENGINE_TTS_TOKEN`).
- `providers.volcengine.cluster`: застарілий кластер Volcengine TTS (типово `volcano_tts`, змінна середовища: `VOLCENGINE_TTS_CLUSTER`).
- `providers.volcengine.voice`: тип голосу (типово `en_female_anna_mars_bigtts`, змінна середовища: `VOLCENGINE_TTS_VOICE`).
- `providers.volcengine.speedRatio`: власне для провайдера співвідношення швидкості.
- `providers.volcengine.emotion`: власний для провайдера тег емоції.
- `providers.xai.apiKey`: API-ключ xAI TTS (змінна середовища: `XAI_API_KEY`).
- `providers.xai.baseUrl`: перевизначає базову URL-адресу xAI TTS (типово `https://api.x.ai/v1`, змінна середовища: `XAI_BASE_URL`).
- `providers.xai.voiceId`: ідентифікатор голосу xAI (типово `eve`; поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: мовний код BCP-47 або `auto` (типово `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` або `alaw` (типово `mp3`).
- `providers.xai.speed`: перевизначення швидкості на рівні провайдера.
- `providers.xiaomi.apiKey`: API-ключ Xiaomi MiMo (змінна середовища: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: перевизначає базову URL-адресу Xiaomi MiMo API (типово `https://api.xiaomimimo.com/v1`, змінна середовища: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: модель TTS (типово `mimo-v2.5-tts`, змінна середовища: `XIAOMI_TTS_MODEL`; також підтримується `mimo-v2-tts`).
- `providers.xiaomi.voice`: ідентифікатор голосу MiMo (типово `mimo_default`, змінна середовища: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` або `wav` (типово `mp3`, змінна середовища: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: необов’язкова інструкція стилю природною мовою, що надсилається як повідомлення користувача; вона не озвучується.
- `providers.openrouter.apiKey`: API-ключ OpenRouter (змінна середовища: `OPENROUTER_API_KEY`; може повторно використовувати `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: перевизначає базову URL-адресу OpenRouter TTS (типово `https://openrouter.ai/api/v1`; застарілий `https://openrouter.ai/v1` нормалізується).
- `providers.openrouter.model`: ідентифікатор моделі OpenRouter TTS (типово `hexgrad/kokoro-82m`; також приймається `modelId`).
- `providers.openrouter.voice`: ідентифікатор голосу, специфічний для провайдера (типово `af_alloy`; також приймається `voiceId`).
- `providers.openrouter.responseFormat`: `mp3` або `pcm` (типово `mp3`).
- `providers.openrouter.speed`: перевизначення швидкості на рівні провайдера.
- `providers.microsoft.enabled`: дозволяє використання мовлення Microsoft (типово `true`; без API-ключа).
- `providers.microsoft.voice`: назва нейронного голосу Microsoft (наприклад, `en-US-MichelleNeural`).
- `providers.microsoft.lang`: мовний код (наприклад, `en-US`).
- `providers.microsoft.outputFormat`: формат виводу Microsoft (наприклад, `audio-24khz-48kbitrate-mono-mp3`).
  - Дивіться формати виводу Microsoft Speech для допустимих значень; не всі формати підтримуються вбудованим транспортом на базі Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: рядки відсотків (наприклад, `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: записує субтитри JSON поруч з аудіофайлом.
- `providers.microsoft.proxy`: URL-адреса проксі для запитів мовлення Microsoft.
- `providers.microsoft.timeoutMs`: перевизначення тайм-ауту запиту (мс).
- `edge.*`: застарілий псевдонім для тих самих параметрів Microsoft. Запустіть
  `openclaw doctor --fix`, щоб переписати збережену конфігурацію на `providers.microsoft`.

## Перевизначення, керовані моделлю (увімкнено за замовчуванням)

За замовчуванням модель **може** видавати директиви TTS для однієї відповіді.
Коли `messages.tts.auto` має значення `tagged`, ці директиви потрібні для запуску аудіо.

Коли це ввімкнено, модель може видавати директиви `[[tts:...]]`, щоб перевизначити голос
для однієї відповіді, а також необов’язковий блок `[[tts:text]]...[[/tts:text]]` для
надання виразних тегів (сміх, підказки для співу тощо), які мають з’являтися лише
в аудіо.

Директиви `provider=...` ігноруються, якщо не встановлено `modelOverrides.allowProvider: true`.

Приклад payload відповіді:

```
Ось.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](сміється) Прочитай пісню ще раз.[[/tts:text]]
```

Доступні ключі директив (коли ввімкнено):

- `provider` (ідентифікатор зареєстрованого провайдера мовлення, наприклад `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `volcengine`, `vydra`, `xai` або `xiaomi`; потребує `allowProvider: true`)
- `voice` (голос OpenAI, Gradium, Volcengine або Xiaomi), `voiceName` / `voice_name` / `google_voice` (голос Google) або `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (модель OpenAI TTS, ідентифікатор моделі ElevenLabs, модель MiniMax або модель Xiaomi MiMo TTS) або `google_model` (модель Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0-10)
- `pitch` (ціла висота тону MiniMax, від -12 до 12; дробові значення усікаються перед запитом до MiniMax)
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

Необов’язковий список дозволених значень (увімкнення перемикання провайдера із збереженням можливості налаштовувати інші параметри):

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

Slash-команди записують локальні перевизначення в `prefsPath` (типово:
`~/.openclaw/settings/tts.json`, можна перевизначити через `OPENCLAW_TTS_PREFS` або
`messages.tts.prefsPath`).

Збережені поля:

- `enabled`
- `provider`
- `maxLength` (поріг для підсумку; типово 1500 символів)
- `summarize` (типово `true`)

Вони перевизначають ефективну конфігурацію з `messages.tts` разом з активним
блоком `agents.list[].tts` для цього хоста.

## Формати виводу (фіксовані)

- **Feishu / Matrix / Telegram / WhatsApp**: відповіді голосовими нотатками віддають перевагу Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48 кГц / 64 кбіт/с — хороший компроміс для голосових повідомлень.
- **Feishu / WhatsApp**: коли відповідь голосовою нотаткою створюється як MP3/WebM/WAV/M4A
  або інший імовірний аудіофайл, channel Plugin перекодовує її в 48 кГц
  Ogg/Opus за допомогою `ffmpeg` перед надсиланням власного голосового повідомлення. WhatsApp надсилає
  результат через payload `audio` Baileys з `ptt: true` і
  `audio/ogg; codecs=opus`. Якщо перетворення не вдається, Feishu отримує вихідний
  файл як вкладення; надсилання в WhatsApp завершується помилкою замість публікації несумісного
  payload PTT.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44,1 кГц / 128 кбіт/с — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32 кГц) для звичайних аудіовкладень. Для цілей голосових нотаток, таких як Feishu, Telegram і WhatsApp, OpenClaw перекодовує MP3 від MiniMax у 48 кГц Opus за допомогою `ffmpeg` перед доставкою.
- **Xiaomi MiMo**: типово MP3 або WAV, якщо це налаштовано. Для цілей голосових нотаток, таких як Feishu, Telegram і WhatsApp, OpenClaw перекодовує вихід Xiaomi у 48 кГц Opus за допомогою `ffmpeg` перед доставкою.
- **Local CLI**: використовує налаштований `outputFormat`. Цілі голосових нотаток
  перетворюються в Ogg/Opus, а вихід для телефонії перетворюється в сирий моно PCM 16 кГц
  за допомогою `ffmpeg`.
- **Google Gemini**: Gemini API TTS повертає сирий PCM 24 кГц. OpenClaw обгортає його у WAV для аудіовкладень, перекодовує його у 48 кГц Opus для цілей голосових нотаток і повертає PCM напряму для Talk/телефонії.
- **Gradium**: WAV для аудіовкладень, Opus для цілей голосових нотаток і `ulaw_8000` на 8 кГц для телефонії.
- **Inworld**: MP3 для звичайних аудіовкладень, власний `OGG_OPUS` для цілей голосових нотаток і сирий `PCM` на 22050 Гц для Talk/телефонії.
- **xAI**: типово MP3; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує пакетний REST endpoint TTS від xAI і повертає готове аудіовкладення; потоковий TTS WebSocket від xAI у цьому шляху провайдера не використовується. Власний формат голосових нотаток Opus у цьому шляху не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але не всі формати доступні в сервісі.
  - Значення форматів виводу відповідають форматам виводу Microsoft Speech (включно з Ogg/WebM Opus).
  - `sendVoice` у Telegram приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виводу Microsoft не спрацьовує, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка auto-TTS

Коли функцію ввімкнено, OpenClaw:

- пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- пропускає дуже короткі відповіді (< 10 символів).
- робить підсумок довгих відповідей, якщо це ввімкнено, за допомогою `agents.defaults.model.primary` (або `summaryModel`).
- додає згенероване аудіо до відповіді.

Якщо відповідь перевищує `maxLength`, а підсумок вимкнено (або немає API-ключа для
моделі підсумку), аудіо
пропускається і надсилається звичайна текстова відповідь.

## Схема потоку

```
Відповідь -> TTS увімкнено?
  ні   -> надіслати текст
  так  -> є медіа / MEDIA: / коротка?
           так  -> надіслати текст
           ні   -> довжина > ліміт?
                    ні   -> TTS -> додати аудіо
                    так  -> підсумок увімкнено?
                             ні   -> надіслати текст
                             так  -> створити підсумок (summaryModel або agents.defaults.model.primary)
                                       -> TTS -> додати аудіо
```

## Використання slash-команди

Є одна команда: `/tts`.
Докладно про ввімкнення див. у [Slash-команди](/uk/tools/slash-commands).

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

- Команди вимагають авторизованого відправника (правила allowlist/owner усе ще застосовуються).
- Має бути ввімкнено `commands.text` або реєстрацію нативних команд.
- Конфігурація `messages.tts.auto` приймає `off|always|inbound|tagged`.
- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- Використовуйте конфігурацію, якщо вам потрібні типові значення `inbound` або `tagged`.
- `limit` і `summary` зберігаються в локальних prefs, а не в основній конфігурації.
- `/tts audio` генерує одноразову аудіовідповідь (не вмикає TTS).
- `/tts status` містить видимість резервного перемикання для останньої спроби:
  - успішне резервне перемикання: `Fallback: <primary> -> <used>` плюс `Attempts: ...`
  - помилка: `Error: ...` плюс `Attempts: ...`
  - докладна діагностика: `Attempt details: provider:outcome(reasonCode) latency`
- Помилки API OpenAI і ElevenLabs тепер включають розібрані деталі помилки провайдера та ідентифікатор запиту (коли його повертає провайдер), які відображаються в помилках/журналах TTS.

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення і повертає аудіовкладення для
доставки у відповіді. Коли канал — Feishu, Matrix, Telegram або WhatsApp,
аудіо доставляється як голосове повідомлення, а не як файл-вкладення.
Feishu і WhatsApp можуть перекодовувати вихід TTS не у форматі Opus на цьому шляху, коли
доступний `ffmpeg`.
WhatsApp надсилає аудіо через Baileys як голосову нотатку PTT (`audio` з
`ptt: true`), а видимий текст надсилає окремо від аудіо PTT, оскільки клієнти
не завжди коректно відображають підписи до голосових нотаток.
Він приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` —
це тайм-аут запиту до провайдера в мілісекундах для кожного виклику.

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
