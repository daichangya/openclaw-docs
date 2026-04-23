---
read_when:
    - 你想了解任务流与后台任务之间的关系
    - 你在发布说明或文档中遇到 Task Flow 或 openclaw tasks flow
    - 你想检查或管理持久化流状态
summary: Task Flow：位于后台任务之上的流编排层
title: 任务流
x-i18n:
    generated_at: "2026-04-23T20:40:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90286fb783db5417ab5e781377a85be76cd3f9e9b32da57558c2d8f02b813dba
    source_path: automation/taskflow.md
    workflow: 15
---

Task Flow 是位于 [后台任务](/zh-CN/automation/tasks) 之上的流编排底层。它管理具备自身状态、修订跟踪和同步语义的持久化多步骤流，而单个任务仍然是分离式工作的基本单元。

## 何时使用 Task Flow

当工作跨越多个顺序或分支步骤，并且你需要在 Gateway 网关重启后仍能持续跟踪进度时，请使用 Task Flow。对于单个后台操作，普通的 [任务](/zh-CN/automation/tasks) 就已足够。

| 场景                                  | 使用方式             |
| ------------------------------------- | -------------------- |
| 单个后台作业                          | 普通任务             |
| 多步骤流水线（A 然后 B 然后 C）       | Task Flow（托管）    |
| 观察外部创建的任务                    | Task Flow（镜像）    |
| 一次性提醒                            | Cron 作业            |

## 同步模式

### 托管模式

Task Flow 端到端拥有整个生命周期。它将任务创建为流步骤，驱动它们完成，并自动推进流状态。

示例：每周报告流依次执行：(1) 收集数据，(2) 生成报告，(3) 发送报告。Task Flow 将每个步骤创建为后台任务，等待其完成，然后进入下一步。

```text
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 镜像模式

Task Flow 观察外部创建的任务，并在不接管任务创建的情况下保持流状态同步。当任务来源于 Cron 作业、CLI 命令或其他来源，而你希望以流的形式统一查看它们的进度时，这种方式很有用。

示例：三个彼此独立的 Cron 作业共同构成一个“morning ops”例行流程。镜像流会跟踪它们的整体进度，但不会控制它们何时或如何运行。

## 持久化状态和修订跟踪

每个流都会持久化自身状态并跟踪修订，因此在 Gateway 网关重启后，进度仍然可以保留。修订跟踪还能在多个来源同时尝试推进同一个流时实现冲突检测。

## 取消行为

`openclaw tasks flow cancel` 会在流上设置一个粘性取消意图。流中的活动任务会被取消，并且不会启动任何新步骤。该取消意图会在重启后继续保留，因此即使 Gateway 网关在所有子任务终止前重启，被取消的流也仍会保持为已取消状态。

## CLI 命令

```bash
# 列出活动和最近的流
openclaw tasks flow list

# 显示特定流的详细信息
openclaw tasks flow show <lookup>

# 取消一个正在运行的流及其活动任务
openclaw tasks flow cancel <lookup>
```

| 命令                              | 说明                                  |
| --------------------------------- | ------------------------------------- |
| `openclaw tasks flow list`        | 显示已跟踪流及其状态和同步模式        |
| `openclaw tasks flow show <id>`   | 按流 ID 或查找键检查单个流            |
| `openclaw tasks flow cancel <id>` | 取消一个正在运行的流及其活动任务      |

## 流与任务的关系

流负责协调任务，而不是替代任务。一个流在其生命周期内可能会驱动多个后台任务。使用 `openclaw tasks` 检查各个任务记录，使用 `openclaw tasks flow` 检查执行编排的流。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) — 由流来协调的分离式工作账本
- [CLI：tasks](/zh-CN/cli/tasks) — `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/zh-CN/automation) — 一览所有自动化机制
- [Cron 作业](/zh-CN/automation/cron-jobs) — 可能为流提供输入的计划任务
