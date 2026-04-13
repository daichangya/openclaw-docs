---
read_when:
    - モデルプロバイダーを選択したい場合
    - サポートされているLLMバックエンドの概要をすぐに確認したい場合
summary: OpenClaw がサポートするモデルプロバイダー（LLM）
title: プロバイダーディレクトリ
x-i18n:
    generated_at: "2026-04-13T08:50:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bc682d008119719826f71f74959ab32bedf14214459f5e6ac9cb70371d3c540
    source_path: providers/index.md
    workflow: 15
---

# モデルプロバイダー

OpenClaw は多くのLLMプロバイダーを使用できます。プロバイダーを選択し、認証してから、デフォルトモデルを `provider/model` として設定します。

チャットチャネルのドキュメント（WhatsApp/Telegram/Discord/Slack/Mattermost（Plugin）/など）をお探しですか？ [Channels](/ja-JP/channels) を参照してください。

## クイックスタート

1. プロバイダーで認証します（通常は `openclaw onboard` を使用します）。
2. デフォルトモデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## プロバイダーのドキュメント

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Anthropic（API + Claude CLI）](/ja-JP/providers/anthropic)
- [Arcee AI（Trinityモデル）](/ja-JP/providers/arcee)
- [BytePlus（インターナショナル）](/ja-JP/concepts/model-providers#byteplus-international)
- [Chutes](/ja-JP/providers/chutes)
- [ComfyUI](/ja-JP/providers/comfy)
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [DeepSeek](/ja-JP/providers/deepseek)
- [fal](/ja-JP/providers/fal)
- [Fireworks](/ja-JP/providers/fireworks)
- [GitHub Copilot](/ja-JP/providers/github-copilot)
- [GLMモデル](/ja-JP/providers/glm)
- [Google（Gemini）](/ja-JP/providers/google)
- [Groq（LPU推論）](/ja-JP/providers/groq)
- [Hugging Face（推論）](/ja-JP/providers/huggingface)
- [inferrs（ローカルモデル）](/ja-JP/providers/inferrs)
- [Kilocode](/ja-JP/providers/kilocode)
- [LiteLLM（統合Gateway）](/ja-JP/providers/litellm)
- [LM Studio（ローカルモデル）](/ja-JP/providers/lmstudio)
- [MiniMax](/ja-JP/providers/minimax)
- [Mistral](/ja-JP/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)
- [NVIDIA](/ja-JP/providers/nvidia)
- [Ollama（クラウド + ローカルモデル）](/ja-JP/providers/ollama)
- [OpenAI（API + Codex）](/ja-JP/providers/openai)
- [OpenCode](/ja-JP/providers/opencode)
- [OpenCode Go](/ja-JP/providers/opencode-go)
- [OpenRouter](/ja-JP/providers/openrouter)
- [Perplexity（ウェブ検索）](/ja-JP/providers/perplexity-provider)
- [Qianfan](/ja-JP/providers/qianfan)
- [Qwen Cloud](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [SGLang（ローカルモデル）](/ja-JP/providers/sglang)
- [StepFun](/ja-JP/providers/stepfun)
- [Synthetic](/ja-JP/providers/synthetic)
- [Together AI](/ja-JP/providers/together)
- [Venice（Venice AI、プライバシー重視）](/ja-JP/providers/venice)
- [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
- [Vydra](/ja-JP/providers/vydra)
- [vLLM（ローカルモデル）](/ja-JP/providers/vllm)
- [Volcengine（Doubao）](/ja-JP/providers/volcengine)
- [xAI](/ja-JP/providers/xai)
- [Xiaomi](/ja-JP/providers/xiaomi)
- [Z.AI](/ja-JP/providers/zai)

## 共有概要ページ

- [追加のバンドル済みバリアント](/ja-JP/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy、Gemini CLI OAuth
- [画像生成](/ja-JP/tools/image-generation) - 共通の `image_generate` ツール、プロバイダーの選択、フェイルオーバー
- [音楽生成](/ja-JP/tools/music-generation) - 共通の `music_generate` ツール、プロバイダーの選択、フェイルオーバー
- [動画生成](/ja-JP/tools/video-generation) - 共通の `video_generate` ツール、プロバイダーの選択、フェイルオーバー

## 音声文字起こしプロバイダー

- [Deepgram（音声文字起こし）](/ja-JP/providers/deepgram)

## コミュニティツール

- [Claude Max API Proxy](/ja-JP/providers/claude-max-api-proxy) - Claude サブスクリプション認証情報向けのコミュニティプロキシ（使用前に Anthropic のポリシー/利用規約を確認してください）

xAI、Groq、Mistral などを含む完全なプロバイダーカタログと高度な設定については、
[モデルプロバイダー](/ja-JP/concepts/model-providers) を参照してください。
