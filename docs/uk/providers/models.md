---
read_when:
    - Ви хочете вибрати провайдера моделі
    - Вам потрібні приклади швидкого налаштування для автентифікації LLM і вибору моделі
summary: Провайдери моделей (LLM), які підтримує OpenClaw
title: Швидкий старт для провайдерів моделей
x-i18n:
    generated_at: "2026-04-06T00:19:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4836c7baa0a5af6b01c1369ebe2fdc6032d50d306dd10e2dbb778c6fce1384c4
    source_path: providers/models.md
    workflow: 15
---

# Провайдери моделей

OpenClaw може використовувати багато провайдерів LLM. Виберіть один, пройдіть автентифікацію, а потім задайте модель за замовчуванням як `provider/model`.

## Швидкий старт (два кроки)

1. Пройдіть автентифікацію у провайдера (зазвичай через `openclaw onboard`).
2. Задайте модель за замовчуванням:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Підтримувані провайдери (початковий набір)

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [Amazon Bedrock](/uk/providers/bedrock)
- [BytePlus (міжнародний)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/uk/providers/chutes)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [fal](/uk/providers/fal)
- [Fireworks](/uk/providers/fireworks)
- [Моделі GLM](/uk/providers/glm)
- [MiniMax](/uk/providers/minimax)
- [Mistral](/uk/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
- [OpenAI (API + Codex)](/uk/providers/openai)
- [OpenCode (Zen + Go)](/uk/providers/opencode)
- [OpenRouter](/uk/providers/openrouter)
- [Qianfan](/uk/providers/qianfan)
- [Qwen](/uk/providers/qwen)
- [Runway](/uk/providers/runway)
- [StepFun](/uk/providers/stepfun)
- [Synthetic](/uk/providers/synthetic)
- [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/uk/providers/venice)
- [xAI](/uk/providers/xai)
- [Z.AI](/uk/providers/zai)

## Додаткові вбудовані варіанти провайдерів

- `anthropic-vertex` - неявна підтримка Anthropic у Google Vertex, якщо доступні облікові дані Vertex; окремий вибір автентифікації під час онбордингу не потрібен
- `copilot-proxy` - локальний міст VS Code Copilot Proxy; використовуйте `openclaw onboard --auth-choice copilot-proxy`

Повний каталог провайдерів (xAI, Groq, Mistral тощо) і розширену конфігурацію див. у [Провайдери моделей](/uk/concepts/model-providers).
