---
read_when:
    - 你想端到端了解 OpenClaw 的 OAuth 流程
    - 你遇到了 token 失效 / 登出问题
    - 你想使用 Claude CLI 或 OAuth 认证流程
    - 你想使用多账户或配置文件路由
summary: OpenClaw 中的 OAuth：token 交换、存储与多账户模式
title: OAuth
x-i18n:
    generated_at: "2026-04-23T20:46:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw 支持通过 OAuth 使用“订阅认证”，适用于提供该方式的提供商
（尤其是 **OpenAI Codex（ChatGPT OAuth）**）。对于 Anthropic，目前实际上的划分是：

- **Anthropic API key**：普通的 Anthropic API 计费
- **Anthropic Claude CLI / OpenClaw 内的订阅认证**：Anthropic 员工
  告诉我们这种用法现在再次被允许

OpenAI Codex OAuth 已明确支持在 OpenClaw 这类外部工具中使用。本页说明：

对于生产环境中的 Anthropic，API key 认证仍然是更安全、推荐的路径。

- OAuth **token 交换**的工作方式（PKCE）
- token **存储**的位置（以及原因）
- 如何处理**多账户**（profiles + 按会话覆盖）

OpenClaw 还支持自带 OAuth 或 API key
流程的**提供商插件**。通过以下命令运行它们：

```bash
openclaw models auth login --provider <id>
```

## token sink（为什么存在）

OAuth 提供商通常会在登录/刷新流程中签发**新的 refresh token**。某些提供商（或 OAuth 客户端）可能会在为同一用户/应用签发新 token 时使旧的 refresh token 失效。

实际症状：

- 你同时通过 OpenClaw _和_ Claude Code / Codex CLI 登录 → 之后其中一个会随机被“登出”

为减少这种情况，OpenClaw 将 `auth-profiles.json` 视为一个 **token sink**：

- 运行时会从**一个地方**读取凭证
- 我们可以保留多个 profile，并以确定性的方式进行路由
- 当从 Codex CLI 之类的外部 CLI 复用凭证时，OpenClaw
  会带着来源信息镜像这些凭证，并重新读取该外部来源，而不是
  自己轮换 refresh token

## 存储（token 存放位置）

密钥按**每个智能体**存储：

- 认证 profiles（OAuth + API keys + 可选的值级 refs）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会清理）

仅用于旧版导入的文件（仍受支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）

以上所有路径同样遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/zh-CN/gateway/configuration-reference#auth-storage)

有关静态 SecretRef 和运行时快照激活行为，请参见 [Secrets Management](/zh-CN/gateway/secrets)。

## Anthropic 旧版 token 兼容性

<Warning>
Anthropic 的公开 Claude Code 文档指出，直接使用 Claude Code 会保持在
Claude 订阅限制范围内，而 Anthropic 员工也告诉我们，OpenClaw 风格的 Claude
CLI 用法现在再次被允许。因此，除非 Anthropic
发布新的政策，否则 OpenClaw 将 Claude CLI 复用和
`claude -p` 用法视为此集成中被允许的方式。

关于 Anthropic 当前的直接 Claude Code 计划文档，请参见 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
以及 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他订阅式选项，请参见 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen Cloud Coding
Plan](/zh-CN/providers/qwen)、[MiniMax Coding Plan](/zh-CN/providers/minimax)，
以及 [Z.AI / GLM Coding Plan](/zh-CN/providers/glm)。
</Warning>

OpenClaw 还将 Anthropic setup-token 作为受支持的 token-auth 路径暴露出来，但现在在可用时会优先使用 Claude CLI 复用和 `claude -p`。

## Anthropic Claude CLI 迁移

OpenClaw 再次支持 Anthropic Claude CLI 复用。如果你在主机上已经有本地
Claude 登录，新手引导/配置可以直接复用它。

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程由 `@mariozechner/pi-ai` 实现，并接入到向导/命令中。

### Anthropic setup-token

流程形态：

1. 从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将生成的 Anthropic 凭证存储到一个认证 profile 中
3. 模型选择保持为 `anthropic/...`
4. 现有的 Anthropic 认证 profiles 仍可用于回滚/顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 已明确支持在 Codex CLI 之外的环境中使用，包括 OpenClaw 工作流。

流程形态（PKCE）：

1. 生成 PKCE verifier/challenge 和随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果无法绑定回调（或者你是远程/无头环境），则粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 进行交换
6. 从 access token 中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径为 `openclaw onboard` → 认证选择 `openai-codex`。

## 刷新与过期

Profiles 会存储一个 `expires` 时间戳。

在运行时：

- 如果 `expires` 仍在未来 → 使用已存储的 access token
- 如果已过期 → 在文件锁保护下刷新，并覆盖已存储凭证
- 例外：复用的外部 CLI 凭证仍由外部管理；OpenClaw
  会重新读取 CLI 认证存储，并且绝不会自己消耗复制过来的 refresh token

刷新流程是自动的；通常你不需要手动管理 token。

## 多账户（profiles）+ 路由

有两种模式：

### 1）推荐：分离的智能体

如果你希望“个人”和“工作”永不互相影响，请使用隔离的智能体（独立的会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后为每个智能体配置认证（通过向导），并将聊天路由到正确的智能体。

### 2）高级：单个智能体中的多个 profile

`auth-profiles.json` 支持同一提供商的多个 profile ID。

选择使用哪个 profile：

- 全局通过配置顺序（`auth.order`）
- 按会话通过 `/model ...@<profileId>`

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看现有的 profile ID：

- `openclaw channels list --json`（会显示 `auth[]`）

相关文档：

- [/concepts/model-failover](/zh-CN/concepts/model-failover)（轮换 + 冷却规则）
- [/tools/slash-commands](/zh-CN/tools/slash-commands)（命令表面）

## 相关内容

- [Authentication](/zh-CN/gateway/authentication) —— 模型提供商认证概览
- [Secrets](/zh-CN/gateway/secrets) —— 凭证存储与 SecretRef
- [Configuration Reference](/zh-CN/gateway/configuration-reference#auth-storage) —— 认证配置键
