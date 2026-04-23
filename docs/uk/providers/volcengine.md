---
read_when:
    - Ви хочете використовувати Volcano Engine або моделі Doubao з OpenClaw
    - Вам потрібне налаштування API key Volcengine
summary: Налаштування Volcano Engine (моделі Doubao, endpoint загального призначення та для кодування)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-23T06:46:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Провайдер Volcengine надає доступ до моделей Doubao і сторонніх моделей,
розміщених у Volcano Engine, з окремими endpoint для загальних і кодингових
навантажень.

| Деталь     | Значення                                            |
| ---------- | --------------------------------------------------- |
| Провайдери | `volcengine` (загальні) + `volcengine-plan` (кодування) |
| Auth       | `VOLCANO_ENGINE_API_KEY`                            |
| API        | Сумісне з OpenAI                                    |

## Початок роботи

<Steps>
  <Step title="Задайте API key">
    Запустіть інтерактивний онбординг:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Це реєструє обидва провайдери — загальний (`volcengine`) і для кодування (`volcengine-plan`) — за одним API key.

  </Step>
  <Step title="Задайте стандартну модель">
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
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Для неінтерактивного налаштування (CI, скрипти) передайте key напряму:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Провайдери та endpoint

| Провайдер         | Endpoint                                  | Випадок використання |
| ----------------- | ----------------------------------------- | -------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Загальні моделі      |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Моделі для кодування |

<Note>
Обидва провайдери налаштовуються з одного API key. Під час налаштування обидва реєструються автоматично.
</Note>

## Доступні моделі

<Tabs>
  <Tab title="Загальні (volcengine)">
    | Посилання на модель                         | Назва                           | Вхід        | Контекст |
    | ------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`         | Doubao Seed 1.8                 | text, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000  |
    | `volcengine/kimi-k2-5-260127`               | Kimi K2.5                       | text, image | 256,000  |
    | `volcengine/glm-4-7-251222`                 | GLM 4.7                         | text, image | 200,000  |
    | `volcengine/deepseek-v3-2-251201`           | DeepSeek V3.2                   | text, image | 128,000  |
  </Tab>
  <Tab title="Кодування (volcengine-plan)">
    | Посилання на модель                              | Назва                    | Вхід | Контекст |
    | ------------------------------------------------ | ------------------------ | ---- | -------- |
    | `volcengine-plan/ark-code-latest`                | Ark Coding Plan          | text | 256,000  |
    | `volcengine-plan/doubao-seed-code`               | Doubao Seed Code         | text | 256,000  |
    | `volcengine-plan/glm-4.7`                        | GLM 4.7 Coding           | text | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`               | Kimi K2 Thinking         | text | 256,000  |
    | `volcengine-plan/kimi-k2.5`                      | Kimi K2.5 Coding         | text | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text | 256,000  |
  </Tab>
</Tabs>

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Стандартна модель після онбордингу">
    `openclaw onboard --auth-choice volcengine-api-key` наразі задає
    `volcengine-plan/ark-code-latest` як стандартну модель, одночасно реєструючи
    загальний каталог `volcengine`.
  </Accordion>

  <Accordion title="Резервна поведінка вибору моделі">
    Під час онбордингу/налаштування вибору моделі варіант автентифікації Volcengine віддає перевагу
    рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не
    завантажені, OpenClaw повертається до нефільтрованого каталогу замість показу
    порожнього вибору, обмеженого провайдером.
  </Accordion>

  <Accordion title="Змінні середовища для демон-процесів">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що
    `VOLCANO_ENGINE_API_KEY` доступний для цього процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Коли OpenClaw працює як фоновий сервіс, змінні середовища, задані у вашій
інтерактивній оболонці, не успадковуються автоматично. Див. примітку про демон вище.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
  <Card title="Усунення проблем" href="/uk/help/troubleshooting" icon="wrench">
    Типові проблеми та кроки налагодження.
  </Card>
  <Card title="FAQ" href="/uk/help/faq" icon="circle-question">
    Поширені запитання про налаштування OpenClaw.
  </Card>
</CardGroup>
