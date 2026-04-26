---
read_when:
    - Увімкнення text-to-speech для відповідей
    - Налаштування провайдера TTS, ланцюжка резервних варіантів або персони
    - Використання команд або директив /tts
sidebarTitle: Text to speech (TTS)
summary: Text-to-speech для вихідних відповідей — провайдери, персони, slash-команди та вивід для кожного каналу
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-26T07:04:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9844f0efe139e4ea4dd8f15b2476c5b55aa0d97c89e7b54125b29580e3b8c78e
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо через **13 speech provider**
і доставляти нативні голосові повідомлення у Feishu, Matrix, Telegram і WhatsApp,
аудіовкладення всюди в інших місцях, а також потоки PCM/Ulaw для телефонії та Talk.

## Швидкий початок

<Steps>
  <Step title="Виберіть провайдера">
    OpenAI та ElevenLabs — найнадійніші хостингові варіанти. Microsoft і
    Local CLI працюють без API-ключа. Повний список див. у [матриці провайдерів](#supported-providers).
  </Step>
  <Step title="Установіть API-ключ">
    Експортуйте змінну середовища для свого провайдера (наприклад, `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft і Local CLI ключ не потрібен.
  </Step>
  <Step title="Увімкніть у конфігурації">
    Установіть `messages.tts.auto: "always"` і `messages.tts.provider`:

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

  </Step>
  <Step title="Спробуйте в чаті">
    `/tts status` показує поточний стан. `/tts audio Hello from OpenClaw`
    надсилає одноразову аудіовідповідь.
  </Step>
</Steps>

<Note>
Auto-TTS **вимкнено** за замовчуванням. Коли `messages.tts.provider` не задано,
OpenClaw вибирає першого налаштованого провайдера в порядку авто-вибору реєстру.
</Note>

## Підтримувані провайдери

| Провайдер        | Автентифікація                                                                                                    | Примітки                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech** | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (також `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)         | Нативний вивід голосових нотаток Ogg/Opus і телефонія.                  |
| **ElevenLabs**   | `ELEVENLABS_API_KEY` або `XI_API_KEY`                                                                             | Клонування голосу, багатомовність, детермінованість через `seed`.       |
| **Google Gemini**| `GEMINI_API_KEY` або `GOOGLE_API_KEY`                                                                             | Gemini API TTS; підтримує persona через `promptTemplate: "audio-profile-v1"`. |
| **Gradium**      | `GRADIUM_API_KEY`                                                                                                 | Вивід голосових нотаток і телефонії.                                    |
| **Inworld**      | `INWORLD_API_KEY`                                                                                                 | Streaming TTS API. Нативний Opus для голосових нотаток і PCM для телефонії. |
| **Local CLI**    | none                                                                                                              | Запускає налаштовану локальну команду TTS.                              |
| **Microsoft**    | none                                                                                                              | Публічний Edge neural TTS через `node-edge-tts`. Найкраща можлива спроба, без SLA. |
| **MiniMax**      | `MINIMAX_API_KEY` (або Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)    | API T2A v2. Типово `speech-2.8-hd`.                                     |
| **OpenAI**       | `OPENAI_API_KEY`                                                                                                  | Також використовується для auto-summary; підтримує persona `instructions`. |
| **OpenRouter**   | `OPENROUTER_API_KEY` (може повторно використовувати `models.providers.openrouter.apiKey`)                        | Типова модель `hexgrad/kokoro-82m`.                                     |
| **Volcengine**   | `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY` (застарілі AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | HTTP API BytePlus Seed Speech.                                          |
| **Vydra**        | `VYDRA_API_KEY`                                                                                                   | Спільний провайдер зображень, відео та мовлення.                        |
| **xAI**          | `XAI_API_KEY`                                                                                                     | Пакетний TTS xAI. Нативний голосовий формат Opus **не** підтримується.  |
| **Xiaomi MiMo**  | `XIAOMI_API_KEY`                                                                                                  | TTS MiMo через Xiaomi chat completions.                                 |

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний,
а решта слугують резервними варіантами. Auto-summary використовує `summaryModel` (або
`agents.defaults.model.primary`), тож цей провайдер також має бути автентифікований,
якщо ви залишаєте summary увімкненими.

<Warning>
Вбудований провайдер **Microsoft** використовує онлайн-сервіс neural TTS Microsoft Edge
через `node-edge-tts`. Це публічний вебсервіс без опублікованого
SLA або квоти — розглядайте його як найкращу можливу спробу. Застарілий ідентифікатор провайдера `edge`
нормалізується до `microsoft`, а `openclaw doctor --fix` переписує збережену
конфігурацію; нові конфігурації завжди мають використовувати `microsoft`.
</Warning>

## Конфігурація

Конфігурація TTS розташована в `messages.tts` у `~/.openclaw/openclaw.json`. Виберіть
готовий пресет і адаптуйте блок провайдера:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
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
  </Tab>
  <Tab title="ElevenLabs">
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
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Необов’язкові підказки природною мовою для стилю:
          // audioProfile: "Говори спокійним тоном ведучого подкасту.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
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
  </Tab>
  <Tab title="Microsoft (без ключа)">
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
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
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
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Перевизначення голосу для окремого агента

Використовуйте `agents.list[].tts`, коли один агент має говорити через іншого провайдера,
голос, модель, persona або режим auto-TTS. Блок агента глибоко зливається поверх
`messages.tts`, тож облікові дані провайдера можуть залишатися в глобальній конфігурації провайдера:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Щоб закріпити persona для окремого агента, установіть `agents.list[].tts.persona` поруч із конфігурацією провайдера —
це перевизначає глобальну `messages.tts.persona` лише для цього агента.

Порядок пріоритету для автоматичних відповідей, `/tts audio`, `/tts status` і
інструмента агента `tts`:

1. `messages.tts`
2. активний `agents.list[].tts`
3. локальні налаштування `/tts` для цього хоста
4. вбудовані директиви `[[tts:...]]`, коли [перевизначення моделлю](#model-driven-directives) увімкнені

## Personas

**Persona** — це стабільна голосова ідентичність, яку можна детерміновано застосовувати
між провайдерами. Вона може надавати перевагу одному провайдеру, визначати нейтральний до провайдера намір промпту
та містити прив’язки, специфічні для провайдера, для голосів, моделей, шаблонів промптів,
`seed` і налаштувань голосу.

### Мінімальна persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Оповідач",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### Повна persona (нейтральний до провайдера промпт)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Стриманий, теплий британський голос дворецького-оповідача.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Блискучий британський дворецький. Стриманий, дотепний, теплий, чарівний, емоційно виразний, ніколи не шаблонний.",
            scene: "Тихий кабінет пізно вночі. Оповідь близько до мікрофона для довіреного оператора.",
            sampleContext: "Мовець відповідає на приватний технічний запит із лаконічною впевненістю та стриманим теплом.",
            style: "Вишуканий, стриманий, з легкою усмішкою.",
            accent: "Британська англійська.",
            pacing: "Розмірений, із короткими драматичними паузами.",
            constraints: ["Не зачитувати вголос значення конфігурації.", "Не пояснювати persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
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

### Визначення persona

Активна persona вибирається детерміновано:

1. локальне налаштування `/tts persona <id>`, якщо задано.
2. `messages.tts.persona`, якщо задано.
3. Без persona.

Вибір провайдера виконується за принципом «явне спочатку»:

1. Прямі перевизначення (CLI, gateway, Talk, дозволені директиви TTS).
2. Локальне налаштування `/tts provider <id>`.
3. `provider` активної persona.
4. `messages.tts.provider`.
5. Автовибір реєстру.

Для кожної спроби провайдера OpenClaw об’єднує конфігурації в такому порядку:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Довірені перевизначення запиту
4. Дозволені перевизначення директив TTS, згенерованих моделлю

### Як провайдери використовують промпти persona

Поля промпту persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) **нейтральні до провайдера**. Кожен провайдер сам вирішує,
як їх використовувати:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Обгортає поля промпту persona у структуру промпту Gemini TTS **лише тоді**,
    коли ефективна конфігурація провайдера Google встановлює `promptTemplate: "audio-profile-v1"`
    або `personaPrompt`. Старіші поля `audioProfile` і `speakerName`
    досі додаються на початок як текст промпту, специфічний для Google. Вбудовані аудіотеги, такі як
    `[whispers]` або `[laughs]` усередині блока `[[tts:text]]`, зберігаються
    всередині транскрипту Gemini; OpenClaw не генерує ці теги.
  </Accordion>
  <Accordion title="OpenAI">
    Відображає поля промпту persona в поле запиту `instructions` **лише тоді**,
    коли не налаштовано явне `instructions` для OpenAI. Явне `instructions`
    завжди має пріоритет.
  </Accordion>
  <Accordion title="Інші провайдери">
    Використовують лише прив’язки persona, специфічні для провайдера, у
    `personas.<id>.providers.<provider>`. Поля промпту persona ігноруються,
    якщо провайдер не реалізує власне зіставлення промпту persona.
  </Accordion>
</AccordionGroup>

### Політика резервних варіантів

`fallbackPolicy` керує поведінкою, коли persona **не має прив’язки** для
поточного провайдера:

| Політика            | Поведінка                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Типово.** Нейтральні до провайдера поля промпту залишаються доступними; провайдер може використовувати їх або ігнорувати.                      |
| `provider-defaults` | Persona пропускається під час підготовки промпту для цієї спроби; провайдер використовує свої нейтральні типові значення, поки резервний перехід до інших провайдерів триває. |
| `fail`              | Пропустити цю спробу провайдера з `reasonCode: "not_configured"` і `personaBinding: "missing"`. Резервні провайдери все одно будуть випробувані. |

Увесь TTS-запит завершується помилкою лише тоді, коли **кожного** провайдера,
якого пробували, було пропущено або він завершився помилкою.

## Директиви, керовані моделлю

За замовчуванням асистент **може** виводити директиви `[[tts:...]]`, щоб перевизначити
голос, модель або швидкість для однієї відповіді, а також необов’язковий
блок `[[tts:text]]...[[/tts:text]]` для виразних підказок, які мають з’являтися
лише в аудіо:

```text
Ось, будь ласка.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](сміється) Прочитай пісню ще раз.[[/tts:text]]
```

Коли `messages.tts.auto` дорівнює `"tagged"`, для запуску
аудіо **потрібні директиви**. Потокова доставка блоків прибирає директиви з видимого тексту до того,
як канал їх побачить, навіть якщо вони розділені між сусідніми блоками.

`provider=...` ігнорується, якщо `modelOverrides.allowProvider: true` не увімкнено. Коли
відповідь оголошує `provider=...`, інші ключі в цій директиві аналізуються
лише цим провайдером; непідтримувані ключі прибираються й повідомляються як
попередження директив TTS.

**Доступні ключі директив:**

- `provider` (ідентифікатор зареєстрованого провайдера; потребує `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0–10)
- `pitch` (цілочисельний pitch MiniMax, від −12 до 12; дробові значення відсікаються)
- `emotion` (тег емоції Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Повністю вимкнути перевизначення моделлю:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Дозволити перемикання провайдера, зберігши можливість налаштовувати інші параметри:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-команди

Одна команда `/tts`. У Discord OpenClaw також реєструє `/voice`, тому що
`/tts` — це вбудована команда Discord — текстовий `/tts ...` усе одно працює.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Команди вимагають авторизованого відправника (застосовуються правила allowlist/owner) і
увімкненого `commands.text` або реєстрації нативних команд.
</Note>

Примітки щодо поведінки:

- `/tts on` записує локальне налаштування TTS як `always`; `/tts off` записує його як `off`.
- `/tts chat on|off|default` записує перевизначення auto-TTS на рівні сеансу для поточного чату.
- `/tts persona <id>` записує локальне налаштування persona; `/tts persona off` очищає його.
- `/tts latest` читає останню відповідь асистента з транскрипту поточного сеансу й один раз надсилає її як аудіо. Він зберігає лише хеш цієї відповіді в записі сеансу, щоб пригнічувати дубльовані голосові надсилання.
- `/tts audio` генерує одноразову аудіовідповідь (**не** вмикає TTS).
- `limit` і `summary` зберігаються в **локальних налаштуваннях**, а не в основній конфігурації.
- `/tts status` містить діагностику резервних варіантів для останньої спроби — `Fallback: <primary> -> <used>`, `Attempts: ...` і деталі для кожної спроби (`provider:outcome(reasonCode) latency`).
- `/status` показує активний режим TTS, а також налаштовані провайдер, модель, голос і очищені метадані користувацької кінцевої точки, коли TTS увімкнено.

## Налаштування для користувача

Slash-команди записують локальні перевизначення в `prefsPath`. Типове значення —
`~/.openclaw/settings/tts.json`; перевизначайте через змінну середовища `OPENCLAW_TTS_PREFS`
або `messages.tts.prefsPath`.

| Збережене поле | Ефект                                       |
| -------------- | ------------------------------------------- |
| `auto`         | Локальне перевизначення auto-TTS (`always`, `off`, …) |
| `provider`     | Локальне перевизначення основного провайдера |
| `persona`      | Локальне перевизначення persona             |
| `maxLength`    | Поріг summary (типово `1500` символів)      |
| `summarize`    | Перемикач summary (типово `true`)           |

Вони перевизначають ефективну конфігурацію з `messages.tts` плюс активний
блок `agents.list[].tts` для цього хоста.

## Формати виводу (фіксовані)

Доставлення голосу TTS визначається можливостями каналу. Plugin каналів оголошують,
чи має TTS у стилі голосових повідомлень просити провайдерів про нативну ціль `voice-note`,
чи залишати звичайний синтез `audio-file` і лише позначати сумісний вивід для
доставлення як голосового.

- **Канали з підтримкою voice-note**: для відповідей-голосових повідомлень надається перевага Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48 кГц / 64 кбіт/с — хороший компроміс для голосових повідомлень.
- **Feishu / WhatsApp**: коли відповідь-голосове повідомлення створюється як MP3/WebM/WAV/M4A
  або інший імовірний аудіофайл, Plugin каналу транскодує його в 48 кГц
  Ogg/Opus через `ffmpeg` перед надсиланням нативного голосового повідомлення. WhatsApp надсилає
  результат через корисне навантаження Baileys `audio` з `ptt: true` і
  `audio/ogg; codecs=opus`. Якщо конвертація не вдається, Feishu отримує початковий
  файл як вкладення; надсилання в WhatsApp завершується помилкою замість публікації несумісного
  корисного навантаження PTT.
- **BlueBubbles**: залишає синтез провайдера на звичайному шляху `audio-file`; виходи MP3
  і CAF позначаються для доставлення як голосове memo в iMessage.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44,1 кГц / 128 кбіт/с — типовий баланс для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32 кГц) для звичайних аудіовкладень. Для оголошених каналом цілей voice-note OpenClaw транскодує MP3 MiniMax у 48 кГц Opus через `ffmpeg` перед доставленням, коли канал оголошує підтримку транскодування.
- **Xiaomi MiMo**: MP3 за замовчуванням або WAV, якщо налаштовано. Для оголошених каналом цілей voice-note OpenClaw транскодує вихід Xiaomi у 48 кГц Opus через `ffmpeg` перед доставленням, коли канал оголошує підтримку транскодування.
- **Local CLI**: використовує налаштований `outputFormat`. Цілі voice-note
  конвертуються в Ogg/Opus, а вивід для телефонії конвертується в сирий моно PCM 16 кГц
  через `ffmpeg`.
- **Google Gemini**: Gemini API TTS повертає сирий PCM 24 кГц. OpenClaw обгортає його у WAV для аудіовкладень, транскодує в 48 кГц Opus для цілей voice-note і повертає PCM напряму для Talk/телефонії.
- **Gradium**: WAV для аудіовкладень, Opus для цілей voice-note і `ulaw_8000` на 8 кГц для телефонії.
- **Inworld**: MP3 для звичайних аудіовкладень, нативний `OGG_OPUS` для цілей voice-note і сирий `PCM` на 22050 Гц для Talk/телефонії.
- **xAI**: MP3 за замовчуванням; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує пакетний REST TTS endpoint xAI і повертає готове аудіовкладення; WebSocket потокового TTS xAI не використовується цим шляхом провайдера. Нативний формат voice-note Opus цим шляхом не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але не всі формати доступні в сервісі.
  - Значення формату виводу відповідають форматам виводу Microsoft Speech (включно з Ogg/WebM Opus).
  - Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виводу Microsoft не працює, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка auto-TTS

Коли `messages.tts.auto` увімкнено, OpenClaw:

- Пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- Пропускає дуже короткі відповіді (менше 10 символів).
- Стисло підсумовує довгі відповіді, коли summary увімкнені, використовуючи
  `summaryModel` (або `agents.defaults.model.primary`).
- Додає згенероване аудіо до відповіді.
- У `mode: "final"` усе одно надсилає audio-only TTS для фінальних потокових відповідей
  після завершення текстового потоку; згенероване медіа проходить ту саму нормалізацію медіа каналу, що й звичайні вкладення відповіді.

Якщо відповідь перевищує `maxLength`, а summary вимкнено (або немає API-ключа для
моделі summary), аудіо пропускається й надсилається звичайна текстова відповідь.

```text
Відповідь -> TTS увімкнено?
  ні  -> надіслати текст
  так -> є медіа / MEDIA: / коротка?
          так -> надіслати текст
          ні  -> довжина > ліміт?
                   ні  -> TTS -> додати аудіо
                   так -> summary увімкнено?
                            ні  -> надіслати текст
                            так -> summary -> TTS -> додати аудіо
```

## Формати виводу за каналами

| Ціль                                  | Формат                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Для відповідей у форматі voice-note надається перевага **Opus** (`opus_48000_64` від ElevenLabs, `opus` від OpenAI). 48 кГц / 64 кбіт/с балансує чіткість і розмір. |
| Інші канали                           | **MP3** (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI). 44,1 кГц / 128 кбіт/с — типове значення для мовлення.                    |
| Talk / телефонія                      | Рідний для провайдера **PCM** (Inworld 22050 Гц, Google 24 кГц) або `ulaw_8000` від Gradium для телефонії.                          |

Примітки щодо провайдерів:

- **Транскодування Feishu / WhatsApp:** Коли відповідь у форматі voice-note надходить як MP3/WebM/WAV/M4A, Plugin каналу транскодує її в 48 кГц Ogg/Opus через `ffmpeg`. WhatsApp надсилає через Baileys з `ptt: true` і `audio/ogg; codecs=opus`. Якщо конвертація не вдається: Feishu резервно додає початковий файл як вкладення; надсилання в WhatsApp завершується помилкою замість публікації несумісного корисного навантаження PTT.
- **MiniMax / Xiaomi MiMo:** Типово MP3 (32 кГц для MiniMax `speech-2.8-hd`); транскодується в 48 кГц Opus для цілей voice-note через `ffmpeg`.
- **Local CLI:** Використовує налаштований `outputFormat`. Цілі voice-note конвертуються в Ogg/Opus, а вивід для телефонії — у сирий моно PCM 16 кГц.
- **Google Gemini:** Повертає сирий PCM 24 кГц. OpenClaw обгортає його у WAV для вкладень, транскодує в 48 кГц Opus для цілей voice-note, повертає PCM напряму для Talk/телефонії.
- **Inworld:** MP3-вкладення, нативний `OGG_OPUS` для voice-note, сирий `PCM` 22050 Гц для Talk/телефонії.
- **xAI:** Типово MP3; `responseFormat` може бути `mp3|wav|pcm|mulaw|alaw`. Використовує пакетний REST endpoint xAI — потоковий TTS WebSocket **не** використовується. Нативний формат voice-note Opus **не** підтримується.
- **Microsoft:** Використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні гарантовані голосові повідомлення Opus. Якщо налаштований формат Microsoft не працює, OpenClaw повторює спробу з MP3.

Формати виводу OpenAI та ElevenLabs фіксовані для кожного каналу, як наведено вище.

## Довідка щодо полів

<AccordionGroup>
  <Accordion title="Верхньорівневі messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Режим auto-TTS. `inbound` надсилає аудіо лише після вхідного голосового повідомлення; `tagged` надсилає аудіо лише коли відповідь містить директиви `[[tts:...]]` або блок `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Застарілий перемикач. `openclaw doctor --fix` мігрує його в `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` включає відповіді інструментів/блоків на додачу до фінальних відповідей.
    </ParamField>
    <ParamField path="provider" type="string">
      Ідентифікатор speech provider. Якщо не задано, OpenClaw використовує першого налаштованого провайдера в порядку авто-вибору реєстру. Застарілий `provider: "edge"` переписується в `"microsoft"` через `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Ідентифікатор активної persona з `personas`. Нормалізується до нижнього регістру.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Стабільна голосова ідентичність. Поля: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Див. [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Недорога модель для auto-summary; типово `agents.defaults.model.primary`. Приймає `provider/model` або налаштований псевдонім моделі.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Дозволити моделі виводити директиви TTS. `enabled` типово `true`; `allowProvider` типово `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Налаштування, якими володіє провайдер, із ключем за ідентифікатором speech provider. Застарілі прямі блоки (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) переписуються через `openclaw doctor --fix`; комітьте лише `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Жорстке обмеження кількості символів для вхідних даних TTS. `/tts audio` завершується помилкою, якщо його перевищено.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Тайм-аут запиту в мілісекундах.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Перевизначення шляху до локального JSON налаштувань (provider/limit/summary). Типово `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Змінна середовища: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Регіон Azure Speech (наприклад, `eastus`). Змінна середовища: `AZURE_SPEECH_REGION` або `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Необов’язкове перевизначення endpoint Azure Speech (псевдонім `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName голосу Azure. Типово `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Код мови SSML. Типово `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` для стандартного аудіо. Типово `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` для виводу voice-note. Типово `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Резервно використовує `ELEVENLABS_API_KEY` або `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі (наприклад, `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">Ідентифікатор голосу ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (кожне `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = нормально).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Режим нормалізації тексту.</ParamField>
    <ParamField path="languageCode" type="string">2-літерний ISO 639-1 (наприклад, `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ціле число `0..4294967295` для best-effort детермінованості.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначення базової URL-адреси API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Резервно використовує `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Якщо не задано, TTS може повторно використовувати `models.providers.google.apiKey` перед резервним переходом до env.</ParamField>
    <ParamField path="model" type="string">Модель Gemini TTS. Типово `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Назва вбудованого голосу Gemini. Типово `Kore`. Псевдонім: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Підказка стилю природною мовою, що додається перед озвучуваним текстом.</ParamField>
    <ParamField path="speakerName" type="string">Необов’язкова мітка мовця, що додається перед озвучуваним текстом, коли ваш промпт використовує названого мовця.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Установіть `audio-profile-v1`, щоб обгорнути поля промпту активної persona в детерміновану структуру промпту Gemini TTS.</ParamField>
    <ParamField path="personaPrompt" type="string">Додатковий текст промпту persona, специфічний для Google, що додається до приміток режисера в шаблоні.</ParamField>
    <ParamField path="baseUrl" type="string">Дозволено лише `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Змінна середовища: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Типово Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Змінна середовища: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Типово `inworld-tts-1.5-max`. Також: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Типово `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Температура семплювання `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Локальний виконуваний файл або рядок команди для CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Аргументи команди. Підтримує заповнювачі `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Очікуваний формат виводу CLI. Типово `mp3` для аудіовкладень.</ParamField>
    <ParamField path="timeoutMs" type="number">Тайм-аут команди в мілісекундах. Типово `120000`.</ParamField>
    <ParamField path="cwd" type="string">Необов’язковий робочий каталог команди.</ParamField>
    <ParamField path="env" type="Record<string, string>">Необов’язкові перевизначення змінних середовища для команди.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (без API-ключа)">
    <ParamField path="enabled" type="boolean" default="true">Дозволити використання мовлення Microsoft.</ParamField>
    <ParamField path="voice" type="string">Назва neural voice Microsoft (наприклад, `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Код мови (наприклад, `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Формат виводу Microsoft. Типово `audio-24khz-48kbitrate-mono-mp3`. Не всі формати підтримуються вбудованим транспортом на основі Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Рядки у відсотках (наприклад, `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Записувати JSON-субтитри поруч з аудіофайлом.</ParamField>
    <ParamField path="proxy" type="string">URL-адреса проксі для запитів мовлення Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Перевизначення тайм-ауту запиту (мс).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Застарілий псевдонім. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію в `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Резервно використовує `MINIMAX_API_KEY`. Автентифікація Token Plan через `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` або `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://api.minimax.io`. Змінна середовища: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Типово `speech-2.8-hd`. Змінна середовища: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Типово `English_expressive_narrator`. Змінна середовища: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Типово `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Типово `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Ціле число `-12..12`. Типово `0`. Дробові значення відсікаються перед запитом.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Резервно використовує `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі OpenAI TTS (наприклад, `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Назва голосу (наприклад, `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Явне поле OpenAI `instructions`. Коли його задано, поля промпту persona **не** зіставляються автоматично.</ParamField>
    <ParamField path="baseUrl" type="string">
      Перевизначення endpoint OpenAI TTS. Порядок визначення: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Нестандартні значення розглядаються як OpenAI-compatible TTS endpoint, тому дозволені користувацькі назви моделей і голосів.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Змінна середовища: `OPENROUTER_API_KEY`. Може повторно використовувати `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://openrouter.ai/api/v1`. Застаріле `https://openrouter.ai/v1` нормалізується.</ParamField>
    <ParamField path="model" type="string">Типово `hexgrad/kokoro-82m`. Псевдонім: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Типово `af_alloy`. Псевдонім: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Типово `mp3`.</ParamField>
    <ParamField path="speed" type="number">Перевизначення швидкості, рідне для провайдера.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Змінна середовища: `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Типово `seed-tts-1.0`. Змінна середовища: `VOLCENGINE_TTS_RESOURCE_ID`. Використовуйте `seed-tts-2.0`, якщо ваш проєкт має entitlement TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Заголовок app key. Типово `aGjiRDfUWi`. Змінна середовища: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначення HTTP endpoint Seed Speech TTS. Змінна середовища: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Тип голосу. Типово `en_female_anna_mars_bigtts`. Змінна середовища: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Коефіцієнт швидкості, рідний для провайдера.</ParamField>
    <ParamField path="emotion" type="string">Тег емоції, рідний для провайдера.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Застарілі поля Volcengine Speech Console. Змінні середовища: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (типово `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Змінна середовища: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://api.x.ai/v1`. Змінна середовища: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Типово `eve`. Доступні голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Код мови BCP-47 або `auto`. Типово `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Типово `mp3`.</ParamField>
    <ParamField path="speed" type="number">Перевизначення швидкості, рідне для провайдера.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Змінна середовища: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Типово `https://api.xiaomimimo.com/v1`. Змінна середовища: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Типово `mimo-v2.5-tts`. Змінна середовища: `XIAOMI_TTS_MODEL`. Також підтримує `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Типово `mimo_default`. Змінна середовища: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Типово `mp3`. Змінна середовища: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Необов’язкова інструкція стилю природною мовою, що надсилається як повідомлення користувача; не озвучується.</ParamField>
  </Accordion>
</AccordionGroup>

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення й повертає аудіовкладення для
доставлення у відповіді. У Feishu, Matrix, Telegram і WhatsApp аудіо
доставляється як голосове повідомлення, а не як файлове вкладення. Feishu і
WhatsApp можуть транскодувати не-Opus вихід TTS на цьому шляху, коли `ffmpeg`
доступний.

WhatsApp надсилає аудіо через Baileys як PTT voice note (`audio` з
`ptt: true`) і надсилає видимий текст **окремо** від PTT-аудіо, тому що
клієнти не завжди коректно відображають підписи на голосових нотатках.

Інструмент приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` —
це тайм-аут запиту до провайдера в мілісекундах для одного виклику.

## Gateway RPC

| Метод            | Призначення                              |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Прочитати поточний стан TTS і останню спробу. |
| `tts.enable`      | Установити локальне налаштування auto в `always`. |
| `tts.disable`     | Установити локальне налаштування auto в `off`. |
| `tts.convert`     | Одноразове перетворення тексту в аудіо.  |
| `tts.setProvider` | Установити локальне налаштування провайдера. |
| `tts.setPersona`  | Установити локальне налаштування persona. |
| `tts.providers`   | Показати список налаштованих провайдерів і їхній стан. |

## Посилання на сервіси

- [Посібник OpenAI text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Довідка OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Провайдер Azure Speech](/uk/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Автентифікація ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/uk/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [HTTP API Volcengine TTS](/uk/providers/volcengine#text-to-speech)
- [Синтез мовлення Xiaomi MiMo](/uk/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Формати виводу Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Пов’язано

- [Огляд медіа](/uk/tools/media-overview)
- [Генерація музики](/uk/tools/music-generation)
- [Генерація відео](/uk/tools/video-generation)
- [Slash-команди](/uk/tools/slash-commands)
- [Plugin голосових дзвінків](/uk/plugins/voice-call)
