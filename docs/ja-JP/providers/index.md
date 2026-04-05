---
read_when:
    - model providerを選びたいとき
    - サポートされているLLM backendの簡単な概要が必要なとき
summary: OpenClawがサポートするmodel provider（LLM）
title: Provider Directory
x-i18n:
    generated_at: "2026-04-05T12:53:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 690d17c14576d454ea3cd3dcbc704470da10a2a34adfe681dab7048438f2e193
    source_path: providers/index.md
    workflow: 15
---

# Model Providers

OpenClawは多くのLLM providerを使用できます。providerを選び、認証し、その後
デフォルトmodelを `provider/model` として設定してください。

chat channelのドキュメント（WhatsApp/Telegram/Discord/Slack/Mattermost（plugin）など）を探していますか？ [Channels](/ja-JP/channels) を参照してください。

## クイックスタート

1. providerで認証します（通常は `openclaw onboard` 経由）。
2. デフォルトmodelを設定します:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Providerドキュメント

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [BytePlus (International)](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepSeek](/providers/deepseek)
- [Fireworks](/providers/fireworks)
- [GitHub Copilot](/providers/github-copilot)
- [GLM models](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq (LPU inference)](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (unified gateway)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (cloud + local models)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity (web search)](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen Cloud](/providers/qwen)
- [Qwen / Model Studio（endpoint detail; `qwen-*` が正規、`modelstudio-*` はレガシー）](/providers/qwen_modelstudio)
- [SGLang (local models)](/providers/sglang)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Together AI](/providers/together)
- [Venice (Venice AI, privacy-focused)](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [vLLM (local models)](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## 共有概要ページ

- [Additional bundled variants](/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy、Gemini CLI OAuth

## Transcription providers

- [Deepgram (audio transcription)](/providers/deepgram)

## Community tools

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Claude subscription認証情報向けcommunity proxy（使用前にAnthropicのpolicy/termsを確認してください）

完全なprovider catalog（xAI, Groq, Mistralなど）と高度な設定については、
[Model providers](/concepts/model-providers) を参照してください。
