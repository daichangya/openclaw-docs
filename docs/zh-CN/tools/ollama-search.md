---
read_when:
    - 你想使用 Ollama 进行 web_search
    - 你想要一个无需密钥的 web_search 提供商
    - 你需要 Ollama Web 搜索设置指南
summary: 通过你配置的 Ollama 主机使用 Ollama Web 搜索
title: Ollama Web 搜索
x-i18n:
    generated_at: "2026-04-27T00:05:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 568c2792926c2d31b87bc07fd7825b950f2434c0b838c77279e0850754f0131d
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw 支持 **Ollama Web 搜索**，作为内置的 `web_search` 提供商。它使用 Ollama 的 web-search API，并返回包含标题、URL 和摘要片段的结构化结果。

与 Ollama 模型提供商不同，这种设置默认不需要 API 密钥。它确实需要：

- 一个 OpenClaw 可以访问到的 Ollama 主机
- `ollama signin`

## 设置

<Steps>
  <Step title="启动 Ollama">
    确保 Ollama 已安装并正在运行。
  </Step>
  <Step title="登录">
    运行：

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="选择 Ollama Web 搜索">
    运行：

    ```bash
    openclaw configure --section web
    ```

    然后选择 **Ollama Web 搜索** 作为提供商。

  </Step>
</Steps>

如果你已经使用 Ollama 提供模型，Ollama Web 搜索会复用同一个已配置的主机。

## 配置

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

可选的 Ollama 主机覆盖配置：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

如果没有显式设置 Ollama base URL，OpenClaw 会使用 `http://127.0.0.1:11434`。

如果你的 Ollama 主机要求 bearer auth，OpenClaw 会复用
`models.providers.ollama.apiKey`（或与之匹配、由环境变量提供支持的提供商认证）
来向该已配置主机发送请求。

## 注意事项

- 此提供商不需要专门的 web-search API 密钥字段。
- 如果 Ollama 主机受认证保护，OpenClaw 会在存在时复用常规 Ollama
  提供商 API 密钥。
- 如果已配置的主机不暴露 web search，且设置了 `OLLAMA_API_KEY`，
  OpenClaw 可以回退到 `https://ollama.com/api/web_search`，同时不会将该环境变量密钥发送到本地主机。
- 如果 Ollama 不可达或尚未登录，OpenClaw 会在设置期间发出警告，但
  不会阻止你进行选择。
- 当没有配置更高优先级且带凭证的提供商时，运行时自动检测可以回退到 Ollama Web 搜索。
- 该提供商会先尝试 Ollama 的 `/api/web_search` 端点，然后针对较旧主机尝试旧版
  `/api/experimental/web_search` 端点。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Ollama](/zh-CN/providers/ollama) -- Ollama 模型设置以及云端 / 本地模式
