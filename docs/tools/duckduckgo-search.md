---
read_when:
    - 你想要一个不需要 API 密钥的网页搜索提供商
    - 你想要将 DuckDuckGo 用于 `web_search`
    - 你需要一个零配置的搜索回退方案
summary: DuckDuckGo 网页搜索 —— 无需密钥的回退提供商（实验性，基于 HTML）
title: DuckDuckGo 搜索
x-i18n:
    generated_at: "2026-04-24T02:51:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw 支持将 DuckDuckGo 作为**无需密钥**的 `web_search` 提供商。无需 API 密钥或账号。

<Warning>
  DuckDuckGo 是一个**实验性、非官方**集成，它从 DuckDuckGo 的非 JavaScript 搜索页面抓取结果——而不是官方 API。由于机器人挑战页面或 HTML 变更，可能会偶尔失效。
</Warning>

## 设置

无需 API 密钥——只需将 DuckDuckGo 设为你的提供商：

<Steps>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    # 选择 "duckduckgo" 作为提供商
    ```
  </Step>
</Steps>

## 配置

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

用于区域和 SafeSearch 的可选插件级设置：

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo 区域代码
            safeSearch: "moderate", // "strict"、"moderate" 或 "off"
          },
        },
      },
    },
  },
}
```

## 工具参数

<ParamField path="query" type="string" required>
搜索查询。
</ParamField>

<ParamField path="count" type="number" default="5">
返回的结果数量（1–10）。
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 区域代码（例如 `us-en`、`uk-en`、`de-de`）。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch 级别。
</ParamField>

区域和 SafeSearch 也可以在插件配置中设置（见上文）——工具参数会按每次查询覆盖配置值。

## 注意事项

- **无需 API 密钥**——开箱即用，零配置
- **实验性**——从 DuckDuckGo 的非 JavaScript HTML 搜索页面收集结果，而不是官方 API 或 SDK
- **机器人挑战风险**——在高频或自动化使用下，DuckDuckGo 可能会返回 CAPTCHA 或阻止请求
- **HTML 解析**——结果依赖页面结构，而页面结构可能会在不另行通知的情况下发生变化
- **自动检测顺序**——DuckDuckGo 是自动检测中的首个无需密钥回退方案（顺序 100）。已配置密钥的 API 支持提供商会优先运行，然后是 Ollama Web 搜索（顺序 110），再然后是 SearXNG（顺序 200）
- **SafeSearch 默认为 moderate**，如果未进行配置

<Tip>
  对于生产环境使用，可考虑 [Brave Search](/zh-CN/tools/brave-search)（提供免费层级）或其他基于 API 的提供商。
</Tip>

## 相关内容

- [网页搜索概览](/zh-CN/tools/web) —— 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) —— 提供免费层级的结构化结果
- [Exa Search](/zh-CN/tools/exa-search) —— 带内容提取的神经搜索
