---
read_when:
    - Генерація зображень через агента
    - Налаштування провайдерів і моделей для генерації зображень
    - Розуміння параметрів інструмента image_generate
summary: Генерація та редагування зображень за допомогою налаштованих провайдерів (OpenAI, OpenAI Codex OAuth, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-23T23:07:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 820829a009d48ccb23fbd9ee256bae27f6d7d9539fd75c2b0a7cef4b91c5c873
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати й редагувати зображення за допомогою налаштованих провайдерів. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється лише тоді, коли доступний щонайменше один провайдер генерації зображень. Якщо ви не бачите `image_generate` серед інструментів агента, налаштуйте `agents.defaults.imageGenerationModel`, задайте API key провайдера або увійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

1. Задайте API key щонайменше для одного провайдера (наприклад, `OPENAI_API_KEY` або `GEMINI_API_KEY`) або увійдіть через OpenAI Codex OAuth.
2. Необов’язково задайте бажану модель:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth використовує те саме посилання на модель `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw маршрутизує запити на зображення
через цей самий OAuth-профіль замість того, щоб спочатку намагатися використати `OPENAI_API_KEY`.
Явна користувацька конфігурація зображень `models.providers.openai`, наприклад API key або
користувацький/Azure base URL, повертає використання прямого маршруту OpenAI Images API.

3. Попросіть агента: _"Згенеруй зображення дружнього робота-маскота."_

Агент автоматично викликає `image_generate`. Додавання до allowlist інструментів не потрібне — він типово ввімкнений, коли доступний провайдер.

## Підтримувані провайдери

| Провайдер | Типова модель                    | Підтримка редагування              | Auth                                                  |
| --------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI    | `gpt-image-2`                    | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI Codex OAuth               |
| Google    | `gemini-3.1-flash-image-preview` | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                 |
| fal       | `fal-ai/flux/dev`                | Так                                | `FAL_KEY`                                             |
| MiniMax   | `image-01`                       | Так (reference об’єкта)            | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI   | `workflow`                       | Так (1 зображення, визначене workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для cloud   |
| Vydra     | `grok-imagine`                   | Ні                                 | `VYDRA_API_KEY`                                       |
| xAI       | `grok-imagine-image`             | Так (до 5 зображень)               | `XAI_API_KEY`                                         |

Використовуйте `action: "list"`, щоб переглянути доступні провайдери й моделі під час runtime:

```
/tool image_generate action=list
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
Prompt для генерації зображення. Обов’язковий для `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Використовуйте `"list"`, щоб переглянути доступні провайдери й моделі під час runtime.
</ParamField>

<ParamField path="model" type="string">
Перевизначення провайдера/моделі, наприклад `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Шлях або URL одного reference-зображення для режиму редагування.
</ParamField>

<ParamField path="images" type="string[]">
Кілька reference-зображень для режиму редагування (до 5).
</ParamField>

<ParamField path="size" type="string">
Підказка щодо розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Aspect ratio: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Підказка щодо роздільної здатності.
</ParamField>

<ParamField path="count" type="number">
Кількість зображень для генерації (1–4).
</ParamField>

<ParamField path="filename" type="string">
Підказка щодо імені вихідного файла.
</ParamField>

Не всі провайдери підтримують усі параметри. Коли fallback-провайдер підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед надсиланням переналаштовує його на найближчий підтримуваний розмір, aspect ratio або роздільну здатність. Справді непідтримувані перевизначення все одно зазначаються в результаті інструмента.

Результати інструмента повідомляють про застосовані параметри. Коли OpenClaw виконує переналаштування геометрії під час fallback провайдера, повернуті значення `size`, `aspectRatio` і `resolution` відображають те, що було фактично надіслано, а `details.normalization` фіксує перетворення від запитаного до застосованого.

## Конфігурація

### Вибір моделі

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Порядок вибору провайдера

Під час генерації зображення OpenClaw пробує провайдерів у такому порядку:

1. **Параметр `model`** з виклику інструмента (якщо агент його задає)
2. **`imageGenerationModel.primary`** з config
3. **`imageGenerationModel.fallbacks`** за порядком
4. **Автовиявлення** — використовує лише типові значення провайдерів, підкріплені auth:
   - спочатку поточний типовий провайдер
   - далі інші зареєстровані провайдери генерації зображень у порядку id провайдера

Якщо провайдер завершується помилкою (помилка auth, rate limit тощо), автоматично пробується наступний кандидат. Якщо всі завершуються помилкою, помилка містить подробиці кожної спроби.

Примітки:

- Автовиявлення враховує auth. Типове значення провайдера потрапляє до списку кандидатів
  лише тоді, коли OpenClaw справді може автентифікувати цей провайдер.
- Автовиявлення типово ввімкнено. Задайте
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете, щоб генерація зображень
  використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Використовуйте `action: "list"`, щоб переглянути поточно зареєстровані провайдери, їхні
  типові моделі та підказки щодо env vars для auth.

### Редагування зображень

OpenAI, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування reference-зображень. Передайте шлях або URL reference-зображення:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, Google і xAI підтримують до 5 reference-зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

### OpenAI `gpt-image-2`

Генерація зображень OpenAI типово використовує `openai/gpt-image-2`. Якщо налаштовано
OAuth-профіль `openai-codex`, OpenClaw повторно використовує той самий OAuth-
профіль, який застосовується для chat-моделей підписки Codex, і надсилає запит на зображення
через backend Codex Responses; він не виконує тихого fallback до
`OPENAI_API_KEY` для цього запиту. Щоб примусово використовувати прямий маршрут OpenAI Images API,
явно налаштуйте `models.providers.openai` з API key, користувацьким base URL
або endpoint-ом Azure. Старішу
модель `openai/gpt-image-1` усе ще можна явно вибрати, але для нових запитів на генерацію
і редагування зображень OpenAI слід використовувати `gpt-image-2`.

`gpt-image-2` підтримує як генерацію text-to-image, так і редагування
reference-зображень через той самий інструмент `image_generate`. OpenClaw передає до OpenAI `prompt`,
`count`, `size` і reference-зображення. OpenAI не отримує
`aspectRatio` або `resolution` напряму; коли можливо, OpenClaw відображає їх у
підтримуваний `size`, інакше інструмент повідомляє про них як про проігноровані перевизначення.

Згенерувати одне 4K-зображення в альбомній орієнтації:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Згенерувати два квадратні зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Відредагувати одне локальне reference-зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Відредагувати з кількома reference:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Щоб спрямувати генерацію зображень OpenAI через розгортання Azure OpenAI замість
`api.openai.com`, див. [endpoint-и Azure OpenAI](/uk/providers/openai#azure-openai-endpoints)
у документації провайдера OpenAI.

Генерація зображень MiniMax доступна через обидва вбудовані шляхи auth MiniMax:

- `minimax/image-01` для конфігурацій з API key
- `minimax-portal/image-01` для конфігурацій з OAuth

## Можливості провайдерів

| Можливість            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Генерація             | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (визначені workflow виходи)    | Так (1) | Так (до 4)           |
| Редагування/reference | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення)  | Так (1 зображення, reference об’єкта) | Так (1 зображення, визначене workflow) | Ні      | Так (до 5 зображень) |
| Керування розміром    | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Ні                   |
| Aspect ratio          | Ні                   | Так                  | Так (лише генерація) | Так                       | Ні                                 | Ні      | Так                  |
| Роздільна здатність (1K/2K/4K) | Ні          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований провайдер xAI використовує `/v1/images/generations` для запитів лише з prompt
і `/v1/images/edits`, коли присутній `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Count: до 4
- Reference: один `image` або до п’яти `images`
- Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Роздільна здатність: `1K`, `2K`
- Вихідні дані: повертаються як керовані OpenClaw вкладення зображень

OpenClaw навмисно не відкриває специфічні для xAI `quality`, `mask`, `user` або
додаткові native-only aspect ratio, доки ці елементи керування не з’являться в спільному
міжпровайдерному контракті `image_generate`.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального ComfyUI та workflow Comfy Cloud
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування Grok для зображень, відео, пошуку, виконання коду і TTS
- [Довідник із конфігурації](/uk/gateway/configuration-reference#agent-defaults) — config `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і failover
