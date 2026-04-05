---
read_when:
    - Ви хочете використовувати Fireworks з OpenClaw
    - Вам потрібна env-змінна API-ключа Fireworks або id типової моделі
summary: Налаштування Fireworks (автентифікація + вибір моделі)
x-i18n:
    generated_at: "2026-04-05T18:13:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20083d5c248abd9a7223e6d188f0265ae27381940ee0067dff6d1d46d908c552
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) надає open-weight і routed models через OpenAI-сумісний API. OpenClaw тепер містить вбудований плагін провайдера Fireworks.

- Провайдер: `fireworks`
- Автентифікація: `FIREWORKS_API_KEY`
- API: OpenAI-сумісні chat/completions
- Base URL: `https://api.fireworks.ai/inference/v1`
- Типова модель: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## Швидкий старт

Налаштуйте автентифікацію Fireworks через онбординг:

```bash
openclaw onboard --auth-choice fireworks-api-key
```

Це збереже ваш ключ Fireworks у конфігурації OpenClaw і встановить стартову модель Fire Pass як типову.

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Примітка про середовище

Якщо Gateway працює поза вашою інтерактивною оболонкою, переконайтеся, що `FIREWORKS_API_KEY`
також доступний цьому процесу. Ключ, що зберігається лише в `~/.profile`, не
допоможе демону launchd/systemd, якщо це середовище також не буде імпортоване туди.

## Вбудований каталог

| Посилання на модель                                     | Назва                       | Вхід       | Контекст | Макс. вивід | Примітки                                     |
| ------------------------------------------------------- | --------------------------- | ---------- | -------- | ----------- | -------------------------------------------- |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000     | Типова вбудована стартова модель у Fireworks |

## Користувацькі id моделей Fireworks

OpenClaw також приймає динамічні id моделей Fireworks. Використовуйте точний id моделі або router, показаний у Fireworks, і додайте до нього префікс `fireworks/`.

Приклад:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

Якщо Fireworks опублікує новішу модель, наприклад свіжий випуск Qwen або Gemma, ви можете одразу переключитися на неї, використавши її id моделі Fireworks без очікування оновлення вбудованого каталогу.
