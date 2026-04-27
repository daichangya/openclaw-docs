---
read_when:
    - 你想要带显式审批的确定性多步骤工作流 บาคาร่analysis to=functions.read 】【。】【”】【commentary оЈjson? no need. translate.
    - 你需要在不重新运行前面步骤的情况下恢复工作流
summary: 面向 OpenClaw 的类型化工作流运行时，带可恢复的审批关卡。
title: Lobster
x-i18n:
    generated_at: "2026-04-23T21:08:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster 是一个工作流 shell，让 OpenClaw 能够将多步骤工具序列作为一个单一、确定性的操作来运行，并带有显式审批检查点。

Lobster 位于分离式后台工作之上的一个编写层。关于高于单个任务的流编排，请参见 [Task Flow](/zh-CN/automation/taskflow)（`openclaw tasks flow`）。关于任务活动账本，请参见 [`openclaw tasks`](/zh-CN/automation/tasks)。

## Hook

你的助手可以构建管理它自身的工具。你提出一个工作流，30 分钟后你就会得到一个 CLI 加上一组可以通过一次调用运行的流水线。Lobster 正是缺失的那一块：确定性流水线、显式审批、以及可恢复状态。

## 为什么

如今，复杂工作流需要大量来回的工具调用。每一次调用都会消耗 token，而且 LLM 必须编排每一步。Lobster 将这部分编排移入一个类型化运行时中：

- **一次调用代替多次调用**：OpenClaw 只运行一次 Lobster 工具调用，并获得结构化结果。
- **审批内建**：副作用（发送邮件、发布评论）会让工作流暂停，直到显式批准。
- **可恢复**：暂停的工作流会返回一个令牌；批准后恢复，无需重新运行全部步骤。

## 为什么要用 DSL，而不是普通程序？

Lobster 是有意保持小巧的。目标不是“发明一种新语言”，而是提供一种可预测、对 AI 友好的流水线规范，并具备一等公民级别的审批和恢复令牌支持。

- **审批/恢复内建**：普通程序可以提示人类，但如果不自己发明那套运行时，它无法用一个持久令牌来实现_暂停并恢复_。
- **确定性 + 可审计性**：流水线是数据，因此它们易于记录、diff、重放和审查。
- **为 AI 限制表面**：微型语法 + JSON 管道可以减少“创造性”代码路径，并使校验变得现实。
- **安全策略内嵌**：超时、输出上限、沙箱检查和 allowlist 都由运行时强制执行，而不是由每个脚本自行处理。
- **仍然可编程**：每一步都可以调用任意 CLI 或脚本。如果你想使用 JS/TS，可以从代码生成 `.lobster` 文件。

## 工作原理

OpenClaw **在进程内**运行 Lobster 工作流，使用内嵌 runner。不会生成外部 CLI 子进程；工作流引擎直接在 gateway 进程内部执行，并直接返回 JSON envelope。
如果流水线因为等待审批而暂停，工具会返回一个 `resumeToken`，以便你稍后继续。

## 模式：小型 CLI + JSON 管道 + 审批

构建能够输出 JSON 的小命令，然后把它们串成一次 Lobster 调用。（下面的命令名只是示例 —— 你可以换成自己的。）

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

如果流水线请求审批，请使用令牌恢复：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI 触发工作流；Lobster 执行步骤。审批关卡让副作用保持显式且可审计。

示例：将输入项映射为工具调用：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 仅 JSON 的 LLM 步骤（llm-task）

对于需要**结构化 LLM 步骤**的工作流，请启用可选的
`llm-task` 插件工具，并从 Lobster 中调用它。这样可以在保持工作流
确定性的同时，仍然使用模型完成分类/总结/起草。

启用该工具：

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

在流水线中使用它：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

详情和配置选项请参见 [LLM Task](/zh-CN/tools/llm-task)。

## 工作流文件（.lobster）

Lobster 可以运行带有 `name`、`args`、`steps`、`env`、`condition` 和 `approval` 字段的 YAML/JSON 工作流文件。在 OpenClaw 工具调用中，将 `pipeline` 设置为文件路径即可。

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

说明：

- `stdin: $step.stdout` 和 `stdin: $step.json` 会传入前一步的输出。
- `condition`（或 `when`）可以基于 `$step.approved` 来门控步骤。

## 安装 Lobster

内置的 Lobster 工作流以进程内方式运行；无需单独的 `lobster` 二进制。内嵌 runner 随 Lobster 插件一起提供。

