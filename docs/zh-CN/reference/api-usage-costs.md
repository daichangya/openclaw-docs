---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、费用和使用可见性
    - 你正在解释 /status 或 /usage 的费用报告
summary: 审计哪些内容可能产生费用、使用了哪些密钥，以及如何查看使用情况
title: API 使用情况和费用
x-i18n:
    generated_at: "2026-04-24T03:18:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API 使用情况与费用

本文档列出**可能调用 API key 的功能**以及这些费用会显示在哪里。重点介绍
可能产生提供商使用量或付费 API 调用的 OpenClaw 功能。

## 费用显示位置（聊天 + CLI）

**每会话费用快照**

- `/status` 会显示当前会话模型、上下文使用情况和上一次回复的 token。
- 如果模型使用的是**API-key 认证**，`/status` 还会显示上一次回复的**估算费用**。
- 如果实时会话元数据较少，`/status` 可以从最新的转录使用量
  条目中恢复 token/cache 计数器和活动运行时模型标签。
  现有的非零实时值仍然优先；当存储的总计缺失或更小时，
  基于 prompt 大小的转录总计也可能胜出。

**每条消息的费用页脚**

- `/usage full` 会在每条回复后附加一个使用量页脚，其中包括**估算费用**（仅 API key）。
- `/usage tokens` 仅显示 token；订阅式 OAuth/token 和 CLI 流程会隐藏美元费用。
- Gemini CLI 说明：当 CLI 返回 JSON 输出时，OpenClaw 会从
  `stats` 中读取使用量，将 `stats.cached` 规范化为 `cacheRead`，
  并在需要时根据 `stats.input_tokens - stats.cached` 推导输入 token。

Anthropic 说明：Anthropic 工作人员告诉我们，OpenClaw 风格的 Claude CLI 使用
再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法
视为此集成的受认可用法，除非 Anthropic 发布新的政策。
Anthropic 仍未提供 OpenClaw 可在 `/usage full` 中显示的逐消息美元估算。

**CLI 使用窗口（提供商配额）**

- `openclaw status --usage` 和 `openclaw channels list` 会显示提供商的**使用窗口**
  （配额快照，而不是逐消息费用）。
- 面向人的输出会在各提供商之间统一为 `X% left`。
- 当前支持使用窗口的提供商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。
- MiniMax 说明：其原始 `usage_percent` / `usagePercent` 字段表示剩余
  配额，因此 OpenClaw 会在显示前将其反转。若存在基于计数的字段，则它们仍然优先。
  如果提供商返回 `model_remains`，OpenClaw 会优先使用聊天模型条目，
  在需要时根据时间戳推导窗口标签，并在计划标签中包含模型名称。
- 这些配额窗口的使用量认证会在可用时来自提供商特定 hook；否则
  OpenClaw 会回退为从认证配置文件、环境变量或配置中匹配 OAuth/API-key
  凭证。

详见[Token 使用与费用](/zh-CN/reference/token-use)中的细节和示例。

## 如何发现密钥

OpenClaw 可从以下位置获取凭证：

