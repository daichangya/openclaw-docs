---
read_when:
    - 모델 provider를 선택하고자 하는 경우
    - LLM 인증 + 모델 선택에 대한 빠른 설정 예제가 필요한 경우
summary: OpenClaw가 지원하는 모델 provider(LLM)
title: 모델 provider 빠른 시작 guide
x-i18n:
    generated_at: "2026-04-23T06:07:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b002903bd0a1872e77d871f283ae426c74356936c5776c710711d7328427fca
    source_path: providers/models.md
    workflow: 15
---

# 모델 provider

OpenClaw는 많은 LLM provider를 사용할 수 있습니다. 하나를 선택하고, 인증한 다음, 기본
모델을 `provider/model` 형식으로 설정하세요.

## 빠른 시작(2단계)

1. provider로 인증합니다(보통 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다:

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
- [GLM models](/ko/providers/glm)
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

- `anthropic-vertex` - Vertex 자격 증명을 사용할 수 있을 때의 암시적 Anthropic on Google Vertex 지원입니다. 별도의 온보딩 인증 선택은 없습니다
- `copilot-proxy` - 로컬 VS Code Copilot Proxy 브리지입니다. `openclaw onboard --auth-choice copilot-proxy`를 사용하세요
- `google-gemini-cli` - 비공식 Gemini CLI OAuth 흐름입니다. 로컬 `gemini` 설치가 필요합니다(`brew install gemini-cli` 또는 `npm install -g @google/gemini-cli`). 기본 모델은 `google-gemini-cli/gemini-3-flash-preview`이며, `openclaw onboard --auth-choice google-gemini-cli` 또는 `openclaw models auth login --provider google-gemini-cli --set-default`를 사용하세요

전체 provider 카탈로그(xAI, Groq, Mistral 등)와 고급 구성은
[Model providers](/ko/concepts/model-providers)를 참고하세요.
