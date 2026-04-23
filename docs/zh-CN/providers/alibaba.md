---
read_when:
    - 你希望在 OpenClaw 中使用 Alibaba Wan 视频生成
    - 你需要为视频生成设置 Model Studio 或 DashScope API 密钥
summary: OpenClaw 中的 Alibaba Model Studio Wan 视频生成
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-23T20:59:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7ec2dda6bd172b81067f8a5c797ccac5b06d3ab0b4324167558e58b2b7f868c
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClaw 内置了一个 `alibaba` 视频生成 provider，用于在
Alibaba Model Studio / DashScope 上运行 Wan 模型。

- Provider：`alibaba`
- 首选认证方式：`MODELSTUDIO_API_KEY`
- 同样接受：`DASHSCOPE_API_KEY`、`QWEN_API_KEY`
- API：DashScope / Model Studio 异步视频生成

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="设置默认视频模型">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="验证 provider 可用">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
任意一个受支持的认证密钥（`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`、`QWEN_API_KEY`）都可以使用。`qwen-standard-api-key` 新手引导选项会配置共享的 DashScope 凭证。
</Note>

## 内置 Wan 模型

当前内置的 `alibaba` provider 会注册：

| 模型引用                   | 模式                     |
| -------------------------- | ------------------------ |
| `alibaba/wan2.6-t2v`       | 文本生成视频             |
| `alibaba/wan2.6-i2v`       | 图像生成视频             |
| `alibaba/wan2.6-r2v`       | 参考生成视频             |
| `alibaba/wan2.6-r2v-flash` | 参考生成视频（快速）     |
| `alibaba/wan2.7-r2v`       | 参考生成视频             |

## 当前限制

| 参数                  | 限制                                                      |
| --------------------- | --------------------------------------------------------- |
| 输出视频              | 每次请求最多 **1** 个                                     |
| 输入图像              | 最多 **1** 个                                             |
| 输入视频              | 最多 **4** 个                                             |
| 时长                  | 最长 **10 秒**                                            |
| 支持的控制项          | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |
| 参考图像/视频         | 仅支持远程 `http(s)` URL                                  |

<Warning>
参考图像/视频模式当前要求使用**远程 http(s) URL**。不支持将本地文件路径作为参考输入。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="与 Qwen 的关系">
    内置的 `qwen` provider 也会使用 Alibaba 托管的 DashScope 端点来进行
    Wan 视频生成。使用方式如下：

    - 当你希望使用标准 Qwen provider 界面时，使用 `qwen/...`
    - 当你希望使用由供应商直接拥有的 Wan 视频界面时，使用 `alibaba/...`

    更多细节请参阅 [Qwen provider 文档](/zh-CN/providers/qwen)。

  </Accordion>

  <Accordion title="认证密钥优先级">
    OpenClaw 会按以下顺序检查认证密钥：

    1. `MODELSTUDIO_API_KEY`（首选）
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    任意一个都可以用于认证 `alibaba` provider。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和 provider 选择。
  </Card>
  <Card title="Qwen" href="/zh-CN/providers/qwen" icon="microchip">
    Qwen provider 设置与 DashScope 集成。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference#agent-defaults" icon="gear">
    智能体默认值和模型配置。
  </Card>
</CardGroup>
