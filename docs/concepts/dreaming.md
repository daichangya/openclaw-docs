---
read_when:
    - 你希望记忆提升自动运行
    - 你想了解每个 Dreaming 阶段的作用
    - 你想在不污染 `MEMORY.md` 的情况下调优整合过程
sidebarTitle: Dreaming
summary: 通过轻度、深度和 REM 阶段进行后台记忆整合，并配有 Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:10:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming 是 `memory-core` 中的后台记忆整合系统。它帮助 OpenClaw 将强烈的短期信号转移到持久记忆中，同时让整个过程保持可解释且可审查。

<Note>
Dreaming 是**选择启用**功能，默认处于禁用状态。
</Note>

## Dreaming 会写入什么

Dreaming 会保留两类输出：

- `memory/.dreams/` 中的**机器状态**（回忆存储、阶段信号、摄取检查点、锁）。
- `DREAMS.md`（或已有的 `dreams.md`）中的**人类可读输出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下可选的阶段报告文件。

长期提升仍然只会写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段 | 目的 | 持久写入 |
| ----- | ----------------------------------------- | ----------------- |
| 轻度 | 对近期短期材料进行分类和暂存 | 否 |
| 深度 | 对持久候选进行评分和提升 | 是（`MEMORY.md`） |
| REM | 反思主题和反复出现的想法 | 否 |

这些阶段是内部实现细节，而不是供用户单独配置的“模式”。

<AccordionGroup>
  <Accordion title="轻度阶段">
    轻度阶段会摄取近期的每日记忆信号和回忆轨迹，对其去重，并暂存候选条目。

    - 从短期回忆状态、近期每日记忆文件，以及可用时经过脱敏处理的会话转录中读取。
    - 当存储包含内联输出时，会写入一个受管控的 `## Light Sleep` 区块。
    - 为后续深度排序记录强化信号。
    - 绝不会写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="深度阶段">
    深度阶段决定哪些内容会成为长期记忆。

    - 使用加权评分和阈值门槛对候选进行排序。
    - 要求通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 写入前会从实时每日文件中重新提取片段，因此陈旧或已删除的片段会被跳过。
    - 将提升后的条目追加到 `MEMORY.md`。
    - 将 `## Deep Sleep` 摘要写入 `DREAMS.md`，并可选写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM 阶段">
    REM 阶段会提取模式和反思信号。

    - 从近期短期轨迹中构建主题和反思摘要。
    - 当存储包含内联输出时，会写入一个受管控的 `## REM Sleep` 区块。
    - 记录供深度排序使用的 REM 强化信号。
    - 绝不会写入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 会话转录摄取

Dreaming 可以将经过脱敏处理的会话转录摄取到 Dreaming 语料中。当转录可用时，它们会与每日记忆信号和回忆轨迹一起输入轻度阶段。个人内容和敏感内容会在摄取前进行脱敏处理。

## Dream Diary

Dreaming 还会在 `DREAMS.md` 中保留一份叙述性的 **Dream Diary**。在每个阶段积累了足够材料后，`memory-core` 会尽力运行一次后台子智能体轮次（使用默认运行时模型），并追加一条简短的日记条目。

<Note>
这份日记用于人类在 Dreams UI 中阅读，而不是提升来源。由 Dreaming 生成的日记/报告产物会被排除在短期提升之外。只有有依据的记忆片段才有资格被提升到 `MEMORY.md` 中。
</Note>

还有一条基于事实的历史回填通道，用于审查和恢复工作：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 预览来自历史 `YYYY-MM-DD.md` 笔记的有依据日记输出。
    - `memory rem-backfill --path ...` 将可回滚的有依据日记条目写入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 将有依据的持久候选暂存到与普通深度阶段已使用的相同短期证据存储中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 会移除这些已暂存的回填产物，而不会触碰普通日记条目或实时短期回忆。

  </Accordion>
</AccordionGroup>

Control UI 公开了相同的日记回填/重置流程，因此你可以先在 Dreams 场景中检查结果，再决定这些有依据的候选是否值得提升。该场景还会显示一条独立的有依据通道，方便你查看哪些暂存的短期条目来自历史重放、哪些已提升条目由 grounded 流程引导，并且只清除仅 grounded 的暂存条目，而不影响普通实时短期状态。

## 深度排序信号

深度排序使用六个加权基础信号以及阶段强化：

| 信号 | 权重 | 描述 |
| ------------------- | ------ | ------------------------------------------------- |
| 频率 | 0.24 | 条目累积了多少短期信号 |
| 相关性 | 0.30 | 条目的平均检索质量 |
| 查询多样性 | 0.15 | 使其出现的不同查询/日期上下文 |
| 近期性 | 0.15 | 带时间衰减的时新度评分 |
| 整合度 | 0.10 | 跨日重复出现的强度 |
| 概念丰富度 | 0.06 | 来自片段/路径的概念标签密度 |

轻度和 REM 阶段命中会从 `memory/.dreams/phase-signals.json` 中增加一个小幅的近期性衰减加成。

## 调度

启用后，`memory-core` 会自动管理一个用于完整 Dreaming 扫描的 cron 任务。每次扫描都会按顺序运行各阶段：轻度 → REM → 深度。

默认频率行为：

| 设置 | 默认值 |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## 快速开始

<Tabs>
  <Tab title="启用 Dreaming">
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
  </Tab>
  <Tab title="自定义扫描频率">
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
  </Tab>
</Tabs>

## 斜杠命令

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI 工作流

<Tabs>
  <Tab title="提升预览 / 应用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手动执行 `memory promote` 默认使用深度阶段阈值，除非通过 CLI 标志覆盖。

  </Tab>
  <Tab title="解释提升">
    解释为什么某个特定候选会或不会被提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness 预览">
    预览 REM 反思、候选事实和深度提升输出，而不写入任何内容：

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 关键默认值

所有设置都位于 `plugins.entries.memory-core.config.dreaming` 下。

<ParamField path="enabled" type="boolean" default="false">
  启用或禁用 Dreaming 扫描。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完整 Dreaming 扫描的 cron 频率。
</ParamField>

<Note>
阶段策略、阈值和存储行为都属于内部实现细节（不是面向用户的配置）。完整键名列表请参见 [记忆配置参考](/zh-CN/reference/memory-config#dreaming)。
</Note>

## Dreams UI

启用后，Gateway 网关中的 **Dreams** 选项卡会显示：

- 当前 Dreaming 启用状态
- 阶段级 Status 和受管控扫描是否存在
- 短期、有依据、信号和当日已提升数量
- 下次计划运行时间
- 用于暂存历史重放条目的独立有依据场景通道
- 由 `doctor.memory.dreamDiary` 支持的可展开 Dream Diary 阅读器

## 相关内容

- [记忆](/zh-CN/concepts/memory)
- [Memory CLI](/zh-CN/cli/memory)
- [记忆配置参考](/zh-CN/reference/memory-config)
- [记忆搜索](/zh-CN/concepts/memory-search)
