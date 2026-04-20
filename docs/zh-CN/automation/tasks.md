---
read_when:
    - 检查正在进行中或刚刚完成的后台工作
    - 调试已分离的智能体运行的交付失败问题
    - 了解后台运行与会话、cron 和心跳之间的关系
summary: 用于跟踪 ACP 运行、子智能体、隔离的 cron 作业和 CLI 操作的后台任务
title: 后台任务
x-i18n:
    generated_at: "2026-04-20T18:24:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5511b1c421bdf505fc7d34f09e453ac44e85213fcb0f082078fa957aa91fe7
    source_path: automation/tasks.md
    workflow: 15
---

# 后台任务

> **在找调度功能？** 请参阅 [Automation & Tasks](/zh-CN/automation) 以选择合适的机制。本页介绍的是如何**跟踪**后台工作，而不是如何调度它。

后台任务用于跟踪**在你的主会话之外**运行的工作：
ACP 运行、子智能体生成、隔离的 cron 作业执行，以及由 CLI 发起的操作。

任务**不会**替代会话、cron 作业或心跳——它们是记录已分离工作发生了什么、何时发生以及是否成功的**活动账本**。

<Note>
并非每次智能体运行都会创建任务。心跳轮次和普通交互式聊天不会。所有 cron 执行、ACP 生成、子智能体生成和 CLI 智能体命令都会。
</Note>

## TL;DR

- 任务是**记录**，不是调度器——cron 和心跳决定工作_何时_运行，任务跟踪_发生了什么_。
- ACP、子智能体、所有 cron 作业和 CLI 操作都会创建任务。心跳轮次不会。
- 每个任务都会经历 `queued → running → terminal`（succeeded、failed、timed_out、cancelled 或 lost）。
- 只要 cron 运行时仍拥有该作业，cron 任务就会保持活动状态；基于聊天的 CLI 任务仅在其所属运行上下文仍然活跃时保持活动状态。
- 完成采用推送驱动：已分离工作完成时可以直接通知，或唤醒请求方会话/心跳，因此状态轮询循环通常不是正确方式。
- 隔离的 cron 运行和子智能体完成时，会尽力在最终清理记账前清理其子会话所跟踪的浏览器标签页/进程。
- 隔离的 cron 交付会在后代子智能体工作仍在收尾时抑制过期的中间父级回复，并在后代最终输出先于交付到达时优先使用它。
- 完成通知会直接投递到某个渠道，或排队等待下一次心跳。
- `openclaw tasks list` 显示所有任务；`openclaw tasks audit` 会暴露问题。
- 终态记录会保留 7 天，之后自动清理。

## 快速开始

```bash
# 列出所有任务（最新的在前）
openclaw tasks list

# 按运行时或状态过滤
openclaw tasks list --runtime acp
openclaw tasks list --status running

# 显示特定任务的详细信息（按 ID、run ID 或 session key）
openclaw tasks show <lookup>

# 取消正在运行的任务（终止子会话）
openclaw tasks cancel <lookup>

# 更改任务的通知策略
openclaw tasks notify <lookup> state_changes

# 运行健康审计
openclaw tasks audit

# 预览或应用维护
openclaw tasks maintenance
openclaw tasks maintenance --apply

# 检查 TaskFlow 状态
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## 什么会创建任务

| 来源 | 运行时类型 | 何时创建任务记录 | 默认通知策略 |
| ---------------------- | ------------ | ------------------------------------------------------ | --------------------- |
| ACP 后台运行 | `acp` | 生成子 ACP 会话时 | `done_only` |
| 子智能体编排 | `subagent` | 通过 `sessions_spawn` 生成子智能体时 | `done_only` |
| cron 作业（所有类型） | `cron` | 每次 cron 执行时（主会话和隔离执行均包括） | `silent` |
| CLI 操作 | `cli` | 通过 Gateway 网关运行的 `openclaw agent` 命令 | `silent` |
| 智能体媒体作业 | `cli` | 基于会话的 `video_generate` 运行 | `silent` |

主会话 cron 任务默认使用 `silent` 通知策略——它们会创建用于跟踪的记录，但不会生成通知。隔离的 cron 任务默认也为 `silent`，但由于它们在自己的会话中运行，因此更容易被看到。

基于会话的 `video_generate` 运行同样使用 `silent` 通知策略。它们仍会创建任务记录，但完成结果会作为内部唤醒交还给原始智能体会话，以便智能体自己编写后续消息并附上生成完成的视频。如果你启用了 `tools.media.asyncCompletion.directSend`，异步 `music_generate` 和 `video_generate` 完成时会先尝试直接向渠道投递，失败后再回退到唤醒请求方会话的路径。

当某个基于会话的 `video_generate` 任务仍在活动时，该工具还会充当一道保护措施：在同一会话中重复调用 `video_generate` 会返回活动任务状态，而不是启动第二个并发生成任务。当你希望从智能体侧显式查询进度/状态时，请使用 `action: "status"`。

**不会创建任务的情况：**

- 心跳轮次——主会话；请参阅 [Heartbeat](/zh-CN/gateway/heartbeat)
- 普通交互式聊天轮次
- 直接 `/command` 响应

## 任务生命周期

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running : agent starts
    running --> succeeded : completes ok
    running --> failed : error
    running --> timed_out : timeout exceeded
    running --> cancelled : operator cancels
    queued --> lost : session gone > 5 min
    running --> lost : session gone > 5 min
```

