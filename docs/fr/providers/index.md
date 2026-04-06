---
read_when:
    - Vous voulez choisir un fournisseur de modèles
    - Vous avez besoin d’un aperçu rapide des backends LLM pris en charge
summary: Fournisseurs de modèles (LLM) pris en charge par OpenClaw
title: Répertoire des fournisseurs
x-i18n:
    generated_at: "2026-04-06T03:10:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7271157a6ab5418672baff62bfd299572fd010f75aad529267095c6e55903882
    source_path: providers/index.md
    workflow: 15
---

# Fournisseurs de modèles

OpenClaw peut utiliser de nombreux fournisseurs de LLM. Choisissez un fournisseur, authentifiez-vous, puis définissez le
modèle par défaut sous la forme `provider/model`.

Vous cherchez la documentation des canaux de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/etc.) ? Consultez [Channels](/fr/channels).

## Démarrage rapide

1. Authentifiez-vous auprès du fournisseur (généralement via `openclaw onboard`).
2. Définissez le modèle par défaut :

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentation des fournisseurs

- [Alibaba Model Studio](/providers/alibaba)
- [Amazon Bedrock](/fr/providers/bedrock)
- [Anthropic (API + Claude CLI)](/fr/providers/anthropic)
- [BytePlus (International)](/fr/concepts/model-providers#byteplus-international)
- [Chutes](/fr/providers/chutes)
- [ComfyUI](/providers/comfy)
- [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
- [DeepSeek](/fr/providers/deepseek)
- [fal](/providers/fal)
- [Fireworks](/fr/providers/fireworks)
- [GitHub Copilot](/fr/providers/github-copilot)
- [Modèles GLM](/fr/providers/glm)
- [Google (Gemini)](/fr/providers/google)
- [Groq (inférence LPU)](/fr/providers/groq)
- [Hugging Face (Inference)](/fr/providers/huggingface)
- [Kilocode](/fr/providers/kilocode)
- [LiteLLM (passerelle unifiée)](/fr/providers/litellm)
- [MiniMax](/fr/providers/minimax)
- [Mistral](/fr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
- [NVIDIA](/fr/providers/nvidia)
- [Ollama (modèles cloud + locaux)](/fr/providers/ollama)
- [OpenAI (API + Codex)](/fr/providers/openai)
- [OpenCode](/fr/providers/opencode)
- [OpenCode Go](/fr/providers/opencode-go)
- [OpenRouter](/fr/providers/openrouter)
- [Perplexity (recherche Web)](/fr/providers/perplexity-provider)
- [Qianfan](/fr/providers/qianfan)
- [Qwen Cloud](/fr/providers/qwen)
- [Runway](/providers/runway)
- [SGLang (modèles locaux)](/fr/providers/sglang)
- [StepFun](/fr/providers/stepfun)
- [Synthetic](/fr/providers/synthetic)
- [Together AI](/fr/providers/together)
- [Venice (Venice AI, axé sur la confidentialité)](/fr/providers/venice)
- [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
- [Vydra](/providers/vydra)
- [vLLM (modèles locaux)](/fr/providers/vllm)
- [Volcengine (Doubao)](/fr/providers/volcengine)
- [xAI](/fr/providers/xai)
- [Xiaomi](/fr/providers/xiaomi)
- [Z.AI](/fr/providers/zai)

## Pages d’ensemble partagées

- [Variantes groupées supplémentaires](/fr/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy et Gemini CLI OAuth
- [Génération d’images](/fr/tools/image-generation) - outil partagé `image_generate`, sélection du fournisseur et bascule
- [Génération musicale](/tools/music-generation) - outil partagé `music_generate`, sélection du fournisseur et bascule
- [Génération vidéo](/tools/video-generation) - outil partagé `video_generate`, sélection du fournisseur et bascule

## Fournisseurs de transcription

- [Deepgram (transcription audio)](/fr/providers/deepgram)

## Outils de la communauté

- [Claude Max API Proxy](/fr/providers/claude-max-api-proxy) - Proxy communautaire pour les identifiants d’abonnement Claude (vérifiez la politique/les conditions d’Anthropic avant utilisation)

Pour le catalogue complet des fournisseurs (xAI, Groq, Mistral, etc.) et la configuration avancée,
consultez [Model providers](/fr/concepts/model-providers).
