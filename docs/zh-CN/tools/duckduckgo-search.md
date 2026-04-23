---
read_when:
    - 你希望使用一个无需 API 密钥的 Web 搜索 provider
    - 你希望将 DuckDuckGo 用于 `web_search`
    - 你需要一个零配置的搜索回退方案
summary: DuckDuckGo Web 搜索 —— 无需密钥的回退 provider（实验性，基于 HTML）
title: DuckDuckGo 搜索
x-i18n:
    generated_at: "2026-04-23T21:07:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2897231bcd21ebd80afb5182e9f5427b66d3d6a1cc956bb373484b4d9e0b83a
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw 支持将 DuckDuckGo 作为**无需密钥**的 `web_search` provider。无需 API
密钥，也无需账户。

<Warning>
  DuckDuckGo 是一个**实验性、非官方**集成，它从 DuckDuckGo 的非 JavaScript 搜索页面抓取结果——而不是官方 API。请预期它偶尔会因为机器人挑战页面或 HTML 变更而失效。
</Warning>

## 设置

无需 API 密钥——只需将 DuckDuckGo 设为你的 provider：

<Steps>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    # 选择 "duckduckgo" 作为 provider
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

可选的插件级设置，用于区域和 SafeSearch：

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

| 参数         | 说明                                                         |
| ------------ | ------------------------------------------------------------ |
| `query`      | 搜索查询（必填）                                             |
| `count`      | 返回结果数量（1-10，默认：5）                                |
| `region`     | DuckDuckGo 区域代码（例如 `us-en`、`uk-en`、`de-de`）        |
| `safeSearch` | SafeSearch 级别：`strict`、`moderate`（默认）或 `off`        |

区域和 SafeSearch 也可以在插件配置中设置（见上文）——工具参数会按查询覆盖配置值。

## 说明

- **无需 API 密钥**——开箱即用，零配置
- **实验性**——结果来自 DuckDuckGo 的非 JavaScript HTML
  搜索页面，而不是官方 API 或 SDK
- **机器人挑战风险**——在高频或自动化使用下，DuckDuckGo 可能返回 CAPTCHA 或阻止请求
- **HTML 解析**——结果依赖页面结构，而页面结构可能在没有通知的情况下发生变化
- **自动检测顺序**——DuckDuckGo 是自动检测中的第一个无需密钥回退项
  （顺序 100）。带有已配置密钥的 API 型 providers 会优先运行，
  然后是 Ollama Web 搜索（顺序 110），再然后是 SearXNG（顺序 200）
- **SafeSearch 默认是 moderate**，如果未配置则如此

<Tip>
  对于生产用途，请考虑使用 [Brave Search](/zh-CN/tools/brave-search)（提供免费层级）
  或其他基于 API 的 provider。
</Tip>

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) —— 所有 providers 与自动检测
- [Brave Search](/zh-CN/tools/brave-search) —— 提供结构化结果和免费层级
- [Exa Search](/zh-CN/tools/exa-search) —— 带内容提取的神经搜索
