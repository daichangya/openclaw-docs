---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、费用和用量可见性
    - 你正在解释 `/status` 或 `/usage` 的费用报告
summary: 审计哪些内容会产生费用、使用了哪些密钥，以及如何查看用量
title: API 用量和费用
x-i18n:
    generated_at: "2026-04-24T20:38:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API 用量和费用

本文档列出**可能调用 API 密钥的功能**以及这些费用会显示在哪里。它重点说明
OpenClaw 中可能产生提供商用量或付费 API 调用的功能。

## 费用显示位置（聊天 + CLI）

**按会话显示的费用快照**

- `/status` 会显示当前会话模型、上下文使用情况以及上一次回复的 token 数。
- 如果模型使用**API 密钥认证**，`/status` 还会显示上一条回复的**预估费用**。
- 如果实时会话元数据较少，`/status` 可以从最新转录中的用量条目恢复 token / 缓存
  计数器以及当前运行时模型标签。现有的非零实时数值仍然优先，且当存储的总量缺失或更小时，
  以 prompt 大小估算的转录总量可能会胜出。

**按消息显示的费用页脚**

- `/usage full` 会在每条回复后附加一个用量页脚，其中包含**预估费用**（仅 API 密钥）。
- `/usage tokens` 仅显示 token；订阅式 OAuth / token 和 CLI 流程会隐藏美元费用。
- Gemini CLI 说明：当 CLI 返回 JSON 输出时，OpenClaw 会从
  `stats` 中读取用量，将 `stats.cached` 规范化为 `cacheRead`，并在需要时从
  `stats.input_tokens - stats.cached` 推导输入 token 数。

Anthropic 说明：Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用量
再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 的使用视为此集成中受支持的做法，
除非 Anthropic 发布新的政策。
Anthropic 仍然不会提供 OpenClaw 可在 `/usage full` 中显示的按消息美元预估。

**CLI 用量窗口（提供商配额）**

- `openclaw status --usage` 和 `openclaw channels list` 会显示提供商的**用量窗口**
  （配额快照，而不是按消息费用）。
- 面向人工阅读的输出会统一为各提供商的 `X% left` 格式。
- 当前支持用量窗口的提供商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。
- MiniMax 说明：它原始的 `usage_percent` / `usagePercent` 字段表示的是剩余
  配额，因此 OpenClaw 会在显示前将其反转。若存在基于计数的字段，则这些字段仍优先。
  如果提供商返回 `model_remains`，OpenClaw 会优先选择聊天模型条目，在需要时根据时间戳推导窗口标签，
  并在套餐标签中包含模型名称。
- 这些配额窗口的用量认证会在可用时来自提供商特定的钩子；否则 OpenClaw 会退回到从认证配置文件、
  环境变量或配置中匹配 OAuth / API 密钥凭证。

详情和示例请参见 [Token use & costs](/zh-CN/reference/token-use)。

## 如何发现密钥

OpenClaw 可以从以下位置获取凭证：

