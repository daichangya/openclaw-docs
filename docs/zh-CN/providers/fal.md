---
read_when:
    - 你想在 OpenClaw 中使用 fal 图像生成
    - 你需要 `FAL_KEY` 认证流程
    - 你想为 `image_generate` 或 `video_generate` 使用 fal 默认设置
summary: 在 OpenClaw 中设置 fal 图像和视频生成
title: fal
x-i18n:
    generated_at: "2026-04-12T10:22:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff275233179b4808d625383efe04189ad9e92af09944ba39f1e953e77378e347
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw 内置了一个 `fal` 提供商，用于托管图像和视频生成。

| 属性 | 值 |
| -------- | ------------------------------------------------------------- |
| 提供商 | `fal` |
| 认证 | `FAL_KEY`（规范方式；`FAL_API_KEY` 也可作为回退方式使用） |
| API | fal 模型端点 |

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="设置默认图像模型">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## 图像生成

内置的 `fal` 图像生成提供商默认使用
`fal/fal-ai/flux/dev`。

| 能力 | 值 |
| -------------- | -------------------------- |
| 最大图像数 | 每次请求 4 张 |
| 编辑模式 | 已启用，1 张参考图像 |
| 尺寸覆盖 | 支持 |
| 宽高比 | 支持 |
| 分辨率 | 支持 |

<Warning>
fal 图像编辑端点**不**支持 `aspectRatio` 覆盖。
</Warning>

要将 fal 用作默认图像提供商：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## 视频生成

内置的 `fal` 视频生成提供商默认使用
`fal/fal-ai/minimax/video-01-live`。

| 能力 | 值 |
| ---------- | ------------------------------------------------------------ |
| 模式 | 文本生成视频、单图参考 |
| 运行方式 | 由队列支持的提交 / 状态 / 结果流程，用于长时间运行的任务 |

<AccordionGroup>
  <Accordion title="可用视频模型">
    **HeyGen 视频智能体：**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0：**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 配置示例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="HeyGen video-agent 配置示例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
使用 `openclaw models list --provider fal` 查看完整的可用 fal 模型列表，包括最近新增的条目。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享的图像工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享的视频工具参数和提供商选择。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference#agent-defaults" icon="gear">
    智能体默认设置，包括图像和视频模型选择。
  </Card>
</CardGroup>
