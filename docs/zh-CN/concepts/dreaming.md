---
read_when:
    - 你希望记忆提升能够自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你想在不污染 `MEMORY.md` 的情况下调整整合机制
summary: 通过浅层、深层和 REM 阶段进行后台记忆整合，并配有 Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T06:40:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming 是 `memory-core` 中的后台记忆整合系统。
它帮助 OpenClaw 将强烈的短期信号转移到持久记忆中，同时
让整个过程可解释、可审查。

Dreaming 是**可选启用**功能，默认禁用。

## Dreaming 会写入什么

Dreaming 会保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或已有的 `dreams.md`）中的**人类可读输出**，以及可选的阶段报告文件，位于 `memory/dreaming/<phase>/YYYY-MM-DD.md`。

长期提升仍然只会写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段 | 目的 | 持久写入 |
| ----- | ----- | ----- |
| Light | 对近期短期材料进行整理和暂存 | 否 |
| Deep  | 对持久候选项进行评分和提升 | 是（`MEMORY.md`） |
| REM   | 反思主题和重复出现的想法 | 否 |

这些阶段是内部实现细节，并不是单独供用户配置的“模式”。

### Light 阶段

Light 阶段会摄取近期的每日记忆信号和召回轨迹，对其去重，
并暂存候选行。

- 在可用时，从短期召回状态、近期每日记忆文件以及已脱敏的会话转录中读取。
- 当存储包含内联输出时，写入受管理的 `## Light Sleep` 区块。
- 记录强化信号，供后续 Deep 排序使用。
- 绝不会写入 `MEMORY.md`。

### Deep 阶段

Deep 阶段决定什么会成为长期记忆。

- 使用加权评分和阈值门槛对候选项进行排序。
- 要求通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
- 在写入前，会从实时每日文件中重新提取片段，因此陈旧或已删除的片段会被跳过。
- 将提升后的条目追加到 `MEMORY.md`。
- 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

### REM 阶段

REM 阶段提取模式和反思信号。

- 根据近期短期轨迹构建主题和反思摘要。
- 当存储包含内联输出时，写入受管理的 `## REM Sleep` 区块。
- 记录供 Deep 排序使用的 REM 强化信号。
- 绝不会写入 `MEMORY.md`。

## 会话转录摄取

Dreaming 可以将已脱敏的会话转录摄取到 Dreaming 语料中。当
转录可用时，它们会与每日记忆信号和召回轨迹一起输入到 Light 阶段。个人和敏感内容会在摄取前被脱敏。

## Dream Diary

Dreaming 还会在 `DREAMS.md` 中保留一份叙事性的 **Dream Diary**。
每当某个阶段积累了足够的材料后，`memory-core` 就会运行一次尽力而为的后台
子智能体轮次（使用默认运行时模型），并追加一条简短的日记条目。

这份日记用于人在 Dreams UI 中阅读，而不是作为提升来源。
由 Dreaming 生成的日记/报告产物会被排除在短期
提升之外。只有有据可依的记忆片段才有资格提升到
`MEMORY.md`。

此外，还有一条基于事实依据的历史回填通道，用于审查和恢复工作：

- `memory rem-harness --path ... --grounded` 可从历史 `YYYY-MM-DD.md` 笔记中预览基于事实依据的日记输出。
- `memory rem-backfill --path ...` 会将可回滚的、基于事实依据的日记条目写入 `DREAMS.md`。
- `memory rem-backfill --path ... --stage-short-term` 会将基于事实依据的持久候选项暂存到与常规 Deep 阶段相同的短期证据存储中。
- `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些暂存的回填产物，而不会影响普通日记条目或实时短期召回。

Control UI 也暴露了相同的日记回填/重置流程，因此你可以先在
Dreams 场景中检查结果，再决定这些基于事实依据的候选项
是否值得提升。该场景还会显示一条单独的基于事实依据通道，这样你就可以看到
哪些暂存的短期条目来自历史回放、哪些提升项由 grounded 通道驱动，并且仅清除基于事实依据的暂存条目，而不影响普通实时短期状态。

## Deep 排序信号

Deep 排序使用六个带权重的基础信号，再加上阶段强化：

| 信号 | 权重 | 说明 |
| ------------------- | ------ | ------------------------------------------------- |
| Frequency           | 0.24   | 条目累计了多少短期信号 |
| Relevance           | 0.30   | 条目的平均检索质量 |
| Query diversity     | 0.15   | 使其浮现的不同查询/日期上下文 |
| Recency             | 0.15   | 带时间衰减的新鲜度分数 |
| Consolidation       | 0.10   | 跨日重复出现的强度 |
| Conceptual richness | 0.06   | 来自片段/路径的概念标签密度 |

Light 和 REM 阶段命中会从
`memory/.dreams/phase-signals.json` 中增加一个带轻微时间衰减的提升值。

## 调度

启用后，`memory-core` 会自动管理一个 cron 任务，用于执行完整的 Dreaming
扫描。每次扫描都会按顺序运行各阶段：light -> REM -> deep。

默认调度频率行为：

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

启用 Dreaming 并设置自定义扫描频率：

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

手动执行 `memory promote` 时，默认使用 Deep 阶段阈值，除非通过
CLI 标志进行覆盖。

解释某个特定候选项为何会或不会被提升：

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

在不写入任何内容的情况下，预览 REM 反思、候选事实以及 Deep 提升输出：

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 关键默认值

所有设置都位于 `plugins.entries.memory-core.config.dreaming` 下。

| 键 | 默认值 |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

阶段策略、阈值和存储行为属于内部实现
细节（不是面向用户的配置）。

完整键列表请参见 [记忆配置参考](/zh-CN/reference/memory-config#dreaming)。

## Dreams UI

启用后，Gateway 网关的 **Dreams** 标签页会显示：

- 当前 Dreaming 启用状态
- 阶段级状态和受管理扫描是否存在
- 短期、grounded、信号以及今日已提升计数
- 下次计划运行时间
- 一条单独的 grounded 场景通道，用于显示暂存的历史回放条目
- 一个可展开的 Dream Diary 阅读器，由 `doctor.memory.dreamDiary` 提供支持

## 故障排除

### Dreaming 从不运行（状态显示为 blocked）

受管理的 Dreaming cron 依赖默认智能体的心跳。如果该智能体的心跳没有触发，cron 就会排入一个无人消费的系统事件，而 Dreaming 就会静默不运行。在这种情况下，`openclaw memory status` 和 `/dreaming status` 都会报告 `blocked`，并指出是哪一个智能体的心跳导致了阻塞。

两个常见原因：

- 另一个智能体声明了显式的 `heartbeat:` 区块。当 `agents.list` 中任意条目拥有自己的 `heartbeat` 区块时，只有这些智能体会发送心跳——默认值不再应用于其他所有智能体，因此默认智能体可能会静默。请将心跳设置移动到 `agents.defaults.heartbeat`，或在默认智能体上添加显式的 `heartbeat` 区块。参见 [作用域与优先级](/zh-CN/gateway/heartbeat#scope-and-precedence)。
- `heartbeat.every` 为 `0`、空值或无法解析。cron 没有可用于调度的间隔，因此心跳实际上被禁用了。请将 `every` 设置为正时长，例如 `30m`。参见 [默认值](/zh-CN/gateway/heartbeat#defaults)。

## 相关内容

- [Heartbeat](/zh-CN/gateway/heartbeat)
- [记忆](/zh-CN/concepts/memory)
- [Memory Search](/zh-CN/concepts/memory-search)
- [memory CLI](/zh-CN/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
