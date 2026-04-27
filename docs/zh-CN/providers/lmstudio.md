---
read_when:
    - 你想通过 LM Studio 使用开源模型运行 OpenClaw
    - 你想要设置并配置 LM Studio
summary: 使用 LM Studio 运行 OpenClaw
title: LM Studio
x-i18n:
    generated_at: "2026-04-27T08:01:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 98edefa8b57ab2a89d1c4405827335a421c3157f51c5d23ac5f83c1cbeab20a9
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio 是一款友好且功能强大的应用，可让你在自己的硬件上运行开放权重模型。它支持运行 llama.cpp（GGUF）或 MLX 模型（Apple Silicon）。既提供 GUI 应用，也提供无头守护进程（`llmster`）。产品和设置文档请参见 [lmstudio.ai](https://lmstudio.ai/)。

## 快速开始

1. 安装 LM Studio（桌面版）或 `llmster`（无头版），然后启动本地服务器：

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. 启动服务器

请确保你已启动桌面应用，或者使用以下命令运行守护进程：

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

如果你使用的是应用，请确保已启用 JIT，以获得更流畅的体验。更多信息请参见 [LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)。

3. 如果已启用 LM Studio 认证，请设置 `LM_API_TOKEN`：

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

如果 LM Studio 认证已禁用，则在交互式 OpenClaw 设置期间，你可以将 API 密钥留空。

有关 LM Studio 认证设置的详细信息，请参见 [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)。

4. 运行新手引导并选择 `LM Studio`：

```bash
openclaw onboard
```

5. 在新手引导中，使用 `Default model` 提示来选择你的 LM Studio 模型。

你也可以稍后设置或更改它：

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 模型键采用 `author/model-name` 格式（例如 `qwen/qwen3.5-9b`）。OpenClaw
模型引用会加上提供商名前缀：`lmstudio/qwen/qwen3.5-9b`。你可以通过运行 `curl http://localhost:1234/api/v1/models` 并查看 `key` 字段，找到某个模型的精确键名。

## 非交互式新手引导

如果你想通过脚本完成设置（CI、预配、远程引导初始化），请使用非交互式新手引导：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

或者指定 base URL、模型和可选 API 密钥：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` 接收 LM Studio 返回的模型键（例如 `qwen/qwen3.5-9b`），不包含
`lmstudio/` 提供商前缀。

对于启用了认证的 LM Studio 服务器，请传入 `--lmstudio-api-key` 或设置 `LM_API_TOKEN`。
对于未启用认证的 LM Studio 服务器，请省略该密钥；OpenClaw 会存储一个本地非机密标记。

`--custom-api-key` 仍然支持以保持兼容性，但对于 LM Studio，更推荐使用 `--lmstudio-api-key`。

这会写入 `models.providers.lmstudio`，并将默认模型设置为
`lmstudio/<custom-model-id>`。当你提供 API 密钥时，设置还会写入
`lmstudio:default` 认证配置文件。

交互式设置可以提示输入一个可选的首选加载上下文长度，并将其应用到保存进配置中的已发现 LM Studio 模型。
LM Studio 插件配置会信任为模型请求所配置的 LM Studio 端点，包括 loopback、LAN 和 tailnet 主机。你可以通过设置 `models.providers.lmstudio.request.allowPrivateNetwork: false` 选择退出。

## 配置

### 流式传输 usage 兼容性

LM Studio 与流式 usage 兼容。当它未发出 OpenAI 形状的
`usage` 对象时，OpenClaw 会改为从 llama.cpp 风格的
`timings.prompt_n` / `timings.predicted_n` 元数据中恢复 token 计数。

同样的行为也适用于这些兼容 OpenAI 的本地后端：

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

请确保 LM Studio 正在运行。如果启用了认证，还要设置 `LM_API_TOKEN`：

```bash
# 通过桌面应用启动，或以无头方式启动：
lms server start --port 1234
```

验证 API 是否可访问：

```bash
curl http://localhost:1234/api/v1/models
```

### 认证错误（HTTP 401）

如果设置报告 HTTP 401，请验证你的 API 密钥：

- 检查 `LM_API_TOKEN` 是否与你在 LM Studio 中配置的密钥一致。
- 有关 LM Studio 认证设置的详细信息，请参见 [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)。
- 如果你的服务器不要求认证，请在设置期间将密钥留空。

### 即时模型加载

LM Studio 支持即时（JIT）模型加载，即模型会在首次请求时加载。请确保已启用此功能，以避免出现“Model not loaded”错误。

### LAN 或 tailnet LM Studio 主机

请使用 LM Studio 主机的可访问地址，保留 `/v1`，并确保该机器上的 LM Studio 绑定到了 loopback 之外的地址：

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

与通用的兼容 OpenAI 提供商不同，`lmstudio` 会自动信任其为受保护模型请求所配置的本地/私有端点。如果你使用的是自定义提供商 id 而不是 `lmstudio`，请显式设置 `models.providers.<id>.request.allowPrivateNetwork: true`。

## 相关内容

- [模型选择](/zh-CN/concepts/model-providers)
- [Ollama](/zh-CN/providers/ollama)
- [本地模型](/zh-CN/gateway/local-models)
