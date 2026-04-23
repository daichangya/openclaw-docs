---
read_when:
    - Bir model sağlayıcısı seçmek istiyorsunuz
    - Desteklenen LLM arka uçlarına hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw tarafından desteklenen model sağlayıcıları (LLM'ler)
title: Sağlayıcı Dizini
x-i18n:
    generated_at: "2026-04-23T09:09:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b038f095480fc2cd4f7eb75500d9d8eb7b03fa90614e122744939e0ddc6996d
    source_path: providers/index.md
    workflow: 15
---

# Model Sağlayıcıları

OpenClaw birçok LLM sağlayıcısını kullanabilir. Bir sağlayıcı seçin, kimlik doğrulaması yapın, ardından varsayılan modeli `provider/model` olarak ayarlayın.

Sohbet kanal belgelerini mi arıyorsunuz (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/vb.)? Bkz. [Channels](/tr/channels).

## Hızlı başlangıç

1. Sağlayıcı ile kimlik doğrulaması yapın (genellikle `openclaw onboard` üzerinden).
2. Varsayılan modeli ayarlayın:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Sağlayıcı belgeleri

- [Alibaba Model Studio](/tr/providers/alibaba)
- [Amazon Bedrock](/tr/providers/bedrock)
- [Amazon Bedrock Mantle](/tr/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/tr/providers/anthropic)
- [Arcee AI (Trinity modelleri)](/tr/providers/arcee)
- [BytePlus (Uluslararası)](/tr/concepts/model-providers#byteplus-international)
- [Chutes](/tr/providers/chutes)
- [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
- [ComfyUI](/tr/providers/comfy)
- [DeepSeek](/tr/providers/deepseek)
- [ElevenLabs](/tr/providers/elevenlabs)
- [fal](/tr/providers/fal)
- [Fireworks](/tr/providers/fireworks)
- [GitHub Copilot](/tr/providers/github-copilot)
- [GLM modelleri](/tr/providers/glm)
- [Google (Gemini)](/tr/providers/google)
- [Groq (LPU çıkarımı)](/tr/providers/groq)
- [Hugging Face (Çıkarım)](/tr/providers/huggingface)
- [inferrs (yerel modeller)](/tr/providers/inferrs)
- [Kilocode](/tr/providers/kilocode)
- [LiteLLM (birleşik Gateway)](/tr/providers/litellm)
- [LM Studio (yerel modeller)](/tr/providers/lmstudio)
- [MiniMax](/tr/providers/minimax)
- [Mistral](/tr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
- [NVIDIA](/tr/providers/nvidia)
- [Ollama (bulut + yerel modeller)](/tr/providers/ollama)
- [OpenAI (API + Codex)](/tr/providers/openai)
- [OpenCode](/tr/providers/opencode)
- [OpenCode Go](/tr/providers/opencode-go)
- [OpenRouter](/tr/providers/openrouter)
- [Perplexity (web arama)](/tr/providers/perplexity-provider)
- [Qianfan](/tr/providers/qianfan)
- [Qwen Cloud](/tr/providers/qwen)
- [Runway](/tr/providers/runway)
- [SGLang (yerel modeller)](/tr/providers/sglang)
- [StepFun](/tr/providers/stepfun)
- [Synthetic](/tr/providers/synthetic)
- [Tencent Cloud (TokenHub)](/tr/providers/tencent)
- [Together AI](/tr/providers/together)
- [Venice (Venice AI, gizlilik odaklı)](/tr/providers/venice)
- [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
- [vLLM (yerel modeller)](/tr/providers/vllm)
- [Volcengine (Doubao)](/tr/providers/volcengine)
- [Vydra](/tr/providers/vydra)
- [xAI](/tr/providers/xai)
- [Xiaomi](/tr/providers/xiaomi)
- [Z.AI](/tr/providers/zai)

## Paylaşılan genel bakış sayfaları

- [Ek paketli varyantlar](/tr/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy ve Gemini CLI OAuth
- [Görsel Üretimi](/tr/tools/image-generation) - Paylaşılan `image_generate` aracı, sağlayıcı seçimi ve failover
- [Müzik Üretimi](/tr/tools/music-generation) - Paylaşılan `music_generate` aracı, sağlayıcı seçimi ve failover
- [Video Üretimi](/tr/tools/video-generation) - Paylaşılan `video_generate` aracı, sağlayıcı seçimi ve failover

## Transkripsiyon sağlayıcıları

- [Deepgram (ses transkripsiyonu)](/tr/providers/deepgram)
- [ElevenLabs](/tr/providers/elevenlabs#speech-to-text)
- [Mistral](/tr/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/tr/providers/openai#speech-to-text)
- [xAI](/tr/providers/xai#speech-to-text)

## Topluluk araçları

- [Claude Max API Proxy](/tr/providers/claude-max-api-proxy) - Claude abonelik kimlik bilgileri için topluluk proxy'si (kullanmadan önce Anthropic ilkesini/koşullarını doğrulayın)

Tam sağlayıcı kataloğu (xAI, Groq, Mistral vb.) ve gelişmiş yapılandırma için
bkz. [Model sağlayıcıları](/tr/concepts/model-providers).
