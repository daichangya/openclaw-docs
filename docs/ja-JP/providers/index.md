---
read_when:
    - モデルproviderを選びたい
    - サポートされているLLMバックエンドの概要をすばやく知りたい
summary: OpenClawがサポートするモデルprovider（LLM）
title: Provider一覧
x-i18n:
    generated_at: "2026-04-22T04:27:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d77e5da93d71c48ea97460c6be56fbbe8279d9240a8101e1b35fdafb657737e
    source_path: providers/index.md
    workflow: 15
---

# モデルprovider

OpenClawは多くのLLM providerを使用できます。providerを選び、認証し、その後
デフォルトmodelを`provider/model`として設定してください。

チャットチャネルのドキュメント（WhatsApp/Telegram/Discord/Slack/Mattermost（Plugin）/その他）を探していますか？ [Channels](/ja-JP/channels)を参照してください。

## クイックスタート

1. providerで認証します（通常は`openclaw onboard`経由）。
2. デフォルトmodelを設定します:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## providerドキュメント

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ja-JP/providers/anthropic)
- [Arcee AI (Trinity models)](/ja-JP/providers/arcee)
- [BytePlus (International)](/ja-JP/concepts/model-providers#byteplus-international)
- [Chutes](/ja-JP/providers/chutes)
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [ComfyUI](/ja-JP/providers/comfy)
- [DeepSeek](/ja-JP/providers/deepseek)
- [fal](/ja-JP/providers/fal)
- [Fireworks](/ja-JP/providers/fireworks)
- [GitHub Copilot](/ja-JP/providers/github-copilot)
- [GLM models](/ja-JP/providers/glm)
- [Google (Gemini)](/ja-JP/providers/google)
- [Groq (LPU inference)](/ja-JP/providers/groq)
- [Hugging Face (Inference)](/ja-JP/providers/huggingface)
- [inferrs (local models)](/ja-JP/providers/inferrs)
- [Kilocode](/ja-JP/providers/kilocode)
- [LiteLLM (unified gateway)](/ja-JP/providers/litellm)
- [LM Studio (local models)](/ja-JP/providers/lmstudio)
- [MiniMax](/ja-JP/providers/minimax)
- [Mistral](/ja-JP/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)
- [NVIDIA](/ja-JP/providers/nvidia)
- [Ollama (cloud + local models)](/ja-JP/providers/ollama)
- [OpenAI (API + Codex)](/ja-JP/providers/openai)
- [OpenCode](/ja-JP/providers/opencode)
- [OpenCode Go](/ja-JP/providers/opencode-go)
- [OpenRouter](/ja-JP/providers/openrouter)
- [Perplexity (web search)](/ja-JP/providers/perplexity-provider)
- [Qianfan](/ja-JP/providers/qianfan)
- [Qwen Cloud](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [SGLang (local models)](/ja-JP/providers/sglang)
- [StepFun](/ja-JP/providers/stepfun)
- [Synthetic](/ja-JP/providers/synthetic)
- [Together AI](/ja-JP/providers/together)
- [Venice (Venice AI, privacy-focused)](/ja-JP/providers/venice)
- [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
- [vLLM (local models)](/ja-JP/providers/vllm)
- [Volcengine (Doubao)](/ja-JP/providers/volcengine)
- [Vydra](/ja-JP/providers/vydra)
- [xAI](/ja-JP/providers/xai)
- [Xiaomi](/ja-JP/providers/xiaomi)
- [Z.AI](/ja-JP/providers/zai)

## 共有概要ページ

- [Additional bundled variants](/ja-JP/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy、Gemini CLI OAuth
- [Image Generation](/ja-JP/tools/image-generation) - 共有`image_generate`ツール、provider選択、failover
- [Music Generation](/ja-JP/tools/music-generation) - 共有`music_generate`ツール、provider選択、failover
- [Video Generation](/ja-JP/tools/video-generation) - 共有`video_generate`ツール、provider選択、failover

## 文字起こしprovider

- [Deepgram (audio transcription)](/ja-JP/providers/deepgram)

## コミュニティツール

- [Claude Max API Proxy](/ja-JP/providers/claude-max-api-proxy) - Claudeサブスクリプション認証情報向けのコミュニティproxy（使用前にAnthropicのポリシー/規約を確認してください）

完全なproviderカタログ（xAI、Groq、Mistralなど）と高度な設定については、
[モデルprovider](/ja-JP/concepts/model-providers)を参照してください。
