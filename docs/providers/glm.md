---
read_when:
    - 你想在 OpenClaw 中使用 GLM 模型
    - 你需要了解模型命名约定和设置方法
summary: GLM 模型家族概览及其在 OpenClaw 中的使用方式
title: GLM（智谱）
x-i18n:
    generated_at: "2026-04-23T23:02:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# GLM 模型

GLM 是一个**模型家族**（不是公司），可通过 Z.AI 平台使用。在 OpenClaw 中，GLM
模型通过 `zai` 提供商访问，模型 ID 形式如 `zai/glm-5`。

## 入门指南

<Steps>
  <Step title="选择一种 auth 方式并运行新手引导">
    选择与你的 Z.AI 套餐和区域匹配的新手引导选项：

    | Auth 选项 | 最适合 |
    | ----------- | -------- |
    | `zai-api-key` | 通用 API 密钥设置，并自动检测端点 |
    | `zai-coding-global` | Coding Plan 用户（全球） |
    | `zai-coding-cn` | Coding Plan 用户（中国区） |
    | `zai-global` | 通用 API（全球） |
    | `zai-cn` | 通用 API（中国区） |

    ```bash
    # Example: generic auto-detect
    openclaw onboard --auth-choice zai-api-key

    # Example: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="将 GLM 设为默认模型">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## 配置示例

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` 允许 OpenClaw 根据密钥检测匹配的 Z.AI 端点，并自动
应用正确的 base URL。当你希望强制使用特定的 Coding Plan 或通用 API 接口时，请使用显式的区域选项。
</Tip>

## 内置目录

OpenClaw 当前为内置 `zai` 提供商预置了以下 GLM 引用：

| 模型           | 模型            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
默认的内置模型引用是 `zai/glm-5.1`。GLM 版本和可用性
可能会变化；请查看 Z.AI 文档了解最新信息。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="端点自动检测">
    当你使用 `zai-api-key` auth 选项时，OpenClaw 会检查密钥格式，
    以确定正确的 Z.AI base URL。显式的区域选项
    （`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）会覆盖
    自动检测，并直接固定端点。
  </Accordion>

  <Accordion title="提供商详情">
    GLM 模型由 `zai` 运行时提供商提供。有关完整的提供商
    配置、区域端点和附加能力，请参阅
    [Z.AI 提供商文档](/zh-CN/providers/zai)。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Z.AI 提供商" href="/zh-CN/providers/zai" icon="server">
    完整的 Z.AI 提供商配置和区域端点。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和回退行为。
  </Card>
</CardGroup>
