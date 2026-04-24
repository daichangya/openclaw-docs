---
read_when:
    - 更改 Control UI 中的助手输出渲染方式
    - 调试 `[embed ...]`、`MEDIA:`、reply 或音频展示指令
summary: 用于 embeds、媒体、音频提示和回复的富输出 shortcode 协议
title: 富输出协议
x-i18n:
    generated_at: "2026-04-24T03:18:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ec8b9a263a60be921ed873777b64e4c122966ec9a4f47203b637c316a79b5b9
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

助手输出可以携带一小组传递 / 渲染指令：

- `MEDIA:` 用于附件传递
- `[[audio_as_voice]]` 用于音频展示提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

这些指令彼此独立。`MEDIA:` 和 reply/voice 标签仍然是传递元数据；`[embed ...]` 是仅限 Web 的富渲染路径。

## `[embed ...]`

`[embed ...]` 是 Control UI 唯一面向智能体的富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="状态" /]
```

规则：

- `[view ...]` 不再适用于新的输出。
- Embed shortcode 仅在助手消息表面中渲染。
- 仅渲染基于 URL 的 embed。请使用 `ref="..."` 或 `url="..."`。
- 不渲染块形式的内联 HTML embed shortcode。
- Web UI 会从可见文本中移除该 shortcode，并以内联方式渲染 embed。
- `MEDIA:` 不是 embed 别名，不应用于富 embed 渲染。

## 存储渲染结构

标准化 / 存储后的助手内容块是一个结构化的 `canvas` 项：

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

已存储 / 已渲染的富块会直接使用这个 `canvas` 结构。`present_view` 不会被识别。

## 相关内容

- [RPC 适配器](/reference/rpc-adapters)
- [Typebox](/zh-CN/concepts/typebox)
