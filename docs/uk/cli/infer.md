---
read_when:
    - Додавання або змінення команд `openclaw infer`
    - Проєктування стабільної автоматизації можливостей без графічного інтерфейсу
summary: CLI з пріоритетним визначенням для робочих процесів моделей, зображень, аудіо, TTS, відео, вебу та ембедингів, що працюють через провайдера
title: CLI для inference
x-i18n:
    generated_at: "2026-04-25T19:29:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd5b98b70fd959cdcdf80131cebf99cb7131b220c5757acb380ce405b85998a1
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` — це канонічна headless-поверхня для робочих процесів inference, що працюють через провайдера.

Вона навмисно відкриває сімейства можливостей, а не сирі назви RPC Gateway і не сирі id інструментів агента.

## Перетворіть infer на skill

Скопіюйте й вставте це агенту:

```text
Прочитай https://docs.openclaw.ai/cli/infer, а потім створи skill, який маршрутизує мої типові робочі процеси до `openclaw infer`.
Зосередься на запусках моделей, генерації зображень, генерації відео, транскрибуванні аудіо, TTS, вебпошуку та ембедингах.
```

Хороший skill на основі infer має:

- зіставляти типові наміри користувача з правильним підкомандним infer
- включати кілька канонічних прикладів infer для робочих процесів, які він охоплює
- віддавати перевагу `openclaw infer ...` у прикладах і підказках
- уникати повторного документування всієї поверхні infer всередині тіла skill

Типове охоплення skill, зосередженого на infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Навіщо використовувати infer

`openclaw infer` надає один узгоджений CLI для завдань inference через провайдера всередині OpenClaw.

Переваги:

- Використовуйте провайдерів і моделі, уже налаштовані в OpenClaw, замість підключення одноразових обгорток для кожного бекенда.
- Тримайте робочі процеси моделей, зображень, транскрибування аудіо, TTS, відео, вебу та ембедингів в одному дереві команд.
- Використовуйте стабільну форму виводу `--json` для скриптів, автоматизації та робочих процесів, керованих агентами.
- Віддавайте перевагу першорядній поверхні OpenClaw, коли завдання по суті зводиться до «запустити inference».
- Використовуйте звичайний локальний шлях без потреби в Gateway для більшості команд infer.

Для наскрізних перевірок провайдерів віддавайте перевагу `openclaw infer ...`, коли низькорівневі
тести провайдерів уже зелені. Це перевіряє доставлений CLI, завантаження конфігурації,
визначення агента за замовчуванням, активацію вбудованих Plugin, відновлення залежностей під час виконання
та спільне середовище виконання можливостей перед надсиланням запиту до провайдера.

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
| Згенерувати зображення  | `openclaw infer image generate --prompt "..." --json`                  | Використовуйте `image edit`, якщо починаєте з наявного файлу |
| Описати файл зображення | `openclaw infer image describe --file ./image.png --json`              | `--model` має бути image-capable `<provider/model>` |
| Транскрибувати аудіо    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` має бути `<provider/model>`                  |
| Синтезувати мовлення    | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` орієнтований на gateway                   |
| Згенерувати відео       | `openclaw infer video generate --prompt "..." --json`                  | Підтримує підказки провайдера, як-от `--resolution`    |
| Описати відеофайл       | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` має бути `<provider/model>`                  |
| Шукати у вебі           | `openclaw infer web search --query "..." --json`                       |                                                       |
| Отримати вебсторінку    | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Створити ембединги      | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Поведінка

- `openclaw infer ...` — основна CLI-поверхня для цих робочих процесів.
- Використовуйте `--json`, коли вивід споживатиметься іншою командою або скриптом.
- Використовуйте `--provider` або `--model provider/model`, коли потрібен конкретний бекенд.
- Для `image describe`, `audio transcribe` і `video describe` параметр `--model` має використовувати форму `<provider/model>`.
- Для `image describe` явний `--model` запускає цю пару provider/model напряму. Модель має бути здатною працювати із зображеннями в каталозі моделей або конфігурації провайдера. `codex/<model>` запускає обмежений turn розуміння зображень через сервер застосунку Codex; `openai-codex/<model>` використовує шлях провайдера OpenAI Codex OAuth.
- Команди stateless execution за замовчуванням локальні.
- Команди стану, керованого Gateway, за замовчуванням працюють через gateway.
- Звичайний локальний шлях не потребує запущеного Gateway.
- `model run` є одноразовою командою. MCP-сервери, відкриті через середовище виконання агента для цієї команди, завершуються після відповіді як для локального виконання, так і для `--gateway`, тому повторні виклики в скриптах не залишають дочірні процеси stdio MCP активними.

## Model

Використовуйте `model` для text inference через провайдера та перевірки моделей/провайдерів.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Примітки:

- `model run` повторно використовує середовище виконання агента, тому перевизначення provider/model поводяться як під час звичайного виконання агента.
- Оскільки `model run` призначено для headless-автоматизації, він не зберігає вбудовані середовища виконання MCP на рівні сесії після завершення команди.
- `model auth login`, `model auth logout` і `model auth status` керують збереженим станом автентифікації провайдера.

## Image

Використовуйте `image` для генерації, редагування й опису.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Примітки:

- Використовуйте `image edit`, якщо починаєте з наявних вхідних файлів.
- Використовуйте `--output-format png --background transparent` разом із
  `--model openai/gpt-image-1.5` для виводу OpenAI PNG з прозорим тлом;
  `--openai-background` залишається доступним як псевдонім, специфічний для OpenAI. Провайдери,
  які не декларують підтримку тла, повідомляють про цю підказку як про проігнороване перевизначення.
- Використовуйте `image providers --json`, щоб перевірити, які вбудовані image-провайдери
  можна виявити, налаштовано, вибрано, а також які можливості генерації/редагування
  відкриває кожен провайдер.
- Використовуйте `image generate --model <provider/model> --json` як найвужчу живу
  CLI-перевірку для змін у генерації зображень. Приклад:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON-відповідь повідомляє `ok`, `provider`, `model`, `attempts` і записані
  шляхи виводу. Якщо встановлено `--output`, фінальне розширення може відповідати
  MIME-типу, який повернув провайдер.

- Для `image describe` параметр `--model` має бути image-capable `<provider/model>`.
- Для локальних vision-моделей Ollama спочатку завантажте модель і встановіть `OLLAMA_API_KEY` у будь-яке заповнювальне значення, наприклад `ollama-local`. Див. [Ollama](/uk/providers/ollama#vision-and-image-description).

## Audio

Використовуйте `audio` для транскрибування файлів.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Примітки:

- `audio transcribe` призначено для транскрибування файлів, а не для керування сесіями в реальному часі.
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

- `tts status` за замовчуванням використовує gateway, оскільки відображає стан TTS, керований gateway.
- Використовуйте `tts providers`, `tts voices` і `tts set-provider` для перевірки та налаштування поведінки TTS.

## Video

Використовуйте `video` для генерації й опису.

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

Використовуйте `web` для робочих процесів пошуку та отримання сторінок.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Примітки:

- Використовуйте `web providers` для перевірки доступних, налаштованих і вибраних провайдерів.

## Embedding

Використовуйте `embedding` для створення векторів і перевірки провайдерів ембедингів.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Вивід JSON

Команди infer нормалізують вивід JSON у спільному контейнері:

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
для автоматизації замість розбору stdout, придатного для читання людиною.

## Поширені помилки

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Примітки

- `openclaw capability ...` — це псевдонім для `openclaw infer ...`.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Моделі](/uk/concepts/models)
