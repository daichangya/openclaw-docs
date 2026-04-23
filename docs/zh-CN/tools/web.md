---
read_when:
    - 你希望启用或配置 `web_search`
    - 你希望启用或配置 `x_search`
    - 你需要选择一个搜索 provider
    - 你希望了解自动检测和 provider 回退机制
sidebarTitle: Web Search
summary: '`web_search`、`x_search` 和 `web_fetch` —— 搜索网页、搜索 X 帖子，或抓取页面内容'
title: Web 搜索
x-i18n:
    generated_at: "2026-04-23T21:10:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2713e8b13cf0f3c6bba38bee50c24771b914a5cd235ca521bed434a6ddbe2305
    source_path: tools/web.md
    workflow: 15
---

`web_search` 工具使用你配置好的 provider 搜索网页并返回结果。结果会按查询缓存 15 分钟（可配置）。

OpenClaw 还包含 `x_search`，用于搜索 X（原 Twitter）帖子，以及 `web_fetch`，用于轻量抓取 URL 内容。在当前阶段，`web_fetch` 保持本地执行，而 `web_search` 和 `x_search` 则可以在底层使用 xAI Responses。

<Info>
  `web_search` 是一个轻量级 HTTP 工具，不是浏览器自动化。对于
  重度依赖 JS 的网站或登录场景，请使用 [Web Browser](/zh-CN/tools/browser)。对于
  获取特定 URL，请使用 [Web Fetch](/zh-CN/tools/web-fetch)。
</Info>

## 快速开始

