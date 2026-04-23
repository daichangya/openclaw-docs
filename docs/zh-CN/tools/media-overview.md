---
read_when:
    - 查找媒体能力概览
    - 决定配置哪个媒体 providerҟоупanalysis to=functions.read 】【。】【”】【input={"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-qa-testing/SKILL.md"} code
    - 了解异步媒体生成的工作方式
summary: 用于媒体生成、理解和语音能力的统一落地页
title: 媒体概览
x-i18n:
    generated_at: "2026-04-23T21:09:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13674669e8e348342119ac36d7a362809b48f4771c345a543eecc5c64a2525a6
    source_path: tools/media-overview.md
    workflow: 15
---

# 媒体生成与理解

OpenClaw 可以生成图像、视频和音乐，理解入站媒体（图像、音频、视频），并通过文本转语音将回复读出来。所有媒体能力都由工具驱动：智能体会根据对话决定何时使用它们，而每个工具只有在至少配置了一个后端 provider 时才会出现。

## 能力概览

| 能力 | 工具 | Providers | 作用 |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 图像生成 | `image_generate` | ComfyUI、fal、Google、MiniMax、OpenAI、Vydra、xAI | 根据文本提示词或参考图创建或编辑图像 |
| 视频生成 | `video_generate` | Alibaba、BytePlus（国际版）、ComfyUI、fal、Google、MiniMax、OpenAI、Qwen、Runway、Together、Vydra、xAI | 根据文本、图像或现有视频创建视频 |
| 音乐生成 | `music_generate` | ComfyUI、Google、MiniMax | 根据文本提示词生成音乐或音轨 |
| 文本转语音（TTS） | `tts` | ElevenLabs、Microsoft、MiniMax、OpenAI、xAI | 将出站回复转换为语音音频 |
| 媒体理解 | （自动） | 任意具备视觉/音频能力的模型 provider，外加 CLI 回退方案 | 总结入站图像、音频和视频 |

## Provider 能力矩阵

下表显示了平台中各个 provider 支持哪些媒体能力。

| Provider | 图像 | 视频 | 音乐 | TTS | STT / 转写 | 媒体理解 |
| ---------- | ----- | ----- | ----- | --- | ------------------- | ------------------- |
| Alibaba |  | 是 |  |  |  |  |
| BytePlus（国际版） |  | 是 |  |  |  |  |
| ComfyUI | 是 | 是 | 是 |  |  |  |
| Deepgram |  |  |  |  | 是 |  |
| ElevenLabs |  |  |  | 是 | 是 |  |
| fal | 是 | 是 |  |  |  |  |
| Google | 是 | 是 | 是 |  |  | 是 |
| Microsoft |  |  |  | 是 |  |  |
| MiniMax | 是 | 是 | 是 | 是 |  |  |
| Mistral |  |  |  |  | 是 |  |
| OpenAI | 是 | 是 |  | 是 | 是 | 是 |
| Qwen |  | 是 |  |  |  |  |
| Runway |  | 是 |  |  |  |  |
| Together |  | 是 |  |  |  |  |
| Vydra | 是 | 是 |  |  |  |  |
| xAI | 是 | 是 |  | 是 | 是 | 是 |

<Note>
媒体理解会使用你在 provider 配置中注册的任意具备视觉能力或音频能力的模型。上表重点列出了带有专用媒体理解支持的 provider；大多数具有多模态模型的 LLM provider（Anthropic、Google、OpenAI 等）在被配置为当前回复模型时，也能够理解入站媒体。
</Note>

## 异步生成如何工作

视频和音乐生成会作为后台任务运行，因为 provider 处理通常需要 30 秒到数分钟。当智能体调用 `video_generate` 或 `music_generate` 时，OpenClaw 会将请求提交给 provider，立即返回一个任务 ID，并在任务账本中跟踪该作业。任务运行期间，智能体仍可继续响应其他消息。当 provider 完成后，OpenClaw 会唤醒智能体，以便它将已完成的媒体发布回原始渠道。图像生成和 TTS 是同步的，会在回复流程中内联完成。

当配置后，Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 都可以通过批量 `tools.media.audio` 路径转写入站音频。Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 还会注册 Voice Call 流式 STT provider，因此实时电话音频可以直接转发给选定厂商，而无需等待完整录音结束。

OpenAI 映射到 OpenClaw 的图像、视频、批量 TTS、批量 STT、Voice Call 流式 STT、实时语音以及记忆 embedding 界面。xAI 当前映射到 OpenClaw 的图像、视频、搜索、代码执行、批量 TTS、批量 STT 和 Voice Call 流式 STT 界面。xAI Realtime voice 是上游能力，但在共享实时语音契约能够表达它之前，OpenClaw 尚未注册它。

## 快速链接

- [图像生成](/zh-CN/tools/image-generation) —— 生成和编辑图像
- [视频生成](/zh-CN/tools/video-generation) —— 文生视频、图生视频和视频转视频
- [音乐生成](/zh-CN/tools/music-generation) —— 创建音乐和音轨
- [文本转语音](/zh-CN/tools/tts) —— 将回复转换为语音音频
- [媒体理解](/zh-CN/nodes/media-understanding) —— 理解入站图像、音频和视频
