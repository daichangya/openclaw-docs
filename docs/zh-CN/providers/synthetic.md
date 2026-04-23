---
read_when:
    - 你想将 Synthetic 用作模型提供商♀♀♀♀♀♀analysis to=functions.read 】【。】【”】【commentary 植物百科通json? no. translate.
    - 你需要设置 Synthetic API 密钥或 base URL
summary: 在 OpenClaw 中使用 Synthetic 的兼容 Anthropic API
title: Synthetic
x-i18n:
    generated_at: "2026-04-23T21:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3cc907fab62bb421488a4ca1892e08c6b6f77e43cc33179f787a9b6b134513f9
    source_path: providers/synthetic.md
    workflow: 15
---

[Synthetic](https://synthetic.new) 提供兼容 Anthropic 的端点。
OpenClaw 将其注册为 `synthetic` 提供商，并使用 Anthropic
Messages API。

| 属性     | 值                                      |
| -------- | --------------------------------------- |
| 提供商   | `synthetic`                             |
| 身份验证 | `SYNTHETIC_API_KEY`                     |
| API      | Anthropic Messages                      |
| Base URL | `https://api.synthetic.new/anthropic`   |

## 入门指南

<Steps>
  <Step title="获取 API 密钥">
    从你的 Synthetic 账户获取 `SYNTHETIC_API_KEY`，或者让
    新手引导向导提示你输入。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="验证默认模型">
    新手引导完成后，默认模型会设置为：
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw 的 Anthropic 客户端会自动在 base URL 后追加 `/v1`，因此请使用
`https://api.synthetic.new/anthropic`（而不是 `/anthropic/v1`）。如果 Synthetic
更改了它的 base URL，请覆盖 `models.providers.synthetic.baseUrl`。
</Warning>

## 配置示例

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## 模型目录

所有 Synthetic 模型的成本都为 `0`（输入/输出/cache）。

| 模型 ID                                                | 上下文窗口     | 最大 token | 推理      | 输入         |
| ------------------------------------------------------ | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536     | 否        | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192      | 是        | text         |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000    | 否        | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192      | 否        | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192      | 否        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192      | 否        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192      | 否        | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192      | 否        | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192      | 否        | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192      | 否        | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192      | 否        | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192      | 是        | text + image |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192      | 否        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192      | 否        | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192      | 否        | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192      | 否        | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000    | 否        | text         |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000    | 否        | text         |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000    | 是        | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192      | 否        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192      | 是        | text         |

<Tip>
模型引用使用 `synthetic/<modelId>` 的形式。使用
`openclaw models list --provider synthetic` 可查看你账户中所有可用模型。
</Tip>

<AccordionGroup>
  <Accordion title="模型 allowlist">
    如果你启用了模型 allowlist（`agents.defaults.models`），请添加你计划使用的每一个
    Synthetic 模型。未列入 allowlist 的模型会对智能体隐藏。
  </Accordion>

  <Accordion title="Base URL 覆盖">
    如果 Synthetic 更改了其 API 端点，请在配置中覆盖 base URL：

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    请记住，OpenClaw 会自动追加 `/v1`。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商规则、模型引用和故障切换行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    包括提供商设置在内的完整配置 schema。
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic 控制台和 API 文档。
  </Card>
</CardGroup>
