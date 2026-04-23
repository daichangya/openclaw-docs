---
read_when:
    - 你希望为音频附件使用 Deepgram 语音转文本
    - 你希望为 Voice Call 使用 Deepgram 流式转录
    - 你需要一个快速的 Deepgram 配置示例
summary: 用于入站语音便笺的 Deepgram 转录
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T06:41:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram（音频转录）

Deepgram 是一个语音转文本 API。在 OpenClaw 中，它用于通过 `tools.media.audio` 处理入站音频/语音便笺转录，以及通过 `plugins.entries.voice-call.config.streaming` 处理 Voice Call 流式 STT。

对于批量转录，OpenClaw 会将完整音频文件上传到 Deepgram，并将转录文本注入回复流水线（`{{Transcript}}` + `[Audio]` 块）。对于 Voice Call 流式处理，OpenClaw 会通过 Deepgram 的 WebSocket `listen` 端点转发实时 G.711 u-law 帧，并在 Deepgram 返回时发出部分或最终转录结果。

| 详情 | 值 |
| ------------- | ---------------------------------------------------------- |
| 网站 | [deepgram.com](https://deepgram.com) |
| 文档 | [developers.deepgram.com](https://developers.deepgram.com) |
| 身份验证 | `DEEPGRAM_API_KEY` |
| 默认模型 | `nova-3` |

## 入门指南

<Steps>
  <Step title="设置你的 API 密钥">
    将你的 Deepgram API 密钥添加到环境变量中：

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="启用音频提供商">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="发送语音便笺">
    通过任意已连接渠道发送一条音频消息。OpenClaw 会通过 Deepgram 对其进行转录，
    并将转录文本注入回复流水线。
  </Step>
</Steps>

## 配置选项

| 选项 | 路径 | 描述 |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model` | `tools.media.audio.models[].model` | Deepgram 模型 ID（默认：`nova-3`） |
| `language` | `tools.media.audio.models[].language` | 语言提示（可选） |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | 启用语言检测（可选） |
| `punctuate` | `tools.media.audio.providerOptions.deepgram.punctuate` | 启用标点（可选） |
| `smart_format` | `tools.media.audio.providerOptions.deepgram.smart_format` | 启用智能格式化（可选） |

<Tabs>
  <Tab title="使用语言提示">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="使用 Deepgram 选项">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Voice Call 流式 STT

内置的 `deepgram` 插件还为 Voice Call 插件注册了一个实时转录提供商。

| 设置 | 配置路径 | 默认值 |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| API 密钥 | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | 回退到 `DEEPGRAM_API_KEY` |
| 模型 | `...deepgram.model` | `nova-3` |
| 语言 | `...deepgram.language` | （未设置） |
| 编码 | `...deepgram.encoding` | `mulaw` |
| 采样率 | `...deepgram.sampleRate` | `8000` |
| Endpointing | `...deepgram.endpointingMs` | `800` |
| 临时结果 | `...deepgram.interimResults` | `true` |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call 接收的是 8 kHz G.711 u-law 电话音频。Deepgram
流式提供商默认使用 `encoding: "mulaw"` 和 `sampleRate: 8000`，因此
Twilio 媒体帧可以直接转发。
</Note>

## 说明

<AccordionGroup>
  <Accordion title="身份验证">
    身份验证遵循标准的提供商身份验证顺序。`DEEPGRAM_API_KEY` 是
    最简单的方式。
  </Accordion>
  <Accordion title="代理和自定义端点">
    使用代理时，可通过 `tools.media.audio.baseUrl` 和
    `tools.media.audio.headers` 覆盖端点或请求头。
  </Accordion>
  <Accordion title="输出行为">
    输出遵循与其他提供商相同的音频规则（大小上限、超时、
    转录文本注入）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="媒体工具" href="/zh-CN/tools/media-overview" icon="photo-film">
    音频、图像和视频处理流水线概览。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    包括媒体工具设置在内的完整配置参考。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题与调试步骤。
  </Card>
  <Card title="常见问题" href="/zh-CN/help/faq" icon="circle-question">
    关于 OpenClaw 设置的常见问题。
  </Card>
</CardGroup>
