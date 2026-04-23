---
read_when:
    - 你希望以交互方式调整凭证、设备或智能体默认设置
summary: '`openclaw configure` 的 CLI 参考（交互式配置提示）'
title: 配置
x-i18n:
    generated_at: "2026-04-23T20:43:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6db1c5f412fbd2ec896984e615529f77ab1b6df7788419b1b92b1bf66f99e3a1
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

用于设置凭证、设备和智能体默认值的交互式提示。

注意：**模型** 部分现在包含 `agents.defaults.models` 允许列表的多选项（即 `/model` 和模型选择器中显示的内容）。按 provider 作用域进行的设置选择，会将所选模型合并到现有允许列表中，而不是替换配置中其他无关 provider 的内容。

当配置从某个 provider 身份验证选项启动时，默认模型和允许列表选择器会自动优先该 provider。对于成对的 provider，例如 Volcengine/BytePlus，这种优先逻辑也会匹配它们的 coding-plan 变体（`volcengine-plan/*`、`byteplus-plan/*`）。如果按首选 provider 过滤后会得到空列表，配置器会回退到未过滤的目录，而不是显示空白选择器。

提示：不带子命令运行 `openclaw config` 会打开同一个向导。非交互式编辑请使用 `openclaw config get|set|unset`。

对于 web 搜索，`openclaw configure --section web` 可让你选择一个 provider 并配置其凭证。某些 provider 还会显示 provider 特定的后续提示：

- **Grok** 可以提供可选的 `x_search` 设置，使用相同的 `XAI_API_KEY`，并让你选择一个 `x_search` 模型。
- **Kimi** 可以询问 Moonshot API 区域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及默认的 Kimi web 搜索模型。

相关内容：

- Gateway 网关配置参考：[配置](/zh-CN/gateway/configuration)
- 配置 CLI：[配置](/zh-CN/cli/config)

## 选项

- `--section <section>`：可重复使用的部分过滤器

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

- 选择 Gateway 网关的运行位置时，总是会更新 `gateway.mode`。如果这就是你唯一需要的内容，可以不选择其他部分，直接选择“Continue”。
- 面向渠道的服务（Slack/Discord/Matrix/Microsoft Teams）在设置期间会提示配置渠道/房间允许列表。你可以输入名称或 ID；向导会在可能时将名称解析为 ID。
- 如果你运行 daemon 安装步骤，且 token 身份验证需要 token，同时 `gateway.auth.token` 由 SecretRef 管理，配置器会验证 SecretRef，但不会将解析出的明文 token 值持久化到 supervisor 服务环境元数据中。
- 如果 token 身份验证需要 token，而已配置的 token SecretRef 无法解析，配置器会阻止 daemon 安装，并给出可执行的修复指导。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，但未设置 `gateway.auth.mode`，配置器会阻止 daemon 安装，直到显式设置 mode。

## 示例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
