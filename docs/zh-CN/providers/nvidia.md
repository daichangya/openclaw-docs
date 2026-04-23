---
read_when:
    - 你想在 OpenClaw 中免费使用开放模型
    - 你需要设置 `NVIDIA_API_KEY`
summary: 在 OpenClaw 中使用 NVIDIA 与 OpenAI 兼容的 API
title: NVIDIA
x-i18n:
    generated_at: "2026-04-23T21:01:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIA 在 `https://integrate.api.nvidia.com/v1` 提供了一个与 OpenAI 兼容的 API，
可免费使用开放模型。请使用来自
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API key 进行身份验证。

## 快速开始

<Steps>
  <Step title="获取你的 API key">
    在 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 创建一个 API key。
  </Step>
  <Step title="导出 key 并运行新手引导">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="设置一个 NVIDIA 模型">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
如果你传入 `--token` 而不是使用环境变量，该值会出现在 shell 历史记录和
`ps` 输出中。能用时请优先使用 `NVIDIA_API_KEY` 环境变量。
</Warning>

## 配置示例

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

## 内置目录

| 模型引用 | 名称 | 上下文 | 最大输出 |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192 |
| `nvidia/moonshotai/kimi-k2.5` | Kimi K2.5 | 262,144 | 8,192 |
| `nvidia/minimaxai/minimax-m2.5` | Minimax M2.5 | 196,608 | 8,192 |
| `nvidia/z-ai/glm5` | GLM 5 | 202,752 | 8,192 |

## 高级配置

<AccordionGroup>
  <Accordion title="自动启用行为">
    当设置了 `NVIDIA_API_KEY` 环境变量时，该提供商会自动启用。
    除了 key 之外，无需显式提供商配置。
  </Accordion>

  <Accordion title="目录与定价">
    内置目录是静态的。由于 NVIDIA 目前为列出的模型提供免费 API 访问，
    因此源码中的成本默认值为 `0`。
  </Accordion>

  <Accordion title="与 OpenAI 兼容的端点">
    NVIDIA 使用标准的 `/v1` completions 端点。任何与 OpenAI 兼容的
    工具通常都可以直接配合 NVIDIA base URL 使用。
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA 模型目前可免费使用。最新可用性和
速率限制详情请查看
[build.nvidia.com](https://build.nvidia.com/)。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
