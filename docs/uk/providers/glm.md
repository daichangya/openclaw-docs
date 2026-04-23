---
read_when:
    - Ви хочете використовувати моделі GLM в OpenClaw
    - Вам потрібні схема іменування моделей і налаштування
summary: Огляд сімейства моделей GLM + як використовувати його в OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-23T23:04:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# Моделі GLM

GLM — це **сімейство моделей** (а не компанія), доступне через платформу Z.AI. В OpenClaw моделі
GLM доступні через провайдера `zai` та id моделей на кшталт `zai/glm-5`.

## Початок роботи

<Steps>
  <Step title="Виберіть шлях auth і запустіть onboarding">
    Виберіть варіант onboarding, який відповідає вашому тарифному плану та регіону Z.AI:

    | Варіант auth | Найкраще підходить для |
    | ------------ | ---------------------- |
    | `zai-api-key` | Загального налаштування API key з автовизначенням endpoint |
    | `zai-coding-global` | Користувачів Coding Plan (глобально) |
    | `zai-coding-cn` | Користувачів Coding Plan (регіон Китай) |
    | `zai-global` | Загального API (глобально) |
    | `zai-cn` | Загального API (регіон Китай) |

    ```bash
    # Example: generic auto-detect
    openclaw onboard --auth-choice zai-api-key

    # Example: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Зробіть GLM типовою моделлю">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Переконайтеся, що моделі доступні">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Приклад config

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` дає змогу OpenClaw визначити відповідний endpoint Z.AI за ключем і
автоматично застосувати правильний base URL. Використовуйте явні регіональні варіанти,
коли хочете примусово вибрати конкретний Coding Plan або загальну поверхню API.
</Tip>

## Вбудований catalog

Наразі OpenClaw ініціалізує вбудованого провайдера `zai` такими посиланнями GLM:

| Модель          | Модель           |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
Типове вбудоване посилання на модель — `zai/glm-5.1`. Версії GLM і доступність
можуть змінюватися; перевіряйте документацію Z.AI для найактуальнішої інформації.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Автовизначення endpoint">
    Коли ви використовуєте варіант auth `zai-api-key`, OpenClaw аналізує формат ключа,
    щоб визначити правильний base URL Z.AI. Явні регіональні варіанти
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) перевизначають
    автовизначення і жорстко закріплюють endpoint.
  </Accordion>

  <Accordion title="Докладніше про провайдера">
    Моделі GLM обслуговуються runtime-провайдером `zai`. Повну конфігурацію
    провайдера, регіональні endpoint і додаткові можливості див. у
    [документації провайдера Z.AI](/uk/providers/zai).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдер Z.AI" href="/uk/providers/zai" icon="server">
    Повна конфігурація провайдера Z.AI та регіональні endpoint.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
</CardGroup>
