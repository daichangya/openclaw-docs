---
read_when:
    - 你想了解内存如何工作
    - 你想知道应写入哪些内存文件
summary: OpenClaw 如何在跨会话中记住内容
title: 内存概览
x-i18n:
    generated_at: "2026-04-06T00:33:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d19d4fa9c4b3232b7a97f7a382311d2a375b562040de15e9fe4a0b1990b825e7
    source_path: concepts/memory.md
    workflow: 15
---

# 内存概览

OpenClaw 通过在你的智能体工作区中写入**纯 Markdown 文件**来记住内容。
模型只会“记住”已保存到磁盘的内容——不存在隐藏状态。

## 工作原理

你的智能体有三个与内存相关的文件：

- **`MEMORY.md`** —— 长期内存。持久保存的事实、偏好和决定。
  会在每个私信会话开始时加载。
- **`memory/YYYY-MM-DD.md`** —— 每日笔记。持续记录的上下文和观察。
  今天和昨天的笔记会自动加载。
- **`DREAMS.md`**（实验性，可选）—— Dream Diary 和 dreaming sweep
  摘要，供人工审阅。

这些文件位于智能体工作区中（默认是 `~/.openclaw/workspace`）。

<Tip>
如果你希望智能体记住某件事，只需直接告诉它：“记住我更喜欢 TypeScript。”
它会将其写入合适的文件。
</Tip>

## 内存工具

智能体有两个用于处理内存的工具：

- **`memory_search`** —— 使用语义搜索查找相关笔记，即使措辞与原文不同也可以找到。
- **`memory_get`** —— 读取特定的内存文件或行范围。

这两个工具都由当前启用的内存插件提供（默认：`memory-core`）。

## 内存搜索

当配置了嵌入提供商后，`memory_search` 会使用**混合搜索**——结合向量相似度（语义含义）与关键词匹配（如 ID 和代码符号等精确术语）。
只要你为任一受支持的提供商配置了 API 密钥，它就能开箱即用。

<Info>
OpenClaw 会根据可用的 API 密钥自动检测你的嵌入提供商。
如果你已配置 OpenAI、Gemini、Voyage 或 Mistral 的密钥，内存搜索会自动启用。
</Info>

有关搜索工作方式、调优选项和提供商设置的详细信息，请参阅
[内存搜索](/zh-CN/concepts/memory-search)。

## 内存后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。开箱即用，支持关键词搜索、向量相似度和混合搜索。
无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
local-first sidecar，支持重排序、查询扩展，并可为工作区外的目录建立索引。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话内存，支持用户建模、语义搜索和多智能体感知。
需要安装插件。
</Card>
</CardGroup>

## 自动内存刷新

在 [压缩](/zh-CN/concepts/compaction) 对你的对话进行总结之前，OpenClaw
会运行一个静默轮次，提醒智能体将重要上下文保存到内存文件中。
此功能默认开启——你无需进行任何配置。

<Tip>
内存刷新可以防止压缩期间丢失上下文。如果你的智能体在对话中有重要事实尚未写入文件，它们会在生成摘要之前自动保存。
</Tip>

## Dreaming（实验性）

Dreaming 是一个可选的后台内存整合过程。它会收集短期信号、为候选项打分，并仅将符合条件的内容提升到长期内存（`MEMORY.md`）中。

它旨在让长期内存保持高信噪比：

- **选择启用**：默认禁用。
- **定时执行**：启用后，`memory-core` 会自动管理一个循环 cron 任务，
  用于执行完整的 dreaming sweep。
- **阈值控制**：提升操作必须通过分数、回忆频率和查询多样性门槛。
- **可审阅**：阶段摘要和日记条目会写入 `DREAMS.md`，
  供人工审阅。

有关阶段行为、评分信号和 Dream Diary 细节，请参阅
[Dreaming（实验性）](/zh-CN/concepts/dreaming)。

## CLI

```bash
openclaw memory status          # 检查索引状态和提供商
openclaw memory search "query"  # 从命令行搜索
openclaw memory index --force   # 重建索引
```

## 延伸阅读

- [内置内存引擎](/zh-CN/concepts/memory-builtin) —— 默认的 SQLite 后端
- [QMD 内存引擎](/zh-CN/concepts/memory-qmd) —— 高级 local-first sidecar
- [Honcho 内存](/zh-CN/concepts/memory-honcho) —— AI 原生跨会话内存
- [内存搜索](/zh-CN/concepts/memory-search) —— 搜索流水线、提供商和调优
- [Dreaming（实验性）](/zh-CN/concepts/dreaming) —— 将短期回忆后台提升到长期内存
- [内存配置参考](/zh-CN/reference/memory-config) —— 所有配置项
- [压缩](/zh-CN/concepts/compaction) —— 压缩如何与内存交互
