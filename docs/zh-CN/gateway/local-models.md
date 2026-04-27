---
read_when:
    - 你希望从你自己的 GPU 主机提供模型服务
    - 你正在连接 LM Studio 或兼容 OpenAI 的代理
    - 你需要最安全的本地模型指引
summary: 在本地 LLM（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）上运行 OpenClaw
title: 本地模型
x-i18n:
    generated_at: "2026-04-27T09:35:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3f013bba75ddcb17d7213c2b657d39465231429fd46c4235dcfdfee2a9541c
    source_path: gateway/local-models.md
    workflow: 15
---

本地可行，但 OpenClaw 期望具备大上下文窗口 + 针对提示注入的强防御。小显存卡会截断上下文并削弱安全性。目标应尽可能高：**≥2 台满配 Mac Studio 或同等级 GPU 设备（约 3 万美元以上）**。单张 **24 GB** GPU 仅适用于较轻量的提示，并且延迟更高。使用**你能运行的最大 / 全尺寸模型变体**；激进量化或 “small” 检查点会提高提示注入风险（参见 [Security](/zh-CN/gateway/security)）。

如果你想要摩擦最小的本地部署方式，先从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 和 `openclaw onboard` 开始。本页是针对更高端本地堆栈和自定义兼容 OpenAI 的本地服务器的偏好型指南。

## 推荐：LM Studio + 大型本地模型（Responses API）

当前最佳的本地堆栈。在 LM Studio 中加载一个大型模型（例如全尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 让推理过程与最终文本分离。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**设置清单**

- 安装 LM Studio：[https://lmstudio.ai](https://lmstudio.ai)
- 在 LM Studio 中，下载**可用的最大模型构建**（避免 “small” / 重度量化变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 能列出该模型。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型已加载；冷加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow` / `maxTokens`。
- 对于 WhatsApp，坚持使用 Responses API，这样只会发送最终文本。

即使在运行本地模型时，也要保留托管模型配置；使用 `models.mode: "merge"`，这样回退模型仍然可用。

### 混合配置：托管模型为主，本地模型为回退

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 本地优先，托管兜底

交换主模型和回退模型的顺序；保留相同的 provider 配置块和 `models.mode: "merge"`，这样当本地主机不可用时，你仍可回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管版的 MiniMax / Kimi / GLM 变体也存在于 OpenRouter 上，并提供区域固定端点（例如美国托管）。在那里选择区域变体，以便让流量保留在你选定的司法辖区内，同时仍然使用 `models.mode: "merge"` 来保留 Anthropic / OpenAI 回退。
- 纯本地仍然是隐私性最强的路径；当你需要 provider 功能但又想控制数据流向时，区域托管路由是中间方案。

## 其他兼容 OpenAI 的本地代理

只要 vLLM、LiteLLM、OAI-proxy 或自定义网关暴露的是 OpenAI 风格的 `/v1` 端点，它们都可以使用。将上面的 provider 配置块替换为你的端点和模型 ID：

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

保持 `models.mode: "merge"`，这样托管模型仍可作为回退使用。
对于较慢的本地或远程模型服务器，先使用 `models.providers.<id>.timeoutSeconds`，再考虑提高 `agents.defaults.timeoutSeconds`。provider 超时仅适用于模型 HTTP 请求，包括连接、响应头、流式响应体，以及整个受保护的 fetch 中止。

关于本地 / 代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理式的兼容 OpenAI 路由，而不是原生 OpenAI 端点
- 此处不适用仅限原生 OpenAI 的请求整形：没有 `service_tier`、没有 Responses `store`、没有 OpenAI reasoning 兼容载荷整形，也没有提示缓存提示
- 在这些自定义代理 URL 上，不会注入隐藏的 OpenClaw 归因请求头（`originator`、`version`、`User-Agent`）

针对更严格的兼容 OpenAI 后端的兼容性说明：

- 某些服务器在 Chat Completions 中只接受字符串形式的 `messages[].content`，不接受结构化的内容分段数组。对这类端点，请设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 某些本地模型会以文本形式输出独立的带括号工具请求，例如 `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。只有当该名称与当前轮次中已注册的工具完全匹配时，OpenClaw 才会将其提升为真实的工具调用；否则，这个块会被视为不受支持的文本，并从面向用户的回复中隐藏。
- 如果模型输出了看起来像工具调用的 JSON、XML 或 ReAct 风格文本，但 provider 没有发出结构化调用，OpenClaw 会将其保留为文本，并在日志中记录警告，包含运行 ID、provider / model、检测到的模式，以及可用时的工具名称。应将其视为 provider / model 的工具调用兼容性问题，而不是一次已完成的工具运行。
- 对于那些只有在强制使用工具时解析器才能正常工作的兼容 OpenAI Chat Completions 后端，请设置每个模型的请求覆盖，而不要依赖文本解析：

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  仅在每个正常轮次都应调用工具的模型 / 会话中使用此设置。它会覆盖 OpenClaw 默认的代理值 `tool_choice: "auto"`。

- 某些更小或更严格的本地后端在处理 OpenClaw 完整的智能体运行时提示结构时不稳定，尤其是在包含工具 schema 时。如果后端能处理很小的直接 `/v1/chat/completions` 调用，但在正常的 OpenClaw 智能体轮次中失败，先尝试
  `agents.defaults.experimental.localModelLean: true`，以移除 `browser`、`cron` 和 `message` 等较重的默认工具；这是实验性标志，不是稳定的默认模式设置。参见
  [Experimental Features](/zh-CN/concepts/experimental-features)。如果仍然失败，再尝试
  `models.providers.<provider>.models[].compat.supportsTools: false`。
- 如果后端仍然只会在更大的 OpenClaw 运行中失败，那么剩余问题通常是上游模型 / 服务器容量不足或后端 bug，而不是 OpenClaw 的传输层。

## 故障排除

- Gateway 网关 能连到代理吗？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型未加载？重新加载；冷启动是常见的“卡住”原因。
- 本地服务器显示 `terminated`、`ECONNRESET`，或在轮次中途关闭流？
  OpenClaw 会在诊断中记录低基数的 `model.call.error.failureKind`，以及 OpenClaw 进程的 RSS / 堆快照。对于 LM Studio / Ollama 的内存压力问题，可将该时间戳与服务器日志或 macOS 崩溃 / jetsam 日志对照，以确认模型服务器是否被杀死。
- 当检测到的上下文窗口低于 **32k** 时，OpenClaw 会发出警告；低于 **16k** 时会阻止运行。如果你触发了这个预检，请提高服务器 / 模型的上下文限制，或选择更大的模型。
- 上下文报错？降低 `contextWindow` 或提高你的服务器限制。
- 兼容 OpenAI 的服务器返回 `messages[].content ... expected a string`？
  在该模型条目上添加 `compat.requiresStringContent: true`。
- 直接的小型 `/v1/chat/completions` 调用可以工作，但 `openclaw infer model run`
  在 Gemma 或其他本地模型上失败？先使用
  `compat.supportsTools: false` 禁用工具 schema，然后重新测试。如果服务器仍然只在更大的 OpenClaw 提示上崩溃，应将其视为上游服务器 / 模型限制。
- 安全性：本地模型会跳过 provider 侧过滤；请保持智能体范围收窄，并开启 compaction，以限制提示注入的影响范围。

## 相关内容

- [Configuration reference](/zh-CN/gateway/configuration-reference)
- [Model failover](/zh-CN/concepts/model-failover)
