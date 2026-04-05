---
read_when:
    - Sie möchten einen Modell-Provider auswählen
    - Sie möchten schnelle Einrichtungsbeispiele für LLM-Authentifizierung und Modellauswahl
summary: Von OpenClaw unterstützte Modell-Provider (LLMs)
title: Schnellstart für Modell-Provider
x-i18n:
    generated_at: "2026-04-05T12:53:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83e372193b476c7cee6eb9f5c443b03563d863043f47c633ac0096bca642cc6f
    source_path: providers/models.md
    workflow: 15
---

# Modell-Provider

OpenClaw kann viele LLM-Provider verwenden. Wählen Sie einen aus, authentifizieren Sie sich und setzen Sie dann das Standardmodell als `provider/model`.

## Schnellstart (zwei Schritte)

1. Authentifizieren Sie sich beim Provider (normalerweise über `openclaw onboard`).
2. Legen Sie das Standardmodell fest:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Unterstützte Provider (Startauswahl)

- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [Amazon Bedrock](/providers/bedrock)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Fireworks](/providers/fireworks)
- [GLM-Modelle](/providers/glm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Qianfan](/providers/qianfan)
- [Qwen](/providers/qwen)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/providers/venice)
- [xAI](/providers/xai)
- [Z.AI](/providers/zai)

## Zusätzliche gebündelte Provider-Varianten

- `anthropic-vertex` - implizite Anthropic-Unterstützung auf Google Vertex, wenn Vertex-Anmeldedaten verfügbar sind; keine separate Onboarding-Authentifizierungsoption
- `copilot-proxy` - lokale VS Code Copilot Proxy-Bridge; verwenden Sie `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - inoffizieller Gemini-CLI-OAuth-Flow; erfordert eine lokale `gemini`-Installation (`brew install gemini-cli` oder `npm install -g @google/gemini-cli`); Standardmodell `google-gemini-cli/gemini-3.1-pro-preview`; verwenden Sie `openclaw onboard --auth-choice google-gemini-cli` oder `openclaw models auth login --provider google-gemini-cli --set-default`

Den vollständigen Provider-Katalog (xAI, Groq, Mistral usw.) und die erweiterte Konfiguration finden Sie unter [Modell-Provider](/de/concepts/model-providers).
