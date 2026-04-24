---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中通过 API 密钥或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T18:10:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic 构建了 **Claude** 模型家族。OpenClaw 支持两种认证方式：

- **API 密钥** — 直接访问 Anthropic API，按用量计费（`anthropic/*` 模型）
- **Claude CLI** — 复用同一主机上现有的 Claude CLI 登录

<Warning>
Anthropic 工作人员告诉我们，OpenClaw 这种 Claude CLI 用法再次被允许，因此除非 Anthropic 发布新的政策，否则 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为被认可。

对于长期运行的 Gateway 网关主机，Anthropic API 密钥仍然是最清晰、最可预测的生产路径。

Anthropic 当前的公开文档：

- [Claude Code CLI 参考](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK 概览](https://platform.claude.com/docs/en/agent-sdk/overview)
- [在你的 Pro 或 Max 套餐中使用 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [在你的 Team 或 Enterprise 套餐中使用 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## 入门指南

<Tabs>
  <Tab title="API 密钥">
    **最适合：** 标准 API 访问和按用量计费。

    <Steps>
      <Step title="获取你的 API 密钥">
        在 [Anthropic Console](https://console.anthropic.com/) 中创建一个 API 密钥。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        # 选择：Anthropic API key
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
    **最适合：** 复用现有的 Claude CLI 登录，而无需单独的 API 密钥。

    <Steps>
      <Step title="确保已安装并登录 Claude CLI">
        验证方式：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        # 选择：Claude CLI
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
    Claude CLI 后端的设置和运行时细节见 [CLI 后端](/zh-CN/gateway/cli-backends)。
    </Note>

    <Tip>
    如果你想要最清晰的计费路径，请改用 Anthropic API 密钥。OpenClaw 也支持来自 [OpenAI Codex](/zh-CN/providers/openai)、[Qwen Cloud](/zh-CN/providers/qwen)、[MiniMax](/zh-CN/providers/minimax) 和 [Z.AI / GLM](/zh-CN/providers/glm) 的订阅式选项。
    </Tip>

  </Tab>
</Tabs>

## Thinking 默认值（Claude 4.6）

当未设置显式 thinking 级别时，Claude 4.6 模型在 OpenClaw 中默认使用 `adaptive` thinking。

可通过 `/think:<level>` 按消息覆盖，或在模型参数中配置：

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

OpenClaw 支持 Anthropic 在 API 密钥认证下的提示词缓存功能。

| 值 | 缓存时长 | 说明 |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（默认） | 5 分钟 | 会为 API 密钥认证自动应用 |
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
    使用模型级参数作为基线，然后通过 `agents.list[].params` 覆盖特定智能体：

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

    这让一个智能体可以保持长生命周期缓存，而同一模型上的另一个智能体则可为突发性/低复用流量禁用缓存。

  </Accordion>

  <Accordion title="Bedrock Claude 说明">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在配置时接受 `cacheRetention` 透传。
    - 非 Anthropic 的 Bedrock 模型会在运行时被强制设为 `cacheRetention: "none"`。
    - 当未设置显式值时，API 密钥智能默认值也会为 Bedrock 上的 Claude 引用注入 `cacheRetention: "short"`。
  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共享 `/fast` 开关支持直连 Anthropic 流量（使用 API 密钥和 OAuth 访问 `api.anthropic.com`）。

    | 命令 | 映射到 |
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
    - 仅对直连 `api.anthropic.com` 的请求注入。代理路由会保持 `service_tier` 不变。
    - 当 `/fast` 和显式的 `serviceTier` 或 `service_tier` 参数同时设置时，后者优先。
    - 对于没有 Priority Tier 容量的账户，`service_tier: "auto"` 可能解析为 `standard`。
    </Note>

  </Accordion>

  <Accordion title="媒体理解（图像和 PDF）">
    内置的 Anthropic 插件注册了图像和 PDF 理解能力。OpenClaw
    会从已配置的 Anthropic 认证中自动解析媒体能力——无需额外配置。

    | 属性 | 值 |
    | -------------- | -------------------- |
    | 默认模型 | `claude-opus-4-6` |
    | 支持的输入 | 图像、PDF 文档 |

    当图像或 PDF 被附加到对话中时，OpenClaw 会自动
    通过 Anthropic 媒体理解提供商进行路由。

  </Accordion>

  <Accordion title="1M 上下文窗口（测试版）">
    Anthropic 的 1M 上下文窗口受测试版门控。可按模型启用：

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
    需要你的 Anthropic 凭证具备长上下文访问权限。旧版令牌认证（`sk-ant-oat-*`）会被拒绝用于 1M 上下文请求——OpenClaw 会记录警告并回退到标准上下文窗口。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M 上下文">
    `anthropic/claude-opus-4.7` 及其 `claude-cli` 变体默认具有 1M 上下文
    窗口——不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="401 错误 / 令牌突然失效">
    Anthropic 令牌认证会过期，也可能被撤销。对于新的设置，请改用 Anthropic API 密钥。
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Anthropic 认证是**按智能体**生效的——新智能体不会继承主智能体的密钥。请为该智能体重新运行新手引导（或在 Gateway 网关主机上配置 API 密钥），然后使用 `openclaw models status` 验证。
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    运行 `openclaw models status` 查看当前激活的是哪个认证配置文件。重新运行新手引导，或为该配置文件路径配置 API 密钥。
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 的速率限制冷却可能是按模型范围生效的，因此同级的其他 Anthropic 模型仍可能可用。添加另一个 Anthropic 配置文件，或等待冷却结束。
  </Accordion>
</AccordionGroup>

<Note>
更多帮助： [故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="CLI 后端" href="/zh-CN/gateway/cli-backends" icon="terminal">
    Claude CLI 后端设置和运行时细节。
  </Card>
  <Card title="提示词缓存" href="/zh-CN/reference/prompt-caching" icon="database">
    提示词缓存在各提供商间的工作方式。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭证复用规则。
  </Card>
</CardGroup>
