---
read_when:
    - 你看到了一个 `.experimental` 配置键，并想知道它是否稳定
    - 你想尝试预览版运行时功能，同时又不想将它们与正常默认值混淆
    - 你想在一个地方找到当前已记录在文档中的实验性标志
summary: OpenClaw 中 experimental 标志的含义，以及当前有哪些已记录在文档中的 experimental 标志
title: 实验性功能
x-i18n:
    generated_at: "2026-04-23T22:56:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c959cee1db1dcf0ec8bb6b4a82dfa98bed12fbf3ee8ce60560a0d81f16652a0b
    source_path: concepts/experimental-features.md
    workflow: 15
---

OpenClaw 中的实验性功能是**需主动启用的预览能力**。它们被放在显式标志之后，是因为在成为稳定默认值或长期公共契约之前，仍需要真实世界中的验证。

请将它们与普通配置区别对待：

- 默认情况下保持**关闭**，除非相关文档明确建议你尝试。
- 预期其**结构和行为变化**会比稳定配置更快。
- 如果已有稳定路径，优先使用稳定路径。
- 如果你要大范围部署 OpenClaw，请先在较小环境中测试实验性标志，再将其纳入共享基线。

## 当前已记录的标志

| Surface | Key | 使用场景 | 更多信息 |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本地模型运行时 | `agents.defaults.experimental.localModelLean` | 较小或更严格的本地后端无法处理 OpenClaw 完整的默认工具能力面 | [本地模型](/zh-CN/gateway/local-models) |
| 记忆搜索 | `agents.defaults.memorySearch.experimental.sessionMemory` | 你希望 `memory_search` 为先前的会话转录建立索引，并接受额外的存储/索引成本 | [记忆配置参考](/zh-CN/reference/memory-config#session-memory-search-experimental) |
| 结构化规划工具 | `tools.experimental.planTool` | 你希望在兼容的运行时和 UI 中暴露结构化的 `update_plan` 工具，以跟踪多步骤工作 | [Gateway 网关配置参考](/zh-CN/gateway/configuration-reference#toolsexperimental) |

## 本地模型精简模式

`agents.defaults.experimental.localModelLean: true` 是为较弱的本地模型设置提供的一个缓冲阀。它会裁剪 `browser`、`cron` 和 `message` 这类重量级默认工具，从而让提示结构更小，也更适合上下文较小或要求更严格的 OpenAI 兼容后端。

这**并不是**正常路径。如果你的后端可以稳定处理完整运行时，请保持其关闭。

## 实验性不等于隐藏

如果某项功能是实验性的，OpenClaw 应该在文档中以及配置路径本身清楚地说明这一点。它**不应该**做的是把预览行为偷偷塞进一个看起来稳定的默认开关里，然后假装这很正常。那样只会让配置能力面变得混乱。

## 相关

- [功能](/zh-CN/concepts/features)
- [发布渠道](/zh-CN/install/development-channels)
