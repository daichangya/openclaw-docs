---
read_when:
    - 你想以交互方式调整凭证、设备或智能体默认设置
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-04-27T06:03:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

用于设置凭证、设备和智能体默认值的交互式提示。

<Note>
**Model** 部分包含一个用于 `agents.defaults.models` 允许列表的多选项（即 `/model` 和模型选择器中显示的内容）。按提供商范围进行的设置选择会将其选中的模型合并到现有允许列表中，而不是替换配置中已存在的其他无关提供商。通过 configure 重新运行提供商身份验证时，会保留现有的 `agents.defaults.model.primary`。当你明确想更改默认模型时，请使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

当 configure 从提供商身份验证选项启动时，默认模型和允许列表选择器会自动优先显示该提供商。对于像 Volcengine 和 BytePlus（国际版）这样的成对提供商，同样的偏好也会匹配它们的 coding-plan 变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果首选提供商过滤会产生空列表，configure 会回退到未过滤的目录，而不是显示空白选择器。

<Tip>
不带子命令的 `openclaw config` 会打开同一个向导。对于非交互式编辑，请使用 `openclaw config get|set|unset`。
</Tip>

对于 Web 搜索，`openclaw configure --section web` 可让你选择提供商并配置其凭证。有些提供商还会显示提供商特定的后续提示：

- **Grok** 可以提供可选的 `x_search` 设置，使用相同的 `XAI_API_KEY`，并让你选择一个 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及默认的 Kimi Web 搜索模型。

相关内容：

- Gateway 网关配置参考：[配置](/zh-CN/gateway/configuration)
- Config CLI：[配置](/zh-CN/cli/config)

## 选项

- `--section <section>`：可重复的部分过滤器

可用部分：

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

说明：

- 选择 Gateway 网关的运行位置时，总会更新 `gateway.mode`。如果这就是你需要的全部内容，你可以在不选择其他部分的情况下选择“Continue”。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）会在设置期间提示输入渠道/房间允许列表。你可以输入名称或 ID；如果可能，向导会将名称解析为 ID。
- 如果你运行 daemon 安装步骤，且 token 身份验证需要 token，并且 `gateway.auth.token` 由 SecretRef 管理，那么 configure 会验证该 SecretRef，但不会将解析出的明文 token 值持久化到 supervisor 服务环境元数据中。
- 如果 token 身份验证需要 token，而已配置的 token SecretRef 尚未解析，configure 会阻止 daemon 安装，并提供可执行的修复指导。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，configure 会阻止 daemon 安装，直到显式设置 mode。

## 示例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