如果你在开发或外部流水线中需要独立的 Lobster CLI，请从 [Lobster repo](https://github.com/openclaw/lobster) 安装，并确保 `lobster` 位于 `PATH` 中。

## 启用该工具

Lobster 是一个**可选**插件工具（默认未启用）。

推荐方式（增量、安全）：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

或按智能体启用：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

除非你打算运行在严格 allowlist 模式下，否则请避免使用 `tools.allow: ["lobster"]`。

注意：对于可选插件，allowlist 是显式启用的。如果你的 allowlist 只列出了
插件工具（例如 `lobster`），OpenClaw 仍会保持核心工具启用。若要限制核心
工具，也请把你想保留的核心工具或工具组加入 allowlist。

## 示例：邮件分流

不使用 Lobster 时：

```text
User: "Check my email and draft replies"
→ openclaw 调用 gmail.list
→ LLM 进行总结
→ User: "draft replies to #2 and #5"
→ LLM 起草
→ User: "send #2"
→ openclaw 调用 gmail.send
（每天重复，没有关于已分流内容的记忆）
```

使用 Lobster 时：

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

返回一个 JSON envelope（截断示例）：

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

用户批准 → 恢复：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

一个工作流。确定。安全。

## 工具参数

### `run`

在工具模式下运行一个流水线。

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

带参数运行工作流文件：

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

在审批之后继续一个暂停的工作流。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 可选输入

- `cwd`：流水线的相对工作目录（必须保持在 gateway 工作目录内）。
- `timeoutMs`：若工作流超过此时长则中止（默认：20000）。
- `maxStdoutBytes`：若输出超过此大小则中止（默认：512000）。
- `argsJson`：传给 `lobster run --args-json` 的 JSON 字符串（仅工作流文件）。

## 输出 envelope

Lobster 会返回一个 JSON envelope，状态只有三种：

- `ok` → 成功完成
- `needs_approval` → 已暂停；恢复时需要 `requiresApproval.resumeToken`
- `cancelled` → 被显式拒绝或取消

该工具会同时在 `content`（美化后的 JSON）和 `details`（原始对象）中暴露这个 envelope。

## 审批

如果存在 `requiresApproval`，请检查提示词并决定：

- `approve: true` → 恢复并继续执行副作用
- `approve: false` → 取消并结束该工作流

使用 `approve --preview-from-stdin --limit N` 可以将 JSON 预览附加到审批请求中，而无需自定义 jq/heredoc 粘合代码。恢复令牌现在很紧凑：Lobster 会将工作流恢复状态存储在其状态目录中，并返回一个小型 token key。

## OpenProse

OpenProse 与 Lobster 配合得很好：使用 `/prose` 编排多智能体准备工作，然后运行一个 Lobster 流水线来获得确定性审批。如果某个 Prose 程序需要 Lobster，请通过 `tools.subagents.tools` 允许子智能体使用 `lobster` 工具。参见 [OpenProse](/zh-CN/prose)。

## 安全性

- **仅本地进程内** —— 工作流在 gateway 进程内部执行；插件本身不发起网络调用。
- **不管理密钥** —— Lobster 不管理 OAuth；它调用的是负责 OAuth 的 OpenClaw 工具。
- **感知沙箱** —— 当工具上下文位于沙箱中时会禁用。
- **已加固** —— 内嵌 runner 会强制执行超时和输出上限。

## 故障排除

- **`lobster timed out`** → 提高 `timeoutMs`，或将长流水线拆分。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或减少输出大小。
- **`lobster returned invalid JSON`** → 确保流水线在工具模式下运行，并且只输出 JSON。
- **`lobster failed`** → 检查 gateway 日志中的内嵌 runner 错误详情。

## 了解更多

- [插件](/zh-CN/tools/plugin)
- [插件工具编写](/zh-CN/plugins/building-plugins#registering-agent-tools)

## 案例研究：社区工作流

一个公开示例是“second brain”CLI + Lobster 流水线，用于管理三个 Markdown vault（个人、伴侣、共享）。该 CLI 会为统计、收件箱列表和陈旧扫描输出 JSON；Lobster 则将这些命令串联为 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 等工作流，每个都带有审批关卡。当可用时，AI 负责判断（分类），不可用时则回退到确定性规则。

- 讨论串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 仓库：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相关

- [自动化与任务](/zh-CN/automation) —— 调度 Lobster 工作流
- [自动化概览](/zh-CN/automation) —— 所有自动化机制
- [工具概览](/zh-CN/tools) —— 所有可用的智能体工具
