---
read_when:
    - Проєктування або рефакторинг розуміння медіа
    - Налаштування попередньої обробки вхідних аудіо/відео/зображень
summary: Вхідне розуміння зображень/аудіо/відео (необов’язково) з резервними варіантами provider + CLI
title: Розуміння медіа
x-i18n:
    generated_at: "2026-04-24T00:54:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 944d8f646a4584ec90495cccd1ecfd69374eb5cc99865cbcccf61e7e7308c35f
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Розуміння медіа — вхідні дані (2026-01-17)

OpenClaw може **підсумовувати вхідні медіа** (зображення/аудіо/відео) до запуску конвеєра відповіді. Він автоматично визначає, коли доступні локальні інструменти або ключі provider, і може бути вимкнений або налаштований. Якщо розуміння вимкнене, моделі все одно отримують оригінальні файли/URL-адреси як зазвичай.

Специфічна для постачальника поведінка медіа реєструється vendor Plugin, тоді як ядро OpenClaw
керує спільною конфігурацією `tools.media`, порядком резервного переходу та інтеграцією
з конвеєром відповіді.

## Цілі

- Необов’язково: попередньо зводити вхідні медіа до короткого тексту для швидшої маршрутизації та кращого розбору команд.
- Завжди зберігати доставку оригінальних медіа до моделі.
- Підтримувати **API provider** і **резервні варіанти CLI**.
- Дозволяти кілька моделей з упорядкованим резервним переходом (помилка/розмір/тайм-аут).

## Поведінка на високому рівні

