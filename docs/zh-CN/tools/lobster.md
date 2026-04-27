---
read_when:
    - 你希望使用具有显式批准机制的确定性多步骤工作流
    - 你需要在不重新运行前面步骤的情况下恢复工作流
summary: 带可恢复批准关卡的 OpenClaw 类型化工作流运行时。
title: Lobster
x-i18n:
    generated_at: "2026-04-27T06:07:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 15
---

Lobster 是一个工作流 shell，让 OpenClaw 能够把多步骤工具序列作为一次单一、确定性的操作来运行，并带有显式批准检查点。

Lobster 位于分离式后台工作之上的一个编写层。若要了解单个任务之上的流程编排，请参见 [Task Flow](/zh-CN/automation/taskflow)（`openclaw tasks flow`）。若要查看任务活动账本，请参见 [`openclaw tasks`](/zh-CN/automation/tasks)。

## 引子

你的助手可以构建管理它自己的工具。只要提出一个工作流请求，30 分钟后你就能得到一个 CLI 和一组可通过一次调用运行的流水线。Lobster 就是缺失的那一块：确定性流水线、显式批准，以及可恢复状态。

## 为什么要用它

如今，复杂工作流需要来回进行许多工具调用。每次调用都会消耗 token，而且 LLM 必须编排每一个步骤。Lobster 把这种编排移入一个类型化运行时：

- **一次调用代替多次调用**：OpenClaw 运行一次 Lobster 工具调用，并获得结构化结果。
- **内置批准**：带副作用的操作（发送邮件、发布评论）会暂停工作流，直到被显式批准。
- **可恢复**：暂停的工作流会返回一个令牌；批准后可恢复，而无需重新运行所有内容。

## 为什么使用 DSL，而不是普通程序？

Lobster 是有意保持精简的。目标不是“发明一种新语言”，而是提供一个可预测、对 AI 友好的流水线规范，并拥有一等的批准与恢复令牌能力。

- **内置批准/恢复**：普通程序可以提示人类，但如果没有你自己实现那套运行时，它无法使用持久令牌来_暂停并恢复_。
- **确定性 + 可审计性**：流水线是数据，因此易于记录、Diffs、重放和审查。
- **面向 AI 的受限表面**：微小语法 + JSON 管道可以减少“创造性”代码路径，并使验证更现实。
- **内建安全策略**：超时、输出上限、沙箱检查和允许列表由运行时统一强制执行，而不是由每个脚本自行处理。
- **仍然可编程**：每一步都可以调用任意 CLI 或脚本。如果你想使用 JS/TS，可以从代码生成 `.lobster` 文件。

## 工作原理

OpenClaw **在进程内**运行 Lobster 工作流，使用的是嵌入式运行器。不会启动外部 CLI 子进程；工作流引擎在 Gateway 网关进程内部执行，并直接返回一个 JSON 信封。
如果流水线因等待批准而暂停，该工具会返回 `resumeToken`，以便你稍后继续。

## 模式：小型 CLI + JSON 管道 + 批准

构建一些会说 JSON 的小命令，然后把它们串联成一次 Lobster 调用。（下面的命令名只是示例——请替换成你自己的。）

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

如果流水线请求批准，请使用该令牌恢复：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI 触发工作流；Lobster 执行步骤。批准关卡让副作用保持显式且可审计。

示例：将输入项映射为工具调用：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 仅 JSON 的 LLM 步骤（llm-task）

对于需要**结构化 LLM 步骤**的工作流，请启用可选的
`llm-task` 插件工具，并从 Lobster 中调用它。这样既能保持工作流
的确定性，又能让你借助模型完成分类/总结/起草。

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

- `stdin: $step.stdout` 和 `stdin: $step.json` 用于传递前一步的输出。
- `condition`（或 `when`）可根据 `$step.approved` 对步骤进行门控。

## 安装 Lobster

内置的 Lobster 工作流在进程内运行；不需要单独的 `lobster` 二进制文件。嵌入式运行器会随 Lobster 插件一起提供。

