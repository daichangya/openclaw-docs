---
read_when:
    - 你希望在 OpenClaw 中使用 Runway 视频生成
    - 你需要 Runway API 密钥/环境变量设置
    - 你想将 Runway 设为默认视频 provider
summary: OpenClaw 中的 Runway 视频生成设置
title: Runway
x-i18n:
    generated_at: "2026-04-23T21:02:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0caa1c286a4e7ce25a2876f51d09ea462978746fb7a6f428395f67b78d56b2
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw 内置了一个 `runway` provider，用于托管式视频生成。

| 属性        | 值                                                                |
| ----------- | ----------------------------------------------------------------- |
| Provider id | `runway`                                                          |
| 认证        | `RUNWAYML_API_SECRET`（标准方式）或 `RUNWAY_API_KEY`              |
| API         | 基于任务的 Runway 视频生成（轮询 `GET /v1/tasks/{id}`）           |

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="将 Runway 设为默认视频 provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="生成视频">
    让智能体生成一个视频。系统会自动使用 Runway。
  </Step>
</Steps>

## 支持的模式

| 模式           | 模型               | 参考输入                 |
| -------------- | ------------------ | ------------------------ |
| 文本生成视频   | `gen4.5`（默认）   | 无                       |
| 图像生成视频   | `gen4.5`           | 1 张本地或远程图像       |
| 视频生成视频   | `gen4_aleph`       | 1 个本地或远程视频       |

<Note>
支持通过 data URI 使用本地图像和视频参考。当前纯文本运行
仅暴露 `16:9` 和 `9:16` 宽高比。
</Note>

<Warning>
视频到视频当前必须明确使用 `runway/gen4_aleph`。
</Warning>

## 配置

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="环境变量别名">
    OpenClaw 同时识别 `RUNWAYML_API_SECRET`（标准方式）和 `RUNWAY_API_KEY`。
    任意一个变量都可以认证 Runway provider。
  </Accordion>

  <Accordion title="任务轮询">
    Runway 使用基于任务的 API。提交生成请求后，OpenClaw
    会轮询 `GET /v1/tasks/{id}`，直到视频准备完成。此轮询行为
    不需要额外配置。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享工具参数、provider 选择和异步行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference#agent-defaults" icon="gear">
    智能体默认设置，包括视频生成模型。
  </Card>
</CardGroup>
