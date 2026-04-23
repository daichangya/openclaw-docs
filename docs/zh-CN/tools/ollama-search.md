---
read_when:
    - 你想将 Ollama 用于 `web_search` to=final code omitted
    - 你想要一个无需密钥的 `web_search` 提供商 to=final code omitted
    - 你需要 Ollama Web 搜索的设置指引 to=final code omitted
summary: 通过你已配置的 Ollama 主机使用 Ollama Web 搜索
title: Ollama Web 搜索 to=final code omitted
x-i18n:
    generated_at: "2026-04-23T21:09:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw 支持 **Ollama Web 搜索**，它是一个内置的 `web_search` 提供商。
它使用 Ollama 的实验性 Web 搜索 API，并返回带有标题、
URL 和摘要的结构化结果。

与 Ollama 模型提供商不同，此设置默认不需要 API 密钥。
但它确实需要：

- 一个可被 OpenClaw 访问的 Ollama 主机
- `ollama signin`

## 设置

<Steps>
  <Step title="启动 Ollama">
    确保已安装并运行 Ollama。
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

如果你已经使用 Ollama 作为模型提供商，Ollama Web 搜索会复用同一个
已配置主机。

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

可选的 Ollama 主机覆盖项：

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

如果未显式设置 Ollama base URL，OpenClaw 会使用 `http://127.0.0.1:11434`。

如果你的 Ollama 主机需要 bearer 认证，OpenClaw 也会将
`models.providers.ollama.apiKey`（或匹配的、由环境变量支持的提供商认证）
复用于 Web 搜索请求。

## 说明

- 该提供商不需要专门的 Web 搜索 API 密钥字段。
- 如果 Ollama 主机受认证保护，OpenClaw 会在存在时复用常规 Ollama
  提供商 API 密钥。
- 在设置期间，如果 Ollama 不可达或尚未登录，OpenClaw 会发出警告，但
  不会阻止选择该提供商。
- 当未配置更高优先级、已带凭证的提供商时，运行时自动检测可以回退到 Ollama Web 搜索。
- 该提供商使用 Ollama 的实验性 `/api/experimental/web_search`
  端点。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) —— 所有提供商与自动检测
- [Ollama](/zh-CN/providers/ollama) —— Ollama 模型设置与云端/本地模式
