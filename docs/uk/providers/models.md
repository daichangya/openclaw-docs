---
read_when:
    - Ви хочете вибрати провайдера моделі
    - Ви хочете швидкі приклади налаштування для автентифікації LLM і вибору моделі
summary: Провайдери моделей (LLM), які підтримує OpenClaw
title: Швидкий старт для провайдерів моделей
x-i18n:
    generated_at: "2026-04-24T03:48:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: b824a664e0e7a7a5b0ea640ea7329ea3d1e3d12b85d9310231c76014b2ae01cc
    source_path: providers/models.md
    workflow: 15
---

# Провайдери моделей

OpenClaw може використовувати багато провайдерів LLM. Виберіть одного, пройдіть автентифікацію, а потім задайте модель за замовчуванням
у форматі `provider/model`.

## Швидкий старт (два кроки)

1. Пройдіть автентифікацію у провайдера (зазвичай через `openclaw onboard`).
2. Задайте модель за замовчуванням:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Підтримувані провайдери (стартовий набір)

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Amazon Bedrock](/uk/providers/bedrock)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [BytePlus (International)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/uk/providers/chutes)
- [ComfyUI](/uk/providers/comfy)
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

## Додаткові варіанти вбудованих провайдерів

- `anthropic-vertex` - неявна підтримка Anthropic у Google Vertex, коли доступні облікові дані Vertex; окремий варіант автентифікації під час onboarding не потрібен
- `copilot-proxy` - локальний міст VS Code Copilot Proxy; використовуйте `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - неофіційний OAuth-процес Gemini CLI; потребує локального встановлення `gemini` (`brew install gemini-cli` або `npm install -g @google/gemini-cli`); модель за замовчуванням — `google-gemini-cli/gemini-3-flash-preview`; використовуйте `openclaw onboard --auth-choice google-gemini-cli` або `openclaw models auth login --provider google-gemini-cli --set-default`

Повний каталог провайдерів (xAI, Groq, Mistral тощо) і розширену конфігурацію
див. у [Провайдери моделей](/uk/concepts/model-providers).

## Пов’язане

- [Вибір моделі](/uk/concepts/model-providers)
- [Model failover](/uk/concepts/model-failover)
- [Models CLI](/uk/cli/models)
