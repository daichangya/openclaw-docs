---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідного аудіо/відео/зображень
summary: Розуміння вхідних зображень/аудіо/відео (необов’язково) з резервними варіантами через провайдера та CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-05T18:09:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe36bd42250d48d12f4ff549e8644afa7be8e42ee51f8aff4f21f81b7ff060f4
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Розуміння медіа - вхідні дані (2026-01-17)

OpenClaw може **підсумовувати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі провайдерів, і може бути вимкнений або налаштований. Якщо розуміння вимкнено, моделі, як і раніше, отримують оригінальні файли/URL.

Поведінку медіа, специфічну для постачальника, реєструють плагіни постачальників, тоді як
core OpenClaw відповідає за спільну конфігурацію `tools.media`, порядок fallback і
інтеграцію з конвеєром відповідей.

## Цілі

- Необов’язково: попередньо стисло обробляти вхідні медіа в короткий текст для швидшої маршрутизації та кращого розбору команд.
- Завжди зберігати доставку оригінальних медіа до моделі.
- Підтримувати **API провайдерів** і **CLI fallback**.
- Дозволяти кілька моделей із впорядкованим fallback (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

1. Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Для кожної ввімкненої можливості (image/audio/video) вибрати вкладення згідно з політикою (типово: **перше**).
3. Вибрати перший придатний запис моделі (розмір + можливість + auth).
4. Якщо модель завершується помилкою або медіа надто велике, **перейти до наступного запису**.
5. У разі успіху:
   - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
   - Для аудіо задається `{{Transcript}}`; під час розбору команди використовується текст підпису, якщо він є,
     інакше — транскрипт.
   - Підписи зберігаються як `User text:` усередині блока.

Якщо розуміння завершується помилкою або вимкнено, **потік відповіді продовжується** з оригінальним body + вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** плюс перевизначення для кожної можливості:

- `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
  - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
  - керування echo для транскриптів аудіо (`echoTranscript`, типово `false`; `echoFormat`)
  - необов’язковий **список `models` для конкретної можливості** (має пріоритет перед спільними моделями)
  - політика `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (необов’язкове gating за channel/chatType/session key)
- `tools.media.concurrency`: максимальна кількість паралельних запусків можливостей (типово **2**).

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
  model: "gpt-5.4-mini",
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
- `{{OutputBase}}` (базовий шлях до тимчасового файла без розширення)

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для image/video (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - image: **10MB**
  - audio: **20MB**
  - video: **50MB**

Правила:

- Якщо медіа перевищує `maxBytes`, ця модель пропускається, і **пробується наступна модель**.
- Аудіофайли, менші за **1024 bytes**, вважаються порожніми/пошкодженими і пропускаються до транскрибування через provider/CLI.
- Якщо модель повертає більше ніж `maxChars`, результат обрізається.
- Для `prompt` типовим є просте “Describe the {media}.” плюс вказівка щодо `maxChars` (лише для image/video).
- Якщо активна основна image model уже нативно підтримує vision, OpenClaw
  пропускає блок підсумку `[Image]` і натомість передає
  оригінальне зображення в модель.
- Якщо `<capability>.enabled: true`, але моделі не налаштовано, OpenClaw пробує
  **активну модель відповіді**, якщо її провайдер підтримує цю можливість.

### Автовизначення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не
налаштували моделі, OpenClaw виконує автовизначення в такому порядку і **зупиняється на першому
працюючому варіанті**:

1. **Активна модель відповіді**, якщо її провайдер підтримує цю можливість.
2. **`agents.defaults.imageModel`** primary/fallback refs (лише для image).
3. **Локальні CLI** (лише для audio; якщо встановлено)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny model)
   - `whisper` (CLI Python; автоматично завантажує моделі)
4. **Gemini CLI** (`gemini`) з використанням `read_many_files`
5. **Автентифікація провайдера**
   - Налаштовані записи `models.providers.*`, що підтримують цю можливість,
     пробуються до вбудованого порядку fallback.
   - Провайдери конфігурації лише для image з image-capable model автоматично реєструються для
     розуміння медіа, навіть якщо вони не є вбудованим vendor plugin.
   - Вбудований порядок fallback:
     - Audio: OpenAI → Groq → Deepgram → Google → Mistral
     - Image: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Щоб вимкнути автовизначення, задайте:

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

Примітка: визначення бінарників виконується best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI model з повним шляхом до команди.

### Підтримка proxy environment (моделі провайдерів)

Коли ввімкнено розуміння медіа через провайдера для **audio** та **video**, OpenClaw
враховує стандартні змінні середовища вихідного проксі для HTTP-викликів провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо змінні середовища проксі не задано, розуміння медіа використовує прямий вихід.
Якщо значення проксі некоректне, OpenClaw записує попередження в журнал і повертається до прямого
отримання.

## Можливості (необов’язково)

Якщо ви задаєте `capabilities`, запис виконується лише для цих типів медіа. Для спільних
списків OpenClaw може вивести типові значення:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- Будь-який каталог `models.providers.<id>.models[]` з image-capable model:
  **image**

Для CLI-записів **задавайте `capabilities` явно**, щоб уникнути несподіваних збігів.
Якщо `capabilities` пропущено, запис придатний для списку, в якому він розміщений.

## Матриця підтримки провайдерів (інтеграції OpenClaw)

| Можливість | Інтеграція провайдера                                                                | Примітки                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Vendor plugins реєструють підтримку image; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; image-capable config providers реєструються автоматично. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                              | Транскрибування через провайдера (Whisper/Deepgram/Gemini/Voxtral).                                                                       |
| Video      | Google, Qwen, Moonshot                                                               | Розуміння video через vendor plugins; розуміння video у Qwen використовує стандартні ендпоїнти DashScope.                                |

Примітка щодо MiniMax:

- Розуміння image у `minimax` і `minimax-portal` походить із plugin-owned
  медіапровайдера `MiniMax-VL-01`.
- Вбудований текстовий каталог MiniMax як і раніше починається лише з тексту; явні
  записи `models.providers.minimax` матеріалізують image-capable M2.7 chat refs.

## Рекомендації щодо вибору моделі

- Надавайте перевагу найсильнішій доступній моделі останнього покоління для кожної медіаможливості, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, які працюють із недовіреним вводом, уникайте старіших/слабших медіамоделей.
- Тримайте принаймні один fallback для кожної можливості для доступності (якісна модель + швидша/дешевша модель).
- CLI fallback (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдерів недоступні.
- Примітка щодо `parakeet-mlx`: із `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не задано); формати, відмінні від `txt`, резервно використовують stdout.

## Політика вкладень

Параметр `attachments` для кожної можливості керує тим, які вкладення обробляються:

- `mode`: `first` (типово) або `all`
- `maxAttachments`: обмеження кількості оброблюваних вкладень (типово **1**)
- `prefer`: `first`, `last`, `path`, `url`

Коли `mode: "all"`, результати мають мітки `[Image 1/2]`, `[Audio 2/2]` тощо.

Поведінка витягування файлових вкладень:

- Витягнутий текст файлу обгортається як **недовірений зовнішній вміст** перед тим, як
  додається до медіапромпта.
- Вставлений блок використовує явні маркери меж на кшталт
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` і містить рядок метаданих
  `Source: External`.
- Цей шлях витягування вкладень навмисно не містить довгого банера
  `SECURITY NOTICE:`, щоб не роздувати медіапромпт; маркери меж
  і метадані все одно зберігаються.
- Якщо файл не містить тексту, який можна витягти, OpenClaw вставляє `[No extractable text]`.
- Якщо PDF у цьому шляху резервно переходить до рендерингу сторінок у зображення, медіапромпт зберігає
  заповнювач `[PDF content rendered to images; images not forwarded to model]`,
  оскільки цей крок витягування вкладень передає текстові блоки, а не відрендерені зображення PDF.

## Приклади конфігурації

### 1) Спільний список моделей + перевизначення

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
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

### 2) Лише Audio + Video (image вимкнено)

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

### 3) Необов’язкове розуміння image

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
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

### 4) Єдиний мультимодальний запис (явні capabilities)

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

Коли виконується розуміння медіа, `/status` містить короткий підсумковий рядок:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Він показує результат для кожної можливості та вибраний provider/model, якщо це застосовно.

## Примітки

- Розуміння — **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнено.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише в DM).

## Пов’язані документи

- [Конфігурація](/gateway/configuration)
- [Підтримка зображень і медіа](/nodes/images)
