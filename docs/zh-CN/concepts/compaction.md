---
read_when:
    - 你想了解自动压缩整理和 /compact
    - 你正在调试触及上下文限制的长会话
summary: OpenClaw 如何对长对话进行总结以保持在模型限制范围内
title: 压缩整理
x-i18n:
    generated_at: "2026-04-27T00:54:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e9ac457b9b011f53fb6e70324ce2eeda923cd93487eb7742ace77b976e176ba
    source_path: concepts/compaction.md
    workflow: 15
---

每个模型都有一个上下文窗口——也就是它最多能处理的 token 数量。
当对话接近这个限制时，OpenClaw 会将较早的消息**压缩整理**成一段摘要，
这样聊天就可以继续进行。

## 工作原理

1. 较早的对话轮次会被总结成一条压缩整理条目。
2. 该摘要会保存到会话转录中。
3. 最近的消息会保持原样。

当 OpenClaw 将历史拆分为压缩整理分块时，它会让助手的工具调用与其匹配的 `toolResult` 条目保持配对。如果拆分点落在一个工具块内部，OpenClaw 会移动边界，以便该配对保持在一起，并保留当前未总结的尾部内容。

完整的对话历史会保留在磁盘上。压缩整理只会改变模型在下一轮看到的内容。

## 自动压缩整理

自动压缩整理默认开启。它会在会话接近上下文限制时运行，或者在模型返回上下文溢出错误时运行（在这种情况下，OpenClaw 会先压缩整理再重试）。常见的溢出特征包括 `request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model` 和 `ollama error: context length exceeded`。

<Info>
在开始压缩整理之前，OpenClaw 会自动提醒智能体将重要备注保存到 [memory](/zh-CN/concepts/memory) 文件中。这样可以防止上下文丢失。
</Info>

使用 `openclaw.json` 中的 `agents.defaults.compaction` 设置来配置压缩整理行为（模式、目标 token 数等）。
压缩整理摘要默认会保留不透明标识符（`identifierPolicy: "strict"`）。你可以通过 `identifierPolicy: "off"` 覆盖此行为，或者使用 `identifierPolicy: "custom"` 和 `identifierInstructions` 提供自定义文本。

你也可以通过 `agents.defaults.compaction.model` 为压缩整理摘要指定一个不同的模型。当你的主模型是本地模型或小型模型，而你希望压缩整理摘要由能力更强的模型生成时，这会很有用。该覆盖项接受任意 `provider/model-id` 字符串：

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

这也适用于本地模型，例如专门用于摘要的第二个 Ollama 模型，或经过微调的压缩整理专用模型：

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

未设置时，压缩整理会使用智能体的主模型。

## 可插拔的压缩整理提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩整理提供商。当某个提供商已注册并完成配置时，OpenClaw 会将摘要生成委托给它，而不是使用内置的 LLM 流程。

要使用已注册的提供商，请在你的配置中设置提供商 id：

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

设置 `provider` 会自动强制 `mode: "safeguard"`。提供商会接收与内置路径相同的压缩整理说明和标识符保留策略，而在提供商输出之后，OpenClaw 仍会保留最近轮次和拆分轮次后缀上下文。如果提供商失败或返回空结果，OpenClaw 会回退到内置的 LLM 摘要生成。

## 自动压缩整理（默认开启）

当会话接近或超出模型的上下文窗口时，OpenClaw 会触发自动压缩整理，并且可能会使用压缩整理后的上下文重试原始请求。

你会看到：

- 在详细模式下显示 `🧹 Auto-compaction complete`
- `/status` 显示 `🧹 Compactions: <count>`

在压缩整理之前，OpenClaw 可以运行一次**静默 memory 刷新**轮次，将持久备注存储到磁盘。详情和配置请参见 [Memory](/zh-CN/concepts/memory)。

## 手动压缩整理

在任意聊天中输入 `/compact` 以强制执行一次压缩整理。你还可以添加说明来引导摘要内容：

```
/compact Focus on the API design decisions
```

当设置了 `agents.defaults.compaction.keepRecentTokens` 时，手动压缩整理会遵循该 Pi 截断点，并在重建的上下文中保留最近的尾部内容。没有显式的保留预算时，手动压缩整理会表现为一个硬检查点，并仅从新的摘要继续。

启用 `agents.defaults.compaction.truncateAfterCompaction` 时，
OpenClaw 不会原地重写现有转录。它会基于压缩整理摘要、保留状态和未总结尾部创建一个新的活动后继转录，然后将之前的 JSONL 保留为归档检查点来源。

## 使用不同的模型

默认情况下，压缩整理使用你的智能体主模型。你可以使用能力更强的模型来获得更好的摘要：

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

## 压缩整理通知

默认情况下，压缩整理会静默运行。若要在压缩整理开始和完成时显示简短通知，请启用 `notifyUser`：

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

启用后，用户会在每次压缩整理运行前后看到简短的状态消息
（例如，“正在压缩整理上下文...” 和 “压缩整理完成”）。

## 压缩整理与剪枝

|                  | 压缩整理                     | 剪枝                             |
| ---------------- | ---------------------------- | -------------------------------- |
| **作用**         | 总结较早的对话               | 裁剪旧的工具结果                 |
| **会保存吗？**   | 会（保存在会话转录中）       | 不会（仅在内存中、按请求生效）   |
| **范围**         | 整个对话                     | 仅工具结果                       |

[Session pruning](/zh-CN/concepts/session-pruning) 是一种更轻量的补充方式，它会在不进行总结的情况下裁剪工具输出。

## 故障排除

**压缩整理过于频繁？** 模型的上下文窗口可能较小，或者工具输出可能较大。可以尝试启用
[session pruning](/zh-CN/concepts/session-pruning)。

**压缩整理后感觉上下文不够新鲜？** 使用 `/compact Focus on <topic>` 来引导摘要，或者启用 [memory flush](/zh-CN/concepts/memory)，以便备注能够保留下来。

**需要一个全新的开始？** `/new` 会启动一个全新的会话，而不会进行压缩整理。

有关高级配置（预留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩整理），请参阅
[Session Management Deep Dive](/zh-CN/reference/session-management-compaction)。

## 相关内容

- [Session](/zh-CN/concepts/session) — 会话管理与生命周期
- [Session Pruning](/zh-CN/concepts/session-pruning) — 裁剪工具结果
- [Context](/zh-CN/concepts/context) — 如何为智能体轮次构建上下文
- [Hooks](/zh-CN/automation/hooks) — 压缩整理生命周期钩子（before_compaction、after_compaction）
