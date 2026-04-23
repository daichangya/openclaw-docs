---
read_when:
    - 你想从自己的 GPU 主机提供模型服务
    - 你正在接入 LM Studio 或兼容 OpenAI 的代理
    - 你需要最安全的本地模型使用指南
summary: 在本地 LLM 上运行 OpenClaw（LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点）
title: 本地模型
x-i18n:
    generated_at: "2026-04-23T20:49:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 755162ec175fa7f769cecc1756d31de8916d4058a3cf4dba86080b446c6cb91c
    source_path: gateway/local-models.md
    workflow: 15
---

本地运行是可行的，但 OpenClaw 需要大上下文窗口以及对提示词注入的强防御。小显存卡会截断上下文并削弱安全性。目标配置应尽量高：**至少 2 台满配 Mac Studio 或同等级 GPU 设备（约 3 万美元以上）**。单张 **24 GB** GPU 仅适用于较轻的提示词，且延迟更高。请使用你能运行的**最大 / 完整尺寸模型变体**；激进量化或“小型”检查点会提高提示词注入风险（请参阅[安全](/zh-CN/gateway/security)）。

如果你想用最低摩擦的本地方案开始，请先使用 [LM Studio](/zh-CN/providers/lmstudio) 或 [Ollama](/zh-CN/providers/ollama) 并运行 `openclaw onboard`。本页是面向更高端本地堆栈和自定义 OpenAI 兼容本地服务器的意见化指南。

## 推荐：LM Studio + 大型本地模型（Responses API）

当前最佳的本地堆栈。将一个大模型加载到 LM Studio 中（例如完整尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将 reasoning 与最终文本分离。

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
- 在 LM Studio 中，下载**可用的最大模型构建**（避免使用 “small”/重度量化变体），启动服务器，并确认 `http://127.0.0.1:1234/v1/models` 能列出该模型。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型已加载；冷启动加载会增加启动延迟。
- 如果你的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，请坚持使用 Responses API，这样只会发送最终文本。

即使你在运行本地模型，也请保留托管模型配置；使用 `models.mode: "merge"`，这样回退仍然可用。

### 混合配置：托管为主，本地为回退

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

交换主模型与回退顺序；保留相同的 providers 区块和 `models.mode: "merge"`，这样当本地主机不可用时，你仍可回退到 Sonnet 或 Opus。

### 区域托管 / 数据路由

- 托管版的 MiniMax/Kimi/GLM 变体也可通过 OpenRouter 的区域固定端点获得（例如美国托管）。你可以在那里选择区域版本，以便将流量保留在你指定的司法辖区内，同时仍通过 `models.mode: "merge"` 使用 Anthropic/OpenAI 回退。
- 纯本地仍是最强的隐私路径；当你需要提供商功能、但又希望控制数据流向时，区域托管路由则是折中方案。

## 其他 OpenAI 兼容的本地代理

只要 vLLM、LiteLLM、OAI-proxy 或自定义 gateway 暴露了 OpenAI 风格的 `/v1` 端点，它们就可以工作。将上面的 provider 区块替换为你的端点和模型 ID：

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

关于本地/代理 `/v1` 后端的行为说明：

- OpenClaw 会将这些后端视为代理式的 OpenAI 兼容路由，而不是原生 OpenAI 端点
- 原生 OpenAI 专属的请求整形不会在此适用：没有
  `service_tier`，没有 Responses `store`，没有 OpenAI reasoning 兼容载荷整形，也没有提示词缓存提示
- 在这些自定义代理 URL 上，不会注入隐藏的 OpenClaw 来源标头（`originator`、`version`、`User-Agent`）

关于更严格的 OpenAI 兼容后端的兼容性说明：

- 有些服务器仅接受 Chat Completions 中的字符串型 `messages[].content`，而不接受结构化内容片段数组。对于这些端点，请设置
  `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 某些较小或更严格的本地后端在处理 OpenClaw 完整智能体运行时的提示词形态时会不稳定，尤其是在包含工具 schema 时。如果该后端对极小型的直接 `/v1/chat/completions` 调用有效，但在普通 OpenClaw 智能体轮次中失败，请先尝试
  `agents.defaults.experimental.localModelLean: true`，以去掉如 `browser`、`cron` 和 `message` 等重量级默认工具；这是一个实验性标志，而不是稳定的默认模式设置。请参阅
  [实验性功能](/zh-CN/concepts/experimental-features)。如果仍然失败，再尝试
  `models.providers.<provider>.models[].compat.supportsTools: false`。
- 如果后端仍然只在较大的 OpenClaw 运行中失败，那么剩余问题通常是上游模型/服务器容量不足或后端 bug，而不是 OpenClaw 的传输层问题。

## 故障排除

- Gateway 网关能访问代理吗？执行 `curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型被卸载了吗？重新加载；冷启动是常见的“卡住”原因。
- 当检测到上下文窗口低于 **32k** 时，OpenClaw 会发出警告；低于 **16k** 时会阻止运行。如果你遇到该预检失败，请提升服务器/模型的上下文上限，或选择更大的模型。
- 上下文错误？请降低 `contextWindow`，或提高服务器上限。
- OpenAI 兼容服务器返回 `messages[].content ... expected a string`？
  请在该模型条目上添加 `compat.requiresStringContent: true`。
- 直接的小型 `/v1/chat/completions` 调用可以工作，但 `openclaw infer model run`
  在 Gemma 或其他本地模型上失败？请先用
  `compat.supportsTools: false` 禁用工具 schema，然后重新测试。如果服务器仍然只在较大的 OpenClaw 提示词下崩溃，请将其视为上游服务器/模型限制。
- 安全性：本地模型会跳过提供商侧过滤；请保持智能体范围收窄，并开启压缩，以限制提示词注入的影响半径。
