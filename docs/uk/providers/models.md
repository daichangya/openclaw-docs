---
read_when:
    - Ви хочете вибрати провайдера моделей
    - Ви хочете швидкі приклади налаштування автентифікації LLM і вибору моделі
summary: Провайдери моделей (LLM), які підтримує OpenClaw
title: Швидкий старт для провайдерів моделей
x-i18n:
    generated_at: "2026-04-05T18:14:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc98c65af5737b2c820f4da3304118c2b449d8f0cd363d73922f81087331e93d
    source_path: providers/models.md
    workflow: 15
---

# Провайдери моделей

OpenClaw може використовувати багато провайдерів LLM. Виберіть один, пройдіть автентифікацію, а потім задайте
модель за замовчуванням у форматі `provider/model`.

## Швидкий старт (два кроки)

1. Пройдіть автентифікацію у провайдера (зазвичай через `openclaw onboard`).
2. Задайте модель за замовчуванням:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Підтримувані провайдери (стартовий набір)

- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [Amazon Bedrock](/providers/bedrock)
- [BytePlus (International)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Fireworks](/providers/fireworks)
- [GLM models](/providers/glm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Qianfan](/providers/qianfan)
- [Qwen](/providers/qwen)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/providers/venice)
- [xAI](/providers/xai)
- [Z.AI](/providers/zai)

## Додаткові bundled-варіанти провайдерів

- `anthropic-vertex` - неявна підтримка Anthropic у Google Vertex, коли доступні облікові дані Vertex; окремий варіант автентифікації під час onboarding не потрібен
- `copilot-proxy` - локальний міст VS Code Copilot Proxy; використовуйте `openclaw onboard --auth-choice copilot-proxy`

Повний каталог провайдерів (xAI, Groq, Mistral тощо) і розширене налаштування див. у [Model providers](/uk/concepts/model-providers).
