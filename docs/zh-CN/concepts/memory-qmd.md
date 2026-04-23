---
read_when:
    - 你想将 QMD 设置为你的记忆后端
    - 你想要高级记忆功能，例如重排或额外的索引路径
summary: 本地优先的搜索 sidecar，具备 BM25、向量、重排和查询扩展功能
title: QMD 记忆引擎
x-i18n:
    generated_at: "2026-04-23T22:56:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d7af326291e194a04a17aa425901bf7e2517c23bae8282cd504802d24e9e522
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索 sidecar，与 OpenClaw 一同运行。它将 BM25、向量搜索和重排组合进同一个二进制文件中，并且可以索引超出你的工作区记忆文件范围的内容。

## 相比内置功能增加了什么

- **重排和查询扩展**，以获得更好的召回效果。
- **索引额外目录** —— 项目文档、团队笔记、磁盘上的任何内容。
- **索引会话转录** —— 回忆更早的对话。
- **完全本地** —— 通过 Bun + node-llama-cpp 运行，并自动下载 GGUF 模型。
- **自动回退** —— 如果 QMD 不可用，OpenClaw 会无缝回退到内置引擎。

## 入门指南

### 前提条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 支持扩展的 SQLite 构建版本（在 macOS 上使用 `brew install sqlite`）。
- QMD 必须位于 Gateway 网关的 `PATH` 中。
- macOS 和 Linux 可开箱即用。Windows 最佳支持方式是通过 WSL2。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在 `~/.openclaw/agents/<agentId>/qmd/` 下创建一个自包含的 QMD 主目录，并自动管理 sidecar 生命周期 —— 集合、更新和嵌入运行都会由它为你处理。
它会优先使用当前的 QMD collection 和 MCP 查询结构，但在需要时仍会回退到旧版 `--mask` collection 标志和较早的 MCP 工具名称。
启动时的协调还会在检测到存在同名旧 QMD collection 时，将过时的受管集合重新创建为其规范模式。

## sidecar 的工作方式

- OpenClaw 会根据你的工作区记忆文件以及任何已配置的 `memory.qmd.paths` 创建集合，然后在启动时和周期性地（默认为每 5 分钟）运行 `qmd update` + `qmd embed`。
- 默认工作区集合会跟踪 `MEMORY.md` 以及 `memory/` 目录树。小写的 `memory.md` 不会被索引为根记忆文件。
- 启动刷新会在后台运行，因此不会阻塞聊天启动。
- 搜索会使用已配置的 `searchMode`（默认：`search`；也支持 `vsearch` 和 `query`）。如果某个模式失败，OpenClaw 会使用 `qmd query` 重试。
- 如果 QMD 完全失败，OpenClaw 会回退到内置 SQLite 引擎。

<Info>
首次搜索可能会很慢 —— QMD 会在首次运行 `qmd query` 时自动下载用于重排和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

## 模型覆盖

QMD 模型环境变量会原样从 Gateway 网关进程透传，因此你可以在不添加新的 OpenClaw 配置的情况下全局调优 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，请重新运行嵌入，使索引与新的向量空间匹配。

## 索引额外路径

将 QMD 指向其他目录，以便让它们也可搜索：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

来自额外路径的片段会在搜索结果中显示为 `qmd/<collection>/<relative-path>`。`memory_get` 能识别这个前缀，并从正确的 collection 根目录读取。

## 索引会话转录

启用会话索引以回忆更早的对话：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

转录会作为经过清理的用户/助手轮次导出到专用的 QMD collection 中，位置为 `~/.openclaw/agents/<id>/qmd/sessions/`。

## 搜索范围

默认情况下，QMD 搜索结果会显示在私聊和渠道会话中（不包括群组）。可配置 `memory.qmd.scope` 来更改这一点：

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

当范围规则拒绝某次搜索时，OpenClaw 会记录一条警告，其中包含推导出的渠道和聊天类型，以便更容易调试空结果。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段会包含 `Source: <path#line>` 页脚。将 `memory.citations = "off"` 可省略该页脚，同时仍在内部将路径传递给智能体。

## 何时使用

当你需要以下能力时，请选择 QMD：

- 通过重排获得更高质量的结果。
- 搜索工作区之外的项目文档或笔记。
- 回忆过去的会话对话。
- 完全本地搜索，无需 API 密钥。

对于更简单的设置，[内置引擎](/zh-CN/concepts/memory-builtin) 在没有额外依赖的情况下也能很好地工作。

## 故障排除

**找不到 QMD？** 请确保该二进制文件位于 Gateway 网关的 `PATH` 中。如果 OpenClaw 作为服务运行，请创建一个符号链接：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

**首次搜索很慢？** QMD 会在首次使用时下载 GGUF 模型。可使用与 OpenClaw 相同的 XDG 目录运行 `qmd query "test"` 进行预热。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。对于较慢的硬件，可设置为 `120000`。

**群聊中结果为空？** 检查 `memory.qmd.scope` —— 默认只允许私聊和渠道会话。

**根记忆搜索突然变得过宽？** 重启 Gateway 网关，或等待下一次启动协调。OpenClaw 在检测到同名冲突时，会将过时的受管集合重新创建回规范的 `MEMORY.md` 和 `memory/` 模式。

**工作区中可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？**
QMD 当前的遍历遵循底层 QMD 扫描器行为，而不是 OpenClaw 内置的符号链接规则。在 QMD 暴露出防循环遍历或显式排除控制之前，请将临时 monorepo 检出保存在 `.tmp/` 之类的隐藏目录下，或放在已索引 QMD 根目录之外。

## 配置

有关完整配置表面（`memory.qmd.*`）、搜索模式、更新间隔、范围规则及所有其他旋钮，请参见
[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)
