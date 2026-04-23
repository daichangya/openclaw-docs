---
read_when:
    - 你想使用 Perplexity Search 进行网页搜索
    - 你需要设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
summary: 用于 `web_search` 的 Perplexity Search API 以及 Sonar / OpenRouter 兼容性
title: Perplexity 搜索
x-i18n:
    generated_at: "2026-04-23T21:09:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a6820c0ac45e30bf08b9739f528ce1e1434d1fe0b537d2b682332e28d3f8aec
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw 支持将 Perplexity Search API 用作 `web_search` 提供商。
它会返回带有 `title`、`url` 和 `snippet` 字段的结构化结果。

出于兼容性考虑，OpenClaw 也支持旧版 Perplexity Sonar / OpenRouter 配置。
如果你使用 `OPENROUTER_API_KEY`，或在 `plugins.entries.perplexity.config.webSearch.apiKey` 中使用 `sk-or-...` key，或者设置了 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，该提供商会切换到 chat-completions 路径，并返回带引用的 AI 综合答案，而不是结构化的 Search API 结果。

## 获取 Perplexity API key

1. 在 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 创建一个 Perplexity 账户
2. 在 dashboard 中生成一个 API key
3. 将该 key 存储到配置中，或在 Gateway 网关环境中设置 `PERPLEXITY_API_KEY`。

## OpenRouter 兼容性

如果你之前已经通过 OpenRouter 使用 Perplexity Sonar，请继续使用 `provider: "perplexity"`，并在 Gateway 网关环境中设置 `OPENROUTER_API_KEY`，或者在 `plugins.entries.perplexity.config.webSearch.apiKey` 中存储一个 `sk-or-...` key。

可选的兼容性控制项：

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 配置示例

### 原生 Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter / Sonar 兼容性

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## 在哪里设置 key

**通过配置：** 运行 `openclaw configure --section web`。它会将 key 存储在
`~/.openclaw/openclaw.json` 的 `plugins.entries.perplexity.config.webSearch.apiKey` 下。
该字段也接受 SecretRef 对象。

**通过环境变量：** 在 Gateway 网关进程环境中设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`。
对于 Gateway 网关安装，请将其放入
`~/.openclaw/.env`（或你的服务环境）中。请参阅 [环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

如果已配置 `provider: "perplexity"`，且 Perplexity key 的 SecretRef 无法解析，同时又没有环境变量回退，则启动 / 热重载会快速失败。

## 工具参数

这些参数适用于原生 Perplexity Search API 路径。

| 参数 | 说明 |
| --------------------- | ---------------------------------------------------- |
| `query` | 搜索查询（必填） |
| `count` | 返回结果数（1-10，默认：5） |
| `country` | 2 字母 ISO 国家代码（例如 `"US"`、`"DE"`） |
| `language` | ISO 639-1 语言代码（例如 `"en"`、`"de"`、`"fr"`） |
| `freshness` | 时间过滤：`day`（24 小时）、`week`、`month` 或 `year` |
| `date_after` | 仅返回此日期之后发布的结果（YYYY-MM-DD） |
| `date_before` | 仅返回此日期之前发布的结果（YYYY-MM-DD） |
| `domain_filter` | 域名允许列表 / 拒绝列表数组（最多 20 个） |
| `max_tokens` | 总内容预算（默认：25000，最大：1000000） |
| `max_tokens_per_page` | 每页 token 限制（默认：2048） |

对于旧版 Sonar / OpenRouter 兼容路径：

- 接受 `query`、`count` 和 `freshness`
- 其中的 `count` 仅用于兼容；响应仍然是一个带引用的综合答案，
  而不是 N 条结果列表
- Search API 专用过滤项，如 `country`、`language`、`date_after`、
  `date_before`、`domain_filter`、`max_tokens` 和 `max_tokens_per_page`
  会返回显式错误

**示例：**

```javascript
// 按国家和语言搜索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近结果（过去一周）
await web_search({
  query: "AI news",
  freshness: "week",
});

// 日期范围搜索
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 域名过滤（允许列表）
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 域名过滤（拒绝列表 - 使用 - 前缀）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// 提取更多内容
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 域名过滤规则

- 每个过滤器最多 20 个域名
- 同一请求中不能同时混用允许列表和拒绝列表
- 对拒绝列表条目使用 `-` 前缀（例如 `["-reddit.com"]`）

## 说明

- Perplexity Search API 返回结构化网页搜索结果（`title`、`url`、`snippet`）
- OpenRouter 或显式设置 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 会为兼容性将 Perplexity 切回 Sonar chat completions
- Sonar / OpenRouter 兼容路径返回的是一个带引用的综合答案，而不是结构化结果行
- 结果默认缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）

## 相关内容

- [网页搜索概览](/zh-CN/tools/web) -- 所有提供商与自动检测
- [Perplexity Search API 文档](https://docs.perplexity.ai/docs/search/quickstart) -- 官方 Perplexity 文档
- [Brave Search](/zh-CN/tools/brave-search) -- 带国家 / 语言过滤的结构化结果
- [Exa Search](/zh-CN/tools/exa-search) -- 带内容提取的神经搜索
