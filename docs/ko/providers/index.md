---
read_when:
    - model provider를 선택하려는 경우
    - 지원되는 LLM 백엔드의 빠른 개요가 필요한 경우
summary: OpenClaw가 지원하는 model providers(LLMs)
title: Provider 디렉터리
x-i18n:
    generated_at: "2026-04-07T05:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d9ace35fd9452a4fb510fd980d251b6e51480e4647f051020bee2f1f2222e1
    source_path: providers/index.md
    workflow: 15
---

# Model Providers

OpenClaw는 많은 LLM provider를 사용할 수 있습니다. provider를 선택하고 인증한 다음,
기본 모델을 `provider/model`로 설정하세요.

채팅 channel 문서(WhatsApp/Telegram/Discord/Slack/Mattermost (plugin) 등)를 찾고 있나요? [Channels](/ko/channels)를 참조하세요.

## 빠른 시작

1. provider로 인증합니다(보통 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider 문서

- [Alibaba Model Studio](/ko/providers/alibaba)
- [Amazon Bedrock](/ko/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ko/providers/anthropic)
- [Arcee AI (Trinity models)](/ko/providers/arcee)
- [BytePlus (International)](/ko/concepts/model-providers#byteplus-international)
- [Chutes](/ko/providers/chutes)
- [ComfyUI](/ko/providers/comfy)
- [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
- [DeepSeek](/ko/providers/deepseek)
- [fal](/ko/providers/fal)
- [Fireworks](/ko/providers/fireworks)
- [GitHub Copilot](/ko/providers/github-copilot)
- [GLM models](/ko/providers/glm)
- [Google (Gemini)](/ko/providers/google)
- [Groq (LPU inference)](/ko/providers/groq)
- [Hugging Face (Inference)](/ko/providers/huggingface)
- [Kilocode](/ko/providers/kilocode)
- [LiteLLM (통합 gateway)](/ko/providers/litellm)
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
- [Vydra](/ko/providers/vydra)
- [vLLM (local models)](/ko/providers/vllm)
- [Volcengine (Doubao)](/ko/providers/volcengine)
- [xAI](/ko/providers/xai)
- [Xiaomi](/ko/providers/xiaomi)
- [Z.AI](/ko/providers/zai)

## 공통 개요 페이지

- [Additional bundled variants](/ko/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy, Gemini CLI OAuth
- [Image Generation](/ko/tools/image-generation) - 공통 `image_generate` tool, provider 선택 및 failover
- [Music Generation](/ko/tools/music-generation) - 공통 `music_generate` tool, provider 선택 및 failover
- [Video Generation](/ko/tools/video-generation) - 공통 `video_generate` tool, provider 선택 및 failover

## 전사 providers

- [Deepgram (오디오 전사)](/ko/providers/deepgram)

## 커뮤니티 도구

- [Claude Max API Proxy](/ko/providers/claude-max-api-proxy) - Claude 구독 자격 증명을 위한 커뮤니티 proxy(사용 전에 Anthropic 정책/약관 확인)

전체 provider 카탈로그(xAI, Groq, Mistral 등)와 고급 구성은
[Model providers](/ko/concepts/model-providers)를 참조하세요.
