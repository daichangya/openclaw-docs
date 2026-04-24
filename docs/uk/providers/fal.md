---
read_when:
    - Ви хочете використовувати генерацію зображень fal в OpenClaw
    - Вам потрібен потік автентифікації FAL_KEY
    - Ви хочете типові значення fal для `image_generate` або `video_generate`
summary: Налаштування генерації зображень і відео через fal в OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-24T03:48:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw постачається з вбудованим провайдером `fal` для хостованої генерації зображень і відео.

| Властивість | Значення                                                      |
| ----------- | ------------------------------------------------------------- |
| Провайдер   | `fal`                                                         |
| Auth        | `FAL_KEY` (канонічний; `FAL_API_KEY` також працює як fallback) |
| API         | endpoint моделей fal                                          |

## Початок роботи

<Steps>
  <Step title="Установіть API key">
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

Вбудований провайдер генерації зображень `fal` типово використовує
`fal/fal-ai/flux/dev`.

| Можливість      | Значення                   |
| --------------- | -------------------------- |
| Макс. зображень | 4 на запит                 |
| Режим редагування | Увімкнено, 1 еталонне зображення |
| Перевизначення size | Підтримується           |
| Співвідношення сторін | Підтримується         |
| Resolution      | Підтримується              |

<Warning>
Endpoint редагування зображень fal **не** підтримує перевизначення `aspectRatio`.
</Warning>

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

Вбудований провайдер генерації відео `fal` типово використовує
`fal/fal-ai/minimax/video-01-live`.

| Можливість | Значення                                                        |
| ---------- | --------------------------------------------------------------- |
| Режими     | Text-to-video, еталон одного зображення                         |
| Runtime    | Потік submit/status/result на основі черги для довготривалих завдань |

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
Використовуйте `openclaw models list --provider fal`, щоб побачити повний список доступних моделей fal, включно з нещодавно доданими записами.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="Довідка з конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Типові значення агента, включно з вибором моделей зображень і відео.
  </Card>
</CardGroup>
