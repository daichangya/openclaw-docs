---
read_when:
    - 你想使用 Ollama 进行 `web_search`
    - 你想要一个无需密钥的 `web_search` 提供商
    - 你需要 Ollama Web 搜索的设置指引
summary: 通过你已配置的 Ollama 主机使用 Ollama Web 搜索
title: Ollama Web 搜索
x-i18n:
    generated_at: "2026-04-27T00:14:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd8f2c8411c9a9ef4c1d6499edd2496e5f23172e7d94c3e38336986337aa353e
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw 支持 **Ollama Web 搜索**，作为内置的 `web_search` 提供商。它使用 Ollama 的网页搜索 API，并返回包含标题、URL 和摘要的结构化结果。

与 Ollama 模型提供商不同，这种设置默认不需要 API 密钥。但它确实需要：

- 一个 OpenClaw 可访问的 Ollama 主机
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

如果你已经使用 Ollama 来运行模型，Ollama Web 搜索会复用相同的已配置主机。

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

可选的 Ollama 主机覆盖：

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

如果未设置显式的 Ollama 基础 URL，OpenClaw 会使用 `http://127.0.0.1:11434`。

如果你的 Ollama 主机要求 bearer 认证，OpenClaw 会复用
`models.providers.ollama.apiKey`（或匹配的、由环境变量支持的提供商认证）
来向该已配置主机发送请求。

## 说明

- 此提供商不需要专门的网页搜索 API 密钥字段。
- 如果 Ollama 主机受认证保护，OpenClaw 会在存在时复用常规 Ollama
  提供商 API 密钥。
- 如果已配置的主机不暴露网页搜索功能，且设置了 `OLLAMA_API_KEY`，
  OpenClaw 可以回退到 `https://ollama.com/api/web_search`，并且不会将该环境变量密钥发送到本地主机。
- 如果 Ollama 不可访问或未登录，OpenClaw 会在设置期间发出警告，但
  不会阻止你选择它。
- 当未配置更高优先级的、带凭证的提供商时，运行时自动检测可以回退到 Ollama Web 搜索。
- 本地 Ollama 守护进程主机会使用本地代理端点
  `/api/experimental/web_search`，该端点会签名并转发到 Ollama Cloud。
- `https://ollama.com` 主机会直接使用公开托管端点
  `/api/web_search`，并通过 bearer API 密钥认证。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Ollama](/zh-CN/providers/ollama) -- Ollama 模型设置以及云端/本地模式
