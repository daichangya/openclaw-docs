---
read_when:
    - 你想在 OpenClaw 中使用 Amazon Bedrock 模型
    - 你需要为模型调用设置 AWS 凭证/区域
summary: 在 OpenClaw 中使用 Amazon Bedrock（Converse API）模型
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-23T20:59:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

OpenClaw 可以通过 pi-ai 的 **Bedrock Converse**
流式提供商使用 **Amazon Bedrock** 模型。Bedrock 认证使用的是 **AWS SDK 默认凭证链**，而不是 API key。

| 属性 | 值 |
| -------- | ----------------------------------------------------------- |
| 提供商 | `amazon-bedrock` |
| API | `bedrock-converse-stream` |
| 认证 | AWS 凭证（环境变量、共享配置或实例角色） |
| 区域 | `AWS_REGION` 或 `AWS_DEFAULT_REGION`（默认：`us-east-1`） |

## 入门指南

请选择你偏好的认证方式，并按照相应步骤进行设置。

<Tabs>
  <Tab title="访问密钥 / 环境变量">
    **最适合：** 开发者机器、CI，或你直接管理 AWS 凭证的主机。

    <Steps>
      <Step title="在 gateway 主机上设置 AWS 凭证">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # 可选：
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # 可选（Bedrock API key/bearer token）：
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="在配置中添加 Bedrock 提供商和模型">
        不需要 `apiKey`。请使用 `auth: "aws-sdk"` 配置该提供商：

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    使用 env-marker 认证（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE` 或 `AWS_BEARER_TOKEN_BEDROCK`）时，OpenClaw 会自动启用隐式 Bedrock 提供商，以便在无需额外配置的情况下进行模型发现。
    </Tip>

  </Tab>

  <Tab title="EC2 实例角色（IMDS）">
    **最适合：** 已附加 IAM 角色的 EC2 实例，并通过实例元数据服务进行认证。

    <Steps>
      <Step title="显式启用发现">
        使用 IMDS 时，OpenClaw 无法仅凭 env markers 检测 AWS 认证，因此你必须显式开启：

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="可选：添加 env marker 以支持自动模式">
        如果你还希望 env-marker 自动检测路径生效（例如用于 `openclaw status` 界面）：

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        你**不**需要伪造 API key。
      </Step>
      <Step title="验证模型已被发现">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    附加到 EC2 实例的 IAM 角色必须具备以下权限：

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels`（用于自动发现）
    - `bedrock:ListInferenceProfiles`（用于推理配置档案发现）

    或者直接附加托管策略 `AmazonBedrockFullAccess`。
    </Warning>

    <Note>
    只有当你明确希望自动模式或状态界面使用 env marker 时，才需要 `AWS_PROFILE=default`。实际的 Bedrock 运行时认证路径使用的是 AWS SDK 默认链，因此即使没有 env markers，IMDS 实例角色认证也能工作。
    </Note>

  </Tab>
</Tabs>

## 自动模型发现

OpenClaw 可以自动发现支持**流式传输**
和**文本输出**的 Bedrock 模型。发现过程使用 `bedrock:ListFoundationModels` 和
`bedrock:ListInferenceProfiles`，结果会被缓存（默认：1 小时）。

隐式 provider 的启用方式：

- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 为 `true`，
  即使没有 AWS env marker，OpenClaw 也会尝试进行发现。
- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 未设置，
  OpenClaw 只有在检测到以下某种 AWS 认证标记时，才会自动添加
  隐式 Bedrock provider：
  `AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`，或 `AWS_PROFILE`。
- 实际的 Bedrock 运行时认证路径仍然使用 AWS SDK 默认链，因此
  即使发现过程需要通过 `enabled: true` 显式启用，共享配置、SSO 和 IMDS 实例角色认证仍然可以工作。

<Note>
对于显式的 `models.providers["amazon-bedrock"]` 条目，OpenClaw 仍然可以通过 AWS env markers（例如 `AWS_BEARER_TOKEN_BEDROCK`）提前解析 Bedrock env-marker 认证，而无需强制加载完整运行时认证。实际的模型调用认证路径仍然使用 AWS SDK 默认链。
</Note>

<AccordionGroup>
  <Accordion title="发现配置选项">
    配置项位于 `plugins.entries.amazon-bedrock.config.discovery` 下：

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | 选项 | 默认值 | 描述 |
    | ------ | ------- | ----------- |
    | `enabled` | auto | 在自动模式下，OpenClaw 只有在检测到受支持的 AWS env marker 时，才会启用隐式 Bedrock provider。设置为 `true` 可强制启用发现。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 发现 API 调用所使用的 AWS 区域。 |
    | `providerFilter` | （全部） | 匹配 Bedrock provider 名称（例如 `anthropic`、`amazon`）。 |
    | `refreshInterval` | `3600` | 缓存时长（秒）。设为 `0` 可禁用缓存。 |
    | `defaultContextWindow` | `32000` | 用于已发现模型的上下文窗口（如果你清楚模型限制，可覆盖）。 |
    | `defaultMaxTokens` | `4096` | 用于已发现模型的最大输出 tokens（如果你清楚模型限制，可覆盖）。 |

  </Accordion>
</AccordionGroup>

## 快速设置（AWS 路径）

