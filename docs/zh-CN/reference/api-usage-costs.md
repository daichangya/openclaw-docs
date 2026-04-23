---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、成本和用量可见性
    - 你正在解释 `/status` 或 `/usage` 成本报告
summary: 审计哪些操作会花钱、使用了哪些密钥，以及如何查看用量
title: API 用量和成本
x-i18n:
    generated_at: "2026-04-23T21:03:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ff7f2116f4bb9b2ae7c29ac409d27a6f753bb6ecb214556f9f3238e5c3e0ca
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API 用量与成本

本文档列出了**哪些功能可能调用 API key**，以及这些成本会显示在哪里。重点介绍
OpenClaw 中那些可能产生 provider 用量或付费 API 调用的功能。

## 成本显示位置（聊天 + CLI）

**按会话成本快照**

- `/status` 会显示当前会话模型、上下文用量以及上一次回复的 tokens。
- 如果模型使用的是**API key 认证**，`/status` 还会显示上一次回复的**预估成本**。
- 如果实时会话元数据较稀疏，`/status` 可以从最新的转录用量
  条目中恢复 token/cache 计数器以及当前运行时模型标签。已有的非零实时值仍然优先，而当存储的总量缺失或更小时，按提示词大小计算的转录总量可能会胜出。

**按消息成本页脚**

- `/usage full` 会在每条回复后附加一个用量页脚，其中包括**预估成本**（仅 API key）。
- `/usage tokens` 只显示 tokens；订阅式 OAuth/token 和 CLI 流程会隐藏美元成本。
- Gemini CLI 说明：当 CLI 返回 JSON 输出时，OpenClaw 会从
  `stats` 中读取用量，将 `stats.cached` 规范化为 `cacheRead`，并在需要时从
  `stats.input_tokens - stats.cached` 推导输入 tokens。

Anthropic 说明：Anthropic 官方告知我们，再次允许像 OpenClaw 这样复用 Claude CLI 的用法，因此 OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为该集成的受支持方案，除非 Anthropic 发布新的政策。
Anthropic 目前仍未暴露可供 OpenClaw 在 `/usage full` 中显示的按消息美元预估。

**CLI 用量窗口（provider 配额）**

- `openclaw status --usage` 和 `openclaw channels list` 会显示 provider 的**用量窗口**
  （即配额快照，而非按消息成本）。
- 面向人类的输出会统一规范化为 `X% left`。
- 当前支持用量窗口的 provider：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、小米和 z.ai。
- MiniMax 说明：其原始 `usage_percent` / `usagePercent` 字段表示剩余
  配额，因此 OpenClaw 在显示前会将其反转。若存在按次数计数字段，则这些字段仍优先。如果 provider 返回 `model_remains`，OpenClaw 会优先使用聊天模型条目，并在需要时根据时间戳推导窗口标签，同时在 plan 标签中包含模型名称。
- 这些配额窗口的用量认证在可用时来自 provider 专用钩子；否则 OpenClaw 会回退为匹配 auth profiles、环境变量或配置中的 OAuth/API key 凭证。

详情和示例请参阅[Token 用量与成本](/zh-CN/reference/token-use)。

## 如何发现密钥

OpenClaw 可以从以下位置获取凭证：

