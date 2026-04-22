---
read_when:
    - 모델 provider를 선택하려고 합니다
    - 지원되는 LLM 백엔드의 빠른 개요가 필요합니다
summary: OpenClaw에서 지원하는 모델 provider(LLM)
title: Provider 디렉터리
x-i18n:
    generated_at: "2026-04-22T04:26:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d77e5da93d71c48ea97460c6be56fbbe8279d9240a8101e1b35fdafb657737e
    source_path: providers/index.md
    workflow: 15
---

# 모델 provider

OpenClaw는 많은 LLM provider를 사용할 수 있습니다. provider를 선택하고 인증한 다음,
기본 모델을 `provider/model`로 설정하세요.

채팅 채널 문서(WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/등)를 찾고 있나요? [Channels](/ko/channels)를 참고하세요.

## 빠른 시작

1. provider로 인증합니다(보통 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## provider 문서

- [Alibaba Model Studio](/ko/providers/alibaba)
- [Amazon Bedrock](/ko/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ko/providers/anthropic)
- [Arcee AI (Trinity models)](/ko/providers/arcee)
- [BytePlus (International)](/ko/concepts/model-providers#byteplus-international)
- [Chutes](/ko/providers/chutes)
- [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
- [ComfyUI](/ko/providers/comfy)
- [DeepSeek](/ko/providers/deepseek)
- [fal](/ko/providers/fal)
- [Fireworks](/ko/providers/fireworks)
- [GitHub Copilot](/ko/providers/github-copilot)
- [GLM models](/ko/providers/glm)
- [Google (Gemini)](/ko/providers/google)
- [Groq (LPU inference)](/ko/providers/groq)
- [Hugging Face (Inference)](/ko/providers/huggingface)
- [inferrs (local models)](/ko/providers/inferrs)
- [Kilocode](/ko/providers/kilocode)
- [LiteLLM (unified gateway)](/ko/providers/litellm)
- [LM Studio (local models)](/ko/providers/lmstudio)
- [MiniMax](/ko/providers/minimax)
- [Mistral](/ko/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ko/providers/moonshot)
- [NVIDIA](/ko/providers/nvidia)
- [Ollama (cloud + local models)](/ko/providers/ollama)
- [OpenAI (API + Codex)](/ko/providers/openai)
- [OpenCode](/ko/providers/opencode)
- [OpenCode Go](/ko/providers/opencode-go)
- [OpenRouter](/ko/providers/openrouter)
- [Perplexity (web search)](/ko/providers/perplexity-provider)
- [Qianfan](/ko/providers/qianfan)
- [Qwen Cloud](/ko/providers/qwen)
- [Runway](/ko/providers/runway)
- [SGLang (local models)](/ko/providers/sglang)
- [StepFun](/ko/providers/stepfun)
- [Synthetic](/ko/providers/synthetic)
- [Together AI](/ko/providers/together)
- [Venice (Venice AI, privacy-focused)](/ko/providers/venice)
- [Vercel AI Gateway](/ko/providers/vercel-ai-gateway)
- [vLLM (local models)](/ko/providers/vllm)
- [Volcengine (Doubao)](/ko/providers/volcengine)
- [Vydra](/ko/providers/vydra)
- [xAI](/ko/providers/xai)
- [Xiaomi](/ko/providers/xiaomi)
- [Z.AI](/ko/providers/zai)

## 공유 개요 페이지

- [Additional bundled variants](/ko/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy, Gemini CLI OAuth
- [Image Generation](/ko/tools/image-generation) - 공유 `image_generate` 도구, provider 선택, failover
- [Music Generation](/ko/tools/music-generation) - 공유 `music_generate` 도구, provider 선택, failover
- [Video Generation](/ko/tools/video-generation) - 공유 `video_generate` 도구, provider 선택, failover

## 전사 provider

- [Deepgram (audio transcription)](/ko/providers/deepgram)

## 커뮤니티 도구

- [Claude Max API Proxy](/ko/providers/claude-max-api-proxy) - Claude 구독 자격 증명을 위한 커뮤니티 프록시(사용 전에 Anthropic 정책/약관을 확인하세요)

전체 provider 카탈로그(xAI, Groq, Mistral 등)와 고급 구성은
[Model providers](/ko/concepts/model-providers)를 참고하세요.
