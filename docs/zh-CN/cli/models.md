---
read_when:
    - 你想更改默认模型或查看提供商认证状态
    - 你想扫描可用的模型/提供商并调试认证配置文件
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退、认证）'
title: models
x-i18n:
    generated_at: "2026-04-23T07:04:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

模型发现、扫描和配置（默认模型、回退、认证配置文件）。

相关内容：

- 提供商 + 模型：[Models](/zh-CN/providers/models)
- 模型选择概念 + `/models` 斜杠命令：[Models 概念](/zh-CN/concepts/models)
- 提供商认证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示解析后的默认值/回退，以及认证概览。
当提供商使用情况快照可用时，OAuth/API 密钥状态部分会包含
提供商使用窗口和配额快照。
当前支持使用窗口的提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用情况认证在可用时来自提供商专用钩子；
否则，OpenClaw 会回退为从认证配置文件、环境变量或配置中匹配 OAuth/API 密钥
凭证。
在 `--json` 输出中，`auth.providers` 是感知环境变量/配置/store 的提供商
概览，而 `auth.oauth` 仅是 auth-store 配置文件健康状态。
添加 `--probe` 可针对每个已配置的提供商配置文件运行实时认证探测。
探测是真实请求（可能会消耗令牌并触发速率限制）。
使用 `--agent <id>` 可检查已配置智能体的模型/认证状态。省略时，
该命令会在设置了 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 时使用它们，否则使用
已配置的默认智能体。
探测行可能来自认证配置文件、环境变量凭证或 `models.json`。

注意：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list --all` 包含由内置提供商拥有的静态目录行，即使你尚未为该提供商配置认证
  也是如此。这些行仍会显示为不可用，直到配置了匹配的认证。
- `models list --provider <id>` 按提供商 ID 过滤，例如 `moonshot` 或
  `openai-codex`。它不接受交互式提供商选择器中的显示标签，例如 `Moonshot AI`。
- 模型引用会通过按**第一个** `/` 分割来解析。如果模型 ID 包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先将输入解析为别名，然后
  解析为已配置提供商中与该确切模型 ID 唯一匹配的项，最后才会回退到已配置的默认提供商，并给出弃用警告。
  如果该提供商不再暴露已配置的默认模型，OpenClaw
  会回退到第一个已配置的提供商/模型，而不是显示一个
  已失效、已移除提供商的默认值。
- `models status` 可能会在认证输出中显示 `marker(<value>)`，用于表示非敏感占位符（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将其作为敏感信息遮蔽。

### `models status`

选项：

- `--json`
- `--plain`
- `--check`（退出码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置认证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（可重复或使用逗号分隔的配置文件 ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置智能体 ID；会覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

探测状态分组：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

可预期的探测详情/原因代码情况：

- `excluded_by_auth_order`：存在已存储的配置文件，但显式
  `auth.order.<provider>` 省略了它，因此探测会报告该排除，而不是
  尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合资格/无法解析。
- `no_model`：提供商认证存在，但 OpenClaw 无法为该提供商解析出可用于探测的
  模型候选项。

## 别名 + 回退

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 认证配置文件

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是交互式认证助手。它可以启动提供商认证
流程（OAuth/API 密钥），或根据你选择的提供商，引导你手动粘贴令牌。

`models auth login` 运行提供商插件的认证流程（OAuth/API 密钥）。使用
`openclaw plugins list` 查看已安装了哪些提供商。

示例：

```bash
openclaw models auth login --provider openai-codex --set-default
```

注意：

- `setup-token` 和 `paste-token` 仍然是通用令牌命令，适用于暴露令牌认证方法的提供商。
- `setup-token` 需要交互式 TTY，并运行该提供商的令牌认证
  方法（当该提供商暴露了 `setup-token` 方法时，默认使用
  该方法）。
- `paste-token` 接受在其他地方或自动化流程中生成的令牌字符串。
- `paste-token` 需要 `--provider`，会提示输入令牌值，并将其写入默认配置文件 ID `<provider>:manual`，除非你传入
  `--profile-id`。
- `paste-token --expires-in <duration>` 会根据相对时长（如 `365d` 或 `12h`）
  存储一个绝对令牌过期时间。
- Anthropic 说明：Anthropic 工作人员告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为此集成的受支持方式，除非 Anthropic 发布新的策略。
- Anthropic 的 `setup-token` / `paste-token` 仍然可作为受支持的 OpenClaw 令牌路径使用，但 OpenClaw 现在会在可用时优先使用 Claude CLI 复用和 `claude -p`。
