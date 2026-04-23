---
read_when:
    - 你想了解内存是如何工作的
    - 你想知道应该写入哪些 memory 文件
summary: OpenClaw 如何在跨会话之间记住内容
title: 内存概览
x-i18n:
    generated_at: "2026-04-23T20:46:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854bdfe47247687fa3ad1cc277dcba27fba37680acaba919c1eafaad16c79278
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw 通过在你的智能体工作区中写入**纯 Markdown 文件**来记住内容。模型只会“记住”那些被保存到磁盘上的内容——不存在隐藏状态。

## 工作原理

你的智能体有三个与 memory 相关的文件：

- **`MEMORY.md`** —— 长期记忆。保存持久事实、偏好和决策。每次私信会话开始时都会加载。
- **`memory/YYYY-MM-DD.md`** —— 每日笔记。用于记录持续上下文和观察内容。今天和昨天的笔记会自动加载。
- **`DREAMS.md`**（可选）—— Dream Diary 和 Dreaming 扫描摘要，供人工审查，其中包括有依据的历史回填条目。

这些文件位于智能体工作区中（默认是 `~/.openclaw/workspace`）。

<Tip>
如果你希望智能体记住某件事，只需直接告诉它：“记住我更喜欢 TypeScript。” 它会将内容写入相应的文件。
</Tip>

## Memory 工具

智能体有两个用于处理 memory 的工具：

- **`memory_search`** —— 使用语义搜索查找相关笔记，即使措辞与原始内容不同也可以找到。
- **`memory_get`** —— 读取指定的 memory 文件或行范围。

这两个工具都由当前激活的 memory 插件提供（默认：`memory-core`）。

## Memory Wiki 配套插件

如果你希望持久 memory 的行为更像一个经过维护的知识库，而不仅仅是原始笔记，请使用内置的 `memory-wiki` 插件。

`memory-wiki` 会将持久知识编译为一个 wiki 仓库，并提供：

- 确定性的页面结构
- 结构化主张与证据
- 矛盾和新鲜度跟踪
- 自动生成的仪表板
- 面向智能体/运行时消费者的编译摘要
- wiki 原生工具，如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不会替代当前激活的 memory 插件。当前激活的 memory 插件仍然负责 recall、提升和 Dreaming。`memory-wiki` 则在其旁边增加一层带有来源信息的知识层。

请参阅 [Memory Wiki](/zh-CN/plugins/memory-wiki)。

## Memory 搜索

当配置了 embedding 提供商时，`memory_search` 会使用**混合搜索**——结合向量相似度（语义含义）与关键词匹配（如 ID 和代码符号等精确术语）。只要你为任意受支持的提供商配置了 API 密钥，它就能开箱即用。

<Info>
OpenClaw 会根据可用的 API 密钥自动检测你的 embedding 提供商。如果你已配置 OpenAI、Gemini、Voyage 或 Mistral 密钥，memory 搜索会自动启用。
</Info>

有关搜索工作方式、调优选项和提供商设置的详细信息，请参阅
[Memory Search](/zh-CN/concepts/memory-search)。

## Memory 后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。开箱即用，支持关键词搜索、向量相似度和混合搜索。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
本地优先的 sidecar，支持重排序、查询扩展，并可为工作区外的目录建立索引。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话 memory，支持用户建模、语义搜索和多智能体感知。需安装插件。
</Card>
</CardGroup>

## 知识 wiki 层

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-CN/plugins/memory-wiki">
将持久 memory 编译为带有来源信息的 wiki 仓库，支持主张、仪表板、bridge 模式以及对 Obsidian 友好的工作流。
</Card>
</CardGroup>

## 自动 memory flush

在[压缩](/zh-CN/concepts/compaction)总结你的对话之前，OpenClaw 会运行一次静默轮次，提醒智能体将重要上下文保存到 memory 文件中。此功能默认启用——你无需进行任何配置。

<Tip>
memory flush 可防止在压缩期间丢失上下文。如果对话中存在尚未写入文件的重要事实，它们会在摘要发生前被自动保存。
</Tip>

## Dreaming

Dreaming 是一种可选的后台 memory 整理过程。它会收集短期信号、为候选项打分，并仅将符合条件的内容提升到长期记忆（`MEMORY.md`）中。

其设计目标是让长期记忆保持高信噪比：

- **选择加入**：默认禁用。
- **定时执行**：启用后，`memory-core` 会自动管理一个循环 cron 作业，用于执行完整的 Dreaming 扫描。
- **阈值控制**：提升必须通过分数、recall 频率和查询多样性门槛。
- **可审查**：阶段摘要和日记条目会写入 `DREAMS.md`，供人工审查。

有关阶段行为、评分信号和 Dream Diary 细节，请参阅
[Dreaming](/zh-CN/concepts/dreaming)。

## 有依据的回填与实时提升

Dreaming 系统现在有两个紧密相关的审查路径：

- **实时 Dreaming** 基于 `memory/.dreams/` 下的短期 Dreaming 存储工作，这是正常深度阶段在决定哪些内容可以进入 `MEMORY.md` 时所使用的数据。
- **有依据的回填** 会将历史 `memory/YYYY-MM-DD.md` 笔记作为独立的每日文件读取，并将结构化审查输出写入 `DREAMS.md`。

当你希望重放旧笔记，并查看系统认为哪些内容具有持久性，而又不想手动编辑 `MEMORY.md` 时，有依据的回填会很有用。

当你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

有依据的持久候选项不会被直接提升。它们会被暂存到正常深度阶段已经使用的同一个短期 Dreaming 存储中。这意味着：

- `DREAMS.md` 仍然是面向人工审查的界面。
- 短期存储仍然是面向机器的排序界面。
- `MEMORY.md` 仍然只会由深度提升写入。

如果你认为这次重放没有价值，可以移除这些暂存产物，而不影响普通日记条目或正常 recall 状态：

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

- [内置 Memory 引擎](/zh-CN/concepts/memory-builtin) —— 默认 SQLite 后端
- [QMD Memory 引擎](/zh-CN/concepts/memory-qmd) —— 高级本地优先 sidecar
- [Honcho Memory](/zh-CN/concepts/memory-honcho) —— AI 原生跨会话 memory
- [Memory Wiki](/zh-CN/plugins/memory-wiki) —— 编译式知识仓库和 wiki 原生工具
- [Memory Search](/zh-CN/concepts/memory-search) —— 搜索流水线、提供商和调优
- [Dreaming](/zh-CN/concepts/dreaming) —— 从短期 recall 到长期记忆的后台提升
- [Memory 配置参考](/zh-CN/reference/memory-config) —— 所有配置项
- [压缩](/zh-CN/concepts/compaction) —— 压缩如何与 memory 交互
