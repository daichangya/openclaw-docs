---
read_when:
    - Ви хочете використовувати генерацію відео Runway в OpenClaw
    - Вам потрібне налаштування API key/env для Runway
    - Ви хочете зробити Runway типовим провайдером відео
summary: Налаштування генерації відео Runway в OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-24T03:48:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw постачається з вбудованим провайдером `runway` для hosted-генерації відео.

| Property    | Value                                                             |
| ----------- | ----------------------------------------------------------------- |
| Provider id | `runway`                                                          |
| Auth        | `RUNWAYML_API_SECRET` (канонічний) або `RUNWAY_API_KEY`           |
| API         | Генерація відео Runway на основі завдань (`GET /v1/tasks/{id}` polling) |

## Швидкий старт

<Steps>
  <Step title="Задайте API key">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Зробіть Runway типовим провайдером відео">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Згенеруйте відео">
    Попросіть агента згенерувати відео. Runway буде використано автоматично.
  </Step>
</Steps>

## Підтримувані режими

| Mode           | Model              | Reference input              |
| -------------- | ------------------ | ---------------------------- |
| Text-to-video  | `gen4.5` (типово)  | Немає                        |
| Image-to-video | `gen4.5`           | 1 локальне або віддалене зображення |
| Video-to-video | `gen4_aleph`       | 1 локальне або віддалене відео |

<Note>
Підтримуються локальні reference image і video через data URI. Для запусків лише з текстом
наразі доступні співвідношення сторін `16:9` і `9:16`.
</Note>

<Warning>
Video-to-video наразі вимагає саме `runway/gen4_aleph`.
</Warning>

## Конфігурація

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Псевдоніми змінних середовища">
    OpenClaw розпізнає і `RUNWAYML_API_SECRET` (канонічний), і `RUNWAY_API_KEY`.
    Будь-яка з цих змінних автентифікує провайдера Runway.
  </Accordion>

  <Accordion title="Опитування завдань">
    Runway використовує API на основі завдань. Після надсилання запиту на генерацію OpenClaw
    опитує `GET /v1/tasks/{id}` доти, доки відео не буде готове. Додаткове
    налаштування для цієї поведінки polling не потрібне.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента, вибір провайдера та асинхронна поведінка.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Типові налаштування агентів, включно з моделлю генерації відео.
  </Card>
</CardGroup>
