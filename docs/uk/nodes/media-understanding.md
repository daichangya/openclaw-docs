---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідного аудіо/відео/зображень
summary: Розуміння вхідних зображень/аудіо/відео (необов’язково) з резервними варіантами через провайдера та CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-23T19:25:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e89b0db8cc4a53270492ce5dfa1bb0a0d0f2dec7f4900ea9984bf98bbbc189
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Розуміння медіа - Вхідні дані (2026-01-17)

OpenClaw може **узагальнювати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі провайдера, і може бути вимкнений або налаштований. Якщо розуміння вимкнене, моделі, як і раніше, отримують оригінальні файли/URL-адреси.

Специфічна для вендора поведінка медіа реєструється Plugin вендора, тоді як ядро OpenClaw
володіє спільною конфігурацією `tools.media`, порядком резервних варіантів і інтеграцією
в конвеєр відповіді.

## Цілі

- Необов’язково: попередньо узагальнювати вхідні медіа в короткий текст для швидшої маршрутизації та кращого розбору команд.
- Завжди зберігати передавання оригінальних медіа моделі.
- Підтримувати **API провайдерів** і **резервні варіанти CLI**.
- Дозволяти кілька моделей з упорядкованим резервуванням (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

1. Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення згідно з політикою (типово: **перше**).
3. Вибрати перший придатний запис моделі (розмір + можливість + автентифікація).
4. Якщо модель завершується помилкою або медіа завелике, **перейти до наступного запису**.
5. У разі успіху:
   - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
   - Для аудіо встановлюється `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є,
     інакше — транскрипт.
   - Підписи зберігаються як `User text:` усередині блоку.

Якщо розуміння не вдалося або воно вимкнене, **потік відповіді триває** з початковим body і вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі**, а також перевизначення для кожної можливості:

- `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - перевизначення провайдера (`baseUrl`, `headers`, `providerOptions`)
  - параметри аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
  - елементи керування відлунням аудіотранскрипту (`echoTranscript`, типово `false`; `echoFormat`)
  - необов’язковий список **`models` для кожної можливості** (має пріоритет перед спільними моделями)
  - політика `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (необов’язкове обмеження за каналом/chatType/ключем сесії)
- `tools.media.concurrency`: максимальна кількість одночасних запусків можливостей (типово **2**).

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
- `{{OutputDir}}` (робочий каталог, створений для цього запуску)
- `{{OutputBase}}` (базовий шлях до робочого файла, без розширення)

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображень/відео (коротко, зручно для команд)
- `maxChars`: **не задано** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

Правила:

- Якщо медіа перевищує `maxBytes`, ця модель пропускається і **пробується наступна модель**.
- Аудіофайли менші за **1024 bytes** вважаються порожніми/пошкодженими і пропускаються до транскрипції через provider/CLI.
- Якщо модель повертає більше ніж `maxChars`, вивід обрізається.
- Типове значення `prompt` — просте “Describe the {media}.” плюс вказівка щодо `maxChars` (лише для зображень/відео).
- Якщо активна основна модель зображень уже нативно підтримує vision, OpenClaw
  пропускає блок підсумку `[Image]` і натомість передає оригінальне зображення
  у модель.
- Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають безпосередньо цей provider/model з підтримкою зображень, включно з посиланнями Ollama, такими як `ollama/qwen2.5vl:7b`.
- Якщо `<capability>.enabled: true`, але моделі не налаштовані, OpenClaw пробує
  **активну модель відповіді**, якщо її провайдер підтримує цю можливість.

### Автовизначення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false`, і ви не
налаштували моделі, OpenClaw автоматично визначає в такому порядку і **зупиняється на першому
працюючому варіанті**:

1. **Активна модель відповіді**, якщо її провайдер підтримує цю можливість.
2. Основні/резервні посилання **`agents.defaults.imageModel`** (лише зображення).
3. **Локальні CLI** (лише аудіо; якщо встановлено)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; автоматично завантажує моделі)
4. **Gemini CLI** (`gemini`) з використанням `read_many_files`
5. **Автентифікація провайдера**
   - Налаштовані записи `models.providers.*`, які підтримують цю можливість,
     пробуються до вбудованого порядку резервування.
   - Провайдери конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для розуміння медіа, навіть якщо вони не є Plugin вендора з комплекту.
   - Розуміння зображень Ollama доступне за явного вибору, наприклад через `agents.defaults.imageModel` або
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Вбудований порядок резервування:
     - Аудіо: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Відео: Google → Qwen → Moonshot

