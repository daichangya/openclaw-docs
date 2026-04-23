---
read_when:
    - 你想更改默认模型或查看提供商凭证状态
    - 你想扫描可用的模型/提供商并调试凭证配置文件
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退和凭证）'
title: 模型
x-i18n:
    generated_at: "2026-04-23T06:24:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bf7b864ff57af0649bc31443ce77b193d6b3dbb200c53b69ea584fa2e12cbf7
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

模型发现、扫描与配置（默认模型、回退、凭证配置文件）。

相关内容：

- 提供商 + 模型：[模型](/zh-CN/providers/models)
- 提供商凭证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示解析后的默认值/回退配置，以及凭证概览。
当提供商用量快照可用时，OAuth/API 密钥状态部分还会包含
提供商用量时间窗口和配额快照。
当前支持用量时间窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。用量凭证信息会在可用时来自提供商特定钩子；
否则，OpenClaw 会回退为匹配来自凭证配置文件、环境变量或配置的 OAuth/API 密钥
凭证。
在 `--json` 输出中，`auth.providers` 是具备环境变量/配置/存储感知能力的提供商
概览，而 `auth.oauth` 仅表示凭证存储中的配置文件健康状态。
添加 `--probe` 可对每个已配置的提供商配置文件运行实时凭证探测。
探测会发起真实请求（可能消耗 token 并触发速率限制）。
使用 `--agent <id>` 可检查某个已配置智能体的模型/凭证状态。省略时，
命令会在设置了 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 时使用它们，否则使用
已配置的默认智能体。
探测行可能来自凭证配置文件、环境变量凭证，或 `models.json`。

说明：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list --all` 会包含由内置提供商拥有的静态目录行，即使
  你尚未通过该提供商完成认证也是如此。在配置匹配凭证之前，这些行仍会显示
  为不可用。
- `models list --provider <id>` 会按提供商 id 过滤，例如 `moonshot` 或
  `openai-codex`。它不接受交互式提供商选择器中的显示标签，例如
  `Moonshot AI`。
- 模型引用会通过在**第一个** `/` 处分割来解析。如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先将输入解析为别名，然后
  解析为已配置提供商中与该精确模型 id 唯一匹配的项，最后才
  以弃用警告的方式回退到已配置的默认提供商。
  如果该提供商不再公开已配置的默认模型，OpenClaw 会
  回退到第一个已配置的提供商/模型，而不是暴露一个
  过时的、已移除提供商默认值。
- `models status` 可能会在凭证输出中显示 `marker(<value>)`，用于表示非机密占位符（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将它们作为机密进行掩码处理。

### `models status`

选项：

- `--json`
- `--plain`
- `--check`（退出码：1 = 已过期/缺失，2 = 即将过期）
- `--probe`（对已配置凭证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（可重复或使用逗号分隔的配置文件 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置的智能体 id；覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

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

- `excluded_by_auth_order`：存在已存储的配置文件，但显式的
  `auth.order.<provider>` 省略了它，因此探测会报告该排除状态，而不是
  尝试使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合资格/无法解析。
- `no_model`：提供商凭证存在，但 OpenClaw 无法为该提供商解析出可用于探测的
  模型候选项。

## 别名 + 回退

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 凭证配置文件

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是交互式凭证辅助工具。它可以启动提供商凭证
流程（OAuth/API 密钥），或根据你选择的提供商，引导你进入手动粘贴 token 流程。

`models auth login` 会运行提供商插件的凭证流程（OAuth/API 密钥）。使用
`openclaw plugins list` 可查看已安装了哪些提供商。

示例：

```bash
openclaw models auth login --provider openai-codex --set-default
```

说明：

- `setup-token` 和 `paste-token` 仍然是通用 token 命令，适用于
  暴露了 token 凭证方法的提供商。
- `setup-token` 需要交互式 TTY，并运行该提供商的 token 凭证
  方法（当该提供商暴露了 `setup-token` 方法时，默认使用
  该方法）。
- `paste-token` 接受在别处或通过自动化生成的 token 字符串。
- `paste-token` 需要 `--provider`，会提示输入 token 值，并将其写入
  默认配置文件 id `<provider>:manual`，除非你传入
  `--profile-id`。
- `paste-token --expires-in <duration>` 会根据相对时长（例如 `365d` 或 `12h`）
  存储一个绝对 token 过期时间。
- Anthropic 说明：Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法已再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为此集成的获准方式，除非 Anthropic 发布新的政策。
- Anthropic 的 `setup-token` / `paste-token` 仍然可作为受支持的 OpenClaw token 路径使用，但 OpenClaw 现在在可用时优先使用 Claude CLI 复用和 `claude -p`。
