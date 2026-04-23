---
read_when:
    - 你希望将 Gemini 用于 `web_search`
    - 你需要一个 `GEMINI_API_KEY`
    - 你希望使用 Google Search grounding
summary: 通过 Google Search grounding 实现的 Gemini Web 搜索
title: Gemini 搜索
x-i18n:
    generated_at: "2026-04-23T21:08:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw 支持带有内置
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)
的 Gemini 模型，它会返回由实时 Google 搜索结果支撑、带有引用的 AI 综合答案。

## 获取 API 密钥

<Steps>
  <Step title="创建密钥">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 并创建一个
    API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `GEMINI_API_KEY`，或者通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 配置

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // 如果已设置 GEMINI_API_KEY，则可选
            model: "gemini-2.5-flash", // 默认值
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**环境变量替代方式：** 在 Gateway 网关环境中设置 `GEMINI_API_KEY`。
对于 gateway 安装，请将其放到 `~/.openclaw/.env` 中。

## 工作原理

与返回链接和摘要列表的传统搜索 providers 不同，
Gemini 使用 Google Search grounding 生成带有
内联引用的 AI 综合答案。结果同时包含综合答案和源
URL。

- 来自 Gemini grounding 的引用 URL 会自动从 Google
  重定向 URL 解析为直链 URL。
- 重定向解析会在返回最终引用 URL 之前，先通过 SSRF 防护路径（HEAD + 重定向检查 +
  http/https 验证）。
- 重定向解析使用严格的 SSRF 默认值，因此指向
  私有/内部目标的重定向会被阻止。

## 支持的参数

Gemini 搜索支持 `query`。

出于共享 `web_search` 兼容性，也接受 `count`，但 Gemini grounding
仍然返回一个带引用的综合答案，而不是 N 条结果的
列表。

不支持 provider 专用过滤器，例如 `country`、`language`、`freshness` 和
`domain_filter`。

## 模型选择

默认模型是 `gemini-2.5-flash`（速度快且性价比高）。任何支持 grounding 的 Gemini
模型都可以通过
`plugins.entries.google.config.webSearch.model` 使用。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) —— 所有 providers 与自动检测
- [Brave Search](/zh-CN/tools/brave-search) —— 带摘要的结构化结果
- [Perplexity Search](/zh-CN/tools/perplexity-search) —— 结构化结果 + 内容提取
