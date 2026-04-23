---
read_when:
    - 你想使用 OpenCode Go 目录
    - 你需要了解 Go 托管模型的运行时模型引用
summary: 使用共享的 OpenCode 设置来使用 OpenCode Go 目录
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-23T23:02:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ca7e7c63f95cbb698d5193c2d9fa48576a8d7311dbd7fa4e2f10a42e275a7
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go 是 [OpenCode](/zh-CN/providers/opencode) 中的 Go 目录。
它使用与 Zen 目录相同的 `OPENCODE_API_KEY`，但保留运行时
提供商 ID `opencode-go`，以确保上游的按模型路由保持正确。

| 属性         | 值                           |
| ---------------- | ------------------------------- |
| 运行时提供商 | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| 父级设置     | [OpenCode](/zh-CN/providers/opencode) |

## 内置目录

OpenClaw 从内置的 Pi 模型注册表中获取 Go 目录。运行
`openclaw models list --provider opencode-go` 可查看当前模型列表。

根据当前内置的 Pi 目录，该提供商包括：

| 模型引用                  | 名称                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6（3 倍限制） |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## 入门指南

<Tabs>
  <Tab title="交互式">
    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="将 Go 模型设为默认值">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="非交互式">
    <Steps>
      <Step title="直接传入密钥">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 配置示例

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="路由行为">
    当模型引用使用
    `opencode-go/...` 时，OpenClaw 会自动处理按模型路由。
    无需额外的提供商配置。
  </Accordion>

  <Accordion title="运行时引用约定">
    运行时引用保持显式：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`。
    这样可以确保两个目录的上游按模型路由保持正确。
  </Accordion>

  <Accordion title="共享凭证">
    Zen 和 Go 目录共用同一个 `OPENCODE_API_KEY`。在设置过程中输入
    该密钥后，会同时为这两个运行时提供商存储凭证。
  </Accordion>
</AccordionGroup>

<Tip>
有关共享新手引导概览以及完整的
Zen + Go 目录参考，请参阅 [OpenCode](/zh-CN/providers/opencode)。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="OpenCode（父级）" href="/zh-CN/providers/opencode" icon="server">
    共享新手引导、目录概览和高级说明。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和回退行为。
  </Card>
</CardGroup>
