---
read_when:
    - Sie möchten einen Model-Provider auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte LLM-Backends
summary: Von OpenClaw unterstützte Model-Provider (LLMs)
title: Provider-Verzeichnis
x-i18n:
    generated_at: "2026-04-05T12:53:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 690d17c14576d454ea3cd3dcbc704470da10a2a34adfe681dab7048438f2e193
    source_path: providers/index.md
    workflow: 15
---

# Model-Provider

OpenClaw kann viele LLM-Provider verwenden. Wählen Sie einen Provider aus, authentifizieren Sie sich und setzen Sie dann das
Standard-Model als `provider/model`.

Suchen Sie nach Dokumentation zu Chat-Channels (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/usw.)? Siehe [Channels](/de/channels).

## Schnellstart

1. Beim Provider authentifizieren (normalerweise über `openclaw onboard`).
2. Das Standard-Model festlegen:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider-Dokumentation

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepSeek](/providers/deepseek)
- [Fireworks](/providers/fireworks)
- [GitHub Copilot](/providers/github-copilot)
- [GLM-Modelle](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq (LPU-Inferenz)](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (einheitliches Gateway)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (Cloud- + lokale Modelle)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity (Websuche)](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen Cloud](/providers/qwen)
- [Qwen / Model Studio (Endpunktdetails; `qwen-*` kanonisch, `modelstudio-*` veraltet)](/providers/qwen_modelstudio)
- [SGLang (lokale Modelle)](/providers/sglang)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Together AI](/providers/together)
- [Venice (Venice AI, datenschutzorientiert)](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [vLLM (lokale Modelle)](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Gemeinsame Übersichtsseiten

- [Zusätzliche gebündelte Varianten](/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy und Gemini CLI OAuth

## Transkriptions-Provider

- [Deepgram (Audio-Transkription)](/providers/deepgram)

## Community-Tools

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Community-Proxy für Claude-Abonnement-Zugangsdaten (prüfen Sie vor der Nutzung die Richtlinien/Nutzungsbedingungen von Anthropic)

Den vollständigen Provider-Katalog (xAI, Groq, Mistral usw.) und die erweiterte Konfiguration finden Sie unter [Model-Provider](/de/concepts/model-providers).
