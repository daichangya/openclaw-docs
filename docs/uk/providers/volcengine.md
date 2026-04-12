---
read_when:
    - Ви хочете використовувати Volcano Engine або моделі Doubao з OpenClaw
    - Вам потрібно налаштувати API-ключ Volcengine
summary: Налаштування Volcano Engine (моделі Doubao, загальні кінцеві точки + кінцеві точки для кодування)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-12T10:26:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a21f390da719f79c88c6d55a7d952d35c2ce5ff26d910c9f10020132cd7d2f4c
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Провайдер Volcengine надає доступ до моделей Doubao та сторонніх моделей,
розміщених у Volcano Engine, з окремими кінцевими точками для загальних
навантажень і навантажень для кодування.

| Detail    | Value                                                   |
| --------- | ------------------------------------------------------- |
| Providers | `volcengine` (загальні) + `volcengine-plan` (кодування) |
| Auth      | `VOLCANO_ENGINE_API_KEY`                                |
| API       | сумісний з OpenAI                                       |

## Початок роботи

<Steps>
  <Step title="Встановіть API-ключ">
    Запустіть інтерактивне онбординг-налаштування:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Це реєструє обидва провайдери — загальний (`volcengine`) і для кодування (`volcengine-plan`) — за одним API-ключем.

  </Step>
  <Step title="Установіть модель за замовчуванням">
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
Для неінтерактивного налаштування (CI, скрипти) передайте ключ напряму:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Провайдери та кінцеві точки

| Provider          | Endpoint                                  | Use case         |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Загальні моделі  |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Моделі кодування |

<Note>
Обидва провайдери налаштовуються за одним API-ключем. Під час налаштування обидва реєструються автоматично.
</Note>

## Доступні моделі

<Tabs>
  <Tab title="Загальні (volcengine)">
    | Model ref                                    | Name                            | Input       | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="Кодування (volcengine-plan)">
    | Model ref                                         | Name                     | Input | Context |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |
  </Tab>
</Tabs>

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Модель за замовчуванням після онбордингу">
    `openclaw onboard --auth-choice volcengine-api-key` наразі встановлює
    `volcengine-plan/ark-code-latest` як модель за замовчуванням, одночасно реєструючи
    загальний каталог `volcengine`.
  </Accordion>

  <Accordion title="Резервна поведінка засобу вибору моделей">
    Під час онбордингу/налаштування вибору моделі варіант автентифікації Volcengine надає перевагу
    рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі
    ще не завантажені, OpenClaw повертається до нефільтрованого каталогу замість
    показу порожнього засобу вибору, обмеженого провайдером.
  </Accordion>

  <Accordion title="Змінні середовища для процесів демона">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що
    `VOLCANO_ENGINE_API_KEY` доступний цьому процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Коли OpenClaw працює як фоновий сервіс, змінні середовища, установлені у вашій
інтерактивній оболонці, не успадковуються автоматично. Див. примітку про демон вище.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання на резервний варіант.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації для агентів, моделей і провайдерів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
  <Card title="FAQ" href="/uk/help/faq" icon="circle-question">
    Поширені запитання про налаштування OpenClaw.
  </Card>
</CardGroup>
