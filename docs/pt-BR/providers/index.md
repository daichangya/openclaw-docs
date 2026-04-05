---
read_when:
    - Você quer escolher um provedor de modelo
    - Você precisa de uma visão geral rápida dos backends de LLM compatíveis
summary: Provedores de modelos (LLMs) compatíveis com o OpenClaw
title: Diretório de Provedores
x-i18n:
    generated_at: "2026-04-05T12:50:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 690d17c14576d454ea3cd3dcbc704470da10a2a34adfe681dab7048438f2e193
    source_path: providers/index.md
    workflow: 15
---

# Provedores de Modelos

O OpenClaw pode usar muitos provedores de LLM. Escolha um provedor, autentique-se e depois defina o
modelo padrão como `provider/model`.

Está procurando a documentação de canais de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/etc.)? Consulte [Canais](/pt-BR/channels).

## Início rápido

1. Autentique-se com o provedor (geralmente via `openclaw onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentação dos provedores

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [BytePlus (internacional)](/pt-BR/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepSeek](/providers/deepseek)
- [Fireworks](/providers/fireworks)
- [GitHub Copilot](/providers/github-copilot)
- [Modelos GLM](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq (inferência LPU)](/providers/groq)
- [Hugging Face (inferência)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (gateway unificado)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (modelos em nuvem + locais)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity (pesquisa na web)](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen Cloud](/providers/qwen)
- [Qwen / Model Studio (detalhe do endpoint; `qwen-*` canônico, `modelstudio-*` legado)](/providers/qwen_modelstudio)
- [SGLang (modelos locais)](/providers/sglang)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Together AI](/providers/together)
- [Venice (Venice AI, focado em privacidade)](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [vLLM (modelos locais)](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Páginas de visão geral compartilhadas

- [Variantes empacotadas adicionais](/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy e OAuth da CLI do Gemini

## Provedores de transcrição

- [Deepgram (transcrição de áudio)](/providers/deepgram)

## Ferramentas da comunidade

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Proxy da comunidade para credenciais de assinatura do Claude (verifique a política/os termos da Anthropic antes de usar)

Para o catálogo completo de provedores (xAI, Groq, Mistral etc.) e configuração avançada,
consulte [Provedores de modelos](/pt-BR/concepts/model-providers).
