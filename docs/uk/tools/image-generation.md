---
read_when:
    - Генерування зображень через агента
    - Налаштування провайдерів і моделей для генерації зображень
    - Розуміння параметрів інструмента `image_generate`
summary: Генеруйте та редагуйте зображення за допомогою налаштованих провайдерів (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, LiteLLM, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-25T19:29:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd7cdb5989dc3d09c87f940e423db669ac95c12a7502b23daa25fc73ba4ff85f
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати й редагувати зображення за допомогою налаштованих провайдерів. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється лише тоді, коли доступний принаймні один провайдер генерації зображень. Якщо ви не бачите `image_generate` серед інструментів вашого агента, налаштуйте `agents.defaults.imageGenerationModel`, задайте API-ключ провайдера або увійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

1. Задайте API-ключ принаймні для одного провайдера (наприклад, `OPENAI_API_KEY`, `GEMINI_API_KEY` або `OPENROUTER_API_KEY`) або увійдіть через OpenAI Codex OAuth.
2. За потреби задайте бажану модель:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        // Необов’язковий типовий тайм-аут запиту до провайдера для image_generate.
        timeoutMs: 180_000,
      },
    },
  },
}
```

Codex OAuth використовує те саме посилання на модель `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw маршрутизує запити на
зображення через той самий OAuth-профіль замість того, щоб спочатку
використовувати `OPENAI_API_KEY`. Явне користувацьке налаштування зображень у
`models.providers.openai`, наприклад API-ключ або користувацький/Azure base URL,
повертає використання прямого маршруту OpenAI Images API. Для OpenAI-сумісних
LAN-ендпойнтів, таких як LocalAI, збережіть користувацький
`models.providers.openai.baseUrl` і явно ввімкніть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; приватні/внутрішні
ендпойнти зображень залишаються заблокованими за замовчуванням.

3. Попросіть агента: _"Згенеруй зображення дружнього робота-маскота."_

Агент автоматично викликає `image_generate`. Додавання до allow-list інструментів не потрібне — він увімкнений за замовчуванням, коли доступний провайдер.

## Поширені маршрути

| Ціль                                                 | Посилання на модель                              | Автентифікація                         |
| ---------------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| Генерація зображень OpenAI з оплатою через API       | `openai/gpt-image-2`                             | `OPENAI_API_KEY`                       |
| Генерація зображень OpenAI з автентифікацією через підписку Codex | `openai/gpt-image-2`                 | OpenAI Codex OAuth                     |
| OpenAI PNG/WebP із прозорим тлом                     | `openai/gpt-image-1.5`                           | `OPENAI_API_KEY` або OpenAI Codex OAuth |
| Генерація зображень через OpenRouter                 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                |
| Генерація зображень через LiteLLM                    | `litellm/gpt-image-2`                            | `LITELLM_API_KEY`                      |
| Генерація зображень Google Gemini                    | `google/gemini-3.1-flash-image-preview`          | `GEMINI_API_KEY` або `GOOGLE_API_KEY`  |

Той самий інструмент `image_generate` обробляє і генерацію з тексту, і
редагування за еталонним зображенням. Використовуйте `image` для одного
еталона або `images` для кількох еталонів. Підказки для виводу, які
підтримуються провайдером, як-от `quality`, `outputFormat` і `background`,
передаються далі, коли це можливо, і позначаються як проігноровані, якщо
провайдер їх не підтримує. Поточна вбудована підтримка прозорого тла
специфічна для OpenAI; інші провайдери все одно можуть зберігати PNG-альфу,
якщо їхній бекенд її повертає.

## Підтримувані провайдери