Щоб вимкнути автовизначення, установіть:

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

Примітка: визначення бінарних файлів виконується в режимі best-effort у macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну CLI-модель із повним шляхом до команди.

### Підтримка проксі-середовища (моделі провайдерів)

Коли ввімкнено розуміння медіа **audio** і **video** на основі провайдера, OpenClaw
дотримується стандартних змінних середовища вихідного проксі для HTTP-викликів провайдера:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо жодні змінні середовища проксі не встановлено, розуміння медіа використовує прямий вихідний доступ.
Якщо значення проксі некоректно сформоване, OpenClaw записує попередження в лог і повертається до прямого
отримання.

## Можливості (необов’язково)

Якщо ви задаєте `capabilities`, запис запускається лише для цих типів медіа. Для спільних
списків OpenClaw може виводити типові значення:

- `openai`, `anthropic`, `minimax`: **зображення**
- `minimax-portal`: **зображення**
- `moonshot`: **зображення + відео**
- `openrouter`: **зображення**
- `google` (Gemini API): **зображення + аудіо + відео**
- `qwen`: **зображення + відео**
- `mistral`: **аудіо**
- `zai`: **зображення**
- `groq`: **аудіо**
- `xai`: **аудіо**
- `deepgram`: **аудіо**
- Будь-який каталог `models.providers.<id>.models[]` із моделлю, що підтримує зображення:
  **зображення**

Для записів CLI **задавайте `capabilities` явно**, щоб уникнути неочікуваних збігів.
Якщо ви не задасте `capabilities`, запис вважатиметься придатним для списку, у якому він розміщений.

## Матриця підтримки провайдерів (інтеграції OpenClaw)

| Capability | Інтеграція провайдера                                                                | Примітки                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Plugin вендора реєструють підтримку зображень; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; config providers із підтримкою зображень реєструються автоматично. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                               | Транскрипція провайдера (Whisper/Deepgram/Gemini/Voxtral).                                                                               |
| Video      | Google, Qwen, Moonshot                                                                | Розуміння відео провайдера через Plugin вендора; розуміння відео Qwen використовує стандартні ендпоїнти DashScope.                     |

Примітка щодо MiniMax:

- Розуміння зображень `minimax` і `minimax-portal` забезпечується Plugin-провайдером медіа
  `MiniMax-VL-01`.
- Вбудований текстовий каталог MiniMax усе ще починається з лише текстових моделей; явні
  записи `models.providers.minimax` матеріалізують чат-посилання M2.7 з підтримкою зображень.

## Рекомендації щодо вибору моделей

- Віддавайте перевагу найсильнішій моделі останнього покоління, доступній для кожної можливості медіа, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, що обробляють недовірені вхідні дані, уникайте старіших/слабших медіамоделей.
- Тримайте принаймні один резервний варіант для кожної можливості для доступності (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API провайдера недоступні.
- Примітка щодо `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не заданий); формати, відмінні від `txt`, повертаються до stdout.

## Політика вкладень

`attachments` для кожної можливості керує тим, які вкладення обробляються:

- `mode`: `first` (типово) або `all`
- `maxAttachments`: максимальна кількість для обробки (типово **1**)
- `prefer`: `first`, `last`, `path`, `url`

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

Поведінка вилучення файлових вкладень:

- Вилучений текст файлу обгортається як **недовірений зовнішній вміст** перед
  додаванням до prompt медіа.
- Впроваджений блок використовує явні маркери меж, такі як
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих
  `Source: External`.
- Цей шлях вилучення вкладень навмисно пропускає довгий банер
  `SECURITY NOTICE:`, щоб не роздувати prompt медіа; маркери меж
  і метадані все одно зберігаються.
- Якщо файл не має тексту, який можна вилучити, OpenClaw впроваджує `[No extractable text]`.
- Якщо PDF на цьому шляху переходить до зображень сторінок, отриманих рендерингом, prompt медіа зберігає
  заповнювач `[PDF content rendered to images; images not forwarded to model]`,
  оскільки цей етап вилучення вкладень передає текстові блоки, а не відрендерені зображення PDF.

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

## Вивід стану

Коли запускається розуміння медіа, `/status` містить короткий рядок зведення:

```
📎 Media: image ok (openai/gpt-5.5) · audio skipped (maxBytes)
```

Це показує результати для кожної можливості та вибраний provider/model, якщо це застосовно.

## Примітки

- Розуміння працює в режимі **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть коли розуміння вимкнене.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише в DM).

## Пов’язана документація

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
