---
read_when:
    - 你想在 OpenClaw 中使用由 Bedrock Mantle 托管的 OSS 模型
    - 你需要用于 GPT-OSS、Qwen、Kimi 或 GLM 的 Mantle OpenAI 兼容端点
summary: 使用 Amazon Bedrock Mantle（兼容 OpenAI）模型与 OpenClaw 配合使用
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-12T10:22:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27e602b6f6a3ae92427de135cb9df6356e0daaea6b6fe54723a7542dd0d5d21e
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw 内置了一个 **Amazon Bedrock Mantle** 提供商，可连接到 Mantle 的 OpenAI 兼容端点。Mantle 通过基于 Bedrock 基础设施的标准 `/v1/chat/completions` 接口托管开源和第三方模型（GPT-OSS、Qwen、Kimi、GLM 及类似模型）。

| 属性 | 值 |
| -------------- | ----------------------------------------------------------------------------------- |
| 提供商 ID | `amazon-bedrock-mantle` |
| API | `openai-completions`（兼容 OpenAI） |
| 认证 | 显式 `AWS_BEARER_TOKEN_BEDROCK` 或通过 IAM 凭证链生成 bearer token |
| 默认区域 | `us-east-1`（可通过 `AWS_REGION` 或 `AWS_DEFAULT_REGION` 覆盖） |

## 入门指南

选择你偏好的认证方式，并按照设置步骤进行操作。

<Tabs>
  <Tab title="显式 bearer token">
    **最适合：** 已经拥有 Mantle bearer token 的环境。

    <Steps>
      <Step title="在 Gateway 网关主机上设置 bearer token">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        你也可以选择设置区域（默认为 `us-east-1`）：

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="验证是否已发现模型">
        ```bash
        openclaw models list
        ```

        已发现的模型会显示在 `amazon-bedrock-mantle` 提供商下。除非你想覆盖默认设置，否则无需额外配置。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 凭证">
    **最适合：** 使用兼容 AWS SDK 的凭证（共享配置、SSO、web identity、实例角色或任务角色）。

    <Steps>
      <Step title="在 Gateway 网关主机上配置 AWS 凭证">
        任何兼容 AWS SDK 的认证来源都可以使用：

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="验证是否已发现模型">
        ```bash
        openclaw models list
        ```

        OpenClaw 会自动通过凭证链生成 Mantle bearer token。
      </Step>
    </Steps>

    <Tip>
    当未设置 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 会通过 AWS 默认凭证链为你签发 bearer token，其中包括共享凭证/配置 profile、SSO、web identity、实例角色或任务角色。
    </Tip>

  </Tab>
</Tabs>

## 自动模型发现

当设置了 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 会直接使用它。否则，OpenClaw 会尝试通过 AWS 默认凭证链生成 Mantle bearer token。然后，它会通过查询该区域的 `/v1/models` 端点来发现可用的 Mantle 模型。

| 行为 | 详情 |
| ----------------- | ------------------------- |
| 发现缓存 | 结果缓存 1 小时 |
| IAM token 刷新 | 每小时一次 |

<Note>
该 bearer token 与标准 [Amazon Bedrock](/zh-CN/providers/bedrock) 提供商使用的 `AWS_BEARER_TOKEN_BEDROCK` 相同。
</Note>

### 支持的区域

`us-east-1`、`us-east-2`、`us-west-2`、`ap-northeast-1`、
`ap-south-1`、`ap-southeast-3`、`eu-central-1`、`eu-west-1`、`eu-west-2`、
`eu-south-1`、`eu-north-1`、`sa-east-1`。

## 手动配置

如果你更喜欢显式配置而不是自动发现：

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

## 高级说明

<AccordionGroup>
  <Accordion title="推理支持">
    是否支持推理会根据模型 ID 中是否包含 `thinking`、`reasoner` 或 `gpt-oss-120b` 等模式来推断。对于匹配的模型，OpenClaw 会在发现时自动设置 `reasoning: true`。
  </Accordion>

  <Accordion title="端点不可用">
    如果 Mantle 端点不可用或未返回任何模型，该提供商会被静默跳过。OpenClaw 不会报错；其他已配置的提供商仍会继续正常工作。
  </Accordion>

  <Accordion title="与 Amazon Bedrock 提供商的关系">
    Bedrock Mantle 与标准的 [Amazon Bedrock](/zh-CN/providers/bedrock) 提供商是两个独立的提供商。Mantle 使用兼容 OpenAI 的 `/v1` 接口，而标准 Bedrock 提供商使用原生 Bedrock API。

    如果存在，这两个提供商会共用同一个 `AWS_BEARER_TOKEN_BEDROCK` 凭证。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/zh-CN/providers/bedrock" icon="cloud">
    适用于 Anthropic Claude、Titan 及其他模型的原生 Bedrock 提供商。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭证复用规则。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题及其解决方法。
  </Card>
</CardGroup>
