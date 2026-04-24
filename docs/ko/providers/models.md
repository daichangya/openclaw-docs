---
read_when:
    - 모델 provider를 선택하려는 경우
    - LLM 인증 + 모델 선택을 위한 빠른 설정 예시를 원하는 경우
summary: OpenClaw가 지원하는 모델 provider(LLM)
title: 모델 provider 빠른 시작
x-i18n:
    generated_at: "2026-04-24T06:32:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: b824a664e0e7a7a5b0ea640ea7329ea3d1e3d12b85d9310231c76014b2ae01cc
    source_path: providers/models.md
    workflow: 15
---

# 모델 Provider

OpenClaw는 많은 LLM provider를 사용할 수 있습니다. 하나를 선택하고, 인증한 다음, 기본
모델을 `provider/model`로 설정하세요.

## 빠른 시작(2단계)

1. provider로 인증합니다(보통 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 지원되는 provider(시작용 목록)

- [Alibaba Model Studio](/ko/providers/alibaba)
- [Amazon Bedrock](/ko/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ko/providers/anthropic)
- [BytePlus (International)](/ko/concepts/model-providers#byteplus-international)
- [Chutes](/ko/providers/chutes)
- [ComfyUI](/ko/providers/comfy)
- [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
- [fal](/ko/providers/fal)
- [Fireworks](/ko/providers/fireworks)
- [GLM 모델](/ko/providers/glm)
- [MiniMax](/ko/providers/minimax)
- [Mistral](/ko/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ko/providers/moonshot)
- [OpenAI (API + Codex)](/ko/providers/openai)
- [OpenCode (Zen + Go)](/ko/providers/opencode)
- [OpenRouter](/ko/providers/openrouter)
- [Qianfan](/ko/providers/qianfan)
- [Qwen](/ko/providers/qwen)
- [Runway](/ko/providers/runway)
- [StepFun](/ko/providers/stepfun)
- [Synthetic](/ko/providers/synthetic)
- [Vercel AI Gateway](/ko/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/ko/providers/venice)
- [xAI](/ko/providers/xai)
- [Z.AI](/ko/providers/zai)

## 추가 번들 provider 변형

- `anthropic-vertex` - Vertex 자격 증명을 사용할 수 있을 때 암묵적인 Anthropic on Google Vertex 지원. 별도의 온보딩 인증 선택지 없음
- `copilot-proxy` - 로컬 VS Code Copilot Proxy 브리지. `openclaw onboard --auth-choice copilot-proxy` 사용
- `google-gemini-cli` - 비공식 Gemini CLI OAuth 흐름. 로컬 `gemini` 설치 필요(`brew install gemini-cli` 또는 `npm install -g @google/gemini-cli`). 기본 모델은 `google-gemini-cli/gemini-3-flash-preview`. `openclaw onboard --auth-choice google-gemini-cli` 또는 `openclaw models auth login --provider google-gemini-cli --set-default` 사용

전체 provider 카탈로그(xAI, Groq, Mistral 등)와 고급 구성은
[모델 provider](/ko/concepts/model-providers)를 참조하세요.

## 관련

- [모델 선택](/ko/concepts/model-providers)
- [모델 failover](/ko/concepts/model-failover)
- [Models CLI](/ko/cli/models)
