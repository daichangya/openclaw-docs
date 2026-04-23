---
read_when:
    - Ви хочете використовувати Volcano Engine або моделі Doubao з OpenClaw
    - Вам потрібне налаштування API key для Volcengine
summary: Налаштування Volcano Engine (моделі Doubao, загальні endpoint-и та endpoint-и для кодування)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-23T23:06:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

Провайдер Volcengine надає доступ до моделей Doubao і сторонніх моделей,
розміщених у Volcano Engine, з окремими endpoint-ами для загальних і coding-
навантажень.

| Деталь    | Значення                                            |
| --------- | --------------------------------------------------- |
| Провайдери | `volcengine` (загальний) + `volcengine-plan` (coding) |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | Сумісний з OpenAI                                   |

## Початок роботи

<Steps>
  <Step title="Задайте API key">
    Запустіть інтерактивний онбординг:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Це реєструє і загальний (`volcengine`), і coding (`volcengine-plan`) провайдери з одного API key.

  </Step>
  <Step title="Задайте типову модель">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Для неінтерактивного налаштування (CI, сценарії) передайте ключ напряму:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Провайдери та endpoint-и

| Провайдер         | Endpoint                                  | Сценарій використання |
| ----------------- | ----------------------------------------- | --------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Загальні моделі       |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Coding-моделі         |

<Note>
Обидва провайдери налаштовуються з одного API key. Налаштування автоматично реєструє обидва.
</Note>

## Вбудований каталог

<Tabs>
  <Tab title="Загальний (volcengine)">
    | Посилання на модель                           | Назва                           | Вхід        | Контекст |
    | --------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                 | text, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028 | text, image | 256,000  |
    | `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                       | text, image | 256,000  |
    | `volcengine/glm-4-7-251222`                   | GLM 4.7                         | text, image | 200,000  |
    | `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                   | text, image | 128,000  |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Посилання на модель                                | Назва                    | Вхід | Контекст |
    | -------------------------------------------------- | ------------------------ | ---- | -------- |
    | `volcengine-plan/ark-code-latest`                  | Ark Coding Plan          | text | 256,000  |
    | `volcengine-plan/doubao-seed-code`                 | Doubao Seed Code         | text | 256,000  |
    | `volcengine-plan/glm-4.7`                          | GLM 4.7 Coding           | text | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                 | Kimi K2 Thinking         | text | 256,000  |
    | `volcengine-plan/kimi-k2.5`                        | Kimi K2.5 Coding         | text | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028`  | Doubao Seed Code Preview | text | 256,000  |
  </Tab>
</Tabs>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Типова модель після онбордингу">
    `openclaw onboard --auth-choice volcengine-api-key` наразі задає
    `volcengine-plan/ark-code-latest` як типову модель, водночас реєструючи
    загальний каталог `volcengine`.
  </Accordion>

  <Accordion title="Поведінка fallback у виборі моделі">
    Під час вибору моделі в onboarding/configure варіант auth Volcengine надає перевагу
    рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не
    завантажено, OpenClaw повертається до нефільтрованого каталогу замість показу
    порожнього picker-а з scope провайдера.
  </Accordion>

  <Accordion title="Змінні середовища для daemon-процесів">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що
    `VOLCANO_ENGINE_API_KEY` доступний цьому процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Коли OpenClaw працює як фонова служба, змінні середовища, задані у вашому
інтерактивному shell, не успадковуються автоматично. Див. примітку про daemon вище.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми й кроки налагодження.
  </Card>
  <Card title="FAQ" href="/uk/help/faq" icon="circle-question">
    Поширені запитання про налаштування OpenClaw.
  </Card>
</CardGroup>
