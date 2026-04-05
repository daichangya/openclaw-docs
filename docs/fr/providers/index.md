---
read_when:
    - Vous voulez choisir un fournisseur de modèles
    - Vous avez besoin d’une vue d’ensemble rapide des backends LLM pris en charge
summary: Fournisseurs de modèles (LLM) pris en charge par OpenClaw
title: Répertoire des fournisseurs
x-i18n:
    generated_at: "2026-04-05T12:51:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 690d17c14576d454ea3cd3dcbc704470da10a2a34adfe681dab7048438f2e193
    source_path: providers/index.md
    workflow: 15
---

# Fournisseurs de modèles

OpenClaw peut utiliser de nombreux fournisseurs LLM. Choisissez un fournisseur, authentifiez-vous, puis définissez le
modèle par défaut sous la forme `provider/model`.

Vous cherchez la documentation des canaux de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/etc.) ? Voir [Canaux](/channels).

## Démarrage rapide

1. Authentifiez-vous auprès du fournisseur (généralement via `openclaw onboard`).
2. Définissez le modèle par défaut :

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentation des fournisseurs

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [BytePlus (international)](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepSeek](/providers/deepseek)
- [Fireworks](/providers/fireworks)
- [GitHub Copilot](/providers/github-copilot)
- [Modèles GLM](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq (inférence LPU)](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (gateway unifiée)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (modèles cloud + locaux)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity (recherche web)](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen Cloud](/providers/qwen)
- [Qwen / Model Studio (détail de point de terminaison ; `qwen-*` canonique, `modelstudio-*` hérité)](/providers/qwen_modelstudio)
- [SGLang (modèles locaux)](/providers/sglang)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Together AI](/providers/together)
- [Venice (Venice AI, axé sur la confidentialité)](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [vLLM (modèles locaux)](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Pages d’ensemble partagées

- [Variantes intégrées supplémentaires](/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy et Gemini CLI OAuth

## Fournisseurs de transcription

- [Deepgram (transcription audio)](/providers/deepgram)

## Outils communautaires

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Proxy communautaire pour les identifiants d’abonnement Claude (vérifiez la politique/les conditions Anthropic avant utilisation)

Pour le catalogue complet des fournisseurs (xAI, Groq, Mistral, etc.) et la configuration avancée,
voir [Fournisseurs de modèles](/concepts/model-providers).
