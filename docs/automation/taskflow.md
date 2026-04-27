---
read_when:
    - 你想了解 Task Flow 与后台任务之间的关系。
    - 你在发布说明或文档中遇到了 Task Flow 或 openclaw tasks flow。
    - 你想检查或管理持久化的流程状态。
summary: Task Flow 流程编排层，位于后台任务之上
title: 任务流程
x-i18n:
    generated_at: "2026-04-24T18:07:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

Task Flow 是位于 [后台任务](/zh-CN/automation/tasks) 之上的流程编排底层。它管理可持久化的多步骤流程，这些流程具有各自的状态、修订跟踪和同步语义，而单个任务仍然是分离工作的基本单位。

## 何时使用 Task Flow

当工作跨越多个顺序步骤或分支步骤，并且你需要在 Gateway 网关 重启后仍能持续跟踪进度时，请使用 Task Flow。对于单个后台操作，普通的 [任务](/zh-CN/automation/tasks) 就足够了。

| 场景 | 使用方式 |
| ------------------------------------- | -------------------- |
| 单个后台作业 | 普通任务 |
| 多步骤流水线（A 然后 B 然后 C） | Task Flow（托管） |
| 观察外部创建的任务 | Task Flow（镜像） |
| 一次性提醒 | Cron 作业 |

## 可靠的定时工作流模式

对于市场情报简报这类周期性工作流，请将调度、编排和可靠性检查视为独立的层：

1. 使用 [定时任务](/zh-CN/automation/cron-jobs) 进行定时。
2. 当工作流应基于先前上下文继续构建时，使用持久化的 cron 会话。
3. 使用 [Lobster](/zh-CN/tools/lobster) 实现确定性步骤、审批关卡和恢复令牌。
4. 使用 Task Flow 在子任务、等待、重试和 Gateway 网关 重启之间跟踪多步骤运行。

cron 形状示例：

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

当周期性工作流需要有意识地保留历史记录、前一次运行摘要或固定上下文时，使用 `session:<id>`，而不是 `isolated`。当每次运行都应从头开始，且所有必需状态都在工作流中明确给出时，使用 `isolated`。

在工作流内部，将可靠性检查放在 LLM 摘要步骤之前：

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

推荐的预检项：

- 浏览器可用性和配置文件选择，例如用于托管状态的 `openclaw`，或在需要已登录 Chrome 会话时使用 `user`。参见 [Browser](/zh-CN/tools/browser)。
- 每个来源的 API 凭证和配额。
- 必需端点的网络可达性。
- 为智能体启用所需工具，例如 `lobster`、`browser` 和 `llm-task`。
- 为 cron 配置失败投递目标，以便预检失败时可见。参见 [定时任务](/zh-CN/automation/cron-jobs#delivery-and-output)。

推荐为每个收集项提供的数据来源字段：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

让工作流在摘要前拒绝或标记过期条目。LLM 步骤应只接收结构化 JSON，并应要求它在输出中保留 `sourceUrl`、`retrievedAt` 和 `asOf`。当你需要在工作流内部使用经过 schema 验证的模型步骤时，请使用 [LLM Task](/zh-CN/tools/llm-task)。

对于可复用的团队或社区工作流，可将 CLI、`.lobster` 文件以及所有设置说明打包为一个 skill 或 plugin，并通过 [ClawHub](/zh-CN/tools/clawhub) 发布。除非插件 API 缺少所需的通用能力，否则请将工作流特定的护栏保留在该包中。

## 同步模式

### 托管模式

Task Flow 端到端拥有整个生命周期。它将任务创建为流程步骤，驱动它们完成，并自动推进流程状态。

示例：一个每周报告流程，(1) 收集数据，(2) 生成报告，以及 (3) 投递报告。Task Flow 将每个步骤创建为后台任务，等待完成，然后移动到下一个步骤。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 镜像模式

Task Flow 观察外部创建的任务，并在不接管任务创建的情况下保持流程状态同步。当任务来自 cron 作业、CLI 命令或其他来源，而你希望以流程形式统一查看它们的进度时，这会非常有用。

示例：三个彼此独立的 cron 作业共同构成一个“morning ops”例行流程。镜像流程会跟踪它们的整体进度，但不会控制它们何时或如何运行。

## 持久化状态与修订跟踪

每个流程都会持久化自己的状态并跟踪修订，因此即使 Gateway 网关 重启，进度也能保留。修订跟踪支持在多个来源尝试并发推进同一流程时进行冲突检测。

## 取消行为

`openclaw tasks flow cancel` 会在流程上设置粘性的取消意图。流程中的活动任务会被取消，且不会启动任何新步骤。取消意图会在重启后继续保留，因此即使 Gateway 网关 在所有子任务终止前重启，被取消的流程仍会保持取消状态。

## CLI 命令

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| 命令 | 描述 |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list` | 显示已跟踪的流程及其状态和同步模式 |
| `openclaw tasks flow show <id>` | 按流程 id 或查找键检查单个流程 |
| `openclaw tasks flow cancel <id>` | 取消正在运行的流程及其活动任务 |

## 流程与任务的关系

流程协调任务，而不是取代任务。单个流程在其生命周期内可能会驱动多个后台任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查负责协调的流程。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) — 流程所协调的分离工作账本
- [CLI：tasks](/zh-CN/cli/tasks) — `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/zh-CN/automation) — 一览所有自动化机制
- [Cron 作业](/zh-CN/automation/cron-jobs) — 可能输入到流程中的定时作业
