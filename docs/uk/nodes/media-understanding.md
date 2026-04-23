---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідного аудіо/відео/зображень
summary: Необов’язкове розуміння вхідних зображень/аудіо/відео з резервними варіантами через провайдера + CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-23T23:01:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c8bcc8a997a96b0760a1f99d3b1d005328d5bebbb9b5bb815d4f76ab16ae7a2
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Розуміння медіа — вхідні дані (2026-01-17)

OpenClaw може **узагальнювати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично виявляє доступні локальні інструменти або ключі провайдерів і може бути вимкнений або налаштований. Якщо розуміння вимкнено, моделі, як і раніше, отримують оригінальні файли/URL.

Специфічна для постачальника поведінка медіа реєструється Plugin постачальників, а ядро OpenClaw відповідає за спільну конфігурацію `tools.media`, порядок резервного перемикання та інтеграцію з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо зводити вхідні медіа до короткого тексту для швидшої маршрутизації та кращого розбору команд.
- Завжди зберігати доставлення оригінального медіа до моделі.
- Підтримувати **API провайдерів** і **резервні варіанти CLI**.
- Дозволяти кілька моделей з упорядкованим резервним перемиканням (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

1. Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Для кожної ввімкненої capability (зображення/аудіо/відео) вибрати вкладення згідно з політикою (за замовчуванням: **перше**).
3. Вибрати перший придатний запис моделі (розмір + capability + auth).
4. Якщо модель завершується помилкою або медіа завелике, **перейти до наступного запису**.
5. У разі успіху:
   - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
   - Аудіо встановлює `{{Transcript}}`; для розбору команд використовується текст підпису, якщо він є, інакше — транскрипт.
   - Підписи зберігаються як `User text:` усередині блока.

Якщо розуміння завершується помилкою або вимкнене, **конвеєр відповіді продовжується** з оригінальним тілом і вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі**, а також перевизначення для окремих capability:

- `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - значення за замовчуванням (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
  - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
  - керування ехо транскрипту аудіо (`echoTranscript`, за замовчуванням `false`; `echoFormat`)
  - необов’язковий **список `models` для окремої capability** (має пріоритет перед спільними моделями)
  - політика `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (необов’язкове обмеження за channel/chatType/session key)
- `tools.media.concurrency`: максимальна кількість одночасних запусків capability (за замовчуванням **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Записи моделей

Кожен запис `models[]` може бути **provider** або **CLI**:

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

Шаблони CLI також можуть використовувати:

- `{{MediaDir}}` (каталог, що містить медіафайл)
- `{{OutputDir}}` (тимчасовий каталог, створений для цього запуску)
- `{{OutputBase}}` (базовий шлях тимчасового файла без розширення)

## Значення за замовчуванням і обмеження

Рекомендовані значення за замовчуванням:

- `maxChars`: **500** для зображень/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

Правила:

- Якщо медіа перевищує `maxBytes`, ця модель пропускається, і **пробується наступна модель**.
- Аудіофайли менше **1024 байтів** вважаються порожніми/пошкодженими та пропускаються до транскрибування провайдером/CLI.
- Якщо модель повертає більше ніж `maxChars`, результат обрізається.
- `prompt` за замовчуванням — просте «Describe the {media}.» плюс вказівка щодо `maxChars` (лише для зображень/відео).
- Якщо активна основна модель зображень уже нативно підтримує vision, OpenClaw
  пропускає блок підсумку `[Image]` і натомість передає в модель оригінальне зображення.
- Явні запити `openclaw infer image describe --model <provider/model>`
  відрізняються: вони безпосередньо запускають цього провайдера/цю модель із підтримкою зображень, зокрема
  посилання Ollama, як-от `ollama/qwen2.5vl:7b`.
- Якщо `<capability>.enabled: true`, але моделі не налаштовано, OpenClaw пробує
  **активну модель відповіді**, якщо її провайдер підтримує цю capability.

### Автовиявлення розуміння медіа (за замовчуванням)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не
налаштували моделі, OpenClaw автоматично виконує виявлення в такому порядку й **зупиняється на першому
робочому варіанті**:

1. **Активна модель відповіді**, якщо її провайдер підтримує цю capability.
2. **Основні/резервні посилання `agents.defaults.imageModel`** (лише для зображень).
3. **Локальні CLI** (лише для аудіо; якщо встановлено)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; автоматично завантажує моделі)
4. **Gemini CLI** (`gemini`) з використанням `read_many_files`
5. **Auth провайдера**
   - Налаштовані записи `models.providers.*`, що підтримують цю capability,
     пробуються раніше за вбудований резервний порядок.
   - Провайдери з конфігурації лише для зображень, які мають модель із підтримкою зображень, автоматично реєструються для
     розуміння медіа, навіть якщо вони не є вбудованим Plugin постачальника.
   - Розуміння зображень через Ollama доступне при явному виборі, наприклад через
     `agents.defaults.imageModel` або
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Вбудований резервний порядок:
     - Аудіо: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Відео: Google → Qwen → Moonshot

Щоб вимкнути автовиявлення, встановіть:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Примітка: виявлення бінарних файлів виконується в режимі best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом до команди.

### Підтримка proxy environment (моделі провайдерів)

Коли ввімкнено розуміння медіа **аудіо** і **відео** через провайдера, OpenClaw
підтримує стандартні proxy environment variables для вихідних HTTP-викликів провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо жодні proxy env vars не задано, для розуміння медіа використовується прямий вихід.
Якщо значення proxy некоректне, OpenClaw записує попередження в журнал і переходить до прямого
отримання.

## Capabilities (необов’язково)

Якщо ви задаєте `capabilities`, запис запускається лише для цих типів медіа. Для спільних
списків OpenClaw може вивести значення за замовчуванням:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Будь-який каталог `models.providers.<id>.models[]` із моделлю, що підтримує зображення:
  **image**

Для записів CLI **задавайте `capabilities` явно**, щоб уникнути неочікуваних збігів.
Якщо `capabilities` не задано, запис придатний для списку, у якому він розміщений.

## Матриця підтримки провайдерів (інтеграції OpenClaw)

| Capability | Інтеграція провайдера                                                                | Примітки                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Plugin постачальників реєструють підтримку зображень; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; config providers із підтримкою зображень реєструються автоматично. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                               | Транскрибування через провайдера (Whisper/Deepgram/Gemini/Voxtral).                                                                  |
| Video      | Google, Qwen, Moonshot                                                                | Розуміння відео через провайдера реалізується Plugin постачальників; розуміння відео Qwen використовує стандартні endpoint DashScope. |

Примітка про MiniMax:

- Розуміння зображень у `minimax` і `minimax-portal` походить від медіапровайдера `MiniMax-VL-01`, який належить Plugin.
- Вбудований текстовий каталог MiniMax все ще починається як суто текстовий; явні
  записи `models.providers.minimax` матеріалізують chat-посилання M2.7 з підтримкою зображень.

## Рекомендації щодо вибору моделей

- Віддавайте перевагу найсильнішій моделі останнього покоління, доступній для кожної capability медіа, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, які обробляють ненадійні входи, уникайте старих/слабших медіамоделей.
- Для доступності тримайте принаймні один резервний варіант для кожної capability (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка щодо `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не заданий); для форматів, відмінних від `txt`, резервно використовується розбір stdout.

## Політика вкладень

`attachments` для окремої capability визначає, які вкладення обробляються:

- `mode`: `first` (за замовчуванням) або `all`
- `maxAttachments`: обмежує кількість оброблюваних вкладень (за замовчуванням **1**)
- `prefer`: `first`, `last`, `path`, `url`

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

Поведінка вилучення з файлових вкладень:

- Вилучений текст файла обгортається як **ненадійний зовнішній вміст**, перш ніж
  буде доданий до медіапромпту.
- Вставлений блок використовує явні маркери меж, як-от
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих
  `Source: External`.
- Цей шлях вилучення вкладень навмисно пропускає довгий банер
  `SECURITY NOTICE:`, щоб не роздувати медіапромпт; маркери меж і метадані при цьому все одно зберігаються.
- Якщо файл не містить тексту, який можна вилучити, OpenClaw вставляє `[No extractable text]`.
- Якщо на цьому шляху PDF резервно перетворюється на зображення сторінок, медіапромпт зберігає
  заповнювач `[PDF content rendered to images; images not forwarded to model]`,
  оскільки цей крок вилучення вкладень передає текстові блоки, а не згенеровані зображення PDF.

## Приклади конфігурації

### 1) Спільний список моделей + перевизначення

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Лише аудіо + відео (зображення вимкнено)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Необов’язкове розуміння зображень

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Один мультимодальний запис (явні capabilities)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Вивід статусу

Коли виконується розуміння медіа, `/status` включає короткий підсумковий рядок:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Тут показано результати для кожної capability і вибраного провайдера/модель, коли це застосовно.

## Примітки

- Розуміння є **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнено.
- Використовуйте `scope`, щоб обмежити, де виконується розуміння (наприклад, лише DM).

## Пов’язана документація

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
