---
read_when:
    - Ви хочете моделі Z.AI / GLM в OpenClaw
    - Вам потрібне просте налаштування `ZAI_API_KEY`
summary: Використання Z.AI (моделі GLM) з OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-23T23:06:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI — це API-платформа для моделей **GLM**. Вона надає REST API для GLM і використовує API-ключі
для автентифікації. Створіть свій API-ключ у консолі Z.AI. OpenClaw використовує provider `zai`
з API-ключем Z.AI.

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer auth)

## Початок роботи

<Tabs>
  <Tab title="Автовизначення endpoint">
    **Найкраще для:** більшості користувачів. OpenClaw визначає відповідний endpoint Z.AI за ключем і автоматично застосовує правильний base URL.

    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Установіть типову модель">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Явний регіональний endpoint">
    **Найкраще для:** користувачів, які хочуть примусово вибрати конкретний Coding Plan або загальну API-surface.

    <Steps>
      <Step title="Виберіть правильний варіант onboarding">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Установіть типову модель">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Вбудований каталог

Наразі OpenClaw заповнює bundled-provider `zai` такими значеннями:

| Model ref            | Notes            |
| -------------------- | ---------------- |
| `zai/glm-5.1`        | Типова модель    |
| `zai/glm-5`          |                  |
| `zai/glm-5-turbo`    |                  |
| `zai/glm-5v-turbo`   |                  |
| `zai/glm-4.7`        |                  |
| `zai/glm-4.7-flash`  |                  |
| `zai/glm-4.7-flashx` |                  |
| `zai/glm-4.6`        |                  |
| `zai/glm-4.6v`       |                  |
| `zai/glm-4.5`        |                  |
| `zai/glm-4.5-air`    |                  |
| `zai/glm-4.5-flash`  |                  |
| `zai/glm-4.5v`       |                  |

<Tip>
Моделі GLM доступні як `zai/<model>` (приклад: `zai/glm-5`). Типовий bundled model ref — `zai/glm-5.1`.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Forward-resolving невідомих моделей GLM-5">
    Невідомі id `glm-5*` усе ще forward-resolve у шляху bundled provider шляхом
    синтезу метаданих, що належать provider, із шаблону `glm-4.7`, коли id
    відповідає поточній формі сімейства GLM-5.
  </Accordion>

  <Accordion title="Потокове передавання tool-call">
    `tool_stream` типово ввімкнено для потокового передавання tool-call у Z.AI. Щоб вимкнути його:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Розуміння зображень">
    Bundled Plugin Z.AI реєструє розуміння зображень.

    | Property      | Value       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Розуміння зображень автоматично розв’язується з налаштованого auth Z.AI — жодної
    додаткової конфігурації не потрібно.

  </Accordion>

  <Accordion title="Деталі auth">
    - Z.AI використовує Bearer auth з вашим API-ключем.
    - Варіант onboarding `zai-api-key` автоматично визначає відповідний endpoint Z.AI за префіксом ключа.
    - Використовуйте явні регіональні варіанти (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), коли хочете примусово вибрати конкретну API-surface.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сімейство моделей GLM" href="/uk/providers/glm" icon="microchip">
    Огляд сімейства моделей GLM.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір providers, model ref і поведінки failover.
  </Card>
</CardGroup>
