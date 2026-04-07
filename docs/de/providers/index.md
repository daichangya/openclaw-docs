---
read_when:
    - Sie möchten einen Modellanbieter auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte LLM-Backends
summary: Von OpenClaw unterstützte Modellanbieter (LLMs)
title: Anbieterverzeichnis
x-i18n:
    generated_at: "2026-04-07T06:18:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d9ace35fd9452a4fb510fd980d251b6e51480e4647f051020bee2f1f2222e1
    source_path: providers/index.md
    workflow: 15
---

# Modellanbieter

OpenClaw kann viele LLM-Anbieter verwenden. Wählen Sie einen Anbieter, authentifizieren Sie sich und setzen Sie dann das
Standardmodell auf `provider/model`.

Suchen Sie nach Dokumentation zu Chat-Kanälen (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/usw.)? Siehe [Channels](/de/channels).

## Schnellstart

1. Authentifizieren Sie sich beim Anbieter (normalerweise über `openclaw onboard`).
2. Legen Sie das Standardmodell fest:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Anbieterdokumentation

- [Alibaba Model Studio](/de/providers/alibaba)
- [Amazon Bedrock](/de/providers/bedrock)
- [Anthropic (API + Claude CLI)](/de/providers/anthropic)
- [Arcee AI (Trinity-Modelle)](/de/providers/arcee)
- [BytePlus (international)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/de/providers/chutes)
- [ComfyUI](/de/providers/comfy)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [DeepSeek](/de/providers/deepseek)
- [fal](/de/providers/fal)
- [Fireworks](/de/providers/fireworks)
- [GitHub Copilot](/de/providers/github-copilot)
- [GLM-Modelle](/de/providers/glm)
- [Google (Gemini)](/de/providers/google)
- [Groq (LPU-Inferenz)](/de/providers/groq)
- [Hugging Face (Inference)](/de/providers/huggingface)
- [Kilocode](/de/providers/kilocode)
- [LiteLLM (einheitliches Gateway)](/de/providers/litellm)
- [MiniMax](/de/providers/minimax)
- [Mistral](/de/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
- [NVIDIA](/de/providers/nvidia)
- [Ollama (Cloud- + lokale Modelle)](/de/providers/ollama)
- [OpenAI (API + Codex)](/de/providers/openai)
- [OpenCode](/de/providers/opencode)
- [OpenCode Go](/de/providers/opencode-go)
- [OpenRouter](/de/providers/openrouter)
- [Perplexity (Websuche)](/de/providers/perplexity-provider)
- [Qianfan](/de/providers/qianfan)
- [Qwen Cloud](/de/providers/qwen)
- [Runway](/de/providers/runway)
- [SGLang (lokale Modelle)](/de/providers/sglang)
- [StepFun](/de/providers/stepfun)
- [Synthetic](/de/providers/synthetic)
- [Together AI](/de/providers/together)
- [Venice (Venice AI, datenschutzorientiert)](/de/providers/venice)
- [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
- [Vydra](/de/providers/vydra)
- [vLLM (lokale Modelle)](/de/providers/vllm)
- [Volcengine (Doubao)](/de/providers/volcengine)
- [xAI](/de/providers/xai)
- [Xiaomi](/de/providers/xiaomi)
- [Z.AI](/de/providers/zai)

## Gemeinsame Übersichtsseiten

- [Additional bundled variants](/de/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy und Gemini CLI OAuth
- [Image Generation](/de/tools/image-generation) - Gemeinsames Tool `image_generate`, Anbieterauswahl und Failover
- [Music Generation](/de/tools/music-generation) - Gemeinsames Tool `music_generate`, Anbieterauswahl und Failover
- [Video Generation](/de/tools/video-generation) - Gemeinsames Tool `video_generate`, Anbieterauswahl und Failover

## Transkriptionsanbieter

- [Deepgram (Audiotranskription)](/de/providers/deepgram)

## Community-Tools

- [Claude Max API Proxy](/de/providers/claude-max-api-proxy) - Community-Proxy für Claude-Abonnement-Zugangsdaten (prüfen Sie vor der Nutzung die Richtlinien/Bedingungen von Anthropic)

Den vollständigen Anbieterkatalog (xAI, Groq, Mistral usw.) und die erweiterte Konfiguration
finden Sie unter [Model providers](/de/concepts/model-providers).
