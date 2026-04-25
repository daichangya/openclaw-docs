---
read_when:
    - 你想端到端地理解 OpenClaw OAuth
    - 你遇到了令牌失效 / 登出问题
    - 你想使用 Claude CLI 或 OAuth 认证流程
    - 你想使用多账号或配置文件路由
summary: OpenClaw 中的 OAuth：令牌交换、存储与多账号模式
title: OAuth
x-i18n:
    generated_at: "2026-04-25T00:54:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fdff0aefba1db86b9fd07abdfc8f2f6f68b22af573c6a3c14f19d1a04d9d555
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw 支持通过 OAuth 使用提供商提供的“订阅认证”
（尤其是 **OpenAI Codex（ChatGPT OAuth）**）。对于 Anthropic，当前实际上的划分
是：

- **Anthropic API key**：正常的 Anthropic API 计费
- **Anthropic Claude CLI / OpenClaw 内的订阅认证**：Anthropic 员工
  告诉我们这种用法现已再次被允许

OpenAI Codex OAuth 已明确支持在 OpenClaw 等外部工具中使用。本文说明：

对于生产环境中的 Anthropic，API key 认证是更安全且推荐的路径。

- OAuth **令牌交换**如何工作（PKCE）
- 令牌**存储**在哪里（以及原因）
- 如何处理**多个账号**（配置文件 + 按会话覆盖）

OpenClaw 还支持自带 OAuth 或 API‑key
流程的**提供商插件**。通过以下命令运行：

```bash
openclaw models auth login --provider <id>
```

## 令牌汇集点（为什么它存在）

OAuth 提供商通常会在登录 / 刷新流程中签发**新的刷新令牌**。某些提供商（或 OAuth 客户端）可能会在为同一用户 / 应用签发新令牌时，使较旧的刷新令牌失效。

实际症状：

- 你通过 OpenClaw _以及_ Claude Code / Codex CLI 登录 → 之后其中一个会随机“被登出”

为减少这种情况，OpenClaw 将 `auth-profiles.json` 视为**令牌汇集点**：

- 运行时从**一个地方**读取凭证
- 我们可以保留多个配置文件并进行确定性路由
- 外部 CLI 复用取决于具体提供商：Codex CLI 可以初始化一个空的
  `openai-codex:default` 配置文件，但一旦 OpenClaw 拥有本地 OAuth 配置文件，
  本地刷新令牌就是规范来源；其他集成仍可保持外部管理，
  并重新读取其 CLI 认证存储

## 存储（令牌存放在哪里）

密钥按**每个智能体**存储：

- 认证配置文件（OAuth + API keys + 可选的值级引用）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版兼容文件：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （发现静态 `api_key` 条目时会被清理）

仅用于旧版导入的文件（仍受支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时会导入到 `auth-profiles.json`）

以上所有路径也都遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/zh-CN/gateway/configuration-reference#auth-storage)

有关静态密钥引用和运行时快照激活行为，请参见 [Secrets Management](/zh-CN/gateway/secrets)。

## Anthropic 旧版令牌兼容性

<Warning>
Anthropic 的公开 Claude Code 文档指出，直接使用 Claude Code 会保持在
Claude 订阅限制范围内，而 Anthropic 员工告诉我们，类似 OpenClaw 的 Claude
CLI 用法现已再次被允许。因此，除非 Anthropic 发布新政策，
否则 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为该集成中被认可的方式。

有关 Anthropic 当前直接使用 Claude Code 的套餐文档，请参见 [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
和 [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他订阅式选项，请参见 [OpenAI
Codex](/zh-CN/providers/openai)、[Qwen Cloud Coding
Plan](/zh-CN/providers/qwen)、[MiniMax Coding Plan](/zh-CN/providers/minimax)
以及 [Z.AI / GLM Coding Plan](/zh-CN/providers/glm)。
</Warning>

OpenClaw 还将 Anthropic setup-token 暴露为受支持的基于令牌的认证路径，但现在在可用时会优先使用 Claude CLI 复用和 `claude -p`。

## Anthropic Claude CLI 迁移

OpenClaw 现已再次支持复用 Anthropic Claude CLI。如果你在主机上已经有本地
Claude 登录，onboarding / configure 可以直接复用它。

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程由 `@mariozechner/pi-ai` 实现，并接入到向导 / 命令中。

### Anthropic setup-token

流程形态：

1. 从 OpenClaw 启动 Anthropic setup-token 或 paste-token
2. OpenClaw 将生成的 Anthropic 凭证存储到认证配置文件中
3. 模型选择保持在 `anthropic/...`
4. 现有的 Anthropic 认证配置文件仍可用于回滚 / 顺序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 已明确支持在 Codex CLI 之外使用，包括 OpenClaw 工作流。

流程形态（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果无法绑定回调（或者你处于远程 / 无头环境），粘贴重定向 URL / code
5. 在 `https://auth.openai.com/oauth/token` 交换
6. 从访问令牌中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径为 `openclaw onboard` → 认证选项 `openai-codex`。

## 刷新 + 过期

配置文件会存储一个 `expires` 时间戳。

在运行时：

- 如果 `expires` 还在未来 → 使用已存储的访问令牌
- 如果已过期 → 刷新（在文件锁保护下）并覆盖已存储的凭证
- 例外：某些外部 CLI 凭证仍由外部管理；OpenClaw
  会重新读取这些 CLI 认证存储，而不是使用复制来的刷新令牌。
  Codex CLI 初始化的范围被有意限制得更窄：它会植入一个空的
  `openai-codex:default` 配置文件，之后由 OpenClaw 拥有的刷新流程保持本地
  配置文件为规范来源。

刷新流程是自动的；通常你不需要手动管理令牌。

## 多个账号（配置文件）+ 路由

有两种模式：

### 1）首选：分离的智能体

如果你希望“个人”和“工作”永不互相影响，请使用隔离的智能体（独立的会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后按每个智能体配置认证（通过向导），并将聊天路由到正确的智能体。

### 2）高级：单个智能体中的多个配置文件

`auth-profiles.json` 支持同一提供商的多个配置文件 ID。

选择使用哪个配置文件：

- 通过配置顺序（`auth.order`）进行全局选择
- 通过 `/model ...@<profileId>` 按会话选择

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看有哪些配置文件 ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [/concepts/model-failover](/zh-CN/concepts/model-failover)（轮换 + 冷却规则）
- [/tools/slash-commands](/zh-CN/tools/slash-commands)（命令界面）

## 相关内容

- [Authentication](/zh-CN/gateway/authentication) —— 模型提供商认证概览
- [Secrets](/zh-CN/gateway/secrets) —— 凭证存储和 SecretRef
- [Configuration Reference](/zh-CN/gateway/configuration-reference#auth-storage) —— 认证配置键
