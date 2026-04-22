---
read_when:
    - 你希望记忆提升能够自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你想在不污染 `MEMORY.md` 的情况下调整整合过程
summary: 通过轻度、深度和 REM 阶段进行后台记忆整合，并附带 Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T01:53:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming 是 `memory-core` 中的后台记忆整合系统。
它帮助 OpenClaw 将强烈的短期信号转移到持久记忆中，同时
保持整个过程可解释且可审查。

Dreaming 是**可选启用**的，默认禁用。

## Dreaming 会写入什么

Dreaming 会保留两类输出：

- `memory/.dreams/` 中的**机器状态**（召回存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或现有的 `dreams.md`）中的**人类可读输出**，以及位于 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期提升仍然只会写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协同工作的阶段：

| 阶段 | 目的 | 持久写入 |
| ----- | ----------------------------------------- | ----------------- |
| Light | 整理并暂存近期短期材料 | 否 |
| Deep  | 评分并提升持久候选项 | 是（`MEMORY.md`） |
| REM   | 反思主题和反复出现的想法 | 否 |

这些阶段是内部实现细节，不是单独的用户可配置“模式”。

### Light 阶段

Light 阶段会摄取近期的每日记忆信号和召回轨迹，对其去重，
并暂存候选条目。

- 从短期召回状态、近期每日记忆文件，以及可用时已脱敏的会话转录中读取。
- 当存储包含内联输出时，写入一个受管的 `## Light Sleep` 区块。
- 记录强化信号，供后续 Deep 排名使用。
- 绝不会写入 `MEMORY.md`。

### Deep 阶段

Deep 阶段决定哪些内容会成为长期记忆。

- 使用加权评分和阈值门槛对候选项进行排序。
- 需要通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
- 在写入前会从实时每日文件中重新提取片段，因此过时或已删除的片段会被跳过。
- 将已提升的条目追加到 `MEMORY.md`。
- 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选择写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

### REM 阶段

REM 阶段提取模式和反思信号。

- 根据近期短期轨迹构建主题和反思摘要。
- 当存储包含内联输出时，写入一个受管的 `## REM Sleep` 区块。
- 记录供 Deep 排名使用的 REM 强化信号。
- 绝不会写入 `MEMORY.md`。

## 会话转录摄取

Dreaming 可以将已脱敏的会话转录摄取到 Dreaming 语料中。当
转录可用时，它们会与每日记忆信号和召回轨迹一起被送入 Light 阶段。个人和敏感内容会在摄取前被脱敏。

## Dream Diary

Dreaming 还会在 `DREAMS.md` 中保留一份叙事性的 **Dream Diary**。
当每个阶段积累了足够的材料后，`memory-core` 会尽力运行一次后台
子智能体轮次（使用默认运行时模型），并追加一条简短的日记条目。

这份日记用于在 Dreams UI 中供人阅读，而不是作为提升来源。
由 Dreaming 生成的日记/报告产物会从短期
提升中排除。只有有依据的记忆片段才有资格被提升到
`MEMORY.md` 中。

此外，还有一条有依据的历史回填通道，用于审查和恢复工作：

- `memory rem-harness --path ... --grounded` 可从历史 `YYYY-MM-DD.md` 记录中预览有依据的日记输出。
- `memory rem-backfill --path ...` 会将可逆的、有依据的日记条目写入 `DREAMS.md`。
- `memory rem-backfill --path ... --stage-short-term` 会将有依据的持久候选项暂存到与常规 Deep 阶段已使用的同一短期证据存储中。
- `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些已暂存的回填产物，而不会触及普通日记条目或实时短期召回。

Control UI 也暴露了相同的日记回填/重置流程，这样你就可以先在 Dreams 场景中检查
结果，再决定这些有依据的候选项
是否值得提升。该场景还会显示一条独立的有依据通道，以便你查看
哪些已暂存的短期条目来自历史回放、哪些已提升
项目由 grounded 流程引导，以及只清除仅基于 grounded 的已暂存条目，而不
触及普通的实时短期状态。

## Deep 排名信号

Deep 排名使用六个加权基础信号，再加上阶段强化：

| 信号 | 权重 | 说明 |
| ------------------- | ------ | ------------------------------------------------- |
| 频率 | 0.24   | 该条目累积了多少短期信号 |
| 相关性 | 0.30   | 该条目的平均检索质量 |
| 查询多样性 | 0.15   | 让它浮现出来的不同查询/日期上下文 |
| 近期性 | 0.15   | 基于时间衰减的新鲜度分数 |
| 整合度 | 0.10   | 跨日重复出现的强度 |
| 概念丰富度 | 0.06   | 来自片段/路径的概念标签密度 |

来自 Light 和 REM 阶段的命中会基于
`memory/.dreams/phase-signals.json` 增加一个小幅的、按近期性衰减的提升。

## 调度

启用后，`memory-core` 会自动管理一个用于完整 Dreaming
扫描的 cron 任务。每次扫描会按顺序运行各阶段：light -> REM -> deep。

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

手动 `memory promote` 默认使用 Deep 阶段阈值，除非通过
CLI 标志覆盖。

解释某个特定候选项为什么会或不会被提升：

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

预览 REM 反思、候选事实以及 Deep 提升输出，而不
写入任何内容：

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 关键默认值

所有设置都位于 `plugins.entries.memory-core.config.dreaming` 下。

| 键名 | 默认值 |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

阶段策略、阈值和存储行为都是内部实现
细节（不是面向用户的配置）。

完整键名列表请参见 [记忆配置参考](/zh-CN/reference/memory-config#dreaming)。

## Dreams UI

启用后，Gateway 网关中的 **Dreams** 选项卡会显示：

- 当前 Dreaming 启用状态
- 阶段级状态和受管扫描是否存在
- 短期、有依据、信号以及今日已提升数量
- 下一次计划运行时间
- 用于已暂存历史回放条目的独立 grounded 场景通道
- 由 `doctor.memory.dreamDiary` 提供支持的可展开 Dream Diary 阅读器

## 故障排除

### Dreaming 从不运行（状态显示为 blocked）

受管 Dreaming cron 依赖默认智能体的 heartbeat。如果该智能体的 heartbeat 没有触发，cron 就会排入一个无人消费的系统事件，而 Dreaming 就会静默地不运行。在这种情况下，`openclaw memory status` 和 `/dreaming status` 都会报告 `blocked`，并指出哪个智能体的 heartbeat 是阻塞源。

两个常见原因：

- 另一个智能体声明了显式的 `heartbeat:` 区块。当 `agents.list` 中任一条目拥有自己的 `heartbeat` 区块时，只有那些智能体会发送 heartbeat —— 默认设置将不再应用于所有智能体，因此默认智能体可能会静默。请将 heartbeat 设置移动到 `agents.defaults.heartbeat`，或在默认智能体上添加显式的 `heartbeat` 区块。参见 [作用域与优先级](/zh-CN/gateway/heartbeat#scope-and-precedence)。
- `heartbeat.every` 为 `0`、为空，或无法解析。cron 没有可用于调度的间隔，因此 heartbeat 实际上已被禁用。请将 `every` 设置为一个正时长，例如 `30m`。参见 [默认值](/zh-CN/gateway/heartbeat#defaults)。

## 相关内容

- [Heartbeat](/zh-CN/gateway/heartbeat)
- [记忆](/zh-CN/concepts/memory)
- [Memory Search](/zh-CN/concepts/memory-search)
- [memory CLI](/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
