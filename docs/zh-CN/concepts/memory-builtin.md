---
read_when:
    - 你想了解默认的 Memory 后端
    - 你想配置嵌入提供商或混合搜索
summary: 默认基于 SQLite 的 Memory 后端，支持关键词、向量和混合搜索
title: 内置 Memory 引擎
x-i18n:
    generated_at: "2026-04-25T07:22:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

内置引擎是默认的 Memory 后端。它将你的内存索引存储在每个智能体各自的 SQLite 数据库中，入门时无需任何额外依赖。

## 它提供的能力

- **关键词搜索**：通过 FTS5 全文索引（BM25 评分）实现。
- **向量搜索**：通过任意受支持提供商提供的嵌入实现。
- **混合搜索**：结合两者以获得最佳结果。
- **CJK 支持**：通过 trigram 分词支持中文、日文和韩文。
- **sqlite-vec 加速**：用于数据库内向量查询（可选）。

## 入门指南

如果你有 OpenAI、Gemini、Voyage 或 Mistral 的 API 密钥，内置引擎会自动检测并启用向量搜索。无需配置。

如需显式设置提供商：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

如果没有嵌入提供商，则只能使用关键词搜索。

如果你想强制使用内置的本地嵌入提供商，请在 OpenClaw 旁边安装可选的 `node-llama-cpp` 运行时包，然后将 `local.modelPath` 指向一个 GGUF 文件：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## 支持的嵌入提供商

| 提供商 | ID        | 自动检测 | 说明                                |
| ------ | --------- | -------- | ----------------------------------- |
| OpenAI | `openai`  | 是       | 默认：`text-embedding-3-small`      |
| Gemini | `gemini`  | 是       | 支持多模态（图像 + 音频）           |
| Voyage | `voyage`  | 是       |                                     |
| Mistral | `mistral` | 是      |                                     |
| Ollama | `ollama`  | 否       | 本地，需显式设置                    |
| Local  | `local`   | 是（优先） | 可选的 `node-llama-cpp` 运行时    |

自动检测会按表中所示顺序，选择第一个能够解析出 API 密钥的提供商。设置 `memorySearch.provider` 可覆盖此行为。

## 索引的工作方式

OpenClaw 会将 `MEMORY.md` 和 `memory/*.md` 索引为分块（约 400 个 token，带 80 个 token 重叠），并将其存储在每个智能体各自的 SQLite 数据库中。

- **索引位置：** `~/.openclaw/memory/<agentId>.sqlite`
- **文件监听：** 对内存文件的更改会触发防抖后的重新索引（1.5 秒）。
- **自动重新索引：** 当嵌入提供商、模型或分块配置发生变化时，整个索引会自动重建。
- **按需重新索引：** `openclaw memory index --force`

<Info>
你也可以使用 `memorySearch.extraPaths` 为工作区外部的 Markdown 文件建立索引。参见[配置参考](/zh-CN/reference/memory-config#additional-memory-paths)。
</Info>

## 何时使用

对于大多数用户来说，内置引擎是正确的选择：

- 开箱即用，无需额外依赖。
- 能很好地处理关键词搜索和向量搜索。
- 支持所有嵌入提供商。
- 混合搜索结合了两种检索方式的优势。

如果你需要重排、查询扩展，或者想为工作区外的目录建立索引，可以考虑切换到 [QMD](/zh-CN/concepts/memory-qmd)。

如果你想要带有自动用户建模的跨会话记忆，可以考虑 [Honcho](/zh-CN/concepts/memory-honcho)。

## 故障排除

**Memory 搜索已禁用？** 检查 `openclaw memory status`。如果未检测到提供商，请显式设置一个提供商或添加 API 密钥。

**未检测到本地提供商？** 确认本地路径存在，然后运行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

独立的 CLI 命令和 Gateway 网关 都使用相同的 `local` 提供商 ID。如果提供商设置为 `auto`，只有当 `memorySearch.local.modelPath` 指向一个存在的本地文件时，才会优先考虑本地嵌入。

**结果过时？** 运行 `openclaw memory index --force` 进行重建。监听器在极少数边界情况下可能会漏掉更改。

**sqlite-vec 无法加载？** OpenClaw 会自动回退到进程内余弦相似度计算。请检查日志以获取具体的加载错误。

## 配置

有关嵌入提供商设置、混合搜索调优（权重、MMR、时间衰减）、批量索引、多模态 Memory、sqlite-vec、额外路径以及所有其他配置项，请参见 [Memory 配置参考](/zh-CN/reference/memory-config)。

## 相关内容

- [Memory 概览](/zh-CN/concepts/memory)
- [Memory 搜索](/zh-CN/concepts/memory-search)
- [Active memory](/zh-CN/concepts/active-memory)