本演练将创建一个 IAM 角色、附加 Bedrock 权限、关联
实例配置档案，并在 EC2 主机上启用 OpenClaw 发现。

```bash
# 1. 创建 IAM 角色和实例配置档案
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. 附加到你的 EC2 实例
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. 在 EC2 实例上显式启用发现
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. 可选：如果你想在不显式启用的情况下使用自动模式，可添加一个 env marker
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. 验证模型已被发现
openclaw models list
```

## 高级配置

<AccordionGroup>
  <Accordion title="推理配置档案">
    OpenClaw 会同时发现**区域和全局推理配置档案**以及
    foundation models。当某个配置档案映射到已知 foundation model 时，该
    配置档案会继承该模型的能力（上下文窗口、最大 tokens、reasoning、vision），并且会自动注入正确的 Bedrock 请求区域。这意味着跨区域 Claude 配置档案无需手动 provider 覆盖即可工作。

    推理配置档案 ID 的形式如 `us.anthropic.claude-opus-4-6-v1:0`（区域）
    或 `anthropic.claude-opus-4-6-v1:0`（全局）。如果其后端模型已经
    出现在发现结果中，则该配置档案会继承其完整能力集；否则会应用安全默认值。

    无需额外配置。只要启用了发现，并且 IAM
    principal 具有 `bedrock:ListInferenceProfiles`，配置档案就会与
    foundation models 一同出现在 `openclaw models list` 中。

  </Accordion>

  <Accordion title="Guardrails">
    你可以通过在
    `amazon-bedrock` 插件配置中添加 `guardrail` 对象，将 [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    应用于所有 Bedrock 模型调用。Guardrails 可让你强制执行内容过滤、
    主题拒绝、词过滤、敏感信息过滤和上下文 grounding 检查。

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID 或完整 ARN
                guardrailVersion: "1", // 版本号或 "DRAFT"
                streamProcessingMode: "sync", // 可选："sync" 或 "async"
                trace: "enabled", // 可选："enabled"、"disabled" 或 "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | 选项 | 必需 | 描述 |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | 是 | Guardrail ID（例如 `abc123`）或完整 ARN（例如 `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。 |
    | `guardrailVersion` | 是 | 已发布版本号，或工作草稿的 `"DRAFT"`。 |
    | `streamProcessingMode` | 否 | 流式传输期间 guardrail 评估的 `"sync"` 或 `"async"`。若省略，则使用 Bedrock 默认值。 |
    | `trace` | 否 | 用于调试时可设为 `"enabled"` 或 `"enabled_full"`；生产环境中请省略或设为 `"disabled"`。 |

    <Warning>
    gateway 使用的 IAM principal 除标准调用权限外，还必须具备 `bedrock:ApplyGuardrail` 权限。
    </Warning>

  </Accordion>

  <Accordion title="用于记忆搜索的 Embeddings">
    Bedrock 还可以作为
    [记忆搜索](/zh-CN/concepts/memory-search) 的 embedding 提供商。它与
    推理 provider 分开配置——请将 `agents.defaults.memorySearch.provider` 设为 `"bedrock"`：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // 默认值
          },
        },
      },
    }
    ```

    Bedrock embeddings 使用与推理相同的 AWS SDK 凭证链（实例
    角色、SSO、访问密钥、共享配置和 web identity）。不需要 API key。
    当 `provider` 为 `"auto"` 时，如果该
    凭证链成功解析，Bedrock 会被自动检测出来。

    支持的 embedding 模型包括 Amazon Titan Embed（v1、v2）、Amazon Nova
    Embed、Cohere Embed（v3、v4）以及 TwelveLabs Marengo。完整模型列表和维度选项请参阅
    [记忆配置参考——Bedrock](/zh-CN/reference/memory-config#bedrock-embedding-config)。

  </Accordion>

  <Accordion title="说明与注意事项">
    - Bedrock 要求你在 AWS 账户/区域中启用**模型访问**。
    - 自动发现需要 `bedrock:ListFoundationModels` 和
      `bedrock:ListInferenceProfiles` 权限。
    - 如果你依赖自动模式，请在
      gateway 主机上设置受支持的 AWS 认证环境变量标记之一。如果你更倾向于使用不带 env markers 的 IMDS/共享配置认证，请设置
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`。
    - OpenClaw 会按以下顺序呈现凭证来源：`AWS_BEARER_TOKEN_BEDROCK`，
      然后是 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，再然后是 `AWS_PROFILE`，最后才是
      默认 AWS SDK 链。
    - 是否支持 reasoning 取决于具体模型；请查看对应 Bedrock 模型卡片以了解
      当前能力。
    - 如果你更喜欢托管密钥流程，也可以在 Bedrock 前面放一个兼容 OpenAI 的
      代理，并将其作为 OpenAI provider 进行配置。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 provider、模型引用和故障转移行为。
  </Card>
  <Card title="记忆搜索" href="/zh-CN/concepts/memory-search" icon="magnifying-glass">
    用于记忆搜索配置的 Bedrock embeddings。
  </Card>
  <Card title="记忆配置参考" href="/zh-CN/reference/memory-config#bedrock-embedding-config" icon="database">
    完整的 Bedrock embedding 模型列表和维度选项。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    通用故障排除和常见问题。
  </Card>
</CardGroup>
