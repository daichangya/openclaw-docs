---
read_when:
    - Вам потрібен один API-ключ для багатьох LLMів
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
summary: Використовуйте уніфікований API OpenRouter, щоб отримати доступ до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-12T10:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9083c30b9e9846a9d4ef071c350576d4c3083475f4108871eabbef0b9bb9a368
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter надає **уніфікований API**, який спрямовує запити до багатьох моделей через єдину
кінцеву точку та API-ключ. Він сумісний з OpenAI, тож більшість OpenAI SDK працюють, якщо змінити базовий URL.

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Необов’язково) Перейдіть на конкретну модель">
    Під час онбордингу за замовчуванням використовується `openrouter/auto`. Пізніше виберіть конкретну модель:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Приклад конфігурації

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

## Посилання на моделі

<Note>
Посилання на моделі відповідають шаблону `openrouter/<provider>/<model>`. Повний список
доступних провайдерів і моделей дивіться в [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

## Автентифікація та заголовки

OpenRouter під капотом використовує Bearer-токен з вашим API-ключем.

Для реальних запитів OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані заголовки атрибуції застосунку OpenRouter:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Якщо ви перенаправите провайдер OpenRouter на якийсь інший проксі або базовий URL, OpenClaw
**не** додає ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання на моделі Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання кешу промптів у блоках системного промпту та промпту розробника.
  </Accordion>

  <Accordion title="Ін’єкція thinking / reasoning">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking із
    проксі-payload reasoning OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають цю ін’єкцію reasoning.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще працює через сумісний з OpenAI проксі-шлях, тож
    нативне формування запитів лише для OpenAI, як-от `serviceTier`, Responses `store`,
    payload сумісності reasoning OpenAI та підказки кешу промптів, не пересилається далі.
  </Accordion>

  <Accordion title="Маршрути на основі Gemini">
    Посилання OpenRouter на основі Gemini залишаються на проксі-шляху Gemini: OpenClaw зберігає
    там санітизацію thought-signature Gemini, але не вмикає нативну перевірку
    повторного відтворення Gemini або bootstrap-перезаписи.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter у параметрах моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних обгорток потоку.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання у разі збою.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник з конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
