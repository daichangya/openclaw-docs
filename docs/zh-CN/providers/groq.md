---
read_when:
    - 你想将 Groq 与 OpenClaw 搭配使用
    - 你需要 API 密钥环境变量或 CLI 凭证选择
summary: Groq 设置（凭证 + 模型选择）
title: Groq
x-i18n:
    generated_at: "2026-04-12T10:22:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613289efc36fedd002e1ebf9366e0e7119ea1f9e14a1dae773b90ea57100baee
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) 使用自定义的 LPU 硬件，在开源模型（Llama、Gemma、Mistral 等）上提供超高速推理。OpenClaw 通过与 OpenAI 兼容的 API 连接到 Groq。

| 属性 | 值 |
| -------- | ----------------- |
| 提供商 | `groq` |
| 凭证 | `GROQ_API_KEY` |
| API | 与 OpenAI 兼容 |

## 入门指南

<Steps>
  <Step title="获取 API 密钥">
    在 [console.groq.com/keys](https://console.groq.com/keys) 创建一个 API 密钥。
  </Step>
  <Step title="设置 API 密钥">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="设置默认模型">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### 配置文件示例

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 可用模型

Groq 的模型目录经常变化。运行 `openclaw models list | grep groq` 可查看当前可用的模型，或者查看 [console.groq.com/docs/models](https://console.groq.com/docs/models)。

| 模型 | 说明 |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 通用型，大上下文 |
| **Llama 3.1 8B Instant** | 快速、轻量 |
| **Gemma 2 9B** | 紧凑、高效 |
| **Mixtral 8x7B** | MoE 架构，推理能力强 |

<Tip>
使用 `openclaw models list --provider groq` 获取你的账户当前可用模型的最新列表。
</Tip>

## 音频转录

Groq 还提供基于 Whisper 的快速音频转录。配置为媒体理解提供商后，OpenClaw 会使用 Groq 的 `whisper-large-v3-turbo` 模型，通过共享的 `tools.media.audio` 接口转录语音消息。

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="音频转录详情">
    | 属性 | 值 |
    |----------|-------|
    | 共享配置路径 | `tools.media.audio` |
    | 默认基础 URL | `https://api.groq.com/openai/v1` |
    | 默认模型 | `whisper-large-v3-turbo` |
    | API 端点 | 与 OpenAI 兼容的 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="环境说明">
    如果 Gateway 网关以守护进程（launchd/systemd）方式运行，请确保 `GROQ_API_KEY` 对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

    <Warning>
    仅在你的交互式 shell 中设置的密钥，对由守护进程管理的 Gateway 网关进程不可见。请使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置来确保持续可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的配置 schema，包括提供商和音频设置。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 控制台、API 文档和定价。
  </Card>
  <Card title="Groq 模型列表" href="https://console.groq.com/docs/models" icon="list">
    官方 Groq 模型目录。
  </Card>
</CardGroup>
