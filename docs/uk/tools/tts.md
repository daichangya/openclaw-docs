---
read_when:
    - Увімкнення перетворення тексту на мовлення для відповідей
    - Налаштування провайдера TTS, ланцюжка резервного перемикання або персони
    - Використання команд або директив `/tts`
sidebarTitle: Text to speech (TTS)
summary: Перетворення тексту на мовлення для вихідних відповідей — провайдери, персони, слеш-команди та виведення для кожного каналу окремо
title: Перетворення тексту на мовлення
x-i18n:
    generated_at: "2026-04-26T05:15:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 501d719feaea7d72726b8eaa19f0b0942ccf68f82065912a59b50351ea4ffbb7
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw може перетворювати вихідні відповіді на аудіо через **13 провайдерів мовлення**  
і надсилати нативні голосові повідомлення у Feishu, Matrix, Telegram і WhatsApp,  
аудіовкладення всюди в інших місцях, а також потоки PCM/Ulaw для телефонії та Talk.

## Швидкий старт

<Steps>
  <Step title="Виберіть провайдера">
    OpenAI і ElevenLabs — найнадійніші розміщені варіанти. Microsoft і
    Local CLI працюють без API-ключа. Повний список дивіться в [матриці провайдерів](#supported-providers).
  </Step>
  <Step title="Установіть API-ключ">
    Експортуйте змінну середовища для вашого провайдера (наприклад `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Для Microsoft і Local CLI ключ не потрібен.
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
Auto-TTS **вимкнено** за замовчуванням. Коли `messages.tts.provider` не встановлено,
OpenClaw вибирає першого налаштованого провайдера в порядку авто-вибору реєстру.
</Note>

## Підтримувані провайдери

| Провайдер         | Автентифікація                                                                                                   | Примітки                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (також `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)        | Нативний вивід голосових нотаток Ogg/Opus і телефонія.                  |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` або `XI_API_KEY`                                                                            | Клонування голосу, багатомовність, детермінованість через `seed`.       |
| **Google Gemini** | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                                                                            | Gemini API TTS; підтримує персони через `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Вивід голосових нотаток і телефонії.                                    |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming TTS API. Нативні голосові нотатки Opus і телефонія PCM.       |
| **Local CLI**     | none                                                                                                             | Запускає налаштовану локальну команду TTS.                              |
| **Microsoft**     | none                                                                                                             | Публічний Edge neural TTS через `node-edge-tts`. Найкраще зусилля, без SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (або Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)   | API T2A v2. За замовчуванням `speech-2.8-hd`.                           |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Також використовується для авто-підсумку; підтримує `instructions` персони. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (може повторно використовувати `models.providers.openrouter.apiKey`)                       | Модель за замовчуванням `hexgrad/kokoro-82m`.                           |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY` (застарілі AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | HTTP API BytePlus Seed Speech.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Спільний провайдер зображень, відео та мовлення.                        |
| **xAI**           | `XAI_API_KEY`                                                                                                    | Пакетний TTS від xAI. Нативний голосовий формат Opus **не** підтримується. |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS через chat completions Xiaomi.                                 |

Якщо налаштовано кілька провайдерів, спочатку використовується вибраний, а
решта — це резервні варіанти. Авто-підсумок використовує `summaryModel` (або
`agents.defaults.model.primary`), тому цей провайдер теж має бути автентифікований,
якщо ви залишаєте підсумки увімкненими.

<Warning>
Вбудований провайдер **Microsoft** використовує онлайн-службу neural TTS Microsoft Edge
через `node-edge-tts`. Це публічна вебслужба без опублікованих
SLA чи квот — розглядайте її як best-effort. Застарілий ідентифікатор провайдера `edge`
нормалізується до `microsoft`, а `openclaw doctor --fix` переписує збережений
конфіг; у нових конфігураціях завжди слід використовувати `microsoft`.
</Warning>

## Конфігурація

Конфігурація TTS розміщується в `messages.tts` у `~/.openclaw/openclaw.json`. Виберіть
підготовлений варіант і адаптуйте блок провайдера:

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

Використовуйте `agents.list[].tts`, коли один агент має говорити через іншого провайдера,
голос, модель, персону або режим Auto-TTS. Блок агента виконує глибоке злиття поверх
`messages.tts`, тому облікові дані провайдера можна залишити в глобальній конфігурації провайдерів:

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

Щоб зафіксувати персону для окремого агента, установіть `agents.list[].tts.persona` поряд із конфігурацією
провайдера — вона перевизначає глобальне `messages.tts.persona` лише для цього агента.

Порядок пріоритету для автоматичних відповідей, `/tts audio`, `/tts status` і
інструмента агента `tts`:

1. `messages.tts`
2. активний `agents.list[].tts`
3. локальні параметри `/tts` для цього хоста
4. вбудовані директиви `[[tts:...]]`, коли [перевизначення моделі](#model-driven-directives) увімкнені

## Персони

**Персона** — це стабільна мовна ідентичність, яку можна детерміновано застосовувати
в різних провайдерів. Вона може віддавати перевагу одному провайдеру, визначати
незалежний від провайдера намір підказки та містити специфічні для провайдера прив’язки для голосів, моделей, шаблонів підказок, `seed` і налаштувань голосу.

### Мінімальна персона

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

### Повна персона (нейтральна до провайдера підказка)

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
            scene: "Тихий пізній нічний кабінет. Оповідь близько до мікрофона для довіреного оператора.",
            sampleContext: "Мовець відповідає на приватний технічний запит стисло, впевнено й із сухуватою теплотою.",
            style: "Вишуканий, стриманий, з ледь помітною іронією.",
            accent: "British English.",
            pacing: "Розмірений, із короткими драматичними паузами.",
            constraints: ["Не озвучувати значення конфігурації вголос.", "Не пояснювати персону."],
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

### Розв’язання персони

Активна персона вибирається детерміновано:

1. локальна перевага `/tts persona <id>`, якщо встановлено.
2. `messages.tts.persona`, якщо встановлено.
3. Без персони.

Вибір провайдера працює за принципом «явне — першим»:

1. Прямі перевизначення (CLI, Gateway, Talk, дозволені директиви TTS).
2. локальна перевага `/tts provider <id>`.
3. `provider` активної персони.
4. `messages.tts.provider`.
5. Автовибір реєстру.

Для кожної спроби з провайдером OpenClaw об’єднує конфігурації в такому порядку:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Довірені перевизначення запиту
4. Дозволені перевизначення TTS-директив, згенерованих моделлю

### Як провайдери використовують підказки персони

Поля підказки персони (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) є **нейтральними до провайдера**. Кожен провайдер сам вирішує,
як їх використовувати:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Обгортає поля підказки персони у структуру підказки Gemini TTS **лише коли**
    ефективна конфігурація провайдера Google встановлює `promptTemplate: "audio-profile-v1"`
    або `personaPrompt`. Старіші поля `audioProfile` і `speakerName`
    усе ще додаються на початок як текст підказки, специфічний для Google. Вбудовані аудіотеги, як-от
    `[whispers]` або `[laughs]` усередині блоку `[[tts:text]]`, зберігаються
    всередині транскрипту Gemini; OpenClaw не генерує ці теги.
  </Accordion>
  <Accordion title="OpenAI">
    Відображає поля підказки персони на поле запиту `instructions` **лише коли**
    не налаштовано явне `instructions` OpenAI. Явне `instructions`
    завжди має пріоритет.
  </Accordion>
  <Accordion title="Other providers">
    Використовують лише специфічні для провайдера прив’язки персони в
    `personas.<id>.providers.<provider>`. Поля підказки персони ігноруються,
    якщо провайдер не реалізує власне зіставлення підказки персони.
  </Accordion>
</AccordionGroup>

### Політика резервного перемикання

`fallbackPolicy` визначає поведінку, коли персона **не має прив’язки** для
поточного провайдера:

| Політика            | Поведінка                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **За замовчуванням.** Нейтральні до провайдера поля підказки залишаються доступними; провайдер може використовувати їх або ігнорувати.        |
| `provider-defaults` | Персону пропускають під час підготовки підказки для цієї спроби; провайдер використовує свої нейтральні значення за замовчуванням, поки триває резервне перемикання до інших провайдерів. |
| `fail`              | Пропустити цю спробу з провайдером із `reasonCode: "not_configured"` і `personaBinding: "missing"`. Резервні провайдери все одно буде випробувано. |

Увесь запит TTS завершується помилкою лише тоді, коли **кожного** із запланованих провайдерів пропущено
або він завершився помилкою.

## Директиви, керовані моделлю

За замовчуванням асистент **може** виводити директиви `[[tts:...]]` для перевизначення
голосу, моделі або швидкості для однієї відповіді, а також необов’язковий
блок `[[tts:text]]...[[/tts:text]]` для виразних підказок, які мають з’являтися
лише в аудіо:

```text
Ось, будь ласка.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](сміється) Прочитай пісню ще раз.[[/tts:text]]
```

Коли `messages.tts.auto` має значення `"tagged"`, **директиви обов’язкові** для запуску
аудіо. Потокова доставка блоків прибирає директиви з видимого тексту до того,
як канал їх побачить, навіть якщо вони розділені між сусідніми блоками.

`provider=...` ігнорується, якщо не встановлено `modelOverrides.allowProvider: true`. Коли
відповідь оголошує `provider=...`, інші ключі в цій директиві аналізуються
лише цим провайдером; непідтримувані ключі прибираються та повідомляються як
попередження директив TTS.

**Доступні ключі директив:**

- `provider` (ідентифікатор зареєстрованого провайдера; вимагає `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (гучність MiniMax, 0–10)
- `pitch` (цілочисельний `pitch` MiniMax, від −12 до 12; дробові значення обрізаються)
- `emotion` (тег емоції Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Повністю вимкнути перевизначення моделі:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Дозволити перемикання провайдера, залишивши інші параметри налаштовуваними:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Слеш-команди

Єдина команда `/tts`. У Discord OpenClaw також реєструє `/voice`, тому що
`/tts` — це вбудована команда Discord — текстова команда `/tts ...` усе одно працює.

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
Команди вимагають авторизованого відправника (діють правила allowlist/owner) і
має бути ввімкнено або `commands.text`, або реєстрацію нативних команд.
</Note>

Примітки щодо поведінки:

- `/tts on` записує локальну перевагу TTS як `always`; `/tts off` записує її як `off`.
- `/tts chat on|off|default` записує перевизначення Auto-TTS в межах сеансу для поточного чату.
- `/tts persona <id>` записує локальну перевагу персони; `/tts persona off` очищає її.
- `/tts latest` читає останню відповідь асистента з транскрипту поточного сеансу й одноразово надсилає її як аудіо. Він зберігає лише хеш цієї відповіді в записі сеансу, щоб запобігти дубльованим голосовим надсиланням.
- `/tts audio` генерує одноразову аудіовідповідь (це **не** вмикає TTS).
- `limit` і `summary` зберігаються в **локальних налаштуваннях**, а не в основному конфігу.
- `/tts status` містить діагностику резервного перемикання для останньої спроби — `Fallback: <primary> -> <used>`, `Attempts: ...` і деталі по кожній спробі (`provider:outcome(reasonCode) latency`).
- `/status` показує активний режим TTS, а також налаштовані провайдер, модель, голос і очищені метадані користувацької кінцевої точки, коли TTS увімкнено.

## Налаштування для окремого користувача

Слеш-команди записують локальні перевизначення в `prefsPath`. Значення за замовчуванням —
`~/.openclaw/settings/tts.json`; можна перевизначити через змінну середовища `OPENCLAW_TTS_PREFS`
або `messages.tts.prefsPath`.

| Збережене поле | Ефект                                         |
| -------------- | --------------------------------------------- |
| `auto`         | Локальне перевизначення Auto-TTS (`always`, `off`, …) |
| `provider`     | Локальне перевизначення основного провайдера  |
| `persona`      | Локальне перевизначення персони               |
| `maxLength`    | Поріг підсумку (за замовчуванням `1500` символів) |
| `summarize`    | Перемикач підсумку (за замовчуванням `true`)  |

Вони перевизначають ефективний конфіг із `messages.tts` разом з активним
блоком `agents.list[].tts` для цього хоста.

## Поведінка Auto-TTS

Коли `messages.tts.auto` увімкнено, OpenClaw:

- Пропускає TTS, якщо відповідь уже містить медіа або директиву `MEDIA:`.
- Пропускає дуже короткі відповіді (менше 10 символів).
- Створює підсумок довгих відповідей, якщо підсумки увімкнено, використовуючи
  `summaryModel` (або `agents.defaults.model.primary`).
- Прикріплює згенероване аудіо до відповіді.
- У `mode: "final"` усе одно надсилає TTS лише як аудіо для фінальних потокових відповідей
  після завершення текстового потоку; згенерований медіафайл проходить через ту саму
  нормалізацію медіа каналу, що й звичайні вкладення відповіді.

Якщо відповідь перевищує `maxLength`, а підсумок вимкнено (або немає API-ключа для
моделі підсумку), аудіо пропускається, і надсилається звичайна текстова відповідь.

```text
Відповідь -> TTS увімкнено?
  ні  -> надіслати текст
  так -> є медіа / MEDIA: / коротка?
          так -> надіслати текст
          ні  -> довжина > ліміт?
                   ні  -> TTS -> прикріпити аудіо
                   так -> підсумок увімкнено?
                            ні  -> надіслати текст
                            так -> підсумувати -> TTS -> прикріпити аудіо
```

## Формати виводу за каналами

| Ціль                                  | Формат                                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Голосові відповіді у форматі voice-note надають перевагу **Opus** (`opus_48000_64` від ElevenLabs, `opus` від OpenAI). 48 кГц / 64 кбіт/с забезпечують баланс чіткості та розміру. |
| Інші канали                           | **MP3** (`mp3_44100_128` від ElevenLabs, `mp3` від OpenAI). 44.1 кГц / 128 кбіт/с — стандарт за замовчуванням для мовлення.             |
| Talk / телефонія                      | Нативний для провайдера **PCM** (Inworld 22050 Гц, Google 24 кГц) або `ulaw_8000` від Gradium для телефонії.                            |

Примітки щодо окремих провайдерів:

  - **Транскодування Feishu / WhatsApp:** Коли відповідь у форматі voice-note надходить як MP3/WebM/WAV/M4A, плагін каналу транскодує її в 48 кГц Ogg/Opus через `ffmpeg`. WhatsApp надсилає через Baileys з `ptt: true` і `audio/ogg; codecs=opus`. Якщо перетворення не вдається: Feishu повертається до прикріплення оригінального файла; надсилання в WhatsApp завершується помилкою замість публікації несумісного PTT-пейлоада.
  - **MiniMax / Xiaomi MiMo:** MP3 за замовчуванням (32 кГц для MiniMax `speech-2.8-hd`); для цілей voice-note транскодується в 48 кГц Opus через `ffmpeg`.
  - **Local CLI:** Використовує налаштований `outputFormat`. Для цілей voice-note виконується перетворення в Ogg/Opus, а для виводу телефонії — у raw 16 кГц mono PCM.
  - **Google Gemini:** Повертає raw PCM 24 кГц. OpenClaw обгортає його як WAV для вкладень, транскодує в 48 кГц Opus для цілей voice-note, а для Talk/телефонії повертає PCM безпосередньо.
  - **Inworld:** Вкладення MP3, нативний `OGG_OPUS` для voice-note, raw `PCM` 22050 Гц для Talk/телефонії.
  - **xAI:** MP3 за замовчуванням; `responseFormat` може бути `mp3|wav|pcm|mulaw|alaw`. Використовує пакетну REST endpoint xAI — потоковий WebSocket TTS **не** використовується. Нативний формат voice-note Opus **не** підтримується.
  - **Microsoft:** Використовує `microsoft.outputFormat` (за замовчуванням `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` приймає OGG/MP3/M4A; використовуйте OpenAI/ElevenLabs, якщо вам потрібні гарантовані голосові повідомлення Opus. Якщо налаштований формат Microsoft не працює, OpenClaw повторює спробу з MP3.

  Формати виводу OpenAI та ElevenLabs фіксовані для кожного каналу, як зазначено вище.

  ## Довідник полів

  <AccordionGroup>
  <Accordion title="Верхньорівневі messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Режим Auto-TTS. `inbound` надсилає аудіо лише після вхідного голосового повідомлення; `tagged` надсилає аудіо лише тоді, коли відповідь містить директиви `[[tts:...]]` або блок `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Застарілий перемикач. `openclaw doctor --fix` переносить його до `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` включає відповіді інструментів/блоків на додачу до фінальних відповідей.
    </ParamField>
    <ParamField path="provider" type="string">
      Ідентифікатор провайдера мовлення. Якщо не встановлено, OpenClaw використовує першого налаштованого провайдера в порядку автовибору реєстру. Застаріле `provider: "edge"` переписується на `"microsoft"` командою `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Ідентифікатор активної персони з `personas`. Нормалізується до нижнього регістру.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Стабільна мовна ідентичність. Поля: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Див. [Персони](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Недорога модель для авто-підсумку; за замовчуванням `agents.defaults.model.primary`. Приймає `provider/model` або налаштований псевдонім моделі.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Дозволяє моделі виводити TTS-директиви. `enabled` за замовчуванням `true`; `allowProvider` за замовчуванням `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Налаштування провайдера, згруповані за ідентифікатором провайдера мовлення. Застарілі прямі блоки (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) переписуються командою `openclaw doctor --fix`; комітьте лише `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Жорстке обмеження на кількість символів у вхідному TTS-тексті. Якщо перевищено, `/tts audio` завершується помилкою.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Тайм-аут запиту в мілісекундах.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Перевизначає шлях до локального JSON із налаштуваннями (provider/limit/summary). За замовчуванням `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Регіон Azure Speech (наприклад, `eastus`). Env: `AZURE_SPEECH_REGION` або `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Необов’язкове перевизначення endpoint Azure Speech (псевдонім `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">Azure voice ShortName. За замовчуванням `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Код мови SSML. За замовчуванням `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` для стандартного аудіо. За замовчуванням `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` для виводу voice-note. За замовчуванням `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Використовує як резерв `ELEVENLABS_API_KEY` або `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі (наприклад, `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">Ідентифікатор голосу ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (кожен `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = звичайна швидкість).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Режим нормалізації тексту.</ParamField>
    <ParamField path="languageCode" type="string">2-літерний ISO 639-1 (наприклад, `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ціле число `0..4294967295` для best-effort детермінованості.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає базовий URL API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Використовує як резерв `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Якщо не вказано, TTS може повторно використовувати `models.providers.google.apiKey` перед резервним переходом до env.</ParamField>
    <ParamField path="model" type="string">Модель Gemini TTS. За замовчуванням `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Назва вбудованого голосу Gemini. За замовчуванням `Kore`. Псевдонім: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Підказка стилю природною мовою, що додається перед озвучуваним текстом.</ParamField>
    <ParamField path="speakerName" type="string">Необов’язкова мітка мовця, що додається перед озвучуваним текстом, коли ваша підказка використовує іменованого мовця.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Установіть `audio-profile-v1`, щоб обгорнути поля підказки активної персони у детерміновану структуру підказки Gemini TTS.</ParamField>
    <ParamField path="personaPrompt" type="string">Додатковий текст підказки персони, специфічний для Google, що додається до Director's Notes шаблону.</ParamField>
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
    <ParamField path="temperature" type="number">Температура семплювання `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Локальний виконуваний файл або рядок команди для CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Аргументи команди. Підтримує заповнювачі `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Очікуваний формат виводу CLI. За замовчуванням `mp3` для аудіовкладень.</ParamField>
    <ParamField path="timeoutMs" type="number">Тайм-аут команди в мілісекундах. За замовчуванням `120000`.</ParamField>
    <ParamField path="cwd" type="string">Необов’язковий робочий каталог команди.</ParamField>
    <ParamField path="env" type="Record<string, string>">Необов’язкові перевизначення середовища для команди.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (без API-ключа)">
    <ParamField path="enabled" type="boolean" default="true">Дозволити використання мовлення Microsoft.</ParamField>
    <ParamField path="voice" type="string">Назва neural voice Microsoft (наприклад, `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Код мови (наприклад, `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Формат виводу Microsoft. За замовчуванням `audio-24khz-48kbitrate-mono-mp3`. Не всі формати підтримуються вбудованим транспортом на базі Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Рядки відсотків (наприклад, `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Записує JSON-субтитри поряд з аудіофайлом.</ParamField>
    <ParamField path="proxy" type="string">URL проксі для запитів мовлення Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Перевизначення тайм-ауту запиту (мс).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Застарілий псевдонім. Запустіть `openclaw doctor --fix`, щоб переписати збережений конфіг до `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Використовує як резерв `MINIMAX_API_KEY`. Автентифікація Token Plan через `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` або `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. За замовчуванням `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. За замовчуванням `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Ціле число `-12..12`. За замовчуванням `0`. Дробові значення обрізаються перед запитом.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Використовує як резерв `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Ідентифікатор моделі OpenAI TTS (наприклад, `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Назва голосу (наприклад, `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Явне поле OpenAI `instructions`. Якщо встановлено, поля підказки персони **не** зіставляються автоматично.</ParamField>
    <ParamField path="baseUrl" type="string">
      Перевизначає endpoint OpenAI TTS. Порядок розв’язання: конфіг → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Нестандартні значення розглядаються як OpenAI-сумісні TTS endpoint, тому допускаються власні назви моделей і голосів.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Може повторно використовувати `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://openrouter.ai/api/v1`. Застаріле `https://openrouter.ai/v1` нормалізується.</ParamField>
    <ParamField path="model" type="string">За замовчуванням `hexgrad/kokoro-82m`. Псевдонім: `modelId`.</ParamField>
    <ParamField path="voice" type="string">За замовчуванням `af_alloy`. Псевдонім: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>За замовчуванням `mp3`.</ParamField>
    <ParamField path="speed" type="number">Перевизначення швидкості, нативне для провайдера.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">За замовчуванням `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Використовуйте `seed-tts-2.0`, якщо ваш проєкт має entitlement TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Заголовок ключа застосунку. За замовчуванням `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Перевизначає HTTP endpoint Seed Speech TTS. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Тип голосу. За замовчуванням `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Коефіцієнт швидкості, нативний для провайдера.</ParamField>
    <ParamField path="emotion" type="string">Тег емоції, нативний для провайдера.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Застарілі поля Volcengine Speech Console. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (за замовчуванням `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">За замовчуванням `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">За замовчуванням `eve`. Доступні live-голоси: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Код мови BCP-47 або `auto`. За замовчуванням `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>За замовчуванням `mp3`.</ParamField>
    <ParamField path="speed" type="number">Перевизначення швидкості, нативне для провайдера.</ParamField>
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

Інструмент `tts` перетворює текст на мовлення й повертає аудіовкладення для
доставки у відповіді. У Feishu, Matrix, Telegram і WhatsApp аудіо
доставляється як голосове повідомлення, а не як файлове вкладення. Feishu і
WhatsApp можуть транскодувати вихід TTS, відмінний від Opus, у цьому шляху, якщо доступний `ffmpeg`.

WhatsApp надсилає аудіо через Baileys як голосову нотатку PTT (`audio` з
`ptt: true`) і надсилає видимий текст **окремо** від аудіо PTT, оскільки
клієнти не завжди коректно відображають підписи до голосових нотаток.

Інструмент приймає необов’язкові поля `channel` і `timeoutMs`; `timeoutMs` —
це тайм-аут запиту до провайдера для окремого виклику в мілісекундах.

## Gateway RPC

| Метод             | Призначення                               |
| ----------------- | ----------------------------------------- |
| `tts.status`      | Прочитати поточний стан TTS і останню спробу. |
| `tts.enable`      | Установити локальну перевагу auto на `always`. |
| `tts.disable`     | Установити локальну перевагу auto на `off`. |
| `tts.convert`     | Одноразове перетворення текст → аудіо.    |
| `tts.setProvider` | Установити локальну перевагу провайдера.  |
| `tts.setPersona`  | Установити локальну перевагу персони.     |
| `tts.providers`   | Показати список налаштованих провайдерів і їхній стан. |

## Посилання на сервіси

- [Керівництво OpenAI з перетворення тексту на мовлення](https://platform.openai.com/docs/guides/text-to-speech)
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
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Пов’язане

- [Огляд медіа](/uk/tools/media-overview)
- [Генерація музики](/uk/tools/music-generation)
- [Генерація відео](/uk/tools/video-generation)
- [Слеш-команди](/uk/tools/slash-commands)
- [Плагін голосових викликів](/uk/plugins/voice-call)
