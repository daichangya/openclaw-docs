---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної автоматизації можливостей без інтерфейсу
summary: CLI з пріоритетом визначення для робочих процесів моделей, зображень, аудіо, TTS, відео, вебу та ембедингів, що підтримуються провайдерами
title: CLI для інференсу
x-i18n:
    generated_at: "2026-04-26T03:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` — це канонічна поверхня без інтерфейсу для робочих процесів інференсу, що підтримуються провайдерами.

Вона навмисно надає сімейства можливостей, а не сирі імена Gateway RPC і не сирі id інструментів агентів.

## Перетворіть infer на skill

Скопіюйте й вставте це агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороший skill на основі infer має:

- зіставляти поширені наміри користувача з правильними підкомандами infer
- містити кілька канонічних прикладів infer для робочих процесів, які він охоплює
- віддавати перевагу `openclaw infer ...` у прикладах і рекомендаціях
- уникати повторного документування всієї поверхні infer в тілі skill

Типове покриття skill, орієнтованого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає один узгоджений CLI для завдань інференсу, що підтримуються провайдерами, в OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість того щоб підключати одноразові обгортки для кожного бекенду.
- Тримайте робочі процеси моделей, зображень, транскрипції аудіо, TTS, відео, вебу та ембедингів в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентами.
- Віддавайте перевагу власній поверхні OpenClaw, якщо завдання по суті полягає в тому, щоб "виконати інференс".
- Використовуйте звичайний локальний шлях без потреби в Gateway для більшості команд infer.

Для наскрізних перевірок провайдерів віддавайте перевагу `openclaw infer ...`, щойно низькорівневі
тести провайдерів стали зеленими. Це перевіряє поставлений CLI, завантаження конфігурації,
визначення агента за замовчуванням, активацію вбудованих Plugin, відновлення
залежностей середовища виконання та спільне середовище виконання можливостей до того, як буде зроблено запит до провайдера.

## Дерево команд

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Поширені завдання

Ця таблиця зіставляє поширені завдання інференсу з відповідною командою infer.

| Завдання                | Команда                                                                | Примітки                                              |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Виконати текстовий/модельний запит | `openclaw infer model run --prompt "..." --json`                       | Типово використовує звичайний локальний шлях          |
| Згенерувати зображення  | `openclaw infer image generate --prompt "..." --json`                  | Використовуйте `image edit`, якщо починаєте з наявного файлу |
| Описати файл зображення | `openclaw infer image describe --file ./image.png --json`              | `--model` має бути `<provider/model>`, здатною працювати із зображеннями |
| Транскрибувати аудіо    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` має бути `<provider/model>`                 |
| Синтезувати мовлення    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` орієнтована на Gateway                   |
| Згенерувати відео       | `openclaw infer video generate --prompt "..." --json`                  | Підтримує підказки для провайдера, як-от `--resolution` |
| Описати відеофайл       | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` має бути `<provider/model>`                 |
| Шукати у вебі           | `openclaw infer web search --query "..." --json`                       |                                                       |
| Отримати вебсторінку    | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Створити ембединги      | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Поведінка

- `openclaw infer ...` — основна CLI-поверхня для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиметься іншою командою або скриптом.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` параметр `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цю пару провайдер/модель безпосередньо. Модель має підтримувати роботу із зображеннями в каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений сеанс розуміння зображень Codex app-server; `openai-codex/<model>` використовує шлях провайдера OpenAI Codex OAuth.
- Команди безстанового виконання типово локальні.
- Команди зі станом, яким керує Gateway, типово використовують Gateway.
- Звичайний локальний шлях не вимагає, щоб Gateway була запущена.
- `model run` — одноразова команда. MCP-сервери, відкриті через середовище виконання агента для цієї команди, завершуються після відповіді як для локального виконання, так і для `--gateway`, тому повторні виклики у скриптах не тримають дочірні stdio MCP-процеси активними.

## Model

Використовуйте `model` для текстового інференсу, що підтримується провайдерами, та для інспекції моделей/провайдерів.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Примітки:

- `model run` повторно використовує середовище виконання агента, тому перевизначення провайдера/моделі поводяться як під час звичайного виконання агента.
- Оскільки `model run` призначена для автоматизації без інтерфейсу, вона не зберігає вбудовані середовища виконання MCP для окремих сеансів після завершення команди.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом автентифікації провайдера.

## Image

Використовуйте `image` для генерації, редагування та опису.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Примітки:

- Використовуйте `image edit`, якщо починаєте з наявних вхідних файлів.
- Використовуйте `--size`, `--aspect-ratio` або `--resolution` з `image edit` для
  провайдерів/моделей, які підтримують підказки геометрії під час редагування
  за референтним зображенням.
- Використовуйте `--output-format png --background transparent` з
  `--model openai/gpt-image-1.5` для прозорого PNG-виводу OpenAI;
  `--openai-background` залишається доступним як специфічний для OpenAI синонім. Провайдери,
  які не оголошують підтримку фону, повідомляють про цю підказку як про проігнороване перевизначення.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані провайдери зображень
  можна виявити, налаштовано, вибрано та які можливості генерації/редагування
  надає кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчу живу
  CLI-перевірку змін генерації зображень. Приклад:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON-відповідь повідомляє `ok`, `provider`, `model`, `attempts` і записані
  шляхи виводу. Якщо задано `--output`, кінцеве розширення може відповідати
  MIME-типу, повернутому провайдером.

- Для `image describe` параметр `--model` має бути `<provider/model>`, здатною працювати із зображеннями.
- Для локальних візійних моделей Ollama спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке значення-заповнювач, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Audio

Використовуйте `audio` для транскрипції файлів.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Примітки:

- `audio transcribe` призначена для транскрипції файлів, а не для керування сеансами в реальному часі.
- `--model` має бути `<provider/model>`.

## TTS

Використовуйте `tts` для синтезу мовлення та стану провайдера TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Примітки:

- `tts status` типово використовує Gateway, оскільки вона відображає стан TTS, яким керує Gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider` для перевірки та налаштування поведінки TTS.

## Video

Використовуйте `video` для генерації та опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Примітки:

- `video generate` приймає `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` і `--timeout-ms` та передає їх у середовище виконання генерації відео.
- `--model` має бути `<provider/model>` для `video describe`.

## Web

Використовуйте `web` для робочих процесів пошуку та отримання вебвмісту.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers` для інспекції доступних, налаштованих і вибраних провайдерів.

## Embedding

Використовуйте `embedding` для створення векторів та інспекції провайдерів ембедингів.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вивід JSON

Команди infer нормалізують JSON-вивід у спільному контейнері:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Поля верхнього рівня є стабільними:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Для команд генерації медіа `outputs` містить файли, записані OpenClaw. Використовуйте
`path`, `mimeType`, `size` та будь-які специфічні для медіа розміри в цьому масиві
для автоматизації замість аналізу людиночитного stdout.

## Поширені помилки

```bash
# Погано
openclaw infer media image generate --prompt "friendly lobster"

# Добре
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Погано
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Добре
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Примітки

- `openclaw capability ...` є синонімом для `openclaw infer ...`.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Моделі](/uk/concepts/models)
