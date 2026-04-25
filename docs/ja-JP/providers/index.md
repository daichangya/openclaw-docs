---
read_when:
    - model provider を選びたい場合
    - サポートされる LLM バックエンドの概要を手早く確認したい場合
summary: OpenClaw がサポートする model provider（LLM）
title: provider ディレクトリ
x-i18n:
    generated_at: "2026-04-25T13:57:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e031e997f0dbf97e3e26d5ee05bd99c2877653daa04423d210d01b9045d8c5c
    source_path: providers/index.md
    workflow: 15
---

# Model Providers

OpenClaw は多くの LLM provider を使えます。provider を選び、認証し、その後
デフォルト model を `provider/model` として設定してください。

チャットチャネルのドキュメント（WhatsApp/Telegram/Discord/Slack/Mattermost（Plugin）など）を探していますか？ [Channels](/ja-JP/channels) を参照してください。

## クイックスタート

1. provider で認証します（通常は `openclaw onboard` 経由）。
2. デフォルト model を設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## provider ドキュメント

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Amazon Bedrock Mantle](/ja-JP/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/ja-JP/providers/anthropic)
- [Arcee AI (Trinity models)](/ja-JP/providers/arcee)
- [BytePlus (International)](/ja-JP/concepts/model-providers#byteplus-international)
- [Chutes](/ja-JP/providers/chutes)
- [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
- [ComfyUI](/ja-JP/providers/comfy)
- [DeepSeek](/ja-JP/providers/deepseek)
- [ElevenLabs](/ja-JP/providers/elevenlabs)
- [fal](/ja-JP/providers/fal)
- [Fireworks](/ja-JP/providers/fireworks)
- [GitHub Copilot](/ja-JP/providers/github-copilot)
- [Gradium](/ja-JP/providers/gradium)
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
- [SenseAudio](/ja-JP/providers/senseaudio)
- [SGLang (local models)](/ja-JP/providers/sglang)
- [StepFun](/ja-JP/providers/stepfun)
- [Synthetic](/ja-JP/providers/synthetic)
- [Tencent Cloud (TokenHub)](/ja-JP/providers/tencent)
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
- [Image Generation](/ja-JP/tools/image-generation) - 共有 `image_generate` ツール、provider 選択、フェイルオーバー
- [Music Generation](/ja-JP/tools/music-generation) - 共有 `music_generate` ツール、provider 選択、フェイルオーバー
- [Video Generation](/ja-JP/tools/video-generation) - 共有 `video_generate` ツール、provider 選択、フェイルオーバー

## 文字起こし provider

- [Deepgram (audio transcription)](/ja-JP/providers/deepgram)
- [ElevenLabs](/ja-JP/providers/elevenlabs#speech-to-text)
- [Mistral](/ja-JP/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ja-JP/providers/openai#speech-to-text)
- [SenseAudio](/ja-JP/providers/senseaudio)
- [xAI](/ja-JP/providers/xai#speech-to-text)

## コミュニティツール

- [Claude Max API Proxy](/ja-JP/providers/claude-max-api-proxy) - Claude subscription 資格情報向けコミュニティ proxy（使用前に Anthropic のポリシー/規約を確認してください）

完全な provider catalog（xAI、Groq、Mistral など）と高度な設定については、
[Model providers](/ja-JP/concepts/model-providers) を参照してください。
