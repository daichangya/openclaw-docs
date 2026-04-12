---
read_when:
    - Ви хочете використовувати Groq з OpenClaw
    - Вам потрібна змінна середовища ключа API або варіант автентифікації через CLI
summary: Налаштування Groq (автентифікація + вибір моделі)
title: Groq
x-i18n:
    generated_at: "2026-04-12T10:22:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613289efc36fedd002e1ebf9366e0e7119ea1f9e14a1dae773b90ea57100baee
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) надає надшвидке інференс-обчислення на моделях з відкритим кодом
(Llama, Gemma, Mistral та інших) з використанням власного обладнання LPU. OpenClaw підключається
до Groq через його OpenAI-сумісний API.

| Властивість | Значення         |
| ----------- | ---------------- |
| Провайдер   | `groq`           |
| Автентифікація     | `GROQ_API_KEY`    |
| API         | OpenAI-сумісний  |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ на [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Установіть API-ключ">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Установіть модель за замовчуванням">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Приклад файла конфігурації

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Доступні моделі

Каталог моделей Groq часто змінюється. Виконайте `openclaw models list | grep groq`,
щоб побачити наразі доступні моделі, або перегляньте
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Модель                      | Примітки                           |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Загального призначення, великий контекст |
| **Llama 3.1 8B Instant**    | Швидка, легка                      |
| **Gemma 2 9B**              | Компактна, ефективна               |
| **Mixtral 8x7B**            | Архітектура MoE, сильні міркування |

<Tip>
Використовуйте `openclaw models list --provider groq`, щоб отримати
найактуальніший список моделей, доступних для вашого облікового запису.
</Tip>

## Транскрибування аудіо

Groq також надає швидке транскрибування аудіо на базі Whisper. Якщо його налаштовано як
провайдера media-understanding, OpenClaw використовує модель Groq `whisper-large-v3-turbo`
для транскрибування голосових повідомлень через спільну поверхню `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Докладніше про транскрибування аудіо">
    | Властивість | Значення |
    |----------|-------|
    | Спільний шлях конфігурації | `tools.media.audio` |
    | Базовий URL за замовчуванням   | `https://api.groq.com/openai/v1` |
    | Модель за замовчуванням      | `whisper-large-v3-turbo` |
    | Кінцева точка API       | OpenAI-сумісна `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GROQ_API_KEY`
    доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).

    <Warning>
    Ключі, задані лише у вашій інтерактивній оболонці, не видимі для
    процесів Gateway, якими керує демон. Для постійної доступності використовуйте
    `~/.openclaw/.env` або конфігурацію `env.shellEnv`.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання при збоях.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями провайдера й аудіо.
  </Card>
  <Card title="Консоль Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Панель Groq, документація API та ціни.
  </Card>
  <Card title="Список моделей Groq" href="https://console.groq.com/docs/models" icon="list">
    Офіційний каталог моделей Groq.
  </Card>
</CardGroup>
