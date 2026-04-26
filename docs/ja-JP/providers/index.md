---
read_when:
    - model providerを選びたい場合
    - サポートされているLLM backendの概要を手早く知りたい場合
summary: OpenClawがサポートするmodel provider（LLM）
title: providerディレクトリ
x-i18n:
    generated_at: "2026-04-26T11:39:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5d3bf5b30bd7a1dbd8b1348f4f07f178fea9bfea523afa96cad2a30d566a139
    source_path: providers/index.md
    workflow: 15
---

# Model Providers

OpenClawは多くのLLM providerを利用できます。providerを選び、認証し、その後デフォルトmodelを `provider/model` として設定してください。

chat channelのdoc（WhatsApp/Telegram/Discord/Slack/Mattermost (plugin) / など）を探していますか？ [Channels](/ja-JP/channels) を参照してください。

## クイックスタート

1. providerで認証します（通常は `openclaw onboard` を使います）。
2. デフォルトmodelを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## providerドキュメント

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [Amazon Bedrock](/ja-JP/providers/bedrock)
- [Amazon Bedrock Mantle](/ja-JP/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/ja-JP/providers/anthropic)
- [Arcee AI (Trinity models)](/ja-JP/providers/arcee)
- [Azure Speech](/ja-JP/providers/azure-speech)
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

## 共有overviewページ

- [Additional bundled variants](/ja-JP/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy、Gemini CLI OAuth
- [Image Generation](/ja-JP/tools/image-generation) - 共有 `image_generate` tool、provider選択、およびfailover
- [Music Generation](/ja-JP/tools/music-generation) - 共有 `music_generate` tool、provider選択、およびfailover
- [Video Generation](/ja-JP/tools/video-generation) - 共有 `video_generate` tool、provider選択、およびfailover

## transcription provider

- [Deepgram (audio transcription)](/ja-JP/providers/deepgram)
- [ElevenLabs](/ja-JP/providers/elevenlabs#speech-to-text)
- [Mistral](/ja-JP/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ja-JP/providers/openai#speech-to-text)
- [SenseAudio](/ja-JP/providers/senseaudio)
- [xAI](/ja-JP/providers/xai#speech-to-text)

## コミュニティtool

- [Claude Max API Proxy](/ja-JP/providers/claude-max-api-proxy) - Claude subscription credential向けのコミュニティproxy（使用前にAnthropicのpolicy / termsを確認してください）

完全なprovider catalog（xAI、Groq、Mistralなど）と高度な設定については、
[Model providers](/ja-JP/concepts/model-providers)を参照してください。
