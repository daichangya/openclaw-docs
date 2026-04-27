---
read_when:
    - 你想使用 Perplexity 搜索进行网页搜索
    - 你需要设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
summary: 用于 `web_search` 的 Perplexity Search API 与 Sonar/OpenRouter 兼容性
title: Perplexity 搜索
x-i18n:
    generated_at: "2026-04-24T02:51:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity 搜索 API

OpenClaw 支持将 Perplexity 搜索 API 作为 `web_search` 提供商使用。
它会返回包含 `title`、`url` 和 `snippet` 字段的结构化结果。

为了兼容性，OpenClaw 也支持旧版的 Perplexity Sonar/OpenRouter 配置。
如果你使用 `OPENROUTER_API_KEY`、在 `plugins.entries.perplexity.config.webSearch.apiKey` 中使用 `sk-or-...` 密钥，或设置 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，该提供商会切换到 chat-completions 路径，并返回带引用的 AI 综合答案，而不是结构化的搜索 API 结果。

## 获取 Perplexity API 密钥

1. 在 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 创建一个 Perplexity 账户
2. 在控制台中生成一个 API 密钥
3. 将该密钥存储到配置中，或在 Gateway 网关环境中设置 `PERPLEXITY_API_KEY`。

## OpenRouter 兼容性

如果你已经在使用 OpenRouter 访问 Perplexity Sonar，请继续保留 `provider: "perplexity"`，并在 Gateway 网关环境中设置 `OPENROUTER_API_KEY`，或在 `plugins.entries.perplexity.config.webSearch.apiKey` 中存储一个 `sk-or-...` 密钥。

可选兼容性控制项：

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 配置示例

### 原生 Perplexity 搜索 API

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

## 在哪里设置密钥

**通过配置：** 运行 `openclaw configure --section web`。它会将密钥存储到
`~/.openclaw/openclaw.json` 中的 `plugins.entries.perplexity.config.webSearch.apiKey`。
该字段也接受 SecretRef 对象。

**通过环境：** 在 Gateway 网关进程环境中设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`。
对于 Gateway 网关安装，请将其放在
`~/.openclaw/.env` 中（或你的服务环境中）。参见 [环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

如果已配置 `provider: "perplexity"`，且 Perplexity 密钥的 SecretRef 未解析并且没有环境变量回退，则启动/重载会快速失败。

## 工具参数

这些参数适用于原生 Perplexity 搜索 API 路径。

<ParamField path="query" type="string" required>
搜索查询。
</ParamField>

<ParamField path="count" type="number" default="5">
返回结果数量（1–10）。
</ParamField>

<ParamField path="country" type="string">
2 位 ISO 国家代码（例如 `US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 语言代码（例如 `en`、`de`、`fr`）。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间过滤器 —— `day` 表示 24 小时。
</ParamField>

<ParamField path="date_after" type="string">
仅返回此日期之后发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
仅返回此日期之前发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="domain_filter" type="string[]">
域名允许列表/拒绝列表数组（最多 20 个）。
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
内容总预算（最大 1000000）。
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
每页 token 上限。
</ParamField>

对于旧版 Sonar/OpenRouter 兼容路径：

- 接受 `query`、`count` 和 `freshness`
- 其中的 `count` 仅用于兼容；响应仍然是单个带引用的综合答案，而不是 N 条结果列表
- 仅搜索 API 支持的过滤器，例如 `country`、`language`、`date_after`、
  `date_before`、`domain_filter`、`max_tokens` 和 `max_tokens_per_page`
  会返回明确错误

**示例：**

```javascript
// 指定国家和语言的搜索
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
- 同一个请求中不能混用允许列表和拒绝列表
- 对拒绝列表条目使用 `-` 前缀（例如 `["-reddit.com"]`）

## 说明

- Perplexity 搜索 API 会返回结构化的网页搜索结果（`title`、`url`、`snippet`）
- OpenRouter 或显式设置 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 会让 Perplexity 出于兼容性切回 Sonar chat completions
- Sonar/OpenRouter 兼容模式会返回单个带引用的综合答案，而不是结构化结果行
- 默认会将结果缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）

## 相关内容

- [网页搜索概览](/zh-CN/tools/web) -- 所有提供商与自动检测
- [Perplexity 搜索 API 文档](https://docs.perplexity.ai/docs/search/quickstart) -- Perplexity 官方文档
- [Brave 搜索](/zh-CN/tools/brave-search) -- 支持国家/语言过滤的结构化结果
- [Exa 搜索](/zh-CN/tools/exa-search) -- 带内容提取的神经搜索
