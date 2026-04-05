---
read_when:
    - Ви хочете один API-ключ для багатьох LLM
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-05T18:14:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dd354ba060bcb47724c89ae17c8e2af8caecac4bd996fcddb584716c1840b87
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter надає **уніфікований API**, який маршрутизує запити до багатьох моделей через один
endpoint і API-ключ. Він сумісний з OpenAI, тому більшість SDK OpenAI працюють після зміни base URL.

## Налаштування CLI

```bash
openclaw onboard --auth-choice openrouter-api-key
```

## Фрагмент конфігурації

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Примітки

- Посилання на моделі мають формат `openrouter/<provider>/<model>`.
- Під час онбордингу типовим значенням є `openrouter/auto`. Пізніше переключіться на конкретну модель за допомогою
  `openclaw models set openrouter/<provider>/<model>`.
- Щоб переглянути більше варіантів моделей/провайдерів, див. [/concepts/model-providers](/uk/concepts/model-providers).
- OpenRouter під капотом використовує Bearer token з вашим API-ключем.
- Для справжніх запитів OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також
  додає документовані OpenRouter заголовки атрибуції застосунку:
  `HTTP-Referer: https://openclaw.ai`, `X-OpenRouter-Title: OpenClaw` і
  `X-OpenRouter-Categories: cli-agent`.
- На перевірених маршрутах OpenRouter посилання на моделі Anthropic також зберігають
  специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
  кращого повторного використання prompt-cache у блоках системних prompt/developer prompt.
- Якщо ви перенаправите провайдера OpenRouter на якийсь інший proxy/base URL, OpenClaw
  не додаватиме ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
- OpenRouter усе ще працює через проксі-подібний OpenAI-сумісний шлях, тому
  формування запитів, притаманне лише OpenAI, таке як `serviceTier`, `store` для Responses,
  payload сумісності reasoning OpenAI і підказки prompt-cache, не пересилається.
- Посилання OpenRouter на основі Gemini залишаються на проксі-шляху Gemini: OpenClaw зберігає
  там очищення thought-signature Gemini, але не вмикає власну перевірку replay Gemini
  або bootstrap rewrites.
- На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking
  із proxy payload reasoning OpenRouter. Непідтримувані підказки моделі та
  `openrouter/auto` пропускають це впровадження reasoning.
- Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
  її як метадані маршрутизації OpenRouter до запуску спільних обгорток потоку.
