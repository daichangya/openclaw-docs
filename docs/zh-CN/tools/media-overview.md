---
read_when:
    - 寻找媒体能力概览
    - 决定要配置哪个媒体提供商
    - 了解异步媒体生成的工作方式
summary: 用于媒体生成、理解和语音能力的统一落地页
title: 媒体概览
x-i18n:
    generated_at: "2026-04-23T01:23:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdc240c0ac4cc066e337f69e04b27828e9eb34648515688bc97e398299d7c18e
    source_path: tools/media-overview.md
    workflow: 15
---

# 媒体生成与理解

OpenClaw 可以生成图像、视频和音乐，理解传入的媒体内容（图像、音频、视频），并通过文本转语音将回复朗读出来。所有媒体能力都由工具驱动：智能体会根据对话决定何时使用它们，并且只有在至少配置了一个后端提供商时，对应工具才会出现。

## 能力概览

| 能力 | 工具 | 提供商 | 作用 |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 图像生成 | `image_generate` | ComfyUI、fal、Google、MiniMax、OpenAI、Vydra、xAI | 根据文本提示或参考内容创建或编辑图像 |
| 视频生成 | `video_generate` | Alibaba、BytePlus、ComfyUI、fal、Google、MiniMax、OpenAI、Qwen、Runway、Together、Vydra、xAI | 根据文本、图像或现有视频创建视频 |
| 音乐生成 | `music_generate` | ComfyUI、Google、MiniMax | 根据文本提示创建音乐或音频轨道 |
| 文本转语音（TTS） | `tts` | ElevenLabs、Microsoft、MiniMax、OpenAI、xAI | 将发出的回复转换为语音音频 |
| 媒体理解 | （自动） | 任何支持视觉/音频的模型提供商，以及 CLI 回退方式 | 总结传入的图像、音频和视频 |

## 提供商能力矩阵

下表展示了各提供商在整个平台中支持的媒体能力。

| 提供商 | 图像 | 视频 | 音乐 | TTS | STT / 转录 | 媒体理解 |
| ---------- | ----- | ----- | ----- | --- | ------------------- | ------------------- |
| Alibaba |       | 是   |       |     |                     |                     |
| BytePlus |       | 是   |       |     |                     |                     |
| ComfyUI | 是   | 是   | 是   |     |                     |                     |
| Deepgram |       |       |       |     | 是                 |                     |
| ElevenLabs |       |       |       | 是 |                     |                     |
| fal | 是   | 是   |       |     |                     |                     |
| Google | 是   | 是   | 是   |     |                     | 是                 |
| Microsoft |       |       |       | 是 |                     |                     |
| MiniMax | 是   | 是   | 是   | 是 |                     |                     |
| OpenAI | 是   | 是   |       | 是 | 是                 | 是                 |
| Qwen |       | 是   |       |     |                     |                     |
| Runway |       | 是   |       |     |                     |                     |
| Together |       | 是   |       |     |                     |                     |
| Vydra | 是   | 是   |       |     |                     |                     |
| xAI | 是   | 是   |       | 是 | 是                 | 是                 |

<Note>
媒体理解会使用你在提供商配置中注册的任何支持视觉或音频的模型。上表重点标出了具有专门媒体理解支持的提供商；大多数带有多模态模型的 LLM 提供商（Anthropic、Google、OpenAI 等）在被配置为当前回复模型时，也可以理解传入的媒体内容。
</Note>

## 异步生成的工作方式

视频和音乐生成会作为后台任务运行，因为提供商处理通常需要 30 秒到数分钟。当智能体调用 `video_generate` 或 `music_generate` 时，OpenClaw 会将请求提交给提供商，立即返回任务 ID，并在任务台账中跟踪该任务。任务运行期间，智能体会继续响应其他消息。当提供商处理完成后，OpenClaw 会唤醒智能体，以便它将完成的媒体内容回发到原始渠道。图像生成和 TTS 是同步的，会随回复内联完成。

OpenAI 映射到 OpenClaw 的图像、视频、批量 TTS、批量 STT、Voice Call
流式 STT、实时语音和记忆嵌入能力。xAI 当前映射到 OpenClaw 的图像、视频、搜索、代码执行、批量 TTS、批量 STT，
以及 Voice Call 流式 STT 能力。xAI Realtime voice 是上游能力，
但在共享实时语音契约能够表示它之前，它不会在 OpenClaw 中注册。

## 快速链接

- [Image Generation](/zh-CN/tools/image-generation) -- 生成和编辑图像
- [Video Generation](/zh-CN/tools/video-generation) -- 文本转视频、图像转视频和视频转视频
- [Music Generation](/zh-CN/tools/music-generation) -- 创建音乐和音频轨道
- [Text-to-Speech](/zh-CN/tools/tts) -- 将回复转换为语音音频
- [Media Understanding](/zh-CN/nodes/media-understanding) -- 理解传入的图像、音频和视频
