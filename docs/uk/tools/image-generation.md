---
read_when:
    - Генерування зображень через агента
    - Налаштування провайдерів і моделей для генерації зображень
    - Розуміння параметрів інструмента `image_generate`
summary: Створюйте й редагуйте зображення за допомогою налаштованих провайдерів (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, LiteLLM, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Генерація зображень
x-i18n:
    generated_at: "2026-04-25T19:09:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: af0afacd9714dbaacfd3b15560ee3badfd6ecea6d2ecf63a12cc9834d916d3e6
    source_path: tools/image-generation.md
    workflow: 15
---

Інструмент `image_generate` дає агенту змогу створювати й редагувати зображення за допомогою ваших налаштованих провайдерів. Згенеровані зображення автоматично доставляються як медіавкладення у відповіді агента.

<Note>
Інструмент з’являється, лише коли доступний принаймні один провайдер генерації зображень. Якщо ви не бачите `image_generate` серед інструментів агента, налаштуйте `agents.defaults.imageGenerationModel`, задайте API-ключ провайдера або увійдіть через OpenAI Codex OAuth.
</Note>

## Швидкий старт

1. Задайте API-ключ принаймні для одного провайдера (наприклад, `OPENAI_API_KEY`, `GEMINI_API_KEY` або `OPENROUTER_API_KEY`) або увійдіть через OpenAI Codex OAuth.
2. За бажанням задайте бажану модель:

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
налаштовано OAuth-профіль `openai-codex`, OpenClaw спрямовує запити на
зображення через цей самий OAuth-профіль замість того, щоб спочатку пробувати `OPENAI_API_KEY`.
Явна користувацька конфігурація зображень `models.providers.openai`, наприклад API-ключ або
користувацька/Azure `baseUrl`, знову перемикає на прямий маршрут OpenAI Images API.
Для сумісних з OpenAI кінцевих точок у локальній мережі, таких як LocalAI, зберігайте
користувацьку `models.providers.openai.baseUrl` і явно вмикайте це через
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; приватні/внутрішні
кінцеві точки зображень за замовчуванням залишаються заблокованими.

3. Попросіть агента: _«Згенеруй зображення дружнього робота-талісмана.»_

Агент автоматично викликає `image_generate`. Жодного allow-list для інструментів не потрібно — він увімкнений за замовчуванням, коли доступний провайдер.

## Поширені варіанти

| Ціль                                                 | Посилання на модель                               | Автентифікація                         |
| ---------------------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| Генерація зображень OpenAI з оплатою через API       | `openai/gpt-image-2`                              | `OPENAI_API_KEY`                       |
| Генерація зображень OpenAI з автентифікацією через підписку Codex | `openai/gpt-image-2`                    | OpenAI Codex OAuth                     |
| OpenAI PNG/WebP із прозорим фоном                    | `openai/gpt-image-1.5`                            | `OPENAI_API_KEY` або OpenAI Codex OAuth |
| Генерація зображень OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| Генерація зображень LiteLLM                          | `litellm/gpt-image-2`                             | `LITELLM_API_KEY`                      |
| Генерація зображень Google Gemini                    | `google/gemini-3.1-flash-image-preview`           | `GEMINI_API_KEY` або `GOOGLE_API_KEY`  |

Той самий інструмент `image_generate` обробляє як генерацію з тексту в зображення, так і
редагування з опорним зображенням. Використовуйте `image` для одного опорного зображення
або `images` для кількох опорних зображень.
Підказки для виводу, які підтримуються провайдером, як-от `quality`, `outputFormat` і
специфічний для OpenAI `background`, передаються далі, коли це можливо, і позначаються як
ігноровані, якщо провайдер їх не підтримує.

## Підтримувані провайдери

| Провайдер | Типова модель                          | Підтримка редагування               | Автентифікація                                        |
| --------- | -------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| OpenAI    | `gpt-image-2`                          | Так (до 4 зображень)                | `OPENAI_API_KEY` або OpenAI Codex OAuth               |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Так (до 5 вхідних зображень)      | `OPENROUTER_API_KEY`                                  |
| LiteLLM   | `gpt-image-2`                          | Так (до 5 вхідних зображень)        | `LITELLM_API_KEY`                                     |
| Google    | `gemini-3.1-flash-image-preview`       | Так                                 | `GEMINI_API_KEY` або `GOOGLE_API_KEY`                 |
| fal       | `fal-ai/flux/dev`                      | Так                                 | `FAL_KEY`                                             |
| MiniMax   | `image-01`                             | Так (опорне зображення об’єкта)     | `MINIMAX_API_KEY` або MiniMax OAuth (`minimax-portal`) |
| ComfyUI   | `workflow`                             | Так (1 зображення, задається workflow) | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для хмари |
| Vydra     | `grok-imagine`                         | Ні                                  | `VYDRA_API_KEY`                                       |
| xAI       | `grok-imagine-image`                   | Так (до 5 зображень)                | `XAI_API_KEY`                                         |

Використовуйте `action: "list"`, щоб переглянути доступні провайдери й моделі під час виконання:

```text
/tool image_generate action=list
```

## Параметри інструмента

<ParamField path="prompt" type="string" required>
Промпт для генерації зображення. Обов’язковий для `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Використовуйте `"list"`, щоб переглянути доступні провайдери й моделі під час виконання.
</ParamField>

<ParamField path="model" type="string">
Перевизначення провайдера/моделі, наприклад `openai/gpt-image-2`; використовуйте
`openai/gpt-image-1.5` для прозорого фону в OpenAI.
</ParamField>

<ParamField path="image" type="string">
Шлях або URL одного опорного зображення для режиму редагування.
</ParamField>

<ParamField path="images" type="string[]">
Кілька опорних зображень для режиму редагування (до 5).
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

Не всі провайдери підтримують усі параметри. Коли резервний провайдер підтримує
близький варіант геометрії замість точно запитаного, OpenClaw перед відправленням
перемаповує на найближчий підтримуваний `size`, `aspectRatio` або `resolution`.
Непідтримувані підказки виводу, такі як `quality` або `outputFormat`, відкидаються
для провайдерів, які не заявляють про їх підтримку, і відображаються в результаті інструмента.

Результати інструмента показують застосовані параметри. Коли OpenClaw перемаповує
геометрію під час резервного переходу до провайдера, повернуті значення `size`,
`aspectRatio` і `resolution` відображають те, що було фактично надіслано, а
`details.normalization` фіксує перетворення від запитаного до застосованого.

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
2. **`imageGenerationModel.primary`** із конфігурації
3. **`imageGenerationModel.fallbacks`** по черзі
4. **Автовизначення** — використовуються лише типові значення провайдерів із доступною автентифікацією:
   - спочатку поточний типовий провайдер
   - потім решта зареєстрованих провайдерів генерації зображень у порядку provider-id

Якщо провайдер завершується помилкою (помилка автентифікації, ліміт запитів тощо), автоматично пробується наступний налаштований кандидат. Якщо не вдається жоден, помилка містить подробиці кожної спроби.

Примітки:

- Перевизначення `model` для окремого виклику є точним: OpenClaw пробує лише цю пару провайдер/модель
  і не переходить далі до налаштованих primary/fallback або автовизначених
  провайдерів.
- Автовизначення враховує автентифікацію. Типовий провайдер потрапляє до списку кандидатів
  лише тоді, коли OpenClaw справді може автентифікуватися в цьому провайдері.
- Автовизначення увімкнене за замовчуванням. Встановіть
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо хочете, щоб генерація зображень
  використовувала лише явні записи `model`, `primary` і `fallbacks`.
- Встановіть `agents.defaults.imageGenerationModel.timeoutMs` для повільних бекендів зображень.
  Параметр інструмента `timeoutMs` для окремого виклику перевизначає значення з конфігурації.
- Використовуйте `action: "list"`, щоб переглянути поточно зареєстрованих провайдерів, їхні
  типові моделі та підказки щодо env vars для автентифікації.

### Редагування зображень

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI і xAI підтримують редагування
опорних зображень. Передайте шлях або URL опорного зображення:

```text
"Створи акварельну версію цього фото" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google і xAI підтримують до 5 опорних зображень через параметр `images`. fal, MiniMax і ComfyUI підтримують 1.

### Моделі зображень OpenRouter

Генерація зображень OpenRouter використовує той самий `OPENROUTER_API_KEY` і працює через OpenRouter chat completions image API. Вибирайте моделі зображень OpenRouter з префіксом `openrouter/`:

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

OpenClaw передає в OpenRouter `prompt`, `count`, опорні зображення та сумісні з Gemini підказки `aspectRatio` / `resolution`. Поточні вбудовані скорочення для моделей зображень OpenRouter включають `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` і `openai/gpt-5.4-image-2`; використовуйте `action: "list"`, щоб побачити, що надає ваш налаштований Plugin.

### OpenAI `gpt-image-2`

Генерація зображень OpenAI за замовчуванням використовує `openai/gpt-image-2`. Якщо
налаштовано OAuth-профіль `openai-codex`, OpenClaw повторно використовує той самий OAuth-профіль,
який Codex використовує для чат-моделей із підпискою, і надсилає запит на зображення
через бекенд Codex Responses. Застарілі базові URL Codex, такі як
`https://chatgpt.com/backend-api`, канонікалізуються до
`https://chatgpt.com/backend-api/codex` для запитів на зображення. Для такого запиту
не виконується безшумний перехід на `OPENAI_API_KEY`. Щоб примусово використовувати прямий маршрут
OpenAI Images API, явно налаштуйте `models.providers.openai` з API-ключем,
користувацьким base URL або кінцевою точкою Azure. Моделі `openai/gpt-image-1.5`,
`openai/gpt-image-1` і `openai/gpt-image-1-mini` усе ще можна явно вибрати.
Використовуйте `gpt-image-1.5` для PNG/WebP із прозорим фоном; поточний API `gpt-image-2`
відхиляє `background: "transparent"`.

`gpt-image-2` підтримує і генерацію зображень із тексту, і редагування
опорних зображень через той самий інструмент `image_generate`. OpenClaw передає в OpenAI
`prompt`, `count`, `size`, `quality`, `outputFormat` і опорні зображення.
OpenAI не отримує `aspectRatio` або `resolution` безпосередньо; коли можливо,
OpenClaw відображає їх у підтримуваний `size`, інакше інструмент повідомляє про них як
про ігноровані перевизначення.

Параметри, специфічні для OpenAI, задаються в об’єкті `openai`:

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

`openai.background` приймає значення `transparent`, `opaque` або `auto`; для
прозорих результатів потрібні `outputFormat` `png` або `webp` і модель OpenAI
для зображень із підтримкою прозорості. OpenClaw спрямовує типові запити
`gpt-image-2` із прозорим фоном до `gpt-image-1.5`. `openai.outputCompression`
застосовується до результатів JPEG/WebP.

Коли ви просите агента створити OpenAI-зображення з прозорим фоном, очікуваний
виклик інструмента має вигляд:

```json
{
  "model": "openai/gpt-image-1.5",
  "prompt": "A simple red circle sticker on a transparent background",
  "outputFormat": "png",
  "openai": {
    "background": "transparent"
  }
}
```

Явно вказана модель `openai/gpt-image-1.5` зберігає переносимість запиту між
підсумками інструментів і harness-оточеннями. Якщо агент натомість використовує
типову `openai/gpt-image-2` з `openai.background: "transparent"` у публічному
маршруті OpenAI або OpenAI Codex OAuth, OpenClaw переписує запит до провайдера на
`gpt-image-1.5`. Azure і користувацькі сумісні з OpenAI кінцеві точки зберігають
свої налаштовані назви deployment/model.

Для headless-генерації в CLI використовуйте еквівалентні прапорці `openclaw infer`:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --openai-background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Ті самі прапорці `--output-format` і `--openai-background` доступні в
`openclaw infer image edit`. Інші вбудовані провайдери можуть повертати PNG і
можуть зберігати alpha-канал, якщо їхній бекенд його видає, але OpenClaw
надає явне керування прозорим фоном лише для генерації зображень OpenAI.

Згенерувати одне 4K-зображення в альбомній орієнтації:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Згенерувати прозорий PNG:

```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png openai='{"background":"transparent"}'
```

Згенерувати два квадратні зображення:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Відредагувати одне локальне опорне зображення:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Редагування з кількома опорними зображеннями:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Щоб спрямувати генерацію зображень OpenAI через deployment Azure OpenAI замість
`api.openai.com`, див. [Azure OpenAI endpoints](/uk/providers/openai#azure-openai-endpoints)
у документації провайдера OpenAI.

Генерація зображень MiniMax доступна через обидва вбудовані шляхи автентифікації MiniMax:

- `minimax/image-01` для конфігурацій з API-ключем
- `minimax-portal/image-01` для конфігурацій з OAuth

## Можливості провайдерів

| Можливість            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Генерація             | Так (до 4)           | Так (до 4)           | Так (до 4)          | Так (до 9)                 | Так (виходи визначаються workflow) | Так (1) | Так (до 4)           |
| Редагування/опорні зображення | Так (до 5 зображень) | Так (до 5 зображень) | Так (1 зображення) | Так (1 зображення, опорне зображення об’єкта) | Так (1 зображення, задається workflow) | Ні      | Так (до 5 зображень) |
| Керування розміром    | Так (до 4K)          | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Ні                   |
| Співвідношення сторін | Ні                   | Так                  | Так (лише генерація) | Так                       | Ні                                 | Ні      | Так                  |
| Роздільна здатність (1K/2K/4K) | Ні            | Так                  | Так                 | Ні                         | Ні                                 | Ні      | Так (1K/2K)          |

### xAI `grok-imagine-image`

Вбудований провайдер xAI використовує `/v1/images/generations` для запитів лише з промптом
і `/v1/images/edits`, коли присутній `image` або `images`.

- Моделі: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Кількість: до 4
- Опорні зображення: один `image` або до п’яти `images`
- Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Роздільні здатності: `1K`, `2K`
- Результати: повертаються як вкладення зображень, якими керує OpenClaw

OpenClaw навмисно не надає специфічні для xAI параметри `quality`, `mask`, `user` або
додаткові нативні співвідношення сторін, доки ці елементи керування не з’являться
в спільному міжпровайдерному контракті `image_generate`.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [fal](/uk/providers/fal) — налаштування провайдера зображень і відео fal
- [ComfyUI](/uk/providers/comfy) — налаштування локального workflow ComfyUI і Comfy Cloud
- [Google (Gemini)](/uk/providers/google) — налаштування провайдера зображень Gemini
- [MiniMax](/uk/providers/minimax) — налаштування провайдера зображень MiniMax
- [OpenAI](/uk/providers/openai) — налаштування провайдера OpenAI Images
- [Vydra](/uk/providers/vydra) — налаштування зображень, відео та мовлення Vydra
- [xAI](/uk/providers/xai) — налаштування Grok для зображень, відео, пошуку, виконання коду та TTS
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults) — конфігурація `imageGenerationModel`
- [Моделі](/uk/concepts/models) — конфігурація моделей і failover
