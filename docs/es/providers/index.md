---
read_when:
    - Quieres elegir un proveedor de modelos
    - Necesitas una visión general rápida de los backends LLM compatibles
summary: Proveedores de modelos (LLM) compatibles con OpenClaw
title: Directorio de proveedores
x-i18n:
    generated_at: "2026-04-22T04:26:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d77e5da93d71c48ea97460c6be56fbbe8279d9240a8101e1b35fdafb657737e
    source_path: providers/index.md
    workflow: 15
---

# Proveedores de modelos

OpenClaw puede usar muchos proveedores de LLM. Elige un proveedor, autentícate y luego establece el
modelo predeterminado como `provider/model`.

¿Buscas documentación de canales de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/etc.)? Consulta [Canales](/es/channels).

## Inicio rápido

1. Autentícate con el proveedor (normalmente mediante `openclaw onboard`).
2. Establece el modelo predeterminado:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentación de proveedores

- [Alibaba Model Studio](/es/providers/alibaba)
- [Amazon Bedrock](/es/providers/bedrock)
- [Anthropic (API + Claude CLI)](/es/providers/anthropic)
- [Arcee AI (modelos Trinity)](/es/providers/arcee)
- [BytePlus (internacional)](/es/concepts/model-providers#byteplus-international)
- [Chutes](/es/providers/chutes)
- [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
- [ComfyUI](/es/providers/comfy)
- [DeepSeek](/es/providers/deepseek)
- [fal](/es/providers/fal)
- [Fireworks](/es/providers/fireworks)
- [GitHub Copilot](/es/providers/github-copilot)
- [Modelos GLM](/es/providers/glm)
- [Google (Gemini)](/es/providers/google)
- [Groq (inferencia LPU)](/es/providers/groq)
- [Hugging Face (Inference)](/es/providers/huggingface)
- [inferrs (modelos locales)](/es/providers/inferrs)
- [Kilocode](/es/providers/kilocode)
- [LiteLLM (gateway unificado)](/es/providers/litellm)
- [LM Studio (modelos locales)](/es/providers/lmstudio)
- [MiniMax](/es/providers/minimax)
- [Mistral](/es/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
- [NVIDIA](/es/providers/nvidia)
- [Ollama (modelos en la nube + locales)](/es/providers/ollama)
- [OpenAI (API + Codex)](/es/providers/openai)
- [OpenCode](/es/providers/opencode)
- [OpenCode Go](/es/providers/opencode-go)
- [OpenRouter](/es/providers/openrouter)
- [Perplexity (búsqueda web)](/es/providers/perplexity-provider)
- [Qianfan](/es/providers/qianfan)
- [Qwen Cloud](/es/providers/qwen)
- [Runway](/es/providers/runway)
- [SGLang (modelos locales)](/es/providers/sglang)
- [StepFun](/es/providers/stepfun)
- [Synthetic](/es/providers/synthetic)
- [Together AI](/es/providers/together)
- [Venice (Venice AI, centrado en la privacidad)](/es/providers/venice)
- [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
- [vLLM (modelos locales)](/es/providers/vllm)
- [Volcengine (Doubao)](/es/providers/volcengine)
- [Vydra](/es/providers/vydra)
- [xAI](/es/providers/xai)
- [Xiaomi](/es/providers/xiaomi)
- [Z.AI](/es/providers/zai)

## Páginas de resumen compartidas

- [Variantes integradas adicionales](/es/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy y OAuth de Gemini CLI
- [Generación de imágenes](/es/tools/image-generation) - Herramienta compartida `image_generate`, selección de proveedor y failover
- [Generación de música](/es/tools/music-generation) - Herramienta compartida `music_generate`, selección de proveedor y failover
- [Generación de video](/es/tools/video-generation) - Herramienta compartida `video_generate`, selección de proveedor y failover

## Proveedores de transcripción

- [Deepgram (transcripción de audio)](/es/providers/deepgram)

## Herramientas de la comunidad

- [Claude Max API Proxy](/es/providers/claude-max-api-proxy) - Proxy de la comunidad para credenciales de suscripción de Claude (verifica la política/los términos de Anthropic antes de usarlo)

Para ver el catálogo completo de proveedores (xAI, Groq, Mistral, etc.) y la configuración avanzada,
consulta [Proveedores de modelos](/es/concepts/model-providers).
