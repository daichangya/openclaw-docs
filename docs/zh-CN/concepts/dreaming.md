---
read_when:
    - 你希望记忆提升自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你想在不污染 `MEMORY.md` 的情况下调整整合过程
summary: 具有轻度、深度和 REM 阶段外加 Dream Diary 的后台记忆整合
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T20:45:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a2a399259e1ec9db52f761308686c7d6d377fd21528b77a9057fa690802c3db
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming 是 `memory-core` 中的后台记忆整合系统。
它帮助 OpenClaw 将强烈的短期信号转移到持久记忆中，同时保持过程可解释、可审查。

Dreaming 为**选择启用**，默认关闭。

## Dreaming 会写入什么

Dreaming 保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有的 `dreams.md`）中的**人类可读输出**，以及位于 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期提升仍然只写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段 | 用途 | 持久写入 |
| ----- | ----------------------------------------- | ----------------- |
| Light | 整理并暂存最近的短期材料 | 否 |
| Deep  | 对持久候选项进行评分并提升 | 是（`MEMORY.md`） |
| REM   | 反思主题和反复出现的想法 | 否 |

这些阶段是内部实现细节，而不是用户单独配置的“模式”。

### Light 阶段

Light 阶段会摄取最近的每日记忆信号和召回轨迹，对其去重，并暂存候选行。

- 从短期召回状态、最近的每日记忆文件，以及可用时的脱敏会话转录中读取。
- 当存储包含内联输出时，会写入一个受管理的 `## Light Sleep` 区块。
- 为后续 deep 排名记录强化信号。
- 永不写入 `MEMORY.md`。

### Deep 阶段

Deep 阶段决定哪些内容会成为长期记忆。

- 使用加权评分和阈值门槛对候选项排序。
- 要求通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
- 写入前会从实时每日文件中重新提取片段，因此过期/已删除的片段会被跳过。
- 将提升后的条目追加到 `MEMORY.md`。
- 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选择写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

### REM 阶段

REM 阶段提取模式和反思信号。

- 根据最近的短期轨迹构建主题和反思摘要。
- 当存储包含内联输出时，会写入一个受管理的 `## REM Sleep` 区块。
- 记录供 deep 排名使用的 REM 强化信号。
- 永不写入 `MEMORY.md`。

## 会话转录摄取

Dreaming 可以将脱敏后的会话转录摄取到 Dreaming 语料中。当
转录可用时，它们会与每日记忆信号和召回轨迹一起输入到 light 阶段。个人和敏感内容会在摄取前被脱敏。

## Dream Diary

Dreaming 还会在 `DREAMS.md` 中保留一份叙事性的 **Dream Diary**。
每个阶段积累到足够材料后，`memory-core` 会运行一次尽力而为的后台
子智能体轮次（使用默认运行时模型），并追加一条简短的日记条目。

这份日记是供人在 Dreams UI 中阅读的，而不是提升来源。
由 Dreaming 生成的日记/报告工件会被排除在短期
提升之外。只有有依据的记忆片段才有资格被提升到
`MEMORY.md`。

还提供了一个有依据的历史回填通道，用于审查和恢复工作：

