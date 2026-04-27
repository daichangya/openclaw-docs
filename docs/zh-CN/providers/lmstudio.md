---
read_when:
    - 你想通过 LM Studio 使用开源模型运行 OpenClaw。
    - 你想设置并配置 LM Studio。
summary: 使用 LM Studio 运行 OpenClaw
title: LM Studio
x-i18n:
    generated_at: "2026-04-27T07:21:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0077108b7ab3171084f89234e25f5f5e8b68239a6fa6c11fa70c65f52d56670f
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio 是一款对用户友好且功能强大的应用，可让你在自己的硬件上运行开放权重模型。它支持运行 llama.cpp（GGUF）或 MLX 模型（Apple Silicon）。提供 GUI 安装包，也提供无头守护进程（`llmster`）。产品和设置文档请参阅 [lmstudio.ai](https://lmstudio.ai/)。

## 快速开始

1. 安装 LM Studio（桌面版）或 `llmster`（无头版），然后启动本地服务器：

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. 启动服务器

确保你已经启动桌面应用，或使用以下命令运行守护进程：

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

如果你使用的是应用，请确保已启用 JIT，以获得流畅的体验。详情请参阅 [LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)。

3. 如果已启用 LM Studio 身份验证，请设置 `LM_API_TOKEN`：

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

如果 LM Studio 身份验证已禁用，你可以在交互式 OpenClaw 设置期间将 API 密钥留空。

有关 LM Studio 身份验证设置的详细信息，请参阅 [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)。

4. 运行新手引导并选择 `LM Studio`：

```bash
openclaw onboard
```

5. 在新手引导中，使用 `Default model` 提示来选择你的 LM Studio 模型。

你也可以稍后设置或更改它：

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 模型键遵循 `author/model-name` 格式（例如 `qwen/qwen3.5-9b`）。OpenClaw 模型引用会在前面加上提供商名称：`lmstudio/qwen/qwen3.5-9b`。你可以运行 `curl http://localhost:1234/api/v1/models` 并查看 `key` 字段，以找到某个模型的准确键名。

## 非交互式新手引导

当你想通过脚本完成设置时（CI、预配、远程引导），请使用非交互式新手引导：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

或者指定基础 URL、模型和可选的 API 密钥：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` 接受 LM Studio 返回的模型键（例如 `qwen/qwen3.5-9b`），不包含 `lmstudio/` 提供商前缀。

对于启用了身份验证的 LM Studio 服务器，请传入 `--lmstudio-api-key` 或设置 `LM_API_TOKEN`。
对于未启用身份验证的 LM Studio 服务器，请省略该密钥；OpenClaw 会存储一个本地的非机密标记。

出于兼容性考虑，`--custom-api-key` 仍然受支持，但对于 LM Studio，优先使用 `--lmstudio-api-key`。

这会写入 `models.providers.lmstudio`，并将默认模型设置为
`lmstudio/<custom-model-id>`。当你提供 API 密钥时，设置还会写入
`lmstudio:default` 身份验证配置文件。

交互式设置可以提示输入一个可选的首选加载上下文长度，并将其应用到发现到的、保存进配置中的所有 LM Studio 模型。

## 配置

### 流式传输用量兼容性

LM Studio 兼容流式传输用量统计。当它没有输出符合 OpenAI 形状的
`usage` 对象时，OpenClaw 会改为从 llama.cpp 风格的
`timings.prompt_n` / `timings.predicted_n` 元数据中恢复 token 计数。

相同行为也适用于这些兼容 OpenAI 的本地后端：

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### 显式配置

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
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

## 故障排除

### 未检测到 LM Studio

请确认 LM Studio 正在运行。如果已启用身份验证，还要设置 `LM_API_TOKEN`：

```bash
# 通过桌面应用启动，或以无头方式启动：
lms server start --port 1234
```

确认 API 可访问：

```bash
curl http://localhost:1234/api/v1/models
```

### 身份验证错误（HTTP 401）

如果设置报告 HTTP 401，请验证你的 API 密钥：

- 检查 `LM_API_TOKEN` 是否与 LM Studio 中配置的密钥匹配。
- 有关 LM Studio 身份验证设置的详细信息，请参阅 [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)。
- 如果你的服务器不需要身份验证，请在设置期间将密钥留空。

### 即时模型加载

LM Studio 支持即时（JIT）模型加载，即模型会在第一次请求时加载。请确保已启用此功能，以避免出现“Model not loaded”错误。

## 相关内容

- [模型选择](/zh-CN/concepts/model-providers)
- [Ollama](/zh-CN/providers/ollama)
- [本地模型](/zh-CN/gateway/local-models)
