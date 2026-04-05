---
read_when:
    - Ви хочете вибрати провайдера моделі
    - Вам потрібен короткий огляд підтримуваних бекендів LLM
summary: Провайдери моделей (LLM), які підтримує OpenClaw
title: Каталог провайдерів
x-i18n:
    generated_at: "2026-04-05T22:22:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: a13202fc20a64c68e9c7de4f2cd8ad11908029f3fe3300a8e6d69fcb0b6080ba
    source_path: providers/index.md
    workflow: 15
---

# Провайдери моделей

OpenClaw може використовувати багато провайдерів LLM. Виберіть провайдера, пройдіть автентифікацію, а потім задайте модель за замовчуванням як `provider/model`.

Шукаєте документацію щодо каналів чату (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/тощо)? Див. [Канали](/uk/channels).

## Швидкий старт

1. Пройдіть автентифікацію у провайдера (зазвичай через `openclaw onboard`).
2. Задайте модель за замовчуванням:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Документація провайдерів

- [Alibaba Model Studio](/providers/alibaba)
- [Amazon Bedrock](/uk/providers/bedrock)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [BytePlus (міжнародний)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/uk/providers/chutes)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [DeepSeek](/uk/providers/deepseek)
- [fal](/providers/fal)
- [Fireworks](/uk/providers/fireworks)
- [GitHub Copilot](/uk/providers/github-copilot)
- [Моделі GLM](/uk/providers/glm)
- [Google (Gemini)](/uk/providers/google)
- [Groq (LPU-інференс)](/uk/providers/groq)
- [Hugging Face (інференс)](/uk/providers/huggingface)
- [Kilocode](/uk/providers/kilocode)
- [LiteLLM (уніфікований шлюз)](/uk/providers/litellm)
- [MiniMax](/uk/providers/minimax)
- [Mistral](/uk/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
- [NVIDIA](/uk/providers/nvidia)
- [Ollama (хмарні + локальні моделі)](/uk/providers/ollama)
- [OpenAI (API + Codex)](/uk/providers/openai)
- [OpenCode](/uk/providers/opencode)
- [OpenCode Go](/uk/providers/opencode-go)
- [OpenRouter](/uk/providers/openrouter)
- [Perplexity (вебпошук)](/uk/providers/perplexity-provider)
- [Qianfan](/uk/providers/qianfan)
- [Qwen Cloud](/uk/providers/qwen)
- [Qwen / Model Studio (деталі endpoint; `qwen-*` canonical, `modelstudio-*` legacy)](/uk/providers/qwen_modelstudio)
- [SGLang (локальні моделі)](/uk/providers/sglang)
- [StepFun](/uk/providers/stepfun)
- [Synthetic](/uk/providers/synthetic)
- [Together AI](/uk/providers/together)
- [Venice (Venice AI, з фокусом на приватність)](/uk/providers/venice)
- [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
- [vLLM (локальні моделі)](/uk/providers/vllm)
- [Volcengine (Doubao)](/uk/providers/volcengine)
- [xAI](/uk/providers/xai)
- [Xiaomi](/uk/providers/xiaomi)
- [Z.AI](/uk/providers/zai)

## Спільні оглядові сторінки

- [Додаткові вбудовані варіанти](/uk/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy та Gemini CLI OAuth
- [Генерація зображень](/uk/tools/image-generation) - Спільний інструмент `image_generate`, вибір провайдера та failover
- [Генерація відео](/uk/tools/video-generation) - Спільний інструмент `video_generate`, вибір провайдера та failover

## Провайдери транскрибування

- [Deepgram (транскрибування аудіо)](/uk/providers/deepgram)

## Інструменти спільноти

- [Claude Max API Proxy](/uk/providers/claude-max-api-proxy) - Проксі від спільноти для облікових даних підписки Claude (перед використанням перевірте політику/умови Anthropic)

Повний каталог провайдерів (xAI, Groq, Mistral тощо) і розширену конфігурацію див. у розділі [Провайдери моделей](/uk/concepts/model-providers).
