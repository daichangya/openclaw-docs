---
read_when:
    - 你看到一个 `.experimental` 配置键，想知道它是否稳定
    - 你想试用预览版运行时功能，同时不把它们与正常默认值混淆
    - 你想在一个地方找到当前已记录的实验性标志
summary: OpenClaw 中实验性标志的含义，以及当前有哪些已记录的实验性标志
title: 实验性功能
x-i18n:
    generated_at: "2026-04-23T20:46:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9888bc59512edadb478e81f5ff10ca0b05ce7cf38d6272d82fc627ffb68b6f7b
    source_path: concepts/experimental-features.md
    workflow: 15
---

OpenClaw 中的实验性功能是**需要主动启用的预览表面**。它们被放在显式标志之后，是因为在获得稳定默认值或长期公共契约之前，仍需要真实世界的使用验证。

请将它们与普通配置区别对待：

- 除非相关文档明确建议你尝试，否则默认应**保持关闭**。
- 预计它们的**形状和行为会比稳定配置变化得更快**。
- 如果已经存在稳定路径，应优先使用稳定路径。
- 如果你要大范围部署 OpenClaw，请先在较小环境中测试实验性标志，再将其纳入共享基线。

## 当前已记录的标志

| 表面 | 键 | 适用场景 | 更多信息 |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本地模型运行时 | `agents.defaults.experimental.localModelLean` | 较小或更严格的本地后端无法处理 OpenClaw 的完整默认工具表面 | [本地模型](/zh-CN/gateway/local-models) |
| memory 搜索 | `agents.defaults.memorySearch.experimental.sessionMemory` | 你希望 `memory_search` 为先前的会话转录建立索引，并接受额外的存储/索引成本 | [memory 配置参考](/zh-CN/reference/memory-config#session-memory-search-experimental) |
| 结构化规划工具 | `tools.experimental.planTool` | 你希望在兼容的运行时和 UI 中暴露结构化的 `update_plan` 工具，用于多步骤工作跟踪 | [Gateway 网关配置参考](/zh-CN/gateway/configuration-reference#toolsexperimental) |

## 本地模型精简模式

`agents.defaults.experimental.localModelLean: true` 是为较弱的本地模型配置提供的缓冲阀。它会裁剪较重的默认工具，例如
`browser`、`cron` 和 `message`，从而让提示词结构更小，并且对小上下文或更严格的 OpenAI 兼容后端更稳健。

这明确**不是**常规路径。如果你的后端可以稳定处理完整运行时，请保持关闭。

## 实验性不等于隐藏

如果某个功能是实验性的，OpenClaw 应该在文档中以及配置路径本身明确说明。它**不应该**做的是：把预览行为偷偷塞进一个看起来稳定的默认开关里，然后假装那是正常做法。这正是配置表面变得混乱的方式。
