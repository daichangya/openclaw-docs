---
read_when:
    - Вам потрібен один API-ключ для багатьох LLM-ів
    - Ви хочете запускати моделі через OpenRouter в OpenClaw
    - Ви хочете використовувати OpenRouter для генерації зображень
summary: Використовуйте уніфікований API OpenRouter для доступу до багатьох моделей в OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T00:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter надає **уніфікований API**, який спрямовує запити до багатьох моделей через єдину
кінцеву точку та API-ключ. Він сумісний з OpenAI, тому більшість SDK OpenAI працюють, якщо змінити базовий URL.

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
  <Step title="(Необов’язково) Перемкніться на конкретну модель">
    Під час онбордингу типовим значенням є `openrouter/auto`. Пізніше виберіть конкретну модель:

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

## Посилання моделей

<Note>
Посилання моделей відповідають шаблону `openrouter/<provider>/<model>`. Повний список
доступних провайдерів і моделей дивіться в [/concepts/model-providers](/uk/concepts/model-providers).
</Note>

Приклади вбудованого резервного перемикання:

| Model ref                            | Примітки                          |
| ------------------------------------ | --------------------------------- |
| `openrouter/auto`                    | Автоматична маршрутизація OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 через MoonshotAI        |
| `openrouter/openrouter/healer-alpha` | Маршрут OpenRouter Healer Alpha   |
| `openrouter/openrouter/hunter-alpha` | Маршрут OpenRouter Hunter Alpha   |

## Генерація зображень

OpenRouter також може працювати як основа для інструмента `image_generate`. Використовуйте модель зображень OpenRouter у `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw надсилає запити на зображення до API зображень chat completions OpenRouter з `modalities: ["image", "text"]`. Моделі зображень Gemini отримують підтримувані підказки `aspectRatio` і `resolution` через `image_config` OpenRouter.

## Автентифікація та заголовки

OpenRouter використовує Bearer token з вашим API-ключем під капотом.

У реальних запитах OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw також додає
задокументовані заголовки атрибуції застосунку OpenRouter:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Якщо ви перенаправите провайдер OpenRouter на якийсь інший проксі або базовий URL, OpenClaw
**не** додаватиме ці специфічні для OpenRouter заголовки або маркери кешу Anthropic.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Маркери кешу Anthropic">
    На перевірених маршрутах OpenRouter посилання моделей Anthropic зберігають
    специфічні для OpenRouter маркери Anthropic `cache_control`, які OpenClaw використовує для
    кращого повторного використання кешу промптів у блоках system/developer prompt.
  </Accordion>

  <Accordion title="Ін’єкція thinking / reasoning">
    На підтримуваних маршрутах, відмінних від `auto`, OpenClaw зіставляє вибраний рівень thinking з
    payload reasoning проксі OpenRouter. Непідтримувані підказки моделей і
    `openrouter/auto` пропускають цю ін’єкцію reasoning.
  </Accordion>

  <Accordion title="Формування запитів лише для OpenAI">
    OpenRouter усе ще працює через сумісний з OpenAI шлях у стилі проксі, тому
    нативне формування запитів лише для OpenAI, таке як `serviceTier`, `store` у Responses,
    payload сумісності reasoning OpenAI та підказки кешу промптів, не передається далі.
  </Accordion>

  <Accordion title="Маршрути на базі Gemini">
    Посилання OpenRouter на базі Gemini залишаються на шляху proxy-Gemini: OpenClaw зберігає
    там очищення thought-signature Gemini, але не вмикає нативну перевірку повторного відтворення Gemini
    або bootstrap rewrites.
  </Accordion>

  <Accordion title="Метадані маршрутизації провайдера">
    Якщо ви передаєте маршрутизацію провайдера OpenRouter через параметри моделі, OpenClaw пересилає
    її як метадані маршрутизації OpenRouter до запуску спільних обгорток потоку.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань моделей і поведінки резервного перемикання.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
