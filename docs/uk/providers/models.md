---
read_when:
    - Ви хочете вибрати провайдера моделі
    - Ви хочете отримати швидкі приклади налаштування автентифікації LLM і вибору моделі
summary: Провайдери моделей (LLM), які підтримує OpenClaw
title: Швидкий старт для провайдерів моделей
x-i18n:
    generated_at: "2026-04-07T09:37:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59ee4c2f993fe0ae05fe34f52bc6f3e0fc9a76b10760f56b20ad251e25ee9f20
    source_path: providers/models.md
    workflow: 15
---

# Провайдери моделей

OpenClaw може використовувати багато провайдерів LLM. Виберіть один, пройдіть автентифікацію, а потім установіть модель за замовчуванням як `provider/model`.

## Швидкий старт (два кроки)

1. Пройдіть автентифікацію в провайдера (зазвичай через `openclaw onboard`).
2. Установіть модель за замовчуванням:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Підтримувані провайдери (стартовий набір)

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [Amazon Bedrock](/uk/providers/bedrock)
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

- `anthropic-vertex` - неявна підтримка Anthropic у Google Vertex, якщо доступні облікові дані Vertex; окремий вибір автентифікації під час онбордингу не потрібен
- `copilot-proxy` - локальний міст VS Code Copilot Proxy; використовуйте `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - неофіційний потік OAuth для Gemini CLI; потребує локально встановленого `gemini` (`brew install gemini-cli` або `npm install -g @google/gemini-cli`); модель за замовчуванням `google-gemini-cli/gemini-3-flash-preview`; використовуйте `openclaw onboard --auth-choice google-gemini-cli` або `openclaw models auth login --provider google-gemini-cli --set-default`

Повний каталог провайдерів (xAI, Groq, Mistral тощо) і розширене налаштування див. у розділі [Провайдери моделей](/uk/concepts/model-providers).
