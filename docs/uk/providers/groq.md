---
read_when:
    - Ви хочете використовувати Groq з OpenClaw
    - Вам потрібна env var для API key або варіант auth у CLI
summary: Налаштування Groq (auth + вибір моделі)
title: Groq
x-i18n:
    generated_at: "2026-04-23T23:04:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c711297d42dea7fabe8ba941f75ef9dc82bd9b838f78d5dc4385210d9f65ade
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) надає надшвидкий inference на open-source моделях
(Llama, Gemma, Mistral та інших) із використанням власного апаратного забезпечення LPU. OpenClaw підключається
до Groq через його API, сумісний з OpenAI.

| Властивість | Значення          |
| ----------- | ----------------- |
| Провайдер   | `groq`            |
| Auth        | `GROQ_API_KEY`    |
| API         | OpenAI-compatible |

## Початок роботи

<Steps>
  <Step title="Отримайте API key">
    Створіть API key на [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Установіть API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Задайте стандартну модель">
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

### Приклад файлу конфігурації

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

## Вбудований каталог

Каталог моделей Groq часто змінюється. Виконайте `openclaw models list | grep groq`,
щоб побачити наразі доступні моделі, або перевірте
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Модель                      | Примітки                           |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Загального призначення, великий контекст |
| **Llama 3.1 8B Instant**    | Швидка, легка                      |
| **Gemma 2 9B**              | Компактна, ефективна               |
| **Mixtral 8x7B**            | Архітектура MoE, сильний reasoning |

<Tip>
Використовуйте `openclaw models list --provider groq`, щоб отримати найактуальніший список
моделей, доступних у вашому обліковому записі.
</Tip>

## Транскрибування аудіо

Groq також надає швидке транскрибування аудіо на базі Whisper. Коли його налаштовано як
провайдера розуміння медіа, OpenClaw використовує модель Groq `whisper-large-v3-turbo`
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
  <Accordion title="Подробиці транскрибування аудіо">
    | Властивість | Значення |
    |----------|-------|
    | Спільний шлях конфігурації | `tools.media.audio` |
    | Базовий URL за замовчуванням | `https://api.groq.com/openai/v1` |
    | Стандартна модель      | `whisper-large-v3-turbo` |
    | API endpoint       | OpenAI-compatible `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Примітка щодо environment">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GROQ_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).

    <Warning>
    Ключі, задані лише в інтерактивній оболонці, не видимі для процесів
    gateway, якими керує демон. Для постійної доступності використовуйте `~/.openclaw/.env` або конфігурацію `env.shellEnv`.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, зокрема налаштування провайдера й аудіо.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Панель Groq, документація API та ціни.
  </Card>
  <Card title="Список моделей Groq" href="https://console.groq.com/docs/models" icon="list">
    Офіційний каталог моделей Groq.
  </Card>
</CardGroup>
