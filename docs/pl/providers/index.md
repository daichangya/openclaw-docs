---
read_when:
    - Chcesz wybrać providera modelu
    - Potrzebujesz szybkiego przeglądu obsługiwanych backendów LLM
summary: Providerzy modeli (LLM) obsługiwani przez OpenClaw
title: Katalog providerów
x-i18n:
    generated_at: "2026-04-23T10:07:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b038f095480fc2cd4f7eb75500d9d8eb7b03fa90614e122744939e0ddc6996d
    source_path: providers/index.md
    workflow: 15
---

# Providerzy modeli

OpenClaw może używać wielu providerów LLM. Wybierz providera, uwierzytelnij się, a następnie ustaw
domyślny model jako `provider/model`.

Szukasz dokumentacji kanałów czatu (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/itd.)? Zobacz [Channels](/pl/channels).

## Szybki start

1. Uwierzytelnij się u providera (zwykle przez `openclaw onboard`).
2. Ustaw domyślny model:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Dokumentacja providerów

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Amazon Bedrock](/pl/providers/bedrock)
- [Amazon Bedrock Mantle](/pl/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/pl/providers/anthropic)
- [Arcee AI (modele Trinity)](/pl/providers/arcee)
- [BytePlus (International)](/pl/concepts/model-providers#byteplus-international)
- [Chutes](/pl/providers/chutes)
- [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
- [ComfyUI](/pl/providers/comfy)
- [DeepSeek](/pl/providers/deepseek)
- [ElevenLabs](/pl/providers/elevenlabs)
- [fal](/pl/providers/fal)
- [Fireworks](/pl/providers/fireworks)
- [GitHub Copilot](/pl/providers/github-copilot)
- [Modele GLM](/pl/providers/glm)
- [Google (Gemini)](/pl/providers/google)
- [Groq (inferencja LPU)](/pl/providers/groq)
- [Hugging Face (Inference)](/pl/providers/huggingface)
- [inferrs (modele lokalne)](/pl/providers/inferrs)
- [Kilocode](/pl/providers/kilocode)
- [LiteLLM (ujednolicona brama)](/pl/providers/litellm)
- [LM Studio (modele lokalne)](/pl/providers/lmstudio)
- [MiniMax](/pl/providers/minimax)
- [Mistral](/pl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
- [NVIDIA](/pl/providers/nvidia)
- [Ollama (modele chmurowe + lokalne)](/pl/providers/ollama)
- [OpenAI (API + Codex)](/pl/providers/openai)
- [OpenCode](/pl/providers/opencode)
- [OpenCode Go](/pl/providers/opencode-go)
- [OpenRouter](/pl/providers/openrouter)
- [Perplexity (wyszukiwanie w sieci)](/pl/providers/perplexity-provider)
- [Qianfan](/pl/providers/qianfan)
- [Qwen Cloud](/pl/providers/qwen)
- [Runway](/pl/providers/runway)
- [SGLang (modele lokalne)](/pl/providers/sglang)
- [StepFun](/pl/providers/stepfun)
- [Synthetic](/pl/providers/synthetic)
- [Tencent Cloud (TokenHub)](/pl/providers/tencent)
- [Together AI](/pl/providers/together)
- [Venice (Venice AI, zorientowane na prywatność)](/pl/providers/venice)
- [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
- [vLLM (modele lokalne)](/pl/providers/vllm)
- [Volcengine (Doubao)](/pl/providers/volcengine)
- [Vydra](/pl/providers/vydra)
- [xAI](/pl/providers/xai)
- [Xiaomi](/pl/providers/xiaomi)
- [Z.AI](/pl/providers/zai)

## Wspólne strony przeglądowe

- [Additional bundled variants](/pl/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy i Gemini CLI OAuth
- [Image Generation](/pl/tools/image-generation) - Wspólne narzędzie `image_generate`, wybór providera i failover
- [Music Generation](/pl/tools/music-generation) - Wspólne narzędzie `music_generate`, wybór providera i failover
- [Video Generation](/pl/tools/video-generation) - Wspólne narzędzie `video_generate`, wybór providera i failover

## Providerzy transkrypcji

- [Deepgram (transkrypcja audio)](/pl/providers/deepgram)
- [ElevenLabs](/pl/providers/elevenlabs#speech-to-text)
- [Mistral](/pl/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/pl/providers/openai#speech-to-text)
- [xAI](/pl/providers/xai#speech-to-text)

## Narzędzia społeczności

- [Claude Max API Proxy](/pl/providers/claude-max-api-proxy) - Społecznościowy proxy dla poświadczeń subskrypcji Claude (przed użyciem sprawdź zasady/warunki Anthropic)

Pełny katalog providerów (xAI, Groq, Mistral itd.) i konfigurację zaawansowaną znajdziesz w [Model providers](/pl/concepts/model-providers).
