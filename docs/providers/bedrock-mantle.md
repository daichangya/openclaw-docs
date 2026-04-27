---
read_when:
    - 你想在 OpenClaw 中使用由 Bedrock Mantle 托管的 OSS 模型
    - 你需要 Mantle 的兼容 OpenAI 端点来使用 GPT-OSS、Qwen、Kimi 或 GLM
summary: 在 OpenClaw 中使用 Amazon Bedrock Mantle（兼容 OpenAI）模型
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T20:59:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

OpenClaw 内置了一个 **Amazon Bedrock Mantle** 提供商，用于连接
Mantle 的兼容 OpenAI 端点。Mantle 通过一个标准的
`/v1/chat/completions` 接口并依托 Bedrock 基础设施托管开源和
第三方模型（GPT-OSS、Qwen、Kimi、GLM 等）。

| 属性           | 值                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------- |
| 提供商 ID      | `amazon-bedrock-mantle`                                                                      |
| API            | `openai-completions`（兼容 OpenAI）或 `anthropic-messages`（Anthropic Messages 路由）        |
| 身份验证       | 显式 `AWS_BEARER_TOKEN_BEDROCK` 或通过 IAM 凭证链生成 bearer token                            |
| 默认区域       | `us-east-1`（可通过 `AWS_REGION` 或 `AWS_DEFAULT_REGION` 覆盖）                              |

## 入门指南

选择你偏好的身份验证方式，并按照设置步骤操作。

<Tabs>
  <Tab title="显式 bearer token">
    **最适合：** 已经拥有 Mantle bearer token 的环境。

    <Steps>
      <Step title="在 gateway 主机上设置 bearer token">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        也可以选择设置区域（默认是 `us-east-1`）：

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="验证模型已被发现">
        ```bash
        openclaw models list
        ```

        已发现的模型会出现在 `amazon-bedrock-mantle` 提供商下。除非你想覆盖默认值，否则无需
        额外配置。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 凭证">
    **最适合：** 使用兼容 AWS SDK 的凭证（共享配置、SSO、web identity、实例角色或任务角色）。

    <Steps>
      <Step title="在 gateway 主机上配置 AWS 凭证">
        任何兼容 AWS SDK 的身份验证来源都可使用：

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="验证模型已被发现">
        ```bash
        openclaw models list
        ```

        OpenClaw 会自动从凭证链生成 Mantle bearer token。
      </Step>
    </Steps>

    <Tip>
    当未设置 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 会通过 AWS 默认凭证链为你生成 bearer token，其中包括共享 credentials/config 配置文件、SSO、web identity，以及实例角色或任务角色。
    </Tip>

  </Tab>
</Tabs>

## 自动模型发现

设置了 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 会直接使用它。否则，
OpenClaw 会尝试从 AWS 默认
凭证链生成 Mantle bearer token。然后它会通过查询该
区域的 `/v1/models` 端点来发现可用的 Mantle 模型。

| 行为             | 详情                    |
| ---------------- | ----------------------- |
| 发现缓存         | 结果缓存 1 小时         |
| IAM 令牌刷新     | 每小时一次              |

<Note>
该 bearer token 与标准 [Amazon Bedrock](/zh-CN/providers/bedrock) 提供商使用的 `AWS_BEARER_TOKEN_BEDROCK` 是同一个。
</Note>

### 支持的区域

`us-east-1`、`us-east-2`、`us-west-2`、`ap-northeast-1`、
`ap-south-1`、`ap-southeast-3`、`eu-central-1`、`eu-west-1`、`eu-west-2`、
`eu-south-1`、`eu-north-1`、`sa-east-1`。

## 手动配置

如果你更倾向于显式配置而不是自动发现：

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="推理支持">
    推理支持会根据模型 ID 中是否包含诸如
    `thinking`、`reasoner` 或 `gpt-oss-120b` 之类的模式来推断。OpenClaw 会在发现阶段自动为匹配的模型设置 `reasoning: true`。
  </Accordion>

  <Accordion title="端点不可用">
    如果 Mantle 端点不可用或未返回任何模型，该提供商会被
    静默跳过。OpenClaw 不会报错；其他已配置提供商
    仍会正常工作。
  </Accordion>

  <Accordion title="通过 Anthropic Messages 路由使用 Claude Opus 4.7">
    Mantle 还暴露了一个 Anthropic Messages 路由，可通过相同的 bearer 身份验证流式路径承载 Claude 模型。Claude Opus 4.7（`amazon-bedrock-mantle/claude-opus-4.7`）可以通过该路由调用，并由提供商自有流式传输支持，因此 AWS bearer token 不会被当作 Anthropic API 密钥处理。

    当你在 Mantle 提供商上固定一个 Anthropic Messages 模型时，OpenClaw 会对此模型使用 `anthropic-messages` API 接口，而不是 `openai-completions`。身份验证仍然来自 `AWS_BEARER_TOKEN_BEDROCK`（或通过 IAM 生成的 bearer token）。

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="与 Amazon Bedrock 提供商的关系">
    Bedrock Mantle 与标准
    [Amazon Bedrock](/zh-CN/providers/bedrock) 提供商是分开的。Mantle 使用兼容 OpenAI 的
    `/v1` 接口，而标准 Bedrock 提供商使用
    原生 Bedrock API。

    当存在时，这两个提供商共享同一个 `AWS_BEARER_TOKEN_BEDROCK` 凭证。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/zh-CN/providers/bedrock" icon="cloud">
    Anthropic Claude、Titan 及其他模型的原生 Bedrock 提供商。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    如何选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/zh-CN/gateway/authentication" icon="key">
    身份验证细节和凭证复用规则。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