| 状态 | 含义 |
| ----------- | -------------------------------------------------------------------------- |
| `queued` | 已创建，等待智能体启动 |
| `running` | 智能体轮次正在积极执行 |
| `succeeded` | 已成功完成 |
| `failed` | 因错误而结束 |
| `timed_out` | 超出配置的超时时间 |
| `cancelled` | 由操作员通过 `openclaw tasks cancel` 停止 |
| `lost` | 在 5 分钟宽限期后，运行时丢失了权威的后备状态 |

状态转换会自动发生——当关联的智能体运行结束时，任务状态会更新为匹配的结果。

`lost` 是运行时感知的：

- ACP 任务：后备 ACP 子会话元数据消失。
- 子智能体任务：后备子会话从目标智能体存储中消失。
- cron 任务：cron 运行时不再将该作业视为活动状态。
- CLI 任务：隔离的子会话任务使用子会话；基于聊天的 CLI 任务则改为使用活动运行上下文，因此残留的渠道/群组/直接会话行不会让它们继续保持活动。

## 交付与通知

当任务进入终态时，OpenClaw 会通知你。有两种交付路径：

**直接交付**——如果任务有渠道目标（`requesterOrigin`），完成消息会直接发送到该渠道（Telegram、Discord、Slack 等）。对于子智能体完成，OpenClaw 还会在可用时保留已绑定的线程/话题路由，并可在直接交付前尝试从请求方会话的存储路由（`lastChannel` / `lastTo` / `lastAccountId`）中补全缺失的 `to` / account。

**会话排队交付**——如果直接交付失败，或未设置来源，则更新会作为系统事件排入请求方会话，并在下一次心跳时呈现。

<Tip>
任务完成会立即触发一次心跳唤醒，因此你可以快速看到结果——无需等到下一次计划中的心跳 tick。
</Tip>

这意味着常见工作流是基于推送的：只需启动一次已分离工作，然后让运行时在完成时唤醒或通知你。只有在你需要调试、干预或进行显式审计时，才去轮询任务状态。

### 通知策略

控制你会收到多少关于每个任务的信息：

| 策略 | 交付内容 |
| --------------------- | ----------------------------------------------------------------------- |
| `done_only`（默认） | 仅终态（succeeded、failed 等）——**这就是默认值** |
| `state_changes` | 每次状态转换和进度更新 |
| `silent` | 完全不通知 |

在任务运行期间更改策略：

```bash
openclaw tasks notify <lookup> state_changes
```

## CLI 参考

### `tasks list`

```bash
openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
```

输出列：任务 ID、类型、状态、交付、运行 ID、子会话、摘要。

### `tasks show`

```bash
openclaw tasks show <lookup>
```

查找令牌接受任务 ID、运行 ID 或会话键。显示完整记录，包括时间、交付状态、错误和终态摘要。

### `tasks cancel`

```bash
openclaw tasks cancel <lookup>
```

对于 ACP 和子智能体任务，这会终止子会话。对于由 CLI 跟踪的任务，取消操作会记录到任务注册表中（不存在单独的子运行时句柄）。状态会转换为 `cancelled`，并在适用时发送交付通知。

### `tasks notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

### `tasks audit`

```bash
openclaw tasks audit [--json]
```

暴露运行问题。检测到问题时，结果也会出现在 `openclaw status` 中。

| 发现项 | 严重级别 | 触发条件 |
| ------------------------- | -------- | ----------------------------------------------------- |
| `stale_queued` | warn | 排队超过 10 分钟 |
| `stale_running` | error | 运行超过 30 分钟 |
| `lost` | error | 运行时支撑的任务归属已消失 |
| `delivery_failed` | warn | 交付失败且通知策略不是 `silent` |
| `missing_cleanup` | warn | 终态任务没有清理时间戳 |
| `inconsistent_timestamps` | warn | 时间线冲突（例如结束时间早于开始时间） |

### `tasks maintenance`

```bash
openclaw tasks maintenance [--json]
openclaw tasks maintenance --apply [--json]
```

使用它来预览或应用针对任务和 Task Flow 状态的对账、清理标记和修剪。

对账是运行时感知的：

- ACP/子智能体任务会检查其后备子会话。
- cron 任务会检查 cron 运行时是否仍拥有该作业。
- 基于聊天的 CLI 任务会检查所属的活动运行上下文，而不只是聊天会话行。

