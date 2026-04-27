---
read_when:
    - 你想启用或配置 `web_search`
    - 你想启用或配置 `x_search`
    - 你需要选择一个搜索提供商
    - 你想了解自动检测和提供商回退机制
sidebarTitle: Web Search
summary: '`web_search`、`x_search` 和 `web_fetch` —— 搜索 Web、搜索 X 帖子，或抓取页面内容'
title: Web 搜索
x-i18n:
    generated_at: "2026-04-27T06:07:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 15
---

`web_search` 工具会使用你配置的提供商搜索 Web 并返回结果。结果会按查询缓存 15 分钟（可配置）。

OpenClaw 还包含用于搜索 X（原 Twitter）帖子的 `x_search`，以及用于轻量抓取 URL 内容的 `web_fetch`。在当前阶段，`web_fetch` 保持本地执行，而 `web_search` 和 `x_search` 可以在底层使用 xAI Responses。

<Info>
  `web_search` 是一个轻量级 HTTP 工具，不是浏览器自动化。对于
  重度依赖 JS 的网站或需要登录的场景，请使用 [Web Browser](/zh-CN/tools/browser)。对于
  抓取特定 URL，请使用 [Web Fetch](/zh-CN/tools/web-fetch)。
</Info>

## 快速开始

<Steps>
  <Step title="选择提供商">
    选择一个提供商并完成所需设置。有些提供商不需要密钥，而有些则需要 API key。详情请参见下方各提供商页面。
  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    ```
    这会保存提供商以及所需的凭证。对于基于 API 的提供商，你也可以设置环境变量（例如 `BRAVE_API_KEY`）并跳过此步骤。
  </Step>
  <Step title="使用">
    现在智能体可以调用 `web_search`：

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    对于 X 帖子，请使用：

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## 选择提供商

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/zh-CN/tools/brave-search">
    带摘要片段的结构化结果。支持 `llm-context` 模式、国家/语言过滤。提供免费层级。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-CN/tools/duckduckgo-search">
    无密钥回退。无需 API key。基于非官方 HTML 集成。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-CN/tools/exa-search">
    神经搜索 + 关键词搜索，并支持内容提取（高亮、文本、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-CN/tools/firecrawl">
    结构化结果。最适合与 `firecrawl_search` 和 `firecrawl_scrape` 配合使用，以进行深度提取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-CN/tools/gemini-search">
    通过 Google Search grounding 提供带引用的 AI 综合答案。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-CN/tools/grok-search">
    通过 xAI Web grounding 提供带引用的 AI 综合答案。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-CN/tools/kimi-search">
    通过 Moonshot Web 搜索提供带引用的 AI 综合答案。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-CN/tools/minimax-search">
    通过 MiniMax Coding Plan 搜索 API 提供结构化结果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/zh-CN/tools/ollama-search">
    通过已登录的本地 Ollama 主机或托管的 Ollama API 进行搜索。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-CN/tools/perplexity-search">
    带内容提取控制和域名过滤的结构化结果。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-CN/tools/searxng-search">
    自托管元搜索。无需 API key。聚合 Google、Bing、DuckDuckGo 等来源。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-CN/tools/tavily">
    带搜索深度、主题过滤的结构化结果，并支持 `tavily_extract` 进行 URL 提取。
  </Card>
</CardGroup>

### 提供商对比

| 提供商 | 结果样式 | 过滤器 | API key |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-CN/tools/brave-search)              | 结构化摘要片段 | 国家、语言、时间、`llm-context` 模式 | `BRAVE_API_KEY` |
| [DuckDuckGo](/zh-CN/tools/duckduckgo-search)    | 结构化摘要片段 | -- | 无（免密钥） |
| [Exa](/zh-CN/tools/exa-search)                  | 结构化 + 提取内容 | 神经/关键词模式、日期、内容提取 | `EXA_API_KEY` |
| [Firecrawl](/zh-CN/tools/firecrawl)             | 结构化摘要片段 | 通过 `firecrawl_search` 工具 | `FIRECRAWL_API_KEY` |
| [Gemini](/zh-CN/tools/gemini-search)            | AI 综合答案 + 引用 | -- | `GEMINI_API_KEY` |
| [Grok](/zh-CN/tools/grok-search)                | AI 综合答案 + 引用 | -- | `XAI_API_KEY` |
| [Kimi](/zh-CN/tools/kimi-search)                | AI 综合答案 + 引用 | -- | `KIMI_API_KEY` / `MOONSHOT_API_KEY` |
| [MiniMax Search](/zh-CN/tools/minimax-search)   | 结构化摘要片段 | 区域（`global` / `cn`） | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` |
| [Ollama Web Search](/zh-CN/tools/ollama-search) | 结构化摘要片段 | -- | 已登录的本地主机无需；直接使用 `https://ollama.com` 搜索时需 `OLLAMA_API_KEY` |
| [Perplexity](/zh-CN/tools/perplexity-search)    | 结构化摘要片段 | 国家、语言、时间、域名、内容限制 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` |
| [SearXNG](/zh-CN/tools/searxng-search)          | 结构化摘要片段 | 分类、语言 | 无（自托管） |
| [Tavily](/zh-CN/tools/tavily)                   | 结构化摘要片段 | 通过 `tavily_search` 工具 | `TAVILY_API_KEY` |

## 自动检测

## 原生 OpenAI Web 搜索

当启用了 OpenClaw Web 搜索且未固定托管提供商时，直接的 OpenAI Responses 模型会自动使用 OpenAI 托管的 `web_search` 工具。这是内置 OpenAI 插件中的提供商自有行为，仅适用于原生 OpenAI API 流量，不适用于 OpenAI 兼容代理 base URL 或 Azure 路由。将 `tools.web.search.provider` 设置为其他提供商（例如 `brave`），可让 OpenAI 模型继续使用托管的 `web_search` 工具；将 `tools.web.search.enabled: false` 则会同时禁用托管搜索和原生 OpenAI 搜索。

## 原生 Codex Web 搜索

支持 Codex 的模型可以选择使用提供商原生的 Responses `web_search` 工具，而不是 OpenClaw 托管的 `web_search` 函数。

- 在 `tools.web.search.openaiCodex` 下配置
- 它仅对支持 Codex 的模型生效（`openai-codex/*` 或使用 `api: "openai-codex-responses"` 的提供商）
- 托管的 `web_search` 仍适用于非 Codex 模型
- `mode: "cached"` 是默认且推荐的设置
- `tools.web.search.enabled: false` 会同时禁用托管搜索和原生搜索

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

如果启用了原生 Codex 搜索，但当前模型并不支持 Codex，OpenClaw 会保留正常的托管 `web_search` 行为。

## 设置 Web 搜索

文档和设置流程中的提供商列表按字母顺序排列。自动检测使用单独的优先级顺序。

如果未设置 `provider`，OpenClaw 会按以下顺序检查提供商，并使用第一个已就绪的提供商：

优先检查基于 API 的提供商：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（顺序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（顺序 15）
3. **Gemini** -- `GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`（顺序 20）
4. **Grok** -- `XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（顺序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（顺序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（顺序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（顺序 60）
8. **Exa** -- `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`（顺序 65）
9. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（顺序 70）

然后是免密钥回退：

10. **DuckDuckGo** -- 无需账户或 API key 的免密钥 HTML 回退（顺序 100）
11. **Ollama Web 搜索** -- 当你配置的本地 Ollama 主机可访问且已通过 `ollama signin` 登录时，可作为免密钥回退；如果主机需要，也可以复用 Ollama provider 的 bearer 认证；在配置了 `OLLAMA_API_KEY` 时，也可以直接调用 `https://ollama.com` 搜索（顺序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（顺序 200）

如果未检测到任何提供商，它会回退到 Brave（你会收到缺少密钥的错误提示，要求你进行配置）。

<Note>
  所有提供商密钥字段都支持 SecretRef 对象。位于
  `plugins.entries.<plugin>.config.webSearch.apiKey` 下的插件作用域 SecretRef
  可用于内置的基于 API 的 Web 搜索提供商，包括 Brave、Exa、Firecrawl、
  Gemini、Grok、Kimi、MiniMax、Perplexity 和 Tavily，
  无论该提供商是通过 `tools.web.search.provider` 显式选择，
  还是通过自动检测选中。在自动检测模式下，OpenClaw 只会解析已选提供商的密钥——未选中的 SecretRef 保持未激活，因此你可以同时配置多个提供商，而无需为未使用的提供商支付解析成本。
</Note>

## 配置

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // 默认：true
        provider: "brave", // 或省略以使用自动检测
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

提供商特定配置（API key、base URL、模式）位于
`plugins.entries.<plugin>.config.webSearch.*` 下。示例请参见各提供商页面。

`web_fetch` 的回退提供商选择是独立的：

- 通过 `tools.web.fetch.provider` 选择
- 或省略该字段，让 OpenClaw 从可用凭证中自动检测第一个已就绪的 web-fetch 提供商
- 当前内置的 web-fetch 提供商是 Firecrawl，配置位于
  `plugins.entries.firecrawl.config.webFetch.*`

当你在 `openclaw onboard` 或
`openclaw configure --section web` 中选择 **Kimi** 时，OpenClaw 还可以询问：

- Moonshot API 区域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 默认 Kimi Web 搜索模型（默认是 `kimi-k2.6`）

对于 `x_search`，请配置 `plugins.entries.xai.config.xSearch.*`。它使用与 Grok Web 搜索相同的 `XAI_API_KEY` 回退。
旧版 `tools.web.x_search.*` 配置可通过 `openclaw doctor --fix` 自动迁移。
当你在 `openclaw onboard` 或 `openclaw configure --section web` 中选择 Grok 时，
OpenClaw 还可以使用同一个密钥提供可选的 `x_search` 设置。
这是 Grok 路径中的一个单独后续步骤，不是单独的顶级
Web 搜索提供商选项。如果你选择了其他提供商，OpenClaw 不会显示 `x_search` 提示。

### 存储 API key

<Tabs>
  <Tab title="配置文件">
    运行 `openclaw configure --section web` 或直接设置密钥：

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="环境变量">
    在 Gateway 网关 进程环境中设置提供商环境变量：

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    对于 Gateway 网关 安装，请将其放在 `~/.openclaw/.env` 中。
    请参见 [环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具参数

| 参数 | 说明 |
| --------------------- | ----------------------------------------------------- |
| `query`               | 搜索查询（必填） |
| `count`               | 返回结果数（1-10，默认：5） |
| `country`             | 2 位 ISO 国家代码（例如 `"US"`、`"DE"`） |
| `language`            | ISO 639-1 语言代码（例如 `"en"`、`"de"`） |
| `search_lang`         | 搜索语言代码（仅 Brave） |
| `freshness`           | 时间过滤：`day`、`week`、`month` 或 `year` |
| `date_after`          | 返回此日期之后的结果（YYYY-MM-DD） |
| `date_before`         | 返回此日期之前的结果（YYYY-MM-DD） |
| `ui_lang`             | UI 语言代码（仅 Brave） |
| `domain_filter`       | 域名 allowlist/denylist 数组（仅 Perplexity） |
| `max_tokens`          | 总内容预算，默认 25000（仅 Perplexity） |
| `max_tokens_per_page` | 每页 token 上限，默认 2048（仅 Perplexity） |

<Warning>
  并非所有参数都适用于所有提供商。Brave 的 `llm-context` 模式
  不接受 `ui_lang`、`freshness`、`date_after` 和 `date_before`。
  Gemini、Grok 和 Kimi 会返回一个带引用的综合答案。
  它们接受 `count` 以兼容共享工具，但这不会改变
  grounding 答案的形状。
  当你使用 Sonar/OpenRouter
  兼容路径（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` 或 `OPENROUTER_API_KEY`）时，Perplexity 的行为也是如此。
  SearXNG 仅对受信任的私有网络或 loopback 主机接受 `http://`；
  公开的 SearXNG 端点必须使用 `https://`。
  Firecrawl 和 Tavily 仅通过 `web_search`
  支持 `query` 和 `count`——如需高级选项，请使用它们各自的专用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查询 X（原 Twitter）帖子，并返回
带引用的 AI 综合答案。它接受自然语言查询和
可选的结构化过滤器。OpenClaw 仅会在服务此工具调用的请求上启用内置 xAI `x_search`
工具。

<Note>
  xAI 文档说明 `x_search` 支持关键词搜索、语义搜索、用户
  搜索和线程抓取。对于单条帖子的互动统计数据，例如转发、回复、收藏或浏览量，请优先对确切帖子 URL
  或状态 ID 进行定向查找。广泛的关键词搜索可能找到正确的帖子，但返回的单帖元数据会不够完整。一个好的模式是：先定位帖子，然后对该确切帖子运行第二次 `x_search` 查询。
</Note>

### x_search 配置

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // 如果已设置 XAI_API_KEY，则可选
          },
        },
      },
    },
  },
}
```

### x_search 参数

| 参数 | 说明 |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 搜索查询（必填） |
| `allowed_x_handles`          | 将结果限制为特定 X 账号 |
| `excluded_x_handles`         | 排除特定 X 账号 |
| `from_date`                  | 仅包含该日期及之后的帖子（YYYY-MM-DD） |
| `to_date`                    | 仅包含该日期及之前的帖子（YYYY-MM-DD） |
| `enable_image_understanding` | 允许 xAI 检查匹配帖子附带的图片 |
| `enable_video_understanding` | 允许 xAI 检查匹配帖子附带的视频 |

### x_search 示例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 单帖统计：尽可能使用确切的状态 URL 或状态 ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 示例

```javascript
// 基本搜索
await web_search({ query: "OpenClaw plugin SDK" });

// 德语定向搜索
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// 最近结果（过去一周）
await web_search({ query: "AI developments", freshness: "week" });

// 日期范围
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 域名过滤（仅 Perplexity）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## 工具配置档

如果你使用工具配置档或 allowlist，请添加 `web_search`、`x_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // 或：allow: ["group:web"]  （包含 web_search、x_search 和 web_fetch）
  },
}
```

## 相关

- [Web Fetch](/zh-CN/tools/web-fetch) -- 抓取 URL 并提取可读内容
- [Web Browser](/zh-CN/tools/browser) -- 面向重度 JS 网站的完整浏览器自动化
- [Grok Search](/zh-CN/tools/grok-search) -- 将 Grok 用作 `web_search` 提供商
- [Ollama Web Search](/zh-CN/tools/ollama-search) -- 通过你的 Ollama 主机进行免密钥 Web 搜索
