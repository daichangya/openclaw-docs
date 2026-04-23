---
read_when:
    - 修改媒体管线或附件处理
summary: 发送、Gateway 网关和智能体回复中的图像与媒体处理规则
title: 图像与媒体支持
x-i18n:
    generated_at: "2026-04-23T22:58:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# 图像与媒体支持（2025-12-05）

WhatsApp 渠道通过 **Baileys Web** 运行。本文档记录当前发送、Gateway 网关和智能体回复中的媒体处理规则。

## 目标

- 通过 `openclaw message send --media` 发送带可选说明文字的媒体。
- 允许来自 web 收件箱的自动回复在文本之外附带媒体。
- 保持按类型划分的限制合理且可预测。

## CLI 能力面

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` 为可选；对于仅发送媒体的情况，说明文字可以为空。
  - `--dry-run` 会打印解析后的负载；`--json` 会输出 `{ channel, to, messageId, mediaUrl, caption }`。

## WhatsApp Web 渠道行为

- 输入：本地文件路径**或** HTTP(S) URL。
- 流程：加载为 Buffer，检测媒体类型，并构建正确的负载：
  - **图像：** 调整大小并重新压缩为 JPEG（最长边 2048 px），目标为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
  - **音频/语音/视频：** 16 MB 以内直接透传；音频会作为语音消息发送（`ptt: true`）。
  - **文档：** 其他所有内容，最大 100 MB，并在可用时保留文件名。
- WhatsApp GIF 式播放：发送一个带 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），以便移动端客户端内联循环播放。
- MIME 检测优先使用魔数字节，其次是 headers，最后是文件扩展名。
- 说明文字来自 `--message` 或 `reply.text`；允许为空说明文字。
- 日志：非详细模式显示 `↩️`/`✅`；详细模式会包含大小和源路径/URL。

## 自动回复管线

- `getReplyFromConfig` 返回 `{ text?, mediaUrl?, mediaUrls? }`。
- 当存在媒体时，web 发送器会使用与 `openclaw message send` 相同的管线解析本地路径或 URL。
- 如果提供了多个媒体条目，它们会按顺序发送。

## 传入命令的入站媒体（Pi）

- 当入站 web 消息包含媒体时，OpenClaw 会将其下载到临时文件，并暴露模板变量：
  - `{{MediaUrl}}`：入站媒体的伪 URL。
  - `{{MediaPath}}`：运行命令前写入的本地临时路径。
- 当启用了按会话划分的 Docker 沙箱时，入站媒体会被复制到沙箱工作区中，且 `MediaPath`/`MediaUrl` 会被重写为类似 `media/inbound/<filename>` 的相对路径。
- 媒体理解（如果通过 `tools.media.*` 或共享的 `tools.media.models` 配置）会在模板处理之前运行，并可将 `[Image]`、`[Audio]` 和 `[Video]` 块插入到 `Body` 中。
  - 音频会设置 `{{Transcript}}`，并使用转录文本进行命令解析，因此斜杠命令仍然有效。
  - 视频和图像描述会保留所有说明文字文本，用于命令解析。
  - 如果当前活动的主图像模型原生已支持视觉能力，OpenClaw 会跳过 `[Image]` 摘要块，转而将原始图像直接传给模型。
- 默认情况下，只处理第一个匹配的图像/音频/视频附件；设置 `tools.media.<cap>.attachments` 可处理多个附件。

## 限制与错误

**出站发送上限（WhatsApp web 发送）**

- 图像：重新压缩后最大为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
- 音频/语音/视频：上限 16 MB；文档：100 MB。
- 过大或无法读取的媒体 → 日志中显示清晰错误，且跳过该回复。

**媒体理解上限（转录/描述）**

- 图像默认：10 MB（`tools.media.image.maxBytes`）。
- 音频默认：20 MB（`tools.media.audio.maxBytes`）。
- 视频默认：50 MB（`tools.media.video.maxBytes`）。
- 过大的媒体会跳过理解，但回复仍会携带原始正文继续进行。

## 测试说明

- 覆盖图像/音频/文档场景下的发送 + 回复流程。
- 验证图像重新压缩（大小边界）以及音频的语音消息标志。
- 确保多媒体回复会按顺序拆分发送。

## 相关

- [相机捕获](/zh-CN/nodes/camera)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [音频和语音消息](/zh-CN/nodes/audio)
