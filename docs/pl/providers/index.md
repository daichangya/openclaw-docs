---
read_when:
    - Chcesz wybrać dostawcę modelu
    - Potrzebujesz szybkiego przeglądu obsługiwanych backendów LLM
summary: Dostawcy modeli (LLM) obsługiwani przez OpenClaw
title: Katalog dostawców
x-i18n:
    generated_at: "2026-04-25T13:56:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e031e997f0dbf97e3e26d5ee05bd99c2877653daa04423d210d01b9045d8c5c
    source_path: providers/index.md
    workflow: 15
---

# Dostawcy modeli

OpenClaw może korzystać z wielu dostawców LLM. Wybierz dostawcę, uwierzytelnij się, a następnie ustaw
domyślny model jako `provider/model`.

Szukasz dokumentacji kanałów czatu (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/itd.)? Zobacz [Kanały](/pl/channels).

## Szybki start

1. Uwierzytelnij się u dostawcy (zwykle za pomocą `openclaw onboard`).
2. Ustaw domyślny model:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Dokumentacja dostawców

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Amazon Bedrock](/pl/providers/bedrock)
- [Amazon Bedrock Mantle](/pl/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/pl/providers/anthropic)
- [Arcee AI (modele Trinity)](/pl/providers/arcee)
- [BytePlus (międzynarodowy)](/pl/concepts/model-providers#byteplus-international)
- [Chutes](/pl/providers/chutes)
- [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
- [ComfyUI](/pl/providers/comfy)
- [DeepSeek](/pl/providers/deepseek)
- [ElevenLabs](/pl/providers/elevenlabs)
- [fal](/pl/providers/fal)
- [Fireworks](/pl/providers/fireworks)
- [GitHub Copilot](/pl/providers/github-copilot)
- [Gradium](/pl/providers/gradium)
- [Modele GLM](/pl/providers/glm)
- [Google (Gemini)](/pl/providers/google)
- [Groq (wnioskowanie LPU)](/pl/providers/groq)
- [Hugging Face (Inference)](/pl/providers/huggingface)
- [inferrs (modele lokalne)](/pl/providers/inferrs)
- [Kilocode](/pl/providers/kilocode)
- [LiteLLM (ujednolicona brama)](/pl/providers/litellm)
- [LM Studio (modele lokalne)](/pl/providers/lmstudio)
- [MiniMax](/pl/providers/minimax)
- [Mistral](/pl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
- [NVIDIA](/pl/providers/nvidia)
- [Ollama (chmura + modele lokalne)](/pl/providers/ollama)
- [OpenAI (API + Codex)](/pl/providers/openai)
- [OpenCode](/pl/providers/opencode)
- [OpenCode Go](/pl/providers/opencode-go)
- [OpenRouter](/pl/providers/openrouter)
- [Perplexity (wyszukiwanie w sieci)](/pl/providers/perplexity-provider)
- [Qianfan](/pl/providers/qianfan)
- [Qwen Cloud](/pl/providers/qwen)
- [Runway](/pl/providers/runway)
- [SenseAudio](/pl/providers/senseaudio)
- [SGLang (modele lokalne)](/pl/providers/sglang)
- [StepFun](/pl/providers/stepfun)
- [Synthetic](/pl/providers/synthetic)
- [Tencent Cloud (TokenHub)](/pl/providers/tencent)
- [Together AI](/pl/providers/together)
- [Venice (Venice AI, z naciskiem na prywatność)](/pl/providers/venice)
- [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
- [vLLM (modele lokalne)](/pl/providers/vllm)
- [Volcengine (Doubao)](/pl/providers/volcengine)
- [Vydra](/pl/providers/vydra)
- [xAI](/pl/providers/xai)
- [Xiaomi](/pl/providers/xiaomi)
- [Z.AI](/pl/providers/zai)

## Wspólne strony przeglądowe

- [Dodatkowe dołączone warianty](/pl/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy i Gemini CLI OAuth
- [Generowanie obrazów](/pl/tools/image-generation) - Wspólne narzędzie `image_generate`, wybór dostawcy i failover
- [Generowanie muzyki](/pl/tools/music-generation) - Wspólne narzędzie `music_generate`, wybór dostawcy i failover
- [Generowanie wideo](/pl/tools/video-generation) - Wspólne narzędzie `video_generate`, wybór dostawcy i failover

## Dostawcy transkrypcji

- [Deepgram (transkrypcja audio)](/pl/providers/deepgram)
- [ElevenLabs](/pl/providers/elevenlabs#speech-to-text)
- [Mistral](/pl/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/pl/providers/openai#speech-to-text)
- [SenseAudio](/pl/providers/senseaudio)
- [xAI](/pl/providers/xai#speech-to-text)

## Narzędzia społeczności

- [Claude Max API Proxy](/pl/providers/claude-max-api-proxy) - Społecznościowy proxy dla poświadczeń subskrypcji Claude (przed użyciem zweryfikuj zasady/warunki Anthropic)

Pełny katalog dostawców (xAI, Groq, Mistral itd.) oraz konfigurację zaawansowaną
znajdziesz w [Dostawcy modeli](/pl/concepts/model-providers).