- **认证配置文件**（按智能体划分，存储在 `auth-profiles.json` 中）。
- **环境变量**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **配置**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、
  `plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、
  `talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`），它们可能会将密钥导出到 skill 进程环境变量中。

## 哪些功能可能消耗密钥

### 1）核心模型回复（聊天 + 工具）

每条回复或工具调用都会使用**当前模型提供商**（OpenAI、Anthropic 等）。这是
使用量和费用的主要来源。

这也包括订阅式托管提供商，它们仍会在
OpenClaw 本地 UI 之外计费，例如 **OpenAI Codex**、**Alibaba Cloud Model Studio
Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**，以及
启用了 **Extra Usage** 的 Anthropic OpenClaw Claude 登录路径。

定价配置请参见 [Models](/zh-CN/providers/models)，显示方式请参见 [Token 使用与费用](/zh-CN/reference/token-use)。

### 2）媒体理解（音频/图像/视频）

在回复运行前，传入媒体可以先被总结/转录。这会使用模型/提供商 API。

- 音频：OpenAI / Groq / Deepgram / Google / Mistral。
- 图像：OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 视频：Google / Qwen / Moonshot。

参见[媒体理解](/zh-CN/nodes/media-understanding)。

### 3）图像和视频生成

共享生成能力也可能消耗提供商密钥：

- 图像生成：OpenAI / Google / fal / MiniMax
- 视频生成：Qwen

当 `agents.defaults.imageGenerationModel` 未设置时，
图像生成可以推断一个基于认证的默认提供商。视频生成当前
要求显式设置 `agents.defaults.videoGenerationModel`，例如
`qwen/wan2.6-t2v`。

参见[图像生成](/zh-CN/tools/image-generation)、[Qwen Cloud](/zh-CN/providers/qwen)
和 [Models](/zh-CN/concepts/models)。

### 4）记忆嵌入 + 语义搜索

配置为远程提供商时，语义记忆搜索会使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings（本地/自托管）
- `memorySearch.provider = "ollama"` → Ollama embeddings（本地/自托管；通常不会产生托管 API 计费）
- 如果本地 embeddings 失败，可选择回退到远程提供商

你可以通过设置 `memorySearch.provider = "local"` 保持完全本地（无 API 使用）。

参见[Memory](/zh-CN/concepts/memory)。

### 5）Web 搜索工具

`web_search` 可能会根据你的提供商产生使用费用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**：`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web 搜索**：默认无需密钥，但要求可访问的 Ollama 主机以及 `ollama signin`；当主机要求时，也可复用普通 Ollama 提供商 bearer 认证
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：免密钥回退（无 API 计费，但为非官方且基于 HTML）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（免密钥/自托管；无托管 API 计费）

旧版 `tools.web.search.*` 提供商路径仍会通过临时兼容性 shim 加载，但它们已不再是推荐的配置入口。

**Brave Search 免费额度：** 每个 Brave 套餐都包含每月 5 美元的可续期
免费额度。Search 套餐费用为每 1,000 次请求 5 美元，因此该额度可覆盖
每月 1,000 次免费请求。请在 Brave 控制台中设置你的使用限制，
以避免意外费用。

参见[Web 工具](/zh-CN/tools/web)。

### 5）Web 抓取工具（Firecrawl）

当存在 API key 时，`web_fetch` 可以调用 **Firecrawl**：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未配置 Firecrawl，该工具会回退到直接抓取 + readability（无付费 API）。

参见[Web 工具](/zh-CN/tools/web)。

### 6）提供商使用量快照（status/health）

某些状态命令会调用**提供商使用量端点**，以显示配额窗口或认证健康状态。
这些通常是低频调用，但仍会访问提供商 API：

- `openclaw status --usage`
- `openclaw models status --json`

参见 [Models CLI](/zh-CN/cli/models)。

### 7）压缩保护摘要

压缩保护机制可以使用**当前模型**来总结会话历史，这
会在运行时调用提供商 API。

参见[会话管理 + 压缩](/zh-CN/reference/session-management-compaction)。

### 8）模型扫描 / 探测

`openclaw models scan` 可以探测 OpenRouter 模型，并在
启用探测时使用 `OPENROUTER_API_KEY`。

参见 [Models CLI](/zh-CN/cli/models)。

### 9）Talk（语音）

配置后，Talk 模式可以调用 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

参见 [Talk mode](/zh-CN/nodes/talk)。

### 10）Skills（第三方 API）

Skills 可以将 `apiKey` 存储在 `skills.entries.<name>.apiKey` 中。如果某个 skill 使用该密钥调用外部
API，则可能根据该 skill 的提供商产生费用。

参见 [Skills](/zh-CN/tools/skills)。

## 相关内容

- [Token 使用与费用](/zh-CN/reference/token-use)
- [Prompt caching](/zh-CN/reference/prompt-caching)
- [使用量跟踪](/zh-CN/concepts/usage-tracking)
