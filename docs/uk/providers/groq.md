---
read_when:
    - Ви хочете використовувати Groq з OpenClaw
    - Вам потрібна env-змінна API-ключа або варіант автентифікації CLI
summary: Налаштування Groq (автентифікація + вибір моделі)
title: Groq
x-i18n:
    generated_at: "2026-04-05T18:14:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e27532cafcdaf1ac336fa310e08e4e3245d2d0eb0e94e0bcf42c532c6a9a80b
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) надає надшвидкий inference на open-source моделях
(Llama, Gemma, Mistral та інших) з використанням власного обладнання LPU. OpenClaw підключається
до Groq через його OpenAI-сумісний API.

- Провайдер: `groq`
- Автентифікація: `GROQ_API_KEY`
- API: OpenAI-сумісний

## Швидкий старт

1. Отримайте API-ключ на [console.groq.com/keys](https://console.groq.com/keys).

2. Установіть API-ключ:

```bash
export GROQ_API_KEY="gsk_..."
```

3. Установіть типову модель:

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Приклад файла конфігурації

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

## Аудіотранскрипція

Groq також надає швидку аудіотранскрипцію на базі Whisper. Коли його налаштовано як
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

## Примітка про середовище

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GROQ_API_KEY`
доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).

## Примітки щодо аудіо

- Спільний шлях конфігурації: `tools.media.audio`
- Типовий базовий URL аудіо Groq: `https://api.groq.com/openai/v1`
- Типова аудіомодель Groq: `whisper-large-v3-turbo`
- Аудіотранскрипція Groq використовує OpenAI-сумісний шлях `/audio/transcriptions`

## Доступні моделі

Каталог моделей Groq часто змінюється. Виконайте `openclaw models list | grep groq`,
щоб побачити наразі доступні моделі, або перегляньте
[console.groq.com/docs/models](https://console.groq.com/docs/models).

Популярні варіанти:

- **Llama 3.3 70B Versatile** - універсальна, великий контекст
- **Llama 3.1 8B Instant** - швидка, легка
- **Gemma 2 9B** - компактна, ефективна
- **Mixtral 8x7B** - архітектура MoE, сильне reasoning

## Посилання

- [Groq Console](https://console.groq.com)
- [Документація API](https://console.groq.com/docs)
- [Список моделей](https://console.groq.com/docs/models)
- [Ціни](https://groq.com/pricing)
