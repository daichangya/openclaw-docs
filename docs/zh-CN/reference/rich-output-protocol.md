---
read_when:
    - 更改 Control UI 中的助手输出渲染方式
    - 调试 `[embed ...]`、`MEDIA:`、reply 或音频展示指令
summary: 用于嵌入、媒体、音频提示和回复的富输出短代码协议
title: 富输出协议
x-i18n:
    generated_at: "2026-04-23T06:43:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# 富输出协议

助手输出可以携带一小组投递/渲染指令：

- `MEDIA:` 用于附件投递
- `[[audio_as_voice]]` 用于音频展示提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

这些指令彼此独立。`MEDIA:` 和 reply/voice 标签仍然属于投递元数据；`[embed ...]` 则是仅限 web 的富渲染路径。

## `[embed ...]`

`[embed ...]` 是面向智能体的、用于 Control UI 的唯一富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 不再对新输出有效。
- Embed 短代码仅在助手消息界面中渲染。
- 仅渲染基于 URL 的 embed。请使用 `ref="..."` 或 `url="..."`。
- 不渲染块形式的内联 HTML embed 短代码。
- Web UI 会从可见文本中移除该短代码，并在行内渲染 embed。
- `MEDIA:` 不是 embed 别名，不应用于富 embed 渲染。

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

存储/渲染后的富内容块直接使用这种 `canvas` 形状。`present_view` 不被识别。
