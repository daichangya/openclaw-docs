---
read_when:
    - 你希望记忆提升自动运行
    - 你希望了解每个 Dreaming 阶段的作用
    - 你希望在不污染 `MEMORY.md` 的情况下调整巩固过程
summary: 带有浅睡、深睡和 REM 阶段以及 Dream Diary 的后台记忆巩固
title: Dreaming（实验性）
x-i18n:
    generated_at: "2026-04-08T22:26:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26476eddb8260e1554098a6adbb069cf7f5e284cf2e09479c6d9d8f8b93280ef
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming（实验性）

Dreaming 是 `memory-core` 中的后台记忆巩固系统。
它帮助 OpenClaw 将强烈的短期信号转移到持久记忆中，同时
让这个过程保持可解释且可审查。

Dreaming 为**可选启用**，默认禁用。

## Dreaming 会写入什么

Dreaming 会保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有的 `dreams.md`）中的**人类可读输出**，以及位于 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期提升仍然只会写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段 | 目的 | 持久写入 |
| ----- | ----------------------------------------- | ----------------- |
| 浅睡 | 整理并暂存最近的短期材料 | 否 |
| 深睡 | 为持久候选项评分并提升 | 是（`MEMORY.md`） |
| REM | 反思主题和反复出现的想法 | 否 |

这些阶段是内部实现细节，而不是单独的用户可配置“模式”。

### 浅睡阶段

浅睡阶段会摄取近期的每日记忆信号和召回轨迹，对其去重，
并暂存候选条目。

- 从短期召回状态、近期每日记忆文件，以及可用时的脱敏会话转录中读取。
- 当存储包含内联输出时，会写入一个受管理的 `## Light Sleep` 区块。
- 记录强化信号，供后续深睡排序使用。
- 绝不会写入 `MEMORY.md`。

### 深睡阶段

深睡阶段决定哪些内容会成为长期记忆。

- 使用加权评分和阈值门槛对候选项进行排序。
- 要求 `minScore`、`minRecallCount` 和 `minUniqueQueries` 全部通过。
- 在写入前从实时每日文件中重新提取片段，因此会跳过过时或已删除的片段。
- 将提升后的条目追加到 `MEMORY.md`。
- 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

### REM 阶段

REM 阶段提取模式和反思信号。

- 从近期短期轨迹中构建主题和反思摘要。
- 当存储包含内联输出时，会写入一个受管理的 `## REM Sleep` 区块。
- 记录供深睡排序使用的 REM 强化信号。
- 绝不会写入 `MEMORY.md`。

## 会话转录摄取

Dreaming 可以将脱敏后的会话转录摄取到 Dreaming 语料中。当
转录可用时，它们会与每日记忆信号和召回轨迹一起输入到浅睡
阶段。在摄取前，个人和敏感内容会被脱敏。

## Dream Diary

Dreaming 还会在 `DREAMS.md` 中维护一份叙事性的 **Dream Diary**。
每个阶段积累到足够材料后，`memory-core` 会运行一次尽力而为的后台
子智能体轮次（使用默认运行时模型），并追加一条简短的日记条目。

这份日记是供人类在 Dreams UI 中阅读的，不是提升来源。

另外还有一条基于事实的历史回填通道，用于审查和恢复工作：

- `memory rem-harness --path ... --grounded` 可预览基于历史 `YYYY-MM-DD.md` 记录生成的 grounded 日记输出。
- `memory rem-backfill --path ...` 会将可逆的 grounded 日记条目写入 `DREAMS.md`。
- `memory rem-backfill --path ... --stage-short-term` 会将 grounded 的持久候选项暂存到与常规深睡阶段已使用的同一短期证据存储中。
- `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些已暂存的回填产物，而不会影响普通日记条目或实时短期召回。

Control UI 也提供相同的日记回填/重置流程，因此你可以先在
Dreams 场景中检查结果，再决定这些 grounded 候选项是否
值得提升。该场景还会显示一条独立的 grounded 通道，因此你可以看到
哪些暂存的短期条目来自历史重放、哪些提升项由 grounded 流程引导，
并且可以只清除仅 grounded 的暂存条目，而不影响普通的实时短期状态。

## 深睡排序信号

深睡排序使用六个加权基础信号以及阶段强化：

| 信号 | 权重 | 描述 |
| ------------------- | ------ | ------------------------------------------------- |
| 频率 | 0.24 | 该条目积累了多少短期信号 |
| 相关性 | 0.30 | 该条目的平均检索质量 |
| 查询多样性 | 0.15 | 使其浮现的不同查询/日期上下文 |
| 近期性 | 0.15 | 随时间衰减的新鲜度分数 |
| 巩固度 | 0.10 | 跨多日重复出现的强度 |
| 概念丰富度 | 0.06 | 来自片段/路径的概念标签密度 |

浅睡和 REM 阶段命中会从
`memory/.dreams/phase-signals.json` 添加一个随近期性衰减的小幅加成。

## 调度

启用后，`memory-core` 会自动管理一个用于完整 Dreaming
扫描的 cron 任务。每次扫描都会按顺序运行各阶段：light -> REM -> deep。

默认节奏行为：

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

使用 CLI 提升来进行预览或手动应用：

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

手动 `memory promote` 默认使用深睡阶段阈值，除非通过
CLI 标志覆盖。

解释某个特定候选项为什么会或不会被提升：

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

在不写入任何内容的情况下，预览 REM 反思、候选事实以及深睡提升输出：

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

阶段策略、阈值和存储行为都是内部实现
细节（不是面向用户的配置）。

完整键名列表请参见[记忆配置参考](/zh-CN/reference/memory-config#dreaming-experimental)。

## Dreams UI

启用后，Gateway 网关的 **Dreams** 标签页会显示：

- 当前 Dreaming 启用状态
- 阶段级状态和受管理扫描是否存在
- 短期、grounded、信号以及今日已提升数量
- 下次计划运行时间
- 用于暂存历史重放条目的独立 grounded 场景通道
- 由 `doctor.memory.dreamDiary` 支持的可展开 Dream Diary 阅读器

## 相关内容

- [记忆](/zh-CN/concepts/memory)
- [Memory Search](/zh-CN/concepts/memory-search)
- [memory CLI](/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
