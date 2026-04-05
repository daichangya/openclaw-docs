---
read_when:
    - Ви хочете вибрати провайдера моделей
    - Вам потрібен короткий огляд підтримуваних LLM-бекендів
summary: Провайдери моделей (LLM), які підтримує OpenClaw
title: Каталог провайдерів
x-i18n:
    generated_at: "2026-04-05T18:14:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 690d17c14576d454ea3cd3dcbc704470da10a2a34adfe681dab7048438f2e193
    source_path: providers/index.md
    workflow: 15
---

# Провайдери моделей

OpenClaw може використовувати багато провайдерів LLM. Виберіть провайдера, пройдіть автентифікацію, а потім задайте
модель за замовчуванням у форматі `provider/model`.

Шукаєте документацію про канали чату (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/тощо)? Див. [Channels](/uk/channels).

## Швидкий старт

1. Пройдіть автентифікацію у провайдера (зазвичай через `openclaw onboard`).
2. Задайте модель за замовчуванням:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Документація провайдерів

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [BytePlus (International)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepSeek](/providers/deepseek)
- [Fireworks](/providers/fireworks)
- [GitHub Copilot](/providers/github-copilot)
- [GLM models](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq (LPU inference)](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (unified gateway)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (cloud + local models)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity (web search)](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen Cloud](/providers/qwen)
- [Qwen / Model Studio (деталі endpoint; `qwen-*` канонічний, `modelstudio-*` застарілий)](/providers/qwen_modelstudio)
- [SGLang (local models)](/providers/sglang)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Together AI](/providers/together)
- [Venice (Venice AI, орієнтований на приватність)](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [vLLM (local models)](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Спільні оглядові сторінки

- [Additional bundled variants](/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy та Gemini CLI OAuth

## Провайдери транскрипції

- [Deepgram (транскрипція аудіо)](/providers/deepgram)

## Інструменти спільноти

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Проксі спільноти для облікових даних підписки Claude (перед використанням перевірте політику/умови Anthropic)

Повний каталог провайдерів (xAI, Groq, Mistral тощо) і розширене налаштування див. у [Model providers](/uk/concepts/model-providers).
