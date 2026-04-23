---
read_when:
    - 你想用一个 API key 访问许多 LLM】【。analysis to=final code omitted due developer?
    - 你想在 OpenClaw 中通过 OpenRouter 运行模型
summary: 使用 OpenRouter 的统一 API 在 OpenClaw 中访问多种模型
title: OpenRouter
x-i18n:
    generated_at: "2026-04-23T21:01:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29532ce2b7fa2b4643db155f6fd6ee17fd9d14ddf65d5e78d0970a4db7b7694a
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter 提供了一个**统一 API**，可通过单个
端点和 API key 将请求路由到众多模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

## 快速开始

<Steps>
  <Step title="获取你的 API key">
    在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建一个 API key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（可选）切换到特定模型">
    新手引导默认使用 `openrouter/auto`。你之后可以选择一个具体模型：

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## 配置示例

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## 模型引用

<Note>
模型引用遵循 `openrouter/<provider>/<model>` 模式。有关
可用提供商和模型的完整列表，请参阅 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
</Note>

内置回退示例：

| 模型引用 | 说明 |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto` | OpenRouter 自动路由 |
| `openrouter/moonshotai/kimi-k2.6` | 通过 MoonshotAI 访问 Kimi K2.6 |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha 路由 |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha 路由 |

## 身份验证与请求头

OpenRouter 在底层使用 Bearer token 携带你的 API key。

在真实 OpenRouter 请求（`https://openrouter.ai/api/v1`）上，OpenClaw 还会添加
OpenRouter 文档中定义的应用归因头：

| 请求头 | 值 |
| ------------------------- | --------------------- |
| `HTTP-Referer` | `https://openclaw.ai` |
| `X-OpenRouter-Title` | `OpenClaw` |
| `X-OpenRouter-Categories` | `cli-agent` |

<Warning>
如果你将 OpenRouter 提供商改指向其他代理或 base URL，OpenClaw
将**不会**注入这些 OpenRouter 专用请求头，也不会注入 Anthropic 缓存标记。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="Anthropic 缓存标记">
    在已验证的 OpenRouter 路由上，Anthropic 模型引用会保留
    OpenRouter 专用的 Anthropic `cache_control` 标记。OpenClaw 使用这些标记
    以更好地复用 system / developer 提示词块上的提示词缓存。
  </Accordion>

  <Accordion title="Thinking / 推理注入">
    在受支持的非 `auto` 路由上，OpenClaw 会将所选 thinking 等级映射为
    OpenRouter 代理推理负载。对于不支持的模型提示以及
    `openrouter/auto`，会跳过该推理注入。
  </Accordion>

  <Accordion title="仅 OpenAI 的请求整形">
    OpenRouter 仍然通过代理风格的 OpenAI 兼容路径运行，因此
    原生仅 OpenAI 的请求整形，例如 `serviceTier`、Responses `store`、
    OpenAI 推理兼容负载，以及提示词缓存提示，都不会被转发。
  </Accordion>

  <Accordion title="Gemini 支持的路由">
    基于 Gemini 的 OpenRouter 引用仍走代理 Gemini 路径：OpenClaw 会在其中
    保留 Gemini thought-signature 清理，但不会启用原生 Gemini
    重放验证或 bootstrap 重写。
  </Accordion>

  <Accordion title="提供商路由元数据">
    如果你在模型参数下传入 OpenRouter 提供商路由信息，OpenClaw 会在共享流包装器运行之前，
    将其转发为 OpenRouter 路由元数据。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
