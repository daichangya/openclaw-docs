---
read_when:
    - 你想了解记忆是如何工作的
    - 你想知道应该写入哪些记忆文件
summary: OpenClaw 如何跨会话记住内容
title: 记忆概览
x-i18n:
    generated_at: "2026-04-23T22:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw 通过在你的智能体工作区中写入 **纯 Markdown 文件** 来记住内容。模型只会“记住”那些已保存到磁盘的内容——不存在隐藏状态。

## 工作原理

你的智能体有三个与记忆相关的文件：

- **`MEMORY.md`** —— 长期记忆。用于保存持久的事实、偏好和决策。每次私信会话开始时都会加载。
- **`memory/YYYY-MM-DD.md`** —— 每日笔记。用于记录持续中的上下文和观察内容。今天和昨天的笔记会自动加载。
- **`DREAMS.md`**（可选）—— Dream Diary 和 dreaming sweep 摘要，供人工审阅，包括有依据的历史回填条目。

这些文件位于智能体工作区中（默认是 `~/.openclaw/workspace`）。

<Tip>
如果你希望你的智能体记住某件事，只需直接告诉它：“记住我更喜欢 TypeScript。” 它会把内容写入合适的文件。
</Tip>

## 记忆工具

智能体有两个用于处理记忆的工具：

- **`memory_search`** —— 使用语义搜索查找相关笔记，即使措辞与原文不同也能找到。
- **`memory_get`** —— 读取特定记忆文件或某个行范围。

这两个工具都由当前激活的记忆插件提供（默认：`memory-core`）。

## Memory Wiki 配套插件

如果你希望持久记忆更像一个被维护的知识库，而不仅仅是原始笔记，请使用内置的 `memory-wiki` 插件。

`memory-wiki` 会将持久知识编译为一个 wiki 资料库，具备：

- 确定性的页面结构
- 结构化的断言和证据
- 矛盾与时效性跟踪
- 自动生成的仪表板
- 面向智能体/运行时消费者的编译摘要
- wiki 原生工具，如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不会替代当前激活的记忆插件。当前激活的记忆插件仍然负责回忆、提升和 Dreaming。`memory-wiki` 只是在其旁边增加了一层具有丰富来源信息的知识层。

参见 [Memory Wiki](/zh-CN/plugins/memory-wiki)。

## 记忆搜索

当配置了 embedding 提供商后，`memory_search` 会使用 **混合搜索**——将向量相似度（语义含义）与关键词匹配（如 ID 和代码符号等精确术语）结合起来。一旦你为任意受支持的提供商配置了 API key，它就可以开箱即用。

<Info>
OpenClaw 会根据可用的 API key 自动检测你的 embedding 提供商。如果你已配置 OpenAI、Gemini、Voyage 或 Mistral 的 key，记忆搜索会自动启用。
</Info>

有关搜索工作方式、调优选项和提供商设置的详细信息，请参见
[记忆搜索](/zh-CN/concepts/memory-search)。

## 记忆后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。开箱即用，支持关键词搜索、向量相似度和混合搜索。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
本地优先的 sidecar，支持重排序、查询扩展，以及索引工作区外目录的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话记忆，支持用户建模、语义搜索和多智能体感知。需安装插件。
</Card>
</CardGroup>

## 知识 wiki 层

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-CN/plugins/memory-wiki">
将持久记忆编译为一个具有丰富来源信息的 wiki 资料库，支持断言、仪表板、桥接模式以及对 Obsidian 友好的工作流。
</Card>
</CardGroup>

## 自动记忆刷新

在 [压缩](/zh-CN/concepts/compaction) 对你的对话进行摘要之前，OpenClaw 会运行一个静默轮次，提醒智能体将重要上下文保存到记忆文件中。此功能默认开启——你无需进行任何配置。

<Tip>
记忆刷新可以防止在压缩期间丢失上下文。如果你的智能体在对话中包含尚未写入文件的重要事实，这些内容会在摘要发生前自动保存。
</Tip>

## Dreaming

Dreaming 是一种可选的后台记忆整合过程。它会收集短期信号、为候选项打分，并仅将符合条件的条目提升到长期记忆（`MEMORY.md`）中。

它旨在让长期记忆保持高信噪比：

- **选择启用**：默认关闭。
- **定时执行**：启用后，`memory-core` 会自动管理一个循环 cron 作业，用于执行完整的 dreaming sweep。
- **阈值控制**：提升必须通过分数、回忆频率和查询多样性门槛。
- **可审阅**：阶段摘要和日记条目会写入 `DREAMS.md`，供人工审阅。

有关阶段行为、评分信号和 Dream Diary 详情，请参见
[Dreaming](/zh-CN/concepts/dreaming)。

## 有依据的回填与实时提升

dreaming 系统现在有两个紧密相关的审阅通道：

- **实时 dreaming** 使用位于 `memory/.dreams/` 下的短期 dreaming 存储，这是正常深度阶段在决定哪些内容可以晋升到 `MEMORY.md` 时所使用的数据源。
- **有依据的回填** 会把历史 `memory/YYYY-MM-DD.md` 笔记作为独立的每日文件读取，并将结构化审阅输出写入 `DREAMS.md`。

如果你希望重放旧笔记，并查看系统认为什么内容是持久的，而无需手动编辑 `MEMORY.md`，那么有依据的回填会非常有用。

当你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

时，这些有依据的持久候选项不会被直接提升。它们会被暂存到正常深度阶段已经在使用的同一个短期 dreaming 存储中。这意味着：

- `DREAMS.md` 仍然是供人工审阅的界面。
- 短期存储仍然是面向机器的排序界面。
- `MEMORY.md` 仍然只会通过深度提升来写入。

如果你认为这次重放没有价值，可以删除这些暂存产物，而不影响普通日记条目或正常回忆状态：

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # 检查索引状态和提供商
openclaw memory search "query"  # 从命令行搜索
openclaw memory index --force   # 重建索引
```

## 延伸阅读

- [内置记忆引擎](/zh-CN/concepts/memory-builtin) —— 默认 SQLite 后端
- [QMD 记忆引擎](/zh-CN/concepts/memory-qmd) —— 高级本地优先 sidecar
- [Honcho 记忆](/zh-CN/concepts/memory-honcho) —— AI 原生跨会话记忆
- [Memory Wiki](/zh-CN/plugins/memory-wiki) —— 编译型知识资料库和 wiki 原生工具
- [记忆搜索](/zh-CN/concepts/memory-search) —— 搜索流水线、提供商和调优
- [Dreaming](/zh-CN/concepts/dreaming) —— 从短期回忆到长期记忆的后台提升
- [记忆配置参考](/zh-CN/reference/memory-config) —— 所有配置项
- [压缩](/zh-CN/concepts/compaction) —— 压缩如何与记忆交互

## 相关内容

- [主动记忆](/zh-CN/concepts/active-memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)