- `memory rem-harness --path ... --grounded` 可预览来自历史 `YYYY-MM-DD.md` 记录的有依据日记输出。
- `memory rem-backfill --path ...` 会将可逆的有依据日记条目写入 `DREAMS.md`。
- `memory rem-backfill --path ... --stage-short-term` 会将有依据的持久候选项暂存到与常规 deep 阶段已使用的同一短期证据存储中。
- `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些暂存的回填工件，而不会触碰普通日记条目或实时短期召回。

Control UI 公开了相同的日记回填/重置流程，因此你可以先在 Dreams 场景中检查
结果，再决定这些有依据的候选项是否值得提升。该场景还会显示一条单独的有依据通道，这样你可以看到
哪些暂存的短期条目来自历史重放、哪些已提升项目由有依据流程驱动，并且只清除纯有依据的暂存条目，而不影响普通的实时短期状态。

## Deep 排名信号

Deep 排名使用六个加权基础信号，再加上阶段强化：

| 信号 | 权重 | 描述 |
| ------------------- | ------ | ------------------------------------------------- |
| Frequency | 0.24 | 该条目累积了多少短期信号 |
| Relevance | 0.30 | 该条目的平均检索质量 |
| Query diversity | 0.15 | 使其浮现的不同查询/日期上下文 |
| Recency | 0.15 | 带时间衰减的新近度评分 |
| Consolidation | 0.10 | 跨天重复出现的强度 |
| Conceptual richness | 0.06 | 来自片段/路径的概念标签密度 |

Light 和 REM 阶段命中会根据
`memory/.dreams/phase-signals.json` 增加一个带新近度衰减的小幅提升。

## 调度

启用后，`memory-core` 会自动管理一个 cron 作业，用于执行完整的 Dreaming
扫描。每次扫描会按顺序运行各阶段：light -> REM -> deep。

默认频率行为：

| 设置 | 默认值 |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## 快速开始

启用 Dreaming：

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

使用自定义扫描频率启用 Dreaming：

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## 斜杠命令

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI 工作流

使用 CLI 提升进行预览或手动应用：

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

手动 `memory promote` 默认使用 deep 阶段阈值，除非通过 CLI 标志覆盖。

解释为何某个特定候选项会或不会被提升：

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

在不写入任何内容的情况下，预览 REM 反思、候选事实和 deep 提升输出：

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 关键默认值

所有设置都位于 `plugins.entries.memory-core.config.dreaming` 下。

| 键 | 默认值 |
| ----------- | ----------- |
| `enabled` | `false` |
| `frequency` | `0 3 * * *` |

阶段策略、阈值和存储行为属于内部实现
细节（不是面向用户的配置）。

完整键列表请参见 [Memory configuration reference](/zh-CN/reference/memory-config#dreaming)。

## Dreams UI

启用后，Gateway 网关 **Dreams** 标签页会显示：

- 当前 Dreaming 启用状态
- 阶段级状态和受管理扫描存在情况
- 当天短期、有依据、信号和已提升计数
- 下次计划运行时间
- 一条单独的有依据场景通道，用于显示暂存的历史重放条目
- 由 `doctor.memory.dreamDiary` 支持的可展开 Dream Diary 阅读器

## 故障排除

### Dreaming 从不运行（状态显示为 blocked）

受管理的 Dreaming cron 依赖默认智能体的心跳运行。如果该智能体的心跳未触发，
cron 就会排入一个无人消费的系统事件，Dreaming 也就会静默不运行。在这种情况下，
`openclaw memory status` 和 `/dreaming status` 都会报告 `blocked`，并指明是哪一个智能体的心跳造成了阻塞。

两个常见原因：

- 另一个智能体声明了显式 `heartbeat:` 块。当 `agents.list` 中任一条目拥有自己的 `heartbeat` 块时，只有这些智能体会发送心跳 —— 默认值将不再应用于其他所有智能体，因此默认智能体可能会变得静默。请将心跳设置移到 `agents.defaults.heartbeat`，或在默认智能体上添加一个显式 `heartbeat` 块。请参见 [Scope and precedence](/zh-CN/gateway/heartbeat#scope-and-precedence)。
- `heartbeat.every` 为 `0`、空值或无法解析。cron 没有可供调度的时间间隔，因此心跳实际上被禁用了。请将 `every` 设置为正持续时间，例如 `30m`。请参见 [Defaults](/zh-CN/gateway/heartbeat#defaults)。

## 相关内容

- [Heartbeat](/zh-CN/gateway/heartbeat)
- [Memory](/zh-CN/concepts/memory)
- [Memory Search](/zh-CN/concepts/memory-search)
- [memory CLI](/zh-CN/cli/memory)
- [Memory configuration reference](/zh-CN/reference/memory-config)