| Провайдер | Типова модель                          | Підтримка редагування               | Автентифікація                                        |
| --------- | -------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI    | `gpt-image-2`                          | Так (до 4 зображень)               | `OPENAI_API_KEY` або OpenAI Codex OAuth               |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Так (до 5 вхідних зображень)     | `OPENROUTER_API_KEY`                                  |
| LiteLLM   | `gpt-image-2`                          | Так (до 5 вхідних зображень)       | `LITELLM_API_KEY`                                     |
| Google    | `gemini-3.1-flash-image-preview`       | Так                                | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                 |
| fal       | `fal-ai/flux/dev`                      | Так                                | `FAL_KEY`                                             |
| MiniMax   | `image-01`                             | Так (еталон суб’єкта)              | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI   | `workflow`                             | Так (1 зображення, налаштоване workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари |
| Vydra     | `grok-imagine`                         | Ні                                 | `VYDRA_API_KEY`                                       |
| xAI       | `grok-imagine-image`                   | Так (до 5 зображень)               | `XAI_API_KEY`                                         |

Використовуйте `action: "list"`, щоб переглянути доступні провайдери й моделі під час виконання:

```
/tool image_generate action=list
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
Підказка для генерації зображення. Обов’язкова для `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Використовуйте `"list"`, щоб переглянути доступні провайдери й моделі під час виконання.
</ParamField>

<ParamField path="model" type="string">
Перевизначення провайдера/моделі, наприклад `openai/gpt-image-2`; використовуйте
`openai/gpt-image-1.5` для прозорого тла OpenAI.
</ParamField>

<ParamField path="image" type="string">
Шлях або URL одного еталонного зображення для режиму редагування.
</ParamField>

<ParamField path="images" type="string[]">
Кілька еталонних зображень для режиму редагування (до 5).
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
Підказка щодо якості, якщо провайдер її підтримує.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Підказка щодо формату виводу, якщо провайдер її підтримує.
</ParamField>

<ParamField path="background" type="'transparent' | 'opaque' | 'auto'">
Підказка щодо тла, якщо провайдер її підтримує. Використовуйте `transparent` з
`outputFormat: "png"` або `"webp"` для провайдерів, що підтримують прозорість.
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

Не всі провайдери підтримують усі параметри. Коли резервний провайдер
підтримує близький варіант геометрії замість точно запитаного, OpenClaw
перед надсиланням переналаштовує запит до найближчого підтримуваного розміру,
співвідношення сторін або роздільної здатності. Непідтримувані підказки
виводу, як-от `quality` або `outputFormat`, відкидаються для провайдерів, які
не оголошують таку підтримку, і повідомляються в результаті інструмента.

Результати інструмента повідомляють про застосовані налаштування. Коли
OpenClaw переналаштовує геометрію під час резервного переходу між провайдерами,
повернуті значення `size`, `aspectRatio` і `resolution` відображають те, що
було фактично надіслано, а `details.normalization` фіксує перетворення від
запитаних значень до застосованих.

## Конфігурація

### Вибір моделі

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
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

1. **Параметр `model`** з виклику інструмента (якщо агент його вказує)
2. **`imageGenerationModel.primary`** з конфігурації
3. **`imageGenerationModel.fallbacks`** у вказаному порядку
4. **Автовиявлення** — використовуються лише типові значення провайдерів, підкріплені автентифікацією:
   - спочатку поточний типовий провайдер
   - далі решта зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів

Якщо провайдер завершується помилкою (помилка автентифікації, ліміт запитів тощо), автоматично пробується наступний налаштований кандидат. Якщо всі завершуються помилкою, помилка містить подробиці кожної спроби.

Примітки:

- Перевизначення `model` для окремого виклику є точним: OpenClaw пробує лише цю пару провайдер/модель
  і не переходить до налаштованих primary/fallback або автовиявлених
  провайдерів.
- Автовиявлення враховує автентифікацію. Типове значення провайдера додається до списку кандидатів
  лише тоді, коли OpenClaw справді може автентифікувати цей провайдер.
- Автовиявлення увімкнене за замовчуванням. Задайте
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете, щоб генерація зображень
  використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Задайте `agents.defaults.imageGenerationModel.timeoutMs` для повільних бекендів зображень.
  Параметр інструмента `timeoutMs` для окремого виклику перевизначає налаштоване типове значення.
- Використовуйте `action: "list"`, щоб переглянути поточно зареєстрованих провайдерів, їхні
  типові моделі та підказки щодо env vars для автентифікації.

### Редагування зображень

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування еталонних зображень. Передайте шлях або URL еталонного зображення:

```
"Згенеруй акварельну версію цього фото" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 еталонних зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

### Моделі зображень OpenRouter

Генерація зображень через OpenRouter використовує той самий `OPENROUTER_API_KEY` і маршрутизується через image API chat completions OpenRouter. Вибирайте моделі зображень OpenRouter з префіксом `openrouter/`:

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

OpenClaw передає до OpenRouter `prompt`, `count`, еталонні зображення та
Gemini-сумісні підказки `aspectRatio` / `resolution`. Поточні вбудовані
скорочення для моделей зображень OpenRouter включають `google/gemini-3.1-flash-image-preview`,
`google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`; використовуйте
`action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

### OpenAI `gpt-image-2`

За замовчуванням генерація зображень OpenAI використовує `openai/gpt-image-2`. Якщо
налаштовано OAuth-профіль `openai-codex`, OpenClaw повторно використовує той самий OAuth-профіль,
який застосовується моделями чату Codex за підпискою, і надсилає запит на зображення
через бекенд Codex Responses. Застарілі base URL Codex, такі як
`https://chatgpt.com/backend-api`, канонікалізуються до
`https://chatgpt.com/backend-api/codex` для запитів на зображення. Він не
виконує тихого резервного переходу до `OPENAI_API_KEY` для цього запиту. Щоб примусово використати прямий маршрут
OpenAI Images API, явно налаштуйте `models.providers.openai` за допомогою API-ключа,
користувацького base URL або Azure-ендпойнта. Моделі `openai/gpt-image-1.5`,
`openai/gpt-image-1` і `openai/gpt-image-1-mini` усе ще можна
вибирати явно. Використовуйте `gpt-image-1.5` для виводу PNG/WebP із прозорим тлом;
поточний API `gpt-image-2` відхиляє `background: "transparent"`.

`gpt-image-2` підтримує як генерацію зображень із тексту, так і редагування за
еталонним зображенням через той самий інструмент `image_generate`. OpenClaw передає до OpenAI `prompt`,
`count`, `size`, `quality`, `outputFormat` і еталонні зображення.
OpenAI не отримує `aspectRatio` або `resolution` безпосередньо; коли це можливо,
OpenClaw перетворює їх у підтримуваний `size`, інакше інструмент повідомляє про них як про
проігноровані перевизначення.

Опції, специфічні для OpenAI, містяться в об’єкті `openai`:

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

`openai.background` приймає значення `transparent`, `opaque` або `auto`; прозорі
вихідні файли потребують `outputFormat` `png` або `webp` і OpenAI-сумісної моделі
зображень із підтримкою прозорості. OpenClaw маршрутизує типові запити
`gpt-image-2` на прозоре тло до `gpt-image-1.5`. `openai.outputCompression` застосовується до виходів JPEG/WebP.

Підказка `background` верхнього рівня є нейтральною щодо провайдера й наразі зіставляється з тим самим
полем запиту OpenAI `background`, коли вибрано провайдера OpenAI.
Провайдери, які не оголошують підтримку тла, повертають його в `ignoredOverrides`
замість отримання непідтримуваного параметра.

Коли ви просите агента створити зображення OpenAI з прозорим тлом, очікуваний
виклик інструмента має такий вигляд:

```json
{
  "model": "openai/gpt-image-1.5",
  "prompt": "A simple red circle sticker on a transparent background",
  "outputFormat": "png",
  "background": "transparent"
}
```

Явна модель `openai/gpt-image-1.5` зберігає портативність запиту між
зведеннями інструментів і harnesses. Якщо агент натомість використовує типову
`openai/gpt-image-2` з `openai.background: "transparent"` у публічному маршруті
OpenAI або OpenAI Codex OAuth, OpenClaw переписує запит провайдера на
`gpt-image-1.5`. Azure і користувацькі OpenAI-сумісні ендпойнти зберігають свої
налаштовані назви deployment/model.

Для безголової генерації через CLI використовуйте еквівалентні прапорці `openclaw infer`:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Ті самі прапорці `--output-format` і `--background` також доступні в
`openclaw infer image edit`; `--openai-background` лишається доступним як
специфічний для OpenAI псевдонім. Поточні вбудовані провайдери, окрім OpenAI, не
оголошують явного керування тлом, тож для них `background: "transparent"` повідомляється
як проігнорований.

Згенерувати одне горизонтальне зображення 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Згенерувати прозорий PNG:

```
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Згенерувати два квадратні зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Відредагувати одне локальне еталонне зображення:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Редагування з кількома еталонами:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Щоб маршрутизувати генерацію зображень OpenAI через deployment Azure OpenAI замість
`api.openai.com`, див. [Azure OpenAI endpoints](/uk/providers/openai#azure-openai-endpoints)
у документації провайдера OpenAI.

Генерація зображень MiniMax доступна через обидва вбудовані шляхи автентифікації MiniMax:

- `minimax/image-01` для конфігурацій з API-ключем
- `minimax-portal/image-01` для конфігурацій з OAuth

## Можливості провайдерів

| Можливість           | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Генерація            | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (виходи визначаються workflow) | Так (1) | Так (до 4)           |
| Редагування/еталони  | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення)  | Так (1 зображення, еталон суб’єкта) | Так (1 зображення, налаштоване workflow) | Ні      | Так (до 5 зображень) |
| Керування розміром   | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Ні                   |
| Співвідношення сторін| Ні                   | Так                  | Так (лише генерація) | Так                       | Ні                                 | Ні      | Так                  |
| Роздільна здатність (1K/2K/4K) | Ні         | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований провайдер xAI використовує `/v1/images/generations` для запитів лише з підказкою
і `/v1/images/edits`, коли присутні `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Кількість: до 4
- Еталони: одне `image` або до п’яти `images`
- Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Роздільна здатність: `1K`, `2K`
- Виходи: повертаються як вкладення зображень, якими керує OpenClaw

OpenClaw навмисно не надає доступу до властивих xAI параметрів `quality`, `mask`, `user` або
додаткових співвідношень сторін, доступних лише нативно, доки ці елементи керування не з’являться в спільному
міжпровайдерному контракті `image_generate`.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального workflow ComfyUI і Comfy Cloud
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування Grok для зображень, відео, пошуку, виконання коду й TTS
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і резервне перемикання
