---
read_when:
    - 你希望在 OpenClaw 中使用 Groq
    - 你需要 API key 环境变量或 CLI 认证选项
summary: Groq 设置（认证 + 模型选择）
title: Groq
x-i18n:
    generated_at: "2026-04-23T21:00:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6391cb65fff15089d18c7bcbea2f825ba066a9b22b064bc77fd76977fb70b0
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) 通过自定义 LPU 硬件，为开源模型
（Llama、Gemma、Mistral 等）提供超高速推理。OpenClaw 通过
Groq 的 OpenAI 兼容 API 与其连接。

| 属性 | 值 |
| -------- | ----------------- |
| Provider | `groq` |
| 认证 | `GROQ_API_KEY` |
| API | OpenAI 兼容 |

## 快速开始

<Steps>
  <Step title="获取 API key">
    在 [console.groq.com/keys](https://console.groq.com/keys) 创建一个 API key。
  </Step>
  <Step title="设置 API key">
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

Groq 的模型目录变化较快。请运行 `openclaw models list | grep groq`
查看当前可用模型，或查看
[console.groq.com/docs/models](https://console.groq.com/docs/models)。

| 模型 | 说明 |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 通用型，大上下文 |
| **Llama 3.1 8B Instant** | 快速、轻量 |
| **Gemma 2 9B** | 紧凑、高效 |
| **Mixtral 8x7B** | MoE 架构，推理能力强 |

<Tip>
使用 `openclaw models list --provider groq` 可获取你账户当前可用模型的最新列表。
</Tip>

## 音频转录

Groq 还提供基于 Whisper 的快速音频转录。当其被配置为媒体理解 provider 时，
OpenClaw 会通过共享的 `tools.media.audio`
表面，使用 Groq 的 `whisper-large-v3-turbo`
模型来转录语音消息。

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
    | 默认 Base URL | `https://api.groq.com/openai/v1` |
    | 默认模型 | `whisper-large-v3-turbo` |
    | API 端点 | OpenAI 兼容 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="环境说明">
    如果 Gateway 网关作为 daemon 运行（launchd/systemd），请确保 `GROQ_API_KEY`
    对该进程可见（例如放在 `~/.openclaw/.env` 中，或通过
    `env.shellEnv` 提供）。

    <Warning>
    仅在交互式 shell 中设置的 key 对 daemon 管理的
    gateway 进程不可见。请使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置来实现持久可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 providers、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整配置 schema，包括 provider 和音频设置。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 控制台、API 文档和定价。
  </Card>
  <Card title="Groq 模型列表" href="https://console.groq.com/docs/models" icon="list">
    官方 Groq 模型目录。
  </Card>
</CardGroup>
