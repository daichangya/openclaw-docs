---
read_when:
    - 你想让 OpenClaw 对接本地 vLLM 服务器运行
    - 你想使用带有自有模型的 OpenAI 兼容 `/v1` 端点ிகள to=final code  omitted
summary: 将 OpenClaw 与 vLLM 一起运行（OpenAI 兼容本地服务器）
title: vLLM
x-i18n:
    generated_at: "2026-04-23T21:02:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM 可以通过**OpenAI 兼容** HTTP API 提供开源模型（以及某些自定义模型）服务。OpenClaw 使用 `openai-completions` API 连接到 vLLM。

当你通过 `VLLM_API_KEY` 选择启用，且未定义显式的 `models.providers.vllm` 条目时，OpenClaw 还可以**自动发现** vLLM 中可用的模型（如果你的服务器不强制认证，则任意值都可用）。

OpenClaw 将 `vllm` 视为支持
流式使用量统计的本地 OpenAI 兼容提供商，因此状态/上下文 token 计数可以根据
`stream_options.include_usage` 响应进行更新。

| 属性 | 值 |
| ---------------- | ---------------------------------------- |
| 提供商 ID | `vllm` |
| API | `openai-completions`（OpenAI 兼容） |
| 身份验证 | `VLLM_API_KEY` 环境变量 |
| 默认 base URL | `http://127.0.0.1:8000/v1` |

## 入门指南

<Steps>
  <Step title="启动带有 OpenAI 兼容服务器的 vLLM">
    你的 base URL 应暴露 `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。vLLM 通常运行在：

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="设置 API 密钥环境变量">
    如果你的服务器不强制认证，则任意值都可用：

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="选择模型">
    请替换为你的某个 vLLM 模型 ID：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## 模型发现（隐式提供商）

当设置了 `VLLM_API_KEY`（或存在 auth profile），并且你**没有**定义 `models.providers.vllm` 时，OpenClaw 会查询：

```
GET http://127.0.0.1:8000/v1/models
```

并将返回的 ID 转换为模型条目。

<Note>
如果你显式设置了 `models.providers.vllm`，则会跳过自动发现，你必须手动定义模型。
</Note>

## 显式配置（手动模型）

在以下情况下，请使用显式配置：

- vLLM 运行在不同的主机或端口上
- 你想固定 `contextWindow` 或 `maxTokens` 值
- 你的服务器需要真实的 API 密钥（或你想控制标头）

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="代理式行为">
    vLLM 被视为代理式 OpenAI 兼容 `/v1` 后端，而不是原生
    OpenAI 端点。这意味着：

    | 行为 | 是否应用？ |
    |----------|----------|
    | 原生 OpenAI 请求整形 | 否 |
    | `service_tier` | 不发送 |
    | Responses `store` | 不发送 |
    | Prompt-cache 提示 | 不发送 |
    | OpenAI 推理兼容载荷整形 | 不应用 |
    | 隐藏的 OpenClaw 归属标头 | 不会注入到自定义 base URL 上 |

  </Accordion>

  <Accordion title="自定义 base URL">
    如果你的 vLLM 服务器运行在非默认主机或端口上，请在显式提供商配置中设置 `baseUrl`：

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="服务器不可达">
    请检查 vLLM 服务器是否正在运行且可访问：

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    如果你看到连接错误，请验证主机、端口，以及 vLLM 是否以 OpenAI 兼容服务器模式启动。

  </Accordion>

  <Accordion title="请求出现身份验证错误">
    如果请求因身份验证错误而失败，请设置一个与你服务器配置匹配的真实 `VLLM_API_KEY`，或在 `models.providers.vllm` 下显式配置该提供商。

    <Tip>
    如果你的 vLLM 服务器不强制认证，则任意非空 `VLLM_API_KEY` 都可以作为 OpenClaw 的启用信号。
    </Tip>

  </Accordion>

  <Accordion title="未发现任何模型">
    自动发现要求必须设置 `VLLM_API_KEY`，**并且**不存在显式的 `models.providers.vllm` 配置条目。如果你已经手动定义了该提供商，OpenClaw 会跳过发现，只使用你声明的模型。
  </Accordion>
</AccordionGroup>

<Warning>
更多帮助请参见：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="OpenAI" href="/zh-CN/providers/openai" icon="bolt">
    原生 OpenAI 提供商以及 OpenAI 兼容路由行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/zh-CN/gateway/authentication" icon="key">
    身份验证细节和凭证复用规则。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
