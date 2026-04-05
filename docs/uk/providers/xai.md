---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте автентифікацію xAI або ідентифікатори моделей
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-05T22:23:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64bc899655427cc10bdc759171c7d1ec25ad9f1e4f9d803f1553d3d586c6d71d
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw постачається з вбудованим plugin провайдера `xai` для моделей Grok.

## Налаштування

1. Створіть API-ключ у консолі xAI.
2. Встановіть `XAI_API_KEY` або виконайте:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Виберіть модель, наприклад:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

Тепер OpenClaw використовує xAI Responses API як вбудований транспорт xAI. Той самий
`XAI_API_KEY` також можна використовувати для `web_search` на базі Grok, нативного `x_search`
і віддаленого `code_execution`.
Якщо ви зберігаєте ключ xAI у `plugins.entries.xai.config.webSearch.apiKey`,
вбудований провайдер моделей xAI тепер також повторно використовує цей ключ як резервний варіант.
Налаштування `code_execution` розміщено в `plugins.entries.xai.config.codeExecution`.

## Поточний каталог вбудованих моделей

OpenClaw тепер містить ці сімейства моделей xAI з коробки:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Plugin також напряму визначає новіші ідентифікатори `grok-4*` і `grok-code-fast*`, коли
вони відповідають тій самій формі API.

Примітки щодо швидких моделей:

- `grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*` — це
  поточні посилання Grok з підтримкою зображень у вбудованому каталозі.
- `/fast on` або `agents.defaults.models["xai/<model>"].params.fastMode: true`
  переписує нативні запити xAI таким чином:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Застарілі псевдоніми сумісності, як і раніше, нормалізуються до канонічних вбудованих ідентифікаторів. Наприклад:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Вебпошук

Вбудований провайдер вебпошуку `grok` також використовує `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Генерація відео

Вбудований plugin `xai` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `xai/grok-imagine-video`
- Режими: text-to-video, image-to-video і віддалені потоки редагування/розширення відео
- Підтримує `aspectRatio` і `resolution`
- Поточне обмеження: локальні відеобуфери не приймаються; використовуйте віддалені URL-адреси `http(s)`
  для вхідних даних відео-посилань/редагування

Щоб використовувати xAI як провайдера відео за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "xai/grok-imagine-video",
      },
    },
  },
}
```

Перегляньте [Генерація відео](/uk/tools/video-generation) для спільних параметрів
інструмента, вибору провайдера та поведінки failover.

## Відомі обмеження

- Наразі автентифікація підтримується лише через API-ключ. Потоку OAuth/device-code для xAI в OpenClaw поки немає.
- `grok-4.20-multi-agent-experimental-beta-0304` не підтримується у звичайному шляху провайдера xAI, оскільки він потребує іншої поверхні API вищого рівня, ніж стандартний транспорт xAI в OpenClaw.

## Примітки

- OpenClaw автоматично застосовує виправлення сумісності, специфічні для xAI, для схем інструментів і викликів інструментів на спільному шляху виконання.
- Для нативних запитів xAI за замовчуванням встановлено `tool_stream: true`. Встановіть
  `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
  вимкнути це.
- Вбудована обгортка xAI видаляє непідтримувані прапорці strict tool-schema і
  ключі payload reasoning перед надсиланням нативних запитів xAI.
- `web_search`, `x_search` і `code_execution` надаються як інструменти OpenClaw. OpenClaw вмикає конкретну вбудовану можливість xAI, яка потрібна для кожного запиту інструмента, замість того щоб додавати всі нативні інструменти до кожного ходу чату.
- `x_search` і `code_execution` належать вбудованому plugin xAI, а не жорстко закодовані в основне середовище виконання моделей.
- `code_execution` — це віддалене виконання в sandbox xAI, а не локальний [`exec`](/uk/tools/exec).
- Загальний огляд провайдерів див. у розділі [Провайдери моделей](/uk/providers/index).
