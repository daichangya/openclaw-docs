---
read_when:
    - 你想了解自动压缩总结和 /compact
    - 你正在调试触及上下文限制的长会话
summary: OpenClaw 如何总结长对话以保持在模型限制之内
title: 压缩总结
x-i18n:
    generated_at: "2026-04-23T20:45:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b88a757b19a7c040599a0a7901d8596001ffff148f7f6e861a3cc783100393f7
    source_path: concepts/compaction.md
    workflow: 15
---

每个模型都有一个上下文窗口——也就是它能够处理的最大 token 数量。
当对话接近这个限制时，OpenClaw 会将较早的消息**压缩总结**为摘要，
以便聊天可以继续进行。

## 工作原理

1. 较早的对话轮次会被总结成一条精简条目。
2. 该摘要会保存到会话转录中。
3. 最近的消息会保持原样。

当 OpenClaw 将历史记录拆分为压缩总结分块时，它会让助手的工具调用与其匹配的 `toolResult` 条目保持配对。如果拆分点落在工具块内部，OpenClaw 会移动边界，以便该配对保持在一起，并保留当前未总结的尾部内容。

完整的对话历史会保留在磁盘上。压缩总结只会改变模型在下一轮中看到的内容。

## 自动压缩总结

默认开启自动压缩总结。当会话接近上下文限制时会运行，或者当模型返回上下文溢出错误时也会运行（此时
OpenClaw 会先压缩总结再重试）。常见的溢出特征包括
`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`，以及 `ollama error: context length
exceeded`。

<Info>
在压缩总结之前，OpenClaw 会自动提醒智能体将重要备注保存到 [memory](/zh-CN/concepts/memory) 文件中。这样可以防止上下文丢失。
</Info>

使用 `openclaw.json` 中的 `agents.defaults.compaction` 设置来配置压缩总结行为（模式、目标 token 数等）。
压缩总结默认会保留不透明标识符（`identifierPolicy: "strict"`）。你可以用 `identifierPolicy: "off"` 覆盖此行为，或者通过 `identifierPolicy: "custom"` 和 `identifierInstructions` 提供自定义文本。

你还可以通过 `agents.defaults.compaction.model` 为压缩总结指定不同的模型。当你的主模型是本地模型或小模型，而你希望由更强的模型生成压缩摘要时，这会很有用。该覆盖项接受任意 `provider/model-id` 字符串：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

这也适用于本地模型，例如专用于摘要的第二个 Ollama 模型，或经过微调的压缩总结专用模型：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

如果未设置，压缩总结会使用该智能体的主模型。

## 可插拔压缩总结提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩总结提供商。当某个提供商已注册并完成配置后，OpenClaw 会将摘要生成委托给它，而不是使用内置 LLM 流水线。

要使用已注册的提供商，请在配置中设置提供商 ID：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

设置 `provider` 会自动强制使用 `mode: "safeguard"`。提供商会接收与内置路径相同的压缩总结指令和标识符保留策略，并且在提供商输出之后，OpenClaw 仍会保留最近轮次和拆分轮次后缀上下文。如果提供商失败或返回空结果，OpenClaw 会回退到内置的 LLM 压缩总结。

## 自动压缩总结（默认开启）

当会话接近或超出模型的上下文窗口时，OpenClaw 会触发自动压缩总结，并可能使用压缩后的上下文重试原始请求。

你会看到：

- 在 verbose 模式下显示 `🧹 Auto-compaction complete`
- `/status` 显示 `🧹 Compactions: <count>`

在压缩总结之前，OpenClaw 可以运行一次**静默 memory flush** 轮次，将持久备注保存到磁盘。详情和配置请参见 [Memory](/zh-CN/concepts/memory)。

## 手动压缩总结

在任意聊天中输入 `/compact` 即可强制执行一次压缩总结。你还可以添加说明来引导摘要内容：

```
/compact Focus on the API design decisions
```

## 使用不同的模型

默认情况下，压缩总结使用你的智能体主模型。你可以使用能力更强的模型来获得更好的摘要：

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## 压缩总结通知

默认情况下，压缩总结会静默运行。要在压缩总结开始和完成时显示简短通知，请启用 `notifyUser`：

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

启用后，用户会在每次压缩总结运行前后看到简短状态消息
（例如 “正在压缩上下文...” 和 “压缩总结完成”）。

## 压缩总结与裁剪

|                  | 压缩总结 | 裁剪 |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用** | 总结较早的对话 | 裁剪旧的工具结果 |
| **会保存吗？** | 是（保存在会话转录中） | 否（仅在内存中，按请求生效） |
| **范围** | 整个对话 | 仅工具结果 |

[会话裁剪](/zh-CN/concepts/session-pruning) 是一种更轻量的补充方式，它会在不生成摘要的情况下裁剪工具输出。

## 故障排除

**压缩总结过于频繁？** 模型的上下文窗口可能较小，或者工具输出可能较大。尝试启用
[会话裁剪](/zh-CN/concepts/session-pruning)。

**压缩总结后感觉上下文变旧了？** 使用 `/compact Focus on <topic>` 来
引导摘要内容，或者启用 [memory flush](/zh-CN/concepts/memory)，让备注得以保留。

**需要一个全新起点？** `/new` 会启动一个全新的会话，而不进行压缩总结。

如需高级配置（预留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩总结），请参见
[会话管理深度解析](/zh-CN/reference/session-management-compaction)。

## 相关内容

- [会话](/zh-CN/concepts/session) — 会话管理与生命周期
- [会话裁剪](/zh-CN/concepts/session-pruning) — 裁剪工具结果
- [上下文](/zh-CN/concepts/context) — 如何为智能体轮次构建上下文
- [Hooks](/zh-CN/automation/hooks) — 压缩总结生命周期 hooks（`before_compaction`、`after_compaction`）
