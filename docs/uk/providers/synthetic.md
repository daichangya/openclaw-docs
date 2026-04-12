---
read_when:
    - Ви хочете використовувати Synthetic як постачальника моделей
    - Вам потрібен API-ключ Synthetic або налаштований базовий URL
summary: Використовуйте Anthropic-сумісний API Synthetic в OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-12T10:26:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c4d2c6635482e09acaf603a75c8a85f0782e42a4a68ef6166f423a48d184ffa
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

[Synthetic](https://synthetic.new) надає Anthropic-сумісні кінцеві точки.
OpenClaw реєструє його як постачальника `synthetic` і використовує Anthropic
Messages API.

| Властивість | Значення                             |
| ----------- | ------------------------------------ |
| Постачальник | `synthetic`                          |
| Автентифікація | `SYNTHETIC_API_KEY`                |
| API         | Anthropic Messages                   |
| Базовий URL | `https://api.synthetic.new/anthropic` |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Отримайте `SYNTHETIC_API_KEY` у своєму обліковому записі Synthetic або
    дозвольте майстру початкового налаштування запросити його.
  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Перевірте модель за замовчуванням">
    Після початкового налаштування модель за замовчуванням встановлюється на:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Клієнт Anthropic в OpenClaw автоматично додає `/v1` до базового URL, тому
використовуйте `https://api.synthetic.new/anthropic` (а не `/anthropic/v1`).
Якщо Synthetic змінить свій базовий URL, перевизначте `models.providers.synthetic.baseUrl`.
</Warning>

## Приклад конфігурації

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Каталог моделей

Усі моделі Synthetic використовують вартість `0` (вхід/вихід/кеш).

| ID моделі                                              | Вікно контексту | Макс. токенів | Міркування | Вхід         |
| ------------------------------------------------------ | --------------- | ------------- | ---------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000         | 65,536        | ні         | текст        |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000         | 8,192         | так        | текст        |
| `hf:zai-org/GLM-4.7`                                   | 198,000         | 128,000       | ні         | текст        |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000         | 8,192         | ні         | текст        |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000         | 8,192         | ні         | текст        |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000         | 8,192         | ні         | текст        |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000         | 8,192         | ні         | текст        |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000         | 8,192         | ні         | текст        |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000         | 8,192         | ні         | текст        |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000         | 8,192         | ні         | текст        |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000         | 8,192         | ні         | текст        |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000         | 8,192         | так        | текст + зображення |
| `hf:openai/gpt-oss-120b`                               | 128,000         | 8,192         | ні         | текст        |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000         | 8,192         | ні         | текст        |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000         | 8,192         | ні         | текст        |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000         | 8,192         | ні         | текст + зображення |
| `hf:zai-org/GLM-4.5`                                   | 128,000         | 128,000       | ні         | текст        |
| `hf:zai-org/GLM-4.6`                                   | 198,000         | 128,000       | ні         | текст        |
| `hf:zai-org/GLM-5`                                     | 256,000         | 128,000       | так        | текст + зображення |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000         | 8,192         | ні         | текст        |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000         | 8,192         | так        | текст        |

<Tip>
Посилання на моделі мають формат `synthetic/<modelId>`. Використовуйте
`openclaw models list --provider synthetic`, щоб побачити всі моделі, доступні
у вашому обліковому записі.
</Tip>

<AccordionGroup>
  <Accordion title="Список дозволених моделей">
    Якщо ви вмикаєте список дозволених моделей (`agents.defaults.models`),
    додайте кожну модель Synthetic, яку плануєте використовувати. Моделі,
    яких немає в списку дозволених, будуть приховані від агента.
  </Accordion>

  <Accordion title="Перевизначення базового URL">
    Якщо Synthetic змінить свою API-кінцеву точку, перевизначте базовий URL у своїй конфігурації:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    Пам’ятайте, що OpenClaw автоматично додає `/v1`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Правила постачальників, посилання на моделі та поведінка перемикання при збоях.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями постачальників.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Панель керування Synthetic та документація API.
  </Card>
</CardGroup>
