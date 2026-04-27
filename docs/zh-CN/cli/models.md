---
read_when:
    - 你想更改默认模型或查看提供商身份验证状态
    - 你想扫描可用的模型/提供商并调试认证配置文件
summary: '`openclaw models` 的 CLI 参考（status/list/set/scan、别名、回退链、身份验证）'
title: Models
x-i18n:
    generated_at: "2026-04-27T06:03:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ffafec22fb05909fd06ffc8987f8da87597ef6aa85a69bcadbcfcc1d19f7d7dc
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

模型发现、扫描和配置（默认模型、回退链、认证配置文件）。

相关内容：

- 提供商 + 模型：[Models](/zh-CN/providers/models)
- 模型选择概念 + `/models` 斜杠命令：[Models 概念](/zh-CN/concepts/models)
- 提供商身份验证设置：[入门指南](/zh-CN/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 会显示解析后的默认值/回退链以及认证概览。
当提供商使用量快照可用时，OAuth/API key 状态部分会包含提供商使用窗口和配额快照。
当前支持使用窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用量认证在可用时来自提供商特定钩子；否则
OpenClaw 会回退到从认证配置文件、环境变量或配置中匹配 OAuth/API key
凭证。
在 `--json` 输出中，`auth.providers` 是感知环境变量/配置/存储的提供商概览，
而 `auth.oauth` 仅是认证存储配置文件健康状态。
添加 `--probe` 可对每个已配置的提供商配置文件运行实时认证探测。
探测会发起真实请求（可能消耗 token 并触发限流）。
使用 `--agent <id>` 可检查某个已配置智能体的模型/认证状态。省略时，
该命令会在设置了 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 时使用它们，否则使用
已配置的默认智能体。
探测行可能来自认证配置文件、环境变量凭证或 `models.json`。

说明：

- `models set <model-or-alias>` 接受 `provider/model` 或别名。
- `models list` 是只读的：它会读取配置、认证配置文件、现有目录状态以及提供商拥有的目录行，但不会重写 `models.json`。
- `models list --all --provider <id>` 即使你尚未使用该提供商完成身份验证，也可以包含来自插件清单或内置提供商目录元数据的、由提供商拥有的静态目录行。这些行在配置匹配认证之前仍会显示为不可用。
- `models list` 会将原生模型元数据与运行时能力上限区分开来。在表格输出中，当有效运行时上限与原生上下文窗口不同时，`Ctx` 显示为 `contextTokens/contextWindow`；如果提供商暴露了该上限，JSON 行中会包含 `contextTokens`。
- `models list --provider <id>` 按提供商 id 过滤，例如 `moonshot` 或 `openai-codex`。它不接受交互式提供商选择器中的显示标签，例如 `Moonshot AI`。
- 模型引用通过按**第一个** `/` 进行拆分来解析。如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（示例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先将输入解析为别名，然后解析为某个已配置提供商中对该精确模型 id 的唯一匹配，最后才会回退到已配置的默认提供商并给出弃用警告。
  如果该提供商不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露一个过时的、已移除提供商默认值。
- `models status` 可能会在认证输出中将非机密占位符显示为 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是将其掩码为机密。

### Models 扫描

`models scan` 会读取 OpenRouter 的公开 `:free` 目录，并为回退用途对候选项进行排序。目录本身是公开的，因此仅元数据扫描不需要 OpenRouter key。

默认情况下，OpenClaw 会尝试通过实时模型调用来探测工具和图像支持。如果未配置 OpenRouter key，该命令会回退到仅元数据输出，并说明 `:free` 模型在探测和推理时仍需要 `OPENROUTER_API_KEY`。

选项：

- `--no-probe`（仅元数据；不查找配置/密钥）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（目录请求和每次探测超时）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 和 `--set-image` 需要实时探测；仅元数据扫描结果仅供参考，不会应用到配置中。

### Models 状态

选项：

- `--json`
- `--plain`
- `--check`（退出码 1=已过期/缺失，2=即将过期）
- `--probe`（对已配置认证配置文件进行实时探测）
- `--probe-provider <name>`（探测单个提供商）
- `--probe-profile <id>`（可重复或使用逗号分隔的 profile id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已配置智能体 id；会覆盖 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

探测状态分组：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

预期会看到的探测详情/原因代码情况：

- `excluded_by_auth_order`：存在已存储的配置文件，但显式
  `auth.order.<provider>` 省略了它，因此探测会报告该排除，而不是尝试它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  配置文件存在，但不符合条件/无法解析。
- `no_model`：提供商认证存在，但 OpenClaw 无法为该提供商解析出一个可用于探测的模型候选项。

## 别名 + 回退链

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

`models auth add` 是交互式认证辅助工具。根据你选择的提供商，它可以启动提供商认证流程（OAuth/API key），或引导你手动粘贴 token。

`models auth login` 会运行提供商插件的认证流程（OAuth/API key）。使用
`openclaw plugins list` 查看已安装的提供商。
使用 `openclaw models auth --agent <id> <subcommand>` 可将认证结果写入某个特定的已配置智能体存储。父级 `--agent` 标志适用于
`add`、`login`、`setup-token`、`paste-token` 和 `login-github-copilot`。

示例：

```bash
openclaw models auth login --provider openai-codex --set-default
```

说明：

- `setup-token` 和 `paste-token` 仍然是面向暴露 token 认证方法的提供商的通用 token 命令。
- `setup-token` 需要交互式 TTY，并运行提供商的 token 认证方法（如果该提供商暴露了 `setup-token` 方法，则默认使用它）。
- `paste-token` 接受在其他地方或通过自动化生成的 token 字符串。
- `paste-token` 需要 `--provider`，会提示输入 token 值，并将其写入默认配置文件 id `<provider>:manual`，除非你传入 `--profile-id`。
- `paste-token --expires-in <duration>` 会根据诸如 `365d` 或 `12h` 这样的相对时长，存储一个绝对 token 过期时间。
- Anthropic 说明：Anthropic 员工告知我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此除非 Anthropic 发布新政策，否则 OpenClaw 会将 Claude CLI 复用和 `claude -p` 用法视为该集成的获准方式。
- Anthropic `setup-token` / `paste-token` 仍作为受支持的 OpenClaw token 路径保留，但在可用时，OpenClaw 现在更偏好 Claude CLI 复用和 `claude -p`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [模型选择](/zh-CN/concepts/model-providers)
- [模型故障切换](/zh-CN/concepts/model-failover)
