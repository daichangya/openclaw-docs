---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної автоматизації headless-можливостей
summary: Infer-first CLI для робочих процесів із моделями, зображеннями, аудіо, TTS, відео, вебом і ембедингами на основі провайдерів
title: CLI для інференсу
x-i18n:
    generated_at: "2026-04-25T19:09:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e4ee27a124a5969231fb3363e582cf90323f887e9625dc7c8aa3e7640b54224
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` — це канонічна headless-поверхня для робочих процесів інференсу на основі провайдерів.

Вона навмисно надає сімейства можливостей, а не сирі назви RPC Gateway і не сирі ідентифікатори інструментів агентів.

## Перетворіть infer на skill

Скопіюйте й вставте це в агента:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Хороший skill на основі infer має:

- зіставляти поширені наміри користувача з правильними підкомандами infer
- включати кілька канонічних прикладів infer для робочих процесів, які він охоплює
- віддавати перевагу `openclaw infer ...` у прикладах і рекомендаціях
- уникати повторного документування всієї поверхні infer у тілі skill

Типове покриття skill, зосередженого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає один узгоджений CLI для завдань інференсу на основі провайдерів у межах OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість того щоб підключати окремі одноразові обгортки для кожного бекенда.
- Тримайте робочі процеси для моделей, зображень, транскрибування аудіо, TTS, відео, вебу й ембедингів в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентами.
- Віддавайте перевагу first-party поверхні OpenClaw, коли завдання по суті зводиться до «запустити інференс».
- Використовуйте звичайний локальний шлях без потреби в Gateway для більшості команд infer.

Для наскрізних перевірок провайдерів віддавайте перевагу `openclaw infer ...`, щойно нижчорівневі тести провайдерів уже зелені. Це перевіряє поставлюваний CLI, завантаження конфігурації, визначення агента за замовчуванням, активацію вбудованих Plugin, виправлення залежностей під час виконання та спільне середовище виконання можливостей до того, як буде зроблено запит до провайдера.

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
| Виконати текстовий/модельний запит | `openclaw infer model run --prompt "..." --json`                       | За замовчуванням використовує звичайний локальний шлях |
| Згенерувати зображення  | `openclaw infer image generate --prompt "..." --json`                  | Використовуйте `image edit`, якщо починаєте з наявного файлу |
| Описати файл зображення | `openclaw infer image describe --file ./image.png --json`              | `--model` має бути `<provider/model>`, здатною працювати із зображеннями |
| Транскрибувати аудіо    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` має бути `<provider/model>`                 |
| Синтезувати мовлення    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` орієнтований на gateway                  |
| Згенерувати відео       | `openclaw infer video generate --prompt "..." --json`                  | Підтримує підказки для провайдера, наприклад `--resolution` |
| Описати відеофайл       | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` має бути `<provider/model>`                 |
| Шукати у вебі           | `openclaw infer web search --query "..." --json`                       |                                                       |
| Отримати вебсторінку    | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Створити ембединги      | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Поведінка

- `openclaw infer ...` — основна CLI-поверхня для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиметься іншою командою або скриптом.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цю пару провайдер/модель безпосередньо. Модель має підтримувати зображення в каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений поворот image-understanding через сервер застосунку Codex; `openai-codex/<model>` використовує шлях провайдера OpenAI Codex OAuth.
- Команди безстанового виконання за замовчуванням локальні.
- Команди для стану, яким керує Gateway, за замовчуванням використовують gateway.
- Звичайний локальний шлях не потребує запущеного Gateway.
- `model run` — одноразова команда. MCP-сервери, відкриті через середовище виконання агента для цієї команди, закриваються після відповіді як для локального виконання, так і для `--gateway`, тож повторні виклики у скриптах не залишають дочірні stdio MCP-процеси активними.

## Model

Використовуйте `model` для текстового інференсу на основі провайдерів і перевірки моделей/провайдерів.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Примітки:

- `model run` повторно використовує середовище виконання агента, тому перевизначення провайдера/моделі поводяться так само, як і під час звичайного виконання агента.
- Оскільки `model run` призначена для headless-автоматизації, вона не зберігає вбудовані MCP-середовища виконання для сесії після завершення команди.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом автентифікації провайдера.

## Image

Використовуйте `image` для генерації, редагування й опису.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --openai-background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --openai-background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Примітки:

- Використовуйте `image edit`, якщо починаєте з наявних вхідних файлів.
- Використовуйте `--output-format png --openai-background transparent` разом із `--model openai/gpt-image-1.5` для PNG-виводу OpenAI з прозорим фоном. Ці специфічні для OpenAI прапорці доступні як у `image generate`, так і в `image edit`.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані провайдери зображень можна виявити, налаштовано, вибрано, а також які можливості генерації/редагування надає кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчу живу CLI-перевірку для змін у генерації зображень. Приклад:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Відповідь JSON повідомляє `ok`, `provider`, `model`, `attempts` і шляхи записаних вихідних файлів. Якщо задано `--output`, остаточне розширення може відповідати MIME-типу, який повернув провайдер.

- Для `image describe` `--model` має бути `<provider/model>`, здатною працювати із зображеннями.
- Для локальних візуальних моделей Ollama спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке умовне значення, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Audio

Використовуйте `audio` для транскрибування файлів.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Примітки:

- `audio transcribe` призначена для транскрибування файлів, а не для керування сеансами в реальному часі.
- `--model` має бути `<provider/model>`.

## TTS

Використовуйте `tts` для синтезу мовлення та стану TTS-провайдера.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Примітки:

- `tts status` за замовчуванням використовує gateway, оскільки відображає стан TTS, яким керує gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider`, щоб перевіряти та налаштовувати поведінку TTS.

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
- Для `video describe` `--model` має бути `<provider/model>`.

## Web

Використовуйте `web` для робочих процесів пошуку й отримання сторінок.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers`, щоб переглянути доступних, налаштованих і вибраних провайдерів.

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

Поля верхнього рівня стабільні:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Для команд, що генерують медіа, `outputs` містить файли, записані OpenClaw. Для автоматизації використовуйте в цьому масиві `path`, `mimeType`, `size` і будь-які специфічні для медіа розміри замість розбору людиночитного stdout.

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

- [Довідка CLI](/uk/cli)
- [Моделі](/uk/concepts/models)
