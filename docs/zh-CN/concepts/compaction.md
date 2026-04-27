---
read_when:
    - 你想了解自动压缩整理和 `/compact`
    - 你正在调试触及上下文限制的长会话
summary: OpenClaw 如何总结长对话以保持在模型限制范围内
title: 压缩整理
x-i18n:
    generated_at: "2026-04-27T04:26:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: df7fae12618d5522deabc13a2ff81b507ce3b01840fa5c5ef3ae144aa01ece16
    source_path: concepts/compaction.md
    workflow: 15
---

每个模型都有一个上下文窗口：也就是它最多能处理的 token 数量。当对话接近这个限制时，OpenClaw 会将较早的消息**压缩整理**为摘要，这样聊天就能继续进行。

## 工作原理

1. 较早的对话轮次会被总结成一条压缩条目。
2. 摘要会保存在会话转录中。
3. 最近的消息会保持原样。

当 OpenClaw 将历史记录拆分为压缩整理分块时，它会让智能体的工具调用与其对应的 `toolResult` 条目保持配对。如果拆分点落在一个工具块内部，OpenClaw 会移动边界，以便让这对记录保持在一起，并保留当前未总结的尾部内容。

完整的对话历史仍然保存在磁盘上。压缩整理只会改变模型在下一轮中看到的内容。

## 自动压缩整理

自动压缩整理默认开启。当会话接近上下文限制时，它会运行；或者当模型返回上下文溢出错误时也会运行（此时 OpenClaw 会先压缩整理再重试）。

你会看到：

- 在详细模式下显示 `🧹 Auto-compaction complete`。
- `/status` 显示 `🧹 Compactions: <count>`。

<Info>
在压缩整理之前，OpenClaw 会自动提醒智能体将重要备注保存到 [memory](/zh-CN/concepts/memory) 文件中。这样可以防止上下文丢失。
</Info>

<AccordionGroup>
  <Accordion title="已识别的溢出特征">
    OpenClaw 会根据以下提供商错误模式检测上下文溢出：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`
  </Accordion>
</AccordionGroup>

## 手动压缩整理

在任意聊天中输入 `/compact` 即可强制执行一次压缩整理。你也可以添加说明来引导摘要内容：

```
/compact Focus on the API design decisions
```

当设置了 `agents.defaults.compaction.keepRecentTokens` 时，手动压缩整理会遵循该 Pi 截断点，并在重建后的上下文中保留最近的尾部内容。如果没有显式的保留预算，手动压缩整理会表现为一个硬检查点，并仅基于新的摘要继续。

## 配置

在你的 `openclaw.json` 中，通过 `agents.defaults.compaction` 配置压缩整理。下面列出了最常见的调节项；完整参考请见 [Session management deep dive](/zh-CN/reference/session-management-compaction)。

### 使用不同的模型

默认情况下，压缩整理会使用智能体的主模型。设置 `agents.defaults.compaction.model` 可以将摘要任务委托给一个能力更强或更专业的模型。这个覆盖值接受任意 `provider/model-id` 字符串：

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

这也适用于本地模型，例如专门用于摘要的第二个 Ollama 模型：

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

如果未设置，压缩整理会使用智能体的主模型。

### 标识符保留

压缩整理摘要默认会保留不透明标识符（`identifierPolicy: "strict"`）。你可以将其改为 `identifierPolicy: "off"` 来禁用，或者使用 `identifierPolicy: "custom"` 并配合 `identifierInstructions` 来提供自定义指导。

### 活动转录字节保护

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 时，如果活动 JSONL 达到该大小，OpenClaw 会在运行前触发常规本地压缩整理。这对于长时间运行的会话很有用：即使提供商侧的上下文管理可能让模型上下文保持健康，本地转录文件仍可能持续增长。它不会直接切分原始 JSONL 字节，而是调用常规压缩整理流水线来创建语义摘要。

<Warning>
字节保护要求设置 `truncateAfterCompaction: true`。如果不进行转录轮转，活动文件不会缩小，该保护机制也就不会生效。
</Warning>

### 后继转录

当启用 `agents.defaults.compaction.truncateAfterCompaction` 时，OpenClaw 不会就地重写现有转录。它会基于压缩整理摘要、保留状态和未总结的尾部内容创建一个新的活动后继转录，同时将之前的 JSONL 保留为归档检查点来源。

### 压缩整理通知

默认情况下，压缩整理会静默运行。将 `notifyUser` 设为开启后，会在压缩整理开始和完成时显示简短的状态消息：

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

### Memory 刷新

在压缩整理之前，OpenClaw 可以运行一次**静默 Memory 刷新**轮次，将持久化备注保存到磁盘。详情和配置请见 [Memory](/zh-CN/concepts/memory)。

## 可插拔压缩整理提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩整理提供商。当某个提供商已注册并已配置时，OpenClaw 会将摘要工作委托给它，而不是使用内置的 LLM 流水线。

要使用已注册的提供商，请在配置中设置它的 id：

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

设置 `provider` 会自动强制使用 `mode: "safeguard"`。提供商会接收到与内置路径相同的压缩整理说明和标识符保留策略，而在提供商输出之后，OpenClaw 仍会保留最近轮次和拆分轮次的后缀上下文。

<Note>
如果提供商失败或返回空结果，OpenClaw 会回退到内置的 LLM 摘要方式。
</Note>

## 压缩整理与修剪

|                  | 压缩整理                     | 修剪                             |
| ---------------- | ---------------------------- | -------------------------------- |
| **作用**         | 总结较早的对话               | 裁剪旧的工具结果                 |
| **会保存吗？**   | 会（保存在会话转录中）       | 不会（仅保存在内存中，按请求）   |
| **范围**         | 整个对话                     | 仅工具结果                       |

[Session pruning](/zh-CN/concepts/session-pruning) 是一种更轻量的补充方式，它会在不进行摘要的情况下裁剪工具输出。

## 故障排除

**压缩整理得太频繁？** 模型的上下文窗口可能较小，或者工具输出可能很大。尝试启用 [session pruning](/zh-CN/concepts/session-pruning)。

**压缩整理后感觉上下文不够新鲜？** 使用 `/compact Focus on <topic>` 来引导摘要，或者启用 [memory flush](/zh-CN/concepts/memory)，这样备注就能保留下来。

**需要一个全新的开始？** `/new` 会启动一个新的会话，而不会执行压缩整理。

有关高级配置（保留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩整理），请参阅 [Session management deep dive](/zh-CN/reference/session-management-compaction)。

## 相关内容

- [Session](/zh-CN/concepts/session)：会话管理和生命周期。
- [Session pruning](/zh-CN/concepts/session-pruning)：裁剪工具结果。
- [Context](/zh-CN/concepts/context)：如何为智能体轮次构建上下文。
- [Hooks](/zh-CN/automation/hooks)：压缩整理生命周期钩子（`before_compaction`、`after_compaction`）。
