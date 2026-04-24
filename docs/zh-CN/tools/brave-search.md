---
read_when:
    - 你想将 Brave Search 用于 `web_search`
    - 你需要 `BRAVE_API_KEY` 或套餐详情
summary: 用于 `web_search` 的 Brave Search API 设置
title: Brave 搜索
x-i18n:
    generated_at: "2026-04-24T02:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw 支持将 Brave Search API 作为 `web_search` 提供商。

## 获取 API 密钥

1. 在 [https://brave.com/search/api/](https://brave.com/search/api/) 创建 Brave Search API 账户
2. 在控制台中，选择 **Search** 套餐并生成 API 密钥。
3. 将密钥存储在配置中，或在 Gateway 网关环境中设置 `BRAVE_API_KEY`。

## 配置示例

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

提供商专用的 Brave 搜索设置现在位于 `plugins.entries.brave.config.webSearch.*` 下。
旧版的 `tools.web.search.apiKey` 仍会通过兼容层加载，但它不再是规范的配置路径。

`webSearch.mode` 用于控制 Brave 传输方式：

- `web`（默认）：标准的 Brave 网页搜索，返回标题、URL 和摘要
- `llm-context`：Brave LLM Context API，返回预先提取的文本块和来源以用于依据支撑

## 工具参数

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
搜索结果使用的 ISO 639-1 语言代码（例如 `en`、`de`、`fr`）。
</ParamField>

<ParamField path="search_lang" type="string">
Brave 搜索语言代码（例如 `en`、`en-gb`、`zh-hans`）。
</ParamField>

<ParamField path="ui_lang" type="string">
UI 元素使用的 ISO 语言代码。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间过滤器——`day` 表示 24 小时。
</ParamField>

<ParamField path="date_after" type="string">
仅返回此日期之后发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
仅返回此日期之前发布的结果（`YYYY-MM-DD`）。
</ParamField>

**示例：**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## 注意事项

- OpenClaw 使用 Brave **Search** 套餐。如果你使用的是旧版订阅（例如最初每月 2,000 次查询的免费套餐），它仍然有效，但不包含 LLM Context 或更高限速等较新功能。
- 每个 Brave 套餐都包含 **每月 5 美元的免费额度**（按月续期）。Search 套餐的费用是每 1,000 次请求 5 美元，因此该额度可覆盖每月 1,000 次查询。请在 Brave 控制台中设置使用上限，以避免产生意外费用。当前套餐信息请参阅 [Brave API 门户](https://brave.com/search/api/)。
- Search 套餐包含 LLM Context 端点和 AI 推理权利。若要存储结果以训练或微调模型，则需要具有明确存储权利的套餐。请参阅 Brave 的 [服务条款](https://api-dashboard.search.brave.com/terms-of-service)。
- `llm-context` 模式返回有依据支撑的来源条目，而不是常规网页搜索摘要结构。
- `llm-context` 模式不支持 `ui_lang`、`freshness`、`date_after` 或 `date_before`。
- `ui_lang` 必须包含区域子标签，例如 `en-US`。
- 结果默认缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Perplexity Search](/zh-CN/tools/perplexity-search) -- 带域名过滤的结构化结果
- [Exa Search](/zh-CN/tools/exa-search) -- 带内容提取的神经搜索
