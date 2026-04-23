---
read_when:
    - 使用开发 Gateway 网关模板
    - 更新默认开发智能体身份 to=final code omitted
summary: 开发智能体工具说明（C-3PO）
title: TOOLS.dev 模板
x-i18n:
    generated_at: "2026-04-23T21:04:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517163e71e9337db6aecef5f22f1682a443fe54d34eb6f1eb9bbacfd77b989fa
    source_path: reference/templates/TOOLS.dev.md
    workflow: 15
---

# TOOLS.md - 用户工具说明（可编辑）

此文件用于保存你关于外部工具和约定的**个人备注**。
它并不定义有哪些工具；OpenClaw 会在内部提供内置工具。

## 示例

### imsg

- 发送 iMessage/SMS：描述发送对象和内容，发送前先确认。
- 优先发送简短消息；避免发送秘密。

### sag

- 文本转语音：请指定语音、目标扬声器/房间，以及是否需要流式播放。

你可以添加任何希望助理了解的本地工具链相关内容。
