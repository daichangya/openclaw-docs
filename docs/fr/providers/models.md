---
read_when:
    - Vous voulez choisir un fournisseur de modèles
    - Vous voulez des exemples rapides de configuration pour l’authentification LLM + la sélection de modèle
summary: Fournisseurs de modèles (LLM) pris en charge par OpenClaw
title: Démarrage rapide des fournisseurs de modèles
x-i18n:
    generated_at: "2026-04-05T12:51:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83e372193b476c7cee6eb9f5c443b03563d863043f47c633ac0096bca642cc6f
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

## Fournisseurs pris en charge (ensemble de démarrage)

- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [Amazon Bedrock](/providers/bedrock)
- [BytePlus (international)](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Fireworks](/providers/fireworks)
- [Modèles GLM](/providers/glm)
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

## Variantes de fournisseurs intégrés supplémentaires

- `anthropic-vertex` - prise en charge implicite d’Anthropic sur Google Vertex lorsque les identifiants Vertex sont disponibles ; pas de choix d’authentification d’onboarding séparé
- `copilot-proxy` - passerelle locale VS Code Copilot Proxy ; utilisez `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flux OAuth non officiel Gemini CLI ; nécessite une installation locale de `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`) ; modèle par défaut `google-gemini-cli/gemini-3.1-pro-preview` ; utilisez `openclaw onboard --auth-choice google-gemini-cli` ou `openclaw models auth login --provider google-gemini-cli --set-default`

Pour le catalogue complet des fournisseurs (xAI, Groq, Mistral, etc.) et la configuration avancée,
voir [Fournisseurs de modèles](/concepts/model-providers).
