---
read_when:
    - Sie möchten einen Modell-Provider auswählen.
    - Sie möchten schnelle Einrichtungsbeispiele für LLM-Authentifizierung + Modellauswahl.
summary: Von OpenClaw unterstützte Modell-Provider (LLMs)
title: Schnellstart für Modell-Provider
x-i18n:
    generated_at: "2026-04-24T06:54:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b824a664e0e7a7a5b0ea640ea7329ea3d1e3d12b85d9310231c76014b2ae01cc
    source_path: providers/models.md
    workflow: 15
---

# Modell-Provider

OpenClaw kann viele LLM-Provider verwenden. Wählen Sie einen aus, authentifizieren Sie sich und setzen Sie dann das Standard-
Modell als `provider/model`.

## Schnellstart (zwei Schritte)

1. Beim Provider authentifizieren (normalerweise über `openclaw onboard`).
2. Das Standardmodell setzen:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Unterstützte Provider (Starter-Set)

- [Alibaba Model Studio](/de/providers/alibaba)
- [Amazon Bedrock](/de/providers/bedrock)
- [Anthropic (API + Claude CLI)](/de/providers/anthropic)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/de/providers/chutes)
- [ComfyUI](/de/providers/comfy)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [fal](/de/providers/fal)
- [Fireworks](/de/providers/fireworks)
- [GLM models](/de/providers/glm)
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

- `anthropic-vertex` - implizite Anthropic-Unterstützung auf Google Vertex, wenn Vertex-Zugangsdaten verfügbar sind; keine separate Onboarding-Auth-Auswahl
- `copilot-proxy` - lokale VS Code Copilot Proxy-Bridge; verwenden Sie `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - inoffizieller OAuth-Flow für Gemini CLI; erfordert eine lokale Installation von `gemini` (`brew install gemini-cli` oder `npm install -g @google/gemini-cli`); Standardmodell `google-gemini-cli/gemini-3-flash-preview`; verwenden Sie `openclaw onboard --auth-choice google-gemini-cli` oder `openclaw models auth login --provider google-gemini-cli --set-default`

Für den vollständigen Provider-Katalog (xAI, Groq, Mistral usw.) und erweiterte Konfiguration
siehe [Model providers](/de/concepts/model-providers).

## Verwandt

- [Model selection](/de/concepts/model-providers)
- [Model failover](/de/concepts/model-failover)
- [Models CLI](/de/cli/models)
