---
read_when:
    - Ви хочете використовувати генерацію відео Wan від Alibaba в OpenClaw
    - Вам потрібне налаштування API key Model Studio або DashScope для генерації відео
summary: Генерація відео Wan в Alibaba Model Studio в OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-24T03:47:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClaw постачається з вбудованим provider генерації відео `alibaba` для моделей Wan на
Alibaba Model Studio / DashScope.

- Provider: `alibaba`
- Бажаний спосіб auth: `MODELSTUDIO_API_KEY`
- Також підтримуються: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: асинхронна генерація відео DashScope / Model Studio

## Початок роботи

<Steps>
  <Step title="Задайте API key">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Задайте типову модель генерації відео">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Переконайтеся, що provider доступний">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Працюватиме будь-який із підтримуваних ключів auth (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`). Варіант onboarding `qwen-standard-api-key` налаштовує спільні облікові дані DashScope.
</Note>

## Вбудовані моделі Wan

Вбудований provider `alibaba` наразі реєструє:

| Посилання на модель      | Режим                         |
| ------------------------ | ----------------------------- |
| `alibaba/wan2.6-t2v`     | Текст у відео                 |
| `alibaba/wan2.6-i2v`     | Зображення у відео            |
| `alibaba/wan2.6-r2v`     | Reference-to-video            |
| `alibaba/wan2.6-r2v-flash` | Reference-to-video (швидко) |
| `alibaba/wan2.7-r2v`     | Reference-to-video            |

## Поточні обмеження

| Параметр              | Обмеження                                                 |
| --------------------- | --------------------------------------------------------- |
| Вихідні відео         | До **1** на запит                                         |
| Вхідні зображення     | До **1**                                                  |
| Вхідні відео          | До **4**                                                  |
| Тривалість            | До **10 секунд**                                          |
| Підтримувані керувальні параметри | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Reference image/video | Лише віддалені URL `http(s)`                              |

<Warning>
Режим reference image/video наразі вимагає **віддалені URL `http(s)`**. Локальні шляхи до файлів для reference inputs не підтримуються.
</Warning>

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Зв’язок із Qwen">
    Вбудований provider `qwen` також використовує розміщені в Alibaba endpoints DashScope для
    генерації відео Wan. Використовуйте:

    - `qwen/...`, якщо вам потрібна канонічна поверхня provider Qwen
    - `alibaba/...`, якщо вам потрібна пряма поверхня генерації відео Wan від постачальника

    Докладніше див. у [документації provider Qwen](/uk/providers/qwen).

  </Accordion>

  <Accordion title="Пріоритет ключів auth">
    OpenClaw перевіряє ключі auth в такому порядку:

    1. `MODELSTUDIO_API_KEY` (бажаний)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Будь-який із цих ключів пройде автентифікацію для provider `alibaba`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір provider.
  </Card>
  <Card title="Qwen" href="/uk/providers/qwen" icon="microchip">
    Налаштування provider Qwen та інтеграція DashScope.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Типові значення агентів і конфігурація моделі.
  </Card>
</CardGroup>
