---
read_when:
    - Vuoi scegliere un provider di modelli
    - Hai bisogno di una rapida panoramica dei backend LLM supportati
summary: Provider di modelli (LLM) supportati da OpenClaw
title: Directory dei provider
x-i18n:
    generated_at: "2026-04-26T11:37:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5d3bf5b30bd7a1dbd8b1348f4f07f178fea9bfea523afa96cad2a30d566a139
    source_path: providers/index.md
    workflow: 15
---

# Provider di modelli

OpenClaw può usare molti provider LLM. Scegli un provider, autenticati, quindi imposta il
modello predefinito come `provider/model`.

Cerchi la documentazione dei canali chat (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/ecc.)? Vedi [Canali](/it/channels).

## Introduzione rapida

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
- [Amazon Bedrock Mantle](/it/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/it/providers/anthropic)
- [Arcee AI (modelli Trinity)](/it/providers/arcee)
- [Azure Speech](/it/providers/azure-speech)
- [BytePlus (internazionale)](/it/concepts/model-providers#byteplus-international)
- [Chutes](/it/providers/chutes)
- [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
- [ComfyUI](/it/providers/comfy)
- [DeepSeek](/it/providers/deepseek)
- [ElevenLabs](/it/providers/elevenlabs)
- [fal](/it/providers/fal)
- [Fireworks](/it/providers/fireworks)
- [GitHub Copilot](/it/providers/github-copilot)
- [Gradium](/it/providers/gradium)
- [Modelli GLM](/it/providers/glm)
- [Google (Gemini)](/it/providers/google)
- [Groq (inferenza LPU)](/it/providers/groq)
- [Hugging Face (Inference)](/it/providers/huggingface)
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
- [SenseAudio](/it/providers/senseaudio)
- [SGLang (modelli locali)](/it/providers/sglang)
- [StepFun](/it/providers/stepfun)
- [Synthetic](/it/providers/synthetic)
- [Tencent Cloud (TokenHub)](/it/providers/tencent)
- [Together AI](/it/providers/together)
- [Venice (Venice AI, orientato alla privacy)](/it/providers/venice)
- [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
- [vLLM (modelli locali)](/it/providers/vllm)
- [Volcengine (Doubao)](/it/providers/volcengine)
- [Vydra](/it/providers/vydra)
- [xAI](/it/providers/xai)
- [Xiaomi](/it/providers/xiaomi)
- [Z.AI](/it/providers/zai)

## Pagine di panoramica condivise

- [Varianti incluse aggiuntive](/it/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy e Gemini CLI OAuth
- [Generazione di immagini](/it/tools/image-generation) - Tool condiviso `image_generate`, selezione del provider e failover
- [Generazione musicale](/it/tools/music-generation) - Tool condiviso `music_generate`, selezione del provider e failover
- [Generazione video](/it/tools/video-generation) - Tool condiviso `video_generate`, selezione del provider e failover

## Provider di trascrizione

- [Deepgram (trascrizione audio)](/it/providers/deepgram)
- [ElevenLabs](/it/providers/elevenlabs#speech-to-text)
- [Mistral](/it/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/it/providers/openai#speech-to-text)
- [SenseAudio](/it/providers/senseaudio)
- [xAI](/it/providers/xai#speech-to-text)

## Tool della community

- [Claude Max API Proxy](/it/providers/claude-max-api-proxy) - Proxy della community per credenziali di abbonamento Claude (verifica criteri/termini di Anthropic prima dell'uso)

Per il catalogo completo dei provider (xAI, Groq, Mistral, ecc.) e la configurazione avanzata,
vedi [Provider di modelli](/it/concepts/model-providers).