完成清理同样是运行时感知的：

- 子智能体完成时，会尽力在宣布清理继续之前关闭该子会话所跟踪的浏览器标签页/进程。
- 隔离的 cron 完成时，会尽力在该运行彻底拆除前关闭该 cron 会话所跟踪的浏览器标签页/进程。
- 隔离的 cron 交付会在需要时等待后代子智能体的后续工作完成，并抑制过期的父级确认文本，而不是直接宣布它。
- 子智能体完成交付会优先使用最新的可见 assistant 文本；如果为空，则回退到已净化的最新 tool/toolResult 文本，而仅包含超时工具调用的运行可收缩为简短的部分进度摘要。
- 清理失败不会掩盖真实的任务结果。

### `tasks flow list|show|cancel`

```bash
openclaw tasks flow list [--status <status>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

当你关心的是编排中的 Task Flow，而不是某一条单独的后台任务记录时，请使用这些命令。

## 聊天任务看板（`/tasks`）

在任何聊天会话中使用 `/tasks` 可查看链接到该会话的后台任务。看板会显示活动中和最近完成的任务，包括运行时、状态、时间，以及进度或错误详情。

当当前会话没有可见的关联任务时，`/tasks` 会回退为显示智能体本地任务计数，这样你仍能获得概览，同时不会泄露其他会话的详细信息。

如需查看完整的操作员账本，请使用 CLI：`openclaw tasks list`。

## 状态集成（任务压力）

`openclaw status` 包含一个可快速浏览的任务摘要：

```
Tasks: 3 queued · 2 running · 1 issues
```

该摘要报告：

- **active** — `queued` + `running` 的数量
- **failures** — `failed` + `timed_out` + `lost` 的数量
- **byRuntime** — 按 `acp`、`subagent`、`cron`、`cli` 分类的明细

`/status` 和 `session_status` 工具都使用具备清理感知能力的任务快照：优先显示活动任务，隐藏陈旧的已完成记录，且仅在没有活动工作残留时才显示最近失败项。这让状态卡片聚焦于当前真正重要的内容。

## 存储与维护

### 任务存储位置

任务记录会持久化到 SQLite，位置如下：

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

注册表会在 Gateway 网关启动时加载到内存中，并将写入同步到 SQLite，以确保重启后仍具备持久性。

### 自动维护

清理器每 **60 秒** 运行一次，并处理三件事：

1. **对账** — 检查活动任务是否仍有权威运行时后备状态。ACP/子智能体任务使用子会话状态，cron 任务使用活动作业归属状态，基于聊天的 CLI 任务使用其所属运行上下文。如果该后备状态消失超过 5 分钟，任务会被标记为 `lost`。
2. **清理标记** — 为终态任务设置 `cleanupAfter` 时间戳（`endedAt + 7 days`）。
3. **修剪** — 删除超过其 `cleanupAfter` 日期的记录。

**保留期**：终态任务记录会保留 **7 天**，之后自动修剪。无需任何配置。

## 任务与其他系统的关系

### 任务与 Task Flow

[Task Flow](/zh-CN/automation/taskflow) 是位于后台任务之上的流程编排层。单个 flow 在其生命周期内可能通过托管或镜像同步模式协调多个任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查编排 flow。

详情请参阅 [Task Flow](/zh-CN/automation/taskflow)。

### 任务与 cron

cron 作业的**定义**位于 `~/.openclaw/cron/jobs.json`；运行时执行状态则位于同目录旁边的 `~/.openclaw/cron/jobs-state.json`。**每一次** cron 执行都会创建一条任务记录——无论是主会话还是隔离执行。主会话 cron 任务默认使用 `silent` 通知策略，因此它们会被跟踪，但不会生成通知。

请参阅 [Cron Jobs](/zh-CN/automation/cron-jobs)。

### 任务与心跳

心跳运行属于主会话轮次——它们不会创建任务记录。任务完成时，它可以触发一次心跳唤醒，让你及时看到结果。

请参阅 [Heartbeat](/zh-CN/gateway/heartbeat)。

### 任务与会话

任务可能会引用 `childSessionKey`（工作运行的位置）和 `requesterSessionKey`（发起者）。会话是对话上下文；任务是在其之上的活动跟踪层。

### 任务与智能体运行

任务的 `runId` 会链接到执行该工作的智能体运行。智能体生命周期事件（开始、结束、错误）会自动更新任务状态——你无需手动管理生命周期。

## 相关内容

- [Automation & Tasks](/zh-CN/automation) — 一览所有自动化机制
- [Task Flow](/zh-CN/automation/taskflow) — 位于任务之上的流程编排
- [Scheduled Tasks](/zh-CN/automation/cron-jobs) — 调度后台工作
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话轮次
- [CLI: Tasks](/cli/index#tasks) — CLI 命令参考
