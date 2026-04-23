---
read_when:
    - 修改媒体管线或附件处理
summary: 发送、Gateway 网关和智能体回复中的图像与媒体处理规则
title: 图像与媒体支持
x-i18n:
    generated_at: "2026-04-23T20:53:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b738069e61bfc6b979f3b867fae1f8af5d7a622b8fe9bee61ad99cabfcedf110
    source_path: nodes/images.md
    workflow: 15
---

# 图像与媒体支持（2025-12-05）

WhatsApp 渠道通过 **Baileys Web** 运行。本文档记录了当前发送、Gateway 网关和智能体回复中的媒体处理规则。

## 目标

- 通过 `openclaw message send --media` 发送媒体，并可附带可选 caption。
- 允许来自 web inbox 的自动回复在文本之外附带媒体。
- 让各媒体类型的限制保持合理且可预测。

## CLI 表面

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` 为可选项；对于仅发送媒体的场景，caption 可以为空。
  - `--dry-run` 会打印解析后的负载；`--json` 会输出 `{ channel, to, messageId, mediaUrl, caption }`。

## WhatsApp Web 渠道行为

- 输入：本地文件路径**或** HTTP(S) URL。
- 流程：加载为 Buffer，检测媒体类型，并构建正确的负载：
  - **图像：** 调整尺寸并重新压缩为 JPEG（最长边 2048px），目标大小为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
  - **音频/语音/视频：** 透传，最大 16 MB；音频会作为语音便笺发送（`ptt: true`）。
  - **文档：** 其他任何类型，最大 100 MB，并在可用时保留文件名。
- WhatsApp GIF 风格播放：发送一个带 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），这样移动端客户端会在行内循环播放。
- MIME 检测优先使用 magic bytes，其次是 headers，最后才是文件扩展名。
- Caption 来自 `--message` 或 `reply.text`；允许空 caption。
- 日志：非详细模式下显示 `↩️`/`✅`；详细模式会包含大小和源路径/URL。

## 自动回复管线

- `getReplyFromConfig` 返回 `{ text?, mediaUrl?, mediaUrls? }`。
- 当存在媒体时，web 发送器会使用与 `openclaw message send` 相同的管线解析本地路径或 URL。
- 如果提供了多个媒体条目，会按顺序依次发送。

## 命令中的入站媒体（Pi）

- 当入站 web 消息包含媒体时，OpenClaw 会下载到临时文件，并暴露模板变量：
  - `{{MediaUrl}}`：指向入站媒体的伪 URL。
  - `{{MediaPath}}`：运行命令前写入的本地临时路径。
- 当启用了按会话划分的 Docker 沙箱时，入站媒体会被复制到沙箱工作区中，并将 `MediaPath`/`MediaUrl` 重写为相对路径，例如 `media/inbound/<filename>`。
- 媒体理解（如果通过 `tools.media.*` 或共享的 `tools.media.models` 配置）会在模板处理之前运行，并可将 `[Image]`、`[Audio]` 和 `[Video]` 块插入到 `Body` 中。
  - 音频会设置 `{{Transcript}}`，并使用该转录文本进行命令解析，这样 slash 命令仍然可以工作。
  - 视频和图像描述会保留任何 caption 文本，以供命令解析使用。
  - 如果当前活动的主图像模型已原生支持 vision，OpenClaw 会跳过 `[Image]` 摘要块，而是直接将原始图像传给模型。
- 默认情况下，只处理第一个匹配的图像/音频/视频附件；如需处理多个附件，请设置 `tools.media.<cap>.attachments`。

## 限制与错误

**出站发送上限（WhatsApp web 发送）**

- 图像：重压缩后最大 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
- 音频/语音/视频：上限 16 MB；文档：上限 100 MB。
- 媒体过大或无法读取 → 日志中会显示清晰错误，并跳过该回复。

**媒体理解上限（转录/描述）**

- 图像默认：10 MB（`tools.media.image.maxBytes`）。
- 音频默认：20 MB（`tools.media.audio.maxBytes`）。
- 视频默认：50 MB（`tools.media.video.maxBytes`）。
- 媒体过大时会跳过理解步骤，但回复仍会使用原始正文继续进行。

## 测试说明

- 覆盖图像/音频/文档场景下的发送与回复流程。
- 验证图像重压缩（大小受限）以及音频的语音便笺标志。
- 确保多媒体回复会按顺序展开为多个发送操作。
