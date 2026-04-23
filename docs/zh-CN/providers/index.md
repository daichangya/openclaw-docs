---
read_when:
    - 你想选择一个模型 provider
    - 你需要快速了解受支持的 LLM 后端概览
summary: OpenClaw 支持的模型 providers（LLMs）
title: Provider 目录
x-i18n:
    generated_at: "2026-04-23T21:00:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e76c2688398e12a4467327505bf5fe8b40cf66c74a66dd586c0ccadd50e6705
    source_path: providers/index.md
    workflow: 15
---

# 模型 providers

OpenClaw 可以使用多种 LLM providers。选择一个 provider，完成认证，然后将
默认模型设置为 `provider/model`。

如果你要找聊天渠道文档（WhatsApp/Telegram/Discord/Slack/Mattermost（插件）/等），请参阅[渠道](/zh-CN/channels)。

## 快速开始

1. 使用 provider 完成认证（通常通过 `openclaw onboard`）。
2. 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider 文档

- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [Amazon Bedrock](/zh-CN/providers/bedrock)
- [Amazon Bedrock Mantle](/zh-CN/providers/bedrock-mantle)
- [Anthropic（API + Claude CLI）](/zh-CN/providers/anthropic)
- [Arcee AI（Trinity 模型）](/zh-CN/providers/arcee)
- [BytePlus（国际版）](/zh-CN/concepts/model-providers#byteplus-international)
- [Chutes](/zh-CN/providers/chutes)
- [Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)
- [ComfyUI](/zh-CN/providers/comfy)
- [DeepSeek](/zh-CN/providers/deepseek)
- [ElevenLabs](/zh-CN/providers/elevenlabs)
- [fal](/zh-CN/providers/fal)
- [Fireworks](/zh-CN/providers/fireworks)
- [GitHub Copilot](/zh-CN/providers/github-copilot)
- [GLM 模型](/zh-CN/providers/glm)
- [Google（Gemini）](/zh-CN/providers/google)
- [Groq（LPU 推理）](/zh-CN/providers/groq)
- [Hugging Face（Inference）](/zh-CN/providers/huggingface)
- [inferrs（本地模型）](/zh-CN/providers/inferrs)
- [Kilocode](/zh-CN/providers/kilocode)
- [LiteLLM（统一 Gateway 网关）](/zh-CN/providers/litellm)
- [LM Studio（本地模型）](/zh-CN/providers/lmstudio)
- [MiniMax](/zh-CN/providers/minimax)
- [Mistral](/zh-CN/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)
- [NVIDIA](/zh-CN/providers/nvidia)
- [Ollama（云端 + 本地模型）](/zh-CN/providers/ollama)
- [OpenAI（API + Codex）](/zh-CN/providers/openai)
- [OpenCode](/zh-CN/providers/opencode)
- [OpenCode Go](/zh-CN/providers/opencode-go)
- [OpenRouter](/zh-CN/providers/openrouter)
- [Perplexity（Web 搜索）](/zh-CN/providers/perplexity-provider)
- [Qianfan](/zh-CN/providers/qianfan)
- [Qwen Cloud](/zh-CN/providers/qwen)
- [Runway](/zh-CN/providers/runway)
- [SGLang（本地模型）](/zh-CN/providers/sglang)
- [StepFun](/zh-CN/providers/stepfun)
- [Synthetic](/zh-CN/providers/synthetic)
- [腾讯云（TokenHub）](/zh-CN/providers/tencent)
- [Together AI](/zh-CN/providers/together)
- [Venice（Venice AI，注重隐私）](/zh-CN/providers/venice)
- [Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)
- [vLLM（本地模型）](/zh-CN/providers/vllm)
- [Volcengine（Doubao）](/zh-CN/providers/volcengine)
- [Vydra](/zh-CN/providers/vydra)
- [xAI](/zh-CN/providers/xai)
- [Xiaomi](/zh-CN/providers/xiaomi)
- [Z.AI](/zh-CN/providers/zai)

## 共享概览页面

- [其他内置变体](/zh-CN/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy 和 Gemini CLI OAuth
- [图像生成](/zh-CN/tools/image-generation) - 共享 `image_generate` 工具、provider 选择与故障转移
- [音乐生成](/zh-CN/tools/music-generation) - 共享 `music_generate` 工具、provider 选择与故障转移
- [视频生成](/zh-CN/tools/video-generation) - 共享 `video_generate` 工具、provider 选择与故障转移

## 转写 providers

- [Deepgram（音频转写）](/zh-CN/providers/deepgram)
- [ElevenLabs](/zh-CN/providers/elevenlabs#speech-to-text)
- [Mistral](/zh-CN/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/zh-CN/providers/openai#speech-to-text)
- [xAI](/zh-CN/providers/xai#speech-to-text)

## 社区工具

- [Claude Max API Proxy](/zh-CN/providers/claude-max-api-proxy) - 面向 Claude 订阅凭证的社区代理（使用前请自行确认 Anthropic 政策/条款）

如需查看完整 provider 目录（xAI、Groq、Mistral 等）和高级配置，
请参阅[模型 providers](/zh-CN/concepts/model-providers)。
