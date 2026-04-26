---
read_when:
    - 在 Control UI 中更改助手输出渲染方式
    - 调试 `[embed ...]`、`MEDIA:`、回复或音频呈现指令
summary: 用于嵌入内容、媒体、音频提示和回复的富输出短代码协议
title: 富输出协议
x-i18n:
    generated_at: "2026-04-26T01:02:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c62e41073196c2ff4867230af55469786fcfb29414f5cc5b7d38f6b1ffc3718
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

助手输出可以携带一小组投递/渲染指令：

- `MEDIA:` 用于附件投递
- `[[audio_as_voice]]` 用于音频呈现提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

远程 `MEDIA:` 附件必须是公开的 `https:` URL。普通 `http:`、loopback、链路本地、私有以及内部主机名会被忽略，不会作为附件指令处理；服务器端媒体抓取器仍会执行其自身的网络防护规则。

这些指令彼此独立。`MEDIA:` 和回复/语音标签仍然是投递元数据；`[embed ...]` 是仅限 Web 的富渲染路径。
受信任工具结果中的媒体在投递前也会使用相同的 `MEDIA:` / `[[audio_as_voice]]` 解析器，因此文本工具输出仍然可以将音频附件标记为语音便笺。

启用分块流式传输时，`MEDIA:` 仍然是一次会话中的单次投递元数据。如果同一个媒体 URL 在流式块中发送，并且又在最终助手负载中重复出现，OpenClaw 只会投递一次该附件，并从最终负载中移除重复项。

## `[embed ...]`

`[embed ...]` 是唯一面向智能体的 Control UI 富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 不再适用于新的输出。
- 嵌入短代码仅在助手消息界面中渲染。
- 仅渲染基于 URL 的嵌入。使用 `ref="..."` 或 `url="..."`。
- 不会渲染块形式的内联 HTML 嵌入短代码。
- Web UI 会从可见文本中移除该短代码，并以内联方式渲染嵌入内容。
- `MEDIA:` 不是嵌入别名，不应当用于富嵌入渲染。

## 存储的渲染形状

规范化/存储后的助手内容块是一个结构化的 `canvas` 项：

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

存储/渲染的富内容块直接使用这个 `canvas` 形状。`present_view` 不会被识别。

## 相关内容

- [RPC 适配器](/zh-CN/reference/rpc)
- [Typebox](/zh-CN/concepts/typebox)
