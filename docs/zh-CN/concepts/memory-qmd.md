---
read_when:
    - 你想把 QMD 设置为你的记忆后端
    - 你希望使用更高级的记忆功能，例如重排序或额外的索引路径
summary: 采用本地优先的搜索 sidecar，集成 BM25、向量、重排序和查询扩展
title: QMD 记忆引擎
x-i18n:
    generated_at: "2026-04-23T22:14:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 381affeebffa4fa935e89ab01e39f0accf88e4e23469acc4f966bdd72eb16142
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索 sidecar，与 OpenClaw 一起运行。它将 BM25、向量搜索和重排序整合到单个二进制程序中，还可以为你的工作区记忆文件之外的内容建立索引。

## 相比内置功能增加了什么

- **重排序和查询扩展**，以获得更好的召回效果。
- **为额外目录建立索引** —— 项目文档、团队笔记、磁盘上的任何内容。
- **为会话转录建立索引** —— 回忆更早的对话。
- **完全本地化** —— 通过 Bun + node-llama-cpp 运行，自动下载 GGUF 模型。
- **自动回退** —— 如果 QMD 不可用，OpenClaw 会无缝回退到内置引擎。

## 入门指南

### 前提条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 支持扩展的 SQLite 构建版本（在 macOS 上使用 `brew install sqlite`）。
- QMD 必须存在于 Gateway 网关的 `PATH` 中。
- macOS 和 Linux 开箱即用。Windows 最佳支持方式是通过 WSL2。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在 `~/.openclaw/agents/<agentId>/qmd/` 下创建一个自包含的 QMD 主目录，并自动管理 sidecar 生命周期 —— 集合、更新和嵌入运行都会由系统替你处理。它会优先使用当前的 QMD collection 和 MCP query 形状，但在需要时仍会回退到旧版的 `--mask` collection 标志和更早的 MCP 工具名称。启动时的协调也会在仍存在同名旧版 QMD collection 时，将陈旧的托管 collection 重新创建为其规范模式。

## sidecar 的工作方式

- OpenClaw 会根据你的工作区记忆文件以及任何已配置的 `memory.qmd.paths` 创建 collection，然后在启动时和周期性地（默认每 5 分钟）运行 `qmd update` + `qmd embed`。
- 默认工作区 collection 会跟踪 `MEMORY.md` 以及 `memory/` 目录树。小写的 `memory.md` 不会作为根记忆文件建立索引。
- 启动时刷新会在后台运行，因此不会阻塞聊天启动。
- 搜索会使用已配置的 `searchMode`（默认：`search`；也支持 `vsearch` 和 `query`）。如果某种模式失败，OpenClaw 会使用 `qmd query` 重试。
- 如果 QMD 完全失败，OpenClaw 会回退到内置的 SQLite 引擎。

<Info>
首次搜索可能会比较慢 —— QMD 会在第一次运行 `qmd query` 时自动下载用于重排序和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

## 模型覆盖

QMD 模型环境变量会从 Gateway 网关进程原样透传，因此你可以在不新增 OpenClaw 配置的情况下全局调优 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，请重新运行嵌入，以便索引与新的向量空间匹配。

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

来自额外路径的片段会以 `qmd/<collection>/<relative-path>` 的形式出现在搜索结果中。`memory_get` 能识别此前缀，并从正确的 collection 根目录读取内容。

## 为会话转录建立索引

启用会话索引，以回忆更早的对话：

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

转录会以经过清理的用户/助手轮次形式导出到专用的 QMD collection 中，路径为 `~/.openclaw/agents/<id>/qmd/sessions/`。

## 搜索范围

默认情况下，QMD 搜索结果会显示在私信和渠道会话中（不包括群组）。通过配置 `memory.qmd.scope` 可更改此行为：

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

当范围规则拒绝一次搜索时，OpenClaw 会记录一条警告日志，其中包含推导出的渠道和聊天类型，从而使空结果更容易排查。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段会包含一个 `Source: <path#line>` 页脚。将 `memory.citations = "off"` 可省略该页脚，同时仍会在内部将路径传递给智能体。

## 何时使用

当你有以下需求时，请选择 QMD：

- 需要通过重排序获得更高质量的结果。
- 需要搜索工作区之外的项目文档或笔记。
- 需要回忆过去的会话对话。
- 需要完全本地的搜索且不使用 API 密钥。

对于更简单的设置，[内置引擎](/zh-CN/concepts/memory-builtin) 在无需额外依赖的情况下也能很好地工作。

## 故障排除

**找不到 QMD？** 请确保该二进制文件位于 Gateway 网关的 `PATH` 中。如果 OpenClaw 作为服务运行，请创建一个符号链接：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

**首次搜索很慢？** QMD 会在首次使用时下载 GGUF 模型。可使用与 OpenClaw 相同的 XDG 目录，通过 `qmd query "test"` 进行预热。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认值：4000ms）。对于较慢的硬件，可设置为 `120000`。

**群聊中结果为空？** 检查 `memory.qmd.scope` —— 默认只允许私信和渠道会话。

**根记忆搜索突然变得过于宽泛？** 重新启动 Gateway 网关，或等待下一次启动时协调。OpenClaw 在检测到同名冲突时，会将陈旧的托管 collection 重新创建为规范的 `MEMORY.md` 和 `memory/` 模式。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？**
QMD 遍历当前遵循底层 QMD 扫描器的行为，而不是 OpenClaw 内置的符号链接规则。请将临时 monorepo 检出放在诸如 `.tmp/` 这样的隐藏目录中，或放在已建立索引的 QMD 根目录之外，直到 QMD 提供防循环遍历或显式排除控制。

## 配置

要查看完整的配置项（`memory.qmd.*`）、搜索模式、更新间隔、范围规则以及其他所有可调参数，请参阅 [记忆配置参考](/zh-CN/reference/memory-config)。
