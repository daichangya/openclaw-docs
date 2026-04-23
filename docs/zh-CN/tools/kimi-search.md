---
read_when:
    - 你想将 Kimi 用于 `web_search`
    - 你需要 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
summary: 通过 Moonshot Web 搜索使用 Kimi Web 搜索
title: Kimi 搜索
x-i18n:
    generated_at: "2026-04-23T21:08:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw 支持将 Kimi 作为 `web_search` provider，使用 Moonshot Web 搜索生成带引用的 AI 综合答案。

## 获取 API key

<Steps>
  <Step title="创建密钥">
    从 [Moonshot AI](https://platform.moonshot.cn/) 获取一个 API key。
  </Step>
  <Step title="保存密钥">
    在 Gateway 网关环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，或通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

当你在 `openclaw onboard` 或
`openclaw configure --section web` 中选择 **Kimi** 时，OpenClaw 还会询问：

- Moonshot API 区域：
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- 默认的 Kimi Web 搜索模型（默认为 `kimi-k2.6`）

## 配置

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // 如果已设置 KIMI_API_KEY 或 MOONSHOT_API_KEY，则可选
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

如果你为聊天使用中国区 API 主机（`models.providers.moonshot.baseUrl`：
`https://api.moonshot.cn/v1`），那么当省略 `tools.web.search.kimi.baseUrl` 时，OpenClaw 会为 Kimi
`web_search` 复用同一个主机，这样来自
[platform.moonshot.cn](https://platform.moonshot.cn/) 的密钥就不会误打到国际端点（后者通常返回 HTTP 401）。当你需要使用不同的搜索 base URL 时，可通过 `tools.web.search.kimi.baseUrl` 覆盖。

**环境变量替代方案：** 在
Gateway 网关环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`。对于 gateway 安装，请将其写入 `~/.openclaw/.env`。

如果省略 `baseUrl`，OpenClaw 默认使用 `https://api.moonshot.ai/v1`。
如果省略 `model`，OpenClaw 默认使用 `kimi-k2.6`。

## 工作原理

Kimi 使用 Moonshot Web 搜索来综合生成带行内引用的答案，
类似于 Gemini 和 Grok 的 grounded response 方法。

## 支持的参数

Kimi 搜索支持 `query`。

出于共享 `web_search` 兼容性，`count` 也会被接受，但 Kimi 仍然
返回一条带引用的综合答案，而不是 N 条结果列表。

当前不支持 provider 专用过滤器。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) —— 所有 provider 与自动检测
- [Moonshot AI](/zh-CN/providers/moonshot) —— Moonshot 模型 + Kimi Coding provider 文档
- [Gemini 搜索](/zh-CN/tools/gemini-search) —— 通过 Google grounding 生成 AI 综合答案
- [Grok 搜索](/zh-CN/tools/grok-search) —— 通过 xAI grounding 生成 AI 综合答案
