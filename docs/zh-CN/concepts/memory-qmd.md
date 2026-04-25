---
read_when:
    - 你想将 QMD 设置为你的 memory 后端
    - 你想要高级 memory 功能，例如重排序或额外的索引路径
summary: 本地优先的搜索 sidecar，具备 BM25、向量、重排序和查询扩展功能
title: QMD memory 引擎
x-i18n:
    generated_at: "2026-04-25T07:22:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e6a5e0c8f5fb8507dffd08975fec0ca6fda03883079a27c2a28a1d09e95368
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索 sidecar，与 OpenClaw 一起运行。它将 BM25、向量搜索和重排序整合到同一个二进制中，并且可以为超出你的工作区 memory 文件范围的内容建立索引。

## 相比 builtin 增加了什么

- **重排序和查询扩展**，以获得更好的召回效果。
- **为额外目录建立索引** —— 项目文档、团队笔记、磁盘上的任何内容。
- **为会话转录建立索引** —— 回忆更早的对话。
- **完全本地** —— 使用可选的 `node-llama-cpp` 运行时包，并自动下载 GGUF 模型。
- **自动回退** —— 如果 QMD 不可用，OpenClaw 会无缝回退到 builtin 引擎。

## 入门指南

### 前提条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 支持扩展的 SQLite 构建版本（在 macOS 上使用 `brew install sqlite`）。
- QMD 必须存在于 Gateway 网关的 `PATH` 中。
- macOS 和 Linux 开箱即用。Windows 最适合通过 WSL2 使用。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在 `~/.openclaw/agents/<agentId>/qmd/` 下创建一个自包含的 QMD 主目录，并自动管理 sidecar 生命周期 —— 集合、更新和嵌入运行都会由它处理。它会优先使用当前的 QMD 集合和 MCP 查询形态，但在需要时仍会回退到旧版的 `--mask` 集合标志和更旧的 MCP 工具名称。启动时的协调流程还会在检测到存在同名旧版 QMD 集合时，将过期的托管集合重新创建为其规范模式。

## sidecar 的工作方式

- OpenClaw 会根据你的工作区 memory 文件以及所有已配置的 `memory.qmd.paths` 创建集合，然后在启动时和周期性地（默认每 5 分钟）运行 `qmd update` + `qmd embed`。
- 默认工作区集合会跟踪 `MEMORY.md` 以及 `memory/` 目录树。小写的 `memory.md` 不会作为根 memory 文件建立索引。
- 启动时刷新会在后台运行，因此不会阻塞聊天启动。
- 搜索会使用已配置的 `searchMode`（默认：`search`；也支持 `vsearch` 和 `query`）。如果某种模式失败，OpenClaw 会使用 `qmd query` 重试。
- 如果 QMD 完全失败，OpenClaw 会回退到 builtin SQLite 引擎。

<Info>
第一次搜索可能会很慢 —— QMD 会在首次运行 `qmd query` 时自动下载用于重排序和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

## 模型覆盖

QMD 模型环境变量会从 Gateway 网关进程原样透传，因此你可以在不新增 OpenClaw 配置的情况下全局调优 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，请重新运行嵌入，以确保索引与新的向量空间匹配。

## 为额外路径建立索引

将 QMD 指向其他目录，使其可被搜索：

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

来自额外路径的片段会在搜索结果中显示为 `qmd/<collection>/<relative-path>`。`memory_get` 能理解这个前缀，并从正确的集合根目录读取内容。

## 为会话转录建立索引

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

转录内容会作为经过净化的用户 / 助手轮次导出到位于 `~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD 集合中。

## 搜索范围

默认情况下，QMD 搜索结果会显示在直接会话和渠道会话中（不包括群组）。通过配置 `memory.qmd.scope` 来更改此行为：

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

当范围规则拒绝某次搜索时，OpenClaw 会记录一条警告日志，其中包含推导出的渠道和聊天类型，以便更容易调试空结果问题。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段会包含一个 `Source: <path#line>` 页脚。将 `memory.citations = "off"` 可省略该页脚，同时仍在内部将路径传递给智能体。

## 何时使用

当你需要以下能力时，请选择 QMD：

- 使用重排序获得更高质量的结果。
- 搜索工作区外的项目文档或笔记。
- 回忆过去的会话对话。
- 完全本地的搜索，无需 API 密钥。

对于更简单的设置，[builtin 引擎](/zh-CN/concepts/memory-builtin) 在无需额外依赖的情况下也能很好地工作。

## 故障排除

**找不到 QMD？** 确保该二进制位于 Gateway 网关的 `PATH` 中。如果 OpenClaw 作为服务运行，请创建一个符号链接：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

**第一次搜索很慢？** QMD 会在首次使用时下载 GGUF 模型。可使用与 OpenClaw 相同的 XDG 目录运行 `qmd query "test"` 进行预热。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。对于较慢的硬件，可设置为 `120000`。

**群聊中结果为空？** 检查 `memory.qmd.scope` —— 默认只允许直接会话和渠道会话。

**根 memory 搜索突然变得过于宽泛？** 重启 Gateway 网关，或等待下一次启动协调。OpenClaw 会在检测到同名冲突时，将过期的托管集合重新创建为规范的 `MEMORY.md` 和 `memory/` 模式。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？** QMD 当前的遍历行为遵循底层 QMD 扫描器的行为，而不是 OpenClaw builtin 的符号链接规则。在 QMD 提供具备循环安全的遍历或显式排除控制之前，请将临时 monorepo 检出保存在 `.tmp/` 这样的隐藏目录下，或放在已建立索引的 QMD 根目录之外。

## 配置

如需查看完整的配置项（`memory.qmd.*`）、搜索模式、更新间隔、范围规则以及其他所有可调参数，请参阅
[Memory 配置参考](/zh-CN/reference/memory-config)。

## 相关内容

- [Memory 概览](/zh-CN/concepts/memory)
- [Builtin memory 引擎](/zh-CN/concepts/memory-builtin)
- [Honcho memory](/zh-CN/concepts/memory-honcho)
