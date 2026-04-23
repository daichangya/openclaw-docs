---
read_when:
    - 你想了解 OpenClaw 中“上下文”的含义
    - 你正在调试模型为什么“知道”某件事（或为什么忘记了）
    - 你想减少上下文开销（`/context`、`/status`、`/compact`）
summary: 上下文：模型会看到什么、它是如何构建的，以及如何检查它
title: 上下文
x-i18n:
    generated_at: "2026-04-23T20:45:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 928e237462ba772c44883dcbd5575ac2af472291c059618bac8244f9b2ccd72f
    source_path: concepts/context.md
    workflow: 15
---

“上下文”是指**OpenClaw 在一次运行中发送给模型的全部内容**。它受模型的**上下文窗口**（token 限制）约束。

适合初学者的理解方式：

- **系统提示词**（由 OpenClaw 构建）：规则、工具、Skills 列表、时间 / 运行时信息，以及注入的工作区文件。
- **对话历史**：你在此会话中的消息 + 助手消息。
- **工具调用 / 结果 + 附件**：命令输出、文件读取、图像 / 音频等。

上下文_不等同于_“记忆”：记忆可以存储在磁盘上并在之后重新加载；上下文则是模型当前窗口中的内容。

## 快速开始（检查上下文）

- `/status` → 快速查看“我的窗口用了多少？”以及会话设置。
- `/context list` → 查看注入了什么内容 + 粗略大小（按文件 + 总计）。
- `/context detail` → 更深入的拆解：按文件、按工具 schema 大小、按 Skills 条目大小，以及系统提示词大小。
- `/usage tokens` → 在普通回复后追加每次回复的用量页脚。
- `/compact` → 将较旧历史总结为一条紧凑条目，以释放窗口空间。

另请参阅：[Slash commands](/zh-CN/tools/slash-commands)、[Token use & costs](/zh-CN/reference/token-use)、[Compaction](/zh-CN/concepts/compaction)。

## 输出示例

具体数值会因模型、提供商、工具策略以及工作区内容而异。

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## 什么会计入上下文窗口

模型接收到的所有内容都会计入，包括：

- 系统提示词（所有部分）。
- 对话历史。
- 工具调用 + 工具结果。
- 附件 / 转录（图像 / 音频 / 文件）。
- 压缩摘要和裁剪构件。
- 提供商“包装层”或隐藏头信息（不可见，但仍会计入）。

## OpenClaw 如何构建系统提示词

系统提示词由 **OpenClaw 持有**，并且每次运行都会重新构建。它包括：

- 工具列表 + 简短描述。
- Skills 列表（仅元数据；见下文）。
- 工作区位置。
- 时间（UTC + 如果已配置则转换后的用户时间）。
- 运行时元数据（主机 / OS / 模型 / thinking）。
- 在 **Project Context** 下注入的工作区 bootstrap 文件。

完整拆解请参阅：[System Prompt](/zh-CN/concepts/system-prompt)。

## 注入的工作区文件（Project Context）

默认情况下，OpenClaw 会注入一组固定的工作区文件（如果存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅首次运行）

大文件会按文件使用 `agents.defaults.bootstrapMaxChars`（默认 `12000` 字符）进行截断。OpenClaw 还会对所有文件施加总 bootstrap 注入上限，即 `agents.defaults.bootstrapTotalMaxChars`（默认 `60000` 字符）。`/context` 会显示**原始大小与注入大小**，以及是否发生了截断。

发生截断时，运行时可以在 Project Context 下方的提示词中注入警告块。可通过 `agents.defaults.bootstrapPromptTruncationWarning` 配置（`off`、`once`、`always`；默认 `once`）。

## Skills：注入与按需加载

系统提示词中包含一个紧凑的 **Skills 列表**（名称 + 描述 + 位置）。这个列表确实会带来开销。

Skill 指令默认_不会_包含在内。模型应当仅在需要时才使用 `read` 去读取该 Skill 的 `SKILL.md`。

## 工具：有两种成本

工具会以两种方式影响上下文：

1. 系统提示词中的**工具列表文本**（你看到的 “Tooling”）。
2. **工具 schema**（JSON）。这些内容会发送给模型，以便它调用工具。即使你不会把它们视为普通文本看到，它们仍会计入上下文。

`/context detail` 会拆解占用最大的工具 schema，让你看出主导开销的部分。

## 命令、指令与“内联快捷方式”

Slash 命令由 Gateway 网关处理。这里有几种不同行为：

- **独立命令**：只包含 `/...` 的消息会作为命令执行。
- **指令**：`/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` 会在模型看到消息前被剥离。
  - 仅包含指令的消息会持久化会话设置。
  - 普通消息中的内联指令会作为单条消息提示。
- **内联快捷方式**（仅允许列表发送者）：普通消息中的某些 `/...` token 可以立即执行（例如：“hey /status”），并且在模型看到其余文本前被剥离。

详情请参阅：[Slash commands](/zh-CN/tools/slash-commands)。

## 会话、压缩与裁剪（哪些内容会持久化）

跨消息持久化哪些内容，取决于所用机制：

- **普通历史**会持久保留在会话转录中，直到被策略压缩 / 裁剪。
- **压缩**会将摘要持久写入转录，同时保留最近的消息。
- **裁剪**会从某次运行的**内存中**提示词里移除旧的工具结果，但不会重写转录。

文档： [Session](/zh-CN/concepts/session)、[Compaction](/zh-CN/concepts/compaction)、[Session pruning](/zh-CN/concepts/session-pruning)。

默认情况下，OpenClaw 使用内置的 `legacy` 上下文引擎来执行组装和
压缩。如果你安装了提供 `kind: "context-engine"` 的插件，并通过 `plugins.slots.contextEngine` 选择它，OpenClaw 就会将上下文
组装、`/compact` 以及相关的子智能体上下文生命周期 hook 委托给该
引擎。`ownsCompaction: false` 并不会自动回退到 legacy
引擎；活动引擎仍必须正确实现 `compact()`。完整的
可插拔接口、生命周期 hook 和配置请参阅
[Context Engine](/zh-CN/concepts/context-engine)。

## `/context` 实际报告的内容

在可用时，`/context` 会优先使用最近一次**运行时构建的**系统提示词报告：

- `System prompt (run)` = 来自最近一次嵌入式（具备工具能力）运行的捕获结果，并持久化到会话存储中。
- `System prompt (estimate)` = 在没有运行报告时即时计算（或者当通过不生成该报告的 CLI 后端运行时）。

无论哪种方式，它都会报告大小和主要贡献项；它**不会**转储完整系统提示词或工具 schema。

## 相关内容

- [Context Engine](/zh-CN/concepts/context-engine) —— 通过插件进行自定义上下文注入
- [Compaction](/zh-CN/concepts/compaction) —— 总结长对话
- [System Prompt](/zh-CN/concepts/system-prompt) —— 系统提示词如何构建
- [Agent Loop](/zh-CN/concepts/agent-loop) —— 完整的智能体执行循环
