---
read_when:
    - Увімкнення Text-to-speech для відповідей
    - Налаштування провайдера TTS, ланцюжка резервних варіантів або персони
    - Використання команд або директив `/tts`
sidebarTitle: Text to speech (TTS)
summary: Text-to-speech для вихідних відповідей — провайдери, персони, slash-команди та виведення для окремих каналів
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-26T07:51:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо через **13 speech-провайдерів**
і доставляти нативні голосові повідомлення у Feishu, Matrix, Telegram і WhatsApp,
аудіовкладення всюди в інших місцях, а також потоки PCM/Ulaw для telephony і Talk.

## Швидкий старт

<Steps>
  <Step title="Виберіть провайдера">
    OpenAI і ElevenLabs — найнадійніші hosted-варіанти. Microsoft і
    Local CLI працюють без API-ключа. Див. [матрицю провайдерів](#supported-providers)
    для повного списку.
  </Step>
  <Step title="Установіть API-ключ">
    Експортуйте env var для свого провайдера (наприклад `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft і Local CLI не потребують ключа.
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
OpenClaw вибирає першого налаштованого провайдера в порядку auto-select реєстру.
</Note>

## Підтримувані провайдери

| Провайдер         | Автентифікація                                                                                                 | Примітки                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (також `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)      | Нативне voice-note-виведення Ogg/Opus і telephony.                      |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` або `XI_API_KEY`                                                                          | Клонування голосу, багатомовність, детермінованість через `seed`.       |
| **Google Gemini** | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                                                                          | Gemini API TTS; підтримує persona через `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                              | Виведення voice-note і telephony.                                       |
| **Inworld**       | `INWORLD_API_KEY`                                                                                              | Streaming TTS API. Нативний voice-note Opus і telephony PCM.            |
| **Local CLI**     | none                                                                                                           | Запускає налаштовану локальну команду TTS.                              |
| **Microsoft**     | none                                                                                                           | Публічний neural TTS Edge через `node-edge-tts`. Best-effort, без SLA.  |
| **MiniMax**       | `MINIMAX_API_KEY` (або Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`) | API T2A v2. За замовчуванням `speech-2.8-hd`.                           |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                               | Також використовується для auto-summary; підтримує persona `instructions`. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (може повторно використовувати `models.providers.openrouter.apiKey`)                     | Модель за замовчуванням `hexgrad/kokoro-82m`.                           |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY` (застарілі AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | HTTP API BytePlus Seed Speech.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                | Спільний провайдер зображень, відео та мовлення.                        |
| **xAI**           | `XAI_API_KEY`                                                                                                  | Batch TTS від xAI. Нативний voice-note Opus **не** підтримується.       |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                               | MiMo TTS через chat completions Xiaomi.                                 |

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний, а
інші стають резервними варіантами. Auto-summary використовує `summaryModel` (або
`agents.defaults.model.primary`), тож цей провайдер також має бути автентифікований,
якщо ви залишаєте summaries увімкненими.

<Warning>
Вбудований провайдер **Microsoft** використовує онлайн-сервіс neural TTS Microsoft Edge
через `node-edge-tts`. Це публічний вебсервіс без опублікованих
SLA або квот — вважайте його best-effort. Застарілий id провайдера `edge`
нормалізується до `microsoft`, а `openclaw doctor --fix` переписує збережену
конфігурацію; у нових конфігураціях завжди слід використовувати `microsoft`.
</Warning>

## Конфігурація

Конфігурація TTS розміщується в `messages.tts` у `~/.openclaw/openclaw.json`. Виберіть
пресет і адаптуйте блок провайдера:

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
          // Необов’язкові підказки стилю природною мовою:
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

Використовуйте `agents.list[].tts`, коли один агент має говорити з іншим провайдером,
голосом, моделлю, persona або режимом auto-TTS. Блок агента виконує глибоке злиття поверх
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

Щоб закріпити persona для окремого агента, задайте `agents.list[].tts.persona` разом із конфігурацією
провайдера — це перевизначає глобальне `messages.tts.persona` лише для цього агента.

Порядок пріоритету для автоматичних відповідей, `/tts audio`, `/tts status` і
інструмента агента `tts`:

1. `messages.tts`
2. активне `agents.list[].tts`
3. перевизначення каналу, коли канал підтримує `channels.<channel>.tts`
4. перевизначення облікового запису, коли канал передає `channels.<channel>.accounts.<id>.tts`
5. локальні параметри `/tts` для цього хоста
6. вбудовані директиви `[[tts:...]]`, коли [перевизначення моделей](#model-driven-directives) увімкнені

Перевизначення каналу й облікового запису використовують ту саму структуру, що й `messages.tts`, і
виконують глибоке злиття поверх попередніх рівнів, тож спільні облікові дані провайдера можуть залишатися в
`messages.tts`, а канал або обліковий запис бота змінює лише голос, модель, persona
або режим auto:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Персони

**Persona** — це стабільна голосова ідентичність, яку можна детерміновано
застосовувати між провайдерами. Вона може надавати перевагу одному провайдеру, визначати нейтральний до провайдера намір prompt
і містити специфічні для провайдера прив’язки для голосів, моделей, prompt-шаблонів,
seed і налаштувань голосу.

### Мінімальна persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
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

### Повна persona (нейтральний до провайдера prompt)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Сухуватий, теплий британський голос оповідача-дворецького.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Блискучий британський дворецький. Сухуватий, дотепний, теплий, чарівний, емоційно виразний, ніколи не безликий.",
            scene: "Тиха нічна бібліотека. Оповідь у ближній мікрофон для довіреного оператора.",
            sampleContext: "Мовець відповідає на приватний технічний запит коротко, впевнено й із сухуватою теплотою.",
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

1. локальна перевага `/tts persona <id>`, якщо задано.
2. `messages.tts.persona`, якщо задано.
3. Без persona.

Вибір провайдера працює за принципом explicit-first:

1. Прямі перевизначення (CLI, gateway, Talk, дозволені директиви TTS).
2. локальна перевага `/tts provider <id>`.
3. `provider` активної persona.
4. `messages.tts.provider`.
5. auto-select реєстру.

Для кожної спроби провайдера OpenClaw об’єднує конфігурації в такому порядку:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Довірені перевизначення запиту
4. Дозволені перевизначення згенерованих моделлю директив TTS

### Як провайдери використовують prompt-и persona

Поля prompt persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) є **нейтральними до провайдера**. Кожен провайдер сам вирішує,
як їх використовувати:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Обгортає поля prompt persona у структуру prompt Gemini TTS **лише тоді**,
    коли ефективна конфігурація провайдера Google задає `promptTemplate: "audio-profile-v1"`
    або `personaPrompt`. Старіші поля `audioProfile` і `speakerName`
    усе ще додаються на початок як текст prompt, специфічний для Google. Вбудовані аудіотеги, такі як
    `[whispers]` або `[laughs]` всередині блоку `[[tts:text]]`, зберігаються
    всередині транскрипту Gemini; OpenClaw не генерує ці теги.
  </Accordion>
  <Accordion title="OpenAI">
    Відображає поля prompt persona в поле запиту `instructions` **лише тоді**,
    коли не налаштовано явне `instructions` для OpenAI. Явне `instructions`
    завжди має пріоритет.
  </Accordion>
  <Accordion title="Інші провайдери">
    Використовують лише специфічні для провайдера прив’язки persona в
    `personas.<id>.providers.<provider>`. Поля prompt persona ігноруються,
    якщо провайдер не реалізує власне відображення prompt persona.
  </Accordion>
</AccordionGroup>

### Політика резервного переходу

`fallbackPolicy` керує поведінкою, коли persona **не має прив’язки** для
провайдера, який намагаються використати:

| Політика            | Поведінка                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **За замовчуванням.** Нейтральні до провайдера поля prompt залишаються доступними; провайдер може використовувати їх або ігнорувати.          |
| `provider-defaults` | Persona пропускається під час підготовки prompt для цієї спроби; провайдер використовує свої нейтральні значення за замовчуванням, тоді як резервний перехід до інших провайдерів триває. |
| `fail`              | Пропустити цю спробу провайдера з `reasonCode: "not_configured"` і `personaBinding: "missing"`. Резервні провайдери все одно будуть спробовані. |

Увесь запит TTS завершується невдачею лише тоді, коли **кожен** спробуваний провайдер пропущено
або він завершився невдачею.

## Директиви, керовані моделлю

За замовчуванням асистент **може** видавати директиви `[[tts:...]]` для перевизначення
голосу, моделі або швидкості для однієї відповіді, а також необов’язковий
блок `[[tts:text]]...[[/tts:text]]` для виразних підказок, які мають з’являтися
лише в аудіо:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Коли `messages.tts.auto` має значення `"tagged"`, **директиви обов’язкові** для запуску
аудіо. Під час потокової доставки блоків директиви видаляються з видимого тексту до того,
як канал його побачить, навіть якщо вони розбиті між сусідніми блоками.

`provider=...` ігнорується, якщо `modelOverrides.allowProvider: true` не задано. Коли
відповідь оголошує `provider=...`, інші ключі в цій директиві розбираються
лише цим провайдером; непідтримувані ключі видаляються і повідомляються як попередження
директив TTS.

**Доступні ключі директив:**

- `provider` (id зареєстрованого провайдера; потребує `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0–10)
- `pitch` (цілочисельний pitch MiniMax, від −12 до 12; дробові значення відкидаються)
- `emotion` (тег емоції Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Повністю вимкнути перевизначення моделей:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Дозволити перемикання провайдера, зберігаючи налаштовуваність інших параметрів:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-команди

Єдина команда `/tts`. У Discord OpenClaw також реєструє `/voice`, тому що
`/tts` є вбудованою командою Discord — текстове `/tts ...` усе одно працює.

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
Команди вимагають авторизованого відправника (діють правила allowlist/owner) і мають бути
увімкнені або `commands.text`, або реєстрація нативних команд.
</Note>

Примітки щодо поведінки:

- `/tts on` записує локальну перевагу TTS як `always`; `/tts off` записує її як `off`.
- `/tts chat on|off|default` записує перевизначення auto-TTS на рівні сесії для поточного чату.
- `/tts persona <id>` записує локальну перевагу persona; `/tts persona off` очищує її.
- `/tts latest` читає останню відповідь асистента з поточної транскрипції сесії і одноразово надсилає її як аудіо. Він зберігає лише hash цієї відповіді в записі сесії, щоб придушити дубльовані голосові надсилання.
- `/tts audio` генерує одноразову аудіовідповідь (**не** вмикає TTS).
- `limit` і `summary` зберігаються в **локальних prefs**, а не в основній конфігурації.
- `/tts status` включає діагностику резервних переходів для останньої спроби — `Fallback: <primary> -> <used>`, `Attempts: ...` і деталізацію для кожної спроби (`provider:outcome(reasonCode) latency`).
- `/status` показує активний режим TTS, а також налаштовані провайдер, модель, голос і очищені метадані користувацької кінцевої точки, коли TTS увімкнено.

## Налаштування окремого користувача

Slash-команди записують локальні перевизначення до `prefsPath`. За замовчуванням це
`~/.openclaw/settings/tts.json`; перевизначайте через env var `OPENCLAW_TTS_PREFS`
або `messages.tts.prefsPath`.

| Збережене поле | Ефект                                          |
| -------------- | ---------------------------------------------- |
| `auto`         | Локальне перевизначення auto-TTS (`always`, `off`, …) |
| `provider`     | Локальне перевизначення основного провайдера   |
| `persona`      | Локальне перевизначення persona                |
| `maxLength`    | Поріг summary (типово `1500` chars)            |
| `summarize`    | Перемикач summary (типово `true`)              |

Вони перевизначають ефективну конфігурацію з `messages.tts` плюс активний
блок `agents.list[].tts` для цього хоста.

## Формати виведення (фіксовані)

Доставка голосу TTS визначається можливостями каналу. Плагіни каналів оголошують,
чи має TTS у стилі voice запитувати у провайдерів нативну ціль `voice-note` чи
зберігати звичайний синтез `audio-file` і лише позначати сумісний вивід для
голосової доставки.

- **Канали з підтримкою voice-note**: для відповідей voice-note перевага надається Opus (`opus_48000_64` від ElevenLabs, `opus` від OpenAI).
  - 48kHz / 64kbps — хороший компроміс для голосових повідомлень.
- **Feishu / WhatsApp**: коли відповідь voice-note створюється як MP3/WebM/WAV/M4A
  або інший імовірний аудіофайл, плагін каналу транскодує її в 48kHz
  Ogg/Opus за допомогою `ffmpeg` перед надсиланням нативного голосового повідомлення. WhatsApp надсилає
  результат через payload `audio` Baileys з `ptt: true` і
  `audio/ogg; codecs=opus`. Якщо конвертація не вдається, Feishu отримує оригінальний
  файл як вкладення; надсилання WhatsApp завершується помилкою, а не публікує несумісний
  payload PTT.
- **BlueBubbles**: зберігає синтез провайдера на звичайному шляху `audio-file`; виходи MP3
  і CAF позначаються для доставки як голосове memo iMessage.
- **Інші канали**: MP3 (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI).
  - 44.1kHz / 128kbps — баланс за замовчуванням для чіткості мовлення.
- **MiniMax**: MP3 (модель `speech-2.8-hd`, частота дискретизації 32kHz) для звичайних аудіовкладень. Для цілей voice-note, оголошених каналом, OpenClaw транскодує MP3 MiniMax у 48kHz Opus за допомогою `ffmpeg` перед доставкою, коли канал оголошує підтримку транскодування.
- **Xiaomi MiMo**: MP3 за замовчуванням або WAV, якщо налаштовано. Для цілей voice-note, оголошених каналом, OpenClaw транскодує вихід Xiaomi у 48kHz Opus за допомогою `ffmpeg` перед доставкою, коли канал оголошує підтримку транскодування.
- **Local CLI**: використовує налаштований `outputFormat`. Цілі voice-note
  конвертуються в Ogg/Opus, а виведення для telephony — у raw 16 kHz mono PCM
  за допомогою `ffmpeg`.
- **Google Gemini**: Gemini API TTS повертає raw 24kHz PCM. OpenClaw обгортає його у WAV для аудіовкладень, транскодує в 48kHz Opus для цілей voice-note і повертає PCM безпосередньо для Talk/telephony.
- **Gradium**: WAV для аудіовкладень, Opus для цілей voice-note і `ulaw_8000` на 8 kHz для telephony.
- **Inworld**: MP3 для звичайних аудіовкладень, нативний `OGG_OPUS` для цілей voice-note і raw `PCM` на 22050 Hz для Talk/telephony.
- **xAI**: MP3 за замовчуванням; `responseFormat` може бути `mp3`, `wav`, `pcm`, `mulaw` або `alaw`. OpenClaw використовує batch REST endpoint TTS від xAI і повертає завершене аудіовкладення; streaming TTS WebSocket xAI не використовується цим шляхом провайдера. Нативний формат voice-note Opus цим шляхом не підтримується.
- **Microsoft**: використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`).
  - Вбудований транспорт приймає `outputFormat`, але не всі формати доступні в сервісі.
  - Значення формату виведення відповідають форматам виведення Microsoft Speech (зокрема Ogg/WebM Opus).
  - `sendVoice` у Telegram приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні
    гарантовані голосові повідомлення Opus.
  - Якщо налаштований формат виведення Microsoft не спрацьовує, OpenClaw повторює спробу з MP3.

Формати виведення OpenAI/ElevenLabs фіксовані для кожного каналу (див. вище).

## Поведінка Auto-TTS

Коли `messages.tts.auto` увімкнено, OpenClaw:

- Пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- Пропускає дуже короткі відповіді (менше 10 символів).
- Узагальнює довгі відповіді, коли summaries увімкнені, використовуючи
  `summaryModel` (або `agents.defaults.model.primary`).
- Додає згенероване аудіо до відповіді.
- У `mode: "final"` все одно надсилає TTS лише як аудіо для streamed final replies
  після завершення текстового потоку; згенероване медіа проходить ту саму нормалізацію медіа каналу, що й звичайні вкладення відповіді.

Якщо відповідь перевищує `maxLength`, а summary вимкнено (або немає API-ключа для
моделі summary), аудіо пропускається і надсилається звичайна текстова відповідь.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Формати виведення за каналами

| Ціль                                  | Формат                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Для відповідей voice-note перевага надається **Opus** (`opus_48000_64` від ElevenLabs, `opus` від OpenAI). 48 kHz / 64 kbps балансує чіткість і розмір. |
| Інші канали                           | **MP3** (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI). 44.1 kHz / 128 kbps — стандарт для мовлення.                                 |
| Talk / telephony                      | Нативний для провайдера **PCM** (Inworld 22050 Hz, Google 24 kHz) або `ulaw_8000` від Gradium для telephony.                             |

Примітки за провайдерами:

- **Транскодування Feishu / WhatsApp:** коли відповідь voice-note надходить як MP3/WebM/WAV/M4A, плагін каналу транскодує її в 48 kHz Ogg/Opus за допомогою `ffmpeg`. WhatsApp надсилає через Baileys з `ptt: true` і `audio/ogg; codecs=opus`. Якщо конвертація не вдається: Feishu повертається до вкладення оригінального файла; надсилання WhatsApp завершується помилкою, а не публікує несумісний payload PTT.
- **MiniMax / Xiaomi MiMo:** MP3 за замовчуванням (32 kHz для MiniMax `speech-2.8-hd`); транскодується в 48 kHz Opus для цілей voice-note через `ffmpeg`.
- **Local CLI:** використовує налаштований `outputFormat`. Цілі voice-note конвертуються в Ogg/Opus, а виведення для telephony — у raw 16 kHz mono PCM.
- **Google Gemini:** повертає raw 24 kHz PCM. OpenClaw обгортає його у WAV для вкладень, транскодує в 48 kHz Opus для цілей voice-note, повертає PCM безпосередньо для Talk/telephony.
- **Inworld:** MP3-вкладення, нативний `OGG_OPUS` voice-note, raw `PCM` 22050 Hz для Talk/telephony.
- **xAI:** MP3 за замовчуванням; `responseFormat` може бути `mp3|wav|pcm|mulaw|alaw`. Використовує batch REST endpoint xAI — streaming WebSocket TTS **не** використовується. Нативний формат voice-note Opus **не** підтримується.
- **Microsoft:** використовує `microsoft.outputFormat` (типово `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` у Telegram приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні гарантовані голосові повідомлення Opus. Якщо налаштований формат Microsoft не спрацьовує, OpenClaw повторює спробу з MP3.

Формати виведення OpenAI та ElevenLabs фіксовані для кожного каналу, як наведено вище.

## Довідник полів

<AccordionGroup>
  <Accordion title="Верхньорівневі messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Режим auto-TTS. `inbound` надсилає аудіо лише після вхідного голосового повідомлення; `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:...]]` або блок `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Застарілий перемикач. `openclaw doctor --fix` переносить його до `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` включає відповіді інструментів/блоків на додачу до фінальних відповідей.
    </ParamField>
    <ParamField path="provider" type="string">
      id speech-провайдера. Якщо не задано, OpenClaw використовує першого налаштованого провайдера в порядку auto-select реєстру. Застаріле `provider: "edge"` переписується на `"microsoft"` командою `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      id активної persona з `personas`. Нормалізується до нижнього регістру.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Стабільна голосова ідентичність. Поля: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Див. [Персони](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Дешева модель для auto-summary; за замовчуванням `agents.defaults.model.primary`. Приймає `provider/model` або налаштований псевдонім моделі.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Дозволяє моделі виводити директиви TTS. `enabled` за замовчуванням має значення `true`; `allowProvider` за замовчуванням має значення `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Налаштування, якими володіє провайдер, з ключем id speech-провайдера. Застарілі прямі блоки (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) переписуються командою `openclaw doctor --fix`; у commit додавайте лише `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Жорстке обмеження кількості символів для вхідного TTS. `/tts audio` завершується помилкою при перевищенні.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Тайм-аут запиту в мілісекундах.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Перевизначає локальний JSON-шлях prefs (provider/limit/summary). За замовчуванням `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Регіон Azure Speech (наприклад `eastus`). Env: `AZURE_SPEECH_REGION` або `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Необов’язкове перевизначення endpoint Azure Speech (псевдонім `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">Azure voice ShortName. За замовчуванням `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Код мови SSML. За замовчуванням `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` для стандартного аудіо. За замовчуванням `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` для виведення voice-note. За замовчуванням `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Повертається до `ELEVENLABS_API_KEY` або `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">id моделі (наприклад `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">id голосу ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (кожне `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = нормально).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Режим нормалізації тексту.</ParamField>
    <ParamField path="languageCode" type="string">2-літерний ISO 639-1 (наприклад `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ціле число `0..4294967295` для best-effort детермінованості.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначення базового URL API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Повертається до `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Якщо пропущено, TTS може повторно використати `models.providers.google.apiKey` до повернення до env.</ParamField>
    <ParamField path="model" type="string">Модель Gemini TTS. За замовчуванням `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Назва вбудованого голосу Gemini. За замовчуванням `Kore`. Псевдонім: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Підказка стилю природною мовою, що додається перед промовленим текстом.</ParamField>
    <ParamField path="speakerName" type="string">Необов’язкова мітка мовця, що додається перед промовленим текстом, коли ваш prompt використовує іменованого мовця.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Установіть `audio-profile-v1`, щоб обгорнути поля prompt активної persona в детерміновану структуру prompt Gemini TTS.</ParamField>
    <ParamField path="personaPrompt" type="string">Додатковий текст prompt persona, специфічний для Google, який додається до Director's Notes шаблону.</ParamField>
    <ParamField path="baseUrl" type="string">Приймається лише `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">За замовчуванням `inworld-tts-1.5-max`. Також: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Температура семплінгу `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Локальний виконуваний файл або рядок команди для CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Аргументи команди. Підтримує плейсхолдери `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Очікуваний формат виведення CLI. За замовчуванням `mp3` для аудіовкладень.</ParamField>
    <ParamField path="timeoutMs" type="number">Тайм-аут команди в мілісекундах. За замовчуванням `120000`.</ParamField>
    <ParamField path="cwd" type="string">Необов’язковий робочий каталог команди.</ParamField>
    <ParamField path="env" type="Record<string, string>">Необов’язкові перевизначення середовища для команди.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (без API-ключа)">
    <ParamField path="enabled" type="boolean" default="true">Дозволити використання мовлення Microsoft.</ParamField>
    <ParamField path="voice" type="string">Назва neural-голосу Microsoft (наприклад `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Код мови (наприклад `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Формат виведення Microsoft. За замовчуванням `audio-24khz-48kbitrate-mono-mp3`. Не всі формати підтримуються вбудованим транспортом на базі Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Рядки відсотків (наприклад `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Записувати JSON subtitles поруч з аудіофайлом.</ParamField>
    <ParamField path="proxy" type="string">URL proxy для запитів мовлення Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Перевизначення тайм-ауту запиту (мс).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Застарілий псевдонім. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію на `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Повертається до `MINIMAX_API_KEY`. Автентифікація Token Plan через `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` або `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. За замовчуванням `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. За замовчуванням `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Ціле число `-12..12`. За замовчуванням `0`. Дробові значення відкидаються перед запитом.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Повертається до `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">id моделі OpenAI TTS (наприклад `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Назва голосу (наприклад `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Явне поле OpenAI `instructions`. Коли задано, поля prompt persona **не** відображаються автоматично.</ParamField>
    <ParamField path="baseUrl" type="string">
      Перевизначає endpoint OpenAI TTS. Порядок визначення: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Значення, відмінні від стандартного, вважаються OpenAI-сумісними endpoint-ами TTS, тому дозволяються користувацькі назви моделей і голосів.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Може повторно використовувати `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://openrouter.ai/api/v1`. Застаріле `https://openrouter.ai/v1` нормалізується.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `hexgrad/kokoro-82m`. Псевдонім: `modelId`.</ParamField>
    <ParamField path="voice" type="string">За замовчуванням `af_alloy`. Псевдонім: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>За замовчуванням `mp3`.</ParamField>
    <ParamField path="speed" type="number">Нативне для провайдера перевизначення швидкості.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">За замовчуванням `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Використовуйте `seed-tts-2.0`, коли ваш проєкт має entitlement на TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Заголовок app key. За замовчуванням `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає HTTP endpoint TTS Seed Speech. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Тип голосу. За замовчуванням `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Нативне для провайдера співвідношення швидкості.</ParamField>
    <ParamField path="emotion" type="string">Нативний для провайдера тег емоції.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Застарілі поля Volcengine Speech Console. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (за замовчуванням `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `eve`. Live voices: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Код мови BCP-47 або `auto`. За замовчуванням `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>За замовчуванням `mp3`.</ParamField>
    <ParamField path="speed" type="number">Нативне для провайдера перевизначення швидкості.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Також підтримується `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">За замовчуванням `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>За замовчуванням `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Необов’язкова інструкція стилю природною мовою, що надсилається як повідомлення користувача; не озвучується.</ParamField>
  </Accordion>
</AccordionGroup>

## Інструмент агента

Інструмент `tts` перетворює текст на мовлення і повертає аудіовкладення для
доставки у відповіді. У Feishu, Matrix, Telegram і WhatsApp аудіо
доставляється як голосове повідомлення, а не як файлове вкладення. Feishu і
WhatsApp можуть транскодувати не-Opus виведення TTS на цьому шляху, коли `ffmpeg`
доступний.

WhatsApp надсилає аудіо через Baileys як голосову нотатку PTT (`audio` з
`ptt: true`) і надсилає видимий текст **окремо** від аудіо PTT, тому що
клієнти не завжди коректно відображають підписи до голосових нотаток.

Інструмент приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` — це
тайм-аут запиту до провайдера на рівні окремого виклику в мілісекундах.

## Gateway RPC

| Метод            | Призначення                              |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Прочитати поточний стан TTS і останню спробу. |
| `tts.enable`      | Установити локальну auto-перевагу в `always`. |
| `tts.disable`     | Установити локальну auto-перевагу в `off`. |
| `tts.convert`     | Одноразове перетворення text → audio.    |
| `tts.setProvider` | Установити локальну перевагу провайдера. |
| `tts.setPersona`  | Установити локальну перевагу persona.    |
| `tts.providers`   | Перелічити налаштованих провайдерів і їхній стан. |

## Посилання на сервіси

- [Посібник OpenAI з text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)
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
- [Формати виведення Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Пов’язане

- [Огляд медіа](/uk/tools/media-overview)
- [Генерація музики](/uk/tools/music-generation)
- [Генерація відео](/uk/tools/video-generation)
- [Slash-команди](/uk/tools/slash-commands)
- [Плагін голосових викликів](/uk/plugins/voice-call)
