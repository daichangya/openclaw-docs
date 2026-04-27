---
read_when:
    - 你想从你自己的 GPU 主机提供模型服务
    - 你正在接入 LM Studio 或兼容 OpenAI 的代理
    - 你需要最安全的本地模型使用指南
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-04-24T03:16:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

本地部署是可行的，但 OpenClaw 需要大上下文窗口以及对 prompt injection 的强防护。小显存卡会截断上下文并削弱安全性。目标配置应尽量高：**至少 2 台满配 Mac Studio 或同等级 GPU 设备（约 3 万美元以上）**。单张 **24 GB** GPU 只适用于更轻量的提示，同时延迟更高。请使用**你能运行的最大 / 全尺寸模型变体**；激进量化或 “small” 检查点会提高 prompt injection 风险（参见 [Security](/zh-CN/gateway/security)）。

如果你想要最低摩擦的本地配置，先从 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 和 `openclaw onboard` 开始。本页是面向更高端本地栈以及自定义 OpenAI 兼容本地服务器的带倾向性指南。

## 推荐：LM Studio + 大型本地模型（Responses API）

当前最佳的本地方案。在 LM Studio 中加载一个大型模型（例如全尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理与最终文本分离。

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
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
- 在 LM Studio 中，下载**当前可用的最大模型构建**（避免 “small” / 重度量化变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 中列出了该模型。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型处于已加载状态；冷加载会带来启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow` / `maxTokens`。
- 对于 WhatsApp，请坚持使用 Responses API，这样只会发送最终文本。

即使在本地运行，也要保留托管模型配置；使用 `models.mode: "merge"`，这样回退模型仍然可用。

### 混合配置：托管主模型，本地回退

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

### 本地优先，同时保留托管安全网

交换主模型和回退模型的顺序；保留相同的 providers 块和 `models.mode: "merge"`，这样当本地主机不可用时，你仍然可以回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管的 MiniMax / Kimi / GLM 变体也可通过 OpenRouter 的区域固定端点提供（例如托管在美国）。选择其中的区域变体，以便让流量保留在你选定的司法辖区内，同时仍可使用 `models.mode: "merge"` 作为 Anthropic / OpenAI 回退。
- 纯本地仍然是隐私性最强的路径；当你需要提供商功能但又想控制数据流向时，区域托管路由是折中方案。

## 其他 OpenAI 兼容本地代理

vLLM、LiteLLM、OAI-proxy 或自定义 Gateway 网关都可以使用，只要它们暴露了 OpenAI 风格的 `/v1` 端点。将上面的 provider 块替换为你的端点和模型 ID：

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
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

保留 `models.mode: "merge"`，这样托管模型仍可作为回退使用。

关于本地 / 代理 `/v1` 后端的行为说明：

- OpenClaw 会将这些后端视为代理式 OpenAI 兼容路由，而不是原生
  OpenAI 端点
- 这里不会应用仅适用于原生 OpenAI 的请求整形：没有
  `service_tier`，没有 Responses `store`，没有 OpenAI 推理兼容负载整形，
  也没有 prompt-cache 提示
- 不会在这些自定义代理 URL 上注入隐藏的 OpenClaw 归因头
  （`originator`、`version`、`User-Agent`）

针对更严格的 OpenAI 兼容后端的兼容性说明：

- 某些服务器在 Chat Completions 中只接受字符串类型的 `messages[].content`，而不接受
  结构化内容片段数组。对此类端点，请设置
  `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 某些较小或更严格的本地后端在面对 OpenClaw 完整的
  智能体运行时 prompt 结构时会不稳定，尤其是在包含工具 schema 时。如果该
  后端能处理很小的直接 `/v1/chat/completions` 调用，却无法处理正常的
  OpenClaw 智能体轮次，请先尝试
  `agents.defaults.experimental.localModelLean: true`，以移除重量级
  默认工具，如 `browser`、`cron` 和 `message`；这是一个实验性
  标志，不是稳定的默认模式设置。参见
  [Experimental Features](/zh-CN/concepts/experimental-features)。如果这样仍然失败，请尝试
  `models.providers.<provider>.models[].compat.supportsTools: false`。
- 如果后端仍然只在更大的 OpenClaw 运行中失败，
  那么剩余问题通常是上游模型 / 服务器容量限制或后端 bug，而不是 OpenClaw 的
  传输层。

## 故障排除

- Gateway 网关能访问该代理吗？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型已卸载？重新加载；冷启动是常见的“卡住”原因。
- 当检测到上下文窗口低于 **32k** 时，OpenClaw 会发出警告；低于 **16k** 时会阻止运行。如果你触发了这个预检，请提高服务器 / 模型的上下文上限，或选择更大的模型。
- 上下文错误？降低 `contextWindow` 或提高你的服务器上限。
- OpenAI 兼容服务器返回 `messages[].content ... expected a string`？
  在该模型条目上添加
  `compat.requiresStringContent: true`。
- 很小的直接 `/v1/chat/completions` 调用能工作，但 `openclaw infer model run`
  在 Gemma 或其他本地模型上失败？先用
  `compat.supportsTools: false` 禁用工具 schema，然后重新测试。如果服务器仍然只在更大的
  OpenClaw prompt 下崩溃，请将其视为上游服务器 / 模型限制。
- 安全性：本地模型会跳过提供商侧过滤；请让智能体保持收窄，并开启 compaction，以限制 prompt injection 的影响半径。

## 相关内容

- [Configuration reference](/zh-CN/gateway/configuration-reference)
- [Model failover](/zh-CN/concepts/model-failover)
