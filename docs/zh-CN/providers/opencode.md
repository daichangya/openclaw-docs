---
read_when:
    - |-
      你希望使用 OpenCode 托管的模型访问】【。analysis to=functions.read code ുകള്json
      {"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n/","offset":1,"limit":1}
    - 你希望在 Zen 和 Go 目录之间进行选择
summary: 在 OpenClaw 中使用 OpenCode Zen 和 Go 目录
title: OpenCode
x-i18n:
    generated_at: "2026-04-23T21:01:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: d017d3a3c9ffa1cefe66823e822080fde8c69429ba945c4e5883723e8bfe9c22
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode 在 OpenClaw 中暴露了两个托管目录：

| 目录 | 前缀 | 运行时 provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...` | `opencode` |
| **Go** | `opencode-go/...` | `opencode-go` |

两个目录都使用同一个 OpenCode API key。OpenClaw 会将运行时 provider id
保持拆分，以确保上游按模型路由保持正确，但在新手引导和文档中会将它们
视为同一个 OpenCode 设置。

## 快速开始

<Tabs>
  <Tab title="Zen 目录">
    **最适合：** 精选的 OpenCode 多模型代理（Claude、GPT、Gemini）。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        或直接传入 key：

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将一个 Zen 模型设为默认值">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go 目录">
    **最适合：** OpenCode 托管的 Kimi、GLM 和 MiniMax 阵容。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        或直接传入 key：

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将一个 Go 模型设为默认值">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="验证模型可用">
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
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 目录

### Zen

| 属性 | 值 |
| ---------------- | ----------------------------------------------------------------------- |
| 运行时 provider | `opencode` |
| 示例模型 | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| 属性 | 值 |
| ---------------- | ------------------------------------------------------------------------ |
| 运行时 provider | `opencode-go` |
| 示例模型 | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## 高级配置

<AccordionGroup>
  <Accordion title="API key 别名">
    `OPENCODE_ZEN_API_KEY` 也支持作为 `OPENCODE_API_KEY` 的别名。
  </Accordion>

  <Accordion title="共享凭证">
    在设置期间输入一个 OpenCode key，会同时为两个运行时
    provider 存储凭证。你不需要分别为每个目录执行新手引导。
  </Accordion>

  <Accordion title="计费与控制台">
    你需要登录 OpenCode、添加计费信息并复制 API key。计费
    和目录可用性由 OpenCode 控制台统一管理。
  </Accordion>

  <Accordion title="Gemini 重放行为">
    基于 Gemini 的 OpenCode 引用会保留在代理 Gemini 路径上，因此 OpenClaw 会继续
    在那里保留 Gemini thought-signature 清理，而不会启用原生 Gemini
    重放校验或 bootstrap 重写。
  </Accordion>

  <Accordion title="非 Gemini 重放行为">
    非 Gemini 的 OpenCode 引用会保留最小化 OpenAI 兼容重放策略。
  </Accordion>
</AccordionGroup>

<Tip>
在设置期间输入一个 OpenCode key，会同时为 Zen 和
Go 运行时 provider 存储凭证，因此你只需要进行一次新手引导。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 providers、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    agents、models 和 providers 的完整配置参考。
  </Card>
</CardGroup>