1. Зібрати вхідні вкладення (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Для кожної ввімкненої можливості (зображення/аудіо/відео) вибрати вкладення згідно з політикою (типово: **перше**).
3. Вибрати перший придатний запис моделі (розмір + можливість + автентифікація).
4. Якщо модель не спрацює або медіа завелике, **перейти до наступного запису**.
5. У разі успіху:
   - `Body` стає блоком `[Image]`, `[Audio]` або `[Video]`.
   - Для аудіо встановлюється `{{Transcript}}`; розбір команд використовує текст підпису, якщо він є,
     інакше — транскрипт.
   - Підписи зберігаються як `User text:` усередині блоку.

Якщо розуміння не вдається або його вимкнено, **потік відповіді продовжується** з оригінальним тілом + вкладеннями.

## Огляд конфігурації

`tools.media` підтримує **спільні моделі** плюс перевизначення для окремих можливостей:

- `tools.media.models`: спільний список моделей (використовуйте `capabilities` для обмеження).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - типові значення (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - перевизначення provider (`baseUrl`, `headers`, `providerOptions`)
  - опції аудіо Deepgram через `tools.media.audio.providerOptions.deepgram`
  - керування відлунням транскрипту аудіо (`echoTranscript`, типово `false`; `echoFormat`)
  - необов’язковий список `models` **для окремої можливості** (має пріоритет над спільними моделями)
  - політика `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (необов’язкове обмеження за channel/chatType/ключем сесії)
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
- `{{OutputDir}}` (тимчасовий каталог, створений для цього запуску)
- `{{OutputBase}}` (базовий шлях тимчасового файла, без розширення)

## Типові значення та обмеження

Рекомендовані типові значення:

- `maxChars`: **500** для зображення/відео (коротко, зручно для команд)
- `maxChars`: **не встановлено** для аудіо (повний транскрипт, якщо ви не встановите обмеження)
- `maxBytes`:
  - зображення: **10MB**
  - аудіо: **20MB**
  - відео: **50MB**

Правила:

- Якщо медіа перевищує `maxBytes`, цю модель буде пропущено, і **буде випробувано наступну модель**.
- Аудіофайли менші за **1024 байти** вважаються порожніми/пошкодженими й пропускаються до транскрибування через provider/CLI.
- Якщо модель повертає більше ніж `maxChars`, вивід обрізається.
- Для `prompt` типовим є просте “Describe the {media}.” плюс вказівка щодо `maxChars` (лише для зображення/відео).
- Якщо активна основна модель для зображень уже нативно підтримує vision, OpenClaw
  пропускає блок підсумку `[Image]` і натомість передає оригінальне зображення
  до моделі.
- Явні запити `openclaw infer image describe --model <provider/model>` відрізняються: вони запускають указані provider/модель із підтримкою зображень напряму, зокрема
  посилання Ollama, такі як `ollama/qwen2.5vl:7b`.
- Якщо `<capability>.enabled: true`, але моделі не налаштовано, OpenClaw пробує
  **активну модель відповіді**, якщо її provider підтримує цю можливість.

### Автовиявлення розуміння медіа (типово)

Якщо `tools.media.<capability>.enabled` **не** встановлено в `false` і ви не
налаштували моделі, OpenClaw виконує автовиявлення в такому порядку й **зупиняється на першому
робочому варіанті**:

1. **Активна модель відповіді**, якщо її provider підтримує цю можливість.
2. Основні/резервні посилання **`agents.defaults.imageModel`** (лише зображення).
3. **Локальні CLI** (лише аудіо; якщо встановлено)
   - `sherpa-onnx-offline` (потребує `SHERPA_ONNX_MODEL_DIR` з encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; використовує `WHISPER_CPP_MODEL` або вбудовану tiny-модель)
   - `whisper` (Python CLI; автоматично завантажує моделі)
4. **Gemini CLI** (`gemini`) з використанням `read_many_files`
5. **Автентифікація provider**
   - Налаштовані записи `models.providers.*`, які підтримують можливість,
     випробовуються до вбудованого порядку резервного переходу.
   - Provider із конфігурації лише для зображень із моделлю, що підтримує зображення, автоматично реєструються для
     розуміння медіа, навіть якщо вони не є вбудованими vendor Plugin.
   - Розуміння зображень Ollama доступне за явного вибору, наприклад через
     `agents.defaults.imageModel` або
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Вбудований порядок резервного переходу:
     - Аудіо: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Зображення: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Відео: Google → Qwen → Moonshot

Щоб вимкнути автовиявлення, установіть:

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

Примітка: виявлення бінарних файлів є best-effort на macOS/Linux/Windows; переконайтеся, що CLI є в `PATH` (ми розгортаємо `~`), або задайте явну модель CLI з повним шляхом до команди.

### Підтримка проксі-середовища (моделі provider)

Коли ввімкнене розуміння медіа на основі provider для **аудіо** та **відео**, OpenClaw
враховує стандартні змінні середовища вихідного проксі для HTTP-викликів provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Якщо змінні середовища проксі не встановлені, розуміння медіа використовує прямий вихід.
Якщо значення проксі має неправильний формат, OpenClaw записує попередження в журнал і повертається до прямого
отримання.

## Можливості (необов’язково)

Якщо ви встановлюєте `capabilities`, запис виконується лише для цих типів медіа. Для спільних
списків OpenClaw може вивести типові значення:

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
- Будь-який каталог `models.providers.<id>.models[]` з моделлю, що підтримує зображення:
  **зображення**

Для записів CLI **установлюйте `capabilities` явно**, щоб уникнути неочікуваних збігів.
Якщо ви не вкажете `capabilities`, запис придатний для списку, у якому він знаходиться.

## Матриця підтримки provider (інтеграції OpenClaw)

| Можливість | Інтеграція provider                                                                                                         | Примітки                                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Зображення | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Vendor Plugin реєструють підтримку зображень; `openai-codex/*` використовує механізми OAuth provider; `codex/*` використовує обмежений хід Codex app-server; MiniMax і MiniMax OAuth обидва використовують `MiniMax-VL-01`; provider із конфігурації з підтримкою зображень реєструються автоматично. |
| Аудіо      | OpenAI, Groq, Deepgram, Google, Mistral                                                                                      | Транскрибування provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                          |
| Відео      | Google, Qwen, Moonshot                                                                                                       | Розуміння відео через provider реалізується через vendor Plugin; розуміння відео Qwen використовує стандартні кінцеві точки DashScope.                                                                                             |

Примітка щодо MiniMax:

- Розуміння зображень `minimax` і `minimax-portal` походить від Plugin-власного
  provider медіа `MiniMax-VL-01`.
- Вбудований текстовий каталог MiniMax усе ще починається як лише текстовий; явні
  записи `models.providers.minimax` матеріалізують посилання M2.7 chat з підтримкою зображень.

## Вказівки щодо вибору моделей

- Надавайте перевагу найсильнішій моделі останнього покоління, доступній для кожної медіа-можливості, коли важливі якість і безпека.
- Для агентів з увімкненими інструментами, які працюють з недовіреними вхідними даними, уникайте старіших/слабших медіа-моделей.
- Залишайте щонайменше один резервний варіант для кожної можливості задля доступності (якісна модель + швидша/дешевша модель).
- Резервні варіанти CLI (`whisper-cli`, `whisper`, `gemini`) корисні, коли API provider недоступні.
- Примітка щодо `parakeet-mlx`: з `--output-dir` OpenClaw читає `<output-dir>/<media-basename>.txt`, коли формат виводу — `txt` (або не вказаний); для форматів, відмінних від `txt`, використовується stdout.

## Політика вкладень

`attachments` для окремої можливості керує тим, які вкладення обробляються:

- `mode`: `first` (типово) або `all`
- `maxAttachments`: обмеження кількості оброблених вкладень (типово **1**)
- `prefer`: `first`, `last`, `path`, `url`

Коли `mode: "all"`, результати позначаються як `[Image 1/2]`, `[Audio 2/2]` тощо.

Поведінка вилучення тексту з файлових вкладень:

- Вилучений текст файла обгортається як **недовірений зовнішній вміст** перед
  додаванням до prompt медіа.
- Вставлений блок використовує явні маркери меж, такі як
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих
  `Source: External`.
- Цей шлях вилучення з вкладень навмисно не включає довгий банер
  `SECURITY NOTICE:`, щоб не роздувати prompt медіа; маркери меж і метадані
  все одно залишаються.
- Якщо файл не містить тексту, який можна вилучити, OpenClaw вставляє `[No extractable text]`.
- Якщо PDF у цьому шляху переходить до рендерингу зображень сторінок, prompt медіа зберігає
  заповнювач `[PDF content rendered to images; images not forwarded to model]`,
  оскільки цей крок вилучення з вкладень передає текстові блоки, а не відрендерені зображення PDF.

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

### 4) Окремий мультимодальний запис (явні можливості)

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

Коли запускається розуміння медіа, `/status` містить короткий рядок підсумку:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Тут показано результати для кожної можливості та вибрані provider/модель, якщо застосовно.

## Примітки

- Розуміння є **best-effort**. Помилки не блокують відповіді.
- Вкладення все одно передаються моделям, навіть якщо розуміння вимкнене.
- Використовуйте `scope`, щоб обмежити, де запускається розуміння (наприклад, лише в особистих повідомленнях).

## Пов’язані документи

- [Конфігурація](/uk/gateway/configuration)
- [Підтримка зображень і медіа](/uk/nodes/images)
