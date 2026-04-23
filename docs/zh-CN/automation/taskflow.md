---
read_when:
    - 你想了解 Task Flow 与后台任务之间的关系
    - 你在发布说明或文档中遇到了 Task Flow 或 openclaw tasks flow
    - 你想检查或管理持久化的 flow 状态
summary: 任务流是位于后台任务之上的 flow 编排层
title: 任务流
x-i18n:
    generated_at: "2026-04-23T05:40:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# 任务流

任务流是位于 [后台任务](/zh-CN/automation/tasks) 之上的 flow 编排基础层。它管理具有自身状态、修订跟踪和同步语义的持久化多步骤 flow，而单个任务仍然是分离工作的基本单位。

## 何时使用任务流

当工作跨越多个顺序或分支步骤，并且你需要在 Gateway 网关重启后仍能持续跟踪进度时，请使用任务流。对于单个后台操作，普通的 [任务](/zh-CN/automation/tasks) 就已足够。

| 场景 | 使用方式 |
| ------------------------------------- | -------------------- |
| 单个后台作业 | 普通任务 |
| 多步骤流水线（A 然后 B 然后 C） | 任务流（托管） |
| 观察外部创建的任务 | 任务流（镜像） |
| 一次性提醒 | Cron 作业 |

## 同步模式

### 托管模式

任务流端到端拥有整个生命周期。它将任务创建为 flow 步骤，驱动它们完成，并自动推进 flow 状态。

示例：一个每周报告 flow，执行以下步骤：(1) 收集数据，(2) 生成报告，以及 (3) 发送报告。任务流会将每个步骤创建为后台任务，等待完成，然后移动到下一个步骤。

```text
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 镜像模式

任务流会观察外部创建的任务，并在不接管任务创建所有权的情况下保持 flow 状态同步。当任务来自 Cron 作业、CLI 命令或其他来源，而你希望以 flow 的形式统一查看其进度时，这种方式非常有用。

示例：三个彼此独立的 Cron 作业，共同组成一个“晨间运维”流程。镜像 flow 会跟踪它们的整体进度，而不控制它们何时或如何运行。

## 持久化状态和修订跟踪

每个 flow 都会持久化自己的状态并跟踪修订，因此在 Gateway 网关重启后进度仍然会保留。修订跟踪支持在多个来源尝试并发推进同一个 flow 时进行冲突检测。

## 取消行为

`openclaw tasks flow cancel` 会在 flow 上设置粘性的取消意图。flow 中的活动任务会被取消，并且不会启动任何新步骤。取消意图会在重启后保留，因此即使 Gateway 网关在所有子任务终止之前重启，被取消的 flow 仍会保持为已取消状态。

## CLI 命令

```bash
# 列出活动和最近的 flow
openclaw tasks flow list

# 显示特定 flow 的详细信息
openclaw tasks flow show <lookup>

# 取消一个正在运行的 flow 及其活动任务
openclaw tasks flow cancel <lookup>
```

| 命令 | 说明 |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list` | 显示已跟踪的 flow，包括状态和同步模式 |
| `openclaw tasks flow show <id>` | 按 flow id 或查找键检查单个 flow |
| `openclaw tasks flow cancel <id>` | 取消一个正在运行的 flow 及其活动任务 |

## flow 与任务的关系

flow 负责协调任务，而不是取代任务。一个 flow 在其整个生命周期中可能会驱动多个后台任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查编排这些任务的 flow。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) — flow 协调的分离工作账本
- [CLI：任务](/cli/tasks) — `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/zh-CN/automation) — 一览所有自动化机制
- [Cron 作业](/zh-CN/automation/cron-jobs) — 可能输入到 flow 中的计划作业
