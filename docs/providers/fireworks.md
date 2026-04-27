---
read_when:
    - 你想将 Fireworks 与 OpenClaw 一起使用
    - 你需要 Fireworks API 密钥环境变量或默认模型 id
summary: Fireworks 设置（身份验证 + 模型选择）
title: Fireworks
x-i18n:
    generated_at: "2026-04-23T21:00:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) 通过 OpenAI 兼容 API 暴露开放权重模型和路由模型。OpenClaw 内置了一个 Fireworks 提供商插件。

| 属性 | 值 |
| ------------- | ------------------------------------------------------ |
| 提供商 | `fireworks` |
| 身份验证 | `FIREWORKS_API_KEY` |
| API | OpenAI 兼容 chat/completions |
| Base URL | `https://api.fireworks.ai/inference/v1` |
| 默认模型 | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## 入门指南

<Steps>
  <Step title="通过新手引导设置 Fireworks 身份验证">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    这会将你的 Fireworks 密钥存储到 OpenClaw 配置中，并将 Fire Pass 入门模型设为默认值。

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本或 CI 设置，请在命令行上传入所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 内置目录

| 模型引用 | 名称 | 输入 | 上下文 | 最大输出 | 说明 |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6` | Kimi K2.6 | text,image | 262,144 | 262,144 | Fireworks 上最新的 Kimi 模型。Fireworks K2.6 请求中禁用了 thinking；如果你需要 Kimi 的 thinking 输出，请直接通过 Moonshot 路由。 |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo（Fire Pass） | text,image | 256,000 | 256,000 | Fireworks 中默认内置的入门模型 |

<Tip>
如果 Fireworks 发布了更新的模型，例如新的 Qwen 或 Gemma 版本，你可以直接使用其 Fireworks 模型 id 切换，而无需等待内置目录更新。
</Tip>

## 自定义 Fireworks 模型 id

OpenClaw 也接受动态 Fireworks 模型 id。请使用 Fireworks 显示的精确模型或路由器 id，并加上 `fireworks/` 前缀。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="模型 id 前缀如何工作">
    OpenClaw 中的每个 Fireworks 模型引用都以 `fireworks/` 开头，后跟 Fireworks 平台中的精确 id 或路由路径。例如：

    - 路由器模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 在构建 API 请求时会去掉 `fireworks/` 前缀，并将剩余路径发送到 Fireworks 端点。

  </Accordion>

  <Accordion title="环境变量说明">
    如果 Gateway 网关运行在你的交互式 shell 之外，请确保 `FIREWORKS_API_KEY` 对该进程也可用。

    <Warning>
    仅存在于 `~/.profile` 中的密钥对 launchd/systemd 守护进程没有帮助，除非该环境也被导入到了那里。请将密钥设置在 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供，以确保 gateway 进程可以读取它。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    通用故障排除和常见问题。
  </Card>
</CardGroup>
