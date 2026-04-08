---
read_when:
    - 모델 제공자를 선택하고 싶을 때
    - 지원되는 LLM 백엔드의 빠른 개요가 필요할 때
summary: OpenClaw가 지원하는 모델 제공자(LLM)
title: 제공자 디렉터리
x-i18n:
    generated_at: "2026-04-08T02:17:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7bee5528b7fc9a982b3d0eaa4930cb77f7bded19a47aec00572b6fcbd823a70
    source_path: providers/index.md
    workflow: 15
---

# 모델 제공자

OpenClaw는 많은 LLM 제공자를 사용할 수 있습니다. 제공자를 선택하고 인증한 다음,
기본 모델을 `provider/model`로 설정하세요.

채팅 채널 문서(WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/기타)를 찾고 있나요? [채널](/ko/channels)을 참조하세요.

## 빠른 시작

1. 제공자로 인증합니다(보통 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 제공자 문서

- [Alibaba Model Studio](/ko/providers/alibaba)
- [Amazon Bedrock](/ko/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ko/providers/anthropic)
- [Arcee AI (Trinity 모델)](/ko/providers/arcee)
- [BytePlus (International)](/ko/concepts/model-providers#byteplus-international)
- [Chutes](/ko/providers/chutes)
- [ComfyUI](/ko/providers/comfy)
- [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
- [DeepSeek](/ko/providers/deepseek)
- [fal](/ko/providers/fal)
- [Fireworks](/ko/providers/fireworks)
- [GitHub Copilot](/ko/providers/github-copilot)
- [GLM 모델](/ko/providers/glm)
- [Google (Gemini)](/ko/providers/google)
- [Groq (LPU 추론)](/ko/providers/groq)
- [Hugging Face (추론)](/ko/providers/huggingface)
- [inferrs (로컬 모델)](/ko/providers/inferrs)
- [Kilocode](/ko/providers/kilocode)
- [LiteLLM (통합 gateway)](/ko/providers/litellm)
- [MiniMax](/ko/providers/minimax)
- [Mistral](/ko/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ko/providers/moonshot)
- [NVIDIA](/ko/providers/nvidia)
- [Ollama (클라우드 + 로컬 모델)](/ko/providers/ollama)
- [OpenAI (API + Codex)](/ko/providers/openai)
- [OpenCode](/ko/providers/opencode)
- [OpenCode Go](/ko/providers/opencode-go)
- [OpenRouter](/ko/providers/openrouter)
- [Perplexity (웹 검색)](/ko/providers/perplexity-provider)
- [Qianfan](/ko/providers/qianfan)
- [Qwen Cloud](/ko/providers/qwen)
- [Runway](/ko/providers/runway)
- [SGLang (로컬 모델)](/ko/providers/sglang)
- [StepFun](/ko/providers/stepfun)
- [Synthetic](/ko/providers/synthetic)
- [Together AI](/ko/providers/together)
- [Venice (Venice AI, 개인정보 보호 중심)](/ko/providers/venice)
- [Vercel AI Gateway](/ko/providers/vercel-ai-gateway)
- [Vydra](/ko/providers/vydra)
- [vLLM (로컬 모델)](/ko/providers/vllm)
- [Volcengine (Doubao)](/ko/providers/volcengine)
- [xAI](/ko/providers/xai)
- [Xiaomi](/ko/providers/xiaomi)
- [Z.AI](/ko/providers/zai)

## 공통 개요 페이지

- [추가 번들 변형](/ko/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy, Gemini CLI OAuth
- [이미지 생성](/ko/tools/image-generation) - 공통 `image_generate` 도구, 제공자 선택, 장애 조치
- [음악 생성](/ko/tools/music-generation) - 공통 `music_generate` 도구, 제공자 선택, 장애 조치
- [비디오 생성](/ko/tools/video-generation) - 공통 `video_generate` 도구, 제공자 선택, 장애 조치

## 전사 제공자

- [Deepgram (오디오 전사)](/ko/providers/deepgram)

## 커뮤니티 도구

- [Claude Max API Proxy](/ko/providers/claude-max-api-proxy) - Claude 구독 자격 증명을 위한 커뮤니티 프록시(사용 전 Anthropic 정책/약관을 확인하세요)

전체 제공자 카탈로그(xAI, Groq, Mistral 등)와 고급 설정은
[모델 제공자](/ko/concepts/model-providers)를 참조하세요.
