---
read_when:
    - Генерування зображень через агента
    - Налаштування provider і моделей для генерації зображень
    - Розуміння параметрів інструмента `image_generate`
summary: Генеруйте та редагуйте зображення за допомогою налаштованих provider (OpenAI, OpenAI Codex OAuth, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-23T21:59:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b104fb5e7d1a512d77493218276b9000c03a05b7579719ac9d182603d6b03e
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати та редагувати зображення за допомогою налаштованих provider. Згенеровані зображення автоматично додаються як медіавкладення у відповідь агента.

<Note>
Інструмент з’являється лише тоді, коли доступний принаймні один provider для генерації зображень. Якщо ви не бачите `image_generate` серед інструментів вашого агента, налаштуйте `agents.defaults.imageGenerationModel`, задайте API-ключ provider або увійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

1. Задайте API-ключ принаймні для одного provider (наприклад, `OPENAI_API_KEY` або `GEMINI_API_KEY`) або увійдіть через OpenAI Codex OAuth.
2. За бажанням задайте бажану модель:

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

Codex OAuth використовує той самий ref моделі `openai/gpt-image-2`. Коли налаштовано профіль OAuth `openai-codex`, OpenClaw маршрутизує запити на зображення через цей самий профіль OAuth замість того, щоб спочатку пробувати `OPENAI_API_KEY`. Явна користувацька конфігурація зображень `models.providers.openai`, наприклад API-ключ або custom/Azure base URL, знову вмикає прямий маршрут через OpenAI Images API.

3. Попросіть агента: _«Згенеруй зображення дружнього робота-маскота.»_

Агент автоматично викликає `image_generate`. Додавати інструмент до allow-list не потрібно — він увімкнений за замовчуванням, коли provider доступний.

## Підтримувані provider

| Provider | Модель за замовчуванням          | Підтримка редагування              | Автентифікація                                         |
| -------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                    | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI Codex OAuth                |
| Google   | `gemini-3.1-flash-image-preview` | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | Так                                | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Так (референс суб’єкта)            | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Так (1 зображення, задається workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для cloud |
| Vydra    | `grok-imagine`                   | Ні                                 | `VYDRA_API_KEY`                                        |
| xAI      | `grok-imagine-image`             | Так (до 5 зображень)               | `XAI_API_KEY`                                          |

Використовуйте `action: "list"`, щоб переглянути доступні provider і моделі під час виконання:

```
/tool image_generate action=list
```

## Параметри інструмента

| Параметр     | Тип      | Опис                                                                                  |
| ------------ | -------- | ------------------------------------------------------------------------------------- |
| `prompt`     | string   | Prompt для генерації зображення (обов’язковий для `action: "generate"`)               |
| `action`     | string   | `"generate"` (за замовчуванням) або `"list"` для перегляду provider                   |
| `model`      | string   | Перевизначення provider/моделі, наприклад `openai/gpt-image-2`                        |
| `image`      | string   | Шлях або URL одного референсного зображення для режиму редагування                    |
| `images`     | string[] | Кілька референсних зображень для режиму редагування (до 5)                            |
| `size`       | string   | Підказка розміру: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`     |
| `aspectRatio`| string   | Співвідношення сторін: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution` | string   | Підказка роздільної здатності: `1K`, `2K` або `4K`                                     |
| `count`      | number   | Кількість зображень для генерації (1–4)                                               |
| `filename`   | string   | Підказка для імені вихідного файлу                                                    |

Не всі provider підтримують усі параметри. Коли fallback provider підтримує близький варіант геометрії замість точно запитаного, OpenClaw перед надсиланням зіставляє запит із найближчим підтримуваним розміром, співвідношенням сторін або роздільною здатністю. Справді непідтримувані перевизначення все одно зазначаються в результаті інструмента.

Результати інструмента показують застосовані налаштування. Коли OpenClaw змінює геометрію під час fallback provider, повернуті значення `size`, `aspectRatio` і `resolution` відображають те, що було фактично надіслано, а `details.normalization` фіксує перетворення від запитаного до застосованого.

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

### Порядок вибору provider

Під час генерації зображення OpenClaw пробує provider у такому порядку:

1. **Параметр `model`** із виклику інструмента (якщо агент його задає)
2. **`imageGenerationModel.primary`** із конфігурації
3. **`imageGenerationModel.fallbacks`** у заданому порядку
4. **Автовизначення** — використовує лише типові значення provider, підкріплені автентифікацією:
   - спочатку поточний provider за замовчуванням
   - далі решта зареєстрованих provider генерації зображень у порядку provider-id

Якщо provider завершується помилкою (помилка автентифікації, rate limit тощо), автоматично пробується наступний кандидат. Якщо не спрацьовують усі, помилка містить подробиці про кожну спробу.

Примітки:

- Автовизначення враховує автентифікацію. Типовий provider потрапляє до списку кандидатів лише тоді, коли OpenClaw справді може автентифікувати цей provider.
- Автовизначення ввімкнене за замовчуванням. Установіть `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете, щоб генерація зображень використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Використовуйте `action: "list"`, щоб переглянути поточні зареєстровані provider, їхні моделі за замовчуванням і підказки щодо env var для автентифікації.

### Редагування зображень

OpenAI, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування референсних зображень. Передайте шлях або URL референсного зображення:

```
"Згенеруй акварельну версію цього фото" + image: "/path/to/photo.jpg"
```

OpenAI, Google і xAI підтримують до 5 референсних зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

### OpenAI `gpt-image-2`

Генерація зображень OpenAI за замовчуванням використовує `openai/gpt-image-2`. Якщо налаштовано профіль OAuth `openai-codex`, OpenClaw повторно використовує той самий профіль OAuth, що й для моделей чату за підпискою Codex, і надсилає запит на зображення через бекенд Codex Responses; він не виконує непомітний fallback на `OPENAI_API_KEY` для цього запиту. Щоб примусово використовувати прямий маршрут через OpenAI Images API, явно налаштуйте `models.providers.openai` за допомогою API-ключа, custom base URL або Azure endpoint. Старішу модель `openai/gpt-image-1` усе ще можна явно вибрати, але нові запити OpenAI на генерацію та редагування зображень мають використовувати `gpt-image-2`.

`gpt-image-2` підтримує як генерацію зображень за текстом, так і редагування за референсним зображенням через той самий інструмент `image_generate`. OpenClaw передає до OpenAI `prompt`, `count`, `size` і референсні зображення. OpenAI не отримує `aspectRatio` або `resolution` напряму; коли можливо, OpenClaw зіставляє їх із підтримуваним `size`, інакше інструмент повідомляє про них як про проігноровані перевизначення.

Згенерувати одне панорамне 4K-зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Згенерувати два квадратних зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Відредагувати одне локальне референсне зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Редагування з кількома референсами:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Щоб маршрутизувати генерацію зображень OpenAI через розгортання Azure OpenAI замість `api.openai.com`, див. [Azure OpenAI endpoints](/uk/providers/openai#azure-openai-endpoints) у документації provider OpenAI.

Генерація зображень MiniMax доступна через обидва вбудовані шляхи автентифікації MiniMax:

- `minimax/image-01` для налаштувань з API-ключем
- `minimax-portal/image-01` для налаштувань з OAuth

## Можливості provider

| Можливість            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Генерація             | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (визначається виходами workflow) | Так (1) | Так (до 4)         |
| Редагування/референс  | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення)  | Так (1 зображення, референс суб’єкта) | Так (1 зображення, задається workflow) | Ні | Так (до 5 зображень) |
| Керування розміром    | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Ні                   |
| Співвідношення сторін | Ні                   | Так                  | Так (лише генерація) | Так                       | Ні                                 | Ні      | Так                  |
| Роздільна здатність (1K/2K/4K) | Ні        | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований provider xAI використовує `/v1/images/generations` для запитів лише з prompt і `/v1/images/edits`, коли присутній `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Кількість: до 4
- Референси: один `image` або до п’яти `images`
- Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Роздільна здатність: `1K`, `2K`
- Результати: повертаються як керовані OpenClaw вкладення зображень

OpenClaw навмисно не відкриває для xAI рідні параметри `quality`, `mask`, `user` або додаткові співвідношення сторін, доступні лише нативно, доки ці елементи керування не з’являться в спільному міжprovider-ному контракті `image_generate`.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування provider зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального ComfyUI та workflow Comfy Cloud
- [Google (Gemini)](/uk/providers/google) — налаштування provider зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування provider зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування provider OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування Grok для зображень, відео, пошуку, виконання коду та TTS
- [Довідник із конфігурації](/uk/gateway/configuration-reference#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і failover
