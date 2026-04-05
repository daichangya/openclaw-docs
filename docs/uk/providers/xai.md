---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте автентифікацію xAI або ідентифікатори моделей
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-05T18:15:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d11f27b48c69eed6324595977bca3506c7709424eef64cc73899f8d049148b82
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw постачається з bundled-плагіном провайдера `xai` для моделей Grok.

## Налаштування

1. Створіть API-ключ у консолі xAI.
2. Установіть `XAI_API_KEY` або виконайте:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Виберіть модель, наприклад:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

Тепер OpenClaw використовує xAI Responses API як bundled-транспорт xAI. Той самий
`XAI_API_KEY` також може використовуватися для `web_search` на базі Grok, повноцінного `x_search`
і віддаленого `code_execution`.
Якщо ви зберігаєте ключ xAI в `plugins.entries.xai.config.webSearch.apiKey`,
bundled-провайдер моделей xAI тепер також повторно використовує цей ключ як резервний варіант.
Налаштування `code_execution` розміщено в `plugins.entries.xai.config.codeExecution`.

## Поточний bundled-каталог моделей

Тепер OpenClaw містить такі сімейства моделей xAI з коробки:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Плагін також переспрямовує новіші ідентифікатори `grok-4*` і `grok-code-fast*`, якщо
вони дотримуються тієї самої форми API.

Примітки щодо швидких моделей:

- `grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*` — це
  поточні посилання Grok із підтримкою зображень у bundled-каталозі.
- `/fast on` або `agents.defaults.models["xai/<model>"].params.fastMode: true`
  переписує нативні запити xAI так:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Застарілі псевдоніми сумісності все ще нормалізуються до канонічних bundled-ідентифікаторів. Наприклад:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Вебпошук

Bundled-провайдер вебпошуку `grok` також використовує `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Відомі обмеження

- Наразі автентифікація підтримується лише через API-ключ. В OpenClaw ще немає потоку xAI OAuth/device-code.
- `grok-4.20-multi-agent-experimental-beta-0304` не підтримується у звичайному шляху провайдера xAI, оскільки вимагає іншої поверхні API upstream, ніж стандартний транспорт xAI в OpenClaw.

## Примітки

- OpenClaw автоматично застосовує xAI-специфічні виправлення сумісності для схем інструментів і викликів інструментів у спільному шляху виконання.
- Для нативних запитів xAI типово використовується `tool_stream: true`. Установіть
  `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
  вимкнути це.
- Bundled-обгортка xAI видаляє непідтримувані прапорці strict tool-schema і
  ключі payload reasoning перед надсиланням нативних запитів xAI.
- `web_search`, `x_search` і `code_execution` доступні як інструменти OpenClaw. OpenClaw вмикає конкретний вбудований інструмент xAI, який потрібен для кожного запиту інструмента, замість приєднання всіх нативних інструментів до кожного ходу чату.
- `x_search` і `code_execution` належать bundled-плагіну xAI, а не жорстко закодовані в core runtime моделі.
- `code_execution` — це віддалене виконання в sandbox xAI, а не локальний [`exec`](/tools/exec).
- Загальний огляд провайдерів див. у [Model providers](/providers/index).