<Steps>
  <Step title="选择一个 provider">
    选择一个 provider 并完成所需设置。有些 providers
    不需要密钥，而有些则使用 API 密钥。具体细节请查看下面的 provider 页面。
  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    ```
    这会保存 provider 和所需的凭证。你也可以设置环境变量
    （例如 `BRAVE_API_KEY`），并对基于 API 的
    providers 跳过这一步。
  </Step>
  <Step title="使用它">
    智能体现在可以调用 `web_search`：

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    对于 X 帖子，请使用：

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## 选择 provider

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/zh-CN/tools/brave-search">
    带摘要的结构化结果。支持 `llm-context` 模式、国家/语言过滤。提供免费层级。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-CN/tools/duckduckgo-search">
    无需密钥的回退方案。无需 API 密钥。基于 HTML 的非官方集成。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-CN/tools/exa-search">
    神经搜索 + 关键词搜索，并带内容提取（高亮、正文、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-CN/tools/firecrawl">
    结构化结果。与 `firecrawl_search` 和 `firecrawl_scrape` 搭配可获得深度提取能力。
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
  <Card title="Ollama Web 搜索" icon="globe" href="/zh-CN/tools/ollama-search">
    通过你配置的 Ollama 主机提供无需密钥的搜索。需要 `ollama signin`。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-CN/tools/perplexity-search">
    带内容提取控制和域过滤的结构化结果。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-CN/tools/searxng-search">
    自托管元搜索。无需 API 密钥。可聚合 Google、Bing、DuckDuckGo 等。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-CN/tools/tavily">
    带搜索深度、主题过滤，以及用于 URL 提取的 `tavily_extract` 的结构化结果。
  </Card>
</CardGroup>

### Provider 对比

| Provider                                   | 结果样式                 | 过滤器                                            | API 密钥                                                                          |
| ------------------------------------------ | ------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| [Brave](/zh-CN/tools/brave-search)               | 结构化摘要               | 国家、语言、时间、`llm-context` 模式              | `BRAVE_API_KEY`                                                                   |
| [DuckDuckGo](/zh-CN/tools/duckduckgo-search)     | 结构化摘要               | --                                                | 无（无需密钥）                                                                    |
| [Exa](/zh-CN/tools/exa-search)                   | 结构化 + 提取内容        | 神经/关键词模式、日期、内容提取                  | `EXA_API_KEY`                                                                     |
| [Firecrawl](/zh-CN/tools/firecrawl)              | 结构化摘要               | 通过 `firecrawl_search` 工具                      | `FIRECRAWL_API_KEY`                                                               |
| [Gemini](/zh-CN/tools/gemini-search)             | AI 综合答案 + 引用       | --                                                | `GEMINI_API_KEY`                                                                  |
| [Grok](/zh-CN/tools/grok-search)                 | AI 综合答案 + 引用       | --                                                | `XAI_API_KEY`                                                                     |
| [Kimi](/zh-CN/tools/kimi-search)                 | AI 综合答案 + 引用       | --                                                | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                               |
| [MiniMax Search](/zh-CN/tools/minimax-search)    | 结构化摘要               | 区域（`global` / `cn`）                           | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                |
| [Ollama Web 搜索](/zh-CN/tools/ollama-search)    | 结构化摘要               | --                                                | 默认无；需要 `ollama signin`，并且在主机要求时可复用 Ollama provider bearer auth |
| [Perplexity](/zh-CN/tools/perplexity-search)     | 结构化摘要               | 国家、语言、时间、域名、内容限制                  | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                       |
| [SearXNG](/zh-CN/tools/searxng-search)           | 结构化摘要               | 分类、语言                                        | 无（自托管）                                                                      |
| [Tavily](/zh-CN/tools/tavily)                    | 结构化摘要               | 通过 `tavily_search` 工具                         | `TAVILY_API_KEY`                                                                  |

## 自动检测

## 原生 OpenAI Web 搜索

直接 OpenAI Responses 模型会在启用了 OpenClaw Web 搜索且未固定某个受管 provider 时，自动使用 OpenAI 托管的 `web_search` 工具。这是内置 OpenAI 插件中的 provider 自有行为，并且仅适用于原生 OpenAI API 流量，不适用于兼容 OpenAI 的代理 base URL 或 Azure 路由。将 `tools.web.search.provider` 设置为诸如 `brave` 的其他 provider，可以让 OpenAI 模型继续使用受管 `web_search` 工具；如果将 `tools.web.search.enabled: false`，则会同时禁用受管搜索和原生 OpenAI 搜索。

## 原生 Codex Web 搜索

支持 Codex 的模型可以选择使用 provider 原生的 Responses `web_search` 工具，而不是 OpenClaw 受管的 `web_search` 函数。

- 在 `tools.web.search.openaiCodex` 下进行配置
- 仅对支持 Codex 的模型激活（`openai-codex/*` 或使用 `api: "openai-codex-responses"` 的 providers）
- 受管 `web_search` 仍适用于非 Codex 模型
- `mode: "cached"` 是默认且推荐设置
- `tools.web.search.enabled: false` 会同时禁用受管搜索和原生搜索

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

如果启用了原生 Codex 搜索，但当前模型不具备 Codex 能力，OpenClaw 会继续保持正常的受管 `web_search` 行为。

## 设置 Web 搜索

文档和设置流程中的 provider 列表按字母顺序排列。自动检测则采用单独的优先级顺序。

如果没有设置 `provider`，OpenClaw 会按以下顺序检查 providers，并使用
第一个已就绪的 provider：

先检查基于 API 的 providers：

1. **Brave** —— `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（顺序 10）
2. **MiniMax Search** —— `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（顺序 15）
3. **Gemini** —— `GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`（顺序 20）
4. **Grok** —— `XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（顺序 30）
5. **Kimi** —— `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（顺序 40）
6. **Perplexity** —— `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（顺序 50）
7. **Firecrawl** —— `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（顺序 60）
8. **Exa** —— `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`（顺序 65）
9. **Tavily** —— `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（顺序 70）

之后才是无需密钥的回退项：

10. **DuckDuckGo** —— 无需账号或 API 密钥的 HTML 回退方案（顺序 100）
11. **Ollama Web 搜索** —— 通过你配置的 Ollama 主机提供的无需密钥回退；要求 Ollama 可达并已通过 `ollama signin` 登录；如果主机需要，也可复用 Ollama provider bearer auth（顺序 110）
12. **SearXNG** —— `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（顺序 200）

如果没有检测到任何 provider，则会回退到 Brave（你会看到缺失密钥
错误，并提示你进行配置）。

<Note>
  所有 provider 密钥字段都支持 SecretRef 对象。位于
  `plugins.entries.<plugin>.config.webSearch.apiKey` 下的插件作用域 SecretRefs
  会为内置的 Exa、Firecrawl、Gemini、Grok、Kimi、Perplexity 和 Tavily providers 进行解析，
  无论 provider 是通过 `tools.web.search.provider` 显式选择，还是通过自动检测选中。
  在自动检测模式下，OpenClaw 只会解析被选中的
  provider 密钥——未选中的 SecretRefs 会保持未激活，因此你可以
  同时配置多个 providers，而无需为未使用的
  providers 支付解析成本。
</Note>

## 配置

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // 默认：true
        provider: "brave", // 或省略以启用自动检测
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

provider 专用配置（API 密钥、base URL、模式）位于
`plugins.entries.<plugin>.config.webSearch.*` 下。示例请参阅各 provider 页面。

`web_fetch` 的回退 provider 选择是独立的：

- 使用 `tools.web.fetch.provider` 选择它
- 或省略该字段，让 OpenClaw 从可用凭证中自动检测第一个就绪的
  web-fetch provider
- 当前内置的 web-fetch provider 是 Firecrawl，配置位于
  `plugins.entries.firecrawl.config.webFetch.*`

当你在 `openclaw onboard` 或
`openclaw configure --section web` 中选择 **Kimi** 时，OpenClaw 还可能询问：

- Moonshot API 区域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 默认 Kimi Web 搜索模型（默认 `kimi-k2.6`）

对于 `x_search`，请配置 `plugins.entries.xai.config.xSearch.*`。它会使用
与 Grok Web 搜索相同的 `XAI_API_KEY` 回退。
旧版 `tools.web.x_search.*` 配置可由 `openclaw doctor --fix` 自动迁移。
当你在 `openclaw onboard` 或 `openclaw configure --section web` 中选择 Grok 时，
OpenClaw 还会提供可选的 `x_search` 设置，并复用同一个密钥。
这是 Grok 路径中的一个单独后续步骤，而不是单独的顶层
Web 搜索 provider 选项。如果你选择了其他 provider，OpenClaw 就不会
显示 `x_search` 提示。

### 存储 API 密钥

<Tabs>
  <Tab title="配置文件">
    运行 `openclaw configure --section web`，或直接设置密钥：

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
    在 Gateway 网关进程环境中设置 provider 环境变量：

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    对于 gateway 安装，请将其放入 `~/.openclaw/.env`。
    请参阅[环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具参数

| 参数                  | 说明                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | 搜索查询（必填）                                      |
| `count`               | 返回结果数量（1-10，默认：5）                         |
| `country`             | 2 位 ISO 国家代码（例如 `"US"`、`"DE"`）              |
| `language`            | ISO 639-1 语言代码（例如 `"en"`、`"de"`）             |
| `search_lang`         | 搜索语言代码（仅 Brave）                              |
| `freshness`           | 时间过滤器：`day`、`week`、`month` 或 `year`          |
| `date_after`          | 该日期之后的结果（YYYY-MM-DD）                        |
| `date_before`         | 该日期之前的结果（YYYY-MM-DD）                        |
| `ui_lang`             | UI 语言代码（仅 Brave）                               |
| `domain_filter`       | 域名允许列表/拒绝列表数组（仅 Perplexity）            |
| `max_tokens`          | 总内容预算，默认 25000（仅 Perplexity）               |
| `max_tokens_per_page` | 每页 token 上限，默认 2048（仅 Perplexity）           |

<Warning>
  并非所有参数都适用于所有 providers。Brave 的 `llm-context` 模式
  会拒绝 `ui_lang`、`freshness`、`date_after` 和 `date_before`。
  Gemini、Grok 和 Kimi 会返回一个带引用的综合答案。它们
  出于共享工具兼容性会接受 `count`，但这不会改变
  grounded 答案的结构。
  当你使用 Sonar/OpenRouter
  兼容路径（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` 或 `OPENROUTER_API_KEY`）时，Perplexity 的行为也是如此。
  SearXNG 仅在受信任的私有网络或 loopback 主机上接受 `http://`；
  公共 SearXNG 端点必须使用 `https://`。
  Firecrawl 和 Tavily 在 `web_search`
  中只支持 `query` 和 `count` —— 更高级的选项请使用它们各自的专用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查询 X（原 Twitter）帖子，并返回
带引用的 AI 综合答案。它接受自然语言查询以及
可选的结构化过滤器。OpenClaw 仅会在服务当前工具调用的请求中启用
内置 xAI `x_search`
工具。

<Note>
  xAI 文档中说明 `x_search` 支持关键词搜索、语义搜索、用户
  搜索以及线程抓取。对于单条帖子的互动统计数据，例如转发、
  回复、收藏或浏览量，最好针对确切的帖子 URL
  或状态 ID 执行定向查询。宽泛的关键词搜索也许能找到正确帖子，但返回的
  单帖元数据可能不够完整。一个好的模式是：先定位帖子，然后
  再运行第二次聚焦于该确切帖子的 `x_search` 查询。
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

| 参数                         | 说明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 搜索查询（必填）                                       |
| `allowed_x_handles`          | 将结果限制为特定 X handles                             |
| `excluded_x_handles`         | 排除特定 X handles                                     |
| `from_date`                  | 仅包含该日期及之后的帖子（YYYY-MM-DD）                 |
| `to_date`                    | 仅包含该日期及之前的帖子（YYYY-MM-DD）                 |
| `enable_image_understanding` | 允许 xAI 检查匹配帖子所附图像                          |
| `enable_video_understanding` | 允许 xAI 检查匹配帖子所附视频                          |

### x_search 示例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 单帖统计：尽可能使用确切状态 URL 或状态 ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 示例

```javascript
// 基础搜索
await web_search({ query: "OpenClaw plugin SDK" });

// 德语特定搜索
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

如果你使用工具配置档或允许列表，请加入 `web_search`、`x_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // 或：allow: ["group:web"]  （包含 web_search、x_search 和 web_fetch）
  },
}
```

## 相关内容

- [Web Fetch](/zh-CN/tools/web-fetch) —— 抓取 URL 并提取可读内容
- [Web Browser](/zh-CN/tools/browser) —— 面向重度 JS 网站的完整浏览器自动化
- [Grok Search](/zh-CN/tools/grok-search) —— 将 Grok 作为 `web_search` provider
- [Ollama Web 搜索](/zh-CN/tools/ollama-search) —— 通过你的 Ollama 主机实现无需密钥的 Web 搜索
