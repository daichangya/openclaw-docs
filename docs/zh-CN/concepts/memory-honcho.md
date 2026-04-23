---
read_when:
    - 你想要可跨会话和渠道工作的持久 memory
    - 你想要 AI 驱动的回忆能力和用户建模
summary: 通过 Honcho 插件实现 AI 原生的跨会话 memory
title: Honcho memory
x-i18n:
    generated_at: "2026-04-23T20:46:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d717f92ae6ee62a0f8340ae2061b75639495e24ec855c009f8749739bf380e23
    source_path: concepts/memory-honcho.md
    workflow: 15
---

[Honcho](https://honcho.dev) 为 OpenClaw 添加了 AI 原生 memory。它会将
对话持久化到专用服务中，并随着时间推移构建用户和智能体模型，
从而为你的智能体提供跨会话上下文，超越工作区 Markdown
文件所能提供的范围。

## 它提供什么

- **跨会话 memory** —— 每轮对话后都会持久化会话，
  因此上下文可以跨会话重置、压缩和渠道切换延续。
- **用户建模** —— Honcho 会为每个用户维护一个档案（偏好、
  事实、沟通风格），也会为智能体维护一个档案（人格、已学习的
  行为）。
- **语义搜索** —— 搜索过去对话中的观察结果，而不仅仅是
  当前会话。
- **多智能体感知** —— 父智能体会自动跟踪其派生的
  子智能体，并将父智能体添加为子会话中的观察者。

## 可用工具

Honcho 会注册一些工具，智能体可以在对话期间使用：

**数据检索（快速，无需 LLM 调用）：**

| 工具                        | 作用                                                   |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | 跨会话的完整用户表示                                   |
| `honcho_search_conclusions` | 对已存储结论进行语义搜索                               |
| `honcho_search_messages`    | 跨会话查找消息（可按发送者、日期过滤）                 |
| `honcho_session`            | 当前会话历史和摘要                                     |

**问答（由 LLM 驱动）：**

| 工具         | 作用                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| `honcho_ask` | 询问与用户相关的问题。`depth='quick'` 用于事实，`'thorough'` 用于综合分析 |

## 入门指南

安装插件并运行设置：

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

设置命令会提示你输入 API 凭证、写入配置，并且
可选择迁移现有工作区 memory 文件。

<Info>
Honcho 可以完全本地运行（自托管），也可以通过托管 API
`api.honcho.dev` 运行。自托管选项不需要任何外部依赖。
</Info>

## 配置

设置位于 `plugins.entries["openclaw-honcho"].config` 下：

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // 自托管时可省略
          workspaceId: "openclaw", // memory 隔离
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

对于自托管实例，请将 `baseUrl` 指向你的本地服务器（例如
`http://localhost:8000`），并省略 API 密钥。

## 迁移现有 memory

如果你已有工作区 memory 文件（`USER.md`、`MEMORY.md`、
`IDENTITY.md`、`memory/`、`canvas/`），`openclaw honcho setup` 会检测到它们，
并提供迁移选项。

<Info>
迁移是非破坏性的 —— 文件会上传到 Honcho。原文件
绝不会被删除或移动。
</Info>

## 工作原理

每次 AI 对话轮次之后，对话都会被持久化到 Honcho。用户和
智能体消息都会被观察，从而使 Honcho 能够随着时间推移构建并完善其模型。

在对话期间，Honcho 工具会在 `before_prompt_build`
阶段查询服务，并在模型看到提示之前注入相关上下文。这样可以确保
轮次边界准确，并获得相关回忆内容。

## Honcho 与内置 memory 的对比

|                   | 内置 / QMD                    | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **存储**          | 工作区 Markdown 文件          | 专用服务（本地或托管）              |
| **跨会话**        | 通过 memory 文件              | 自动，内建                          |
| **用户建模**      | 手动（写入 `MEMORY.md`）      | 自动档案                            |
| **搜索**          | 向量 + 关键词（混合）         | 基于观察结果的语义搜索              |
| **多智能体**      | 不跟踪                        | 具备父/子感知                       |
| **依赖**          | 无（内置）或 QMD 二进制       | 需要安装插件                        |

Honcho 与内置 memory 系统可以协同工作。当配置了 QMD 时，
除了 Honcho 的跨会话 memory 外，还会额外提供用于搜索本地 Markdown 文件的工具。

## CLI 命令

```bash
openclaw honcho setup                        # 配置 API 密钥并迁移文件
openclaw honcho status                       # 检查连接状态
openclaw honcho ask <question>               # 向 Honcho 查询与用户相关的问题
openclaw honcho search <query> [-k N] [-d D] # 对 memory 执行语义搜索
```

## 延伸阅读

- [插件源代码](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho 文档](https://docs.honcho.dev)
- [Honcho OpenClaw 集成指南](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/zh-CN/concepts/memory) —— OpenClaw memory 概览
- [Context Engines](/zh-CN/concepts/context-engine) —— 插件上下文引擎的工作方式
