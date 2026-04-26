---
read_when:
    - Увімкнення синтезу мовлення для відповідей
    - Налаштування провайдерів TTS або обмежень
    - Використання команд `/tts`
summary: Синтез мовлення (TTS) для вихідних відповідей
title: Синтез мовлення
x-i18n:
    generated_at: "2026-04-26T04:25:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ce80ec3a07cd87d719a5aae892717da24b55c4ce58c68f302ec5941499613bb
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо за допомогою Azure Speech, ElevenLabs, Google Gemini, Gradium, Inworld, Local CLI, Microsoft, MiniMax, OpenAI, Volcengine, Vydra, xAI або Xiaomi MiMo.
Це працює всюди, де OpenClaw може надсилати аудіо.

## Підтримувані сервіси

- **Azure Speech** (основний або резервний провайдер; використовує Azure AI Speech REST API)
- **ElevenLabs** (основний або резервний провайдер)
- **Google Gemini** (основний або резервний провайдер; використовує Gemini API TTS)
- **Gradium** (основний або резервний провайдер; підтримує вихід voice-note і telephony)
- **Inworld** (основний або резервний провайдер; використовує потоковий Inworld TTS API)
- **Local CLI** (основний або резервний провайдер; запускає налаштовану локальну TTS-команду)
- **Microsoft** (основний або резервний провайдер; поточна вбудована реалізація використовує `node-edge-tts`)
- **MiniMax** (основний або резервний провайдер; використовує T2A v2 API)
- **OpenAI** (основний або резервний провайдер; також використовується для зведень)
- **Volcengine** (основний або резервний провайдер; використовує BytePlus Seed Speech HTTP API)
- **Vydra** (основний або резервний провайдер; спільний провайдер зображень, відео та мовлення)
- **xAI** (основний або резервний провайдер; використовує xAI TTS API)
- **Xiaomi MiMo** (основний або резервний провайдер; використовує MiMo TTS через chat completions Xiaomi)

### Примітки щодо мовлення Microsoft

Поточний вбудований провайдер мовлення Microsoft використовує онлайн-службу
нейронного TTS Microsoft Edge через бібліотеку `node-edge-tts`. Це розміщений
сервіс (не локальний), він використовує кінцеві точки Microsoft і не потребує
API-ключа. `node-edge-tts` надає параметри конфігурації мовлення та формати
виводу, але не всі параметри підтримуються сервісом. Застарілі конфігурації та
вхідні директиви з `edge` усе ще працюють і нормалізуються до `microsoft`.

Оскільки цей шлях використовує публічний вебсервіс без опублікованого SLA чи
квот, розглядайте його як best-effort. Якщо вам потрібні гарантовані ліміти та
підтримка, використовуйте OpenAI або ElevenLabs.

## Необов’язкові ключі

Якщо вам потрібні Azure Speech, ElevenLabs, Google Gemini, Gradium, Inworld, MiniMax, OpenAI, Volcengine, Vydra, xAI або Xiaomi MiMo:

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
  застаріла автентифікація AppID/token також приймає `VOLCENGINE_TTS_APPID` і
  `VOLCENGINE_TTS_TOKEN`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI і Microsoft speech **не** потребують API-ключа.

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний провайдер, а решта стають резервними варіантами.
Автоматичне зведення використовує налаштований `summaryModel` (або `agents.defaults.model.primary`),
тому цей провайдер також має бути автентифікований, якщо ви вмикаєте зведення.

## Посилання на сервіси

