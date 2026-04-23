---
read_when:
    - 你想将 QMD 设置为你的记忆后端
    - 你想启用高级记忆功能，例如重排序或额外索引路径
summary: 本地优先搜索 sidecar：支持 BM25、向量、重排序与查询扩展
title: QMD 记忆引擎
x-i18n:
    generated_at: "2026-04-23T20:46:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a811b7a2ec911d5e3813e22a24a2f8a1a5e4ca8741281418d084690d809bb06
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索 sidecar，会与
OpenClaw 一起运行。它将 BM25、向量搜索和重排序整合到一个
二进制中，并且可以为工作区记忆文件之外的内容建立索引。

## 相比内置引擎增加了什么

- **重排序和查询扩展**，以获得更好的召回效果。
- **为额外目录建立索引** —— 项目文档、团队笔记、磁盘上的任意内容。
- **为会话 transcript 建立索引** —— 回忆更早的对话。
- **完全本地** —— 通过 Bun + node-llama-cpp 运行，会自动下载 GGUF 模型。
- **自动回退** —— 如果 QMD 不可用，OpenClaw 会无缝回退到
  内置引擎。

## 入门指南

### 前提条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允许扩展的 SQLite 构建（在 macOS 上使用 `brew install sqlite`）。
- QMD 必须位于 gateway 的 `PATH` 中。
- macOS 和 Linux 可直接运行。Windows 最佳支持方式是通过 WSL2。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在
`~/.openclaw/agents/<agentId>/qmd/` 下创建一个自包含的 QMD 主目录，
并自动管理 sidecar 生命周期
—— 集合、更新和嵌入运行都会由它代为处理。
它会优先使用当前的 QMD collection 和 MCP 查询形态，但在需要时仍会回退到
旧版 `--mask` collection 标志和较旧的 MCP 工具名。

## sidecar 的工作方式

- OpenClaw 会根据你的工作区记忆文件以及任何已配置的
  `memory.qmd.paths` 创建集合，然后在启动时和定期（默认每 5 分钟）运行 `qmd update` + `qmd embed`。
- 默认工作区集合会跟踪 `MEMORY.md` 以及 `memory/`
  树。小写的 `memory.md` 不会作为根记忆文件建立索引。
- 启动刷新会在后台进行，因此不会阻塞聊天启动。
- 搜索会使用已配置的 `searchMode`（默认：`search`；也支持
  `vsearch` 和 `query`）。如果某个模式失败，OpenClaw 会使用 `qmd query` 重试。
- 如果 QMD 完全失败，OpenClaw 会回退到内置的 SQLite 引擎。

<Info>
首次搜索可能会很慢 —— QMD 会在第一次运行 `qmd query` 时自动下载用于
重排序和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

## 模型覆盖

QMD 模型环境变量会从 gateway
进程中原样透传，因此你可以在不新增 OpenClaw 配置的情况下全局调优 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，请重新运行 embeddings，使索引与
新的向量空间匹配。

## 为额外路径建立索引

让 QMD 指向其他目录，以便这些内容也可被搜索：

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

来自额外路径的片段会在搜索结果中显示为 `qmd/<collection>/<relative-path>`。
`memory_get` 能识别此前缀，并从正确的
collection 根目录读取内容。

## 为会话 transcript 建立索引

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

Transcript 会作为已净化的 User/Assistant 轮次导出到专用的 QMD
collection 中，位置在 `~/.openclaw/agents/<id>/qmd/sessions/`。

## 搜索范围

默认情况下，QMD 搜索结果会显示在私聊和渠道会话中
（不包括群组）。可配置 `memory.qmd.scope` 来更改此行为：

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

当 scope 拒绝某次搜索时，OpenClaw 会记录一条包含推导出的 channel 和
chat type 的警告，这样更容易调试空结果问题。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段会包含一个
`Source: <path#line>` 页脚。设置 `memory.citations = "off"` 可省略该页脚，
同时仍会在内部将路径传递给智能体。

## 适用场景

当你需要以下能力时，请选择 QMD：

- 使用重排序来获得更高质量的结果。
- 搜索工作区之外的项目文档或笔记。
- 回忆过去的会话对话。
- 完全本地搜索，无需 API key。

对于更简单的设置，[内置引擎](/zh-CN/concepts/memory-builtin) 在
无需额外依赖的情况下也能很好工作。

## 故障排除

**找不到 QMD？** 请确保该二进制位于 gateway 的 `PATH` 中。如果 OpenClaw
作为服务运行，请创建一个符号链接：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

**首次搜索很慢？** QMD 会在首次使用时下载 GGUF 模型。可以使用与 OpenClaw 相同的 XDG 目录运行
`qmd query "test"` 进行预热。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。
对于较慢的硬件，可设为 `120000`。

**群聊中结果为空？** 请检查 `memory.qmd.scope` —— 默认只
允许私聊和渠道会话。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？**
QMD 遍历当前遵循底层 QMD 扫描器行为，而不是
OpenClaw 内置的符号链接规则。请将临时 monorepo checkout 保存在
诸如 `.tmp/` 之类的隐藏目录中，或放在已索引的 QMD 根目录之外，直到 QMD 提供
安全处理循环的遍历或显式排除控制。

## 配置

完整配置表面（`memory.qmd.*`）、搜索模式、更新间隔、
范围规则以及其他所有可调项，请参阅
[Memory configuration reference](/zh-CN/reference/memory-config)。