- **认证配置档案**（按智能体存储在 `auth-profiles.json` 中）。
- **环境变量**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **配置**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、
  `plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、
  `talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`），它们可能会将密钥导出到 skill 进程环境中。

## 哪些功能会消耗密钥

### 1）核心模型回复（聊天 + 工具）

每一次回复或工具调用都会使用**当前模型 provider**（OpenAI、Anthropic 等）。这是
用量和成本的主要来源。

这也包括订阅式托管 provider，它们虽然不会直接在 OpenClaw 本地 UI 中计费，但仍在 OpenClaw 外部产生计费，例如 **OpenAI Codex**、**Alibaba Cloud Model Studio
Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**，以及开启了 **Extra Usage** 的 Anthropic OpenClaw Claude 登录路径。

定价配置请参阅[模型](/zh-CN/providers/models)，显示方式请参阅[Token 用量与成本](/zh-CN/reference/token-use)。

### 2）媒体理解（音频/图像/视频）

入站媒体在回复运行前可能会先被总结/转写。这会使用模型/provider API。

- 音频：OpenAI / Groq / Deepgram / Google / Mistral。
- 图像：OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 视频：Google / Qwen / Moonshot。

请参阅[媒体理解](/zh-CN/nodes/media-understanding)。

### 3）图像和视频生成

共享生成能力也可能消耗 provider key：

- 图像生成：OpenAI / Google / fal / MiniMax
- 视频生成：Qwen

当 `agents.defaults.imageGenerationModel` 未设置时，图像生成可以推断出一个带认证的 provider 默认值。视频生成目前需要显式设置 `agents.defaults.videoGenerationModel`，例如
`qwen/wan2.6-t2v`。

请参阅[图像生成](/zh-CN/tools/image-generation)、[Qwen Cloud](/zh-CN/providers/qwen)
和[模型](/zh-CN/concepts/models)。

### 4）记忆 embeddings + 语义搜索

语义化记忆搜索在配置为远程 provider 时会使用 **embedding API**：

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings（本地/自托管）
- `memorySearch.provider = "ollama"` → Ollama embeddings（本地/自托管；通常没有托管 API 计费）
- 当本地 embeddings 失败时，可选回退到远程 provider

你也可以通过设置 `memorySearch.provider = "local"` 保持完全本地（无 API 用量）。

请参阅[记忆](/zh-CN/concepts/memory)。

### 5）Web 搜索工具

`web_search` 可能会根据 provider 不同而产生用量费用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**：`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web 搜索**：默认无 key，但需要可达的 Ollama 主机并执行 `ollama signin`；当主机要求时，也可复用普通 Ollama provider bearer auth
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：无 key 回退（无 API 计费，但属于非官方 HTML 方案）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（无 key/自托管；无托管 API 计费）

旧版 `tools.web.search.*` provider 路径仍会通过临时兼容 shim 加载，但它们已不再是推荐配置界面。

**Brave Search 免费额度：** 每个 Brave plan 都包含每月 5 美元的可续期免费额度。Search plan 的价格是每 1,000 次请求 5 美元，因此该额度可覆盖每月 1,000 次请求而无需付费。请在 Brave 仪表盘中设置你的用量上限，以避免意外收费。

请参阅[Web 工具](/zh-CN/tools/web)。

### 5）Web 抓取工具（Firecrawl）

当存在 API key 时，`web_fetch` 可以调用 **Firecrawl**：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未配置 Firecrawl，该工具会回退为 direct fetch + readability（无付费 API）。

请参阅[Web 工具](/zh-CN/tools/web)。

### 6）Provider 用量快照（status/health）

某些状态命令会调用 **provider 用量端点**，以显示配额窗口或认证健康状况。
这些通常是低频调用，但仍会命中 provider API：

- `openclaw status --usage`
- `openclaw models status --json`

请参阅[Models CLI](/zh-CN/cli/models)。

### 7）压缩保护摘要

压缩保护可以使用**当前模型**来总结会话历史，因此在运行时会调用 provider API。

请参阅[会话管理 + 压缩](/zh-CN/reference/session-management-compaction)。

### 8）模型扫描 / 探测

`openclaw models scan` 可以探测 OpenRouter 模型，并在
启用探测时使用 `OPENROUTER_API_KEY`。

请参阅[Models CLI](/zh-CN/cli/models)。

### 9）Talk（语音）

Talk 模式在配置后可调用 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

请参阅[Talk 模式](/zh-CN/nodes/talk)。

### 10）Skills（第三方 API）

Skills 可以将 `apiKey` 存储在 `skills.entries.<name>.apiKey` 中。如果某个 skill 使用该密钥调用外部 API，就可能根据该 skill 的 provider 产生费用。

请参阅[Skills](/zh-CN/tools/skills)。
