---
read_when:
    - Ви хочете використовувати Synthetic як провайдера моделей
    - Вам потрібен API-ключ Synthetic або налаштування base URL
summary: Використання Anthropic-сумісного API Synthetic в OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-05T18:15:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3495bca5cb134659cf6c54e31fa432989afe0cc04f53cf3e3146ce80a5e8af49
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

Synthetic надає Anthropic-сумісні endpoint'и. OpenClaw реєструє його як
провайдера `synthetic` і використовує Anthropic Messages API.

## Швидке налаштування

1. Установіть `SYNTHETIC_API_KEY` (або запустіть майстер нижче).
2. Запустіть онбординг:

```bash
openclaw onboard --auth-choice synthetic-api-key
```

Типову модель буде встановлено як:

```
synthetic/hf:MiniMaxAI/MiniMax-M2.5
```

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

Примітка: клієнт Anthropic в OpenClaw додає `/v1` до base URL, тому використовуйте
`https://api.synthetic.new/anthropic` (а не `/anthropic/v1`). Якщо Synthetic змінить
свій base URL, перевизначте `models.providers.synthetic.baseUrl`.

## Каталог моделей

Усі моделі нижче використовують вартість `0` (вхід/вихід/кеш).

| ID моделі                                              | Контекстне вікно | Макс. токенів | Reasoning | Вхід         |
| ------------------------------------------------------ | ---------------- | ------------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192000           | 65536         | false     | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256000           | 8192          | true      | text         |
| `hf:zai-org/GLM-4.7`                                   | 198000           | 128000        | false     | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128000           | 8192          | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128000           | 8192          | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128000           | 8192          | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128000           | 8192          | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159000           | 8192          | false     | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128000           | 8192          | false     | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524000           | 8192          | false     | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256000           | 8192          | false     | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256000           | 8192          | true      | text + image |
| `hf:openai/gpt-oss-120b`                               | 128000           | 8192          | false     | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256000           | 8192          | false     | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256000           | 8192          | false     | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250000           | 8192          | false     | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128000           | 128000        | false     | text         |
| `hf:zai-org/GLM-4.6`                                   | 198000           | 128000        | false     | text         |
| `hf:zai-org/GLM-5`                                     | 256000           | 128000        | true      | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128000           | 8192          | false     | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256000           | 8192          | true      | text         |

## Примітки

- Посилання на моделі використовують формат `synthetic/<modelId>`.
- Якщо ви вмикаєте allowlist моделей (`agents.defaults.models`), додайте кожну модель, яку
  плануєте використовувати.
- Правила для провайдерів див. у [Провайдерах моделей](/uk/concepts/model-providers).
