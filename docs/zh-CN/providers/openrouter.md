---
read_when:
    - 你想用一个 API 密钥访问多个 LLM
    - 你想在 OpenClaw 中通过 OpenRouter 运行模型
    - 你想使用 OpenRouter 进行图像生成
summary: 使用 OpenRouter 的统一 API 在 OpenClaw 中访问多种模型
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T00:42:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter 提供一个**统一 API**，可通过单个端点和 API 密钥将请求路由到多种模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换基础 URL 即可使用。

## 入门指南

<Steps>
  <Step title="获取你的 API 密钥">
    在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建一个 API 密钥。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（可选）切换到特定模型">
    新手引导默认使用 `openrouter/auto`。你之后可以改为选择具体模型：

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
模型引用遵循 `openrouter/<provider>/<model>` 格式。有关可用提供商和模型的完整列表，请参见 [/concepts/model-providers](/zh-CN/concepts/model-providers)。
</Note>

内置回退示例：

| Model ref                            | 说明                         |
| ------------------------------------ | ---------------------------- |
| `openrouter/auto`                    | OpenRouter 自动路由          |
| `openrouter/moonshotai/kimi-k2.6`    | 通过 MoonshotAI 使用 Kimi K2.6 |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha 路由 |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha 路由 |

## 图像生成

OpenRouter 也可作为 `image_generate` 工具的后端。在 `agents.defaults.imageGenerationModel` 下使用 OpenRouter 图像模型：

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw 会将图像请求发送到 OpenRouter 的聊天补全图像 API，并使用 `modalities: ["image", "text"]`。Gemini 图像模型会通过 OpenRouter 的 `image_config` 接收受支持的 `aspectRatio` 和 `resolution` 提示。

## 身份验证和请求头

OpenRouter 在底层使用你的 API 密钥作为 Bearer token。

在真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`）中，OpenClaw 还会添加 OpenRouter 文档中说明的应用归因请求头：

| Header                    | 值                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
如果你将 OpenRouter 提供商重新指向其他代理或基础 URL，OpenClaw **不会**注入这些 OpenRouter 专用请求头或 Anthropic 缓存标记。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="Anthropic 缓存标记">
    在经过验证的 OpenRouter 路由上，Anthropic 模型引用会保留 OpenClaw 使用的 OpenRouter 专用 Anthropic `cache_control` 标记，以更好地复用 system/developer prompt 块上的提示词缓存。
  </Accordion>

  <Accordion title="Thinking / reasoning 注入">
    在受支持的非 `auto` 路由上，OpenClaw 会将所选的 thinking 级别映射为 OpenRouter 代理推理负载。不受支持的模型提示以及 `openrouter/auto` 会跳过此类推理注入。
  </Accordion>

  <Accordion title="仅 OpenAI 的请求整形">
    OpenRouter 仍通过代理式的 OpenAI 兼容路径运行，因此原生仅 OpenAI 的请求整形功能（例如 `serviceTier`、Responses `store`、OpenAI 推理兼容负载和提示词缓存提示）不会被转发。
  </Accordion>

  <Accordion title="Gemini 支持的路由">
    由 Gemini 支持的 OpenRouter 引用会保留在代理 Gemini 路径上：OpenClaw 会在该路径上保留 Gemini thought-signature 清理，但不会启用原生 Gemini 重放验证或引导重写。
  </Accordion>

  <Accordion title="提供商路由元数据">
    如果你在模型参数中传入 OpenRouter 提供商路由信息，OpenClaw 会在共享流包装器运行之前，将其作为 OpenRouter 路由元数据进行转发。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    agents、models 和 providers 的完整配置参考。
  </Card>
</CardGroup>