- [Посібник OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідка OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
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

Ні. Auto‑TTS **вимкнено** за замовчуванням. Увімкніть його в конфігурації через
`messages.tts.auto` або локально через `/tts on`.

Коли `messages.tts.provider` не задано, OpenClaw вибирає перший налаштований
провайдер мовлення в порядку автоматичного вибору реєстру.

## Конфігурація

Конфігурація TTS розташована в `messages.tts` у `openclaw.json`.
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

Використовуйте `agents.list[].tts`, коли один агент має говорити з іншим провайдером,
голосом, моделлю, стилем або режимом auto-TTS. Блок агента виконує deep-merge поверх
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

Пріоритет для автоматичних відповідей, `/tts audio`, `/tts status` і агентського інструмента `tts` такий:

1. `messages.tts`
2. активний `agents.list[].tts`
3. локальні параметри `/tts` для цього хоста
4. вбудовані директиви `[[tts:...]]`, коли ввімкнено перевизначення моделей

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

Порядок автентифікації MiniMax TTS: `messages.tts.providers.minimax.apiKey`, потім
збережені профілі OAuth/token `minimax-portal`, потім ключі середовища Token Plan
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

Google Gemini TTS використовує шлях API-ключа Gemini. Тут підходить API-ключ
Google Cloud Console, обмежений Gemini API, і це той самий тип ключа, що використовується
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
дослівно з панелі Inworld (Workspace > API Keys). Провайдер
надсилає його як `Authorization: Basic <apiKey>` без додаткового
кодування, тому не передавайте сирий bearer token і не кодуйте його в Base64
самостійно. Ключ резервно береться зі змінної середовища `INWORLD_API_KEY`. Див.
[Провайдер Inworld](/uk/providers/inworld) для повного налаштування.

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
а не сумісний з OpenAI `VOLCANO_ENGINE_API_KEY`, який використовується для
провайдерів моделей Doubao. Порядок визначення: `messages.tts.providers.volcengine.apiKey` ->
`VOLCENGINE_TTS_API_KEY` -> `BYTEPLUS_SEED_SPEECH_API_KEY`. Застаріла автентифікація AppID/token
усе ще працює через `messages.tts.providers.volcengine.appId` / `token` або
`VOLCENGINE_TTS_APPID` / `VOLCENGINE_TTS_TOKEN`. Цілі voice-note
запитують нативний для провайдера `ogg_opus`; звичайні цілі аудіофайлів запитують `mp3`.

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

xAI TTS використовує той самий шлях `XAI_API_KEY`, що й вбудований провайдер моделей Grok.
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
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS використовує той самий шлях `XIAOMI_API_KEY`, що й вбудований провайдер моделей Xiaomi.
Ідентифікатор провайдера мовлення — `xiaomi`; `mimo` приймається як псевдонім.
Цільовий текст надсилається як повідомлення помічника, що відповідає контракту
TTS Xiaomi. Необов’язковий `style` надсилається як інструкція користувача й не озвучується.

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
`{{OutputPath}}`, `{{OutputDir}}` і `{{OutputBase}}`
розгортаються в `args`; якщо заповнювач `{{Text}}` відсутній, OpenClaw записує
текст для озвучення в stdin. `outputFormat` приймає `mp3`, `opus` або `wav`.
Цілі voice-note транскодуються в Ogg/Opus, а вихід для telephony
транскодується в сирий 16 кГц моно PCM через `ffmpeg`. Застарілий псевдонім провайдера
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

### TTS-персони

Використовуйте `messages.tts.personas`, якщо вам потрібна стабільна мовленнєва ідентичність, яку можна
детерміновано застосовувати між провайдерами. Персона може віддавати перевагу одному провайдеру,
визначати нейтральний до провайдера намір підказки й містити прив’язки, специфічні для провайдера, для
голосів, моделей, шаблонів підказок, seed і налаштувань голосу.

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: {
              model: "gpt-4o-mini-tts",
              voice: "cedar",
            },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

Визначення є детермінованим:

1. локальне налаштування `/tts persona <id>`, якщо задано.
2. `messages.tts.persona`, якщо задано.
3. Без персони.

Вибір провайдера працює за принципом явного пріоритету:

1. Прямі перевизначення провайдера з CLI, Gateway, Talk або дозволених директив TTS.
2. Локальне налаштування `/tts provider <id>`.
3. `provider` активної персони.
4. `messages.tts.provider`.
5. Автовибір реєстру.

Для кожної спроби провайдера OpenClaw об’єднує:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. довірені перевизначення запиту
4. дозволені перевизначення директив TTS, згенеровані моделлю

`fallbackPolicy` визначає, що відбувається, коли активна персона не має прив’язки для
провайдера, що пробується:

- `preserve-persona` зберігає доступність нейтральних до провайдера полів підказки персони для
  провайдерів. Це значення за замовчуванням.
- `provider-defaults` не включає персону до підготовки підказки провайдера для
  цієї спроби, тому провайдер використовує свої нейтральні значення за замовчуванням, але резервний перехід усе ще можливий.
- `fail` пропускає цю спробу провайдера з `reasonCode: "not_configured"` і
  `personaBinding: "missing"`. Резервні провайдери все одно пробуються; увесь запит TTS
  завершується помилкою, лише якщо кожну спробу провайдера пропущено або вона завершилася невдачею.

Поля підказки персони нейтральні до провайдера. Провайдери самі вирішують, як їх використовувати.
Google обгортає їх лише тоді, коли ефективна конфігурація провайдера Google задає
`promptTemplate: "audio-profile-v1"` або `personaPrompt`; його старіші поля
`audioProfile` і `speakerName` усе ще додаються попереду як текст підказки, специфічний для Google.
OpenAI відображає поля підказки в `instructions`, якщо не налаштовано явне значення
`instructions` для OpenAI. Провайдери без елементів керування на кшталт підказок
використовують лише прив’язки персони, специфічні для провайдера.

Вбудовані аудіотеги Gemini є вмістом транскрипту, а не конфігурацією персони. Якщо
помічник або явний блок `[[tts:text]]` містить теги на кшталт `[whispers]`
або `[laughs]`, OpenClaw зберігає їх усередині транскрипту Gemini. OpenClaw
не генерує налаштовані початкові теги.

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

### Вимкнути auto-summary для довгих відповідей

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
- `enabled`: застарілий перемикач (doctor переносить його в `auto`).
- `mode`: `"final"` (типово) або `"all"` (включає відповіді tool/block).
- `provider`: ідентифікатор провайдера мовлення, наприклад `"elevenlabs"`, `"google"`, `"gradium"`, `"inworld"`, `"microsoft"`, `"minimax"`, `"openai"`, `"volcengine"`, `"vydra"`, `"xai"` або `"xiaomi"` (резервний перехід відбувається автоматично).
- Якщо `provider` **не задано**, OpenClaw використовує перший налаштований провайдер мовлення в порядку автовибору реєстру.
- Застарілу конфігурацію `provider: "edge"` виправляє `openclaw doctor --fix` і
  переписує в `provider: "microsoft"`.
- `persona`: ідентифікатор типової TTS-персони з `personas`.
- `personas.<id>`: стабільна мовленнєва ідентичність. Ідентифікатор нормалізується до нижнього регістру.
- `personas.<id>.provider`: бажаний провайдер мовлення для персони. Явні перевизначення провайдера та локальні налаштування провайдера все одно мають вищий пріоритет.
- `personas.<id>.fallbackPolicy`: `preserve-persona` (типово), `provider-defaults` або `fail`; див. [TTS-персони](#tts-personas).
- `personas.<id>.prompt`: нейтральні до провайдера поля підказки персони (`profile`, `scene`, `sampleContext`, `style`, `accent`, `pacing`, `constraints`).
- `personas.<id>.providers.<provider>`: специфічна для провайдера прив’язка персони, що об’єднується поверх `providers.<provider>`.
- `summaryModel`: необов’язкова недорога модель для auto-summary; типово — `agents.defaults.model.primary`.
  - Приймає `provider/model` або псевдонім налаштованої моделі.
- `modelOverrides`: дозволяє моделі генерувати TTS-директиви (увімкнено за замовчуванням).
  - `allowProvider` типово має значення `false` (перемикання провайдера вмикається окремо).
- `providers.<id>`: налаштування, що належать провайдеру, згруповані за ідентифікатором провайдера мовлення.
- Застарілі прямі блоки провайдерів (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) виправляє `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `messages.tts.providers.<id>`.
- Застарілий `messages.tts.providers.edge` також виправляє `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `messages.tts.providers.microsoft`.
- `maxTextLength`: жорсткий ліміт для TTS-входу (символи). Якщо його перевищено, `/tts audio` завершується помилкою.
- `timeoutMs`: тайм-аут запиту (мс).
- `prefsPath`: перевизначає локальний шлях до JSON-файлу налаштувань (provider/limit/summary).
- Значення `apiKey` резервно беруться зі змінних середовища (`AZURE_SPEECH_KEY`/`AZURE_SPEECH_API_KEY`/`SPEECH_KEY`, `ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `INWORLD_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`). Volcengine натомість використовує `appId`/`token`.
- `providers.azure-speech.apiKey`: ключ ресурсу Azure Speech (змінні середовища:
  `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`).
- `providers.azure-speech.region`: регіон Azure Speech, наприклад `eastus` (змінні середовища:
  `AZURE_SPEECH_REGION` або `SPEECH_REGION`).
- `providers.azure-speech.endpoint` / `providers.azure-speech.baseUrl`: необов’язкове
  перевизначення endpoint/base URL Azure Speech.
- `providers.azure-speech.voice`: ShortName голосу Azure (типово
  `en-US-JennyNeural`).
- `providers.azure-speech.lang`: код мови SSML (типово `en-US`).
- `providers.azure-speech.outputFormat`: Azure `X-Microsoft-OutputFormat` для
  стандартного аудіовиходу (типово `audio-24khz-48kbitrate-mono-mp3`).
- `providers.azure-speech.voiceNoteOutputFormat`: Azure
  `X-Microsoft-OutputFormat` для виходу voice-note (типово
  `ogg-24khz-16bit-mono-opus`).
- `providers.elevenlabs.baseUrl`: перевизначає базовий URL API ElevenLabs.
- `providers.openai.baseUrl`: перевизначає endpoint OpenAI TTS.
  - Порядок визначення: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Нестандартні значення розглядаються як сумісні з OpenAI TTS endpoint, тому допускаються власні назви моделей і голосів.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = звичайна швидкість)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-літерний ISO 639-1 (наприклад, `en`, `de`)
- `providers.elevenlabs.seed`: ціле число `0..4294967295` (best-effort детермінізм)
- `providers.minimax.baseUrl`: перевизначає базовий URL API MiniMax (типово `https://api.minimax.io`, змінна середовища: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS-модель (типово `speech-2.8-hd`, змінна середовища: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: ідентифікатор голосу (типово `English_expressive_narrator`, змінна середовища: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: швидкість відтворення `0.5..2.0` (типово 1.0).
- `providers.minimax.vol`: гучність `(0, 10]` (типово 1.0; має бути більшою за 0).
- `providers.minimax.pitch`: цілочисельне зміщення висоти тону `-12..12` (типово 0). Дробові значення відкидаються перед викликом MiniMax T2A, оскільки API відхиляє нецілочисельні значення висоти тону.
- `providers.tts-local-cli.command`: локальний виконуваний файл або рядок команди для CLI TTS.
- `providers.tts-local-cli.args`: аргументи команди; підтримує заповнювачі `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` і `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: очікуваний формат виводу CLI (`mp3`, `opus` або `wav`; типово `mp3` для аудіовкладень).
- `providers.tts-local-cli.timeoutMs`: тайм-аут команди в мілісекундах (типово `120000`).
- `providers.tts-local-cli.cwd`: необов’язковий робочий каталог команди.
- `providers.tts-local-cli.env`: необов’язкові рядкові перевизначення середовища для команди.
- `providers.inworld.baseUrl`: перевизначає базовий URL API Inworld (типово `https://api.inworld.ai`).
- `providers.inworld.voiceId`: ідентифікатор голосу Inworld (типово `Sarah`).
- `providers.inworld.modelId`: TTS-модель Inworld (типово `inworld-tts-1.5-max`; також підтримує `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`).
- `providers.inworld.temperature`: температура семплювання `0..2` (необов’язково).
- `providers.google.model`: TTS-модель Gemini (типово `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: назва вбудованого голосу Gemini (типово `Kore`; також приймається `voice`).
- `providers.google.audioProfile`: підказка природною мовою для стилю, що додається перед текстом для озвучення.
- `providers.google.speakerName`: необов’язкова мітка мовця, що додається перед текстом для озвучення, коли ваш TTS-запит використовує іменованого мовця.
- `providers.google.promptTemplate`: задайте `audio-profile-v1`, щоб обгорнути поля підказки активної персони в детерміновану структуру підказки Gemini TTS.
- `providers.google.personaPrompt`: додатковий текст підказки персони, специфічний для Google, що додається до Director's Notes шаблону.
- `providers.google.baseUrl`: перевизначає базовий URL API Gemini. Допускається лише `https://generativelanguage.googleapis.com`.
  - Якщо `messages.tts.providers.google.apiKey` пропущено, TTS може повторно використати `models.providers.google.apiKey` перед переходом до змінних середовища.
- `providers.gradium.baseUrl`: перевизначає базовий URL API Gradium (типово `https://api.gradium.ai`).
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
- `providers.volcengine.speedRatio`: нативне для провайдера співвідношення швидкості.
- `providers.volcengine.emotion`: нативний для провайдера тег емоції.
- `providers.xai.apiKey`: API-ключ xAI TTS (змінна середовища: `XAI_API_KEY`).
- `providers.xai.baseUrl`: перевизначає базовий URL xAI TTS (типово `https://api.x.ai/v1`, змінна середовища: `XAI_BASE_URL`).
- `providers.xai.voiceId`: ідентифікатор голосу xAI (типово `eve`; поточні доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: код мови BCP-47 або `auto` (типово `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` або `alaw` (типово `mp3`).
- `providers.xai.speed`: нативне для провайдера перевизначення швидкості.
- `providers.xiaomi.apiKey`: API-ключ Xiaomi MiMo (змінна середовища: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: перевизначає базовий URL API Xiaomi MiMo (типово `https://api.xiaomimimo.com/v1`, змінна середовища: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: TTS-модель (типово `mimo-v2.5-tts`, змінна середовища: `XIAOMI_TTS_MODEL`; також підтримується `mimo-v2-tts`).
- `providers.xiaomi.voice`: ідентифікатор голосу MiMo (типово `mimo_default`, змінна середовища: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` або `wav` (типово `mp3`, змінна середовища: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: необов’язкова інструкція стилю природною мовою, що надсилається як повідомлення користувача; вона не озвучується.
- `providers.openrouter.apiKey`: API-ключ OpenRouter (змінна середовища: `OPENROUTER_API_KEY`; може повторно використовувати `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: перевизначає базовий URL OpenRouter TTS (типово `https://openrouter.ai/api/v1`; застарілий `https://openrouter.ai/v1` нормалізується).
- `providers.openrouter.model`: ідентифікатор TTS-моделі OpenRouter (типово `hexgrad/kokoro-82m`; також приймається `modelId`).
- `providers.openrouter.voice`: специфічний для провайдера ідентифікатор голосу (типово `af_alloy`; також приймається `voiceId`).
- `providers.openrouter.responseFormat`: `mp3` або `pcm` (типово `mp3`).
- `providers.openrouter.speed`: нативне для провайдера перевизначення швидкості.
- `providers.microsoft.enabled`: дозволяє використання мовлення Microsoft (типово `true`; без API-ключа).
- `providers.microsoft.voice`: назва нейронного голосу Microsoft (наприклад, `en-US-MichelleNeural`).
- `providers.microsoft.lang`: код мови (наприклад, `en-US`).
- `providers.microsoft.outputFormat`: формат виводу Microsoft (наприклад, `audio-24khz-48kbitrate-mono-mp3`).
  - Допустимі значення див. у Microsoft Speech output formats; не всі формати підтримуються вбудованим транспортом на базі Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: відсоткові рядки (наприклад, `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: записує JSON-субтитри поруч з аудіофайлом.
- `providers.microsoft.proxy`: URL проксі для запитів до Microsoft speech.
- `providers.microsoft.timeoutMs`: перевизначення тайм-ауту запиту (мс).
- `edge.*`: застарілий псевдонім для тих самих налаштувань Microsoft. Запустіть
  `openclaw doctor --fix`, щоб переписати збережену конфігурацію на `providers.microsoft`.

## Перевизначення, керовані моделлю (типово ввімкнено)

За замовчуванням модель **може** генерувати TTS-директиви для однієї відповіді.
Коли `messages.tts.auto` має значення `tagged`, ці директиви є обов’язковими для запуску аудіо.

Коли це ввімкнено, модель може генерувати директиви `[[tts:...]]`, щоб перевизначити голос
для однієї відповіді, а також необов’язковий блок `[[tts:text]]...[[/tts:text]]`, щоб
додати виразні теги (сміх, підказки для співу тощо), які мають з’являтися лише в
аудіо.

Потокова доставка блоків вилучає ці директиви з видимого тексту до того, як канал
їх побачить, навіть якщо директиву розділено між сусідніми блоками. Режим final
усе одно аналізує накопичену сиру відповідь для синтезу TTS.

Директиви `provider=...` ігноруються, якщо не задано `modelOverrides.allowProvider: true`.
Коли відповідь оголошує `provider=...`, інші ключі в цій директиві
аналізуються лише цим провайдером. Непідтримувані ключі вилучаються з видимого тексту
й повідомляються як попередження TTS-директив, а не маршрутизуються до іншого
провайдера.

Приклад вмісту відповіді:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Доступні ключі директив (коли ввімкнено):

- `provider` (ідентифікатор зареєстрованого провайдера мовлення, наприклад `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `volcengine`, `vydra`, `xai` або `xiaomi`; потребує `allowProvider: true`)
- `voice` (голос OpenAI, Gradium, Volcengine або Xiaomi), `voiceName` / `voice_name` / `google_voice` (голос Google) або `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (TTS-модель OpenAI, model id ElevenLabs, модель MiniMax або TTS-модель Xiaomi MiMo) або `google_model` (TTS-модель Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0-10)
- `pitch` (цілочисельна висота тону MiniMax, від -12 до 12; дробові значення відкидаються перед запитом MiniMax)
- `emotion` (тег емоції Volcengine)
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

## Налаштування для окремого користувача

Команди зі слешем записують локальні перевизначення в `prefsPath` (типово:
`~/.openclaw/settings/tts.json`, перевизначається через `OPENCLAW_TTS_PREFS` або
`messages.tts.prefsPath`).

Поля, що зберігаються:

- `auto`
- `provider`
- `persona`
- `maxLength` (поріг для зведення; типово 1500 символів)
- `summarize` (типово `true`)

Вони перевизначають ефективну конфігурацію з `messages.tts` разом з активним
блоком `agents.list[].tts` для цього хоста.

## Формати виводу (фіксовані)

- **Feishu / Matrix / Telegram / WhatsApp**: відповіді voice-note надають перевагу Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48 кГц / 64 кбіт/с — хороший компроміс для голосових повідомлень.
- **Feishu / WhatsApp**: коли відповідь voice-note створюється як MP3/WebM/WAV/M4A
  або інший імовірний аудіофайл, Plugin каналу транскодує її в 48 кГц
  Ogg/Opus за допомогою `ffmpeg` перед надсиланням нативного голосового повідомлення. WhatsApp надсилає
  результат через корисне навантаження Baileys `audio` з `ptt: true` і
  `audio/ogg; codecs=opus`. Якщо перетворення не вдається, Feishu отримує вихідний
  файл як вкладення; надсилання WhatsApp завершується помилкою замість публікації несумісного
  корисного навантаження PTT.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44,1 кГц / 128 кбіт/с — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32 кГц) для звичайних аудіовкладень. Для цілей voice-note, таких як Feishu, Telegram і WhatsApp, OpenClaw транскодує MP3 MiniMax у 48 кГц Opus за допомогою `ffmpeg` перед доставкою.
- **Xiaomi MiMo**: типово MP3 або WAV, якщо налаштовано. Для цілей voice-note, таких як Feishu, Telegram і WhatsApp, OpenClaw транскодує вихід Xiaomi у 48 кГц Opus за допомогою `ffmpeg` перед доставкою.
- **Local CLI**: використовує налаштований `outputFormat`. Цілі voice-note
  перетворюються в Ogg/Opus, а вихід для telephony перетворюється в сирий 16 кГц моно PCM
  за допомогою `ffmpeg`.
- **Google Gemini**: Gemini API TTS повертає сирий 24 кГц PCM. OpenClaw упаковує його як WAV для аудіовкладень, транскодує в 48 кГц Opus для цілей voice-note і повертає PCM безпосередньо для Talk/telephony.
- **Gradium**: WAV для аудіовкладень, Opus для цілей voice-note і `ulaw_8000` на 8 кГц для telephony.
- **Inworld**: MP3 для звичайних аудіовкладень, нативний `OGG_OPUS` для цілей voice-note і сирий `PCM` на 22050 Гц для Talk/telephony.
- **xAI**: типово MP3; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує пакетний REST TTS endpoint xAI і повертає завершене аудіовкладення; потоковий TTS WebSocket xAI не використовується цим шляхом провайдера. Нативний формат Opus для voice-note цим шляхом не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але не всі формати доступні в сервісі.
  - Значення формату виводу відповідають Microsoft Speech output formats (включно з Ogg/WebM Opus).
  - `sendVoice` у Telegram приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виводу Microsoft не спрацьовує, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка auto-TTS

Коли ввімкнено, OpenClaw:

- пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- пропускає дуже короткі відповіді (< 10 символів).
- стисло зводить довгі відповіді, коли це ввімкнено, за допомогою `agents.defaults.model.primary` (або `summaryModel`).
- прикріплює згенероване аудіо до відповіді.
- у `mode: "final"` усе одно надсилає TTS лише з аудіо для потокових фінальних відповідей
  після завершення текстового потоку; згенерований медіавміст проходить ту саму
  нормалізацію медіа каналу, що й звичайні вкладення відповіді.

Якщо відповідь перевищує `maxLength`, а summary вимкнено (або немає API-ключа для
моделі зведення), аудіо
пропускається й надсилається звичайна текстова відповідь.

## Схема потоку

```
Відповідь -> TTS увімкнено?
  ні  -> надіслати текст
  так -> є медіа / MEDIA: / коротка?
          так -> надіслати текст
          ні  -> довжина > ліміт?
                   ні  -> TTS -> прикріпити аудіо
                   так -> summary увімкнено?
                            ні  -> надіслати текст
                            так -> зведення (summaryModel або agents.defaults.model.primary)
                                      -> TTS -> прикріпити аудіо
```

## Використання команд зі слешем

Існує одна команда: `/tts`.
Докладніше про ввімкнення див. у [Команди зі слешем](/uk/tools/slash-commands).

Примітка для Discord: `/tts` — це вбудована команда Discord, тому OpenClaw реєструє
`/voice` як нативну команду. Текстовий варіант `/tts ...` усе одно працює.

```
/tts off
/tts on
/tts status
/tts chat on
/tts chat off
/tts chat default
/tts latest
/tts provider openai
/tts persona alfred
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Примітки:

- Команди потребують авторизованого відправника (правила allowlist/owner усе ще діють).
- Має бути ввімкнено `commands.text` або реєстрацію нативних команд.
- Конфігурація `messages.tts.auto` приймає `off|always|inbound|tagged`.
- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- `/tts chat on|off|default` записує перевизначення auto-TTS на рівні сесії для поточного чату.
- Використовуйте конфігурацію, якщо вам потрібні типові значення `inbound` або `tagged`.
- `/tts persona <id>` записує локальне налаштування персони; `/tts persona off` очищає його.
- `limit` і `summary` зберігаються в локальних налаштуваннях, а не в основній конфігурації.
- `/tts audio` генерує одноразову аудіовідповідь (не вмикає TTS).
- `/tts latest` читає найновішу відповідь помічника з транскрипту поточної сесії й один раз надсилає її як аудіо. Він зберігає лише хеш цієї відповіді в записі сесії, щоб придушувати дубльовані надсилання голосом.
- `/tts status` містить видимість резервного переходу для останньої спроби:
  - успішний резервний перехід: `Fallback: <primary> -> <used>` плюс `Attempts: ...`
  - помилка: `Error: ...` плюс `Attempts: ...`
  - детальна діагностика: `Attempt details: provider:outcome(reasonCode) latency`
- `/status` показує активний режим TTS разом із налаштованими provider, model, voice
  і очищеними метаданими власного endpoint, коли TTS увімкнено.
- Збої API OpenAI та ElevenLabs тепер включають розібрані деталі помилки провайдера й request id (коли їх повертає провайдер), які відображаються в помилках/логах TTS.

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення й повертає аудіовкладення для
доставки у відповіді. Коли каналом є Feishu, Matrix, Telegram або WhatsApp,
аудіо доставляється як голосове повідомлення, а не як вкладений файл.
Feishu і WhatsApp можуть транскодувати вихід TTS не у форматі Opus на цьому шляху, коли
доступний `ffmpeg`.
WhatsApp надсилає аудіо через Baileys як голосову нотатку PTT (`audio` з
`ptt: true`), а видимий текст надсилає окремо від PTT-аудіо, оскільки клієнти
не завжди коректно відображають підписи до голосових нотаток.
Він приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` — це
тайм-аут запиту до провайдера на один виклик у мілісекундах.

## Gateway RPC

Методи Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.setPersona`
- `tts.providers`

## Пов’язане

- [Огляд медіа](/uk/tools/media-overview)
- [Генерація музики](/uk/tools/music-generation)
- [Генерація відео](/uk/tools/video-generation)
