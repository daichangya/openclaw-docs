---
read_when:
    - 你想以交互方式调整凭证、设备或智能体默认设置
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-04-24T18:58:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

用于设置凭证、设备和智能体默认设置的交互式提示。

注意：**Model** 部分现在包含一个用于 `agents.defaults.models` 允许列表的多选项（即 `/model` 和模型选择器中显示的内容）。
按提供商范围进行的设置选择会将其选中的模型合并到现有允许列表中，而不是替换配置中其他无关提供商的内容。
从 configure 重新运行提供商认证时，会保留现有的 `agents.defaults.model.primary`；如果你明确想更改默认模型，请使用 `openclaw models auth login --provider <id> --set-default`
或 `openclaw models set <model>`。

当 configure 从某个提供商认证选项启动时，默认模型和
允许列表选择器会自动优先显示该提供商。对于成对的提供商，例如 Volcengine/BytePlus，同样的优先级也会匹配它们的 coding-plan
变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果优先提供商
筛选会得到空列表，configure 会回退到未筛选的
目录，而不是显示一个空白选择器。

提示：不带子命令的 `openclaw config`
会打开同一个向导。对于非交互式编辑，请使用
`openclaw config get|set|unset`。

对于 web 搜索，`openclaw configure --section web` 可让你选择一个提供商
并配置其凭证。某些提供商还会显示提供商专属的
后续提示：

- **Grok** 可提供可选的 `x_search` 设置，使用相同的 `XAI_API_KEY`，并
  让你选择一个 `x_search` 模型。
- **Kimi** 可能会询问 Moonshot API 区域（`api.moonshot.ai` 与
  `api.moonshot.cn`）以及默认的 Kimi web 搜索模型。

相关内容：

- Gateway 网关配置参考：[配置](/zh-CN/gateway/configuration)
- 配置 CLI：[配置](/zh-CN/cli/config)

## 选项

- `--section <section>`：可重复的部分筛选器

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

- 选择 Gateway 网关运行位置时，总是会更新 `gateway.mode`。如果这就是你需要的全部内容，你可以在不选择其他部分的情况下直接选择“继续”。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）在设置期间会提示你填写渠道/房间允许列表。你可以输入名称或 ID；向导会在可能的情况下将名称解析为 ID。
- 如果你运行 daemon 安装步骤，token 认证需要 token，且 `gateway.auth.token` 由 SecretRef 管理，configure 会验证 SecretRef，但不会将解析后的明文 token 值持久化到 supervisor 服务环境元数据中。
- 如果 token 认证需要 token，而配置的 token SecretRef 未解析，configure 会阻止 daemon 安装，并提供可执行的修复指导。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置，而 `gateway.auth.mode` 未设置，configure 会阻止 daemon 安装，直到显式设置 mode。

## 示例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
