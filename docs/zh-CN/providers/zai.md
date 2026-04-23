---
read_when:
    - 你想在 OpenClaw 中使用 Z.AI / GLM 模型
    - 你需要一个简单的 `ZAI_API_KEY` 设置
summary: 在 OpenClaw 中使用 Z.AI（GLM 模型）
title: Z.AI
x-i18n:
    generated_at: "2026-04-23T21:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 750a7d7196654fb01850dec7779eca3588a55e68144d8f6a12c12b9457f30e8d
    source_path: providers/zai.md
    workflow: 15
---

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API key
进行认证。请在 Z.AI 控制台中创建你的 API key。OpenClaw 使用 `zai` provider
并配合 Z.AI API key 使用。

- 提供商：`zai`
- 认证：`ZAI_API_KEY`
- API：Z.AI Chat Completions（Bearer 认证）

## 入门指南

<Tabs>
  <Tab title="自动检测端点">
    **最适合：** 大多数用户。OpenClaw 会根据 key 自动检测匹配的 Z.AI 端点，并自动应用正确的 base URL。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="显式区域端点">
    **最适合：** 希望强制指定某个 Coding Plan 或通用 API 界面的用户。

    <Steps>
      <Step title="选择正确的新手引导选项">
        ```bash
        # Coding Plan Global（推荐给 Coding Plan 用户）
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN（中国区）
        openclaw onboard --auth-choice zai-coding-cn

        # 通用 API
        openclaw onboard --auth-choice zai-global

        # 通用 API CN（中国区）
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 内置 GLM 目录

OpenClaw 当前为内置 `zai` provider 预置了以下模型：

| 模型引用 | 说明 |
| -------------------- | ------------- |
| `zai/glm-5.1` | 默认模型 |
| `zai/glm-5` |  |
| `zai/glm-5-turbo` |  |
| `zai/glm-5v-turbo` |  |
| `zai/glm-4.7` |  |
| `zai/glm-4.7-flash` |  |
| `zai/glm-4.7-flashx` |  |
| `zai/glm-4.6` |  |
| `zai/glm-4.6v` |  |
| `zai/glm-4.5` |  |
| `zai/glm-4.5-air` |  |
| `zai/glm-4.5-flash` |  |
| `zai/glm-4.5v` |  |

<Tip>
GLM 模型可使用 `zai/<model>` 形式（例如：`zai/glm-5`）。默认内置模型引用是 `zai/glm-5.1`。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="前向解析未知的 GLM-5 模型">
    未知的 `glm-5*` id 在内置 provider 路径上仍可前向解析：当该 id
    符合当前 GLM-5 家族形态时，会基于 `glm-4.7` 模板合成 provider 自有元数据。
  </Accordion>

  <Accordion title="工具调用流式传输">
    对于 Z.AI 的工具调用流式传输，`tool_stream` 默认启用。如需禁用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="图像理解">
    内置 Z.AI 插件注册了图像理解能力。

    | 属性 | 值 |
    | ------------- | ----------- |
    | 模型 | `glm-4.6v` |

    图像理解会从已配置的 Z.AI 认证中自动解析——无需额外配置。

  </Accordion>

  <Accordion title="认证细节">
    - Z.AI 使用 Bearer 认证和你的 API key。
    - `zai-api-key` 新手引导选项会根据 key 前缀自动检测匹配的 Z.AI 端点。
    - 当你想强制使用特定 API 界面时，请使用显式区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="GLM 模型家族" href="/zh-CN/providers/glm" icon="microchip">
    GLM 模型家族概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 provider、模型引用和故障转移行为。
  </Card>
</CardGroup>
