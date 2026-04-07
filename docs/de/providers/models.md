---
read_when:
    - Sie möchten einen Modell-Provider auswählen
    - Sie möchten schnelle Einrichtungsbeispiele für LLM-Authentifizierung und Modellauswahl
summary: Von OpenClaw unterstützte Modell-Provider (LLMs)
title: Schnellstart für Modell-Provider
x-i18n:
    generated_at: "2026-04-07T06:18:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 500191bfe853241096f97928ced2327a13b6f7f62003cb7452b24886c272e6ba
    source_path: providers/models.md
    workflow: 15
---

# Model-Provider

OpenClaw kann viele LLM-Provider verwenden. Wählen Sie einen aus, authentifizieren Sie sich und legen Sie dann das Standard-
Modell als `provider/model` fest.

## Schnellstart (zwei Schritte)

1. Authentifizieren Sie sich beim Provider (normalerweise über `openclaw onboard`).
2. Legen Sie das Standardmodell fest:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Unterstützte Provider (Startauswahl)

- [Alibaba Model Studio](/de/providers/alibaba)
- [Anthropic (API + Claude CLI)](/de/providers/anthropic)
- [Amazon Bedrock](/de/providers/bedrock)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/de/providers/chutes)
- [ComfyUI](/de/providers/comfy)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [fal](/de/providers/fal)
- [Fireworks](/de/providers/fireworks)
- [GLM-Modelle](/de/providers/glm)
- [MiniMax](/de/providers/minimax)
- [Mistral](/de/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
- [OpenAI (API + Codex)](/de/providers/openai)
- [OpenCode (Zen + Go)](/de/providers/opencode)
- [OpenRouter](/de/providers/openrouter)
- [Qianfan](/de/providers/qianfan)
- [Qwen](/de/providers/qwen)
- [Runway](/de/providers/runway)
- [StepFun](/de/providers/stepfun)
- [Synthetic](/de/providers/synthetic)
- [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/de/providers/venice)
- [xAI](/de/providers/xai)
- [Z.AI](/de/providers/zai)

## Zusätzliche gebündelte Provider-Varianten

- `anthropic-vertex` - implizite Anthropic-Unterstützung auf Google Vertex, wenn Vertex-Anmeldedaten verfügbar sind; keine separate Onboarding-Authentifizierungsoption
- `copilot-proxy` - lokale VS Code Copilot Proxy-Bridge; verwenden Sie `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - inoffizieller Gemini-CLI-OAuth-Flow; erfordert eine lokale `gemini`-Installation (`brew install gemini-cli` oder `npm install -g @google/gemini-cli`); Standardmodell `google-gemini-cli/gemini-3.1-pro-preview`; verwenden Sie `openclaw onboard --auth-choice google-gemini-cli` oder `openclaw models auth login --provider google-gemini-cli --set-default`

Den vollständigen Provider-Katalog (xAI, Groq, Mistral usw.) und die erweiterte Konfiguration finden Sie unter [Model providers](/de/concepts/model-providers).
