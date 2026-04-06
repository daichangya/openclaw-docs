---
read_when:
    - 你希望记忆提升自动运行
    - 你希望了解每个 dreaming 阶段的作用
    - 你希望调整巩固过程而不污染 `MEMORY.md`
summary: 包含浅度、深度和 REM 阶段以及 Dream Diary 的后台记忆巩固
title: Dreaming（实验性）
x-i18n:
    generated_at: "2026-04-06T00:33:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: f27da718176bebf59fe8a80fddd4fb5b6d814ac5647f6c1e8344bcfb328db9de
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming（实验性）

Dreaming 是 `memory-core` 中的后台记忆巩固系统。
它帮助 OpenClaw 将强烈的短期信号转移到持久记忆中，同时
让整个过程保持可解释且可审查。

Dreaming 是**可选启用**功能，默认禁用。

## Dreaming 会写入什么

Dreaming 会保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有的 `dreams.md`）中的**人类可读输出**，以及位于 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期提升仍然只会写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段 | 目的 | 持久化写入 |
| ----- | ----------------------------------------- | ----------------- |
| 浅度 | 对近期短期材料进行整理和暂存 | 否 |
| 深度  | 对持久候选项进行评分和提升 | 是（`MEMORY.md`） |
| REM   | 反思主题和反复出现的想法 | 否 |

这些阶段属于内部实现细节，而不是用户可单独配置的“模式”。

### 浅度阶段

浅度阶段会摄取最近的每日记忆信号和召回轨迹，对其去重，
并暂存候选条目。

- 从短期召回状态和最近的每日记忆文件中读取。
- 当存储包含内联输出时，会写入一个受管的 `## Light Sleep` 块。
- 记录强化信号，供后续深度排序使用。
- 绝不会写入 `MEMORY.md`。

### 深度阶段

深度阶段决定哪些内容会成为长期记忆。

- 使用加权评分和阈值门槛对候选项进行排序。
- 要求 `minScore`、`minRecallCount` 和 `minUniqueQueries` 均通过。
- 在写入前会从实时每日文件中重新提取片段，因此陈旧或已删除的片段会被跳过。
- 将提升后的条目追加到 `MEMORY.md`。
- 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

### REM 阶段

REM 阶段会提取模式和反思信号。

- 根据最近的短期轨迹构建主题和反思摘要。
- 当存储包含内联输出时，会写入一个受管的 `## REM Sleep` 块。
- 记录供深度排序使用的 REM 强化信号。
- 绝不会写入 `MEMORY.md`。

## Dream Diary

Dreaming 还会在 `DREAMS.md` 中保留一份叙事性的 **Dream Diary**。
当每个阶段积累了足够的材料后，`memory-core` 会尽力在后台运行一次
子智能体轮次（使用默认运行时模型），并追加一条简短的日记条目。

这份日记仅供人在 Dreams UI 中阅读，不作为提升来源。

## 深度排序信号

深度排序使用六个带权重的基础信号，以及阶段强化信号：

| 信号 | 权重 | 说明 |
| ------------------- | ------ | ------------------------------------------------- |
| 频率 | 0.24   | 该条目累积了多少短期信号 |
| 相关性 | 0.30   | 该条目的平均检索质量 |
| 查询多样性 | 0.15   | 让它浮现出来的不同查询/日期上下文 |
| 时效性 | 0.15   | 随时间衰减的新鲜度分数 |
| 巩固度 | 0.10   | 跨多日重复出现的强度 |
| 概念丰富度 | 0.06   | 来自片段/路径的概念标签密度 |

浅度和 REM 阶段命中会从
`memory/.dreams/phase-signals.json` 中增加一个随时效衰减的小幅加成。

## 调度

启用后，`memory-core` 会自动管理一个 cron 任务，用于执行完整的 dreaming
扫描。每次扫描会按顺序运行各阶段：light -> REM -> deep。

默认频率行为：

| 设置 | 默认值 |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## 快速开始

启用 dreaming：

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

使用自定义扫描频率启用 dreaming：

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

手动 `memory promote` 默认使用深度阶段阈值，除非通过
CLI 标志覆盖。

## 关键默认值

所有设置都位于 `plugins.entries.memory-core.config.dreaming` 下。

| 键名 | 默认值 |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

阶段策略、阈值和存储行为属于内部实现细节
（不是面向用户的配置）。

完整键名列表请参见[记忆配置参考](/zh-CN/reference/memory-config#dreaming-experimental)。

## Dreams UI

启用后，Gateway 网关的 **Dreams** 标签页会显示：

- 当前 dreaming 启用状态
- 阶段级状态和受管扫描是否存在
- 短期、长期和今日已提升数量
- 下一次计划运行时间
- 由 `doctor.memory.dreamDiary` 支持的可展开 Dream Diary 阅读器

## 相关内容

- [记忆](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [memory CLI](/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
