---
read_when:
    - Vuoi scegliere un provider di modelli
    - Ti serve una rapida panoramica dei backend LLM supportati
summary: Provider di modelli (LLM) supportati da OpenClaw
title: Directory dei provider
x-i18n:
    generated_at: "2026-04-13T08:27:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bc682d008119719826f71f74959ab32bedf14214459f5e6ac9cb70371d3c540
    source_path: providers/index.md
    workflow: 15
---

# Provider di modelli

OpenClaw può usare molti provider LLM. Scegli un provider, autenticati, quindi imposta il
modello predefinito come `provider/model`.

Cerchi la documentazione dei canali di chat (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/ecc.)? Vedi [Canali](/it/channels).

## Guida rapida

1. Autenticati con il provider (di solito tramite `openclaw onboard`).
2. Imposta il modello predefinito:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentazione dei provider

- [Alibaba Model Studio](/it/providers/alibaba)
- [Amazon Bedrock](/it/providers/bedrock)
- [Anthropic (API + Claude CLI)](/it/providers/anthropic)
- [Arcee AI (modelli Trinity)](/it/providers/arcee)
- [BytePlus (internazionale)](/it/concepts/model-providers#byteplus-international)
- [Chutes](/it/providers/chutes)
- [ComfyUI](/it/providers/comfy)
- [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
- [DeepSeek](/it/providers/deepseek)
- [fal](/it/providers/fal)
- [Fireworks](/it/providers/fireworks)
- [GitHub Copilot](/it/providers/github-copilot)
- [Modelli GLM](/it/providers/glm)
- [Google (Gemini)](/it/providers/google)
- [Groq (inferenza LPU)](/it/providers/groq)
- [Hugging Face (inferenza)](/it/providers/huggingface)
- [inferrs (modelli locali)](/it/providers/inferrs)
- [Kilocode](/it/providers/kilocode)
- [LiteLLM (Gateway unificato)](/it/providers/litellm)
- [LM Studio (modelli locali)](/it/providers/lmstudio)
- [MiniMax](/it/providers/minimax)
- [Mistral](/it/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
- [NVIDIA](/it/providers/nvidia)
- [Ollama (cloud + modelli locali)](/it/providers/ollama)
- [OpenAI (API + Codex)](/it/providers/openai)
- [OpenCode](/it/providers/opencode)
- [OpenCode Go](/it/providers/opencode-go)
- [OpenRouter](/it/providers/openrouter)
- [Perplexity (ricerca web)](/it/providers/perplexity-provider)
- [Qianfan](/it/providers/qianfan)
- [Qwen Cloud](/it/providers/qwen)
- [Runway](/it/providers/runway)
- [SGLang (modelli locali)](/it/providers/sglang)
- [StepFun](/it/providers/stepfun)
- [Synthetic](/it/providers/synthetic)
- [Together AI](/it/providers/together)
- [Venice (Venice AI, orientato alla privacy)](/it/providers/venice)
- [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
- [Vydra](/it/providers/vydra)
- [vLLM (modelli locali)](/it/providers/vllm)
- [Volcengine (Doubao)](/it/providers/volcengine)
- [xAI](/it/providers/xai)
- [Xiaomi](/it/providers/xiaomi)
- [Z.AI](/it/providers/zai)

## Pagine panoramiche condivise

- [Varianti bundle aggiuntive](/it/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy e Gemini CLI OAuth
- [Generazione di immagini](/it/tools/image-generation) - Strumento condiviso `image_generate`, selezione del provider e failover
- [Generazione musicale](/it/tools/music-generation) - Strumento condiviso `music_generate`, selezione del provider e failover
- [Generazione video](/it/tools/video-generation) - Strumento condiviso `video_generate`, selezione del provider e failover

## Provider di trascrizione

- [Deepgram (trascrizione audio)](/it/providers/deepgram)

## Strumenti della community

- [Claude Max API Proxy](/it/providers/claude-max-api-proxy) - Proxy della community per le credenziali di abbonamento Claude (verifica la policy/i termini di Anthropic prima dell'uso)

Per il catalogo completo dei provider (xAI, Groq, Mistral, ecc.) e la configurazione avanzata,
vedi [Provider di modelli](/it/concepts/model-providers).
