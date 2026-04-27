---
read_when:
    - 你想使用由 Tavily 支持的 web 搜索
    - 你需要一个 Tavily API key
    - 你想将 Tavily 作为 `web_search` provider
    - 你想从 URL 中提取内容
summary: Tavily 搜索与提取工具
title: Tavily
x-i18n:
    generated_at: "2026-04-23T21:10:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 15
---

OpenClaw 可以通过两种方式使用 **Tavily**：

- 作为 `web_search` provider
- 作为显式插件工具：`tavily_search` 和 `tavily_extract`

Tavily 是一个面向 AI 应用设计的搜索 API，返回针对 LLM 消费优化的结构化结果。它支持可配置的搜索深度、主题过滤、域名过滤、AI 生成的答案摘要，以及从 URL 提取内容（包括 JavaScript 渲染页面）。

## 获取 API key

1. 在 [tavily.com](https://tavily.com/) 创建一个 Tavily 账户。
2. 在控制台中生成一个 API key。
3. 将它存入配置，或在 gateway 环境中设置 `TAVILY_API_KEY`。

## 配置 Tavily 搜索

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // 如果已设置 TAVILY_API_KEY，则可选
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

说明：

- 在新手引导中选择 Tavily，或执行 `openclaw configure --section web` 时选择 Tavily，都会自动启用内置 Tavily 插件。
- Tavily 配置应存放在 `plugins.entries.tavily.config.webSearch.*` 下。
- 使用 Tavily 的 `web_search` 支持 `query` 和 `count`（最多 20 条结果）。
- 如果你需要 Tavily 专用控制项，如 `search_depth`、`topic`、`include_answer` 或域名过滤，请使用 `tavily_search`。

## Tavily 插件工具

### `tavily_search`

当你希望使用 Tavily 专用搜索控制，而不是通用的
`web_search` 时，请使用它。

| 参数 | 描述 |
| ----------------- | --------------------------------------------------------------------- |
| `query` | 搜索查询字符串（请保持在 400 个字符以内） |
| `search_depth` | `basic`（默认，均衡）或 `advanced`（相关性最高，但更慢） |
| `topic` | `general`（默认）、`news`（实时更新）或 `finance` |
| `max_results` | 结果数量，1–20（默认：5） |
| `include_answer` | 是否包含 AI 生成的答案摘要（默认：false） |
| `time_range` | 按时间新近性过滤：`day`、`week`、`month` 或 `year` |
| `include_domains` | 用于限制结果范围的域名数组 |
| `exclude_domains` | 需要从结果中排除的域名数组 |

**搜索深度：**

| 深度 | 速度 | 相关性 | 最适合 |
| ---------- | ------ | --------- | ----------------------------------- |
| `basic` | 更快 | 高 | 通用查询（默认） |
| `advanced` | 更慢 | 最高 | 高精度、特定事实、研究 |

### `tavily_extract`

当你需要从一个或多个 URL 中提取干净内容时，请使用它。它支持
JavaScript 渲染页面，并支持基于查询聚焦的分块，以实现定向
提取。

| 参数 | 描述 |
| ------------------- | ---------------------------------------------------------- |
| `urls` | 要提取的 URL 数组（每次请求 1–20 个） |
| `query` | 按与该查询的相关性对提取出的块重新排序 |
| `extract_depth` | `basic`（默认，快速）或 `advanced`（适用于重 JS 页面） |
| `chunks_per_source` | 每个 URL 的块数，1–5（要求提供 `query`） |
| `include_images` | 是否在结果中包含图片 URL（默认：false） |

**提取深度：**

| 深度 | 使用场景 |
| ---------- | ----------------------------------------- |
| `basic` | 简单页面——优先尝试它 |
| `advanced` | JS 渲染的 SPA、动态内容、表格 |

提示：

- 每次请求最多 20 个 URL。更大的列表请拆成多次调用。
- 使用 `query` + `chunks_per_source` 可只获取相关内容，而不是整页内容。
- 优先尝试 `basic`；如果内容缺失或不完整，再回退到 `advanced`。

## 选择正确的工具

| 需求 | 工具 |
| ------------------------------------ | ---------------- |
| 快速 web 搜索，无需特殊选项 | `web_search` |
| 带深度、主题、AI 答案的搜索 | `tavily_search` |
| 从特定 URL 中提取内容 | `tavily_extract` |

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) —— 所有 provider 与自动检测
- [Firecrawl](/zh-CN/tools/firecrawl) —— 带内容提取的搜索 + 抓取
- [Exa 搜索](/zh-CN/tools/exa-search) —— 带内容提取的神经搜索