如果你在开发或外部流水线中需要独立的 Lobster CLI，请从 [Lobster 仓库](https://github.com/openclaw/lobster) 安装，并确保 `lobster` 位于 `PATH` 中。

## 启用该工具

Lobster 是一个**可选**插件工具（默认不启用）。

推荐方式（增量、安全）：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

或者按智能体启用：

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

除非你明确打算在严格允许列表模式下运行，否则不要使用 `tools.allow: ["lobster"]`。

<Note>
可选插件的允许列表采用选择启用机制。如果你的允许列表只列出插件工具（如 `lobster`），OpenClaw 仍会保留核心工具为启用状态。若要限制核心工具，也请将你需要的核心工具或工具组一并加入允许列表。
</Note>

## 示例：电子邮件分流

不使用 Lobster：

```
用户：“检查我的邮件并起草回复”
→ openclaw 调用 gmail.list
→ LLM 总结
→ 用户：“为 #2 和 #5 起草回复”
→ LLM 起草
→ 用户：“发送 #2”
→ openclaw 调用 gmail.send
（每天重复，不记得哪些已经处理过）
```

使用 Lobster：

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

返回一个 JSON 信封（已截断）：

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

以工具模式运行一个流水线。

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

在批准后继续已暂停的工作流。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 可选输入

- `cwd`：流水线的相对工作目录（必须保持在 Gateway 网关工作目录内）。
- `timeoutMs`：如果工作流超过该时长则中止（默认：20000）。
- `maxStdoutBytes`：如果输出超过该大小则中止工作流（默认：512000）。
- `argsJson`：传递给 `lobster run --args-json` 的 JSON 字符串（仅适用于工作流文件）。

## 输出信封

Lobster 会返回一个 JSON 信封，其状态为以下三种之一：

- `ok` → 成功完成
- `needs_approval` → 已暂停；恢复时需要 `requiresApproval.resumeToken`
- `cancelled` → 被显式拒绝或取消

该工具会同时在 `content`（美化后的 JSON）和 `details`（原始对象）中暴露该信封。

## 批准

如果存在 `requiresApproval`，请检查提示并决定：

- `approve: true` → 恢复并继续执行带副作用的操作
- `approve: false` → 取消并结束该工作流

使用 `approve --preview-from-stdin --limit N` 可以把 JSON 预览附加到批准请求中，而无需自定义 `jq`/heredoc 粘合代码。现在的恢复令牌更紧凑：Lobster 会将工作流恢复状态保存在其状态目录下，并返回一个小型令牌键。

## OpenProse

OpenProse 与 Lobster 配合良好：先使用 `/prose` 编排多智能体准备工作，再运行一个 Lobster 流水线来执行带确定性批准的流程。如果某个 Prose 程序需要 Lobster，请通过 `tools.subagents.tools` 为子智能体允许 `lobster` 工具。参见 [OpenProse](/zh-CN/prose)。

## 安全

- **仅本地进程内**——工作流在 Gateway 网关进程内部执行；插件自身不会发起网络调用。
- **无密钥管理**——Lobster 不管理 OAuth；它调用的是负责此事的 OpenClaw 工具。
- **感知沙箱**——当工具上下文处于沙箱隔离中时，该功能会被禁用。
- **已加固**——超时和输出上限由嵌入式运行器强制执行。

## 故障排除

- **`lobster timed out`** → 增加 `timeoutMs`，或拆分较长流水线。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes`，或减少输出大小。
- **`lobster returned invalid JSON`** → 确保流水线以工具模式运行，并且只输出 JSON。
- **`lobster failed`** → 检查 Gateway 网关日志中的嵌入式运行器错误详情。

## 了解更多

- [插件](/zh-CN/tools/plugin)
- [插件工具编写](/zh-CN/plugins/building-plugins#registering-agent-tools)

## 案例研究：社区工作流

一个公开示例是：“第二大脑” CLI + Lobster 流水线，用于管理三个 Markdown 仓库（个人、伴侣、共享）。该 CLI 会为统计、收件箱列表和陈旧扫描输出 JSON；Lobster 会把这些命令串联成诸如 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 之类的工作流，每个都带有批准关卡。AI 在可用时负责判断（分类），在不可用时则回退到确定性规则。

- 讨论串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 仓库：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相关内容

- [自动化与任务](/zh-CN/automation) — 调度 Lobster 工作流
- [自动化概览](/zh-CN/automation) — 所有自动化机制
- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
