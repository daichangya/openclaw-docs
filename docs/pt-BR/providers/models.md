---
read_when:
    - Você quer escolher um provider de modelo
    - Você quer exemplos rápidos de configuração para autenticação de LLM + seleção de modelo
summary: Providers de modelo (LLMs) compatíveis com o OpenClaw
title: Guia rápido de Provider de Modelo
x-i18n:
    generated_at: "2026-04-05T12:51:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83e372193b476c7cee6eb9f5c443b03563d863043f47c633ac0096bca642cc6f
    source_path: providers/models.md
    workflow: 15
---

# Providers de Modelo

O OpenClaw pode usar muitos providers de LLM. Escolha um, autentique-se e depois defina o modelo padrão
como `provider/model`.

## Início rápido (duas etapas)

1. Autentique-se com o provider (geralmente via `openclaw onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Providers compatíveis (conjunto inicial)

- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [Amazon Bedrock](/providers/bedrock)
- [BytePlus (Internacional)](/pt-BR/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Fireworks](/providers/fireworks)
- [Modelos GLM](/providers/glm)
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

## Variantes adicionais de provider empacotadas

- `anthropic-vertex` - suporte implícito a Anthropic no Google Vertex quando credenciais Vertex estão disponíveis; sem escolha separada de autenticação no onboarding
- `copilot-proxy` - bridge local do VS Code Copilot Proxy; use `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - fluxo OAuth não oficial do Gemini CLI; exige uma instalação local de `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`); modelo padrão `google-gemini-cli/gemini-3.1-pro-preview`; use `openclaw onboard --auth-choice google-gemini-cli` ou `openclaw models auth login --provider google-gemini-cli --set-default`

Para o catálogo completo de providers (xAI, Groq, Mistral etc.) e configuração avançada,
consulte [Providers de modelo](/pt-BR/concepts/model-providers).
