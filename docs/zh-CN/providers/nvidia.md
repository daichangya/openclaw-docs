---
read_when:
    - 你想在 OpenClaw 中免费使用开放模型
    - 你需要设置 `NVIDIA_API_KEY`
summary: 在 OpenClaw 中使用 NVIDIA 兼容 OpenAI 的 API
title: NVIDIA
x-i18n:
    generated_at: "2026-04-07T14:49:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: b00f8cedaf223a33ba9f6a6dd8cf066d88cebeea52d391b871e435026182228a
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA 提供了一个兼容 OpenAI 的 API：`https://integrate.api.nvidia.com/v1`，可免费用于开放模型。使用来自 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API 密钥进行身份验证。

## CLI 设置

导出一次密钥，然后运行新手引导并设置一个 NVIDIA 模型：

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
```

如果你仍然传递 `--token`，请记住它会出现在 shell 历史记录和 `ps` 输出中；尽可能优先使用环境变量。

## 配置片段

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## 模型 ID

| Model ref                                  | 名称                         | 上下文长度 | 最大输出 |
| ------------------------------------------ | ---------------------------- | ---------- | -------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144    | 8,192    |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144    | 8,192    |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608    | 8,192    |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752    | 8,192    |

## 注意事项

- 兼容 OpenAI 的 `/v1` 端点；使用来自 [build.nvidia.com](https://build.nvidia.com/) 的 API 密钥。
- 设置 `NVIDIA_API_KEY` 后，提供商会自动启用。
- 内置目录是静态的；费用在源码中默认设为 `0`。