- **认证配置文件**（按智能体区分，存储在 `auth-profiles.json` 中）。
- **环境变量**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **配置**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、
  `plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、
  `talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`），它们可能会将密钥导出到 Skill 进程环境中。

## 可能消耗密钥的功能

### 1) 核心模型回复（聊天 + 工具）

每条回复或工具调用都会使用**当前模型提供商**（OpenAI、Anthropic 等）。这是
用量和费用的主要来源。

这也包括仍会在 OpenClaw 本地 UI 之外计费的订阅式托管提供商，例如 **OpenAI Codex**、**Alibaba Cloud Model Studio
Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**，以及
Anthropic 的启用了 **Extra Usage** 的 OpenClaw Claude 登录路径。

定价配置请参见 [Models](/zh-CN/providers/models)，显示方式请参见 [Token use & costs](/zh-CN/reference/token-use)。

### 2) 媒体理解（音频 / 图像 / 视频）

在生成回复之前，收到的媒体内容可能会先被摘要或转录。这会使用模型 / 提供商 API。

- 音频：OpenAI / Groq / Deepgram / Google / Mistral。
- 图像：OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 视频：Google / Qwen / Moonshot。

请参见 [Media understanding](/zh-CN/nodes/media-understanding)。

### 3) 图像和视频生成

共享生成能力也可能会消耗提供商密钥：

- 图像生成：OpenAI / Google / fal / MiniMax
- 视频生成：Qwen

当
`agents.defaults.imageGenerationModel` 未设置时，图像生成可以推断一个由认证支持的默认提供商。视频生成当前仍需要显式设置
`agents.defaults.videoGenerationModel`，例如
`qwen/wan2.6-t2v`。

请参见 [Image generation](/zh-CN/tools/image-generation)、[Qwen Cloud](/zh-CN/providers/qwen)
和 [Models](/zh-CN/concepts/models)。

### 4) Memory 嵌入 + 语义搜索

语义 Memory 搜索在配置为远程提供商时会使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings（本地 / 自托管）
- `memorySearch.provider = "ollama"` → Ollama embeddings（本地 / 自托管；通常不会产生托管 API 计费）
- 如果本地 embeddings 失败，可选择回退到远程提供商

你可以通过设置 `memorySearch.provider = "local"` 保持本地运行（无 API 用量）。

请参见 [Memory](/zh-CN/concepts/memory)。

### 5) Web 搜索工具

`web_search` 可能会根据你使用的提供商产生用量费用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**：`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web 搜索**：默认无需密钥，但需要可访问的 Ollama 主机以及 `ollama signin`；如果主机要求认证，也可以复用普通的 Ollama 提供商 bearer 认证
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：无密钥回退方案（无 API 计费，但为非官方且基于 HTML）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（无密钥 / 自托管；无托管 API 计费）

旧版 `tools.web.search.*` 提供商路径仍会通过临时兼容层加载，但它们已不再是推荐的配置入口。

**Brave Search 免费额度：** 每个 Brave 套餐都包含每月 \$5 的可续期免费额度。
Search 套餐费用为每 1,000 次请求 \$5，因此该额度可覆盖
每月 1,000 次请求且无需付费。请在 Brave 控制台中设置用量上限，以避免意外收费。

请参见 [Web tools](/zh-CN/tools/web)。

### 5) Web 抓取工具（Firecrawl）

当存在 API 密钥时，`web_fetch` 可以调用 **Firecrawl**：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未配置 Firecrawl，该工具会回退到直接抓取加内置的 `web-readability` 插件（无需付费 API）。禁用 `plugins.entries.web-readability.enabled` 可跳过本地 Readability 提取。

请参见 [Web tools](/zh-CN/tools/web)。

### 6) 提供商用量快照（状态 / 健康检查）

某些状态命令会调用**提供商用量端点**来显示配额窗口或认证健康状态。
这些调用通常量很低，但仍会访问提供商 API：

- `openclaw status --usage`
- `openclaw models status --json`

请参见 [Models CLI](/zh-CN/cli/models)。

### 7) 压缩保护摘要

压缩保护机制可以使用**当前模型**对会话历史进行摘要，这会在运行时
调用提供商 API。

请参见 [Session management + compaction](/zh-CN/reference/session-management-compaction)。

### 8) 模型扫描 / 探测

`openclaw models scan` 可以探测 OpenRouter 模型，并在启用
探测时使用 `OPENROUTER_API_KEY`。

请参见 [Models CLI](/zh-CN/cli/models)。

### 9) Talk（语音）

Talk 模式在配置后可以调用 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

请参见 [Talk mode](/zh-CN/nodes/talk)。

### 10) Skills（第三方 API）

Skills 可以将 `apiKey` 存储在 `skills.entries.<name>.apiKey` 中。如果某个 Skill 使用该密钥访问外部
API，则它可能会按照该 Skill 提供商的规则产生费用。

请参见 [Skills](/zh-CN/tools/skills)。

## 相关内容

- [Token use and costs](/zh-CN/reference/token-use)
- [Prompt caching](/zh-CN/reference/prompt-caching)
- [Usage tracking](/zh-CN/concepts/usage-tracking)
