---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中通过 API 密钥或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T06:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e99e31bf58d08a18f526281b3bf5c3a5a96b2ff342adf3a6a193a076147a03
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic（Claude）

Anthropic 构建了 **Claude** 模型家族。OpenClaw 支持两种认证方式：

- **API key** —— 通过 Anthropic API 直接访问，并按使用量计费（`anthropic/*` 模型）
- **Claude CLI** —— 复用同一主机上现有的 Claude CLI 登录

<Warning>
Anthropic 团队告诉我们，OpenClaw 风格的 Claude CLI 用法已再次被允许，因此除非 Anthropic 发布新的政策，否则 OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为获准行为。

对于长期运行的 Gateway 网关主机，Anthropic API key 仍然是最清晰、最可预测的生产环境方案。

Anthropic 当前的公开文档：

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## 入门指南

<Tabs>
  <Tab title="API key">
    **最适合：** 标准 API 访问和按使用量计费。

    <Steps>
      <Step title="获取你的 API key">
        在 [Anthropic Console](https://console.anthropic.com/) 中创建一个 API key。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        或直接传入密钥：

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最适合：** 复用现有 Claude CLI 登录，而无需单独的 API key。

    <Steps>
      <Step title="确保已安装 Claude CLI 并完成登录">
        通过以下命令验证：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw 会检测并复用现有的 Claude CLI 凭证。
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 后端的设置和运行时细节见 [CLI Backends](/zh-CN/gateway/cli-backends)。
    </Note>

    <Tip>
    如果你想要最清晰的计费路径，请改用 Anthropic API key。OpenClaw 还支持来自 [OpenAI Codex](/zh-CN/providers/openai)、[Qwen Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [Z.AI / GLM](/zh-CN/providers/glm) 的订阅式选项。
    </Tip>

  </Tab>
</Tabs>

## Thinking 默认值（Claude 4.6）

当未设置显式 thinking 级别时，Claude 4.6 模型在 OpenClaw 中默认使用 `adaptive` thinking。

可通过 `/think:<level>` 按消息覆盖，或在模型参数中设置：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
相关 Anthropic 文档：
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## 提示词缓存

OpenClaw 支持 Anthropic 的提示词缓存功能，适用于 API key 认证。

| 值 | 缓存时长 | 说明 |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（默认） | 5 分钟 | 会自动应用于 API key 认证 |
| `"long"` | 1 小时 | 扩展缓存 |
| `"none"` | 不缓存 | 禁用提示词缓存 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="按智能体覆盖缓存">
    先将模型级参数作为基线，然后通过 `agents.list[].params` 覆盖特定智能体：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    配置合并顺序：

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（匹配 `id`，按键覆盖）

    这样可以让一个智能体保留长期缓存，而同一模型上的另一个智能体则为突发 / 低复用流量禁用缓存。

  </Accordion>

  <Accordion title="Bedrock Claude 说明">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置后接受 `cacheRetention` 透传。
    - 非 Anthropic 的 Bedrock 模型会在运行时被强制设置为 `cacheRetention: "none"`。
    - 当未设置显式值时，API key 智能默认值也会为 Claude-on-Bedrock 引用预置 `cacheRetention: "short"`。
  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="Fast mode">
    OpenClaw 的共享 `/fast` 开关支持直接 Anthropic 流量（发送到 `api.anthropic.com` 的 API key 和 OAuth）。

    | 命令 | 映射为 |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - 仅注入到直接发送到 `api.anthropic.com` 的请求中。代理路由不会改动 `service_tier`。
    - 当 `/fast` 与显式 `serviceTier` 或 `service_tier` 参数同时设置时，后者优先。
    - 对于没有 Priority Tier 容量的账户，`service_tier: "auto"` 可能会解析为 `standard`。
    </Note>

  </Accordion>

  <Accordion title="媒体理解（图像和 PDF）">
    内置 Anthropic 插件注册了图像和 PDF 理解功能。OpenClaw
    会根据配置的 Anthropic 认证自动解析媒体能力——无需额外配置。

    | 属性 | 值 |
    | -------------- | -------------------- |
    | 默认模型 | `claude-opus-4-6` |
    | 支持的输入 | 图像、PDF 文档 |

    当会话中附加图像或 PDF 时，OpenClaw 会自动
    将其路由到 Anthropic 媒体理解提供商。

  </Accordion>

  <Accordion title="1M 上下文窗口（beta）">
    Anthropic 的 1M 上下文窗口受 beta 门控。请按模型启用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw 会将其映射为请求中的 `anthropic-beta: context-1m-2025-08-07`。

    <Warning>
    需要你的 Anthropic 凭证具备长上下文访问权限。旧版 token 认证（`sk-ant-oat-*`）不支持 1M 上下文请求——OpenClaw 会记录警告，并回退到标准上下文窗口。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M 上下文标准化">
    Claude Opus 4.7（`anthropic/claude-opus-4.7`）及其 `claude-cli` 变体，会在解析后的运行时元数据以及活动智能体状态 / 上下文报告中标准化为 1M 上下文窗口。对于 Opus 4.7，你不需要设置 `params.context1m: true`；它不再继承过时的 200k 回退值。

    压缩和溢出处理会自动使用 1M 窗口。其他 Anthropic 模型仍保持其公开限制。

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="401 错误 / token 突然失效">
    Anthropic token 认证可能会过期或被撤销。对于新配置，建议迁移到 Anthropic API key。
  </Accordion>

  <Accordion title='未找到 provider "anthropic" 的 API key'>
    认证是**按智能体**区分的。新智能体不会继承主智能体的密钥。请为该智能体重新运行新手引导，或在 Gateway 网关主机上配置 API key，然后使用 `openclaw models status` 验证。
  </Accordion>

  <Accordion title='未找到 profile "anthropic:default" 的凭证'>
    运行 `openclaw models status` 查看当前启用的是哪个认证配置文件。重新运行新手引导，或为该配置文件路径配置 API key。
  </Accordion>

  <Accordion title="没有可用的认证配置文件（全部处于冷却中）">
    使用 `openclaw models status --json` 检查 `auth.unusableProfiles`。Anthropic 限流冷却可能是按模型范围生效的，因此同级的另一个 Anthropic 模型可能仍然可用。请添加另一个 Anthropic 配置文件，或等待冷却结束。
  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="CLI 后端" href="/zh-CN/gateway/cli-backends" icon="terminal">
    Claude CLI 后端设置和运行时细节。
  </Card>
  <Card title="提示词缓存" href="/zh-CN/reference/prompt-caching" icon="database">
    提示词缓存如何在不同提供商之间工作。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭证复用规则。
  </Card>
</CardGroup>
