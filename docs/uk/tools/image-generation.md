---
read_when:
    - Генерація зображень через агента
    - Налаштування провайдерів і моделей для генерації зображень
    - Розуміння параметрів інструмента `image_generate`
summary: Генеруйте та редагуйте зображення за допомогою налаштованих провайдерів (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-24T00:42:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 427df6a3aa2adebef13cb77b6bbc161c010477d8f669b7c20b917382c3acb224
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати та редагувати зображення за допомогою налаштованих провайдерів. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється лише тоді, коли доступний принаймні один провайдер генерації зображень. Якщо ви не бачите `image_generate` серед інструментів агента, налаштуйте `agents.defaults.imageGenerationModel`, укажіть API-ключ провайдера або увійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

1. Установіть API-ключ щонайменше для одного провайдера (наприклад, `OPENAI_API_KEY`, `GEMINI_API_KEY` або `OPENROUTER_API_KEY`) або увійдіть через OpenAI Codex OAuth.
2. За бажанням установіть бажану модель:

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

Codex OAuth використовує те саме посилання на модель `openai/gpt-image-2`. Коли налаштовано OAuth-профіль `openai-codex`, OpenClaw спрямовує запити на зображення через цей самий OAuth-профіль замість того, щоб спочатку пробувати `OPENAI_API_KEY`.
Явна користувацька конфігурація зображень `models.providers.openai`, наприклад API-ключ або користувацький/Azure base URL, знову вмикає прямий маршрут через OpenAI Images API.
Для OpenAI-сумісних LAN-ендпойнтів, таких як LocalAI, зберігайте користувацький `models.providers.openai.baseUrl` і явно вмикайте доступ через `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; приватні/внутрішні ендпойнти зображень за замовчуванням залишаються заблокованими.

3. Попросіть агента: _"Згенеруй зображення дружнього робота-маскота."_

Агент автоматично викликає `image_generate`. Додавати інструмент до списку дозволених не потрібно — він увімкнений за замовчуванням, коли доступний провайдер.

## Підтримувані провайдери

| Провайдер | Модель за замовчуванням                 | Підтримка редагування               | Автентифікація                                         |
| --------- | --------------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI    | `gpt-image-2`                           | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Так (до 5 вхідних зображень)       | `OPENROUTER_API_KEY`                                   |
| Google    | `gemini-3.1-flash-image-preview`        | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                  |
| fal       | `fal-ai/flux/dev`                       | Так                                | `FAL_KEY`                                              |
| MiniMax   | `image-01`                              | Так (референс об’єкта)             | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI   | `workflow`                              | Так (1 зображення, налаштовується workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари    |
| Vydra     | `grok-imagine`                          | Ні                                 | `VYDRA_API_KEY`                                        |
| xAI       | `grok-imagine-image`                    | Так (до 5 зображень)               | `XAI_API_KEY`                                          |

Використовуйте `action: "list"`, щоб переглянути доступні провайдери та моделі під час виконання:

```
/tool image_generate action=list
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
Промпт для генерації зображення. Обов’язковий для `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Використовуйте `"list"`, щоб переглянути доступні провайдери та моделі під час виконання.
</ParamField>

<ParamField path="model" type="string">
Перевизначення провайдера/моделі, наприклад `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Шлях до одного референсного зображення або URL для режиму редагування.
</ParamField>

<ParamField path="images" type="string[]">
Кілька референсних зображень для режиму редагування (до 5).
</ParamField>

<ParamField path="size" type="string">
Підказка щодо розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Співвідношення сторін: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Підказка щодо роздільної здатності.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Підказка щодо якості, якщо провайдер це підтримує.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Підказка щодо формату виводу, якщо провайдер це підтримує.
</ParamField>

<ParamField path="count" type="number">
Кількість зображень для генерації (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Необов’язковий тайм-аут запиту до провайдера в мілісекундах.
</ParamField>

<ParamField path="filename" type="string">
Підказка щодо імені вихідного файла.
</ParamField>

<ParamField path="openai" type="object">
Підказки лише для OpenAI: `background`, `moderation`, `outputCompression` і `user`.
</ParamField>

Не всі провайдери підтримують усі параметри. Коли резервний провайдер підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед надсиланням зіставляє запит із найближчим підтримуваним розміром, співвідношенням сторін або роздільною здатністю. Непідтримувані підказки виводу, як-от `quality` або `outputFormat`, відкидаються для провайдерів, які не заявляють такої підтримки, і про це повідомляється в результаті інструмента.

Результати інструмента повідомляють про застосовані параметри. Коли OpenClaw змінює геометрію під час переходу на резервного провайдера, повернені значення `size`, `aspectRatio` і `resolution` відображають те, що фактично було надіслано, а `details.normalization` містить перетворення від запитаного до застосованого.

## Конфігурація

### Вибір моделі

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Порядок вибору провайдера

Під час генерації зображення OpenClaw пробує провайдерів у такому порядку:

1. Параметр **`model`** з виклику інструмента (якщо агент його вказує)
2. **`imageGenerationModel.primary`** із конфігурації
3. **`imageGenerationModel.fallbacks`** у заданому порядку
4. **Автовизначення** — використовує лише типові значення провайдерів, підкріплені автентифікацією:
   - спочатку поточний провайдер за замовчуванням
   - потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id

Якщо провайдер не спрацьовує (помилка автентифікації, ліміт запитів тощо), автоматично пробується наступний кандидат. Якщо не спрацьовують усі, помилка містить подробиці кожної спроби.

Примітки:

- Автовизначення враховує автентифікацію. Типове значення провайдера потрапляє до списку кандидатів лише тоді, коли OpenClaw дійсно може автентифікувати цей провайдер.
- Автовизначення ввімкнене за замовчуванням. Установіть `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете, щоб генерація зображень використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Використовуйте `action: "list"`, щоб переглянути наразі зареєстровані провайдери, їхні моделі за замовчуванням і підказки щодо змінних середовища для автентифікації.

### Редагування зображень

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування референсних зображень. Передайте шлях до референсного зображення або URL:

```
"Згенеруй акварельну версію цієї фотографії" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 референсних зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

### Моделі зображень OpenRouter

Генерація зображень через OpenRouter використовує той самий `OPENROUTER_API_KEY` і маршрутизується через image API chat completions від OpenRouter. Вибирайте моделі зображень OpenRouter за допомогою префікса `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw пересилає в OpenRouter `prompt`, `count`, референсні зображення та сумісні з Gemini підказки `aspectRatio` / `resolution`. Серед поточних вбудованих скорочень для моделей зображень OpenRouter є `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`; використовуйте `action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

### OpenAI `gpt-image-2`

Генерація зображень OpenAI за замовчуванням використовує `openai/gpt-image-2`. Якщо налаштовано OAuth-профіль `openai-codex`, OpenClaw повторно використовує той самий OAuth-профіль, що й для чат-моделей підписки Codex, і надсилає запит на зображення через бекенд Codex Responses; він не переходить непомітно на `OPENAI_API_KEY` для цього запиту. Щоб примусово використовувати прямий маршрут через OpenAI Images API, явно налаштуйте `models.providers.openai` з API-ключем, користувацьким base URL або ендпойнтом Azure. Старішу модель `openai/gpt-image-1` усе ще можна явно вибрати, але нові запити OpenAI на генерацію й редагування зображень мають використовувати `gpt-image-2`.

`gpt-image-2` підтримує як генерацію зображень із тексту, так і редагування референсних зображень через той самий інструмент `image_generate`. OpenClaw пересилає до OpenAI `prompt`, `count`, `size`, `quality`, `outputFormat` і референсні зображення. OpenAI не отримує `aspectRatio` або `resolution` безпосередньо; коли це можливо, OpenClaw зіставляє їх із підтримуваним `size`, інакше інструмент повідомляє про них як про проігноровані перевизначення.

Специфічні для OpenAI параметри містяться в об’єкті `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` приймає значення `transparent`, `opaque` або `auto`; прозорий вивід потребує `outputFormat` `png` або `webp`. `openai.outputCompression` застосовується до виводу у форматах JPEG/WebP.

Згенерувати одне горизонтальне зображення 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Згенерувати два квадратні зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Відредагувати одне локальне референсне зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Редагувати з кількома референсами:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Щоб маршрутизувати генерацію зображень OpenAI через розгортання Azure OpenAI замість `api.openai.com`, див. [ендпойнти Azure OpenAI](/uk/providers/openai#azure-openai-endpoints) у документації провайдера OpenAI.

Генерація зображень MiniMax доступна через обидва вбудовані шляхи автентифікації MiniMax:

- `minimax/image-01` для конфігурацій з API-ключем
- `minimax-portal/image-01` для конфігурацій OAuth

## Можливості провайдерів

| Можливість            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Генерація             | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (кількість виходів визначається workflow) | Так (1) | Так (до 4)           |
| Редагування/референси | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення)  | Так (1 зображення, референс об’єкта) | Так (1 зображення, налаштовується workflow) | Ні      | Так (до 5 зображень) |
| Керування розміром    | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Ні                   |
| Співвідношення сторін | Ні                   | Так                  | Так (лише генерація) | Так                       | Ні                                 | Ні      | Так                  |
| Роздільна здатність (1K/2K/4K) | Ні         | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований провайдер xAI використовує `/v1/images/generations` для запитів лише з промптом і `/v1/images/edits`, коли присутній `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Кількість: до 4
- Референси: один `image` або до п’яти `images`
- Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Роздільна здатність: `1K`, `2K`
- Вивід: повертається як вкладення зображень, керовані OpenClaw

OpenClaw навмисно не надає доступу до специфічних для xAI параметрів `quality`, `mask`, `user` або додаткових native-only співвідношень сторін, доки ці елементи керування не з’являться у спільному міжпровайдерному контракті `image_generate`.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального ComfyUI і Comfy Cloud workflow
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео й мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування зображень, відео, пошуку, виконання коду та TTS Grok
- [Довідник із конфігурації](/uk/gateway/configuration-reference#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і резервне перемикання
