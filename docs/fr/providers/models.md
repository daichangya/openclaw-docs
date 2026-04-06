---
read_when:
    - Vous voulez choisir un fournisseur de modèles
    - Vous voulez des exemples de configuration rapide pour l’authentification LLM + la sélection de modèle
summary: Fournisseurs de modèles (LLM) pris en charge par OpenClaw
title: Démarrage rapide des fournisseurs de modèles
x-i18n:
    generated_at: "2026-04-06T03:11:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0314fb1c754171e5fc252d30f7ba9bb6acdbb978d97e9249264d90351bac2e7
    source_path: providers/models.md
    workflow: 15
---

# Fournisseurs de modèles

OpenClaw peut utiliser de nombreux fournisseurs LLM. Choisissez-en un, authentifiez-vous, puis définissez le
modèle par défaut sous la forme `provider/model`.

## Démarrage rapide (deux étapes)

1. Authentifiez-vous auprès du fournisseur (généralement via `openclaw onboard`).
2. Définissez le modèle par défaut :

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Fournisseurs pris en charge (ensemble de départ)

- [Alibaba Model Studio](/providers/alibaba)
- [Anthropic (API + Claude CLI)](/fr/providers/anthropic)
- [Amazon Bedrock](/fr/providers/bedrock)
- [BytePlus (International)](/fr/concepts/model-providers#byteplus-international)
- [Chutes](/fr/providers/chutes)
- [ComfyUI](/providers/comfy)
- [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
- [fal](/providers/fal)
- [Fireworks](/fr/providers/fireworks)
- [Modèles GLM](/fr/providers/glm)
- [MiniMax](/fr/providers/minimax)
- [Mistral](/fr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
- [OpenAI (API + Codex)](/fr/providers/openai)
- [OpenCode (Zen + Go)](/fr/providers/opencode)
- [OpenRouter](/fr/providers/openrouter)
- [Qianfan](/fr/providers/qianfan)
- [Qwen](/fr/providers/qwen)
- [Runway](/providers/runway)
- [StepFun](/fr/providers/stepfun)
- [Synthetic](/fr/providers/synthetic)
- [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/fr/providers/venice)
- [xAI](/fr/providers/xai)
- [Z.AI](/fr/providers/zai)

## Variantes supplémentaires de fournisseurs intégrés

- `anthropic-vertex` - prise en charge implicite d’Anthropic sur Google Vertex lorsque des identifiants Vertex sont disponibles ; aucun choix d’authentification d’onboarding séparé
- `copilot-proxy` - pont proxy local VS Code Copilot ; utilisez `openclaw onboard --auth-choice copilot-proxy`

Pour le catalogue complet des fournisseurs (xAI, Groq, Mistral, etc.) et la configuration avancée,
voir [Fournisseurs de modèles](/fr/concepts/model-providers).
