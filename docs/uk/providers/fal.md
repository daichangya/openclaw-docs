---
read_when:
    - Ви хочете використовувати генерацію зображень fal в OpenClaw
    - Вам потрібен потік автентифікації `FAL_KEY`
    - Вам потрібні типові налаштування fal для `image_generate` або `video_generate`
summary: Налаштування генерації зображень і відео fal в OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-25T19:29:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26f28ff7c99dbe386fd2a42f8f85ae8bc34a1510decd302462ab9c8a4a8428ba
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw постачається з вбудованим провайдером `fal` для хостингової генерації зображень і відео.

| Властивість | Значення                                                     |
| ----------- | ------------------------------------------------------------ |
| Провайдер   | `fal`                                                        |
| Автентифікація | `FAL_KEY` (канонічний; `FAL_API_KEY` також працює як запасний варіант) |
| API         | кінцеві точки моделей fal                                    |

## Початок роботи

<Steps>
  <Step title="Установіть API-ключ">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Установіть типову модель зображень">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Генерація зображень

Вбудований провайдер генерації зображень `fal` за замовчуванням використовує
`fal/fal-ai/flux/dev`.

| Можливість    | Значення                   |
| ------------- | -------------------------- |
| Макс. зображень | 4 на запит                 |
| Режим редагування | Увімкнено, 1 еталонне зображення |
| Перевизначення розміру | Підтримуються              |
| Співвідношення сторін | Підтримується              |
| Роздільна здатність | Підтримується              |
| Формат виводу | `png` або `jpeg`           |

<Warning>
Кінцева точка редагування зображень fal **не** підтримує перевизначення `aspectRatio`.
</Warning>

Використовуйте `outputFormat: "png"`, коли вам потрібен вихід у форматі PNG. fal не оголошує в OpenClaw явний елемент керування прозорим фоном, тому `background:
"transparent"` позначається як проігнороване перевизначення для моделей fal.

Щоб використовувати fal як типовий провайдер зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Генерація відео

Вбудований провайдер генерації відео `fal` за замовчуванням використовує
`fal/fal-ai/minimax/video-01-live`.

| Можливість | Значення                                                    |
| ---------- | ----------------------------------------------------------- |
| Режими     | Текст у відео, одне еталонне зображення                     |
| Виконання  | Потік submit/status/result на основі черги для довготривалих завдань |

<AccordionGroup>
  <Accordion title="Доступні моделі відео">
    **Відеоагент HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Приклад конфігурації Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Приклад конфігурації відеоагента HeyGen">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
Використовуйте `openclaw models list --provider fal`, щоб переглянути повний список доступних моделей fal, включно з нещодавно доданими записами.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Типові значення агента, включно з вибором моделей зображень і відео.
  </Card>
</CardGroup>
