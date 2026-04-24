---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної автоматизації можливостей без графічного інтерфейсу
summary: CLI з infer-first для робочих процесів із моделями, зображеннями, аудіо, TTS, відео, вебом та ембедингами на основі провайдера
title: CLI для inference
x-i18n:
    generated_at: "2026-04-24T19:51:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2127deec34c5cf8431035c6cc02fc4acb35e4a107f70de0c7654fe4806c0d43
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` — це канонічна headless-поверхня для робочих процесів inference на основі провайдера.

Вона навмисно надає сімейства можливостей, а не сирі назви Gateway RPC і не сирі ідентифікатори інструментів агентів.

## Перетворіть infer на skill

Скопіюйте й вставте це агенту:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороший skill на основі infer має:

- зіставляти поширені наміри користувача з правильним підкомандним викликом infer
- містити кілька канонічних прикладів infer для робочих процесів, які він охоплює
- надавати перевагу `openclaw infer ...` у прикладах і рекомендаціях
- уникати повторного документування всієї поверхні infer всередині тіла skill

Типове охоплення skill, зосередженого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає єдиний узгоджений CLI для завдань inference на основі провайдера всередині OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість підключення одноразових обгорток для кожного бекенда.
- Тримайте робочі процеси з моделями, зображеннями, транскрипцією аудіо, TTS, відео, вебом та ембедингами в межах одного дерева команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентами.
- Надавайте перевагу першочерговій поверхні OpenClaw, коли завдання по суті полягає в тому, щоб «запустити inference».
- Використовуйте звичайний локальний шлях без потреби в Gateway для більшості команд infer.

Для наскрізних перевірок провайдерів віддавайте перевагу `openclaw infer ...`, щойно пройдено тести провайдера нижчого рівня. Це перевіряє постачений CLI, завантаження конфігурації, визначення агента за замовчуванням, активацію вбудованих plugin, відновлення залежностей середовища виконання та спільне середовище виконання можливостей до того, як буде зроблено запит до провайдера.

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

Ця таблиця зіставляє поширені завдання inference з відповідною командою infer.

| Завдання                | Команда                                                                | Примітки                                              |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Запустити текстовий/модельний запит | `openclaw infer model run --prompt "..." --json`                       | За замовчуванням використовує звичайний локальний шлях |
| Згенерувати зображення  | `openclaw infer image generate --prompt "..." --json`                  | Використовуйте `image edit`, якщо починаєте з наявного файла |
| Описати файл зображення | `openclaw infer image describe --file ./image.png --json`              | `--model` має бути зображувально-сумісним `<provider/model>` |
| Транскрибувати аудіо    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` має бути `<provider/model>`                 |
| Синтезувати мовлення    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` орієнтований на Gateway                  |
| Згенерувати відео       | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| Описати відеофайл       | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` має бути `<provider/model>`                 |
| Шукати у вебі           | `openclaw infer web search --query "..." --json`                       |                                                       |
| Отримати вебсторінку    | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Створити ембединги      | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Поведінка

- `openclaw infer ...` — основна поверхня CLI для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиметься іншою командою або скриптом.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` параметр `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цей провайдер/модель безпосередньо. Модель має підтримувати зображення в каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений хід розуміння зображень Codex app-server; `openai-codex/<model>` використовує шлях провайдера OpenAI Codex OAuth.
- Команди stateless-виконання за замовчуванням використовують локальний режим.
- Команди стану, керованого Gateway, за замовчуванням використовують Gateway.
- Звичайний локальний шлях не вимагає, щоб Gateway був запущений.

## Model

Використовуйте `model` для текстового inference на основі провайдера та перевірки моделей/провайдерів.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Примітки:

- `model run` повторно використовує runtime агента, тож перевизначення провайдера/моделі поводяться як під час звичайного виконання агента.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом автентифікації провайдера.

## Image

Використовуйте `image` для генерації, редагування та опису.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Примітки:

- Використовуйте `image edit`, якщо починаєте з наявних вхідних файлів.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані провайдери зображень можна виявити, які налаштовані, вибрані та які можливості генерації/редагування надає кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчу живу CLI-перевірку для змін генерації зображень. Приклад:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON-відповідь повідомляє `ok`, `provider`, `model`, `attempts` і шляхи записаних файлів. Якщо задано `--output`, фінальне розширення може відповідати MIME-типу, повернутому провайдером.

- Для `image describe` параметр `--model` має бути зображувально-сумісним `<provider/model>`.
- Для локальних моделей Ollama з підтримкою візуального аналізу спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке значення-заповнювач, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Audio

Використовуйте `audio` для транскрипції файлів.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Примітки:

- `audio transcribe` призначено для транскрипції файлів, а не для керування сесіями в реальному часі.
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

- `tts status` за замовчуванням використовує Gateway, оскільки відображає стан TTS, керований Gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider` для перевірки та налаштування поведінки TTS.

## Video

Використовуйте `video` для генерації та опису.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Примітки:

- Для `video describe` параметр `--model` має бути `<provider/model>`.

## Web

Використовуйте `web` для робочих процесів пошуку та отримання.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers`, щоб перевірити доступних, налаштованих і вибраних провайдерів.

## Embedding

Використовуйте `embedding` для створення векторів і перевірки провайдерів ембедингів.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вивід JSON

Команди infer нормалізують вивід JSON у спільній оболонці:

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

Для команд генерації медіа `outputs` містить файли, записані OpenClaw. Використовуйте `path`, `mimeType`, `size` і будь-які специфічні для медіа розміри в цьому масиві для автоматизації замість аналізу людиночитаного stdout.

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

- `openclaw capability ...` — це псевдонім для `openclaw infer ...`.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Моделі](/uk/concepts/models)
